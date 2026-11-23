/* ================================================= 2b. PYTHON AND JAVA FRONT ENDS
   Both parsers build the SAME syntax tree as the JavaScript parser, so one
   interpreter (with a few per-language rules) can step through all three. */
const PY_KEYWORDS = new Set(['def', 'if', 'elif', 'else', 'while', 'for', 'in', 'return', 'True', 'False', 'None', 'and', 'or', 'not', 'pass']);

class PyTokenizer {
  constructor(src) { this.src = src; }
  tokenize() {
    const src = this.src, toks = [], indents = [0];
    const ops2 = ['==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '//', '**'];
    let depth = 0, offset = 0;
    const rows = src.split('\n');
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r], line = r + 1, base = offset;
      offset += row.length + 1;
      let i = 0;
      if (depth === 0) {
        let sp = 0;
        while (i < row.length && (row[i] === ' ' || row[i] === '\t')) { if (row[i] === '\t') throw new LangError('TabError: use spaces to indent', line); sp++; i++; }
        if (i >= row.length || row[i] === '#') continue;          // blank or comment-only line
        if (sp > indents[indents.length - 1]) { indents.push(sp); toks.push({ t: 'indent', v: 'indent', line, start: base, end: base + sp }); }
        else {
          while (sp < indents[indents.length - 1]) { indents.pop(); toks.push({ t: 'dedent', v: 'dedent', line, start: base, end: base + sp }); }
          if (sp !== indents[indents.length - 1]) throw new LangError('IndentationError: unindent does not match any outer indentation level', line);
        }
      }
      while (i < row.length) {
        const c = row[i], start = base + i;
        if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
        if (c === '#') break;
        if (/\d/.test(c)) { let j = i; while (j < row.length && /[\d.]/.test(row[j])) j++; toks.push({ t: 'num', v: parseFloat(row.slice(i, j)), line, start, end: base + j }); i = j; continue; }
        if (/[A-Za-z_]/.test(c)) { let j = i; while (j < row.length && /\w/.test(row[j])) j++; const w = row.slice(i, j); toks.push({ t: PY_KEYWORDS.has(w) ? 'kw' : 'id', v: w, line, start, end: base + j }); i = j; continue; }
        if (c === '"' || c === "'") {
          let j = i + 1, s = '';
          while (j < row.length && row[j] !== c) { if (row[j] === '\\') { j++; const e = row[j]; s += e === 'n' ? '\n' : e === 't' ? '\t' : e; } else s += row[j]; j++; }
          if (j >= row.length) throw new LangError('SyntaxError: unterminated string literal', line);
          toks.push({ t: 'str', v: s, line, start, end: base + j + 1 }); i = j + 1; continue;
        }
        const two = row.substr(i, 2);
        if (ops2.includes(two)) { toks.push({ t: 'op', v: two, line, start, end: base + i + 2 }); i += 2; continue; }
        if ('+-*/%<>=()[],:.'.includes(c)) { if ('([' .includes(c)) depth++; if (')]'.includes(c)) depth = Math.max(0, depth - 1); toks.push({ t: 'op', v: c, line, start, end: base + i + 1 }); i++; continue; }
        throw new LangError(`SyntaxError: unexpected character '${c}'`, line);
      }
      if (depth === 0 && toks.length && toks[toks.length - 1].t !== 'nl') toks.push({ t: 'nl', v: 'newline', line, start: base + row.length, end: base + row.length });
    }
    const last = rows.length;
    if (toks.length && toks[toks.length - 1].t !== 'nl' && toks[toks.length - 1].t !== 'dedent') toks.push({ t: 'nl', v: 'newline', line: last, start: src.length, end: src.length });
    while (indents.length > 1) { indents.pop(); toks.push({ t: 'dedent', v: 'dedent', line: last, start: src.length, end: src.length }); }
    toks.push({ t: 'eof', v: 'end of program', line: last, start: src.length, end: src.length });
    return toks;
  }
}

class PyParser {
  constructor(src) { this.src = src; this.toks = new PyTokenizer(src).tokenize(); this.p = 0; }
  get tok() { return this.toks[this.p]; }
  is(t, v) { const k = this.tok; return k.t === t && (v === undefined || k.v === v); }
  isOp(v) { return this.is('op', v); }
  isKw(v) { return this.is('kw', v); }
  fail(msg, line) { throw new LangError(msg, line || this.tok.line); }
  expectOp(v) { if (!this.isOp(v)) this.fail(`SyntaxError: expected '${v}' but found '${this.tok.v}'`); return this.toks[this.p++]; }
  expectKw(v) { if (!this.isKw(v)) this.fail(`SyntaxError: expected '${v}' but found '${this.tok.v}'`); return this.toks[this.p++]; }
  name() { if (!this.is('id')) this.fail(`SyntaxError: expected a name but found '${this.tok.v}'`); return this.toks[this.p++].v; }
  endLine() { if (this.is('nl')) { this.p++; return; } if (this.is('eof') || this.is('dedent')) return; this.fail(`SyntaxError: unexpected '${this.tok.v}'`); }

  parseProgram() {
    const body = [];
    while (!this.is('eof')) { if (this.is('nl')) { this.p++; continue; } body.push(this.stmt()); }
    return body;
  }
  block() {
    this.expectOp(':');
    if (!this.is('nl')) this.fail('SyntaxError: put the body on the next line, indented');
    this.p++;
    if (!this.is('indent')) this.fail('IndentationError: expected an indented block');
    this.p++;
    const body = [];
    while (!this.is('dedent') && !this.is('eof')) { if (this.is('nl')) { this.p++; continue; } body.push(this.stmt()); }
    if (this.is('dedent')) this.p++;
    return body;
  }
  condText() {
    const first = this.tok, expr = this.expr(), last = this.toks[this.p - 1];
    return { expr, text: this.src.slice(first.start, last.end) };
  }
  stmt() {
    const t = this.tok, line = t.line;
    if (t.t === 'indent') this.fail('IndentationError: unexpected indent');
    if (t.t === 'kw') {
      switch (t.v) {
        case 'def': {
          this.p++; const name = this.name(); this.expectOp('(');
          const params = [];
          while (!this.isOp(')')) { params.push(this.name()); if (this.isOp(',')) this.p++; else break; }
          this.expectOp(')');
          return { type: 'func', name, params, body: this.block(), line };
        }
        case 'if': return this.ifStmt();
        case 'while': { this.p++; const { expr, text } = this.condText(); return { type: 'while', cond: expr, text, body: this.block(), line }; }
        case 'for': {
          this.p++; const name = this.name(); this.expectKw('in');
          const first = this.tok, iter = this.expr(), text = `${name} in ${this.src.slice(first.start, this.toks[this.p - 1].end)}`;
          return { type: 'forin', name, iter, text, body: this.block(), line };
        }
        case 'return': {
          this.p++; let value = null;
          if (!this.is('nl') && !this.is('eof') && !this.is('dedent')) value = this.expr();
          this.endLine(); return { type: 'return', value, line };
        }
        case 'pass': this.p++; this.endLine(); return { type: 'expr', expr: { type: 'lit', value: null }, line };
        case 'else': case 'elif': this.fail(`SyntaxError: '${t.v}' without a matching 'if'`); break;
        default: break;
      }
    }
    const e = this.expr();
    const ops = ['=', '+=', '-=', '*=', '/=', '%='];
    if (this.tok.t === 'op' && ops.includes(this.tok.v)) {
      if (e.type !== 'ident' && e.type !== 'index') this.fail('SyntaxError: cannot assign to this expression');
      const op = this.toks[this.p++].v, value = this.expr();
      this.endLine();
      return { type: 'assign', declare: false, pyDeclare: e.type === 'ident' && op === '=', target: e, op, value, line };
    }
    this.endLine();
    if (e.type === 'call' && e.callee.type === 'ident' && e.callee.name === 'print') return { type: 'print', args: e.args, line };
    if (e.type === 'call' && e.callee.type === 'member' && e.callee.prop === 'append' && e.callee.obj.type === 'ident') return { type: 'push', name: e.callee.obj.name, args: e.args, line };
    return { type: 'expr', expr: e, line };
  }
  ifStmt() {
    const line = this.tok.line; this.p++;
    const { expr, text } = this.condText();
    const then = this.block();
    let otherwise = null;
    if (this.isKw('elif')) otherwise = [this.ifStmt()];
    else if (this.isKw('else')) { this.p++; otherwise = this.block(); }
    return { type: 'if', cond: expr, text, then, else: otherwise, line };
  }

  /* ---- expressions ---- */
  expr() { return this.orExpr(); }
  bin(op, left, right, line) { return { type: 'binary', op, left, right, line }; }
  orExpr() { let l = this.andExpr(); while (this.isKw('or')) { const { line } = this.toks[this.p++]; l = this.bin('||', l, this.andExpr(), line); } return l; }
  andExpr() { let l = this.notExpr(); while (this.isKw('and')) { const { line } = this.toks[this.p++]; l = this.bin('&&', l, this.notExpr(), line); } return l; }
  notExpr() { if (this.isKw('not')) { const { line } = this.toks[this.p++]; return { type: 'unary', op: '!', arg: this.notExpr(), line }; } return this.compare(); }
  compare() {
    let l = this.add(), chain = null;
    const map = { '==': '===', '!=': '!==', '<': '<', '>': '>', '<=': '<=', '>=': '>=' };
    while (this.tok.t === 'op' && map[this.tok.v]) {
      const { v, line } = this.toks[this.p++], r = this.add(), cmp = this.bin(map[v], l, r, line);
      chain = chain ? this.bin('&&', chain, cmp, line) : cmp;   // a < b < c means a < b and b < c, as in real Python
      l = r;
    }
    return chain || l;
  }
  add() { let l = this.mul(); while (this.isOp('+') || this.isOp('-')) { const { v, line } = this.toks[this.p++]; l = this.bin(v, l, this.mul(), line); } return l; }
  mul() { let l = this.unary(); while (this.isOp('*') || this.isOp('/') || this.isOp('//') || this.isOp('%')) { const { v, line } = this.toks[this.p++]; l = this.bin(v, l, this.unary(), line); } return l; }
  unary() { if (this.isOp('-')) { const { line } = this.toks[this.p++]; return { type: 'unary', op: '-', arg: this.unary(), line }; } return this.postfix(); }
  postfix() {
    let e = this.primary();
    for (;;) {
      const line = this.tok.line;
      if (this.isOp('(')) {
        this.p++; const args = [];
        while (!this.isOp(')')) { args.push(this.expr()); if (this.isOp(',')) this.p++; else break; }
        this.expectOp(')'); e = { type: 'call', callee: e, args, line };
      } else if (this.isOp('[')) { this.p++; const index = this.expr(); this.expectOp(']'); e = { type: 'index', obj: e, index, line }; }
      else if (this.isOp('.')) { this.p++; e = { type: 'member', obj: e, prop: this.name(), line }; }
      else break;
    }
    return e;
  }
  primary() {
    const t = this.tok;
    if (t.t === 'num' || t.t === 'str') { this.p++; return { type: 'lit', value: t.v }; }
    if (t.t === 'kw' && (t.v === 'True' || t.v === 'False' || t.v === 'None')) { this.p++; return { type: 'lit', value: t.v === 'True' ? true : t.v === 'False' ? false : null }; }
    if (t.t === 'id') { this.p++; return { type: 'ident', name: t.v, line: t.line }; }
    if (this.isOp('(')) { this.p++; const e = this.expr(); this.expectOp(')'); return e; }
    if (this.isOp('[')) {
      this.p++; const items = [];
      while (!this.isOp(']')) { items.push(this.expr()); if (this.isOp(',')) this.p++; else break; }
      this.expectOp(']'); return { type: 'array', items };
    }
    this.fail(`SyntaxError: unexpected '${t.v}'`);
    return null;
  }
}

/** Java subset: one class, static methods, main(), typed locals, int[] arrays, String, boolean. */
class JavaParser extends Parser {
  word(w) { return this.tok.t === 'id' && this.tok.v === w; }
  modifiers() { while (this.tok.t === 'id' && ['public', 'private', 'static', 'final'].includes(this.tok.v)) this.p++; }
  typeName() {
    if (this.tok.t !== 'id') throw new LangError(`Expected a type but found '${this.tok.v}'`, this.tok.line);
    let t = this.toks[this.p++].v;
    while (this.peekIs('[') && this.toks[this.p + 1].v === ']') { this.p += 2; t += '[]'; }
    return t;
  }
  isDeclStart() {
    if (this.tok.t !== 'id') return false;
    let q = this.p + 1;
    while (this.toks[q].v === '[' && this.toks[q + 1] && this.toks[q + 1].v === ']') q += 2;
    const a = this.toks[q], b = this.toks[q + 1];
    return a.t === 'id' && b && b.t === 'op' && (b.v === '=' || b.v === ';');
  }
  parseProgram() {
    const defs = [], out = [];
    while (this.tok.t !== 'eof') {
      this.modifiers();
      if (!this.word('class')) throw new LangError("Java code lives inside a class: expected 'class'", this.tok.line);
      this.p++;
      if (this.tok.t !== 'id') throw new LangError('The class needs a name', this.tok.line);
      const cname = this.toks[this.p++].v;
      this.eat('{');
      const cls = { type: 'classdef', name: cname, fields: [], ctor: null, methods: [], line: this.tok.line };
      const body = [];
      while (!this.peekIs('}')) {
        if (this.tok.t === 'eof') throw new LangError("Missing closing '}'", this.tok.line);
        const line = this.tok.line, st = this.tok.t === 'id' && this.toks.slice(this.p, this.p + 4).some((x) => x.v === 'static');
        this.modifiers();
        let rtype = null;
        if (!(this.tok.t === 'id' && this.tok.v === cname && this.toks[this.p + 1].v === '(')) rtype = this.typeName();
        const nameTok = this.tok;
        if (nameTok.t !== 'id') throw new LangError('Expected a name here', nameTok.line);
        this.p++;
        if (this.peekIs('(')) {
          this.eat('(');
          const params = [], ptypes = [];
          while (!this.peekIs(')')) { ptypes.push(this.typeName()); if (this.tok.t !== 'id') throw new LangError('Expected a parameter name', this.tok.line); params.push(this.toks[this.p++].v); if (!this.accept(',')) break; }
          this.eat(')');
          const b = this.parseBlock();
          if (rtype === null) cls.ctor = { params, ptypes, body: b, line };
          else if (cname === 'Main' && nameTok.v === 'main') body.push(...b);
          else { const fn = { type: 'func', name: nameTok.v, params, ptypes, rtype, body: b, line, isStatic: st }; if (cname === 'Main') body.push(fn); else cls.methods.push(fn); }
        } else {
          let init = null;
          if (this.accept('=')) init = this.initExpr();
          this.eat(';');
          cls.fields.push({ name: nameTok.v, ctype: rtype, init });
        }
      }
      this.eat('}');
      if (cname === 'Main' || (!defs.length && !out.length && this.tok.t === 'eof' && !cls.fields.length && !cls.ctor && !cls.methods.length)) out.push(...body);
      else { defs.push(cls); out.push(...body); }
    }
    return [...defs, ...out];
  }
  parseStatement() {
    if (this.isDeclStart()) { const n = this.javaDecl(); this.eat(';'); return n; }
    return super.parseStatement();
  }
  javaDecl() {
    const line = this.tok.line, ctype = this.typeName();
    const nameTok = this.tok;
    this.p++;
    let value = null;
    if (this.accept('=')) value = this.initExpr();
    return { type: 'assign', declare: true, target: { type: 'ident', name: nameTok.v }, op: '=', value, line, ctype };
  }
  initExpr() {
    if (!this.peekIs('{')) return this.parseExpr();
    this.p++; const items = [];
    while (!this.peekIs('}')) { items.push(this.initExpr()); if (!this.accept(',')) break; }
    this.eat('}');
    return { type: 'array', items };
  }
  parseFor() {
    const line = this.eat('for').line;
    this.eat('(');
    let init = null, cond = null, text = '', update = null;
    if (!this.peekIs(';')) { init = this.isDeclStart() ? this.javaDecl() : this.toStatement(this.parseExpr(), line); init.line = line; }
    this.eat(';');
    if (!this.peekIs(';')) { const first = this.tok; cond = this.parseExpr(); text = this.src.slice(first.start, this.toks[this.p - 1].end); }
    this.eat(';');
    if (!this.peekIs(')')) { update = this.toStatement(this.parseExpr(), line); update.line = line; }
    this.eat(')');
    return { type: 'for', init, cond, text, update, body: this.parseBody(), line };
  }
  parsePrimary() {
    if (this.word('new')) {
      const line = this.tok.line;
      this.p++;
      const cname = this.tok.v;
      if (this.tok.t === 'id' && this.toks[this.p + 1].v === '(') {
        this.p += 2;
        const args = [];
        while (!this.peekIs(')')) { args.push(this.parseExpr()); if (!this.accept(',')) break; }
        this.eat(')');
        return { type: 'new', cls: cname, args, line };
      }
      if (this.tok.t === 'id' && this.toks[this.p + 1].v === '[' && this.toks[this.p + 2].v !== ']') {
        this.p += 2;
        const size = this.parseExpr();
        this.eat(']');
        return { type: 'newarr', ctype: cname, size, line };
      }
      this.typeName();
      if (!this.peekIs('{')) throw new LangError('Expected new Type(...), new Type[size] or new Type[] { ... }', this.tok.line);
      return this.initExpr();
    }
    return super.parsePrimary();
  }
  toStatement(e, line) {
    if (e.type === 'call' && e.callee.type === 'member' && e.callee.prop === 'println' && e.callee.obj.type === 'member' && e.callee.obj.prop === 'out') return { type: 'print', args: e.args, line };
    return super.toStatement(e, line);
  }
}

function makeParser(lang, src) { return lang === 'py' ? new PyParser(src) : lang === 'java' ? new JavaParser(src) : new Parser(src); }

