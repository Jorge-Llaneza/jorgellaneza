/* ======= FANDOM THEMES (part B) ======= */
(function(){
 const X=window.SFX,PAN=X.PAN,tick=X.tick,SM=X.SM,modal=X.modal,esc=X.esc2,D=X.D;
 const {ST,rnd,pick,pay,bar,run,onSP,sfx,splash,rf,btn}=window.sfLib;const now=()=>Date.now();

 /* ---- Velvet Vendetta: mansion rooms and curios ---- */
 {const id='vendetta',S=()=>ST(id,{sp:0,f:[],sd:{},rw:[]});
  const RM=[['Foyer','🕯️',0,['🕰️','🗝️','🧣','🪞']],['Library','📚',20,['📜','🪶','🔮','📖']],['Gallery','🖼️',50,['🗿','🎭','🏺','🧿']],['Conservatory','🌹',100,['🥀','🦋','🪴','🧴']],['Cellar','🍷',180,['🍷','🕸️','🪙','🧪']],['Observatory','🔭',300,['🔭','🌙','⭐','🧭']],['Ballroom','💃',500,['👑','🎻','🥂','🎼']],['Tower','🦇',800,['🦇','⚜️','🔔','💎']]];
  onSP(id,d=>{S().sp+=d});
  PAN[id]={ico:'🦇',title:'The Mansion',hud:()=>`🦇 MANSION · ${RM.filter(r=>S().sp>=r[2]).length}/8 rooms · ${S().f.length}/32 curios`,mini:()=>`🦇 ${S().f.length}/32 curios`,
   body:()=>{const s=S();return `<p class="sfp">Study to open the mansion's rooms. Search each open room once a day for curios. Complete a room's four curios for a bonus.</p><p class="sfp">Study points: <b>${Math.floor(s.sp)}</b></p>${RM.map((r,i)=>{const open=s.sp>=r[2],got=r[3].filter(c=>s.f.includes(r[0]+c)).length;return `<p class="sfp">${r[1]} <b>${r[0]}</b> ${open?`<small>${got}/4</small> ${btn('sr','Search','data-i="'+i+'"',s.sd[r[0]]===D())}`:`<small>🔒 ${r[2]} SP</small>`}</p>`}).join('')}`},
   act:(a,t)=>{const s=S(),r=RM[+t.dataset.i];if(a==='sr'&&r&&s.sp>=r[2]&&s.sd[r[0]]!==D()){s.sd[r[0]]=D();const miss=r[3].filter(c=>!s.f.includes(r[0]+c));if(miss.length){const c=pick(miss);s.f.push(r[0]+c);toast(r[1]+' You found '+c+' in the '+r[0]);sfx([523,659],'triangle',.05,.08);if(r[3].every(c=>s.f.includes(r[0]+c))&&!s.rw.includes(r[0])){s.rw.push(r[0]);pay(80,'🦇 Room complete: '+r[0]+' +80 🪙')}}else pay(10,'Nothing new in the '+r[0]+', but you find 10 🪙')}}}}

 /* ---- Neon Wasteland FM: tune the dial ---- */
 {const id='wasteland',S=()=>ST(id,{bat:50,f:880,got:{}});const NM=['Dust FM','Cactus Radio','Highway Hits','Static Gospel','Midnight Dispatch'];
  const stn=()=>NM.map((n,k)=>({n,f:880+Math.floor((Math.abs(Math.sin(D()*12.9898+k*78.233))*43758.5453%1)*200)}));
  const near=f=>{let b=null;stn().forEach(s=>{const d=Math.abs(s.f-f);if(!b||d<b.d)b={d,s}});return b};
  onSP(id,d=>{const s=S();s.bat=Math.min(100,s.bat+d*2)});
  const sig=f=>Math.max(0,Math.round(100-near(f).d*8));
  document.addEventListener('input',e=>{if(e.target.id!=='wsdial')return;const s=S();s.f=+e.target.value;const q=sig(s.f),a=document.getElementById('wssig'),b=document.getElementById('wsf');if(a)a.style.width=q+'%';if(b)b.textContent=(s.f/10).toFixed(1)+' MHz · '+(q>85?'📡 STRONG SIGNAL':q>50?'getting closer…':'static')});
  PAN[id]={ico:'📻',title:'FM Dial',hud:()=>`📻 FM · 🔋 ${Math.round(S().bat)}% · ${Object.keys(S().got).filter(k=>S().got[k]===D()).length}/5 stations today`,mini:()=>`📻 🔋${Math.round(S().bat)}%`,
   body:()=>{const s=S(),q=sig(s.f);return `<p class="sfp">Five stations hide on the dial and move every day. Turn the dial until the static clears, then tune in (costs 10 battery). Studying charges the battery.</p><div class="sfbar"><i id="wssig" style="width:${q}%"></i></div><p class="sfp" id="wsf">${(s.f/10).toFixed(1)} MHz</p><input id="wsdial" type="range" min="880" max="1080" value="${s.f}" aria-label="Radio dial" style="width:100%"><p class="sfp">🔋 <b>${Math.round(s.bat)}%</b></p>${btn('tune','📻 Tune in','',s.bat<10)}<p class="sfp"><small>${NM.map(n=>(S().got[n]===D()?'✅ ':'▫️ ')+n).join(' · ')}</small></p>`},
   act:a=>{const s=S();if(a==='tune'&&s.bat>=10){s.bat-=10;const n=near(s.f);if(n.d<=3&&s.got[n.s.n]!==D()){s.got[n.s.n]=D();pay(6,'📻 Tuned in to '+n.s.n+'! +6 🪙');sfx([440,660,880],'sine',.05,.1);if(NM.every(x=>s.got[x]===D()))pay(20,'📻 All stations found today! +20 🪙')}else toast('📻 Only static…')}}}}

 /* ---- Underground Sudsworks: train and fight ---- */
 {const id='sudsworks',S=()=>ST(id,{tp:0,st:[1,1,1],w:0,l:0,cd:0,msg:''});const NM=['STR','SPD','GRIT'];
  onSP(id,d=>{S().tp+=d});
  PAN[id]={ico:'🧼',title:'The Back Room',hud:()=>`🧼 BACK ROOM · ${S().w}W-${S().l}L · power ${S().st.reduce((a,b)=>a+b,0)}`,mini:()=>`🧼 ${S().w}W-${S().l}L`,
   body:()=>{const s=S(),left=Math.max(0,Math.ceil((s.cd-now())/1000));return `<p class="sfp">Study is training. Spend training points on your stats, then step into the ring. Wins pay coins, losses cost a few.</p><p class="sfp">Training points <b>${Math.floor(s.tp)}</b></p><div class="sfrow">${s.st.map((v,i)=>btn('tr',NM[i]+' '+v+' (+1: 10)','data-i="'+i+'"',s.tp<10)).join('')}</div>${btn('fight',left?'🥊 Rest '+left+'s':'🥊 Fight! (20 training)','',left>0||s.tp<20)}<p class="sfp">${esc(s.msg)}</p><p class="sfp">Record <b>${s.w}</b>W / ${s.l}L</p>`},
   act:(a,t)=>{const s=S();if(a==='tr'&&s.tp>=10){s.tp-=10;s.st[+t.dataset.i]++}else if(a==='fight'&&now()>s.cd&&s.tp>=20){s.tp-=20;s.cd=now()+120000;const me=s.st.reduce((x,y)=>x+y,0)*(.7+Math.random()*.6),en=(s.st.reduce((x,y)=>x+y,0)*.9+3+rnd(6))*(.7+Math.random()*.6);if(me>=en){s.w++;const c=8+Math.round(s.st.reduce((x,y)=>x+y,0)/2);s.msg='You won the fight! +'+c+' coins.';pay(c);sfx([523,659,784],'square',.05,.08)}else{s.l++;s.msg='You lost. −5 coins. Train harder.';pay(-5);sfx([200,150],'sawtooth',.05,.12)}}}}}

 /* ---- Paper Peaks: write absurd episodes ---- */
 {const id='papertown',S=()=>ST(id,{sp:0,ep:[],ss:0});const A=['The Great','Return of the','Attack of the','Night of the','The Last','Revenge of the','Super','The Secret of the'],B=['Snow Day','Lunch Lady','Mountain Goat','Substitute','Paper Moose','Cardboard King','Spelling Bee','Marker Monster'],K=['Mittens','Big Gus','Little Pip','Mr. Scissors','The Principal','Grandma Glue'],V=['start a lemonade stand on a glacier','win the school quiz','build a snowman army','teach the town to skate','find the missing homework','run for mayor'],P=['the snow starts talking back','everyone turns into a goat','the moon files a complaint','a substitute takes over the whole town','the bus drives itself to the mountain','nobody can stop laughing'];
  onSP(id,d=>{const s=S();s.sp+=d;while(s.sp>=20){s.sp-=20;const e={t:pick(A)+' '+pick(B),p:pick(K)+' tries to '+pick(V)+', but '+pick(P)+'.',r:1+rnd(5)};s.ep.push(e);splash('NEW EPISODE',e.t,'#ffb347','📺');if(s.ep.length%10===0){s.ss++;pay(150,'📺 Season '+s.ss+' wrapped! +150 🪙')}}});
  PAN[id]={ico:'📺',title:'Episode Writers',hud:()=>`📺 SEASON ${S().ss+1} · ep ${S().ep.length%10}/10 · ${S().ep.length} total`,mini:()=>`📺 Ep ${S().ep.length%10}/10`,
   body:()=>{const s=S(),l=s.ep.slice(-3).reverse();return `<p class="sfp">Every 20 SP your writers finish a random absurd episode. Ten episodes make a season.</p>${bar(s.sp,20)}<p class="sfp">Season ${s.ss+1}: <b>${s.ep.length%10}/10</b> episodes</p>${l.map(e=>`<p class="sfp"><b>${e.t}</b> ${'⭐'.repeat(e.r)}<br><small>${e.p}</small></p>`).join('')}`}}}

 /* ---- Breach & Hold: ranked rounds ---- */
 {const id='breach',S=()=>ST(id,{rp:0,day:0,w:[0,0,0],op:'rusher',ms:0});const TH=[10,25,50],OP={rusher:['Rusher','💥','+10 coins per round won'],anchor:['Anchor','🛡️','No RP lost on a missed day'],hacker:['Hacker','💻','+5 RP per round won']},RK=[['Copper',0],['Bronze',100],['Silver',250],['Gold',450],['Platinum',700],['Diamond',1000],['Champion',1500]];
  const rank=rp=>{let r=0;RK.forEach((k,i)=>{if(rp>=k[1])r=i});return r};
  function sync(){const s=S();if(s.day!==D()){if(s.day&&!s.w.some(x=>x)&&s.op!=='anchor'){s.rp=Math.max(0,s.rp-10);s.ms++}s.day=D();s.w=[0,0,0]}const t=X.tdy();TH.forEach((v,i)=>{if(!s.w[i]&&t>=v){s.w[i]=1;const b=rank(s.rp);s.rp+=25*(i+1)+(s.op==='hacker'?5:0);if(s.op==='rusher')pay(10);try{toast('🛡️ Round '+(i+1)+' won! +'+(25*(i+1)+(s.op==='hacker'?5:0))+' RP')}catch(e){}if(rank(s.rp)>b){pay(100,'🛡️ RANK UP: '+RK[rank(s.rp)][0]+'! +100 🪙');splash('RANK UP',RK[rank(s.rp)][0],'#ffd166','🛡️')}}})}
  onSP(id,sync);tick.push(()=>{if(X.own(id))sync()});
  PAN[id]={ico:'🛡️',title:'Ranked Squad',hud:()=>`🛡️ RANKED · ${RK[rank(S().rp)][0]} · ${S().rp} RP · rounds ${S().w.filter(x=>x).length}/3`,mini:()=>`🛡️ ${RK[rank(S().rp)][0]} ${S().rp}RP`,
   body:()=>{sync();const s=S(),r=rank(s.rp),nx=RK[r+1];return `<p class="sfp">Three rounds a day: win them by reaching 10, 25 and 50 SP today. Win rounds to gain RP. A day with no wins loses RP.</p><p class="sfp"><b>${RK[r][0]}</b> · ${s.rp} RP${nx?' · next '+nx[0]+' at '+nx[1]:''}</p>${nx?bar(s.rp-RK[r][1],nx[1]-RK[r][1]):''}<p class="sfp">${TH.map((v,i)=>(s.w[i]?'✅':'⬜')+' Round '+(i+1)+' ('+v+' SP)').join('<br>')}</p><p class="sfp">Operator:</p><div class="sfl">${Object.entries(OP).map(([k,o])=>`<button data-sf="op" data-k="${k}" class="${s.op===k?'on':''}">${o[1]} ${o[0]} <small>${o[2]}</small></button>`).join('')}</div>`},
   act:(a,t)=>{if(a==='op')S().op=t.dataset.k}}}

 /* ---- Quiet Contract: timed contracts ---- */
 {const id='quiet',S=()=>ST(id,{c:[],a:null,done:0,sa:0});const N=['Mr. Brass','Ms. Velvet','The Chancellor','Dr. Ashgrove','Lord Marrow','Madame Quill','Baron Ink','The Collector'];
  const gen=s=>{s.c=[15,30,50].map((n,i)=>({n:pick(N),need:n,min:[20,35,50][i]}))};
  onSP(id,d=>{const s=S();if(!s.a)return;s.a.got+=d;if(s.a.got>=s.a.need){const tot=s.a.min*60000,left=tot-(now()-s.a.start),sa=left>tot*.5,c=Math.round(s.a.need*.8*(sa?1.5:1));s.done++;if(sa)s.sa++;pay(c,(sa?'🕴️ SILENT ASSASSIN! ':'🕴️ Contract complete. ')+'+'+c+' 🪙');splash(sa?'SILENT ASSASSIN':'CONTRACT DONE','+'+c+' coins','#e03131','🕴️');s.a=null;gen(s)}});
  tick.push(()=>{if(!X.own(id))return;const s=S();if(!s.c.length)gen(s);if(s.a&&now()>s.a.start+s.a.min*60000){s.a=null;gen(s);try{toast('🕴️ Contract failed: the target got away')}catch(e){}}});
  PAN[id]={ico:'🕴️',title:'Contracts',hud:()=>`🕴️ CONTRACT · ${S().a?'<b>ACTIVE</b> '+S().a.got+'/'+S().a.need+' SP':'idle'} · ${S().done} done · ${S().sa} silent`,mini:()=>`🕴️ ${S().a?S().a.got+'/'+S().a.need:'Contracts'}`,
   body:()=>{const s=S();if(!s.c.length)gen(s);if(s.a){const l=Math.max(0,Math.ceil((s.a.start+s.a.min*60000-now())/1000));return `<p class="sfp"><b>Target: ${esc(s.a.n)}</b></p>${bar(s.a.got,s.a.need)}<p class="sfp">Earn <b>${s.a.need-s.a.got}</b> more SP · time left <b>${Math.floor(l/60)}:${String(l%60).padStart(2,'0')}</b></p><p class="sfp"><small>Finish with more than half the time left for a Silent Assassin bonus (×1.5).</small></p>`}
    return `<p class="sfp">Accept a contract: earn the SP before time runs out. Be quick and quiet for a bonus.</p>${s.c.map((c,i)=>`<p class="sfp"><b>${esc(c.n)}</b> · ${c.need} SP in ${c.min} min · pays ${Math.round(c.need*.8)} ${btn('acc','Accept','data-i="'+i+'"')}</p>`).join('')}<p class="sfp">Done <b>${s.done}</b> · Silent Assassin ${s.sa}</p>`},
   act:(a,t)=>{const s=S(),c=s.c[+t.dataset.i];if(a==='acc'&&c&&!s.a)s.a={n:c.n,need:c.need,min:c.min,got:0,start:now()}}}}

 /* ---- Ink & Banner: conquer the map ---- */
 {const id='inkbanner',S=()=>ST(id,{tr:0,o:(()=>{const a=Array(25).fill(0);a[20]=1;return a})(),cl:0,won:0});
  const def=i=>{const r=Math.floor(i/5),c=i%5;return 10+(4-r)*8+c*4};
  const adj=(s,i)=>{const r=Math.floor(i/5),c=i%5;return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].some(([y,x])=>y>=0&&y<5&&x>=0&&x<5&&s.o[y*5+x])};
  onSP(id,d=>{S().tr+=d*3});
  PAN[id]={ico:'🏯',title:'Campaign Map',hud:()=>`🏯 CAMPAIGN · ${S().o.filter(x=>x).length}/25 lands · ${Math.floor(S().tr)} troops`,mini:()=>`🏯 ${S().o.filter(x=>x).length}/25`,
   body:()=>{const s=S(),n=s.o.filter(x=>x).length;return `<p class="sfp">Study raises troops (3 per SP). Attack a land next to yours by paying its defence. Claim daily tax from your lands.</p><p class="sfp">Troops <b>${Math.floor(s.tr)}</b> · Lands <b>${n}/25</b></p><div class="inkg">${s.o.map((v,i)=>v?`<span class="own">🏯</span>`:adj(s,i)?`<button data-sf="at" data-i="${i}" ${s.tr<def(i)?'disabled':''}>⚔️<small>${def(i)}</small></button>`:`<span class="lk">▪️</span>`).join('')}</div>${btn('tax','💰 Daily tax (+'+n*2+')','',s.cl===D())}`},
   act:(a,t)=>{const s=S();if(a==='at'){const i=+t.dataset.i;if(!s.o[i]&&adj(s,i)&&s.tr>=def(i)){s.tr-=def(i);s.o[i]=1;sfx([392,523,659],'square',.05,.08);if(s.o.every(x=>x)&&!s.won){s.won=1;pay(300,'🏯 The whole map is yours! +300 🪙')}}}else if(a==='tax'&&s.cl!==D()){s.cl=D();pay(s.o.filter(x=>x).length*2,'💰 Tax collected')}}}}

 /* ---- Save Point Underground: encounters, spare or fight ---- */
 {const id='savepoint',S=()=>ST(id,{exp:0,gold:0,sp:0,kill:0,enc:null,next:0});const MN=[['Mossling','🌿'],['Dust Bunny','🐇'],['Grumble Pot','🍲'],['Sleepy Ghost','👻'],['Pebble Pal','🪨']];
  const lv=s=>1+Math.floor(s.exp/20);
  onSP(id,d=>{const s=S();if(s.enc)s.enc.eff+=d});
  tick.push(()=>{if(!run(id))return;const s=S();if(!s.next)s.next=now()+3*60000;if(!s.enc&&now()>s.next){s.enc={m:pick(MN),eff:0};sfx([330,262],'square',.06,.1);try{toast('⭐ A monster blocks the way! Study a little, then choose.')}catch(e){}}});
  const route=s=>s.kill===0&&s.sp>=5?'Pacifist':s.kill>=8&&s.sp<2?'No Mercy':'Neutral';
  const fin=(s)=>{s.enc=null;s.next=now()+(8+rnd(6))*60000};
  PAN[id]={ico:'⭐',title:'Save Point',hud:()=>`⭐ LV ${lv(S())} · EXP ${S().exp} · ${route(S())} route`,mini:()=>`⭐ LV ${lv(S())}${S().enc?' ⚠️':''}`,
   body:()=>{const s=S(),e=s.enc;return `<p class="sfp">Monsters appear while you study. Earn 5 SP, then choose: Spare them (mercy) or Fight for EXP. Your choices decide your route.</p><p class="sfp">LV <b>${lv(s)}</b> · EXP ${s.exp} · Gold ${s.gold}</p>${e?`<div class="sfalert">${e.m[1]} <b>${e.m[0]}</b> appears!<br>Effort: ${Math.min(5,e.eff)}/5 SP</div><div class="sfrow">${btn('sp','✋ Spare','',e.eff<5)}${btn('fg','⚔️ Fight','',e.eff<5)}</div>`:`<p class="sfp"><small>* The air is quiet. You feel determined.</small></p>`}<p class="sfp">Route: <b>${route(s)}</b> · Spared ${s.sp} · Fought ${s.kill}</p>`},
   act:a=>{const s=S();if(!s.enc||s.enc.eff<5)return;if(a==='sp'){s.sp++;s.gold+=15;pay(8,'✋ You spared '+s.enc.m[0]+'. +8 🪙');if(s.sp===10&&s.kill===0)pay(100,'⭐ Pacifist! +100 🪙');fin(s)}else if(a==='fg'){s.kill++;s.exp+=8;s.gold+=25;pay(10,'⚔️ '+s.enc.m[0]+' defeated. +8 EXP, +10 🪙');fin(s)}}}}
})();

