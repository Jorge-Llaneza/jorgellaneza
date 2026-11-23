/* ---- register themes, quests, crates, items ---- */
{const have=new Set(CATALOG.map(x=>x.c+'|'+(x.av||x.flair||x.title||'')));let css='',trcss='@media(prefers-reduced-motion:no-preference){';
 FD.forEach(f=>{
  if(f.bpT){XT[f.id]={n:f.n,d:f.d,r:'legendary',pack:'',base:f.t.base,sw:[f.t.bg,f.t.fg,f.t.acc],box:true,lv:0,special:1};SPEC[f.id]={ico:f.ico,pack:'',q:f.q[0],t:1,p:()=>0,fmt:()=>f.q[1],perks:f.perks};MOTIF[f.id]=f.motif;addC('theme',f.id,f.n,'legendary',{d:f.d,sw:XT[f.id].sw,pack:'',noDrop:true});css+=hxVars(Object.assign({k:f.id},f.t))+'\n'+fdScope(f.deco,f.id)+'\n';return}
  XT[f.id]={n:f.n,d:f.d,r:f.rar||'legendary',pack:'',base:f.t.base,sw:[f.t.bg,f.t.fg,f.t.acc],box:true,lv:0,special:1};
  SPEC[f.id]={ico:f.ico,pack:f.pack,q:f.q[0],t:f.q[1],p:f.q[2],fmt:f.q[3],perks:f.perks};
  PACKTH[f.pack]=f.id;MOTIF[f.id]=f.motif;
  BOX[f.pack]={n:f.crate[0],i:f.crate[1],p:100,pack:f.pack,needs:f.id,odds:{common:.50,rare:.30,epic:.15,legendary:.05},d:f.n+' items only. Appears once you own '+f.n+'.'};
  addC('theme',f.id,f.n,f.rar||'legendary',{d:f.d,sw:XT[f.id].sw,pack:'',noDrop:true});
  const T=Object.assign({k:f.id},f.t);css+=hxVars(T)+`\n`;
  css+=fdScope(f.deco,f.id)+'\n';
  let n=0;const P=f.pack;
  f.av.forEach(([v,r])=>{if(!have.has('avatar|'+v)){have.add('avatar|'+v);addC('avatar',P+'_av'+(n++),'Avatar '+v,r,{av:v,pack:P})}});
  f.fl.forEach(([v,r])=>{if(!have.has('flair|'+v)){have.add('flair|'+v);addC('flair',P+'_fl'+(n++),'Flair '+v,r,{flair:v,pack:P})}});
  f.ti.forEach(([v,r])=>{if(!have.has('title|'+v)){have.add('title|'+v);addC('title',P+'_ti'+(n++),v,r,{title:v,pack:P})}});
  f.bn.forEach(([k,nm,r,c,an])=>{addC('banner','bn_'+k,nm+' banner',r,{key:k,css:c,anim:an,pack:P});BANNERS.push([k,nm,r,null,c,an||0])});
  {const [k,nm,r,c]=f.nx;addC('nfx','nf_'+k,nm+' name effect',r,{key:k,pack:P});NFX.push([k,nm,r,null]);css+=`.nfx-${k}{${c}}\n`}
  {const [k,nm,r,c]=f.ch;addC('chip','chp_'+k,nm,r,{key:k,pack:P,i:'🏷️'});css+=`html:root[data-chip=${k}] #chip,.chippv[data-chip=${k}]{${c}}\n`}
  {const [k,nm,r,c]=f.ts;addC('toast','tst_'+k,nm+' notifications',r,{key:k,pack:P,i:'💬'});css+=`html:root[data-toast=${k}] #toast,.toastpv[data-toast=${k}]{${c}}\n`}
  {const [k,nm,r,em]=f.cf;CFSETS[k]=em;addC('confetti','cf_'+k,nm,r,{cf:k,i:em.join(''),pack:P})}
  {const [k,nm,r,i,d,e,kf]=f.tr;addC('trans','tr_'+k,nm+' transition',r,{key:k,i,pack:P});trcss+=`@keyframes tr-${k}{${kf}}html[data-tr=${k}] #home.hxin,html[data-tr=${k}] #views iframe.on.hxin{animation:tr-${k} ${d}s ${e} both}html[data-tr=${k}] #home.hxin .wrap>*{animation:none}.trpv[data-tr=${k}] i{animation:tr-${k} ${d+1.1}s ${e} infinite}`}
 });
 css+=trcss+'}';window.FDCSS=css;
 const st=document.createElement('style');st.id='fdcss';st.textContent=css;document.head.appendChild(st)}
const _injFD=injectX;injectX=function(doc){_injFD(doc);try{if(!doc.getElementById('mpfd')){const s=doc.createElement('style');s.id='mpfd';s.textContent=FDCSS;(doc.head||doc.documentElement).appendChild(s)}}catch(e){}};
/* ---- gimmicks: HUD + drifting emoji ---- */
function fdSync(){let h=$('fdhud'),x=$('fdfx');const f=FDK[mode];if(!f){h&&h.remove();x&&x.remove();document.body.removeAttribute('data-fd');return}
 document.body.setAttribute('data-fd',f.id);
 if(!h){h=document.createElement('div');h.id='fdhud';h.setAttribute('aria-hidden','true');document.body.appendChild(h)}h.className='fdh-'+f.id;
 if(x)x.remove();if(f.fx.length&&!jxRM()&&JX.m!=='off'){x=document.createElement('div');x.id='fdfx';x.setAttribute('aria-hidden','true');x.innerHTML=Array.from({length:14},(_,i)=>`<span style="left:${(i*41+7)%100}%;animation-delay:${-(i*2.3)%16}s;animation-duration:${14+(i*3)%9}s;font-size:${14+(i*5)%14}px">${f.fx[i%f.fx.length]}</span>`).join('');document.body.appendChild(x)}
 fdTick()}
function fdTick(){const h=$('fdhud'),f=FDK[mode];if(!h||!f)return;try{h.innerHTML=f.hud()}catch(e){}}
{let last=null;const _pcFD=paintChip;paintChip=function(){_pcFD();try{
  if(last===null)last=M.sp;const d=M.sp-last;last=M.sp;
  if(d>0&&d<500){const h=new Date().getHours();if(h>=22||h<5){FDS().n[dayN()]=1;mDirty=true}
   FDV.v=Math.min(100,FDV.v+d*2.5);FDV.t=Date.now();
   if(mode==='steelrun'&&d>=10)jxFloat('ゴゴゴ','gold')}
  fdTick()}catch(e){}}}
setInterval(()=>{const n=Date.now();FDV.v=Math.max(8,FDV.v-(n-FDV.t)/60000*3);FDV.t=n;fdTick()},20000);
const _atFD=applyTheme;applyTheme=function(){_atFD();try{if(M.inv.own.mourn&&!M.inv.own.snd_fm_g){M.inv.own.snd_fm_g=1;mDirty=true}fdAssetBanners();fdApplyAssets();fdSync()}catch(e){}};
/* ---- Mourning March: solemn piano G click sound ---- */
UISND.fm_piano=function(t,v){[[196,.9],[392,1],[784,.42],[1175,.2],[1568,.1]].forEach(([f,a],i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=i===0?'triangle':'sine';o.frequency.value=f*(1+(i%2?.0012:-.0009));g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16*v*a,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+(1.6-i*.22));o.connect(g);g.connect(master);o.start(t);o.stop(t+1.7)});
 const s=AC.createBufferSource();s.buffer=noiseBuf(.03);const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=2500;const gg=AC.createGain();gg.gain.setValueAtTime(.05*v,t);gg.gain.exponentialRampToValueAtTime(.001,t+.03);s.connect(hp);hp.connect(gg);gg.connect(master);s.start(t);s.stop(t+.04)};
addC('sound','snd_fm_g','Solemn piano G','epic',{key:'fm_piano',i:'🎹',pack:'fm',noDrop:true});
{const _gs=grantSpecial;grantSpecial=function(id){_gs(id);if(id==='mourn'){M.inv.own.snd_fm_g=1;mDirty=true;setTimeout(()=>toast('🎹 Bonus unlocked: the Solemn piano G click sound. Equip it in Collection → Sounds.'),3200)}}}
/* ---- My Assets: your own images as banners, page backgrounds and a corner sticker ---- */
const FDMAX=6;
function fdAssetBanners(){FDS().ast.forEach(a=>{const k='my_'+a.id;if(!BANNERS.some(b=>b[0]===k))BANNERS.push([k,a.name,'free',null,`url(${a.data}) center/cover`,0])})}
function fdApplyAssets(){let s=$('fdbg');if(!s){s=document.createElement('style');s.id='fdbg';document.head.appendChild(s)}
 const bg=FDS().ast.find(a=>a.id===FDS().bg),st=FDS().ast.find(a=>a.id===FDS().st);
 s.textContent=bg?`html body{background-image:linear-gradient(#0000,#0000),url(${bg.data})!important;background-size:cover!important;background-position:center!important;background-attachment:fixed!important}`:'';
 let e=$('fdst');if(st){if(!e){e=document.createElement('img');e.id='fdst';e.alt='';e.setAttribute('aria-hidden','true');document.body.appendChild(e)}e.src=st.data}else if(e)e.remove()}
fdAssetBanners();
function fdUpload(file){if(!file)return;if(FDS().ast.length>=FDMAX){toast(`You can keep up to ${FDMAX} assets. Delete one first.`);return}if(!/^image\//.test(file.type)){toast('Please choose an image file.');return}
 const r=new FileReader();r.onerror=()=>toast('Could not read that file.');r.onload=()=>{const im=new Image();im.onerror=()=>toast('That image could not be opened.');im.onload=()=>{
  let max=720,q=.85,data='';for(let i=0;i<6;i++){const sc=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*sc));c.height=Math.max(1,Math.round(im.height*sc));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
   data=c.toDataURL('image/webp',q);if(!/^data:image\/webp/.test(data))data=c.toDataURL('image/png');if(data.length<150000)break;max*=.75;q-=.1}
  if(data.length>260000){toast('That image is too large even after shrinking. Try a smaller one.');return}
  const a={id:Date.now().toString(36),name:(file.name||'My image').replace(/\.[^.]+$/,'').slice(0,24),data};FDS().ast.push(a);fdAssetBanners();mDirty=true;mSave();toast('🧰 Asset added: '+a.name);fdAssets()};im.src=r.result};r.readAsDataURL(file)}
function fdAssets(){const b=hxOpen('assets','🧰 My Assets');const A=FDS().ast;
 b.innerHTML=`<p>Upload your own artwork (${A.length}/${FDMAX}). Images are shrunk and stored on this device only. Use them as a profile banner, a page background or a corner sticker.</p><p><input type="file" id="fdfile" accept="image/*"></p>
 ${A.length?`<div class="fdgrid">${A.map(a=>`<div class="fdasset"><img src="${a.data}" alt=""><b>${esc(a.name)}</b><div><button data-hx="fduse" data-k="bn" data-id="${a.id}" class="${M.set.banner==='my_'+a.id?'pri':''}">Banner</button><button data-hx="fduse" data-k="bg" data-id="${a.id}" class="${FDS().bg===a.id?'pri':''}">Background</button><button data-hx="fduse" data-k="st" data-id="${a.id}" class="${FDS().st===a.id?'pri':''}">Sticker</button><button data-hx="fddel" data-id="${a.id}">🗑</button></div></div>`).join('')}</div>`:'<p><i>No assets yet. Choose an image above.</i></p>'}
 <p>${FDS().bg?'<button data-hx="fduse" data-k="bg" data-id="">Clear background</button> ':''}${FDS().st?'<button data-hx="fduse" data-k="st" data-id="">Clear sticker</button>':''}</p>`}
function fdClick(a,t){if(a==='fduse'){const k=t.dataset.k,id=t.dataset.id;if(k==='bn'){M.set.banner='my_'+id}else if(k==='bg'){FDS().bg=FDS().bg===id?'':id}else{FDS().st=FDS().st===id?'':id}
  mDirty=true;mSave();fdApplyAssets();try{applyExtras()}catch(e){}fdAssets()}
 else if(a==='fddel'){const id=t.dataset.id;FDS().ast=FDS().ast.filter(x=>x.id!==id);if(FDS().bg===id)FDS().bg='';if(FDS().st===id)FDS().st='';if(M.set.banner==='my_'+id)M.set.banner='';const i=BANNERS.findIndex(b=>b[0]==='my_'+id);if(i>=0)BANNERS.splice(i,1);mDirty=true;mSave();fdApplyAssets();try{applyExtras()}catch(e){}fdAssets()}
 else if(a==='fdopen')fdAssets()}
fdApplyAssets();

