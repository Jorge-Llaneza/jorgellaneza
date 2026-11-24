/* ===== part 3e: companions, trails, click effects, level-up shows ===== */
function petSync(){const k=M.set.pet,d=PETS[k];let el=$('pet');if(!k||!d||!M.inv.own['pet_'+k]){if(el)el.remove();return}
 if(!el){el=document.createElement('div');el.id='pet';el.setAttribute('role','img');el.addEventListener('click',petSay);document.body.appendChild(el)}
 el.textContent=d[0];el.className='pet-'+d[3];el.setAttribute('aria-label',d[1]);el.style.display=PANES.includes(cur)?'':'none'}
setInterval(()=>{const el=$('pet');if(el&&M.set.pet)el.style.display=PANES.includes(cur)?'':'none'},700);
const PET_SAY=['Keep going!','You’ve got this!','Small steps count.','Water break?','Nice focus!','One more exercise?','Proud of you!','Mistakes are how we learn.'];
function petBubble(t){const el=$('pet');if(!el)return;const r=el.getBoundingClientRect(),b=document.createElement('div');b.className='petb';b.textContent=t;b.style.left=Math.max(6,Math.min(innerWidth-170,r.left))+'px';b.style.top=(r.top-34)+'px';document.body.appendChild(b);setTimeout(()=>b.remove(),1900)}
function petSay(){petBubble(PET_SAY[Math.floor(Math.random()*PET_SAY.length)])}
function petReact(n){const el=$('pet');if(!el||RM||n<.5)return;el.classList.remove('jump');void el.offsetWidth;el.classList.add('jump');if(n>=4)petBubble('+'+f1(n)+' SP')}
/* cursor trail */
let trC=null,trX=null,trP=[],trRAF=0,trOn=false,trLast=0,trPos=[];
function trMove(e){if(!M.set.trail||RM||e.pointerType==='touch')return;const now=performance.now();trPos.push({x:e.clientX,y:e.clientY,t:now});if(trPos.length>26)trPos.shift();if(now-trLast<22)return;trLast=now;const k=M.set.trail;
 if(k!=='ribbon')trP.push({x:e.clientX+(Math.random()-.5)*8,y:e.clientY+(Math.random()-.5)*8,vx:(Math.random()-.5)*30,vy:(k==='flame'?-40:k==='bubbles'?-30:(Math.random()-.2)*30),l:1,s:10+Math.random()*8,h:Math.random()*360,c:Math.floor(Math.random()*5)});
 if(trP.length>70)trP.splice(0,trP.length-70);if(!trRAF)trRAF=requestAnimationFrame(trFrame)}
function trailSync(){const k=M.set.trail;if(!k||RM||!TRAILS[k]||!M.inv.own['trl_'+k]){if(trC){trC.remove();trC=null;trX=null}trP=[];return}
 if(!trC){trC=document.createElement('canvas');trC.id='trail';trC.setAttribute('aria-hidden','true');document.body.appendChild(trC);trX=trC.getContext('2d');trC.width=innerWidth;trC.height=innerHeight}
 if(!trOn){trOn=true;addEventListener('pointermove',trMove,{passive:true});addEventListener('resize',()=>{if(trC){trC.width=innerWidth;trC.height=innerHeight}})}}
const TPC=['#ff2bd6','#ffe600','#00f5d4','#7a5cff','#ff5c8a'];
function trFrame(ts){trRAF=0;if(!trC||!trX)return;const x=trX,k=M.set.trail,now=performance.now();x.clearRect(0,0,trC.width,trC.height);
 if(k==='ribbon'){trPos=trPos.filter(p=>now-p.t<420);if(trPos.length>1){for(let i=1;i<trPos.length;i++){const a=trPos[i-1],b=trPos[i],f=i/trPos.length;x.strokeStyle=`hsl(${(now/6+i*14)%360},95%,60%)`;x.globalAlpha=f*.9;x.lineWidth=2+f*8;x.lineCap='round';x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}x.globalAlpha=1;trRAF=requestAnimationFrame(trFrame)}return}
 const g=TRAILS[k][0];trP.forEach(p=>{p.l-=.03;p.x+=p.vx*.016;p.y+=p.vy*.016;if(k==='stardust')p.vy+=1.2});trP=trP.filter(p=>p.l>0);
 trP.forEach(p=>{x.globalAlpha=Math.max(0,p.l);
  if(k==='pixels'){x.fillStyle=TPC[p.c];x.fillRect(Math.round(p.x),Math.round(p.y),5,5)}
  else if(k==='starlight'){x.globalCompositeOperation='lighter';const hh=(150+(1-p.l)*150+p.h*.1)%360;x.fillStyle='hsl('+hh+',100%,'+(55+p.l*15)+'%)';x.beginPath();x.arc(p.x,p.y,2+p.l*5,0,6.3);x.fill();x.fillStyle='hsla('+hh+',100%,70%,.22)';x.beginPath();x.arc(p.x,p.y,8+p.l*8,0,6.3);x.fill();x.globalCompositeOperation='source-over'}
  else if(k==='stardust'){x.fillStyle=p.c%2?'#fff':'#ffd54a';x.beginPath();x.arc(p.x,p.y,1.5+p.l*2,0,6.3);x.fill()}
  else if(k==='flame'){x.globalCompositeOperation='lighter';x.fillStyle=`hsl(${15+p.l*30},100%,${40+p.l*20}%)`;x.beginPath();x.arc(p.x,p.y,3+p.l*6,0,6.3);x.fill();x.globalCompositeOperation='source-over'}
  else if(k==='bubbles'){x.strokeStyle='#8ff7ee';x.lineWidth=1.3;x.beginPath();x.arc(p.x,p.y,3+p.s*.4*(1-p.l+.3),0,6.3);x.stroke()}
  else{x.font=Math.round(p.s*(.6+p.l*.5))+'px serif';x.fillText(g,p.x,p.y)}});
 x.globalAlpha=1;if(trP.length)trRAF=requestAnimationFrame(trFrame)}
/* click effects */
let clkLast=0;
function clickBurst(px,py,k){const mk=(txt,css)=>{const e=document.createElement('div');e.className='clkfx';e.textContent=txt;e.style.left=px+'px';e.style.top=py+'px';if(css)Object.assign(e.style,css);document.body.appendChild(e);return e},
 go=(e,dx,dy,rot,ms)=>{const a=e.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:1},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${rot}deg) scale(1.1)`,opacity:0}],{duration:ms,easing:'cubic-bezier(.2,.7,.3,1)'});a.onfinish=()=>e.remove()},R=Math.random;
 const burst=(sym,n,dist,ms,grav)=>{for(let i=0;i<n;i++){const a=i/n*6.283+R()*.5,d=dist*(.6+R()*.6);go(mk(sym),Math.cos(a)*d,Math.sin(a)*d+(grav||0),R()*360-180,ms)}};
 if(k==='pop')burst('⭐',7,46,650);else if(k==='hearts'){for(let i=0;i<6;i++)go(mk('❤️'),(R()-.5)*60,-40-R()*50,R()*40-20,800)}
 else if(k==='confetti'){const c=['#ff2bd6','#ffe600','#00f5d4','#7a5cff','#ff5c8a'];for(let i=0;i<16;i++){const e=mk('',{width:'6px',height:'9px',background:c[i%5],borderRadius:'1px'});const a=R()*6.283,d=30+R()*50;go(e,Math.cos(a)*d,Math.sin(a)*d+30,R()*540,800)}}
 else if(k==='sparks'){for(let i=0;i<9;i++){const e=mk('',{width:'3px',height:'14px',background:'#ffe600',borderRadius:'2px',boxShadow:'0 0 6px #ffe600'});const a=i/9*6.283,d=34+R()*20;go(e,Math.cos(a)*d,Math.sin(a)*d,a*57,450)}}
 else if(k==='petals'){for(let i=0;i<8;i++)go(mk('🌸'),(R()-.5)*90,20+R()*60,R()*360,1000)}
 else if(k==='coins'){for(let i=0;i<8;i++)go(mk('🪙'),(R()-.5)*100,50+R()*40,R()*360,900)}
 else if(k==='bolt'){go(mk('🌩',{fontSize:'34px'}),0,-20,0,500);for(let i=0;i<4;i++)go(mk('⚡'),(R()-.5)*80,(R()-.5)*60,R()*60-30,600)}
 else if(k==='nova'){const rg=mk('',{width:'14px',height:'14px',border:'2px solid #7dffd2',borderRadius:'50%',boxShadow:'0 0 12px #7dffd2'});const ra=rg.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:1},{transform:'translate(-50%,-50%) scale(5)',opacity:0}],{duration:700,easing:'ease-out'});ra.onfinish=()=>rg.remove();const pc=['#3dffb0','#33e0ff','#a678ff'];for(let i=0;i<10;i++){const e=mk('',{width:'5px',height:'5px',background:pc[i%3],borderRadius:'50%',boxShadow:'0 0 8px '+pc[i%3]});const a=i/10*6.283,d=40+R()*28;go(e,Math.cos(a)*d,Math.sin(a)*d,0,800)}}
 else if(k==='fireworks'){const c=['#ff2bd6','#ffe600','#00f5d4','#ff7a45','#7a5cff'];for(let i=0;i<22;i++){const e=mk('',{width:'5px',height:'5px',background:c[i%5],borderRadius:'50%',boxShadow:'0 0 6px '+c[i%5]});const a=i/22*6.283,d=50+R()*30;go(e,Math.cos(a)*d,Math.sin(a)*d+14,0,850)}}else if(CLICKS[k])burst(CLICKS[k][0],8,52,820)}
document.addEventListener('pointerdown',e=>{const k=M.set.clickfx;if(!k||RM||!CLICKS[k]||!M.inv.own['clk_'+k])return;const now=performance.now();if(now-clkLast<90)return;clkLast=now;try{clickBurst(e.clientX,e.clientY,k)}catch(x){}},true);
/* level-up shows */
function lvShow(){const k=M.set.lvfx;if(!k||RM||!LVFX[k]||!M.inv.own['lvf_'+k])return;const cv=document.createElement('canvas');cv.id='lvfxc';cv.width=innerWidth;cv.height=innerHeight;cv.setAttribute('aria-hidden','true');document.body.appendChild(cv);const x=cv.getContext('2d'),W=cv.width,H=cv.height,P=[],R=Math.random,t0=performance.now(),DUR=2900;
 const FW=()=>{const cx=W*(.2+R()*.6),cy=H*(.15+R()*.4),h=R()*360;for(let i=0;i<46;i++){const a=i/46*6.283,s=2+R()*4.5;P.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c:`hsl(${h+R()*40},95%,62%)`,g:.05})}};
 const rainE=LVFX[k][3]||(k==='coins'?'🪙':k==='stars'?'🌟':null);if(rainE)for(let i=0;i<46;i++)P.push({x:R()*W,y:-30-R()*H*.6,vx:(R()-.5)*1.5,vy:2+R()*3.4,l:1,e:rainE,s:18+R()*16,r:R()*6.28,g:.02});
 let fw=0;const loop=()=>{const t=performance.now()-t0;if(t>DUR||!document.body.contains(cv)){cv.remove();return}x.clearRect(0,0,W,H);
  if((k==='firework'||LVFX[k][4])&&t>fw){FW();fw=t+380}
  if(k==='shock'){for(let i=0;i<3;i++){const tt=t-i*260;if(tt>0&&tt<1400){x.strokeStyle='#ffd54a';x.globalAlpha=1-tt/1400;x.lineWidth=10-tt/160;x.beginPath();x.arc(W/2,H*.4,tt*.75,0,6.3);x.stroke()}}x.globalAlpha=Math.max(0,.35-t/2400);x.fillStyle='#fff';x.fillRect(0,0,W,H)}
  if(k==='aurora'||k==='nova'){for(let i=0;i<4;i++){const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,'#0000');g.addColorStop(.5,i%2?'#ffd54a':'#ff9a3c');g.addColorStop(1,'#0000');x.globalAlpha=.22*Math.sin(Math.min(1,t/DUR)*3.14);x.fillStyle=g;const y=H*.15+i*H*.06+Math.sin(t/400+i)*24;x.fillRect(0,y,W,H*.22)}if(R()<.5)P.push({x:R()*W,y:H*.2+R()*H*.3,vx:0,vy:.8,l:1,c:'#ffe9a0',g:0})}
  P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;if(!p.e)p.l-=.012;x.globalAlpha=Math.max(0,p.l);if(p.e){p.r+=.05;x.font=p.s+'px serif';x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillText(p.e,0,0);x.restore()}else{x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,2.4,0,6.3);x.fill()}});
  x.globalAlpha=1;requestAnimationFrame(loop)};loop()}
function newPreview(it){try{applyExtras();if(it.c==='lvfx')lvShow();else if(it.c==='clickfx')clickBurst(innerWidth/2,innerHeight/3,it.key);else if(it.c==='pet')petReact(5)}catch(e){}}
/* items granted by level, for everyone who already passed those levels */
const NEWLV={2:['nf_glow'],3:['bn_forest'],4:['pet_cat'],5:['clk_pop','tst_terminal'],6:['trl_sparkle','tamagotchi'],7:['bn_dusk','chp_glass'],8:['crt_gift'],9:['nf_outline'],10:['pet_robot','lvf_coins'],11:['clk_hearts'],12:['tst_glass'],13:['bn_aurora'],14:['trl_hearts','chp_pill'],15:['nf_wave'],16:['crt_case'],17:['clk_confetti'],18:['bn_circuit'],19:['trl_pixels'],20:['pet_dragon','lvf_stars'],21:['nf_underline'],22:['chp_neon'],23:['crt_urn'],24:['clk_sparks','tst_bubble'],25:['bn_goldrush','nf_rainbow'],26:['trl_stardust'],28:['lvf_firework'],30:['bn_nebula','pet_ghost'],32:['chp_holo'],35:['nf_chrome','crt_egg'],40:['pet_unicorn','lvf_aurora'],45:['bn_holo','trl_ribbon'],50:['nf_holo','crt_vault','chp_gold']};
Object.entries(NEWLV).forEach(([l,ids])=>{l=+l;const cur=LVR[l]||(l%5===0?{g:1}:{c:1});LVR[l]=Object.assign({},cur,{items:[...(cur.items||[]),...ids.filter(i=>cat(i))]})});
function claimNewLevelItems(){const L=lvlOf(M.sp);let g=0;Object.entries(NEWLV).forEach(([l,ids])=>{if(+l<=L)ids.forEach(i=>{if(cat(i)&&!M.inv.own[i]){M.inv.own[i]=1;g++}})});if(g){mDirty=true;paintChip()}}

