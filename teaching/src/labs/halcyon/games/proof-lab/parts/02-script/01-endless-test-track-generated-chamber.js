/* ========== Endless test track: generated chambers ========== */
const NAMES = ['Overflow Bay', 'Dead Branch', 'Loopback', 'Null Gate', 'Fork Room', 'Stack Frame', 'Race Condition', 'Cold Cache', 'Off-By-One', 'Deadlock Annex', 'Heap Garden', 'Segfault Hall'];
// [tier, premises, goal, rules, solution steps [rule, lines, formula], note]; X Y Z W become random letters
const TPL = [
  [0, ['X & Y', 'Z'], 'Y & Z', ['∧E', '∧I'], [['∧E', [1]], ['∧I', [4, 2]]]],
  [0, ['X -> Y', 'X'], 'Y | Z', ['→E', '∨I'], [['→E', [1, 2]], ['∨I', [3], 'Z']]],
  [0, ['X -> (Y -> Z)', 'X', 'Y'], 'Z', ['→E'], [['→E', [1, 2]], ['→E', [4, 3]]]],
  [0, ['X & Y', 'Z'], '(X & Z) & Y', ['∧E', '∧I'], [['∧E', [1]], ['∧I', [3, 2]], ['∧I', [5, 4]]]],
  [0, ['X <-> Y', 'X'], 'Y', ['↔E', '→E'], [['↔E', [1]], ['→E', [3, 2]]], '↔E turns A ↔ B into A → B and B → A.'],
  [0, ['X -> Y', 'Y -> X'], 'X <-> Y', ['↔I'], [['↔I', [1, 2]]], '↔I joins A → B and B → A into A ↔ B.'],
  [1, ['X | Y', 'X -> Z', 'Y -> Z'], 'Z', ['∨E'], [['∨E', [1, 2, 3]]], '∨E: from A ∨ B, A → C and B → C conclude C. Select all three lines.'],
  [1, ['X -> Y', 'Y -> Z', 'Z -> W'], 'X -> W', ['Assume', '→E', '→I'], [['Assume', [], 'X'], ['→E', [1, 4]], ['→E', [2, 5]], ['→E', [3, 6]], ['→I', []]]],
  [1, ['X -> Y', '!Y'], '!X', ['Assume', '→E', '∧I', '¬I'], [['Assume', [], 'X'], ['→E', [1, 3]], ['∧I', [4, 2]], ['¬I', []]]],
  [1, ['!!X'], 'X', ['Assume', '∧I', '¬E'], [['Assume', [], '!X'], ['∧I', [2, 1]], ['¬E', []]]],
  [2, ['X & Y -> Z'], 'X -> (Y -> Z)', ['Assume', '∧I', '→E', '→I'], [['Assume', [], 'X'], ['Assume', [], 'Y'], ['∧I', [2, 3]], ['→E', [1, 4]], ['→I', []], ['→I', []]]],
  [2, ['X -> !Y', 'Z -> Y'], '!(X & Z)', ['Assume', '∧E', '→E', '∧I', '¬I'], [['Assume', [], 'X & Z'], ['∧E', [3]], ['→E', [1, 4]], ['→E', [2, 5]], ['∧I', [6, 7]], ['¬I', []]]],
  [2, ['!X'], 'X -> Y', ['Assume', '∧I', '¬E', '→I'], [['Assume', [], 'X'], ['Assume', [], '!Y'], ['∧I', [2, 1]], ['¬E', []], ['→I', []]]],
  [2, ['X -> Y'], '!Y -> !X', ['Assume', '→E', '∧I', '¬I', '→I'], [['Assume', [], '!Y'], ['Assume', [], 'X'], ['→E', [1, 3]], ['∧I', [4, 2]], ['¬I', []], ['→I', []]]],
];
const Gen = {
  cache: {}, last: null,
  RANKS: [[0, 'Test Subject'], [300, 'Technician'], [800, 'Engineer'], [1600, 'Logician'], [3000, 'Architect'], [6000, 'Proof Master']],
  rng: Math.random, r: n => Math.floor(Gen.rng() * n), pick: a => a[Gen.r(a.length)],
  shuffle: a => a.map(x => [Gen.rng(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]),
  rank: t => Gen.RANKS.filter(r => t >= r[0]).pop()[1],
  make(i) { return Gen.cache[i] || (Gen.cache[i] = Gen.build(i - LEVELS.length)); },
  build(n) { const kind = ['circuit', 'proof', 'table', 'proof', 'simplify', 'proof', 'classify', 'equiv', 'law'][n % 9]; return { title: Gen.pick(NAMES), ...Gen[kind](n) }; },
  form(vs, d) {
    if (d === 0) { const v = { t: 'var', n: Gen.pick(vs) }; return Gen.r(3) ? v : N(v); }
    return { t: Gen.pick(['and', 'or', 'imp', 'and', 'or', 'iff']), a: Gen.form(vs, d - 1), b: Gen.form(vs, d - 1) };
  },
  bloat(f, vs) {
    const Y = { t: 'var', n: Gen.pick(vs) };
    if (f.t !== 'var' && f.t !== 'not' && Gen.r(2)) return Gen.r(2) ? { ...f, a: Gen.bloat(f.a, vs) } : { ...f, b: Gen.bloat(f.b, vs) };
    return Gen.pick([x => ({ t: 'or', a: x, b: { t: 'and', a: x, b: Y } }), x => ({ t: 'and', a: x, b: { t: 'or', a: x, b: Y } }), x => N(N(x)),
      x => ({ t: 'or', a: x, b: { t: 'and', a: Y, b: N(Y) } }), x => ({ t: 'and', a: x, b: { t: 'or', a: Y, b: N(Y) } })])(f);
  },
  circuit(n) {
    const vs = ['P', 'Q', 'R', 'S', 'T'].slice(0, Math.min(5, 3 + Math.floor(n / 8)));
    for (let k = 0; k < 500; k++) {
      const f = Gen.form(vs, 2), rows = Logic.rows(Logic.vars(f)), ok = rows.filter(e => Logic.ev(f, e));
      if (Logic.vars(f).length === vs.length && ok.length && ok.length <= rows.length / 2.5 && !Logic.ev(f, rows[rows.length - 1])) {
        const ans = Gen.pick(ok);
        return { type: 'circuit', brief: 'Find the switch setting that powers the exit.', formula: Logic.str(f), ans, hints: vs.map(v => `Set ${v} ${ans[v] ? 'on' : 'off'}.`) };
      }
    }
    return { type: 'circuit', brief: 'Find the switch setting that powers the exit.', formula: '(P -> Q) & P & !R', ans: { P: true, Q: true, R: false }, hints: ['P on, Q on, R off.'] };
  },
  table(n) {
    const vs = ['P', 'Q', 'R'].slice(0, n > 4 ? 3 : 2);
    for (let k = 0; k < 500; k++) {
      const f = Gen.form(vs, 2), v = Logic.rows(vs).map(e => Logic.ev(f, e));
      if (Logic.vars(f).length === vs.length && v.includes(true) && v.includes(false) && Logic.size(f) >= 5)
        return { type: 'table', brief: 'Complete the truth table. Work from the innermost brackets outwards.', formula: Logic.str(f), hints: ['Evaluate the innermost brackets first.', `The first row (all true) is ${v[0] ? 'T' : 'F'}.`, `The last row (all false) is ${v[v.length - 1] ? 'T' : 'F'}.`] };
    }
    return { type: 'table', brief: 'Complete the truth table.', formula: 'P -> Q', hints: ['Only T then F gives F.'] };
  },
  simplify(n) {
    const vs = ['A', 'B', 'C'].slice(0, 2 + (n > 12 ? 1 : 0));
    for (let k = 0; k < 500; k++) {
      const core = Gen.form(vs, 1); if (Logic.vars(core).length < 2) continue;
      let big = core; for (let j = 0, m = 2 + (n > 6) + (n > 14); j < m; j++) big = Gen.bloat(big, vs);
      if (Logic.size(big) >= Logic.size(core) + 4 && Logic.equivalent(big, core))
        return { type: 'simplify', brief: 'Rewrite it as an equivalent, shorter formula. Look for always-true or always-false parts, double negations and absorption.', formula: Logic.str(big), ans: Logic.str(core),
          hints: ['Spot the redundant part: something like A ∨ (A ∧ B), a double negation, or B ∧ ¬B.', `The simplest form has ${Logic.size(core)} symbols.`, `One answer: ${Logic.str(core)}.`] };
    }
    return { type: 'simplify', brief: 'Rewrite it as a shorter equivalent.', formula: 'A | (!A & B)', ans: 'A ∨ B', hints: ['Try A ∨ B.'] };
  },
  proof(n) {
    const tier = Math.min(2, Math.floor(n / 8)), t = Gen.last = Gen.pick(TPL.filter(x => x[0] <= tier && x !== Gen.last));
    const L = Gen.shuffle(['p', 'q', 'r', 's']), sub = s => s.replace(/[XYZW]/g, c => L['XYZW'.indexOf(c)]);
    const sol = t[4].map(([r, l, f]) => [r, l, f && sub(f)]), fm = f => Logic.str(Logic.parse(f));
    const hints = sol.map(([r, l, f], i) => `Step ${i + 1}: ` + (r === 'Assume' ? `tap ${fm(f)} in the formula box, then click Assume`
      : `click ${r}${l.length ? ' with line' + (l.length > 1 ? 's ' : ' ') + l.join(' and ') + ' selected' : ' to close the open sub-proof'}${f ? ', after tapping ' + fm(f) + ' in the formula box' : ''}`) + '.');
    return { type: 'proof', brief: 'Derive the goal from the premises. ' + (t[5] || ''), premises: t[1].map(sub), goal: sub(t[2]), rules: t[3], hints, sol };
  },
};
const DOOM = {
  mid: ['Usefulness assessment: declining. The facility is taking notes.', 'Your error rate has been forwarded to the disposal department.', 'Statistically, you are becoming a liability.'],
  low: ['Warning: disposal threshold approaching. Please be useful.', 'The incinerator has been preheated. Purely as a precaution.', 'You are one mistake away from becoming a cautionary tale.'],
};
LESSONS[LEVELS.length] = { t: 'Survival protocol', steps: [
  { h: '<b>Instruction is over.</b> From now on the facility measures your <b>usefulness</b> (the bar at the top). A wrong test costs 20, a rejected rule costs 8, a hint costs 10, and the machine’s patience slowly drains with time.', sel: '#vit' },
  { h: 'Every solved test restores usefulness: +15, or +25 with no hints and no errors. The longer your run, the less each success restores. If it reaches zero you are <b>disposed of</b> and the run ends. Nothing lights up to tell you that you are right: you only find out when you press <b>Run test</b>. Survive as long as you can; your best run is saved.' }] };
setInterval(() => {
  const g = window.game, r = g && g.save.run;
  if (!r || g.rv || g.solved || document.hidden || g.idx < LEVELS.length || document.getElementById('intro').className !== 'gone') return;
  g.tick = (g.tick || 0) + 1; if (g.tick % D().drain) return;
  r.v = Math.max(0, r.v - 1); g.vit(); if (r.v <= 0) g.dispose(); else if (g.tick % 60 === 0) g.persist();
}, 1000);
document.getElementById('reBtn').onclick = () => window.game.restart();
document.getElementById('skipBtn').onclick = () => window.game.skipCut();
/* ========== Act II: Predicate logic ========== */
class Pred {
  static parse(src) {
    const s = src.replace(/∧/g, '&').replace(/∨/g, '|').replace(/[¬~]/g, '!').replace(/↔/g, '<->').replace(/→/g, '->').replace(/∀/g, '@').replace(/∃/g, '?');
    const tk = s.match(/<->|->|[A-Za-z_]\w*|[!&|()@?,]/g) || [];
    if (!tk.length || tk.join('').length !== s.replace(/\s+/g, '').length) throw new Error('Unrecognised symbol in formula.');
    let i = 0; const pk = () => tk[i], bd = [], id = x => x && /^[A-Za-z_]/.test(x);
    const iff = () => { let l = imp(); while (pk() === '<->') { i++; l = { t: 'iff', a: l, b: imp() }; } return l; };
    const imp = () => { const l = or(); if (pk() === '->') { i++; return { t: 'imp', a: l, b: imp() }; } return l; };
    const or = () => { let l = and(); while (pk() === '|') { i++; l = { t: 'or', a: l, b: and() }; } return l; };
    const and = () => { let l = un(); while (pk() === '&') { i++; l = { t: 'and', a: l, b: un() }; } return l; };
    const un = () => {
      const x = pk();
      if (x === '!') { i++; return { t: 'not', a: un() }; }
      if (x === '@' || x === '?') { i++; const v = tk[i++]; if (!id(v) || !/^[a-z]/.test(v)) throw new Error('A quantifier needs a variable such as x.'); bd.push(v); const a = un(); bd.pop(); return { t: x === '@' ? 'all' : 'ex', v, a }; }
      if (x === '(') { i++; const e = iff(); if (pk() !== ')') throw new Error('Missing closing parenthesis.'); i++; return e; }
      if (id(x) && /^[A-Z]/.test(x)) {
        i++; const args = [];
        if (pk() === '(') { i++; while (pk() !== ')') { const a = tk[i++]; if (!id(a)) throw new Error('Expected a term.'); args.push(bd.includes(a) ? { t: 'var', n: a } : { t: 'const', n: a }); if (pk() === ',') i++; else if (pk() !== ')') throw new Error('Expected , or ).'); } i++; }
        return { t: 'pred', n: x, args };
      }
      throw new Error('Expected a formula such as P(x).');
    };
    const r = iff(); if (i < tk.length) throw new Error(`Unexpected "${tk[i]}".`); return r;
  }
  static q(n) { return n.t === 'all' || n.t === 'ex'; }
  static str(n) {
    switch (n.t) {
      case 'pred': return n.n + (n.args.length ? '(' + n.args.map(a => a.n).join(',') + ')' : '');
      case 'free': return `(${n.n}) free`;
      case 'not': return '¬' + (n.a.t === 'pred' || n.a.t === 'not' || Pred.q(n.a) ? Pred.str(n.a) : '(' + Pred.str(n.a) + ')');
      case 'all': case 'ex': return (n.t === 'all' ? '∀' : '∃') + n.v + (Pred.q(n.a) ? Pred.str(n.a) : ' ' + Pred.w(n.a));
      default: return Pred.w(n.a) + ' ' + SYM[n.t] + ' ' + Pred.w(n.b);
    }
  }
  static w(n) { return n.t === 'pred' || n.t === 'not' ? Pred.str(n) : '(' + Pred.str(n) + ')'; }
  static eq(a, b, ea = [], eb = []) { // equality up to renaming of bound variables
    if (a.t !== b.t) return false;
    switch (a.t) {
      case 'pred': return a.n === b.n && a.args.length === b.args.length && a.args.every((x, i) => { const y = b.args[i]; return x.t === y.t && (x.t === 'const' ? x.n === y.n : ea.lastIndexOf(x.n) === eb.lastIndexOf(y.n)); });
      case 'free': return a.n === b.n;
      case 'not': return Pred.eq(a.a, b.a, ea, eb);
      case 'all': case 'ex': return Pred.eq(a.a, b.a, [...ea, a.v], [...eb, b.v]);
      default: return Pred.eq(a.a, b.a, ea, eb) && Pred.eq(a.b, b.b, ea, eb);
    }
  }
  static map(n, f) { // rewrite the terms of every atom
    switch (n.t) {
      case 'pred': return { ...n, args: n.args.map(f) };
      case 'free': return n;
      case 'not': return { t: 'not', a: Pred.map(n.a, f) };
      case 'all': case 'ex': return { ...n, a: Pred.map(n.a, f) };
      default: return { ...n, a: Pred.map(n.a, f), b: Pred.map(n.b, f) };
    }
  }
  static subst(n, v, tm) { // replace free occurrences of variable v
    if (Pred.q(n) && n.v === v) return n;
    if (Pred.q(n)) return { ...n, a: Pred.subst(n.a, v, tm) };
    if (n.t === 'pred') return Pred.map(n, a => a.t === 'var' && a.n === v ? tm : a);
    if (n.t === 'not') return { t: 'not', a: Pred.subst(n.a, v, tm) };
    return n.b ? { ...n, a: Pred.subst(n.a, v, tm), b: Pred.subst(n.b, v, tm) } : n;
  }
  static abs(n, c, v) { return Pred.map(n, a => a.t === 'const' && a.n === c ? { t: 'var', n: v } : a); }
  static walk(n, f) { f(n); if (n.t === 'not' || Pred.q(n)) Pred.walk(n.a, f); else if (n.b) { Pred.walk(n.a, f); Pred.walk(n.b, f); } }
  static consts(n) { const s = new Set(); Pred.walk(n, x => { if (x.t === 'pred') x.args.forEach(a => a.t === 'const' && s.add(a.n)); if (x.t === 'free') s.add(x.n); }); return [...s]; }
  static has(n, c) { return Pred.consts(n).includes(c); }
  static fresh(n) { const u = new Set(); Pred.walk(n, x => { if (Pred.q(x)) u.add(x.v); if (x.t === 'pred') x.args.forEach(a => a.t === 'var' && u.add(a.n)); }); return ['x', 'y', 'z', 'w', 'u', 'v'].find(v => !u.has(v)); }
  static sig(...ns) { const s = {}; ns.forEach(n => Pred.walk(n, x => { if (x.t === 'pred') s[x.n] = x.args.length; })); return s; }
  static ev(n, M, env = {}) {
    const tv = a => a.t === 'var' ? env[a.n] : (M.c[a.n] ?? 0), D = [...Array(M.k).keys()];
    switch (n.t) {
      case 'pred': return M.has(n.n, n.args.map(tv));
      case 'not': return !Pred.ev(n.a, M, env);
      case 'all': return D.every(d => Pred.ev(n.a, M, { ...env, [n.v]: d }));
      case 'ex': return D.some(d => Pred.ev(n.a, M, { ...env, [n.v]: d }));
      case 'and': return Pred.ev(n.a, M, env) && Pred.ev(n.b, M, env);
      case 'or': return Pred.ev(n.a, M, env) || Pred.ev(n.b, M, env);
      case 'imp': return !Pred.ev(n.a, M, env) || Pred.ev(n.b, M, env);
      case 'iff': return Pred.ev(n.a, M, env) === Pred.ev(n.b, M, env);
    }
  }
  static equiv(a, b) { const sg = Pred.sig(a, b); for (let k = 1; k <= 3; k++) if (PModel.all(sg, k, M => Pred.ev(a, M) !== Pred.ev(b, M))) return false; return true; }
}
class PModel { // an interpretation: domain {0..k-1} and the extension of every predicate
  constructor(k, sig, rel) { this.k = k; this.sig = sig; this.c = {}; this.s = {}; Object.keys(sig).forEach(n => this.s[n] = new Set((rel && rel[n]) || [])); }
  has(n, t) { return !!this.s[n] && this.s[n].has(t.join()); }
  flip(n, t) { const key = t.join(), S = this.s[n]; S.has(key) ? S.delete(key) : S.add(key); }
  static all(sig, k, f) { // try every interpretation; return the first one for which f is true
    const D = [...Array(k).keys()], cells = [];
    Object.entries(sig).forEach(([n, ar]) => (ar === 1 ? D.map(i => [i]) : D.flatMap(i => D.map(j => [i, j]))).forEach(t => cells.push([n, t])));
    if (cells.length > 16) return null;
    for (let m = 0; m < 2 ** cells.length; m++) { const M = new PModel(k, sig); cells.forEach(([n, t], i) => { if ((m >> i) & 1) M.flip(n, t); }); if (f(M)) return M; }
    return null;
  }
}
Object.assign(RL, { Free: { hint: 'open a “(t) free” block' }, Pick: { hint: '∃x A(x) ⊢ assume A(t)' }, '∀E': { hint: '∀x A(x) ⊢ A(t)' }, '∀I': { hint: '(t) free…A(t) ⊢ ∀x A(x)' }, '∃I': { hint: 'A(t) ⊢ ∃x A(x)' }, '∃E': { hint: '∃x A(x), A(t)…B ⊢ B' } });
Object.assign(OPN, { '∀': 'FOR ALL', '∃': 'EXISTS' });
const fmt = f => { try { return Pred.str(Pred.parse(f)); } catch { try { return Logic.str(Logic.parse(f)); } catch { return f; } } };
const solHints = sol => sol.map(([r, l, f], i) => `Step ${i + 1}: ` + (r === 'Assume' ? `tap ${fmt(f)} in the formula box, then click Assume` : r === 'Free' ? `type ${f} in the formula box, then click Free`
  : r === 'Pick' ? `select line ${l[0]}, type ${f} in the box, then click Pick` : `click ${r}${l.length ? ' with line' + (l.length > 1 ? 's ' : ' ') + l.join(' and ') + ' selected' : ' to close the open block'}${f ? ', with ' + fmt(f) + ' in the formula box' : ''}`) + '.');
// [tier, premises, goal, rules, solution [rule, lines, box], note]  (P Q R become random predicate names)
const TPL2 = [
  [0, ['@x (P(x) -> Q(x))', 'P(a)'], 'Q(a)', ['∀E', '→E'], [['∀E', [1], 'a'], ['→E', [3, 2]]]],
  [0, ['@x (P(x) -> Q(x))', 'P(a)'], '?x Q(x)', ['∀E', '→E', '∃I'], [['∀E', [1], 'a'], ['→E', [3, 2]], ['∃I', [4], '?x Q(x)']]],
  [1, ['@x (P(x) -> Q(x))', '!Q(a)'], '!P(a)', ['∀E', 'Assume', '→E', '∧I', '¬I'], [['∀E', [1], 'a'], ['Assume', [], 'P(a)'], ['→E', [3, 4]], ['∧I', [2, 5]], ['¬I', []]]],
  [1, ['@x P(x) & @x Q(x)'], '@x (P(x) & Q(x))', ['∧E', 'Free', '∀E', '∧I', '∀I'], [['∧E', [1]], ['Free', [], 't'], ['∀E', [2], 't'], ['∀E', [3], 't'], ['∧I', [5, 6]], ['∀I', []]], '∀I: open a Free block with a fresh constant, derive A(t) inside, then close it.'],
  [1, ['?x (P(x) & Q(x))'], '?x P(x) & ?x Q(x)', ['Pick', '∧E', '∃I', '∧I', '∃E'], [['Pick', [1], 't'], ['∧E', [2]], ['∃I', [3], '?x P(x)'], ['∃I', [4], '?x Q(x)'], ['∧I', [5, 6]], ['∃E', []]], 'Pick: select the ∃ line and type a fresh constant to assume A(t).'],
  [2, ['@x (P(x) -> Q(x))', '?x P(x)'], '?x Q(x)', ['Pick', '∀E', '→E', '∃I', '∃E'], [['Pick', [2], 't'], ['∀E', [1], 't'], ['→E', [4, 3]], ['∃I', [5], '?x Q(x)'], ['∃E', []]]],
  [2, ['!?x P(x)'], '@x !P(x)', ['Free', 'Assume', '∃I', '∧I', '¬I', '∀I'], [['Free', [], 't'], ['Assume', [], 'P(t)'], ['∃I', [3], '?x P(x)'], ['∧I', [1, 4]], ['¬I', []], ['∀I', []]]],
  [2, ['?x @y P(x,y)'], '@y ?x P(x,y)', ['Pick', 'Free', '∀E', '∃I', '∀I', '∃E'], [['Pick', [1], 'a'], ['Free', [], 'b'], ['∀E', [2], 'b'], ['∃I', [4], '?x P(x,b)'], ['∀I', []], ['∃E', []]]],
];
const PL = (title, brief, t) => ({ type: 'proof', pred: true, title, brief, premises: t[1], goal: t[2], rules: t[3], hints: solHints(t[4]), sol: t[4] });
const CH = (title, sentence, legend, right, wrongs, at, hints) => { const o = wrongs.slice(); o.splice(at, 0, right); return { type: 'formalize', title, brief: 'Choose the formula that says the same thing as the sentence.', sentence, legend, options: o.map(s => Pred.str(Pred.parse(s))), right: at, hints }; };
const LEVELS2 = [
  { type: 'model', title: 'Domain Zero', brief: 'Light the lamps so that the formula is true in this interpretation.', formula: '@x P(x)', want: true, hints: ['∀x P(x) means P holds for every element of the domain.', 'Switch on P for 0, 1 and 2.'] },
  { type: 'model', title: 'Some, Not All', brief: 'Make the formula true. Existence needs at least one witness.', formula: '?x P(x) & ?x !P(x)', want: true, hints: ['You need one element with P and one without.', 'Switch P on for 0 only.'] },
  CH('Translation Bay', 'All cows are good.', ['Cow(x): x is a cow', 'Good(x): x is good'], '@x (Cow(x) -> Good(x))', ['@x (Cow(x) & Good(x))', '?x (Cow(x) -> Good(x))', '@x (Good(x) -> Cow(x))'], 1,
    ['Rule of thumb from the notes: ∀ goes with →, ∃ goes with ∧.', 'Option B says “for all x, if x is a cow then x is good”.']),
  CH('The Negative Space', 'Some cows are not good.', ['Cow(x): x is a cow', 'Good(x): x is good'], '?x (Cow(x) & !Good(x))', ['?x (Cow(x) -> !Good(x))', '!?x (Cow(x) & Good(x))', '@x (Cow(x) -> !Good(x))'], 2,
    ['“Some” means ∃, and ∃ goes with ∧.', 'Option C. Note that ¬∃x(Cow ∧ Good) would mean no cow is good.']),
  { type: 'eval', title: 'Relation Room', brief: 'Evaluate each formula in the interpretation shown, then run the test.', k: 3, rel: [[0, 1], [1, 0], [1, 2], [2, 2]],
    forms: ['@x@y P(x,y)', '?x?y P(x,y)', '@x?y P(x,y)', '?x@y P(x,y)', '?y@x P(x,y)', '@y?x P(x,y)'],
    hints: ['∀ is an AND over the domain, ∃ is an OR. Evaluate the inner quantifier for each value of the outer variable.', 'F1 is F and F2 is T.', 'F3 is T, F4 is F, F5 is F, F6 is T.'] },
  { type: 'model', title: 'Order Matters', brief: 'Build a relation where everyone has a successor, yet nobody is related to everyone.', k: 3, formula: '@x ?y R(x,y) & !?x @y R(x,y)', want: true,
    hints: ['The first conjunct needs a T in every row of the table. The second forbids a full row.', 'Try the cycle: R(0,1), R(1,2), R(2,0).'] },
  PL('Instantiation', 'Prove {∀x(P(x) → Q(x)), P(a)} ⊢ ∃x Q(x). Select lines, click a rule, and type terms in the formula box.', TPL2[1]),
  PL('Free Constant', 'Prove {∀xP(x) ∧ ∀xQ(x)} ⊢ ∀x(P(x) ∧ Q(x)). Use Free to open a “(t) free” block.', TPL2[3]),
  PL('The Witness', 'Prove {∀x(P(x) → Q(x)), ∃xP(x)} ⊢ ∃xQ(x). Use Pick to name the witness.', TPL2[5]),
];
const LESSONS2 = [
  { t: 'Act II, briefing 1: Interpretations', steps: [
    { h: '<b>Predicate logic</b> adds <b>predicates</b> like <code>P(x)</code>, constants, variables and <b>quantifiers</b>. A formula is true or false in an <b>interpretation</b>: a domain of objects plus which objects satisfy each predicate.', sel: '#workspace' },
    { h: '<code>∀x P(x)</code> means P holds for <b>every</b> element of the domain. Each box below is a domain element and its lamps say which predicates hold for it. Light them until the formula is true, then press <b>Run test</b>.', sel: '#workspace' }] },
  { t: 'Act II, briefing 2: Existence', steps: [
    { h: '<code>∃x P(x)</code> means P holds for <b>at least one</b> element. Think of ∀ as an AND over the domain and ∃ as an OR.' },
    { h: 'This chamber needs one element with P and one without. A lit lamp and a dark lamp will do.', sel: '#workspace' }] },
  { t: 'Act II, briefing 3: Formalization', steps: [
    { h: 'To translate a sentence, choose predicates, then write the formula. <b>All cows are good</b> becomes <code>∀x (Cow(x) → Good(x))</code>. The notes’ rule of thumb: <b>∀ goes with →</b>, and <b>∃ goes with ∧</b>.', sel: '#workspace' },
    { h: 'Why not <code>∀x (Cow(x) ∧ Good(x))</code>? That says that everything in the world is a cow and is good.' }] },
  { t: 'Act II, briefing 4: Negation', steps: [
    { h: '<b>Some cows are not good</b>: <code>∃x (Cow(x) ∧ ¬Good(x))</code>. Compare <b>No cow is good</b>: <code>∀x (Cow(x) → ¬Good(x))</code>, which is the same as <code>¬∃x (Cow(x) ∧ Good(x))</code>.' },
    { h: 'Negating a quantifier flips it: <code>¬∀x A ≡ ∃x ¬A</code> and <code>¬∃x A ≡ ∀x ¬A</code>.' }] },
  { t: 'Act II, briefing 5: Evaluation', steps: [
    { h: 'An arrow x → y in the graph means <code>P(x,y)</code> is true. Evaluate a nested formula from the outside in: <code>∀x∃y P(x,y)</code> asks, for each x, is there some y?', sel: '#workspace' },
    { h: 'Click each answer to cycle <code>?</code>, <code>T</code>, <code>F</code>. Compare <code>∃x∀y</code> with <code>∀y∃x</code>: the order of different quantifiers changes the meaning.' }] },
  { t: 'Act II, briefing 6: Quantifier order', steps: [
    { h: '“Everybody lives somewhere” is <code>∀x∃y R(x,y)</code>. “There is somewhere where everybody lives” is <code>∃y∀x R(x,y)</code>. They are not equivalent.', sel: '#workspace' },
    { h: 'In the table, row x and column y show <code>R(x,y)</code>. Make every row contain a T, but no row full of T.' }] },
  { t: 'Act II, briefing 7: ∀E and ∃I', steps: [
    { h: 'Natural deduction keeps every rule of Act I and adds two for each quantifier. <code>∀E</code>: from <code>∀x A(x)</code> get <code>A(t)</code> for any term t. Select the line, type <code>a</code> in the formula box, click <code>∀E</code>.', sel: '#pf' },
    { h: '<code>∃I</code>: from <code>A(a)</code> get <code>∃x A(x)</code>. Build the target formula in the box (for example <code>∃x Q(x)</code>), select the line, click <code>∃I</code>.', sel: '#rules' }] },
  { t: 'Act II, briefing 8: Free constants', steps: [
    { h: '<code>∀I</code> proves <code>∀x A(x)</code> by showing <code>A(t)</code> for a <b>free</b> constant t, one that appears in no open line. Type <code>t</code> in the box and click <b>Free</b>: a block opens marked “(t) free”.', sel: '#pf' },
    { h: 'Inside the block, use ∀E with t, then ∧E, ∧I and so on until you have the line you want. Select it (or leave the last line) and click <code>∀I</code>.' }] },
  { t: 'Act II, briefing 9: Witnesses', steps: [
    { h: '<code>∃E</code>: you know <code>∃x A(x)</code> but not which element. Select that line, type a fresh constant <code>t</code> and click <b>Pick</b>: you may assume <code>A(t)</code> inside the block.', sel: '#rules' },
    { h: 'Derive a conclusion <code>B</code> that does <b>not</b> mention t, then click <code>∃E</code>. The notes call this “t free”: the witness cannot leak out of its block.' }] },
];
LESSONS2[LEVELS.length] = LESSONS[LEVELS.length];
const VOC = { n: [['cow', 'cows', 'Cow'], ['dog', 'dogs', 'Dog'], ['robot', 'robots', 'Robot'], ['student', 'students', 'Student']], a: [['good', 'Good'], ['smart', 'Smart'], ['loyal', 'Loyal'], ['tired', 'Tired']], r: [['likes', 'Likes'], ['trusts', 'Trusts'], ['hounds', 'Hounds']] };
const FZ = [ // [tier, sentence, correct formula, three wrong ones]  (N A M L are filled in from VOC)
  [0, 'All Np are A.', '@x (N(x) -> A(x))', ['@x (N(x) & A(x))', '?x (N(x) -> A(x))', '@x (A(x) -> N(x))']],
  [0, 'Some Np are A.', '?x (N(x) & A(x))', ['?x (N(x) -> A(x))', '@x (N(x) & A(x))', '?x (N(x) | A(x))']],
  [0, 'No N is A.', '@x (N(x) -> !A(x))', ['!@x (N(x) -> A(x))', '?x (N(x) & !A(x))', '@x (!N(x) -> A(x))']],
  [0, 'Only Np are A.', '@x (A(x) -> N(x))', ['@x (N(x) -> A(x))', '?x (A(x) & N(x))', '@x (A(x) & N(x))']],
  [0, 'Some Np are not A.', '?x (N(x) & !A(x))', ['!?x (N(x) & A(x))', '?x (N(x) -> !A(x))', '?x (!N(x) & A(x))']],
  [1, 'Every N L some M.', '@x (N(x) -> ?y (M(y) & L(x,y)))', ['?y (M(y) & @x (N(x) -> L(x,y)))', '@x (N(x) -> @y (M(y) -> L(x,y)))', '@x ?y (N(x) & M(y) & L(x,y))']],
  [2, 'Some N L every M.', '?x (N(x) & @y (M(y) -> L(x,y)))', ['@y (M(y) -> ?x (N(x) & L(x,y)))', '?x (N(x) & ?y (M(y) & L(x,y)))', '@x (N(x) -> @y (M(y) -> L(x,y)))']],
];
const Gen2 = {
  build(n) { const kind = ['proof', 'model', 'formalize', 'proof', 'eval', 'unify', 'proof', 'equiv', 'resolve', 'skolem', 'refute'][n % 11]; return { title: Gen.pick(NAMES), pred: true, ...Gen2[kind](n) }; },
  form(d, vs, sig) {
    if (d === 0 || (d < 2 && Gen.r(4) === 0)) { const [p, ar] = Gen.pick(Object.entries(sig)); return { t: 'pred', n: p, args: Array.from({ length: ar }, () => ({ t: 'var', n: Gen.pick(vs) })) }; }
    const c = Gen.r(5);
    if (c === 0) return { t: 'not', a: Gen2.form(d - 1, vs, sig) };
    if (c < 3 && vs.length < 2) { const v = ['x', 'y'][vs.length]; return { t: Gen.r(2) ? 'all' : 'ex', v, a: Gen2.form(d - 1, [...vs, v], sig) }; }
    return { t: Gen.pick(['and', 'or', 'imp']), a: Gen2.form(d - 1, vs, sig), b: Gen2.form(d - 1, vs, sig) };
  },
  model(n) {
    const sig = [{ P: 1, Q: 1 }, { P: 1, R: 2 }, { P: 1, Q: 1, R: 2 }][Math.min(2, Math.floor(n / 8))];
    for (let q = 0; q < 300; q++) {
      const f = { t: Gen.r(2) ? 'all' : 'ex', v: 'x', a: Gen2.form(2, ['x'], sig) }, want = !!Gen.r(2); let sz = 0; Pred.walk(f, () => sz++);
      if (sz < 5 || sz > 12 + Math.floor(n / 6) || Pred.ev(f, new PModel(3, sig)) === want) continue;
      const sol = PModel.all(sig, 3, M => Pred.ev(f, M) === want); if (!sol) continue;
      const cells = Object.entries(sol.s).flatMap(([nm, S]) => [...S].map(c => `${nm}(${c})`));
      return { type: 'model', k: 3, formula: Pred.str(f), want, brief: `Build an interpretation that makes the formula ${want ? 'true' : 'false'}.`,
        hints: ['∀ needs every element to work, ∃ needs just one. Try the extremes first.', cells.length ? `One solution makes these facts true: ${cells.join(', ')}.` : 'One solution: leave every lamp off.'] };
    }
    return { ...LEVELS2[0] };
  },
  eval(n) {
    const pats = ['@x@y P(x,y)', '?x?y P(x,y)', '@x?y P(x,y)', '?x@y P(x,y)', '?y@x P(x,y)', '@y?x P(x,y)', '@x P(x,x)', '?x P(x,x)', '@x@y (P(x,y) -> P(y,x))', '@x@y (P(x,y) & P(y,x) -> P(x,x))', '@x?y (P(x,y) & P(y,x))'];
    for (let q = 0; q < 300; q++) {
      const rel = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (Gen.r(10) < 4) rel.push([i, j]);
      const M = new PModel(3, { P: 2 }, { P: rel.map(r => r.join()) }), forms = Gen.shuffle(pats).slice(0, 5), v = forms.map(f => Pred.ev(Pred.parse(f), M));
      if (v.filter(Boolean).length >= 2 && v.filter(x => !x).length >= 2)
        return { type: 'eval', k: 3, rel, forms: forms.map(f => Pred.str(Pred.parse(f))), brief: 'Evaluate every formula in the interpretation shown, then run the test.',
          hints: ['∀ is an AND over the domain, ∃ is an OR. Evaluate the inner quantifier for each value of the outer variable.', `F1 is ${v[0] ? 'T' : 'F'}.`, `F2 is ${v[1] ? 'T' : 'F'}.`] };
    }
    return { ...LEVELS2[4] };
  },
  formalize(n) {
    const tier = Math.min(2, Math.floor(n / 8)), T = Gen.pick(FZ.filter(x => x[0] <= tier)), [nn, np, N] = Gen.pick(VOC.n), [mn, , M] = Gen.pick(VOC.n.filter(x => x[2] !== N)), [al, A] = Gen.pick(VOC.a), [vb, L] = Gen.pick(VOC.r);
    const sub = s => s.replace(/\b[NAML]\b/g, c => ({ N, A, M, L })[c]), right = Pred.parse(sub(T[2]));
    const wrong = T[3].map(w => Pred.parse(sub(w))).filter(w => !Pred.equiv(w, right)).slice(0, 3), at = Gen.r(wrong.length + 1), opts = wrong.map(w => Pred.str(w)); opts.splice(at, 0, Pred.str(right));
    const sentence = T[1].replace('Np', np).replace(/\bN\b/, nn).replace(/\bA\b/, al).replace(/\bM\b/, mn).replace(/\bL\b/, vb);
    const legend = [`${N}(x): x is a ${nn}`]; if (/\bA\b/.test(T[2])) legend.push(`${A}(x): x is ${al}`); if (/\bM\b/.test(T[2])) legend.push(`${M}(x): x is a ${mn}`, `${L}(x,y): x ${vb} y`);
    return { type: 'formalize', brief: 'Choose the formula that says the same thing as the sentence.', sentence, legend, options: opts, right: at,
      hints: ['Pattern from the notes: ∀ goes with →, and ∃ goes with ∧.', 'Check which quantifier each part of the sentence needs, and what it ranges over.', `The answer is option ${'ABCD'[at]}.`] };
  },
  proof(n) {
    const tier = Math.min(2, Math.floor(n / 8)), t = Gen.last = Gen.pick(TPL2.filter(x => x[0] <= tier && x !== Gen.last));
    const L = Gen.shuffle(['P', 'Q', 'R']), sub = s => s.replace(/[PQR]/g, c => L['PQR'.indexOf(c)]);
    const sol = t[4].map(([r, l, f]) => [r, l, f && sub(f)]);
    return { type: 'proof', pred: true, brief: 'Derive the goal with the rules of the notes. ' + (t[5] || ''), premises: t[1].map(sub), goal: sub(t[2]), rules: t[3], hints: solHints(sol), sol };
  },
};
Object.assign(Game.prototype, {
  legend() { if (ACTN === 3) return; const ops = this.$('ops'); ['∀', '∃', '¬', '∧', '∨', '→'].forEach(s => ops.append(el('button', { className: 'chip', innerHTML: `${s}<small>${OPN[s]}</small>` }))); },
  initModel() { this.ast = Pred.parse(this.lv.formula); this.M = new PModel(this.lv.k || 3, Pred.sig(this.ast)); this.legend(); this.drawModel(); },
  drawModel() {
    const M = this.M, ws = this.$('workspace'), want = this.lv.want !== false;
    ws.replaceChildren(el('p', { className: 'formula', textContent: Pred.str(this.ast) }), el('p', { className: 'goalbar', textContent: `Domain {${[...Array(M.k).keys()].join(', ')}}: set the facts so the formula is ${want ? 'TRUE' : 'FALSE'}.` }));
    const row = el('div', { className: 'dom' });
    for (let i = 0; i < M.k; i++) {
      const c = el('div', { className: 'elt' }, el('b', { textContent: i }));
      Object.entries(M.sig).filter(([, a]) => a === 1).forEach(([n]) => { const b = el('button', { className: 'emitter' + (M.has(n, [i]) ? ' on' : ''), textContent: `${n}(${i})` }); b.onclick = () => { M.flip(n, [i]); this.drawModel(); }; c.append(b); });
      row.append(c);
    }
    if (row.children[0].children.length > 1) ws.append(row);
    Object.entries(M.sig).filter(([, a]) => a === 2).forEach(([n]) => {
      const t = el('table', { className: 'rel' }), h = el('tr', {}, el('th', { textContent: n }));
      for (let j = 0; j < M.k; j++) h.append(el('th', { textContent: j })); t.append(h);
      for (let i = 0; i < M.k; i++) {
        const r = el('tr', {}, el('th', { textContent: i }));
        for (let j = 0; j < M.k; j++) { const on = M.has(n, [i, j]), b = el('button', { className: on ? 'on' : '', textContent: on ? 'T' : '·', title: `${n}(${i},${j})` }); b.onclick = () => { M.flip(n, [i, j]); this.drawModel(); }; r.append(el('td', {}, b)); }
        t.append(r);
      }
      ws.append(t);
    });
    if (this.idx < LEVELS.length) ws.append(el('p', { className: 'goalbar', textContent: 'Right now the formula is ' + (Pred.ev(this.ast, M) ? 'TRUE' : 'FALSE') }));
  },
  initEval() { this.M = new PModel(this.lv.k || 3, { P: 2 }, { P: this.lv.rel.map(r => r.join()) }); this.fs = this.lv.forms.map(f => Pred.parse(f)); this.ans = this.fs.map(() => null); this.checked = false; this.legend(); this.drawEval(); },
  drawEval() {
    const ws = this.$('workspace'), pos = [[150, 36], [50, 140], [250, 140]];
    let g = '<svg class="graph" viewBox="0 0 300 180"><defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#9fb0c0"/></marker></defs>';
    this.lv.rel.forEach(([i, j]) => {
      const [x1, y1] = pos[i], [x2, y2] = pos[j];
      if (i === j) g += `<path d="M${x1 - 9} ${y1 - 15}a11 11 0 1 1 18 0" fill="none" stroke="#9fb0c0" stroke-width="2" marker-end="url(#ar)"/>`;
      else { const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, ox = -uy * 6, oy = ux * 6;
        g += `<line x1="${x1 + ux * 20 + ox}" y1="${y1 + uy * 20 + oy}" x2="${x2 - ux * 22 + ox}" y2="${y2 - uy * 22 + oy}" stroke="#9fb0c0" stroke-width="2" marker-end="url(#ar)"/>`; }
    });
    pos.forEach(([x, y], i) => { g += `<circle cx="${x}" cy="${y}" r="16" fill="#141a21" stroke="#ff7a1a" stroke-width="2"/><text x="${x}" y="${y + 5}" text-anchor="middle" fill="#fff" font-family="monospace" font-size="15">${i}</text>`; });
    ws.innerHTML = '<p class="goalbar">Domain {0, 1, 2}. An arrow x → y means P(x,y) is true.</p>' + g + '</svg>';
    const grid = el('div', { className: 'ev' });
    this.fs.forEach((f, i) => {
      const v = this.ans[i], b = el('button', { textContent: v == null ? '?' : v ? 'T' : 'F' });
      if (this.checked && v != null) b.className = v === Pred.ev(f, this.M) ? 'right' : 'wrong';
      b.onclick = () => { this.ans[i] = v == null ? true : v ? false : null; this.checked = false; this.drawEval(); };
      grid.append(el('span', { textContent: `F${i + 1}: ${Pred.str(f)}` }), b);
    });
    ws.append(grid);
  },
  initChoice() { this.pick = null; this.legend(); this.drawChoice(); },
  drawChoice() {
    const ws = this.$('workspace'), lv = this.lv;
    ws.replaceChildren(el('p', { className: 'formula', textContent: lv.plain ? lv.sentence : '“' + lv.sentence + '”' }), el('p', { className: 'legend', textContent: lv.legend.join('    ') }));
    const o = el('div', { className: 'opts' });
    lv.options.forEach((t, i) => { const b = el('button', { className: 'opt' + (this.pick === i ? ' sel' : '') }, el('b', { textContent: 'ABCD'[i] }), el('span', { textContent: t })); b.onclick = () => { this.pick = i; this.drawChoice(); }; o.append(b); });
    ws.append(o);
  },
  switchAct(n, resume = true) { this.rv = null; this.rvLv = null;
    const F = ['unlocked', 'best', 'seen', 'run', 'bestN', 'bestPts'], sv = this.save;
    (sv.acts = sv.acts || {})[sv.act || 1] = Object.fromEntries(F.map(k => [k, sv[k]]));
    const s = sv.acts[n] || { unlocked: 0, best: {}, seen: {}, run: null, bestN: 0, bestPts: 0 };
    F.forEach(k => sv[k] = s[k]); sv.act = ACTN = n; applyAct(n);
    this.cutStop(); this.pend = null; this.$('dispose').hidden = true; document.body.classList.remove('disposal', 'danger');
    this.persist(); if (resume) { this.start(sv.unlocked >= LEVELS.length ? (sv.run ? sv.run.idx : LEVELS.length) : sv.unlocked); this.story('intro'); }
  },
});
const QUIPS2 = {
  fail: ['Incorrect. Something has grown through the ceiling, and even it disapproves.', 'That deduction has been overgrown with mistakes. We will prune it later.', 'Error logged. A small bird nesting in the speaker confirms it.', 'The facility has been unattended for years, and still it knows that was wrong.'],
  win: ['Correct. A fern in the corner rustles approvingly.', 'Valid. The vines have been asked to stop clapping.', 'Well reasoned. Please ignore the moss on the door.'] };
const Q = () => ACTN === 3 ? QUIPS3 : ACTN === 2 ? QUIPS2 : QUIPS;
let ACTN = 1;
const ACT = { 1: { levels: LEVELS.slice(), lessons: LESSONS.slice(), name: 'The Aperture Proof Lab' }, 2: { levels: LEVELS2, lessons: LESSONS2, name: 'Proof Lab II: Predicate Logic' } };
function applyAct(n) {
  ACTN = n; LEVELS.length = 0; LEVELS.push(...ACT[n].levels); LESSONS.length = 0; LESSONS.push(...ACT[n].lessons);
  Gen.cache = {}; Gen.last = null; document.body.classList.toggle('act2', n === 2); document.body.classList.toggle('act3', n === 3);
  document.querySelector('.hud h1').textContent = ACT[n].name; document.getElementById('actBtn').textContent = n === 1 ? 'Act II ▸' : n === 2 ? 'Act III ▸' : '◂ Act I';
}
const buildAct1 = Gen.build; Gen.build = n => ACTN === 3 ? Gen3.build(n) : ACTN === 2 ? Gen2.build(n) : buildAct1(n);
setInterval(() => { if (ACTN === 2 && !document.hidden && document.getElementById('intro').className === 'gone' && Math.random() < .45) sfx('bird'); }, 6000);
document.getElementById('begin2Btn').onclick = () => { if (ACTN !== 2) window.game.switchAct(2); document.getElementById('intro').className = 'gone'; sfx('ok'); speak('Act two. The machine now wishes to discuss quantifiers.'); };
document.getElementById('actBtn').onclick = () => window.game.switchAct((ACTN % 3) + 1);
const WS = document.getElementById('workspace'); let keepScroll = 0;
WS.addEventListener('scroll', () => { keepScroll = WS.scrollTop; });
new MutationObserver(() => { if (WS.scrollTop !== keepScroll) WS.scrollTop = keepScroll; }).observe(WS, { childList: true });
