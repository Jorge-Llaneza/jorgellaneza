/* ======= CO-OP FOCUS (peer to peer, no server) ======= */
(function(){
 const CP=()=>{if(!M.cp||typeof M.cp!=='object')M.cp={name:'',called:0,got:0,false:0,wins:0};return M.cp};
 const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};
 let pc=null,dc=null,role='',state='idle',myCode='',partner={name:'Partner'},ps=null,lastSlack=0,callsLeft=2,inv=null,pDone=false,myDone=false,doneSid='',cid='';
 const enc=o=>'MPCOOP.'+btoa(unescape(encodeURIComponent(JSON.stringify(o))));
 const dec=c=>{const m=String(c).trim().replace(/\s+/g,'').match(/^MPCOOP\.([A-Za-z0-9+/=]+)$/);if(!m)throw new Error('That is not a co-op code.');return JSON.parse(decodeURIComponent(escape(atob(m[1]))))};
 const send=o=>{try{if(dc&&dc.readyState==='open')dc.send(JSON.stringify(o))}catch(e){}};
 const gather=p=>new Promise(r=>{if(p.iceGatheringState==='complete')return r();const f=()=>{if(p.iceGatheringState==='complete'){p.removeEventListener('icegatheringstatechange',f);r()}};p.addEventListener('icegatheringstatechange',f);setTimeout(r,3500)});
 const myName=()=>(CP().name||'Player').slice(0,16);
 const refresh=()=>{try{if(document.getElementById('egov'))egPaint()}catch(e){}};
 function wire(ch){dc=ch;ch.onopen=()=>{state='open';send({t:'hi',n:myName()});toast('🤝 Co-op connected!');refresh()};ch.onclose=()=>{if(state==='open'){toast('🤝 Partner disconnected')}state='idle';ps=null;partner={name:'Partner'};refresh()};ch.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(er){return}onMsg(m)}}
 function reset(){try{dc&&dc.close()}catch(e){}try{pc&&pc.close()}catch(e){}pc=dc=null;state='idle';role='';myCode='';ps=null;inv=null;refresh()}
 async function host(){reset();role='host';state='hosting';pc=new RTCPeerConnection(ICE);wire(pc.createDataChannel('mp'));await pc.setLocalDescription(await pc.createOffer());await gather(pc);myCode=enc({t:'o',sdp:pc.localDescription.sdp});refresh()}
 async function join(code){reset();const o=dec(code);if(o.t!=='o')throw new Error('That is a reply code. Paste the room code from your partner.');role='guest';state='joining';pc=new RTCPeerConnection(ICE);pc.ondatachannel=e=>wire(e.channel);await pc.setRemoteDescription({type:'offer',sdp:o.sdp});await pc.setLocalDescription(await pc.createAnswer());await gather(pc);myCode=enc({t:'a',sdp:pc.localDescription.sdp});refresh()}
 async function finish(code){const o=dec(code);if(o.t!=='a')throw new Error('That is a room code. Paste your partner\'s reply code.');await pc.setRemoteDescription({type:'answer',sdp:o.sdp})}
 /* slack tracking */
 const trk=()=>{if(M.fc&&M.fc.act&&M.fc.act.coop)lastSlack=Date.now()};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)trk()});window.addEventListener('blur',trk);document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)trk()});
 const awayNow=()=>document.hidden||!document.hasFocus();
 setInterval(()=>{const a=M.fc&&M.fc.act;if(state!=='open'||!a||!a.coop)return;if(awayNow())lastSlack=Date.now();send({t:'st',aw:awayNow()?1:0,sk:a.strikes||0,left:Math.max(0,a.end-Date.now()),sl:lastSlack?Math.round((Date.now()-lastSlack)/1000):999})},2000);
 function onMsg(m){const a=M.fc&&M.fc.act;
  if(m.t==='hi'){partner.name=String(m.n||'Partner').slice(0,16);refresh()}
  else if(m.t==='st'){ps=Object.assign({at:Date.now()},m)}
  else if(m.t==='inv'){if(a){send({t:'dec',why:'busy'});return}inv=m;showInv()}
  else if(m.t==='acc'){if(!inv||inv.sid!==m.sid){}startCoop(m.min,m.label,m.sid)}
  else if(m.t==='dec'){toast('🤝 '+partner.name+' '+(m.why==='busy'?'is busy right now':'said not now'));inv=null;refresh()}
  else if(m.t==='co'){if(!a||!a.coop){send({t:'rej'});return}const slack=awayNow()||(Date.now()-lastSlack)<35000;if(!slack){send({t:'rej'});toast('🚨 '+partner.name+' called you out, but you were focused. They paid a fine.');return}
   const n=Math.min(Math.floor(M.coins),Math.max(10,Math.min(100,Math.round(M.coins*.05))));M.coins-=n;CP().got++;a.strikes=(a.strikes||0)+1;mDirty=true;try{mSave();paintChip()}catch(e){}send({t:'pay',n});
   try{jxFlash('#ff2b2b',true);jxSnd([220,175],'sawtooth',.06,.12);jxVib([80,50,80])}catch(e){}toast('🚨 '+partner.name+' caught you slacking! Strike '+a.strikes+', −'+n+' coins.');if(a.strikes>=2&&window.fcFail)window.fcFail('strikes')}
  else if(m.t==='pay'){M.coins+=+m.n||0;CP().wins++;mDirty=true;try{mSave();paintChip();toast('🚨 Caught them! +'+m.n+' coins')}catch(e){}}
  else if(m.t==='rej'){const n=Math.min(15,Math.floor(M.coins));M.coins-=n;CP().false++;mDirty=true;try{mSave();paintChip()}catch(e){}toast('🤷 False alarm: '+partner.name+' was focused. −'+n+' coins.')}
  else if(m.t==='done'){pDone=true;doneSid=m.sid;tryBonus()}
  else if(m.t==='fail'){toast('💥 '+partner.name+' broke their focus.')}}
 function showInv(){document.getElementById('cpinv')&&document.getElementById('cpinv').remove();const o=document.createElement('div');o.id='cpinv';o.setAttribute('role','alert');o.innerHTML=`<span aria-hidden="true">🤝</span><b>${esc(partner.name)}</b> wants to focus together: ${inv.min} min${inv.label?' · '+esc(inv.label):''}<button class="pri" data-cp="acc">Accept</button><button data-cp="no">Not now</button>`;document.body.appendChild(o);try{jxSnd([523,659,784],'triangle',.05,.1)}catch(e){}}
 function startCoop(min,label,sid){document.getElementById('cpinv')&&document.getElementById('cpinv').remove();if(fcActive()||!window.fcStart)return;pDone=myDone=false;doneSid=sid;cid=sid;callsLeft=2;lastSlack=0;ps=null;try{egClose()}catch(e){}fcStart(min,label);const a=M.fc&&M.fc.act;if(a){a.coop=1;a.cid=sid}}
 function tryBonus(){const a=window.__cpA;if(!(pDone&&myDone))return;pDone=myDone=false;M.coins+=60;try{addSP(5,'focus')}catch(e){}CP().tog=(CP().tog||0)+1;mDirty=true;try{mSave();paintChip();lootSting('epic');confetti(true);toast('🤝 Both of you finished! +60 coins and +5 SP co-op bonus')}catch(e){}}
 window.cpDone=a=>{if(!a.coop||state!=='open')return;myDone=true;send({t:'done',sid:a.cid});tryBonus()};
 window.cpFail=a=>{if(!a.coop||state!=='open')return;send({t:'fail'})};
 /* panel on lock screen */
 function panel(){const a=M.fc&&M.fc.act,lk=document.querySelector('#fclock .fcin');if(!a||!a.coop||!lk)return;let p=document.getElementById('cppanel');if(!p){p=document.createElement('div');p.id='cppanel';lk.appendChild(p)}
  const now=Date.now(),silent=!ps||now-ps.at>12000,away=ps&&ps.aw,slack=ps&&(ps.aw||ps.sl<30),ok=state==='open'&&slack&&callsLeft>0;
  const stx=state!=='open'?'🔌 disconnected':silent?'📡 no signal…':away?'⚠️ AWAY from the window!':ps.sl<30?'⚠️ just left the window':'✅ focused';
  const left=ps&&!silent?` · ${Math.ceil(ps.left/60000)} min left`:'';
  p.innerHTML=`<div class="cpbox"><b>🤝 ${esc(partner.name)}</b>: ${stx}${left}${ps&&ps.sk?` · ${ps.sk} strike${ps.sk>1?'s':''}`:''}<button id="cpco" ${ok?'':'disabled'} aria-label="Call out partner">🚨 Call out (${callsLeft} left)</button></div>`;
  const b=p.querySelector('#cpco');if(b)b.onclick=()=>{if(callsLeft<=0)return;callsLeft--;CP().called++;send({t:'co'});b.disabled=true}}
 setInterval(panel,1000);
 /* UI */
 function tabHTML(){const C=CP();let h=`<div class="egboss" style="--c:#ff6b6b"><div class="egbi" aria-hidden="true">🤝</div><h3>Co-op focus</h3><p class="wgs">Study with a friend, each on your own device. Start together, see if they stay focused, and <b>call them out</b> if they slack (leaving the window, leaving full screen). The call is checked on their side, so only real slacking counts: they get a strike and pay you coins. A false alarm costs you 15 coins. Max 2 call-outs per session. If you both finish, you each get a bonus.</p>`;
  if(!window.RTCPeerConnection)return h+'<p class="wgs">This browser does not support peer-to-peer connections.</p></div>';
  h+=`<label class="labc"><span>Your name</span><input id="cpname" maxlength="16" value="${esc(C.name||'')}" placeholder="Your name"></label></div>`;
  if(state==='open'){h+=`<div class="egboss" style="--c:#ff6b6b"><h3>✅ Connected to ${esc(partner.name)}</h3><div class="labrow"><label class="labc"><span>Minutes</span><select id="cpmin">${[15,25,45,60,90].map(m=>`<option value="${m}"${m===25?' selected':''}>${m}</option>`).join('')}</select></label><label class="labc"><span>Subject</span><input id="cplab" maxlength="30" placeholder="Maths"></label></div><div class="wgb"><button class="pri" data-cp="inv">🚀 Start together</button><button data-cp="bye">Disconnect</button></div><p class="wgs">Record: caught ${C.wins||0} · been caught ${C.got||0} · false alarms ${C.false||0} · finished together ${C.tog||0}</p></div>`;return h}
  if(state==='idle')return h+`<div class="egboss" style="--c:#ff6b6b"><h3>Connect</h3><p class="wgs">One of you creates a room, the other joins. You swap two short codes by message (chat, email, anything). Both of you need this page open.</p><div class="wgb"><button class="pri" data-cp="host">🏠 Create a room</button></div><label class="labc"><span>Or paste your partner's room code</span><textarea id="cpin" style="width:100%;height:70px" placeholder="MPCOOP.…"></textarea></label><div class="wgb"><button data-cp="join">🚪 Join</button></div><p class="wgs" id="cperr" role="alert"></p></div>`;
  if(state==='hosting')return h+`<div class="egboss" style="--c:#ff6b6b"><h3>1. Send this room code</h3>${myCode?`<textarea readonly id="cpout" style="width:100%;height:90px">${myCode}</textarea><div class="wgb"><button class="pri" data-cp="copy">📋 Copy</button></div><h3>2. Paste their reply code</h3><textarea id="cpin" style="width:100%;height:70px" placeholder="MPCOOP.…"></textarea><div class="wgb"><button class="pri" data-cp="fin">🔗 Connect</button><button data-cp="bye">Cancel</button></div>`:'<p class="wgs">Making a code…</p>'}<p class="wgs" id="cperr" role="alert"></p></div>`;
  return h+`<div class="egboss" style="--c:#ff6b6b"><h3>Send this reply code back to the host</h3>${myCode?`<textarea readonly id="cpout" style="width:100%;height:90px">${myCode}</textarea><div class="wgb"><button class="pri" data-cp="copy">📋 Copy</button><button data-cp="bye">Cancel</button></div><p class="wgs">Once the host pastes it, you connect automatically.</p>`:'<p class="wgs">Making a code…</p>'}<p class="wgs" id="cperr" role="alert"></p></div>`}
 EGX.coop={label:'🤝 Co-op',html:tabHTML};
 const err=m=>{const e=document.getElementById('cperr');if(e)e.textContent=m};
 document.addEventListener('input',e=>{if(e.target.id==='cpname'){CP().name=e.target.value.slice(0,16);mDirty=true;clearTimeout(window.__cpt);window.__cpt=setTimeout(()=>{try{mSave()}catch(er){}},500)}},true);
 document.addEventListener('click',e=>{const t=e.target.closest('[data-cp]');if(!t)return;const a=t.dataset.cp;
  if(a==='host')host().catch(er=>{state='idle';err(er.message)});
  else if(a==='join'){const v=(document.getElementById('cpin')||{}).value;state='joining';try{join(v).catch(er=>{state='idle';refresh();setTimeout(()=>err(er.message),50)})}catch(er){state='idle';err(er.message)}}
  else if(a==='fin'){finish((document.getElementById('cpin')||{}).value).catch(er=>err(er.message))}
  else if(a==='copy'){const o=document.getElementById('cpout');if(o){o.select();(navigator.clipboard?navigator.clipboard.writeText(o.value):Promise.reject()).catch(()=>{try{document.execCommand('copy')}catch(er){}}).then(()=>toast('Copied ✓'))}}
  else if(a==='bye')reset();
  else if(a==='inv'){if(fcActive())return;const min=+document.getElementById('cpmin').value||25,label=(document.getElementById('cplab').value||'').trim().slice(0,30),sid=Math.random().toString(36).slice(2,9);inv={min,label,sid,mine:1};send({t:'inv',min,label,sid});toast('Invite sent. Waiting for '+partner.name+'…')}
  else if(a==='acc'&&inv){send({t:'acc',min:inv.min,label:inv.label,sid:inv.sid});startCoop(inv.min,inv.label,inv.sid)}
  else if(a==='no'){send({t:'dec'});inv=null;const b=document.getElementById('cpinv');if(b)b.remove()}},true);
 const st=document.createElement('style');st.textContent=`#cpinv{position:fixed;left:50%;transform:translateX(-50%);bottom:70px;z-index:2147482100;background:var(--card);color:var(--fg);border:2px solid var(--acc);border-radius:14px;padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;box-shadow:0 8px 30px #0006;max-width:94vw}#cppanel{margin-top:14px}.cpbox{background:#ffffff12;border:1px solid #ffffff33;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px;font-size:14px}.cpbox button{padding:10px;border-radius:10px;border:0;background:#ff4d4d;color:#fff;font-weight:800;cursor:pointer}.cpbox button:disabled{opacity:.35;cursor:not-allowed}`;document.head.appendChild(st);
 window.__cp={get:()=>({state,partner,ps,callsLeft,myCode})};
})();


