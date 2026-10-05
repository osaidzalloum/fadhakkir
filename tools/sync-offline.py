#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""يعيد توليد components/HeroCard.offline.js من components/HeroCard.dc.html."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(ROOT, "components/HeroCard.dc.html"), encoding="utf-8").read()
out = ('// مولَّد آليًا من components/HeroCard.dc.html — لا تعدّله يدويًا.\n// يُستخدم فقط عند فتح index.html مباشرةً (file://) لأن fetch ممنوع هناك؛\n// أمّا عبر خادم فيُقرأ ملف HeroCard.dc.html مباشرةً.\n// بعد أي تعديل على HeroCard.dc.html شغّل:  python3 tools/sync-offline.py\n'
       + "(function () {\n"
       + '  if (location.protocol !== "file:") return;\n'
       + "  var SRC = " + json.dumps(html, ensure_ascii=False) + ";\n"
       + '  window.__resourceBlobs = window.__resourceBlobs || {};\n'
       + '  window.__resourceBlobs["components/HeroCard.dc.html"] =\n'
       + '    new Blob([SRC], { type: "text/html" });\n})();\n')
open(os.path.join(ROOT, "components/HeroCard.offline.js"), "w", encoding="utf-8").write(out)
print("HeroCard.offline.js updated")
