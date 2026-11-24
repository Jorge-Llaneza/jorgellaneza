/* ---- resets ---- */
const HXKEEP=['name','bio','ini','reelSrc','reelUrl','reelMin','reelBig','pins'];
function hxLookCore(){Object.keys(M.set).forEach(k=>{if(HXKEEP.includes(k))return;if(k in HXSETDEF)M.set[k]=JSON.parse(JSON.stringify(HXSETDEF[k]));else delete M.set[k]})}
function hxResetLook(){hxLookCore();
 mode='auto';try{localStorage.setItem('mp-theme','auto')}catch(e){}applyExtras();applyTheme();try{paintChip()}catch(e){}mSave();if(cur===''||cur==='profile'||cur==='shop')renderPane(cur);toast('↺ Customization reset to the defaults. Your items are still yours.')}
function hxAskLook(){window.__hxFrom=$('hxov').dataset.v;const b=hxOpen('confirm','Reset all customization?');
 b.innerHTML=`<div class="hxwarn"><b>Are you sure?</b><br>This puts every look back to the default: theme, accent colour, text size, fonts, backgrounds, card, top bar and notification styles, avatar, title, flair, banner, companion and effects (including the Halcyon extras).<br><br>Nothing is deleted: your unlocked items, level, points, coins and game progress stay as they are, and so do your name and bio. You can equip your items again at any time.</div>
 <div class="hxbt"><button class="pri" data-hx="dolook">Yes, reset customization</button><button data-hx="cancel">Cancel</button></div>`}
function hxAskAll(){window.__hxFrom=$('hxov').dataset.v;const b=hxOpen('confirm','Start completely fresh?');
 b.innerHTML=`<div class="hxwarn" style="border-width:2px"><b>⚠ This erases everything on this device.</b><br>Study points, level, coins, every unlocked item, themes and customization, your notebook and the progress and trophies in all six Halcyon games will all go back to a brand-new start.<br><br>Download a backup first if there is any chance you want it back. Your quick slots stay, and the last progress is kept as the Undo in the Save &amp; Load window.</div>
 <div class="hxbt"><button data-hx="dl">⬇ Download a backup first</button></div>
 <label style="display:flex;gap:8px;align-items:center;margin:12px 0;font-size:14px"><input type="checkbox" id="hxsure"> I understand and I want to start fresh</label>
 <div class="hxbt"><button class="pri" id="hxgo" data-hx="doall" disabled style="background:var(--bad,#c62828);border-color:var(--bad,#c62828);color:#fff">Yes, erase everything</button><button data-hx="cancel">No, keep my progress</button></div>`}
function hxFresh(){window.__hxBefore=hxSnap();hxApply({d:{}})}

function hxClick(e){const t=e.target.closest('[data-hx]');if(!t||t.disabled)return;const a=t.dataset.hx,k=t.dataset.k;
 if(a==='theme'){hxSetTheme(mode===k?'auto':k);hxStudio()}
 else if(a==='x'){hxEquip(t.dataset.c,k);applyExtras();mSave();hxStudio()}
 else if(a==='set'){HXT.find(x=>x.k===k)&&(mode!==k&&hxSetTheme(k),['bg','card','chip','toast'].forEach(c=>M.set[HXKEYS[c]]=k),applyExtras(),mSave(),toast('✨ '+XT[k].n+' set equipped'));hxStudio()}
 else if(a==='clear'){['bg','card','chip','toast'].forEach(c=>{if(/^hx_/.test(M.set[HXKEYS[c]]||''))M.set[HXKEYS[c]]=''});if(/^hx_/.test(mode))hxSetTheme('auto');applyExtras();mSave();hxStudio()}
 else if(a==='prev'){hxClose();previewTheme(k)}
 else if(a==='playnow'){hxClose();go('halcyon')}
 else if(a==='dl'){hxDownload()}
 else if(a==='mk'){hxEncode(hxPack(hxSnap())).then(c=>{$('hxcode').value=c;$('hxcp').disabled=false;const S=hxSlots();S.exp=Date.now();hxPutSlots(S)})}
 else if(a==='cp'){const c=$('hxcode');c.select();(navigator.clipboard?navigator.clipboard.writeText(c.value):Promise.reject()).catch(()=>{try{document.execCommand('copy')}catch(e){}}).then(()=>{$('hxok').textContent='Copied ✓'})}
 else if(a==='ld'){$('hxerr').textContent='';hxDecode($('hxin').value).then(o=>hxAsk(hxValid(o),hxWhen(o.saved))).catch(er=>{$('hxerr').textContent=er&&er.hx?er.message:'That code could not be read. Check you copied all of it.'})}
 else if(a==='ss'){const S=hxSlots();S['s'+t.dataset.i]={t:Date.now(),d:hxSnap()};if(hxPutSlots(S))hxSave()}
 else if(a==='sl'){const s=hxSlots()['s'+t.dataset.i];if(s)hxAsk({d:s.d,saved:s.t},'Slot '+t.dataset.i+', '+hxWhen(s.t))}
 else if(a==='sd'){const S=hxSlots();delete S['s'+t.dataset.i];hxPutSlots(S);hxSave()}
 else if(a==='su'){const u=hxSlots().undo;if(u)hxAsk({d:u.d,saved:u.t},'before your last load')}
 else if(a==='doload'){const o=window.__hxPend;if(o)hxApply(o)}
 else if(a.slice(0,3)==='adv'){advClick(a,t)}
 else if(a.slice(0,3)==='shp'){shpClick(a,t)}
 else if(a.slice(0,2)==='bp'){bpClick(a,t)}
 else if(a==='jxmode'){jxCycle();hxLooks()}
 else if(a.slice(0,2)==='fd'){fdClick(a,t)}
 else if(a==='looks'){hxLooks()}
 else if(a==='tr'){M.set.trans=t.dataset.k;hxTrSet();mDirty=true;mSave();hxLooks();hxReplay()}
 else if(a==='fav'){hxFavToggle(t.dataset.id);hxStudio()}
 else if(a==='unfav'){hxFavToggle(t.dataset.id);hxLooks()}
 else if(a==='eqfav'){const id=t.dataset.id;if(id.slice(0,3)==='hx:'){const k=id.slice(3);if(mode!==k)hxSetTheme(k);['bg','card','chip','toast'].forEach(c=>M.set[HXKEYS[c]]=k);applyExtras();mSave();toast('✨ '+XT[k].n+' set equipped')}else shopEquip(id);hxLooks()}
 else if(a==='bsave'){const B=hxBuilds();if(B.length>=HXMAXB)return;const n=($('hxbn').value||'').trim().slice(0,40)||('Build '+(B.length+1));B.push(Object.assign({id:Date.now(),name:n,t:Date.now()},hxLookSnap()));mDirty=true;mSave();toast('💾 Build saved: '+n);hxLooks()}
 else if(a==='bload'){const x=hxBuilds()[+t.dataset.i];if(x){const sk=hxApplyBuild(x);toast('✅ Loaded build: '+x.name+(sk?` (${sk} item${sk>1?'s':''} not available right now)`:''));hxLooks()}}
 else if(a==='bupd'){const x=hxBuilds()[+t.dataset.i];if(x){Object.assign(x,hxLookSnap(),{t:Date.now()});mDirty=true;mSave();toast('🔄 Updated: '+x.name);hxLooks()}}
 else if(a==='bdel'){if(t.dataset.armed){hxBuilds().splice(+t.dataset.i,1);mDirty=true;mSave();hxLooks()}else{t.dataset.armed=1;t.textContent='Sure? Delete';setTimeout(()=>{if(t.isConnected){delete t.dataset.armed;t.textContent='Delete'}},3000)}}
 else if(a==='rlook'){hxAskLook()}
 else if(a==='rall'){hxAskAll()}
 else if(a==='dolook'){hxClose();hxResetLook()}
 else if(a==='doall'){hxFresh()}
 else if(a==='cancel'){(window.__hxFrom==='studio'?hxStudio:hxSave)()}}
function hxDownload(){const o=hxPack(hxSnap()),bl=new Blob([JSON.stringify(o)],{type:'application/json'}),a=document.createElement('a'),d=new Date(),p=n=>String(n).padStart(2,'0');
 a.href=URL.createObjectURL(bl);a.download=`mp-teaching-save-${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);
 const S=hxSlots();S.exp=Date.now();hxPutSlots(S);toast('💾 Save file downloaded. Keep it somewhere safe.')}

