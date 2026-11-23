/* ========== Extras: new chamber kinds, review / daily / boss modes, stats, sandbox, difficulty ========== */
const DIFFS = { easy: { fail: .7, hint: 5, drain: 14, gain: 1.15 }, normal: { fail: 1, hint: 10, drain: 10, gain: 1 }, hard: { fail: 1.5, hint: 15, drain: 6, gain: .85 } };
const D = () => DIFFS[(window.game && window.game.save.diff) || 'normal'];
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const CHO = (topic, sentence, legend, right, wrongs, brief, hints) => { const at = Gen.r(wrongs.length + 1), o = wrongs.slice(); o.splice(at, 0, right); return { type: 'formalize', plain: true, topic, brief, sentence, legend, options: o, right: at, hints: [...hints, `The answer is option ${'ABCD'[at]}.`] }; };
Gen.mutate = ast => {
  const c = JSON.parse(JSON.stringify(ast)), ns = [];
  (function w(n) { if (n.t === 'pred' || n.t === 'var' || n.t === 'free') return; ns.push(n); w(n.a); if (n.b) w(n.b); })(c);
  if (!ns.length) return c;
  const n = Gen.pick(ns);
  switch (n.t) { case 'and': n.t = 'or'; break; case 'or': n.t = 'and'; break; case 'imp': [n.a, n.b] = [n.b, n.a]; break; case 'iff': n.t = 'imp'; break; case 'all': n.t = 'ex'; break; case 'ex': n.t = 'all'; break; case 'not': { const x = n.a; delete n.a; Object.assign(n, x); } }
  return c;
};
Gen.classify = function (n) {
  const vs = ['P', 'Q', 'R'].slice(0, n > 6 ? 3 : 2); let ast, c;
  for (let k = 0; k < 60; k++) {
    const f = Gen.form(vs, 1), g = Gen.form(vs, 1), w = Gen.r(3);
    ast = w === 0 ? (Gen.r(2) ? { t: 'or', a: { t: 'imp', a: f, b: g }, b: { t: 'imp', a: g, b: f } } : { t: 'imp', a: { t: 'and', a: f, b: g }, b: f }) : w === 1 ? Gen.form(vs, 2) : (Gen.r(2) ? { t: 'and', a: f, b: { t: 'not', a: f } } : { t: 'iff', a: f, b: { t: 'not', a: f } });
    const v = Logic.rows(Logic.vars(ast)).map(e => Logic.ev(ast, e)); c = v.every(Boolean) ? 0 : v.some(Boolean) ? 1 : 2;
    if (c === w && Logic.vars(ast).length >= 2) break;
  }
  const names = ['a tautology', 'satisfiable, but not a tautology', 'a contradiction'], at = Gen.r(3), o = names.filter((_, i) => i !== c); o.splice(at, 0, names[c]);
  return { type: 'formalize', plain: true, topic: 'classify', brief: 'Classify the formula.', sentence: Logic.str(ast) + ' is…', legend: ['Tautology: true in every row. Contradiction: false in every row.'], options: o, right: at, hints: ['Build the truth table and look at the whole column.', `The answer is option ${'ABCD'[at]}.`] };
};
const EQ1 = [['P -> Q', ['!P | Q', '!Q -> !P', '!(P & !Q)']], ['!(P & Q)', ['!P | !Q', 'P -> !Q']], ['!(P | Q)', ['!P & !Q']], ['P <-> Q', ['(P -> Q) & (Q -> P)', '(P & Q) | (!P & !Q)']], ['P | (P & Q)', ['P']], ['!(P -> Q)', ['P & !Q']], ['(P -> R) & (Q -> R)', ['(P | Q) -> R']], ['(P -> Q) & (P -> R)', ['P -> (Q & R)']]];
const EQ2 = [['!@x P(x)', '?x !P(x)'], ['!?x P(x)', '@x !P(x)'], ['!@x (P(x) -> Q(x))', '?x (P(x) & !Q(x))'], ['!?x (P(x) & Q(x))', '@x (P(x) -> !Q(x))'], ['@x (P(x) & Q(x))', '@x P(x) & @x Q(x)'], ['?x (P(x) | Q(x))', '?x P(x) | ?x Q(x)'], ['@x (P(x) -> Q(x))', '@x (!Q(x) -> !P(x))'], ['!@x ?y R(x,y)', '?x @y !R(x,y)']];
const eqLevel = (L, eqf, b, right) => {
  const wrong = [], seen = new Set([L.str(right)]);
  for (let k = 0; k < 150 && wrong.length < 3; k++) { const m = Gen.mutate(Gen.r(2) ? right : b), s = L.str(m); if (!seen.has(s) && !eqf(m, b)) { seen.add(s); wrong.push(s); } }
  return CHO('equiv', `Which formula is equivalent to ${L.str(b)}?`, [], L.str(right), wrong, 'Pick the formula that says exactly the same thing.', ['Compare truth tables (or models), or recall the standard laws: De Morgan, contrapositive, quantifier negation.']);
};
Gen.equiv = function () { const [bs, es] = Gen.pick(EQ1); return eqLevel(Logic, Logic.equivalent, Logic.parse(bs), Logic.parse(Gen.pick(es))); };
Gen2.equiv = function () { const [bs, rs] = Gen.pick(EQ2), L = Gen.shuffle(['P', 'Q', 'S', 'T']), sub = s => s.replace(/[PQ]/g, c => L['PQ'.indexOf(c)]); return eqLevel(Pred, Pred.equiv, Pred.parse(sub(bs)), Pred.parse(sub(rs))); };
/* unification, resolution and Skolemization */
const TT = {
  v: n => ({ t: 'v', n }), f: (n, ...a) => ({ t: 'f', n, a }),
  str: t => t.t === 'v' ? t.n : t.n + (t.a.length ? '(' + t.a.map(TT.str).join(',') + ')' : ''),
  walk: (t, s) => { while (t.t === 'v' && s[t.n]) t = s[t.n]; return t; },
  apply: (t, s) => { t = TT.walk(t, s); return t.t === 'v' ? t : { ...t, a: t.a.map(x => TT.apply(x, s)) }; },
  occurs: (n, t, s) => { t = TT.walk(t, s); return t.t === 'v' ? t.n === n : t.a.some(x => TT.occurs(n, x, s)); },
  unify(a, b, s = {}) {
    a = TT.walk(a, s); b = TT.walk(b, s);
    if (a.t === 'v' && b.t === 'v' && a.n === b.n) return s;
    if (a.t === 'v') return TT.occurs(a.n, b, s) ? null : { ...s, [a.n]: b };
    if (b.t === 'v') return TT.unify(b, a, s);
    if (a.n !== b.n || a.a.length !== b.a.length) return null;
    for (let i = 0; i < a.a.length; i++) { s = TT.unify(a.a[i], b.a[i], s); if (!s) return null; }
    return s;
  },
  canon: (t, m = {}) => t.t === 'v' ? (m[t.n] = m[t.n] || 'v' + Object.keys(m).length) : t.n + '(' + t.a.map(x => TT.canon(x, m)).join(',') + ')',
  mgu: (a, b) => { const s = TT.unify(a, b); return s && Object.fromEntries(Object.keys(s).map(k => [k, TT.apply(s[k], s)])); },
  sub: s => '{' + Object.keys(s).sort().map(v => v + '/' + TT.str(s[v])).join(', ') + '}',
};
Gen2.unify = function (n) {
  const vs = ['x', 'y', 'z'], cs = ['a', 'b'], dp = 2 + (n > 8 ? 1 : 0), rt = d => d === 0 || Gen.r(3) === 0 ? (Gen.r(2) ? TT.f(Gen.pick(cs)) : TT.v(Gen.pick(vs))) : Gen.r(2) ? TT.f('f', rt(d - 1)) : TT.f('g', rt(d - 1), rt(d - 1));
  const sz = t => t.t === 'v' ? 1 : 1 + t.a.reduce((s, x) => s + sz(x), 0), hasV = t => t.t === 'v' || t.a.some(hasV), want = Gen.r(5) > 0;
  for (let q = 0; q < 800; q++) {
    const A = rt(dp), B = rt(dp); if (sz(A) < 3 || sz(B) < 3 || !(hasV(A) || hasV(B))) continue;
    const m = TT.mgu(A, B); if (!!m !== want || (m && !Object.keys(m).length)) continue;
    const isM = o => { const a1 = TT.apply(A, o), b1 = TT.apply(B, o); return TT.str(a1) === TT.str(b1) && TT.canon(a1) === TT.canon(TT.apply(A, m)); };
    let right, wrong = [];
    if (m) {
      right = TT.sub(m); const ks = Object.keys(m), cands = [];
      ks.forEach(k => { cands.push({ ...m, [k]: TT.f(Gen.pick(cs)) }); const r = { ...m }; delete r[k]; cands.push(r); });
      vs.filter(v => !m[v]).forEach(v => cands.push({ ...m, [v]: TT.f(Gen.pick(cs)) }));
      ks.forEach(k => { if (m[k].t === 'v') cands.push({ [m[k].n]: TT.v(k), ...Object.fromEntries(ks.filter(j => j !== k).map(j => [j, m[j]])) }); });
      for (const o of Gen.shuffle(cands)) { const s = TT.sub(o); if (s !== right && !wrong.includes(s) && !isM(o)) wrong.push(s); if (wrong.length === 3) break; }
      if (wrong.length < 3) wrong.push('no unifier exists');
    } else { right = 'no unifier exists'; wrong = Gen.shuffle(['{x/a}', '{y/b}', '{z/f(a)}', '{x/f(y)}', '{y/g(a,b)}']).slice(0, 3); }
    if (wrong.length < 2) continue;
    return CHO('unify', `Unify ${TT.str(A)} = ${TT.str(B)}. What is the most general unifier?`, ['Variables: x, y, z. Constants: a, b. Functions: f, g.'], right, wrong.slice(0, 3), 'Find a substitution that makes both terms identical while binding as little as possible.',
      ['Compare the terms position by position and bind a variable to the matching subterm.', 'A variable may not be bound to a term that contains it (occurs check); clashing function symbols mean no unifier.']);
  }
  return CHO('unify', 'Unify f(x) = f(a). What is the most general unifier?', [], '{x/a}', ['{x/b}', '{}', 'no unifier exists'], 'Bind x to a.', ['Match the arguments.']);
};
Gen2.resolve = function (n) {
  const [p, q, r] = Gen.shuffle(['P', 'Q', 'R', 'S']), lit = (neg, nm, ...a) => ({ neg, n: nm, a }), ls = l => (l.neg ? '¬' : '') + l.n + '(' + l.a.map(TT.str).join(',') + ')', cs = c => '{' + c.map(ls).join(', ') + '}';
  const rt = (vs, d) => d === 0 || Gen.r(3) === 0 ? (Gen.r(3) ? TT.v(Gen.pick(vs)) : TT.f(Gen.pick(['a', 'b']))) : TT.f('f', rt(vs, d - 1));
  for (let k = 0; k < 500; k++) {
    const t1 = rt(['x', 'y'], 1 + (n > 8 ? 1 : 0)), t2 = rt(['z', 'w'], 1 + (n > 8 ? 1 : 0)), s = TT.mgu(t1, t2); if (!s || !Object.keys(s).length) continue;
    const c1 = [lit(false, p, t1), lit(Gen.r(2) === 0, q, rt(['x', 'y'], 1))], c2 = [lit(true, p, t2), lit(Gen.r(2) === 0, r, rt(['z', 'w'], 1))];
    const ap = l => ({ ...l, a: l.a.map(x => TT.apply(x, s)) }), r1 = c1.slice(1), r2 = c2.slice(1), right = cs([...r1, ...r2].map(ap));
    const wrong = [...new Set([cs([...r1, ...r2]), cs([...r1.map(ap), ...r2]), cs([ap(c1[0]), ...[...r1, ...r2].map(ap)]), cs(r1.map(ap)), cs(r2.map(ap))])].filter(x => x !== right).slice(0, 3);
    if (wrong.length < 3) continue;
    return CHO('resolve', `Resolve ${cs(c1)} with ${cs(c2)} on ${p}. What is the resolvent?`, ['The variables of the two clauses are already distinct.'], right, wrong, 'Unify the complementary literals, then apply the unifier to everything that remains.',
      ['Find the most general unifier of the two P-atoms.', 'Delete the two complementary literals and apply the unifier to the rest.']);
  }
  return CHO('resolve', 'Resolve {P(a), Q(a)} with {¬P(a), R(a)} on P. What is the resolvent?', [], '{Q(a), R(a)}', ['{Q(a)}', '{P(a), R(a)}', '{Q(a), ¬P(a), R(a)}'], 'Resolve.', []);
};
Gen2.skolem = function (n) {
  const T = [['@x ?y', 'P(x,y)'], ['?x @y', 'P(x,y)'], ['@x @y ?z', 'P(x,y,z)'], ['@x ?y @z', 'P(x,y,z)'], ['@x ?y ?z', 'P(x,y,z)'], ['?x ?y @z', 'P(x,y,z)']], pn = Gen.pick(['P', 'Q', 'R']);
  for (let k = 0; k < 30; k++) {
    const [pre, mat] = Gen.pick(T.slice(0, n > 6 ? 6 : 4)), toks = pre.split(' ').map(s => [s[0], s[1]]), vars = toks.map(t => t[1]);
    const build = pick => { const us = [], m = {}; let i = 0; toks.forEach(([qq, v]) => { if (qq === '@') { us.push(v); m[v] = v; } else { m[v] = pick(v, [...us], 'fgh'[i], 'abc'[i]); i++; } }); return mat.replace(/[xyz]/g, c => m[c] === undefined ? c : m[c]).replace('P', pn); };
    const right = build((v, us, f, c) => us.length ? `${f}(${us.join(',')})` : c);
    const cand = [build((v, us, f, c) => c), build((v, us, f) => `${f}(${vars.filter(x => x !== v).join(',')})`), build((v, us, f, c) => us.length ? `${f}(${[...us].reverse().join(',')})` : `${f}(${vars[0]})`), build(v => v), build((v, us, f) => `${f}(${vars.join(',')})`), build((v, us, f, c) => us.length ? c : `${f}(${vars.filter(x => x !== v).join(',')})`)];
    const wrong = [...new Set(cand)].filter(x => x !== right).slice(0, 3); if (wrong.length < 3) continue;
    return CHO('skolem', `Skolemize ${pre.replace(/@/g, '∀').replace(/\?/g, '∃')} ${mat.replace('P', pn)} and drop the universal quantifiers.`, ['Each ∃ becomes a function of the ∀ variables before it (a constant if there are none).'], right, wrong, 'Replace every existential variable by a Skolem term.', ['Look at which ∀ quantifiers come before each ∃.', 'An ∃ with no ∀ before it becomes a constant.']);
  }
  return CHO('skolem', 'Skolemize ∀x ∃y P(x,y) and drop the universal quantifiers.', [], 'P(x,f(x))', ['P(x,a)', 'P(x,y)', 'P(f(y),y)'], 'Skolemize.', []);
};
/* composition (Act III) */
WPS.MAXC = { goal: 'max(X, Y)', f: (x, y) => Math.max(x, y), bl: [1, 6, 7, 9, 14, 15], lines: ['begin', 'W := succ(X);', 'W := pred(W);', 'U := 0;', 'while U ≠ Y do', 'begin', 'W := pred(W);', 'U := succ(U);', 'end', 'Z := succ(W);', 'Z := pred(Z);', 'V := 0;', 'while V ≠ Y do', 'begin', 'Z := succ(Z);', 'V := succ(V);', 'end', 'end'] };
WPS.SQ = { goal: 'X * X', f: x => x * x, bl: [1, 2, 5, 8, 9, 11], lines: ['begin', 'Z := 0;', 'U := 0;', 'while U ≠ X do', 'begin', 'V := 0;', 'while V ≠ X do', 'begin', 'V := succ(V);', 'Z := succ(Z);', 'end', 'U := succ(U);', 'end', 'end'] };
QPOOL.push(['If f and g are computable functions, what can we say about g ∘ f?', 'it is computable too', ['it may be uncomputable', 'it is computable only when g = f', 'nothing can be said'], 'Run the program for f, then the program for g on its result.']);
Gen3.tcomp = function (n) {
  const t = Gen3.tier(n), key = Gen.pick(t ? ['pre', 'post', 'cond'] : ['pre', 'post']), C = COMP[key], cells = C.glue.flatMap((r, i) => ['w', 'm', 'n'].map(k => [i, k])), blanks = {};
  Gen.shuffle(cells).slice(0, Math.min(cells.length - 1, 3 + t + (key === 'cond' ? 2 : 0))).forEach(([i, k]) => (blanks[i] = blanks[i] || []).push(k));
  return mkTC(key, blanks, null, `Complete the glue rows so that ${C.name}, with M1 computing x + y.`);
};
/* modes, stats, badges */
const KINDS = { 1: ['circuit', 'table', 'simplify', 'proof', 'classify', 'equiv', 'law'], 2: ['proof', 'model', 'formalize', 'eval', 'unify', 'resolve', 'skolem', 'equiv', 'refute'], 3: ['wfill', 'wtrace', 'ttrace', 'tfill', 'tcomp', 'wmacro', 'quiz'] };
const BOSS = { 1: ['proof', 'simplify', 'circuit'], 2: ['proof', 'refute', 'formalize'], 3: ['tfill', 'wmacro', 'ttrace'] };
const actSt = (s, n) => (s.act || 1) === n ? s : ((s.acts || {})[n] || {});
const ST = (s, k, d) => ((s.stats || {})[k] ?? d);
const BADGES = [
  ['i1', 'Instructed I', 'Finish the Act I instruction', s => actSt(s, 1).unlocked >= ACT[1].levels.length], ['i2', 'Instructed II', 'Finish the Act II instruction', s => actSt(s, 2).unlocked >= ACT[2].levels.length], ['i3', 'Instructed III', 'Finish the Act III instruction', s => actSt(s, 3).unlocked >= ACT[3].levels.length],
  ['s10', 'Survivor', 'Survive 10 tests in one run', s => [1, 2, 3].some(n => (actSt(s, n).bestN || 0) >= 10)], ['s25', 'Veteran', 'Survive 25 tests in one run', s => [1, 2, 3].some(n => (actSt(s, n).bestN || 0) >= 25)],
  ['c10', 'Clean Sweep', '10 clean solves in a row', s => ST(s, 'maxStreak', 0) >= 10], ['all3', 'Triple Threat', 'Solve a chamber in every act', s => [1, 2, 3].every(n => (ST(s, 'solved', {})[n] || 0) > 0)],
  ['boss', 'Boss Slayer', 'Defeat a boss chamber', s => Object.values(ST(s, 'boss', {})).some(Boolean)], ['boss3', 'Grand Slam', 'Defeat all three bosses', s => [1, 2, 3].every(n => ST(s, 'boss', {})[n])], ['flaw', 'Flawless', 'Beat a boss with no hints or strikes', s => ST(s, 'flawless', false)],
  ['d3', 'Daily Habit', 'Daily chamber 3 days in a row', s => ST(s, 'dailyStreak', 0) >= 3], ['rev', 'Studious', 'Finish a review session', s => ST(s, 'reviews', 0) >= 1], ['sbx', 'Tinkerer', 'Run something in the sandbox', s => ST(s, 'sandbox', 0) >= 1], ['arch', 'Architect', 'Reach the Architect rank', s => s.total >= 3000],
];
Object.assign(Game.prototype, {
  stats() { const s = this.save; return s.stats = s.stats || { solved: {}, topics: {}, maxStreak: 0, reviews: 0, boss: {}, flawless: false, dailyStreak: 0, sandbox: 0, badges: {} }; },
  toast(m) { const t = this.$('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(this.tt); this.tt = setTimeout(() => t.classList.remove('on'), 3200); },
  checkBadges() { const st = this.stats(); BADGES.forEach(([id, name, , test]) => { if (!st.badges[id] && test(this.save)) { st.badges[id] = true; this.toast('Badge unlocked: ' + name); } }); this.persist(); },
  recordTopic(ok) {
    const st = this.stats(), k = ACTN + ':' + (this.lv.topic || this.lv.type), t = st.topics[k] = st.topics[k] || { ok: 0, fail: 0 };
    if (ok) { t.ok++; st.solved[ACTN] = (st.solved[ACTN] || 0) + 1; st.maxStreak = Math.max(st.maxStreak, this.save.streak || 0); } else t.fail++;
    this.checkBadges();
  },
  mk(kind, n, act, seed) { seed = seed ?? (Math.random() * 4294967296 >>> 0); const G = act === 1 ? Gen : act === 2 ? Gen2 : Gen3, old = Gen.rng, oldL = Gen.last; Gen.rng = mulberry(seed); Gen.last = null; let lv; try { lv = { title: Gen.pick(NAMES), ...(act === 2 ? { pred: true } : {}), ...G[kind](n) }; } finally { Gen.rng = old; Gen.last = oldL; } lv.topic = lv.topic || kind; lv.act = act; lv.spec = { act, kind, n, seed }; return lv; },
  wkind(act) { const t = this.stats().topics, ks = KINDS[act], w = ks.map(k => { const x = t[act + ':' + k] || { ok: 0, fail: 0 }; return 1 + 3 * x.fail / (1 + x.ok); }); let r = Gen.rng() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < ks.length; i++) { r -= w[i]; if (r <= 0) return ks[i]; } return ks[0]; },
  rvStart(mode, list, blind) { this.closeMenu(); this.rv = { mode, list, i: 0, strikes: 0, blind, solved: 0, flawless: true }; this.rvNext(); },
  rvNext() { const r = this.rv, lv = r.list[r.i]; this.rvLv = lv; this.start(r.blind ? LEVELS.length + 1 : 0); this.$('chamberTitle').textContent = `${{ review: 'Review', daily: 'Daily chamber', boss: 'Boss', custom: 'Custom' }[r.mode]} ${r.i + 1} of ${r.list.length}: ${lv.title}`; this.rvInfo(); },
  rvInfo() { const r = this.rv; this.$('objective').textContent = (this.lv.brief || '') + (r.mode === 'boss' ? `  Strikes: ${r.strikes}/3` : ''); },
  rvWin() {
    const r = this.rv; this.solved = true; sfx('ok'); if (this.hints) r.flawless = false; r.solved++; this.recordTopic(true); this.srsPass(); if (r.mode === 'exam') return this.examNext(true);
    this.$('door').className = 'door open'; this.$('door').lastChild.textContent = 'Exit open'; this.$('nextBtn').hidden = false; this.$('nextBtn').textContent = r.i + 1 >= r.list.length ? 'Finish' : 'Next chamber';
    this.say(`${pick(Q().win)} (${r.i + 1}/${r.list.length})`, 'ok');
  },
  rvFail(msg) { this.recordTopic(false); this.srsFail(); const r = this.rv; if (r && r.mode === 'exam') { sfx('bad'); return this.examNext(false); } this.tf = (this.tf || 0) + 1; if (this.tf >= 2 && !(r && r.mode === 'boss')) this.$('solBtn').hidden = false; if (r && r.mode === 'boss') { r.strikes++; r.flawless = false; this.rvInfo(); if (r.strikes >= 3) { sfx('bad'); return this.rvEnd(false); } } this.fail(msg, 20); },
  rvAdvance() { const r = this.rv; r.i++; if (r.i >= r.list.length) return this.rvEnd(true); this.rvNext(); },
  rvEnd(ok) {
    const r = this.rv, st = this.stats(), sv = this.save, lines = []; let pts = 0;
    if (r.mode === 'review') { pts = 10 * r.solved; st.reviews++; lines.push(`Solved ${r.solved} of ${r.list.length}.`); const w = Object.entries(st.topics).filter(([k]) => +k[0] === ACTN && v(k)).sort((a, b) => b[1].fail - a[1].fail).slice(0, 3).map(([k, x]) => `${k.slice(2)} (${x.fail} missed)`); if (w.length) lines.push('Most missed topics: ' + w.join(', ') + '.'); function v(k) { return st.topics[k].fail > 0; } }
    else if (r.mode === 'daily') { if (ok && !r.peeked) { const d = new Date().toISOString().slice(0, 10), y = new Date(Date.now() - 864e5).toISOString().slice(0, 10); st.dailyStreak = (sv.dailyLast === y ? st.dailyStreak : 0) + 1; sv.dailyLast = d; sv.daily = { date: d, done: true }; pts = 60; lines.push(`Daily streak: ${st.dailyStreak} day(s).`); } else lines.push('The daily chamber stays open: try again.'); }
    else if (ok) { st.boss[ACTN] = true; pts = 150 + (r.flawless ? 100 : 0); if (r.flawless) st.flawless = true; lines.push(r.flawless ? 'Flawless victory.' : 'Boss defeated.'); } else lines.push('Three strikes. The boss stands, for now.');
    sv.total += pts; if (pts) lines.push(`+${pts} points.`);
    else if (r.mode === 'custom') { pts = 5 * r.solved; lines.push(`Solved ${r.solved} of ${r.list.length}.`); }
    const title = { custom: 'Custom pack finished', review: 'Review complete', daily: ok ? 'Daily chamber solved' : 'Daily chamber', boss: ok ? 'Boss defeated' : 'Boss victorious' }[r.mode];
    this.rv = null; this.rvLv = null; this.checkBadges(); this.persist(); this.switchAct(ACTN); this.msg(title, lines);
  },
  dailyStart() {
    const d = new Date().toISOString().slice(0, 10), sv = this.save;
    if (sv.daily && sv.daily.date === d && sv.daily.done) return this.msg('Daily chamber', ["You already solved today's chamber.", `Streak: ${this.stats().dailyStreak} day(s). Come back tomorrow.`]);
    let s = 7; for (const c of d) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    const act = s % 3 + 1, ks = KINDS[act], lv = this.mk(ks[s % ks.length], 9, act, s);
    this.closeMenu(); if (act !== ACTN) this.switchAct(act, false); this.rvStart('daily', [lv], true);
  },
  msg(title, lines, btns = []) {
    this.$('mTitle').textContent = title; const b = this.$('mBody'), g = el('div', { className: 'mgrid' });
    [...btns, ['Close', () => this.closeMenu()]].forEach(([t, f]) => { const x = el('button', { className: 'btn', textContent: t }); x.onclick = f; g.append(x); });
    b.replaceChildren(...lines.map(t => el('p', { textContent: t })), g); this.$('menu').hidden = false;
  },
  closeMenu() { this.$('menu').hidden = true; },
  openMenu() {
    const sv = this.save, diff = sv.diff || 'normal', g = el('div', { className: 'mgrid' }), mkb = (t, s, f) => { const b = el('button', { className: 'btn', innerHTML: `${t}<small>${s}</small>` }); b.onclick = f; return b; };
    g.append(mkb('Review', 'Five chambers from your weakest topics, no penalties', () => this.rvStart('review', this.reviewList(), false)),
      mkb('Daily chamber', `The same chamber for everyone today. Streak: ${this.stats().dailyStreak || 0}`, () => this.dailyStart()),
      mkb('Boss chamber', 'Three hard chambers in a row, no feedback, three strikes', () => this.rvStart('boss', BOSS[ACTN].map(k => this.mk(k, 16, ACTN)), true)),
      mkb('Sandbox', 'Write and run your own While programs and Turing machines', () => this.sbxOpen()),
      mkb('Stats & badges', 'Accuracy by topic, best runs and achievements', () => this.statsOpen()),
      mkb('Difficulty: ' + diff, 'Cycles easy, normal and hard survival (penalties, hints, drain)', () => { sv.diff = { easy: 'normal', normal: 'hard', hard: 'easy' }[diff]; this.persist(); this.openMenu(); }),
      mkb('Show briefing', 'Read the briefing for this chamber again', () => { this.closeMenu(); brief.open(Math.min(this.idx, LESSONS.length - 1)); }),
      mkb('Sound: ' + (muted ? 'off' : 'on'), 'Effects and the announcer voice', () => { document.getElementById('muteBtn').click(); this.openMenu(); }));
    this.$('mTitle').textContent = 'Menu'; this.$('mBody').replaceChildren(g, el('button', { className: 'btn', textContent: 'Close', onclick: () => this.closeMenu() })); this.$('menu').hidden = false;
  },
  statsOpen() {
    const st = this.stats(), sv = this.save, roman = n => ['I', 'II', 'III'][n - 1], bd = el('div', { className: 'badges' });
    BADGES.forEach(([id, name, desc]) => bd.append(el('div', { className: 'bd' + (st.badges[id] ? ' got' : '') }, el('b', { textContent: name }), desc)));
    const t = el('table', { className: 'acc' }); t.append(el('tr', {}, ...['Topic', 'Solved', 'Missed', 'Accuracy'].map(x => el('th', { textContent: x }))));
    Object.entries(st.topics).sort().forEach(([k, x]) => t.append(el('tr', {}, el('td', { textContent: `Act ${roman(+k[0])}: ${k.slice(2)}` }), el('td', { textContent: x.ok }), el('td', { textContent: x.fail }), el('td', { textContent: Math.round(100 * x.ok / Math.max(1, x.ok + x.fail)) + '%' }))));
    const best = [1, 2, 3].map(n => `Act ${roman(n)}: ${actSt(sv, n).bestN || 0} tests`).join('   ');
    this.$('mTitle').textContent = 'Stats & badges';
    this.$('mBody').replaceChildren(el('p', { textContent: `Rank: ${Gen.rank(sv.total)}   Points: ${sv.total}   Best clean streak: ${st.maxStreak}` }), el('p', { textContent: 'Longest survival runs. ' + best }), bd,
      Object.keys(st.topics).length ? t : el('p', { textContent: 'No data yet: solve a few chambers.' }), el('button', { className: 'btn', textContent: 'Back', onclick: () => this.openMenu() })); this.$('menu').hidden = false;
  },
  sbxOpen(tab = 'wp') {
    const root = this.$('sbx').firstElementChild, st = this.stats(); this.$('menu').hidden = true; this.$('sbx').hidden = false;
    root.innerHTML = '<h2>Sandbox</h2><div class="row"><button class="btn" id="sbA">While program</button><button class="btn" id="sbB">Turing machine</button><button class="btn" id="sbC">Close</button></div><div id="sbBody"></div>';
    const q = s => root.querySelector(s), body = q('#sbBody'); q('#sbA').onclick = () => this.sbxOpen('wp'); q('#sbB').onclick = () => this.sbxOpen('tm'); q('#sbC').onclick = () => { this.$('sbx').hidden = true; };
    const out = (t) => { q('#sbOut').textContent = t; st.sandbox++; this.checkBadges(); };
    if (tab === 'wp') {
      body.innerHTML = '<textarea id="sbSrc" spellcheck="false"></textarea><div class="row"><span>Examples:</span><span id="sbEx"></span></div><div class="row">X <input id="sbX" type="number" min="0" value="3"> Y <input id="sbY" type="number" min="0" value="2"> <button class="btn go" id="sbRun">Run</button></div><pre id="sbOut">Statements: V := 0, V := succ(W), V := pred(W), while V ≠ W do …, begin … end. Macros: V := W, V := W + U, V := W ∸ U, V := W * U.</pre>';
      const ta = q('#sbSrc'); ta.value = WPS.ADD.lines.join('\n');
      Object.entries({ ADD: WPS.ADD, MUL: WPS.MUL, MONUS: WPS.MONUS, MAX: WPS.MAXC }).forEach(([n, P]) => { const b = el('button', { className: 'btn', textContent: n }); b.onclick = () => { ta.value = P.lines.join('\n'); }; q('#sbEx').append(b); });
      q('#sbRun').onclick = () => { let o; try { const code = WP.compile(WP.parse(ta.value.split('\n'))), env = { X: +q('#sbX').value || 0, Y: +q('#sbY').value || 0 }; let pc = 0, n = 0; while (pc < code.length) { if (++n > 50000) throw new Error('did not halt within 50000 steps'); pc = WP.step(code[pc], env, pc); } o = `Halted after ${n} steps.\n` + Object.keys(env).sort().map(k => `${k} = ${env[k]}`).join('   '); } catch (e) { o = 'Error: ' + e.message; } out(o); };
    } else {
      body.innerHTML = '<textarea id="sbSrc" spellcheck="false"></textarea><div class="row"><span>Examples:</span><span id="sbEx"></span></div><div class="row">start <input id="sbS" value="q0"> final <input id="sbF" value="q2"> input <input id="sbV" value="2,1"> <button class="btn go" id="sbRun">Run</button></div><pre id="sbOut">One row per line: state read write move next, for example  q0 1 0 R q1  (moves: L R N H).</pre>';
      const ta = q('#sbSrc'), load = D => { ta.value = D.rows.map(r => r.join(' ')).join('\n'); q('#sbS').value = D.init; q('#sbF').value = D.fin.join(','); q('#sbV').value = D.ar === 2 ? '2,1' : '3'; };
      load(TMS.ADD); Object.entries({ ADD: TMS.ADD, PRED: TMS.PRED, DOUBLE: TMS.DOUBLE }).forEach(([n, D]) => { const b = el('button', { className: 'btn', textContent: n }); b.onclick = () => load(D); q('#sbEx').append(b); });
      q('#sbRun').onclick = () => {
        let o; try {
          const rows = ta.value.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#')).map(s => s.split(/[\s,]+/));
          rows.forEach((r, i) => { if (r.length !== 5 || !'01'.includes(r[1]) || !'01'.includes(r[2]) || !'LRNH'.includes(r[3])) throw new Error(`row ${i + 1} must be: state read(0/1) write(0/1) move(L/R/N/H) next`); });
          const M = { init: q('#sbS').value.trim(), fin: q('#sbF').value.split(/[\s,]+/).filter(Boolean), rows: Object.fromEntries(rows.map(r => [r[0] + ',' + r[1], [r[2], r[3], r[4]]])) }, vec = q('#sbV').value.split(/[\s,]+/).filter(Boolean).map(Number);
          if (!vec.length || vec.some(x => !(x >= 0))) throw new Error('input must be natural numbers, e.g. 2,1');
          const t = TMx.run(M, vec, 3000); o = `Result: ${t.final ? t.ones : 'undefined (' + (t.loop ? 'did not halt in 3000 steps' : 'halted in a non-final state') + ')'}   Steps: ${t.n}\n` + t.seq.slice(0, 40).join(' → ') + (t.seq.length > 40 ? ' → …' : '');
        } catch (e) { o = 'Error: ' + e.message; } out(o);
      };
    }
  },
});
document.getElementById('menuBtn').onclick = () => window.game.openMenu();
/* ========== Upgrades: accessibility, worked solutions, exam, spaced review, study sheet, stories, transfer, custom packs ========== */
const STORY = {
  intro1: ['TEST FACILITY, CHAMBER BLOCK A', 'Welcome, test subject. You were selected for your enthusiasm and your convenient lack of a lawyer.', 'Every chamber is a logic puzzle. Solve it and the exit opens. Fail it and the facility will say something unkind.'],
  end1: ['CALIBRATION COMPLETE', 'The instruction phase is over. From the next chamber on, the facility measures your usefulness.', 'Somewhere below, an incinerator hums with anticipation.'],
  intro2: ['ACT II: THE OVERGROWTH', 'Time has passed. Nobody is sure how much. Something green has moved in and made itself at home.', 'The old chambers now speak in quantifiers. For every subject there exists a test.'],
  end2: ['THE QUANTIFIERS FALL SILENT', 'Instruction complete. The ivy has stopped clapping, mostly out of respect.', 'There is one more level below the overgrowth. It is much quieter, and much more precise.'],
  intro3: ['ACT III: THE CORE', 'Beneath the chambers sits the machine that reads the tape. It has been reading since before the facility had a name.', 'It computes. It halts, or it does not. Try to be the former.'],
  end3: ['THE TAPE IS READ', 'Instruction complete. The machine has decided that you are, provisionally, computable.', 'Do not let it go to your head. The tape is long, and it is not finished.'],
};
const TIPS = { circuit: 'Evaluate bottom-up: a gate lights only when its inputs make it true.', table: 'Work column by column, innermost brackets first.', simplify: 'Look for A ∨ ¬A, A ∧ ¬A, double negation and absorption.', proof: 'Plan backwards from the goal; use Assume for → and ¬ goals.', classify: 'Tautology: no F in the column. Contradiction: no T.', equiv: 'Test with truth tables or recall De Morgan, contrapositive and quantifier negation.', law: 'Match the shape of the step to a named law.', model: '∀ is an AND over the domain, ∃ is an OR.', eval: 'Evaluate quantifiers left to right: for each outer value, scan the inner one.', formalize: '∀ pairs with →, ∃ pairs with ∧.', unify: 'Bind variables to matching subterms and check the occurs check.', resolve: 'Unify the complementary literals, then apply the unifier to the rest.', skolem: 'Each ∃ becomes a function of the ∀ variables before it.', refute: 'Resolve pairs until you reach the empty clause.', wtrace: 'Track every variable after each statement; pred(0) = 0.', wfill: 'Trace the program with X = 2, Y = 1 to see what each blank does.', wmacro: 'Expand each macro in your head; X ∸ Y stops at 0.', ttrace: 'Write the tape as a string and apply one row per move.', tfill: 'Run a tiny input by hand and note where the machine goes wrong.', tcomp: 'Glue rows move the head and prepare the tape, then hand over to M1.', quiz: 'Re-read the definitions in the briefings.' };
const prefDefaults = () => ({ lite: (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 2, still: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), hc: false, big: false });
Gen.make = i => Gen.cache[i] || (Gen.cache[i] = (() => { const seed = Math.random() * 4294967296 >>> 0, old = Gen.rng, oldL = Gen.last; Gen.rng = mulberry(seed); Gen.last = null; let lv; try { lv = Gen.build(i - LEVELS.length); } finally { Gen.rng = old; Gen.last = oldL; } lv.spec = { act: ACTN, n: i - LEVELS.length, seed, build: 1 }; return lv; })());
/* keyboard and screen-reader support for every dynamic widget */
const enh = root => root.querySelectorAll('*').forEach(e => {
  if (e.tagName === 'BUTTON') { if (!e.getAttribute('aria-label') && !e.textContent.trim() && e.title) e.setAttribute('aria-label', e.title); if (e.classList.contains('emitter')) e.setAttribute('aria-pressed', String(e.classList.contains('on'))); }
  else if (e.onclick && !e.hasAttribute('tabindex')) { e.tabIndex = 0; e.setAttribute('role', 'button'); e.addEventListener('keydown', k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); e.click(); } }); }
});
['workspace', 'rules', 'ops'].forEach(id => { const n = document.getElementById(id); new MutationObserver(() => enh(n)).observe(n, { childList: true, subtree: true }); });
document.getElementById('workspace').setAttribute('role', 'region'); document.getElementById('workspace').setAttribute('aria-label', 'Puzzle');
document.addEventListener('DOMContentLoaded', () => window.game.applyPrefs());
Object.assign(Game.prototype, {
  applyPrefs() { const p = this.save.prefs = this.save.prefs || prefDefaults(); ['lite', 'still', 'hc'].forEach(k => document.body.classList.toggle(k, !!p[k])); document.documentElement.classList.toggle('big', !!p.big); },
  prefsOpen() {
    const p = this.save.prefs = this.save.prefs || prefDefaults(), g = el('div', { className: 'mgrid' });
    [['lite', 'Lite graphics', 'Hides heavy backgrounds and 3D effects (good for older phones)'], ['still', 'Reduce motion', 'Stops animations and transitions'], ['hc', 'High contrast and colour-blind palette', 'Safe colours, thicker borders, ✓ and ✗ cues'], ['big', 'Large text', 'Scales the whole interface up']].forEach(([k, t, s]) => { const b = el('button', { className: 'btn tog' + (p[k] ? ' on' : ''), innerHTML: `${t}<small>${s}</small>` }); b.onclick = () => { p[k] = !p[k]; this.applyPrefs(); this.persist(); this.prefsOpen(); }; g.append(b); });
    this.$('mTitle').textContent = 'Accessibility & graphics'; this.$('mBody').replaceChildren(g, el('button', { className: 'btn', textContent: 'Back', onclick: () => this.openMenu(1) })); this.$('menu').hidden = false;
  },
  story(kind) {
    const k = kind + ACTN, s = STORY[k]; if (!s || (this.save.story || {})[k]) return false;
    (this.save.story = this.save.story || {})[k] = 1; this.persist();
    const box = this.$('story'), b = this.$('stB'), full = s.slice(1).join('\n\n'); let i = 0; this.$('stT').textContent = s[0]; b.textContent = ''; box.hidden = false; clearInterval(this.stI);
    this.stI = setInterval(() => { b.textContent = full.slice(0, ++i); if (i >= full.length) clearInterval(this.stI); }, 30);
    this.$('stGo').onclick = () => { clearInterval(this.stI); box.hidden = true; if (kind === 'end') this.next(); };
    box.firstElementChild.onclick = e => { if (e.target.id !== 'stGo' && i < full.length) { i = full.length; b.textContent = full; } };
    return true;
  },
  /* spaced review: individual chambers come back on a schedule */
  rebuild(sp) {
    if (sp.idx != null) return ACT[sp.act].levels[sp.idx];
    if (!sp.build) return this.mk(sp.kind, sp.n, sp.act, sp.seed);
    const keep = ACTN, old = Gen.rng, oldL = Gen.last; ACTN = sp.act; Gen.rng = mulberry(sp.seed); Gen.last = null; let lv;
    try { lv = Gen.build(sp.n); } finally { ACTN = keep; Gen.rng = old; Gen.last = oldL; } lv.spec = sp; lv.act = sp.act; return lv;
  },
  srsKeyOf() { const sp = this.lv.spec || (this.idx < LEVELS.length && !this.rv ? { act: ACTN, idx: this.idx } : null); return sp && { sp, k: JSON.stringify(sp) }; },
  srsFail() { const o = this.srsKeyOf(); if (!o) return; (this.save.srs = this.save.srs || {})[o.k] = { spec: o.sp, box: 0, due: Date.now() + 30 * 60e3 }; },
  srsPass() {
    const o = this.srsKeyOf(), t = this.save.srs || {}, k = this.lv.srsKey || (o && o.k); if (!k || !t[k]) return;
    const it = t[k]; it.box++; if (it.box >= 5) { delete t[k]; this.stats().mastered = (this.stats().mastered || 0) + 1; } else it.due = Date.now() + [0, .04, 1, 3, 7, 14][it.box] * 864e5;
  },
  reviewList() {
    const now = Date.now(), list = Object.values(this.save.srs || {}).filter(x => x.due <= now && x.spec.act === ACTN).sort((a, b) => a.due - b.due).slice(0, 3).map(x => { const lv = this.rebuild(x.spec); lv.srsKey = JSON.stringify(x.spec); return lv; });
    while (list.length < 5) list.push(this.mk(this.wkind(ACTN), 6 + 2 * list.length, ACTN)); return list;
  },
  /* worked solutions */
  proofSolution() {
    const lv = this.lv, keep = { lines: this.lines, open: this.open, sel: this.sel, hist: this.hist, pf: this.$('pf').value }, out = [];
    if (!lv.sol) return ['No stored solution for this chamber. Try the hints.'];
    this.drawProof = () => {}; this.say = () => {}; this.fail = () => {};
    this.lines = lv.premises.map(p => ({ f: this.LG.parse(p), why: 'Premise', path: [] })); this.open = []; this.sel = []; this.hist = [];
    try { lv.sol.forEach(([r, l, f]) => { this.sel = l.map(x => x - 1); this.$('pf').value = f || ''; this.applyRule(r); }); this.lines.forEach((l, i) => out.push('   '.repeat(l.path.length) + `${i + 1}. ${this.LG.str(l.f)}    [${l.why}]`)); } catch (e) { out.push('(solution unavailable)'); }
    delete this.drawProof; delete this.say; delete this.fail;
    this.lines = keep.lines; this.open = keep.open; this.sel = keep.sel; this.hist = keep.hist; this.$('pf').value = keep.pf;
    out.push('', 'Rules used:', ...[...new Set(lv.sol.map(s => s[0]))].map(r => `${r}: ${(RL[r] || {}).hint || ''}`)); return out;
  },
  solText() {
    const lv = this.lv, L = [], f = Logic.str;
    switch (lv.type) {
      case 'circuit': { const e = lv.ans || Logic.rows(Logic.vars(this.ast)).find(r => Logic.ev(this.ast, r)), nodes = []; L.push('Set: ' + Object.keys(e).map(k => `${k} = ${e[k] ? 'on' : 'off'}`).join(', ') + '.'); (function w(n) { if (n.t === 'var') return; w(n.a); if (n.b) w(n.b); nodes.push(`${f(n)} = ${Logic.ev(n, e) ? 'T' : 'F'}`); })(this.ast); L.push('Evaluate bottom-up:', ...nodes); break; }
      case 'table': L.push(this.vs.join(' ') + ' | ' + f(this.ast)); this.rows.forEach(r => L.push(this.vs.map(v => r[v] ? 'T' : 'F').join(' ') + ' | ' + (Logic.ev(this.ast, r) ? 'T' : 'F'))); break;
      case 'simplify': L.push('A shorter equivalent: ' + (lv.ans || '(none stored)'), 'Both formulas have the same truth table, so they are equivalent.'); break;
      case 'proof': L.push(...this.proofSolution()); break;
      case 'model': { const s = PModel.all(this.M.sig, this.M.k, M => Pred.ev(this.ast, M) === (lv.want !== false)); L.push('Make these facts true: ' + (Object.entries(s.s).flatMap(([n, S]) => [...S].map(c => `${n}(${c})`)).join(', ') || '(none: leave every lamp off)') + '.'); break; }
      case 'eval': L.push(...this.fs.map((x, i) => `F${i + 1}: ${Pred.ev(x, this.M) ? 'T' : 'F'}`)); break;
      case 'formalize': L.push('Correct answer: ' + 'ABCD'[lv.right] + ') ' + lv.options[lv.right], ...lv.hints.slice(0, -1)); break;
      case 'wtrace': { const env = { ...lv.init }; let pc = 0, k = 0; L.push('Execute statement by statement:'); while (this.code[pc] && k++ < 80) { const c = this.code[pc]; pc = WP.step(c, env, pc); if (c.op === 'set') L.push(`line ${c.ln + 1}: ` + Object.keys(env).filter(v => !/^T\d/.test(v)).sort().map(v => `${v}=${env[v]}`).join(' ')); } L.push(`Final ${lv.ask} = ${lv.ans}.`); break; }
      case 'wfill': Object.entries(lv.blanks).forEach(([i, b], j) => L.push(`Blank ${j + 1} (line ${+i + 1}): ${b.ans}`)); L.push(`Together they compute ${lv.out} = ${lv.goal}.`); break;
      case 'ttrace': { const T = TMx.run(lv.M, lv.vec); L.push('Computation sequence:', T.seq.slice(0, 40).join(' → '), `It halts in ${T.q} with ${T.ones} ones, so the answer is ${lv.ans}.`); break; }
      case 'tfill': { Object.entries(lv.blanks).forEach(([i, ks]) => ks.forEach(k => L.push(`Row ${+i + 1} (${lv.rows[i][0]}, ${lv.rows[i][1]}): ${{ w: 'write', m: 'move', n: 'next state' }[k]} = ${lv.rows[i][{ w: 2, m: 3, n: 4 }[k]]}`))); const v = lv.tests[lv.tests.length - 1][0], M = { init: lv.init, fin: lv.fin, rows: Object.fromEntries(lv.rows.map(r => [r[0] + ',' + r[1], [r[2], r[3], r[4]]])) }; L.push(`Check on input (${v.join(', ')}):`, TMx.run(M, v).seq.join(' → ')); break; }
      case 'refute': L.push(...lv.solText); break;
    }
    return L;
  },
  showSolution() {
    const r = this.rv, run = this.idx >= LEVELS.length && !r && this.save.run; if (r && r.mode === 'exam') return this.examNext(false); if (r && r.mode === 'boss') return;
    if (run) { if (run.v <= 25) return this.say('Not enough usefulness left to buy a solution.', 'bad'); run.v -= 25; this.persist(); this.vit(); }
    this.peeked = true; this.hints += 3; if (r && r.mode === 'daily') r.peeked = true;
    this.msg('Worked solution', this.solText());
  },
  /* exam mode */
  examStart() {
    const list = []; [1, 2, 3].forEach(a => { for (let i = 0; i < (a === 1 ? 4 : 3); i++) list.push(this.mk(this.wkind(a), 10, a)); });
    this.closeMenu(); this.rv = { mode: 'exam', list: Gen.shuffle(list), i: 0, res: [], blind: true, end: Date.now() + 25 * 60e3, solved: 0, flawless: true }; this.examNext(null, true);
  },
  examNext(res, first) {
    const r = this.rv; if (!r) return; if (!first) { r.res.push(!!res); this.solved = true; r.i++; }
    if (r.i >= r.list.length || Date.now() >= r.end) return this.examEnd(); clearTimeout(this.ex); this.ex = setTimeout(() => this.examShow(), first ? 0 : 700);
  },
  examShow() { const r = this.rv; if (!r || r.mode !== 'exam') return; const lv = r.list[r.i]; if (lv.act !== ACTN) applyAct(lv.act); this.rvLv = lv; this.start(LEVELS.length + 1); this.$('chamberTitle').textContent = `Exam ${r.i + 1} of ${r.list.length}: ${lv.title}`; this.$('solBtn').hidden = false; this.$('solBtn').textContent = 'Skip'; this.examTimer(); },
  examTimer() {
    clearInterval(this.exT);
    const upd = () => { const r = this.rv; if (!r || r.mode !== 'exam') return clearInterval(this.exT); const s = Math.max(0, Math.round((r.end - Date.now()) / 1000)); this.$('objective').textContent = `Time left ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}. One attempt per chamber. ${this.lv.brief || ''}`; if (s <= 0) { clearInterval(this.exT); this.examEnd(); } };
    upd(); this.exT = setInterval(upd, 1000);
  },
  examEnd() {
    clearInterval(this.exT); clearTimeout(this.ex); const r = this.rv; if (!r) return; const st = this.stats(), n = r.list.length, ok = r.res.filter(Boolean).length, pct = Math.round(100 * ok / n), per = [1, 2, 3].map(a => { const ix = r.list.map((l, i) => [l, i]).filter(([l]) => l.act === a); return `Act ${['I', 'II', 'III'][a - 1]}: ${ix.filter(([, i]) => r.res[i]).length}/${ix.length}`; });
    st.exams = [...(st.exams || []), { d: new Date().toISOString().slice(0, 10), pct }].slice(-8); this.save.total += ok * 20; const unanswered = n - r.res.length;
    this.rv = null; this.rvLv = null; this.checkBadges(); this.persist(); this.switchAct(this.save.act || 1);
    this.msg('Exam result', [`Score: ${ok} of ${n} (${pct}%)${unanswered ? `, ${unanswered} unanswered` : ''}`, per.join('   '), `+${ok * 20} points.`, pct >= 80 ? 'Distinction.' : pct >= 50 ? 'Pass. Review will help with the rest.' : 'Not yet. Run a review session and try again.']);
  },
  /* study sheet, stats, transfer, custom packs */
  studyOpen() {
    const st = this.stats(), used = st.rules || {}, lines = ['NOTATION', '¬ not   ∧ and   ∨ or   → implies   ↔ iff   ⊢ derives   ∀ for all   ∃ exists', 'While: X := 0, X := succ(Y), X := pred(Y), while X ≠ Y do …', 'Turing: (state, read) → (write, move L/R/N/H, next state)', '', 'INFERENCE RULES (✓ = you have used it)'];
    Object.entries(RL).forEach(([k, v]) => lines.push(`${used[k] ? '✓' : '·'} ${k}: ${v.hint}`));
    const weak = Object.entries(st.topics).filter(([, x]) => x.fail > 0).sort((a, b) => b[1].fail - a[1].fail).slice(0, 6); lines.push('', 'YOUR WEAK SPOTS');
    if (weak.length) weak.forEach(([k, x]) => lines.push(`Act ${['I', 'II', 'III'][+k[0] - 1]} ${k.slice(2)}: ${x.fail} missed, ${x.ok} solved. ${TIPS[k.slice(2)] || ''}`)); else lines.push('Nothing yet. Play some chambers first.');
    const text = lines.join('\n'), row = el('div', { className: 'mgrid' });
    [['Print', () => window.print()], ['Copy text', () => { try { navigator.clipboard.writeText(text); this.toast('Copied'); } catch { this.toast('Select the text to copy it'); } }], ['Back', () => this.openMenu(0)]].forEach(([t, f]) => { const b = el('button', { className: 'btn', textContent: t }); b.onclick = f; row.append(b); });
    this.$('mTitle').textContent = 'Study sheet'; this.$('mBody').replaceChildren(el('p', { textContent: text }), row); this.$('menu').hidden = false;
  },
  statsOpen() {
    const st = this.stats(), sv = this.save, roman = n => ['I', 'II', 'III'][n - 1], bd = el('div', { className: 'badges' }), now = Date.now(), srs = Object.values(sv.srs || {});
    BADGES.forEach(([id, name, desc]) => bd.append(el('div', { className: 'bd' + (st.badges[id] ? ' got' : '') }, el('b', { textContent: name }), desc)));
    const t = el('table', { className: 'acc' }); t.append(el('tr', {}, ...['Topic', 'Solved', 'Missed', 'Accuracy'].map(x => el('th', { textContent: x }))));
    Object.entries(st.topics).sort().forEach(([k, x]) => t.append(el('tr', {}, el('td', { textContent: `Act ${roman(+k[0])}: ${k.slice(2)}` }), el('td', { textContent: x.ok }), el('td', { textContent: x.fail }), el('td', { textContent: Math.round(100 * x.ok / Math.max(1, x.ok + x.fail)) + '%' }))));
    const best = [1, 2, 3].map(n => `Act ${roman(n)}: ${actSt(sv, n).bestN || 0} tests`).join('   ');
    this.$('mTitle').textContent = 'Stats & badges';
    this.$('mBody').replaceChildren(el('p', { textContent: `Rank: ${Gen.rank(sv.total)}   Points: ${sv.total}   Best clean streak: ${st.maxStreak}` }), el('p', { textContent: 'Longest survival runs. ' + best }),
      el('p', { textContent: `Spaced review: ${srs.filter(x => x.due <= now).length} due now, ${srs.length} waiting, ${st.mastered || 0} mastered.` + ((st.exams || []).length ? `   Exams: ${st.exams.map(e => e.pct + '%').join(', ')}` : '') }), bd,
      Object.keys(st.topics).length ? t : el('p', { textContent: 'No data yet: solve a few chambers.' }), el('button', { className: 'btn', textContent: 'Back', onclick: () => this.openMenu(0) })); this.$('menu').hidden = false;
  },
  transferOpen() {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(this.save)))), out = el('textarea', { className: 'xfer', value: code, readOnly: true }), inp = el('textarea', { className: 'xfer', placeholder: 'Paste a save code here to import' }), msg = el('p', { textContent: 'Copy this code to move your progress to another device. Importing replaces the progress on this one.' }), row = el('div', { className: 'mgrid' });
    const btn = (t, f) => { const b = el('button', { className: 'btn', textContent: t }); b.onclick = f; row.append(b); };
    btn('Copy my code', () => { try { navigator.clipboard.writeText(code); this.toast('Copied'); } catch { out.select(); } });
    btn('Import code', () => { try { const o = JSON.parse(decodeURIComponent(escape(atob(inp.value.trim())))); if (!o || typeof o.total !== 'number' || typeof o.best !== 'object') throw 0; this.save = o; this.persist(); this.rv = null; this.rvLv = null; applyAct(o.act || 1); this.applyPrefs(); this.closeMenu(); this.start(o.unlocked >= LEVELS.length ? (o.run ? o.run.idx : LEVELS.length) : o.unlocked); this.toast('Progress imported'); } catch { msg.textContent = 'That is not a valid save code.'; } });
    btn('Back', () => this.openMenu(1)); this.$('mTitle').textContent = 'Save & transfer'; this.$('mBody').replaceChildren(msg, out, inp, row); this.$('menu').hidden = false;
  },
  customBuild(txt) {
    const o = JSON.parse(txt), arr = Array.isArray(o) ? o : o.chambers, errs = [], list = []; let act = Array.isArray(o) ? 1 : (o.act || 1);
    if (!Array.isArray(arr) || !arr.length) throw new Error('expected a list of chambers');
    arr.forEach((c, i) => {
      try {
        const base = { title: c.title || `Custom ${i + 1}`, topic: 'custom', hints: c.hints || [c.hint || 'No hint provided for this chamber.'] };
        if (c.type === 'quiz') { if (!Array.isArray(c.options) || c.options.length < 2 || c.options.length > 4 || !(c.right >= 0 && c.right < c.options.length)) throw new Error('a quiz needs 2 to 4 options and a valid "right" index'); list.push({ ...base, type: 'formalize', plain: true, brief: c.brief || 'Answer the question.', sentence: String(c.question), legend: [], options: c.options.map(String), right: c.right }); }
        else if (['table', 'circuit', 'simplify'].includes(c.type)) { Logic.parse(c.formula); list.push({ ...base, type: c.type, formula: c.formula, brief: c.brief || { table: 'Complete the truth table.', circuit: 'Power the exit.', simplify: 'Write a shorter equivalent formula.' }[c.type] }); }
        else if (c.type === 'proof') { const L = c.pred ? Pred : Logic; if (c.pred) act = 2; (c.premises || []).forEach(p => L.parse(p)); L.parse(c.goal); (c.rules || []).forEach(r => { if (!RL[r]) throw new Error('unknown rule ' + r); }); list.push({ ...base, type: 'proof', pred: !!c.pred, premises: c.premises || [], goal: c.goal, rules: c.rules || Object.keys(RL), brief: c.brief || 'Derive the goal.' }); }
        else throw new Error('type must be quiz, table, circuit, simplify or proof');
      } catch (e) { errs.push(`Chamber ${i + 1}: ${e.message}`); }
    });
    if (errs.length) throw new Error('\n' + errs.join('\n')); return { act, list };
  },
  customOpen() {
    const ex = JSON.stringify({ title: 'My pack', act: 1, chambers: [{ type: 'quiz', title: 'Law check', question: 'Which law says ¬(A ∧ B) ≡ ¬A ∨ ¬B?', options: ['De Morgan', 'Absorption', 'Distributivity'], right: 0, hint: 'It has a name.' }, { type: 'table', title: 'Implication', formula: 'P -> Q' }, { type: 'proof', title: 'Chain', premises: ['p -> q', 'q -> r', 'p'], goal: 'r', rules: ['→E'] }] }, null, 1);
    const ta = el('textarea', { className: 'xfer', value: this.save.custom || '', placeholder: 'Paste a JSON pack here', spellcheck: false }), msg = el('p', { textContent: 'Chamber types: quiz, table, circuit, simplify, proof. Proofs may set "pred": true for Act II rules.' }), row = el('div', { className: 'mgrid' });
    const btn = (t, f) => { const b = el('button', { className: 'btn', textContent: t }); b.onclick = f; row.append(b); };
    btn('Load example', () => { ta.value = ex; });
    btn('Check & play', () => { try { const { act, list } = this.customBuild(ta.value); this.save.custom = ta.value; this.persist(); this.closeMenu(); if (ACTN !== act) this.switchAct(act, false); this.rvStart('custom', list, false); } catch (e) { msg.textContent = 'Problem: ' + e.message; } });
    btn('Back', () => this.openMenu(1)); this.$('mTitle').textContent = 'Custom chambers'; this.$('mBody').replaceChildren(msg, ta, row); this.$('menu').hidden = false;
  },
  openMenu(page = 0) {
    const sv = this.save, diff = sv.diff || 'normal', g = el('div', { className: 'mgrid' }), mkb = (t, s, f) => { const b = el('button', { className: 'btn', innerHTML: `${t}<small>${s}</small>` }); b.onclick = f; return b; };
    const due = Object.values(sv.srs || {}).filter(x => x.due <= Date.now() && x.spec.act === ACTN).length;
    if (!page) g.append(
      mkb('Review', `Chambers you missed come back on a schedule, then weak topics. ${due} due now`, () => this.rvStart('review', this.reviewList(), false)),
      mkb('Daily chamber', `The same chamber for everyone today. Streak: ${this.stats().dailyStreak || 0}`, () => this.dailyStart()),
      mkb('Boss chamber', 'Three hard chambers, no feedback, three strikes', () => this.rvStart('boss', BOSS[ACTN].map(k => this.mk(k, 16, ACTN)), true)),
      mkb('Exam mode', 'Ten chambers from all three acts, 25 minutes, one attempt each', () => this.examStart()),
      mkb('Sandbox', 'Write and run your own While programs and Turing machines', () => this.sbxOpen()),
      mkb('Study sheet', 'Notation, rules and tips for your weak topics. Printable', () => this.studyOpen()),
      mkb('Stats & badges', 'Accuracy by topic, spaced review, best runs and achievements', () => this.statsOpen()),
      mkb('More…', 'Difficulty, accessibility, custom chambers, save transfer', () => this.openMenu(1)));
    else g.append(
      mkb('Difficulty: ' + diff, 'Cycles easy, normal and hard survival (penalties, hints, drain)', () => { sv.diff = { easy: 'normal', normal: 'hard', hard: 'easy' }[diff]; this.persist(); this.openMenu(1); }),
      mkb('Announcer voice: ' + (voiceOn ? 'on' : 'off'), 'Spoken lines at key moments only (welcome, act starts, disposal)', () => { setVoice(!voiceOn); this.openMenu(1); }),
      mkb('Accessibility & graphics', 'Lite graphics, reduced motion, colour-blind palette, large text', () => this.prefsOpen()),
      mkb('Custom chambers', 'Play your own quizzes, tables and proofs from a text pack', () => this.customOpen()),
      mkb('Save & transfer', 'Move your progress to another device with a code', () => this.transferOpen()),
      mkb('Show briefing', 'Read the briefing for this chamber again', () => { this.closeMenu(); brief.open(Math.min(this.idx, LESSONS.length - 1)); }),
      mkb('Sound: ' + (muted ? 'off' : 'on'), 'Effects and the announcer voice', () => { document.getElementById('muteBtn').click(); this.openMenu(1); }),
      mkb('Back', 'Return to the main menu', () => this.openMenu(0)));
    this.$('mTitle').textContent = page ? 'More' : 'Menu'; this.$('mBody').replaceChildren(g, el('button', { className: 'btn', textContent: 'Close', onclick: () => this.closeMenu() })); this.$('menu').hidden = false;
  },
});
document.getElementById('solBtn').onclick = () => window.game.showSolution();
BADGES.push(['exam', 'Examinee', 'Score 80% or more in an exam', s => (ST(s, 'exams', []) || []).some(e => e.pct >= 80)], ['mast', 'Mastery', 'Master a chamber through spaced review', s => ST(s, 'mastered', 0) >= 1]);
/* ========== Content layer: resolution refutation, macros, Boolean-algebra laws ========== */
WP.tc = 0;
WP.macro = (z, x, op, y, ln) => {
  const S = (v, k, of) => ({ t: 'set', v, k, of, ln }), B = l => ({ t: 'block', list: l }), W = (a, b, body) => ({ t: 'while', a, b, body, ln }), id = () => 'T' + (++WP.tc), cp = (d, s) => [S(d, 'succ', s), S(d, 'pred', d)];
  const r = id(), c = id(), s = id(); if (!op) return B(cp(z, x));
  if (op === '+') return B([...cp(r, x), S(c, 'zero'), W(c, y, B([S(r, 'succ', r), S(c, 'succ', c)])), ...cp(z, r)]);
  if (op === '∸' || op === '-') return B([...cp(r, x), S(c, 'zero'), W(c, y, B([S(r, 'pred', r), S(c, 'succ', c)])), ...cp(z, r)]);
  return B([S(r, 'zero'), S(c, 'zero'), W(c, y, B([S(s, 'zero'), W(s, x, B([S(s, 'succ', s), S(r, 'succ', r)])), S(c, 'succ', c)])), ...cp(z, r)]);
};
const WPM = {
  MAXM: { goal: 'max(X, Y)', f: (x, y) => Math.max(x, y), bl: [1, 2], lines: ['begin', 'T := X ∸ Y;', 'Z := T + Y;', 'end'] },
  SQX: { goal: 'X * X + X', f: x => x * x + x, bl: [1, 2], lines: ['begin', 'T := X * X;', 'Z := T + X;', 'end'] },
  CUBE: { goal: 'X * X * X', f: x => x ** 3, bl: [1, 2], lines: ['begin', 'T := X * X;', 'Z := T * X;', 'end'] },
  TWICE: { goal: '2 * (X + Y)', f: (x, y) => 2 * (x + y), bl: [1, 2], lines: ['begin', 'T := X + Y;', 'Z := T + T;', 'end'] },
  MIXED: { goal: '(X ∸ Y) + Y * X', f: (x, y) => Math.max(0, x - y) + y * x, bl: [1, 2, 3], lines: ['begin', 'T := X ∸ Y;', 'U := Y * X;', 'Z := T + U;', 'end'] },
};
const distractM = a => { const [, L, A, op, B] = a.match(/^(\w+) := (\w+) ([+∸*]) (\w+);$/), ops = ['+', '∸', '*'].filter(o => o !== op); return [`${L} := ${A} ${ops[0]} ${B};`, `${L} := ${B} ${op} ${A};`, `${L} := ${A} ${ops[1]} ${B};`, `${L} := ${A};`, `${L} := ${A} ${op} ${A};`].filter(x => x !== a).slice(0, 3); };
const mkWM = (key, idxs, title, brief, rnd) => {
  const P = WPM[key], blanks = {}, hints = ['Expand each macro in your head: X ∸ Y is 0 when Y > X.'];
  idxs.forEach((i, j) => { const ans = P.lines[i], at = rnd ? Gen.r(4) : (j + 1) % 4, o = distractM(ans); o.splice(at, 0, ans); blanks[i] = { opts: o, ans }; hints.push(`Blank ${j + 1} (line ${i + 1}): ${ans}`); });
  return { type: 'wfill', topic: 'wmacro', title, brief, lines: P.lines, blanks, tests: WTESTS, out: 'Z', f: P.f, goal: P.goal, hints };
};
Gen3.wmacro = function (n) { const t = Gen3.tier(n), key = Gen.pick(t ? ['MIXED', 'CUBE', 'TWICE', 'MAXM'] : ['MAXM', 'SQX', 'TWICE']); return mkWM(key, Gen.shuffle(WPM[key].bl).slice(0, 2 + (t && WPM[key].bl.length > 2 ? 1 : 0)), null, `Use the macros: complete the statements so that Z = ${WPM[key].goal}.`, true); };
LEVELS3.push(mkWM('MAXM', [1, 2], 'Macro Magic', 'Use the macros from the notes: complete the two statements so that Z = max(X, Y).'));
{ const surv = LESSONS3[12]; LESSONS3[12] = { t: 'Act III, briefing 13: Macros', steps: [
  { h: 'In the notes, <code>Z := X</code>, <code>Z := X + Y</code>, <code>Z := X ∸ Y</code> and <code>Z := X * Y</code> are <b>macros</b>: abbreviations of the programs you built in chambers 3 to 5. This lab expands them for you, so you can use them as single statements.', sel: '#workspace' },
  { h: 'Complete the two statements so that the program computes <code>max(X, Y)</code>. First compute <code>X ∸ Y</code>, which is 0 when Y is bigger, then add Y back.' }] }; LESSONS3[13] = surv; }
/* resolution refutation (Act II) */
const RES = {
  ren: (c, sfx) => c.map(l => ({ ...l, a: l.a.map(function r(t) { return t.t === 'v' ? TT.v(t.n + sfx) : { ...t, a: t.a.map(r) }; }) })),
  ls: l => (l.neg ? '¬' : '') + l.n + '(' + l.a.map(TT.str).join(',') + ')',
  cs: c => c.length ? '{' + c.map(RES.ls).join(', ') + '}' : '□',
  key: c => [...new Set(c.map(RES.ls))].sort().join('|'),
  dedupe: c => { const s = new Set(); return c.filter(l => { const k = RES.ls(l); return s.has(k) ? false : (s.add(k), true); }); },
  resolve(c1, c2) {
    const d = RES.ren(c2, "'"), out = [];
    c1.forEach((l1, i) => d.forEach((l2, j) => {
      if (l1.neg === l2.neg || l1.n !== l2.n || l1.a.length !== l2.a.length) return;
      let s = {}; for (let k = 0; k < l1.a.length && s; k++) s = TT.unify(l1.a[k], l2.a[k], s); if (!s) return;
      const ap = l => ({ ...l, a: l.a.map(t => TT.apply(t, s)) });
      out.push(RES.dedupe([...c1.filter((_, x) => x !== i), ...d.filter((_, x) => x !== j)].map(ap)));
    }));
    return out;
  },
};
const lit = (neg, nm, ...a) => ({ neg, n: nm, a });
Gen2.refute = function (n) {
  const L = 2 + Math.min(2, Math.floor(n / 8)), ps = Gen.shuffle(['P', 'Q', 'R', 'S', 'T']).slice(0, L + 1), fs = ['f', 'g', 'f', 'g'], fact = [lit(false, ps[0], TT.f('a'))], rules = [];
  for (let i = 0; i < L; i++) rules.push([lit(true, ps[i], TT.v('x')), lit(false, ps[i + 1], TT.f(fs[i], TT.v('x')))]);
  const goal = [lit(true, ps[L], TT.v('y'))], junk = [[lit(false, 'U', TT.v('x')), lit(true, 'V', TT.f('f', TT.v('x')))], [lit(false, 'V', TT.f('b'))]], all = Gen.shuffle([fact, ...rules, goal, ...junk.slice(0, n > 8 ? 2 : 1)]);
  const at = c => all.indexOf(c) + 1, steps = []; let cur = at(fact), next = all.length + 1; rules.forEach(r => { steps.push([cur, at(r)]); cur = next++; }); steps.push([cur, at(goal)]);
  return { type: 'refute', topic: 'refute', brief: 'Derive the empty clause □ by resolution.', clauses: all, sol: steps, hints: ['Look for a unit clause: it can be resolved against a clause containing the complementary literal.', ...steps.map(([a, b], k) => `Step ${k + 1}: select clauses ${a} and ${b}, then press Resolve.`)], solText: ['Resolution chain:', ...steps.map(([a, b], k) => `${all.length + k + 1}. Resolve ${a} and ${b}${k === steps.length - 1 ? ': the empty clause □' : ''}`)] };
};
{ const x = TT.v('x'), y = TT.v('y'), cl = [[lit(true, 'P', x), lit(false, 'Q', TT.f('f', x))], [lit(false, 'P', TT.f('a'))], [lit(true, 'Q', y)]];
  LEVELS2.push({ type: 'refute', topic: 'refute', title: 'The Empty Clause', brief: 'Derive the empty clause □: select two clauses with complementary literals, then press Resolve.', clauses: cl, sol: [[1, 2], [4, 3]], hints: ['Resolve clauses 1 and 2: P(x) and P(a) unify with x/a.', 'Then resolve the new clause 4 with clause 3: Q(f(a)) and Q(y) unify with y/f(a).'], solText: ['Resolution chain:', '4. Resolve 1 and 2: {Q(f(a))}', '5. Resolve 4 and 3: the empty clause □'] });
  const surv = LESSONS2[9]; LESSONS2[9] = { t: 'Act II, briefing 10: Resolution', steps: [
    { h: 'Resolution works on <b>clauses</b>: sets of literals read as a disjunction. The empty clause <code>□</code> is false, so deriving it shows that the whole set is unsatisfiable.', sel: '#workspace' },
    { h: 'To resolve two clauses, pick <code>L</code> in one and <code>¬L′</code> in the other where <code>L</code> and <code>L′</code> <b>unify</b> with unifier σ. The resolvent is the remaining literals of both clauses with σ applied. Variables are renamed apart for you.' },
    { h: 'Select two clauses and press <b>Resolve</b>. Some clauses are distractions: aim for <code>□</code>.' }] }; LESSONS2[10] = surv; }
Object.assign(Game.prototype, {
  initRefute() { this.rl = this.lv.clauses.map(c => ({ c, why: 'Given' })); this.sel = []; this.drawRef(); },
  drawRef() {
    const ws = this.$('workspace'), lv = this.lv, ul = el('ul', { className: 'lines' }), camp = this.idx < LEVELS.length;
    this.rl.forEach((l, i) => { const li = el('li', { className: (this.sel.includes(i) ? 'sel ' : '') + (camp && !l.c.length ? 'goal' : '') }); li.append(el('span', { textContent: i + 1 }), el('span', { textContent: RES.cs(l.c) }), el('em', { textContent: l.why })); li.onclick = () => { this.sel = this.sel.includes(i) ? this.sel.filter(x => x !== i) : [...this.sel, i].slice(-2); this.drawRef(); }; ul.append(li); });
    ws.replaceChildren(el('p', { className: 'goalbar', textContent: 'Derive the empty clause □ from these clauses.' }), ul, this.ctl([['Resolve selected', () => this.refResolve()], ['Undo', () => { if (this.rl.length > lv.clauses.length) this.rl.pop(); this.sel = []; this.drawRef(); }]]),
      el('p', { className: 'tip', textContent: 'Select two clauses with complementary literals (P and ¬P with unifiable arguments) and press Resolve. Variables are renamed apart for you.' }));
  },
  refResolve() {
    if (this.sel.length !== 2) return this.say('Select exactly two clauses.', 'bad');
    const [i, j] = this.sel, rs = RES.resolve(this.rl[i].c, this.rl[j].c).filter(c => !c.some(l => c.some(m => m.neg !== l.neg && RES.ls({ ...m, neg: false }) === RES.ls({ ...l, neg: false }))));
    if (!rs.length) return void this.fail('Those clauses have no complementary literals that unify.');
    const c = rs[0]; if (this.rl.some(l => RES.key(l.c) === RES.key(c))) return this.say('That clause has already been derived.', 'bad');
    sfx('click'); this.rl.push({ c, why: `Res ${i + 1}, ${j + 1}` }); this.sel = []; this.drawRef();
    this.say(this.idx < LEVELS.length && !c.length ? 'The empty clause! Press Run test.' : 'Resolvent added: ' + RES.cs(c));
  },
});
/* Boolean-algebra laws (Act I) */
const LAWS = [['De Morgan', '!(A & B)', '!A | !B'], ['De Morgan', '!(A | B)', '!A & !B'], ['Absorption', 'A | (A & B)', 'A'], ['Absorption', 'A & (A | B)', 'A'], ['Distributivity', 'A & (B | C)', '(A & B) | (A & C)'], ['Distributivity', 'A | (B & C)', '(A | B) & (A | C)'], ['Double negation', '!!A', 'A'], ['Implication', 'A -> B', '!A | B'], ['Contraposition', 'A -> B', '!B -> !A'], ['Commutativity', 'A & B', 'B & A'], ['Commutativity', 'A | B', 'B | A'], ['Associativity', '(A & B) & C', 'A & (B & C)'], ['Idempotence', 'A & A', 'A'], ['Idempotence', 'A | A', 'A']];
Gen.law = function (n) {
  const [name, l, r] = Gen.pick(LAWS), pool = Gen.shuffle(['P', 'Q', 'R', '!P', '(Q & R)', '(P | R)']).slice(0, 3), sub = s => s.replace(/[ABC]/g, c => pool['ABC'.indexOf(c)]);
  const L = Logic.parse(sub(l)), R = Logic.parse(sub(r)); if (!Logic.equivalent(L, R)) throw new Error('law instance not equivalent');
  const names = [...new Set(LAWS.map(x => x[0]))].filter(x => x !== name);
  return CHO('law', `Which law justifies  ${Logic.str(L)} ≡ ${Logic.str(R)} ?`, ['Laws: De Morgan, absorption, distributivity, double negation, implication, contraposition, commutativity, associativity, idempotence.'], name, Gen.shuffle(names).slice(0, 3), 'Name the law applied in this step.', ['Look at how the connectives and negations changed.']);
};
try { const sv = JSON.parse(localStorage.getItem('apl-save2')); if (sv && (sv.act === 2 || sv.act === 3)) applyAct(sv.act); } catch {}
document.getElementById('bNext').onclick = () => brief.step(1);
document.getElementById('bBack').onclick = () => brief.step(-1);
document.getElementById('helpBtn').onclick = () => brief.open(window.game.idx);
