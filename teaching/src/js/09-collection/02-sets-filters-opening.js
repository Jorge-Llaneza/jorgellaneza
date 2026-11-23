/* ===== part 3l: collection sets, filters, font previews, new x5 opening ===== */
/* --- fonts: previews that really use the font --- */
const fs=k=>((FONTS[k]&&FONTS[k].s)||'inherit').replace(/"/g,"'");
const fontOk={};
function fontInstalled(k){if(k in fontOk)return fontOk[k];let ok=true;try{const f=FONTS[k];if(!f){return fontOk[k]=true}const first=f.s.split(',')[0].replace(/["']/g,'').trim();if(/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/.test(first))return fontOk[k]=true;const c=document.createElement('canvas').getContext('2d');if(!c||typeof c.measureText!=='function')return fontOk[k]=true;const t='mmmmmmmmmmlliWWW@@';ok=['monospace','sans-serif','serif'].some(b=>{c.font='72px '+b;const w0=c.measureText(t).width;c.font=`72px "${first}",${b}`;return c.measureText(t).width!==w0})}catch(e){ok=true}return fontOk[k]=ok}
function fontPreview(k){const f=fs(k);return `<div class="pv fpv" style="font-family:${f}!important"><span style="font-size:26px;line-height:1.2">Aa Bb Cc 123</span><span style="display:block;font-size:13px">The quick brown fox jumps over the lazy dog</span>${fontInstalled(k)?'':'<small class="mut" style="display:block;font-size:11px;font-family:system-ui">Not installed on this device: showing a fallback</small>'}</div>`}
/* --- sets --- */
const SETS=[
 {id:'egypt',n:'Pharaoh’s Treasure',ico:'🏺',d:'Everything from the Pharaoh’s Chest.',limited:'Pharaoh’s Chest only',pick:x=>x.pack==='eg',vis:()=>CATALOG.some(x=>x.pack==='eg'&&M.inv.own[x.id])||(BOX.eg&&boxVisible('eg')),reward:{c:150,b:{style:1}}},
 {id:'halloween',n:'Spooky Season',ico:'🎃',d:'Haunted items from the Halloween Crate.',limited:'Halloween only',pick:x=>x.pack==='hw',vis:()=>CATALOG.some(x=>x.pack==='hw'&&M.inv.own[x.id])||(BOX.hw&&boxVisible('hw')),reward:{c:150,b:{fun:1}}},
 {id:'galactic',n:'Galactic Archive',ico:'🌌',d:'A long time ago…',limited:'Secret crate',pick:x=>x.pack==='sw',vis:()=>!!M.sw,reward:{c:200,b:{gold:1}}},
 {id:'winter',n:'Winter Wonderland',ico:'❄️',d:'Everything snowy.',limited:'Winter Crate',pick:x=>x.pack==='wi'||x.id==='winter',vis:()=>!!M.inv.own.winter,reward:{c:150,b:{wi:1}}},
 {id:'arcade',n:'Neon Arcade',ico:'🕹',d:'Insert coin.',limited:'Arcade Cabinet',pick:x=>x.pack==='ar'||x.id==='arcadeth',vis:()=>!!M.inv.own.arcadeth,reward:{c:150,b:{ar:1}}},
 {id:'abyss',n:'Deep Sea',ico:'🌊',d:'Things that glow in the dark.',limited:'Deep Sea Chest',pick:x=>x.pack==='ab'||x.id==='abyss',vis:()=>!!M.inv.own.abyss,reward:{c:150,b:{ab:1}}},
 {id:'sakura',n:'Sakura Garden',ico:'🌸',d:'Calm and blooming.',limited:'Sakura Box',pick:x=>x.pack==='sk'||x.id==='sakura',vis:()=>!!M.inv.own.sakura,reward:{c:150,b:{sk:1}}},
 {id:'uniovi',n:'Uni Oviedo',ico:'🏛',d:'Campus life, Asturian style.',limited:'Limited edition',ids:['uniovi','av_🏛️','av_🍎','av_🫘','av_🌧️','av_🏔️','av_🐄','av_🍏','t_Rainy Day Scholar','t_Fabada-Powered','t_Cider Pourer','t_Campus Regular','t_Carbayón','t_Campus Legend','t_Escanciador Supremo','t_Founded 1608','t_Pride Of Oviedo','t_Est. 1608','bn_oviedo','bn_asturies','pet_cow','clk_sidra','trl_apple','lvf_rain','cf_asturias','cur_apple'],reward:{c:250,b:{gold:1}}},
 {id:'sixseven',n:'Six Seven',ico:'6️⃣',d:'Sixty-seven of everything.',limited:'Limited edition',ids:['fl_67','fl_⁶⁷','t_Six Seven','t_6-7','t_Sixty-Seven Supreme','t_67 Club','bn_sixseven','clk_sixseven2','trl_sixseventr','lvf_sixseven','cf_sixseven'],reward:{c:670}},
 {id:'ide',n:'Developer Toolkit',ico:'🖥',d:'BlueJ, Eclipse, VS Code and friends.',limited:'Limited edition',ids:typeof IDE_IDS!=='undefined'?IDE_IDS:[],reward:{c:300,b:{gold:1}}},
 {id:'tamagotchi',n:'Pocket Pet',ico:'🥚',d:'Everything for your Tamagotchi.',ids:['tamagotchi','t_Pet Whisperer'],reward:{c:100,b:{fun:1}}},
 {id:'companions',n:'Companion Club',ico:'🐾',d:'Every little friend.',pick:x=>x.c==='pet',reward:{c:200,b:{fun:2}}},
 {id:'achievements',n:'Trophy Room',ico:'🏆',d:'Items you can only earn with achievements.',limited:'Achievements only',pickA:true,reward:{c:500,b:{gold:2}}},
 {id:'levels',n:'Level Road',ico:'🛣',d:'Every reward on the road to level 50.',limited:'Level rewards only',pickL:true,reward:{c:400,b:{gold:1}}}];
function setItems(s){if(s.ids)return s.ids.map(cat).filter(Boolean);if(s.pickA){const A=achItemSet();return CATALOG.filter(x=>A.has(x.id))}if(s.pickL){const L=lvlItemSet();return CATALOG.filter(x=>L.has(x.id))}return CATALOG.filter(s.pick)}
function lvlItemSet(){const s=new Set();Object.values(LVR).forEach(r=>(r.items||[]).forEach(i=>s.add(i)));return s}
function achItemSet(){const s=new Set();Object.values(ACHR).forEach(a=>((a.r&&a.r.i)||[]).forEach(i=>s.add(i)));return s}
function setProg(s){const it=setItems(s),own=it.filter(x=>M.inv.own[x.id]).length;return{items:it,own,tot:it.length,done:it.length>0&&own===it.length}}
const setVisible=s=>{try{return (s.vis?s.vis():true)&&setItems(s).length>0}catch(e){return false}};
let LASTSETS=[];
function checkSets(){M.sets=M.sets||{};const out=[];SETS.forEach(s=>{if(M.sets[s.id]||!setVisible(s))return;const p=setProg(s);if(p.done){M.sets[s.id]=Date.now();giveReward(s.reward);out.push(s);setTimeout(()=>{toast(`📚 Set complete: ${s.n}! ${rewardText(s.reward)}`);confetti()},400)}});if(out.length){mDirty=true;LASTSETS=out}return out}
function setsOf(it){return SETS.filter(s=>setVisible(s)&&setItems(s).some(x=>x.id===it.id))}
const setSnap=it=>`${it.n}`;
AX('set1','📚','Set collector','Complete a collection set',()=>Object.keys(M.sets||{}).length>=1,{c:100,b:{fun:1}},()=>[Math.min(1,Object.keys(M.sets||{}).length),1]);
AX('set3','📖','Librarian','Complete 3 collection sets',()=>Object.keys(M.sets||{}).length>=3,{c:250,b:{gold:1}},()=>[Math.min(3,Object.keys(M.sets||{}).length),3]);
AX('set6','🏛','Curator of curators','Complete 6 collection sets',()=>Object.keys(M.sets||{}).length>=6,{c:600,b:{gold:2}},()=>[Math.min(6,Object.keys(M.sets||{}).length),6]);
const glyphOf=it=>it.c==='theme'?`<span class="sw">${it.sw.map(c=>`<i style="background:${c}"></i>`).join('')}</span>`:it.c==='font'?`<span style="font-family:${fs(it.font)}">Aa</span>`:it.c==='avatar'?it.av:it.c==='flair'?it.flair:it.c==='title'?'🏷':it.c==='banner'?'🎏':it.c==='nfx'?'✒️':it.c==='bg'?'🖼':it.c==='frame'?'🖼':it.c==='card'?'🃏':(it.i||'✨');
function setsHTML(){const f=COLF.setf,list=SETS.filter(setVisible).map(s=>({s,p:setProg(s)})).filter(({p})=>f==='all'||(f==='done'&&p.done)||(f==='prog'&&p.own>0&&!p.done)||(f==='none'&&p.own===0));
 const flt=`<div class="seg" style="margin:6px 0">${[['all','All'],['prog','In progress'],['done','Complete'],['none','Not started']].map(([k,n])=>`<button class="${f===k?'on':''}" data-act="colsetf" data-v="${k}">${n}</button>`).join('')}</div>`;
 const totDone=SETS.filter(s=>setVisible(s)&&setProg(s).done).length,totAll=SETS.filter(setVisible).length;
 return `<div class="mut" style="margin:4px 0 6px">Sets complete: <b>${totDone}/${totAll}</b>. Finish a set to claim its reward.</div>${flt}${list.length?list.map(({s,p})=>{const claimed=!!(M.sets&&M.sets[s.id]);return `<details class="card setc" ${p.own>0&&!p.done?'open':''}><summary><span class="seth"><b>${s.ico} ${esc(s.n)}</b>${s.limited?` <span class="chip2 lim">Limited: ${esc(s.limited)}</span>`:''}</span><span class="mut" style="font-size:12px">${p.own}/${p.tot}${p.done?' ✓':''}</span></summary><div class="mut" style="font-size:12px;margin:4px 0">${esc(s.d||'')}</div><div class="qbar"><i style="width:${p.tot?p.own/p.tot*100:0}%"></i></div><div class="mut" style="font-size:12px">🎁 ${claimed?'Reward claimed: ':'Reward: '}${esc(rewardText(s.reward))}</div><div class="setg">${p.items.map(it=>{const own=M.inv.own[it.id],r=RAR[it.r]||RAR.common;return `<div class="setit ${own?'':'miss'}" style="border-left-color:${r.c}" title="${esc(it.n)} · ${r.n}"><span class="sg" aria-hidden="true">${glyphOf(it)}</span><span class="stx"><b>${esc(it.n)}</b><small>${r.n} · ${CATN[it.c]||''}</small><small class="${own?'ok':''}">${own?'✓ Owned':'Not owned'}</small></span></div>`}).join('')}</div></details>`}).join(''):'<div class="card mut">No sets here yet.</div>'}`}
/* --- filters --- */
const COLF={view:'items',rar:[],own:'all',src:'all',sort:'rarity',q:'',setf:'all'};
const RARS=['common','rare','epic','legendary','mythic'];
const SRCS=[['all','Any source'],['crate','Crates'],['level','Level rewards'],['ach','Achievements'],['pack','Themed crates']];
const SORTS=[['rarity','Rarity: common first'],['rarityd','Rarity: legendary first'],['name','Name A–Z'],['owned','Owned first'],['missing','Not owned first']];
function itemSrcs(it,L,A){const o=[];if(!it.noDrop&&!it.pack)o.push('crate');if(L.has(it.id))o.push('level');if(A.has(it.id))o.push('ach');if(it.pack)o.push('pack');return o}
const SRCN={crate:'Crates',level:'Level reward',ach:'Achievement',pack:'Themed crate'};
function colList(){const L=lvlItemSet(),A=achItemSet(),q=COLF.q.trim().toLowerCase(),ord=['common','rare','epic','legendary','mythic','secret'];
 let list=CATALOG.filter(x=>(colCat==='all'||x.c===colCat)&&(x.pack!=='sw'||M.sw)&&!hiddenItem(x));
 if(COLF.rar.length)list=list.filter(x=>COLF.rar.includes(x.r));
 if(COLF.own==='owned')list=list.filter(x=>M.inv.own[x.id]);else if(COLF.own==='missing')list=list.filter(x=>!M.inv.own[x.id]);else if(COLF.own==='fav')list=list.filter(x=>hxFav()[x.id]);
 if(COLF.src!=='all')list=list.filter(x=>itemSrcs(x,L,A).includes(COLF.src));
 if(q)list=list.filter(x=>((M.inv.own[x.id]?x.n+' ':'')+(CATN[x.c]||'')+' '+(RAR[x.r]||{n:''}).n+' '+x.c).toLowerCase().includes(q));
 const o=x=>ord.indexOf(x.r),own=x=>M.inv.own[x.id]?1:0;
 list.sort((a,b)=>COLF.sort==='rarityd'?o(b)-o(a):COLF.sort==='name'?(M.inv.own[a.id]&&M.inv.own[b.id]?a.n.localeCompare(b.n):own(b)-own(a)||o(a)-o(b)):COLF.sort==='owned'?own(b)-own(a)||o(a)-o(b):COLF.sort==='missing'?own(a)-own(b)||o(a)-o(b):o(a)-o(b));
 return{list,L,A}}
function gridHTML(){const {list,L,A}=colList(),own=list.filter(x=>M.inv.own[x.id]).length;
 const cards=list.map(it=>{const has=M.inv.own[it.id],r=RAR[it.r];return has?`<div class="card th" style="border-color:${r.c}"><div class="mut" style="font-size:11px"><span style="color:${r.c}">●</span> ${r.n}</div>${it.c==='font'?fontPreview(it.font):previewHTML(it)}<button class="hxstar ${hxFav()[it.id]?'on':''}" data-hx="fav" data-id="${esc(it.id)}" aria-pressed="${!!hxFav()[it.id]}" aria-label="Favourite ${esc(it.n)}" title="Favourite">${hxFav()[it.id]?'★':'☆'}</button><b>${esc(it.n)}</b><button class="${isEquipped(it)?'':'pri'}" data-act="equip" data-id="${esc(it.id)}">${isEquipped(it)?'Equipped ✓ (tap to remove)':'Equip'}</button></div>`:`<div class="card th lock" style="border-color:${r.c}"><div class="mut" style="font-size:11px"><span style="color:${r.c}">●</span> ${r.n}</div><div class="pv xl">?</div><b>${CATN[it.c]}</b><div class="mut" style="font-size:12px">Not found yet</div><div class="mut" style="font-size:11px">From: ${itemSrcs(it,L,A).map(s=>SRCN[s]).join(' · ')||'—'}</div></div>`}).join('');
 return `<div class="mut cfcount" style="margin:6px 0">Showing <b>${list.length}</b> items · <b>${own}</b> owned · <b>${list.length-own}</b> not owned</div>${list.length?`<div class="grid">${cards}</div>`:'<div class="card mut">No items match these filters. <button data-act="colreset">Reset filters</button></div>'}`}
function itemsHTML(){const cats=Object.keys(CATN),active=COLF.rar.length||COLF.own!=='all'||COLF.src!=='all'||COLF.q||COLF.sort!=='rarity';
 return `<div class="card cfbar"><input id="colQ" class="pf-in" type="search" placeholder="Search the collection…" value="${esc(COLF.q)}" aria-label="Search the collection">
 <div class="cfrow"><span class="cfl">Rarity</span>${RARS.map(r=>`<button class="chip2 ${COLF.rar.includes(r)?'on':''}" data-act="colrar" data-r="${r}"><span style="color:${RAR[r].c}">●</span> ${RAR[r].n}</button>`).join('')}</div>
 <div class="cfrow"><span class="cfl">Show</span><div class="seg">${[['all','All'],['owned','Owned'],['missing','Not owned'],['fav','★ Favourites']].map(([k,n])=>`<button class="${COLF.own===k?'on':''}" data-act="colown" data-v="${k}">${n}</button>`).join('')}</div></div>
 <div class="cfrow"><label class="cfl" for="colSrc">Source</label><select id="colSrc">${SRCS.map(([k,n])=>`<option value="${k}" ${COLF.src===k?'selected':''}>${n}</option>`).join('')}</select><label class="cfl" for="colSort">Sort</label><select id="colSort">${SORTS.map(([k,n])=>`<option value="${k}" ${COLF.sort===k?'selected':''}>${n}</option>`).join('')}</select>${active?'<button data-act="colreset">Reset filters</button>':''}</div></div>
 <div class="chips" style="margin:8px 0"><button class="chip2 ${colCat==='all'?'on':''}" data-act="colcat" data-c="all">All</button>${cats.map(k=>`<button class="chip2 ${colCat===k?'on':''}" data-act="colcat" data-c="${k}">${CATN[k]}</button>`).join('')}</div><div id="colGrid">${gridHTML()}</div>`}
function collectionHTML(){const vis=CATALOG.filter(x=>(x.pack!=='sw'||M.sw)&&!hiddenItem(x)),owned=vis.filter(x=>M.inv.own[x.id]).length;
 return `<div class="mut" style="margin-bottom:6px">Collected <b>${owned}/${vis.length}</b>. Items come from crates, level rewards, achievements and secrets.</div><div class="seg" style="margin:8px 0"><button class="${COLF.view==='items'?'on':''}" data-act="colview" data-v="items">🗂 Items</button><button class="${COLF.view==='sets'?'on':''}" data-act="colview" data-v="sets">📚 Sets</button><button data-hx="looks">⭐ My Looks</button></div>${COLF.view==='sets'?setsHTML():itemsHTML()}`}
home.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const d=b.dataset,a=d.act;
 if(a==='colview'){COLF.view=d.v;renderShop()}
 else if(a==='colrar'){const i=COLF.rar.indexOf(d.r);if(i>=0)COLF.rar.splice(i,1);else COLF.rar.push(d.r);renderShop()}
 else if(a==='colown'){COLF.own=d.v;renderShop()}
 else if(a==='colsetf'){COLF.setf=d.v;renderShop()}
 else if(a==='colreset'){Object.assign(COLF,{rar:[],own:'all',src:'all',sort:'rarity',q:''});renderShop()}});
home.addEventListener('input',e=>{if(e.target.id==='colQ'){COLF.q=e.target.value;const g=$('colGrid');if(g){g.innerHTML=gridHTML();skinNodes(document)}}});
home.addEventListener('change',e=>{if(e.target.id==='colSrc'){COLF.src=e.target.value;renderShop()}else if(e.target.id==='colSort'){COLF.sort=e.target.value;renderShop()}});
/* --- opening several crates: clear, readable results --- */
function openMany(type,n){const b=BOX[type];if(!b||!boxVisible(type))return;const res=[];let freeUsed=0,spent=0;
 for(let i=0;i<n;i++){const free=(M.inv.box[type]||0)>0;if(!free&&M.coins<b.p)break;const r=rollOnce(type,free);if(!r)break;if(free)freeUsed++;else spent+=b.p;res.push(r)}
 if(!res.length){toast('Not enough crates or coins.');return}
 mSave();paintChip();checkQuests();const sets=checkSets();try{checkAch()}catch(e){}showLootMany(type,res,{freeUsed,spent,sets})}
function lmSummary(type,res,info){const best=res.reduce((a,x)=>ROR.indexOf(x.it.r)>ROR.indexOf(a.it.r)?x:a,res[0]),back=res.reduce((a,x)=>a+x.refund,0),news=res.filter(x=>!x.dup),dups=res.length-news.length;
 const touched=[];res.forEach(x=>setsOf(x.it).forEach(s=>{if(!touched.includes(s))touched.push(s)}));
 return `<div class="lm-sum"><div>🆕 <b>${news.length}</b> new · 🔁 <b>${dups}</b> duplicate${dups===1?'':'s'}${back?` (converted to <b>+${back} 🪙</b>)`:''}</div>
 <div>💰 Cost: ${info.spent?`<b>🪙 ${info.spent}</b>`:'<b>nothing</b>'}${info.freeUsed?` · ${info.freeUsed} free crate${info.freeUsed===1?'':'s'} used`:''}${info.spent&&back?` · net 🪙 ${back-info.spent>=0?'+':''}${back-info.spent}`:''}</div>
 <div>⭐ Best pull: <span class="lm-rar" style="--rc:${RAR[best.it.r].c}">${RAR[best.it.r].n}</span> <b>${esc(best.it.n)}</b> (${CATN[best.it.c]||''})</div>
 ${news.length?`<div class="lm-list"><b>New:</b> ${news.map(x=>esc(x.it.n)).join(' · ')}</div>`:''}
 ${touched.length?`<div class="lm-list"><b>Set progress:</b> ${touched.map(s=>{const p=setProg(s);return `${s.ico} ${esc(s.n)} ${p.own}/${p.tot}${p.done?' ✓':''}`}).join(' · ')}</div>`:''}
 ${(info.sets&&info.sets.length)?`<div class="lm-list">🎉 <b>Set complete:</b> ${info.sets.map(s=>esc(s.n)+' ('+esc(rewardText(s.reward))+')').join(' · ')}</div>`:''}</div>`}
function showLootMany(type,res,info){info=info||{};const ov=lootOv(),b=BOX[type],tok=lootReset();ov.className='on';ov.dataset.t=type;ov.classList.remove('lshk');
 const skin=CRATESK[M.set.crateskin]||b,free=(M.inv.box[type]||0),c5=free>=5||(free+Math.floor(M.coins/b.p)>=5&&boxVisible(type));let up=0;
 const card=(x,i)=>{const it=x.it,r=RAR[it.r];return `<button class="lm-card" data-i="${i}" style="--rc:${r.c}" aria-label="Crate ${i+1}: tap to reveal"><span class="lm-back"><span aria-hidden="true">${skin.i}</span><small>${i+1}</small></span><span class="lm-front"><span class="lm-rar" style="--rc:${r.c}">${r.n}</span>${it.c==='font'?`<div class="pv" style="font-family:${fs(it.font)}">Aa Bb 123</div>`:previewHTML(it)}<b class="lm-name">${esc(it.n)}</b><span class="lm-cat">${CATN[it.c]||''}</span><span class="lm-stat ${x.dup?'dup':'new'}">${x.dup?`Duplicate · +${x.refund} 🪙`:'NEW'}</span></span></button>`};
 const finish=()=>{const sm=$('lmSum');if(sm)sm.innerHTML=lmSummary(type,res,info);const rb=$('lmReveal');if(rb)rb.style.display='none';const bt=$('lmBtns');if(bt)bt.style.display='flex';lootSting(res.reduce((a,x)=>ROR.indexOf(x.it.r)>ROR.indexOf(a.it.r)?x:a,res[0]).it.r)};
 const reveal=i=>{const el=document.querySelector(`#lootov .lm-card[data-i="${i}"]`);if(!el||el.classList.contains('up'))return;el.classList.add('up');el.setAttribute('aria-label',`${res[i].it.n}, ${RAR[res[i].it.r].n}, ${res[i].dup?'duplicate':'new'}`);up++;const r=res[i].it.r;if(!RM){tickSnd(i/res.length);if(ROR.indexOf(r)>=2){lootBurst(RAR[r].c,r);if(ROR.indexOf(r)>=3){ov.classList.add('lshk');setTimeout(()=>ov.classList.remove('lshk'),600)}}}if(up>=res.length)finish()};
 const paint=()=>{ov.innerHTML=`<canvas id="lootfx"></canvas><div class="lm-panel" role="dialog" aria-label="Crate results"><div class="lm-title">${skin.i} ${esc(b.n)} ×${res.length}</div><div class="lm-sub">${info.freeUsed?`${info.freeUsed} free`:''}${info.freeUsed&&info.spent?' + ':''}${info.spent?`${res.length-info.freeUsed} bought (🪙 −${info.spent})`:''}. Tap a crate to open it, or reveal them all.</div><div class="lm-grid" id="lmgrid">${res.map(card).join('')}</div><div class="lm-sum" id="lmSum"></div><div class="lm-btns"><button id="lmReveal" data-act="lmrevealall" class="pri">Reveal all</button><span id="lmBtns" style="display:none;gap:8px;flex-wrap:wrap;justify-content:center">${c5?`<button class="pri" data-act="lootmany" data-t="${type}" data-n="5">Open ×5 more</button>`:''}${(free>0||M.coins>=b.p)&&boxVisible(type)?`<button data-act="lootagain" data-t="${type}">${free>0?'Open 1 (free)':'Open 1 · 🪙 '+b.p}</button>`:''}<button data-act="lootclose">Close</button></span></div></div>`;
  ov._reveal=reveal;if(RM){res.forEach((_,i)=>reveal(i));return}
  res.forEach((_,i)=>LT.push(setTimeout(()=>{if($('lootov')&&$('lootov').className==='on'&&ov._reveal===reveal)reveal(i)},700+i*650)))};
 if(RM){paint();return}
 ov.innerHTML=chargeHTML(b,1);chargeSnd(1);LT.push(setTimeout(()=>{if(ov.className==='on'&&LTOK===tok)paint()},1050))}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#lootov [data-act],#lootov .lm-card');if(!b)return;const ov=$('lootov');
 if(b.classList&&b.classList.contains('lm-card')){ov._reveal&&ov._reveal(+b.dataset.i);return}
 if(b.dataset.act==='lmrevealall'){const n=document.querySelectorAll('#lootov .lm-card').length;for(let i=0;i<n;i++)ov._reveal&&ov._reveal(i)}},true);

function setLine(it){const ss=setsOf(it);let h='';if(ss.length)h+=`<div class="lpity" style="color:var(--fg)">Sets: ${ss.map(s=>{const p=setProg(s);return `${s.ico} ${esc(s.n)} ${p.own}/${p.tot}${p.done?' ✓':''}`}).join(' · ')}</div>`;if(LASTSETS.length)h+=`<div class="lpity" style="color:var(--fg)">🎉 Set complete: ${LASTSETS.map(s=>esc(s.n)).join(' · ')}</div>`;LASTSETS=[];return h}

