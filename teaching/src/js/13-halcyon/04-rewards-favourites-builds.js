/* ===================== v3: Halcyon rewards, favourites, builds, transitions ===================== */
/* ---- Halcyon Arcade rewards: SP and coins ---- */
const HXSPCAP=60,HXCCAP=200,HXTIER={bronze:[6,15],silver:[15,35],gold:[30,75]};
const hxDay=()=>{if(!M.hxd||M.hxd.d!==dayN())M.hxd={d:dayN(),sp:0,c:0};return M.hxd};
function hxGive(sp,coins,label){const D=hxDay();const s=Math.min(sp,Math.max(0,HXSPCAP-D.sp)),c=Math.min(coins,Math.max(0,HXCCAP-D.c));
 if(s<=0&&c<=0){if(!D.note){D.note=1;mDirty=true;toast('👾 You hit today\'s Halcyon reward limit. Come back tomorrow for more!')}return false}
 D.sp+=s;D.c+=c;let got=0;if(s>0)got=addSP(s,'Halcyon Arcade','hx')||0;
 const extra=Math.max(0,c-got);if(extra)M.coins+=extra;mDirty=true;paintChip();
 toast(`👾 ${label}: +${got} SP · +${Math.max(c,got)} 🪙`);if(cur==='')try{softRefresh()}catch(e){}return true}
function hxEvent(ev,d){const R=M.hxr=M.hxr||{};let sp=0,c=0,key='',label='';
 if(ev==='trophy'){const t=HXTIER[d.tier]||HXTIER.bronze;sp=t[0];c=t[1];key='t:'+d.game+':'+d.id;label='Trophy'}
 else if(ev==='daily'||ev==='assignment'){sp=10;c=25;key=ev[0]+':'+d.id+':'+dayN();label=ev==='daily'?'Daily challenge':'Assignment'}
 else if(ev==='rank'){sp=25;c=60;key='r:'+d.rank;label='New rank'}
 else if(ev==='session'){const mins=Math.min(10,Math.floor((d.seconds||0)/60));if(mins<1||!(d.gains&&d.gains.length))return;sp=mins;c=mins*3;label='Good session'}
 else return;
 if(key){if(R[key])return;if(hxGive(sp,c,label))R[key]=1}else hxGive(sp,c,label)}
addEventListener('message',e=>{const m=e.data;if(!m||m.source!=='halcyon-arcade')return;try{if(![...views.querySelectorAll('iframe')].some(f=>f.contentWindow===e.source))return;hxEvent(m.event,m.data||{})}catch(er){}});

/* ---- favourites ---- */
const hxFav=()=>(M.fav=M.fav&&typeof M.fav==='object'&&!Array.isArray(M.fav)?M.fav:{});
const hxBuilds=()=>(M.builds=Array.isArray(M.builds)?M.builds:[]);
function hxFavToggle(id){const f=hxFav();if(f[id])delete f[id];else f[id]=1;mDirty=true;mSave();return !!f[id]}

/* ---- saved builds (a build = the theme + every look option) ---- */
const HXMAXB=12,hxThemeName=m=>m==='auto'?'Default':m==='light'?'Light':m==='dark'?'Dark':m==='halloween'?'Halloween':XT[m]?XT[m].n:m;
function hxLookSnap(){const set={};Object.keys(M.set).forEach(k=>{if(!HXKEEP.includes(k))set[k]=JSON.parse(JSON.stringify(M.set[k]))});return{mode,set}}
function hxApplyBuild(b){hxLookCore();let skipped=0;
 Object.keys(b.set||{}).forEach(k=>{const v=b.set[k];if(typeof v==='string'&&/^hx_/.test(v)&&!M.inv.own[v]){skipped++;return}M.set[k]=JSON.parse(JSON.stringify(v))});
 let m=b.mode||'auto';if(!(m==='auto'||m==='light'||m==='dark'||(m==='halloween'?hwIn():XT[m]&&themeOK(m)))){if(m!=='auto')skipped++;m='auto'}
 mode=m;try{localStorage.setItem('mp-theme',mode)}catch(e){}applyExtras();applyTheme();try{paintChip()}catch(e){}mSave();if(cur===''||cur==='profile'||cur==='shop')renderPane(cur);return skipped}
function hxLooks(){const b=hxOpen('looks','⭐ My Looks'),F=Object.keys(hxFav()),B=hxBuilds();
 const rows=F.map(id=>{if(id.slice(0,3)==='hx:'){const k=id.slice(3),t=HXT.find(x=>x.k===k);if(!t)return '';const own=hxOwn(t),on=mode===k;return `<div class="hxslot"><span><b>${t.ico} ${ESCX(t.n)}</b> · Halcyon set</span><button data-hx="eqfav" data-id="${id}" ${own?'':'disabled'} class="${on?'on':''}">${own?(on?'Equipped ✓':'Equip set'):'🔒 Locked'}</button><button data-hx="unfav" data-id="${id}" aria-label="Remove from favourites">★ Remove</button></div>`}
  const it=cat(id);if(!it)return '';const on=isEquipped(it),has=M.inv.own[id];return `<div class="hxslot"><span><span style="color:${RAR[it.r].c}">●</span> <b>${ESCX(it.n)}</b> · ${ESCX(CATN[it.c]||it.c)}</span><button data-hx="eqfav" data-id="${ESCX(id)}" ${has?'':'disabled'} class="${on?'on':''}">${on?'Equipped ✓':'Equip'}</button><button data-hx="unfav" data-id="${ESCX(id)}" aria-label="Remove from favourites">★ Remove</button></div>`}).join('');
 b.innerHTML=`<h3>★ Favourites</h3><p>Star any item you own in <b>Shop &amp; Rewards → Collection</b>, or a Halcyon set in the Studio. They all show up here for one-tap equipping.</p>${rows||'<p><i>Nothing starred yet.</i></p>'}
 ${hxTrHTML()}<h3>💾 Saved builds</h3><p>A build remembers your theme and every look option (backgrounds, cards, fonts, avatar, effects and so on). Set up a look you like, save it, and load it any time. Up to ${HXMAXB}.</p>
 <div class="hxbt"><input id="hxbn" class="hxinp" maxlength="40" placeholder="Name your build" aria-label="Build name"><button class="pri" data-hx="bsave" ${B.length>=HXMAXB?'disabled':''}>Save current look</button></div>
 ${B.map((x,i)=>`<div class="hxslot hxbuild"><input class="hxbname hxinp" data-i="${i}" value="${ESCX(x.name)}" maxlength="40" aria-label="Build name"><span>${ESCX(hxThemeName(x.mode))} · ${Object.keys(x.set||{}).filter(k=>x.set[k]!==''&&x.set[k]!==false&&x.set[k]!=null).length} options · ${ESCX(hxWhen(x.t))}</span><button data-hx="bload" data-i="${i}" class="pri">Load</button><button data-hx="bupd" data-i="${i}">Update</button><button data-hx="bdel" data-i="${i}">Delete</button></div>`).join('')||'<p><i>No saved builds yet.</i></p>'}<h3>🧰 My Assets</h3><p><button data-hx="fdopen">Upload your own images…</button> <span class="mut">Use your artwork as a banner, background or sticker.</span></p><h3>✨ Effects</h3><p><button data-hx="jxmode">Effects: ${jxLabel()}</button> <span class="mut">Floating numbers, combos, lucky strikes, ripples and screen flashes.</span></p>`}

/* ---- transitions as collectible items ---- */
const HXTR=[ /* key, name, icon, rarity, seconds, easing, keyframes, keep the staggered cards? */
 ['fade','Soft fade','🌫️','common',.35,'ease','from{opacity:0}to{opacity:1}',0],
 ['slide','Side slide','➡️','common',.42,'cubic-bezier(.2,.8,.2,1)','from{opacity:0;transform:translateX(56px)}to{opacity:1;transform:none}',0],
 ['zoom','Zoom in','🔍','common',.4,'cubic-bezier(.2,.8,.2,1)','from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}',0],
 ['cascade','Cascade','🧱','common',.5,'cubic-bezier(.2,.75,.2,1)','from{opacity:0}to{opacity:1}',1],
 ['flip','Card flip','🃏','rare',.55,'cubic-bezier(.2,.8,.2,1)','from{opacity:0;transform:perspective(900px) rotateX(-18deg) translateY(24px);transform-origin:top center}to{opacity:1;transform:none;transform-origin:top center}',0],
 ['focus','Focus pull','📷','rare',.55,'ease-out','from{opacity:0;filter:blur(16px);transform:scale(1.04)}to{opacity:1;filter:blur(0);transform:none}',0],
 ['wipe','Curtain wipe','🎭','rare',.6,'cubic-bezier(.7,0,.2,1)','from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}',0],
 ['bounce','Springy bounce','🏀','rare',.65,'ease-out','0%{opacity:0;transform:translateY(70px)}55%{opacity:1;transform:translateY(-10px)}78%{transform:translateY(4px)}100%{transform:none}',0],
 ['glitch','Glitch','📺','epic',.55,'linear','0%{opacity:0;transform:translateX(-14px) skewX(8deg);filter:hue-rotate(90deg)}15%{opacity:1;transform:translateX(12px) skewX(-6deg);filter:hue-rotate(-60deg)}30%{transform:translateX(-7px);clip-path:inset(20% 0 40% 0)}45%{transform:translateX(6px);clip-path:inset(0 0 0 0)}65%{filter:hue-rotate(30deg);transform:translateX(-2px)}100%{transform:none;filter:none}',0],
 ['iris','Iris open','👁️','epic',.7,'cubic-bezier(.5,0,.2,1)','from{clip-path:circle(0% at 50% 35%)}to{clip-path:circle(150% at 50% 35%)}',0],
 ['crt','CRT power-on','🖥️','epic',.6,'cubic-bezier(.3,.6,.2,1)','0%{opacity:1;transform:scale(.55,.004);filter:brightness(5)}45%{transform:scale(1,.01);filter:brightness(3)}100%{transform:none;filter:none}',0],
 ['cube','Cube turn','🧊','epic',.6,'cubic-bezier(.2,.8,.2,1)','from{opacity:0;transform:perspective(1200px) rotateY(-65deg);transform-origin:left center}to{opacity:1;transform:none;transform-origin:left center}',0],
 ['vhs','VHS rewind','📼','epic',.6,'linear','0%{opacity:0;transform:translateY(-32%);filter:saturate(3) contrast(1.5)}20%{opacity:1;transform:translateY(12%)}40%{transform:translateY(-6%) skewX(3deg)}65%{transform:translateY(3%)}100%{transform:none;filter:none}',0],
 ['warp','Hyperspace warp','🚀','legendary',.65,'cubic-bezier(.1,.8,.2,1)','0%{opacity:0;transform:scale(1.8);filter:blur(16px) brightness(2.4)}55%{opacity:1}100%{transform:none;filter:none}',0],
 ['portal','Portal','🌀','legendary',.75,'cubic-bezier(.5,0,.2,1)','from{clip-path:circle(0% at 50% 50%);transform:rotate(-12deg) scale(.75);opacity:.2}to{clip-path:circle(125% at 50% 50%);transform:none;opacity:1}',0],
 ['curtain','Curtain of light','🌌','mythic',.85,'cubic-bezier(.4,0,.2,1)','0%{opacity:0;clip-path:inset(0 100% 0 0);filter:hue-rotate(80deg) brightness(1.8) saturate(1.6)}60%{opacity:1;filter:hue-rotate(20deg) brightness(1.3)}100%{opacity:1;clip-path:inset(0 0 0 0);filter:none}',0]];
CATN.trans='Transitions';NEWC.trans='trans';
HXTR.forEach(t=>addC('trans','tr_'+t[0],t[1]+' transition',t[3],{key:t[0],i:t[2]}));
BOX.style.cats.push('trans');BOX.style.d=BOX.style.d.replace(' and crate skins.',', crate skins and transitions.');
{let css='.trpv{height:62px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);display:grid;place-items:center;overflow:hidden}.trpv i{display:block;width:62%;height:62%;border-radius:6px;background:linear-gradient(120deg,var(--acc),var(--bd));box-shadow:0 0 0 1px var(--bd)}@media(prefers-reduced-motion:no-preference){';
 HXTR.forEach(([k,n,i,r,d,e,kf,keep])=>{css+=`@keyframes tr-${k}{${kf}}html[data-tr=${k}] #home.hxin,html[data-tr=${k}] #views iframe.on.hxin{animation:tr-${k} ${d}s ${e} both}`+(keep?'':`html[data-tr=${k}] #home.hxin .wrap>*{animation:none}`)+`.trpv[data-tr=${k}] i{animation:tr-${k} ${d+1.1}s ${e} infinite}`});
 css+='}html[data-rm] .trpv i{animation:none!important}';const st=document.createElement('style');st.id='hxtr';st.textContent=css;document.head.appendChild(st)}
const hxTrSet=()=>{const k=M.set.trans||'';if(k)root.dataset.tr=k;else delete root.dataset.tr};
function hxReplay(){if(META.some(a=>a.id===cur)){const f=views.querySelector('iframe.on');f&&hxRestart(f,'hxin')}else hxRestart(home,'hxin')}
const hxTrHTML=()=>{const own=CATALOG.filter(x=>x.c==='trans'&&M.inv.own[x.id]),c=M.set.trans||'';return `<h3>🎞 Tab transition</h3><p>How tabs and labs appear. Tap one to try it. Find more in the Collection under Transitions (Style Crates drop them).</p><div class="hxbt"><button data-hx="tr" data-k="" class="${!c?'on':''}">Rise &amp; fade</button>${own.map(x=>`<button data-hx="tr" data-k="${x.key}" class="${c===x.key?'on':''}">${x.i} ${ESCX(x.n.replace(' transition',''))}</button>`).join('')}</div>`};
{const _ae=applyExtras;applyExtras=function(){const r=_ae.apply(this,arguments);try{hxTrSet()}catch(e){}return r}}
{const _se=shopEquip;shopEquip=function(id,q){const r=_se(id,q);try{const it=cat(id);if(it&&it.c==='trans'){hxTrSet();if(!q)hxReplay()}}catch(e){}return r}}


