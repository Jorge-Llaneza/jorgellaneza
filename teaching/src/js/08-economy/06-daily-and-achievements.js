/* ===== part 3f: daily login rewards, daily challenges, achievements ===== */
const LOGIN=[{c:20,ic:'🪙',s:'20'},{c:30,ic:'🪙',s:'30'},{b:{crate:1},ic:'📦',s:'Crate'},{c:50,fz:1,ic:'🧊',s:'50 + freeze'},{b:{fun:1},ic:'🎲',s:'Fun Crate'},{c:70,ic:'💰',s:'70'},{c:30,b:{gold:1},ic:'🎁',s:'Gold Crate'}];
const LOGIN_TXT=['🪙 20 coins','🪙 30 coins','📦 a Study Crate','🪙 50 coins and 🧊 a Streak freeze','🎲 a Fun Crate','🪙 70 coins','🎁 a Golden Crate and 🪙 30 coins'];
const CRATE_NAME={crate:'Study Crate',fun:'Fun Crate',style:'Style Crate',gold:'Golden Crate'};
function rewardText(r){const t=[];if(r.c)t.push('🪙 '+r.c);if(r.b)for(const k in r.b)t.push(`${r.b[k]>1?r.b[k]+'× ':''}${CRATE_NAME[k]||k}`);if(r.fz)t.push('🧊 Streak freeze');(r.i||[]).forEach(id=>{const it=cat(id);if(it)t.push(it.n)});return t.join(' + ')}
function giveReward(r){if(r.c)M.coins+=r.c;if(r.b)for(const k in r.b)M.inv.box[k]=(M.inv.box[k]||0)+r.b[k];if(r.fz)M.inv.qty.freeze=(M.inv.qty.freeze||0)+r.fz;(r.i||[]).forEach(id=>{if(cat(id))M.inv.own[id]=1});mDirty=true}
/* ---- daily login (needs a little real study first) ---- */
const studiedEnough=()=>{const d=dayN();return (M.ld[d]||0)>=10||(M.td.d===d&&M.td.s>=300)};
function dcTime(){const d=dayN();if(M.td.d!==d)M.td={d,s:0};M.td.s++;if(M.td.s%30===0)dcCheck()}
function dlInfo(){const d=dayN(),L=M.dl,claimed=L.last===d;let day,cont=false;if(claimed){day=L.day;cont=true}else if(L.last&&d>L.last&&d-L.last<=2){day=L.day%7+1;cont=true}else day=1;return{claimed,day,cont,can:!claimed&&d>L.last&&studiedEnough()}}
const dlReady=()=>{try{return dlInfo().can}catch(e){return false}};
function dlClaim(){const i=dlInfo();if(!i.can){toast(i.claimed?'Already claimed today. Come back tomorrow!':'Study a little first: 5 minutes or 10 SP.');return}
 M.dl={last:dayN(),day:i.day,tot:(M.dl.tot||0)+1};giveReward(LOGIN[i.day-1]);mSave();toast('🎁 Daily reward claimed: '+LOGIN_TXT[i.day-1]);confetti();paintChip();checkAch();if(cur==='')renderPane('')}
/* ---- daily challenges ---- */
const scoreN=()=>Object.values(M.scores).reduce((a,l)=>a+l.length,0),cnt=k=>(M.dc.cnt&&M.dc.cnt[k])||0;
const DCP={
 sp:{t:[20,45,90],tx:n=>`Earn ${n} learning SP`,raw:()=>M.ld[dayN()]||0},
 min:{t:[5,12,25],tx:n=>`Study actively for ${n} minutes`,raw:()=>(M.td.d===dayN()?M.td.s:0)/60},
 labs:{t:[1,2,3],tx:n=>`Learn in ${n} different lab${n>1?'s':''}`,raw:()=>Object.keys((M.wu&&M.wu.d===dayN()&&M.wu.k)||{}).length},
 learn:{t:[3,6,10],tx:n=>`Complete ${n} learning activities`,raw:()=>cnt('learn')},
 lessons:{t:[1,2,3],tx:n=>`Finish ${n} lesson${n>1?'s':''}`,raw:()=>cnt('lessons')},
 games:{t:[1,2,3],tx:n=>`Finish ${n} arcade game${n>1?'s':''}`,raw:()=>cnt('games')},
 right:{t:[8,15,25],tx:n=>`Answer ${n} arcade questions correctly`,raw:()=>M.stat.c},
 rev:{t:[3,6,10],tx:n=>`Review ${n} notebook questions`,raw:()=>cnt('rev')},
 master:{t:[1,2,3],tx:n=>`Master ${n} mistake${n>1?'s':''}`,raw:()=>M.mastered},
 crates:{t:[1,2,3],tx:n=>`Open ${n} crate${n>1?'s':''}`,raw:()=>M.loot.opened},
 hs:{t:[1,1,1],tx:()=>'Get on a high-score table',raw:()=>scoreN()}};
const DSLOT=[['sp','min','labs','learn'],['learn','lessons','labs','sp','min','rev','master'],['games','right','crates','hs','master','rev','sp']],DREW=[15,25,40];
const dsnap=()=>{const o={};for(const k in DCP)o[k]=DCP[k].raw();return o};
const dEligible=k=>k==='rev'||k==='master'?M.mist.length>0:k==='crates'?(M.coins>=60||Object.keys(BOX).some(b=>boxVisible(b)&&(M.inv.box[b]||0)>0)):true;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function dcEnsure(){const d=dayN();if(M.dc.d===d||d<M.dc.d)return;const R=rng(d*2654435761>>>0),used=new Set(),list=[];M.dc.cnt={};
 DSLOT.forEach((pool,tier)=>{const el=pool.filter(k=>!used.has(k)&&dEligible(k));const k=(el.length?el:pool.filter(x=>!used.has(x)))[Math.floor(R()*(el.length||pool.length))];used.add(k);list.push({k,tier,n:DCP[k].t[tier],done:0,b:{}})});
 const s=dsnap();list.forEach(x=>x.b=Object.assign({},s));M.dc.d=d;M.dc.list=list;M.dc.swap=0;M.dc.all=0;mDirty=true}
const dcVal=x=>Math.max(0,DCP[x.k].raw()-(x.b[x.k]||0));
function dcInc(k){try{dcEnsure();M.dc.cnt[k]=(M.dc.cnt[k]||0)+1;mDirty=true;dcCheck()}catch(e){}}
function dcCheck(){dcEnsure();let any=0;M.dc.list.forEach(x=>{if(x.done||dcVal(x)<x.n)return;x.done=1;any=1;M.dc.tot=(M.dc.tot||0)+1;giveReward({c:DREW[x.tier]});toast(`✅ Daily challenge done: ${DCP[x.k].tx(x.n)} · +${DREW[x.tier]} 🪙`)});
 if(any&&!M.dc.all&&M.dc.list.every(x=>x.done)){M.dc.all=1;const d=dayN();M.dc.streak=(M.dc.last===d-1)?(M.dc.streak||0)+1:1;M.dc.last=d;M.dc.allTot=(M.dc.allTot||0)+1;giveReward({c:30,b:{crate:1}});toast('🌟 All daily challenges complete! +30 🪙 and a Study Crate');confetti()}
 if(any){mDirty=true;checkAch();if(cur==='')renderPane('')}}
function dcSwap(i){dcEnsure();const x=M.dc.list[i];if(!x||x.done)return;if(M.dc.swap>=1){toast('You can swap one challenge per day.');return}
 const used=new Set(M.dc.list.map(y=>y.k)),pool=DSLOT[x.tier].filter(k=>!used.has(k)&&dEligible(k));if(!pool.length){toast('No other challenge fits right now.');return}
 const k=pool[Math.floor(Math.random()*pool.length)];M.dc.list[i]={k,tier:x.tier,n:DCP[k].t[x.tier],done:0,b:dsnap()};M.dc.swap=1;mDirty=true;renderPane('')}
function dailyHTML(){dcEnsure();const i=dlInfo(),d=dayN(),mins=Math.floor((M.td.d===d?M.td.s:0)/60),sp=Math.floor(M.ld[d]||0),done=M.dc.list.filter(x=>x.done).length;
 const days=LOGIN.map((r,k)=>{const n=k+1,st=i.cont&&(i.claimed?n<=i.day:n<i.day)?'got':n===i.day?'now':'';return `<div class="dlt ${st}"><small>Day ${n}</small><span>${r.ic}</span><small>${esc(r.s)}</small></div>`}).join('');
 const btn=i.claimed?'<span class="chip2">✓ Claimed today</span>':i.can?'<button class="pri" data-act="dlclaim">🎁 Claim reward</button>':`<span class="mut" style="font-size:12px">Study a little to unlock: ${Math.min(mins,5)}/5 min or ${Math.min(sp,10)}/10 SP</span>`;
 const rows=M.dc.list.map((x,k)=>{const v=DCP[x.k].raw?Math.min(x.n,Math.floor(dcVal(x))):0;return `<div class="dcr ${x.done?'done':''}"><div><b>${x.done?'✅':'🎯'} ${esc(DCP[x.k].tx(x.n))}</b><div class="bar2" style="margin:4px 0"><i style="width:${Math.min(100,(x.done?x.n:v)/x.n*100)}%"></i></div><small class="mut">${x.done?x.n:v}/${x.n} · 🪙 ${DREW[x.tier]}</small></div>${!x.done&&M.dc.swap<1?`<button data-act="dcswap" data-i="${k}" title="Swap this challenge" aria-label="Swap this challenge">🔄</button>`:''}</div>`}).join('');
 return `<h3>Daily</h3><div class="card daily"><div class="hrow"><b>🎁 Daily reward · Day ${i.day} of 7</b>${btn}</div><div class="dlg">${days}</div><div class="mut" style="font-size:12px;margin-top:6px">Claim it once a day after a little study. Missing more than one day starts the week over.</div>
 <div class="hrow" style="margin-top:12px"><b>🗓 Daily challenges · ${done}/3</b><span class="mut" style="font-size:12px">${M.dc.all?'All clear! ':'All three: 🪙 30 + a Study Crate. '}${(M.dc.streak||0)>1&&M.dc.last>=d-1?'🔗 '+M.dc.streak+' days in a row':''}</span></div>${rows}</div>`}
/* ---- achievements (rewards are paid automatically) ---- */
const ACHR={};
const AX=(id,ico,name,desc,fn,r,p)=>{BADGES.push([id,ico,name,desc,fn]);ACHR[id]={r,p}};
const setR=(id,r,p)=>{ACHR[id]={r,p}};
const ownN=()=>Object.keys(M.inv.own).length,gamesN=()=>Object.values(M.played).reduce((a,b)=>a+b,0),hrs=()=>totalSec()/3600,earnedN=()=>Object.keys(M.ach).length,fl=Math.floor;
['t_Polymath','t_Streak Legend','t_Marathon Mind','t_Treasure Hunter','t_Daily Devotee','t_Quest Master','t_Achievement Hunter'].forEach((id,k)=>addC('title',id,id.slice(2),'epic',{title:id.slice(2),noDrop:true}));
addC('flair','fl_✵','Flair ✵','epic',{flair:'✵',noDrop:true});
setR('first',{c:10},()=>[fl(M.sp),10]);setR('s3',{c:30},()=>[Math.min(3,M.streak.b||0),3]);setR('s7',{c:60,b:{crate:1}},()=>[Math.min(7,M.streak.b||0),7]);setR('explore',{c:40},()=>[Object.keys(M.seen).length,5]);setR('hour',{c:60},()=>[fl(totalSec()/60),60]);setR('arc',{c:20},()=>[Math.min(1,gamesN()),1]);setR('hof',{c:40},()=>[scoreN()?1:0,1]);setR('slay',{c:50},()=>[Math.min(5,M.mastered),5]);setR('sharp',{c:50},()=>[Math.min(50,M.stat.c),50]);setR('l5',{c:80,b:{crate:1}},()=>[Math.min(5,lvlOf(M.sp)),5]);
[[100,'💯','Century',{c:30}],[500,'📚','Page turner',{c:60}],[1000,'🎒','Dedicated',{c:50,b:{crate:1}}],[2500,'🧠','Big brain',{c:100,b:{fun:1}}],[5000,'🌟','Brilliant',{c:200,b:{style:1}}],[10000,'🔭','Polymath',{c:300,b:{gold:1},i:['t_Polymath']}]].forEach(([n,ic,nm,r])=>AX('sp'+n,ic,nm,`Earn ${n.toLocaleString()} Study Points`,()=>M.sp>=n,r,()=>[fl(Math.min(n,M.sp)),n]));
[[10,'🎖','Double digits',{c:100}],[20,'🥈','Veteran',{c:150,b:{gold:1}}],[30,'🥇','Elite',{c:300,b:{gold:1}}],[50,'👑','Grandmaster',{c:1000,b:{gold:3}}]].forEach(([n,ic,nm,r])=>AX('lv'+n,ic,nm,`Reach level ${n}`,()=>lvlOf(M.sp)>=n,r,()=>[Math.min(n,lvlOf(M.sp)),n]));
[[14,'🔥','Fortnight',{c:100,b:{crate:2}}],[30,'🌋','Unstoppable',{c:200,b:{gold:1}}],[60,'☄','Relentless',{c:300,b:{gold:2},i:['t_Streak Legend']}],[100,'🏔','Centurion',{c:500,b:{gold:3}}]].forEach(([n,ic,nm,r])=>AX('st'+n,ic,nm,`${n}-day study streak`,()=>(M.streak.b||0)>=n,r,()=>[Math.min(n,M.streak.b||0),n]));
[[5,'⏳','Five hours',{c:80,b:{crate:1}}],[20,'🕰','Marathon mind',{c:200,i:['t_Marathon Mind']}],[50,'⌛','Time lord',{c:300,b:{gold:1}}]].forEach(([n,ic,nm,r])=>AX('h'+n,ic,nm,`${n} hours of active study`,()=>hrs()>=n,r,()=>[Math.min(n,fl(hrs())),n]));
META.forEach(a=>AX('lab_'+a.id,a.icon,a.name+' regular','30 minutes in '+a.name,()=>(M.tsec[a.id]||0)>=1800,{c:40},()=>[Math.min(30,fl((M.tsec[a.id]||0)/60)),30]));
AX('round','⚖','Well-rounded','30 minutes in every lab',()=>META.every(a=>(M.tsec[a.id]||0)>=1800),{c:120,b:{gold:1}},()=>[META.filter(a=>(M.tsec[a.id]||0)>=1800).length,META.length]);
AX('round2','🏛','Lab master','1 hour in every lab',()=>META.every(a=>(M.tsec[a.id]||0)>=3600),{c:250,b:{style:1}},()=>[META.filter(a=>(M.tsec[a.id]||0)>=3600).length,META.length]);
[[10,'🎮','Gamer',{c:30}],[50,'🕹','Arcade regular',{c:80,b:{fun:1}}],[150,'👾','Arcade legend',{c:200,b:{gold:1}}]].forEach(([n,ic,nm,r])=>AX('g'+n,ic,nm,`Finish ${n} arcade games`,()=>gamesN()>=n,r,()=>[Math.min(n,gamesN()),n]));
[[250,'✅','Sharpshooter',{c:100}],[1000,'🎯','Deadeye',{c:250,b:{gold:1}}]].forEach(([n,ic,nm,r])=>AX('c'+n,ic,nm,`${n} correct answers in games`,()=>M.stat.c>=n,r,()=>[Math.min(n,M.stat.c),n]));
AX('hof3','👑','Triple crown','Get on 3 different high-score tables',()=>Object.values(M.scores).filter(l=>l.length).length>=3,{c:80,b:{fun:1}},()=>[Math.min(3,Object.values(M.scores).filter(l=>l.length).length),3]);
[[25,'🧽','Clean slate',{c:80}],[100,'♻','Error eraser',{c:250,b:{style:1}}]].forEach(([n,ic,nm,r])=>AX('m'+n,ic,nm,`Master ${n} mistakes`,()=>M.mastered>=n,r,()=>[Math.min(n,M.mastered),n]));
[[1,'📦','First crate',{c:10}],[10,'🎁','Unboxer',{c:50}],[50,'💎','Treasure hunter',{c:150,i:['t_Treasure Hunter']}],[100,'🏺','Crate baron',{c:200,b:{gold:2}}]].forEach(([n,ic,nm,r])=>AX('o'+n,ic,nm,`Open ${n} crate${n>1?'s':''}`,()=>M.loot.opened>=n,r,()=>[Math.min(n,M.loot.opened),n]));
[[25,'🗂','Collector',{c:60}],[50,'🖼','Curator',{c:120,b:{style:1}}],[100,'🏛','Museum',{c:250,b:{gold:1}}],[200,'🏰','Hoarder',{c:500,b:{gold:2}}]].forEach(([n,ic,nm,r])=>AX('col'+n,ic,nm,`Collect ${n} items`,()=>ownN()>=n,r,()=>[Math.min(n,ownN()),n]));
AX('leg','🌈','Legendary find','Own a legendary item',()=>CATALOG.some(x=>x.r==='legendary'&&M.inv.own[x.id]),{c:100},()=>[CATALOG.some(x=>x.r==='legendary'&&M.inv.own[x.id])?1:0,1]);
AX('myth','💎','Mythic find','Own a mythic item',()=>CATALOG.some(x=>x.r==='mythic'&&M.inv.own[x.id]),{c:300},()=>[CATALOG.some(x=>x.r==='mythic'&&M.inv.own[x.id])?1:0,1]);
[[10,'🎯','Goal getter',{c:60}],[30,'🧱','Habit builder',{c:200,b:{gold:1}}]].forEach(([n,ic,nm,r])=>AX('goal'+n,ic,nm,`Reach the daily goal on ${n} days`,()=>Object.keys(M.goal).length>=n,r,()=>[Math.min(n,Object.keys(M.goal).length),n]));
[[7,'📅','Regular',{c:50}],[30,'🗓','Devoted',{c:150,i:['t_Daily Devotee']}],[100,'💍','Loyal',{c:300,b:{gold:2}}]].forEach(([n,ic,nm,r])=>AX('login'+n,ic,nm,`Claim ${n} daily rewards`,()=>(M.dl.tot||0)>=n,r,()=>[Math.min(n,M.dl.tot||0),n]));
[[10,'📝','Quest taker',{c:40}],[50,'🛡','Quest master',{c:150,i:['t_Quest Master']}],[150,'⚔','Quest legend',{c:300,b:{gold:1}}]].forEach(([n,ic,nm,r])=>AX('dc'+n,ic,nm,`Complete ${n} daily challenges`,()=>(M.dc.tot||0)>=n,r,()=>[Math.min(n,M.dc.tot||0),n]));
AX('clear1','🌤','Clean sweep','Finish all three daily challenges in a day',()=>(M.dc.allTot||0)>=1,{c:30},()=>[Math.min(1,M.dc.allTot||0),1]);
AX('clear7','🌞','Perfect week','Finish all three daily challenges on 7 days',()=>(M.dc.allTot||0)>=7,{c:100,b:{style:1}},()=>[Math.min(7,M.dc.allTot||0),7]);
AX('chain3','🔗','Triple threat','Clear every daily challenge 3 days in a row',()=>(M.dc.streak||0)>=3,{c:80},()=>[Math.min(3,M.dc.streak||0),3]);
AX('chain7','⛓','Unbreakable','Clear every daily challenge 7 days in a row',()=>(M.dc.streak||0)>=7,{c:200,b:{gold:1}},()=>[Math.min(7,M.dc.streak||0),7]);
AX('me','🪪','Make it yours','Set a name, an avatar and a flair',()=>!!(M.set.name&&M.set.av&&M.set.flair),{c:20},()=>[(M.set.name?1:0)+(M.set.av?1:0)+(M.set.flair?1:0),3]);
AX('extras','🎀','Little extras','Equip a companion, a trail and a click effect',()=>!!(M.set.pet&&M.set.trail&&M.set.clickfx),{c:60,b:{fun:1}},()=>[(M.set.pet?1:0)+(M.set.trail?1:0)+(M.set.clickfx?1:0),3]);
[[10,'🏅','Trophy case',{c:100}],[25,'🏆','Achievement hunter',{c:200,b:{gold:1},i:['t_Achievement Hunter','fl_✵']}],[40,'💫','Completionist',{c:500,b:{gold:2}}]].forEach(([n,ic,nm,r])=>AX('ah'+n,ic,nm,`Earn ${n} achievements`,()=>earnedN()>=n,r,()=>[Math.min(n,earnedN()),n]));
let achBusy=false;
function checkAch(){try{if(typeof checkSets==='function')checkSets()}catch(e){}if(achBusy)return;achBusy=true;try{const got=[];BADGES.forEach(b=>{if(!M.ach[b[0]]&&b[4]()){M.ach[b[0]]=Date.now();const r=(ACHR[b[0]]||{}).r;if(r)giveReward(r);got.push([b,r])}});
 if(got.length){mDirty=true;paintChip();if(got.length===1){const [b,r]=got[0];toast(`🏅 Achievement: ${b[2]}${r?' · '+rewardText(r):''}`)}else{const tot=got.reduce((a,[b,r])=>a+((r&&r.c)||0),0);toast(`🏅 ${got.length} achievements earned! ${tot?'+'+tot+' 🪙 and more rewards':''}`)}confetti();if(cur==='shop'||cur==='profile')setTimeout(()=>renderPane(cur),50);else if(cur==='')softRefresh()}}catch(e){}achBusy=false}
function achHTML(){const n=earnedN(),tot=BADGES.length;
 return `<h3>🏅 Achievements · ${n}/${tot}</h3><div class="mut" style="margin-bottom:8px">Rewards are paid automatically the moment you earn one.</div><div class="grid">${BADGES.map(b=>{const e=b[4](),a=ACHR[b[0]]||{},pr=!e&&a.p?a.p():null;return `<div class="card ${e?'':'lock'}"><b>${e?'✅':b[1]} ${esc(b[2])}</b><div class="mut" style="font-size:12px">${esc(b[3])}</div>${pr?`<div class="qbar"><i style="width:${Math.min(100,pr[0]/pr[1]*100)}%"></i></div><div class="mut" style="font-size:12px">${pr[0]}/${pr[1]}</div>`:''}${a.r?`<div style="font-size:12px;margin-top:4px;color:var(--fg)">🎁 ${esc(rewardText(a.r))}</div>`:''}</div>`}).join('')}</div>`}
home.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const d=b.dataset;if(d.act==='dlclaim')dlClaim();else if(d.act==='dcswap')dcSwap(+d.i)});
setInterval(()=>{try{dcCheck();checkAch()}catch(e){}},5000);

