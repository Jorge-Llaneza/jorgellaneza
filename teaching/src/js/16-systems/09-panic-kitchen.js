/* ======= PANIC KITCHEN: cook, serve, don't burn, keep studying to keep the gas on ======= */
(function(){
 const DISH=[{k:'sal',n:'Salad',e:'🥗',cook:0,pay:14,l:1},{k:'soup',n:'Soup',e:'🍲',cook:8,pay:24,l:1},{k:'bur',n:'Burger',e:'🍔',cook:10,pay:28,l:2},{k:'piz',n:'Pizza',e:'🍕',cook:14,pay:38,l:3}],BURN=9,PAT=48,GMAX=120;
 const dish=k=>DISH.find(d=>d.k===k);
 const CK=()=>{if(!M.ck||typeof M.ck!=='object')M.ck={xp:0,served:0,burnt:0,lost:0,gas:60,rep:60,combo:0,best:0,o:[],st:[],sp:0,min:0};const c=M.ck;c.o=Array.isArray(c.o)?c.o:[];c.st=Array.isArray(c.st)?c.st:[];c.gas=c.gas==null?60:c.gas;c.rep=c.rep==null?60:c.rep;c.sp=c.sp||0;c.combo=c.combo||0;c.best=c.best||0;c.xp=c.xp||0;return c};
 const own=()=>!!(M.inv&&M.inv.own&&M.inv.own.panickitchen);
 const lvl=()=>1+Math.floor(Math.sqrt(CK().xp/6));
 const nSt=()=>lvl()>=5?4:lvl()>=2?3:2;
 const maxO=()=>Math.min(4,2+Math.floor(lvl()/2));
 const active=()=>{try{return own()&&mode==='panickitchen'}catch(e){return false}};
 addC('title','fok_g1','Kitchen Porter','rare',{title:'Kitchen Porter',pack:'cook',noDrop:true});
 const FB='repeating-conic-gradient(#fff1dc 0 25%,#ffb347 0 50%) 0 0/30px 30px';addC('banner','bn_fok_gold','Golden Spatula banner','epic',{key:'fok_gold',css:FB,anim:0,pack:'cook',noDrop:true});BANNERS.push(['fok_gold','Golden Spatula','epic',null,FB,0]);
 addC('avatar','fok_av','Avatar 🧑‍🍳','legendary',{av:'🧑‍🍳',pack:'cook',noDrop:true});
 const _asp=addSP;addSP=function(n,why,kind){const b0=M.sp,r=_asp(n,why,kind);try{if(own()){const d=M.sp-b0;if(d>0){const c=CK();c.gas=Math.min(GMAX,c.gas+d*6);c.sp+=d;mDirty=true}}}catch(e){}return r};
 const paused=()=>document.hidden||(()=>{try{return fcActive()||!!document.getElementById('fclock')}catch(e){return false}})();
 let spawnT=6,open=innerWidth>700,lastSig='';
 function newOrder(){const c=CK(),L=lvl(),pool=DISH.filter(d=>d.l<=L),d=pool[Math.floor(Math.random()*pool.length)];c.o.push({id:Date.now()+Math.floor(Math.random()*999),k:d.k,st:'wait',pat:PAT+Math.min(20,L*2),pm:PAT+Math.min(20,L*2),s:-1,t:0});mDirty=true;try{jxSnd([784,988],'square',.04,.08)}catch(e){}}
 function lose(o,why){const c=CK();c.o=c.o.filter(x=>x!==o);c.lost++;c.rep=Math.max(0,c.rep-8);c.combo=0;mDirty=true;try{jxFloat('Customer left 😠','bad');jxSnd([196,147],'sawtooth',.05,.15)}catch(e){}}
 function tick(){if(!active()){return}if(paused()){return}const c=CK();
  c.o.slice().forEach(o=>{o.pat--;if(o.pat<=0)lose(o)});
  c.st.forEach((sl,i)=>{if(!sl)return;const o=c.o.find(x=>x.id===sl.o);if(!o){c.st[i]=null;return}sl.t++;const d=dish(o.k);if(sl.t>=d.cook&&o.st==='cook'){o.st='ready'}if(sl.t>=d.cook+BURN&&!sl.b){sl.b=1;o.st='burnt';c.burnt++;c.combo=0;c.rep=Math.max(0,c.rep-5);o.pat=Math.max(1,o.pat-8);try{jxFloat('🔥 BURNT!','bad');jxSnd([180,140,110],'sawtooth',.07,.12);jxVib([80,40,80])}catch(e){}}});
  spawnT--;if(spawnT<=0){if(c.o.length<maxO()&&c.gas>0)newOrder();spawnT=Math.max(8,18-lvl())}
  mDirty=true;draw()}
 setInterval(tick,1000);
 const stars=r=>'★'.repeat(Math.round(r/20))+'☆'.repeat(5-Math.round(r/20));
 window.ckHud=function(){const c=CK(),burn=c.st.filter(x=>x&&x.b).length;return `🍳 KITCHEN Lv${lvl()} · <b>${c.o.length}</b> order${c.o.length===1?'':'s'}${burn?' · <b>🔥 BURNING!</b>':''} · ⛽ ${Math.round(c.gas)} · ${stars(c.rep)}`};
 window.ckCard=function(){return'';if(!own())return'';const c=CK();return `<div class="card shpcard ckcard"><div class="shpico" aria-hidden="true">🍳</div><div><b>Panic Kitchen · Level ${lvl()}</b><span>${active()?`${c.o.length} orders · ⛽ gas ${Math.round(c.gas)} · ${stars(c.rep)} · ${c.served} dishes served`:'Wear the Panic Kitchen theme to open the kitchen dock.'}</span></div><div class="hxbtn">${active()?`<button class="pri" data-ck="toggle">${open?'Hide kitchen':'Show kitchen'}</button>`:`<button class="pri" data-ck="wear">Wear theme</button>`}</div></div>`};
 function dock(){let d=document.getElementById('ckdock');if(!d){d=document.createElement('div');d.id='ckdock';d.setAttribute('role','region');d.setAttribute('aria-label','Panic Kitchen');document.body.appendChild(d)}return d}
 function draw(force){const d0=document.getElementById('ckdock');if(!active()||paused()&&!force&&!d0){if(d0&&!active())d0.remove();return}
  const c=CK(),L=lvl(),n=nSt();while(c.st.length<n)c.st.push(null);const burn=c.st.filter(x=>x&&x.b).length,ready=c.o.filter(o=>o.st==='ready').length;
  let h;
  if(!open){h=`<button class="ckmini" data-ck="toggle" aria-label="Open kitchen">🍳 ${c.o.length} orders${ready?' · ✅'+ready:''}${burn?' · 🔥':''} · ⛽${Math.round(c.gas)}</button>`}
  else{h=`<div class="ckhd"><b>🍳 Panic Kitchen · Lv ${L}</b><span>${stars(c.rep)}</span><button data-ck="toggle" aria-label="Minimise kitchen">–</button></div>
  <div class="ckgas" title="Study to refill"><i style="width:${Math.round(c.gas/GMAX*100)}%"></i><span>⛽ Gas ${Math.round(c.gas)}${c.gas<10?' · STUDY TO REFILL!':''}</span></div>
  <div class="ckst">${c.st.slice(0,n).map((sl,i)=>{const o=sl&&c.o.find(x=>x.id===sl.o),dd=o&&dish(o.k);if(!sl||!o)return `<div class="cks idle"><span>▫️</span><small>Stove ${i+1}</small></div>`;if(sl.b)return `<button class="cks burn" data-ck="out" data-i="${i}" aria-label="Put out the fire on stove ${i+1}"><span>🔥</span><small>Put out</small></button>`;const done=sl.t>=dd.cook;return `<div class="cks ${done?'rdy':'on'}"><span>${dd.e}</span><small>${done?'Ready! '+Math.max(0,dd.cook+BURN-sl.t)+'s':Math.max(0,dd.cook-sl.t)+'s'}</small></div>`}).join('')}</div>
  <div class="ckor">${c.o.length?c.o.map(o=>{const dd=dish(o.k),pc=Math.round(o.pat/o.pm*100);let b='';if(o.st==='wait')b=`<button data-ck="chop" data-id="${o.id}">🔪 Chop</button>`;else if(o.st==='chop')b=`<button data-ck="cook" data-id="${o.id}">🔥 To stove</button>`;else if(o.st==='cook')b=`<button disabled>⏳ Cooking</button>`;else if(o.st==='burnt')b=`<button data-ck="redo" data-id="${o.id}">🔪 Start over</button>`;else if(o.st==='ready')b=`<button class="pri" data-ck="serve" data-id="${o.id}">🍽️ Serve</button>`;return `<div class="cko ${pc<30?'late':''}"><span class="cke" aria-hidden="true">${dd.e}</span><div class="ckp"><small>${dd.n}</small><i style="width:${pc}%"></i></div>${b}</div>`}).join(''):'<p class="ckno">No customers right now…</p>'}</div>
  <small class="ckft">${paused()?'⏸ Paused':'Studying refills the gas. Burnt food and angry customers cost reputation.'} · Served ${c.served}${c.combo>1?' · 🔥 combo ×'+c.combo:''}</small>`}
  const sig=h;if(sig===lastSig&&d0)return;lastSig=sig;const d=dock();d.className=open?'':'min';d.innerHTML=h}
 function gas(c,n){if(c.gas<n){try{toast('⛽ Out of gas! Study to refill the tank.');jxSnd([220,180],'square',.04,.1)}catch(e){}return false}c.gas-=n;return true}
 function act(t){const a=t.dataset.ck,c=CK(),id=+t.dataset.id,o=c.o.find(x=>x.id===id);
  if(a==='toggle'){open=!open;lastSig='';draw(true);try{renderHome()}catch(e){}return}
  if(a==='wear'){try{shopEquip('panickitchen',true)}catch(e){}return}
  if(a==='chop'&&o&&o.st==='wait'){if(!gas(c,2))return;const d=dish(o.k);o.st=d.cook?'chop':'ready';try{jxSnd([660],'square',.04,.04)}catch(e){}}
  else if(a==='redo'&&o&&o.st==='burnt'){if(!gas(c,2))return;const i=c.st.findIndex(x=>x&&x.o===o.id);if(i>=0&&c.st[i].b){}o.st='chop'}
  else if(a==='cook'&&o&&o.st==='chop'){const i=c.st.findIndex((x,j)=>j<nSt()&&!x);if(i<0){toast('🔥 All stoves are busy!');return}if(!gas(c,3))return;c.st[i]={o:o.id,t:0};o.st='cook';o.s=i;try{jxSnd([440,523],'triangle',.04,.06)}catch(e){}}
  else if(a==='out'){const i=+t.dataset.i;if(c.st[i]&&c.st[i].b){if(!gas(c,1))return;c.st[i]=null;try{jxSnd([880],'sine',.04,.05)}catch(e){}}}
  else if(a==='serve'&&o&&o.st==='ready'){const d=dish(o.k),i=c.st.findIndex(x=>x&&x.o===o.id);if(i>=0)c.st[i]=null;c.o=c.o.filter(x=>x!==o);c.served++;c.combo++;c.best=Math.max(c.best,c.combo);c.rep=Math.min(100,c.rep+3);const fast=o.pat/o.pm>.5?1.5:1,mult=Math.min(2,1+(c.combo-1)*.1),pay=Math.round(d.pay*fast*mult);M.coins+=pay;const b4=lvl();c.xp+=2+(d.cook?1:0);
   try{paintChip();jxFloat(`+${pay} 🪙${fast>1?' FAST!':''}${c.combo>2?' ×'+c.combo:''}`,'gold');jxSnd([784,988,1175],'triangle',.05,.07)}catch(e){}
   const L=lvl();[[3,'fok_g1'],[5,'bn_fok_gold'],[7,'fok_av']].forEach(([l,id])=>{if(L>=l&&!M.inv.own[id]){M.inv.own[id]=1;try{buildOpts();toast('🎁 Kitchen reward unlocked: '+cat(id).n);lootSting('rare')}catch(e){}}});if(L>b4)try{toast('👨‍🍳 Kitchen level '+L+'! More dishes and stoves.')}catch(e){}
   try{checkAch()}catch(e){}}
  mDirty=true;lastSig='';draw(true)}
 let down=false;
 document.addEventListener('pointerdown',e=>{const t=e.target.closest('#ckdock [data-ck]');if(t&&!t.disabled){down=true;act(t);e.preventDefault()}},true);
 document.addEventListener('click',e=>{const t=e.target.closest('[data-ck]');if(!t||t.disabled)return;if(down&&t.closest('#ckdock')){down=false;return}if(t.closest('#ckdock')&&e.detail!==0&&!down){return}act(t)},true);
 /* react to theme changes quickly */
 setInterval(()=>{if(active())draw();else{const d=document.getElementById('ckdock');if(d)d.remove()}},1500);
 setTimeout(draw,2500);
 AX('z_ck1','🍳','Order Up','Serve your first dish in Panic Kitchen',()=>CK().served>=1,{c:40},()=>[Math.min(1,CK().served),1]);
 AX('z_ck25','🥘','Line Cook','Serve 25 dishes',()=>CK().served>=25,{c:200,b:{crate:1}},()=>[Math.min(25,CK().served),25]);
 AX('z_ck100','👨‍🍳','Head Chef','Serve 100 dishes',()=>CK().served>=100,{c:600,b:{gold:1},i:['t_Regular Customer']},()=>[Math.min(100,CK().served),100]);
 AX('z_ckc5','🔥','Kitchen Rhythm','Serve 5 dishes in a row without a burn or a lost customer',()=>CK().best>=5,{c:150},()=>[Math.min(5,CK().best),5]);
 AX('z_ckb10','🧯','Fire Marshal','Burn 10 dishes. It happens',()=>CK().burnt>=10,{c:80},()=>[Math.min(10,CK().burnt),10]);
 const st=document.createElement('style');st.textContent=`#ckdock{position:fixed;right:10px;bottom:70px;width:310px;max-width:calc(100vw - 20px);z-index:9500;background:#fffaf0;color:#3a1f0f;border:3px solid #3a1f0f;border-radius:14px;box-shadow:0 6px 0 #3a1f0f;padding:8px;font-size:13px;font-family:inherit}#ckdock.min{width:auto;padding:0;background:none;border:0;box-shadow:none}
.ckmini{background:#e8590c;color:#fff;border:3px solid #3a1f0f;border-radius:30px;padding:8px 14px;font-weight:800;cursor:pointer;box-shadow:0 4px 0 #3a1f0f}.ckhd{display:flex;align-items:center;gap:8px;justify-content:space-between}.ckhd button{border:2px solid #3a1f0f;background:#fff;border-radius:8px;width:28px;height:28px;cursor:pointer;font-weight:900}
.ckgas{position:relative;height:20px;background:#eadfcd;border:2px solid #3a1f0f;border-radius:10px;overflow:hidden;margin:6px 0}.ckgas i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#2f9e8f,#8bd17c)}.ckgas span{position:relative;font-size:11px;font-weight:800;padding-left:6px}
.ckst{display:flex;gap:6px;margin-bottom:6px}.cks{flex:1;text-align:center;border:2px solid #3a1f0f;border-radius:10px;padding:4px 2px;background:#fff;color:inherit}.cks span{display:block;font-size:22px}.cks small{font-size:10px}.cks.on{background:#ffe8c4}.cks.rdy{background:#c8f0c0;animation:ckp .8s infinite alternate}.cks.burn{background:#ff8a70;animation:ckb .3s infinite alternate;cursor:pointer}.cks.idle{opacity:.55}@keyframes ckp{to{transform:scale(1.06)}}@keyframes ckb{to{transform:translateX(2px) rotate(2deg)}}
.cko{display:flex;align-items:center;gap:6px;margin:4px 0;padding:4px;border:2px solid #3a1f0f33;border-radius:10px}.cko.late{border-color:#d6341f;background:#ffe1dc}.cke{font-size:24px}.ckp{flex:1;min-width:0}.ckp small{display:block;font-weight:700}.ckp i{display:block;height:6px;border-radius:3px;background:#3f9a4a;transition:width 1s linear}.cko.late .ckp i{background:#d6341f}.cko button{border:2px solid #3a1f0f;background:#fff;color:#3a1f0f;border-radius:8px;padding:6px 8px;font-weight:800;cursor:pointer;font-size:12px}.cko button.pri{background:#e8590c;color:#fff}.cko button:disabled{opacity:.5}.ckno,.ckft{opacity:.7;font-size:11px;margin:4px 0}
@media(max-width:600px){#ckdock{bottom:64px;right:6px}}`;document.head.appendChild(st);
})();


