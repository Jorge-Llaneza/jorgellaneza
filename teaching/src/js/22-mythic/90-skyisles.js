/* ======= MYTHIC (original): Sky Isles. Floating islands under a sky that follows the real time of day: a new island with a tiny home for every 100 SP ======= */
(function(){
 const X=window.SFX,PAN=X.PAN;const {ST,onSP,bar}=window.sfLib;const K=window.MYK;
 const id='skyisles',S=()=>ST(id,{gust:0}),PER=100,MAXI=16;
 const isl=()=>{const f=K.fp();return f!=null?Math.min(MAXI,1+Math.floor(f*MAXI)):Math.min(MAXI,1+Math.floor((M.sp||0)/PER))};
 const I=(()=>{const r=K.rng(33),a=[];for(let i=0;i<MAXI;i++)a.push({x:.08+(i%5)*.2+r()*.06,y:.2+Math.floor(i/5)*.22+r()*.06,w:50+r()*50,k:Math.floor(r()*3),ph:r()*6.28});return a})();
 const CL=(()=>{const r=K.rng(4),a=[];for(let i=0;i<9;i++)a.push([r(),.05+r()*.5,40+r()*80,.004+r()*.01]);return a})();
 let bd=[];
 const lerp=(a,b,t)=>a+(b-a)*t,mix=(A,B,t)=>A.map((v,i)=>Math.round(lerp(v,B[i],t)));
 const draw=(c,W,H,t)=>{const s=S(),n=isl(),d=new Date(),hr=d.getHours()+d.getMinutes()/60;
  /* sky colours by hour: night, dawn, day, dusk */
  const K4=[[0,[8,10,38],[20,22,70]],[6,[255,150,110],[90,120,200]],[12,[110,190,255],[200,235,255]],[18,[255,120,90],[70,60,140]],[24,[8,10,38],[20,22,70]]];let a=K4[0],b=K4[1];for(let i=0;i<4;i++)if(hr>=K4[i][0]&&hr<=K4[i+1][0]){a=K4[i];b=K4[i+1]}const f=(hr-a[0])/(b[0]-a[0]),top=mix(a[1],b[1],f),bot=mix(a[2],b[2],f);
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,`rgb(${top})`);g.addColorStop(1,`rgb(${bot})`);c.fillStyle=g;c.fillRect(0,0,W,H);
  const night=hr<5.5||hr>19.5;if(night){c.fillStyle='#fff';for(let i=0;i<80;i++){c.globalAlpha=.3+.5*Math.sin(t+i)**2;c.fillRect((i*97.3)%W,(i*53.1)%(H*.6),1.5,1.5)}c.globalAlpha=1}
  const sa=(hr-6)/12*Math.PI,sx=W*.5-Math.cos(sa)*W*.42,sy=H*.85-Math.sin(sa)*H*.7;if(hr>5&&hr<19){const sg=c.createRadialGradient(sx,sy,5,sx,sy,120);sg.addColorStop(0,'rgba(255,240,180,.9)');sg.addColorStop(1,'rgba(255,240,180,0)');c.fillStyle=sg;c.fillRect(sx-120,sy-120,240,240)}
  c.fillStyle=night?'rgba(160,170,220,.12)':'rgba(255,255,255,.55)';CL.forEach(o=>{const x=((o[0]+t*o[3])%1.3-.15)*W,y=o[1]*H;for(let k=0;k<4;k++){c.beginPath();c.arc(x+k*o[2]*.35,y+Math.sin(k)*8,o[2]*.3,0,7);c.fill()}});
  for(let i=0;i<n;i++){const o=I[i],x=o.x*W,y=o.y*H+Math.sin(t*.6+o.ph)*7;
   c.fillStyle='#5a4636';c.beginPath();c.moveTo(x-o.w,y);c.lineTo(x+o.w,y);c.lineTo(x+o.w*.3,y+o.w*.9);c.lineTo(x-o.w*.2,y+o.w*.6);c.fill();
   c.fillStyle=night?'#2e6b4a':'#5fbf6a';c.beginPath();c.ellipse(x,y,o.w,o.w*.18,0,0,7);c.fill();
   if(o.k===0){c.fillStyle='#e8d9b8';c.fillRect(x-12,y-24,24,20);c.fillStyle='#c0503a';c.beginPath();c.moveTo(x-16,y-24);c.lineTo(x,y-40);c.lineTo(x+16,y-24);c.fill();c.fillStyle=night?'#ffd770':'#6a8fb0';c.fillRect(x-4,y-18,7,8)}
   else if(o.k===1){c.fillStyle='#4a3020';c.fillRect(x-3,y-30,6,30);c.fillStyle=night?'#1f5a3a':'#3fa85a';c.beginPath();c.arc(x,y-38,18,0,7);c.fill()}
   else{c.fillStyle='#f4efe0';c.fillRect(x-10,y-34,20,30);c.fillStyle='#c0503a';c.fillRect(x-10,y-38,20,5);c.fillStyle=night?'#ffd770':'#e8d9b8';c.beginPath();c.arc(x+o.w*.45,y-6,6,0,7);c.fill()}}
  if(s.gust>0){s.gust--;if(s.gust%2===0)bd.push({x:-20,y:H*(.1+Math.random()*.4),v:2+Math.random()*2,l:0})}
  c.strokeStyle=night?'#cde':'#223';c.lineWidth=2;bd=bd.filter(b=>{b.x+=b.v;b.l++;const w=Math.sin(b.l/3)*5;c.beginPath();c.moveTo(b.x-8,b.y+w);c.quadraticCurveTo(b.x,b.y-4,b.x+8,b.y+w);c.stroke();return b.x<W+20})};
 onSP(id,()=>{S().gust=Math.min(30,S().gust+8)});
 const V=window.FDVIEW,run=K.scene(id,draw,30,{name:'Sky Isles',snd:'chime',done:()=>isl()>=MAXI,title:'The sky is settled',sub:'Sixteen islands',col:'#ffe08a',lines:['Sixteen islands, all settled.']});
 V[id]={s:'#fdview{z-index:-1!important}#fdview .scn{position:absolute;inset:0;width:100%;height:100%}',a:'',h:'<canvas class="scn" width="880" height="500"></canvas>',u:run};
 PAN[id]={ico:'☁️',title:'Archipelago',hud:()=>`☁️ ${isl()}/${MAXI} isles`,mini:()=>`☁️ ${isl()}`,
  body:()=>`<p class="sfp"><b>${isl()}/${MAXI}</b> islands</p>${bar(M.sp%PER,PER)}`,act:()=>{}};
 K.wire(id,V[id],(c,Ic)=>{const cv=document.createElement('canvas');cv.width=900;cv.height=500;draw(cv.getContext('2d'),900,500,3);c.drawImage(cv,0,0);c.fillStyle='#10163acc';c.fillRect(34,300,832,166);c.strokeStyle='#ffe08a';c.lineWidth=3;c.strokeRect(34,300,832,166);c.textAlign='left';c.fillStyle='#fff';c.font='900 46px Georgia,serif';c.fillText(K.cut(c,String(Ic.title),760),60,360);c.fillStyle='#ffe08a';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText(isl()+' ISLANDS IN THE SKY',60,402);c.fillStyle='#dfe8ff';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText('LV '+Ic.lv+'   '+Ic.sp+' SP   '+Ic.streak+' DAY STREAK',60,440)},{name:'Sky Warden Card',tag:'Sky Isles',ico:'☁️'});
})();
