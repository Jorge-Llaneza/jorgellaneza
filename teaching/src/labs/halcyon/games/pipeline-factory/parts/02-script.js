
'use strict';
(() => {
  /* ---------- Config ---------- */
  const STAGES = [['IF', 'Fetch'], ['ID', 'Decode'], ['EX', 'Execute'], ['MEM', 'Memory'], ['WB', 'Write back']];
  const LEVEL = { shift: 90, rate: 0.8, targetIPC: 0.7, maxQueue: 10, health: 5, credits: 250, cycleMs: 700, depChance: 0.55, regs: 5, hit: 0.85, shared: false, heavy: 0, pay: 1, mix: { beq: 0, lw: 0.28, sw: 0.22 }, events: false, line: '', sub: '' };
  const COST = { forward: 120, stall: 80, nop: 20 };
  const BASE = { ...COST };
  const PRED = [0.65, 0.8, 0.9, 0.96];
  const META = { n: 0, bank: 0, stars: {}, fired: 0, story: {}, diff: 1, bpMode: 0, daily: {}, bay: {}, ach: {}, stats: { wins: 0, best: 0, shipped: 0 }, up: { pred: 0, comp: 0, buf: 0, disc: 0, hp: 0, cache: 0, harv: 0, lane2: 0, mulu: 0, lab: 0, rename: 0, deep: 0, ooo: 0, prefetch: 0, gate: 0, rob: 0, spec: 0, clock: 0, node: 0, sink: 0, ecc: 0, l2: 0, dec: 0, slot: 0, regs: 0, align: 0 }, placed: { fwdEX: false, fwdMEM: false, stall: false } };
  const slotKey = n => 'pipelineFactorySave' + n;
  const slotNo = (() => { try { return Math.min(3, Math.max(1, +localStorage.getItem('pipelineFactorySlot') || 1)); } catch (e) { return 1; } })();
  const SAVE = slotKey(slotNo);
  try {
    const sv = JSON.parse(localStorage.getItem(SAVE) || 'null');
    if (sv) { META.n = sv.n | 0; META.bank = sv.bank | 0; META.stars = sv.stars || {}; META.fired = sv.fired | 0; META.story = sv.story || {}; META.diff = sv.diff == null ? 1 : sv.diff; META.bpMode = sv.bpMode | 0; META.daily = sv.daily || {}; META.bay = sv.bay || {}; META.ach = sv.ach || {}; Object.assign(META.stats, sv.stats); Object.assign(META.up, sv.up); Object.assign(META.placed, sv.placed); }
  } catch (e) { /* storage unavailable */ }
  let SBON = false;
  const save = () => { if (SBON) return; try { localStorage.setItem(SAVE, JSON.stringify({ n: META.n, bank: META.bank, stars: META.stars, fired: META.fired, story: META.story, diff: META.diff, bpMode: META.bpMode, daily: META.daily, bay: META.bay, ach: META.ach, stats: META.stats, up: META.up, placed: META.placed })); } catch (e) { /* ignore */ } };
  const ORDERS = [
    { n: 'Standard', m: 1, heavy: 0, pay: 1, d: 'Balanced crates.' },
    { n: 'RISC order', m: 1.3, heavy: 0, pay: 1.15, d: '30 percent more crates, all simple. Pays 15 percent more.' },
    { n: 'CISC order', m: 0.65, heavy: 0.4, pay: 1.15, d: '35 percent fewer crates, but 4 in 10 need two cycles in EX. Pays 15 percent more.' }
  ];
  let ORDER = 0;
  // Cycle time grows with every forwarding wire (longer critical path) and a bigger register file; a deeper pipeline shortens it.
  const cycleMs = () => Math.max(300, 700 - 100 * META.up.clock - 60 * META.up.deep + 15 * META.up.regs + 25 * (META.placed.fwdEX + META.placed.fwdMEM) + (LEVEL.models ? [0, 30, -60, -40][BAY.model] : 0));
  // Net heat per cycle: speed and extra hardware add heat, cooling removes it.
  const heatGain = () => { const u = META.up; return u.clock * 1.2 * (1 - 0.25 * u.node) + 0.4 * u.deep + 0.25 * u.ooo + 0.3 * u.ecc + 0.2 * u.mulu + 0.3 * u.rob + 0.3 * u.spec - (0.6 + 0.5 * u.sink + 0.3 * u.gate); };
  const UPS = [
    { id: 'pred', name: 'Branch prediction', desc: 'Level 1 unlocks Always not taken: fetch keeps going and only taken branches flush. Level 2 unlocks the 2-bit predictor: a saturating counter per branch site learns loops. Choose the active unit in the briefing.', max: 2, cost: [120, 260] },
    { id: 'comp', name: 'Smarter compiler', desc: 'Fewer back-to-back dependencies. Cost: unrolling adds about 5 percent more instructions per level.', max: 2, cost: [200, 350] },
    { id: 'buf', name: 'Intake buffer', desc: '3 more queue slots', max: 3, cost: [100, 160, 240] },
    { id: 'disc', name: 'Parts discount', desc: '20 percent off every part', max: 2, cost: [150, 250] },
    { id: 'hp', name: 'Reinforced line', desc: 'One more point of line health', max: 2, cost: [120, 200] },
    { id: 'cache', name: 'Bigger cache', desc: 'Higher hit rate. Cost: from level 2 a bigger cache has a slower hit time.', max: 3, cost: [150, 250, 350] },
    { id: 'harv', name: 'Split memory ports', desc: 'Fetch and data stop fighting over one port', max: 1, cost: [220] },
    { id: 'lane2', name: 'Line B (multicore)', desc: 'A second line takes 25 percent of incoming crates per level. Simplified: more throughput, same response time. Cost: sharing memory raises misses 3 percent per level.', max: 2, cost: [300, 500] },
    { id: 'clock', name: 'Overclock', desc: 'Clock frequency (T in the iron law). Faster cycles mean more crates per shift, but more heat.', max: 3, cost: [140, 240, 380] },
    { id: 'node', name: 'Smaller process node', desc: 'Manufacturing technology (7 nm, 5 nm): 25 percent less heat per level.', max: 2, cost: [180, 320] },
    { id: 'sink', name: 'Heat sink', desc: 'Heat dissipation: a cooler line and fewer thermal stalls.', max: 2, cost: [100, 180] },
    { id: 'l2', name: 'L2 SRAM cache', desc: 'Another memory hierarchy level: each level cuts the miss penalty by one cycle.', max: 2, cost: [200, 340] },
    { id: 'align', name: 'Aligned data layout', desc: 'Misaligned accesses trap. Aligned data means fewer traps. Cost: padding wastes cache, so misses rise 2 percent per level.', max: 2, cost: [90, 150] },
    { id: 'dec', name: 'Hybrid RISC/CISC decoder', desc: 'Complex crates lose their extra EX cycle (half the time per level).', max: 2, cost: [160, 280] },
    { id: 'slot', name: 'Branch delay slot', desc: 'MIPS trick: a mispredicted branch flushes only one crate. Cost: unfilled slots waste a cycle on a quarter of correct branches.', max: 1, cost: [200] },
    { id: 'regs', name: 'Bigger register file', desc: 'MIPS64 has 31 usable registers: fewer accidental dependencies. Cost: a bigger register file slows the clock a little.', max: 3, cost: [80, 140, 220] },
    { id: 'ecc', name: 'Redundant units', desc: 'Dependability via redundancy: each level absorbs 2 corrupt results per shift. Cost: redundant hardware runs hotter.', max: 3, cost: [150, 250, 380] },
    { id: 'mulu', name: 'Fast arithmetic unit', desc: 'Make the common case fast: multiply and divide spend fewer cycles in EX. Cost: a bigger multiplier runs hotter.', max: 2, cost: [180, 300] },
    { id: 'lab', name: 'Quality lab', desc: 'More inspection scans during prep.', max: 3, cost: [100, 170, 260] },
    { id: 'rename', name: 'Register renaming', desc: 'Out-of-order safety: reordering ignores WAR and WAW conflicts and only respects true dependencies.', max: 1, cost: [250] },
    { id: 'deep', name: 'Deeper pipeline', desc: 'Performance via pipelining: a shorter clock period (−60 ms per level). Cost: flushes and load-use stalls lose one more cycle per level, and it runs hotter.', max: 2, cost: [220, 380] },
    { id: 'ooo', name: 'Out-of-order window', desc: 'Parallelism: moving crates in prep takes 0.5 s less per level. Cost: the scheduling hardware runs hotter.', max: 3, cost: [200, 320, 460] },
    { id: 'prefetch', name: 'Data prefetcher', desc: 'Exploits locality: cache hit rate +4 percent per level. Cost: prefetches sometimes steal the bus for a cycle.', max: 2, cost: [160, 260] },
    { id: 'gate', name: 'Clock gating', desc: 'Idle parts are switched off: less heat. Cost: waking up after a freeze sometimes takes one more cycle.', max: 2, cost: [130, 220] },
    { id: 'rob', name: 'Reorder buffer', desc: 'Out-of-order issue, in-order retirement: when a crate stalls in ID, an independent younger crate jumps ahead. Finished crates wait in the buffer (3 slots per level) until every older crate has retired. Cost: runs hotter.', max: 3, cost: [260, 400, 560] },
    { id: 'spec', name: 'Speculative issue', desc: 'Needs the reorder buffer and a branch predictor. When a branch is stuck waiting for its operands, younger independent crates run ahead of it, marked SPEC and held in the buffer. If the prediction was right they retire; if wrong, everything younger is squashed and re-fetched. Cost: runs hotter.', max: 1, cost: [320] }
  ];
  const GROUPS = ['Clock and technology', 'Memory hierarchy', 'Instructions and compiler', 'Parallelism and dependability', 'Plant'];
  const UGRP = { clock: 0, node: 0, sink: 0, cache: 1, l2: 1, harv: 1, align: 1, pred: 2, comp: 2, dec: 2, slot: 2, regs: 2, mulu: 2, rename: 2, ooo: 3, deep: 0, prefetch: 1, gate: 0, rob: 3, spec: 3, lane2: 3, ecc: 3, buf: 4, disc: 4, hp: 4, lab: 4 };
  // Shifts completed before each upgrade appears in the shop.
  const UNLOCK = { buf: 0, disc: 0, hp: 0, comp: 1, ecc: 1, clock: 1, sink: 1, regs: 2, node: 3, rename: 3, ooo: 3, lab: 3, deep: 4, pred: 4, slot: 4, gate: 4,
    dec: 5, mulu: 5, lane2: 5, cache: 6, align: 6, l2: 6, prefetch: 7, harv: 9, rob: 5, spec: 7 };
  const SHIFTS = [
    { line: 'Assembly line 1', sub: 'Instruction plant', brief: 'Your first shift. A gentle start with mostly simple crates.', nw: 'Data hazards. A crate can need a result that is not ready yet. A stall unit protects the line.', rate: 0.55, target: 0.4, secs: 60, dep: 0.3, mix: { beq: 0, lw: 0.12, sw: 0.12 }, ev: false, hit: 1, soft: true },
    { line: 'Assembly line 2', sub: 'Load dock', brief: 'More loads arrive. A load has its value late.', nw: 'Load-use stalls. Forwarding cannot fully fix a load followed by the crate that uses it.', rate: 0.65, target: 0.5, secs: 70, dep: 0.4, mix: { beq: 0, lw: 0.4, sw: 0.15 }, ev: false, hit: 1, soft: true },
    { line: 'Assembly line 3', sub: 'Scheduling office', brief: 'You can reorder the shipment before the line starts.', nw: 'Prep reordering (out-of-order scheduling). Practice round: if a dependency breaks, the supervisor stops you instead of laying you off.', rate: 0.65, target: 0.5, secs: 70, dep: 0.45, mix: { beq: 0, lw: 0.25, sw: 0.15 }, ev: false, hit: 1, reorder: true, safe: true },
    { line: 'Assembly line 4', sub: 'Branch works', brief: 'Branch crates arrive. A wrong guess sends crates back to the belt.', nw: 'Branches. With no predictor, every branch makes fetch wait. Each branch crate carries a site letter (A, B, C) and each site has its own habits. Reordering is still practice.', rate: 0.65, target: 0.5, secs: 80, dep: 0.4, mix: { beq: 0.2, lw: 0.2, sw: 0.15 }, ev: false, hit: 1, reorder: true, safe: true },
    { line: 'Assembly line 5', sub: 'Math lab', brief: 'Multiply and divide crates stay in EX for several cycles.', nw: 'Multi-cycle EX: everything behind a multiply waits. From now on a broken reorder gets you laid off.', rate: 0.55, target: 0.42, secs: 80, dep: 0.45, mix: { beq: 0, lw: 0.15, sw: 0.1, mul: 0.12, div: 0.03 }, ev: false, hit: 1, reorder: true },
    { line: 'Assembly line 1', sub: 'Night shift', brief: 'Rush orders and golden contracts can happen tonight.', nw: 'Surprise events (rush orders and bonuses). Cache misses and alignment traps begin.', rate: 0.75, target: 0.55, secs: 85, dep: 0.5, mix: { beq: 0.1, lw: 0.28, sw: 0.18, mul: 0.06 }, ev: true, hit: 0.95, reorder: true, traps: true },
    { line: 'Assembly line 6', sub: 'Express hub', brief: 'Rush hour with every crate type. Upgrades pay off here.', nw: 'More event types, and a faster pace.', rate: 0.75, target: 0.55, secs: 90, dep: 0.55, mix: { beq: 0.12, lw: 0.28, sw: 0.18, mul: 0.08, div: 0.03 }, ev: true, hit: 0.9, reorder: true, traps: true },
    { line: 'Assembly line 7', sub: 'Cache wing', brief: 'Memory is slow today. Cache misses freeze the whole line.', nw: 'Slow memory. Bigger caches, an L2 and a prefetcher help. DRAM refresh events appear.', rate: 0.8, target: 0.55, secs: 90, dep: 0.5, mix: { beq: 0.1, lw: 0.35, sw: 0.25 }, ev: true, hit: 0.7, reorder: true, traps: true },
    { line: 'Assembly line 8', sub: 'Shared port', brief: 'One memory port serves fetch and data. A load or store in MEM blocks fetch.', nw: 'Structural hazard: the single memory port. Split ports fix it.', rate: 0.6, target: 0.45, secs: 90, dep: 0.5, mix: { beq: 0.1, lw: 0.3, sw: 0.3 }, ev: true, shared: true, hit: 0.9, reorder: true, traps: true },
    { line: 'Assembly line 9', sub: 'Grand opening', brief: 'Everything at once: branches, misses, a shared port, multiplies and surprises.', nw: 'All the problems together. This is the real thing.', rate: 0.62, target: 0.45, secs: 100, dep: 0.55, mix: { beq: 0.15, lw: 0.3, sw: 0.2, mul: 0.1, div: 0.04 }, ev: true, hit: 0.75, shared: true, reorder: true, traps: true }
  ];
  const shiftCfg = n => n < SHIFTS.length ? SHIFTS[n] : { ...SHIFTS[SHIFTS.length - 1], sub: `Overtime ${n - SHIFTS.length + 1}`, brief: 'Overtime: demand keeps climbing.', rate: Math.min(1.3, 1 + 0.04 * (n - SHIFTS.length + 1)), target: Math.min(0.92, 0.75 + 0.01 * (n - SHIFTS.length + 1)) };
  const GEO = { W: 1040, H: 440, x0: 270, step: 150, w: 118, y: 136, h: 128, cw: 108, ch: 44, cy: 178 };
  const sx = i => GEO.x0 + i * GEO.step;           // stage x
  const qx = i => (i < 2 ? 152 - i * 116 : -150);  // queue chip x (head = 0)

  // Build slots. "path" is the wire route from a pipeline latch back to the EX input.
  const SLOTS = [
    { id: 'fwdEX', kind: 'forward', label: 'EX/MEM → EX', rect: { x: 615, y: 294, w: 100, h: 50 },
      path: [[704, 264], [704, 330], [629, 330], [629, 264]] },
    { id: 'fwdMEM', kind: 'forward', label: 'MEM/WB → EX', rect: { x: 600, y: 372, w: 262, h: 46 },
      path: [[854, 264], [854, 395], [590, 395], [590, 264]] },
    { id: 'stall', kind: 'stall', label: 'Stall unit', rect: { x: 410, y: 24, w: 138, h: 52 } }
  ];

  const css = getComputedStyle(document.documentElement);
  const C = k => css.getPropertyValue('--' + k).trim();
  const OPCOLOR = { add: C('copper'), lw: C('sage'), sw: C('lilac'), beq: '#ffd166', mul: '#ff7aa2', div: '#ff5577', nop: C('belt-mark') };
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Helpers ---------- */
  const $ = id => document.getElementById(id);
  const nopObj = (text, x) => ({ op: 'nop', nop: true, text, px: x, py: GEO.cy });

  const mkInstr = (op, rd, rs, rt) => {
    const i = { op, rd, rs, rt, px: -150, py: GEO.cy, corrupt: false };
    i.text = op === 'lw' ? `lw r${rd}, 0(r${rs})` : op === 'sw' ? `sw r${rt}, 0(r${rs})` : op === 'beq' ? `beq r${rs}, r${rt}` : `${op} r${rd}, r${rs}, r${rt}`;
    if (op === 'mul') i.lat = 3;
    return i;
  };
  const TUT_QUEUE = [['add', 1, 2, 3], ['add', 4, 1, 5], ['add', 6, 4, 2], ['lw', 2, 6, null], ['add', 7, 2, 3], ['sw', null, 7, 4], ['mul', 8, 7, 2], ['add', 9, 8, 3], ['beq', null, 9, 1], ['add', 10, 1, 2], ['add', 11, 10, 3]];
  const TUT = [
    { t: 'Welcome to the plant. Every shift starts with a prep phase in the warehouse, then the line runs. Training covers both.', next: true },
    { t: 'This is your shipment: one crate per line of code, waiting on the shelves. In prep you can reorder the crates (out-of-order scheduling) so fewer of them wait on each other.', next: true },
    { t: 'Drag a crate to a new spot, or tap one crate and then another. Every move costs prep time, so choose carefully.', cond: g => g.insp && g.insp.hist.length >= 1, hl: '#rack' },
    { t: 'Pick the scanner (magnifier) and tap a crate. Arcs show what it depends on. A red ✕ means you moved a crate ahead of something it needs.', cond: g => g.insp && g.insp.scanned.size >= 1, hl: '[data-ti=scan]' },
    { t: 'Not sure about a move? Undo takes it back and costs less time than moving. Press undo.', cond: g => g.insp && g.insp.undos >= 1, hl: '#undo' },
    { t: 'Out-of-order is only legal if every dependency holds: true data dependencies (RAW), register overwrites (WAR and WAW), store and load order, and nothing crossing a branch. Break one in a real shift and you are laid off.', next: true },
    { t: 'Use the Crates and Line switch to build parts during prep. When the order is safe, press “Skip prep” to start the line. Training will not let you leave with a broken order, and it resets the crates to the original order for the demo.', cond: g => g.mode === 'paused', hl: '#run' },
    { t: 'Now the line. Press “Step one cycle” and watch the crates move one stage per cycle.', cond: g => g.cycles >= 2, hl: '#step' },
    { t: 'The next crate needs r1 before the add that produces it has finished. Unprotected, it reads stale data. Build a stall unit: select it, then tap the dashed slot above ID.', cond: g => g.placed.stall, gate: true, hl: '[data-tool=stall]' },
    { t: 'Keep stepping until the red dashed RAW arc appears and the line stalls. A bubble enters EX while the consumer waits.', cond: g => g.stalls >= 1, hl: '#step' },
    { t: 'Stalls cost throughput. Build a forwarding wire on the EX/MEM → EX slot so results skip the wait. Remember: every wire adds a little to the cycle time.', cond: g => g.placed.fwdEX, gate: true, hl: '[data-tool=forward]' },
    { t: 'Step again. The arc turns blue: the result was forwarded and nothing stalled.', cond: g => g.forwards >= 1, hl: '#step' },
    { t: 'Loads are different: a lw has its value only after MEM. Keep stepping until the load-use stall appears.', cond: g => g.stalls >= 2, hl: '#step' },
    { t: 'Build the MEM/WB → EX wire to remove the second wait.', cond: g => g.placed.fwdMEM, gate: true, hl: '[data-tool=forward]' },
    { t: 'Keep stepping. Loads and stores can miss the cache, and then the whole line waits for the next memory level. Caches, an L2 and a prefetcher all fight this.', cond: g => g.misses >= 1, hl: '#step' },
    { t: 'Multiply and divide are slow: the crate stays in EX for several cycles and everything behind it waits. Keep stepping until you see “EX +” on a crate.', cond: g => g.exWaits >= 1, hl: '#step' },
    { t: 'A branch is resolved in EX. With no predictor, fetch waits and the crates behind it go back to the belt. Always not taken keeps fetching and flushes only on taken branches. A 2-bit counter learns each branch site. Keep stepping to see a flush.', cond: g => g.flushes >= 1, hl: '#step' },
    { t: 'Reorder buffer. When a crate stalls, an independent younger crate can jump ahead. New crates are on the belt: step until one jumps ahead of the stalled one.', go: () => { META.up.rob = 1; G.queue.push(...[['lw', 12, 2, null], ['add', 13, 12, 3], ['add', 14, 5, 6], ['add', 15, 7, 8]].map(a => mkInstr(...a))); }, cond: g => g.ooo >= 1, hl: '#step' },
    { t: 'Out-of-order issue, in-order retirement: the crate that jumped is numbered and waits in the Reorder buffer bay under WB until every older crate has retired. “next” is the crate that retires next.', next: true },
    { t: 'Speculation. When a branch is stuck waiting for its operands, younger crates can run ahead of it, marked SPEC. Right guess: they retire. Wrong guess: they are squashed and fetched again. Step until you see a squash.', go: () => { META.up.spec = 1; META.up.pred = 1; G.queue.push(...[['lw', 16, 2, null], ['beq', null, 16, 17], ['add', 18, 19, 20], ['add', 21, 22, 23]].map(a => mkInstr(...a))); }, cond: g => g.squashed >= 1, hl: '#step' },
    { t: 'Squashed! In training the guess is always wrong. In a real shift a good predictor makes squashes rare, and speculation is pure profit when it is right. The results screen counts the squashed crates.', next: true },
    { t: 'After 5 shifts the Compiler bay unlocks: the same statements compiled for four machine models (register-register, register-memory, accumulator, stack). Fewer instructions can beat a higher IPC: time = instructions × CPI × cycle time.', next: true },
    { t: 'Also in the briefing: a Sandbox where you write your own program, change every part of the machine, step forward and back and compare runs, a Daily challenge, save slots and career stats. Result screens have a replay with a timeline.', next: true },
    { t: 'Every shift pays into your bank for upgrades, but upgrades have trade-offs: a deeper pipeline or an overclock runs hotter, a bigger cache hits slower, a bigger register file and every forwarding wire stretch the clock. Watch the heat bar: at 100 the line throttles.', next: true },
    { t: 'Finish shifts to earn stars and ranks, and watch for surprise shifts with no prep. Misaligned crates, corrupted results and broken reorders can all get you fired. Good luck.', next: true, last: true }
  ];
  const TUTSAVE = { up: null, bp: 0 };
  function restoreTut() { if (TUTSAVE.up) { META.up = TUTSAVE.up; META.bpMode = TUTSAVE.bp; TUTSAVE.up = null; SBON = false; } }
  let ti = -1;
  const clearNudge = () => document.querySelectorAll('.nudge').forEach(e => e.classList.remove('nudge'));
  function coachShow() {
    const s = TUT[ti]; clearNudge(); if (s.go) s.go();
    $('coach').hidden = false; $('coach-text').textContent = s.t; $('coach-next').hidden = !s.next;
    if (s.hl) document.querySelectorAll(s.hl).forEach(e => e.classList.add('nudge'));
  }
  function tutTick() { if (G.tut && ti >= 0 && TUT[ti].cond && TUT[ti].cond(G)) { ti++; coachShow(); } }
  function endTut() { restoreTut(); ti = -1; $('coach').hidden = true; clearNudge(); G.reset(); startOverlay(); syncRun(); }

  let muted = false, audio = null;
  function beep(f, d = 0.08, type = 'square', v = 0.04) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(audio.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d); o.stop(audio.currentTime + d);
    } catch (e) { /* audio unavailable */ }
  }
  function shake() {
    const w = document.querySelector('.stage-wrap'); w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake');
  }

  // Detects RAW hazards for the instruction in ID against producers in EX (d=1) and MEM (d=2).
  function analyze(st, placed) {
    const out = { list: [], unresolved: false };
    const id = st[1];
    if (!id || id.nop) return out;
    const seen = new Set();
    for (const reg of [id.rs, id.rt]) {
      if (!reg || seen.has(reg)) continue;
      seen.add(reg);
      let prod = null, d = 0;
      if (st[2] && !st[2].nop && st[2].rd === reg) { prod = st[2]; d = 1; }
      else if (st[3] && !st[3].nop && st[3].rd === reg) { prod = st[3]; d = 2; }
      if (!prod) continue;
      const loadUse = d === 1 && prod.op === 'lw';        // value not ready until after MEM
      const ok = !loadUse && (d === 1 ? placed.fwdEX : placed.fwdMEM);
      out.list.push({ reg, d, from: d === 1 ? 2 : 3, prod, ok, loadUse });
      if (!ok) out.unresolved = true;
    }
    return out;
  }

  /* ---------- Game state ---------- */
  class Game {
    constructor() { this.reset(); }

    reset(tut = false, sb = false) {
      Object.assign(this, {
        mode: 'ready', tut, sb, sbOver: false, sbRec: false, pend: [], stmts: 0, squashed: 0, rs: 1, snaps: [], streak: 0, flushes: 0, ev: null, freeze: 0, misses: 0, structs: 0, heavyN: 0, laneB: 0, trace: [], names: {}, heat: 0, rob: [], nextRetire: 0, fetchSeq: 0, ooo: 0, bp: [1, 1, 1], branches: 0, branchNotes: 0, best: 0, throttles: 0, manifest: [], insp: null, defects: 0, broken: null, view: 'crates', prepLeft: 0, exWaits: 0, traps: 0, memOps: 0, shield: tut ? 0 : 2 * META.up.ecc, cycles: 0, good: 0, retired: 0, stalls: 0, forwards: 0, corrupt: 0, dropped: 0,
        score: 0, health: LEVEL.health, credits: LEVEL.credits, timeLeft: LEVEL.shift,
        speed: this.speed || 1, acc: 0, arrive: 0, nextId: 1, recent: [], log: [],
        stages: [null, null, null, null, null], queue: [],
        placed: tut ? { fwdEX: false, fwdMEM: false, stall: false } : META.placed,
        flash: { stall: 0, bad: 0, fwdEX: 0, fwdMEM: 0 }
      });
      if (tut) { this.credits = 400; this.queue = TUT_QUEUE.map(a => mkInstr(...a)); }
      else if (LEVEL.models) { for (let q = 0; q < 2; q++) this.queue.push(...this.compileStmt()); }
      else for (let i = 0; i < 3; i++) this.queue.push(this.spawn());
      renderLog(this.log);
    }

    spawn() {
      if (this.manifest && this.manifest.length) return this.manifest.shift();
      const R = () => 1 + Math.floor(Math.random() * LEVEL.regs);
      const pick = () => (this.recent.length && (Math.random() < LEVEL.depChance || (this.ev && this.ev.kind === 'bugs')))
        ? this.recent[Math.floor(Math.random() * this.recent.length)] : R();
      const r = Math.random();
      const m = LEVEL.mix, a = m.beq + m.lw + m.sw; const op = r < m.beq ? 'beq' : r < m.beq + m.lw ? 'lw' : r < a ? 'sw' : r < a + (m.mul || 0) ? 'mul' : r < a + (m.mul || 0) + (m.div || 0) ? 'div' : 'add';
      const i = { id: this.nextId++, op, rd: null, rs: pick(), rt: null, px: -150, py: GEO.cy, corrupt: false };
      const flaw = this.genDefects && (op === 'lw' || op === 'sw') && Math.random() < 0.18, off = flaw ? [1, 2, 3, 6, 10][Math.floor(Math.random() * 5)] : 4 * Math.floor(Math.random() * 4);
      if (flaw) i.defect = true;
      if (op === 'add' || op === 'mul' || op === 'div') { i.rd = R(); i.rt = pick(); i.text = `${op} r${i.rd}, r${i.rs}, r${i.rt}`; if (op === 'mul') i.lat = Math.max(1, 3 - META.up.mulu); if (op === 'div') i.lat = Math.max(1, 5 - 2 * META.up.mulu); }
      else if (op === 'lw') { i.rd = R(); i.text = `lw r${i.rd}, ${off}(r${i.rs})`; i.off = off; }
      else if (op === 'beq') { i.rt = pick(); i.site = Math.floor(Math.random() * 3); i.taken = Math.random() < [0.85, 0.12, 0.5][i.site]; i.text = `beq r${i.rs}, r${i.rt} @${'ABC'[i.site]}`; }
      else { i.rt = pick(); i.text = `sw r${i.rt}, ${off}(r${i.rs})`; i.off = off; }
      if (LEVEL.heavy && op !== 'beq' && Math.random() < LEVEL.heavy) i.heavy = true;
      this.names[i.id] = i.text;
      if (i.rd) { this.recent.unshift(i.rd); this.recent.length = Math.min(this.recent.length, 2); }
      return i;
    }

    note(msg, kind = 'info') {
      this.log.unshift({ msg, kind });
      this.log.length = Math.min(this.log.length, 40);
      renderLog();
    }

    // One clock cycle.
    tick() {
      if (this.mode === 'over') return;
      if (!this.tut || this.sb) { this.snaps.push(this.snap()); if (this.snaps.length > 500) this.snaps.shift(); }
      this.cycles++;
      if (!this.tut) {
        const u = META.up;
        this.heat = Math.max(0, this.heat + heatGain());
        if (this.heat >= 100) { this.heat = 60; this.throttles++; this.freeze += 3; shake(); this.note('Thermal throttling: the line stalls to cool down', 'bad'); }
      }
      if (this.freeze > 0) { this.freeze--; this.flash.stall = 1; if (this.freeze === 0 && Math.random() < 0.3 * META.up.gate) this.freeze = 1; return; }
      const st = this.stages, id = st[1], exI = st[2], exBusy = !!(exI && exI.left > 0), hz = exBusy ? { list: [], unresolved: false } : analyze(st, this.placed);
      if (!this.tut || this.sb) { this.trace.push(st.map(i => (i && !i.nop && i.id) ? i.id : 0)); if (this.trace.length > 14) this.trace.shift(); }
      let stall = false;

      if (hz.unresolved) {
        const h = hz.list.find(x => !x.ok);
        const why = h.loadUse ? `load-use on r${h.reg}: lw has its value only after MEM`
                              : `RAW on r${h.reg}: ${h.prod.text} has not written back`;
        if (this.placed.stall || id.known) {
          stall = true; this.stalls++; if (h.loadUse) this.freeze += META.up.deep; this.flash.stall = 1; beep(220, 0.12, 'sawtooth'); fx('steam', sx(1) + GEO.w / 2, GEO.y);
          this.note(`Stall: ${id.text} waits (${why})`, 'warn');
        } else {
          if (this.shield > 0) { this.shield--; this.note('Redundant unit caught the bad result: no damage', 'ok'); fx('pulse', sx(1) + GEO.w / 2, GEO.cy); beep(700, 0.1, 'sine'); }
        else {
          id.corrupt = true; this.corrupt++; this.streak = 0; if (!this.tut) { this.health--; this.score -= 15; } this.flash.bad = 1; shake(); beep(110, 0.3, 'sawtooth', 0.07); fx('spark', sx(1) + GEO.w / 2, GEO.cy);
          this.note(`Corrupted: ${id.text} read a stale r${h.reg} (${why}). Build a stall unit.`, 'bad');
        }
        }
      }
      if (!stall) for (const h of hz.list) if (h.ok) {
        this.forwards++; this.flash[h.d === 1 ? 'fwdEX' : 'fwdMEM'] = 1; beep(880, 0.05, 'sine'); fx('pulse', sx(2) + GEO.w / 2, GEO.y + GEO.h);
        this.note(`Forwarded r${h.reg} from ${h.d === 1 ? 'EX/MEM' : 'MEM/WB'}, no stall`, 'ok');
      }

      const wb = st[4];                                    // completed crates enter the reorder buffer, then retire in order
      if (wb && !wb.nop) this.rob.push(wb);
      this.drain();
      st[4] = st[3];
      if (exBusy) { st[3] = nopObj('wait', sx(3) + 5); exI.left--; this.exWaits++; }
      else {
      st[3] = st[2];
      if (stall) {
        const cand = st[0];
        if (META.up.rob && this.canIssue(cand)) {
          st[2] = cand; { const nb = this.unresolved(cand); if (nb) cand.spec = nb; } st[0] = this.fetch(); this.ooo++; fx('pulse', sx(2) + GEO.w / 2, GEO.cy);
          if (this.ooo <= 3) this.note(`Out of order: ${cand.text} jumped ahead while ${id.text} waits`, 'ok');
        } else st[2] = nopObj('bubble', sx(2) + 5);
      }
      else {
        st[2] = st[1]; st[1] = st[0];
        const mem = st[3];
        if (LEVEL.shared && !META.up.harv && mem && (mem.op === 'lw' || mem.op === 'sw')) {
          st[0] = nopObj('port busy', sx(0) + 5); this.structs++;
          this.note('Structural hazard: MEM holds the single memory port, so fetch waits', 'warn');
        } else st[0] = this.fetch();
      }
      }
      if (st[2] && st[2].lat > 1 && st[2].left === undefined) st[2].left = st[2].lat - 1;

      const mm = st[3], hv = st[2];
      if (mm && (mm.op === 'lw' || mm.op === 'sw') && !mm.memDone && (!this.tut || this.sb || mm.op === 'lw')) {
        mm.memDone = true; this.memOps++;
        if (META.up.cache >= 2 && Math.random() < 0.15 * (META.up.cache - 1)) this.freeze += 1;
        if (META.up.prefetch && Math.random() < 0.08 * META.up.prefetch) this.freeze += 1;
        if (mm.defect) { this.freeze += 3; this.health--; this.streak = 0; this.score -= 10; this.defects++; shake(); this.note(`Misaligned crate shipped: ${mm.text} trapped the line`, 'bad'); }
        if (!this.tut && LEVEL.traps && Math.random() < 0.06 * (1 - 0.5 * META.up.align)) { this.freeze += 2; this.traps++; this.note('Misaligned access trap: the OS fixes it (2 cycles)', 'warn'); }
        if ((this.tut && !this.sb) || this.rnd() > LEVEL.hit) { this.freeze += Math.max(1, 3 - META.up.l2) + (this.ev && this.ev.kind === 'wall' ? 1 : 0); this.misses++; this.streak = 0; fx('steam', sx(3) + GEO.w / 2, GEO.y); this.note(`Cache miss: the line waits ${Math.max(1, 3 - META.up.l2)} cycles for the next memory level`, 'warn'); }
      }
      if (hv && hv.heavy && !hv.paid) { hv.paid = true; if (Math.random() >= 0.5 * META.up.dec) this.freeze += 1; this.heavyN++; this.note('Complex instruction: EX needs a second cycle', 'warn'); }
      const br = st[2];                                    // branch resolves in EX
      if (!stall && br && br.op === 'beq' && !br.checked) {
        br.checked = true; this.branches++;
        const forced = this.tut && !this.sb, mode = forced ? 1 : this.sb ? SB.bp : Math.min(META.bpMode, META.up.pred), taken = forced ? true : !!br.taken, site = br.site || 0;
        let flush, why = '';
        if (mode === 0) { flush = true; why = 'No prediction: fetch waited for the branch'; }
        else if (mode === 1) { flush = taken; why = 'Always not taken, but the branch was taken'; }
        else {
          const c = this.bp[site], guess = c >= 2; flush = guess !== taken;
          this.bp[site] = taken ? Math.min(3, c + 1) : Math.max(0, c - 1);
          why = `2-bit counter ${c} guessed ${guess ? 'taken' : 'not taken'}, site ${'ABC'[site]} ${taken ? 'was' : 'was not'} taken`;
        }
        if (!flush) for (const c of [...st, ...this.rob]) if (c && c.spec === br) { const nb = this.unresolved(c); if (nb) c.spec = nb; else delete c.spec; }
        if (flush) {
          let back;
          if ([...st, ...this.rob].some(c => c && !c.nop && c.spec === br)) {       // speculation was wrong: squash everything younger than the branch
            back = [...st, ...this.rob].filter(c => c && !c.nop && c.seq > br.seq).sort((a, b) => a.seq - b.seq);
            for (let k = 0; k < 5; k++) if (st[k] && !st[k].nop && st[k].seq > br.seq) st[k] = nopObj('squash', sx(k) + 5);
            this.rob = this.rob.filter(c => !(c.seq > br.seq));
            this.fetchSeq = br.seq + 1; this.squashed += back.length;
            back.forEach(x => { delete x.seq; delete x.spec; delete x.paid; delete x.memDone; delete x.checked; x.left = undefined; x.corrupt = false; });
          } else {
            back = (META.up.slot ? [st[0]] : [st[1], st[0]]).filter(i => i && !i.nop);
            back.forEach(x => delete x.seq); this.fetchSeq -= back.length;
            if (!META.up.slot) st[1] = nopObj('flush', sx(1) + 5);
            st[0] = nopObj('flush', sx(0) + 5);
          }
          this.queue.unshift(...back);
          this.flushes++; if (mode) this.streak = 0; this.freeze += META.up.deep; fx('spark', sx(2) + GEO.w / 2, GEO.cy); beep(150, 0.2, 'square', 0.05);
          this.note(`${why}: ${back.length} crates sent back to the belt`, 'warn');
        } else if (META.up.slot && this.rnd() < 0.25) { this.freeze += 1; this.note('Branch predicted right, but the delay slot was empty: one cycle wasted', 'warn'); }
        else if (this.branchNotes++ < 4) this.note(`Branch site ${'ABC'[site]} predicted right (${taken ? 'taken' : 'not taken'})`, 'ok');
      }
      if (!this.tut && LEVEL.events) {
        if (this.ev) { if (--this.ev.left <= 0) { this.note('Supervisor: back to normal.', 'radio'); this.ev = null; } }
        else if (this.cycles > 12 && Math.random() < 0.035) this.startEvent();
      }
      const inc = LEVEL.rate * (this.ev && this.ev.kind === 'rush' ? 1.5 : 1), toB = inc * 0.25 * META.up.lane2;
      if (!this.tut) { this.laneB += toB; this.arrive += (inc - toB) / (LEVEL.models ? 4 : 1); }                           // new work arrives
      while (this.arrive >= 1) {
        this.arrive--;
        if (this.queue.length >= LEVEL.maxQueue) {
          this.dropped++; if (!LEVEL.soft) this.health--; this.score -= 5;
          this.note('Queue overflow: an instruction was dropped', 'bad');
        } else if (LEVEL.models) { const st = this.compileStmt(); if (this.queue.length + st.length > LEVEL.maxQueue) this.dropped++; else this.queue.push(...st); }
        else this.queue.push(this.spawn());
      }
      if (this.sb && !this.sbOver && !this.queue.length && this.stages.every(x => !x || x.nop) && !this.rob.length) { this.sbOver = true; this.mode = 'paused'; sbDone(); }
      if (this.health <= 0) this.finish('health');
    }

    ipc() { return this.cycles ? this.good / this.cycles : 0; }
    eff() { return this.cycles ? 4 * this.stmts / this.cycles : 0; }
    mult() { return Math.min(4, 1 + Math.floor(this.streak / 8)); }

    // C = A op B compiled for the chosen machine model (ISA types: register-register, register-memory, accumulator, stack)
    compileStmt() {
      const m = BAY.model, ACC = 30, r = Math.random(), mx = LEVEL.mix, R = () => 1 + Math.floor(Math.random() * LEVEL.regs), V = () => 'abcdefgh'[Math.floor(Math.random() * 8)];
      const pick = () => (this.recent.length && Math.random() < LEVEL.depChance) ? this.recent[Math.floor(Math.random() * this.recent.length)] : R();
      let seq;
      if (r < mx.beq) { const site = Math.floor(Math.random() * 3); seq = [{ op: 'beq', rs: pick(), rt: pick(), site, taken: Math.random() < [0.85, 0.12, 0.5][site] }]; }
      else {
        const copy = r < mx.beq + mx.lw, kind = !copy && r < mx.beq + mx.lw + mx.mul ? 'mul' : 'add', a = V(), b = V(), c = V(), t1 = pick(), t2 = R(), t3 = R();
        if (copy) seq = m === 2 ? [{ op: 'lw', rd: ACC, v: a }, { op: 'sw', rt: ACC, v: c }] : m === 3 ? [{ op: 'lw', rd: 20, v: a }, { op: 'sw', rt: 20, v: c }] : [{ op: 'lw', rd: t1, v: a }, { op: 'sw', rt: t1, v: c }];
        else if (m === 0) seq = [{ op: 'lw', rd: t1, v: a }, { op: 'lw', rd: t2, v: b }, { op: kind, rd: t3, rs: t1, rt: t2 }, { op: 'sw', rt: t3, v: c }];
        else if (m === 1) seq = [{ op: 'lw', rd: t1, v: a }, { op: kind, rd: t3, rs: t1, v: b, memop: true }, { op: 'sw', rt: t3, v: c }];
        else if (m === 2) seq = [{ op: 'lw', rd: ACC, v: a }, { op: kind, rd: ACC, rs: ACC, v: b, memop: true }, { op: 'sw', rt: ACC, v: c }];
        else seq = [{ op: 'lw', rd: 20, v: a }, { op: 'lw', rd: 21, v: b }, { op: kind, rd: 20, rs: 20, rt: 21 }, { op: 'sw', rt: 20, v: c }];
      }
      seq[seq.length - 1].last = true;
      return seq.map(sp => {
        const i = { id: this.nextId++, px: -150, py: GEO.cy, corrupt: false, ...sp };
        const lat = (i.op === 'mul' ? Math.max(1, 3 - META.up.mulu) : 1) + (i.memop ? 1 : 0); if (lat > 1) i.lat = lat;
        i.text = MODEL_TXT(m, i); this.names[i.id] = i.text;
        if (i.rd && i.rd < 20) { this.recent.unshift(i.rd); this.recent.length = Math.min(this.recent.length, 2); }
        return i;
      });
    }

    snap() { const o = {}; for (const k of SNAP_KEYS) o[k] = this[k]; return structuredClone(o); }
    restore(sn) { Object.assign(this, structuredClone(sn)); }
    rnd() { return this.sb ? (this.rs = (Math.imul(this.rs, 1664525) + 1013904223) >>> 0) / 4294967296 : Math.random(); }

    // The oldest branch that has not resolved yet and is older than crate c
    unresolved(c) { return this.stages.filter(x => x && x.op === 'beq' && !x.checked && x.seq !== undefined && x.seq < c.seq).sort((a, b) => a.seq - b.seq)[0]; }

    fetch() { const i = this.queue.shift() || null; if (i && !i.nop && i.seq === undefined) i.seq = this.fetchSeq++; return i; }

    // May a younger crate jump past the one stalled in ID? Only if it is independent of everything older (RAW, WAR, WAW, memory order, branches).
    canIssue(c) {
      if (!c || c.nop || c.op === 'beq' || this.rob.length >= 3 * META.up.rob) return false;
      const st = this.stages, older = [st[1], st[2], st[3], st[4]].filter(o => o && !o.nop).concat(this.rob);
      const srcs = [c.rs, c.rt].filter(Boolean), mem = o => o.op === 'lw' || o.op === 'sw';
      const spec = META.up.spec && (this.sb ? SB.bp : Math.min(META.bpMode, META.up.pred)) > 0;
      const clash = o => (o.op === 'beq' && !spec) || (o.rd && (srcs.includes(o.rd) || o.rd === c.rd)) || (c.rd && (o.rs === c.rd || o.rt === c.rd)) || (mem(c) && mem(o) && (c.op === 'sw' || o.op === 'sw'));
      return older.every(o => !clash(o));
    }

    // Finished crates wait in the reorder buffer and retire strictly in program order.
    drain() {
      for (;;) {
        const k = this.rob.findIndex(x => x.seq === this.nextRetire && !x.spec);
        if (k < 0) break;
        const wb = this.rob.splice(k, 1)[0]; this.nextRetire++; this.retired++;
        if (!wb.corrupt) {
          this.good++; this.streak++; if (wb.last) this.stmts++; if (this.streak > this.best) this.best = this.streak;
          this.score += 10 * this.mult() * (this.ev && this.ev.kind === 'bonus' ? 2 : 1); this.credits += 5; fx('ship', sx(4) + GEO.w / 2, GEO.cy);
          if (!this.tut && this.good % 10 === 0) this.note(`Supervisor: ${this.good} units shipped. Keep the rhythm.`, 'radio');
        }
      }
    }

    startEvent() {
      const E = [['rush', 10, 'Rush order! Demand jumps 50 percent.'], ['bugs', 8, 'Messy code batch: crates depend on each other.'],
                 ['bonus', 10, 'Golden contract: scores double.'], ['wall', 12, 'DRAM refresh: every cache miss costs one extra cycle.'], ['power', 0, 'Power dip! The line freezes for two cycles.']];
      const pool = META.n < 5 ? [E[0], E[2]] : META.n < 7 ? E.slice(0, 3) : E, [kind, left, label] = pool[Math.floor(Math.random() * pool.length)];
      this.note('Supervisor: ' + label, 'radio'); beep(300, 0.2, 'triangle', 0.05);
      if (kind === 'power') { this.freeze = 2; shake(); } else this.ev = { kind, left, label };
    }

    finish(reason) {
      if (this.mode === 'over') return;
      this.mode = 'over'; syncRun();
      const ipc = LEVEL.models ? this.eff() : this.ipc(), win = reason === 'time' && ipc >= LEVEL.targetIPC;
      this.score += Math.floor(this.laneB) * 4;
      if (DAILY.on) dailyEnd(this, ipc, win); else if (BAY.on) bayEnd(this, ipc, win); else if (win) endWin(this, ipc); else endFired(this, ipc);
    }
  }

  /* ---------- Placement ---------- */
  function slotAt(x, y) {
    return SLOTS.find(s => x >= s.rect.x - 6 && x <= s.rect.x + s.rect.w + 6 && y >= s.rect.y - 6 && y <= s.rect.y + s.rect.h + 6);
  }
  function chipAt(x, y) {
    for (let i = 0; i < Math.min(2, G.queue.length); i++)
      if (x >= qx(i) && x <= qx(i) + GEO.cw && y >= GEO.cy && y <= GEO.cy + GEO.ch) return i;
    return -1;
  }

  function use(tool, x, y) {
    if (G.mode === 'over' || G.mode === 'replay') return;
    const slot = slotAt(x, y);
    if (tool === 'nop') {
      const i = chipAt(x, y);
      if (i < 0) return G.note('Drop the NOP injector on one of the queued instructions.', 'info');
      if (G.credits < COST.nop) return G.note('Not enough credits for a NOP.', 'info');
      G.credits -= COST.nop;
      const n = nopObj('nop', G.queue[i].px);
      G.queue.splice(i, 0, n);
      return G.note('Inserted a nop: it adds one cycle of distance between producer and consumer.', 'info');
    }
    if (tool === 'eraser') {
      if (!slot || !G.placed[slot.id]) return G.note('Nothing to salvage there.', 'info');
      G.placed[slot.id] = false;
      G.credits += Math.floor(COST[slot.kind] / 2); save();
      return G.note(`${slot.label} salvaged.`, 'info');
    }
    if (!slot || slot.kind !== tool) {
      return G.note(tool === 'forward' ? 'Forwarding wires go on the blue slots below the stages.' : 'The stall unit goes in the slot above ID.', 'info');
    }
    if (G.placed[slot.id]) return G.note(`${slot.label} is already built.`, 'info');
    if (G.credits < COST[tool]) return G.note(`Need ${COST[tool]} credits for that part.`, 'info');
    G.credits -= COST[tool];
    G.placed[slot.id] = true; beep(520, 0.1, 'triangle');
    G.note(`Built: ${slot.label}.`, 'ok'); save();
  }

  /* ---------- Rendering ---------- */
  const canvas = $('floor'), ctx = canvas.getContext('2d');
  let tool = null, hover = null;

  const K = { dark: '#08121a', brass: '#d4a94f', steel2: '#1a2f3b' };
  const TAG = { add: 'ALU', lw: 'LOAD', sw: 'STORE', beq: 'BRANCH', mul: 'MUL', div: 'DIV' };
  const parts = [];
  function fx(kind, x, y) {
    const n = { spark: 14, steam: 8, pulse: 6, ship: 10 }[kind];
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.28, sp = 40 + Math.random() * 120, st = kind === 'steam';
      parts.push({ kind, x, y, vx: st ? (Math.random() - 0.5) * 30 : Math.cos(a) * sp,
        vy: st ? -30 - Math.random() * 40 : Math.sin(a) * sp - (kind === 'ship' ? 60 : 0), life: 1, decay: st ? 0.9 : 1.8 });
    }
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }
  function bolt(x, y) { ctx.fillStyle = K.brass; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.3); ctx.fill(); }
  function gear(x, y, r, rot, color) {
    const c = ctx; c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = color; c.beginPath();
    for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, d = k % 2 ? r : r * 0.78; c.lineTo(Math.cos(a) * d, Math.sin(a) * d); }
    c.closePath(); c.fill(); c.fillStyle = K.dark; c.beginPath(); c.arc(0, 0, r * 0.3, 0, 6.3); c.fill(); c.restore();
  }

  // A crate on the belt: coloured lid band, tag, and the instruction text.
  function chip(i) { drawChipAt(ctx, i, i.px, i.py); }
  function drawChipAt(c, i, x, y) {
    const w = GEO.cw, h = GEO.ch;
    if (x < -w) return;
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,.4)'; rrr(c, x + 2, y + 5, w, h, 5); c.fill();
    if (i.nop) {
      c.globalAlpha = 0.65; c.setLineDash([4, 4]); c.lineWidth = 1.5; c.strokeStyle = C('muted'); rrr(c, x, y, w, h, 5); c.stroke();
      c.fillStyle = C('muted'); c.font = '11px "IBM Plex Mono", monospace'; c.fillText(i.text, x + w / 2, y + h / 2); c.restore(); return;
    }
    rrr(c, x, y, w, h, 5); c.fillStyle = '#223847'; c.fill();
    c.save(); rrr(c, x, y, w, h, 5); c.clip(); c.fillStyle = OPCOLOR[i.op]; c.fillRect(x, y, w, 12);
    c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(x, y + 12, w, 4); c.restore();
    c.lineWidth = 2; c.strokeStyle = i.corrupt ? C('alert') : OPCOLOR[i.op]; rrr(c, x, y, w, h, 5); c.stroke();
    c.textAlign = 'left'; c.fillStyle = '#0b1620'; c.font = '700 9px "IBM Plex Mono", monospace'; c.fillText((i.heavy ? 'CX ' : '') + TAG[i.op], x + 6, y + 6.5);
    if (i.spec) { c.textAlign = 'right'; c.fillStyle = '#0b1620'; c.fillText('SPEC', x + w - 6, y + 6.5); c.strokeStyle = '#b39cff'; c.setLineDash([4, 3]); c.lineWidth = 2; rrr(c, x, y, w, h, 5); c.stroke(); c.setLineDash([]); }
    if (i.left > 0) { c.textAlign = 'right'; c.fillStyle = '#0b1620'; c.fillText('EX +' + i.left, x + w - 6, y + 6.5); }
    c.textAlign = 'center'; c.fillStyle = C('text'); c.font = '500 11.5px "IBM Plex Mono", monospace';
    c.fillText(i.text, x + w / 2, y + h / 2 + 7 - (i.corrupt ? 4 : 0));
    if (i.corrupt) {
      c.strokeStyle = C('alert'); c.lineWidth = 2; c.beginPath(); c.moveTo(x + w * 0.6, y); c.lineTo(x + w * 0.45, y + h * 0.5); c.lineTo(x + w * 0.58, y + h); c.stroke();
      c.fillStyle = C('alert'); c.font = '9px "IBM Plex Mono", monospace'; c.fillText('stale data', x + w / 2, y + h - 5);
    }
    c.restore();
  }

  // Forwarding wire drawn as a riveted conduit with flowing charge.
  function pipe(path, color, f, now) {
    const c = ctx; c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    const trace = () => { c.beginPath(); path.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
    c.strokeStyle = K.dark; c.lineWidth = 12; trace();
    c.strokeStyle = '#3d5b6e'; c.lineWidth = 9; trace();
    c.strokeStyle = color; c.lineWidth = 4 + 3 * f; c.shadowColor = color; c.shadowBlur = 6 + 14 * f; trace();
    c.shadowBlur = 0; c.strokeStyle = '#fff'; c.lineWidth = 2; c.setLineDash([2, 16]);
    c.lineDashOffset = REDUCED ? 0 : -((now * 0.05 * (1 + 3 * f)) % 18); trace();
    c.restore();
    const [ex, ey] = path[path.length - 1];
    c.fillStyle = color; c.beginPath(); c.moveTo(ex, ey - 2); c.lineTo(ex - 8, ey + 10); c.lineTo(ex + 8, ey + 10); c.fill();
    path.forEach(([x, y]) => bolt(x, y));
  }

  function draw(now, dt) {
    const c = ctx, k = 1 - Math.exp(-dt / 80), W = GEO.W, H = GEO.H, t = now / 1000;
    const run = G.mode === 'running' && !REDUCED;
    const mono = '11px "IBM Plex Mono", monospace';
    c.clearRect(0, 0, W, H);

    // Concrete floor with expansion joints
    c.fillStyle = '#101c28'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(150,190,220,.06)'; c.lineWidth = 1; c.beginPath();
    for (let x = 0; x <= W; x += 52) { c.moveTo(x, 0); c.lineTo(x, H); }
    for (let y = 0; y <= H; y += 52) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
    c.save(); c.beginPath(); c.rect(0, H - 14, W, 14); c.clip(); c.fillStyle = '#e3b43c'; c.fillRect(0, H - 14, W, 14);
    c.strokeStyle = '#10161c'; c.lineWidth = 8; c.beginPath();
    for (let x = -20; x < W + 20; x += 24) { c.moveTo(x, H); c.lineTo(x + 14, H - 14); }
    c.stroke(); c.restore();

    // Overhead gantry with work lamps
    c.fillStyle = '#1d3140'; c.fillRect(0, 0, W, 12); c.fillStyle = '#2f4b5e'; c.fillRect(0, 12, W, 3);
    STAGES.forEach((_, s) => {
      const cx = sx(s) + GEO.w / 2, g = c.createRadialGradient(cx, 20, 4, cx, 150, 150);
      g.addColorStop(0, 'rgba(255,230,160,.22)'); g.addColorStop(1, 'rgba(255,230,160,0)');
      c.fillStyle = g; c.fillRect(cx - 150, 15, 300, 260); c.fillStyle = '#c8d6e0'; c.fillRect(cx - 8, 12, 16, 5);
    });

    // Signs
    c.fillStyle = '#16293a'; rr(20, 26, 210, 40, 6); c.fill(); c.strokeStyle = K.brass; c.lineWidth = 2; c.stroke();
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = K.brass; c.font = '700 20px "Barlow Condensed", sans-serif'; c.fillText(LEVEL.line, 34, 48);
    c.fillStyle = C('muted'); c.font = mono; c.fillText(LEVEL.sub, 34, 61);
    c.fillStyle = '#16293a'; rr(870, 26, 150, 40, 6); c.fill(); c.strokeStyle = K.brass; c.stroke();
    c.fillStyle = C('muted'); c.font = mono; c.fillText('Crates shipped', 882, 42);
    c.fillStyle = '#ffb347'; c.font = '700 22px "Barlow Condensed", sans-serif'; c.textAlign = 'right';
    c.fillText(String(G.good).padStart(4, '0'), 1006, 60);

    if (META.up.lane2) {
      c.fillStyle = '#16293a'; rr(240, 26, 166, 40, 6); c.fill(); c.strokeStyle = K.brass; c.lineWidth = 2; c.stroke();
      c.textAlign = 'left'; c.fillStyle = K.brass; c.font = '700 18px "Barlow Condensed", sans-serif'; c.fillText('Line B online', 252, 46);
      c.fillStyle = C('muted'); c.font = mono; c.fillText(Math.floor(G.laneB) + ' crates shipped', 252, 60);
    }
    // Conveyor with moving treads and legs
    c.fillStyle = '#0b161f'; c.fillRect(20, 188, 1000, 24); c.fillStyle = '#243a4b'; c.fillRect(20, 190, 1000, 20);
    const off = run ? (t * 60 * G.speed) % 20 : 0;
    c.fillStyle = '#34536a';
    for (let x = off; x < 1020; x += 20) c.fillRect(Math.max(20, x), 192, 3, 16);
    c.fillStyle = '#16283a'; for (let x = 40; x < 1020; x += 90) c.fillRect(x, 212, 8, 40);

    // Machines
    STAGES.forEach(([name, sub], s) => {
      const x = sx(s), y = GEO.y, w = GEO.w, h = GEO.h, cx = x + w / 2, st = G.stages[s], busy = st && !st.nop;
      c.fillStyle = 'rgba(0,0,0,.4)'; rr(x + 3, y + 6, w, h, 10); c.fill();
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#34586a'); g.addColorStop(1, K.steel2);
      rr(x, y, w, h, 10); c.fillStyle = g; c.fill();
      if (s === 1 && G.flash.stall > 0) { c.fillStyle = `rgba(255,90,95,${0.3 * G.flash.stall})`; c.fill(); }
      c.lineWidth = 2; c.strokeStyle = s === 1 && G.flash.bad > 0 ? C('alert') : '#4c7288'; c.stroke();
      c.fillStyle = 'rgba(5,12,18,.62)'; c.fillRect(x + 4, 172, w - 8, 56);
      c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x + 4, 172, w - 8, 3);
      bolt(x + 8, y + 8); bolt(x + w - 8, y + 8); bolt(x + 8, y + h - 8); bolt(x + w - 8, y + h - 8);
      c.textAlign = 'center'; c.fillStyle = C('text'); c.font = '700 19px "Barlow Condensed", sans-serif'; c.fillText(name, cx, y + 27);
      const lamp = s === 1 && G.flash.stall > 0 ? C('alert') : busy ? C('sage') : '#3a4f5f';
      c.fillStyle = lamp; c.shadowColor = lamp; c.shadowBlur = busy ? 8 : 0; c.beginPath(); c.arc(x + 20, y + 21, 4.5, 0, 6.3); c.fill(); c.shadowBlur = 0;
      c.textAlign = 'left'; c.fillStyle = C('muted'); c.font = mono; c.fillText(sub, x + 12, y + h - 12);
      const ix = x + w - 26, iy = y + h - 24; c.fillStyle = '#8fb3c8'; c.strokeStyle = '#8fb3c8'; c.lineWidth = 2;
      if (s === 0) { c.beginPath(); c.moveTo(ix - 10, iy - 8); c.lineTo(ix + 10, iy - 8); c.lineTo(ix + 3, iy + 2); c.lineTo(ix + 3, iy + 9); c.lineTo(ix - 3, iy + 9); c.lineTo(ix - 3, iy + 2); c.closePath(); c.fill(); }
      if (s === 1) {
        c.strokeStyle = C('signal'); c.beginPath(); c.ellipse(ix, iy, 11, 6, 0, 0, 6.3); c.stroke();
        c.fillStyle = C('signal'); c.beginPath(); c.arc(ix, iy, 3, 0, 6.3); c.fill();
        if (busy) { const bx = x + 8 + ((Math.sin(t * 3) + 1) / 2) * (w - 16); c.strokeStyle = 'rgba(92,200,255,.75)'; c.beginPath(); c.moveTo(bx, 172); c.lineTo(bx, 228); c.stroke(); }
      }
      if (s === 2) gear(ix, iy, 10, run && busy ? t * 3 : 0, '#8fb3c8');
      if (s === 3) for (let q = 0; q < 3; q++) c.fillRect(ix - 10, iy - 9 + q * 7, 20, 5);
      if (s === 4) { c.beginPath(); c.moveTo(ix - 8, iy - 8); c.lineTo(ix, iy); c.lineTo(ix + 8, iy - 8); c.moveTo(ix - 8, iy); c.lineTo(ix, iy + 8); c.lineTo(ix + 8, iy); c.stroke(); }
    });
    for (const f in G.flash) G.flash[f] = Math.max(0, G.flash[f] - dt / 500);

    if (META.up.rob) {                                                       // reorder buffer bay
      const cap = 3 * META.up.rob, bx = 862, by = 290, items = [...G.rob].sort((a, b) => a.seq - b.seq);
      c.fillStyle = '#16293a'; rr(bx, by, 158, 66, 6); c.fill(); c.strokeStyle = K.brass; c.lineWidth = 2; c.stroke();
      c.fillStyle = K.brass; c.font = '700 13px "Barlow Condensed", sans-serif'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('Reorder buffer', bx + 8, by + 15);
      c.fillStyle = C('muted'); c.font = '9px "IBM Plex Mono", monospace'; c.fillText('next ' + (G.nextRetire + 1), bx + 104, by + 14);
      for (let q = 0; q < Math.min(cap, 10); q++) {
        const cx = bx + 8 + (q % 5) * 29, cy = by + 24 + Math.floor(q / 5) * 20, it = items[q];
        c.fillStyle = it ? OPCOLOR[it.op] : '#0b1620'; rr(cx, cy, 25, 16, 3); c.fill(); c.strokeStyle = '#34536a'; c.lineWidth = 1; c.stroke();
        if (it) { c.fillStyle = '#0b1620'; c.font = '9px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.fillText(String(it.seq + 1), cx + 12.5, cy + 12); }
      }
    }
    // Build slots, conduits, stall cabinet
    for (const s of SLOTS) {
      const r = s.rect, armed = tool === s.kind || hover === s.id;
      if (s.kind === 'forward' && G.placed[s.id]) {
        pipe(s.path, C('signal'), G.flash[s.id], now);
        c.fillStyle = C('signal'); c.font = mono; c.textAlign = 'center'; c.fillText(s.label, (s.path[1][0] + s.path[2][0]) / 2, s.path[1][1] + 20);
      } else if (s.kind === 'stall' && G.placed.stall) {
        c.fillStyle = '#3d5b6e'; c.fillRect(sx(1) + GEO.w / 2 - 3, r.y + r.h, 6, 48);
        rr(r.x, r.y, r.w, r.h, 6); c.fillStyle = '#243d4f'; c.fill(); c.lineWidth = 2; c.strokeStyle = K.brass; c.stroke();
        c.fillStyle = '#06111a'; rr(r.x + 8, r.y + 8, 70, r.h - 16, 3); c.fill();
        c.fillStyle = C('sage'); for (let q = 0; q < 3; q++) c.fillRect(r.x + 12, r.y + 13 + q * 9, 20 + 40 * (run ? Math.abs(Math.sin(t * 2 + q)) : 0.5), 4);
        const on = G.flash.stall > 0; c.fillStyle = on ? C('alert') : K.brass; c.shadowColor = c.fillStyle; c.shadowBlur = on ? 12 : 0;
        c.beginPath(); c.arc(r.x + 100, r.y + 16, 5, 0, 6.3); c.fill(); c.shadowBlur = 0;
        c.fillStyle = C('text'); c.textAlign = 'left'; c.font = '700 14px "Barlow Condensed", sans-serif'; c.fillText('Stall unit', r.x + 84, r.y + 40);
      } else {
        c.save(); c.setLineDash([6, 5]); c.lineWidth = armed ? 2 : 1; c.globalAlpha = armed ? 1 : 0.55;
        c.strokeStyle = s.kind === 'forward' ? C('signal') : K.brass; rr(r.x, r.y, r.w, r.h, 6); c.stroke();
        if (armed) { c.globalAlpha = 0.12; c.fillStyle = c.strokeStyle; c.fill(); }
        c.restore();
        c.fillStyle = C('muted'); c.font = mono; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(s.label, r.x + r.w / 2, r.y + r.h / 2 - 7); c.fillText(COST[s.kind] + ' cr', r.x + r.w / 2, r.y + r.h / 2 + 8); c.textBaseline = 'alphabetic';
      }
    }

    // Dependency arcs
    for (const h of analyze(G.stages, G.placed).list) {
      const x1 = sx(h.from) + GEO.w / 2, x2 = sx(1) + GEO.w / 2, col = h.ok ? C('signal') : C('alert');
      c.strokeStyle = col; c.lineWidth = 2; c.setLineDash(h.ok ? [] : [6, 4]);
      c.beginPath(); c.moveTo(x1, GEO.y); c.quadraticCurveTo((x1 + x2) / 2, 92, x2, GEO.y); c.stroke(); c.setLineDash([]);
      c.fillStyle = col; c.font = mono; c.textAlign = 'center'; c.fillText(h.loadUse ? `load-use r${h.reg}` : `RAW r${h.reg}`, (x1 + x2) / 2, 106);
    }

    // Crates slide toward their stage or queue spot
    const slide = (i, tx) => { if (!i) return; i.px += (tx - i.px) * k; i.py = GEO.cy; chip(i); };
    G.stages.forEach((i, s) => slide(i, sx(s) + (GEO.w - GEO.cw) / 2));
    G.queue.forEach((i, idx) => slide(i, qx(idx)));
    const waiting = G.queue.length - 2;
    c.textAlign = 'left'; c.font = '12px "IBM Plex Mono", monospace';
    c.fillStyle = G.queue.length >= LEVEL.maxQueue - 2 ? C('alert') : C('muted');
    c.fillText(waiting > 0 ? `+${waiting} waiting on the belt` : 'Intake belt', 24, 170);

    // Particles
    for (const p of parts) { p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; if (p.kind !== 'steam') p.vy += 320 * dt / 1000; p.life -= p.decay * dt / 1000; }
    for (let q = parts.length - 1; q >= 0; q--) if (parts[q].life <= 0) parts.splice(q, 1);
    for (const p of parts) {
      c.globalAlpha = Math.max(0, p.life);
      c.fillStyle = p.kind === 'steam' ? '#cfe0ee' : p.kind === 'ship' ? '#7ee8a8' : p.kind === 'pulse' ? C('signal') : '#ffb347';
      c.beginPath(); c.arc(p.x, p.y, p.kind === 'steam' ? 4 + (1 - p.life) * 8 : 2.2, 0, 6.3); c.fill();
    }
    c.globalAlpha = 1;

    // Alarm wash and vignette
    if (G.flash.bad > 0) { c.fillStyle = `rgba(255,40,50,${0.18 * G.flash.bad})`; c.fillRect(0, 0, W, H); }
    const v = c.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 640);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  }

  /* ---------- UI ---------- */
  function renderLog(entries) {
    const ul = $('log'); if (!ul) return;
    ul.replaceChildren(...(entries || G.log).map(e => { const li = document.createElement('li'); li.className = e.kind; li.textContent = e.msg; return li; }));
  }

  const pips = $('health');
  for (let i = 0; i < LEVEL.health; i++) pips.appendChild(document.createElement('i'));
  $('goal').textContent = LEVEL.targetIPC.toFixed(2);

  function hud() {
    const ipc = LEVEL.models ? G.eff() : G.ipc();
    $('score').textContent = G.score;
    $('ipc').textContent = ipc.toFixed(2); $('ipc').dataset.ok = G.cycles > 5 ? String(ipc >= LEVEL.targetIPC) : '';
    $('cpi').textContent = G.good ? (G.cycles / G.good).toFixed(2) : '–';
    $('time').textContent = Math.max(0, Math.ceil(G.timeLeft));
    $('credits').textContent = G.credits;
    [...pips.children].forEach((p, i) => p.classList.toggle('off', i >= G.health));
    $('qtext').textContent = `${G.queue.length}/${LEVEL.maxQueue}`;
    $('qfill').style.width = (G.queue.length / LEVEL.maxQueue * 100) + '%';
    $('qfill').classList.toggle('hot', G.queue.length >= LEVEL.maxQueue - 2);
    $('streak').textContent = '×' + G.mult(); $('sbexit').hidden = $('sbedit').hidden = $('sbback').hidden = !G.sb; $('shiftno').textContent = META.n + 1; $('flush').textContent = G.flushes;
    $('heat').style.width = G.heat + '%'; $('heat').classList.toggle('hot', G.heat > 75);
    renderManifest();
    const prep = G.mode === 'prep' && G.view === 'line'; $('banner').hidden = !(prep || G.ev);
    if (prep) $('banner').textContent = `Prep: ${G.insp ? 'reorder the shipment and build' : 'build your parts'}. ${Math.ceil(G.prepLeft)} s`; else if (G.ev) $('banner').textContent = `${G.ev.label} (${G.ev.left})`;
    $('cyc').textContent = G.cycles; $('stalls').textContent = G.stalls; $('fwds').textContent = G.forwards; $('corr').textContent = G.corrupt;
    document.querySelectorAll('.tool').forEach(b => b.classList.toggle('poor', COST[b.dataset.tool] > G.credits));
  }

  function applyShift() {
    const c = BAY.on ? BAYCFG : shiftCfg(META.n), u = META.up;
    MOVE_COST = 3 - 0.5 * u.ooo;
    Object.assign(LEVEL, { shift: c.secs, rate: c.rate * ORDERS[ORDER].m * (1 + 0.05 * u.comp) * [0.85, 1, 1.12][META.diff], targetIPC: Math.min(c.target, c.rate * ORDERS[ORDER].m * 0.85), heavy: ORDERS[ORDER].heavy, pay: ORDERS[ORDER].pay, depChance: Math.max(0.1, c.dep - 0.1 * u.comp),
      maxQueue: (c.qmax || 10) + 3 * u.buf, health: 5 + u.hp + (META.diff === 0 ? 2 : 0), mix: c.mix, events: c.ev, line: c.line, sub: c.sub, hit: c.hit === 1 ? 1 : Math.min(0.98, (c.hit || 0.85) + 0.07 * u.cache + 0.04 * u.prefetch - 0.02 * u.align - 0.03 * u.lane2), shared: !!c.shared, regs: 5 + 4 * u.regs, models: !!c.models, traps: !!c.traps, reorder: !!c.reorder, safe: !!c.safe, soft: !!c.soft, credits: META.n === 0 ? 350 : 250 });
    for (const k in BASE) COST[k] = Math.round(BASE[k] * (1 - 0.2 * u.disc));
    document.querySelector('[data-tool=forward] em').textContent = COST.forward + ' cr';
    document.querySelector('[data-tool=stall] em').textContent = COST.stall + ' cr';
    document.querySelector('[data-tool=nop] em').textContent = COST.nop + ' cr each';
    $('goal').textContent = LEVEL.targetIPC.toFixed(2);
    const p = $('health'); p.replaceChildren(); for (let i = 0; i < LEVEL.health; i++) p.appendChild(document.createElement('i'));
  }
  function nextShift() { extraDone.audit = extraDone.puzzle = extraDone.bench = false; ti = -1; $('coach').hidden = true; clearNudge(); applyShift(); rollSurprise(); G.reset(); startOverlay(); syncRun(); }
  function openShop() {
    const rowOf = u => {
      const lv = META.up[u.id], maxed = lv >= u.max, cost = u.cost[lv], locked = lv === 2 && stars() < 6;
      return `<div class="up"><div><strong>${u.name}</strong> ${'●'.repeat(lv)}${'○'.repeat(u.max - lv)}<br><small>${u.desc}</small></div>
        <button data-up="${u.id}" ${maxed || locked || META.bank < cost ? 'disabled' : ''}>${maxed ? 'Maxed' : locked ? 'Needs 6 stars' : cost + ' bank'}</button></div>`;
    };
    const rows = GROUPS.map((g, gi) => { const it = UPS.filter(u => UGRP[u.id] === gi && META.n >= (UNLOCK[u.id] || 0)); return it.length ? `<h3>${g}</h3>` + it.map(rowOf).join('') : ''; }).join('') + '<p class="fine">More upgrades unlock as you finish shifts.</p>';
    showOverlay(`<div class="card"><h2>Upgrade shop</h2><p>Bank: <b>${META.bank}</b>. Stars: <b>${stars()}</b> (a third upgrade level needs 6 stars). Upgrades and the parts you built stay for every later shift.</p><p class="fine">Cycle time ${cycleMs()} ms. Net heat per cycle: ${heatGain() > 0 ? '+' : ''}${heatGain().toFixed(1)} (above zero means throttling risk).</p>${rows}
      <p><button id="aud">Amdahl audit</button> <button id="bch">Benchmark</button> <button id="puz">Scheduling puzzle</button> <button id="car">Career</button> <button id="sbx">Sandbox</button> <button id="dly">Daily</button> <button id="slt">Slots</button> <button id="wipe">Reset campaign</button></p>
      <button class="primary" id="nxt">Start shift ${META.n + 1}</button></div>`);
    document.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
      const u = UPS.find(x => x.id === b.dataset.up), lv = META.up[u.id];
      if (lv < u.max && META.bank >= u.cost[lv] && !(lv === 2 && stars() < 6)) { META.bank -= u.cost[lv]; META.up[u.id]++; if (u.id === 'pred') META.bpMode = META.up.pred; save(); beep(660, 0.1, 'triangle'); openShop(); }
    });
    $('nxt').onclick = nextShift; $('car').onclick = () => openStats(openShop); $('sbx').onclick = enterSandbox; $('dly').onclick = () => openDaily(openShop); $('slt').onclick = () => openSlots(openShop); $('bch').onclick = () => openBench(openShop); $('aud').onclick = openAudit; $('puz').onclick = openPuzzle;
    let w = false;
    $('wipe').onclick = () => { if (!w) { w = true; $('wipe').textContent = 'Click again to wipe'; return; } try { localStorage.removeItem(SAVE); } catch (e) { /* ignore */ } location.reload(); };
  }
  const extraDone = { audit: false, puzzle: false, bench: false };
  let audit = null, pz = null;

  function diagram(g) {
    const cols = g.trace; if (!cols.length) return '';
    const ids = [...new Set(cols.flat().filter(Boolean))].sort((a, b) => a - b).slice(0, 10);
    const rows = ids.map(id => {
      let prev = -1;
      const cells = cols.map(col => { const k = col.indexOf(id); const cls = k >= 0 && k === prev ? ' class="st"' : ''; prev = k; return `<td${cls}>${k >= 0 ? STAGES[k][0] : ''}</td>`; }).join('');
      return `<tr><th>${g.names[id]}</th>${cells}</tr>`;
    }).join('');
    return `<details><summary>Pipeline timing diagram (last ${cols.length} cycles)</summary><div class="tt"><table>${rows}</table></div><small>Orange cells repeat a stage: that crate stalled there.</small></details>`;
  }

  // Amdahl audit: spread a budget over four parts; speedup = 1 / sum(fraction / factor)
  const AN = ['CPU', 'Memory', 'Hard disk', 'Interconnect'], AP = [0, 10, 22, 40], AB = 50;
  const ampd = (f, lv) => 1 / f.reduce((a, fr, k) => a + fr / lv[k], 0);
  function openAudit() {
    if (!audit) {
      const raw = [20, 35, 40, 5].map(v => Math.max(3, v + Math.round((Math.random() - 0.5) * 24))), tot = raw.reduce((a, b) => a + b, 0);
      const f = raw.map(v => v / tot); let best = 1;
      for (let a = 1; a <= 4; a++) for (let b = 1; b <= 4; b++) for (let c = 1; c <= 4; c++) for (let d = 1; d <= 4; d++) {
        const lv = [a, b, c, d];
        if (lv.reduce((x, v) => x + AP[v - 1], 0) <= AB) best = Math.max(best, ampd(f, lv));
      }
      audit = { f, lv: [1, 1, 1, 1], goal: best * 0.97 };
    }
    const cost = audit.lv.reduce((x, v) => x + AP[v - 1], 0), sp = ampd(audit.f, audit.lv);
    const rows = AN.map((n, k) => `<div class="up"><div><strong>${n}</strong><br><small>${Math.round(audit.f[k] * 100)}% of the run time</small></div><button data-k="${k}">×${audit.lv[k]} (${AP[audit.lv[k] - 1]})</button></div>`).join('');
    showOverlay(`<div class="card"><h2>Amdahl audit</h2><p>Spend ${AB} points on faster parts and reach a speedup of ×${audit.goal.toFixed(2)}. A part can only help as much as its share of the time.</p>${rows}
      <p>Spent ${cost}/${AB}. Speedup <b>×${sp.toFixed(2)}</b></p><p id="amsg"></p><button class="primary" id="sub">Submit audit</button> <button id="back">Back to shop</button></div>`);
    document.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = +b.dataset.k; audit.lv[k] = audit.lv[k] % 4 + 1; openAudit(); });
    $('back').onclick = openShop;
    $('sub').onclick = () => {
      if (cost > AB) return void ($('amsg').textContent = 'Over budget.');
      if (sp < audit.goal) return void ($('amsg').textContent = 'Not enough speedup. Try a different split.');
      if (!extraDone.audit) { META.bank += 60; save(); extraDone.audit = true; $('amsg').textContent = 'Audit passed: +60 bank.'; } else $('amsg').textContent = 'Audit passed (reward already paid this shift).';
      audit = null;
    };
  }

  // Scheduling puzzle: no forwarding, so a consumer must start 3 cycles after its producer
  function pzStalls(ins, order) {
    const t = {}; let prev = -1;
    order.forEach(id => { let at = prev + 1; ins[id].srcs.forEach(x => { at = Math.max(at, t[x] + 3); }); t[id] = at; prev = at; });
    return prev - (order.length - 1);
  }
  function pzBest(ins) {
    let best = 99; const used = [], ord = [];
    (function go() {
      if (ord.length === ins.length) { best = Math.min(best, pzStalls(ins, ord)); return; }
      for (const i of ins) if (!used[i.id] && i.srcs.every(x => used[x])) { used[i.id] = true; ord.push(i.id); go(); ord.pop(); used[i.id] = false; }
    })();
    return best;
  }
  function openPuzzle() {
    if (!pz) {
      const ins = [];
      for (let i = 0; i < 6; i++) {
        const sr = new Set(); if (i && Math.random() < 0.85) sr.add(Math.floor(Math.random() * i)); if (i > 1 && Math.random() < 0.4) sr.add(Math.floor(Math.random() * i));
        const srcs = [...sr];
        ins.push({ id: i, srcs, text: `add r${i + 1}, ${[...srcs.map(x => 'r' + (x + 1)), 'r0', 'r0'].slice(0, 2).join(', ')}` });
      }
      pz = { ins, order: [], best: pzBest(ins) };
    }
    const done = pz.order.length === pz.ins.length, st = done ? pzStalls(pz.ins, pz.order) : 0;
    const left = pz.ins.filter(i => !pz.order.includes(i.id)).map(i => `<button data-i="${i.id}" ${i.srcs.every(x => pz.order.includes(x)) ? '' : 'disabled'}>${i.text}</button>`).join(' ');
    showOverlay(`<div class="card"><h2>Scheduling puzzle</h2><p>No forwarding on this line, so a crate must wait 3 cycles after the crate it reads from. Reorder like a compiler: pick crates in the order they enter the line. A crate unlocks once the ones it reads from are placed.</p>
      <p>Order so far: ${pz.order.map(i => pz.ins[i].text).join(' | ') || 'empty'}</p><p>${left}</p>
      ${done ? `<p>Your order costs <b>${st}</b> stall cycles. Best possible: <b>${pz.best}</b>.</p>` : ''}
      <button id="pzr">Clear</button> <button id="pzn">New puzzle</button> <button id="back">Back to shop</button></div>`);
    document.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
      pz.order.push(+b.dataset.i);
      if (pz.order.length === pz.ins.length && !extraDone.puzzle) {
        const r = pzStalls(pz.ins, pz.order), gain = r <= pz.best ? 45 : r <= pz.best + 1 ? 15 : 0;
        if (gain) { META.bank += gain; save(); extraDone.puzzle = true; }
      }
      openPuzzle();
    });
    $('pzr').onclick = () => { pz.order = []; openPuzzle(); };
    $('pzn').onclick = () => { pz = null; openPuzzle(); };
    $('back').onclick = openShop;
  }
  const RANKS = ['Intern', 'Line operator', 'Technician', 'Line lead', 'Supervisor', 'Plant engineer', 'Chief architect'];
  const rankOf = () => RANKS[Math.min(META.n, RANKS.length - 1)];
  const stars = () => Object.values(META.stars).reduce((a, b) => a + b, 0);

  function summary(g, ipc) {
    return `<dl><dt>Score</dt><dd>${g.score}</dd><dt>Cycle time</dt><dd>${cycleMs()} ms</dd><dt>IPC / CPI</dt><dd>${ipc.toFixed(2)} / ${g.good ? (g.cycles / g.good).toFixed(2) : '–'}</dd>
      <dt>Speedup vs. non-pipelined</dt><dd>×${(ipc * 5).toFixed(2)}</dd>
      <dt>Stalls / flushes / corrupted / dropped</dt><dd>${g.stalls} / ${g.flushes} / ${g.corrupt} / ${g.dropped}</dd>
      <dt>Cache misses / port conflicts / complex</dt><dd>${g.misses} / ${g.structs} / ${g.heavyN}</dd>
      <dt>Iron law: instructions × CPI</dt><dd>${g.good} × ${g.good ? (g.cycles / g.good).toFixed(2) : '–'}</dd>
      <dt>MIPS at 1 GHz (1000 / CPI)</dt><dd>${g.good ? (1000 * g.good / g.cycles).toFixed(0) : '–'}</dd>
      <dt>Avg memory access time (cycles)</dt><dd>${g.memOps ? (1 + 0.15 * Math.max(0, META.up.cache - 1) + g.misses / g.memOps * Math.max(1, 3 - META.up.l2)).toFixed(2) : '–'}</dd>
      <dt>Alignment traps / EX wait cycles</dt><dd>${g.traps} / ${g.exWaits}</dd><dt>Out-of-order issues</dt><dd>${g.ooo}</dd><dt>Branches / flushes</dt><dd>${g.branches} / ${g.flushes}${g.squashed ? ` (${g.squashed} squashed)` : ''}</dd></dl>${diagram(g)}${studyBox(g)}`;
  }

  const BOXSVG = '<svg viewBox="0 0 70 56" class="box" aria-hidden="true"><path d="M5 18h60v34H5z" fill="#b8874f"/><path d="M5 18l10-10h40l10 10z" fill="#d1a266"/><path d="M28 18h14v14H28z" fill="#e8d7b0"/></svg>';

  // Office scene drawn from scratch: window, clock, desk, the manager, you from behind, and an ending prop.
  function sceneSvg(happy) {
    const sky = happy ? ['#f6c26b', '#c06a6a'] : ['#3b2a4a', '#8a2f3a'];
    const prop = happy
      ? '<g class="prop"><path d="M196 254v-22h22v22z" fill="#8a6b3a"/><path d="M186 192h42v22q0 18-21 18t-21-18z" fill="#f0c34a"/><path d="M186 200q-14 0-14 12t16 12M228 200q14 0 14 12t-16 12" fill="none" stroke="#f0c34a" stroke-width="4"/><path d="M207 205l4 9 10 1-8 6 3 10-9-6-9 6 3-10-8-6 10-1z" fill="#fff4c2"/></g>'
      : '<g class="prop"><path d="M170 254v-40h60v40z" fill="#b8874f"/><path d="M170 214l12-14h36l12 14z" fill="#d1a266"/><path d="M190 214h20v14h-20z" fill="#e8d7b0"/><path d="M180 200q8-24 20-8 8-20 18 4" fill="none" stroke="#4f9a5b" stroke-width="5"/></g>';
    const guard = happy ? '' : '<g class="guard"><rect x="562" y="206" width="60" height="100" rx="8" fill="#1b2d42"/><path d="M574 206h36v-14q0-18-18-18t-18 18z" fill="#223a56"/><rect x="570" y="186" width="44" height="7" rx="3" fill="#10161c"/><circle cx="592" cy="214" r="13" fill="#c8946a"/><path d="M566 244q26 20 52 0" fill="none" stroke="#c8946a" stroke-width="9" stroke-linecap="round"/><rect x="578" y="262" width="28" height="6" fill="#d4a94f"/></g>';
    return `<svg viewBox="0 0 640 360" role="img" aria-label="The plant manager’s office">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d3548"/><stop offset="1" stop-color="#142636"/></linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a33"/><stop offset="1" stop-color="#5d3a1f"/></linearGradient></defs>
    <rect width="640" height="360" fill="url(#wall)"/>
    <rect x="36" y="36" width="230" height="170" rx="6" fill="#0b1620"/><rect x="44" y="44" width="214" height="154" fill="url(#sky)"/>
    <g fill="#0f1b27"><rect x="52" y="140" width="28" height="58"/><rect x="86" y="118" width="22" height="80"/><rect x="114" y="150" width="34" height="48"/><rect x="154" y="104" width="26" height="94"/><rect x="186" y="132" width="30" height="66"/><rect x="222" y="154" width="30" height="44"/></g>
    <g fill="#ffd36b" opacity=".8"><rect x="92" y="130" width="5" height="5"/><rect x="160" y="116" width="5" height="5"/><rect x="164" y="136" width="5" height="5"/><rect x="194" y="146" width="5" height="5"/></g>
    <path d="M44 74h214M44 104h214M44 134h214M44 164h214M151 44v154" stroke="#0b1620" stroke-width="3" opacity=".4"/>
    <circle cx="344" cy="74" r="28" fill="#e8eef4" stroke="#2c4b5b" stroke-width="5"/><path d="M344 74v-18M344 74l12 8" stroke="#10161c" stroke-width="3" stroke-linecap="round"/>
    <rect x="430" y="44" width="110" height="74" rx="3" fill="#2a1d12"/><rect x="438" y="52" width="94" height="58" fill="#e8d7b0"/><path d="M448 68h74M448 82h60M448 96h70" stroke="#8a6b3a" stroke-width="3"/><circle cx="514" cy="98" r="7" fill="#c0392b"/>
    <rect y="300" width="640" height="60" fill="#0f1b27"/>
    <g class="bossg"><rect x="352" y="196" width="96" height="110" rx="14" fill="#10202c"/>
      <path d="M338 262q0-48 62-48t62 48z" fill="#2c4b5b"/><path d="M382 214l18 26 18-26z" fill="#eef2f6"/><path d="M394 226h12l6 34h-24z" fill="${happy ? '#3aa17a' : '#c0392b'}"/>
      <rect x="391" y="196" width="18" height="22" fill="#c8946a"/><circle cx="400" cy="172" r="34" fill="#d9a679"/>
      <ellipse cx="366" cy="176" rx="5" ry="8" fill="#c8946a"/><ellipse cx="434" cy="176" rx="5" ry="8" fill="#c8946a"/>
      <path d="M366 166q0-36 34-36t34 36q-8-18-34-18t-34 18z" fill="#2a2018"/>
      <g fill="#fff"><ellipse cx="388" cy="174" rx="7" ry="6"/><ellipse cx="412" cy="174" rx="7" ry="6"/></g>
      <g fill="#10161c"><circle cx="389" cy="175" r="3"/><circle cx="413" cy="175" r="3"/></g>
      <g fill="none" stroke="#10161c" stroke-width="2.2"><circle cx="388" cy="174" r="9.5"/><circle cx="412" cy="174" r="9.5"/><path d="M397 174h6"/></g>
      <path d="${happy ? 'M378 160q10-6 20-1M404 159q10-5 20 1' : 'M378 156l20 6M424 156l-20 6'}" stroke="#2a2018" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M400 178l-3 10h6" stroke="#b5835a" stroke-width="2" fill="none"/>
      <ellipse class="mouth" cx="400" cy="197" rx="${happy ? 9 : 7}" ry="${happy ? 3.5 : 2.5}" fill="#6b2a2a"/></g>
    <path d="M110 262h500l30 98H80z" fill="url(#wood)"/><rect x="104" y="252" width="512" height="14" rx="3" fill="#a06b3e"/>
    <rect x="372" y="272" width="56" height="16" rx="2" fill="#d4a94f"/><text x="400" y="284" text-anchor="middle" font-size="12" font-family="Barlow Condensed, sans-serif" font-weight="700" fill="#2a1d12">VOSS</text>
    <rect x="296" y="242" width="44" height="10" fill="#e8eef4"/><rect x="300" y="236" width="40" height="6" fill="#cfd9e2"/>
    <path d="M530 252v-48l24-10" stroke="#6b7c8a" stroke-width="5" fill="none"/><path d="M546 186l28 14-32 6z" fill="#e3b43c"/><path d="M552 206l-44 46h92z" fill="#ffe9a8" opacity=".1"/>
    <g class="rival"><path d="M556 306q0-46 36-50t36 50z" fill="#e8eef4"/><path d="M584 256l8 14 8-14z" fill="#2c4b5b"/><rect x="584" y="244" width="16" height="14" rx="5" fill="#c08a60"/><circle cx="592" cy="232" r="16" fill="#c08a60"/><path d="M576 228q0-20 16-20 6 0 10 3l6-6-2 11q4 4 4 12-8-8-20-8t-14 8z" fill="#7a3b1e"/><g fill="none" stroke="#10161c" stroke-width="2"><circle cx="586" cy="232" r="5"/><circle cx="598" cy="232" r="5"/></g><path d="M586 242q6 4 12 0" stroke="#7a2f2f" stroke-width="2" fill="none"/></g>
    ${prop}${guard}
    <g class="me"><path d="M10 360q0-72 110-72t110 72z" fill="#d9822b"/><path d="M66 360v-60M174 360v-60" stroke="#f4d03f" stroke-width="10" opacity=".9"/>
      <rect x="100" y="262" width="40" height="34" fill="#b8825a"/><circle cx="120" cy="246" r="32" fill="#3a2a20"/>
      <path d="M82 246q0-42 38-42t38 42z" fill="#f4d03f"/><rect x="76" y="244" width="88" height="9" rx="4" fill="#d6b52a"/><rect x="112" y="206" width="16" height="8" rx="2" fill="#b8941f"/></g>
    <rect width="640" height="360" fill="${happy ? 'rgba(255,200,90,.08)' : 'rgba(110,0,20,.18)'}"/></svg>`;
  }

  let sceneId = 0;
  async function typeText(el, text, id, st) {
    for (let i = 1; i <= text.length; i++) {
      if (id !== sceneId) return;
      if (st.skipLine) { el.textContent = text; return; }
      el.textContent = text.slice(0, i); const ch = text[i - 1];
      if (i % 2 === 0) beep(st.who === 'you' ? 260 : 130 + Math.random() * 40, 0.02, 'square', 0.012);
      await new Promise(r => setTimeout(r, ch === ',' ? 170 : '.!?'.includes(ch) ? 340 : 34));
    }
  }
  function confetti() {
    const sc = document.querySelector('.stage'); if (!sc) return;
    for (let k = 0; k < 44; k++) {
      const p = document.createElement('i'); p.className = 'cf';
      p.style.cssText = `left:${Math.random() * 100}%;background:${['#ffb347', '#5cc8ff', '#7ee8a8', '#ff7aa2', '#e3b43c'][k % 5]};animation-delay:${Math.random() * 0.8}s`;
      sc.appendChild(p);
    }
  }

  // Click, tap, Enter or Space finishes the current line, then moves to the next one.
  async function playScene({ happy, lines, stamp, stampClass, after, noStamp }) {
    const id = ++sceneId, st = { skipLine: false, skipAll: false, go: null, who: 'boss' };
    const L = lines.map(l => (typeof l === 'string' ? { who: 'boss', t: l } : l));
    showOverlay(`<div class="cine ${happy ? 'win' : 'lose'}" id="cine" tabindex="0">
      <div class="stage" id="stage" data-speaker="boss">${sceneSvg(happy)}<div class="cap">Plant manager’s office, ${happy ? '5:02' : '5:01'} pm</div>
        <div id="stamp" class="stamp ${stampClass}" hidden>${stamp}</div><button id="skip" class="skip">Skip scene</button></div>
      <div class="dlg"><div class="who" id="who"></div><p id="txt"></p><span class="more" id="more" hidden>▼ Click to continue</span></div></div>`);
    const cine = $('cine'), stage = $('stage'), who = $('who'), txt = $('txt'), more = $('more');
    const next = () => { if (id !== sceneId) return; if (st.go) { const g = st.go; st.go = null; more.hidden = true; g(); } else st.skipLine = true; };
    cine.onclick = next;
    cine.onkeydown = e => { if (['Enter', ' ', 'ArrowRight'].includes(e.key)) { e.preventDefault(); next(); } };
    $('skip').onclick = e => { e.stopPropagation(); st.skipAll = true; st.skipLine = true; next(); };
    cine.focus();
    await new Promise(r => setTimeout(r, 700));
    for (const line of L) {
      if (id !== sceneId || st.skipAll) break;
      st.skipLine = false; st.who = line.who; stage.dataset.speaker = line.who;
      who.textContent = { you: 'You', kit: 'Kit Marlow, rival' }[line.who] || 'Plant Manager Voss'; txt.textContent = ''; more.hidden = true; stage.classList.add('typing');
      await typeText(txt, line.t, id, st);
      stage.classList.remove('typing');
      if (id !== sceneId || st.skipAll) break;
      more.textContent = '▼ Click to continue'; more.hidden = false;
      await new Promise(r => { st.go = r; });
    }
    if (id !== sceneId) return;
    if (st.skipAll || noStamp) return after();
    stage.classList.add('finale'); who.textContent = ''; txt.textContent = '';
    $('stamp').hidden = false; shake(); beep(happy ? 660 : 90, 0.35, happy ? 'triangle' : 'sawtooth', 0.08);
    if (happy) confetti();
    more.textContent = '▼ Click to see your results'; more.hidden = false;
    await new Promise(r => { st.go = r; });
    if (id === sceneId) after();
  }
  const YOU_LOSE = ['But the stall unit was—', 'I can explain.', '…', 'Can I at least keep the stapler?'];
  const KIT_WIN = ['Lucky streak. Enjoy it.', 'Promotion already? I will be watching.', 'Do not let it go to your head.'];
  const KIT_FIRED = ['Told you. Rookies.', 'I would say I am sorry, but I am not.', 'Mind if I take your desk plant?'];
  const END_LINES = [{ who: 'boss', t: 'You held the Grand opening together. The client signed for ten years.' }, { who: 'boss', t: 'Chief architect. The plant is yours.' },
    { who: 'kit', t: 'Fine. You win. This time.' }, { who: 'you', t: 'Same time next shift?' }];
  // Story beats play once, before the briefing of that shift.
  const STORY = {
    0: [{ who: 'boss', t: 'New hire? Good. Line 1 is yours. Keep the crates moving and nothing corrupted.' }, { who: 'kit', t: 'Another rookie. The last one lasted two shifts.' }, { who: 'you', t: 'I will be fine.' }],
    2: [{ who: 'kit', t: 'I hear Voss lets rookies reorder the shipment now. Bold.' }, { who: 'kit', t: 'Break one dependency and the code lies. Do not say I did not warn you.' }, { who: 'you', t: 'Thanks for the concern.' }],
    4: [{ who: 'boss', t: 'Ms. Aldana from the client is visiting this week. No layoffs on my shift, please.' }, { who: 'kit', t: 'I ran the Math lab last year. Multiply crates ate my whole afternoon.' }, { who: 'you', t: 'Then I will space them out.' }],
    6: [{ who: 'boss', t: 'Ms. Aldana loved your numbers. She wants the Express hub at full speed.' }, { who: 'kit', t: 'Careful. A hot line is a throttled line.' }, { who: 'you', t: 'I know what the heat bar is for.' }],
    9: [{ who: 'boss', t: 'Grand opening. Every problem we have, all at once, in front of the client.' }, { who: 'kit', t: 'I bet my badge you cannot hold IPC through all of it.' }, { who: 'you', t: 'Keep your badge. You will need it.' }]
  };
  const ACH = [['first', 'First shift', 'Win your first shift'], ['clean', 'Spotless', 'Win a shift with 3 stars'], ['streak', 'Hot streak', 'Reach a streak of 20'],
    ['fired', 'Welcome to the club', 'Get fired'], ['layoff', 'Out-of-order mishap', 'Get laid off for a broken reorder'], ['ooo', 'Reorder buffer', 'Issue 10 crates out of order in one shift'],
    ['cool', 'Cool head', 'Win with the overclock at level 2 or more and no throttling'], ['rich', 'Plant fund', 'Hold 800 in the bank']];
  function award(g, win, n) {
    const cond = { first: win, clean: win && n === 3, streak: g.best >= 20, fired: !win, layoff: !!g.broken, ooo: g.ooo >= 10, cool: win && META.up.clock >= 2 && !g.throttles, rich: META.bank >= 800 }, got = [];
    for (const [id, name] of ACH) if (cond[id] && !META.ach[id]) { META.ach[id] = true; got.push(name); }
    return got;
  }
  function openStats(back) {
    const S = META.stats;
    showOverlay(`<div class="card"><h2>Career</h2><dl><dt>Rank</dt><dd>${rankOf()}</dd><dt>Shifts won</dt><dd>${S.wins}</dd><dt>Times fired</dt><dd>${META.fired}</dd><dt>Stars</dt><dd>${stars()}</dd>
      <dt>Best streak</dt><dd>${S.best}</dd><dt>Crates shipped</dt><dd>${S.shipped}</dd></dl><h3>Achievements</h3>
      ${ACH.map(a => `<div class="up"><div><strong>${META.ach[a[0]] ? '★' : '☆'} ${a[1]}</strong><br><small>${a[2]}</small></div></div>`).join('')}<button class="primary" id="back">Back</button></div>`);
    $('back').onclick = back;
  }

  function fireReason(g, ipc) {
    if (g.broken) {
      const e = g.broken, why = { raw: 'It read a register before the line that writes it had run.', war: 'It overwrote a register an older line still needed.', waw: 'Two writes landed in the wrong order, so the old value won.',
        mem: 'A store and a memory access swapped places, so a load saw the wrong data.', branch: 'It crossed a branch. The branch decides which lines even run.' }[e.kind];
      return ['Your fault', [`You moved “${e.b.text}” above “${e.a.text}”.`, why, 'The client’s accounts now say every customer owes us one million dollars.', 'Out-of-order is a fine idea. Out-of-order without checking dependencies is a layoff.']];
    }
    const F = [];
    if (g.corrupt >= 3) F.push(['Your fault', [`${g.corrupt} corrupted crates shipped out the door.`, 'The client sent every one of them back, with a very polite letter.', 'Build the stall unit before the shift, not after the lawsuit.']]);
    if (g.defects >= 2) F.push(['Your fault', [`${g.defects} misaligned crates went straight through the line.`, 'Offsets must be multiples of 4. It was on the label. It is always on the label.']]);
    if (g.dropped >= 3) F.push(['Your fault', [`${g.dropped} crates fell off the intake belt.`, 'One landed on the forklift. The forklift has feelings too.', 'The belt was full and you watched it fill.']]);
    if (g.throttles >= 2) F.push(['Your fault', ['You ran the clock so hot the line throttled again and again.', 'The fire marshal says the smoke alarm was “working very hard”.']]);
    if (!F.length && g.health > 0) F.push(['Your fault', [`IPC ended at ${ipc.toFixed(2)}. The target was ${LEVEL.targetIPC.toFixed(2)}.`, 'Numbers do not lie. Spreadsheets sometimes do, but not these.']]);
    if (!F.length) F.push(['Your fault', ['The line shut down on your watch.', 'Nobody is saying it was entirely you. Everybody is saying it was you.']]);
    const L = [
      ['Bad luck', ['The power company cut the grid for “maintenance”. Nobody told us.', 'Nothing you did mattered. Someone has to take the blame, and you were closest to the fuse box.']],
      ['Bad luck', ['A pigeon got into the substation. The whole plant is offline.', 'Legal says the pigeon cannot be fired. You can.']],
      ['Bad luck', ['The company was acquired during your shift.', 'Your department has been “synergized”. That is a technical term for gone.']],
      ['Bad luck', ['Inspectors found the building has no fire exit. The plant closes today.', 'It is nobody’s fault. Mostly yours, on paper.']]];
    const N = [
      ['No reason at all', ['My cat walked across the keyboard and pressed “terminate employee”.', 'HR says the system is never wrong. I checked. It is.']],
      ['No reason at all', ['My nephew needs your desk. He also wants your pipeline.', 'He does not know what a pipeline is. That is fine. He has a lanyard.']],
      ['No reason at all', ['We hired a robot to do your job.', 'It is mostly a toaster with a clipboard. It is cheaper than you.']],
      ['No reason at all', ['You won the plant raffle. First prize is the rest of your life off.', 'It is mandatory. Please leave your badge.']]];
    const r = Math.random(), pool = r < 0.6 ? F : r < 0.8 ? L : N;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function endFired(g, ipc) {
    const [tag, lines] = fireReason(g, ipc);
    playScene({ happy: false, lines: lines.concat([{ who: 'you', t: YOU_LOSE[Math.floor(Math.random() * YOU_LOSE.length)] }]).concat(Math.random() < 0.5 ? [{ who: 'kit', t: KIT_FIRED[Math.floor(Math.random() * KIT_FIRED.length)] }] : []), stamp: g.broken ? 'Laid off' : 'Fired', stampClass: 'bad', after: () => {
      const lost = Math.floor(META.bank * (g.broken ? 0.6 : tag === 'Your fault' ? 0.3 : 0.15));
      META.bank -= lost; META.fired++; META.stats.shipped += g.good; const got = award(g, false, 0); save();
      const items = ['a mug, a stapler and a cactus', 'a framed Employee of the Month photo from 2019', 'one sock and a very full spreadsheet', 'a desk plant that outlived three managers'];
      showOverlay(`<div class="card fired"><div class="boxrow">${BOXSVG}<div><h2>${g.broken ? 'You’re laid off' : 'You’re fired'}</h2><p class="tag">${tag}</p></div></div>
        <p>You leave carrying ${items[Math.floor(Math.random() * items.length)]}.</p>
        <p>A lost shift pays nothing. Severance docked: <b>−${lost}</b> bank. Times fired: <b>${META.fired}</b>.</p>${got.length ? `<p class="new">Achievement unlocked: ${got.join(', ')}</p>` : ''}${summary(g, ipc)}
        <button class="primary" id="again">Apply for a new job</button> <button id="shop">Upgrade shop</button> <button id="rpl">Watch replay</button></div>`);
      $('again').onclick = nextShift; $('shop').onclick = openShop; $('rpl').onclick = startReplay;
    } });
  }

  function endWin(g, ipc) {
    const grade = ipc >= 0.9 ? 'A' : ipc >= 0.7 ? 'B' : ipc >= 0.5 ? 'C' : 'D';
    const n = 1 + (ipc >= LEVEL.targetIPC + 0.1 ? 1 : 0) + (!g.corrupt && !g.dropped ? 1 : 0);
    const parts = [['Base pay', Math.floor(g.score / 2 * LEVEL.pay)], ['Rating ' + grade, { A: 100, B: 50, C: 20, D: 0 }[grade]],
      ['Best streak ' + g.best, g.best * 2], ['Clean shift', n === 3 ? 40 : 0], ['Shift tier', 15 * META.n], ['Client tip', 10 + Math.floor(Math.random() * 31)]];
    const pay = parts.reduce((a, p) => a + p[1], 0), before = rankOf();
    META.bank += pay; META.stars[META.n] = Math.max(META.stars[META.n] || 0, n); META.n++; META.stats.wins++; META.stats.best = Math.max(META.stats.best, g.best); META.stats.shipped += g.good; const got = award(g, true, n); save();
    const rank = rankOf(), up = rank !== before;
    const praise = { A: ['Flawless. I have never seen IPC like that.', 'The client wants to meet whoever runs this line.'], B: ['Solid shift. The line hummed.', 'The client is happy, which makes me happy.'],
      C: ['You squeaked past the target. I will take it.', 'Next time, a few less bubbles, please.'], D: ['That was close. Very close.', 'Do not do that to me again.'] }[grade];
    playScene({ happy: true, lines: (up ? praise.concat([`Congratulations: you are now ${rank}.`, { who: 'kit', t: KIT_WIN[Math.floor(Math.random() * KIT_WIN.length)] }]) : praise).concat(META.n === 10 ? END_LINES : [{ who: 'you', t: 'Thank you, sir. Back to the line.' }]), stamp: 'Shift complete', stampClass: 'good', after: () => {
      showOverlay(`<div class="card"><h2>Shift complete</h2><p class="stars" aria-label="${n} of 3 stars">${'★'.repeat(n)}${'☆'.repeat(3 - n)}</p>${up ? `<p>Promoted to <b>${rank}</b>!</p>` : ''}
        <dl>${parts.map(p => `<dt>${p[0]}</dt><dd>+${p[1]}</dd>`).join('')}<dt>Total to the bank</dt><dd><b>+${pay}</b></dd></dl>${got.length ? `<p class="new">Achievement unlocked: ${got.join(', ')}</p>` : ''}${summary(g, ipc)}
        <button class="primary" id="shop">Upgrade shop</button> <button id="rpl">Watch replay</button></div>`);
      $('shop').onclick = openShop; $('rpl').onclick = startReplay;
    } });
  }

  // Prep: the shipment as crates on belts, exactly like the line. Drag them to reorder (out-of-order scheduling).
  // Break a dependency and the code gives wrong answers: you are laid off.
  const SLOT = { w: 116, h: 60, pad: 10, top: 48 }, UNDO_COST = 1.5;
  let MOVE_COST = 3;
  const rackCv = $('rack'), rx = rackCv.getContext('2d'), rackWrap = document.querySelector('.rackwrap');
  const mqFit = matchMedia('(min-width: 1001px) and (min-height: 560px)');
  const EDGE_COL = { raw: '#ff5a5f', war: '#ffb347', waw: '#ffb347', mem: '#b39cff', branch: '#5cc8ff' };
  let mfSig = '', rkL = { n: 0, aw: 0, ah: 0, cols: 0, W: 0, H: 0, sc: 1 };
  const slotPos = (k, cols) => ({ x: SLOT.pad + (k % cols) * SLOT.w, y: SLOT.top + Math.floor(k / cols) * SLOT.h });

  function rrr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  function depEdges(orig) {
    const E = [], rn = META.up.rename, isM = o => o.op === 'lw' || o.op === 'sw';
    for (let i = 0; i < orig.length; i++) for (let j = i + 1; j < orig.length; j++) {
      const a = orig[i], b = orig[j]; let kind = null;
      if (a.op === 'beq' || b.op === 'beq') kind = 'branch';
      else if (a.rd && (b.rs === a.rd || b.rt === a.rd)) kind = 'raw';
      else if (!rn && b.rd && (a.rs === b.rd || a.rt === b.rd)) kind = 'war';
      else if (!rn && a.rd && a.rd === b.rd) kind = 'waw';
      else if (isM(a) && isM(b) && (a.op === 'sw' || b.op === 'sw')) kind = 'mem';
      if (kind) E.push({ a, b, kind });
    }
    return E;
  }
  function newInsp(all) { return { scans: 3 + 2 * META.up.lab, tool: 'move', sel: -1, drag: null, hover: -1, scanned: new Set(), orig: all.slice(), edges: depEdges(all), hist: [], pop: [], lift: null, undos: 0 }; }
  function applyOrder(list) { const n = G.queue.length; G.queue = list.slice(0, n); G.manifest = list.slice(n); }
  // Moving a crate costs prep time (the forklift has to drive over). Undo is quicker.
  function popAt(ins, txt, col) { G.insp.pop.push({ x: (ins.rx || 0) + 54, y: (ins.ry || 0) - 4, txt, col, a: 1 }); }
  function doMove(from, to) {
    const I = G.insp, list = [...G.queue, ...G.manifest];
    if (!I || from === to) return;
    if (G.prepLeft < MOVE_COST) { beep(150, 0.15, 'square'); popAt(list[from], 'No time', '#ff5a5f'); return; }
    I.hist.push({ list: list.slice(), ins: list[from] });
    const [it] = list.splice(from, 1); list.splice(to, 0, it); applyOrder(list);
    G.prepLeft -= MOVE_COST; I.lift = { ins: it }; popAt(it, `−${MOVE_COST} s`, '#ff8a5c'); beep(220, 0.06, 'square');
  }
  function undoMove() {
    const I = G.insp; if (!I || !I.hist.length) return;
    if (G.prepLeft < UNDO_COST) { beep(150, 0.15, 'square'); return; }
    const h = I.hist.pop(); applyOrder(h.list); I.undos++;
    G.prepLeft -= UNDO_COST; I.lift = { ins: h.ins }; popAt(h.ins, `−${UNDO_COST} s`, '#ffb347'); beep(300, 0.06, 'triangle');
  }

  function endPrep() {
    const I = G.insp, list = [...G.queue, ...G.manifest];
    if (G.tut) {                                                          // training: no layoffs, but no leaving with a broken order
      const pos = new Map(list.map((x, k) => [x, k])), bad = I && I.edges.find(e => pos.get(e.a) > pos.get(e.b));
      if (bad) { G.note('Training: that order breaks a dependency. In a real shift it ends in a layoff. Undo it first.', 'bad'); beep(150, 0.2, 'square'); return; }
      if (I) applyOrder(I.orig.slice());
      G.note('Training: the crates go back to the original order for the demo.', 'info');
      G.mode = 'paused'; syncRun(); return;
    }
    G.mode = 'running';
    if (I) {
      const pos = new Map(list.map((x, k) => [x, k])), bad = I.edges.find(e => pos.get(e.a) > pos.get(e.b));
      if (bad && LEVEL.safe) { G.mode = 'prep'; G.prepLeft = 10; G.note('Supervisor: stop! That order breaks a dependency. Fix it before the line starts. (Practice round: no layoff.)', 'bad'); beep(150, 0.2, 'square'); return; }
      if (bad) { G.broken = bad; G.finish('broken'); return; }
    }
    syncRun();
  }

  function fitFloor() {
    if (!mqFit.matches) { if (canvas.style.height) { canvas.style.width = ''; canvas.style.height = ''; } return; }
    const box = document.querySelector('.scroller'), w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    const sc = Math.min(w / GEO.W, h / GEO.H);
    canvas.style.width = Math.floor(GEO.W * sc) + 'px'; canvas.style.height = Math.floor(GEO.H * sc) + 'px';
  }
  function layoutRack(n) {
    const fit = mqFit.matches, aw = rackWrap.clientWidth, ah = fit ? rackWrap.clientHeight : Infinity;
    if (!aw || (fit && !ah)) return;
    if (rkL.n === n && rkL.aw === aw && rkL.ah === ah) return;
    const opts = [];
    for (let cols = 2; cols <= 9; cols++) {
      const rows = Math.ceil(n / cols), W = cols * SLOT.w + SLOT.pad * 2, H = rows * SLOT.h + SLOT.top + 36;
      opts.push({ cols, W, H, sc: Math.min(aw / W, ah / H, fit ? 1.6 : 1) });
    }
    const mx = Math.max(...opts.map(o => o.sc)), p = opts.filter(o => o.sc >= mx * 0.9).pop();
    rkL = { n, aw, ah, cols: p.cols, W: p.W, H: p.H, sc: p.sc };
    rackCv.width = p.W; rackCv.height = p.H;
    rackCv.style.width = Math.floor(p.W * p.sc) + 'px'; rackCv.style.height = Math.floor(p.H * p.sc) + 'px';
  }

  const DUST = Array.from({ length: 18 }, () => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.9 }));
  function drawForklift(c, fx, fy, t, moving) {                     // (fx, fy) = left tip of the forks
    c.save(); c.translate(fx, fy);
    c.fillStyle = '#2b3a46'; c.fillRect(-4, -46, 5, 48);
    c.fillStyle = '#c8cfd6'; c.fillRect(-2, -2, 56, 4);
    c.fillStyle = '#e3b43c'; rrr(c, -64, -26, 58, 22, 4); c.fill();
    c.fillStyle = '#10161c'; c.fillRect(-64, -8, 58, 4);
    c.strokeStyle = '#2b3a46'; c.lineWidth = 3; c.beginPath(); c.moveTo(-50, -26); c.lineTo(-50, -48); c.lineTo(-22, -48); c.lineTo(-22, -26); c.stroke();
    c.fillStyle = '#d9a679'; c.beginPath(); c.arc(-36, -36, 6, 0, 6.3); c.fill();
    c.fillStyle = '#f4d03f'; c.beginPath(); c.arc(-36, -38, 6.5, Math.PI, 0); c.fill();
    c.fillStyle = '#10161c'; for (const wx of [-52, -18]) { c.beginPath(); c.arc(wx, 2, 8, 0, 6.3); c.fill(); }
    if (moving) { c.fillStyle = 'rgba(255,170,60,.95)'; c.beginPath(); c.arc(-34, -52, 3.5 + Math.sin(t * 20), 0, 6.3); c.fill(); }
    c.restore();
  }

  // The warehouse: pallet racking with crates on the shelves, lamps overhead, a forklift on the floor.
  function drawRack(now, dt) {
    const I = G.insp; if (!I) return;
    const list = [...G.queue, ...G.manifest]; layoutRack(list.length);
    if (!rkL.cols) return;
    const c = rx, cols = rkL.cols, W = rkL.W, H = rkL.H, t = now / 1000, k = 1 - Math.exp(-dt / 80), d = dt / 1000;
    const rows = Math.ceil(list.length / cols), fl = H - 30, mono = '9px "IBM Plex Mono", monospace';
    c.clearRect(0, 0, W, H);
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0a121b'); bg.addColorStop(1, '#14222f'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(120,160,190,.05)'; c.lineWidth = 1; c.beginPath(); for (let x = 0; x < W; x += 9) { c.moveTo(x, 0); c.lineTo(x, fl); } c.stroke();
    c.fillStyle = '#1a2b3a'; c.fillRect(0, 0, W, 14); c.strokeStyle = '#2c4357'; c.lineWidth = 2; c.beginPath();
    for (let x = 0; x < W; x += 40) { c.moveTo(x, 0); c.lineTo(x + 20, 14); c.lineTo(x + 40, 0); } c.stroke();
    for (let x = 90; x < W; x += 230) {
      const gg = c.createRadialGradient(x, 18, 4, x, 70, 170); gg.addColorStop(0, 'rgba(255,225,150,.26)'); gg.addColorStop(1, 'rgba(255,225,150,0)');
      c.fillStyle = gg; c.fillRect(x - 170, 14, 340, fl); c.fillStyle = '#c8d6e0'; c.beginPath(); c.moveTo(x - 14, 14); c.lineTo(x + 14, 14); c.lineTo(x + 8, 24); c.lineTo(x - 8, 24); c.fill();
      c.fillStyle = '#fff1c2'; c.fillRect(x - 8, 24, 16, 3);
    }
    for (let r = 0; r < rows; r++) {
      const y = SLOT.top + r * SLOT.h;
      c.fillStyle = '#0b1620'; c.fillRect(6, y - 8, W - 12, GEO.ch + 14);
      c.fillStyle = '#e0742f'; c.fillRect(4, y + GEO.ch + 2, W - 8, 6); c.fillStyle = '#f29a58'; c.fillRect(4, y + GEO.ch + 2, W - 8, 2);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(6, y + GEO.ch + 8, W - 12, 4);
    }
    c.fillStyle = '#2f6fb3';
    for (let u = 0; u <= cols; u += 3) c.fillRect(SLOT.pad + u * SLOT.w - 5, SLOT.top - 14, 8, fl - SLOT.top + 14);
    if (cols % 3) c.fillRect(SLOT.pad + cols * SLOT.w - 5, SLOT.top - 14, 8, fl - SLOT.top + 14);
    c.fillStyle = '#1a2733'; c.fillRect(0, fl, W, 30);
    c.save(); c.beginPath(); c.rect(0, fl, W, 5); c.clip(); c.fillStyle = '#e3b43c'; c.fillRect(0, fl, W, 5); c.strokeStyle = '#10161c'; c.lineWidth = 3; c.beginPath();
    for (let x = -10; x < W + 10; x += 14) { c.moveTo(x, fl + 5); c.lineTo(x + 7, fl); } c.stroke(); c.restore();
    c.strokeStyle = 'rgba(227,180,60,.25)'; c.setLineDash([16, 12]); c.lineWidth = 2; c.beginPath(); c.moveTo(0, fl + 21); c.lineTo(W, fl + 21); c.stroke(); c.setLineDash([]);
    if (!I.lift) drawForklift(c, W - 150, fl + 14, t, false);
    if (!REDUCED) { c.fillStyle = 'rgba(255,240,200,.2)'; for (const p of DUST) { c.beginPath(); c.arc((p.x * W + t * 6 * p.s) % W, (p.y * fl + t * 3 * p.s) % fl, 1.4 * p.s, 0, 6.3); c.fill(); } }

    const dr = I.drag && I.drag.moved ? I.drag : null;
    const rest = list.map((ins, j) => j).filter(j => !dr || j !== dr.idx), slotOf = new Map();
    rest.forEach((j, q) => slotOf.set(list[j], dr && q >= dr.target ? q + 1 : q));
    list.forEach((ins, j) => {
      if (dr && j === dr.idx) return;
      const s = slotOf.get(ins), p = slotPos(s, cols), lifting = I.lift && I.lift.ins === ins;
      if (ins.rx === undefined) { ins.rx = p.x; ins.ry = p.y; }
      const kk = lifting ? 1 - Math.exp(-dt / 300) : k;
      ins.rx += (p.x - ins.rx) * kk; ins.ry += (p.y - ins.ry) * kk;
      if (lifting && Math.abs(p.x - ins.rx) + Math.abs(p.y - ins.ry) <= 3) I.lift = null;
      if (lifting) drawForklift(c, ins.rx + 26, ins.ry + GEO.ch, t, true);
      drawChipAt(c, ins, ins.rx, ins.ry - (lifting ? 6 : 0));
      c.fillStyle = '#8ba2ba'; c.font = mono; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(String(s + 1), p.x + 2, p.y - 2);
      if (j === I.sel || (j === I.hover && !dr)) { c.lineWidth = 3; c.strokeStyle = j === I.sel ? '#5cc8ff' : '#d4a94f'; rrr(c, ins.rx - 3, ins.ry - 3, GEO.cw + 6, GEO.ch + 6, 7); c.stroke(); }
    });
    if (dr) { const p = slotPos(dr.target, cols); c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = '#5cc8ff'; rrr(c, p.x, p.y, GEO.cw, GEO.ch, 5); c.stroke(); c.setLineDash([]); }
    const idx = new Map(list.map((x, j) => [x, j]));
    for (const X of I.scanned) for (const e of I.edges) {
      if (e.a !== X && e.b !== X) continue;
      const bad = idx.get(e.a) > idx.get(e.b);
      if (e.kind === 'branch' && !bad) continue;
      const ax = e.a.rx + GEO.cw / 2, ay = e.a.ry, bx = e.b.rx + GEO.cw / 2, by = e.b.ry, col = bad ? (OPT.cb ? '#d55e00' : '#ff2d3a') : (OPT.cb ? CB_EDGE[e.kind] : EDGE_COL[e.kind]);
      c.strokeStyle = col; c.lineWidth = bad ? 4 : 2.5; c.setLineDash(bad ? [7, 4] : OPT.cb && e.kind !== 'raw' ? [3, 5] : []); c.lineDashOffset = -t * 30;
      c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 30, bx, by); c.stroke(); c.setLineDash([]);
      c.fillStyle = col; c.beginPath(); c.arc(bx, by, 4, 0, 6.3); c.fill();
      if (bad) { c.font = '700 16px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.fillText('✕', (ax + bx) / 2, Math.min(ay, by) - 14); }
    }
    if (dr) { const ins = list[dr.idx]; c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 14; drawChipAt(c, ins, dr.x - dr.ox, dr.y - dr.oy); c.restore(); }
    for (const q of I.pop) { q.y -= 28 * d; q.a -= d * 0.6; c.globalAlpha = Math.max(0, q.a); c.fillStyle = q.col; c.font = '700 22px "Barlow Condensed", sans-serif'; c.textAlign = 'center'; c.fillText(q.txt, q.x, q.y); }
    c.globalAlpha = 1; I.pop = I.pop.filter(q => q.a > 0);
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  }

  function renderManifest() {
    const el = $('manifest'), prep = G.mode === 'prep' && G.insp, crates = !!prep && G.view === 'crates';
    el.hidden = !crates; $('vtoggle').hidden = !prep;
    document.querySelector('.stage-wrap').classList.toggle('crates', crates);
    if (!prep) return;
    const I = G.insp;
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === G.view)));
    document.querySelectorAll('.itool[data-ti]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ti === I.tool)));
    if (mfSig !== String(I.scans)) { mfSig = String(I.scans); $('scans').innerHTML = '<i class="pip"></i>'.repeat(I.scans); }
    $('pfill').style.width = Math.max(0, G.prepLeft / 60 * 100) + '%';
    $('psec').textContent = Math.ceil(G.prepLeft) + ' s'; $('costs').textContent = `move −${MOVE_COST} s, undo −${UNDO_COST} s`;
    $('undo').disabled = !I.hist.length || G.prepLeft < UNDO_COST;
  }

  const rackXY = e => { const r = rackCv.getBoundingClientRect(); return [(e.clientX - r.left) * rackCv.width / r.width, (e.clientY - r.top) * rackCv.height / r.height]; };
  const rackHit = (x, y) => {
    const n = G.queue.length + G.manifest.length;
    for (let j = 0; j < n; j++) { const p = slotPos(j, rkL.cols); if (x >= p.x && x <= p.x + GEO.cw && y >= p.y && y <= p.y + GEO.ch) return j; }
    return -1;
  };
  const rackTarget = (x, y, n) => {
    const col = Math.max(0, Math.min(rkL.cols - 1, Math.floor((x - SLOT.pad) / SLOT.w))), row = Math.max(0, Math.floor((y - SLOT.top + 8) / SLOT.h));
    return Math.min(n - 1, row * rkL.cols + col);
  };
  rackCv.addEventListener('pointerdown', e => {
    const I = G.insp; if (!I || G.mode !== 'prep') return;
    const [x, y] = rackXY(e), j = rackHit(x, y), list = [...G.queue, ...G.manifest];
    if (j < 0) { I.sel = -1; return; }
    if (I.tool === 'scan') {
      const ins = list[j];
      if (I.scanned.has(ins)) I.scanned.delete(ins); else if (I.scans > 0) { I.scans--; I.scanned.add(ins); beep(600, 0.08, 'triangle'); } else beep(150, 0.1, 'square');
      return;
    }
    const p = slotPos(j, rkL.cols);
    I.drag = { idx: j, sx: x, sy: y, x, y, ox: x - p.x, oy: y - p.y, moved: false, target: j };
    rackCv.setPointerCapture(e.pointerId);
  });
  rackCv.addEventListener('pointermove', e => {
    const I = G.insp; if (!I) return;
    const [x, y] = rackXY(e); I.hover = rackHit(x, y);
    const d = I.drag; if (!d) return;
    d.x = x; d.y = y;
    if (!d.moved && Math.hypot(x - d.sx, y - d.sy) > 8) d.moved = true;
    if (d.moved) d.target = rackTarget(x, y, G.queue.length + G.manifest.length);
  });
  const dropCrate = e => {
    const I = G.insp; if (!I || !I.drag) return;
    const d = I.drag, list = [...G.queue, ...G.manifest]; I.drag = null;
    if (e.type === 'pointercancel') return;
    if (d.moved) {
      doMove(d.idx, d.target); I.sel = -1;
    } else if (I.sel < 0) I.sel = d.idx;                                 // tap to pick up, tap another crate to swap into its place
    else if (I.sel === d.idx) I.sel = -1;
    else { doMove(I.sel, d.idx); I.sel = -1; }
  };
  rackCv.addEventListener('pointerup', dropCrate);
  rackCv.addEventListener('pointercancel', dropCrate);
  rackCv.addEventListener('pointerleave', () => { if (G.insp) G.insp.hover = -1; });
  $('manifest').addEventListener('click', e => { const t = e.target.closest('[data-ti]'); if (t && G.insp) G.insp.tool = t.dataset.ti; });
  $('undo').addEventListener('click', undoMove);
  $('vtoggle').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) G.view = b.dataset.view; });

  // Sandbox: write your own program and watch the line run it. Campaign upgrades are swapped out while you are in here.
  const SB = { saved: null, bp: 0, hit: 100, rep: 1, stall: 1, fwdEX: 0, fwdMEM: 0, l2: 0, mulu: 0, rob: 0, slot: 0, deep: 0, shared: 0, spec: 0, runs: [],
    text: 'lw r1, 0(r2)\nadd r3, r1, r4\nadd r5, r6, r7\nsub r8, r9, r10\nmul r11, r3, r5\nsw r11, 4(r2)\nbeq r3, r5 @A' };
  const SB_SET = [['Stall unit', 'stall', [['Off', 0], ['On', 1]]], ['Forward EX/MEM → EX', 'fwdEX', [['Off', 0], ['On', 1]]], ['Forward MEM/WB → EX', 'fwdMEM', [['Off', 0], ['On', 1]]],
    ['Branch unit', 'bp', [['No prediction', 0], ['Always not taken', 1], ['2-bit predictor', 2]]], ['Cache hit rate', 'hit', [['100%', 100], ['95%', 95], ['85%', 85], ['70%', 70], ['50%', 50]]],
    ['L2 cache', 'l2', [['None', 0], ['Level 1', 1], ['Level 2', 2]]], ['Multiplier and divider', 'mulu', [['Slow', 0], ['Fast', 1], ['Fastest', 2]]],
    ['Reorder buffer', 'rob', [['Off', 0], ['3 slots', 1], ['6 slots', 2], ['9 slots', 3]]], ['Speculative issue', 'spec', [['Off', 0], ['On', 1]]], ['Branch delay slot', 'slot', [['Off', 0], ['On', 1]]],
    ['Pipeline depth', 'deep', [['Normal', 0], ['Deeper 1', 1], ['Deeper 2', 2]]], ['Memory port', 'shared', [['Split', 0], ['Shared', 1]]], ['Repeat the program', 'rep', [['×1', 1], ['×2', 2], ['×4', 4], ['×8', 8]]]];
  const SB_PRE = [['RAW chain', 'add r1, r2, r3\nadd r4, r1, r5\nadd r6, r4, r1\nadd r7, r6, r4', 1], ['Load-use', 'lw r1, 0(r2)\nadd r3, r1, r4\nlw r5, 4(r2)\nadd r6, r5, r3\nsw r6, 8(r2)', 1],
    ['Mul and div', 'mul r1, r2, r3\nadd r4, r1, r5\ndiv r6, r4, r2\nadd r7, r6, r1\nadd r8, r2, r3', 1], ['Loop branch', 'add r1, r1, r2\nlw r3, 0(r4)\nbeq r1, r3 @A\nadd r5, r3, r1\nsw r5, 4(r4)', 8],
    ['Independent mix', 'lw r1, 0(r2)\nadd r3, r1, r4\nadd r5, r6, r7\nadd r8, r9, r10\nsub r11, r12, r13', 2], ['Speculation', 'lw r5, 0(r2)\nbeq r5, r6 @A\nadd r7, r8, r9\nadd r10, r11, r12\nadd r13, r14, r15', 8]];

  function parseProgram(text) {
    const spec = [], errs = [], R = t => { const m = /^r(\d{1,2})$/i.exec(t || ''); return m && +m[1] < 32 ? +m[1] : NaN; };
    text.split('\n').forEach((raw, n) => {
      const line = raw.replace(/[#;].*$/, '').trim(); if (!line) return;
      const m = /^(\w+)\s+(.*)$/.exec(line), bad = msg => errs.push(`Line ${n + 1}: ${msg}.`);
      if (!m) return bad('expected an instruction');
      const op = m[1].toLowerCase(), a = m[2].split(/[\s,]+/).filter(Boolean);
      if (['add', 'sub', 'and', 'or', 'mul', 'div'].includes(op)) {
        const [rd, rs, rt] = [R(a[0]), R(a[1]), R(a[2])];
        if (a.length !== 3 || [rd, rs, rt].some(Number.isNaN)) return bad(`${op} needs three registers like r1, r2, r3`);
        spec.push({ op: op === 'mul' || op === 'div' ? op : 'add', rd, rs, rt, text: `${op} r${rd}, r${rs}, r${rt}` });
      } else if (op === 'lw' || op === 'sw') {
        const mm = /^(-?\d+)\(r(\d{1,2})\)$/i.exec(a[1] || ''), r = R(a[0]);
        if (a.length !== 2 || !mm || Number.isNaN(r)) return bad(`${op} needs a register and an address like 4(r2)`);
        const rs = +mm[2], off = +mm[1];
        spec.push(op === 'lw' ? { op, rd: r, rs, off, text: `lw r${r}, ${off}(r${rs})` } : { op, rt: r, rs, off, text: `sw r${r}, ${off}(r${rs})` });
      } else if (op === 'beq') {
        const rs = R(a[0]), rt = R(a[1]);
        if (Number.isNaN(rs) || Number.isNaN(rt)) return bad('beq needs two registers like r1, r2');
        const site = a.find(x => /^@[abc]$/i.test(x)), out = a.find(x => /^(taken|nt)$/i.test(x)), si = site ? 'abc'.indexOf(site[1].toLowerCase()) : 0;
        spec.push({ op: 'beq', rs, rt, site: si, taken: out ? out.toLowerCase() === 'taken' : undefined, text: `beq r${rs}, r${rt} @${'ABC'[si]}` });
      } else bad(`unknown instruction "${op}"`);
    });
    if (!spec.length && !errs.length) errs.push('Write at least one instruction.');
    if (spec.length > 40) errs.push('Keep the program to 40 lines.');
    return { spec, errs };
  }
  function enterSandbox() {
    if (!SBON) { SBON = true; SB.runs = []; SB.saved = META.up; const z = {}; for (const k in META.up) z[k] = 0; META.up = z; }
    openSandbox();
  }
  function exitSandbox() { if (SBON) { SBON = false; META.up = SB.saved; } applyShift(); rollSurprise(); G.reset(); startOverlay(); syncRun(); }
  function readEditor() { SB.text = $('sbtext').value; SB_SET.forEach(([, k]) => { SB[k] = +$('sb_' + k).value; }); }
  // Builds the queue from the program and parks the line, ready to step.
  function runSandbox() {
    const { spec, errs } = parseProgram(SB.text);
    if (spec.length * SB.rep > 200) errs.push('The program times the repeat count is over 200 crates.');
    if (errs.length) return errs.join(' ');
    const u = META.up; Object.assign(u, { l2: SB.l2, mulu: SB.mulu, rob: SB.rob, spec: SB.spec, slot: SB.slot, deep: SB.deep, harv: 0 });
    LEVEL.hit = SB.hit / 100; LEVEL.shared = SB.shared === 1; LEVEL.heavy = 0;
    G.reset(true, true); G.credits = 99999; G.mode = 'paused';
    G.placed.stall = !!SB.stall; G.placed.fwdEX = !!SB.fwdEX; G.placed.fwdMEM = !!SB.fwdMEM;
    let id = 0; const q = [];
    for (let r = 0; r < SB.rep; r++) for (const sp of spec) {
      const i = { ...sp, id: ++id, px: -150, py: GEO.cy, corrupt: false };
      if (i.op === 'mul') i.lat = Math.max(1, 3 - u.mulu);
      if (i.op === 'div') i.lat = Math.max(1, 5 - 2 * u.mulu);
      if (i.op === 'beq' && i.taken === undefined) i.taken = [r % 4 !== 3, r % 6 === 5, Math.random() < 0.5][i.site];
      G.names[id] = i.text; q.push(i);
    }
    G.queue = q; $('overlay').hidden = true; syncRun();
    G.note(`Sandbox: ${q.length} crates loaded. Press Step or Start.`, 'radio');
    return '';
  }
  function openSandbox() {
    const sel = ([lab, k, opts]) => `<label>${lab}<select id="sb_${k}">${opts.map(([n, v]) => `<option value="${v}"${SB[k] === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
    showOverlay(`<div class="card sb"><h2>Sandbox</h2>
      <p>One instruction per line: add, sub, and, or, mul, div (rd, rs, rt), lw rd, off(rs), sw rt, off(rs), beq rs, rt @A, @B or @C, optionally followed by taken or nt. Text after # is ignored.</p>
      <textarea id="sbtext" spellcheck="false" aria-label="Program"></textarea><p id="sberr" class="err"></p>
      <div class="seg" role="group" aria-label="Examples">${SB_PRE.map((p, k) => `<button data-pre="${k}">${p[0]}</button>`).join('')}</div>
      <div class="sbgrid">${SB_SET.map(sel).join('')}</div>
      <p><input id="sbcode" type="text" placeholder="Share code" aria-label="Share code"> <button id="sbexp">Export</button> <button id="sbimp">Import</button></p>
      <button class="primary" id="sbrun">Load program</button> <button id="sbexit2">Exit sandbox</button></div>`);
    $('sbtext').value = SB.text;
    document.querySelectorAll('[data-pre]').forEach(b => b.onclick = () => { const p = SB_PRE[+b.dataset.pre]; $('sbtext').value = p[1]; $('sb_rep').value = p[2]; });
    $('sbrun').onclick = () => { readEditor(); const e = runSandbox(); if (e) $('sberr').textContent = e; };
    $('sbexit2').onclick = exitSandbox;
    $('sbexp').onclick = () => {
      readEditor(); const o = { t: SB.text }; SB_SET.forEach(([, k]) => { o[k] = SB[k]; });
      const code = 'PF1:' + btoa(unescape(encodeURIComponent(JSON.stringify(o)))); $('sbcode').value = code;
      try { navigator.clipboard.writeText(code).catch(() => {}); } catch (e) { /* copy by hand */ }
    };
    $('sbimp').onclick = () => {
      try {
        const o = JSON.parse(decodeURIComponent(escape(atob($('sbcode').value.trim().replace(/^PF1:/, '')))));
        if (typeof o.t === 'string') SB.text = o.t.slice(0, 4000);
        SB_SET.forEach(([, k, opts]) => { if (opts.some(p => p[1] === o[k])) SB[k] = o[k]; });
        openSandbox();
      } catch (e) { $('sberr').textContent = 'That share code is not valid.'; }
    };
  }
  const sbTag = () => [SB.stall ? 'stall unit' : 'no stall unit', SB.fwdEX && 'EX wire', SB.fwdMEM && 'MEM wire', ['no prediction', 'not taken', '2-bit'][SB.bp], SB.hit < 100 && `hit ${SB.hit}%`, SB.l2 && `L2 ${SB.l2}`,
    SB.mulu && `fast mul ${SB.mulu}`, SB.rob && `ROB ${SB.rob}`, SB.spec && 'speculation', SB.slot && 'delay slot', SB.deep && `deep ${SB.deep}`, SB.shared && 'shared port', SB.rep > 1 && `×${SB.rep}`].filter(Boolean).join(', ');
  function sbDone() {
    if (!G.sbRec) { G.sbRec = true; SB.runs.push({ n: SB.runs.length + 1, tag: sbTag(), ipc: G.ipc(), cyc: G.cycles }); }
    const runs = SB.runs.slice(-6), best = Math.max(...runs.map(r => r.ipc));
    const tbl = runs.map(r => `<tr><td>#${r.n}</td><td><div class="ibar"><i style="width:${Math.round(r.ipc * 100)}%"></i></div></td><td>${r.ipc.toFixed(2)}${r.ipc === best ? ' ★' : ''}</td><td>${r.cyc} cyc</td><td class="tg">${r.tag}</td></tr>`).join('');
    showOverlay(`<div class="card"><h2>Program finished</h2><p>${G.good} instructions in ${G.cycles} cycles.</p><h3>Compare runs</h3><div class="mf"><table>${tbl}</table></div>${summary(G, G.ipc())}
      <button class="primary" id="sbedit2">Edit program</button> <button id="sbagain">Run again</button> <button id="sbback2">Step back</button> <button id="rpl2">Watch replay</button> <button id="sbexit3">Exit sandbox</button></div>`);
    $('sbedit2').onclick = openSandbox; $('sbexit3').onclick = exitSandbox; $('sbback2').onclick = stepBack; $('rpl2').onclick = startReplay;
    $('sbagain').onclick = () => { const e = runSandbox(); if (e) openSandbox(); };
  }
  $('sbedit').onclick = () => { if (G.mode === 'running') { G.mode = 'paused'; syncRun(); } openSandbox(); };
  $('sbexit').onclick = exitSandbox;

  const SNAP_KEYS = ['stages', 'queue', 'rob', 'cycles', 'good', 'retired', 'stalls', 'forwards', 'corrupt', 'dropped', 'flushes', 'misses', 'structs', 'heavyN', 'exWaits', 'traps', 'memOps', 'ooo',
    'branches', 'branchNotes', 'bp', 'nextRetire', 'fetchSeq', 'freeze', 'streak', 'best', 'trace', 'score', 'credits', 'arrive', 'heat', 'health', 'laneB', 'rs', 'ev', 'throttles', 'shield', 'recent', 'nextId'];
  function stepBack() {
    if (!G.sb || !G.snaps.length) return;
    G.restore(G.snaps.pop()); G.sbOver = false; G.mode = 'paused'; $('overlay').hidden = true; syncRun();
  }

  // Options: music, colour-blind colours, bigger text (saved separately from the campaign)
  const OPT = { music: 0, cb: 0, big: 0 }, CB_EDGE = { raw: '#e69f00', war: '#cc79a7', waw: '#cc79a7', mem: '#f0e442', branch: '#56b4e9' };
  try { Object.assign(OPT, JSON.parse(localStorage.getItem('pipelineFactoryOpts') || '{}')); } catch (e) { /* defaults */ }
  const applyOpts = () => {
    document.documentElement.classList.toggle('cb', !!OPT.cb); document.body.classList.toggle('big', !!OPT.big);
    try { localStorage.setItem('pipelineFactoryOpts', JSON.stringify(OPT)); } catch (e) { /* ignore */ }
  };
  let mus = null;
  function setMusic(on) {
    if (mus) { clearInterval(mus.t); try { mus.n.stop(); mus.g.disconnect(); } catch (e) { /* already stopped */ } mus = null; }
    if (!on || muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const g = audio.createGain(); g.gain.value = 0.05; g.connect(audio.destination);
      const buf = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 2 - 1;     // cheap deterministic noise: factory hum
      const n = audio.createBufferSource(), f = audio.createBiquadFilter(), ng = audio.createGain();
      n.buffer = buf; n.loop = true; f.type = 'lowpass'; f.frequency.value = 220; ng.gain.value = 0.6; n.connect(f); f.connect(ng); ng.connect(g); n.start();
      const scale = [0, 3, 5, 7, 10, 12]; let step = 0;
      const t = setInterval(() => {
        if (muted) return;
        const o = audio.createOscillator(), og = audio.createGain(), now = audio.currentTime;
        o.type = 'triangle'; o.frequency.value = 110 * 2 ** ((scale[(step * 3 + (step >> 2)) % scale.length] + (step % 8 < 4 ? 0 : 5)) / 12);
        og.gain.setValueAtTime(0.0001, now); og.gain.exponentialRampToValueAtTime(0.4, now + 0.03); og.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        o.connect(og); og.connect(g); o.start(now); o.stop(now + 0.45); step++;
      }, 420);
      mus = { t, g, n };
    } catch (e) { /* audio unavailable */ }
  }
  const dlg = $('opts');
  $('opt').onclick = () => { $('o_music').checked = !!OPT.music; $('o_cb').checked = !!OPT.cb; $('o_big').checked = !!OPT.big; dlg.wasRunning = G.mode === 'running'; if (dlg.wasRunning) { G.mode = 'paused'; syncRun(); } dlg.showModal(); };
  dlg.addEventListener('close', () => { if (dlg.wasRunning && G.mode === 'paused') { G.mode = 'running'; syncRun(); } });
  $('o_close').onclick = () => dlg.close();
  [['o_music', 'music'], ['o_cb', 'cb'], ['o_big', 'big']].forEach(([id, k]) => { $(id).onchange = () => { OPT[k] = $(id).checked ? 1 : 0; applyOpts(); if (k === 'music') setMusic(OPT.music); }; });
  addEventListener('pointerdown', () => { if (OPT.music && !mus && !muted) setMusic(1); if (audio && audio.state === 'suspended') audio.resume(); }, { once: true });
  applyOpts();
  const STAT_TIPS = { score: 'Points from retired crates, with streak bonuses.', ipc: 'Instructions per cycle: correct crates retired divided by cycles. Higher is better. The goal is in brackets.',
    cpi: 'Cycles per instruction, the inverse of IPC. Iron law: time = instructions × CPI × cycle time.', time: 'Seconds left in the shift.', credits: 'Spend on parts: stall unit, wires and NOPs.',
    health: 'Line health. Corrupted results and dropped crates cost it.', qtext: 'Crates waiting on the belt. If it overflows, crates are dropped.', heat: 'Heat builds with speed and extra hardware. At 100 the line throttles.' };
  for (const [id, t] of Object.entries(STAT_TIPS)) { const el = $(id); if (el) el.closest('.stat').title = t; }

  // Compiler bay: the same statements compiled for four machine models. You are paid for statements, not instructions.
  const MODELS = [
    ['Register-register', 'lw, lw, add, sw: 4 instructions per statement and no memory operands. The loads are independent, so IPC is high. Baseline clock.'],
    ['Register-memory', 'load, add with a memory operand, store: 3 instructions, but the add needs an extra cycle in EX and decode is complex: the clock is 30 ms slower.'],
    ['Accumulator', 'load, add, store: 3 instructions that all go through one register, so crates wait for each other. Tiny state and simple decode: the clock is 60 ms faster.'],
    ['Stack', 'push, push, add, pop: 4 instructions that reuse the same top-of-stack registers, so crates cannot overlap. Simple decode: the clock is 40 ms faster.']];
  const BAY = { on: false, model: 0 };
  const BAYCFG = { line: 'Compiler bay', sub: 'Machine models', brief: 'Same statements, four ways to compile them.', nw: '', rate: 1.1, target: 0.5, secs: 70, qmax: 24, soft: true, dep: 0.35, mix: { beq: 0.06, lw: 0.12, sw: 0, mul: 0.1, div: 0 }, ev: false, hit: 1, models: true };
  const MODEL_TXT = (m, i) => {
    if (i.op === 'beq') return `beq r${i.rs}, r${i.rt} @${'ABC'[i.site]}`;
    if (m === 0) return i.op === 'lw' ? `lw r${i.rd}, ${i.v}` : i.op === 'sw' ? `sw r${i.rt}, ${i.v}` : `${i.op} r${i.rd}, r${i.rs}, r${i.rt}`;
    if (m === 1) return i.op === 'lw' ? `load r${i.rd}, ${i.v}` : i.op === 'sw' ? `store r${i.rt}, ${i.v}` : `${i.op} r${i.rd}, r${i.rs}, ${i.v}`;
    if (m === 2) return i.op === 'lw' ? `load ${i.v}` : i.op === 'sw' ? `store ${i.v}` : `${i.op} ${i.v}`;
    return i.op === 'lw' ? `push ${i.v}` : i.op === 'sw' ? `pop ${i.v}` : i.op;
  };
  function startBay(model) { BAY.on = true; BAY.model = model; applyShift(); LEVEL.surprise = false; G.reset(); beginShift(); }
  function endBay() { BAY.on = false; applyShift(); rollSurprise(); }
  function openBay(back) {
    const cards = MODELS.map((m, k) => `<div class="up"><div><strong>${m[0]}</strong><br><small>${m[1]}${META.bay[k] ? ` Best: ${Math.round(META.bay[k])} statements shipped.` : ''}</small></div><button data-model="${k}">Run</button></div>`).join('');
    showOverlay(`<div class="card"><h2>Compiler bay</h2><p>The same statements, compiled for four machine models. Your upgrades and parts apply. You are paid for statements shipped, not instructions.</p>${cards}<button id="bbk">Back</button></div>`);
    document.querySelectorAll('[data-model]').forEach(b => { b.onclick = () => startBay(+b.dataset.model); }); $('bbk').onclick = back;
  }
  function bayEnd(g, ipc, win) {
    const m = BAY.model, spc = g.cycles ? g.stmts / g.cycles * 100 : 0, pay = win ? 60 + Math.round(g.stmts / 2) : 15, ct = cycleMs();
    META.bay[m] = Math.max(META.bay[m] || 0, g.stmts); META.bank += pay; endBay(); save();
    const best = Math.max(1, ...MODELS.map((_, k) => META.bay[k] || 0));
    const rows = MODELS.map((mm, k) => `<tr><th>${mm[0]}</th><td><div class="ibar"><i style="width:${Math.round((META.bay[k] || 0) / best * 100)}%"></i></div></td><td>${Math.round(META.bay[k] || 0)}</td></tr>`).join('');
    showOverlay(`<div class="card"><h2>${win ? 'Compiler bay: target met' : 'Compiler bay: below target'}</h2><dl><dt>Model</dt><dd>${MODELS[m][0]}</dd><dt>Instructions per statement</dt><dd>${g.stmts ? (g.good / g.stmts).toFixed(1) : '–'}</dd>
      <dt>Instructions per cycle (IPC)</dt><dd>${g.ipc().toFixed(2)}</dd><dt>Cycle time</dt><dd>${ct} ms</dd><dt>Statements per 100 cycles</dt><dd>${spc.toFixed(1)}</dd><dt>Statements shipped</dt><dd>${g.stmts}</dd><dt>Bank</dt><dd>+${pay}</dd></dl>
      <p>IPC alone is misleading across machine models. Fewer instructions per statement or a faster clock can win even with a lower IPC. Time = instructions × CPI × cycle time.</p>
      <h3>Your best per model (statements shipped in one shift)</h3><div class="mf"><table>${rows}</table></div>
      <button class="primary" id="bagain">Try another model</button> <button id="bback3">Back to plant</button></div>`);
    const home = () => { G.reset(); startOverlay(); syncRun(); };
    $('bagain').onclick = () => openBay(home); $('bback3').onclick = home;
  }

  // Study mode: one exam-style question built from the run you just played
  const STUDY = { q: null, paid: false };
  function studyBox(g) {
    if (g.sb) return '';
    const cpi = g.good ? g.cycles / g.good : 1.5, ipc = g.ipc(), cp = ipc > 0 ? 1 / ipc : 2, mr = g.memOps ? g.misses / g.memOps : 0.15, pen = Math.max(1, 3 - META.up.l2), r2 = x => Math.round(x * 100) / 100;
    const f = [0.2, 0.3, 0.4, 0.5][Math.floor(Math.random() * 4)], sp = [2, 3, 4][Math.floor(Math.random() * 3)];
    const Q = [
      [`Your run had IPC ${ipc.toFixed(2)}. What was the CPI?`, r2(cp), r2(ipc), r2(cp + 1)],
      [`A part that takes ${Math.round(f * 100)}% of the run time becomes ${sp}× faster. What is the overall speedup (Amdahl)?`, r2(1 / (1 - f + f / sp)), r2(sp), r2(1 + f)],
      [`Hit time 1 cycle, miss rate ${Math.round(mr * 100)}%, miss penalty ${pen} cycles. What is the average memory access time?`, r2(1 + mr * pen), r2(mr * pen), r2(1 + pen)],
      [`${g.good} instructions at CPI ${cpi.toFixed(2)} take how many cycles?`, Math.round(g.good * cpi), Math.round(g.good / cpi), Math.round(g.good + cpi)]
    ];
    const q = Q[Math.floor(Math.random() * Q.length)];
    STUDY.q = [q[1], q[2], q[3]].map((v, i) => ({ v, ok: i === 0 })).sort(() => Math.random() - 0.5); STUDY.paid = false;
    return `<h3>Study question</h3><p>${q[0]}</p><div class="seg">${STUDY.q.map((o, i) => `<button data-ans="${i}">${o.v}</button>`).join('')}</div><p id="sqr" class="fine"></p>`;
  }
  $('overlay').addEventListener('click', e => {
    const b = e.target.closest('[data-ans]'); if (!b || !STUDY.q) return;
    const o = STUDY.q[+b.dataset.ans];
    $('sqr').textContent = o.ok ? (STUDY.paid ? 'Correct.' : 'Correct! +15 bank.') : `Not quite: the answer is ${STUDY.q.find(x => x.ok).v}.`;
    if (o.ok && !STUDY.paid) { STUDY.paid = true; META.bank += 15; save(); }
  });

  // Benchmark bonus (performance PDF): the arithmetic mean of ratios can say both machines are faster; the geometric mean cannot
  function openBench(back) {
    const r = () => 1 + Math.floor(Math.random() * 12), a = [r(), r()], b = [r(), r()], ra = [a[0] / b[0], a[1] / b[1]], gm = Math.sqrt(ra[0] * ra[1]);
    const am1 = (ra[0] + ra[1]) / 2, am2 = (1 / ra[0] + 1 / ra[1]) / 2, ok = gm > 1.0001 ? 0 : gm < 0.9999 ? 1 : 2;
    showOverlay(`<div class="card"><h2>Benchmark audit</h2><p>Throughput in tasks per second.</p>
      <div class="mf"><table><tr><th></th><th>Computer C1</th><th>Computer C2</th></tr><tr><th>Benchmark B1</th><td>${a[0]}</td><td>${b[0]}</td></tr><tr><th>Benchmark B2</th><td>${a[1]}</td><td>${b[1]}</td></tr></table></div>
      <p>Which computer is faster by the geometric mean of the C1/C2 ratios?</p><div class="seg"><button data-bn="0">C1</button><button data-bn="1">C2</button><button data-bn="2">Tie</button></div>
      <p id="bnr" class="fine"></p><button id="bback" class="primary">Back to shop</button></div>`);
    document.querySelectorAll('[data-bn]').forEach(x => { x.onclick = () => {
      const good = +x.dataset.bn === ok, pay = good && !extraDone.bench;
      $('bnr').textContent = `${good ? (pay ? 'Correct! +25 bank. ' : 'Correct. ') : 'Not quite. '}Geometric mean of C1/C2 = ${gm.toFixed(2)}. The arithmetic mean of C1/C2 is ${am1.toFixed(2)} and of C2/C1 is ${am2.toFixed(2)}: it can make each machine look faster than the other.`;
      if (pay) { extraDone.bench = true; META.bank += 25; save(); }
    }; });
    $('bback').onclick = back;
  }

  // Replay: scrub through the cycles of the shift you just finished
  const RP = { on: false, frames: [], i: 0, play: true, live: null, acc: 0 };
  function applyReplay() {
    G.restore(RP.frames[RP.i]); $('rs').value = RP.i; $('rl').textContent = `Cycle ${RP.i + 1} of ${RP.frames.length}`; $('rp').textContent = RP.play ? 'Pause' : 'Play';
  }
  function startReplay() {
    if (!G.snaps.length) return;
    RP.live = G.snap(); RP.frames = [...G.snaps, RP.live]; RP.i = 0; RP.play = true; RP.acc = 0; RP.on = true;
    $('overlay').hidden = true; G.mode = 'replay'; $('rs').max = RP.frames.length - 1; $('replay').hidden = false; applyReplay();
  }
  function closeReplay() { RP.on = false; G.restore(RP.live); G.mode = 'over'; $('replay').hidden = true; if (G.sb) sbDone(); else openShop(); }
  $('rp').onclick = () => { if (RP.i >= RP.frames.length - 1) RP.i = 0; RP.play = !RP.play; applyReplay(); };
  $('rs').oninput = () => { RP.i = +$('rs').value; RP.play = false; applyReplay(); };
  $('rx').onclick = closeReplay;

  // Inspector: click a crate on the line (with no tool selected) to see what it is waiting for
  function crateAt(x, y) {
    for (let s2 = 0; s2 < 5; s2++) { const i = G.stages[s2]; if (i && !i.nop && x >= sx(s2) + 5 && x <= sx(s2) + 5 + GEO.cw && y >= GEO.cy && y <= GEO.cy + GEO.ch) return [i, STAGES[s2][0]]; }
    for (let k = 0; k < Math.min(2, G.queue.length); k++) { const i = G.queue[k]; if (x >= qx(k) && x <= qx(k) + GEO.cw && y >= GEO.cy && y <= GEO.cy + GEO.ch) return [i, 'queue']; }
    return null;
  }
  function explain(i, where) {
    const L = [`<b>${i.text}</b>`, where === 'queue' ? 'Waiting on the belt.' : `In ${where}.`];
    L.push(`Reads ${[i.rs, i.rt].filter(Boolean).map(r => 'r' + r).join(', ') || 'nothing'}${i.rd ? `, writes r${i.rd}` : ''}.`);
    if (i.lat > 1) L.push(`Multi-cycle: ${i.lat} cycles in EX.`);
    if (i.op === 'beq') L.push(`Branch site ${'ABC'[i.site || 0]}: ${i.taken ? 'will be taken' : 'will not be taken'}.`);
    if (where === 'ID') for (const h of analyze(G.stages, G.placed).list) {
      L.push(h.ok ? `r${h.reg} comes from ${h.prod.text}: forwarded, no wait.` : h.loadUse ? `r${h.reg} comes from a load still in EX: load-use stall.`
        : `r${h.reg} comes from ${h.prod.text} (distance ${h.d}): ${G.placed.stall || i.known ? 'the stall unit holds this crate.' : 'no stall unit, so it reads stale data!'}`);
    }
    if (i.corrupt) L.push('This crate read stale data.');
    if (G.rob.includes(i)) L.push('Finished: waiting in the reorder buffer for older crates to retire.');
    return L.join('<br>');
  }
  let tipTimer = 0;
  function showTip(e) {
    const tip = $('tip'), r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) * GEO.W / r.width, y = (e.clientY - r.top) * GEO.H / r.height, hit = crateAt(x, y);
    clearTimeout(tipTimer); if (!hit) { tip.hidden = true; return; }
    const w = tip.parentElement.getBoundingClientRect();
    tip.innerHTML = explain(...hit); tip.hidden = false;
    tip.style.left = Math.max(4, Math.min(w.width - 270, e.clientX - w.left + 10)) + 'px'; tip.style.top = Math.min(w.height - 90, e.clientY - w.top + 10) + 'px';
    tipTimer = setTimeout(() => { tip.hidden = true; }, 7000);
  }

  // Daily challenge: same loadout, same shipment for everyone on a given date
  const DAILY = { on: false, key: '', saved: null, rand: null };
  const hash = str => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const prng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const dailyKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function dailySetup(key) {
    const r = prng(hash(key)), pool = UPS.filter(u => !['lab', 'buf', 'disc', 'hp'].includes(u.id)), up = {};
    for (const k in META.up) up[k] = 0;
    for (let k = 0; k < 6; k++) { const u = pool[Math.floor(r() * pool.length)]; up[u.id] = Math.max(up[u.id], 1 + Math.floor(r() * u.max)); }
    return { up, n: 4 + Math.floor(r() * (SHIFTS.length - 4)) };
  }
  function openDaily(back) {
    const key = dailyKey(), d = dailySetup(key), best = META.daily[key];
    const load = Object.entries(d.up).filter(([, v]) => v).map(([id, v]) => `${UPS.find(u => u.id === id).name} ${v}`).join(', ');
    showOverlay(`<div class="card"><h2>Daily challenge</h2><p>${key}: ${shiftCfg(d.n).sub}. Everyone gets the same shipment and the same loadout today: ${load}.</p>
      <p>${best ? `Your best today: <b>${best}</b>.` : 'No attempt yet today.'}</p><button class="primary" id="dgo">Start</button> <button id="dback">Back</button></div>`);
    $('dgo').onclick = () => startDaily(key, d); $('dback').onclick = back;
  }
  function startDaily(key, d) {
    DAILY.on = true; DAILY.key = key; SBON = true;
    DAILY.saved = { up: META.up, placed: META.placed, n: META.n, bpMode: META.bpMode, diff: META.diff };
    META.up = { ...d.up }; META.placed = { fwdEX: false, fwdMEM: false, stall: false }; META.n = d.n; META.bpMode = d.up.pred; META.diff = 1;
    DAILY.rand = Math.random; Math.random = prng(hash(key));
    applyShift(); LEVEL.surprise = false; G.reset(); beginShift();
  }
  function endDaily() { Math.random = DAILY.rand; Object.assign(META, DAILY.saved); DAILY.on = false; SBON = false; applyShift(); rollSurprise(); }
  function dailyEnd(g, ipc, win) {
    const sc = Math.max(0, g.score + Math.round(ipc * 100)) + (win ? 100 : 0), key = DAILY.key, nb = Math.max(META.daily[key] || 0, sc);
    endDaily(); META.daily[key] = nb; save();
    showOverlay(`<div class="card"><h2>${win ? 'Daily challenge complete' : 'Daily challenge failed'}</h2><dl><dt>Score</dt><dd>${sc}</dd><dt>Best today</dt><dd>${nb}</dd><dt>IPC</dt><dd>${ipc.toFixed(2)}</dd></dl>${diagram(g)}
      <button class="primary" id="dagain">Try again</button> <button id="dback2">Back to plant</button></div>`);
    $('dagain').onclick = () => openDaily(() => { G.reset(); startOverlay(); syncRun(); }); $('dback2').onclick = () => { G.reset(); startOverlay(); syncRun(); };
  }

  // Save slots, with export and import of a slot as text
  function openSlots(back) {
    const row = n => {
      let t = 'Empty'; try { const v = JSON.parse(localStorage.getItem(slotKey(n)) || 'null'); if (v) t = `Shift ${(v.n | 0) + 1}, bank ${v.bank | 0}, fired ${v.fired | 0}`; } catch (e) { /* unreadable */ }
      return `<div class="up"><div><strong>Slot ${n}${n === slotNo ? ' (current)' : ''}</strong><br><small>${t}</small></div><button data-slot="${n}" ${n === slotNo ? 'disabled' : ''}>Use</button></div>`;
    };
    showOverlay(`<div class="card"><h2>Save slots</h2><p>Switching slots reloads the game.</p>${[1, 2, 3].map(row).join('')}
      <p><input id="slcode" type="text" placeholder="Save code" aria-label="Save code"> <button id="slexp">Export</button> <button id="slimp">Import</button></p><p id="slerr" class="err"></p><button class="primary" id="slback">Back</button></div>`);
    document.querySelectorAll('[data-slot]').forEach(b => { b.onclick = () => { try { localStorage.setItem('pipelineFactorySlot', b.dataset.slot); } catch (e) { /* ignore */ } location.reload(); }; });
    $('slexp').onclick = () => { $('slcode').value = 'PFS:' + btoa(unescape(encodeURIComponent(localStorage.getItem(SAVE) || '{}'))); };
    $('slimp').onclick = () => {
      try { const j = decodeURIComponent(escape(atob($('slcode').value.trim().replace(/^PFS:/, '')))); JSON.parse(j); localStorage.setItem(SAVE, j); location.reload(); }
      catch (e) { $('slerr').textContent = 'That save code is not valid.'; }
    };
    $('slback').onclick = back;
  }

  function rollSurprise() { LEVEL.surprise = META.n >= 6 && Math.random() < 0.3; }
  function beginShift() {
    $('overlay').hidden = true;
    const mx = LEVEL.mix, pc = v => Math.round((v || 0) * 100);
    if (LEVEL.surprise) {
      LEVEL.events = true; G.mode = 'running'; G.note('Surprise shift! No prep time.', 'bad'); beep(250, 0.3, 'sawtooth', 0.06);
    } else {
      if (LEVEL.reorder) {
      G.manifest = []; const savedRegs = LEVEL.regs; LEVEL.regs = Math.max(LEVEL.regs, 9);
      const man = []; for (let k = 0; k < 24; k++) man.push(G.spawn());
      G.manifest = man; LEVEL.regs = savedRegs; G.insp = newInsp([...G.queue, ...man]);
      G.mode = 'prep'; G.prepLeft = 60; G.view = 'crates';
      } else { G.insp = null; G.mode = 'prep'; G.prepLeft = 20; G.view = 'line'; }
      G.note(`Forecast: ${pc(mx.lw)}% loads, ${pc(mx.sw)}% stores, ${pc(mx.beq)}% branches, ${pc((mx.mul || 0) + (mx.div || 0))}% multiply and divide. Read the shipment manifest, then build.`, 'radio');
    }
    syncRun();
  }
  function showOverlay(html) { $('overlay').innerHTML = html; $('overlay').hidden = false; }
  function startTraining() {
    $('overlay').hidden = true;
    TUTSAVE.up = META.up; TUTSAVE.bp = META.bpMode; SBON = true;
    META.up = Object.fromEntries(Object.keys(META.up).map(k => [k, 0])); META.bpMode = 1;
    G.reset(true); G.insp = newInsp([...G.queue]); G.view = 'crates'; G.prepLeft = 60; G.mode = 'prep'; ti = 0; coachShow(); syncRun();
  }
  function startOverlay() {
    const beat = STORY[META.n];
    if (beat && !META.story[META.n] && !G.tut && !LEVEL.surprise) { META.story[META.n] = true; save(); playScene({ happy: true, lines: beat, noStamp: true, after: () => startOverlay() }); return; }
    const c = shiftCfg(META.n), first = META.n === 0, sur = LEVEL.surprise;
    showOverlay(`<div class="card"><h2>${sur ? 'Surprise shift!' : `Shift ${META.n + 1}: ${c.sub}`}</h2><p>${sur ? 'An unscheduled rush job just landed. No prep time: the belt starts the moment you go.' : c.brief}</p>
      ${c.nw ? `<p class="new"><b>New:</b> ${c.nw}</p>` : ''}<p>Rank: ${RANKS[Math.min(META.n, RANKS.length - 1)]}. ${c.line}. Work arrives at ${LEVEL.rate.toFixed(2)} per cycle. Hold IPC above ${LEVEL.targetIPC.toFixed(2)} for ${LEVEL.shift} seconds.${c.ev ? ' Expect surprises.' : ''}</p>
      ${first ? '<p>New here? Training walks you through hazards, stalls and forwarding.</p>' : META.n < 4 ? '' : `<p>Client order:</p><div class="seg">${ORDERS.map((o, k) => `<button data-ord="${k}" aria-pressed="${k === ORDER}">${o.n}</button>`).join('')}</div><p><small>${ORDERS[ORDER].d}</small></p>`}
      ${c.mix.beq > 0 && META.up.pred > 0 ? `<p>Branch unit:</p><div class="seg">${['No prediction', 'Always not taken', '2-bit predictor'].slice(0, META.up.pred + 1).map((n, k) => `<button data-bp="${k}" aria-pressed="${k === Math.min(META.bpMode, META.up.pred)}">${n}</button>`).join('')}</div>` : ''}
      <div class="seg" role="group" aria-label="Difficulty">${['Relaxed', 'Normal', 'Hard'].map((n, k) => `<button data-diff="${k}" aria-pressed="${k === META.diff}">${n}</button>`).join('')}</div>
      <p></p><button class="primary" id="go">Start shift</button> <button id="car">Career</button> <button id="sbx">Sandbox</button> <button id="dly">Daily</button> <button id="slt">Slots</button> ${META.n >= 5 ? '<button id="bay">Compiler bay</button> ' : ''}${first ? '<button id="tr">Start training</button>' : '<button id="shop">Upgrade shop</button>'}</div>`);
    $('go').onclick = beginShift;
    document.querySelectorAll('[data-ord]').forEach(b => b.onclick = () => { ORDER = +b.dataset.ord; applyShift(); G.reset(); startOverlay(); });
    if (first) $('tr').onclick = startTraining;
    else $('shop').onclick = openShop;
    $('car').onclick = () => openStats(startOverlay); $('sbx').onclick = enterSandbox; $('dly').onclick = () => openDaily(startOverlay); $('slt').onclick = () => openSlots(startOverlay); if ($('bay')) $('bay').onclick = () => openBay(startOverlay);
    document.querySelectorAll('[data-bp]').forEach(b => b.onclick = () => { META.bpMode = +b.dataset.bp; save(); startOverlay(); });
    document.querySelectorAll('[data-diff]').forEach(b => b.onclick = () => { META.diff = +b.dataset.diff; save(); applyShift(); G.reset(); startOverlay(); });
  }
  function syncRun() { $('run').textContent = G.mode === 'running' ? 'Pause' : G.mode === 'paused' ? 'Resume' : G.mode === 'prep' ? 'Skip prep' : 'Start shift'; }

  $('run').onclick = () => {
    if (G.mode === 'over' || G.mode === 'replay') return;
    if (G.mode === 'prep') { endPrep(); return; }
    if (G.tut && !G.sb) return;
    if (G.mode === 'ready') return beginShift();
    if (G.mode === 'ready') $('overlay').hidden = true;
    G.mode = G.mode === 'running' ? 'paused' : 'running'; syncRun();
  };
  $('step').onclick = () => {
    if (G.mode === 'over' || G.mode === 'replay') return;
    if (G.mode === 'prep') return;
    const ts = G.tut && TUT[ti];
    if (ts && ts.gate && !ts.cond(G)) return G.note('Build the highlighted part first.', 'info');
    if (G.mode === 'ready') $('overlay').hidden = true;
    if (G.mode !== 'running') { G.mode = 'paused'; G.tick(); syncRun(); }
  };
  $('reset').onclick = () => { restoreTut(); if (DAILY.on) endDaily(); if (BAY.on) endBay(); ti = -1; $('coach').hidden = true; clearNudge(); G.reset(); startOverlay(); syncRun(); };
  const coachNext = () => { if (TUT[ti].last) endTut(); else { ti++; coachShow(); } };
  $('coach-next').onclick = coachNext;
  $('coach-skip').onclick = endTut;
  $('mute').onclick = () => { muted = !muted; setMusic(OPT.music && !muted); $('mute').textContent = muted ? 'Sound off' : 'Sound on'; $('mute').setAttribute('aria-pressed', String(muted)); };
  document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => {
    G.speed = +b.dataset.speed;
    document.querySelectorAll('[data-speed]').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
  });

  // Tools: click to select, then click a slot; or drag onto the floor.
  function selectTool(t) {
    tool = tool === t ? null : t;
    document.querySelectorAll('.tool').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
    canvas.classList.toggle('armed', !!tool);
  }
  document.querySelectorAll('.tool').forEach(b => {
    b.onclick = () => selectTool(b.dataset.tool);
    b.ondragstart = e => { e.dataTransfer.setData('text/plain', b.dataset.tool); e.dataTransfer.effectAllowed = 'copy'; };
  });
  const pos = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * GEO.W / r.width, (e.clientY - r.top) * GEO.H / r.height]; };
  canvas.addEventListener('pointermove', e => { const s = slotAt(...pos(e)); hover = s ? s.id : null; });
  canvas.addEventListener('pointerleave', () => { hover = null; });
  canvas.addEventListener('click', e => { if (tool) use(tool, ...pos(e)); else showTip(e); });
  canvas.addEventListener('dragover', e => { e.preventDefault(); const s = slotAt(...pos(e)); hover = s ? s.id : null; });
  canvas.addEventListener('drop', e => { e.preventDefault(); const t = e.dataTransfer.getData('text/plain'); if (t) use(t, ...pos(e)); hover = null; });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && tool) selectTool(tool);
    if ((e.target.closest && e.target.closest('button, textarea, select, input')) || document.querySelector('.cine')) return;
    if (e.code === 'Space') { e.preventDefault(); $('run').click(); }
    else if (e.key === 's' || e.key === 'S') $('step').click();
    else if ((e.key === 'b' || e.key === 'B') && G.sb) stepBack();
    else if ((e.key === 'z' || e.key === 'Z') && G.mode === 'prep') undoMove();
    else if ((e.key === 'v' || e.key === 'V') && G.mode === 'prep' && G.insp) G.view = G.view === 'crates' ? 'line' : 'crates';
  });

  /* ---------- Main loop ---------- */
  applyShift(); rollSurprise();
  const G = new Game();
  startOverlay();
  const sc = document.querySelector('.scroller');
  let lastTouch = 0;
  sc.addEventListener('pointerdown', () => { lastTouch = performance.now(); });
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(100, now - last); last = now;
    if (G.mode === 'replay' && RP.play) {
      RP.acc += dt * G.speed;
      while (RP.acc >= 350 && RP.i < RP.frames.length - 1) { RP.acc -= 350; RP.i++; applyReplay(); }
      if (RP.i >= RP.frames.length - 1) { RP.play = false; $('rp').textContent = 'Play'; }
    }
    if (G.mode === 'prep') { if (!G.tut) G.prepLeft -= dt / 1000; if (G.prepLeft <= 0) endPrep(); }
    if (G.mode === 'running') {
      if (!G.sb) G.timeLeft -= dt / 1000 * G.speed; G.acc += dt * G.speed;
      while (G.acc >= cycleMs() && G.mode === 'running') { G.acc -= cycleMs(); G.tick(); }
      if (G.timeLeft <= 0 && !G.sb) G.finish('time');
    }
    draw(now, dt); hud(); tutTick();
    fitFloor(); if (G.mode === 'prep' && G.view === 'crates') drawRack(now, dt);
    if (G.mode === 'running' && !REDUCED && sc.scrollWidth > sc.clientWidth + 4 && now - lastTouch > 4000) {
      const target = 560 * canvas.clientWidth / GEO.W - sc.clientWidth / 2;
      sc.scrollLeft += (target - sc.scrollLeft) * 0.05;
    }
    requestAnimationFrame(frame);
  }
  window.__pf = { get G() { return G; }, META, LEVEL, SHIFTS, UPS, SB, SB_SET, SB_PRE, applyShift, beginShift, endPrep, doMove, runSandbox, enterSandbox, exitSandbox, stepBack, startDaily, dailySetup, dailyKey, cycleMs, BAY, BAYCFG, startBay, MODELS, startTraining, TUT, tutTick, coachNext, undoMove, getTi: () => ti };
  requestAnimationFrame(frame);
})();
