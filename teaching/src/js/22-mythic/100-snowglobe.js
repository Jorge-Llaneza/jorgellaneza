/* ======= MYTHIC (original): Snow Globe. A glass globe on a winter table: a new house for every 60 SP, snow that thickens with your streak, a shake with every point ======= */
(function(){
 const X=window.SFX,PAN=X.PAN;const {ST,onSP,bar}=window.sfLib;const K=window.MYK;
 const id='snowglobe',S=()=>ST(id,{shake:0}),PER=60,MAXH=14;
 const hs=()=>{const f=K.fp();return f!=null?Math.min(MAXH,1+Math.floor(f*MAXH)):Math.min(MAXH,1+Math.floor((M.sp||0)/PER))};
 const strk=()=>Math.min(14,(typeof streakNow==='function'?streakNow():0)||0);
 const HS=(()=>{const r=K.rng(61),a=[];for(let i=0;i<MAXH;i++)a.push({x:-.8+(i%7)*.27+r()*.06,row:i<7?0:1,w:.1+r()*.05,h:.1+r()*.08,c:Math.floor(r()*4),k:r()>.5});return a})();
 const FL=(()=>{const r=K.rng(8),a=[];for(let i=0;i<260;i++)a.push({x:r(),y:r(),z:.4+r()*1.2,ph:r()*6.28});return a})();
 const COL=['#b5483a','#3f6fa0','#c9a24a','#5a8a5a'];
 const draw=(c,W,H,t)=>{const s=S(),n=hs(),R=H*.4,cx=W/2,cy=H*.5;
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0c1a2c');g.addColorStop(1,'#1c2b40');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.fillStyle='#3b2a20';c.fillRect(0,H*.88,W,H*.12);c.fillStyle='#5a4030';c.fillRect(0,H*.88,W,4);
  /* base of the globe */
  c.fillStyle='#4a2f1d';c.beginPath();c.ellipse(cx,cy+R*.98,R*.78,R*.16,0,0,7);c.fill();c.fillStyle='#6a4a2d';c.fillRect(cx-R*.74,cy+R*.82,R*1.48,R*.16);
  c.save();c.beginPath();c.arc(cx,cy,R,0,7);c.clip();
  const ig=c.createRadialGradient(cx,cy-R*.3,R*.1,cx,cy,R);ig.addColorStop(0,'#27456e');ig.addColorStop(1,'#0e1d36');c.fillStyle=ig;c.fillRect(cx-R,cy-R,R*2,R*2);
  /* hill and town */
  c.fillStyle='#e9f1fa';c.beginPath();c.ellipse(cx,cy+R*.78,R*1.1,R*.38,0,0,7);c.fill();
  const night=0;HS.slice(0,n).sort((a,b)=>a.row-b.row).forEach((o,i)=>{const x=cx+o.x*R*1.1,y=cy+R*(.55+o.row*.14),w=o.w*R*1.5,h=o.h*R*1.5;c.fillStyle=COL[o.c];c.fillRect(x-w/2,y-h,w,h);c.fillStyle='#f4f8ff';c.beginPath();c.moveTo(x-w*.62,y-h);c.lineTo(x,y-h-w*.55);c.lineTo(x+w*.62,y-h);c.fill();c.fillStyle=`rgba(255,215,120,${.75+.2*Math.sin(t*2+i)})`;c.fillRect(x-w*.15,y-h*.6,w*.3,h*.3);if(o.k){c.fillStyle='#2a5a3a';c.beginPath();c.moveTo(x+w*.7,y);c.lineTo(x+w*.95,y-h*.9);c.lineTo(x+w*1.2,y);c.fill()}});
  if(n>=MAXH){c.fillStyle='#fff';c.beginPath();c.arc(cx,cy+R*.5,R*.07,0,7);c.arc(cx,cy+R*.4,R*.05,0,7);c.fill()}
  /* snow: thicker with your streak, whirled up by every point */
  const cnt=70+strk()*13;c.fillStyle='#fff';const sh=s.shake>0?s.shake/60:0;if(s.shake>0)s.shake--;
  for(let i=0;i<cnt;i++){const f=FL[i];const fy=((f.y+t*.03*f.z)%1),turb=sh*Math.sin(t*9+f.ph)*R*.5,x=cx+(f.x-.5)*R*2+Math.sin(t*.6+f.ph)*10+turb,y=cy-R+fy*R*2-sh*R*.4*Math.sin(f.ph);c.globalAlpha=.5+.4*Math.sin(f.ph+t);c.beginPath();c.arc(x,y,f.z*1.6,0,7);c.fill()}c.globalAlpha=1;
  c.restore();
  /* glass */
  c.strokeStyle='#cfe8ff66';c.lineWidth=4;c.beginPath();c.arc(cx,cy,R,0,7);c.stroke();const gl=c.createLinearGradient(cx-R,cy-R,cx,cy);gl.addColorStop(0,'rgba(255,255,255,.35)');gl.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gl;c.beginPath();c.ellipse(cx-R*.45,cy-R*.5,R*.2,R*.35,-.6,0,7);c.fill();
  c.fillStyle='#0004';c.fillRect(0,0,W,H)};
 onSP(id,()=>{S().shake=60});
 const V=window.FDVIEW;
 V[id]={s:'#fdview{z-index:-1!important}#fdview .scn{position:absolute;inset:0;width:100%;height:100%}',a:'',h:'<canvas class="scn" width="880" height="500"></canvas>',u:K.scene(id,draw,30,{name:'Snow Globe',snd:'wind',done:()=>hs()>=MAXH,title:'The globe is full',sub:'Fourteen houses, one winter',col:'#cfe8ff',lines:['Fourteen houses. The town is complete.']})};
 PAN[id]={ico:'🔮',title:'Globe Notes',hud:()=>`❄️ ${hs()}/${MAXH} houses`,mini:()=>`❄️ ${hs()}`,
  body:()=>`<p class="sfp"><b>${hs()}/${MAXH}</b> houses</p>${bar(M.sp%PER,PER)}`,act:()=>{}};
 K.wire(id,V[id],(c,I)=>{const cv=document.createElement('canvas');cv.width=900;cv.height=500;draw(cv.getContext('2d'),900,500,3);c.drawImage(cv,0,0);c.fillStyle='#0c1a2cdd';c.fillRect(34,300,832,166);c.strokeStyle='#cfe8ff';c.lineWidth=3;c.strokeRect(34,300,832,166);c.textAlign='left';c.fillStyle='#fff';c.font='900 46px Georgia,serif';c.fillText(K.cut(c,String(I.title),760),60,360);c.fillStyle='#9fd0ff';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText(hs()+' HOUSES IN THE GLOBE',60,402);c.fillStyle='#cfe8ff';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',60,440)},{name:'Globe Keeper Card',tag:'Snow Globe',ico:'🔮'});
})();
