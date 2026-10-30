(function () {
  "use strict";

  // Index = DNI number mod 23.
  const LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
  const KEYS = LETTERS.split("").sort();
  const STORE_KEY = "dniletter.v1";

  const SPRINT_MS = 60000;
  const WEAK_COUNT = 25;
  const REINSERT_AHEAD = 3;
  const NEXT_DELAY_OK = 160;
  const NEXT_DELAY_BAD = 1100;
  const EMA_ALPHA = 0.3;

  const MODE_NAMES = { round: "Ronda de 23", sprint: "Sprint 60 s", weak: "Puntos flojos" };

  const $ = (id) => document.getElementById(id);

  // ---------- persistence ----------

  function emptyStats() {
    return {
      perR: Array.from({ length: 23 }, () => ({ n: 0, err: 0, ema: null })),
      best: {},
    };
  }

  function loadStats() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      if (raw && Array.isArray(raw.perR) && raw.perR.length === 23) return raw;
    } catch (e) { /* storage blocked or corrupt */ }
    return emptyStats();
  }

  function saveStats() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(stats)); } catch (e) { /* ignore */ }
  }

  let stats = loadStats();

  // ---------- helpers ----------

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function median(nums) {
    if (!nums.length) return null;
    const s = nums.slice().sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function fmtMs(ms) {
    if (ms == null) return "—";
    return ms < 10000 ? Math.round(ms) + " ms" : (ms / 1000).toFixed(1) + " s";
  }

  function fmtTotal(ms) {
    return (ms / 1000).toFixed(2).replace(".", ",") + " s";
  }

  // A random 8-digit DNI number whose remainder mod 23 is r.
  function dniFor(r) {
    const maxK = Math.floor((99999999 - r) / 23);
    const k = Math.floor(Math.random() * (maxK + 1));
    return String(k * 23 + r).padStart(8, "0");
  }

  function weightedPick(exclude) {
    const weights = stats.perR.map((s, r) => {
      if (r === exclude) return 0;
      if (!s.n) return 4000;
      const errRate = s.err / s.n;
      return (s.ema || 2000) * (1 + errRate * 3);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let x = Math.random() * total;
    for (let r = 0; r < 23; r++) {
      x -= weights[r];
      if (x <= 0) return r;
    }
    return 22;
  }

  // ---------- screens ----------

  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => {
      s.dataset.active = String(s.id === id);
    });
    window.scrollTo(0, 0);
  }

  function source() {
    return document.querySelector('input[name="source"]:checked').value;
  }

  function bestKey(mode, src) { return mode + "_" + src; }

  // ---------- heat strip ----------

  // items: [{ r, ms (or null), err (bool) }], sorted by r
  function renderStrip(el, items, showTimes) {
    const times = items.map((i) => i.ms).filter((v) => v != null);
    const lo = Math.min(...times);
    const hi = Math.max(...times);
    el.innerHTML = "";
    items.forEach((it) => {
      const li = document.createElement("li");
      li.className = "cell";
      let h = 0;
      if (it.ms != null && hi > lo) h = (it.ms - lo) / (hi - lo);
      li.style.setProperty("--h", h.toFixed(3));
      if (h > 0.55) li.classList.add("dark");
      if (it.err) li.classList.add("err");
      if (showTimes && it.ms == null) li.classList.add("unseen");
      li.innerHTML =
        '<span class="r">' + it.r + "</span>" +
        '<span class="l">' + LETTERS[it.r] + "</span>" +
        (showTimes ? '<span class="t">' + (it.ms == null ? "" : Math.round(it.ms)) + "</span>" : "");
      li.title = it.r + " → " + LETTERS[it.r] + (it.ms != null ? " · " + Math.round(it.ms) + " ms" : "");
      el.appendChild(li);
    });
  }

  function renderIntro() {
    const src = source();
    const br = stats.best[bestKey("round", src)];
    const bs = stats.best[bestKey("sprint", src)];
    $("best-round").textContent = br ? "Mejor: " + fmtTotal(br) : "";
    $("best-sprint").textContent = bs ? "Mejor: " + bs + " aciertos" : "";

    const seen = stats.perR.filter((s) => s.n).length;
    const items = stats.perR.map((s, r) => ({ r, ms: s.n ? s.ema : null, err: s.err > 0 }));
    $("map-note").textContent = seen
      ? "Tiempo típico por resto (media móvil de tus últimas respuestas, en ms). Color más intenso = más lento; subrayado = lo has fallado alguna vez."
      : "Aún no hay datos. Juega una ronda y aquí verás en qué restos te atascas.";
    $("btn-reset").hidden = !seen;
    renderStrip($("map-strip"), items, true);
  }

  // ---------- game state ----------

  let game = null;
  let tickTimer = null;
  let nextTimer = null;

  function start(mode) {
    const src = source();
    game = {
      mode,
      src,
      queue: [],
      asked: 0,
      current: null,
      startedAt: 0,
      locked: true,
      answers: [],
      sprintEnd: 0,
    };
    if (mode === "round") game.queue = shuffle(Array.from({ length: 23 }, (_, i) => i));

    const play = $("screen-play");
    play.classList.toggle("is-dni", src === "dni");
    $("prompt-label").textContent = src === "dni" ? "DNI" : "resto";
    $("prompt-sep").textContent = src === "dni" ? "-" : "→";
    $("play-mode").textContent = MODE_NAMES[mode] + (src === "dni" ? " · DNI entero" : "");
    $("live-last").textContent = "—";
    $("live-median").textContent = "—";
    $("live-errors").textContent = "0";
    $("feedback").innerHTML = "&nbsp;";
    $("feedback").className = "feedback";
    show("screen-play");

    if (mode === "sprint") {
      game.sprintEnd = performance.now() + SPRINT_MS;
      tickTimer = setInterval(tick, 100);
    }
    updateProgress();
    next();
  }

  function stop() {
    clearInterval(tickTimer);
    clearTimeout(nextTimer);
    tickTimer = nextTimer = null;
  }

  function tick() {
    const left = game.sprintEnd - performance.now();
    if (left <= 0) { finish(); return; }
    updateProgress();
  }

  function updateProgress() {
    let pct, label;
    if (game.mode === "sprint") {
      const left = Math.max(0, game.sprintEnd - performance.now());
      label = Math.ceil(left / 1000) + " s · " + game.answers.filter((a) => a.ok).length + " ✓";
      pct = 100 - (left / SPRINT_MS) * 100;
    } else if (game.mode === "round") {
      const done = 23 - new Set(game.queue).size;
      label = done + " / 23";
      pct = (done / 23) * 100;
    } else {
      label = game.asked + " / " + WEAK_COUNT;
      pct = (game.asked / WEAK_COUNT) * 100;
    }
    $("play-progress").textContent = label;
    $("bar-fill").style.width = pct + "%";
  }

  function next() {
    nextTimer = null;
    let r;
    const prev = game.current ? game.current.r : -1;
    if (game.mode === "round") {
      if (!game.queue.length) { finish(); return; }
      r = game.queue.shift();
    } else if (game.mode === "weak") {
      if (game.asked >= WEAK_COUNT) { finish(); return; }
      r = weightedPick(prev);
    } else {
      if (performance.now() >= game.sprintEnd) { finish(); return; }
      do { r = Math.floor(Math.random() * 23); } while (r === prev);
    }

    game.current = { r };
    $("prompt-num").textContent = game.src === "dni" ? dniFor(r) : String(r);
    const slot = $("slot");
    slot.textContent = "?";
    slot.className = "slot";
    document.querySelectorAll(".key.ok, .key.bad").forEach((k) => { k.className = "key"; });

    // Start the clock once the number has actually been painted.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!game || !game.current || game.current.r !== r) return;
      game.startedAt = performance.now();
      game.locked = false;
    }));
  }

  function answer(letter) {
    if (!game || game.locked) return;
    const ms = performance.now() - game.startedAt;
    game.locked = true;

    const r = game.current.r;
    const correct = LETTERS[r];
    const ok = letter === correct;
    game.answers.push({ r, ms, ok, letter });
    if (game.mode === "weak") game.asked++;

    // History: only correct answers feed the typical time; misses count as errors.
    const s = stats.perR[r];
    s.n++;
    if (ok) s.ema = s.ema == null ? ms : s.ema + EMA_ALPHA * (ms - s.ema);
    else s.err++;
    saveStats();

    const slot = $("slot");
    slot.textContent = correct;
    slot.className = "slot " + (ok ? "ok" : "bad");
    const key = document.querySelector('.key[data-l="' + letter + '"]');
    if (key) key.className = "key " + (ok ? "ok" : "bad");

    const fb = $("feedback");
    if (ok) {
      fb.textContent = fmtMs(ms);
      fb.className = "feedback ok";
    } else {
      fb.textContent = "Era la " + correct + ", no la " + letter + (game.src === "dni" ? " (resto " + r + ")" : "");
      fb.className = "feedback bad";
      if (game.mode === "round") game.queue.splice(Math.min(REINSERT_AHEAD, game.queue.length), 0, r);
    }

    const okTimes = game.answers.filter((a) => a.ok).map((a) => a.ms);
    $("live-last").textContent = fmtMs(ms);
    $("live-median").textContent = fmtMs(median(okTimes));
    $("live-errors").textContent = String(game.answers.filter((a) => !a.ok).length);
    updateProgress();

    nextTimer = setTimeout(next, ok ? NEXT_DELAY_OK : NEXT_DELAY_BAD);
  }

  function finish() {
    stop();
    const g = game;
    game = null;
    if (!g.answers.length) { renderIntro(); show("screen-intro"); return; }

    const okAns = g.answers.filter((a) => a.ok);
    const errors = g.answers.length - okAns.length;
    const okTimes = okAns.map((a) => a.ms);
    const med = median(okTimes);
    const mean = okTimes.length ? okTimes.reduce((a, b) => a + b, 0) / okTimes.length : null;
    const fastest = okTimes.length ? Math.min(...okTimes) : null;
    const accuracy = Math.round((okAns.length / g.answers.length) * 100);
    const key = bestKey(g.mode, g.src);
    let isPb = false;

    $("result-eyebrow").textContent = MODE_NAMES[g.mode] + (g.src === "dni" ? " · DNI entero" : "");

    if (g.mode === "round") {
      // Total = every keystroke's reaction time, including misses and their repeats.
      const total = g.answers.reduce((a, b) => a + b.ms, 0);
      const prev = stats.best[key];
      isPb = !prev || total < prev;
      if (isPb) stats.best[key] = total;
      $("result-title").textContent = fmtTotal(total);
      $("result-sub").innerHTML = (isPb
        ? '<span class="pb">Mejor marca.</span> '
        : "Tu mejor: " + fmtTotal(prev) + ". ") +
        "Suma de los tiempos de reacción, fallos incluidos.";
    } else if (g.mode === "sprint") {
      const prev = stats.best[key];
      isPb = !prev || okAns.length > prev;
      if (isPb) stats.best[key] = okAns.length;
      $("result-title").textContent = okAns.length + " aciertos";
      $("result-sub").innerHTML = (isPb
        ? '<span class="pb">Mejor marca.</span> '
        : "Tu mejor: " + prev + ". ") + "En 60 segundos.";
    } else {
      $("result-title").textContent = fmtMs(med);
      $("result-sub").textContent = "Mediana en tus restos más flojos.";
    }
    saveStats();

    $("result-numbers").innerHTML = [
      ["mediana", fmtMs(med)],
      ["media", fmtMs(mean)],
      ["más rápida", fmtMs(fastest)],
      ["acierto", accuracy + "% (" + errors + " ✗)"],
    ].map(([k, v]) => "<div><dt>" + k + "</dt><dd>" + v + "</dd></div>").join("");

    // Per-remainder breakdown for this session.
    const byR = Array.from({ length: 23 }, (_, r) => {
      const mine = g.answers.filter((a) => a.r === r);
      const t = mine.filter((a) => a.ok).map((a) => a.ms);
      return { r, ms: t.length ? median(t) : null, err: mine.some((a) => !a.ok) };
    });
    renderStrip($("result-strip"), byR, true);

    const slow = byR.filter((i) => i.ms != null).sort((a, b) => b.ms - a.ms).slice(0, 3);
    const missed = byR.filter((i) => i.err).map((i) => i.r + "→" + LETTERS[i.r]);
    let txt = "";
    if (slow.length >= 3) txt += "Más lentos: " + slow.map((i) => "<b>" + i.r + "→" + LETTERS[i.r] + "</b> (" + Math.round(i.ms) + " ms)").join(", ") + ". ";
    if (missed.length) txt += "Fallados: " + missed.join(", ") + ".";
    $("result-slowest").innerHTML = txt;

    show("screen-result");
    $("btn-again").focus();
  }

  function abandon() {
    stop();
    game = null;
    renderIntro();
    show("screen-intro");
  }

  // ---------- wiring ----------

  const keysEl = $("keys");
  KEYS.forEach((l) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "key";
    b.dataset.l = l;
    b.textContent = l;
    // pointerdown fires earlier than click, which matters when you're timing reactions.
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); answer(l); });
    b.addEventListener("click", (e) => { if (e.detail === 0) answer(l); }); // keyboard-activated
    keysEl.appendChild(b);
  });

  renderStrip($("ref-strip"), Array.from({ length: 23 }, (_, r) => ({ r, ms: null, err: false })), false);

  document.querySelectorAll(".mode").forEach((b) => {
    b.addEventListener("click", () => start(b.dataset.mode));
  });
  document.querySelectorAll('input[name="source"]').forEach((i) => {
    i.addEventListener("change", renderIntro);
  });

  $("btn-reset").addEventListener("click", () => {
    if (!confirm("¿Borrar tiempos, fallos y mejores marcas?")) return;
    stats = emptyStats();
    saveStats();
    renderIntro();
  });

  let lastMode = "round";
  document.querySelectorAll(".mode").forEach((b) => {
    b.addEventListener("click", () => { lastMode = b.dataset.mode; });
  });
  $("btn-again").addEventListener("click", () => start(lastMode));
  $("btn-menu").addEventListener("click", () => { renderIntro(); show("screen-intro"); });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const active = document.querySelector('.screen[data-active="true"]').id;

    if (active === "screen-play") {
      if (e.key === "Escape") { abandon(); return; }
      if (/^[a-zñ]$/i.test(e.key)) {
        e.preventDefault();
        if (!e.repeat) answer(e.key.toUpperCase());
      }
      return;
    }
    if (active === "screen-intro") {
      const m = { "1": "round", "2": "sprint", "3": "weak" }[e.key];
      if (m) { lastMode = m; start(m); }
      return;
    }
    if (active === "screen-result") {
      if (e.key === "Enter") { e.preventDefault(); start(lastMode); }
      else if (e.key === "Escape") { renderIntro(); show("screen-intro"); }
    }
  });

  // Coming back to the tab shouldn't count the time you were away.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && game && !game.locked) game.startedAt = performance.now();
  });

  renderIntro();
})();
