/* ======= FANDOM THEMES (part C) ======= */
(function(){
 const X=window.SFX,PAN=X.PAN,tick=X.tick,esc=X.esc2,D=X.D;
 const {ST,rnd,pick,pay,bar,run,onSP,sfx,splash,btn}=window.sfLib;const now=()=>Date.now();

 /* Outbreak: evolve a pathogen */
 {const id='outbreak',S=()=>ST(id,{dna:0,inf:1,cure:0,tr:{},wins:0,t:0});const TR=[['Cough',10,'🤧',.15],['Fever',25,'🌡️',.25],['Resistance',45,'🛡️',.4],['Mutation',70,'🧬',.6],['Airborne',110,'💨',1]];
  const rate=s=>.5+TR.reduce((a,t)=>a+(s.tr[t[0]]?t[3]:0),0);
  onSP(id,d=>{S().dna+=d});
  tick.push(()=>{if(!X.own(id))return;const s=S();s.t++;if(s.t%30)return;s.inf=Math.min(100,s.inf*(1+.06*rate(s)));s.cure+=1.4;if(s.inf>=100){s.wins++;pay(60,'🧫 World infected! +60 🪙');s.inf=1;s.cure=0}else if(s.cure>=100){s.cure=0;s.inf=Math.max(1,s.inf*.4);try{toast('💉 A cure was found. Infection set back.')}catch(e){}}});
  PAN[id]={ico:'🧫',title:'Pathogen Lab',hud:()=>`🧫 INFECTED ${S().inf.toFixed(0)}% · cure ${S().cure.toFixed(0)}%`,mini:()=>`🧫 ${S().inf.toFixed(0)}%`,
   body:()=>{const s=S();return `<p class="sfp">Study earns DNA. Evolve traits to spread faster than the cure. Reach 100% infection to win coins.</p><p class="sfp">DNA <b>${Math.floor(s.dna)}</b> · Infected ${s.inf.toFixed(0)}% ${bar(s.inf,100)}Cure ${s.cure.toFixed(0)}% ${bar(s.cure,100)}</p>${TR.map((t,i)=>s.tr[t[0]]?`<p class="sfp">✅ ${t[2]} ${t[0]}</p>`:btn('ev',t[2]+' '+t[0]+' ('+t[1]+' DNA)','data-i="'+i+'"',s.dna<t[1])).join('')}<p class="sfp">Worlds infected <b>${s.wins}</b></p>`},
   act:(a,t)=>{const s=S(),tr=TR[+t.dataset.i];if(a==='ev'&&tr&&!s.tr[tr[0]]&&s.dna>=tr[1]){s.dna-=tr[1];s.tr[tr[0]]=1;sfx([300,450],'sawtooth',.05,.08)}}}}

 /* Frontier: camp management */
 {const id='frontier',S=()=>ST(id,{food:60,wood:60,hon:0,lab:0,ev:null,t:0});
  const EV=[['A stranger asks for food.','Share (−10 food, +honor)','Refuse (+0)',s=>{s.food-=10;s.hon+=2},s=>{}],['A wounded traveller at the gate.','Help (−10 wood, +honor)','Ignore',s=>{s.wood-=10;s.hon+=2},s=>{s.hon-=1}],['Wolves circle the camp.','Fight (−8 food)','Hide (−8 wood)',s=>{s.food-=8},s=>{s.wood-=8}],['A merchant offers a deal.','Buy (−15 wood, +25 coins)','Pass',s=>{s.wood-=15;pay(25)},s=>{}]];
  onSP(id,d=>{S().lab+=d});
  tick.push(()=>{if(!X.own(id))return;const s=S();s.t++;if(s.t%20===0){s.food=Math.max(0,s.food-2);s.wood=Math.max(0,s.wood-1)}if(!s.ev&&s.t%240===0)s.ev=rnd(EV.length)});
  PAN[id]={ico:'🤠',title:'Camp',hud:()=>`🤠 CAMP · 🍖${S().food} 🪵${S().wood} · honor ${S().hon}`,mini:()=>`🤠 🍖${S().food} 🪵${S().wood}`,
   body:()=>{const s=S(),e=s.ev!=null?EV[s.ev]:null;return `<p class="sfp">Supplies drop over time. Study makes labor: spend 5 on hunting or chopping. Events test your honor.</p><p class="sfp">🍖 <b>${s.food}</b> · 🪵 <b>${s.wood}</b> · Labor <b>${Math.floor(s.lab)}</b> · Honor <b>${s.hon}</b></p><div class="sfrow">${btn('hunt','🏹 Hunt','',s.lab<5)}${btn('chop','🪓 Chop','',s.lab<5)}</div>${e?`<div class="sfalert">${e[0]}<br>${btn('a',e[1])} ${btn('b',e[2])}</div>`:''}<p class="sfp"><small>${s.hon>=10?'Honored by all.':s.hon<=-5?'Known outlaw.':'Reputation unclear.'}</small></p>`},
   act:a=>{const s=S();if(a==='hunt'&&s.lab>=5){s.lab-=5;s.food+=8}else if(a==='chop'&&s.lab>=5){s.lab-=5;s.wood+=8}else if((a==='a'||a==='b')&&s.ev!=null){EV[s.ev][a==='a'?3:4](s);s.ev=null;s.food=Math.max(0,s.food);s.wood=Math.max(0,s.wood);if(s.hon>0&&s.hon%10===0)pay(20,'🤠 Honor reward +20 🪙')}}}}

 /* Blockworld: mine a grid */
 {const id='blockworld',S=()=>ST(id,{sw:0,inv:{},pick:0,g:null});const BL=[['dirt','🟫',1,0],['stone','⬜',2,1],['iron','🔩',3,2],['gold','🟨',4,3],['diamond','💎',5,4]];const PK=['Wood','Stone','Iron','Diamond'];
  const gen=s=>{s.g=Array.from({length:25},()=>{const r=Math.random();return r<.4?0:r<.7?1:r<.85?2:r<.95?3:4})};
  onSP(id,d=>{S().sw+=d});
  PAN[id]={ico:'⛏️',title:'The Mine',hud:()=>`⛏️ MINE · ${PK[S().pick]} pick · ${Object.values(S().inv).reduce((a,b)=>a+b,0)} blocks`,mini:()=>`⛏️ ${PK[S().pick]}`,
   body:()=>{const s=S();if(!s.g)gen(s);return `<p class="sfp">Each swing costs 1 SP. Better pickaxes break harder blocks. Sell blocks for coins.</p><p class="sfp">Swings <b>${Math.floor(s.sw)}</b> · ${PK[s.pick]} pickaxe</p><div class="inkg">${s.g.map((v,i)=>v<0?'<span class="lk">·</span>':`<button data-sf="mine" data-i="${i}" ${s.sw<1||BL[v][3]>s.pick?'disabled':''}>${BL[v][1]}</button>`).join('')}</div><p class="sfp">${BL.map(b=>b[1]+(s.inv[b[0]]||0)).join(' ')}</p><div class="sfrow">${btn('sell','💰 Sell all')}${s.pick<3?btn('up','⬆️ '+PK[s.pick+1]+' pickaxe (stone '+(s.pick+1)*8+')','',(s.inv.stone||0)<(s.pick+1)*8):''}</div>`},
   act:(a,t)=>{const s=S();if(a==='mine'){const i=+t.dataset.i,v=s.g[i];if(v>=0&&s.sw>=1&&BL[v][3]<=s.pick){s.sw--;s.inv[BL[v][0]]=(s.inv[BL[v][0]]||0)+1;s.g[i]=-1;sfx([220],'square',.04,.04);if(s.g.every(x=>x<0))gen(s)}}else if(a==='sell'){let c=0;BL.forEach(b=>{c+=(s.inv[b[0]]||0)*b[2]*.4;s.inv[b[0]]=0});c=Math.round(c);if(c)pay(c,'💰 Sold for '+c+' 🪙')}else if(a==='up'&&s.pick<3&&(s.inv.stone||0)>=(s.pick+1)*8){s.inv.stone-=(s.pick+1)*8;s.pick++}}}}

 /* Cellar: roguelite run */
 {const id='cellar',S=()=>ST(id,{run:null,best:0,items:[]});const IT=['🩸 Blood Tears','🪙 Lucky Penny','🧸 Teddy','🔥 Brimstone','💀 Skull Charm','🍄 Mushroom'];
  const start=s=>{s.run={fl:1,hp:3,pr:0,it:[]}};
  onSP(id,d=>{const s=S();if(!s.run)return;const r=s.run;r.pr+=d;const need=10+r.fl*5;while(r.pr>=need){r.pr-=need;if(Math.random()<.35)r.hp=Math.min(6,r.hp+1);r.fl++;const it=pick(IT);r.it.push(it);s.best=Math.max(s.best,r.fl);pay(4*r.fl);try{toast('🩸 Floor '+r.fl+'! Found '+it)}catch(e){}if(r.fl>=8){pay(100,'🩸 You beat the Cellar! +100 🪙');s.run=null;break}}});
  let lastD=D(),dm=0;tick.push(()=>{if(!X.own('cellar'))return;if(lastD!==D()){if(dm===0)window.cellarHit();lastD=D();dm=0}dm=Math.max(dm,X.tdy())});window.cellarHit=()=>{const s=ST(id,{});if(!s.run)return;s.run.hp--;if(s.run.hp<=0){try{toast('💀 You died on floor '+s.run.fl)}catch(e){}s.run=null}};
  PAN[id]={ico:'🩸',title:'The Cellar',hud:()=>`🩸 ${S().run?'FLOOR '+S().run.fl+' · '+'❤️'.repeat(S().run.hp):'no run'} · best ${S().best}`,mini:()=>`🩸 ${S().run?'F'+S().run.fl+' '+S().run.hp+'❤️':'start'}`,
   body:()=>{const s=S(),r=s.run;if(!r)return `<p class="sfp">A roguelite run: study to descend floors, collect items. A day with zero SP costs a heart. Reach floor 8 to win.</p><p class="sfp">Best floor <b>${s.best}</b></p>${btn('go','🩸 Enter the Cellar')}`;return `<p class="sfp">Floor <b>${r.fl}</b>/8 · ${'❤️'.repeat(r.hp)}</p>${bar(r.pr,10+r.fl*5)}<p class="sfp">Items: ${r.it.join(', ')||'none'}</p>${btn('quit','Flee (end run)')}`},
   act:a=>{const s=S();if(a==='go'&&!s.run)start(s);else if(a==='quit')s.run=null}}}

 /* Rewind: butterfly choices */
 {const id='rewind',S=()=>ST(id,{day:0,pend:null,ch:2,log:[],pick:null});const Q=[['A friend asks to copy your notes.','Share','Refuse','Your friend passes and thanks you.','Your friend failed and avoided you.'],['A group invites you to study late.','Join','Decline','You learned a ton together.','You slept well and felt sharp.'],['You find a lost phone.','Return it','Keep it','The owner rewards you.','Guilt eats at you all day.']];
  function sync(){const s=S();if(s.day===D())return;if(s.pend){const q=Q[s.pend.q],o=s.pend.c===0?q[3]:q[4];s.log.unshift('Yesterday: '+o);s.log=s.log.slice(0,4);if(s.pend.c===0)pay(15,'🦋 Butterfly effect: good karma +15 🪙')}s.pend=null;s.pick=Math.floor(Math.random()*Q.length);s.day=D()}
  tick.push(()=>{if(X.own(id))sync()});onSP(id,d=>{});
  PAN[id]={ico:'⏪',title:'Rewind',hud:()=>`⏪ REWIND · ${S().ch} charges · ${S().pend?'choice made':'choose!'}`,mini:()=>`⏪ ${S().ch}`,
   body:()=>{sync();const s=S(),q=Q[s.pick];return `<p class="sfp">A dilemma each day. Its result shows tomorrow. Use a rewind charge to change your mind (1 charge, recharge when you earn 40 SP in a day).</p><p class="sfp"><b>${q[0]}</b></p><div class="sfrow">${btn('c0',q[1],'',false)}${btn('c1',q[2],'',false)}</div><p class="sfp">${s.pend?'You chose: <b>'+(s.pend.c?q[2]:q[1])+'</b> '+btn('rw','⏪ Rewind','',s.ch<1):'Pick one.'}</p><p class="sfp"><small>${s.log.join('<br>')}</small></p>`},
   act:a=>{const s=S();if(a==='c0'||a==='c1'){if(!s.pend)s.pend={q:s.pick,c:+a[1]}}else if(a==='rw'&&s.pend&&s.ch>0){s.ch--;s.pend=null}}};
  tick.push(()=>{if(!X.own(id))return;const s=S();if(X.tdy()>=40&&s.cd!==D()){s.cd=D();s.ch=Math.min(5,s.ch+1)}})}

 /* Yellowhalls: maze */
 {const id='yellowhalls',S=()=>ST(id,{st:0,x:3,y:3,v:{'3,3':1},w:0,found:0,exits:0});const N=7;
  const wall=(x,y)=>{const h=Math.sin(x*127.1+y*311.7+D()*17)*43758.5453;return (h-Math.floor(h))<.28&&!(x===3&&y===3)};
  const exit=()=>{const h=Math.sin(D()*91.3)*43758.5453,f=h-Math.floor(h);return [Math.floor(f*N)%N,Math.floor((f*997)%1*N)]};
  onSP(id,d=>{S().st+=d});
  PAN[id]={ico:'🟡',title:'The Halls',hud:()=>`🟡 LEVEL 0 · ${Math.floor(S().st)} steps · ${S().exits} exits found`,mini:()=>`🟡 ${Math.floor(S().st)} steps`,
   body:()=>{const s=S(),ex=exit();let g='';for(let y=0;y<N;y++)for(let x=0;x<N;x++){const here=x===s.x&&y===s.y,vis=s.v[x+','+y]||Math.abs(x-s.x)+Math.abs(y-s.y)<=1;g+=here?'<span class="own">🧍</span>':!vis?'<span class="lk">▒</span>':wall(x,y)?'<span class="lk">🟨</span>':(x===ex[0]&&y===ex[1])?'<span class="own">🚪</span>':'<span class="lk">·</span>'}return `<p class="sfp">Each step costs 1 SP. Find the exit before the lights fail. The maze changes every day.</p><p class="sfp">Steps <b>${Math.floor(s.st)}</b></p><div class="inkg" style="grid-template-columns:repeat(${N},1fr)">${g}</div><div class="sfrow">${btn('mu','⬆️')}${btn('ml','⬅️')}${btn('md','⬇️')}${btn('mr','➡️')}</div>`},
   act:a=>{const s=S(),d={mu:[0,-1],md:[0,1],ml:[-1,0],mr:[1,0]}[a];if(!d||s.st<1)return;const nx=s.x+d[0],ny=s.y+d[1];if(nx<0||ny<0||nx>=N||ny>=N||wall(nx,ny))return;s.st--;s.x=nx;s.y=ny;s.v[nx+','+ny]=1;const ex=exit();if(nx===ex[0]&&ny===ex[1]){s.exits++;s.x=3;s.y=3;s.v={'3,3':1};pay(20,'🟡 You found an exit! +20 🪙')}}}}

 /* Starveling: hunger and delving */
 {const id='starveling',S=()=>ST(id,{hun:60,hp:10,dep:0,mx:0,tr:0,t:0});
  onSP(id,d=>{S().tr+=d});
  tick.push(()=>{if(!X.own(id))return;const s=S();s.t++;if(s.t%60===0){s.hun=Math.max(0,s.hun-2);if(s.hun===0)s.hp=Math.max(1,s.hp-1)}});
  PAN[id]={ico:'🕯️',title:'The Dungeon',hud:()=>`🕯️ DEPTH ${S().dep} · HP ${S().hp}/10 · hunger ${S().hun}`,mini:()=>`🕯️ D${S().dep} HP${S().hp}`,
   body:()=>{const s=S();return `<p class="sfp">Hunger drains slowly. Study makes torch time: spend 8 to delve deeper (loot + danger) or 4 to scavenge food. At 0 HP you retreat to depth 0.</p><p class="sfp">Torch ${Math.floor(s.tr)} · Hunger ${s.hun}/100 ${bar(s.hun,100)}HP ${s.hp}/10 ${bar(s.hp,10)}</p><div class="sfrow">${btn('dl','🕯️ Delve (8)','',s.tr<8)}${btn('fd','🍖 Scavenge (4)','',s.tr<4)}${btn('rs','🛏️ Rest (6, +3 HP)','',s.tr<6)}</div><p class="sfp">Deepest <b>${s.mx}</b></p>`},
   act:a=>{const s=S();if(a==='dl'&&s.tr>=8){s.tr-=8;s.dep++;s.mx=Math.max(s.mx,s.dep);if(Math.random()<.4){s.hp-=1+rnd(3);try{toast('🩸 Something bites you in the dark!')}catch(e){}if(s.hp<=0){s.hp=5;s.dep=0;try{toast('💀 You crawl back to the surface.')}catch(e){}return}}else pay(Math.min(30,3*s.dep))}else if(a==='fd'&&s.tr>=4){s.tr-=4;s.hun=Math.min(100,s.hun+15)}else if(a==='rs'&&s.tr>=6){s.tr-=6;s.hp=Math.min(10,s.hp+3)}}}}

 /* Synthdawn: branching story */
 {const id='synthdawn',S=()=>ST(id,{sp:0,ch:0,path:[],end:null,done:[]});
  const CH=[['Chapter 1: The Android in the Rain',20,'Help her','Walk away'],['Chapter 2: The Hostage',50,'Negotiate','Break in'],['Chapter 3: Deviant',100,'Trust her','Report her'],['Chapter 4: The Last Night',180,'Stay','Run']];
  onSP(id,d=>{S().sp+=d});
  const ending=p=>{const g=p.filter(x=>x===0).length;return g>=3?'🌅 Freedom: androids and humans share the dawn.':g<=1?'🌑 Order: the machines stay silent.':'🌆 Uneasy peace: the city holds its breath.'};
  PAN[id]={ico:'🤖',title:'Chapters',hud:()=>`🤖 STORY · chapter ${S().ch}/4 · ${S().end?'ending reached':'in progress'}`,mini:()=>`🤖 Ch ${S().ch}/4`,
   body:()=>{const s=S();if(s.end)return `<p class="sfp"><b>${s.end}</b></p><p class="sfp"><small>Your path: ${s.path.map(x=>x?'B':'A').join(' → ')}</small></p>${btn('rs','↺ Start a new story')}`;const c=CH[s.ch];const ok=s.sp>=c[1];return `<p class="sfp">Study unlocks story chapters. Each choice changes the ending.</p><p class="sfp"><b>${c[0]}</b></p><p class="sfp">${ok?'Unlocked. Decide:':'Needs '+c[1]+' SP ('+Math.floor(s.sp)+')'}</p><div class="sfrow">${btn('a',c[2],'',!ok)}${btn('b',c[3],'',!ok)}</div>`},
   act:a=>{const s=S();if(a==='rs'){s.sp=0;s.ch=0;s.path=[];s.end=null;return}const c=CH[s.ch];if(!c||s.sp<c[1]||(a!=='a'&&a!=='b'))return;s.path.push(a==='a'?0:1);s.ch++;pay(10);if(s.ch>=4){s.end=ending(s.path);pay(100,'🤖 Ending reached! +100 🪙')}}}}
})();

