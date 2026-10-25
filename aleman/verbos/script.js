(() => {
  "use strict";

  const STORE_KEY = "verben-v1";
  const ROUND_LEN = 12;
  const DAILY_GOAL = 100;
  const MAX_M = 5;           // aciertos para dominar una carta
  const MC_CAP = 2;          // con opción múltiple no se pasa de aquí
  const BLITZ_SECS = 60;
  const SURVIVAL_START = 20; // segundos por pregunta al empezar
  const SURVIVAL_MIN = 7;
  const CITIES = [
    "Aachen", "Köln", "Bonn", "Koblenz", "Mainz", "Frankfurt", "Heidelberg", "Stuttgart", "München",
    "Nürnberg", "Würzburg", "Kassel", "Hannover", "Bremen", "Hamburg", "Leipzig", "Dresden", "Berlin",
  ];
  const DIR_LABEL = { esde: "Español → Deutsch", dees: "Deutsch → Español", perf: "Partizip II" };
  const DIR_SHORT = { esde: "ES → DE", dees: "DE → ES", perf: "Perfekt" };
  const MODE_LABEL = { train: "Training", review: "Repaso", blitz: "Blitz", survival: "Überleben", perf: "Perfekt" };

  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------- estado persistente
  const defaults = () => ({
    xp: 0, mastery: {}, ach: {}, streak: 0, lastDay: null, todayDate: null, todayXp: 0,
    best: { blitz: 0, survival: 0 }, typedCorrect: 0, umlautCorrect: 0,
    sound: true, voice: true, dir: "esde",
  });
  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const d = defaults();
        const s = Object.assign(d, JSON.parse(raw));
        s.best = Object.assign(defaults().best, s.best);
        // versión anterior tenía DE→EN: se descarta ese progreso
        if (s.dir === "deen") s.dir = "dees";
        Object.keys(s.mastery).forEach((k) => { if (k.endsWith(":deen")) delete s.mastery[k]; });
        delete s.ach.deen;
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
    while (lvl < CITIES.length && xp >= base + levelNeed(lvl)) { base += levelNeed(lvl); lvl++; }
    const need = lvl < CITIES.length ? levelNeed(lvl) : null;
    return { lvl, into: xp - base, need, city: CITIES[lvl - 1] };
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
  // Igual pero quitando las diéresis en vez de transcribirlas (para detectar "uberqueren").
  function stripDe(s) {
    return s.toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
  }
  function foldEs(s) {
    return s.toLowerCase().replace(/ñ/g, "n~").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/n~/g, "ñ").replace(/[^a-zñ]/g, "");
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
  const esParts = (v) => v.es.split(",").map((x) => x.trim());
  const sharesEs = (a, b) => esParts(a).some((x) => esParts(b).includes(x));
  const esOk = (v) => [...new Set([...esParts(v), ...v.ok].map(foldEs))];
  const sharesOk = (a, b) => esOk(a).some((x) => esOk(b).includes(x));

  function checkDe(input, verb) {
    const a = foldDe(input);
    if (!a) return { kind: "empty" };
    const t = foldDe(verb.de);
    if (a === t) return { kind: "exact" };
    const other = VERBOS.find((v) => v !== verb && foldDe(v.de) === a);
    if (other) return { kind: sharesEs(other, verb) ? "synonym" : "wrong", other };
    if (lev(a, t) <= tolerance(t)) {
      const umlaut = /[äöüß]/.test(verb.de) && stripDe(input) === stripDe(verb.de);
      return { kind: "typo", umlaut };
    }
    return { kind: "wrong" };
  }
  function checkEs(input, verb) {
    const a = foldEs(input);
    if (!a) return { kind: "empty" };
    const opts = esOk(verb);
    if (opts.includes(a)) return { kind: "exact" };
    const other = VERBOS.find((v) => v !== verb && esOk(v).includes(a));
    if (!other && opts.some((o) => lev(a, o) <= tolerance(o))) return { kind: "typo" };
    return { kind: "wrong", other };
  }
  function checkPerf(aux, input, verb) {
    const a = foldDe(input);
    if (!a) return { kind: "empty" };
    // "gegangen" vale también para "spazieren gegangen"
    const t = foldDe(verb.pp);
    const tail = foldDe(verb.pp.split(" ").pop());
    const ppOk = a === t || a === tail;
    const ppClose = !ppOk && lev(a, t) <= tolerance(t);
    const auxOk = aux === verb.aux;
    if (ppOk && auxOk) return { kind: "exact" };
    if (ppClose && auxOk) return { kind: "typo", umlaut: /[äöüß]/.test(verb.pp) && stripDe(input) === stripDe(verb.pp) };
    if ((ppOk || ppClose) && !auxOk) return { kind: "partial" };
    return { kind: "wrong" };
  }

  // ---------------------------------------------------------------- maestría por carta
  const cardKey = (c) => c.i + ":" + c.dir;
  function getM(c) { const st = S.mastery[cardKey(c)]; return st ? st.m : 0; }
  function setM(c, m) { S.mastery[cardKey(c)] = { m: Math.max(0, Math.min(MAX_M, m)), t: Date.now() }; }

  // Muestreo ponderado sin reemplazo: lo menos dominado y lo que hace más que no ves sale antes.
  function pickCards(dirs, n, avoid = []) {
    const pool = [];
    VERBOS.forEach((_, i) => dirs.forEach((dir) => pool.push({ i, dir })));
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
    good(combo) { const b = 523 * Math.pow(2, Math.min(combo, 12) / 12); tone(b, 0, 0.12); tone(b * 1.5, 0.07, 0.2); },
    meh() { tone(440, 0, 0.12); tone(415, 0.09, 0.18); },
    bad() { tone(196, 0, 0.22, "sawtooth", 0.06); tone(147, 0.1, 0.32, "sawtooth", 0.06); },
    tick() { tone(1100, 0, 0.04, "square", 0.03); },
    mult() { [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.05, 0.14, "square", 0.05)); },
    level() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, "square", 0.06)); },
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
    el.innerHTML = `<span class="toast-icon"><span></span></span><div><b></b><small></small></div>`;
    el.querySelector(".toast-icon span").textContent = icon;
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
    const colors = ["#f6c700", "#e5383b", "#1f5aa6", "#f1efe8", "#2fb36b", "#121212"];
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
  const allMastered = (dir) => VERBOS.every((_, i) => getM({ i, dir }) >= MAX_M);
  const ACHIEVEMENTS = [
    { id: "first", icon: "1", name: "Erster Schritt", desc: "Tu primer acierto.", test: (r) => r && r.correct >= 1 },
    { id: "combo10", icon: "10", name: "Zehn am Stück", desc: "10 aciertos seguidos.", test: (r) => r && r.bestCombo >= 10 },
    { id: "combo21", icon: "21", name: "Volle Fahrt", desc: "21 aciertos seguidos.", test: (r) => r && r.bestCombo >= 21 },
    { id: "flawless", icon: "0", name: "Fehlerfrei", desc: "Training de 12 sin un solo fallo.", test: (r, end) => end && r.mode === "train" && r.wrong === 0 && r.correct >= ROUND_LEN },
    { id: "blitz15", icon: "B", name: "Blitzschnell", desc: "15 aciertos en un Blitz.", test: (r) => r && r.mode === "blitz" && r.correct >= 15 },
    { id: "blitz25", icon: "B+", name: "Donnerwetter", desc: "25 aciertos en un Blitz.", test: (r) => r && r.mode === "blitz" && r.correct >= 25 },
    { id: "survive10", icon: "Ü", name: "Durchhalten", desc: "10 aciertos en Überleben.", test: (r) => r && r.mode === "survival" && r.correct >= 10 },
    { id: "survive25", icon: "Ü+", name: "Unkaputtbar", desc: "25 aciertos en Überleben.", test: (r) => r && r.mode === "survival" && r.correct >= 25 },
    { id: "perf", icon: "P", name: "Partizip-Profi", desc: "Ronda de Perfekt sin fallos.", test: (r, end) => end && r.mode === "perf" && r.wrong === 0 && r.correct >= ROUND_LEN },
    { id: "umlaut", icon: "Ä", name: "Pünktchen", desc: "10 respuestas exactas escribiendo ä, ö, ü o ß.", test: () => S.umlautCorrect >= 10 },
    { id: "typed50", icon: "50", name: "Tipp-Meister", desc: "50 respuestas escritas sin errores.", test: () => S.typedCorrect >= 50 },
    { id: "goal", icon: "✓", name: "Tagesziel", desc: `Gana ${DAILY_GOAL} XP en un día.`, test: () => S.todayXp >= DAILY_GOAL },
    { id: "streak3", icon: "3", name: "Dranbleiben", desc: "Racha de 3 días.", test: () => liveStreak() >= 3 },
    { id: "streak7", icon: "7", name: "Eine Woche", desc: "Racha de 7 días.", test: () => liveStreak() >= 7 },
    { id: "munich", icon: "M", name: "Halbzeit", desc: "Llega a München.", test: () => levelInfo(S.xp).lvl >= 9 },
    { id: "berlin", icon: "BE", name: "Hauptstadt", desc: "Llega a Berlin.", test: () => levelInfo(S.xp).lvl >= CITIES.length },
    { id: "esde", icon: "DE", name: "Dolmetscher", desc: "Domina los 21 verbos de español a alemán.", test: () => allMastered("esde") },
    { id: "dees", icon: "ES", name: "Übersetzer", desc: "Domina los 21 verbos de alemán a español.", test: () => allMastered("dees") },
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
      toast(`Nivel ${after.lvl}: ${after.city}`, "Nueva parada en la ruta", String(after.lvl));
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
    $("lvl-city").textContent = L.city;
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

  function renderHome() {
    renderTopbar();

    document.querySelectorAll("#dir-seg button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.dir === S.dir)));
    $("btn-train").dataset.dir = S.dir;
    const dirs = S.dir === "mix" ? ["esde", "dees"] : [S.dir];
    const fresh = VERBOS.reduce((n, _, i) => n + dirs.filter((dir) => getM({ i, dir }) === 0).length, 0);
    const done = VERBOS.reduce((n, _, i) => n + dirs.filter((dir) => getM({ i, dir }) >= MAX_M).length, 0);
    const total = VERBOS.length * dirs.length;
    $("train-sub").textContent = done === total
      ? `${ROUND_LEN} preguntas · todo dominado, a mantenerlo`
      : fresh === total
        ? `${ROUND_LEN} preguntas · empiezas con opciones, acabas escribiendo`
        : `${ROUND_LEN} preguntas · ${done}/${total} dominadas en este sentido`;

    $("rec-blitz").textContent = `Récord ${S.best.blitz}`;
    $("rec-survival").textContent = `Récord ${S.best.survival}`;
    const perfDone = VERBOS.filter((_, i) => getM({ i, dir: "perf" }) >= MAX_M).length;
    $("rec-perf").textContent = `${perfDone}/${VERBOS.length}`;

    // ruta
    const L = levelInfo(S.xp);
    const route = $("route");
    route.innerHTML = "";
    CITIES.forEach((city, idx) => {
      const li = document.createElement("li");
      const n = idx + 1;
      if (n < L.lvl) li.className = "passed";
      if (n === L.lvl) li.className = "here";
      li.title = `${n}. ${city}`;
      li.innerHTML = `<span class="dot"></span><span class="city"></span>`;
      li.querySelector(".city").textContent = city;
      route.appendChild(li);
    });
    const frac = L.need ? L.into / L.need : 0;
    route.style.setProperty("--progress", ((L.lvl - 1 + frac) / (CITIES.length - 1)).toFixed(4));
    const rt = $("route-text");
    rt.innerHTML = L.need
      ? `Estás en <b></b>. Faltan <b></b> XP para <b></b>.`
      : `Has llegado a <b></b>. Ruta completa con <b></b> XP.`;
    const bs = rt.querySelectorAll("b");
    if (L.need) { bs[0].textContent = L.city; bs[1].textContent = L.need - L.into; bs[2].textContent = CITIES[L.lvl]; }
    else { bs[0].textContent = L.city; bs[1].textContent = S.xp; }

    // colección
    const col = $("collection");
    col.innerHTML = "";
    VERBOS.forEach((v, i) => {
      const ms = ["esde", "dees", "perf"].map((dir) => getM({ i, dir }));
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile" + (ms.every((m) => m >= MAX_M) ? " gold" : ms.every((m) => m === 0) ? " fresh" : "");
      tile.innerHTML = `<span class="tile-de"></span><span class="tile-tr"></span><span class="meters"></span>`;
      tile.querySelector(".tile-de").textContent = v.de;
      tile.querySelector(".tile-tr").textContent = `${v.es} · ${v.aux} ${v.pp}`;
      const meters = tile.querySelector(".meters");
      ["esde", "dees", "perf"].forEach((dir, k) => {
        const m = document.createElement("span");
        m.className = "meter " + dir;
        m.innerHTML = Array.from({ length: MAX_M }, (_, j) => `<i class="${j < ms[k] ? "on" : ""}"></i>`).join("");
        meters.appendChild(m);
      });
      tile.setAttribute("aria-label", `${v.de}: ${v.es}. Dominio ${ms.join(", ")} de ${MAX_M}`);
      tile.addEventListener("click", () => speak(`${v.de}. ${v.aux} ${v.pp}`, true));
      col.appendChild(tile);
    });

    // logros
    const list = $("ach-list");
    list.innerHTML = "";
    ACHIEVEMENTS.forEach((a) => list.appendChild(achItem(a, !!S.ach[a.id])));
    $("ach-count").textContent = `${Object.keys(S.ach).length}/${ACHIEVEMENTS.length}`;
  }

  function achItem(a, got) {
    const li = document.createElement("li");
    li.className = "ach" + (got ? " got" : "");
    li.innerHTML = `<span class="ach-badge"><span></span></span><div><div class="ach-name"></div><div class="ach-desc"></div></div>`;
    li.querySelector(".ach-badge span").textContent = a.icon;
    li.querySelector(".ach-name").textContent = a.name;
    li.querySelector(".ach-desc").textContent = a.desc;
    return li;
  }

  function show(name) {
    document.querySelectorAll(".screen").forEach((s) => (s.dataset.active = String(s.id === "screen-" + name)));
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------- ronda
  let R = null;   // estado de la ronda
  let Q = null;   // pregunta actual
  let timerId = null;
  let advanceId = null;

  function startRound(mode, cards) {
    const dirs = mode === "perf" ? ["perf"]
      : mode === "train" ? (S.dir === "mix" ? ["esde", "dees"] : [S.dir])
        : ["esde", "dees"];
    R = {
      mode, dirs,
      queue: cards ? cards.map((c) => ({ ...c, retries: 0 }))
        : (mode === "train" || mode === "perf") ? pickCards(dirs, ROUND_LEN).map((c) => ({ ...c, retries: 0 })) : [],
      done: 0, correct: 0, wrong: 0, score: 0, xp: 0, combo: 0, bestCombo: 0,
      lives: 3, mistakes: [], newAch: [], recent: [],
      startXp: S.xp, startLvl: levelInfo(S.xp).lvl,
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
      if (R.recent.length > 5) R.recent.shift();
    } else {
      card = R.queue.shift();
      if (!card) return endRound();
    }
    const verb = VERBOS[card.i];
    const type = card.dir === "perf" ? "perf"
      : R.mode === "blitz" ? "mc"
        : R.mode === "survival" ? "type"
          : getM(card) < MC_CAP ? "mc" : "type";
    Q = { card, verb, type, hint: 0, aux: null, answered: false, start: performance.now(), limit: R.qLimit };
    renderQuestion();
  }

  function renderQuestion() {
    const { card, verb, type } = Q;
    const sign = $("sign");
    sign.dataset.dir = card.dir;
    sign.classList.remove("good", "bad");
    $("sign-dir").textContent = DIR_LABEL[card.dir];
    $("sign-word").textContent = card.dir === "esde" ? verb.es : verb.de;
    const hint = $("sign-hint");
    hint.textContent = card.dir === "esde" ? verb.hint : card.dir === "perf" ? "hat o ist + participio" : "";

    $("feedback").hidden = true;
    const choices = $("choices");
    const form = $("type-form");
    choices.innerHTML = "";
    choices.hidden = type !== "mc";
    form.hidden = type === "mc";

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
    } else {
      const input = $("answer-input");
      input.value = "";
      input.readOnly = false;
      input.className = "";
      input.placeholder = card.dir === "esde" ? "Infinitiv auf Deutsch" : card.dir === "dees" ? "en español" : "Partizip II";
      $("aux-pick").hidden = type !== "perf";
      $("aux-pick").classList.remove("need");
      document.querySelectorAll("#aux-pick button").forEach((b) => b.setAttribute("aria-checked", "false"));
      $("umlauts").hidden = card.dir === "dees";
      $("btn-hint").disabled = false;
      $("btn-skip").disabled = false;
      $("btn-check").textContent = "Comprobar";
      input.focus({ preventScroll: true });
    }

    if (card.dir === "dees") speak(verb.de);
    updateHud();
  }

  function buildChoices() {
    const { card, verb } = Q;
    const label = (v) => (card.dir === "esde" ? v.de : v.es);
    const pool = VERBOS.filter((v) => v !== verb && !(card.dir === "esde" ? sharesEs(v, verb) : sharesOk(v, verb)));
    for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const opts = [{ label: label(verb), ok: true }, ...pool.slice(0, 3).map((v) => ({ label: label(v), ok: false, verb: v }))];
    for (let i = opts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [opts[i], opts[j]] = [opts[j], opts[i]]; }
    return opts;
  }

  function answerChoice(btn, opt) {
    if (Q.answered) return;
    const buttons = [...$("choices").children];
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.textContent === (Q.card.dir === "esde" ? Q.verb.de : Q.verb.es)) b.classList.add("right");
      else if (b !== btn) b.classList.add("dim");
    });
    if (!opt.ok) btn.classList.add("wrong");
    resolve(opt.ok ? { kind: "exact" } : { kind: "wrong", other: opt.verb }, opt.label);
  }

  function submitTyped() {
    if (Q.answered) return nextQuestion();
    const input = $("answer-input");
    let text = input.value.trim();
    if (Q.type === "perf") {
      const m = text.match(/^(hat|ist|habe|bin)\s+(.*)$/i);
      if (m) { Q.aux = /^(hat|habe)$/i.test(m[1]) ? "hat" : "ist"; text = m[2]; setAuxUi(); }
      if (!Q.aux) {
        restartAnim($("aux-pick"), "need");
        return;
      }
    }
    if (!text) { input.focus(); return; }
    const res = Q.card.dir === "esde" ? checkDe(text, Q.verb)
      : Q.card.dir === "dees" ? checkEs(text, Q.verb)
        : checkPerf(Q.aux, text, Q.verb);
    if (res.kind === "empty") return;
    resolve(res, Q.type === "perf" ? `${Q.aux} ${text}` : text);
  }

  function setAuxUi() {
    document.querySelectorAll("#aux-pick button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.aux === Q.aux)));
    $("aux-pick").classList.remove("need");
  }

  const comboMult = (c) => (c >= 10 ? 4 : c >= 6 ? 3 : c >= 3 ? 2 : 1);

  function resolve(res, given) {
    if (Q.answered) return;
    Q.answered = true;
    const { card, verb, type } = Q;
    const elapsed = (performance.now() - Q.start) / 1000;
    const ok = ["exact", "typo", "synonym"].includes(res.kind);
    const partial = res.kind === "partial";
    const prevMult = comboMult(R.combo);
    let pts = 0;

    if (ok) {
      R.combo++;
      R.bestCombo = Math.max(R.bestCombo, R.combo);
      R.correct++;
      const base = type === "mc" ? 5 : type === "perf" ? 12 : 10;
      let f = res.kind === "exact" ? 1 : 0.5;
      if (Q.hint) f *= 0.5;
      const mult = comboMult(R.combo);
      const fast = R.mode !== "blitz" && res.kind === "exact" && !Q.hint && elapsed < 5;
      pts = Math.round(base * f) * mult + (fast ? 3 : 0);
      Q.fast = fast;
      if (res.kind === "exact" && !Q.hint) {
        setM(card, type === "mc" ? Math.max(getM(card), Math.min(getM(card) + 1, MC_CAP)) : getM(card) + 1);
        if (type !== "mc") {
          S.typedCorrect++;
          if (/[äöüß]/i.test(given)) S.umlautCorrect++;
        }
      } else {
        setM(card, getM(card)); // refresca la fecha sin subir
      }
    } else {
      R.combo = 0;
      R.wrong++;
      if (partial) { pts = Math.round(12 * 0.3); }
      setM(card, getM(card) - (partial ? 1 : 2));
      R.mistakes.push({ card, given: res.kind === "skip" || res.kind === "timeout" ? "" : given });
      if (R.mode === "survival") R.lives--;
      if ((R.mode === "train" || R.mode === "perf" || R.mode === "review") && card.retries < 2) {
        R.queue.splice(Math.min(3, R.queue.length), 0, { ...card, retries: card.retries + 1 });
      }
    }
    R.done++;
    R.score += pts;
    addXp(pts);

    // sonido + animación
    const sign = $("sign");
    if (ok) {
      restartAnim(sign, "good");
      res.kind === "exact" ? SFX.good(R.combo) : SFX.meh();
      floatText(`+${pts}`);
      const mult = comboMult(R.combo);
      if (mult > prevMult) {
        setTimeout(() => { floatText(`×${mult}`, true); SFX.mult(); }, 220);
        if (mult === 4) confetti(60);
      }
    } else {
      restartAnim(sign, "bad");
      partial ? SFX.meh() : SFX.bad();
      if (partial && pts) floatText(`+${pts}`);
    }
    if (R.mode === "survival" && R.correct && ok) R.qLimit = Math.max(SURVIVAL_MIN, R.qLimit - 0.5);

    const input = $("answer-input");
    if (type !== "mc") {
      input.readOnly = true;
      input.classList.add(ok ? "ok" : "ko");
      $("btn-hint").disabled = true;
      $("btn-skip").disabled = true;
      $("btn-check").textContent = "Weiter →";
    }

    showFeedback(res, ok, partial, pts, given);
    if (card.dir !== "dees") speak(card.dir === "perf" ? `${verb.aux} ${verb.pp}` : verb.de);

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
      advanceId = setTimeout(nextQuestion, ok ? 550 : 1500);
    } else if (type === "mc") {
      $("btn-next").focus({ preventScroll: true });
    }
  }

  function showFeedback(res, ok, partial, pts, given) {
    const { card, verb } = Q;
    const fb = $("feedback");
    fb.hidden = false;
    fb.className = "feedback" + (ok ? (res.kind === "exact" ? "" : " meh") : partial ? " meh" : " bad");
    const titles = {
      exact: Q.fast ? "Blitzschnell!" : "Richtig!", typo: "Fast!", synonym: "Auch richtig",
      partial: "Halb richtig", wrong: "Falsch", skip: "Lösung", timeout: "Zeit um!",
    };
    $("fb-title").textContent = titles[res.kind] || "Falsch";
    $("fb-points").textContent = pts ? `+${pts}` + (ok && comboMult(R.combo) > 1 ? ` · ×${comboMult(R.combo)}` : "") : "";

    const msg = $("fb-msg");
    msg.innerHTML = "";
    const b = (t) => { const el = document.createElement("b"); el.textContent = t; return el; };
    const add = (...parts) => parts.forEach((p) => msg.append(typeof p === "string" ? document.createTextNode(p) : p));
    if (res.kind === "typo") {
      const target = card.dir === "esde" ? verb.de : card.dir === "perf" ? verb.pp : null;
      if (res.umlaut) add("Lleva diéresis: ", b(target), ". Media puntuación.");
      else if (target) add("Se escribe ", b(target), ". Media puntuación.");
      else add("Casi. Fíjate en la ortografía. Media puntuación.");
    } else if (res.kind === "synonym") {
      add(b(res.other.de), ` también es «${res.other.es.split(",")[0]}», pero aquí se buscaba `, b(verb.de), verb.hint ? ` (${verb.hint}).` : ".");
    } else if (res.kind === "partial") {
      add("El participio está bien, pero el auxiliar es ", b(verb.aux), ".");
    } else if (res.kind === "wrong" && res.other && card.dir === "esde") {
      add(b(res.other.de), ` significa «${res.other.es}». Aquí era `, b(verb.de), ".");
    } else if (res.kind === "wrong" && res.other && card.dir === "dees") {
      add(`«${given}» es `, b(res.other.de), ". Válidas: ", b(verb.ok.slice(0, 4).join(", ")), ".");
    } else if (res.kind === "wrong" && card.dir === "dees") {
      add("Válidas: ", b(verb.ok.slice(0, 4).join(", ")), ".");
    } else if (res.kind === "wrong" && given && Q.type !== "mc") {
      add("Has escrito ", b(given), ".");
    } else if (res.kind === "timeout") {
      add("Se acabó el tiempo. Pierdes una vida.");
    } else if (ok && Q.hint) {
      add("Con pista: mitad de puntos y la carta no sube de nivel.");
    }
    if (!ok && R.mode === "survival" && res.kind !== "timeout") add(msg.childNodes.length ? " " : "", "Pierdes una vida.");

    $("fb-de").textContent = verb.de;
    $("fb-pp").textContent = `${verb.aux} ${verb.pp}`;
    $("fb-es").textContent = verb.ok.join(", ");
    $("fb-note").textContent = verb.note;
  }

  function useHint() {
    if (!Q || Q.answered || Q.type === "mc") return;
    const target = Q.card.dir === "esde" ? Q.verb.de : Q.card.dir === "dees" ? Q.verb.ok[0] : Q.verb.pp;
    Q.hint = Math.min(Q.hint + 1, 3);
    const shown = Q.hint === 1 ? 1 : Q.hint === 2 ? Math.ceil(target.length / 3) : Math.ceil(target.length / 2);
    let n = 0;
    const masked = [...target].map((ch) => (ch === " " ? "  " : n++ < shown ? ch : "_")).join(" ");
    const hint = $("sign-hint");
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

  function heartSvg(lost, broke) {
    return `<svg viewBox="0 0 24 24" class="${lost ? "lost" : ""}${broke ? " broke" : ""}"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z"/></svg>`;
  }

  let shownLives = 3;
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
        status.innerHTML = `<span class="hearts">${[0, 1, 2].map((k) => heartSvg(k >= R.lives, k === R.lives && shownLives > R.lives)).join("")}</span>`;
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
    const perfect = (R.mode === "train" || R.mode === "perf") && R.wrong === 0 && R.correct > 0;
    if (record || perfect) setTimeout(() => confetti(), 300);
  }

  function renderResult(record) {
    const total = R.correct + R.wrong;
    const acc = total ? R.correct / total : 0;
    $("res-mode").textContent = MODE_LABEL[R.mode] + (R.mode === "train" ? " · " + (S.dir === "mix" ? "Mixto" : DIR_SHORT[S.dir]) : "");
    let title, sub;
    if (R.mode === "blitz") {
      title = record ? "Neuer Rekord!" : R.correct >= 15 ? "Blitzschnell!" : "Zeit um!";
      sub = `${R.correct} aciertos en ${BLITZ_SECS} segundos.` + (record ? "" : ` Récord: ${S.best.blitz}.`);
    } else if (R.mode === "survival") {
      title = record ? "Neuer Rekord!" : R.correct >= 10 ? "Stark!" : "Game over";
      sub = `Has aguantado ${R.correct} pregunta${R.correct === 1 ? "" : "s"}.` + (record ? "" : ` Récord: ${S.best.survival}.`);
    } else {
      title = R.wrong === 0 ? "Fehlerfrei!" : acc >= 0.85 ? "Ausgezeichnet!" : acc >= 0.65 ? "Gut gemacht!" : acc >= 0.45 ? "Weiter so" : "Noch einmal";
      sub = R.wrong === 0 ? "Ni un fallo. Las cartas suben de nivel." : `Los fallos volvieron a salir hasta dos veces. Precisión ${Math.round(acc * 100)} %.`;
    }
    $("res-title").textContent = title;
    $("res-sub").textContent = sub;
    $("res-score").textContent = R.score;
    $("res-acc").textContent = `${R.correct}/${total}`;
    $("res-combo").textContent = R.bestCombo;
    $("res-xp").textContent = "+" + R.xp;

    const L = levelInfo(S.xp);
    $("res-lvl").textContent = `Nivel ${L.lvl} · ${L.city}`;
    $("res-next").textContent = L.need ? `${L.need - L.into} XP para ${CITIES[L.lvl]}` : "Fin de ruta";
    const fill = $("res-fill");
    fill.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = (L.need ? (L.into / L.need) * 100 : 100) + "%"; }));
    $("arrival").hidden = L.lvl <= R.startLvl;
    $("arrival-city").textContent = L.city;

    $("res-ach").hidden = R.newAch.length === 0;
    const al = $("res-ach-list");
    al.innerHTML = "";
    R.newAch.forEach((a) => al.appendChild(achItem(a, true)));

    // fallos únicos por carta
    const seen = new Set();
    const uniq = R.mistakes.filter((m) => { const k = cardKey(m.card); if (seen.has(k)) return false; seen.add(k); return true; });
    $("res-mistakes").hidden = uniq.length === 0;
    $("btn-review").hidden = uniq.length === 0;
    const ml = $("mistake-list");
    ml.innerHTML = "";
    uniq.forEach(({ card, given }) => {
      const v = VERBOS[card.i];
      const li = document.createElement("li");
      li.innerHTML = `<span class="m-dir"></span><div><div class="m-main"><b></b> · <span></span></div><div class="m-sub"></div></div>`;
      li.querySelector(".m-dir").textContent = DIR_SHORT[card.dir];
      li.querySelector(".m-main b").textContent = v.de;
      li.querySelector(".m-main span").textContent = `${v.aux} ${v.pp}`;
      const sub = li.querySelector(".m-sub");
      sub.textContent = v.es;
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
    if (R && R.done > 0 && !R.over) {
      // lo ganado ya está guardado; los récords solo cuentan si terminas
      checkAchievements(false);
      save();
    }
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

  $("type-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!Q) return;
    if (Q.answered) { if (R.over) return endRound(); return nextQuestion(); }
    submitTyped();
  });
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
  $("aux-pick").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-aux]");
    if (!b || !Q || Q.answered) return;
    Q.aux = b.dataset.aux;
    setAuxUi();
    $("answer-input").focus({ preventScroll: true });
  });
  $("umlauts").addEventListener("mousedown", (e) => e.preventDefault()); // no robar el foco al input
  $("umlauts").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-ch]");
    const input = $("answer-input");
    if (!b || input.readOnly) return;
    const s = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? s;
    input.value = input.value.slice(0, s) + b.dataset.ch + input.value.slice(end);
    input.setSelectionRange(s + 1, s + 1);
    input.focus({ preventScroll: true });
  });
  $("btn-speak").addEventListener("click", () => Q && speak(`${Q.verb.de}. ${Q.verb.aux} ${Q.verb.pp}`, true));
  $("btn-quit").addEventListener("click", quitRound);
  $("btn-again").addEventListener("click", () => startRound(R ? (R.mode === "review" ? "train" : R.mode) : "train"));
  $("btn-review").addEventListener("click", () => R && startRound("review", R.reviewCards));
  $("btn-home").addEventListener("click", () => { R = null; renderHome(); show("home"); });

  $("btn-sound").addEventListener("click", () => { S.sound = !S.sound; save(); renderTopbar(); if (S.sound) SFX.good(0); });
  $("btn-voice").addEventListener("click", () => {
    S.voice = !S.voice;
    save();
    renderTopbar();
    if (S.voice) speak("Gute Fahrt!");
    else if ("speechSynthesis" in window) speechSynthesis.cancel();
  });
  $("btn-reset").addEventListener("click", () => {
    if (!confirm("¿Borrar XP, rachas, logros y el dominio de todos los verbos?")) return;
    const keep = { sound: S.sound, voice: S.voice, dir: S.dir };
    S = Object.assign(defaults(), keep);
    save();
    renderHome();
  });

  document.addEventListener("keydown", (e) => {
    if (!Q || !R || $("screen-play").dataset.active !== "true") return;
    if (e.key === "Escape") { quitRound(); return; }
    if (Q.type === "mc" && !Q.answered && /^[1-4]$/.test(e.key)) {
      const b = $("choices").children[Number(e.key) - 1];
      if (b) b.click();
    }
    if (Q.type === "perf" && !Q.answered && document.activeElement !== $("answer-input")) {
      if (e.key === "h" || e.key === "i") { Q.aux = e.key === "h" ? "hat" : "ist"; setAuxUi(); }
    }
  });

  // ---------------------------------------------------------------- arranque
  rollDay();
  renderHome();
})();
