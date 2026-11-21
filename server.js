import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import mammoth from 'mammoth';
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const E = process.env;

if (!E.JWT_SECRET || E.JWT_SECRET.length < 32) { console.error('JWT_SECRET (32+ chars) is required in .env'); process.exit(1); }
const PROVIDER = (E.PROVIDER || 'anthropic').toLowerCase();
const CFG = {
  anthropic: { key: E.ANTHROPIC_API_KEY, model: E.ANTHROPIC_MODEL || 'claude-sonnet-5-5' },
  openai: { key: E.OPENAI_API_KEY, model: E.OPENAI_MODEL || 'gpt-4o', base: (E.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '') }
}[PROVIDER];
if (!CFG) { console.error('PROVIDER must be anthropic or openai'); process.exit(1); }
if (!CFG.key) console.warn('[MMAI] No API key configured: chat will return a clear "no model" error.');

// ---------- database ----------
const db = new Database(E.DB_PATH || 'mmai.db');
db.pragma('journal_mode = WAL'); db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS convs(id INTEGER PRIMARY KEY, uid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, tool TEXT NOT NULL DEFAULT 'chat', updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS msgs(id INTEGER PRIMARY KEY, cid INTEGER NOT NULL REFERENCES convs(id) ON DELETE CASCADE, role TEXT NOT NULL, content TEXT NOT NULL, atts TEXT, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS mem(id INTEGER PRIMARY KEY, uid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, updated INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS i_msgs ON msgs(cid); CREATE INDEX IF NOT EXISTS i_convs ON convs(uid, updated);`);
const Q = (s) => db.prepare(s);

// ---------- LLM layer (provider-agnostic) ----------
async function* sse(res) {
  const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '';
  for (;;) {
    const { done, value } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true }); let i;
    while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (l.startsWith('data:')) yield l.slice(5).trim(); }
  }
}
// messages: [{role, text, imgs:[{mime,data}]}]
async function* streamLLM({ system, messages, signal, search = false }) {
  if (PROVIDER === 'anthropic') {
    const body = { model: CFG.model, max_tokens: 4096, stream: true, system, messages: messages.map(m => ({ role: m.role, content: [...m.imgs.map(i => ({ type: 'image', source: { type: 'base64', media_type: i.mime, data: i.data } })), { type: 'text', text: m.text || '.' }] })) };
    if (search) body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', signal, headers: { 'content-type': 'application/json', 'x-api-key': CFG.key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('upstream ' + r.status + ' ' + (await r.text()).slice(0, 300));
    for await (const d of sse(r)) { let j; try { j = JSON.parse(d); } catch { continue; }
      if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta') yield j.delta.text;
      else if (j.type === 'error') throw new Error(j.error?.message || 'stream error'); }
  } else {
    const body = { model: CFG.model, stream: true, messages: [{ role: 'system', content: system }, ...messages.map(m => ({ role: m.role, content: m.imgs.length ? [{ type: 'text', text: m.text || '.' }, ...m.imgs.map(i => ({ type: 'image_url', image_url: { url: `data:${i.mime};base64,${i.data}` } }))] : (m.text || '.') }))] };
    const r = await fetch(CFG.base + '/chat/completions', { method: 'POST', signal, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + CFG.key }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('upstream ' + r.status + ' ' + (await r.text()).slice(0, 300));
    for await (const d of sse(r)) { if (d === '[DONE]') return; let j; try { j = JSON.parse(d); } catch { continue; } const t = j.choices?.[0]?.delta?.content; if (t) yield t; }
  }
}
async function complete(system, text) { let o = ''; for await (const d of streamLLM({ system, messages: [{ role: 'user', text, imgs: [] }] })) o += d; return o; }

const BASE = `You are MMAI, a capable, honest AI assistant. Reply in the language the user writes in (Arabic or English). Reason step by step on hard problems, be precise, and say so when you are unsure instead of guessing. Use Markdown; put code in fenced blocks with a language tag. Never claim abilities you do not have.`;
const TOOLS = {
  chat: '',
  research: 'Mode: AI Research. Investigate the question thoroughly, compare viewpoints, separate facts from inference, and structure the answer with a short summary, key findings, and caveats. Cite sources when you used web search.',
  coder: 'Mode: AI Coder. Write correct, idiomatic, runnable code. When debugging, identify the root cause first, then give the fix. Explain briefly; keep code complete.',
  writer: 'Mode: AI Writer. Write polished articles and content in the requested tone and length. Ask for missing essentials only if the request is unusable without them.',
  translator: 'Mode: AI Translator. Translate faithfully and naturally, preserving tone, formatting and terminology. If the target language is not specified, translate Arabic to English and anything else to Arabic. Output the translation first; add notes only when meaning is ambiguous.',
  math: 'Mode: AI Math. Solve step by step, show the working, double-check arithmetic, and state the final answer clearly. Use LaTeX-free plain notation.',
  files: 'Mode: AI Files. The user attaches documents. Answer only from the attached content, quote or point to relevant parts, and say clearly when the file does not contain the answer.',
  vision: 'Mode: AI Vision. Describe and analyze attached images carefully: text in them, objects, layout, charts. Say what is unclear instead of guessing.',
  voice: 'Mode: AI Voice. Your answer will be read aloud: use short, natural spoken sentences, no tables, no code blocks, no markdown symbols.',
  summarizer: 'Mode: AI Summarizer. Summarize the given text or documents faithfully: a one-line gist, then key points, then any decisions or action items. Do not add facts that are not in the source.',
  planner: 'Mode: AI Planner. Turn goals into an actionable plan: clear steps, priorities, realistic time estimates, dependencies, and a first action to take today.'
};

// ---------- app ----------
const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ['https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"] } } }));
app.use(express.json({ limit: '30mb' }));
app.use(cookieParser());
app.use((req, res, next) => { // CSRF defence in depth (cookie is SameSite=Strict too)
  if (req.method !== 'GET' && req.headers.origin) { try { if (new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({ error: 'forbidden' }); } catch { return res.status(403).json({ error: 'forbidden' }); } }
  next();
});
const lim = (windowMs, max, key) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, keyGenerator: key, validate: false, message: { error: 'rate' } });
app.use('/api', lim(60e3, 200));
const authLim = lim(15 * 60e3, 15), chatLim = lim(60e3, 20, (r) => 'u' + r.uid), upLim = lim(60e3, 15, (r) => 'u' + r.uid);

const cookieOpts = { httpOnly: true, sameSite: 'strict', secure: E.COOKIE_SECURE === 'true', maxAge: 7 * 864e5 };
const issue = (res, id) => res.cookie('mm', jwt.sign({ id }, E.JWT_SECRET, { expiresIn: '7d' }), cookieOpts);
function auth(req, res, next) {
  try { const { id } = jwt.verify(req.cookies.mm, E.JWT_SECRET); if (!Q('SELECT 1 FROM users WHERE id=?').get(id)) throw 0; req.uid = id; next(); }
  catch { res.status(401).json({ error: 'auth' }); }
}
const wrap = (f) => (req, res, next) => Promise.resolve(f(req, res, next)).catch((e) => { console.error(e.message); if (!res.headersSent) res.status(500).json({ error: 'server' }); });

app.get('/api/health', (req, res) => res.json({ model: !!CFG.key, provider: PROVIDER }));
app.post('/api/register', authLim, wrap(async (req, res) => {
  if (E.ALLOW_SIGNUP === 'false') return res.status(403).json({ error: 'signup_closed' });
  const email = String(req.body?.email || '').trim().toLowerCase(), pw = String(req.body?.password || '');
  if (!/^[^@\s]{1,64}@[^@\s]{1,255}$/.test(email) || pw.length < 8 || pw.length > 200) return res.status(400).json({ error: 'invalid' });
  if (Q('SELECT 1 FROM users WHERE email=?').get(email)) return res.status(409).json({ error: 'exists' });
  const id = Q('INSERT INTO users(email,hash,created) VALUES(?,?,?)').run(email, await bcrypt.hash(pw, 12), Date.now()).lastInsertRowid;
  issue(res, id); res.json({ email });
}));
app.post('/api/login', authLim, wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase(), u = Q('SELECT * FROM users WHERE email=?').get(email);
  const ok = await bcrypt.compare(String(req.body?.password || ''), u?.hash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi');
  if (!u || !ok) return res.status(401).json({ error: 'bad_login' });
  issue(res, u.id); res.json({ email });
}));
app.post('/api/logout', (req, res) => { res.clearCookie('mm', cookieOpts); res.json({ ok: 1 }); });
app.get('/api/me', auth, (req, res) => res.json({ email: Q('SELECT email FROM users WHERE id=?').get(req.uid).email }));

// conversations
app.get('/api/convs', auth, (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  if (!q) return res.json(Q('SELECT id,title,tool,updated FROM convs WHERE uid=? ORDER BY updated DESC LIMIT 200').all(req.uid));
  const like = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
  res.json(Q(`SELECT DISTINCT c.id,c.title,c.tool,c.updated FROM convs c LEFT JOIN msgs m ON m.cid=c.id WHERE c.uid=? AND (c.title LIKE ? ESCAPE '\\' OR m.content LIKE ? ESCAPE '\\') ORDER BY c.updated DESC LIMIT 100`).all(req.uid, like, like));
});
app.post('/api/convs', auth, (req, res) => {
  const tool = TOOLS[req.body?.tool] !== undefined ? req.body.tool : 'chat';
  res.json({ id: Q('INSERT INTO convs(uid,title,tool,updated) VALUES(?,?,?,?)').run(req.uid, 'محادثة جديدة', tool, Date.now()).lastInsertRowid, tool });
});
const own = (req) => Q('SELECT * FROM convs WHERE id=? AND uid=?').get(+req.params.id, req.uid);
app.get('/api/convs/:id', auth, (req, res) => {
  const c = own(req); if (!c) return res.status(404).json({ error: 'not_found' });
  const msgs = Q('SELECT id,role,content,atts FROM msgs WHERE cid=? ORDER BY id').all(c.id).map(m => ({ ...m, atts: (m.atts ? JSON.parse(m.atts) : []).map(a => ({ type: a.type, name: a.name })) }));
  res.json({ ...c, msgs });
});
app.patch('/api/convs/:id', auth, (req, res) => { const c = own(req); if (!c) return res.status(404).json({ error: 'not_found' }); Q('UPDATE convs SET title=? WHERE id=?').run(String(req.body?.title || '').slice(0, 80) || c.title, c.id); res.json({ ok: 1 }); });
app.delete('/api/convs/:id', auth, (req, res) => { const c = own(req); if (!c) return res.status(404).json({ error: 'not_found' }); Q('DELETE FROM convs WHERE id=?').run(c.id); res.json({ ok: 1 }); });

// memory
app.get('/api/memory', auth, (req, res) => res.json(Q('SELECT id,text FROM mem WHERE uid=? ORDER BY id DESC').all(req.uid)));
app.post('/api/memory', auth, (req, res) => { const t = String(req.body?.text || '').trim().slice(0, 500); if (!t) return res.status(400).json({ error: 'empty' }); res.json({ id: Q('INSERT INTO mem(uid,text,updated) VALUES(?,?,?)').run(req.uid, t, Date.now()).lastInsertRowid, text: t }); });
app.put('/api/memory/:id', auth, (req, res) => { const t = String(req.body?.text || '').trim().slice(0, 500); if (!t) return res.status(400).json({ error: 'empty' }); Q('UPDATE mem SET text=?,updated=? WHERE id=? AND uid=?').run(t, Date.now(), +req.params.id, req.uid); res.json({ ok: 1 }); });
app.delete('/api/memory/:id', auth, (req, res) => { Q('DELETE FROM mem WHERE id=? AND uid=?').run(+req.params.id, req.uid); res.json({ ok: 1 }); });

// uploads: text is extracted here, images are validated by magic bytes. Files are never written to disk.
const up = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
const TEXTX = new Set(['.txt', '.md', '.csv', '.json', '.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.java', '.c', '.cpp', '.cs', '.go', '.rs', '.php', '.sql', '.sh', '.xml', '.yml', '.yaml', '.kt', '.swift', '.rb', '.log']);
const sig = (b) => b.slice(0, 4).toString('latin1');
const IMG = (b) => b[0] === 0x89 && sig(b).slice(1) === 'PNG' ? 'image/png' : b[0] === 0xff && b[1] === 0xd8 ? 'image/jpeg' : sig(b) === 'GIF8' ? 'image/gif' : sig(b) === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' ? 'image/webp' : null;
app.post('/api/upload', auth, upLim, (req, res) => up.single('file')(req, res, wrap(async (err) => {
  if (err || !req.file) return res.status(400).json({ error: 'upload' });
  const b = req.file.buffer, name = path.basename(req.file.originalname || 'file').slice(0, 80), ext = path.extname(name).toLowerCase();
  const mime = IMG(b); if (mime) return b.length > 4.5e6 ? res.status(413).json({ error: 'img_big' }) : res.json({ type: 'image', name, mime, data: b.toString('base64') });
  let text;
  if (ext === '.pdf' && sig(b) === '%PDF') text = (await pdfParse(b)).text;
  else if (ext === '.docx' && sig(b).startsWith('PK')) text = (await mammoth.extractRawText({ buffer: b })).value;
  else if (TEXTX.has(ext) && !b.includes(0)) text = b.toString('utf8');
  else return res.status(415).json({ error: 'type' });
  text = text.replace(/\u0000/g, '').trim();
  if (!text) return res.status(422).json({ error: 'empty_file' });
  res.json({ type: 'text', name, text: text.slice(0, 60000), truncated: text.length > 60000 });
})));

// chat (streaming)
const MIMES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const cleanAtts = (a) => (Array.isArray(a) ? a.slice(0, 4) : []).map(x => x?.type === 'image' && MIMES.has(x.mime) && typeof x.data === 'string' && x.data.length < 6.5e6 && /^[A-Za-z0-9+/=]+$/.test(x.data) ? { type: 'image', name: String(x.name || '').slice(0, 80), mime: x.mime, data: x.data }
  : x?.type === 'text' && typeof x.text === 'string' ? { type: 'text', name: String(x.name || '').slice(0, 80), text: x.text.slice(0, 60000) } : null).filter(Boolean);
const REMEMBER = /(تذكر|تذكّر|احفظ|لا تنس|remember|keep in mind|don'?t forget|my name is|اسمي)/i;

app.post('/api/chat', auth, chatLim, wrap(async (req, res) => {
  if (!CFG.key) return res.status(503).json({ error: 'no_model' });
  const b = req.body || {}, c = Q('SELECT * FROM convs WHERE id=? AND uid=?').get(+b.convId, req.uid);
  if (!c) return res.status(404).json({ error: 'not_found' });
  const tool = TOOLS[b.tool] !== undefined ? b.tool : 'chat';
  let uidMsg = null, text = '';
  if (b.regenerate) { const l = Q('SELECT id,role FROM msgs WHERE cid=? ORDER BY id DESC LIMIT 1').get(c.id); if (l?.role === 'assistant') Q('DELETE FROM msgs WHERE id=?').run(l.id); }
  else {
    text = String(b.content || '').slice(0, 20000).trim(); const atts = cleanAtts(b.atts);
    if (!text && !atts.length) return res.status(400).json({ error: 'empty' });
    if (b.editFromId) Q('DELETE FROM msgs WHERE cid=? AND id>=?').run(c.id, +b.editFromId);
    uidMsg = Q('INSERT INTO msgs(cid,role,content,atts,created) VALUES(?,?,?,?,?)').run(c.id, 'user', text, atts.length ? JSON.stringify(atts) : null, Date.now()).lastInsertRowid;
    if (Q('SELECT COUNT(*) n FROM msgs WHERE cid=?').get(c.id).n === 1) Q('UPDATE convs SET title=? WHERE id=?').run((text || atts[0].name || 'ملف').slice(0, 48), c.id);
  }
  Q('UPDATE convs SET tool=?,updated=? WHERE id=?').run(tool, Date.now(), c.id);

  // history: newest first within a character budget; images only for the 2 latest user turns
  const rows = Q('SELECT id,role,content,atts FROM msgs WHERE cid=? ORDER BY id DESC LIMIT 60').all(c.id);
  let budget = 150000, imgLeft = 2; const hist = [];
  for (const m of rows) {
    const atts = m.atts ? JSON.parse(m.atts) : []; let t = m.content, imgs = [];
    for (const a of atts) { if (a.type === 'text') t += `\n\n[ملف: ${a.name}]\n${a.text}`; else if (imgLeft > 0) imgs.push({ mime: a.mime, data: a.data }); else t += `\n[صورة: ${a.name}]`; }
    if (m.role === 'user' && imgs.length) imgLeft--;
    budget -= t.length; if (budget < 0 && hist.length) break; hist.unshift({ role: m.role, text: t, imgs });
  }
  while (hist.length && hist[0].role !== 'user') hist.shift();
  const mems = Q('SELECT id,text FROM mem WHERE uid=? ORDER BY id').all(req.uid);
  const system = [BASE, mems.length ? 'Facts the user asked you to remember (use only when relevant):\n' + mems.map(m => '- ' + m.text).join('\n') : '', TOOLS[tool], 'Today: ' + new Date().toISOString().slice(0, 10)].filter(Boolean).join('\n\n');

  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  const send = (o) => { if (!res.writableEnded) res.write(`data: ${JSON.stringify(o)}\n\n`); };
  send({ t: 'meta', uid: uidMsg });
  const ac = new AbortController(); res.on('close', () => { if (!res.writableEnded) ac.abort(); });
  let full = '', failed = false;
  for (let attempt = 0; attempt < 2; attempt++) { // one automatic retry if the upstream fails before any output
    try { for await (const d of streamLLM({ system, messages: hist, signal: ac.signal, search: tool === 'research' && PROVIDER === 'anthropic' })) { full += d; send({ t: 'd', v: d }); } failed = false; break; }
    catch (e) { if (ac.signal.aborted) break; failed = true; console.error('[llm]', e.message); if (full) break; }
  }
  let aid = null;
  if (full.trim()) aid = Q('INSERT INTO msgs(cid,role,content,created) VALUES(?,?,?,?)').run(c.id, 'assistant', full, Date.now()).lastInsertRowid;
  if (failed) send({ t: 'err', m: 'model_error' }); else send({ t: 'done', id: aid });

  // memory: only when the user explicitly asked to remember something; sensitive facts need confirmation
  if (!failed && !ac.signal.aborted && text && REMEMBER.test(text)) {
    try {
      const sys = 'Extract ONE short fact the user explicitly asked you to remember, written in the user\'s language. Reply with ONLY JSON: {"text":string|null,"sensitive":boolean,"replace_id":number|null}. sensitive=true for passwords, ID/passport numbers, payment cards, bank details, medical/health data, exact home address, or secrets. replace_id = id of an existing memory the new fact updates/contradicts, else null. text=null if there is nothing to remember.';
      const out = await complete(sys, `Existing memories:\n${mems.map(m => `${m.id}: ${m.text}`).join('\n') || '(none)'}\n\nUser message:\n${text}`);
      const j = JSON.parse(out.match(/\{[\s\S]*\}/)?.[0] || 'null');
      if (j?.text && typeof j.text === 'string') {
        const t = j.text.slice(0, 500);
        if (j.sensitive) send({ t: 'mem', pending: { text: t, replace_id: j.replace_id ?? null } });
        else if (j.replace_id && mems.some(m => m.id === j.replace_id)) { Q('UPDATE mem SET text=?,updated=? WHERE id=? AND uid=?').run(t, Date.now(), j.replace_id, req.uid); send({ t: 'mem', saved: { text: t, updated: true } }); }
        else { Q('INSERT INTO mem(uid,text,updated) VALUES(?,?,?)').run(req.uid, t, Date.now()); send({ t: 'mem', saved: { text: t } }); }
      }
    } catch (e) { console.error('[mem]', e.message); }
  }
  res.end();
}));

const ROOT = path.dirname(fileURLToPath(import.meta.url));
for (const f of ['app.css', 'app.js']) app.get('/' + f, (req, res) => res.sendFile(path.join(ROOT, f)));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));
app.use((err, req, res, next) => { console.error(err.message); res.status(err.status === 400 ? 400 : 500).json({ error: 'server' }); });
app.listen(+E.PORT || 3000, () => console.log(`MMAI running on :${E.PORT || 3000} (provider=${PROVIDER}, model=${CFG.model})`));
