// tools/sync-offline.js
// يعيد توليد components/HeroCard.offline.js من components/HeroCard.dc.html
// التشغيل من جذر المشروع:  node tools/sync-offline.js
const fs = require("fs");
const path = require("path");

const ROOT = path.dirname(__dirname);
const SRC = path.join(ROOT, "components/HeroCard.dc.html");
const DST = path.join(ROOT, "components/HeroCard.offline.js");

const html = fs.readFileSync(SRC, "utf8");

const header =
  "// مولَّد آليًا من components/HeroCard.dc.html — لا تعدّله يدويًا.\n" +
  "// يُستخدم فقط عند فتح index.html مباشرةً (file://) لأن fetch ممنوع هناك؛\n" +
  "// أمّا عبر خادم فيُقرأ ملف HeroCard.dc.html مباشرةً.\n" +
  "// بعد أي تعديل على HeroCard.dc.html شغّل:  node tools/sync-offline.js\n";

const out =
  header +
  "(function () {\n" +
  '  if (location.protocol !== "file:") return;\n' +
  "  var SRC = " + JSON.stringify(html) + ";\n" +
  "  window.__resourceBlobs = window.__resourceBlobs || {};\n" +
  '  window.__resourceBlobs["components/HeroCard.dc.html"] =\n' +
  '    new Blob([SRC], { type: "text/html" });\n' +
  "})();\n";

fs.writeFileSync(DST, out, "utf8");
console.log("HeroCard.offline.js updated (" + out.length + " bytes)");
