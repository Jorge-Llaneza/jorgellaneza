/* COM · Logic. UI, spaced repetition, workshops and mock exams.
   Starts once kv.js has loaded the saved data (KV.ready). */
"use strict";
KV.ready.then(main);

function main(){
/* ============================ DATA ============================ */
const TOPICS={
  p1:{name:"L0 · Formalization",short:"L0 formalization",color:"var(--p1)"},
  p2:{name:"L0 · Semantics and logical consequence",short:"L0 semantics",color:"var(--p2)"},
  p3:{name:"L0 · Clausal form, resolution and natural deduction",short:"L0 resolution & ND",color:"var(--p3)"},
  q1:{name:"L1 · Syntax and formalization",short:"L1 formalization",color:"var(--q1)"},
  q2:{name:"L1 · Interpretations and AND/OR trees",short:"L1 semantics",color:"var(--q2)"},
  q3:{name:"L1 · Clausal form, unification and resolution",short:"L1 resolution",color:"var(--q3)"},
  q4:{name:"L1 · Natural deduction and properties",short:"L1 ND",color:"var(--q4)"}
};
const TK=Object.keys(TOPICS);
const hash=s=>{ let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36); };
const Q=Q_L0.concat(Q_L1).map(q=>Object.assign({},q,{id:"q"+hash(q.q+"|"+q.o.join("|"))}));
(function(){ const seen={}; Q.forEach((q,i)=>{ if(seen[q.id]) q.id+="-"+i; seen[q.id]=1; }); })();
const F=F_RAW.map(x=>({id:"f"+hash(x[1]),t:x[0],f:x[1],b:x[2]}));
const GEN=LG.GEN, GK=Object.keys(GEN);

/* ============================ STATE ============================ */
const KEY="com-logica-v1", MIN=6e4, HOUR=36e5, DAY=864e5;
function defState(){ return {q:{},f:{},read:{},sims:[],conf:{sure:[0,0],doubt:[0,0],guess:[0,0]},gen:{},nd:{},settings:{examDate:"",n:11,minutes:40,pen:0.25,gens:3},days:[],theme:""}; }
let S=(function(){ try{ const raw=KV.getItem(KEY); if(raw){ const s=JSON.parse(raw), d=defState(); return Object.assign(d,s,{settings:Object.assign(d.settings,s.settings||{}),conf:Object.assign(d.conf,s.conf||{})}); } }catch(e){} return defState(); })();
function save(){ try{ KV.setItem(KEY,JSON.stringify(S)); }catch(e){} }
const dayKey=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function touchDay(){ const t=dayKey(new Date()); if(!S.days.includes(t)){ S.days.push(t); save(); } renderStreak(); }
function streak(){ let n=0; const set=new Set(S.days), d=new Date(); if(!set.has(dayKey(d))) d.setDate(d.getDate()-1);
  while(set.has(dayKey(d))){ n++; d.setDate(d.getDate()-1); } return n; }
function renderStreak(){ const n=streak(); document.getElementById("hdrStreak").textContent=n+(n===1?" day":" days")+" in a row"; }

/* ============================ UTILITIES ============================ */
const $=s=>document.querySelector(s);
const esc=LG.esc, shuffle=LG.shuffle, pick=LG.pick;
const LET="ABCDE";
const isMeta=o=>/^None of the/i.test(o);
function optOrder(q){ if(q.ns) return q.o.map((_,i)=>i); const mv=[],fx=[]; q.o.forEach((o,i)=>(isMeta(o)?fx:mv).push(i)); return shuffle(mv).concat(fx); }
function examMs(){ if(!S.settings.examDate) return null; const t=new Date(S.settings.examDate+"T09:00:00").getTime(); return isNaN(t)?null:t; }
function daysLeft(){ const t=examMs(); return t==null?null:Math.ceil((t-Date.now())/DAY); }
const expl=q=>q.eh?q.e:`<p style="margin:.4em 0 0">${esc(q.e)}</p>`;
const tpill=t=>`<span class="pill"><span class="tdot" style="background:${TOPICS[t].color}"></span>${TOPICS[t].short}</span>`;
const fmt=(x,d=2)=>x.toFixed(d);
const dateStr=t=>new Date(t).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
const dateTimeStr=t=>new Date(t).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});

/* ============================ SPACED REPETITION ============================
   Boxes 0-6. A wrong answer comes back in 10 minutes (and once more in the same session).
   A right answer never comes back before 20 hours: "Sure" jumps to at least box 3 (3 days),
   "Unsure" to at least box 2 (1 day), and "Guess" is treated as luck (1 day, box unchanged).
   With an exam date, intervals shrink so everything comes back at least once before it. */
const STEP=[0,10*MIN,DAY,3*DAY,7*DAY,16*DAY,35*DAY];
function capByExam(d){ const ex=examMs(); if(ex){ const left=ex-Date.now(); if(left>0) d=Math.min(d,Math.max(left*0.5,20*HOUR)); } return d; }
function schedule(st,ok,conf){
  const now=Date.now();
  if(!ok){ st.box=1; st.due=now+10*MIN; st.lastOk=false; return; }
  st.lastOk=true;
  if(conf==="guess"){ st.box=Math.max(st.box||0,1); st.due=now+capByExam(DAY); return; }
  st.box=Math.min(6,Math.max(conf==="sure"?3:2,(st.box||0)+(conf==="sure"?2:1)));
  st.due=now+capByExam(STEP[st.box]);
}
const qst=id=>S.q[id]||(S.q[id]={box:0,due:0,ok:0,ko:0,seen:0});
const sq=id=>S.q[id]||{};
function recordQ(id,ok,conf){ const st=qst(id); st.seen++; ok?st.ok++:st.ko++; st.last=Date.now(); schedule(st,ok,conf); touchDay(); save(); }
const dueQ=()=>{ const now=Date.now(); return Q.filter(q=>{ const s=sq(q.id); return s.seen&&s.due<=now; }); };
const wrongQ=()=>Q.filter(q=>sq(q.id).lastOk===false);
const unseenQ=t=>Q.filter(q=>(!t||q.t===t)&&!sq(q.id).seen);
const masteredQ=t=>Q.filter(q=>(!t||q.t===t)&&(sq(q.id).box||0)>=4&&sq(q.id).lastOk!==false);
function mastery(t){ const qs=Q.filter(q=>!t||q.t===t); return qs.reduce((s,q)=>{ const x=sq(q.id); return s+(x.lastOk===false?0:Math.min(x.box||0,4)/4); },0)/qs.length; }
const PBOX=[0.3,0.4,0.6,0.75,0.88,0.93,0.96];
function predicted(){
  const pen=S.settings.pen;
  const ev=Q.reduce((s,q)=>{ const x=sq(q.id), p=x.lastOk===false?0.35:PBOX[x.box||0]; return s+Math.max(0,p-(1-p)*pen); },0)/Q.length;
  let g=ev*10; const sims=S.sims.slice(-2);
  if(sims.length){ g=0.5*g+0.5*sims.reduce((s,x)=>s+x.grade,0)/sims.length; }
  return Math.max(0,Math.min(10,g));
}
const dueF=()=>{ const now=Date.now(); return F.filter(f=>{ const s=S.f[f.id]; return !s||s.due<=now; }); };

/* generated questions */
function genItem(k){ const g=GEN[k]; return Object.assign(g.make(),{t:g.t,gen:k,id:"g:"+k}); }
function weakGenKeys(){ return shuffle(GK).sort((a,b)=>mastery(GEN[a].t)-mastery(GEN[b].t)); }

/* Campus Virtual style scoring */
function scoreQ(q,sel){
  if(!q.m){ if(sel==null) return {ok:false,blank:true,pts:0}; const ok=sel===q.a; return {ok,blank:false,pts:ok?1:-S.settings.pen}; }
  const arr=[...(sel||[])]; if(!arr.length) return {ok:false,blank:true,pts:0};
  const nG=q.a.length, nB=q.o.length-nG, g=arr.filter(i=>q.a.includes(i)).length, b=arr.length-g;
  return {ok:g===nG&&b===0,blank:false,pts:Math.max(0,g/nG-(nB?b/nB:0))};
}
const rightLetters=(q,order)=>(q.m?q.a:[q.a]).map(i=>LET[order.indexOf(i)]).sort().join(", ");

/* ============================ QUESTION RENDERING ============================ */
function optsHTML(q,order,sel,lock){
  const isSel=i=>q.m?sel.has(i):sel===i, good=i=>q.m?q.a.includes(i):q.a===i;
  return order.map((oi,pos)=>{ let cls="opt"+(q.m?" multi":"");
    if(lock){ cls+=" lock"; if(good(oi)) cls+=isSel(oi)||!q.m?" right":" missed"; else if(isSel(oi)) cls+=" wrong"; }
    else if(isSel(oi)) cls+=" sel";
    return `<button class="${cls}" data-oi="${oi}"><span class="let">${LET[pos]}</span><span>${esc(q.o[oi])}</span></button>`; }).join("");
}
function qBody(q){
  return `<div class="qtext">${esc(q.q)}</div>${q.c?`<pre>${esc(q.c)}</pre>`:""}${q.m?`<div class="small muted">Select one or more options.</div>`:""}`;
}

/* ============================ ROUTER ============================ */
let VIEW="home", timerInt=null;
const views={home,learn,practice,lab,flash,exam,strategy};
function setNav(v){ document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===v)); }
function go(v,arg){ VIEW=v; setNav(v); window.scrollTo(0,0); views[v](arg); }
document.getElementById("nav").addEventListener("click",e=>{ const b=e.target.closest("button"); if(b) go(b.dataset.v); });

/* ============================ HOME ============================ */
function nextStep(){
  const unread=TK.filter(t=>!S.read[t]), seen=Q.filter(q=>sq(q.id).seen).length;
  const dq=dueQ().length, df=dueF().filter(f=>S.f[f.id]).length;
  if(!seen&&unread.length===TK.length) return {t:"Start with unit 1",d:"Read the formalization summary (10 minutes) and take its quiz right after.",b:"Go to unit 1",a:()=>go("learn","p1")};
  if(dq+df>=8) return {t:`Reviews due: ${dq} questions and ${df} flashcards`,d:"These are the ones you are about to forget. What you have already mastered stays away until its date.",b:dq?"Review questions":"Review flashcards",a:()=>dq?startPractice("due"):go("flash")};
  if(unread.length){ const t=unread[0]; return {t:`Learn: ${TOPICS[t].name}`,d:"Read the summary and take the unit's quiz straight away.",b:"Go to the unit",a:()=>go("learn",t)}; }
  const weak=TK.map(t=>[t,mastery(t)]).sort((a,b)=>a[1]-b[1])[0];
  if(weak[1]<0.6&&unseenQ(weak[0]).length) return {t:`Work on your weakest unit: ${TOPICS[weak[0]].name}`,d:`Current mastery: ${Math.round(weak[1]*100)}%.`,b:"Practise this unit",a:()=>startPractice(weak[0])};
  const labN=Object.values(S.gen).reduce((s,x)=>s+(x.ok||0)+(x.ko||0),0);
  if(labN<12) return {t:"Try the workshops",d:"AND/OR trees, unification, Skolem and clausal form generated on the spot: every exercise is new.",b:"Go to Workshops",a:()=>go("lab")};
  if(unseenQ().length) return {t:"Smart review",d:`You have ${unseenQ().length} new questions left. The review mixes them with what is due.`,b:"Start",a:()=>startPractice("smart")};
  return {t:"Take a mock exam",d:"11 questions with a timer and penalties, like Campus Virtual.",b:"Start a mock exam",a:()=>go("exam")};
}
function home(){
  const g=predicted(), dl=daysLeft(), ns=nextStep();
  const seen=Q.filter(q=>sq(q.id).seen).length, mast=masteredQ().length, dq=dueQ().length, wr=wrongQ().length;
  const c=S.conf, pct=a=>a[0]+a[1]?Math.round(a[0]/(a[0]+a[1])*100)+"%":"—";
  const thr=Math.round(S.settings.pen/(1+S.settings.pen)*100);
  $("#app").innerHTML=`
  <h1>Logic midterm</h1>
  <div class="split">
    <div class="card next"><div class="small muted">NEXT STEP</div><h2 style="margin:.15em 0">${esc(ns.t)}</h2><p class="muted">${esc(ns.d)}</p><button class="btn" id="nsBtn">${esc(ns.b)} →</button></div>
    <div class="card"><div class="small muted">Estimated grade</div><div class="kpi" style="color:${g>=8?"var(--ok)":g>=5?"var(--warn)":"var(--ko)"}">${fmt(g,1)} <small>/ 10</small></div>
      <div class="bar" style="margin-top:8px"><i style="width:${g*10}%;background:${g>=8?"var(--ok)":"var(--accent)"}"></i></div>
      <div class="small muted" style="margin-top:6px">Based on how well each question has settled and on your last two mock exams.</div></div>
  </div>
  <div class="grid g3">
    <div class="card"><div class="small muted">Bank of ${Q.length} questions</div><div class="kpi">${seen}<small> seen</small></div>
      <div class="small muted">${mast} mastered · ${unseenQ().length} new</div></div>
    <div class="card"><div class="small muted">Due today</div><div class="kpi">${dq}<small> reviews</small></div>
      <div class="small muted">${wr} in “My mistakes” · ${dueF().filter(f=>S.f[f.id]).length} flashcards</div></div>
    <div class="card"><div class="small muted">Exam</div><div class="kpi">${dl==null?"—":dl<0?"Past":dl+"<small> days</small>"}</div>
      <label class="small muted">Date: <input type="date" id="exDate" value="${esc(S.settings.examDate)}"></label></div>
  </div>
  <div class="card"><h2 style="margin-top:0">Mastery by unit</h2>
    ${TK.map(t=>{ const m=mastery(t); return `<div style="margin:12px 0"><div class="row" style="justify-content:space-between"><span><span class="tdot" style="background:${TOPICS[t].color}"></span> ${TOPICS[t].name} ${S.read[t]?'<span class="tag">read</span>':""}</span><span class="small muted">${Math.round(m*100)}% · ${Q.filter(q=>q.t===t).length} questions</span></div>
      <div class="bar" style="margin-top:4px"><i style="width:${m*100}%;background:${TOPICS[t].color}"></i></div>
      <div class="row" style="margin-top:6px"><button class="btn ghost sm" data-learn="${t}">Read</button><button class="btn ghost sm" data-prac="${t}">Practise</button></div></div>`; }).join("")}
    <p class="small muted">A question counts as mastered once it reaches box 4: several right answers spread over a week or more.</p>
  </div>
  <div class="grid g2">
    <div class="card"><h2 style="margin-top:0">Your calibration</h2>
      <p class="small muted">With a penalty of ${fmt(S.settings.pen)}, answering pays off if you are right more than <b>${thr}%</b> of the time.</p>
      <table><tr><th>When you say…</th><th>You are right</th><th>Answers</th></tr>
      <tr><td>Sure</td><td>${pct(c.sure)}</td><td>${c.sure[0]+c.sure[1]}</td></tr>
      <tr><td>Unsure</td><td>${pct(c.doubt)}</td><td>${c.doubt[0]+c.doubt[1]}</td></tr>
      <tr><td>Guess</td><td>${pct(c.guess)}</td><td>${c.guess[0]+c.guess[1]}</td></tr></table>
      <p class="small">${calAdvice()}</p></div>
    <div class="card"><h2 style="margin-top:0">Mock exams</h2>
      ${S.sims.length?`<div class="hist">${S.sims.slice(-10).map(s=>`<div style="height:${Math.max(4,s.grade*7)}px;background:${s.grade>=8?"var(--ok)":"var(--accent)"}" title="${dateStr(s.date)}"><span>${fmt(s.grade,1)}</span></div>`).join("")}</div>
      <p class="small muted">Latest grades (green: 8 or more).</p>`:`<p class="muted">You have not taken any yet. Once you have seen half the bank, take one every few days.</p>`}
      <button class="btn ghost sm" id="goExam">Go to Mock exam</button></div>
  </div>
  <div class="card"><h2 style="margin-top:0">How it works</h2>
    <ol class="tight">
      <li><b>Learn</b>: a summary of each unit with examples from the exams and their traps.</li>
      <li><b>Practice</b>: sessions of 10 with what is due, new questions and 2 generated exercises. What you get right and are sure of stays away for days; what you get wrong comes back in the same session.</li>
      <li><b>Workshops</b>: endless generated AND/OR trees, unification, composition, Skolem, clausal form and arguments, plus 15 natural deduction proofs to fill in.</li>
      <li><b>Flashcards</b> for definitions, laws and rules.</li>
      <li><b>Mock exam</b>: 11 single- or multi-answer questions, with a timer and penalties.</li>
    </ol>
    <p class="small muted">Progress is saved in this browser (and in the backup on the home page). Shortcuts: <span class="kbd">1</span>–<span class="kbd">5</span> pick an option, <span class="kbd">Q</span> <span class="kbd">W</span> <span class="kbd">E</span> set how sure you are, <span class="kbd">Enter</span> moves on and <span class="kbd">Space</span> flips a flashcard.</p>
    <button class="btn ghost sm" id="resetBtn">Delete all progress</button></div>`;
  $("#nsBtn").onclick=ns.a; $("#goExam").onclick=()=>go("exam");
  $("#exDate").onchange=e=>{ S.settings.examDate=e.target.value; save(); home(); };
  document.querySelectorAll("[data-learn]").forEach(b=>b.onclick=()=>go("learn",b.dataset.learn));
  document.querySelectorAll("[data-prac]").forEach(b=>b.onclick=()=>startPractice(b.dataset.prac));
  $("#resetBtn").onclick=e=>{ const b=e.target; if(b.dataset.c){ S=defState(); save(); home(); renderStreak(); } else { b.dataset.c=1; b.textContent="Sure? Click again to delete everything"; b.classList.add("ko"); } };
}
function calAdvice(){
  const d=S.conf.doubt, n=d[0]+d[1], thr=S.settings.pen/(1+S.settings.pen);
  if(n<10) return "Mark how sure you are on every question: after about 10 “Unsure” answers you will know whether answering them in the exam pays off.";
  const p=d[0]/n;
  return p>thr+0.05?`When unsure you are right ${Math.round(p*100)}% of the time: <b>answer the doubtful ones</b>.`:p<thr-0.05?`When unsure you are only right ${Math.round(p*100)}% of the time: <b>leave them blank</b> unless you have ruled out some options.`:"You are right at the threshold: answer only if you have ruled out an option.";
}

/* ============================ LEARN ============================ */
function learn(topic){
  $("#app").innerHTML=document.getElementById("tpl-learn").innerHTML;
  const toc=$("#learnToc");
  const tocHTML=()=>TK.map(t=>`<button class="btn ghost sm" data-goto="${t}"><span class="tdot" style="background:${TOPICS[t].color}"></span>${TOPICS[t].short}${S.read[t]?" ✓":""}</button>`).join("");
  toc.innerHTML=tocHTML();
  toc.onclick=e=>{ const b=e.target.closest("[data-goto]"); if(b) document.querySelector(`section[data-topic="${b.dataset.goto}"]`).scrollIntoView({behavior:"smooth"}); };
  document.querySelectorAll("[data-read]").forEach(c=>{ c.checked=!!S.read[c.dataset.read]; c.onchange=()=>{ S.read[c.dataset.read]=c.checked; touchDay(); save(); toc.innerHTML=tocHTML(); }; });
  document.querySelectorAll("[data-quiz]").forEach(b=>b.onclick=()=>{ S.read[b.dataset.quiz]=true; save(); startPractice(b.dataset.quiz); });
  document.querySelectorAll("[data-labgo]").forEach(b=>b.onclick=()=>go("lab",b.dataset.labgo));
  if(topic) setTimeout(()=>{ const s=document.querySelector(`section[data-topic="${topic}"]`); if(s) s.scrollIntoView(); },30);
}

/* ============================ PRACTICE ============================ */
let P=null;
function practice(){
  const dq=dueQ().length, wr=wrongQ().length, ahead=Q.filter(q=>{ const s=sq(q.id); return s.seen&&s.due>Date.now(); }).length;
  $("#app").innerHTML=`<h1>Practice</h1>
  <p class="muted">Sessions of 10 questions, marked straight away. Before showing the answer I ask how sure you are: that tells you when leaving a question blank pays off, and a question you got right and were sure of takes days to come back.</p>
  <div class="card next"><h2 style="margin:0">Smart review</h2><p class="small muted">First what is due today (${dq}), then new questions from your weakest units (${unseenQ().length} new) and 2 generated exercises. It never shows you a question you got right before its date.</p><button class="btn" data-m="smart">Start</button></div>
  <div class="grid g2">
   <div class="card"><h3 style="margin-top:0">Due for review</h3><p class="small muted">${dq} questions are due.</p><button class="btn ghost" data-m="due" ${dq?"":"disabled"}>Review</button></div>
   <div class="card"><h3 style="margin-top:0">My mistakes</h3><p class="small muted">${wr} questions whose last answer was wrong. They leave this list as soon as you get them right.</p><button class="btn ghost" data-m="wrong" ${wr?"":"disabled"}>Review mistakes</button></div>
  </div>
  <div class="card"><h3 style="margin-top:0">By unit</h3><p class="small muted">What is due and what is new in the unit; once nothing is left, generated exercises.</p>
   <div class="row">${TK.map(t=>`<button class="btn ghost sm" data-m="${t}"><span class="tdot" style="background:${TOPICS[t].color}"></span>${TOPICS[t].short} (${unseenQ(t).length} new)</button>`).join("")}</div></div>
  <div class="card"><h3 style="margin-top:0">Review ahead of time</h3><p class="small muted">${ahead} questions you already got right that are not due yet. Only if you want to review early, for example the day before the exam.</p><button class="btn ghost sm" data-m="ahead" ${ahead?"":"disabled"}>Review early</button></div>`;
  document.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>startPractice(b.dataset.m));
}
function buildSession(mode,n=10){
  const now=Date.now(), st=sq;
  const due=dueQ().sort((a,b)=>(st(a.id).lastOk===false?0:1)-(st(b.id).lastOk===false?0:1)||(st(a.id).box||0)-(st(b.id).box||0)||st(a.id).due-st(b.id).due);
  let items=[], note="";
  if(mode==="due") items=due.slice(0,n);
  else if(mode==="wrong") items=shuffle(wrongQ()).slice(0,n);
  else if(mode==="ahead") items=shuffle(Q.filter(q=>st(q.id).seen&&st(q.id).due>now).sort((a,b)=>(st(a.id).box||0)-(st(b.id).box||0)||st(a.id).due-st(b.id).due).slice(0,n));
  else if(TOPICS[mode]){
    const d=due.filter(q=>q.t===mode), u=shuffle(unseenQ(mode));
    items=d.slice(0,Math.ceil(n/2)).concat(u); if(items.length<n) items=items.concat(d.slice(Math.ceil(n/2))); items=shuffle(items.slice(0,n));
    const gk=GK.filter(k=>GEN[k].t===mode);
    if(items.length<n&&gk.length){ if(!items.length) note="You have no new questions or reviews left in this unit, so here are generated exercises."; while(items.length<n) items.push(genItem(pick(gk))); }
    else if(!items.length) note="empty";
  } else {
    const nS=n-2, out=due.slice(0,Math.ceil(nS*0.6));
    const pools=TK.slice().sort((a,b)=>mastery(a)-mastery(b)).map(t=>shuffle(unseenQ(t)));
    let k=0; while(out.length<nS&&pools.some(p=>p.length)){ const p=pools[k%pools.length]; if(p.length) out.push(p.shift()); k++; }
    for(const q of due){ if(out.length>=nS) break; if(!out.includes(q)) out.push(q); }
    items=shuffle(out);
    if(!out.length) note="You have seen the whole bank and have no reviews due, so today you get generated exercises, which are new every time.";
    const gk=weakGenKeys(); let i=0;
    while(items.length<n){ items.splice(Math.floor(Math.random()*(items.length+1)),0,genItem(gk[i++%gk.length])); }
  }
  return {items,note};
}
function startPractice(mode){
  VIEW="practice"; setNav("practice");
  const {items,note}=buildSession(mode);
  if(!items.length){ $("#app").innerHTML=`<h1>Practice</h1><div class="card"><h2 style="margin-top:0">All caught up</h2><p>Nothing is due here: what you got right will come back when it is due. You can do something else, or review early if the exam is close.</p><div class="row"><button class="btn" id="eBack">Back to Practice</button><button class="btn ghost" id="eLab">Go to Workshops</button></div></div>`; $("#eBack").onclick=()=>go("practice"); $("#eLab").onclick=()=>go("lab"); return; }
  P={mode,items,i:0,res:[],note,sel:null,stage:"choose",order:null};
  prepP(); renderP(); window.scrollTo(0,0);
}
function prepP(){ const q=P.items[P.i]; P.order=optOrder(q); P.sel=q.m?new Set():null; P.stage="choose"; }
function renderP(){
  const q=P.items[P.i], st=q.gen?null:sq(q.id), lock=P.stage==="done";
  const hasSel=q.m?P.sel.size>0:P.sel!=null;
  let h=(P.note&&P.i===0?`<div class="card mnemo" style="margin-top:0">${esc(P.note)}</div>`:"")+
  `<div class="row" style="justify-content:space-between">${tpill(q.t)}<span class="small muted">${P.i+1}/${P.items.length} · ${q.gen?"generated exercise":q.again?"retry of a mistake":st.seen?`seen ${st.seen} ${st.seen===1?"time":"times"}`:"new"}${q.x?` · ${esc(q.x)}`:""}</span></div>
  <div class="bar" style="margin:8px 0 4px"><i style="width:${P.i/P.items.length*100}%"></i></div>
  <div class="card">${qBody(q)}<div id="opts">${optsHTML(q,P.order,P.sel,lock)}</div>`;
  if(!lock&&hasSel) h+=`<div class="conf"><div class="small" style="font-weight:600;margin-bottom:6px">How sure are you? <span class="muted">(in the exam you would decide whether to answer or leave it blank)</span></div>
    <div class="row"><button class="btn ok sm" data-c="sure">Sure <span class="kbd">Q</span></button><button class="btn warn sm" data-c="doubt">Unsure <span class="kbd">W</span></button><button class="btn ko sm" data-c="guess">Guess <span class="kbd">E</span></button></div></div>`;
  if(!lock) h+=`<div class="row" style="margin-top:8px"><button class="btn ghost sm" id="blankBtn">I don't know: I would leave it blank</button></div>`;
  if(lock){ const r=P.res[P.i];
    h+=`<div class="fb ${r.blank?"na":r.ok?"ok":"ko"}"><b>${r.blank?"Blank (0 points).":r.ok?"Correct.":q.m&&r.pts>0?`Partly correct (${fmt(r.pts)} of 1).`:"Wrong."}</b> ${r.ok?"":`${q.m?"Correct options":"The correct one is"}: <b>${rightLetters(q,P.order)}</b>.`}${expl(q)}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="nextBtn">${P.i+1<P.items.length?"Next":"See results"} <span class="kbd" style="background:transparent;color:inherit">↵</span></button></div>`; }
  h+=`</div>`;
  $("#app").innerHTML=h;
  if(!lock) $("#opts").onclick=e=>{ const b=e.target.closest(".opt"); if(b) pickP(+b.dataset.oi); };
  document.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>answerP(b.dataset.c));
  const bb=$("#blankBtn"); if(bb) bb.onclick=()=>answerP(null);
  const nb=$("#nextBtn"); if(nb){ nb.onclick=nextP; nb.focus(); }
}
function pickP(oi){ const q=P.items[P.i]; if(q.m){ P.sel.has(oi)?P.sel.delete(oi):P.sel.add(oi); } else P.sel=oi; renderP(); }
function answerP(conf){
  const q=P.items[P.i], r=scoreQ(q,conf===null?(q.m?new Set():null):P.sel);
  r.conf=conf; P.res[P.i]=r;
  if(q.gen){ const g=S.gen[q.gen]||(S.gen[q.gen]={ok:0,ko:0}); r.ok?g.ok++:g.ko++; touchDay(); save(); }
  else if(!q.again) recordQ(q.id,r.ok,conf);
  if(conf&&!r.blank){ S.conf[conf][r.ok?0:1]++; save(); }
  if(!r.ok&&!q.again){ const copy=Object.assign({},q,{again:true}); P.items.splice(Math.min(P.items.length,P.i+4),0,copy); }
  P.stage="done"; renderP();
}
function nextP(){
  if(P.i+1<P.items.length){ P.i++; prepP(); renderP(); window.scrollTo(0,0); return; }
  const firsts=P.items.map((q,i)=>[q,P.res[i]]).filter(([q])=>!q.again);
  const ok=firsts.filter(([,r])=>r.ok).length, bl=firsts.filter(([,r])=>r.blank).length, ko=firsts.length-ok-bl;
  const pts=firsts.reduce((s,[,r])=>s+r.pts,0), g=Math.max(0,pts)/firsts.length*10;
  const failed=firsts.filter(([,r])=>!r.ok).map(([q])=>q);
  $("#app").innerHTML=`<h1>Session results</h1>
  <div class="grid g3"><div class="card"><div class="small muted">Right</div><div class="kpi" style="color:var(--ok)">${ok}<small> / ${firsts.length}</small></div></div>
  <div class="card"><div class="small muted">Wrong / blank</div><div class="kpi">${ko} / ${bl}</div></div>
  <div class="card"><div class="small muted">Grade with a ${fmt(S.settings.pen)} penalty</div><div class="kpi" style="color:${g>=8?"var(--ok)":"var(--warn)"}">${fmt(g,1)}</div></div></div>
  ${failed.length?`<div class="card"><h3 style="margin-top:0">What you got wrong (it comes back in 10 minutes, and until you get it right)</h3>${failed.map(q=>`<div style="border-top:1px solid var(--border);padding:8px 0"><b>${esc(q.q)}</b>${q.c?`<pre>${esc(q.c)}</pre>`:""}<div style="color:var(--ok)">${(q.m?q.a:[q.a]).map(i=>"✔ "+esc(q.o[i])).join("<br>")}</div></div>`).join("")}</div>`:`<div class="card"><p>Perfect session. These questions will not come back for a few days.</p></div>`}
  <div class="row"><button class="btn" id="againBtn">Another session</button><button class="btn ghost" id="homeBtn">Back to Home</button></div>`;
  $("#againBtn").onclick=()=>startPractice(P.mode==="due"&&!dueQ().length?"smart":P.mode==="wrong"&&!wrongQ().length?"smart":P.mode);
  $("#homeBtn").onclick=()=>go("home");
}

/* ============================ WORKSHOPS ============================ */
let LB=null;
function lab(arg){
  if(arg==="nd"){ ndList(); return; }
  if(arg&&GEN[arg]){ newLab(arg); return; }
  const stat=k=>{ const s=S.gen[k]; return s&&(s.ok+s.ko)?`<span class="tag">${s.ok}/${s.ok+s.ko} right</span>`:""; };
  const card=k=>`<div class="card gencard"><div class="row" style="justify-content:space-between">${tpill(GEN[k].t)}${stat(k)}</div><h3>${GEN[k].name}</h3><p class="small muted" style="margin:0">${GEN[k].desc}</p><div><button class="btn sm" data-g="${k}">Start</button></div></div>`;
  const ndDone=ND.filter((_,i)=>(S.nd[i]||{}).best===1).length;
  $("#app").innerHTML=`<h1>Workshops</h1>
  <p class="muted">Exam-style exercises generated on the spot, with a step-by-step solution. They never repeat, so you can do as many as you like.</p>
  <div class="card next"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Natural deduction: fill in the gaps</h2><span class="tag">${ndDone}/${ND.length} complete</span></div>
    <p class="small muted">The 15 proofs from the slides, the exams and the mock exams, with formulas and justifications to complete. It is the 2.5-point exercise of the written exam and question 11 of the mock exams.</p><button class="btn" id="ndGo">Choose a proof</button></div>
  <h2>Propositional logic</h2><div class="grid g3">${GK.filter(k=>GEN[k].t[0]==="p").map(card).join("")}</div>
  <h2>Predicate logic</h2><div class="grid g3">${GK.filter(k=>GEN[k].t[0]==="q").map(card).join("")}</div>`;
  $("#ndGo").onclick=ndList;
  document.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>newLab(b.dataset.g));
}
function newLab(k){ VIEW="lab"; setNav("lab"); const q=genItem(k); LB={k,q,order:optOrder(q),sel:q.m?new Set():null,done:false,r:null}; renderLab(); window.scrollTo(0,0); }
function renderLab(){
  const {k,q,order,sel,done}=LB, hasSel=q.m?sel.size>0:sel!=null;
  let h=`<div class="row" style="justify-content:space-between"><button class="btn ghost sm" id="lbBack">← Workshops</button>${tpill(q.t)}</div>
  <h1 style="margin-top:.4em">${GEN[k].name}</h1><div class="card">${qBody(q)}<div id="opts">${optsHTML(q,order,sel,done)}</div>`;
  if(!done) h+=`<div class="row" style="margin-top:10px"><button class="btn" id="lbChk" ${hasSel?"":"disabled"}>Check <span class="kbd" style="background:transparent;color:inherit">↵</span></button></div>`;
  else { const r=LB.r; h+=`<div class="fb ${r.ok?"ok":"ko"}"><b>${r.ok?"Correct.":q.m&&r.pts>0?`Partly correct (${fmt(r.pts)} of 1).`:"Wrong."}</b> ${r.ok?"":`${q.m?"Correct options":"The correct one is"}: <b>${rightLetters(q,order)}</b>.`}<div style="margin-top:8px">${expl(q)}</div></div>
    <div class="row" style="margin-top:12px"><button class="btn" id="lbNext">Another exercise <span class="kbd" style="background:transparent;color:inherit">↵</span></button></div>`; }
  h+=`</div>`;
  $("#app").innerHTML=h;
  $("#lbBack").onclick=()=>go("lab");
  if(!done) $("#opts").onclick=e=>{ const b=e.target.closest(".opt"); if(!b) return; const oi=+b.dataset.oi; if(q.m){ sel.has(oi)?sel.delete(oi):sel.add(oi); } else LB.sel=oi; renderLab(); };
  const c=$("#lbChk"); if(c) c.onclick=checkLab;
  const n=$("#lbNext"); if(n){ n.onclick=()=>newLab(k); n.focus(); }
}
function checkLab(){ const q=LB.q; if(q.m?!LB.sel.size:LB.sel==null) return; LB.r=scoreQ(q,LB.sel); LB.done=true;
  const g=S.gen[LB.k]||(S.gen[LB.k]={ok:0,ko:0}); LB.r.ok?g.ok++:g.ko++; touchDay(); save(); renderLab(); }

/* --- natural deduction with gaps --- */
let NDS=null;
function ndList(){
  VIEW="lab"; setNav("lab");
  const row=(p,i)=>{ const s=S.nd[i]||{}; return `<button class="opt" data-nd="${i}"><span class="let">${i+1}</span><span style="flex:1"><span class="fx">${esc(p.goal)}</span><br><span class="small muted">${esc(p.src)} · ${p.lines.filter(l=>l[3]).length} gaps${s.best!=null?` · best: ${Math.round(s.best*100)}%`:""}</span></span></button>`; };
  $("#app").innerHTML=`<div class="row"><button class="btn ghost sm" id="lbBack">← Workshops</button></div><h1 style="margin-top:.4em">Natural deduction: fill in the gaps</h1>
  <p class="muted">Pick the missing formula or justification in each drop-down. Before looking at the options, try to write it yourself: that is what the written exam asks for.</p>
  <h2>Propositional logic</h2>${ND.map((p,i)=>p.t==="p3"?row(p,i):"").join("")}
  <h2>Predicate logic</h2>${ND.map((p,i)=>p.t==="q4"?row(p,i):"").join("")}`;
  $("#lbBack").onclick=()=>go("lab");
  document.querySelectorAll("[data-nd]").forEach(b=>b.onclick=()=>openND(+b.dataset.nd));
}
function negF(f){ return f.startsWith("¬")&&!f.startsWith("¬(")?f.slice(1):f.startsWith("¬(")&&f.endsWith(")")?f.slice(2,-1):(/\s/.test(f)?"¬("+f+")":"¬"+f); }
function justAlts(j){
  const m=/^(\S+?)([IE]) (.+)$/.exec(j); if(!m) return ["Assumption","Premise"];
  const [,sym,k,refs]=m, other=k==="I"?"E":"I", out=new Set();
  out.add(sym+other+" "+refs);
  const syms=["∧","∨","→","¬","∀","∃","↔"].filter(s=>s!==sym); out.add(pick(syms)+k+" "+refs); out.add(pick(syms)+other+" "+refs);
  const nums=refs.match(/\d+/g); if(nums){ const i=Math.floor(Math.random()*nums.length), v=+nums[i]; const nv=v>1&&Math.random()<0.5?v-1:v+1; let c=0; out.add(sym+k+" "+refs.replace(/\d+/g,x=>c++===i?String(nv):x)); }
  out.delete(j); return [...out];
}
function openND(i){
  const pr=ND[i], fs=pr.lines.map(l=>l[1]);
  const gaps={};
  pr.lines.forEach((l,li)=>{ const g=l[3]||"";
    if(g.includes("f")){ const alts=new Set([negF(l[1])]); shuffle(fs).forEach(f=>{ if(alts.size<5&&f!==l[1]&&!/free$/.test(f)) alts.add(f); }); alts.delete(l[1]); gaps[li+"f"]={right:l[1],opts:shuffle([l[1]].concat(shuffle([...alts]).slice(0,3))),val:""}; }
    if(g.includes("j")){ gaps[li+"j"]={right:l[2],opts:shuffle([l[2]].concat(shuffle(justAlts(l[2])).slice(0,3))),val:""}; }
  });
  NDS={i,gaps,checked:false,shown:false}; renderND(); window.scrollTo(0,0);
}
function ndHTML(){
  const pr=ND[NDS.i]; let h="", depth=0;
  const cell=(li,kind,text)=>{ const g=NDS.gaps[li+kind]; if(!g) return esc(text);
    if(NDS.shown) return `<b style="color:var(--accent)">${esc(g.right)}</b>`;
    const cls=NDS.checked&&g.val?(g.val===g.right?"okg":"kog"):"";
    return `<select data-gap="${li+kind}" class="${cls}" aria-label="Gap"><option value="">— choose —</option>${g.opts.map(o=>`<option ${g.val===o?"selected":""}>${esc(o)}</option>`).join("")}</select>`; };
  pr.lines.forEach((l,li)=>{ while(depth>l[0]){ h+="</div>"; depth--; } while(depth<l[0]){ h+='<div class="ndbox">'; depth++; }
    h+=`<div class="ndl"><span class="n">${li+1}.</span><span>${cell(li,"f",l[1])}</span><span class="j">${cell(li,"j",l[2])}</span></div>`; });
  while(depth>0){ h+="</div>"; depth--; }
  return `<div class="nd">${h}</div>`;
}
function renderND(){
  const pr=ND[NDS.i], gs=Object.values(NDS.gaps), right=gs.filter(g=>g.val===g.right).length;
  $("#app").innerHTML=`<div class="row" style="justify-content:space-between"><button class="btn ghost sm" id="ndBack">← Proofs</button>${tpill(pr.t)}</div>
  <h1 style="margin-top:.4em" class="fx">${esc(pr.goal)}</h1><p class="small muted">${esc(pr.src)} · ${gs.length} gaps</p>
  <div class="card">${ndHTML()}
  ${NDS.checked&&!NDS.shown?`<div class="fb ${right===gs.length?"ok":"ko"}"><b>${right} of ${gs.length} gaps right.</b> ${right===gs.length?"Proof complete.":"The drop-downs in red are wrong; fix them and check again."}</div>`:""}
  <div class="row" style="margin-top:12px"><button class="btn" id="ndChk">Check</button><button class="btn ghost" id="ndShow">${NDS.shown?"Hide the solution":"Show the solution"}</button><button class="btn ghost" id="ndNext">Another proof</button></div></div>
  <p class="small muted">Remember: the line after a box tells you which rule closed it, and every box starts with an assumption (or with “(t) free” for ∀I).</p>`;
  document.querySelectorAll("[data-gap]").forEach(s=>s.onchange=()=>{ NDS.gaps[s.dataset.gap].val=s.value; s.className=""; });
  $("#ndBack").onclick=ndList;
  $("#ndChk").onclick=()=>{ NDS.checked=true; NDS.shown=false; const sc=Object.values(NDS.gaps).filter(g=>g.val===g.right).length/Object.keys(NDS.gaps).length; const s=S.nd[NDS.i]||(S.nd[NDS.i]={}); s.best=Math.max(s.best||0,sc); touchDay(); save(); renderND(); };
  $("#ndShow").onclick=()=>{ NDS.shown=!NDS.shown; renderND(); };
  $("#ndNext").onclick=()=>{ const order=ND.map((_,i)=>i).filter(i=>i!==NDS.i).sort((a,b)=>((S.nd[a]||{}).best||0)-((S.nd[b]||{}).best||0)); openND(order[0]); };
}

/* ============================ FLASHCARDS ============================ */
let FC=null;
function flash(){
  const due=dueF(), news=due.filter(f=>!S.f[f.id]).length, rev=due.length-news;
  $("#app").innerHTML=`<h1>Flashcards</h1>
  <p class="muted">Say the answer out loud or write it down before flipping the card, and rate yourself honestly: what you knew takes days to come back, and what you did not comes back in this same batch.</p>
  <div class="card"><div class="row" style="justify-content:space-between"><span><b>${rev}</b> to review · <b>${news}</b> new · ${F.length} in total</span>
  <select id="fcTopic" aria-label="Unit"><option value="">All units</option>${TK.map(t=>`<option value="${t}">${TOPICS[t].name}</option>`).join("")}</select></div>
  <div class="row" style="margin-top:10px"><button class="btn" id="fcStart" ${due.length?"":"disabled"}>Start (${Math.min(due.length,20)})</button><button class="btn ghost" id="fcAll">Review the whole unit</button></div>
  ${due.length?"":`<p class="small muted">Nothing is due: come back tomorrow or review a whole unit.</p>`}</div>
  <div class="card"><h3 style="margin-top:0">Boxes</h3>${[0,1,2,3,4,5,6].map(b=>{ const n=F.filter(f=>((S.f[f.id]||{}).box||0)===b).length; return `<div class="row small" style="margin:4px 0"><span style="width:110px">${b===0?"New":"Box "+b}</span><div class="bar" style="flex:1"><i style="width:${n/F.length*100}%"></i></div><span style="width:30px;text-align:right">${n}</span></div>`; }).join("")}</div>`;
  const run=all=>{ const t=$("#fcTopic").value; let pool=(all?F:dueF()).filter(f=>!t||f.t===t); if(!pool.length) return;
    pool=all?shuffle(pool):shuffle(pool).sort((a,b)=>((S.f[a.id]||{}).box||0)-((S.f[b.id]||{}).box||0));
    FC={cards:pool.slice(0,all?pool.length:20),i:0,flip:false,done:0,requeued:new Set()}; renderFC(); };
  $("#fcStart").onclick=()=>run(false); $("#fcAll").onclick=()=>run(true);
}
function renderFC(){
  if(FC.i>=FC.cards.length){ $("#app").innerHTML=`<h1>Flashcards</h1><div class="card"><p>You have reviewed ${FC.done} cards.</p><div class="row"><button class="btn" id="fcBack">Back</button><button class="btn ghost" id="fcPrac">Now, quiz questions →</button></div></div>`; $("#fcBack").onclick=flash; $("#fcPrac").onclick=()=>startPractice("smart"); return; }
  const c=FC.cards[FC.i];
  $("#app").innerHTML=`<h1>Flashcards</h1><div class="row" style="justify-content:space-between">${tpill(c.t)}<span class="small muted">${FC.i+1}/${FC.cards.length}</span></div>
  <div class="card flash" id="fcCard"><div class="front">${esc(c.f)}</div>${FC.flip?`<div class="back fx">${esc(c.b)}</div>`:`<div class="small muted" style="margin-top:14px">Think of the answer and click to flip <span class="kbd">Space</span></div>`}</div>
  ${FC.flip?`<div class="row" style="justify-content:center"><button class="btn ko" data-r="0">Didn't know <span class="kbd">1</span></button><button class="btn warn" data-r="1">Partly <span class="kbd">2</span></button><button class="btn ok" data-r="2">Knew it <span class="kbd">3</span></button></div>`:""}`;
  $("#fcCard").onclick=()=>{ if(!FC.flip){ FC.flip=true; renderFC(); } };
  document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>rateFC(+b.dataset.r));
}
function rateFC(r){
  const c=FC.cards[FC.i], st=S.f[c.id]||(S.f[c.id]={box:0,due:0}), now=Date.now();
  if(r===0){ st.box=1; st.due=now+10*MIN; if(!FC.requeued.has(c.id)){ FC.requeued.add(c.id); FC.cards.splice(Math.min(FC.cards.length,FC.i+5),0,c); } }
  else if(r===1){ st.box=Math.max(1,st.box); st.due=now+capByExam(DAY); }
  else { st.box=Math.min(6,Math.max(2,st.box+1)); st.due=now+capByExam(STEP[st.box]); }
  FC.done++; FC.i++; FC.flip=false; touchDay(); save(); renderFC();
}

/* ============================ MOCK EXAM ============================ */
let EX=null;
function exam(){
  if(EX&&!EX.finished){ renderEx(); return; }
  const s=S.settings;
  $("#app").innerHTML=`<h1>Mock exam</h1>
  <p class="muted">Like the Campus Virtual quiz: nothing is marked until you submit, with a timer, single- and multi-answer questions and penalties. You can leave questions blank and flag the doubtful ones.</p>
  <div class="card"><h3 style="margin-top:0">Settings</h3><div class="row">
  <label>Questions <select id="sN">${[11,15,20,25].map(n=>`<option ${n==s.n?"selected":""}>${n}</option>`).join("")}</select></label>
  <label>Minutes <input type="number" id="sMin" value="${s.minutes}" min="5" max="180" style="width:70px"></label>
  <label>Penalty per wrong answer <input type="number" id="sPen" value="${s.pen}" step="0.05" min="0" max="1" style="width:80px"></label>
  <label>Generated exercises <select id="sGen">${[0,1,2,3,4,5].map(n=>`<option ${n==s.gens?"selected":""}>${n}</option>`).join("")}</select></label></div>
  <p class="small muted">Bank questions are spread across the units, picking first the ones you have not seen or not mastered; it avoids the ones you got right in the last 3 days. Generated exercises are new every time. In multi-answer questions each correct option adds its share and each wrong one subtracts, never going below 0.</p>
  <button class="btn" id="sGo">Start the mock exam</button></div>
  ${S.sims.length?`<div class="card"><h3 style="margin-top:0">History</h3><div class="tablewrap"><table><tr><th>Date</th><th>Grade</th><th>✔ / ✘ / blank</th><th>Leaving flagged ones blank</th></tr>${S.sims.slice().reverse().slice(0,10).map(x=>`<tr><td>${dateTimeStr(x.date)}</td><td><b>${fmt(x.grade)}</b></td><td>${x.right} / ${x.wrong} / ${x.blank}</td><td>${x.alt!=null?fmt(x.alt):"—"}</td></tr>`).join("")}</table></div></div>`:""}`;
  $("#sGo").onclick=()=>{ s.n=+$("#sN").value; s.minutes=+$("#sMin").value||40; const pen=parseFloat($("#sPen").value); s.pen=isNaN(pen)?0.25:Math.min(1,Math.max(0,pen)); s.gens=+$("#sGen").value; save(); startEx(); };
}
function pickExam(n,gens){
  const now=Date.now(), nS=n-gens, quota={}; let sum=0;
  TK.forEach(t=>{ quota[t]=Math.floor(nS*Q.filter(q=>q.t===t).length/Q.length); sum+=quota[t]; });
  const ord=shuffle(TK); let i=0; while(sum<nS){ quota[ord[i++%TK.length]]++; sum++; }
  const rank=q=>{ const s=sq(q.id); if(!s.seen) return 0; let r=s.lastOk===false?1:s.due<=now?2:(s.box||0)<4?3:4; if(s.lastOk&&now-(s.last||0)<3*DAY) r+=3; return r; };
  let qs=[]; TK.forEach(t=>qs.push(...shuffle(Q.filter(q=>q.t===t)).sort((a,b)=>rank(a)-rank(b)).slice(0,quota[t])));
  shuffle(GK).slice(0,gens).forEach(k=>qs.push(genItem(k)));
  return shuffle(qs);
}
function startEx(){
  const qs=pickExam(S.settings.n,Math.min(S.settings.gens,S.settings.n));
  EX={qs,orders:qs.map(optOrder),ans:qs.map(q=>q.m?new Set():null),flag:qs.map(()=>false),i:0,end:Date.now()+S.settings.minutes*MIN,finished:false};
  if(timerInt) clearInterval(timerInt);
  timerInt=setInterval(()=>{ const left=EX.end-Date.now(); if(left<=0){ finishEx(); return; } const t=$("#exTimer"); if(t&&VIEW==="exam") t.textContent=mmss(left); },1000);
  renderEx();
}
const mmss=ms=>{ const s=Math.max(0,Math.round(ms/1000)); return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); };
const answered=k=>{ const a=EX.ans[k]; return a instanceof Set?a.size>0:a!=null; };
function renderEx(){
  const q=EX.qs[EX.i], ord=EX.orders[EX.i];
  $("#app").innerHTML=`<div class="row" style="justify-content:space-between"><h1 style="margin:0">Mock exam</h1><span class="pill timer"><span id="exTimer">${mmss(EX.end-Date.now())}</span> left</span></div>
  <div class="card"><div class="navgrid">${EX.qs.map((_,k)=>`<button data-j="${k}" class="${answered(k)?"ans":""} ${EX.flag[k]?"flag":""} ${k===EX.i?"cur":""}" aria-label="Question ${k+1}">${k+1}</button>`).join("")}</div>
  <p class="small muted" style="margin:.6em 0 0">${EX.qs.filter((_,k)=>answered(k)).length} answered · ${EX.flag.filter(Boolean).length} flagged · click a selected option again to clear it</p></div>
  <div class="card"><div class="small muted">Question ${EX.i+1} of ${EX.qs.length} · 1 point</div>${qBody(q)}<div id="opts">${optsHTML(q,ord,EX.ans[EX.i],false)}</div>
  <div class="row" style="margin-top:10px;justify-content:space-between">
   <label class="row small"><input type="checkbox" id="flagC" ${EX.flag[EX.i]?"checked":""}> Flag as doubtful</label>
   <div class="row"><button class="btn ghost sm" id="prevB" ${EX.i?"":"disabled"}>← Previous</button><button class="btn ghost sm" id="nextB" ${EX.i<EX.qs.length-1?"":"disabled"}>Next →</button></div></div></div>
  <div class="row"><button class="btn" id="finB">Submit</button><span class="small muted" id="finMsg"></span></div>`;
  document.querySelectorAll(".navgrid [data-j]").forEach(b=>b.onclick=()=>{ EX.i=+b.dataset.j; renderEx(); });
  $("#opts").onclick=e=>{ const b=e.target.closest(".opt"); if(b) exPick(+b.dataset.oi); };
  $("#flagC").onchange=e=>{ EX.flag[EX.i]=e.target.checked; renderEx(); };
  $("#prevB").onclick=()=>{ EX.i--; renderEx(); }; $("#nextB").onclick=()=>{ EX.i++; renderEx(); };
  $("#finB").onclick=e=>{ const bl=EX.qs.filter((_,k)=>!answered(k)).length; if(!e.target.dataset.c){ e.target.dataset.c=1; e.target.textContent="Confirm submission"; $("#finMsg").textContent=bl?`You have ${bl} blank.`:"All answered."; } else finishEx(); };
}
function exPick(oi){ const q=EX.qs[EX.i]; if(q.m){ const s=EX.ans[EX.i]; s.has(oi)?s.delete(oi):s.add(oi); } else EX.ans[EX.i]=EX.ans[EX.i]===oi?null:oi; renderEx(); }
function finishEx(){
  if(!EX||EX.finished) return; clearInterval(timerInt); timerInt=null; EX.finished=true;
  let R=0,W=0,B=0,pts=0,alt=0; const per={};
  const res=EX.qs.map((q,k)=>{ const r=scoreQ(q,EX.ans[k]); per[q.t]=per[q.t]||[0,0,0];
    if(r.blank){ B++; per[q.t][2]++; } else if(r.ok){ R++; per[q.t][0]++; } else { W++; per[q.t][1]++; }
    pts+=r.pts; if(!EX.flag[k]) alt+=r.pts;
    if(!r.blank&&!q.gen) recordQ(q.id,r.ok,"doubt");
    if(q.gen){ const g=S.gen[q.gen]||(S.gen[q.gen]={ok:0,ko:0}); r.ok?g.ok++:g.ko++; }
    return r; });
  const n=EX.qs.length, grade=Math.max(0,pts)/n*10, altG=Math.max(0,alt)/n*10;
  const hasFlags=EX.flag.some((f,k)=>f&&answered(k));
  S.sims.push({date:Date.now(),grade,right:R,wrong:W,blank:B,n,alt:hasFlags?altG:null}); save();
  VIEW="exam"; setNav("exam");
  $("#app").innerHTML=`<h1>Mock exam results</h1>
  <div class="grid g3"><div class="card"><div class="small muted">Grade</div><div class="kpi" style="color:${grade>=8?"var(--ok)":grade>=5?"var(--warn)":"var(--ko)"}">${fmt(grade)}</div><div class="small muted">${fmt(pts)} of ${n} points</div></div>
  <div class="card"><div class="small muted">Right / wrong or partial / blank</div><div class="kpi">${R} / ${W} / ${B}</div></div>
  <div class="card"><div class="small muted">If you had left the flagged ones blank</div><div class="kpi">${hasFlags?fmt(altG):"—"}</div><div class="small muted">${hasFlags?(altG>grade?"Leaving them blank would have been better.":altG<grade?"Answering them was the right call.":"It made no difference."):"You did not flag any as doubtful."}</div></div></div>
  <div class="card"><h3 style="margin-top:0">By unit</h3><div class="tablewrap"><table><tr><th>Unit</th><th>✔</th><th>✘</th><th>—</th></tr>${TK.filter(t=>per[t]).map(t=>`<tr><td><span class="tdot" style="background:${TOPICS[t].color}"></span> ${TOPICS[t].name}</td><td>${per[t][0]}</td><td>${per[t][1]}</td><td>${per[t][2]}</td></tr>`).join("")}</table></div></div>
  <div class="card"><h3 style="margin-top:0">Review</h3>${EX.qs.map((q,k)=>{ const r=res[k];
    return `<div class="aowrap"><div class="small" style="font-weight:700;color:${r.blank?"var(--warn)":r.ok?"var(--ok)":"var(--ko)"}">${k+1}. ${r.blank?"Blank":r.ok?"Correct":q.m&&r.pts>0?`Partial (${fmt(r.pts)})`:"Wrong"} · ${fmt(r.pts)} points${EX.flag[k]?" · flagged as doubtful":""}${q.gen?" · generated exercise":""}</div>
    ${qBody(q)}<div>${optsHTML(q,EX.orders[k],EX.ans[k],true)}</div><details class="self"><summary>Explanation</summary>${expl(q)}</details></div>`; }).join("")}</div>
  <div class="row"><button class="btn" id="exAgain">Another mock exam</button><button class="btn ghost" id="exWrong">Review my mistakes</button></div>`;
  $("#exAgain").onclick=()=>{ EX=null; exam(); }; $("#exWrong").onclick=()=>startPractice("wrong");
  touchDay(); window.scrollTo(0,0);
}

/* ============================ STRATEGY ============================ */
function strategy(){
  $("#app").innerHTML=document.getElementById("tpl-strategy").innerHTML;
  $("#cN").value=S.settings.n; $("#cP").value=S.settings.pen;
  const calc=()=>{ const N=+$("#cN").value||11, Rr=+$("#cR").value||0, W=+$("#cW").value||0, pen=parseFloat($("#cP").value)||0;
    const g=Math.max(0,Rr-W*pen)/N*10; $("#cOut").innerHTML=`${fmt(g)} <small>/ 10 · ${Math.max(0,N-Rr-W)} blank</small>`; $("#cOut").style.color=g>=8?"var(--ok)":"var(--text)";
    const need=Math.ceil(0.8*N+W*pen-1e-9); $("#cHint").textContent=Rr+W>N?"Right and wrong answers cannot add up to more than the number of questions.":`For an 8 with ${W} wrong you need ${need} right out of ${N}; with none wrong, ${Math.ceil(0.8*N-1e-9)}.`; };
  ["cN","cR","cW","cP"].forEach(i=>$("#"+i).oninput=calc); calc();
}

/* ============================ KEYBOARD, THEME, START ============================ */
document.addEventListener("keydown",e=>{
  if(e.target.matches("input,select,textarea")||e.ctrlKey||e.metaKey||e.altKey) return;
  const k=e.key.toLowerCase();
  if(VIEW==="practice"&&P&&$("#opts")){
    const q=P.items[P.i];
    if(P.stage!=="done"&&/^[1-5]$/.test(k)){ const oi=P.order[+k-1]; if(oi!=null) pickP(oi); }
    else if(P.stage!=="done"&&(q.m?P.sel.size:P.sel!=null)&&{q:1,w:1,e:1}[k]) answerP({q:"sure",w:"doubt",e:"guess"}[k]);
    else if(P.stage==="done"&&k==="enter"){ e.preventDefault(); nextP(); }
  } else if(VIEW==="lab"&&LB&&$("#opts")&&$("#lbBack")){
    if(!LB.done&&/^[1-5]$/.test(k)){ const oi=LB.order[+k-1]; if(oi!=null){ if(LB.q.m){ LB.sel.has(oi)?LB.sel.delete(oi):LB.sel.add(oi); } else LB.sel=oi; renderLab(); } }
    else if(k==="enter"){ e.preventDefault(); if(LB.done) newLab(LB.k); else checkLab(); }
  } else if(VIEW==="flash"&&FC&&$("#fcCard")){
    if(k===" "){ e.preventDefault(); if(!FC.flip){ FC.flip=true; renderFC(); } }
    else if(FC.flip&&/^[1-3]$/.test(k)) rateFC(+k-1);
  } else if(VIEW==="exam"&&EX&&!EX.finished&&$(".navgrid")){
    if(/^[1-5]$/.test(k)){ const oi=EX.orders[EX.i][+k-1]; if(oi!=null) exPick(oi); }
    else if(k==="arrowright"&&EX.i<EX.qs.length-1){ EX.i++; renderEx(); }
    else if(k==="arrowleft"&&EX.i>0){ EX.i--; renderEx(); }
  }
});
function applyTheme(){ if(S.theme) document.documentElement.setAttribute("data-theme",S.theme); else document.documentElement.removeAttribute("data-theme"); }
document.getElementById("themeBtn").onclick=()=>{ const dark=S.theme?S.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches; S.theme=dark?"light":"dark"; save(); applyTheme(); };
applyTheme(); renderStreak(); go("home");
}
