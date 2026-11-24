/* ===================== shop: crates (random cosmetics), supplies, collection ===================== */
const SUPPLIES=[
 {id:'freeze',i:'🧊',n:'Streak freeze',d:'Saves your study streak if you miss a day. Used automatically.',p:80,pack:1},
 {id:'boost',i:'⚡',n:'Focus booster',d:'Double coins from learning for 30 minutes.',p:70},
 {id:'pu5050',i:'✂️',n:'50/50 ×3',d:'Removes two wrong answers in an arcade game.',p:75,pack:3},
 {id:'putime',i:'⏱',n:'+10 seconds ×3',d:'Adds 10 seconds to the current arcade question.',p:60,pack:3},
 {id:'pulife',i:'❤️',n:'Extra life',d:'+1 life in an arcade game (up to 5).',p:60,pack:1},
 {id:'puskip',i:'⏭',n:'Skip ×3',d:'Skip a question with no penalty.',p:50,pack:3},
 {id:'pushield',i:'🛡',n:'Shield ×2',d:'Your next wrong answer costs no life and keeps your streak.',p:80,pack:2},
 {id:'freeze3',i:'🧊',n:'Streak freeze ×3',d:'Three freezes for less than buying them one by one.',p:200,give:{qty:{freeze:3}}},
 {id:'boost4',i:'⚡',n:'Mega booster (2 hours)',d:'Double coins from learning for two hours.',p:220,give:{boost:120}},
 {id:'crate5',i:'📦',n:'Study Crate ×5',d:'Five crates, a bit cheaper than singles. They wait in your inventory.',p:250,give:{box:{crate:5}}},
 {id:'gold3',i:'🎁',n:'Golden Crate ×3',d:'Three Golden Crates, cheaper than singles.',p:420,give:{box:{gold:3}}},
 {id:'pustart',i:'🧰',n:'Power-up starter pack',d:'One of every arcade power-up.',p:150,give:{qty:{pu5050:1,putime:1,pulife:1,puskip:1,pushield:1}}}];
var shopTab='crates',colCat='all';
function isEquipped(it){const s=M.set;return it.c==='theme'?mode===it.id:it.c==='font'?s.font===it.font:it.c==='avatar'?s.av===it.av:it.c==='title'?s.title===it.title:it.c==='flair'?s.flair===it.flair:it.c==='confetti'?s.cf===it.cf:it.c==='skin'?s.skin===it.skin:it.c==='bg'?s.bg===it.key:it.c==='cursor'?s.cur===it.key:it.c==='frame'?s.frame===it.key:it.c==='card'?s.card===it.key:it.c==='sound'?s.snd===it.key:NEWC[it.c]?s[NEWC[it.c]]===it.key:false}
function shopBuy(id){const it=SUPPLIES.find(x=>x.id===id);if(!it)return;if(M.coins<it.p){toast('Not enough coins yet. Keep studying! 🪙');return}
 M.coins-=it.p;if(it.give){const g=it.give;if(g.boost)M.inv.boost=Math.max(Date.now(),M.inv.boost)+g.boost*60000;Object.entries(g.qty||{}).forEach(([k,v])=>M.inv.qty[k]=(M.inv.qty[k]||0)+v);Object.entries(g.box||{}).forEach(([k,v])=>M.inv.box[k]=(M.inv.box[k]||0)+v)}else if(id==='boost')M.inv.boost=Math.max(Date.now(),M.inv.boost)+30*60000;else M.inv.qty[id]=(M.inv.qty[id]||0)+(it.pack||1);mSave();paintChip();toast(`Bought ${it.n}!`);renderShop()}
function shopEquip(id,quiet){const it=cat(id);if(!it||!M.inv.own[id])return;const on=isEquipped(it)&&!quiet;
 if(it.c==='theme'){mode=on?'auto':id;try{localStorage.setItem('mp-theme',mode)}catch(e){}applyTheme();if(mode==='starwars')saber()}
 else if(it.c==='font')M.set.font=on?'':it.font;else if(it.c==='avatar')M.set.av=on?'':it.av;else if(it.c==='title')M.set.title=on?'':it.title;
 else if(it.c==='flair')M.set.flair=on?'':it.flair;else if(it.c==='skin')M.set.skin=on?'':it.skin;
 else if(it.c==='bg')M.set.bg=on?'':it.key;else if(it.c==='cursor')M.set.cur=on?'':it.key;else if(it.c==='frame')M.set.frame=on?'':it.key;else if(it.c==='card')M.set.card=on?'':it.key;else if(it.c==='sound'){M.set.snd=on?'':it.key;if(!on)uiPreview()}else if(it.c==='confetti'){M.set.cf=on?'':it.cf;if(!on)confetti()}else if(NEWC[it.c]){M.set[NEWC[it.c]]=on?'':it.key}
 applyExtras();paintChip();mSave();if(!quiet)renderPane(cur)}
/* ---------- crates ---------- */
function rollRarity(type){const odds=BOX[type].odds,L=M.loot;let r=Math.random(),acc=0,rar='common';
 if(odds.mythic&&Math.random()<odds.mythic&&boxPool(type).some(it=>it.r==='mythic'))return 'mythic';
 for(const k of ['common','rare','epic','legendary']){acc+=odds[k];if(r<acc){rar=k;break}}
 if(L.se>=9&&(rar==='common'||rar==='rare'))rar='epic';if(L.sl>=39)rar='legendary';
 L.se=(rar==='epic'||rar==='legendary')?0:L.se+1;L.sl=rar==='legendary'?0:L.sl+1;return rar}
const boxVisible=k=>{const b=BOX[k];return !!b&&(!b.sw||M.sw)&&(!b.needs||!!M.inv.own[b.needs]||(M.inv.box[k]||0)>0)&&(!b.season||(b.season==='xmas'?xmasSeason():hwSeason()))&&(!b.unowned||(M.inv.box[k]||0)>0||boxPool(k).length>0)};
function boxPool(type){const b=BOX[type];if(b.unowned)return CATALOG.filter(it=>!it.noDrop&&!M.inv.own[it.id]&&!hiddenItem(it)&&hxPackOK(it));return CATALOG.filter(it=>!it.noDrop&&(b.pack?it.pack===b.pack:(!it.pack&&(!b.cats||b.cats.includes(it.c)))))}
function pickItem(type,rar){let pool=boxPool(type).filter(it=>it.r===rar);
 if(!pool.length)pool=boxPool(type);
 const w=pool.map(it=>M.inv.own[it.id]?1:3),tot=w.reduce((a,b)=>a+b,0);let x=Math.random()*tot,i=0;while(i<w.length-1&&x>=w[i]){x-=w[i];i++}return pool[i]}
function openBox(type,free){const b=BOX[type];if(!b||!boxVisible(type))return;
 if(free){if((M.inv.box[type]||0)<=0)return;M.inv.box[type]--}else{if(M.coins<b.p){toast('Not enough coins yet. Keep studying! 🪙');return}M.coins-=b.p}
 const rar=rollRarity(type),it=pickItem(type,rar),dup=!!M.inv.own[it.id];let refund=0;
 if(dup){refund=REFUND[it.r]||0;M.coins+=refund}else M.inv.own[it.id]=1;
 M.loot.opened++;mSave();paintChip();showLoot(type,it,dup,refund)}
function previewHTML(it){if(NEWC[it.c])return newPV(it);if(it.c==='bg')return `<div class="bgpv" data-bgp="${it.key}" style="height:60px;border:1px solid var(--bd);border-radius:8px"></div>`;if(it.c==='frame')return `<div class="frpv" data-fr="${it.key}">Profile</div>`;if(it.c==='card')return `<div class="cdpv" data-cd="${it.key}">Card</div>`;if(it.c==='cursor'||it.c==='sound')return `<div class="pv xl">${it.i}</div>`;
 return it.c==='theme'?`<div class="sw big">${it.sw.map(c=>`<i style="background:${c}"></i>`).join('')}</div>${window.MYK&&MYK.scenes&&MYK.scenes[it.id]?`<button type="button" class="mykpvb" data-mykpv="${it.id}">👁 Preview scene</button>`:''}`:it.c==='font'?fontPreview(it.font):it.c==='avatar'?`<div class="pv xl">${it.av}</div>`:it.c==='flair'?`<div class="pv xl">${it.flair}</div>`:it.c==='title'?`<div class="pv t">“${esc(it.title)}”</div>`:`<div class="pv xl">${it.i||''}</div>`}
function reelCard(it){const r=RAR[it.r];let g;
 if(it.c==='theme')g=`<div class="rsw">${it.sw.map(x=>`<i style="background:${x}"></i>`).join('')}</div>`;else if(it.c==='font')g=`<div class="rg" style="font-family:${fs(it.font)}">Aa</div>`;
 else if(it.c==='avatar')g=`<div class="rg">${it.av}</div>`;else if(it.c==='flair')g=`<div class="rg">${it.flair}</div>`;
 else if(it.c==='title')g=`<div class="rt">“${esc(it.title.length>28?it.title.slice(0,26)+'…':it.title)}”</div>`;else if(it.c==='bg')g=`<div class="bgpv" data-bgp="${it.key}" style="width:80px;height:50px;border:1px solid #444;border-radius:6px"></div>`;else if(it.c==='frame')g=`<div class="frpv" data-fr="${it.key}" style="font-size:11px;color:#eee">Frame</div>`;else if(it.c==='card')g=`<div class="cdpv" data-cd="${it.key}" style="font-size:11px;color:#eee">Card</div>`;else g=`<div class="rg sm">${it.i||''}</div>`;
 return `<div class="rcard" style="--rc:${r.c}">${g}<div class="rn">${esc(it.n.replace(/^(Avatar|Flair) /,'').slice(0,20))}</div></div>`}
function reelFiller(type){const b=BOX[type];let r=Math.random(),acc=0,rar='common';for(const k of ['common','rare','epic','legendary']){acc+=b.odds[k];if(r<acc){rar=k;break}}
 const pool=boxPool(type).filter(it=>it.r===rar);return pool[Math.floor(Math.random()*pool.length)]||boxPool(type)[0]||CATALOG[0]}
function tickSnd(){try{if(!sndOn||!audio())return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.value=900;g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+.04);o.connect(g);g.connect(master);o.start(t);o.stop(t+.05)}catch(e){}}
function showLoot(type,it,dup,refund){let ov=$('lootov');if(!ov){ov=document.createElement('div');ov.id='lootov';document.body.appendChild(ov)}
 const b=BOX[type],r=RAR[it.r],more=(M.inv.box[type]||0)>0,can=more||(M.coins>=b.p&&boxVisible(type));
 const reveal=()=>{ov.innerHTML=`<div class="lcard" style="--rc:${r.c}"><div class="lr">${r.n}${dup?' · duplicate':' · NEW!'}</div>${previewHTML(it)}<b>${esc(it.n)}</b><div class="mut">${CATN[it.c]||''}${dup?` · converted to ${refund} 🪙`:''}</div>
  <div class="btns" style="justify-content:center">${!dup?`<button class="pri" data-act="lootequip" data-id="${esc(it.id)}">Equip now</button>`:''}${can?`<button data-act="lootagain" data-t="${type}">${more?'Open another (free)':`Open another · 🪙 ${b.p}`}</button>`:''}<button data-act="lootclose">Close</button></div></div>`;
  if(!dup&&(it.r==='epic'||it.r==='legendary'))confetti()};
 ov.className='on';ov.dataset.t=type;
 if(RM){reveal();return}
 /* a CSGO-style reel: the strip is filled from the real drop odds, and the winner is already decided */
 const N=64,W=54,CW=136,cards=[];for(let i=0;i<N;i++)cards.push(i===W?it:reelFiller(type));
 ov.innerHTML=`<div class="reelbox"><div class="reelwrap" id="reelwrap"><div class="reelmark"></div><div class="reel" id="reel">${cards.map(reelCard).join('')}</div></div><div class="mut">${b.n}…</div><button data-act="lootskip">Skip</button></div>`;
 const reel=$('reel'),wrap=$('reelwrap'),wrapW=wrap.clientWidth,off=(Math.random()-.5)*.84*CW,target=-(W*CW+CW/2-wrapW/2+off);let done=false,last=-1;
 const finish=()=>{if(done)return;done=true;reel.style.transition='none';reveal()};ov._finish=finish;audio();
 reel.style.transition='transform 6.8s cubic-bezier(.06,.72,.1,1)';
 requestAnimationFrame(()=>requestAnimationFrame(()=>{reel.style.transform=`translateX(${target}px)`;
  const loop=()=>{if(done||!$('reel'))return;const m=new DOMMatrix(getComputedStyle(reel).transform),idx=Math.floor((-m.m41+wrapW/2)/CW);if(idx!==last){last=idx;tickSnd()}requestAnimationFrame(loop)};loop()}));
 reel.addEventListener('transitionend',()=>setTimeout(finish,350),{once:true});setTimeout(finish,7600)}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#lootov [data-act]');if(!b)return;const a=b.dataset.act,ov=$('lootov');
 if(a==='lootclose'){ov.className='';ov.innerHTML='';renderPane(cur)}
 else if(a==='lootequip'){shopEquip(b.dataset.id,true);toast('Equipped!');ov.className='';ov.innerHTML='';renderPane(cur)}
 else if(a==='lootagain'){const t=b.dataset.t;openBox(t,(M.inv.box[t]||0)>0)}
 else if(a==='lootskip'){ov._finish&&ov._finish()}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('lootov')&&$('lootov').className==='on'){$('lootov').className='';$('lootov').innerHTML=''}});
