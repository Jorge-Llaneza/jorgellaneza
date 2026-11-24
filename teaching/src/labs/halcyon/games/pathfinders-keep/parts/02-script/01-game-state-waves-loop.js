/* ---------- Game: state, waves, loop ---------- */
class Game {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.graph = new Graph(); this.algo = 'dijkstra'; this.tool = 'reducer';
    this.paid = {}; this.enemies = []; this.recalcs = 0;
    this.gold = 200; this.lives = 10; this.wave = 0; this.speed = 1;
    this.phase = 'build'; this.toSpawn = 0; this.spawnT = 0; this.hover = null; this.probe = null; this.hp = 0;
    this.route = null; this.routeVer = -1; this.fx = []; this.cool = {}; this.aim = {}; this.abil = { extract: 0, rebal: 0, flush: 0, spike: 0 }; this.haste = 0; this.armed = null; this.spikes = []; this.puzzle = null; this.fixed = new Set(); this.rotations = 0; this.sketch = []; this.sketching = false; this.pen = '#7fd4ff'; this.eraser = false; this.cur = null; this.compareUntil = 0; this.sketchBonusWave = -1; this.born = {}; this.kind = 'bst'; this.bt = null; this.insOrder = []; btSplits = 0; this.sandbox = false; this.sbQueue = []; this.sbT = 0; this.manual = false; this.cables = []; this.linkFrom = null; this._pw = new Set(); this.tree = null; this.avl = false; this.sel = null; this.vt = {}; this.inc = 1; this.spdMul = 1; this.disc = 0; this.dmgMul = 1; this.bonusSlots = 0; this.capped = false; this.kills = 0; this.mut = 'none'; this.mode = {}; this.evts = []; this.hpMul = 1; this.seed = 0; this.maxLives = 10; this.thp = {}; this.evt = null; this.glitched = new Set(); this.curse = false; this.hl = null; this.blind = false; this.qRight = 0; this.qTotal = 0; this.streak = 0;
    this.shake = 0; this.leaks = 0; this.queue = []; this.banner = null; this.lens = false; this.lensStart = null;
  }
  say(text, bad = false) { if (bad) sfx('err'); ui.msg.textContent = text; ui.msg.classList.toggle('bad', bad); }
  startWave() {
    if (this.phase !== 'build') return;
    this.wave++; this.queue = waveList(this.wave); this.toSpawn = this.queue.length; new Set(this.queue).forEach(t => { if (this.onEvent) this.onEvent('seen:' + t); }); this.hp = Math.round((HP_BASE + this.wave * HP_GROW) * (this.curse ? 1.4 : 1) * this.hpMul); if (this.curse) toast('Corrupted wave: packets have +40% HP.'); this.curse = false; this.hl = null; this.spawnT = 0; this.phase = 'wave'; this.banner = { text: `Wave ${this.wave}`, life: 2 }; sfx('horn');
    this.applyEvent(); if (this.hide()) this.banner.text += ' (fog)'; if (bossesFor(this.wave).length) this.banner.text += ' (boss)'; if (this.evt) this.banner.text += `: ${EVENT_INFO[this.evt.type][0]}`;
    this.say(`Wave ${this.wave}: ${this.toSpawn} packets incoming. You can keep editing weights.`);
  }
  onEnter(e, n) {
    const g = this.graph, tool = g.mod[n], i = g.tier[n] - 1, cx = (n % COLS + .5) * CELL, cy = ((n / COLS | 0) + .5) * CELL;
    if (tool === 'toll') { this.gold += STATS.toll.gold[i]; this.pop(cx, cy - 22, '+' + STATS.toll.gold[i], '#ecc66b'); }
    if (tool === 'trap') { this.burst(cx, cy, '#ff7a90'); this.hurt(e, STATS.trap.dmg[i]); }
    if (tool === 'mine') {
      const S = STATS.mine; this.fx.push({ x: cx, y: cy, ring: true, rad: S.range[i] * CELL, life: .5, max: .5, color: '#ffb347' }); this.burst(cx, cy, '#ffb347');
      for (const o of this.enemies) if (Math.hypot(o.pos.x - cx, o.pos.y - cy) <= S.range[i] * CELL) this.hurt(o, S.dmg[i]);
      this.shake = 7; sfx('boom'); delete this.paid[n]; g.setTool(n, null);
    }
    if (e.type === 'glitch' && n !== START && n !== EXIT && !this.glitched.has(n) && !g.locked.has(n)) {
      this.glitched.add(n); g.base[n] += 2; g.retune(n); this.fx.push({ x: cx, y: cy, ring: true, rad: 40, life: .5, max: .5, color: '#7dffb5' });
    }
    if (!e.dead && n === EXIT && !e.todo.length) { e.leaked = true; this.lives--; this.leaks++; this.shake = 12; sfx('leak'); this.pop(cx, cy - 36, '-1', '#e8506a'); }
  }
  hurt(e, d) {
    if (e.dead) return; if (e.type === 'tank' && d >= 3) d -= 1;
    const tn0 = e.t < .5 ? e.n : e.next, tw0 = tn0 == null ? 1 : this.graph.weight(tn0); if (tw0 >= 3 && tw0 < Infinity) d = Math.round(d * 1.25);      // mired packets cannot dodge: +25% damage d = Math.max(1, Math.round(d * this.dmgMul));
    e.hp -= d; e.flash = .12; sfx('hit');
    if (e.type === 'cartographer' && e.hp > 0) {                    // the boss rewrites the map as it weakens
      const f = e.hp / e.maxHp;
      if (f < .66 && !e.ph1) { e.ph1 = 1; this.applyEvent('mudslide'); this.banner = { text: 'Boss rewrites the map', life: 1.8 }; }
      if (f < .33 && !e.ph2) { e.ph2 = 1; this.applyEvent('rockfall'); this.banner = { text: 'Boss rewrites the map', life: 1.8 }; }
    }
    const p = e.pos; this.pop(p.x, p.y - 28, '-' + d, '#ff7a90');
    if (e.hp <= 0) {
      e.dead = true; this.kills++; this.deposit(e); const gd = Math.round(TYPES[e.type].gold * ((e.gen || 0) ? .3 : 1) * this.inc); this.gold += gd; this.burst(p.x, p.y, '#ecc66b'); this.pop(p.x, p.y - 44, '+' + gd, '#ecc66b'); sfx('kill');
      const tn = e.t < .5 ? e.n : e.next, tw = tn == null ? 1 : this.graph.weight(tn), mire = (e.gen || 0) || !Number.isFinite(tw) ? 0 : Math.round(Math.max(0, tw - 1) * this.inc);   // packets that die stuck in mud drop extra
      if (mire) { this.gold += mire; this.pop(p.x + 16, p.y - 62, `+${mire} mire`, '#9be37a'); } if (e.type === 'hydra' && (e.gen || 0) < 2) this.splitHydra(e);
      if (this.onEvent) this.onEvent(isBoss(e.type) && !e.gen ? 'boss' : 'kill');
    }
  }
  defend(dt) {
    const g = this.graph; for (const e of this.enemies) e.slowMul = 1;
    for (let n = 0; n < g.size; n++) {
      const k = g.mod[n], S = STATS[k]; if (!S) continue;
      const i = g.tier[n] - 1, cx = (n % COLS + .5) * CELL, cy = ((n / COLS | 0) + .5) * CELL;
      const inR = r => this.enemies.filter(e => !e.dead && Math.hypot(e.pos.x - cx, e.pos.y - cy) <= r * CELL);
      if (SOLID.has(k) && !g.locked.has(n) && !g.temp.has(n)) {            // packets beside a solid tool attack it
        let dmg = 0; for (const e of this.enemies) if (!e.dead && Math.hypot(e.pos.x - cx, e.pos.y - cy) <= CELL * 1.15) dmg += (ATK[e.type] || 2) * dt;
        if (dmg > 0) {
          this.thp[n] = (this.thp[n] ?? (TOWER_HP[k][g.tier[n] - 1] * HPMUL)) - dmg;
          if (this.thp[n] <= 0) { this.burst(cx, cy, '#a79fc4'); this.shake = 6; sfx('boom'); toast(`${TOOLS[k].label} was destroyed.`); delete this.paid[n]; delete this.thp[n]; this.dropDefender(n); g.setTool(n, null); continue; }
        }
      }
      if (k === 'freezer') {
        for (const e of inR(S.range[i])) if (e.type !== 'golem') e.slowMul = Math.min(e.slowMul, 1 - Math.min(.9, S.slow[i] * this.eff(n) * this.pow(n)));
        if ((this.cool[n] = (this.cool[n] || 0) - dt) <= 0) { this.cool[n] = 1; this.fx.push({ x: cx, y: cy, ring: true, rad: S.range[i] * CELL, life: .6, max: .6, color: '#7fd4ff' }); }
      } else if (k === 'vault') {
        if ((this.cool[n] = (this.cool[n] || S.rate[i]) - dt) <= 0) { this.cool[n] = S.rate[i] / (this.eff(n) * this.pow(n)); this.gold += S.gold[i]; sfx('coin'); this.pop(cx, cy - 26, '+' + S.gold[i], '#ecc66b'); }
      } else if (k === 'cannon' || (k === 'barrier' && i > 0)) {
        if ((this.cool[n] = (this.cool[n] || 0) - dt) > 0) continue;
        const md = this.mode[n] || 'weak', ex = (EXIT % COLS + .5) * CELL, ey = ((EXIT / COLS | 0) + .5) * CELL;
        const t = inR(S.range[i]).sort((a, b) => md === 'strong' ? b.hp - a.hp : md === 'first' ? Math.hypot(a.pos.x - ex, a.pos.y - ey) - Math.hypot(b.pos.x - ex, b.pos.y - ey) : a.hp - b.hp)[0];
        if (!t) { this.cool[n] = 0; this.aim[n] = (this.aim[n] || 0) + dt * .8; continue; }
        this.cool[n] = S.rate[i] / (this.eff(n) * this.pow(n)); this.aim[n] = Math.atan2(t.pos.y - cy, t.pos.x - cx);
        this.fx.push({ x: cx, y: cy, x2: t.pos.x, y2: t.pos.y, beam: true, life: .12, color: k === 'cannon' ? '#46d6c4' : '#ff7a90' });
        sfx('pew'); this.fx.push({ x: cx + Math.cos(this.aim[n]) * 30, y: cy + Math.sin(this.aim[n]) * 30, r: 9, life: .08, color: '#fff6c0' }); this.hurt(t, S.dmg[i]);
      }
    }
  }
  siegeTarget(n) { const g = this.graph; return g.nbrs(n).some(m => (g.mod[m] === 'cannon' || g.mod[m] === 'freezer' || g.mod[m] === 'vault') && !g.locked.has(m)); }
  breakerPath(from) {
    const g = this.graph, prev = new Map([[from, null]]), q = [from];
    for (let i = 0; i < q.length; i++) { const u = q[i];
      if (this.siegeTarget(u)) { const path = []; for (let n = u; n !== null; n = prev.get(n)) path.push(n); return { path: path.reverse() }; }
      for (const v of g.adj.get(u).keys()) if (!prev.has(v)) { prev.set(v, u); q.push(v); } }
    return null;
  }
  threat(n) {
    const g = this.graph, x = n % COLS, y = n / COLS | 0; let t = 0;
    for (let m = 0; m < g.size; m++) { const k = g.mod[m];
      if ((k === 'trap' || k === 'mine') && m === n) t += 6;
      else if ((k === 'cannon' || k === 'freezer') && Math.hypot(m % COLS - x, (m / COLS | 0) - y) <= STATS[k].range[g.tier[m] - 1]) t += k === 'cannon' ? 4 : 2; }
    return t;
  }
  hide() { const w = this.phase === 'build' ? this.wave + 1 : this.wave; return (this.sandbox ? this.blind : FOG_WAVES.includes(cyc(w)) || this.blind) && this.phase !== 'won' && this.phase !== 'lost'; }
  spawnNow(type, count) {
    for (let i = 0; i < count; i++) this.sbQueue.push(type);
    if (this.phase === 'build') { this.phase = 'wave'; this.manual = true; }
    this.say(`Spawning ${count} ${TYPES[type].name}${count > 1 ? 's' : ''}.`);
  }
  clearPackets() { this.enemies = []; this.sbQueue = []; this.toSpawn = 0; if (this.phase === 'wave') this.manual = true; }
  clearTools() {
    const g = this.graph; for (let n = 0; n < g.size; n++) if (g.mod[n] && !g.locked.has(n) && !g.temp.has(n)) { this.dropDefender(n); g.setTool(n, null); }
    this.paid = {}; this.thp = {}; this.cables = []; this.tree = null; this.bt = null; this.insOrder = []; this.vt = {}; this.mode = {}; this.sel = null; this.linkFrom = null; this.say('All tools cleared.');
  }
  sandboxEdit(tool, n) {
    if (!this.sandbox) return this.say('That tool only works in Sandbox mode.', true);
    const g = this.graph; if (n === START || n === EXIT || CHECKS.includes(n)) return this.say('Start, keep and checkpoints stay as they are.', true);
    if (this.phase === 'wave') return this.say('Edit the map between waves.', true);
    if (tool === 'paint') { if (g.locked.has(n) || SOLID.has(g.mod[n])) return this.say('Pick an open tile.', true); g.base[n] = g.base[n] % 9 + 1; g.retune(n); sfx('place'); learn('weight'); return this.say(`Tile cost is now ${g.base[n]}.`); }
    if (g.locked.has(n)) { g.locked.delete(n); g.setTool(n, null); sfx('place'); return this.say('Wall removed.'); }
    if (g.mod[n]) return this.say('Clear that tile first.', true);
    if (this.enemies.some(e => e.n === n || e.next === n)) return this.say('A packet is on that tile.', true);
    g.setTool(n, 'barrier'); g.locked.add(n); if (!this.reachable()) { g.locked.delete(n); g.setTool(n, null); return this.say('Refused: that wall would cut the route.', true); }
    sfx('place'); this.say('Stone wall placed.');
  }
  useAbility(k) {
    if (this.puzzle) return this.say('Abilities are off in puzzles.', true);
    const A = ABIL[k]; if (this.abil[k] > 0) return this.say(`${A.name} is recharging (${Math.ceil(this.abil[k])}s).`, true);
    if (k === 'spike') { this.armed = this.armed === 'spike' ? null : 'spike'; return this.say(this.armed ? 'Tap a tile to drop the weight spike. Press B again or Esc to cancel.' : 'Cancelled.'); }
    if (k === 'extract') {
      const live = this.enemies.filter(e => !e.dead); if (!live.length) return this.say('No packets in the heap.', true);
      const w = live.reduce((a, b) => b.hp < a.hp ? b : a); w.hp = .001; this.hurt(w, 1); learn('heap'); this.say('Extract-min removed the root of the heap: the weakest packet.');
    }
    if (k === 'rebal') {
      if (!this.defenders().length) return this.say('You need defenders first.', true);
      if (this.kind !== 'btree' && this.tree) this.tree = build(inord(this.tree)); this.haste = 6; learn('avl'); this.say('Rebalanced. Defenders fire 25% faster for 6 seconds.');
    }
    if (k === 'flush') { if (!Object.keys(this.vt).length) return this.say('Build a Cache Vault first.', true); this.flushCache(); learn('hash'); }
    this.abil[k] = A.cd; sfx('up');
  }
  fireSpike(n) {
    const g = this.graph, nodes = []; for (let m = 0; m < g.size; m++) { const d = Math.abs(m % COLS - n % COLS) + Math.abs((m / COLS | 0) - (n / COLS | 0));
      if (d <= 2 && !SOLID.has(g.mod[m]) && !g.locked.has(m) && !g.temp.has(m) && m !== START && m !== EXIT && !CHECKS.includes(m)) nodes.push(m); }
    nodes.forEach(m => { g.base[m] += 3; g.retune(m); }); this.spikes.push({ nodes, t: 8 }); this.abil.spike = ABIL.spike.cd; this.armed = null; sfx('boom'); learn('trade');
    this.say(`Weight spike: ${nodes.length} nodes cost +3 for 8 seconds.`);
  }
  flushCache() { let t = 0; for (const v of Object.values(this.vt)) { t += v.s.filter(x => x !== null).length * 3; v.s.fill(null); } t = Math.round(t * this.inc); if (t) this.gold += t; this.say(t ? `Cache flushed: +${t} cycles.` : 'The caches were empty.'); }
  beginStroke(x, y) { if (this.eraser) return this.eraseAt(x, y); this.cur = { color: this.pen, pts: [[x, y]] }; this.sketch.push(this.cur); }
  extendStroke(x, y) {
    if (this.eraser) return this.eraseAt(x, y); const s = this.cur; if (!s) return; const [px, py] = s.pts[s.pts.length - 1], d = Math.hypot(x - px, y - py); if (d < 3) return;
    const k = Math.ceil(d / 6); for (let i = 1; i <= k; i++) s.pts.push([px + (x - px) * i / k, py + (y - py) * i / k]);
  }
  endStroke() { this.cur = null; }
  eraseAt(x, y) { this.sketch = this.sketch.filter(s => !s.pts.some(([a, b]) => Math.hypot(a - x, b - y) < 16)); }
  undoStroke() { this.sketch.pop(); this.cur = null; }
  clearSketch() { this.sketch = []; this.cur = null; }
  compareSketch() {                                          // how much of the real route did the player's doodle pass through?
    if (this.hide()) return this.say('The fog hides the route. Finish the wave, then compare your blueprint.', true);
    const r = this.route, pts = this.sketch.flatMap(s => s.pts); if (!r) return; if (!pts.length) return this.say('Draw a blueprint first: sketch where you think packets will walk.', true);
    const tiles = r.path.slice(1, -1), hit = tiles.filter(n => { const cx = (n % COLS + .5) * CELL, cy = ((n / COLS | 0) + .5) * CELL; return pts.some(([x, y]) => Math.hypot(x - cx, y - cy) < CELL * .5); });
    const pct = tiles.length ? Math.round(hit.length / tiles.length * 100) : 100; this.compareUntil = performance.now() / 1000 + 4; sfx(pct >= 80 ? 'up' : 'place');
    let msg = `Your blueprint passes through ${hit.length} of ${tiles.length} route tiles (${pct}%).`;
    if (pct >= 80) { msg += ' Great reading of the graph!'; if (!this.sandbox && this.sketchBonusWave !== this.wave) { this.sketchBonusWave = this.wave; this.gold += 10; msg += ' Surveyor bonus: +10 cycles.'; if (this.onEvent) this.onEvent('sketch80'); } }
    else msg += ' The cheapest route bends elsewhere: check the cost numbers or the Lens, then sketch again.';
    this.say(msg); return { hit: hit.length, total: tiles.length, pct };
  }
  puzzleAllows(tool, n) {
    const P = this.puzzle, lim = P.limits, g = this.graph;
    if (tool === 'probe') return true;
    if (tool === 'erase') { if (this.fixed.has(n)) { this.say('That piece is part of the puzzle and cannot be removed.', true); return false; } return true; }
    if (!(tool in lim)) { this.say(`${TOOLS[tool].label} is not available in this puzzle.`, true); return false; }
    if (['cable', 'upgrade', 'repair'].includes(tool)) return true;
    const used = g.mod.filter((m, i) => m === tool && !this.fixed.has(i) && !g.locked.has(i) && !g.temp.has(i)).length;
    if (used >= lim[tool]) { this.say(`Limit reached: this puzzle allows ${lim[tool]} ${TOOLS[tool].label}${lim[tool] > 1 ? 's' : ''}. Erase one to move it.`, true); return false; }
    return true;
  }
  tileInfo() {
    const n = this.hover; if (n == null) return ''; const g = this.graph, k = g.mod[n]; let s = `Tile ${n % COLS},${n / COLS | 0}`;
    if (n === START) return s + ': the portal, where packets enter'; if (n === EXIT) return s + ': the keep';
    if (CHECKS.includes(n)) return `${s}: checkpoint ${CHECKS.indexOf(n) + 1}, every packet must touch it`;
    if (g.locked.has(n)) return s + ': stone wall'; if (g.temp.has(n)) return s + ': rubble from a rockfall';
    const w = g.weight(n); s += `: entry cost ${w === Infinity ? '∞' : w}${w === 1 ? ', packets run at full speed' : w === Infinity ? '' : `, packets cross at ${Math.round(100 / w)}% speed${w >= 3 ? ' and take +25% damage (mired)' : ''}`}`;
    if (k) { s += `, ${TOOLS[k].label} tier ${g.tier[n]}`; if (SOLID.has(k) && this.thp[n] != null) s += `, HP ${Math.ceil(this.thp[n])}/${Math.round(TOWER_HP[k][g.tier[n] - 1] * HPMUL)}`;
      if (k === 'cannon' || k === 'freezer' || k === 'vault') s += `, tree depth ${this.depth(n)}, signal ${Math.round(this.eff(n) * 100)}%`; if (this._pw.has(n)) s += ', powered'; }
    if (this.glitched.has(n)) s += ', corrupted'; return s;
  }
  checkRoute() {                                             // route through every checkpoint using the Floyd table
    const g = this.graph, p = g.plan(START, CHECKS); if (!p) return null; const path = [START]; let cur = START;
    for (const t of [...p.order, EXIT]) { path.push(...g.fwPath(cur, t).slice(1)); cur = t; }
    const dist = new Map(); let s = 0; path.forEach((n, i) => { if (i) s += g.weight(n); dist.set(n, s); });
    return { path, cost: p.cost, explored: path.length, order: path, dist };
  }
  reachable() { return CHECKS.length ? !!this.graph.plan(START, CHECKS) : !!this.graph.find(START, EXIT); }
  defenders() { const g = this.graph; return g.mod.map((m, i) => (m === 'cannon' || m === 'freezer' || m === 'vault') ? i : -1).filter(i => i >= 0); }
  cableCost(a, b) { return 2 * (Math.abs(a % COLS - b % COLS) + Math.abs((a / COLS | 0) - (b / COLS | 0))); }
  cable(n) {
    if (!(n === EXIT || this.defenders().includes(n))) return this.say('Cables connect defenders and the keep. Tap one, then another.', true);
    if (this.linkFrom == null) { this.linkFrom = n; return this.say('Now tap the other end of the cable.'); }
    const a = this.linkFrom; this.linkFrom = null; if (a === n) return;
    if (this.cables.some(([x, y]) => (x === a && y === n) || (x === n && y === a))) return this.say('Those two are already linked.', true);
    const cost = this.cableCost(a, n); if (this.gold < cost) return this.say(`That cable costs ${cost} cycles.`, true);
    this.gold -= cost; this.cables.push([a, n]); sfx('place'); learn('prim'); this.say(`Cable laid for ${cost} cycles. Powered defenders get +30% power.`);
  }
  powerSet() { const s = new Set([EXIT]), q = [EXIT]; for (let i = 0; i < q.length; i++) for (const [a, b] of this.cables) { const o = a === q[i] ? b : b === q[i] ? a : -1; if (o >= 0 && !s.has(o)) { s.add(o); q.push(o); } } return s; }
  pow(n) { return (this._pw.has(n) ? 1.3 : 1) * (this.haste > 0 ? 1.25 : 1); }
  gridInfo() {                                               // compare the player's cables with Prim's minimum spanning tree
    const nodes = [EXIT, ...this.defenders()], inT = new Set([EXIT]), edges = []; let total = 0;
    while (inT.size < nodes.length) { let best = null; for (const a of inT) for (const b of nodes) if (!inT.has(b)) { const w = this.cableCost(a, b); if (!best || w < best[2]) best = [a, b, w]; } inT.add(best[1]); edges.push(best); total += best[2]; }
    const spent = this.cables.reduce((s, [a, b]) => s + this.cableCost(a, b), 0), powered = nodes.filter(n => n !== EXIT && this._pw.has(n)).length, n = nodes.length - 1;
    return { n, powered, spent, edges, total, optimal: n >= 2 && powered === n && this.cables.length === n && spent === total };
  }
  autoWire() {
    const gi = this.gridInfo(); if (!gi.n) return; const fee = Math.ceil(gi.total * .25), need = gi.total + fee - Math.floor(gi.spent / 2);
    if (this.gold < need) return this.say(`Auto-wire costs ${need} cycles (the optimum plus a 25% fee, minus a half refund of old cables).`, true);
    this.gold -= need; this.cables = gi.edges.map(([a, b]) => [a, b]); sfx('up'); learn('prim');
    this.say(`Prim wired ${gi.n} defender${gi.n > 1 ? 's' : ''} for the minimum ${gi.total} cycles. Wiring by hand saves the ${fee} cycle fee.`);
  }
  clearCables() { const gi = this.gridInfo(); this.gold += Math.floor(gi.spent / 2); this.cables = []; this.linkFrom = null; }
  addDefender(n, tool) { this.insOrder.push(n); if (this.kind === 'btree') this.bt = btInsert(this.bt, n); else this.tree = tIns(this.tree, n, this.avl); learn(this.kind === 'btree' ? 'btree' : 'bst'); if (tool === 'vault') this.vt[n] = { m: 3, s: [null, null, null] }; }
  dropDefender(n) { this.insOrder = this.insOrder.filter(k => k !== n); if (this.kind === 'btree') this.rebuildStructure(); else this.tree = tDel(this.tree, n, this.avl); if (this.sel === n) this.sel = null; delete this.vt[n]; delete this.mode[n]; this.cables = this.cables.filter(([a, b]) => a !== n && b !== n); if (this.linkFrom === n) this.linkFrom = null; }
  depth(n) { if (this.kind === 'btree') { const r = btLevel(this.bt, n); return r ? r.d : 1; } return tDepth(this.tree, n) || 1; }
  eff(n) {                                                   // each tree level adds relay lag; crowded B-tree nodes add a little more
    let lag = .09 * (this.depth(n) - 1); if (this.kind === 'btree') { const r = btLevel(this.bt, n); if (r) lag += .03 * (r.size - 1); } return Math.max(.45, 1 - lag);
  }
  setKind(k) {
    if (this.puzzle && !this.puzzle.limits.kind) return this.say('Switching structures is not part of this puzzle.', true);
    if (k === this.kind) return; const cost = { bst: 0, avl: 60, btree: 90 }[k]; if (this.gold < cost) return this.say(`That costs ${cost} cycles.`, true);
    this.gold -= cost; this.kind = k; this.avl = k === 'avl'; this.rebuildStructure(); sfx('up'); if (k === 'avl') learn('avl'); if (k === 'btree') learn('btree');
    if (this.onPlace) this.onPlace(k === 'btree' ? 'btree' : k === 'avl' ? 'avl' : 'bst-mode');
    this.say({ bst: 'Back to a plain BST, rebuilt by re-inserting your towers in placement order.', avl: 'AVL Protocol active: the tree rebalances on every insert and delete.', btree: 'B-tree active: nodes hold up to 3 towers, and a full node splits and sends its middle key up.' }[k]);
  }
  rebuildStructure() {
    this.tree = null; this.bt = null; btSplits = 0; const ks = this.insOrder; this.sel = null;
    if (this.kind === 'btree') ks.forEach(k => this.bt = btInsert(this.bt, k)); else if (this.kind === 'avl') this.tree = build([...ks].sort((a, b) => a - b)); else ks.forEach(k => this.tree = tIns(this.tree, k, false));
  }
  rotate(dir) {
    if (this.kind !== 'bst') return;
    if (this.puzzle) { const L = this.puzzle.limits.rotate; if (L === undefined) return this.say('Rotations are not part of this puzzle.', true); if (this.rotations >= L) return this.say(`Rotation limit reached (${L}).`, true); }
    const n = this.sel, x = n == null ? null : tFind(this.tree, n); if (!x) return;
    if (!(dir === 'L' ? x.r : x.l)) return this.say('That rotation needs a child on the other side.', true);
    if (this.gold < 8) return this.say('Not enough CPU cycles.', true);
    this.gold -= 8; this.tree = rotAt(this.tree, n, dir); this.rotations++; sfx('place'); learn('avl'); if (this.onPlace) this.onPlace('rotate'); this.say(`Rotated ${n % COLS},${n / COLS | 0} ${dir === 'L' ? 'left' : 'right'}. In-order is unchanged, so it is still a valid BST.`);
  }
  goAvl() { this.setKind('avl'); }
  deposit(e) {                                                               // Cache Vault = hash table: slot = id mod size, linear probing
    const p = e.pos; for (const [key, v] of Object.entries(this.vt)) { const n = +key, cx = (n % COLS + .5) * CELL, cy = ((n / COLS | 0) + .5) * CELL;
      if (Math.hypot(p.x - cx, p.y - cy) > 2.6 * CELL) continue; let i = e.uid % v.m, probes = 0; while (v.s[i] !== null && probes < v.m) { i = (i + 1) % v.m; probes++; }
      if (probes >= v.m) { this.pop(cx, cy - 30, 'cache full', '#e8506a'); continue; } v.s[i] = e.uid; if (probes) { this.pop(cx, cy - 30, `collision, +${probes} probe${probes > 1 ? 's' : ''}`, '#ecc66b'); learn('collision'); } }
  }
  rehash(n) {
    const v = this.vt[n]; if (!v) return; const m = [3, 5, 7][this.graph.tier[n] - 1], old = v.s.filter(x => x !== null); v.m = m; v.s = Array(m).fill(null);
    for (const id of old) { let i = id % m; while (v.s[i] !== null) i = (i + 1) % m; v.s[i] = id; } toast(`Cache Vault rehashed into ${m} slots.`); learn('rehash');
  }
  payout() {
    const gi = this.gridInfo(); if (gi.optimal) { this.gold += 15; toast('Optimal power grid (Prim)! +15 cycles'); learn('prim'); }
    let t = 0; for (const v of Object.values(this.vt)) { t += v.s.filter(x => x !== null).length * 3; v.s.fill(null); } t = Math.round(t * this.inc); if (t) { this.gold += t; toast(`Cache payout: +${t} cycles from stored packets.`); } }
  splitHydra(p) {                                           // recursion: each death spawns two smaller copies
    for (let k = 0; k < 2; k++) {
      const c = new Enemy(Math.round(p.maxHp * .5), this, 'hydra'); c.gen = (p.gen || 0) + 1; c.n = p.n; c.t = Math.max(0, p.t - k * .35); c.todo = [...p.todo]; c.reroute(p.next ?? p.n); c.next = p.next ?? p.n;
      this.enemies.push(c); this.fx.push({ x: p.pos.x, y: p.pos.y, ring: true, rad: 44, life: .4, max: .4, color: '#6be0b0' });
    }
  }
  rnd() { if (!this.seed) return Math.random(); let t = this.seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  applyEvent(type = this.sandbox ? null : EVENT_AT[cyc(this.wave)]) {
    const g = this.graph; if (!type) return;
    const free = []; for (let n = 0; n < g.size; n++) if (!g.mod[n] && !g.locked.has(n) && !g.temp.has(n) && n !== START && n !== EXIT && !CHECKS.includes(n)) free.push(n);
    const pick = k => { const o = []; while (o.length < k && free.length) o.push(free.splice(this.rnd() * free.length | 0, 1)[0]); return o; };
    let nodes = [], ev = { type, nodes };
    if (type === 'rockfall') for (const n of pick(2)) { g.setTool(n, 'barrier'); if (this.reachable()) { g.temp.add(n); nodes.push(n); } else g.setTool(n, null); }
    if (type === 'mudslide') { nodes.push(...pick(3)); nodes.forEach(n => { g.base[n] += 3; g.retune(n); }); }
    if (type === 'warp') {
      const L = free.filter(n => n % COLS < COLS * .4), R = free.filter(n => n % COLS > COLS * .6);
      if (!L.length || !R.length) return;
      const pair = [L[this.rnd() * L.length | 0], R[this.rnd() * R.length | 0]]; g.portals.push(pair); g.enforce(); g.version++; nodes.push(...pair); ev.pair = pair;
    }
    this.evts.push(ev); this.evt = ev; toast(`Event: ${EVENT_INFO[type][0]}. ${EVENT_INFO[type][1]}`);
  }
  clearEvents() {
    const g = this.graph;
    for (const E of this.evts) {
      if (E.type === 'rockfall') E.nodes.forEach(n => { g.temp.delete(n); g.setTool(n, null); });
      if (E.type === 'mudslide') { E.nodes.forEach(n => g.base[n] -= 3); E.nodes.forEach(n => g.retune(n)); }
      if (E.type === 'warp') { g.portals = g.portals.filter(p => p !== E.pair); g.adj.get(E.pair[0]).delete(E.pair[1]); g.adj.get(E.pair[1]).delete(E.pair[0]); g.version++; }
    }
    this.evts = []; this.evt = null;
    for (const n of this.glitched) { g.base[n] -= 2; g.retune(n); } this.glitched.clear();
  }
  toolCount() { const g = this.graph; return g.mod.reduce((s, m, i) => s + (m && !g.locked.has(i) ? 1 : 0), 0); }
  upCost(n) { return TOOLS[this.graph.mod[n]].cost * this.graph.tier[n]; }
  place(n) {
    const g = this.graph, tool = this.tool;
    if (this.puzzle && !this.puzzleAllows(tool, n)) return;
    if (tool === 'paint' || tool === 'wall') return this.sandboxEdit(tool, n);
    if (tool === 'cable') return this.cable(n);
    if (tool === 'probe') { if (this.hide()) return this.say('The fog blocks the probe.', true); this.probe = n; return; }
    if (n === START || n === EXIT || CHECKS.includes(n)) return this.say('Start, keep and checkpoint nodes cannot be modified.', true);
    if (g.locked.has(n) || g.temp.has(n)) return this.say('Stone and rubble cannot be changed.', true);
    if (tool === 'erase') {
      if (!g.mod[n]) return;
      this.gold += Math.floor((this.paid[n] || 0) / 2); delete this.paid[n]; delete this.thp[n]; this.dropDefender(n); g.setTool(n, null); return;
    }
    if (tool === 'repair') {
      const k = g.mod[n]; if (!k || !SOLID.has(k)) return this.say('Nothing to repair here.', true);
      const mx = (TOWER_HP[k][g.tier[n] - 1] * HPMUL), cur = this.thp[n] ?? mx; if (cur >= mx) return this.say('Already at full HP.', true);
      const cost = Math.ceil((mx - cur) / mx * 12) + 3; if (this.gold < cost) return this.say('Not enough CPU cycles.', true);
      this.gold -= cost; delete this.thp[n]; sfx('up'); this.fx.push({ x: (n % COLS + .5) * CELL, y: ((n / COLS | 0) + .5) * CELL, ring: true, rad: 46, life: .5, max: .5, color: '#6df09a' });
      return this.say(`${TOOLS[k].label} repaired for ${cost} cycles.`);
    }
    if (tool === 'upgrade') {
      const k = g.mod[n]; if (!k) return this.say('Nothing to upgrade here.', true);
      if (g.tier[n] >= 3) return this.say('Already at max tier.', true);
      const up = this.upCost(n); if (this.gold < up) return this.say('Not enough CPU cycles.', true);
      this.gold -= up; this.paid[n] = (this.paid[n] || 0) + up; g.tier[n]++; delete this.thp[n]; g.retune(n); sfx('up'); this.born[n] = performance.now() / 1000; if (k === 'vault') this.rehash(n); if (g.tier[n] === 3 && this.onEvent) this.onEvent('tier3');
      this.fx.push({ x: (n % COLS + .5) * CELL, y: ((n / COLS | 0) + .5) * CELL, ring: true, rad: 50, life: .5, max: .5, color: '#6df09a' });
      this.say(`${TOOLS[k].label} upgraded to tier ${g.tier[n]}.`); if (this.onPlace) this.onPlace('upgrade'); return;
    }
    if (tool === 'cannon' && g.mod[n] === 'cannon') {
      const ms = ['weak', 'first', 'strong']; this.mode[n] = ms[(ms.indexOf(this.mode[n] || 'weak') + 1) % 3];
      return this.say(`Cannon targets the ${{ weak: 'weakest', first: 'furthest along', strong: 'strongest' }[this.mode[n]]} packet.`);
    }
    if (g.mod[n]) return this.say('Node already has a tool. Erase it first.', true);
    if (this.capped && this.toolCount() >= MAP.limit + this.bonusSlots) return this.say(`Tool limit reached (${MAP.limit + this.bonusSlots}). Erase one first.`, true);
    const cost = Math.round(TOOLS[tool].cost * (1 - .05 * this.disc));
    if (this.gold < cost) return this.say('Not enough CPU cycles.', true);
    if (SOLID.has(tool)) {
      if (this.enemies.some(e => e.n === n || e.next === n)) return this.say('An enemy is on that node.', true);
      g.setTool(n, tool);
      if (!this.reachable()) { g.setTool(n, null); return this.say('Rejected: that would disconnect the start from the keep.', true); }
    } else g.setTool(n, tool);
    this.gold -= cost; this.paid[n] = cost; sfx('place'); this.born[n] = performance.now() / 1000; if (tool === 'cannon' || tool === 'freezer' || tool === 'vault') this.addDefender(n, tool); if (this.onPlace) this.onPlace(tool);
    this.say(`${TOOLS[tool].label} placed. Every packet just recalculated its route.`);
  }
  update(dt) {
    if (this.sandbox) { this.gold = 1e6; this.lives = this.maxLives; }
    for (const k in this.abil) this.abil[k] = this.sandbox ? 0 : Math.max(0, this.abil[k] - dt); this.haste = Math.max(0, this.haste - dt);
    if (this.spikes.length) { for (const s of this.spikes) s.t -= dt; const done = this.spikes.filter(s => s.t <= 0);
      if (done.length) { for (const s of done) s.nodes.forEach(m => { this.graph.base[m] -= 3; this.graph.retune(m); }); this.spikes = this.spikes.filter(s => s.t > 0); } }
    this._pw = this.powerSet(); this.shake = RM ? 0 : Math.max(0, this.shake - dt * 30); if (this.banner) this.banner.life -= dt;
    for (const e of this.enemies) if (e.flash > 0) e.flash -= dt;
    for (const f of this.fx) { f.life -= dt; f.x += (f.vx || 0) * dt; f.y += (f.vy || 0) * dt; }
    this.fx = this.fx.filter(f => f.life > 0);
    if (this.phase === 'wave') {
      this.spawnT -= dt;
      if (this.sbQueue.length) {                               // sandbox: manually spawned packets
        this.sbT -= dt;
        if (this.sbT <= 0) { const ty = this.sbQueue.shift(); this.enemies.push(new Enemy(Math.round((HP_BASE + Math.max(1, this.wave) * HP_GROW) * TYPES[ty].hp * this.hpMul), this, ty)); this.sbT = .3;
          this.fx.push({ x: (START % COLS + .5) * CELL, y: ((START / COLS | 0) + .5) * CELL, ring: true, rad: 46, life: .4, max: .4, color: '#8f7bff' }); }
      }
      if (this.toSpawn > 0 && this.spawnT <= 0) { const ty = this.queue.shift(); this.enemies.push(new Enemy(Math.round(this.hp * TYPES[ty].hp), this, ty)); this.toSpawn--; this.fx.push({ x: (START % COLS + .5) * CELL, y: ((START / COLS | 0) + .5) * CELL, ring: true, rad: 46, life: .4, max: .4, color: '#8f7bff' }); this.spawnT = Math.max(.9, 1.6 - this.wave * .06); }
      this.defend(dt); for (const e of this.enemies) if (!e.dead) { e.update(dt); (e.trail = e.trail || []).push(e.pos); if (e.trail.length > 8) e.trail.shift(); }
      this.enemies = this.enemies.filter(e => !e.dead && !e.leaked);
      if (this.sandbox) this.lives = this.maxLives;
      if (this.lives <= 0 && !this.sandbox) { this.phase = 'lost'; this.banner = { text: ENDLESS ? `Fell on wave ${this.wave}` : 'Keep fallen', life: 4 }; if (this.onEvent) this.onEvent('lost'); this.say('The keep has fallen. Press Retry to try again.', true); }
      else if (!this.toSpawn && !this.enemies.length && !this.sbQueue.length && this.manual) { this.manual = false; this.phase = 'build'; this.clearEvents(); this.payout(); this.say('Sandbox: all packets cleared.'); }
      else if (!this.toSpawn && !this.enemies.length && !this.sbQueue.length) {
        const bonus = Math.round((25 + this.wave * 3) * this.inc); this.gold += bonus; this.banner = { text: 'Wave cleared', life: 1.8 }; this.clearEvents(); this.payout();
        if (!ENDLESS && this.wave >= WAVES) { this.phase = 'won'; this.banner = { text: 'Victory', life: 4 }; if (this.onEvent) this.onEvent('won'); this.say('All waves repelled. The keep stands!'); }
        else { this.phase = 'build'; this.say(`Wave ${this.wave} cleared (+${bonus} cycles). Rework the graph, then send the next.`); }
      }
    }
    if (this.routeVer !== this.graph.version || this.routeAlgo !== this.algo) {
      this.route = CHECKS.length ? this.checkRoute() : this.graph.find(START, EXIT, this.algo); this.routeVer = this.graph.version; this.routeAlgo = this.algo; this.lensStart = null;
    }
  }
  /* ---- effects ---- */
  pop(x, y, text, color) { this.fx.push({ x, y, vy: -28, life: 1, text, color }); }
  burst(x, y, color) { for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28, s = 40 + Math.random() * 70; this.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .7, r: 2 + Math.random() * 3, color }); } }
  tutorialTiles() {
    if (this.hl != null) return [this.hl];
    const hi = ui.tut && ui.tut.hi, r = this.route; if (!hi || !r) return [];
    if (hi === 'beside') { const g = this.graph, on = new Set(r.path), c = r.path.slice(1, -1).flatMap(n => g.nbrs(n)).filter(m => !on.has(m) && !g.mod[m] && !g.locked.has(m) && !g.temp.has(m)); return c.length ? [c[c.length >> 1]] : []; }
    const mid = r.path.slice(1, -1).filter(n => !this.graph.mod[n]); if (!mid.length) return [];
    return [hi === 'costly' ? mid.reduce((a, b) => this.graph.weight(b) > this.graph.weight(a) ? b : a) : mid[mid.length >> 1]];
  }
  /* ---- rendering ---- */
  tile(n, T) {
    const c = this.ctx, g = this.graph, x = (n % COLS) * CELL, y = ((n / COLS) | 0) * CELL, w = g.weight(n), t = g.mod[n];
    const eff = w === Infinity ? g.base[n] : w;                       // terrain look follows the effective cost
    c.fillStyle = `hsl(${THEME.hue - (eff - 1) * THEME.shift} ${THEME.s + eff * 5}% ${Math.max(9, THEME.l - eff * 3)}%)`; c.beginPath(); c.roundRect(x + 2, y + 2, 76, 76, 7); c.fill();
    c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.moveTo(x + 5, y + 76); c.lineTo(x + 5, y + 5); c.lineTo(x + 75, y + 5); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(x + 76, y + 8); c.lineTo(x + 76, y + 76); c.lineTo(x + 8, y + 76); c.stroke();
    for (let i = 0; i < 7; i++) {
      c.fillStyle = eff >= 3 ? THEME.moss : eff === 2 ? 'rgba(200,190,230,.18)' : 'rgba(255,255,255,.07)';
      c.beginPath(); c.ellipse(x + 8 + hash(n, i) * 64, y + 8 + hash(n, i + 9) * 64, eff >= 3 ? 5 : 3, eff >= 3 ? 3 : 2, 0, 0, 7); c.fill();
    }
    if (this.glitched.has(n)) { c.fillStyle = 'rgba(125,255,181,.16)'; c.fillRect(x + 2, y + 2 + (T * 60) % 70, 76, 4); c.fillRect(x + 2, y + 2 + (T * 37 + 30) % 70, 76, 2); }
    if (eff >= 3) { c.strokeStyle = THEME.bub; c.lineWidth = 1.5; c.beginPath(); c.arc(x + 20 + hash(n, 3) * 40, y + 62 - (T * 8 + hash(n, 4) * 30) % 22, 3, 0, 7); c.stroke(); }
    if (g.locked.has(n) || g.temp.has(n)) {
      c.fillStyle = '#3b3850'; c.beginPath(); c.roundRect(x + 2, y + 2, 76, 76, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2;
      for (let q = 1; q < 4; q++) { c.beginPath(); c.moveTo(x + 4, y + q * 20); c.lineTo(x + 76, y + q * 20); c.stroke(); }
      for (let q = 0; q < 4; q++) { const bx = x + (q % 2 ? 22 : 42); c.beginPath(); c.moveTo(bx, y + q * 20); c.lineTo(bx, y + q * 20 + 20); c.stroke(); }
      return;
    }
    if (n === START || n === EXIT) return;
    if (SOLID.has(t)) { if (t === 'barrier') { c.fillStyle = 'rgba(40,5,20,.6)'; c.beginPath(); c.roundRect(x + 2, y + 2, 76, 76, 7); c.fill(); } }
    else { c.fillStyle = 'rgba(8,5,16,.78)'; c.beginPath(); c.arc(x + 15, y + 15, 11, 0, 7); c.fill();
      c.font = '700 15px Cinzel,serif'; c.fillStyle = t === 'reducer' ? '#46d6c4' : t === 'toll' ? '#ecc66b' : '#cfc8e8'; c.fillText(w, x + 15, y + 16); }
    if (t) {
      const pa = Math.min(1, (T - (this.born[n] ?? -9)) / .35), pop = pa < 1 ? 1 + 2.70158 * Math.pow(pa - 1, 3) + 1.70158 * Math.pow(pa - 1, 2) : 1;   // pop-in
      drawSprite(c, t, x + 40, y + 44, T, Math.max(.2, pop), this.aim[n] || 0);
      if (t === 'cannon') { c.font = '700 11px Cinzel,serif'; c.fillStyle = '#cfc8e8'; c.fillText({ weak: 'W', first: 'F', strong: 'S' }[this.mode[n] || 'weak'], x + 68, y + 20); }
      if (SOLID.has(t) && this.thp[n] != null) { const mx = (TOWER_HP[t][g.tier[n] - 1] * HPMUL); c.fillStyle = '#000'; c.fillRect(x + 30, y + 6, 40, 5); c.fillStyle = this.thp[n] / mx > .4 ? '#6df09a' : '#e8506a'; c.fillRect(x + 31, y + 7, 38 * Math.max(0, this.thp[n]) / mx, 3); }
      if (t === 'cannon' || t === 'freezer' || t === 'vault') { const ef = this.eff(n); c.font = '700 11px Cinzel,serif'; c.fillStyle = ef >= .9 ? '#46d6c4' : ef >= .7 ? '#ecc66b' : '#e8506a'; c.textAlign = 'left'; c.fillText('d' + this.depth(n), x + 8, y + 70); c.textAlign = 'center';
        if (this._pw.has(n)) { c.fillStyle = '#ffe08a'; c.beginPath(); c.moveTo(x + 66, y + 58); c.lineTo(x + 60, y + 68); c.lineTo(x + 65, y + 68); c.lineTo(x + 62, y + 76); c.lineTo(x + 71, y + 65); c.lineTo(x + 66, y + 65); c.closePath(); c.fill(); } }
      if (t === 'vault' && this.vt[n]) { const v = this.vt[n]; v.s.forEach((s, q) => { c.fillStyle = s === null ? 'rgba(0,0,0,.55)' : '#ecc66b'; c.fillRect(x + 40 - v.s.length * 5 + q * 10, y + 60, 8, 6); }); }
      for (let q = 0; q < g.tier[n] && g.tier[n] > 1; q++) { const px = x + 40 + (q - (g.tier[n] - 1) / 2) * 12, py = y + 71; c.fillStyle = '#ecc66b'; c.strokeStyle = '#3a2a08'; c.lineWidth = 1; c.beginPath(); c.moveTo(px, py - 5); c.lineTo(px + 5, py); c.lineTo(px, py + 5); c.lineTo(px - 5, py); c.closePath(); c.fill(); c.stroke(); }
    }
  }
  draw() {
    const c = this.ctx, g = this.graph, T = performance.now() / 1000, W = COLS * CELL, H = ROWS * CELL, ctr = n => [(n % COLS + .5) * CELL, ((n / COLS | 0) + .5) * CELL];
    c.save(); if (this.shake > 0) c.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    c.fillStyle = THEME.bg; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let n = 0; n < g.size; n++) this.tile(n, T);
    for (const [a, b] of g.portals) { const [ax, ay] = ctr(a), [bx, by] = ctr(b); c.save(); c.setLineDash([4, 8]); c.strokeStyle = 'rgba(143,123,255,.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.restore();
      for (const [px, py] of [[ax, ay], [bx, by]]) { c.save(); c.translate(px, py); c.scale(.65, .65); drawPortal(c, 0, 0, T); c.restore(); } }
    for (const [a, b] of g.oneway) { const [ax, ay] = ctr(a), [bx, by] = ctr(b);
      c.save(); c.translate((ax + bx) / 2, (ay + by) / 2); c.rotate(Math.atan2(by - ay, bx - ax)); c.fillStyle = '#ecc66b'; c.strokeStyle = '#3a2a08'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -11); c.lineTo(-6, 11); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    const rt = this.hide() ? null : this.route;
    if (this.lens && rt) {                                   // Algorithm Lens: visit order + best-known cost g(n)
      if (this.lensStart == null) this.lensStart = T;
      const k = Math.min(rt.order.length, Math.floor((T - this.lensStart) * 20));
      for (let q = 0; q < k; q++) { const n = rt.order[q], [lx, ly] = ctr(n); c.fillStyle = `rgba(70,214,196,${.08 + .3 * (1 - q / rt.order.length)})`;
        c.beginPath(); c.roundRect(lx - 38, ly - 38, 76, 76, 7); c.fill(); c.font = '700 13px Cinzel,serif'; c.fillStyle = '#d9fff9'; c.fillText(rt.dist.get(n), lx + 22, ly + 28); }
      if (k && k < rt.order.length) { const [fx, fy] = ctr(rt.order[k - 1]); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.roundRect(fx - 38, fy - 38, 76, 76, 7); c.stroke(); }
    }
    if (rt) {
      c.save(); c.lineCap = c.lineJoin = 'round'; c.shadowColor = '#46d6c4'; c.shadowBlur = 14; c.strokeStyle = 'rgba(70,214,196,.35)'; c.lineWidth = 9; this.line(this.route.path);
      c.shadowBlur = 0; c.strokeStyle = '#b9fff4'; c.lineWidth = 3; c.setLineDash([12, 14]); c.lineDashOffset = -T * 40; this.line(this.route.path); c.restore();
    }
    if (rt) { c.font = '700 13px Cinzel,serif'; for (const n of rt.path.slice(1)) { const [lx, ly] = ctr(n), s = rt.dist.get(n);   // running total along the route
      c.lineWidth = 3; c.strokeStyle = '#000'; c.strokeText(s, lx + 22, ly + 28); c.fillStyle = '#b9fff4'; c.fillText(s, lx + 22, ly + 28); } }
    if (this.probe !== null) {
      const r = g.find(this.probe, EXIT, this.algo);
      if (r) { c.save(); c.setLineDash([8, 6]); c.strokeStyle = '#ecc66b'; c.lineWidth = 3; this.line(r.path); c.restore();
        ui.probeNote = `Probe: cost ${r.cost} from node (${this.probe % COLS}, ${(this.probe / COLS) | 0}), explored ${r.explored}`; }
    }
    if (this.puzzle && this.puzzle.zone) { c.save(); c.fillStyle = 'rgba(255,200,80,.16)'; c.strokeStyle = 'rgba(255,200,80,.85)'; c.lineWidth = 3; c.setLineDash([8, 6]);
      for (const [zx, zy] of this.puzzle.zone) { c.fillRect(zx * CELL + 4, zy * CELL + 4, CELL - 8, CELL - 8); c.strokeRect(zx * CELL + 4, zy * CELL + 4, CELL - 8, CELL - 8); } c.restore(); }
    if (this.sketching) {                                      // blueprint paper: faint grid, tint and the player's chalk strokes
      c.save(); c.strokeStyle = 'rgba(127,212,255,.07)'; c.lineWidth = 1; c.beginPath(); for (let x = 0; x <= W; x += 20) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 0; y <= H; y += 20) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
      c.fillStyle = 'rgba(20,60,110,.14)'; c.fillRect(0, 0, W, H); c.font = '700 14px Cinzel,serif'; c.fillStyle = 'rgba(190,230,255,.8)'; c.fillText('Blueprint: sketch where you think they will go', W / 2, H - 16); c.restore();
    }
    for (const s of this.sketch) {
      c.save(); c.lineCap = c.lineJoin = 'round'; c.strokeStyle = c.fillStyle = s.color; c.shadowColor = s.color; c.shadowBlur = 8; c.lineWidth = 4; c.globalAlpha = .92;
      if (s.pts.length === 1) { c.beginPath(); c.arc(s.pts[0][0], s.pts[0][1], 3, 0, 7); c.fill(); } else { c.beginPath(); s.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); } c.restore();
    }
    if (T < this.compareUntil && rt) { c.save(); c.setLineDash([6, 8]); c.strokeStyle = '#ffe08a'; c.lineWidth = 5; c.globalAlpha = .85; c.lineCap = c.lineJoin = 'round'; this.line(rt.path); c.restore(); }
    for (const [a, b] of this.cables) { const [ax, ay] = ctr(a), [bx, by] = ctr(b); c.save(); c.strokeStyle = '#ffe08a'; c.shadowColor = '#ffe08a'; c.shadowBlur = 10; c.lineWidth = 3; c.setLineDash([10, 6]); c.lineDashOffset = -T * 30; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.restore(); }
    if (this.linkFrom != null) { const [lx, ly] = ctr(this.linkFrom); c.strokeStyle = '#ffe08a'; c.lineWidth = 3; c.beginPath(); c.arc(lx, ly, 30, 0, 7); c.stroke(); }
    CHECKS.forEach((n, i) => { const [px, py] = ctr(n); c.save(); c.translate(px, py); c.shadowColor = '#ecc66b'; c.shadowBlur = 14; c.strokeStyle = '#ecc66b'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 26, 0, 7); c.stroke(); c.fillStyle = 'rgba(236,198,107,.18)'; c.fill(); c.shadowBlur = 0; c.fillStyle = '#ecc66b'; c.font = '800 24px Cinzel,serif'; c.fillText(i + 1, 0, 2); c.restore(); });
    drawPortal(c, ...ctr(START), T); drawKeep(c, ...ctr(EXIT), T);
    [...this.enemies].sort((a, b) => a.pos.y - b.pos.y).forEach(e => drawEnemy(c, e, T));
    for (const f of this.fx) {
      c.globalAlpha = Math.min(1, f.life * 1.5);
      if (f.beam) { c.strokeStyle = f.color; c.lineWidth = 3; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke(); }
      else if (f.ring) { c.strokeStyle = f.color; c.lineWidth = 3; c.beginPath(); c.arc(f.x, f.y, f.rad * (1 - f.life / f.max), 0, 7); c.stroke(); }
      else if (f.text) { c.font = '800 20px Cinzel,serif'; c.lineWidth = 4; c.strokeStyle = '#000'; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.color; c.fillText(f.text, f.x, f.y); }
      else { c.fillStyle = f.color; c.beginPath(); c.arc(f.x, f.y, f.r, 0, 7); c.fill(); }
    }
    c.globalAlpha = 1;
    const h = this.hover;
    if (h !== null && h !== START && h !== EXIT) {
      const [hx, hy] = ctr(h);
      if (!g.mod[h] && !['probe', 'erase', 'upgrade'].includes(this.tool)) { c.globalAlpha = .5; drawSprite(c, this.tool, hx, hy + 4, T); c.globalAlpha = 1; }
      c.strokeStyle = '#ecc66b'; c.lineWidth = 3; c.beginPath(); c.roundRect(hx - 38, hy - 38, 76, 76, 7); c.stroke();
      const info = this.tileInfo();                              // tooltip for the hovered tile
      if (info) { c.font = '600 13px Alegreya Sans, sans-serif'; const tw = c.measureText(info).width + 16, bx = Math.min(Math.max(4, hx - tw / 2), W - tw - 4), by = hy - 66 < 4 ? hy + 42 : hy - 66;
        c.fillStyle = 'rgba(14,10,26,.92)'; c.strokeStyle = '#7d6538'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(bx, by, tw, 24, 6); c.fill(); c.stroke(); c.fillStyle = '#ece8f7'; c.textAlign = 'left'; c.fillText(info, bx + 8, by + 13); c.textAlign = 'center'; }
      if (this.armed === 'spike') for (let m = 0; m < g.size; m++) if (Math.abs(m % COLS - h % COLS) + Math.abs((m / COLS | 0) - (h / COLS | 0)) <= 2) { c.fillStyle = 'rgba(232,80,106,.22)'; c.fillRect((m % COLS) * CELL + 3, (m / COLS | 0) * CELL + 3, CELL - 6, CELL - 6); }
      const hk = g.mod[h] || this.tool, rg = STATS[hk] && STATS[hk].range && STATS[hk].range[(g.mod[h] ? g.tier[h] : 1) - 1];
      if (rg) { c.save(); c.setLineDash([6, 6]); c.strokeStyle = 'rgba(236,198,107,.7)'; c.beginPath(); c.arc(hx, hy, rg * CELL, 0, 7); c.stroke(); c.restore(); }
      if (this.tool === 'upgrade' && g.mod[h]) { const tx = g.tier[h] >= 3 ? 'Max tier' : '↑ ' + this.upCost(h); c.font = '800 16px Cinzel,serif'; c.lineWidth = 4; c.strokeStyle = '#000'; c.strokeText(tx, hx, hy - 46); c.fillStyle = g.tier[h] >= 3 ? '#a79fc4' : '#6df09a'; c.fillText(tx, hx, hy - 46); }
    }
    for (const n of this.tutorialTiles()) { const [tx, ty] = ctr(n); c.strokeStyle = '#46d6c4'; c.lineWidth = 4; c.globalAlpha = .6 + .4 * Math.sin(T * 6);
      c.beginPath(); c.roundRect(tx - 38 - 2 * Math.sin(T * 6), ty - 38 - 2 * Math.sin(T * 6), 76 + 4 * Math.sin(T * 6), 76 + 4 * Math.sin(T * 6), 9); c.stroke(); c.globalAlpha = 1; }
    c.globalCompositeOperation = 'lighter';                                              // torch light + embers
    for (let i = 0; i < (RM ? 0 : 28); i++) {                // themed ambient particles
      const r1 = hash(i, 1), r2 = hash(i, 2), r3 = hash(i, 3), [fr, fg, fb] = THEME.fxc; c.fillStyle = `rgba(${fr},${fg},${fb},${.15 + .25 * hash(i, 5)})`;
      if (THEME.fx === 'snow') c.fillRect((r1 * W + Math.sin(T * .8 + i) * 20 + T * 6) % W, (T * (14 + r2 * 18) + r3 * H) % H, 3, 3);
      else if (THEME.fx === 'sand') c.fillRect((T * (60 + r2 * 80) + r1 * W) % W, r3 * H + Math.sin(T + i) * 10, 12, 1.5);
      else if (THEME.fx === 'spores') { c.beginPath(); c.arc(r1 * W + Math.sin(T * .6 + i) * 18, H - (T * (6 + r2 * 10) + r3 * H) % H, 2 + r2 * 2, 0, 7); c.fill(); }
      else if (THEME.fx === 'binary') { c.font = '12px Cinzel,serif'; c.fillText((i + (T | 0)) % 2, r1 * W, (T * (20 + r2 * 30) + r3 * H) % H); }
      else c.fillRect(r1 * W + Math.sin(T + i) * 14, H - (T * (12 + r2 * 22) * (THEME.name === 'Magma Keep' ? 2 : 1) + r3 * H) % H, 2, 2);
    }
    for (const n of [START, EXIT]) { const [lx, ly] = ctr(n), r = 130 + 8 * Math.sin(T * 7 + n), lg = c.createRadialGradient(lx, ly, 5, lx, ly, r);
      lg.addColorStop(0, n === EXIT ? THEME.lightE : THEME.lightS); lg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = lg; c.fillRect(lx - r, ly - r, 2 * r, 2 * r); }
    c.globalCompositeOperation = 'source-over';
    const v = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .65); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, THEME.vig); if (this.hide()) {
      for (let q = 0; q < 5; q++) { const fx = (T * (8 + q * 3) + q * 190) % (W * 1.25) - 100, fy = H * .12 + q * H * .18, fg = c.createRadialGradient(fx, fy, 10, fx, fy, 170);
        fg.addColorStop(0, 'rgba(170,160,210,.16)'); fg.addColorStop(1, 'rgba(170,160,210,0)'); c.fillStyle = fg; c.fillRect(fx - 170, fy - 170, 340, 340); }
      c.font = '700 15px Cinzel,serif'; c.fillStyle = '#d9d3f2'; c.fillText('Fog round: the route is hidden', W / 2, 20);
    }
    if (this.sandbox) { c.font = '700 14px Cinzel,serif'; c.fillStyle = 'rgba(220,214,240,.65)'; c.textAlign = 'right'; c.fillText('Sandbox', W - 12, 20); c.textAlign = 'center'; }
    c.fillStyle = v; c.fillRect(0, 0, W, H); c.restore();
    const bn = this.banner;
    if (bn && bn.life > 0) { c.globalAlpha = Math.max(0, Math.min(1, bn.life * 2, (2 - bn.life) * 3)); c.fillStyle = 'rgba(8,5,16,.7)'; c.fillRect(0, H / 2 - 50, W, 100);
      c.font = '800 38px Cinzel,serif'; c.lineWidth = 5; c.strokeStyle = '#000'; c.fillStyle = '#ecc66b'; c.strokeText(bn.text, W / 2, H / 2 + 1); c.fillText(bn.text, W / 2, H / 2 + 1); c.globalAlpha = 1; }
  }
  line(nodes) {
    const c = this.ctx; c.beginPath();
    nodes.forEach((n, i) => { const x = (n % COLS + .5) * CELL, y = ((n / COLS | 0) + .5) * CELL; i ? c.lineTo(x, y) : c.moveTo(x, y); });
    c.stroke();
  }
}

