
'use strict';
/* Pathfinder's Keep — vanilla ES6. Sections: config, Graph, Enemy, Game, UI. */

let COLS = 10, ROWS = 7;                                       // set per map
const CELL = 80, WAVES = 20;
let START = 30, EXIT = 39, MAP = null, ENDLESS = false, SANDBOX = false, CHECKS = [];                  // node ids: y*COLS + x; set per map
const TOOLS = {
  reducer: { label: 'Weight Reducer', cost: 15, desc: 'Sets the cost of entering this node to 1. Cost is also travel time, so this is a fast lane: it lures the route, but packets sprint through it. Tier 2+ also cuts the cost of adjacent nodes (by 1 per tier above 1).' },
  toll:    { label: 'Toll Bridge',    cost: 25, desc: 'Adds +3 to the node cost, so packets cross it at a quarter of the speed or less, and pays cycles per crossing: 2 / 4 / 6 by tier.' },
  barrier: { label: 'Infinity Edge',  cost: 10, desc: 'Cost becomes ∞: every edge touching the node is removed. You may not cut the keep off. Tier 2+ crystals shoot nearby packets.' },
  trap:    { label: 'Spike Trap',     cost: 30, desc: 'Damages each packet that enters: 3 / 5 / 8 by tier. Only works if the route runs through it.' },
  cannon:  { label: 'Heap Cannon',    cost: 40, desc: 'Fires at the weakest packet in range, like popping a min-heap (tap it again to cycle weakest / furthest / strongest). Joins the Command Tree: deeper nodes fire slower. Solid: it blocks its node like a wall, and packets beside it chew through its HP.' },
  freezer: { label: 'Queue Freezer',  cost: 30, desc: 'Packets in range crawl along, slowed 40% / 55% / 70% by tier. Solid, like a wall.' },
  mine:    { label: 'Null Pointer Mine', cost: 20, desc: 'Detonates once when a packet enters, hurting everything nearby. Rebuild it after each blast.' },
  vault:   { label: 'Cache Vault',    cost: 35, desc: 'A hash table: packets destroyed within 2.6 tiles are stored in slot id mod size, collisions probe the next slot, and a full table loses the loot. Pays 3 cycles per stored packet after each wave, plus a small trickle. Upgrading rehashes it into 3, 5, then 7 slots. Solid, like a wall.' },
  probe:   { label: 'Dijkstra Probe', cost: 0,  desc: 'Click any node to preview its cheapest path to the keep.' },
  erase:   { label: 'Erase',          cost: 0,  desc: 'Remove a tool from a node and refund half of everything you spent on it.' },
  repair:  { label: 'Repair',         cost: 0,  desc: 'Tap a damaged solid tool to restore its HP. Costs 3 cycles plus up to 12 by damage.' },
  upgrade: { label: 'Upgrade',        cost: 0,  desc: 'Tap a placed tool to raise its tier, up to 3. Costs its base price × its current tier.' },
  cable:   { label: 'Cable',          cost: 0,  desc: 'Tap a defender or the keep, then a second one, to lay a cable (2 cycles per tile). Defenders connected to the keep get +30% power. The cheapest way to connect everything is a minimum spanning tree, which Prim builds.' },
  paint:   { label: 'Paint cost',     cost: 0,  desc: 'Sandbox only: tap an open tile to raise its base cost from 1 to 9, then back to 1. Watch the route change.' },
  wall:    { label: 'Stone wall',     cost: 0,  desc: 'Sandbox only: tap to build or remove a permanent stone wall. Walls that would cut the route are refused.' }
};
const STATS = {
  cannon: { range: [2.2, 2.6, 3], dmg: [2, 3, 5], rate: [.8, .6, .45] },
  freezer: { range: [1.6, 2, 2.4], slow: [.4, .55, .7] },
  vault: { rate: [2, 1, .7], gold: [1, 1, 2] },
  barrier: { range: [0, 1.3, 1.3], dmg: [0, 1, 2], rate: [1, .9, .7] },
  trap: { dmg: [3, 5, 8] }, toll: { gold: [2, 4, 6] }, mine: { range: [1.2, 1.5, 1.8], dmg: [8, 14, 22] }
};

const wc = (x, a, b) => Array.from({ length: b - a + 1 }, (_, i) => [x, a + i]);        // a vertical wall segment
const ring = (a, b, gap) => { const o = []; for (let i = a; i <= b; i++) for (const [x, y] of [[i, a], [i, b], [a, i], [b, i]]) if (!(x === gap[0] && y === gap[1]) && !o.some(q => q[0] === x && q[1] === y)) o.push([x, y]); return o; };
const MAPS = [
  { name: 'Training Grounds', limit: 12, start: [0, 3], exit: [9, 3], walls: [], oneway: [], portals: [], note: 'Open ground. Learn to bend the route.' },
  { name: 'Broken Bridges', limit: 10, start: [0, 3], exit: [9, 3], portals: [], note: 'Ancient stone leaves narrow gaps. Gold arrows are one-way edges: the reverse edge does not exist.',
    walls: [[4,0],[4,1],[4,3],[4,4],[4,6],[7,0],[7,2],[7,3],[7,5],[7,6]], oneway: [[[5,1],[5,2]], [[5,4],[5,5]], [[2,2],[2,3]]] },
  { name: 'Warp Halls', limit: 9, start: [0, 6], exit: [9, 0], oneway: [], note: 'Portals add a cost-1 edge between distant nodes. A* switches to Dijkstra here: Manhattan guesses are no longer admissible.',
    walls: [[3,4],[3,5],[3,6],[5,4],[5,5],[6,0],[6,1],[6,2]], portals: [[[2,6],[8,1]], [[1,2],[7,5]]] },
  { name: 'Mirror Maze', limit: 8, start: [0, 0], exit: [9, 6], note: 'Zigzag walls, a one-way gate and a long-range portal. Every shortcut has a catch.',
    walls: [[2,1],[2,2],[2,3],[2,5],[2,6],[5,0],[5,1],[5,3],[5,4],[5,5],[7,1],[7,2],[7,4],[7,5]], oneway: [[[3,4],[4,4]], [[6,2],[6,3]]], portals: [[[1,6],[8,0]]] },
  { name: 'Twin Gates', hidden: true, cols: 10, rows: 7, limit: 10, start: [0, 3], exit: [9, 3], oneway: [], portals: [], note: 'Two walls, two gates each.', walls: [...wc(3,0,0), ...wc(3,2,4), ...wc(3,6,6), ...wc(6,0,0), ...wc(6,2,4), ...wc(6,6,6)] },
  { name: 'Pocket Fort', cols: 8, rows: 6, limit: 8, start: [0, 2], exit: [7, 3], oneway: [], portals: [], note: 'A tiny 8x6 map: every tile counts and routes are short.',
    walls: [[3,0],[3,1],[3,3],[3,4],[3,5],[5,0],[5,2],[5,3],[5,5]] },
  { name: 'Switchback', cols: 12, rows: 6, limit: 12, start: [0, 0], exit: [11, 5], oneway: [], portals: [], note: 'A 12x6 zigzag with a very long route. Packets spend ages inside your range.',
    walls: [...wc(2,0,4), ...wc(4,1,5), ...wc(6,0,4), ...wc(8,1,5), ...wc(10,0,4)] },
  { name: 'Crossroads', cols: 12, rows: 8, limit: 12, start: [0, 4], exit: [11, 4], checks: [[2,3],[4,0],[3,7]], oneway: [], portals: [],
    note: 'Checkpoint run: packets must touch all three flags. They read a Floyd-Warshall table to pick the cheapest order. Bend the weights and watch the table.',
    walls: [[5,3],[5,4],[6,3],[6,4],[3,5],[3,6],[8,5],[8,6],[1,2],[1,3],[10,5],[10,6]] },
  { name: 'Grand Citadel', cols: 14, rows: 9, limit: 14, start: [0, 4], exit: [13, 4], oneway: [[[8,3],[8,4]]], portals: [[[2,8],[10,0]]], note: 'A huge 14x9 fortress with several approaches, a portal and a one-way gate.',
    walls: [...wc(3,2,6), ...wc(6,0,3), ...wc(6,5,8), ...wc(11,1,3), ...wc(11,5,7)] },
  { name: 'The Spiral', cols: 9, rows: 9, limit: 10, start: [0, 0], exit: [4, 4], oneway: [], portals: [], note: 'A square spiral: the long way in is the only way in.',
    walls: [...ring(1, 7, [1, 4]), ...ring(3, 5, [5, 4])] }
];
const ABIL = {
  extract: { name: 'Extract-min', cd: 14, key: 'z', desc: 'Delete the root of the packet heap: instantly destroys the weakest packet.' },
  rebal: { name: 'Rebalance', cd: 45, key: 'x', desc: 'Rebuild your command tree perfectly balanced and speed up every defender by 25% for 6 seconds.' },
  flush: { name: 'Flush cache', cd: 25, key: 'v', desc: 'Empty every Cache Vault now and collect the payout early.' },
  spike: { name: 'Weight spike', cd: 30, key: 'b', desc: 'Pick a tile: nodes within 2 steps get +3 cost for 8 seconds: packets slow down there and the route bends away.' }
};
const THEME_OF = { 'Training Grounds': 'dungeon', 'Broken Bridges': 'swamp', 'Warp Halls': 'circuit', 'Mirror Maze': 'frost', 'Pocket Fort': 'desert', 'Switchback': 'swamp', 'Crossroads': 'desert', 'Twin Gates': 'frost', 'Grand Citadel': 'frost', 'The Spiral': 'volcano' };
MAPS.forEach(m => m.theme = THEME_OF[m.name] || 'dungeon');

let HPMUL = 1;                                               // tower HP multiplier (Masonry perk, Glass Cannons mutator)
const SOLID = new Set(['barrier', 'cannon', 'freezer', 'vault']);       // solid tools delete their node from the graph
const TOWER_HP = { barrier: [40, 70, 110], cannon: [30, 50, 80], freezer: [30, 50, 80], vault: [25, 40, 60] };
const ATK = { grunt: 2, runner: 1.5, tank: 4, smart: 2, glitch: 2, scout: 1.5, phantom: 2, breaker: 7, charger: 2, wanderer: 2, hydra: 6, golem: 14, leaper: 6, cartographer: 8 };   // damage per second to adjacent solid tools

const PERKS = { gold: ['War Chest', '+25 starting cycles', 5, 30], life: ['Reinforced Gates', '+1 life', 3, 60], tools: ['Pack Mule', '+1 slot under the Tool Limit mutator', 3, 80],
  disc: ['Haggler', '-5% tool prices', 4, 50], dmg: ['Overclock', '+8% defender damage', 5, 70], avl: ['Auto-Balancer', 'AVL Protocol starts active', 1, 200], hp: ['Masonry', '+12% tower HP', 4, 60] };   // [name, effect per level, max level, base cost]

/* Balance knobs (the playtest bot reports how they play out) */
const HP_BASE = 3, HP_GROW = 2.0;
const SPEED_BASE = 4;                                          // tiles per second on a cost-1 tile; a cost-w tile takes w times as long to cross
/* ---------- Graph: adjacency map of directed, weighted edges ---------- */
class Graph {
  constructor() {
    this.size = COLS * ROWS;
    this.base = Array.from({ length: this.size }, (_, n) => {
      const x = n % COLS, y = (n / COLS) | 0;           // deterministic "rough terrain"
      return 1 + ((x * 7 + y * 13) % 5 === 0 ? 3 : (x * 3 + y * 5) % 7 === 0 ? 2 : 0);
    });
    this.base[START] = this.base[EXIT] = 1;
    this.mod = new Array(this.size).fill(null); this.tier = new Array(this.size).fill(1);          // tool on each node
    this.adj = new Map();
    this.version = 0;                                    // bumps whenever any weight changes
    for (let n = 0; n < this.size; n++) this.adj.set(n, new Map());
    for (let n = 0; n < this.size; n++) for (const m of this.nbrs(n)) this.adj.get(n).set(m, this.weight(m));
    this.temp = new Set(); this.locked = new Set(); this.noEdge = new Set(); this.portals = []; this.oneway = [];
    const id = ([x, y]) => y * COLS + x;
    for (const w of MAP.walls) { this.setTool(id(w), 'barrier'); this.locked.add(id(w)); }
    for (const [a, b] of MAP.oneway) { this.oneway.push([id(a), id(b)]); this.noEdge.add(id(b) + '>' + id(a)); }
    for (const [a, b] of MAP.portals) this.portals.push([id(a), id(b)]);
    this.enforce();
  }
  nbrs(n) {
    const x = n % COLS, y = (n / COLS) | 0, out = [];
    if (x > 0) out.push(n - 1); if (x < COLS - 1) out.push(n + 1);
    if (y > 0) out.push(n - COLS); if (y < ROWS - 1) out.push(n + COLS);
    return out;
  }
  /* Cost of every edge INTO node n. */
  weight(n) {
    const t = this.mod[n]; if (SOLID.has(t)) return Infinity;
    let w = t === 'reducer' ? 1 : t === 'toll' ? this.base[n] + 3 : this.base[n];
    if (t !== 'reducer') for (const m of this.nbrs(n)) if (this.mod[m] === 'reducer') w -= this.tier[m] - 1;   // tier 2+ reducer aura
    return Math.max(1, w);
  }
  setTool(n, tool) {
    this.mod[n] = tool;
    for (const m of this.nbrs(n)) {
      if (SOLID.has(this.mod[n]) || SOLID.has(this.mod[m])) { this.adj.get(m).delete(n); this.adj.get(n).delete(m); }
      else { this.adj.get(m).set(n, this.weight(n)); this.adj.get(n).set(m, this.weight(m)); }
    }
    this.tier[n] = 1; this.retune(n); this.version++;
  }
  retune(n) {
    for (const q of [n, ...this.nbrs(n)]) { if (SOLID.has(this.mod[q])) continue;
      for (const m of this.nbrs(q)) if (!SOLID.has(this.mod[m])) this.adj.get(m).set(q, this.weight(q)); }
    this.enforce(); this.version++;
  }
  enforce() {
    for (const k of this.noEdge) { const [a, b] = k.split('>').map(Number); this.adj.get(a).delete(b); }
    for (const [a, b] of this.portals) {
      if (!SOLID.has(this.mod[a]) && !SOLID.has(this.mod[b])) { this.adj.get(a).set(b, this.weight(b)); this.adj.get(b).set(a, this.weight(a)); }
      else { this.adj.get(a).delete(b); this.adj.get(b).delete(a); }
    }
  }
  floyd() {                                                  // all-pairs shortest paths, O(V^3), cached per graph version
    if (this._fw && this._fw.ver === this.version) return this._fw;
    const V = this.size, d = Array.from({ length: V }, () => new Float64Array(V).fill(Infinity)), nx = Array.from({ length: V }, () => new Int16Array(V).fill(-1));
    for (let i = 0; i < V; i++) { d[i][i] = 0; nx[i][i] = i; for (const [j, w] of this.adj.get(i)) { d[i][j] = w; nx[i][j] = j; } }
    for (let k = 0; k < V; k++) { const dk = d[k]; for (let i = 0; i < V; i++) { const dik = d[i][k]; if (dik === Infinity) continue; const di = d[i], ni = nx[i];
      for (let j = 0; j < V; j++) { const t = dik + dk[j]; if (t < di[j]) { di[j] = t; ni[j] = ni[k]; } } } }
    return this._fw = { ver: this.version, d, nx };
  }
  fwPath(a, b) { const { nx } = this.floyd(); if (nx[a][b] < 0) return null; const p = [a]; while (a !== b) { a = nx[a][b]; p.push(a); } return p; }
  plan(from, todo) {                                         // cheapest order to visit every checkpoint, then the keep (reads the Floyd table)
    const { d } = this.floyd(); let best = null;
    const perm = (cur, rest, acc, cost) => { if (!rest.length) { const t = cost + d[cur][EXIT]; if (!best || t < best.cost) best = { cost: t, order: acc }; return; }
      rest.forEach((c, i) => perm(c, rest.filter((_, k) => k !== i), [...acc, c], cost + d[cur][c])); };
    perm(from, todo, [], 0); return best && best.cost < Infinity ? best : null;
  }
  rebuild(prev, dst) { if (!prev.has(dst)) return null; const p = []; for (let n = dst; n !== null; n = prev.get(n)) p.push(n); return { path: p.reverse() }; }
  greedy(src, dst) {                                        // greedy best-first: orders by distance-to-goal only, ignores edge costs
    const dx = dst % COLS, dy = dst / COLS | 0, h = n => Math.abs(n % COLS - dx) + Math.abs((n / COLS | 0) - dy), prev = new Map([[src, null]]), open = [src];
    while (open.length) { open.sort((a, b) => h(a) - h(b)); const u = open.shift(); if (u === dst) break; for (const v of this.adj.get(u).keys()) if (!prev.has(v)) { prev.set(v, u); open.push(v); } }
    return this.rebuild(prev, dst);
  }
  dfs(src, dst) {                                           // depth-first: finds a path, not the shortest
    const prev = new Map([[src, null]]), st = [src];
    while (st.length) { const u = st.pop(); if (u === dst) break; for (const v of [...this.adj.get(u).keys()].reverse()) if (!prev.has(v)) { prev.set(v, u); st.push(v); } }
    return this.rebuild(prev, dst);
  }
  bfs(src, dst) {
    const prev = new Map([[src, null]]), q = [src];
    for (let i = 0; i < q.length; i++) { const u = q[i]; if (u === dst) break; for (const v of this.adj.get(u).keys()) if (!prev.has(v)) { prev.set(v, u); q.push(v); } }
    if (!prev.has(dst)) return null; const path = []; for (let n = dst; n !== null; n = prev.get(n)) path.push(n); return { path: path.reverse() };
  }
  /* Dijkstra (h = 0) or A* (Manhattan h, admissible since every weight >= 1). */
  find(src, dst, algo = 'dijkstra', pen = null) {
    const dx = dst % COLS, dy = (dst / COLS) | 0;
    const h = n => algo === 'astar' && !this.portals.length ? Math.abs(n % COLS - dx) + Math.abs(((n / COLS) | 0) - dy) : 0;
    const dist = new Map([[src, 0]]), prev = new Map(), open = new Set([src]), done = new Set();
    while (open.size) {
      let u = null, best = Infinity;
      for (const n of open) { const f = dist.get(n) + h(n); if (f < best) { best = f; u = n; } }
      open.delete(u); done.add(u);
      if (u === dst) break;
      for (const [v, w] of this.adj.get(u)) {
        if (done.has(v)) continue;
        const d = dist.get(u) + w + (pen ? pen(v) : 0);
        if (d < (dist.get(v) ?? Infinity)) { dist.set(v, d); prev.set(v, u); open.add(v); }
      }
    }
    if (!dist.has(dst)) return null;
    const path = [];
    for (let n = dst; n !== undefined; n = prev.get(n)) path.push(n);
    return { path: path.reverse(), cost: dist.get(dst), explored: done.size, order: [...done], dist };
  }
}

/* ---------- Enemy: walks node to node along the current cheapest path ---------- */
class Enemy {
  constructor(hp, game, type = 'grunt') {
    this.type = type; this.uid = ++UID; this.todo = [...CHECKS]; this.speed = TYPES[type].spd;
    this.hp = this.maxHp = hp; this.seed = Math.random() * 6; this.n = START; this.t = 0; this.ver = -1; this.game = game;
    this.reroute(START); this.next = this.path.shift() ?? START;
  }
  reroute(from) {
    const G = this.game, gr = G.graph, T = this.type;
    const leg = (a, b) => T === 'charger' ? gr.greedy(a, b) : T === 'wanderer' ? gr.dfs(a, b) : T === 'scout' ? gr.bfs(a, b)
      : gr.find(a, b, G.algo, T === 'smart' ? n => (gr.mod[n] === 'trap' || gr.mod[n] === 'mine') ? 6 : 0 : T === 'phantom' ? n => G.threat(n) : null);
    const fixedOrder = T === 'charger' || T === 'wanderer' || T === 'scout'; let r;
    if ((T === 'breaker' || T === 'golem') && (r = G.breakerPath(from))) { /* BFS to the nearest defender first */ }
    else if (this.todo.length) {                             // checkpoint maps: visit every flag, in the Floyd-optimal order unless the algorithm is too simple to know it
      const pl = fixedOrder ? null : gr.plan(from, this.todo), order = pl ? pl.order : this.todo, path = [from]; let cur = from, ok = true;
      for (const t of [...order, EXIT]) { const l = leg(cur, t); if (!l) { ok = false; break; } path.push(...l.path.slice(1)); cur = t; }
      r = ok ? { path } : null;
    } else r = leg(from, EXIT);
    this.path = r ? r.path.slice(1) : []; this.ver = gr.version; G.recalcs++;
  }
  get pos() {
    const a = this.n, b = this.next ?? this.n;
    return { x: ((a % COLS) + ((b % COLS) - (a % COLS)) * this.t + .5) * CELL,
             y: (((a / COLS | 0)) + (((b / COLS | 0)) - ((a / COLS | 0))) * this.t + .5) * CELL };
  }
  update(dt) {
    if (this.type === 'leaper') {                            // jump-point leap: skip 3 nodes ahead every 4 s
      this.jt = (this.jt ?? 3) - dt;
      if (this.jt <= 0 && this.path.length > 3 && !this.todo.some(c => c === this.next || this.path.slice(0, 3).includes(c))) {
        this.jt = 4; let q = this.pos; this.game.fx.push({ x: q.x, y: q.y, ring: true, rad: 40, life: .4, max: .4, color: '#8ec5ff' });
        const land = this.path.splice(0, 3).pop(); this.n = land; this.t = 0; this.next = this.path.shift() ?? land;
        q = this.pos; this.game.fx.push({ x: q.x, y: q.y, ring: true, rad: 40, life: .4, max: .4, color: '#8ec5ff' }); this.game.onEnter(this, land); if (this.dead) return;
      }
    }
    if (this.stall) { if (this.game.siegeTarget(this.n)) return; this.stall = false; this.reroute(this.n); this.next = this.path.shift() ?? this.n; this.t = 0; }
    if (this.ver !== this.game.graph.version) { this.reroute(this.next); }   // finish current edge, then follow new plan
    const w = this.game.graph.weight(this.next), heavy = this.type === 'tank' || this.type === 'golem';         // weight is travel time; treads cope with mud better
    const cost = Number.isFinite(w) ? (heavy ? 1 + (w - 1) * .5 : w) : 1;
    this.t += dt * SPEED_BASE * this.speed * (this.game.spdMul || 1) * (this.slowMul || 1) / Math.max(1, cost);
    while (this.t >= 1) {
      this.t -= 1; this.n = this.next;
      this.game.onEnter(this, this.n);
      if (this.dead || (this.n === EXIT && !this.todo.length)) return;
      const ti = this.todo.indexOf(this.n); if (ti >= 0) { this.todo.splice(ti, 1); this.reroute(this.n); this.game.fx.push({ x: this.pos.x, y: this.pos.y, ring: true, rad: 44, life: .4, max: .4, color: '#ecc66b' }); }
      if ((this.type === 'breaker' || this.type === 'golem') && this.game.siegeTarget(this.n)) { this.stall = true; this.next = this.n; this.t = 0; return; }
      if (!this.path.length) this.reroute(this.n);
      this.next = this.path.shift() ?? this.n;
    }
  }
}

/* ---------- Procedural art (all sprites are drawn in code) ---------- */
const TYPES = {
  grunt:  { name: 'Grunt',  c: ['#ff7a90', '#b3243f'], s: 1,   hp: 1,   spd: 1,   gold: 5,  tip: 'Takes the cheapest route.' },
  runner: { name: 'Runner', c: ['#ffe08a', '#d98a1a'], s: .8,  hp: .6,  spd: 1.6, gold: 6,  tip: 'Fast and fragile.' },
  tank:   { name: 'Tank',   c: ['#b9b3d6', '#5a5478'], s: 1.3, hp: 2,   spd: .7,  gold: 10, tip: 'Slow and armored: hits of 3 or more do 1 less.' },
  smart:  { name: 'Smart',  c: ['#c59bff', '#6a35b8'], s: 1,   hp: 1.3, spd: 1,   gold: 8,  tip: 'Adds +6 cost to traps and mines when routing.' },
  charger: { name: 'Charger', c: ['#ff9d5c', '#b5471b'], s: 1.05, hp: 1.2, spd: 1.1, gold: 8, tip: 'Greedy best-first: charges straight at the keep by distance, ignoring costs. Walks into traps and mud.' },
  wanderer: { name: 'Wanderer', c: ['#9be37a', '#3f7a2a'], s: 1, hp: 1.3, spd: .95, gold: 8, tip: 'Depth-first search: finds a path, not the shortest. A long scenic route through your defenses.' },
  scout:   { name: 'Scout',   c: ['#7fd4ff', '#1f6fa8'], s: .9,  hp: .9, spd: 1.25, gold: 7,  tip: 'Uses BFS: fewest steps, ignores costs. Reducers and tolls cannot steer it, so it wades through mud; walls can.' },
  phantom: { name: 'Phantom', c: ['#e0e0ff', '#6e6aa8'], s: 1,   hp: 1.2, spd: 1.05, gold: 9, tip: 'Threat-aware search: routes around cannon and freezer range and traps.' },
  breaker: { name: 'Breaker', c: ['#ffb347', '#a8501a'], s: 1.2, hp: 2,  spd: .85, gold: 12, tip: 'BFS to your nearest defender, then sieges it before moving on.' },
  glitch: { name: 'Glitch', c: ['#7dffb5', '#1a7a4c'], s: .95, hp: 1.4, spd: 1.1, gold: 9, tip: 'Corrupts every node it crosses (+2 cost) until the wave ends.' },
  hydra:        { name: 'Fork Hydra',   c: ['#6be0b0', '#1f6a55'], s: 1.8, hp: 1.6, spd: .6,  gold: 30, tip: 'Recursion: splits into two half-strength hydras when killed, up to two levels deep.' },
  golem:        { name: 'Siege Golem',  c: ['#b0a79a', '#4d463d'], s: 2,   hp: 7,   spd: .5,  gold: 45, tip: 'BFS straight to your nearest defender, then crushes it. Immune to slows.' },
  leaper:       { name: 'Jump Lancer',  c: ['#8ec5ff', '#2a4c9e'], s: 1.7, hp: 4.5, spd: .8,  gold: 40, tip: 'Jump-point leaps: skips 3 nodes ahead every 4 seconds, dodging whatever lies between.' },
  cartographer: { name: 'Cartographer', c: ['#ecc66b', '#7a4a10'], s: 1.9, hp: 5,   spd: .55, gold: 45, tip: 'Rewrites the map at 66% and 33% HP: a mudslide, then a rockfall.' }
};
function waveList(w) {
  const l = [];
  for (let i = 0; i < 2 + Math.round(w * 1.7); i++) { const r = i % 6;       // new enemy types arrive gradually
    l.push(r === 1 && w >= 3 ? 'runner' : r === 4 && w >= 4 ? 'scout' : r === 2 && w >= 5 ? 'glitch' : r === 3 && w >= 4 ? (w >= 7 && i % 12 === 3 ? 'breaker' : 'tank')
      : r === 5 && w >= 6 ? (i % 12 === 5 ? 'smart' : 'phantom') : r === 0 && i > 0 && w >= 4 ? (w >= 7 && i % 12 === 6 ? 'wanderer' : 'charger') : 'grunt'); }
  l.push(...bossesFor(w)); return l;
}
/* Procedural sound: no audio files, just oscillators */
let AC = null, MG = null, musicLevel = 0, step = 0; const lastS = {};
function play(f, d, type = 'square', dl = 0, to = f, vol = .06) {
  const t = AC.currentTime + dl, o = AC.createOscillator(), g = AC.createGain(); o.type = type;
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(MG); o.start(t); o.stop(t + d + .02);
}
const SFX = {
  place: [[440, .08, 'triangle', 0, 660], [660, .1, 'triangle', .07, 880]], err: [[150, .15, 'sawtooth', 0, 100]], hit: [[300, .06, 'square', 0, 120, .04]],
  kill: [[660, .06, 'triangle', 0, 990], [990, .08, 'triangle', .06, 1320]], pew: [[900, .07, 'square', 0, 300, .03]], coin: [[1200, .05, 'triangle', 0, 1500, .04]],
  leak: [[110, .4, 'sawtooth', 0, 40, .1]], boom: [[90, .35, 'sawtooth', 0, 30, .12]], horn: [[220, .45, 'sawtooth', 0, 220, .05], [330, .45, 'sawtooth', .05, 330, .04]],
  fanfare: [[523, .15, 'triangle'], [659, .15, 'triangle', .15], [784, .15, 'triangle', .3], [1047, .45, 'triangle', .45]],
  up: [[523, .08, 'triangle'], [659, .08, 'triangle', .08], [784, .12, 'triangle', .16]]
};
function sfx(k) { if (!AC) return; const n = AC.currentTime; if (lastS[k] > n - .06) return; lastS[k] = n; for (const a of SFX[k]) play(...a); }
addEventListener('pointerdown', () => {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)(); MG = AC.createGain(); MG.connect(AC.destination);
    MG.gain.value = document.getElementById('sound').getAttribute('aria-pressed') === 'true' ? +document.getElementById('vol').value / 100 : 0;
    for (const f of [55, 82.4, 110.3]) {                       // ambient drone
      const o = AC.createOscillator(), g = AC.createGain(), l = AC.createOscillator(), lg = AC.createGain();
      o.frequency.value = f; g.gain.value = .025; l.frequency.value = .1 + f / 900; lg.gain.value = .012; l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(MG); o.start(); l.start();
    }
  } catch (e) {}
});
const BOSSES = ['hydra', 'golem', 'leaper', 'cartographer'], isBoss = t => BOSSES.includes(t);
const BOSS_AT = { 5: ['hydra'], 10: ['golem', 'leaper'], 15: ['cartographer'], 20: ['hydra', 'golem', 'cartographer'] };
const bossesFor = w => w % 5 ? [] : BOSS_AT[(w / 5 - 1) % 4 * 5 + 5];      // endless mode cycles through the four boss waves
const cyc = w => (w - 1) % 6 + 1;                              // events and fog rounds repeat on a 6-wave cycle
const RM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOG_WAVES = [4, 6], EVENT_AT = { 3: 'rockfall', 5: 'mudslide', 6: 'warp' };      // waves 1 and 2 are plain
const DIFFS = {
  relaxed:   { gold: 320, lives: 15, hp: .65, inc: 1.3,  spd: .9 },
  easy:      { gold: 240, lives: 12, hp: .8,  inc: 1.15, spd: 1 },
  normal:    { gold: 200, lives: 10, hp: 1,   inc: 1,    spd: 1 },
  hard:      { gold: 150, lives: 8,  hp: 1.25, inc: .9,  spd: 1.05 },
  nightmare: { gold: 120, lives: 5,  hp: 1.6,  inc: .8,  spd: 1.12 }
};
const EVENT_INFO = { rockfall: ['Rockfall', 'Two nodes collapse into rubble: their edges vanish for this wave.'], mudslide: ['Mudslide', 'Three nodes get +3 cost for this wave.'],
  warp: ['Warp storm', 'A temporary portal links two distant nodes at cost 1. A* falls back to Dijkstra.'] };
const THEMES = {                                              // each map has a biome: palette, ambient particles and music
  dungeon: { name: 'Dungeon', hue: 262, shift: 26, s: 18, l: 34, bg: '#0c0916', moss: 'rgba(90,170,110,.5)', bub: 'rgba(120,220,150,.55)', lightS: 'rgba(130,110,255,.22)', lightE: 'rgba(255,190,90,.22)', vig: 'rgba(4,2,10,.7)', border: '#7d6538', fx: 'embers', fxc: [255, 170, 90], mus: { n: [110, 110, 130.8, 98], w: 'triangle', e: 2 } },
  swamp: { name: 'Swamp', hue: 140, shift: 6, s: 22, l: 30, bg: '#07120c', moss: 'rgba(140,200,80,.5)', bub: 'rgba(170,230,110,.6)', lightS: 'rgba(90,220,140,.22)', lightE: 'rgba(230,220,110,.22)', vig: 'rgba(2,8,4,.72)', border: '#4f7a3a', fx: 'spores', fxc: [160, 230, 120], mus: { n: [98, 92.5, 110, 82.4], w: 'sine', e: 3 } },
  frost: { name: 'Frostbite', hue: 205, shift: -4, s: 28, l: 36, bg: '#07121c', moss: 'rgba(190,230,255,.45)', bub: 'rgba(210,240,255,.6)', lightS: 'rgba(120,200,255,.24)', lightE: 'rgba(200,240,255,.24)', vig: 'rgba(2,6,12,.72)', border: '#4a89b5', fx: 'snow', fxc: [225, 240, 255], mus: { n: [146.8, 174.6, 196, 174.6], w: 'sine', e: 2 } },
  desert: { name: 'Dunes', hue: 36, shift: 3, s: 30, l: 36, bg: '#150f07', moss: 'rgba(200,160,80,.45)', bub: 'rgba(240,200,120,.55)', lightS: 'rgba(255,200,110,.22)', lightE: 'rgba(255,150,70,.24)', vig: 'rgba(12,6,2,.7)', border: '#a8773a', fx: 'sand', fxc: [235, 200, 140], mus: { n: [110, 116.5, 138.6, 116.5], w: 'sawtooth', e: 2 } },
  volcano: { name: 'Magma Keep', hue: 6, shift: -3, s: 34, l: 30, bg: '#170807', moss: 'rgba(255,110,40,.45)', bub: 'rgba(255,150,60,.6)', lightS: 'rgba(255,90,60,.24)', lightE: 'rgba(255,170,60,.26)', vig: 'rgba(14,3,2,.72)', border: '#b24a2a', fx: 'embers', fxc: [255, 110, 50], mus: { n: [82.4, 87.3, 98, 87.3], w: 'sawtooth', e: 1 } },
  circuit: { name: 'Circuit Board', hue: 178, shift: 4, s: 38, l: 24, bg: '#050d12', moss: 'rgba(70,214,196,.4)', bub: 'rgba(90,240,220,.6)', lightS: 'rgba(70,214,196,.24)', lightE: 'rgba(255,90,200,.22)', vig: 'rgba(1,6,10,.72)', border: '#2aa89a', fx: 'binary', fxc: [70, 214, 196], mus: { n: [130.8, 164.8, 196, 246.9], w: 'square', e: 1 } }
};
let THEME = THEMES.dungeon, mt = 0;
setInterval(() => {                                          // layered music: silent in build phase, bass in waves, extra layers for bosses; scale and tempo follow the biome
  if (!AC || !MG || !MG.gain.value || !musicLevel) return; if (++mt % THEME.mus.e) return; step++; const n = THEME.mus.n[step % 4];
  play(n, .25, THEME.mus.w, 0, n, .05); if (musicLevel > 1) { play(n * 2, .12, 'square', 0, n * 2, .025); play(n * 3, .1, 'sawtooth', .12, n * 3, .02); }
}, 120);
document.addEventListener('visibilitychange', () => { if (AC) { if (document.hidden) AC.suspend(); else AC.resume(); } });   // no sound from a background tab
let UID = 0, btSplits = 0;
const hash = (n, k = 0) => { let h = Math.imul(n * 374761393 + k * 668265263 + 1, 1274126177); h ^= h >>> 13; return (h >>> 0) % 1000 / 1000; };
function drawSprite(c, k, cx, cy, T, s = 1, a = 0) {
  c.save(); c.translate(cx, cy); c.scale(s, s); c.lineCap = c.lineJoin = 'round';
  if (k === 'reducer') {
    c.shadowColor = '#46d6c4'; c.shadowBlur = 14; c.strokeStyle = '#46d6c4'; c.lineWidth = 3; c.setLineDash([10, 6]); c.lineDashOffset = -T * 20;
    c.beginPath(); c.arc(0, 0, 25, 0, 7); c.stroke(); c.setLineDash([]); c.lineWidth = 4;
    for (const dy of [-9, 4]) { c.beginPath(); c.moveTo(-10, dy); c.lineTo(0, dy + 9); c.lineTo(10, dy); c.stroke(); }
  } else if (k === 'toll') {
    c.fillStyle = '#7a4e2b'; c.fillRect(-27, -14, 54, 28); c.strokeStyle = '#3d2514'; c.lineWidth = 2;
    for (const y of [-5, 5]) { c.beginPath(); c.moveTo(-27, y); c.lineTo(27, y); c.stroke(); }
    c.fillStyle = '#4a2c16'; c.fillRect(-31, -19, 7, 38); c.fillRect(24, -19, 7, 38);
    const g = c.createRadialGradient(-3, -3, 1, 0, 0, 13); g.addColorStop(0, '#fff3b8'); g.addColorStop(.5, '#ecc66b'); g.addColorStop(1, '#a8741a');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 12, 0, 7); c.fill(); c.strokeStyle = '#5a3f0e'; c.stroke();
    c.fillStyle = '#5a3f0e'; c.font = '700 14px Cinzel,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 0, 1);
  } else if (k === 'barrier') {
    c.shadowColor = '#e8506a'; c.shadowBlur = 16;
    for (const [x, h, w] of [[-14, 26, 9], [14, 30, 10], [0, 40, 12]]) {
      const g = c.createLinearGradient(0, 16 - h, 0, 16); g.addColorStop(0, '#ff9aaa'); g.addColorStop(1, '#8e1c38');
      c.fillStyle = g; c.beginPath(); c.moveTo(x - w, 16); c.lineTo(x - w * .3, 16 - h * .8); c.lineTo(x, 16 - h); c.lineTo(x + w * .5, 16 - h * .7); c.lineTo(x + w, 16); c.closePath(); c.fill();
      c.strokeStyle = '#3a0a18'; c.lineWidth = 2; c.stroke();
    }
  } else if (k === 'trap') {
    c.fillStyle = '#231e30'; c.beginPath(); c.roundRect(-27, -27, 54, 54, 5); c.fill(); c.strokeStyle = '#5b5275'; c.lineWidth = 2; c.stroke();
    for (const x of [-14, 0, 14]) for (const y of [-14, 0, 14]) {
      c.fillStyle = '#d9d6e8'; c.beginPath(); c.moveTo(x - 5, y + 6); c.lineTo(x, y - 7); c.lineTo(x + 5, y + 6); c.fill();
      c.fillStyle = `rgba(232,80,106,${.5 + .4 * Math.sin(T * 4 + x)})`; c.beginPath(); c.moveTo(x - 1.5, y - 2); c.lineTo(x, y - 7); c.lineTo(x + 1.5, y - 2); c.fill();
    }
  } else if (k === 'probe') {
    c.strokeStyle = '#5a361d'; c.lineWidth = 7; c.beginPath(); c.moveTo(8, 8); c.lineTo(22, 22); c.stroke();
    c.fillStyle = 'rgba(236,198,107,.18)'; c.strokeStyle = '#ecc66b'; c.lineWidth = 4; c.beginPath(); c.arc(-4, -4, 15, 0, 7); c.fill(); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(-12, -4); c.lineTo(4, -4); c.moveTo(-4, -12); c.lineTo(-4, 4); c.stroke();
  } else if (k === 'cannon') {
    c.fillStyle = '#3b3556'; c.strokeStyle = '#1a1430'; c.lineWidth = 2; c.beginPath();
    for (let q = 0; q < 6; q++) c.lineTo(Math.cos(q * 1.047) * 24, Math.sin(q * 1.047) * 24); c.closePath(); c.fill(); c.stroke();
    c.rotate(a); c.fillStyle = '#cfc8e8'; c.fillRect(0, -6, 30, 12); c.strokeRect(0, -6, 30, 12);
    c.shadowColor = '#46d6c4'; c.shadowBlur = 12; c.fillStyle = '#46d6c4'; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill();
  } else if (k === 'freezer') {
    c.shadowColor = '#7fd4ff'; c.shadowBlur = 14; c.strokeStyle = '#bfeaff'; c.lineWidth = 3; c.rotate(T * .4);
    for (let q = 0; q < 3; q++) { c.rotate(1.047); c.beginPath(); c.moveTo(-24, 0); c.lineTo(24, 0); c.moveTo(14, 0); c.lineTo(20, -7); c.moveTo(14, 0); c.lineTo(20, 7); c.moveTo(-14, 0); c.lineTo(-20, -7); c.moveTo(-14, 0); c.lineTo(-20, 7); c.stroke(); }
  } else if (k === 'mine') {
    c.strokeStyle = '#2a2638'; c.lineWidth = 4; for (let q = 0; q < 8; q++) { c.beginPath(); c.moveTo(Math.cos(q * .785) * 14, Math.sin(q * .785) * 14); c.lineTo(Math.cos(q * .785) * 24, Math.sin(q * .785) * 24); c.stroke(); }
    const g = c.createRadialGradient(-5, -5, 2, 0, 0, 17); g.addColorStop(0, '#6b6488'); g.addColorStop(1, '#1b1628'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 16, 0, 7); c.fill();
    c.shadowColor = '#ff5a4d'; c.shadowBlur = 12; c.fillStyle = `rgba(255,90,77,${.4 + .6 * Math.abs(Math.sin(T * 3))})`; c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill();
  } else if (k === 'vault') {
    c.fillStyle = '#7a4e2b'; c.strokeStyle = '#3d2514'; c.lineWidth = 2; c.fillRect(-24, -2, 48, 24); c.strokeRect(-24, -2, 48, 24);
    c.beginPath(); c.moveTo(-24, -2); c.quadraticCurveTo(0, -26, 24, -2); c.fill(); c.stroke();
    c.fillStyle = '#ecc66b'; c.fillRect(-24, 6, 48, 4); c.beginPath(); c.arc(0, 8, 6, 0, 7); c.fill(); c.stroke();
    c.shadowColor = '#ecc66b'; c.shadowBlur = 10; c.beginPath(); c.arc(-8, -14 + Math.sin(T * 3) * 2, 4, 0, 7); c.arc(8, -16 + Math.sin(T * 3 + 2) * 2, 4, 0, 7); c.fill();
  } else if (k === 'ab_extract') {
    c.strokeStyle = '#7d6538'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -14); c.lineTo(-14, 10); c.moveTo(0, -14); c.lineTo(14, 10); c.stroke();
    for (const [x, y, col] of [[0, -14, '#e8506a'], [-14, 10, '#46d6c4'], [14, 10, '#46d6c4']]) { c.fillStyle = col; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); }
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(-4, -18); c.lineTo(4, -10); c.moveTo(4, -18); c.lineTo(-4, -10); c.stroke();
  } else if (k === 'ab_rebal') {
    c.strokeStyle = '#ecc66b'; c.lineWidth = 3; c.beginPath(); c.moveTo(-20, -4); c.lineTo(20, -4); c.moveTo(0, -4); c.lineTo(0, 18); c.moveTo(-8, 18); c.lineTo(8, 18); c.stroke(); c.fillStyle = '#46d6c4'; c.beginPath(); c.arc(-14, 4, 8, 0, 7); c.arc(14, 4, 8, 0, 7); c.fill();
  } else if (k === 'ab_flush') {
    c.fillStyle = '#2b2244'; c.strokeStyle = '#7d6538'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.fillRect(-22 + i * 15, 4, 13, 14); c.strokeRect(-22 + i * 15, 4, 13, 14); }
    c.fillStyle = '#ecc66b'; c.beginPath(); c.arc(0, -10, 10, 0, 7); c.fill(); c.fillStyle = '#5a3f0e'; c.font = '700 12px Cinzel,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 0, -9);
  } else if (k === 'ab_spike') {
    c.fillStyle = '#8b5a2b'; c.beginPath(); c.moveTo(0, -20); c.lineTo(16, 4); c.arc(0, 8, 16, 0, Math.PI); c.lineTo(-16, 4); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.font = '800 14px Cinzel,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('+3', 0, 9);
  } else if (k === 'repair') {
    c.shadowColor = '#6df09a'; c.shadowBlur = 12; c.fillStyle = '#6df09a'; c.strokeStyle = '#0f3a22'; c.lineWidth = 2;
    c.fillRect(-6, -20, 12, 40); c.strokeRect(-6, -20, 12, 40); c.fillRect(-20, -6, 40, 12); c.strokeRect(-20, -6, 40, 12); c.fillRect(-5, -5, 10, 10);
  } else if (k === 'upgrade') {
    c.shadowColor = '#6df09a'; c.shadowBlur = 12; c.fillStyle = '#6df09a'; c.strokeStyle = '#0f3a22'; c.lineWidth = 2; c.beginPath();
    c.moveTo(0, -24); c.lineTo(17, -4); c.lineTo(7, -4); c.lineTo(7, 20); c.lineTo(-7, 20); c.lineTo(-7, -4); c.lineTo(-17, -4); c.closePath(); c.fill(); c.stroke();
  } else if (k === 'erase') {
    c.fillStyle = '#8e86aa'; c.strokeStyle = '#3a3452'; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, -8); c.lineTo(14, -8); c.lineTo(11, 18); c.lineTo(-11, 18); c.closePath(); c.fill(); c.stroke();
    c.fillRect(-18, -15, 36, 6); c.strokeRect(-18, -15, 36, 6); c.strokeStyle = '#3a3452'; c.beginPath(); c.moveTo(-4, -3); c.lineTo(-3, 13); c.moveTo(4, -3); c.lineTo(3, 13); c.stroke();
  }
  c.restore();
}
function drawPortal(c, cx, cy, T) {
  c.save(); c.translate(cx, cy); c.shadowColor = '#8f7bff'; c.shadowBlur = 20;
  const g = c.createRadialGradient(0, 0, 2, 0, 0, 30); g.addColorStop(0, '#fff'); g.addColorStop(.35, '#7a63ff'); g.addColorStop(1, 'rgba(30,10,80,.2)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 30, 0, 7); c.fill(); c.lineWidth = 3;
  for (let i = 0; i < 4; i++) { const a = T * (i % 2 ? 1.6 : -1.2) * (1 + i * .3); c.strokeStyle = `hsl(${170 + i * 35} 85% 65%)`; c.beginPath(); c.arc(0, 0, 10 + i * 7, a, a + 3.6); c.stroke(); }
  c.restore();
}
function drawKeep(c, cx, cy, T) {
  c.save(); c.translate(cx, cy + 4);
  c.fillStyle = 'rgba(236,198,107,.18)'; c.beginPath(); c.ellipse(0, 22, 34, 10, 0, 0, 7); c.fill();
  const g = c.createLinearGradient(-20, 0, 20, 0); g.addColorStop(0, '#a29cc0'); g.addColorStop(1, '#5d5780');
  c.fillStyle = g; c.strokeStyle = '#25203a'; c.lineWidth = 2; c.fillRect(-20, -8, 40, 32); c.strokeRect(-20, -8, 40, 32);
  for (const x of [-20, -6, 8]) { c.fillRect(x, -17, 12, 10); c.strokeRect(x, -17, 12, 10); }
  c.fillStyle = '#1a1430'; c.beginPath(); c.arc(0, 14, 7, Math.PI, 0); c.lineTo(7, 24); c.lineTo(-7, 24); c.fill();
  c.fillStyle = '#ecc66b'; c.fillRect(-14, -1, 5, 8); c.fillRect(9, -1, 5, 8);
  c.strokeStyle = '#d9d6e8'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -17); c.lineTo(0, -36); c.stroke();
  c.fillStyle = '#ecc66b'; c.beginPath(); c.moveTo(0, -36); c.lineTo(17 + Math.sin(T * 5) * 2, -32 + Math.sin(T * 4)); c.lineTo(0, -27); c.fill();
  c.restore();
}
function drawEnemy(c, e, T) {
  const ty = TYPES[e.type || 'grunt'], sc = ty.s * (1 - (e.gen || 0) * .22), p = e.pos, b = Math.sin(T * 9 + e.seed) * 2;
  (e.trail || []).forEach((q, i, a) => { c.globalAlpha = i / a.length * .35; c.fillStyle = '#46d6c4'; c.beginPath(); c.arc(q.x, q.y, 4 + i * .7, 0, 7); c.fill(); }); c.globalAlpha = 1;
  c.save(); c.translate(p.x, p.y + b); c.scale(sc * (1 + Math.sin(T * 14 + e.seed) * .04), sc * (1 - Math.sin(T * 14 + e.seed) * .04));
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, 15 - b, 12, 5, 0, 0, 7); c.fill();
  for (const q of [-1, 1]) { c.fillStyle = '#2a1020'; c.beginPath(); c.ellipse(q * 6, 12 - Math.max(0, Math.sin(T * 14 + e.seed + (q > 0 ? 3.14 : 0))) * 4, 4, 2.5, 0, 0, 7); c.fill(); }   // walk cycle
  c.fillStyle = 'rgba(70,214,196,.5)'; c.beginPath(); c.roundRect(-9, -14, 24, 22, 6); c.fill();       // glitch ghost
  const g = c.createLinearGradient(0, -12, 0, 10); g.addColorStop(0, ty.c[0]); g.addColorStop(1, ty.c[1]);
  c.fillStyle = g; c.strokeStyle = '#4a0f1d'; c.lineWidth = 2; c.beginPath(); c.roundRect(-12, -11, 24, 22, 6); c.fill(); c.stroke();
  if (e.flash > 0) { c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.roundRect(-12, -11, 24, 22, 6); c.fill(); }
  c.fillStyle = '#fff'; for (const x of [-5, 5]) { c.beginPath(); c.arc(x, -3, 3.6, 0, 7); c.fill(); }
  c.fillStyle = '#220810'; for (const x of [-4, 6]) { c.beginPath(); c.arc(x, -3, 1.7, 0, 7); c.fill(); }
  c.strokeStyle = '#220810'; c.beginPath(); c.moveTo(-5, 5); c.lineTo(-2, 3); c.lineTo(1, 5); c.lineTo(4, 3); c.lineTo(6, 5); c.stroke();
  if (e.type === 'charger') { c.fillStyle = '#ffe0c0'; for (const q of [-1, 1]) { c.beginPath(); c.moveTo(q * 6, -11); c.lineTo(q * 11, -20); c.lineTo(q * 10, -10); c.fill(); } }
  if (e.type === 'wanderer') { c.strokeStyle = '#6b4a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-14, 12); c.lineTo(-10, -12); c.stroke(); c.fillStyle = '#d9ffc0'; c.beginPath(); c.arc(-10, -13, 3, 0, 7); c.fill(); }
  if (e.type === 'scout') { c.strokeStyle = '#d9f4ff'; c.lineWidth = 2; for (const q of [-1, 1]) { c.beginPath(); c.moveTo(q * 6, -11); c.lineTo(q * 11, -19); c.stroke(); } c.fillStyle = '#d9f4ff'; c.fillRect(-9, -6, 18, 3); }
  if (e.type === 'phantom') { c.strokeStyle = 'rgba(224,224,255,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-8, 11); c.quadraticCurveTo(-4, 20 + Math.sin(T * 6) * 3, 0, 12); c.quadraticCurveTo(4, 4 + Math.sin(T * 6) * 3, 8, 11); c.stroke(); }
  if (e.type === 'breaker') { c.fillStyle = '#6b4a2a'; c.fillRect(10, -4, 4, 18); c.fillStyle = '#9a96b8'; c.fillRect(6, -10, 14, 8); c.strokeStyle = '#2a2640'; c.strokeRect(6, -10, 14, 8); }
  if (e.type === 'glitch') { c.fillStyle = '#d9fff9'; c.fillRect(-12, -5 + Math.sin(T * 20) * 3, 24, 3); }
  if (e.type === 'tank') { c.strokeStyle = '#2a2640'; c.lineWidth = 2; c.strokeRect(-12, -2, 24, 8); c.beginPath(); c.moveTo(0, -2); c.lineTo(0, 6); c.stroke(); }
  if (e.type === 'smart') { c.fillStyle = '#46d6c4'; c.fillRect(-9, -6, 18, 3); c.strokeStyle = '#c59bff'; c.beginPath(); c.moveTo(0, -11); c.lineTo(0, -18); c.stroke(); c.beginPath(); c.arc(0, -19, 2.5, 0, 7); c.fill(); }
  if (e.type === 'hydra') { c.fillStyle = ty.c[0]; c.strokeStyle = '#0f3a30'; c.lineWidth = 2; for (const q of [-8, 0, 8]) { c.beginPath(); c.arc(q, -15 + Math.abs(q) * .3, 5, 0, 7); c.fill(); c.stroke(); } }
  if (e.type === 'golem') { c.fillStyle = '#6d665c'; c.strokeStyle = '#2a2620'; c.lineWidth = 2; c.fillRect(-18, -4, 8, 14); c.strokeRect(-18, -4, 8, 14); c.fillRect(10, -4, 8, 14); c.strokeRect(10, -4, 8, 14); c.fillStyle = '#ff7a3a'; c.fillRect(-6, 3, 12, 3); }
  if (e.type === 'leaper') { c.strokeStyle = '#d9e8ff'; c.lineWidth = 3; c.beginPath(); c.moveTo(-14, 10); c.lineTo(18, -16); c.stroke(); c.fillStyle = '#d9e8ff'; c.beginPath(); c.moveTo(18, -16); c.lineTo(12, -15); c.lineTo(17, -10); c.fill(); }
  if (e.type === 'cartographer') { c.fillStyle = '#ecc66b'; c.beginPath(); c.moveTo(-10, -11); c.lineTo(-10, -20); c.lineTo(-5, -15); c.lineTo(0, -22); c.lineTo(5, -15); c.lineTo(10, -20); c.lineTo(10, -11); c.closePath(); c.fill(); }
  c.restore();
  const bw = 28 * Math.max(1, sc * .9), by = p.y - 25 * sc;
  c.fillStyle = '#000'; c.fillRect(p.x - bw / 2, by, bw, 6); c.fillStyle = '#46d6c4'; c.fillRect(p.x - bw / 2 + 1, by + 1, (bw - 2) * Math.max(0, e.hp) / e.maxHp, 4);
}

