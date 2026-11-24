/* ===================== Dopamine reel: an original endless runner, or your own video ===================== */
let reelRAF=0,reelFile='';
function ytId(u){const m=u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);return m?m[1]:''}
function runnerStart(cv){
 const g=cv.getContext('2d'),W=cv.width=270,H=cv.height=480,HZ=H*.34,CX=W/2;let t=0,lane=1,tl=1,coins=0,dist=0,obs=[],cns=[],flash=0,seed=1;
 const rnd=()=>Math.random(),P=(l,z)=>{const s=.12+z*.88;return{x:CX+(l-1)*W*.36*s,y:HZ+(H-HZ)*z,s}};
 function spawn(){const free=Math.floor(rnd()*3);for(let l=0;l<3;l++){if(l===free){if(rnd()<.8)for(let i=0;i<5;i++)cns.push({l,z:-i*.045})}else if(rnd()<.65)obs.push({l,z:0,k:rnd()<.6?0:1,c:rnd()<.5?'#e63946':'#3a86ff'})}}
 function ai(){const danger=[0,0,0];obs.forEach(o=>{if(o.z>.38&&o.z<.95)danger[o.l]=1});if(danger[tl]){const ok=[0,1,2].filter(l=>!danger[l]);if(ok.length)tl=ok.sort((a,b)=>Math.abs(a-lane)-Math.abs(b-lane))[0]}
  else{const c=cns.find(c=>c.z>.3&&c.z<.7&&!danger[c.l]);if(c&&Math.abs(c.l-lane)<1.6)tl=c.l}}
 function frame(){t++;const sp=.011+Math.min(.01,t/20000);dist+=sp;if(t%58===0)spawn();ai();lane+=(tl-lane)*.16;
  obs.forEach(o=>o.z+=sp);cns.forEach(c=>c.z+=sp);obs=obs.filter(o=>o.z<1.15);
  cns=cns.filter(c=>{if(c.z>.84&&c.z<.92&&Math.abs(c.l-lane)<.45){coins++;return false}return c.z<1.1});
  obs.forEach(o=>{if(o.z>.84&&o.z<.94&&Math.abs(o.l-lane)<.5&&flash<=0){flash=18;obs=obs.filter(x=>x!==o)}});
  const sky=g.createLinearGradient(0,0,0,HZ);sky.addColorStop(0,'#2a0a5e');sky.addColorStop(.6,'#ff4f9a');sky.addColorStop(1,'#ffb86b');g.fillStyle=sky;g.fillRect(0,0,W,HZ+2);
  g.fillStyle='#ffe66d';g.beginPath();g.arc(CX,HZ-6,34,Math.PI,0);g.fill();
  const gr=g.createLinearGradient(0,HZ,0,H);gr.addColorStop(0,'#2b1055');gr.addColorStop(1,'#12062b');g.fillStyle=gr;g.fillRect(0,HZ,W,H-HZ);
  for(let i=0;i<9;i++){const z=((i*.13+dist*1.4)%1.0),p=P(0,z),q=P(2,z),s=p.s;g.fillStyle='#ffffff14';g.fillRect(p.x-W*.22*s-8*s,p.y,(q.x-p.x)+W*.44*s+16*s,Math.max(1,2*s))}
  g.strokeStyle='#ffffff55';g.lineWidth=1.5;for(let l=0;l<3;l++)for(const d of[-.12,.12]){g.beginPath();const a=P(l+d,0),b=P(l+d,1);g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}
  for(let i=0;i<6;i++){const z=((i*.17+dist*.8)%1),p=P(1,z),s=p.s;[-1,1].forEach(sd=>{const x=CX+sd*W*.62*s,h=170*s,w=60*s;g.fillStyle=i%2?'#1b0a3d':'#26104f';g.fillRect(x-w/2,p.y-h,w,h);g.fillStyle=sd<0?'#00f5d4':'#ff2bd6';for(let r=0;r<4;r++)g.fillRect(x-w/3,p.y-h+(r*.22+.08)*h,w*.18,w*.12)})}
  [...obs.map(o=>({z:o.z,o})),...cns.map(c=>({z:c.z,c})),{z:.88,pl:1}].sort((a,b)=>a.z-b.z).forEach(it=>{
   if(it.o){const o=it.o,p=P(o.l,Math.max(0,o.z)),w=o.k?54*p.s:62*p.s,h=o.k?30*p.s:110*p.s;g.fillStyle=o.c;g.fillRect(p.x-w/2,p.y-h,w,h);g.fillStyle='#ffffffaa';if(!o.k)for(let r=0;r<3;r++)g.fillRect(p.x-w/2+4*p.s,p.y-h+10*p.s+r*30*p.s,w-8*p.s,12*p.s);else{g.fillStyle='#ffd23f';g.fillRect(p.x-w/2,p.y-h,w,8*p.s)}}
   else if(it.c){const c=it.c;if(c.z<0)return;const p=P(c.l,c.z);g.fillStyle='#ffd23f';g.beginPath();g.arc(p.x,p.y-12*p.s,8*p.s,0,6.3);g.fill();g.fillStyle='#fff8';g.beginPath();g.arc(p.x-2*p.s,p.y-14*p.s,2.5*p.s,0,6.3);g.fill()}
   else{const p=P(lane,.88),s=p.s,run=Math.sin(t*.45);g.fillStyle='#00f5d4';g.fillRect(p.x-9*s,p.y-52*s,18*s,26*s);g.fillStyle='#ffcf9f';g.beginPath();g.arc(p.x,p.y-62*s,9*s,0,6.3);g.fill();g.fillStyle='#ff2bd6';g.fillRect(p.x-9*s,p.y-70*s,18*s,6*s);
    g.fillStyle='#3a1a7a';g.fillRect(p.x-8*s,p.y-26*s,7*s,(24+run*7)*s);g.fillRect(p.x+1*s,p.y-26*s,7*s,(24-run*7)*s)}});
  if(flash>0){flash--;g.fillStyle=`rgba(255,255,255,${flash/40})`;g.fillRect(0,0,W,H)}
  g.fillStyle='#fff';g.font='bold 15px monospace';g.fillText('🪙 '+coins+'   '+Math.floor(dist*100)+' m',12,24);
  reelRAF=requestAnimationFrame(frame)}
 frame()}
function reelBody(){const m=M.set.reelSrc,u=M.set.reelUrl;
 if(m==='file'&&reelFile)return `<video src="${reelFile}" autoplay loop muted playsinline></video>`;
 if(m==='link'&&u){const id=ytId(u);return id?`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&modestbranding=1" allow="autoplay; encrypted-media" referrerpolicy="no-referrer"></iframe>`:`<video src="${esc(u)}" autoplay loop muted playsinline></video>`}
 return '<canvas id="rcv"></canvas>'}
function reelsSync(){const on=mode==='dopamine';let el=$('reelpanel');cancelAnimationFrame(reelRAF);if(!on){el&&el.remove();return}
 if(!el){el=document.createElement('div');el.id='reelpanel';document.body.appendChild(el)}
 el.className=(M.set.reelBig?'big ':'')+(M.set.reelMin?'min':'');
 el.innerHTML=`<div class="rbar"><span>🎞 <span class="rl">reels</span></span><span><button data-r="cfg" title="Video source">⚙</button><button data-r="size" title="Bigger or smaller">⤢</button><button data-r="min" title="${M.set.reelMin?'Show':'Hide'}">${M.set.reelMin?'▢':'–'}</button></span></div>
 <div class="rbody">${reelBody()}<div class="rui"><span>♥<br><small>12.4k</small></span><span>💬<br><small>893</small></span><span>➤</span></div><div class="rcap"><b>@mp.productions</b> studying hard 🔥 #dopamine</div></div>
 <div class="rcfg" hidden><b>Reel source</b><label><input type="radio" name="rs" value="runner" ${M.set.reelSrc==='runner'?'checked':''}> Built-in neon runner</label>
 <label><input type="radio" name="rs" value="file" ${M.set.reelSrc==='file'?'checked':''}> My video file <input type="file" id="rfile" accept="video/*"></label>
 <label><input type="radio" name="rs" value="link" ${M.set.reelSrc==='link'?'checked':''}> Video link (YouTube or .mp4) <input type="text" id="rurl" placeholder="https://…" value="${esc(M.set.reelUrl||'')}"></label>
 <small>Subway Surfers footage is copyrighted, so it is not included. The runner is original. A video file has to be picked again after you reload the page.</small></div>`;
 const cv=$('rcv');if(cv)runnerStart(cv)}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#reelpanel [data-r]');if(!b)return;const a=b.dataset.r,el=$('reelpanel');
 if(a==='size'){M.set.reelBig=M.set.reelBig?0:1;mDirty=true;reelsSync()}else if(a==='min'){M.set.reelMin=M.set.reelMin?0:1;mDirty=true;reelsSync()}
 else if(a==='cfg'){const c=el.querySelector('.rcfg');c.hidden=!c.hidden}});
document.addEventListener('change',e=>{const t=e.target;if(!t.closest||!t.closest('#reelpanel'))return;
 if(t.name==='rs'){M.set.reelSrc=t.value;mDirty=true;reelsSync();$('reelpanel').querySelector('.rcfg').hidden=false}
 else if(t.id==='rfile'&&t.files[0]){reelFile=URL.createObjectURL(t.files[0]);M.set.reelSrc='file';mDirty=true;reelsSync()}
 else if(t.id==='rurl'){M.set.reelUrl=t.value.trim();M.set.reelSrc=M.set.reelUrl?'link':'runner';mDirty=true;reelsSync()}});
function reelPop(n){if(mode!=='dopamine'||!(n>=1)||document.hidden)return;const el=$('reelpanel');if(!el||M.set.reelMin||RM)return;const r=el.getBoundingClientRect(),p=document.createElement('div');p.className='rpop';p.textContent='+'+Math.floor(n)+' 💎';p.style.left=(r.left+r.width/2-24)+'px';p.style.top=(r.top+10)+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),1200)}


