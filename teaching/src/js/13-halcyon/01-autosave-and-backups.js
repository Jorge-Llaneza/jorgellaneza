/* ===== autosave, automatic backups and a close guard ===== */
(function(){
 HXEXC.add('mp-bk-sig');let hadMain=true;try{hadMain=!!localStorage.getItem(MPK)}catch(e){}
 const H=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return h};
 const sigNow=()=>{let n=0,h=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(HXEXC.has(k))continue;const v=localStorage.getItem(k)||'';n+=v.length;h=(h*31+H(k+v))|0}}catch(e){}return n+':'+h};
 const bkSig=()=>{try{return localStorage.getItem('mp-bk-sig')||''}catch(e){return ''}};
 const markBackup=()=>{try{localStorage.setItem('mp-bk-sig',sigNow())}catch(e){}paintDot()};
 const hasProgress=()=>{try{return (M.sp||0)>0||Object.keys(M.played||{}).length>0||Object.keys(M.scores||{}).length>0}catch(e){return false}};
 const needsBackup=()=>hasProgress()&&sigNow()!==bkSig();
 /* 1. save very often: a few seconds, and every time the page is hidden, blurred or closed */
 let lastStr='';
 const flush=()=>{try{if(window.__hxNoSave)return;const s=JSON.stringify(M);if(s!==lastStr){lastStr=s;localStorage.setItem(MPK,s);mDirty=false}}catch(e){}};
 setInterval(flush,4000);
 ['pagehide','beforeunload','blur','freeze'].forEach(ev=>addEventListener(ev,flush));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
 try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
 /* 2. a second copy in IndexedDB (three generations), so a wiped localStorage is recoverable */
 const idb=()=>new Promise((res,rej)=>{try{const r=indexedDB.open('mp-autosave',1);r.onupgradeneeded=()=>r.result.createObjectStore('bk');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}});
 const idbGet=k=>idb().then(db=>new Promise(res=>{const q=db.transaction('bk').objectStore('bk').get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)})).catch(()=>null);
 const idbPut=(k,v)=>idb().then(db=>new Promise(res=>{const t=db.transaction('bk','readwrite');t.objectStore('bk').put(v,k);t.oncomplete=()=>res(1);t.onerror=()=>res(0)})).catch(()=>0);
 let lastAuto='',busy=false;
 const autoBk=async()=>{if(busy||document.hidden&&false)return;if(!hasProgress())return;const sg=sigNow();if(sg===lastAuto)return;busy=true;
  try{flush();const t=Date.now(),g0=await idbGet('g0'),d=hxSnap();
   if(g0&&t-(g0.t0||g0.t)<10*60000){await idbPut('g0',{t,t0:g0.t0||g0.t,d})}
   else{const g1=await idbGet('g1');if(g0){if(g1)await idbPut('g2',g1);await idbPut('g1',g0)}await idbPut('g0',{t,t0:t,d})}
   lastAuto=sg}catch(e){}busy=false};
 setInterval(autoBk,30000);setTimeout(autoBk,5000);
 addEventListener('pagehide',()=>{try{autoBk()}catch(e){}});
 /* recover automatically if the browser lost the main save */
 setTimeout(async()=>{try{if(hadMain)return;const g=await idbGet('g0');if(g&&g.d&&g.d.mpt&&typeof hxAsk==='function')hxAsk({saved:g.t,d:g.d},'automatic backup '+hxWhen(g.t))}catch(e){}},1800);
 /* 3. know when the progress was last backed up by hand (file, code or slot) */
 const _hps=hxPutSlots;
 hxPutSlots=function(s){let prev={};try{prev=hxSlots()}catch(e){}const r=_hps(s);try{const ch=s&&(s.exp!==prev.exp||['s1','s2','s3'].some(k=>JSON.stringify((s[k]||{}).t)!==JSON.stringify((prev[k]||{}).t)));if(ch)setTimeout(markBackup,0)}catch(e){}return r};
 /* 4. close guard: if there is progress that was never backed up, stop and ask */
 addEventListener('beforeunload',e=>{flush();if(!needsBackup())return;e.preventDefault();e.returnValue='';
  setTimeout(()=>{try{if(typeof hxSave==='function')hxSave();toast('💾 Your progress is kept in this browser. Download a backup file or make a code so it survives clearing browser data.')}catch(x){}},400)});
 /* a dot on the save button while there is something not yet backed up, plus a gentle reminder */
 function paintDot(){try{const b=document.getElementById('hxSave');if(!b)return;const on=needsBackup();b.dataset.unsaved=on?'1':'';b.title=on?'Progress not backed up yet. Click to save a file or code.':'Save or load your progress'}catch(e){}}
 {const st=document.createElement('style');st.textContent='#hxSave[data-unsaved="1"]{position:relative}#hxSave[data-unsaved="1"]::after{content:"";position:absolute;top:2px;right:2px;width:9px;height:9px;border-radius:50%;background:#ff5252;box-shadow:0 0 0 2px var(--bg,#fff)}';document.head.appendChild(st)}
 setInterval(paintDot,15000);setTimeout(paintDot,2500);
 let lastNag=0;setInterval(()=>{try{if(needsBackup()&&Date.now()-lastNag>45*60000&&!document.hidden){lastNag=Date.now();toast('💾 Tip: you haven\'t backed up your progress yet. Open the 💾 button and download a save file.')}}catch(e){}},5*60000);
 /* 5. list the automatic backups in the Save & Load panel */
 const _hs=hxSave;
 hxSave=function(){_hs.apply(this,arguments);(async()=>{try{const b=document.querySelector('#hxov .hxbody,#hxov');const hs=[...document.querySelectorAll('#hxov h3')].find(h=>/^Reset$/.test(h.textContent.trim()));if(!hs)return;
   const gs=[];for(const k of ['g0','g1','g2']){const g=await idbGet(k);if(g&&g.d)gs.push([k,g])}
   const box=document.createElement('div');box.id='hxauto';box.innerHTML='<h3>Automatic backups (this device)</h3><p>Your progress is also copied here every few minutes, in case the main save is ever lost.</p>'+(gs.length?gs.map(([k,g])=>`<div class="hxslot"><b>${k==='g0'?'Latest':k==='g1'?'Earlier':'Oldest'}</b><span>${ESCX(hxWhen(g.t))} · ${ESCX(hxInfo(g.d))}</span><button data-auto="${k}">Restore</button></div>`).join(''):'<p><i>None yet. The first one appears a few seconds after you start studying.</i></p>');
   hs.parentNode.insertBefore(box,hs);box.addEventListener('click',async e=>{const t=e.target.closest('[data-auto]');if(!t)return;const g=await idbGet(t.dataset.auto);if(g&&g.d)hxAsk({saved:g.t,d:g.d},'automatic backup '+hxWhen(g.t))})}catch(e){}})()};
 window.MPAUTO={flush,autoBk,needsBackup,sigNow,markBackup,idbGet};
})();

