/* ======= MYTHIC (original): Paper Lantern River. Every Study Point releases a lantern that keeps drifting over a night village; level-ups start a festival ======= */
(function(){
 const X=window.SFX,PAN=X.PAN;const {ST,onSP}=window.sfLib;const K=window.MYK;
 const id='lanterns',S=()=>ST(id,{n:0,lv:0,fest:0}),SHOW=70,cnt=()=>{const f=K.fp();return f!=null?Math.floor(f*SHOW):Math.max(S().n,Math.floor((M.sp||0)/10))};
 const L=(()=>{const r=K.rng(9),a=[];for(let i=0;i<SHOW;i++)a.push({x:r(),ph:r(),sp:.006+r()*.01,sw:r()*6.28,h:r()*40});return a})();
 const BG=(()=>{const r=K.rng(3),a=[];for(let i=0;i<110;i++)a.push([r(),r()*.55,.5+r()*1.2,r()*6.28]);return a})();
 const lant=(c,x,y,sz,h,t,a)=>{c.globalAlpha=a;const g=c.createRadialGradient(x,y,1,x,y,sz*3.2);g.addColorStop(0,`hsla(${h+14},100%,70%,.55)`);g.addColorStop(1,`hsla(${h},100%,60%,0)`);c.fillStyle=g;c.fillRect(x-sz*3.2,y-sz*3.2,sz*6.4,sz*6.4);c.fillStyle=`hsl(${h+10},95%,${58+6*Math.sin(t*3+x)}%)`;c.beginPath();c.roundRect?c.roundRect(x-sz*.6,y-sz*.8,sz*1.2,sz*1.6,sz*.3):c.rect(x-sz*.6,y-sz*.8,sz*1.2,sz*1.6);c.fill();c.fillStyle='#4a1408';c.fillRect(x-sz*.45,y-sz*.85,sz*.9,sz*.12);c.fillRect(x-sz*.45,y+sz*.73,sz*.9,sz*.12);c.globalAlpha=1};
 let fw=[];
 const draw=(c,W,H,t)=>{const s=S(),n=Math.min(cnt(),SHOW),wl=H*.7;
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#070820');g.addColorStop(.6,'#1a1238');g.addColorStop(1,'#2a1536');c.fillStyle=g;c.fillRect(0,0,W,H);
  BG.forEach(b=>{c.globalAlpha=.3+.4*Math.sin(t*1.1+b[3])**2;c.fillStyle='#fff';c.fillRect(b[0]*W,b[1]*H,b[2],b[2])});c.globalAlpha=1;
  /* village silhouette with lit windows */
  c.fillStyle='#07040f';c.beginPath();c.moveTo(0,wl);for(let x=0;x<=W;x+=W/22){const hh=H*(.06+((Math.sin(x*.07)+1)*.5)*.08);c.lineTo(x,wl-hh);c.lineTo(x+W/44,wl-hh-H*.03);c.lineTo(x+W/22-2,wl-hh)}c.lineTo(W,wl);c.fill();
  c.fillStyle='#ffc86a';for(let i=0;i<26;i++){if(Math.sin(i*7.3+Math.floor(t/6))>-.4)c.fillRect((i*37.7%W),wl-H*(.02+(i*13%7)*.012),4,5)}
  /* river and reflections */
  const rv=c.createLinearGradient(0,wl,0,H);rv.addColorStop(0,'#2b1b4a');rv.addColorStop(1,'#0a0716');c.fillStyle=rv;c.fillRect(0,wl,W,H-wl);
  /* lanterns: persistent, one per Study Point (up to 70 drawn) */
  for(let i=0;i<n;i++){const o=L[i],cyc=(t*o.sp+o.ph)%1,y=H*.8-cyc*H*.75,x=(o.x+Math.sin(t*.4+o.sw)*.02)*W,a=Math.min(1,cyc*6)*Math.min(1,(1-cyc)*3)*.95;lant(c,x,y,7+(1-cyc)*3,o.h,t,a);if(y<wl&&y>wl-H*.02){}c.globalAlpha=a*.25;c.fillStyle='#ffb04a';c.fillRect(x-3,wl+(wl-y)*.25,6,10);c.globalAlpha=1}
  /* boats of light on the water */
  c.strokeStyle='#ffc86a22';for(let i=0;i<7;i++){const y=wl+8+i*((H-wl)/8),o=Math.sin(t*.7+i)*20;c.beginPath();c.moveTo(W*.1+o,y);c.lineTo(W*.9+o,y);c.stroke()}
  /* festival bursts */
  if(s.fest>0&&Math.random()<.3){s.fest--;const x=W*(.15+Math.random()*.7),y=H*(.1+Math.random()*.3),h=Math.random()*360;for(let k=0;k<36;k++){const a=k/36*6.28,v=1.5+Math.random()*2.5;fw.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:0,h})}}
  c.globalCompositeOperation='lighter';fw=fw.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.03;p.vx*=.985;p.l++;c.fillStyle=`hsla(${p.h},100%,65%,${Math.max(0,1-p.l/70)})`;c.fillRect(p.x,p.y,2.5,2.5);return p.l<70});c.globalCompositeOperation='source-over'};
 onSP(id,d=>{const s=S();s.n+=Math.max(1,Math.round(d||1));const L2=typeof lvlOf==='function'?lvlOf(M.sp):0;if(s.lv&&L2>s.lv)s.fest=40;s.lv=L2});
 const V=window.FDVIEW,run=K.scene(id,draw,30,{name:'Paper Lantern River',snd:'water',done:()=>cnt()>=SHOW,title:'The river is alight',sub:'Seventy lanterns and counting',col:'#ffb04a',lines:['The river is full of light.']});
 V[id]={s:'#fdview{z-index:-1!important}#fdview .scn{position:absolute;inset:0;width:100%;height:100%}',a:'',h:'<canvas class="scn" width="880" height="500"></canvas>',u:run};
 PAN[id]={ico:'🏮',title:'Lantern Ledger',hud:()=>`🏮 ${cnt()} lanterns`,mini:()=>`🏮 ${cnt()}`,
  body:()=>`<p class="sfp"><b>${cnt()}</b> lanterns</p>`,act:()=>{}};
 K.wire(id,V[id],(c,I)=>{const cv=document.createElement('canvas');cv.width=900;cv.height=500;draw(cv.getContext('2d'),900,500,3);c.drawImage(cv,0,0);c.fillStyle='#070820dd';c.fillRect(34,300,832,166);c.strokeStyle='#ffb04a';c.lineWidth=3;c.strokeRect(34,300,832,166);c.textAlign='left';c.fillStyle='#fff1d6';c.font='900 46px Georgia,serif';c.fillText(K.cut(c,String(I.title),760),60,360);c.fillStyle='#ffb04a';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText(cnt()+' LANTERNS RELEASED',60,402);c.fillStyle='#ffd9a0';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',60,440)},{name:'Lantern Keeper Card',tag:'Lanterns',ico:'🏮'});
})();
