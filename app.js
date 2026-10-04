(() => {
  "use strict";

  // ================= Data & constanten =================
  const ANIMALS = (window.OCEAN_ANIMALS || []).filter(a => a.img).map(a => {
    a.photos = a.photos && a.photos.length ? a.photos : [{ img: a.img, size: a.imgSize, credit: a.credit }];
    a.thumb = a.thumb || a.img;
    return a;
  });
  const META = window.OCEAN_META || {};
  const BY_ID = new Map(ANIMALS.map(a => [a.id, a]));
  const CAT_ORDER = ["Zoogdieren", "Haaien & roggen", "Vissen", "Reptielen", "Zeevogels", "Weekdieren",
    "Kreeftachtigen & co", "Kwallen & koralen", "Stekelhuidigen", "Overige ongewervelden"];
  const CATS = [...new Set(ANIMALS.map(a => a.cat))]
    .sort((a, b) => (CAT_ORDER.indexOf(a) + 1 || 99) - (CAT_ORDER.indexOf(b) + 1 || 99));
  const NORTH_SEA_MIN = 10;
  const isNorthSea = a => (a.ns || 0) >= NORTH_SEA_MIN;
  const DIFF = {
    easy:   { label: "Makkelijk", mult: 1,   hint: "Foute antwoorden komen uit andere diergroepen." },
    normal: { label: "Normaal",   mult: 1.5, hint: "Foute antwoorden zijn willekeurige zeedieren uit je selectie." },
    hard:   { label: "Moeilijk",  mult: 2,   hint: "Foute antwoorden uit dezelfde familie of met lijkende namen, en geen hint over de diergroep." },
  };
  const QTYPES = {
    photo: { label: "Foto's",  hint: "Je ziet een foto en kiest de juiste naam." },
    mixed: { label: "Gemengd", hint: "Afwisselend: foto bij naam, naam bij foto en 'welk dier leeft hier?' op de kaart." },
    type:  { label: "Intypen", hint: "Expert: typ zelf de naam. Kleine tikfouten worden goedgerekend." },
  };
  const MODES = {
    classic:  { label: "Klassiek",  icon: "target", color: "#0b6bbf", desc: "Een vast aantal vragen, met uitleg en kaart na elk antwoord." },
    time:     { label: "Tijdrace",  icon: "clock",  color: "#ff5e3a", desc: "60 seconden. Zoveel mogelijk dieren goed, zonder pauze." },
    survival: { label: "Overleven", icon: "heart",  color: "#e0393e", desc: "Drie levens. Hoe ver kom jij voordat ze op zijn?" },
  };
  const EXTRA_MODES = {
    learn: { label: "Oefenen" },
    daily: { label: "Dagelijkse uitdaging" },
  };
  const TIME_LIMIT = 60;
  const LIVES = 3;
  const DAILY_LEN = 10;
  const LEARN_LEN = 15;
  const SRS_DAYS = [0, 1, 3, 7, 14, 30];   // herhaalschema per 'doos' (Leitner)
  const SITE_URL = "https://ronaldsteenkamp.github.io/oceaanquiz/";
  const MAKER = "Ronald Steenkamp";

  // ================= Iconen (Lucide, MIT) =================
  const ICONS = {
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    star: '<path d="M11.52 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .29-.9l5.17-.76a2.12 2.12 0 0 0 1.6-1.16z"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    play: '<path d="M6 3l14 9-14 9V3z"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    map: '<path d="M14.1 5.55a2 2 0 0 0 1.8 0l3.65-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.9l-4.55 2.27a2 2 0 0 1-1.8 0l-4.2-2.1a2 2 0 0 0-1.8 0l-3.65 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.9L8.1 3.45a2 2 0 0 1 1.8 0z"/><path d="M15 5.76v15M9 3.24v15"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    sparkle: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    brain: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v13"/>',
    waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    keyboard: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
  };
  const icon = (name, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

  // ================= Hulpfuncties =================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr, rnd = Math.random) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];
  const fmt = n => n.toLocaleString("nl-NL");
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* opslag niet beschikbaar */ }
    },
  };
  // Vaste toevalsgenerator (voor de dagelijkse uitdaging: iedereen dezelfde vragen)
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const DAY = 86400000;

  const settings = Object.assign(
    { mode: "classic", difficulty: "normal", length: "10", qtype: "photo", northSea: false, cats: CATS.slice() },
    store.get("oq3-settings", {})
  );
  settings.cats = settings.cats.filter(c => CATS.includes(c));
  if (!settings.cats.length) settings.cats = CATS.slice();
  if (!QTYPES[settings.qtype]) settings.qtype = "photo";
  const saveSettings = () => store.set("oq3-settings", settings);

  const found = new Set(store.get("oq3-found", []).filter(id => BY_ID.has(id)));
  const saveFound = () => store.set("oq3-found", [...found]);
  const srs = store.get("oq3-srs", {});        // { id: { box, due } }
  const saveSrs = () => store.set("oq3-srs", srs);
  const daily = store.get("oq3-daily", {});    // { "2026-10-03": { score, correct, total, pattern } }

  function selectionPool() {
    return ANIMALS.filter(a => settings.cats.includes(a.cat) && (!settings.northSea || isNorthSea(a)));
  }
  function dueForReview() {
    const now = Date.now();
    return ANIMALS.filter(a => srs[a.id] && srs[a.id].due <= now);
  }

  function ring(value, size = 22, stroke = 3.5, color = "var(--primary)") {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="transform:rotate(-90deg)" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - value)}"/></svg>`;
  }

  function updateCollectPill() {
    $("#collect-pill").innerHTML = `${ring(found.size / ANIMALS.length)}<span><b>${found.size}</b>/${ANIMALS.length} <span class="lbl">ontdekt</span></span>`;
  }

  // Schermlezers: belangrijke meldingen voorlezen
  const live = document.createElement("div");
  live.className = "sr-only";
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);
  const announce = text => { live.textContent = ""; setTimeout(() => { live.textContent = text; }, 50); };

  function toast(text) {
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1700);
  }

  // Omslagfoto per categorie: het meest waargenomen dier (vaak het bekendste)
  const COVER = {};
  CATS.forEach(cat => {
    const list = ANIMALS.filter(a => a.cat === cat && a.imgSize && a.imgSize[0] >= a.imgSize[1]);
    COVER[cat] = (list.sort((a, b) => (b.obs || 0) - (a.obs || 0))[0] || ANIMALS.find(a => a.cat === cat));
  });

  // ================= Thema =================
  function effectiveTheme() {
    const t = document.documentElement.dataset.theme;
    if (t) return t;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(t) {
    if (t) document.documentElement.dataset.theme = t;
    $("#theme-toggle").innerHTML = icon(effectiveTheme() === "dark" ? "sun" : "moon");
  }
  applyTheme(store.get("oq3-theme", null));
  $("#theme-toggle").onclick = () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    store.set("oq3-theme", next);
    applyTheme(next);
  };

  // ================= Router =================
  let game = null;
  let resultData = null;
  const view = $("#view");

  function go(route) {
    if (location.hash === "#/" + route) render();
    else location.hash = "#/" + route;
  }
  window.addEventListener("hashchange", render);

  function render() {
    const route = location.hash.replace(/^#\/?/, "") || "home";
    stopTimer();
    hideFeedback();
    if (route !== "quiz" && game) game = null;
    $$(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.nav === ({ "": "home", home: "home", gids: "guide", over: "about" }[route] || "")));
    $("#appbar").hidden = route === "quiz";
    if (route === "gids") renderGuide();
    else if (route === "over") renderAbout();
    else if (route === "quiz" && game) renderQuestion();
    else if (route === "resultaat" && resultData) renderResult();
    else renderHome();
    updateCollectPill();
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  }
  $$("[data-nav]").forEach(b => b.onclick = () => go({ home: "home", guide: "gids", about: "over" }[b.dataset.nav]));

  // ================= Home =================
  function bestFor(mode, diff) {
    return (store.get("oq3-scores", {})[`${mode}-${diff}`] || [])[0];
  }

  function dailyStreak() {
    let n = 0, d = new Date();
    if (!daily[todayKey()]) d = new Date(Date.now() - DAY);
    for (;;) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!daily[k]) return n;
      n++; d = new Date(d.getTime() - DAY);
    }
  }

  function renderHome() {
    const popular = ANIMALS.filter(a => a.imgSize && a.imgSize[0] > a.imgSize[1] * 1.15)
      .sort((a, b) => (b.obs || 0) - (a.obs || 0)).slice(0, 80);
    const [c1, c2, c3] = shuffle(popular);
    const totalFacts = ANIMALS.reduce((n, a) => n + a.facts.length, 0);
    const pool = selectionPool();
    const due = dueForReview().length;
    const todays = daily[todayKey()];
    const streak = dailyStreak();
    const nsCount = ANIMALS.filter(isNorthSea).length;

    view.innerHTML = `
      <div class="container">
        <section class="hero">
          <div>
            <span class="eyebrow">${icon("sparkle")} ${ANIMALS.length} zeedieren · ${CATS.length} ${CATS.length === 1 ? "diergroep" : "diergroepen"}</span>
            <h1>Hoe goed ken jij de <em>oceaan</em>?</h1>
            <p class="lead">Herken walvissen, haaien, kwallen en honderden andere zeedieren aan hun foto. Ontdek bij elk dier waar het leeft en leer verrassende feitjes.</p>
            <div class="hero-actions">
              <button class="btn btn-lg" data-act="start">${icon("play")} Start quiz</button>
              <button class="btn btn-lg btn-secondary" data-act="guide">${icon("book")} Dierengids</button>
            </div>
            <div class="hero-stats">
              <div><b>${fmt(found.size)}</b><span>ontdekt door jou</span></div>
              <div><b>${fmt(totalFacts)}</b><span>feitjes</span></div>
              <div><b>${fmt(ANIMALS.reduce((n, a) => n + a.photos.length, 0))}</b><span>foto's</span></div>
            </div>
          </div>
          <div class="collage" aria-hidden="true">
            ${[c1, c2, c3].filter(Boolean).map((a, i) => `
              <figure class="c${i + 1}"><img src="${a.img}" alt=""><figcaption>${esc(a.name)}</figcaption></figure>`).join("")}
          </div>
        </section>

        <section class="section">
          <div class="today">
            <div class="today-card daily">
              <span class="today-icon">${icon("calendar")}</span>
              <div class="today-body">
                <h3>Dagelijkse uitdaging</h3>
                <p>${todays
                  ? `Vandaag gespeeld: <b>${todays.correct}/${todays.total}</b> goed · ${fmt(todays.score)} punten. Morgen weer 10 nieuwe dieren!`
                  : "Elke dag 10 dieren, voor iedereen dezelfde. Deel je score met vrienden."}
                  ${streak > 1 ? `<br><span class="streak-txt">${icon("flame")} ${streak} dagen op rij</span>` : ""}</p>
              </div>
              <button class="btn ${todays ? "btn-secondary" : ""}" data-act="${todays ? "share-daily" : "daily"}">
                ${todays ? `${icon("share")} Deel score` : `${icon("play")} Speel`}</button>
            </div>
            <div class="today-card learn">
              <span class="today-icon">${icon("brain")}</span>
              <div class="today-body">
                <h3>Oefenen</h3>
                <p>${due
                  ? `<b>${due}</b> ${due === 1 ? "dier staat" : "dieren staan"} klaar om te herhalen. Fouten komen vaker terug tot je ze kent.`
                  : "Leer slim: dieren die je fout hebt, komen terug tot je ze kent. Nieuwe dieren vullen de ronde aan."}</p>
              </div>
              <button class="btn btn-secondary" data-act="learn">${icon("play")} Oefen</button>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head"><div><h2>Kies je spel</h2><p>Drie manieren om je kennis te testen.</p></div></div>
          <div class="modes">
            ${Object.entries(MODES).map(([k, m]) => {
              const best = bestFor(k, settings.difficulty);
              return `<button class="mode ${settings.mode === k ? "on" : ""}" data-mode="${k}" aria-pressed="${settings.mode === k}">
                <span class="mode-icon" style="background:${m.color}1f;color:${m.color}">${icon(m.icon)}</span>
                <h3>${m.label}</h3><p>${m.desc}</p>
                <span class="best">${icon("trophy")} ${best ? `Record (${DIFF[settings.difficulty].label.toLowerCase()}): <b>${fmt(best.score)}</b>` : "Nog geen record"}</span>
              </button>`;
            }).join("")}
          </div>
          <div class="options-row three">
            <div class="box">
              <div class="box-label">Niveau</div>
              <div class="segmented" id="seg-diff" role="group" aria-label="Niveau">
                ${Object.entries(DIFF).map(([k, d]) => `<button data-v="${k}" class="${settings.difficulty === k ? "on" : ""}" aria-pressed="${settings.difficulty === k}">${d.label}</button>`).join("")}
              </div>
              <p class="hint">${DIFF[settings.difficulty].hint}</p>
            </div>
            <div class="box">
              <div class="box-label">Vraagsoort</div>
              <div class="segmented" id="seg-qtype" role="group" aria-label="Vraagsoort">
                ${Object.entries(QTYPES).map(([k, d]) => `<button data-v="${k}" class="${settings.qtype === k ? "on" : ""}" aria-pressed="${settings.qtype === k}">${d.label}</button>`).join("")}
              </div>
              <p class="hint">${QTYPES[settings.qtype].hint}</p>
            </div>
            <div class="box" ${settings.mode !== "classic" ? "hidden" : ""}>
              <div class="box-label">Aantal vragen</div>
              <div class="segmented" id="seg-len" role="group" aria-label="Aantal vragen">
                ${["10", "20", "50", "all"].map(v => `<button data-v="${v}" class="${settings.length === v ? "on" : ""}" aria-pressed="${settings.length === v}">${v === "all" ? "Alle" : v}</button>`).join("")}
              </div>
              <p class="hint">Of speel alle dieren uit je selectie.</p>
            </div>
            <div class="box" ${settings.mode === "classic" ? "hidden" : ""}>
              <div class="box-label">Regels</div>
              <p class="hint" style="margin:0">${settings.mode === "time"
                ? `Je hebt ${TIME_LIMIT} seconden. Elk goed antwoord telt, een reeks levert bonuspunten op.`
                : `Je hebt ${LIVES} levens. Elk fout antwoord kost er één.`}</p>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div><h2>Diergroepen</h2><p>Kies welke dieren in je quiz voorkomen.</p></div>
            <button class="link-btn" data-act="allcats">${settings.cats.length === CATS.length ? "Niets selecteren" : "Alles selecteren"}</button>
          </div>
          <label class="switch-row">
            <span class="switch-text">${icon("waves")} <span><b>Alleen dieren uit de Noordzee</b><small>${nsCount} soorten die regelmatig in de Noordzee worden gezien</small></span></span>
            <input type="checkbox" id="ns-toggle" ${settings.northSea ? "checked" : ""}><span class="switch" aria-hidden="true"></span>
          </label>
          <div class="cats">
            ${CATS.map(cat => {
              const list = ANIMALS.filter(a => a.cat === cat && (!settings.northSea || isNorthSea(a)));
              const got = list.filter(a => found.has(a.id)).length;
              return `<button class="cat ${settings.cats.includes(cat) ? "on" : ""}" data-cat="${esc(cat)}" aria-pressed="${settings.cats.includes(cat)}" ${list.length ? "" : "disabled"}>
                <img src="${COVER[cat].thumb}" alt="" loading="lazy">
                <span class="check">${icon("check")}</span>
                <span class="cat-body"><b>${esc(cat)}</b><small>${list.length} dieren · ${got} ontdekt</small>
                <span class="bar"><i style="width:${list.length ? (got / list.length) * 100 : 0}%"></i></span></span>
              </button>`;
            }).join("")}
          </div>
        </section>

        ${pwaSectionHTML()}

        <div class="start-bar">
          <div class="inner">
            <span class="summary"><b>${MODES[settings.mode].label}</b> · ${DIFF[settings.difficulty].label} · ${QTYPES[settings.qtype].label} ·
              ${pool.length} dieren in je selectie</span>
            <button class="btn btn-lg" data-act="start" ${pool.length >= 4 ? "" : "disabled"}>Start ${MODES[settings.mode].label.toLowerCase()} ${icon("arrow")}</button>
          </div>
        </div>

        ${footerHTML()}
      </div>`;

    bindPwaSection();
    $$("[data-act=start]", view).forEach(b => b.onclick = () => startGame(settings.mode));
    $("[data-act=guide]", view).onclick = () => go("gids");
    $("[data-act=learn]", view).onclick = () => startGame("learn");
    const dailyBtn = $("[data-act=daily]", view);
    if (dailyBtn) dailyBtn.onclick = () => startGame("daily");
    const shareBtn = $("[data-act=share-daily]", view);
    if (shareBtn) shareBtn.onclick = () => shareDaily(todayKey());
    $("[data-act=allcats]", view).onclick = () => {
      settings.cats = settings.cats.length === CATS.length ? [] : CATS.slice();
      saveSettings(); rerenderHome();
    };
    $("#ns-toggle").onchange = e => { settings.northSea = e.target.checked; saveSettings(); rerenderHome(); };
    $$("[data-mode]", view).forEach(b => b.onclick = () => { settings.mode = b.dataset.mode; saveSettings(); rerenderHome(); });
    $$("#seg-diff button", view).forEach(b => b.onclick = () => { settings.difficulty = b.dataset.v; saveSettings(); rerenderHome(); });
    $$("#seg-qtype button", view).forEach(b => b.onclick = () => { settings.qtype = b.dataset.v; saveSettings(); rerenderHome(); });
    $$("#seg-len button", view).forEach(b => b.onclick = () => { settings.length = b.dataset.v; saveSettings(); rerenderHome(); });
    $$("[data-cat]", view).forEach(b => b.onclick = () => {
      const cat = b.dataset.cat, i = settings.cats.indexOf(cat);
      if (i >= 0) settings.cats.splice(i, 1); else settings.cats.push(cat);
      saveSettings(); rerenderHome();
    });
  }

  function rerenderHome() {
    // opnieuw tekenen zonder te springen of de collage te wisselen
    const y = window.scrollY;
    const imgs = $$(".collage img", view).map(i => i.getAttribute("src"));
    renderHome();
    $$(".collage figure", view).forEach((f, i) => {
      if (!imgs[i]) return;
      const a = ANIMALS.find(x => x.img === imgs[i]);
      $("img", f).src = imgs[i];
      $("figcaption", f).textContent = a ? a.name : "";
    });
    window.scrollTo(0, y);
  }

  function footerHTML() {
    return `<footer class="footer">
      Gemaakt door <b>${MAKER}</b> · <a href="#/over">Over deze quiz</a><br>
      Teksten: Wikipedia (CC BY-SA) · Foto's: iNaturalist en Wikimedia Commons · Kaarten: GBIF.org
    </footer>`;
  }

  // ================= Installeren & offline (PWA) =================
  const CAN_CACHE = "caches" in window && "serviceWorker" in navigator && location.protocol !== "file:";
  const IS_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const IS_STANDALONE = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const MEDIA_URLS = [...new Set([...ANIMALS.map(a => a.img), ...ANIMALS.map(a => a.thumb), ...ANIMALS.map(a => a.map).filter(Boolean)])];
  let installPrompt = null;
  const offline = { cached: null, busy: false, done: 0 };

  if (CAN_CACHE) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      installPrompt = e;
      const b = $("#btn-install");
      if (b) b.hidden = false;
    });
    window.addEventListener("appinstalled", () => { installPrompt = null; toast("Oceaanquiz staat nu op je beginscherm"); });
  }

  function pwaSectionHTML() {
    let how;
    if (IS_STANDALONE) how = "Je speelt de app-versie. Maak alles offline beschikbaar om ook zonder internet te kunnen spelen.";
    else if (IS_IOS) how = `Zet de quiz op je beginscherm: tik in Safari op <b>Deel</b> ${icon("share")} en kies <b>Zet op beginscherm</b>.`;
    else if (matchMedia("(pointer: coarse)").matches) how = "Installeer de quiz als app op je telefoon, of kies in het browsermenu <b>Toevoegen aan startscherm</b>.";
    else how = "Scan de QR-code met je telefoon om de quiz daar te openen, en zet hem op je beginscherm.";
    const mb = META.offlineMB ? ` (±${META.offlineMB} MB)` : "";
    return `<section class="section">
      <div class="install-card">
        <img class="install-icon" src="icons/icon-192.png" alt="">
        <div class="install-body">
          <h2>Speel overal, ook offline</h2>
          <p>${how}</p>
          <div class="install-actions">
            <button class="btn" id="btn-install" ${installPrompt ? "" : "hidden"}>${icon("play")} Installeer app</button>
            ${CAN_CACHE ? `<button class="btn btn-secondary" id="btn-offline">${icon("layers")} <span>Alles offline beschikbaar maken${mb}</span></button>` : ""}
          </div>
          <div class="dl" id="dl" hidden><div class="progress"><i id="dl-bar"></i></div><span id="dl-txt"></span></div>
        </div>
        <figure class="qr" ${IS_STANDALONE || matchMedia("(pointer: coarse)").matches ? "hidden" : ""}>
          <img src="icons/qr.png" alt="QR-code naar de online versie" onerror="this.parentNode.hidden=true">
          <figcaption>Scan met je telefoon</figcaption>
        </figure>
      </div>
    </section>`;
  }

  const mediaKey = url => new URL(url, location.href).pathname.split("/").slice(-2).join("/");
  async function countCached() {
    const have = new Set((await (await caches.open("oq-media-2")).keys()).map(r => mediaKey(r.url)));
    return MEDIA_URLS.filter(u => have.has(u)).length;
  }

  function showOfflineStatus() {
    const btn = $("#btn-offline");
    if (!btn) return;
    const total = MEDIA_URLS.length, n = offline.busy ? offline.done : offline.cached;
    if (n == null) return;
    $("#dl").hidden = !offline.busy && n === 0;
    $("#dl-bar").style.width = `${(n / total) * 100}%`;
    if (offline.busy) $("#dl-txt").textContent = `Downloaden… ${n} van ${total} bestanden`;
    else if (n >= total) { $("#dl-txt").textContent = "Alles staat offline op dit apparaat."; btn.hidden = true; }
    else $("#dl-txt").textContent = `${n} van ${total} foto's en kaarten staan al offline.`;
  }

  async function downloadAll() {
    if (offline.busy) return;
    offline.busy = true;
    const cache = await caches.open("oq-media-2");
    const have = new Set((await cache.keys()).map(r => mediaKey(r.url)));
    const todo = MEDIA_URLS.filter(u => !have.has(u));
    offline.done = MEDIA_URLS.length - todo.length;
    $("#btn-offline").disabled = true;
    let failed = 0;
    const worker = async () => {
      while (todo.length) {
        const url = todo.shift();
        try {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res); else failed++;
        } catch { failed++; }
        offline.done++;
        showOfflineStatus();
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    offline.busy = false;
    offline.cached = await countCached();
    if ($("#btn-offline")) $("#btn-offline").disabled = false;
    showOfflineStatus();
    toast(failed ? `${failed} bestanden mislukt, probeer het later opnieuw` : "Klaar! Je kunt nu offline spelen");
  }

  function bindPwaSection() {
    const ib = $("#btn-install");
    if (ib) ib.onclick = async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      ib.hidden = true;
    };
    const ob = $("#btn-offline");
    if (!ob) return;
    ob.onclick = downloadAll;
    if (offline.busy) { ob.disabled = true; showOfflineStatus(); return; }
    countCached().then(n => { offline.cached = n; showOfflineStatus(); }).catch(() => {});
  }

  // ================= Vragen opbouwen =================
  function similarity(a, b) {
    const wa = new Set(a.name.toLowerCase().split(/[\s-]+/));
    const shared = b.name.toLowerCase().split(/[\s-]+/).filter(w => w.length > 2 && wa.has(w)).length;
    let suffix = 0;
    const x = a.name.toLowerCase(), y = b.name.toLowerCase();
    while (suffix < x.length && suffix < y.length && x[x.length - 1 - suffix] === y[y.length - 1 - suffix]) suffix++;
    return shared * 3 + (suffix >= 3 ? Math.min(suffix, 8) : 0)
      + (a.sci.split(" ")[0] === b.sci.split(" ")[0] ? 4 : 0)
      + (a.family && a.family === b.family ? 6 : 0)
      + (a.order && a.order === b.order ? 3 : 0)
      + (a.cat === b.cat ? 3 : 0);
  }

  function pickDistractors(answer, difficulty, pool, rnd = Math.random, needMap = false) {
    let others = ANIMALS.filter(a => a !== answer && a.name !== answer.name && (!needMap || a.map));
    let picks;
    if (difficulty === "easy") {
      picks = shuffle(CATS.filter(c => c !== answer.cat), rnd).slice(0, 3)
        .map(c => pick(others.filter(a => a.cat === c), rnd)).filter(Boolean);
    } else if (difficulty === "hard") {
      picks = shuffle(shuffle(others, rnd).map(a => [similarity(answer, a), a])
        .sort((p, q) => q[0] - p[0]).slice(0, 7).map(p => p[1]), rnd).slice(0, 3);
    } else {
      const base = pool.filter(a => others.includes(a));
      picks = shuffle(base.length >= 3 ? base : others, rnd).slice(0, 3);
    }
    while (picks.length < 3) {
      const extra = pick(others, rnd);
      if (!picks.includes(extra)) picks.push(extra);
    }
    return picks;
  }

  function makeQuestion(animal, opts, rnd = Math.random) {
    let type = opts.qtype === "type" ? "type" : "photo";
    if (opts.qtype === "mixed") {
      const r = rnd();
      type = r < 0.5 ? "photo" : r < 0.75 ? "name2photo" : (animal.map ? "map" : "name2photo");
    }
    const q = {
      animal, type,
      photo: animal.photos[Math.floor(rnd() * animal.photos.length)],
    };
    if (type !== "type") {
      q.options = shuffle([animal, ...pickDistractors(animal, opts.difficulty, opts.pool, rnd, type === "map")], rnd);
      if (type === "name2photo") q.optionPhotos = q.options.map(o => o.photos[0]);
    }
    return q;
  }

  // ================= Quiz =================
  function startGame(mode) {
    let pool = selectionPool(), questions, difficulty = settings.difficulty, qtype = settings.qtype;
    if (mode === "daily") {
      if (daily[todayKey()]) return shareDaily(todayKey());
      const rnd = seeded("oceaanquiz-" + todayKey());
      difficulty = "normal"; qtype = "photo"; pool = ANIMALS;
      const opts = { difficulty, qtype, pool };
      questions = shuffle(ANIMALS, rnd).slice(0, DAILY_LEN).map(a => makeQuestion(a, opts, rnd));
    } else if (mode === "learn") {
      if (!pool.length) pool = ANIMALS;
      const now = Date.now();
      const dueList = pool.filter(a => srs[a.id] && srs[a.id].due <= now).sort((a, b) => srs[a.id].due - srs[b.id].due);
      const fresh = shuffle(pool.filter(a => !srs[a.id]));
      const later = shuffle(pool.filter(a => srs[a.id] && srs[a.id].due > now)).sort((a, b) => srs[a.id].box - srs[b.id].box);
      const chosen = [...dueList, ...fresh, ...later].slice(0, Math.min(LEARN_LEN, pool.length));
      const opts = { difficulty, qtype, pool };
      questions = shuffle(chosen).map(a => makeQuestion(a, opts));
    } else {
      if (pool.length < 4) return;
      const n = mode !== "classic" ? pool.length : settings.length === "all" ? pool.length : Math.min(+settings.length, pool.length);
      const opts = { difficulty, qtype, pool };
      questions = shuffle(pool).slice(0, n).map(a => makeQuestion(a, opts));
    }
    game = {
      mode, difficulty, qtype, pool, questions,
      index: 0, score: 0, streak: 0, bestStreak: 0, correct: 0, asked: 0,
      lives: LIVES, mistakes: [], newFound: [], pattern: [], answered: false, requeued: new Set(),
      endsAt: mode === "time" ? Date.now() + TIME_LIMIT * 1000 : 0,
      startedAt: Date.now(),
    };
    go("quiz");
  }

  function modeLabel(mode) { return (MODES[mode] || EXTRA_MODES[mode]).label; }

  function quizHeader() {
    const g = game;
    let progress, right;
    if (g.mode === "time") {
      progress = `<div class="progress timer" role="progressbar" aria-label="Resterende tijd"><i id="timer-bar"></i></div>`;
      right = `<span class="quiz-stat" id="timer-txt">${icon("clock")} ${TIME_LIMIT}s</span>`;
    } else if (g.mode === "survival") {
      progress = `<div class="progress"><i style="width:${Math.min(100, g.correct / Math.max(10, g.correct + 3) * 100)}%"></i></div>`;
      right = `<span class="hearts" role="img" aria-label="${g.lives} levens">${Array.from({ length: LIVES }, (_, i) =>
        icon("heart", i < g.lives ? "" : "lost")).join("")}</span>`;
    } else {
      progress = `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${g.questions.length}" aria-valuenow="${g.index}"><i style="width:${(g.index / g.questions.length) * 100}%"></i></div>`;
      right = `<span class="quiz-stat" style="color:var(--text-3)">${g.index + 1}/${g.questions.length}</span>`;
    }
    const badge = g.mode === "daily" ? `<span class="mode-badge">${icon("calendar")} Dagelijks</span>`
      : g.mode === "learn" ? `<span class="mode-badge">${icon("brain")} Oefenen</span>` : "";
    return `<div class="quiz-top">
      <button class="icon-btn" data-act="quit" aria-label="Stoppen">${icon("x")}</button>
      ${badge}
      ${progress}
      <span class="quiz-stat streak" title="Reeks" ${g.streak < 2 ? 'style="opacity:.35"' : ""}>${icon("flame")} ${g.streak}</span>
      <span class="quiz-stat" title="Punten">${icon("star")} ${fmt(g.score)}</span>
      ${right}
    </div>`;
  }

  function bindQuit() {
    $("[data-act=quit]", view).onclick = () => {
      if (game && game.asked && !confirm("Weet je zeker dat je wilt stoppen? Je voortgang in dit spel gaat verloren.")) return;
      game = null; go("home");
    };
  }

  function photoCardHTML(q, showCat) {
    const p = q.photo, a = q.animal;
    return `<div class="photo-card">
      <div class="blur" style="background-image:url('${p.img}')"></div>
      <img class="main" src="${p.img}" alt="Foto van het dier dat je moet raden">
      ${showCat ? `<span class="chip">${esc(a.cat)}</span>` : ""}
      <a class="photo-credit" href="${esc(p.credit.url)}" target="_blank" rel="noopener" title="Foto: ${esc(p.credit.by)} (${esc(p.credit.license)}) via ${esc(p.credit.source)}">
        ${icon("camera")} ${esc(p.credit.by)}</a>
    </div>`;
  }

  function renderQuestion() {
    const g = game;
    if (g.index >= g.questions.length) return endGame();
    const q = g.current = g.questions[g.index];
    const a = q.animal;
    g.answered = false;
    const showCat = g.difficulty !== "hard";
    let left, title, sub, answers;

    if (q.type === "map") {
      left = `<div class="photo-card map-card"><div class="map big"><img src="${a.map}" alt="Kaart met waarnemingen van het dier dat je moet raden"></div></div>`;
      title = "Welk dier komt hier voor?";
      sub = "De kaart toont waar dit dier is waargenomen.";
    } else if (q.type === "name2photo") {
      left = `<div class="name-card"><span class="name-label">Zoek de foto van</span><h2>${esc(a.name)}</h2>
        ${showCat ? `<span class="chip soft">${esc(a.cat)}</span>` : ""}</div>`;
      title = "Welke foto hoort bij dit dier?";
      sub = "Kies een van de vier foto's.";
    } else {
      left = photoCardHTML(q, showCat);
      title = "Welk dier is dit?";
      sub = showCat ? `Een dier uit de groep <b>${esc(a.cat.toLowerCase())}</b>.` : "Moeilijk niveau: geen hints.";
    }

    if (q.type === "type") {
      const letters = a.name.replace(/[^a-zà-ÿ]/gi, "").length;
      answers = `<form class="type-form" id="type-form" autocomplete="off">
        <label class="sr-only" for="type-input">Typ de naam van het dier</label>
        <input id="type-input" class="type-input" type="text" placeholder="Typ de naam… (${letters} letters)" autocapitalize="off" spellcheck="false">
        <button class="btn btn-lg" type="submit">Controleer</button>
      </form>
      <button class="link-btn" data-act="hint" type="button">${icon("bulb")} Hint (eerste letter)</button>`;
    } else if (q.type === "name2photo") {
      answers = `<div class="photo-answers" role="group" aria-label="Foto's">
        ${q.options.map((o, i) => `<button class="photo-answer" data-i="${i}" aria-label="Foto ${i + 1}">
          <img src="${o.thumb}" alt=""><span class="key">${i + 1}</span><span class="pa-name">${esc(o.name)}</span></button>`).join("")}
      </div>`;
    } else {
      answers = `<div class="answers" role="group" aria-label="Antwoorden">
        ${q.options.map((o, i) => `<button class="answer" data-i="${i}">
          <span class="key">${i + 1}</span><span>${esc(o.name)}</span>
          <span class="state">${icon(o === a ? "check" : "x")}</span></button>`).join("")}
      </div>`;
    }

    view.innerHTML = `
      <div class="container">
        ${quizHeader()}
        <div class="quiz-grid ${q.type === "name2photo" ? "n2p" : ""}">
          <div>${left}</div>
          <div id="q-side">
            <h2 class="q-title">${title}</h2>
            <p class="q-sub">${sub}</p>
            ${answers}
            <p class="kbd-hint">${q.type === "type" ? "Tip: druk op <kbd>Enter</kbd> om te controleren." : "Tip: gebruik <kbd>1</kbd>–<kbd>4</kbd> om te kiezen en <kbd>Enter</kbd> om door te gaan."}</p>
            <div id="q-info"></div>
          </div>
        </div>
      </div>`;

    bindQuit();
    $$(".answer, .photo-answer", view).forEach(b => b.onclick = () => answerChoice(+b.dataset.i));
    const form = $("#type-form");
    if (form) {
      form.onsubmit = e => { e.preventDefault(); answerTyped($("#type-input").value); };
      $("[data-act=hint]").onclick = e => {
        const inp = $("#type-input");
        if (!inp.value) inp.value = a.name[0];
        g.usedHint = true;
        e.currentTarget.disabled = true;
        inp.focus();
      };
      g.usedHint = false;
      setTimeout(() => $("#type-input").focus(), 50);
    }
    // volgende media alvast laden
    const next = g.questions[g.index + 1];
    if (next) new Image().src = next.photo.img;
    announce(`Vraag ${g.index + 1}. ${title}${q.type === "name2photo" ? " " + a.name : ""}`);
    if (g.mode === "time") startTimer();
  }

  // Tikfouten toestaan bij intypen
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
  function levenshtein(a, b) {
    const d = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = d[0]; d[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = d[j];
        d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return d[b.length];
  }
  function typedMatches(input, animal) {
    const x = norm(input);
    if (!x) return false;
    return [animal.name, animal.sci].some(t => {
      const y = norm(t);
      return x === y || levenshtein(x, y) <= Math.max(1, Math.floor(y.length / 6));
    });
  }

  function answerChoice(i) {
    const g = game;
    if (!g || g.answered || g.current.type === "type") return;
    const q = g.current, ok = q.options[i] === q.animal;
    const sel = q.type === "name2photo" ? ".photo-answer" : ".answer";
    $$(sel, view).forEach((b, j) => {
      b.disabled = true;
      if (q.options[j] === q.animal) b.classList.add("correct");
      else if (j === i) b.classList.add("wrong");
      else b.classList.add("dim");
    });
    if (q.type === "name2photo") view.querySelector(".photo-answers").classList.add("revealed");
    resolve(ok);
  }

  function answerTyped(value) {
    const g = game;
    if (!g || g.answered) return;
    const ok = typedMatches(value, g.current.animal);
    const inp = $("#type-input");
    inp.disabled = true;
    inp.classList.add(ok ? "correct" : "wrong");
    $("#type-form button").disabled = true;
    $("[data-act=hint]").disabled = true;
    resolve(ok);
  }

  function updateSrs(id, ok) {
    const s = srs[id] || { box: 0, due: 0 };
    s.box = ok ? Math.min(s.box + 1, SRS_DAYS.length - 1) : 0;
    s.due = Date.now() + (ok ? SRS_DAYS[s.box] * DAY : 0);
    srs[id] = s;
    saveSrs();
  }

  function resolve(ok) {
    const g = game;
    g.answered = true;
    g.asked++;
    const q = g.current, a = q.animal;
    g.pattern.push(ok);
    updateSrs(a.id, ok);

    let pts = 0;
    if (ok) {
      g.correct++; g.streak++;
      g.bestStreak = Math.max(g.bestStreak, g.streak);
      const typeBonus = q.type === "type" ? (g.usedHint ? 1 : 1.5) : 1;
      pts = Math.round(100 * DIFF[g.difficulty].mult * typeBonus) + 10 * Math.min(g.streak - 1, 10);
      g.score += pts;
      if (!found.has(a.id)) { found.add(a.id); g.newFound.push(a.id); saveFound(); }
    } else {
      g.streak = 0;
      g.mistakes.push(a.id);
      if (g.mode === "survival") g.lives--;
      // bij oefenen komt een fout dier verderop in dezelfde ronde nog één keer terug
      if (g.mode === "learn" && !g.requeued.has(a.id)) {
        g.requeued.add(a.id);
        const pos = Math.min(g.questions.length, g.index + 4);
        g.questions.splice(pos, 0, makeQuestion(a, { difficulty: g.difficulty, qtype: g.qtype, pool: g.pool }));
      }
    }
    // kopregel bijwerken (score, reeks, levens)
    const timerWidth = $("#timer-bar") && $("#timer-bar").style.width;
    $(".quiz-top", view).outerHTML = quizHeader();
    bindQuit();
    if (timerWidth) $("#timer-bar").style.width = timerWidth;

    if (g.mode === "time") {
      announce(ok ? "Goed" : `Fout, het was ${a.name}`);
      setTimeout(() => { if (game === g && Date.now() < g.endsAt) { g.index++; renderQuestion(); } }, ok ? 450 : 1000);
      return;
    }

    const isLast = g.mode === "survival" ? g.lives <= 0 || g.index + 1 >= g.questions.length : g.index + 1 >= g.questions.length;
    $("#q-info").innerHTML = infoHTML(a, q.type === "map" ? q.photo : null);
    $(".kbd-hint", view).hidden = true;
    const praise = pick(["Goed zo!", "Helemaal goed!", "Uitstekend!", "Raak!", "Knap gedaan!"]);
    const title = ok ? `${praise} +${pts}` : (g.mode === "survival" && g.lives <= 0 ? "Je levens zijn op!" : "Helaas, niet goed");
    const sub = ok ? (g.newFound.includes(a.id) ? `Nieuw in je collectie: ${a.name}` : a.name) : `Het juiste antwoord is: ${a.name}`;
    showFeedback(ok, title, sub, isLast ? "Bekijk resultaat" : "Doorgaan");
    announce(`${title}. ${sub}`);
    if (matchMedia("(max-width: 900px)").matches) {
      setTimeout(() => $("#q-info").scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  }

  function next() {
    const g = game;
    if (!g || !g.answered) return;
    hideFeedback();
    if (g.mode === "survival" && g.lives <= 0) return endGame();
    g.index++;
    if (g.index >= g.questions.length) return endGame();
    renderQuestion();
    window.scrollTo({ top: 0 });
  }

  function showFeedback(ok, title, sub, btnLabel) {
    const fb = $("#feedback");
    fb.className = "feedback " + (ok ? "good" : "bad");
    $("#fb-icon").innerHTML = icon(ok ? "check" : "x");
    $("#fb-title").textContent = title;
    $("#fb-sub").textContent = sub;
    $("#fb-next").textContent = btnLabel;
    fb.hidden = false;
    $("#fb-next").focus({ preventScroll: true });
  }
  function hideFeedback() { $("#feedback").hidden = true; }
  $("#fb-next").onclick = next;

  // Tijdrace-timer
  let timerId = null;
  function startTimer() {
    stopTimer();
    const tick = () => {
      if (!game) return stopTimer();
      const left = Math.max(0, game.endsAt - Date.now());
      const bar = $("#timer-bar"), txt = $("#timer-txt");
      if (bar) bar.style.width = `${(left / (TIME_LIMIT * 1000)) * 100}%`;
      if (txt) txt.innerHTML = `${icon("clock")} ${Math.ceil(left / 1000)}s`;
      if (left <= 0) { stopTimer(); endGame(); }
    };
    tick();
    timerId = setInterval(tick, 200);
  }
  function stopTimer() { clearInterval(timerId); timerId = null; }

  function endGame() {
    const g = game;
    stopTimer();
    hideFeedback();
    let record = false;
    if (MODES[g.mode]) {
      const key = `${g.mode}-${g.difficulty}`;
      const all = store.get("oq3-scores", {});
      const list = all[key] || [];
      const prevBest = list[0] ? list[0].score : 0;
      list.push({ score: g.score, correct: g.correct, total: g.asked, date: new Date().toLocaleDateString("nl-NL") });
      list.sort((a, b) => b.score - a.score);
      all[key] = list.slice(0, 5);
      store.set("oq3-scores", all);
      record = g.score > prevBest && g.score > 0;
    }
    if (g.mode === "daily") {
      daily[todayKey()] = { score: g.score, correct: g.correct, total: g.asked, pattern: g.pattern.map(Number) };
      store.set("oq3-daily", daily);
    }
    resultData = { ...g, record, seconds: Math.round((Date.now() - g.startedAt) / 1000) };
    game = null;
    go("resultaat");
  }

  // ================= Delen (dagelijkse uitdaging) =================
  function dailyShareText(key) {
    const d = daily[key];
    const [y, m, dd] = key.split("-").map(Number);
    const date = new Date(y, m - 1, dd).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
    const blocks = (d.pattern || []).map(v => v ? "🟩" : "🟥").join("");
    return `🌊 Oceaanquiz · ${date}\n${d.correct}/${d.total} goed · ${fmt(d.score)} punten\n${blocks}\n${SITE_URL}`;
  }
  async function shareDaily(key) {
    if (!daily[key]) return;
    const text = dailyShareText(key);
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
    } catch { /* geannuleerd */ }
    try { await navigator.clipboard.writeText(text); toast("Score gekopieerd, plak hem in een chat!"); }
    catch { prompt("Kopieer je score:", text); }
  }

  // ================= Resultaat =================
  function renderResult() {
    const r = resultData;
    const ratio = r.asked ? r.correct / r.asked : 0;
    const title = ratio === 1 && r.asked >= 5 ? "Perfect! Echte oceanoloog" :
      ratio >= .8 ? "Fantastisch gedaan!" : ratio >= .5 ? "Goed bezig!" : "Blijven oefenen!";
    const color = ratio >= .8 ? "var(--success)" : ratio >= .5 ? "var(--primary)" : "var(--accent)";
    const mistakes = [...new Set(r.mistakes)].map(id => BY_ID.get(id)).filter(Boolean);
    const newOnes = r.newFound.map(id => BY_ID.get(id)).filter(Boolean);
    const mm = Math.floor(r.seconds / 60), ss = String(r.seconds % 60).padStart(2, "0");
    const due = dueForReview().length;

    view.innerHTML = `
      <div class="container">
        <div class="result">
          <div class="result-card">
            ${r.record ? `<span class="badge-record">${icon("trophy")} Nieuw record!</span>` : ""}
            <div class="ring-big" role="img" aria-label="${Math.round(ratio * 100)} procent goed">${ring(ratio, 170, 14, color).replace('class="ring"', "")}
              <div class="val"><b>${Math.round(ratio * 100)}%</b><span>goed</span></div></div>
            <h1>${title}</h1>
            <p class="lead">${modeLabel(r.mode)}${r.mode === "daily" ? "" : ` · ${DIFF[r.difficulty].label}`}</p>
            ${r.mode === "daily" ? `<p class="pattern" aria-hidden="true">${r.pattern.map(v => `<i class="${v ? "ok" : "no"}"></i>`).join("")}</p>` : ""}
            <div class="stat-grid">
              <div class="stat"><b>${fmt(r.score)}</b><span>punten</span></div>
              <div class="stat"><b>${r.correct}/${r.asked}</b><span>goed beantwoord</span></div>
              <div class="stat"><b>${r.bestStreak}</b><span>langste reeks</span></div>
              <div class="stat"><b>${r.mode === "time" ? `${TIME_LIMIT}s` : `${mm}:${ss}`}</b><span>speeltijd</span></div>
            </div>
            <div class="result-actions">
              ${r.mode === "daily"
                ? `<button class="btn btn-lg" data-act="share">${icon("share")} Deel je score</button>`
                : `<button class="btn btn-lg" data-act="again">${icon("rotate")} Nog een keer</button>`}
              ${mistakes.length && r.mode !== "learn" ? `<button class="btn btn-secondary" data-act="learn">${icon("brain")} Oefen je fouten</button>` : ""}
              ${r.mode === "learn" && due ? `<button class="btn btn-secondary" data-act="learn">${icon("brain")} Verder oefenen (${due})</button>` : ""}
              <button class="btn btn-ghost" data-act="home">Terug naar start</button>
            </div>
          </div>
          <div>
            ${newOnes.length ? `<section class="review">
              <h2>Nieuw in je collectie <span style="color:var(--success)">+${newOnes.length}</span></h2>
              <p>Deze dieren heb je voor het eerst goed geraden.</p>
              <div class="grid">${newOnes.map(cardHTML).join("")}</div></section>` : ""}
            <section class="review">
              <h2>${mistakes.length ? "Om nog eens te bekijken" : "Geen fouten!"}</h2>
              <p>${mistakes.length ? "Deze dieren komen vaker terug in de oefenmodus. Klik op een dier om te lezen hoe je het herkent." : "Je had alles goed. Probeer eens een hoger niveau of de vraagsoort 'Intypen'."}</p>
              ${mistakes.length ? `<div class="grid">${mistakes.map(cardHTML).join("")}</div>` : ""}
            </section>
          </div>
        </div>
      </div>`;
    const again = $("[data-act=again]", view);
    if (again) again.onclick = () => startGame(r.mode);
    const share = $("[data-act=share]", view);
    if (share) share.onclick = () => shareDaily(todayKey());
    $$("[data-act=learn]", view).forEach(b => b.onclick = () => startGame("learn"));
    $("[data-act=home]", view).onclick = () => go("home");
    bindCards(view, [...newOnes, ...mistakes]);
    announce(`${title}. ${r.correct} van de ${r.asked} goed, ${r.score} punten.`);
  }

  // ================= Dierinformatie (gedeeld) =================
  function infoHTML(a, photoOverride, expanded = false) {
    const facts = a.facts.length
      ? `<ul class="facts">${a.facts.map((f, i) => `<li><span class="num">${i + 1}</span><span>${esc(f)}</span></li>`).join("")}</ul>`
      : "";
    // Het ene opvallendste feit, uitgelicht en met eigen bron; de rest onder 'Meer weten'
    const top = a.top
      ? `<figure class="top-fact"><blockquote>${esc(a.top.text)}</blockquote>
           <figcaption>Bron: <a href="${esc(a.top.url)}" target="_blank" rel="noopener">${esc(a.top.by)} ${icon("external")}</a></figcaption></figure>`
      : "";
    const more = `<p>${esc(a.intro)}</p>${facts}
        <div class="more-links">
          <a class="more-link" href="${esc(a.wiki)}" target="_blank" rel="noopener">Lees verder op Wikipedia ${icon("external")}</a>
          ${a.wikiEn ? `<a class="more-link" href="${esc(a.wikiEn)}" target="_blank" rel="noopener">Bron: Engelse Wikipedia ${icon("external")}</a>` : ""}
        </div>`;
    const map = a.map
      ? `<div class="map"><img src="${a.map}" alt="Kaart met waarnemingen van ${esc(a.name)}" loading="lazy"></div>
         <div class="map-legend"><span class="swatch"><span class="grad"></span> weinig → veel waarnemingen</span>
         <span>${fmt(a.obs)} waarnemingen · bron: <a href="https://www.gbif.org/species/search?q=${encodeURIComponent(a.sci)}" target="_blank" rel="noopener">GBIF</a></span></div>`
      : `<div class="map map-empty">Geen waarnemingen beschikbaar</div>`;
    const p = photoOverride || a.photos[0];
    // na een kaartvraag heb je het dier nog niet gezien: dan tonen we ook de foto
    const gallery = photoOverride ? `<div class="info-photo"><img src="${photoOverride.img}" alt="${esc(a.name)}" loading="lazy"></div>` : "";
    return `<div class="info">
      ${gallery}
      <div class="info-head">
        <h3 id="d-title">${esc(a.name)}</h3>
        <div class="sci">${esc(a.sci)}${a.family ? ` · familie ${esc(a.family)}` : ""}</div>
        <div class="info-meta">
          <span class="chip soft">${icon("layers")} ${esc(a.cat)}</span>
          ${isNorthSea(a) ? `<span class="chip soft ns">${icon("waves")} Komt voor in de Noordzee</span>` : ""}
          ${a.obs ? `<span class="chip soft">${icon("eye")} ${fmt(a.obs)} waarnemingen</span>` : ""}
          ${found.has(a.id) ? `<span class="chip soft" style="color:var(--success)">${icon("check")} Ontdekt</span>` : ""}
        </div>
      </div>
      <section class="info-sec">
        <h4>${icon("bulb")} Wist je dat?</h4>
        ${top ? `${top}<details class="more-facts"${expanded ? " open" : ""}><summary>Meer weten</summary>${more}</details>` : more}
      </section>
      <section class="info-sec">
        <h4>${icon("map")} Waar komt dit dier voor?</h4>
        ${map}
      </section>
      <p class="info-credit">${icon("camera")} Foto: <a href="${esc(p.credit.url)}" target="_blank" rel="noopener">${esc(p.credit.by)}</a>
        · ${esc(p.credit.license)} · ${esc(p.credit.source)}</p>
    </div>`;
  }

  function cardHTML(a) {
    return `<button class="card" data-id="${a.id}">
      <span class="thumb"><img src="${a.thumb}" alt="" loading="lazy">
        ${found.has(a.id) ? `<span class="found" title="Ontdekt">${icon("check")}</span>` : ""}
        ${isNorthSea(a) ? `<span class="ns-badge" title="Komt voor in de Noordzee">${icon("waves")}</span>` : ""}</span>
      <span class="body"><b>${esc(a.name)}</b><small>${esc(a.sci)}</small></span>
    </button>`;
  }
  function bindCards(root, list) {
    $$(".card", root).forEach(c => c.onclick = () => openDetail(BY_ID.get(c.dataset.id), list));
  }

  // ================= Gids =================
  const guide = { q: "", cat: null, sort: "name", show: "all" };

  function guideList() {
    const q = guide.q.trim().toLowerCase();
    const list = ANIMALS
      .filter(a => !guide.cat || a.cat === guide.cat)
      .filter(a => guide.show === "all" || (guide.show === "ns" ? isNorthSea(a) : (guide.show === "found") === found.has(a.id)))
      .filter(a => !q || a.name.toLowerCase().includes(q) || a.sci.toLowerCase().includes(q));
    const byName = (a, b) => a.name.localeCompare(b.name, "nl");
    const sorts = {
      name: byName,
      cat: (a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat) || byName(a, b),
      obs: (a, b) => (b.obs || 0) - (a.obs || 0),
    };
    return list.sort(sorts[guide.sort]);
  }

  function renderGuide() {
    view.innerHTML = `
      <div class="container">
        <div class="guide-head">
          <div><h1>Dierengids</h1><p>Alle ${ANIMALS.length} zeedieren uit de quiz, met feitjes, foto's en verspreidingskaarten.</p></div>
        </div>
        <div class="toolbar">
          <div class="toolbar-row">
            <label class="search">${icon("search")}<input type="search" id="g-search" placeholder="Zoek op naam of wetenschappelijke naam…" value="${esc(guide.q)}" aria-label="Zoeken"></label>
            <select class="sel" id="g-show" aria-label="Filter">
              <option value="all">Alle dieren</option><option value="ns">Noordzeedieren</option>
              <option value="found">Ontdekt</option><option value="todo">Nog niet ontdekt</option>
            </select>
            <select class="sel" id="g-sort" aria-label="Sorteren">
              <option value="name">Naam A–Z</option><option value="cat">Diergroep</option><option value="obs">Meest waargenomen</option>
            </select>
          </div>
          <div class="filter-chips" id="g-cats" role="group" aria-label="Diergroep">
            ${[null, ...CATS].map(c => `<button class="fchip ${guide.cat === c ? "on" : ""}" data-c="${c ? esc(c) : ""}" aria-pressed="${guide.cat === c}">${c ? esc(c) : "Alles"}
              <small>${c ? ANIMALS.filter(a => a.cat === c).length : ANIMALS.length}</small></button>`).join("")}
          </div>
        </div>
        <p class="count-line" id="g-count" aria-live="polite"></p>
        <div class="grid" id="g-grid"></div>
        ${footerHTML()}
      </div>`;
    $("#g-show").value = guide.show;
    $("#g-sort").value = guide.sort;
    $("#g-search").oninput = e => { guide.q = e.target.value; fillGuide(); };
    $("#g-show").onchange = e => { guide.show = e.target.value; fillGuide(); };
    $("#g-sort").onchange = e => { guide.sort = e.target.value; fillGuide(); };
    $$("#g-cats .fchip").forEach(b => b.onclick = () => {
      guide.cat = b.dataset.c || null;
      $$("#g-cats .fchip").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
      fillGuide();
    });
    fillGuide();
  }

  function fillGuide() {
    const list = guideList();
    $("#g-count").textContent = `${list.length} ${list.length === 1 ? "dier" : "dieren"}`;
    $("#g-grid").innerHTML = list.length ? list.map(cardHTML).join("")
      : `<div class="empty-state">Geen dieren gevonden. Probeer een andere zoekterm.</div>`;
    bindCards($("#g-grid"), list);
  }

  // ================= Over =================
  function renderAbout() {
    const photos = ANIMALS.flatMap(a => a.photos);
    const inat = photos.filter(p => p.credit.source === "iNaturalist").length;
    const curated = ANIMALS.filter(a => a.curated).length;
    view.innerHTML = `
      <div class="container narrow">
        <div class="about">
          <img class="about-icon" src="icons/icon-192.png" alt="">
          <h1>Over de Oceaanquiz</h1>
          <p class="lead">Een fotoquiz over ${ANIMALS.length} zeedieren: van de blauwe vinvis tot de zeepier.</p>

          <section class="about-card maker">
            <h2>Gemaakt door</h2>
            <p class="maker-name">${MAKER}</p>
            <p>Idee, keuzes en testen: ${MAKER}. Gebouwd met hulp van Claude (Anthropic).</p>
          </section>

          <section class="about-card">
            <h2>Hoe het werkt</h2>
            <ul class="about-list">
              <li><b>Topfeitje</b>: per dier één uitgelicht feit, gezocht bij betrouwbare bronnen zoals aquaria, musea, universiteiten en NOAA (${ANIMALS.filter(a => a.top).length} dieren). De bron staat er steeds direct onder.</li>
              <li><b>Meer feitjes</b>: per dier uitgezocht in de Nederlandse en Engelse Wikipedia en in eigen woorden herschreven (${curated} dieren met handmatig nagelopen feitjes). Elk feitje is terug te vinden in het gelinkte Wikipedia-artikel.</li>
              <li><b>Foto's</b>: ${fmt(photos.length)} foto's, waarvan ${fmt(inat)} van iNaturalist en ${fmt(photos.length - inat)} van Wikimedia Commons. Alleen foto's met een open licentie; maker en licentie staan bij elke foto.</li>
              <li><b>Kaarten</b>: waarnemingen uit GBIF, de wereldwijde database met miljoenen waarnemingen van dieren.</li>
              <li><b>Oefenen</b>: werkt met herhaling op afstand. Een dier dat je goed hebt, komt pas na 1, 3, 7, 14 en 30 dagen terug; een fout dier meteen weer.</li>
              <li><b>Dagelijkse uitdaging</b>: elke dag dezelfde 10 dieren voor iedereen.</li>
            </ul>
          </section>

          <section class="about-card">
            <h2>Bronnen en licenties</h2>
            <p>Teksten: <a href="https://nl.wikipedia.org" target="_blank" rel="noopener">Wikipedia</a> (CC BY-SA 4.0).
              Foto's: <a href="https://www.inaturalist.org" target="_blank" rel="noopener">iNaturalist</a> en
              <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">Wikimedia Commons</a> (licentie per foto).
              Kaarten: <a href="https://www.gbif.org" target="_blank" rel="noopener">GBIF.org</a>.
              Soortgegevens: <a href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a>.
              Iconen: Lucide (ISC). Lettertypen: Inter en Plus Jakarta Sans (OFL).</p>
            <p class="muted">Veel foto's hebben een niet-commerciële licentie (NC). Deze quiz is daarom een gratis, niet-commercieel project.</p>
          </section>

          <section class="about-card">
            <h2>Jouw gegevens</h2>
            <p>Scores, je collectie en je oefenvoortgang worden alleen op dit apparaat bewaard.</p>
            <button class="btn btn-secondary" data-act="reset">${icon("rotate")} Voortgang wissen</button>
          </section>
        </div>
        ${footerHTML()}
      </div>`;
    $("[data-act=reset]", view).onclick = () => {
      if (!confirm("Al je scores, je collectie en je oefenvoortgang wissen?")) return;
      ["oq3-found", "oq3-scores", "oq3-srs", "oq3-daily"].forEach(k => { try { localStorage.removeItem(k); } catch { /* */ } });
      location.reload();
    };
  }

  // ================= Detailblad =================
  const dlg = $("#detail");
  let detailList = [], detailIndex = 0, detailPhoto = 0;

  function openDetail(a, list) {
    detailList = list && list.length ? list : [a];
    detailIndex = Math.max(0, detailList.indexOf(a));
    detailPhoto = 0;
    fillDetail();
    if (!dlg.open) dlg.showModal();
  }
  function fillDetail() {
    const a = detailList[detailIndex];
    const p = a.photos[detailPhoto] || a.photos[0];
    const multi = detailList.length > 1;
    const many = a.photos.length > 1;
    dlg.innerHTML = `
      <div class="sheet-photo">
        <div class="blur" style="background-image:url('${p.img}')"></div>
        <img src="${p.img}" alt="${esc(a.name)}, foto ${detailPhoto + 1} van ${a.photos.length}">
        <button class="sheet-close" aria-label="Sluiten">${icon("x")}</button>
        ${many ? `<button class="gal-btn prev" data-ph="-1" aria-label="Vorige foto">${icon("left")}</button>
          <button class="gal-btn next" data-ph="1" aria-label="Volgende foto">${icon("right")}</button>
          <div class="gal-dots">${a.photos.map((_, i) => `<i class="${i === detailPhoto ? "on" : ""}"></i>`).join("")}</div>` : ""}
      </div>
      ${infoHTML(a, null, true).replace(/<p class="info-credit">[\s\S]*?<\/p>/, `<p class="info-credit">${icon("camera")} Foto: <a href="${esc(p.credit.url)}" target="_blank" rel="noopener">${esc(p.credit.by)}</a> · ${esc(p.credit.license)} · ${esc(p.credit.source)}</p>`)}
      ${multi ? `<div class="sheet-nav">
        <button class="btn btn-secondary" data-dir="-1" ${detailIndex === 0 ? "disabled" : ""}>${icon("left")} Vorige</button>
        <button class="btn btn-secondary" data-dir="1" ${detailIndex === detailList.length - 1 ? "disabled" : ""}>Volgende ${icon("right")}</button>
      </div>` : ""}`;
    $(".sheet-close", dlg).onclick = () => dlg.close();
    $$("[data-dir]", dlg).forEach(b => b.onclick = () => step(+b.dataset.dir));
    $$("[data-ph]", dlg).forEach(b => b.onclick = () => photoStep(+b.dataset.ph));
  }
  function step(dir) {
    const i = detailIndex + dir;
    if (i < 0 || i >= detailList.length) return;
    detailIndex = i; detailPhoto = 0;
    fillDetail();
    dlg.scrollTop = 0;
  }
  function photoStep(dir) {
    const a = detailList[detailIndex];
    detailPhoto = (detailPhoto + dir + a.photos.length) % a.photos.length;
    fillDetail();
  }
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

  // ================= Toetsenbord =================
  document.addEventListener("keydown", e => {
    if (dlg.open) {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      return;
    }
    if (!game) return;
    if (e.target.matches("input, select, textarea")) {
      if (e.key === "Enter" && game.answered && game.mode !== "time") { e.preventDefault(); next(); }
      return;
    }
    if (/^[1-4]$/.test(e.key) && !game.answered) answerChoice(+e.key - 1);
    else if (e.key === "Enter" && game.answered && game.mode !== "time") { e.preventDefault(); next(); }
  });

  // ================= Start =================
  if (!ANIMALS.length) {
    view.innerHTML = `<div class="container"><p style="padding:40px 0">Geen data gevonden. Draai eerst <code>python scraper/scrape.py</code>.</p></div>`;
    return;
  }
  render();
})();
