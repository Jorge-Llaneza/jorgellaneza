/* ---------- Tutorial ---------- */
const STEPS = [
  { t: 'Welcome, Warden', x: `Packets pour out of the portal and run for your keep along the cheapest route, the glowing teal line. You can’t block the map for good, but you can change what each path costs. Every tool in this game is a data structure or an algorithm in disguise, and this tour covers them all.` },
  { t: 'Graphs: read the numbers', x: `The map is a weighted graph. The number on a tile is the cost to step onto it, and also how long the step takes: a cost-3 tile takes three times as long to cross as a cost-1 tile, and Dijkstra adds costs up to find the cheapest route. The running total is in Router status.` },
  { t: 'Graphs: cut a fast lane', x: `Weight Reducer is selected. Tap the glowing tile to drop its cost to 1. You just changed an edge weight.`, tool: 'reducer', wait: 'reducer', hi: 'costly' },
  { t: 'Graphs: watch it reroute', x: `The route cost fell. Cheaper edges pull the shortest path toward them, and every packet recomputes its route the moment the graph changes.` },
  { t: 'Graphs: weights are time', x: `Cost is travel time, so the cheapest route is also the fastest walk. Heavy tiles slow packets and light tiles are sprint lanes. A long, heavy route keeps packets under fire for longer, but a Weight Reducer turns a tile into a fast lane. Packets that ignore costs, like Scouts and Chargers, wade straight into mud and slow down. Packets on tiles of cost 3 or more are mired: they take 25% extra damage, and if they die there they drop a mire bonus of 1 extra cycle for every point of cost above 1. So pushing packets onto heavy ground in front of your defenders really pays.` },
  { t: 'Graphs: bait with a trap', x: `Spike Trap is selected. Tap the glowing tile on the route. Packets walk into it only because it sits on the cheapest path.`, tool: 'trap', wait: 'trap', hi: 'route' },
  { t: 'Graphs: walls and tolls', x: `Infinity Edge deletes a node and all its edges (it can never cut the keep off). Toll Bridge adds +3 cost and pays you. Together they push the route where you want it.` },
  { t: 'Graphs: probe, Lens and A*', x: `Dijkstra Probe previews any tile’s path. The Lens button animates the order the search visits nodes. Switch the Router to A* to find the same cost with fewer visits: it adds a distance guess, called a heuristic.` },
  { t: 'Structures: solid defenders', x: `Heap Cannons, Queue Freezers and Cache Vaults are solid. Placing one deletes its node from the graph, so routes bend around it. Packets beside a defender attack it (watch its HP bar), and Repair heals it.` },
  { t: 'Structure: Heap Cannon', x: `A min-heap keeps its smallest item at the root. The cannon shoots the root of a heap of packet HP, so it always picks the weakest target. The heap is drawn beside the map during waves. Tap a cannon again to change its targeting. Place one beside the route.`, tool: 'cannon', wait: 'cannon', soft: true, hi: 'beside' },
  { t: 'Structure: Queue Freezer', x: `A queue serves items first in, first out. The freezer slows everything in range, so packets bunch into a line and your cannons hit them in the order they arrive. Place one near your cannon.`, tool: 'freezer', wait: 'freezer', soft: true, hi: 'beside' },
  { t: 'Structure: the Command Tree', x: `Every defender you place is inserted into a binary search tree keyed by its tile. It is drawn in the Command Tree panel. Deeper nodes relay orders more slowly, and the d number on each tile is its depth. Place defenders in a sorted line and the tree turns into a chain.`, focus: 'ctree' },
  { t: 'Structure: rotate and AVL', x: `Tap a node in the tree, then rotate it to shorten a deep branch. Rotations keep the in-order sequence intact, so it stays a valid BST. The AVL Protocol rebalances automatically on every insert and delete.`, focus: 'ctree', wait: ['rotate', 'avl'], soft: true },
  { t: 'Structure: the B-tree', x: `Switch the Command Tree to a B-tree for 90 cycles. Each node now holds up to 3 towers, and a full node splits and sends its middle tower up, so the tree stays shallow and every leaf is at the same depth. Fewer levels means less lag with many towers, but crowded nodes cost a little signal. Compare it with the AVL tree.`, focus: 'ctree', wait: 'btree', soft: true },
  { t: 'Structure: Cache Vault', x: `A hash table stores each packet in slot id mod size. A collision probes the next slot, and a full table loses the loot. After each wave it pays 3 cycles per stored packet. Upgrading rehashes it into more slots.`, tool: 'vault', wait: 'vault', soft: true },
  { t: 'Structure: the Power Grid (Prim)', x: `Cables link defenders to the keep, and connected defenders get +30% power. Each cable costs 2 cycles per tile, so the cheapest way to connect everything is a minimum spanning tree. Prim’s algorithm builds it by always adding the cheapest edge that reaches a new node. Wire your defenders yourself, then compare your cost with the Prim optimum in the Power grid panel. A perfect grid pays a bonus after each wave; Auto-wire does it for a fee.`, tool: 'cable', focus: 'gridPanel' },
  { t: 'Maps: Floyd-Warshall checkpoints', x: `Maps come in many sizes. On Checkpoint maps such as Crossroads, packets must touch every numbered flag before the keep. Floyd-Warshall computes the shortest distance between every pair of nodes, and packets read that table to pick the cheapest visiting order. Change a weight and watch the table and the route change.`, focus: 'fwPanel' },
  { t: 'Upgrades and repairs', x: `Upgrade raises a tool up to tier 3 for its price × its tier. A tier 2+ Reducer also cuts the cost of neighboring nodes, and upgrading heals solid tools. Repair restores HP for a few cycles.` },
  { t: 'Enemies use algorithms too', x: `Scouts use BFS, so costs can’t steer them. Chargers use greedy search and walk into traps. Wanderers use DFS and take long routes. Phantoms dodge your defenses, Breakers hunt the nearest defender, Hydras split recursively and Lancers leap along their path.` },
  { t: 'Predict, fog and events', x: `Before each wave you predict the route: right answers earn bonus cycles. In fog rounds the route is hidden and a wrong guess gives packets +40% HP. Events (rockfall, mudslide, warp storm) reshape the graph mid-wave, and Glitch packets corrupt the tiles they cross.` },
  { t: 'Puzzle mode', x: `Open Puzzles in the top bar for short challenges, each type with its own rule. Maze Architect asks you to make the cheapest route as costly as possible with a few walls or tolls. Sprint Engineer does the opposite with Weight Reducers. Lure Master bends the route through a glowing zone. Tree Gardener and Rotation Station are about the command tree. Power Engineer is Prim, and Flag Planner uses the Floyd table. Press Submit to lock in your stars; Test wave shows the packets walking your design.` },
  { t: 'Blueprint sketching', x: `Press S or the Blueprint button to doodle on the map where you think packets will walk. Pick a pen, erase, undo or clear. Press Compare to see what share of the real route your sketch passed through, with the true route flashing in gold. In fog rounds the route is hidden, so sketch first and compare after the wave. A sketch that matches 80% earns a small bonus once per wave.` },
  { t: 'Active abilities', x: `The ability bar under the map has four cooldown powers. Extract-min destroys the root of the packet heap, the weakest packet. Rebalance rebuilds your tree and speeds up defenders. Flush cache pays out every vault early. Weight spike (tap a tile) adds +3 cost nearby for 8 seconds, so you can push the route. Hotkeys are Z, X, V and B.` },
  { t: 'Sandbox mode', x: `Pick Sandbox under Setup, Mode for free play: unlimited cycles, no lives, no score and nothing saved. Spawn any enemy, trigger events, jump to any wave number, and use Paint (P) to edit tile costs and Wall (W) to build stone walls. It is the best place to test what each structure and algorithm does.` },
  { t: 'Rewards and the Codex', x: `Wins earn stars, XP and shards for the Armory. The Codex logs each concept by course unit as you meet it, and Trials are optional practice puzzles. Mutators add challenges, for example Tool Limit, which caps how many tools you can place.` },
  { t: 'Send the wave', x: `Hold the keep for 20 waves, with a boss every 5th. You can keep editing while packets run. Press Send wave when ready.` }
];
let si = -1;
function tutShow(i) {
  const s = STEPS[i]; si = i; ui.tut = s || null; $('tut').hidden = !s;
  for (const k in slots) slots[k].classList.toggle('pulse', !!s && k === s.tool);
  document.querySelectorAll('.focus').forEach(el => el.classList.remove('focus')); if (s && s.focus) $(s.focus).classList.add('focus');
  if (!s) { try { localStorage.setItem('pk-tut2', '1'); } catch (e) {} return; }
  if (i === 1) learn('weight');
  $('tutTitle').textContent = s.t; $('tutText').textContent = s.x; $('tutStep').textContent = `${i + 1} of ${STEPS.length}`;
  $('tutBack').hidden = i === 0; $('tut').style.setProperty('--p', (i + 1) / STEPS.length); $('tutNext').hidden = !!s.wait && !s.soft; $('tutNext').textContent = i === STEPS.length - 1 ? 'Begin' : 'Next';
  if (s.tool) selectTool(s.tool);
  if ($('tut').scrollIntoView) $('tut').scrollIntoView({ block: 'nearest' });
}
const onPlaceHook = tool => { learnFrom(tool); if (ui.tut && [].concat(ui.tut.wait).includes(tool)) setTimeout(() => tutShow(si + 1), 600); };
game.onPlace = onPlaceHook; game.onEvent = onGameEvent; fillMaps(); renderAch();
$('quizToggle').onclick = e => { e.target.setAttribute('aria-pressed', e.target.getAttribute('aria-pressed') !== 'true'); savePrefs(); };
$('blind').onclick = e => { game.blind = !game.blind; e.target.setAttribute('aria-pressed', game.blind); };
$('quizGo').onclick = () => { $('quiz').hidden = true; quiz = null; game.startWave(); };
$('pips').innerHTML = '<span></span>'.repeat(WAVES);
$('resAgain').onclick = () => { $('results').hidden = true; startMap(+$('map').value); };
$('resArmory').onclick = () => { $('results').hidden = true; renderArmory(); $('armory').hidden = false; };
$('armoryBtn').onclick = () => { renderArmory(); $('armory').hidden = false; $('armClose').focus(); };
$('armClose').onclick = () => { $('armory').hidden = true; };
refreshMeta(); fillMaps();
$('trialsBtn').onclick = openTrials; $('tClose').onclick = () => { $('trials').hidden = true; }; $('tNext').onclick = nextRound; $('tAgain').onclick = () => startTrial(tr.k); $('tBack').onclick = openTrials;
$('ctSvg').onclick = e => { const el = e.target.closest && e.target.closest('g[data-k]'); if (el) { game.sel = +el.getAttribute('data-k'); ctSig = ''; } };
$('ctL').onclick = () => game.rotate('L'); $('ctR').onclick = () => game.rotate('R'); $('ctBst').onclick = () => game.setKind('bst'); $('ctAvl').onclick = () => game.setKind('avl'); $('ctBt').onclick = () => game.setKind('btree');
document.addEventListener('click', e => { const m = $('setup'); if (m.open && !m.contains(e.target)) m.open = false; });
$('gridAuto').onclick = () => game.autoWire(); $('gridClear').onclick = () => game.clearCables();
$('sbType').innerHTML = Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join('');
$('sbTheme').innerHTML = '<option value="map">Map default</option>' + Object.entries(THEMES).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join(''); $('sbTheme').onchange = applyTheme;
$('sbSpawn').onclick = () => game.spawnNow($('sbType').value, +$('sbCount').value);
$('sbEventGo').onclick = () => { if (game.sandbox) game.applyEvent($('sbEvent').value); }; $('sbEventClear').onclick = () => game.clearEvents();
$('sbWaveGo').onclick = () => { if (game.phase === 'build') { game.wave = Math.max(0, (+$('sbWave').value || 1) - 1); game.say(`The next wave will be wave ${game.wave + 1}.`); } else game.say('Set the wave between waves.', true); };
$('sbClearPk').onclick = () => game.clearPackets(); $('sbClearTools').onclick = () => game.clearTools(); $('sbReset').onclick = () => startMap(+$('map').value);
/* Setup changes never restart a run in progress by accident: they apply on a fresh map, otherwise the player presses Retry. */
const inProgress = () => !game.sandbox && game.wave > 0 && game.phase !== 'lost' && game.phase !== 'won';
function applySetup() {
  if ($('mode').value === 'puzzle' && !game.puzzle) { startMap(0); openPuzzles(); savePrefs(); return; }
  if (!inProgress()) startMap(+$('map').value); else { $('setupHint').hidden = false; $('retry').classList.add('attn'); game.say('Setup changed. Press Retry to restart with the new settings.'); }
  savePrefs();
}
$('mode').onchange = $('diff').onchange = $('mut').onchange = $('map').onchange = applySetup;
let retryArmed = 0;
$('retry').onclick = () => {                                   // restarting a run in progress needs a second click
  if (inProgress() && !retryArmed) { $('retry').textContent = 'Sure?'; retryArmed = setTimeout(() => { retryArmed = 0; $('retry').textContent = 'Retry'; }, 3000); return; }
  clearTimeout(retryArmed); retryArmed = 0; $('retry').textContent = 'Retry'; startMap(+$('map').value);
};
function setVolume() { if (MG) MG.gain.value = $('sound').getAttribute('aria-pressed') === 'true' ? +$('vol').value / 100 : 0; }
$('sound').onclick = () => { $('sound').setAttribute('aria-pressed', $('sound').getAttribute('aria-pressed') !== 'true'); setVolume(); savePrefs(); };
$('vol').oninput = () => { setVolume(); savePrefs(); };
$('tutBack').onclick = () => tutShow(Math.max(0, si - 1));
for (const id of ['armory', 'trials', 'results']) $(id).addEventListener('click', ev => { if (ev.target === $(id)) $(id).hidden = true; });     // click outside to close
const PREF_KEY = 'pk-prefs';
function savePrefs() {
  try { localStorage.setItem(PREF_KEY, JSON.stringify({ mode: $('mode').value, diff: $('diff').value, map: $('map').value, mut: $('mut').value, algo: $('algo').value,
    quiz: $('quizToggle').getAttribute('aria-pressed') === 'true', sound: $('sound').getAttribute('aria-pressed') === 'true', vol: +$('vol').value })); } catch (e) {}
}
function applyPrefs() {                                       // remember the last Setup choices between visits
  let p = {}; try { p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {}; } catch (e) {}
  if (p.mode === 'puzzle') p.mode = 'campaign';
  for (const id of ['mode', 'diff', 'map', 'mut', 'algo']) if (p[id] != null) { const el = $(id), old = el.value; el.value = String(p[id]); if (el.value !== String(p[id])) el.value = old; }
  if (typeof p.quiz === 'boolean') $('quizToggle').setAttribute('aria-pressed', p.quiz); if (typeof p.sound === 'boolean') $('sound').setAttribute('aria-pressed', p.sound);
  if (p.vol !== undefined && +p.vol >= 0 && +p.vol <= 100) $('vol').value = p.vol;
  refreshMeta(); game.algo = $('algo').value; startMap(+$('map').value);
}
applyPrefs();
$('tutNext').onclick = () => tutShow(si + 1);
$('tutSkip').onclick = () => tutShow(99);
$('help').onclick = () => tutShow(0);
let seen; try { seen = localStorage.getItem('pk-tut2'); } catch (e) {}
if (!seen) tutShow(0);

/* ---------- HUD ---------- */
let hudFrame = 0;
function renderHud(T) {
  hudFrame++;
  const g = game, r = g.hide() ? null : g.route, traps = r ? r.path.filter(n => g.graph.mod[n] === 'trap').length : 0;
  $('wave').textContent = ENDLESS ? `${g.wave}` : `${g.wave}/${WAVES}`; musicLevel = g.phase === 'wave' ? (g.queue.some(isBoss) || g.enemies.some(e => isBoss(e.type)) ? 2 : 1) : 0; $('pips').style.display = ENDLESS ? 'none' : ''; [...$('pips').children].forEach((p, i) => p.classList.toggle('on', i < g.wave));
  $('gold').textContent = g.sandbox ? '∞' : g.gold; $('lives').textContent = g.sandbox ? '∞' : g.lives; $('lifebar').style.width = Math.max(0, g.lives / (g.maxLives || 10) * 100) + '%';
  $('routeCost').textContent = r ? r.cost : '–'; $('explored').textContent = r ? r.explored : '–';
  for (const k in abBtns) { abBtns[k].style.setProperty('--cd', g.abil[k] / ABIL[k].cd); abBtns[k].classList.toggle('armed', g.armed === k); }
  renderHeap(g); renderCT(g); renderGrid(g); renderFW(g); renderPuzzle(g); $('qstat').textContent = `${g.qRight}/${g.qTotal}`; $('toolsUsed').textContent = g.capped ? `${g.toolCount()}/${MAP.limit + g.bonusSlots}` : `${g.toolCount()}`; renderPreview(g); $('trapsOn').textContent = traps; $('sum').textContent = r ? r.path.slice(1).map(n => g.graph.weight(n)).join(' + ') + ' = ' + r.cost + `. A normal packet needs about ${(r.cost / SPEED_BASE).toFixed(1)} s to walk it.` : ''; $('recalcs').textContent = g.recalcs;
  const v = $('verdict'); v.classList.toggle('ok', traps > 0);
  v.textContent = !r ? (g.hide() ? 'Fog: the route is hidden. Work it out yourself.' : 'No route to the keep') : traps ? `Lure active: ${traps} trap${traps > 1 ? 's' : ''} on the cheapest route` : 'Route unguarded: no traps on the cheapest path';
  const b = $('startWave'); b.disabled = g.phase === 'wave';
  b.textContent = g.phase === 'build' ? `Send wave ${g.wave + 1}` : g.phase === 'wave' ? 'Wave in progress' : g.phase === 'won' ? 'Play again' : 'Retry';
  if (g.puzzle) { b.textContent = g.phase === 'wave' ? 'Testing...' : 'Test wave'; b.disabled = g.phase === 'wave'; }
  if (g.probe !== null && ui.probeNote) g.say(ui.probeNote);
  for (const k of KEYS) {
    slots[k].classList.toggle('poor', g.gold < TOOLS[k].cost);
    slots[k].classList.toggle('locked', !!g.puzzle && !(k in g.puzzle.limits) && k !== 'erase' && k !== 'probe');
    if ((hudFrame & 3) === 0) { const ic = slots[k].firstChild.getContext('2d'); ic.clearRect(0, 0, 80, 80); drawSprite(ic, k, 40, 42, T, .82); }
  }
}

let last = performance.now(), failures = 0;
(function loop(now) {                                          // one bad frame must never freeze the game: always schedule the next frame
  try {
    const dt = Math.min((now - last) / 1000, .05) * game.speed; last = now;
    game.update(dt); game.draw(); renderHud(now / 1000); failures = 0;
  } catch (e) {
    console.error(e); failures++; last = now;
    if (failures === 1) toast('Something went wrong, but the game is recovering. Press Retry if it looks stuck.');
    if (failures >= 30) { failures = 0; try { startMap(+$('map').value); } catch (e2) { console.error(e2); } }       // self-heal by restarting the map
  }
  requestAnimationFrame(loop);
})(last);
