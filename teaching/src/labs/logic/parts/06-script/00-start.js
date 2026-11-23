
const CP=(function(){
const KW=/^(begin|end|while|do|if|then|else|repeat|until|succ|pred|div|mod|and|or|not)$/i;
const RELS={'#':'≠','=':'=','<':'<','>':'>','$':'≤','%':'≥'};
const Q='begin\n  X1:=0\nend';
const CAP=1n<<4096n;
function lex(s){
 s=s.replace(/\r/g,'').replace(/∸/g,'-').replace(/≠|!=|<>/g,'#').replace(/≤|<=/g,'$').replace(/≥|>=/g,'%').replace(/∧|&&?/g,' and ').replace(/∨|\|\|?/g,' or ').replace(/¬|!(?!=)/g,' not ');
 return s.match(/:=|\*\*|[A-Za-z_][A-Za-z_0-9]*|\d+|[#$%<>=+\-*(),;]|\S/g)||[];
}
function parser(t){
 let i=0;const vars=[];
 const pk=()=>t[i],lw=()=>t[i]===undefined?undefined:t[i].toLowerCase();
 const nx=()=>{if(i>=t.length)throw Error('The program ends unexpectedly');return t[i++]};
 const isId=x=>x!==undefined&&/^[A-Za-z_]/.test(x)&&!KW.test(x);
 const reg=n=>{if(!vars.includes(n))vars.push(n);return n};
 function atom(){const x=nx();
  if(/^\d+$/.test(x))return{n:BigInt(x)};
  if(x=='('){const e=expr();if(nx()!=')')throw Error('Missing )');return e}
  const l=x.toLowerCase();
  if((l=='succ'||l=='pred')&&pk()=='('){nx();const e=expr();if(nx()!=')')throw Error('Missing )');return{f:l,a:e}}
  if(x=='U'&&pk()=='('){nx();const a=[expr()];while(pk()==','){nx();a.push(expr())}if(nx()!=')')throw Error('Missing )');return{u:a}}
  if(isId(x))return{v:reg(x)};
  throw Error('Unexpected "'+x+'" in an expression');
 }
 function pow(){const a=atom();if(pk()=='**'){nx();return{op:'**',a,b:pow()}}return a}
 function term(){let a=pow();for(;;){const l=lw();if(pk()=='*'||l=='div'||l=='mod'){const o=nx().toLowerCase();a={op:o,a,b:pow()}}else return a}}
 function expr(){let a=term();while(pk()=='+'||pk()=='-'){const o=nx();a={op:o,a,b:term()}}return a}
 function tAtom(){
  if(lw()=='not'){nx();return{not:tAtom()}}
  if(pk()=='('){const s=i;try{nx();const c=tOr();if(nx()!=')')throw Error('x');return c}catch(e){i=s}}
  const a=expr();const r=nx();
  if(!RELS[r])throw Error('Expected a comparison (≠ = < > ≤ ≥) but found "'+r+'"');
  return{rel:r,a,b:expr()};
 }
 function tAnd(){let a=tAtom();while(lw()=='and'){nx();a={and:[a,tAtom()]}}return a}
 function tOr(){let a=tAnd();while(lw()=='or'){nx();a={or:[a,tAnd()]}}return a}
 function stmt(){
  const x=nx(),l=x.toLowerCase();
  if(l=='begin'){const b=[];while(lw()!='end'){if(pk()===undefined)throw Error('Missing end');if(pk()==';'){nx();continue}b.push(stmt())}nx();return{k:'b',b}}
  if(l=='while'){const c=tOr();if(lw()!='do')throw Error('Missing do after the while test');nx();return{k:'w',c,s:stmt()}}
  if(l=='if'){const c=tOr();if(lw()!='then')throw Error('Missing then');nx();const a=stmt();let e=null;
   if(pk()==';'&&t[i+1]&&t[i+1].toLowerCase()=='else')nx();
   if(lw()=='else'){nx();e=stmt()}return{k:'i',c,a,e}}
  if(l=='repeat'){const b=[];while(lw()!='until'){if(pk()===undefined)throw Error('Missing until');if(pk()==';'){nx();continue}b.push(stmt())}nx();return{k:'r',s:{k:'b',b},c:tOr()}}
  if(isId(x)){if(nx()!=':=')throw Error('Expected := after '+x);return{k:'a',x:reg(x),e:expr()}}
  throw Error('Unexpected "'+x+'"');
 }
 return{stmt,expr,tOr,vars,end:()=>{if(i<t.length)throw Error('Unexpected "'+t[i]+'"')}};
}
function mkvk(vars){
 const nums=vars.length&&vars.every(v=>/^X\d+$/.test(v));
 if(nums){const mx=Math.max(...vars.map(v=>+v.slice(1)));return Array.from({length:mx},(_,i)=>'X'+(i+1))}
 return vars.slice();
}
function parse(src){
 const p=parser(lex(src));const ast=p.stmt();p.end();
 if(ast.k!='b')throw Error('A while program is a compound statement: begin … end');
 return{ast,vars:p.vars,vk:mkvk(p.vars),src};
}
function parseTest(src){const p=parser(lex(src));const t=p.tOr();p.end();return t}
function parseExpr(src){const p=parser(lex(src));const e=p.expr();p.end();return e}
// printing
function es(e,top){
 if(e.n!==undefined)return String(e.n);
 if(e.v)return e.v;
 if(e.f)return e.f+'('+es(e.a,1)+')';
 if(e.u)return 'U('+e.u.map(x=>es(x,1)).join(', ')+')';
 const s=es(e.a)+' '+(e.op=='-'?'∸':e.op)+' '+es(e.b);return top?s:'('+s+')';
}
function ts(t,top){
 let s;
 if(t.rel)s=es(t.a,1)+' '+RELS[t.rel]+' '+es(t.b,1);
 else if(t.not)return '¬'+ts(t.not);
 else if(t.and)s=ts(t.and[0])+' ∧ '+ts(t.and[1]);
 else s=ts(t.or[0])+' ∨ '+ts(t.or[1]);
 return top?s:'('+s+')';
}
function etExpr(t){
 if(t.rel){const A=es(t.a),B=es(t.b);
  switch(t.rel){
   case'<':return '('+B+' ∸ '+A+')';
   case'>':return '('+A+' ∸ '+B+')';
   case'$':return '(1 ∸ ('+A+' ∸ '+B+'))';
   case'%':return '(1 ∸ ('+B+' ∸ '+A+'))';
   case'#':return '(('+B+' ∸ '+A+') + ('+A+' ∸ '+B+'))';
   case'=':return '((1 ∸ ('+B+' ∸ '+A+')) * (1 ∸ ('+A+' ∸ '+B+')))';
  }}
 if(t.and)return '('+etExpr(t.and[0])+' * '+etExpr(t.and[1])+')';
 if(t.or)return '('+etExpr(t.or[0])+' + '+etExpr(t.or[1])+')';
 return '(1 ∸ '+etExpr(t.not)+')';
}
function tvars(t,s){s=s||new Set;const E=e=>{if(e.v)s.add(e.v);else if(e.f)E(e.a);else if(e.u)e.u.forEach(E);else if(e.op){E(e.a);E(e.b)}};
 if(t.rel){E(t.a);E(t.b)}else(t.and||t.or||[t.not]).forEach(x=>tvars(x,s));return s}
// evaluation
function evalE(e,g,U){
 if(e.n!==undefined)return BigInt(e.n);
 if(e.v)return g(e.v);
 if(e.f){const a=evalE(e.a,g,U);return e.f=='succ'?a+1n:(a>0n?a-1n:0n)}
 if(e.u){if(!U)throw 'DIV';return U(e.u.map(x=>evalE(x,g,U)))}
 const a=evalE(e.a,g,U),b=evalE(e.b,g,U);let r;
 switch(e.op){
  case'+':r=a+b;break;
  case'-':r=a>b?a-b:0n;break;
  case'*':r=a*b;break;
  case'div':if(b==0n)throw 'DIV';r=a/b;break;
  case'mod':if(b==0n)throw 'DIV';r=a%b;break;
  case'**':if(b>2000n&&a>1n)throw 'DIV';r=a**b;break;
 }
 if(r>=CAP)throw 'DIV';return r;
}
function evalT(t,g,U){
 if(t.rel){const a=evalE(t.a,g,U),b=evalE(t.b,g,U);
  switch(t.rel){case'#':return a!=b;case'=':return a==b;case'<':return a<b;case'>':return a>b;case'$':return a<=b;case'%':return a>=b}}
 if(t.and)return evalT(t.and[0],g,U)&&evalT(t.and[1],g,U);
 if(t.or)return evalT(t.or[0],g,U)||evalT(t.or[1],g,U);
 return !evalT(t.not,g,U);
}
// encoding
const asc=s=>String(s).replace(/\r/g,'').replace(/≠/g,'!=').replace(/∸/g,'-').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/∧/g,'&&').replace(/∨/g,'||').replace(/¬/g,'!');
function cod(src){
 src=asc(src);let b='';
 for(const ch of src){const c=ch.charCodeAt(0);if(c>255)throw Error('Only 8-bit characters can be encoded: "'+ch+'"');b+=c.toString(2).padStart(8,'0')}
 if(!b)throw Error('Empty program');
 return BigInt('0b'+b);
}
function bits(src){return asc(src).split('').map(ch=>ch.charCodeAt(0).toString(2).padStart(8,'0'))}
function decodText(n){let h=n.toString(16);if(h.length%2)h='0'+h;let s='';for(let k=0;k<h.length;k+=2)s+=String.fromCharCode(parseInt(h.substr(k,2),16));return s}
function decod(n){const s=decodText(BigInt(n));try{return{P:parse(s),src:s,ok:true}}catch(e){return{P:parse(Q),src:Q,ok:false}}}
// running
function run(P,init,o){
 o=o||{};const st={};for(const k in init)st[k]=BigInt(init[k]);
 const max=o.max||300000;let steps=0;const tr=o.trace?[]:null;
 const g=n=>st[n]||0n;const vk=P.vk;const vec=()=>vk.map(n=>String(g(n)));const v0=vec();
 const U=args=>{const d=decod(args[0]);const i2={};args.slice(1).forEach((a,i)=>i2['X'+(i+1)]=a);
  const r=run(d.P,i2,{max:max-steps});if(!r.ok)throw 'DIV';steps+=r.steps;return r.st.X1||0n};
 const tick=()=>{if(++steps>max)throw 'DIV'};
 const rec=a=>{if(tr&&tr.length<400)tr.push({a,v:vec()})};
 function x(s){tick();
  switch(s.k){
   case'a':st[s.x]=evalE(s.e,g,U);rec(s.x+':='+es(s.e,1));return;
   case'b':for(const q of s.b)x(q);return;
   case'w':for(;;){const c=evalT(s.c,g,U);rec(ts(s.c,1)+' ['+(c?'T':'F')+']');tick();if(!c)break;x(s.s)}return;
   case'i':{const c=evalT(s.c,g,U);rec(ts(s.c,1)+' ['+(c?'T':'F')+']');if(c)x(s.a);else if(s.e)x(s.e);return}
   case'r':for(;;){x(s.s);const c=evalT(s.c,g,U);rec(ts(s.c,1)+' ['+(c?'T':'F')+']');if(c)break}return;
  }}
 try{x(P.ast);return{ok:true,st,steps,tr,v0,vk}}catch(e){if(e==='DIV')return{ok:false,steps,tr,v0,vk};throw e}
}
function sem(P,args,o){const init={};args.forEach((a,i)=>init['X'+(i+1)]=BigInt(a));return run(P,init,o)}
function out(P,args,o){const r=sem(P,args,o);return r.ok?(r.st.X1||0n):null}
// features used (to check which macros a program uses)
function feats(P){
 const F=new Set();
 const E=e=>{if(e.f){if(!e.a.v)F.add('expr');E(e.a)}else if(e.u){F.add('U');e.u.forEach(E)}else if(e.op){F.add({'+':'add','-':'sub','*':'mul','div':'div','mod':'mod','**':'pow'}[e.op]);E(e.a);E(e.b)}};
 const atomB=e=>e.v||(e.n!==undefined&&e.n==0n);
 const T=(t,top)=>{if(t.rel){E(t.a);E(t.b);if(!(t.rel=='#'&&atomB(t.a)&&atomB(t.b)&&top))F.add('test')}else{F.add('test');(t.and||t.or||[t.not]).forEach(x=>T(x,0))}};
 const S=s=>{switch(s.k){
  case'a':{const e=s.e;if(e.n!==undefined){if(e.n!=0n)F.add('num')}else if(e.v)F.add('asg');else E(e);break}
  case'b':s.b.forEach(S);break;
  case'w':T(s.c,1);S(s.s);break;
  case'i':F.add('test');T(s.c,0);S(s.a);if(s.e)S(s.e);break;
  case'r':F.add('test');T(s.c,0);S(s.s);break;
 }};
 S(P.ast);return F;
}
// parametrization
function smn(src,m,n,C){
 const L=['begin'];
 for(let k=n;k>=1;k--)L.push('  X'+(m+k)+':=X'+k+';');
 for(let k=1;k<=m;k++)L.push('  X'+k+':='+C[k-1]+';');
 L.push(src.replace(/\r/g,'').split('\n').map(l=>'  '+l).join('\n'));
 L.push('end');
 return L.join('\n');
}
// Turing machines
function parseTM(txt){
 const R={};let init=null;const states=new Set();
 const lines=txt.replace(/\r/g,'').split(/\n|;/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('//'));
 if(!lines.length)throw Error('Write at least one transition');
 const mv=m=>m.toUpperCase().includes('H')?'H':m.toUpperCase()[0];
 for(const L of lines){
  let m=L.match(/^\(\s*(\w+)\s*,\s*(\S)\s*,\s*(\S)\s*,\s*([LRNHlrnh](?:\s*\/\s*[LRNHlrnh])?)\s*,\s*(\w+)\s*\)$/),a,b,d,q,q2;
  if(m){q=m[1];a=m[2];b=m[3];d=mv(m[4]);q2=m[5]}
  else{
   m=L.match(/^T\(\s*(\w+)\s*,\s*(\S)\s*\)\s*=\s*\(\s*(\S)\s*,\s*([LRNHlrnh](?:\s*\/\s*[LRNHlrnh])?)\s*,\s*(\w+)\s*\)$/i);
   if(!m)throw Error('Cannot read the transition "'+L+'". Use (q0, 1, 0, R, q1) or T(q0,1)=(0,R,q1)');
   q=m[1];a=m[2];b=m[3];d=mv(m[4]);q2=m[5];
  }
  const k=q+'|'+a;
  if(R[k]&&(R[k].b!=b||R[k].d!=d||R[k].q!=q2))throw Error('Contradictory transitions for ('+q+', '+a+')');
  R[k]={b,d,q:q2};if(init===null)init=q;states.add(q);states.add(q2);
 }
 return{R,init,states:[...states]};
}
const tmEnc=args=>args.map(n=>'1'.repeat(Number(n)+1)).join('0');
function runTM(M,fin,args,o){
 o=o||{};const max=o.max||5000;const start=o.init||M.init;
 const s=tmEnc(args);const tape=new Map();for(let i=0;i<s.length;i++)tape.set(i,s[i]);
 let head=0,q=start,lo=0,hi=s.length-1,steps=0,halted=false;
 const ids=[];
 const id=()=>{let l='',r='';for(let p=lo;p<head;p++)l+=(tape.get(p)||'0');for(let p=head;p<=hi;p++)r+=(tape.get(p)||'0');
  return (l?l+' ':'')+q+' '+(r||'0')};
 ids.push(id());
 while(steps<max){
  const a=tape.get(head)||'0';const r=M.R[q+'|'+a];
  if(!r){halted=true;break}
  tape.set(head,r.b);if(r.b=='1')hi=Math.max(hi,head);
  if(r.d=='R')head++;else if(r.d=='L')head--;
  lo=Math.min(lo,head);hi=Math.max(hi,head);q=r.q;steps++;ids.push(id());
  if(r.d=='H'){halted=true;break}
 }
 let ones=0;tape.forEach(v=>{if(v=='1')ones++});
 const isF=fin.has(q);
 return{halted,final:halted&&isF,q,ones,steps,ids,result:halted&&isF?ones:null,loop:!halted};
}
return{Q,asc,parse,parseTest,parseExpr,es,ts,etExpr,tvars,evalE,evalT,cod,bits,decod,decodText,run,sem,out,feats,smn,parseTM,runTM,tmEnc,lex};
})();
if(typeof module!=='undefined')module.exports=CP;

/* ===== Computability domain: banks, questions, judges ===== */
(function(){
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const pre=s=>'<pre class=f>'+esc(s)+'</pre>';
const rnd=n=>Math.random()*n|0,pk=a=>a[rnd(a.length)];
const num=s=>{s=String(s).trim().replace(/[\s_.]/g,'');return /^\d+$/.test(s)?BigInt(s):null};
const bot=s=>/^(⊥|undef|undefined|none|inf|∞|loop|diverge|nohalt|no)/i.test(String(s).trim());
const L=a=>a.join('\n');
const NM={asg:'assignment Z := X',num:'constant assignment Z := n',add:'+',sub:'∸',mul:'*',div:'div',mod:'mod',pow:'**',test:'macro-tests / if / repeat',expr:'nested succ/pred expressions',U:'U(X,Y)'};
const fmtV=a=>'('+a.join(', ')+')';

/* ---------- programs ---------- */
const PR={
 sub:L(['begin','  X3:=0;','  while X1≠X3 do','  begin','    X2:=pred(X2);','    X1:=pred(X1)','  end;','  X1:=X2','end']),
 half:L(['begin','  X4:=X1+X2;','  while X4 > X5 do','  begin','    X5:=succ(X5);','    X4:=pred(X4)','  end;','  X1:=X4;','  while X3≠0 do','  begin','    X1:=succ(X1);','    X3:=pred(X3)','  end','end']),
 up:L(['begin','  while X1≠X2 do','    X1:=succ(X1)','end']),
 sq:L(['begin','  X2:=X1;','  X3:=0;','  while X2≠0 do','  begin','    X3:=X3+X1;','    X2:=pred(X2)','  end;','  X1:=X3','end']),
 rep:L(['begin','  X2:=0;','  repeat','  begin','    X2:=X2+2;','    X1:=pred(X1)','  end','  until X1≤1;','  X1:=X2','end']),
 max:L(['begin','  if X1<X2 then X3:=X2 else X3:=X1;','  X1:=X3','end']),
 mt:L(['begin','  while (X1<X2) ∨ (X2≥X3) do','  begin','    X1:=succ(X1);','    X2:=pred(X2)','  end','end']),
 p1:L(['begin','  X1:=0;','  while X1≠X2 do','    X1:=succ(X1)','end']),
 p2:L(['begin','  X2:=X1;','  while X2≠X4 do','  begin','    X3:=succ(X3);','    X2:=pred(X2);','    while X3≠X2 do','      X3:=succ(X3)','  end','end']),
 mul:L(['begin','  X3:=0;','  X4:=0;','  while X3≠X2 do','  begin','    X4:=X4+X1;','    X3:=succ(X3)','  end;','  X1:=X4','end'])
};

/* ---------- banks ---------- */
B.c_sem=[
 {p:PR.sub,a:[2,7,1]},{p:PR.sub,a:[4]},{p:PR.sub,a:[3,9,1,1,1]},
 {p:PR.half,a:[3,2,1]},{p:PR.half,a:[7]},{p:PR.half,a:[8,3,4]},
 {p:PR.up,a:[2,5]},{p:PR.up,a:[5,2]},{p:PR.sq,a:[6]},{p:PR.rep,a:[5]},{p:PR.rep,a:[0]},
 {p:PR.max,a:[3,8]},{p:PR.max,a:[9,4]},{p:PR.mt,a:[1,5,2]},{p:PR.mt,a:[1,5,0]}];
B.c_trace=[{p:PR.p1,a:[4,2]},{p:PR.p2,a:[3,4,0,2]},{p:PR.sub,a:[2,5,0]},{p:PR.half,a:[3,0,0,0,0]},{p:PR.half,a:[4,0,0,0,0]},{p:PR.mul,a:[3,4,0,0]}];
B.c_et=['Z≥Y ∨ Z>X','X=Y','(X<Y) ∨ (Y≥Z)','X≠Y ∧ Y<Z','¬(X<Y)','X≤Y ∧ Y≤Z','X=Y ∨ X=Z','¬(X=Y) ∧ ¬(Y=Z)'];
const A1=['begin','  Z:=X;','  U:=0;','  while U≠Y do','  begin','    Z:=succ(Z);','    U:=succ(U)','  end','end'];
B.c_wpd=[
 {t:'Z := X',in:['X'],f:x=>x,allow:[],ins:[[0],[3],[7]],ref:L(['begin','  Z:=succ(X);','  Z:=pred(Z)','end']),note:'Only basic statements (succ, pred, 0, while X≠Y).'},
 {t:'Z := X + Y',in:['X','Y'],f:(x,y)=>x+y,allow:['asg'],ins:[[0,0],[3,4],[5,0],[0,6],[7,2]],ref:L(A1)},
 {t:'Z := X ∸ Y (bounded difference)',in:['X','Y'],f:(x,y)=>Math.max(0,x-y),allow:['asg'],ins:[[0,0],[5,2],[2,5],[4,4],[0,3]],ref:L(A1).replace('succ(Z)','pred(Z)')},
 {t:'Z := X * Y',in:['X','Y'],f:(x,y)=>x*y,allow:['asg','add'],ins:[[0,0],[3,4],[5,0],[0,6],[7,2]],ref:L(['begin','  Z:=0;','  U:=0;','  while U≠Y do','  begin','    Z:=Z+X;','    U:=succ(U)','  end','end'])},
 {t:'Z := X div Y (assume Y > 0)',in:['X','Y'],f:(x,y)=>Math.floor(x/y),allow:['asg','sub'],ins:[[0,3],[7,2],[9,3],[8,5],[4,7]],ref:L(['begin','  W:=succ(X);','  Z:=0;','  U:=0;','  while W≠U do','  begin','    Z:=succ(Z);','    W:=W∸Y','  end;','  Z:=pred(Z)','end'])},
 {t:'Z := X mod Y (assume Y > 0)',in:['X','Y'],f:(x,y)=>x%y,allow:['asg','sub'],ins:[[0,3],[7,2],[9,3],[8,5],[4,7]],ref:L(['begin','  W:=succ(X);','  Z:=0;','  U:=0;','  while W≠U do','  begin','    Z:=W;','    W:=W∸Y','  end;','  Z:=pred(Z)','end']),note:'Z must keep the value W had before the last subtraction.'},
 {t:'Z := max(X, Y)',in:['X','Y'],f:(x,y)=>Math.max(x,y),allow:null,ins:[[0,0],[3,4],[5,2],[6,6],[0,3]],ref:L(['begin','  if X<Y then Z:=Y else Z:=X','end'])},
 {t:'Z := 1 if X = Y, otherwise Z := 0',in:['X','Y'],f:(x,y)=>x==y?1:0,allow:null,ins:[[0,0],[3,4],[5,2],[6,6],[0,3]],ref:L(['begin','  if X=Y then Z:=1 else Z:=0','end'])},
 {t:'Z := X!  (factorial)',in:['X'],f:x=>[1,1,2,6,24,120,720][x],allow:null,ins:[[0],[1],[3],[4],[5]],ref:L(['begin','  Z:=1;','  U:=0;','  while U≠X do','  begin','    U:=succ(U);','    Z:=Z*U','  end','end'])},
 {t:'Z := 2^X',in:['X'],f:x=>2**x,allow:null,ins:[[0],[1],[3],[5]],ref:L(['begin','  Z:=1;','  U:=0;','  while U≠X do','  begin','    Z:=Z+Z;','    U:=succ(U)','  end','end'])}];
const TM_ADD=L(['(q0, 1, 0, R, q1)','(q1, 1, 1, R, q1)','(q1, 0, 0, R, q2)','(q2, 1, 0, N/H, q2)']);
const TM_DBL=L(['(q0, 1, 0, R, q1)','(q1, 1, 0, R, q2)','(q2, 1, 1, R, q2)','(q2, 0, 0, R, q3)','(q3, 0, 1, L, q4)','(q4, 0, 0, L, q5)','(q3, 1, 1, R, q3)','(q4, 1, 1, L, q4)','(q5, 1, 1, L, q5)','(q5, 0, 1, R, q1)','(q1, 0, 0, H, qf)']);
const TM_ERASE='(q0, 1, 0, R, q0)',TM_SUCC='(q0, 1, 1, H, qf)';
const TM_LOOP=L(['(q0, 1, 1, R, q0)','(q0, 0, 0, L, q1)','(q1, 1, 1, R, q0)']);
const TM_NF=L(['(q0, 1, 1, R, q1)','(q1, 1, 1, N, q2)']);
const TM_FST=L(['(q0, 1, 0, R, q1)','(q1, 1, 1, R, q1)','(q1, 0, 0, R, q2)','(q2, 1, 0, R, q2)']);
B.c_tmq=[{tm:TM_ADD,fin:['q2'],a:[2,1],n:2},{tm:TM_ADD,fin:['q2'],a:[3,0],n:2},{tm:TM_DBL,fin:['qf'],a:[3],n:1},{tm:TM_DBL,fin:['qf'],a:[0],n:1},{tm:TM_ERASE,fin:['q0'],a:[4],n:1},{tm:TM_SUCC,fin:['qf'],a:[5],n:1},{tm:TM_LOOP,fin:['q1'],a:[2],n:1},{tm:TM_NF,fin:['q1'],a:[1],n:1},{tm:TM_FST,fin:['q2'],a:[3,2],n:2}];
B.c_tmd=[
 {t:'f(x) = x + 1',ins:[[0],[1],[3]],f:x=>x+1,ref:L([TM_SUCC,'final: qf']),hint:'The input already has x+1 ones. Halt in a final state without touching the tape.'},
 {t:'f(x, y) = x + y',ins:[[0,0],[2,1],[3,4],[0,5],[4,0]],f:(x,y)=>x+y,ref:L([TM_ADD,'final: q2']),hint:'The tape has x+y+2 ones: delete one 1 from each block.'},
 {t:'f(x) = 0',ins:[[0],[1],[4]],f:()=>0,ref:L([TM_ERASE,'final: q0']),hint:'Erase every 1. When the head reaches a blank there is no transition and the machine halts.'},
 {t:'f(x, y) = x',ins:[[0,0],[2,1],[3,4],[0,5],[4,0]],f:x=>x,ref:L([TM_FST,'final: q2']),hint:'Remove one 1 from the first block (x+1 → x) and every 1 of the second block.'},
 {t:'f(x) = 2x',ins:[[0],[1],[2],[3]],f:x=>2*x,ref:L([TM_DBL,'final: qf']),hint:'Mark a 1 (turn it into 0), copy it to the right, restore the mark, repeat. Use 0 as a separator.'}];
B.c_smn=[
 {p:PR.sub,m:1,C:[3],x:[10]},{p:PR.sub,m:1,C:[8],x:[2]},{p:PR.mul,m:1,C:[5],x:[4]},{p:PR.mul,m:1,C:[0],x:[9]},{p:PR.half,m:2,C:[4,2],x:[1]}];
B.c_con=[
 {q:'What is <code>pred(0)</code> in a while program?',o:['It is undefined','0','−1','The program loops forever'],a:1,e:'The domain is ℕ, so pred(0)=0. This is why X∸Y is a bounded difference.'},
 {q:'Which is the <i>only</i> test allowed in a while statement?',o:['X < Y','X = Y','X ≠ Y','X ≥ Y'],a:2,e:'Everything else (X<Y, ∧, ∨, ¬) is a macro-test, rewritten through an arithmetic expression E_T.'},
 {q:'For a macro-test T the equivalent expression satisfies:',o:['E_T > 0 if T is true, E_T = 0 otherwise','E_T = 1 if T is true, 0 otherwise','E_T = 0 if T is true, E_T > 0 otherwise','E_T is the truth value of T as a boolean'],a:0,e:'T is true ⇔ E_T > 0. Base: E_(X<Y) = Y∸X; E_(T1∧T2)=E_T1*E_T2; E_(T1∨T2)=E_T1+E_T2; E_(¬T)=1∸E_T.'},
 {q:'A 2-variable while program is used with the semantic function of arity 5. What is the initial state vector?',o:['(a1, a2, 0, 0, 0)','(a1, a2, a3, a4, a5)','(a1, a2)','The result is always ⊥'],a:2,e:'If k < j only the first k components fit: â0 = (a1,…,ak). If k ≥ j the rest of the variables are set to 0.'},
 {q:'Where does a while program leave its result?',o:['In the last variable','In X1','In the variable named Z','In every variable'],a:1,e:'The output is the final value of X1 when the program halts. Otherwise φ is undefined (⊥).'},
 {q:'You embed a k-variable program Pg inside another program. Where can you safely save values you will need later?',o:['X1, X2, …','Variables from X(k+1) on','Any variable, Pg restores them','Nowhere, composition is impossible'],a:1,e:'Pg may overwrite X1…Xk. Save needed values in X(k+1)… and set X(j+1)…Xk to 0 before running Pg.'},
 {q:'How is the number n written on the tape of a Turing machine?',o:['As n ones','As n+1 consecutive ones','In binary','As n zeros between ones'],a:1,e:'Unary with n+1 ones, so that 0 is a block of one 1. A vector is separated by single 0s: 1…1 0 1…1 0 …'},
 {q:'A Turing machine halts in a state that is NOT final. The result is:',o:['The number of 1s on the tape','0','Undefined (⊥)','Whatever is under the head'],a:2,e:'Final state: result = number of 1s (consecutive or not). Halting in a non-final state, or not halting, gives ⊥.'},
 {q:'In the TM model of the course, where does the head start?',o:['On the first non-blank symbol (left end of the input)','On the rightmost 1','On the first blank to the left','At the middle of the input'],a:0,e:'The input is placed on the tape, padded with blanks, and the head is over the first 1 with the machine in its initial state.'},
 {q:'Which pairs of models are equivalent in computing power?',o:['While programs and Turing machines','Only multi-tape and one-tape Turing machines','Only models with the same cost','None, each model computes different functions'],a:0,e:'Every Turing-computable function is while-computable and conversely (each simulates the other). All the usual models are equivalent.'},
 {q:'Why is the Church–Turing statement a thesis and not a theorem?',o:['Nobody has found a proof yet but it is surely provable','"Effectively calculable" is not a precise mathematical notion','It was proved false for some models','It only holds for Turing machines'],a:1,e:'"Algorithm / effective procedure" has no formal definition in a theory from which a proof could be extracted.'},
 {q:'The code of a program is built by:',o:['Concatenating the 8-bit ASCII codes of its symbols','Counting its statements','Hashing its variables','Using its semantic function'],a:0,e:'cod(P) is the natural number whose binary expansion is the concatenation of the 8-bit codes of all characters of P (newlines and spaces included).'},
 {q:'Which statement about <code>decod(cod(P))</code> and <code>cod(decod(n))</code> is right?',o:['Both are always equal to their argument','decod(cod(P)) = P always; cod(decod(n)) = n only if n codes a program','cod(decod(n)) = n always; decod(cod(P)) = P only sometimes','Neither can be computed'],a:1,e:'cod is one-to-one but not onto: numbers like 0 code no program, and decod returns the fixed program Q for them, so cod(decod(0)) = cod(Q) ≠ 0.'},
 {q:'How many different while programs compute a given computable function?',o:['Exactly one','Exactly two','Infinitely many','As many as variables it uses'],a:2,e:'Adding a harmless instruction such as X2 := 0 at the end gives a new program with the same semantic function, infinitely often.'},
 {q:'The universal function Φ(e, x1,…,xj) = φ_e^(j)(x1,…,xj) is:',o:['Not computable, it would solve the halting problem','Computable: decode e, then simulate the program on the inputs','Computable only for j = 1','Total'],a:1,e:'Universality Theorem: obtain P = decod(e), simulate P on the inputs, return the result. It is what a compiler or interpreter does. It is not total: φ_e may be undefined.'},
 {q:'What happens when the macro Z := U(X, Y) is executed and φ_X(Y) is undefined?',o:['Z gets 0','The program stops with an error','The program is stuck forever in the macro','Z gets X'],a:2,e:'The macro simulates decod(X) on input Y; if that computation never halts, neither does the macro.'},
 {q:'The Parametrization (s-m-n) Theorem says that s_n^m is:',o:['A total computable function giving the code of the program with m inputs fixed','A partial function, undefined if φ_e is undefined','Not computable in general','The identity function'],a:0,e:'There is a total computable s_n^m with φ_{s(e,y1..ym)}^(n)(x1..xn) = φ_e^(m+n)(y1..ym, x1..xn). It only manipulates the text (code) of the program.'},
 {q:'To fix m inputs of P and keep n free, the new program first:',o:['Copies X1…Xn to X(m+1)…X(m+n), then assigns the constants to X1…Xm, then runs P','Runs P and then assigns the constants','Replaces every variable of P by a constant','Deletes the first m statements of P'],a:0,e:'Copy the free inputs upwards (starting with Xn so none is overwritten), put C1…Cm in X1…Xm, then run P.'}];

/* ---------- random generators ---------- */
const rvar=()=>pk(['X','Y','Z']),rat=()=>{const a=rvar();return Math.random()<.25?pk(['2','3',rvar()]):a};
function rtest(d){if(d<=0||Math.random()<.35){const r=pk(['<','>','≤','≥','=','≠']);let a=rvar(),b=Math.random()<.3?String(rnd(4)):rvar();if(a==b)b='1';return a+r+b}
 if(Math.random()<.2)return '¬('+rtest(d-1)+')';return '('+rtest(d-1)+') '+pk(['∧','∨'])+' ('+rtest(d-1)+')'}
function cgen(c){
 switch(c){
  case'c_sem':{const it=pk(B.c_sem);return{c,d:{p:it.p,a:it.a.map(()=>rnd(8))}}}
  case'c_trace':{for(let t=0;t<30;t++){const it=pk(B.c_trace),a=it.a.map((_,i)=>i<2?rnd(6):rnd(3)),init={};a.forEach((v,i)=>init['X'+(i+1)]=BigInt(v));if(CP.run(CP.parse(it.p),init,{max:20000}).ok)return{c,d:{p:it.p,a}}}return{c,d:pk(B.c_trace)}}
  case'c_et':return{c,d:rtest(2)};
  case'c_tmq':{const it=pk(B.c_tmq);return{c,d:{...it,a:it.a.map(()=>rnd(5))}}}
  case'c_smn':{const it=pk(B.c_smn);return{c,d:{...it,C:it.C.map(()=>rnd(6)),x:it.x.map(()=>rnd(8))}}}
 }
 return{c,d:pk(B[c])}}

/* ---------- rendering helpers ---------- */
const inp=ph=>`<input id=ans placeholder="${ph}" autocomplete=off onkeydown="if(event.key=='Enter'){event.preventDefault();jd(this.value)}"><div class=row><button class=on onclick="jd($('#ans').value)">Check</button></div>`;
const ta=(ph,r)=>`<textarea id=ans class=code rows=${r} spellcheck=false placeholder="${ph}"></textarea><div class=row><button class=on onclick="jd($('#ans').value)">Check</button></div>`;
const cardC=(q,a)=>`<div class=card>${q}${a}<div id=fb></div></div>`;
function trT(r,max){max=max||70;let h='<div class=sc><table><tr><th>#<th>instruction'+r.vk.map(v=>'<th>'+esc(v)).join('')+'</tr><tr><td>0<td class=mu>initial'+r.v0.map(x=>'<td>'+x).join('')+'</tr>';
 const T=r.tr||[];const rows=T.length>max?[...T.slice(0,max-12).map((e,i)=>[i+1,e]),null,...T.slice(-10).map((e,i)=>[T.length-10+i+1,e])]:T.map((e,i)=>[i+1,e]);
 rows.forEach(x=>{if(!x){h+='<tr><td colspan='+(r.vk.length+2)+' class=mu>…';return}const[i,e]=x;h+='<tr'+(/\[[TF]\]$/.test(e.a)?' class=h':'')+'><td>'+i+'<td style="text-align:left">'+esc(e.a)+e.v.map(v=>'<td>'+v).join('')+'</tr>'});
 return h+'</table></div>'+(r.steps>T.length&&T.length>=400?'<span class=mu>Trace limited to the first 400 instructions ('+r.steps+' statements executed).</span>':'')}
function tmSplit(t){let fin=null,init=null;const body=[];
 String(t).split(/\n/).forEach(l=>{const s=l.trim();let m;
  if(m=s.match(/^(?:finals?|F)\s*[:=]\s*\{?\s*([\w\s,]*?)\s*\}?$/i)){fin=new Set(m[1].split(/[\s,]+/).filter(Boolean));return}
  if(m=s.match(/^(?:init|initial|i)\s*[:=]\s*(\w+)$/i)){init=m[1];return}
  body.push(l)});
 return{body:body.join('\n'),fin,init}}
const inferFin=M=>new Set(M.states.filter(q=>!Object.keys(M.R).some(k=>k.startsWith(q+'|'))));
function tmGo(src,args,fin0,max){const sp=tmSplit(src);const M=CP.parseTM(sp.body);const fin=sp.fin||fin0||inferFin(M);return{M,fin,r:CP.runTM(M,fin,args,{init:sp.init,max:max||5000})}}
const idsHTML=ids=>'<pre class=f>'+ids.slice(0,60).map(esc).join('\n→ ')+(ids.length>60?'\n→ … ('+ids.length+' descriptions)':'')+'</pre>';
const tmOut=r=>r.final?'φ = <b>'+r.result+'</b> (halts in final state '+esc(r.q)+')':r.halted?'halts in the <b>non-final</b> state '+esc(r.q)+': φ = ⊥':'does not halt (5000 steps): φ = ⊥';
const grid=n=>{const V=[0,1,2,3,5];let o=[[]];for(let i=0;i<n;i++)o=o.flatMap(a=>V.map(v=>[...a,v]));return o};

/* ---------- question HTML ---------- */
function cEx(e){const d=e.d;let P,k;
 switch(e.c){
 case'c_sem':P=CP.parse(d.p);k=P.vk.length;
  return cardC('<span class=mu>While programs · semantic function</span><br>Program <b>P</b> ('+k+' variable'+(k>1?'s':'')+'):'+pre(d.p)+'Compute <b>φ<sub>P</sub><sup>('+d.a.length+')</sup>('+d.a.join(', ')+')</b>. If P never halts answer <code>⊥</code> (write <code>undef</code>).',inp('A natural number or ⊥'));
 case'c_trace':P=CP.parse(d.p);
  return cardC('<span class=mu>While programs · computation sequence</span><br>Run P from the initial state vector <b>â₀ = '+fmtV(d.a)+'</b>:'+pre(d.p)+'Give the <b>final state vector</b> (one value per variable X1…X'+P.vk.length+', comma separated).',inp('e.g. 3, 0, 1'));
 case'c_et':{const T=CP.parseTest(d);return cardC('<span class=mu>Macro-tests</span><br>Write an arithmetic expression <b>E<sub>T</sub></b> using <code>+</code>, <code>∸</code> (or <code>-</code>), <code>*</code>, constants and variables such that <b>E<sub>T</sub> &gt; 0 when T is true and E<sub>T</sub> = 0 when it is false</b>:<div class=f>T = '+esc(CP.ts(T,1))+'</div>',inp('e.g. (1∸(Y∸Z)) + (Z∸X)'))}
 case'c_wpd':return cardC('<span class=mu>Design a while program</span><br>Write a program that leaves in <b>Z</b> the value of <div class=f>'+esc(d.t)+'</div>The inputs are in '+d.in.map(v=>'<b>'+v+'</b>').join(', ')+' and every other variable starts at 0. '+(d.allow===null?'<b>All macros</b> (arithmetic, if-then-else, repeat…) are allowed.':d.allow.length?'Allowed macros: <b>'+d.allow.map(x=>NM[x]).join(', ')+'</b> and the basic statements.':'<b>Basic statements only</b>.')+(d.note?' <span class=mu>'+d.note+'</span>':''),ta('begin\n  …\nend',8));
 case'c_tmq':return cardC('<span class=mu>Turing machines · semantic function</span><br>M has transitions <code>(state, read, write, move, new state)</code> and final states <b>{'+d.fin.join(', ')+'}</b>; the initial state is the first one:'+pre(d.tm)+'Compute <b>φ<sub>M</sub><sup>('+d.a.length+')</sup>('+d.a.join(', ')+')</b>. The input is written in unary with the head on the first 1. If M does not halt in a final state answer <code>⊥</code>.',inp('A natural number or ⊥'));
 case'c_tmd':return cardC('<span class=mu>Design a Turing machine</span><br>Build a machine with <div class=f>φ<sub>M</sub> '+esc(d.t.replace(/^f/,''))+'  ≡  '+esc(d.t)+'</div>One transition per line: <code>(q0, 1, 0, R, q1)</code> or <code>T(q0,1)=(0,R,q1)</code>. Moves: L, R, N (stay) and H (halt). The first transition gives the initial state. End with a line <code>final: q2</code> (or leave it out: then every state without outgoing transitions is final). Blank = 0.',ta('(q0, 1, 0, R, q1)\n…\nfinal: q1',9)+'<div class=row><button onclick="$(\'#fb\').innerHTML=\'<p class=mu>Hint: '+esc(d.hint).replace(/'/g,'&#39;')+'</p>\'">Hint</button></div>');
 case'c_smn':{const n=d.x.length,m=d.m;const Q=CP.smn(d.p,m,n,d.C);return cardC('<span class=mu>Parametrization (s-m-n)</span><br>Program <b>P</b> computes a function φ<sub>P</sub><sup>('+(m+n)+')</sup> of '+(m+n)+' arguments:'+pre(d.p)+'Fixing '+m+' parameter'+(m>1?'s':'')+' to <b>C = '+fmtV(d.C)+'</b> and keeping '+n+' free, the s-m-n construction gives the program <b>Q</b>:'+pre(Q)+'Compute <b>φ<sub>Q</sub><sup>('+n+')</sup>('+d.x.join(', ')+')</b>.',inp('A natural number or ⊥'))}
 case'c_con':return cardC('<span class=mu>Concepts</span><br>'+d.q,'<div class=row style="flex-direction:column;align-items:stretch">'+d.o.map((o,i)=>`<button style="text-align:left" onclick="jd('${i}')">${esc(o)}</button>`).join('')+'</div>');
 }}

/* ---------- judging ---------- */
function cJudge(e,a){const d=e.d;let P,r,ok,h,exp;
 switch(e.c){
 case'c_sem':P=CP.parse(d.p);r=CP.sem(P,d.a,{max:100000,trace:true});exp=r.ok?(r.st.X1||0n):null;
  if(bot(a))ok=exp===null;else{const n=num(a);if(n===null)throw Error('Enter a natural number, or ⊥ if the program never halts');ok=exp!==null&&n===exp}
  const k=P.vk.length,j=d.a.length;
  h='φ = <b>'+(exp===null?'⊥ (P does not halt)':exp)+'</b>. '+(k>=j?'k = '+k+' ≥ j = '+j+': the initial vector is â₀ = '+fmtV([...d.a,...Array(k-j).fill(0)])+'.':'k = '+k+' < j = '+j+': only the first k inputs fit, â₀ = '+fmtV(d.a.slice(0,k))+'.')+' The result is the final value of X1.'+trT(r);return{ok,h};
 case'c_trace':{P=CP.parse(d.p);const init={};d.a.forEach((v,i)=>init['X'+(i+1)]=BigInt(v));r=CP.run(P,init,{max:100000,trace:true});
  if(!r.ok)return{ok:false,h:'This program does not halt from that vector.'};const fin=r.vk.map(v=>r.st[v]||0n);const got=String(a).replace(/[()\[\]]/g,'').split(/[,\s]+/).filter(Boolean).map(num);
  if(got.some(x=>x===null))throw Error('Write the vector as natural numbers separated by commas');
  ok=got.length==fin.length&&got.every((x,i)=>x===fin[i]);
  return{ok,h:'Final state vector: <b>'+fmtV(fin)+'</b> after '+r.steps+' statements.'+trT(r)}}
 case'c_et':{const T=CP.parseTest(d),vs=[...CP.tvars(T)];const E=CP.parseExpr(a);
  const used=(String(a).match(/[A-Za-z_]\w*/g)||[]).filter(x=>!/^(succ|pred)$/i.test(x)&&!vs.includes(x));if(used.length)throw Error('Unknown variable '+used[0]+'. T uses '+vs.join(', '));
  let bad=null;for(const v of grid(vs.length)){const m={};vs.forEach((x,i)=>m[x]=BigInt(v[i]));const g=n=>m[n]||0n;if((CP.evalE(E,g)>0n)!==CP.evalT(T,g)){bad=m;break}}
  ok=!bad;const ref=CP.etExpr(T);
  h=(bad?'Fails at '+Object.entries(bad).map(([k,v])=>k+'='+v).join(', ')+': T is '+(CP.evalT(T,n=>bad[n]||0n)?'true':'false')+' but E = '+CP.evalE(E,n=>bad[n]||0n)+'.<br>':'Your expression agrees with T on every tested state.<br>')+'Reference built with the inductive rules: <div class=f>E<sub>T</sub> = '+esc(ref)+'</div><span class=mu>X&lt;Y ↦ Y∸X · T1∧T2 ↦ E1*E2 · T1∨T2 ↦ E1+E2 · ¬T ↦ 1∸E. Then X>Y = Y<X, X≥Y = ¬(X<Y), X≤Y = ¬(X>Y), X=Y = (X≤Y)∧(X≥Y), X≠Y = ¬(X=Y).</span>';
  return{ok,h}}
 case'c_wpd':{P=CP.parse(a);const F=CP.feats(P);
  if(d.allow){const bad=[...F].filter(x=>!d.allow.includes(x));if(bad.length)return{ok:false,h:'Not allowed in this exercise: <b>'+bad.map(x=>NM[x]).join(', ')+'</b>. Rewrite it with '+(d.allow.length?'only '+d.allow.map(x=>NM[x]).join(', ')+' and ':'')+'the basic statements.<br>One possible solution:'+pre(d.ref)}}
  let rows='',ok2=true;
  for(const t of d.ins){const init={};d.in.forEach((v,i)=>init[v]=BigInt(t[i]));const r2=CP.run(P,init,{max:200000});const want=BigInt(d.f(...t)),got=r2.ok?(r2.st.Z||0n):null,pass=got===want;if(!pass)ok2=false;
   rows+='<tr class='+(pass?'':'h')+'><td>'+t.join(', ')+'<td>'+want+'<td>'+(got===null?'does not halt':got)+'<td>'+(pass?'✓':'✗')+'</tr>'}
  return{ok:ok2,h:'<div class=sc><table><tr><th>'+d.in.join(', ')+'<th>expected Z<th>your Z<th></tr>'+rows+'</table></div>'+(ok2?'':'<br>')+'One possible solution:'+pre(d.ref)}}
 case'c_tmq':{const g=tmGo(d.tm,d.a,new Set(d.fin));const r2=g.r;
  ok=bot(a)?!r2.final:(num(a)!==null&&r2.final&&BigInt(r2.result)===num(a));if(!bot(a)&&num(a)===null)throw Error('Enter a natural number, or ⊥');
  return{ok,h:'The machine '+tmOut(r2)+'.<br>Computation sequence:'+idsHTML(r2.ids)}}
 case'c_tmd':{const g=tmGo(a,[0],null);const M=g.M,fin=g.fin;let rows='',ok2=true;
  for(const t of d.ins){const r2=tmGo(a,t,null,20000).r,want=d.f(...t),pass=r2.final&&r2.result===want;if(!pass)ok2=false;
   rows+='<tr class='+(pass?'':'h')+'><td>'+t.join(', ')+'<td>'+want+'<td>'+(r2.final?r2.result:r2.halted?'non-final state '+esc(r2.q):'does not halt')+'<td>'+(pass?'✓':'✗')+'</tr>'}
  return{ok:ok2,h:'Final states used: {'+[...fin].join(', ')+'}.<div class=sc><table><tr><th>input<th>expected<th>your result<th></tr>'+rows+'</table></div><br>Reference machine:'+pre(d.ref)}}
 case'c_smn':{const n=d.x.length,Q=CP.smn(d.p,d.m,n,d.C),Pp=CP.parse(d.p),Qp=CP.parse(Q);
  const vq=CP.out(Qp,d.x,{max:100000}),vp=CP.out(Pp,[...d.C,...d.x],{max:100000});
  if(bot(a))ok=vq===null;else{const x=num(a);if(x===null)throw Error('Enter a natural number, or ⊥');ok=vq!==null&&x===vq}
  return{ok,h:'φ<sub>Q</sub><sup>('+n+')</sup>('+d.x.join(', ')+') = <b>'+(vq===null?'⊥':vq)+'</b> = φ<sub>P</sub><sup>('+(d.m+n)+')</sup>('+[...d.C,...d.x].join(', ')+') = '+(vp===null?'⊥':vp)+'. Q first moves the free inputs up, then writes the constants in X1…X'+d.m+', then runs P. Its code can be computed from cod(P) and C, which is the content of the theorem.'}}
 case'c_con':return{ok:Number(a)==d.a,h:'<b>'+esc(d.o[d.a])+'</b>. '+d.e}
 }}

window.CPQ={cEx,cJudge,cgen,pre,esc,num,trT,tmSplit,tmGo,idsHTML,tmOut,inferFin,PR,TM_ADD,TM_DBL,TM_ERASE,TM_SUCC,TM_LOOP,TM_FST,TM_NF,NM,fmtV};
})();

