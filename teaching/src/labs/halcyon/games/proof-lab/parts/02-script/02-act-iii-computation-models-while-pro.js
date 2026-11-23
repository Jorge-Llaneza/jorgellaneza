/* ========== Act III: Computation models (While programs and Turing machines) ========== */
class WP {
  static parse(lines) {
    const tk = []; lines.forEach((s, ln) => (s.match(/begin|end|while|do|:=|;|≠|!=|succ|pred|∸|\+|\*|-|[A-Z]\w*|\d+|[()]/g) || []).forEach(t => tk.push({ t, ln })));
    let i = 0; const pk = () => tk[i] && tk[i].t, nx = () => tk[i++];
    const need = x => { if (pk() !== x) throw new Error(`Expected "${x}"`); return nx(); };
    const vr = () => { const t = nx(); if (!t || !/^[A-Z]/.test(t.t)) throw new Error('Expected a variable'); return t.t; };
    const stmt = () => {
      const f = tk[i]; if (!f) throw new Error('Unexpected end of program');
      if (f.t === 'begin') { i++; const list = []; while (pk() !== 'end') { if (i >= tk.length) throw new Error('Missing end'); list.push(stmt()); if (pk() === ';') i++; } i++; return { t: 'block', list }; }
      if (f.t === 'while') { i++; const a = vr(); if (pk() === '≠' || pk() === '!=') i++; else throw new Error('Expected ≠'); const b = vr(); need('do'); return { t: 'while', a, b, body: stmt(), ln: f.ln }; }
      const v = vr(); need(':='); const e = nx(); if (!e) throw new Error('Incomplete statement');
      if (e.t === '0') return { t: 'set', v, k: 'zero', ln: f.ln };
      if (e.t === 'succ' || e.t === 'pred') { need('('); const of = vr(); need(')'); return { t: 'set', v, k: e.t, of, ln: f.ln }; }
      if (/^[A-Z]/.test(e.t)) { const op = pk(); let y = null; if (op === '+' || op === '∸' || op === '-' || op === '*') { i++; y = vr(); } return WP.macro(v, e.t, y ? op : null, y, f.ln); }
      throw new Error('Expected 0, succ(Y), pred(Y) or a macro such as X + Y');
    };
    const ast = stmt(); if (i < tk.length) throw new Error('Unexpected ' + tk[i].t); return ast;
  }
  static compile(n, out = []) {
    if (n.t === 'block') n.list.forEach(s => WP.compile(s, out));
    else if (n.t === 'set') out.push({ op: 'set', v: n.v, k: n.k, of: n.of, ln: n.ln });
    else { const at = out.length; out.push({ op: 'jeq', a: n.a, b: n.b, ln: n.ln }); WP.compile(n.body, out); out.push({ op: 'jmp', to: at, ln: n.ln }); out[at].to = out.length; }
    return out;
  }
  static step(c, env, pc) { const g = v => env[v] || 0; if (c.op === 'set') { env[c.v] = c.k === 'zero' ? 0 : c.k === 'succ' ? g(c.of) + 1 : Math.max(0, g(c.of) - 1); return pc + 1; } return c.op === 'jeq' ? (g(c.a) === g(c.b) ? c.to : pc + 1) : c.to; }
  static run(code, env0, max = 20000) { const env = { ...env0 }; let pc = 0, n = 0; while (pc < code.length) { if (++n > max) return null; pc = WP.step(code[pc], env, pc); } return env; }
}
class TMx {
  constructor(M, vec) {
    this.M = M; this.tape = new Map(); let p = 0;
    vec.forEach((n, k) => { for (let i = 0; i <= n; i++) this.tape.set(p++, '1'); if (k < vec.length - 1) this.tape.set(p++, '0'); });
    this.len = p; this.h = 0; this.q = M.init; this.halted = false; this.loop = false; this.n = 0; this.seq = [this.desc()];
  }
  sym(p) { return this.tape.get(p) || '0'; }
  desc() { const ks = [...this.tape.keys(), this.h], lo = Math.min(0, ...ks), hi = Math.max(this.len - 1, ...ks); let l = '', r = ''; for (let p = lo; p < this.h; p++) l += this.sym(p); for (let p = this.h; p <= hi; p++) r += this.sym(p); return `(${l ? l + ' ' : ''}${this.q} ${r})`; }
  get final() { return this.halted && this.M.fin.includes(this.q); }
  get ones() { let c = 0; this.tape.forEach(v => { if (v === '1') c++; }); return c; }
  step() {
    if (this.halted) return;
    const row = this.M.rows[this.q + ',' + this.sym(this.h)]; if (!row) { this.halted = true; return; }
    const [w, m, nq] = row; this.tape.set(this.h, w); this.q = nq;
    if (m === 'L') this.h--; else if (m === 'R') this.h++; else if (m === 'H') this.halted = true;
    this.n++; this.seq.push(this.desc());
  }
  static run(M, vec, max = 600) { const t = new TMx(M, vec); while (!t.halted && t.n < max) t.step(); if (!t.halted) t.loop = true; return t; }
}
const toM = d => ({ init: d.init, fin: d.fin, rows: Object.fromEntries(d.rows.map(r => [r[0] + ',' + r[1], [r[2], r[3], r[4]]])) });
const TMS = {
  ADD: { name: 'φ(x,y) = x + y', ar: 2, f: v => v[0] + v[1], init: 'q0', fin: ['q2'], rows: [['q0', '1', '0', 'R', 'q1'], ['q1', '1', '1', 'R', 'q1'], ['q1', '0', '0', 'R', 'q2'], ['q2', '1', '0', 'H', 'q2']] },
  PRED: { name: 'φ(x) = x ∸ 1', ar: 1, f: v => Math.max(0, v[0] - 1), init: 'q0', fin: ['q2'], rows: [['q0', '1', '0', 'R', 'q1'], ['q1', '1', '0', 'H', 'q2'], ['q1', '0', '0', 'H', 'q2']] },
  ID: { name: 'φ(x) = x', ar: 1, f: v => v[0], init: 'q0', fin: ['q1'], rows: [['q0', '1', '0', 'H', 'q1']] },
  LAST: { name: 'φ(x) = x', ar: 1, f: v => v[0], init: 'q0', fin: ['q2'], rows: [['q0', '1', '1', 'R', 'q0'], ['q0', '0', '0', 'L', 'q1'], ['q1', '1', '0', 'H', 'q2']] },
  DOUBLE: { name: 'φ(x) = 2x', ar: 1, f: v => 2 * v[0], init: 'q0', fin: ['qf'], rows: [['q0', '1', '0', 'R', 'q1'], ['q1', '1', '0', 'R', 'q2'], ['q1', '0', '0', 'H', 'qf'], ['q2', '1', '1', 'R', 'q2'], ['q2', '0', '0', 'R', 'q3'], ['q3', '1', '1', 'R', 'q3'], ['q3', '0', '1', 'L', 'q4'], ['q4', '1', '1', 'L', 'q4'], ['q4', '0', '0', 'L', 'q5'], ['q5', '1', '1', 'L', 'q5'], ['q5', '0', '1', 'R', 'q1']] },
};
const tmTests = k => TMS[k].ar === 2 ? [[0, 0], [1, 0], [0, 1], [2, 1], [3, 2]] : (k === 'DOUBLE' ? [[0], [1], [2], [3]] : [[0], [1], [2], [3], [4]]);
const WPS = {
  COPY: { goal: 'X', f: x => x, bl: [1, 2], lines: ['begin', 'Z := succ(X);', 'Z := pred(Z);', 'end'] },
  SUCC3: { goal: 'X + 3', f: x => x + 3, bl: [1, 2, 3], lines: ['begin', 'Z := succ(X);', 'Z := succ(Z);', 'Z := succ(Z);', 'end'] },
  ADD: { goal: 'X + Y', f: (x, y) => x + y, bl: [1, 2, 3, 6, 7], lines: ['begin', 'Z := succ(X);', 'Z := pred(Z);', 'U := 0;', 'while U ≠ Y do', 'begin', 'Z := succ(Z);', 'U := succ(U);', 'end', 'end'] },
  DOUBLE: { goal: 'X + X', f: x => 2 * x, bl: [1, 2, 3, 6, 7], lines: ['begin', 'Z := succ(X);', 'Z := pred(Z);', 'U := 0;', 'while U ≠ X do', 'begin', 'Z := succ(Z);', 'U := succ(U);', 'end', 'end'] },
  MONUS: { goal: 'X ∸ Y', f: (x, y) => Math.max(0, x - y), bl: [1, 2, 3, 6, 7], lines: ['begin', 'Z := succ(X);', 'Z := pred(Z);', 'U := 0;', 'while U ≠ Y do', 'begin', 'Z := pred(Z);', 'U := succ(U);', 'end', 'end'] },
  MUL: { goal: 'X * Y', f: (x, y) => x * y, bl: [1, 2, 5, 8, 9, 11], lines: ['begin', 'Z := 0;', 'U := 0;', 'while U ≠ Y do', 'begin', 'V := 0;', 'while V ≠ X do', 'begin', 'V := succ(V);', 'Z := succ(Z);', 'end', 'U := succ(U);', 'end', 'end'] },
};
const WTESTS = [[0, 0], [1, 0], [0, 1], [2, 3], [3, 2], [4, 1]];
const distract = a => {
  const m = a.match(/^(\w+) := (?:(succ|pred)\((\w+)\)|0);$/), L = m[1], op = m[2], arg = m[3], mk = (l, o, g) => o ? `${l} := ${o}(${g});` : `${l} := 0;`, out = [];
  if (op) { out.push(mk(L, op === 'succ' ? 'pred' : 'succ', arg), mk(['Z', 'U', 'V'].find(v => v !== L), op, arg), mk(L, op, ['X', 'Y', 'Z', 'U'].find(v => v !== arg && v !== L)), mk(L, null)); }
  else out.push(mk(L, 'succ', L), mk(L === 'Z' ? 'U' : 'Z', null), mk(L, 'pred', L), mk(L, 'succ', 'X'));
  return [...new Set([...out, 'Z := 0;', 'U := succ(U);', 'Z := pred(X);'])].filter(x => x !== a).slice(0, 3);
};
const mkWF = (key, idxs, title, brief, rnd) => {
  const P = WPS[key], blanks = {}, hints = ['Run the program by hand with X = 2 and Y = 1, and see what each blank has to do.'];
  idxs.forEach((i, j) => { const ans = P.lines[i], at = rnd ? Gen.r(4) : (j + 1) % 4, o = distract(ans); o.splice(at, 0, ans); blanks[i] = { opts: o, ans }; hints.push(`Blank ${j + 1} (line ${i + 1}): ${ans}`); });
  return { type: 'wfill', title, brief, lines: P.lines, blanks, tests: WTESTS, out: 'Z', f: P.f, goal: P.goal, hints };
};
const mkTF = (key, blanks, title, brief) => {
  const D = TMS[key], hints = ['Follow the machine on a small input, writing down the instantaneous descriptions.'];
  Object.entries(blanks).forEach(([i, ks]) => ks.forEach(k => hints.push(`Row ${+i + 1} (${D.rows[i][0]}, ${D.rows[i][1]}): ${{ w: 'write', m: 'move', n: 'next state' }[k]} = ${D.rows[i][{ w: 2, m: 3, n: 4 }[k]]}`)));
  return { type: 'tfill', title, brief, key, def: D, rows: D.rows, blanks, states: [...new Set(D.rows.flatMap(r => [r[0], r[4]]))].sort(), init: D.init, fin: D.fin, tests: tmTests(key).map(v => [v, D.f(v)]), goal: D.name, hints };
};
const QZ = (title, q, right, wrong, hint, at = 0) => { const o = wrong.slice(); o.splice(at, 0, right); return { type: 'formalize', plain: true, topic: 'quiz', title, brief: 'Answer the question from the notes.', sentence: q, legend: [], options: o, right: at, hints: [hint, `The answer is option ${'ABCD'[at]}.`] }; };
const QPOOL = [
  ['What is pred(0) in a while program?', '0', ['−1', 'undefined', '1'], 'There are no negative numbers: pred stops at 0.'],
  ['Which test can a while statement use, without macros?', 'X ≠ Y', ['X < Y', 'X = 0', 'X > Y'], 'The only primitive test is X ≠ Y.'],
  ['How is a number n coded on the tape?', 'n + 1 consecutive 1s', ['n consecutive 1s', 'n ones and a 0', 'its binary digits'], 'A block of n + 1 ones, so that 0 is a single 1.'],
  ['How is the vector (n1, n2) coded?', '(n1+1) ones, a 0, then (n2+1) ones', ['n1 ones, a 1, then n2 ones', 'n1 + n2 ones', '(n1+1) ones then (n2+1) ones, no separator'], 'A single 0 separates the blocks.'],
  ['A Turing machine halts in a non-final state. What is φ(n)?', 'undefined', ['0', 'the number of 1s on the tape', 'the last symbol written'], 'Only halting in a final state defines a result.'],
  ['A TM halts in a final state. What is its result?', 'the number of 1s on the tape', ['the state it halted in', 'the last symbol written', 'the head position'], 'The result is the number of 1s, consecutive or not.'],
  ['Which actions can a TM perform in a move?', 'move left, move right, stay, or halt', ['only move left or right', 'move left, right or jump anywhere', 'move right or halt'], 'The notes use L, R, N and H.'],
  ['What can make an algorithm run forever?', 'a loop', ['a macro', 'an assignment', 'a finite list of instructions'], 'Loops are the only source of infinite executions.'],
  ['What does the Church–Turing thesis say?', 'every algorithmically computable function is Turing computable', ['every Turing machine halts', 'every function is computable', 'while programs are weaker than Turing machines'], 'It identifies “algorithmic” with “Turing computable”.'],
  ['Which of these is a basic while statement?', 'X := succ(Y)', ['X := Y + 1', 'X := Y * Y', 'if X = Y then X := 0'], 'The basic statements are 0, succ and pred.'],
  ['In the description y1…yn q x1…xm, what is q?', 'the current state', ['the symbol being written', 'the number of steps', 'the final state'], 'x1 is the scanned symbol; q is the current state.'],
  ['While programs and Turing machines are…', 'equivalent: they compute the same functions', ['unrelated', 'equivalent only for addition', 'different: TMs compute more'], 'The notes show that WP and TM are equivalent.'],
];
const COMP = {
  pre: { name: 'φ(x) = f(0, x)', init: 'p0', fin: ['q2'], f: v => v[0], tests: [[0], [1], [2], [3], [4]], glue: [['p0', '1', '1', 'L', 'p0'], ['p0', '0', '0', 'L', 'p1'], ['p1', '0', '1', 'N', 'q0']] },
  post: { name: 'φ(x) = f(x, 0)', init: 'a0', fin: ['q2'], f: v => v[0], tests: [[0], [1], [2], [3], [4]], glue: [['a0', '1', '1', 'R', 'a0'], ['a0', '0', '0', 'R', 'a1'], ['a1', '0', '1', 'L', 'a2'], ['a2', '0', '0', 'L', 'a3'], ['a3', '1', '1', 'L', 'a3'], ['a3', '0', '0', 'R', 'q0']] },
  cond: { name: 'φ(x,y) = x + 1 if y = 0, otherwise f(x,y)', init: 'p0', fin: ['pf', 'q2'], f: v => v[1] === 0 ? v[0] + 1 : v[0] + v[1], tests: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 2], [2, 3]],
    glue: [['p0', '1', '1', 'R', 'p0'], ['p0', '0', '0', 'R', 'p1'], ['p1', '1', '1', 'R', 'p2'], ['p2', '0', '0', 'L', 'p3'], ['p3', '1', '0', 'N', 'pf'], ['p2', '1', '1', 'L', 'p4'], ['p4', '1', '1', 'L', 'p4'], ['p4', '0', '0', 'L', 'p5'], ['p5', '1', '1', 'L', 'p5'], ['p5', '0', '0', 'R', 'q0']] },
};
const mkTC = (key, blanks, title, brief) => {
  const C = COMP[key], rows = [...C.glue, ...TMS.ADD.rows], hints = ['Follow the machine on a small input. The rows below the line are M1 and are given.'];
  Object.entries(blanks).forEach(([i, ks]) => ks.forEach(k => hints.push(`Row ${+i + 1} (${rows[i][0]}, ${rows[i][1]}): ${{ w: 'write', m: 'move', n: 'next state' }[k]} = ${rows[i][{ w: 2, m: 3, n: 4 }[k]]}`)));
  return { type: 'tfill', topic: 'tcomp', title, brief, key, rows, split: C.glue.length, splitLabel: 'M1 (given): f(x, y) = x + y', blanks, states: [...new Set(rows.flatMap(r => [r[0], r[4]]))].sort(), init: C.init, fin: C.fin, tests: C.tests.map(v => [v, C.f(v)]), goal: C.name + ', where M1 computes f(x, y) = x + y', hints };
};
QPOOL.push(['Which conditions must hold when a machine M is built around a machine M1?', 'disjoint state sets, no contradictory transitions, and the tape prepared for M1', ['M and M1 must share all their states', 'M1 must always run on a blank tape', 'M and M1 must use different tapes'], 'The notes require Q ∩ Q1 = ∅ and T, T1 consistent, plus input preparation.']);
const LEVELS3 = [
  { type: 'wtrace', title: 'Counting Up', brief: 'Run the program in your head or with Step, then enter the final value.', lines: ['begin', 'Z := 0;', 'U := 0;', 'while U ≠ Y do', 'begin', 'Z := succ(Z);', 'U := succ(U);', 'end', 'end'], init: { Y: 3 }, ask: 'Z', ans: 3,
    hints: ['Each pass through the loop adds 1 to Z and to U, until U equals Y.', 'Press Step and watch the highlighted line.'] },
  QZ('Watch Out', 'After X := 0; X := pred(X); X := succ(X), what is the value of X?', '1', ['0', '−1', 'undefined'], 'pred(0) = 0: the natural numbers have no negatives.', 1),
  mkWF('ADD', [6, 7], 'The Adder', 'Complete the loop so that Z = X + Y. Tap a ▢ to cycle its options.'),
  mkWF('MONUS', [6, 7], 'Bounded Difference', 'Complete the loop so that Z = X ∸ Y (X − Y, or 0 if Y > X).'),
  mkWF('MUL', [5, 8, 9], 'The Multiplier', 'Two nested loops: add X to Z, Y times.'),
  { type: 'ttrace', title: 'Tape Reader', brief: 'Step through the machine from the notes on input (2, 1), then enter how many 1s remain.', def: TMS.ADD, M: toM(TMS.ADD), vec: [2, 1], ans: 3,
    hints: ['Input (2, 1) is the tape 111011, with the head on the first 1.', 'Each Step applies one row of the table to the scanned symbol.'] },
  mkTF('ADD', { 0: ['w', 'n'], 2: ['m'], 3: ['m'] }, 'First Machine', 'Complete the table so that φ(x,y) = x + y. The input has x+1 and y+1 ones, so two 1s must disappear.'),
  QZ('Church’s Verdict', 'What does the Church–Turing thesis say?', 'every algorithmically computable function is Turing computable', ['every Turing machine halts', 'every function is computable', 'while programs are weaker than Turing machines'], 'It identifies “algorithmic” with “Turing computable”.', 2),
  mkTF('PRED', { 0: ['w', 'm'], 1: ['w', 'n'], 2: ['m', 'n'] }, 'The Eraser', 'Complete the table so that φ(x) = x ∸ 1. Be careful with x = 0: the tape holds a single 1.'),
  QZ('Building Blocks', 'Which conditions must hold when a machine M is built around a machine M1?', 'disjoint state sets, no contradictory transitions, and the tape prepared for M1', ['M and M1 must share all their states', 'M1 must always run on a blank tape', 'M and M1 must use different tapes'], 'The notes require Q ∩ Q1 = ∅, consistent transition tables, and input preparation.', 1),
  mkTC('pre', { 0: ['m'], 1: ['n'], 2: ['w', 'm'] }, 'Glue Code', 'M1 computes f(x, y) = x + y. Build M with φ(x) = f(0, x): the glue rows must put the code of 0 in front of x and start M1.'),
  mkTC('cond', { 1: ['n'], 2: ['m'], 3: ['m'], 4: ['w'], 6: ['m'], 8: ['m'], 9: ['n'] }, 'The Conditional', 'Build M with φ(x,y) = x + 1 if y = 0, otherwise f(x,y). First check whether y is 0, then either clean up or start M1.'),
];
const LESSONS3 = [
  { t: 'Act III, briefing 1: While programs', steps: [
    { h: 'An <b>algorithm</b> is a finite list of instructions. Loops are the only thing that can make an execution infinite. A <b>computation model</b> fixes which operations are allowed.' },
    { h: 'In <b>While programs</b> every variable holds a natural number. The basic statements are <code>X := 0</code>, <code>X := succ(Y)</code> and <code>X := pred(Y)</code>, and <code>while X ≠ Y do …</code> repeats its body until X equals Y.', sel: '#workspace' },
    { h: 'Press <b>Step</b> to execute one statement: the highlighted line runs next. When you know the final value, enter it with the keypad and press <b>Run test</b>.', sel: '#testBtn' }] },
  { t: 'Act III, briefing 2: Watch out', steps: [
    { h: 'The domain is the natural numbers, so <code>pred(0) = 0</code>. Subtraction can never go below zero.', sel: '#workspace' }] },
  { t: 'Act III, briefing 3: Completing programs', steps: [
    { h: 'To compute <code>Z := X + Y</code>, copy X into Z, then increase Z once for every step of a counter U that runs up to Y.', sel: '#workspace' },
    { h: 'Tap a <b>▢</b> to cycle through its options. <b>Run test</b> executes your program on several inputs and tells you the first one that fails.' }] },
  { t: 'Act III, briefing 4: Bounded difference', steps: [
    { h: '<code>X ∸ Y</code> is X − Y when X ≥ Y and 0 otherwise. Because <code>pred(0) = 0</code>, you can simply subtract 1 from Z, Y times.' }] },
  { t: 'Act III, briefing 5: Multiplication', steps: [
    { h: '<code>Z := X * Y</code> adds X to Z, Y times. The outer loop counts to Y; the inner loop adds X by counting a second variable up to X. Reset the inner counter before each inner loop.' }] },
  { t: 'Act III, briefing 6: Turing machines', steps: [
    { h: 'A <b>Turing machine</b> has an infinite tape (0 is blank), a head and finite states. Each move looks up (state, scanned symbol) in the table: write a symbol, move <code>L</code>, <code>R</code>, <code>N</code> (stay) or <code>H</code> (halt), and switch state.', sel: '#workspace' },
    { h: 'A number n is coded as n+1 ones; a vector (n1, n2) as n1+1 ones, a 0, then n2+1 ones. If the machine halts in a <b>final</b> state, its result is the <b>number of 1s</b> on the tape; otherwise it is undefined.' },
    { h: 'The line below the tape is the <b>computation sequence</b>: <code>(0 q1 11011)</code> means the state is q1 and the head is on the first symbol after it.' }] },
  { t: 'Act III, briefing 7: Designing a machine', steps: [
    { h: 'Fill the missing cells of the table: tap a cell to cycle its options. For x + y, the input has x+1 and y+1 ones, so the machine must erase exactly two of them.', sel: '#workspace' },
    { h: '<b>Run test</b> runs your machine on several inputs. If one fails, you get its computation sequence to debug.' }] },
  { t: 'Act III, briefing 8: Equivalence', steps: [
    { h: 'While programs and Turing machines compute exactly the same functions. The <b>Church–Turing thesis</b> goes further: anything that can be computed algorithmically can be computed by a Turing machine.' }] },
  { t: 'Act III, briefing 9: Pred on a tape', steps: [
    { h: 'Erase the first 1. Then, if another 1 follows, erase it too and halt; if not (the input was 0), halt in a final state anyway.' }] },
  { t: 'Act III, briefing 10: Composition', steps: [
    { h: 'To reuse a machine <code>M1</code> inside a bigger machine <code>M</code>: give M its own states (<code>Q ∩ Q1 = ∅</code>), make sure the two transition tables never disagree on the same (state, symbol), <b>prepare the input</b> on the tape, put the head on the first 1, and switch to the start state of M1.' }] },
  { t: 'Act III, briefing 11: Glue code', steps: [
    { h: 'M1 computes <code>f(x, y) = x + y</code> on a tape <code>1…1 0 1…1</code>. To get <code>φ(x) = f(0, x)</code>, M must turn the tape for x into the tape for (0, x): move left past x, write a 1 (the code of 0) one cell before a separator 0, and start M1 there.', sel: '#workspace' },
    { h: 'The first rows are the <b>glue</b> you complete. The rows under the line are M1 and cannot be edited.' }] },
  { t: 'Act III, briefing 12: Conditional composition', steps: [
    { h: '<code>φ(x,y) = x+1</code> if y = 0, otherwise <code>f(x,y)</code>. Walk to the code of y and look at its second cell. If it is 0, then y = 0: step back, erase y’s only 1 (leaving x+1 ones) and halt in <code>pf</code>.' },
    { h: 'Otherwise walk back to the first 1 of x and start M1. Both branches share the walk to y, so most of the work is moving without changing the tape.' }] },
];
LESSONS3[LEVELS3.length] = LESSONS[LEVELS.length];
const QUIPS3 = {
  fail: ['That program does not halt. Neither does my disappointment.', 'Undefined. The machine could not be bothered to compute a result.', 'Your tape has been rewritten, unfortunately with errors.', 'Halted in a non-final state. The facility finds this poetic.'],
  win: ['Halted in a final state. The result is defined. How unusual.', 'Computable. The facility will make a note of it.', 'Correct. The tape is satisfied.'] };
const Gen3 = {
  build(n) { const kind = ['wfill', 'ttrace', 'tfill', 'quiz', 'wtrace', 'tfill', 'tcomp', 'wmacro'][n % 8]; return { title: Gen.pick(NAMES), ...Gen3[kind](n) }; },
  tier: n => Math.min(2, Math.floor(n / 8)),
  wfill(n) { const t = Gen3.tier(n), key = Gen.pick([['COPY', 'SUCC3', 'ADD'], ['ADD', 'DOUBLE', 'MONUS'], ['MUL', 'MAXC', 'SQ', 'MONUS']][t]); return mkWF(key, Gen.shuffle(WPS[key].bl).slice(0, Math.min(WPS[key].bl.length, 2 + (t ? 1 : 0))), null, `Complete the program so that Z = ${WPS[key].goal}.`, true); },
  wtrace(n) {
    const t = Gen3.tier(n), key = Gen.pick([['ADD', 'MONUS', 'DOUBLE'], ['ADD', 'MONUS', 'MUL'], ['MUL', 'MAXC', 'MONUS']][t]), P = WPS[key], init = { X: Gen.r(4), Y: Gen.r(4) }, code = WP.compile(WP.parse(P.lines)), env = WP.run(code, init), ask = P.lines.some(l => l.startsWith('U :=')) && Gen.r(3) === 0 ? 'U' : 'Z';
    return { type: 'wtrace', brief: 'Work out the final value, then enter it.', lines: P.lines, init, ask, ans: env[ask] || 0, hints: ['Keep a small table of the variables and update it statement by statement.', 'Pay attention to pred(0) = 0 and to the loop test X ≠ Y.'] };
  },
  ttrace(n) {
    const t = Gen3.tier(n), key = Gen.pick([['ID', 'PRED', 'LAST'], ['PRED', 'ADD', 'LAST'], ['ADD', 'DOUBLE']][t]), D = TMS[key], vec = D.ar === 2 ? [Gen.r(3), Gen.r(3)] : [Gen.r(key === 'DOUBLE' ? 3 : 5)], M = toM(D), T = TMx.run(M, vec);
    return { type: 'ttrace', brief: `Trace the machine on input (${vec.join(', ')}), then enter how many 1s the tape holds when it halts.`, def: D, M, vec, ans: T.ones, hints: ['Write the tape as a string and apply the table one move at a time.', 'The result is the number of 1s, consecutive or not.'] };
  },
  tfill(n) {
    const t = Gen3.tier(n), key = Gen.pick([['PRED', 'LAST'], ['ADD', 'PRED', 'LAST'], ['ADD', 'DOUBLE']][t]), D = TMS[key], cells = D.rows.flatMap((r, i) => ['w', 'm', 'n'].map(k => [i, k])), pick = Gen.shuffle(cells).slice(0, Math.min(cells.length - 1, 3 + t)), blanks = {};
    pick.forEach(([i, k]) => (blanks[i] = blanks[i] || []).push(k)); return mkTF(key, blanks, null, `Complete the table so that ${D.name}.`);
  },
  quiz(n) { const [q, right, wrong, hint] = Gen.pick(QPOOL); return QZ(null, q, right, wrong, hint, Gen.r(4)); },
};
Object.assign(Game.prototype, {
  legend3() { const o = this.$('ops'); (this.lv.type[0] === 'w' ? ['X := 0', 'succ', 'pred', 'while X≠Y'] : ['L', 'R', 'N', 'H']).forEach(s => o.append(el('button', { className: 'chip', textContent: s }))); },
  depths(ls) { let d = 0, prevDo = false; return ls.map(s => { const t = s.trim(); if (/^end\b/.test(t)) d--; const k = d + (prevDo && !/^begin\b/.test(t) ? 1 : 0); prevDo = /\bdo$/.test(t); if (/\bbegin$/.test(t)) d++; return Math.max(0, k); }); },
  progEl(lines, hl, blanks) {
    const d = this.depths(lines), box = el('div', { className: 'prog' });
    lines.forEach((s, i) => {
      const ln = el('div', { className: 'ln' + (i === hl ? ' cur' : '') }); ln.style.paddingLeft = (.8 + d[i] * 1.4) + 'rem';
      if (blanks && blanks[i]) { const f = this.fill[i], b = el('button', { className: 'blank' + (f != null ? ' set' : ''), textContent: f != null ? blanks[i].opts[f] : '▢ choose' }); b.onclick = () => { this.fill[i] = f == null ? 0 : f + 1 >= blanks[i].opts.length ? null : f + 1; this.drawWF(); }; ln.append(b); } else ln.textContent = s;
      box.append(ln);
    });
    return box;
  },
  numRow() {
    const inp = el('input', { className: 'numin', readOnly: true, value: this.num, placeholder: 'answer' }), row = el('div', { className: 'ansrow' }, inp);
    [...'0123456789', '⌫'].forEach(k => { const b = el('button', { className: 'key', textContent: k }); b.onclick = () => { this.num = k === '⌫' ? this.num.slice(0, -1) : (this.num + k).slice(0, 4); inp.value = this.num; }; row.append(b); });
    return row;
  },
  ctl(items) { const d = el('div', { className: 'pfrow' }); items.forEach(([t, f]) => { const b = el('button', { className: 'btn', textContent: t }); b.onclick = f; d.append(b); }); return d; },
  /* while programs */
  initWTrace() { this.code = WP.compile(WP.parse(this.lv.lines)); this.num = ''; this.wReset(); this.legend3(); this.drawW(); },
  wReset() { this.env = { ...this.lv.init }; this.pc = 0; },
  wStep(draw = true) { const c = this.code[this.pc]; if (!c) return; this.pc = WP.step(c, this.env, this.pc); if (draw) this.drawW(); },
  drawW() {
    const ws = this.$('workspace'), lv = this.lv, c = this.code[this.pc], camp = this.idx < LEVELS.length;
    ws.replaceChildren(el('p', { className: 'goalbar', textContent: `What is the value of ${lv.ask} when the program halts?` }), this.progEl(lv.lines, c ? c.ln : -1));
    const vars = el('div', { className: 'vars' }); [...new Set([...Object.keys(lv.init), ...(lv.lines.join(' ').match(/\b[A-Z]\w*/g) || [])])].sort().forEach(v => vars.append(el('span', {}, v + ' = ', el('b', { textContent: this.env[v] || 0 }))));
    const items = [['Step ▸', () => this.wStep()], ['Reset', () => { this.wReset(); this.drawW(); }]];
    if (camp) items.splice(1, 0, ['Run ▸▸', () => { let g = 0; while (this.code[this.pc] && g++ < 5000) this.wStep(false); this.drawW(); }]);
    ws.append(vars, this.ctl(items), el('p', { className: 'tip', textContent: c ? 'Highlighted: the next statement to execute.' : 'The program has halted.' }), this.numRow());
  },
  initWFill() { this.fill = {}; this.legend3(); this.drawWF(); },
  drawWF() { const lv = this.lv, ws = this.$('workspace'); ws.replaceChildren(el('p', { className: 'goalbar', textContent: `Make the program compute ${lv.out} = ${lv.goal}.` }), this.progEl(lv.lines, -1, lv.blanks), el('p', { className: 'tip', textContent: 'Tap a ▢ to cycle through its options, then press Run test.' })); },
  checkWFill() {
    const lv = this.lv; if (Object.keys(lv.blanks).some(k => this.fill[k] == null)) return 'incomplete';
    let code; try { code = WP.compile(WP.parse(lv.lines.map((s, i) => lv.blanks[i] ? lv.blanks[i].opts[this.fill[i]] : s))); } catch (e) { return 'Syntax error: ' + e.message; }
    for (const [x, y] of lv.tests) { const env = WP.run(code, { X: x, Y: y }), want = lv.f(x, y); if (!env) return `With X=${x}, Y=${y} the program does not halt (expected Z=${want}).`; if ((env.Z || 0) !== want) return `With X=${x}, Y=${y} the program leaves Z=${env.Z || 0}; expected ${want}.`; }
    return null;
  },
  /* Turing machines */
  initTTrace() { this.T = new TMx(this.lv.M, this.lv.vec); this.num = ''; this.legend3(); this.drawT(); },
  tmTable(rows) { const t = el('table', { className: 'tm' }); t.append(el('tr', {}, ...['State', 'Read', 'Write', 'Move', 'Next'].map(x => el('th', { textContent: x })))); rows.forEach(r => t.append(el('tr', {}, ...r.map(x => el('td', { textContent: x }))))); return t; },
  tapeEl(T) {
    const ks = [...T.tape.keys(), T.h], lo = Math.min(0, ...ks) - 1, hi = Math.max(T.len - 1, ...ks) + 2, box = el('div', { className: 'tape' });
    for (let p = lo; p <= hi; p++) { const s = T.sym(p), c = el('span', { className: (s === '1' ? 'one' : '') + (p === T.h ? ' head' : ''), textContent: s }); if (p === T.h) c.dataset.q = T.q; box.append(c); }
    return box;
  },
  drawT() {
    const ws = this.$('workspace'), lv = this.lv, T = this.T, camp = this.idx < LEVELS.length;
    ws.replaceChildren(el('p', { className: 'goalbar', textContent: `${lv.def.name}: input (${lv.vec.join(', ')}). How many 1s are on the tape when it halts?` }), this.tmTable(lv.def.rows), this.tapeEl(T));
    const items = [['Step ▸', () => { T.step(); this.drawT(); }], ['Reset', () => { this.T = new TMx(lv.M, lv.vec); this.drawT(); }]];
    if (camp) items.splice(1, 0, ['Run ▸▸', () => { let g = 0; while (!T.halted && g++ < 400) T.step(); this.drawT(); }]);
    ws.append(this.ctl(items), el('p', { className: 'seq', textContent: T.seq.slice(-5).join(' → ') + (T.halted ? `\nHalted in ${T.q} (${T.final ? 'a final state' : 'a non-final state'}).` : '') }), this.numRow());
  },
  initTFill() { const lv = this.lv; this.cells = lv.rows.map(r => ({ q: r[0], s: r[1], w: r[2], m: r[3], n: r[4] })); Object.entries(lv.blanks).forEach(([i, ks]) => ks.forEach(k => { this.cells[i][k] = null; })); this.lastTrace = null; this.legend3(); this.drawTF(); },
  drawTF() {
    const lv = this.lv, ws = this.$('workspace'), opts = { w: ['0', '1'], m: ['L', 'R', 'N', 'H'], n: lv.states }, t = el('table', { className: 'tm' });
    t.append(el('tr', {}, ...['State', 'Read', 'Write', 'Move', 'Next'].map(x => el('th', { textContent: x }))));
    this.cells.forEach((r, i) => { if (lv.split === i) t.append(el('tr', {}, el('th', { colSpan: 5, textContent: lv.splitLabel }))); const tr = el('tr', {}, el('td', { textContent: r.q }), el('td', { textContent: r.s }));
      ['w', 'm', 'n'].forEach(k => { if ((lv.blanks[i] || []).includes(k)) { const o = opts[k], j = o.indexOf(r[k]), b = el('button', { className: r[k] == null ? '' : 'set', textContent: r[k] == null ? '?' : r[k] }); b.onclick = () => { r[k] = j < 0 ? o[0] : j + 1 >= o.length ? null : o[j + 1]; this.drawTF(); }; tr.append(el('td', {}, b)); } else tr.append(el('td', { textContent: r[k] })); });
      t.append(tr); });
    ws.replaceChildren(el('p', { className: 'goalbar', textContent: `Build M so that ${lv.goal}. States: ${lv.states.join(', ')}; start ${lv.init}; final ${lv.fin.join(', ')}.` }), t,
      el('p', { className: 'tip', textContent: 'Tap a ? to cycle its options. Input: n is n+1 ones; a vector puts a 0 between its numbers. Result: the number of 1s when M halts in a final state.' }));
    if (this.lastTrace) ws.append(el('p', { className: 'seq', textContent: 'Computation sequence of the failing input:\n' + this.lastTrace.join(' → ') }));
  },
  checkTFill() {
    const lv = this.lv; if (this.cells.some(r => ['w', 'm', 'n'].some(k => r[k] == null))) return 'incomplete';
    const M = { init: lv.init, fin: lv.fin, rows: Object.fromEntries(this.cells.map(r => [r.q + ',' + r.s, [r.w, r.m, r.n]])) };
    for (const [vec, want] of lv.tests) { const t = TMx.run(M, vec), got = t.final ? t.ones : null; if (got !== want) { this.lastTrace = t.seq.slice(0, 14); return `On input (${vec.join(', ')}) the machine ${t.final ? 'answers ' + got : t.loop ? 'never halts' : 'halts in a non-final state (undefined)'}; expected ${want}.`; } }
    this.lastTrace = null; return null;
  },
});
ACT[3] = { levels: LEVELS3, lessons: LESSONS3, name: 'Proof Lab III: Computation' };
document.getElementById('begin3Btn').onclick = () => { if (ACTN !== 3) window.game.switchAct(3); document.getElementById('intro').className = 'gone'; sfx('ok'); speak('Act three. The machine would now like to discuss halting.'); };
