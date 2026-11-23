/* ---------- Puzzles: short, rule-bound challenges, each type with its own special rule and objective ---------- */
const PUZZLE_TYPES = {
  maze: { name: 'Maze Architect', rule: 'Make the packets\' cheapest route as costly as possible. Walls delete nodes, and the route must stay open.' },
  sprint: { name: 'Sprint Engineer', rule: 'Cut the cheapest route as short as you can with Weight Reducers.' },
  lure: { name: 'Lure Master', rule: 'Bend the cheapest route through the glowing zone. Fewer tools earns more stars.' },
  tree: { name: 'Tree Gardener', rule: 'Place defenders so the command tree gives the strongest signal.' },
  chain: { name: 'Rotation Station', rule: 'Fix a lopsided tree with a limited number of rotations.' },
  power: { name: 'Power Engineer', rule: 'Wire every defender to the keep with the least cable.' },
  order: { name: 'Flag Planner', rule: 'Change weights so packets visit the numbered flags in the target order.' }
};
const PUZZLES = [
  { id: 'gates1', type: 'maze', name: 'Closing Time', map: 'Twin Gates', limits: { barrier: 2 }, targets: [22, 26, 30], goal: 'Place up to 2 Infinity Edges so the cheapest route costs at least 30. The route must stay open.', hint: 'Closing the obvious gate helps a little. Think about where the route has to go next.' },
  { id: 'gates2', type: 'maze', name: 'Gatekeeper', map: 'Twin Gates', limits: { barrier: 3 }, targets: [28, 31, 33], goal: 'Place up to 3 Infinity Edges so the cheapest route costs at least 33.' },
  { id: 'pocket', type: 'maze', name: 'Pocket Maze', map: 'Pocket Fort', limits: { barrier: 3 }, targets: [21, 23, 25], goal: 'On the tiny Pocket Fort, use up to 3 Infinity Edges to push the route cost to 25 or more.' },
  { id: 'citadel', type: 'maze', name: 'Citadel Siege', map: 'Grand Citadel', limits: { barrier: 6 }, targets: [34, 41, 46], goal: 'Use up to 6 Infinity Edges to make the cheapest route through the Grand Citadel cost 46 or more.' },
  { id: 'toll', type: 'maze', name: 'Toll Plaza', map: 'Switchback', limits: { toll: 4 }, targets: [68, 72, 76], goal: 'Place up to 4 Toll Bridges to push the cheapest route to cost 76 or more.', hint: 'A toll only adds cost where packets cannot walk around it. Look for chokepoints.' },
  { id: 'express', type: 'sprint', name: 'Express Lane', map: 'Training Grounds', limits: { reducer: 3 }, targets: [14, 12, 11], goal: 'Place up to 3 Weight Reducers to cut the cheapest route to cost 11 or less.' },
  { id: 'courier', type: 'sprint', name: 'Courier Run', map: 'Mirror Maze', limits: { reducer: 4 }, targets: [18, 16, 15], goal: 'Route the courier fast: use up to 4 Weight Reducers to get the cost down to 15 or less.' },
  { id: 'mud', type: 'lure', name: 'Mud Trap', map: 'Broken Bridges', limits: { barrier: 3, reducer: 3, toll: 3 }, zone: [[4, 2], [5, 2], [6, 2], [6, 1], [7, 1]], need: 5, par: [2, 1], goal: 'Make the cheapest route pass through all 5 glowing zone tiles. One tool earns 3 stars, two tools 2 stars.', hint: 'The route uses the lower gaps. What if they were not an option?' },
  { id: 'garden1', type: 'tree', name: 'Tree Gardener', map: 'Training Grounds', limits: { cannon: 10 }, towers: 10, targets: [66, 76, 82], goal: 'Place 10 Heap Cannons and reach 82% signal. The structure is a plain BST, so the order you place them in matters.', hint: 'Insert the middle tower first, then the middle of each half.' },
  { id: 'garden2', type: 'tree', name: 'Pick Your Tree', map: 'Training Grounds', limits: { cannon: 14, kind: 1 }, towers: 14, targets: [70, 80, 86], goal: 'Place 14 Heap Cannons and reach 86% signal. You may switch the tree structure.', hint: 'A balanced BST tops out near 80%. What holds several towers per node?' },
  { id: 'rotate', type: 'chain', name: 'Rotation Station', map: 'Training Grounds', pre: [0, 1, 2, 3, 4, 5, 6, 60, 61, 62, 63, 64].map(n => ['cannon', n]), limits: { rotate: 9 }, targets: [8, 6, 4], goal: 'The 12 towers form a chain, so the signal is weak. Use at most 9 rotations to bring the tree height down to 4.', hint: 'Rotate left at every second node along the spine, then again on what is left.' },
  { id: 'wire', type: 'power', name: 'Wire the Outpost', map: 'Training Grounds', pre: [1, 8, 14, 52, 66, 59].map(n => ['cannon', n]), limits: { cable: 1 }, goal: 'Wire all 6 defenders to the keep with the least cable. 3 stars for the minimum.', hint: 'Start at the keep and always add the cheapest cable that reaches a new defender. That is Prim.' },
  { id: 'order1', type: 'order', name: 'Flag Order I', map: 'Crossroads', limits: { reducer: 3, toll: 3, barrier: 3 }, target: [1, 2, 3], par: [2, 1], goal: 'Change the weights so packets visit the flags in the order 1, 2, 3. One tool earns 3 stars.' },
  { id: 'order2', type: 'order', name: 'Flag Order II', map: 'Crossroads', limits: { toll: 3 }, target: [2, 1, 3], par: [3, 2], goal: 'Using only Toll Bridges, make packets visit the flags in the order 2, 1, 3.', hint: 'Make the way to flag 1 costly, so the Floyd table prefers flag 2 first.' },
  { id: 'order3', type: 'order', name: 'Flag Order III', map: 'Crossroads', limits: { reducer: 3 }, target: [3, 1, 2], par: [2, 1], goal: 'Using only Weight Reducers, make packets visit the flags in the order 3, 1, 2.' }
];
const COUNTED_TOOLS = ['reducer', 'toll', 'barrier', 'trap', 'cannon', 'freezer', 'mine', 'vault'];
const puzzleUsed = (g, P) => Object.keys(P.limits).filter(k => COUNTED_TOOLS.includes(k)).reduce((s, k) => s + g.graph.mod.filter((m, i) => m === k && !g.fixed.has(i) && !g.graph.locked.has(i) && !g.graph.temp.has(i)).length, 0);
function puzzleEval(g, P) {                                   // returns the live measurement, a status line and the stars earned right now
  const ds = g.defenders(), r = g.route; let value = 0, text = '', stars = 0;
  if (P.type === 'maze') { value = r ? r.cost : 0; stars = P.targets.filter(t => value >= t).length; text = `Route cost ${value}. Star targets: ${P.targets.join(', ')}.`; }
  else if (P.type === 'sprint') { value = r ? r.cost : 999; stars = P.targets.filter(t => value <= t).length; text = `Route cost ${value}. Star targets: ${P.targets.join(', ')} or less.`; }
  else if (P.type === 'lure') { const z = new Set(P.zone.map(([x, y]) => y * COLS + x)), used = puzzleUsed(g, P); value = r ? r.path.filter(n => z.has(n)).length : 0;
    stars = value >= P.need ? (used <= P.par[1] ? 3 : used <= P.par[0] ? 2 : 1) : 0; text = `${value} of ${P.need} zone tiles on the route, using ${used} tool${used === 1 ? '' : 's'}.`; }
  else if (P.type === 'tree') { const sig = ds.length ? Math.round(ds.reduce((s, k) => s + g.eff(k), 0) / ds.length * 100) : 0; value = ds.length >= P.towers ? sig : 0;
    stars = P.targets.filter(t => value >= t).length; text = `${ds.length} of ${P.towers} towers, signal ${sig}%. Star targets: ${P.targets.join('%, ')}%.`; }
  else if (P.type === 'chain') { value = g.kind === 'btree' ? btHeight(g.bt) : ht(g.tree); stars = P.targets.filter(t => value <= t).length; text = `Tree height ${value}, rotations used ${g.rotations} of ${P.limits.rotate}. Star targets: height ${P.targets.join(', ')} or less.`; }
  else if (P.type === 'power') { const gi = g.gridInfo(); value = gi.spent; stars = gi.n > 0 && gi.powered === gi.n ? (gi.optimal ? 3 : gi.spent <= Math.ceil(gi.total * 1.15) ? 2 : 1) : 0; text = `${gi.powered} of ${gi.n} powered. Your cable: ${gi.spent}. Minimum possible: ${gi.total}.`; }
  else if (P.type === 'order') { const pl = g.graph.plan(START, CHECKS), ord = pl ? pl.order.map(c => CHECKS.indexOf(c) + 1) : [], used = puzzleUsed(g, P), ok = ord.join('') === P.target.join('');
    value = ok ? 1 : 0; stars = ok ? (used <= P.par[1] ? 3 : used <= P.par[0] ? 2 : 1) : 0; text = `Packets visit the flags in order ${ord.join(', ')}. Target: ${P.target.join(', ')}. Tools used: ${used}.`; }
  return { value, text, stars };
}
function limitsText(g, P) {
  const parts = []; for (const [k, v] of Object.entries(P.limits)) {
    if (COUNTED_TOOLS.includes(k)) parts.push(`${TOOLS[k].label} ${g.graph.mod.filter((m, i) => m === k && !g.fixed.has(i) && !g.graph.locked.has(i) && !g.graph.temp.has(i)).length}/${v}`);
    else if (k === 'rotate') parts.push(`Rotations ${g.rotations}/${v}`); else if (k === 'kind') parts.push('Structure switching allowed'); else if (k === 'cable') parts.push('Cables allowed');
  } return 'Allowed: ' + parts.join(' · ');
}
function applyPuzzle(g, P) {                                  // puzzles are sandbox rules plus a fixed toolset, fixed pieces and an objective
  g.sandbox = true; g.gold = 1e6; g.tool = 'cannon';
  for (const [tool, n] of P.pre || []) { g.tool = tool; g.place(n); if (g.graph.mod[n]) g.fixed.add(n); }
  g.puzzle = P; g.tool = Object.keys(P.limits).find(k => TOOLS[k]) || 'erase';
}
/* ---------- UI wiring ---------- */
const ui = { msg: document.getElementById('msg'), probeNote: '', tut: null };
const $ = id => document.getElementById(id);
MAP = MAPS[0]; let game = new Game($('grid'));
const KEYS = Object.keys(TOOLS), slots = {};
KEYS.forEach((key, i) => {
  const t = TOOLS[key], b = document.createElement('button');
  b.className = 'slot panel'; b.dataset.tool = key; b.title = t.desc; b.setAttribute('aria-label', `${t.label}. ${t.desc}`);
  b.innerHTML = `<canvas width="80" height="80"></canvas><span class="nm">${t.label}</span><span class="hk">${i < 9 ? i + 1 : i === 9 ? 0 : key === 'repair' ? 'R' : key === 'cable' ? 'C' : key === 'paint' ? 'P' : key === 'wall' ? 'W' : 'U'}</span><span class="cost">${t.cost || (key === 'upgrade' ? 'scales' : key === 'repair' ? 'varies' : key === 'cable' ? '2 per tile' : 'free')}</span>`;
  b.onclick = () => selectTool(key); slots[key] = b; $('toolbar').append(b);
});
const abBtns = {};
for (const [k, A] of Object.entries(ABIL)) {
  const b = document.createElement('button'); b.className = 'abtn panel'; b.title = A.desc; b.setAttribute('aria-label', `${A.name}, key ${A.key.toUpperCase()}. ${A.desc}`);
  b.innerHTML = `<canvas width="68" height="68"></canvas><span><b>${A.name}</b><small>${A.key.toUpperCase()} · ${A.cd}s</small></span><i class="cd"></i>`;
  b.onclick = () => game.useAbility(k); abBtns[k] = b; $('abilities').append(b); drawSprite(b.firstChild.getContext('2d'), 'ab_' + k, 34, 34, 0, 1);
}
function selectTool(key) {
  game.tool = key; if (key !== 'probe') game.probe = null;
  for (const k in slots) slots[k].setAttribute('aria-pressed', k === key);
  $('toolDesc').textContent = TOOLS[key].desc;
}
selectTool('reducer');
addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName || '')) return;
  if (e.key === 'Escape') { game.armed = null; if (game.sketching) setSketching(false); for (const id of ['armory', 'trials', 'results']) $(id).hidden = true; return; }
  if (e.key === 'n') { $('startWave').click(); return; }
  if (e.key === 's') { setSketching(!game.sketching); return; }
  const ab = Object.keys(ABIL).find(a => ABIL[a].key === e.key); if (ab) { game.useAbility(ab); return; }
  const k = e.key === '0' ? KEYS[9] : e.key === 'u' ? 'upgrade' : e.key === 'r' ? 'repair' : e.key === 'c' ? 'cable' : (e.key === 'p' && SANDBOX) ? 'paint' : (e.key === 'w' && SANDBOX) ? 'wall' : KEYS[+e.key - 1]; if (k) selectTool(k);
});

const nodeAt = e => {
  const r = game.cv.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * COLS), y = Math.floor((e.clientY - r.top) / r.height * ROWS);
  return x >= 0 && x < COLS && y >= 0 && y < ROWS ? y * COLS + x : null;
};
game.cv.addEventListener('pointermove', e => game.hover = nodeAt(e));
game.cv.addEventListener('pointerleave', () => game.hover = null);
const canvasAct = n => {
  if (game.sketching) return;                                  // blueprint mode: the pointer draws instead of placing tools
  if (game.armed === 'spike') { game.fireSpike(n); return; }
  if (quiz && !quiz.done) { if (quiz.type === 'tile') answerQuiz(n); else game.say('Answer the question first.', true); return; }
  if (game.tool === 'probe') learn('sssp'); game.place(n); };
game.cv.addEventListener('click', e => { const n = nodeAt(e); if (n !== null) canvasAct(n); });
game.cv.addEventListener('keydown', e => {                    // keyboard play: arrows move the cursor, Enter or Space acts
  const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS }[e.key], h = game.hover ?? START;
  if (d) { const n = h + d; if (n >= 0 && n < COLS * ROWS && !(Math.abs(d) === 1 && (n / COLS | 0) !== (h / COLS | 0))) game.hover = n; e.preventDefault(); }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); canvasAct(h); }
});
$('algo').onchange = e => { game.algo = e.target.value; if (game.algo === 'astar') learn('heur'); savePrefs(); };
$('startWave').onclick = () => { if (game.puzzle) { if (game.phase === 'build') game.spawnNow('grunt', 6); return; } if (game.phase === 'lost' || game.phase === 'won') { startMap(+$('map').value); return; } if (quiz || game.phase !== 'build') return; if (!game.sandbox && (quizOn() || game.hide())) startQuiz(); else game.startWave(); learn('sssp'); };
document.querySelectorAll('.speed button').forEach(b => b.onclick = () => {
  game.speed = +b.dataset.speed;
  document.querySelectorAll('.speed button').forEach(x => x.setAttribute('aria-pressed', x === b));
});

/* ---------- Blueprint: freehand sketching over the map, to mark where you think the packets will go ---------- */
let sketchDrawing = false;
const canvasPt = e => { const r = $('grid').getBoundingClientRect(); return [(e.clientX - r.left) / r.width * COLS * CELL, (e.clientY - r.top) / r.height * ROWS * CELL]; };
function setSketching(on) {
  game.sketching = on; $('grid').classList.toggle('sketching', on); $('sketchBar').hidden = !on; $('blueprintBtn').setAttribute('aria-pressed', on); if (on) game.armed = null;
  game.say(on ? 'Blueprint on: drag across the map to sketch where you think packets will walk. Tools are paused. Press S to leave.' : 'Blueprint off.');
}
$('grid').addEventListener('pointerdown', e => { if (!game.sketching) return; sketchDrawing = true; try { $('grid').setPointerCapture(e.pointerId); } catch (err) {} game.beginStroke(...canvasPt(e)); e.preventDefault(); });
$('grid').addEventListener('pointermove', e => { if (game.sketching && sketchDrawing) game.extendStroke(...canvasPt(e)); });
for (const ev of ['pointerup', 'pointercancel']) $('grid').addEventListener(ev, () => { if (sketchDrawing) { sketchDrawing = false; game.endStroke(); } });
$('blueprintBtn').onclick = () => setSketching(!game.sketching);
document.querySelectorAll('#sketchBar [data-pen]').forEach(b => b.onclick = () => { game.pen = b.dataset.pen; game.eraser = false; $('skErase').setAttribute('aria-pressed', false); });
$('skErase').onclick = () => { game.eraser = !game.eraser; $('skErase').setAttribute('aria-pressed', game.eraser); };
$('skUndo').onclick = () => game.undoStroke(); $('skClear').onclick = () => game.clearSketch(); $('skCompare').onclick = () => game.compareSketch();
/* ---------- Maps, saves, achievements ---------- */
/* Saved progress is versioned and validated, so a future change (or a hand-edited or corrupt save) cannot break the game. */
const SAVE_VERSION = 2, SAVE_KEY = 'pk-save';
const saveDefaults = () => ({ v: SAVE_VERSION, cleared: [], ach: [], xp: 0, shards: 0, perks: {}, wins: 0, streak: 0, lastDaily: '', stars: {}, bestScore: {}, trials: {}, puzzles: {}, best: 0 });
function migrateSave(raw) {
  const s = saveDefaults(); if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return s;
  const num = (x, max = 1e9) => Math.min(max, Math.max(0, Math.floor(+x) || 0)), obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
  for (const k of ['xp', 'shards', 'wins', 'streak', 'best']) s[k] = num(raw[k]);                // v1 saves had no version field but the same shape
  s.cleared = (Array.isArray(raw.cleared) ? raw.cleared : []).filter(Number.isInteger); s.ach = (Array.isArray(raw.ach) ? raw.ach : []).filter(x => typeof x === 'string');
  s.lastDaily = typeof raw.lastDaily === 'string' ? raw.lastDaily : '';
  for (const [k, v] of Object.entries(obj(raw.perks))) if (PERKS[k]) s.perks[k] = Math.min(PERKS[k][2], num(v));                // drop unknown perks, clamp levels
  for (const [k, v] of Object.entries(obj(raw.stars))) s.stars[k] = Math.min(3, num(v));
  for (const [k, v] of Object.entries(obj(raw.trials))) s.trials[k] = Math.min(3, num(v));
  for (const [k, v] of Object.entries(obj(raw.puzzles))) if (PUZZLES.some(p => p.id === k)) s.puzzles[k] = Math.min(3, num(v));
  for (const [k, v] of Object.entries(obj(raw.bestScore))) s.bestScore[k] = num(v);
  return s;
}
function loadSave() {
  try { const txt = localStorage.getItem(SAVE_KEY); return txt ? migrateSave(JSON.parse(txt)) : saveDefaults(); }
  catch (e) { try { localStorage.setItem(SAVE_KEY + '-corrupt', localStorage.getItem(SAVE_KEY)); } catch (e2) {} return saveDefaults(); }      // keep a copy of an unreadable save
}
let save = loadSave();
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };
const ACH = { kill: ['First Blood', 'Destroy a packet.'], tier3: ['Master Smith', 'Upgrade a tool to tier 3.'], boss: ['Boss Slayer', 'Defeat the boss.'],
  flawless: ['Flawless Keep', 'Win a map without a single leak.'], arborist: ['Arborist', 'Earn three stars in all four tree trials.'], polymath: ['Polymath', 'Earn three stars in every trial.'], oracle: ['Oracle', 'Predict correctly three times in a row.'], fogwalker: ['Fog Walker', 'Predict a fog round correctly.'], architect: ['Architect', 'Solve a Maze Architect puzzle.'], puzzler: ['Puzzle Master', 'Earn three stars on every puzzle.'], surveyor: ['Surveyor', 'Sketch a blueprint that matches 80% of the real route.'], cartographer: ['Cartographer', 'Clear every map.'] };
function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
function renderAch() { $('ach').innerHTML = Object.entries(ACH).map(([k, [n, d]]) => `<li class="${save.ach.includes(k) ? 'on' : ''}"><b>${n}</b><span>${d}</span></li>`).join(''); }
function unlock(k) { if (save.ach.includes(k)) return; save.ach.push(k); persist(); renderAch(); toast(`Achievement: ${ACH[k][0]}`); }
function fillMaps() { const s = $('map'), v = s.value || 0; s.innerHTML = MAPS.map((m, i) => m.hidden ? '' : `<option value="${i}">${'★'.repeat(save.stars[i] || 0)}${'☆'.repeat(3 - (save.stars[i] || 0))} ${m.name} (${THEMES[m.theme].name})</option>`).join(''); s.value = v; }
function onGameEvent(ev) {
  if (game.sandbox && !ev.startsWith('seen:')) return;                      // sandbox earns nothing
  if (ev === 'lost') { if (ENDLESS) { save.best = Math.max(save.best || 0, game.wave); persist(); } setTimeout(() => showResults(false), 1600); return; }
  if (ev.startsWith('seen:')) { const k = { hydra: 'recursion', leaper: 'jps', golem: 'nearest', cartographer: 'dynamic', scout: 'bfs', phantom: 'threat', breaker: 'nearest', wanderer: 'dfs', charger: 'greedy' }[ev.slice(5)]; if (k) learn(k); return; }
  if (ev === 'kill' || ev === 'boss') unlock('kill'); if (ev === 'boss') unlock('boss'); if (ev === 'tier3') unlock('tier3'); if (ev === 'sketch80') unlock('surveyor');
  if (ev === 'won') { const i = MAPS.indexOf(MAP); if (!save.cleared.includes(i)) save.cleared.push(i); if (game.leaks === 0) unlock('flawless'); if (save.cleared.length === MAPS.length) unlock('cartographer'); persist(); fillMaps(); setTimeout(() => showResults(true), 1800); }
}
function applyTheme() { const sel = $('sbTheme').value; THEME = THEMES[SANDBOX && THEMES[sel] ? sel : (MAP.theme || 'dungeon')]; $('grid').style.borderColor = THEME.border; }
function startMap(i) {
  const mode = $('mode').value; let seed = 0;
  if (mode === 'daily') { const d = new Date(); seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); const vis = MAPS.map((m, k) => k).filter(k => !MAPS[k].hidden); i = vis[seed % vis.length]; $('map').value = i; }
  if (mode === 'puzzle') { if (!ACTIVE_PUZZLE) ACTIVE_PUZZLE = PUZZLES[0]; i = MAPS.findIndex(m => m.name === ACTIVE_PUZZLE.map); }
  SANDBOX = mode === 'sandbox' || mode === 'puzzle'; ENDLESS = mode === 'endless' || SANDBOX; MAP = MAPS[i]; COLS = MAP.cols || 10; ROWS = MAP.rows || 7; START = MAP.start[1] * COLS + MAP.start[0]; EXIT = MAP.exit[1] * COLS + MAP.exit[0];
  CHECKS = (MAP.checks || []).map(([x, y]) => y * COLS + x); fwVer = -1; gridSig = ''; ctSig = ''; hpSig = '';
  applyTheme(); const cv = $('grid'); cv.width = COLS * CELL; cv.height = ROWS * CELL; if (cv.parentElement && cv.parentElement.style && cv.parentElement.style.setProperty) cv.parentElement.style.setProperty('--ar', COLS / ROWS);
  if (CHECKS.length) learn('floyd');
  const prev = game, D = DIFFS[$('diff').value];
  game = new Game($('grid')); game.tool = prev.tool; game.algo = $('algo').value; game.lens = prev.lens; game.blind = prev.blind; game.seed = seed; game.sandbox = SANDBOX; if (mode === 'puzzle') applyPuzzle(game, ACTIVE_PUZZLE);
  game.gold = D.gold; game.lives = game.maxLives = D.lives; game.hpMul = D.hp; game.inc = D.inc; game.spdMul = D.spd;
  const pk = save.perks, mut = $('mut').value;                       // permanent perks and the chosen mutator
  game.gold += (pk.gold || 0) * 25; game.lives = game.maxLives = D.lives + (pk.life || 0); game.bonusSlots = pk.tools || 0; game.capped = mut === 'frugal';
  game.disc = pk.disc || 0; game.dmgMul = 1 + .08 * (pk.dmg || 0); HPMUL = (1 + .12 * (pk.hp || 0)) * (mut === 'glass' ? .5 : 1);
  game.avl = !!pk.avl; game.kind = game.avl ? 'avl' : 'bst'; game.mut = mut; if (mut === 'fog') { game.blind = true; $('blind').setAttribute('aria-pressed', 'true'); } game.onPlace = onPlaceHook; game.onEvent = onGameEvent;
  $('sketchBar').hidden = true; $('grid').classList.remove('sketching'); $('blueprintBtn').setAttribute('aria-pressed', false); $('setupHint').hidden = true; $('retry').classList.remove('attn'); document.body.classList.toggle('sandbox', mode === 'sandbox'); $('sandbox').hidden = mode !== 'sandbox'; $('puzzlePanel').hidden = mode !== 'puzzle'; $('pzNext').hidden = true; pzDone = 0;
  quiz = null; $('quiz').hidden = true; game.banner = { text: mode === 'daily' ? 'Daily challenge' : SANDBOX ? 'Sandbox: ' + MAP.name : MAP.name, life: 2.6 };
  game.say(`${MAP.name} (${THEME.name}). ${MAP.note}${game.capped ? ` Tool limit: ${MAP.limit + game.bonusSlots}.` : ''}`);
}
let pv = '';
function renderPreview(g) {
  const w = g.phase === 'build' ? g.wave + 1 : g.wave; let html = '';
  if (!g.sandbox && (g.phase === 'build' || g.phase === 'wave')) {
    const ev = g.sandbox ? null : EVENT_AT[cyc(w)], extra = (ev ? `<p class="evt"><b>Event: ${EVENT_INFO[ev][0]}.</b> ${EVENT_INFO[ev][1]}</p>` : '') + (g.hide() ? '<p class="evt fog"><b>Fog round.</b> The route is hidden. Predict its cost, or packets gain 40% HP.</p>' : '');
    const cnt = {}; waveList(w).forEach(t => cnt[t] = (cnt[t] || 0) + 1);
    html = `<h2>${g.phase === 'build' ? 'Next' : 'Current'}: wave ${w}</h2><ul>` + Object.entries(cnt).map(([t, n]) => `<li><i style="background:${TYPES[t].c[0]}"></i><b>${n}× ${TYPES[t].name}</b><span>${TYPES[t].tip}</span></li>`).join('') + '</ul>' + extra;
  }
  if (html !== pv) { pv = html; $('preview').innerHTML = html; }
}

/* ---------- Prediction quiz ---------- */
let quiz = null;
const quizOn = () => $('quizToggle').getAttribute('aria-pressed') === 'true';
const shuffle = a => a.sort(() => Math.random() - .5);
function startQuiz() {
  const g = game, r = g.route; if (!r) { g.startWave(); return; }
  const w = g.wave + 1, fog = g.hide(), type = fog || w % 2 ? 'cost' : 'tile';
  quiz = { type, fog, ans: type === 'cost' ? r.cost : r.path[1], sum: r.path.slice(1).map(n => g.graph.weight(n)).join(' + ') + ' = ' + r.cost, done: false };
  $('quiz').hidden = false; if ($('quiz').scrollIntoView) $('quiz').scrollIntoView({ block: 'nearest' }); $('quizGo').hidden = true; $('quizFb').textContent = ''; $('quizOpts').innerHTML = '';
  $('quizTitle').textContent = fog ? 'Fog round: predict the route cost' : 'Predict before the wave';
  if (type === 'cost') {
    $('quizText').textContent = 'What is the total cost of the cheapest route from the portal to the keep?';
    const opts = shuffle([r.cost - 3, r.cost - 2, r.cost - 1, r.cost + 1, r.cost + 2, r.cost + 3].filter(v => v > 0)).slice(0, 3).concat(r.cost);
    shuffle(opts).forEach(v => { const b = document.createElement('button'); b.textContent = v; b.onclick = () => answerQuiz(v); $('quizOpts').append(b); });
  } else $('quizText').textContent = 'Tap the tile the packets step onto first.';
}
function answerQuiz(v) {
  if (!quiz || quiz.done) return; quiz.done = true; const g = game, ok = v === quiz.ans; g.qTotal++;
  $('quizOpts').querySelectorAll('button').forEach(b => b.disabled = true);
  if (ok) {
    g.qRight++; g.streak++; const bonus = (quiz.fog ? 25 : 15) + Math.min(g.streak, 5) * 2; g.gold += bonus; sfx('coin');
    $('quizFb').textContent = `Correct! +${bonus} cycles.`; if (g.streak >= 3) unlock('oracle'); if (quiz.fog) unlock('fogwalker');
  } else {
    g.streak = 0; sfx('err'); g.hl = quiz.type === 'tile' ? quiz.ans : null;
    $('quizFb').textContent = (quiz.type === 'cost' ? `Not quite. The cheapest route costs ${quiz.ans}: ${quiz.sum}.` : 'Not quite. The highlighted tile is the first step of the cheapest route.') + (quiz.fog ? ' The fog curses this wave: +40% packet HP.' : '');
    if (quiz.fog) g.curse = true;
  }
  $('quizGo').hidden = false;
}

/* ---------- Progression: score, stars, XP, shards, armory, mutators ---------- */
const need = l => 150 + 90 * l;                                    // XP to climb from level l to l+1
function lvlInfo(xp) { let l = 1; while (xp >= need(l)) { xp -= need(l); l++; } return { l, cur: xp, need: need(l) }; }
const TITLES = ['Novice Router', 'Edge Cutter', 'Path Finder', 'Graph Whisperer', 'Dijkstra Disciple', 'Heap Master', 'Keeper of the Keep', 'Warden Supreme'];
const title = l => TITLES[Math.min(TITLES.length - 1, l - 1)];
const MUTS = { none: { name: 'No mutator', mul: 1, lvl: 1 }, glass: { name: 'Glass Cannons: tower HP -50%', mul: 1.4, lvl: 2 },
  frugal: { name: 'Tool Limit: capped tools per map', mul: 1.3, lvl: 3 }, fog: { name: 'Fogbound: route always hidden', mul: 1.5, lvl: 4 } };
const DIFF_MUL = { relaxed: .6, easy: .8, normal: 1, hard: 1.3, nightmare: 1.7 };
function refreshMeta() {
  const L = lvlInfo(save.xp); $('lvlNum').textContent = L.l; $('lvlChip').title = `${title(L.l)}: ${L.cur}/${L.need} XP`; $('xpbar').style.width = L.cur / L.need * 100 + '%'; $('shards').textContent = save.shards;
  const s = $('mut'), v = s.value || 'none';
  s.innerHTML = Object.entries(MUTS).map(([k, m]) => `<option value="${k}" ${m.lvl > L.l ? 'disabled' : ''}>${m.name}${m.mul > 1 ? ` (x${m.mul} rewards)` : ''}${m.lvl > L.l ? ` [Lv ${m.lvl}]` : ''}</option>`).join('');
  s.value = MUTS[v] && MUTS[v].lvl <= L.l ? v : 'none';
}
function renderArmory() {
  $('armShards').textContent = save.shards; const ul = $('perks'); ul.innerHTML = '';
  for (const [k, [n, d, mx, bc]] of Object.entries(PERKS)) {
    const lv = save.perks[k] || 0, cost = bc * (lv + 1), li = document.createElement('li'), b = document.createElement('button');
    li.innerHTML = `<span><b>${n}</b> <small>Lv ${lv}/${mx}</small><br><small>${d} per level</small></span>`;
    b.textContent = lv >= mx ? 'Maxed' : `Buy ${cost}`; b.disabled = lv >= mx || save.shards < cost;
    b.onclick = () => { save.shards -= cost; save.perks[k] = lv + 1; persist(); sfx('coin'); refreshMeta(); renderArmory(); toast(`${n} is now level ${lv + 1}. It applies to your next run.`); };
    li.append(b); ul.append(li);
  }
}
function countUp(el, to, ms = 1100) { const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / ms); el.textContent = Math.round(to * k); if (k < 1) requestAnimationFrame(f); })(t0); }
function showResults(win) {
  const g = game, mapI = MAPS.indexOf(MAP), diff = $('diff').value, dm = DIFF_MUL[diff], mm = MUTS[g.mut || 'none'].mul;
  const cleared = win ? (ENDLESS ? g.wave : WAVES) : Math.max(0, g.wave - 1);
  const lines = [['Waves cleared', cleared * 100], ['Packets destroyed', g.kills * 10], ['Keep integrity', Math.round(Math.max(0, g.lives) / g.maxLives * 300)], ['Correct predictions', g.qRight * 25]];
  if (win && g.leaks === 0) lines.push(['Flawless bonus', 500]);
  const score = Math.round(lines.reduce((s, l) => s + l[1], 0) * dm * mm);
  const stars = ENDLESS ? (g.wave >= 30 ? 3 : g.wave >= 20 ? 2 : g.wave >= 10 ? 1 : 0) : win ? (g.leaks === 0 ? 3 : g.lives / g.maxLives >= .6 ? 2 : 1) : 0;
  const prevStreak = save.streak || 0, sm = win ? 1 + Math.min(.5, prevStreak * .1) : 1; save.streak = win ? prevStreak + 1 : 0; if (win) save.wins = (save.wins || 0) + 1;
  let shards = Math.round((cleared * 2 + g.kills * .3 + (win ? 40 : 0) + stars * 15) * dm * mm * sm);
  const today = new Date().toISOString().slice(0, 10), news = [];
  if (save.lastDaily !== today) { save.lastDaily = today; shards += 20; news.push('Daily reward: +20 shards'); }
  if (win && prevStreak) news.push(`Win streak ${prevStreak + 1}: +${Math.round((sm - 1) * 100)}% shards`);
  if (win && stars < 3 && g.leaks > 0 && g.leaks <= 3) news.push(`Only ${g.leaks} leak${g.leaks > 1 ? 's' : ''} away from a perfect run!`);
  const xp = Math.round(score / 14), L0 = lvlInfo(save.xp).l; save.xp += xp; save.shards += shards;
  const L1 = lvlInfo(save.xp); const ups = []; for (let l = L0 + 1; l <= L1.l; l++) { ups.push(`Level ${l}: ${title(l)}`); const m = Object.values(MUTS).find(q => q.lvl === l); if (m) ups.push(`Unlocked mutator: ${m.name}`); } news.unshift(...ups);
  save.stars[mapI] = Math.max(save.stars[mapI] || 0, stars);
  const key = `${mapI}-${diff}-${$('mode').value}`, prevBest = save.bestScore[key] || 0; save.bestScore[key] = Math.max(prevBest, score); persist(); refreshMeta(); fillMaps();
  const aff = Object.entries(PERKS).find(([k, p]) => (save.perks[k] || 0) < p[2] && save.shards >= p[3] * ((save.perks[k] || 0) + 1)), nm = Object.values(MUTS).find(m => m.lvl > L1.l);
  $('resTitle').textContent = win ? 'Keep defended!' : ENDLESS ? `Fell on wave ${g.wave}` : 'The keep has fallen';
  $('stars').innerHTML = [0, 1, 2].map(i => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${.4 + i * .35}s">★</span>`).join('');
  $('resLines').innerHTML = lines.map((l, i) => `<li style="animation-delay:${i * .12}s"><span>${l[0]}</span><b>${l[1]}</b></li>`).join('') + (dm * mm !== 1 ? `<li><span>Difficulty and mutator</span><b>x${(dm * mm).toFixed(2)}</b></li>` : '');
  countUp($('resScore'), score); countUp($('resShards'), shards); countUp($('resXp'), xp);
  $('resBest').textContent = score > prevBest ? 'New best!' : `Best ${prevBest}`;
  $('resLvl').textContent = `${L1.l} ${title(L1.l)}`; $('resBar').style.width = L1.cur / L1.need * 100 + '%';
  $('resNew').innerHTML = news.map(n => `<li>${n}</li>`).join('');
  $('resNext').textContent = aff ? `You can afford ${aff[1][0]} in the Armory.` : nm ? `Reach level ${nm.lvl} to unlock a new mutator. ${L1.need - L1.cur} XP to go.` : `${L1.need - L1.cur} XP to the next level.`;
  $('resAgain').textContent = win ? 'Play again' : 'Try again'; $('results').hidden = false; $('resAgain').focus(); sfx(win ? 'fanfare' : 'boom');
}

