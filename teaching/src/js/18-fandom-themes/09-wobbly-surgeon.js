/* ======= Wobbly Surgeon ======= */
(function(){
 const X=window.SFX,PAN=X.PAN,SM=X.SM,modal=X.modal;
 const {ST,rnd,pick,pay,bar,onSP,sfx,btn}=window.sfLib;
 const id='surgeon',S=()=>ST(id,{sp:0,pts:0,saved:0,fail:0,best:0});
 onSP(id,d=>{const s=S();s.sp+=d;while(s.sp>=12){s.sp-=12;s.pts=Math.min(5,s.pts+1)}});
 const PATH=[[40,310],[40,230],[150,230],[150,140],[60,140],[60,60],[250,60]];
 const seg=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-(a[0]+t*dx),p[1]-(a[1]+t*dy))};
 const dist=p=>{let m=1e9;for(let i=0;i<PATH.length-1;i++)m=Math.min(m,seg(p,PATH[i],PATH[i+1]));return m};
 SM.sgplay=()=>{const s=S();if(s.pts<1)return;s.pts--;
  modal('<canvas id="sfcv" width="300" height="340" style="width:100%;max-width:300px;background:#e6f6f2;border-radius:10px;touch-action:none;cursor:crosshair"></canvas><p id="sfcvt" class="sfp">Move to the 🧸, hold still to grab it, then carry it along the pink corridor to the tray. Three bumps and the alarm goes off.</p>');
  const c=document.getElementById('sfcv'),g=c.getContext('2d');let tx=40,ty=330,hx=40,hy=330,grab=0,held=0,strikes=0,cool=0,t=0,end=false,wob=1.5;
  const mv=e=>{const r=c.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*300;ty=(e.clientY-r.top)/r.height*340};c.addEventListener('pointermove',mv);c.addEventListener('pointerdown',mv);
  (function f(){if(end||!document.getElementById('sfcv'))return;t++;wob=1.2+t/900;
   hx+=(tx-hx)*.14+Math.sin(t*.21)*wob+Math.sin(t*.53+2)*wob*.6;hy+=(ty-hy)*.14+Math.cos(t*.17)*wob+Math.cos(t*.47)*wob*.6;
   g.clearRect(0,0,300,340);g.fillStyle='#fff';g.fillRect(0,0,300,340);
   g.lineCap='round';g.lineJoin='round';g.strokeStyle='#ffb8c6';g.lineWidth=46;g.beginPath();PATH.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();
   g.strokeStyle='#ffe3e9';g.lineWidth=36;g.stroke();
   g.font='26px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(held?'':'🧸',PATH[0][0],PATH[0][1]);g.fillText('🛒',PATH[PATH.length-1][0]+24,PATH[PATH.length-1][1]);
   const p=[hx,hy];
   if(!held){if(Math.hypot(hx-PATH[0][0],hy-PATH[0][1])<16){grab++;if(grab>40){held=1;sfx([660,880],'sine',.04,.08)}}else grab=Math.max(0,grab-2)}
   else{const d=dist(p);cool=Math.max(0,cool-1);if(d>23&&cool===0){strikes++;cool=45;sfx([200,150],'square',.05,.1);try{if(navigator.vibrate)navigator.vibrate(80)}catch(e){}}
    if(Math.hypot(hx-(PATH[PATH.length-1][0]+24),hy-PATH[PATH.length-1][1])<18){end=true;const coins=Math.max(6,16-strikes*5);s.saved++;s.best=Math.max(s.best,3-strikes);pay(coins,'🩺 Toy removed! +'+coins+' 🪙');const tt=document.getElementById('sfcvt');if(tt)tt.textContent='Success! '+strikes+' bump'+(strikes===1?'':'s')+', +'+coins+' coins.';return}
    if(strikes>=3){end=true;s.fail++;const tt=document.getElementById('sfcvt');if(tt)tt.textContent='Beeeeep! The patient is fine, but the toy stays in. Try another patient.';return}}
   g.font='28px serif';g.fillText(held?'🧸':'',hx,hy+14);g.fillText('🧤',hx,hy);
   g.font='12px sans-serif';g.textAlign='left';g.fillStyle='#0b6e63';g.fillText('Bumps '+strikes+'/3'+(held?'':'   Grabbing '+Math.min(100,Math.round(grab*2.5))+'%'),8,330);
   requestAnimationFrame(f)})()};
 PAN[id]={ico:'🩺',title:'Operating Theatre',hud:()=>`🩺 THEATRE · ${S().pts} patients · ${S().saved} saved`,mini:()=>`🩺 ${S().pts} waiting`,
  body:()=>{const s=S();return `<p class="sfp">Every 12 SP a patient arrives (max 5). Operate: your hands wobble more the longer you take, so be quick and gentle.</p>${bar(s.sp,12)}<p class="sfp">Patients <b>${s.pts}</b> · Saved ${s.saved} · Failed ${s.fail}</p><button data-sf="sgplay" class="sfb" ${s.pts<1?'disabled':''}>🩺 Operate</button>`},
  act:a=>{if(SM[a])SM[a]()}};
 /* view layer */
 const V=window.FDVIEW;
 V[id]={s:'#fdview .lt{position:absolute;inset:0;background:radial-gradient(ellipse 50% 40% at 50% 0,#ffffffaa,transparent 70%)}#fdview .em{position:absolute;right:16px;bottom:3px;width:190px;height:38px;overflow:hidden;background:#06201d;border:3px solid #9fded5;border-radius:6px}#fdview .em svg{position:absolute;left:0;top:0;width:200%;height:100%}#fdview .em b{position:absolute;right:6px;top:2px;font:800 12px ui-monospace,monospace;color:#7dffd9}#fdview .tr{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);display:flex;gap:10px;background:#d4efe9;border:3px solid #9fded5;border-radius:8px;padding:2px 12px;font-size:20px}.card,.tile{background-image:linear-gradient(#0fa89618 0 10px,transparent 10px)!important}',
  a:'#fdview .em svg{animation:vwecg 2.4s linear infinite}@keyframes vwecg{to{transform:translateX(-50%)}}',
  h:'<i class="lt"></i><div class="em"><svg viewBox="0 0 800 40" preserveAspectRatio="none"><polyline fill="none" stroke="#7dffd9" stroke-width="2" points="0,22 120,22 135,22 150,4 165,38 180,22 400,22 520,22 535,22 550,4 565,38 580,22 800,22"/></svg><b>♥ 72</b></div><div class="tr"><span>🩺</span><span>💉</span><span>🧤</span><span>🔬</span></div>',
  u:e=>{const b=e.querySelector('.em b');if(b)b.textContent='♥ '+(68+new Date().getSeconds()%7)}};
 try{window.FDCSS=(window.FDCSS||'');const sc=fdScope('#fdview{position:fixed;inset:0;z-index:30;pointer-events:none;overflow:hidden}#fdview *{pointer-events:none}'+V[id].s,id)+'@media(prefers-reduced-motion:no-preference){'+V[id].a+'}';window.FDCSS+=sc;const st=document.getElementById('fdcss');if(st)st.textContent=window.FDCSS}catch(e){}
 try{if(window.FDK&&FDK[id])FDK[id].hud=()=>{try{return PAN[id].hud()}catch(e){return ''}}}catch(e){}
})();

