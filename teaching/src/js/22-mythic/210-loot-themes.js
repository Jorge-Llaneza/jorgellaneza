/* ===== Theme drops in crates: every theme gets its own reveal stage; the rarer the theme, the bigger the build-up ===== */
(function(){
 const TAU=Math.PI*2,hs=(i,s)=>{const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x)};
 const MAP={};const put=(m,ids)=>ids.split(' ').forEach(i=>MAP[i]=m);
 put('stars','midnight eclipsenight orbit starwars skyisles obstrain bloodmoon quiet nightshift savepoint mourn lapis sf_lofi skyline');
 put('rain','slate wall sf_rain nightcity');
 put('embers','crypt desert pumpkin dracula lava witchy vendetta wasteland frontier cellar starveling panickitchen bonfire');
 put('bubbles','bubble deepsea ocean abyss sudsworks jelly tidepool');
 put('petals','candy cherry sakura evt_spring sf_zen memgarden');
 put('hearts','evt_valentine tamagotchi aigf');
 put('snow','arctic winter snowglobe');
 put('matrix','matrix bluej codedark hackterm vibe breach');
 put('coins','amber royal ledger heistday casino');
 put('gears','steampunk synchro steelrun rewind rustpuzzle clockwork');
 put('neon','vapor cyberpunk tokyo gameboy win95 arcadeth dopamine konami_nes bpt0 bpt1 bpt2 bpt3 synthdawn neonconduit cubedash herohex remix vicecity pixelquest');
 put('lanterns','nile lanterns');
 put('leaves','mint forest tomato blockworld critterquest evt_harvest sf_pomodoro valleyfarm');
 put('lightning','basement outbreak rockstage goatchaos l4safe');
 put('fireworks','evt_summer evt_newyear palettelab');
 put('paper','chalkboard newspaper coffee uniovi papertown inkbanner yellowhalls evt_school sf_library sf_cram');
 put('sand','hourglass');
 put('aurora','aurora prism');
 const TK={common:.5,rare:1,epic:1.7,legendary:2.6,mythic:3.6,secret:3.6},TL={common:2200,rare:3000,epic:4200,legendary:7000,mythic:0,secret:0},HY={epic:1100,legendary:2100,mythic:3400};
 const lowq=()=>{try{return localStorage.getItem('mp-myq')==='low'}catch(e){return false}};
 const pal=it=>{const s=it.sw||['#111','#fff','#ffd54a'];return{bg:s[0],fg:s[1],acc:s[2]}};
 const gear=(c,cx,cy,r,n,rot)=>{c.beginPath();for(let i=0;i<n*2;i++){const a=rot+i/(n*2)*TAU,rr=i%2?r*.82:r;c.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}c.closePath();c.stroke();c.beginPath();c.arc(cx,cy,r*.3,0,TAU);c.stroke()};
 const M={
  stars(c,W,H,t,k,P){const n=Math.floor(50*k);c.fillStyle='#fff';for(let i=0;i<n;i++){c.globalAlpha=.25+.75*Math.pow(Math.sin(t*2+i),2);const z=1+hs(i,3)*2.2;c.fillRect(hs(i,1)*W,hs(i,2)*H,z,z)}c.globalAlpha=1;c.strokeStyle=P.acc;c.lineWidth=2;for(let i=0;i<Math.ceil(k);i++){const ph=(t*.45+hs(i,4))%1,x=hs(i,5)*W*.6+ph*W*.5,y=hs(i,6)*H*.4+ph*H*.25;c.globalAlpha=1-ph;c.beginPath();c.moveTo(x,y);c.lineTo(x-70,y-32);c.stroke()}c.globalAlpha=1},
  rain(c,W,H,t,k,P){c.strokeStyle=P.fg;c.lineWidth=1;const n=Math.floor(70*k);c.globalAlpha=.35;for(let i=0;i<n;i++){const s=.6+hs(i,1),x=(hs(i,2)*W+t*90*s)%W,y=(hs(i,3)*H+t*700*s)%H;c.beginPath();c.moveTo(x,y);c.lineTo(x-5,y+22)}c.stroke();c.globalAlpha=1},
  embers(c,W,H,t,k,P){const n=Math.floor(45*k);for(let i=0;i<n;i++){const s=.4+hs(i,1),y=H-((t*45*s+hs(i,2)*H)%H),x=hs(i,3)*W+Math.sin(t*1.5+i)*22,r=1+hs(i,4)*3.4;c.globalAlpha=Math.min(1,y/H*1.6);c.fillStyle=i%3?P.acc:'#ffd08a';c.shadowColor=P.acc;c.shadowBlur=10;c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}c.shadowBlur=0;c.globalAlpha=1},
  bubbles(c,W,H,t,k,P){const n=Math.floor(26*k);c.lineWidth=1.5;for(let i=0;i<n;i++){const s=.4+hs(i,1),y=H+30-((t*50*s+hs(i,2)*H)%(H+60)),x=hs(i,3)*W+Math.sin(t+i)*18,r=4+hs(i,4)*20;c.globalAlpha=.7;c.strokeStyle=i%2?P.acc:P.fg;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.globalAlpha=.25;c.fillStyle=P.fg;c.beginPath();c.arc(x-r*.3,y-r*.3,r*.2,0,TAU);c.fill()}c.globalAlpha=1},
  petals(c,W,H,t,k,P){const n=Math.floor(34*k);for(let i=0;i<n;i++){const s=.4+hs(i,1),y=((t*50*s+hs(i,2)*H)%(H+40))-20,x=hs(i,3)*W+Math.sin(t*.9+i)*40,a=t*1.2+i;c.save();c.translate(x,y);c.rotate(a);c.globalAlpha=.8;c.fillStyle=i%2?P.acc:P.fg;c.beginPath();c.ellipse(0,0,9,4.5,0,0,TAU);c.fill();c.restore()}c.globalAlpha=1},
  hearts(c,W,H,t,k,P){const n=Math.floor(22*k);c.textAlign='center';for(let i=0;i<n;i++){const s=.4+hs(i,1),y=H+30-((t*55*s+hs(i,2)*H)%(H+60)),x=hs(i,3)*W+Math.sin(t+i)*20;c.globalAlpha=.75;c.fillStyle=i%2?P.acc:'#ff8fb8';c.font=(14+hs(i,4)*24)+'px serif';c.fillText('♥',x,y)}c.globalAlpha=1},
  snow(c,W,H,t,k,P){const n=Math.floor(70*k);c.fillStyle='#fff';for(let i=0;i<n;i++){const s=.3+hs(i,1)*.8,y=((t*40*s+hs(i,2)*H)%(H+10))-5,x=hs(i,3)*W+Math.sin(t*.8+i)*18;c.globalAlpha=.4+hs(i,4)*.5;c.beginPath();c.arc(x,y,1+hs(i,5)*2.6,0,TAU);c.fill()}c.globalAlpha=1},
  matrix(c,W,H,t,k,P){const cols=Math.floor(14*k),G='01{}<>/;=#$ABCDEF';c.font='14px ui-monospace,monospace';c.textAlign='left';for(let i=0;i<cols;i++){const x=(i+hs(i,1)*.6)*W/cols,y0=(t*(90+hs(i,2)*110)+hs(i,3)*H*2)%(H*1.5);for(let j=0;j<9;j++){c.globalAlpha=Math.max(0,1-j/9)*.8;c.fillStyle=j?P.acc:'#fff';c.fillText(G[Math.floor(t*9+i*3+j*7)%G.length],x,y0-j*16)}}c.globalAlpha=1},
  coins(c,W,H,t,k,P){const n=Math.floor(22*k);for(let i=0;i<n;i++){const s=.5+hs(i,1),y=((t*110*s+hs(i,2)*H*1.3)%(H+60))-30,x=hs(i,3)*W+Math.sin(t+i)*14,w=Math.abs(Math.cos(t*3+i))*11+1.5;c.fillStyle='#f2c14e';c.strokeStyle='#a97c10';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y,w,11,0,0,TAU);c.fill();c.stroke()}},
  gears(c,W,H,t,k,P){c.strokeStyle=P.acc;c.lineWidth=3;const n=Math.min(7,Math.ceil(k*1.8));for(let i=0;i<n;i++){c.globalAlpha=.5;const r=40+hs(i,1)*60;gear(c,hs(i,2)*W,hs(i,3)*H,r,10+Math.floor(hs(i,4)*8),t*(i%2?-.6:.6)*(1+hs(i,5)))}c.globalAlpha=1},
  neon(c,W,H,t,k,P){c.strokeStyle=P.acc;c.lineWidth=1;c.globalAlpha=.35;for(let i=-12;i<=12;i++){c.beginPath();c.moveTo(W/2+i*10,H*.62);c.lineTo(W/2+i*W*.09*Math.min(2,k/1.5+.5),H);c.stroke()}for(let i=0;i<8;i++){const y=H*.62+Math.pow(((i+t*.5)%8)/8,2.2)*H*.38;c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}c.globalAlpha=.8;const n=Math.floor(3*k);for(let i=0;i<n;i++){const y=(t*220*(.6+hs(i,1))+hs(i,2)*H)%H;c.fillStyle=i%2?P.acc:P.fg;c.fillRect(0,y,W,2)}c.globalAlpha=1},
  lanterns(c,W,H,t,k,P){const n=Math.floor(14*k);for(let i=0;i<n;i++){const s=.4+hs(i,1)*.6,y=H+40-((t*35*s+hs(i,2)*H)%(H+80)),x=hs(i,3)*W+Math.sin(t*.7+i)*20,r=14+hs(i,4)*16;const g=c.createRadialGradient(x,y,1,x,y,r*2.4);g.addColorStop(0,'#fff3c4');g.addColorStop(.3,P.acc);g.addColorStop(1,'#0000');c.globalAlpha=.9;c.fillStyle=g;c.beginPath();c.arc(x,y,r*2.4,0,TAU);c.fill()}c.globalAlpha=1},
  leaves(c,W,H,t,k,P){const n=Math.floor(30*k),C=['#5fcf80','#e0a040',P.acc,'#c0562b'];for(let i=0;i<n;i++){const s=.4+hs(i,1),y=((t*55*s+hs(i,2)*H)%(H+40))-20,x=hs(i,3)*W+Math.sin(t+i)*34;c.save();c.translate(x,y);c.rotate(Math.sin(t*1.3+i)*1.2);c.fillStyle=C[i%4];c.globalAlpha=.85;c.beginPath();c.ellipse(0,0,11,5,.6,0,TAU);c.fill();c.restore()}c.globalAlpha=1},
  lightning(c,W,H,t,k,P){const ph=t*1.3,fl=Math.floor(ph),f=ph-fl;if(f<.22){const a=1-f/.22;c.fillStyle=P.fg;c.globalAlpha=a*.25;c.fillRect(0,0,W,H);c.globalAlpha=a;c.strokeStyle='#fff';c.lineWidth=3;c.shadowColor=P.acc;c.shadowBlur=18;for(let b=0;b<Math.ceil(k/1.3);b++){let x=hs(fl*7+b,1)*W,y=0;c.beginPath();c.moveTo(x,y);while(y<H*.75){y+=30+hs(fl+b,y)*40;x+=(hs(fl*3+b,y+9)-.5)*70;c.lineTo(x,y)}c.stroke()}c.shadowBlur=0;c.globalAlpha=1}},
  fireworks(c,W,H,t,k,P){const n=Math.ceil(k*1.2);for(let b=0;b<n;b++){const ph=t*.8+b*.37,id=Math.floor(ph),f=ph-id,cx=hs(id*5+b,1)*W,cy=H*(.15+hs(id*5+b,2)*.4),h=hs(id*5+b,3)*360;c.globalAlpha=1-f;c.fillStyle='hsl('+h+',95%,62%)';for(let i=0;i<26;i++){const a=i/26*TAU,r=f*H*.22;c.beginPath();c.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r+f*f*30,2.4,0,TAU);c.fill()}}c.globalAlpha=1},
  paper(c,W,H,t,k,P){const n=Math.floor(16*k);for(let i=0;i<n;i++){const s=.3+hs(i,1)*.6,y=H+60-((t*38*s+hs(i,2)*H)%(H+120)),x=hs(i,3)*W+Math.sin(t*.8+i)*26;c.save();c.translate(x,y);c.rotate(Math.sin(t*.6+i)*.7);c.globalAlpha=.75;c.fillStyle=P.fg;c.fillRect(-14,-18,28,36);c.strokeStyle=P.acc;c.lineWidth=1.5;for(let l=0;l<4;l++){c.beginPath();c.moveTo(-9,-10+l*7);c.lineTo(9,-10+l*7);c.stroke()}c.restore()}c.globalAlpha=1},
  sand(c,W,H,t,k,P){const n=Math.floor(90*k);c.fillStyle=P.acc;for(let i=0;i<n;i++){const s=.5+hs(i,1),y=((t*160*s+hs(i,2)*H)%(H+10))-5,x=W/2+(hs(i,3)-.5)*W*(.15+.6*hs(i,4));c.globalAlpha=.55;c.fillRect(x,y,1.6,5)}c.globalAlpha=1},
  aurora(c,W,H,t,k,P){c.globalCompositeOperation='lighter';[['#3dffb0',0],['#33e0ff',.1],[P.acc,.2]].forEach((rb,r)=>{const bY=H*(.25+rb[1]),g=c.createLinearGradient(0,bY-H*.3,0,bY);g.addColorStop(0,rb[0]+'00');g.addColorStop(1,rb[0]+'cc');c.fillStyle=g;c.globalAlpha=Math.min(.85,.18*k);for(let x=0;x<W;x+=6){const y=bY+Math.sin(x*.009+t*.3+r*2)*H*.06,h=H*(.22+.08*Math.sin(x*.012+t*.4+r));c.fillRect(x,y-h,6,h)}});c.globalCompositeOperation='source-over';c.globalAlpha=1},
  sparks(c,W,H,t,k,P){const n=Math.floor(30*k);c.lineWidth=2;for(let i=0;i<n;i++){const ph=(t*.7+hs(i,1))%1,a=hs(i,2)*TAU,r=ph*Math.min(W,H)*.55,l=10+hs(i,3)*30;c.globalAlpha=1-ph;c.strokeStyle=i%2?P.acc:P.fg;c.beginPath();c.moveTo(W/2+Math.cos(a)*r,H*.42+Math.sin(a)*r);c.lineTo(W/2+Math.cos(a)*(r+l),H*.42+Math.sin(a)*(r+l));c.stroke()}c.globalAlpha=1}};
 const motifOf=id=>M[MAP[id]]||M.sparks;
 let raf=0;const stop=()=>{cancelAnimationFrame(raf);raf=0};
 const mk=(ov)=>{let cv=document.getElementById('lootth');if(cv)cv.remove();cv=document.createElement('canvas');cv.id='lootth';cv.setAttribute('aria-hidden','true');ov.insertBefore(cv,ov.firstChild);cv.width=innerWidth;cv.height=innerHeight;return cv};
 const rsz=cv=>{if(cv.width!==innerWidth||cv.height!==innerHeight){cv.width=innerWidth;cv.height=innerHeight}};
 const live=(ov,tok)=>ov.classList.contains('on')&&ov._lt===tok;
 let TOKC=0;
 /* the build-up before a theme from epic up is revealed. returns true when it took over */
 window.lootHype=function(it,ov,done){const dur=HY[it.r];if(!dur||(window.RM&&RM)||!it.sw)return false;
  const tok=++TOKC;ov._lt=tok;stop();const P=pal(it),m=motifOf(it.id),tier=it.r,lowQ=lowq(),k=TK[tier]*(lowQ?.5:1);
  ov.innerHTML=`<div class="lhy"><div class="lhorb" style="--a:${P.acc}"></div><div class="lhtx">${tier==='mythic'?'MYTHIC':tier==='legendary'?'LEGENDARY':'EPIC'}</div></div><div class="lhflash"></div>`;
  const cv=mk(ov),c=cv.getContext('2d'),hy=ov.querySelector('.lhy'),orb=ov.querySelector('.lhorb'),fl=ov.querySelector('.lhflash'),tx=ov.querySelector('.lhtx');
  try{if(tier!=='epic')chargeSnd(dur/1000)}catch(e){}
  const t0=performance.now();let ended=false,lastBeat=0;
  const end=()=>{if(ended||!live(ov,tok))return;ended=true;stop();fl.classList.add('on');setTimeout(()=>{if(live(ov,tok))done()},tier==='epic'?120:260)};
  ov._hskip=()=>end();
  const f=ts=>{if(!live(ov,tok)){stop();return}const el=ts-t0,p=Math.min(1,el/dur);rsz(cv);const W=cv.width,H=cv.height;c.clearRect(0,0,W,H);
   c.fillStyle=P.bg;c.globalAlpha=.35*p;c.fillRect(0,0,W,H);c.globalAlpha=1;
   c.save();m(c,W,H,el/1000,k*(.15+.85*p),P);c.restore();
   if(tier!=='epic'){c.strokeStyle=P.acc;c.lineWidth=2;c.shadowColor=P.acc;c.shadowBlur=12;const nc=tier==='mythic'?16:10;for(let i=0;i<nc;i++){const a=i/nc*TAU+hs(i,1)*.3;let x=W/2,y=H*.46,r=0;c.beginPath();c.moveTo(x,y);const L=p*Math.min(W,H)*(.25+hs(i,2)*.35);while(r<L){r+=14;const j=(hs(i,r)-.5)*.35;x+=Math.cos(a+j)*14;y+=Math.sin(a+j)*14;c.lineTo(x,y)}c.stroke()}c.shadowBlur=0}
   const bp=.9-.55*p;orb.style.animationDuration=Math.max(.3,bp)+'s';orb.style.transform='scale('+(.6+p*(tier==='mythic'?3:tier==='legendary'?2:1.2))+')';
   const sh=p>.6?(p-.6)/.4*(tier==='mythic'?9:tier==='legendary'?5:2):0;hy.style.transform=sh?'translate('+((Math.random()-.5)*sh)+'px,'+((Math.random()-.5)*sh)+'px)':'';
   if(el-lastBeat>bp*1000){lastBeat=el;try{tickSnd(p)}catch(e){}}
   tx.style.opacity=Math.min(1,p*3);
   if(p>=1){end();return}raf=requestAnimationFrame(f)};
  raf=requestAnimationFrame(f);return true};
 /* the stage that stays behind the revealed theme */
 window.lootThemeStage=function(it,ov){if((window.RM&&RM)||!it.sw)return;const tok=++TOKC;ov._lt=tok;stop();const P=pal(it),m=motifOf(it.id),tier=it.r,lowQ=lowq(),k=(TK[tier]||1)*(lowQ?.5:1),life=TL[tier];
  if(tier==='legendary'||tier==='mythic'||tier==='secret'){const r=document.createElement('div');r.id='lothr';r.style.setProperty('--a',P.acc);ov.insertBefore(r,ov.firstChild);const rb=document.createElement('div');rb.className='lotrib';rb.style.setProperty('--a',P.acc);rb.textContent=tier==='legendary'?'★ LEGENDARY THEME ★':'✦ MYTHIC THEME ✦';ov.appendChild(rb)}
  const cv=mk(ov),c=cv.getContext('2d'),t0=performance.now();
  const f=ts=>{if(!live(ov,tok)||!document.body.contains(cv)){stop();return}const el=ts-t0;if(life&&el>life){cv.remove();stop();return}rsz(cv);const W=cv.width,H=cv.height;c.clearRect(0,0,W,H);
   const fade=life?Math.min(1,(life-el)/800):1,rise=Math.min(1,el/500);c.globalAlpha=fade*rise;c.save();m(c,W,H,el/1000,k,P);c.restore();c.globalAlpha=1;raf=requestAnimationFrame(f)};
  raf=requestAnimationFrame(f);
  try{if(!sndOn||!audio())return;const t=AC.currentTime,n=tier==='mythic'?9:tier==='legendary'?6:tier==='epic'?3:0;for(let i=0;i<n;i++){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=523*Math.pow(2,i*(tier==='mythic'?2:3)/12);g.gain.setValueAtTime(0,t+i*.07);g.gain.linearRampToValueAtTime(.05,t+i*.07+.02);g.gain.exponentialRampToValueAtTime(.0001,t+i*.07+1.2);o.connect(master);o.start(t+i*.07);o.stop(t+i*.07+1.3)}}catch(e){}};
 const st=document.createElement('style');st.textContent='#lootov{isolation:isolate}#lootth{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1}#lothr{position:fixed;left:50%;top:44%;width:150vmax;height:150vmax;margin:-75vmax 0 0 -75vmax;z-index:-2;pointer-events:none;background:repeating-conic-gradient(from 0deg,color-mix(in srgb,var(--a) 22%,transparent) 0 6deg,transparent 6deg 18deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 55%);mask:radial-gradient(circle,#000 0,transparent 55%);animation:lothr 24s linear infinite}@keyframes lothr{to{transform:rotate(360deg)}}.lotrib{position:fixed;top:12px;left:0;right:0;text-align:center;font:800 13px ui-monospace,Consolas,monospace;letter-spacing:.3em;color:var(--a);text-shadow:0 0 12px var(--a);animation:lotrib .9s .2s both;pointer-events:none}@keyframes lotrib{from{opacity:0;letter-spacing:.9em}to{opacity:1;letter-spacing:.3em}}.lhy{position:fixed;inset:0;display:grid;place-items:center;pointer-events:none}.lhorb{width:90px;height:90px;border-radius:50%;background:radial-gradient(circle,#fff 0,var(--a) 35%,transparent 70%);animation:lhbeat .9s ease-in-out infinite}@keyframes lhbeat{50%{filter:brightness(1.7)}}.lhtx{position:absolute;bottom:26%;font:800 16px ui-monospace,Consolas,monospace;letter-spacing:.5em;color:#fff;opacity:0}.lhflash{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none}.lhflash.on{animation:lhfl .3s ease-out both}@keyframes lhfl{0%{opacity:0}30%{opacity:1}100%{opacity:0}}';document.head.appendChild(st);
 /* a click skips the build-up */
 document.addEventListener('pointerdown',e=>{const ov=document.getElementById('lootov');if(ov&&ov.className==='on'&&ov._hskip&&ov.querySelector('.lhy')){e.preventDefault();ov._hskip()}},true);
})();
