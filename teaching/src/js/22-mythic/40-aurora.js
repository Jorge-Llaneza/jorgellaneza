/* ======= MYTHIC (original): Aurora Observatory. A living northern sky: aurora that glows with your streak, the real moon, and a personal constellation that grows as you study ======= */
(function(){
 const X=window.SFX,PAN=X.PAN,esc=X.esc2;const {ST,onSP,bar}=window.sfLib;const K=window.MYK;
 const id='aurora',S=()=>ST(id,{shoot:0,seen:0});
 const NAMES=['The Lantern Bearer','The Quiet Fox','The Ink Whale','The Tower','The Reader','The Compass','The Night Owl','The Long Road'],PER=20,SPPER=25;
 const stars=()=>{const f=K.fp();return f!=null?Math.floor(f*NAMES.length*PER*.6):Math.min(NAMES.length*PER,Math.floor((M.sp||0)/SPPER))};
 /* fixed star positions for the 8 constellations (normalised 0..1), generated once from a seed */
 const CON=(()=>{const out=[];for(let ci=0;ci<NAMES.length;ci++){const r=K.rng(ci*977+11),cx=.1+(ci%4)*.23+r()*.05,cy=.1+Math.floor(ci/4)*.2+r()*.04,a=[];let x=cx,y=cy,ang=r()*6.28;for(let k=0;k<PER;k++){a.push([x,y]);ang+=(r()-.5)*2.1;const st=.022+r()*.03;x=Math.max(.04,Math.min(.96,x+Math.cos(ang)*st));y=Math.max(.05,Math.min(.52,y+Math.sin(ang)*st*1.4))}out.push(a)}return out})();
 const BG=(()=>{const r=K.rng(5),a=[];for(let i=0;i<170;i++)a.push([r(),r()*.7,.4+r()*1.4,r()*6.28]);return a})();
 const phase=()=>{const d=(Date.now()-947182440000)/864e5;return(d%29.530588)/29.530588};
 const PN=ph=>['New moon','Waxing crescent','First quarter','Waxing gibbous','Full moon','Waning gibbous','Last quarter','Waning crescent'][Math.round(ph*8)%8];
 let moon=null,mk='';
 const moonImg=()=>{const ph=phase(),k=Math.round(ph*100);if(moon&&mk===k)return moon;mk=k;const m=document.createElement('canvas');m.width=m.height=80;const c=m.getContext('2d'),f=(1-Math.cos(ph*2*Math.PI))/2,o=2*28*f*(ph<.5?-1:1)*-1;c.fillStyle='#f7f3df';c.beginPath();c.arc(40,40,28,0,7);c.fill();c.globalCompositeOperation='destination-out';c.beginPath();c.arc(40+(ph<.5?-1:1)*(28*2*(1-f)),40,28,0,7);c.fill();return moon=m};
 let sh=[];const R=Math.random;
 const draw=(c,W,H,t)=>{const s=S(),n=stars(),st=Math.min(14,(typeof streakNow==='function'?streakNow():0)||0),I=(K.fp()!=null?.3+K.fp()*.6:.38+Math.min(1,st/14)*.5)+.06*Math.sin(t*.7);
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#02050f');g.addColorStop(.6,'#081433');g.addColorStop(1,'#10304a');c.fillStyle=g;c.fillRect(0,0,W,H);
  BG.forEach(b=>{c.globalAlpha=.35+.45*Math.sin(t*1.3+b[3])**2;c.fillStyle='#fff';c.fillRect(b[0]*W,b[1]*H,b[2],b[2])});c.globalAlpha=1;
  c.globalCompositeOperation='lighter';
  [['#3dffb0',.0],['#33e0ff',.1],['#a678ff',.2]].forEach((rb,r)=>{const bY=H*(.34+rb[1]*.9),gr=c.createLinearGradient(0,-H*.34,0,0);gr.addColorStop(0,rb[0]+'00');gr.addColorStop(.7,rb[0]+'55');gr.addColorStop(1,rb[0]+'cc');c.fillStyle=gr;
   for(let x=0;x<W;x+=5){const ph=x*.009*(1+.3*r)+t*(.22+.09*r)+r*2,y=bY+Math.sin(ph)*H*.06+Math.sin(x*.0035+t*.11+r)*H*.05,h=H*(.26+.1*Math.sin(x*.012+t*.35+r));c.save();c.globalAlpha=Math.min(1,I*(.7+.3*Math.sin(x*.02+t*.5)));c.translate(x,y);c.scale(1,h/(H*.34));c.fillRect(0,-H*.34,5.5,H*.34);c.restore()}});
  c.globalCompositeOperation='source-over';
  /* the personal constellation */
  CON.forEach((a,ci)=>{const have=Math.max(0,Math.min(PER,n-ci*PER));if(!have)return;c.strokeStyle='#bfe9ffaa';c.lineWidth=1;c.beginPath();for(let k=0;k<have;k++){const x=a[k][0]*W,y=a[k][1]*H;k?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
   for(let k=0;k<have;k++){const x=a[k][0]*W,y=a[k][1]*H,last=ci*PER+k===n-1,tw=.7+.3*Math.sin(t*2+k+ci);c.fillStyle='#fff';c.globalAlpha=tw;c.beginPath();c.arc(x,y,last?3.2+Math.sin(t*5)*1.2:2.1,0,7);c.fill();if(last||k%5===0){c.globalAlpha=.25;c.beginPath();c.arc(x,y,9,0,7);c.fill()}c.globalAlpha=1}
   if(have>=PER){c.fillStyle='#bfe9ff99';c.font='11px Georgia,serif';c.fillText(NAMES[ci],a[0][0]*W-10,a[0][1]*H-12)}});
  /* the real moon */
  const mi=moonImg(),mx=W*.88,my=H*.14;const mg=c.createRadialGradient(mx,my,10,mx,my,70);mg.addColorStop(0,'#f7f3df55');mg.addColorStop(1,'#f7f3df00');c.fillStyle=mg;c.fillRect(mx-70,my-70,140,140);c.drawImage(mi,mx-40,my-40);
  /* shooting stars */
  if(s.shoot>0){s.shoot--;sh.push({x:R()*W*.6,y:R()*H*.2,v:9+R()*4,l:0})}else if(R()<.004)sh.push({x:R()*W*.7,y:R()*H*.25,v:8+R()*5,l:0});
  sh=sh.filter(o=>{o.x+=o.v;o.y+=o.v*.45;o.l++;const g2=c.createLinearGradient(o.x,o.y,o.x-60,o.y-27);g2.addColorStop(0,'#fff');g2.addColorStop(1,'#fff0');c.strokeStyle=g2;c.lineWidth=2;c.beginPath();c.moveTo(o.x,o.y);c.lineTo(o.x-60,o.y-27);c.stroke();return o.l<60&&o.x<W+80});
  /* mountains and a still lake */
  c.fillStyle='#050b18';c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=10)c.lineTo(x,H*.78-Math.abs(Math.sin(x*.004+1))*H*.16-Math.sin(x*.013)*H*.025);c.lineTo(W,H);c.fill();
  const lk=c.createLinearGradient(0,H*.9,0,H);lk.addColorStop(0,'#3dffb022');lk.addColorStop(1,'#0a1a2c');c.fillStyle=lk;c.fillRect(0,H*.9,W,H*.1);c.strokeStyle='#bfe9ff22';for(let i=0;i<6;i++){const y=H*.91+i*H*.015,o=Math.sin(t*.8+i)*14;c.beginPath();c.moveTo(W*.2+o,y);c.lineTo(W*.8+o,y);c.stroke()}};
 onSP(id,d=>{const s=S();s.shoot=Math.min(4,s.shoot+1)});
 const V=window.FDVIEW,run=K.scene(id,draw,30,{name:'Aurora Observatory',snd:'wind',done:()=>stars()>=NAMES.length*PER,title:'The sky is complete',sub:'All eight constellations shine',col:'#3dffb0',lines:['Eight constellations. Your sky is complete.']});
 V[id]={s:'#fdview{z-index:-1!important}#fdview .scn{position:absolute;inset:0;width:100%;height:100%}',a:'',h:'<canvas class="scn" width="880" height="500"></canvas>',u:run};
 PAN[id]={ico:'🌌',title:'Star Chart',hud:()=>`🌌 ${stars()} stars · ${PN(phase())}`,mini:()=>`🌌 ${stars()}★`,
  body:()=>`<p class="sfp"><b>${stars()}</b> stars · ${PN(phase())}</p>`,act:()=>{}};
 K.wire(id,V[id],(c,I)=>{const cv=document.createElement('canvas');cv.width=900;cv.height=500;draw(cv.getContext('2d'),900,500,3);c.drawImage(cv,0,0);c.fillStyle='#02050fcc';c.fillRect(34,300,832,166);c.strokeStyle='#3dffb0';c.lineWidth=3;c.strokeRect(34,300,832,166);c.textAlign='left';c.fillStyle='#e8f4ff';c.font='900 46px Georgia,serif';c.fillText(K.cut(c,String(I.title),760),60,360);c.fillStyle='#3dffb0';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText(stars()+' STARS · '+PN(phase()).toUpperCase(),60,402);c.fillStyle='#bfe9ff';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',60,440)},{name:'Observer Card',tag:'Aurora',ico:'🌌'});
})();
