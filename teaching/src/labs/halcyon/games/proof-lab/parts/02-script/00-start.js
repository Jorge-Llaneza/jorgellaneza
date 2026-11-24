
'use strict';
/* ========== Logic engine ========== */
const SYM = { and: '∧', or: '∨', imp: '→', iff: '↔' };

class Logic {
  // Precedence (tight → loose): ¬  ∧  ∨  →(right-assoc)  ↔
  static parse(src) {
    const s = src.replace(/∧/g, '&').replace(/∨/g, '|').replace(/[¬~]/g, '!').replace(/↔/g, '<->').replace(/→/g, '->');
    const tk = s.match(/<->|->|[A-Za-z]\w*|[!&|()]/g) || [];
    if (!tk.length || tk.join('').length !== s.replace(/\s+/g, '').length) throw new Error('Unrecognised symbol in formula.');
    let i = 0;
    const peek = () => tk[i];
    const iff = () => { let l = imp(); while (peek() === '<->') { i++; l = { t: 'iff', a: l, b: imp() }; } return l; };
    const imp = () => { const l = or(); if (peek() === '->') { i++; return { t: 'imp', a: l, b: imp() }; } return l; };
    const or = () => { let l = and(); while (peek() === '|') { i++; l = { t: 'or', a: l, b: and() }; } return l; };
    const and = () => { let l = not(); while (peek() === '&') { i++; l = { t: 'and', a: l, b: not() }; } return l; };
    const not = () => { if (peek() === '!') { i++; return { t: 'not', a: not() }; } return atom(); };
    const atom = () => {
      const x = peek();
      if (x === '(') { i++; const e = iff(); if (peek() !== ')') throw new Error('Missing closing parenthesis.'); i++; return e; }
      if (x && /^[A-Za-z]/.test(x)) { i++; return { t: 'var', n: x }; }
      throw new Error('Expected a proposition.');
    };
    const r = iff();
    if (i < tk.length) throw new Error(`Unexpected "${tk[i]}".`);
    return r;
  }
  static ev(n, env) {
    switch (n.t) {
      case 'var': return !!env[n.n];
      case 'not': return !Logic.ev(n.a, env);
      case 'and': return Logic.ev(n.a, env) && Logic.ev(n.b, env);
      case 'or': return Logic.ev(n.a, env) || Logic.ev(n.b, env);
      case 'imp': return !Logic.ev(n.a, env) || Logic.ev(n.b, env);
      case 'iff': return Logic.ev(n.a, env) === Logic.ev(n.b, env);
    }
  }
  static str(n) {
    if (n.t === 'var') return n.n;
    if (n.t === 'not') return '¬' + Logic.w(n.a);
    return Logic.w(n.a) + ' ' + SYM[n.t] + ' ' + Logic.w(n.b);
  }
  static w(n) { return n.t === 'var' || n.t === 'not' ? Logic.str(n) : '(' + Logic.str(n) + ')'; }
  static eq(a, b) { return Logic.str(a) === Logic.str(b); }
  static size(n) { return n.t === 'var' ? 1 : 1 + Logic.size(n.a) + (n.b ? Logic.size(n.b) : 0); }
  static vars(...ns) {
    const s = new Set();
    const walk = n => { if (n.t === 'var') s.add(n.n); else { walk(n.a); if (n.b) walk(n.b); } };
    ns.forEach(walk);
    return [...s].sort();
  }
  static rows(vs) { // all assignments, all-true first
    return Array.from({ length: 2 ** vs.length }, (_, i) => Object.fromEntries(vs.map((v, j) => [v, !((i >> (vs.length - 1 - j)) & 1)])));
  }
  static equivalent(a, b) { return Logic.rows(Logic.vars(a, b)).every(e => Logic.ev(a, e) === Logic.ev(b, e)); }
  static entails(prem, c) { return Logic.rows(Logic.vars(c, ...prem)).every(e => !prem.every(p => Logic.ev(p, e)) || Logic.ev(c, e)); }
}

/* ========== Natural deduction rules (as in the course notes) ========== */
const N = a => ({ t: 'not', a });
const RL = {
  'Assume': { hint: 'open a sub-proof' }, '∧I': { hint: 'A, B ⊢ A∧B' }, '∧E': { hint: 'A∧B ⊢ A, B' }, '∨I': { hint: 'A ⊢ A∨B' },
  '∨E': { hint: 'A∨B, A→C, B→C ⊢ C' }, '→I': { hint: 'A…B ⊢ A→B' }, '→E': { hint: 'A, A→B ⊢ B' },
  '↔I': { hint: 'A→B, B→A ⊢ A↔B' }, '↔E': { hint: 'A↔B ⊢ A→B, B→A' }, '¬I': { hint: 'A…B∧¬B ⊢ ¬A' }, '¬E': { hint: '¬A…B∧¬B ⊢ A' },
};
const PF = 'Select lines, then click a rule card. Each line shows its justification, like in the notes.';
const LEVELS = [
  { type: 'circuit', title: 'Wake-Up Call', brief: 'Route power to the exit: switch emitters on or off until the whole circuit glows.',
    formula: '(P -> Q) & P & !R', hints: ['P must be on, otherwise the middle gate fails.', 'With P on, P → Q only holds if Q is on. R must be off.'] },
  { type: 'table', title: 'Table Manners', brief: 'Complete the truth table for the implication. Click cells to cycle T / F.',
    formula: 'P -> Q', hints: ['An implication is false in exactly one case.', 'P → Q is false only when P is true and Q is false.'] },
  { type: 'table', title: 'De Morgan’s Prism', brief: 'Fill in the table for ¬(P ∧ Q). Does it remind you of anything?',
    formula: '!(P & Q)', hints: ['Work out P ∧ Q first, then negate it.', '¬(P ∧ Q) ≡ ¬P ∨ ¬Q, so it is false only when both are true.'] },
  { type: 'proof', title: 'Split and Join', brief: 'Prove {p ∧ q} ⊢ p ∧ (q ∨ r). ' + PF, premises: ['p & q'], goal: 'p & (q | r)', rules: ['Assume', '∧E', '∨I', '∧I'], sol: [['∧E', [1]], ['∨I', [3], 'r'], ['∧I', [2, 4]]],
    hints: ['∧E on line 1 gives p and q.', 'Tap r in the formula box, select the line q, click ∨I: you get q ∨ r.', 'Select p, then q ∨ r, and click ∧I.'] },
  { type: 'proof', title: 'Modus Ponens', brief: 'Prove {p → q ∧ r, p} ⊢ r. ' + PF, premises: ['p -> (q & r)', 'p'], goal: 'r', rules: ['→E', '∧E'], sol: [['→E', [1, 2]], ['∧E', [3]]],
    hints: ['Select lines 1 and 2, click →E: you get q ∧ r.', 'Then ∧E on q ∧ r gives r.'] },
  { type: 'proof', title: 'Assumptions', brief: 'Prove {p → q, q → r} ⊢ p → r. Open a sub-proof with Assume.', premises: ['p -> q', 'q -> r'], goal: 'p -> r', rules: ['Assume', '→E', '→I'], sol: [['Assume', [], 'p'], ['→E', [1, 3]], ['→E', [2, 4]], ['→I', []]],
    hints: ['Tap p in the formula box, then click Assume.', 'Inside it: →E on lines 1 and 3 gives q, then →E on 2 and q gives r.', 'Click →I: it closes the block and writes p → r.'] },
  { type: 'proof', title: 'Contradiction', brief: 'Prove {p ∧ q} ⊢ ¬¬p. Assume the opposite and reach a contradiction.', premises: ['p & q'], goal: '!!p', rules: ['Assume', '∧E', '∧I', '¬I'], sol: [['Assume', [], '!p'], ['∧E', [1]], ['∧I', [2, 3]], ['¬I', []]],
    hints: ['Tap ¬ and p in the formula box, then click Assume.', '∧E on line 1 gives p. Then ∧I on ¬p and p gives ¬p ∧ p.', 'Click ¬I to close the block and conclude ¬¬p.'] },
  { type: 'proof', title: 'The Long Corridor', brief: 'Prove {p → q, q → r} ⊢ ¬r → ¬p (exercise c in the notes).', premises: ['p -> q', 'q -> r'], goal: '!r -> !p', rules: ['Assume', '→E', '∧I', '¬I', '→I'], sol: [['Assume', [], '!r'], ['Assume', [], 'p'], ['→E', [1, 4]], ['→E', [2, 5]], ['∧I', [6, 3]], ['¬I', []], ['→I', []]],
    hints: ['Assume ¬r, then (inside it) assume p.', '→E gives q, →E again gives r. ∧I joins r and ¬r.', '¬I closes the p block (¬p). →I closes the ¬r block: ¬r → ¬p.'] },
  { type: 'simplify', title: 'Redundancy Review', brief: 'Rewrite the formula as an equivalent, shorter one. Tap the letters and operators below, or type.',
    formula: 'A | (!A & B)', ans: 'A ∨ B', hints: ['Distribute: (A ∨ ¬A) ∧ (A ∨ B).', 'A ∨ ¬A is always true, so only A ∨ B remains.'] },
];
const QUIPS = {
  fail: ['That deduction was not so much invalid as aspirational.', 'The facility notes your confidence. It does not note your correctness.',
    'Incorrect. A rare moment of honesty from the turrets: they agree.', 'Your proof has been filed under “creative writing”.'],
  win: ['Chamber complete. The facility is statistically surprised.', 'Valid. Please do not let it go to your head.',
    'Well reasoned. The exit door has been unsealed at your expense.'],
};
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ========== Game ========== */
class Game {
  constructor() {
    this.$ = id => document.getElementById(id);
    this.save = this.load();
    ['testBtn', 'hintBtn', 'resetBtn', 'nextBtn'].forEach(id => this.$(id).addEventListener('click', () => this[id.replace('Btn', '')]()));
    const ws = this.$('workspace');
    ws.addEventListener('dragover', e => { if (this.lv.type === 'proof') { e.preventDefault(); ws.classList.add('drop'); } });
    ws.addEventListener('dragleave', () => ws.classList.remove('drop'));
    ws.addEventListener('drop', e => { e.preventDefault(); ws.classList.remove('drop'); const r = e.dataTransfer.getData('text/rule'); if (r) this.applyRule(r); });
    this.start(this.save.unlocked >= LEVELS.length ? (this.save.run ? this.save.run.idx : LEVELS.length) : this.save.unlocked);
  }
  load() { try { return JSON.parse(localStorage.getItem('apl-save2')) || { unlocked: 0, best: {}, total: 0 }; } catch { return { unlocked: 0, best: {}, total: 0 }; } }
  persist() { try { localStorage.setItem('apl-save2', JSON.stringify(this.save)); } catch {} }
  say(msg, kind = '') { const f = this.$('feedback'); f.textContent = (kind === 'ok' ? '✓ ' : kind === 'bad' ? '✗ ' : '') + msg; f.className = kind; }

  start(i) {
    this.idx = i; if (i >= LEVELS.length && !this.rv) { this.save.run = this.save.run || { idx: i, v: 100, n: 0, pts: 0 }; this.save.run.idx = i; }
    this.lv = this.rvLv || (i < LEVELS.length ? LEVELS[i] : Gen.make(i)); this.hints = 0; this.wrong = 0; this.solved = false; this.hintIdx = 0;
    this.$('nextBtn').hidden = true; if (!this.rv) this.$('nextBtn').textContent = 'Walk to exit'; this.tf = 0; this.peeked = false; this.$('solBtn').hidden = true; this.$('solBtn').textContent = 'Solution'; this.$('door').className = 'door'; this.$('door').lastChild.textContent = 'Exit sealed';
    this.$('chamberTitle').textContent = i < LEVELS.length ? `Instruction ${i + 1} of ${LEVELS.length}: ${this.lv.title}` : `Test ${i + 1 - LEVELS.length}: ${this.lv.title}`;
    this.$('objective').textContent = this.lv.brief;
    keepScroll = 0; this.$('workspace').scrollTop = 0; this.$('workspace').replaceChildren();
    this.buildToolbox(); this.hud();
    ({ circuit: () => this.initCircuit(), table: () => this.initTable(), proof: () => this.initProof(), simplify: () => this.initSimplify(), model: () => this.initModel(), eval: () => this.initEval(), formalize: () => this.initChoice(), wtrace: () => this.initWTrace(), wfill: () => this.initWFill(), ttrace: () => this.initTTrace(), tfill: () => this.initTFill(), refute: () => this.initRefute() })[this.lv.type]();
    this.say('Chamber ready. Proceed with mild optimism.'); if (!this.rv && LESSONS[i] && !(this.save.seen || {})[i]) brief.open(i);
  }
  hud() {
    this.$('score').textContent = this.save.total; this.$('num').textContent = String(this.idx + 1).padStart(2, '0'); this.$('rank').textContent = Gen.rank(this.save.total) + (this.save.streak > 1 ? ', streak ' + this.save.streak : ''); this.vit();
    const pips = this.$('pips'); pips.replaceChildren();
    if (this.save.unlocked >= LEVELS.length) { const b = el('button', { textContent: '∞', title: 'Endless test track' }); b.style.order = 99; if (this.idx >= LEVELS.length) b.classList.add('cur'); b.onclick = () => { this.rv = null; this.rvLv = null; this.start(this.save.run ? this.save.run.idx : LEVELS.length); }; pips.append(b); }
    LEVELS.forEach((_, i) => {
      const b = el('button', { textContent: i + 1, disabled: i > this.save.unlocked });
      if (this.save.best[i] != null) b.classList.add('done'); if (i === this.idx) b.classList.add('cur');
      b.onclick = () => { this.rv = null; this.rvLv = null; this.start(i); }; pips.append(b);
    });
  }
  buildToolbox() {
    const rules = this.$('rules'), ops = this.$('ops'); rules.replaceChildren(); ops.replaceChildren();
    (this.lv.rules || []).forEach(k => {
      const c = el('button', { className: 'chip', draggable: true, innerHTML: `${k}<small>${RL[k].hint}</small>` });
      c.ondragstart = e => e.dataTransfer.setData('text/rule', k);
      c.onclick = () => this.applyRule(k); rules.append(c);
    });
    if (!this.lv.rules && ACTN !== 3) rules.append(el('span', { textContent: 'No inference rules needed here.' }));
    if (!['proof', 'model', 'eval', 'formalize', 'wtrace', 'wfill', 'ttrace', 'tfill', 'refute'].includes(this.lv.type)) [['¬', '¬'], ['∧', '∧'], ['∨', '∨'], ['→', '→'], ['↔', '↔']].forEach(([s]) => {
      const c = el('button', { className: 'chip', innerHTML: `${s}<small>${OPN[s]}</small>` }); c.onclick = () => this.lv.type === 'simplify' && this.insert(s); ops.append(c);
    });
  }

  /* ---- Circuit ---- */
  initCircuit() { this.ast = Logic.parse(this.lv.formula); this.env = Object.fromEntries(Logic.vars(this.ast).map(v => [v, false])); this.drawCircuit(); }
  drawCircuit() {
    const ws = this.$('workspace'); ws.replaceChildren();
    ws.append(el('p', { className: 'formula', textContent: Logic.str(this.ast) }));
    const tg = el('div', { className: 'toggles' });
    Object.keys(this.env).forEach(v => { const b = el('button', { className: 'emitter' + (this.env[v] ? ' on' : ''), textContent: `${v} = ${this.env[v] ? 'T' : 'F'}` });
      b.onclick = () => { this.env[v] = !this.env[v]; this.drawCircuit(); }; tg.append(b); });
    ws.append(tg, this.gate(this.ast));
  }
  gate(n) {
    const on = (n.t === 'var' || this.idx < LEVELS.length) && Logic.ev(n, this.env), g = el('div', { className: 'gate' + (on ? ' on' : '') });
    if (n.t === 'var') { g.append(el('span', { className: 'op', textContent: n.n })); return g; }
    g.append(el('span', { className: 'op', textContent: n.t === 'not' ? '¬' : SYM[n.t] }), el('span', { className: 'beam' }));
    const k = el('div', { className: 'kids' }); k.append(this.gate(n.a)); if (n.b) k.append(this.gate(n.b)); g.append(k); return g;
  }

  /* ---- Truth table ---- */
  initTable() {
    this.ast = Logic.parse(this.lv.formula); this.vs = Logic.vars(this.ast); this.rows = Logic.rows(this.vs);
    this.cells = this.rows.map(() => null); this.checked = false; this.drawTable();
  }
  drawTable() {
    const t = el('table', { className: 'tt' }), h = el('tr');
    [...this.vs, Logic.str(this.ast)].forEach(x => h.append(el('th', { textContent: x }))); t.append(h);
    this.rows.forEach((r, i) => {
      const tr = el('tr'); this.vs.forEach(v => tr.append(el('td', { textContent: r[v] ? 'T' : 'F' })));
      const ans = Logic.ev(this.ast, r), v = this.cells[i];
      const b = el('button', { textContent: v == null ? '?' : v ? 'T' : 'F' });
      if (this.checked && v != null) b.className = v === ans ? 'right' : 'wrong';
      b.onclick = () => { this.cells[i] = v == null ? true : v ? false : null; this.checked = false; this.drawTable(); };
      tr.append(el('td', {}, b)); t.append(tr);
    });
    this.$('workspace').replaceChildren(t);
  }

  /* ---- Natural deduction (Fitch style, as in the notes; Act II adds the quantifier rules) ---- */
  initProof() {
    this.LG = this.lv.pred ? Pred : Logic;
    this.lines = this.lv.premises.map(p => ({ f: this.LG.parse(p), why: 'Premise', path: [] }));
    this.goal = this.LG.parse(this.lv.goal); this.open = []; this.sel = []; this.hist = []; this.drawProof();
  }
  avail(l) { return l.path.every((x, k) => this.open[k] === x); }
  drawProof() {
    const LG = this.LG, ws = this.$('workspace'), keep = (this.$('pf') || {}).value || '';
    ws.replaceChildren(el('p', { className: 'goalbar', textContent: '{' + this.lv.premises.map(p => LG.str(LG.parse(p))).join(', ') + '}  ⊢  ' + LG.str(this.goal) }));
    const ul = el('ul', { className: 'lines' });
    this.lines.forEach((l, i) => {
      const ok = this.avail(l);
      const li = el('li', { className: [this.sel.includes(i) && 'sel', !ok && 'dim', (l.kind || l.why === 'Assumption') ? 'asm' : '', this.idx < LEVELS.length && !l.path.length && LG.eq(l.f, this.goal) && 'goal'].filter(Boolean).join(' ') });
      li.style.marginLeft = l.path.length * 1.5 + 'rem';
      li.append(el('span', { textContent: i + 1 }), el('span', { textContent: LG.str(l.f) }), el('em', { textContent: l.why }));
      li.onclick = () => { this.sel = this.sel.includes(i) ? this.sel.filter(x => x !== i) : [...this.sel, i]; this.drawProof(); };
      ul.append(li);
    });
    const inp = el('input', { id: 'pf', type: 'text', value: keep, placeholder: 'Formula box: build it with the keys below', autocomplete: 'off', spellcheck: false });
    const un = el('button', { className: 'btn', textContent: 'Undo' }); un.onclick = () => this.undo();
    const pad = el('div', { className: 'pad' });
    const keys = this.lv.pred ? [...Object.keys(Pred.sig(this.goal, ...this.lines.map(l => l.f))), 'a', 'b', 't', 'x', 'y', '∀', '∃', '¬', '∧', '∨', '→', '↔', '(', ')', ',', '⌫', 'clear']
      : [...Logic.vars(...this.lv.premises.map(p => Logic.parse(p)), this.goal), '¬', '∧', '∨', '→', '↔', '(', ')', '⌫', 'clear'];
    keys.forEach(x => { const b = el('button', { className: 'key', textContent: x }); b.onclick = () => { inp.value = x === '⌫' ? inp.value.slice(0, -1) : x === 'clear' ? '' : inp.value + x; }; pad.append(b); });
    ws.append(ul, el('div', { className: 'pfrow' }, inp, un), pad, el('p', { className: 'tip', textContent: this.lv.pred ? 'The box feeds Assume, ∃I (the target formula) and Free / Pick / ∀E (a constant such as t).' : 'The formula box feeds Assume (the formula you assume) and ∨I (the other side of the disjunction).' }));
  }
  undo() { const s = this.hist.pop(); if (!s || this.solved) return; this.lines.length = s.n; this.open = s.open; this.sel = []; this.drawProof(); }
  applyRule(k) {
    if (this.lv.type !== 'proof' || this.solved) return;
    const LG = this.LG, L = this.lines, F = i => L[i].f, s = this.sel, D = this.open.length, snap = { n: L.length, open: [...this.open] };
    const add = (f, why, x = {}) => L.push({ f, why, path: [...this.open], ...x });
    const need = (n, m) => s.length === n || this.fail(`${k} needs ${n} selected line(s): ${m}.`);
    const raw = () => (this.$('pf').value || '').trim();
    const typed = () => { const v = raw(); return v ? LG.parse(v) : null; };
    const term = () => { const v = raw(); if (!/^[a-z]\w*$/.test(v)) throw new Error('Type a constant such as a or t in the formula box.'); return v; };
    const closing = () => {
      if (!D) { this.fail(`${k} closes a sub-proof, but none is open.`); return null; }
      const a = this.open[D - 1], last = s.length === 1 ? s[0] : L.length - 1;
      if (last <= a || L[last].path.length !== D || !this.avail(L[last])) { this.fail(`Select the last line of the open block, then click ${k}.`); return null; }
      return [a, last];
    };
    const n1 = i => i + 1, K = x => ({ t: 'const', n: x });
    try {
      switch (k) {
        case 'Assume': { const f = typed(); if (!f) return this.fail('Type the assumption in the formula box first.'); this.open.push(L.length); add(f, 'Assumption'); break; }
        case '∧I': { if (!need(2, 'A, then B')) return; add({ t: 'and', a: F(s[0]), b: F(s[1]) }, `∧I ${n1(s[0])},${n1(s[1])}`); break; }
        case '∧E': { if (!need(1, 'A ∧ B')) return; if (F(s[0]).t !== 'and') return this.fail('∧E needs a conjunction A ∧ B.'); add(F(s[0]).a, `∧E ${n1(s[0])}`); add(F(s[0]).b, `∧E ${n1(s[0])}`); break; }
        case '∨I': { if (!need(1, 'A')) return; const f = typed(), a = F(s[0]);
          if (!f) return this.fail('Fill the formula box with the other side of the disjunction (for example r), then click ∨I.');
          add(f.t === 'or' && (LG.eq(f.a, a) || LG.eq(f.b, a)) ? f : { t: 'or', a, b: f }, `∨I ${n1(s[0])}`); break; }
        case '∨E': { if (!need(3, 'A ∨ B, A → C and B → C')) return;
          const fs = s.map(F), o = fs.findIndex(f => f.t === 'or'); if (o < 0) return this.fail('∨E needs a disjunction A ∨ B.');
          const d = fs[o], [x, y] = fs.filter((_, i) => i !== o), ok = (p, q) => p.t === 'imp' && q.t === 'imp' && LG.eq(p.a, d.a) && LG.eq(q.a, d.b) && LG.eq(p.b, q.b);
          const r = ok(x, y) ? x : ok(y, x) ? y : null; if (!r) return this.fail('∨E needs A → C and B → C with the same C.');
          add(r.b, '∨E ' + [s[o], ...s.filter((_, i) => i !== o)].map(n1).join(',')); break; }
        case '→E': { if (!need(2, 'A → B and A')) return;
          const t = (i, j) => F(i).t === 'imp' && LG.eq(F(i).a, F(j)) ? [i, j] : null, m = t(s[0], s[1]) || t(s[1], s[0]);
          if (!m) return this.fail('→E needs A → B and A.'); add(F(m[0]).b, `→E ${n1(m[0])},${n1(m[1])}`); break; }
        case '↔I': { if (!need(2, 'A → B and B → A')) return; const [x, y] = [F(s[0]), F(s[1])];
          if (x.t !== 'imp' || y.t !== 'imp' || !LG.eq(x.a, y.b) || !LG.eq(x.b, y.a)) return this.fail('↔I needs A → B and B → A.'); add({ t: 'iff', a: x.a, b: x.b }, `↔I ${n1(s[0])},${n1(s[1])}`); break; }
        case '↔E': { if (!need(1, 'A ↔ B')) return; const f = F(s[0]); if (f.t !== 'iff') return this.fail('↔E needs A ↔ B.');
          add({ t: 'imp', a: f.a, b: f.b }, `↔E ${n1(s[0])}`); add({ t: 'imp', a: f.b, b: f.a }, `↔E ${n1(s[0])}`); break; }
        case '∀E': { if (!need(1, '∀x A(x)')) return; const A = F(s[0]); if (A.t !== 'all') return this.fail('∀E needs a line ∀x A(x).');
          add(Pred.subst(A.a, A.v, K(term())), `∀E ${n1(s[0])}`); break; }
        case '∃I': { if (!need(1, 'A(t)')) return; const T = typed(), A = F(s[0]);
          if (!T || T.t !== 'ex' || ![...Pred.consts(A), null].some(c => Pred.eq(c ? Pred.subst(T.a, T.v, K(c)) : T.a, A))) return this.fail('∃I: type the target ∃x A(x) in the box, where A(t) is the selected line.');
          add(T, `∃I ${n1(s[0])}`); break; }
        case 'Free': case 'Pick': {
          const t = term(); let A = null;
          if (k === 'Pick') { if (!need(1, '∃x A(x)')) return; A = F(s[0]); if (A.t !== 'ex') return this.fail('Pick needs a line ∃x A(x).'); }
          if (L.some(l => this.avail(l) && Pred.has(l.f, t))) return this.fail(`${t} is not free: it already appears in an open line. Choose a new constant.`);
          this.open.push(L.length);
          add(k === 'Free' ? { t: 'free', n: t } : Pred.subst(A.a, A.v, K(t)), k === 'Free' ? 'Free constant' : 'Assumption', { kind: k === 'Free' ? 'free' : 'pick', c: t, ex: s[0] }); break; }
        case '∀I': { const c = closing(); if (!c) return; const [a, last] = c; if (L[a].kind !== 'free') return this.fail('∀I closes a block opened with Free.');
          const B = F(last), v = Pred.fresh(B); this.open.pop(); add({ t: 'all', v, a: Pred.abs(B, L[a].c, v) }, `∀I ${a + 1}-${last + 1}`); break; }
        case '∃E': { const c = closing(); if (!c) return; const [a, last] = c; if (L[a].kind !== 'pick') return this.fail('∃E closes a block opened with Pick.');
          const B = F(last); if (Pred.has(B, L[a].c)) return this.fail(`The conclusion must not mention ${L[a].c}.`);
          this.open.pop(); add(B, `∃E ${L[a].ex + 1}, ${a + 1}-${last + 1}`); break; }
        default: { // →I, ¬I, ¬E close the innermost assumption block
          const c = closing(); if (!c) return; const [a, last] = c, A = F(a), B = F(last);
          if (L[a].kind) return this.fail('That block was opened with Free or Pick: close it with ∀I or ∃E.');
          if (k !== '→I' && !(B.t === 'and' && (LG.eq(B.b, N(B.a)) || LG.eq(B.a, N(B.b))))) return this.fail('The sub-proof must end in a contradiction B ∧ ¬B.');
          if (k === '¬E' && A.t !== 'not') return this.fail('¬E needs the assumption to be ¬A.');
          this.open.pop(); add(k === '→I' ? { t: 'imp', a: A, b: B } : k === '¬I' ? N(A) : A.a, `${k} ${a + 1}-${last + 1}`);
        }
      }
    } catch (e) { return this.fail(e.message); }
    this.hist.push(snap); { const rr = this.stats().rules = this.stats().rules || {}; rr[k] = (rr[k] || 0) + 1; } this.sel = []; this.drawProof();
    this.say(this.idx < LEVELS.length && L.some(l => !l.path.length && LG.eq(l.f, this.goal)) ? 'Goal derived. Press Run test.' : 'Line accepted.');
  }

  /* ---- Simplification ---- */
  initSimplify() {
    this.ast = Logic.parse(this.lv.formula);
    this.input = el('input', { type: 'text', placeholder: 'Type an equivalent formula…', autocomplete: 'off', spellcheck: false });
    this.input.setAttribute('autocapitalize', 'off');
    this.input.oninput = () => this.preview();
    this.input.onkeydown = e => { if (e.key === 'Enter') this.test(); };
    this.pv = el('p', { className: 'goalbar' });
    this.$('workspace').append(el('p', { className: 'formula', textContent: Logic.str(this.ast) }), el('div', { className: 'simp' }, this.input), this.pv);
    const ops = this.$('ops');
    [...Logic.vars(this.ast), '(', ')', '⌫', 'clear'].reverse().forEach(s => {
      const c = el('button', { className: 'chip', textContent: s });
      c.onclick = () => { if (s === '⌫') this.input.value = this.input.value.slice(0, -1); else if (s === 'clear') this.input.value = ''; else this.insert(s); this.preview(); };
      ops.prepend(c);
    });
    this.preview();
  }
  insert(s) { this.input.value += s; this.preview(); }
  preview() {
    try { const g = Logic.parse(this.input.value);
      this.pv.textContent = this.idx >= LEVELS.length ? 'Reads as: ' + Logic.str(g) : `${Logic.str(g)}: ${Logic.equivalent(g, this.ast) ? 'equivalent' : 'not equivalent yet'}, size ${Logic.size(g)} (original ${Logic.size(this.ast)})`;
    } catch { this.pv.textContent = this.input.value ? 'Keep typing…' : ''; }
  }

  /* ---- Testing ---- */
  test() {
    if (this.solved) return;
    let ok = false, msg = '';
    switch (this.lv.type) {
      case 'refute': ok = this.rl.some(l => !l.c.length); msg = 'The empty clause has not been derived.'; break;
      case 'wtrace': case 'ttrace': if (this.num === '') return this.say('Enter a number first (not counted).', 'bad'); ok = Number(this.num) === this.lv.ans; msg = 'That is not the value the computation ends with.'; break;
      case 'wfill': case 'tfill': { const r = this.lv.type === 'wfill' ? this.checkWFill() : this.checkTFill(); if (r === 'incomplete') return this.say('Fill every blank first (not counted).', 'bad'); ok = r === null; msg = r || ''; if (this.lv.type === 'tfill') this.drawTF(); break; }
      case 'model': ok = Pred.ev(this.ast, this.M) === (this.lv.want !== false); msg = 'The formula does not have the required truth value under that interpretation.'; break;
      case 'eval': if (this.ans.includes(null)) return this.say('Answer every formula first (not counted).', 'bad'); this.checked = true; ok = this.fs.every((f, i) => this.ans[i] === Pred.ev(f, this.M)); this.drawEval(); msg = 'Red answers are wrong.'; break;
      case 'formalize': if (this.pick == null) return this.say('Choose a formula first (not counted).', 'bad'); ok = this.pick === this.lv.right; msg = 'That formula does not say what the sentence says.'; break;
      case 'circuit': ok = Logic.ev(this.ast, this.env); msg = 'The circuit is still dark.'; break;
      case 'table':
        if (this.cells.includes(null)) return this.say('Incomplete table. The facility cannot grade blank cells.', 'bad');
        this.checked = true; ok = this.rows.every((r, i) => this.cells[i] === Logic.ev(this.ast, r)); this.drawTable();
        msg = 'Red cells disagree with the semantics.'; break;
      case 'proof': ok = this.lines.some(l => !l.path.length && this.LG.eq(l.f, this.goal)); msg = 'The goal has not been derived.'; break;
      case 'simplify':
        try { const g = Logic.parse(this.input.value);
          if (!Logic.equivalent(g, this.ast)) msg = 'Not equivalent: some assignment disagrees. Check your truth table.';
          else if (Logic.size(g) >= Logic.size(this.ast)) msg = 'Equivalent, but not simpler. Brevity is a virtue here.';
          else ok = true;
        } catch (e) { return this.say(e.message + ' (a typo does not count as a failed test)', 'bad'); } break;
    }
    ok ? (this.rv ? this.rvWin() : this.win()) : this.rvFail(msg);
  }
  fail(msg, cost = 8) {
    sfx('bad'); this.wrong++;
    const run = this.idx >= LEVELS.length && !this.rv && this.save.run;
    if (!run) return this.say(`${msg} ${pick(Q().fail)}`, 'bad');
    run.v = Math.max(0, run.v - Math.round(cost * D().fail)); this.persist(); this.vit();
    if (run.v <= 0) return this.dispose();
    this.say(`${msg} ${run.v > 60 ? pick(Q().fail) : pick(run.v > 30 ? DOOM.mid : DOOM.low)}`, 'bad');
  }
  win() {
    this.solved = true; sfx('ok'); setTimeout(() => sfx('door'), 600);
    const clean = !this.hints && !this.wrong, rk0 = Gen.rank(this.save.total);
    this.save.streak = clean ? (this.save.streak || 0) + 1 : 0;
    const pts = Math.max(10, 100 - 15 * this.hints - 10 * this.wrong) + (clean ? 5 * Math.min(this.save.streak, 10) : 0), prev = this.save.best[this.idx] || 0;
    if (pts > prev) { this.save.total += pts - prev; this.save.best[this.idx] = pts; }
    this.save.unlocked = Math.max(this.save.unlocked, this.idx + 1); this.persist();
    this.$('door').className = 'door open'; this.$('door').lastChild.textContent = 'Exit open';
    this.$('nextBtn').hidden = false;
    const run = this.idx >= LEVELS.length && !this.rv && this.save.run;
    if (run) { run.v = Math.min(100, run.v + Math.round((clean ? 25 : 15) * D().gain * Math.max(.4, 1 - run.n * .02))); run.n++; run.pts += pts; this.save.bestN = Math.max(this.save.bestN || 0, run.n); this.save.bestPts = Math.max(this.save.bestPts || 0, run.pts); this.persist(); }
    this.recordTopic(true); this.srsPass(); this.hud(); const rk = Gen.rank(this.save.total);
    this.say(`${this.idx === LEVELS.length - 1 ? 'Instruction complete. From the next test on, failure is measured, and a useless subject is disposed of. ' : ''}${pick(Q().win)} +${pts} points${clean && this.save.streak > 1 ? ', streak ' + this.save.streak : ''}.${rk !== rk0 ? ' Promoted to ' + rk + '.' : ''}`, 'ok');
  }
  hint() { if (this.rv && this.rv.mode === 'exam') return this.say('No hints in the exam.', 'bad');
    const h = this.lv.hints[this.hintIdx++];
    if (!h) return this.say('No more hints. The facility has run out of sympathy.');
    const run = this.idx >= LEVELS.length && !this.rv && this.save.run;
    if (run) { if (run.v <= 10) { this.hintIdx--; return this.say('Hints are denied to subjects this close to disposal.', 'bad'); } run.v -= D().hint; this.persist(); this.vit(); }
    this.hints++; this.say('Hint: ' + h);
  }
  vit() {
    const en = this.idx >= LEVELS.length && !this.rv, r = this.save.run, box = this.$('vit');
    box.hidden = !en;
    if (en && r) { box.firstElementChild.style.width = r.v + '%'; this.$('vitTxt').textContent = `Usefulness ${r.v}%, survived ${r.n}`; }
    document.body.classList.toggle('danger', !!(en && r && r.v <= 25));
  }
  dispose() {
    this.solved = true; const r = this.save.run || { n: 0, pts: 0 }, rec = r.n > (this.save.bestN || 0);
    this.save.bestN = Math.max(this.save.bestN || 0, r.n); this.save.bestPts = Math.max(this.save.bestPts || 0, r.pts); this.save.run = null; this.persist();
    this.vit(); sfx('bad'); this.say('Usefulness depleted. Disposal initiated.', 'bad'); this.cut(r, rec);
  }
  cut(r, rec) {
    const svg = this.$('cutSvg'), sub = this.$('cutSub'), no = 1000 + Gen.r(9000); this.cutStop();
    document.body.classList.add('disposal'); svg.classList.remove('cz', 'out'); sub.textContent = ''; this.$('cut').hidden = false; this.pend = [r, rec, no];
    const lines = [[0, ACTN === 3 ? 'Alert. Process terminated: usefulness did not halt in a final state.' : ACTN === 2 ? 'Alert. Usefulness has fallen below the photosynthetic threshold.' : 'Alert. Usefulness threshold breached.', 'siren'], [2000, `Test subject ${no} is no longer useful to the learning programme.`, 'hum'],
      [4200, 'Please proceed to the recycling conveyor. Cake will be served.', 'jingle'], [6400, ACTN === 3 ? 'Correction: the cake is not computable.' : ACTN === 2 ? 'Correction: the cake has gone off.' : 'Correction: the cake has been reclassified as theoretical.', 'whoosh'], [8300, ACTN === 3 ? 'Halting. Your tape will now be erased.' : ACTN === 2 ? 'Thank you. The facility will compost your contribution.' : 'Thank you for your contribution to science.', '']];
    let at = 0; const gap = m => Math.max(3200, 1200 + 65 * m.length);
    this.cutT = lines.map(([, m, s]) => { const t = at; at += gap(m); return setTimeout(() => { sub.textContent = m; if (s) sfx(s); speak(m); }, t); });
    const last = at - gap(lines[lines.length - 1][1]) + gap(lines[lines.length - 1][1]);
    this.cutT.push(setTimeout(() => svg.classList.add('cz'), last + 300), setTimeout(() => { svg.classList.add('out'); sfx('puff'); }, last + 2100), setTimeout(() => this.report(r, rec, no), last + 3700));
  }
  cutStop() { (this.cutT || []).forEach(clearTimeout); this.cutT = []; try { speechSynthesis.cancel(); } catch {} this.$('cut').hidden = true; }
  skipCut() { const p = this.pend; if (p) this.report(...p); }
  report(r, rec, no) {
    this.cutStop(); this.pend = null;
    const grade = r.n >= 15 ? 'S' : r.n >= 10 ? 'A' : r.n >= 6 ? 'B' : r.n >= 3 ? 'C' : 'D', row = (k, v, i) => `<dt style="--i:${i}">${k}</dt><dd style="--i:${i}">${v}</dd>`;
    this.$('dNo').textContent = `Subject ${no}`;
    this.$('dText').textContent = Gen.pick(['The facility thanks you for your data. It will be put to good use.', 'You were measured, found wanting, and efficiently recycled.', 'Your last proof has been archived under “instructive failures”.', 'A moment of silence was scheduled, then cancelled for lack of use.']);
    this.$('dStats').innerHTML = row('Tests survived', r.n + (rec ? ' (new record)' : ''), 0) + row('Run points', r.pts, 1) + row('Usefulness grade', grade, 2) + row('Best run', `${this.save.bestN} tests, ${this.save.bestPts} pts`, 3) + row('Rank', Gen.rank(this.save.total), 4) + row('Cake', 'Reserved for useful subjects', 5);
    this.$('dispose').hidden = false; sfx('door');
  }
  restart() { this.cutStop(); this.pend = null; this.$('dispose').hidden = true; document.body.classList.remove('disposal', 'danger'); Gen.cache = {}; this.save.run = null; this.start(LEVELS.length); }
  reset() { this.start(this.idx); }
  next() { if (this.rv) return this.rvAdvance(); if (this.idx === LEVELS.length - 1 && this.story('end')) return; document.body.classList.add('walk'); sfx('door'); setTimeout(() => { this.start(this.idx + 1); document.body.classList.remove('walk'); }, 1300); }
}

function el(tag, props = {}, ...kids) { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; }
document.addEventListener('DOMContentLoaded', () => { window.game = new Game(); });

let ac, muted = false;
function sfx(k) { if (muted) return; try { ac = ac || new AudioContext(); const t = ac.currentTime;
  const n = (f, s, d, ty = 'square', v = .05) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = ty; o.frequency.setValueAtTime(f, t + s);
    g.gain.setValueAtTime(v, t + s); g.gain.exponentialRampToValueAtTime(.001, t + s + d); o.connect(g).connect(ac.destination); o.start(t + s); o.stop(t + s + d); };
  ({ click: () => n(880, 0, .05), ok: () => [523, 659, 784, 1047].forEach((f, i) => n(f, i * .09, .22, 'triangle', .08)),
     bad: () => { n(180, 0, .25, 'sawtooth', .08); n(130, .12, .3, 'sawtooth', .08); }, door: () => n(90, 0, 1, 'sawtooth', .06),
     siren: () => [0, 1, 2, 3].forEach(i => { n(620, i * .5, .25, 'sawtooth', .05); n(460, i * .5 + .25, .25, 'sawtooth', .05); }), hum: () => n(55, 0, 2.2, 'square', .05),
     bird: () => [0, .11, .22].forEach((s, i) => { n(2500 + i * 350, s, .07, 'sine', .025); n(3300 - i * 200, s + .05, .05, 'sine', .015); }),
     jingle: () => [392, 330, 294, 262].forEach((f, i) => n(f, i * .28, .35, 'triangle', .07)), puff: () => { n(300, 0, .15, 'sine', .1); n(110, .06, .4, 'sine', .08); },
     whoosh: () => { const b = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
       const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; g.gain.value = .12; s.connect(g).connect(ac.destination); s.start(t); } })[k](); } catch {} }
let voiceOn = (() => { try { return localStorage.getItem('apl-voice') !== 'off'; } catch { return true; } })();
function setVoice(v) { voiceOn = v; try { localStorage.setItem('apl-voice', v ? 'on' : 'off'); } catch {} if (!v) try { speechSynthesis.cancel(); } catch {} }
/* the announcer only speaks at key moments (welcome, act starts, disposal); it is slower, softer and less robotic than before */
function speak(m) { try { if (muted || !voiceOn || !window.speechSynthesis || document.getElementById('intro').className !== 'gone') return; speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(m), vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)), v = vs.find(v => /natural|google uk english female|samantha|aria|jenny/i.test(v.name)) || vs[0];
  if (v) u.voice = v; u.pitch = .9; u.rate = .88; u.volume = .7; speechSynthesis.speak(u); } catch {} }
document.addEventListener('click', e => { if (e.target.closest('button')) sfx('click'); });
document.getElementById('beginBtn').onclick = () => { if (ACTN !== 1) window.game.switchAct(1); document.getElementById('intro').className = 'gone'; window.game.story('intro'); sfx('ok'); speak('Welcome to the proof lab. Please try not to be wrong.'); };
document.getElementById('muteBtn').onclick = e => { muted = !muted; e.target.textContent = muted ? 'Sound off' : 'Sound on'; speechSynthesis && speechSynthesis.cancel(); };


const OPN = { '¬': 'NOT', '∧': 'AND', '∨': 'OR', '→': 'IF…THEN', '↔': 'IFF' };
const LESSONS = [
  { t: 'Briefing 1: True and false', steps: [
    { h: 'A <b>proposition</b> (P, Q, R…) is a statement that is either <b>true</b> or <b>false</b>. Each orange switch is a laser emitter: lit means true, dark means false. Click one.', sel: '#workspace' },
    { h: '<b>Operators</b> combine propositions. <code>¬</code> NOT flips a value. <code>∧</code> AND needs both true. <code>∨</code> OR needs at least one. <code>→</code> IF…THEN is false only when the first part is true and the second false.', sel: '#ops' },
    { h: 'Each gate glows when its result is true. Make the whole formula true, then press <b>Run test</b>. Stuck? <b>Hint</b> helps, but costs points.', sel: '#testBtn' }] },
  { t: 'Briefing 2: Truth tables', steps: [
    { h: 'A <b>truth table</b> lists every combination of inputs and the result for each. Two propositions give 4 rows, three give 8.', sel: '#workspace' },
    { h: 'Click a cell to cycle <code>?</code>, <code>T</code>, <code>F</code>. For <code>P → Q</code>: if P is true and Q is false the promise is broken, so <b>F</b>. Every other row is <b>T</b>, because a false P promises nothing.', sel: '#workspace' }] },
  { t: 'Briefing 3: De Morgan', steps: [
    { h: 'Work in two steps: first find <code>P ∧ Q</code> in your head, then flip it with ¬. The finished column matches <code>¬P ∨ ¬Q</code>.' },
    { h: 'That is <b>De Morgan’s law</b>: negating an AND gives an OR of negations. The same works the other way, <code>¬(P ∨ Q) ≡ ¬P ∧ ¬Q</code>.' }] },
  { t: 'Briefing 4: Natural deduction', steps: [
    { h: '<b>Natural deduction</b> derives a conclusion from premises. <code>{p ∧ q} ⊢ p ∧ (q ∨ r)</code> reads: the goal can be derived from the premises. Each connective has a rule to <b>introduce</b> it (I) and one to <b>eliminate</b> it (E).', sel: '#workspace' },
    { h: 'Click a line to select it, then click a rule card. <code>∧E</code>: from <code>A ∧ B</code> get <code>A</code> and <code>B</code>. <code>∧I</code>: from <code>A</code> and <code>B</code> get <code>A ∧ B</code>. Order matters for ∧I: select A first.', sel: '#rules' },
    { h: '<code>∨I</code>: from <code>A</code> get <code>A ∨ B</code>. Build <code>B</code> in the formula box with the keys (for <code>q ∨ r</code> from <code>q</code>, tap <code>r</code>), select the line, then click <code>∨I</code>. The right column shows each justification, like <code>∧E 1</code>.', sel: '#pf' }] },
  { t: 'Briefing 5: Implication elimination', steps: [
    { h: '<code>→E</code> (also known as modus ponens): from <code>A → B</code> and <code>A</code> get <code>B</code>. Select both lines in any order and click it.', sel: '#rules' },
    { h: 'Premises can be nested: <code>p → (q ∧ r)</code> gives <code>q ∧ r</code> by →E, and then <code>∧E</code> splits it.' }] },
  { t: 'Briefing 6: Assumptions', steps: [
    { h: 'To prove <code>A → B</code>, <b>assume</b> A, derive B, then close with <code>→I</code>. Tap <code>p</code> in the formula box and click <b>Assume</b>: a new indented block opens.', sel: '#pf' },
    { h: 'Inside the block you can still use the outer lines. When you have the line you need, click <code>→I</code>: it writes <code>A → B</code> citing the block (like <code>→I 3-5</code>) and closes it. Lines of a closed block turn gray and cannot be reused.', sel: '#workspace' }] },
  { t: 'Briefing 7: Negation', steps: [
    { h: 'To prove <code>¬A</code>: assume <code>A</code>, derive a contradiction <code>B ∧ ¬B</code>, then click <code>¬I</code>. Here you want <code>¬¬p</code>, so assume <code>¬p</code> (tap <code>¬</code> then <code>p</code>).' },
    { h: 'Its twin <code>¬E</code>: assume <code>¬A</code>, derive a contradiction, and conclude <code>A</code>. Both rules close the block you are in.' }] },
  { t: 'Briefing 8: Nested blocks', steps: [
    { h: 'Blocks can nest. Assume <code>¬r</code>, then assume <code>p</code> inside it. Derive a contradiction, close the inner block with <code>¬I</code>, then close the outer one with <code>→I</code>.' },
    { h: 'Use <b>Undo</b> if you take a wrong turn. Rule rejected? The message tells you what the rule expects.' }] },
  { t: 'Briefing 9: Simplifying', steps: [
    { h: 'Two formulas are <b>equivalent</b> when their truth tables match. Build a shorter equivalent with the letter and operator buttons (or type <code>! &amp; | -&gt;</code>). A live line below tells you whether it is equivalent.', sel: '#ops' },
    { h: 'In code, <code>a&lt;b || (a&gt;=b &amp;&amp; c==d)</code> can drop its middle test. Here: either A is true, or A is false and B must be true. Either way, <code>A ∨ B</code> says the same.' }] },
];
const brief = {
  i: 0, s: 0,
  open(i) { this.i = i; this.s = 0; this.draw(); document.getElementById('brief').hidden = false; },
  draw() {
    const L = LESSONS[this.i], st = L.steps[this.s], g = id => document.getElementById(id);
    g('bTitle').textContent = L.t; g('bBody').innerHTML = st.h; g('bStep').textContent = `${this.s + 1} / ${L.steps.length}`;
    g('bBack').disabled = !this.s; g('bNext').textContent = this.s === L.steps.length - 1 ? 'Start chamber' : 'Next';
    document.querySelectorAll('.spot').forEach(e => e.classList.remove('spot'));
    const e = st.sel && document.querySelector(st.sel); if (e) e.classList.add('spot');
  },
  step(d) { const n = this.s + d; if (n >= LESSONS[this.i].steps.length) return this.close(); this.s = Math.max(0, n); this.draw(); },
  close() {
    document.getElementById('brief').hidden = true; document.querySelectorAll('.spot').forEach(e => e.classList.remove('spot'));
    const g = window.game; if (g) { (g.save.seen = g.save.seen || {})[this.i] = 1; g.persist(); }
  },
};
