
(function(){
const isUp=s=>/^[A-Z]/.test(s);
const NORM=s=>s.replace(/[\[{]/g,'(').replace(/[\]}]/g,')').replace(/<->/g,'↔').replace(/->/g,'→').replace(/~/g,'¬');
const TOK=/[↔→∧∨¬∀∃(),]|[A-Za-z_][A-Za-z_0-9]*|\S/g;
const vname=n=>n[0].toUpperCase()+n.slice(1);
function parser(src){
 const t=NORM(src).match(TOK)||[];let i=0;const bound=[];
 const pk=()=>t[i],nx=()=>{if(i>=t.length)throw Error('The expression ends unexpectedly');return t[i++]};
 function term(){const x=nx();if(!/^[A-Za-z_]/.test(x))throw Error('Unexpected "'+x+'" in a term');
  if(pk()=='('){nx();const a=[term()];while(pk()==','){nx();a.push(term())}if(nx()!=')')throw Error('Missing ")"');return{f:x,a}}
  if(bound.includes(x))return{v:vname(x)};
  return isUp(x)?{v:x}:{f:x,a:[]}}
 function atom(){const x=nx();if(!/^[A-Za-z_]/.test(x))throw Error('Unexpected "'+x+'"');
  if(pk()=='('){nx();const a=[term()];while(pk()==','){nx();a.push(term())}if(nx()!=')')throw Error('Missing ")"');return{k:'P',n:x,a}}
  return{k:'P',n:x,a:[]}}
 function iff(){let a=imp();while(pk()=='↔'){nx();a={k:'e',l:a,r:imp()}}return a}
 function imp(){let a=orr();if(pk()=='→'){nx();return{k:'i',l:a,r:imp()}}return a}
 function orr(){let a=andd();while(pk()=='∨'){nx();a={k:'o',l:a,r:andd()}}return a}
 function andd(){let a=un();while(pk()=='∧'){nx();a={k:'a',l:a,r:un()}}return a}
 function un(){const x=pk();
  if(x=='¬'){nx();return{k:'n',a:un()}}
  if(x=='∀'||x=='∃'){nx();let v=nx();if(v.length>1&&/^[A-Za-z][A-Za-z]/.test(v)){t[--i]=v.slice(1);v=v[0]}
   if(!/^[A-Za-z_]/.test(v))throw Error('A variable must follow '+x);bound.push(v);const b=un();bound.pop();return{k:x=='∀'?'A':'E',v:vname(v),a:b}}
  if(x=='('){nx();const a=iff();if(nx()!=')')throw Error('Missing ")"');return a}
  return atom()}
 return{term,iff,end:()=>{if(i<t.length)throw Error('Unexpected "'+t[i]+'"')}}}
function parseFO(s){const p=parser(s),f=p.iff();p.end();return f}
function parseTerm(s){const p=parser(s),f=p.term();p.end();return f}
function splitTop(s){const o=[];let d=0,c='';for(const ch of s){if(ch=='(')d++;if(ch==')')d--;if((ch==','&&!d)||ch=='\n'||(ch==';'&&!d)){if(c.trim())o.push(c.trim());c=''}else c+=ch}if(c.trim())o.push(c.trim());return o}
// ---------- printing
const tstr=t=>t.v?t.v:t.f+(t.a.length?'('+t.a.map(tstr).join(',')+')':'');
const astr=f=>f.n+(f.a.length?'('+f.a.map(tstr).join(',')+')':'');
const OP={a:'∧',o:'∨',i:'→',e:'↔'};
function fs(f,top=true){switch(f.k){case'P':return astr(f);case'n':return'¬'+fs(f.a,false);case'A':case'E':return(f.k=='A'?'∀':'∃')+f.v+' '+fs(f.a,false)}
 const s=fs(f.l,false)+' '+OP[f.k]+' '+fs(f.r,false);return top?s:'('+s+')'}
const J=x=>JSON.stringify(x);
const fmap=(f,g)=>{switch(f.k){case'P':return f;case'n':return{k:'n',a:g(f.a)};case'A':case'E':return{k:f.k,v:f.v,a:g(f.a)}}return{k:f.k,l:g(f.l),r:g(f.r)}};
const bu=(f,g)=>{const x=fmap(f,y=>bu(y,g));return g(x)||x};
const td=(f,g,u)=>{const r=g(f);if(r){u.add(r[1]);return r[0]}return fmap(f,y=>td(y,g,u))};
const varsT=(t,s=new Set)=>{if(t.v)s.add(t.v);else t.a.forEach(x=>varsT(x,s));return s};
function names(f,s=new Set){const tn=t=>{if(t.f){s.add(t.f);t.a.forEach(tn)}};switch(f.k){case'P':s.add(f.n);f.a.forEach(tn);break;case'n':case'A':case'E':names(f.a,s);break;default:names(f.l,s);names(f.r,s)}return s}
function renameApart(f){
 const cnt={},free=new Set;
 (function w(g,b){switch(g.k){case'P':g.a.forEach(t=>varsT(t).forEach(v=>{if(!b.includes(v))free.add(v)}));break;case'n':w(g.a,b);break;case'A':case'E':cnt[g.v]=(cnt[g.v]||0)+1;w(g.a,[...b,g.v]);break;default:w(g.l,b);w(g.r,b)}})(f,[]);
 const need=new Set(Object.keys(cnt).filter(v=>cnt[v]>1||free.has(v)));if(!need.size)return f;
 const k={},used=new Set([...Object.keys(cnt),...free]);
 const fresh=v=>{let n;do{n=v+(k[v]=(k[v]||0)+1)}while(used.has(n));used.add(n);return n};
 const rt=(t,env)=>t.v?(env[t.v]?{v:env[t.v]}:t):{f:t.f,a:t.a.map(x=>rt(x,env))};
 const r=(g,env)=>{switch(g.k){case'P':return{...g,a:g.a.map(t=>rt(t,env))};case'n':return{k:'n',a:r(g.a,env)};case'A':case'E':{const nv=need.has(g.v)?fresh(g.v):g.v;return{k:g.k,v:nv,a:r(g.a,{...env,[g.v]:nv})}}}return{k:g.k,l:r(g.l,env),r:r(g.r,env)}};
 return r(f,{})}
function pull(f){switch(f.k){case'P':case'n':return{pre:[],m:f};case'A':case'E':{const r=pull(f.a);return{pre:[[f.k,f.v],...r.pre],m:r.m}}}
 const l=pull(f.l),r=pull(f.r);return{pre:[...l.pre,...r.pre],m:{k:f.k,l:l.m,r:r.m}}}
const substT=(t,v,s)=>t.v?(t.v==v?s:t):{f:t.f,a:t.a.map(x=>substT(x,v,s))};
const substF=(f,v,s)=>f.k=='P'?{...f,a:f.a.map(t=>substT(t,v,s))}:fmap(f,x=>substF(x,v,s));
const lit=f=>f.k=='n'?{s:0,a:f.a}:{s:1,a:f};
const lk=l=>(l.s?'':'¬')+astr(l.a);
const dd=c=>{const s=new Set;return c.filter(l=>{const k=lk(l);if(s.has(k))return 0;s.add(k);return 1})};
function clausesOf(f){if(f.k=='a')return[...clausesOf(f.l),...clausesOf(f.r)];if(f.k=='o'){const o=[];clausesOf(f.l).forEach(a=>clausesOf(f.r).forEach(b=>o.push(dd([...a,...b]))));return o}return[[lit(f)]]}
const cstr=c=>c.length?c.map(lk).join(' ∨ '):'□';
const csetStr=C=>C.length?'{ '+C.map(cstr).join(' ,  ')+' }':'{ }';
const taut=c=>c.some(l=>c.some(m=>m.s!=l.s&&astr(m.a)==astr(l.a)));
function clausify(f0,used){
 const S=[];let f=f0;S.push({t:'Start',f:fs(f)});
 let g=bu(f,x=>x.k=='e'?{k:'a',l:{k:'i',l:x.l,r:x.r},r:{k:'i',l:x.r,r:x.l}}:0);
 if(J(g)!=J(f)){f=g;S.push({t:'Remove ↔',r:'A↔B ≡ (A→B) ∧ (B→A)',f:fs(f)})}
 g=bu(f,x=>x.k=='i'?{k:'o',l:{k:'n',a:x.l},r:x.r}:0);
 if(J(g)!=J(f)){f=g;S.push({t:'Remove →',r:'A→B ≡ ¬A ∨ B',f:fs(f)})}
 const neg=x=>({k:'n',a:x});
 const dm=x=>x.k!='n'?0:x.a.k=='n'?[x.a.a,'¬¬A ≡ A']:x.a.k=='a'?[{k:'o',l:neg(x.a.l),r:neg(x.a.r)},'¬(A∧B) ≡ ¬A ∨ ¬B']:x.a.k=='o'?[{k:'a',l:neg(x.a.l),r:neg(x.a.r)},'¬(A∨B) ≡ ¬A ∧ ¬B']:x.a.k=='A'?[{k:'E',v:x.a.v,a:neg(x.a.a)},'¬∀X A ≡ ∃X ¬A']:x.a.k=='E'?[{k:'A',v:x.a.v,a:neg(x.a.a)},'¬∃X A ≡ ∀X ¬A']:0;
 for(let i=0;i<40;i++){const u=new Set;g=td(f,dm,u);if(J(g)==J(f))break;f=g;S.push({t:'Move ¬ inwards',r:[...u].join(' · '),f:fs(f)})}
 g=renameApart(f);if(J(g)!=J(f)){f=g;S.push({t:'Rename variables',r:'two quantifiers (or a quantifier and a free variable) share a name',f:fs(f)})}
 const pl=pull(f);let pre=pl.pre,m=pl.m;
 if(pre.length)S.push({t:'Move quantifiers to the left',r:'keeping their order',f:pre.map(([q,v])=>(q=='A'?'∀':'∃')+v).join(' ')+' [ '+fs(m)+' ]'});
 let U=[],out=[],sk=[],skn=[];const cons=['a','b','c','d','e'],fns=['f','g','h','k','m','n'];
 for(const [q,v] of pre){
  if(q=='A'){U.push(v);out.push(v);continue}
  let t;if(!U.length){const n=cons.find(c=>!used.has(c))||('a'+used.size);used.add(n);t={f:n,a:[]}}
  else{const n=fns.find(c=>!used.has(c))||('f'+used.size);used.add(n);t={f:n,a:U.map(x=>({v:x}))}}
  m=substF(m,v,t);sk.push(v+'/'+tstr(t));skn.push({n:t.f,ar:t.a.length})}
 if(sk.length)S.push({t:'Eliminate ∃ (Skolem)',r:'replace each ∃ variable: '+sk.join(', ')+' — equisatisfiable, not equivalent',f:out.map(v=>'∀'+v).join(' ')+(out.length?' ':'')+'[ '+fs(m)+' ]'});
 const dsr=x=>x.k!='o'?0:x.r.k=='a'?[{k:'a',l:{k:'o',l:x.l,r:x.r.l},r:{k:'o',l:x.l,r:x.r.r}},'A∨(B∧C) ≡ (A∨B) ∧ (A∨C)']:x.l.k=='a'?[{k:'a',l:{k:'o',l:x.l.l,r:x.r},r:{k:'o',l:x.l.r,r:x.r}},'(A∧B)∨C ≡ (A∨C) ∧ (B∨C)']:0;
 for(let i=0;i<40;i++){const u=new Set;g=td(m,dsr,u);if(J(g)==J(m))break;m=g;S.push({t:'Distribute ∨ over ∧',r:[...u].join(' · '),f:out.map(v=>'∀'+v).join(' ')+(out.length?' ':'')+'[ '+fs(m)+' ]'})}
 S.push({t:'Skolem normal form (SNF)',r:'universal prefix + kernel in CNF',f:out.map(v=>'∀'+v).join(' ')+(out.length?' ':'')+'[ '+fs(m)+' ]'});
 const raw=clausesOf(m);const seen=new Set;const C=raw.filter(c=>{if(taut(c))return 0;const k=c.map(lk).sort().join('|');if(seen.has(k))return 0;seen.add(k);return 1});
 S.push({t:'Clausal form',r:'drop the quantifiers (all universal) and write each clause separately'+(C.length<raw.length?'; tautologies and duplicates removed':''),f:csetStr(C)});
 return{steps:S,clauses:C,sk:skn}}

// ---------- check a user-written clause set
function splitBy(s,ch){const o=[];let d=0,c='';for(const x of s){if(x=='(')d++;if(x==')')d--;if(x==ch&&!d){o.push(c);c=''}else c+=x}o.push(c);return o.map(x=>x.trim()).filter(Boolean)}
function userClauses(str){
 let s=str.trim().replace(/^\{/,'').replace(/\}$/,'');if(!s)throw Error('Write at least one clause');
 return splitTop(s).map(cl=>splitBy(cl,'∨').map(x=>{const f=parseFO(x);
  if(f.k=='P')return{s:1,a:{f:f.n,a:f.a}};if(f.k=='n'&&f.a.k=='P')return{s:0,a:{f:f.a.n,a:f.a.a}};
  throw Error('Each literal must be an atom or a negated atom: "'+x+'"')}))}
function matchT(a,b,m,r){if(a.v){if(!b.v)return false;if(m[a.v]!==undefined)return m[a.v]==b.v;if(r[b.v]!==undefined)return false;m[a.v]=b.v;r[b.v]=a.v;return true}
 return !b.v&&a.f==b.f&&a.a.length==b.a.length&&a.a.every((x,i)=>matchT(x,b.a[i],m,r))}
function clauseEq(a,b){a=dd2(a);b=dd2(b);if(a.length!=b.length)return false;
 const go=(i,used,m,r)=>{if(i==a.length)return true;for(let j=0;j<b.length;j++){if(used[j]||a[i].s!=b[j].s)continue;const m2={...m},r2={...r};if(matchT(a[i].a,b[j].a,m2,r2)){used[j]=1;if(go(i+1,used,m2,r2))return true;used[j]=0}}return false};
 return go(0,[],{},{})}
function dedupEq(A){const o=[];A.forEach(c=>{if(!o.some(d=>clauseEq(c,d)))o.push(c)});return o}
function setEq(A,B){if(A.length!=B.length)return false;const u=new Array(B.length).fill(0);for(const a of A){const j=B.findIndex((b,k)=>!u[k]&&clauseEq(a,b));if(j<0)return false;u[j]=1}return true}
const renF=(t,mp)=>t.v?t:{f:mp[t.f]!==undefined?mp[t.f]:t.f,a:t.a.map(x=>renF(x,mp))};
function perms(a){if(a.length<2)return[a];const o=[];a.forEach((x,i)=>perms([...a.slice(0,i),...a.slice(i+1)]).forEach(p=>o.push([x,...p])));return o}
function checkClauses(str,f){
 const orig=names(f),R=clausify(f,new Set(orig)),ref0=toC(R.clauses),ref=dedupEq(ref0);
 let U=userClauses(str).filter(c=>!tautC(dd2(c)));
 U=dedupEq(U);
 const ar={};let bad=null;const tn=t=>{if(t.f){if(ar[t.f]!==undefined&&ar[t.f]!=t.a.length)bad=t.f;ar[t.f]=t.a.length;t.a.forEach(tn)}};U.forEach(c=>c.forEach(l=>l.a.a.forEach(tn)));
 if(bad)return{ok:0,why:'The symbol '+bad+' is used with different numbers of arguments.',R};
 const inRef=new Set();const wt=t=>{if(t.f){inRef.add(t.f);t.a.forEach(wt)}};ref.forEach(c=>c.forEach(l=>l.a.a.forEach(wt)));
 const us=Object.keys(ar).filter(n=>!orig.has(n)),sk=R.sk.filter(x=>inRef.has(x.n));
 if(us.length!=sk.length)return{ok:0,why:'Expected '+sk.length+' new Skolem symbol'+(sk.length==1?'':'s')+' (one per ∃ variable) but you introduced '+us.length+'.',R};
 const cands=perms(sk.map(x=>x));
 for(const p of cands){if(!p.every((x,i)=>x.ar==ar[us[i]]))continue;const mp={};us.forEach((n,i)=>mp[n]=p[i].n);
  const U3=U.map(c=>c.map(l=>({s:l.s,a:{f:l.a.f,a:l.a.a.map(t=>renF(t,mp))}})));if(setEq(U3,ref))return{ok:1,R}}
 const mism=U.length!=ref.length?'You wrote '+U.length+' clause'+(U.length==1?'':'s')+', expected '+ref.length+'.':sk.some((x,i)=>us.every(n=>ar[n]!=x.ar))?'The arguments of a Skolem function must be exactly the ∀ variables that precede its ∃.':'Same number of clauses, but they are not the same set (check signs, literals and the Skolem terms).';
 return{ok:0,why:mism,R}}
const stepsHTML=(S,open)=>'<details class=card'+(open?' open':'')+'><summary>Step by step</summary>'+S.map((s,i)=>'<div class=ln><b>'+i+'</b> <i class=mu>'+s.t+(s.r?' — '+s.r:'')+'</i><br><span class=f>'+s.f+'</span></div>').join('')+'</details>';
// ---------- unification
const subT=(t,th)=>t.v?(th[t.v]||t):{f:t.f,a:t.a.map(x=>subT(x,th))};
function comp(mu,d){const r={};for(const k in mu)r[k]=subT(mu[k],d);for(const k in d)if(!(k in mu))r[k]=d[k];return r}
function dis(ts){const ks=ts.map(tstr);if(ks.every(k=>k==ks[0]))return null;
 if(ts.every(t=>t.f&&t.f==ts[0].f&&t.a.length==ts[0].a.length&&t.a.length)){for(let i=0;i<ts[0].a.length;i++){const r=dis(ts.map(t=>t.a[i]));if(r)return r}}
 const seen=new Set,o=[];ts.forEach(t=>{const k=tstr(t);if(!seen.has(k)){seen.add(k);o.push(t)}});return o}
const muStr=mu=>'{'+Object.entries(mu).map(([k,t])=>k+'/'+tstr(t)).join(', ')+'}';
function unify(ts){let mu={};const steps=[];
 for(let n=0;n<60;n++){const T=ts.map(t=>subT(t,mu)),D=dis(T);
  if(!D)return{ok:1,mu,steps,T};
  const vs=D.filter(t=>t.v);
  if(!vs.length)return{ok:0,mu,steps,T,D,why:'the disagreement set {'+D.map(tstr).join(', ')+'} has no variable: different function symbols'};
  for(const x of vs){const o=D.find(t=>tstr(t)!=x.v&&varsT(t).has(x.v));if(o)return{ok:0,mu,steps,T,D,why:'occurs check: '+x.v+' occurs in '+tstr(o)}}
  const x=vs[0],t=D.find(t=>tstr(t)!=x.v),d={[x.v]:t};const mu2=comp(mu,d);
  steps.push({T:T.map(tstr),D:D.map(tstr),d:muStr(d),mu:muStr(mu2)});mu=mu2}
 return{ok:0,mu,steps,why:'too many steps'}}
function unifyHTML(src){const ts=splitTop(NORM(src)).map(parseTerm);if(ts.length<2)throw Error('Write at least two expressions separated by commas');
 const r=unify(ts);let h='<div class=ln><b>0</b> <i class=mu>μ₀ = { }</i></div>';
 let mu0='{ }';r.steps.forEach((s,i)=>{h+='<div class=ln><b>'+(i+1)+'</b> <span class=f>'+s.T.join('<br>')+'</span><br><i class=mu>D = { '+s.D.join(', ')+' }</i> · δ = '+s.d+' · <b>μ'+(i+1)+' = '+s.mu+'</b></div>'});
 if(r.ok)h+='<div class=ln><span class=f>'+r.T.join('<br>')+'</span><br>identical ⇒ <b class=ok>unifiable</b>, m.g.u. = <b>'+muStr(r.mu)+'</b></div>';
 else h+='<div class=ln><b class=no>Not unifiable</b>: '+r.why+'.</div>';
 return{r,h}}
// ---------- resolution
const vnames=['X','Y','Z','U','V','W'];
function normC(c){const m={};let n=0;const rt=t=>t.v?(m[t.v]||(m[t.v]={v:n<vnames.length?vnames[n++]:'X'+(n++-vnames.length+1)})):{f:t.f,a:t.a.map(rt)};
 const r=dd2(c.map(l=>({s:l.s,a:rt(l.a)})));return r}
const lk2=l=>(l.s?'':'¬')+tstr(l.a);
const dd2=c=>{const s=new Set;return c.filter(l=>{const k=lk2(l);if(s.has(k))return 0;s.add(k);return 1})};
const ckey=c=>c.map(lk2).sort().join('|');
const cstr2=c=>c.length?c.map(lk2).join(' ∨ '):'□';
const applyC=(c,th)=>c.map(l=>({s:l.s,a:subT(l.a,th)}));
const renC=(c,suf)=>{const rt=t=>t.v?{v:t.v+suf}:{f:t.f,a:t.a.map(rt)};return c.map(l=>({s:l.s,a:rt(l.a)}))};
const hasVar=c=>c.some(l=>varsT(l.a).size);
const tautC=c=>c.some(l=>c.some(m=>m.s!=l.s&&tstr(m.a)==tstr(l.a)));
function saturate(init,limit=300){
 const L=init.map(c=>({c,from:null})),keys=new Set(L.map(x=>ckey(normC(x.c))));
 let found=L.findIndex(x=>!x.c.length);
 const push=(c,from,mgu,pred,kind)=>{const n=normC(c);if(tautC(n))return -1;const k=ckey(n);if(keys.has(k))return -1;keys.add(k);L.push({c:n,from,mgu,pred,kind});return L.length-1};
 const factor=idx=>{const c=L[idx].c;for(let a=0;a<c.length;a++)for(let b=a+1;b<c.length;b++){if(c[a].s!=c[b].s||c[a].a.f!=c[b].a.f||c[a].a.a.length!=c[b].a.a.length)continue;const u=unify([c[a].a,c[b].a]);if(u.ok){const r=push(applyC(c,u.mu),[idx],u.mu,c[a].a.f,'F');if(r>=0&&!L[r].c.length)return r}}return -1};
 for(let j=0;j<L.length&&found<0&&L.length<limit;j++){
  const f=factor(j);if(f>=0)found=f;
  for(let i=0;i<=j&&found<0;i++){
   const ci=L[i].c,cj0=L[j].c,cj=(i==j||(hasVar(ci)&&hasVar(cj0)))?renC(cj0,"'"):cj0;
   for(let a=0;a<ci.length&&found<0;a++)for(let b=0;b<cj.length&&found<0;b++){
    const p=ci[a],q=cj[b];if(p.s==q.s||p.a.f!=q.a.f||p.a.a.length!=q.a.a.length)continue;
    const u=unify([p.a,q.a]);if(!u.ok)continue;
    const rc=applyC([...ci.filter((_,x)=>x!=a),...cj.filter((_,x)=>x!=b)],u.mu);
    const r=push(rc,[i,j],u.mu,p.a.f,'R');if(r>=0&&!L[r].c.length)found=r}}}
 return{L,found,limited:found<0&&L.length>=limit}}
function proofHTML(R){
 const need=new Set();const st=[R.found];while(st.length){const i=st.pop();if(need.has(i))continue;need.add(i);const f=R.L[i].from;if(f)st.push(...f)}
 R.L.forEach((x,i)=>{if(!x.from)need.add(i)});
 const keep=[...need].sort((a,b)=>a-b),mp={};keep.forEach((o,k)=>mp[o]=k+1);
 return keep.map(o=>{const x=R.L[o];return'<div class=ln><b>'+mp[o]+'</b> <span class=f>'+cstr2(x.c)+'</span>'+(x.from?' <i class=mu>mgu = '+muStr(x.mgu)+' · '+(x.kind=='F'?'Factor('+mp[x.from[0]]+')':'Res('+mp[x.from[0]]+', '+mp[x.from[1]]+', '+x.pred+')')+'</i>':'')+'</div>'}).join('')}
const toC=cs=>cs.map(c=>c.map(l=>({s:l.s,a:{f:l.a.n,a:l.a.a}})));
function prepare(prem,concl){
 const fs0=[...prem.map(parseFO)],used=new Set();
 let neg=null;if(concl&&concl.trim()){neg={k:'n',a:parseFO(concl)};fs0.push(neg)}
 fs0.forEach(f=>names(f,used));
 const parts=fs0.map((f,i)=>({f,cl:clausify(f,used),neg:f===neg}));
 return parts}
function resolveHTML(prem,concl){
 const parts=prepare(prem,concl),hasC=concl&&concl.trim();let h='';
 parts.forEach((p,i)=>{h+='<div class=ln><b>'+(p.neg?'¬ conclusion':'Premise '+(i+1))+'</b> <span class=f>'+fs(p.f)+'</span><br>⟶ '+csetStr(p.cl.clauses)+stepsHTML(p.cl.steps)+'</div>'});
 const init=toC(parts.flatMap(p=>p.cl.clauses)),R=saturate(init),ok=R.found>=0;
 h+='<h3>Resolution</h3>';
 if(ok)h+=proofHTML(R)+'<p class=ok>□ derived ⇒ the clause set is inconsistent'+(hasC?' ⇒ the reasoning is <b>sound</b>':'')+'.</p>';
 else h+=init.map((c,i)=>'<div class=ln><b>'+(i+1)+'</b> <span class=f>'+cstr2(c)+'</span></div>').join('')+'<p class=no>'+(R.limited?'No □ found within the search limit (first-order resolution need not terminate).':'Saturated without □ ⇒ the set is consistent'+(hasC?' ⇒ the reasoning is <b>not sound</b>':'')+'.')+'</p>';
 return{ok,h,limited:R.limited,n:init.length}}
// ---------- banks
window.FO={checkClauses,parseFO,clausify,unify,unifyHTML,resolveHTML,stepsHTML,fs,saturate,prepare,toC,names};
B.snf=['∃X∀Y ¬(∃Y p(X,Y)→q(X,Y)) ∨ ∀Z r(Z)','∃X[p(X)→[∀Y(p(Y)→p(f(X,Y)))∧¬∀Y(q(X,Y)→p(Y))]]','∃X∀Y¬[¬p(X,Y)→∀Z(q(Z)∧p(X,X))]','∀X[∃Y(p(X,Y)→r(X,Y))→∃Y(q(Y)→s(Y))]','∃X∀Y¬∀Z[¬p(X,Y)→(q(Z)∧p(X,X))]','∀X{p(X)∨∃X[(r(X)∨p(f(X)))∧∃X¬r(X)]∨[∃X q(X,X)∧¬r(f(X))]}'];
B.unif=['p(f(X),Z), p(Y,a)','p(f(X),a), p(Y,f(U))','p(f(X),g(U,Z)), p(Y,g(V,a))','p(f(Z),g(U,Z)), p(Y,g(V,a))','p(a,X,h(g(Z))), p(Z,h(Y),h(Y))','p(X,f(a),g(g(Y))), p(Z,f(Z),g(Y))','p(f(a),g(X)), p(Y,Y)','p(a,X,g(g(Z))), p(Z,h(Y),g(Y))','p(f(X),h(Y),a), p(f(X),Z,a), p(f(X),h(Y),b)','q(X,f(a),g(b)), q(Z,f(Y),g(Y)), q(X,X,Z)','p(X,a,f(g(Y))), p(f(Z),Z,f(U))','p(X,f(X),f(a)), p(g(Y),Z,Z)','p(X,Y), p(Y,f(X))'];
B.pres=[['Dog example',['∀X(dog(X)→animal(X))','dog(bobby)','∀Y(animal(Y)→die(Y))'],'die(bobby)'],
['PDF a',['∃X p(X)'],'¬∀X¬p(X)'],['PDF b',['¬∀X¬p(X)'],'∃X p(X)'],
['PDF c',['∃X(p(X)∨q(X))','∀X(p(X)→r(X,X))','¬∃X q(X)'],'∃X r(X,X)'],
['PDF d',['∃X∀Y p(X,Y)'],'∀Y∃X p(X,Y)'],
['PDF e',['∀X(r(X)→q(X))','∃X(p(X)∧¬q(X))'],'∃X(p(X)∧¬r(X))'],
['Another example',['∀X(q(X)∨¬p(X))','∀X(r(X)∨¬q(X))','p(f(a))'],'∃X r(f(X))'],
['Long example',['∀X(¬p(X)∨q(X)∨r(X,f(X)))','∀X(¬p(X)∨q(X)∨s(f(X)))','t(a)','p(a)','∀Y(¬r(a,Y)∨t(Y))','∀X(¬t(X)∨¬q(X))','∃X(p(X)∨t(X))'],'∃X(t(X)∧s(X))'],
['Clause set',['s(X)∨¬q(Y)∨¬r(X,Y)','¬p(X)∨q(X)','p(b)','r(a,b)','¬s(a)'],''],
['Not sound',['∀X(p(X)∨q(X))'],'∀X p(X)∨∀X q(X)'],
['Not sound 2',['∃X p(X)∧∃X q(X)'],'∃X(p(X)∧q(X))']];
B.cnfi=B.cnf.slice();B.nfi=B.snf.slice();
// ---------- UI integration
CATS.pred.snf='Normal forms';CATS.pred.nfi='Normal form steps';CATS.prop.cnfi='CNF steps';CATS.pred.unif='Unification';CATS.pred.pres='Resolution';
const oldExH=exH,oldJudge=judge,oldTut=tut,oldSim=sim;
const btn=(v,l)=>`<button onclick="jd('${v}')">${l}</button>`;
const card=(q,a)=>`<div class=card>${q}<div class=row>${a}</div><div id=fb></div></div>`;
exH=function(e){const c=e.c,d=e.d;if(c=='cnfi'||c=='nfi')return ciHTML(e);
 if(c=='snf')return card('Skolem normal form and clausal form of:<div class=f>'+d+'</div>Write the clausal form: clauses separated by <code>;</code>, literals by <code>∨</code>. Variables are capital letters; call the new Skolem symbols whatever you like.<textarea id=ans rows=3 placeholder="¬p(X) ∨ q(f(X)) ; r(a)"></textarea>','<button onclick="jd($(\'#ans\').value)">Check</button><button onclick="snfHint()">Hint</button>');
 if(c=='unif')return card('Is this set of expressions unifiable?<div class=f>{ '+d+' }</div><span class=mu>Variables are capital letters, constants and functions are lowercase.</span>',btn('y','Yes')+btn('n','No'));
 if(c=='pres')return card('<span class=mu>'+d[0]+'</span><div class=f>'+(d[2]&&d[2].trim()?'{ '+d[1].join(',  ')+' } ⊨ '+d[2]+'</div>Is the reasoning sound? (Is the clause set of premises + ¬conclusion inconsistent?)':'{ '+d[1].join(',  ')+' }</div>Is this clause set inconsistent?'),btn('s','Sound / inconsistent')+btn('n','Not sound / consistent'));
 return oldExH(e)};
judge=function(e,a){const c=e.c,d=e.d;
 if(c=='snf'){const f=FO.parseFO(d),k=FO.checkClauses(a,f),r=k.R;return{ok:!!k.ok,h:(k.ok?'':'<p>'+k.why+'</p>')+'Reference clausal form: <b>'+r.steps[r.steps.length-1].f+'</b>'+FO.stepsHTML(r.steps,!k.ok)}}
 if(c=='unif'){const u=FO.unifyHTML(d);return{ok:(a=='y')==!!u.r.ok,h:u.h}}
 if(c=='pres'){const r=FO.resolveHTML(d[1],d[2]);return{ok:(a=='s')==r.ok,h:r.h}}
 return oldJudge(e,a)};
tut=function(){oldTut();if(S.d!='pred')return;
 const ex1=FO.parseFO('∃X∀Y ¬(∃Y p(X,Y)→q(X,Y)) ∨ ∀Z r(Z)'),cf=FO.clausify(ex1,FO.names(ex1)),un=FO.unifyHTML('p(X,a,f(g(Y))), p(f(Z),Z,f(U))'),rs=FO.resolveHTML(B.pres[0][1],B.pres[0][2]);
 $('#M').insertAdjacentHTML('beforeend',
 cv('Function symbols','<p>Terms may use function symbols: <code>f(x)</code>, <code>m(x)</code>, <code>g(a,b)</code>. In the evaluator give every function a value for each argument: <code>dom=A,B; p={(A,B)}; f(A)=B; f(B)=A</code> (with two arguments: <code>g(A,B)=A</code>). In formalization, <i>everybody loves their mother</i> is <code>∀x L(x,m(x))</code>.</p>')+
 cv('Skolem normal form and clausal form','<p>To prove F ⊨ G by resolution we refute F ∪ {¬G}, so every formula must become a set of clauses:</p><p>1 remove ↔ and → · 2 push ¬ inwards (also ¬∀ ≡ ∃¬, ¬∃ ≡ ∀¬) · 3 rename variables so no two quantifiers share a name · 4 move all quantifiers to the left, keeping their order · 5 eliminate ∃: with no ∀ before it use a new constant <code>a</code>, otherwise a new function of the ∀ variables before it, <code>∀X∃Y p(X,Y)</code> ⟶ <code>∀X p(X,f(X))</code> · 6 kernel to CNF · 7 drop the (universal) quantifiers: clauses.</p><p><b>∃ elimination keeps satisfiability, not equivalence.</b></p>'+FO.stepsHTML(cf.steps,1))+
 cv('Unification','<p>Substitution θ = {X/t,…}: replaces variable X by term t everywhere; X must not occur in t. A set of expressions is unifiable if a substitution makes them identical; the <b>m.g.u.</b> is the most general one.</p><p>Algorithm: μ₀ = { }. Compute the disagreement set D of Tμ. If D has no variable (different function symbols) or a variable occurs in another term of D (<code>X</code> vs <code>f(X)</code>), stop: not unifiable. Otherwise take δ = {x/t}, set μ ← μδ (compose: apply δ to the terms of μ, then add δ). Repeat until all expressions are equal.</p>'+un.h)+
 cv('General resolution','<p>From C₁ = G ∨ ¬E₁ and C₂ = H ∨ E₂ with σ = mgu{E₁,E₂} (variables of one clause renamed apart) derive the resolvent Gσ ∨ Hσ. The set is inconsistent when □ is derived. {∀X p(X), ¬p(a)} needs unification: {p(X), ¬p(a)} is propositionally consistent.</p>'+rs.h));
 };
const resCard=()=>`<div class=card><h3>Resolution</h3><textarea id=rsp rows=3 placeholder="Premises (formulas or clauses), one per line"></textarea><input id=rsq placeholder="Conclusion (empty: just test the set)" style="margin-top:6px"><div class=row>${B.pres.map((x,i)=>`<button class=pl onclick="rsLoad(${i})">${i+1}</button>`).join('')}<button class=on onclick="rsRun()">Resolve</button></div></div><div id=rso></div>`;
sim=function(){oldSim();if(S.d!='pred')return;
 const chips=['∀X','∃X','¬','∧','∨','→','↔','(',')',','].map(ch).join('');
 $('#M').insertAdjacentHTML('beforeend',
 `<div class=card><h3>Skolem normal form and clauses</h3><input id=nfi placeholder="∃X∀Y ¬(∃Y p(X,Y)→q(X,Y)) ∨ ∀Z r(Z)"><div class=row>${chips}</div><div class=row>${B.snf.map((_,i)=>`<button class=pl onclick="$('#nfi').value=B.snf[${i}];nfRun()">${i+1}</button>`).join('')}<button class=on onclick="nfRun()">Convert</button></div></div><div id=nfo></div>
 <div class=card><h3>Unification</h3><input id=uni placeholder="p(f(X),Z), p(Y,a)"><div class=row>${B.unif.map((_,i)=>`<button class=pl onclick="$('#uni').value=B.unif[${i}];unRun()">${i+1}</button>`).join('')}<button class=on onclick="unRun()">Unify</button></div></div><div id=uno></div>
 ${resCard()}`)};
window.snfHint=()=>{const e=S.ex,f=FO.parseFO(e.d),r=FO.clausify(f,FO.names(f));const inR=new Set(JSON.stringify(r.clauses).match(/"n":"[^"]+"|"f":"[^"]+"/g)||[]);r.sk=r.sk.filter(x=>inR.has('"f":"'+x.n+'"')||inR.has('"n":"'+x.n+'"'));$('#fb').innerHTML='<p class=mu>Hint: '+r.clauses.length+' clause'+(r.clauses.length==1?'':'s')+', '+r.sk.length+' Skolem symbol'+(r.sk.length==1?'':'s')+(r.sk.length?' (arities '+r.sk.map(x=>x.ar).join(', ')+')':'')+'.</p>'};
window.nfRun=()=>out(()=>{const f=FO.parseFO($('#nfi').value),r=FO.clausify(f,FO.names(f));return'<b>'+r.steps[r.steps.length-1].f+'</b>'+FO.stepsHTML(r.steps,1)},'#nfo');
window.unRun=()=>out(()=>FO.unifyHTML($('#uni').value).h,'#uno');
window.rsLoad=i=>{$('#rsp').value=B.pres[i][1].join('\n');$('#rsq').value=B.pres[i][2];rsRun()};
window.rsRun=()=>out(()=>FO.resolveHTML($('#rsp').value.split('\n').filter(x=>x.trim()),$('#rsq').value).h,'#rso');
// ---------- interactive normal-form trainer (propositional CNF and first-order SNF)
const OPN=OP;
const mkN=a=>({k:'n',a}),mkA=(l,r)=>({k:'a',l,r}),mkO=(l,r)=>({k:'o',l,r}),mkI=(l,r)=>({k:'i',l,r});
const RULES={
 e:{n:'Remove ↔',ap:x=>x.k=='e'?mkA(mkI(x.l,x.r),mkI(x.r,x.l)):0},
 i:{n:'Remove →',ap:x=>x.k=='i'?mkO(mkN(x.l),x.r):0},
 nn:{n:'¬¬A ≡ A',ap:x=>x.k=='n'&&x.a.k=='n'?x.a.a:0},
 dm:{n:'Push ¬ inwards',ap:x=>x.k!='n'?0:x.a.k=='a'?mkO(mkN(x.a.l),mkN(x.a.r)):x.a.k=='o'?mkA(mkN(x.a.l),mkN(x.a.r)):x.a.k=='A'?{k:'E',v:x.a.v,a:mkN(x.a.a)}:x.a.k=='E'?{k:'A',v:x.a.v,a:mkN(x.a.a)}:0},
 d:{n:'Distribute ∨ over ∧',ap:x=>x.k!='o'?0:x.r.k=='a'?mkA(mkO(x.l,x.r.l),mkO(x.l,x.r.r)):x.l.k=='a'?mkA(mkO(x.l.l,x.r),mkO(x.l.r,x.r)):0}};
const hasQ=f=>f.k=='A'||f.k=='E'?true:f.k=='P'?false:f.k=='n'?hasQ(f.a):hasQ(f.l)||hasQ(f.r);
const gets=(f,p)=>{for(const c of p){f=c=='l'?f.l:c=='r'?f.r:f.a}return f};
const sets=(f,p,n)=>{if(!p.length)return n;const c=p[0],r=p.slice(1);if(c=='l')return{...f,l:sets(f.l,r,n)};if(c=='r')return{...f,r:sets(f.r,r,n)};return{...f,a:sets(f.a,r,n)}};
function isNF(f){let m=f;while(m.k=='A'||m.k=='E'){if(m.k=='E')return false;m=m.a}
 const ok=g=>g.k=='P'?true:g.k=='n'?g.a.k=='P':g.k=='a'?ok(g.l)&&ok(g.r):g.k=='o'?g.l.k!='a'&&g.r.k!='a'&&g.l.k!='A'&&g.r.k!='A'&&g.l.k!='E'&&g.r.k!='E'&&ok(g.l)&&ok(g.r):false;
 return ok(m)}
function hint(f){const has=(g,t)=>g.k==t||(g.k=='P'?0:g.k=='n'||g.k=='A'||g.k=='E'?has(g.a,t):has(g.l,t)||has(g.r,t));
 const negOver=g=>g.k=='n'?g.a.k!='P':g.k=='P'?false:g.k=='A'||g.k=='E'?negOver(g.a):negOver(g.l)||negOver(g.r);
 if(has(f,'e'))return'There is a ↔: remove it.';if(has(f,'i'))return'There is a →: remove it.';if(negOver(f))return'A ¬ still sits in front of something that is not an atom: push it inwards (¬¬, De Morgan, ¬∀/¬∃).';
 if(hasQ(f)){if(JSON.stringify(renameApart(f))!=JSON.stringify(f))return'Two quantifiers share a variable name: rename the variables.';
  let m=f;while(m.k=='A'||m.k=='E')m=m.a;if(hasQ(m))return'Move all the quantifiers to the left (prenex form).';
  let q=f,pre=[];while(q.k=='A'||q.k=='E'){pre.push(q.k);q=q.a}if(pre.includes('E'))return'Eliminate an ∃ with a Skolem term (click its quantifier).'}
 return'Distribute ∨ over ∧ wherever an ∨ has an ∧ below it.'}
function ciCl(nf){let m=nf;while(m.k=='A')m=m.a;const raw=clausesOf(m),seen=new Set,C=raw.filter(x=>{if(taut(x))return 0;const k=x.map(lk).sort().join('|');if(seen.has(k))return 0;seen.add(k);return 1});return csetStr(C)}
function ciNew(src){const f=parseFO(src),c={f,log:[{t:'Start',f:fs(f)}],hist:[],r:null,msg:'',done:false,used:names(f),paid:false,q:hasQ(f)};if(isNF(f)){c.done=true;c.paid=true;c.cl=ciCl(f)}return c}
function ciR(f,p){const c='<span class=cin onclick="ciClick(\''+p+'\',event)">';
 switch(f.k){case'P':return c+astr(f)+'</span>';case'n':return c+'¬'+ciR(f.a,p+'a')+'</span>';case'A':case'E':return c+(f.k=='A'?'∀':'∃')+f.v+' '+ciR(f.a,p+'a')+'</span>'}
 const s=ciR(f.l,p+'l')+' '+OPN[f.k]+' '+ciR(f.r,p+'r');return c+(p==''?s:'('+s+')')+'</span>'}
const SEL=[['e','↔'],['i','→'],['nn','¬¬'],['dm','¬ in'],['d','∨/∧']];
function ciHTML(e){if(!e.ci)e.ci=ciNew(e.d);const c=e.ci;setTimeout(ciDraw,0);
 return'<div class=card><span class=mu>Rewrite step by step until you reach '+(c.q?'Skolem normal form (only ∀ in front, kernel in CNF)':'CNF')+'. Pick a rule, then click the (sub)formula to apply it to.</span><div class=row id=cibtn></div><div class=f id=cibox></div><p id=cimsg></p><div class=row><button onclick="ciUndo()">Undo</button><button onclick="ciHint()">Hint</button></div><div id=cilog></div></div>'}
function ciDraw(){const e=S.ex;if(!e||!e.ci||!$('#cibox'))return;const c=e.ci;
 const btn=SEL.concat(c.q?[['ren','rename'],['pre','prenex'],['sk','Skolem ∃']]:[]).map(([k,l])=>'<button class="'+(c.r==k?'on':'')+'" onclick="ciSel(\''+k+'\')">'+l+'</button>').join('');
 $('#cibtn').innerHTML=btn;$('#cibox').innerHTML=ciR(c.f,'');
 $('#cimsg').innerHTML=c.done?'<span class=ok>✓ Done in '+(c.log.length-1)+' step'+(c.log.length==2?'':'s')+'. Clausal form: <b>'+c.cl+'</b></span>':(c.msg?'<span class='+(c.msg.startsWith('Hint')?'mu':'no')+'>'+c.msg+'</span>':'');
 $('#cilog').innerHTML=c.log.map((s,i)=>'<div class=ln><b>'+i+'</b> <i class=mu>'+s.t+'</i><br><span class=f>'+s.f+'</span></div>').join('')}
function ciPush(c,t,nf){c.hist.push({f:c.f,log:c.log,used:new Set(c.used),done:c.done,cl:c.cl});c.f=nf;c.log=[...c.log,{t,f:fs(nf)}];c.msg='';
 if(isNF(nf)){c.done=true;c.cl=ciCl(nf);
  if(!c.paid){c.paid=true;S.ok++;addXP(2);nav()}}}
window.ciSel=k=>{const c=S.ex.ci;if(c.done)return;c.r=k;c.msg='';
 if(k=='ren'){const g=renameApart(c.f);if(JSON.stringify(g)==JSON.stringify(c.f))c.msg='No variable needs renaming.';else ciPush(c,'Rename variables',g);c.r=null}
 if(k=='pre'){const negOver=g=>g.k=='n'?g.a.k!='P':g.k=='P'?false:g.k=='A'||g.k=='E'?negOver(g.a):negOver(g.l)||negOver(g.r),bad=g=>g.k=='e'||g.k=='i'||(g.k=='P'?0:g.k=='n'||g.k=='A'||g.k=='E'?bad(g.a):bad(g.l)||bad(g.r));
  if(bad(c.f))c.msg='Remove ↔ and → first.';else if(negOver(c.f))c.msg='Push the negations inwards first (a quantifier cannot be moved across a ¬).';
  else if(JSON.stringify(renameApart(c.f))!=JSON.stringify(c.f))c.msg='Rename the variables first: two quantifiers share a name.';
  else{const pl=pull(c.f),g=pl.pre.reduceRight((m,[q,v])=>({k:q,v,a:m}),pl.m);if(JSON.stringify(g)==JSON.stringify(c.f))c.msg='The quantifiers are already on the left.';else ciPush(c,'Move quantifiers to the left',g)}c.r=null}
 ciDraw()};
window.ciClick=(p,ev)=>{ev.stopPropagation();const c=S.ex.ci;if(c.done)return;if(!c.r){c.msg='Pick a rule first.';ciDraw();return}
 const node=gets(c.f,p);
 if(c.r=='sk'){let ok=node.k=='E',n=c.f;for(let i=0;i<p.length&&ok;i++){if(n.k!='A'&&n.k!='E')ok=false;n=n.a}
  if(!ok){c.msg='Click an ∃ that belongs to the quantifier prefix (move the quantifiers to the left first).';ciDraw();return}
  const U=[];n=c.f;for(let i=0;i<p.length;i++){if(n.k=='A')U.push(n.v);n=n.a}
  const used=c.used,cons=['a','b','c','d','e'],fns=['f','g','h','k','m','n'];let t;
  if(!U.length){const nm=cons.find(x=>!used.has(x))||('a'+used.size);used.add(nm);t={f:nm,a:[]}}else{const nm=fns.find(x=>!used.has(x))||('f'+used.size);used.add(nm);t={f:nm,a:U.map(x=>({v:x}))}}
  ciPush(c,'Skolem: '+node.v+' ↦ '+tstr(t),sets(c.f,p,substF(node.a,node.v,t)));ciDraw();return}
 const R=RULES[c.r],g=R.ap(node);
 if(!g){c.msg='“'+R.n+'” does not apply to that part. '+(c.r=='d'?'Click an ∨ that has an ∧ directly below it.':c.r=='dm'?'Click a ¬ in front of ∧, ∨, ∀ or ∃.':c.r=='nn'?'Click a double negation.':'Click a '+(c.r=='e'?'↔':'→')+'.');ciDraw();return}
 ciPush(c,R.n,sets(c.f,p,g));ciDraw()};
window.ciUndo=()=>{const c=S.ex.ci;const h=c.hist.pop();if(h){c.f=h.f;c.log=h.log;c.used=h.used;c.done=h.done;c.cl=h.cl}c.msg='';ciDraw()};
window.ciHint=()=>{const c=S.ex.ci;c.msg=c.done?'':'Hint: '+hint(c.f);ciDraw()};
window.CI={ciNew,RULES,isNF,hint,gets,sets};
const oldCt=ct;ct=function(){if(S.d=='pred'){$('#M').innerHTML=cv('Proof by contradiction (refutation)','To prove P₁,…,Pₙ ⊨ Q in predicate logic, assume ¬Q and show that {P₁,…,Pₙ,¬Q} is inconsistent: convert every formula to clauses (Skolem) and derive □ by resolution with unification. Load an example or write your own; leave the conclusion empty to test a clause set.')+resCard();return}oldCt()};
go();
})();
