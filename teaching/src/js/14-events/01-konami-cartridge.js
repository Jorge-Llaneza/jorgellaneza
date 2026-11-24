/* ======= SECRET: Konami code -> "8-Bit Cartridge" theme ======= */
const NES_K='konami_nes';
const NES_T={k:NES_K,base:'dark',bg:'#0b0b14',fg:'#fcfcfc',mut:'#bcbcbc',card:'#1a1a2e',card2:'#23233d',bd:'#fcfcfc',ok:'#00d800',bad:'#f83800',acc:'#e40058',on:'#ffffff',acc2:'#3cbcfc'};
XT[NES_K]={n:'8-Bit Cartridge',d:'Chunky pixels, hard shadows and an old console glow. You found the secret code.',r:'legendary',pack:'',base:'dark',sw:['#0b0b14','#fcfcfc','#e40058'],box:true,lv:0};
SPEC[NES_K]={ico:'🎮',pack:'holo',q:'???',t:1,p:()=>0,fmt:()=>'',perks:[]};
addC('theme',NES_K,XT[NES_K].n,'legendary',{d:XT[NES_K].d,sw:XT[NES_K].sw,pack:'',noDrop:true});
const NESCSS=hxVars(NES_T)+`
@keyframes nesblink{50%{opacity:0}}@keyframes nespop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
html[data-xt=${NES_K}]{image-rendering:pixelated}
html[data-xt=${NES_K}] body{font-family:"Courier New",ui-monospace,Menlo,monospace!important;font-weight:700;background-color:#0b0b14!important;background-image:linear-gradient(#ffffff09 4px,transparent 4px),linear-gradient(90deg,#ffffff09 4px,transparent 4px)!important;background-size:32px 32px!important;letter-spacing:.01em}
html[data-xt=${NES_K}] *{border-radius:0!important;scrollbar-color:#e40058 #0b0b14}
html[data-xt=${NES_K}] h1,html[data-xt=${NES_K}] h2,html[data-xt=${NES_K}] h3,html[data-xt=${NES_K}] .big{font-family:"Courier New",ui-monospace,monospace!important;text-transform:uppercase;letter-spacing:.08em;text-shadow:3px 3px 0 #000}
html[data-xt=${NES_K}] .card,html[data-xt=${NES_K}] .tile,html[data-xt=${NES_K}] details.card,html[data-xt=${NES_K}] .hxm,html[data-xt=${NES_K}] .advcard{border:4px solid #fcfcfc!important;box-shadow:6px 6px 0 #000,inset -4px -4px 0 #00000055,inset 4px 4px 0 #ffffff14!important}
html[data-xt=${NES_K}] button,html[data-xt=${NES_K}] select,html[data-xt=${NES_K}] input,html[data-xt=${NES_K}] textarea{border:3px solid #fcfcfc!important;box-shadow:4px 4px 0 #000!important;font-family:inherit!important;font-weight:700;text-transform:uppercase;letter-spacing:.04em;transition:none!important}
html[data-xt=${NES_K}] button:hover{background:#3cbcfc!important;color:#000!important}
html[data-xt=${NES_K}] button:active{transform:translate(4px,4px);box-shadow:0 0 0 #000!important}
html[data-xt=${NES_K}] button[class*=pri],html[data-xt=${NES_K}] button.sel,html[data-xt=${NES_K}] button.on{background:#e40058!important;color:#fff!important}
html[data-xt=${NES_K}] .top{border-bottom:6px solid #fcfcfc!important;box-shadow:0 6px 0 #000!important}
html[data-xt=${NES_K}] .brand::before{content:"► ";animation:nesblink 1s steps(1) infinite}
html[data-xt=${NES_K}] #chip{border:3px solid #fcfcfc!important;background:#000!important;color:#fcd000!important}
html[data-xt=${NES_K}] #toast{border:4px solid #fcfcfc!important;background:#000!important;color:#fcfcfc!important;box-shadow:6px 6px 0 #e40058!important;text-transform:uppercase}
html[data-xt=${NES_K}] img,html[data-xt=${NES_K}] canvas{image-rendering:pixelated}
html[data-xt=${NES_K}] a{text-decoration:underline;text-decoration-thickness:3px}
html[data-xt=${NES_K}] .bar>i,html[data-xt=${NES_K}] progress{background-image:repeating-linear-gradient(90deg,#00d800 0 12px,#008800 12px 16px)!important}
html[data-xt=${NES_K}]:not(.nofx) body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:99998;background:repeating-linear-gradient(#0000 0 3px,#00000030 3px 4px);mix-blend-mode:multiply}
html[data-rm] body::after{display:none!important}
#nessplash{position:fixed;inset:0;z-index:100000;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;color:#fcfcfc;font:700 clamp(16px,3.4vw,30px)/1.5 "Courier New",monospace;text-transform:uppercase;text-align:center;padding:20px;cursor:pointer}
#nessplash b{color:#fcd000;font-size:1.6em;text-shadow:4px 4px 0 #e40058;animation:nespop .5s steps(5) both}
#nessplash i{font-style:normal;animation:nesblink .8s steps(1) infinite;color:#3cbcfc}
`;
{const st=document.createElement('style');st.id='nescss';st.textContent=NESCSS;document.head.appendChild(st)}
const _injNes=injectX;injectX=function(doc){_injNes(doc);try{if(!doc.getElementById('mpnes')){const s=doc.createElement('style');s.id='mpnes';s.textContent=NESCSS;(doc.head||doc.documentElement).appendChild(s)}hxKonamiBind(doc)}catch(e){}};
function nesJingle(){try{if(!sndOn||!audio())return;const t=AC.currentTime;[523,659,784,1047,784,1047,1319].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.09);g.gain.linearRampToValueAtTime(.07,t+i*.09+.01);g.gain.exponentialRampToValueAtTime(.0001,t+i*.09+.09);o.connect(g);g.connect(master);o.start(t+i*.09);o.stop(t+i*.09+.1)})}catch(e){}}
function nesUnlock(){const first=!M.inv.own[NES_K];
 if(first){M.inv.own[NES_K]=1;M.konami=1;M.coins=(M.coins||0)+30;try{addSP(30,'konami')}catch(e){}mDirty=true}
 mode=NES_K;try{localStorage.setItem('mp-theme',mode)}catch(e){}applyTheme();buildOpts();try{mSave()}catch(e){}nesJingle();
 const o=document.createElement('div');o.id='nessplash';o.innerHTML=`<b>${first?'★ Cheat activated ★':'► Player 1 ready ◄'}</b><div>${first?'+30 lives (30 coins and 30 SP)<br>New theme: 8-Bit Cartridge':'8-Bit Cartridge equipped'}</div><i>Press start</i>`;document.body.appendChild(o);
 const end=()=>{o.remove()};o.onclick=end;setTimeout(end,3200);
 try{if(cur==='')softRefresh()}catch(e){}}
let _kp=0;const KON=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
function konStep(k){if(k===KON[_kp])_kp++;else _kp=(k===KON[0])?1:0;if(_kp===KON.length){_kp=0;nesUnlock()}}
const KB=new WeakSet();
function hxKonamiBind(doc){if(!doc||KB.has(doc))return;KB.add(doc);
 doc.addEventListener('keydown',e=>{const t=e.target,n=t&&t.tagName;if(n==='INPUT'||n==='TEXTAREA'||n==='SELECT'||(t&&t.isContentEditable))return;if(e.ctrlKey||e.metaKey||e.altKey)return;konStep(e.key.length===1?e.key.toLowerCase():e.key)},true);
 let sx=0,sy=0,st=0;
 doc.addEventListener('touchstart',e=>{const p=e.changedTouches[0];sx=p.clientX;sy=p.clientY;st=Date.now()},{passive:true});
 doc.addEventListener('touchend',e=>{const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;if(Date.now()-st>700){_kp=0;return}
  if(Math.abs(dx)<14&&Math.abs(dy)<14){if(_kp>=8)konStep(_kp===8?'b':'a');else _kp=0;return}
  if(Math.abs(dx)<45&&Math.abs(dy)<45)return;
  konStep(Math.abs(dy)>Math.abs(dx)?(dy<0?'ArrowUp':'ArrowDown'):(dx<0?'ArrowLeft':'ArrowRight'))},{passive:true})}
hxKonamiBind(document);

