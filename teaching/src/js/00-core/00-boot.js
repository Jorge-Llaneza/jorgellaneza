
/* restore a pending save before anything reads storage */
(function(){try{var p=sessionStorage.getItem('mp-hx-pending');if(!p)return;sessionStorage.removeItem('mp-hx-pending');var d=JSON.parse(p),keep=localStorage.getItem('mp-hx-slots');localStorage.clear();for(var k in d)localStorage.setItem(k,d[k]);if(keep!=null)localStorage.setItem('mp-hx-slots',keep);window.__hxLoaded=Object.keys(d).length?1:2}catch(e){}})();
const SUBJ={mips:'AC',dojo:'ED',logic:'COMP',tec:'TEC',hci:'CPM'},subj=id=>SUBJ[id]?`<em class="subj">${SUBJ[id]}</em>`:'';
const META=JSON.parse(document.getElementById('meta').textContent),SRC=JSON.parse(document.getElementById('srcs').textContent);
const $=id=>document.getElementById(id),views=$('views'),home=$('home'),tabs=$('tabs'),grid=$('grid');
function hwIn(){const d=new Date(),m=d.getMonth(),n=d.getDate();return (m===9&&n>=15)||(m===10&&n<=5)}
let mode='auto',cur='',unlocked=false;
try{mode=localStorage.getItem('mp-theme')||'auto'}catch(e){}unlocked=hwIn();
if(mode==='halloween'&&!unlocked)mode='auto';
const mq=window.matchMedia('(prefers-color-scheme:dark)'),root=document.documentElement;
const eff=()=>mode==='halloween'?'dark':XT[mode]?XT[mode].base:mode==='auto'?(mq.matches?'dark':'light'):mode;
function syncFrame(f){try{const d=f.contentDocument.documentElement;d.dataset.theme=eff();if(mode==='halloween')d.dataset.hw='1';else delete d.dataset.hw;if(XT[mode])d.dataset.xt=mode;else delete d.dataset.xt;injectX(d.ownerDocument);frameExtras(d)}catch(e){}}
const NARROW=window.matchMedia('(max-width:700px)');NARROW.addEventListener&&NARROW.addEventListener('change',()=>{buildOpts();$('hwp').classList.toggle('open',!NARROW.matches)});
function buildOpts(){const pre=NARROW.matches?'🎨 ':'Theme: ',o=[['auto','Default'],['light','Light'],['dark','Dark']];Object.keys(XT).forEach(k=>{if(themeOK(k))o.push([k,XT[k].n])});if(unlocked)o.push(['halloween','🎃 Halloween']);o.push(['__looks','⭐ My Looks…']);o.push(['__hx','🎨 Halcyon Studio…']);o.push(['__more','🔒 More themes…']);
 $('th').innerHTML=o.map(x=>`<option value="${x[0]}">${['halloween','__more','__hx','__looks'].includes(x[0])?'':pre}${x[1]}</option>`).join('');$('th').value=mode;paintChip()}
function applyTheme(){unlocked=hwIn();if(mode==='halloween'&&!unlocked)mode='auto';if(XT[mode]&&!themeOK(mode))mode='auto';root.dataset.theme=eff();if(mode==='halloween')root.dataset.hw='1';else delete root.dataset.hw;if(XT[mode])root.dataset.xt=mode;else delete root.dataset.xt;rootExtras();
 buildOpts();views.querySelectorAll('iframe').forEach(syncFrame);mode==='halloween'?hwStart():hwStop();typeof reelsSync==='function'&&reelsSync();typeof fxSync==='function'&&fxSync();typeof tmSync==='function'&&tmSync();typeof mxSync==='function'&&mxSync();const mt=document.querySelector('meta[name=theme-color]');if(mt)setTimeout(()=>{mt.content=getComputedStyle(root).getPropertyValue('--bg').trim()||'#f6f5f1'},0)}
$('th').onchange=()=>{const v=$('th').value;if(v==='__looks'){$('th').value=mode;hxLooks();return}if(v==='__hx'){$('th').value=mode;hxStudio();return}if(v==='__more'){$('th').value=mode;go('rewards');return}mode=v;try{localStorage.setItem('mp-theme',mode)}catch(e){}applyTheme();if(mode==='halloween')audio()};
mq.addEventListener&&mq.addEventListener('change',applyTheme);
const topEl=document.querySelector('.top'),setBar=()=>root.style.setProperty('--bar',topEl.getBoundingClientRect().bottom+'px');
if(window.ResizeObserver)new ResizeObserver(setBar).observe(topEl);addEventListener('resize',setBar);setBar();
function toast(t){const e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',3500)}
let taps=[];document.addEventListener('click',e=>{if(!(e.target.closest&&e.target.closest('#hh')))return;const n=Date.now();taps=taps.filter(t=>n-t<4000);taps.push(n);
 if(taps.length>=7){taps=[];if(!hwIn()){toast('👻 The Halloween theme only wakes up between Oct 15 and Nov 5.');return}
  try{localStorage.setItem('mp-theme','halloween')}catch(e){}mode='halloween';applyTheme();audio();toast('🎃 Halloween theme on')}});

