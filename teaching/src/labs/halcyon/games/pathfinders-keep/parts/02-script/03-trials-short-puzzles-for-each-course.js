/* ---------- Trials: short puzzles for each course unit (recursion, graphs, trees, heaps, hashing) ---------- */
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickN = (arr, n) => shuffle([...arr]).slice(0, n);
const keysOf = n => pickN(Array.from({ length: 40 }, (_, i) => i + 1), n);
const ins = (t, k) => !t ? { k } : k < t.k ? { ...t, l: ins(t.l, k) } : { ...t, r: ins(t.r, k) };
const ht = t => t ? 1 + Math.max(ht(t.l), ht(t.r)) : 0;
const bf = t => ht(t.l) - ht(t.r);                                                      // AVL balance factor
const inord = t => t ? [...inord(t.l), t.k, ...inord(t.r)] : [];
const pre = t => t ? [t.k, ...pre(t.l), ...pre(t.r)] : [];
const post = t => t ? [...post(t.l), ...post(t.r), t.k] : [];
const level = t => { const o = [], q = t ? [t] : []; while (q.length) { const n = q.shift(); o.push(n.k); if (n.l) q.push(n.l); if (n.r) q.push(n.r); } return o; };
const up = a => { a = [...a]; let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[i] < a[p]) { [a[i], a[p]] = [a[p], a[i]]; i = p; } else break; } return a; };   // sift-up
const popMin = a => { a = [...a]; a[0] = a.pop(); let i = 0; for (;;) { let m = i; for (const c of [2 * i + 1, 2 * i + 2]) if (c < a.length && a[c] < a[m]) m = c; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } return a; };   // sift-down
const heapOf = ks => ks.reduce((a, k) => up([...a, k]), []);
const heapTree = (a, i = 0) => i < a.length ? { k: a[i], l: heapTree(a, 2 * i + 1), r: heapTree(a, 2 * i + 2) } : null;
const arr = a => `[${a.join(', ')}]`;
function drawTree(t, hl = {}, showBf = false, opt = {}) {
  const pos = new Map(); let i = 0; (function f(n, d) { if (!n) return; f(n.l, d + 1); pos.set(n, { x: i++ * 46 + 24, y: d * 54 + 24 }); f(n.r, d + 1); })(t, 0);
  let s = ''; for (const [n, p] of pos) for (const c of [n.l, n.r]) if (c) { const q = pos.get(c); s += `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`; }
  for (const [n, p] of pos) s += `<g class="${hl[n.k] || ''}" ${opt.click ? `data-k="${n.k}"` : ''}><circle cx="${p.x}" cy="${p.y}" r="17"/><text x="${p.x}" y="${p.y + 5}" ${opt.label ? 'style="font-size:11px"' : ''}>${opt.label ? opt.label(n.k) : n.k}</text>${showBf ? `<text class="bf" x="${p.x + 20}" y="${p.y - 12}">${bf(n)}</text>` : ''}</g>`;
  return `<svg viewBox="0 0 ${i * 46 + 4} ${ht(t) * 54 + 2}" class="tree" role="img" aria-label="Binary tree">${s}</svg>`;
}
function mk(html, correct, wrong, why, label = String) {                              // build 4 unique options, shuffled
  const set = [correct]; for (const w of wrong) if (!set.some(s => label(s) === label(w))) set.push(w);
  const opts = shuffle(set.slice(0, 4)); return { html, opts: opts.map(label), ans: opts.indexOf(correct), why };
}
const TRIALS = {
  recursion: { name: 'Recursion', unit: 1, learn: 'recursion', make() {
    if (Math.random() < .5) { const n = rint(3, 6), calls = f => f < 2 ? 1 : 1 + calls(f - 1) + calls(f - 2), c = calls(n);
      return mk(`<pre>fib(n): if n < 2 return n\n         return fib(n-1) + fib(n-2)</pre><p>How many calls does <b>fib(${n})</b> make in total, counting the first?</p>`, c, [c + 1, c - 2, 2 * n, 2 * c - 1, n * n], `calls(n) = 1 + calls(n-1) + calls(n-2), which gives ${c} for n = ${n}. Naive recursion repeats work, so the count grows exponentially.`); }
    const n = rint(4, 7), v = n * (n + 1) / 2;
    return mk(`<pre>f(n): if n == 0 return 0\n      return n + f(n-1)</pre><p>What does <b>f(${n})</b> return?</p>`, v, [v + n, n * n, v - 1, n * (n - 1)], `The calls unwind from the base case f(0) = 0 upward, adding ${n}, ${n - 1}, ... down to 1, so f(${n}) = ${v}.`); } },
  graph: { name: 'Dijkstra step', unit: 2, learn: 'sssp', make() {
    for (;;) {
      const N = 'ABCDEF'.split(''), E = []; for (let i = 1; i < 6; i++) E.push([rint(0, i - 1), i, rint(1, 9)]);
      for (let x = 0; x < 3; x++) { const a = rint(0, 5), b = rint(0, 5); if (a !== b && !E.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a))) E.push([a, b, rint(1, 9)]); }
      const d = Array(6).fill(Infinity), done = Array(6).fill(false); d[0] = 0; const steps = rint(1, 3);
      for (let s = 0; s < steps; s++) { let u = -1; for (let i = 0; i < 6; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i; done[u] = true;
        for (const [a, b, w] of E) { if (a === u && d[a] + w < d[b]) d[b] = d[a] + w; if (b === u && d[b] + w < d[a]) d[a] = d[b] + w; } }
      const c = [...Array(6).keys()].filter(i => !done[i] && d[i] < Infinity).sort((x, y) => d[x] - d[y]); if (c.length < 3 || d[c[0]] === d[c[1]]) continue;
      const show = N.map((n, i) => `${n}: ${d[i] === Infinity ? '∞' : d[i]}${done[i] ? ' (settled)' : ''}`).join(' &nbsp; ');
      return mk(`<p>Edges: ${E.map(e => `${N[e[0]]}-${N[e[1]]} (${e[2]})`).join(', ')}.</p><p>Dijkstra started at A. Current distances: ${show}</p><p>Which node does it settle next?</p>`, N[c[0]], c.slice(1).map(i => N[i]), `Dijkstra always settles the unsettled node with the smallest tentative distance: ${N[c[0]]} at ${d[c[0]]}. Then it relaxes that node's edges.`);
    } } },
  traversal: { name: 'Tree traversals', unit: 4, learn: 'traversal', make() {
    let t = null; keysOf(7).forEach(k => t = ins(t, k)); const fn = { pre, in: inord, post, level }, lab = { pre: 'preorder', in: 'inorder', post: 'postorder', level: 'level-order' };
    const kind = pickN(Object.keys(fn), 1)[0], ok = fn[kind](t).join(', ');
    return mk(`<p>Which sequence is the <b>${lab[kind]}</b> traversal of this tree?</p>` + drawTree(t), ok, [...Object.keys(fn).filter(x => x !== kind).map(x => fn[x](t).join(', ')), fn[kind](t).reverse().join(', ')],
      `${{ pre: 'Preorder visits root, left, right.', in: 'Inorder visits left, root, right. On a BST that always lists keys in sorted order.', post: 'Postorder visits left, right, root.', level: 'Level-order visits row by row using a queue, like BFS.' }[kind]} Here: ${ok}.`); } },
  bst: { name: 'Binary search trees', unit: 4, learn: 'bst', make() {
    const ks = keysOf(8), base = ks.slice(0, 6), K = ks[6]; let t = null; base.forEach(k => t = ins(t, k));
    let n = t, par = null; const path = []; while (n) { par = n; path.push(`${K} ${K < n.k ? '<' : '>'} ${n.k}`); n = K < n.k ? n.l : n.r; }
    return mk(`<p>Insert <b>${K}</b> into this BST. Which node becomes its parent?</p>` + drawTree(t), par.k, base.filter(x => x !== par.k), `Walk down from the root: ${path.join(', ')}. It stops at an empty slot below ${par.k}, as its ${K < par.k ? 'left' : 'right'} child. Smaller keys go left, larger go right.`); } },
  avl: { name: 'AVL rotations', unit: 4, learn: 'avl', make() {
    const bad = t => !t ? null : bad(t.l) || bad(t.r) || (Math.abs(bf(t)) > 1 ? t : null);
    for (;;) {
      let t = null, z = null; for (const k of keysOf(rint(4, 6))) { t = ins(t, k); z = bad(t); if (z) break; } if (!z) continue;
      const left = bf(z) > 0, c = left ? z.l : z.r, cs = bf(c), kind = left ? (cs >= 0 ? 'LL' : 'LR') : (cs <= 0 ? 'RR' : 'RL');
      const L = { LL: 'Single right rotation (LL case)', RR: 'Single left rotation (RR case)', LR: 'Left-right double rotation (LR case)', RL: 'Right-left double rotation (RL case)' };
      return mk(`<p>This insertion broke the AVL condition at node <b>${z.k}</b> (red). Numbers beside nodes are balance factors, left height minus right height. Which rotation restores balance?</p>` + drawTree(t, { [z.k]: 'bad' }, true),
        kind, ['LL', 'RR', 'LR', 'RL'].filter(x => x !== kind), `Node ${z.k} has balance factor ${bf(z)}, so it is ${left ? 'left' : 'right'}-heavy. Its ${left ? 'left' : 'right'} child has balance factor ${cs}, which makes this the ${kind} case.`, x => L[x]);
    } } },
  heap: { name: 'Binary heaps', unit: 5, learn: 'heap', make() {
    const a = heapOf(keysOf(6)), head = `<p>Min-heap array: <code>${arr(a)}</code> (children of slot i are 2i+1 and 2i+2)</p>` + drawTree(heapTree(a));
    if (Math.random() < .5) { let K; do K = rint(1, 40); while (a.includes(K)); const b = [...a, K], i = b.length - 1, p = (i - 1) >> 1, one = [...b]; if (K < b[p]) [one[i], one[p]] = [one[p], one[i]];
      return mk(head + `<p>Insert <b>${K}</b>. What is the array afterwards?</p>`, up(b), [b, one, [K, ...a], (x => { const y = [...x]; [y[0], y[y.length - 1]] = [y[y.length - 1], y[0]]; return y; })(up(b)), (x => { const y = [...x]; [y[1], y[2]] = [y[2], y[1]]; return y; })(up(b))], `Place ${K} in the last slot, then sift up: swap with the parent while it is smaller. Worst case O(log n).`, arr); }
    return mk(head + `<p>Remove the minimum. What is the array afterwards?</p>`, popMin(a), [a.slice(1), [a[a.length - 1], ...a.slice(1, -1)], [...a.slice(1, -1), a[a.length - 1]], (x => { const y = [...x]; [y[1], y[2]] = [y[2], y[1]]; return y; })(popMin(a))],
      `Move the last item to the root, then sift down: swap with the smaller child until the heap order holds. Worst case O(log n).`, arr); } },
  btree: { name: 'B-trees', unit: 5, learn: 'btree', make() {
    const ks = keysOf(8); let root = null; ks.slice(0, 7).forEach(k => root = btInsert(root, k)); const K = ks[7], before = JSON.stringify(root), copy = JSON.parse(before), after = btInsert(JSON.parse(before), K), ak = arr(after.keys);
    return mk(`<p>This B-tree holds up to 3 keys per node. Insert <b>${K}</b>. What does the root contain afterwards?</p>` + drawBTree(copy), ak,
      [arr(copy.keys), arr([...copy.keys, K].sort((a, b) => a - b).slice(0, 3)), arr([K]), arr([copy.keys[0]]), arr(after.keys.slice().reverse())],
      `Insertion goes down to a leaf. Any full node (3 keys) on the way splits first: its middle key moves up into the parent. After inserting ${K} the root holds ${ak}.`); } },
  hash: { name: 'Hash tables', unit: 6, learn: 'hash', make() {
    const m = rint(0, 1) ? 7 : 11, tbl = Array(m).fill(null), put = k => { let i = k % m, p = 1; while (tbl[i] !== null) { i = (i + 1) % m; p++; } tbl[i] = k; return [i, p]; };
    pickN(Array.from({ length: 80 }, (_, i) => i + 10), 4).forEach(put); let K; do K = rint(10, 99); while (tbl.includes(K) || tbl[K % m] === null);
    const cells = a => `<div class="cells">${a.map((v, i) => `<span><i>${i}</i>${v ?? ''}</span>`).join('')}</div>`, before = cells(tbl), [slot, probes] = put(K), ask = rint(0, 1);
    const why = `h(${K}) = ${K} mod ${m} = ${K % m}, which is taken. Linear probing checks the next slots in order, wrapping around, until one is empty. It lands in slot ${slot} after ${probes} probe${probes > 1 ? 's' : ''}.`;
    return ask ? mk(`<p>Hash table of size ${m}, hash(k) = k mod ${m}, linear probing.</p>${before}<p>Insert <b>${K}</b>. Which slot does it land in?</p>`, slot, [...Array(m).keys()].filter(x => x !== slot), why)
      : mk(`<p>Hash table of size ${m}, hash(k) = k mod ${m}, linear probing.</p>${before}<p>Insert <b>${K}</b>. How many slots are probed, counting the final one?</p>`, probes, [1, 2, 3, 4, 5].filter(x => x !== probes), why); } }
};
/* ---------- Command tree: your defenders form a real BST (optionally AVL) keyed by tile id ---------- */
const rotL = x => { const y = x.r; x.r = y.l; y.l = x; return y; };
const rotR = x => { const y = x.l; x.l = y.r; y.r = x; return y; };
function rotAt(t, k, dir) { if (!t) return t; if (k === t.k) return dir === 'L' ? (t.r ? rotL(t) : t) : (t.l ? rotR(t) : t); if (k < t.k) t.l = rotAt(t.l, k, dir); else t.r = rotAt(t.r, k, dir); return t; }
function bal(t) { const b = bf(t); if (b > 1) { if (bf(t.l) < 0) t.l = rotL(t.l); return rotR(t); } if (b < -1) { if (bf(t.r) > 0) t.r = rotR(t.r); return rotL(t); } return t; }
function tIns(t, k, avl) { if (!t) return { k }; if (k < t.k) t.l = tIns(t.l, k, avl); else t.r = tIns(t.r, k, avl); return avl ? bal(t) : t; }
function tDel(t, k, avl) {                                              // BST delete: leaf, one child, or swap with the in-order successor
  if (!t) return t; if (k < t.k) t.l = tDel(t.l, k, avl); else if (k > t.k) t.r = tDel(t.r, k, avl);
  else { if (!t.l) return t.r; if (!t.r) return t.l; let m = t.r; while (m.l) m = m.l; t.k = m.k; t.r = tDel(t.r, m.k, avl); }
  return avl ? bal(t) : t;
}
const tFind = (t, k) => !t ? null : k === t.k ? t : tFind(k < t.k ? t.l : t.r, k);
const tDepth = (t, k, d = 1) => !t ? 0 : k === t.k ? d : tDepth(k < t.k ? t.l : t.r, k, d + 1);
const build = ks => ks.length ? { k: ks[ks.length >> 1], l: build(ks.slice(0, ks.length >> 1)), r: build(ks.slice(1 + (ks.length >> 1))) } : null;
// B-tree (max 3 keys per node): a full node splits and sends its middle key up
function btSplit(p, i) {
  const y = p.kids[i], leaf = !y.kids.length, med = y.keys[1], z = { keys: [y.keys[2]], kids: leaf ? [] : [y.kids[2], y.kids[3]] };
  y.keys = [y.keys[0]]; y.kids = leaf ? [] : [y.kids[0], y.kids[1]]; p.keys.splice(i, 0, med); p.kids.splice(i + 1, 0, z); btSplits++;
}
function btInsert(root, k) {
  if (!root) return { keys: [k], kids: [] };
  if (root.keys.length === 3) { const s = { keys: [], kids: [root] }; btSplit(s, 0); root = s; }
  let x = root;
  for (;;) {
    let i = 0; while (i < x.keys.length && k > x.keys[i]) i++;
    if (!x.kids.length) { x.keys.splice(i, 0, k); return root; }
    if (x.kids[i].keys.length === 3) { btSplit(x, i); if (k > x.keys[i]) i++; }
    x = x.kids[i];
  }
}
const btLevel = (x, k, d = 1) => { if (!x) return null; if (x.keys.includes(k)) return { d, size: x.keys.length }; let i = 0; while (i < x.keys.length && k > x.keys[i]) i++; return btLevel(x.kids[i], k, d + 1); };
const btHeight = x => x ? 1 + (x.kids.length ? btHeight(x.kids[0]) : 0) : 0;
function drawBTree(root, hl = {}, opt = {}) {
  const KW = 36, GAP = 10, lab = k => opt.label ? opt.label(k) : k;
  const lay = (n, d) => { n.d = d; n.kids.forEach(c => lay(c, d + 1)); n.nw = n.keys.length * KW + 8; n.kw = n.kids.reduce((s, c) => s + c.w + GAP, -GAP); n.w = n.kids.length ? Math.max(n.nw, n.kw) : n.nw; };
  lay(root, 0); let H = 0, s = '';
  const place = (n, x0) => { n.cx = x0 + n.w / 2; let x = x0 + (n.w - n.kw) / 2; for (const c of n.kids) { place(c, x); x += c.w + GAP; } H = Math.max(H, n.d); };
  place(root, 0);
  const dr = n => {
    for (const c of n.kids) { s += `<line x1="${n.cx}" y1="${n.d * 56 + 26}" x2="${c.cx}" y2="${c.d * 56 + 10}"/>`; dr(c); }
    s += `<g><rect x="${n.cx - n.nw / 2}" y="${n.d * 56 + 10}" width="${n.nw}" height="32" rx="6"/>` + n.keys.map((k, i) => `<text x="${n.cx - n.nw / 2 + 4 + i * KW + KW / 2}" y="${n.d * 56 + 31}" ${opt.label ? 'style="font-size:10px"' : ''} class="${hl[k] || ''}">${lab(k)}</text>`).join('') + '</g>';
  };
  dr(root); return `<svg viewBox="0 0 ${root.w + 4} ${H * 56 + 46}" class="tree bt" role="img" aria-label="B-tree">${s}</svg>`;
}
let ctSig = '', hpSig = '', gridSig = '', fwVer = -1;
const nodeName = n => n === EXIT ? 'Keep' : `${n % COLS},${n / COLS | 0}`;
function renderGrid(g) {
  const gi = g.gridInfo(), sig = JSON.stringify([g.cables, gi.n, gi.total, g.gold >= gi.total, g.linkFrom]); if (sig === gridSig) return; gridSig = sig;
  $('gridHead').textContent = gi.n ? `${gi.powered}/${gi.n} powered` : '';
  const state = !gi.n ? 'Place a defender, pick the Cable tool, and link it to the keep.' : gi.optimal ? 'Optimal! Your grid is a minimum spanning tree: +15 cycles after each wave.'
    : gi.powered === gi.n ? `Everything is powered, but ${gi.spent - gi.total} cycles more than the minimum.` : `${gi.n - gi.powered} defender${gi.n - gi.powered > 1 ? 's are' : ' is'} unpowered.`;
  $('gridInfo').innerHTML = gi.n ? `<p>Your cables: <b>${gi.spent}</b> cycles. Prim optimum: <b>${gi.total}</b>.</p><p>${state}</p><p>Prim adds, cheapest edge first: ${gi.edges.map(([a, b, w]) => `${nodeName(a)} to ${nodeName(b)} (${w})`).join(', ')}.</p>` : `<p>${state}</p>`;
  $('gridAuto').disabled = !gi.n || g.gold < gi.total + Math.ceil(gi.total * .25) - Math.floor(gi.spent / 2); $('gridClear').disabled = !g.cables.length;
}
function renderFW(g) {
  $('fwPanel').hidden = !CHECKS.length; if (!CHECKS.length) return; const gr = g.graph; if (gr.version === fwVer) return; fwVer = gr.version;
  const names = ['In', ...CHECKS.map((_, i) => 'C' + (i + 1)), 'Keep'], ids = [START, ...CHECKS, EXIT], { d } = gr.floyd(), pl = gr.plan(START, CHECKS), seq = pl ? [START, ...pl.order, EXIT] : [], hot = new Set(seq.slice(1).map((n, i) => seq[i] + '>' + n));
  $('fwTable').innerHTML = `<table class="fw"><tr><th></th>${names.map(n => `<th>${n}</th>`).join('')}</tr>` + ids.map((a, i) => `<tr><th>${names[i]}</th>${ids.map((b, k) => `<td class="${hot.has(a + '>' + b) ? 'hot' : ''}">${i === k ? '-' : d[a][b] === Infinity ? '∞' : d[a][b]}</td>`).join('')}</tr>`).join('') + '</table>';
  $('fwNote').textContent = pl ? `Cheapest visiting order: ${seq.map(n => names[ids.indexOf(n)]).join(', then ')} (total ${pl.cost}). Highlighted cells are the legs it uses.` : 'No route reaches every checkpoint.';
}
function renderCT(g) {
  const t = g.tree, b = g.bt, sig = JSON.stringify(t, ['k', 'l', 'r']) + JSON.stringify(b, ['keys', 'kids']) + g.sel + g.kind + (g.gold >= 8) + (g.gold >= 60) + (g.gold >= 90); if (sig === ctSig) return; ctSig = sig;
  const n = g.insOrder.length, ds = g.defenders(), avg = n ? Math.round(ds.reduce((s, k) => s + g.eff(k), 0) / (ds.length || 1) * 100) : 100, bt = g.kind === 'btree';
  const ok = bt || (function f(x) { return !x || (Math.abs(bf(x)) <= 1 && f(x.l) && f(x.r)); })(t), h = bt ? btHeight(b) : ht(t), lab = k => `${k % COLS},${k / COLS | 0}`;
  $('ctSvg').innerHTML = !n ? '<p class="evt">Place a Heap Cannon, Queue Freezer or Cache Vault to start the tree.</p>' : bt ? drawBTree(b, {}, { label: lab }) : drawTree(t, g.sel != null ? { [g.sel]: 'sel' } : {}, true, { label: lab, click: true });
  $('ctInfo').textContent = n ? `${{ bst: 'BST', avl: 'AVL', btree: 'B-tree' }[g.kind]}, ${n} towers, height ${h}, signal ${avg}%` : '';
  const x = !bt && g.sel != null ? tFind(t, g.sel) : null, bst = g.kind === 'bst';
  $('ctL').hidden = $('ctR').hidden = !bst; $('ctL').disabled = !x || !x.r || g.gold < 8; $('ctR').disabled = !x || !x.l || g.gold < 8;
  for (const [id, k, c] of [['ctBst', 'bst', 0], ['ctAvl', 'avl', 60], ['ctBt', 'btree', 90]]) { $(id).setAttribute('aria-pressed', g.kind === k); $(id).disabled = g.kind === k || g.gold < c; }
  $('ctNote').textContent = !n ? '' : bt ? `B-tree: each node holds up to 3 towers. A full node splits and sends its middle key up, so every leaf stays at the same depth (${btSplits} split${btSplits === 1 ? '' : 's'} so far). Crowded nodes cost a little signal. Removing a tower rebuilds the tree from the remaining ones.`
    : g.kind === 'avl' ? 'AVL rebalances with rotations on every insert and delete.' : ok ? 'Balanced: every node is within 1 level.' : 'Unbalanced: deep nodes relay orders slowly. Select a node and rotate.';
}
function renderHeap(g) {
  const a = g.phase === 'wave' ? heapOf(g.enemies.filter(e => !e.dead).map(e => Math.ceil(e.hp))).slice(0, 7) : [], sig = a.join(','); if (sig === hpSig) return; hpSig = sig;
  $('heapPanel').hidden = !a.length; if (a.length) $('heapSvg').innerHTML = drawTree(heapTree(a), { [a[0]]: 'hl' }) + `<p class="evt">Array ${arr(a)}. Slot i has children 2i+1 and 2i+2. The root is the weakest packet.</p>`;
}

/* ---------- Puzzles UI: menu, live panel, scoring ---------- */
let ACTIVE_PUZZLE = null, pzSig = '', pzDone = 0;
function openPuzzles() {
  $('pzList').innerHTML = '';
  for (const [type, T] of Object.entries(PUZZLE_TYPES)) {
    const h = document.createElement('h3'); h.textContent = T.name; $('pzList').append(h); const p = document.createElement('p'); p.className = 'evt'; p.textContent = T.rule; $('pzList').append(p);
    const row = document.createElement('div'); row.className = 'tlist';
    for (const P of PUZZLES.filter(x => x.type === type)) { const b = document.createElement('button'), s = save.puzzles[P.id] || 0; b.innerHTML = `<b>${P.name}</b><small>${'★'.repeat(s)}${'☆'.repeat(3 - s)} · ${P.map === 'Twin Gates' ? 'Twin Gates' : P.map}</small>`; b.onclick = () => startPuzzle(P.id); row.append(b); }
    $('pzList').append(row);
  }
  $('puzzles').hidden = false; $('pzClose').focus();
}
function startPuzzle(id) { ACTIVE_PUZZLE = PUZZLES.find(p => p.id === id); $('mode').value = 'puzzle'; $('puzzles').hidden = true; startMap(0); savePrefs(); }
function renderPuzzle(g) {
  const P = g.puzzle; if (!P) return; const ev = puzzleEval(g, P), sig = g.graph.version + '|' + ev.text + '|' + g.rotations + '|' + pzDone + '|' + g.cables.length; if (sig === pzSig) return; pzSig = sig;
  $('pzName').textContent = `${PUZZLE_TYPES[P.type].name}: ${P.name}`; $('pzGoal').textContent = P.goal; $('pzHint').textContent = P.hint ? 'Hint: ' + P.hint : ''; $('pzLimits').textContent = limitsText(g, P);
  $('pzStatus').textContent = `${ev.text} ${'★'.repeat(ev.stars)}${'☆'.repeat(3 - ev.stars)}`; $('pzStatus').classList.toggle('ok', ev.stars > 0);
}
function submitPuzzle() {
  const g = game, P = g.puzzle; if (!P) return; const ev = puzzleEval(g, P);
  if (!ev.stars) return g.say(`Not there yet. ${ev.text}`, true);
  const old = save.puzzles[P.id] || 0, gain = Math.max(0, ev.stars - old); save.puzzles[P.id] = Math.max(old, ev.stars); save.shards += gain * 8; save.xp += gain * 25;
  if (P.type === 'maze') unlock('architect'); if (PUZZLES.every(p => (save.puzzles[p.id] || 0) >= 3)) unlock('puzzler');
  persist(); refreshMeta(); sfx(ev.stars === 3 ? 'fanfare' : 'up'); pzDone++; $('pzNext').hidden = false;
  g.say(`Puzzle solved with ${'★'.repeat(ev.stars)}${'☆'.repeat(3 - ev.stars)}. ${gain ? `New best: +${gain * 8} shards, +${gain * 25} XP.` : 'You already had this many stars.'}${ev.stars < 3 ? ' Can you get all three?' : ''}`);
}
$('puzzlesBtn').onclick = openPuzzles; $('pzClose').onclick = () => { $('puzzles').hidden = true; };
$('pzSubmit').onclick = submitPuzzle; $('pzReset').onclick = () => startMap(0); $('pzMenu').onclick = openPuzzles;
$('pzNext').onclick = () => { const i = PUZZLES.indexOf(ACTIVE_PUZZLE); startPuzzle(PUZZLES[(i + 1) % PUZZLES.length].id); };
$('pzExit').onclick = () => { $('mode').value = 'campaign'; ACTIVE_PUZZLE = null; startMap(+$('map').value); savePrefs(); };
let tr = null;
function openTrials() {
  $('tMenu').hidden = false; $('tPlay').hidden = true; $('tList').innerHTML = '';
  for (const [k, T] of Object.entries(TRIALS)) { const b = document.createElement('button'), s = save.trials[k] || 0; b.innerHTML = `<b>${T.name}</b><small>Unit ${T.unit} · ${'★'.repeat(s)}${'☆'.repeat(3 - s)}</small>`; b.onclick = () => startTrial(k); $('tList').append(b); }
  $('trials').hidden = false; $('tClose').focus();
}
function startTrial(k) { tr = { k, i: 0, right: 0 }; $('tMenu').hidden = true; $('tPlay').hidden = false; nextRound(); }
function nextRound() {
  if (tr.i >= 5) return finishTrial(); const q = tr.cur = TRIALS[tr.k].make(); tr.i++; $('tAgain').hidden = true;
  $('tTitle').textContent = `${TRIALS[tr.k].name}: question ${tr.i} of 5`; $('tPrompt').innerHTML = q.html; $('tFb').textContent = ''; $('tNext').hidden = true; $('tOpts').innerHTML = '';
  q.opts.forEach((t, i) => { const b = document.createElement('button'); b.textContent = t; b.onclick = () => answerTrial(i); $('tOpts').append(b); });
}
function answerTrial(i) {
  const q = tr.cur, ok = i === q.ans; if (ok) { tr.right++; learn(TRIALS[tr.k].learn); sfx('coin'); } else sfx('err');
  [...$('tOpts').children].forEach((b, j) => { b.disabled = true; b.classList.toggle('good', j === q.ans); b.classList.toggle('bad', j === i && !ok); });
  $('tFb').innerHTML = (ok ? '<b>Correct.</b> ' : '<b>Not quite.</b> ') + q.why; $('tNext').hidden = false; $('tNext').textContent = tr.i >= 5 ? 'Finish' : 'Next';
}
function finishTrial() {
  const T = TRIALS[tr.k], r = tr.right, stars = r === 5 ? 3 : r >= 4 ? 2 : r >= 3 ? 1 : 0, old = save.trials[tr.k] || 0, gain = Math.max(0, stars - old), shards = r * 3 + gain * 10, xp = r * 10 + gain * 20;
  save.shards += shards; save.xp += xp; save.trials[tr.k] = Math.max(old, stars);
  if (['traversal', 'bst', 'avl', 'heap'].every(x => (save.trials[x] || 0) >= 3)) unlock('arborist'); if (Object.keys(TRIALS).every(x => (save.trials[x] || 0) >= 3)) unlock('polymath');
  persist(); refreshMeta(); $('tTitle').textContent = `${T.name}: ${r} of 5 correct`;
  $('tPrompt').innerHTML = `<p class="stars">${[0, 1, 2].map(i => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('')}</p><p>+${shards} shards, +${xp} XP${gain ? ` (new best, +${gain} star${gain > 1 ? 's' : ''})` : ''}</p><p>${stars < 3 ? 'Answer all 5 correctly for three stars.' : 'Perfect run!'}</p>`;
  $('tOpts').innerHTML = ''; $('tFb').textContent = ''; $('tNext').hidden = true; $('tAgain').hidden = false;
}

/* ---------- Codex: concepts unlock as you use them ---------- */
const CODEX = {
  weight: ['Edge weight', 'A number on an edge: the price of moving along it. Here, entering a node costs its weight, and that cost is also travel time: a cost-3 tile takes three times as long to cross as a cost-1 tile. Packets on cost-3 or heavier tiles are mired: slower, easier to hit and worth a bonus when they die.'],
  sssp: ['Shortest path', 'The route with the smallest total weight, not the fewest steps. The sum is shown under Router status.'],
  relax: ['Relaxation', 'Dijkstra keeps the best known cost to each node and relaxes it when a cheaper way appears. A Reducer creates exactly that.'],
  trade: ['Cost trade-off', 'A heavier edge repels the shortest path. Tolls push routes away; reducers pull them in.'],
  prune: ['Edge removal', 'Deleting a node deletes its edges. Paths through it vanish, and the graph must stay connected or no route exists.'],
  visit: ['Search order', 'Dijkstra visits nodes in order of cheapest total so far, spreading outward like a flood. The Lens shows that order.'],
  heur: ['A* heuristic', 'A* adds a guess of the remaining distance (Manhattan here), so it explores fewer nodes and still finds the cheapest route.'],
  bfs: ['Breadth-first search', 'BFS finds the fewest steps and ignores weights, so a Scout shrugs off tolls and reducers. Only deleting nodes changes its route.'],
  threat: ['Threat-aware search', 'Adding penalty costs near defenders makes a search route around danger. The Phantom does this on top of Dijkstra.'],
  nearest: ['Nearest-target search', 'The Breaker runs BFS to the closest defender and sieges it: shortest paths decide what gets attacked first.'],
  dfs: ['Depth-first search', 'DFS dives down one branch before backtracking. It finds a path but rarely the shortest, so the Wanderer takes the scenic route.'],
  greedy: ['Greedy best-first', 'Greedy search always moves toward whatever looks closest to the goal and ignores edge costs. Fast, not optimal: the Charger walks into traps.'],
  recursion: ['Recursion', 'A recursive process repeats itself on smaller pieces. The Fork Hydra splits into two half-strength copies of itself, up to two levels deep.'],
  jps: ['Jump point search', 'JPS speeds up grid search by leaping along straight lines instead of stepping tile by tile. The Jump Lancer leaps 3 nodes every 4 seconds.'],
  tree: ['Trees', 'A tree is a connected graph with no cycles and a root. Every other node has exactly one path from the root. Terms: parent, child, leaf, level, height.'],
  traversal: ['Tree traversals', 'Preorder visits root, left, right. Inorder visits left, root, right. Postorder visits left, right, root. Level-order uses a queue, like BFS. Inorder on a BST is sorted.'],
  bst: ['Binary search tree', 'Smaller keys go left, larger keys go right, no duplicates. Insert and search follow one path, so the cost is the tree height.'],
  avl: ['AVL tree', 'Every node keeps its two subtree heights within 1 of each other. Rotations restore balance after an insert, giving O(log n) in the worst case.'],
  heap: ['Binary heap', 'A complete tree stored in an array: children of slot i sit at 2i+1 and 2i+2. A min-heap keeps the smallest key at the root; insert sifts up, remove-min sifts down. The Heap Cannon queue in the HUD is one.'],
  hash: ['Hash table', 'A hash function maps a key to a slot. Collisions are resolved by chaining or by open addressing, probing for the next free slot. Resizing keeps the load factor low.'],
  collision: ['Collisions', 'When two keys hash to the same slot, open addressing probes the next free slot. A Cache Vault does exactly this with linear probing.'],
  rehash: ['Rehashing', 'Resizing a hash table means choosing a bigger size and reinserting every key with the new modulus. Upgrading a Cache Vault rehashes its slots.'],
  floyd: ['Floyd-Warshall', 'Finds the shortest distance between every pair of nodes at once by trying each node as an intermediate stop, in O(V cubed). On checkpoint maps, packets read this table to choose their visiting order.'],
  prim: ['Prim’s algorithm', 'Grows a minimum spanning tree from one node by always adding the cheapest edge that reaches a new node. Wiring all your defenders to the keep at minimum cost is exactly this problem.'],
  btree: ['B-tree', 'A balanced multiway tree: each node holds several sorted keys, and a full node splits and sends its middle key up, so every leaf stays at the same depth. Wide nodes mean fewer levels, which is why databases and file systems use them.'],
  dynamic: ['Dynamic graphs', 'When weights change mid-run, shortest paths must be recomputed. Every packet re-plans after each edit.']
};
const UNIT = { recursion: 1, weight: 2, sssp: 2, relax: 2, trade: 2, prune: 2, visit: 2, heur: 2, greedy: 2, threat: 2, jps: 2, dynamic: 2, bfs: 3, dfs: 3, nearest: 3, tree: 4, traversal: 4, bst: 4, avl: 4, heap: 5, btree: 5, hash: 6, collision: 6, rehash: 6, floyd: 3, prim: 3 };
const learned = new Set(); let toastT;
function renderCodex() {
  $('codexCount').textContent = `${learned.size}/${Object.keys(CODEX).length}`;
  $('codex').innerHTML = Object.entries(CODEX).map(([k, [n, t]]) => learned.has(k) ? `<li class="on"><b>${n} <small>Unit ${UNIT[k] || 1}</small></b><span>${t}</span></li>` : `<li><b>Locked</b><span>Keep experimenting to unlock.</span></li>`).join('');
}
function learn(k) {
  if (learned.has(k)) return; learned.add(k); renderCodex();
  const t = $('toast'); t.textContent = `Codex unlocked: ${CODEX[k][0]}`; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}
function learnFrom(tool) { ({ reducer: ['weight', 'relax'], toll: ['trade'], barrier: ['prune'], upgrade: ['relax'] }[tool] || []).forEach(learn); if (game.phase === 'wave') learn('dynamic'); }
renderCodex();
$('lens').onclick = () => { game.lens = !game.lens; $('lens').setAttribute('aria-pressed', game.lens); game.lensStart = null; if (game.lens) learn('visit'); };

