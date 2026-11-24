/* ---- wiring: top bar button, theme menu entry, home banner, floating Studio button, tab state ---- */
{const b=$('hxSave');b&&(b.onclick=()=>hxSave());
 const fab=document.createElement('button');fab.id='hxFab';fab.textContent='🎨 Studio';fab.title='Halcyon Studio: themes and looks from the six games';fab.onclick=()=>hxStudio();document.body.appendChild(fab);
 home.addEventListener('click',e=>{const t=e.target.closest('[data-hx]');if(!t||t.closest('#hxov'))return;const x=t.dataset.hx;if(x==='studio')hxStudio();else if(x==='save')hxSave();else if(x==='looks')hxLooks();else if(x.slice(0,3)==='adv')advClick(x,t);else if(x==='shpbuy')shpBuy(t.dataset.id);else if(x==='shptokask')shpClick(x,t);else if(x.slice(0,2)==='bp'&&x!=='bpopen')bpClick(x,t);else if(x==='bpopen'){shopTab='pass';go('shop')}else if(x==='shpopen'){shopTab='daily';go('shop')}else if(x==='fav'){const on=hxFavToggle(t.dataset.id);t.classList.toggle('on',on);t.textContent=on?'★':'☆';t.setAttribute('aria-pressed',on);if(COLF.own==='fav')renderShop()}})}
function hxHero(){const un=HXT.filter(hxOwn).length;return `<div class="hxhero"><div class="hxh1"><span class="hxlg">👾</span><div><b>Halcyon Arcade</b><span>Six games that teach by play: accessibility, CPU design, electronics, algorithms, logic and code. Trophies and good sessions pay out SP and coins, and each game unlocks a theme. <b>Today: ${M.hxd&&M.hxd.d===dayN()?M.hxd.sp:0}/${HXSPCAP} SP · ${M.hxd&&M.hxd.d===dayN()?M.hxd.c:0}/${HXCCAP} 🪙</b></span></div></div>
 <div class="hxh2"><div class="hxdots" aria-label="${un} of 6 game themes unlocked">${HXT.map(t=>`<i style="background:${t.gc};color:${t.gc}" title="${ESCX(t.gn)}" class="${hxOwn(t)?'on':''}"></i>`).join('')}</div>
 <div class="hxbtn"><button class="pri" data-act="open" data-id="halcyon">▶ Play now</button><button data-hx="studio">🎨 Studio · ${un}/6</button><button data-hx="looks">⭐ My Looks</button><button data-hx="save">💾 Save / Load</button></div></div></div>`}
function hxSync(){const f=$('hxFab');f&&f.classList.toggle('on',cur==='halcyon');
 if(cur==='halcyon'){tabs.querySelectorAll('.hxnew').forEach(n=>n.remove());bnav.querySelectorAll('.hxnew').forEach(n=>n.remove())}}
const hxRestart=(el,cls)=>{el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);clearTimeout(el._hxt);el._hxt=setTimeout(()=>el.classList.remove(cls),900)};
{const _go=go,ld=document.createElement('div');ld.id='hxload';document.body.appendChild(ld);
 go=function(id,skip){const prev=cur,lab=META.some(a=>a.id===id),existed=lab&&!!views.querySelector('[data-id="'+id+'"]');const r=_go(id,skip);
  try{hxSync();hxTrSet();if(id!==prev){
   if(!lab)hxRestart(home,'hxin');
   else{const f=views.querySelector('[data-id="'+id+'"]');if(f){if(existed)hxRestart(f,'hxin');else{f.classList.add('hxwait');ld.className='';void ld.offsetWidth;ld.className='on';const fin=()=>{f.classList.remove('hxwait');ld.className='done'};f.addEventListener('load',()=>setTimeout(fin,60),{once:true});setTimeout(()=>{if(f.classList.contains('hxwait'))fin()},4000)}}}}}catch(e){}
  return r}}
if(window.__hxLoaded)setTimeout(()=>{toast(window.__hxLoaded===2?'🌱 Fresh start! Everything was reset.':'✅ Save loaded. Welcome back!');hxCheck()},700);

setTimeout(()=>{if(M.seen&&M.seen.halcyon)document.querySelectorAll('.hxnew').forEach(n=>n.remove())},0);

