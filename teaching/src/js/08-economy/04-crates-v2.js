/* ===== part 3c: crates v2 ===== */
const ROR=['common','rare','epic','legendary','mythic','secret'];
function lootSting(rar){try{if(!sndOn||!audio())return;const t=AC.currentTime;
 const tone=(f,a,d,w,v)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=w||'triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t+a);g.gain.linearRampToValueAtTime(v||.08,t+a+.02);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);o.connect(g);g.connect(master);o.start(t+a);o.stop(t+a+d+.05)};
 if(rar==='common'){tone(523,0,.18);tone(659,.08,.22)}
 else if(rar==='rare'){[659,784,988,1319].forEach((f,i)=>tone(f,i*.07,.35,'triangle',.08))}
 else if(rar==='epic'){[523,659,784,1047].forEach((f,i)=>{tone(f,i*.09,.7,'sawtooth',.05);tone(f*2,i*.09,.5,'triangle',.05)});tone(130,0,.9,'sine',.12)}
 else{[392,523,659,784,1047,1319,1568].forEach((f,i)=>{tone(f,i*.08,1.4,'sawtooth',.05);tone(f*1.005,i*.08,1.4,'triangle',.05)});tone(98,0,1.5,'sine',.2);for(let i=0;i<8;i++)tone(2093+i*180,.7+i*.06,.4,'sine',.04)}}catch(e){}}
function chargeSnd(sec){try{if(!sndOn||!audio())return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(700,t+sec);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.06,t+sec*.9);g.gain.exponentialRampToValueAtTime(.0001,t+sec+.05);o.connect(g);g.connect(master);o.start(t);o.stop(t+sec+.1)}catch(e){}}
function tickSnd(p){try{if(!sndOn||!audio())return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.value=700+(p||0)*500;g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+.04);o.connect(g);g.connect(master);o.start(t);o.stop(t+.05)}catch(e){}}
const lootOv=()=>{let ov=$('lootov');if(!ov){ov=document.createElement('div');ov.id='lootov';document.body.appendChild(ov)}return ov};
let LT=[],LTOK=0,lootRAF=0;const lt=(f,ms,tok)=>LT.push(setTimeout(()=>{if(tok===LTOK&&$('lootov')&&$('lootov').className==='on')f()},ms));
function lootReset(){LT.forEach(clearTimeout);LT=[];cancelAnimationFrame(lootRAF);LTOK++;return LTOK}
function colStat(c){const all=CATALOG.filter(x=>x.c===c&&(x.pack!=='sw'||M.sw)&&!hiddenItem(x)),own=all.filter(x=>M.inv.own[x.id]).length;return{own,tot:all.length}}
function lootBurst(col,rar){const cv=$('lootfx');if(!cv||RM)return;const x=cv.getContext('2d');cv.width=innerWidth;cv.height=innerHeight;const n={common:16,rare:50,epic:110,legendary:210,mythic:300,secret:240}[rar]||30,P=[],cx=innerWidth/2,cy=innerHeight*.44,pal=[col,'#fff','#ffd54a',col];
 for(let i=0;i<n;i++){const a=Math.random()*6.283,s=2+Math.random()*(rar==='common'?4:11);P.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,r:2+Math.random()*4,life:60+Math.random()*60,c:pal[i%pal.length],sq:Math.random()<.5})}
 if(rar==='legendary'||rar==='mythic'||rar==='secret')for(let i=0;i<90;i++)P.push({x:Math.random()*innerWidth,y:-20-Math.random()*300,vx:(Math.random()-.5)*1.2,vy:2+Math.random()*3,r:3+Math.random()*4,life:140+Math.random()*60,c:'#ffd54a',sq:true});
 let f=0;const loop=()=>{if(!$('lootfx')||f>210){x.clearRect(0,0,cv.width,cv.height);return}f++;x.clearRect(0,0,cv.width,cv.height);P.forEach(p=>{if(p.life<=0)return;p.life--;p.x+=p.vx;p.y+=p.vy;p.vy+=.16;p.vx*=.992;x.globalAlpha=Math.min(1,p.life/40);x.fillStyle=p.c;if(p.sq)x.fillRect(p.x,p.y,p.r,p.r);else{x.beginPath();x.arc(p.x,p.y,p.r/1.5,0,6.3);x.fill()}});x.globalAlpha=1;lootRAF=requestAnimationFrame(loop)};loop()}
function lootButtons(type,it,dup){const b=BOX[type],free=M.inv.box[type]||0,more=free>0,can=more||(M.coins>=b.p&&boxVisible(type)),c5=free>=5||(free+Math.floor(M.coins/b.p)>=5&&boxVisible(type));
 return `<div class="btns" style="justify-content:center;display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${it&&!dup?`<button class="pri" data-act="lootequip" data-id="${esc(it.id)}">Equip now</button>`:''}${it&&it.c==='theme'&&dup?`<button data-act="loottry" data-id="${esc(it.id)}">👁 Try it</button>`:''}${can?`<button data-act="lootagain" data-t="${type}">${more?'Open another (free)':`Open another · 🪙 ${b.p}`}</button>`:''}${c5?`<button data-act="lootmany" data-t="${type}" data-n="5">Open ×5</button>`:''}<button data-act="lootclose">Close</button></div>`}
function chargeHTML(b,sec){const sk=CRATESK[M.set.crateskin],col=sk?sk.c:'#ffd54a';const ov=$('lootov');if(ov)ov.style.setProperty('--cc',col);return `<div class="lcharge"><div class="lrays" style="--ray:${col}2a"></div><div class="lcr" style="--cs:${sec}s">${sk?sk.i:b.i}</div><div class="ltxt">${esc(b.n)}…</div><div class="lbar"><i style="--cs:${sec}s"></i></div></div>`}
function showLoot(type,it,dup,refund){const ov=lootOv(),b=BOX[type],r=RAR[it.r],tok=lootReset();ov.className='on';ov.dataset.t=type;ov.classList.remove('lshk');
 ov._hy=0;ov._hskip=null;let shown=false;const reveal=()=>{if(shown||ov.className!=='on')return;if(!ov._hy&&it.c==='theme'&&window.lootHype&&lootHype(it,ov,()=>{ov._hy=1;ov._hskip=null;reveal()}))return;shown=true;lootReset();const cs=colStat(it.c),pity=`Epic pity ${M.loot.se}/9 · Legendary pity ${M.loot.sl}/39`;
  ov.innerHTML=`<div class="lflash" style="--rc:${r.c}"></div><canvas id="lootfx"></canvas><div class="lring" style="--rc:${r.c}"></div>
  <div class="lcard2 ${it.r}" style="--rc:${r.c}">${dup?'':'<div class="lnew">NEW!</div>'}<div class="lr">${r.n}${dup?' · duplicate':''}</div>${previewHTML(it)}<b>${esc(it.n)}</b><div class="mut">${CATN[it.c]||''}</div>
  ${dup?`<div class="lrefund">+<span id="lcoin">0</span> 🪙 <span class="mut" style="font-size:12px;font-weight:400">duplicate converted</span></div>`:`<div class="lcol"><i style="width:${cs.own/cs.tot*100}%"></i></div><div class="mut" style="font-size:12px">${CATN[it.c]} collected: ${cs.own}/${cs.tot}</div>`}
  <div class="lpity">${pity}</div>${typeof setLine==='function'?setLine(it):''}</div>${lootButtons(type,it,dup)}`;
  lootBurst(r.c,it.r);lootSting(it.r);if(!RM&&(it.r==='epic'||it.r==='legendary'||it.r==='mythic'||it.r==='secret')){ov.classList.add('lshk');setTimeout(()=>ov.classList.remove('lshk'),600)}
  if(dup&&refund){const el=$('lcoin');let v=0;const st=Math.max(1,Math.ceil(refund/24));const iv=setInterval(()=>{v=Math.min(refund,v+st);if(!$('lcoin')){clearInterval(iv);return}$('lcoin').textContent=v;if(v>=refund)clearInterval(iv)},40)}
  motif('big');if(it.c==='theme'&&window.lootThemeStage)lootThemeStage(it,ov)};
 if(RM){reveal();return}
 /* stage 1: the crate charges up */
 const CS=1.3;ov.innerHTML=chargeHTML(b,CS);chargeSnd(CS);
 /* stage 2: the reel. The strip is filled from the real drop odds and the winner was decided before it spins. */
 const reelStage=()=>{if(tok!==LTOK||ov.className!=='on')return;lootReset();const T=LTOK;
  const N=60,W=50,CW=136,cards=[];for(let i=0;i<N;i++)cards.push(i===W?it:reelFiller(type));
  ov.innerHTML=`<div class="reelbox"><div class="reelwrap" id="reelwrap"><div class="reelmark"></div><div class="reel" id="reel">${cards.map(reelCard).join('')}</div></div><div class="ltxt">${esc(b.n)}…</div></div>`;
  const reel=$('reel'),wrap=$('reelwrap'),wrapW=wrap.clientWidth,off=(Math.random()-.5)*.84*CW,target=-(W*CW+CW/2-wrapW/2+off);let done=false,last=-1,hot=null;
  const finish=()=>{if(done||T!==LTOK)return;done=true;reveal()};ov._finish=null;ov._skip=null;
  const DUR=5.2;reel.style.transition=`transform ${DUR}s cubic-bezier(.06,.72,.1,1)`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{reel.style.transform=`translateX(${target}px)`;const t0=performance.now();
   const loop=()=>{if(done||T!==LTOK||!$('reel'))return;const m=new DOMMatrix(getComputedStyle(reel).transform),idx=Math.floor((-m.m41+wrapW/2)/CW);
    if(idx!==last){last=idx;tickSnd(Math.min(1,(performance.now()-t0)/(DUR*1000)));if(hot)hot.classList.remove('hot');hot=reel.children[idx]||null;if(hot){hot.classList.add('hot');const c=cards[idx];wrap.style.setProperty('--glow',(RAR[c&&c.r]||RAR.common).c)}}
    lootRAF=requestAnimationFrame(loop)};loop()}));
  reel.addEventListener('transitionend',ev=>{if(ev.target===reel&&ev.propertyName==='transform')setTimeout(finish,600)});lt(finish,DUR*1000+1200,T)};
 ov._skip=null;ov._finish=null;lt(reelStage,CS*1000+80,tok)}
function showLootMany(type,res){const ov=lootOv(),b=BOX[type],tok=lootReset();ov.className='on';ov.dataset.t=type;ov.classList.remove('lshk');
 const best=res.reduce((a,x)=>ROR.indexOf(x.it.r)>ROR.indexOf(a.it.r)?x:a,res[0]),coins=res.reduce((a,x)=>a+x.refund,0),news=res.filter(x=>!x.dup).length;
 const show=()=>{if(tok!==LTOK||ov.className!=='on')return;lootReset();const T=LTOK;
  ov.innerHTML=`<canvas id="lootfx"></canvas><div class="ltxt" style="font-size:18px;font-weight:700">${esc(b.n)} ×${res.length}</div><div class="lgrid" id="lgrid">${res.map((x,i)=>`<div class="lmini ${x===best?'best':''}" style="--rc:${RAR[x.it.r].c};animation-delay:${RM?0:i*.22}s">${x.dup?'':'<span class="nw">NEW</span>'}${reelCard(x.it)}</div>`).join('')}</div>
  <div class="ltxt"><b>${news}</b> new · <b>${res.length-news}</b> duplicates${coins?` · +${coins} 🪙 refunded`:''}<br>Best pull: <b style="color:${RAR[best.it.r].c}">${RAR[best.it.r].n}</b> · ${esc(best.it.n)}</div>
  ${lootButtons(type,null,true).replace('data-act="lootmany" data-t="'+type+'" data-n="5">Open ×5','data-act="lootmany" data-t="'+type+'" data-n="5">Open ×5 more')}`;
  if(!RM){res.forEach((x,i)=>lt(()=>tickSnd(i/res.length),i*220,T));lt(()=>{lootBurst(RAR[best.it.r].c,best.it.r);lootSting(best.it.r);if(ROR.indexOf(best.it.r)>=2){ov.classList.add('lshk');setTimeout(()=>ov.classList.remove('lshk'),600)}},res.length*220+200,T)}else lootSting(best.it.r)};
 if(RM){show();return}
 ov.innerHTML=chargeHTML(b,1);chargeSnd(1);ov._skip=null;ov._finish=null;lt(show,1050,tok)}
function rollOnce(type,free){const b=BOX[type];if(!b||!boxVisible(type))return null;if(b.unowned&&!boxPool(type).length){toast('🎉 You already own everything this crate can give!');return null}
 if(free){if((M.inv.box[type]||0)<=0)return null;M.inv.box[type]--}else{if(M.coins<b.p){toast('Not enough coins yet. Keep studying! 🪙');return null}M.coins-=b.p}
 const rar=rollRarity(type),it=pickItem(type,rar),dup=!!M.inv.own[it.id];let refund=0;
 if(dup){refund=REFUND[it.r]||0;M.coins+=refund}else M.inv.own[it.id]=1;
 M.loot.opened++;return{it,dup,refund}}
function openBox(type,free){const r=rollOnce(type,free);if(!r)return;mSave();paintChip();checkQuests();try{checkSets();checkAch()}catch(e){}showLoot(type,r.it,r.dup,r.refund)}
function openMany(type,n){const b=BOX[type];if(!b||!boxVisible(type))return;const res=[];for(let i=0;i<n;i++){const free=(M.inv.box[type]||0)>0;if(!free&&M.coins<b.p)break;const r=rollOnce(type,free);if(!r)break;res.push(r)}
 if(!res.length){toast('Not enough crates or coins.');return}mSave();paintChip();checkQuests();showLootMany(type,res)}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#lootov [data-act]');if(!b)return;const a=b.dataset.act,ov=$('lootov');
 if(a==='lootskip'){ov._skip&&ov._skip()}
 else if(a==='lootmany'){openMany(b.dataset.t,+b.dataset.n||5)}
 else if(a==='loottry'){const id=b.dataset.id;lootReset();ov.className='';ov.innerHTML='';renderPane(cur);previewTheme(id)}
 if(a==='lootclose'||a==='lootequip')lootReset()},true);
document.addEventListener('keydown',e=>{const ov=$('lootov');if(!ov||ov.className!=='on')return;if(e.key==='Escape'&&ov.querySelector('.lcard2,.lgrid'))lootReset()});

