/* ======= MYTHIC (original): Clockwork Atelier. A brass workshop of meshing gears: one more gear is installed for every 50 SP, the clock face tells the real time ======= */
(function(){
 const X=window.SFX,PAN=X.PAN;const {ST,onSP,bar}=window.sfLib;const K=window.MYK;
 const id='clockwork',S=()=>ST(id,{puff:0}),MAXG=24,PER=50;
 const gears=()=>{const f=K.fp();return f!=null?Math.min(MAXG,3+Math.floor(f*21.99)):Math.min(MAXG,3+Math.floor((M.sp||0)/PER))};
 /* three rows of meshing gears: same size, alternate direction, teeth offset by half a tooth */
 const G=(()=>{const a=[];for(let i=0;i<MAXG;i++)a.push({row:i%3,col:Math.floor(i/3),tn:48,h:28+(i*13)%22});return a})();
 let sm=[];
 const gear=(c,g,x,y,rr,rot)=>{const tn=g.tn;c.save();c.translate(x,y);c.rotate(rot);c.beginPath();for(let k=0;k<tn*2;k++){const a=k/(tn*2)*6.2832,r=k%2?rr*.88:rr;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();const gr=c.createRadialGradient(-rr*.3,-rr*.3,rr*.1,0,0,rr);gr.addColorStop(0,`hsl(${g.h},72%,62%)`);gr.addColorStop(1,`hsl(${g.h},60%,26%)`);c.fillStyle=gr;c.fill();c.strokeStyle='#2a1708';c.lineWidth=1.5;c.stroke();c.fillStyle='#1b1008';for(let k=0;k<6;k++){const a=k*1.0472;c.beginPath();c.arc(Math.cos(a)*rr*.5,Math.sin(a)*rr*.5,rr*.13,0,7);c.fill()}c.beginPath();c.arc(0,0,rr*.17,0,7);c.fillStyle='#e8c37a';c.fill();c.restore()};
 const draw=(c,W,H,t)=>{const n=gears(),s=S();
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1d1209');g.addColorStop(1,'#0c0704');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.strokeStyle='#ffffff08';for(let y=0;y<H;y+=26){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}
  const rr=H*.085,sp=rr*1.97,spin=t*.35;for(let i=0;i<n;i++){const o=G[i],x=W/2+(o.col-3.5+(o.row%2?.5:0))*sp,y=H*(.2+o.row*.3),d=o.col%2?-1:1;gear(c,o,x,y,rr,d*spin+(o.col%2?Math.PI/o.tn:0)+(o.row%2?.0:0))}
  /* the real clock */
  const cx=W*.86,cy=H*.4,cr=H*.12,d=new Date(),sec=d.getSeconds()+d.getMilliseconds()/1000,mn=d.getMinutes()+sec/60,hr=d.getHours()%12+mn/60;
  c.fillStyle='#f4e7c4';c.strokeStyle='#8a5a1c';c.lineWidth=6;c.beginPath();c.arc(cx,cy,cr,0,7);c.fill();c.stroke();c.strokeStyle='#3a2410';c.lineWidth=2;for(let k=0;k<12;k++){const a=k*.5236;c.beginPath();c.moveTo(cx+Math.sin(a)*cr*.82,cy-Math.cos(a)*cr*.82);c.lineTo(cx+Math.sin(a)*cr*.94,cy-Math.cos(a)*cr*.94);c.stroke()}
  const hand=(a,l,w,col)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.sin(a)*cr*l,cy-Math.cos(a)*cr*l);c.stroke()};
  hand(hr/12*6.2832,.5,5,'#2a1708');hand(mn/60*6.2832,.75,3.5,'#2a1708');hand(sec/60*6.2832,.85,1.5,'#b3261e');
  /* pendulum */
  const px=cx,py=cy+cr+6,pa=Math.sin(t*3.14)*.35,pl=H*.3;c.strokeStyle='#d9a441';c.lineWidth=3;c.beginPath();c.moveTo(px,py);c.lineTo(px+Math.sin(pa)*pl,py+Math.cos(pa)*pl);c.stroke();c.fillStyle='#e8c37a';c.beginPath();c.arc(px+Math.sin(pa)*pl,py+Math.cos(pa)*pl,16,0,7);c.fill();c.strokeStyle='#8a5a1c';c.stroke();
  /* steam */
  if(s.puff>0){s.puff--;for(let k=0;k<4;k++)sm.push({x:W*(.1+Math.random()*.8),y:H*.96,v:.6+Math.random()*1.2,r:10+Math.random()*14,l:0})}
  sm=sm.filter(p=>{p.y-=p.v;p.r+=.35;p.l++;c.fillStyle=`rgba(255,244,220,${Math.max(0,.2-p.l/500)})`;c.beginPath();c.arc(p.x+Math.sin(p.l/18)*8,p.y,p.r,0,7);c.fill();return p.l<90});
  c.fillStyle='#0004';c.fillRect(0,0,W,H)};
 onSP(id,()=>{S().puff=Math.min(6,S().puff+2)});
 const V=window.FDVIEW,run=K.scene(id,draw,30,{name:'Clockwork Atelier',snd:'tick',done:()=>gears()>=MAXG,title:'The machine is complete',sub:'Twenty-four gears in perfect time',col:'#d9a441',lines:['Twenty-four gears, one rhythm.']});
 V[id]={s:'#fdview{z-index:-1!important}#fdview .scn{position:absolute;inset:0;width:100%;height:100%}',a:'',h:'<canvas class="scn" width="880" height="500"></canvas>',u:run};
 PAN[id]={ico:'⚙️',title:'Workshop Ledger',hud:()=>`⚙️ ${gears()}/${MAXG} gears`,mini:()=>`⚙️ ${gears()}`,
  body:()=>`<p class="sfp"><b>${gears()}/${MAXG}</b> gears</p>${bar(M.sp%PER,PER)}`,act:()=>{}};
 K.wire(id,V[id],(c,I)=>{const cv=document.createElement('canvas');cv.width=900;cv.height=500;draw(cv.getContext('2d'),900,500,3);c.drawImage(cv,0,0);c.fillStyle='#1d1209dd';c.fillRect(34,300,832,166);c.strokeStyle='#d9a441';c.lineWidth=3;c.strokeRect(34,300,832,166);c.textAlign='left';c.fillStyle='#f4e7c4';c.font='900 46px Georgia,serif';c.fillText(K.cut(c,String(I.title),760),60,360);c.fillStyle='#d9a441';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText(gears()+' GEARS TURNING',60,402);c.fillStyle='#e8c37a';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',60,440)},{name:'Artificer Card',tag:'Clockwork',ico:'⚙️'});
})();
