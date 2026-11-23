'use strict';
/* ==========================================================================
   Code Translator & Logic Engine
   --------------------------------------------------------------------------
   1. Language core  : Tokenizer -> Parser -> Interpreter (records a trace)
   2. Game rules     : PredictionRules, scoring constants, level data
   3. UI controller  : Game (HUD, code inspector, RAM, challenge phases)

   The interpreter runs a small, safe subset of JavaScript (no eval):
   let/const/var, assignment (=, +=, -=, *=, /=, %=, ++, --), if / else if /
   else, while, for, function, return, arrays (literals, [i], .length, .push,
   .includes, .indexOf, .join), strings, Math.*, console.log.
   Block scoping is simplified: variables live in the function (or global)
   frame, which keeps the RAM table easy to read.
   ========================================================================== */

const MAX_DEPTH = 25;      // call-stack limit before "stack overflow"
const TRACE_LIMIT = 900;   // max clock ticks recorded for the stepper
const RUN_LIMIT = 5000;    // max ticks when silently running tests
const PTS = { predict: 10, predictRetry: 5, streakCap: 10, diagnose: 40, diagnoseRetry: 20,
              fix: 100, fixFloor: 25, fixPenalty: 15, understand: 10, plan: 30, planFloor: 10, planPenalty: 10, code: 60, codeFloor: 20, codePenalty: 10, fullTrace: 50, levelBonus: 25, hint: 5 };

/* ---------------------------------------------------------------- errors */
class LangError extends Error {
  constructor(message, line) { super(message); this.name = 'SyntaxError'; this.line = line || null; }
}
class RuntimeErr extends Error {
  constructor(message, line) { super(message); this.name = 'RuntimeError'; this.line = line || null; }
}
class Halt { constructor(reason) { this.reason = reason; } }

/* --------------------------------------------------------------- helpers */
class Obj { constructor(cls, fields) { this.cls = cls; this.fields = fields; } }
const cloneVal = (v) => (Array.isArray(v) ? v.map(cloneVal) : v instanceof Obj ? new Obj(v.cls, Object.fromEntries(Object.entries(v.fields).map(([k, x]) => [k, cloneVal(x)]))) : v);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function javaType(v) {
  if (Array.isArray(v)) { const e = v.find((x) => x !== undefined); return (e === undefined ? 'int' : javaType(e)) + '[]'; }
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'double';
  if (typeof v === 'string') return 'String';
  if (typeof v === 'boolean') return 'boolean';
  if (v instanceof Obj) return v.cls;
  return 'Object';
}
let UI_LANG = 'js';
function fmtVal(v, lang = UI_LANG) {
  if (v === undefined) return lang === 'py' ? 'None' : lang === 'java' ? 'null' : 'undefined';
  if (v === null) return lang === 'py' ? 'None' : 'null';
  if (typeof v === 'boolean') return lang === 'py' ? (v ? 'True' : 'False') : String(v);
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return (lang === 'java' ? '{' : '[') + v.map((x) => fmtVal(x, lang)).join(', ') + (lang === 'java' ? '}' : ']');
  if (v instanceof Obj) return `${v.cls}{${Object.entries(v.fields).map(([k, x]) => k + '=' + fmtVal(x, lang)).join(', ')}}`;
  return String(v);
}
const fmtOut = (v, lang) => (typeof v === 'string' ? v : fmtVal(v, lang));
function typeName(v, lang) {
  if (lang === 'java') return v === null || v === undefined ? 'null' : javaType(v);
  if (Array.isArray(v)) return lang === 'py' ? `list[${v.length}]` : `array[${v.length}]`;
  if (v === null) return lang === 'py' ? 'NoneType' : 'null';
  if (lang === 'py') return typeof v === 'number' ? (Number.isInteger(v) ? 'int' : 'float') : typeof v === 'string' ? 'str' : typeof v === 'boolean' ? 'bool' : typeof v;
  return typeof v;
}
const mergeType = (a, b) => (!a ? b : a === b ? a : (a === 'int' && b === 'double') || (a === 'double' && b === 'int') ? 'double' : a);
const BUILTIN_CALLS = new Set(['len', 'abs', 'min', 'max', 'range', 'print']);
const PY_BUILTINS = {
  len: (x) => x.length, abs: Math.abs, min: Math.min, max: Math.max,
};

function containsCall(node) {
  if (!node || typeof node !== 'object') return false;
  if (Array.isArray(node)) return node.some(containsCall);
  if (node.type === 'call' && node.callee && node.callee.type === 'ident' && !BUILTIN_CALLS.has(node.callee.name)) return true;
  if (node.type === 'new') return true;
  if (node.type === 'call' && node.callee && node.callee.type === 'member' && !['equals', 'includes', 'indexOf', 'join', 'push'].includes(node.callee.prop) && !(node.callee.obj.type === 'ident' && ['Math', 'console'].includes(node.callee.obj.name))) return true;
  return Object.values(node).some(containsCall);
}

const HL = {
  js: { kw: 'function|let|const|var|if|else|while|for|return', lit: 'true|false|null|undefined', obj: 'console|Math', com: '\\/\\/.*$' },
  py: { kw: 'def|if|elif|else|while|for|in|return|and|or|not|pass', lit: 'True|False|None', obj: 'math', com: '#.*$' },
  java: { kw: 'public|private|final|class|static|void|int|boolean|double|String|new|this|if|else|while|for|return', lit: 'true|false|null', obj: 'System|Math', com: '\\/\\/.*$' },
};
const HL_RE = {};
function highlight(line, lang = 'js') {
  const h = HL[lang] || HL.js;
  const re = HL_RE[lang] || (HL_RE[lang] = new RegExp(`(${h.com})|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')|\\b(${h.kw})\\b|\\b(${h.lit})\\b|\\b(\\d+(?:\\.\\d+)?)\\b|\\b([A-Za-z_$][\\w$]*)(?=\\s*\\()|\\b(${h.obj})\\b`, 'g'));
  re.lastIndex = 0;
  let out = '', last = 0, m;
  while ((m = re.exec(line))) {
    out += esc(line.slice(last, m.index));
    const cls = m[1] ? 'tok-com' : m[2] ? 'tok-str' : m[3] ? 'tok-kw' : m[4] ? 'tok-lit' : m[5] ? 'tok-num' : m[6] ? 'tok-fn' : 'tok-obj';
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = re.lastIndex;
  }
  return out + esc(line.slice(last));
}

/* ============================================================ 1. TOKENIZER */
const KEYWORDS = new Set(['let', 'const', 'var', 'function', 'if', 'else', 'while', 'for', 'return', 'true', 'false', 'null', 'undefined']);

class Tokenizer {
  constructor(src) { this.src = src; }
  tokenize() {
    const src = this.src, toks = [];
    const ops3 = ['===', '!=='];
    const ops2 = ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%='];
    let i = 0, line = 1;
    while (i < src.length) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (/\d/.test(c)) {
        let j = i; while (j < src.length && /[\d.]/.test(src[j])) j++;
        toks.push({ t: 'num', v: parseFloat(src.slice(i, j)), line, start: i, end: j }); i = j; continue;
      }
      if (/[A-Za-z_$]/.test(c)) {
        let j = i; while (j < src.length && /[\w$]/.test(src[j])) j++;
        const w = src.slice(i, j);
        toks.push({ t: KEYWORDS.has(w) ? 'kw' : 'id', v: w, line, start: i, end: j }); i = j; continue;
      }
      if (c === '"' || c === "'") {
        let j = i + 1, s = '';
        while (j < src.length && src[j] !== c) {
          if (src[j] === '\n') throw new LangError('Unterminated string', line);
          if (src[j] === '\\') { j++; const e = src[j]; s += e === 'n' ? '\n' : e === 't' ? '\t' : e; } else s += src[j];
          j++;
        }
        if (j >= src.length) throw new LangError('Unterminated string', line);
        toks.push({ t: 'str', v: s, line, start: i, end: j + 1 }); i = j + 1; continue;
      }
      const three = src.substr(i, 3), two = src.substr(i, 2);
      if (ops3.includes(three)) { toks.push({ t: 'op', v: three, line, start: i, end: i + 3 }); i += 3; continue; }
      if (ops2.includes(two)) { toks.push({ t: 'op', v: two, line, start: i, end: i + 2 }); i += 2; continue; }
      if ('+-*/%<>=!(){}[];,.'.includes(c)) { toks.push({ t: 'op', v: c, line, start: i, end: i + 1 }); i++; continue; }
      throw new LangError(`Unexpected character '${c}'`, line);
    }
    toks.push({ t: 'eof', v: 'end of program', line, start: src.length, end: src.length });
    return toks;
  }
}

/* ============================================================== 2. PARSER */
class Parser {
  constructor(src) { this.src = src; this.toks = new Tokenizer(src).tokenize(); this.p = 0; }
  get tok() { return this.toks[this.p]; }
  peekIs(v) { const t = this.tok; return (t.t === 'op' || t.t === 'kw') && t.v === v; }
  eat(v) {
    if (!this.peekIs(v)) throw new LangError(`Expected '${v}' but found '${this.tok.v}'`, this.tok.line);
    return this.toks[this.p++];
  }
  accept(v) { if (this.peekIs(v)) { this.p++; return true; } return false; }

  parseProgram() {
    const body = [];
    while (this.tok.t !== 'eof') body.push(this.parseStatement());
    return body;
  }
  parseBlock() {
    this.eat('{');
    const body = [];
    while (!this.peekIs('}')) {
      if (this.tok.t === 'eof') throw new LangError("Missing closing '}'", this.tok.line);
      body.push(this.parseStatement());
    }
    this.eat('}');
    return body;
  }
  parseBody() { return this.peekIs('{') ? this.parseBlock() : [this.parseStatement()]; }

  parseStatement() {
    const t = this.tok, line = t.line;
    if (t.t === 'kw') {
      switch (t.v) {
        case 'function': return this.parseFunction();
        case 'let': case 'const': case 'var': { const n = this.parseDecl(); this.accept(';'); return n; }
        case 'if': return this.parseIf();
        case 'while': {
          this.p++;
          const { expr, text } = this.parseParenCond();
          return { type: 'while', cond: expr, text, body: this.parseBody(), line };
        }
        case 'for': return this.parseFor();
        case 'return': {
          this.p++;
          let value = null;
          if (!this.peekIs(';') && !this.peekIs('}') && this.tok.t !== 'eof') value = this.parseExpr();
          this.accept(';');
          return { type: 'return', value, line };
        }
        default: break;
      }
    }
    const n = this.toStatement(this.parseExpr(), line);
    this.accept(';');
    return n;
  }

  parseFunction() {
    const line = this.eat('function').line;
    const nameTok = this.tok;
    if (nameTok.t !== 'id') throw new LangError('Function needs a name', nameTok.line);
    this.p++;
    this.eat('(');
    const params = [];
    while (!this.peekIs(')')) {
      if (this.tok.t !== 'id') throw new LangError('Expected a parameter name', this.tok.line);
      params.push(this.toks[this.p++].v);
      if (!this.accept(',')) break;
    }
    this.eat(')');
    return { type: 'func', name: nameTok.v, params, body: this.parseBlock(), line };
  }

  parseDecl() {
    const line = this.tok.line;
    this.p++; // let / const / var
    const nameTok = this.tok;
    if (nameTok.t !== 'id') throw new LangError('Expected a variable name', nameTok.line);
    this.p++;
    let value = null;
    if (this.accept('=')) value = this.parseExpr();
    return { type: 'assign', declare: true, target: { type: 'ident', name: nameTok.v }, op: '=', value, line };
  }

  parseParenCond() {
    this.eat('(');
    const first = this.tok;
    const expr = this.parseExpr();
    const last = this.toks[this.p - 1];
    this.eat(')');
    return { expr, text: this.src.slice(first.start, last.end) };
  }

  parseIf() {
    const line = this.eat('if').line;
    const { expr, text } = this.parseParenCond();
    const then = this.parseBody();
    let otherwise = null;
    if (this.accept('else')) otherwise = this.peekIs('if') ? [this.parseIf()] : this.parseBody();
    return { type: 'if', cond: expr, text, then, else: otherwise, line };
  }

  parseFor() {
    const line = this.eat('for').line;
    this.eat('(');
    let init = null, cond = null, text = '', update = null;
    if (!this.peekIs(';')) {
      init = (this.peekIs('let') || this.peekIs('const') || this.peekIs('var')) ? this.parseDecl() : this.toStatement(this.parseExpr(), line);
      init.line = line;
    }
    this.eat(';');
    if (!this.peekIs(';')) {
      const first = this.tok;
      cond = this.parseExpr();
      text = this.src.slice(first.start, this.toks[this.p - 1].end);
    }
    this.eat(';');
    if (!this.peekIs(')')) { update = this.toStatement(this.parseExpr(), line); update.line = line; }
    this.eat(')');
    return { type: 'for', init, cond, text, update, body: this.parseBody(), line };
  }

  toStatement(e, line) {
    if (e.type === 'assignExpr') return { type: 'assign', declare: false, target: e.target, op: e.op, value: e.value, line };
    if (e.type === 'call' && e.callee.type === 'member') {
      const o = e.callee.obj, p = e.callee.prop;
      if (o.type === 'ident' && o.name === 'console' && p === 'log') return { type: 'print', args: e.args, line };
      if (o.type === 'ident' && p === 'push') return { type: 'push', name: o.name, args: e.args, line };
    }
    return { type: 'expr', expr: e, line };
  }

  /* ---- expressions (lowest -> highest precedence) ---- */
  parseExpr() { return this.parseAssignment(); }
  parseAssignment() {
    const left = this.parseOr();
    const t = this.tok;
    if (t.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%='].includes(t.v)) {
      if (left.type !== 'ident' && left.type !== 'index' && left.type !== 'member') throw new LangError('Invalid assignment target', t.line);
      this.p++;
      return { type: 'assignExpr', target: left, op: t.v, value: this.parseAssignment(), line: t.line };
    }
    if (t.t === 'op' && (t.v === '++' || t.v === '--') && (left.type === 'ident' || left.type === 'index' || left.type === 'member')) {
      this.p++;
      return { type: 'assignExpr', target: left, op: t.v === '++' ? '+=' : '-=', value: { type: 'lit', value: 1 }, line: t.line };
    }
    return left;
  }
  binary(next, ops) {
    let left = next.call(this);
    while (this.tok.t === 'op' && ops.includes(this.tok.v)) {
      const { v: op, line } = this.toks[this.p++];
      left = { type: 'binary', op, left, right: next.call(this), line };
    }
    return left;
  }
  parseOr() { return this.binary(this.parseAnd, ['||']); }
  parseAnd() { return this.binary(this.parseEq, ['&&']); }
  parseEq() { return this.binary(this.parseRel, ['===', '!==', '==', '!=']); }
  parseRel() { return this.binary(this.parseAdd, ['<', '>', '<=', '>=']); }
  parseAdd() { return this.binary(this.parseMul, ['+', '-']); }
  parseMul() { return this.binary(this.parseUnary, ['*', '/', '%']); }
  parseUnary() {
    if (this.peekIs('!') || this.peekIs('-')) {
      const { v: op, line } = this.toks[this.p++];
      return { type: 'unary', op, arg: this.parseUnary(), line };
    }
    return this.parsePostfix();
  }
  parsePostfix() {
    let e = this.parsePrimary();
    for (;;) {
      const line = this.tok.line;
      if (this.peekIs('(')) {
        this.p++;
        const args = [];
        while (!this.peekIs(')')) { args.push(this.parseExpr()); if (!this.accept(',')) break; }
        this.eat(')');
        e = { type: 'call', callee: e, args, line };
      } else if (this.peekIs('[')) {
        this.p++;
        const index = this.parseExpr();
        this.eat(']');
        e = { type: 'index', obj: e, index, line };
      } else if (this.peekIs('.')) {
        this.p++;
        const nameTok = this.tok;
        if (nameTok.t !== 'id' && nameTok.t !== 'kw') throw new LangError("Expected a property name after '.'", nameTok.line);
        this.p++;
        e = { type: 'member', obj: e, prop: nameTok.v, line };
      } else break;
    }
    return e;
  }
  parsePrimary() {
    const t = this.tok;
    if (t.t === 'num' || t.t === 'str') { this.p++; return { type: 'lit', value: t.v }; }
    if (t.t === 'kw' && ['true', 'false', 'null', 'undefined'].includes(t.v)) {
      this.p++;
      return { type: 'lit', value: t.v === 'true' ? true : t.v === 'false' ? false : t.v === 'null' ? null : undefined };
    }
    if (t.t === 'id') { this.p++; return { type: 'ident', name: t.v, line: t.line }; }
    if (this.peekIs('(')) { this.p++; const e = this.parseExpr(); this.eat(')'); return e; }
    if (this.peekIs('[')) {
      this.p++;
      const items = [];
      while (!this.peekIs(']')) { items.push(this.parseExpr()); if (!this.accept(',')) break; }
      this.eat(']');
      return { type: 'array', items };
    }
    throw new LangError(`Unexpected '${t.v}'`, t.line);
  }
}

