/* ======= MYTHIC (original): Memory Garden. Every lab you study in grows its own plant; the more time in a lab, the taller it grows and the sooner it blooms ======= */
(function(){
 const X=window.SFX,PAN=X.PAN;const {ST,onSP,bar}=window.sfLib;const K=window.MYK;
 const id='memgarden',S=()=>ST(id,{rain:0}),FULL=3600;
 const labs=()=>(typeof META!=='undefined'?META:[]);
 const gro=l=>{const f=K.fp();return f!=null?f:Math.min(1,((M.tsec&&M.tsec[l.id])||0)/FULL)};
 let fly=null;
 const draw=(c,W,H,t)=>{const s=S(),L=labs(),d=new Date(),hr=d.getHours()+d.getMinutes()/60,night=hr<6.5||hr>19.5;
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,night?'#0b1630':'#bfe3f0');g.addColorStop(1,night?'#1a2e3a':'#e8f6e0');c.fillStyle=g;c.fillRect(0,0,W,H);
  if(night){c.fillStyle='#fff';for(let i=0;i<70;i++){c.globalAlpha=.3+.5*Math.sin(t+i)**2;c.fillRect((i*91.7)%W,(i*47.3)%(H*.5),1.4,1.4)}c.globalAlpha=1}
  else{const sg=c.createRadialGradient(W*.8,H*.15,5,W*.8,H*.15,H*.3);sg.addColorStop(0,'rgba(255,245,190,.9)');sg.addColorStop(1,'rgba(255,245,190,0)');c.fillStyle=sg;c.fillRect(0,0,W,H)}
  const gy=H*.82;c.fillStyle=night?'#122418':'#4a8a4a';c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=12)c.lineTo(x,gy-Math.sin(x*.01)*H*.025);c.lineTo(W,H);c.fill();c.fillStyle=night?'#2a1c14':'#6b4a2d';c.fillRect(0,gy+H*.06,W,H);
  const n=Math.max(1,L.length);L.forEach((l,i)=>{const x=W*(i+.5)/n,gr=gro(l),h=H*(.06+gr*.5),sway=Math.sin(t*.8+i)*h*.04;
   c.strokeStyle=night?'#2e6a3c':'#2f7d3a';c.lineWidth=3+gr*3;c.beginPath();c.moveTo(x,gy+H*.03);c.quadraticCurveTo(x+sway,gy-h*.5,x+sway*2,gy-h);c.stroke();
   for(let k=1;k<=Math.floor(2+gr*4);k++){const yy=gy-h*k/(3+gr*4),dir=k%2?1:-1;c.fillStyle=night?'#2e6a3c':'#3f9a4a';c.beginPath();c.ellipse(x+dir*(10+gr*6)+sway*k*.3,yy,10+gr*8,4+gr*2,dir*-.5,0,7);c.fill()}
   const fx=x+sway*2,fy=gy-h;if(gr>.55){const open=Math.min(1,(gr-.55)/.45),pr=8+open*16;c.fillStyle=`hsl(${(i*47)%360},80%,${night?55:62}%)`;for(let k=0;k<6;k++){const a=k*1.047+t*.1;c.beginPath();c.arc(fx+Math.cos(a)*pr*.7,fy+Math.sin(a)*pr*.7,pr*.5,0,7);c.fill()}c.fillStyle='#ffd23f';c.beginPath();c.arc(fx,fy,pr*.35,0,7);c.fill();c.font=Math.round(14+open*8)+'px serif';c.textAlign='center';c.fillStyle='#fff';c.fillText(l.icon||'',fx,fy-pr*1.2)}else{c.fillStyle='#7fd07a';c.beginPath();c.arc(fx,fy,6+gr*8,0,7);c.fill()}});
  /* rain on every point, fireflies at night */
  if(s.rain>0){s.rain--;c.strokeStyle='#bfe0ffaa';c.lineWidth=1.3;for(let i=0;i<50;i++){const x=Math.random()*W,y=Math.random()*H*.8;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+12);c.stroke()}}
  if(night){c.globalCompositeOperation='lighter';for(let i=0;i<22;i++){const x=(i*173.3+Math.sin(t*.4+i)*40)%W,y=H*.45+Math.sin(t*.7+i*2)*H*.18+(i%5)*H*.05,a=.4+.5*Math.sin(t*2+i);const gr=c.createRadialGradient(x,y,0,x,y,12);gr.addColorStop(0,`rgba(220,255,140,${a})`);gr.addColorStop(1,'rgba(220,255,140,0)');c.fillStyle=gr;c.fillRect(x-12,y-12,24,24)}c.globalCompositeOperation='source-over'}
  c.fillStyle='#0003';c.fillRect(0,0,W,H)};
 onSP(id,()=>{S().rain=Math.min(90,S().rain+25)});
 const V=window.FDVIEW,bloom=()=>labs().filter(l=>gro(l)>.55).length;
 V[id]={s:'#fdview{z-index:-1!important}#fdview .scn{position:absolute;inset:0;width:100%;height:100%}',a:'',h:'<canvas class="scn" width="880" height="500"></canvas>',u:K.scene(id,draw,30,{name:'Memory Garden',snd:'water',done:()=>labs().length>0&&labs().every(l=>gro(l)>=1),title:'The garden is in full bloom',sub:'Every lab, fully grown',col:'#ffd23f',lines:['Every plant is fully grown.']})};
 PAN[id]={ico:'🌱',title:'Garden Journal',hud:()=>`🌱 ${bloom()}/${labs().length} blooming`,mini:()=>`🌱 ${bloom()}`,
  body:()=>`<p class="sfp"><b>${bloom()}/${labs().length}</b> blooming</p>`,act:()=>{}};
 const esc=X.esc2;
 K.wire(id,V[id],(c,I)=>{const cv=document.createElement('canvas');cv.width=900;cv.height=500;draw(cv.getContext('2d'),900,500,3);c.drawImage(cv,0,0);c.fillStyle='#10281ddd';c.fillRect(34,300,832,166);c.strokeStyle='#ffd23f';c.lineWidth=3;c.strokeRect(34,300,832,166);c.textAlign='left';c.fillStyle='#f4ffe8';c.font='900 46px Georgia,serif';c.fillText(K.cut(c,String(I.title),760),60,360);c.fillStyle='#ffd23f';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText(bloom()+'/'+labs().length+' PLANTS BLOOMING',60,402);c.fillStyle='#cfeebc';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',60,440)},{name:'Gardener Card',tag:'Memory Garden',ico:'🌱'});
})();
