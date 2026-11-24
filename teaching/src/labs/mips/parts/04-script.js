
(function(){
const KEY='mp64blitz',TOT=10,TIME=30,B=$('blitz');
const emit=o=>{try{parent!==window&&parent.postMessage(Object.assign({mp:'blitz'},o),'*')}catch(e){}};
const ldS=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}};
const svS=o=>{try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}};
const dayNum=()=>{const d=new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5)};
let G=null,timer=null;
function shuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function numChoices(c,extra,rnd){
  const cand=[c-2,c-1,c+1,c+2,c+3,...extra].filter((v,i,a)=>v>=0&&v!==c&&a.indexOf(v)===i);
  const pick=shuffle(cand,rnd).slice(0,3);
  for(let k=1;pick.length<3;k++){const v=c+3+k;if(!pick.includes(v))pick.push(v)}
  const all=shuffle([c,...pick],rnd);return{ch:all.map(String),ans:all.indexOf(c)};
}
function mkRound(i,seedBase,rnd){
  const level=G.endless?(i<2?2:i<4?3:i<6?4:i<8?5:i<10?6:i<13?7:i<16?8:i<20?9:10):([2,2,3,3,4,4,5,5,6,7][i]||7);
  for(let tries=0;tries<30;tries++){
    const seed=seedBase*37+i*101+tries*7;
    const g=gen(level,seed),o=mkO(g.opts),Pp=parse(g.code),sm=simulate(Pp,o);
    if(!sm.rows.length||sm.n<2||sm.maxC>26)continue;
    const types=shuffle(['cyc','stall','stage','fwd','worst'],rnd);
    for(const ty of types){
      const q=build(ty,g,o,Pp,sm,rnd);if(q){q.level=level;q.code=g.code;q.opts=g.opts;return q}
    }
  }
  for(let tries=0;tries<40;tries++){
    const seed=seedBase*37+i*101+tries*11+5,g=gen(4,seed),o=mkO(g.opts),Pp=parse(g.code),sm=simulate(Pp,o);
    if(!sm.rows.length||sm.n<2||sm.maxC>26)continue;
    const q=build('cyc',g,o,Pp,sm,rnd);if(q){q.level=4;q.code=g.code;q.opts=g.opts;return q}
  }
  return null;
}
function build(ty,g,o,Pp,sm,rnd){
  const T=sm.total,n=sm.n,ideal=n+4;
  if(ty==='cyc'){const c=numChoices(T,[ideal,5*n],rnd);
    return{q:'How many clock cycles until the last instruction finishes (WB)?',...c,sm,why:`Total = ${T} cycles for ${n} executed instructions (ideal without hazards would be ${ideal}).`}}
  if(ty==='stall'){const s=T-ideal;if(s<1)return null;const c=numChoices(s,[],rnd);
    return{q:`This run executes ${n} instructions, so the ideal pipeline needs ${n}+4 = ${ideal} cycles. How many extra cycles does it actually lose?`,...c,sm,why:`${T} − ${ideal} = ${s} extra cycle(s).`}}
  if(ty==='stage'){
    const rows=sm.rows.filter(r=>!r.fl&&Object.keys(r.cells).length>3);if(!rows.length)return null;
    const r=rows[Math.floor(rnd()*rows.length)],cs=Object.keys(r.cells).map(Number),cy=cs[Math.floor(rnd()*cs.length)];
    const st=base(r.cells[cy].l),opts=['IF','ID','EX','MEM','WB'];
    const three=shuffle(opts.filter(x=>x!==st),rnd).slice(0,3),all=shuffle([st,...three],rnd);
    return{q:`In clock cycle ${cy}, which stage is “${r.x.line}”${r.n>1?` (execution #${r.n})`:''} in? (Stalls repeat the stage they wait in.)`,ch:all,ans:all.indexOf(st),sm,why:`Look at the row of “${r.x.line}”, column ${cy}: ${st}.`}}
  if(ty==='fwd'){
    const o2=Object.assign({},g.opts,{fwd:g.opts.fwd?0:1}),s2=simulate(Pp,mkO(o2));
    if(s2.total===T||s2.maxC>26)return null;const c=numChoices(s2.total,[T],rnd);
    return{q:`With these settings the program takes ${T} cycles. How many cycles would it take with forwarding turned ${g.opts.fwd?'OFF':'ON'} (everything else equal)?`,...c,sm:s2,why:`With forwarding ${g.opts.fwd?'off':'on'} the total is ${s2.total} cycles (diagram below shows that case).`}}
  if(ty==='worst'){
    const rows=sm.rows.filter(r=>!r.fl);if(rows.length<3||rows.length>8)return null;
    const cnt=rows.map(r=>Object.values(r.cells).filter(c=>c.s).length),mx=Math.max(...cnt);
    if(mx<1||cnt.filter(v=>v===mx).length>1)return null;
    const lab=r=>r.x.line+(r.n>1?` #${r.n}`:''),names=rows.map(lab);
    if(new Set(names).size!==names.length)return null;
    const ci=cnt.indexOf(mx),others=shuffle(names.filter((_,k)=>k!==ci),rnd).slice(0,3);
    if(others.length<2)return null;
    const all=shuffle([names[ci],...others],rnd);
    return{q:'Which instruction spends the most stall cycles (hatched cells)?',ch:all,ans:all.indexOf(names[ci]),sm,why:`“${names[ci]}” stalls ${mx} cycle(s), more than any other.`}}
  return null;
}
function menu(){
  emit({type:'menu'});clearInterval(timer);const s=ldS(),d=dayNum(),done=s.daily&&s.daily.day===d;
  B.innerHTML=`<p class="mut" style="margin:0 0 10px">Each round gives you a random program and settings; the answer comes straight from the simulator. Correct answers build a streak multiplier, and quick answers earn bonus points. Wrong answer or timeout = lose a life. <b>Endless</b> never stops: the clock shrinks every round and the programs get harder, so chase the high score (every 5 correct in a row wins back a life).</p>
  <div class="hud" style="margin-bottom:10px"><div>Best score <b>${s.best||0}</b></div><div>Endless best <b>${s.bestE||0}</b> (${s.bestER||0} rounds)</div><div>Daily streak <b>${(s.ds&&s.ds.l>=d-1)?s.ds.n:0}</b></div><div>Today <b>${done?s.daily.score:'not played'}</b></div></div>
  <div class="btns" style="margin-top:0"><button class="pri" id="bzDaily">📅 Daily blitz${done?' (replay)':''}</button><button id="bzRnd">🎲 Random blitz</button><button id="bzEnd">♾️ Endless</button><label style="margin:0;display:flex;gap:6px;align-items:center"><input type="checkbox" id="bzTimer" ${s.noTimer?'':'checked'}> ${TIME}s timer</label></div><div id="bzBoard"></div>`;
  boardUI($('bzBoard'),lbView);
  $('bzDaily').onclick=()=>start('daily');$('bzRnd').onclick=()=>start('random');$('bzEnd').onclick=()=>start('endless');
  $('bzTimer').onchange=e=>{const x=ldS();x.noTimer=!e.target.checked;svS(x)};
}
function start(mode){
  const seedBase=mode==='daily'?dayNum():Math.floor(Math.random()*90000)+10000,rnd=rng(seedBase),endless=mode==='endless';
  G={mode,endless,seedBase,rnd,i:0,lives:3,score:0,streak:0,best:0,ok:0,timer:endless||!ldS().noTimer,q:null,done:false};nextQ();
}
function nextQ(){
  if((!G.endless&&G.i>=TOT)||G.lives<=0)return finish();
  const q=mkRound(G.i,G.seedBase,G.rnd);if(!q){G.i=G.endless?G.i:TOT;return finish()}
  G.secs=G.endless?Math.max(6,Math.round(TIME*Math.pow(0.93,G.i))):TIME;G.ticks=G.secs*4;G.q=q;G.done=false;G.left=G.ticks;G.t50=G.t25=G.t10=0;paint();emit({type:'q',lives:G.lives,endless:G.endless,round:G.i+1,streak:G.streak});
  clearInterval(timer);if(G.timer)timer=setInterval(()=>{
    if(!B.offsetParent||G.done)return;G.left--;const b=$('bzBar');if(b)b.style.width=(G.left/G.ticks*100)+'%';const fr=G.left/G.ticks;if(fr<.5&&!G.t50){G.t50=1;emit({type:'t',frac:fr})}if(fr<.25&&!G.t25){G.t25=1;emit({type:'t',frac:fr})}if(fr<.1&&!G.t10){G.t10=1;emit({type:'t',frac:fr})}
    if(G.left<=0)answer(-1)},250);
}
function paint(){
  const q=G.q;
  B.innerHTML=`<div class="top2"><div class="hud"><div>Round <b>${G.i+1}${G.endless?'':'/'+TOT}</b></div>${G.endless?`<div>Time <b>${G.secs}s</b></div>`:''}<div>Lives <b>${'♥'.repeat(G.lives)+'♡'.repeat(3-G.lives)}</b></div><div>Score <b>${G.score}</b></div><div>Streak <b>${G.streak}</b></div></div><button id="bzQuit">Quit</button></div>
  ${G.timer?'<div class="bar"><i id="bzBar"></i></div>':''}
  <div class="mut" style="font-size:12px">${esc(descOpts(q.opts))}</div>
  <pre>${esc(q.code)}</pre><div class="q">${esc(q.q)}</div>
  <div class="opts">${q.ch.map((c,k)=>`<button data-k="${k}">${esc(c)}</button>`).join('')}</div><div id="bzFb"></div>`;
  B.querySelectorAll('.opts button').forEach(b=>b.onclick=()=>answer(+b.dataset.k));$('bzQuit').onclick=menu;
}
function answer(k){
  if(G.done)return;G.done=true;G.bonusLife=false;clearInterval(timer);const q=G.q,ok=k===q.ans;
  let gain=0;
  if(ok){G.streak++;G.ok++;gain=10+Math.min(G.streak-1,5)*2+(G.timer?Math.ceil(G.left/G.ticks*10):5)+(G.endless?Math.floor(G.i/5)*2:0);G.score+=gain;if(G.endless&&G.streak%5===0&&G.lives<3){G.lives++;gain+=0;G.bonusLife=true}}
  else{G.streak=0;G.lives--}
  emit({type:ok?'correct':(k<0?'timeout':'wrong'),lives:G.lives,streak:G.streak});
  try{if(parent!==window&&parent.MPT)parent.MPT.answer({ok,lab:'MIPS64',game:'Pipeline Blitz',q:q.q,code:q.code,ctx:descOpts(q.opts),choices:q.ch,ans:q.ans,picked:k,why:q.why})}catch(e){}
  B.querySelectorAll('.opts button').forEach((b,i)=>{b.disabled=true;if(i===q.ans)b.classList.add('ok');else if(i===k)b.classList.add('no')});
  const N=q.sm.maxC;
  $('bzFb').innerHTML=`<p class="${ok?'good':'badc'}" style="font-weight:700">${ok?`✓ Correct! +${gain}${G.bonusLife?' · +1 life ♥':''}`:(k<0?'⏰ Time is up.':'✗ Not quite.')}</p><div class="tip">${esc(q.why)}</div>
  <details><summary>Show the pipeline diagram</summary><div class="scroll" style="margin-top:8px">${diagHTML(q.sm,N,N)}</div></details>
  <div class="btns"><button class="pri" id="bzNext">${((!G.endless&&G.i+1>=TOT)||G.lives<=0)?'See results':'Next ▶'}</button></div>`;
  $('bzNext').onclick=()=>{G.i++;nextQ()};
  const hud=B.querySelector('.hud');if(hud)hud.innerHTML=`<div>Round <b>${G.i+1}${G.endless?'':'/'+TOT}</b></div>${G.endless?`<div>Time <b>${G.secs}s</b></div>`:''}<div>Lives <b>${'♥'.repeat(G.lives)+'♡'.repeat(3-G.lives)}</b></div><div>Score <b>${G.score}</b></div><div>Streak <b>${G.streak}</b></div>`;
}
const BN={endless:'ENDLESS',blitz:'BLITZ 10'};let lbView='endless';
const rankOf=(list,sc)=>list.filter(x=>x.s>=sc).length;
function boardHTML(b,hi){
  const list=(ldS().lb||{})[b]||[],lab=b==='endless'?'RND':'HIT';
  let rows='';for(let k=0;k<10;k++){const x=list[k];
    rows+=`<tr class="${k<3?'r'+(k+1):''} ${hi===k?'me':''}"><td>${String(k+1).padStart(2,'0')}.</td><td>${x?esc(x.n):'---'}</td><td>${x?String(x.s).padStart(5,'0'):'-----'}</td><td>${x?x.r:'--'}</td><td>${x?x.d:'--------'}</td></tr>`}
  return `<h3>★ HIGH SCORES · ${BN[b]} ★</h3><table><tr><th>RK</th><th>NAME</th><th>SCORE</th><th>${lab}</th><th>DATE</th></tr>${rows}</table>`;
}
function boardUI(el,b,hi){
  lbView=b;
  el.innerHTML=`<div class="arc"><div class="tabs2"><button data-b="endless" class="${b==='endless'?'sel':''}">♾️ Endless</button><button data-b="blitz" class="${b==='blitz'?'sel':''}">🎮 Blitz 10</button></div>${boardHTML(b,hi)}<div class="hint">Scores are saved in this browser only.</div><div class="btns" style="justify-content:center"><button id="bzClr">Clear scores</button></div></div>`;
  el.querySelectorAll('.tabs2 button').forEach(x=>x.onclick=()=>boardUI(el,x.dataset.b));
  let armed=false;$('bzClr').onclick=function(){if(!armed){armed=true;this.textContent='Sure? Click again';return}
    const t=ldS();t.lb={};svS(t);boardUI(el,b)};
}
function initials(el,b,rank,done){
  const s0=ldS();let L=(s0.ini||'AAA').split(''),cur=0;
  const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const draw=()=>{el.innerHTML=`<div class="arc"><h3>★ NEW HIGH SCORE · RANK #${rank+1} ★</h3><div>ENTER YOUR INITIALS</div><div>${L.map((c,i)=>`<div class="ini ${i===cur?'cur':''}"><button data-i="${i}" data-d="1">▲</button><span data-i="${i}">${c}</span><button data-i="${i}" data-d="-1">▼</button></div>`).join('')}</div><div class="btns" style="justify-content:center"><button class="pri" id="bzOk">OK</button></div><div class="hint">Tap ▲▼ or type letters · Enter to confirm</div></div>`;
    el.querySelectorAll('.ini button').forEach(x=>x.onclick=()=>{const i=+x.dataset.i;cur=i;L[i]=A[(A.indexOf(L[i])+ +x.dataset.d+A.length)%A.length];draw()});
    el.querySelectorAll('.ini span').forEach(x=>x.onclick=()=>{cur=+x.dataset.i;draw()});
    $('bzOk').onclick=ok};
  const key=e=>{const k=e.key;
    if(/^[a-z0-9]$/i.test(k)){L[cur]=k.toUpperCase();cur=Math.min(2,cur+1);draw()}
    else if(k==='Backspace'){cur=Math.max(0,cur-1);draw()}
    else if(k==='ArrowLeft'){cur=Math.max(0,cur-1);draw()}else if(k==='ArrowRight'){cur=Math.min(2,cur+1);draw()}
    else if(k==='ArrowUp'||k==='ArrowDown'){L[cur]=A[(A.indexOf(L[cur])+(k==='ArrowUp'?1:-1)+A.length)%A.length];draw()}
    else if(k==='Enter'){ok()}else return;e.preventDefault()};
  function ok(){document.removeEventListener('keydown',key);done(L.join(''))}
  document.addEventListener('keydown',key);draw();
}
function finish(){
  emit({type:G.lives<=0?'over':'done'});clearInterval(timer);const s=ldS(),d=dayNum(),won=!G.endless&&G.lives>0&&G.i>=TOT;
  if(G.endless){if(G.score>(s.bestE||0))s.bestE=G.score,s.bestER=G.i,G.newBest=true}
  else if(G.score>(s.best||0))s.best=G.score,G.newBest=true;
  if(G.mode==='daily'){
    if(!s.daily||s.daily.day!==d){const p=s.ds||{n:0,l:0};s.ds={n:p.l===d-1?p.n+1:1,l:d}}
    if(!s.daily||s.daily.day!==d||G.score>s.daily.score)s.daily={day:d,score:G.score};
  }
  svS(s);try{if(parent!==window&&parent.MPT)parent.MPT.done({game:'mips',best:!!G.newBest})}catch(e){}
  const rate=G.endless?(G.i>=25?'🏆 Pipeline legend':G.i>=15?'🥇 Clock crusher':G.i>=8?'🥈 Fast hands':'🥉 Warming up'):G.ok>=10?'🏆 Pipeline master':G.ok>=8?'🥇 Hazard hunter':G.ok>=5?'🥈 Getting there':'🥉 Keep practising';
  B.innerHTML=`<div class="big">${won?'Blitz complete!':G.endless?`Game over · ${G.i} round${G.i===1?'':'s'} survived`:'Out of lives'}</div><p>${rate}</p>
  <div class="stats"><div>Score <b>${G.score}</b></div><div>Correct <b>${G.ok}/${G.endless?G.i:Math.min(G.i,TOT)}</b></div><div>Best <b>${G.endless?(s.bestE||0):(s.best||0)}</b></div>${G.mode==='daily'?`<div>Daily streak <b>${s.ds.n}</b></div>`:''}</div>
  ${G.newBest?'<p class="good">New personal best!</p>':''}<div id="bzLb"></div>
  <div class="btns"><button class="pri" id="bzAgain">${G.endless?'♾️ Again':'🎲 Random blitz'}</button><button id="bzMenu">Menu</button></div>`;
  $('bzAgain').onclick=()=>start(G.endless?'endless':(G.mode==='daily'?'random':G.mode));$('bzMenu').onclick=menu;
  const b=G.endless?'endless':'blitz',list=(s.lb&&s.lb[b])||[],box=$('bzLb'),sc=G.score;
  if(sc>0&&(list.length<10||sc>list[list.length-1].s)){
    const rank=rankOf(list,sc);
    initials(box,b,rank,name=>{const t=ldS();t.lb=t.lb||{};const l=t.lb[b]||[];
      l.splice(rankOf(l,sc),0,{n:name,s:sc,r:G.endless?G.i:G.ok,d:new Date().toISOString().slice(2,10)});t.lb[b]=l.slice(0,10);t.ini=name;svS(t);try{if(parent!==window&&parent.MPT)parent.MPT.addScore(G.endless?'mips-endless':'mips-blitz',name,sc,G.endless?G.i:G.ok)}catch(e){}
      boardUI(box,b,rankOf(l,sc)-1<10?l.findIndex(x=>x.n===name&&x.s===sc):-1)});
  }else boardUI(box,b);
}
menu();
})();
