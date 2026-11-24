/* ======= DAILY ITEM SHOP (changes every day, buy directly) ======= */
const SHP_PRICE={common:80,rare:200,epic:480,legendary:1100,mythic:2600};
const SHP_EX=[['av','avatar','Avatar ','common',['🦔','🐳','🌵','🍙','🧁']],['av','avatar','Avatar ','rare',['🦩','🐲','🧿','🪁','🎻','🦜']],['av','avatar','Avatar ','epic',['🐉','🪬','🧞','🌋','🦚']],['av','avatar','Avatar ','legendary',['👑','☄️','🏆']],
 ['flair','flair','Flair ','common',['🍀','📎']],['flair','flair','Flair ','rare',['💫','🎯','🧩']],['flair','flair','Flair ','epic',['🔱','⚡','🌈']],['flair','flair','Flair ','legendary',['💠']],
 ['title','title','','common',['Coffee-Powered','Tab Hoarder']],['title','title','','rare',['Off-By-One Survivor','Segfault Whisperer','Cache Me Outside']],['title','title','','epic',['Pipeline Architect','Deadlock Diplomat']],['title','title','','legendary',['Halting Problem Solved','Master Of The Master Theorem']],
 ['av','avatar','Avatar ','common',['🐹','🦦','🥨','🍉','🪴','🧸','🐞','🥐']],['av','avatar','Avatar ','rare',['🦥','🪼','🦭','🐊','🧋','🪅','🦫','🛼']],['av','avatar','Avatar ','epic',['🪩','🧬','🦑','🏯','🪐']],['av','avatar','Avatar ','legendary',['🔱','🦋','🗿']],
 ['flair','flair','Flair ','common',['🧃','🪙','🍡']],['flair','flair','Flair ','rare',['🫧','🪄','🧲','🎐']],['flair','flair','Flair ','epic',['🪷','🔆','🧿']],
 ['title','title','','common',['Syllabus Skimmer','Night Shift Scholar','Highlighter Enthusiast','Deadline Dodger']],['title','title','','rare',['Rubber Duck Whisperer','Merge Conflict Survivor','Binary Search Believer','Stack Overflow Veteran']],['title','title','','epic',['Garbage Collector Of Ideas','Thread Safe Thinker','Lord Of The Linked List']],['title','title','','legendary',['Undefined Behavior Tamer','The Last Commit']]];
{const have=new Set(CATALOG.map(x=>x.c+'|'+(x.av||x.flair||x.title||'')));let n=0;SHP_EX.forEach(([fld,c,pre,r,list])=>list.forEach(v=>{if(have.has(c+'|'+v))return;const o={pack:'shop'};o[fld]=v;addC(c,'shp_'+c+'_'+(n++),pre+v,r,o)}))}
const SHP_SLOTS=[{k:'feat',lab:'Featured',w:{legendary:.55,epic:.38,mythic:.07}},{k:'spot',lab:'Spotlight',ex:1,w:{epic:.5,rare:.5}},{k:'spot',lab:'Spotlight',w:{epic:.45,rare:.55}},{k:'spot',lab:'Spotlight',w:{epic:.4,rare:.6}},{k:'day',lab:'Daily',w:{rare:.45,common:.55}},{k:'day',lab:'Daily',ex:1,w:{rare:.4,common:.6}},{k:'day',lab:'Daily',w:{rare:.35,common:.65}},{k:'day',lab:'Daily',w:{rare:.3,common:.7}},{k:'day',lab:'Daily',w:{rare:.25,common:.75}}];
const shpEligible=it=>!it.noDrop&&(!it.pack||it.pack==='shop')&&!it.cas&&!/^hx_/.test(it.id)&&!hiddenItem(it)&&SHP_PRICE[it.r];
function shpRoll(d){const R=rng(d*40503+17),pool=CATALOG.filter(shpEligible),used=new Set(),out=[];
 SHP_SLOTS.forEach((sl,i)=>{
  let r='common',x=R();for(const k in sl.w){x-=sl.w[k];if(x<0){r=k;break}}
  const FV=hxFav(),pick=(rar,ex)=>{const base=ex?pool.filter(it=>it.pack==='shop'):pool;let p=base.filter(it=>it.r===rar&&!used.has(it.id)&&!M.inv.own[it.id]);if(!p.length&&!ex)p=base.filter(it=>it.r===rar&&!used.has(it.id));return p.flatMap(it=>FV[it.id]?[it,it,it,it,it]:[it])};
  let p=sl.ex?pick(r,1):[];if(!p.length&&sl.ex){for(const rr of ['rare','common','epic','legendary']){p=pick(rr,1);if(p.length)break}}if(!p.length)p=pick(r);if(!p.length){for(const rr of ['epic','rare','common','legendary']){p=pick(rr);if(p.length)break}}
  if(!p.length)return;const it=p[Math.floor(R()*p.length)];used.add(it.id);
  const disc=sl.k==='feat'?0:[0,0,10,15,20,25,30][Math.floor(R()*7)];
  out.push({id:it.id,slot:i,lab:sl.lab,k:sl.k,disc,price:Math.max(5,Math.round(SHP_PRICE[it.r]*(1-disc/100)/5)*5),ex:it.pack==='shop'?1:0})});
 return out}
const SHP_TOK_DAY=1/400,SHP_TOK_BOX=1/2500;
const shpTok=()=>M.inv.qty.shoptoken||0;
function shpFindToken(how){M.inv.qty.shoptoken=shpTok()+1;M.tokSeen=1;mDirty=true;setTimeout(()=>{toast(how==='crate'?'🎟✨ Something golden was hiding in that crate: a Golden Shop Token!':'🎟✨ A Golden Shop Token slid under your door! Open the Item Shop.');try{confetti(true)}catch(e){}mSave();paintChip()},1800)}
function shpS(){const d=dayN();if(M.shop&&M.shop.d===d&&M.shop.v!==3){const o=M.shop;M.shop=null;M.shop={v:3,d,items:shpRoll(d),bought:o.bought||{},bonus:o.bonus||0,seen:o.seen||0,streak:o.streak||0,carry:o.carry||0,last:o.last||0,sbDone:o.sbDone};mDirty=true}if(!M.shop||M.shop.d!==d){const keep=(M.shop&&M.shop.streak)||0,last=(M.shop&&M.shop.last)||0;M.shop={v:3,d,items:shpRoll(d),bought:{},bonus:0,seen:0,streak:(last===d-1)?keep:0,carry:(last===d-1)?keep:0,last:last};mDirty=true;if(Math.random()<SHP_TOK_DAY)shpFindToken('door')}return M.shop}
const shpReg=()=>{const c=(M.shop&&M.shop.carry)||0;return c>=6?10:c>=2?5:0};const shpPrice=e=>{const r=shpReg();return r?Math.max(5,Math.round(e.price*(1-r/100)/5)*5):e.price};
function shpLeft(){const n=new Date(),t=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1).getTime()-n.getTime(),h=Math.floor(t/36e5),m=Math.floor(t%36e5/6e4);return {h,m,txt:h?`${h}h ${m}m`:`${m} min`,pct:Math.round((1-t/864e5)*100)}}
function shpCard(e,big){const it=cat(e.id);if(!it)return '';const S=M.shop,r=RAR[it.r],own=!!M.inv.own[it.id],bought=!!S.bought[it.id],can=M.coins>=shpPrice(e);
 const pv=it.c==='font'?fontPreview(it.font):previewHTML(it);
 const tag=e.disc?`<span class="shpoff">-${e.disc}%</span>`:'';const exb=e.ex?'<span class="shpex">SHOP EXCLUSIVE</span>':'';const wl=hxFav()[it.id]?'<span class="shpex wl">★ ON YOUR WISHLIST</span>':'';
 const old=(e.disc||shpReg())?`<s>🪙 ${SHP_PRICE[it.r]}</s> `:'';
 const act=own?(bought?`<div class="shpsold">SOLD · yours now</div><button class="${isEquipped(it)?'':'pri'}" data-act="equip" data-id="${esc(it.id)}">${isEquipped(it)?'Equipped ✓':'Equip it'}</button>`:`<div class="shpsold">Already in your locker</div>`):`${old?`<div class="mut shpmore">${old}normally</div>`:''}<button class="${can?'pri':''}" data-hx="shpbuy" data-id="${esc(it.id)}" ${can?'':'disabled'}>Buy · 🪙 ${shpPrice(e)}</button>${can?'':`<div class="mut shpmore">${Math.ceil(shpPrice(e)-M.coins)} more coins</div>`}`;
 return `<div class="card shpc ${big?'big':''} ${own?'own':''}" style="--rc:${r.c}">${tag}${exb}${wl}<div class="shpr"><span style="color:${r.c}">●</span> ${r.n} · ${esc(CATN[it.c]||it.c)}</div><div class="shppv">${pv}</div><b>${esc(it.n)}</b>${act}</div>`}
function hxShopHTML(){const S=shpS(),lf=shpLeft();if(!S.seen){S.seen=1;mDirty=true}
 const by=k=>S.items.filter(e=>e.k===k),own=S.items.filter(e=>M.inv.own[e.id]).length,all=S.items.length&&own===S.items.length;
 const sweep=all?(S.bonus?`<div class="card shpsw done">🧹 <b>Shop sweep complete!</b> You own everything on today's shelf. Your Discovery Crate is already in your crates.</div>`:`<div class="card shpsw">🧹 You already own the whole shelf today.</div>`):`<div class="card shpsw">🧹 <b>Shop sweep:</b> own all ${S.items.length} items on today's shelf (${own}/${S.items.length}) and a free <b>Discovery Crate</b> drops. Shop on 2 days in a row for -5% prices, 6 days for -10%.</div>`;
 const streak=S.streak>=1?`<span class="chip2">🔥 ${S.streak}-day shopping streak</span>`:'';
 return `<div class="card hero shphead"><div class="hrow"><div><div class="big">🛍 Today's Item Shop</div><div class="mut">Nine pieces of customization, back for one day only. Tomorrow the shelf changes. ★ Favourite items from your collection are far more likely to show up here.</div></div><div class="chips"><span class="chip2" id="shpcd">⏳ Restocks in ${lf.txt}</span>${streak}${shpReg()?`<span class="chip2">🏷 Regular's discount -${shpReg()}%</span>`:''}</div></div><div class="bar2"><i id="shpbar" style="width:${lf.pct}%"></i></div></div>
 ${shpTokHTML(S)}<h3 class="shph">⭐ Featured</h3><div class="shpg f1">${by('feat').map(e=>shpCard(e,1)).join('')}</div>
 <h3 class="shph">🔥 Spotlight</h3><div class="shpg f2">${by('spot').map(e=>shpCard(e)).join('')}</div>
 <h3 class="shph">📅 Daily</h3><div class="shpg f3">${by('day').map(e=>shpCard(e)).join('')}</div>${sweep}
 <p class="mut" style="font-size:12px">Shop Exclusive items can only be bought here. Items you already own are never picked for the shelf if there is still something new to offer. What you see is saved for the whole day.</p>`}
function shpTokHTML(S){const n=shpTok(),left=S.items.filter(e=>!M.inv.own[e.id]).length;
 if(n>0)return `<div class="card shptoken"><div class="shptk" aria-hidden="true">🎟</div><div class="shptx"><b>Golden Shop Token × ${n}</b><span>${left?`Spend one to take <b>every item on today's shelf for free</b> (${left} still unowned). Worth ${S.items.filter(e=>!M.inv.own[e.id]).reduce((a,e)=>a+shpPrice(e),0)} 🪙 right now.`:'You already own everything on today\'s shelf. Save it for a day with a big shelf.'}</span></div><button class="pri" data-hx="shptokask" ${left?'':'disabled'}>✨ Use the token</button></div>`;
 return M.tokSeen?`<p class="mut shptip">🎟 You found a Golden Shop Token once. They are extremely rare: about 1 chance in 400 each new day, and 1 in 2,500 from any crate.</p>`:''}
function shpClick(a,t){if(a==='shptokask'){const S=shpS(),b=hxOpen('shptok','🎟 Use the Golden Shop Token?');const items=S.items.filter(e=>!M.inv.own[e.id]).map(e=>cat(e.id)).filter(Boolean);
  b.innerHTML=`<p>This claims <b>all ${items.length} unowned items</b> on today's shelf for free. The token is used up, and the shelf will be different tomorrow.</p><div class="shpgl">${items.map(it=>`<span style="border-color:${RAR[it.r].c}">${esc(it.n)}</span>`).join('')}</div><div class="hxbt"><button class="pri" data-hx="shptokgo">✨ Yes, claim the whole shop</button><button data-hx="shptokno">Not yet</button></div>`}
 else if(a==='shptokno')hxClose();
 else if(a==='shptokgo'){hxClose();shpUseToken()}}
function shpUseToken(){const S=shpS();if(shpTok()<1)return;const items=S.items.filter(e=>!M.inv.own[e.id]);if(!items.length)return;
 M.inv.qty.shoptoken=shpTok()-1;items.forEach(e=>{M.inv.own[e.id]=1;S.bought[e.id]=1});S.last=dayN();if(!S.sbDone){S.sbDone=1;S.streak=(S.streak||0)+1}
 let extra='';if(S.items.every(x=>M.inv.own[x.id])&&!S.bonus){S.bonus=1;M.inv.box.disc=(M.inv.box.disc||0)+1;extra=' + Shop sweep Discovery Crate'}
 mDirty=true;mSave();paintChip();try{checkQuests();checkSets();checkAch()}catch(e){}
 const o=document.createElement('div');o.id='shpgold';o.innerHTML=`<div><div class="shpgt">🎟</div><h2>The whole shop is yours</h2><p>${items.length} items added to your collection${extra}</p><div class="shpgl">${items.map(e=>{const it=cat(e.id);return `<span style="border-color:${RAR[it.r].c}">${esc(it.n)}</span>`}).join('')}</div><small>Tap to close</small></div>`;
 document.body.appendChild(o);o.onclick=()=>o.remove();setTimeout(()=>o.remove(),9000);try{confetti(true);setTimeout(()=>confetti(true),500)}catch(e){}
 renderShop()}
function shpBuy(id){const S=shpS(),e=S.items.find(x=>x.id===id),it=cat(id);if(!e||!it||M.inv.own[id])return;if(M.coins<shpPrice(e)){toast('Not enough coins yet. Keep studying! 🪙');return}
 M.coins-=shpPrice(e);M.inv.own[id]=1;S.bought[id]=1;S.last=dayN();if(!S.sbDone){S.sbDone=1;S.streak=(S.streak||0)+1}
 let extra='';if(S.items.every(x=>M.inv.own[x.id])&&!S.bonus){S.bonus=1;M.inv.box.disc=(M.inv.box.disc||0)+1;extra=' 🧹 Shop sweep! A free Discovery Crate was added.'}
 mDirty=true;mSave();paintChip();try{checkQuests();checkSets();checkAch()}catch(e){}
 toast(`🛍 Bought ${it.n}!${extra}`);if(it.r==='epic'||it.r==='legendary'){try{confetti(true)}catch(e){}}
 renderShop()}
function hxShopCard(){const S=shpS(),f=S.items[0]&&cat(S.items[0].id),lf=shpLeft(),left=S.items.filter(e=>!M.inv.own[e.id]).length;
 return `<div class="card shpcard${S.seen?'':' hot'}"><div class="shpico" aria-hidden="true">🛍</div><div><b>Today's Item Shop${S.seen?'':' <span class="hxnew" style="color:#c62828">NEW</span>'}</b><span>${left?`${left} of ${S.items.length} items still for sale`:'You cleared the whole shelf!'}${f?` · featured: <b>${esc(f.n)}</b>`:''} · restocks in ${lf.txt}</span></div><div class="hxbtn"><button class="pri" data-hx="shpopen">Browse the shop</button></div></div>`}
const _rollTok=rollOnce;rollOnce=function(type,free){const r=_rollTok(type,free);if(r&&Math.random()<SHP_TOK_BOX)shpFindToken('crate');return r};
function shpTick(){const c=$('shpcd');if(c){const lf=shpLeft();c.textContent='⏳ Restocks in '+lf.txt;const b=$('shpbar');if(b)b.style.width=lf.pct+'%';if(M.shop&&M.shop.d!==dayN()&&shopTab==='daily')renderShop()}}
setInterval(shpTick,30000);
HUBTABS.unshift(['daily','🛍 Item Shop']);shopTab='daily';

