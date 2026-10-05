// muzn-data.js — بيانات التطبيق. نسخة سكربت عادي (بدون ES modules)
// تُقرأ من window.MuznData في js/app.js
(function () {
"use strict";

// المواقيت نموذجية لمكة المكرمة (تموز/يوليو)

const LOCATION = { ar: "مكة المكرمة، السعودية", en: "Makkah, Saudi Arabia" };

const PRAYER_TIMES = {
  fajr:    { h: 4,  m: 15 },
  sunrise: { h: 5,  m: 41 },
  dhuhr:   { h: 12, m: 26 },
  asr:     { h: 15, m: 42 },
  maghrib: { h: 19, m: 7  },
  isha:    { h: 20, m: 37 },
};

const PRAYER_META = [
  { key: "fajr",    ar: "الفجر",   en: "Fajr",    icon: "fajr"    },
  { key: "sunrise", ar: "الشروق",  en: "Sunrise", icon: "sunrise" },
  { key: "dhuhr",   ar: "الظهر",   en: "Dhuhr",   icon: "dhuhr"   },
  { key: "asr",     ar: "العصر",   en: "Asr",     icon: "asr"     },
  { key: "maghrib", ar: "المغرب",  en: "Maghrib", icon: "maghrib" },
  { key: "isha",    ar: "العشاء",  en: "Isha",    icon: "isha"    },
];

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function arDigits(x) { return String(x).replace(/[0-9]/g, d => AR_DIGITS[+d]); }
function pad2(n) { return String(n).padStart(2, "0"); }

function fmt12(t, lang) {
  let h = t.h % 12; if (h === 0) h = 12;
  const s = pad2(h) + ":" + pad2(t.m);
  return s;
}
function ampm(t, lang) {
  return t.h < 12 ? (lang === "en" ? "AM" : "ص") : (lang === "en" ? "PM" : "م");
}
function toMin(t) { return t.h * 60 + t.m; }

// حالة الصلاة الآن: الحالية، القادمة، المتبقي، موضع الشمس
function getPrayerState(now, PT = PRAYER_TIMES) {
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const order = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
  let nextKey = null;
  for (const k of order) { if (toMin(PT[k]) > nowMin) { nextKey = k; break; } }
  const wrapped = !nextKey; if (!nextKey) nextKey = "fajr";
  // الفترة الحالية = آخر وقت بدأ
  let currentKey = "isha";
  for (const k of order) { if (toMin(PT[k]) <= nowMin) currentKey = k; }
  if (nowMin < toMin(PT.fajr)) currentKey = "isha";
  // الفترة المعروضة كسماء: الشروق يُعرض كصباح (فجر متأخر)
  const nextMin = toMin(PT[nextKey]) + (wrapped ? 1440 : 0);
  const remaining = Math.max(0, Math.round((nextMin - nowMin) * 60)); // بالثواني
  const sr = toMin(PT.sunrise), ss = toMin(PT.maghrib);
  const sunFrac = Math.min(1, Math.max(0, (nowMin - sr) / (ss - sr)));
  return { currentKey, nextKey, remaining, sunFrac, nowMin };
}

function fmtCountdown(sec, lang) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  const str = pad2(h) + ":" + pad2(m) + ":" + pad2(s);
  return str;
}

function hijriDate(d, lang) {
  try {
    return new Intl.DateTimeFormat(lang === "en" ? "en-u-ca-islamic-umalqura" : "ar-u-ca-islamic-umalqura-nu-latn",
      { day: "numeric", month: "long", year: "numeric" }).format(d) + (lang === "en" ? " AH" : "");
  } catch (e) { return lang === "en" ? "25 Dhul-Hijjah 1447 AH" : "25 ذو الحجة 1447 هـ"; }
}
function gregDate(d, lang) {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ar-u-nu-latn", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
}

// ————— سور القرآن (١١٤) —————
const S = (n, a, p) => ({ n, a, p }); // name, ayahs, place: m=مكية d=مدنية
const SURAHS = [
  S("الفاتحة",7,"m"),S("البقرة",286,"d"),S("آل عمران",200,"d"),S("النساء",176,"d"),S("المائدة",120,"d"),
  S("الأنعام",165,"m"),S("الأعراف",206,"m"),S("الأنفال",75,"d"),S("التوبة",129,"d"),S("يونس",109,"m"),
  S("هود",123,"m"),S("يوسف",111,"m"),S("الرعد",43,"d"),S("إبراهيم",52,"m"),S("الحجر",99,"m"),
  S("النحل",128,"m"),S("الإسراء",111,"m"),S("الكهف",110,"m"),S("مريم",98,"m"),S("طه",135,"m"),
  S("الأنبياء",112,"m"),S("الحج",78,"d"),S("المؤمنون",118,"m"),S("النور",64,"d"),S("الفرقان",77,"m"),
  S("الشعراء",227,"m"),S("النمل",93,"m"),S("القصص",88,"m"),S("العنكبوت",69,"m"),S("الروم",60,"m"),
  S("لقمان",34,"m"),S("السجدة",30,"m"),S("الأحزاب",73,"d"),S("سبأ",54,"m"),S("فاطر",45,"m"),
  S("يس",83,"m"),S("الصافات",182,"m"),S("ص",88,"m"),S("الزمر",75,"m"),S("غافر",85,"m"),
  S("فصلت",54,"m"),S("الشورى",53,"m"),S("الزخرف",89,"m"),S("الدخان",59,"m"),S("الجاثية",37,"m"),
  S("الأحقاف",35,"m"),S("محمد",38,"d"),S("الفتح",29,"d"),S("الحجرات",18,"d"),S("ق",45,"m"),
  S("الذاريات",60,"m"),S("الطور",49,"m"),S("النجم",62,"m"),S("القمر",55,"m"),S("الرحمن",78,"d"),
  S("الواقعة",96,"m"),S("الحديد",29,"d"),S("المجادلة",22,"d"),S("الحشر",24,"d"),S("الممتحنة",13,"d"),
  S("الصف",14,"d"),S("الجمعة",11,"d"),S("المنافقون",11,"d"),S("التغابن",18,"d"),S("الطلاق",12,"d"),
  S("التحريم",12,"d"),S("الملك",30,"m"),S("القلم",52,"m"),S("الحاقة",52,"m"),S("المعارج",44,"m"),
  S("نوح",28,"m"),S("الجن",28,"m"),S("المزمل",20,"m"),S("المدثر",56,"m"),S("القيامة",40,"m"),
  S("الإنسان",31,"d"),S("المرسلات",50,"m"),S("النبأ",40,"m"),S("النازعات",46,"m"),S("عبس",42,"m"),
  S("التكوير",29,"m"),S("الانفطار",19,"m"),S("المطففين",36,"m"),S("الانشقاق",25,"m"),S("البروج",22,"m"),
  S("الطارق",17,"m"),S("الأعلى",19,"m"),S("الغاشية",26,"m"),S("الفجر",30,"m"),S("البلد",20,"m"),
  S("الشمس",15,"m"),S("الليل",21,"m"),S("الضحى",11,"m"),S("الشرح",8,"m"),S("التين",8,"m"),
  S("العلق",19,"m"),S("القدر",5,"m"),S("البينة",8,"d"),S("الزلزلة",8,"d"),S("العاديات",11,"m"),
  S("القارعة",11,"m"),S("التكاثر",8,"m"),S("العصر",3,"m"),S("الهمزة",9,"m"),S("الفيل",5,"m"),
  S("قريش",4,"m"),S("الماعون",7,"m"),S("الكوثر",3,"m"),S("الكافرون",6,"m"),S("النصر",3,"d"),
  S("المسد",5,"m"),S("الإخلاص",4,"m"),S("الفلق",5,"m"),S("الناس",6,"m"),
];

// صفحات المصحف المصوّرة — لإضافة صفحة: صورتها ومناطق آياتها
// r: [رقم الآية, top%, left%, width%, height%] بالنسبة لأبعاد الصورة
const MUSHAF_IMAGES = {
  1: { img: "images/fatiha-page-t.png", surah: 0, pg: 0, r: [
    [1, 27.09, 31.45, 37.1, 5.48],
    [2, 33.18, 24.61, 50.23, 4.79],
    [3, 39.44, 53.11, 28.11, 4.97],
    [4, 39.44, 17.68, 35.11, 4.97],
    [5, 45.65, 30.34, 51.62, 4.74],
    [6, 45.65, 17.14, 12.77, 4.74],
    [6, 51.45, 47.05, 33.44, 5.25],
    [7, 51.45, 18.78, 27.83, 5.25],
    [7, 58.01, 25.71, 48.04, 4.97],
    [7, 63.93, 35.19, 29.17, 4.85],
  ] },
  2: { img: "images/baqarah-page1-t.png", surah: 1, pg: 0, r: [
    [1, 34.56, 62.98, 12.5, 4.91],
    [2, 34.56, 22.79, 39.74, 4.91],
    [2, 40.42, 65.64, 17.13, 5.02],
    [3, 40.42, 15.95, 49.34, 5.02],
    [3, 46.4, 47.72, 35.96, 4.91],
    [4, 46.4, 15.95, 31.54, 4.91],
    [4, 51.8, 15.95, 66.0, 5.02],
    [5, 57.55, 24.07, 50.87, 5.08],
    [5, 64.27, 34.0, 30.9, 3.64],
  ] },
  3: { img: "images/baqarah-page2-t.png", surah: 1, pg: 1, r: [
    [6, 7.49, 11.48, 76.96, 4.34],
    [6, 13.7, 70.4, 17.76, 4.05],
    [7, 13.7, 11.2, 59.2, 4.05],
    [7, 19.22, 30.28, 58.06, 4.05],
    [8, 19.22, 12.02, 18.27, 4.05],
    [8, 25.09, 11.2, 77.32, 4.16],
    [9, 30.09, 11.66, 76.96, 4.51],
    [9, 36.19, 66.53, 21.81, 4.22],
    [10, 36.19, 12.11, 54.43, 4.22],
    [10, 41.54, 27.72, 60.53, 4.45],
    [11, 41.54, 11.11, 16.62, 4.45],
    [11, 47.34, 23.46, 64.61, 4.28],
    [12, 47.34, 11.11, 12.34, 4.28],
    [12, 53.15, 30.51, 57.56, 4.05],
    [13, 53.15, 11.2, 19.31, 4.05],
    [13, 58.21, 11.29, 76.96, 4.57],
    [13, 64.42, 22.39, 66.13, 4.11],
    [14, 64.42, 11.02, 11.37, 4.11],
    [14, 69.94, 11.75, 76.68, 4.34],
    [14, 75.81, 46.62, 41.73, 4.16],
    [15, 75.81, 10.84, 35.78, 4.16],
    [15, 80.93, 54.52, 33.82, 4.62],
    [16, 80.93, 11.11, 43.41, 4.62],
    [16, 87.14, 11.11, 77.14, 3.93],
  ] },
};

// صفحة بداية كل سورة في مصحف المدينة (٦٠٤ صفحات)
const SURAH_PAGES = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
  603, 604, 604, 604,
];
// صفحة بداية كل جزء
const JUZ_PAGES = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];
const JUZ_START_SURAH = [1,2,2,3,4,4,5,6,7,8,9,11,12,15,17,18,21,23,25,27,29,33,36,39,41,46,51,58,67,78]; // رقم السورة التي يبدأ فيها كل جزء

// ————— أسماء كتب صحيح البخاري (٩٧) وصحيح مسلم (٥٦) بالعربية — بترتيب sunnah.com المعتمد في المصدر —————
const HBOOK_SECTIONS_AR = {
  bukhari: [
    "بدء الوحي","الإيمان","العلم","الوضوء","الغسل","الحيض","التيمم","الصلاة","مواقيت الصلاة","الأذان",
    "الجمعة","صلاة الخوف","العيدين","الوتر","الاستسقاء","الكسوف","سجود القرآن","التقصير","التهجد","فضل الصلاة في مسجد مكة والمدينة",
    "العمل في الصلاة","السهو","الجنائز","الزكاة","الحج","العمرة","المحصر","جزاء الصيد","فضائل المدينة","الصوم",
    "صلاة التراويح","فضل ليلة القدر","الاعتكاف","البيوع","السلم","الشفعة","الإجارة","الحوالات","الكفالة","الوكالة",
    "الحرث والمزارعة","المساقاة","الاستقراض وأداء الديون","الخصومات","اللقطة","المظالم","الشركة","الرهن","العتق","المكاتب",
    "الهبة وفضلها","الشهادات","الصلح","الشروط","الوصايا","الجهاد والسير","فرض الخمس","الجزية والموادعة","بدء الخلق","أحاديث الأنبياء",
    "المناقب","فضائل الصحابة","مناقب الأنصار","المغازي","تفسير القرآن","فضائل القرآن","النكاح","الطلاق","النفقات","الأطعمة",
    "العقيقة","الذبائح والصيد","الأضاحي","الأشربة","المرضى","الطب","اللباس","الأدب","الاستئذان","الدعوات",
    "الرقاق","القدر","الأيمان والنذور","كفارات الأيمان","الفرائض","الحدود","الديات","استتابة المرتدين والمعاندين وقتالهم","الإكراه","الحيل",
    "التعبير","الفتن","الأحكام","التمني","أخبار الآحاد","الاعتصام بالكتاب والسنة","التوحيد"
  ],
  muslim: [
    "الإيمان","الطهارة","الحيض","الصلاة","المساجد ومواضع الصلاة","صلاة المسافرين وقصرها","الجمعة","صلاة العيدين","صلاة الاستسقاء","الكسوف",
    "الجنائز","الزكاة","الصيام","الاعتكاف","الحج","النكاح","الرضاع","الطلاق","اللعان","العتق",
    "البيوع","المساقاة","الفرائض","الهبات","الوصية","النذر","الأيمان","القسامة والمحاربين والقصاص والديات","الحدود","الأقضية",
    "اللقطة","الجهاد والسير","الإمارة","الصيد والذبائح وما يؤكل من الحيوان","الأضاحي","الأشربة","اللباس والزينة","الآداب","السلام","الألفاظ من الأدب وغيرها",
    "الشعر","الرؤيا","الفضائل","فضائل الصحابة","البر والصلة والآداب","القدر","العلم","الذكر والدعاء والتوبة والاستغفار","الرقاق","التوبة",
    "صفات المنافقين وأحكامهم","صفة القيامة والجنة والنار","الجنة وصفة نعيمها وأهلها","الفتن وأشراط الساعة","الزهد والرقائق","التفسير"
  ],
};

// ————— صفحة الفاتحة مع التفسير الميسر (مختصر) —————
const FATIHA = [
  { n: 1, t: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", tf: "أبتدئ قراءتي باسم الله مستعينًا به، الرحمن ذي الرحمة الواسعة، الرحيم بالمؤمنين." },
  { n: 2, t: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", tf: "الثناء على الله بصفاته وأفعاله ونعمه، وهو المالك المدبّر لجميع الخلق." },
  { n: 3, t: "الرَّحْمَٰنِ الرَّحِيمِ", tf: "الذي وسعت رحمته كل شيء، وكتبها للمتقين من عباده." },
  { n: 4, t: "مَالِكِ يَوْمِ الدِّينِ", tf: "المالك المتصرف يوم القيامة، يوم الجزاء والحساب." },
  { n: 5, t: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", tf: "نخصك وحدك بالعبادة، ونستعين بك وحدك في جميع أمورنا." },
  { n: 6, t: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", tf: "دُلَّنا وثبّتنا على الطريق الواضح، وهو الإسلام." },
  { n: 7, t: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", tf: "طريق الذين أنعمت عليهم من النبيين والصدّيقين، غير طريق المغضوب عليهم ولا الضالين." },
];
// ————— الفاتحة: المعاني والقراءات  —————
const FATIHA_MAANI = [
  { a: 2, w: "رَبِّ العَالَمِينَ", m: "مُربِّيهِمْ وَمَالِكِهِمْ وَمُدَبِّر أُمُورِهم" },
  { a: 4, w: "يَوْمِ الِدّينِ", m: "يَوْمِ الجَزَاءِ، أو الحسابِ" },
  { a: 6, w: "اهدِنَا الصّرِاط المُستقِيم", m: "وَفَّقْنَا للثبات عَلَى الطريقِ الوَاضِح الَّذِي لاَ اعْوِجَاجَ فِيهِ وَهـُوَ الإسْلاَمُ" },
  { a: 7, w: "المَغضُوبِ عَليهِم", m: "اليَهُود" },
  { a: 7, w: "الضَآلّيِنَ", m: "النَّصَارَى، وكذا أَشْبَاهـُهـُمْ في الضلال" },
];
const FATIHA_QIRAAT = [
  { a: 4, w: "الرَّحِيمِ مَالِكِ", m: "(الرَّحِيمِ مَالِكِ) اظهار الميم الأولى مكسورة وبألف بعد الميم الثانية" },
  { a: 6, w: "الصِّرَاطَ", m: "الصراط (بالصاد)" },
  { a: 7, w: "صِرَاطَ", m: "(صِراط) بالصاد" },
  { a: 7, w: "عَلَيْهِمْ", m: "عليهِمْ" },
];

// ————— البقرة: معاني المفردات لأوائل السورة —————
const BAQARAH_MAANI = [
  { a: 1, w: "الم", m: "حُرُوفٌ مُقَطَّعَةٌ مِنْ حُرُوفِ الهِجَاءِ افْتُتِحَتْ بِهَا السُّورَةُ، وَاللهُ أَعْلَمُ بِمُرَادِهِ بِهَا" },
  { a: 2, w: "ذَٰلِكَ الْكِتَابُ", m: "القُرْآنُ العَظِيمُ" },
  { a: 2, w: "لَا رَيْبَ فِيهِ", m: "لَا شَكَّ أَنَّهُ مُنَزَّلٌ مِنْ عِنْدِ اللهِ" },
  { a: 2, w: "هُدًى لِّلْمُتَّقِينَ", m: "بَيَانٌ وَدَلَالَةٌ لِمَنْ يَخْشَوْنَ اللهَ وَيَتَّقُونَ عِقَابَهُ" },
  { a: 3, w: "بِالْغَيْبِ", m: "مَا غَابَ عَنِ الحِسِّ مِنْ أُمُورِ الآخِرَةِ وَصِفَاتِ اللهِ" },
  { a: 3, w: "يُقِيمُونَ الصَّلَاةَ", m: "يُؤَدُّونَهَا بِأَرْكَانِهَا وَشُرُوطِهَا فِي أَوْقَاتِهَا" },
  { a: 3, w: "يُنفِقُونَ", m: "يَبْذُلُونَ مِمَّا رَزَقَهُمُ اللهُ فِي وُجُوهِ الخَيْرِ" },
  { a: 4, w: "بِمَا أُنزِلَ إِلَيْكَ", m: "القُرْآنُ الكَرِيمُ" },
  { a: 4, w: "وَمَا أُنزِلَ مِن قَبْلِكَ", m: "التَّوْرَاةُ وَالإِنْجِيلُ وَسَائِرُ مَا أُنْزِلَ عَلَى الأَنْبِيَاءِ" },
  { a: 4, w: "يُوقِنُونَ", m: "يُصَدِّقُونَ تَصْدِيقًا جَازِمًا لَا شَكَّ مَعَهُ" },
  { a: 5, w: "الْمُفْلِحُونَ", m: "الفَائِزُونَ بِالمَطْلُوبِ، النَّاجُونَ مِنَ المَرْهُوبِ" },
];
const BAQARAH_ASBAB = "سورة البقرة مدنية، وهي أطول سور القرآن، نزلت آياتها متفرقة على مدى سنين بالمدينة. وقد رُوي عن ابن عباس في أوائلها أن الآيات الأربع الأولى نزلت في وصف المؤمنين، والآيتين بعدها في الكافرين، ثم الآيات التي تليها في المنافقين.";
const BAQARAH_ASBAB_EN = "Al-Baqarah is a Medinan surah — the longest in the Quran — revealed in portions over several years in Medina. Ibn Abbas is reported to have said that its first four verses describe the believers, the next two the disbelievers, and those following them the hypocrites.";

const FATIHA_ASBAB = "سورة الفاتحة مكية، وهي من أوائل ما نزل من القرآن على النبي ﷺ، ولم يثبت لها سبب نزول خاص بآية من آياتها. وقد ذكر بعض المفسرين أنها نزلت مرتين: مرة بمكة ومرة بالمدينة، لعظم شأنها ومكانتها في الصلاة، وسُمّيت فاتحة الكتاب لأنه يُفتتح بها المصحف والقراءة.";
const FATIHA_ASBAB_EN = "Al-Fatihah is a Meccan surah and among the earliest revelations to the Prophet ﷺ. No specific occasion of revelation is established for any single verse of it. Some exegetes noted it was revealed twice — once in Mecca and once in Medina — given its standing in prayer; it is called the Opening because the Quran and recitation begin with it.";

const BAQARAH_START = [
  { n: 1, t: "الم", tf: "حروف مقطّعة تدل على إعجاز القرآن؛ وقد تحدّى الله بها المشركين فعجزوا عن معارضته." },
  { n: 2, t: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ", tf: "هذا القرآن لا شك أنه من عند الله، هداية للمتقين." },
  { n: 3, t: "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ", tf: "الذين يصدّقون بالغيب ويؤدّون الصلاة كاملة وينفقون مما أعطاهم الله." },
  { n: 4, t: "وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ", tf: "ويصدّقون بما أُنزل إليك وإلى الرسل قبلك، ويوقنون بالدار الآخرة." },
  { n: 5, t: "أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ", tf: "أولئك على نور من ربهم، وهم الفائزون في الدنيا والآخرة." },
];

const AYAH_OF_DAY = { t: "وَقُل رَّبِّ زِدْنِي عِلْمًا", src: "سورة طه · الآية 114", srcEn: "Surah Taha · 114" };
const HADITH_OF_DAY = { t: "إنَّما الأعمالُ بالنِّيّات", src: "رواه البخاري", srcEn: "Sahih al-Bukhari" };

// ————— الأحاديث —————
const HADITH_CATS = ["الكل", "الصلاة", "الذكر", "الأخلاق", "الصيام", "العلم", "الطهارة"];
const HADITHS = [
  { id: 1, cat: "الأخلاق", t: "إنَّما الأعمالُ بالنِّيّاتِ، وإنَّما لكلِّ امرئٍ ما نوى", src: "متفق عليه", grade: "صحيح", ex: "مدار قبول الأعمال على النية؛ فمن كانت هجرته إلى الله ورسوله فهجرته إلى ما نوى." },
  { id: 2, cat: "الصلاة", t: "الصَّلواتُ الخمسُ، والجمعةُ إلى الجمعةِ، كفّارةٌ لما بينهنَّ ما لم تُغْشَ الكبائرُ", src: "رواه مسلم", grade: "صحيح", ex: "المحافظة على الصلوات تكفّر الذنوب الصغائر بين الصلاة والصلاة ما اجتُنبت الكبائر." },
  { id: 3, cat: "الذكر", t: "كلمتانِ خفيفتانِ على اللِّسانِ، ثقيلتانِ في الميزانِ: سبحانَ اللهِ وبحمدِه، سبحانَ اللهِ العظيمِ", src: "متفق عليه", grade: "صحيح", ex: "فضل هاتين الكلمتين وعظيم أجرهما مع يسرهما على اللسان." },
  { id: 4, cat: "العلم", t: "مَن سلكَ طريقًا يلتمسُ فيه علمًا، سهَّلَ اللهُ له به طريقًا إلى الجنةِ", src: "رواه مسلم", grade: "صحيح", ex: "الحثّ على طلب العلم الشرعي، وأنه سبب لدخول الجنة." },
  { id: 5, cat: "الصيام", t: "مَن صامَ رمضانَ إيمانًا واحتسابًا، غُفِرَ له ما تقدَّمَ من ذنبِه", src: "متفق عليه", grade: "صحيح", ex: "من صام تصديقًا بفرضيته وطلبًا للأجر لا رياءً غُفرت ذنوبه السالفة." },
  { id: 6, cat: "الأخلاق", t: "لا يؤمنُ أحدُكم حتى يحبَّ لأخيهِ ما يحبُّ لنفسِه", src: "متفق عليه", grade: "صحيح", ex: "من كمال الإيمان أن تحب الخير للناس كما تحبه لنفسك." },
  { id: 7, cat: "الطهارة", t: "الطُّهورُ شطرُ الإيمانِ", src: "رواه مسلم", grade: "صحيح", ex: "الطهارة نصف الإيمان؛ لعظم شأنها وأثرها في العبادة." },
  { id: 8, cat: "الذكر", t: "أحبُّ الأعمالِ إلى اللهِ أدومُها وإن قلَّ", src: "متفق عليه", grade: "صحيح", ex: "المداومة على العمل الصالح ولو كان يسيرًا أحبّ إلى الله من كثيرٍ منقطع." },
];

// ————— الأذكار —————
const ADHKAR = {
  morning: [
    { t: "أَعُوذُ بِاللَّهِ مِنَ الشَّيطَانِ الرَّجِيمِ ﴿اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَوَاتِ وَالْأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾.", src: "البقرة 255 — من قالها حين يصبح أُجير من الجن حتى يمسي", rep: 1 },
    { t: "بسم الله الرحمن الرحيم ﴿قُلْ هُوَ اللَّهُ أَحَدٌ* اللَّهُ الصَّمَدُ* لَمْ يَلِدْ وَلَمْ يُولَدْ* وَلَمْ يَكُن لَّهُ كُفُواً أَحَدٌ﴾. بسم الله الرحمن الرحيم ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ* مِن شَرِّ مَا خَلَقَ* وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ* وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ* وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ﴾. بسم الله الرحمن الرحيم ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ* مَلِكِ النَّاسِ* إِلَهِ النَّاسِ* مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ* الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ* مِنَ الْجِنَّةِ وَ النَّاسِ﴾ (ثلاثَ مرَّاتٍ).", src: "ثلاث مرات تكفيك من كل شيء — أبو داود والترمذي", rep: 3 },
    { t: "أصبحنا وأصبح الملكُ لله، والحمدُ لله، لا إله إلا الله وحده لا شريك له", src: "رواه مسلم", rep: 1 },
    { t: "(اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا ، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ). ", src: "رواه الترمذي", rep: 1 },
    { t: "(اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنوبَ إِلاَّ أَنْتَ).", src: "رواه البخاري — من قالها موقنًا بها فمات دخل الجنة", rep: 1 },
    { t: "سبحان الله وبحمده", src: "من قالها مئة مرة حُطَّت خطاياه — متفق عليه", rep: 100 },
    { t: "رضيتُ بالله ربًا، وبالإسلام دينًا، وبمحمدٍ ﷺ نبيًا", src: "رواه أبو داود", rep: 3 },
  ],
  evening: [
    { t: "أَعُوذُ بِاللَّهِ مِنَ الشَّيطَانِ الرَّجِيمِ ﴿اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَوَاتِ وَالْأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾.", src: "البقرة 255 — من قالها حين يمسي أُجير من الجن حتى يصبح", rep: 1 },
    { t: "بسم الله الرحمن الرحيم ﴿قُلْ هُوَ اللَّهُ أَحَدٌ* اللَّهُ الصَّمَدُ* لَمْ يَلِدْ وَلَمْ يُولَدْ* وَلَمْ يَكُن لَّهُ كُفُواً أَحَدٌ﴾. بسم الله الرحمن الرحيم ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ* مِن شَرِّ مَا خَلَقَ* وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ* وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ* وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ﴾. بسم الله الرحمن الرحيم ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ* مَلِكِ النَّاسِ* إِلَهِ النَّاسِ* مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ* الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ* مِنَ الْجِنَّةِ وَ النَّاسِ﴾ (ثلاثَ مرَّاتٍ).", src: "ثلاث مرات تكفيك من كل شيء — أبو داود والترمذي", rep: 3 },
    { t: "أمسينا وأمسى الملكُ لله، والحمدُ لله، لا إله إلا الله وحده لا شريك له", src: "رواه مسلم", rep: 1 },
    { t: "(اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنوبَ إِلاَّ أَنْتَ).", src: "رواه الترمذي", rep: 1 },
    { t: "أعوذ بكلمات الله التامات من شر ما خلق", src: "من قالها ثلاثًا لم تضره حُمَة تلك الليلة — رواه مسلم", rep: 3 },
    { t: "سبحان الله وبحمده", src: "من قالها مئة مرة حُطَّت خطاياه — متفق عليه", rep: 100 },
  ],
};

// ————— الدول للاختيار اليدوي —————
const COUNTRIES = [
  { c: "السعودية", cities: ["مكة المكرمة", "المدينة المنورة", "الرياض", "جدة"] },
  { c: "الأردن", cities: ["عمّان", "إربد", "الزرقاء", "العقبة"] },
  { c: "الإمارات", cities: ["دبي", "أبوظبي", "الشارقة"] },
  { c: "مصر", cities: ["القاهرة", "الإسكندرية", "الجيزة"] },
  { c: "فلسطين", cities: ["القدس", "غزة", "رام الله"] },
  { c: "سوريا", cities: ["دمشق", "حلب", "حمص"] },
  { c: "لبنان", cities: ["بيروت", "طرابلس", "صيدا"] },
  { c: "العراق", cities: ["بغداد", "البصرة", "الموصل"] },
  { c: "الكويت", cities: ["مدينة الكويت", "حولي"] },
  { c: "قطر", cities: ["الدوحة", "الريان"] },
  { c: "البحرين", cities: ["المنامة", "المحرق"] },
  { c: "عُمان", cities: ["مسقط", "صلالة"] },
  { c: "المغرب", cities: ["الرباط", "الدار البيضاء", "فاس"] },
  { c: "الجزائر", cities: ["الجزائر", "وهران"] },
  { c: "تونس", cities: ["تونس", "صفاقس"] },
  { c: "تركيا", cities: ["إسطنبول", "أنقرة"] },
];

// ————— جميع دول العالم (الاسم بلغة البلد) — ar:1 للدول العربية، en للاستخدام في واجهات البيانات —————
// المدينة: نص واحد إذا تطابق الاسم المحلي مع الإنجليزي، وإلا [محلي, إنجليزي]
const WORLD = [
  { n: "السعودية", en: "Saudi Arabia", ar: 1, cities: [["مكة المكرمة", "Makkah"], ["المدينة المنورة", "Madinah"], ["الرياض", "Riyadh"], ["جدة", "Jeddah"], ["الدمام", "Dammam"]] },
  { n: "الأردن", en: "Jordan", ar: 1, cities: [["عمّان", "Amman"], ["إربد", "Irbid"], ["الزرقاء", "Zarqa"], ["العقبة", "Aqaba"]] },
  { n: "الإمارات", en: "United Arab Emirates", ar: 1, cities: [["دبي", "Dubai"], ["أبوظبي", "Abu Dhabi"], ["الشارقة", "Sharjah"], ["العين", "Al Ain"]] },
  { n: "مصر", en: "Egypt", ar: 1, cities: [["القاهرة", "Cairo"], ["الإسكندرية", "Alexandria"], ["الجيزة", "Giza"], ["المنصورة", "Mansoura"]] },
  { n: "فلسطين", en: "Palestine", ar: 1, cities: [["القدس", "Jerusalem"], ["غزة", "Gaza"], ["رام الله", "Ramallah"], ["الخليل", "Hebron"], ["نابلس", "Nablus"]] },
  { n: "سوريا", en: "Syria", ar: 1, cities: [["دمشق", "Damascus"], ["حلب", "Aleppo"], ["حمص", "Homs"], ["اللاذقية", "Latakia"]] },
  { n: "لبنان", en: "Lebanon", ar: 1, cities: [["بيروت", "Beirut"], ["طرابلس", "Tripoli"], ["صيدا", "Sidon"]] },
  { n: "العراق", en: "Iraq", ar: 1, cities: [["بغداد", "Baghdad"], ["البصرة", "Basra"], ["الموصل", "Mosul"], ["أربيل", "Erbil"], ["النجف", "Najaf"]] },
  { n: "الكويت", en: "Kuwait", ar: 1, cities: [["مدينة الكويت", "Kuwait City"], ["حولي", "Hawally"]] },
  { n: "قطر", en: "Qatar", ar: 1, cities: [["الدوحة", "Doha"], ["الريان", "Al Rayyan"]] },
  { n: "البحرين", en: "Bahrain", ar: 1, cities: [["المنامة", "Manama"], ["المحرق", "Muharraq"]] },
  { n: "عُمان", en: "Oman", ar: 1, cities: [["مسقط", "Muscat"], ["صلالة", "Salalah"], ["صحار", "Sohar"]] },
  { n: "اليمن", en: "Yemen", ar: 1, cities: [["صنعاء", "Sanaa"], ["عدن", "Aden"], ["تعز", "Taiz"]] },
  { n: "المغرب", en: "Morocco", ar: 1, cities: [["الرباط", "Rabat"], ["الدار البيضاء", "Casablanca"], ["فاس", "Fes"], ["مراكش", "Marrakesh"], ["طنجة", "Tangier"]] },
  { n: "الجزائر", en: "Algeria", ar: 1, cities: [["الجزائر العاصمة", "Algiers"], ["وهران", "Oran"], ["قسنطينة", "Constantine"]] },
  { n: "تونس", en: "Tunisia", ar: 1, cities: [["تونس العاصمة", "Tunis"], ["صفاقس", "Sfax"], ["سوسة", "Sousse"]] },
  { n: "ليبيا", en: "Libya", ar: 1, cities: [["طرابلس الغرب", "Tripoli"], ["بنغازي", "Benghazi"], ["مصراتة", "Misrata"]] },
  { n: "السودان", en: "Sudan", ar: 1, cities: [["الخرطوم", "Khartoum"], ["أم درمان", "Omdurman"], ["بورتسودان", "Port Sudan"]] },
  { n: "موريتانيا", en: "Mauritania", ar: 1, cities: [["نواكشوط", "Nouakchott"], ["نواذيبو", "Nouadhibou"]] },
  { n: "الصومال", en: "Somalia", ar: 1, cities: [["مقديشو", "Mogadishu"], ["هرجيسا", "Hargeisa"]] },
  { n: "جيبوتي", en: "Djibouti", ar: 1, cities: [["جيبوتي", "Djibouti"]] },
  { n: "جزر القمر", en: "Comoros", ar: 1, cities: [["موروني", "Moroni"]] },
  { n: "Afghanistan | افغانستان", en: "Afghanistan", cities: [["کابل", "Kabul"], ["هرات", "Herat"], ["قندهار", "Kandahar"]] },
  { n: "Shqipëria", en: "Albania", cities: [["Tiranë", "Tirana"], ["Durrës", "Durres"]] },
  { n: "Andorra", en: "Andorra", cities: ["Andorra la Vella"] },
  { n: "Angola", en: "Angola", cities: ["Luanda", "Lubango"] },
  { n: "Antigua and Barbuda", en: "Antigua and Barbuda", cities: ["St. John's"] },
  { n: "Argentina", en: "Argentina", cities: ["Buenos Aires", ["Córdoba", "Cordoba"], "Rosario"] },
  { n: "Հայաստան", en: "Armenia", cities: [["Երևան", "Yerevan"], ["Գյումրի", "Gyumri"]] },
  { n: "Australia", en: "Australia", cities: ["Sydney", "Melbourne", "Perth", "Brisbane"] },
  { n: "Österreich", en: "Austria", cities: [["Wien", "Vienna"], "Salzburg", "Graz"] },
  { n: "Azərbaycan", en: "Azerbaijan", cities: [["Bakı", "Baku"], ["Gəncə", "Ganja"]] },
  { n: "Bahamas", en: "Bahamas", cities: ["Nassau"] },
  { n: "বাংলাদেশ", en: "Bangladesh", cities: [["ঢাকা", "Dhaka"], ["চট্টগ্রাম", "Chittagong"], ["সিলেট", "Sylhet"]] },
  { n: "Barbados", en: "Barbados", cities: ["Bridgetown"] },
  { n: "Беларусь", en: "Belarus", cities: [["Мінск", "Minsk"], ["Гомель", "Gomel"]] },
  { n: "België", en: "Belgium", cities: [["Brussel", "Brussels"], ["Antwerpen", "Antwerp"], ["Gent", "Ghent"]] },
  { n: "Belize", en: "Belize", cities: ["Belmopan", "Belize City"] },
  { n: "Bénin", en: "Benin", cities: ["Cotonou", "Porto-Novo"] },
  { n: "འབྲུག་ཡུལ (Bhutan)", en: "Bhutan", cities: ["Thimphu"] },
  { n: "Bolivia", en: "Bolivia", cities: ["La Paz", "Santa Cruz", "Sucre"] },
  { n: "Bosna i Hercegovina", en: "Bosnia and Herzegovina", cities: ["Sarajevo", "Mostar", "Banja Luka"] },
  { n: "Botswana", en: "Botswana", cities: ["Gaborone"] },
  { n: "Brasil", en: "Brazil", cities: [["São Paulo", "Sao Paulo"], "Rio de Janeiro", ["Brasília", "Brasilia"], "Salvador"] },
  { n: "Brunei", en: "Brunei", cities: ["Bandar Seri Begawan"] },
  { n: "България", en: "Bulgaria", cities: [["София", "Sofia"], ["Пловдив", "Plovdiv"], ["Варна", "Varna"]] },
  { n: "Burkina Faso", en: "Burkina Faso", cities: ["Ouagadougou", "Bobo-Dioulasso"] },
  { n: "Burundi", en: "Burundi", cities: ["Gitega", "Bujumbura"] },
  { n: "Cabo Verde", en: "Cape Verde", cities: ["Praia", "Mindelo"] },
  { n: "កម្ពុជា", en: "Cambodia", cities: [["ភ្នំពេញ", "Phnom Penh"], ["សៀមរាប", "Siem Reap"]] },
  { n: "Cameroun", en: "Cameroon", cities: [["Yaoundé", "Yaounde"], "Douala"] },
  { n: "Canada", en: "Canada", cities: ["Toronto", ["Montréal", "Montreal"], "Vancouver", "Ottawa", "Calgary"] },
  { n: "Centrafrique", en: "Central African Republic", cities: ["Bangui"] },
  { n: "Tchad", en: "Chad", cities: ["N'Djamena"] },
  { n: "Chile", en: "Chile", cities: ["Santiago", ["Valparaíso", "Valparaiso"]] },
  { n: "中国", en: "China", cities: [["北京", "Beijing"], ["上海", "Shanghai"], ["广州", "Guangzhou"], ["深圳", "Shenzhen"], ["乌鲁木齐", "Urumqi"]] },
  { n: "Colombia", en: "Colombia", cities: [["Bogotá", "Bogota"], ["Medellín", "Medellin"], "Cali"] },
  { n: "Congo", en: "Republic of the Congo", cities: ["Brazzaville", "Pointe-Noire"] },
  { n: "RD Congo", en: "DR Congo", cities: ["Kinshasa", "Lubumbashi", "Goma"] },
  { n: "Costa Rica", en: "Costa Rica", cities: [["San José", "San Jose"]] },
  { n: "Côte d'Ivoire", en: "Ivory Coast", cities: ["Abidjan", "Yamoussoukro"] },
  { n: "Hrvatska", en: "Croatia", cities: ["Zagreb", "Split", "Rijeka"] },
  { n: "Cuba", en: "Cuba", cities: [["La Habana", "Havana"], "Santiago de Cuba"] },
  { n: "Κύπρος", en: "Cyprus", cities: [["Λευκωσία", "Nicosia"], ["Λεμεσός", "Limassol"]] },
  { n: "Česko", en: "Czechia", cities: [["Praha", "Prague"], "Brno", "Ostrava"] },
  { n: "Danmark", en: "Denmark", cities: [["København", "Copenhagen"], "Aarhus", "Odense"] },
  { n: "Dominica", en: "Dominica", cities: ["Roseau"] },
  { n: "República Dominicana", en: "Dominican Republic", cities: ["Santo Domingo", "Santiago"] },
  { n: "Ecuador", en: "Ecuador", cities: ["Quito", "Guayaquil", "Cuenca"] },
  { n: "El Salvador", en: "El Salvador", cities: ["San Salvador"] },
  { n: "Guinea Ecuatorial", en: "Equatorial Guinea", cities: ["Malabo", "Bata"] },
  { n: "ኤርትራ (Eritrea)", en: "Eritrea", cities: ["Asmara", "Massawa"] },
  { n: "Eesti", en: "Estonia", cities: ["Tallinn", "Tartu"] },
  { n: "Eswatini", en: "Eswatini", cities: ["Mbabane", "Manzini"] },
  { n: "ኢትዮጵያ (Ethiopia)", en: "Ethiopia", cities: [["አዲስ አበባ", "Addis Ababa"], ["ድሬዳዋ", "Dire Dawa"]] },
  { n: "Fiji", en: "Fiji", cities: ["Suva", "Nadi"] },
  { n: "Suomi", en: "Finland", cities: ["Helsinki", "Tampere", "Turku"] },
  { n: "France", en: "France", cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"] },
  { n: "Gabon", en: "Gabon", cities: ["Libreville", "Port-Gentil"] },
  { n: "Gambia", en: "Gambia", cities: ["Banjul", "Serekunda"] },
  { n: "საქართველო", en: "Georgia", cities: [["თბილისი", "Tbilisi"], ["ბათუმი", "Batumi"]] },
  { n: "Deutschland", en: "Germany", cities: ["Berlin", ["München", "Munich"], "Frankfurt", "Hamburg", ["Köln", "Cologne"]] },
  { n: "Ghana", en: "Ghana", cities: ["Accra", "Kumasi", "Tamale"] },
  { n: "Ελλάδα", en: "Greece", cities: [["Αθήνα", "Athens"], ["Θεσσαλονίκη", "Thessaloniki"], ["Πάτρα", "Patras"]] },
  { n: "Grenada", en: "Grenada", cities: ["St. George's"] },
  { n: "Guatemala", en: "Guatemala", cities: [["Ciudad de Guatemala", "Guatemala City"], "Quetzaltenango"] },
  { n: "Guinée", en: "Guinea", cities: ["Conakry", "Kankan"] },
  { n: "Guiné-Bissau", en: "Guinea-Bissau", cities: ["Bissau"] },
  { n: "Guyana", en: "Guyana", cities: ["Georgetown"] },
  { n: "Haïti", en: "Haiti", cities: ["Port-au-Prince", ["Cap-Haïtien", "Cap-Haitien"]] },
  { n: "Honduras", en: "Honduras", cities: ["Tegucigalpa", "San Pedro Sula"] },
  { n: "Magyarország", en: "Hungary", cities: ["Budapest", "Debrecen", "Szeged"] },
  { n: "Ísland", en: "Iceland", cities: [["Reykjavík", "Reykjavik"], "Akureyri"] },
  { n: "भारत (India)", en: "India", cities: [["नई दिल्ली", "New Delhi"], ["मुंबई", "Mumbai"], ["हैदराबाद", "Hyderabad"], ["लखनऊ", "Lucknow"], ["कोलकाता", "Kolkata"]] },
  { n: "Indonesia", en: "Indonesia", cities: ["Jakarta", "Surabaya", "Bandung", "Medan", "Yogyakarta"] },
  { n: "ایران", en: "Iran", cities: [["تهران", "Tehran"], ["مشهد", "Mashhad"], ["اصفهان", "Isfahan"], ["شیراز", "Shiraz"], ["قم", "Qom"]] },
  { n: "Éire / Ireland", en: "Ireland", cities: ["Dublin", "Cork", "Galway"] },
  { n: "Italia", en: "Italy", cities: [["Roma", "Rome"], ["Milano", "Milan"], ["Napoli", "Naples"], ["Torino", "Turin"], ["Firenze", "Florence"]] },
  { n: "Jamaica", en: "Jamaica", cities: ["Kingston", "Montego Bay"] },
  { n: "日本", en: "Japan", cities: [["東京", "Tokyo"], ["大阪", "Osaka"], ["京都", "Kyoto"], ["名古屋", "Nagoya"], ["札幌", "Sapporo"]] },
  { n: "Қазақстан", en: "Kazakhstan", cities: [["Алматы", "Almaty"], ["Астана", "Astana"], ["Шымкент", "Shymkent"]] },
  { n: "Kenya", en: "Kenya", cities: ["Nairobi", "Mombasa", "Kisumu"] },
  { n: "Kiribati", en: "Kiribati", cities: ["Tarawa"] },
  { n: "Kosova", en: "Kosovo", cities: [["Prishtinë", "Pristina"], ["Prizren", "Prizren"]] },
  { n: "Кыргызстан", en: "Kyrgyzstan", cities: [["Бишкек", "Bishkek"], ["Ош", "Osh"]] },
  { n: "ລາວ (Laos)", en: "Laos", cities: [["ວຽງຈັນ", "Vientiane"], ["ຫລວງພະບາງ", "Luang Prabang"]] },
  { n: "Latvija", en: "Latvia", cities: [["Rīga", "Riga"], "Daugavpils"] },
  { n: "Lesotho", en: "Lesotho", cities: ["Maseru"] },
  { n: "Liberia", en: "Liberia", cities: ["Monrovia"] },
  { n: "Liechtenstein", en: "Liechtenstein", cities: ["Vaduz"] },
  { n: "Lietuva", en: "Lithuania", cities: ["Vilnius", "Kaunas", ["Klaipėda", "Klaipeda"]] },
  { n: "Lëtzebuerg", en: "Luxembourg", cities: ["Luxembourg"] },
  { n: "Madagasikara", en: "Madagascar", cities: ["Antananarivo", "Toamasina"] },
  { n: "Malawi", en: "Malawi", cities: ["Lilongwe", "Blantyre"] },
  { n: "Malaysia", en: "Malaysia", cities: ["Kuala Lumpur", "Johor Bahru", "George Town", "Kota Kinabalu", "Shah Alam"] },
  { n: "ދިވެހިރާއްޖެ (Maldives)", en: "Maldives", cities: [["މާލެ", "Male"]] },
  { n: "Mali", en: "Mali", cities: ["Bamako", ["Tombouctou", "Timbuktu"]] },
  { n: "Malta", en: "Malta", cities: ["Valletta", "Sliema"] },
  { n: "Marshall Islands", en: "Marshall Islands", cities: ["Majuro"] },
  { n: "Maurice", en: "Mauritius", cities: ["Port Louis"] },
  { n: "México", en: "Mexico", cities: [["Ciudad de México", "Mexico City"], "Guadalajara", "Monterrey", "Puebla"] },
  { n: "Micronesia", en: "Micronesia", cities: ["Palikir"] },
  { n: "Moldova", en: "Moldova", cities: [["Chișinău", "Chisinau"], ["Bălți", "Balti"]] },
  { n: "Monaco", en: "Monaco", cities: ["Monaco"] },
  { n: "Монгол улс", en: "Mongolia", cities: [["Улаанбаатар", "Ulaanbaatar"]] },
  { n: "Crna Gora", en: "Montenegro", cities: ["Podgorica", "Budva"] },
  { n: "Moçambique", en: "Mozambique", cities: ["Maputo", "Beira"] },
  { n: "မြန်မာ (Myanmar)", en: "Myanmar", cities: [["ရန်ကုန်", "Yangon"], ["မန္တလေး", "Mandalay"]] },
  { n: "Namibia", en: "Namibia", cities: ["Windhoek", "Swakopmund"] },
  { n: "Nauru", en: "Nauru", cities: ["Yaren"] },
  { n: "नेपाल", en: "Nepal", cities: [["काठमाडौँ", "Kathmandu"], ["पोखरा", "Pokhara"]] },
  { n: "Nederland", en: "Netherlands", cities: ["Amsterdam", "Rotterdam", ["Den Haag", "The Hague"], "Utrecht"] },
  { n: "New Zealand / Aotearoa", en: "New Zealand", cities: ["Auckland", "Wellington", "Christchurch"] },
  { n: "Nicaragua", en: "Nicaragua", cities: ["Managua", ["León", "Leon"]] },
  { n: "Niger", en: "Niger", cities: ["Niamey", "Zinder", "Agadez"] },
  { n: "Nigeria", en: "Nigeria", cities: ["Abuja", "Lagos", "Kano", "Ibadan", "Sokoto"] },
  { n: "조선 (North Korea)", en: "North Korea", cities: [["평양", "Pyongyang"]] },
  { n: "Северна Македонија", en: "North Macedonia", cities: [["Скопје", "Skopje"], ["Охрид", "Ohrid"]] },
  { n: "Norge", en: "Norway", cities: ["Oslo", "Bergen", "Trondheim"] },
  { n: "پاکستان", en: "Pakistan", cities: [["کراچی", "Karachi"], ["لاہور", "Lahore"], ["اسلام آباد", "Islamabad"], ["پشاور", "Peshawar"], ["فیصل آباد", "Faisalabad"]] },
  { n: "Palau", en: "Palau", cities: ["Ngerulmud", "Koror"] },
  { n: "Panamá", en: "Panama", cities: [["Ciudad de Panamá", "Panama City"], ["Colón", "Colon"]] },
  { n: "Papua Niugini", en: "Papua New Guinea", cities: ["Port Moresby", "Lae"] },
  { n: "Paraguay", en: "Paraguay", cities: [["Asunción", "Asuncion"], ["Ciudad del Este", "Ciudad del Este"]] },
  { n: "Perú", en: "Peru", cities: ["Lima", "Arequipa", "Cusco", "Trujillo"] },
  { n: "Pilipinas", en: "Philippines", cities: ["Manila", "Cebu", "Davao", "Quezon City"] },
  { n: "Polska", en: "Poland", cities: [["Warszawa", "Warsaw"], ["Kraków", "Krakow"], ["Gdańsk", "Gdansk"], ["Wrocław", "Wroclaw"]] },
  { n: "Portugal", en: "Portugal", cities: [["Lisboa", "Lisbon"], "Porto", "Braga", "Coimbra"] },
  { n: "România", en: "Romania", cities: [["București", "Bucharest"], "Cluj-Napoca", ["Timișoara", "Timisoara"], ["Iași", "Iasi"]] },
  { n: "Россия", en: "Russia", cities: [["Москва", "Moscow"], ["Санкт-Петербург", "Saint Petersburg"], ["Казань", "Kazan"], ["Уфа", "Ufa"], ["Грозный", "Grozny"]] },
  { n: "Rwanda", en: "Rwanda", cities: ["Kigali", "Butare"] },
  { n: "Saint Kitts and Nevis", en: "Saint Kitts and Nevis", cities: ["Basseterre"] },
  { n: "Saint Lucia", en: "Saint Lucia", cities: ["Castries"] },
  { n: "Saint Vincent", en: "Saint Vincent and the Grenadines", cities: ["Kingstown"] },
  { n: "Sāmoa", en: "Samoa", cities: ["Apia"] },
  { n: "San Marino", en: "San Marino", cities: ["San Marino"] },
  { n: "São Tomé e Príncipe", en: "Sao Tome and Principe", cities: [["São Tomé", "Sao Tome"]] },
  { n: "Sénégal", en: "Senegal", cities: ["Dakar", "Touba", "Saint-Louis"] },
  { n: "Србија", en: "Serbia", cities: [["Београд", "Belgrade"], ["Нови Сад", "Novi Sad"], ["Ниш", "Nis"]] },
  { n: "Sesel", en: "Seychelles", cities: ["Victoria"] },
  { n: "Sierra Leone", en: "Sierra Leone", cities: ["Freetown", "Bo"] },
  { n: "Singapore | Singapura", en: "Singapore", cities: ["Singapore"] },
  { n: "Slovensko", en: "Slovakia", cities: ["Bratislava", ["Košice", "Kosice"]] },
  { n: "Slovenija", en: "Slovenia", cities: ["Ljubljana", "Maribor"] },
  { n: "Solomon Islands", en: "Solomon Islands", cities: ["Honiara"] },
  { n: "South Africa", en: "South Africa", cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria"] },
  { n: "대한민국 (South Korea)", en: "South Korea", cities: [["서울", "Seoul"], ["부산", "Busan"], ["인천", "Incheon"], ["대구", "Daegu"]] },
  { n: "South Sudan", en: "South Sudan", cities: ["Juba", "Malakal"] },
  { n: "España", en: "Spain", cities: ["Madrid", "Barcelona", ["Sevilla", "Seville"], "Valencia", "Granada"] },
  { n: "ශ්‍රී ලංකා (Sri Lanka)", en: "Sri Lanka", cities: [["කොළඹ", "Colombo"], ["මහනුවර", "Kandy"], ["ගාල්ල", "Galle"]] },
  { n: "Suriname", en: "Suriname", cities: ["Paramaribo"] },
  { n: "Sverige", en: "Sweden", cities: ["Stockholm", ["Göteborg", "Gothenburg"], ["Malmö", "Malmo"], "Uppsala"] },
  { n: "Schweiz / Suisse", en: "Switzerland", cities: [["Zürich", "Zurich"], ["Genève", "Geneva"], "Bern", "Basel", "Lausanne"] },
  { n: "台灣", en: "Taiwan", cities: [["台北", "Taipei"], ["高雄", "Kaohsiung"], ["台中", "Taichung"]] },
  { n: "Тоҷикистон", en: "Tajikistan", cities: [["Душанбе", "Dushanbe"], ["Хуҷанд", "Khujand"]] },
  { n: "Tanzania", en: "Tanzania", cities: ["Dodoma", "Dar es Salaam", "Zanzibar", "Arusha"] },
  { n: "ไทย (Thailand)", en: "Thailand", cities: [["กรุงเทพฯ", "Bangkok"], ["เชียงใหม่", "Chiang Mai"], ["ภูเก็ต", "Phuket"]] },
  { n: "Timor-Leste", en: "Timor-Leste", cities: [["Díli", "Dili"]] },
  { n: "Togo", en: "Togo", cities: [["Lomé", "Lome"], "Sokodé"] },
  { n: "Tonga", en: "Tonga", cities: [["Nukuʻalofa", "Nukualofa"]] },
  { n: "Trinidad and Tobago", en: "Trinidad and Tobago", cities: ["Port of Spain", "San Fernando"] },
  { n: "Türkiye", en: "Turkey", cities: [["İstanbul", "Istanbul"], "Ankara", ["İzmir", "Izmir"], "Bursa", "Konya", "Antalya"] },
  { n: "Türkmenistan", en: "Turkmenistan", cities: [["Aşgabat", "Ashgabat"], ["Türkmenabat", "Turkmenabat"]] },
  { n: "Tuvalu", en: "Tuvalu", cities: ["Funafuti"] },
  { n: "Uganda", en: "Uganda", cities: ["Kampala", "Gulu", "Entebbe"] },
  { n: "Україна", en: "Ukraine", cities: [["Київ", "Kyiv"], ["Львів", "Lviv"], ["Одеса", "Odesa"], ["Харків", "Kharkiv"]] },
  { n: "United Kingdom", en: "United Kingdom", cities: ["London", "Manchester", "Birmingham", "Edinburgh", "Leeds", "Glasgow"] },
  { n: "United States", en: "United States", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Dearborn", "Washington"] },
  { n: "Uruguay", en: "Uruguay", cities: ["Montevideo", "Salto"] },
  { n: "Oʻzbekiston", en: "Uzbekistan", cities: [["Toshkent", "Tashkent"], ["Samarqand", "Samarkand"], ["Buxoro", "Bukhara"]] },
  { n: "Vanuatu", en: "Vanuatu", cities: ["Port Vila"] },
  { n: "Città del Vaticano", en: "Vatican City", cities: [["Vaticano", "Vatican City"]] },
  { n: "Venezuela", en: "Venezuela", cities: ["Caracas", "Maracaibo", "Valencia"] },
  { n: "Việt Nam", en: "Vietnam", cities: [["Hà Nội", "Hanoi"], ["TP. Hồ Chí Minh", "Ho Chi Minh City"], ["Đà Nẵng", "Da Nang"]] },
  { n: "Zambia", en: "Zambia", cities: ["Lusaka", "Kitwe", "Livingstone"] },
  { n: "Zimbabwe", en: "Zimbabwe", cities: ["Harare", "Bulawayo"] },
];
// جهات حساب مواقيت الصلاة
const CALC_AUTHORITIES = [
  "جامعة أم القرى مكة",
  "رابطة العالم الاسلامي",
  "جامعة العلوم الاسلامية كراتشي",
  "الهيئة المصرية العامة للمساحة",
  "الاتحاد الاسلامي أمريكا الشمالية",
  "اتحاد المنظمات العالمية فرنسا",
  "وزارة الأوقاف والشؤون الاسلامية الأردن",
  "وزارة الأوقاف والشؤون الاسلامية الكويت",
];
const CALC_AUTHORITIES_EN = [
  "Umm Al-Qura University, Makkah",
  "Muslim World League",
  "University of Islamic Sciences, Karachi",
  "Egyptian General Authority of Survey",
  "Islamic Society of North America",
  "Union des Organisations Islamiques de France",
  "Ministry of Awqaf & Islamic Affairs, Jordan",
  "Ministry of Awqaf & Islamic Affairs, Kuwait",
];

const METH_BY_EN = { "Saudi Arabia": 4, "Egypt": 5, "Turkey": 13, "United Arab Emirates": 16, "Qatar": 10, "Kuwait": 9, "Bahrain": 8, "Oman": 8, "Morocco": 21, "Tunisia": 18, "Algeria": 19, "Jordan": 23, "Iran": 7, "Pakistan": 1, "India": 1, "Bangladesh": 1, "Afghanistan": 1, "Indonesia": 20, "Malaysia": 17, "Singapore": 11, "France": 12, "Russia": 14, "United States": 2, "Canada": 2, "Portugal": 22 };
const cityLocal = c => Array.isArray(c) ? c[0] : c;
const cityEn = c => Array.isArray(c) ? c[1] : c;

const ATHAN_SOUNDS = ["المؤذن كامل اللالا", "المؤذن معروف الشريف", "المؤذن ناصر القطامي","المؤذن صالح الأنصاري", "الصوت الافتراضي للإشعارات"];
const RECITERS = [
  "عبد الباسط عبد الصمد",
  "محمد صديق المنشاوي",
  "مصطفى إسماعيل",
  "عبدالرشيد صوفي",
  "ماهر المعيقلي",
  "محمد محمود الطبلاوي",
];
const TAFSIRS = [
  "خواطر محمد متولي الشعراوي",
  "جامع البيان في تفسير القرآن للطبري",
  "الكشاف للزمخشري",
  "مفاتيح الغيب للرازي",
  "تفسير القرآن العظيم لأبن كثير",
  "روح المعاني للألوسي",
  "تفسير الجلالين المحلي والسيوطي",
];

const NOTIFICATIONS = [
  { icon: "athan", t: "أذان العصر بعد 25 دقيقة", s: "مكة المكرمة · 3:42 م", time: "الآن" },
  { icon: "quran", t: "وردك اليومي لم يكتمل بعد", s: "بقيت صفحة واحدة لتحقيق هدف اليوم", time: "قبل ساعة" },
  { icon: "dhikr", t: "أذكار المساء", s: "لا تنسَ أذكار المساء بعد صلاة العصر", time: "قبل 3 ساعات" },
  { icon: "khatmah", t: "أحسنت! أتممت 80% من خطة الختمة", s: "متبقٍ 12 يومًا على الختمة بإذن الله", time: "أمس" },
];

// ————— ردود تبيان (نموذجية) —————
const TIBYAN_SEED = [
  { role: "user", t: "ما معنى قوله تعالى: ﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ﴾؟" },
  { role: "ai", t: "تقديم المفعول «إيّاك» على الفعل يفيد الحصر: لا نعبد إلا إيّاك، ولا نستعين إلا بك. وجمعت الآية بين العبادة والاستعانة لأنّ العبد لا يقوى على العبادة إلا بعون الله.", src: "سورة الفاتحة · الآية ٥ — تفسير السعدي" },
];
const TIBYAN_CANNED = [
  { k: ["آية", "اليوم", "زدني"], t: "«وَقُل رَّبِّ زِدْنِي عِلْمًا» دعاءٌ علّمه الله نبيَّه ﷺ، يدل على شرف العلم وأنّ الإنسان مهما بلغ يبقى محتاجًا للمزيد منه.", src: "سورة طه · الآية ١١٤ — تفسير ابن كثير" },
  { k: ["الكرسي", "البقرة"], t: "آية الكرسي تجمع أصول التوحيد: الحياة والقيّومية والملك والعلم المحيط، وسعة الكرسي، ونفي السِّنة والنوم عن الله تعالى.", src: "سورة البقرة · الآية ٢٥٥ — تفسير ابن كثير" },
  { k: ["الفاتحة", "الحمد"], t: "«الحمد لله رب العالمين» ثناءٌ على الله بصفات الكمال، و«الرحمن الرحيم» رحمةٌ واسعة عامة وخاصة، ولذلك سُمّيت الفاتحة أمّ الكتاب.", src: "سورة الفاتحة · الآيتان ٢-٣ — تفسير الطبري" },
  { k: ["حديث", "الأعمال", "النية"], t: "«إنما الأعمال بالنيات» أصلٌ عظيم: العمل الظاهر يزنه القصد الباطن، وقد عدّه العلماء أحد الأحاديث التي يدور عليها الدين.", src: "متفق عليه — البخاري ١، مسلم ١٩٠٧" },
];
const TIBYAN_DEFAULT = { t: "سؤال جميل! في النسخة الكاملة أبحث لك في تفسير القرآن الكريم وكتب الحديث وأجيبك مع ذكر المصادر والمراجع الموثوقة.", src: "تبيان — المساعد الذكي (نموذج تجريبي)" };

// ————— الترجمة الإنجليزية للشاشات الأساسية —————
const EN = {
  tagline: "Your daily companion for Quran, Prayer & Dhikr",
  nextPrayer: "Next Prayer", remaining: "Until Athan",
  qibla: "Qibla", allTimes: "All Times", athanAlert: "Athan Alert",
  wird: "Quran Wird", pages: "pages", done: "completed", continueReading: "Continue Reading",
  ayahDay: "Ayah of the Day", hadithDay: "Hadith of the Day", share: "Share",
  tracker: "Today's Progress", prayers: "Prayers", dhikr: "Adhkar", more: "More",
  tabs: { home: "Home", quran: "Quran", pray: "Prayer", hadith: "Hadith", moreTab: "More" },
  monthTable: "View Full Month", prayerTimes: "Prayer Times", nightPrayer: "Night Prayer Alert",
  athanSound: "Athan Sound", tibyan: "Tibyan AI",
};

// ————— English data (parallel to the Arabic structures above) —————
const SURAH_EN = [
  "Al-Fatihah","Al-Baqarah","Aal Imran","An-Nisa","Al-Ma'idah","Al-An'am","Al-A'raf","Al-Anfal","At-Tawbah","Yunus",
  "Hud","Yusuf","Ar-Ra'd","Ibrahim","Al-Hijr","An-Nahl","Al-Isra","Al-Kahf","Maryam","Taha",
  "Al-Anbiya","Al-Hajj","Al-Mu'minun","An-Nur","Al-Furqan","Ash-Shu'ara","An-Naml","Al-Qasas","Al-Ankabut","Ar-Rum",
  "Luqman","As-Sajdah","Al-Ahzab","Saba","Fatir","Ya-Sin","As-Saffat","Sad","Az-Zumar","Ghafir",
  "Fussilat","Ash-Shura","Az-Zukhruf","Ad-Dukhan","Al-Jathiyah","Al-Ahqaf","Muhammad","Al-Fath","Al-Hujurat","Qaf",
  "Adh-Dhariyat","At-Tur","An-Najm","Al-Qamar","Ar-Rahman","Al-Waqi'ah","Al-Hadid","Al-Mujadila","Al-Hashr","Al-Mumtahanah",
  "As-Saff","Al-Jumu'ah","Al-Munafiqun","At-Taghabun","At-Talaq","At-Tahrim","Al-Mulk","Al-Qalam","Al-Haqqah","Al-Ma'arij",
  "Nuh","Al-Jinn","Al-Muzzammil","Al-Muddaththir","Al-Qiyamah","Al-Insan","Al-Mursalat","An-Naba","An-Nazi'at","Abasa",
  "At-Takwir","Al-Infitar","Al-Mutaffifin","Al-Inshiqaq","Al-Buruj","At-Tariq","Al-A'la","Al-Ghashiyah","Al-Fajr","Al-Balad",
  "Ash-Shams","Al-Layl","Ad-Duha","Ash-Sharh","At-Tin","Al-Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-Adiyat",
  "Al-Qari'ah","At-Takathur","Al-Asr","Al-Humazah","Al-Fil","Quraysh","Al-Ma'un","Al-Kawthar","Al-Kafirun","An-Nasr",
  "Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas"
];

const COUNTRIES_EN = [
  { c: "Saudi Arabia", cities: ["Makkah", "Madinah", "Riyadh", "Jeddah"] },
  { c: "Jordan", cities: ["Amman", "Irbid", "Zarqa", "Aqaba"] },
  { c: "UAE", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { c: "Egypt", cities: ["Cairo", "Alexandria", "Giza"] },
  { c: "Palestine", cities: ["Jerusalem", "Gaza", "Ramallah"] },
  { c: "Syria", cities: ["Damascus", "Aleppo", "Homs"] },
  { c: "Lebanon", cities: ["Beirut", "Tripoli", "Sidon"] },
  { c: "Iraq", cities: ["Baghdad", "Basra", "Mosul"] },
  { c: "Kuwait", cities: ["Kuwait City", "Hawally"] },
  { c: "Qatar", cities: ["Doha", "Al Rayyan"] },
  { c: "Bahrain", cities: ["Manama", "Muharraq"] },
  { c: "Oman", cities: ["Muscat", "Salalah"] },
  { c: "Morocco", cities: ["Rabat", "Casablanca", "Fes"] },
  { c: "Algeria", cities: ["Algiers", "Oran"] },
  { c: "Tunisia", cities: ["Tunis", "Sfax"] },
  { c: "Türkiye", cities: ["Istanbul", "Ankara"] },
];

const ATHAN_SOUNDS_EN = ["Makkah Haram Athan", "Madinah Haram Athan", "Nasser Al-Qatami", "Default notification sound"];
const RECITERS_EN = [
  "Abdul Basit Abdus Samad",
  "Mohamed Siddiq El-Minshawi",
  "Mustafa Ismail",
  "Abdul Rashid Sufi",
  "Maher Al Muaiqly",
  "Mohamed Mahmoud Al-Tablawi",
];
const TAFSIRS_EN = [
  "Khawatir — Al-Sha'rawi",
  "Jami' al-Bayan — Al-Tabari",
  "Al-Kashshaf — Al-Zamakhshari",
  "Mafatih al-Ghayb — Al-Razi",
  "Tafsir Ibn Kathir",
  "Ruh al-Ma'ani — Al-Alusi",
  "Tafsir al-Jalalayn",
];
const HADITH_CATS_EN = ["All", "Prayer", "Dhikr", "Manners", "Fasting", "Knowledge", "Purity"];

const HADITHS_EN = [
  { t: "Actions are but by intentions, and every person shall have only what they intended", src: "Agreed upon", grade: "Sahih", ex: "The acceptance of deeds hinges on intention; whoever emigrated for Allah and His Messenger, his emigration was for what he intended." },
  { t: "The five prayers, and Friday to Friday, expiate whatever is between them, so long as major sins are avoided", src: "Narrated by Muslim", grade: "Sahih", ex: "Maintaining the prayers erases minor sins between one prayer and the next, provided major sins are avoided." },
  { t: "Two words light on the tongue, heavy on the Scale: SubhanAllahi wa bihamdih, SubhanAllahil-Azim", src: "Agreed upon", grade: "Sahih", ex: "The virtue and great reward of these two phrases despite their ease upon the tongue." },
  { t: "Whoever travels a path in search of knowledge, Allah eases for him a path to Paradise", src: "Narrated by Muslim", grade: "Sahih", ex: "Encouragement to seek religious knowledge — it is a cause of entering Paradise." },
  { t: "Whoever fasts Ramadan out of faith and seeking reward, his previous sins are forgiven", src: "Agreed upon", grade: "Sahih", ex: "Whoever fasts believing in its obligation and seeking reward — not for show — his past sins are forgiven." },
  { t: "None of you truly believes until he loves for his brother what he loves for himself", src: "Agreed upon", grade: "Sahih", ex: "Complete faith includes loving good for others as you love it for yourself." },
  { t: "Purity is half of faith", src: "Narrated by Muslim", grade: "Sahih", ex: "Purification is half of faith — a mark of its great status and its effect in worship." },
  { t: "The most beloved deeds to Allah are the most consistent, even if small", src: "Agreed upon", grade: "Sahih", ex: "Consistency in good deeds, however small, is more beloved to Allah than much that is interrupted." },
];

const NOTIFICATIONS_EN = [
  { t: "Asr athan in 25 minutes", s: "Makkah · 3:42 PM", time: "Now" },
  { t: "Your daily wird is not complete yet", s: "One page left to reach today's goal", time: "1h ago" },
  { t: "Evening Adhkar", s: "Don't forget the evening adhkar after Asr", time: "3h ago" },
  { t: "Well done! 80% of your Khatmah plan", s: "12 days left to completion, insha'Allah", time: "Yesterday" },
];

const ADHKAR_SRC_EN = {
  morning: [
    "Al-Baqarah 255 — whoever says it in the morning is protected from jinn until evening",
    "Three times suffices you against everything — Abu Dawud & At-Tirmidhi",
    "Narrated by Muslim",
    "Narrated by At-Tirmidhi",
    "Narrated by Al-Bukhari — whoever says it with certainty and dies, enters Paradise",
    "Whoever says it 100 times has his sins erased — Agreed upon",
    "Narrated by Abu Dawud",
  ],
  evening: [
    "Al-Baqarah 255 — whoever says it in the evening is protected from jinn until morning",
    "Three times suffices you against everything — Abu Dawud & At-Tirmidhi",
    "Narrated by Muslim",
    "Narrated by At-Tirmidhi",
    "Whoever says it three times, nothing will harm him that night — Narrated by Muslim",
    "Whoever says it 100 times has his sins erased — Agreed upon",
  ],
};

const FATIHA_TF_EN = [
  "I begin my recitation in the name of Allah, seeking His help — the Most Merciful, whose mercy is vast, the Especially Merciful to the believers.",
  "All praise is for Allah for His attributes, actions and blessings — the Master and Sustainer of all creation.",
  "Whose mercy embraces all things, and is decreed for the righteous among His servants.",
  "The Owner and Judge of the Day of Recompense and Account.",
  "You alone we worship, and You alone we ask for help in all our affairs.",
  "Guide us and keep us firm upon the clear path — Islam.",
  "The path of those You have blessed among the prophets and the truthful — not of those who earned anger, nor of those astray.",
];
const BAQARAH_TF_EN = [
  "Disconnected letters pointing to the miraculous nature of the Quran; the disbelievers were challenged with it and could not produce its like.",
  "This Quran — no doubt it is from Allah — is guidance for the God-fearing.",
  "Those who believe in the unseen, establish the prayer fully, and spend from what Allah has provided them.",
  "And who believe in what was revealed to you and to the messengers before you, and are certain of the Hereafter.",
  "They are upon light from their Lord, and they are the successful in this world and the next.",
];

const TIBYAN_SEED_EN = [
  { role: "user", t: "What does \"You alone we worship, and You alone we ask for help\" mean?" },
  { role: "ai", t: "Placing the object \"You alone\" before the verb conveys exclusivity: we worship none but You, and seek help from none but You. The ayah joins worship with seeking help, because no one can worship except by Allah's aid.", src: "Al-Fatihah · 5 — Tafsir as-Sa'di" },
];
const TIBYAN_CANNED_EN = [
  { k: ["ayah", "today", "knowledge"], t: "\"And say: My Lord, increase me in knowledge\" is a supplication Allah taught His Prophet ﷺ — showing the honor of knowledge and that one always needs more of it.", src: "Surah Taha · 114 — Tafsir Ibn Kathir" },
  { k: ["kursi", "throne", "baqarah"], t: "Ayat al-Kursi gathers the foundations of tawhid: life, self-subsistence, dominion, all-encompassing knowledge, the vastness of the Kursi, and the negation of drowsiness and sleep from Allah.", src: "Al-Baqarah · 255 — Tafsir Ibn Kathir" },
  { k: ["fatihah", "praise"], t: "\"All praise is for Allah, Lord of the worlds\" praises Allah with the attributes of perfection, and \"the Most Merciful, the Especially Merciful\" pairs a general mercy with a particular one — which is why Al-Fatihah is called the Mother of the Book.", src: "Al-Fatihah · 2-3 — Tafsir at-Tabari" },
  { k: ["hadith", "intention", "deeds"], t: "\"Actions are but by intentions\" is a great foundation: an outward deed is weighed by the inward purpose. Scholars counted it among the hadiths upon which the religion turns.", src: "Agreed upon — Bukhari 1, Muslim 1907" },
];
const TIBYAN_DEFAULT_EN = { t: "Great question! In the full version I search Quranic tafsir and the books of hadith and answer with trusted sources and references.", src: "Tibyan — the smart assistant (demo)" };

// ————— المساجد المرتبطة بكل بلد (صور الهيرو) —————
const MOSQUE_BY_COUNTRY = {
  "Saudi Arabia": [
    { src: "images/mosque-haram-t.png", name: "المسجد الحرام - مكة المكرمة - المملكة العربية السعودية" },
    { src: "images/mosque-nabawi-t.png", name: "المسجد النبوي - المدينة المنورة - المملكة العربية السعودية" },
  ],
  "Jordan": [{ src: "images/mosque-abdullah-t.png", name: "مسجد الملك عبدالله الأول - الأردن" }],
  "Palestine": [{ src: "images/mosque-sakhra-t.png", name: "قبة الصخرة المشرفة - فلسطين" }],
  "Syria": [{ src: "images/mosque-umawi-t.png", name: "الجامع الأموي - سوريا" }],
  "Morocco": [{ src: "images/mosque-hassan2-t.png", name: "مسجد الحسن الثاني - المغرب" }],
  "Turkey": [{ src: "images/mosque-camlica-t.png", name: "مسجد تشامليغا الكبير - تركيا" }],
  "Pakistan": [{ src: "images/mosque-faisal-t.png", name: "مسجد الملك فيصل - الباكستان" }],
  "India": [{ src: "images/mosque-jahannuma-t.png", name: "مسجد جهان نما - الهند" }],
  "Indonesia": [{ src: "images/mosque-jabbar-t.png", name: "مسجد الجبار - إندونيسيا" }],
  "Malaysia": [{ src: "images/mosque-salahuddin-t.png", name: "مسجد السلطان صلاح الدين - ماليزيا" }],
  "Russia": [{ src: "images/mosque-chechnya-t.png", name: "مسجد فخر المسلمين - الشيشان" }],
  "United States": [{ src: "images/mosque-islamiccenter-t.png", name: "مسجد المركز الاسلامي - الولايات المتحدة الأمريكية" }],
};
const COUNTRY_AR = {
  "Saudi Arabia": "السعودية", "Jordan": "الأردن", "Palestine": "فلسطين", "Syria": "سوريا",
  "Egypt": "مصر", "Morocco": "المغرب", "Turkey": "تركيا", "Pakistan": "باكستان",
  "India": "الهند", "Indonesia": "إندونيسيا", "Malaysia": "ماليزيا", "Russia": "روسيا",
  "United States": "الولايات المتحدة",
};


window.MuznData = {
  LOCATION,
  PRAYER_TIMES,
  PRAYER_META,
  arDigits,
  pad2,
  fmt12,
  ampm,
  toMin,
  getPrayerState,
  fmtCountdown,
  hijriDate,
  gregDate,
  SURAHS,
  JUZ_PAGES,
  SURAH_PAGES,
  MUSHAF_IMAGES,
  JUZ_START_SURAH,
  HBOOK_SECTIONS_AR,
  FATIHA,
  FATIHA_MAANI,
  FATIHA_QIRAAT,
  BAQARAH_MAANI,
  BAQARAH_ASBAB,
  BAQARAH_ASBAB_EN,
  FATIHA_ASBAB,
  FATIHA_ASBAB_EN,
  BAQARAH_START,
  AYAH_OF_DAY,
  HADITH_OF_DAY,
  HADITH_CATS,
  HADITHS,
  ADHKAR,
  COUNTRIES,
  WORLD,
  METH_BY_EN,
  CALC_AUTHORITIES,
  CALC_AUTHORITIES_EN,
  cityLocal,
  cityEn,
  ATHAN_SOUNDS,
  RECITERS,
  TAFSIRS,
  NOTIFICATIONS,
  TIBYAN_SEED,
  TIBYAN_CANNED,
  TIBYAN_DEFAULT,
  EN,
  SURAH_EN,
  COUNTRIES_EN,
  ATHAN_SOUNDS_EN,
  RECITERS_EN,
  TAFSIRS_EN,
  HADITH_CATS_EN,
  HADITHS_EN,
  NOTIFICATIONS_EN,
  ADHKAR_SRC_EN,
  FATIHA_TF_EN,
  BAQARAH_TF_EN,
  TIBYAN_SEED_EN,
  TIBYAN_CANNED_EN,
  TIBYAN_DEFAULT_EN,
  MOSQUE_BY_COUNTRY,
  COUNTRY_AR,
};
// الاسم الذي يبحث عنه مكوّن HeroCard
window.__MUZN_DATA = window.MuznData;
})();
