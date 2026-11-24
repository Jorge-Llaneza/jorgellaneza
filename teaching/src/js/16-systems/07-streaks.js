/* ======= STREAKS, DUOLINGO STYLE ======= */
(function(){
 const GOALS=[[8,'Casual','8 SP a day'],[20,'Regular','20 SP a day'],[40,'Serious','40 SP a day'],[80,'Intense','80 SP a day']],MULT={8:1,20:1.5,40:2,80:3};
 const SK=()=>{if(!M.strk||typeof M.strk!=='object')M.strk={goal:8,fz:{},hit:{},lost:null,pw:{},rem:1,tot:0,rep:0};const k=M.strk;k.fz=k.fz||{};k.hit=k.hit||{};k.pw=k.pw||{};if(!k.goal)k.goal=8;return k};
 window.stkMin=()=>SK().goal||8;
 const dow=d=>(new Date(d*864e5).getUTCDay()+6)%7;
 const mon=d=>d-dow(d);
 const dayState=d=>{const K=SK(),t=dayN();if(K.hit[d]||(M.ld[d]||0)>=8)return'hit';if(K.fz[d])return'fz';if(d===t)return'now';return d<t?'miss':'fut'};
 const weekHTML=()=>{const t=dayN(),m=mon(t),N=['M','T','W','T','F','S','S'];return `<div class="stkwk" role="img" aria-label="This week's streak days">${N.map((n,i)=>{const d=m+i,st=dayState(d);return `<div class="stkd ${st}${d===t?' today':''}"><small>${n}</small><span>${st==='hit'?'🔥':st==='fz'?'🧊':st==='miss'?'·':st==='now'?'○':''}</span></div>`}).join('')}</div>`};
 const lostInfo=()=>{const K=SK(),s=M.streak,d=dayN();
  if(K.lost&&d-K.lost.d<=1&&s.l===K.lost.d&&K.lost.n>=3)return{mode:'post',n:K.lost.n,cost:Math.min(2500,150+K.lost.n*20)};
  const g=d-1-s.l;if(s.n>=3&&s.l>0&&g>=1&&g<=2&&g>(M.inv.qty.freeze||0))return{mode:'pre',n:s.n,cost:Math.min(2500,150+s.n*20)};return null};
 window.stkExtend=function(d){const s=M.streak,K=SK();if(s.l===d)return;let keep=false,used=0,broke=0;
  if(s.l===d-1)keep=true;
  else if(s.l>0&&s.l<d-1){const gap=d-1-s.l,have=M.inv.qty.freeze||0;if(gap<=have){M.inv.qty.freeze-=gap;for(let i=s.l+1;i<d;i++)K.fz[i]=1;keep=true;used=gap}else if(s.n>=3){K.lost={n:s.n,d};broke=s.n}}
  s.n=keep?s.n+1:1;s.l=d;s.b=Math.max(s.b||0,s.n);K.hit[d]=1;K.tot=(K.tot||0)+1;Object.keys(K.hit).forEach(k=>{if(+k<d-90)delete K.hit[k]});Object.keys(K.fz).forEach(k=>{if(+k<d-90)delete K.fz[k]});
  const bonus=Math.round((5+Math.min(25,s.n))*(MULT[K.goal]||1));M.coins+=bonus;
  if([7,14,30,60,100].includes(s.n)){M.inv.box.gold++;}
  let wk=0;const m=mon(d);if(!K.pw[m]){let all=true;for(let i=0;i<7;i++){const st=dayState(m+i);if(st!=='hit'&&st!=='fz'){all=false;break}}if(all){K.pw[m]=1;M.inv.box.gold++;M.coins+=100;wk=1}}
  mDirty=true;try{mSave();paintChip()}catch(e){}
  const msg=[`+${bonus} 🪙 streak bonus`];if(used)msg.push(`🧊 ${used} freeze${used>1?'s':''} saved your streak`);if([7,14,30,60,100].includes(s.n))msg.push('🎁 Golden Crate in the Shop');if(wk)msg.push('🏆 Perfect week! +100 🪙 and a Golden Crate');if(broke&&!keep)msg.push(`You lost a ${broke}-day streak. Repair it in the streak tab!`);
  try{if(!fcActive()&&!document.getElementById('fclock'))stkCeleb(s.n,msg);else toast('🔥 Streak: '+s.n+' days · '+msg.join(' · '))}catch(e){toast('🔥 Study streak: '+s.n)}
  try{if(window.stkAfter)stkAfter()}catch(e){}};
 function stkCeleb(n,msg){document.getElementById('stkov')&&document.getElementById('stkov').remove();const o=document.createElement('div');o.id='stkov';o.className='fcov';const big=n>=30?'🔥':'🔥';
  o.innerHTML=`<div class="wgm stkm" role="dialog" aria-modal="true" aria-labelledby="stkt"><div class="stkfl" aria-hidden="true">${big}</div><div class="stkn" id="stkt">${n}</div><h2>day streak!</h2>${weekHTML()}<ul class="wgl">${msg.map(x=>`<li><b>${x}</b></li>`).join('')}</ul><div class="wgb"><button class="pri" id="stkok">Continue</button></div></div>`;
  document.body.appendChild(o);const b=o.querySelector('#stkok');b.focus();b.onclick=()=>o.remove();try{lootSting(n>=7?'epic':'rare');if(n%7===0||n>=30)confetti(true);jxSnd([392,523,659,784],'triangle',.06,.1);jxVib([60])}catch(e){}setTimeout(()=>{if(o.isConnected&&n<7)o.remove()},9000)}
 const hoursLeft=()=>{const n=new Date();return Math.max(0,24-n.getHours()-n.getMinutes()/60)};
 const todayInfo=()=>{const d=dayN(),min=stkMin(),got=Math.min(min,M.ld[d]||0);return{done:M.streak.l===d,got,min}};
 window.stkCard=function(){const n=streakNow(),t=todayInfo(),l=lostInfo(),hl=hoursLeft();
  const line=t.done?`✅ Streak extended today. See you tomorrow!`:n>0?`${t.min-t.got} SP to keep your streak${hl<6?` · ⏰ ${Math.floor(hl)}h ${Math.round((hl%1)*60)}m left`:''}`:l?`💔 You lost a ${l.n}-day streak. You can repair it.`:`Earn ${t.min} SP today to start a streak`;
  return `<div class="card shpcard stkcard${!t.done&&n>0&&hl<6?' risk':''}"><div class="shpico" aria-hidden="true">${t.done?'🔥':n>0?'🕯️':'💤'}</div><div style="flex:1;min-width:220px"><b>${n}-day streak</b> <small>· ❄️ ${M.inv.qty.freeze||0} freeze${(M.inv.qty.freeze||0)===1?'':'s'}</small>${weekHTML()}<span>${line}</span></div><div class="hxbtn"><button class="pri" data-sk="open">${l?'🩹 Repair':'Streak'}</button></div></div>`};
 window.stkPanel=function(){const K=SK(),l=lostInfo(),fz=M.inv.qty.freeze||0,pw=Object.keys(K.pw).length;
  return `<div class="stkp">${weekHTML()}<p class="wgs">${todayInfo().done?'✅ Today is done.':`Today: <b>${todayInfo().got}/${todayInfo().min} SP</b> to keep your streak.`} Extra streak bonus coins every day, bigger on higher goals.</p>
  <b>Daily streak goal</b><div class="stkg" role="group" aria-label="Daily streak goal">${GOALS.map(([v,n,d])=>`<button data-sk="goal" data-v="${v}" class="${K.goal===v?'on':''}" aria-pressed="${K.goal===v}"><b>${n}</b><small>${d}</small><small>x${MULT[v]} bonus</small></button>`).join('')}</div>
  ${l?`<div class="stkrep"><b>💔 ${l.n}-day streak ${l.mode==='post'?'was lost':'is about to be lost'}</b><br><small>Repair it for ${l.cost} coins${l.mode==='pre'?' and keep studying today':''}.</small><div class="wgb"><button class="pri" data-sk="repair" ${M.coins>=l.cost?'':'disabled'}>🩹 Repair for 🪙 ${l.cost}</button></div></div>`:''}
  <div class="stkrow"><span>❄️ Freezes: <b>${fz}</b> (each one covers a missed day automatically, up to the number you hold)</span><button data-sk="buyfz" ${fz>=5||M.coins<150?'disabled':''}>Buy one 🪙 150</button></div>
  <div class="stkrow"><span>🏆 Perfect weeks: <b>${pw}</b> · 📅 Streak days: <b>${K.tot||0}</b> · 🩹 Repairs: <b>${K.rep||0}</b></span></div>
  <label class="a11yr"><input type="checkbox" data-sk="rem" ${K.rem===0?'':'checked'}> <span><b>Evening streak reminder</b><small>Warns you after 6 pm if today's streak is not done yet</small></span></label></div>`};
 document.addEventListener('click',e=>{const t=e.target.closest('[data-sk]');if(!t||t.disabled)return;const a=t.dataset.sk,K=SK(),s=M.streak;
  if(a==='open'){try{egOpen('streak')}catch(er){}e.stopPropagation()}
  else if(a==='goal'){K.goal=+t.dataset.v;const d=dayN();if(s.l!==d&&(M.ld[d]||0)>=K.goal)window.stkExtend(d);mDirty=true;try{mSave();egPaint()}catch(er){}}
  else if(a==='buyfz'){if(M.coins>=150&&(M.inv.qty.freeze||0)<5){M.coins-=150;M.inv.qty.freeze=(M.inv.qty.freeze||0)+1;mDirty=true;try{mSave();paintChip();egPaint();toast('❄️ Freeze added')}catch(er){}}}
  else if(a==='repair'){const l=lostInfo();if(!l||M.coins<l.cost)return;M.coins-=l.cost;const d=dayN();if(l.mode==='post'){s.n=K.lost.n+1;s.b=Math.max(s.b||0,s.n)}else{s.l=d-1;}K.lost=null;K.rep=(K.rep||0)+1;mDirty=true;try{mSave();paintChip();egPaint();lootSting('rare');toast('🩹 Streak repaired!')}catch(er){}}},true);
 document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.sk==='rem'){SK().rem=t.checked?1:0;mDirty=true;try{mSave()}catch(er){}}},true);
 /* evening reminder */
 let lastWarn=0;function risk(){try{const K=SK();if(K.rem===0||fcActive())return;const n=new Date(),h=n.getHours(),d=dayN();if(h<18||M.streak.l===d||streakNow()<1)return;if(Date.now()-lastWarn<90*60000)return;if((K.warn||0)===d&&h<21&&Date.now()-lastWarn<3*3600000)return;lastWarn=Date.now();K.warn=d;const need=Math.max(0,stkMin()-(M.ld[d]||0)),hl=Math.max(1,Math.ceil(24-h-n.getMinutes()/60));
  const txt=`🔥 Your ${streakNow()}-day streak ends in about ${hl} hour${hl>1?'s':''}! Earn ${need} more SP to keep it.`;toast(txt);try{jxSnd([440,330],'triangle',.05,.12)}catch(e){}try{if(document.hidden&&'Notification' in window&&Notification.permission==='granted')new Notification('Streak at risk',{body:txt})}catch(e){}
  }catch(e){}}
 setInterval(risk,60000);setTimeout(risk,6000);
 STK.push([10,{c:80,fz:1}],[21,{c:150,b:{crate:1}}],[45,{c:300,b:{gold:1},fz:1}],[75,{c:500,b:{gold:1}}],[150,{c:1500,b:{gold:3},fz:2}],[200,{c:2000,b:{gold:3}}],[365,{c:5000,b:{gold:5},fz:3}]);STK.sort((a,b)=>a[0]-b[0]);
 const st=document.createElement('style');st.textContent=`.stkwk{display:flex;gap:6px;justify-content:center;margin:8px 0}.stkd{width:38px;text-align:center;border:2px solid var(--bd);border-radius:12px;padding:3px 0;background:var(--card2,var(--card))}.stkd small{display:block;font-size:10px;opacity:.7}.stkd span{display:block;height:22px;font-size:18px;line-height:22px}.stkd.hit{border-color:#ff7a1a;background:#ff7a1a22}.stkd.fz{border-color:#4dabf7;background:#4dabf722}.stkd.today{box-shadow:0 0 0 2px var(--acc)}.stkd.miss span{opacity:.4}
.stkcard.risk{animation:stkr 1.6s ease-in-out infinite}@keyframes stkr{50%{box-shadow:0 0 0 5px #ff3b3b66}}
.stkm .stkfl{font-size:84px;animation:stkf 1s ease-out}.stkm .stkn{font-size:64px;font-weight:900;color:#ff7a1a;line-height:1}@keyframes stkf{0%{transform:scale(.2) rotate(-20deg);opacity:0}60%{transform:scale(1.25)}100%{transform:scale(1)}}
.stkg{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:8px 0}.stkg button{display:flex;flex-direction:column;gap:2px;padding:8px;border-radius:12px;cursor:pointer;border:2px solid var(--bd);background:var(--card);color:var(--fg)}.stkg button.on{border-color:#ff7a1a;background:#ff7a1a22}
.stkrep{border:2px dashed #ff3b3b;border-radius:12px;padding:10px;margin:10px 0}.stkrow{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid var(--bd)}.stkp{margin:8px 0}#stkov .wgl li{display:block;text-align:center}`;document.head.appendChild(st);
})();


