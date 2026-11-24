/* ---------- pages ---------- */
const pct=x=>Math.round(x*100)+'%';
const HUBTABS=[['crates','🎁 Crates'],['supplies','🧪 Supplies'],['collection','📚 Collection'],['road','🛣 Level road'],['themes','🎨 Themes & perks'],['badges','🏅 Achievements'],['settings','⚙ Settings']];
function renderShop(){
 const left=Math.max(0,M.inv.boost-Date.now()),mm=Math.ceil(left/60000),fr=M.inv.qty.freeze||0,owned=CATALOG.filter(x=>M.inv.own[x.id]).length,vis=CATALOG.filter(x=>x.pack!=='sw'||M.sw).length;
 const L=lvlOf(M.sp),nx=nextUnlock(),RT=(['road','themes','badges','settings'].includes(shopTab))?rewardTabs():null;let body='';
 if(shopTab==='crates'){
  const pr=Math.round(M.loot.prog),types=Object.keys(BOX).filter(boxVisible);
  body=`<div class="card"><b>📦 Free crate progress</b><div class="bar2"><i style="width:${pr/FREEAT*100}%"></i></div><div class="mut" style="font-size:12px">${pr}/${FREEAT} learning SP to your next free Study Crate. Lessons, practice and exercises count. Minigames do not. Level-ups and streaks also give crates.</div></div>
  <div class="grid">${types.map(k=>{const b=BOX[k],n=M.inv.box[k]||0,can=M.coins>=b.p;return `<div class="card th"><div class="pv xl">${b.i}</div><b>${b.n}</b><div class="mut" style="font-size:12px">${b.d}${b.unowned?' <b>'+boxPool(k).length+' left to discover.</b>':''} One random item.</div>
   <div class="mut" style="font-size:12px">${['common','rare','epic','legendary'].map(r=>`<span><span style="color:${RAR[r].c}">●</span> ${RAR[r].n} ${pct(b.odds[r])}</span>`).join(' · ')}</div>
   ${n?`<button class="pri" data-act="openbox" data-t="${k}" data-free="1">Open a free crate (${n})</button>`:''}<button class="${can&&!n?'pri':''}" data-act="openbox" data-t="${k}" ${can?'':'disabled'}>Buy &amp; open · 🪙 ${b.p}</button>${(n>=5||n+Math.floor(M.coins/b.p)>=5)?`<button data-act="openmany" data-t="${k}" data-n="5">Open ×5</button>`:''}</div>`}).join('')}</div>
  <details class="card"><summary><b>Drop rates and rules</b></summary><ul class="ul"><li>⏳ Seasonal crates are limited: the Halloween Crate is only available from Oct 15 to Nov 5, and the Winter Crate from Dec 1 to Jan 6 (once you own Winter Wonderland). Crates you already hold wait in your inventory until the season is back.</li><li>No real money, ever. Crates cost only coins you earned by studying.</li><li>The reel is filled using the real drop odds. Nothing is staged: the winner is decided before it spins.</li><li>Items you do not own yet are 3× more likely than ones you already have.</li><li>A duplicate turns into coins (common 8, rare 20, epic 50, legendary 120), so nothing is wasted.</li><li>Pity: an Epic or better is guaranteed within 10 crates, a Legendary within 40. Your counters: ${M.loot.se}/9 and ${M.loot.sl}/39.</li><li>You have opened ${M.loot.opened} crate${M.loot.opened===1?'':'s'} and collected ${owned}/${vis} items.</li></ul></details>`}
 else if(shopTab==='supplies'){
  body=`<div class="grid">${SUPPLIES.map(it=>{const can=M.coins>=it.p,q=M.inv.qty[it.id]||0;return `<div class="card th"><div class="pv">${it.i}</div><b>${esc(it.n)}</b><div class="mut" style="font-size:12px">${esc(it.d)}</div>${(it.id!=='boost'&&!it.give)?`<div class="mut">You have <b>${q}</b></div>`:''}<button class="${can?'pri':''}" data-act="buy" data-id="${it.id}" ${can?'':'disabled'}>Buy · 🪙 ${it.p}</button>${can?'':`<div class="mut" style="font-size:12px">${Math.ceil(it.p-M.coins)} more coins</div>`}</div>`}).join('')}</div>`}
 else if(shopTab==='collection'){body=collectionHTML()}
 else if(shopTab==='daily'){body=hxShopHTML()}
 else if(shopTab==='pass'){body=hxBpHTML()}
 else body=RT[shopTab];
 home.innerHTML=`<div class="wrap"><h1>🎁 Shop &amp; Rewards</h1>
 <div class="card hero"><div class="hrow"><div><div class="big">${heroName()}Level ${L} · ${lvlName(L)}</div><div class="mut">${Math.floor(M.sp)} SP · 🪙 <b>${Math.floor(M.coins)}</b> coins${nx?` · next unlock: ${esc(nx.n)}`:''}</div></div>
 <div class="chips">${Object.keys(BOX).filter(k=>(M.inv.box[k]||0)>0&&boxVisible(k)).map(k=>`<span class="chip2">${BOX[k].i} ${M.inv.box[k]} free</span>`).join('')}${left?`<span class="chip2">⚡ Booster ${mm} min</span>`:''}<span class="chip2">🧊 ${fr}</span></div></div>
 <div class="bar2"><i style="width:${Math.round((M.sp-need(L))/(need(L+1)-need(L))*100)}%"></i></div><div class="mut" style="font-size:12px">${Math.ceil(need(L+1)-M.sp)} SP to level ${L+1}. You earn 1 coin per Study Point.</div></div>
 <div class="seg">${HUBTABS.map(([k,n])=>`<button class="${k===shopTab?'on':''}" data-act="shoptab" data-c="${k}">${n}</button>`).join('')}</div>${body}</div>`;skinNodes(document)}
