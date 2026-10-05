# فذَكِّر — نسخة المشروع المفكوكة

تحويل `Fadhakkir_App.html` (ملف واحد بحجم ~15.9 MB) إلى مشروع ويب عادي
بملفات منفصلة، **من دون أي تغيير في الشكل أو الأبعاد أو طريقة العرض**.
نفس الوسوم، نفس الأنماط، نفس المنطق، نفس الصور والخطوط بالبايت ذاته.

## التشغيل

```bash
python3 serve.py        # ثم افتح http://localhost:8000
```

أو افتح `index.html` مباشرةً بالنقر المزدوج (يعمل أيضًا على `file://`).

## البنية

```
Fadhakkir/
├── index.html                    قالب الواجهة (x-dc) + وسم التشغيل
├── css/
│   ├── fonts.css                 تعريفات @font-face لكل الخطوط
│   └── app.css                   أنماط الصفحة والحركات (keyframes)
├── js/
│   ├── vendor/
│   │   ├── react.production.min.js        React 18.3.1 (نسخة محلية)
│   │   └── react-dom.production.min.js
│   ├── dc-runtime.js             محرّك المكوّنات الذي يشغّل القالب
│   ├── resources.js              جدول مسارات المكوّنات
│   ├── muzn-data.js              كل البيانات (سور، أذكار، أحاديث، مساجد…)
│   └── app.js                    منطق التطبيق كاملاً (class Component)
├── components/
│   ├── HeroCard.dc.html          مكوّن بطاقة الهيرو (قالب + منطق)
│   └── HeroCard.offline.js       نسخة مولَّدة تلقائيًا لوضع file://
├── images/                       21 صورة (مساجد، صفحات مصحف، شعارات)
├── fonts/                        42 ملف خط (IBM Plex / Amiri / عثمان طه)
├── sounds/                       فارغ — لا صوت في الملف الأصلي
├── tools/sync-offline.py         يعيد توليد HeroCard.offline.js
└── serve.py                      خادم محلي بسيط
```

## أين تعدّل؟

| تريد تعديل | الملف |
|---|---|
| ترتيب الشاشات والوسوم | `index.html` (داخل `<x-dc>`) |
| المنطق، الحالة، التنقّل | `js/app.js` |
| النصوص والبيانات | `js/muzn-data.js` |
| بطاقة الهيرو | `components/HeroCard.dc.html` |
| الألوان والحركات | `css/app.css` |

## ملاحظات

- لا شيء يُحمَّل من الإنترنت: React ومحرّك المكوّنات والخطوط كلها محلية.
- بعد أي تعديل على `components/HeroCard.dc.html` شغّل
  `python3 tools/sync-offline.py` ليبقى وضع `file://` متطابقًا.
- `js/muzn-data.js` كان ES module؛ صار سكربتًا عاديًا يضع البيانات في
  `window.MuznData` (و`window.__MUZN_DATA`) حتى يعمل بلا خادم. المحتوى نفسه
  حرفيًا بلا تغيير.
- التطبيق يطلب مواقيت الصلاة والطقس من `api.aladhan.com` و
  `open-meteo.com` عند توفّر الإنترنت — كما في الأصل تمامًا؛ وبدونه يعمل
  على المواقيت المخزّنة في `muzn-data.js`.
