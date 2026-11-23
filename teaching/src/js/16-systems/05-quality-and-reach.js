/* ======= QUALITY & REACH: accessibility, backup/sync, daily recap, install app ======= */
(function(){
 const A=()=>{if(!M.a11y||typeof M.a11y!=='object')M.a11y={hc:0,tx:0,dys:0,rm:0,lh:0};return M.a11y};
 function apply(){const a=A(),h=document.documentElement;h.toggleAttribute('data-hc',!!a.hc);h.toggleAttribute('data-dys',!!a.dys);h.toggleAttribute('data-rmx',!!a.rm);h.toggleAttribute('data-lh',!!a.lh);h.setAttribute('data-tx',String(a.tx||0))}
 const css=document.createElement('style');css.textContent=`
html[data-tx="1"] body{zoom:1.12}html[data-tx="2"] body{zoom:1.25}html[data-tx="3"] body{zoom:1.4}
html[data-dys] *:not(code):not(pre):not(canvas){font-family:"OpenDyslexic","Comic Sans MS","Trebuchet MS",Verdana,sans-serif!important;letter-spacing:.04em;word-spacing:.12em}
html[data-lh] body,html[data-lh] p,html[data-lh] li,html[data-lh] span{line-height:1.75!important}
html[data-rmx] *,html[data-rmx] *::before,html[data-rmx] *::after{animation-duration:.001s!important;animation-iteration-count:1!important;transition-duration:.001s!important;scroll-behavior:auto!important}
html[data-hc]:root:root{--bg:#000;--fg:#fff;--card:#000;--card2:#111;--mut:#e6e6e6;--bd:#fff;--acc:#ffe600;--acc2:#00e5ff;--on:#000;--ok:#4dff88;--bad:#ff6b6b}
html[data-hc] body{background:#000!important;background-image:none!important;color:#fff!important}
html[data-hc] .card,html[data-hc] .tile,html[data-hc] button,html[data-hc] input,html[data-hc] select{border:2px solid #fff!important}
html[data-hc] a{color:#00e5ff!important;text-decoration:underline!important}
:focus-visible{outline:3px solid var(--acc,#ffb703)!important;outline-offset:2px!important}
.skipl{position:absolute;left:-999px;top:0;z-index:2147483600;background:#000;color:#fff;padding:10px 14px;border-radius:0 0 8px 0}.skipl:focus{left:0}
#rcov .wgl li small{display:block}
`;document.head.appendChild(css);
 apply();
 /* label unnamed buttons, add a skip link */
 function aria(){try{document.querySelectorAll('button:not([aria-label]),[role=button]:not([aria-label])').forEach(b=>{if(!(b.textContent||'').trim()&&!b.getAttribute('title')&&!b.querySelector('img[alt]')){const t=b.dataset&&(b.dataset.a||b.dataset.fm||b.dataset.hx||b.dataset.eg);b.setAttribute('aria-label',t?String(t).replace(/[-_]/g,' '):'Button')}else if(!(b.textContent||'').trim()&&b.getAttribute('title'))b.setAttribute('aria-label',b.getAttribute('title'))});
  document.querySelectorAll('input:not([aria-label]):not([type=hidden]):not([type=checkbox]):not([type=radio])').forEach(i=>{if(!i.id||!document.querySelector('label[for="'+i.id+'"]')){if(!i.closest('label'))i.setAttribute('aria-label',i.placeholder||i.name||i.type||'Input')}});
  document.querySelectorAll('[class*=toast],#toast').forEach(t=>{if(!t.getAttribute('role')){t.setAttribute('role','status');t.setAttribute('aria-live','polite')}});
  document.querySelectorAll('#egov,#fmov,.fcov .wgm,#wgov .wgm,#rcov .wgm').forEach(d=>{if(!d.getAttribute('role')&&!d.querySelector('[role=dialog]')){d.setAttribute('role','dialog');d.setAttribute('aria-modal','true')}});
  document.querySelectorAll('img:not([alt])').forEach(i=>i.setAttribute('alt',''))}catch(e){}}
 const sk=document.createElement('a');sk.className='skipl';sk.href='#';sk.textContent='Skip to main content';sk.addEventListener('click',e=>{e.preventDefault();const m=document.querySelector('main,#views,#home,.view')||document.body;m.setAttribute('tabindex','-1');m.focus()});document.body.insertBefore(sk,document.body.firstChild);
 setTimeout(aria,1500);setInterval(aria,4000);
 const T=()=>{const a=A(),sw=(k,n,d)=>`<label class="a11yr"><input type="checkbox" data-ax="${k}" ${a[k]?'checked':''}> <span><b>${n}</b><small>${d}</small></span></label>`;
  return `<div class="egboss" style="--c:#4dabf7"><div class="egbi" aria-hidden="true">♿</div><h3>Accessibility</h3><p class="wgs">Settings are saved on this device.</p>
  <div class="a11yr"><span><b>Text size</b><small>Make everything bigger</small></span><span class="seg">${['Normal','Large','Larger','Huge'].map((n,i)=>`<button data-ax="tx" data-v="${i}" class="${(a.tx||0)===i?'on':''}" aria-pressed="${(a.tx||0)===i}">${n}</button>`).join('')}</span></div>
  ${sw('hc','High contrast','Black and white with bright yellow accents, strong borders')}${sw('dys','Dyslexia-friendly font','Wider letters and spacing, rounded font')}${sw('lh','Roomier line spacing','Easier to track lines of text')}${sw('rm','Reduce motion','Switches off animations and transitions')}
  <p class="wgs">Tip: Tab and Shift+Tab move through the page, Enter and Space press buttons. Focus outlines are always visible.</p></div>`};
 EGX.a11y={label:'♿ Access',html:T};
 document.addEventListener('click',e=>{const t=e.target.closest('button[data-ax]');if(!t)return;const a=A();if(t.dataset.ax==='tx')a.tx=+t.dataset.v;apply();mDirty=true;try{mSave()}catch(er){}egPaint()},true);
 document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.ax&&t.type==='checkbox'){A()[t.dataset.ax]=t.checked?1:0;apply();mDirty=true;try{mSave()}catch(er){}}},true);
 /* ---- install + backup ---- */
 let dip=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;try{if(document.getElementById('egov'))egPaint()}catch(er){}});
 window.addEventListener('appinstalled',()=>{dip=null;toast('📲 Installed! Open it from your home screen or apps.')});
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 function syncHTML(){const ios=/iphone|ipad|ipod/i.test(navigator.userAgent),web=/^https?:/.test(location.protocol),S=M.syn||{};
  return `<div class="egboss" style="--c:#38d9a9"><div class="egbi" aria-hidden="true">☁️</div><h3>Backup &amp; sync</h3><p class="wgs">Move your progress between devices with a backup code. Copy it here, paste it on the other device in <b>Save / Load</b>.${S.t?` Last backup copied: ${new Date(S.t).toLocaleString()}.`:''}</p><div class="wgb"><button class="pri" data-q="mk">📋 Copy backup code</button><button data-q="sl">💾 Open Save / Load</button></div><p class="wgs" id="qmsg" role="status"></p></div>
  <div class="egboss" style="--c:#38d9a9"><div class="egbi" aria-hidden="true">📲</div><h3>Install as an app</h3>${standalone()?'<p class="wgs">You are using the installed app. ✅</p>':dip?'<p class="wgs">Install it for its own window, an icon, and offline use.</p><div class="wgb"><button class="pri" data-q="inst">📲 Install app</button></div>':ios?'<p class="wgs">On iPhone or iPad: tap the Share button, then <b>Add to Home Screen</b>.</p>':web?'<p class="wgs">Your browser can install this from its menu (look for <b>Install app</b> or <b>Add to Home Screen</b>).</p>':'<p class="wgs">To install, put the files (this page, <b>manifest.webmanifest</b>, <b>sw.js</b> and the icons) on a web address, such as GitHub Pages or Netlify, and open it there. Installing does not work from a file on your computer.</p>'}</div>
  <div class="egboss" style="--c:#38d9a9"><h3>Backup reminder</h3><label class="a11yr"><input type="checkbox" data-q="rem" ${S.rem===0?'':'checked'}> <span><b>Remind me weekly</b><small>A small nudge to copy a backup code</small></span></label></div>`}
 EGX.sync={label:'☁️ Backup & App',html:syncHTML};
 document.addEventListener('click',e=>{const t=e.target.closest('[data-q]');if(!t)return;const a=t.dataset.q;
  if(a==='mk'){hxEncode(hxPack(hxSnap())).then(async c=>{const S=M.syn=M.syn||{};S.t=Date.now();mDirty=true;try{mSave()}catch(er){}let ok=false;try{await navigator.clipboard.writeText(c);ok=true}catch(er){}const m=document.getElementById('qmsg');if(m)m.innerHTML=ok?'Copied ✓ Paste it somewhere safe (notes, email to yourself).':'Copy this code:<br><textarea readonly style="width:100%;height:90px">'+c+'</textarea>'}).catch(()=>toast('Could not make a code'))}
  else if(a==='sl'){try{egClose()}catch(er){}hxSave()}
  else if(a==='inst'&&dip){dip.prompt();dip.userChoice.finally(()=>{dip=null;try{egPaint()}catch(er){}})}},true);
 document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.q==='rem'){const S=M.syn=M.syn||{};S.rem=t.checked?1:0;mDirty=true;try{mSave()}catch(er){}}},true);
 /* service worker */
 try{if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
 /* ---- daily recap ---- */
 const ymd=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
 function snap(){return{day:ymd(),sp:Math.floor(M.sp||0),coins:Math.floor(M.coins||0),fm:(M.fc&&M.fc.mins)||0,fs:(M.fc&&M.fc.done)||0,own:Object.keys(M.inv.own||{}).length,t:Date.now()}}
 function recap(){try{if(!M.rc){M.rc=snap();mDirty=true;mSave();return}const r=M.rc,today=ymd();if(r.day===today)return;
  if(fcActive()||document.getElementById('wgov')||document.getElementById('rcov')){setTimeout(recap,5000);return}
  const n=snap(),dsp=n.sp-r.sp,dc=n.coins-r.coins,dfm=n.fm-r.fm,dfs=n.fs-r.fs,dow=n.own-r.own;let st=0;try{st=streakNow()}catch(e){}
  const todayCls=((M.tt&&M.tt.slots)||[]).filter(x=>x.d===((new Date().getDay()+6)%7)).sort((a,b)=>a.t<b.t?-1:1);let ev=null;try{ev=window.evActive&&evActive()}catch(e){}
  const rows=[['⭐',(dsp>=0?'+':'')+dsp+' Study Points','since your last visit'],['🪙',(dc>=0?'+':'')+dc+' coins',''],['🎯',dfs+' focus session'+(dfs===1?'':'s')+' · '+dfm+' min',''],['🎁',(dow>=0?'+':'')+dow+' new items',''],['🔥',st+' day streak',st?'Keep it going today!':'Study today to start one']];
  const o=document.createElement('div');o.id='rcov';o.className='fcov';o.innerHTML=`<div class="wgm" role="dialog" aria-modal="true" aria-labelledby="rct"><div class="wgbox" aria-hidden="true">🌅</div><h2 id="rct">Good to see you!</h2><p class="wgs">Your recap since ${new Date(r.t).toLocaleDateString([], {weekday:'long'})}:</p><ul class="wgl">${rows.map(x=>`<li><span aria-hidden="true">${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></li>`).join('')}</ul>${todayCls.length?`<p class="wgs"><b>Today's classes:</b> ${todayCls.map(x=>esc(x.t+' '+(x.l||'Class'))).join(' · ')}</p>`:''}${ev?`<p class="wgs">${ev.ico} <b>${esc(ev.n)}</b> is on: ${ev.left} days left.</p>`:''}<div class="wgb"><button class="pri" id="rcok">Let's go</button></div></div>`;
  document.body.appendChild(o);const b=o.querySelector('#rcok');b.focus();b.onclick=()=>{o.remove();M.rc=snap();mDirty=true;try{mSave()}catch(e){}};M.rc=snap();mDirty=true;try{mSave()}catch(e){}
 }catch(e){}}
 setTimeout(recap,5200);
 /* weekly backup nudge */
 setTimeout(()=>{try{const S=M.syn=M.syn||{};if(S.rem===0)return;if(Date.now()-(S.t||S.n||0)>7*864e5){if(!S.t&&!S.n){S.n=Date.now();mDirty=true;try{mSave()}catch(e){}return}S.n=Date.now();mDirty=true;try{mSave()}catch(e){}toast('☁️ Tip: copy a backup code in Challenges → Backup & App')}}catch(e){}},9000);
 const st=document.createElement('style');st.textContent=`.a11yr{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bd)}.a11yr small{display:block;opacity:.75}.a11yr input[type=checkbox]{width:22px;height:22px}`;document.head.appendChild(st);
})();


