/* ======= STUDY THEMES ======= */
/* ======= STUDY THEMES WITH THEIR OWN MECHANICS: Forest, Lo-fi Radio, Weather Window, Zen Garden, Flashcards, Exam Boss ======= */
(function(){
 const act=id=>{try{return mode===id&&themeOK(id)}catch(e){return false}};
 const own=id=>!!(M.inv.own[id]||M.admin);
 const D=()=>dayN(),tdy=()=>M.ld[D()]||0;
 const rm=()=>document.documentElement.hasAttribute('data-rmx');
 const sv=()=>{mDirty=true;try{mSave()}catch(e){}};
 const SND=(f,t,v,g)=>{try{jxSnd(f,t,v,g)}catch(e){}};
 const PAN={};window.sfSP=[];let open={},lastSig='',down=false;
 window.sfHud=id=>PAN[id]?PAN[id].hud():'';
 function dockEl(){let d=document.getElementById('sfdock');if(!d){d=document.createElement('div');d.id='sfdock';d.setAttribute('role','region');document.body.appendChild(d)}return d}
 function activeId(){return Object.keys(PAN).find(act)||null}
 function draw(force){const id=activeId(),d0=document.getElementById('sfdock');if(!id){if(d0)d0.remove();lastSig='';return}
  const P=PAN[id];if(open[id]==null)open[id]=innerWidth>700;let h;
  if(!open[id])h=`<button class="sfmini" data-sf="toggle" aria-label="Open panel">${P.mini()}</button>`;
  else h=`<div class="sfhd"><b>${P.ico} ${P.title}</b><button data-sf="toggle" aria-label="Minimise panel">–</button></div>${P.body()}`;
  const sig=id+open[id]+h;if(sig===lastSig&&d0&&!force)return;lastSig=sig;const d=dockEl();d.className=open[id]?'':'min';d.innerHTML=h}
 function sfAct(t){const id=activeId(),a=t.dataset.sf;if(a==='toggle'){open[id]=!open[id];draw(true);return}if(id&&PAN[id].act){PAN[id].act(a,t);sv();draw(true)}}
 document.addEventListener('pointerdown',e=>{const t=e.target.closest('#sfdock [data-sf]');if(t&&!t.disabled){down=true;sfAct(t);e.preventDefault()}},true);
 document.addEventListener('click',e=>{const t=e.target.closest('#sfdock [data-sf]');if(!t||t.disabled)return;if(down){down=false;return}if(e.detail===0)sfAct(t)},true);
 setInterval(()=>{try{draw();tickAll()}catch(e){}},1000);
 /* generic modal */
 function modal(html,cls){let o=document.getElementById('sfmod');if(!o){o=document.createElement('div');o.id='sfmod';o.className='fcov';document.body.appendChild(o)}o.innerHTML=`<div class="wgm sfm ${cls||''}" role="dialog" aria-modal="true">${html}<div class="wgb"><button data-sm="close">Close</button></div></div>`;return o}
 const closeM=()=>{const o=document.getElementById('sfmod');if(o){o.remove();try{window.__sfcl&&window.__sfcl()}catch(e){}window.__sfcl=null}};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('sfmod'))closeM()});
 const SM={};
 document.addEventListener('click',e=>{const t=e.target.closest('[data-sm]');if(!t||!t.closest('#sfmod'))return;const a=t.dataset.sm;if(a==='close'){closeM();return}if(SM[a]){SM[a](t,e);}},true);
 const tick=[];function tickAll(){tick.forEach(f=>{try{f()}catch(e){}})}
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

 /* ---------- 1. POMODORO FOREST ---------- */
 addC('title','sf_pf_t','Forest Warden','epic',{title:'Forest Warden',pack:'sfp',noDrop:true});
 const PF=()=>{const p=M.pf=M.pf||{};p.t=p.t||[];p.dead=p.dead||0;p.min=p.min||0;p.n=p.n||0;return p};
 const SR=['🌸','🍁','🎋','🌵'],SALL=['🌱','🌿','🌳','🌲','🌴',...SR];
 const spec=m=>Math.random()<.08?SR[Math.floor(Math.random()*SR.length)]:m<15?'🌱':m<25?'🌿':m<45?'🌳':m<90?'🌲':'🌴';
 const od=window.cpDone,of=window.cpFail;
 window.cpDone=function(a){try{if(own('sf_pomodoro')){const p=PF(),s=spec(a.min);p.t.push({s,m:a.min,d:D()});if(p.t.length>400)p.t.shift();p.n++;p.min+=a.min;let m='';if(p.n%10===0){M.coins+=50;m=' · +50 🪙 (10 trees!)'}if(p.n>=25&&!M.inv.own.sf_pf_t){M.inv.own.sf_pf_t=1;try{buildOpts()}catch(e){}m+=' · Title: Forest Warden'}sv();try{paintChip();toast(s+' A tree grew in your forest'+m)}catch(e){}}}catch(e){}return od&&od.apply(this,arguments)};
 window.cpFail=function(a){try{if(own('sf_pomodoro')){const p=PF();p.dead++;p.t.push({s:'🥀',m:0,d:D()});sv();try{toast('🥀 Your tree withered. Leaving the session kills it.')}catch(e){}}}catch(e){}return of&&of.apply(this,arguments)};
 tick.push(()=>{const a=M.fc&&M.fc.act,lk=document.querySelector('#fclock .fcin');if(!a||!lk||!act('sf_pomodoro'))return;let el=document.getElementById('pftree');if(!el){el=document.createElement('div');el.id='pftree';lk.appendChild(el)}const pr=Math.max(0,Math.min(1,(Date.now()-a.start)/(a.end-a.start))),e=pr<.2?'🌱':pr<.5?'🌿':pr<.85?'🌳':'🌲';const sig=e+Math.round(pr*20);if(el.dataset.s!==sig){el.dataset.s=sig;el.innerHTML=`<div class="pftree"><span style="font-size:${34+pr*50}px" aria-hidden="true">${e}</span><small>Your tree is growing: ${Math.round(pr*100)}%. Leaving the session will wither it.</small></div>`}});
 PAN.sf_pomodoro={ico:'🌳',title:'Pomodoro Forest',
  hud:()=>{const p=PF();return `🌳 FOREST · <b>${p.t.filter(t=>t.s!=='🥀').length}</b> trees · 🥀 ${p.dead}`},
  mini:()=>{const p=PF();return `🌳 ${p.t.filter(t=>t.s!=='🥀').length} trees · 🥀 ${p.dead}`},
  body:()=>{const p=PF(),f=new Set(p.t.map(t=>t.s).filter(s=>s!=='🥀')),last=p.t.slice(-60);return `<p class="sfp">Each finished Focus session plants a tree. Longer sessions grow bigger trees. Quit early and it withers.</p><div class="pfgrid" aria-label="Your forest">${last.length?last.map(t=>`<span title="${t.m} min">${t.s}</span>`).join(''):'<small>Your forest is empty. Start a Focus session.</small>'}</div><p class="sfp">Trees <b>${p.n}</b> · Forest time <b>${p.min}</b> min · Species <b>${[...f].length}/${SALL.length}</b></p><div class="sfrow">${SALL.map(s=>`<span class="${f.has(s)?'':'dim'}">${s}</span>`).join('')}</div><button data-sf="focus">🎯 Plant a tree (Focus 25)</button>`},
  act:a=>{if(a==='focus'){try{fcSetup(25)}catch(e){}}}};

 /* ---------- 2. LO-FI RADIO ---------- */
 const STN=[{id:'rain',n:'Rainy Day',ico:'🌧️',h:0,bpm:72,rain:1,drums:1,ch:[[57,60,64,67],[50,53,57,60],[55,59,62,65],[48,52,55,59]]},
  {id:'night',n:'Night Drive',ico:'🌃',h:1,bpm:80,drums:1,ch:[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]]},
  {id:'jazz',n:'Jazz Café',ico:'☕',h:3,bpm:92,sw:.07,drums:1,ch:[[50,53,57,60],[43,47,50,53],[48,52,55,59],[48,52,55,59]]},
  {id:'deep',n:'Deep Focus',ico:'🧠',h:6,bpm:56,pad:1,rain:1,ch:[[45,52,57,64],[43,50,55,62],[41,48,53,60],[43,50,55,62]]},
  {id:'sun',n:'Sunrise',ico:'🌅',h:10,bpm:86,drums:1,ch:[[48,55,60,64],[53,57,60,65],[55,59,62,67],[57,60,64,67]]}];
 const LF={on:false,st:'rain',vol:.55,n:0,nt:0,tm:null,g:null,rn:null,buf:null};
 const hrsS=()=>totalSec()/3600,stOk=s=>M.admin||hrsS()>=s.h;
 const mf=m=>440*Math.pow(2,(m-69)/12);
 function lfNode(){const A=AC;if(!LF.buf){LF.buf=A.createBuffer(1,A.sampleRate,A.sampleRate);const d=LF.buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}if(!LF.g){LF.g=A.createGain();LF.g.gain.value=0;LF.g.connect(master||A.destination)}}
 function osc(type,f,t,dur,v,lp){window.__nospk=1;const o=AC.createOscillator();window.__nospk=0;o.type=type;o.frequency.setValueAtTime(f,t);const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);let n=o;if(lp){const F=AC.createBiquadFilter();F.type='lowpass';F.frequency.value=lp;o.connect(F);n=F}n.connect(g);g.connect(LF.g);o.start(t);o.stop(t+dur+.05);return o}
 function noise(t,dur,v,ft,fq){const s=AC.createBufferSource();s.buffer=LF.buf;const F=AC.createBiquadFilter();F.type=ft;F.frequency.value=fq;const g=AC.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(F);F.connect(g);g.connect(LF.g);s.start(t,Math.random()*.5);s.stop(t+dur+.02)}
 function sched(step,t){const S=STN.find(x=>x.id===LF.st)||STN[0],bar=Math.floor(LF.n/16)%S.ch.length,ch=S.ch[bar],root=ch[0];
  if(step%2===1&&S.sw)t+=S.sw*60/S.bpm/2;
  if(step===0){ch.forEach((m,i)=>osc(S.pad?'sine':'triangle',mf(m)*(S.pad?1:1),t+i*.012,S.pad?4.5:2.2,S.pad?.035:.05,S.pad?700:1100));osc('sine',mf(root-12),t,1.6,.14)}
  if(S.drums){if(step===0||step===10){const o=osc('sine',130,t,.18,.28);try{o.frequency.exponentialRampToValueAtTime(42,t+.14)}catch(e){}}
   if(step===4||step===12)noise(t,.14,.09,'highpass',1400);if(step%2===0)noise(t,.03,.022,'highpass',7000);if(step===8)osc('sine',mf(root-12+7),t,.5,.07)}
  if(step%2===0&&Math.random()<(S.pad?.12:.3)){const sc=[0,3,5,7,10][Math.floor(Math.random()*5)];osc('sine',mf(root+12+sc),t,S.pad?1.8:.6,.03)}
  if(Math.random()<.04)noise(t,.008,.05,'highpass',2500)}
 function lfLoop(){const S=STN.find(x=>x.id===LF.st)||STN[0],sd=60/S.bpm/4;while(LF.nt<AC.currentTime+.18){sched(LF.n%16,LF.nt);LF.nt+=sd;LF.n++}}
 function rainOn(S){rainOff();if(!S.rain)return;const s=AC.createBufferSource();s.buffer=LF.buf;s.loop=true;const F=AC.createBiquadFilter();F.type='bandpass';F.frequency.value=1700;F.Q.value=.4;const g=AC.createGain();g.gain.value=.11;s.connect(F);F.connect(g);g.connect(LF.g);s.start();LF.rn=s}
 function rainOff(){try{LF.rn&&LF.rn.stop()}catch(e){}LF.rn=null}
 function lfPlay(){try{audio();lfNode();LF.on=true;LF.n=0;LF.nt=AC.currentTime+.1;LF.g.gain.cancelScheduledValues(AC.currentTime);LF.g.gain.setTargetAtTime(LF.vol,AC.currentTime,.3);const S=STN.find(x=>x.id===LF.st)||STN[0];rainOn(S);clearInterval(LF.tm);LF.tm=setInterval(lfLoop,40);M.lf=M.lf||{min:0}}catch(e){LF.on=false}}
 function lfStop(){LF.on=false;clearInterval(LF.tm);try{LF.g&&LF.g.gain.setTargetAtTime(0,AC.currentTime,.15)}catch(e){}setTimeout(()=>{if(!LF.on)rainOff()},600)}
 let lfSec=0;tick.push(()=>{if(LF.on){if(!act('sf_lofi')){lfStop();return}lfSec++;if(lfSec>=60){lfSec=0;M.lf=M.lf||{min:0};M.lf.min=(M.lf.min||0)+1;sv()}}
  const a=M.fc&&M.fc.act,lk=document.querySelector('#fclock .fcin');if(a&&lk&&act('sf_lofi')){let el=document.getElementById('lfmini');if(!el){el=document.createElement('div');el.id='lfmini';lk.appendChild(el)}const S=STN.find(x=>x.id===LF.st)||STN[0],sig=LF.on+S.id;if(el.dataset.s!==sig){el.dataset.s=sig;el.innerHTML=`<div class="cpbox">🎧 ${S.ico} ${S.n}<button data-lf="tog">${LF.on?'⏸ Pause music':'▶ Play music'}</button></div>`}}});
 document.addEventListener('click',e=>{const t=e.target.closest('[data-lf]');if(t&&t.dataset.lf==='tog'){LF.on?lfStop():lfPlay();const el=document.getElementById('lfmini');if(el)el.dataset.s=''}},true);
 document.addEventListener('input',e=>{if(e.target.id==='lfvol'){LF.vol=+e.target.value/100;try{LF.g&&LF.on&&LF.g.gain.setTargetAtTime(LF.vol,AC.currentTime,.1)}catch(er){}}});
 PAN.sf_lofi={ico:'🎧',title:'Lo-fi Radio',
  hud:()=>{const S=STN.find(x=>x.id===LF.st)||STN[0];return `🎧 LO-FI RADIO · ${LF.on?'<b>ON AIR</b> · '+S.ico+' '+S.n:'tap play in the panel'} · ${Math.round(hrsS()*10)/10} h studied`},
  mini:()=>{const S=STN.find(x=>x.id===LF.st)||STN[0];return `🎧 ${LF.on?'▶ '+S.n:'Lo-fi Radio'}`},
  body:()=>`<p class="sfp">Music that is made live while you study. Stations unlock with study hours.</p><button class="sfbig" data-sf="lfplay">${LF.on?'⏸ Pause':'▶ Play'}</button><div class="sfl">${STN.map(s=>`<button data-sf="lfst" data-id="${s.id}" ${stOk(s)?'':'disabled'} class="${LF.st===s.id?'on':''}">${s.ico} ${s.n}${stOk(s)?'':` 🔒 ${s.h} h`}</button>`).join('')}</div><label class="sfp">Volume <input id="lfvol" type="range" min="0" max="100" value="${Math.round(LF.vol*100)}" aria-label="Volume"></label><p class="sfp">Listened <b>${(M.lf&&M.lf.min)||0}</b> min · Studied <b>${Math.round(hrsS()*10)/10}</b> h</p>`,
  act:(a,t)=>{if(a==='lfplay')LF.on?lfStop():lfPlay();else if(a==='lfst'){const s=STN.find(x=>x.id===t.dataset.id);if(s&&stOk(s)){LF.st=s.id;if(LF.on)lfPlay()}}}};

 /* ---------- 3. WEATHER WINDOW ---------- */
 const WX=()=>{const w=M.wx=M.wx||{};w.sun=w.sun||0;w.last=w.last||0;return w};
 let wc=null,wctx=null,drops=[],inten=1,flash=0,nextFl=0,wtm=null;
 const g01=()=>Math.min(1,tdy()/GOAL);
 const wxIcon=g=>g>=1?'☀️':g>.6?'🌤️':g>.3?'🌦️':g>.1?'🌧️':'⛈️';
 function wxOn(){if(wc)return;wc=document.createElement('canvas');wc.id='wxc';wc.setAttribute('aria-hidden','true');document.body.appendChild(wc);wctx=wc.getContext('2d');wtm=setInterval(wxFrame,50)}
 function wxOff(){if(!wc)return;clearInterval(wtm);wc.remove();wc=wctx=null;drops=[]}
 function wxFrame(){if(!wc||document.hidden)return;const W=innerWidth,H=innerHeight;if(wc.width!==W||wc.height!==H){wc.width=W;wc.height=H}const g=g01(),still=rm();inten+=((1-g)-inten)*.03;const c=wctx;c.clearRect(0,0,W,H);
  c.fillStyle=`rgba(8,18,30,${.3*inten})`;c.fillRect(0,0,W,H);
  if(g>.45){const a=Math.min(.55,(g-.45)*.9),r=c.createRadialGradient(W*.88,H*.04,10,W*.88,H*.04,Math.max(W,H)*.45);r.addColorStop(0,`rgba(255,226,140,${a})`);r.addColorStop(1,'rgba(255,226,140,0)');c.fillStyle=r;c.fillRect(0,0,W,H)}
  if(g>=1){const cols=['#ff5d5d','#ffa24d','#ffe14d','#6fd66f','#4da6ff','#8a6bff'];c.lineWidth=Math.max(5,W/150);cols.forEach((k,i)=>{c.strokeStyle=k;c.globalAlpha=.22;c.beginPath();c.arc(W*.3,H*1.1,H*.85-i*c.lineWidth,Math.PI*1.05,Math.PI*1.95);c.stroke()});c.globalAlpha=1}
  const N=still?0:Math.round(170*Math.pow(inten,1.3));while(drops.length<N)drops.push({x:Math.random()*W,y:Math.random()*H,l:10+Math.random()*14,v:14+Math.random()*12});drops.length=Math.min(drops.length,N);
  c.strokeStyle=`rgba(170,215,245,${.25+.35*inten})`;c.lineWidth=1.2;c.beginPath();drops.forEach(d=>{d.y+=d.v*(.6+inten*.6);d.x-=d.v*.12;if(d.y>H){d.y=-20;d.x=Math.random()*W*1.1}c.moveTo(d.x,d.y);c.lineTo(d.x-d.l*.12,d.y+d.l)});c.stroke();
  const now=Date.now();if(!still&&inten>.7&&new Date().getHours()>=17){if(!nextFl)nextFl=now+6000+Math.random()*9000;if(now>nextFl){flash=1;nextFl=now+7000+Math.random()*12000;try{jxSnd([70,55],'sawtooth',.05,.25)}catch(e){}}}
  if(flash>0){c.fillStyle=`rgba(255,255,255,${flash*.32})`;c.fillRect(0,0,W,H);flash-=.07}}
 tick.push(()=>{if(act('sf_rain')){wxOn();const w=WX(),g=g01();if(g>=1&&w.last!==D()){w.last=D();w.sun++;M.coins+=25;sv();try{paintChip();jxSplash('CLEAR SKIES','Goal reached +25 coins','#ffd166','☀️');confetti(false)}catch(e){}}}else wxOff()});
 const plant=n=>n<3?['🌱','Seedling']:n<7?['🌿','Sprout']:n<14?['🪴','Potted plant']:n<30?['🌻','Sunflower']:['🌳','Window tree'];
 PAN.sf_rain={ico:'🌧️',title:'Weather Window',
  hud:()=>{const g=g01();return `${wxIcon(g)} WEATHER · <b>${Math.round(g*100)}%</b> of today's goal · ☀️ ${WX().sun} clear days`},
  mini:()=>`${wxIcon(g01())} ${Math.round(g01()*100)}% · ☀️${WX().sun}`,
  body:()=>{const g=g01(),need=Math.max(0,GOAL-tdy()),p=plant(streakNow()),txt=g>=1?'Clear skies! Goal reached. Enjoy the rainbow.':g>.6?'Clouds are breaking up.':g>.3?'Drizzle. Keep going.':g>.1?'Steady rain.':'Thunderstorm warning. Study to calm the sky.';
   return `<p class="sfbig2" aria-hidden="true">${wxIcon(g)}</p><p class="sfp"><b>${txt}</b></p><div class="sfbar"><i style="width:${Math.round(g*100)}%"></i></div><p class="sfp">${need?`Study <b>${need}</b> more SP to clear the sky.`:'Goal done today ✅'}</p><p class="sfp">Windowsill: ${p[0]} ${p[1]} <small>(grows with your streak: ${streakNow()} days)</small></p><p class="sfp">Clear days: <b>${WX().sun}</b></p>`}};

 /* ---------- 4. ZEN GARDEN ---------- */
 addC('title','sf_zen_t','Garden Keeper','epic',{title:'Garden Keeper',pack:'sfz',noDrop:true});
 const ZN=()=>{const z=M.zen=M.zen||{};z.pts=z.pts||0;z.placed=z.placed||0;return z};
 const _asp2=addSP;addSP=function(n,why,kind){const b0=M.sp,r=_asp2(n,why,kind);try{const d=M.sp-b0;if(d>0&&own('sf_zen')){const z=ZN();z.pts=Math.min(300,z.pts+d)}if(d>0){exSP(d);window.sfSP.forEach(f=>{try{f(d)}catch(e){}})}}catch(e){}return r};
 const ZT=[['rake','🪮','Rake',0],['stone','🪨','Stone',5],['moss','🌿','Moss',3],['flower','🪷','Lotus',6],['lantern','🏮','Lantern',8],['bonsai','🌳','Bonsai',12],['smooth','🧹','Smooth sand',0],['undo','↩️','Undo',0]];
 let ztool='rake',zprev=null,zcv=null,zc=null,zdraw=false,zlast=null;
 const ZK='mp-zen';
 function zInit(){zc=zcv.getContext('2d');zcv.width=720;zcv.height=400;sand();let img=null;try{img=localStorage.getItem(ZK)}catch(e){}if(img){const i=new Image();i.onload=()=>zc.drawImage(i,0,0,720,400);i.src=img}}
 function sand(){const g=zc.createLinearGradient(0,0,0,400);g.addColorStop(0,'#eadfc0');g.addColorStop(1,'#dccda4');zc.fillStyle=g;zc.fillRect(0,0,720,400);zc.strokeStyle='rgba(150,130,90,.35)';zc.lineWidth=2;for(let y=14;y<400;y+=14){zc.beginPath();zc.moveTo(0,y);zc.lineTo(720,y);zc.stroke()}}
 function zsave(){try{localStorage.setItem(ZK,zcv.toDataURL('image/jpeg',.8))}catch(e){}}
 function zpos(e){const r=zcv.getBoundingClientRect();return[(e.clientX-r.left)*720/r.width,(e.clientY-r.top)*400/r.height]}
 function stampIt(tool,x,y){const z=ZN(),T=ZT.find(t=>t[0]===tool);if(z.pts<T[3]){try{toast('🪷 Not enough Zen points. Study to earn more (1 per SP).')}catch(e){}return false}
  zprev=zc.getImageData(0,0,720,400);z.pts-=T[3];z.placed++;
  if(tool==='stone'){zc.strokeStyle='rgba(120,100,65,.7)';zc.lineWidth=2;[34,44,54].forEach(r=>{zc.beginPath();zc.arc(x,y,r,0,7);zc.stroke()})}
  zc.save();zc.shadowColor='rgba(0,0,0,.35)';zc.shadowBlur=8;zc.shadowOffsetY=4;zc.font=(tool==='bonsai'?52:tool==='stone'?44:38)+'px serif';zc.textAlign='center';zc.textBaseline='middle';zc.fillText(T[1],x,y);zc.restore();
  if(z.placed>=25&&!M.inv.own.sf_zen_t){M.inv.own.sf_zen_t=1;try{buildOpts();toast('🪷 Title unlocked: Garden Keeper')}catch(e){}}zsave();sv();zUi();return true}
 function zUi(){const o=document.getElementById('zenpts');if(o)o.textContent=ZN().pts}
 function openZen(){const z=ZN();const o=modal(`<h2>🪷 Zen Garden</h2><p class="wgs">Rake the sand by dragging. Stones, plants and lanterns cost Zen points (you get 1 per SP). Zen points: <b id="zenpts">${z.pts}</b></p><canvas id="zcv" style="width:100%;border-radius:12px;touch-action:none;cursor:crosshair" aria-label="Sand garden drawing area"></canvas><div class="zt">${ZT.map(t=>`<button data-sm="ztool" data-t="${t[0]}" class="${ztool===t[0]?'on':''}" aria-pressed="${ztool===t[0]}">${t[1]} ${t[2]}${t[3]?` <small>${t[3]}</small>`:''}</button>`).join('')}</div>`,'zen');
  zcv=o.querySelector('#zcv');zInit();
  zcv.onpointerdown=e=>{e.preventDefault();const[x,y]=zpos(e);if(ztool==='rake'){zprev=zc.getImageData(0,0,720,400);zdraw=true;zlast=[x,y];try{zcv.setPointerCapture(e.pointerId)}catch(er){}}else if(ztool==='smooth'){zprev=zc.getImageData(0,0,720,400);sand();zsave()}else if(ztool!=='undo')stampIt(ztool,x,y)};
  zcv.onpointermove=e=>{if(!zdraw)return;const[x,y]=zpos(e);zc.lineCap='round';[-8,0,8].forEach(off=>{zc.strokeStyle='rgba(140,118,76,.75)';zc.lineWidth=2.2;zc.beginPath();zc.moveTo(zlast[0],zlast[1]+off);zc.lineTo(x,y+off);zc.stroke();zc.strokeStyle='rgba(255,248,222,.7)';zc.lineWidth=1.2;zc.beginPath();zc.moveTo(zlast[0],zlast[1]+off+2.2);zc.lineTo(x,y+off+2.2);zc.stroke()});zlast=[x,y]};
  const end=()=>{if(zdraw){zdraw=false;zsave()}};zcv.onpointerup=end;zcv.onpointercancel=end}
 SM.ztool=t=>{const k=t.dataset.t;if(k==='undo'){if(zprev){zc.putImageData(zprev,0,0);zsave()}return}ztool=k;document.querySelectorAll('#sfmod .zt button').forEach(b=>{const on=b.dataset.t===k;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})};
 PAN.sf_zen={ico:'🪷',title:'Zen Garden',
  hud:()=>`🪷 ZEN · <b>${ZN().pts}</b> calm points · ${ZN().placed} placed`,
  mini:()=>`🪷 Zen ${ZN().pts}`,
  body:()=>{let img='';try{img=localStorage.getItem(ZK)||''}catch(e){}return `<p class="sfp">Study earns Zen points. Spend them on stones, plants and lanterns in your own sand garden.</p>${img?`<img class="zth" src="${img}" alt="Your garden">`:''}<p class="sfp">Zen points <b>${ZN().pts}</b> · Items placed <b>${ZN().placed}</b></p><button class="sfbig" data-sf="zen">🪷 Open garden</button>`},
  act:a=>{if(a==='zen')openZen()}};

 /* ---------- 5. FLASHCARD LIBRARY ---------- */
 const FL=()=>{const f=M.fl=M.fl||{};f.c=f.c||[];f.cd=f.cd||0;f.ct=f.ct||0;f.sd=f.sd||0;f.st=f.st||0;f.m=f.m||0;f.k=f.k||0;return f};
 const INT=[0,1,2,4,8,16,0];
 const due=()=>{const d=D();return FL().c.filter(c=>c.b<6&&c.due<=d)};
 let fv='study',fcur=null,fshow=false,fmsg='';
 function fday(){const f=FL();if(f.cd!==D()){f.cd=D();f.ct=0;f.sd=0;f.st=0}return f}
 function flRender(){const f=fday(),o=document.getElementById('sfmod');if(!o)return;const dl=due();
  const tabs=['study','add','cards'].map(t=>`<button data-sm="fvw" data-v="${t}" class="${fv===t?'on':''}">${{study:'🎴 Study',add:'➕ Add cards',cards:'🗂️ My cards'}[t]}</button>`).join('');
  let b='';
  if(fv==='study'){if(!fcur||!dl.includes(fcur))fcur=dl[Math.floor(Math.random()*dl.length)]||null;
   if(!fcur)b=`<p class="wgs">${f.c.length?'🎉 All caught up! Nothing is due. Come back tomorrow.':'No cards yet. Add some in the Add tab.'}</p>`;
   else b=`<p class="wgs">${dl.length} due · box ${fcur.b}/5${fcur.t?' · '+esc2(fcur.t):''}</p><div class="flc">${esc2(fcur.q)}${fshow?`<hr><b>${esc2(fcur.a)}</b>`:''}</div><div class="wgb">${fshow?`<button class="pri" data-sm="fok">✅ Knew it</button><button data-sm="fno">❌ Missed</button>`:`<button class="pri" data-sm="fsh">Show answer</button>`}</div>`;
   b+=`<p class="wgs">${fmsg}</p>`}
  else if(fv==='add')b=`<p class="wgs">One card:</p><input id="flq" maxlength="300" placeholder="Question" style="width:100%;padding:8px;margin:4px 0" aria-label="Question"><input id="fla" maxlength="300" placeholder="Answer" style="width:100%;padding:8px;margin:4px 0" aria-label="Answer"><input id="flt" maxlength="20" placeholder="Subject (optional)" style="width:100%;padding:8px;margin:4px 0" aria-label="Subject"><div class="wgb"><button class="pri" data-sm="fadd">Add card</button></div><p class="wgs">Or paste many, one per line as <code>question :: answer</code>:</p><textarea id="flb" style="width:100%;height:90px" aria-label="Bulk cards"></textarea><div class="wgb"><button data-sm="fbulk">Import</button></div><p class="wgs">${fmsg}</p>`;
  else b=`<ul class="wgl">${f.c.slice(-40).reverse().map(c=>`<li><span aria-hidden="true">${c.b>=6?'📖':'🗂️'}</span><b>${esc2(c.q).slice(0,70)}</b><small>${c.b>=6?'mastered':'box '+c.b+' · due '+(c.due<=D()?'now':'in '+(c.due-D())+'d')}</small><button data-sm="fdel" data-id="${c.id}" aria-label="Delete card">🗑</button></li>`).join('')||'<li>No cards</li>'}</ul>`;
  const bx=[1,2,3,4,5].map(i=>f.c.filter(c=>c.b===i).length),mm=f.c.filter(c=>c.b>=6).length;
  o.querySelector('.wgm').innerHTML=`<h2>📚 Flashcard Library</h2><div class="zt">${tabs}</div><div class="flshelf" aria-label="Leitner boxes">${bx.map((n,i)=>`<span title="Box ${i+1}">🗄️${i+1}<b>${n}</b></span>`).join('')}<span title="Mastered">📖<b>${mm}</b></span></div>${b}<p class="wgs">Today: ${f.ct}/60 coins from cards · ${f.sd}/10 SP</p><div class="wgb"><button data-sm="close">Close</button></div>`}
 function openFl(v){fv=v||(due().length?'study':FL().c.length?'cards':'add');fshow=false;fmsg='';modal('');flRender()}
 function fGive(ok){const f=fday(),c=fcur;if(!c)return;if(ok){f.k++;c.b++;if(c.b>=6){c.due=99999999;f.m++;M.coins+=10;fmsg='📖 Mastered! +10 coins';try{toast('📖 Card mastered! +10 coins')}catch(e){}}else c.due=D()+INT[c.b];if(f.ct<60){f.ct++;M.coins++}
   f.st++;if(f.st%5===0&&f.sd<10){f.sd++;try{addSP(1,'cards')}catch(e){}}try{paintChip();SND([660,880],'triangle',.04,.05)}catch(e){}}
  else{c.b=1;c.due=D();fmsg='Back to box 1. You will see it again soon.'}
  fshow=false;fcur=null;sv();flRender()}
 SM.fvw=t=>{fv=t.dataset.v;fmsg='';flRender()};SM.fsh=()=>{fshow=true;flRender()};SM.fok=()=>fGive(true);SM.fno=()=>fGive(false);
 SM.fadd=()=>{const q=document.getElementById('flq').value.trim(),a=document.getElementById('fla').value.trim(),t=document.getElementById('flt').value.trim();if(!q||!a){fmsg='Write both a question and an answer.';flRender();return}const f=FL();if(f.c.length>=500){fmsg='Card limit reached (500).';flRender();return}f.c.push({id:Date.now().toString(36)+Math.floor(Math.random()*999),q,a,t,b:1,due:D()});sv();fmsg='Added ✅';flRender();const e=document.getElementById('flq');if(e)e.focus()};
 SM.fbulk=()=>{const f=FL();let n=0;(document.getElementById('flb').value||'').split('\n').forEach(l=>{const i=l.indexOf('::');if(i<1)return;const q=l.slice(0,i).trim().slice(0,300),a=l.slice(i+2).trim().slice(0,300);if(q&&a&&f.c.length<500){f.c.push({id:Date.now().toString(36)+Math.floor(Math.random()*9999)+n,q,a,t:'',b:1,due:D()});n++}});sv();fmsg=n+' cards imported.';flRender()};
 SM.fdel=t=>{const f=FL();f.c=f.c.filter(c=>c.id!==t.dataset.id);sv();flRender()};
 let flToast=0;tick.push(()=>{if(act('sf_library')&&flToast!==D()){flToast=D();const n=due().length;if(n)try{toast('📚 '+n+' flashcard'+(n>1?'s':'')+' due today')}catch(e){}}});
 PAN.sf_library={ico:'📚',title:'Flashcard Library',
  hud:()=>`📚 LIBRARY · <b>${due().length}</b> due · ${FL().c.length} cards · ${FL().m} mastered`,
  mini:()=>`📚 ${due().length} due`,
  body:()=>{const f=FL(),bx=[1,2,3,4,5].map(i=>f.c.filter(c=>c.b===i).length);return `<p class="sfp">Your own flashcards with spaced repetition. Right answers move cards up the boxes, wrong ones go back to box 1.</p><div class="flshelf">${bx.map((n,i)=>`<span>🗄️${i+1}<b>${n}</b></span>`).join('')}<span>📖<b>${f.c.filter(c=>c.b>=6).length}</b></span></div><p class="sfp"><b>${due().length}</b> due today · ${f.c.length} cards</p><button class="sfbig" data-sf="fstudy">🎴 ${due().length?'Study now':'Open library'}</button><button data-sf="fadd2">➕ Add cards</button>`},
  act:a=>{if(a==='fstudy')openFl();else if(a==='fadd2')openFl('add')}};

 /* ---------- 6. EXAM BOSS ---------- */
 addC('title','sf_ex_t','Exam Slayer','epic',{title:'Exam Slayer',pack:'sfx',noDrop:true});
 const EX=()=>{const e=M.ex=M.ex||{};e.l=e.l||[];return e};
 const BOSS=['👹','🐉','🦑','👾','🧟','🦂','🐙','👺'];
 const dOf=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?Math.floor(Date.UTC(+m[1],+m[2]-1,+m[3])/864e5):null};
 const exAct=()=>EX().l.filter(x=>!x.done).sort((a,b)=>dOf(a.date)-dOf(b.date));
 function exSP(d){if(!own('sf_cram'))return;const L=exAct();if(!L.length)return;const x=L[0];exDay(x);x.dmg+=d;if(x.dmg>=x.tgt)exWin(x)}
 function exDay(x){if(!x.d0||x.d0.day!==D())x.d0={day:D(),dmg:x.dmg}}
 function exWin(x){x.done=1;const R=200+Math.floor(x.tgt/5);M.coins+=R;M.inv.box.gold=(M.inv.box.gold||0)+1;if(!M.inv.own.sf_ex_t){M.inv.own.sf_ex_t=1;try{buildOpts()}catch(e){}}sv();try{paintChip();lootSting('legendary');confetti(true);jxSplash('BOSS DEFEATED!',x.n+' · +'+R+' coins + Golden Crate','#ffd166',x.boss)}catch(e){}}
 function exExpire(){EX().l.forEach(x=>{if(!x.done&&dOf(x.date)<D()){x.done=2}})}
 const left=x=>Math.max(0,dOf(x.date)-D());
 function exRender(){const o=document.getElementById('sfmod');if(!o)return;exExpire();const L=EX().l.slice().sort((a,b)=>(a.done?1:0)-(b.done?1:0)||dOf(a.date)-dOf(b.date));
  o.querySelector('.wgm').innerHTML=`<h2>👹 Exam Boss</h2><p class="wgs">Every exam is a boss. Your Study Points hit the closest one. Defeat it before the exam day.</p>${L.map(x=>{exDay(x);const hp=Math.max(0,Math.round((1-x.dmg/x.tgt)*100));return `<div class="exr ${x.done?'dn':''}"><span class="exb" aria-hidden="true">${x.done===1?'💀':x.boss}</span><div><b>${esc2(x.n)}</b> <small>${x.date} · ${x.done===1?'DEFEATED':x.done===2?'Escaped with '+hp+'% HP':left(x)+' days left'}</small><div class="sfbar"><i style="width:${hp}%"></i></div><small>${Math.round(Math.min(x.dmg,x.tgt))}/${x.tgt} SP damage</small></div><button data-sm="exdel" data-id="${x.id}" aria-label="Delete exam">🗑</button></div>`}).join('')||'<p class="wgs">No exams yet.</p>'}<h3>New boss</h3><input id="exn" maxlength="30" placeholder="Exam name (e.g. Calculus)" style="width:100%;padding:8px;margin:4px 0" aria-label="Exam name"><div class="labrow"><label class="labc"><span>Exam date</span><input id="exd" type="date"></label><label class="labc"><span>Difficulty (SP to deal)</span><select id="ext"><option value="300">Light 300</option><option value="800" selected>Normal 800</option><option value="1500">Heavy 1500</option><option value="3000">Brutal 3000</option></select></label></div><div class="wgb"><button class="pri" data-sm="exadd">Summon boss</button></div><p class="wgs" id="exm"></p><div class="wgb"><button data-sm="close">Close</button></div>`}
 function openEx(){modal('');exRender()}
 SM.exadd=()=>{const n=document.getElementById('exn').value.trim(),d=document.getElementById('exd').value,t=+document.getElementById('ext').value,m=document.getElementById('exm');const dd=dOf(d);if(!n||dd==null){m.textContent='Add a name and a date.';return}if(dd<D()){m.textContent='The date must be today or later.';return}if(EX().l.length>=20){m.textContent='Too many exams.';return}let h=0;for(const ch of n)h=(h*31+ch.charCodeAt(0))|0;EX().l.push({id:Date.now().toString(36),n,date:d,tgt:t,dmg:0,boss:BOSS[Math.abs(h)%BOSS.length],done:0,d0:{day:D(),dmg:0}});sv();exRender()};
 SM.exdel=t=>{EX().l=EX().l.filter(x=>x.id!==t.dataset.id);sv();exRender()};
 PAN.sf_cram={ico:'👹',title:'Exam Boss',
  hud:()=>{exExpire();const x=exAct()[0];return x?`👹 ${esc2(x.n).toUpperCase()} · <b>${Math.max(0,Math.round((1-x.dmg/x.tgt)*100))}%</b> HP · ${left(x)} days`:'👹 EXAM BOSS · no exam set'},
  mini:()=>{exExpire();const x=exAct()[0];return x?`${x.boss} ${Math.max(0,Math.round((1-x.dmg/x.tgt)*100))}% · ${left(x)}d`:'👹 Set an exam'},
  body:()=>{exExpire();const x=exAct()[0];if(!x)return `<p class="sfp">Add an exam and its date. Your study becomes damage to the boss.</p><button class="sfbig" data-sf="exm">👹 Summon a boss</button>`;exDay(x);const hp=Math.max(0,Math.round((1-x.dmg/x.tgt)*100)),dl=left(x),rem=x.tgt-x.d0.dmg,q=Math.ceil(rem/(dl+1)),dn=Math.round(x.dmg-x.d0.dmg);return `<p class="sfbig2" aria-hidden="true">${x.boss}</p><p class="sfp"><b>${esc2(x.n)}</b> · ${dl===0?'<b>EXAM DAY</b>':dl+' days left'}</p><div class="sfbar bad"><i style="width:${hp}%"></i></div><p class="sfp">Boss HP <b>${hp}%</b></p><p class="sfp">Daily quota: <b>${Math.min(dn,q)}/${q}</b> SP ${dn>=q?'✅':''}</p><button data-sf="exm">Manage exams</button>`},
  act:a=>{if(a==='exm')openEx()}};
 const st=document.createElement('style');st.textContent=`#sfdock{position:fixed;right:10px;bottom:70px;width:300px;max-width:calc(100vw - 20px);z-index:9400;background:var(--card);color:var(--fg);border:2px solid var(--acc);border-radius:14px;box-shadow:0 8px 28px #0005;padding:10px;font-size:13px}#sfdock.min{width:auto;padding:0;background:none;border:0;box-shadow:none}
.sfmini{background:var(--acc);color:var(--on,#fff);border:0;border-radius:30px;padding:9px 14px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px #0005}.sfhd{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.sfhd button{width:28px;height:28px;border-radius:8px;border:1px solid var(--bd);background:var(--card2,var(--card));color:var(--fg);cursor:pointer;font-weight:900}
#sfdock button:not(.sfhd button):not(.sfmini){margin:3px 3px 0 0;padding:7px 10px;border-radius:10px;border:1px solid var(--bd);background:var(--card2,var(--card));color:var(--fg);cursor:pointer;font-weight:700}#sfdock .sfbig{width:100%;background:var(--acc);color:var(--on,#fff);border:0;padding:10px;font-size:14px}.sfl{display:flex;flex-direction:column;gap:2px;margin:6px 0}.sfl button{text-align:left}.sfl button.on{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc)}#sfdock button:disabled{opacity:.45}
.sfp{margin:6px 0;line-height:1.4}.sfbig2{font-size:54px;text-align:center;margin:0}.sfbar{height:12px;border-radius:7px;background:var(--card2,#0002);border:1px solid var(--bd);overflow:hidden}.sfbar i{display:block;height:100%;background:var(--acc2,var(--acc))}.sfbar.bad i{background:#e03131}.pfgrid{display:flex;flex-wrap:wrap;gap:2px;font-size:20px;max-height:120px;overflow:auto}.sfrow{display:flex;gap:6px;font-size:18px}.sfrow .dim{opacity:.25;filter:grayscale(1)}.pftree{text-align:center;margin-top:12px}.pftree small{display:block}.zth{width:100%;border-radius:8px;margin:4px 0}.zt{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.zt button{padding:6px 10px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--fg);cursor:pointer}.zt button.on{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc)}
#wxc{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9300}.sfm{max-width:760px;width:94vw;max-height:92vh;overflow:auto}.flc{background:var(--card2,#0002);border:2px solid var(--bd);border-radius:14px;padding:22px;margin:10px 0;font-size:20px;text-align:center}.flshelf{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:6px 0}.flshelf span{border:1px solid var(--bd);border-radius:10px;padding:4px 8px;background:var(--card2,#0002)}.flshelf b{margin-left:4px}.exr{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--bd)}.exr>div{flex:1}.exr.dn{opacity:.6}.exb{font-size:34px}`;document.head.appendChild(st);
 setTimeout(()=>draw(true),2500);
 window.SFX={PAN,tick,modal,SM,act,own,sv,esc2,SND,closeM,draw,tdy,D};
})();

