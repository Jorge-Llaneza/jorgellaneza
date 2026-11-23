/* ===== names, flair and chip ===== */
const BANNERS=BNDEF.map(b=>[b[0],b[1],b[2],b[5]||null,b[3],b[4]]);
const NFX=NFDEF.map(b=>[b[0],b[1],b[2],b[3]||null]);
const ownX=k=>k==='halloween'?!!unlocked:!!M.inv.own[k];
const bnOK=b=>b[3]?ownX(b[3]):(b[2]==='free'||!!M.inv.own['bn_'+b[0]]);
const nfOK=b=>b[3]?ownX(b[3]):(b[2]==='free'||!!M.inv.own['nf_'+b[0]]);
function nfxCls(){const x=NFX.find(n=>n[0]===M.set.nfx);return x&&x[0]&&nfOK(x)?'nfx-'+x[0]:''}
function whoHTML(){const n=(M.set.name||'').trim();if(!n&&!M.set.flair)return '';return `<span class="who ${nfxCls()}">${esc(n||'You')}</span>${M.set.flair?`<span class="flair">${esc(M.set.flair)}</span>`:''}`}
function heroName(){const w=whoHTML();return (M.set.av||'⭐')+' '+(w?w+' · ':'')}
function paintChip(){const c=$('chip');if(!c)return;const L=lvlOf(M.sp),av=M.set.av||'⭐',fl=M.set.flair?`<span class="flair">${esc(M.set.flair)}</span>`:'',k=Math.floor(M.coins),ks=k>=1000?(k/1000).toFixed(1).replace('.0','')+'k':k,nm=(M.set.name||'').trim();
 const dot=dlReady()?'<span class="dot" title="Daily reward ready">🎁</span>':'';c.title='Open your profile';c.innerHTML=NARROW.matches?`${av}${fl} Lv ${L} · 🪙${ks}${dot}`:`${av}${fl} ${nm?esc(nm)+' · ':''}Lv ${L} · ${Math.floor(M.sp)} SP · 🪙 ${Math.floor(M.coins)}${dot}`}
