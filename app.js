(() => {
  "use strict";

  // ================= Data & constanten =================
  const ANIMALS = (window.OCEAN_ANIMALS || []).filter(a => a.img);
  const BY_ID = new Map(ANIMALS.map(a => [a.id, a]));
  const CAT_ORDER = ["Zoogdieren", "Haaien & roggen", "Vissen", "Reptielen", "Zeevogels", "Weekdieren",
    "Kreeftachtigen & co", "Kwallen & koralen", "Stekelhuidigen", "Overige ongewervelden"];
  const CATS = [...new Set(ANIMALS.map(a => a.cat))]
    .sort((a, b) => (CAT_ORDER.indexOf(a) + 1 || 99) - (CAT_ORDER.indexOf(b) + 1 || 99));
  const DIFF = {
    easy:   { label: "Makkelijk", mult: 1,   hint: "Foute antwoorden komen uit andere diergroepen." },
    normal: { label: "Normaal",   mult: 1.5, hint: "Foute antwoorden zijn willekeurige zeedieren uit je selectie." },
    hard:   { label: "Moeilijk",  mult: 2,   hint: "Sterk lijkende namen uit dezelfde groep, en de diergroep blijft verborgen." },
  };
  const MODES = {
    classic:  { label: "Klassiek",  icon: "target", color: "#0b6bbf", desc: "Een vast aantal vragen, met uitleg en kaart na elk antwoord." },
    time:     { label: "Tijdrace",  icon: "clock",  color: "#ff5e3a", desc: "60 seconden. Zoveel mogelijk dieren goed, zonder pauze." },
    survival: { label: "Overleven", icon: "heart",  color: "#e0393e", desc: "Drie levens. Hoe ver kom jij voordat ze op zijn?" },
  };
  const TIME_LIMIT = 60;
  const LIVES = 3;

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
  };
  const icon = (name, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

  // ================= Hulpfuncties =================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const fmt = n => n.toLocaleString("nl-NL");
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* opslag niet beschikbaar */ }
    },
  };

  const settings = Object.assign(
    { mode: "classic", difficulty: "normal", length: "10", cats: CATS.slice() },
    store.get("oq3-settings", {})
  );
  settings.cats = settings.cats.filter(c => CATS.includes(c));
  if (!settings.cats.length) settings.cats = CATS.slice();
  const saveSettings = () => store.set("oq3-settings", settings);

  const found = new Set(store.get("oq3-found", []).filter(id => BY_ID.has(id)));
  const saveFound = () => store.set("oq3-found", [...found]);

  function ring(value, size = 22, stroke = 3.5, color = "var(--primary)") {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="transform:rotate(-90deg)">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - value)}"/></svg>`;
  }

  function updateCollectPill() {
    $("#collect-pill").innerHTML = `${ring(found.size / ANIMALS.length)}<span><b>${found.size}</b>/${ANIMALS.length} <span class="lbl">ontdekt</span></span>`;
  }

  function toast(text) {
    const t = document.createElement("div");
    t.className = "toast";
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
    $$(".nav-link").forEach(b => b.classList.toggle("active",
      (b.dataset.nav === "home" && route === "home") || (b.dataset.nav === "guide" && route === "gids")));
    $("#appbar").hidden = route === "quiz";
    if (route === "gids") renderGuide();
    else if (route === "quiz" && game) renderQuestion();
    else if (route === "resultaat" && resultData) renderResult();
    else renderHome();
    updateCollectPill();
    window.scrollTo(0, 0);
  }
  $$("[data-nav]").forEach(b => b.onclick = () => go(b.dataset.nav === "guide" ? "gids" : "home"));

  // ================= Home =================
  function bestFor(mode, diff) {
    return (store.get("oq3-scores", {})[`${mode}-${diff}`] || [])[0];
  }

  function renderHome() {
    const popular = ANIMALS.filter(a => a.imgSize && a.imgSize[0] > a.imgSize[1] * 1.15)
      .sort((a, b) => (b.obs || 0) - (a.obs || 0)).slice(0, 80);
    const [c1, c2, c3] = shuffle(popular);
    const totalFacts = ANIMALS.reduce((n, a) => n + a.facts.length, 0);

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
              <div><b>${fmt(ANIMALS.filter(a => a.map).length)}</b><span>verspreidingskaarten</span></div>
            </div>
          </div>
          <div class="collage" aria-hidden="true">
            ${[c1, c2, c3].filter(Boolean).map((a, i) => `
              <figure class="c${i + 1}"><img src="${a.img}" alt=""><figcaption>${esc(a.name)}</figcaption></figure>`).join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head"><div><h2>Kies je spel</h2><p>Drie manieren om je kennis te testen.</p></div></div>
          <div class="modes">
            ${Object.entries(MODES).map(([k, m]) => {
              const best = bestFor(k, settings.difficulty);
              return `<button class="mode ${settings.mode === k ? "on" : ""}" data-mode="${k}">
                <span class="mode-icon" style="background:${m.color}1f;color:${m.color}">${icon(m.icon)}</span>
                <h3>${m.label}</h3><p>${m.desc}</p>
                <span class="best">${icon("trophy")} ${best ? `Record (${DIFF[settings.difficulty].label.toLowerCase()}): <b>${fmt(best.score)}</b>` : "Nog geen record"}</span>
              </button>`;
            }).join("")}
          </div>
          <div class="options-row">
            <div class="box">
              <div class="box-label">Niveau</div>
              <div class="segmented" id="seg-diff">
                ${Object.entries(DIFF).map(([k, d]) => `<button data-v="${k}" class="${settings.difficulty === k ? "on" : ""}">${d.label}</button>`).join("")}
              </div>
              <p class="hint">${DIFF[settings.difficulty].hint}</p>
            </div>
            <div class="box" ${settings.mode !== "classic" ? "hidden" : ""}>
              <div class="box-label">Aantal vragen</div>
              <div class="segmented" id="seg-len">
                ${["10", "20", "50", "all"].map(v => `<button data-v="${v}" class="${settings.length === v ? "on" : ""}">${v === "all" ? "Alle" : v}</button>`).join("")}
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
          <div class="cats">
            ${CATS.map(cat => {
              const list = ANIMALS.filter(a => a.cat === cat);
              const got = list.filter(a => found.has(a.id)).length;
              return `<button class="cat ${settings.cats.includes(cat) ? "on" : ""}" data-cat="${esc(cat)}" aria-pressed="${settings.cats.includes(cat)}">
                <img src="${COVER[cat].img}" alt="" loading="lazy">
                <span class="check">${icon("check")}</span>
                <span class="cat-body"><b>${esc(cat)}</b><small>${list.length} dieren · ${got} ontdekt</small>
                <span class="bar"><i style="width:${(got / list.length) * 100}%"></i></span></span>
              </button>`;
            }).join("")}
          </div>
        </section>

        ${pwaSectionHTML()}

        <div class="start-bar">
          <div class="inner">
            <span class="summary"><b>${MODES[settings.mode].label}</b> · ${DIFF[settings.difficulty].label} ·
              ${ANIMALS.filter(a => settings.cats.includes(a.cat)).length} dieren in je selectie</span>
            <button class="btn btn-lg" data-act="start" ${settings.cats.length ? "" : "disabled"}>Start ${MODES[settings.mode].label.toLowerCase()} ${icon("arrow")}</button>
          </div>
        </div>

        <footer class="footer">
          Teksten: Nederlandstalige Wikipedia (CC BY-SA) · Foto's: iNaturalist en Wikimedia Commons (maker en licentie bij elke foto) ·
          Kaarten: waarnemingen via GBIF.org
        </footer>
      </div>`;

    bindPwaSection();
    $$("[data-act=start]", view).forEach(b => b.onclick = startGame);
    $("[data-act=guide]", view).onclick = () => go("gids");
    $("[data-act=allcats]", view).onclick = () => {
      settings.cats = settings.cats.length === CATS.length ? [] : CATS.slice();
      saveSettings(); rerenderHome();
    };
    $$("[data-mode]", view).forEach(b => b.onclick = () => { settings.mode = b.dataset.mode; saveSettings(); rerenderHome(); });
    $$("#seg-diff button", view).forEach(b => b.onclick = () => { settings.difficulty = b.dataset.v; saveSettings(); rerenderHome(); });
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

  // ================= Installeren & offline (PWA) =================
  const CAN_CACHE = "caches" in window && "serviceWorker" in navigator && location.protocol !== "file:";
  const IS_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const IS_STANDALONE = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const MEDIA_URLS = [...ANIMALS.map(a => a.img), ...ANIMALS.map(a => a.map).filter(Boolean)];
  let installPrompt = null;
  let offline = { cached: null, busy: false, done: 0 };

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
    return `<section class="section">
      <div class="install-card">
        <img class="install-icon" src="icons/icon-192.png" alt="">
        <div class="install-body">
          <h2>Speel overal, ook offline</h2>
          <p>${how}</p>
          <div class="install-actions">
            <button class="btn" id="btn-install" ${installPrompt ? "" : "hidden"}>${icon("play")} Installeer app</button>
            ${CAN_CACHE ? `<button class="btn btn-secondary" id="btn-offline">${icon("layers")} <span>Alles offline beschikbaar maken</span></button>` : ""}
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

  async function countCached() {
    const keys = await (await caches.open("oq-media")).keys();
    const have = new Set(keys.map(r => new URL(r.url).pathname.split("/").slice(-2).join("/")));
    return MEDIA_URLS.filter(u => have.has(u)).length;
  }

  function showOfflineStatus() {
    const btn = $("#btn-offline");
    if (!btn) return;
    const total = MEDIA_URLS.length, n = offline.busy ? offline.done : offline.cached;
    if (n == null) return;
    $("#dl").hidden = !offline.busy && n === 0;
    $("#dl-bar").style.width = `${(n / total) * 100}%`;
    if (offline.busy) {
      $("#dl-txt").textContent = `Downloaden… ${n} van ${total} bestanden`;
    } else if (n >= total) {
      $("#dl-txt").textContent = "Alles staat offline op dit apparaat.";
      btn.hidden = true;
    } else {
      $("#dl-txt").textContent = `${n} van ${total} foto's en kaarten staan al offline.`;
      $("span", btn).textContent = `Alles offline beschikbaar maken (±${Math.round((total - n) / total * 97)} MB)`;
    }
  }

  async function downloadAll() {
    if (offline.busy) return;
    offline.busy = true;
    const cache = await caches.open("oq-media");
    const have = new Set((await cache.keys()).map(r => new URL(r.url).pathname.split("/").slice(-2).join("/")));
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

  // ================= Quiz =================
  function startGame() {
    const pool = ANIMALS.filter(a => settings.cats.includes(a.cat));
    if (!pool.length) return;
    const n = settings.mode !== "classic" ? pool.length
      : settings.length === "all" ? pool.length : Math.min(+settings.length, pool.length);
    game = {
      mode: settings.mode, difficulty: settings.difficulty, pool,
      questions: shuffle(pool).slice(0, n),
      index: 0, score: 0, streak: 0, bestStreak: 0, correct: 0, asked: 0,
      lives: LIVES, mistakes: [], newFound: [], answered: false,
      endsAt: settings.mode === "time" ? Date.now() + TIME_LIMIT * 1000 : 0,
      startedAt: Date.now(),
    };
    go("quiz");
  }

  function commonSuffix(a, b) {
    a = a.toLowerCase(); b = b.toLowerCase();
    let i = 0;
    while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
    return i;
  }
  function similarity(a, b) {
    const wa = new Set(a.name.toLowerCase().split(/[\s-]+/));
    const shared = b.name.toLowerCase().split(/[\s-]+/).filter(w => w.length > 2 && wa.has(w)).length;
    const suffix = commonSuffix(a.name, b.name);
    const genus = a.sci.split(" ")[0] === b.sci.split(" ")[0] ? 3 : 0;
    return shared * 3 + (suffix >= 3 ? Math.min(suffix, 8) : 0) + genus + (a.cat === b.cat ? 4 : 0);
  }
  function pickDistractors(answer) {
    const others = ANIMALS.filter(a => a !== answer && a.name !== answer.name);
    let picks;
    if (game.difficulty === "easy") {
      picks = shuffle(CATS.filter(c => c !== answer.cat)).slice(0, 3)
        .map(c => pick(others.filter(a => a.cat === c))).filter(Boolean);
    } else if (game.difficulty === "hard") {
      picks = shuffle(shuffle(others).map(a => [similarity(answer, a), a])
        .sort((x, y) => y[0] - x[0]).slice(0, 7).map(x => x[1])).slice(0, 3);
    } else {
      const base = game.pool.length >= 4 ? game.pool : ANIMALS;
      picks = shuffle(base.filter(a => a !== answer && a.name !== answer.name)).slice(0, 3);
    }
    while (picks.length < 3) {
      const extra = pick(others);
      if (!picks.includes(extra)) picks.push(extra);
    }
    return picks;
  }

  function quizHeader() {
    const g = game;
    let progress, right;
    if (g.mode === "time") {
      progress = `<div class="progress timer" aria-label="Resterende tijd"><i id="timer-bar"></i></div>`;
      right = `<span class="quiz-stat" id="timer-txt">${icon("clock")} ${TIME_LIMIT}s</span>`;
    } else if (g.mode === "survival") {
      progress = `<div class="progress"><i style="width:${Math.min(100, g.correct / Math.max(10, g.correct + 3) * 100)}%"></i></div>`;
      right = `<span class="hearts" aria-label="${g.lives} levens">${Array.from({ length: LIVES }, (_, i) =>
        icon("heart", i < g.lives ? "" : "lost")).join("")}</span>`;
    } else {
      progress = `<div class="progress" aria-label="Voortgang"><i style="width:${(g.index / g.questions.length) * 100}%"></i></div>`;
      right = `<span class="quiz-stat" style="color:var(--text-3)">${g.index + 1}/${g.questions.length}</span>`;
    }
    return `<div class="quiz-top">
      <button class="icon-btn" data-act="quit" aria-label="Stoppen">${icon("x")}</button>
      ${progress}
      <span class="quiz-stat streak" title="Reeks" ${g.streak < 2 ? 'style="opacity:.35"' : ""}>${icon("flame")} ${g.streak}</span>
      <span class="quiz-stat" title="Punten">${icon("star")} ${fmt(g.score)}</span>
      ${right}
    </div>`;
  }

  function renderQuestion() {
    const g = game;
    if (g.index >= g.questions.length) return endGame();
    const q = g.current = g.questions[g.index];
    g.answered = false;
    g.options = shuffle([q, ...pickDistractors(q)]);
    const showCat = g.difficulty !== "hard";

    view.innerHTML = `
      <div class="container">
        ${quizHeader()}
        <div class="quiz-grid">
          <div>
            <div class="photo-card">
              <div class="blur" style="background-image:url('${q.img}')"></div>
              <img class="main" src="${q.img}" alt="Foto van het dier dat je moet raden">
              ${showCat ? `<span class="chip">${esc(q.cat)}</span>` : ""}
              <a class="photo-credit" href="${esc(q.credit.url)}" target="_blank" rel="noopener" title="Foto: ${esc(q.credit.by)} (${esc(q.credit.license)}) via ${esc(q.credit.source)}">
                ${icon("camera")} ${esc(q.credit.by)}</a>
            </div>
          </div>
          <div id="q-side">
            <h2 class="q-title">Welk dier is dit?</h2>
            <p class="q-sub">${showCat ? `Een dier uit de groep <b>${esc(q.cat.toLowerCase())}</b>.` : "Moeilijk niveau: geen hints."}</p>
            <div class="answers" role="group" aria-label="Antwoorden">
              ${g.options.map((o, i) => `<button class="answer" data-i="${i}">
                <span class="key">${i + 1}</span><span>${esc(o.name)}</span>
                <span class="state">${icon(o === q ? "check" : "x")}</span></button>`).join("")}
            </div>
            <p class="kbd-hint">Tip: gebruik <kbd>1</kbd>–<kbd>4</kbd> om te kiezen en <kbd>Enter</kbd> om door te gaan.</p>
            <div id="q-info"></div>
          </div>
        </div>
      </div>`;

    $("[data-act=quit]", view).onclick = () => {
      if (g.asked && !confirm("Weet je zeker dat je wilt stoppen? Je voortgang in dit spel gaat verloren.")) return;
      game = null; go("home");
    };
    $$(".answer", view).forEach(b => b.onclick = () => answer(+b.dataset.i));
    const next = g.questions[g.index + 1];
    if (next) new Image().src = next.img;
    if (g.mode === "time") startTimer();
  }

  function answer(i) {
    const g = game;
    if (!g || g.answered) return;
    g.answered = true;
    g.asked++;
    const q = g.current, chosen = g.options[i], ok = chosen === q;
    $$(".answer", view).forEach((b, j) => {
      b.disabled = true;
      if (g.options[j] === q) b.classList.add("correct");
      else if (j === i) b.classList.add("wrong");
      else b.classList.add("dim");
    });

    let pts = 0;
    if (ok) {
      g.correct++; g.streak++;
      g.bestStreak = Math.max(g.bestStreak, g.streak);
      pts = Math.round(100 * DIFF[g.difficulty].mult) + 10 * Math.min(g.streak - 1, 10);
      g.score += pts;
      if (!found.has(q.id)) { found.add(q.id); g.newFound.push(q.id); saveFound(); }
    } else {
      g.streak = 0;
      g.mistakes.push(q.id);
      if (g.mode === "survival") g.lives--;
    }
    // kopregel bijwerken (score, reeks, levens)
    const top = $(".quiz-top", view);
    const timerWidth = $("#timer-bar") && $("#timer-bar").style.width;
    top.outerHTML = quizHeader();
    $("[data-act=quit]", view).onclick = () => { if (confirm("Stoppen met dit spel?")) { game = null; go("home"); } };
    if (timerWidth) $("#timer-bar").style.width = timerWidth;

    if (g.mode === "time") {
      setTimeout(() => { if (game === g && Date.now() < g.endsAt) { g.index++; renderQuestion(); } }, ok ? 450 : 900);
      return;
    }

    const isLast = g.mode === "survival" ? g.lives <= 0 || g.index + 1 >= g.questions.length : g.index + 1 >= g.questions.length;
    $("#q-info").innerHTML = infoHTML(q);
    $(".kbd-hint", view).hidden = true;
    const praise = pick(["Goed zo!", "Helemaal goed!", "Uitstekend!", "Raak!", "Knap gedaan!"]);
    showFeedback(ok,
      ok ? `${praise} +${pts}` : (g.mode === "survival" && g.lives <= 0 ? "Je levens zijn op!" : "Helaas, niet goed"),
      ok ? (g.newFound.includes(q.id) ? `Nieuw in je collectie: ${q.name}` : q.name)
         : `Het juiste antwoord is: ${q.name}`,
      isLast ? "Bekijk resultaat" : "Doorgaan");
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
    const key = `${g.mode}-${g.difficulty}`;
    const all = store.get("oq3-scores", {});
    const list = all[key] || [];
    const prevBest = list[0] ? list[0].score : 0;
    list.push({ score: g.score, correct: g.correct, total: g.asked, date: new Date().toLocaleDateString("nl-NL") });
    list.sort((a, b) => b.score - a.score);
    all[key] = list.slice(0, 5);
    store.set("oq3-scores", all);
    resultData = { ...g, record: g.score > prevBest && g.score > 0, seconds: Math.round((Date.now() - g.startedAt) / 1000) };
    game = null;
    go("resultaat");
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

    view.innerHTML = `
      <div class="container">
        <div class="result">
          <div class="result-card">
            ${r.record ? `<span class="badge-record">${icon("trophy")} Nieuw record!</span>` : ""}
            <div class="ring-big">${ring(ratio, 170, 14, color).replace('class="ring"', "")}
              <div class="val"><b>${Math.round(ratio * 100)}%</b><span>goed</span></div></div>
            <h1>${title}</h1>
            <p class="lead">${MODES[r.mode].label} · ${DIFF[r.difficulty].label}</p>
            <div class="stat-grid">
              <div class="stat"><b>${fmt(r.score)}</b><span>punten</span></div>
              <div class="stat"><b>${r.correct}/${r.asked}</b><span>goed beantwoord</span></div>
              <div class="stat"><b>${r.bestStreak}</b><span>langste reeks</span></div>
              <div class="stat"><b>${r.mode === "time" ? `${TIME_LIMIT}s` : `${mm}:${ss}`}</b><span>speeltijd</span></div>
            </div>
            <div class="result-actions">
              <button class="btn btn-lg" data-act="again">${icon("rotate")} Nog een keer</button>
              <button class="btn btn-secondary" data-act="home">Terug naar start</button>
            </div>
          </div>
          <div>
            ${newOnes.length ? `<section class="review">
              <h2>Nieuw in je collectie <span style="color:var(--success)">+${newOnes.length}</span></h2>
              <p>Deze dieren heb je voor het eerst goed geraden.</p>
              <div class="grid">${newOnes.map(cardHTML).join("")}</div></section>` : ""}
            <section class="review">
              <h2>${mistakes.length ? "Om nog eens te bekijken" : "Geen fouten!"}</h2>
              <p>${mistakes.length ? "Klik op een dier om te lezen hoe je het herkent." : "Je had alles goed. Probeer eens een hoger niveau."}</p>
              ${mistakes.length ? `<div class="grid">${mistakes.map(cardHTML).join("")}</div>` : ""}
            </section>
          </div>
        </div>
      </div>`;
    $("[data-act=again]", view).onclick = startGame;
    $("[data-act=home]", view).onclick = () => go("home");
    bindCards(view, [...newOnes, ...mistakes]);
  }

  // ================= Dierinformatie (gedeeld) =================
  function infoHTML(a) {
    const facts = a.facts.length
      ? `<ul class="facts">${a.facts.map((f, i) => `<li><span class="num">${i + 1}</span><span>${esc(f)}</span></li>`).join("")}</ul>`
      : "";
    const map = a.map
      ? `<div class="map"><img src="${a.map}" alt="Kaart met waarnemingen van ${esc(a.name)}" loading="lazy"></div>
         <div class="map-legend"><span class="swatch"><span class="grad"></span> weinig → veel waarnemingen</span>
         <span>${fmt(a.obs)} waarnemingen · bron: <a href="https://www.gbif.org/species/search?q=${encodeURIComponent(a.sci)}" target="_blank" rel="noopener">GBIF</a></span></div>`
      : `<div class="map map-empty">Geen waarnemingen beschikbaar</div>`;
    return `<div class="info">
      <div class="info-head">
        <h3 id="d-title">${esc(a.name)}</h3>
        <div class="sci">${esc(a.sci)}</div>
        <div class="info-meta">
          <span class="chip soft">${icon("layers")} ${esc(a.cat)}</span>
          ${a.obs ? `<span class="chip soft">${icon("eye")} ${fmt(a.obs)} waarnemingen</span>` : ""}
          ${found.has(a.id) ? `<span class="chip soft" style="color:var(--success)">${icon("check")} Ontdekt</span>` : ""}
        </div>
      </div>
      <section class="info-sec">
        <h4>${icon("bulb")} Wist je dat?</h4>
        <p>${esc(a.intro)}</p>${facts}
        <a class="more-link" href="${esc(a.wiki)}" target="_blank" rel="noopener">Lees verder op Wikipedia ${icon("external")}</a>
      </section>
      <section class="info-sec">
        <h4>${icon("map")} Waar komt dit dier voor?</h4>
        ${map}
      </section>
      <p class="info-credit">${icon("camera")} Foto: <a href="${esc(a.credit.url)}" target="_blank" rel="noopener">${esc(a.credit.by)}</a>
        · ${esc(a.credit.license)} · ${esc(a.credit.source)}</p>
    </div>`;
  }

  function cardHTML(a) {
    return `<button class="card" data-id="${a.id}">
      <span class="thumb"><img src="${a.img}" alt="" loading="lazy">
        ${found.has(a.id) ? `<span class="found" title="Ontdekt">${icon("check")}</span>` : ""}</span>
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
      .filter(a => guide.show === "all" || (guide.show === "found") === found.has(a.id))
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
          <div><h1>Dierengids</h1><p>Alle ${ANIMALS.length} zeedieren uit de quiz, met feitjes en verspreidingskaarten.</p></div>
        </div>
        <div class="toolbar">
          <div class="toolbar-row">
            <label class="search">${icon("search")}<input type="search" id="g-search" placeholder="Zoek op naam of wetenschappelijke naam…" value="${esc(guide.q)}" aria-label="Zoeken"></label>
            <select class="sel" id="g-show" aria-label="Filter op ontdekt">
              <option value="all">Alle dieren</option><option value="found">Ontdekt</option><option value="todo">Nog niet ontdekt</option>
            </select>
            <select class="sel" id="g-sort" aria-label="Sorteren">
              <option value="name">Naam A–Z</option><option value="cat">Diergroep</option><option value="obs">Meest waargenomen</option>
            </select>
          </div>
          <div class="filter-chips" id="g-cats">
            ${[null, ...CATS].map(c => `<button class="fchip ${guide.cat === c ? "on" : ""}" data-c="${c ? esc(c) : ""}">${c ? esc(c) : "Alles"}
              <small>${c ? ANIMALS.filter(a => a.cat === c).length : ANIMALS.length}</small></button>`).join("")}
          </div>
        </div>
        <p class="count-line" id="g-count"></p>
        <div class="grid" id="g-grid"></div>
      </div>`;
    $("#g-show").value = guide.show;
    $("#g-sort").value = guide.sort;
    $("#g-search").oninput = e => { guide.q = e.target.value; fillGuide(); };
    $("#g-show").onchange = e => { guide.show = e.target.value; fillGuide(); };
    $("#g-sort").onchange = e => { guide.sort = e.target.value; fillGuide(); };
    $$("#g-cats .fchip").forEach(b => b.onclick = () => {
      guide.cat = b.dataset.c || null;
      $$("#g-cats .fchip").forEach(x => x.classList.toggle("on", x === b));
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

  // ================= Detailblad =================
  const dlg = $("#detail");
  let detailList = [], detailIndex = 0;

  function openDetail(a, list) {
    detailList = list && list.length ? list : [a];
    detailIndex = Math.max(0, detailList.indexOf(a));
    fillDetail();
    if (!dlg.open) dlg.showModal();
  }
  function fillDetail() {
    const a = detailList[detailIndex];
    const multi = detailList.length > 1;
    dlg.innerHTML = `
      <div class="sheet-photo">
        <div class="blur" style="background-image:url('${a.img}')"></div>
        <img src="${a.img}" alt="${esc(a.name)}">
        <button class="sheet-close" aria-label="Sluiten">${icon("x")}</button>
      </div>
      ${infoHTML(a)}
      ${multi ? `<div class="sheet-nav">
        <button class="btn btn-secondary" data-dir="-1" ${detailIndex === 0 ? "disabled" : ""}>${icon("left")} Vorige</button>
        <button class="btn btn-secondary" data-dir="1" ${detailIndex === detailList.length - 1 ? "disabled" : ""}>Volgende ${icon("right")}</button>
      </div>` : ""}`;
    $(".sheet-close", dlg).onclick = () => dlg.close();
    $$("[data-dir]", dlg).forEach(b => b.onclick = () => step(+b.dataset.dir));
    dlg.scrollTop = 0;
  }
  function step(dir) {
    const i = detailIndex + dir;
    if (i < 0 || i >= detailList.length) return;
    detailIndex = i;
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
    if (!game || e.target.matches("input, select, textarea")) return;
    if (/^[1-4]$/.test(e.key) && !game.answered) answer(+e.key - 1);
    else if (e.key === "Enter" && game.answered && game.mode !== "time") { e.preventDefault(); next(); }
  });

  // ================= Start =================
  if (!ANIMALS.length) {
    view.innerHTML = `<div class="container"><p style="padding:40px 0">Geen data gevonden. Draai eerst <code>python scraper/scrape.py</code>.</p></div>`;
    return;
  }
  render();
})();
