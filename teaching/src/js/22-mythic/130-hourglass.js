/* ======= MYTHIC (original): Sand Hourglass. A giant hourglass over a desert dusk: sand runs as you earn SP and it turns over every 100 SP ======= */
(function(){
 const X=window.SFX,PAN=X.PAN;const {ST,onSP,bar}=window.sfLib;const K=window.MYK;
 const id='hourglass',S=()=>ST(id,{flip:0}),PER=100,GOAL=20;
 const turns=()=>Math.floor((M.sp||0)/PER),ph=()=>{const f=K.fp();return f!=null?Math.min(.999,f):((M.sp||0)%PER)/PER};
 const ST3=(()=>{const r=K.rng(14),a=[];for(let i=0;i<100;i++)a.push([r(),r()*.55,.5+r()*1.3,r()*6.28]);return a})();
 const draw=(c,W,H,t)=>{const s=S(),p=ph(),cx=W/2,cy=H*.5,gw=H*.22,gh=H*.4;
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a1038');g.addColorStop(.6,'#7a3a5a');g.addColorStop(1,'#e8a05a');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.fillStyle='#fff';ST3.forEach(b=>{c.globalAlpha=(.2+.5*Math.sin(t+b[3])**2)*(1-b[1]*1.2);c.fillRect(b[0]*W,b[1]*H,b[2],b[2])});c.globalAlpha=1;
  c.fillStyle='#2a1230';c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=10)c.lineTo(x,H*.82-Math.sin(x*.006+1)*H*.05-Math.sin(x*.017)*H*.015);c.lineTo(W,H);c.fill();
  /* flip animation: rotates 180 degrees over ~1.6s after every 100 SP */
  let ang=0;if(s.flip>0){s.flip=Math.max(0,s.flip-1/30/1.6);ang=(1-s.flip)*Math.PI}
  c.save();c.translate(cx,cy);c.rotate(ang);
  const top=1-p,bot=p;
  /* glass outline path */
  const path=()=>{c.beginPath();c.moveTo(-gw,-gh);c.lineTo(gw,-gh);c.lineTo(gw*.08,0);c.lineTo(gw,gh);c.lineTo(-gw,gh);c.lineTo(-gw*.08,0);c.closePath()};
  c.save();path();c.clip();
  c.fillStyle='#f0c070';
  /* top sand: a triangle that shrinks */
  const ty=-gh+(gh*(1-top)),tw=gw*(1-(1-top)*.92);c.beginPath();c.moveTo(-tw,ty);c.lineTo(tw,ty);c.lineTo(gw*.08,0);c.lineTo(-gw*.08,0);c.fill();
  /* bottom sand: a growing mound */
  const bh=gh*bot*.9;c.beginPath();c.moveTo(-gw,gh);c.lineTo(gw,gh);c.lineTo(gw*.1,gh-bh);c.lineTo(-gw*.1,gh-bh);c.closePath();c.fill();
  /* falling stream */
  c.strokeStyle='#f6d894';c.lineWidth=3;c.setLineDash([3,5]);c.lineDashOffset=-t*60;c.beginPath();c.moveTo(0,0);c.lineTo(0,gh-bh);c.stroke();c.setLineDash([]);
  c.restore();
  c.strokeStyle='#e8f4ffaa';c.lineWidth=5;path();c.stroke();const gl=c.createLinearGradient(-gw,0,gw,0);gl.addColorStop(0,'rgba(255,255,255,.18)');gl.addColorStop(.3,'rgba(255,255,255,0)');c.fillStyle=gl;path();c.fill();
  c.fillStyle='#6a3a1e';c.fillRect(-gw*1.15,-gh-18,gw*2.3,18);c.fillRect(-gw*1.15,gh,gw*2.3,18);
  c.restore();
  /* ring of turned glasses */
  const tn=Math.min(GOAL,turns());for(let i=0;i<GOAL;i++){const a=i/GOAL*6.2832-1.5708,x=cx+Math.cos(a)*H*.5,y=cy+Math.sin(a)*H*.5;c.globalAlpha=i<tn?1:.2;c.fillStyle=i<tn?'#ffd78a':'#ffffff';c.beginPath();c.arc(x,y,i<tn?5:3,0,7);c.fill()}c.globalAlpha=1;
  c.fillStyle='#0003';c.fillRect(0,0,W,H)};
 onSP(id,()=>{const s=S(),t=Math.floor((M.sp||0)/PER);if(s.t!=null&&t>s.t)s.flip=1;s.t=t});
 const V=window.FDVIEW;
 V[id]={s:'#fdview{z-index:-1!important}#fdview .scn{position:absolute;inset:0;width:100%;height:100%}',a:'',h:'<canvas class="scn" width="880" height="500"></canvas>',u:K.scene(id,draw,30,{name:'Sand Hourglass',snd:'sand',done:()=>turns()>=GOAL,title:'Twenty turns',sub:'The sand remembers',col:'#f0c070',lines:['Twenty turns of the glass.']})};
 PAN[id]={ico:'⏳',title:'Sand Log',hud:()=>`⏳ ${turns()} turns`,mini:()=>`⏳ ${turns()}`,
  body:()=>`<p class="sfp"><b>${turns()}</b> turns</p>${bar(Math.floor(ph()*PER),PER)}`,act:()=>{}};
 K.wire(id,V[id],(c,I)=>{const cv=document.createElement('canvas');cv.width=900;cv.height=500;draw(cv.getContext('2d'),900,500,3);c.drawImage(cv,0,0);c.fillStyle='#1a1038dd';c.fillRect(34,300,832,166);c.strokeStyle='#f0c070';c.lineWidth=3;c.strokeRect(34,300,832,166);c.textAlign='left';c.fillStyle='#fff3dc';c.font='900 46px Georgia,serif';c.fillText(K.cut(c,String(I.title),760),60,360);c.fillStyle='#f0c070';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText(turns()+' TURNS OF THE GLASS',60,402);c.fillStyle='#ffe0a8';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',60,440)},{name:'Sandkeeper Card',tag:'Sand Hourglass',ico:'⏳'});
})();
