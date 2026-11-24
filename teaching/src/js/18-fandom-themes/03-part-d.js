/* ======= FANDOM THEMES (part D) ======= */
(function(){
 const X=window.SFX,PAN=X.PAN,tick=X.tick,SM=X.SM,modal=X.modal,esc=X.esc2,D=X.D;
 const {ST,rnd,pick,pay,bar,run,onSP,sfx,splash,btn}=window.sfLib;const now=()=>Date.now();

 /* Neon Conduit: clickable shards */
 {const id='neonconduit',S=()=>ST(id,{k:0,tier:0,col:0,t:0});const TI=[0,10,30,70,150];
  const tier=s=>{let t=0;TI.forEach((v,i)=>{if(s.col>=v)t=i});return t};
  function spawn(){if(document.hidden||!run(id))return;const e=document.createElement('button');e.className='nshard';e.setAttribute('aria-label','Collect neon shard');e.textContent='⚡';e.style.cssText='position:fixed;z-index:9000;font-size:28px;background:rgba(0,240,255,.15);border:2px solid #0ff;border-radius:50%;width:48px;height:48px;cursor:pointer;box-shadow:0 0 14px #0ff;left:'+(8+Math.random()*80)+'%;top:'+(15+Math.random()*60)+'%';e.onclick=()=>{const s=S();s.col++;const b=tier(s);s.k+=1;e.remove();sfx([880,1320],'sine',.04,.06);if(tier(s)>b)pay(15*tier(s),'⚡ Power tier '+tier(s)+'! +'+15*tier(s)+' 🪙');else pay(tier(s)>=3?2:1)};document.body.appendChild(e);setTimeout(()=>e.remove(),6000)}
  onSP(id,d=>{if(Math.random()<Math.min(1,d/10+.3))spawn()});
  PAN[id]={ico:'⚡',title:'Conduit',hud:()=>`⚡ CONDUIT · tier ${tier(S())} · ${S().col} shards`,mini:()=>`⚡ T${tier(S())}`,
   body:()=>{const s=S(),t=tier(s),nx=TI[t+1];return `<p class="sfp">Studying makes blast shards appear on screen for six seconds. Click them fast. Higher tiers pay more per shard.</p><p class="sfp">Tier <b>${t}</b> · Shards <b>${s.col}</b>${nx?' · next tier at '+nx:''}</p>${nx?bar(s.col-TI[t],nx-TI[t]):''}`}}}

 /* Rust Puzzle: timed trap puzzles */
 {const id='rustpuzzle',S=()=>ST(id,{keys:0,sp:0,solved:0,fail:0,cur:null});
  onSP(id,d=>{const s=S();s.sp+=d;while(s.sp>=15){s.sp-=15;s.keys++}});
  function mk(){const t=rnd(3);if(t===0){const a=2+rnd(12),b=2+rnd(12);return {q:'The lock shows: '+a+' × '+b+' = ?',a:String(a*b),t:30}}if(t===1){const a=1+rnd(5),d=2+rnd(5);return {q:'Sequence: '+[0,1,2,3].map(i=>a+d*i).join(', ')+', ?',a:String(a+d*4),t:30}}const w=pick(['STUDY','FOCUS','LEARN','NOTES','BRAIN']);const sc=w.split('').sort(()=>Math.random()-.5).join('');return {q:'Unscramble the code word: '+sc,a:w,t:40}}
  SM.rpgo=()=>{const s=S();if(s.keys<1||s.cur)return;s.keys--;s.cur=Object.assign(mk(),{start:now()});show()};
  function show(){const s=S(),c=s.cur;if(!c)return;modal(`<h3>🔧 The Mechanism</h3><p>${esc(c.q)}</p><p id="rptm">Time: ${c.t}s</p><input id="rpin" aria-label="Answer" style="width:100%;padding:8px"><div class="sfrow"><button data-sm="rpans">Submit</button></div>`);const iv=setInterval(()=>{const el=document.getElementById('rptm');if(!el||!S().cur){clearInterval(iv);return}const l=c.t-Math.floor((now()-c.start)/1000);el.textContent='Time: '+Math.max(0,l)+'s';if(l<=0){clearInterval(iv);fin(false)}},500)}
  function fin(ok){const s=S();s.cur=null;if(ok){s.solved++;pay(18,'🔧 Mechanism disarmed! +18 🪙')}else{s.fail++;try{toast('⛓️ The mechanism snapped shut. Try another key.')}catch(e){}}X.closeM&&X.closeM()}
  SM.rpans=()=>{const s=S(),c=s.cur;if(!c)return;const v=(document.getElementById('rpin').value||'').trim().toUpperCase();fin(v===c.a.toUpperCase())};
  PAN[id]={ico:'🔧',title:'The Mechanism',hud:()=>`🔧 KEYS ${S().keys} · solved ${S().solved}`,mini:()=>`🔧 ${S().keys} keys`,
   body:()=>{const s=S();return `<p class="sfp">Every 15 SP earns a key. Spend one to attempt a timed puzzle. Solve it before time runs out for coins. No gore, just clockwork.</p>${bar(s.sp,15)}<p class="sfp">Keys <b>${s.keys}</b> · Solved ${s.solved} · Failed ${s.fail}</p><button data-sf="rpgo" class="sfb" ${s.keys<1?'disabled':''}>🔧 Use a key</button>`},act:a=>{if(SM[a])SM[a]()}}}

 /* Critter Quest */
 {const id='critterquest',S=()=>ST(id,{orb:0,team:[],dex:[],enc:null,next:0});const SP=[['Leafling','🌱',1],['Embermouse','🔥',1],['Dewfin','💧',1],['Sparkit','⚡',2],['Shadepaw','🌑',2],['Aurora Fox','🦊',3],['Crystaldrake','🐉',4]];const cap=[.75,.5,.3,.12];
  onSP(id,d=>{const s=S();s.orb+=Math.floor((s._f=(s._f||0)+d)/5);s._f%=5;s.team.forEach(c=>c.xp+=d);s.team.forEach(c=>{while(c.xp>=30*c.lv){c.xp-=30*c.lv;c.lv++;try{toast('🐾 '+c.n+' grew to Lv '+c.lv)}catch(e){}}})});
  tick.push(()=>{if(!run(id))return;const s=S();if(!s.next)s.next=now()+2*60000;if(!s.enc&&now()>s.next){const r=Math.random(),k=r<.5?0:r<.8?1:r<.95?2:3;s.enc=pick(SP.filter(x=>x[2]===k+1));try{toast('🐾 A wild '+s.enc[0]+' appeared!')}catch(e){}}});
  PAN[id]={ico:'🐾',title:'Critter Dex',hud:()=>`🐾 DEX ${S().dex.length}/7 · team ${S().team.length} · 🔴${S().orb}`,mini:()=>`🐾 ${S().dex.length}/7`,
   body:()=>{const s=S(),e=s.enc;return `<p class="sfp">Every 5 SP gives a catch orb. Wild critters appear while you study. Rarer ones are harder to catch. Team members level up from study.</p><p class="sfp">Orbs <b>${s.orb}</b> · Dex ${s.dex.length}/7</p>${e?`<div class="sfalert">${e[1]} <b>${e[0]}</b> (${Math.round(cap[e[2]-1]*100)}% catch)<br>${btn('th','🔴 Throw orb','',s.orb<1)} ${btn('fl','Run')}</div>`:''}<p class="sfp">${s.team.map(c=>c[1]+' '+c.n+' Lv'+c.lv).join(' · ')||'<small>No critters yet.</small>'}</p>`},
   act:a=>{const s=S(),e=s.enc;if(!e)return;if(a==='fl'){s.enc=null;s.next=now()+4*60000}else if(a==='th'&&s.orb>0){s.orb--;if(Math.random()<cap[e[2]-1]){if(!s.dex.includes(e[0])){s.dex.push(e[0]);pay(12*e[2],'📖 New dex entry: '+e[0])}s.team.push({n:e[0],1:e[1],lv:1,xp:0});if(s.team.length>6)s.team.shift();sfx([523,659,784],'triangle',.05,.1);if(s.dex.length===7)pay(200,'🐾 Dex complete! +200 🪙');s.enc=null;s.next=now()+4*60000}else{toast('The orb broke. '+e[0]+' is still there!')}}}}}

 /* Game helper: canvas modal */
 function cv(w,h){const o=modal(`<canvas id="sfcv" width="${w}" height="${h}" style="width:100%;max-width:${w}px;background:#0b0b18;border-radius:8px;touch-action:none"></canvas><p id="sfcvt" class="sfp"></p>`);return document.getElementById('sfcv')}

 /* Rock Stage: 4-lane rhythm */
 {const id='rockstage',S=()=>ST(id,{tk:0,best:0,plays:0});const K=['d','f','j','k'];
  onSP(id,d=>{const s=S();s.tk+=d/10});
  SM.rkplay=()=>{const s=S();if(s.tk<1)return;s.tk--;s.plays++;const c=cv(280,360),g=c.getContext('2d');const notes=[];let sc=0,cb=0,t=0,mis=0,end=false;const total=48;for(let i=0;i<total;i++)notes.push({l:rnd(4),t:30+i*22,hit:0});
   function press(l){let b=null;notes.forEach(n=>{if(!n.hit&&n.l===l&&Math.abs(n.t-t)<9&&(!b||Math.abs(n.t-t)<Math.abs(b.t-t)))b=n});if(b){b.hit=1;cb++;sc+=10+Math.min(cb,20);sfx([300+l*120],'square',.03,.05)}else{cb=0}}
   const key=e=>{const i=K.indexOf(e.key.toLowerCase());if(i>=0){e.preventDefault();press(i)}};document.addEventListener('keydown',key);
   c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect();press(Math.min(3,Math.floor((e.clientX-r.left)/r.width*4)))});
   const fin=()=>{end=true;document.removeEventListener('keydown',key);const hit=notes.filter(n=>n.hit).length,acc=Math.round(hit/total*100),coins=Math.round(hit*.2);s.best=Math.max(s.best,sc);pay(coins,'🎸 '+acc+'% accuracy · +'+coins+' 🪙');const tt=document.getElementById('sfcvt');if(tt)tt.textContent='Finished! '+hit+'/'+total+' notes · score '+sc+(acc>=90?' · ★★★':acc>=70?' · ★★':' · ★')};
   (function f(){if(end||!document.getElementById('sfcv')){document.removeEventListener('keydown',key);return}t+=.6;notes.forEach(n=>{if(!n.hit&&n.t<t-9&&!n.m){n.m=1;mis++;cb=0}});g.fillStyle='#0b0b18';g.fillRect(0,0,280,360);for(let l=0;l<4;l++){g.fillStyle='#ffffff10';g.fillRect(l*70+2,0,66,360);g.fillStyle='#fff3';g.fillText(K[l].toUpperCase(),l*70+30,350)}g.fillStyle='#fff6';g.fillRect(0,300,280,3);notes.forEach(n=>{const y=300-(n.t-t)*5;if(!n.hit&&y>-10&&y<370){g.fillStyle=['#ff4d6d','#ffd166','#4dd2ff','#7bff7b'][n.l];g.fillRect(n.l*70+10,y-8,50,14)}});g.fillStyle='#fff';g.fillText('Score '+sc+'   Combo '+cb,8,14);if(t>30+total*22+20){fin();return}requestAnimationFrame(f)})()};
  PAN[id]={ico:'🎸',title:'Main Stage',hud:()=>`🎸 STAGE · 🎟️ ${Math.floor(S().tk)} tickets · best ${S().best}`,mini:()=>`🎸 ${Math.floor(S().tk)}🎟️`,
   body:()=>{const s=S();return `<p class="sfp">Every 10 SP earns a ticket. Play a song: hit the notes with D F J K or tap the four lanes. Better accuracy, more coins.</p><p class="sfp">Tickets <b>${Math.floor(s.tk)}</b> · Best score ${s.best} · Plays ${s.plays}</p><button data-sf="rkplay" class="sfb" ${s.tk<1?'disabled':''}>🎸 Play a song</button>`},act:a=>{if(SM[a])SM[a]()}}}

 /* Cube Dash: runner */
 {const id='cubedash',S=()=>ST(id,{tk:0,best:0,runs:0});
  onSP(id,d=>{S().tk+=d/8});
  SM.cdplay=()=>{const s=S();if(s.tk<1)return;s.tk--;s.runs++;const c=cv(320,180),g=c.getContext('2d');let y=140,vy=0,x=0,dead=false,sp=3.2;const obs=[];for(let i=0;i<60;i++)obs.push({x:300+i*(110+rnd(60)),h:20+rnd(18)});
   const jump=()=>{if(y>=140)vy=-9.5};const key=e=>{if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();jump()}};document.addEventListener('keydown',key);c.addEventListener('pointerdown',jump);
   (function f(){if(dead||!document.getElementById('sfcv')){document.removeEventListener('keydown',key);return}vy+=.55;y=Math.min(140,y+vy);if(y>=140)vy=0;x+=sp;sp=Math.min(6,sp+.0006);g.fillStyle='#0b0b18';g.fillRect(0,0,320,180);g.fillStyle='#4d4dff';g.fillRect(0,160,320,20);g.fillStyle='#ffd166';g.fillRect(40,y,20,20);obs.forEach(o=>{const ox=o.x-x;if(ox>-30&&ox<340){g.fillStyle='#ff4d6d';g.beginPath();g.moveTo(ox,160);g.lineTo(ox+10,160-o.h);g.lineTo(ox+20,160);g.fill();if(ox<56&&ox+20>44&&y+20>160-o.h+6)dead=true}});g.fillStyle='#fff';g.fillText('Distance '+Math.floor(x/10)+' m',8,14);if(dead){document.removeEventListener('keydown',key);const m=Math.floor(x/10),coins=Math.floor(m/30);s.best=Math.max(s.best,m);pay(coins,'🟦 '+m+' m · +'+coins+' 🪙');const tt=document.getElementById('sfcvt');if(tt)tt.textContent='Crashed at '+m+' m (+'+coins+' coins). Best '+s.best+' m';return}requestAnimationFrame(f)})()};
  PAN[id]={ico:'🟦',title:'Level Select',hud:()=>`🟦 DASH · 🎟️ ${Math.floor(S().tk)} · best ${S().best}m`,mini:()=>`🟦 ${S().best}m`,
   body:()=>{const s=S();return `<p class="sfp">Every 8 SP earns an attempt. Jump spikes with Space, Up or a tap. Farther runs pay more coins.</p><p class="sfp">Attempts <b>${Math.floor(s.tk)}</b> · Best ${s.best} m · Runs ${s.runs}</p><button data-sf="cdplay" class="sfb" ${s.tk<1?'disabled':''}>🟦 Start run</button>`},act:a=>{if(SM[a])SM[a]()}}}

 /* Hero Hex: ultimate and roles */
 {const id='herohex',S=()=>ST(id,{ult:0,role:'dps',buff:0,cd:0});const R={dps:['💥 Damage','Ultimate: 10 minutes of ×2 coins from SP'],tank:['🛡️ Tank','Ultimate: +40 coins'],sup:['💚 Support','Ultimate: +20 coins and protects your streak for today']};
  onSP(id,d=>{const s=S();s.ult=Math.min(100,s.ult+d*3)});
  window.sfSP&&window.sfSP.push(d=>{const s=ST(id,{});if(s.buff>now()&&d>0&&X.own(id)&&!window.__hhx){window.__hhx=1;try{pay(Math.round(d))}finally{window.__hhx=0}}});
  PAN[id]={ico:'🦸',title:'Ultimate',hud:()=>`🦸 ULT ${Math.floor(S().ult)}%${S().buff>now()?' · ×2 ACTIVE':''}`,mini:()=>`🦸 ${Math.floor(S().ult)}%`,
   body:()=>{const s=S();return `<p class="sfp">Study charges your ultimate. At 100% unleash it. Your role changes what it does.</p>${bar(s.ult,100)}<div class="sfl">${Object.entries(R).map(([k,r])=>`<button data-sf="role" data-k="${k}" class="${s.role===k?'on':''}">${r[0]} <small>${r[1]}</small></button>`).join('')}</div>${btn('ult',s.ult>=100?'💥 ULTIMATE READY':'Charging… '+Math.floor(s.ult)+'%','',s.ult<100)}${s.buff>now()?'<p class="sfp">×2 coins for '+Math.ceil((s.buff-now())/60000)+' more min</p>':''}`},
   act:(a,t)=>{const s=S();if(a==='role')s.role=t.dataset.k;else if(a==='ult'&&s.ult>=100){s.ult=0;splash('ULTIMATE','Your team is unstoppable','#ffa94d','🦸');if(s.role==='dps')s.buff=now()+10*60000;else if(s.role==='tank')pay(40,'🛡️ +40 🪙');else{pay(20,'💚 +20 🪙');try{M.fx.herohexProt=D()}catch(e){}}}}}}

 /* Goat Chaos */
 {const id='goatchaos',S=()=>ST(id,{ch:0,max:0,total:0});
  onSP(id,d=>{const s=S();s.ch+=d/10});
  const FX=[['🐐 The page does a barrel roll','rotate(360deg)'],['🌀 Everything is spinning','rotate(-5deg) scale(.97)'],['🎈 Zero gravity','translateY(-12px)'],['🔊 BAAAAH!','scale(1.03)']];
  const OUT=[()=>{pay(2+rnd(10),'🐐 You headbutted a coin machine!');},()=>{pay(2,'🐐 A goat stole your pencil. Here are 2 🪙')},()=>{pay(25,'🐐 JACKPOT GOAT +25 🪙')},()=>{toast('🐐 Nothing happened. Suspicious.')}];
  PAN[id]={ico:'🐐',title:'Chaos',hud:()=>`🐐 CHAOS ${Math.floor(S().ch)} charges · ${S().total} events`,mini:()=>`🐐 ${Math.floor(S().ch)}`,
   body:()=>{const s=S();return `<p class="sfp">Every 10 SP gives a chaos charge. Unleash it for a random absurd event: coin pranks, screen wobble, goat noises.</p><p class="sfp">Charges <b>${Math.floor(s.ch)}</b> · Events ${s.total}</p>${btn('go','🐐 CAUSE CHAOS','',s.ch<1)}`},
   act:a=>{const s=S();if(a!=='go'||s.ch<1)return;s.ch--;s.total++;const f=pick(FX);try{toast(f[0])}catch(e){}if(!document.documentElement.hasAttribute('data-rmx')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.body.style.transition='transform .9s';document.body.style.transform=f[1];setTimeout(()=>{document.body.style.transform=''},1000);setTimeout(()=>{document.body.style.transition=''},2000)}sfx([200,300,150,400],'sawtooth',.05,.1);pick(OUT)()}}}

 /* HUD wiring + descriptions */
 try{Object.keys(PAN).forEach(k=>{if(window.FDK&&FDK[k]&&PAN[k].hud)FDK[k].hud=()=>{try{return PAN[k].hud()}catch(e){return ''}}})}catch(e){}
})();

