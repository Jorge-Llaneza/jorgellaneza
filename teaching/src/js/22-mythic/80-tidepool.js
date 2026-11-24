/* ======= MYTHIC (original): Tidepool Library. A deep-sea reading room: a bioluminescent jellyfish for every 30 SP, bubbles on every point, a whale glides past on level-ups ======= */
(function(){
 const X=window.SFX,PAN=X.PAN;const {ST,onSP,bar}=window.sfLib;const K=window.MYK;
 const id='tidepool',S=()=>ST(id,{bub:0,lv:0,whale:0}),PER=30,MAXJ=40;
 const jel=()=>{const f=K.fp();return f!=null?Math.min(MAXJ,1+Math.floor(f*MAXJ)):Math.min(MAXJ,1+Math.floor((M.sp||0)/PER))};
 const J=(()=>{const r=K.rng(21),a=[];for(let i=0;i<MAXJ;i++)a.push({x:r(),y:.1+r()*.65,s:10+r()*18,h:160+r()*150,ph:r()*6.28,sp:.4+r()*.6});return a})();
 const P=(()=>{const r=K.rng(2),a=[];for(let i=0;i<90;i++)a.push([r(),r(),.5+r()*1.5,.02+r()*.05]);return a})();
 let bb=[];
 const draw=(c,W,H,t)=>{const s=S(),n=jel();
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#04323f');g.addColorStop(.55,'#04182b');g.addColorStop(1,'#020813');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.globalCompositeOperation='lighter';for(let k=0;k<5;k++){const x=W*(.1+k*.2)+Math.sin(t*.2+k)*40,gr=c.createLinearGradient(x,0,x+120,H*.8);gr.addColorStop(0,'rgba(120,255,230,.10)');gr.addColorStop(1,'rgba(120,255,230,0)');c.fillStyle=gr;c.beginPath();c.moveTo(x-20,0);c.lineTo(x+40,0);c.lineTo(x+200,H*.8);c.lineTo(x+60,H*.8);c.fill()}c.globalCompositeOperation='source-over';
  c.fillStyle='#bff';P.forEach(p=>{c.globalAlpha=.25;c.fillRect(p[0]*W,((p[1]+t*p[3]*.3)%1)*H,p[2],p[2])});c.globalAlpha=1;
  /* the library: shelves on the sea floor */
  c.fillStyle='#02070f';c.fillRect(0,H*.86,W,H*.14);for(let i=0;i<14;i++){const x=i*W/14+8;c.fillStyle=`hsl(${(i*47)%360},35%,${16+i%3*4}%)`;c.fillRect(x,H*.86-H*(.04+(i*7%5)*.012),W/14-18,H*.05+(i*7%5)*.012)}
  /* jellyfish */
  c.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const o=J[i],x=(o.x+Math.sin(t*.25*o.sp+o.ph)*.04)*W,y=(o.y+Math.sin(t*.5*o.sp+o.ph)*.03)*H,pul=1+.12*Math.sin(t*2*o.sp+o.ph),sz=o.s*pul;const gr=c.createRadialGradient(x,y,1,x,y,sz*2.6);gr.addColorStop(0,`hsla(${o.h},100%,70%,.5)`);gr.addColorStop(1,`hsla(${o.h},100%,60%,0)`);c.fillStyle=gr;c.fillRect(x-sz*3,y-sz*3,sz*6,sz*6);c.fillStyle=`hsla(${o.h},100%,75%,.55)`;c.beginPath();c.arc(x,y,sz,Math.PI,0);c.fill();c.strokeStyle=`hsla(${o.h},100%,75%,.4)`;c.lineWidth=1.3;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(x+k*sz*.35,y);for(let m=1;m<=5;m++)c.lineTo(x+k*sz*.35+Math.sin(t*2+m+k+o.ph)*sz*.18,y+m*sz*.4);c.stroke()}}c.globalCompositeOperation='source-over';
  /* bubbles */
  if(s.bub>0){s.bub--;for(let k=0;k<5;k++)bb.push({x:W*(.1+Math.random()*.8),y:H*.88,v:.8+Math.random()*1.6,r:2+Math.random()*5,l:0})}
  bb=bb.filter(b=>{b.y-=b.v;b.l++;c.strokeStyle='#cffcff99';c.lineWidth=1.2;c.beginPath();c.arc(b.x+Math.sin(b.l/12)*6,b.y,b.r,0,7);c.stroke();return b.y>-10});
  /* a whale, on level-up */
  if(s.whale>0){const p=1-s.whale/600;s.whale--;const x=-300+p*(W+600),y=H*.3+Math.sin(p*6)*20;c.fillStyle='#0b2a40';c.beginPath();c.ellipse(x,y,170,50,0,0,7);c.fill();c.beginPath();c.moveTo(x-150,y);c.lineTo(x-230,y-50+Math.sin(t*3)*14);c.lineTo(x-220,y+10);c.fill();c.fillStyle='#8ff';c.globalAlpha=.5;c.beginPath();c.arc(x+110,y-8,4,0,7);c.fill();c.globalAlpha=1}
  c.fillStyle='#0004';c.fillRect(0,0,W,H)};
 onSP(id,()=>{const s=S();s.bub=Math.min(8,s.bub+2);const L=typeof lvlOf==='function'?lvlOf(M.sp):0;if(s.lv&&L>s.lv)s.whale=600;s.lv=L});
 const V=window.FDVIEW,run=K.scene(id,draw,30,{name:'Tidepool Library',snd:'deep',done:()=>jel()>=MAXJ,title:'The deep is full of light',sub:'Forty jellyfish',col:'#5ff0d8',lines:['The deep is full of light.']});
 V[id]={s:'#fdview{z-index:-1!important}#fdview .scn{position:absolute;inset:0;width:100%;height:100%}',a:'',h:'<canvas class="scn" width="880" height="500"></canvas>',u:run};
 PAN[id]={ico:'🪼',title:'Tide Log',hud:()=>`🪼 ${jel()} jellyfish`,mini:()=>`🪼 ${jel()}`,
  body:()=>`<p class="sfp"><b>${jel()}/${MAXJ}</b> jellyfish</p>${bar(M.sp%PER,PER)}`,act:()=>{}};
 K.wire(id,V[id],(c,I)=>{const cv=document.createElement('canvas');cv.width=900;cv.height=500;draw(cv.getContext('2d'),900,500,3);c.drawImage(cv,0,0);c.fillStyle='#04182bdd';c.fillRect(34,300,832,166);c.strokeStyle='#5ff0d8';c.lineWidth=3;c.strokeRect(34,300,832,166);c.textAlign='left';c.fillStyle='#e0fffa';c.font='900 46px Georgia,serif';c.fillText(K.cut(c,String(I.title),760),60,360);c.fillStyle='#5ff0d8';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText(jel()+' JELLYFISH IN THE DEEP',60,402);c.fillStyle='#a5f5e8';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',60,440)},{name:'Deep Reader Card',tag:'Tidepool',ico:'🪼'});
})();
