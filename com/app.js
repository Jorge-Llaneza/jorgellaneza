/* COM · Lógica. Interfaz, repetición espaciada, talleres y simulacros.
   Arranca cuando kv.js ha cargado los datos guardados (KV.ready). */
"use strict";
KV.ready.then(main);

function main(){
/* ============================ DATOS ============================ */
const TOPICS={
  p1:{name:"L0 · Formalización",short:"Formalización L0",color:"var(--p1)"},
  p2:{name:"L0 · Semántica y consecuencia lógica",short:"Semántica L0",color:"var(--p2)"},
  p3:{name:"L0 · Forma clausal, resolución y deducción natural",short:"Resolución y DN L0",color:"var(--p3)"},
  q1:{name:"L1 · Sintaxis y formalización",short:"Formalización L1",color:"var(--q1)"},
  q2:{name:"L1 · Interpretaciones y árboles AND/OR",short:"Semántica L1",color:"var(--q2)"},
  q3:{name:"L1 · Forma clausal, unificación y resolución",short:"Resolución L1",color:"var(--q3)"},
  q4:{name:"L1 · Deducción natural y propiedades",short:"DN L1",color:"var(--q4)"}
};
const TK=Object.keys(TOPICS);
const hash=s=>{ let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36); };
const Q=Q_L0.concat(Q_L1).map(q=>Object.assign({},q,{id:"q"+hash(q.q+"|"+q.o.join("|"))}));
(function(){ const seen={}; Q.forEach((q,i)=>{ if(seen[q.id]) q.id+="-"+i; seen[q.id]=1; }); })();
const F=F_RAW.map(x=>({id:"f"+hash(x[1]),t:x[0],f:x[1],b:x[2]}));
const GEN=LG.GEN, GK=Object.keys(GEN);

/* ============================ ESTADO ============================ */
const KEY="com-logica-v1", MIN=6e4, HOUR=36e5, DAY=864e5;
function defState(){ return {q:{},f:{},read:{},sims:[],conf:{sure:[0,0],doubt:[0,0],guess:[0,0]},gen:{},nd:{},settings:{examDate:"",n:11,minutes:40,pen:0.25,gens:3},days:[],theme:""}; }
let S=(function(){ try{ const raw=KV.getItem(KEY); if(raw){ const s=JSON.parse(raw), d=defState(); return Object.assign(d,s,{settings:Object.assign(d.settings,s.settings||{}),conf:Object.assign(d.conf,s.conf||{})}); } }catch(e){} return defState(); })();
function save(){ try{ KV.setItem(KEY,JSON.stringify(S)); }catch(e){} }
const dayKey=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function touchDay(){ const t=dayKey(new Date()); if(!S.days.includes(t)){ S.days.push(t); save(); } renderStreak(); }
function streak(){ let n=0; const set=new Set(S.days), d=new Date(); if(!set.has(dayKey(d))) d.setDate(d.getDate()-1);
  while(set.has(dayKey(d))){ n++; d.setDate(d.getDate()-1); } return n; }
function renderStreak(){ const n=streak(); document.getElementById("hdrStreak").textContent=n+(n===1?" día":" días")+" seguidos"; }

/* ============================ UTILIDADES ============================ */
const $=s=>document.querySelector(s);
const esc=LG.esc, shuffle=LG.shuffle, pick=LG.pick;
const LET="ABCDE";
const isMeta=o=>/^None of the/i.test(o);
function optOrder(q){ if(q.ns) return q.o.map((_,i)=>i); const mv=[],fx=[]; q.o.forEach((o,i)=>(isMeta(o)?fx:mv).push(i)); return shuffle(mv).concat(fx); }
function examMs(){ if(!S.settings.examDate) return null; const t=new Date(S.settings.examDate+"T09:00:00").getTime(); return isNaN(t)?null:t; }
function daysLeft(){ const t=examMs(); return t==null?null:Math.ceil((t-Date.now())/DAY); }
const expl=q=>q.eh?q.e:`<p style="margin:.4em 0 0">${esc(q.e)}</p>`;
const tpill=t=>`<span class="pill"><span class="tdot" style="background:${TOPICS[t].color}"></span>${TOPICS[t].short}</span>`;
const fmt=(x,d=2)=>x.toFixed(d).replace(".",",");

/* ============================ REPETICIÓN ESPACIADA ============================
   Cajas 0-6. Un fallo vuelve en 10 minutos (y otra vez en la misma sesión).
   Un acierto nunca vuelve antes de 20 horas: «Seguro» salta al menos a la caja 3 (3 días),
   «Dudo» al menos a la 2 (1 día) y «A ciegas» se trata como suerte (1 día, sin subir de caja).
   Con fecha de examen, los intervalos se acortan para que todo vuelva al menos una vez antes. */
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

/* preguntas generadas */
function genItem(k){ const g=GEN[k]; return Object.assign(g.make(),{t:g.t,gen:k,id:"g:"+k}); }
function weakGenKeys(){ return shuffle(GK).sort((a,b)=>mastery(GEN[a].t)-mastery(GEN[b].t)); }

/* puntuación tipo Campus Virtual */
function scoreQ(q,sel){
  if(!q.m){ if(sel==null) return {ok:false,blank:true,pts:0}; const ok=sel===q.a; return {ok,blank:false,pts:ok?1:-S.settings.pen}; }
  const arr=[...(sel||[])]; if(!arr.length) return {ok:false,blank:true,pts:0};
  const nG=q.a.length, nB=q.o.length-nG, g=arr.filter(i=>q.a.includes(i)).length, b=arr.length-g;
  return {ok:g===nG&&b===0,blank:false,pts:Math.max(0,g/nG-(nB?b/nB:0))};
}
const rightLetters=(q,order)=>(q.m?q.a:[q.a]).map(i=>LET[order.indexOf(i)]).sort().join(", ");

/* ============================ RENDERIZADO DE PREGUNTAS ============================ */
function optsHTML(q,order,sel,lock){
  const isSel=i=>q.m?sel.has(i):sel===i, good=i=>q.m?q.a.includes(i):q.a===i;
  return order.map((oi,pos)=>{ let cls="opt"+(q.m?" multi":"");
    if(lock){ cls+=" lock"; if(good(oi)) cls+=isSel(oi)||!q.m?" right":" missed"; else if(isSel(oi)) cls+=" wrong"; }
    else if(isSel(oi)) cls+=" sel";
    return `<button class="${cls}" data-oi="${oi}"><span class="let">${LET[pos]}</span><span>${esc(q.o[oi])}</span></button>`; }).join("");
}
function qBody(q){
  return `<div class="qtext">${esc(q.q)}</div>${q.c?`<pre>${esc(q.c)}</pre>`:""}${q.m?`<div class="small muted">Selecciona una o más opciones.</div>`:""}`;
}

/* ============================ ROUTER ============================ */
let VIEW="home", timerInt=null;
const views={home,learn,practice,lab,flash,exam,strategy};
function setNav(v){ document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===v)); }
function go(v,arg){ VIEW=v; setNav(v); window.scrollTo(0,0); views[v](arg); }
document.getElementById("nav").addEventListener("click",e=>{ const b=e.target.closest("button"); if(b) go(b.dataset.v); });

/* ============================ INICIO ============================ */
function nextStep(){
  const unread=TK.filter(t=>!S.read[t]), seen=Q.filter(q=>sq(q.id).seen).length;
  const dq=dueQ().length, df=dueF().filter(f=>S.f[f.id]).length;
  if(!seen&&unread.length===TK.length) return {t:"Empieza por el tema 1",d:"Lee el resumen de formalización (10 minutos) y haz su test nada más terminar.",b:"Ir al tema 1",a:()=>go("learn","p1")};
  if(dq+df>=8) return {t:`Repaso pendiente: ${dq} preguntas y ${df} flashcards`,d:"Son las que estás a punto de olvidar. Lo que ya dominas no aparece hasta su fecha.",b:dq?"Repasar preguntas":"Repasar flashcards",a:()=>dq?startPractice("due"):go("flash")};
  if(unread.length){ const t=unread[0]; return {t:`Aprende: ${TOPICS[t].name}`,d:"Lee el resumen y haz el test del tema enseguida.",b:"Ir al tema",a:()=>go("learn",t)}; }
  const weak=TK.map(t=>[t,mastery(t)]).sort((a,b)=>a[1]-b[1])[0];
  if(weak[1]<0.6&&unseenQ(weak[0]).length) return {t:`Refuerza tu tema más flojo: ${TOPICS[weak[0]].name}`,d:`Dominio actual: ${Math.round(weak[1]*100)}%.`,b:"Practicar este tema",a:()=>startPractice(weak[0])};
  const labN=Object.values(S.gen).reduce((s,x)=>s+(x.ok||0)+(x.ko||0),0);
  if(labN<12) return {t:"Prueba los talleres",d:"Árboles AND/OR, unificación, Skolem y forma clausal generados al momento: cada ejercicio es nuevo.",b:"Ir a Talleres",a:()=>go("lab")};
  if(unseenQ().length) return {t:"Repaso inteligente",d:`Te quedan ${unseenQ().length} preguntas nuevas. El repaso las mezcla con lo que toca repasar.`,b:"Empezar",a:()=>startPractice("smart")};
  return {t:"Haz un simulacro",d:"11 preguntas con tiempo y penalización, como en Campus Virtual.",b:"Empezar simulacro",a:()=>go("exam")};
}
function home(){
  const g=predicted(), dl=daysLeft(), ns=nextStep();
  const seen=Q.filter(q=>sq(q.id).seen).length, mast=masteredQ().length, dq=dueQ().length, wr=wrongQ().length;
  const c=S.conf, pct=a=>a[0]+a[1]?Math.round(a[0]/(a[0]+a[1])*100)+"%":"—";
  const thr=Math.round(S.settings.pen/(1+S.settings.pen)*100);
  $("#app").innerHTML=`
  <h1>Parcial de lógica</h1>
  <div class="split">
    <div class="card next"><div class="small muted">SIGUIENTE PASO</div><h2 style="margin:.15em 0">${esc(ns.t)}</h2><p class="muted">${esc(ns.d)}</p><button class="btn" id="nsBtn">${esc(ns.b)} →</button></div>
    <div class="card"><div class="small muted">Nota estimada</div><div class="kpi" style="color:${g>=8?"var(--ok)":g>=5?"var(--warn)":"var(--ko)"}">${fmt(g,1)} <small>/ 10</small></div>
      <div class="bar" style="margin-top:8px"><i style="width:${g*10}%;background:${g>=8?"var(--ok)":"var(--accent)"}"></i></div>
      <div class="small muted" style="margin-top:6px">Sale de cómo de asentada tienes cada pregunta y de tus dos últimos simulacros.</div></div>
  </div>
  <div class="grid g3">
    <div class="card"><div class="small muted">Banco de ${Q.length} preguntas</div><div class="kpi">${seen}<small> vistas</small></div>
      <div class="small muted">${mast} dominadas · ${unseenQ().length} nuevas</div></div>
    <div class="card"><div class="small muted">Para hoy</div><div class="kpi">${dq}<small> repasos</small></div>
      <div class="small muted">${wr} en «Mis fallos» · ${dueF().filter(f=>S.f[f.id]).length} flashcards</div></div>
    <div class="card"><div class="small muted">Examen</div><div class="kpi">${dl==null?"—":dl<0?"Pasado":dl+"<small> días</small>"}</div>
      <label class="small muted">Fecha: <input type="date" id="exDate" value="${esc(S.settings.examDate)}"></label></div>
  </div>
  <div class="card"><h2 style="margin-top:0">Dominio por tema</h2>
    ${TK.map(t=>{ const m=mastery(t); return `<div style="margin:12px 0"><div class="row" style="justify-content:space-between"><span><span class="tdot" style="background:${TOPICS[t].color}"></span> ${TOPICS[t].name} ${S.read[t]?'<span class="tag">leído</span>':""}</span><span class="small muted">${Math.round(m*100)}% · ${Q.filter(q=>q.t===t).length} preguntas</span></div>
      <div class="bar" style="margin-top:4px"><i style="width:${m*100}%;background:${TOPICS[t].color}"></i></div>
      <div class="row" style="margin-top:6px"><button class="btn ghost sm" data-learn="${t}">Leer</button><button class="btn ghost sm" data-prac="${t}">Practicar</button></div></div>`; }).join("")}
    <p class="small muted">Una pregunta cuenta como dominada cuando llega a la caja 4: varios aciertos espaciados durante una semana o más.</p>
  </div>
  <div class="grid g2">
    <div class="card"><h2 style="margin-top:0">Tu calibración</h2>
      <p class="small muted">Con la penalización de ${fmt(S.settings.pen)}, responder compensa si aciertas más del <b>${thr}%</b> de las veces.</p>
      <table><tr><th>Cuando dices…</th><th>Aciertas</th><th>Respuestas</th></tr>
      <tr><td>Seguro</td><td>${pct(c.sure)}</td><td>${c.sure[0]+c.sure[1]}</td></tr>
      <tr><td>Dudo</td><td>${pct(c.doubt)}</td><td>${c.doubt[0]+c.doubt[1]}</td></tr>
      <tr><td>A ciegas</td><td>${pct(c.guess)}</td><td>${c.guess[0]+c.guess[1]}</td></tr></table>
      <p class="small">${calAdvice()}</p></div>
    <div class="card"><h2 style="margin-top:0">Simulacros</h2>
      ${S.sims.length?`<div class="hist">${S.sims.slice(-10).map(s=>`<div style="height:${Math.max(4,s.grade*7)}px;background:${s.grade>=8?"var(--ok)":"var(--accent)"}" title="${new Date(s.date).toLocaleDateString()}"><span>${fmt(s.grade,1)}</span></div>`).join("")}</div>
      <p class="small muted">Últimas notas (en verde, 8 o más).</p>`:`<p class="muted">Aún no has hecho ninguno. Cuando hayas visto la mitad del banco, haz uno cada pocos días.</p>`}
      <button class="btn ghost sm" id="goExam">Ir a Simulacro</button></div>
  </div>
  <div class="card"><h2 style="margin-top:0">Cómo funciona</h2>
    <ol class="tight">
      <li><b>Aprender</b>: resumen de cada tema con ejemplos de los exámenes y sus trampas.</li>
      <li><b>Practicar</b>: sesiones de 10 con lo que toca repasar, preguntas nuevas y 2 ejercicios generados. Lo que aciertas con seguridad no vuelve en días; lo que fallas vuelve en la misma sesión.</li>
      <li><b>Talleres</b>: árboles AND/OR, unificación, composición, Skolem, forma clausal y razonamientos generados sin fin, y 15 demostraciones de deducción natural para rellenar.</li>
      <li><b>Flashcards</b> para definiciones, leyes y reglas.</li>
      <li><b>Simulacro</b>: 11 preguntas de una o varias respuestas, con tiempo y penalización.</li>
    </ol>
    <p class="small muted">El progreso se guarda en este navegador (y en la copia de seguridad de la página principal). Atajos: <span class="kbd">1</span>–<span class="kbd">5</span> eligen opción, <span class="kbd">Q</span> <span class="kbd">W</span> <span class="kbd">E</span> la seguridad, <span class="kbd">Intro</span> sigue y <span class="kbd">Espacio</span> gira la flashcard.</p>
    <button class="btn ghost sm" id="resetBtn">Borrar todo el progreso</button></div>`;
  $("#nsBtn").onclick=ns.a; $("#goExam").onclick=()=>go("exam");
  $("#exDate").onchange=e=>{ S.settings.examDate=e.target.value; save(); home(); };
  document.querySelectorAll("[data-learn]").forEach(b=>b.onclick=()=>go("learn",b.dataset.learn));
  document.querySelectorAll("[data-prac]").forEach(b=>b.onclick=()=>startPractice(b.dataset.prac));
  $("#resetBtn").onclick=e=>{ const b=e.target; if(b.dataset.c){ S=defState(); save(); home(); renderStreak(); } else { b.dataset.c=1; b.textContent="¿Seguro? Pulsa otra vez para borrarlo todo"; b.classList.add("ko"); } };
}
function calAdvice(){
  const d=S.conf.doubt, n=d[0]+d[1], thr=S.settings.pen/(1+S.settings.pen);
  if(n<10) return "Marca tu seguridad en cada pregunta: con unas 10 dudosas sabremos si te conviene responderlas en el examen.";
  const p=d[0]/n;
  return p>thr+0.05?`Cuando dudas aciertas el ${Math.round(p*100)}%: <b>responde las dudosas</b>.`:p<thr-0.05?`Cuando dudas solo aciertas el ${Math.round(p*100)}%: <b>déjalas en blanco</b> salvo que hayas descartado opciones.`:"Estás justo en el umbral: responde solo si has descartado alguna opción.";
}

/* ============================ APRENDER ============================ */
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

/* ============================ PRACTICAR ============================ */
let P=null;
function practice(){
  const dq=dueQ().length, wr=wrongQ().length, ahead=Q.filter(q=>{ const s=sq(q.id); return s.seen&&s.due>Date.now(); }).length;
  $("#app").innerHTML=`<h1>Practicar</h1>
  <p class="muted">Sesiones de 10 preguntas con corrección inmediata. Antes de ver la solución te pido tu seguridad: así sabrás cuándo te compensa dejar una en blanco, y una pregunta acertada con seguridad tarda días en volver.</p>
  <div class="card next"><h2 style="margin:0">Repaso inteligente</h2><p class="small muted">Primero lo que toca repasar hoy (${dq}), después preguntas nuevas de tus temas más flojos (${unseenQ().length} nuevas) y 2 ejercicios generados. Nunca te pone una pregunta acertada antes de su fecha.</p><button class="btn" data-m="smart">Empezar</button></div>
  <div class="grid g2">
   <div class="card"><h3 style="margin-top:0">Pendientes de repaso</h3><p class="small muted">${dq} preguntas en su momento de repaso.</p><button class="btn ghost" data-m="due" ${dq?"":"disabled"}>Repasar</button></div>
   <div class="card"><h3 style="margin-top:0">Mis fallos</h3><p class="small muted">${wr} preguntas cuya última respuesta fue un fallo. Salen de aquí en cuanto las aciertas.</p><button class="btn ghost" data-m="wrong" ${wr?"":"disabled"}>Repasar fallos</button></div>
  </div>
  <div class="card"><h3 style="margin-top:0">Por tema</h3><p class="small muted">Lo pendiente y lo nuevo del tema; si ya no queda nada, ejercicios generados.</p>
   <div class="row">${TK.map(t=>`<button class="btn ghost sm" data-m="${t}"><span class="tdot" style="background:${TOPICS[t].color}"></span>${TOPICS[t].short} (${unseenQ(t).length} nuevas)</button>`).join("")}</div></div>
  <div class="card"><h3 style="margin-top:0">Adelantar repasos</h3><p class="small muted">${ahead} preguntas ya acertadas que todavía no tocan. Solo si quieres repasar antes de tiempo, por ejemplo la víspera del examen.</p><button class="btn ghost sm" data-m="ahead" ${ahead?"":"disabled"}>Repasar antes de tiempo</button></div>`;
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
    if(items.length<n&&gk.length){ if(!items.length) note="Ya no te quedan preguntas nuevas ni repasos de este tema: te pongo ejercicios generados."; while(items.length<n) items.push(genItem(pick(gk))); }
    else if(!items.length) note="empty";
  } else {
    const nS=n-2, out=due.slice(0,Math.ceil(nS*0.6));
    const pools=TK.slice().sort((a,b)=>mastery(a)-mastery(b)).map(t=>shuffle(unseenQ(t)));
    let k=0; while(out.length<nS&&pools.some(p=>p.length)){ const p=pools[k%pools.length]; if(p.length) out.push(p.shift()); k++; }
    for(const q of due){ if(out.length>=nS) break; if(!out.includes(q)) out.push(q); }
    items=shuffle(out);
    if(!out.length) note="Has visto todo el banco y no tienes repasos pendientes: hoy te pongo ejercicios generados, que son nuevos cada vez.";
    const gk=weakGenKeys(); let i=0;
    while(items.length<n){ items.splice(Math.floor(Math.random()*(items.length+1)),0,genItem(gk[i++%gk.length])); }
  }
  return {items,note};
}
function startPractice(mode){
  VIEW="practice"; setNav("practice");
  const {items,note}=buildSession(mode);
  if(!items.length){ $("#app").innerHTML=`<h1>Practicar</h1><div class="card"><h2 style="margin-top:0">Todo al día</h2><p>No hay nada pendiente aquí: lo que has acertado volverá cuando toque. Puedes hacer otra cosa o adelantar repasos si el examen está cerca.</p><div class="row"><button class="btn" id="eBack">Volver a Practicar</button><button class="btn ghost" id="eLab">Ir a Talleres</button></div></div>`; $("#eBack").onclick=()=>go("practice"); $("#eLab").onclick=()=>go("lab"); return; }
  P={mode,items,i:0,res:[],note,sel:null,stage:"choose",order:null};
  prepP(); renderP(); window.scrollTo(0,0);
}
function prepP(){ const q=P.items[P.i]; P.order=optOrder(q); P.sel=q.m?new Set():null; P.stage="choose"; }
function renderP(){
  const q=P.items[P.i], st=q.gen?null:sq(q.id), lock=P.stage==="done";
  const hasSel=q.m?P.sel.size>0:P.sel!=null;
  let h=(P.note&&P.i===0?`<div class="card mnemo" style="margin-top:0">${esc(P.note)}</div>`:"")+
  `<div class="row" style="justify-content:space-between">${tpill(q.t)}<span class="small muted">${P.i+1}/${P.items.length} · ${q.gen?"ejercicio generado":q.again?"repetición de un fallo":st.seen?`vista ${st.seen} ${st.seen===1?"vez":"veces"}`:"nueva"}${q.x?` · ${esc(q.x)}`:""}</span></div>
  <div class="bar" style="margin:8px 0 4px"><i style="width:${P.i/P.items.length*100}%"></i></div>
  <div class="card">${qBody(q)}<div id="opts">${optsHTML(q,P.order,P.sel,lock)}</div>`;
  if(!lock&&hasSel) h+=`<div class="conf"><div class="small" style="font-weight:600;margin-bottom:6px">¿Cuánta seguridad tienes? <span class="muted">(en el examen decidirías si responder o dejarla en blanco)</span></div>
    <div class="row"><button class="btn ok sm" data-c="sure">Seguro <span class="kbd">Q</span></button><button class="btn warn sm" data-c="doubt">Dudo <span class="kbd">W</span></button><button class="btn ko sm" data-c="guess">A ciegas <span class="kbd">E</span></button></div></div>`;
  if(!lock) h+=`<div class="row" style="margin-top:8px"><button class="btn ghost sm" id="blankBtn">No lo sé: la dejaría en blanco</button></div>`;
  if(lock){ const r=P.res[P.i];
    h+=`<div class="fb ${r.blank?"na":r.ok?"ok":"ko"}"><b>${r.blank?"En blanco (0 puntos).":r.ok?"Correcto.":q.m&&r.pts>0?`Parcialmente correcto (${fmt(r.pts)} de 1).`:"Incorrecto."}</b> ${r.ok?"":`${q.m?"Correctas":"La correcta es"}: <b>${rightLetters(q,P.order)}</b>.`}${expl(q)}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="nextBtn">${P.i+1<P.items.length?"Siguiente":"Ver resultado"} <span class="kbd" style="background:transparent;color:inherit">↵</span></button></div>`; }
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
  $("#app").innerHTML=`<h1>Resultado de la sesión</h1>
  <div class="grid g3"><div class="card"><div class="small muted">Aciertos</div><div class="kpi" style="color:var(--ok)">${ok}<small> / ${firsts.length}</small></div></div>
  <div class="card"><div class="small muted">Fallos / en blanco</div><div class="kpi">${ko} / ${bl}</div></div>
  <div class="card"><div class="small muted">Nota con penalización ${fmt(S.settings.pen)}</div><div class="kpi" style="color:${g>=8?"var(--ok)":"var(--warn)"}">${fmt(g,1)}</div></div></div>
  ${failed.length?`<div class="card"><h3 style="margin-top:0">Lo que has fallado (volverá en 10 minutos y hasta que lo aciertes)</h3>${failed.map(q=>`<div style="border-top:1px solid var(--border);padding:8px 0"><b>${esc(q.q)}</b>${q.c?`<pre>${esc(q.c)}</pre>`:""}<div style="color:var(--ok)">${(q.m?q.a:[q.a]).map(i=>"✔ "+esc(q.o[i])).join("<br>")}</div></div>`).join("")}</div>`:`<div class="card"><p>Sesión perfecta. Estas preguntas no volverán hasta dentro de unos días.</p></div>`}
  <div class="row"><button class="btn" id="againBtn">Otra sesión</button><button class="btn ghost" id="homeBtn">Volver al inicio</button></div>`;
  $("#againBtn").onclick=()=>startPractice(P.mode==="due"&&!dueQ().length?"smart":P.mode==="wrong"&&!wrongQ().length?"smart":P.mode);
  $("#homeBtn").onclick=()=>go("home");
}

/* ============================ TALLERES ============================ */
let LB=null;
function lab(arg){
  if(arg==="nd"){ ndList(); return; }
  if(arg&&GEN[arg]){ newLab(arg); return; }
  const stat=k=>{ const s=S.gen[k]; return s&&(s.ok+s.ko)?`<span class="tag">${s.ok}/${s.ok+s.ko} bien</span>`:""; };
  const card=k=>`<div class="card gencard"><div class="row" style="justify-content:space-between">${tpill(GEN[k].t)}${stat(k)}</div><h3>${GEN[k].name}</h3><p class="small muted" style="margin:0">${GEN[k].desc}</p><div><button class="btn sm" data-g="${k}">Empezar</button></div></div>`;
  const ndDone=ND.filter((_,i)=>(S.nd[i]||{}).best===1).length;
  $("#app").innerHTML=`<h1>Talleres</h1>
  <p class="muted">Ejercicios del tipo del examen generados al momento, con la solución paso a paso. Nunca se repiten, así que puedes hacer todos los que quieras.</p>
  <div class="card next"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Deducción natural: rellenar huecos</h2><span class="tag">${ndDone}/${ND.length} completas</span></div>
    <p class="small muted">Las 15 demostraciones de las diapositivas, los exámenes y los simulacros, con fórmulas y justificaciones por completar. Es el ejercicio de 2,5 puntos del examen escrito y la pregunta 11 de los simulacros.</p><button class="btn" id="ndGo">Elegir una demostración</button></div>
  <h2>Lógica proposicional</h2><div class="grid g3">${GK.filter(k=>GEN[k].t[0]==="p").map(card).join("")}</div>
  <h2>Lógica de predicados</h2><div class="grid g3">${GK.filter(k=>GEN[k].t[0]==="q").map(card).join("")}</div>`;
  $("#ndGo").onclick=ndList;
  document.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>newLab(b.dataset.g));
}
function newLab(k){ VIEW="lab"; setNav("lab"); const q=genItem(k); LB={k,q,order:optOrder(q),sel:q.m?new Set():null,done:false,r:null}; renderLab(); window.scrollTo(0,0); }
function renderLab(){
  const {k,q,order,sel,done}=LB, hasSel=q.m?sel.size>0:sel!=null;
  let h=`<div class="row" style="justify-content:space-between"><button class="btn ghost sm" id="lbBack">← Talleres</button>${tpill(q.t)}</div>
  <h1 style="margin-top:.4em">${GEN[k].name}</h1><div class="card">${qBody(q)}<div id="opts">${optsHTML(q,order,sel,done)}</div>`;
  if(!done) h+=`<div class="row" style="margin-top:10px"><button class="btn" id="lbChk" ${hasSel?"":"disabled"}>Comprobar <span class="kbd" style="background:transparent;color:inherit">↵</span></button></div>`;
  else { const r=LB.r; h+=`<div class="fb ${r.ok?"ok":"ko"}"><b>${r.ok?"Correcto.":q.m&&r.pts>0?`Parcialmente correcto (${fmt(r.pts)} de 1).`:"Incorrecto."}</b> ${r.ok?"":`${q.m?"Correctas":"La correcta es"}: <b>${rightLetters(q,order)}</b>.`}<div style="margin-top:8px">${expl(q)}</div></div>
    <div class="row" style="margin-top:12px"><button class="btn" id="lbNext">Otro ejercicio <span class="kbd" style="background:transparent;color:inherit">↵</span></button></div>`; }
  h+=`</div>`;
  $("#app").innerHTML=h;
  $("#lbBack").onclick=()=>go("lab");
  if(!done) $("#opts").onclick=e=>{ const b=e.target.closest(".opt"); if(!b) return; const oi=+b.dataset.oi; if(q.m){ sel.has(oi)?sel.delete(oi):sel.add(oi); } else LB.sel=oi; renderLab(); };
  const c=$("#lbChk"); if(c) c.onclick=checkLab;
  const n=$("#lbNext"); if(n){ n.onclick=()=>newLab(k); n.focus(); }
}
function checkLab(){ const q=LB.q; if(q.m?!LB.sel.size:LB.sel==null) return; LB.r=scoreQ(q,LB.sel); LB.done=true;
  const g=S.gen[LB.k]||(S.gen[LB.k]={ok:0,ko:0}); LB.r.ok?g.ok++:g.ko++; touchDay(); save(); renderLab(); }

/* --- deducción natural con huecos --- */
let NDS=null;
function ndList(){
  VIEW="lab"; setNav("lab");
  const row=(p,i)=>{ const s=S.nd[i]||{}; return `<button class="opt" data-nd="${i}"><span class="let">${i+1}</span><span style="flex:1"><span class="fx">${esc(p.goal)}</span><br><span class="small muted">${esc(p.src)} · ${p.lines.filter(l=>l[3]).length} huecos${s.best!=null?` · mejor: ${Math.round(s.best*100)}%`:""}</span></span></button>`; };
  $("#app").innerHTML=`<div class="row"><button class="btn ghost sm" id="lbBack">← Talleres</button></div><h1 style="margin-top:.4em">Deducción natural: rellenar huecos</h1>
  <p class="muted">Elige en cada desplegable la fórmula o la justificación que falta. Antes de mirar las opciones, intenta escribirla tú: es lo que pide el examen escrito.</p>
  <h2>Lógica proposicional</h2>${ND.map((p,i)=>p.t==="p3"?row(p,i):"").join("")}
  <h2>Lógica de predicados</h2>${ND.map((p,i)=>p.t==="q4"?row(p,i):"").join("")}`;
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
    return `<select data-gap="${li+kind}" class="${cls}" aria-label="Hueco"><option value="">— elige —</option>${g.opts.map(o=>`<option ${g.val===o?"selected":""}>${esc(o)}</option>`).join("")}</select>`; };
  pr.lines.forEach((l,li)=>{ while(depth>l[0]){ h+="</div>"; depth--; } while(depth<l[0]){ h+='<div class="ndbox">'; depth++; }
    h+=`<div class="ndl"><span class="n">${li+1}.</span><span>${cell(li,"f",l[1])}</span><span class="j">${cell(li,"j",l[2])}</span></div>`; });
  while(depth>0){ h+="</div>"; depth--; }
  return `<div class="nd">${h}</div>`;
}
function renderND(){
  const pr=ND[NDS.i], gs=Object.values(NDS.gaps), right=gs.filter(g=>g.val===g.right).length;
  $("#app").innerHTML=`<div class="row" style="justify-content:space-between"><button class="btn ghost sm" id="ndBack">← Demostraciones</button>${tpill(pr.t)}</div>
  <h1 style="margin-top:.4em" class="fx">${esc(pr.goal)}</h1><p class="small muted">${esc(pr.src)} · ${gs.length} huecos</p>
  <div class="card">${ndHTML()}
  ${NDS.checked&&!NDS.shown?`<div class="fb ${right===gs.length?"ok":"ko"}"><b>${right} de ${gs.length} huecos bien.</b> ${right===gs.length?"Demostración completa.":"Los desplegables en rojo están mal; corrígelos y vuelve a comprobar."}</div>`:""}
  <div class="row" style="margin-top:12px"><button class="btn" id="ndChk">Comprobar</button><button class="btn ghost" id="ndShow">${NDS.shown?"Ocultar la solución":"Ver la solución"}</button><button class="btn ghost" id="ndNext">Otra demostración</button></div></div>
  <p class="small muted">Recuerda: la línea que sigue a una caja dice qué regla la cerró, y cada caja empieza con un supuesto (o con «(t) free» si es de ∀I).</p>`;
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
  <p class="muted">Di la respuesta en voz alta o escríbela antes de girar la tarjeta, y puntúate con honestidad: lo que sabías tarda días en volver y lo que no, vuelve en esta misma tanda.</p>
  <div class="card"><div class="row" style="justify-content:space-between"><span><b>${rev}</b> para repasar · <b>${news}</b> nuevas · ${F.length} en total</span>
  <select id="fcTopic" aria-label="Tema"><option value="">Todos los temas</option>${TK.map(t=>`<option value="${t}">${TOPICS[t].name}</option>`).join("")}</select></div>
  <div class="row" style="margin-top:10px"><button class="btn" id="fcStart" ${due.length?"":"disabled"}>Empezar (${Math.min(due.length,20)})</button><button class="btn ghost" id="fcAll">Repasar todas las del tema</button></div>
  ${due.length?"":`<p class="small muted">No tienes ninguna pendiente: vuelve mañana o repasa un tema entero.</p>`}</div>
  <div class="card"><h3 style="margin-top:0">Cajas</h3>${[0,1,2,3,4,5,6].map(b=>{ const n=F.filter(f=>((S.f[f.id]||{}).box||0)===b).length; return `<div class="row small" style="margin:4px 0"><span style="width:110px">${b===0?"Nuevas":"Caja "+b}</span><div class="bar" style="flex:1"><i style="width:${n/F.length*100}%"></i></div><span style="width:30px;text-align:right">${n}</span></div>`; }).join("")}</div>`;
  const run=all=>{ const t=$("#fcTopic").value; let pool=(all?F:dueF()).filter(f=>!t||f.t===t); if(!pool.length) return;
    pool=all?shuffle(pool):shuffle(pool).sort((a,b)=>((S.f[a.id]||{}).box||0)-((S.f[b.id]||{}).box||0));
    FC={cards:pool.slice(0,all?pool.length:20),i:0,flip:false,done:0,requeued:new Set()}; renderFC(); };
  $("#fcStart").onclick=()=>run(false); $("#fcAll").onclick=()=>run(true);
}
function renderFC(){
  if(FC.i>=FC.cards.length){ $("#app").innerHTML=`<h1>Flashcards</h1><div class="card"><p>Has repasado ${FC.done} tarjetas.</p><div class="row"><button class="btn" id="fcBack">Volver</button><button class="btn ghost" id="fcPrac">Ahora, preguntas tipo test →</button></div></div>`; $("#fcBack").onclick=flash; $("#fcPrac").onclick=()=>startPractice("smart"); return; }
  const c=FC.cards[FC.i];
  $("#app").innerHTML=`<h1>Flashcards</h1><div class="row" style="justify-content:space-between">${tpill(c.t)}<span class="small muted">${FC.i+1}/${FC.cards.length}</span></div>
  <div class="card flash" id="fcCard"><div class="front">${esc(c.f)}</div>${FC.flip?`<div class="back fx">${esc(c.b)}</div>`:`<div class="small muted" style="margin-top:14px">Piensa la respuesta y pulsa para girar <span class="kbd">Espacio</span></div>`}</div>
  ${FC.flip?`<div class="row" style="justify-content:center"><button class="btn ko" data-r="0">No lo sabía <span class="kbd">1</span></button><button class="btn warn" data-r="1">A medias <span class="kbd">2</span></button><button class="btn ok" data-r="2">Lo sabía <span class="kbd">3</span></button></div>`:""}`;
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

/* ============================ SIMULACRO ============================ */
let EX=null;
function exam(){
  if(EX&&!EX.finished){ renderEx(); return; }
  const s=S.settings;
  $("#app").innerHTML=`<h1>Simulacro</h1>
  <p class="muted">Como el cuestionario de Campus Virtual: sin corrección hasta entregar, con tiempo, preguntas de una o de varias respuestas y penalización. Puedes dejar preguntas en blanco y marcar las dudosas.</p>
  <div class="card"><h3 style="margin-top:0">Configuración</h3><div class="row">
  <label>Preguntas <select id="sN">${[11,15,20,25].map(n=>`<option ${n==s.n?"selected":""}>${n}</option>`).join("")}</select></label>
  <label>Minutos <input type="number" id="sMin" value="${s.minutes}" min="5" max="180" style="width:70px"></label>
  <label>Penalización por fallo <input type="number" id="sPen" value="${s.pen}" step="0.05" min="0" max="1" style="width:80px"></label>
  <label>Ejercicios generados <select id="sGen">${[0,1,2,3,4,5].map(n=>`<option ${n==s.gens?"selected":""}>${n}</option>`).join("")}</select></label></div>
  <p class="small muted">Las preguntas del banco se reparten entre los temas y se eligen primero las que no has visto o no dominas; evita las que acertaste en los últimos 3 días. Los ejercicios generados son nuevos cada vez. En las de varias respuestas cada opción correcta suma su parte y cada incorrecta resta, sin bajar de 0.</p>
  <button class="btn" id="sGo">Empezar simulacro</button></div>
  ${S.sims.length?`<div class="card"><h3 style="margin-top:0">Historial</h3><div class="tablewrap"><table><tr><th>Fecha</th><th>Nota</th><th>✔ / ✘ / en blanco</th><th>Dejando en blanco las dudosas</th></tr>${S.sims.slice().reverse().slice(0,10).map(x=>`<tr><td>${new Date(x.date).toLocaleString()}</td><td><b>${fmt(x.grade)}</b></td><td>${x.right} / ${x.wrong} / ${x.blank}</td><td>${x.alt!=null?fmt(x.alt):"—"}</td></tr>`).join("")}</table></div></div>`:""}`;
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
  $("#app").innerHTML=`<div class="row" style="justify-content:space-between"><h1 style="margin:0">Simulacro</h1><span class="pill timer">Quedan <span id="exTimer">${mmss(EX.end-Date.now())}</span></span></div>
  <div class="card"><div class="navgrid">${EX.qs.map((_,k)=>`<button data-j="${k}" class="${answered(k)?"ans":""} ${EX.flag[k]?"flag":""} ${k===EX.i?"cur":""}" aria-label="Pregunta ${k+1}">${k+1}</button>`).join("")}</div>
  <p class="small muted" style="margin:.6em 0 0">${EX.qs.filter((_,k)=>answered(k)).length} respondidas · ${EX.flag.filter(Boolean).length} dudosas · pulsa otra vez una opción marcada para desmarcarla</p></div>
  <div class="card"><div class="small muted">Pregunta ${EX.i+1} de ${EX.qs.length} · 1 punto</div>${qBody(q)}<div id="opts">${optsHTML(q,ord,EX.ans[EX.i],false)}</div>
  <div class="row" style="margin-top:10px;justify-content:space-between">
   <label class="row small"><input type="checkbox" id="flagC" ${EX.flag[EX.i]?"checked":""}> Marcar como dudosa</label>
   <div class="row"><button class="btn ghost sm" id="prevB" ${EX.i?"":"disabled"}>← Anterior</button><button class="btn ghost sm" id="nextB" ${EX.i<EX.qs.length-1?"":"disabled"}>Siguiente →</button></div></div></div>
  <div class="row"><button class="btn" id="finB">Entregar</button><span class="small muted" id="finMsg"></span></div>`;
  document.querySelectorAll(".navgrid [data-j]").forEach(b=>b.onclick=()=>{ EX.i=+b.dataset.j; renderEx(); });
  $("#opts").onclick=e=>{ const b=e.target.closest(".opt"); if(b) exPick(+b.dataset.oi); };
  $("#flagC").onchange=e=>{ EX.flag[EX.i]=e.target.checked; renderEx(); };
  $("#prevB").onclick=()=>{ EX.i--; renderEx(); }; $("#nextB").onclick=()=>{ EX.i++; renderEx(); };
  $("#finB").onclick=e=>{ const bl=EX.qs.filter((_,k)=>!answered(k)).length; if(!e.target.dataset.c){ e.target.dataset.c=1; e.target.textContent="Confirmar entrega"; $("#finMsg").textContent=bl?`Tienes ${bl} en blanco.`:"Todas respondidas."; } else finishEx(); };
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
  $("#app").innerHTML=`<h1>Resultado del simulacro</h1>
  <div class="grid g3"><div class="card"><div class="small muted">Nota</div><div class="kpi" style="color:${grade>=8?"var(--ok)":grade>=5?"var(--warn)":"var(--ko)"}">${fmt(grade)}</div><div class="small muted">${fmt(pts)} de ${n} puntos</div></div>
  <div class="card"><div class="small muted">Bien / mal o parcial / en blanco</div><div class="kpi">${R} / ${W} / ${B}</div></div>
  <div class="card"><div class="small muted">Si hubieras dejado en blanco las dudosas</div><div class="kpi">${hasFlags?fmt(altG):"—"}</div><div class="small muted">${hasFlags?(altG>grade?"Te habría convenido dejarlas en blanco.":altG<grade?"Hiciste bien en responderlas.":"Daba igual."):"No marcaste ninguna como dudosa."}</div></div></div>
  <div class="card"><h3 style="margin-top:0">Por tema</h3><div class="tablewrap"><table><tr><th>Tema</th><th>✔</th><th>✘</th><th>—</th></tr>${TK.filter(t=>per[t]).map(t=>`<tr><td><span class="tdot" style="background:${TOPICS[t].color}"></span> ${TOPICS[t].name}</td><td>${per[t][0]}</td><td>${per[t][1]}</td><td>${per[t][2]}</td></tr>`).join("")}</table></div></div>
  <div class="card"><h3 style="margin-top:0">Revisión</h3>${EX.qs.map((q,k)=>{ const r=res[k];
    return `<div class="aowrap"><div class="small" style="font-weight:700;color:${r.blank?"var(--warn)":r.ok?"var(--ok)":"var(--ko)"}">${k+1}. ${r.blank?"En blanco":r.ok?"Correcta":q.m&&r.pts>0?`Parcial (${fmt(r.pts)})`:"Incorrecta"} · ${fmt(r.pts)} puntos${EX.flag[k]?" · marcada como dudosa":""}${q.gen?" · ejercicio generado":""}</div>
    ${qBody(q)}<div>${optsHTML(q,EX.orders[k],EX.ans[k],true)}</div><details class="self"><summary>Explicación</summary>${expl(q)}</details></div>`; }).join("")}</div>
  <div class="row"><button class="btn" id="exAgain">Otro simulacro</button><button class="btn ghost" id="exWrong">Repasar mis fallos</button></div>`;
  $("#exAgain").onclick=()=>{ EX=null; exam(); }; $("#exWrong").onclick=()=>startPractice("wrong");
  touchDay(); window.scrollTo(0,0);
}

/* ============================ ESTRATEGIA ============================ */
function strategy(){
  $("#app").innerHTML=document.getElementById("tpl-strategy").innerHTML;
  $("#cN").value=S.settings.n; $("#cP").value=S.settings.pen;
  const calc=()=>{ const N=+$("#cN").value||11, Rr=+$("#cR").value||0, W=+$("#cW").value||0, pen=parseFloat($("#cP").value)||0;
    const g=Math.max(0,Rr-W*pen)/N*10; $("#cOut").innerHTML=`${fmt(g)} <small>/ 10 · ${Math.max(0,N-Rr-W)} en blanco</small>`; $("#cOut").style.color=g>=8?"var(--ok)":"var(--text)";
    const need=Math.ceil(0.8*N+W*pen-1e-9); $("#cHint").textContent=Rr+W>N?"Aciertos y fallos no pueden sumar más que el número de preguntas.":`Para un 8 con ${W} fallos necesitas ${need} aciertos de ${N}; sin fallos, ${Math.ceil(0.8*N-1e-9)}.`; };
  ["cN","cR","cW","cP"].forEach(i=>$("#"+i).oninput=calc); calc();
}

/* ============================ TECLADO, TEMA, ARRANQUE ============================ */
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
