/* ===================== v4: Winter Workshop Advent Calendar (Dec 1 to Jan 6) ===================== */
CFSETS.adv=['❄️','⛄','🎄','🎁','🍪'];
const ADV_ITEMS=[ /* sorted by rarity: handed out along the month, rarest near Christmas Eve */
 ['adv_av_deer','avatar','Avatar 🦌','common',{av:'🦌'}],['adv_av_snowman','avatar','Avatar ⛄','common',{av:'⛄'}],['adv_av_tree','avatar','Avatar 🎄','common',{av:'🎄'}],
 ['adv_t_snowed','title','Snowed In With Homework','common',{title:'Snowed In With Homework'}],['adv_fl_sock','flair','Flair 🧦','common',{flair:'🧦'}],
 ['adv_av_santa','avatar','Avatar 🎅','rare',{av:'🎅'}],['adv_av_mrs','avatar','Avatar 🤶','rare',{av:'🤶'}],['adv_t_elf','title','Elf On The Stack','rare',{title:'Elf On The Stack'}],
 ['adv_fl_cookie','flair','Flair 🍪','rare',{flair:'🍪'}],['adv_fl_candle','flair','Flair 🕯️','rare',{flair:'🕯️'}],['adv_cf','confetti','Snowfall','rare',{cf:'adv',i:'❄️⛄🎄🎁🍪'}],
 ['adv_toast','toast','Gift tag notifications','rare',{key:'adv_tag'}],
 ['adv_av_elf','avatar','Avatar 🧝','epic',{av:'🧝'}],['adv_av_sleigh','avatar','Avatar 🛷','epic',{av:'🛷'}],['adv_t_compile','title','Santa Claus Is Compiling','epic',{title:'Santa Claus Is Compiling'}],
 ['adv_chip','chip','Fairy lights top bar','epic',{key:'adv_lights'}],
 ['adv_av_star','avatar','Avatar 🌟','legendary',{av:'🌟'}],['adv_t_o1','title','Jingle All The Way To O(1)','legendary',{title:'Jingle All The Way To O(1)'}]];
ADV_ITEMS.forEach(([id,c,n,r,x])=>addC(c,id,n,r,Object.assign({pack:'adv'},x)));
const ADV_TRANS=[['snowdrift','Snowdrift','❄️','rare',.6,'cubic-bezier(.2,.7,.2,1)','from{opacity:0;transform:translateY(-38px);filter:blur(6px)}to{opacity:1;transform:none;filter:blur(0)}'],
 ['sleigh','Sleigh dash','🛷','epic',.6,'cubic-bezier(.2,.8,.2,1)','0%{opacity:0;transform:translateX(110%) rotate(2deg)}70%{opacity:1;transform:translateX(-3%)}100%{transform:none}'],
 ['unwrap','Gift unwrap','🎁','legendary',.8,'cubic-bezier(.5,0,.2,1)','from{clip-path:inset(46% 46% 46% 46% round 48px);transform:scale(.9) rotate(-2deg)}to{clip-path:inset(0 0 0 0 round 0);transform:none}']];
ADV_TRANS.forEach(t=>addC('trans','tr_'+t[0],t[1]+' transition',t[3],{key:t[0],i:t[2],pack:'adv'}));
{let css='@media(prefers-reduced-motion:no-preference){';ADV_TRANS.forEach(([k,n,i,r,d,e,kf])=>{css+=`@keyframes tr-${k}{${kf}}html[data-tr=${k}] #home.hxin,html[data-tr=${k}] #views iframe.on.hxin{animation:tr-${k} ${d}s ${e} both}html[data-tr=${k}] #home.hxin .wrap>*{animation:none}.trpv[data-tr=${k}] i{animation:tr-${k} ${d+1.1}s ${e} infinite}`});
 css+='}html:root[data-chip=adv_lights] #chip,.chippv[data-chip=adv_lights]{--chip-img:linear-gradient(#0b3d24,#0b3d24);--chip-fg:#fff;--fg:#fff;--acc:#ffd166;border:2px dashed #e63946;border-radius:14px;animation:advlt 2.4s linear infinite}@keyframes advlt{0%{box-shadow:0 0 0 2px #0b3d24,0 0 10px #ff4d6d}33%{box-shadow:0 0 0 2px #0b3d24,0 0 10px #ffd166}66%{box-shadow:0 0 0 2px #0b3d24,0 0 10px #5fcf80}100%{box-shadow:0 0 0 2px #0b3d24,0 0 10px #4aa8ff}}html:root[data-toast=adv_tag] #toast,.toastpv[data-toast=adv_tag]{background:#fff7e6;color:#7a1f1f;border:2px solid #c62828;border-radius:4px 16px 16px 4px;font-family:Georgia,serif}';
 const st=document.createElement('style');st.id='hxadv';st.textContent=css;document.head.appendChild(st)}
const SRCLIST_PATCHED=1;

/* ---- calendar maths ---- */
const ADV_NOEX=[4,9,14,19,21,23],ADV_ITEMDAYS=[1,2,3,5,6,7,8,10,11,12,13,15,16,17,18,20,22,24],ADV_RAR=['common','rare','epic','legendary'];
const ADV_MS=[[6,'120 coins + the Snowdrift transition',()=>{M.coins+=120;M.inv.own.tr_snowdrift=1}],[12,'a Gold Crate + the Sleigh dash transition',()=>{M.inv.box.gold=(M.inv.box.gold||0)+1;M.inv.own.tr_sleigh=1}],[18,'2 Discovery Crates + 50 SP',()=>{M.inv.box.disc=(M.inv.box.disc||0)+2;addSP(50,'Winter Advent','hx')}],[24,'the legendary Gift unwrap transition + 2 Gold Crates',()=>{M.inv.box.gold=(M.inv.box.gold||0)+2;M.inv.own.tr_unwrap=1}]];
let advDemo={on:false,day:12,S:null},advSel=0;
const advFresh=Y=>({y:Y,open:{},left:[],melt:{},ms:{},lcn:0});
function advReal(){const n=new Date(),y=n.getFullYear(),m=n.getMonth(),d=n.getDate();
 if(m===11&&d<=24)return{phase:'doors',door:d,Y:y,sub:0};
 if(m===11)return{phase:'after',door:24,Y:y,sub:d-24};
 if(m===0&&d<=6)return{phase:'after',door:24,Y:y-1,sub:d+7};
 if(m===10&&d>=20)return{phase:'pre',door:0,Y:y,sub:0,teaser:1,days:Math.ceil((new Date(y,11,1)-n)/864e5)};
 return{phase:'closed',door:0,Y:y,sub:0}}
function advCtx(realOnly){if(advDemo.on&&!realOnly){const y=new Date().getFullYear(),dd=advDemo.day;return dd<=24?{phase:'doors',door:dd,Y:y,sub:0,demo:1}:{phase:'after',door:24,Y:y,sub:dd-24,demo:1}}return advReal()}
function advS(c){if(c.demo){if(!advDemo.S){advDemo.S=advFresh(c.Y);advDemo.S.sparks=3}return advDemo.S}if(!M.adv||M.adv.y!==c.Y)M.adv=advFresh(c.Y);return M.adv}
const advIdx=c=>c.phase==='doors'?c.door:24+c.sub;
function advSparks(c,S){let earned=0;if(c.demo)earned=S.sparks||0;else{const cur=advIdx(c),start=dayN()-(cur-1);for(let k=0;k<cur;k++)if(M.goal&&M.goal[start+k])earned++}
 return Math.max(0,earned-Object.values(S.melt).filter(v=>v==='spark').length)}
const advPerm=Y=>{const R=rng(Y*77+5),a=Array.from({length:24},(_,i)=>i+1);for(let i=23;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function advGifts(Y,D){const R=rng(Y*1009+D*131+7),ix=ADV_ITEMDAYS.indexOf(D),g=[];
 g.push(ix>=0?{t:'item',id:ADV_ITEMS[ix][0],r:ADV_ITEMS[ix][3]}:(D%2?{t:'crate',k:'gold',r:'epic'}:{t:'crate',k:'disc',r:'rare'}));
 const A=[{t:'coins',n:25+D*5,r:'common'},{t:'sp',n:8+D,r:'common'},{t:'supply',k:'freeze',r:'rare'},{t:'supply',k:'boost',r:'rare'}];g.push(A[Math.floor(R()*4)]);
 const B=[{t:'crate',k:'fun',r:'rare'},{t:'crate',k:'style',r:'rare'},{t:'crate',k:'type',r:'rare'},{t:'crate',k:'crate',r:'common'},{t:'mystery',r:'epic'}];let b=B[Math.floor(R()*5)];if(D===8||D===16)b={t:'crate',k:'gold',r:'epic'};g.push(b);
 for(let i=2;i>0;i--){const j=Math.floor(R()*(i+1));[g[i],g[j]]=[g[j],g[i]]}return g.map((x,i)=>Object.assign({i,D},x))}
const advIcon=it=>it.av||it.flair||(it.c==='confetti'?'🎊':it.c==='title'?'🏷️':it.c==='toast'?'💬':it.c==='chip'?'💡':it.i||'🎁');
function advInfo(g){switch(g.t){
 case'coins':return{ico:'🪙',n:`${g.n} coins`,d:'Straight into your pocket.'};
 case'sp':return{ico:'⭐',n:`${g.n} SP`,d:`Counts toward your level, plus ${g.n} 🪙.`};
 case'supply':return g.k==='freeze'?{ico:'🧊',n:'Streak Freeze',d:'Saves your streak on a missed day.'}:{ico:'⚡',n:'30-minute Booster',d:'Double coins for half an hour.'};
 case'crate':return{ico:BOX[g.k].i,n:BOX[g.k].n,d:'One crate to open in the Shop.'};
 case'mystery':return{ico:'🎁',n:'Mystery present',d:'Reveals an item you do not own yet.'};
 case'item':{const it=cat(g.id),own=!!M.inv.own[g.id];return{ico:advIcon(it),n:it.n,d:own?'You already own this, so you get 60 coins instead.':'Advent exclusive · '+(CATN[it.c]||it.c)+' · '+RAR[it.r].n,ex:1}}}
 return{ico:'🎁',n:'Gift',d:''}}
function advMystery(){const pool=boxPool('disc');if(!pool.length)return null;const W={common:.4,rare:.35,epic:.2,legendary:.05};let x=Math.random(),rar='common';for(const k of ADV_RAR){x-=W[k];if(x<0){rar=k;break}}let p=pool.filter(i=>i.r===rar);if(!p.length)p=pool;return p[Math.floor(Math.random()*p.length)]}
function advGrant(g,demo){if(demo)return{ico:advInfo(g).ico,txt:advInfo(g).n,r:g.r};let ico,txt,r=g.r;
 switch(g.t){
  case'coins':M.coins+=g.n;ico='🪙';txt=`+${g.n} coins`;break;
  case'sp':addSP(g.n,'Winter Advent','hx');ico='⭐';txt=`+${g.n} SP and +${g.n} 🪙`;break;
  case'supply':if(g.k==='freeze'){M.inv.qty.freeze=(M.inv.qty.freeze||0)+1;ico='🧊';txt='Streak Freeze added'}else{M.inv.boost=Math.max(Date.now(),M.inv.boost||0)+30*60000;ico='⚡';txt='30-minute Booster is running'}break;
  case'crate':M.inv.box[g.k]=(M.inv.box[g.k]||0)+1;ico=BOX[g.k].i;txt=BOX[g.k].n+' added to your crates';break;
  case'mystery':{const it=advMystery();if(it){M.inv.own[it.id]=1;ico='🎁';txt='Mystery: '+it.n+' ('+RAR[it.r].n+')';r=it.r}else{M.coins+=80;ico='🪙';txt='+80 coins (you own everything!)'}break}
  case'item':{const it=cat(g.id);if(M.inv.own[g.id]){M.coins+=60;ico='🪙';txt='Already owned: +60 coins'}else{M.inv.own[g.id]=1;ico=advIcon(it);txt='New: '+it.n}break}}
 return{ico,txt,r}}
function advDoorState(c,S,D){if(S.open[D])return'open';if(c.phase==='doors'&&D===c.door)return'today';if(D<advIdx(c)||(c.phase==='after'))return S.melt[D]?'ready':'frozen';return c.phase==='doors'&&D===c.door+1?'next':'future'}
const advLeftTxt=()=>{const n=new Date(),ms=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1)-n,h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4);return `${h}h ${m}m`};
const advAllow=(c,S)=>c.phase==='after'?Math.max(0,3+(c.sub-1)-(S.lcn||0)):0;

/* ---- actions ---- */
function advAfter(c,S,D){let n=0;for(const k in S.open)n++;ADV_MS.forEach(([t,txt,fn])=>{if(n>=t&&!S.ms[t]){S.ms[t]=1;if(!c.demo){fn();toast('🎄 Tree milestone ('+t+' doors)! You got '+txt+'.');try{confetti(true)}catch(e){}}}});
 if(!c.demo){mDirty=true;mSave();paintChip();try{checkSets();checkAch()}catch(e){}}}
function advPick(D,i){const c=advCtx(),S=advS(c),st=advDoorState(c,S,D);if(st!=='today'&&st!=='ready')return;const gs=advGifts(c.Y,D),g=gs[i],res=advGrant(g,c.demo);
 S.open[D]={i,ico:res.ico,txt:res.txt,r:res.r};gs.forEach(x=>{if(x.i!==i)S.left.push(D+':'+x.i)});
 toast('🎁 Door '+D+': '+res.txt);if(!c.demo)try{confetti(true)}catch(e){}advAfter(c,S,D);advSel=D;advRender()}
function advMelt(D,how){const c=advCtx(),S=advS(c);if(advDoorState(c,S,D)!=='frozen')return;
 if(how==='spark'){if(advSparks(c,S)<1)return;S.melt[D]='spark'}else{const cost=c.phase==='after'?40:60;if(c.demo){}else{if(M.coins<cost){toast('Not enough coins yet. A Melt Spark is free: reach your daily goal! 🪙');return}M.coins-=cost}S.melt[D]='coins'}
 if(!c.demo){mDirty=true;mSave();paintChip()}toast('☀️ Door '+D+' melted! Pick a gift.');advRender()}
function advClaimLeft(key){const c=advCtx(),S=advS(c);if(advAllow(c,S)<1)return;const j=S.left.indexOf(key);if(j<0)return;const [D,i]=key.split(':').map(Number),g=advGifts(c.Y,D)[i],res=advGrant(g,c.demo);S.left.splice(j,1);S.lcn=(S.lcn||0)+1;
 toast('🎁 Leftover from door '+D+': '+res.txt);if(!c.demo){try{confetti(true)}catch(e){}mDirty=true;mSave();paintChip()}advRender()}

/* ---- modal ---- */
const advOpenCal=()=>{const c=advCtx();if(c.phase==='pre'||c.phase==='closed'){if(!advDemo.on){advDemo={on:true,day:12,S:null}}}
 const c2=advCtx();if(!advSel||advDoorState(c2,advS(c2),advSel)==='future'){const S=advS(c2);advSel=c2.phase==='doors'&&!S.open[c2.door]?c2.door:(Array.from({length:24},(_,i)=>i+1).find(D=>['today','ready'].includes(advDoorState(c2,S,D)))||c2.door||1)}advRender()};
function advRender(){const c=advCtx(),S=advS(c),b=hxOpen('advent','🎄 Winter Workshop Advent'+(c.demo?' · demo':''));if(!c.demo)hxTick('advent');
 const idx=advIdx(c),opened=Object.keys(S.open).length,sp=advSparks(c,S),perm=advPerm(c.Y),rows=[2,3,4,4,5,6];let k=0;
 const door=D=>{const st=advDoorState(c,S,D),o=S.open[D],cls=(st==='open'?'open':st==='today'?'today':st==='ready'?'ready':st==='frozen'?'frozen':st==='next'?'next':'future')+(advSel===D?' sel':'');
  const inner=st==='open'?o.ico:st==='frozen'?'❄️':st==='today'||st==='ready'?'🎁':'<span>'+D+'</span>';
  return `<button class="advd ${cls}" style="${st==='open'?'--c:'+RAR[o.r||'common'].c:''}" data-hx="advdoor" data-d="${D}" aria-label="Door ${D}, ${st}">${inner}<small>${D}</small></button>`};
 const tree=`<div class="advtree"><div class="advstar ${opened>=24?'on':''}" title="Open all 24 doors to light the star">★</div>${rows.map(n=>`<div class="advrow">${perm.slice(k,k+=n).map(door).join('')}</div>`).join('')}<div class="advtrunk"></div></div>`;
 // selected door panel
 let panel='';const D=advSel;if(D){const st=advDoorState(c,S,D),gs=advGifts(c.Y,D);
  const card=(g,mode)=>{const f=advInfo(g),col=RAR[g.r].c;return `<div class="advg ${mode==='dim'?'dim':''} ${S.open[D]&&S.open[D].i===g.i?'won':''}" style="--c:${col}"><div class="advgi">${f.ico}</div><b>${ESCX(f.n)}</b><small>${ESCX(f.d)}</small><span class="advr" style="color:${col}">● ${RAR[g.r].n}</span>${mode==='pick'?`<button class="pri" data-hx="advpick" data-d="${D}" data-i="${g.i}">Take this one</button>`:S.open[D]?(S.open[D].i===g.i?'<em>✓ Your pick</em>':'<em>Went under the tree</em>'):''}</div>`};
  if(st==='today'||st==='ready')panel=`<h3>Door ${D}: choose 1 of 3</h3><p>The two you leave behind are wrapped up and kept <b>under the tree</b>. You can open them later, on Christmas morning and through the twelve days after.</p><div class="advgs">${gs.map(g=>card(g,'pick')).join('')}</div>`;
  else if(st==='open')panel=`<h3>Door ${D}: opened ✓</h3><div class="advgs">${gs.map(g=>card(g,'see')).join('')}</div>`;
  else if(st==='frozen')panel=`<h3>Door ${D} is frozen ❄️</h3><p>You missed it, so it froze over. Melt it and you still get to pick.</p><div class="advgs">${gs.map(g=>card(g,'dim')).join('')}</div><div class="hxbt"><button class="pri" data-hx="advmelt" data-d="${D}" data-how="spark" ${sp?'':'disabled'}>☀️ Use a Melt Spark (${sp})</button><button data-hx="advmelt" data-d="${D}" data-how="coins">🪙 Melt for ${c.phase==='after'?40:60}</button></div><p>Melt Sparks are free: you earn one every day you reach your daily study goal.</p>`;
  else if(st==='next'){const ex=gs.find(x=>x.t==='item')||gs.reduce((a,x)=>ADV_RAR.indexOf(x.r)>ADV_RAR.indexOf(a.r)?x:a,gs[0]);panel=`<h3>Door ${D}: opens in ${advLeftTxt()}</h3><p>A sneak peek: tomorrow's best present is wrapped in <b style="color:${RAR[ex.r].c}">${RAR[ex.r].n.toLowerCase()}</b> paper${ex.t==='item'?' and it is an <b>Advent exclusive</b>':''}. Come back to see it!</p>`}
  else panel=`<h3>Door ${D}</h3><p>This door opens on December ${D}.</p>`}
 const L=S.left,allow=advAllow(c,S);
 const left=`<h3>🎁 Under the tree <small>(${L.length} left behind)</small></h3>`+(c.phase==='after'?`<p>Christmas morning! You can open <b>${allow}</b> leftover gift${allow===1?'':'s'} now (3 today, then 1 every day until Jan 6, and unused ones stack up).</p>`:`<p>Gifts you did not pick wait here. They unlock on <b>Dec 25</b>: 3 on Christmas morning, then 1 a day for the twelve days after.</p>`)+
  (L.length?`<div class="advleft">${L.slice().sort((a,b)=>a.split(':')[0]-b.split(':')[0]).map(key=>{const [dd,ii]=key.split(':').map(Number),g=advGifts(c.Y,dd)[ii],f=advInfo(g);return `<button class="advl" style="--c:${RAR[g.r].c}" data-hx="advleft" data-k="${key}" ${allow>0?'':'disabled'} title="${ESCX(f.n)}"><span>${f.ico}</span><small>${dd}</small></button>`}).join('')}</div>`:'<p><i>Nothing left behind yet.</i></p>');
 const ms=`<h3>🌟 Tree milestones</h3><div class="advms">${ADV_MS.map(([t,txt])=>`<div class="${S.ms[t]?'done':''}"><b>${S.ms[t]?'✓ ':''}${t} doors</b><small>${ESCX(txt)}</small></div>`).join('')}</div>`;
 const head=`<div class="advhead"><div><b>${c.phase==='doors'?'Day '+c.door+' of 24':c.phase==='after'?'Twelve days of leftovers':'Opens Dec 1'}</b><small>${c.phase==='doors'?(S.open[c.door]?'Today\'s door is open ✓ · next door in '+advLeftTxt():'A new door is waiting for you!'):'Doors opened: '+opened+'/24'}</small></div><div class="advsp" title="Reach your daily study goal to earn a Melt Spark">☀️ ${sp} Melt Spark${sp===1?'':'s'}</div></div>`;
 const demo=c.demo?`<div class="advdemo"><b>Demo mode:</b> nothing here is saved or given to you. Pretend today is day <b id="advdv">${advDemo.day}</b>: <input type="range" id="advday" min="1" max="37" value="${advDemo.day}" aria-label="Demo day"> <button data-hx="advreset">Reset demo</button></div>`:'';
 b.innerHTML=`${demo}${head}${tree}<div id="advpanel">${panel}</div>${left}${ms}<p class="advfine">Real calendar: Dec 1 to Dec 24 (a new door each day), leftovers Dec 25 to Jan 6. Exclusive items are not found anywhere else.</p>`}
const hxTick=()=>{};
function advClick(a,t){const d=+t.dataset.d;
 if(a==='advopen'){advDemo.on=false;advOpenCal()}
 else if(a==='advreset'){advDemo.S=null;advSel=0;advOpenCal()}
 else if(a==='advdoor'){advSel=d;advRender()}
 else if(a==='advpick')advPick(d,+t.dataset.i);
 else if(a==='advmelt')advMelt(d,t.dataset.how);
 else if(a==='advleft')advClaimLeft(t.dataset.k)}
function advDemoDay(v){advDemo.day=v;advSel=0;advOpenCal()}

/* ---- home card, tab and daily nudge ---- */
function hxAdvCard(){const c=advReal();if(c.phase==='closed'||c.phase==='pre')return '';let title,sub,btn,cls='';
 if(c.phase==='pre'){title='🎄 Winter Workshop Advent';sub=`Opens in <b>${c.days} day${c.days===1?'':'s'}</b>: 24 doors, one gift a day that <b>you choose</b>, and exclusive Christmas items you can't get anywhere else.`;btn='<button class="pri" data-hx="advdemo">👀 Preview the calendar</button>'}
 else{const S=advS(c),opened=Object.keys(S.open).length;
  if(c.phase==='doors'){const done=!!S.open[c.door];title=`🎄 Winter Advent · Day ${c.door} of 24`;sub=done?`Today's door is open ✓ · the next one opens in <b>${advLeftTxt()}</b>. Doors opened: ${opened}/24.`:`<b>A new door is waiting.</b> Pick 1 of 3 gifts. Doors opened: ${opened}/24.`;cls=done?'':' hot'}
  else{const a=advAllow(c,S);title='🎄 Winter Advent · Leftover days';sub=`You can open <b>${a}</b> leftover gift${a===1?'':'s'} from under the tree. Doors opened: ${opened}/24.`;cls=a?' hot':''}
  btn='<button class="pri" data-hx="advopen">🎁 Open the calendar</button>'}
 return `<div class="advcard${cls}"><div class="advsnow" aria-hidden="true"></div><div><b>${title}</b><span>${sub}</span></div><div class="hxbtn">${btn}</div></div>`}
function advTabSync(){const c=advReal(),show=c.phase==='doors'||c.phase==='after';let b=$('advTab');
 if(show&&!b){b=document.createElement('button');b.id='advTab';b.onclick=()=>{advDemo.on=false;advOpenCal()};tabs.insertBefore(b,tabs.children[2]||null)}
 if(b){if(!show){b.remove();return}const S=advS(c),ready=c.phase==='doors'?!S.open[c.door]:advAllow(c,S)>0;b.className='advtab'+(ready?' ready':'');b.innerHTML='🎄 Advent'+(ready?'<span class="hxnew" style="color:#c62828">1</span>':'')}}
setInterval(()=>{try{advTabSync();if(cur==='')softRefresh()}catch(e){}},60000);
setTimeout(()=>{try{advTabSync();const c=advReal();if(c.phase==='doors'||c.phase==='after'){const S=advS(c);if(S.seen!==dayN()){S.seen=dayN();mDirty=true;if(c.phase==='doors'&&!S.open[c.door])toast('🎄 Today\'s Advent door is open! Choose your gift.');else if(c.phase==='after'&&advAllow(c,S)>0)toast('🎄 Leftover gifts are waiting under the tree!')}}}catch(e){}},2600);

