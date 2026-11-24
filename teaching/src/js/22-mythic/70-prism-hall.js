/* ======= MYTHIC (original): Prism Hall. A stained-glass rose window fills with colour as you study; the sun beams follow the real time of day ======= */
(function(){
 const X=window.SFX,PAN=X.PAN;const {ST,bar}=window.sfLib;const K=window.MYK;
 const id='prism',PER=40,RINGS=[[8,.12,.24],[16,.24,.36],[24,.36,.5]],TOT=48;
 const panes=()=>{const f=K.fp();return f!=null?Math.floor(f*TOT):Math.min(TOT,Math.floor((M.sp||0)/PER))};
 const draw=(c,W,H,t)=>{const n=panes(),d=new Date(),hr=d.getHours()+d.getMinutes()/60,day=hr>=6&&hr<=19,sunT=Math.max(0,Math.min(1,(hr-6)/13)),cx=W*.5,cy=H*.4,R=H*.62;
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,day?'#241a3e':'#0a0818');g.addColorStop(1,'#07050f');c.fillStyle=g;c.fillRect(0,0,W,H);
  /* gothic arch */
  c.fillStyle='#120d22';c.fillRect(0,0,W,H);c.beginPath();c.arc(cx,cy,R*.54,0,7);c.fillStyle='#050310';c.fill();
  /* rose window panes */
  let i=0;RINGS.forEach((rg,ri)=>{for(let k=0;k<rg[0];k++,i++){const a0=k/rg[0]*6.2832+ri*.1,a1=(k+1)/rg[0]*6.2832+ri*.1,lit=i<n,h=(i*37+ri*50)%360;c.beginPath();c.arc(cx,cy,R*rg[2]*.98,a0+.012,a1-.012);c.arc(cx,cy,R*rg[1]*1.02,a1-.012,a0+.012,true);c.closePath();if(lit){const pulse=.55+.15*Math.sin(t*1.2+i);c.fillStyle=`hsla(${h},80%,${day?50+10*Math.sin(t+i):42}%,${pulse+.3})`}else c.fillStyle='#14102a';c.fill();c.strokeStyle='#2b2146';c.lineWidth=3;c.stroke()}});
  c.beginPath();c.arc(cx,cy,R*.12,0,7);c.fillStyle=n>=TOT?'#ffe9a8':'#1a1432';c.fill();c.strokeStyle='#2b2146';c.stroke();
  /* sun beams from the window, angled by time of day */
  if(day&&n>0){const ang=.35+sunT*2.4,al=Math.min(.5,n/TOT*.5+.12);c.globalCompositeOperation='lighter';for(let k=0;k<6;k++){const h=(k*60+t*8)%360,a=ang+(k-2.5)*.045,len=H*1.2;const gr=c.createLinearGradient(cx,cy,cx+Math.cos(a)*len,cy+Math.sin(a)*len);gr.addColorStop(0,`hsla(${h},90%,60%,${al})`);gr.addColorStop(1,`hsla(${h},90%,60%,0)`);c.fillStyle=gr;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a-.03)*len,cy+Math.sin(a-.03)*len);c.lineTo(cx+Math.cos(a+.03)*len,cy+Math.sin(a+.03)*len);c.fill()}c.globalCompositeOperation='source-over'}
  /* dust motes drifting through the light */
  const r=K.rng(7);c.fillStyle='#fff';for(let k=0;k<70;k++){const x=((r()*W+t*(6+r()*8))%W),y=((r()*H-t*(3+r()*5))%H+H)%H;c.globalAlpha=(.15+.3*Math.sin(t+k)**2)*(day?1:.4);c.fillRect(x,y,1.6,1.6)}c.globalAlpha=1;
  /* night: candle glow along the floor */
  if(!day){c.globalCompositeOperation='lighter';for(let k=0;k<7;k++){const x=W*(.08+k*.14),f=.8+.2*Math.sin(t*6+k*2);const gr=c.createRadialGradient(x,H*.95,2,x,H*.95,H*.25);gr.addColorStop(0,`rgba(255,180,90,${.5*f})`);gr.addColorStop(1,'rgba(255,180,90,0)');c.fillStyle=gr;c.fillRect(x-H*.25,H*.7,H*.5,H*.3)}c.globalCompositeOperation='source-over'}
  c.fillStyle='#0a0714';c.fillRect(0,H*.93,W,H*.07);c.fillStyle='#0005';c.fillRect(0,0,W,H)};
 const V=window.FDVIEW,run=K.scene(id,draw,24,{name:'Prism Hall',snd:'bell',done:()=>panes()>=TOT,title:'The window is whole',sub:'Forty-eight panes of light',col:'#c58bff',lines:['The window is whole.']});
 V[id]={s:'#fdview{z-index:-1!important}#fdview .scn{position:absolute;inset:0;width:100%;height:100%}',a:'',h:'<canvas class="scn" width="880" height="500"></canvas>',u:run};
 PAN[id]={ico:'🔮',title:'Window Ledger',hud:()=>`🔮 ${panes()}/${TOT} panes`,mini:()=>`🔮 ${panes()}`,
  body:()=>`<p class="sfp"><b>${panes()}/${TOT}</b> panes</p>${bar(M.sp%PER,PER)}`,act:()=>{}};
 K.wire(id,V[id],(c,I)=>{const cv=document.createElement('canvas');cv.width=900;cv.height=500;draw(cv.getContext('2d'),900,500,3);c.drawImage(cv,0,0);c.fillStyle='#0a0818dd';c.fillRect(34,300,832,166);c.strokeStyle='#c58bff';c.lineWidth=3;c.strokeRect(34,300,832,166);c.textAlign='left';c.fillStyle='#f3e9ff';c.font='900 46px Georgia,serif';c.fillText(K.cut(c,String(I.title),760),60,360);c.fillStyle='#c58bff';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText(panes()+'/'+TOT+' PANES OF GLASS',60,402);c.fillStyle='#e3c9ff';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',60,440)},{name:'Glazier Card',tag:'Prism',ico:'🔮'});
})();
