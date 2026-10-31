KV.ready.then(function () {
  "use strict";

  // Index = DNI number mod 23.
  const LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
  const KEYS = LETTERS.split("").sort();
  const STORE_KEY = "dni.v1";
  const HISTORY_MAX = 200;

  // Spoken names, so the voice says "uve doble" instead of guessing at "W".
  const LETTER_NAMES = {
    A: "a", B: "be", C: "ce", D: "de", E: "e", F: "efe", G: "ge", H: "hache",
    J: "jota", K: "ka", L: "ele", M: "eme", N: "ene", P: "pe", Q: "cu", R: "erre",
    S: "ese", T: "te", V: "uve", W: "uve doble", X: "equis", Y: "i griega", Z: "zeta",
  };

  // Relative weight of each group size. Calibrated so that, on average,
  // 40% of digits come in groups of 3, 45% in groups of 2 and 15% alone.
  const GROUP_WEIGHTS = { 1: 1.0, 2: 6.328, 3: 15.695 };

  const AUTO_PAUSE_MS = 600;     // gap after the voice finishes before the next group
  const SILENT_GROUP_MS = 1100;  // how long a group stays up in auto mode without voice
  const SPEECH_FALLBACK_MS = 4000;

  const $ = (id) => document.getElementById(id);

  // ---------- grouping (port of dni2.py) ----------

  function compositions(n) {
    if (n === 0) return [[]];
    const out = [];
    for (const size of [1, 2, 3]) {
      if (size <= n) compositions(n - size).forEach((rest) => out.push([size].concat(rest)));
    }
    return out;
  }

  const COMPOSITIONS = compositions(8);
  const COMPOSITION_WEIGHTS = COMPOSITIONS.map((c) =>
    c.reduce((w, size) => w * GROUP_WEIGHTS[size], 1)
  );
  const COMPOSITION_TOTAL = COMPOSITION_WEIGHTS.reduce((a, b) => a + b, 0);

  // Returns [[from, to], ...] covering the 8 digits.
  function randomGroups() {
    let x = Math.random() * COMPOSITION_TOTAL;
    let sizes = COMPOSITIONS[COMPOSITIONS.length - 1];
    for (let i = 0; i < COMPOSITIONS.length; i++) {
      x -= COMPOSITION_WEIGHTS[i];
      if (x <= 0) { sizes = COMPOSITIONS[i]; break; }
    }
    const groups = [];
    let from = 0;
    sizes.forEach((size) => { groups.push([from, from + size]); from += size; });
    return groups;
  }

  // ---------- persistence ----------

  const DEFAULT_SETTINGS = { voice: true, voiceURI: "", read: "number", rate: 1.1, advance: "manual", ears: false };

  function load() {
    try {
      const raw = JSON.parse(KV.getItem(STORE_KEY));
      if (raw && Array.isArray(raw.history)) {
        return { settings: Object.assign({}, DEFAULT_SETTINGS, raw.settings), history: raw.history };
      }
    } catch (e) { /* storage blocked or corrupt */ }
    return { settings: Object.assign({}, DEFAULT_SETTINGS), history: [] };
  }

  function save() {
    try { KV.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
  }

  const store = load();
  const settings = store.settings;

  // ---------- helpers ----------

  function median(nums) {
    if (!nums.length) return null;
    const s = nums.slice().sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function fmtS(ms) {
    return ms == null ? "—" : (ms / 1000).toFixed(2).replace(".", ",") + " s";
  }

  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => { s.dataset.active = String(s.id === id); });
    window.scrollTo(0, 0);
  }

  // ---------- voice ----------

  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  let voice = null;

  function loadVoices() {
    if (!synth) return;
    const all = synth.getVoices();
    const es = all.filter((v) => /^es\b|^es[-_]/i.test(v.lang));
    const sel = $("opt-voice-name");
    sel.innerHTML = "";
    es.forEach((v) => {
      const o = document.createElement("option");
      o.value = v.voiceURI;
      o.textContent = v.name + " (" + v.lang + ")";
      sel.appendChild(o);
    });
    voice =
      es.find((v) => v.voiceURI === settings.voiceURI) ||
      es.find((v) => /es[-_]ES/i.test(v.lang)) ||
      es[0] || null;
    sel.hidden = !es.length;
    if (voice) sel.value = voice.voiceURI;

    const note = $("voice-note");
    if (all.length && !es.length) {
      note.textContent = "Tu navegador no trae voces en español; se usará la que tenga por defecto y puede leer los números en inglés.";
      note.hidden = false;
    } else {
      note.hidden = true;
    }
  }

  // Text the voice reads for a group of digits. Leading zeros are said out loud
  // ("07" → "cero, 7"), otherwise "07" would sound the same as "7".
  function spokenGroup(str) {
    if (settings.read === "digits") return str.split("").map((d) => (d === "0" ? "cero" : d)).join(", ");
    const zeros = str.match(/^0*/)[0].length;
    if (zeros === str.length) return Array(zeros).fill("cero").join(", ");
    const parts = Array(zeros).fill("cero");
    parts.push(String(parseInt(str, 10)));
    return parts.join(", ");
  }

  // onDone fires once, when the utterance ends, errors or a fallback timer trips.
  function speak(text, onDone) {
    let done = false;
    const finish = () => { if (!done) { done = true; if (onDone) onDone(); } };
    if (!settings.voice || !synth) { setTimeout(finish, SILENT_GROUP_MS); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : "es-ES";
    if (voice) u.voice = voice;
    u.rate = settings.rate;
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
    setTimeout(finish, SPEECH_FALLBACK_MS);
  }

  function hush() { if (synth) synth.cancel(); }

  // ---------- intro ----------

  function renderHistory() {
    const h = store.history;
    $("hist-empty").hidden = h.length > 0;
    $("btn-reset").hidden = !h.length;
    if (!h.length) { $("hist-numbers").innerHTML = ""; $("hist-log").innerHTML = ""; return; }

    const ok = h.filter((e) => e.ans === e.l);
    const recentOk = ok.slice(-20).map((e) => e.ms);
    const best = ok.length ? Math.min(...ok.map((e) => e.ms)) : null;
    $("hist-numbers").innerHTML = [
      ["hechos", String(h.length)],
      ["acierto", Math.round((ok.length / h.length) * 100) + "%"],
      ["mediana (20)", fmtS(median(recentOk))],
      ["mejor", fmtS(best)],
    ].map(([k, v]) => "<div><dt>" + k + "</dt><dd>" + v + "</dd></div>").join("");

    $("hist-log").innerHTML = h.slice(-10).reverse().map((e) => {
      const mark = e.ans == null
        ? '<span class="bad">sin responder</span>'
        : e.ans === e.l ? '<span class="ok">✓</span>' : '<span class="bad">✗ ' + e.ans + "</span>";
      return "<li><span>" + e.n + "-" + e.l + '</span><span class="t">' + fmtS(e.ms) + "</span>" + mark + "</li>";
    }).join("");
  }

  function syncSettingsUI() {
    $("opt-voice").checked = settings.voice;
    $("opt-rate").value = settings.rate;
    $("out-rate").textContent = String(settings.rate).replace(".", ",") + "×";
    $("opt-ears").checked = settings.ears;
    document.querySelector('input[name="read"][value="' + settings.read + '"]').checked = true;
    document.querySelector('input[name="advance"][value="' + settings.advance + '"]').checked = true;
    if (!synth) {
      $("voice-row").hidden = true;
      $("btn-test-voice").hidden = true;
      $("voice-note").textContent = "Este navegador no puede leer en voz alta. El juego funciona igual, pero en silencio.";
      $("voice-note").hidden = false;
    }
  }

  // ---------- game ----------

  // phase: "reveal" (showing group i), "blind" (all hidden, waiting for letter), "solution"
  let game = null;
  let session = { count: 0, ok: 0 };

  function startSession() {
    session = { count: 0, ok: 0 };
    show("screen-play");
    newDni();
  }

  function newDni() {
    const n = Math.floor(Math.random() * 100000000);
    game = {
      str: String(n).padStart(8, "0"),
      r: n % 23,
      groups: randomGroups(),
      i: 0,
      phase: "reveal",
      start: 0,
      step: 0, // bumps on every transition so stale timers/voice callbacks do nothing
    };
    session.count++;
    $("play-count").textContent = "DNI nº " + session.count;
    $("play-session").textContent = session.count > 1 ? (session.ok + " de " + (session.count - 1) + " bien") : "";
    $("result").hidden = true;
    $("card").classList.remove("is-blind");
    const slot = $("slot");
    slot.textContent = "?";
    slot.className = "slot";
    document.querySelectorAll(".key").forEach((k) => { k.className = "key"; });
    showGroup(0);
  }

  function renderDigits(from, to) {
    let html = "";
    for (let k = 0; k < 8; k++) {
      const visible = k >= from && k < to;
      html += visible ? game.str[k] : '<span class="h">?</span>';
    }
    $("digits").innerHTML = html;
    $("digits").setAttribute("aria-label", from === 0 && to === 8 ? game.str : "cifras ocultas");
  }

  function setKeys(enabled) {
    document.querySelectorAll(".key").forEach((k) => { k.disabled = !enabled; });
  }

  function showGroup(i) {
    game.i = i;
    game.phase = "reveal";
    const step = ++game.step;
    const [from, to] = game.groups[i];
    const last = i === game.groups.length - 1;

    if (settings.ears) renderDigits(0, 0);
    else renderDigits(from, to);

    // The clock starts on the first group, like the original script.
    if (i === 0) requestAnimationFrame(() => { if (game && game.step === step) game.start = performance.now(); });

    $("phase").textContent = last ? "Último trozo. Ya puedes teclear la letra." : "Escucha y retén.";
    $("btn-next").textContent = last ? "Ocultar y calcular" : "Siguiente trozo";
    setKeys(last);

    speak(spokenGroup(game.str.slice(from, to)), () => {
      if (settings.advance !== "auto" || !game || game.step !== step) return;
      setTimeout(() => { if (game && game.step === step) advance(); }, AUTO_PAUSE_MS);
    });
  }

  function blind() {
    game.phase = "blind";
    game.step++;
    renderDigits(0, 0);
    $("card").classList.add("is-blind");
    $("phase").textContent = "Todo oculto. ¿Qué letra le toca?";
    $("btn-next").textContent = "Ver la solución sin responder";
    setKeys(true);
  }

  function solve(letter) {
    const ms = performance.now() - game.start;
    game.phase = "solution";
    game.step++;
    const correct = LETTERS[game.r];
    const ok = letter === correct;

    const prevBest = store.history.filter((e) => e.ans === e.l).reduce((m, e) => Math.min(m, e.ms), Infinity);
    store.history.push({ n: game.str, l: correct, ans: letter, ms: Math.round(ms) });
    if (store.history.length > HISTORY_MAX) store.history.splice(0, store.history.length - HISTORY_MAX);
    save();
    if (ok) session.ok++;

    renderDigits(0, 8);
    $("card").classList.remove("is-blind");
    const slot = $("slot");
    slot.textContent = correct;
    slot.className = "slot " + (letter == null ? "skip" : ok ? "ok" : "bad");
    setKeys(false);
    const correctKey = document.querySelector('.key[data-l="' + correct + '"]');
    if (letter != null) {
      const pressed = document.querySelector('.key[data-l="' + letter + '"]');
      if (pressed) pressed.className = "key " + (ok ? "ok" : "bad");
      if (!ok && correctKey) correctKey.className = "key ok";
    }

    $("phase").textContent = game.str + " mod 23 = " + game.r;
    $("result-time").textContent = fmtS(ms);
    let line;
    if (letter == null) line = '<span class="bad">Sin responder.</span> Le tocaba la ' + correct + ".";
    else if (ok) line = '<span class="ok">Correcto.</span>' + (ms < prevBest ? ' <span class="pb">Tu mejor tiempo.</span>' : "");
    else line = '<span class="bad">Pusiste la ' + letter + ".</span> Era la " + correct + ".";
    $("result-line").innerHTML = line;
    $("result").hidden = false;
    $("btn-next").textContent = "Siguiente DNI";
    $("play-session").textContent = session.ok + " de " + session.count + " bien";

    speak(LETTER_NAMES[correct] || correct);
  }

  function advance() {
    if (!game) return;
    if (game.phase === "reveal") {
      if (game.i < game.groups.length - 1) showGroup(game.i + 1);
      else blind();
    } else if (game.phase === "blind") {
      solve(null);
    } else {
      newDni();
    }
  }

  function canAnswer() {
    if (!game) return false;
    return game.phase === "blind" || (game.phase === "reveal" && game.i === game.groups.length - 1);
  }

  function answer(letter) {
    if (!canAnswer()) return;
    solve(letter);
  }

  function repeatVoice() {
    if (!game || game.phase !== "reveal") return;
    const [from, to] = game.groups[game.i];
    speak(spokenGroup(game.str.slice(from, to)));
  }

  function quit() {
    hush();
    game = null;
    renderHistory();
    show("screen-intro");
  }

  // ---------- wiring ----------

  KEYS.forEach((l) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "key";
    b.dataset.l = l;
    b.textContent = l;
    b.disabled = true;
    // pointerdown fires earlier than click, which matters when you're timing reactions.
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); answer(l); });
    b.addEventListener("click", (e) => { if (e.detail === 0) answer(l); }); // keyboard-activated
    $("keys").appendChild(b);
  });

  $("btn-start").addEventListener("click", startSession);
  $("btn-next").addEventListener("click", (e) => { e.currentTarget.blur(); advance(); });
  $("btn-reset").addEventListener("click", () => {
    if (!confirm("¿Borrar todos los tiempos guardados?")) return;
    store.history = [];
    save();
    renderHistory();
  });

  $("opt-voice").addEventListener("change", (e) => { settings.voice = e.target.checked; save(); });
  $("opt-voice-name").addEventListener("change", (e) => {
    settings.voiceURI = e.target.value;
    save();
    loadVoices();
  });
  $("opt-rate").addEventListener("input", (e) => {
    settings.rate = parseFloat(e.target.value);
    $("out-rate").textContent = String(settings.rate).replace(".", ",") + "×";
    save();
  });
  $("opt-ears").addEventListener("change", (e) => { settings.ears = e.target.checked; save(); });
  document.querySelectorAll('input[name="read"]').forEach((i) => {
    i.addEventListener("change", () => { settings.read = i.value; save(); });
  });
  document.querySelectorAll('input[name="advance"]').forEach((i) => {
    i.addEventListener("change", () => { settings.advance = i.value; save(); });
  });
  $("btn-test-voice").addEventListener("click", () => {
    const wasOn = settings.voice;
    settings.voice = true;
    speak(["3", "07", "412", "59"].map(spokenGroup).join(". "));
    settings.voice = wasOn;
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const active = document.querySelector('.screen[data-active="true"]').id;

    if (active === "screen-intro") {
      const tag = document.activeElement && document.activeElement.tagName;
      if (e.key === "Enter" && tag !== "SELECT" && tag !== "BUTTON") { e.preventDefault(); startSession(); }
      return;
    }

    if (e.key === "Escape") { quit(); return; }
    if (e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      if (!e.repeat) advance();
      return;
    }
    if (e.key === " ") { e.preventDefault(); repeatVoice(); return; }
    if (/^[a-zñ]$/i.test(e.key)) {
      e.preventDefault();
      if (!e.repeat) answer(e.key.toUpperCase());
    }
  });

  syncSettingsUI();
  loadVoices();
  if (synth) synth.addEventListener("voiceschanged", loadVoices);
  renderHistory();
});
