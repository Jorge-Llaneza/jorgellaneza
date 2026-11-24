/* ======= FANDOM THEMES: Jiggle Physics + Neon Coast Heist ======= */
(function(){
 const X=window.SFX,PAN=X.PAN,tick=X.tick,SM=X.SM,modal=X.modal;const D=X.D;
 const {ST,rnd,pick,pay,bar,run,onSP,sfx,splash,btn}=window.sfLib;const now=()=>Date.now();
 try{const st=document.createElement('style');st.textContent='@keyframes jgw{0%,100%{transform:scale(1,1)}30%{transform:scale(1.08,.92)}60%{transform:scale(.95,1.06)}}@media(prefers-reduced-motion:reduce){.nfx-jg_wobble{animation:none!important}}';document.head.appendChild(st);window.FDCSS=(window.FDCSS||'')+'@keyframes jgw{0%,100%{transform:scale(1,1)}30%{transform:scale(1.08,.92)}60%{transform:scale(.95,1.06)}}'}catch(e){}

 /* Jiggle Physics: spring jelly playground */
 {const id='jelly',S=()=>ST(id,{sp:0,tk:0,best:0,runs:0});const COL=['#ff4fa3','#1fb8e8','#ffd23f','#7be26b','#b57bff','#ff8a3d','#4df0d0','#ff6b6b'];
  onSP(id,d=>{const s=S();s.sp+=d;s.tk+=d/12});
  const count=s=>Math.min(8,1+Math.floor(s.sp/10));
  SM.jgplay=()=>{const s=S();if(s.tk<1)return;s.tk--;s.runs++;
   const o=modal(`<canvas id="sfcv" width="300" height="360" style="width:100%;max-width:300px;background:#fff0f8;border-radius:12px;touch-action:none"></canvas><p id="sfcvt" class="sfp">Tap the jellies to bounce them. Don't let one rest on the floor for 4 seconds!</p>`);const c=document.getElementById('sfcv'),g=c.getContext('2d');
   const n=count(s),J=[];for(let i=0;i<n;i++)J.push({x:40+i*(220/Math.max(1,n-1||1)),y:60+rnd(100),vy:0,vx:(Math.random()-.5)*2,r:22,sq:0,sv:0,rest:0,col:COL[i%8]});
   let score=0,t=0,end=false;
   c.addEventListener('pointerdown',e=>{const rc=c.getBoundingClientRect(),px=(e.clientX-rc.left)/rc.width*300,py=(e.clientY-rc.top)/rc.height*360;let b=null,bd=1e9;J.forEach(j=>{const d=Math.hypot(j.x-px,j.y-py);if(d<j.r+16&&d<bd){bd=d;b=j}});if(b){b.vy=-9-Math.random()*2;b.vx+=(b.x-px)*.08;b.sv=-.5;b.rest=0;score++;sfx([300+score%6*60],'sine',.03,.06)}});
   (function f(){if(end||!document.getElementById('sfcv'))return;t++;g.clearRect(0,0,300,360);J.forEach(j=>{j.vy+=.38;j.y+=j.vy;j.x+=j.vx;if(j.x<j.r||j.x>300-j.r){j.vx*=-1;j.x=Math.max(j.r,Math.min(300-j.r,j.x))}
     if(j.y>330-j.r){j.y=330-j.r;if(Math.abs(j.vy)>1){j.sv=Math.abs(j.vy)*.05}j.vy*=-.55;if(Math.abs(j.vy)<1.2)j.vy=0;j.rest=j.vy===0?j.rest+1:0}
     j.sv+=(-j.sq)*.18;j.sv*=.86;j.sq+=j.sv;j.sq=Math.max(-.5,Math.min(.5,j.sq));const w=j.r*(1+Math.abs(j.sq)*.9),h=j.r*(1-j.sq*.9);g.fillStyle=j.col;g.beginPath();g.ellipse(j.x,j.y,w,Math.max(6,h),0,0,7);g.fill();g.fillStyle='#fff8';g.beginPath();g.ellipse(j.x-w*.3,j.y-h*.35,w*.25,h*.18,0,0,7);g.fill();if(j.rest>240)end=true});
    g.fillStyle='#d81b7b';g.fillRect(0,330,300,30);g.fillStyle='#3a1850';g.font='14px sans-serif';g.fillText('Bounces: '+score,8,18);
    if(end||t>60*40){end=true;const coins=Math.round(score*.2);s.best=Math.max(s.best,score);pay(coins,'🫧 '+score+' bounces! +'+coins+' 🪙');const tt=document.getElementById('sfcvt');if(tt)tt.textContent=(t>60*40?'Time! ':'A jelly rested on the floor. ')+score+' bounces, +'+coins+' coins.';return}requestAnimationFrame(f)})()};
  PAN[id]={ico:'🫧',title:'Jelly Playground',hud:()=>`🫧 JIGGLE · ${count(S())} jellies · 🎟️ ${Math.floor(S().tk)} · best ${S().best}`,mini:()=>`🫧 ${count(S())} jellies`,
   body:()=>{const s=S();return `<p class="sfp">Every 10 SP adds a jelly to your collection. Every 12 SP gives a playground ticket. Keep all your jellies bouncing for up to 40 seconds.</p><p class="sfp">${Array.from({length:count(s)},(_,i)=>'<span style="color:'+COL[i%8]+'">●</span>').join(' ')} <b>${count(s)}</b> jellies · Best ${s.best}</p><p class="sfp">Tickets <b>${Math.floor(s.tk)}</b></p><button data-sf="jgplay" class="sfb" ${s.tk<1?'disabled':''}>🫧 Play</button>`},
   act:a=>{if(SM[a])SM[a]()}}}

 /* Neon Coast Heist: empire and heat */
 {const id='vicecity',S=()=>ST(id,{cash:0,prop:{},heat:0,idle:0,last:now(),net:0});
  const PR=[['Taco Stand','🌮',150,3],['Car Wash','🚗',500,10],['Neon Club','🪩',2000,45],['Marina','⚓',6000,150]];
  const mult=s=>Math.max(0,1-s.heat*.2);
  onSP(id,d=>{const s=S();s.cash+=d*100;s.heat=Math.max(0,s.heat-d/5);s.last=now()});
  tick.push(()=>{if(!X.own(id))return;const s=S();let inc=0;PR.forEach(p=>{inc+=(s.prop[p[0]]||0)*p[3]});s.cash+=inc*mult(s)/60*.5;s.net=Math.max(s.net,s.cash);if(run(id)&&now()-s.last>8*60000&&s.heat<5){s.heat++;s.last=now();try{toast('🚨 Heat rising: '+Math.ceil(s.heat)+'★ Study to cool off!')}catch(e){}}});
  const inc=s=>PR.reduce((a,p)=>a+(s.prop[p[0]]||0)*p[3],0);
  PAN[id]={ico:'🌴',title:'Empire',hud:()=>`🌴 EMPIRE · $${Math.floor(S().cash)} · ${'★'.repeat(Math.ceil(S().heat))||'no heat'}`,mini:()=>`🌴 $${Math.floor(S().cash)} ${'★'.repeat(Math.ceil(S().heat))}`,
   body:()=>{const s=S(),hs=Math.ceil(s.heat);return `<p class="sfp">Each study point is $100. Buy businesses that earn $ per minute. Skipping study for 8 minutes adds a wanted star, and every star cuts your income by 20%. Studying clears heat.</p><p class="sfp">💵 <b>$${Math.floor(s.cash)}</b> · income $${(inc(s)*mult(s)).toFixed(1)}/min · Wanted: <b>${'★'.repeat(hs)||'clean'}</b></p>${bar(5-s.heat,5)}${PR.map((p,i)=>btn('by',p[1]+' '+p[0]+' ×'+(s.prop[p[0]]||0)+' · $'+Math.round(p[2]*Math.pow(1.35,s.prop[p[0]]||0)),'data-i="'+i+'"',s.cash<p[2]*Math.pow(1.35,s.prop[p[0]]||0))).join('')}${btn('ln','💰 Launder $2000 → 10 🪙 (max 6 a day)','',s.cash<2000||(s.lc&&s.lc.d===D()&&s.lc.n>=6))}`},
   act:(a,t)=>{const s=S();if(a==='by'){const p=PR[+t.dataset.i],c=Math.round(p[2]*Math.pow(1.35,s.prop[p[0]]||0));if(s.cash>=c){s.cash-=c;s.prop[p[0]]=(s.prop[p[0]]||0)+1;sfx([392,523,659],'sawtooth',.04,.08)}}else if(a==='ln'&&s.cash>=2000){if(!s.lc||s.lc.d!==D())s.lc={d:D(),n:0};if(s.lc.n>=6)return;s.lc.n++;s.cash-=2000;pay(10,'💰 Laundered. +10 🪙')}}}}

 try{['jelly','vicecity'].forEach(k=>{if(window.FDK&&FDK[k])FDK[k].hud=()=>{try{return PAN[k].hud()}catch(e){return ''}}})}catch(e){}
})();

