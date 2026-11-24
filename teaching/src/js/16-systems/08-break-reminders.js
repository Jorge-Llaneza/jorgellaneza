/* ======= BREAK REMINDERS, GENERAL STATS, MORE ACHIEVEMENTS ======= */
(function(){
 const BR=()=>{if(!M.brk||typeof M.brk!=='object')M.brk={g:20,s:50,taken:0,d:0,td:0,gm:0,sm:0};const b=M.brk;if(b.g==null)b.g=20;if(b.s==null)b.s=50;return b};
 let pl=0,sd=0,idle=0,snoozeG=0,snoozeS=0,lastT=Date.now();
 const isPlay=()=>cur==='halcyon'||cur==='arcade';
 const isStudy=()=>{try{if(fcActive())return true}catch(e){}return !!cur&&!isPlay()&&cur!==''&&cur!=='rewards'&&cur!=='shop'&&cur!=='profile'};
 const busy=()=>{try{return fcActive()||document.getElementById('brkov')||document.getElementById('fclock')}catch(e){return false}};
 setInterval(()=>{const now=Date.now(),dt=Math.min(5,(now-lastT)/1000);lastT=now;if(document.hidden)return;const B=BR(),act=now-lastAct<90000;
  if(!act){idle+=dt;if(idle>=300){pl=0;sd=0;snoozeG=snoozeS=0}return}idle=0;
  if(isPlay()){pl+=dt;B.gm=(B.gm||0)+0}else if(isStudy()){sd+=dt;if(!isPlay()&&sd>0&&pl>0){pl=Math.max(0,pl-dt*(60/180)*0+0)} }
  window.__brkStudyRun=(window.__brkStudyRun||0);
  if(isStudy()){window.__brkStudyRun+=dt;if(window.__brkStudyRun>=180)pl=0}else window.__brkStudyRun=0;
  if(B.g&&pl>=B.g*60+snoozeG&&!busy()){pl=0;snoozeG=0;show('play',Math.round(B.g))}
  else if(B.s&&sd>=B.s*60+snoozeS&&!busy()){sd=0;snoozeS=0;show('study',Math.round(B.s))}},1000);
 function show(kind,min){document.getElementById('brkov')&&document.getElementById('brkov').remove();const o=document.createElement('div');o.id='brkov';o.className='fcov';
  const play=kind==='play';o.innerHTML=`<div class="wgm" role="alertdialog" aria-modal="true" aria-labelledby="brkt"><div class="brkic" aria-hidden="true">${play?'🎮':'🧠'}</div><h2 id="brkt">${play?'Time to study!':'Time for a break!'}</h2><p class="wgs">${play?`You have been playing for about <b>${min} minutes</b>. Let's put the games down and learn something. You can come back after!`:`You have been studying for about <b>${min} minutes</b>. Rest your eyes, stretch, drink some water. A short break helps you remember more.`}</p><div class="wgb">${play?`<button class="pri" data-brk="study">📚 Go study</button><button data-brk="focus">🎯 Focus 25 min</button><button data-brk="snz">10 more minutes</button>`:`<button class="pri" data-brk="rest">☕ Take a 5 min break</button><button data-brk="snz">10 more minutes</button>`}</div></div>`;
  document.body.appendChild(o);o.querySelector('button').focus();try{jxSnd(play?[523,440]:[392,523,659],'triangle',.05,.14);jxVib([40,40,40])}catch(e){}
  try{if(document.hidden&&'Notification' in window&&Notification.permission==='granted')new Notification(play?'Time to study!':'Time for a break!',{body:play?'You have been playing for '+min+' minutes.':'You have been studying for '+min+' minutes.'})}catch(e){}}
 function restScreen(){const o=document.getElementById('brkov')||document.createElement('div');o.id='brkov';o.className='fcov';let left=300;const tips=['👀 Look at something 6 metres away for 20 seconds','🙆 Stretch your arms and neck','💧 Drink a glass of water','🚶 Stand up and walk around','🌬️ Breathe in for 4, out for 6'];
  o.innerHTML=`<div class="wgm"><div class="brkic" aria-hidden="true">☕</div><h2>Break time</h2><div class="brkt" id="brkc" role="timer">5:00</div><p class="wgs" id="brkp">${tips[0]}</p><div class="wgb"><button id="brkd" data-brk="end">I'm back</button></div></div>`;document.body.appendChild(o);let i=0;
  const iv=setInterval(()=>{if(!o.isConnected){clearInterval(iv);return}left--;const c=document.getElementById('brkc');if(c)c.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');if(left%60===0){i=(i+1)%tips.length;const p=document.getElementById('brkp');if(p)p.textContent=tips[i]}
   if(left<=0){clearInterval(iv);end(true)}},1000);o.__done=()=>clearInterval(iv)}
 function end(full){const o=document.getElementById('brkov');if(o){o.__done&&o.__done();o.remove()}if(!full)return;const B=BR(),d=dayN();if(B.d!==d){B.d=d;B.td=0}B.taken=(B.taken||0)+1;if(B.td<3){B.td++;M.coins+=10;try{toast('☕ Nice break! +10 🪙 ('+B.td+'/3 today)')}catch(e){}}else{try{toast('☕ Nice break!')}catch(e){}}mDirty=true;try{mSave();paintChip();checkAch()}catch(e){}}
 document.addEventListener('click',e=>{const t=e.target.closest('[data-brk]');if(!t)return;const a=t.dataset.brk,o=document.getElementById('brkov');
  if(a==='study'){o&&o.remove();try{go('labs')}catch(er){}}
  else if(a==='focus'){o&&o.remove();try{fcSetup(25)}catch(er){}}
  else if(a==='snz'){o&&o.remove();snoozeG=600;snoozeS=600}
  else if(a==='rest'){restScreen()}
  else if(a==='end'){end(false)}
  else if(a==='pv'){show(t.dataset.k,t.dataset.k==='play'?BR().g||20:BR().s||50)}},true);
 const opt=(arr,cur)=>arr.map(v=>`<option value="${v}"${v===cur?' selected':''}>${v?v+' min':'Off'}</option>`).join('');
 EGX.brk={label:'⏰ Breaks',html:()=>{const B=BR();return `<div class="egboss" style="--c:#7dd3fc"><div class="egbi" aria-hidden="true">⏰</div><h3>Break reminders</h3><p class="wgs">Like a game console's health reminder. If you play too long, it tells you to study. If you study too long, it tells you to rest.</p><div class="labrow"><label class="labc"><span>Games: remind after</span><select data-brks="g">${opt([0,10,15,20,30,45],B.g)}</select></label><label class="labc"><span>Studying: remind after</span><select data-brks="s">${opt([0,25,30,45,50,60,90],B.s)}</select></label></div><div class="wgb"><button data-brk="pv" data-k="play">Preview: play reminder</button><button data-brk="pv" data-k="study">Preview: study reminder</button></div><p class="wgs">Breaks taken: <b>${B.taken||0}</b> · Full 5-minute breaks pay 10 coins, up to 3 times a day. Reminders pause during Focus Mode and after 5 minutes of inactivity.</p></div>`}};
 document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.brks){BR()[t.dataset.brks]=+t.value;mDirty=true;try{mSave()}catch(er){}}},true);
 /* ---- general stats ---- */
 const ymd=d=>new Date(d*864e5).toISOString().slice(0,10);
 function gstats(){const t=dayN(),days=M.days||{},act=Object.keys(days).filter(k=>days[k]>0),tot=act.reduce((a,k)=>a+days[k],0),best=act.reduce((m,k)=>Math.max(m,days[k]),0),avg=act.length?Math.round(tot/act.length):0;
  let items=0;try{items=CATALOG.length}catch(e){}let harv=0;try{harv=Object.values((M.farm&&M.farm.har)||{}).reduce((a,b)=>a+b,0)}catch(e){}
  const f=M.fc||{},K=M.strk||{},C=M.cp||{},ck=M.ck||{};
  const tiles=[['🏅',Math.floor(M.sp),'total Study Points'],['⭐',lvlOf(M.sp),'level'],['🪙',Math.floor(M.coins),'coins now'],['⏱️',Math.round(totalSec()/360)/10+' h','time studying'],['📅',act.length,'days active'],['🌟',best,'best day (SP)'],['📈',avg,'avg SP per active day'],['🔥',(M.streak.b||0),'longest streak'],['🎯',f.done||0,'focus sessions'],['🧠',f.mins||0,'focus minutes'],['🎮',gamesN(),'games played'],['🏆',earnedN()+' / '+BADGES.length,'achievements'],['🎁',ownN()+(items?' / '+items:''),'items owned'],['🌾',harv,'crops harvested'],['🍳',ck.served||0,'dishes served'],['🤝',C.tog||0,'co-op finishes'],['☕',(M.brk&&M.brk.taken)||0,'breaks taken'],['🩹',K.rep||0,'streaks repaired']];
  const W=16,cw=15,g=3,mx=Math.max(20,...Object.values(days).map(v=>v||0));let cells='';const m0=t-((new Date(t*864e5).getUTCDay()+6)%7)-(W-1)*7;
  for(let w=0;w<W;w++)for(let r=0;r<7;r++){const d=m0+w*7+r;if(d>t)continue;const v=days[d]||0,a=v?Math.max(.18,Math.min(1,v/mx)):.06;cells+=`<rect x="${w*(cw+g)}" y="${r*(cw+g)}" width="${cw}" height="${cw}" rx="3" fill="var(--acc)" opacity="${a}"><title>${ymd(d)}: ${v} SP</title></rect>`}
  const wd=[0,0,0,0,0,0,0],wn=[0,0,0,0,0,0,0];act.forEach(k=>{const r=(new Date(k*864e5).getUTCDay()+6)%7;wd[r]+=days[k];wn[r]++});const wa=wd.map((v,i)=>wn[i]?Math.round(v/wn[i]):0),wm=Math.max(10,...wa),DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const pl=Object.entries(M.played||{}).sort((a,b)=>b[1]-a[1]).slice(0,5);const lab=Object.entries(M.tsec||{}).filter(([k,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,6);const lm=lab.length?lab[0][1]:1;
  const fmt=sec=>sec>=3600?(sec/3600).toFixed(1)+' h':Math.round(sec/60)+' min';
  return `<div class="egboss" style="--c:#a78bfa"><div class="egbi" aria-hidden="true">📈</div><h3>General stats</h3><div class="fstiles gst">${tiles.map(([i,v,n])=>`<div><span aria-hidden="true">${i}</span><b>${v}</b><small>${n}</small></div>`).join('')}</div></div>
  <div class="egboss" style="--c:#a78bfa"><h3>Last 16 weeks</h3><svg viewBox="0 0 ${W*(cw+g)} ${7*(cw+g)}" role="img" aria-label="Study activity heat map for the last 16 weeks" style="width:100%;max-width:560px">${cells}</svg><p class="wgs">Brighter squares are days with more Study Points.</p></div>
  <div class="egboss" style="--c:#a78bfa"><h3>Average SP by weekday</h3>${wa.map((v,i)=>`<div class="fsbar"><span>${DN[i]}</span><i style="width:${Math.round(v/wm*100)}%"></i><b>${v}</b></div>`).join('')}</div>
  <div class="egboss" style="--c:#a78bfa"><h3>Where your time goes</h3>${lab.length?lab.map(([k,v])=>{const m=(typeof META!=='undefined'&&META.find(a=>a.id===k));return `<div class="fsbar"><span>${m?m.icon+' '+esc(m.name.split(' ')[0]):esc(k)}</span><i style="width:${Math.round(v/lm*100)}%"></i><b>${fmt(v)}</b></div>`}).join(''):'<p class="wgs">Spend some time in a lab and it shows up here.</p>'}${pl.length?`<h3 style="margin-top:12px">Most played games</h3>${pl.map(([k,v])=>`<div class="fsbar"><span>${esc(k)}</span><i style="width:${Math.round(v/pl[0][1]*100)}%"></i><b>${v}×</b></div>`).join('')}`:''}</div>`}
 EGX.gstats={label:'📈 Stats',html:gstats};
 /* ---- achievements ---- */
 const T=(id,n)=>addC('title',id,n,'epic',{title:n,noDrop:true});
 ['Deep Worker','Phoenix Rising','Co-op Champion','Year Of Fire','Iron Schedule','Master Of Rest','Regular Customer'].forEach(n=>T('t_'+n,n));
 const sum=o=>Object.values(o||{}).reduce((a,b)=>a+(+b||0),0),F=()=>M.fc||{},K2=()=>M.strk||{},CPp=()=>M.cp||{};
 const A=(id,ico,n,d,cur,tot,rw)=>AX('z_'+id,ico,n,d,()=>cur()>=tot,rw,()=>[Math.min(tot,cur()),tot]);
 A('fc1','🎯','First Focus','Finish your first Focus session',()=>F().done||0,1,{c:30});
 A('fc10','🎯','Focused Ten','Finish 10 Focus sessions',()=>F().done||0,10,{c:150,b:{crate:1}});
 A('fc50','🧘','Deep Worker','Finish 50 Focus sessions',()=>F().done||0,50,{c:500,b:{gold:1},i:['t_Deep Worker']});
 A('fcm100','⏳','Hundred Minutes','Focus for 100 minutes in total',()=>F().mins||0,100,{c:100});
 A('fcm1000','⌛','A Thousand Minutes','Focus for 1,000 minutes in total',()=>F().mins||0,1000,{c:600,b:{gold:1}});
 A('fcl60','🏔️','Long Haul','Complete a 60 minute Focus session',()=>F().best||0,60,{c:200,b:{crate:1}});
 A('fcperf','🛡️','Spotless','Finish 5 Focus sessions without ever breaking one',()=>(F().fails||0)===0?(F().done||0):0,5,{c:200});
 A('stk10','🔥','Ten Alive','Reach a 10-day streak',()=>M.streak.b||0,10,{c:100,fz:1});
 A('stk21','🔥','Habit Formed','Reach a 21-day streak',()=>M.streak.b||0,21,{c:250,b:{crate:1}});
 A('stk150','🌋','Eternal Flame','Reach a 150-day streak',()=>M.streak.b||0,150,{c:1000,b:{gold:2}});
 A('stk365','☄️','Year Of Fire','Reach a 365-day streak',()=>M.streak.b||0,365,{c:5000,b:{gold:4},i:['t_Year Of Fire']});
 A('pw1','🏆','Perfect Week','Study every day of a calendar week',()=>Object.keys(K2().pw||{}).length,1,{c:150,b:{gold:1}});
 A('phoenix','🩹','Phoenix Rising','Repair a lost streak',()=>K2().rep||0,1,{c:80,i:['t_Phoenix Rising']});
 A('intense','💪','Intense Mode','Set your daily streak goal to Intense (80 SP)',()=>K2().goal===80?1:0,1,{c:100});
 A('farm1','🌱','First Harvest','Harvest a crop on Valley Farm',()=>sum((M.farm||{}).har),1,{c:40});
 A('farm25','🌾','Green Thumb','Harvest 25 crops',()=>sum((M.farm||{}).har),25,{c:200,b:{crate:1}});
 A('farmg','✨','Golden Harvest','Get a golden harvest',()=>(M.farm||{}).gold||0,1,{c:150});
 A('coop1','🤝','Study Buddies','Finish a Co-op session together',()=>CPp().tog||0,1,{c:150});
 A('coopw','🚨','Gotcha','Catch a partner slacking',()=>CPp().wins||0,1,{c:100});
 A('coop10','🥇','Co-op Champion','Finish 10 Co-op sessions together',()=>CPp().tog||0,10,{c:600,b:{gold:1},i:['t_Co-op Champion']});
 A('tt3','📅','Timetable Set','Add 3 classes to your timetable',()=>((M.tt||{}).slots||[]).length,3,{c:40});
 A('att5','📚','Never Skips','Attend 5 classes from your timetable',()=>Object.keys((M.tt||{}).att||{}).length,5,{c:200,b:{crate:1}});
 A('att20','🗓️','Iron Schedule','Attend 20 classes from your timetable',()=>Object.keys((M.tt||{}).att||{}).length,20,{c:600,b:{gold:1},i:['t_Iron Schedule']});
 A('lab','🎨','Colour Maker','Unlock the Palette Lab',()=>M.inv.own.palettelab?1:0,1,{c:60});
 A('remix','🧬','Remixer','Unlock Theme Remix',()=>M.inv.own.remix?1:0,1,{c:100});
 A('snd','🎵','Sound Check','Switch to a sound pack',()=>(M.snp&&M.snp.sel)?1:0,1,{c:60});
 A('evt1','🎉','Event Goer','Buy anything from a Seasonal Event shop',()=>Object.keys(M.inv.own).some(k=>/^(ev_|bn_ev_)/.test(k))?1:0,1,{c:80});
 A('own150','🎁','Collector','Own 150 items',ownN,150,{c:300,b:{crate:2}});
 A('own300','💎','Hoarder','Own 300 items',ownN,300,{c:800,b:{gold:2}});
 A('hrs5','⏱️','Five Hours','Spend 5 hours studying on the site',hrs,5,{c:150});
 A('hrs25','⏰','Twenty-Five Hours','Spend 25 hours studying on the site',hrs,25,{c:700,b:{gold:1}});
 A('days30','🗓️','Month Of Study','Study on 30 different days',()=>Object.keys(M.days||{}).filter(k=>M.days[k]>0).length,30,{c:400,b:{gold:1}});
 A('rest1','☕','Good Rest','Take a full 5 minute break',()=>(M.brk&&M.brk.taken)||0,1,{c:50});
 A('rest10','🧘','Master Of Rest','Take 10 full breaks',()=>(M.brk&&M.brk.taken)||0,10,{c:300,i:['t_Master Of Rest']});
 const st=document.createElement('style');st.textContent=`#brkov .brkic{font-size:64px}#brkov .brkt{font-size:54px;font-weight:900;color:var(--acc);margin:8px 0}.gst div span{font-size:18px}`;document.head.appendChild(st);
})();


