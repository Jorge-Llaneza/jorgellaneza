/* ===== Propositional & predicate logic: visual chaptered tutorials ===== */
(function(){
const {svg,bx,ar,card,key,ck,btn,PEND}=VZ;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const prac=(d,c,t)=>btn('🎯 Practice: '+t,`S.d='${d}';S.m='prac';S.c='${c}';S.i=0;go()`);
const dot=(v,t,big)=>`<span class="dot ${v?'T':'F'}" style="${big?'min-width:38px;height:38px;line-height:38px;font-size:16px;':''}">${t==null?(v?'T':'F'):t}</span>`;
const sdot=(v,t,out)=>`<span class="dot ${v?'T':'F'}" style="min-width:22px;height:22px;line-height:22px;font-size:11px;${out?'outline:2px solid var(--fg);':''}">${t==null?(v?'T':'F'):t}</span>`;
const ST4={pq:{p:true,q:true},pd:[true,false,true,true],mat:[[true,false,false],[false,true,false],[false,false,true]]};
const chp=a=>`<div class=chp style="text-align:center">${a.join('')}</div>`;

/* ---- generic stepper over precomputed HTML steps ---- */
const GS={};
function gset(id,h){GS[id]={h,k:0};gdraw(id)}
window.gGo=(id,d)=>{const g=GS[id];g.k=d==null?0:Math.max(0,Math.min(g.h.length-1,g.k+d));gdraw(id)};
window.gSet=(id,k)=>{GS[id].k=+k;gdraw(id)};
function gdraw(id){const g=GS[id],e=document.getElementById('g_'+id);if(!e)return;const n=g.h.length-1;
 e.innerHTML=`<div>${g.h[g.k]}</div><div class=row><button onclick="gGo('${id}',-1)">◀</button><input type=range min=0 max=${n} value=${g.k} style="flex:1;width:auto;min-width:100px" oninput="gSet('${id}',this.value)"><button onclick="gGo('${id}',1)">▶</button><button onclick="gGo('${id}')">⏮</button></div><span class=mu>step ${g.k+1} of ${n+1}</span>`}
const sel=(id,opts,fn)=>`<select id=${id} onchange="${fn}()">${opts.map((o,i)=>`<option value=${i}>${esc(o)}</option>`).join('')}</select>`;

/* =========== PROPOSITIONAL =========== */
const PROP=[];
const CON=[['¬','not','¬p'],['∧','and','p∧q'],['∨','or','p∨q'],['→','if … then','p→q'],['↔','iff','p↔q']];
window.pqT=k=>{ST4.pq[k]=!ST4.pq[k];pqDraw()};
function pqDraw(){const e=$('#pqo');if(!e)return;const I={p:ST4.pq.p,q:ST4.pq.q},cur=(I.p?0:2)+(I.q?0:1);
 $('#pqt').innerHTML=['p','q'].map(k=>`<button class="dot ${ST4.pq[k]?'T':'F'}" style="cursor:pointer;padding:0 14px;border-radius:99px;min-width:70px;height:34px;font:inherit;color:var(--fg)" onclick="pqT('${k}')">${k} = ${ST4.pq[k]?'T':'F'}</button>`).join(' ');
 e.innerHTML=CON.map(([s,n,f])=>{const F=parse(f),v=ev(F,I),un=s=='¬',pat=un?[true,false].map(p=>ev(F,{p,q:true})):[[1,1],[1,0],[0,1],[0,0]].map(r=>ev(F,{p:!!r[0],q:!!r[1]})),ac=un?(I.p?0:1):cur;
  return `<div><div style="font:700 26px ui-monospace,monospace">${s}</div><small class=mu>${n}</small><div style="margin:4px 0">${pat.map((x,i)=>sdot(x,null,i==ac)).join('')}</div>${dot(v,null,1)}</div>`}).join('')}
PROP.push({t:'1 Connectives',f:()=>{PEND.push(pqDraw);
 return card('Try it: flip p and q',`<div class=row id=pqt></div><div class=chp style="text-align:center" id=pqo></div><span class=mu>Small dots = truth table rows (TT, TF, FT, FF); the outlined one is the current row.</span>`)+
 card('Precedence and well-formed formulas',`<div class=ex2>${['¬','∧','∨','→','↔'].map((x,i)=>ck(x,i<2?'a':i<3?'b':'c')).join('<span class=mu>›</span>')}</div><div class=ex2>${ck('✓ (p∧q)→r','a')}${ck('✓ ¬¬p','a')}${ck('✗ p¬','c')}${ck('✗ p∧∨q','c')}${ck('✗ r(p∧q)','c')}</div>`+key('Every connective sits <b>between two formulas</b> (¬ goes before one).'))+
 `<div class=row>${prac('prop','wff','Syntax')}${prac('prop','evalp','Evaluation')}</div>`}});

const SAY=[['p→q',['if p then q','p only if q','p is sufficient for q','not p unless q'],'a'],['q→p',['p is necessary for q'],'b'],['¬q→p',['p unless q'],'c'],['p↔q',['p iff q'],'a'],['¬(p→q)',['p is not sufficient for q'],'b'],['(p→q)∧(¬p→r)',['if p then q else r'],'c']];
PROP.push({t:'2 Say it',f:()=>{
 const imp=`<div class=ex2>${[[1,1],[1,0],[0,1],[0,0]].map(([p,q])=>`${sdot(p,'p='+(p?'T':'F'))}${sdot(q,'q='+(q?'T':'F'))}<span class=mu>→</span>${sdot(!p||q)}&nbsp;`).join('')}</div>`;
 return card('Different words, same formula',chp(SAY.map(([f,ph])=>`<div><code style="font-size:16px"><b>${f}</b></code><br>${ph.map(x=>`<div class=ck style="display:block;margin:3px 0">${esc(x)}</div>`).join('')}</div>`)))+
 card('Remember: p → q is only false in one row',imp+key('<b>p → q</b> fails only when p is true and q is false.'))+
 card('Formalize in 3 moves',`<div class=ex2>${ck('① name the atoms (p, q, r…)','a')}${ck('② spot the connectives','b')}${ck('③ add brackets','c')}</div><span class=mu>“I study or I do not pass” (p: study, q: pass) → <code>p∨¬q</code></span>`)+
 `<div class=row>${prac('prop','formal','Formalization')}</div>`}});

const CLS=['p∨¬p','p→q','p∧¬p','(p→q)∨(q→p)','(p∧q)→p','p↔¬p'];
window.clsRun=()=>{const o=$('#clo');try{const f=parse($('#cin').value),r=cls(f),R=rows(r.vs),lab={valid:['Valid','T'],sat:['Satisfiable (not valid)',''],unsat:['Unsatisfiable','F']}[r.type];
 o.innerHTML=`<div class=ex2>${R.slice(0,16).map(I=>`<span class=nb>${r.vs.map(v=>v+':'+(I[v]?'T':'F')).join(' ')||'—'}<br>${sdot(ev(f,I))}</span>`).join('')}</div><div style="margin-top:6px">${pl(lab[0],lab[1])}${r.c?` <span class=mu>falsified by ${ist(r.c)}</span>`:''}</div>`}catch(e){o.innerHTML='<span class=no>'+esc(e.message)+'</span>'}};
PROP.push({t:'3 Truth tables',f:()=>{PEND.push(clsRun);
 const strip=(a)=>`<div>${a.map(x=>sdot(x)).join('')}</div>`;
 return card('Three kinds of formula',chp([`<div><b>Valid</b>${strip([1,1,1,1])}<span class=mu>true in every row</span></div>`,`<div><b>Satisfiable</b>${strip([1,0,1,0])}<span class=mu>some rows true</span></div>`,`<div><b>Unsatisfiable</b>${strip([0,0,0,0])}<span class=mu>false in every row</span></div>`]))+
 card('Classify any formula',`<input id=cin value="p∨¬p" oninput=clsRun()><div class=row>${CLS.map(x=>`<button class=pl onclick="$('#cin').value='${x}';clsRun()">${x}</button>`).join('')}</div><div id=clo></div>`+key('Valid ⊂ satisfiable. A valid formula can never be unsatisfiable.'))+
 `<div class=row>${prac('prop','class','Classification')}</div>`}});

const SND=[['Modus ponens',['p→q','p'],'q'],['Affirming the consequent',['p→q','q'],'p'],['Modus tollens',['p→q','¬q'],'¬p'],['Hypothetical syllogism',['p→q','q→r'],'p→r']];
window.sndRun=()=>{const [n,P0,q]=SND[+$('#ssel').value],P=P0.map(x=>parse(x)),Q=parse(q),vs=vsOf([...P,Q]),w=ent(P,Q);
 $('#sno').innerHTML=`<div class=ex2>${P0.map(x=>pl(x)).join(' ')}<b>⊨</b>${pl(q,'T')}</div>`+tbl(vs,[...P,Q],I=>P.every(x=>ev(x,I)))+`<div style="margin-top:6px">${w?`<b class=no>✗ not sound</b> <span class=mu>counterexample ${ist(w)}: premises true, conclusion false</span>`:'<b class=ok>✓ sound</b> <span class=mu>in every highlighted row the conclusion is true</span>'}</div>`};
PROP.push({t:'4 Sound?',f:()=>{PEND.push(sndRun);
 const d=svg(440,70,`${bx(10,16,70,36,'P1','b2')}${bx(90,16,70,36,'P2','b2')}${bx(170,16,70,36,'…Pn','b2')}${ar(245,34,300,34)}<text class=t x=272 y=26>⊨</text>${bx(300,16,60,36,'Q','g')}<text class=s x=390 y=38>sound?</text>`);
 return card('Premises true ⇒ conclusion true',d+`<div class=row>${sel('ssel',SND.map(x=>x[0]),'sndRun')}</div><div id=sno></div>`)+
 card('Two ways to check',`<div class=chp><div>${ck('Thm I','a')}<br>P1∧…∧Pn → Q is <b>valid</b></div><div>${ck('Thm II','b')}<br>{P1…Pn, ¬Q} is <b>unsatisfiable</b></div></div>`)+
 `<div class=row>${prac('prop','entail','Soundness')}</div>`}});

const CNFX=['(p↔q)→¬(r∧¬p)','¬(p→q)∨r','(p∧q)∨r','p→(q∧r)'];
window.cnfRun=()=>{try{const f=parse($('#cnfin').value),S2=cnfSteps(f),C=cnf(f),PIPE=['Remove ↔','Remove →','Push ¬ in','Distribute','Simplify'];
 const pi=t=>/↔/.test(t)?0:/→/.test(t)?1:/Push/.test(t)?2:/Distribute/.test(t)?3:/Start/.test(t)?-1:4;
 gset('cnf',S2.map((s,i)=>`<div class=ex2>${PIPE.map((n,j)=>ck(n,j==pi(s.t)?'b':'')).join('<span class=mu>›</span>')}</div><div class=ins>${esc(s.t)}</div>${s.r?`<span class=mu>${esc(s.r)}</span>`:''}<div class=f>${esc(s.f)}</div>`+(i==S2.length-1?`<div class=ex2>${C.length?C.map(c=>pl(c.join(' ∨ ')||'□','T')).join(' ∧ '):pl('True','T')}</div>`:'')))}catch(e){$('#g_cnf').innerHTML='<span class=no>'+esc(e.message)+'</span>'}};
PROP.push({t:'5 CNF',f:()=>{PEND.push(cnfRun);
 return card('Watch a formula become CNF',`<input id=cnfin value="${CNFX[0]}" oninput=cnfRun()><div class=row>${CNFX.map(x=>`<button class=pl onclick="$('#cnfin').value='${x}';cnfRun()">${x}</button>`).join('')}</div><div id=g_cnf></div>`+key('CNF = AND of clauses; each clause = OR of literals.'))+
 `<div class=row>${prac('prop','cnf','CNF')}${btn('Steps trainer','S.d=\'prop\';S.m=\'prac\';S.c=\'cnfi\';S.i=0;go()')}</div>`}});

const RSX=[['Modus ponens: {p→q, p} ⊨ q',['p→q','p'],'q'],['Not sound: {p→q, q} ⊨ p',['p→q','q'],'p'],['Chain: {p→q, q→r} ⊨ p→r',['p→q','q→r'],'p→r']];
window.rsRun2=()=>{const [n,P0,q]=RSX[+$('#rsel').value],C=[...P0.flatMap(x=>cnf(parse(x))),...cnf({t:'n',a:parse(q)})],R=res(C),K=R.K,ncl=C.length;
 let idx;if(R.ok){const u=new Set,st=[K.length-1];while(st.length){const x=st.pop();if(u.has(x))continue;u.add(x);const f=K[x].f;f&&st.push(f[0]-1,f[1]-1)}idx=[...u].sort((a,b)=>a-b)}else idx=K.map((_,i)=>i);
 const nQ=cnf({t:'n',a:parse(q)}).length;const line=(i,hl)=>{const k=K[i];return `<div class=ln style="${hl?'background:color-mix(in srgb,var(--ok) 16%,transparent)':''}"><b>${i+1}</b> ${pl(k.c.join(' ∨ ')||'□',k.c.length?'':'T')} <span class=mu>${k.f?'resolve '+k.f[0]+' and '+k.f[1]:i<ncl-nQ?'premise':'¬conclusion'}</span></div>`};
 gset('rs',idx.map((_,s)=>`<div class=ex2>${pl('(A ∨ l)')}<b>+</b>${pl('(B ∨ ¬l)')}<b>⟹</b>${pl('(A ∨ B)','T')}</div>`+idx.slice(0,s+1).map((i,j)=>line(i,j==s)).join('')+(s==idx.length-1?(R.ok?'<b class=ok>□ derived ⇒ inconsistent ⇒ sound ✓</b>':'<b class=no>no □ possible ⇒ consistent ⇒ not sound ✗</b>'):'')))};
PROP.push({t:'6 Resolution',f:()=>{PEND.push(rsRun2);
 return card('Resolution step by step',`<div class=row>${sel('rsel',RSX.map(x=>x[0]),'rsRun2')}</div><div id=g_rs></div>`+key('Premises + <b>negated</b> conclusion → clauses. Deriving the empty clause □ means inconsistent, so the reasoning is <b>sound</b>.'))+
 `<div class=row>${btn('🧪 Soundness simulator','S.d=\'prop\';S.m=\'sim\';go()')}</div>`}});

PROP.push({t:'7 Contradiction',f:()=>{PEND.push(()=>tctInit());
 const t=svg(440,150,`${bx(150,6,140,30,'assume F = false','b2')}${ar(190,36,110,70)}${ar(250,36,330,70)}${bx(50,70,120,30,'case p = T','b')}${bx(270,70,120,30,'case p = F','b')}${ar(110,100,110,124)}${ar(330,100,330,124)}<text class=t x=110 y=142 style="fill:var(--no)">✗ contradiction</text><text class=t x=330 y=142 style="fill:var(--no)">✗ contradiction</text>`);
 return card('Idea: try to make the formula false',t+key('Every branch contradicts ⇒ <b>valid</b>. One branch survives ⇒ that is a <b>counterexample</b>.'))+card('Run it',`<div id=tctx></div>`)}});

PROP.push({t:'8 Deduction',f:()=>{
 const box=svg(440,120,`<rect class=b x=20 y=10 width=220 height=100 rx=8 /><text class=s x=130 y=26>box (assumption open)</text>${bx(36,36,90,28,'assume A','b2')}${ar(81,64,81,80)}${bx(36,80,90,26,'… B','b')}${ar(240,70,300,70)}${bx(300,52,120,36,'A → B','g','→I closes the box')}`);
 const rules=RU.prop.map(r=>`<div><span class=pl>${r}</span><br><code style="font-size:12px">${esc(SC[r]||'')}</code></div>`).join('');
 return card('Assumptions live in boxes',box+key('<b>→I</b>: assume A, derive B, close the box, conclude A→B. Same idea for ¬I, ¬E and ∨E.'))+
 card('Rule cheat-sheet',`<div class=chp>${rules}</div>`)+
 card('Strategy',`<div class=ex2>${ck('① look at the goal’s main connective','a')}${ck('② use its introduction rule','b')}${ck('③ break premises with eliminations','c')}</div>`)+
 `<div class=row>${btn('📘 Rule lessons','S.d=\'prop\';S.m=\'ls\';go()')}${btn('✍️ Deduction','S.d=\'prop\';S.m=\'nd\';go()',1)}</div>`}});

/* =========== PREDICATE =========== */
const PRED=[];
const DN=['A','B','C','D'];
window.pdT=i=>{ST4.pd[i]=!ST4.pd[i];pdDraw()};
function pdDraw(){const e=$('#pdo');if(!e)return;const P=ST4.pd,all=P.every(x=>x),any=P.some(x=>x),cx=DN[P.indexOf(false)],wt=DN[P.indexOf(true)];
 e.innerHTML=`<div class=ex2>${P.map((v,i)=>`<button class="dot ${v?'T':'F'}" style="cursor:pointer;padding:0;min-width:48px;height:48px;border-radius:50%;font:600 16px ui-monospace,monospace;color:var(--fg)" onclick="pdT(${i})">${DN[i]}</button>`).join('')}<span class=mu>click an element to flip P(x)</span></div>`+
 [['∀x P(x)',all,all?'every element is green':'fails for '+cx],['∃x P(x)',any,any?'witness '+wt:'no green element'],['¬∀x P(x)  ≡  ∃x ¬P(x)',!all,!all?'counterexample '+cx:'no counterexample'],['¬∃x P(x)  ≡  ∀x ¬P(x)',!any,!any?'all red':'witness '+wt+' exists']].map(([f,v,n])=>`<div class=ex2 style="margin:4px 0">${dot(v,null,1)}<code style="font-size:15px">${f}</code><span class=mu>${n}</span></div>`).join('')}
PRED.push({t:'1 ∀ and ∃',f:()=>{PEND.push(pdDraw);
 return card('Domain of 4 elements, P(x) = green',`<div id=pdo></div>`+key('<b>∀</b>: every dot green. <b>∃</b>: at least one dot green. Negation swaps them: ¬∀ ≡ ∃¬ and ¬∃ ≡ ∀¬.'))+
 card('Symbols',`<div class=ex2>${ck('constants a, b','a')}${ck('variables x, y','b')}${ck('predicates p(x,y)','c')}${ck('functions f(x)','a')}</div>`)+
 `<div class=row>${prac('pred','pev','Evaluation')}</div>`}});

const venn=(k)=>{const c=(x,y,r,t,cl)=>`<circle class="${cl||'b'}" cx=${x} cy=${y} r=${r} style="fill-opacity:.35"/><text class=t x=${x} y=${y+5}>${t}</text>`;
 return svg(220,120,k=='all'?`<circle class=b2 cx=110 cy=60 r=52 /><text class=s x=110 y=18>P</text><circle class=g cx=110 cy=72 r=26 /><text class=t x=110 y=77>S</text>`:k=='some'?`${c(82,60,42,'S','b2')}${c(138,60,42,'P','g')}<text class=t x=110 y=64 style="font-size:20px">★</text>`:`${c(60,60,40,'S','b2')}${c(160,60,40,'P','g')}`)};
PRED.push({t:'2 Say it',f:()=>{
 const V=(k,t,f)=>`<div class=ex2><div style="width:44%;min-width:150px">${venn(k).replace('class=vis','class=vis style="margin:0"')}</div><div><b>${t}</b><br><code style="font-size:16px">${f}</code></div></div>`;
 return card('Three basic patterns',V('all','All S are P','∀x(S(x)→P(x))')+V('some','Some S are P','∃x(S(x)∧P(x))')+V('none','No S is P','¬∃x(S(x)∧P(x))'))+
 card('More patterns',chp([['Not all S are P','¬∀x(S→P)'],['Only S are P','∀x(P(x)→S(x))'],['Everyone loves someone','∀x∃y L(x,y)'],['Someone loves everyone','∃x∀y L(x,y)']].map(([a,f])=>`<div><span class=mu>${a}</span><br><code>${f}</code></div>`)))+
 card('Classic mistakes',`<div class=ex2>${ck('✗ ∀x(S∧P)','c')}${ck('✗ ∃x(S→P)','c')}</div><span class=mu>∀ goes with →, ∃ goes with ∧.</span>`)+
 `<div class=row>${prac('pred','pform','Formalization')}</div>`}});

window.mxT=(i,j)=>{ST4.mat[i][j]=!ST4.mat[i][j];mxDraw()};
function mxDraw(){const e=$('#mxo');if(!e)return;const M=ST4.mat,rA=M.map(r=>r.every(x=>x)),rS=M.map(r=>r.some(x=>x)),C=[0,1,2].map(j=>M.map(r=>r[j])),cA=C.map(c=>c.every(x=>x)),cS=C.map(c=>c.some(x=>x));
 e.innerHTML=`<table><tr><th>L(x,y)${[0,1,2].map(j=>`<th>y=${'ABC'[j]}`).join('')}<th>∃y<th>∀y</tr>${M.map((r,i)=>`<tr><th>x=${'ABC'[i]}${r.map((v,j)=>`<td><button class="cl ${v?'r':''}" onclick="mxT(${i},${j})" style="min-width:40px">${v?'✓':'·'}</button>`).join('')}<td>${sdot(rS[i])}<td>${sdot(rA[i])}</tr>`).join('')}<tr><th>∃x${cS.map(v=>`<td>${sdot(v)}`).join('')}<td><td></tr><tr><th>∀x${cA.map(v=>`<td>${sdot(v)}`).join('')}<td><td></tr></table>`+
 [['∀x∃y L(x,y)',rS.every(x=>x),'every row has a ✓'],['∃x∀y L(x,y)',rA.some(x=>x),'some row is all ✓'],['∀y∃x L(x,y)',cS.every(x=>x),'every column has a ✓'],['∃y∀x L(x,y)',cA.some(x=>x),'some column is all ✓']].map(([f,v,n])=>`<div class=ex2 style="margin:4px 0">${dot(v,null,1)}<code>${f}</code><span class=mu>${n}</span></div>`).join('')}
PRED.push({t:'3 Nested',f:()=>{PEND.push(mxDraw);
 return card('Click the grid: L(x,y)',`<div class=sc id=mxo></div>`+key('Order matters: <b>∀x∃y</b> ≠ <b>∃x∀y</b>. “Everyone loves someone” is much weaker than “someone loves everyone”.'))+`<div class=row>${prac('pred','pev','Evaluation')}</div>`}});

const IFX=['∀x(q(x)→∃y p(x,y))','∃x∀y ¬p(y,x)','∀x∀y(p(x,y)→q(x))','∃x(q(x)∧∀y¬p(x,y))'];
const IMD=[MM[0],MM[1],'dom=A,B,C; p={(A,B),(B,C),(C,A)}; q={A}'];
function graph(M){const n=M.dom.length,cx=130,cy=75,R=n>1?52:0,pos={};M.dom.forEach((d,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;pos[d]=[cx+R*Math.cos(a),cy+R*Math.sin(a)]});
 const Pset=M.p.p||new Set(),qset=M.p.q||new Set(),r=17;let h='';
 [...Pset].forEach(t=>{const [a,b]=t.split(',');if(!pos[a]||!pos[b])return;const [x1,y1]=pos[a],[x2,y2]=pos[b];
  if(a==b)h+=`<path class=a d="M${x1-9},${y1-r+2} C${x1-30},${y1-r-30} ${x1+30},${y1-r-30} ${x1+9},${y1-r+2}"/>`;
  else{const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,ox=-uy*5,oy=ux*5;h+=`<path class=a d="M${x1+ux*r+ox},${y1+uy*r+oy} L${x2-ux*(r+3)+ox},${y2-uy*(r+3)+oy}"/>`}});
 M.dom.forEach(d=>{const [x,y]=pos[d],q=qset.has&&qset.has(d);h+=`<circle class="${q?'g':'b'}" cx=${x} cy=${y} r=${r} /><text class=t x=${x} y=${y+5}>${esc(d)}</text>`});
 return svg(260,150,h)}
window.ifRun=()=>{try{const M=pint(IMD[+$('#imd').value]),f=parse(IFX[+$('#ifx').value],1);$('#ifo').innerHTML=graph(M)+`<div class=ex2>${ck('→ arrow = p(x,y)','b')}${ck('green node = q(x)','a')}</div>`+pres(f,M)}catch(e){$('#ifo').innerHTML='<span class=no>'+esc(e.message)+'</span>'}};
PRED.push({t:'4 Interpretations',f:()=>{PEND.push(ifRun);
 const fn=svg(300,100,`<circle class=b cx=70 cy=50 r=18 /><text class=t x=70 y=55>A</text><circle class=b cx=190 cy=50 r=18 /><text class=t x=190 y=55>B</text><path class=a d="M88,44 L172,44"/><text class=s x=130 y=36>m(A)=B</text><path class=a d="M200,34 C230,6 250,36 208,40"/><text class=s x=244 y=20>m(B)=B</text>`);
 return card('An interpretation = a picture',`<div class=row>${sel('imd',['model 1','model 2','model 3'],'ifRun')}${sel('ifx',IFX,'ifRun')}</div><div id=ifo></div>`+key('Domain = nodes · p = arrows · q = green nodes. Check the formula on every element.'))+
 card('Function symbols = every element points to an element',fn+`<span class=mu>m(x) = mother of x → <code>∀x L(x, m(x))</code>. Give a value for every argument: <code>m(A)=B; m(B)=B</code></span>`)+`<div class=row>${prac('pred','pev','Evaluation')}</div>`}});

const SKX=['∀X∃Y p(X,Y)','∃X∀Y ¬(∃Y p(X,Y)→q(X,Y)) ∨ ∀Z r(Z)','∀X(p(X)→∃Y(q(Y)∧r(X,Y)))','¬∀X(p(X)→q(X))'];
window.skRun=()=>{try{const f=FO.parseFO(SKX[+$('#skx').value]),r=FO.clausify(f,FO.names(f)),PIPE=['↔ →','¬ in','∀∃ left','Skolem','CNF','clauses'],pi=t=>/Remove/.test(t)?0:/inwards|Rename/.test(t)?1:/quantifiers/.test(t)?2:/Eliminate/.test(t)?3:/Distribute|SNF/.test(t)?4:/Clausal/.test(t)?5:-1;
 gset('sk',r.steps.map(s=>`<div class=ex2>${PIPE.map((n,j)=>ck(n,j==pi(s.t)?'b':'')).join('<span class=mu>›</span>')}</div><div class=ins>${esc(s.t)}</div>${s.r?`<span class=mu>${esc(s.r)}</span>`:''}<div class=f>${esc(s.f)}</div>`))}catch(e){$('#g_sk').innerHTML='<span class=no>'+esc(e.message)+'</span>'}};
PRED.push({t:'5 Skolem',f:()=>{PEND.push(skRun);
 const dep=svg(440,100,`${bx(10,10,130,32,'∀X ∃Y p(X,Y)','b2')}${ar(140,26,190,26)}${bx(190,10,140,32,'∀X p(X, f(X))','g')}<text class=s x=185 y=60>Y depends on X → new function f(X)</text>${bx(10,66,100,28,'∃X p(X)','b2')}${ar(110,80,190,80)}${bx(190,66,100,28,'p(a)','g')}<text class=s x=300 y=84>no ∀ before → constant a</text>`);
 return card('Eliminate ∃ with Skolem symbols',dep+key('Keeps <b>satisfiability</b>, not equivalence.'))+
 card('Watch a formula become clauses',`<div class=row>${sel('skx',SKX,'skRun')}</div><div id=g_sk></div>`)+
 `<div class=row>${prac('pred','snf','Normal forms')}${btn('Steps trainer','S.d=\'pred\';S.m=\'prac\';S.c=\'nfi\';S.i=0;go()')}</div>`}});

const UNX=['p(f(X),Z), p(Y,a)','p(X,a,f(g(Y))), p(f(Z),Z,f(U))','p(f(X),a), p(Y,f(U))','q(X,f(X)), q(Y,Y)'];
window.unRun2=()=>{try{const u=FO.unifyHTML(UNX[$('#unx')?+$('#unx').value:0]),r=u.r,last=r.steps.length?r.steps[r.steps.length-1].mu:'{ }',T0=r.steps.length?r.steps[0].T:r.T,tl=a=>a.map(t=>`<div class=f style="font-size:15px">${esc(t)}</div>`).join('');
 const h=[`<div class=ins>start: μ₀ = { }</div>${tl(T0)}`];
 r.steps.forEach((s,i)=>h.push(`${tl(s.T)}<div class=ex2>${ck('D = { '+esc(s.D.join(', '))+' }','c')}${ck('δ = '+esc(s.d),'b')}${ck('μ = '+esc(s.mu),'a')}</div>`));
 h.push(r.ok?`${tl(r.T)}<b class=ok>✓ identical ⇒ unifiable · m.g.u. = ${esc(last)}</b>`:`<b class=no>✗ not unifiable</b><br><span class=mu>${esc(r.why)}</span>`);gset('un',h)}catch(e){$('#g_un').innerHTML='<span class=no>'+esc(e.message)+'</span>'}};
PRED.push({t:'6 Unify',f:()=>{PEND.push(unRun2);
 const d=svg(440,70,`${bx(10,16,110,36,'f(X)','b2')}<text class=t x=150 y=38>vs</text>${bx(180,16,70,36,'Y','b')}${ar(255,34,300,34)}${bx(300,16,130,36,'δ = {Y / f(X)}','g')}`);
 return card('Make two terms equal',d+`<div class=row>${sel('unx',UNX,'unRun2')}</div><div id=g_un></div>`+key('Find the <b>disagreement set</b> D, bind a variable to a term (never a term containing that variable: occurs check), repeat.'))+
 `<div class=row>${prac('pred','unif','Unification')}${btn('🧪 Unifier','S.d=\'pred\';S.m=\'sim\';go()')}</div>`}});

PRED.push({t:'7 Resolution',f:()=>{
 const u=FO.unifyHTML('p(X), p(a)').r,sg=u.steps.length?u.steps[u.steps.length-1].mu:'{ }';
 const rs=FO.resolveHTML(B.pres[0][1],B.pres[0][2]);
 const f=svg(460,100,`${bx(6,10,150,34,'¬p(X) ∨ q(X)','b2','C1')}${bx(6,56,150,34,'p(a)','b2','C2')}${ar(158,27,214,44)}${ar(158,73,214,56)}${bx(214,34,100,32,'σ = '+sg,'b','mgu{p(X),p(a)}')}${ar(316,50,350,50)}${bx(350,34,100,32,'q(a)','g','resolvent')}`);
 return card('Resolution with unification',f+key('From <code>G ∨ ¬E1</code> and <code>H ∨ E2</code> with σ = mgu{E1,E2} derive <code>Gσ ∨ Hσ</code>. Rename the variables of the clauses apart first. Deriving □ ⇒ inconsistent.'))+
 card('Dog example: ∀X(dog→animal), dog(bobby), ∀Y(animal→die) ⊨ die(bobby)',`<details><summary>Show the refutation</summary>${rs.h}</details>`)+
 `<div class=row>${prac('pred','pres','Resolution')}${btn('Contradiction tab','S.d=\'pred\';S.m=\'ct\';go()')}</div>`}});

/* ---- render ---- */
function render(dom,CHL){PEND.length=0;const k='tc'+dom,i=S[k]||0;
 $('#M').innerHTML=`<div class=row>${CHL.map((c,j)=>`<button class="pl ${j==i?'on':''}" onclick="tcGo('${dom}',${j})">${c.t}</button>`).join('')}</div>`+CHL[i].f()+`<div class=row><button ${i?'':'disabled'} onclick="tcGo('${dom}',${i-1})">← Back</button><button class=on ${i<CHL.length-1?'':'disabled'} onclick="tcGo('${dom}',${i+1})">Next →</button></div>`;
 PEND.forEach(f=>f())}
window.tcGo=(d,i)=>{S['tc'+d]=i;tut();window.scrollTo(0,0)};
const oldTut=tut;
tut=function(){if(S.d=='prop')render('prop',PROP);else if(S.d=='pred')render('pred',PRED);else oldTut()};
nav();go();
})();

/* ===== Visual "How to solve this" box: icon step-flow + clickable worked example ===== */
(function(){
const H={};
const c=t=>`<code>${t}</code>`;
/* entry: t title, ic icon, s steps [icon,text], q worked problem, w [[what we do, result]], a final answer */
H.wff={t:'Is it well formed?',ic:'🔍',s:[['➕','Every <b>∧ ∨ → ↔</b> needs a formula on <b>both</b> sides'],['¬','<b>¬</b> needs exactly one formula right after it'],['( )','Brackets balanced, never empty'],['🚫','Two atoms side by side are never allowed']],
 q:c('(q∧∨r)'),w:[['Look at ∧: left side is q ✓','q ∧ …'],['Right side of ∧ is ∨ — not a formula ✗','∧ ∨']],a:'Not well formed ✗'};
H.formal={t:'Formalization',ic:'✍️',s:[['🔤','Name the <b>atoms</b>: one letter per simple sentence'],['🔁','Translate: <i>not</i> ¬ · <i>and</i> ∧ · <i>or</i> ∨ · <i>if…then</i> → · <i>only if</i> (p only if q) = p→q'],['( )','Add brackets for structure'],['✅','Test one row mentally']],
 q:'“We play only if it is not raining.”',w:[['Atoms: p = we play, q = it rains','p, q'],['“only if” means p → …','p → …'],['“not raining” is ¬q','p → ¬q'],['Check q=T,p=T: ¬q is F, so false ✓ (no play in rain)','✓']],a:c('p→¬q')};
H.evalp={t:'Evaluation',ic:'🧮',s:[['📝','Write T/F under every atom'],['🎯','Evaluate the <b>innermost</b> brackets first'],['➡️','Work outwards one connective at a time']],
 q:c('¬(p∧q)→r')+' with p=T, q=F, r=F',w:[['p∧q = T∧F','F'],['¬(p∧q) = ¬F','T'],['T → r = T → F','F']],a:'The formula is false'};
H.cnf={t:'CNF',ic:'🔧',s:[['','Remove <b>↔</b> and <b>→</b>: A→B ≡ ¬A∨B'],['','Push <b>¬</b> inward (De Morgan), cancel ¬¬'],['','Distribute: A∨(B∧C) ≡ (A∨B)∧(A∨C)'],['','Simplify duplicates and tautologies']],
 q:c('¬(p∨q)→r'),w:[['Remove →','¬¬(p∨q) ∨ r'],['Cancel ¬¬','(p∨q) ∨ r'],['Flatten: one clause','p ∨ q ∨ r']],a:'CNF = '+c('p∨q∨r')};
H.class={t:'Classification',ic:'📊',s:[['▦','Build the truth table (2ⁿ rows)'],['👀','Look at the result column'],['🟢','All T → <b>valid</b>  ·  🟡 mix → <b>satisfiable</b>  ·  🔴 all F → <b>unsatisfiable</b>']],
 q:c('p→(q→p)'),w:[['p=T,q=T: q→p = T, so T→T','T'],['p=T,q=F: q→p = T, so T→T','T'],['p=F,q=T: F→(…) is always','T'],['p=F,q=F: F→(…) is always','T']],a:'All rows true ⇒ valid'};
H.entail={t:'Soundness',ic:'⚖️',s:[['🔎','Keep rows where <b>all premises</b> are true'],['❓','Conclusion true in all of them? ⇒ <b>sound</b>. One row where it is false = <b>counterexample</b>'],['🧩','Or resolution: premises + <b>¬conclusion</b>; reaching □ means sound']],
 q:'{p∨q, ¬p} ⊨ q ?',w:[['Premises both true only if p=F, q=T','p=F q=T'],['In that row the conclusion q is','T ✓'],['Resolution check: clauses p∨q, ¬p, ¬q. (p∨q)+(¬p)','q'],['q + ¬q','□']],a:'Sound ✓'};
H.puz={t:'Puzzles',ic:'🧩',s:[['✍️','Write each statement as a formula'],['📋','List the possibilities (rows)'],['✂️','Keep rows where the story’s conditions hold; read off the answer']],
 q:'A says “B did it”. B says “I did not do it”.',w:[['A: formula B. B: formula ¬B','B, ¬B'],['The two statements are opposites','exactly one is true'],['Use the story’s extra condition to choose the row','…']],a:'Decide by the extra condition in the puzzle'};
H.cnfi={t:'CNF step trainer',ic:'🎮',s:[['💡','Stuck? the hint names the next rule'],['🔘','Pick a <b>rule</b> button'],['👆','Click the <b>connective</b> where it applies'],['🏁','Done when it is only clauses']],
 q:c('p→q'),w:[['Choose the → rule','→'],['Click the arrow in the formula','¬p ∨ q']],a:'A single clause: finished ✓'};
H.pev={t:'Evaluating in a model',ic:'🏛️',s:[['📦','List the <b>domain</b> and each predicate’s extension'],['∀','<b>∀x</b>: every element must work  ·  ∃<b>x</b>: one is enough'],['🪆','Nested: do the inner quantifier for each outer value']],
 q:'dom = {A,B}, p = {(A,B),(B,B)}; '+c('∀x∃y p(x,y)'),w:[['x=A: choose y=B, (A,B)∈p','✓'],['x=B: choose y=B, (B,B)∈p','✓']],a:'Every x has a partner ⇒ true'};
H.pform={t:'Predicate formalization',ic:'🗣️',s:[['🏷️','Pick predicates: D(x) = x is a dog'],['🧱','All S are P → ∀x(S→P) · Some S are P → ∃x(S∧P) · No S is P → ¬∃x(S∧P)'],['⚠️','Traps: never ∀x(S∧P), never ∃x(S→P)']],
 q:'“Every dog barks”',w:[['Predicates D(x), B(x)','D, B'],['“All S are P” pattern ∀x(S→P)','∀x(D(x)→B(x))']],a:c('∀x(D(x)→B(x))')};
H.snf={t:'Skolem normal form',ic:'🧪',s:[['','Remove ↔ →; push ¬ inward'],['','Rename variables apart'],['','Quantifiers to the front'],['','Replace ∃: constant, or f(preceding ∀ vars)'],['','Drop ∀, CNF the rest']],
 q:c('∀X(p(X)→∃Y q(X,Y))'),w:[['Remove →','∀X(¬p(X) ∨ ∃Y q(X,Y))'],['Pull ∃Y out','∀X∃Y(¬p(X) ∨ q(X,Y))'],['Y depends on X ⇒ Y := f(X)','∀X(¬p(X) ∨ q(X,f(X)))'],['Drop ∀','¬p(X) ∨ q(X,f(X))']],a:'One clause '+c('¬p(X)∨q(X,f(X))')};
H.nfi={t:'Normal form trainer',ic:'🎮',s:[['🔘','Pick a rule'],['👆','Click the symbol where it applies'],['🔁','Repeat until only clauses remain']],
 q:c('¬∀X p(X)'),w:[['Rule “¬ in”, click ¬','∃X ¬p(X)'],['Skolemize ∃X with constant a','¬p(a)']],a:c('¬p(a)')};
H.unif={t:'Unification',ic:'🔗',s:[['📄','Write the expressions one under the other'],['🔍','Find the first <b>disagreement</b>'],['🔀','Bind variable := term (occurs check!). Different functions ⇒ fail'],['🔁','Apply and repeat until identical']],
 q:c('p(X,f(a))')+' and '+c('p(b,Y)'),w:[['First difference: X vs b','X / b'],['Apply: p(b,f(a)) vs p(b,Y). Next: f(a) vs Y','Y / f(a)'],['Both identical now','mgu']],a:'mgu = {X/b, Y/f(a)}'};
H.pres={t:'Resolution',ic:'🧬',s:[['➕','Premises + <b>¬conclusion</b> as clauses'],['🧲','Pick clauses with complementary literals that unify'],['✂️','Apply the mgu, write the resolvent'],['🏆','□ derived ⇒ sound']],
 q:'{∀X(p(X)→q(X)), p(a)} ⊨ q(a)',w:[['Clauses: ¬p(X)∨q(X), p(a), ¬q(a)','3 clauses'],['Resolve 1+2 with X/a','q(a)'],['Resolve q(a) with ¬q(a)','□']],a:'□ reached ⇒ sound'};
H.c_sem={t:'Semantic function',ic:'⚙️',s:[['','Start vector: k≥j pad zeros · k&lt;j keep first k inputs'],['▶️','Run statement by statement'],['🔄','Re-check each loop test; never false ⇒ <b>⊥</b>'],['🎯','Answer is final <b>X1</b>']],
 q:c('X2:=0; while X2≠X1 do begin X2:=succ(X2); X3:=succ(X3) end; X1:=X3')+' on input 2',w:[['Start (X1,X2,X3)','(2,0,0)'],['Loop: X2≠X1 → +1 both','(2,1,1)'],['Loop again','(2,2,2)'],['X2=X1: stop. X1:=X3','(2,2,2)']],a:'φ(2) = 2'};
H.c_trace={t:'State vector',ic:'📈',s:[['📝','Write the initial vector'],['👣','Update after each statement'],['❓','Tests only choose; they don’t change values'],['🏁','Last vector is the answer']],
 q:c('X1:=succ(X2); X2:=pred(X1)')+' from (0,3)',w:[['Start','(0,3)'],['X1:=succ(X2)=4','(4,3)'],['X2:=pred(X1)=3','(4,3)']],a:'Final vector (4,3). pred never goes below 0'};
H.c_et={t:'Macro-test E_T',ic:'🔣',s:[['','Base: X&lt;Y ↦ Y∸X (others by swapping/negating)'],['','∧ ↦ <b>*</b> · ∨ ↦ <b>+</b> · ¬ ↦ <b>1∸E</b>'],['','Check: positive if true, 0 if false']],
 q:c('X>Y ∧ Z=0'),w:[['X>Y ↦ X∸Y','X∸Y'],['Z=0 ↦ 1∸Z','1∸Z'],['∧ ↦ *','(X∸Y)*(1∸Z)']],a:'X=3,Y=1,Z=0: 2·1=2>0 ✓; Z=2: 2·0=0 ✓'};
H.c_wpd={t:'Writing a while program',ic:'🛠️',s:[['💡','Find the idea (counter U up to a bound)'],['🏁','Initialise result and counter'],['🔄','Loop: body + U:=succ(U)'],['🧪','Test by hand on 0 and a small value']],
 q:'Z := 3·X',w:[['Idea: add X three times','counter 0→3'],['Init','Z:=0; U:=0; V:=3'],['Loop','while U≠V do Z:=Z+X; U:=succ(U)'],['Test X=2: Z = 0,2,4,6','6 ✓']],a:'<pre class=f>begin\n  Z:=0; U:=0; V:=3;\n  while U≠V do\n  begin Z:=Z+X; U:=succ(U) end\nend</pre>'};
H.c_tmq={t:'Running a Turing machine',ic:'🎞️',s:[['📼','Input n = n+1 ones, head on first 1'],['🔍','Read (state, symbol) → write, move, new state'],['🛑','Stop when no transition applies'],['🔢','In final state? count the 1s, else ⊥']],
 q:c('(q0,1,0,R,q1)')+', final {q1}, input 2',w:[['Tape 1 1 1, state q0','<b>q0</b> 1 1 1'],['Write 0, move R, go q1','0 <b>q1</b> 1 1'],['No rule for q1: halt in final state','halt']],a:'Two 1s left ⇒ φ(2) = 2'};
H.c_tmd={t:'Designing a Turing machine',ic:'🏗️',s:[['🎯','Write input form and desired output'],['💡','Plan the trick: erase, skip, copy…'],['📜','One transition per (state, symbol)'],['🧪','End in a final state; test 0 and small n']],
 q:'f(x) = x',w:[['Input x+1 ones, need x','erase one 1'],['Transition','(q0,1,0,H,qf)'],['Test x=2: 111 → 0 11','2 ones ✓']],a:'<pre class=f>(q0,1,0,H,qf)\nfinal: qf</pre>'};
H.c_smn={t:'Parametrization (s-m-n)',ic:'🧷',s:[['⬆️','Shift free inputs up: X(m+k):=Xk (last first)'],['✏️','Write constants into X1..Xm'],['▶️','Then run P'],['💡','So φ_Q(x) = φ_P(C, x)']],
 q:'P computes x·y, C=3, one free input',w:[['Shift free input','X2:=X1'],['Write the constant','X1:=3'],['Run P','P'],['Evaluate φ_P(3,5)','15']],a:'φ_Q(5) = 15'};
H.c_con={t:'Concept questions',ic:'💭',s:[['📖','Recall the definition the question refers to'],['❌','Cross out options that contradict it'],['📌','Read the explanation after answering']],
 q:'Which construct can make a while program run forever?',w:[['Statements are finite','✗ not them'],['Assignments always end','✗'],['A loop can repeat forever','✓ while']],a:'The while loop'};

const KEY='ll_how_closed';let closed={};try{closed=JSON.parse(localStorage[KEY]||'{}')}catch(e){}
const st=document.createElement('style');st.textContent=`
.how{border-left:4px solid var(--ac);padding:8px 10px}
.how summary{cursor:pointer;font-size:15px}
.hsteps{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.hs{flex:1 1 130px;background:color-mix(in srgb,var(--ac) 8%,transparent);border-radius:10px;padding:6px 8px;font-size:13px;line-height:1.35;position:relative}
.hs i{font-style:normal;display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;border-radius:11px;background:var(--ac);color:#fff;font-size:11px;margin-right:5px;float:left;padding:0 3px}
.hs .ico:empty{display:none}.hs .ico{display:block;font-size:11px;opacity:.7;margin-bottom:2px}
.hex{border:2px dashed var(--ac);border-radius:10px;padding:8px;margin-top:6px}
.hex .hq{font-size:13px;margin-bottom:6px}
.hw{display:none;align-items:center;gap:6px;margin:4px 0;font-size:13px}
.hw.on{display:flex}.hw.cur{animation:hp .5s}
.hw .wh{flex:1}.hw .wr{background:var(--ac);color:#fff;border-radius:8px;padding:3px 8px;font-family:monospace;font-size:12px}
.hw .wn{background:var(--ac);color:#fff;border-radius:50%;min-width:20px;height:20px;text-align:center;line-height:20px;font-size:11px}
.hans{display:none;margin-top:6px;padding:6px 8px;border-radius:8px;background:#2e9e5b22;border:1px solid #2e9e5b;font-size:13px}
.hans.on{display:block}
.hbtn{margin-top:6px;font-size:13px}
@keyframes hp{from{transform:translateX(-8px);opacity:0}to{transform:none;opacity:1}}`;
document.head.appendChild(st);
window.howTog=el=>{closed[el.dataset.c]=!el.open;try{localStorage[KEY]=JSON.stringify(closed)}catch(e){}};
window.howNext=b=>{const d=b.closest('.hex'),ws=[...d.querySelectorAll('.hw')],n=ws.filter(x=>x.classList.contains('on')).length;
 ws.forEach(x=>x.classList.remove('cur'));
 if(n<ws.length){ws[n].classList.add('on','cur');}else if(!d.querySelector('.hans').classList.contains('on')){d.querySelector('.hans').classList.add('on');}else{ws.forEach(x=>x.classList.remove('on'));d.querySelector('.hans').classList.remove('on');}
 const m=ws.filter(x=>x.classList.contains('on')).length,a=d.querySelector('.hans').classList.contains('on');
 b.textContent=a?'↺ Restart':(m<ws.length?`▶ Next step (${m}/${ws.length})`:'✔ Show result');};
function howBox(k){const h=H[k];if(!h)return'';
 return `<details class="card how" data-c="${k}" ${closed[k]?'':'open'} ontoggle="howTog(this)"><summary>${h.ic} <b>How to solve this</b> · ${h.t}</summary>
<div class=hsteps>${h.s.map((s,i)=>`<div class=hs><i>${i+1}</i><span class=sp>${s[0]?`<span class=ico>${s[0]}</span>`:''}${s[1]}</span></div>`).join('')}</div>
<div class=hex><div class=hq>🧪 <b>Worked example</b> (a different problem than yours): ${h.q}</div>
${h.w.map((w,i)=>`<div class=hw><span class=wn>${i+1}</span><span class=wh>${w[0]}</span><span class=wr>${w[1]}</span></div>`).join('')}
<div class=hans>✅ <b>Answer:</b> ${h.a}</div>
<button class="hbtn" onclick="howNext(this)">▶ Next step (0/${h.w.length})</button></div></details>`}
window.HOW=H;
const oldExH=exH;
exH=function(e){return (window.NOHELP?'':howBox(e.c))+oldExH(e)};
})();

