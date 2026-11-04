KV.ready.then(() => {
  'use strict';

  // ---------- music basics ----------
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  const PCS = [0, 2, 4, 5, 7, 9, 11];
  const SHARP_NAMES = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]];
  const FLAT_NAMES = [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];

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
  // Notes other notes are explained from, most useful first. The first group's are always known; the rest
  // become reference points once they are mastered themselves.
  const LANDMARKS = { t: ['G4', 'C4', 'C5', 'G5', 'C6'], b: ['F3', 'C4', 'C3', 'F2', 'C2'] };
  const MARK_NAMES = {
    tC4: 'middle %', bC4: 'middle %', tG4: 'the % line', bF3: 'the % line',
    tC5: 'the % in space 3', bC3: 'the % in space 2', tG5: 'the % just above the staff', bF2: 'the % just below the staff',
    tC6: 'the % on ledger line 2', bC2: 'the % on ledger line 2',
  };
  const MARK_SPOTS = {
    tG4: 'on line 2, where the clef curls', bF3: "on line 4, between the clef's dots",
    tC4: 'middle %, on the ledger line just below the staff', bC4: 'middle %, on the ledger line just above the staff',
  };

  // Key signatures by number of sharps (+) or flats (-), and where each sign sits on the staff.
  const KEY_SIGS = { C: 0, G: 1, D: 2, A: 3, F: -1, Bb: -2, Eb: -3 };
  const SHARP_ORDER = 'FCGDAEB';
  const FLAT_ORDER = 'BEADGCF';
  const SIG_POS = {
    t: { 1: ['F5', 'C5', 'G5', 'D5', 'A4', 'E5', 'B4'], '-1': ['B4', 'E5', 'A4', 'D5', 'G4', 'C5', 'F4'] },
    b: { 1: ['F3', 'C3', 'G3', 'D3', 'A2', 'E3', 'B2'], '-1': ['B2', 'E3', 'A2', 'D3', 'G2', 'C3', 'F2'] },
  };

  // Answer counts as fast under this many ms. Mic and MIDI get slack for finding the key / detection lag.
  const FAST_MS = { piano: 2500, keys: 2000, midi: 2500, mic: 3000 };
  // The bar for moving up out of each box, as a share of FAST_MS: fluent means about twice as fast as "got it".
  const SPEED = [1, 1, 1, 0.72, 0.5, 0.5, 0.5];
  const MASTER_BOX = 3;
  const MAX_BOX = 6;
  // Time since the last move up before a note may enter each box. Boxes 1-3 can be earned in one sitting, but
  // with some forgetting in between; 4-6 only on later days, so "fluent" means it held up overnight.
  const PROMOTE_GAP = [0, 0, 15e3, 45e3, 8 * 3600e3, 2 * 24 * 3600e3, 5 * 24 * 3600e3];
  // How long a note in each box can rest before it counts as due again.
  const INTERVALS = [1, 60e3, 5 * 60e3, 30 * 60e3, 24 * 3600e3, 3 * 24 * 3600e3, 7 * 24 * 3600e3];
  const BOX_WEIGHT = [8, 5, 3, 2, 1.3, 0.9, 0.7];
  // Melodic order: weight by distance in staff steps from the previous note (index 7 = octave).
  const MOTION_W = [0.02, 6, 3.5, 1.2, 1, 0.4, 0.4, 0.3];
  const PREVIEW = 5;
  const SET_LENGTH = 40;
  const SPRINT_MS = 60e3;
  const COUNT_IN = 4;
  const STEP_WORDS = ['', 'a step', 'a skip', 'a 4th', 'a 5th', 'a 6th', 'a 7th', 'an octave'];
  const stepWord = (n) => STEP_WORDS[n] || 'more than an octave';

  const ERR_LABELS = {
    step: 'a step off', skip: 'a skip off', leap: 'further off', octave: 'wrong octave',
    accidental: 'wrong sharp or flat', clef: 'read in the other clef', late: 'too late',
  };
  const ERR_TIPS = {
    step: 'Step misses mean line and space got mixed up. Before you play, check: does a line go through the note, or does it sit between two lines?',
    skip: 'Skip misses mean a line or space got counted twice or skipped. Count from the nearest landmark, not from the bottom of the staff.',
    leap: 'Big misses are usually guesses. Slow down until you are right first time; speed comes after.',
    octave: 'Right name, wrong octave. Count the ledger lines and check which staff the note is on.',
    accidental: 'Look left of the note before you play: ♯ is the black key just right, ♭ the one just left. With a key signature, every note on that letter changes.',
    clef: "The same spot is a different note in each clef. In bass clef, anchor on the F line between the clef's dots; in treble, on the G line where the clef curls.",
    late: 'Notes slipped past the click. Look at the next note while you play this one, or pick a slower pulse.',
  };

  function groupsFor(clef) {
    if (clef === 'g') {
      return GROUPS.t.map((g, i) => [
        ...g.map((n) => ({ clef: 't', d: dia(n) })),
        ...GROUPS.b[i].map((n) => ({ clef: 'b', d: dia(n) })),
      ]);
    }
    return GROUPS[clef].map((g) => g.map((n) => ({ clef, d: dia(n) })));
  }
  // A note read through the key signature is tracked apart from the same note written with its own sign.
  function keyOf(it) {
    return it.clef + ':' + LETTERS[it.d % 7] + (it.acc === 1 ? '#' : it.acc === -1 ? 'b' : '') + Math.floor(it.d / 7) + (it.fromKey ? 'k' : '');
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

  function keyAcc(d) {
    const n = KEY_SIGS[db.settings.key] || 0;
    const L = LETTERS[d % 7];
    if (n > 0 && SHARP_ORDER.slice(0, n).includes(L)) return 1;
    if (n < 0 && FLAT_ORDER.slice(0, -n).includes(L)) return -1;
    return 0;
  }
  // A staff position as it is read in the current key: an F in G major is an F sharp, written without a sign.
  function inKey(pos) {
    const acc = keyAcc(pos.d);
    return { clef: pos.clef, d: pos.d, acc, fromKey: acc !== 0 };
  }
  const homeKey = (pos) => keyOf(inKey(pos));

  // ---------- storage ----------
  const STORE_KEY = 'notes-trainer.v1';
  const SCHEMA = 2;
  const DEFAULTS = {
    settings: { input: 'piano', clef: 't', pool: 'adaptive', order: 'random', pulse: 0, key: 'C', session: 'sprint', names: 'letters', accidentals: false, octave: true, sound: true, labels: false },
    stats: {},
    progress: { t: 1, b: 1, g: 1 },
    best: {},
    schema: SCHEMA,
  };
  const db = load();
  function load() {
    try {
      const raw = JSON.parse(KV.getItem(STORE_KEY));
      if (raw && typeof raw === 'object') {
        return migrate({
          settings: { ...DEFAULTS.settings, ...raw.settings },
          stats: raw.stats || {},
          progress: { ...DEFAULTS.progress, ...raw.progress },
          best: raw.best || {},
          schema: raw.schema || 1,
        });
      }
    } catch (e) { /* private mode or corrupt data: start fresh */ }
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  // Schema 1 moved a note up on every fast answer, so a note could reach "fluent" inside one minute.
  // Keep what unlocked notes, but the levels above that have to be earned again on later days.
  function migrate(d) {
    if (d.schema < 2) {
      for (const st of Object.values(d.stats)) {
        st.box = Math.min(st.box || 0, MASTER_BOX);
        st.up = st.last || 0;
      }
      d.schema = 2;
    }
    return d;
  }
  function save() {
    try { KV.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
  }
  const peek = (k) => db.stats[k];
  function stat(k) {
    return db.stats[k] || (db.stats[k] = { box: 0, n: 0, ok: 0, ema: 0, last: 0, up: 0 });
  }
  // The time a note has to beat to move up from where it is now.
  const fastFor = (st) => FAST_MS[db.settings.input] * SPEED[st ? st.box : 0];

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
    for (const name of ['input', 'clef', 'pool', 'order', 'pulse', 'key', 'session', 'names']) {
      const el = form.querySelector(`input[name="${name}"][value="${s[name]}"]`);
      if (el) el.checked = true;
    }
    for (const name of ['accidentals', 'octave', 'sound', 'labels']) form.elements[name].checked = !!s[name];
    form.elements.octave.disabled = s.input === 'keys';
    form.elements.sound.disabled = s.input === 'mic';
    form.elements.accidentals.disabled = s.key !== 'C';
    updateInputHint();
    updateReadingHints();
    renderMaps();
    renderBestLine();
  }
  form.addEventListener('change', (e) => {
    const el = e.target;
    const s = db.settings;
    if (el.type === 'radio') {
      s[el.name] = el.name === 'pulse' ? +el.value : el.value;
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
    else if (s.input === 'keys') hint.textContent = 'Type the letter: C D E F G A B, or 1 to 7 for Do to Si. Shift + letter for a sharp, hold Space for a flat. Octave is ignored.';
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

  function updateReadingHints() {
    const s = db.settings;
    $('order-hint').textContent = s.order === 'melodic'
      ? 'Each note is mostly a step or a skip from the one before, like a tune. With only the first three notes unlocked it can only jump.'
      : '';
    $('pulse-hint').textContent = s.pulse
      ? `A click every ${(60 / s.pulse).toFixed(1)} s. Play each note before the next click. The notes move on either way, and a missed one comes back later.`
      : '';
    const n = KEY_SIGS[s.key] || 0;
    if (!n) {
      $('key-hint').textContent = '';
    } else {
      const letters = (n > 0 ? SHARP_ORDER : FLAT_ORDER).slice(0, Math.abs(n)).split('').map((L) => LETTERS.indexOf(L));
      const list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0]);
      const plain = list(letters.map((li) => nameOf(li, 0, false)));
      const altered = list(letters.map((li) => nameOf(li, n > 0 ? 1 : -1, false)));
      $('key-hint').textContent = `Every ${plain} is played as ${altered}, in every octave. The sign is written once, at the start of the staff. Extra sharps and flats are off.`;
    }
  }

  function noteClass(st) {
    if (!st || !st.n) return 'new';
    if (st.box >= 5) return 'fluent';
    if (st.box >= MASTER_BOX) return 'ok';
    return 'weak';
  }
  function formatWait(ms) {
    if (ms < 90e3) return Math.ceil(ms / 1000) + ' s';
    if (ms < 90 * 60e3) return Math.ceil(ms / 60e3) + ' min';
    if (ms < 36 * 3600e3) return Math.ceil(ms / 3600e3) + ' h';
    return Math.ceil(ms / 86400e3) + ' days';
  }
  function levelInfo(st) {
    const parts = [`${st.ok}/${st.n} right`];
    if (st.ema) parts.push(`typical ${(st.ema / 1000).toFixed(1)} s`);
    parts.push(`level ${st.box} of ${MAX_BOX}`);
    let s = parts.join(', ');
    if (st.box < MAX_BOX) {
      s += `. Next level: right in under ${(fastFor(st) / 1000).toFixed(1)} s`;
      const wait = PROMOTE_GAP[st.box + 1] - (Date.now() - (st.up || 0));
      if (wait > 0) s += `, ${formatWait(wait)} from now or later`;
    }
    return s;
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
        const info = st && st.n ? levelInfo(st) : it.locked ? 'locked' : 'not seen yet';
        span.title = `${nameOf(it.d, 0, true)}: ${info}`;
        el.appendChild(span);
      }
    }
  }
  // Scores are only compared with sessions that had the same notes in play: more notes is slower, not worse.
  function bestKey() {
    const s = db.settings;
    const parts = [s.clef, s.session, s.pool];
    if (s.pool === 'adaptive') parts.push('g' + db.progress[s.clef]);
    if (s.order === 'melodic') parts.push('mel');
    if (s.pulse) parts.push(s.pulse + 'bpm');
    if (s.key !== 'C') parts.push('k' + s.key);
    else if (s.accidentals) parts.push('acc');
    return parts.join('-');
  }
  function renderBestLine() {
    const b = db.best[bestKey()];
    $('best-line').textContent = b ? `Best with these settings and ${naturalPool().length} notes in play: ${b.toFixed(1)} correct notes per minute` : '';
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
  // Metronome click: filtered noise, not a tone, so the microphone's pitch detector never takes it for a note.
  let noiseBuf = null;
  function click(accent) {
    const c = audio();
    if (!c) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.03), c.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
    }
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = accent ? 3200 : 2200;
    bp.Q.value = 1.2;
    const g = c.createGain();
    g.gain.value = accent ? 0.9 : 0.55;
    src.connect(bp).connect(g).connect(c.destination);
    src.start(c.currentTime);
  }

  // ---------- note selection ----------
  function naturalPool() {
    const s = db.settings;
    const groups = groupsFor(s.clef);
    const unlocked = groups.slice(0, db.progress[s.clef]).flat();
    if (s.pool === 'all') return groups.flat();
    if (s.pool === 'weak') {
      const seen = groups.flat().filter((it) => { const st = peek(homeKey(it)); return st && st.n; });
      if (seen.length < 6) return unlocked;
      const score = (it) => {
        const st = peek(homeKey(it));
        return st.box * 1000 - st.ema - (1 - st.ok / st.n) * 3000;
      };
      return seen.sort((a, b) => score(a) - score(b)).slice(0, 6);
    }
    return unlocked;
  }

  // The forms a staff position can be asked in, with how often each should come up.
  function variants(pos) {
    const base = inKey(pos);
    if (db.settings.key !== 'C' || !db.settings.accidentals) return [{ ...base, prior: 1 }];
    const L = LETTERS[pos.d % 7];
    const alts = [];
    if ('CDFGA'.includes(L)) alts.push(1);
    if ('DEGAB'.includes(L)) alts.push(-1);
    return [{ ...base, prior: 0.65 }, ...alts.map((acc) => ({ clef: pos.clef, d: pos.d, acc, fromKey: false, prior: 0.35 / alts.length }))];
  }

  function learnWeight(st, now) {
    if (!st || !st.n) return 7;
    let w = BOX_WEIGHT[st.box];
    if (st.box > 0) w *= clamp((now - st.last) / INTERVALS[st.box], 0.5, 3);
    if (st.ema > fastFor(st)) w *= 1.6;
    return w;
  }

  function motionWeight(prev, prev2, c) {
    const step = c.d - prev.d;
    const size = Math.abs(step);
    let w = size < MOTION_W.length ? MOTION_W[size] : 0.1;
    if (prev2 && size) {
      const last = prev.d - prev2.d;
      // Tunes keep going the way they were going, and turn back after a leap.
      if (Math.abs(last) >= 3) { if (Math.sign(step) === -Math.sign(last)) w *= 2; }
      else if (last && Math.sign(step) === Math.sign(last)) w *= 1.5;
    }
    if (c.clef !== prev.clef) w *= 0.5;
    return w;
  }

  function pickNext() {
    const s = db.settings;
    const now = Date.now();
    const q = session.queue;
    const prev = q[q.length - 1];
    const prev2 = q[q.length - 2];
    const melodic = s.order === 'melodic' && prev;
    const spread = session.pool.length > 2;
    const recent = q.slice(-2).map((it) => it.clef + it.d);
    const cands = session.pool.flatMap(variants);
    let total = 0;
    const ws = cands.map((c) => {
      let w = c.prior * learnWeight(peek(keyOf(c)), now);
      // In melodic order the distance from the last note decides most of it; how well a note is known only nudges.
      if (melodic) w = Math.sqrt(w) * motionWeight(prev, prev2, c);
      else if (recent.includes(c.clef + c.d)) w *= spread ? 0.03 : 0.3;
      total += w;
      return w;
    });
    // No single note may take more than about half the turns, or a stubborn miss crowds out the rest.
    if (spread) {
      for (let j = 0; j < ws.length; j++) {
        const cap = total - ws[j];
        if (ws[j] > cap) { total -= ws[j] - cap; ws[j] = cap; }
      }
    }
    let r = Math.random() * total;
    let i = 0;
    for (; i < ws.length - 1; i++) { r -= ws[i]; if (r <= 0) break; }
    const c = cands[i];
    return finish({ clef: c.clef, d: c.d, acc: c.acc, fromKey: c.fromKey });
  }
  function finish(it) {
    it.midi = midiOf(it.d, it.acc);
    it.key = keyOf(it);
    return it;
  }

  // Notes that must come back at a set point in the sequence (misses, newly unlocked notes) wait here
  // until the queue reaches that point, so they never land among the notes already on screen.
  function schedule(it, at) {
    const key = keyOf(it);
    if (session.pending.some((p) => p.key === key && Math.abs(p.at - at) < 4)) return;
    session.pending.push({ key, at, it: { clef: it.clef, d: it.d, acc: it.acc, fromKey: !!it.fromKey } });
    session.pending.sort((a, b) => a.at - b.at);
  }
  function nextItem() {
    const seq = session.pushed;
    const tail = session.queue[session.queue.length - 1];
    const i = session.pending.findIndex((p) => p.at <= seq && !(tail && tail.key === p.key));
    const it = i >= 0 ? finish({ ...session.pending.splice(i, 1)[0].it }) : pickNext();
    it.seq = session.pushed++;
    return it;
  }
  function refill() {
    while (session.queue.length < PREVIEW) session.queue.push(nextItem());
  }
  // A missed note comes back twice: right after the notes already on screen, then again about a dozen notes on.
  function scheduleRetry(target) {
    const q = session.queue;
    let ahead = false;
    for (let i = 1; i < q.length; i++) {
      if (q[i].key !== target.key) continue;
      // A copy already on screen would be read while the answer is still showing, so swap it for another note.
      // With a pulse the eyes may already have read it; leave it and let it stand in for the first retry.
      if (session.pulse) { ahead = true; continue; }
      let fresh = pickNext();
      for (let guard = 0; fresh.key === target.key && guard < 10; guard++) fresh = pickNext();
      fresh.seq = q[i].seq;
      q[i] = fresh;
    }
    if (!ahead) schedule(target, target.seq + PREVIEW + Math.floor(Math.random() * 2));
    schedule(target, target.seq + 11 + Math.floor(Math.random() * 3));
  }

  function checkUnlock() {
    const s = db.settings;
    if (s.pool !== 'adaptive') return;
    const groups = groupsFor(s.clef);
    const n = db.progress[s.clef];
    if (n >= groups.length) return;
    const ready = groups.slice(0, n).flat().every((it) => {
      const st = peek(homeKey(it));
      return st && st.box >= MASTER_BOX;
    });
    if (!ready) return;
    db.progress[s.clef] = n + 1;
    const fresh = groups[n];
    session.pool = naturalPool();
    session.unlocked.push(...fresh);
    // Let the new notes appear soon, but after the notes already visible.
    fresh.forEach((it, i) => schedule(inKey(it), session.pushed + i * 2 + Math.floor(Math.random() * 2)));
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

  // ---------- explanations ----------
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
    return off % 2 === 0 ? `on line ${off / 2 + 1} from the bottom` : `in space ${(off + 1) / 2} from the bottom`;
  }

  // Where a note sits, said as a distance from the nearest landmark the player already knows.
  function relation(it) {
    const first = GROUPS[it.clef][0];
    let best = null;
    for (const n of LANDMARKS[it.clef]) {
      const d = dia(n);
      if (!first.includes(n)) {
        const st = peek(homeKey({ clef: it.clef, d }));
        if (!st || st.box < MASTER_BOX) continue;
      }
      if (!best || Math.abs(it.d - d) < Math.abs(it.d - best.d)) best = { n, d };
    }
    // Far from every landmark (high and low ledger notes): measure from a closer note that is already mastered.
    let near = null;
    if (Math.abs(it.d - best.d) > 2) {
      for (const n of GROUPS[it.clef].flat()) {
        const d = dia(n);
        const st = peek(homeKey({ clef: it.clef, d }));
        if (d === it.d || !st || st.box < MASTER_BOX) continue;
        if (Math.abs(it.d - d) < Math.abs(it.d - (near ? near.d : best.d))) near = { clef: it.clef, d };
      }
    }
    const L = nameOf(it.d, 0, false);
    const ref = near || best;
    const off = it.d - ref.d;
    const refName = near
      ? `the ${nameOf(near.d, 0, false)} ${describePos(near)}`
      : MARK_NAMES[it.clef + best.n].replace('%', nameOf(best.d, 0, false));
    let text = off === 0
      ? `${L} is ${(MARK_SPOTS[it.clef + best.n] || describePos(it)).replace('%', L)}`
      : `${L} is ${stepWord(Math.abs(off))} ${off > 0 ? 'above' : 'below'} ${refName}`;
    if (it.fromKey) text += `; the key makes it ${nameOf(it.d, it.acc, false)}`;
    else if (it.acc) text += it.acc === 1 ? ', then ♯: one key right' : ', then ♭: one key left';
    return text;
  }

  // Spell a played pitch with the letter closest to the note asked for, so a black key next to the
  // right spot reads as "right spot, wrong sign" and not as a different note.
  function spell(m, near) {
    const oct = Math.floor(m / 12) - 1;
    const opts = [SHARP_NAMES[mod(m, 12)], FLAT_NAMES[mod(m, 12)]].map(([li, acc]) => ({ d: oct * 7 + li, acc }));
    return opts.reduce((a, b) => (Math.abs(b.d - near) < Math.abs(a.d - near) ? b : a));
  }

  // What kind of misreading a wrong answer was: each kind has its own cause and its own fix.
  function describeError(target, heard, strict) {
    const want = nameOf(target.d, target.acc, octaveMatters());
    // Without octaves, compare against the copy of the played note nearest the target.
    if (!strict) heard = target.midi + ((mod(heard - target.midi, 12) + 6) % 12) - 6;
    const got = spell(heard, target.d);
    const gotName = nameOf(got.d, got.acc, strict);
    const dd = got.d - target.d;
    const dir = dd > 0 ? 'high' : 'low';
    const onLine = mod(target.d - STAFF_REF[target.clef], 2) === 0;
    if (mod(heard, 12) === mod(target.midi, 12)) {
      return { type: 'octave', gotName, text: `Right name, wrong octave. This ${want} is ${target.midi > heard ? 'higher' : 'lower'}.` };
    }
    if (dd === 0) {
      let text;
      if (target.fromKey) text = `That was ${gotName}. The key signature makes every ${nameOf(target.d, 0, false)} a ${nameOf(target.d, target.acc, false)}.`;
      else if (target.acc) text = `That was ${gotName}. Right spot, but there's a ${target.acc === 1 ? '♯: the black key just right' : '♭: the black key just left'} of it.`;
      else text = `That was ${gotName}. Right spot, but there's no sign: play the white key.`;
      return { type: 'accidental', gotName, text };
    }
    // Reading bass clef as treble puts every note two letters low; treble as bass, two letters high.
    const otherClef = target.clef === 'b' ? mod(dd, 7) === 5 : db.settings.clef === 'g' && mod(dd, 7) === 2;
    if (otherClef) {
      const [other, own] = target.clef === 'b' ? ['treble', 'bass'] : ['bass', 'treble'];
      return { type: 'clef', gotName, text: `That was ${gotName}: what this spot is in ${other} clef. In ${own} clef it's ${want}.` };
    }
    const n = Math.abs(dd);
    if (n === 1) return { type: 'step', gotName, text: `That was ${gotName}: a step too ${dir}. This note sits ${onLine ? 'on a line' : 'in a space'}.` };
    if (n === 2) return { type: 'skip', gotName, text: `That was ${gotName}: a skip too ${dir}, one ${onLine ? 'line' : 'space'} off.` };
    return { type: 'leap', gotName, text: `That was ${gotName}: ${stepWord(n)} too ${dir}.` };
  }

  // ---------- session ----------
  let session = null;
  function startSession() {
    audio();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const s = db.settings;
    const beatMs = s.pulse ? 60000 / s.pulse : 0;
    const lead = beatMs ? 400 : 0;
    const now = performance.now();
    session = {
      pool: naturalPool(),
      queue: [],
      pending: [],
      pushed: 0,
      t0: 0,
      firstTry: true,
      introduced: false,
      resolved: false,
      state: null,
      correct: 0,
      attempts: 0,
      answered: 0,
      streak: 0,
      bestStreak: 0,
      times: [],
      perNote: {},
      confusions: {},
      errTypes: {},
      unlocked: [],
      bestKey: bestKey(),
      inPlay: 0,
      pulse: !!beatMs,
      beatMs,
      beat: -1,
      beat0: now + lead,
      countIn: !!beatMs,
      // With a pulse, the clock starts after the count-in.
      startAt: now + lead + (beatMs ? COUNT_IN * beatMs : 0),
      ended: false,
    };
    session.inPlay = session.pool.length;
    refill();
    show('play');
    buildPiano();
    $('hud-score').textContent = '0';
    $('hud-streak').textContent = '0';
    $('hud-last').textContent = '–';
    $('hud-last').className = 'hud-val';
    $('hud-pool').textContent = session.pool.length;
    $('hud-clock-label').textContent = s.session === 'sprint' ? 'Time' : s.session === 'set' ? 'Left' : 'Elapsed';
    setFeedback(session.pulse ? 'Play each note before the next click.' : '', '');
    renderKeysHint();
    setupInputs();
    if (session.pulse) renderStaff();
    else beginNote();
    tickClock();
  }

  function beginNote(tick) {
    const st = peek(session.queue[0].key);
    session.t0 = performance.now();
    session.firstTry = true;
    session.resolved = false;
    session.introduced = !(st && st.n);
    session.state = null;
    clearHints();
    renderStaff(tick);
  }

  function advance() {
    session.queue.shift();
    refill();
    session.answered++;
    checkUnlock();
    save();
    if (db.settings.session === 'set' && session.answered >= SET_LENGTH) { endSession(); return; }
    beginNote(session.pulse);
  }

  function tickClock() {
    if (!session || session.ended) return;
    const now = performance.now();
    if (session.pulse) {
      pulseTick(now);
      if (session.ended) return;
    }
    const s = db.settings;
    const el = $('hud-clock');
    const elapsed = Math.max(0, now - session.startAt);
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

  // ---------- pulse ----------
  function pulseTick(now) {
    const b = Math.floor((now - session.beat0) / session.beatMs);
    if (b <= session.beat) return;
    if (session.beat >= 0 && b > session.beat + 2) {
      // The tab was in the background: carry on from where it stopped instead of failing every beat in between.
      const skip = (b - session.beat - 1) * session.beatMs;
      session.beat0 += skip;
      session.startAt += skip;
    }
    session.beat++;
    onBeat(session.beat);
  }
  function onBeat(b) {
    click(b % 4 === 0);
    if (b < COUNT_IN) {
      setFeedback(`Starts in ${COUNT_IN - b}`, '');
      renderStaff(true);
      return;
    }
    if (b === COUNT_IN) {
      session.countIn = false;
      setFeedback('', '');
      beginNote(true);
      return;
    }
    if (!session.resolved) timeoutMiss();
    advance();
  }
  function timeoutMiss() {
    const target = session.queue[0];
    const pn = perNote(target);
    const st = stat(target.key);
    const now = Date.now();
    session.attempts++;
    pn.n++;
    pn.miss++;
    st.n++;
    st.last = now;
    // One level down, not two: a wrong key is a misreading, a late one may just be a slow reading.
    st.box = Math.max(0, st.box - 1);
    st.up = now;
    st.ema = Math.max(st.ema, FAST_MS[db.settings.input] * 1.2);
    session.streak = 0;
    $('hud-streak').textContent = '0';
    const want = nameOf(target.d, target.acc, octaveMatters());
    countError('late', `${want}: too late`);
    scheduleRetry(target);
    setFeedback(`Too late: that was ${want}.`, 'bad');
  }

  function perNote(it) {
    return session.perNote[it.key] || (session.perNote[it.key] = { it, n: 0, miss: 0, times: [] });
  }
  function countError(type, confusion) {
    session.errTypes[type] = (session.errTypes[type] || 0) + 1;
    session.confusions[confusion] = (session.confusions[confusion] || 0) + 1;
  }

  // input: { midi } for a specific pitch, or { pc } when only the pitch class is known (letter keys).
  function answer(inp) {
    if (!session || session.ended || current !== 'play' || session.countIn) return;
    if (session.pulse && session.resolved) return;
    const s = db.settings;
    const target = session.queue[0];
    const strict = s.octave && inp.midi != null;
    const ok = strict ? inp.midi === target.midi : mod(inp.midi != null ? inp.midi : inp.pc, 12) === mod(target.midi, 12);
    const ms = performance.now() - session.t0;
    const fast = fastFor(peek(target.key));

    // What to sound: the key that was pressed, or for letter keys the pitch class nearest the target.
    let heard = inp.midi;
    if (heard == null) heard = target.midi + ((mod(inp.pc - target.midi, 12) + 6) % 12) - 6;
    if (inp.source !== 'midi') playMidi(heard);
    if (inp.midi != null) flashKey(inp.midi, ok ? 'ok' : 'bad');

    const pn = perNote(target);

    if (session.firstTry) {
      session.attempts++;
      pn.n++;
      const st = stat(target.key);
      const now = Date.now();
      st.n++;
      if (ok) {
        st.ok++;
        // The first sighting has its name printed under it: that answer was copied, not read, so it can't count as learnt.
        if (!session.introduced) {
          st.ema = st.ema ? st.ema * 0.6 + ms * 0.4 : ms;
          // Fast alone doesn't move a note up: enough time has to have passed since the last move up
          // for the answer to show memory rather than an echo of a few seconds ago.
          if (ms <= fast && st.box < MAX_BOX && now - (st.up || 0) >= PROMOTE_GAP[st.box + 1]) {
            st.box++;
            st.up = now;
          }
        }
      } else {
        // Two levels down, not back to zero: one slip shouldn't wipe a note that held up for days.
        st.box = Math.max(0, st.box - 2);
        st.up = now;
        // A wrong answer is also a slow one: drag the typical time up so the note gets more turns.
        st.ema = Math.max(st.ema, FAST_MS[s.input] * 1.2);
      }
      st.last = now;
    }

    const want = nameOf(target.d, target.acc, octaveMatters());
    if (ok) {
      if (session.firstTry) {
        session.correct++;
        session.streak++;
        session.bestStreak = Math.max(session.bestStreak, session.streak);
        if (!session.introduced) {
          session.times.push(ms);
          pn.times.push(ms);
        }
        const last = $('hud-last');
        last.textContent = (ms / 1000).toFixed(2) + 's';
        last.className = 'hud-val ' + (ms <= fast ? 'fast' : 'slow');
        setFeedback(`${want}  ${(ms / 1000).toFixed(2)} s${ms > fast ? '  (aim for under ' + (fast / 1000).toFixed(1) + ' s)' : ''}`, ms <= fast ? 'ok' : 'slow');
      } else {
        setFeedback(`${want}. It comes back in a moment.`, 'slow');
      }
      $('hud-score').textContent = session.correct;
      $('hud-streak').textContent = session.streak;
      if (session.pulse) {
        // The next note comes on the click, not now.
        session.resolved = true;
        session.state = 'ok';
        renderStaff();
        return;
      }
      advance();
    } else {
      const err = describeError(target, heard, strict);
      if (session.firstTry) {
        session.streak = 0;
        pn.miss++;
        countError(err.type, `${want} read as ${err.gotName}`);
        scheduleRetry(target);
        $('hud-streak').textContent = '0';
      }
      session.firstTry = false;
      // With a pulse there is no stopping to fix it: the right answer is shown and the click moves on.
      if (session.pulse) session.resolved = true;
      setFeedback(err.text + (session.pulse ? '' : ` Play ${want} to go on.`), 'bad');
      hintKey(target.midi);
      session.state = 'bad';
      renderStaff();
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

    const bk = session.bestKey;
    const prev = db.best[bk];
    const best = $('r-best');
    const inPlay = `${session.inPlay} notes in play`;
    if (session.attempts >= 5 && (!prev || npm > prev)) {
      db.best[bk] = npm;
      best.textContent = prev ? `New best for these settings with ${inPlay}. Previous: ${prev.toFixed(1)}` : `First score for these settings with ${inPlay}.`;
    } else {
      best.textContent = prev ? `Best for these settings with ${inPlay}: ${prev.toFixed(1)}` : '';
    }
    $('result-eyebrow').textContent = session.attempts ? 'Session over' : 'Nothing answered';

    const types = Object.entries(session.errTypes).sort((a, b) => b[1] - a[1]);
    $('r-errtypes').textContent = types.map(([t, n]) => `${ERR_LABELS[t]}: ${n}`).join(' · ');
    const misses = types.reduce((a, [, n]) => a + n, 0);
    $('r-tip').textContent = misses >= 2 ? ERR_TIPS[types[0][0]] : '';

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
  // Centre a line of text under x, squeezed if needed so it stays inside the staff on narrow screens.
  function placeLine(node, text, x, W) {
    node.textContent = text;
    const room = W - 16;
    // Plex Mono is 0.6 em per character; the estimate covers a measurement taken before the font has loaded.
    let w = Math.max(node.getComputedTextLength() || 0, text.length * 7.5);
    if (w > room) {
      node.setAttribute('textLength', room);
      node.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      w = room;
    }
    node.setAttribute('x', clamp(x - w / 2, 8, W - 8 - w));
  }

  function renderStaff(tick) {
    const svg = $('staff');
    const clef = db.settings.clef;
    const state = session.state;
    const sig = KEY_SIGS[db.settings.key] || 0;
    // Phones get three notes on a shorter staff so the notes stay big enough to read.
    const narrow = (svg.clientWidth || svg.parentNode.clientWidth) < 560;
    const shown = narrow ? 3 : PREVIEW;
    const W = narrow ? 400 : 680;
    const staves = clef === 'g'
      ? [{ clef: 't', top: 62 }, { clef: 'b', top: 62 + 4 * S + 6 * S }]
      : [{ clef, top: 78 }];
    const H = staves[staves.length - 1].top + 4 * S + 100;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    const yOf = (d, st) => st.top + 4 * S - (d - STAFF_REF[st.clef]) * S / 2;
    const x0 = 14, x1 = W - 14;
    const xs = [];
    for (let i = 0; i < shown; i++) xs.push((narrow ? 132 + i * 100 : 180 + i * 106) + Math.abs(sig) * 10);

    // cursor band behind the note to read now
    const bandTop = staves[0].top - 3.5 * S;
    const bandBot = staves[staves.length - 1].top + 7.5 * S;
    el('rect', { class: 'cursor' + (state ? ' ' + state : '') + (tick ? ' tick' : ''), x: xs[0] - 34, y: bandTop, width: 68, height: bandBot - bandTop, rx: 6 }, svg);

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
      if (sig) {
        SIG_POS[st.clef][sig > 0 ? 1 : -1].slice(0, Math.abs(sig)).forEach((n, k) => {
          const y = yOf(dia(n), st);
          const a = el('text', { class: 'keysig', x: x0 + 46 + k * 12, y: y + (sig > 0 ? 7 : 6), 'font-size': (sig > 0 ? 2.4 : 2.9) * S }, svg);
          a.textContent = sig > 0 ? '♯' : '♭';
        });
      }
    }
    if (staves.length > 1) {
      el('line', { class: 'st-bar', x1: x0, x2: x0, y1: staves[0].top, y2: staves[1].top + 4 * S }, svg);
    }
    el('line', { class: 'st-bar', x1: x1, x2: x1, y1: staves[0].top, y2: staves[staves.length - 1].top + 4 * S }, svg);

    session.queue.slice(0, shown).forEach((it, i) => {
      const st = staves.find((s) => s.clef === it.clef);
      const ref = STAFF_REF[it.clef];
      const x = xs[i];
      const y = yOf(it.d, st);
      const mark = i === 0 && state ? (state === 'bad' ? ' bad' : ' done') : '';
      const g = el('g', { class: 'note' + (i > 0 ? ' ahead' : '') + mark }, svg);
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
      if (it.acc && !it.fromKey) {
        const a = el('text', { class: 'acc', x: x - 28, y: y + (it.acc === 1 ? 7 : 6), 'font-size': (it.acc === 1 ? 2.4 : 2.9) * S }, g);
        a.textContent = it.acc === 1 ? '♯' : '♭';
      }
      if (i === 0) {
        const below = staves[staves.length - 1].top + 4 * S + 66;
        const stt = peek(it.key);
        let label = '', cls = '';
        if (state === 'bad') { label = nameOf(it.d, it.acc, octaveMatters()); cls = 'answer-name'; }
        else if (!stt || !stt.n) { label = nameOf(it.d, it.acc, octaveMatters()) + ' (new)'; cls = 'intro-name'; }
        if (label) {
          el('text', { class: cls, x, y: below, 'text-anchor': 'middle' }, svg).textContent = label;
          placeLine(el('text', { class: 'rel', y: below + 21 }, svg), relation(it), x, W);
        }
      }
    });
    const tgt = session.queue[0];
    const sign = !tgt.acc ? '' : tgt.fromKey ? `, ${tgt.acc === 1 ? 'sharp' : 'flat'} from the key signature` : `, with a ${tgt.acc === 1 ? 'sharp' : 'flat'}`;
    svg.setAttribute('aria-label', `Note to read: ${tgt.clef === 't' ? 'treble' : 'bass'} clef, ${describePos(tgt)}${sign}`);
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
    if (!k) return;
    k.classList.add('hint');
    // On phones the piano scrolls sideways; bring the right key into view.
    const wrap = $('piano-wrap');
    const left = k.offsetLeft - (k.classList.contains('bk') ? k.offsetWidth / 2 : 0);
    if (left < wrap.scrollLeft || left + k.offsetWidth > wrap.scrollLeft + wrap.clientWidth) {
      wrap.scrollTo({ left: left - wrap.clientWidth / 2 + k.offsetWidth / 2, behavior: 'smooth' });
    }
  }
  function clearHints() {
    for (const k of keyEls.values()) k.classList.remove('hint');
  }

  function renderKeysHint() {
    const s = db.settings;
    const h = $('keys-hint');
    if (s.input === 'keys') {
      h.innerHTML = s.names === 'solfege'
        ? 'Type <kbd>C</kbd><kbd>D</kbd><kbd>E</kbd><kbd>F</kbd><kbd>G</kbd><kbd>A</kbd><kbd>B</kbd> or <kbd>1</kbd>&ndash;<kbd>7</kbd> for Do&ndash;Si. <kbd>Shift</kbd> + key = sharp, hold <kbd>Space</kbd> + key = flat.'
        : 'Type <kbd>C</kbd><kbd>D</kbd><kbd>E</kbd><kbd>F</kbd><kbd>G</kbd><kbd>A</kbd><kbd>B</kbd>. <kbd>Shift</kbd> + letter = sharp, hold <kbd>Space</kbd> + letter = flat.';
    } else if (s.input === 'piano') {
      h.textContent = 'Click the key. Letter keys work too, but ignore the octave.';
    } else {
      h.textContent = '';
    }
  }

  // ---------- keyboard ----------
  // Space held down turns the next letter into a flat, so B♭ is typed as B♭ and not as Shift + A.
  let flatHeld = false;
  document.addEventListener('keydown', (e) => {
    if (current === 'play') {
      if (e.key === 'Escape') { e.preventDefault(); endSession(); return; }
      if (e.code === 'Space') { e.preventDefault(); flatHeld = true; return; }
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      let li = -1;
      if (e.key.length === 1) li = 'cdefgab'.indexOf(e.key.toLowerCase());
      const dm = /^(Digit|Numpad)([1-7])$/.exec(e.code);
      if (li < 0 && dm) li = +dm[2] - 1;
      if (li >= 0) {
        e.preventDefault();
        answer({ pc: mod(PCS[li] + (e.shiftKey ? 1 : 0) - (flatHeld ? 1 : 0), 12), source: 'keys' });
      }
    } else if (current === 'menu') {
      if (e.key === 'Enter' && !e.target.closest('button, a')) { e.preventDefault(); startSession(); }
    } else if (current === 'result') {
      if (e.key === 'Escape') { e.preventDefault(); toMenu(); }
      else if (e.key === 'Enter' && !e.target.closest('button, a')) { e.preventDefault(); startSession(); }
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code !== 'Space') return;
    flatHeld = false;
    if (current === 'play') e.preventDefault();
  });
  window.addEventListener('blur', () => { flatHeld = false; });

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
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (current === 'play' && session && !session.ended) renderStaff();
    }, 120);
  });

  if (db.settings.input === 'midi') initMidi();
  syncForm();
});
