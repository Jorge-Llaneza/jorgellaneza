/* ===== final polish: layout, accessibility, consistency ===== */
(function(){
const st=document.createElement('style');st.id='polish';st.textContent=`
body{padding-bottom:70px;-webkit-text-size-adjust:100%}
#M svg{max-width:620px;height:auto;display:block;margin:6px auto}
select,input,textarea{max-width:100%;box-sizing:border-box}
button{transition:background .15s,border-color .15s,transform .06s}
button:hover{border-color:var(--ac)}button:active{transform:scale(.97)}
button:focus-visible,summary:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid color-mix(in srgb,var(--ac) 45%,transparent);outline-offset:2px}
summary{cursor:pointer}
/* "How to solve this" box: same look as other cards, cleaner steps */
details.how{background:var(--cd);border:1px solid var(--bd);border-left:4px solid var(--ac);border-radius:12px;padding:10px 14px;margin:8px 0}
details.how>summary{list-style:none;display:block;position:relative;padding-right:22px}
details.how>summary::-webkit-details-marker{display:none}
details.how>summary:after{content:"▾";position:absolute;right:2px;top:0;color:var(--mu)}
details.how:not([open])>summary:after{content:"▸"}
.hsteps{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px}
.hs{display:flex;gap:7px;align-items:flex-start;flex:none;padding:7px 9px}
.hs i{float:none;flex:none;margin:0}
.hs .ico{display:inline;margin:0 4px 0 0;opacity:1;font-size:13px}
.hs>.sp{flex:1;min-width:0}
.hex{background:color-mix(in srgb,var(--ac) 5%,transparent)}
.hbtn{font-size:13px;padding:5px 12px}
/* the app's theme CSS leaks the "dopamine" gradient onto every details.card (comma-list bug): restore normal cards */
html:not([data-xt="dopamine"]) details.card{animation:none!important;border:1px solid var(--bd)!important;background:var(--cd)!important;background-size:auto!important}
html:not([data-xt="dopamine"]) details.how{border-left:4px solid var(--ac)!important}
/* solutions */
.card.sol{border-left:4px solid var(--ok)}
.solb{background:var(--ok)!important}
/* compact navigation on small screens */
@media(max-width:600px){#n1 button,#n2 button,#n3 button,#n4 button{padding:5px 9px;font-size:13px}.row{gap:5px}#mpback{opacity:.75}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media print{#mpback,#n1,#n2,#n3{display:none}}`;
document.head.appendChild(st);
})();

/* ===== Tests tab: past exams (Oviedo) + random test generator ===== */
(function(){
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const PREDC=['pev','pform','snf','nfi','unif','pres'];
const domOf=c=>c==='nd'?'prop':c.startsWith('c_')?'comp':PREDC.includes(c)?'pred':'prop';
const withDom=(d,f)=>{const o=S.d;S.d=d;try{return f()}finally{S.d=o}};
const pk=a=>a[Math.floor(Math.random()*a.length)];
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const TMODES={exams:'Past exams',gen:'Random test',hist:'My results',ref:'ND rules'};
CATS.test={x:'x'};

/* ---------- Natural deduction templates (lines: formula, rule, box depth) ---------- */
const NDT=[
 {id:'A',pred:0,prem:['q→r','¬r↔¬s'],goal:'q∨s→r',L:[['q→r','Premise',0],['¬r↔¬s','Premise',0],['¬r→¬s','↔E 2',0],['q∨s','Assumption',1],['s','Assumption',2],['¬r','Assumption',3],['¬s','→E 3,6',3],['s∧¬s','∧I 5,7',3],['r','¬E 6-8',2],['s→r','→I 5-9',1],['r','∨E 4,1,10',1],['q∨s→r','→I 4-11',0]],
  gf:[2,3,5,6,8,10],gr:[7,8,10,11]},
 {id:'B',pred:1,prem:['∃x p(x)','∀x(q(x)→¬p(x))'],goal:'∃x¬q(x)',L:[['∃x p(x)','Premise',0],['∀x(q(x)→¬p(x))','Premise',0],['p(a)','Assumption (a free)',1],['q(a)→¬p(a)','∀E 2',1],['q(a)','Assumption',2],['¬p(a)','→E 4,5',2],['p(a)∧¬p(a)','∧I 3,6',2],['¬q(a)','¬I 5-7',1],['∃x¬q(x)','∃I 8',1],['∃x¬q(x)','∃E 1,3-9',0]],
  gf:[5,7],gr:[3,5,6,7,8,9]},
 {id:'C',pred:0,prem:['p→q','q→r'],goal:'p→r',L:[['p→q','Premise',0],['q→r','Premise',0],['p','Assumption',1],['q','→E 1,3',1],['r','→E 2,4',1],['p→r','→I 3-5',0]]},
 {id:'D',pred:0,prem:['p∧q'],goal:'q∧p',L:[['p∧q','Premise',0],['p','∧E 1',0],['q','∧E 1',0],['q∧p','∧I 3,2',0]]},
 {id:'E',pred:0,prem:['p→q','¬q'],goal:'¬p',L:[['p→q','Premise',0],['¬q','Premise',0],['p','Assumption',1],['q','→E 1,3',1],['q∧¬q','∧I 4,2',1],['¬p','¬I 3-5',0]]},
 {id:'F',pred:1,prem:['∀x(p(x)→q(x))','p(a)'],goal:'q(a)',L:[['∀x(p(x)→q(x))','Premise',0],['p(a)','Premise',0],['p(a)→q(a)','∀E 1',0],['q(a)','→E 3,2',0]]},
 {id:'G',pred:1,prem:['∀x p(x)'],goal:'∃x p(x)',L:[['∀x p(x)','Premise',0],['p(a)','∀E 1',0],['∃x p(x)','∃I 2',0]]},
 {id:'H',pred:0,prem:['p∨q','p→r','q→r'],goal:'r',L:[['p∨q','Premise',0],['p→r','Premise',0],['q→r','Premise',0],['r','∨E 1,2,3',0]]},
 {id:'J',pred:1,prem:['∀x(p(x)∧q(x))'],goal:'∀x p(x)',L:[['∀x(p(x)∧q(x))','Premise',0],['p(a)∧q(a)','∀E 1',0],['p(a)','∧E 2',0],['∀x p(x)','∀I 3',0]]},
 {id:'K',pred:0,prem:['p∧q→r','p','q'],goal:'r',L:[['p∧q→r','Premise',0],['p','Premise',0],['q','Premise',0],['p∧q','∧I 2,3',0],['r','→E 1,4',0]]},
 {id:'M',pred:0,prem:['p↔q','p'],goal:'q',L:[['p↔q','Premise',0],['p','Premise',0],['p→q','↔E 1',0],['q','→E 3,2',0]]}];
function ndQ(t,pts,fixed){const T=NDT.find(x=>x.id==t.id||x===t)||t;let gf,gr;
 if(fixed&&T.gf){gf=T.gf;gr=T.gr}else{const n=T.L.length;gf=[];gr=[];for(let i=0;i<n;i++){if(T.L[i][1]=='Premise')continue;if(i<n-1&&Math.random()<.3)gf.push(i);if(Math.random()<.45)gr.push(i)}
  if(gf.length+gr.length<3){gr.push(...T.L.map((_,i)=>i).filter(i=>T.L[i][1]!='Premise'&&!gr.includes(i)).slice(0,3))}}
 return{kind:'nd',pts,T,gf,gr,pred:T.pred}}

/* ---------- past exams ---------- */
const EX=[
 {id:'e2021',title:'Exam 2020-21 · Model 1',src:'University of Oviedo · Logic & Computability',pen:0,qs:[
  {kind:'ex',pts:1,e:{c:'formal',d:['“Only if you have finished studying I will let you go to the party, and for me to let you go to the party it is necessary that you do not misbehave.”<br><span class=mu>p: you have finished studying · q: I let you go to the party · r: you misbehave</span>','(q→p)∧(q→¬r)']},sol:'Official: <code>(q→p)∧(q→¬r)</code> (or <code>q→p∧¬r</code>).'},
  {kind:'ex',pts:1.5,e:{c:'pform',d:['“Not all authors write well. However, authors that write well are read by somebody.”<br><span class=mu>A(x): x is an author · W(x): x writes well · R(x,y): x reads y</span>','¬∀x(A(x)→W(x))∧∀x(A(x)∧W(x)→∃y R(y,x))']},sol:'Official: <code>¬∀x(A(x)→W(x)) ∧ ∀x(A(x)∧W(x) → ∃y R(y,x))</code>.'},
  ndQ(NDT[0],2.5,true),
  {kind:'ex',pts:1.75,e:{c:'snf',d:'∀Y(¬∃X r(f(X),Y)→¬∃Z(q(Z)∨p(Y,Z)))'},sol:'Official: eliminate →, move ¬ inwards, move quantifiers left (<code>∀Y∃X∀Z</code>), eliminate ∃X with <code>X/g(Y)</code>, distribute: <code>{ r(f(g(Y)),Y) ∨ ¬q(Z), r(f(g(Y)),Y) ∨ ¬p(Y,Z) }</code>.'},
  {kind:'ex',pts:1.75,e:{c:'pres',d:['Exam 2020-21',['∀X∀Y(p(X)∨¬r(X,f(Y)))','∀X∀Y(q(X)∨r(X,Y))','¬p(a)'],'∃X q(X)']},sol:'Official: clauses <code>p(X)∨¬r(X,f(Y))</code>, <code>q(X)∨r(X,Y)</code>, <code>¬p(a)</code>, <code>¬q(X)</code>. R(1,3) with {X/a} gives <code>¬r(a,f(Y))</code>; R(2,5) gives <code>q(a)</code>; R(4,6) gives □. Sound.'},
  {kind:'ex',pts:1.5,e:{c:'pev',d:['∀Y¬∀X(p(X,Y)→q(X)∨r(Y))','dom=1,2; p={(1,1),(2,1),(2,2)}; q={1}; r={}']},sol:'Official: the formula is <b>true</b>. For Y=1 take X=2 (p(2,1) true, q(2) false, r(1) false); for Y=2 take X=2 as well.'}]},
 {id:'f2020',title:'Final exam · 14 July 2020',src:'University of Oviedo · Logic',pen:.25,qs:[
  {kind:'ex',pts:1,e:{c:'formal',d:['“I will have ice-cream for dessert unless they serve brownie or cheesecake.”<br><span class=mu>p: I will have ice-cream · q: they serve brownie · r: they serve cheesecake</span>','¬p→(q∨r)']},sol:'Official: <code>¬p → (q ∨ r)</code>.'},
  {kind:'ex',pts:1.5,e:{c:'pform',d:['“All those who play soccer like sports, however not all those who like sports play soccer.”<br><span class=mu>P(x,y): x plays y · L(x): x likes sports · a: soccer</span>','∀x(P(x,a)→L(x))∧∃x(L(x)∧¬P(x,a))']},sol:'Official: <code>∀x(P(x,a)→L(x)) ∧ ∃x(L(x)∧¬P(x,a))</code>.'},
  {kind:'ex',pts:1.5,pre:'Determine, <b>by contradiction</b>, whether this formula is valid. Try to find an interpretation that makes it false.',e:{c:'class',d:'(q→t)∧(t∨p→q)∧(p∨t↔r)→(q↔r)'},sol:'Official: suppose it is false: the antecedent is T and <code>q↔r</code> is F. Case q=T, r=F: (q→t) forces t=T, but then <code>p∨t↔r</code> is T↔F = F, contradiction. Case q=F, r=T: <code>t∨p→q</code> forces t=F and p=F, but then <code>p∨t↔r</code> is F↔T = F, contradiction. Every case fails, so the formula is <b>valid</b>.'},
  ndQ(NDT[1],2.5,true),
  {kind:'ex',pts:2.5,e:{c:'pres',d:['Final 14/07/2020',['∀X∀Y((¬r(Y,X)∧p(X))→¬q(Y,X))','∃X¬(p(X)→∃Y r(Y,X))'],'∃X(p(X)∧∀Y¬q(Y,X))']},sol:'Official clauses: <code>r(Y,X)∨¬p(X)∨¬q(Y,X)</code>, <code>p(a)</code>, <code>¬r(Y,a)</code>, <code>¬p(X)∨q(f(X),X)</code>. Resolving 1 and 3 gives <code>¬p(a)∨¬q(Y,a)</code>; with 4 gives <code>¬p(a)</code>; with 2 gives □. Sound.'},
  {kind:'mc',pts:1,pen:.25,q:'We have three formulas F, G and H. We know that <code>(H↔G)∨¬F</code> is <b>not</b> valid. Which one of the following formulas is necessarily satisfiable? (one right answer; a wrong answer costs 0.25)',o:['The formula G','The formula ¬F∨G','The formula G→F','The formula H→G'],a:2,sol:'Official: <b>c</b>. Not valid means some interpretation I falsifies it, so F is true and H, G differ in I. In I the formula <code>G→F</code> is true (F is true), so it is satisfiable. The others can be unsatisfiable (e.g. G = p∧¬p, H = ⊤, F = ⊤).'}]}];

/* ---------- history ---------- */
const HK='ll_tests';const hist=()=>{try{return JSON.parse(localStorage[HK]||'[]')}catch(e){return[]}};
const saveH=r=>{try{const h=hist();h.unshift(r);localStorage[HK]=JSON.stringify(h.slice(0,60))}catch(e){}};
const best=id=>Math.max(-1,...hist().filter(r=>r.id==id).map(r=>r.mark));

/* ---------- screens ---------- */
let TID=0;
window.TESTGO=()=>{if(S.test&&S.test.tid)clearInterval(S.test.tid);
 const m=S.m;({exams:TEX,gen:TGEN,hist:THIST,ref:TREF})[m in TMODES?m:'exams']()};
function TEX(){const live=S.test&&!S.test.done;
 $('#M').innerHTML=`<div class=card><h3>📝 Past exams</h3><p class=mu>Answer everything, then press <b>Finish &amp; grade</b>. You get a mark, the official-style solutions and your mistakes are saved for review.</p></div>`+
 (live?`<div class=card><b>${esc(S.test.title)}</b> is in progress. <div class=row><button class=on onclick="tResume()">Resume</button><button onclick="S.test=null;TESTGO()">Discard</button></div></div>`:'')+
 EX.map(x=>{const b=best(x.id),max=x.qs.reduce((a,q)=>a+q.pts,0);return`<div class=card><h3>${x.title}</h3><div class=mu>${x.src} · ${x.qs.length} questions · ${max} points${x.pen?' · wrong multiple-choice answers cost '+x.pen:''}</div>${b>=0?`<div style="margin-top:4px">Best mark: <b>${b.toFixed(1)}</b> / 10</div>`:''}<div class=row><button class=on onclick="tStart('${x.id}')">Start exam</button></div></div>`}).join('')}
window.tStart=id=>{const x=EX.find(e=>e.id==id);startTest({id:x.id,title:x.title,pen:x.pen,qs:x.qs.map(q=>({...q}))})};
window.tResume=()=>showTest();
const GP={
 logic:{n:'Logic exam (like the past exams)',l:[['formal',1],['pform',1.5],['class',1.5],['nd',2.5],['snf',1.75],['pres',2.5],['pev',1.5]]},
 prop:{n:'Propositional',l:[['wff',.5],['formal',1],['evalp',1],['cnf',1.5],['class',1.5],['entail',2],['nd',2.5]]},
 pred:{n:'Predicate',l:[['pform',1.5],['pev',1.5],['snf',2],['unif',1.5],['pres',2.5],['nd',2.5]]},
 comp:{n:'Computability',l:[['c_sem',1.5],['c_trace',1],['c_et',1.5],['c_tmq',1.5],['c_smn',1.5],['c_wpd',2],['c_tmd',2],['c_con',1]]}};
GP.all={n:'Everything',l:[...GP.logic.l,...GP.prop.l,...GP.pred.l,...GP.comp.l]};
function TGEN(){const g=window.TG=window.TG||{p:'logic',n:7};
 $('#M').innerHTML=`<div class=card><h3>🎲 Random test generator</h3><p class=mu>Builds a fresh test from the exercise banks. Questions are graded all at once at the end, like an exam.</p>
 <div class=mu>Kind of test</div><div class=sch>${Object.entries(GP).map(([k,v])=>`<button class="${g.p==k?'on':''}" onclick="TG.p='${k}';TG.n=GP['${k}'].l.length>12?8:GP['${k}'].l.length;TGEN()">${v.n}</button>`).join('')}</div>
 ${g.p=='logic'?'<p class=mu>Seven questions with the same structure as the real exams: formalization, predicate formalization, validity, natural deduction, clausal form, resolution and evaluation.</p>':`<div class=mu style="margin-top:6px">Number of questions: <b id=tgn>${g.n}</b></div><input type=range min=3 max=14 value=${g.n} oninput="TG.n=+this.value;$('#tgn').textContent=this.value" style="width:100%">`}
 <div class=row><button class=on onclick="tGenerate()">Generate test</button></div></div>`}
window.GP=GP;
window.TGEN=TGEN;
function mkEx(c){let e;try{e=gen(c)}catch(x){}if(!e||e.d==null)e={c,d:pk(B[c])};return e}
window.tGenerate=()=>{const g=TG,P=GP[g.p];let list;
 if(g.p=='logic')list=P.l;else{const base=shuf(P.l);list=[];while(list.length<g.n)list.push(...(list.length?shuf(P.l):base));list=list.slice(0,g.n)}
 const seen=new Set(),qs=[];
 for(const [c,pts] of list){
  if(c=='nd'){const pool=NDT.filter(t=>g.p=='prop'?!t.pred:g.p=='pred'?t.pred:true);qs.push(ndQ(pk(pool),pts,false));continue}
  let e,k=0;do{e=mkEx(c);k++}while(seen.has(c+JSON.stringify(e.d))&&k<8);seen.add(c+JSON.stringify(e.d));
  if(c=='c_con'&&e.d&&Array.isArray(e.d.o)){qs.push({kind:'ex',pts,e});continue}
  qs.push({kind:'ex',pts,e})}
 startTest({id:'rnd-'+g.p,title:'Random test · '+P.n,pen:0,qs})};

function startTest(t){t.ans={};t.t0=Date.now();t.done=0;S.test=t;S.m=S.m;showTest()}

/* control html for one question */
function qHtml(q,i){
 const head=`<div class=mu style="display:flex;justify-content:space-between"><b>Question ${i+1}</b><span>${q.pts} point${q.pts==1?'':'s'}</span></div>${q.pre?`<p>${q.pre}</p>`:''}`;
 if(q.kind=='mc')return`<div class=card id=q${i}>${head}<p>${q.q}</p><div class=mcw>${q.o.map((o,k)=>`<button class=mco onclick="tMc(${i},${k},this)"><b>${'abcd'[k]}.</b> ${o}</button>`).join('')}</div></div>`;
 if(q.kind=='nd'){const T=q.T;return`<div class=card id=q${i}>${head}<p>Fill in <b>all the gaps</b> of the natural deduction scheme:</p><div class=f>{ ${T.prem.join(',  ')} } ⊢ ${T.goal}</div>`+T.L.map((l,n)=>{const f=q.gf.includes(n),r=q.gr.includes(n);
   return`<div class=ndl style="margin-left:${l[2]*14}px"><span class=ndn>${n+1}.</span><span class=ndf>${f?`<input id=nd${i}_${n}_f placeholder="formula" autocomplete=off>`:esc(l[0])}</span><span class=ndr>${r?`<input id=nd${i}_${n}_r list=rules placeholder="rule" autocomplete=off>`:`<span class=mu>${esc(l[1])}</span>`}</span></div>`}).join('')+`<div class=mu style="margin-top:4px">Rules look like <code>→E 3,6</code>, <code>→I 5-9</code>, <code>Assumption</code>, <code>Premise</code>. Indentation shows the open boxes.</div></div>`}
 window.NOHELP=true;let h;try{h=withDom(domOf(q.e.c),()=>exH(q.e))}finally{window.NOHELP=false}
 h=h.replace(/jd\(/g,`tj(${i},`).replace(/id=(["']?)ans(["']?)/g,`id=$1ans${i}$2`).replace(/\$\((["'])#ans\1\)/g,`$('#ans${i}')`).replace(/id=(["']?)fb(["']?)/g,`id=$1fb${i}$2`)
  .replace(/<button[^>]*Hint[^>]*>[^<]*<\/button>/g,'').replace(/>Check</g,'>Save answer<');
 return`<div class=card id=q${i}>${head}${q.pre?'':''}${h.replace(/^<div class=card>/,'<div>')}</div>`}
window.tj=(i,a)=>{const T=S.test;T.ans[i]=a;const b=event&&event.target;if(b&&b.tagName=='BUTTON'){const row=b.parentElement;if(!/Save answer/.test(b.textContent)){row.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on')}else{const fb=$('#fb'+i);if(fb)fb.innerHTML='<span class=mu>✓ saved</span>'}}tProg()};
window.tMc=(i,k,b)=>{S.test.ans[i]=k;b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');tProg()};
const palRow=()=>'<div class=row>'+['¬','∧','∨','→','↔','∀','∃','⊥','(',')',';'].map(s=>`<button onmousedown="event.preventDefault()" onclick="cins('${s}')">${s}</button>`).join('')+'</div>';
function answered(T){return T.qs.filter((q,i)=>{if(q.kind=='nd')return[...document.querySelectorAll(`[id^=nd${i}_]`)].some(x=>x.value.trim());if(q.kind=='mc')return T.ans[i]!=null;const el=$('#ans'+i);return(el&&el.value.trim())||T.ans[i]!=null}).length}
window.tProg=()=>{const T=S.test,el=$('#tprog');if(el&&T)el.textContent=answered(T)+' / '+T.qs.length+' answered'};
function showTest(){const T=S.test;if(!T)return TEX();nav();
 const max=T.qs.reduce((a,q)=>a+q.pts,0);
 $('#M').innerHTML=`<div class="card tbar"><div><b>${esc(T.title)}</b><div class=mu>${max} points${T.pen?' · wrong multiple-choice answers cost '+T.pen:''}</div></div><div style="text-align:right"><div id=tclock class=f>00:00</div><div class=mu id=tprog></div></div></div>
 <datalist id=rules>${[...new Set([...RU.prop,...RU.pred])].map(r=>`<option value="${r}">`).join('')}<option value="Premise"><option value="Assumption"></datalist>`+
 T.qs.map(qHtml).map((h,i)=>h).join('')+palRow()+`<div class=row><button class=on onclick="tFinish()">Finish &amp; grade</button><button onclick="if(confirm('Leave this test? Your answers will be lost.')){S.test=null;TESTGO()}">Abandon</button></div>`;
 // restore saved choices
 T.qs.forEach((q,i)=>{const a=T.ans[i];if(a==null)return;if(q.kind=='mc'){const b=document.querySelectorAll(`#q${i} .mco`)[a];b&&b.classList.add('on')}else if(q.kind!='nd'){document.querySelectorAll(`#q${i} button`).forEach(b=>{if(b.getAttribute('onclick')&&b.getAttribute('onclick').includes(`tj(${i},'${a}')`))b.classList.add('on')})}});
 const tick=()=>{const c=$('#tclock');if(!c||S.test!==T||T.done){clearInterval(T.tid);return}const s=Math.floor((Date.now()-T.t0)/1000);c.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');tProg()};
 clearInterval(T.tid);T.tid=setInterval(tick,1000);tick();$('#M').oninput=tProg}

/* ---------- grading ---------- */
const nF=(x,pred)=>{try{return sh(pred?parse(x,1):parse(x))}catch(e){return String(x).replace(/\s+/g,'')}};
const nR=x=>{let s=String(x).replace(/\s+/g,'').replace(/->/g,'→').replace(/<->/g,'↔').replace(/Ù|\^|&/g,'∧').replace(/Ú/g,'∨').replace(/[Ì]/g,'¬');const m=s.match(/^([^0-9]*)(.*)$/);let n=m[1].replace(/[-.]/g,'').replace(/\(.*\)/,'').toLowerCase().replace('assumpt','assumption').replace('assumptionion','assumption'),r=m[2].split(/[,;]/).filter(Boolean).sort().join(',');return n+'|'+r};
function gradeNd(q,i){const T=q.T;let good=0,tot=0;const rows=[];
 T.L.forEach((l,n)=>{const f=q.gf.includes(n),r=q.gr.includes(n);let uf=l[0],ur=l[1],okf=true,okr=true;
  if(f){tot++;uf=($('#nd'+i+'_'+n+'_f')||{value:''}).value.trim();okf=!!uf&&nF(uf,T.pred)==nF(l[0],T.pred);if(okf)good++}
  if(r){tot++;ur=($('#nd'+i+'_'+n+'_r')||{value:''}).value.trim();okr=!!ur&&nR(ur)==nR(l[1]);if(okr)good++}
  rows.push(`<div class=ndl style="margin-left:${l[2]*14}px"><span class=ndn>${n+1}.</span><span class=ndf>${f?(okf?`<span class=ok>${esc(l[0])}</span>`:`<span class=no><s>${esc(uf||'—')}</s></span> ${esc(l[0])}`):esc(l[0])}</span><span class=ndr>${r?(okr?`<span class=ok>${esc(l[1])}</span>`:`<span class=no><s>${esc(ur||'—')}</s></span> ${esc(l[1])}`):`<span class=mu>${esc(l[1])}</span>`}</span></div>`)});
 return{got:q.pts*good/tot,ok:good==tot,h:`<div class=mu>${good} of ${tot} gaps correct. Correct scheme (your errors crossed out):</div>`+rows.join('')+'<p class=mu>Remember: a box opens at every <b>Assumption</b>; →I and ¬I/¬E close the box and cite its line range; ∀E/∃I replace a variable by a term; for ∃E the witness must be new.</p>'}}
window.tFinish=()=>{const T=S.test;if(!T)return;const n=answered(T);if(n<T.qs.length&&!confirm((T.qs.length-n)+' question(s) unanswered. Finish anyway?'))return;
 const res=T.qs.map((q,i)=>{let r;
  if(q.kind=='mc'){const a=T.ans[i];const ok=a===q.a;r={ok,got:a==null?0:ok?q.pts:-(q.pen||T.pen||0),h:`Correct answer: <b>${'abcd'[q.a]}. ${q.o[q.a]}</b>.`+(a==null?' <span class=mu>(blank: 0 points)</span>':'')}}
  else if(q.kind=='nd')r=gradeNd(q,i);
  else{const el=$('#ans'+i);let a=el&&el.value.trim()!==''?el.value.trim():T.ans[i];
   if(a==null||a===''){r={ok:false,got:0,h:'<span class=no>No answer.</span>'}}
   else{try{const x=withDom(domOf(q.e.c),()=>q.e.c.startsWith('c_')?CPQ.cJudge(q.e,a):judge(q.e,a));r={ok:!!x.ok,got:x.ok?q.pts:0,h:x.h}}catch(x){r={ok:false,got:0,h:'<span class=no>Could not check your answer: '+esc(x.message)+'</span>'}}}
   if(!r.ok&&S.mist.indexOf(q.e)<0)S.mist.push(q.e)}
  return r});
 const tot=Math.max(0,res.reduce((a,r)=>a+r.got,0)),max=T.qs.reduce((a,q)=>a+q.pts,0),mark=tot/max*10;
 T.done=1;clearInterval(T.tid);const secs=Math.round((Date.now()-T.t0)/1000);
 saveH({id:T.id,title:T.title,date:Date.now(),mark,score:tot,max,secs});
 try{addXP(Math.round(mark))}catch(e){}nav();
 const ok=res.filter(r=>r.ok).length;
 $('#M').innerHTML=`<div class="card tres"><div class=mu>${esc(T.title)}</div><div class=bigmark>${mark.toFixed(1)}<span> / 10</span></div><div class=pbar><i style="width:${Math.min(100,mark*10)}%"></i></div><div class=mu>${tot.toFixed(2)} of ${max} points · ${ok} of ${T.qs.length} fully correct · ${Math.floor(secs/60)}m ${secs%60}s</div><div class=row>${T.id.startsWith('rnd')?`<button class=on onclick="tGenerate()">New random test</button>`:`<button class=on onclick="tStart('${T.id}')">Retry exam</button>`}<button onclick="S.m='exams';S.i=0;go()">All exams</button><button onclick="S.m='mist';S.i=0;go()">Review mistakes (${S.mist.length})</button></div></div>`+
 T.qs.map((q,i)=>{const r=res[i],title=q.kind=='mc'?q.q:q.kind=='nd'?'Natural deduction: <code>{ '+q.T.prem.join(', ')+' } ⊢ '+q.T.goal+'</code>':null;
  let prompt='';if(!title){window.NOHELP=true;try{prompt=withDom(domOf(q.e.c),()=>exH(q.e)).replace(/<button[\s\S]*?<\/button>/g,'').replace(/<input[^>]*>|<textarea[\s\S]*?<\/textarea>/g,'').replace(/<div id=fb><\/div>/,'')}finally{window.NOHELP=false}}
  return`<div class="card ${r.ok?'rok':'rno'}"><div style="display:flex;justify-content:space-between"><b>${r.ok?'✓':'✗'} Question ${i+1}</b><span class=${r.ok?'ok':'no'}>${r.got>0?'+':''}${(+r.got.toFixed(2))} / ${q.pts}</span></div>${q.pre?`<p>${q.pre}</p>`:''}${title?`<p>${title}</p>`:`<div class=tp>${prompt.replace(/^<div class=card>|<\/div>$/g,'')}</div>`}${q.kind=='ex'?`<div class=mu>Your answer: <code>${esc(($('#ans'+i)&&$('#ans'+i).value)||T.ans[i]||'—')}</code></div>`:''}<div style="margin-top:6px">${r.h}</div>${q.sol?`<details class=card style="margin-top:6px"><summary><b>Official solution</b></summary><p>${q.sol}</p></details>`:''}${q.kind=='ex'?`<details class=card style="margin-top:6px"><summary><b>Step-by-step solution</b></summary>${solveHTML(q.e)}</details>`:''}</div>`}).join('')};

function THIST(){const h=hist();
 $('#M').innerHTML=`<div class=card><h3>📊 My results</h3>${h.length?`<p class=mu>${h.length} test${h.length>1?'s':''} taken · average mark <b>${(h.reduce((a,r)=>a+r.mark,0)/h.length).toFixed(1)}</b> / 10 · best <b>${Math.max(...h.map(r=>r.mark)).toFixed(1)}</b></p>`:'<p class=mu>No tests taken yet.</p>'}</div>`+
 h.map(r=>`<div class=card style="display:flex;justify-content:space-between;align-items:center"><div><b>${esc(r.title)}</b><div class=mu>${new Date(r.date).toLocaleString()} · ${Math.floor(r.secs/60)}m</div></div><div class="bigmark" style="font-size:24px">${r.mark.toFixed(1)}</div></div>`).join('')+(h.length?`<div class=row><button onclick="if(confirm('Delete all results?')){localStorage.removeItem('${HK}');THIST()}">Clear results</button></div>`:'')}
function TREF(){const row=(k)=>`<tr><td><b>${k}</b></td><td class=f style="font-size:14px">${esc(SC[k])}</td></tr>`;
 $('#M').innerHTML=`<div class=card><h3>📘 Natural deduction rules</h3><p class=mu>The rule sheet you get in the exam. A bracketed part <code>[A…B]</code> is a box: an assumption and what you derive inside it.</p><table class=rt>${RU.prop.map(row).join('')}</table></div><div class=card><h3>Predicate rules</h3><table class=rt>${['∀E','∀I','∃I','∃E'].map(row).join('')}</table><p class=mu><b>t free</b>: the term t must not appear in any earlier open box. For ∃E the witness must not appear in the conclusion B.</p></div>`}

/* ---------- wiring ---------- */
const oNav=nav,oGo=go,oSetDom=setDom;
nav=function(){oNav();if(S.d=='test'){$('#n2').innerHTML=Object.entries(TMODES).map(([k,v])=>`<button class="${S.m==k?'on':''}" onclick="S.m='${k}';S.i=0;go()">${v}</button>`).join('')+`<span class=mu style="align-self:center">⭐ ${SV.xp}</span>`;$('#n3').innerHTML=''}
 $('#n1').insertAdjacentHTML('beforeend',`<button class="${S.d=='test'?'on':''}" onclick="setDom('test')">Tests 📝</button>`)};
setDom=window.setDom=function(k){if(k=='test'){S.d='test';if(!(S.m in TMODES))S.m='exams';S.c='x';S.i=0;go();return}oSetDom(k)};
go=function(){if(S.d=='test'){nav();TESTGO();return}oGo()};
const st=document.createElement('style');st.textContent=`
.tbar{display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:50}
.ndl{display:grid;grid-template-columns:28px minmax(0,1fr) minmax(90px,150px);gap:6px;align-items:center;padding:3px 0 3px 8px;border-left:2px solid var(--ac);margin-top:3px;font-family:ui-monospace,monospace;font-size:14px}
.ndl input{width:100%;font-size:14px;padding:3px 6px}
.ndn{color:var(--mu)}
.mcw{display:grid;gap:6px}.mco{text-align:left}
.bigmark{font-size:44px;font-weight:700;color:var(--ac)}.bigmark span{font-size:18px;color:var(--mu)}
.pbar{height:8px;border-radius:4px;background:var(--bd);overflow:hidden;margin:6px 0}.pbar i{display:block;height:100%;background:var(--ac)}
.card.rok{border-left:4px solid var(--ok)}.card.rno{border-left:4px solid var(--no)}
.rt{width:100%;border-collapse:collapse}.rt td{padding:5px 6px;border-bottom:1px solid var(--bd);vertical-align:top}
.tp .row,.tp button{display:none}`;
document.head.appendChild(st);
nav();go();
})();

