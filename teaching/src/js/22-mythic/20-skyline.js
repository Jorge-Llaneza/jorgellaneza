/* ======= MYTHIC: City Builder · Skyline. Build a city with study points: housing, power, happiness, events, landmarks ======= */
(function(){
 const X=window.SFX,PAN=X.PAN,tick=X.tick,esc=X.esc2;
 const {ST,pick,pay,bar,onSP,splash}=window.sfLib;const K=window.MYK;const now=()=>Date.now();
 const id='skyline',S=()=>ST(id,{fund:60,b:{house:1},proj:null,ev:null,nxt:0,done:0,land:{},rk:0,built:0,hist:0});
 const B={house:['House','🏠',40,3,4,-1,'+4 residents'],apt:['Apartments','🏢',160,8,16,-3,'+16 residents'],shop:['Shop','🏪',120,6,0,-2,'+6% funds per SP'],park:['Park','🌳',90,4,0,0,'+8 happiness'],plant:['Power plant','⚡',220,9,0,14,'+14 power'],school:['School','🏫',300,12,0,-2,'+4% funds, +5 happiness'],fire:['Fire station','🚒',260,10,0,-1,'stops fires, +3 happiness'],factory:['Factory','🏭',350,14,0,-4,'+15% funds, −8 happiness']};
 const LM={tower:['Broadcast Tower','🗼',2000,40,100,'+25% funds'],stadium:['Stadium','🏟️',3500,60,150,'+20 happiness'],port:['Spaceport','🚀',8000,100,300,'the city reaches for the stars']};
 const RK=[['Hamlet',0],['Town',40],['City',120],['Metropolis',300],['Megacity',700]];
 const n=(s,k)=>s.b[k]||0;
 const pop=s=>n(s,'house')*4+n(s,'apt')*16;
 const pw=s=>{let p=4+n(s,'plant')*14;Object.keys(B).forEach(k=>{if(B[k][5]<0)p+=B[k][5]*n(s,k)});return p};
 const hap=s=>Math.max(0,Math.min(100,Math.round(50+n(s,'park')*8+n(s,'school')*5+n(s,'fire')*3-n(s,'factory')*8+(s.land.stadium?20:0)-pop(s)/12)));
 const rank=s=>{const p=pop(s);let r=0;RK.forEach((k,i)=>{if(p>=k[1])r=i});return r};
 const blackout=s=>pw(s)<0,unrest=s=>hap(s)<30;
 const mult=s=>(1+n(s,'shop')*.06+n(s,'factory')*.15+n(s,'school')*.04+(s.land.tower?.25:0))*(blackout(s)?.5:1)*(unrest(s)?.7:1);
 const perSP=s=>Math.max(1,Math.round((10+pop(s)*.1)*mult(s)));
 const fin=s=>{const p=s.proj,s2=s;if(p.land){s.land[p.k]=1;const L=LM[p.k];pay(L[4],'🏙️ '+L[0]+' built');K.banner(L[0].toUpperCase(),'A landmark for your city','#ffd166',3200);
   if(p.k==='port')setTimeout(()=>K.story('Spaceport',['The first rocket rises over the skyline.','Every window in the city lights up to watch it go.','You built this, one study session at a time.'],null,'#3fb6ff'),3300)}
  else{s.b[p.k]=(s.b[p.k]||0)+1;pay(Math.round(B[p.k][3]*.8),'🏙️ Built: '+B[p.k][0])}
  s.built++;s.proj=null;const r0=s.rk,r1=rank(s);if(r1>r0){s.rk=r1;K.banner('CITY LEVEL UP',RK[r1][0],'#3fb6ff',3000);if(r1>=2)setTimeout(()=>K.story(RK[r1][0],['Your city has grown into a '+RK[r1][0]+'.','New streets, new lights, new neighbours.','Keep building.'],null,'#3fb6ff'),3100)}};
 onSP(id,d=>{const s=S();s.fund+=perSP(s)*d;const p=s.proj;if(p){p.got+=d;if(p.got>=p.need)fin(s)}const ev=s.ev;if(ev&&ev.t==='fire'){ev.got+=d;if(ev.got>=ev.need){s.ev=null;s.nxt=now()+(12+Math.random()*6)*60000;splash('FIRE OUT','The brigade thanks you','#3fb6ff','🚒')}}});
 tick.push(()=>{if(!X.act(id))return;const s=S();document.documentElement.dataset.skbo=blackout(s)?'1':'';if(!s.nxt)s.nxt=now()+(10+Math.random()*6)*60000;
  const ev=s.ev;if(ev&&now()>ev.end){s.ev=null;s.nxt=now()+(12+Math.random()*6)*60000;if(ev.t==='fire'){const k=n(s,'house')>0?'house':Object.keys(s.b).find(x=>s.b[x]>0);if(k){s.b[k]--;try{toast('🔥 The fire destroyed a '+B[k][0])}catch(e){}}}return}
  if(!ev&&now()>s.nxt&&pop(s)>0){const t=pick(['fire','festival','grant']);
   if(t==='fire'){if(n(s,'fire')>0){s.nxt=now()+(12+Math.random()*6)*60000;try{toast('🚒 A fire broke out but the fire station handled it')}catch(e){}}else{s.ev={t,need:5,got:0,end:now()+4*60000};try{toast('🔥 Fire in the city! Earn 5 SP in 4 minutes')}catch(e){}}}
   else if(t==='festival'){s.fund+=300;s.nxt=now()+(12+Math.random()*6)*60000;try{toast('🎉 City festival! +300 funds')}catch(e){}}
   else{s.fund+=500;s.nxt=now()+(12+Math.random()*6)*60000;try{toast('💼 Government grant: +500 funds')}catch(e){}}}});
 const start=(s,k,land)=>{const o=land?LM[k]:B[k],c=o[2],sp=o[3];if(s.proj||s.fund<c||(land&&(s.land[k]||pop(s)<(k==='tower'?100:k==='stadium'?150:300))))return;s.fund-=c;s.proj={k,need:sp,got:0,land:!!land}};
 PAN[id]={ico:'🏙️',title:'Skyline',hud:()=>{const s=S();return `🏙️ ${RK[rank(s)][0]} · pop ${pop(s)} · ${s.fund} ₡`+(blackout(s)?' · BLACKOUT':'')},mini:()=>{const s=S();return `🏙️ ${s.fund}₡ pop ${pop(s)}`},
  body:()=>{const s=S(),p=s.proj,ev=s.ev;let h=`<p class="sfp"><b>${RK[rank(s)][0]}</b> · 👥 ${pop(s)} · ⚡ ${pw(s)>=0?'+':''}${pw(s)} · 😊 ${hap(s)}% · <b>${s.fund} ₡</b></p>${blackout(s)?'<p class="sfp" style="color:var(--bad)">⚠ Blackout: build a power plant</p>':''}${unrest(s)?'<p class="sfp" style="color:var(--bad)">⚠ Unrest: build parks</p>':''}`;
   if(ev)h+=`<p class="sfp" style="color:var(--bad)">🔥 Fire: ${ev.need-ev.got} SP · ${K.mmss(ev.end-now())}</p>`;
   if(p){const o=p.land?LM[p.k]:B[p.k];h+=`<p class="sfp"><b>${o[1]} ${esc(o[0])}</b> · ${p.need-p.got} SP</p>${bar(p.got,p.need)}`}
   else{h+=`<div class="sfl">${Object.entries(B).map(([k,o])=>`<button data-sf="b" data-k="${k}" title="${esc(o[6])}${o[5]?' · power '+(o[5]>0?'+':'')+o[5]:''}" ${s.fund<o[2]?'disabled':''}>${o[1]} ${o[0]} <small>${o[2]} ₡ · ${n(s,k)}</small></button>`).join('')}</div><div class="sfl">${Object.entries(LM).map(([k,o])=>{const need=k==='tower'?100:k==='stadium'?150:300;return `<button data-sf="l" data-k="${k}" title="${esc(o[5])} · needs pop ${need}" ${s.land[k]?'class="on" disabled':(s.fund<o[2]||pop(s)<need?'disabled':'')}>${o[1]} ${o[0]} <small>${s.land[k]?'✓':o[2]+' ₡'}</small></button>`}).join('')}</div>`}
   return h},
  act:(a,t)=>{const s=S();if(a==='b')start(s,t.dataset.k,false);else if(a==='l')start(s,t.dataset.k,true)}};
 /* skyline picture: drawn from the real city, lit by the real clock */
 const draw=(cv,s)=>{const c=cv.getContext('2d'),W=cv.width,H=cv.height,hr=new Date().getHours()+new Date().getMinutes()/60,night=hr<6.5||hr>19.5,dusk=(hr>=17&&hr<=19.5)||(hr>=5&&hr<6.5);
  c.clearRect(0,0,W,H);const g=c.createLinearGradient(0,0,0,H);if(night){g.addColorStop(0,'#05081800');g.addColorStop(1,'#0b1a3a99')}else if(dusk){g.addColorStop(0,'#ff8a5b00');g.addColorStop(1,'#ff8a5b55')}else{g.addColorStop(0,'#8fd3ff00');g.addColorStop(1,'#8fd3ff44')}c.fillStyle=g;c.fillRect(0,0,W,H);
  if(night){c.fillStyle='#fff';for(let i=0;i<40;i++){const x=(i*97)%W,y=(i*53)%(H*.55);c.globalAlpha=.3+((i+Math.floor(Date.now()/1500))%4)*.15;c.fillRect(x,y,2,2)}c.globalAlpha=1}
  const items=[];Object.keys(B).forEach(k=>{for(let i=0;i<Math.min(n(s,k),k==='house'?14:8);i++)items.push(k)});Object.keys(LM).forEach(k=>{if(s.land[k])items.push('L'+k)});
  const order=['L','factory','plant','apt','school','shop','fire','house','park'];items.sort((a,b)=>{const ia=a[0]==='L'?-1:order.indexOf(a),ib=b[0]==='L'?-1:order.indexOf(b);return(a[0]==='L'?0:1)-(b[0]==='L'?0:1)||ia-ib});
  const gw={house:22,apt:30,shop:28,park:24,plant:30,school:30,fire:26,factory:36,Ltower:30,Lstadium:60,Lport:44};let tw=items.reduce((a,k)=>a+(gw[k]||26)+4,0);const sc=Math.min(1,(W-30)/Math.max(1,tw));let x=15;const gy=H-8,T=Math.floor(Date.now()/2500);
  const win=(wx,wy,i,j)=>{const lit=night?((i*7+j*13+T)%5<3):((i+j)%9===0);c.fillStyle=lit?'#ffd166':(night?'#1d2b4d':'#9fb6d8');c.fillRect(wx,wy,3,4)};
  items.forEach((k,i)=>{const w=(gw[k]||26)*sc,xx=x;x+=((gw[k]||26)+4)*sc;const col=night?'#16233f':'#5a6f94',dk=night?'#0d1730':'#3f5176';
   const box=(h,cl)=>{c.fillStyle=cl||col;c.fillRect(xx,gy-h,w,h)};
   if(k==='house'){box(18);c.fillStyle='#c0583d';c.beginPath();c.moveTo(xx-2,gy-18);c.lineTo(xx+w/2,gy-30);c.lineTo(xx+w+2,gy-18);c.fill();win(xx+4,gy-12,i,0)}
   else if(k==='apt'){const h=58+(i%3)*12;box(h);for(let r=0;r<Math.floor(h/12);r++)for(let q=0;q<3;q++)win(xx+4+q*8,gy-h+5+r*12,i+r,q)}
   else if(k==='shop'){box(24);c.fillStyle='#3fb6ff';c.fillRect(xx,gy-24,w,5);win(xx+5,gy-14,i,1);win(xx+w-9,gy-14,i,2)}
   else if(k==='park'){c.fillStyle='#2f8f4e';for(let q=0;q<3;q++){c.beginPath();c.arc(xx+5+q*7,gy-14-(q%2)*4,6,0,7);c.fill();c.fillStyle='#6b4a2b';c.fillRect(xx+4+q*7,gy-10,2,10);c.fillStyle='#2f8f4e'}}
   else if(k==='plant'){box(26,dk);c.fillRect(xx+6,gy-50,7,26);c.fillStyle='#ffffff55';const sm=(Date.now()/60+i*20)%40;c.beginPath();c.arc(xx+9+sm/8,gy-52-sm,4+sm/10,0,7);c.fill()}
   else if(k==='school'){box(30);c.fillStyle='#e0b84a';c.fillRect(xx+w/2-3,gy-40,6,10);win(xx+5,gy-20,i,3);win(xx+w-9,gy-20,i,4)}
   else if(k==='fire'){box(24,'#b23a3a');c.fillStyle='#fff';c.fillRect(xx+6,gy-14,w-12,14)}
   else if(k==='factory'){box(24,dk);c.beginPath();c.moveTo(xx,gy-24);for(let q=0;q<3;q++){c.lineTo(xx+q*12+6,gy-34);c.lineTo(xx+q*12+12,gy-24)}c.fill();c.fillRect(xx+w-8,gy-52,6,30)}
   else if(k==='Ltower'){c.fillStyle=col;c.beginPath();c.moveTo(xx+2,gy);c.lineTo(xx+w/2,gy-120);c.lineTo(xx+w-2,gy);c.fill();c.fillStyle='#ff4d4d';c.globalAlpha=.5+.5*Math.sin(Date.now()/400);c.fillRect(xx+w/2-2,gy-126,4,6);c.globalAlpha=1}
   else if(k==='Lstadium'){c.fillStyle=col;c.beginPath();c.ellipse(xx+w/2,gy-12,w/2,12,0,0,7);c.fill();c.fillStyle='#2f8f4e';c.beginPath();c.ellipse(xx+w/2,gy-12,w/2-8,6,0,0,7);c.fill()}
   else if(k==='Lport'){c.fillStyle='#e8eefc';c.beginPath();c.moveTo(xx+w/2,gy-92);c.lineTo(xx+w/2+7,gy-50);c.lineTo(xx+w/2-7,gy-50);c.fill();c.fillRect(xx+w/2-7,gy-50,14,40);c.fillStyle='#ff6b6b';c.fillRect(xx+w/2-7,gy-34,14,5);c.fillStyle='#ffb347';c.beginPath();c.moveTo(xx+w/2-5,gy-10);c.lineTo(xx+w/2,gy-10+10+Math.random()*8);c.lineTo(xx+w/2+5,gy-10);c.fill()}});
  c.fillStyle=night?'#0a1226':'#445a80';c.fillRect(0,gy,W,8)};
 let sig='';const V=window.FDVIEW;
 V[id]={s:'#fdview .sk{position:absolute;left:0;bottom:0;width:100%;height:210px;opacity:.95}#fdview .tx{position:absolute;right:14px;bottom:60px;font:800 12px system-ui,sans-serif;color:#3fb6ff;letter-spacing:.14em;text-transform:uppercase;text-shadow:0 2px 0 #000a}html[data-skbo="1"] #fdview .sk{filter:brightness(.45) saturate(.6)}',
  a:'',h:'<canvas class="sk" width="1100" height="210"></canvas><div class="tx"></div>',
  u:e=>{const cv=e.querySelector('canvas.sk'),t=e.querySelector('.tx');if(!cv)return;const s=S();draw(cv,s);const txt=RK[rank(s)][0]+' · pop '+pop(s);if(t&&t.textContent!==txt)t.textContent=txt}};
 K.wire(id,V[id],(c,I)=>{const s=S();c.fillStyle='#0b1424';c.fillRect(0,0,900,500);const cv=document.createElement('canvas');cv.width=900;cv.height=210;draw(cv,s);c.drawImage(cv,0,290);
  c.strokeStyle='#3fb6ff';c.lineWidth=4;c.strokeRect(34,34,832,432);c.textAlign='left';c.fillStyle='#3fb6ff';c.font='800 22px system-ui,sans-serif';c.fillText('MAYOR OF '+RK[rank(s)][0].toUpperCase(),64,86);
  c.fillStyle='#eaf3ff';c.font='900 52px Impact,Arial Narrow,sans-serif';c.fillText(K.cut(c,String(I.title).toUpperCase(),760),64,150);
  c.fillStyle='#ffd166';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText('POP '+pop(s)+'  ·  '+s.fund+' FUNDS  ·  '+s.built+' BUILT',64,200);
  c.fillStyle='#eaf3ff';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',64,244)},{name:'Mayor Card',tag:'Skyline',ico:'🏙️'});
})();
