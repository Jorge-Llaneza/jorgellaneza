/* ======= ADMIN TEST PANEL (secret code + password) ======= */
(function(){
 const HASH='7966a0863637a8a2e924a092d5783a65954aa5e77bef7936daa96b637706aefa';
 function sha(msg){const K=[];let p=2;while(K.length<64){let pr=1;for(let i=2;i*i<=p;i++)if(p%i===0){pr=0;break}if(pr)K.push((Math.pow(p,1/3)%1)*4294967296|0);p++}
  const rr=(x,n)=>(x>>>n)|(x<<(32-n));const b=unescape(encodeURIComponent(msg)),l=b.length;const n=(((l+8)>>6)+1)*16,w=new Array(n).fill(0);for(let i=0;i<l;i++)w[i>>2]|=b.charCodeAt(i)<<(24-(i%4)*8);w[l>>2]|=0x80<<(24-(l%4)*8);w[n-1]=l*8;
  let H=[],q=2,c=0;while(H.length<8){let pr=1;for(let i=2;i*i<=q;i++)if(q%i===0){pr=0;break}if(pr)H.push((Math.pow(q,.5)%1)*4294967296|0);q++}
  for(let j=0;j<n;j+=16){const W=w.slice(j,j+16);for(let i=16;i<64;i++){const a=W[i-15],d=W[i-2];W[i]=(W[i-16]+(rr(a,7)^rr(a,18)^(a>>>3))+W[i-7]+(rr(d,17)^rr(d,19)^(d>>>10)))|0}
   let[a,b2,c2,d,e,f,g,h]=H;for(let i=0;i<64;i++){const t1=(h+(rr(e,6)^rr(e,11)^rr(e,25))+((e&f)^(~e&g))+K[i]+W[i])|0,t2=((rr(a,2)^rr(a,13)^rr(a,22))+((a&b2)^(a&c2)^(b2&c2)))|0;h=g;g=f;f=e;e=(d+t1)|0;d=c2;c2=b2;b2=a;a=(t1+t2)|0}
   H=[H[0]+a|0,H[1]+b2|0,H[2]+c2|0,H[3]+d|0,H[4]+e|0,H[5]+f|0,H[6]+g|0,H[7]+h|0]}
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')}
 let tries=0,lockUntil=0;
 function close(){const o=document.getElementById('admov');if(o)o.remove()}
 function askPw(){if(M.admin){panel();return}close();const o=document.createElement('div');o.id='admov';o.className='fcov';o.innerHTML=`<div class="wgm" role="dialog" aria-modal="true" aria-labelledby="admt"><div class="wgbox" aria-hidden="true">🔐</div><h2 id="admt">Admin access</h2><p class="wgs">Enter the admin password.</p><input id="admpw" type="password" autocomplete="off" style="width:100%;padding:10px;border-radius:10px" aria-label="Admin password"><p class="wgs" id="admerr" role="alert" style="color:var(--bad,#e5484d)"></p><div class="wgb"><button class="pri" id="admgo">Unlock</button><button id="admno">Cancel</button></div></div>`;document.body.appendChild(o);
  const pw=o.querySelector('#admpw');pw.focus();const go=()=>{const now=Date.now();if(now<lockUntil){o.querySelector('#admerr').textContent='Too many tries. Wait '+Math.ceil((lockUntil-now)/1000)+'s.';return}
   if(sha(pw.value)===HASH){tries=0;M.admin=1;mDirty=true;try{mSave();buildOpts()}catch(e){}panel();try{toast('🔓 Admin mode on')}catch(e){}}else{tries++;pw.value='';o.querySelector('#admerr').textContent='Wrong password.';if(tries>=3){lockUntil=Date.now()+30000;tries=0}}};
  o.querySelector('#admgo').onclick=go;pw.addEventListener('keydown',e=>{if(e.key==='Enter')go();if(e.key==='Escape')close()});o.querySelector('#admno').onclick=close}
 function panel(){close();const o=document.createElement('div');o.id='admov';o.className='fcov';
  o.innerHTML=`<div class="wgm" role="dialog" aria-modal="true" aria-labelledby="admt"><div class="wgbox" aria-hidden="true">🛠️</div><h2 id="admt">Admin test panel</h2><p class="wgs">Admin mode is <b>ON</b>: every theme is selectable. Changes are saved on this device.</p><div class="admg">
  <button data-adm="items">🎁 Own every item</button><button data-adm="ach">🏆 All achievements</button><button data-adm="coins">🪙 +100,000 coins</button><button data-adm="sp">⭐ +5,000 SP</button><button data-adm="crates">📦 +20 crates & 10 golden</button><button data-adm="evt">🎉 +5,000 event tokens</button><button data-adm="streak">🔥 Set 30-day streak</button><button data-adm="chips">🎰 Max casino chips</button><button data-adm="farm">🌾 Max farm &amp; kitchen</button><button data-adm="undo">↩️ Undo item unlock</button><button data-adm="off">🔒 Turn admin off</button><button data-adm="x">Close</button></div><p class="wgs" id="admmsg" role="status"></p></div>`;document.body.appendChild(o)}
 const say=t=>{const m=document.getElementById('admmsg');if(m)m.textContent=t;try{toast(t)}catch(e){}};
 document.addEventListener('click',e=>{const t=e.target.closest('[data-adm]');if(!t||!M.admin)return;const a=t.dataset.adm;
  if(a==='items'){M.admBak=Object.assign({},M.inv.own);CATALOG.forEach(c=>{M.inv.own[c.id]=1});say('Unlocked '+CATALOG.length+' items')}
  else if(a==='undo'){if(M.admBak){M.inv.own=Object.assign({},M.admBak);delete M.admBak;say('Items restored to before the unlock')}else say('Nothing to undo')}
  else if(a==='ach'){let n=0;BADGES.forEach(b=>{if(!M.ach[b.id]){M.ach[b.id]=Date.now();n++}});say(n+' achievements marked as earned (no rewards given)')}
  else if(a==='coins'){M.coins+=100000;say('+100,000 coins')}
  else if(a==='sp'){try{addSP(5000,'admin')}catch(er){M.sp+=5000}say('+5,000 SP')}
  else if(a==='crates'){M.inv.box.crate=(M.inv.box.crate||0)+20;M.inv.box.gold=(M.inv.box.gold||0)+10;say('Crates added')}
  else if(a==='evt'){try{evS().tok+=5000;say('+5,000 event tokens')}catch(er){say('Events not ready')}}
  else if(a==='streak'){const d=dayN();M.streak={n:30,l:d,b:Math.max(30,M.streak.b||0)};say('Streak set to 30 days')}
  else if(a==='chips'){try{const c=casEnsure();c.chips=CAS_CAP;say('Chips maxed')}catch(er){say('Casino not ready')}}
  else if(a==='farm'){try{M.farm=M.farm||{};M.farm.xp=Math.max(M.farm.xp||0,400);M.farm.seeds=15;M.farm.water=25;const k=M.ck||(M.ck={});k.xp=Math.max(k.xp||0,400);k.gas=120;say('Farm and kitchen levelled up. Reopen them to see it.')}catch(er){say('Not ready')}}
  else if(a==='off'){M.admin=0;mDirty=true;try{mSave();buildOpts();applyTheme()}catch(er){}close();try{toast('🔒 Admin mode off')}catch(er){}return}
  else if(a==='x'){close();return}
  mDirty=true;try{mSave();buildOpts();paintChip();renderHome()}catch(er){}},true);
 /* secret code: type  mptadmin  anywhere (not in a text field), or click the site title 7 times */
 let buf='';document.addEventListener('keydown',e=>{const t=e.target;if(t&&(/^(input|textarea|select)$/i.test(t.tagName)||t.isContentEditable))return;if(e.key.length!==1)return;buf=(buf+e.key.toLowerCase()).slice(-8);if(buf==='mptadmin'){buf='';askPw()}});
 let clicks=0,ct=0;document.addEventListener('click',e=>{const h=e.target.closest('h1,.logo,.brand,.title');if(!h||h.closest('#admov'))return;const n=Date.now();clicks=(n-ct<1500)?clicks+1:1;ct=n;if(clicks>=7){clicks=0;askPw()}},true);
 window.admOpen=askPw;
 const st=document.createElement('style');st.textContent=`.admg{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:10px}.admg button{padding:10px;border-radius:10px;cursor:pointer;font-weight:700}`;document.head.appendChild(st);
})();


