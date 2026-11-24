/* ======= MYTHIC (original): Observatory Train. A night train rolling through four landscapes: a carriage for every 100 SP, a new region every 3 levels ======= */
(function(){
 const X=window.SFX,PAN=X.PAN;const {ST,onSP,bar}=window.sfLib;const K=window.MYK;
 const id='obstrain',S=()=>ST(id,{boost:0}),PER=100,MAXC=12;
 const cars=()=>{const f=K.fp();return f!=null?Math.min(MAXC,2+Math.floor(f*10)):Math.min(MAXC,1+Math.floor((M.sp||0)/PER))};
 const REG=[['Pine Forest','#0b1d2e','#1d3a4a','#0d2a22','#14402f'],['Desert Dunes','#1a1030','#4a2a4a','#3a2430','#5a3438'],['Snow Peaks','#0a1430','#2a3f6a','#1c2c4c','#3a557f'],['Sea Cliffs','#06182a','#16405a','#0a2a3c','#14506a']];
 const reg=()=>{const f=K.fp();return f!=null?Math.min(3,Math.floor(f*4)):Math.floor((typeof lvlOf==='function'?lvlOf(M.sp):0)/3)%4};
 const ST2=(()=>{const r=K.rng(5),a=[];for(let i=0;i<110;i++)a.push([r(),r()*.6,.5+r()*1.2,r()*6.28]);return a})();
 let sm=[];
 const ridge=(c,W,H,t,sp,base,amp,f,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=8){const xx=x+t*sp;c.lineTo(x,H*base-Math.abs(Math.sin(xx*f))*H*amp-Math.sin(xx*f*2.7)*H*amp*.25)}c.lineTo(W,H);c.fill()};
 const draw=(c,W,H,t)=>{const s=S(),R=REG[reg()],n=cars(),v=1+s.boost/40;if(s.boost>0)s.boost--;
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,R[1]);g.addColorStop(1,R[2]);c.fillStyle=g;c.fillRect(0,0,W,H);
  c.fillStyle='#fff';ST2.forEach(b=>{c.globalAlpha=.3+.5*Math.sin(t*1.2+b[3])**2;c.fillRect(b[0]*W,b[1]*H,b[2],b[2])});c.globalAlpha=1;
  const mx=W*.82,my=H*.2;c.fillStyle='#f4efd6';c.beginPath();c.arc(mx,my,H*.05,0,7);c.fill();
  ridge(c,W,H,t*v,18,.62,.12,.004,R[3]);ridge(c,W,H,t*v,45,.74,.1,.007,R[4]);
  /* track */
  const ty=H*.8;c.fillStyle='#07080f';c.fillRect(0,ty,W,H-ty);c.fillStyle='#2a2f3d';c.fillRect(0,ty+4,W,4);for(let x=-((t*v*220)%40);x<W;x+=40)c.fillRect(x,ty+8,22,5);
  /* train: engine then carriages */
  const cw=Math.min(110,W/(n+2)),ch=H*.1;let x0=W-cw*1.2;
  const eng=x=>{c.fillStyle='#8a2b2b';c.fillRect(x,ty-ch*1.1,cw*.9,ch*1.1);c.fillStyle='#222';c.fillRect(x+cw*.55,ty-ch*1.5,cw*.28,ch*.5);c.fillStyle='#ffe29a';c.beginPath();c.arc(x+cw*.95,ty-ch*.6,5,0,7);c.fill();wh(x+cw*.2,ty);wh(x+cw*.65,ty)};
  const wh=(x,y)=>{c.fillStyle='#111';c.beginPath();c.arc(x,y-5,9,0,7);c.fill();c.strokeStyle='#999';c.lineWidth=2;c.beginPath();const a=t*v*8;c.moveTo(x+Math.cos(a)*8,y-5+Math.sin(a)*8);c.lineTo(x-Math.cos(a)*8,y-5-Math.sin(a)*8);c.stroke()};
  eng(x0);for(let i=0;i<n-1;i++){const x=x0-(i+1)*(cw*1.02);c.fillStyle=i%2?'#2a4a6a':'#3a5a7a';c.fillRect(x,ty-ch,cw*.98,ch);for(let k=0;k<3;k++){c.fillStyle=`rgba(255,226,150,${.85+.1*Math.sin(t*3+i+k)})`;c.fillRect(x+cw*.1+k*cw*.3,ty-ch*.8,cw*.2,ch*.45)}wh(x+cw*.2,ty);wh(x+cw*.75,ty)}
  /* smoke */
  if(Math.random()<.25)sm.push({x:x0+cw*.68,y:ty-ch*1.6,r:5,l:0});sm=sm.filter(p=>{p.x-=2*v;p.y-=1;p.r+=.25;p.l++;c.fillStyle=`rgba(230,235,250,${Math.max(0,.3-p.l/200)})`;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill();return p.l<60});
  c.fillStyle='#0004';c.fillRect(0,0,W,H)};
 onSP(id,()=>{S().boost=60});
 const V=window.FDVIEW;
 V[id]={s:'#fdview{z-index:-1!important}#fdview .scn{position:absolute;inset:0;width:100%;height:100%}',a:'',h:'<canvas class="scn" width="880" height="500"></canvas>',u:K.scene(id,draw,30,{name:'Observatory Train',snd:'train',done:()=>cars()>=MAXC,title:'The line is complete',sub:'Twelve carriages',col:'#ffe29a',lines:['Twelve carriages. Full train.']})};
 PAN[id]={ico:'🚂',title:'Timetable',hud:()=>`🚂 ${cars()} cars · ${REG[reg()][0]}`,mini:()=>`🚂 ${cars()}`,
  body:()=>`<p class="sfp"><b>${cars()}/${MAXC}</b> carriages · ${REG[reg()][0]}</p>${bar(M.sp%PER,PER)}`,act:()=>{}};
 K.wire(id,V[id],(c,I)=>{const cv=document.createElement('canvas');cv.width=900;cv.height=500;draw(cv.getContext('2d'),900,500,3);c.drawImage(cv,0,0);c.fillStyle='#0a1430dd';c.fillRect(34,300,832,166);c.strokeStyle='#ffe29a';c.lineWidth=3;c.strokeRect(34,300,832,166);c.textAlign='left';c.fillStyle='#fff';c.font='900 46px Georgia,serif';c.fillText(K.cut(c,String(I.title),760),60,360);c.fillStyle='#ffe29a';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText(cars()+' CARRIAGES · '+REG[reg()][0].toUpperCase(),60,402);c.fillStyle='#d8e6ff';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',60,440)},{name:'Conductor Card',tag:'Observatory Train',ico:'🚂'});
})();
