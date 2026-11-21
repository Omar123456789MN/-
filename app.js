'use strict';
const $ = (s) => document.querySelector(s);
const P = {
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  redo: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
  trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', plus: '<path d="M5 12h14M12 5v14"/>', search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>', spk: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  mem: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18ZM12 5v13"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  lang: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>', sigma: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', list: '<path d="M21 6H3M15 12H3M17 18H3"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>'
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const LOGO = '<svg class="logo" viewBox="0 0 32 20" aria-hidden="true"><path d="M2 18V8a6 6 0 0 1 12 0v10M14 18V8a6 6 0 0 1 12 0v10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
const TOOLS = [
  { id: 'chat', n: 'Chat', d: 'محادثة عامة ومتابعة الأسئلة', i: 'chat' },
  { id: 'research', n: 'AI Research', d: 'بحث وتحليل معمّق (مع بحث الويب عند استخدام Anthropic)', i: 'globe' },
  { id: 'coder', n: 'AI Coder', d: 'كتابة الأكواد وتصحيحها', i: 'code' },
  { id: 'writer', n: 'AI Writer', d: 'مقالات ومحتوى بنبرة تختارها', i: 'edit' },
  { id: 'translator', n: 'AI Translator', d: 'ترجمة دقيقة بين اللغات', i: 'lang' },
  { id: 'math', n: 'AI Math', d: 'حل المسائل خطوة بخطوة', i: 'sigma' },
  { id: 'files', n: 'AI Files', d: 'اسأل عن PDF وDOCX وملفات الأكواد', i: 'file', pick: '.pdf,.docx,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.java,.c,.cpp,.go,.rs,.php,.sql' },
  { id: 'vision', n: 'AI Vision', d: 'فهم الصور والرسوم والنصوص داخلها', i: 'eye', pick: 'image/*' },
  { id: 'voice', n: 'AI Voice', d: 'تحدّث واستمع للإجابة', i: 'mic' },
  { id: 'summarizer', n: 'AI Summarizer', d: 'تلخيص المستندات والنصوص الطويلة', i: 'list' },
  { id: 'planner', n: 'AI Planner', d: 'تحويل الأهداف إلى خطة عمل', i: 'cal' }
];
const ERR = { no_model: 'لا يوجد نموذج ذكاء اصطناعي مُهيّأ على الخادم. أضف مفتاح API في ملف .env ثم أعد التشغيل.', rate: 'عدد الطلبات كبير. انتظر قليلاً ثم أعد المحاولة.', model_error: 'تعذّر الاتصال بالنموذج. لم تُختلق أي إجابة.', net: 'لا يوجد اتصال بالإنترنت أو الخادم.', not_found: 'المحادثة غير موجودة.', server: 'حدث خطأ في الخادم.',
  bad_login: 'البريد أو كلمة المرور غير صحيحة.', exists: 'هذا البريد مسجّل مسبقاً.', invalid: 'تحقق من البريد وكلمة المرور (8 أحرف على الأقل).', signup_closed: 'التسجيل مغلق.', type: 'نوع الملف غير مدعوم.', upload: 'فشل رفع الملف (الحد 8MB).', empty_file: 'لم أجد نصاً داخل الملف.', img_big: 'الصورة كبيرة (الحد 4.5MB).' };
const S = { cur: null, tool: localStorage.mmTool || 'chat', atts: [], busy: false, ctrl: null, signup: false, vlang: 'ar-SA', userEl: null, last: null };
const feed = $('#feed'), list = $('#list'), inp = $('#inp');

async function api(p, o = {}) {
  const r = await fetch(p, { method: o.method || 'GET', headers: o.body ? { 'Content-Type': 'application/json' } : {}, body: o.body ? JSON.stringify(o.body) : undefined });
  if (r.status === 401 && !p.startsWith('/api/login') && !p.startsWith('/api/register')) { showAuth(); throw Object.assign(new Error('auth'), { code: 'auth' }); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'http'), { code: j.error || 'server' });
  return j;
}
let tt; const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); };
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };

// ---------- auth ----------
function showAuth() { $('#app').hidden = true; $('#auth').hidden = false; }
$('#aSwap').onclick = () => { S.signup = !S.signup; $('#aGo').textContent = S.signup ? 'إنشاء حساب' : 'دخول'; $('#aSwap').textContent = S.signup ? 'لديك حساب؟ سجّل الدخول' : 'ليس لديك حساب؟ أنشئ حساباً'; $('#aPass').autocomplete = S.signup ? 'new-password' : 'current-password'; $('#aErr').textContent = ''; };
$('#authF').onsubmit = async (e) => {
  e.preventDefault(); $('#aErr').textContent = '';
  try { await api(S.signup ? '/api/register' : '/api/login', { method: 'POST', body: { email: $('#aEmail').value, password: $('#aPass').value } }); $('#aPass').value = ''; await boot(); }
  catch (x) { $('#aErr').textContent = ERR[x.code] || ERR.net; }
};
$('#out').onclick = async () => { await api('/api/logout', { method: 'POST', body: {} }).catch(() => {}); S.cur = null; showAuth(); };

// ---------- list / conversations ----------
async function loadList() {
  const rows = await api('/api/convs?q=' + encodeURIComponent($('#q').value.trim()));
  const box = $('#convs'); box.textContent = '';
  rows.forEach((c) => {
    const d = el(`<div class="cv${c.id === S.cur ? ' on' : ''}"><button class="t"></button><button class="x ib" aria-label="حذف">${ic('trash')}</button></div>`);
    d.querySelector('.t').textContent = c.title; d.querySelector('.t').onclick = () => openConv(c.id);
    d.querySelector('.x').onclick = async () => { if (!confirm('حذف هذه المحادثة نهائياً؟')) return; await api('/api/convs/' + c.id, { method: 'DELETE' }); if (S.cur === c.id) newChat(); loadList(); };
    box.append(d);
  });
}
let qt; $('#q').oninput = () => { clearTimeout(qt); qt = setTimeout(loadList, 250); };
function newChat() { if (S.busy) return; S.cur = null; list.textContent = ''; $('#home').hidden = false; $('#ttl').textContent = 'MMAI'; closeSide(); loadList(); inp.focus(); }
async function openConv(id) {
  if (S.busy) return; const c = await api('/api/convs/' + id);
  S.cur = id; S.tool = c.tool; setTool(c.tool, true); list.textContent = ''; $('#home').hidden = true; $('#ttl').textContent = c.title;
  c.msgs.forEach(addMsg); refreshFoot(); feed.scrollTop = feed.scrollHeight; closeSide(); loadList();
}
const closeSide = () => $('#app').classList.remove('open');
$('#menu').onclick = () => $('#app').classList.add('open'); $('#scrim').onclick = closeSide; $('#newC').onclick = newChat;

// ---------- rendering ----------
marked.setOptions({ gfm: true, breaks: true });
function html(text) { return DOMPurify.sanitize(marked.parse(text), { USE_PROFILES: { html: true } }); }
function enhance(b) {
  b.querySelectorAll('pre').forEach((pre) => {
    if (pre.parentNode.classList.contains('cb')) return;
    const code = pre.querySelector('code'), lang = (code?.className.match(/language-([\w+#-]+)/) || [])[1] || 'code';
    const w = el(`<div class="cb"><div class="h"><span></span><button>${ic('copy')}<i>نسخ</i></button></div></div>`);
    w.querySelector('span').textContent = lang; pre.replaceWith(w); w.append(pre);
    w.querySelector('button').onclick = (e) => { navigator.clipboard.writeText(pre.innerText); const i = e.currentTarget.querySelector('i'); i.textContent = 'تم النسخ'; setTimeout(() => i.textContent = 'نسخ', 1500); };
  });
  b.querySelectorAll('a').forEach((a) => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
}
function setBody(m, text) { const b = m.querySelector('.b'); if (m.classList.contains('assistant')) { b.innerHTML = html(text); enhance(b); } else b.textContent = text; m._text = text; }
function addMsg(m) {
  const a = m.role === 'assistant', e = el(`<article class="m ${m.role}"><header>${a ? LOGO + '<b>MMAI</b>' : '<b>أنت</b>'}</header><div class="b" dir="auto"></div><footer></footer></article>`);
  if (m.id) e.dataset.id = m.id;
  setBody(e, m.content || '');
  (m.atts || []).forEach((x) => { const t = el(`<div class="att">${ic(x.type === 'image' ? 'eye' : 'file')}<span></span></div>`); t.querySelector('span').textContent = x.name; e.querySelector('.b').prepend(t); });
  const f = e.querySelector('footer'), btn = (i, t, fn) => { const b = el(`<button class="ib" title="${t}" aria-label="${t}">${ic(i)}</button>`); b.onclick = fn; f.append(b); return b; };
  btn('copy', 'نسخ', () => { navigator.clipboard.writeText(e._text); toast('تم النسخ'); });
  if (a) { btn('spk', 'استماع', () => speak(e._text)); btn('redo', 'إعادة التوليد', () => regen()).classList.add('rg'); }
  else btn('edit', 'تعديل', () => editMsg(e));
  list.append(e); return e;
}
function refreshFoot() { const all = [...list.querySelectorAll('.m.assistant')]; all.forEach((x, i) => x.querySelector('.rg') && (x.querySelector('.rg').hidden = i !== all.length - 1 || S.busy)); }
function editMsg(e) {
  const b = e.querySelector('.b'), old = e._text, box = el('<div class="edit"><textarea dir="auto"></textarea><div><button class="pri">حفظ وإرسال</button><button class="lnk">إلغاء</button></div></div>');
  box.querySelector('textarea').value = old; b.replaceChildren(box);
  box.querySelector('.lnk').onclick = () => setBody(e, old);
  box.querySelector('.pri').onclick = () => { const v = box.querySelector('textarea').value.trim(); if (!v) return; const id = e.dataset.id; while (e.nextElementSibling) e.nextElementSibling.remove(); setBody(e, v); run({ content: v, editFromId: id }, e); };
}

// ---------- chat run (streaming) ----------
function setBusy(v) { S.busy = v; const g = $('#go'); g.innerHTML = ic(v ? 'stop' : 'send'); g.classList.toggle('stop', v); g.setAttribute('aria-label', v ? 'إيقاف' : 'إرسال'); refreshFoot(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function run(p, userEl) {
  if (S.busy) return;
  if (!S.cur) { const c = await api('/api/convs', { method: 'POST', body: { tool: S.tool } }); S.cur = c.id; }
  $('#home').hidden = true; S.last = null; setBusy(true); S.ctrl = new AbortController();
  let ael = null, full = '', raf = 0, sawServer = false;
  const paint = () => { raf = 0; setBody(ael, full); if (nearBottom()) feed.scrollTop = feed.scrollHeight; };
  try {
    let r;
    for (let a = 0; a < 3; a++) { // reconnect with backoff when the network fails before the server answers
      try { r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ convId: S.cur, tool: S.tool, ...p }), signal: S.ctrl.signal }); break; }
      catch (e) { if (e.name === 'AbortError') throw e; if (a === 2) throw { code: 'net' }; toast('انقطع الاتصال… إعادة المحاولة'); await sleep(1500 * (a + 1)); }
    }
    if (r.status === 401) { showAuth(); return; }
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw { code: j.error || (r.status === 429 ? 'rate' : 'server') }; }
    sawServer = true; ael = addMsg({ role: 'assistant', content: '' }); ael.classList.add('live'); feed.scrollTop = feed.scrollHeight;
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
    for (;;) {
      const { done, value } = await rd.read(); if (done) break; buf += dec.decode(value, { stream: true }); let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const ch = buf.slice(0, i); buf = buf.slice(i + 2); if (!ch.startsWith('data:')) continue; const e = JSON.parse(ch.slice(5));
        if (e.t === 'meta') { if (e.uid && userEl) userEl.dataset.id = e.uid; }
        else if (e.t === 'd') { full += e.v; if (!raf) raf = requestAnimationFrame(paint); }
        else if (e.t === 'done') { if (e.id) ael.dataset.id = e.id; }
        else if (e.t === 'err') throw { code: e.m };
        else if (e.t === 'mem') memEvent(e);
      }
    }
    cancelAnimationFrame(raf); setBody(ael, full); ael.classList.remove('live');
    if (S.tool === 'voice' && full) speak(full);
    const t = await api('/api/convs/' + S.cur).then((c) => c.title).catch(() => null); if (t) $('#ttl').textContent = t;
  } catch (x) {
    if (ael) { cancelAnimationFrame(raf); setBody(ael, full); ael.classList.remove('live'); if (!full) ael.remove(); }
    if (x.name === 'AbortError') { await syncIds(); }
    else {
      const code = x.code || (navigator.onLine ? 'net' : 'net'), f = el(`<div class="failed"><span></span><button class="pri">إعادة المحاولة</button></div>`);
      f.querySelector('span').textContent = ERR[code] || ERR.server;
      f.querySelector('button').onclick = () => { f.remove(); run(sawServer || p.regenerate ? { regenerate: true } : p, userEl); };
      if (code === 'no_model') f.querySelector('button').remove();
      list.append(f); feed.scrollTop = feed.scrollHeight;
    }
  } finally { setBusy(false); S.ctrl = null; loadList(); }
}
async function syncIds() { if (!S.cur) return; try { const c = await api('/api/convs/' + S.cur), els = [...list.querySelectorAll('.m')]; c.msgs.forEach((m, i) => { if (els[i]) els[i].dataset.id = m.id; }); } catch {} }
const nearBottom = () => feed.scrollHeight - feed.scrollTop - feed.clientHeight < 140;
function regen() { if (S.busy) return; const ms = [...list.querySelectorAll('.m')], last = ms[ms.length - 1]; if (last?.classList.contains('assistant')) last.remove(); run({ regenerate: true }); }
function sendMsg() {
  const text = inp.value.trim(); if ((!text && !S.atts.length) || S.busy) return;
  const atts = S.atts; S.atts = []; renderChips(); inp.value = ''; grow(); localStorage.removeItem('mmDraft');
  const u = addMsg({ role: 'user', content: text, atts: atts.map((a) => ({ type: a.type, name: a.name })) }); feed.scrollTop = feed.scrollHeight;
  run({ content: text, atts }, u);
}
$('#go').onclick = () => (S.busy ? S.ctrl?.abort() : sendMsg());
inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(hover:hover)').matches) { e.preventDefault(); sendMsg(); } });
const grow = () => { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 200) + 'px'; };
inp.addEventListener('input', () => { grow(); localStorage.mmDraft = inp.value; });

// ---------- files ----------
$('#att').onclick = () => { $('#file').accept = $('#file').dataset.def || $('#file').accept; $('#file').click(); };
$('#file').dataset.def = $('#file').accept;
$('#file').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return; if (S.atts.length >= 4) return toast('الحد 4 ملفات لكل رسالة');
  const fd = new FormData(); fd.append('file', f); toast('جارٍ قراءة الملف…');
  try { const r = await fetch('/api/upload', { method: 'POST', body: fd }); const j = await r.json(); if (!r.ok) throw { code: j.error }; S.atts.push(j); renderChips(); toast(j.truncated ? 'قُرئ جزء من الملف (الحد 60 ألف حرف)' : 'تم إرفاق الملف'); if (j.type === 'image' && S.tool === 'chat') setTool('vision'); }
  catch (x) { toast(ERR[x.code] || ERR.upload); }
};
function renderChips() { const c = $('#chips'); c.textContent = ''; S.atts.forEach((a, i) => { const s = el(`<span>${ic(a.type === 'image' ? 'eye' : 'file')}<i></i><button aria-label="إزالة">${ic('x')}</button></span>`); s.querySelector('i').textContent = a.name; s.querySelector('button').onclick = () => { S.atts.splice(i, 1); renderChips(); }; c.append(s); }); }

// ---------- tools ----------
function setTool(id, quiet) { S.tool = id; localStorage.mmTool = id; const t = TOOLS.find((x) => x.id === id) || TOOLS[0]; $('#toolBtn').innerHTML = ic(t.i) + '<span>' + t.n + '</span>'; $('#mic').hidden = !(SR); document.querySelectorAll('.tc').forEach((c) => c.classList.toggle('on', c.dataset.id === id)); }
function toolCard(t) { const c = el(`<button class="tc" data-id="${t.id}"><span class="ico">${ic(t.i)}</span><div><b>${t.n}</b><span>${t.d}</span></div></button>`); c.onclick = () => { $('#dTools').close(); setTool(t.id); if (t.pick) { $('#file').accept = t.pick; $('#file').click(); } if (t.id === 'voice') toast('اضغط زر الميكروفون وتحدّث'); inp.focus(); }; return c; }
TOOLS.forEach((t) => { $('#homeGrid').append(toolCard(t)); $('#toolGrid').append(toolCard(t)); });
$('#toolBtn').onclick = () => $('#dTools').showModal();

// ---------- voice ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition; let rec = null;
$('#mic').onclick = () => {
  if (!SR) return toast('المتصفح لا يدعم التعرف على الصوت'); if (rec) return rec.stop();
  rec = new SR(); rec.lang = S.vlang; rec.interimResults = true; const base = inp.value;
  rec.onresult = (e) => { inp.value = (base ? base + ' ' : '') + [...e.results].map((r) => r[0].transcript).join(''); grow(); };
  rec.onerror = () => toast('تعذّر استخدام الميكروفون'); rec.onend = () => { rec = null; $('#mic').classList.remove('on'); if (S.tool === 'voice' && inp.value.trim()) sendMsg(); };
  rec.start(); $('#mic').classList.add('on');
};
$('#vl').onclick = () => { S.vlang = S.vlang === 'ar-SA' ? 'en-US' : 'ar-SA'; $('#vl').textContent = S.vlang === 'ar-SA' ? 'ع' : 'EN'; };
function speak(t) { if (!window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/```[\s\S]*?```/g, ' ').replace(/[#*_`>|]/g, ' ')); u.lang = /[\u0600-\u06FF]/.test(t) ? 'ar-SA' : 'en-US'; speechSynthesis.speak(u); }

// ---------- memory ----------
async function memLoad() { const rows = await api('/api/memory'), ul = $('#memL'); ul.textContent = ''; if (!rows.length) ul.append(el('<li><span>لا توجد معلومات محفوظة بعد. قل لـ MMAI: تذكّر أن…</span></li>'));
  rows.forEach((m) => { const li = el(`<li><span></span><button class="ib" type="button" aria-label="تعديل">${ic('edit')}</button><button class="ib" type="button" aria-label="حذف">${ic('trash')}</button></li>`); li.querySelector('span').textContent = m.text; const [b1, b2] = li.querySelectorAll('button');
    b1.onclick = async () => { const v = prompt('تعديل المعلومة', m.text); if (v && v.trim()) { await api('/api/memory/' + m.id, { method: 'PUT', body: { text: v } }); memLoad(); } };
    b2.onclick = async () => { await api('/api/memory/' + m.id, { method: 'DELETE' }); memLoad(); }; ul.append(li); }); }
$('#memB').onclick = () => { closeSide(); memLoad(); $('#dMem').showModal(); };
$('#memAdd').onclick = async () => { const v = $('#memI').value.trim(); if (!v) return; await api('/api/memory', { method: 'POST', body: { text: v } }); $('#memI').value = ''; memLoad(); };
async function memEvent(e) {
  if (e.saved) toast(e.saved.updated ? 'تم تحديث الذاكرة' : 'تم الحفظ في الذاكرة');
  else if (e.pending && confirm('هذه المعلومة قد تكون حساسة:\n\n«' + e.pending.text + '»\n\nهل توافق على حفظها في ذاكرتك؟')) {
    if (e.pending.replace_id) await api('/api/memory/' + e.pending.replace_id, { method: 'PUT', body: { text: e.pending.text } }); else await api('/api/memory', { method: 'POST', body: { text: e.pending.text } }); toast('تم الحفظ في الذاكرة'); }
}

// ---------- theme / boot ----------
function theme(t) { document.documentElement.dataset.theme = t; localStorage.mmTheme = t; document.querySelector('meta[name=theme-color]').content = t === 'light' ? '#eef3f1' : '#0b1519'; $('#theme').innerHTML = ic('sun') + (t === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'); }
$('#theme').onclick = () => theme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
async function boot() {
  try { const me = await api('/api/me'); $('#who').textContent = me.email; } catch { return showAuth(); }
  $('#auth').hidden = true; $('#app').hidden = false;
  const h = await fetch('/api/health').then((r) => r.json()).catch(() => ({}));
  const b = $('#banner'); b.hidden = !!h.model; if (!h.model) b.textContent = ERR.no_model;
  setTool(S.tool); inp.value = localStorage.mmDraft || ''; grow(); loadList();
}
window.addEventListener('offline', () => toast('أنت غير متصل بالإنترنت')); window.addEventListener('online', () => toast('عاد الاتصال'));
$('#authLogo').innerHTML = LOGO + 'MMAI'; $('#sideLogo').innerHTML = LOGO + 'MMAI'; $('#homeLogo').innerHTML = LOGO.replace('class="logo"', 'class="logo"');
$('#icS').innerHTML = ic('search'); $('#menu').innerHTML = ic('menu'); $('#att').innerHTML = ic('clip'); $('#mic').innerHTML = ic('mic'); $('#go').innerHTML = ic('send'); $('#newC').innerHTML = ic('plus') + 'محادثة جديدة'; $('#memB').innerHTML = ic('mem') + 'ذاكرتي'; $('#out').innerHTML = ic('out') + 'تسجيل الخروج';
theme(localStorage.mmTheme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
boot();
