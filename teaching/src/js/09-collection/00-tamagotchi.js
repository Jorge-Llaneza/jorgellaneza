/* ===== part 3g: extra skins and click sounds, cursors, Tamagotchi theme ===== */
Object.assign(SKINMAP,{
 sansb:t=>cp(t,0x1D5D4,0x1D5EE,0x1D7EC),sansi:t=>cp(t,0x1D608,0x1D622),bolditalic:t=>cp(t,0x1D63C,0x1D656),
 smallcaps:t=>{const m={a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',y:'ʏ',z:'ᴢ'};return t.replace(/[a-z]/g,c=>m[c]||c)},
 dbl:t=>{const ex={C:'ℂ',H:'ℍ',N:'ℕ',P:'ℙ',Q:'ℚ',R:'ℝ',Z:'ℤ'};return [...t].map(ch=>{if(ex[ch])return ex[ch];const n=ch.charCodeAt(0);if(n>=65&&n<=90)return String.fromCodePoint(0x1D538+n-65);if(n>=97&&n<=122)return String.fromCodePoint(0x1D552+n-97);if(n>=48&&n<=57)return String.fromCodePoint(0x1D7D8+n-48);return ch}).join('')},
 sparkle:t=>'✦ '+t+' ✦',
 runes:t=>{const m={A:'ᚨ',B:'ᛒ',C:'ᚲ',D:'ᛞ',E:'ᛖ',F:'ᚠ',G:'ᚷ',H:'ᚺ',I:'ᛁ',J:'ᛃ',K:'ᚲ',L:'ᛚ',M:'ᛗ',N:'ᚾ',O:'ᛟ',P:'ᛈ',Q:'ᚲ',R:'ᚱ',S:'ᛊ',T:'ᛏ',U:'ᚢ',V:'ᚢ',W:'ᚹ',X:'ᚲᛊ',Y:'ᛃ',Z:'ᛉ'};return t.replace(/[A-Za-z]/g,c=>m[c.toUpperCase()])},
 royal:t=>'👑 '+cp(t,0x1D4D0,0x1D4EA)});
const tone2=(t,v,f,d,type,g0,delay)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.value=f;const s=t+(delay||0);g.gain.setValueAtTime(g0*v,s);g.gain.exponentialRampToValueAtTime(.001,s+d);o.connect(g);g.connect(master);o.start(s);o.stop(s+d+.02)};
Object.assign(UISND,{
 bubble2(t,v){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(380,t);o.frequency.exponentialRampToValueAtTime(980,t+.07);g.gain.setValueAtTime(.13*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.1);o.connect(g);g.connect(master);o.start(t);o.stop(t+.12)},
 tick(t,v){tone2(t,v,1500,.03,'square',.06)},
 marimba(t,v){tone2(t,v,523,.22,'sine',.16);tone2(t,v,784,.18,'sine',.1,.05)},
 coin(t,v){tone2(t,v,988,.07,'square',.07);tone2(t,v,1319,.22,'square',.07,.07)},
 wood(t,v){const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.setValueAtTime(260,t);o.frequency.exponentialRampToValueAtTime(120,t+.06);g.gain.setValueAtTime(.3*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.09);o.connect(g);g.connect(master);o.start(t);o.stop(t+.1)},
 harp(t,v){[523,659,784].forEach((f,i)=>tone2(t,v,f,.5,'triangle',.11,i*.05))},
 zap(t,v){const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.setValueAtTime(1400,t);o.frequency.exponentialRampToValueAtTime(90,t+.12);g.gain.setValueAtTime(.09*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);o.connect(g);g.connect(master);o.start(t);o.stop(t+.16);tone2(t,v,2400,.05,'square',.03)},
 crystal(t,v){[2093,2637,3136,3951].forEach((f,i)=>tone2(t,v,f,.55,'sine',.07/(i*.4+1),i*.04))},
 choir(t,v){[392,392*1.004,494,587].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(.06*v,t+.18);g.gain.exponentialRampToValueAtTime(.001,t+.9);o.connect(g);g.connect(master);o.start(t);o.stop(t+.95)})}});
(function(){const E={flower:'🌼',cookie:'🍪',heart:'❤️',cloud:'☁️',hat:'🎩',comet:'☄️',key:'🗝️',magnet:'🧲',flame:'🔥',bolt:'⚡',eye:'🧿',ufo:'🛸',dragon:'🐉',crown:'👑',unicorn:'🦄',diamond:'💎'};
 let css='';for(const k in E)css+=`html[data-cur=${k}],html[data-cur=${k}] *{cursor:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text y='26' font-size='26'>${E[k]}</text></svg>") 4 4,auto!important}\n`;
 const s=document.createElement('style');s.id='mpx2';s.textContent=css;document.head.appendChild(s)})();
/* ---------- Tamagotchi ---------- */
const TSP={fluff:{n:'Fluff',st:['🥚','🐣','🐥','🐤'],ad:['🦚','🦆','🐔']},drako:{n:'Drako',st:['🥚','🦎','🐊','🐲'],ad:['🐉','🦖','🦕']},floof:{n:'Floof',st:['🥚','🐱','🐈','🐆'],ad:['🦁','🐯','🐈‍⬛']},aqua:{n:'Aqua',st:['🥚','🐟','🐠','🐡'],ad:['🐬','🦈','🐙']}};
const TGP=[0,30,140,420,1000],TST=['Egg','Baby','Kid','Teen','Adult'];
addC('title','t_Pet Whisperer','Pet Whisperer','epic',{title:'Pet Whisperer',noDrop:true});
const tmEmoji=()=>{const t=M.tm,s=TSP[t.sp];if(!s)return'🥚';return t.stage>=4?(s.ad[t.form]||s.ad[0]):s.st[t.stage]};
const tmAvg=()=>{const t=M.tm;return(t.f+t.m+t.c+t.e)/4};
function tmMood(){const t=M.tm;if(t.f<20)return['hungry','🍽','So hungry…'];if(t.c<20)return['sad','🫧','Needs a bath!'];if(t.e<20)return['tired','😴','Sleepy…'];if(t.m<20)return['sad','😢','Feeling down…'];return tmAvg()>=70?['happy','😊','Happy!']:['fine','🙂','Doing fine.']}
let tmWas=null,tmDraft='fluff';
function tmDecay(){const t=M.tm,now=Date.now();if(mode!=='tamagotchi'||!t.sp){t.last=now;return}if(!t.last){t.last=now;return}const h=Math.min(10,Math.max(0,(now-t.last)/3600000));t.last=now;if(h<=0)return;t.f=Math.max(8,t.f-5*h);t.m=Math.max(8,t.m-4*h);t.c=Math.max(8,t.c-3*h);t.e=Math.max(8,t.e-4*h);mDirty=true}
const TREW={1:{c:30},2:{b:{crate:1}},3:{b:{fun:1},c:50},4:{c:300,b:{gold:1},i:['t_Pet Whisperer']}};
function tmOnSP(n){const t=M.tm;if(mode!=='tamagotchi'||!t.sp||!(n>0))return;tmDecay();t.frac+=n/2;const k=Math.floor(t.frac);if(k){t.frac-=k;t.tok=Math.min(30,t.tok+k)}
 t.m=Math.min(100,t.m+.4*n);const a=tmAvg();t.care+=a;t.n++;t.gp+=n*Math.max(.25,Math.min(1.2,a/70));
 let st=0;TGP.forEach((g,i)=>{if(t.gp>=g)st=i});
 while(t.stage<st){t.stage++;if(t.stage===4){const av=t.care/Math.max(1,t.n);t.form=av>=70?0:av>=45?1:2}giveReward(TREW[t.stage]||{});setTimeout(()=>{toast(`🎉 ${t.name||TSP[t.sp].n} grew into a ${TST[t.stage]}! ${rewardText(TREW[t.stage]||{})}`);confetti()},300)}
 mDirty=true;tmPaint(1)}
function tmAct(a){const t=M.tm;if(!t.sp)return;tmDecay();const cost={feed:2,play:2,clean:1,rest:1}[a];
 if(a==='play'&&t.e<15){toast(`${t.name||'Your pet'} is too tired to play. Try Rest first.`);return}
 if(t.tok<cost){toast('Study to earn care points: every 2 SP gives 1 🍬');return}
 t.tok-=cost;const up=(k,v)=>{t[k]=Math.max(8,Math.min(100,t[k]+v))};
 if(a==='feed'){up('f',35);up('c',-3)}else if(a==='play'){up('m',30);up('e',-12);up('f',-5)}else if(a==='clean'){up('c',45);up('m',3)}else{up('e',35)}
 mDirty=true;tmPaint(1,1)}
function tmMount(){let el=$('tama');if(!el){el=document.createElement('div');el.id='tama';document.body.appendChild(el)}return el}
function tmSync(){const on=mode==='tamagotchi';if(!on){const el=$('tama');if(el)el.remove();tmWas=false;return}
 if(tmWas===false){M.tm.last=Date.now()}tmWas=true;if(!M.tm.sp)M.tm.open=1;tmDecay();tmPaint()}
function tmPaint(react,jump){if(mode!=='tamagotchi')return;const t=M.tm;const el=tmMount();
 if(!t.sp){if(el.querySelector('.tm-in')&&document.activeElement===el.querySelector('.tm-in'))return;
  el.innerHTML=`<div class="tm-panel"><div class="tm-top"><span>🥚 Choose your egg</span></div><div class="tm-screen"><div class="tm-pet fine">🥚</div><div class="tm-say">Study to hatch it and help it grow!</div></div><div class="tm-eggs">${Object.entries(TSP).map(([k,s])=>`<button data-act="tmpick" data-sp="${k}" class="${tmDraft===k?'cur':''}"><b>${s.ad[0]}</b>${s.n}</button>`).join('')}</div><input class="tm-in" id="tmName" maxlength="14" placeholder="Name your pet"><button class="tm-go" data-act="tmhatch">Start caring</button></div>`;return}
 const [mk,mi,mt]=tmMood(),s=TSP[t.sp],next=TGP[t.stage+1],prog=next?Math.min(100,(t.gp-TGP[t.stage])/(next-TGP[t.stage])*100):100;
 const row=(ic,lb,v)=>`<div class="tm-st"><span aria-hidden="true">${ic}</span><div class="tm-bar ${v<25?'low':''}" role="progressbar" aria-label="${lb}" aria-valuenow="${Math.round(v)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.round(v)}%"></i></div><b>${Math.round(v)}</b></div>`;
 const btn=(a,ic,lb,c)=>`<button data-act="${a}" ${t.tok<c?'aria-disabled="true" style="opacity:.6"':''}><b>${ic}</b>${lb}<br>${c}🍬</button>`;
 el.innerHTML=`${t.open?`<div class="tm-panel"><div class="tm-top"><span>${esc(t.name||s.n)} · ${TST[t.stage]}</span><button data-act="tmtoggle" aria-label="Close">✕</button></div><div class="tm-screen"><div class="tm-pet ${mk}${jump?' jump':''}" aria-hidden="true">${tmEmoji()}</div><div class="tm-say">${mi} ${mt}</div></div>
 <div class="tm-st" style="grid-template-columns:22px 1fr 34px"><span aria-hidden="true">⭐</span><div class="tm-bar" role="progressbar" aria-label="Growth" aria-valuenow="${Math.round(prog)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${prog}%"></i></div><b>${next?Math.round(prog)+'%':'MAX'}</b></div>
 ${row('🍙','Hunger',t.f)}${row('😊','Mood',t.m)}${row('🛁','Clean',t.c)}${row('⚡','Energy',t.e)}
 <div class="tm-acts">${btn('tmfeed','🍙','Feed',2)}${btn('tmplay','🎾','Play',2)}${btn('tmclean','🛁','Clean',1)}${btn('tmrest','💤','Rest',1)}</div><div class="tm-tip">🍬 ${Math.floor(t.tok)} care points · studying earns 1 per 2 SP</div></div>`:''}
 <button class="tm-fab" data-act="tmtoggle" aria-label="${esc(t.name||s.n)}: ${mt}"><span class="${react?'tm-pet jump':''}" style="font-size:30px;display:inline-block">${tmEmoji()}</span><span class="tm-mood" aria-hidden="true">${mi}</span><span class="tm-tok">🍬${Math.floor(t.tok)}</span></button>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#tama [data-act]');if(!b)return;const a=b.dataset.act,t=M.tm;
 if(a==='tmtoggle'){t.open=t.open?0:1;mDirty=true;tmPaint()}
 else if(a==='tmpick'){tmDraft=b.dataset.sp;document.querySelectorAll('#tama .tm-eggs button').forEach(x=>x.classList.toggle('cur',x===b))}
 else if(a==='tmhatch'){const nm=($('tmName')&&$('tmName').value||'').trim().slice(0,14);t.sp=tmDraft;t.name=nm||TSP[tmDraft].n;t.stage=0;t.gp=0;t.f=t.m=t.c=t.e=80;t.tok=3;t.frac=0;t.care=0;t.n=0;t.last=Date.now();t.born=Date.now();t.open=1;mDirty=true;toast(`🥚 ${t.name} is ready! Study to earn care points.`);tmPaint(1)}
 else if(a==='tmfeed')tmAct('feed');else if(a==='tmplay')tmAct('play');else if(a==='tmclean')tmAct('clean');else if(a==='tmrest')tmAct('rest')});
setInterval(()=>{if(mode==='tamagotchi'){tmDecay();tmPaint()}},30000);
AX('tm1','🐣','Hatched!','Hatch your Tamagotchi',()=>M.tm.sp&&M.tm.stage>=1,{c:30},()=>[M.tm.sp&&M.tm.stage>=1?1:0,1]);
AX('tm3','🐤','Growing up','Raise your Tamagotchi to a teen',()=>M.tm.sp&&M.tm.stage>=3,{c:100,b:{fun:1}},()=>[M.tm.sp?M.tm.stage:0,3]);
AX('tm4','🦚','Fully grown','Raise your Tamagotchi to an adult',()=>M.tm.sp&&M.tm.stage>=4,{c:200,b:{gold:1}},()=>[M.tm.sp?M.tm.stage:0,4]);

