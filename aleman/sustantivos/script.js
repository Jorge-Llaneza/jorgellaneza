(() => {
  "use strict";

  const STORE_KEY = "substantive-v1";
  const ROUND_LEN = 12;
  const DAILY_GOAL = 100;
  const MAX_M = 5;           // aciertos para dominar una carta
  const MC_CAP = 2;          // con opciones no se pasa de aquí; luego toca escribir
  const BLITZ_SECS = 60;
  const SURVIVAL_START = 20;
  const SURVIVAL_MIN = 7;
  const PORTS = [
    "Emden", "Borkum", "Norderney", "Wangerooge", "Bremerhaven", "Cuxhaven", "Helgoland", "Hamburg", "Amrum",
    "Föhr", "Sylt", "Kiel", "Fehmarn", "Lübeck", "Warnemünde", "Stralsund", "Hiddensee", "Rügen",
  ];
  const DIRS = ["esde", "dees", "genus"];
  const DIR_LABEL = { esde: "Español → Deutsch", dees: "Deutsch → Español", genus: "der, die o das" };
  const DIR_SHORT = { esde: "ES → DE", dees: "DE → ES", genus: "GÉNERO" };
  const MODE_LABEL = { train: "Training", review: "Repaso", blitz: "Sturmflut", survival: "Seenot" };
  const ARTS = ["der", "die", "das"];
  const SHORT_ART = { r: "der", e: "die", s: "das" }; // la notación de tus apuntes: r Ort, e Insel, s Meer

  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NOUNS = SUSTANTIVOS;

  // ---------------------------------------------------------------- estado persistente
  // La maestría se guarda por palabra ("Ort:genus"), no por posición, para poder
  // añadir o reordenar sustantivos sin que el progreso se descoloque.
  const defaults = () => ({
    xp: 0, mastery: {}, ach: {}, streak: 0, lastDay: null, todayDate: null, todayXp: 0,
    best: { blitz: 0, survival: 0 }, typedCorrect: 0, umlautCorrect: 0, articleCorrect: 0,
    sound: true, voice: true, dir: "esde",
  });
  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = Object.assign(defaults(), JSON.parse(raw));
        s.best = Object.assign(defaults().best, s.best);
        return s;
      }
    } catch (e) { /* almacenamiento no disponible */ }
    return defaults();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignorar */ }
  }

  // ---------------------------------------------------------------- niveles y días
  const levelNeed = (n) => 80 + 40 * (n - 1);
  function levelInfo(xp) {
    let lvl = 1, base = 0;
    while (lvl < PORTS.length && xp >= base + levelNeed(lvl)) { base += levelNeed(lvl); lvl++; }
    const need = lvl < PORTS.length ? levelNeed(lvl) : null;
    return { lvl, into: xp - base, need, port: PORTS[lvl - 1] };
  }

  function dayKey(d = new Date()) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); }
  function rollDay() { const t = dayKey(); if (S.todayDate !== t) { S.todayDate = t; S.todayXp = 0; } }
  function touchStreak() {
    const t = dayKey();
    if (S.lastDay === t) return;
    S.streak = S.lastDay === yesterdayKey() ? S.streak + 1 : 1;
    S.lastDay = t;
  }
  function liveStreak() { return S.lastDay === dayKey() || S.lastDay === yesterdayKey() ? S.streak : 0; }

  // ---------------------------------------------------------------- comparación de respuestas
  function foldDe(s) {
    return s.toLowerCase()
      .replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z]/g, "");
  }
  function stripDe(s) {
    return s.toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
  }
  // Español: sin acentos ni mayúsculas y sin artículo delante ("el pasado" = "pasado").
  function foldEs(s) {
    return s.toLowerCase().replace(/ñ/g, "n~").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/n~/g, "ñ")
      .trim().replace(/^(el|la|los|las|lo|un|una|unos|unas)\s+/, "")
      .replace(/[^a-zñ]/g, "");
  }
  function lev(a, b) {
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }
  const tolerance = (t) => (t.length >= 11 ? 2 : t.length >= 4 ? 1 : 0);
  const esParts = (n) => n.es.split(/[\/,]/).map((x) => x.trim()).filter(Boolean);
  const esOk = (n) => [...new Set([...esParts(n), ...n.ok].map(foldEs))];
  const sharesOk = (a, b) => esOk(a).some((x) => esOk(b).includes(x));
  const full = (n) => `${n.art} ${n.de}`;

  // "der Ort", "r Ort", "Ort", "DER ort"...
  function splitArticle(input) {
    const m = input.trim().match(/^(der|die|das|r|e|s)\s+(.+)$/i);
    if (!m) return { art: null, word: input.trim() };
    const a = m[1].toLowerCase();
    return { art: SHORT_ART[a] || a, word: m[2].trim() };
  }

  function checkDe(input, noun) {
    const { art, word } = splitArticle(input);
    const a = foldDe(word);
    if (!a) return { kind: "empty" };
    const t = foldDe(noun.de);
    const lower = word[0] && word[0] === word[0].toLowerCase() && word[0] !== word[0].toUpperCase();
    let match = null;
    if (a === t) match = "exact";
    else {
      const other = NOUNS.find((n) => n !== noun && foldDe(n.de) === a);
      if (other) return { kind: sharesOk(other, noun) ? "synonym" : "wrong", other };
      if (lev(a, t) <= tolerance(t)) match = "typo";
    }
    if (!match) return { kind: "wrong" };
    const umlaut = match === "typo" && /[äöüß]/.test(noun.de) && stripDe(word) === stripDe(noun.de);
    if (!art) return { kind: "noart", typo: match === "typo", umlaut, lower };
    if (art !== noun.art) return { kind: "wrongart", art, lower };
    return { kind: match, umlaut, lower, art: true };
  }
  function checkEs(input, noun) {
    const a = foldEs(input);
    if (!a) return { kind: "empty" };
    const opts = esOk(noun);
    if (opts.includes(a)) return { kind: "exact" };
    const other = NOUNS.find((n) => n !== noun && esOk(n).includes(a));
    if (!other && opts.some((o) => lev(a, o) <= tolerance(o))) return { kind: "typo" };
    return { kind: "wrong", other };
  }

  // ---------------------------------------------------------------- maestría por carta
  const cardKey = (c) => NOUNS[c.i].de + ":" + c.dir;
  function getM(c) { const st = S.mastery[cardKey(c)]; return st ? st.m : 0; }
  function setM(c, m) { S.mastery[cardKey(c)] = { m: Math.max(0, Math.min(MAX_M, m)), t: Date.now() }; }

  // Muestreo ponderado sin reemplazo: lo menos dominado y lo que hace más que no ves sale antes.
  function pickCards(dirs, n, avoid = []) {
    const pool = [];
    NOUNS.forEach((_, i) => dirs.forEach((dir) => pool.push({ i, dir })));
    const scored = pool.map((c) => {
      const st = S.mastery[cardKey(c)];
      const m = st ? st.m : 0;
      const ageH = st ? (Date.now() - st.t) / 36e5 : 48;
      const w = (MAX_M + 1 - m) ** 2 + Math.min(ageH, 48) / 6;
      return { c, k: Math.random() ** (1 / w) };
    }).sort((a, b) => b.k - a.k);
    const used = new Set(avoid);
    const out = [];
    for (const { c } of scored) {
      if (used.has(c.i)) continue;
      used.add(c.i);
      out.push(c);
      if (out.length === n) break;
    }
    return out;
  }

  // ---------------------------------------------------------------- sonido y voz
  let ac = null;
  function audio() {
    if (!S.sound) return null;
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  function tone(freq, start, dur, type = "triangle", vol = 0.14) {
    const c = audio();
    if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    const t = c.currentTime + start;
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }
  const SFX = {
    good(combo) { const b = 494 * Math.pow(2, Math.min(combo, 12) / 12); tone(b, 0, 0.12); tone(b * 1.5, 0.07, 0.2); },
    meh() { tone(440, 0, 0.12); tone(415, 0.09, 0.18); },
    bad() { tone(196, 0, 0.22, "sawtooth", 0.06); tone(147, 0.1, 0.32, "sawtooth", 0.06); },
    tick() { tone(1100, 0, 0.04, "square", 0.03); },
    mult() { [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.05, 0.14, "square", 0.05)); },
    // bocina de barco al llegar a puerto
    level() { tone(98, 0, 0.9, "sawtooth", 0.07); tone(147, 0, 0.9, "sawtooth", 0.05); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5 + i * 0.1, 0.3, "triangle", 0.1)); },
    ach() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.22, "triangle", 0.12)); },
    end() { [392, 523, 659].forEach((f, i) => tone(f, i * 0.12, 0.35)); },
  };

  let deVoice = null;
  function findVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    deVoice = vs.find((v) => /^de[-_]DE/i.test(v.lang)) || vs.find((v) => /^de/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in window) { findVoice(); speechSynthesis.onvoiceschanged = findVoice; }
  function speak(text, force = false) {
    if ((!S.voice && !force) || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE";
      if (deVoice) u.voice = deVoice;
      u.rate = 0.9;
      speechSynthesis.speak(u);
    } catch (e) { /* sin voz */ }
  }

  // ---------------------------------------------------------------- efectos visuales
  function toast(title, sub, icon = "★") {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="toast-icon"></span><div><b></b><small></small></div>`;
    el.querySelector(".toast-icon").textContent = icon;
    el.querySelector("b").textContent = title;
    el.querySelector("small").textContent = sub;
    $("toasts").appendChild(el);
    setTimeout(() => el.remove(), 3700);
  }
  function floatText(text, big = false) {
    if (reduceMotion) return;
    const el = document.createElement("span");
    el.className = "float" + (big ? " big" : "");
    el.textContent = text;
    $("float-layer").appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
  function confetti(amount = 140) {
    if (reduceMotion) return;
    const cv = $("confetti");
    const ctx = cv.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ["#4c8dff", "#ff5a5f", "#3ccf8e", "#f2c46d", "#f4efe4"];
    const parts = Array.from({ length: amount }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 15 - 5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 10,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    const t0 = performance.now();
    (function frame(now) {
      const t = now - t0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.vy += 0.45; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t / 2200);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
        ctx.restore();
      }
      if (t < 2200) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }
  function restartAnim(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // ---------------------------------------------------------------- logros
  const allMastered = (dir) => NOUNS.every((_, i) => getM({ i, dir }) >= MAX_M);
  const ACHIEVEMENTS = [
    { id: "first", icon: "1", name: "Leinen los", desc: "Tu primer acierto.", test: (r) => r && r.correct >= 1 },
    { id: "combo10", icon: "10", name: "Rückenwind", desc: "10 aciertos seguidos.", test: (r) => r && r.bestCombo >= 10 },
    { id: "combo29", icon: "29", name: "Volle Kraft voraus", desc: "29 aciertos seguidos, uno por sustantivo.", test: (r) => r && r.bestCombo >= 29 },
    { id: "flawless", icon: "0", name: "Spiegelglatt", desc: "Training de 12 sin un solo fallo.", test: (r, end) => end && r.mode === "train" && r.wrong === 0 && r.correct >= ROUND_LEN },
    { id: "blitz20", icon: "S", name: "Sturmfest", desc: "20 géneros en una Sturmflut.", test: (r) => r && r.mode === "blitz" && r.correct >= 20 },
    { id: "blitz35", icon: "S+", name: "Orkan", desc: "35 géneros en una Sturmflut.", test: (r) => r && r.mode === "blitz" && r.correct >= 35 },
    { id: "survive10", icon: "R", name: "Rettungsring", desc: "10 aciertos en Seenot.", test: (r) => r && r.mode === "survival" && r.correct >= 10 },
    { id: "survive25", icon: "R+", name: "Unsinkbar", desc: "25 aciertos en Seenot.", test: (r) => r && r.mode === "survival" && r.correct >= 25 },
    { id: "article", icon: "A", name: "Artikel-Profi", desc: "25 respuestas escritas con el artículo correcto.", test: () => S.articleCorrect >= 25 },
    { id: "umlaut", icon: "Ä", name: "Pünktchen", desc: "10 respuestas exactas escribiendo ä, ö, ü o ß.", test: () => S.umlautCorrect >= 10 },
    { id: "goal", icon: "✓", name: "Tagesziel", desc: `Gana ${DAILY_GOAL} XP en un día.`, test: () => S.todayXp >= DAILY_GOAL },
    { id: "streak3", icon: "3", name: "Dranbleiben", desc: "Racha de 3 días.", test: () => liveStreak() >= 3 },
    { id: "streak7", icon: "7", name: "Eine Woche", desc: "Racha de 7 días.", test: () => liveStreak() >= 7 },
    { id: "half", icon: "½", name: "Halbe Strecke", desc: "Llega a Amrum, la mitad de la ruta.", test: () => levelInfo(S.xp).lvl >= 9 },
    { id: "end", icon: "⚓", name: "Angekommen", desc: "Llega a Rügen.", test: () => levelInfo(S.xp).lvl >= PORTS.length },
    { id: "esde", icon: "DE", name: "Dolmetscher", desc: "Domina los 29 sustantivos de español a alemán.", test: () => allMastered("esde") },
    { id: "dees", icon: "ES", name: "Übersetzer", desc: "Domina los 29 sustantivos de alemán a español.", test: () => allMastered("dees") },
    { id: "genus", icon: "G", name: "Genus-Genie", desc: "Domina el género de los 29 sustantivos.", test: () => allMastered("genus") },
  ];
  function checkAchievements(end = false) {
    for (const a of ACHIEVEMENTS) {
      if (S.ach[a.id]) continue;
      let ok = false;
      try { ok = a.test(R, end); } catch (e) { ok = false; }
      if (ok) {
        S.ach[a.id] = dayKey();
        if (R) R.newAch.push(a);
        toast(a.name, a.desc, a.icon);
        SFX.ach();
      }
    }
  }

  // ---------------------------------------------------------------- XP
  function addXp(pts) {
    if (pts <= 0) return;
    rollDay();
    const before = levelInfo(S.xp).lvl;
    const goalBefore = S.todayXp >= DAILY_GOAL;
    S.xp += pts;
    S.todayXp += pts;
    touchStreak();
    if (R) R.xp += pts;
    const after = levelInfo(S.xp);
    if (after.lvl > before) {
      toast(`Nivel ${after.lvl}: ${after.port}`, "Nuevo puerto en la ruta", String(after.lvl));
      SFX.level();
      confetti();
    }
    if (!goalBefore && S.todayXp >= DAILY_GOAL && S.ach.goal) {
      toast("Objetivo diario cumplido", `${DAILY_GOAL} XP hoy. La racha sigue viva.`, "✓");
    }
    renderTopbar();
  }

  // ---------------------------------------------------------------- top bar y home
  function renderTopbar() {
    const L = levelInfo(S.xp);
    $("lvl-num").textContent = L.lvl;
    $("lvl-port").textContent = L.port;
    $("xp-fill").style.width = (L.need ? (L.into / L.need) * 100 : 100) + "%";
    $("xp-label").textContent = L.need ? `${L.into} / ${L.need} XP` : `${S.xp} XP · fin de ruta`;
    const st = liveStreak();
    $("streak-num").textContent = st;
    $("streak-chip").classList.toggle("lit", S.lastDay === dayKey());
    $("streak-chip").title = st ? `Racha de ${st} día${st === 1 ? "" : "s"}` : "Juega hoy para empezar una racha";
    const today = S.todayDate === dayKey() ? S.todayXp : 0;
    $("goal-num").textContent = `${Math.min(today, DAILY_GOAL)}/${DAILY_GOAL}`;
    $("goal-ring").style.strokeDashoffset = 88 - 88 * Math.min(1, today / DAILY_GOAL);
    $("goal-chip").classList.toggle("done", today >= DAILY_GOAL);
    $("btn-sound").setAttribute("aria-pressed", String(S.sound));
    $("btn-voice").setAttribute("aria-pressed", String(S.voice));
  }

  const trainDirs = () => (S.dir === "mix" ? DIRS : [S.dir]);

  function renderHome() {
    renderTopbar();

    document.querySelectorAll("#dir-seg button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.dir === S.dir)));
    const dirs = trainDirs();
    const total = NOUNS.length * dirs.length;
    const done = NOUNS.reduce((n, _, i) => n + dirs.filter((dir) => getM({ i, dir }) >= MAX_M).length, 0);
    const fresh = NOUNS.reduce((n, _, i) => n + dirs.filter((dir) => getM({ i, dir }) === 0).length, 0);
    $("train-sub").textContent = done === total
      ? `${ROUND_LEN} preguntas · todo dominado, a mantenerlo`
      : fresh === total
        ? (S.dir === "genus" ? `${ROUND_LEN} preguntas · der, die o das` : `${ROUND_LEN} preguntas · empiezas con opciones, acabas escribiendo`)
        : `${ROUND_LEN} preguntas · ${done}/${total} dominadas`;

    $("rec-blitz").textContent = `Récord ${S.best.blitz}`;
    $("rec-survival").textContent = `Récord ${S.best.survival}`;

    // ruta
    const L = levelInfo(S.xp);
    const route = $("route");
    route.innerHTML = "";
    PORTS.forEach((port, idx) => {
      const li = document.createElement("li");
      const n = idx + 1;
      if (n < L.lvl) li.className = "passed";
      if (n === L.lvl) li.className = "here";
      // las etiquetas de los extremos se ocultan si el puerto actual está pegado a ellas
      if ((n === 1 && L.lvl > 1 && L.lvl <= 5) || (n === PORTS.length && L.lvl < PORTS.length && L.lvl >= PORTS.length - 4)) li.classList.add("crowded");
      li.title = `${n}. ${port}`;
      li.innerHTML = `<span class="dot"></span><span class="port"></span>`;
      li.querySelector(".port").textContent = port;
      route.appendChild(li);
    });
    const frac = L.need ? L.into / L.need : 0;
    route.style.setProperty("--progress", ((L.lvl - 1 + frac) / (PORTS.length - 1)).toFixed(4));
    const rt = $("route-text");
    rt.innerHTML = L.need
      ? `Atracado en <b></b>. Faltan <b></b> XP para <b></b>.`
      : `Has llegado a <b></b>. Ruta completa con <b></b> XP.`;
    const bs = rt.querySelectorAll("b");
    if (L.need) { bs[0].textContent = L.port; bs[1].textContent = L.need - L.into; bs[2].textContent = PORTS[L.lvl]; }
    else { bs[0].textContent = L.port; bs[1].textContent = S.xp; }

    // colección: el color del artículo se descubre al acertar el género
    const col = $("collection");
    col.innerHTML = "";
    NOUNS.forEach((n, i) => {
      const ms = DIRS.map((dir) => getM({ i, dir }));
      const known = ms[2] >= 1;
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile" + (ms.every((m) => m >= MAX_M) ? " gold" : ms.every((m) => m === 0) ? " fresh" : "") + (n.de.length > 13 ? " long" : "");
      if (known) tile.dataset.g = n.art;
      tile.innerHTML = `<span class="tile-de"><span class="tile-art"></span><span class="tile-word" lang="de"></span></span><span class="tile-tr"></span><span class="meters"></span>`;
      tile.querySelector(".tile-art").textContent = known ? n.art : "···";
      tile.querySelector(".tile-word").textContent = n.hy || n.de;
      tile.querySelector(".tile-tr").textContent = n.es;
      const meters = tile.querySelector(".meters");
      DIRS.forEach((dir, k) => {
        const m = document.createElement("span");
        m.className = "meter " + dir;
        m.innerHTML = Array.from({ length: MAX_M }, (_, j) => `<i class="${j < ms[k] ? "on" : ""}"></i>`).join("");
        meters.appendChild(m);
      });
      tile.setAttribute("aria-label", `${known ? n.art + " " : ""}${n.de}: ${n.es}. Dominio ${ms.join(", ")} de ${MAX_M}`);
      tile.addEventListener("click", () => speak(full(n), true));
      col.appendChild(tile);
    });

    const list = $("ach-list");
    list.innerHTML = "";
    ACHIEVEMENTS.forEach((a) => list.appendChild(achItem(a, !!S.ach[a.id])));
    $("ach-count").textContent = `${Object.keys(S.ach).filter((k) => ACHIEVEMENTS.some((a) => a.id === k)).length}/${ACHIEVEMENTS.length}`;
  }

  function achItem(a, got) {
    const li = document.createElement("li");
    li.className = "ach" + (got ? " got" : "");
    li.innerHTML = `<span class="ach-badge"></span><div><div class="ach-name"></div><div class="ach-desc"></div></div>`;
    li.querySelector(".ach-badge").textContent = a.icon;
    li.querySelector(".ach-name").textContent = a.name;
    li.querySelector(".ach-desc").textContent = a.desc;
    return li;
  }

  function show(name) {
    document.querySelectorAll(".screen").forEach((s) => (s.dataset.active = String(s.id === "screen-" + name)));
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------- ronda
  let R = null;
  let Q = null;
  let timerId = null;
  let advanceId = null;
  let shownLives = 3;

  function startRound(mode, cards) {
    const dirs = mode === "blitz" ? ["genus"] : mode === "survival" ? ["esde", "dees"] : trainDirs();
    R = {
      mode, dirs,
      queue: cards ? cards.map((c) => ({ ...c, retries: 0 }))
        : mode === "train" ? pickCards(dirs, ROUND_LEN).map((c) => ({ ...c, retries: 0 })) : [],
      done: 0, correct: 0, wrong: 0, score: 0, xp: 0, combo: 0, bestCombo: 0,
      lives: 3, mistakes: [], newAch: [], recent: [],
      startLvl: levelInfo(S.xp).lvl,
      deadline: mode === "blitz" ? performance.now() + BLITZ_SECS * 1000 : 0,
      qLimit: SURVIVAL_START,
      over: false,
    };
    $("hud-mode").textContent = MODE_LABEL[mode];
    $("hud-score").textContent = "0";
    $("hud-status").innerHTML = "";
    $("combo").hidden = true;
    shownLives = 3;
    show("play");
    clearInterval(timerId);
    if (mode === "blitz" || mode === "survival") timerId = setInterval(tickTimer, 100);
    nextQuestion();
  }

  function nextQuestion() {
    clearTimeout(advanceId);
    if (!R || R.over) return;
    let card;
    if (R.mode === "blitz" || R.mode === "survival") {
      card = pickCards(R.dirs, 1, R.recent)[0];
      R.recent.push(card.i);
      if (R.recent.length > 6) R.recent.shift();
    } else {
      card = R.queue.shift();
      if (!card) return endRound();
    }
    const noun = NOUNS[card.i];
    const type = card.dir === "genus" ? "genus"
      : R.mode === "survival" ? "type"
        : getM(card) < MC_CAP ? "mc" : "type";
    Q = { card, noun, type, hint: 0, answered: false, start: performance.now(), limit: R.qLimit };
    renderQuestion();
  }

  function setTicketWord(withArt) {
    const { noun } = Q;
    const w = $("ticket-word");
    w.innerHTML = "";
    if (withArt) {
      const a = document.createElement("span");
      a.className = "w-art " + noun.art;
      a.textContent = noun.art;
      w.appendChild(a);
    }
    w.appendChild(document.createTextNode(noun.de));
  }

  function renderQuestion() {
    const { card, noun, type } = Q;
    const ticket = $("ticket");
    ticket.dataset.dir = card.dir;
    delete ticket.dataset.reveal;
    ticket.classList.remove("good", "bad");
    $("ticket-dir").textContent = DIR_SHORT[card.dir];
    $("ticket-label").textContent = DIR_LABEL[card.dir];
    if (card.dir === "esde") $("ticket-word").textContent = noun.es;
    else setTicketWord(card.dir === "dees");
    $("ticket-hint").textContent = card.dir === "esde" && type === "type" ? "con artículo: der, die o das" : "";

    $("feedback").hidden = true;
    const choices = $("choices");
    choices.innerHTML = "";
    choices.hidden = type !== "mc";
    $("genders").hidden = type !== "genus";
    $("type-form").hidden = type !== "type";

    if (type === "mc") {
      buildChoices().forEach((opt, k) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "choice";
        b.dataset.key = k + 1;
        b.textContent = opt.label;
        b.addEventListener("click", () => answerChoice(b, opt));
        choices.appendChild(b);
      });
    } else if (type === "genus") {
      document.querySelectorAll(".gbtn").forEach((b, k) => {
        b.disabled = false;
        b.dataset.key = k + 1;
        b.classList.remove("dim", "right", "picked-wrong");
      });
    } else {
      const input = $("answer-input");
      input.value = "";
      input.readOnly = false;
      input.className = "";
      input.placeholder = card.dir === "esde" ? "der Ort" : "en español";
      $("keyrow").hidden = card.dir !== "esde";
      updateArtButtons();
      $("btn-hint").disabled = false;
      $("btn-skip").disabled = false;
      $("btn-check").textContent = "Comprobar";
      input.focus({ preventScroll: true });
    }

    if (card.dir !== "esde") speak(card.dir === "dees" ? full(noun) : noun.de);
    updateHud();
  }

  function buildChoices() {
    const { card, noun } = Q;
    const label = (n) => (card.dir === "esde" ? full(n) : n.es);
    const pool = NOUNS.filter((n) => n !== noun && !sharesOk(n, noun));
    for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const opts = [{ label: label(noun), ok: true }, ...pool.slice(0, 3).map((n) => ({ label: label(n), ok: false, noun: n }))];
    for (let i = opts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [opts[i], opts[j]] = [opts[j], opts[i]]; }
    return opts;
  }

  function answerChoice(btn, opt) {
    if (!Q || Q.answered) return;
    const right = Q.card.dir === "esde" ? full(Q.noun) : Q.noun.es;
    [...$("choices").children].forEach((b) => {
      b.disabled = true;
      if (b.textContent === right) b.classList.add("right");
      else if (b !== btn) b.classList.add("dim");
    });
    if (!opt.ok) btn.classList.add("wrong");
    resolve(opt.ok ? { kind: "exact" } : { kind: "wrong", other: opt.noun }, opt.label);
  }

  function answerGenus(g) {
    if (!Q || Q.answered || Q.type !== "genus") return;
    const ok = g === Q.noun.art;
    document.querySelectorAll(".gbtn").forEach((b) => {
      b.disabled = true;
      if (b.dataset.g === Q.noun.art) b.classList.add("right");
      else if (b.dataset.g === g) b.classList.add("picked-wrong");
      else b.classList.add("dim");
    });
    setTicketWord(true);
    $("ticket").dataset.reveal = Q.noun.art;
    resolve(ok ? { kind: "exact" } : { kind: "wrong", picked: g }, g);
  }

  function submitTyped() {
    if (Q.answered) return nextQuestion();
    const input = $("answer-input");
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const res = Q.card.dir === "esde" ? checkDe(text, Q.noun) : checkEs(text, Q.noun);
    if (res.kind === "empty") return;
    resolve(res, text);
  }

  // Botones der/die/das del teclado: ponen o cambian el artículo al principio.
  function setArticle(art) {
    const input = $("answer-input");
    if (input.readOnly) return;
    const { art: cur, word } = splitArticle(input.value);
    const rest = cur ? word : input.value.trim();
    input.value = cur === art ? rest : `${art} ${rest}`;
    input.setSelectionRange(input.value.length, input.value.length);
    input.focus({ preventScroll: true });
    updateArtButtons();
  }
  function updateArtButtons() {
    const { art } = splitArticle($("answer-input").value);
    document.querySelectorAll(".keyrow .art").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.art === art)));
  }

  const comboMult = (c) => (c >= 10 ? 4 : c >= 6 ? 3 : c >= 3 ? 2 : 1);

  function resolve(res, given) {
    if (Q.answered) return;
    Q.answered = true;
    const { card, noun, type } = Q;
    const elapsed = (performance.now() - Q.start) / 1000;
    const ok = ["exact", "typo", "synonym", "noart"].includes(res.kind);
    const partial = res.kind === "wrongart";
    const prevMult = comboMult(R.combo);
    let pts = 0;

    if (ok) {
      R.combo++;
      R.bestCombo = Math.max(R.bestCombo, R.combo);
      R.correct++;
      const base = type === "genus" ? 6 : type === "mc" ? 5 : card.dir === "esde" ? 12 : 10;
      let f = res.kind === "exact" ? 1 : 0.5;
      if (res.kind === "noart" && res.typo) f = 0.4;
      if (Q.hint) f *= 0.5;
      const mult = comboMult(R.combo);
      const fast = R.mode !== "blitz" && res.kind === "exact" && !Q.hint && elapsed < (type === "genus" ? 2.5 : 5);
      pts = Math.round(base * f) * mult + (fast ? 3 : 0);
      Q.fast = fast;
      if (res.kind === "exact" && !Q.hint) {
        setM(card, type === "mc" ? Math.max(getM(card), Math.min(getM(card) + 1, MC_CAP)) : getM(card) + 1);
        if (type === "type") {
          S.typedCorrect++;
          if (/[äöüß]/i.test(given)) S.umlautCorrect++;
          if (card.dir === "esde") S.articleCorrect++;
        }
      } else {
        setM(card, getM(card));
      }
    } else {
      R.combo = 0;
      R.wrong++;
      if (partial) pts = 4;
      setM(card, getM(card) - (partial ? 1 : 2));
      R.mistakes.push({ card, given: res.kind === "skip" || res.kind === "timeout" ? "" : given });
      if (R.mode === "survival") R.lives--;
      if ((R.mode === "train" || R.mode === "review") && card.retries < 2) {
        R.queue.splice(Math.min(3, R.queue.length), 0, { ...card, retries: card.retries + 1 });
      }
    }
    R.done++;
    R.score += pts;
    addXp(pts);

    const ticket = $("ticket");
    if (type !== "genus") {
      restartAnim(ticket, ok ? "good" : "bad");
    } else if (!ok) {
      restartAnim(ticket, "bad");
    }
    if (ok) {
      res.kind === "exact" ? SFX.good(R.combo) : SFX.meh();
      floatText(`+${pts}`);
      const mult = comboMult(R.combo);
      if (mult > prevMult) {
        setTimeout(() => { floatText(`×${mult}`, true); SFX.mult(); }, 220);
        if (mult === 4) confetti(60);
      }
    } else {
      partial ? SFX.meh() : SFX.bad();
      if (pts) floatText(`+${pts}`);
    }
    if (R.mode === "survival" && ok) R.qLimit = Math.max(SURVIVAL_MIN, R.qLimit - 0.5);

    if (type === "type") {
      const input = $("answer-input");
      input.readOnly = true;
      input.classList.add(ok ? "ok" : "ko");
      $("btn-hint").disabled = true;
      $("btn-skip").disabled = true;
      $("btn-check").textContent = "Weiter →";
    }

    showFeedback(res, ok, partial, pts, given);
    if (card.dir === "esde" || (card.dir === "genus")) speak(full(noun));

    checkAchievements(false);
    save();
    updateHud();

    if (R.mode === "survival" && R.lives <= 0) {
      R.over = true;
      clearInterval(timerId);
      $("btn-next").textContent = "Ver resultado →";
      $("btn-check").textContent = "Ver resultado →";
    } else {
      $("btn-next").innerHTML = "Weiter <span>&rarr;</span>";
    }

    if (R.mode === "blitz") {
      advanceId = setTimeout(nextQuestion, ok ? 450 : 1600);
    } else if (type !== "type") {
      $("btn-next").focus({ preventScroll: true });
    }
  }

  function showFeedback(res, ok, partial, pts, given) {
    const { card, noun } = Q;
    const fb = $("feedback");
    fb.hidden = false;
    fb.className = "feedback" + (ok ? (res.kind === "exact" ? "" : " meh") : partial ? " meh" : " bad");
    const titles = {
      exact: Q.fast ? "Blitzschnell!" : "Richtig!", typo: "Fast!", synonym: "Auch richtig", noart: "Ohne Artikel",
      wrongart: "Falscher Artikel", wrong: "Falsch", skip: "Lösung", timeout: "Zeit um!",
    };
    $("fb-title").textContent = titles[res.kind] || "Falsch";
    $("fb-points").textContent = pts ? `+${pts}` + (ok && comboMult(R.combo) > 1 ? ` · ×${comboMult(R.combo)}` : "") : "";

    const msg = $("fb-msg");
    msg.innerHTML = "";
    const b = (t) => { const el = document.createElement("b"); el.textContent = t; return el; };
    const add = (...parts) => parts.forEach((p) => msg.append(typeof p === "string" ? document.createTextNode(p) : p));
    if (res.kind === "noart") {
      add("Falta el artículo: ", b(full(noun)), ". Media puntuación y la carta no sube.");
      if (res.typo) add(" Además, se escribe ", b(noun.de), ".");
    } else if (res.kind === "wrongart") {
      add("La palabra está bien, pero es ", b(noun.art), ", no ", res.art, ".");
    } else if (res.kind === "typo") {
      if (res.umlaut) add("Lleva diéresis: ", b(noun.de), ". Media puntuación.");
      else if (card.dir === "esde") add("Se escribe ", b(noun.de), ". Media puntuación.");
      else add("Casi. Fíjate en la ortografía. Media puntuación.");
    } else if (res.kind === "synonym") {
      add(b(full(res.other)), ` también es «${res.other.es}», pero aquí se buscaba `, b(full(noun)), ".");
    } else if (res.kind === "wrong" && card.dir === "genus") {
      add("Es ", b(noun.art), ", no ", res.picked, ".");
    } else if (res.kind === "wrong" && res.other && card.dir === "esde") {
      add(b(full(res.other)), ` significa «${res.other.es}». Aquí era `, b(full(noun)), ".");
    } else if (res.kind === "wrong" && res.other && card.dir === "dees") {
      add(`«${given}» es `, b(full(res.other)), ".");
    } else if (res.kind === "wrong" && given && Q.type === "type") {
      add("Has escrito ", b(given), ".");
    } else if (res.kind === "timeout") {
      add("Se acabó el tiempo. Pierdes una vida.");
    } else if (ok && Q.hint) {
      add("Con pista: mitad de puntos y la carta no sube de nivel.");
    }
    if (res.lower && (res.kind === "exact" || res.kind === "noart")) {
      add(msg.childNodes.length ? " " : "", "En alemán los sustantivos van en mayúscula: ", b(noun.de), ".");
    }
    if (!ok && R.mode === "survival" && res.kind !== "timeout") add(msg.childNodes.length ? " " : "", "Pierdes una vida.");

    const art = $("fb-art");
    art.textContent = noun.art;
    art.className = "fb-art " + noun.art;
    $("fb-de").textContent = noun.de;
    $("fb-pl").textContent = noun.pl ? `· pl. die ${noun.pl}` : "· sin plural habitual";
    $("fb-es").textContent = noun.es + (noun.ok.length ? ` (también: ${noun.ok.join(", ")})` : "");
    $("fb-note").textContent = noun.note;
  }

  function useHint() {
    if (!Q || Q.answered || Q.type !== "type") return;
    const target = Q.card.dir === "esde" ? full(Q.noun) : esParts(Q.noun)[0];
    Q.hint = Math.min(Q.hint + 1, 3);
    // En ES→DE la primera pista ya enseña el artículo entero más una letra.
    const head = Q.card.dir === "esde" ? Q.noun.art.length : 0;
    const letters = target.replace(/ /g, "").length - head;
    const shown = head + (Q.hint === 1 ? 1 : Q.hint === 2 ? Math.ceil(letters / 3) : Math.ceil(letters / 2));
    let n = 0;
    const masked = [...target].map((ch) => (ch === " " ? "  " : n++ < shown ? ch : "_")).join(" ");
    const hint = $("ticket-hint");
    hint.innerHTML = "";
    const span = document.createElement("span");
    span.className = "mask";
    span.textContent = masked;
    hint.appendChild(span);
    if (Q.hint >= 3) $("btn-hint").disabled = true;
    $("answer-input").focus({ preventScroll: true });
  }

  function tickTimer() {
    if (!R || R.over) return;
    const now = performance.now();
    if (R.mode === "blitz") {
      const left = Math.max(0, R.deadline - now) / 1000;
      if (left <= 0) { R.over = true; clearInterval(timerId); clearTimeout(advanceId); setTimeout(endRound, 400); }
      updateHud(left);
    } else if (R.mode === "survival" && Q && !Q.answered) {
      const left = Math.max(0, Q.limit - (now - Q.start) / 1000);
      if (left <= 0) {
        resolve({ kind: "timeout" }, "");
      } else {
        if (left <= 3 && Math.ceil(left) !== Q.lastTick) { Q.lastTick = Math.ceil(left); SFX.tick(); }
        updateHud(left);
      }
    }
  }

  // Salvavidas en vez de corazones.
  function ringSvg(lost, broke) {
    return `<svg viewBox="0 0 24 24" class="${lost ? "lost" : ""}${broke ? " broke" : ""}"><path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"/></svg>`;
  }

  function updateHud(left) {
    if (!R) return;
    const status = $("hud-status");
    const fill = $("track-fill");
    status.classList.remove("warn");
    fill.classList.remove("timer", "low");
    if (R.mode === "blitz") {
      const l = left != null ? left : Math.max(0, R.deadline - performance.now()) / 1000;
      status.textContent = `0:${String(Math.ceil(l)).padStart(2, "0")}`;
      status.classList.toggle("warn", l <= 10);
      fill.classList.add("timer");
      fill.classList.toggle("low", l <= 10);
      fill.style.width = (l / BLITZ_SECS) * 100 + "%";
    } else if (R.mode === "survival") {
      if (shownLives !== R.lives || !status.querySelector(".hearts")) {
        status.innerHTML = `<span class="hearts">${[0, 1, 2].map((k) => ringSvg(k >= R.lives, k === R.lives && shownLives > R.lives)).join("")}</span>`;
        shownLives = R.lives;
      }
      const l = left != null ? left : Q && !Q.answered ? Q.limit : 0;
      fill.classList.add("timer");
      fill.classList.toggle("low", l <= 3);
      fill.style.width = (Q ? (l / Q.limit) * 100 : 0) + "%";
    } else {
      const total = R.done + R.queue.length + (Q && !Q.answered ? 1 : 0);
      const pos = Math.min(total, R.done + (Q && !Q.answered ? 1 : 0));
      status.textContent = `${pos} / ${total}`;
      fill.style.width = (total ? (R.done / total) * 100 : 0) + "%";
    }

    const scoreEl = $("hud-score");
    if (scoreEl.textContent !== String(R.score)) {
      scoreEl.textContent = R.score;
      restartAnim(scoreEl, "bump");
    }
    const combo = $("combo");
    if (R.combo >= 2) {
      const mult = comboMult(R.combo);
      combo.hidden = false;
      $("combo-n").textContent = R.combo;
      $("combo-x").textContent = "×" + mult;
      if (combo.dataset.mult !== String(mult)) { combo.dataset.mult = mult; restartAnim(combo, "pop"); }
    } else {
      combo.hidden = true;
      combo.dataset.mult = "1";
    }
  }

  function endRound() {
    clearInterval(timerId);
    clearTimeout(advanceId);
    if (!R) return;
    R.over = true;
    let record = false;
    if (R.mode === "blitz" && R.correct > S.best.blitz) { S.best.blitz = R.correct; record = true; }
    if (R.mode === "survival" && R.correct > S.best.survival) { S.best.survival = R.correct; record = true; }
    checkAchievements(true);
    save();
    renderResult(record);
    show("result");
    SFX.end();
    const perfect = R.mode === "train" && R.wrong === 0 && R.correct > 0;
    if (record || perfect) setTimeout(() => confetti(), 300);
  }

  function renderResult(record) {
    const total = R.correct + R.wrong;
    const acc = total ? R.correct / total : 0;
    const dirName = { esde: "ES → DE", dees: "DE → ES", genus: "Género", mix: "Mixto" };
    $("res-mode").textContent = MODE_LABEL[R.mode] + (R.mode === "train" ? " · " + dirName[S.dir] : "");
    let title, sub;
    if (R.mode === "blitz") {
      title = record ? "Neuer Rekord!" : R.correct >= 20 ? "Sturmfest!" : "Zeit um!";
      sub = `${R.correct} géneros en ${BLITZ_SECS} segundos.` + (record ? "" : ` Récord: ${S.best.blitz}.`);
    } else if (R.mode === "survival") {
      title = record ? "Neuer Rekord!" : R.correct >= 10 ? "Stark!" : "Schiffbruch";
      sub = `Has aguantado ${R.correct} pregunta${R.correct === 1 ? "" : "s"}.` + (record ? "" : ` Récord: ${S.best.survival}.`);
    } else {
      title = R.wrong === 0 ? "Spiegelglatt!" : acc >= 0.85 ? "Ausgezeichnet!" : acc >= 0.65 ? "Gut gemacht!" : acc >= 0.45 ? "Weiter so" : "Noch einmal";
      sub = R.wrong === 0 ? "Ni un fallo. Las cartas suben de nivel." : `Los fallos volvieron a salir hasta dos veces. Precisión ${Math.round(acc * 100)} %.`;
    }
    $("res-title").textContent = title;
    $("res-sub").textContent = sub;
    $("res-score").textContent = R.score;
    $("res-acc").textContent = `${R.correct}/${total}`;
    $("res-combo").textContent = R.bestCombo;
    $("res-xp").textContent = "+" + R.xp;

    const L = levelInfo(S.xp);
    $("res-lvl").textContent = `Nivel ${L.lvl} · ${L.port}`;
    $("res-next").textContent = L.need ? `${L.need - L.into} XP para ${PORTS[L.lvl]}` : "Fin de ruta";
    const fill = $("res-fill");
    fill.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = (L.need ? (L.into / L.need) * 100 : 100) + "%"; }));
    $("arrival").hidden = L.lvl <= R.startLvl;
    $("arrival-port").textContent = L.port;

    $("res-ach").hidden = R.newAch.length === 0;
    const al = $("res-ach-list");
    al.innerHTML = "";
    R.newAch.forEach((a) => al.appendChild(achItem(a, true)));

    const seen = new Set();
    const uniq = R.mistakes.filter((m) => { const k = cardKey(m.card); if (seen.has(k)) return false; seen.add(k); return true; });
    $("res-mistakes").hidden = uniq.length === 0;
    $("btn-review").hidden = uniq.length === 0;
    const ml = $("mistake-list");
    ml.innerHTML = "";
    uniq.forEach(({ card, given }) => {
      const n = NOUNS[card.i];
      const li = document.createElement("li");
      li.innerHTML = `<span class="m-dir"></span><div><div class="m-main"><span></span> <span></span></div><div class="m-sub"></div></div>`;
      li.querySelector(".m-dir").textContent = DIR_SHORT[card.dir];
      const [a, w] = li.querySelectorAll(".m-main span");
      a.textContent = n.art;
      a.className = n.art;
      w.textContent = n.de;
      const sub = li.querySelector(".m-sub");
      sub.textContent = n.es;
      if (given) {
        sub.append(" · tú: ");
        const s = document.createElement("s");
        s.textContent = given;
        sub.append(s);
      }
      ml.appendChild(li);
    });
    R.reviewCards = uniq.map((m) => ({ i: m.card.i, dir: m.card.dir }));
  }

  function quitRound() {
    clearInterval(timerId);
    clearTimeout(advanceId);
    if (R && R.done > 0 && !R.over) { checkAchievements(false); save(); }
    R = null;
    Q = null;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    renderHome();
    show("home");
  }

  // ---------------------------------------------------------------- eventos
  $("dir-seg").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-dir]");
    if (!b) return;
    S.dir = b.dataset.dir;
    save();
    renderHome();
  });
  $("btn-train").addEventListener("click", () => startRound("train"));
  document.querySelectorAll(".mode").forEach((b) => b.addEventListener("click", () => startRound(b.dataset.mode)));

  $("genders").addEventListener("click", (e) => {
    const b = e.target.closest(".gbtn");
    if (b) answerGenus(b.dataset.g);
  });
  $("type-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!Q) return;
    if (Q.answered) { if (R.over) return endRound(); return nextQuestion(); }
    submitTyped();
  });
  $("answer-input").addEventListener("input", updateArtButtons);
  $("btn-next").addEventListener("click", () => {
    if (!R) return;
    if (R.over) return endRound();
    nextQuestion();
  });
  $("btn-hint").addEventListener("click", useHint);
  $("btn-skip").addEventListener("click", () => {
    if (!Q || Q.answered) return;
    resolve({ kind: "skip" }, "");
  });
  $("keyrow").addEventListener("mousedown", (e) => e.preventDefault()); // no robar el foco al input
  $("keyrow").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.art) return setArticle(b.dataset.art);
    const input = $("answer-input");
    if (input.readOnly) return;
    const s = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? s;
    input.value = input.value.slice(0, s) + b.dataset.ch + input.value.slice(end);
    input.setSelectionRange(s + 1, s + 1);
    input.focus({ preventScroll: true });
  });
  $("btn-speak").addEventListener("click", () => Q && speak(full(Q.noun), true));
  $("btn-quit").addEventListener("click", quitRound);
  $("btn-again").addEventListener("click", () => startRound(R ? (R.mode === "review" ? "train" : R.mode) : "train"));
  $("btn-review").addEventListener("click", () => R && startRound("review", R.reviewCards));
  $("btn-home").addEventListener("click", () => { R = null; renderHome(); show("home"); });

  $("btn-sound").addEventListener("click", () => { S.sound = !S.sound; save(); renderTopbar(); if (S.sound) SFX.good(0); });
  $("btn-voice").addEventListener("click", () => {
    S.voice = !S.voice;
    save();
    renderTopbar();
    if (S.voice) speak("Gute Reise!");
    else if ("speechSynthesis" in window) speechSynthesis.cancel();
  });
  $("btn-reset").addEventListener("click", () => {
    if (!confirm("¿Borrar XP, rachas, logros y el dominio de todos los sustantivos?")) return;
    const keep = { sound: S.sound, voice: S.voice, dir: S.dir };
    S = Object.assign(defaults(), keep);
    save();
    renderHome();
  });

  document.addEventListener("keydown", (e) => {
    if (!Q || !R || $("screen-play").dataset.active !== "true") return;
    if (e.key === "Escape") { quitRound(); return; }
    if (Q.answered || e.ctrlKey || e.metaKey || e.altKey) return;
    if (Q.type === "mc" && /^[1-4]$/.test(e.key)) {
      const b = $("choices").children[Number(e.key) - 1];
      if (b) b.click();
    } else if (Q.type === "genus" && /^[1-3]$/.test(e.key)) {
      answerGenus(ARTS[Number(e.key) - 1]);
    }
  });

  // ---------------------------------------------------------------- arranque
  rollDay();
  renderHome();
})();
