// app.js — منطق تطبيق «فذَكِّر»
// يُستدعى من الوسم <script data-dc-script> في index.html
window.MuznApp = function (DCLogic, React) {

  class Component extends DCLogic {
    state = {
      screen: "welcome", stack: [], lang: "ar", langReturn: null,
      now: new Date(), mod: null, toast: null,
      // التهيئة
      openCountry: null, athanPref: "صوت المؤذن", asrMethod: "jomhor", highLat: false, khatmahPages: 5,
      lmCountry: null, lmDrop: null, lmFilter: "", lmSearch: "", lmAuto: null, asrDrop: false, langAsk: false, lmPend: null, lmMosque: null, heroMosque: null,
      cityName: "مكة المكرمة، السعودية", ptTimes: null, ptMonth: null,
      // الإعدادات والتتبع
      athanOn: true, prayersDone: { fajr: true, dhuhr: true, asr: false, maghrib: false, isha: false },
      wirdGoal: 5, wirdDone: 4, adhkarDone: 33, adhkarGoal: 100,
      adhkarTab: "morning", adhkarIdx: 0, adhkarCount: 0,
      // القرآن
      quranTab: "surah", readerPage: 1, readerIdx: 0, qTick: 0, readerSurah: "الفاتحة", ayahSel: null, bookmarked: true, bookmarkIdx: 0, qSearch: "", tempC: null,
      readerPg: 0, playing: false, playWord: 0, mushafTipSeen: false, qFs: 21, qFont: 0, qLh: 1.65,
      mPage: 1, mSearchOpen: false, mSearch: "", mBm: 1,
      mBms: [1], savedOpen: false, savedSwipe: 0,
      ayPlay: null, ayProg: 0, ayPaused: false, ayDl: false, ayBar: false,
      dlOpen: false, dlSwipe: "",
      qsOpen: false, qsDrop: "",
      lnOpen: false, lnDrop: false, lnMode: 0,
      calcAuth: 6, calcDrop: false,
      adhCat: "morning", adhCount: {},
      heroGreg: false,
      tafDrop: false,
      bmRibbon: null, rSearch: "", geoLat: null, geoLng: null,
      locOpen: false,
      obStep: 1,
      reciter: 0, tafsirBook: 0, readerSettingsOpen: false,
      savedAyahs: [], downloads: [], dlSheetOpen: false, dlBusy: false, dlProgress: 0, qAllTick: 0, ayahMenu: null,
      // الحديث
      hadithCat: "الكل", hadithSel: 1, savedHadiths: [1], hadithBook: "featured", hSection: null, hTick: 0, hApiSel: null, hSearch: "",
      // تبيان
      messages: null, draft: "", thinking: false,
      // الرزنامة
      calOffset: 0, calSel: null, calMode: "greg",
      // الصلاة
      alertModes: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, nightAlert: false, qiyamHour: 3, sunriseAlert: true,
      prayerSounds: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, prayerSheet: null, athanSound: 0,
      // الختمة
      planDays: 30, planStart: 0,
      darkMode: false, notifRead: false,
    };
  
    // مدة بقاء شاشة الترحيب قبل الانتقال (بالمللي ثانية)
    WELCOME_MS = 2000;

    componentDidMount() {
      window.addEventListener("resize", () => this.fitPage());
      setTimeout(() => this.fitPage(), 30);
      Promise.resolve(window.MuznData).then(mod => {
        const seed = mod.TIBYAN_SEED.map(m => ({ ...m }));
        this.setState(s => ({ mod, messages: s.messages || seed }), () => { this.loadSurah(this.state.readerIdx || 0); this.fetchTimes(); });
      });
      try {
        const saved = JSON.parse(localStorage.getItem("muzn:v1") || "null");
        if (saved) this.setState(saved);
      } catch (e) {}
      this._t = setInterval(() => this.setState({ now: new Date() }), 5000);

      // شاشة الترحيب: تبقى ١٠ ثوانٍ ثم تنتقل تلقائيًا إلى شاشة الموقع
      if (!this.isBoard()) {
        this._welcomeT = setTimeout(() => {
          if (this.state.screen === "welcome") this.tab("locationManual");
        }, this.WELCOME_MS);
      }
    }
    componentWillUnmount() { clearInterval(this._t); clearInterval(this._dlT); clearInterval(this._scT); clearInterval(this._plT); clearTimeout(this._welcomeT); }
  
    persist() {
      const s = this.state;
      const keep = {
        lang: s.lang, athanOn: s.athanOn, prayersDone: s.prayersDone, wirdGoal: s.wirdGoal, qFs: s.qFs, qFont: s.qFont, qLh: s.qLh,
        wirdDone: s.wirdDone, adhkarDone: s.adhkarDone, khatmahPages: s.khatmahPages,
        athanPref: s.athanPref, asrMethod: s.asrMethod, highLat: s.highLat, cityName: s.cityName, heroMosque: s.heroMosque,
        alertModes: s.alertModes, nightAlert: s.nightAlert, athanSound: s.athanSound,
        prayerSounds: s.prayerSounds, sunriseAlert: s.sunriseAlert, qiyamHour: s.qiyamHour,
        savedAyahs: s.savedAyahs, downloads: s.downloads,
        reciter: s.reciter, tafsirBook: s.tafsirBook, savedHadiths: s.savedHadiths, readerIdx: s.readerIdx, bookmarkIdx: s.bookmarkIdx, mushafTipSeen: s.mushafTipSeen, bmRibbon: s.bmRibbon,
        planDays: s.planDays, planStart: s.planStart, hadithSel: s.hadithSel, darkMode: s.darkMode,
      };
      try { localStorage.setItem("muzn:v1", JSON.stringify(keep)); } catch (e) {}
    }
    set(patch) { this.setState(patch, () => this.persist()); }
  
    // ─── تنقّل ───
    mapLang(s) {
      if (this.state.lang !== "en") return s;
      return ({ home: "homeEn", prayer: "prayerEn", more: "moreEn" })[s] || s;
    }
    // الصفحات التي لها صورة مصحف: صفحة ← [رقم السورة, رقم الصفحة داخلها]
    mushafMap() {
      const M = (this.state.mod && this.state.mod.MUSHAF_IMAGES) || {};
      const out = {};
      Object.keys(M).forEach(k => { out[k] = [M[k].surah, M[k].pg]; });
      return out;
    }
    // ضبط الصفحة ومزامنة حالة القارئ حتى تعمل مناطق الآيات وقائمتها
    setPage(n) {
      const pg = Math.min(604, Math.max(1, parseInt(n, 10) || 1));
      const m = this.mushafMap()[pg];
      if (m) {
        const mod = this.state.mod;
        if (mod && this.state.readerIdx !== m[0]) this.openSurah(m[0], false);
        this.setState({ readerPg: m[1], ayahSel: null, ayahMenu: null });
      } else {
        this.setState({ ayahSel: null, ayahMenu: null });
      }
      this.setState({ mPage: pg, mSearchOpen: false, mSearch: "" });
    }
    // فتح المصحف على صفحة محدّدة (١ إلى ٦٠٤)
    goPage(n) { this.setPage(n); this.tab("mushaf"); }
    // صفحة بداية سورة برقمها الصفري
    surahPage(i) {
      const mod = this.state.mod;
      const list = (mod && mod.SURAH_PAGES) || [];
      return list[i] || 1;
    }
    go(s) { if (this.state.screen === "quranReader") this.stopPlay(); const extra = s === "locationManual" ? { lmPend: null, lmDrop: null, lmFilter: "" } : {}; this.setState(st => ({ stack: [...st.stack, st.screen], screen: this.mapLang(s), ...extra })); }
    tab(s) { if (this.state.screen === "quranReader") this.stopPlay(); this.setState({ stack: [], screen: this.mapLang(s) }); }
    back() {
      if (this.state.screen === "quranReader") this.stopPlay();
      this.setState(st => {
        const stack = [...st.stack];
        const prev = stack.pop() || this.mapLang("home");
        return { stack, screen: prev };
      });
    }
    showToast(msg, ms) {
      clearTimeout(this._toastT);
      this.setState({ toast: msg });
      this._toastT = setTimeout(() => this.setState({ toast: null }), ms || 2200);
    }

    // ─── مشغّل تلاوة الآية ───
    // رقم الآية ← فهرسها داخل السورة (للتظليل)
    ayahIndexOf(n) {
      const list = (this.qCache && this.qCache[this.state.readerIdx || 0]) || [];
      const k = list.findIndex(a => a.n === n);
      return k >= 0 ? k : null;
    }
    // أرقام آيات الصفحة الحالية بالترتيب
    pageAyahNums() {
      const mod = this.state.mod;
      const pg = Math.min(604, Math.max(1, parseInt(this.state.mPage, 10) || 1));
      const info = ((mod && mod.MUSHAF_IMAGES) || {})[pg];
      if (!info) return [];
      const seen = {}, out = [];
      info.r.forEach(r => { if (!seen[r[0]]) { seen[r[0]] = 1; out.push(r[0]); } });
      return out;
    }
    // bar: هل يظهر شريط التشغيل فوق الصفحة
    startAyahPlay(n, bar) {
      clearInterval(this._ayT);
      const k = this.ayahIndexOf(n);
      this.setState({ ayPlay: n, ayProg: 0, ayPaused: false, ayahMenu: null,
                      ayBar: bar === undefined ? this.state.ayBar : !!bar,
                      ayahSel: k != null ? k : this.state.ayahSel });
      this._ayT = setInterval(() => {
        if (this.state.ayPaused) return;
        const p2 = (this.state.ayProg || 0) + 2;
        if (p2 >= 100) { this.nextAyahPlay(); return; }
        this.setState({ ayProg: p2 });
      }, 160);
    }
    // الانتقال إلى الآية التالية في الصفحة، فإن انتهت توقّف
    nextAyahPlay() {
      const nums = this.pageAyahNums();
      const i = nums.indexOf(this.state.ayPlay);
      if (i >= 0 && i < nums.length - 1) { this.startAyahPlay(nums[i + 1]); return; }
      this.stopAyahPlay();
    }
    stopAyahPlay() {
      clearInterval(this._ayT);
      this.setState({ ayPlay: null, ayProg: 0, ayPaused: false, ayBar: false, ayahSel: null });
    }
  
    isBoard() { return (this.props.view ?? "app") === "board"; }
  
    // ─── نظام ألوان الوضعين النهاري/الليلي ───
    th2() {
      if (!this.state.darkMode) return {
        page: "url(\"images/bg.png\") no-repeat; background-size:100% 100%; background-position:center", card: "#FFFFFF", sheet: "#FFFFFF", shadow: "0 4px 20px rgba(0,0,0,0.06)",
        text: "#132321", sub: "#6B7573", faint: "#9C9C9C",
        green: "#1589BC", green2: "#1589BC", srcText: "#2E5C4C",
        mint: "#F1F5F9", soft: "#F8FAFC", input: "#FBF8F2",
        border: "#E2E8F0", navBg: "#FFFFFF", navBorder: "#EEEEEE", navInactive: "#4D4D4D",
        paper: "#FFFDF7", paperBg: "#FBF6EC", paperBorder: "#EAE0C8",
        hint: "#F0F7FA", hl: "#F3ECD9", track: "#CBD5E1", cellToday: "#F1F5F9",
        chatBg: "linear-gradient(#F4F0E8, #FEF9F4)", toastBg: "#132321", toastText: "#FFFFFF",
        cardGrad: "linear-gradient(160deg,#FFFFFF 0%,#F1F6F3 100%)", cardGrad2: "linear-gradient(160deg,#FFFFFF 0%,#FBF6EC 100%)",
      };
      return {
        page: "#0F1E1A", card: "#182A25", sheet: "#1C2F29", shadow: "0 4px 20px rgba(0,0,0,0.38)",
        text: "#F1EEE6", sub: "#A6B3AC", faint: "#79857E",
        green: "#8FD0B4", green2: "#69B896", srcText: "#A8D8C2",
        mint: "#21392F", soft: "#243832", input: "#1E332C",
        border: "#2C4038", navBg: "#12211D", navBorder: "#233630", navInactive: "#8A948E",
        paper: "#1B2B23", paperBg: "#152420", paperBorder: "#34483C",
        hint: "#1E3B31", hl: "#413723", track: "#3A4A44", cellToday: "#21392F",
        chatBg: "linear-gradient(#0D1B17, #0F1E1A)", toastBg: "#F0F7FA", toastText: "#132321",
        cardGrad: "linear-gradient(160deg,#182A25 0%,#15312A 100%)", cardGrad2: "linear-gradient(160deg,#182A25 0%,#26200F 100%)",
      };
    }
  
    res(u) { const r = window.__resources; return (r && u && r[u]) || u; }
  
    // مسجد الهيرو المرتبط بالبلد — الحرم لمكة، النبوي للمدينة، وعشوائي إن تعدّدت المساجد
    pickMosque(cEn, city) {
      const mod = this.state.mod; if (!mod || !mod.MOSQUE_BY_COUNTRY) return null;
      const list = mod.MOSQUE_BY_COUNTRY[cEn];
      if (!list || !list.length) return null;
      if (list.length === 1) return list[0];
      if (cEn === "Saudi Arabia") {
        const mad = /المدينة|Madinah/.test(city || "");
        return list.find(m => mad ? m.src.indexOf("nabawi") !== -1 : m.src.indexOf("haram") !== -1) || list[0];
      }
      return list[Math.floor(Math.random() * list.length)];
    }
  
    // ─── القيم الأساسية ───
    coreVals() {
      const s = this.state, board = this.isBoard(), scr = s.screen, mod = s.mod;
      const T = this.th2();
      const en = s.lang === "en";
      const t = (a, b) => en ? b : a;
      const SCREENS = ["welcome","language","location","locationManual","prayerSettings","khatmahSetup",
        "home","notifications","calendar","prayer","monthTable","qibla","mushaf","quran","quranReader",
        "hadith","hadithDetail","tibyan","tracker","adhkar","more","khatmah","about","homeEn","prayerEn","moreEn"];
      const shown = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: T.page, overflow: "hidden" };
      const hidden = { display: "none" };
      const frame = { position: "relative", width: 402, height: 874, flexShrink: 0, borderRadius: 24, overflow: "hidden",
        display: "flex", flexDirection: "column", background: T.page, boxShadow: "0 12px 44px rgba(15,60,50,0.13)", border: "1px solid #E5DFD4" };
      const sty = {};
      SCREENS.forEach(k => { sty[k] = board ? frame : (scr === k ? shown : hidden); });
  
      const rootStyle = board
        ? "display:flex; flex-direction:column; gap:16px; padding:44px; background:#ECE6DD; min-height:100vh; align-items:flex-start"
        : "position:relative; width:402px; height:874px; margin:20px auto; border-radius:36px; overflow:hidden; box-shadow:0 30px 90px rgba(15,60,50,0.30), 0 0 0 10px #132321, 0 0 0 12px #3a3a3a; background:url(\"images/bg.png\") no-repeat; background-size:100% 100%; background-position:center";
  
      const mainTabs = ["home", "mushaf", "quran", "prayer", "adhkar", "hadith", "more", "about", "homeEn", "prayerEn", "moreEn"];
      const navBase = {
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", alignItems: "center",
        background: T.navBg, borderTop: "1px solid " + T.navBorder, height: 84, padding: "0 14px 8px", boxSizing: "border-box",
      };
      const navSty = board
        ? { ...navBase, position: "relative", width: 402, flexShrink: 0, borderRadius: 20, border: "1px solid #E5DFD4", boxShadow: "0 12px 44px rgba(15,60,50,0.13)", height: 96, paddingTop: 10 }
        : { ...navBase, position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 40, display: mainTabs.includes(scr) ? "grid" : "none" };
  
      const tabOf = { home: "home", homeEn: "home", mushaf: "quran", quran: "quran", quranReader: "quran",
        prayer: "prayer", prayerEn: "prayer", monthTable: "prayer", qibla: "prayer",
        adhkar: "adhkar", more: "more", about: "more", moreEn: "more" };
      const active = tabOf[scr] || "home";
      // التبويب النشط يأخذ تأثير الزر البارز (الدائرة الزرقاء) أيًّا كان، والباقي عادي
      const itemBase = "display:flex; flex-direction:column; align-items:center; cursor:pointer;";
      const btnOn = "width:52px; height:52px; border-radius:50%; background:#1589BC; border:4px solid " + T.page
        + ";  display:flex; justify-content:center; align-items:center; transition:transform .2s;";
      const btnOff = "display:flex; justify-content:center; align-items:center; transition:transform .2s;";
      const navItem = {}, navBtn = {}, navC = {}, navSz = {}, navTxt = {};
      ["home", "quran", "prayer", "adhkar", "more"].forEach(k => {
        const on = active === k;
        navItem[k] = itemBase + (on ? " margin-top:-26px;" : " gap:4px; padding-top:4px;");
        navBtn[k] = on ? btnOn : btnOff;
        navC[k] = on ? "#FFFFFF" : T.navInactive;
        navSz[k] = on ? 23 : 24;
        navTxt[k] = "font-size:10px; font-weight:700; color:" + (on ? T.green : T.navInactive) + ";"
          + (on ? " margin-top:3px;" : "");
      });
      const navL = en
        ? { home: "Home", quran: "Quran", pray: "Prayer", adhkar: "Adhkar", more: "Settings" }
        : { home: "الرئيسية", quran: "القرآن", pray: "الصلاة", adhkar: "الأذكار", more: "الإعدادات" };
  
      const toastOn = !!s.toast;
      const toastSty = "position:absolute; left:50%; bottom:112px; transform:translateX(-50%) translateY(" + (toastOn ? "0" : "16px") + "); background:" + T.toastBg + "; border-radius:999px; padding:10px 20px; z-index:60; box-shadow:0 10px 30px rgba(0,0,0,0.3); opacity:" + (toastOn ? 1 : 0) + "; transition:all .3s; pointer-events:none; white-space:nowrap";
  
      // شاشة اختيار الموقع
      const openC = s.openCountry;
      const MBC = mod ? (mod.MOSQUE_BY_COUNTRY || {}) : {};
      const CAR = mod ? (mod.COUNTRY_AR || {}) : {};
      const W = mod ? (mod.WORLD || []).filter(c2 => !!MBC[c2.en]) : [];
      let selCi = s.lmCountry;
      if (selCi == null && W.length) {
        const cn = s.cityName || "";
        const f2 = W.findIndex(c2 => c2.cities.some(cc => cn.indexOf(mod.cityLocal(cc)) === 0));
        if (f2 >= 0) selCi = f2;
      }
      const lmFilt = (s.lmFilter || "").trim().toLowerCase();
      const countryRows = W.map((c2, i) => ({ c2, i }))
        .filter(({ c2 }) => !lmFilt || c2.n.toLowerCase().indexOf(lmFilt) !== -1 || c2.en.toLowerCase().indexOf(lmFilt) !== -1 || (CAR[c2.en] || "").indexOf(lmFilt) !== -1)
        .map(({ c2, i }) => ({
          name: CAR[c2.en] && CAR[c2.en] !== c2.n ? CAR[c2.en] + " · " + c2.n : c2.n,
          check: i === selCi ? "block" : "none", bg: i === selCi ? T.mint : "transparent",
          pick: () => this.setState({ lmCountry: i, lmDrop: "city", lmFilter: "", lmPend: null, lmMosque: this.pickMosque(c2.en, null), langAsk: !c2.ar && this.state.lang !== "en" }),
        }));
      const effCity = s.lmPend || s.cityName || "";
      const lmCityRows = (selCi != null && W[selCi] ? W[selCi].cities : []).map(cc => {
        const loc = mod.cityLocal(cc);
        const isSel = effCity.indexOf(loc) === 0;
        return {
          name: loc, check: isSel ? "block" : "none", bg: isSel ? T.mint : "transparent",
          pick: () => this.setState({ lmPend: loc + t("، ", ", ") + W[selCi].n, lmDrop: null, lmMosque: this.pickMosque(W[selCi].en, loc) }),
        };
      });
      const lmSelCity = (() => { const cn = effCity; if (selCi != null && W[selCi]) { const hit = W[selCi].cities.find(cc => cn.indexOf(mod.cityLocal(cc)) === 0); if (hit) return mod.cityLocal(hit); } return null; })();
      const lmM = s.lmMosque || s.heroMosque || null;
      // ── بحث المدن العالمي (باسم المدينة، بلا تكرار) ──
      const lmQ = (s.lmSearch || "").trim().toLowerCase();
      const lmSeen = {}, lmResults = [];
      if (lmQ) {
        for (let wi = 0; wi < W.length && lmResults.length < 12; wi++) {
          const c2 = W[wi];
          for (let ci = 0; ci < c2.cities.length; ci++) {
            const cc = c2.cities[ci];
            const loc = mod.cityLocal(cc), enN = mod.cityEn ? mod.cityEn(cc) : "";
            if ((loc + " " + enN).toLowerCase().indexOf(lmQ) === -1) continue;
            const label = loc + t("، ", ", ") + c2.n;
            if (lmSeen[label]) continue;
            lmSeen[label] = 1;
            const isSel = (s.lmPend || "") === label;
            lmResults.push({
              name: label, check: isSel ? "block" : "none", bg: isSel ? T.mint : "transparent",
              // من نافذة الرئيسية: الاختيار يثبّت الموقع فورًا ويُغلق
              pickNow: () => {
                this.set({ cityName: label, heroMosque: this.pickMosque(c2.en, loc) });
                this.setState({ locOpen: false, lmSearch: "", lmDrop: null, lmAuto: null,
                                ptTimes: null, ptMonth: null }, () => this.fetchTimes());
                this.showToast(t("تم تحديد الموقع: ", "Location set: ") + label);
              },
              pick: () => this.setState({
                lmPend: label, lmSearch: label, lmDrop: null, lmAuto: null,
                lmMosque: this.pickMosque(c2.en, loc),
              }),
            });
            if (lmResults.length >= 12) break;
          }
        }
      }
      const lmListOpen = s.lmDrop === "search" && !!lmQ;

      const asrRows = [
        { key: "jomhor", name: t("جمهور العلماء", "Majority (Jumhur)") },
        { key: "hanafi", name: t("المذهب الحنفي", "Hanafi School") },
      ].map(r => ({
        name: r.name, check: s.asrMethod === r.key ? "block" : "none",
        bg: s.asrMethod === r.key ? T.mint : "transparent",
        pick: () => { this.set({ asrMethod: r.key }); this.setState({ asrDrop: false }); },
      }));

      const lmVals = {
        lmSearch: s.lmSearch || "",
        setLmSearch: e => this.setState({ lmSearch: e.target.value, lmDrop: "search", lmPend: null }),
        // ── نافذة الموقع من الرئيسية ──
        locOn: !!s.locOpen,
        openLocPop: () => this.setState({ locOpen: true, lmSearch: "", lmDrop: null }),
        locClose: () => this.setState({ locOpen: false }),
        locAuto: () => {
          const city = t("عمّان", "Amman"), country = t("الاردن", "Jordan");
          const label = city + t("، ", ", ") + country;
          this.set({ cityName: label, heroMosque: this.pickMosque("Amman", "عمّان") });
          this.setState({
            lmAuto: t("تم تحديد موقعك تلقائياً: (المملكة الاردنية الهاشمية - عمّان)",
                      "Location detected automatically: (Jordan - Amman)"),
            lmSearch: "", lmDrop: null, ptTimes: null, ptMonth: null,
          }, () => this.fetchTimes());
        },
        lmResults, lmListOn: lmListOpen && lmResults.length > 0,
        lmEmptyOn: lmListOpen && lmResults.length === 0,
        lmAutoOn: !!s.lmAuto, lmAutoText: s.lmAuto || "",
        lmAutoDetect: () => {
          const city = t("عمّان", "Amman"), country = t("الاردن", "Jordan");
          this.setState({
            lmAuto: t("تم تحديد موقعك تلقائياً: (المملكة الاردنية الهاشمية - عمّان)",
                      "Location detected automatically: (Jordan - Amman)"),
            lmPend: city + t("، ", ", ") + country, lmSearch: "", lmDrop: null,
            lmMosque: this.pickMosque("Amman", "عمّان"),
          });
        },
        asrDropOn: !!s.asrDrop, asrRot: s.asrDrop ? 180 : 0, asrRows,
        asrLabel: s.asrMethod === "hanafi" ? t("المذهب الحنفي", "Hanafi School") : t("جمهور العلماء", "Majority (Jumhur)"),
        toggleAsrDrop: () => this.setState({ asrDrop: !this.state.asrDrop, lmDrop: null }),
        // ── خطوتا شاشة البداية ──
        obStep1: (s.obStep || 1) === 1,
        obStep2: (s.obStep || 1) === 2,
        obDot1: (s.obStep || 1) === 1 ? "#1589BC" : "#CBD5E1",
        obDot2: (s.obStep || 1) === 2 ? "#1589BC" : "#CBD5E1",
        obBtnLabel: (s.obStep || 1) === 1 ? t("التالي", "Next") : t("ابدأ رحلتك مع فذَكِّر", "Start your journey with Fadhakkir"),
        obNext: () => {
          if ((this.state.obStep || 1) === 1) {
            const pick = s.lmPend || null;
            if (!pick) { this.showToast(t("حدّد موقعك أولاً", "Set your location first")); return; }
            this.set({ cityName: pick, heroMosque: this.state.lmMosque || this.state.heroMosque });
            this.setState({ obStep: 2, lmDrop: null, ptTimes: null, ptMonth: null }, () => this.fetchTimes());
            return;
          }
          this.setState({ obStep: 1, lmPend: null, lmDrop: null, lmAuto: null, lmSearch: "" });
          this.tab("home");
        },
        lmStart: () => {
          const pick = s.lmPend || null;
          if (!pick) { this.showToast(t("حدّد موقعك أولاً", "Set your location first")); return; }
          this.set({ cityName: pick, heroMosque: this.state.lmMosque || this.state.heroMosque });
          this.setState({ lmPend: null, lmDrop: null, lmAuto: null, lmSearch: "", ptTimes: null, ptMonth: null },
                        () => this.fetchTimes());
          this.showToast(t("تم تحديد الموقع: ", "Location set: ") + pick);
          this.tab("home");
        },

        cityRows: lmCityRows,
        lmMosqueOn: !!lmM, lmMosqueBg: lmM ? "url(" + this.res(lmM.src) + ")" : "none", lmMosqueName: lmM ? lmM.name : "",
        lmCountryOpen: s.lmDrop === "country", lmCityOpen: s.lmDrop === "city" && selCi != null,
        lmCountryLabel: selCi != null && W[selCi] ? (CAR[W[selCi].en] && CAR[W[selCi].en] !== W[selCi].n ? CAR[W[selCi].en] + " · " + W[selCi].n : W[selCi].n) : t("اختر البلد", "Select country"),
        lmCityLabel: lmSelCity || t("اختر المدينة", "Select city"),
        lmCountryColor: selCi != null ? T.text : T.faint,
        lmCityColor: lmSelCity ? T.text : T.faint,
        lmCountryRot: s.lmDrop === "country" ? 180 : 0, lmCityRot: s.lmDrop === "city" ? 180 : 0,
        lmCityOpacity: selCi != null ? "1" : "0.55",
        lmToggleCountry: () => this.setState({ lmDrop: this.state.lmDrop === "country" ? null : "country", lmFilter: "" }),
        lmToggleCity: () => { if (selCi == null) { this.showToast(t("اختر البلد أولاً", "Select a country first")); return; } this.setState({ lmDrop: this.state.lmDrop === "city" ? null : "city" }); },
        lmConfirmOp: lmSelCity ? "1" : "0.42",
        lmSummary: lmSelCity
          ? t("الموقع المختار: ", "Selected location: ") + effCity
          : t("اختر البلد ثم المدينة لضبط أوقات الصلاة", "Pick a country then a city to set prayer times"),
        lmConfirm: () => {
          if (!lmSelCity) { this.showToast(t("اختر مدينتك أولاً", "Select your city first")); return; }
          this.set({ cityName: effCity, heroMosque: this.state.lmMosque || this.state.heroMosque });
          this.setState({ lmPend: null, lmDrop: null, ptTimes: null, ptMonth: null }, () => this.fetchTimes());
          this.showToast(t("تم تحديث الموقع إلى ", "Location set to ") + effCity);
          const stk = this.state.stack;
          if (stk.length && stk[stk.length - 1] === "location") this.tab("home"); else this.back();
        },
        lmFilter: s.lmFilter || "",
        setLmFilter: e => this.setState({ lmFilter: e.target.value }),
        lmNoMatch: countryRows.length === 0,
        langAskOn: !!s.langAsk,
        langYes: () => this.setState(st => ({ lang: "en", langAsk: false, stack: st.stack.map(x => ({ home: "homeEn", prayer: "prayerEn", more: "moreEn" })[x] || x) }), () => this.persist()),
        langNo: () => this.setState({ langAsk: false }),
      };
      const countries = mod ? (en ? mod.COUNTRIES_EN : mod.COUNTRIES) : [];
      const _oldCountryRows = countries.map((c, i) => ({
        name: c.c, open: openC === i, rot: openC === i ? 180 : 0,
        toggle: () => this.setState({ openCountry: openC === i ? null : i }),
        cityRows: c.cities.map(ci => {
          const isSel = s.cityName.indexOf(ci) === 0;
          return {
            name: ci, bg: isSel ? "#1589BC" : T.card, color: isSel ? "#FFFFFF" : T.green2, border: isSel ? "#1589BC" : T.mint,
            pick: () => { this.set({ cityName: ci + t("، ", ", ") + c.c }); this.setState({ ptTimes: null, ptMonth: null }, () => this.fetchTimes()); this.showToast(t("تم اختيار ", "Selected ") + ci); setTimeout(() => this.go("prayerSettings"), 500); },
          };
        }),
      }));
  
      const prefs = [["صوت المؤذن", "Muezzin voice"], ["الصوت الافتراضي للإشعارات", "Default notification sound"], ["صامت", "Silent"]];
      const athanPrefRows = prefs.map(p => ({
        label: t(p[0], p[1]), ring: s.athanPref === p[0] ? T.green : T.faint, dot: s.athanPref === p[0] ? T.green : "transparent",
        pick: () => this.set({ athanPref: p[0] }),
      }));
      const jom = s.asrMethod === "jomhor";
      const khatmahDays = Math.ceil(604 / s.khatmahPages);
      const months = (khatmahDays / 30).toFixed(1).replace(".0", "");
  
      // ─── نصوص الواجهة (عربي / إنجليزي) ───
      const X = {
        tagline: t("رفيقك اليومي للقرآن والصلاة والذكر", "Your daily companion for Quran, Prayer & Dhikr"),
        startJourney: t("ابدأ الرحلة", "Begin the Journey"),
        locTitle: t("السماح بالوصول إلى الموقع", "Allow Location Access"),
        locBody: t("نستخدم موقعك لحساب مواقيت الصلاة واتجاه القبلة بدقة وفق الحسابات الفلكية لمنطقتك", "We use your location to calculate prayer times and Qibla direction precisely for your region"),
        locAllow: t("السماح بتحديد الموقع", "Allow Location"),
        locManual: t("لا، سأختار موقعي يدوياً", "No, I'll choose manually"),
        lmTitle: t("اختيار الموقع يدوياً", "Choose Location Manually"),
        lmCountryL: t("البلد", "Country"), lmCityL: t("المدينة", "City"),
        adhTitleScr: t("الأذكار", "Adhkar"),
        adhBook: t("كتاب حصن المسلم", "Hisn al-Muslim"),
        adhRep: t("تكرار", "Repeat"),
        adhNone: t("لم تُضَف أذكار هذا القسم بعد", "This section has no adhkar yet"),
        stAbout2: t("الإعدادات", "Settings"),
        abWhyT: t("لماذا فَذَكِّر؟", "Why Fadhakkir?"),
        abWhyP: t("«فَذَكِّرْ إِنَّمَا أَنْتَ مُذَكِّرٌ» — من هذه الآية جاء الاسم. التذكير هو ما يحتاجه القلب "
                  + "كل يوم: آيةٌ تُقرأ، وصلاةٌ تُقام، وتسبيحةٌ تُقال. بُني فذَكِّر ليكون هادئاً بلا إعلانات ولا "
                  + "تشتيت، يعمل دون اتصال، ويحفظ خصوصيتك كاملة.",
                  "\u00abSo remind, you are only a reminder\u00bb — the name comes from this ayah. "
                  + "Fadhakkir is built to stay quiet: no ads, no distractions, works offline, "
                  + "and keeps your privacy intact."),
        abCopy: t("حقوق الملكية", "Copyright"),
        abContact: t("تواصل معنا", "Contact us"),
        abShare: t("مشاركة التطبيق", "Share the app"),
        stLocSec: t("إعدادات الموقع", "Location settings"),
        stPraySec: t("إعدادات مواقيت الصلاة", "Prayer time settings"),
        stAuthL: t("تفضيلات وقت الآذان", "Athan time preference"),
        stAsrL: t("طريقة حساب وقت العصر", "Asr calculation method"),
        stAbout: t("عن التطبيق", "About the app"),
        stDua: t("«رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ»",
                 "\u00abOur Lord, accept from us. Indeed, You are the Hearing, the Knowing\u00bb"),
        stVer: t("إصدار 1.0.0 · نموذج تصميمي", "Version 1.0.0 · design prototype"),
        lnTitle: t("الاستماع", "Listen"),
        lnSub: t("اختر من القائمة ما تريد الاستماع إليه", "Pick what you want to listen to"),
        lnBtn: t("استماع", "Listen"),
        qsTitle: t("إعدادات القرآن والتفسير", "Quran & tafsir settings"),
        qsRecL: t("اختيار القارئ", "Choose reciter"),
        qsTafL: t("اختيار التفسير", "Choose tafsir"),
        dlListTitle: t("قائمة السور المنزّلة", "Downloaded surahs"),
        dlListNone: t("لا توجد تلاوات منزّلة بعد", "No downloads yet"),
        savedTitle: t("قائمة المحفوظات", "Saved list"),
        savedNone: t("لا توجد صفحات محفوظة بعد", "No saved pages yet"),
        savedDel: t("حذف", "Delete"),
        qListTitle: t("قائمة السور", "Surah list"),
        tafShare: t("مشاركة", "Share"),
        lsTitle: t("الاستماع للآية", "Listen to the ayah"),
        lsMsg: t("هل تريد تنزيل السورة للاستماع للآية ؟", "Download the surah to listen to this ayah?"),
        lsYes: t("نعم", "Yes"), lsNo: t("لا", "No"),
        tafBookL: t("كتاب التفسير المعتمد", "Reference tafsir book"),
        tafTextL: t("نص التفسير", "Tafsir text"),
        mSearchPh: t("ابحث في المصحف — آية أو كلمة…", "Search the Mushaf — ayah or word…"),
        mPageWord: t("صفحة", "Page"), mOfWord: t("من", "of"),
        ptSaveSettings: t("حفظ الإعدادات", "Save settings"),
        ptCancel: t("إلغاء", "Cancel"),
        homeContinue: t("متابعة القراءة", "Continue reading"),
        homePlanSub: t("اختر مدة الختمة لتوزيع ورد القراءة اليومي",
                       "Pick a khatmah duration to split your daily reading"),
        homeWirdBtn: t("متابعة الورد في المصحف الشريف", "Continue in the Mushaf"),
        lmSection: t("الموقع", "Location"),
        obQuranSec: t("إعدادات القرآن والتفسير", "Quran & tafsir settings"),
        obRecL: t("القارئ", "Reciter"),
        obTafL: t("التفسير", "Tafsir"),
        lmAutoBtn: t("تحديد الموقع تلقائياً", "Detect location automatically"),
        lmSearchPh: t("البحث باسم المدينة", "Search by city name"),
        lmNoCity: t("لا توجد مدينة بهذا الاسم", "No city matches that name"),
        lmAsrTitle: t("طريقة حساب وقت العصر", "Asr calculation method"),
        lmStart: t("ابدأ رحلتك مع فذَكِّر", "Start your journey with Fadhakkir"),
        lmConfirm: t("تأكيد الموقع", "Confirm location"),
        lmFilterPh: t("ابحث عن بلدك…", "Search your country…"),
        lmNoMatch: t("لا توجد نتائج مطابقة", "No matching results"),
        lmSearch: t("ابحث عن بلدك أو مدينتك…", "Search for your country or city…"),
        psTitle: t("إعدادات مواقيت الصلاة", "Prayer Times Settings"),
        psSub: t("يمكن تعديلها لاحقاً من صفحة الإعدادات", "You can change these later from Settings"),
        psAthanPref: t("تفضيل تنبيه الأذان", "Athan Alert Preference"),
        psAsrTitle: t("حساب وقت العصر — الأسلوب الشرعي", "Asr Calculation — Juristic Method"),
        asrJomhor: t("جمهور العلماء", "Majority (Jumhur)"),
        asrHanafi: t("المذهب الحنفي", "Hanafi School"),
        psAsrNote: t("الجمهور: ظل الشيء مثلُه · الحنفي: ظل الشيء مثلاه", "Jumhur: shadow equals the object · Hanafi: twice the object"),
        psHighLat: t("خطوط العرض العليا", "Higher Latitudes"),
        psHighLatSub: t("تقدير مواقيت الفجر والعشاء في المناطق القطبية", "Estimate Fajr & Isha in polar regions"),
        continueBtn: t("متابعة", "Continue"),
        ksQ: t("كم صفحة تستطيع قراءتها يومياً؟", "How many pages can you read per day?"),
        ksPerDay: t("صفحات / يوم", "pages / day"),
        ksMin: t("صفحة واحدة", "1 page"), ksMax: t("20 صفحة", "20 pages"),
        ksEstimate: t("ستختم القرآن الكريم خلال", "You'll complete the Quran in"),
        ksStart: t("ابدأ الخطة وانتقل للرئيسية", "Start the Plan & Go Home"),
        ksSkip: t("تخطي الآن", "Skip for now"),
        notifTitle: t("التنبيهات", "Notifications"),
        markAll: t("تعليم الكل كمقروء", "Mark all as read"),
        calScreen: t("التقويم", "Calendar"),
        calSelected: t("التاريخ المحدد", "Selected Date"),
        calHijriBtn: t("التقويم الهجري", "Hijri Calendar"),
        calGregBtn: t("التقويم الميلادي", "Gregorian Calendar"),
        calNote: t("انقر على أي يوم لعرض مقابله الهجري والميلادي · تقويم أم القرى", "Tap any day to see its Hijri & Gregorian date · Umm al-Qura calendar"),
        prayerTimes: t("مواقيت الصلاة", "Prayer Times"),
        nightTitle: t("تنبيه قيام الليل", "Night Prayer Alert"),
        nightSub: t("تذكير قبل الفجر بساعة ونصف — الثلث الأخير", "Reminder 1.5h before Fajr — the last third"),
        athanSoundT: t("صوت الأذان", "Athan Sound"),
        sheetTitle: t("اختيار صوت الأذان", "Choose Athan Sound"),
        sheetSub: t("يُشغَّل عند دخول وقت كل صلاة مفعّلة", "Plays when each enabled prayer time begins"),
        viewMonth: t("جدول مواقيت الصلاة للشهر كاملاً", "Full month prayer timetable"),
        mtTitle: t("مواقيت الشهر", "Monthly Timetable"),
        mtDay: t("اليوم", "Day"),
        fajr: t("الفجر", "Fajr"), dhuhr: t("الظهر", "Dhuhr"), asr: t("العصر", "Asr"), maghrib: t("المغرب", "Maghrib"), isha: t("العشاء", "Isha"),
        qibla: t("اتجاه القبلة", "Qibla Direction"),
        qN: t("ش", "N"), qS: t("ج", "S"), qW: t("غ", "W"), qE: t("ق", "E"),
        qNE: t("شمال شرق", "North-East"),
        qDist: t("المسافة إلى الكعبة المشرّفة: أنت في مكة المكرمة 🕋", "Distance to the Holy Kaaba: you are in Makkah 🕋"),
        qTip: t("ضع هاتفك بشكل أفقّي ثم قم بتحريك الجهاز بشكل نصف دائري.", "Lay your phone flat, away from metal, and point the arrow toward the Kaaba"),
        quranTitle: t("القرآن الكريم", "The Holy Quran"),
        qLoadingTxt: t("جارِ تحميل السورة…", "Loading surah…"),
        qErrTxt: t("تعذّر تحميل السورة — تحقق من اتصالك بالإنترنت", "Couldn't load the surah — check your internet connection"),
        qRetry: t("إعادة المحاولة", "Retry"),
        qSearchPh: t("ابحث عن سورة…", "Search for a surah…"),
        rSearchPh: t("ابحث في المصحف — سورة أو كلمة…", "Search the Mushaf — surah or word…"),
        rSearching: t("جارِ البحث في المصحف كاملاً…", "Searching the whole Mushaf…"),
        qNoResults: t("لا توجد نتائج مطابقة", "No matching results"),
        hLoadingTxt: t("جارِ تحميل الكتاب كاملًا (مرة واحدة فقط)…", "Loading the full book (one time only)…"),
        hErrTxt: t("تعذّر تحميل الكتاب — تحقق من اتصالك بالإنترنت", "Couldn't load the book — check your connection"),
        hRetry: t("إعادة المحاولة", "Retry"),
        hAllBooks: t("كل الكتب", "All books"),
        lastRead: t("آخر قراءة", "Last read"),
        surahsTab: t("السور", "Surahs"), juzTab: t("الأجزاء", "Juz"), savedTab: t("المحفوظات", "Saved"),
        pageWord: t("صفحة", "Page"),
        savedPos: t("سورة الفاتحة · الصفحة 1", "Al-Fatihah · Page 1"),
        savedPosSub: t("آخر موضع قراءة محفوظ", "Last saved reading position"),
        prevPage: t("السورة السابقة", "Prev Surah"), nextPage: t("السورة التالية", "Next Surah"),
        tipTitle: t("تنقّل بين الصفحات بسهولة", "Move between pages with ease"),
        tipSub: t("اسحب الصفحة يميناً للصفحة التالية ويساراً للعودة، أو استخدم الأسهم الجانبية", "Swipe right for the next page, left to go back — or use the side arrows"),
        tipBtn: t("فهمت", "Got it"),
        dlOpenRead: t("انقر للقراءة", "Tap to read"),
        wirdToday: t("وِرد اليوم", "Today's Wird"),
        wirdAuto: t("كل صفحة تُحتسب تلقائياً في الوِرد", "Every page counts toward your wird"),
        rsTitle: t("إعدادات التلاوة والتفسير", "Recitation & Tafsir Settings"),
        rsReciter: t("القارئ", "Reciter"), rsTafsir: t("كتاب التفسير", "Tafsir Book"), rsFont: t("حجم الخط", "Font Size"), rsTypeface: t("خط المصحف", "Mushaf Font"), rsLine: t("تباعد الأسطر", "Line Spacing"),
        listenWord: t("استماع", "Listen"),
        hadithTitle: t("الأحاديث النبوية", "Prophetic Hadiths"),
        hdTitle: t("شرح الحديث", "Hadith Explanation"),
        hdExplain: t("الشرح الميسّر", "Simplified Explanation"),
        abTitle: t("عن التطبيق", "About"),
        abName: t("فذَكِّر", "Fadhakkir"),
        abTag: t("رفيقك اليومي للقرآن والصلاة والذكر", "Your daily companion for Quran, Prayer & Dhikr"),
        abVer: t("النسخة التجريبية ١٫٠", "Beta 1.0"),
        abStoryTitle: t("لماذا فذَكِّر؟", "Why Fadhakkir?"),
        abStory: t("«فَذَكِّرْ إِنَّمَا أَنتَ مُذَكِّرٌ» — من هذه الآية جاء الاسم. التذكير هو ما يحتاجه القلب كل يوم: آية تُقرأ، وصلاة تُقام، وتسبيحة تُقال. بُني فذَكِّر ليكون هادئاً بلا إعلانات ولا تشتيت، يعمل دون اتصال، ويحفظ خصوصيتك كاملة.", "\u201CSo remind — you are only one who reminds\u201D (Al-Ghashiyah 21). The name comes from this ayah. A reminder is what the heart needs every day: an ayah read, a prayer kept, a tasbihah said. Fadhakkir is built to be quiet: no ads, no distractions, works offline, and keeps your data on your device."),
        abWhatTitle: t("ما يقدّمه فذَكِّر", "What Fadhakkir offers"),
        abSrcTitle: t("المصادر والمراجع", "Sources & references"),
        abMoreTitle: t("المزيد", "More"),
        abDua: t("«ربَّنا تقبَّل منَّا إنَّك أنت السَّميع العليم»", "\u201COur Lord, accept from us — You are the Hearing, the Knowing.\u201D"),
        abCopy: t("صُنع بعناية · ١٤٤٨ هـ", "Crafted with care · 2026"),
        abBuild: t("إصدار 1.0.0 · نموذج تصميمي", "Build 1.0.0 · design prototype"),
        tibyanName: t("تبيان", "Tibyan"),
        tibyanSub: t("مساعدك الذكي · يجيب من القرآن والسنة الصحيحة", "Your smart assistant · answers from Quran & authentic Sunnah"),
        tibyanPh: t("اسأل عن تفسير آية أو حديث", "Ask about an ayah's tafsir or a hadith"),
        trTitle: t("إنجازات اليوم", "Today's Progress"),
        trQuote: t("أكمل مهامك اليومية لبناء عادة ثابتة — «أحبُّ الأعمال إلى الله أدومها وإن قلّ»", "Complete your daily tasks to build a lasting habit — \"The most beloved deeds to Allah are the most consistent, even if small\""),
        trPrayers: t("الصلوات الخمس", "The Five Prayers"),
        logPage: t("+ سجّل صفحة", "+ Log a page"),
        openMushaf: t("افتح المصحف", "Open Mushaf"),
        trAdhkar: t("الأذكار والتسبيح", "Adhkar & Tasbih"),
        openAdhkar: t("افتح المسبحة والأذكار", "Open Tasbih & Adhkar"),
        adhkarTitle: t("الأذكار والمسبحة", "Adhkar & Tasbih"),
        morningT: t("أذكار الصباح", "Morning Adhkar"), eveningT: t("أذكار المساء", "Evening Adhkar"),
        dhikrWord: t("الذكر", "Dhikr"), ofWord: t("من", "of"),
        tapDhikr: t("انقر للتسبيح", "tap to count"),
        prevBtn: t("السابق", "Previous"), nextBtn: t("التالي", "Next"),
        khPlanTitle: t("خطة ختمة القرآن", "Quran Khatmah Plan"),
        khCurrent: t("الختمة الحالية", "Current Khatmah"),
        dayWord: t("اليوم", "Day"),
        khDuration: t("مدة الخطة", "Plan Duration"),
        doneSoFar: t("أكملت حتى الآن:", "Completed so far:"),
        readNow: t("اقرأ الآن", "Read now"),
        khRestart: t("إعادة ضبط الخطة والبدء من جديد", "Reset plan & start over"),
        share: t("مشاركة", "Share"), done: t("تم", "Done"),
        wird: t("وِرد القرآن", "Quran Wird"),
        rowHint: t("انقر على أي صلاة لضبط تنبيهها وصوت المؤذن الخاص بها", "Tap any prayer to set its alert & muezzin voice"),
        muezzinPick: t("صوت المؤذن", "Muezzin Voice"),
        sunriseAlertT: t("تنبيه شروق الشمس", "Sunrise Alert"),
        sunriseAlertSub: t("بصوت المؤذن — «الصلاة خير من النوم»", "Muezzin voice — “Prayer is better than sleep”"),
        qiyamSub: t("اختر ساعة التنبيه في الثلث الأخير", "Pick the alert hour in the last third"),
        dlTab: t("المنزّلة", "Downloads"),
        amTafsirL: t("تفسير الآية", "Tafsir of the ayah"),
        amListenL: t("الاستماع", "Listen"),
        amShareL: t("مشاركة", "Share"),
        amMaaniL: t("المعنى بالكلمة", "Word-by-word meaning"),
        amAsbabL: t("أسباب النزول", "Occasion of revelation"),
        amSaveL: t("حفظ", "Save"),
        amPickRec: t("اختر القارئ", "Choose a reciter"),
        amDlBtn: t("تنزيل للاستماع", "Download to listen"),
        amCancelL: t("إلغاء", "Cancel"),
        amNoMaani: t("لا توجد مفردات مشروحة لهذه الآية", "No word notes for this ayah"),
        dlTitle: t("تنزيل السورة للاستماع أوفلاين", "Download Surah for Offline"),
        dlBtn: t("تنزيل السورة", "Download Surah"),
        dlHint: t("السور المنزّلة تُشغَّل دون اتصال بالإنترنت بصوت القارئ الذي اخترته عند التنزيل", "Downloaded surahs play offline with the reciter you chose"),
        dlEmptyTxt: t("لا توجد سور منزّلة بعد — افتح أي سورة واضغط زر التنزيل أعلى الصفحة", "No downloads yet — open a surah and tap the download button"),
        offlineBadge: t("أوفلاين", "Offline"),
        savedAyahsT: t("الآيات المحفوظة", "Saved Ayahs"),
        savedHadithsT: t("الأحاديث المحفوظة", "Saved Hadiths"),
        noSavedAyahs: t("لا توجد آيات محفوظة بعد — احفظ آية من المصحف", "No saved ayahs yet — save one from the Mushaf"),
        noSavedHadiths: t("لا توجد أحاديث محفوظة بعد", "No saved hadiths yet"),
        saveAyahT: t("حفظ الآية", "Save Ayah"),
        qWordLoading: t("جارِ تحميل نص المصحف للبحث بالمفردات…", "Loading Quran text for word search…"),
      };
  
      return {
        T, rootStyle, sty, navSty, navC, navL, navItem, navBtn, navSz, navTxt,
        toastSty, toastMsg: s.toast || "",
        X, dirA: en ? "ltr" : "rtl",
        // سهم رجوع طويل — يتّجه يمينًا في العربية ويسارًا في الإنجليزية
        chevBack: en ? "M20 12 H4 M10 6.5 L4.5 12 L10 17.5"
                     : "M4 12 H20 M14 6.5 L19.5 12 L14 17.5",
        chevMore: en ? "M9 6 L15 12 L9 18" : "M15 6 L9 12 L15 18",
        qDistTxt: (() => {
          const d = this.kaabaDist();
          if (d == null) return t("جارٍ حساب المسافة إلى الكعبة المشرّفة…", "Calculating distance to the Holy Kaaba…");
          const num = d < 10 ? d.toFixed(1) : String(Math.round(d));
          const ar = num.replace(/[0-9]/g, c => "٠١٢٣٤٥٦٧٨٩"[+c]).replace(".", "٫");
          return t("المسافة إلى الكعبة المشرّفة: " + ar + " كم", "Distance to the Holy Kaaba: " + num + " km");
        })(),
        grpSty: board ? "display:flex; flex-direction:column; gap:14px" : "display:contents",
        grpLbl: board ? "display:block; font-size:16px; font-weight:700; color:#1589BC; margin-top:18px" : "display:none",
        rowSty: board ? "display:flex; flex-direction:row; flex-wrap:wrap; gap:28px; align-items:flex-start" : "display:contents",
        // تنقل
        tabHome: () => this.tab("home"), tabQuran: () => this.tab("mushaf"),
        tabAdhkar: () => this.tab("adhkar"), tabPray: () => this.tab("prayer"),
        tabHadith: () => this.tab("hadith"), tabMore: () => this.tab("more"),
        backFn: () => this.back(),
        goLanguage: () => this.go("language"),
        goKhatmahSetup: () => this.go("khatmahSetup"),
        pickArabic: () => {
          const back = s.langReturn === "more";
          this.setState({ lang: "ar", langReturn: null, messages: mod ? mod.TIBYAN_SEED.map(m => ({ ...m })) : s.messages }, () => {
            this.persist();
            if (back) { this.tab("more"); this.showToast("تم تغيير اللغة إلى العربية"); } else this.go("location");
          });
        },
        pickEnglish: () => {
          const back = s.langReturn === "more";
          this.setState({ lang: "en", langReturn: null, messages: mod ? mod.TIBYAN_SEED_EN.map(m => ({ ...m })) : s.messages }, () => {
            this.persist();
            if (back) { this.tab("more"); this.showToast("Language changed to English"); } else this.go("location");
          });
        },
        allowLocation: () => { this.set({ cityName: t("مكة المكرمة، السعودية", "Makkah, Saudi Arabia"), heroMosque: this.pickMosque("Saudi Arabia", "مكة المكرمة") }); this.setState({ ptTimes: null, ptMonth: null }, () => this.fetchTimes()); this.showToast(t("تم تحديد الموقع: مكة المكرمة", "Location set: Makkah")); this.tab("home"); },
        rejectLocation: () => this.go("locationManual"),
        countryRows, ...lmVals, athanPrefRows,
        pickAsrJomhor: () => this.set({ asrMethod: "jomhor" }), pickAsrHanafi: () => this.set({ asrMethod: "hanafi" }),
        asrJomhorBg: jom ? "#1589BC" : T.card, asrJomhorColor: jom ? "#FFFFFF" : T.green2, asrJomhorBorder: jom ? "#1589BC" : T.mint,
        asrHanafiBg: !jom ? "#1589BC" : T.card, asrHanafiColor: !jom ? "#FFFFFF" : T.green2, asrHanafiBorder: !jom ? "#1589BC" : T.mint,
        toggleHighLat: () => this.set({ highLat: !s.highLat }),
        highLatBg: s.highLat ? "#1589BC" : T.track, highLatJustify: (s.highLat !== en) ? "flex-start" : "flex-end",
        khatmahPages: s.khatmahPages, khatmahPagesTxt: String(s.khatmahPages),
        setKhatmahPages: e => this.set({ khatmahPages: +e.target.value, wirdGoal: +e.target.value }),
        khatmahEstimate: t(khatmahDays + " يوماً ≈ " + months + " أشهر", khatmahDays + " days ≈ " + months + " months"),
        finishOnboarding: () => { this.set({ wirdGoal: s.khatmahPages }); this.tab("home"); this.showToast(s.lang === "en" ? "Welcome to Fadhakkir" : "أهلاً بك في فذَكِّر"); },
        heroVariant: this.props.heroVariant ?? "horizon",
        previewPrayer: this.props.previewPrayer ?? "auto",
        athanOn: s.athanOn,
        athanStateTxt: t(s.athanOn ? "مفعّل" : "متوقف", s.athanOn ? "On" : "Off"),
        athanStateTxtEn: s.athanOn ? "On" : "Off",
        athanStateColor: s.athanOn ? "#1589BC" : "#CA5936",
        toggleAthan: () => { this.set({ athanOn: !s.athanOn }); this.showToast(!s.athanOn ? t("تم تفعيل تنبيه الأذان", "Athan alert enabled") : t("تم إيقاف تنبيه الأذان", "Athan alert disabled")); },
        goQibla: () => this.go("qibla"), goPrayerTab: () => this.tab("prayer"), goTibyan: () => this.go("tibyan"),
      };
    }
  
    renderVals() {
      return Object.assign({}, this.coreVals(),
        this.homeVals ? this.homeVals() : {},
        this.prayerVals ? this.prayerVals() : {},
        this.quranVals ? this.quranVals() : {},
        this.hadithVals ? this.hadithVals() : {},
        this.moreVals ? this.moreVals() : {},
        this.enVals ? this.enVals() : {});
    }
  
    // ─── قيم النسخة الإنجليزية ───
    enVals() {
      const s = this.state, mod = s.mod;
      const T = this.th2();
      if (!mod) return { timesRowsEn: [], moreRowsEn: [], wirdLabelEn: "", wirdPctTxtEn: "" };
      const PT = this.times();
      const st = mod.getPrayerState(s.now, PT);
      const ICONS = this.prayerIcons();
      const nextAthanKey = st.nextKey === "sunrise" ? "dhuhr" : st.nextKey;
      const timesRowsEn = mod.PRAYER_META.filter(p => p.key !== "sunrise").map(p => {
        const isNext = p.key === nextAthanKey;
        const remMin = Math.round((mod.toMin(PT[p.key]) - st.nowMin + 1440) % 1440);
        return {
          icon: ICONS[p.key], iconBg: isNext ? T.green : T.mint, iconC: isNext ? T.card : T.green, name: p.en,
          time: mod.fmt12(PT[p.key], "en"), ap: mod.ampm(PT[p.key], "en"),
          bg: isNext ? T.hint : "transparent", sep: isNext ? "transparent" : T.navBorder,
          fw: isNext ? 700 : 500, nextDisp: isNext ? "block" : "none",
          nextTxt: "Next prayer · in " + Math.floor(remMin / 60) + "h " + (remMin % 60) + "m",
          openSheet: p.key === "sunrise" ? (() => {}) : (() => this.setState({ prayerSheet: p.key })),
          cursor: p.key === "sunrise" ? "default" : "pointer",
          chevDisp: p.key === "sunrise" ? "none" : "block",
        };
      });
      const wirdPct = Math.min(1, s.wirdDone / s.wirdGoal);
      const I2 = {
        loc: "M12 21 C12 21 5.5 14.8 5.5 10 A6.5 6.5 0 0 1 18.5 10 C18.5 14.8 12 21 12 21 Z M12 12.6 A2.6 2.6 0 1 0 12 7.4 A2.6 2.6 0 1 0 12 12.6",
        bell: "M12 4.5 C8.8 4.5 7.2 7 7.2 10 C7.2 14 5.5 15.5 5.5 15.5 L18.5 15.5 C18.5 15.5 16.8 14 16.8 10 C16.8 7 15.2 4.5 12 4.5 Z M10.3 18.5 C10.6 19.6 11.2 20.2 12 20.2 C12.8 20.2 13.4 19.6 13.7 18.5",
        lang: "M12 3 A9 9 0 1 0 12 21 A9 9 0 1 0 12 3 M3.5 9 H20.5 M3.5 15 H20.5 M12 3 C9.5 5.5 8.5 8.5 8.5 12 C8.5 15.5 9.5 18.5 12 21 M12 3 C14.5 5.5 15.5 8.5 15.5 12 C15.5 15.5 14.5 18.5 12 21",
        star: "M12 3.5 L14 9 L20 9.5 L15.5 13.3 L17 19.5 L12 16 L7 19.5 L8.5 13.3 L4 9.5 L10 9 Z",
        cal: "M5 6.5 H19 A1.5 1.5 0 0 1 20.5 8 V19 A1.5 1.5 0 0 1 19 20.5 H5 A1.5 1.5 0 0 1 3.5 19 V8 A1.5 1.5 0 0 1 5 6.5 Z M3.5 10.5 H20.5 M8 3.8 V7 M16 3.8 V7",
        ai: "M12 2.6 V5.4 M9 5.4 H15 A3.2 3.2 0 0 1 18.2 8.6 V14.4 A3.2 3.2 0 0 1 15 17.6 H9 A3.2 3.2 0 0 1 5.8 14.4 V8.6 A3.2 3.2 0 0 1 9 5.4 Z M5.8 10.5 H3.9 M18.2 10.5 H20.1 M9.5 10.2 V12.3 M14.5 10.2 V12.3 M9.7 14.5 H14.3",
        asrSun: "M4.5 19 H19.5 M12 11.6 A2.8 2.8 0 0 1 12 17.2 A2.8 2.8 0 0 1 12 11.6 Z M12 6 V8.1 M6.4 8.3 L7.9 9.8 M17.6 8.3 L16.1 9.8",
        moon: "M14.5 4 A8.2 8.2 0 1 0 20 14.5 A9.5 9.5 0 0 1 14.5 4 Z",
        book: "M12 6 C10 4.6 7.2 4.1 4.8 4.5 V17.8 C7.2 17.4 10 17.9 12 19.3 C14 17.9 16.8 17.4 19.2 17.8 V4.5 C16.8 4.1 14 4.6 12 6 Z M12 6 V19.3",
        info: "M12 3 A9 9 0 1 0 12 21 A9 9 0 1 0 12 3 M12 8 V8.2 M12 11 V16.5",
      };
      const chev2 = { isToggle: false, isChevron: true, iconBg: T.mint, iconC: T.green };
      const moreRowsEn = [
        { ...chev2, icon: "M5 3.8 H19 A1 1 0 0 1 20 4.8 V19.2 A1 1 0 0 1 19 20.2 H5 A1 1 0 0 1 4 19.2 V4.8 A1 1 0 0 1 5 3.8 Z M7.6 8.4 H16.4 M7.6 12 H16.4 M7.6 15.6 H13",
          t: "Hadith", s: "Selected prophetic traditions", open: () => this.tab("hadith") },
        { ...chev2, icon: I2.asrSun, t: "Asr Calculation Method", s: s.asrMethod === "jomhor" ? "Majority (Jumhur)" : "Hanafi school", open: () => this.go("prayerSettings") },
        { ...chev2, icon: I2.bell, t: "Notifications & Athan", s: "Per-prayer muezzin voice — in Prayer tab", open: () => this.tab("prayer") },
        { ...chev2, icon: I2.loc, t: "Location", s: s.cityName, open: () => this.go("locationManual") },
        { icon: I2.moon, t: "Dark Mode", s: s.darkMode ? "On" : "Off", isToggle: true, isChevron: false, iconBg: "#132321", iconC: "#EA9924",
          tgBg: s.darkMode ? "#1589BC" : T.track, tgJustify: s.darkMode ? "flex-end" : "flex-start",
          open: () => { this.set({ darkMode: !s.darkMode }); this.showToast(!s.darkMode ? "Dark mode on" : "Dark mode off"); } },
        { ...chev2, icon: I2.lang, t: "Language / اللغة", s: "English", open: () => { this.setState({ langReturn: "more" }); this.go("language"); } },
        { ...chev2, icon: I2.star, t: "Khatmah Plan", s: s.planDays + "-day plan · " + Math.ceil(604 / s.planDays) + " pages/day", open: () => this.go("khatmah"), iconBg: "#F6ECD9", iconC: "#C89A3F" },
        { ...chev2, icon: "M14.5 4 A8.2 8.2 0 1 0 20 14.5 A9.5 9.5 0 0 1 14.5 4 Z M18.6 4.6 V7.4 M17.2 6 H20", t: "Adhkar & Tasbih", s: "Morning & evening adhkar, tasbih", open: () => this.go("adhkar") },
        { ...chev2, icon: I2.cal, t: "Hijri Calendar", s: "Hijri & Gregorian calendar", open: () => this.go("calendar") },
        { ...chev2, icon: I2.ai, t: "Tibyan — AI Assistant", s: "Ask about Quran & Sunnah", open: () => this.go("tibyan"), iconBg: "#E3F2FA", iconC: "#268CE0" },
        { ...chev2, icon: I2.info, t: "About Fadhakkir", s: "Fadhakkir — Beta 1.0", open: () => this.go("about") },
      ];
      return {
        timesRowsEn, moreRowsEn,
        wirdLabelEn: s.wirdDone + " / " + s.wirdGoal + " pages",
        wirdPctTxtEn: Math.round(wirdPct * 100) + "% completed",
      };
    }
  
    // ─── قيم الرئيسية والرزنامة والإشعارات ───
    homeVals() {
      const s = this.state, mod = s.mod, now = s.now;
      const T = this.th2();
      const en = s.lang === "en";
      const t = (a, b) => en ? b : a;
      const pDone = Object.values(s.prayersDone).filter(Boolean).length;
      const wirdPct = Math.min(1, s.wirdDone / s.wirdGoal);
      const total = (pDone / 5 + wirdPct) / 2;
      const C = 188.5;
  
      const ICONS = {
        athan: "M12 4.5 C8.8 4.5 7.2 7 7.2 10 C7.2 14 5.5 15.5 5.5 15.5 L18.5 15.5 C18.5 15.5 16.8 14 16.8 10 C16.8 7 15.2 4.5 12 4.5 Z M10.3 18.5 C10.6 19.6 11.2 20.2 12 20.2 C12.8 20.2 13.4 19.6 13.7 18.5",
        quran: "M12 6 C10 4.6 7.2 4.1 4.8 4.5 V17.8 C7.2 17.4 10 17.9 12 19.3 C14 17.9 16.8 17.4 19.2 17.8 V4.5 C16.8 4.1 14 4.6 12 6 Z M12 6 V19.3",
        dhikr: "M14.5 4 A8.2 8.2 0 1 0 20 14.5 A9.5 9.5 0 0 1 14.5 4 Z",
        khatmah: "M12 3.5 L14 9 L20 9.5 L15.5 13.3 L17 19.5 L12 16 L7 19.5 L8.5 13.3 L4 9.5 L10 9 Z",
      };
      const notifRows = (mod ? mod.NOTIFICATIONS : []).map((n, i) => { const nn = (en && mod.NOTIFICATIONS_EN && mod.NOTIFICATIONS_EN[i]) ? { ...n, ...mod.NOTIFICATIONS_EN[i] } : n; return { ...nn, iconPath: ICONS[n.icon] || ICONS.athan }; });
  
      // الرزنامة
      const base = new Date(now.getFullYear(), now.getMonth() + s.calOffset, 1);
      const daysIn = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      const startDay = base.getDay();
      const sel = s.calSel || new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const hijDayFmt = (() => { try { return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric" }); } catch (e) { return null; } })();
      const hijMode = s.calMode === "hijri";
      const cells = [];
      for (let i = 0; i < startDay; i++) cells.push({ main: "", sub: "", bg: "transparent", border: "transparent", mainColor: T.text, subColor: T.faint, pick: () => {} });
      for (let d = 1; d <= daysIn; d++) {
        const dt = new Date(base.getFullYear(), base.getMonth(), d);
        const isToday = dt.toDateString() === now.toDateString();
        const isSel = dt.toDateString() === sel.toDateString();
        const hd = hijDayFmt ? hijDayFmt.format(dt) : "";
        cells.push({
          main: hijMode ? hd : String(d), sub: hijMode ? String(d) : hd,
          bg: isSel ? "#1589BC" : (isToday ? T.cellToday : "transparent"),
          border: isToday && !isSel ? T.green : "transparent",
          mainColor: isSel ? "#FFFFFF" : T.text, subColor: isSel ? "rgba(255,255,255,0.75)" : T.faint,
          pick: () => this.setState({ calSel: dt }),
        });
      }
      while (cells.length % 7 !== 0) cells.push({ main: "", sub: "", bg: "transparent", border: "transparent", mainColor: T.text, subColor: T.faint, pick: () => {} });
  
      let calTitle = "";
      try {
        const g = new Intl.DateTimeFormat(en ? "en" : "ar-u-nu-latn", { month: "long", year: "numeric" }).format(base);
        const h = new Intl.DateTimeFormat(en ? "en-u-ca-islamic-umalqura" : "ar-u-ca-islamic-umalqura-nu-latn", { month: "long", year: "numeric" }).format(new Date(base.getFullYear(), base.getMonth(), 15));
        calTitle = hijMode ? h + " · " + g : g + " · " + h;
      } catch (e) {}
  
      const segOn = { bg: "#1589BC", color: "#FFFFFF", border: "#1589BC" };
      const segOff = { bg: T.card, color: T.green2, border: T.mint };
      const hij = hijMode ? segOn : segOff, grg = hijMode ? segOff : segOn;
  
      return {
        cityName: s.cityName,
        heroMosqueSrc: this.res((s.heroMosque && s.heroMosque.src) || "images/mosque-haram-t.png"),
        heroMosqueName: (s.heroMosque && s.heroMosque.name) || "المسجد الحرام - مكة المكرمة - المملكة العربية السعودية",
        heroTimes: s.ptTimes,
        heroTemp: s.tempC,
        dayNum: String(now.getDate()),
        hijriToday: mod ? mod.hijriDate(now, s.lang) : "",
        // شارة التاريخ في بطاقة الهيرو — الضغط يبدّل بين الهجري والميلادي
        heroDateTxt: mod ? (s.heroGreg ? mod.gregDate(now, s.lang) : mod.hijriDate(now, s.lang)) : "",
        toggleHeroDate: () => this.setState({ heroGreg: !this.state.heroGreg }),
        gregToday: mod ? mod.gregDate(now, "ar") : "",
        hijriTodayEn: mod ? mod.hijriDate(now, "en") : "",
        gregTodayEn: mod ? mod.gregDate(now, "en") : "",
        notifDot: s.notifRead ? "none" : "block",
        goNotifications: () => this.go("notifications"),
        goMoreScreen: () => this.tab("more"),
        goCalendar: () => this.go("calendar"),
        goTracker: () => this.go("tracker"),
        goReader: () => { this.loadSurah(this.state.readerIdx || 0); this.go("quranReader"); },
        shareAyah: () => this.showToast(t("تم نسخ الآية للمشاركة", "Ayah copied for sharing")),
        shareHadith: () => this.showToast(t("تم نسخ الحديث للمشاركة", "Hadith copied for sharing")),
        markAllRead: () => { this.setState({ notifRead: true }); this.showToast(t("تم تعليم الكل كمقروء", "All marked as read")); },
        wirdLabel: s.wirdDone + " / " + s.wirdGoal + t(" صفحات", " pages"),
        wirdBarW: Math.round(wirdPct * 100) + "%",
        wirdPctTxt: t("أكملت ", "Completed ") + Math.round(wirdPct * 100) + "%",
        trkPray: pDone + "/5", trkWird: s.wirdDone + "/" + s.wirdGoal, trkDhikr: s.adhkarDone + "/" + s.adhkarGoal,
        ringOff: C * (1 - total), ringPct: Math.round(total * 100) + "%",
        notifRows, calCells: cells, calTitle,
        calWd: (en ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]).map(n => ({ n })),
        calSelHijri: mod ? mod.hijriDate(sel, s.lang) : "",
        calSelGreg: mod ? mod.gregDate(sel, s.lang) : "",
        calPrev: () => this.setState({ calOffset: s.calOffset - 1 }),
        calNext: () => this.setState({ calOffset: s.calOffset + 1 }),
        calModeHijri: () => this.setState({ calMode: "hijri" }),
        calModeGreg: () => this.setState({ calMode: "greg" }),
        calHijriBg: hij.bg, calHijriColor: hij.color, calHijriBorder: hij.border,
        calGregBg: grg.bg, calGregColor: grg.color, calGregBorder: grg.border,
      };
    }
  
    // ─── قيم شاشات الصلاة ───
    // أيقونات الصلوات الملوّنة (ملفات SVG بألوانها الأصلية)
    prayerIconSrc() {
      return {
        fajr: "images/prayer-fajr.svg", sunrise: "images/prayer-fajr.svg",
        dhuhr: "images/prayer-dhuhr.svg", asr: "images/prayer-asr.svg",
        maghrib: "images/prayer-maghrib.svg", isha: "images/prayer-isha.svg",
      };
    }
    prayerIcons() {
      return {
        fajr: "M4.5 18.5 H19.5 M12 14.6 V11 M7.3 15.9 L4.9 13.5 M16.7 15.9 L19.1 13.5",
        sunrise: "M4.5 18.5 H19.5 M8.6 18.5 A3.4 3.4 0 0 1 15.4 18.5 M12 12.2 V6.8 M9.7 9.1 L12 6.8 L14.3 9.1",
        dhuhr: "M12 8.7 A3.3 3.3 0 0 1 12 15.3 A3.3 3.3 0 0 1 12 8.7 Z M12 3.6 V5.8 M12 18.2 V20.4 M3.6 12 H5.8 M18.2 12 H20.4 M6.1 6.1 L7.65 7.65 M16.35 16.35 L17.9 17.9 M17.9 6.1 L16.35 7.65 M7.65 16.35 L6.1 17.9",
        asr: "M4.5 19 H19.5 M12 11.6 A2.8 2.8 0 0 1 12 17.2 A2.8 2.8 0 0 1 12 11.6 Z M12 6 V8.1 M6.4 8.3 L7.9 9.8 M17.6 8.3 L16.1 9.8",
        maghrib: "M4.5 18.5 H19.5 M8.6 18.5 A3.4 3.4 0 0 1 15.4 18.5 M12 6.8 V12.2 M9.7 9.9 L12 12.2 L14.3 9.9",
        isha: "M12.4 4.4 A6 6 0 0 0 19.9 11.9 A7.8 7.8 0 1 1 12.4 4.4 Z M19 3.6 V6.2 M17.7 4.9 H20.3"
      };
    }
    prayerVals() {
      const s = this.state, mod = s.mod;
      const T = this.th2();
      const en = s.lang === "en";
      const t = (a, b) => en ? b : a;
      if (!mod) return { goManualLoc: () => this.go("locationManual"), timesRows: [], monthRows: [], pSoundRows: [], qiyamRows: [], pSheetSty: "display:none", pScrimSty: "display:none", cityName: s.cityName, monthTitle: "", pSheetTitle: "", pSheetSub: "", pIsFajr: false, pIsIsha: false, nightOn: false, closePrayerSheet: () => {} };
      const PT = this.times();
      const st = mod.getPrayerState(s.now, PT);
      const ICONS = this.prayerIcons();
      // const ALERT = [
      //   { icon: "M4.5 9.6 H7.6 L12 5.6 V18.4 L7.6 14.4 H4.5 Z M15.4 9.2 A4 4 0 0 1 15.4 14.8 M17.9 6.6 A7.4 7.4 0 0 1 17.9 17.4", label: t("مؤذن", "Muezzin"), on: true },
      //   { icon: "M4.5 9.6 H7.6 L12 5.6 V18.4 L7.6 14.4 H4.5 Z M15.8 10 L20.4 14.6 M20.4 10 L15.8 14.6", label: t("صامت", "Silent"), on: false },
      //   { icon: "M12 4.5 C8.8 4.5 7.2 7 7.2 10 C7.2 14 5.5 15.5 5.5 15.5 L18.5 15.5 C18.5 15.5 16.8 14 16.8 10 C16.8 7 15.2 4.5 12 4.5 Z M10.3 18.5 C10.6 19.6 11.2 20.2 12 20.2 C12.8 20.2 13.4 19.6 13.7 18.5", label: t("افتراضي", "Default"), on: true },
      // ];
      const ALERT = [
        { icon: "images/Muezzin.svg", label: t("مؤذن", "Muezzin"), on: true },
        { icon: "images/Silent.svg", label: t("صامت", "Silent"), on: false },
        { icon: "images/Default.svg", label: t("افتراضي", "Default"), on: true },
      ];
      const nextAthanKey = st.nextKey === "sunrise" ? "dhuhr" : st.nextKey;
      const timesRows = mod.PRAYER_META.filter(p => p.key !== "sunrise").map(p => {
        const isNext = p.key === nextAthanKey;
        const noAlert = p.key === "sunrise";
        const mode = s.alertModes[p.key] ?? 0;
        const remMin = Math.round((mod.toMin(PT[p.key]) - st.nowMin + 1440) % 1440);
        return {
          icon: ICONS[p.key], iconSrc: this.prayerIconSrc()[p.key],
          iconBg: "#FDF1E2", iconC: "#EA9924", name: t(p.ar, p.en),
          alertBg: ALERT[mode].on ? "#E8F4FA" : "#EEF1F4",
          alertC: ALERT[mode].on ? "#1589BC" : "#94A3B8",
          time: mod.fmt12(PT[p.key], "en"), ap: mod.ampm(PT[p.key], s.lang),
          bg: "#FEFFFF", sep: T.navBorder,
          fw: isNext ? 700 : 500,
          nextDisp: isNext ? "block" : "none",
          nextTxt: t("الصلاة القادمة · بعد " + Math.floor(remMin / 60) + " س " + (remMin % 60) + " د", "Next prayer · in " + Math.floor(remMin / 60) + "h " + (remMin % 60) + "m"),
          alertIcon: noAlert ? "M12 4 A8 8 0 1 0 12 20 A8 8 0 1 0 12 4 M8 15 C9 12 15 12 16 15" : ALERT[mode].icon,
          cycle: noAlert ? (e => { if (e && e.stopPropagation) e.stopPropagation(); }) : (e => {
            if (e && e.stopPropagation) e.stopPropagation();
            const m2 = { ...s.alertModes, [p.key]: (mode + 1) % 3 };
            this.set({ alertModes: m2 });
            this.showToast(t(p.ar, p.en) + ": " + ALERT[(mode + 1) % 3].label);
          }),
          openSheet: noAlert ? (() => {}) : (() => this.setState({ prayerSheet: p.key })),
          cursor: noAlert ? "default" : "pointer",
          chevDisp: noAlert ? "none" : "block",
        };
      });
  
      // جدول الشهر
      const y = s.now.getFullYear(), mo = s.now.getMonth();
      const daysIn = new Date(y, mo + 1, 0).getDate();
      const P = this.times(), p2 = mod.pad2, PM = s.ptMonth;
      const f12 = tt2 => p2(tt2.h % 12 === 0 ? 12 : tt2.h % 12) + ":" + p2(tt2.m);
      const shift = (t, d) => { let mm = t.h * 60 + t.m + d; mm = (mm + 1440) % 1440; return p2(Math.floor(mm / 60) % 12 === 0 ? 12 : Math.floor(mm / 60) % 12) + ":" + p2(mm % 60); };
      const wd = en ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      const monthRows = [];
      for (let d = 1; d <= daysIn; d++) {
        const dt = new Date(y, mo, d);
        const isToday = d === s.now.getDate();
        const drift = d - s.now.getDate();
        const RT = PM && PM[d - 1];
        monthRows.push({
          d: d + " " + wd[dt.getDay()],
          f: RT ? f12(RT.fajr) : shift(P.fajr, Math.round(drift * 0.4)), dh: RT ? f12(RT.dhuhr) : shift(P.dhuhr, Math.round(drift * 0.15)),
          a: RT ? f12(RT.asr) : shift(P.asr, Math.round(drift * 0.2)), m: RT ? f12(RT.maghrib) : shift(P.maghrib, Math.round(drift * -0.35)), i: RT ? f12(RT.isha) : shift(P.isha, Math.round(drift * -0.3)),
          bg: isToday ? T.hint : T.card, fw: isToday ? 700 : 500,
        });
      }
      let monthTitle = "";
      try { monthTitle = new Intl.DateTimeFormat(en ? "en" : "ar", { month: "long", year: "numeric" }).format(s.now) + " · " + s.cityName; } catch (e) {}
  
      // ورقة إعدادات كل صلاة — صوت المؤذن + خيارات خاصة بالفجر والعشاء
      const pk = s.prayerSheet;
      const pOpen = !!pk;
      const pMeta = pk ? mod.PRAYER_META.find(p => p.key === pk) : null;
      const sounds = en ? mod.ATHAN_SOUNDS_EN : mod.ATHAN_SOUNDS;
      const curSnd = pk ? ((s.prayerSounds && s.prayerSounds[pk]) || 0) : -1;
      const pSoundRows = sounds.map((n, i) => ({
        name: n, bg: curSnd === i ? T.hint : "transparent",
        ring: curSnd === i ? T.green : T.faint, dot: curSnd === i ? T.green : "transparent",
        pick: () => { if (!pk) return; this.set({ prayerSounds: { ...s.prayerSounds, [pk]: i } }); this.showToast(t("جارٍ تشغيل عيّنة: ", "Playing sample: ") + n); },
      }));
      const hLbl = h => ((h === 0 ? 12 : h) + ":00 ") + (en ? "AM" : "ص");
      const qiyamRows = [0, 1, 2, 3, 4].map(h => {
        const on = s.qiyamHour === h;
        return {
          name: hLbl(h),
          bg: on ? "#1589BC" : T.card, border: on ? "#1589BC" : T.mint, color: on ? "#FFFFFF" : T.green2,
          pick: () => { this.set({ qiyamHour: h }); this.showToast(t("تنبيه قيام الليل: ", "Qiyam alert: ") + hLbl(h)); },
        };
      });
  
      return {
        timesRows, monthRows, monthTitle,
        goManualLoc: () => this.go("locationManual"),
        goMonthTable: () => this.go("monthTable"),
        toggleNight: () => { this.set({ nightAlert: !s.nightAlert }); this.showToast(!s.nightAlert ? t("تم تفعيل تنبيه قيام الليل", "Night prayer alert enabled") : t("تم إيقاف تنبيه قيام الليل", "Night prayer alert disabled")); },
        nightBg: s.nightAlert ? "#1589BC" : "#CBD5E1",
        qiyamJustify: (s.nightAlert !== en) ? "flex-start" : "flex-end",
        nightOn: !!s.nightAlert,
        toggleSunrise: () => { this.set({ sunriseAlert: !s.sunriseAlert }); this.showToast(!s.sunriseAlert ? t("تم تفعيل تنبيه الشروق — «الصلاة خير من النوم»", "Sunrise alert enabled") : t("تم إيقاف تنبيه الشروق", "Sunrise alert disabled")); },
        sunriseBg: s.sunriseAlert ? "#1589BC" : "#CBD5E1",
        sunriseJustify: (s.sunriseAlert !== en) ? "flex-start" : "flex-end",
        pIsFajr: pk === "fajr", pIsIsha: pk === "isha",
        pSheetTitle: pMeta ? t("إعدادات صلاة " + pMeta.ar, pMeta.en + " Settings") : "",
        pSheetIcon: pMeta ? this.prayerIcons()[pMeta.key] : "",
        pSheetIconSrc: pMeta ? this.prayerIconSrc()[pMeta.key] : "",
        pSheetSub: pMeta ? t("التنبيه وصوت المؤذّن", "Alert & muezzin voice") : "",
        pSoundRows, qiyamRows,
        closePrayerSheet: () => this.setState({ prayerSheet: null }),
        pScrimSty: "position:absolute; inset:0; background:rgba(19,35,33," + (pOpen ? "0.45" : "0") + "); z-index:44; transition:background .3s; pointer-events:" + (pOpen ? "auto" : "none"),
        pSheetSty: "position:absolute; left:0; right:0; bottom:0; z-index:45; background:" + T.sheet + "; border-radius:24px 24px 0 0; padding:14px 20px 26px; max-height:76%; overflow-y:auto; display:flex; flex-direction:column; box-shadow:0 -10px 40px rgba(0,0,0,0.18); transform:translateY(" + (pOpen ? "0" : "108%") + "); transition:transform .35s cubic-bezier(.2,.8,.2,1)",
      };
    }
  
    // ─── مواقيت حقيقية حسب المدينة المختارة (aladhan.com) ───
    times() {
      const s = this.state;
      if (s.ptTimes && s.ptTimes.fajr) return s.ptTimes;
      return s.mod ? s.mod.PRAYER_TIMES : { fajr: { h: 4, m: 15 }, sunrise: { h: 5, m: 41 }, dhuhr: { h: 12, m: 26 }, asr: { h: 15, m: 42 }, maghrib: { h: 19, m: 7 }, isha: { h: 20, m: 37 } };
    }
    resolveCity(name) {
      const mod = this.state.mod;
      const fix = { "Türkiye": "Turkey", "UAE": "United Arab Emirates" };
      const METH = { "السعودية": 4, "مصر": 5, "تركيا": 13, "الإمارات": 16, "قطر": 10, "الكويت": 9, "البحرين": 8, "عُمان": 8, "المغرب": 21, "تونس": 18, "الجزائر": 19 };
      let ci = 0, cj = 0, found = false;
      const W2 = mod.WORLD || [];
      for (const c2 of W2)
        for (const cc of c2.cities)
          if (name.indexOf(mod.cityLocal(cc)) === 0)
            return { city: mod.cityEn(cc), country: c2.en, method: (mod.METH_BY_EN || {})[c2.en] ?? 3 };
      const lists = [mod.COUNTRIES, mod.COUNTRIES_EN];
      for (let L = 0; L < lists.length && !found; L++)
        for (let i = 0; i < lists[L].length && !found; i++)
          for (let j = 0; j < lists[L][i].cities.length && !found; j++)
            if (name.indexOf(lists[L][i].cities[j]) === 0) { ci = i; cj = j; found = true; }
      const enC = mod.COUNTRIES_EN[ci];
      return { city: enC.cities[cj], country: fix[enC.c] || enC.c, method: METH[mod.COUNTRIES[ci].c] ?? 3 };
    }
    // المسافة إلى الكعبة المشرّفة (كم)
    kaabaDist() {
      const s = this.state;
      if (s.geoLat == null || s.geoLng == null) return null;
      const R = 6371, rad = x => x * Math.PI / 180;
      const la1 = rad(s.geoLat), la2 = rad(21.4225);
      const dLa = la2 - la1, dLo = rad(39.8262 - s.geoLng);
      const a = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(la1) * Math.cos(la2) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
    }
  
    // درجة الحرارة الحالية للمدينة (open-meteo — بدون مفتاح)
    fetchWeather() {
      const st2 = this.state; if (!st2.mod) return;
      const key = st2.cityName;
      this._wxData = this._wxData || {};
      this._geoData = this._geoData || {};
      const g0 = this._geoData[key];
      this.setState({ geoLat: g0 ? g0.lat : null, geoLng: g0 ? g0.lon : null });
      if (this._wxData[key] != null) { this.setState({ tempC: this._wxData[key] }); if (g0) return; }
      if (this._wxKey === key) return;
      this._wxKey = key;
      const r = this.resolveCity(key);
      fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(r.city))
        .then(x => x.json())
        .then(g => {
          const hit = g && g.results && g.results[0];
          if (!hit) throw new Error("geo");
          this._geoData[key] = { lat: hit.latitude, lon: hit.longitude };
          if (this.state.cityName === key) this.setState({ geoLat: hit.latitude, geoLng: hit.longitude });
          return fetch("https://api.open-meteo.com/v1/forecast?latitude=" + hit.latitude + "&longitude=" + hit.longitude + "&current=temperature_2m");
        })
        .then(x => x.json())
        .then(w => {
          const c = w && w.current && w.current.temperature_2m;
          if (typeof c !== "number") throw new Error("wx");
          this._wxData[key] = Math.round(c);
          if (this.state.cityName === key) this.setState({ tempC: Math.round(c) });
        })
        .catch(() => {})
        .then(() => { if (this._wxKey === key) this._wxKey = null; });
    }
  
    fetchTimes() {
      const s = this.state, mod = s.mod; if (!mod) return;
      this.fetchWeather();
      const key = s.cityName;
      this._ptData = this._ptData || {};
      const hit = this._ptData[key];
      if (hit) { this.setState({ ptTimes: hit.today, ptMonth: hit.month }); return; }
      if (this._ptKey === key) return;
      this._ptKey = key;
      const r = this.resolveCity(key), now = new Date();
      const url = "https://api.aladhan.com/v1/calendarByCity/" + now.getFullYear() + "/" + (now.getMonth() + 1) +
        "?city=" + encodeURIComponent(r.city) + "&country=" + encodeURIComponent(r.country) + "&method=" + r.method;
      fetch(url)
        .then(x => { if (!x.ok) throw new Error("http " + x.status); return x.json(); })
        .then(j => {
          const days = Array.isArray(j.data) ? j.data : [];
          const parse = v => { const m2 = /(\d{1,2}):(\d{2})/.exec(String(v || "")); return m2 ? { h: +m2[1], m: +m2[2] } : null; };
          const month = days.map(dd => ({
            fajr: parse(dd.timings.Fajr), sunrise: parse(dd.timings.Sunrise), dhuhr: parse(dd.timings.Dhuhr),
            asr: parse(dd.timings.Asr), maghrib: parse(dd.timings.Maghrib), isha: parse(dd.timings.Isha),
          })).filter(x => x.fajr && x.sunrise && x.dhuhr && x.asr && x.maghrib && x.isha);
          if (!month.length) throw new Error("empty");
          const today2 = month[Math.min(now.getDate() - 1, month.length - 1)];
          this._ptData[key] = { today: today2, month };
          if (this.state.cityName === key) this.setState({ ptTimes: today2, ptMonth: month });
        })
        .catch(() => {})
        .then(() => { if (this._ptKey === key) this._ptKey = null; });
    }
  
    // ─── تحميل نص السور كاملة (alquran.cloud — نص مبسّط + التفسير الميسر) ───
    openSurah(i, nav) {
      const mod = this.state.mod; if (!mod) return;
      const idx = Math.min(113, Math.max(0, i));
      this.stopPlay();
      this.set({ readerIdx: idx, readerSurah: mod.SURAHS[idx].n, ayahSel: null, readerPg: 0, playWord: 0 });
      this.loadSurah(idx);
      if (nav) this.go("quranReader");
    }
    loadSurah(i) {
      const mod = this.state.mod; if (!mod) return;
      this.qCache = this.qCache || {}; this.qErrs = this.qErrs || {}; this.qBusy = this.qBusy || {};
      if (this.qCache[i] || this.qBusy[i]) return;
      if (i === 0) { this.qCache[0] = mod.FATIHA.map(a => ({ n: a.n, t: a.t, tf: a.tf, pg: 1 })); this.setState(s => ({ qTick: (s.qTick || 0) + 1 })); return; }
      this.qBusy[i] = true; delete this.qErrs[i];
      this.setState(s => ({ qTick: (s.qTick || 0) + 1 }));
      fetch("https://api.alquran.cloud/v1/surah/" + (i + 1) + "/editions/quran-simple,ar.muyassar")
        .then(r => { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
        .then(j => {
          const txt = ((j.data && j.data[0]) || {}).ayahs || [];
          const tfs = ((j.data && j.data[1]) || {}).ayahs || [];
          if (!txt.length) throw new Error("empty");
          this.qCache[i] = txt.map((a, k) => {
            let t2 = a.text;
            if (k === 0 && i !== 0 && i !== 8) { const w = t2.split(" "); if (w.length > 4) t2 = w.slice(4).join(" "); } // فصل البسملة عن الآية الأولى
            return { n: a.numberInSurah, t: t2, tf: (tfs[k] || {}).text || "", pg: a.page != null ? a.page : null };
          });
        })
        .catch(() => { this.qErrs[i] = true; })
        .then(() => { delete this.qBusy[i]; this.setState(s => ({ qTick: (s.qTick || 0) + 1 })); });
    }
  
    // تطبيع النص العربي للبحث (إزالة التشكيل وتوحيد الهمزات)
    normH(x) {
      return String(x || "").replace(/[\u064B-\u0652\u0670\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim().toLowerCase();
    }
  
    // نص المصحف كاملًا (alquran.cloud) — يُحمَّل مرة واحدة عند أول بحث بالمفردات
    loadQuranAll() {
      if (this.qAll || this._qAllBusy) return;
      this._qAllBusy = true;
      this.setState(s2 => ({ qAllTick: (s2.qAllTick || 0) + 1 }));
      fetch("https://api.alquran.cloud/v1/quran/quran-simple")
        .then(r => { if (!r.ok) throw new Error("http"); return r.json(); })
        .then(j => {
          const surahs = (j.data && j.data.surahs) || [];
          if (!surahs.length) throw new Error("empty");
          const all = [];
          surahs.forEach((su, si) => (su.ayahs || []).forEach(a => all.push({ si, n: a.numberInSurah, t: a.text, s: this.normH(a.text) })));
          this.qAll = all;
        })
        .catch(() => {})
        .then(() => { this._qAllBusy = false; this.setState(s2 => ({ qAllTick: (s2.qAllTick || 0) + 1 })); });
    }
  
    // الكلمة المطابقة داخل النص
    matchWord(text, qn) {
      if (!qn) return "";
      for (const w of String(text || "").split(/\s+/)) { if (this.normH(w).indexOf(qn) !== -1) return w; }
      return "";
    }
  
    // تمرير المصحف إلى آية محددة بعد اكتمال التحميل
    scrollToAyah(i) {
      clearInterval(this._scT); let tries = 0;
      this._scT = setInterval(() => {
        tries++;
        const pages = this.surahPages(this.state.readerIdx || 0);
        if (pages) {
          let tp = -1;
          pages.forEach((p2, pi) => { if (tp < 0 && p2.ayahs.some(a => a.k === i)) tp = pi; });
          if (tp >= 0 && (this.state.readerPg || 0) !== tp) { this.setState({ readerPg: tp }); return; }
          const el = document.getElementById("mzAyah-" + i);
          if (el) {
            const sc = el.closest("[data-mzscroll]");
            if (sc) sc.scrollTop = Math.max(0, el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 90);
            clearInterval(this._scT); return;
          }
        }
        if (tries > 24) clearInterval(this._scT);
      }, 250);
    }
  
    // ─── نظام صفحات المصحف + قلب الصفحة ───
    surahPages(i) {
      this._pg = this._pg || {};
      if (this._pg[i]) return this._pg[i];
      const list = (this.qCache || {})[i];
      if (!list || !list.length) return null;
      let pages = [];
      if (list[0].pg != null) {
        let cur = null, curPg = null;
        list.forEach((a, k) => {
          if (a.pg !== curPg) { curPg = a.pg; cur = { gpg: a.pg, ayahs: [] }; pages.push(cur); }
          cur.ayahs.push({ ...a, k });
        });
      } else {
        let cur = { gpg: null, ayahs: [] }, chars = 0;
        list.forEach((a, k) => {
          if (chars > 830 && cur.ayahs.length) { pages.push(cur); cur = { gpg: null, ayahs: [] }; chars = 0; }
          cur.ayahs.push({ ...a, k }); chars += a.t.length;
        });
        if (cur.ayahs.length) pages.push(cur);
      }
      if (!pages.length) pages = [{ gpg: null, ayahs: [] }];
      this._pg[i] = pages;
      return pages;
    }
    qFonts() {
      return [
        { ar: "عثمان طه", en: "Uthman Taha", sample: "قُلْ", fam: "'Uthman Taha','Amiri Quran','Amiri',serif" },
        { ar: "نسخ عثماني", en: "Uthmanic Naskh", sample: "قُلْ", fam: "'Uthman Naskh','Uthman Taha','Amiri',serif" },
        { ar: "أميري", en: "Amiri", sample: "قُلْ", fam: "'Amiri Quran','Amiri',serif" },
        { ar: "حديث", en: "Modern", sample: "قُلْ", fam: "'IBM Plex Sans Arabic',sans-serif" }
      ];
    }
    flipEl(id) { return document.getElementById(id); }
    slideEl() { return document.getElementById("mzSlide"); }
    fitPage() {
      const s = this.state;
      if (s.ayahSel != null) return;
      const box = document.getElementById("mzTextBox");
      if (!box) return;
      // حجم موحّد لكل الصفحات: يعتمد فقط على اختيار المستخدم، والصفحة تُمرَّر عند الحاجة
      box.style.fontSize = (s.qFs || 21) + "px";
    }
    componentDidUpdate() {
      if (!this._fl && !this._flAnim) this.resetSlide();
      this.fitPage();
    }
    // ————— تقليب على شكل صفحة كتاب: تُرفع من الزاوية اليسرى السفلى وتنكشف الصفحة التالية تحتها —————
    bookT(deg) {
      const d = Math.max(0, Math.min(104, deg));
      const lift = 9 * Math.sin(Math.PI * Math.min(d, 100) / 100);
      return "rotateZ(" + lift.toFixed(2) + "deg) rotateY(" + d.toFixed(1) + "deg)";
    }
    bookSrc(dir) { const i = this._flipInfo || {}; return dir > 0 ? i.nextImg : i.prevImg; }
    // متابعة الحركة من زاوية السحب الحالية عبر تأخير سالب
    bookDelay(dir) {
      const p = Math.max(0, Math.min(0.85, this._bkFrom || 0));
      this._bkFrom = 0;
      return "-" + ((dir > 0 ? 0.5 : 0.52) * p).toFixed(3) + "s";
    }
    clearLayers() { ["mzUnder", "mzOver", "mzCurl"].forEach(id => { const n = document.getElementById(id); if (n) n.remove(); }); }
    // ————— ورقة منحنية: الصفحة مقسّمة شرائح رأسية متسلسلة فتنثني بدل أن تدور كلوح صلب —————
    curlN() { return 12; }
    ensureCurlKF() {
      if (document.getElementById("mzCurlKF")) return;
      const N = this.curlN(); let css = "";
      for (let i = 0; i < N; i++) {
        const f = i / (N - 1);
        const mid = (44 / N) * (0.34 + 1.32 * f);
        const end = (106 / N) * (0.82 + 0.36 * f);
        css += "@keyframes mzCurlF" + i + "{0%{transform:rotateY(0deg)}44%{transform:rotateY(" + mid.toFixed(2) + "deg)}100%{transform:rotateY(" + end.toFixed(2) + "deg)}}";
        css += "@keyframes mzCurlB" + i + "{0%{transform:rotateY(" + end.toFixed(2) + "deg)}56%{transform:rotateY(" + mid.toFixed(2) + "deg)}100%{transform:rotateY(0deg)}}";
      }
      css += "@keyframes mzCurlLiftF{0%{transform:rotateZ(0deg)}44%{transform:rotateZ(9deg)}100%{transform:rotateZ(1deg)}}";
      css += "@keyframes mzCurlLiftB{0%{transform:rotateZ(1deg)}56%{transform:rotateZ(9deg)}100%{transform:rotateZ(0deg)}}";
      const el = document.createElement("style"); el.id = "mzCurlKF"; el.textContent = css;
      document.head.appendChild(el);
    }
    buildCurl(src) {
      const wrap = this.flipEl("mzPageWrap");
      if (!wrap || !src) return null;
      this.ensureCurlKF();
      const old = document.getElementById("mzCurl"); if (old) old.remove();
      const N = this.curlN();
      const root = document.createElement("div");
      root.id = "mzCurl";
      root.style.cssText = "position:absolute;top:-8px;left:-11px;right:-11px;bottom:-11px;z-index:6;pointer-events:none;transform-style:preserve-3d;transform-origin:100% 100%;will-change:transform;";
      let host = root;
      for (let i = 0; i < N; i++) {
        const s = document.createElement("div");
        s.className = "mzStrip";
        s.style.cssText = "position:absolute;top:0;height:100%;transform-style:preserve-3d;transform-origin:100% 50%;backface-visibility:hidden;will-change:transform;"
          + (i === 0 ? "right:0;width:" + (100 / N).toFixed(4) + "%;" : "right:100%;width:100%;");
        const face = document.createElement("div");
        face.style.cssText = "position:absolute;inset:0;overflow:hidden;background-image:url(" + src + ");background-repeat:no-repeat;"
          + "background-size:" + (N * 100) + "% 100%;background-position:" + (i * 100 / (N - 1)).toFixed(4) + "% 0;"
          + (i === 0 ? "border-radius:0 6px 6px 0;" : (i === N - 1 ? "border-radius:6px 0 0 6px;" : ""));
        const shade = document.createElement("div");
        // الحافة الحرّة أبعد عن الضوء فتغمق تدريجياً — يعطي إحساس الانحناء
        shade.style.cssText = "position:absolute;inset:0;background:rgba(26,19,8," + (0.02 + 0.26 * (i / (N - 1))).toFixed(3) + ");";
        face.appendChild(shade);
        s.appendChild(face);
        host.appendChild(s);
        host = s;
      }
      wrap.appendChild(root);
      return root;
    }
    setCurl(root, p) {
      if (!root) return;
      const N = this.curlN();
      const bend = Math.sin(Math.PI * Math.max(0, Math.min(1, p)));
      root.style.transition = "none";
      root.style.transform = "rotateZ(" + (9 * bend).toFixed(2) + "deg)";
      root.querySelectorAll(".mzStrip").forEach((s, i) => {
        const f = i / (N - 1);
        s.style.transition = "none";
        s.style.transform = "rotateY(" + ((106 * p / N) * (1 + bend * 1.15 * (2 * f - 1))).toFixed(2) + "deg)";
      });
    }
    unwindCurl(root, ms) {
      if (!root) return;
      root.style.transition = "transform " + ms + "ms ease";
      root.style.transform = "rotateZ(0deg)";
      root.querySelectorAll(".mzStrip").forEach(s => { s.style.transition = "transform " + ms + "ms ease"; s.style.transform = "rotateY(0deg)"; });
    }
    runCurl(root, back, delay) {
      if (!root) return;
      const dur = back ? 620 : 580, ez = "cubic-bezier(.34,.03,.36,1)";
      root.style.transition = "none";
      root.style.animation = "mzCurlLift" + (back ? "B" : "F") + " " + dur + "ms " + ez + " " + delay + " forwards";
      root.querySelectorAll(".mzStrip").forEach((s, i) => {
        s.style.transition = "none";
        s.style.animation = "mzCurl" + (back ? "B" : "F") + i + " " + dur + "ms " + ez + " " + delay + " forwards";
      });
    }
    bookLayer(src, over) {
      const wrap = this.flipEl("mzPageWrap"); if (!wrap) return null;
      const info = this._flipInfo || {};
      const el = document.createElement("div");
      el.id = over ? "mzOver" : "mzUnder";
      const geo = src
        ? "top:-8px;left:-11px;right:-11px;bottom:-11px;border-radius:10px;"
        : "top:0;left:0;right:0;bottom:0;border-radius:16px;border:1px solid " + (info.paperBorder || "rgba(0,0,0,0.08)") + ";background:" + (info.paper || "#FBF7EE") + ";";
      el.style.cssText = "position:absolute;" + geo + "overflow:hidden;pointer-events:none;z-index:" + (over ? 4 : 0) + ";";
      el.innerHTML = (src ? '<img src="' + src + '" style="display:block;width:100%;height:100%;border-radius:6px;">' : "")
        + '<div id="' + (over ? "mzOverSh" : "mzUnderSh") + '" style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(270deg,rgba(26,19,8,0.30) 0%,rgba(26,19,8,0.10) 24%,rgba(26,19,8,0) 56%);"></div>';
      if (over) wrap.appendChild(el); else wrap.insertBefore(el, wrap.firstChild);
      return el;
    }
    primeBook() {
      const wrap = this.flipEl("mzPageWrap");
      if (wrap) { wrap.style.perspective = "1300px"; wrap.style.perspectiveOrigin = "84% 74%"; }
    }
    flipDown(e) {
      if (this._flAnim) return;
      const wrap = this.flipEl("mzPageWrap"); if (!wrap) return;
      if (this.state.playing) clearInterval(this._plT);
      this._fl = { id: e.pointerId, x0: e.clientX, xl: e.clientX, tl: Date.now(), w: Math.max(200, wrap.offsetWidth), dx: 0, vel: 0, moved: false, mode: 0 };
      if (this._flipInfo && this._flipInfo.book) this.primeBook();
    }
    flipMove(e) {
      const f = this._fl; if (!f) return;
      let dx = e.clientX - f.x0;
      if (!f.moved && Math.abs(dx) < 7) return;
      if (!f.moved) {
        // نلتقط المؤشر فقط عند بدء السحب الفعلي حتى تصل نقرات الآيات لعناصرها
        const wrap = this.flipEl("mzPageWrap");
        if (wrap) { try { wrap.setPointerCapture(f.id); } catch (x) {} }
      }
      f.moved = true;
      const nowT = Date.now();
      f.vel = (e.clientX - f.xl) / Math.max(1, nowT - f.tl); f.xl = e.clientX; f.tl = nowT;
      const info = this._flipInfo || {};
      const ok = dx > 0 ? info.hasNext : info.hasPrev;
      if (!ok) dx *= 0.15;
      f.dx = dx;
      const el = this.slideEl();
      if (!el) return;
      el.style.transition = "none";
      if (!info.book) { el.style.transform = "translateX(" + dx + "px)"; return; }
      const fwd = dx > 0, mode = fwd ? 1 : -1;
      const curlSrc = fwd ? info.curImg : info.prevImg;
      if (ok && f.mode !== mode) {
        f.mode = mode;
        this.clearLayers();
        if (fwd) this.bookLayer(info.nextImg, false);           // الصفحة التالية تظهر تحتها
        if (curlSrc) { f.curl = this.buildCurl(curlSrc); el.style.opacity = fwd ? "0" : "1"; }
        else { f.curl = null; this.bookLayer(this.bookSrc(mode), !fwd); }
      }
      const p = Math.max(0, Math.min(1, Math.abs(dx) / f.w));
      this._bkFrom = p;
      if (f.curl) { this.setCurl(f.curl, fwd ? p : 1 - p); if (!fwd) el.style.transform = "none"; return; }
      if (fwd) {
        el.style.transformOrigin = "100% 100%";
        el.style.backfaceVisibility = "hidden";
        el.style.boxShadow = "-" + (6 + 20 * p).toFixed(0) + "px " + (4 + 10 * p).toFixed(0) + "px " + (14 + 24 * p).toFixed(0) + "px rgba(26,19,8," + (0.30 * p).toFixed(2) + ")";
        el.style.transform = this.bookT(p * 104);
      } else {
        const ov = document.getElementById("mzOver");
        if (ov) { ov.style.transition = "none"; ov.style.animation = "none"; ov.style.transformOrigin = "100% 100%"; ov.style.transform = this.bookT(96 - p * 96); }
        el.style.transform = "none";
      }
    }
    flipUp() {
      const f = this._fl; if (!f) return; this._fl = null;
      if (!f.moved) { if (this.state.playing) this.restartPlayTick(); return; }
      this._noPick = Date.now();
      const dir = f.dx > 0 ? 1 : -1;
      const info = this._flipInfo || {};
      const ok = dir > 0 ? !!info.hasNext : !!info.hasPrev;
      const commit = ok && (Math.abs(f.dx) > f.w * 0.28 || (Math.abs(f.dx) > 24 && Math.abs(f.vel) > 0.45 && (f.vel > 0) === (dir > 0)));
      if (!commit) {
        const el = this.slideEl();
        if (info.book) {
          const curl = document.getElementById("mzCurl");
          if (curl) this.unwindCurl(curl, dir > 0 ? 300 : 0);
          if (curl && dir < 0) { const N2 = this.curlN(); this.setCurl(curl, 1); curl.style.transition = "transform .3s ease"; curl.querySelectorAll(".mzStrip").forEach(s2 => { s2.style.transition = "transform .3s ease"; }); }
          const ov = document.getElementById("mzOver");
          if (ov) { ov.style.transition = "transform .3s ease"; ov.style.transform = this.bookT(96); }
          if (el) { el.style.animation = ""; el.style.transition = "transform .3s ease, box-shadow .3s ease"; el.style.transform = this.bookT(0); el.style.boxShadow = "none"; }
          clearTimeout(this._bkT);
          this._bkT = setTimeout(() => { this.clearLayers(); this.resetSlide(); }, 340);
        } else if (el) {
          el.style.transition = "transform .25s ease"; el.style.transform = "translateX(0)";
        }
        if (this.state.playing) this.restartPlayTick();
        return;
      }
      this.slidePage(dir);
    }
    slidePage(dir) {
      if (this._flAnim) return;
      const info = this._flipInfo || {};
      if (dir > 0 ? !info.hasNext : !info.hasPrev) return;
      if (this.state.playing) clearInterval(this._plT);
      this._flAnim = true;
      if (info.book) { this.bookFlip(dir); return; }
      this.commitPage(dir);
      const el = this.slideEl();
      if (el) {
        const w = (el.parentElement ? el.parentElement.offsetWidth : 320) + 40;
        el.style.transition = "none";
        el.style.transform = "translateX(" + (dir > 0 ? -w : w) + "px)";
        el.style.opacity = "0.2";
        el.scrollTop = 0;
        el.getBoundingClientRect();
        el.style.transition = "transform .28s ease-out, opacity .28s ease-out";
        el.style.transform = "translateX(0)";
        el.style.opacity = "1";
      }
      clearTimeout(this._flT);
      this._flT = setTimeout(() => {
        this._flAnim = false;
        this.resetSlide();
        if (this.state.playing) this.restartPlayTick();
      }, 320);
    }
    bookFlip(dir) {
      const el = this.slideEl();
      if (!el) { this.commitPage(dir); this._flAnim = false; return; }
      this.primeBook();
      const fwd = dir > 0;
      const land = () => {
        this.commitPage(dir);
        clearTimeout(this._flT);
        this._flT = setTimeout(() => {
          const n = this.slideEl(); if (n) n.scrollTop = 0;
          this.resetSlide();
          this.clearLayers();
          this._flAnim = false;
          if (this.state.playing) this.restartPlayTick();
        }, 60);
      };
      clearTimeout(this._bkT);
      const info2 = this._flipInfo || {};
      const curlSrc = fwd ? info2.curImg : info2.prevImg;
      if (curlSrc) {
        if (fwd && !document.getElementById("mzUnder")) this.bookLayer(info2.nextImg, false);
        const shU = document.getElementById("mzUnderSh");
        if (shU) { shU.style.transition = "opacity .58s ease"; shU.style.opacity = "0"; }
        const curl = document.getElementById("mzCurl") || this.buildCurl(curlSrc);
        if (fwd) el.style.opacity = "0";
        const p0 = Math.max(0, Math.min(0.85, this._bkFrom || 0)); this._bkFrom = 0;
        this.runCurl(curl, !fwd, "-" + ((fwd ? 0.58 : 0.62) * (fwd ? p0 : 1 - (1 - p0))).toFixed(3) + "s");
        this._bkT = setTimeout(land, fwd ? 545 : 585);
        return;
      }
      if (fwd) {
        if (!document.getElementById("mzUnder")) this.bookLayer(this.bookSrc(1), false);
        const sh = document.getElementById("mzUnderSh");
        if (sh) { sh.style.transition = "opacity .5s ease"; sh.style.opacity = "0"; }
        el.style.transformOrigin = "100% 100%";
        el.style.backfaceVisibility = "hidden";
        el.style.transition = "box-shadow .5s ease";
        el.style.boxShadow = "-26px 14px 38px rgba(26,19,8,0.34)";
        el.style.animation = "mzFlipFwd .5s cubic-bezier(.36,.02,.36,1) " + this.bookDelay(1) + " forwards";
        this._bkT = setTimeout(land, 470);
      } else {
        const ov = document.getElementById("mzOver") || this.bookLayer(this.bookSrc(-1), true);
        if (ov) {
          ov.style.transformOrigin = "100% 100%";
          ov.style.transition = "box-shadow .52s ease";
          ov.style.boxShadow = "-24px 14px 34px rgba(26,19,8,0.3)";
          ov.style.animation = "mzFlipBack .52s cubic-bezier(.3,.02,.34,1) " + this.bookDelay(-1) + " forwards";
          const sh = document.getElementById("mzOverSh");
          if (sh) { sh.style.transition = "opacity .52s ease"; sh.style.opacity = "0"; }
        }
        this._bkT = setTimeout(land, 500);
      }
    }
    resetSlide() {
      const el = this.slideEl();
      if (!el) return;
      el.style.transition = "none";
      el.style.transform = "translateX(0)";
      el.style.transformOrigin = "center center";
      el.style.opacity = "1";
      el.style.boxShadow = "";
      el.style.animation = "";
      el.style.backfaceVisibility = "";
    }
    commitPage(dir) {
      const s = this.state;
      const patch = { readerPg: (s.readerPg || 0) + dir, ayahSel: null, playWord: 0 };
      if (!s.mushafTipSeen) patch.mushafTipSeen = true;
      if (dir > 0) patch.wirdDone = Math.min(s.wirdGoal, (s.wirdDone || 0) + 1);
      this.set(patch);
    }
    autoFlipNext() { this.slidePage(1); }
    restartPlayTick() {
      clearInterval(this._plT);
      this._plT = setInterval(() => {
        const s = this.state;
        if (!s.playing) { clearInterval(this._plT); return; }
        const wc = this._pageWordCount || 0;
        if ((s.playWord || 0) + 1 < wc) { this.setState({ playWord: (s.playWord || 0) + 1 }); return; }
        clearInterval(this._plT);
        const info = this._flipInfo || {};
        if (info.hasNext) this.autoFlipNext();
        else { this.setState({ playing: false, playWord: 0 }); this.showToast(this.state.lang === "en" ? "Surah recitation completed" : "اكتملت تلاوة السورة"); }
      }, 430);
    }
    stopPlay() {
      clearInterval(this._plT);
      if (this.state.playing) this.setState({ playing: false, playWord: 0 });
    }
  
    // ─── تحميل صحيح البخاري / صحيح مسلم كاملين (fawazahmed0/hadith-api عبر jsDelivr) ───
    loadHBook(book) {
      this.hCache = this.hCache || {}; this.hErrs = this.hErrs || {}; this._hBusy = this._hBusy || {};
      if (this.hCache[book] || this._hBusy[book]) return;
      this._hBusy[book] = true; delete this.hErrs[book];
      this.setState(s2 => ({ hTick: (s2.hTick || 0) + 1 }));
      const base = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-" + book;
      fetch(base + ".min.json")
        .then(r => { if (!r.ok) throw new Error("http"); return r.json(); })
        .catch(() => fetch(base + "1.min.json").then(r => { if (!r.ok) throw new Error("http2"); return r.json(); }))
        .then(j => {
          const md = j.metadata || {};
          const names = md.sections || md.section || {};
          const bySec = {}, all = [];
          (j.hadiths || []).forEach(h => {
            const k = String(h.reference && h.reference.book != null ? h.reference.book : 0);
            const item = { n: h.hadithnumber != null ? h.hadithnumber : h.arabicnumber, t: String(h.text || "").trim(), sec: k };
            item.s = this.normH(item.t);
            (bySec[k] = bySec[k] || []).push(item);
            all.push(item);
          });
          // أسماء الكتب بالعربية (المصدر يوفرها بالإنجليزية فقط) — تُستخدم فقط إذا تطابق عدد الكتب تمامًا
          const arList = ((this.state.mod || {}).HBOOK_SECTIONS_AR || {})[book] || [];
          const keys = Object.keys(names).filter(k => k !== "0" && String(names[k] || "").trim());
          const useAr = arList.length > 0 && arList.length === keys.length;
          let sections = keys
            .map(k => ({ num: k, name: (useAr && arList[+k - 1] ? "كتاب " + arList[+k - 1] : String(names[k]).trim()), count: (bySec[k] || []).length }))
            .filter(x => x.count > 0 && x.name);
          if (!sections.length) sections = Object.keys(bySec).filter(k => k !== "0").sort((a, b) => +a - +b).map(k => ({ num: k, name: "كتاب " + k, count: bySec[k].length }));
          if (!sections.length) throw new Error("empty");
          this.hCache[book] = { sections, bySec, all, secName: sections.reduce((m, x) => (m[x.num] = x.name, m), {}) };
        })
        .catch(() => { this.hErrs[book] = true; })
        .then(() => { delete this._hBusy[book]; this.setState(s2 => ({ hTick: (s2.hTick || 0) + 1 })); });
    }
  
    // ─── قيم القرآن والحديث وتبيان ───
    quranVals() {
      const s = this.state, mod = s.mod;
      const T = this.th2();
      const en = s.lang === "en";
      const t = (a, b) => en ? b : a;
      if (!mod) return { arrowNextSty: "display:none", arrowPrevSty: "display:none", qFontFam: this.qFonts()[s.qFont || 0].fam, qFontRows: [], qLh: String(s.qLh || 1.65), qLhVal: String(s.qLh || 1.65), qLhTxt: (s.qLh || 1.65).toFixed(2), qFs: 21, qFsN: 15, qFsTxt: "21px", readerSurahLabel: "", planDoneTxt: "", surahRows: [], juzRows: [], ayahRows: [], reciterRows: [], tafsirRows: [], chatRows: [], suggestionRows: [], hadithCatRows: [], hadithRows: [], tafsirSty: "display:none", rsScrimSty: "display:none", rsSheetSty: "display:none", qIsSurah: true, qIsJuz: false, qIsSaved: false, qLoading: true, qErr: false, retryLoad: () => {}, draft: s.draft, thinking: s.thinking, lastReadTxt: "", readerSurah: "", readerMeta: "", readerBasmala: "", tafsirTitle: "", tafsirText: "", reciterName: "", readerPageAr: "", readerBarW: "0%", qIsDl: false, qTabDl: () => {}, qDlColor: "", qDlBorder: "", qWordRows: [], qWordLoading: false, qHasWordResults: false, qWordCountTxt: "", savedAyahRows: [], savedHadithRows: [], savedAyahsEmpty: true, savedHEmpty: true, savedAyahCount: "", savedHCount: "", dlRows: [], dlEmpty: true, dlSheetSty: "display:none", dlScrimSty: "display:none", dlBusy: false, dlIdle: true, dlBarW: "0%", dlPctTxt: "", dlSurahTxt: "", startDl: () => {}, saveAyahFn: () => {}, openDlSheet: () => {}, closeDlSheet: () => {}, pageAyahRows: [], nextPageRows: [], prevPageRows: [], readerPageTxt: "", pageNumFoot: "", pgIsFirst: true, prevIsFirst: false, showMushafTip: false, playing: false, notPlaying: true, flipDown: () => {}, flipMove: () => {}, flipUp: () => {}, dismissTip: () => {}, playSurahHdr: () => {}, gtMaani: [], gtQiraat: [], gtHasMaani: false, gtHasQiraat: false, gtHasAny: false, gtMaaniLabel: "", gtQiraatLabel: "", gtSrc: "", isFatihaPg: false, showBasmala: true, ornC: "#EA9924", ornSoft: "transparent", ornFaint: "#EA9924", ornMid: "#EA9924", ornD: "#8F7844", amSty: "display:none", amShowAyah: false, showPageFoot: true, slideSty: "position:absolute; inset:0; border-radius:16px; padding:16px 18px 18px; overflow-y:auto;", isBaqPg: false, ba1: { bg: "transparent", pick: () => {} }, ba2: { bg: "transparent", pick: () => {} }, ba3: { bg: "transparent", pick: () => {} }, ba4: { bg: "transparent", pick: () => {} }, ba5: { bg: "transparent", pick: () => {} }, fa1: { bg: "transparent", pick: () => {} }, fa2: { bg: "transparent", pick: () => {} }, fa3: { bg: "transparent", pick: () => {} }, fa4: { bg: "transparent", pick: () => {} }, fa5: { bg: "transparent", pick: () => {} }, fa6: { bg: "transparent", pick: () => {} }, fa7: { bg: "transparent", pick: () => {} }, rSearch: "", rHasSearch: false, rSearchOpen: false, rSearchRows: [], rLoading: false, rNoRes: false, setRSearch: () => {}, clearRSearch: () => {}, bmRibbonOn: false, bmRibbonOff: () => {}, toggleBookmark: () => {}, bmFill: "none" };
      const qt = s.quranTab;
      const seg = on => on ? { c: "#EA9924", b: "#EA9924" } : { c: "#444444", b: "transparent" };
      const a1 = seg(qt === "surah"), a2 = seg(qt === "juz"), a3 = seg(qt === "saved"), a4 = seg(qt === "dl");
  
      const arD = mod.arDigits;
      // بحث بالسورة أو الآية: "الكهف"، "18"، "الكهف ١٠"
      const normQ = x => String(x || "").replace(/[\u064B-\u0652\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/^سوره\s*/, "").replace(/\s+/g, " ").trim().toLowerCase();
      const qRaw = (s.qSearch || "").trim().replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
      const mAy = /^(.*?)[\s·:]+(\d{1,3})$/.exec(qRaw);
      const qNamePart = mAy ? mAy[1] : qRaw;
      const qAyah = mAy ? parseInt(mAy[2], 10) : null;
      const qName = normQ(qNamePart);
      const qNum = /^\d{1,3}$/.test(qRaw) ? parseInt(qRaw, 10) : null;
      const surahRows = mod.SURAHS.map((su, i) => ({ su, i }))
        .filter(({ su, i }) => {
          if (!qRaw) return true;
          if (qNum != null) return i + 1 === qNum;
          if (!qName) return true;
          return normQ(su.n).indexOf(qName) !== -1 || mod.SURAH_EN[i].toLowerCase().indexOf(qName) !== -1;
        })
        .map(({ su, i }) => ({
          n: String(i + 1), name: en ? mod.SURAH_EN[i] : "سورة " + su.n,
          meta: en ? (su.p === "m" ? "Makki" : "Madani") + " · " + su.a + " ayahs" : (su.p === "m" ? "مكية" : "مدنية") + " · " + arD(su.a) + " آية",
          open: () => this.goPage(this.surahPage(i)),
        }));
      const juzRows = mod.JUZ_PAGES.map((pg, i) => ({
        name: t("الجزء " + arD(i + 1), "Juz " + (i + 1)), page: en ? String(pg) : arD(pg),
        open: () => this.goPage(pg),
      }));
  
      // بحث بالمفردات في نص المصحف كاملًا — مع بريفيو (السورة، الآية، الكلمة المطابقة)
      const qWordActive = !!qRaw && qNum == null && qAyah == null && qName.length >= 2;
      const qWordLoading = qWordActive && !this.qAll && !!this._qAllBusy;
      const wordHits = []; let wCapped = false;
      if (qWordActive && this.qAll) {
        for (const a of this.qAll) {
          if (a.s.indexOf(qName) !== -1) { wordHits.push(a); if (wordHits.length >= 30) { wCapped = true; break; } }
        }
      }
      const qWordRows = wordHits.map(a => {
        const su = mod.SURAHS[a.si];
        const words = a.t.split(" ");
        let wi = words.findIndex(w => this.normH(w).indexOf(qName) !== -1);
        if (wi < 0) wi = 0;
        const from = Math.max(0, wi - 7), to = Math.min(words.length, wi + 9);
        const snip = (from > 0 ? "… " : "") + words.slice(from, to).join(" ") + (to < words.length ? " …" : "");
        return {
          title: t("سورة " + su.n + " · الآية " + arD(a.n), "Surah " + mod.SURAH_EN[a.si] + " · Ayah " + a.n),
          word: words[wi] || qNamePart, t: snip,
          open: () => { this.openSurah(a.si, true); this.setState({ ayahSel: a.n - 1 }); this.scrollToAyah(a.n - 1); },
        };
      });
  
      // —— بحث القارئ (ثابت في الهيدر) ——
      const rRaw = (s.rSearch || "").trim().replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
      const rMAy = /^(.*?)[\s·:]+(\d{1,3})$/.exec(rRaw);
      const rName = normQ(rMAy ? rMAy[1] : rRaw);
      const rAyN = rMAy ? parseInt(rMAy[2], 10) : null;
      const rNum = /^\d{1,3}$/.test(rRaw) ? parseInt(rRaw, 10) : null;
      const rWordActive = !!rRaw && rNum == null && rAyN == null && rName.length >= 2;
      const rRows = [];
      if (rRaw) {
        mod.SURAHS.forEach((su2, i2) => {
          if (rRows.length >= 6) return;
          const hit2 = rNum != null ? (i2 + 1 === rNum) : (!!rName && (normQ(su2.n).indexOf(rName) !== -1 || mod.SURAH_EN[i2].toLowerCase().indexOf(rName) !== -1));
          if (!hit2) return;
          rRows.push({
            title: en ? mod.SURAH_EN[i2] : "سورة " + su2.n,
            sub: en ? (su2.a + " ayahs" + (rAyN ? " · ayah " + rAyN : "")) : (arD(su2.a) + " آية" + (rAyN ? " · الآية " + arD(rAyN) : "")),
            open: () => { this.setState({ rSearch: "" }); this.openSurah(i2, true); if (rAyN) { const ai = Math.max(0, Math.min(rAyN, su2.a) - 1); this.setState({ ayahSel: ai }); this.scrollToAyah(ai); } },
          });
        });
        if (rWordActive && this.qAll) {
          for (const a2 of this.qAll) {
            if (rRows.length >= 14) break;
            if (a2.s.indexOf(rName) === -1) continue;
            const su3 = mod.SURAHS[a2.si];
            const ws2 = a2.t.split(" ");
            let wi2 = ws2.findIndex(w => this.normH(w).indexOf(rName) !== -1);
            if (wi2 < 0) wi2 = 0;
            const f2 = Math.max(0, wi2 - 5), t2 = Math.min(ws2.length, wi2 + 7);
            rRows.push({
              title: en ? mod.SURAH_EN[a2.si] + " · Ayah " + a2.n : "سورة " + su3.n + " · الآية " + arD(a2.n),
              sub: (f2 > 0 ? "… " : "") + ws2.slice(f2, t2).join(" ") + (t2 < ws2.length ? " …" : ""),
              open: () => { this.setState({ rSearch: "" }); this.openSurah(a2.si, true); this.setState({ ayahSel: a2.n - 1 }); this.scrollToAyah(a2.n - 1); },
            });
          }
        }
      }
  
      const idx = Math.min(113, Math.max(0, s.readerIdx || 0));
      const cacheQ = this.qCache || {}, errsQ = this.qErrs || {};
      const ayahs = cacheQ[idx] || [];
      const qErr = !cacheQ[idx] && !!errsQ[idx];
      const qLoading = !cacheQ[idx] && !qErr;
      const pages = this.surahPages(idx);
      const pgCount = pages ? pages.length : 1;
      const pg = Math.min(pgCount - 1, Math.max(0, s.readerPg || 0));
      const curPage = pages ? pages[pg] : null;
      const pageAyahs = curPage ? curPage.ayahs : [];
      let wBase = 0;
      const playingNow = !!s.playing;
      const isBaqPg = idx === 1 && pg === 0 && !!pageAyahs.length && pageAyahs[pageAyahs.length - 1].n <= 5;
      const isBaqPg2 = idx === 1 && pg === 1 && !!pageAyahs.length && pageAyahs[0].n === 6 && pageAyahs[pageAyahs.length - 1].n <= 16;
      const imgPg = idx === 0 || isBaqPg || isBaqPg2;
      const pageAyahRows = pageAyahs.map(a => {
        const ws = a.t.split(" ");
        const start = wBase; wBase += ws.length;
        return {
          i: String(a.k), nAr: arD(a.n),
          bg: s.ayahSel === a.k ? T.hl : "transparent",
          showTafsir: s.ayahSel === a.k && !imgPg,
          pick: () => {
            if (this._noPick && Date.now() - this._noPick < 350) return;
            const open = this.state.ayahSel !== a.k;
            this.setState({ ayahSel: open ? a.k : null });
            if (open) setTimeout(() => {
              const box = document.getElementById("mzSlide"), el = document.getElementById("mzAyah-" + a.k);
              if (box && el) box.scrollTo({ top: Math.max(0, el.offsetTop - box.offsetTop - 8), behavior: "smooth" });
            }, 40);
          },
          showText: !imgPg,
          words: ws.map((w, j) => ({ t: w, bg: playingNow && start + j === (s.playWord || 0) ? "#EFDCA8" : "transparent" })),
        };
      });
  
      // ————— صفحة الفاتحة كصفحة مصحف فيكتور (SVG) بأسطر قابلة للنقر —————
      const ornC = this.props.ornamentColor || "#D3E8EF";
      const ornA = (a) => { const c = String(ornC).replace("#", ""); const v = c.length === 3 ? c.split("").map(x => x + x).join("") : c; const r = parseInt(v.slice(0, 2), 16) || 0, g = parseInt(v.slice(2, 4), 16) || 0, b = parseInt(v.slice(4, 6), 16) || 0; return "rgba(" + r + "," + g + "," + b + "," + a + ")"; };
      const fL = (n) => {
        const pa = imgPg ? pageAyahs.find(x => x.n === n) : null;
        const k = pa ? pa.k : null;
        return {
          bg: k != null && s.ayahSel === k ? "rgba(108 ,200 ,231,0.35)" : "transparent",
          pick: () => {
            if (this._noPick && Date.now() - this._noPick < 350) return;
            if (k == null) return;
            const open = this.state.ayahSel !== k;
            this.setState({ ayahSel: open ? k : null, ayahMenu: open ? "menu" : null });
          },
        };
      };
      const fa1 = fL(1), fa2 = fL(2), fa3 = fL(3), fa4 = fL(4), fa5 = fL(5), fa6 = fL(6), fa7 = fL(7);
      // ── مناطق آيات صفحة المصحف الحالية (مبنيّة من MUSHAF_IMAGES) ──
      const mPg = Math.min(604, Math.max(1, parseInt(s.mPage, 10) || 1));
      const mInfo = (mod.MUSHAF_IMAGES || {})[mPg] || null;
      // ── موضع بطاقة الآية: تحتها إن كانت أعلى الصفحة، وفوقها إن كانت أسفلها ──
      const amSelA = s.ayahSel != null ? ayahs[s.ayahSel] : null;
      const amSelN = amSelA ? amSelA.n : null;
      const amRects = (mInfo && amSelN != null) ? mInfo.r.filter(x => x[0] === amSelN) : [];
      let amPos = "top:42%;";
      if (amRects.length) {
        const aTop = Math.min.apply(null, amRects.map(x => x[1]));
        const aBot = Math.max.apply(null, amRects.map(x => x[1] + x[4]));
        amPos = aTop < 45
          ? "top:" + (aBot + 1.6).toFixed(2) + "%;"
          : "bottom:" + (100 - aTop + 1.6).toFixed(2) + "%;";
      }
      const mSpots = mInfo ? mInfo.r.map(r => {
        const sp = fL(r[0]);
        return {
          pick: sp.pick,
          sty: "position:absolute; top:" + r[1] + "%; left:" + r[2] + "%; width:" + r[3] + "%;"
             + " height:" + r[4] + "%; border-radius:8px; background:" + sp.bg
             + "; cursor:pointer; transition:background .2s;",
        };
      }) : [];
      const ba1 = fa1, ba2 = fa2, ba3 = fa3, ba4 = fa4, ba5 = fa5;
      const bq6 = fL(6), bq7 = fL(7), bq8 = fL(8), bq9 = fL(9), bq10 = fL(10), bq11 = fL(11), bq12 = fL(12), bq13 = fL(13), bq14 = fL(14), bq15 = fL(15), bq16 = fL(16);
      const MAANI_SRC = idx === 0 ? mod.FATIHA_MAANI : (idx === 1 ? mod.BAQARAH_MAANI : []);
      const QIRAAT_SRC = idx === 0 ? mod.FATIHA_QIRAAT : [];
      const ornD = (() => { const c = String(ornC).replace("#", ""); const v = c.length === 3 ? c.split("").map(x => x + x).join("") : c; const f = (i) => Math.round((parseInt(v.slice(i, i + 2), 16) || 0) * 0.68); return "rgb(" + f(0) + "," + f(2) + "," + f(4) + ")"; })();
      this._pageWordCount = wBase;
      const pgImg = (i2, p2) => {
        const n2 = p2 < 0 ? null
          : (i2 === 0 && p2 === 0 ? "images/fatiha-page-t.png"
          : (i2 === 1 && p2 === 0 ? "images/baqarah-page1-t.png"
          : (i2 === 1 && p2 === 1 ? "images/baqarah-page2-t.png" : null)));
        return n2 ? this.res(n2) : null;
      };
      this._flipInfo = {
        hasNext: !!pages && pg < pgCount - 1, hasPrev: !!pages && pg > 0,
        book: idx === 0 || (idx === 1 && pg <= 2),
        nextImg: pgImg(idx, pg + 1), prevImg: pgImg(idx, pg - 1), curImg: pgImg(idx, pg),
        paper: T.paper, paperBorder: T.paperBorder,
      };
      const simpleRows = p2 => (p2 ? p2.ayahs : []).map(a => ({ t: a.t, nAr: arD(a.n) }));
      const nextPageRows = simpleRows(pages && pg < pgCount - 1 ? pages[pg + 1] : null);
      const prevPageRows = simpleRows(pages && pg > 0 ? pages[pg - 1] : null);
      const selA = s.ayahSel != null ? ayahs[s.ayahSel] : null;
      const surahInfo = mod.SURAHS[idx];
      const si = idx;
      const recs = en ? mod.RECITERS_EN : mod.RECITERS;
  
      const chipRow = (list, sel, pickKey) => list.map((n, i) => ({
        name: n, bg: sel === i ? "#1589BC" : T.card, color: sel === i ? "#FFFFFF" : T.green2, border: sel === i ? "#1589BC" : T.mint,
        pick: () => this.set({ [pickKey]: i }),
      }));
  
      // المحفوظات — قوائم تراكمية، الحذف يدوي فقط
      const savedAyahRows = (s.savedAyahs || []).map((v, i2) => ({
        title: v.n ? t("سورة " + mod.SURAHS[v.si].n + " · الآية " + arD(v.n), "Surah " + mod.SURAH_EN[v.si] + " · Ayah " + v.n) : t("موضع قراءة — سورة " + mod.SURAHS[v.si].n, "Reading position — " + mod.SURAH_EN[v.si]),
        t: v.t || "", hasT: !!v.t,
        open: () => { this.openSurah(v.si, true); if (v.n) { this.setState({ ayahSel: v.n - 1 }); this.scrollToAyah(v.n - 1); } },
        del: () => { this.set({ savedAyahs: (this.state.savedAyahs || []).filter((_, j) => j !== i2) }); this.showToast(t("حُذفت من المحفوظات", "Removed from Saved")); },
      }));
      const savedHadithRows = (s.savedHadiths || []).map((v, i2) => {
        const isObj = v && typeof v === "object";
        const fi = isObj ? -1 : mod.HADITHS.findIndex(h => h.id === v);
        const feat = fi >= 0 ? ((en && mod.HADITHS_EN && mod.HADITHS_EN[fi]) ? { ...mod.HADITHS[fi], ...mod.HADITHS_EN[fi] } : mod.HADITHS[fi]) : null;
        const txt = isObj ? String(v.t || "") : (feat ? feat.t : "");
        return {
          t: txt.length > 140 ? txt.slice(0, 140) + "…" : txt,
          src: isObj ? (v.src || "") : (feat ? feat.src : ""),
          open: () => { if (isObj) this.setState({ hApiSel: { id: v.id, t: v.t, src: v.src, grade: t("صحيح", "Sahih") } }); else this.setState({ hadithSel: v, hApiSel: null }); this.go("hadithDetail"); },
          del: () => { this.set({ savedHadiths: (this.state.savedHadiths || []).filter((_, j) => j !== i2) }); this.showToast(t("حُذف من المحفوظات", "Removed from Saved")); },
        };
      }).filter(r => r.t);
  
      // التنزيلات — سور منزّلة بصوت القارئ المختار
      const dlRows = (s.downloads || []).map((d, i2) => ({
        name: d.n ? t("سورة " + mod.SURAHS[d.si].n + " · الآية " + arD(d.n), mod.SURAH_EN[d.si] + " · Ayah " + d.n) : t("سورة " + mod.SURAHS[d.si].n, "Surah " + mod.SURAH_EN[d.si]),
        meta: recs[d.r] + " · " + t(d.mb + " م.ب", d.mb + " MB"),
        open: () => this.openSurah(d.si, true),
        play: () => this.showToast(t("تشغيل دون اتصال — بصوت ", "Playing offline — ") + recs[d.r]),
        del: () => { this.set({ downloads: (this.state.downloads || []).filter((_, j) => j !== i2) }); this.showToast(t("حُذفت السورة من التنزيلات", "Download removed")); },
      }));
      const dlOpen = s.dlSheetOpen;
  
      const rsOpen = s.readerSettingsOpen;
      return {
        qWordRows, qWordLoading, qHasWordResults: wordHits.length > 0,
        qWordCountTxt: t(wordHits.length + " نتيجة في آيات المصحف" + (wCapped ? " — تُعرض أول 30" : ""), wordHits.length + " matches in ayahs" + (wCapped ? " — first 30 shown" : "")),
        savedAyahRows, savedAyahsEmpty: savedAyahRows.length === 0, savedAyahCount: String(savedAyahRows.length),
        savedHadithRows, savedHEmpty: savedHadithRows.length === 0, savedHCount: String(savedHadithRows.length),
        dlRows, dlEmpty: dlRows.length === 0,
        qIsDl: qt === "dl", qTabDl: () => this.setState({ quranTab: "dl" }), qDlColor: a4.c, qDlBorder: a4.b,
        openDlSheet: () => this.setState({ dlSheetOpen: true }),
        closeDlSheet: () => { if (!this.state.dlBusy) this.setState({ dlSheetOpen: false }); },
        dlScrimSty: "position:absolute; inset:0; background:rgba(19,35,33," + (dlOpen ? "0.45" : "0") + "); z-index:44; transition:background .3s; pointer-events:" + (dlOpen ? "auto" : "none"),
        dlSheetSty: "position:absolute; left:0; right:0; bottom:0; z-index:45; background:" + T.sheet + "; border-radius:24px 24px 0 0; padding:14px 20px 26px; display:flex; flex-direction:column; box-shadow:0 -10px 40px rgba(0,0,0,0.18); transform:translateY(" + (dlOpen ? "0" : "105%") + "); transition:transform .35s cubic-bezier(.2,.8,.2,1)",
        dlBusy: !!s.dlBusy, dlIdle: !s.dlBusy,
        dlBarW: Math.round(s.dlProgress || 0) + "%",
        dlPctTxt: t("جارِ التنزيل… ", "Downloading… ") + Math.round(s.dlProgress || 0) + "%",
        dlSurahTxt: t("سورة " + surahInfo.n + " — تُحفظ بصوت القارئ المحدد أدناه", mod.SURAH_EN[si] + " — saved with the reciter below"),
        startDl: () => {
          if (this.state.dlBusy) return;
          const ex = (this.state.downloads || []).some(d => d.si === idx && d.r === this.state.reciter);
          if (ex) { this.showToast(t("السورة منزّلة مسبقاً بهذا القارئ", "Already downloaded with this reciter")); return; }
          this.setState({ dlBusy: true, dlProgress: 4 });
          clearInterval(this._dlT);
          this._dlT = setInterval(() => {
            const p = (this.state.dlProgress || 0) + 8 + Math.random() * 15;
            if (p >= 100) {
              clearInterval(this._dlT);
              const mb = Math.max(1, Math.round(surahInfo.a * 0.14));
              this.setState({ dlBusy: false, dlProgress: 0, dlSheetOpen: false });
              this.set({ downloads: [...(this.state.downloads || []), { si: idx, r: this.state.reciter, mb }] });
              this.showToast(t("تم التنزيل — متاحة في تبويب المنزّلة", "Downloaded — see the Downloads tab"));
            } else this.setState({ dlProgress: p });
          }, 150);
        },
        saveAyahFn: () => {
          if (!selA) return;
          const ex = (this.state.savedAyahs || []).some(v => v.si === idx && v.n === selA.n);
          if (ex) { this.showToast(t("الآية محفوظة مسبقاً", "Ayah already saved")); return; }
          const snip = selA.t.length > 110 ? selA.t.slice(0, 110) + "…" : selA.t;
          this.set({ savedAyahs: [...(this.state.savedAyahs || []), { si: idx, n: selA.n, t: snip }] });
          this.showToast(t("أُضيفت الآية إلى المحفوظات", "Ayah added to Saved"));
        },
        amOn: !!(imgPg && selA && s.ayahMenu && s.ayahMenu !== "tafsir" && s.ayahMenu !== "listen"),
        // ── ورقة الاستماع إلى الآية ──
        lisOn: !!(imgPg && selA && s.ayahMenu === "listen"),
        lisClose: () => this.setState({ ayahMenu: null, ayahSel: null }),
        // ── ورقة تفسير الآية ──
        tafOn: !!(imgPg && selA && s.ayahMenu === "tafsir"),
        tafHead: selA ? t("سورة " + surahInfo.n + " – الآية " + selA.n,
                          mod.SURAH_EN[si] + " – Ayah " + selA.n) : "",
        tafBookName: (en ? mod.TAFSIRS_EN : mod.TAFSIRS)[s.tafsirBook] || "",
        tafDropOn: !!s.tafDrop,
        tafRot: s.tafDrop ? 180 : 0,
        toggleTafDrop: () => this.setState({ tafDrop: !this.state.tafDrop }),
        tafBookRows: (en ? mod.TAFSIRS_EN : mod.TAFSIRS).map((n, k) => ({
          name: n,
          bg: s.tafsirBook === k ? T.mint : "transparent",
          check: s.tafsirBook === k ? "block" : "none",
          pick: () => { this.set({ tafsirBook: k }); this.setState({ tafDrop: false }); },
        })),
        tafClose: () => this.setState({ ayahMenu: null, ayahSel: null, tafDrop: false }),
        amIsMenu: s.ayahMenu === "menu", amIsTafsir: s.ayahMenu === "tafsir", amIsListen: s.ayahMenu === "listen",
        amIsAsk: s.ayahMenu === "dlAsk", amIsMaani: s.ayahMenu === "maani", amIsAsbab: s.ayahMenu === "asbab",
        amNumTxt: selA ? t("الآية " + arD(selA.n) + " · " + surahInfo.n, "Ayah " + selA.n + " · " + mod.SURAH_EN[si]) : "",
        amAyahTxt: selA ? selA.t : "",
        amShowAyah: !!(s.ayahMenu && s.ayahMenu !== "menu"),
        amSty: (() => {
          const boxes = idx === 0 ? { 1: [30.2, 34.9], 2: [36.1, 40.3], 3: [42.3, 46.6], 4: [42.3, 46.6], 5: [48.8, 52.5], 6: [48.8, 58.9], 7: [54.5, 70.7] }
            : (isBaqPg2 ? { 6: [8.5, 19.4], 7: [14.4, 24.6], 8: [20, 30.2], 9: [30.5, 41.4], 10: [36.5, 46.7], 11: [42.1, 52.3], 12: [47.6, 57.9], 13: [53, 69], 14: [64.2, 80.5], 15: [76, 86], 16: [81.1, 91.4] }
              : { 1: [35.7, 39.9], 2: [35.7, 46.3], 3: [41.7, 52.4], 4: [47.7, 58.6], 5: [59.7, 70.2] });
          const box = boxes[selA ? selA.n : 1] || [30, 35];
          const wide = s.ayahMenu && s.ayahMenu !== "menu";
          const place = box[1] < 55 ? "top:" + (box[1] + 2).toFixed(1) + "%;" : "bottom:" + (100 - box[0] + 2).toFixed(1) + "%;";
          return "position:absolute; z-index:21; left:50%; transform:translateX(-50%); " + place +
            " width:" + (wide ? "90%" : "62%") + "; max-width:" + (wide ? "320px" : "216px") +
            "; border-radius:0px; background:" + T.card + "; border:1px solid " + T.paperBorder +
            "; box-shadow:0 14px 36px rgba(0,0,0,0.30); display:flex; flex-direction:column; overflow:hidden; animation:muznFadeUp .2s ease;";
        })(),
        amClose: () => this.setState({ ayahSel: null, ayahMenu: null }),
        amBack: () => this.setState({ ayahMenu: "menu" }),
        amGoTafsir: () => this.setState({ ayahMenu: "tafsir" }),
        amGoListen: () => this.setState({ ayahMenu: "listen" }),
        amGoMaani: () => this.setState({ ayahMenu: "maani" }),
        amGoAsbab: () => this.setState({ ayahMenu: "asbab" }),
        amAsbabTxt: idx === 0 ? (en ? mod.FATIHA_ASBAB_EN : mod.FATIHA_ASBAB) : (en ? mod.BAQARAH_ASBAB_EN : mod.BAQARAH_ASBAB),
        amRecRows: recs.map((nm, ri) => ({
          name: nm, bg: s.reciter === ri ? T.mint : T.soft, color: s.reciter === ri ? T.green : T.text,
          dotBg: s.reciter === ri ? "#1589BC" : "transparent",
          dotLine: s.reciter === ri ? "#1589BC" : "#9AA4AE",
          dotArrow: s.reciter === ri ? "#FFFFFF" : "#3B4148",
          pick: () => this.setState({ reciter: ri, ayahMenu: "dlAsk" }),
        })),
        amAskTxt: t("تنزيل تلاوة الآية بصوت " + recs[s.reciter] + " للاستماع إليها دون اتصال؟", "Download this ayah recited by " + recs[s.reciter] + " for offline listening?"),
        amDlConfirm: () => {
          if (!selA) return;
          const n3 = selA.n, rec = recs[this.state.reciter];
          this.setState({ ayahMenu: null, ayDl: true });
          this.showToast(t("جاري تنزيل السورة  بصوت القارئ " + rec + "..",
                           "Downloading the surah recited by " + rec + "..") , 1800);
          clearTimeout(this._dlWait);
          this._dlWait = setTimeout(() => {
            const ex = (this.state.downloads || []).some(d => d.si === idx && d.r === this.state.reciter && d.n === n3);
            if (!ex) this.set({ downloads: [...(this.state.downloads || []), { si: idx, r: this.state.reciter, mb: 1, n: n3 }] });
            this.setState({ ayDl: false });
            this.showToast(t("تم تنزيل السورة بنجاح", "Surah downloaded successfully"));
            this.startAyahPlay(n3, true);
          }, 1800);
        },
        amShare: () => { this.showToast(t("تم نسخ الآية للمشاركة", "Ayah copied for sharing")); this.setState({ ayahMenu: null, ayahSel: null }); },
        amSave: () => {
          if (!selA) return;
          const ex = (this.state.savedAyahs || []).some(v => v.si === idx && v.n === selA.n);
          if (ex) this.showToast(t("الآية محفوظة مسبقاً", "Ayah already saved"));
          else {
            this.set({ savedAyahs: [...(this.state.savedAyahs || []), { si: idx, n: selA.n, t: selA.t }] });
            this.showToast(t("أُضيفت الآية إلى المحفوظات", "Ayah added to Saved"));
          }
          this.setState({ ayahMenu: null, ayahSel: null });
        },
        qIsSurah: qt === "surah", qIsJuz: qt === "juz", qIsSaved: qt === "saved",
        qTabSurah: () => this.setState({ quranTab: "surah" }), qTabJuz: () => this.setState({ quranTab: "juz" }), qTabSaved: () => this.setState({ quranTab: "saved" }),
        qSurahColor: a1.c, qSurahBorder: a1.b, qJuzColor: a2.c, qJuzBorder: a2.b, qSavedColor: a3.c, qSavedBorder: a3.b,
        lastReadTxt: en ? mod.SURAH_EN[si] : "سورة " + surahInfo.n,
        homeLastSurah: en ? mod.SURAH_EN[si] : "سورة " + surahInfo.n,
        // متابعة القراءة تفتح صفحة المصحف لا القارئ
        goLastPage: () => this.goPage(this.surahPage(this.state.readerIdx || 0)),
        homeLastPage: en ? "Page " + (pg + 1) + " of " + pgCount
                         : "صفحة " + arD(pg + 1) + " من " + arD(pgCount),
        surahRows, juzRows, pageAyahRows, nextPageRows, prevPageRows, qLoading, qErr,
        pgIsFirst: pg === 0, prevIsFirst: pg === 1,
        fa1, fa2, fa3, fa4, fa5, fa6, fa7, ba1, ba2, ba3, ba4, ba5, isFatihaPg: idx === 0, isBaqPg, isBaqPg2,
        mSpots, amPos,
        // ── شريط تشغيل التلاوة فوق الآية ──
        ...(() => {
          const n4 = s.ayPlay;
          if (n4 == null) return { ayOn: false, ayTop: "0%", ayProgW: "0%", ayPauseIcon: "", ayToggle: () => {}, ayStop: () => {} };
          const r4 = (mInfo && mInfo.r.filter(x => x[0] === n4)) || [];
          const last = r4.length ? r4[r4.length - 1] : null;
          return {
            ayOn: !!s.ayBar,
            ayTop: last ? (last[1] + last[4] + 1.2) + "%" : "50%",
            ayProgW: (s.ayProg || 0) + "%",
            ayPauseIcon: s.ayPaused ? "M1,6.49v26.58c0,4.2,4.52,6.84,8.17,4.78l23.34-13.16c3.7-2.09,3.72-7.41,.04-9.53L9.21,1.74C5.56-.36,1,2.27,1,6.49Z" : "M9 5.5 V18.5 M15 5.5 V18.5",
            ayPausebox: s.ayPaused ? "0 0 36.3 39.56" : "0 0 24 24",
            ayPauseWidth: s.ayPaused ? 12 : 20, ayPauseHeight: s.ayPaused ? 12 : 20,
            ayToggle: () => this.setState({ ayPaused: !this.state.ayPaused }),
            ayStop: () => this.stopAyahPlay(),
          };
        })(),
        bq6, bq7, bq8, bq9, bq10, bq11, bq12, bq13, bq14, bq15, bq16, showBasmala: pg === 0 && !imgPg,
        ornC, ornD, ornSoft: ornA(0.13), ornFaint: ornA(0.4), ornMid: ornA(0.62),
        pageNumFoot: curPage && curPage.gpg ? arD(curPage.gpg) : arD(pg + 1),
        showPageFoot: !imgPg,
        slideSty: (imgPg
          ? "position:absolute; top:-8px; left:-11px; right:-11px; bottom:-11px; border-radius:10px; will-change:transform; overflow:hidden; background:transparent; border:none; padding:0;"
          : "position:absolute; inset:0; border-radius:16px; will-change:transform; overflow-y:auto; background:" + T.paper + "; border:1px solid " + T.paperBorder + "; box-shadow:0 4px 20px rgba(0,0,0,0.05); padding:16px 18px 18px;"),
        showMushafTip: !s.mushafTipSeen && !qLoading && !qErr,
        dismissTip: () => this.set({ mushafTipSeen: true }),
        playing: !!s.playing, notPlaying: !s.playing,
        flipDown: e => this.flipDown(e), flipMove: e => this.flipMove(e), flipUp: () => this.flipUp(),
        pageFwd: () => this.slidePage(1), pageBack: () => this.slidePage(-1),
        arrowNextSty: "width:28px; height:28px; flex-shrink:0; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:opacity .25s;" + (this._flipInfo.hasNext ? " opacity:0.55; pointer-events:auto;" : " opacity:0.12; pointer-events:none;"),
        arrowPrevSty: "width:28px; height:28px; flex-shrink:0; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:opacity .25s;" + (this._flipInfo.hasPrev ? " opacity:0.55; pointer-events:auto;" : " opacity:0.12; pointer-events:none;"),
        arrowStroke: T.green,
        qFs: s.qFs || 21, qFsN: Math.round((s.qFs || 21) * 0.72), qFsVal: String(s.qFs || 21), qFsTxt: (s.qFs || 21) + "px",
        setQFs: e => this.set({ qFs: +e.target.value }),
        qFontFam: this.qFonts()[s.qFont || 0].fam,
        qLh: String(s.qLh || 1.65), qLhVal: String(s.qLh || 1.65), qLhTxt: (s.qLh || 1.65).toFixed(2),
        setQLh: e => this.set({ qLh: +e.target.value }),
        qFontRows: this.qFonts().map((f, i) => {
          const on = (s.qFont || 0) === i;
          return {
            name: t(f.ar, f.en), sample: f.sample, fam: f.fam,
            bg: on ? "#E9F3F0" : T.card, border: on ? "#1589BC" : T.navBorder,
            color: on ? "#1589BC" : T.text,
            pick: () => { this.set({ qFont: i }); this.showToast(t("خط المصحف: ", "Mushaf font: ") + t(f.ar, f.en)); }
          };
        }),
        retryLoad: () => this.loadSurah(idx),
        savedPosTxt: s.bookmarkIdx == null ? t("لا يوجد موضع محفوظ بعد", "No saved position yet") : t("سورة " + mod.SURAHS[s.bookmarkIdx].n, "Surah " + mod.SURAH_EN[s.bookmarkIdx]),
        qSearch: s.qSearch || "",
        setQSearch: e => { const v = e.target.value; this.setState({ qSearch: v }); if (v && v.trim().length >= 2) this.loadQuranAll(); },
        clearQSearch: () => this.setState({ qSearch: "" }),
        qHasSearch: !!qRaw,
        qNoResults: !!qRaw && surahRows.length === 0 && wordHits.length === 0 && !qWordLoading,
        rSearch: s.rSearch || "",
        setRSearch: e => { const v = e.target.value; this.setState({ rSearch: v }); if (v && v.trim().length >= 2) this.loadQuranAll(); },
        clearRSearch: () => this.setState({ rSearch: "" }),
        rHasSearch: !!rRaw, rSearchOpen: !!rRaw,
        rLoading: rWordActive && !this.qAll,
        rNoRes: !!rRaw && rRows.length === 0 && !(rWordActive && !this.qAll),
        rSearchRows: rRows,
        openBookmark: () => { if (s.bookmarkIdx != null) this.openSurah(s.bookmarkIdx, true); },
        readerSurah: surahInfo.n,
        readerSurahLabel: en ? mod.SURAH_EN[si] : "سورة " + surahInfo.n,
        readerPageTxt: en ? "Page " + (pg + 1) + " of " + pgCount : "الصفحة " + arD(pg + 1) + " من " + arD(pgCount),
        readerBasmala: (idx === 0 || idx === 8) ? "أعوذ بالله من الشيطان الرجيم" : "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        readerPageAr: arD(idx + 1),
        readerBarW: Math.max(4, Math.round((pg + 1) / pgCount * 100)) + "%",
        pagePrev: () => { if (idx > 0) this.openSurah(idx - 1); },
        pageNext: () => { if (idx < 113) this.openSurah(idx + 1); },
        toggleBookmark: () => {
          const ex = (this.state.savedAyahs || []).some(v => v.si === idx && !v.n);
          this.set({ bmRibbon: { si: idx, pg: pg } });
          if (ex) { this.showToast(t("الإشارة مثبّتة على الصفحة — انقرها لإزالتها", "Ribbon pinned on the page — tap it to remove")); return; }
          this.set({ bookmarkIdx: idx, savedAyahs: [...(this.state.savedAyahs || []), { si: idx, n: null, t: "" }] });
          this.showToast(t("أُضيف الموضع إلى المحفوظات — انقر الإشارة الحمراء لإزالتها", "Position saved — tap the red ribbon to remove it"));
        },
        bmFill: (s.savedAyahs || []).some(v => v.si === idx && !v.n) ? "#EA9924" : "none",
        bmRibbonOn: !!(s.bmRibbon && s.bmRibbon.si === idx && s.bmRibbon.pg === pg),
        bmRibbonOff: () => { this.set({ bmRibbon: null }); this.showToast(t("أُزيلت إشارة الحفظ من الصفحة", "Bookmark ribbon removed")); },
        tafsirSty: "border-radius:16px; background:" + T.card + "; box-shadow:0 6px 24px rgba(0,0,0,0.18); padding:14px 16px; margin-top:12px; display:" + (selA ? "flex" : "none") + "; flex-direction:column; animation:muznFadeUp .3s ease",
        tafsirTitle: selA ? (en ? mod.TAFSIRS_EN : mod.TAFSIRS)[s.tafsirBook] + t(" · الآية " + arD(selA.n), " · Ayah " + selA.n) : "",
        tafsirText: selA ? (en ? ((idx === 0 ? mod.FATIHA_TF_EN[s.ayahSel] : null) || selA.tf) : selA.tf) : "",
        gtMaani: selA ? MAANI_SRC.filter(m => m.a === selA.n) : [],
        gtQiraat: selA ? QIRAAT_SRC.filter(m => m.a === selA.n) : [],
        gtHasMaani: !!(selA && MAANI_SRC.some(m => m.a === selA.n)),
        gtHasQiraat: !!(selA && QIRAAT_SRC.some(m => m.a === selA.n)),
        gtHasAny: !!(selA && (MAANI_SRC.some(m => m.a === selA.n) || QIRAAT_SRC.some(m => m.a === selA.n))),
        gtNoMaani: !(selA && MAANI_SRC.some(m => m.a === selA.n)),
        gtMaaniLabel: t("المعاني", "Word meanings"),
        gtQiraatLabel: t("القراءات · عاصم الكوفي / حفص", "Qira'at · Asim al-Kufi / Hafs"),
        gtSrc: idx === 0 ? t("منقول كما هو من موقع التفاسير العظيمة — greattafsirs.com", "Verbatim from GreatTafsirs.com") : "",
        closeTafsir: () => this.setState({ ayahSel: null }),
        playAyah: () => this.showToast(t("جارٍ التشغيل بصوت ", "Playing recitation by ") + recs[s.reciter]),
        playSurahHdr: () => {
          if (s.playing) { this.stopPlay(); this.showToast(t("تم إيقاف التلاوة مؤقتاً", "Recitation paused")); return; }
          this.setState({ playing: true, playWord: 0 });
          this.restartPlayTick();
          this.showToast(t("جارٍ تلاوة سورة " + surahInfo.n + " بصوت " + recs[s.reciter], "Reciting Surah " + mod.SURAH_EN[si] + " — " + recs[s.reciter]));
        },
        reciterName: recs[s.reciter].split(" ")[0] + " " + (recs[s.reciter].split(" ")[1] || ""),
        openReaderSettings: () => this.setState({ readerSettingsOpen: true }),
        closeReaderSettings: () => this.setState({ readerSettingsOpen: false }),
        rsScrimSty: "position:absolute; inset:0; background:rgba(19,35,33," + (rsOpen ? "0.45" : "0") + "); z-index:44; transition:background .3s; pointer-events:" + (rsOpen ? "auto" : "none"),
        rsSheetSty: "position:absolute; left:0; right:0; bottom:0; z-index:45; background:" + T.sheet + "; border-radius:24px 24px 0 0; padding:14px 20px 26px; display:flex; flex-direction:column; box-shadow:0 -10px 40px rgba(0,0,0,0.18); transform:translateY(" + (rsOpen ? "0" : "105%") + "); transition:transform .35s cubic-bezier(.2,.8,.2,1)",
        reciterRows: chipRow(recs, s.reciter, "reciter"),
        tafsirRows: chipRow(en ? mod.TAFSIRS_EN : mod.TAFSIRS, s.tafsirBook, "tafsirBook"),
      };
    }
  
    hadithVals() {
      const s = this.state, mod = s.mod;
      const T = this.th2();
      const en = s.lang === "en";
      const t = (a, b) => en ? b : a;
      if (!mod) return { hdText: "", hdSrc: "", hdGrade: "", hdEx: "", hdSaveLabel: "", hdHasEx: true, hadithCatRows: [], hadithRows: [], hBookRows: [], hSectionRows: [], hApiRows: [], hIsFeatured: true, hShowSections: false, hShowHadiths: false, hLoading: false, hErr: false, hSecTitle: "", hRetryFn: () => {}, hBackToSections: () => {}, hShowSearch: false, hSearchRows: [], hResultTxt: "", hSearch: "", setHSearch: () => {}, clearHSearch: () => {}, hHasSearch: false, hFeaturedEmpty: false, hSearchPhTxt: "" };
      const cats = mod.HADITH_CATS.map((c, i) => ({
        name: en ? mod.HADITH_CATS_EN[i] : c, bg: s.hadithCat === c ? "#EA9924" : "rgba(224,238,245,1)",
        color: s.hadithCat === c ? "#132321" : "#444444",
        pick: () => this.setState({ hadithCat: c }),
      }));
      const hQn = this.normH((s.hSearch || "").trim());
      const list = mod.HADITHS.filter(h => (s.hadithCat === "الكل" || h.cat === s.hadithCat) && (!hQn || this.normH(h.t).indexOf(hQn) !== -1));
      const loc = h => { const i = mod.HADITHS.indexOf(h); const e = mod.HADITHS_EN ? mod.HADITHS_EN[i] : null; return en && e ? { ...h, t: e.t, src: e.src, grade: e.grade, ex: e.ex, cat: mod.HADITH_CATS_EN[mod.HADITH_CATS.indexOf(h.cat)] || h.cat } : h; };
      const savedHIds = (s.savedHadiths || []).map(x => (x && typeof x === "object") ? x.id : x);
      const rows = list.map(h0 => { const h = loc(h0); const mw = hQn ? this.matchWord(h.t, hQn) : ""; return {
        ...h, bmFill: savedHIds.includes(h.id) ? "#EA9924" : "none",
        word: mw, wordDisp: mw ? "inline-block" : "none",
        open: () => { this.setState({ hadithSel: h.id, hApiSel: null }); this.go("hadithDetail"); },
      }; });
      const sel = loc(mod.HADITHS.find(h => h.id === s.hadithSel) || mod.HADITHS[0]);
  
      // ─── صحيح البخاري / صحيح مسلم (كاملان، مرتبان حسب الكتب) ───
      const A = s.hApiSel;
      const hb = s.hadithBook || "featured";
      const hc = (this.hCache || {})[hb];
      const hErr2 = !!((this.hErrs || {})[hb]);
      const arD2 = mod.arDigits;
      const bookLabel = { featured: t("مختارات مشروحة", "Curated"), bukhari: t("صحيح البخاري", "Sahih al-Bukhari"), muslim: t("صحيح مسلم", "Sahih Muslim"), saved: t("المحفوظة", "Saved") };
      const hBookRows = ["featured", "bukhari", "muslim", "saved"].map(k => ({
        name: bookLabel[k],
        bg: hb === k ? "#EA9924" : "rgba(224,238,245,1)",
        color: hb === k ? "#132321" : "#444444",
        pick: () => { this.setState({ hadithBook: k, hSection: null }); if (k !== "featured" && k !== "saved") this.loadHBook(k); },
      }));
      const hSectionRows = (hb !== "featured" && hc && s.hSection == null) ? hc.sections.map(sec => ({
        name: sec.name, count: t(sec.count + " حديث", sec.count + " hadiths"),
        open: () => this.setState({ hSection: sec.num }),
      })) : [];
      const curSec = (hc && s.hSection != null) ? hc.sections.find(x => x.num === s.hSection) : null;
      const srcName = hb === "bukhari" ? t("صحيح البخاري", "Sahih al-Bukhari") : t("صحيح مسلم", "Sahih Muslim");
      const hApiRows = (hc && s.hSection != null) ? (hc.bySec[s.hSection] || []).map(h => {
        const id = hb[0] + h.n;
        return {
          t: h.t.length > 260 ? h.t.slice(0, 260) + "…" : h.t,
          numTxt: t("حديث " + h.n, "Hadith " + h.n),
          src: srcName + (curSec ? " · " + curSec.name : ""), grade: t("صحيح", "Sahih"),
          bmFill: savedHIds.includes(id) ? "#EA9924" : "none",
          open: () => { this.setState({ hApiSel: { id, t: h.t, src: srcName + " · " + (curSec ? curSec.name + " · " : "") + t("رقم ", "No. ") + h.n, grade: t("صحيح", "Sahih") } }); this.go("hadithDetail"); },
        };
      }) : [];
      // بحث نصي في الكتاب كاملًا
      const hSearchAll = [];
      let hCapped = false;
      if (hc && hQn && hb !== "featured") {
        for (const h of hc.all) {
          if (h.s.indexOf(hQn) !== -1) { hSearchAll.push(h); if (hSearchAll.length >= 60) { hCapped = true; break; } }
        }
      }
      const hSearchRows = hSearchAll.map(h => ({
        t: h.t.length > 260 ? h.t.slice(0, 260) + "…" : h.t,
        numTxt: t("حديث " + h.n, "Hadith " + h.n),
        src: srcName + " · " + (hc.secName[h.sec] || ""), grade: t("صحيح", "Sahih"),
        word: this.matchWord(h.t, hQn),
        bmFill: savedHIds.includes(hb[0] + h.n) ? "#EA9924" : "none",
        open: () => { this.setState({ hApiSel: { id: hb[0] + h.n, t: h.t, src: srcName + " · " + (hc.secName[h.sec] ? hc.secName[h.sec] + " · " : "") + t("رقم ", "No. ") + h.n, grade: t("صحيح", "Sahih") } }); this.go("hadithDetail"); },
      }));
      const selId = A ? A.id : sel.id;
      const saved = savedHIds.includes(selId);
      return {
        hadithCatRows: cats, hadithRows: rows,
        hBookRows, hSectionRows, hApiRows,
        hIsFeatured: hb === "featured",
        hIsSaved: hb === "saved", hNotSaved: hb !== "saved",
        hShowSections: hb !== "featured" && !!hc && s.hSection == null && !hQn,
        hShowHadiths: hb !== "featured" && !!hc && s.hSection != null && !hQn,
        hShowSearch: hb !== "featured" && !!hc && !!hQn,
        hSearchRows,
        hResultTxt: hSearchAll.length === 0 ? t("لا توجد نتائج مطابقة", "No matching results") : t(hSearchAll.length + " نتيجة" + (hCapped ? " — تُعرض أول 60" : ""), hSearchAll.length + " results" + (hCapped ? " — first 60 shown" : "")),
        hSearch: s.hSearch || "",
        setHSearch: e => this.setState({ hSearch: e.target.value }),
        clearHSearch: () => this.setState({ hSearch: "" }),
        hHasSearch: !!hQn,
        hFeaturedEmpty: hb === "featured" && !!hQn && rows.length === 0,
        hSearchPhTxt: hb === "featured" ? t("ابحث في المختارات…", "Search curated…") : (hb === "bukhari" ? t("ابحث في صحيح البخاري كاملًا…", "Search all of Sahih al-Bukhari…") : t("ابحث في صحيح مسلم كاملًا…", "Search all of Sahih Muslim…")),
        hLoading: hb !== "featured" && hb !== "saved" && !hc && !hErr2,
        hErr: hb !== "featured" && !hc && hErr2,
        hRetryFn: () => this.loadHBook(hb),
        hBackToSections: () => this.setState({ hSection: null }),
        hSecTitle: curSec ? curSec.name : "",
        hdText: A ? A.t : sel.t, hdSrc: A ? A.src : sel.src, hdGrade: A ? A.grade : sel.grade, hdEx: A ? "" : sel.ex,
        hdHasEx: !A,
        playHadith: () => this.showToast(t("جارٍ تشغيل الحديث صوتياً", "Playing hadith audio")),
        hdSaveLabel: t(saved ? "محفوظ" : "حفظ", saved ? "Saved" : "Save"), hdSaveBg: saved ? T.mint : T.card,
        hdSaveColor: T.green, hdSaveFill: saved ? "#EA9924" : "none", hdSaveIconC: saved ? "#EA9924" : T.green,
        hdToggleSave: () => {
          if (saved) { this.showToast(t("محفوظ مسبقاً — الحذف من تبويب المحفوظة في صفحة الحديث", "Already saved — delete from the Saved tab in Hadith")); return; }
          const entry = A ? { id: A.id, t: A.t, src: A.src } : sel.id;
          this.set({ savedHadiths: [...s.savedHadiths, entry] });
          this.showToast(t("تمت الإضافة إلى المحفوظات", "Added to Saved"));
        },
        // تبيان
        chatRows: (s.messages || []).map(m => ({
          t: m.t, src: m.src || "", hasSrc: !!m.src,
          align: m.role === "user" ? "flex-end" : "flex-start",
          bg: m.role === "user" ? "#1589BC" : T.card,
          color: m.role === "user" ? "#FFFFFF" : T.text,
          radius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        })),
        thinking: s.thinking, draft: s.draft,
        setDraft: e => this.setState({ draft: e.target.value }),
        draftKey: e => { if (e.key === "Enter") this.sendTibyan(); },
        sendMsg: () => this.sendTibyan(),
        suggestionRows: en ? [
          { t: "Tafsir of today's ayah?", ask: () => this.sendTibyan("What is the tafsir of today's ayah?") },
          { t: "Tafsir of Ayat al-Kursi", ask: () => this.sendTibyan("What is the tafsir of Ayat al-Kursi?") },
          { t: "Explain the hadith on intentions", ask: () => this.sendTibyan("Explain the hadith: actions are but by intentions") },
        ] : [
          { t: "ما تفسير آية اليوم؟", ask: () => this.sendTibyan("ما تفسير آية اليوم؟") },
          { t: "تفسير آية الكرسي", ask: () => this.sendTibyan("ما تفسير آية الكرسي؟") },
          { t: "شرح حديث النية", ask: () => this.sendTibyan("اشرح حديث إنما الأعمال بالنيات") },
        ],
      };
    }
  
    sendTibyan(txt) {
      const s = this.state, mod = s.mod;
      const q = (txt || s.draft || "").trim();
      if (!q || s.thinking) return;
      this.setState({ messages: [...(s.messages || []), { role: "user", t: q }], draft: "", thinking: true });
      setTimeout(() => {
        const en2 = this.state.lang === "en";
        const canned = mod ? (en2 ? mod.TIBYAN_CANNED_EN : mod.TIBYAN_CANNED) : [];
        const hit = canned.find(c => c.k.some(k => q.toLowerCase().includes(k)));
        const ans = hit || (mod ? (en2 ? mod.TIBYAN_DEFAULT_EN : mod.TIBYAN_DEFAULT) : { t: "…" });
        this.setState(st => ({ thinking: false, messages: [...st.messages, { role: "ai", t: ans.t, src: ans.src }] }));
      }, 1400);
    }
  
    // ─── قيم الإنجاز والأذكار والختمة والمزيد ───
    moreVals() {
      const s = this.state, mod = s.mod;
      const T = this.th2();
      const en = s.lang === "en";
      const t = (a, b) => en ? b : a;
      if (!mod) return { prayerCheckRows: [], adhkarDots: [], moreRows: [], abFeatures: [], abSources: [], abLinks: [], planOptions: [], trkMotivation: "", adhkarPos: "", adhkarText: "", adhkarSrc: "", tasbihCount: "0", tasbihGoal: "", planDayN: "", planDaysAr: "", planPagesDone: "", planPct: "", planSummary: "", planTodayTxt: "" };
      const arD = mod.arDigits;
  
      // الصلوات الخمس
      const names = en ? { fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" } : { fajr: "الفجر", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء" };
      const prayerCheckRows = Object.keys(names).map(k => {
        const on = s.prayersDone[k];
        return {
          name: names[k],
          bg: on ? T.hint : T.card, border: on ? "#1589BC" : T.border,
          ckBg: on ? "#1589BC" : T.card, ckBorder: on ? "#1589BC" : T.faint,
          ckDisp: on ? "block" : "none", color: on ? T.green : T.sub,
          toggle: () => {
            const pd = { ...s.prayersDone, [k]: !on };
            this.set({ prayersDone: pd });
            this.showToast(!on ? t("تقبّل الله — ", "May Allah accept — ") + names[k] : t("أُلغي تسجيل ", "Unchecked ") + names[k]);
          },
        };
      });
      const pDone = Object.values(s.prayersDone).filter(Boolean).length;
      const wirdPct = Math.min(1, s.wirdDone / s.wirdGoal);
      const dhikrPct = Math.min(1, s.adhkarDone / s.adhkarGoal);
      const total = (pDone / 5 + wirdPct) / 2;
  
      // الأذكار
      const list = mod.ADHKAR[s.adhkarTab] || [];
      const idx = Math.min(s.adhkarIdx, list.length - 1);
      const item = list[idx] || { t: "", src: "", rep: 1 };
      const segA = on => on ? { c: "#EA9924", b: "#EA9924" } : { c: "#444444", b: "transparent" };
      const am = segA(s.adhkarTab === "morning"), ae = segA(s.adhkarTab === "evening");
      const TC = 414.7;
  
      const adhkarDots = list.map((_, i) => ({
        w: i === idx ? 22 : 7, bg: i === idx ? T.green : T.track,
      }));
  
      // الختمة
      const dayN = Math.min(s.planDays, 19);
      const perDay = Math.ceil(604 / s.planDays);
      const pagesDone = Math.min(604, (dayN - 1) * perDay + s.wirdDone);
      const planPctN = Math.round(pagesDone / 604 * 100);
      const OPTS = [{ n: 30, u: "يوم" }, { n: 60, u: "يوم" }, { n: 90, u: "يوم" }, { n: 120, u: "يوم" }];
      const planOptions = OPTS.map(o => {
        const on = s.planDays === o.n;
        return {
          n: String(o.n), unit: t("يوم", "days"),
          bg: on ? "#1589BC" : T.card, border: on ? "#1589BC" : T.border,
          color: on ? "#FFFFFF" : T.text, sub: on ? "rgba(255,255,255,0.75)" : T.faint,
          pick: () => { this.set({ planDays: o.n, wirdGoal: Math.ceil(604 / o.n), khatmahPages: Math.ceil(604 / o.n) }); this.showToast(t("خطة " + o.n + " يوماً — " + Math.ceil(604 / o.n) + " صفحات يومياً", "Plan: " + o.n + " days — " + Math.ceil(604 / o.n) + " pages/day")); },
        };
      });
  
      // المزيد
      const I = {
        loc: "M12 21 C12 21 5.5 14.8 5.5 10 A6.5 6.5 0 0 1 18.5 10 C18.5 14.8 12 21 12 21 Z M12 12.6 A2.6 2.6 0 1 0 12 7.4 A2.6 2.6 0 1 0 12 12.6",
        asrSun: "M4.5 19 H19.5 M12 11.6 A2.8 2.8 0 0 1 12 17.2 A2.8 2.8 0 0 1 12 11.6 Z M12 6 V8.1 M6.4 8.3 L7.9 9.8 M17.6 8.3 L16.1 9.8",
        bell: "M12 4.5 C8.8 4.5 7.2 7 7.2 10 C7.2 14 5.5 15.5 5.5 15.5 L18.5 15.5 C18.5 15.5 16.8 14 16.8 10 C16.8 7 15.2 4.5 12 4.5 Z M10.3 18.5 C10.6 19.6 11.2 20.2 12 20.2 C12.8 20.2 13.4 19.6 13.7 18.5",
        moon: "M14.5 4 A8.2 8.2 0 1 0 20 14.5 A9.5 9.5 0 0 1 14.5 4 Z",
        lang: "M12 3 A9 9 0 1 0 12 21 A9 9 0 1 0 12 3 M3.5 9 H20.5 M3.5 15 H20.5 M12 3 C9.5 5.5 8.5 8.5 8.5 12 C8.5 15.5 9.5 18.5 12 21 M12 3 C14.5 5.5 15.5 8.5 15.5 12 C15.5 15.5 14.5 18.5 12 21",
        star: "M12 3.5 L14 9 L20 9.5 L15.5 13.3 L17 19.5 L12 16 L7 19.5 L8.5 13.3 L4 9.5 L10 9 Z",
        book: "M12 6 C10 4.6 7.2 4.1 4.8 4.5 V17.8 C7.2 17.4 10 17.9 12 19.3 C14 17.9 16.8 17.4 19.2 17.8 V4.5 C16.8 4.1 14 4.6 12 6 Z M12 6 V19.3",
        cal: "M5 6.5 H19 A1.5 1.5 0 0 1 20.5 8 V19 A1.5 1.5 0 0 1 19 20.5 H5 A1.5 1.5 0 0 1 3.5 19 V8 A1.5 1.5 0 0 1 5 6.5 Z M3.5 10.5 H20.5 M8 3.8 V7 M16 3.8 V7",
        ai: "M12 2.6 V5.4 M9 5.4 H15 A3.2 3.2 0 0 1 18.2 8.6 V14.4 A3.2 3.2 0 0 1 15 17.6 H9 A3.2 3.2 0 0 1 5.8 14.4 V8.6 A3.2 3.2 0 0 1 9 5.4 Z M5.8 10.5 H3.9 M18.2 10.5 H20.1 M9.5 10.2 V12.3 M14.5 10.2 V12.3 M9.7 14.5 H14.3",
        info: "M12 3 A9 9 0 1 0 12 21 A9 9 0 1 0 12 3 M12 8 V8.2 M12 11 V16.5",
      };
      const abIc = {
        pray: "M4.5 20.5 H19.5 M6.6 20.5 V11.4 A5.4 5.4 0 0 1 17.4 11.4 V20.5 M12 6 V3.4 M12 3.4 A1.3 1.3 0 1 0 12 3.35",
        quran: I.book, dhikr: "M12 3.6 A8.4 8.4 0 1 0 12 20.4 A8.4 8.4 0 1 0 12 3.6 M12 3.6 V6.2 M20.4 12 H17.8 M12 20.4 V17.8 M3.6 12 H6.2",
        qibla: "M12 3.2 A8.8 8.8 0 1 0 12 20.8 A8.8 8.8 0 1 0 12 3.2 M15.2 8.8 L13.4 13.4 L8.8 15.2 L10.6 10.6 Z",
      };
      const abFeatures = [
        { icon: abIc.pray, t: t("مواقيت دقيقة", "Accurate times"), s: t("٧ طرق حساب ومذهبان للعصر", "7 methods · 2 Asr schools") },
        { icon: abIc.quran, t: t("المصحف كاملاً", "Full Mushaf"), s: t("١١٤ سورة · تلاوة وتفسير", "114 surahs · audio & tafsir") },
        { icon: abIc.dhikr, t: t("أذكار ومسبحة", "Adhkar & tasbih"), s: t("الصباح والمساء والنوم", "Morning, evening, sleep") },
        { icon: abIc.qibla, t: t("القبلة والختمة", "Qibla & khatmah"), s: t("بوصلة وخطة قراءة يومية", "Compass & daily plan") },
      ];
      const abSources = [
        { t: t("نص المصحف", "Mushaf text"), s: t("مصحف المدينة — رواية حفص عن عاصم", "Madinah Mushaf — Hafs \u2018an \u2018Asim") },
        { t: t("الأحاديث", "Hadith"), s: t("الكتب الستة مع بيان درجة الحديث", "The Six Books, with grading") },
        { t: t("المواقيت", "Prayer times"), s: t("حساب فلكي محلي — يعمل دون اتصال", "Local astronomical calculation — offline") },
      ];
      const abLinks = [
        { icon: I.star, t: t("قيِّم فذَكِّر", "Rate Fadhakkir"), s: t("تقييمك يساعد غيرك على الوصول إليه", "Your rating helps others find it"), tap: () => this.showToast(t("شكراً لك — نموذج تصميمي", "Thank you — design prototype")) },
        { icon: "M18 8.4 A2.4 2.4 0 1 0 18 3.6 A2.4 2.4 0 0 0 18 8.4 M6 14.4 A2.4 2.4 0 1 0 6 9.6 A2.4 2.4 0 0 0 6 14.4 M18 20.4 A2.4 2.4 0 1 0 18 15.6 A2.4 2.4 0 0 0 18 20.4 M8.1 10.9 L15.9 7.1 M8.1 13.1 L15.9 16.9", t: t("شارك التطبيق", "Share the app"), s: t("الدالُّ على الخير كفاعله", "Guide others to good"), tap: () => this.showToast(t("رابط المشاركة — نموذج تصميمي", "Share link — design prototype")) },
        { icon: "M5.5 5.5 H18.5 A1.6 1.6 0 0 1 20.1 7.1 V16.9 A1.6 1.6 0 0 1 18.5 18.5 H5.5 A1.6 1.6 0 0 1 3.9 16.9 V7.1 A1.6 1.6 0 0 1 5.5 5.5 Z M4.2 6.6 L12 12.4 L19.8 6.6", t: t("تواصل معنا", "Contact us"), s: "salam@muzn.app", tap: () => this.showToast("salam@muzn.app") },
        { icon: "M12 3.2 L19.2 6 V11.6 C19.2 16 16.1 19.5 12 20.8 C7.9 19.5 4.8 16 4.8 11.6 V6 Z M9.4 12.1 L11.4 14.1 L15 10.2", t: t("الخصوصية", "Privacy"), s: t("لا نجمع أي بيانات — كل شيء على جهازك", "No data collected — everything stays on your device"), tap: () => this.showToast(t("بياناتك لا تغادر جهازك", "Your data never leaves your device")) },
      ];
      const chev = { isToggle: false, isChevron: true, iconBg: T.mint, iconC: T.green };
      const moreRows = [
        { ...chev, icon: "M5 3.8 H19 A1 1 0 0 1 20 4.8 V19.2 A1 1 0 0 1 19 20.2 H5 A1 1 0 0 1 4 19.2 V4.8 A1 1 0 0 1 5 3.8 Z M7.6 8.4 H16.4 M7.6 12 H16.4 M7.6 15.6 H13",
          t: "الأحاديث النبوية", s: "مجموعة الأحاديث المختارة", open: () => this.tab("hadith") },
        { ...chev, icon: I.asrSun, t: "طريقة حساب وقت العصر", s: s.asrMethod === "jomhor" ? "مذهب جمهور العلماء" : "المذهب الحنفي", open: () => this.go("prayerSettings") },
        { ...chev, icon: I.bell, t: "الإشعارات والأذان", s: "صوت المؤذن لكل صلاة — من صفحة الصلاة", open: () => this.tab("prayer") },
        { ...chev, icon: "M12 21 C12 21 5.5 14.8 5.5 10 A6.5 6.5 0 0 1 18.5 10 C18.5 14.8 12 21 12 21 Z M12 12.6 A2.6 2.6 0 1 0 12 7.4 A2.6 2.6 0 1 0 12 12.6", t: "الموقع", s: s.cityName, open: () => this.go("locationManual") },
        // { icon: I.moon, t: "الوضع الليلي", s: s.darkMode ? "مفعّل" : "متوقف", isToggle: true, isChevron: false, iconBg: "#132321", iconC: "#EA9924",
        //   tgBg: s.darkMode ? "#1589BC" : T.track, tgJustify: s.darkMode ? "flex-start" : "flex-end",
        //   open: () => { this.set({ darkMode: !s.darkMode }); this.showToast(!s.darkMode ? "تم تفعيل الوضع الليلي" : "تم إيقاف الوضع الليلي"); } },
        { ...chev, icon: I.lang, t: "اللغة / Language", s: s.lang === "ar" ? "العربية" : "English", open: () => { this.setState({ langReturn: "more" }); this.go("language"); } },
        { ...chev, icon: I.star, t: "خطة الختمة", s: "خطة " + s.planDays + " يوماً · " + Math.ceil(604 / s.planDays) + " صفحات يومياً", open: () => this.go("khatmah"), iconBg: "#F6ECD9", iconC: "#C89A3F" },
        { ...chev, icon: "M14.5 4 A8.2 8.2 0 1 0 20 14.5 A9.5 9.5 0 0 1 14.5 4 Z M18.6 4.6 V7.4 M17.2 6 H20", t: "الأذكار والمسبحة", s: "أذكار الصباح والمساء والتسبيح", open: () => this.go("adhkar") },
        { ...chev, icon: I.cal, t: "الرزنامة الهجرية", s: "التقويم الهجري والميلادي", open: () => this.go("calendar") },
        { ...chev, icon: I.ai, t: "تبيان — المساعد الذكي", s: "اسأل عن القرآن والسنة", open: () => this.go("tibyan"), iconBg: "#E3F2FA", iconC: "#268CE0" },
        { ...chev, icon: I.info, t: "عن التطبيق", s: "فذَكِّر — النسخة التجريبية 1.0", open: () => this.go("about") },
      ];
  
      return {
        prayerCheckRows,
        trkRingOff: 219.9 * (1 - total),
        trkMotivation: total >= 0.99 ? t("ما شاء الله! يوم مكتمل 🌙", "MashaAllah! A complete day 🌙") : (total >= 0.6 ? t("أحسنت، أوشكت على الإتمام", "Well done, almost there") : t("بداية طيبة، واصل", "A good start, keep going")),
        wirdPlus: () => { this.set({ wirdDone: Math.min(s.wirdGoal, s.wirdDone + 1) }); },
        dhikrBarW: Math.round(dhikrPct * 100) + "%",
        goAdhkar: () => this.go("adhkar"),
        admColor: am.c, admBorder: am.b, adeColor: ae.c, adeBorder: ae.b,
        adhkarMorning: () => this.setState({ adhkarTab: "morning", adhkarIdx: 0, adhkarCount: 0 }),
        adhkarEvening: () => this.setState({ adhkarTab: "evening", adhkarIdx: 0, adhkarCount: 0 }),
        adhkarPos: en ? (idx + 1) + " of " + list.length : (idx + 1) + " من " + list.length,
        adhkarText: item.t, adhkarSrc: en ? ((((mod.ADHKAR_SRC_EN || {})[s.adhkarTab]) || [])[idx] || item.src) : item.src,
        tasbihCount: String(s.adhkarCount), tasbihGoal: String(item.rep),
        tasbihOff: TC * (1 - Math.min(1, s.adhkarCount / item.rep)),
        adhkarTap: () => {
          const c = s.adhkarCount + 1;
          this.set({ adhkarCount: c, adhkarDone: Math.min(s.adhkarGoal, s.adhkarDone + 1) });
          if (c >= item.rep) {
            this.showToast(t("أتممت هذا الذكر — تقبّل الله", "Dhikr completed — may Allah accept"));
            setTimeout(() => { if (idx < list.length - 1) this.setState({ adhkarIdx: idx + 1, adhkarCount: 0 }); }, 700);
          }
        },
        adhkarNext: () => this.setState({ adhkarIdx: Math.min(list.length - 1, idx + 1), adhkarCount: 0 }),
        adhkarPrev: () => this.setState({ adhkarIdx: Math.max(0, idx - 1), adhkarCount: 0 }),
        adhkarReset: () => this.setState({ adhkarCount: 0 }),
        adhkarDots,
        planDayN: String(dayN), planDaysAr: String(s.planDays),
        // ── بطاقة خطة الختمة في الرئيسية ──
        // ── شاشة المصحف ──
        ...(() => {
          const MI = (mod && mod.MUSHAF_IMAGES) || {};
          const PAGES = {};
          Object.keys(MI).forEach(k => { PAGES[k] = MI[k].img; });
          const pg = Math.min(604, Math.max(1, parseInt(s.mPage, 10) || 1));
            const step = d => this.setPage(pg + d);
          const jump = () => {
            const q = String(s.mSearch || "").trim();
            if (!q) return;
            const n = parseInt(q.replace(/[^0-9]/g, ""), 10);
            if (/^[0-9\s]+$/.test(q) && n >= 1 && n <= 604) {
              this.setState({ mPage: n, mSearch: "", mSearchOpen: false });
              return;
            }
            const list = (mod && mod.SURAHS) || [];
            const hit = list.findIndex(x => x.n.indexOf(q) !== -1);
            // النتيجة تفتح صفحة السورة في المصحف وتُغلق شريط البحث
            if (hit >= 0) {
              this.setState({ mSearch: "", mSearchOpen: false });
              this.goPage(this.surahPage(hit));
            } else this.showToast(t("لا نتائج لهذا البحث", "No results"));
          };
          return {
            mPageVal: String(s.mPage ?? 1), mTotal: "604",
            mWhere: (() => {
              const SP = (mod && mod.SURAH_PAGES) || [];
              if (!SP.length) return "";
              let si = 0;
              for (let k = 0; k < SP.length; k++) if (SP[k] <= pg) si = k;
              let jz = 1;
              const JP = (mod && mod.JUZ_PAGES) || [];
              for (let k = 0; k < JP.length; k++) if (JP[k] <= pg) jz = k + 1;
              const nm = en ? mod.SURAH_EN[si] : "سورة " + mod.SURAHS[si].n;
              return nm + " · " + t("الجزء " + jz, "Juz " + jz);
            })(),
            setMPage: e => {
              const v = String(e.target.value).replace(/[^0-9]/g, "");
              if (v === "") this.setState({ mPage: "" });
              else this.setPage(v);
            },
            mPrev: () => step(-1), mNext: () => step(1),
            mPageSrc: PAGES[pg] || "", mHasPage: !!PAGES[pg], mNoPage: !PAGES[pg],

            mNoPageTxt: t("صورة الصفحة " + pg + " غير مُضمّنة في هذه النسخة",
                          "Page " + pg + " image isn't bundled in this build"),
            mSearchOn: !!s.mSearchOpen,
            toggleMSearch: () => this.setState({ mSearchOpen: !this.state.mSearchOpen }),
            mSearchC: s.mSearchOpen ? "#1589BC" : "#1589BC",
            mSearchF: s.mSearchOpen ? "#1589BC" : "transparent",
            mSearchVal: s.mSearch || "",
            setMSearch: e => this.setState({ mSearch: e.target.value }),
            mSearchKey: e => { if (e.key === "Enter") jump(); },
            mBmOn: (s.mBms || []).includes(pg),
            mBmFill: (s.mBms || []).includes(pg) ? "#1589BC" : "none",
            mBmStroke: (s.mBms || []).includes(pg) ? "#fff" : "#1589BC",
            mRibbonDisp: (s.mBms || []).includes(pg) ? "block" : "none",
            toggleMBm: () => {
              const cur = s.mBms || [];
              const next = cur.includes(pg) ? cur.filter(x => x !== pg) : [...cur, pg];
              this.set({ mBms: next });
              this.showToast(cur.includes(pg) ? t("أُزيلت من المحفوظات", "Removed from saved")
                                              : t("أُضيفت إلى المحفوظات", "Added to saved"));
            },
            goIndex: () => this.go("quran"),
            goSettingsTab: () => this.tab("more"),

            // ── شاشة الأذكار ──
            ...(() => {
              const CATS = [
                { k: "morning", n: t("أذكار الصباح", "Morning adhkar") },
                { k: "evening", n: t("أذكار المساء", "Evening adhkar") },
                { k: "after", n: t("أذكار بعد الصلاة", "After-prayer adhkar") },
                { k: "sleep", n: t("أذكار النوم", "Sleep adhkar") },
              ];
              const cat = s.adhCat || "morning";
              const list = (mod && mod.ADHKAR && mod.ADHKAR[cat]) || [];
              const counts = s.adhCount || {};
              return {
                adhTabs: CATS.map(c => ({
                  name: c.n,
                  color: cat === c.k ? "#1589BC" : "#3B4148",
                  bg: cat === c.k ? "#EAF3F9" : "transparent",
                  border: cat === c.k ? "#1589BC" : "transparent",
                  pick: () => this.setState({ adhCat: c.k }),
                })),
                adhTitle: (CATS.find(c => c.k === cat) || CATS[0]).n,
                adhEmpty: !list.length,
                adhRows: list.map((d, k) => {
                  const key = cat + ":" + k;
                  const done = counts[key] || 0;
                  return {
                    text: d.t,
                    count: String(done),
                    tap: () => this.setState({ adhCount: { ...counts, [key]: done + 1 } }),
                    reset: () => this.setState({ adhCount: { ...counts, [key]: 0 } }),
                    share: () => this.showToast(t("تم نسخ الذكر للمشاركة", "Dhikr copied for sharing")),
                  };
                }),
              };
            })(),

            // ── شاشة عن التطبيق ──
            abRows: [
              { t: t("حقوق الملكية", "Copyright"),
                icon: "M12 3.4 A8.6 8.6 0 1 0 12 20.6 A8.6 8.6 0 1 0 12 3.4 M14.6 9.6 A3.4 3.4 0 1 0 14.6 14.4",
                iconWidth: 18, iconHeight: 18,
                open: () => this.showToast(t("جميع الحقوق محفوظة — فذَكِّر", "All rights reserved — Fadhakkir")) },
              { t: t("تواصل معنا", "Contact us"),
                icon: "M6.6 4.6 H18.2 A2.7 2.7 0 0 1 20.9 7.3 V14.5 A2.7 2.7 0 0 1 18.2 17.2 H11.6 L7.6 20.6 V17.2 H6.6 A2.7 2.7 0 0 1 3.9 14.5 V7.3 A2.7 2.7 0 0 1 6.6 4.6 Z M9.6 8.4 C9.6 7.7 10.2 7.3 10.8 7.6 L12 8.2 C12.5 8.5 12.7 9.1 12.4 9.7 L12 10.5 C12.5 11.4 13.2 12.1 14.1 12.6 L14.9 12.2 C15.5 11.9 16.1 12.1 16.4 12.6 L17 13.8 C17.3 14.4 16.9 15 16.2 15 C12.6 15 9.6 12 9.6 8.4 Z",
                iconWidth: 20, iconHeight: 20,
                open: () => this.showToast(t("تواصل معنا", "Contact us"))},                
              { t: t("مشاركة التطبيق", "Share the app"),
                icon: "M17.5 3.4 A2.6 2.6 0 1 0 17.5 8.6 A2.6 2.6 0 1 0 17.5 3.4 M6.5 9.4 A2.6 2.6 0 1 0 6.5 14.6 A2.6 2.6 0 1 0 6.5 9.4 M17.5 15.4 A2.6 2.6 0 1 0 17.5 20.6 A2.6 2.6 0 1 0 17.5 15.4 M8.9 10.8 L15.2 7.3 M8.9 13.2 L15.2 16.7",
                iconWidth: 17, iconHeight: 17,
                open: () => this.showToast(t("تم نسخ رابط التطبيق", "App link copied")) },
            ],

            // ── شاشة الإعدادات ──
            stAuthName: mod ? ((en ? mod.CALC_AUTHORITIES_EN : mod.CALC_AUTHORITIES)[s.calcAuth] || "") : "",
            stAuthOn: !!s.calcDrop,
            stAuthRot: s.calcDrop ? 180 : 0,
            stToggleAuth: () => this.setState({ calcDrop: !this.state.calcDrop }),
            stAuthRows: mod ? (en ? mod.CALC_AUTHORITIES_EN : mod.CALC_AUTHORITIES).map((nm, k) => ({
              name: nm,
              bg: s.calcAuth === k ? "#EAF3F9" : "#FFFFFF",
              bar: s.calcAuth === k ? "#1589BC" : "transparent",
              pick: () => { this.set({ calcAuth: k }); this.setState({ calcDrop: false }); },
            })) : [],
            stAsrName: s.asrMethod === "hanafi"
              ? t("المذهب الحنفي", "Hanafi school")
              : t("الجمهور (شافعي، مالكي، حنبلي)", "Majority (Shafi'i, Maliki, Hanbali)"),
            goAbout: () => this.go("about"),

            // ── نافذة الاستماع (من شريط الأدوات) ──
            // زر التشغيل: يفتح النافذة، وأثناء التلاوة يصير إيقافًا مؤقّتًا
            lnPlaying: s.ayPlay != null,
            lnPauseIcon: s.ayPlay != null && !s.ayPaused && !s.ayBar,
            lnPlayIcon: !(s.ayPlay != null && !s.ayPaused && !s.ayBar),
            lnToolbarTap: () => {
              if (this.state.ayPlay != null && !this.state.ayBar) {
                this.setState({ ayPaused: !this.state.ayPaused }); return;
              }
              this.setState({ tbActive: "listen", lnOpen: true, lnDrop: false });
            },
            openListen: () => this.setState({ lnOpen: true, lnDrop: false }),
            lnClose: () => this.setState({ lnOpen: false, lnDrop: false }),
            lnOn: !!s.lnOpen,
            lnDropOn: !!s.lnDrop,
            lnRot: s.lnDrop ? 180 : 0,
            lnToggleDrop: () => this.setState({ lnDrop: !this.state.lnDrop }),
            ...(() => {
              const SP = (mod && mod.SURAH_PAGES) || [];
              let si3 = 0;
              for (let k = 0; k < SP.length; k++) if (SP[k] <= pg) si3 = k;
              const sn = mod ? (en ? mod.SURAH_EN[si3] : "سورة " + mod.SURAHS[si3].n) : "";
              const opts = [
                t("الاستماع للصفحة", "Listen to this page"),
                t("الاستماع ل" + sn, "Listen to " + sn),
                t("الاستماع من الصفحة الحالية لنهاية المصحف", "Listen from here to the end"),
              ];
              return {
                lnModeName: opts[s.lnMode] || opts[0],
                lnRows: opts.map((nm, k) => ({
                  name: nm,
                  bg: s.lnMode === k ? "#EAF3F9" : "#FFFFFF",
                  bar: s.lnMode === k ? "#1589BC" : "transparent",
                  pick: () => this.setState({ lnMode: k, lnDrop: false }),
                })),
                lnStart: () => {
                  const info = MI[pg] || null;
                  const first = (info && info.r.length) ? info.r[0][0] : 1;
                  this.setState({ lnOpen: false, lnDrop: false });
                  this.showToast(opts[s.lnMode] || opts[0]);
                  this.startAyahPlay(first, false);
                },
              };
            })(),

            // ── إعدادات القرآن والتفسير ──
            openQSettings: () => this.setState({ qsOpen: true, qsDrop: "" }),
            qsClose: () => this.setState({ qsOpen: false, qsDrop: "" }),
            qsOn: !!s.qsOpen,
            qsRecName: mod ? ((en ? mod.RECITERS_EN : mod.RECITERS)[s.reciter] || "") : "",
            qsTafName: mod ? ((en ? mod.TAFSIRS_EN : mod.TAFSIRS)[s.tafsirBook] || "") : "",
            qsRecOn: s.qsDrop === "rec",
            qsTafOn: s.qsDrop === "taf",
            qsRecRot: s.qsDrop === "rec" ? 180 : 0,
            qsTafRot: s.qsDrop === "taf" ? 180 : 0,
            qsToggleRec: () => this.setState({ qsDrop: this.state.qsDrop === "rec" ? "" : "rec" }),
            qsToggleTaf: () => this.setState({ qsDrop: this.state.qsDrop === "taf" ? "" : "taf" }),
            qsRecRows: mod ? (en ? mod.RECITERS_EN : mod.RECITERS).map((nm, k) => ({
              name: nm,
              bg: s.reciter === k ? "#EAF3F9" : "#FFFFFF",
              bar: s.reciter === k ? "#1589BC" : "transparent",
              pick: () => { this.set({ reciter: k }); this.setState({ qsDrop: "" }); },
            })) : [],
            qsTafRows: mod ? (en ? mod.TAFSIRS_EN : mod.TAFSIRS).map((nm, k) => ({
              name: nm,
              bg: s.tafsirBook === k ? "#EAF3F9" : "#FFFFFF",
              bar: s.tafsirBook === k ? "#1589BC" : "transparent",
              pick: () => { this.set({ tafsirBook: k }); this.setState({ qsDrop: "" }); },
            })) : [],

            // ── قائمة السور المنزّلة ──
            openDownloads: () => this.setState({ dlOpen: true, dlSwipe: "" }),
            dlClose: () => this.setState({ dlOpen: false, dlSwipe: "" }),
            dlOn: !!s.dlOpen,
            dlEmpty: !(s.downloads || []).length,
            dlRows: (() => {
              const recs2 = mod ? (en ? mod.RECITERS_EN : mod.RECITERS) : [];
              const seen2 = {}, out2 = [];
              (s.downloads || []).forEach(d => {
                const key = d.si + ":" + d.r;
                if (seen2[key]) return;
                seen2[key] = 1;
                const nm = mod ? (en ? mod.SURAH_EN[d.si] : "سورة " + mod.SURAHS[d.si].n) : "";
                out2.push({
                  name: nm,
                  reciter: recs2[d.r] || "",
                  shift: s.dlSwipe === key ? "-47px" : "0px",
                  play: () => {
                    if (this._dlMoved) { this._dlMoved = false; return; }
                    if (this.state.dlSwipe === key) { this.setState({ dlSwipe: "" }); return; }
                    this.setState({ dlOpen: false, dlSwipe: "" });
                    this.setPage(this.surahPage(d.si));
                    this.setState({ ayahSel: null, ayahMenu: null });
                    setTimeout(() => this.startAyahPlay(d.n, false), 60);
                  },
                  down: e => { this._dlX = e.clientX; this._dlMoved = false; },
                  up: e => {
                    if (this._dlX == null) return;
                    const dx = e.clientX - this._dlX;
                    this._dlX = null;
                    if (dx < -30) { this._dlMoved = true; this.setState({ dlSwipe: key }); }
                    else if (dx > 30) { this._dlMoved = true; this.setState({ dlSwipe: "" }); }
                  },
                  del: () => {
                    this.set({ downloads: (this.state.downloads || []).filter(x => !(x.si === d.si && x.r === d.r)) });
                    this.setState({ dlSwipe: "" });
                    this.showToast(t("حُذفت التلاوة المنزّلة", "Download removed"));
                  },
                });
              });
              return out2;
            })(),

            // ── قائمة المحفوظات ──
            openSaved: () => this.setState({ savedOpen: true, savedSwipe: 0 }),
            savedClose: () => this.setState({ savedOpen: false, savedSwipe: 0 }),
            savedOn: !!s.savedOpen,
            savedEmpty: !(s.mBms || []).length,
            savedRows: [...(s.mBms || [])].sort((a2, b2) => a2 - b2).map(n2 => {
              const SP = (mod && mod.SURAH_PAGES) || [];
              let si2 = 0;
              for (let k = 0; k < SP.length; k++) if (SP[k] <= n2) si2 = k;
              const nm = mod ? (en ? mod.SURAH_EN[si2] : "سورة " + mod.SURAHS[si2].n) : "";
              return {
                name: nm,
                page: t("صفحة " + n2, "Page " + n2),
                shift: s.savedSwipe === n2 ? "-47px" : "0px",
                open: () => {
                  // بعد السحب يُطلق المتصفّح نقرة أيضًا — نتجاهلها
                  if (this._swMoved) { this._swMoved = false; return; }
                  if (this.state.savedSwipe === n2) { this.setState({ savedSwipe: 0 }); return; }
                  this.setState({ savedOpen: false, savedSwipe: 0 });
                  this.setPage(n2);
                },
                down: e => { this._swX = e.clientX; this._swMoved = false; },
                up: e => {
                  if (this._swX == null) return;
                  const dx = e.clientX - this._swX;
                  this._swX = null;
                  if (dx < -30) { this._swMoved = true; this.setState({ savedSwipe: n2 }); }
                  else if (dx > 30) { this._swMoved = true; this.setState({ savedSwipe: 0 }); }
                },
                del: () => {
                  this.set({ mBms: (this.state.mBms || []).filter(x => x !== n2) });
                  this.setState({ savedSwipe: 0 });
                  this.showToast(t("حُذفت من المحفوظات", "Removed from saved"));
                },
              };
            }),
          };
        })(),
        cityShort: String(s.cityName || "").split(/[،,]/)[0].trim(),
        planDaysVal: String(s.planDays),
        setPlanDays: e => {
          const n = Math.max(3, Math.min(60, parseInt(e.target.value, 10) || s.planDays));
          this.set({ planDays: n, wirdGoal: Math.ceil(604 / n), khatmahPages: Math.ceil(604 / n) });
        },
        // ── بطاقة أذكار الصباح/المساء في الرئيسية ──
        ...(() => {
          const morning = new Date().getHours() < 12;
          const cat = morning ? "morning" : "evening";
          const list = (mod && mod.ADHKAR && mod.ADHKAR[cat]) || [];
          const first = list[0] ? list[0].t : "";
          return {
            homeAdhTitle: morning ? t("أذكار الصباح", "Morning adhkar") : t("أذكار المساء", "Evening adhkar"),
            homeAdhBook: t("كتاب حصن المسلم", "Hisn al-Muslim"),
            homeAdhText: first.length > 190 ? first.slice(0, 190).trim() + " …" : first,
            goAdhkarCat: () => { this.setState({ adhCat: cat }); this.tab("adhkar"); },
          };
        })(),
        homePlanDays: en ? s.planDays + " days" : s.planDays + " يومًا",
        homePlanPerDay: en ? perDay + " pages/day" : perDay + " صفحة يوميًا",
        homePlanPerPrayer: en ? Math.ceil(perDay / 5) + " pages per prayer"
                              : Math.ceil(perDay / 5) + " صفحة بعد كل صلاة",
        homePlanJuz: en ? (30 / s.planDays).toFixed(1) + " juz/day"
                        : (30 / s.planDays).toFixed(1) + " جزء يوميًا",
        planBarW: planPctN + "%", planPagesDone: String(pagesDone), planPct: planPctN + "%",
        planDoneTxt: en ? "Completed " + pagesDone + " of 604 pages" : "أنجزت " + pagesDone + " صفحة من 604",
        planOptions,
        planSummary: t("بمعدل " + Math.ceil(604 / s.planDays) + " صفحات يومياً ستختم بإذن الله خلال " + s.planDays + " يوماً.", "At " + Math.ceil(604 / s.planDays) + " pages a day you'll complete the Quran, insha'Allah, in " + s.planDays + " days."),
        planTodayTxt: t("اقرأ " + s.wirdGoal + " صفحات اليوم", "Read " + s.wirdGoal + " pages today"),
        restartPlan: () => { this.set({ wirdDone: 0 }); this.showToast(t("تمت إعادة ضبط الخطة — بداية موفقة", "Plan reset — a fresh start")); },
        moreRows, abFeatures, abSources, abLinks,
      };
    }
  
    // ::M::
  }

  return Component;
};
