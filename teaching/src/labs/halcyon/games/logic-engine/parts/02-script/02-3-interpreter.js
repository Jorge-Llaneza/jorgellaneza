/* ======================================================== 3. INTERPRETER */
const MATH = { floor: Math.floor, ceil: Math.ceil, round: Math.round, abs: Math.abs, sqrt: Math.sqrt, max: Math.max, min: Math.min, pow: Math.pow };

/**
 * Executes the AST and records a trace. An event is emitted JUST BEFORE a
 * line's effect is applied ("the CPU is about to run line N"), carrying:
 *   kind      : none | call | assign | branch | print | return | end
 *   before    : snapshot of RAM + stack + console at that moment
 *   expected  : the value the student should predict (for predictable kinds)
 * The student predicts `expected`, then stepping reveals the next snapshot.
 */
class Interpreter {
  constructor(src, opts = {}) {
    this.lang = opts.lang || 'js';
    this.lines = src.split('\n');
    this.ast = makeParser(this.lang, src).parseProgram();
    this.typeLog = opts.types ? { vars: {}, funcs: {} } : null;
    this.tracing = opts.trace !== false;
    this.limit = opts.limit || TRACE_LIMIT;
    this.events = [];
    this.out = [];
    this.funcs = Object.create(null);
    this.classes = Object.create(null);
    this.frames = [{ name: 'global', vars: Object.create(null) }];
    this.steps = 0;
    this.lastRet = undefined;
    this.hasRet = false;
    this.halted = null;
    this.error = null;
  }

  run() {
    if (this.lang === 'java') for (const s of this.ast) { if (s.type === 'func') this.funcs[s.name] = s; else if (s.type === 'classdef') this.classes[s.name] = s; }   // Java methods exist before main runs
    try { this.execBlock(this.ast); } catch (e) {
      if (e instanceof Halt) this.halted = e.reason;
      else if (e instanceof RuntimeErr) this.error = { message: e.message, line: e.line };
      else throw e;
    }
    if (this.tracing) {
      const status = this.error ? 'error' : this.halted ? 'halted' : 'ok';
      const desc = this.error ? `${this.error.message}${this.error.line ? ' (line ' + this.error.line + ')' : ''}`
        : this.halted ? `Step limit (${this.limit}) reached. This program may never stop (infinite loop or runaway recursion).`
        : 'Program finished normally.';
      this.events.push({ id: this.events.length, kind: 'end', status, line: this.error ? this.error.line : null, desc, before: this.snapshot() });
    }
    return { events: this.events, out: this.out, halted: this.halted, error: this.error };
  }

  snapshot() {
    return {
      frames: this.frames.map((f) => ({ name: f.name, vars: Object.entries(f.vars).map(([k, v]) => [k, cloneVal(v)]) })),
      out: this.out.slice(), ret: cloneVal(this.lastRet), hasRet: this.hasRet,
    };
  }
  emit(ev) {
    if (++this.steps > this.limit) throw new Halt('limit');
    if (this.tracing) { ev.id = this.events.length; ev.before = this.snapshot(); this.events.push(ev); }
  }

  /* ---- variable access ---- */
  get top() { return this.frames[this.frames.length - 1]; }
  notDefined(name) {
    return this.lang === 'py' ? `NameError: name '${name}' is not defined` : this.lang === 'java' ? `error: cannot find symbol '${name}'` : `ReferenceError: ${name} is not defined`;
  }
  logVar(name, val) {
    if (!this.typeLog || val === undefined || val === null) return;
    this.typeLog.vars[name] = mergeType(this.typeLog.vars[name], javaType(val));
  }
  /** Reading or writing past the end: JavaScript hands back undefined, Python and Java raise an error. */
  checkIndex(arr, idx, line) {
    if (this.lang === 'js' || !Array.isArray(arr)) return idx;
    if (this.lang === 'py') {
      const k = idx < 0 ? idx + arr.length : idx;
      if (!Number.isInteger(k) || k < 0 || k >= arr.length) throw new RuntimeErr('IndexError: list index out of range', line);
      return k;
    }
    if (!Number.isInteger(idx) || idx < 0 || idx >= arr.length) throw new RuntimeErr(`ArrayIndexOutOfBoundsException: Index ${idx} out of bounds for length ${arr.length}`, line);
    return idx;
  }
  thisObj() { const t = this.top.vars.this; return t instanceof Obj ? t : null; }
  lookup(name, line) {
    if (name in this.top.vars) return this.top.vars[name];
    const th = this.thisObj(); if (th && name in th.fields) return th.fields[name];
    if (name in this.frames[0].vars) return this.frames[0].vars[name];
    throw new RuntimeErr(this.notDefined(name), line);
  }
  assignVar(name, val, declare, line) {
    if (declare || name in this.top.vars) { this.top.vars[name] = val; return; }
    const th = this.thisObj(); if (th && name in th.fields) { th.fields[name] = val; return; }
    if (name in this.frames[0].vars) { this.frames[0].vars[name] = val; return; }
    throw new RuntimeErr(this.notDefined(name), line);
  }

  /* ---- statements ---- */
  execBlock(stmts) {
    for (const s of stmts) { const r = this.exec(s); if (r) return r; }
    return null;
  }
  evalStep(expr, line) {
    if (containsCall(expr)) this.emit({ kind: 'call', line, desc: 'This line calls a function. Step into it and watch a new stack frame appear.' });
    return this.evalExpr(expr);
  }
  exec(n) {
    switch (n.type) {
      case 'classdef': return null;
      case 'func':
        this.emit({ kind: 'none', line: n.line, desc: `Define ${this.lang === 'java' ? 'method' : 'function'} ${n.name}(${n.params.join(', ')}). Nothing runs yet; the body is only stored.` });
        this.funcs[n.name] = n;
        return null;
      case 'assign': this.execAssign(n); return null;
      case 'push': {
        const vals = n.args.map((a) => this.evalStep(a, n.line));
        const arr = this.lookup(n.name, n.line);
        if (!Array.isArray(arr)) throw new RuntimeErr(`TypeError: ${n.name}.push is not a function`, n.line);
        const preview = cloneVal(arr); preview.push(...vals);
        this.emit({ kind: 'assign', line: n.line, name: n.name, expected: preview, desc: `Append to ${n.name}` });
        arr.push(...vals);
        return null;
      }
      case 'print': {
        const text = n.args.map((a) => fmtOut(this.evalStep(a, n.line), this.lang)).join(' ');
        this.emit({ kind: 'print', line: n.line, expected: text, desc: 'Print to the console' });
        this.out.push(text);
        return null;
      }
      case 'expr':
        this.evalStep(n.expr, n.line);
        this.emit({ kind: 'none', line: n.line, desc: 'The result is not stored anywhere, so it is discarded.' });
        return null;
      case 'return': {
        const v = n.value ? this.evalStep(n.value, n.line) : undefined;
        this.emit({ kind: 'return', line: n.line, expected: v, desc: 'Return a value to the caller and pop this stack frame' });
        this.lastRet = v; this.hasRet = true;
        return { ret: v };
      }
      case 'if': {
        const c = !!this.evalStep(n.cond, n.line);
        this.emit({ kind: 'branch', line: n.line, text: n.text, expected: c, desc: `Evaluate the condition ${n.text}` });
        if (c) return this.execBlock(n.then);
        return n.else ? this.execBlock(n.else) : null;
      }
      case 'while':
        for (;;) {
          const c = !!this.evalStep(n.cond, n.line);
          this.emit({ kind: 'branch', loopy: true, line: n.line, text: n.text, expected: c, desc: `Loop test: ${n.text}` });
          if (!c) break;
          const r = this.execBlock(n.body); if (r) return r;
        }
        return null;
      case 'for':
        if (n.init) this.exec(n.init);
        for (;;) {
          if (n.cond) {
            const c = !!this.evalStep(n.cond, n.line);
            this.emit({ kind: 'branch', loopy: true, line: n.line, text: n.text, expected: c, desc: `Loop test: ${n.text}` });
            if (!c) break;
          }
          const r = this.execBlock(n.body); if (r) return r;
          if (n.update) this.exec(n.update);
        }
        return null;
      case 'forin': {
        const it = n.iter;
        let items;
        if (it.type === 'call' && it.callee.type === 'ident' && it.callee.name === 'range') {
          const a = it.args.map((x) => this.evalExpr(x));
          const lo = a.length > 1 ? a[0] : 0, hi = a.length > 1 ? a[1] : a[0], st = a[2] === undefined ? 1 : a[2];
          if (!st) throw new RuntimeErr('ValueError: range() arg 3 must not be zero', n.line);
          items = [];
          for (let v = lo; st > 0 ? v < hi : v > hi; v += st) { items.push(v); if (items.length > 5000) break; }
        } else {
          items = this.evalExpr(it);
          if (!Array.isArray(items)) throw new RuntimeErr("TypeError: object is not iterable", n.line);
          items = items.slice();
        }
        for (const v of items) {
          this.emit({ kind: 'assign', line: n.line, name: n.name, expected: v, declare: !(n.name in this.top.vars), desc: `Next value of ${n.name} from ${it.type === 'call' ? 'the range' : 'the list'}` });
          this.logVar(n.name, v);
          this.assignVar(n.name, v, true, n.line);
          const r = this.execBlock(n.body); if (r) return r;
        }
        this.emit({ kind: 'none', line: n.line, desc: `The ${it.type === 'call' ? 'range' : 'list'} is used up, so the loop ends.` });
        return null;
      }
      default: throw new RuntimeErr(`Unsupported statement '${n.type}'`, n.line);
    }
  }
  execAssign(n) {
    const rhs = n.value ? this.evalStep(n.value, n.line) : undefined;
    const t = n.target;
    if (t.type === 'ident') {
      const nv = n.op === '=' ? rhs : this.applyOp(n.op.slice(0, -1), this.lookup(t.name, n.line), rhs, n.line);
      const declare = n.pyDeclare ? !(t.name in this.top.vars) : n.declare;
      this.emit({ kind: 'assign', line: n.line, name: t.name, expected: nv, declare, desc: `${declare ? 'Declare' : 'Update'} ${t.name}` });
      this.logVar(t.name, nv);
      this.assignVar(t.name, nv, declare, n.line);
    } else if (t.type === 'member') {
      const o = this.evalExpr(t.obj);
      if (o === null || o === undefined) throw new RuntimeErr('NullPointerException: cannot assign field "' + t.prop + '" because the object is null', n.line);
      if (!(o instanceof Obj) || !(t.prop in o.fields)) throw new RuntimeErr(`error: cannot find symbol '${t.prop}'`, n.line);
      const nv = n.op === '=' ? rhs : this.applyOp(n.op.slice(0, -1), o.fields[t.prop], rhs, n.line);
      this.emit({ kind: 'none', line: n.line, desc: `Set the field ${t.prop} of the ${o.cls} object to ${fmtVal(nv, this.lang)}.` });
      o.fields[t.prop] = nv;
    } else {
      if (t.obj.type !== 'ident') throw new RuntimeErr('Only name[index] = value is supported', n.line);
      const arr = this.lookup(t.obj.name, n.line);
      const idx = this.checkIndex(arr, this.evalExpr(t.index), n.line);
      if (!Array.isArray(arr)) throw new RuntimeErr(`TypeError: ${t.obj.name} is not an array`, n.line);
      const nv = n.op === '=' ? rhs : this.applyOp(n.op.slice(0, -1), arr[idx], rhs, n.line);
      const preview = cloneVal(arr); preview[idx] = nv;
      this.emit({ kind: 'assign', line: n.line, name: t.obj.name, expected: preview, desc: `Write into ${t.obj.name}[${idx}]` });
      arr[idx] = nv;
    }
  }

  /* ---- expressions ---- */
  applyOp(op, a, b, line) {
    switch (op) {
      case '+': return a + b; case '-': return a - b; case '*': return a * b;
      case '/':
        if (this.lang === 'java' && Number.isInteger(a) && Number.isInteger(b)) { if (b === 0) throw new RuntimeErr('ArithmeticException: / by zero', line); return Math.trunc(a / b); }
        if (this.lang === 'py' && b === 0) throw new RuntimeErr('ZeroDivisionError: division by zero', line);
        return a / b;
      case '//':
        if (b === 0) throw new RuntimeErr('ZeroDivisionError: integer division or modulo by zero', line);
        return Math.floor(a / b);
      case '%':
        if (b === 0 && this.lang !== 'js') throw new RuntimeErr(this.lang === 'py' ? 'ZeroDivisionError: integer modulo by zero' : 'ArithmeticException: / by zero', line);
        return this.lang === 'py' ? ((a % b) + b) % b : a % b;
      case '<': return a < b; case '>': return a > b; case '<=': return a <= b; case '>=': return a >= b;
      case '===': return a === b; case '!==': return a !== b;
      case '==': return a == b; case '!=': return a != b; // eslint-disable-line eqeqeq
      default: throw new RuntimeErr(`Unsupported operator ${op}`, line);
    }
  }
  evalExpr(n) {
    switch (n.type) {
      case 'lit': return n.value;
      case 'ident': return this.lookup(n.name, n.line);
      case 'array': return n.items.map((i) => this.evalExpr(i));
      case 'index': {
        const o = this.evalExpr(n.obj), i = this.evalExpr(n.index);
        if (!Array.isArray(o) && typeof o !== 'string') throw new RuntimeErr('TypeError: value is not indexable', n.line);
        return o[this.checkIndex(o, i, n.line)];
      }
      case 'member': {
        const o = this.evalExpr(n.obj);
        if (n.prop === 'length' && (Array.isArray(o) || typeof o === 'string')) return o.length;
        if (o instanceof Obj && n.prop in o.fields) return o.fields[n.prop];
        if (o === null || o === undefined) throw new RuntimeErr(`NullPointerException: cannot read field "${n.prop}" because the object is null`, n.line);
        throw new RuntimeErr(`Unsupported property '${n.prop}'`, n.line);
      }
      case 'unary': { const v = this.evalExpr(n.arg); return n.op === '!' ? !v : -v; }
      case 'binary':
        if (n.op === '&&') { const l = this.evalExpr(n.left); return l ? this.evalExpr(n.right) : l; }
        if (n.op === '||') { const l = this.evalExpr(n.left); return l ? l : this.evalExpr(n.right); }
        return this.applyOp(n.op, this.evalExpr(n.left), this.evalExpr(n.right), n.line);
      case 'call': return this.evalCall(n);
      case 'new': return this.instantiate(n);
      case 'newarr': {
        const size = this.evalExpr(n.size);
        if (!Number.isInteger(size) || size < 0) throw new RuntimeErr(`NegativeArraySizeException: ${size}`, n.line);
        const dv = n.ctype === 'int' || n.ctype === 'double' ? 0 : n.ctype === 'boolean' ? false : null;
        return Array.from({ length: size }, () => dv);
      }
      case 'assignExpr': throw new RuntimeErr('Assignments are only allowed as their own statement here', n.line);
      default: throw new RuntimeErr(`Unsupported expression '${n.type}'`, n.line);
    }
  }
  evalCall(n) {
    const c = n.callee;
    if (c.type === 'ident') {
      const argv = n.args.map((a) => this.evalExpr(a));
      if (this.lang === 'py' && !this.funcs[c.name] && PY_BUILTINS[c.name]) {
        if (c.name === 'len' && !Array.isArray(argv[0]) && typeof argv[0] !== 'string') throw new RuntimeErr("TypeError: object has no len()", n.line);
        return PY_BUILTINS[c.name](...argv);
      }
      return this.callUser(c.name, argv, n.line);
    }
    if (c.type === 'member') {
      if (c.obj.type === 'ident' && c.obj.name === 'Math') {
        const f = MATH[c.prop];
        if (!f) throw new RuntimeErr(`Math.${c.prop} is not supported`, n.line);
        return f(...n.args.map((a) => this.evalExpr(a)));
      }
      if (c.obj.type === 'ident' && c.obj.name === 'console') throw new RuntimeErr('console.log must be its own statement', n.line);
      if (c.obj.type === 'ident' && this.classes[c.obj.name] && !(c.obj.name in this.top.vars)) {
        const m = this.classes[c.obj.name].methods.find((x) => x.name === c.prop);
        if (!m) throw new RuntimeErr(`error: cannot find symbol '${c.obj.name}.${c.prop}'`, n.line);
        return this.invoke(m, n.args.map((a) => this.evalExpr(a)), null, `${c.obj.name}.${c.prop}`, n.line);
      }
      const o = this.evalExpr(c.obj), args = n.args.map((a) => this.evalExpr(a));
      if (o instanceof Obj) {
        const m = this.classes[o.cls].methods.find((x) => x.name === c.prop);
        if (!m) throw new RuntimeErr(`error: cannot find symbol '${c.prop}' in class ${o.cls}`, n.line);
        return this.invoke(m, args, o, `${o.cls}.${c.prop}`, n.line);
      }
      if (o === null || o === undefined) throw new RuntimeErr(`NullPointerException: cannot call ${c.prop}() because the object is null`, n.line);
      if (c.prop === 'equals' && typeof o === 'string') return o === args[0];
      if (Array.isArray(o)) {
        if (c.prop === 'includes') return o.includes(args[0]);
        if (c.prop === 'indexOf') return o.indexOf(args[0]);
        if (c.prop === 'join') return o.join(args.length ? args[0] : ',');
        if (c.prop === 'push') throw new RuntimeErr('push() is only supported as its own statement', n.line);
      }
    }
    throw new RuntimeErr('Unsupported function call', n.line);
  }
  instantiate(n) {
    const cd = this.classes[n.cls];
    if (!cd) throw new RuntimeErr(`error: cannot find symbol 'class ${n.cls}'`, n.line);
    const args = n.args.map((a) => this.evalExpr(a));
    const fields = {};
    cd.fields.forEach((f) => { fields[f.name] = f.ctype === 'int' || f.ctype === 'double' ? 0 : f.ctype === 'boolean' ? false : null; });
    const obj = new Obj(n.cls, fields);
    cd.fields.forEach((f) => { if (f.init) fields[f.name] = this.evalExpr(f.init); });
    if (cd.ctor) {
      if (cd.ctor.params.length !== args.length) throw new RuntimeErr(`error: constructor ${n.cls} needs ${cd.ctor.params.length} argument(s) but got ${args.length}`, n.line);
      this.invoke(cd.ctor, args, obj, `new ${n.cls}`, n.line);
    }
    return obj;
  }
  invoke(fn, args, thisObj, label, line) {
    if (this.frames.length >= MAX_DEPTH) throw new RuntimeErr('StackOverflowError', line);
    const vars = Object.create(null);
    if (thisObj) vars.this = thisObj;
    fn.params.forEach((p, i) => { vars[p] = args[i]; });
    this.frames.push({ name: `${label}(${args.map((a) => fmtVal(a, this.lang)).join(', ')})`, vars });
    const r = this.execBlock(fn.body);
    this.frames.pop();
    return r ? r.ret : undefined;
  }
  callUser(name, args, line) {
    const th = this.thisObj();
    if (th) { const m = this.classes[th.cls].methods.find((x) => x.name === name); if (m) return this.invoke(m, args, m.isStatic ? null : th, `${th.cls}.${name}`, line); }
    const fn = this.funcs[name];
    if (!fn) throw new RuntimeErr(this.lang === 'js' ? `TypeError: ${name} is not a function` : this.notDefined(name), line);
    if (this.frames.length >= MAX_DEPTH) throw new RuntimeErr(this.lang === 'py' ? 'RecursionError: maximum recursion depth exceeded' : this.lang === 'java' ? 'StackOverflowError' : 'RangeError: Maximum call stack size exceeded', line);
    const vars = Object.create(null);
    fn.params.forEach((p, i) => { vars[p] = args[i]; });
    this.frames.push({ name: `${name}(${args.map((a) => fmtVal(a, this.lang)).join(', ')})`, vars });
    const r = this.execBlock(fn.body);
    this.frames.pop();
    if (this.typeLog) {
      const f = this.typeLog.funcs[name] || (this.typeLog.funcs[name] = { params: {}, ret: null });
      fn.params.forEach((p, i) => { if (args[i] !== undefined) { f.params[p] = mergeType(f.params[p], javaType(args[i])); this.typeLog.vars[p] = mergeType(this.typeLog.vars[p], javaType(args[i])); } });
      if (r && r.ret !== undefined) f.ret = mergeType(f.ret, javaType(r.ret));
    }
    return r ? r.ret : undefined;
  }
}

