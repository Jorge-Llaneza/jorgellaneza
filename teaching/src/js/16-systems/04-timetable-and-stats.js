/* ======= TIMETABLE, FOCUS STATS, PROFILE CARD, SOUND PACKS ======= */
(function(){
 const DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const ymd=d=>{d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
 const wkKey=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return ymd(d)};
 const dow=()=>(new Date().getDay()+6)%7;
 const TT=()=>{if(!M.tt||typeof M.tt!=='object')M.tt={slots:[],att:{},wk:{}};M.tt.slots=M.tt.slots||[];M.tt.att=M.tt.att||{};M.tt.wk=M.tt.wk||{};return M.tt};
 const FCL=()=>((M.fc&&M.fc.log)||[]);
 const hm=t=>{const m=/^(\d{1,2}):(\d{2})$/.exec(t||'');return m?(+m[1])*60+(+m[2]):-1};
 /* ---- timetable ---- */
 window.ttAttend=function(a){const T=TT(),today=dow(),k=ymd(),now=new Date(),nm=now.getHours()*60+now.getMinutes();let hit=null;
  T.slots.forEach(sl=>{if(hit||sl.d!==today||T.att[sl.id+'@'+k])return;const st=hm(sl.t),lb=(sl.l||'').trim().toLowerCase(),al=(a.label||'').trim().toLowerCase();const near=Math.abs((nm-a.min)-st)<=30||Math.abs(nm-st)<=sl.m+30;if(a.min>=sl.m*.8&&((lb&&lb===al)||near))hit=sl});
  if(!hit)return;T.att[hit.id+'@'+k]=1;M.coins+=40;
  const wk=wkKey(),tot=T.slots.length,got=T.slots.reduce((n,sl)=>n+(T.att[sl.id+'@'+ymd()]?0:0),0);
  let weekHit=0;const days=[];for(let i=0;i<7;i++){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)+i);days.push(ymd(d))}
  let due=0,att=0;T.slots.forEach(sl=>{const dk=days[sl.d];due++;if(T.att[sl.id+'@'+dk])att++});
  let msg='📅 Class attended: '+(hit.l||'session')+' (+40 coins)';
  if(due>=3&&att>=due&&!T.wk[wk]){T.wk[wk]=1;M.coins+=200;M.inv.box.gold=(M.inv.box.gold||0)+1;msg+=' · 🏆 Perfect week! +200 coins and a Golden Crate'}
  mDirty=true;try{mSave();paintChip();toast(msg)}catch(e){}};
 function ttRemind(){try{if(fcActive())return;const T=TT(),n=new Date(),nm=n.getHours()*60+n.getMinutes(),k=ymd();T.slots.forEach(sl=>{if(sl.d!==dow())return;const st=hm(sl.t),key=sl.id+'@'+k;if(nm>=st&&nm<st+10&&!T.att[key]&&!(window.__ttSeen||(window.__ttSeen={}))[key]){window.__ttSeen[key]=1;ttBar(sl);try{if('Notification' in window&&Notification.permission==='granted')new Notification('Class time: '+(sl.l||'Focus'),{body:sl.m+' minute session. Open the app to start.'})}catch(e){}}})}catch(e){}}
 function ttBar(sl){if(document.getElementById('ttbar'))return;const o=document.createElement('div');o.id='ttbar';o.setAttribute('role','alert');o.innerHTML=`<span aria-hidden="true">📅</span><b>${esc(sl.l||'Class time')}</b> starts now (${sl.m} min)<button class="pri" data-tt="start" data-id="${sl.id}">Start focus</button><button data-tt="dismiss" aria-label="Dismiss">✕</button>`;document.body.appendChild(o);try{jxSnd([523,659],'triangle',.05,.1)}catch(e){}}
 function ttHTML(){const T=TT(),k=ymd();let h=`<div class="egboss" style="--c:#4dabf7"><div class="egbi" aria-hidden="true">📅</div><h3>Class Timetable</h3><p class="wgs">Add your classes. You get a reminder at start time. Finish a focus session of at least 80% of the class length around that time to mark it attended (+40 coins). Attend every class in a week (3+ classes) for a Golden Crate.</p>
  <div class="labrow"><label class="labc"><span>Day</span><select id="tt_d">${DN.map((d,i)=>`<option value="${i}"${i===dow()?' selected':''}>${d}</option>`).join('')}</select></label><label class="labc"><span>Start</span><input id="tt_t" type="time" value="09:00"></label><label class="labc"><span>Minutes</span><input id="tt_m" type="number" min="5" max="240" value="45" style="width:70px"></label><label class="labc"><span>Subject</span><input id="tt_l" type="text" maxlength="30" placeholder="Maths"></label></div><div class="wgb"><button class="pri" data-tt="add">➕ Add class</button><button data-tt="notif">🔔 Allow notifications</button></div></div>`;
  h+=`<div class="egboss" style="--c:#4dabf7"><h3>This week</h3>`;
  if(!T.slots.length)h+=`<p class="wgs">No classes yet.</p>`;
  else DN.forEach((dn,di)=>{const sl=T.slots.filter(x=>x.d===di).sort((a,b)=>hm(a.t)-hm(b.t));if(!sl.length)return;const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)+di);const dk=ymd(d);h+=`<p class="wgs"><b>${dn}${di===dow()?' (today)':''}</b></p><ul class="wgl">${sl.map(x=>`<li><span aria-hidden="true">${T.att[x.id+'@'+dk]?'✅':'🕘'}</span><b>${esc(x.t)} · ${esc(x.l||'Class')}</b><small>${x.m} min</small><button data-tt="del" data-id="${x.id}" aria-label="Delete class">🗑</button></li>`).join('')}</ul>`});
  return h+`</div>`}
 EGX.tt={label:'📅 Timetable',html:ttHTML};
 document.addEventListener('click',e=>{const t=e.target.closest('[data-tt]');if(!t)return;const a=t.dataset.tt,T=TT();
  if(a==='add'){const d=+document.getElementById('tt_d').value,tm=document.getElementById('tt_t').value,m=Math.max(5,Math.min(240,Math.floor(+document.getElementById('tt_m').value||45))),l=(document.getElementById('tt_l').value||'').trim().slice(0,30);if(hm(tm)<0){toast('Pick a start time');return}if(T.slots.length>=40){toast('That is plenty of classes!');return}T.slots.push({id:'s'+Date.now().toString(36)+Math.floor(Math.random()*99),d,t:tm,m,l});mDirty=true;try{mSave()}catch(er){}egPaint()}
  else if(a==='del'){T.slots=T.slots.filter(x=>x.id!==t.dataset.id);mDirty=true;try{mSave()}catch(er){}egPaint()}
  else if(a==='notif'){try{Notification.requestPermission().then(r=>toast(r==='granted'?'🔔 Notifications on':'Notifications are blocked in this browser'))}catch(er){toast('Notifications are not supported here')}}
  else if(a==='start'){const sl=T.slots.find(x=>x.id===t.dataset.id);const b=document.getElementById('ttbar');if(b)b.remove();if(sl&&window.fcSetup){try{egClose&&egClose()}catch(er){}fcSetup(sl.m,sl.l)}}
  else if(a==='dismiss'){const b=document.getElementById('ttbar');if(b)b.remove()}},true);
 setInterval(ttRemind,20000);setTimeout(ttRemind,4000);
 /* ---- focus stats ---- */
 function statsHTML(){const f=M.fc||{},log=FCL(),done=f.done||0,fails=f.fails||0,mins=f.mins||0,tot=done+fails,rate=tot?Math.round(done/tot*100):0,avg=done?Math.round(mins/done):0;
  const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);days.push({k:ymd(d),l:d.getDate(),m:0})}
  log.forEach(r=>{if(!r.ok)return;const k=ymd(new Date(r.t)),x=days.find(d=>d.k===k);if(x)x.m+=r.m});
  const mx=Math.max(30,...days.map(d=>d.m)),W=420,H=130;
  const bars=days.map((d,i)=>{const bh=Math.round(d.m/mx*(H-30)),x=i*30+4;return `<rect x="${x}" y="${H-18-bh}" width="22" height="${Math.max(bh,d.m?2:0)}" rx="3" fill="var(--acc)"><title>${d.k}: ${d.m} min</title></rect><text x="${x+11}" y="${H-5}" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">${d.l}</text>${d.m?`<text x="${x+11}" y="${H-21-bh}" font-size="9" text-anchor="middle" fill="currentColor">${d.m}</text>`:''}`}).join('');
  const by={};log.forEach(r=>{if(!r.ok)return;const k=(r.l||'Unlabelled');by[k]=(by[k]||0)+r.m});const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,6),tm=top.length?top[0][1]:1;
  const rec=log.slice(-8).reverse();
  return `<div class="egboss" style="--c:#7dff9b"><div class="egbi" aria-hidden="true">📊</div><h3>Focus stats</h3><div class="fstiles"><div><b>${done}</b><small>sessions done</small></div><div><b>${mins}</b><small>minutes focused</small></div><div><b>${rate}%</b><small>success rate</small></div><div><b>${avg}</b><small>avg minutes</small></div><div><b>${f.best||0}</b><small>longest</small></div><div><b>${fails}</b><small>broken</small></div></div></div>
  <div class="egboss" style="--c:#7dff9b"><h3>Last 14 days (minutes)</h3><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Focus minutes per day for the last 14 days" style="width:100%;max-width:520px">${bars}</svg>${log.length?'':'<p class="wgs">Finish a session and your chart fills in.</p>'}</div>
  <div class="egboss" style="--c:#7dff9b"><h3>By subject</h3>${top.length?top.map(([n,m])=>`<div class="fsbar"><span>${esc(n)}</span><i style="width:${Math.round(m/tm*100)}%"></i><b>${m} min</b></div>`).join(''):'<p class="wgs">Label your sessions to see a breakdown.</p>'}</div>
  <div class="egboss" style="--c:#7dff9b"><h3>Recent sessions</h3>${rec.length?`<ul class="wgl">${rec.map(r=>`<li><span aria-hidden="true">${r.ok?'✅':'💥'}</span><b>${esc(r.l||'Focus session')} · ${r.m} min</b><small>${new Date(r.t).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}${r.s?' · '+r.s+' strike'+(r.s>1?'s':''):''}</small></li>`).join('')}</ul>`:'<p class="wgs">Nothing logged yet.</p>'}</div>`}
 EGX.fstats={label:'📊 Focus stats',html:statsHTML};
 /* ---- profile card ---- */
 function cardInfo(){let lv=1;try{lv=lvlOf(M.sp)}catch(e){}const own=Object.keys(M.inv.own||{}).length;let tot=0;try{tot=CATALOG.length}catch(e){}
  const cs=getComputedStyle(document.documentElement),g=n=>cs.getPropertyValue(n).trim()||'#888';
  return {av:(M.set&&M.set.av)||'🙂',title:(M.set&&M.set.title)||'Student',lv,sp:Math.floor(M.sp||0),streak:(()=>{try{return streakNow()}catch(e){return 0}})(),own,tot,fm:(M.fc&&M.fc.mins)||0,fs:(M.fc&&M.fc.done)||0,theme:(()=>{try{return XT[mode]?XT[mode].n:'Classic'}catch(e){return 'Classic'}})(),bg:g('--bg'),card:g('--card'),fg:g('--fg'),acc:g('--acc'),acc2:g('--acc2')||g('--acc')}}
 function drawCard(cv){if(window.pcDraw&&window.pcDraw(cv))return;const I=cardInfo(),c=cv.getContext('2d'),W=cv.width=900,H=cv.height=500;
  const gr=c.createLinearGradient(0,0,W,H);gr.addColorStop(0,I.bg);gr.addColorStop(1,I.card);c.fillStyle=gr;c.fillRect(0,0,W,H);
  c.fillStyle=I.acc;c.globalAlpha=.18;c.beginPath();c.arc(W-80,70,230,0,7);c.fill();c.globalAlpha=1;
  c.fillStyle=I.acc;c.fillRect(0,0,W,10);
  c.font='120px serif';c.textBaseline='middle';c.fillText(I.av,50,130);
  c.fillStyle=I.fg;c.font='700 44px system-ui,sans-serif';c.fillText(I.title.slice(0,26),210,100);
  c.font='500 26px system-ui,sans-serif';c.globalAlpha=.75;c.fillText('Level '+I.lv+' · '+I.sp.toLocaleString()+' Study Points',210,150);c.globalAlpha=1;
  const st=[['🔥',I.streak,'day streak'],['🎯',I.fs,'focus sessions'],['⏱️',I.fm,'focus minutes'],['🎁',I.own+(I.tot?' / '+I.tot:''),'items owned']];
  st.forEach((x,i)=>{const bx=40+i*214,by=230;c.fillStyle=I.card;c.globalAlpha=.9;c.beginPath();c.roundRect?c.roundRect(bx,by,194,150,18):c.rect(bx,by,194,150);c.fill();c.globalAlpha=1;c.strokeStyle=I.acc;c.lineWidth=2;c.stroke();c.font='34px serif';c.fillStyle=I.fg;c.fillText(x[0],bx+16,by+36);c.font='800 36px system-ui,sans-serif';c.fillStyle=I.acc;c.fillText(String(x[1]),bx+16,by+86);c.font='500 18px system-ui,sans-serif';c.fillStyle=I.fg;c.globalAlpha=.75;c.fillText(x[2],bx+16,by+122);c.globalAlpha=1});
  c.fillStyle=I.fg;c.font='600 22px system-ui,sans-serif';c.globalAlpha=.8;c.fillText('Theme: '+I.theme,40,430);c.textAlign='right';c.fillText('MP Productions Teaching',W-40,430);c.textAlign='left';c.globalAlpha=1;
  c.fillStyle=I.acc2;c.fillRect(0,H-10,W,10)}
 window.__pcClassic=cv=>drawCard(cv);
 function cardHTML(){if(window.pcHTML)return window.pcHTML();return `<div class="egboss" style="--c:#ffb703"><div class="egbi" aria-hidden="true">🪪</div><h3>Profile card</h3><p class="wgs">A shareable picture of your progress, in your current theme.</p><canvas id="pcv" width="900" height="500" style="width:100%;max-width:520px;border-radius:14px" role="img" aria-label="Your profile card"></canvas><div class="wgb"><button class="pri" data-pc="dl">⬇️ Download PNG</button><button data-pc="re">🔄 Refresh</button></div></div>`}
 EGX.pcard={label:'🪪 Profile',html:cardHTML};
 const eg0=window.egPaint;if(typeof egPaint==='function'){const old=egPaint;egPaint=function(){old.apply(this,arguments);const cv=document.getElementById('pcv');if(cv)try{drawCard(cv)}catch(e){}}}
 document.addEventListener('click',e=>{const t=e.target.closest('[data-pc]');if(!t)return;const cv=document.getElementById('pcv');if(!cv)return;drawCard(cv);if(t.dataset.pc==='dl'){cv.toBlob(b=>{const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='my-study-profile.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast('Profile card saved')},'image/png')}},true);
 /* ---- sound packs ---- */
 const SPK=[{id:'',n:'Original',ico:'🔔',cost:0,ty:null,dt:0,d:'The sounds the site shipped with.'},{id:'chip',n:'Chiptune',ico:'👾',cost:0,ty:'square',dt:0,d:'8-bit square waves.'},{id:'mar',n:'Marimba',ico:'🪘',cost:0,ty:'sine',dt:-1200,d:'Soft, wooden and low.'},{id:'bub',n:'Bubbles',ico:'🫧',cost:0,ty:'sine',dt:1200,d:'Light and poppy, an octave up.'},{id:'deep',n:'Deep Bass',ico:'🔊',cost:200,ty:'triangle',dt:-2400,d:'Two octaves down. Feel it.'},{id:'sci',n:'Sci-Fi',ico:'🛸',cost:300,ty:'sawtooth',dt:700,d:'Buzzy, bright and strange.'},{id:'gls',n:'Glass',ico:'🥂',cost:400,ty:'sine',dt:1900,d:'Tiny glassy chimes.'}];
 const SN=()=>{if(!M.snp||typeof M.snp!=='object')M.snp={own:{},sel:''};M.snp.own=M.snp.own||{};return M.snp};
 const curPk=()=>SPK.find(p=>p.id===(SN().sel||''))||SPK[0];
 (function(){const AC0=window.AudioContext||window.webkitAudioContext;if(!AC0||AC0.prototype.__spk)return;const orig=AC0.prototype.createOscillator;AC0.prototype.__spk=1;
  AC0.prototype.createOscillator=function(){const o=orig.apply(this,arguments);try{const pk=curPk();if(pk.ty&&!window.__nospk){const d=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(o),'type');
    Object.defineProperty(o,'type',{configurable:true,get(){return d.get.call(o)},set(v){d.set.call(o,(v==='sine'||v==='triangle'||v==='square'||v==='sawtooth')?pk.ty:v)}});o.detune.value=pk.dt}}catch(e){}return o}})();
 function sndHTML(){const S=SN(),cur=S.sel||'';return `<div class="egboss" style="--c:#f783ac"><div class="egbi" aria-hidden="true">🎵</div><h3>Sound packs</h3><p class="wgs">Change how every beep, jingle and effect sounds. Coins: <b>${Math.floor(M.coins)}</b></p><ul class="wgl">${SPK.map(p=>{const own=!p.cost||S.own[p.id];return `<li><span aria-hidden="true">${p.ico}</span><b>${p.n}${cur===p.id?' ✓':''}</b><small>${p.d}</small><button data-sp="try" data-id="${p.id}">▶ Try</button>${own?`<button class="${cur===p.id?'':'pri'}" data-sp="use" data-id="${p.id}" ${cur===p.id?'disabled':''}>${cur===p.id?'In use':'Use'}</button>`:`<button class="pri" data-sp="buy" data-id="${p.id}" ${M.coins>=p.cost?'':'disabled'}>🪙 ${p.cost}</button>`}</li>`}).join('')}</ul></div>`}
 EGX.snd={label:'🎵 Sounds',html:sndHTML};
 const prev=id=>{const S=SN(),keep=S.sel;S.sel=id;try{if(audio()){const t=AC.currentTime;[523,659,784,1047,784].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.12);g.gain.linearRampToValueAtTime(.09,t+i*.12+.01);g.gain.exponentialRampToValueAtTime(.0001,t+i*.12+.3);o.connect(g);g.connect(master);o.start(t+i*.12);o.stop(t+i*.12+.32)})}}catch(e){}S.sel=keep};
 document.addEventListener('click',e=>{const t=e.target.closest('[data-sp]');if(!t||t.disabled)return;const S=SN(),id=t.dataset.id,p=SPK.find(x=>x.id===id),a=t.dataset.sp;if(!p)return;
  if(a==='try')prev(id);else if(a==='use'){S.sel=id;mDirty=true;try{mSave()}catch(er){}prev(id);egPaint()}
  else if(a==='buy'){if(M.coins<p.cost)return;M.coins-=p.cost;S.own[id]=1;S.sel=id;mDirty=true;try{mSave();paintChip();toast('🎵 '+p.n+' unlocked')}catch(er){}prev(id);egPaint()}},true);
 const st=document.createElement('style');st.textContent=`#ttbar{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:2147482000;background:var(--card);color:var(--fg);border:2px solid var(--acc);border-radius:14px;padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;box-shadow:0 8px 30px #0006;max-width:94vw}.fstiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.fstiles div{background:var(--card2,var(--card));border:1px solid var(--bd);border-radius:12px;padding:10px;text-align:center}.fstiles b{display:block;font-size:24px;color:var(--acc)}.fstiles small{opacity:.75}.fsbar{position:relative;display:flex;align-items:center;gap:8px;margin:6px 0;font-size:13px}.fsbar span{width:30%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fsbar i{display:block;height:12px;border-radius:6px;background:var(--acc);min-width:4px}.fsbar b{margin-left:auto}.wgl li button{margin-left:6px}`;document.head.appendChild(st);
})();


