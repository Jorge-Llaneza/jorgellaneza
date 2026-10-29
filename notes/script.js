(() => {
  'use strict';

  // ---------- music basics ----------
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  const PCS = [0, 2, 4, 5, 7, 9, 11];
  const SHARP_NAMES = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]];

  // Diatonic index: octave * 7 + letter index. E4 = 30 (treble bottom line), G2 = 18 (bass bottom line).
  const dia = (name) => +name.slice(1) * 7 + LETTERS.indexOf(name[0]);
  const midiOf = (d, acc) => 12 * (Math.floor(d / 7) + 1) + PCS[d % 7] + acc;
  const mod = (n, m) => ((n % m) + m) % m;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const STAFF_REF = { t: 30, b: 18 };

  // Groups are introduced in this order. Landmarks first, then neighbours of landmarks.
  const GROUPS = {
    t: [['C4', 'G4', 'C5'], ['E4', 'B4'], ['D4', 'F4', 'A4'], ['D5', 'E5', 'F5'], ['G5', 'A5'], ['B3', 'A3'], ['B5', 'C6'], ['G3', 'D6']],
    b: [['C3', 'F3', 'C4'], ['A2', 'E3'], ['G2', 'B2', 'D3'], ['G3', 'A3', 'B3'], ['F2', 'E2'], ['D2', 'C2'], ['D4', 'E4'], ['B1', 'A1']],
  };

  // Answer counts as fluent under this many ms. Mic and MIDI get slack for finding the key / detection lag.
  const FAST_MS = { piano: 2500, keys: 2000, midi: 2500, mic: 3000 };
  const MASTER_BOX = 3;
  const MAX_BOX = 6;
  // How long a note in each box can rest before it counts as due again.
  const INTERVALS = [1, 60e3, 5 * 60e3, 30 * 60e3, 24 * 3600e3, 3 * 24 * 3600e3, 7 * 24 * 3600e3];
  const BOX_WEIGHT = [8, 5, 3, 2, 1.3, 0.9, 0.7];
  const PREVIEW = 5;
  const SET_LENGTH = 40;
  const SPRINT_MS = 60e3;

  function groupsFor(clef) {
    if (clef === 'g') {
      return GROUPS.t.map((g, i) => [
        ...g.map((n) => ({ clef: 't', d: dia(n) })),
        ...GROUPS.b[i].map((n) => ({ clef: 'b', d: dia(n) })),
      ]);
    }
    return GROUPS[clef].map((g) => g.map((n) => ({ clef, d: dia(n) })));
  }
  function keyOf(it) {
    return it.clef + ':' + LETTERS[it.d % 7] + (it.acc === 1 ? '#' : it.acc === -1 ? 'b' : '') + Math.floor(it.d / 7);
  }
  function nameOf(d, acc, withOctave) {
    const li = d % 7;
    const base = db.settings.names === 'solfege' ? SOLFEGE[li] : LETTERS[li];
    const a = acc === 1 ? '♯' : acc === -1 ? '♭' : '';
    return base + a + (withOctave ? Math.floor(d / 7) : '');
  }
  function nameOfMidi(m, withOctave) {
    const [li, acc] = SHARP_NAMES[mod(m, 12)];
    const oct = Math.floor(m / 12) - 1;
    return nameOf(oct * 7 + li, acc, withOctave);
  }
  // Show the octave number only when it is part of what's being tested.
  const octaveMatters = () => db.settings.octave && db.settings.input !== 'keys';

  // ---------- storage ----------
  const STORE_KEY = 'notes-trainer.v1';
  const DEFAULTS = {
    settings: { input: 'piano', clef: 't', pool: 'adaptive', session: 'sprint', names: 'letters', accidentals: false, octave: true, sound: true, labels: false },
    stats: {},
    progress: { t: 1, b: 1, g: 1 },
    best: {},
  };
  const db = load();
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      if (raw && typeof raw === 'object') {
        return {
          settings: { ...DEFAULTS.settings, ...raw.settings },
          stats: raw.stats || {},
          progress: { ...DEFAULTS.progress, ...raw.progress },
          best: raw.best || {},
        };
      }
    } catch (e) { /* private mode or corrupt data: start fresh */ }
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
  }
  const peek = (k) => db.stats[k];
  function stat(k) {
    return db.stats[k] || (db.stats[k] = { box: 0, n: 0, ok: 0, ema: 0, last: 0 });
  }

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const screens = { menu: $('screen-menu'), play: $('screen-play'), result: $('screen-result') };
  let current = 'menu';
  function show(name) {
    current = name;
    for (const [k, el] of Object.entries(screens)) el.dataset.active = String(k === name);
    window.scrollTo(0, 0);
  }

  // ---------- settings form ----------
  const form = $('settings');
  function syncForm() {
    const s = db.settings;
    for (const name of ['input', 'clef', 'pool', 'session', 'names']) {
      const el = form.querySelector(`input[name="${name}"][value="${s[name]}"]`);
      if (el) el.checked = true;
    }
    for (const name of ['accidentals', 'octave', 'sound', 'labels']) form.elements[name].checked = !!s[name];
    form.elements.octave.disabled = s.input === 'keys';
    form.elements.sound.disabled = s.input === 'mic';
    updateInputHint();
    renderMaps();
    renderBestLine();
  }
  form.addEventListener('change', (e) => {
    const el = e.target;
    const s = db.settings;
    if (el.type === 'radio') {
      s[el.name] = el.value;
      if (el.name === 'input') {
        // Pitch detection often lands an octave off on piano overtones, so don't demand octaves from the mic by default.
        s.octave = el.value === 'piano' || el.value === 'midi';
        if (el.value === 'midi') initMidi();
      }
    } else if (el.type === 'checkbox') {
      s[el.name] = el.checked;
    }
    save();
    syncForm();
  });

  function updateInputHint() {
    const hint = $('input-hint');
    hint.classList.remove('warn');
    const s = db.settings;
    if (s.input === 'piano') hint.textContent = 'Click or tap the keys under the staff.';
    else if (s.input === 'keys') hint.textContent = 'Type the letter: C D E F G A B, or 1 to 7 for Do to Si. Shift + letter for a sharp. Octave is ignored.';
    else if (s.input === 'mic') hint.textContent = 'Play a real piano or any instrument near the mic. One note at a time; let a repeated note go quiet before playing it again.';
    else if (s.input === 'midi') {
      if (!navigator.requestMIDIAccess) {
        hint.textContent = "This browser has no Web MIDI. Chrome, Edge, Opera and Firefox do; Safari doesn't.";
        hint.classList.add('warn');
      } else if (midi.error) {
        hint.textContent = 'MIDI access was blocked: ' + midi.error;
        hint.classList.add('warn');
      } else if (midi.access) {
        const names = midiInputNames();
        hint.textContent = names.length ? 'Connected: ' + names.join(', ') : 'No MIDI device found. Plug one in; it gets picked up without reloading.';
      } else {
        hint.textContent = 'The browser will ask for MIDI access.';
      }
    }
  }

  function noteClass(st) {
    if (!st || !st.n) return 'new';
    if (st.box >= 5) return 'fluent';
    if (st.box >= MASTER_BOX) return 'ok';
    return 'weak';
  }
  function renderMaps() {
    for (const clef of ['t', 'b']) {
      const groups = groupsFor(clef);
      const unlocked = db.progress[clef];
      const items = groups.flatMap((g, gi) => g.map((it) => ({ ...it, locked: gi >= unlocked })));
      items.sort((a, b) => a.d - b.d);
      const el = $('map-' + clef);
      el.innerHTML = '';
      for (const it of items) {
        const st = peek(keyOf({ ...it, acc: 0 }));
        const span = document.createElement('span');
        span.className = 'nm ' + (it.locked && !(st && st.n) ? 'locked' : noteClass(st));
        span.textContent = nameOf(it.d, 0, true);
        const info = st && st.n ? `${st.ok}/${st.n} right, typical ${(st.ema / 1000).toFixed(1)} s` : it.locked ? 'locked' : 'not seen yet';
        span.title = `${nameOf(it.d, 0, true)}: ${info}`;
        el.appendChild(span);
      }
    }
  }
  const bestKey = () => `${db.settings.clef}-${db.settings.session}-${db.settings.pool}`;
  function renderBestLine() {
    const b = db.best[bestKey()];
    $('best-line').textContent = b ? `Best with these settings: ${b.toFixed(1)} correct notes per minute` : '';
  }

  $('reset').addEventListener('click', () => {
    if (!confirm('Forget every note you have practised and start from three notes again?')) return;
    db.stats = {};
    db.progress = { t: 1, b: 1, g: 1 };
    db.best = {};
    save();
    syncForm();
  });

  // ---------- audio out ----------
  let actx = null;
  function audio() {
    if (!actx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      actx = new C();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function playMidi(m) {
    if (!db.settings.sound || db.settings.input === 'mic') return;
    const c = audio();
    if (!c) return;
    const f = 440 * Math.pow(2, (m - 69) / 12);
    const t = c.currentTime;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 1.3);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(9000, f * 8), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + 1.0);
    const o1 = c.createOscillator();
    o1.type = 'triangle';
    o1.frequency.value = f;
    const o2 = c.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.value = f;
    const g2 = c.createGain();
    g2.gain.value = 0.12;
    o1.connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(g).connect(c.destination);
    o1.start(t); o2.start(t);
    o1.stop(t + 1.4); o2.stop(t + 1.4);
  }

  // ---------- note selection ----------
  function naturalPool() {
    const s = db.settings;
    const groups = groupsFor(s.clef);
    const unlocked = groups.slice(0, db.progress[s.clef]).flat();
    if (s.pool === 'all') return groups.flat();
    if (s.pool === 'weak') {
      const seen = groups.flat().filter((it) => { const st = peek(keyOf({ ...it, acc: 0 })); return st && st.n; });
      if (seen.length < 6) return unlocked;
      const score = (it) => {
        const st = peek(keyOf({ ...it, acc: 0 }));
        return st.box * 1000 - st.ema - (1 - st.ok / st.n) * 3000;
      };
      return seen.sort((a, b) => score(a) - score(b)).slice(0, 6);
    }
    return unlocked;
  }

  function pickNext() {
    const pool = session.pool;
    const now = Date.now();
    const fast = FAST_MS[db.settings.input];
    const recent = session.queue.slice(-2).map((it) => it.clef + it.d);
    let total = 0;
    const ws = pool.map((it) => {
      const st = peek(keyOf({ ...it, acc: 0 }));
      let w;
      if (!st || !st.n) w = 7;
      else {
        w = BOX_WEIGHT[st.box];
        if (st.box > 0) w *= clamp((now - st.last) / INTERVALS[st.box], 0.5, 3);
        if (st.ema > fast) w *= 1.6;
      }
      if (recent.includes(it.clef + it.d)) w *= pool.length > 2 ? 0.03 : 0.3;
      total += w;
      return w;
    });
    // No single note may take more than about half the turns, or a stubborn miss crowds out the rest.
    if (pool.length > 2) {
      for (let j = 0; j < ws.length; j++) {
        const cap = total - ws[j];
        if (ws[j] > cap) { total -= ws[j] - cap; ws[j] = cap; }
      }
    }
    let r = Math.random() * total;
    let i = 0;
    for (; i < ws.length - 1; i++) { r -= ws[i]; if (r <= 0) break; }
    const it = { clef: pool[i].clef, d: pool[i].d, acc: 0 };
    if (db.settings.accidentals && Math.random() < 0.35) {
      const L = LETTERS[it.d % 7];
      const opts = [];
      if ('CDFGA'.includes(L)) opts.push(1);
      if ('DEGAB'.includes(L)) opts.push(-1);
      it.acc = opts[Math.floor(Math.random() * opts.length)];
    }
    return finish(it);
  }
  function finish(it) {
    it.midi = midiOf(it.d, it.acc);
    it.key = keyOf(it);
    return it;
  }

  function checkUnlock() {
    const s = db.settings;
    if (s.pool !== 'adaptive') return;
    const groups = groupsFor(s.clef);
    const n = db.progress[s.clef];
    if (n >= groups.length) return;
    const ready = groups.slice(0, n).flat().every((it) => {
      const st = peek(keyOf({ ...it, acc: 0 }));
      return st && st.box >= MASTER_BOX;
    });
    if (!ready) return;
    db.progress[s.clef] = n + 1;
    const fresh = groups[n];
    session.pool = naturalPool();
    session.unlocked.push(...fresh);
    // Let the new notes appear soon, but after the notes already visible.
    for (const it of fresh) session.queue.splice(PREVIEW + Math.floor(Math.random() * 3), 0, finish({ ...it, acc: 0 }));
    toast('New: ' + fresh.map((it) => nameOf(it.d, 0, true)).join('  '));
    $('hud-pool').textContent = session.pool.length;
  }

  let toastTimer = 0;
  function toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ---------- session ----------
  let session = null;
  function startSession() {
    audio();
    const s = db.settings;
    session = {
      pool: naturalPool(),
      queue: [],
      t0: 0,
      firstTry: true,
      wrongMidi: null,
      correct: 0,
      attempts: 0,
      answered: 0,
      streak: 0,
      bestStreak: 0,
      times: [],
      perNote: {},
      confusions: {},
      unlocked: [],
      startAt: performance.now(),
      ended: false,
    };
    for (let i = 0; i < PREVIEW; i++) session.queue.push(pickNext());
    show('play');
    buildPiano();
    $('hud-score').textContent = '0';
    $('hud-streak').textContent = '0';
    $('hud-last').textContent = '–';
    $('hud-last').className = 'hud-val';
    $('hud-pool').textContent = session.pool.length;
    $('hud-clock-label').textContent = s.session === 'sprint' ? 'Time' : s.session === 'set' ? 'Left' : 'Elapsed';
    setFeedback('', '');
    renderKeysHint();
    setupInputs();
    beginNote();
    tickClock();
  }

  function beginNote() {
    session.t0 = performance.now();
    session.firstTry = true;
    session.wrongMidi = null;
    clearHints();
    renderStaff();
  }

  function tickClock() {
    if (!session || session.ended) return;
    const s = db.settings;
    const el = $('hud-clock');
    const elapsed = performance.now() - session.startAt;
    if (s.session === 'sprint') {
      const left = Math.max(0, SPRINT_MS - elapsed);
      const secs = Math.ceil(left / 1000);
      el.textContent = `0:${String(secs).padStart(2, '0')}`.replace('0:60', '1:00');
      el.className = 'hud-val' + (secs <= 10 ? ' low' : '');
      if (left <= 0) { endSession(); return; }
    } else if (s.session === 'set') {
      el.textContent = String(SET_LENGTH - session.answered);
    } else {
      const secs = Math.floor(elapsed / 1000);
      el.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    }
    requestAnimationFrame(tickClock);
  }

  // input: { midi } for a specific pitch, or { pc } when only the pitch class is known (letter keys).
  function answer(inp) {
    if (!session || session.ended || current !== 'play') return;
    const target = session.queue[0];
    const strict = db.settings.octave && inp.midi != null;
    const ok = strict ? inp.midi === target.midi : mod(inp.midi != null ? inp.midi : inp.pc, 12) === mod(target.midi, 12);
    const ms = performance.now() - session.t0;
    const fast = FAST_MS[db.settings.input];

    // What to sound: the key that was pressed, or for letter keys the pitch class nearest the target.
    let heard = inp.midi;
    if (heard == null) heard = target.midi + ((mod(inp.pc - target.midi, 12) + 6) % 12) - 6;
    if (inp.source !== 'midi') playMidi(heard);
    if (inp.midi != null) flashKey(inp.midi, ok ? 'ok' : 'bad');

    const pn = session.perNote[target.key] || (session.perNote[target.key] = { it: target, n: 0, miss: 0, times: [] });

    if (session.firstTry) {
      session.attempts++;
      pn.n++;
      const st = stat(target.key);
      st.n++;
      st.last = Date.now();
      if (ok) {
        st.ok++;
        st.ema = st.ema ? st.ema * 0.6 + ms * 0.4 : ms;
        if (ms <= fast) st.box = Math.min(MAX_BOX, st.box + 1);
      } else {
        st.box = 0;
        // A wrong answer is also a slow one: drag the typical time up so the note gets more turns.
        st.ema = Math.max(st.ema, fast * 1.2);
      }
    }

    if (ok) {
      if (session.firstTry) {
        session.correct++;
        session.streak++;
        session.bestStreak = Math.max(session.bestStreak, session.streak);
        session.times.push(ms);
        pn.times.push(ms);
        const last = $('hud-last');
        last.textContent = (ms / 1000).toFixed(2) + 's';
        last.className = 'hud-val ' + (ms <= fast ? 'fast' : 'slow');
        setFeedback(`${nameOf(target.d, target.acc, octaveMatters())}  ${(ms / 1000).toFixed(2)} s${ms > fast ? '  (aim for under ' + fast / 1000 + ' s)' : ''}`, ms <= fast ? 'ok' : 'slow');
      } else {
        setFeedback(`${nameOf(target.d, target.acc, octaveMatters())}. It comes back in a moment.`, 'slow');
      }
      $('hud-score').textContent = session.correct;
      $('hud-streak').textContent = session.streak;
      session.queue.shift();
      while (session.queue.length < PREVIEW) session.queue.push(pickNext());
      session.answered++;
      checkUnlock();
      save();
      if (db.settings.session === 'set' && session.answered >= SET_LENGTH) { endSession(); return; }
      beginNote();
    } else {
      const gotName = inp.midi != null ? nameOfMidi(inp.midi, strict) : nameOfMidi(heard, false);
      if (session.firstTry) {
        session.streak = 0;
        pn.miss++;
        const ck = `${nameOf(target.d, target.acc, octaveMatters())} read as ${gotName}`;
        session.confusions[ck] = (session.confusions[ck] || 0) + 1;
        // Same note again, three notes after this one (unless a copy is already coming up).
        if (!session.queue.slice(1, 5).some((q) => q.key === target.key)) {
          session.queue.splice(4, 0, finish({ clef: target.clef, d: target.d, acc: target.acc }));
        }
        $('hud-streak').textContent = '0';
      }
      session.firstTry = false;
      session.wrongMidi = inp.midi;
      const want = nameOf(target.d, target.acc, octaveMatters());
      const sameNameWrongOctave = mod(heard, 12) === mod(target.midi, 12);
      setFeedback(sameNameWrongOctave
        ? `Right name, wrong octave. This ${want} is ${target.midi > heard ? 'higher' : 'lower'}. Play it to go on.`
        : `That was ${gotName}. This is ${want}. Play ${want} to go on.`, 'bad');
      hintKey(target.midi);
      renderStaff(true);
    }
  }

  function endSession() {
    if (!session || session.ended) return;
    session.ended = true;
    teardownInputs();
    const s = db.settings;
    const elapsedMin = (s.session === 'sprint' ? SPRINT_MS : performance.now() - session.startAt) / 60000;
    const npm = session.answered ? session.correct / Math.max(elapsedMin, 0.05) : 0;
    const acc = session.attempts ? session.correct / session.attempts : 0;
    const sorted = session.times.slice().sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;

    $('r-npm').textContent = npm.toFixed(1);
    $('r-correct').textContent = `${session.correct}/${session.attempts}`;
    $('r-acc').textContent = Math.round(acc * 100) + '%';
    $('r-median').textContent = median != null ? (median / 1000).toFixed(2) + ' s' : '–';
    $('r-streak').textContent = session.bestStreak;

    const bk = bestKey();
    const prev = db.best[bk];
    const best = $('r-best');
    if (session.attempts >= 5 && (!prev || npm > prev)) {
      db.best[bk] = npm;
      best.textContent = prev ? `New best. Previous: ${prev.toFixed(1)}` : 'First score with these settings.';
    } else {
      best.textContent = prev ? `Best with these settings: ${prev.toFixed(1)}` : '';
    }
    $('result-eyebrow').textContent = session.attempts ? 'Session over' : 'Nothing answered';

    const conf = Object.entries(session.confusions).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const cUl = $('r-confusions');
    cUl.innerHTML = '';
    if (!conf.length) cUl.innerHTML = '<li class="empty">No mix-ups. Try the whole range or sharps and flats.</li>';
    for (const [k, n] of conf) {
      const li = document.createElement('li');
      li.textContent = k + (n > 1 ? ` ×${n}` : '');
      cUl.appendChild(li);
    }

    const slow = Object.values(session.perNote)
      .filter((p) => p.times.length || p.miss)
      .map((p) => ({ p, t: p.times.length ? p.times.reduce((a, b) => a + b, 0) / p.times.length : Infinity }))
      .sort((a, b) => b.t - a.t)
      .slice(0, 6);
    const sUl = $('r-slow');
    sUl.innerHTML = '';
    if (!slow.length) sUl.innerHTML = '<li class="empty">Not enough answers yet.</li>';
    for (const { p, t } of slow) {
      const li = document.createElement('li');
      const clefName = db.settings.clef === 'g' ? (p.it.clef === 't' ? ' (treble)' : ' (bass)') : '';
      li.textContent = `${nameOf(p.it.d, p.it.acc, true)}${clefName}  ${t === Infinity ? 'never right' : (t / 1000).toFixed(2) + ' s'}`;
      if (p.miss) {
        const b = document.createElement('b');
        b.textContent = `  ${p.miss} missed`;
        li.appendChild(b);
      }
      sUl.appendChild(li);
    }

    $('r-unlocked').textContent = session.unlocked.length
      ? 'Unlocked this session: ' + session.unlocked.map((it) => nameOf(it.d, 0, true)).join(', ')
      : '';
    save();
    show('result');
    $('again').focus();
  }

  // ---------- staff drawing ----------
  const SVGNS = 'http://www.w3.org/2000/svg';
  const S = 14; // space between staff lines
  function el(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function renderStaff(wrong) {
    const svg = $('staff');
    const clef = db.settings.clef;
    const W = 680;
    const staves = clef === 'g'
      ? [{ clef: 't', top: 62 }, { clef: 'b', top: 62 + 4 * S + 6 * S }]
      : [{ clef, top: 78 }];
    const H = staves[staves.length - 1].top + 4 * S + 84;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    const yOf = (d, st) => st.top + 4 * S - (d - STAFF_REF[st.clef]) * S / 2;
    const x0 = 14, x1 = W - 14;
    const xs = [];
    for (let i = 0; i < PREVIEW; i++) xs.push(180 + i * 106);

    // cursor band behind the note to read now
    const bandTop = staves[0].top - 3.5 * S;
    const bandBot = staves[staves.length - 1].top + 7.5 * S;
    el('rect', { class: 'cursor' + (wrong ? ' bad' : ''), x: xs[0] - 34, y: bandTop, width: 68, height: bandBot - bandTop, rx: 6 }, svg);

    for (const st of staves) {
      for (let l = 0; l < 5; l++) {
        const y = st.top + l * S;
        el('line', { class: 'st-line', x1: x0, x2: x1, y1: y, y2: y }, svg);
      }
      const glyph = el('text', { class: 'clef' }, svg);
      if (st.clef === 't') {
        // G clef: the curl wraps the G line (second from the bottom). Offsets tuned for Noto Music.
        glyph.setAttribute('x', x0 + 8);
        glyph.setAttribute('y', st.top + 3.8 * S);
        glyph.setAttribute('font-size', 4.3 * S);
        glyph.textContent = '\u{1D11E}';
      } else {
        // F clef: the dots straddle the F line (second from the top).
        glyph.setAttribute('x', x0 + 8);
        glyph.setAttribute('y', st.top + 3.5 * S);
        glyph.setAttribute('font-size', 4 * S);
        glyph.textContent = '\u{1D122}';
      }
    }
    if (staves.length > 1) {
      el('line', { class: 'st-bar', x1: x0, x2: x0, y1: staves[0].top, y2: staves[1].top + 4 * S }, svg);
    }
    el('line', { class: 'st-bar', x1: x1, x2: x1, y1: staves[0].top, y2: staves[staves.length - 1].top + 4 * S }, svg);

    session.queue.slice(0, PREVIEW).forEach((it, i) => {
      const st = staves.find((s) => s.clef === it.clef);
      const ref = STAFF_REF[it.clef];
      const x = xs[i];
      const y = yOf(it.d, st);
      const g = el('g', { class: 'note' + (i > 0 ? ' ahead' : '') + (i === 0 && wrong ? ' bad' : '') }, svg);
      for (let L = ref - 2; L >= it.d; L -= 2) {
        const ly = yOf(L, st);
        el('line', { class: 'ledger', x1: x - 15, x2: x + 15, y1: ly, y2: ly }, g);
      }
      for (let L = ref + 10; L <= it.d; L += 2) {
        const ly = yOf(L, st);
        el('line', { class: 'ledger', x1: x - 15, x2: x + 15, y1: ly, y2: ly }, g);
      }
      el('ellipse', { cx: x, cy: y, rx: 8.6, ry: 6.2, transform: `rotate(-20 ${x} ${y})` }, g);
      const up = it.d < ref + 4;
      if (up) el('line', { class: 'stem', x1: x + 7.8, x2: x + 7.8, y1: y - 2, y2: y - 3.5 * S }, g);
      else el('line', { class: 'stem', x1: x - 7.8, x2: x - 7.8, y1: y + 2, y2: y + 3.5 * S }, g);
      if (it.acc) {
        const a = el('text', { class: 'acc', x: x - 28, y: y + (it.acc === 1 ? 7 : 6), 'font-size': (it.acc === 1 ? 2.4 : 2.9) * S }, g);
        a.textContent = it.acc === 1 ? '♯' : '♭';
      }
      if (i === 0) {
        const below = staves[staves.length - 1].top + 4 * S + 66;
        const stt = peek(it.key);
        if (wrong) {
          el('text', { class: 'answer-name', x, y: below, 'text-anchor': 'middle' }, svg).textContent = nameOf(it.d, it.acc, octaveMatters());
        } else if (!stt || !stt.n) {
          el('text', { class: 'intro-name', x, y: below, 'text-anchor': 'middle' }, svg).textContent = nameOf(it.d, it.acc, octaveMatters()) + ' (new)';
        }
      }
    });
    const tgt = session.queue[0];
    svg.setAttribute('aria-label', `Note to read: ${tgt.clef === 't' ? 'treble' : 'bass'} clef, ${describePos(tgt)}`);
  }
  function describePos(it) {
    const off = it.d - STAFF_REF[it.clef];
    if (off < -1) {
      const n = Math.floor(-off / 2);
      return off % 2 === 0 ? `on ledger line ${n} below the staff` : `under ledger line ${n} below the staff`;
    }
    if (off > 9) {
      const n = Math.floor((off - 8) / 2);
      return off % 2 === 0 ? `on ledger line ${n} above the staff` : `over ledger line ${n} above the staff`;
    }
    return off % 2 === 0 ? `line ${off / 2 + 1} from the bottom` : `space ${(off + 1) / 2} from the bottom`;
  }

  function setFeedback(text, cls) {
    const f = $('feedback');
    f.textContent = text || ' ';
    f.className = 'feedback' + (cls ? ' ' + cls : '');
  }

  // ---------- piano ----------
  const keyEls = new Map();
  function pianoRange() {
    const all = groupsFor(db.settings.clef).flat().map((it) => it.d);
    let lo = Math.min(...all), hi = Math.max(...all);
    while (lo % 7 !== 0 && lo % 7 !== 3) lo--; // start on C or F
    while (hi % 7 !== 2 && hi % 7 !== 6) hi++; // end on E or B
    return [lo, hi];
  }
  function buildPiano() {
    const piano = $('piano');
    piano.innerHTML = '';
    keyEls.clear();
    const [lo, hi] = pianoRange();
    const whites = hi - lo + 1;
    piano.style.minWidth = whites * 26 + 'px';
    const labelAll = db.settings.labels;
    for (let d = lo; d <= hi; d++) {
      const m = midiOf(d, 0);
      const k = document.createElement('div');
      k.className = 'wk';
      k.dataset.midi = m;
      if (labelAll || d % 7 === 0) k.textContent = nameOf(d, 0, d % 7 === 0);
      piano.appendChild(k);
      keyEls.set(m, k);
    }
    for (let d = lo; d < hi; d++) {
      const li = d % 7;
      if (li === 2 || li === 6) continue;
      const m = midiOf(d, 1);
      const k = document.createElement('div');
      k.className = 'bk';
      k.dataset.midi = m;
      k.style.left = ((d - lo + 1) / whites * 100) + '%';
      k.style.width = (0.6 / whites * 100) + '%';
      piano.appendChild(k);
      keyEls.set(m, k);
    }
    // Keep middle C in view on narrow screens.
    const wrap = $('piano-wrap');
    const mc = keyEls.get(60);
    if (mc && wrap.scrollWidth > wrap.clientWidth) {
      requestAnimationFrame(() => { wrap.scrollLeft = mc.offsetLeft - wrap.clientWidth / 2; });
    }
  }
  $('piano').addEventListener('pointerdown', (e) => {
    const k = e.target.closest('.wk, .bk');
    if (!k) return;
    e.preventDefault();
    const m = +k.dataset.midi;
    k.classList.add('down');
    setTimeout(() => k.classList.remove('down'), 120);
    answer({ midi: m, source: 'piano' });
  });
  function flashKey(m, cls) {
    const k = keyEls.get(m);
    if (!k) return;
    k.classList.remove('ok', 'bad');
    void k.offsetWidth;
    k.classList.add(cls);
    setTimeout(() => k.classList.remove(cls), 260);
  }
  function hintKey(m) {
    const k = keyEls.get(m);
    if (k) k.classList.add('hint');
  }
  function clearHints() {
    for (const k of keyEls.values()) k.classList.remove('hint');
  }

  function renderKeysHint() {
    const s = db.settings;
    const h = $('keys-hint');
    if (s.input === 'keys') {
      h.innerHTML = s.names === 'solfege'
        ? 'Type <kbd>C</kbd><kbd>D</kbd><kbd>E</kbd><kbd>F</kbd><kbd>G</kbd><kbd>A</kbd><kbd>B</kbd> or <kbd>1</kbd>&ndash;<kbd>7</kbd> for Do&ndash;Si. <kbd>Shift</kbd> + key = sharp.'
        : 'Type <kbd>C</kbd><kbd>D</kbd><kbd>E</kbd><kbd>F</kbd><kbd>G</kbd><kbd>A</kbd><kbd>B</kbd>. <kbd>Shift</kbd> + letter = sharp (D♭ is <kbd>Shift</kbd>+<kbd>C</kbd>).';
    } else if (s.input === 'piano') {
      h.textContent = 'Click the key. Letter keys work too, but ignore the octave.';
    } else {
      h.textContent = '';
    }
  }

  // ---------- keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (current === 'play') {
      if (e.key === 'Escape') { e.preventDefault(); endSession(); return; }
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      let li = -1;
      if (e.key.length === 1) li = 'cdefgab'.indexOf(e.key.toLowerCase());
      const dm = /^(Digit|Numpad)([1-7])$/.exec(e.code);
      if (li < 0 && dm) li = +dm[2] - 1;
      if (li >= 0) {
        e.preventDefault();
        answer({ pc: mod(PCS[li] + (e.shiftKey ? 1 : 0), 12), source: 'keys' });
      }
    } else if (current === 'menu') {
      if (e.key === 'Enter' && !e.target.closest('button, a')) { e.preventDefault(); startSession(); }
    } else if (current === 'result') {
      if (e.key === 'Escape') { e.preventDefault(); toMenu(); }
      else if (e.key === 'Enter' && !e.target.closest('button, a')) { e.preventDefault(); startSession(); }
    }
  });

  // ---------- MIDI ----------
  const midi = { access: null, error: null, pending: null };
  function midiInputNames() {
    if (!midi.access) return [];
    return Array.from(midi.access.inputs.values()).filter((i) => i.state !== 'disconnected').map((i) => i.name || 'MIDI input');
  }
  function bindMidiInputs() {
    for (const input of midi.access.inputs.values()) input.onmidimessage = onMidiMessage;
  }
  function initMidi() {
    if (!navigator.requestMIDIAccess || midi.access || midi.pending) return midi.pending;
    midi.pending = navigator.requestMIDIAccess().then((access) => {
      midi.access = access;
      midi.error = null;
      bindMidiInputs();
      access.onstatechange = () => { bindMidiInputs(); updateInputHint(); renderInputStatus(); };
      updateInputHint();
      renderInputStatus();
    }, (err) => {
      midi.error = (err && err.message) || 'permission denied';
      midi.pending = null;
      updateInputHint();
      renderInputStatus();
    });
    return midi.pending;
  }
  function onMidiMessage(ev) {
    const [status, note, vel] = ev.data;
    if ((status & 0xf0) === 0x90 && vel > 0) answer({ midi: note, source: 'midi' });
  }

  // ---------- microphone ----------
  const mic = { stream: null, src: null, an: null, buf: null, raf: 0, frame: 0, candidate: null, count: 0, lastFired: null, quiet: 0, rmsAvg: 0, error: null };
  const MIC_ON = 0.012;   // RMS needed before pitch is trusted
  const MIC_QUIET = 0.006; // below this the note has stopped
  async function startMic() {
    const status = $('input-status');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      mic.error = 'This browser cannot use the microphone here (it needs HTTPS).';
      renderInputStatus();
      return;
    }
    try {
      const c = audio();
      mic.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      if (!session || session.ended) { stopMic(); return; }
      mic.src = c.createMediaStreamSource(mic.stream);
      mic.an = c.createAnalyser();
      mic.an.fftSize = 2048;
      mic.buf = new Float32Array(mic.an.fftSize);
      mic.src.connect(mic.an);
      mic.error = null;
      mic.candidate = null; mic.count = 0; mic.lastFired = null; mic.quiet = 0;
      status.classList.remove('warn');
      status.innerHTML = '<span>Listening</span><span class="meter"><i id="mic-level"></i></span><span>hearing <span class="heard" id="mic-heard">&ndash;</span></span>';
      micLoop();
    } catch (err) {
      mic.error = err && err.name === 'NotAllowedError'
        ? 'Microphone access was denied. Allow it in the address bar, then start again.'
        : 'No microphone available: ' + ((err && err.message) || 'unknown error');
      renderInputStatus();
    }
  }
  function stopMic() {
    cancelAnimationFrame(mic.raf);
    if (mic.src) mic.src.disconnect();
    if (mic.stream) mic.stream.getTracks().forEach((t) => t.stop());
    mic.stream = mic.src = mic.an = null;
  }
  function micLoop() {
    mic.raf = requestAnimationFrame(micLoop);
    if (++mic.frame % 2) return; // ~30 detections a second is plenty
    mic.an.getFloatTimeDomainData(mic.buf);
    const r = detectPitch(mic.buf, actx.sampleRate);
    const lvl = document.getElementById('mic-level');
    if (lvl) lvl.style.width = Math.min(100, r.rms * 900) + '%';
    const heardEl = document.getElementById('mic-heard');

    // A sudden jump in loudness is a new attack, even on the same pitch.
    const attack = r.rms > MIC_ON && r.rms > mic.rmsAvg * 2.2;
    mic.rmsAvg = mic.rmsAvg * 0.7 + r.rms * 0.3;
    if (attack) { mic.lastFired = null; mic.count = 0; }

    if (r.rms < MIC_QUIET) {
      if (++mic.quiet >= 3) mic.lastFired = null;
      mic.candidate = null; mic.count = 0;
      if (heardEl) heardEl.textContent = '–';
      return;
    }
    mic.quiet = 0;
    if (r.rms < MIC_ON || r.clarity < 0.86 || r.freq < 50 || r.freq > 2200) { mic.count = 0; return; }
    const m = Math.round(69 + 12 * Math.log2(r.freq / 440));
    if (heardEl) heardEl.textContent = nameOfMidi(m, true);
    if (m === mic.candidate) mic.count++;
    else { mic.candidate = m; mic.count = 1; }
    if (mic.count === 3 && m !== mic.lastFired) {
      mic.lastFired = m;
      answer({ midi: m, source: 'mic' });
    }
  }

  // McLeod pitch method: normalised square difference, take the first peak close to the highest one.
  // Picking the first strong peak rather than the absolute max is what avoids most octave-down errors.
  const nsdf = new Float32Array(1024);
  function detectPitch(buf, sr) {
    const n = buf.length;
    let rms = 0;
    for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / n);
    if (rms < MIC_ON) return { rms, freq: 0, clarity: 0 };
    const maxLag = Math.min(Math.floor(sr / 48), n >> 1, nsdf.length);
    for (let t = 0; t < maxLag; t++) {
      let ac = 0, m = 0;
      for (let j = 0, lim = n - t; j < lim; j++) {
        const a = buf[j], b = buf[j + t];
        ac += a * b;
        m += a * a + b * b;
      }
      nsdf[t] = m > 0 ? (2 * ac) / m : 0;
    }
    let t = 1;
    while (t < maxLag && nsdf[t] > 0) t++;
    const peaks = [];
    let best = 0;
    while (t < maxLag) {
      while (t < maxLag && nsdf[t] <= 0) t++;
      let pk = -1, pv = -Infinity;
      while (t < maxLag && nsdf[t] > 0) {
        if (nsdf[t] > pv) { pv = nsdf[t]; pk = t; }
        t++;
      }
      if (pk > 0 && t < maxLag) { peaks.push(pk); if (pv > best) best = pv; }
    }
    if (!peaks.length) return { rms, freq: 0, clarity: 0 };
    const chosen = peaks.find((p) => nsdf[p] >= 0.9 * best);
    const a = nsdf[chosen - 1], b = nsdf[chosen], c = nsdf[chosen + 1];
    const den = a - 2 * b + c;
    const shift = den ? (a - c) / (2 * den) : 0;
    return { rms, freq: sr / (chosen + shift), clarity: b };
  }

  // ---------- input lifecycle ----------
  function setupInputs() {
    const s = db.settings;
    const status = $('input-status');
    status.className = 'input-status';
    status.textContent = '';
    if (s.input === 'mic') {
      status.textContent = 'Asking for the microphone…';
      startMic();
    } else if (s.input === 'midi') {
      status.textContent = 'Connecting to MIDI…';
      // initMidi returns the same settled promise once access exists, so this also covers later sessions.
      Promise.resolve(initMidi()).then(renderInputStatus);
    }
  }
  function renderInputStatus() {
    if (current !== 'play') return;
    const s = db.settings;
    const status = $('input-status');
    status.className = 'input-status';
    if (s.input === 'midi') {
      if (!navigator.requestMIDIAccess) {
        status.classList.add('warn');
        status.textContent = "No Web MIDI in this browser. Use the screen piano, or open this page in Chrome or Edge.";
      } else if (midi.error) {
        status.classList.add('warn');
        status.textContent = 'MIDI blocked: ' + midi.error;
      } else if (midi.access) {
        const names = midiInputNames();
        if (names.length) status.textContent = 'MIDI: ' + names.join(', ');
        else { status.classList.add('warn'); status.textContent = 'No MIDI keyboard connected. Plug one in, it will be picked up straight away.'; }
      }
    } else if (s.input === 'mic' && mic.error) {
      status.classList.add('warn');
      status.textContent = mic.error;
    }
  }
  function teardownInputs() {
    stopMic();
  }

  function toMenu() {
    if (session && !session.ended) { session.ended = true; teardownInputs(); }
    show('menu');
    syncForm();
  }

  // ---------- buttons ----------
  $('start').addEventListener('click', startSession);
  $('again').addEventListener('click', startSession);
  $('to-menu').addEventListener('click', toMenu);
  $('quit').addEventListener('click', endSession);
  window.addEventListener('pagehide', () => { stopMic(); save(); });

  if (db.settings.input === 'midi') initMidi();
  syncForm();
})();
