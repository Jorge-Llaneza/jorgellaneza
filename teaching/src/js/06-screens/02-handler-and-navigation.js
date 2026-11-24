/* ---------- one delegated handler for every screen ---------- */
home.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const d=b.dataset;
 switch(d.act){case'open':go(d.id);break;case'go':go(d.id);break;case'crates':shopTab='crates';go('shop');break;case'roadmore':roadMax=50;renderShop();break;case'arcade':arcQuit(true);go('arcade');renderArcade();break;case'nb':go('notebook');renderNotebook();break;
  case'play':arcQuit(true);arcStart(d.g,d.m);break;case'quit':arcQuit();break;case'pick':arcAnswer(+d.k);break;case'pu':puUse(d.k);break;case'next':G2.i++;arcNext();break;
  case'native':NATIVE[+d.i].open();break;case'nbf':nbFilter=d.l;renderNotebook();break;case'review':revStart();break;case'revpick':revAnswer(+d.k);break;case'revnext':R.i++;revNext();break;case'revquit':R=null;renderNotebook();break;
  case'theme':if(d.id==='auto'||d.id==='light'||d.id==='dark'||(d.id==='halloween'&&hwIn())||themeOK(d.id)){mode=d.id;try{localStorage.setItem('mp-theme',mode)}catch(x){}applyTheme();if(mode==='starwars')saber();renderPane(cur)}break;
  case'accreset':M.set.acc='';applyExtras();mSave();renderPane(cur);break;case'install':deferredPrompt&&deferredPrompt.prompt();break;case'shoptab':shopTab=d.c;renderShop();break;case'colcat':colCat=d.c;renderShop();break;case'buy':shopBuy(d.id);break;case'equip':shopEquip(d.id);break;case'openbox':openBox(d.t,!!d.free);break;case'swintro':swCrawl();break}});
home.addEventListener('input',e=>{const t=e.target;if(t.id==='accIn'){M.set.acc=t.value;applyExtras();mDirty=true}else if(t.id==='svIn'){M.set.sndv=t.value/100;$('svVal').textContent=t.value+'%';mDirty=true;uiPreview()}else if(t.id==='scIn'){M.set.scale=t.value/100;$('scVal').textContent=t.value+'%';applyExtras();mDirty=true}});
home.addEventListener('change',e=>{const t=e.target;if(t.id==='hofSel'){hofBoard=t.value;$('hof').innerHTML=lbHTML(hofBoard)+'<div class="hint">Scores are saved in this browser only.</div>'}
 else if(t.id==='fnIn'){M.set.font=t.value;applyExtras();mDirty=true}else if(t.id==='cfIn'){M.set.confetti=t.checked;mDirty=true}else if(t.id==='tiIn'){M.set.title=t.value;mDirty=true}else if(t.id==='rmIn'){M.set.rm=t.checked;applyExtras();mDirty=true}});
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;if(cur==='shop'&&shopTab==='settings')renderShop()});
/* ---------- accessibility + accent applied to the shell and to every lab ---------- */
function frameExtras(d){skinNodes(d.ownerDocument);[['bg','bg'],['cur','cur'],['card','card']].forEach(([a,k])=>{if(M.set[k])d.dataset[a]=M.set[k];else delete d.dataset[a]});if(M.set.font)d.dataset.font=M.set.font;else delete d.dataset.font;const acc=M.set.acc&&perkOK('acc')?M.set.acc:'';['--acc','--ac','--blue'].forEach(v=>acc?d.style.setProperty(v,acc):d.style.removeProperty(v));acc?d.style.setProperty('--on',onFor(acc)):d.style.removeProperty('--on');d.style.zoom=M.set.scale&&M.set.scale!==1?M.set.scale:'';if(M.set.rm)d.dataset.rm='1';else delete d.dataset.rm}
function applyExtras(){RM=OSRM||!!M.set.rm;const acc=M.set.acc&&perkOK('acc')?M.set.acc:'';acc?root.style.setProperty('--acc',acc):root.style.removeProperty('--acc');acc?root.style.setProperty('--on',onFor(acc)):root.style.removeProperty('--on');home.style.zoom=M.set.scale&&M.set.scale!==1?M.set.scale:'';M.set.rm?root.dataset.rm='1':delete root.dataset.rm;M.set.font?root.dataset.font=M.set.font:delete root.dataset.font;[['bg','bg'],['cur','cur'],['card','card'],['frame','frame'],['chip','chipst'],['toast','toastst']].forEach(([a,k])=>{if(M.set[k])root.dataset[a]=M.set[k];else delete root.dataset[a]});try{petSync();trailSync()}catch(e){}skinNodes(document);views.querySelectorAll('iframe').forEach(f=>{try{frameExtras(f.contentDocument.documentElement)}catch(e){}})}
const rootExtras=applyExtras;
/* ---------- navigation: top tabs on desktop, bottom bar on phones ---------- */
const NAV=[...META,{id:'arcade',icon:'🕹',name:'Arcade'},{id:'notebook',icon:'📓',name:'Notebook'},{id:'challenges',icon:'🎯',name:'Challenges'},{id:'profile',icon:'👤',name:'Profile'},{id:'shop',icon:'🎁',name:'Shop & Rewards'}],PANES=['','arcade','notebook','challenges','profile','shop'];
const PRIMARY=[{id:'',icon:'🏠',name:'Home'},{id:'halcyon',icon:'👾',name:'Halcyon Arcade',hot:1},{id:'labs',icon:'🧪',name:'Labs'},{id:'arcade',icon:'🕹',name:'Arcade'},{id:'notebook',icon:'📓',name:'Notebook'},{id:'challenges',icon:'🎯',name:'Challenges'},{id:'profile',icon:'👤',name:'Profile'},{id:'shop',icon:'🎁',name:'Shop & Rewards'}];
PRIMARY.forEach(a=>{const b=document.createElement('button');b.dataset.id=a.id;b.textContent=a.icon+' '+a.name+(a.id==='labs'?' ▾':'');if(a.hot){b.classList.add('hot');b.insertAdjacentHTML('beforeend','<span class="hxnew">NEW</span>')}b.onclick=()=>{if(a.id==='labs'){openLabMenu(b);return}labmenu.classList.remove('on');if(a.id==='arcade')arcQuit(true);go(a.id)};tabs.appendChild(b)});
(()=>{const c=document.createElement('style');c.textContent='.subj{font-style:normal;font-weight:800;font-size:11px;letter-spacing:.06em;background:var(--acc);color:var(--on);border-radius:6px;padding:2px 6px;margin-right:6px;display:inline-block}.tile .subj{position:absolute;top:8px;right:8px;margin:0}.tile{position:relative}';document.head.appendChild(c)})();
const labmenu=document.createElement('div');labmenu.id='labmenu';labmenu.innerHTML=META.filter(a=>a.id!=='halcyon').map(a=>`<button data-id="${a.id}">${a.icon} ${subj(a.id)}${esc(a.name)}<small>${esc(a.tag)}</small></button>`).join('');document.body.appendChild(labmenu);
function openLabMenu(btn){const r=btn.getBoundingClientRect();labmenu.style.left=Math.max(8,Math.min(r.left,innerWidth-290))+'px';labmenu.style.top=(r.bottom+4)+'px';labmenu.classList.toggle('on')}
labmenu.onclick=e=>{const b=e.target.closest('button');if(b){labmenu.classList.remove('on');go(b.dataset.id)}};
document.addEventListener('click',e=>{if(!e.target.closest('#labmenu')&&!e.target.closest('.tabs button[data-id=labs]'))labmenu.classList.remove('on')});
const bnav=$('bnav'),sheet=$('labsheet');
sheet.innerHTML=META.filter(a=>a.id!=='halcyon').map(a=>`<button data-id="${a.id}">${a.icon} ${esc(a.name)}</button>`).join('');
sheet.onclick=e=>{const b=e.target.closest('button');if(b){sheet.classList.remove('on');go(b.dataset.id)}};
bnav.onclick=e=>{const b=e.target.closest('button');if(!b)return;const n=b.dataset.n;if(n==='labs'){sheet.classList.toggle('on');return}sheet.classList.remove('on');if(n==='arcade')arcQuit(true);go(n)};
function go(id,skip){
 if(id==='rewards'){shopTab='road';id='shop'}if(META.some(a=>a.id===id)){M.last=id}
 if(id!=='mips'&&id!=='arcade')dreadStop();if(id!=='arcade'&&G2)arcQuit(true);if(id!=='notebook')R=null;sheet.classList.remove('on');cur=id;
 const isLab=META.some(a=>a.id===id);tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('sel',b.dataset.id===(isLab&&id!=='halcyon'?'labs':id));if(b.dataset.id==='labs'){const l=META.find(a=>a.id===id&&id!=='halcyon');b.textContent='🧪 '+(l?(SUBJ[l.id]||l.name.split(' ')[0]):'Labs')+' ▾'}});bnav.querySelectorAll('button').forEach(b=>b.classList.toggle('sel',b.dataset.n===(isLab&&id!=='halcyon'?'labs':id)));
 if(!isLab){home.style.display='';views.style.display='none';renderPane(id);document.title=(id&&NAV.find(a=>a.id===id)?(NAV.find(a=>a.id===id).name+' · '):'')+'MP PRODUCTIONS TEACHING'}
 else{home.style.display='none';views.style.display='block';M.seen[id]=1;mDirty=true;
  let f=views.querySelector('[data-id="'+id+'"]');
  if(!f){f=document.createElement('iframe');f.dataset.id=id;f.title=id;
   f.addEventListener('load',()=>{syncFrame(f);try{const dc=f.contentDocument;attachLabHooks(id,dc);['pointerdown','keydown','touchstart','wheel'].forEach(ev=>dc.addEventListener(ev,()=>{lastAct=Date.now()},{passive:true,capture:true}));
    dc.addEventListener('click',uiClick,true);dc.addEventListener('pointermove',e=>{const r=f.getBoundingClientRect();ptr.x=e.clientX+r.left;ptr.y=e.clientY+r.top;lookAt()},{passive:true});
    ['pointerup','click','keydown','touchend'].forEach(ev=>dc.addEventListener(ev,()=>{if(hwOn)audio()},true))}catch(e){}});
   f.srcdoc=SRC[id];views.appendChild(f)}
  views.querySelectorAll('iframe').forEach(x=>x.classList.toggle('on',x===f));document.title=META.find(a=>a.id===id).name+' · MP PRODUCTIONS TEACHING'}
 if(!skip){try{history.replaceState(null,'',id?'#'+id:location.pathname+location.search)}catch(e){}}
 if(window.matchMedia&&matchMedia('(max-width:700px)').matches)setBot()}
function setBot(){root.style.setProperty('--bot',(bnav.offsetParent?bnav.getBoundingClientRect().height:0)+'px')}
if(window.ResizeObserver)new ResizeObserver(setBot).observe(bnav);addEventListener('resize',setBot);
$('brand').onclick=()=>{arcQuit(true);go('')};$('chip').onclick=()=>{go('profile')};

