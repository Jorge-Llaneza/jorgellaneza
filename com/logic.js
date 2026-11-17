/* COM · Logic. Engine for propositional (L0) and predicate (L1) logic
   and exercise generators with step-by-step solutions.
   Independent of the UI: used by app.js and by the test bench. */
"use strict";
const LG = (function(){

/* ---------- utilidades ---------- */
const R = n => Math.floor(Math.random()*n);
const pick = a => a[R(a.length)];
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=R(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const uniq = a => [...new Set(a)];
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const TV = v => `<b class="${v?"tv":"fv"}">${v?"T":"F"}</b>`;

/* ---------- tokenizer (shared by L0 and L1) ---------- */
function tokenize(s){
  const out=[]; let i=0;
  while(i<s.length){
    const c=s[i];
    if(/\s/.test(c)){ i++; continue; }
    if(s.startsWith("<->",i)){ out.push("↔"); i+=3; continue; }
    if(s.startsWith("->",i)){ out.push("→"); i+=2; continue; }
    if("¬~∧∨→↔()[],∀∃{}".includes(c)){ out.push(c==="~"?"¬":c); i++; continue; }
    const m=/^[A-Za-z_][A-Za-z0-9_'₀-₉]*/.exec(s.slice(i));
    if(m){ out.push(m[0]); i+=m[0].length; continue; }
    throw new Error("Unknown symbol: "+c);
  }
  return out;
}
const PREC={"↔":1,"→":2,"∨":3,"∧":4};
const isBin=f=>f&&f.o in PREC;

/* =====================================================================
   L0 · propositional logic
   AST: {o:"v",n} {o:"k",v} {o:"¬",a} {o:"∧"|"∨"|"→"|"↔",a,b}
   ===================================================================== */
const V=n=>({o:"v",n}), N=a=>({o:"¬",a}), B=(o,a,b)=>({o,a,b});

function parse0(s){
  const t=tokenize(s); let i=0;
  const prim=()=>{ const x=t[i++];
    if(x==="¬") return N(prim());
    if(x==="("||x==="["){ const e=bin(1), c=t[i++]; if(c!==")"&&c!=="]") throw new Error("Missing parenthesis"); return e; }
    if(x==="T"||x==="F") return {o:"k",v:x==="T"};
    if(x&&/^[a-z]/.test(x)) return V(x);
    throw new Error("Inesperado: "+x); };
  const bin=min=>{ let l=prim(); for(;;){ const op=t[i], p=PREC[op]; if(!p||p<min) return l; i++; l=B(op,l,bin(p+1)); } };
  const e=bin(1); if(i<t.length) throw new Error("Sobra: "+t[i]); return e;
}
/* Readable printing: parentheses around every binary child except chains of the same ∧ or ∨ */
function show0(f){
  switch(f.o){
    case "v": return f.n;
    case "k": return f.v?"T":"F";
    case "¬": return "¬"+(isBin(f.a)?"("+show0(f.a)+")":show0(f.a));
    default: { const w=c=>(isBin(c)&&!(c.o===f.o&&(f.o==="∧"||f.o==="∨")))?"("+show0(c)+")":show0(c);
      return w(f.a)+" "+f.o+" "+w(f.b); }
  }
}
function vars0(f,acc=[]){ if(f.o==="v"){ if(!acc.includes(f.n)) acc.push(f.n); } else { if(f.a) vars0(f.a,acc); if(f.b) vars0(f.b,acc); } return acc; }
function ev0(f,I){ switch(f.o){
  case "v": return !!I[f.n]; case "k": return f.v; case "¬": return !ev0(f.a,I);
  case "∧": return ev0(f.a,I)&&ev0(f.b,I); case "∨": return ev0(f.a,I)||ev0(f.b,I);
  case "→": return !ev0(f.a,I)||ev0(f.b,I); case "↔": return ev0(f.a,I)===ev0(f.b,I); } }
/* Interpretations in the order used in the slides: TTT, TTF, … */
function interps(vs){ const n=vs.length, out=[]; for(let m=0;m<(1<<n);m++){ const I={}; vs.forEach((v,k)=>I[v]=!((m>>(n-1-k))&1)); out.push(I); } return out; }
const P0=f=>typeof f==="string"?parse0(f):f;
function classify(f){ f=P0(f); const vs=vars0(f).sort(); let t=0,n=0; for(const I of interps(vs)){ n++; if(ev0(f,I)) t++; } return t===n?"valid":t===0?"unsat":"sat"; }
function equiv(f,g){ f=P0(f); g=P0(g); const vs=uniq(vars0(f).concat(vars0(g))).sort(); return interps(vs).every(I=>ev0(f,I)===ev0(g,I)); }
function countermodel(prem,concl){ prem=prem.map(P0); concl=P0(concl);
  const vs=uniq(prem.flatMap(p=>vars0(p)).concat(vars0(concl))).sort();
  return interps(vs).find(I=>prem.every(p=>ev0(p,I))&&!ev0(concl,I))||null; }
function consistent(set){ set=set.map(P0); const vs=uniq(set.flatMap(p=>vars0(p))).sort(); return interps(vs).some(I=>set.every(p=>ev0(p,I))); }
function size0(f){ return f.o==="v"||f.o==="k"?1:1+size0(f.a)+(f.b?size0(f.b):0); }

/* ---------- conjunctive normal form and clausal form ---------- */
function elim(f,bug){ switch(f.o){
  case "v": case "k": return f;
  case "¬": return N(elim(f.a,bug));
  case "↔": { const a=elim(f.a,bug), b=elim(f.b,bug); return B("∧",imp(a,b,bug),imp(b,a,bug)); }
  case "→": return imp(elim(f.a,bug),elim(f.b,bug),bug);
  default: return B(f.o,elim(f.a,bug),elim(f.b,bug)); } }
function imp(a,b,bug){ return bug==="imp"?B("∨",a,N(b)):B("∨",N(a),b); }
function nnf(f,bug){
  if(f.o==="¬"){ const a=f.a;
    if(a.o==="¬") return nnf(a.a,bug);
    if(a.o==="∧") return B(bug==="dm"?"∧":"∨",nnf(N(a.a),bug),nnf(N(a.b),bug));
    if(a.o==="∨") return B(bug==="dm"?"∨":"∧",nnf(N(a.a),bug),nnf(N(a.b),bug));
    if(a.o==="k") return {o:"k",v:!a.v};
    return f; }
  if(f.o==="∧"||f.o==="∨") return B(f.o,nnf(f.a,bug),nnf(f.b,bug));
  return f; }
const lit=f=>f.o==="v"?f.n:"¬"+f.a.n;
const negL=l=>l[0]==="¬"?l.slice(1):"¬"+l;
function cnfList(f){
  if(f.o==="v"||f.o==="¬") return [[lit(f)]];
  if(f.o==="∧") return cnfList(f.a).concat(cnfList(f.b));
  const A=cnfList(f.a), Bc=cnfList(f.b), out=[]; A.forEach(x=>Bc.forEach(y=>out.push(x.concat(y)))); return out; }
function cnfToF(cs){ if(!cs.length) return {o:"k",v:true};
  const cl=c=>c.length? c.map(l=>l[0]==="¬"?N(V(l.slice(1))):V(l)).reduce((a,b)=>B("∨",a,b)) : {o:"k",v:false};
  return cs.map(cl).reduce((a,b)=>B("∧",a,b)); }
function simplifyClauses(cs){
  let out=cs.map(c=>uniq(c)).filter(c=>!c.some(l=>c.includes(negL(l))));
  const key=c=>c.slice().sort().join("|"), seen=new Set();
  out=out.filter(c=>{ const k=key(c); if(seen.has(k)) return false; seen.add(k); return true; });
  return out.filter((c,i)=>!out.some((d,j)=>j!==i&&d.length<c.length&&d.every(l=>c.includes(l)))); }
function clausal0(f,bug){ f=P0(f); return simplifyClauses(cnfList(nnf(elim(f,bug),bug))); }
const showClause=c=>c.length?c.join(" ∨ "):"□";
const showClauses=cs=>cs.length?"{"+cs.map(showClause).join(", ")+"}":"∅";
function sameClauses(a,b){ const k=cs=>cs.map(c=>c.slice().sort().join("|")).sort().join("‖"); return k(a)===k(b); }

/* ---------- random formula generation ---------- */
function randF(vs,d,ops){
  if(d===0||(d<3&&Math.random()<0.25)){ const v=V(pick(vs)); return Math.random()<0.3?N(v):v; }
  if(Math.random()<0.14){ const g=randF(vs,d-1,ops); return g.o==="¬"?g.a:N(g); }
  return B(pick(ops),randF(vs,d-1,ops),randF(vs,d-1,ops)); }
function nice(f){ if(isBin(f)){ if(show0(f.a)===show0(f.b)) return false; return nice(f.a)&&nice(f.b); } if(f.o==="¬") return nice(f.a); return true; }

function truthTableHTML(f){
  const vs=vars0(f).sort(), cols=[];
  const add=g=>{ if(g.o!=="v"&&!cols.some(c=>show0(c)===show0(g))) cols.push(g); };
  if(isBin(f)){ add(f.a); add(f.b); } else if(f.o==="¬") add(f.a);
  add(f);
  return `<div class="tablewrap"><table class="tt"><tr>${vs.map(v=>`<th>${v}</th>`).join("")}${cols.map(c=>`<th>${esc(show0(c))}</th>`).join("")}</tr>`+
    interps(vs).map(I=>`<tr>${vs.map(v=>`<td>${I[v]?"T":"F"}</td>`).join("")}${cols.map(c=>`<td>${TV(ev0(c,I))}</td>`).join("")}</tr>`).join("")+`</table></div>`;
}
const showI=I=>"{ "+Object.keys(I).sort().map(k=>k+" = "+(I[k]?"T":"F")).join(", ")+" }";

/* =====================================================================
   L1 · predicate logic
   terms: {o:"var",n} {o:"cst",n} {o:"fn",n,args}
   formulas: {o:"at",n,args} ¬ binary {o:"∀"|"∃",x,a}
   ===================================================================== */
const Var=n=>({o:"var",n}), Cst=n=>({o:"cst",n}), Fn=(n,args)=>({o:"fn",n,args});
const At=(n,args)=>({o:"at",n,args}), Q=(o,x,a)=>({o,x,a});
function showT(t){ return t.o==="fn"?t.n+"("+t.args.map(showT).join(",")+")":t.n; }
function show1(f){
  switch(f.o){
    case "at": return f.args.length?f.n+"("+f.args.map(showT).join(",")+")":f.n;
    case "¬": return "¬"+(isBin(f.a)?"("+show1(f.a)+")":show1(f.a));
    case "∀": case "∃": return f.o+f.x+(isBin(f.a)?" ("+show1(f.a)+")":(f.a.o==="at"?" ":"")+show1(f.a));
    default: { const w=c=>(isBin(c)&&!(c.o===f.o&&(f.o==="∧"||f.o==="∨")))?"("+show1(c)+")":show1(c);
      return w(f.a)+" "+f.o+" "+w(f.b); }
  }
}
/* Scope-aware parser: an identifier bound by a quantifier is a variable;
   otherwise, with arguments it is a function, starting with a capital letter a free variable, and else a constant. */
function parse1(s){
  const t=tokenize(s); let i=0;
  const term=sc=>{ const x=t[i++]; if(!x||!/^[A-Za-z_]/.test(x)) throw new Error("Term expected: "+x);
    if(t[i]==="("){ i++; const args=[]; for(;;){ args.push(term(sc)); const c=t[i++]; if(c===")") break; if(c!==",") throw new Error("Falta , o )"); } return Fn(x,args); }
    if(sc.includes(x)||/^[A-Z]/.test(x)) return Var(x); return Cst(x); };
  const prim=sc=>{ const x=t[i++];
    if(x==="¬") return N(prim(sc));
    if(x==="∀"||x==="∃"){ const v=t[i++]; return Q(x,v,prim(sc.concat([v]))); }
    if(x==="("||x==="["){ const e=bin(1,sc), c=t[i++]; if(c!==")"&&c!=="]") throw new Error("Missing parenthesis"); return e; }
    if(x&&/^[A-Za-z_]/.test(x)){ if(t[i]==="("){ i++; const args=[]; for(;;){ args.push(term(sc)); const c=t[i++]; if(c===")") break; if(c!==",") throw new Error("Falta , o )"); } return At(x,args); } return At(x,[]); }
    throw new Error("Inesperado: "+x); };
  const bin=(min,sc)=>{ let l=prim(sc); for(;;){ const op=t[i], p=PREC[op]; if(!p||p<min) return l; i++; l=B(op,l,bin(p+1,sc)); } };
  const e=bin(1,[]); if(i<t.length) throw new Error("Sobra: "+t[i]); return e;
}
function freeVars(f,bound=[],acc=[]){
  const tv=t=>{ if(t.o==="var"){ if(!bound.includes(t.n)&&!acc.includes(t.n)) acc.push(t.n); } else if(t.o==="fn") t.args.forEach(tv); };
  switch(f.o){ case "at": f.args.forEach(tv); break; case "¬": freeVars(f.a,bound,acc); break;
    case "∀": case "∃": freeVars(f.a,bound.concat([f.x]),acc); break; default: freeVars(f.a,bound,acc); freeVars(f.b,bound,acc); }
  return acc; }
/* Evaluation over a finite domain. M = {D, c:{a:1}, f:{f:x=>..}, p:{p:(x,y)=>bool}} */
function evT(t,M,env){ if(t.o==="var") return env[t.n]; if(t.o==="cst") return t.n in M.c?M.c[t.n]:(isNaN(+t.n)?t.n:+t.n); return M.f[t.n](...t.args.map(a=>evT(a,M,env))); }
function ev1(f,M,env={}){ switch(f.o){
  case "at": return !!M.p[f.n](...f.args.map(a=>evT(a,M,env)));
  case "¬": return !ev1(f.a,M,env);
  case "∧": return ev1(f.a,M,env)&&ev1(f.b,M,env); case "∨": return ev1(f.a,M,env)||ev1(f.b,M,env);
  case "→": return !ev1(f.a,M,env)||ev1(f.b,M,env); case "↔": return ev1(f.a,M,env)===ev1(f.b,M,env);
  case "∀": return M.D.every(d=>ev1(f.a,M,{...env,[f.x]:d}));
  case "∃": return M.D.some(d=>ev1(f.a,M,{...env,[f.x]:d})); } }
function hasQ(f){ return f.o==="∀"||f.o==="∃"||(f.o==="¬"&&hasQ(f.a))||(isBin(f)&&(hasQ(f.a)||hasQ(f.b))); }
/* Replaces free variables by their values to show the instance */
function inst(f,env){
  const tt=t=>t.o==="var"&&t.n in env?Cst(String(env[t.n])):t.o==="fn"?Fn(t.n,t.args.map(tt)):t;
  switch(f.o){ case "at": return At(f.n,f.args.map(tt)); case "¬": return N(inst(f.a,env));
    case "∀": case "∃": { const e={...env}; delete e[f.x]; return Q(f.o,f.x,inst(f.a,e)); }
    default: return B(f.o,inst(f.a,env),inst(f.b,env)); } }
function atomsOf(f,acc=[]){ if(f.o==="at"){ if(!acc.some(a=>show1(a)===show1(f))) acc.push(f); } else if(f.o==="¬"||f.o==="∀"||f.o==="∃") atomsOf(f.a,acc); else { atomsOf(f.a,acc); atomsOf(f.b,acc); } return acc; }
/* AND/OR tree as HTML */
function aoTree(f,M,env={}){
  if(f.o==="∀"||f.o==="∃"){
    const items=M.D.map(d=>({d,r:aoTree(f.a,M,{...env,[f.x]:d})}));
    const v=f.o==="∀"?items.every(i=>i.r.v):items.some(i=>i.r.v);
    return {v,h:`<span class="aoq">${f.o}${f.x}</span> <span class="muted small">${f.o==="∀"?"AND node: T if every branch is T":"OR node: T if some branch is T"}</span> ⇒ ${TV(v)}<ul class="ao">${items.map(i=>`<li><span class="aob">${f.x} = ${esc(i.d)}</span> ${i.r.h}</li>`).join("")}</ul>`}; }
  if(f.o==="¬"&&hasQ(f.a)){ const r=aoTree(f.a,M,env); return {v:!r.v,h:`<span class="aoq">¬</span> inverts the result ⇒ ${TV(!r.v)}<ul class="ao"><li>${r.h}</li></ul>`}; }
  if(hasQ(f)){ const I=inst(f,env), parts=[]; const sub=g=>{ if(g.o==="∀"||g.o==="∃"||(g.o==="¬"&&hasQ(g.a))) parts.push(g); else if(isBin(g)){ sub(g.a); sub(g.b); } else if(g.o==="¬") sub(g.a); }; sub(f);
    const v=ev1(f,M,env);
    return {v,h:`<code>${esc(show1(I))}</code> ⇒ ${TV(v)}<ul class="ao">${parts.map(g=>`<li><code>${esc(show1(inst(g,env)))}</code>: ${aoTree(g,M,env).h}</li>`).join("")}</ul>`}; }
  const I=inst(f,env), v=ev1(f,M,env);
  const ats=atomsOf(f).map(a=>`${esc(show1(inst(a,env)))} = ${ev1(a,M,env)?"T":"F"}`).join(" · ");
  return {v,h:`<code>${esc(show1(I))}</code> <span class="muted small">(${ats})</span> ⇒ ${TV(v)}`};
}

/* ---------- substitutions and unification ---------- */
const eqT=(a,b)=>showT(a)===showT(b);
function varsT(t,acc=[]){ if(t.o==="var"){ if(!acc.includes(t.n)) acc.push(t.n); } else if(t.o==="fn") t.args.forEach(a=>varsT(a,acc)); return acc; }
function occurs(x,t){ return t.o==="var"?t.n===x:t.o==="fn"?t.args.some(a=>occurs(x,a)):false; }
function substT(t,m){ if(t.o==="var") return m[t.n]!==undefined?m[t.n]:t; if(t.o==="fn") return Fn(t.n,t.args.map(a=>substT(a,m))); return t; }
const smap=s=>Object.fromEntries(s.map(([x,t])=>[x,t]));
const applyS=(t,s)=>substT(t,smap(s));
const showS=s=>s.length?"{"+s.map(([x,t])=>x+"/"+showT(t)).join(", ")+"}":"{ }";
function sameS(a,b){ const k=s=>s.map(([x,t])=>x+"/"+showT(t)).sort().join(","); return k(a)===k(b); }
/* σ1σ2: apply σ2 to the terms of σ1, drop X/X and add the pairs of σ2 whose variable is not in σ1 */
function compose(s1,s2){
  const out=s1.map(([x,t])=>[x,applyS(t,s2)]).filter(([x,t])=>!(t.o==="var"&&t.n===x));
  const dom=s1.map(p=>p[0]); s2.forEach(([x,t])=>{ if(!dom.includes(x)) out.push([x,t]); }); return out; }
const head=t=>t.o==="var"?"V:"+t.n:t.o==="cst"?"C:"+t.n:"F:"+t.n+"/"+t.args.length;
function disagree(ts){
  const hs=ts.map(head);
  if(hs.every(h=>h===hs[0])){ if(ts[0].o!=="fn") return null;
    for(let i=0;i<ts[0].args.length;i++){ const d=disagree(ts.map(t=>t.args[i])); if(d) return d; } return null; }
  const out=[]; ts.forEach(t=>{ if(!out.some(u=>eqT(u,t))) out.push(t); }); return out; }
/* Unification algorithm from the slides, with a trace */
function mgu(exprs){
  let mu=[]; const steps=[];
  for(let it=0;it<30;it++){
    const T=exprs.map(e=>applyS(e,mu)), D=disagree(T);
    if(!D){ steps.push({T,mu}); return {ok:true,mu,steps}; }
    const v=D.find(t=>t.o==="var");
    if(!v){ steps.push({T,D,fail:"two terms start with different symbols"}); return {ok:false,steps,mu}; }
    const t=D.find(u=>!eqT(u,v)&&u.o!=="var")||D.find(u=>!eqT(u,v));
    if(occurs(v.n,t)){ steps.push({T,D,fail:`the variable ${v.n} occurs inside ${showT(t)}`}); return {ok:false,steps,mu}; }
    const d=[[v.n,t]], nx=compose(mu,d); steps.push({T,D,d,mu:nx}); mu=nx;
  }
  return {ok:false,steps,mu};
}
const isUnifier=(exprs,s)=>exprs.map(e=>showT(applyS(e,s))).every((x,_,a)=>x===a[0]);
function mguHTML(exprs){
  const r=mgu(exprs);
  return `<ol class="steps">`+r.steps.map((s,i)=>{
    const tl=s.T.map(x=>esc(showT(x))).join(" &nbsp;·&nbsp; ");
    if(!s.D) return `<li>Tμ<sub>${i}</sub>: ${tl}. They are identical ⇒ <b>mgu = ${esc(showS(s.mu))}</b></li>`;
    if(s.fail) return `<li>Tμ<sub>${i}</sub>: ${tl}. D = {${s.D.map(x=>esc(showT(x))).join(", ")}}: ${esc(s.fail)} ⇒ <b>not unifiable</b></li>`;
    return `<li>Tμ<sub>${i}</sub>: ${tl}. D = {${s.D.map(x=>esc(showT(x))).join(", ")}} ⇒ δ = ${esc(showS(s.d))}, μ<sub>${i+1}</sub> = ${esc(showS(s.mu))}</li>`;
  }).join("")+`</ol>`;
}

/* ---------- random terms ---------- */
function randTerm(vars,d){
  const r=Math.random();
  if(d<=0||r<0.45) return Var(pick(vars));
  if(r<0.62) return Cst(pick(["a","b"]));
  const f=pick(["f","g","h"]); return Fn(f,[randTerm(vars,d-1)]);
}
function randAtom(n,vars,d){ return Fn("p",Array.from({length:n},()=>randTerm(vars,d))); }

/* =====================================================================
   GENERATORS. Each make() returns a multiple-choice question:
   {q, c?, o:[...], a: index or [indices], m: multi?, e: solution HTML, eh:true}
   ===================================================================== */
const OPT_NONE="None of the others is correct";

/* --- L0: classify a formula --- */
function genClassify(){
  const target=pick(["valid","sat","unsat","valid","unsat"]); let f=null;
  for(let k=0;k<6000&&!f;k++){
    const vs=pick([["p","q"],["p","q","r"],["p","q","r"]]);
    const g=randF(vs,3,["∧","∨","→","↔","→","∨","∧"]);
    const sz=size0(g); if(sz<6||sz>12||vars0(g).length!==vs.length||!nice(g)) continue;
    if(classify(g)===target) f=g;
  }
  if(!f) f=parse0(pick(["(p → q) ∧ (q → r) → (p → r)","(p ∨ q) ∧ ¬p ∧ ¬q","(p → q) → p"]));
  const c=classify(f), labels={valid:"It is valid (a tautology)",sat:"It is satisfiable but not valid",unsat:"It is unsatisfiable (a contradiction)"};
  const why={valid:"Every row gives T: the formula is <b>valid</b> (and therefore also satisfiable).",
    sat:"There are rows with T and rows with F: it is <b>satisfiable but not valid</b>. Its negation would also be satisfiable and not valid (mirror principle).",
    unsat:"Every row gives F: it is <b>unsatisfiable</b>. Its negation would be valid."}[c];
  return {q:"Classify the following propositional formula:",c:show0(f),o:[labels.valid,labels.sat,labels.unsat],a:["valid","sat","unsat"].indexOf(c),ns:1,
    e:`<p>${why}</p>${truthTableHTML(f)}`,eh:1};
}

/* --- L0: is the argument sound? (contradiction method) --- */
const SOUND_T=[
  ["A → B","A","B"],["A → B","¬B","¬A"],["A → B","B → C","A → C"],["A ∨ B","¬A","B"],
  ["A ∨ B","A → C","B → C","C"],["A → B ∧ C","A → C"],["A ∧ B → C","A → (B → C)"],["A → C","B → C","A ∨ B → C"],
  ["A → B","¬B → ¬A"],["¬(A ∧ B)","A","¬B"],["A → B","B → C","¬C","¬A"],["A ∧ ¬B → C","¬C ∧ A","B"],
  ["A → B","B","A"],["A → B","¬A","¬B"],["A → B","B → A"],["A ∨ B","A","¬B"],["A → B ∨ C","¬B","¬A"],
  ["A → B","B → C","C → A"],["A ∨ B → C","A ∧ B"],["A → C","B","A ∧ C"],["(A ∨ B) ∧ ¬(A ∧ B)","A → ¬C","C → ¬B"],["A ↔ B","B ↔ C","A ↔ C"],["A → B","A ∨ C","B ∨ C"]
];
function instTemplate(tpl){
  const vs=shuffle(["p","q","r","s"]); const m={};
  ["A","B","C"].forEach((L,i)=>{ const v=vs[i]; m[L]=Math.random()<0.25?"¬"+v:v; });
  if(Math.random()<0.2){ m.A="("+vs[0]+" ∧ "+vs[3]+")"; }
  return tpl.map(s=>s.replace(/[ABC]/g,L=>m[L])).map(s=>show0(noDN(parse0(s))));
}
function noDN(f){ if(f.o==="¬"){ return f.a.o==="¬"?noDN(f.a.a):N(noDN(f.a)); } if(isBin(f)) return B(f.o,noDN(f.a),noDN(f.b)); return f; }
function genSound(){
  const tpl=pick(SOUND_T), all=instTemplate(tpl), prem=all.slice(0,-1).map(parse0), concl=parse0(all[all.length-1]);
  const cm=countermodel(prem,concl), sound=!cm;
  const big=prem.map(p=>isBin(p)?"("+show0(p)+")":show0(p)).join(" ∧ ")+" → "+(isBin(concl)?"("+show0(concl)+")":show0(concl));
  const o=["Assuming the formula is false under some interpretation, every case leads to a contradiction, so the reasoning is sound.",
    "Assuming the formula is false under some interpretation, every case leads to a contradiction, so the reasoning is NOT sound.",
    "Assuming the formula is false under some interpretation, NOT every case leads to a contradiction, so the reasoning is sound.",
    "Assuming the formula is false under some interpretation, NOT every case leads to a contradiction, so the reasoning is NOT sound."];
  const vs=uniq(prem.flatMap(p=>vars0(p)).concat(vars0(concl))).sort();
  const rows=interps(vs).filter(I=>prem.every(p=>ev0(p,I)));
  const e=`<p>By logical consequence theorem I, the argument is sound if and only if <code>${esc(big)}</code> is valid. In the contradiction method we assume it is <b>F</b>: premises T and conclusion F.</p>`+
    (sound?`<p>No such interpretation exists: every case leads to a contradiction, so the formula is <b>valid</b> and the argument is <b>sound</b>.</p>`
      :`<p>There is a case with no contradiction, the countermodel <b>${showI(cm)}</b>: premises T and conclusion F. The formula is <b>not valid</b> and the argument is <b>not sound</b>.</p>`)+
    `<p class="small muted">Interpretations that make every premise T (the conclusion must be T in all of them):</p><div class="tablewrap"><table class="tt"><tr>${vs.map(v=>`<th>${v}</th>`).join("")}<th>${esc(show0(concl))}</th></tr>${rows.map(I=>`<tr>${vs.map(v=>`<td>${I[v]?"T":"F"}</td>`).join("")}<td>${TV(ev0(concl,I))}</td></tr>`).join("")||`<tr><td colspan="${vs.length+1}">None: the premises are inconsistent.</td></tr>`}</table></div>`;
  return {q:`We want to prove, by contradiction, the soundness of the reasoning {${prem.map(show0).join(", ")}} ⊨ ${show0(concl)}, i.e. the validity of the formula below. Select the correct statement:`,c:big,o,a:sound?0:3,ns:1,e,eh:1};
}

/* --- L0: forma clausal --- */
function genClausal0(){
  let f,cs;
  for(let k=0;k<3000;k++){
    const vs=pick([["p","q","r"],["p","q","r","s"]]);
    const g=randF(vs,3,["→","→","↔","∧","∨","∨"]);
    if(!nice(g)||size0(g)<6||size0(g)>11) continue;
    if(!/[→↔]/.test(show0(g))&&Math.random()<0.7) continue;
    const c=clausal0(g); if(c.length<1||c.length>4||c.some(x=>x.length>4)) continue;
    if(classify(g)!=="sat") continue;
    f=g; cs=c; break;
  }
  if(!f){ f=parse0("¬(p ∧ (¬q → ¬r))"); cs=clausal0(f); }
  const right=cnfToF(cs), cand=[];
  const addC=c=>{ if(!c.length) return; if(equiv(cnfToF(c),right)) return; if(cand.some(x=>sameClauses(x,c))) return; cand.push(c); };
  addC(clausal0(f,"dm")); addC(clausal0(f,"imp"));
  for(let k=0;k<40&&cand.length<5;k++){ const c=cs.map(x=>x.slice()); const i=R(c.length), j=R(c[i].length); c[i][j]=negL(c[i][j]); addC(simplifyClauses(c)); }
  if(cs.length>1) addC(cs.slice(0,-1));
  if(cand.length<2) return genClausal0();
  const noneRight=Math.random()<0.2&&cand.length>=3;
  const opts=noneRight?shuffle(cand).slice(0,3):[cs].concat(shuffle(cand).slice(0,2));
  const order=shuffle([0,1,2]); const o=order.map(i=>"The set of clauses: "+showClauses(opts[i])).concat([OPT_NONE]);
  const a=noneRight?3:order.indexOf(0);
  const g1=elim(f), g2=nnf(g1), raw=cnfList(g2);
  const e=`<ol class="steps"><li>Remove ↔ and →: <code>${esc(show0(g1))}</code></li><li>Push ¬ inwards (De Morgan, double negation): <code>${esc(show0(g2))}</code></li><li>Distribute ∨ over ∧: ${esc(showClauses(raw))}</li><li>Simplify (repeated literals, clauses with p and ¬p, absorption): <b>${esc(showClauses(cs))}</b></li></ol>`+
    (noneRight?`<p>None of the proposed sets is equivalent to the formula: the answer is “None of the others”.</p>`:"")+
    `<p class="small muted">The wrong options come from typical mistakes: misapplying De Morgan, rewriting A → B as A ∨ ¬B, or flipping the sign of a literal.</p>`;
  return {q:"The clausal form of the following formula would be:",c:show0(f),o,a,ns:1,e,eh:1};
}

/* --- L1: evaluate under an interpretation (AND/OR tree) --- */
const BINP=[["X ≤ Y",(x,y)=>x<=y],["X ≥ Y",(x,y)=>x>=y],["X < Y",(x,y)=>x<y],["X = Y",(x,y)=>x===y],["X ≠ Y",(x,y)=>x!==y],["X + Y is even",(x,y)=>(x+y)%2===0]];
const UNP=[["X is odd",x=>x%2===1],["X is even",x=>x%2===0],["X = 1",x=>x===1],["X > 1",x=>x>1],["X < 3",x=>x<3],["X ≥ 2",x=>x>=2],["X = 2",x=>x===2]];
const KERN=["P(X,Y) → Q(X)","P(X,Y) → Q(Y)","P(X,Y) ∧ Q(Y)","Q(X) ∧ ¬P(X,Y)","P(X,Y) ↔ Q(Y)","Q(X) → P(X,Y)","P(X,Y) ∨ Q(X)","P(X,Y) → Q(X) ∨ R(Y)","Q(X) ↔ (P(Y,X) → Q(Y))","¬Q(X) ∨ P(X,Y)","P(X,Y) ∧ Q(X) → R(Y)"];
const PREF=["∀X∀Y","∃X∃Y","∀X∃Y","∃X∀Y","∀Y∃X","∃Y∀X","∀Y¬∀X","¬∃X∀Y","∃X¬∀Y","¬∀X¬∀Y","¬∃Y∃X","∀X¬∃Y"];
function genAO(){
  for(let tries=0;tries<200;tries++){
    const D=pick([[1,2],[1,2,3],[1,2,3]]), bp=pick(BINP), up=pick(UNP);
    let rp=pick(UNP); while(rp===up) rp=pick(UNP);
    const kern=pick(KERN), useR=kern.includes("R(");
    const M={D,c:{},f:{},p:{P:bp[1],Q:up[1],R:rp[1]}};
    const prefs=shuffle(PREF).slice(0,4);
    const fs=prefs.map(p=>parse1(p+" ("+kern+")"));
    const vals=fs.map(f=>ev1(f,M));
    const nt=vals.filter(Boolean).length; if(nt<1||nt>3) continue;
    const Is=`D = {${D.join(",")}}, P(X,Y) = "${bp[0]}", Q(X) = "${up[0]}"`+(useR?`, R(X) = "${rp[0]}"`:"");
    const e=fs.map((f,i)=>`<div class="aowrap"><div><b>${"abcd"[i]})</b> <code>${esc(show1(f))}</code> ⇒ ${TV(vals[i])}</div>${aoTree(f,M).h}</div>`).join("");
    return {q:`Consider the interpretation I = { ${Is} }. Select the formulas that are true under I (there could be more than one):`,o:fs.map(show1),a:vals.map((v,i)=>v?i:-1).filter(i=>i>=0),m:1,
      e:`<p>Each ∀ is an AND node (all its branches T) and each ∃ an OR node (one T branch is enough). A ¬ in front of a quantifier inverts its result.</p>`+e,eh:1};
  }
  return genAO();
}

/* --- L1: unification (Campus Virtual style statements) --- */
function randPair(){
  const vars=shuffle(["X","Y","Z","U","V"]).slice(0,3), n=pick([2,2,3]);
  return [randAtom(n,vars,2),randAtom(n,vars,2)];
}
function unifStatement(){
  for(let k=0;k<200;k++){
    const pr=randPair(); if(eqT(pr[0],pr[1])) continue;
    const r=mgu(pr), set="{"+pr.map(showT).join(", ")+"}";
    if(r.ok){
      if(!r.mu.length) continue;
      if(Math.random()<0.45) return {s:`The most general unifier (m.g.u.) of the set ${set} is ${showS(r.mu)}`,v:true,pr};
      const ds=[];
      const raw=r.steps.filter(s=>s.d).map(s=>s.d[0]); if(raw.length>1&&!sameS(raw,r.mu)&&!isUnifier(pr,raw)) ds.push(raw);
      if(r.mu.length>1){ const dropped=r.mu.slice(1); if(!isUnifier(pr,dropped)) ds.push(dropped); }
      const sw=r.mu.map(([x,t])=>[x,t.o==="cst"?Cst(t.n==="a"?"b":"a"):t]); if(!sameS(sw,r.mu)&&!isUnifier(pr,sw)) ds.push(sw);
      if(Math.random()<0.3) return {s:`The set ${set} is not unifiable`,v:false,pr};
      if(ds.length) return {s:`The most general unifier (m.g.u.) of the set ${set} is ${showS(pick(ds))}`,v:false,pr};
    } else {
      if(Math.random()<0.5) return {s:`The set ${set} is not unifiable`,v:true,pr};
      if(r.mu.length) return {s:`The most general unifier (m.g.u.) of the set ${set} is ${showS(r.mu)}`,v:false,pr};
    }
  }
  return unifStatement();
}
function genUnify(){
  let st; do{ st=[0,1,2,3].map(unifStatement); }while(!st.some(s=>s.v)||st.every(s=>s.v));
  return {q:"Let X, Y, Z, U, V be variables, a, b constants and f, g, h functions. Select the correct answers (there could be more than one):",o:st.map(s=>s.s),a:st.map((s,i)=>s.v?i:-1).filter(i=>i>=0),m:1,
    e:st.map((s,i)=>`<div class="aowrap"><b>${"abcd"[i]})</b> ${s.v?"True":"False"}. Algorithm on {${esc(s.pr.map(showT).join(", "))}}:${mguHTML(s.pr)}</div>`).join("")+
      `<p class="small muted">Common traps: not applying δ to the earlier bindings (μ<sub>i+1</sub> = μ<sub>i</sub>δ is a <b>composition</b>), forgetting a binding, or missing a symbol clash.</p>`,eh:1};
}
function genMGU(){
  for(let k=0;k<300;k++){
    const pr=randPair(); if(eqT(pr[0],pr[1])) continue;
    const r=mgu(pr); if(r.ok&&!r.mu.length) continue;
    const NU="The set is not unifiable", opts=[];
    if(r.ok){
      opts.push(showS(r.mu));
      const raw=r.steps.filter(s=>s.d).map(s=>s.d[0]); if(raw.length>1&&!isUnifier(pr,raw)) opts.push(showS(raw));
      if(r.mu.length>1){ const dr=r.mu.slice(0,-1); if(!isUnifier(pr,dr)) opts.push(showS(dr)); }
      const sw=r.mu.map(([x,t])=>[x,t.o==="cst"?Cst(t.n==="a"?"b":"a"):t]); if(!isUnifier(pr,sw)) opts.push(showS(sw));
      const u=uniq(opts); if(u.length<3) continue;
      const o=[u[0]].concat(shuffle(u.slice(1)).slice(0,2)), ord=shuffle([0,1,2]);
      return {q:`Compute the most general unifier (m.g.u.) of {${pr.map(showT).join(", ")}} (X, Y, Z, U, V variables; a, b constants):`,o:ord.map(i=>o[i]).concat([NU]),a:ord.indexOf(0),ns:1,e:mguHTML(pr),eh:1};
    } else {
      if(!r.mu.length) continue;
      const o=[showS(r.mu)], vs=uniq(pr.flatMap(t=>varsT(t)));
      for(let g=0;g<50&&o.length<3;g++){ const x=pick(vs), s=[[x,Cst(pick(["a","b"]))]];
        if(vs.length>1&&Math.random()<0.6){ const y=pick(vs.filter(v=>v!==x)); s.push([y,Fn(pick(["f","g"]),[Cst(pick(["a","b"]))])]); }
        const str=showS(s); if(!o.includes(str)) o.push(str); }
      if(o.length<3) continue;
      return {q:`Compute the most general unifier (m.g.u.) of {${pr.map(showT).join(", ")}} (X, Y, Z, U, V variables; a, b constants):`,o:shuffle(o).concat([NU]),a:3,ns:1,e:mguHTML(pr),eh:1};
    }
  }
  return genMGU();
}

/* --- L1: composition of substitutions --- */
function randSubst(vars,n){
  const dom=shuffle(vars).slice(0,n);
  return dom.map(x=>[x,randTerm(vars.filter(v=>v!==x),2)]);
}
function genCompose(){
  for(let k=0;k<300;k++){
    const vars=["X","Y","Z","T"];
    const s1=randSubst(vars,pick([2,3])), s2=randSubst(vars,pick([2,3]));
    const c12=compose(s1,s2), c21=compose(s2,s1);
    if(sameS(c12,c21)) continue;
    const naive12=s1.concat(s2.filter(([x])=>!s1.some(p=>p[0]===x)));
    const noApply21=s2.concat(s1.filter(([x])=>!s2.some(p=>p[0]===x)));
    const all12=s1.map(([x,t])=>[x,applyS(t,s2)]).concat(s2);
    const wantFirst=Math.random()<0.5;
    const cands=[["σ₁σ₂",c12,true],["σ₂σ₁",c21,true],["σ₁σ₂",naive12,false],["σ₂σ₁",noApply21,false],["σ₁σ₂",all12,false],["σ₂σ₁",c12,false],["σ₁σ₂",c21,false]];
    const ok=([l,s])=>l==="σ₁σ₂"?sameS(s,c12):sameS(s,c21);
    const right=cands.find(c=>c[0]===(wantFirst?"σ₁σ₂":"σ₂σ₁")&&c[2]);
    const wrong=uniq(cands.filter(c=>!ok(c)).map(c=>c[0]+" = "+showS(c[1])));
    if(wrong.length<3) continue;
    const o=[right[0]+" = "+showS(right[1])].concat(shuffle(wrong).slice(0,3)), ord=shuffle([0,1,2,3]);
    const e=`<p>σ₁σ₂ is computed in two steps: (1) apply σ₂ to the <b>terms</b> of σ₁ (and drop any X/X pairs that appear); (2) add the pairs of σ₂ whose variable is <b>not</b> in σ₁.</p>
      <ul><li>σ₁ = ${esc(showS(s1))}, σ₂ = ${esc(showS(s2))}</li><li>σ₁σ₂: ${esc(s1.map(([x,t])=>x+"/"+showT(t)+"σ₂ = "+x+"/"+showT(applyS(t,s2))).join(" · "))} ⇒ <b>${esc(showS(c12))}</b></li>
      <li>σ₂σ₁: ${esc(s2.map(([x,t])=>x+"/"+showT(t)+"σ₁ = "+x+"/"+showT(applyS(t,s1))).join(" · "))} ⇒ <b>${esc(showS(c21))}</b></li></ul><p class="small muted">Composition is not commutative: σ₁σ₂ ≠ σ₂σ₁ in general.</p>`;
    return {q:`Given σ₁ = ${showS(s1)} and σ₂ = ${showS(s2)} (X, Y, Z, T variables), select the correct statement:`,o:ord.map(i=>o[i]),a:ord.indexOf(0),ns:1,e,eh:1};
  }
  return genCompose();
}

/* --- L1: skolemization of a prenex formula --- */
const SKO_PREF=[["∃X","∀Y","∃Z"],["∀X","∃Y","∀Z"],["∀X","∃Y","∀Z","∃W"],["∃X","∀Y","∀Z","∃W"],["∀X","∀Y","∃Z"],["∀X","∃Y","∃Z"],["∃X","∀Y","∃Z","∀W"]];
function genSkolem(){
  for(let k=0;k<200;k++){
    const pref=pick(SKO_PREF), vs=pref.map(q=>q[1]);
    const lits=shuffle([`p(${vs[0]},${vs[1]})`,`q(${vs[vs.length-1]})`,`¬r(${vs[1]},${vs[2]})`,`s(${vs[0]},${vs[vs.length-1]})`]).slice(0,3);
    const kern=lits[0]+" ∨ ("+lits[1]+" ∧ "+lits[2]+")";
    const build=dep=>{ const fn=["f","g","h"], cs=["a","b","c"]; let fi=0, ci=0; const m={}, univ=[];
      pref.forEach((q,i)=>{ if(q[0]==="∀") univ.push(q[1]); else { const args=dep(i); m[q[1]]=args.length?`${fn[fi++]}(${args.join(",")})`:cs[ci++]; } });
      const body=kern.replace(/\b([XYZW])\b/g,x=>m[x]||x);
      return (univ.length?univ.map(x=>"∀"+x).join(""):"")+" ["+body+"]"; };
    const before=i=>pref.slice(0,i).filter(q=>q[0]==="∀").map(q=>q[1]);
    const allU=()=>pref.filter(q=>q[0]==="∀").map(q=>q[1]);
    const after=i=>pref.slice(i+1).filter(q=>q[0]==="∀").map(q=>q[1]);
    const right=build(before), opts=uniq([right,build(()=>[]),build(allU),build(after),build(i=>pref.slice(0,i).map(q=>q[1]))]);
    if(opts.length<4) continue;
    const o=[right].concat(shuffle(opts.slice(1)).slice(0,3)), ord=shuffle([0,1,2,3]);
    const expl=pref.map((q,i)=>q[0]==="∃"?`<li>∃${q[1]}: ${before(i).length?`is in the scope of ${before(i).map(x=>"∀"+x).join("")} ⇒ Skolem function of ${before(i).join(", ")}`:"has no ∀ in front of it ⇒ new Skolem constant"}</li>`:"").join("");
    return {q:"Eliminate the existential quantifiers (Skolem normal form) of the prenex formula:",c:pref.join("")+" ["+kern+"]",o:ord.map(i=>o[i]),a:ord.indexOf(0),ns:1,
      e:`<p>Each ∃ is replaced by a new symbol that depends only on the ∀s <b>to its left</b>:</p><ul>${expl}</ul><p>Result: <code>${esc(right)}</code>. It is <b>equisatisfiable</b> with the original (not equivalent).</p>`,eh:1};
  }
  return genSkolem();
}

const GEN={
  clas:{t:"p2",name:"Classify a formula",desc:"Valid, satisfiable or unsatisfiable, with its truth table.",make:genClassify},
  sound:{t:"p2",name:"Arguments by contradiction",desc:"Sound or not? With the countermodel when there is one.",make:genSound},
  cf0:{t:"p3",name:"Clausal form (L0)",desc:"Remove →, De Morgan, distribute and simplify.",make:genClausal0},
  ao:{t:"q2",name:"AND/OR trees",desc:"Which formulas are true under a finite interpretation.",make:genAO},
  unif:{t:"q3",name:"Unification statements",desc:"Mgu or not unifiable, as in the mock exams.",make:genUnify},
  mgu:{t:"q3",name:"Compute the mgu",desc:"The unification algorithm step by step.",make:genMGU},
  comp:{t:"q3",name:"Composition σ₁σ₂",desc:"Apply σ₂ to σ₁ and add what is missing.",make:genCompose},
  sko:{t:"q3",name:"Skolemization",desc:"Skolem constants and functions.",make:genSkolem}
};

return {R,pick,shuffle,uniq,esc,tokenize,parse0,show0,vars0,ev0,interps,classify,equiv,countermodel,consistent,clausal0,showClauses,cnfToF,sameClauses,
  parse1,show1,showT,freeVars,ev1,aoTree,mgu,mguHTML,compose,applyS,showS,sameS,isUnifier,Var,Cst,Fn,At,truthTableHTML,GEN};
})();
if(typeof window!=="undefined") window.LG=LG;
