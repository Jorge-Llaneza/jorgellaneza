/* ===================== HALCYON PACK: themes + customisation from the six games, studio, save/load ===================== */
const HXSETDEF=JSON.parse(JSON.stringify(M.set));
const HXPCB=(c,o)=>`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' fill='none' stroke='%23${c}' stroke-opacity='${o}' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M0 44H64L84 64H150L170 44H220M0 132H34L54 112H110L130 132H220M44 0V34L66 56V96M176 220V186L154 164V122M0 188H72L92 208V220'/%3E%3Ccircle cx='66' cy='100' r='4'/%3E%3Ccircle cx='154' cy='118' r='4'/%3E%3Ccircle cx='168' cy='76' r='4'/%3E%3C/svg%3E")`;
const HXSUITS=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg fill='%23e0b04f' fill-opacity='.10' font-size='28' font-family='serif'%3E%3Ctext x='10' y='38'%3E%E2%99%A0%3C/text%3E%3Ctext x='70' y='38'%3E%E2%99%A5%3C/text%3E%3Ctext x='10' y='98'%3E%E2%99%A6%3C/text%3E%3Ctext x='70' y='98'%3E%E2%99%A3%3C/text%3E%3C/g%3E%3C/svg%3E")`;
const HXT=[
 {k:'hx_port',g:'port-halcyon',ico:'⚓',gn:'Port Halcyon',topic:'Accessibility',n:'Harbor Registry',d:'Sea-chart paper, brass and harbor ink.',base:'light',bg:'#dfe8df',fg:'#102f3a',mut:'#3f5b63',card:'#f3f7f1',card2:'#e8efe6',bd:'#93b3b3',ok:'#1f7a55',bad:'#b3321f',acc:'#7a5820',on:'#ffffff',acc2:'#2f7390',gc:'#c99a4b',head:'"Arial Narrow","Franklin Gothic Medium",Impact,sans-serif',up:1,
  x:{bg:'Sea chart',card:'Registry form',chip:'Harbor stamp',toast:'Telegram'}},
 {k:'hx_pipe',g:'pipeline-factory',ico:'🏭',gn:'Pipeline Factory',topic:'CPU design',n:'Factory Floor',d:'Navy steel, copper and a moving conveyor belt.',base:'dark',bg:'#0a1522',fg:'#e6edf5',mut:'#8ba2ba',card:'#12233a',card2:'#1a3150',bd:'#27425f',ok:'#8fd694',bad:'#ff5a5f',acc:'#e8903f',on:'#000000',acc2:'#5cc8ff',gc:'#e8903f',head:'"Barlow Condensed","Arial Narrow",sans-serif',up:1,
  x:{bg:'Conveyor belt',card:'Steel plate',chip:'Copper badge',toast:'Status panel'}},
 {k:'hx_relay',g:'relay-7',ico:'⚡',gn:'Relay 7',topic:'Electronics',n:'Circuit Defusal',d:'Black PCB, cyan traces and one hot red wire.',base:'dark',bg:'#070d0f',fg:'#d6e6e4',mut:'#7f9a98',card:'#121c1f',card2:'#182529',bd:'#2b3d42',ok:'#3fe0d0',bad:'#ff4b2b',acc:'#3fe0d0',on:'#000000',acc2:'#e08a3c',gc:'#3fe0d0',head:'ui-monospace,"IBM Plex Mono",Consolas,monospace',up:0,
  x:{bg:'PCB traces',card:'Component',chip:'LED tag',toast:'Fault readout'}},
 {k:'hx_keep',g:'pathfinders-keep',ico:'🏰',gn:"Pathfinder's Keep",topic:'Algorithms',n:'Rune Keep',d:'Midnight violet, rune gold and ley-line teal.',base:'dark',bg:'#0f0b1a',fg:'#ece8f7',mut:'#a79fc4',card:'#1a1430',card2:'#231a3e',bd:'#4b3f70',ok:'#46d6c4',bad:'#e8506a',acc:'#ecc66b',on:'#000000',acc2:'#46d6c4',gc:'#ecc66b',head:'Cinzel,Georgia,"Times New Roman",serif',up:0,
  x:{bg:'Starry runes',card:'Rune parchment',chip:'Rune seal',toast:'Scroll'}},
 {k:'hx_proof',g:'proof-lab',ico:'🧪',gn:'Aperture Proof Lab',topic:'Logic',n:'Test Chamber',d:'Dark lab glass, orange hazard and cyan portals.',base:'dark',bg:'#0e1217',fg:'#e9eef4',mut:'#8d98a6',card:'#161c24',card2:'#1e2630',bd:'#3a424d',ok:'#4be39a',bad:'#ff5a4d',acc:'#ff7a1a',on:'#000000',acc2:'#38c8ff',gc:'#ff7a1a',head:'"Chakra Petch","Segoe UI",system-ui,sans-serif',up:1,
  x:{bg:'Chamber panels',card:'Test panel',chip:'Hazard tag',toast:'Lab notice'}},
 {k:'hx_logic',g:'logic-engine',ico:'🃏',gn:'Logic Engine',topic:'Programming',n:'Felt & Brass',d:'Green felt, brass trim and playing-card gloss.',base:'dark',bg:'#06130e',fg:'#e8efe6',mut:'#8ea89a',card:'#0c2a1f',card2:'#12392b',bd:'#2f5d49',ok:'#5fd39a',bad:'#e05a55',acc:'#e0b04f',on:'#1a1204',acc2:'#7fc8e8',gc:'#e0b04f',head:'Limelight,"Bodoni MT",Didot,Georgia,serif',up:0,
  x:{bg:'Card suits',card:'Playing card',chip:'Brass plate',toast:'Marquee'}}];
const HXX={
 hx_port:{bg:`background-image:repeating-radial-gradient(circle at 80% 15%,#2f739022 0 2px,transparent 2px 28px),linear-gradient(#2f739018 1px,transparent 1px),linear-gradient(90deg,#2f739018 1px,transparent 1px)!important;background-size:auto,44px 44px,44px 44px!important`,
  card:`border:2px double #8f6a2c!important;border-radius:4px!important;box-shadow:inset 0 0 0 4px #c99a4b18!important`,
  chip:`--chip-img:linear-gradient(#10293a,#10293a);--chip-fg:#ffc45c;--fg:#ffc45c;--acc:#ffc45c;border:2px double #c99a4b;border-radius:4px`,
  toast:`background:#ffe9a8;color:#3a2a00;border:2px dashed #8f6a2c;border-radius:2px;font-family:ui-monospace,Consolas,monospace;letter-spacing:.04em`},
 hx_pipe:{bg:`background-image:repeating-linear-gradient(90deg,#e8903f16 0 20px,transparent 20px 40px),repeating-linear-gradient(#5cc8ff0d 0 1px,transparent 1px 36px)!important;background-size:40px 100%,100% 36px!important;animation:hxbelt 2.4s linear infinite`,
  card:`border:1px solid #35506f!important;border-left:5px solid #e8903f!important;border-radius:3px!important;box-shadow:inset 0 0 0 1px #ffffff08,0 3px 0 #0006!important`,
  chip:`--chip-img:linear-gradient(#1a3150,#12233a);--chip-fg:#ffb877;--fg:#ffb877;--acc:#e8903f;border:2px solid #e8903f;border-radius:3px`,
  toast:`background:#12233a;color:#e6edf5;border:1px solid #e8903f;border-left:6px solid #e8903f;border-radius:3px;font-family:ui-monospace,Consolas,monospace`},
 hx_relay:{bg:`background-image:${HXPCB('3fe0d0','.10')}!important;background-size:220px 220px!important`,
  card:`border:1px solid #3fe0d044!important;border-top:2px solid #3fe0d0!important;border-radius:2px!important;box-shadow:0 0 14px #3fe0d01c!important`,
  chip:`--chip-img:linear-gradient(#121c1f,#121c1f);--chip-fg:#3fe0d0;--fg:#3fe0d0;--acc:#3fe0d0;border:2px solid #3fe0d0;border-radius:3px;box-shadow:0 0 10px #3fe0d055`,
  toast:`background:#070d0f;color:#3fe0d0;border:1px solid #3fe0d0;border-left:6px solid #ff4b2b;border-radius:2px;font-family:ui-monospace,Consolas,monospace`},
 hx_keep:{bg:`background-image:radial-gradient(#ecc66b55 1px,transparent 1.6px),radial-gradient(#46d6c444 1px,transparent 1.6px)!important;background-size:52px 52px,52px 52px!important;background-position:0 0,26px 26px!important`,
  card:`border:1px solid #ecc66b88!important;border-radius:14px!important;box-shadow:inset 0 0 18px #ecc66b14,0 0 0 3px #0f0b1a,0 0 0 4px #7d653866!important`,
  chip:`--chip-img:linear-gradient(#231a3e,#1a1430);--chip-fg:#ecc66b;--fg:#ecc66b;--acc:#ecc66b;border:2px solid #ecc66b;border-radius:16px;box-shadow:0 0 10px #ecc66b44`,
  toast:`background:linear-gradient(#2b2146,#1a1430);color:#ecc66b;border:2px solid #7d6538;border-radius:10px;font-family:Cinzel,Georgia,serif`},
 hx_proof:{bg:`background-image:linear-gradient(#38c8ff16 1px,transparent 1px),linear-gradient(90deg,#38c8ff16 1px,transparent 1px)!important;background-size:64px 64px!important`,
  card:`border:1px solid #3a424d!important;border-left:4px solid #ff7a1a!important;border-radius:2px!important;box-shadow:inset 6px 0 0 -2px #38c8ff33!important`,
  chip:`--chip-img:linear-gradient(#161c24,#161c24);--chip-fg:#ff7a1a;--fg:#ff7a1a;--acc:#ff7a1a;border:2px solid #ff7a1a;border-radius:2px`,
  toast:`background:#161c24;color:#e9eef4;border:1px solid #38c8ff;border-left:6px solid #ff7a1a;border-radius:2px;font-family:"Chakra Petch",system-ui,sans-serif`},
 hx_logic:{bg:`background-image:${HXSUITS}!important;background-size:120px 120px!important`,
  card:`border:2px solid #e0b04f88!important;border-radius:16px!important;box-shadow:inset 0 0 0 3px #0c2a1f,inset 0 0 0 4px #e0b04f33!important`,
  chip:`--chip-img:linear-gradient(#12392b,#0c2a1f);--chip-fg:#f6dc8f;--fg:#f6dc8f;--acc:#e0b04f;border:3px double #e0b04f;border-radius:14px`,
  toast:`background:linear-gradient(120deg,#e0b04f,#f6dc8f,#e0b04f);color:#2a1c04;border:2px solid #8f6a1f;border-radius:10px;font-weight:800;box-shadow:0 0 14px #e0b04f88`}};
const HXDECO={
 hx_port:`body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:repeating-radial-gradient(circle at 88% 10%,#2f739016 0 2px,transparent 2px 32px)}
html[data-xt=hx_port] .top{border-bottom:3px double #7a5820}`,
 hx_pipe:`body::before{content:'';position:fixed;left:0;right:0;bottom:0;height:14px;pointer-events:none;z-index:0;background:repeating-linear-gradient(90deg,#e8903f 0 22px,#35506f 22px 44px);opacity:.5;animation:hxbelt 1.6s linear infinite}
html[data-xt=hx_pipe] .top{border-bottom:2px solid #e8903f}`,
 hx_relay:`body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:${HXPCB('3fe0d0','.09')};background-size:220px 220px}
html[data-xt=hx_relay] .top{border-bottom:1px solid #3fe0d0;box-shadow:0 0 16px #3fe0d033}
html[data-xt=hx_relay] h1,html[data-xt=hx_relay] .big{text-shadow:0 0 10px #3fe0d055}`,
 hx_keep:`body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(circle at 50% 38%,transparent 0 230px,#ecc66b16 231px 233px,transparent 234px 270px,#ecc66b0d 271px 272px,transparent 273px),radial-gradient(#ecc66b44 1px,transparent 1.6px) 0 0/64px 64px}
html[data-xt=hx_keep] h1,html[data-xt=hx_keep] .big{text-shadow:0 0 12px #ecc66b55}`,
 hx_proof:`body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:linear-gradient(#38c8ff10 1px,transparent 1px) 0 0/64px 64px,linear-gradient(90deg,#38c8ff10 1px,transparent 1px) 0 0/64px 64px}
html[data-xt=hx_proof] .top{border-bottom:4px solid;border-image:repeating-linear-gradient(135deg,#ff7a1a 0 12px,#0e1217 12px 24px) 4}`,
 hx_logic:`body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 20%,#14583f55,transparent 70%),${HXPCB('e0b04f','.07')};background-size:auto,220px 220px}
html[data-xt=hx_logic] .top{border-bottom:3px dotted #e0b04f}`};
const hxVars=t=>`html[data-xt=${t.k}]:root:root{--bg:${t.bg};--fg:${t.fg};--mut:${t.mut};--card:${t.card};--bd:${t.bd};--ok:${t.ok};--bad:${t.bad};--acc:${t.acc};--on:${t.on};--panel:${t.card};--panel2:${t.card2};--line:${t.bd};--muted:${t.mut};--accent:${t.acc};--accent-ink:${t.on};--teal:${t.acc2};color-scheme:${t.base}}
html[data-xt=${t.k}] button[class*=pri],html[data-xt=${t.k}] button.sel,html[data-xt=${t.k}] button.on{color:var(--on)!important}`;
const hxExtra=t=>{const x=HXX[t.k],k=t.k;return `html:root[data-bg=${k}] body{${x.bg}}
html:root[data-card=${k}] .card,html:root[data-card=${k}] .tile,html:root[data-card=${k}] details.card{${x.card}}`};
const hxRootOnly=t=>{const x=HXX[t.k],k=t.k;return `html:root[data-chip=${k}] #chip,.chippv[data-chip=${k}]{${x.chip}}
html:root[data-toast=${k}] #toast,.toastpv[data-toast=${k}]{${x.toast}}
html[data-xt=${k}] ${HXDECO[k]}
html[data-xt=${k}] h1,html[data-xt=${k}] h2,html[data-xt=${k}] .big{font-family:${t.head}${t.up?';text-transform:uppercase;letter-spacing:.04em':''}}`};
const HXVARS=HXT.map(t=>hxVars(t)+'\n'+hxExtra(t)).join('\n')+'\n@keyframes hxbelt{to{background-position:40px 0,0 0}}';
{const st=document.createElement('style');st.id='hxcss';st.textContent=HXVARS+'\n'+HXT.map(hxRootOnly).join('\n')+'\n@media(prefers-reduced-motion:reduce){html[data-xt] body::before,html:root[data-bg] body{animation:none!important}}html[data-rm] body::before,html[data-rm]:root[data-bg] body{animation:none!important}';document.head.appendChild(st)}
HXT.forEach(t=>{XT[t.k]={n:t.n,d:t.d+' From '+t.gn+'.',r:'epic',pack:'',base:t.base,sw:[t.bg,t.fg,t.acc],box:true,lv:0,hx:t.g}});

/* ---- unlocking: play a game for a minute in the Halcyon Arcade ---- */
const HXNEED=60,hxOwn=t=>!!M.inv.own[t.k];
const hxSecs=g=>{try{const h=JSON.parse(localStorage.getItem('halcyon-arcade-v1')||'{}');return (h.secs&&(h.secs[g]|0))||0}catch(e){return 0}};
function hxCheck(){let n=0;HXT.forEach(t=>{if(!hxOwn(t)&&hxSecs(t.g)>=HXNEED){M.inv.own[t.k]=1;n++;mDirty=true;toast(`${t.ico} Unlocked the ${t.n} theme and extras from ${t.gn}! Open the Studio to use them.`);try{confetti(true)}catch(e){}}});
 if(n){buildOpts();if($('hxov')&&$('hxov').dataset.v==='studio')hxStudio();if(cur==='')softRefresh()}}
setInterval(hxCheck,4000);
const ESCX=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ---- modal helper ---- */
function hxClose(){const o=$('hxov');if(o){o.remove();document.removeEventListener('keydown',hxKey,true);if(hxLast&&hxLast.focus)try{hxLast.focus()}catch(e){}}}
let hxLast=null;
const hxKey=e=>{if(e.key==='Escape'){e.stopPropagation();hxClose()}};
function hxOpen(view,title){const had=$('hxov');if(!had){hxLast=document.activeElement;const o=document.createElement('div');o.id='hxov';o.innerHTML=`<div class="hxm" role="dialog" aria-modal="true" aria-labelledby="hxt"><header><h2 id="hxt"></h2><button id="hxx" aria-label="Close">✕</button></header><div class="hxb" id="hxbody"></div></div>`;document.body.appendChild(o);
  o.addEventListener('mousedown',e=>{if(e.target===o)hxClose()});$('hxx').onclick=hxClose;document.addEventListener('keydown',hxKey,true);o.addEventListener('click',hxClick);o.addEventListener('change',e=>{if(e.target.id==='fdfile'){fdUpload(e.target.files[0]);e.target.value=''}});o.addEventListener('input',e=>{if(e.target.id==='advday')advDemoDay(+e.target.value)});o.addEventListener('change',e=>{if(e.target.id==='hxsure'&&$('hxgo'))$('hxgo').disabled=!e.target.checked;if(e.target.classList.contains('hxbname')){const B=hxBuilds()[+e.target.dataset.i];if(B){B.name=e.target.value.trim().slice(0,40)||B.name;mDirty=true;mSave()}}})}
 $('hxov').dataset.v=view;$('hxt').textContent=title;return $('hxbody')}

/* ---- Halcyon Studio ---- */
BOX.disc={n:'Discovery Crate',i:'🧭',p:150,unowned:1,odds:{common:.40,rare:.32,epic:.20,legendary:.08},d:'Only contains items you have not unlocked yet, so it never gives a duplicate.'};
const hxPackOK=it=>!it.pack||Object.keys(BOX).some(k=>BOX[k].pack===it.pack&&boxVisible(k));
const HXKEYS={bg:'bg',card:'card',chip:'chipst',toast:'toastst'},HXKIND={bg:'🖼',card:'🗂',chip:'🏷',toast:'💬'};
function hxStudio(){const b=hxOpen('studio','🎨 Halcyon Studio'),un=HXT.filter(hxOwn).length;
 b.innerHTML=`<p>Each of the six Halcyon Arcade games has its own look: a <b>theme</b>, a <b>background</b>, a <b>card style</b>, a <b>top bar</b> style and a <b>notification</b> style. Play a game for ${HXNEED} seconds in the arcade to unlock its set. <b>${un}/6 unlocked.</b> You can preview any theme for 15 seconds.</p>
 <div class="hxbt"><button data-hx="looks">⭐ My Looks</button><button data-hx="clear">↺ Remove Halcyon extras</button><button data-hx="rlook">↺ Reset all customization</button><button data-hx="playnow">👾 Open Halcyon Arcade</button></div>`+
 HXT.map(t=>{const own=hxOwn(t),secs=Math.min(HXNEED,hxSecs(t.g));
  const sw=`<div class="hxsw"><i style="background:${t.bg}"></i><i style="background:${t.card}"></i><i style="background:${t.acc}"></i></div>`;
  const info=`<div class="hxinfo"><b>${t.ico} ${ESCX(t.n)}</b><small>${ESCX(t.gn)} · ${ESCX(t.topic)}</small><small>${ESCX(t.d)}</small></div>`;
  let act;
  if(own)act=`<div class="hxact"><button data-hx="set" data-k="${t.k}" class="pri">✨ Equip full set</button><button data-hx="fav" data-id="hx:${t.k}" class="${hxFav()['hx:'+t.k]?'on':''}" aria-pressed="${!!hxFav()['hx:'+t.k]}">${hxFav()['hx:'+t.k]?'★':'☆'} Favourite</button><button data-hx="theme" data-k="${t.k}" class="${mode===t.k?'on':''}" aria-pressed="${mode===t.k}">🎨 Theme</button>`+
   ['bg','card','chip','toast'].map(c=>`<button data-hx="x" data-c="${c}" data-k="${t.k}" class="${M.set[HXKEYS[c]]===t.k?'on':''}" aria-pressed="${M.set[HXKEYS[c]]===t.k}">${HXKIND[c]} ${ESCX(t.x[c])}</button>`).join('')+`</div>`;
  else act=`<div class="hxact"><div class="hxbar" role="progressbar" aria-valuemin="0" aria-valuemax="${HXNEED}" aria-valuenow="${secs}"><i style="width:${secs/HXNEED*100}%"></i></div><small>🔒 Play ${ESCX(t.gn)}: ${secs}/${HXNEED}s</small><button data-hx="prev" data-k="${t.k}">👁 Preview theme</button><button data-hx="playnow">▶ Play</button></div>`;
  return `<div class="hxrow" style="--g:${t.gc}">${sw}${info}${act}</div>`}).join('');
}
function hxEquip(kind,k){const key=HXKEYS[kind];M.set[key]=M.set[key]===k?'':k}
function hxSetTheme(k){mode=k;try{localStorage.setItem('mp-theme',mode)}catch(e){}applyTheme()}

/* ---- Save & load ---- */
const HXEXC=new Set(['mp-hx-slots']);
function hxSlots(){try{return JSON.parse(localStorage.getItem('mp-hx-slots')||'{}')||{}}catch(e){return {}}}
function hxPutSlots(s){try{localStorage.setItem('mp-hx-slots',JSON.stringify(s));return true}catch(e){toast('⚠ Not enough browser storage for another slot. Download a file instead.');return false}}
function hxSnap(){try{mSave()}catch(e){}const d={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!HXEXC.has(k))d[k]=localStorage.getItem(k)}}catch(e){}return d}
function hxInfo(d){let sp=0,tr=0;try{sp=JSON.parse(d.mpt||'{}').sp||0}catch(e){}try{tr=Object.keys((JSON.parse(d['halcyon-arcade-v1']||'{}').un)||{}).length}catch(e){}return `Level ${lvlOf(sp)} · ${Math.floor(sp)} SP${tr?' · '+tr+' arcade trophies':''}`}
const hxWhen=t=>{try{return new Date(t).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}catch(e){return ''}};
const hxPack=d=>({app:'mp-teaching',v:1,saved:new Date().toISOString(),d});
const hxB64=u=>{let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
async function hxEncode(o){const u=new TextEncoder().encode(JSON.stringify(o));
 if(window.CompressionStream){try{const r=new Blob([u]).stream().pipeThrough(new CompressionStream('deflate-raw'));return 'MPSAVE2.'+hxB64(new Uint8Array(await new Response(r).arrayBuffer()))}catch(e){}}
 return 'MPSAVE1.'+hxB64(u)}
async function hxDecode(code){const m=String(code).trim().replace(/\s+/g,'').match(/^MPSAVE([12])\.([A-Za-z0-9+/=]+)$/);if(!m)throw hxErr('That is not a save code.');
 const bin=atob(m[2]),u=Uint8Array.from(bin,c=>c.charCodeAt(0));let t;
 if(m[1]==='2'){const r=new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'));t=await new Response(r).text()}else t=new TextDecoder().decode(u);return JSON.parse(t)}
const hxErr=m=>Object.assign(new Error(m),{hx:1});
function hxValid(o){if(!o||o.app!=='mp-teaching'||!o.d||typeof o.d!=='object')throw hxErr('This is not a MP Teaching save.');const ks=Object.keys(o.d);if(!ks.length||ks.length>600)throw hxErr('The save looks empty or damaged.');let n=0;for(const k of ks){if(typeof o.d[k]!=='string'||k.length>200)throw hxErr('The save looks damaged.');n+=o.d[k].length}if(n>8e6)throw hxErr('The save is too big.');return o}
function hxApply(o){window.__hxNoSave=true;try{views.querySelectorAll('iframe').forEach(f=>f.remove())}catch(e){}
 const u=hxSlots();u.undo={t:Date.now(),d:window.__hxBefore||{}};
 try{sessionStorage.setItem('mp-hx-pending',JSON.stringify(o.d))}catch(e){try{const keep=localStorage.getItem('mp-hx-slots');localStorage.clear();Object.keys(o.d).forEach(k=>localStorage.setItem(k,o.d[k]));if(keep)localStorage.setItem('mp-hx-slots',keep)}catch(e2){window.__hxNoSave=false;toast('⚠ This browser blocked loading the save.');return}}
 hxPutSlots(u);location.reload();setTimeout(()=>toast('Almost done: reload the page to finish loading your save.'),2500)}
function hxAsk(o,from){window.__hxFrom='save';const b=hxOpen('confirm','Load this save?');window.__hxPend=o;window.__hxBefore=hxSnap();
 b.innerHTML=`<div class="hxwarn"><b>Replace your current progress?</b><br>Save from <b>${ESCX(from||hxWhen(o.saved))}</b>: ${ESCX(hxInfo(o.d))}.<br>Your current progress here: ${ESCX(hxInfo(window.__hxBefore))}.<br>Loading replaces everything this site has saved in this browser (study points, themes, all six games). The page then reloads. A one-step undo is kept in the Save &amp; Load window.</div>
 <div class="hxbt"><button class="pri" data-hx="doload">Load it</button><button data-hx="cancel">Cancel</button></div>`}
function hxSave(){const b=hxOpen('save','💾 Save & Load progress'),S=hxSlots();
 const slot=i=>{const s=S['s'+i];return `<div class="hxslot"><b>Slot ${i}</b><span>${s?ESCX(hxWhen(s.t))+' · '+ESCX(hxInfo(s.d)):'Empty'}</span><button data-hx="ss" data-i="${i}">Save here</button><button data-hx="sl" data-i="${i}" ${s?'':'disabled'}>Load</button><button data-hx="sd" data-i="${i}" ${s?'':'disabled'}>Delete</button></div>`};
 b.innerHTML=`<p>Your progress (study points, level, themes, shop, notebook and all six Halcyon games) is kept in this browser. Save it to a file or a code to back it up or move it to another device, then load it back here.</p>
 <h3>Now</h3><p>${ESCX(hxInfo(hxSnap()))}${S.exp?' · last file backup '+ESCX(hxWhen(S.exp)):''}</p>
 <h3>Save to a file</h3><div class="hxbt"><button class="pri" data-hx="dl">⬇ Download save file</button></div>
 <h3>Load from a file</h3><div class="hxbt"><input type="file" id="hxfile" accept=".json,.txt,application/json,text/plain" aria-label="Choose a save file"></div>
 <h3>Save code</h3><p>A code you can copy and paste, handy for a phone.</p><div class="hxbt"><button data-hx="mk">Make my code</button><button data-hx="cp" id="hxcp" disabled>Copy code</button><span class="hxok" id="hxok"></span></div>
 <textarea id="hxcode" readonly placeholder="Press “Make my code”" aria-label="Your save code"></textarea>
 <p style="margin-top:12px">Paste a code to load:</p><textarea id="hxin" placeholder="MPSAVE2.…" aria-label="Paste a save code"></textarea><div class="hxbt"><button data-hx="ld">Load this code</button><span class="hxok" id="hxerr" style="color:var(--bad,#c62828)"></span></div>
 <h3>Quick slots (this browser only)</h3>${[1,2,3].map(slot).join('')}${S.undo?`<div class="hxslot"><b>Undo</b><span>Progress from before your last load (${ESCX(hxWhen(S.undo.t))}) · ${ESCX(hxInfo(S.undo.d))}</span><button data-hx="su">Restore it</button></div>`:''}
 <h3>Reset</h3><p>Put the looks back to normal, or wipe everything for a brand-new start. You will be asked to confirm.</p><div class="hxbt"><button data-hx="rlook">↺ Reset all customization</button><button data-hx="rall" style="border-color:var(--bad,#c62828);color:var(--bad,#c62828)">🗑 Start completely fresh…</button></div>`;
 $('hxfile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const t=await f.text();const o=t.trim().startsWith('MPSAVE')?await hxDecode(t):JSON.parse(t);hxAsk(hxValid(o),hxWhen(o.saved)+' ('+f.name+')')}catch(er){$('hxerr').textContent=er&&er.hx?er.message:'Could not read that file.'}}}


