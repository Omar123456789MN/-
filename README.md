# MMAI — منصة ذكاء اصطناعي حقيقية

واجهة ويب + خادم Node.js + قاعدة SQLite + اتصال فعلي بنموذج لغوي. لا توجد أي ردود محفوظة أو محاكاة: إذا لم يُضبط نموذج أو انقطع الاتصال تظهر رسالة خطأ واضحة.

## التشغيل المحلي
```bash
npm install
cp .env.example .env      # ثم املأ JWT_SECRET ومفتاح المزوّد
npm start                 # http://localhost:3000
```
- `JWT_SECRET`: `openssl rand -hex 32`
- مزوّد Anthropic: `PROVIDER=anthropic` + `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL`
- مزوّد OpenAI أو أي خدمة متوافقة (OpenRouter, Groq, Ollama…): `PROVIDER=openai` + `OPENAI_API_KEY` + `OPENAI_MODEL` + `OPENAI_BASE_URL`
- تبديل النموذج = تعديل `.env` وإعادة تشغيل الخادم، دون تغيير الكود.
- بعد إنشاء حسابك اجعل `ALLOW_SIGNUP=false` إن لم ترد تسجيل آخرين.

## النشر
**Docker:** `docker build -t mmai . && docker run -d -p 3000:3000 --env-file .env -v mmai-data:/data -e DB_PATH=/data/mmai.db mmai`
**Render / Railway / Fly.io:** ارفع المشروع، أمر التشغيل `npm start`، أضف متغيرات `.env` من لوحة الخدمة، وأضف قرصاً دائماً (Persistent Disk) واجعل `DB_PATH` يشير إليه.
**عند النشر على HTTPS:** اجعل `COOKIE_SECURE=true`. خلف وكيل عكسي (Nginx/Cloudflare) يكفي تمرير الطلبات؛ الخادم يثق بالوكيل الأول.

## الاسم الخاص والـ APK
- اربط دومينك أو اسم الخدمة (مثلاً `saomegg-gamer.onrender.com`) من لوحة الاستضافة.
- لـ APK: بعد النشر على HTTPS استخدم PWABuilder.com أو Capacitor لتغليف الرابط.

## البنية
- `server.js`: المصادقة (JWT في كوكي httpOnly + SameSite=Strict)، المحادثات، الذاكرة، رفع الملفات، البث (SSE)، طبقة النموذج.
- `index.html` و`app.css` و`app.js`: الواجهة (بدون بناء)، كلها في المجلد الرئيسي.
- الأدوات العشر: كل أداة تعليمات نظام مخصصة في `TOOLS` داخل `server.js` وتعمل بنفس النموذج الحقيقي. AI Research يستخدم بحث الويب الأصلي مع Anthropic فقط.

## الأمان
مفاتيح API في الخادم فقط • bcrypt لكلمات المرور • تحديد معدل عام ولكل مستخدم • Helmet + CSP صارم • فحص Origin • الملفات لا تُحفظ على القرص، تُستخرج نصوصها وتُفحص توقيعاتها • تنقية Markdown بـ DOMPurify • أخطاء الخادم لا تكشف تفاصيل داخلية.

## حدود معروفة
- المحادثة الصوتية تعتمد على التعرف الصوتي ونطق المتصفح (Chrome/Safari)، وليست نموذج صوت أصلياً.
- الذاكرة تُستخرج بالنموذج عند طلب المستخدم صراحةً (تذكّر/احفظ/remember)؛ المعلومات الحساسة تطلب موافقتك.
- لا تلخيص تلقائي لسجل المحادثات الطويل جداً؛ يُرسل آخر ~150 ألف حرف.
