/* ======= JUICE LAYER: instant feedback everywhere ======= */
const JX={m:(()=>{try{return localStorage.getItem('mp-juice')||'full'}catch(e){return 'full'}})(),last:null,combo:0,ct:0,lucky:0};
const jxRM=()=>{try{return matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){return false}};
const jxOn=()=>JX.m!=='off'&&!jxRM(),jxFull=()=>JX.m==='full'&&!jxRM();
const jxLabel=()=>({full:'Full',sub:'Subtle',off:'Off'})[JX.m];
function jxApplyMode(){document.documentElement.classList.toggle('jx-off',!jxOn());document.documentElement.classList.toggle('jx-sub',JX.m==='sub')}
function jxCycle(){JX.m=JX.m==='full'?'sub':JX.m==='sub'?'off':'full';try{localStorage.setItem('mp-juice',JX.m)}catch(e){}jxApplyMode();toast('✨ Effects: '+jxLabel())}
jxApplyMode();
function jxVib(p){try{if(jxFull()&&navigator.vibrate)navigator.vibrate(p)}catch(e){}}
function jxSnd(fs,type,vol,gap){try{if(!jxOn()||!sndOn||!audio())return;const t=AC.currentTime,g0=gap||.07;fs.forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*g0);g.gain.linearRampToValueAtTime(vol||.06,t+i*g0+.01);g.gain.exponentialRampToValueAtTime(.0001,t+i*g0+.2);o.connect(g);g.connect(master);o.start(t+i*g0);o.stop(t+i*g0+.25)})}catch(e){}}
function jxFloat(txt,cls){if(!jxOn())return;const c=$('chip'),r=c?c.getBoundingClientRect():{left:innerWidth-120,bottom:50,width:100};const e=document.createElement('div');e.className='jxf '+(cls||'');e.textContent=txt;e.style.left=Math.max(60,Math.min(innerWidth-60,r.left+r.width/2+(Math.random()*50-25)))+'px';e.style.top=(r.bottom+2)+'px';document.body.appendChild(e);setTimeout(()=>e.remove(),1400);if(c&&cls!=='neg'){c.classList.remove('jxbump');void c.offsetWidth;c.classList.add('jxbump')}}
function jxSplash(big,sub,col,emo){if(!jxOn())return;const o=document.createElement('div');o.id='jxsplash';o.style.setProperty('--c',col||'#ffd166');o.innerHTML=`<div><small>${sub||''}</small><b>${big}</b>${emo?`<span>${emo}</span>`:''}</div>`;document.body.appendChild(o);setTimeout(()=>o.remove(),2200)}
function jxFlash(col,shake){if(!jxOn())return;const o=document.createElement('div');o.className='jxflash';o.style.setProperty('--c',col);document.body.appendChild(o);setTimeout(()=>o.remove(),800);if(shake&&jxFull()){document.body.classList.add('jx-shake');setTimeout(()=>document.body.classList.remove('jx-shake'),520)}}
function jxBurst(x,y,list,n){if(!jxOn())return;const k=jxFull()?(n||8):4;for(let i=0;i<k;i++){const s=document.createElement('span'),a=Math.PI*2*i/k+Math.random()*.6,d=40+Math.random()*50;s.className='jxpt';s.textContent=list[i%list.length];s.style.left=x+'px';s.style.top=y+'px';s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',(Math.sin(a)*d-20)+'px');document.body.appendChild(s);setTimeout(()=>s.remove(),900)}}
function jxComboShow(){let b=$('jxcombo');if(!b){b=document.createElement('div');b.id='jxcombo';document.body.appendChild(b)}b.innerHTML=`<b>🔥 COMBO ×${JX.combo}</b><i></i>`;b.classList.remove('hit');void b.offsetWidth;b.classList.add('hit');clearTimeout(jxComboShow.t);jxComboShow.t=setTimeout(()=>{b.remove();JX.combo=0},7000)}
function jxDelta(){const g=!!(M.goal&&M.goal[dayN()]);if(!JX.last){JX.last={sp:M.sp,c:M.coins,g};return}
 const dsp=M.sp-JX.last.sp,dc=M.coins-JX.last.c,wasG=JX.last.g;JX.last={sp:M.sp,c:M.coins,g};
 if(!jxOn())return;
 if(dsp>0.5&&dsp<500){jxFloat('+'+Math.round(dsp)+' SP','sp');const now=Date.now();JX.combo=(now-JX.ct<7000&&JX.combo)?JX.combo+1:1;JX.ct=now;
  if(JX.combo>=2){jxComboShow();jxSnd([440*Math.pow(2,Math.min(JX.combo,14)/12)],'triangle',.05)}else jxSnd([660],'sine',.04);
  jxVib(8);
  let bonus=0;if(JX.combo>=5&&JX.combo%5===0){bonus=Math.min(25,JX.combo);jxFloat('COMBO BONUS +'+bonus+' 🪙','gold');jxSnd([523,659,784,1047],'triangle',.06,.06);jxVib([20,30,20])}
  else if(Math.random()<.04&&now-JX.lucky>25000){JX.lucky=now;bonus=3+Math.floor(Math.random()*10);jxFloat('🍀 LUCKY STRIKE +'+bonus+' 🪙','gold');jxSnd([784,988,1319,1568],'sine',.06,.06);jxVib([15,25,15,25,40]);jxFlash('#ffd166')}
  if(bonus){M.coins+=bonus;JX.last.c=M.coins;mDirty=true;_pcJX()}}
 else if(dc-dsp>=1&&dc<2000){jxFloat('+'+Math.round(dc)+' 🪙','gold');jxSnd([880,1175],'sine',.04)}
 else if(dc<=-1&&dc>-3000){jxFloat('−'+Math.round(-dc)+' 🪙','neg')}
 if(g&&!wasG){setTimeout(()=>{jxSplash('DAILY GOAL','🎯 SMASHED IT','#4caf50','+10 SP and +10 🪙');jxSnd([523,659,784,1047,1319],'triangle',.07,.08);jxVib([30,40,30,40,80])},500)}}
const _pcJX=paintChip;paintChip=function(){_pcJX();try{jxDelta()}catch(e){}};
const _rollJX=rollOnce;rollOnce=function(type,free){const r=_rollJX(type,free);try{if(r&&r.it&&jxOn()){if(r.it.r==='legendary'){jxFlash('#ffd166',1);jxSnd([392,523,659,784,1047,1319],'triangle',.07,.09);jxVib([40,50,40,50,120])}else if(r.it.r==='epic'){jxFlash('#a855f7',1);jxSnd([523,659,784],'triangle',.06,.08);jxVib([30,40,30])}else if(r.it.r==='rare'){jxSnd([523,659],'sine',.05)}}}catch(e){}return r};
document.addEventListener('click',e=>{if(!jxOn())return;const b=e.target.closest&&e.target.closest('button,.tab,[data-hx]');if(!b||b.disabled)return;
 let x=e.clientX,y=e.clientY;if(!x&&!y){const r=b.getBoundingClientRect();x=r.left+r.width/2;y=r.top+r.height/2}
 const r=document.createElement('div');r.className='jxr';r.style.left=x+'px';r.style.top=y+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),600);
 if(b.matches&&b.matches('button.pri,[data-hx^=bp],[data-hx=shpbuy],[data-hx=advpick]')){jxBurst(x,y,((typeof CFSETS!=='undefined'&&CFSETS[M.set.cf])||['✨','⭐','🪙','💫']).slice(0,6));jxSnd([880,1320],'sine',.04,.05);jxVib(10)}},true);

