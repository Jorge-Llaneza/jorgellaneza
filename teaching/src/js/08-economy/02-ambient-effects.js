/* ===== ambient effects + theme sounds ===== */
let fxC=null,fxX=null,fxP=[],fxRAF=0,fxLast=0,fxKind='',fxCols=[],fxW=0,fxH=0;
function fxLevel(){return RM?0:(M.set.fx==='off'?0:M.set.fx==='full'?1:.5)}
function fxSize(){if(!fxC)return;const dpr=Math.min(2,window.devicePixelRatio||1);fxW=innerWidth;fxH=innerHeight;fxC.width=fxW*dpr;fxC.height=fxH*dpr;fxX.setTransform(dpr,0,0,dpr,0,0)}
function fxStop(){cancelAnimationFrame(fxRAF);fxRAF=0;if(fxC){fxC.remove();fxC=null;fxX=null}fxP=[]}
function fxSync(){const kind=FXMAP[mode]||'',lv=fxLevel();if(!kind||!lv){fxStop();return}
 if(!fxC){fxC=document.createElement('canvas');fxC.id='fx';fxC.setAttribute('aria-hidden','true');document.body.appendChild(fxC);fxX=fxC.getContext('2d')}
 fxKind=kind;fxSize();const N=Math.max(18,Math.min(90,Math.round(innerWidth*innerHeight/15000)))*(lv>=1?1:.5);fxP=[];
 const R=Math.random;
 if(kind==='rain'){fxCols=[];for(let x=6;x<fxW;x+=24)fxCols.push({x,y:R()*fxH,v:50+R()*90,s:R()})}
 else for(let i=0;i<N;i++)fxP.push({x:R()*fxW,y:R()*fxH,r:1+R()*3,v:15+R()*45,w:R()*6.28,k:R(),c:Math.floor(R()*5)});
 cancelAnimationFrame(fxRAF);fxLast=0;fxRAF=requestAnimationFrame(fxFrame)}
addEventListener('resize',()=>{if(fxC){fxSize()}});
const PIXC=['#ff2bd6','#ffe600','#00f5d4','#7a5cff','#ff5c8a'];
function fxFrame(ts){if(!fxC)return;fxRAF=requestAnimationFrame(fxFrame);if(document.hidden)return;if(ts-fxLast<33)return;const dt=Math.min(.1,(ts-fxLast)/1000||.033);fxLast=ts;const x=fxX;x.clearRect(0,0,fxW,fxH);const t=ts/1000,k=fxKind;
 if(k==='rain'){x.font='14px monospace';const ch='01アイウエオカキクケコ';fxCols.forEach(c=>{c.y+=c.v*dt;if(c.y-160>fxH){c.y=-20;c.v=50+Math.random()*90}for(let j=0;j<9;j++){x.globalAlpha=Math.max(0,(j===0?.5:.26)*(1-j/9));x.fillStyle=j===0?'#c8ffd4':'#00ff41';x.fillText(ch[(Math.floor(c.y/16)+j*7+Math.floor(c.s*9))%ch.length],c.x,c.y-j*16)}});x.globalAlpha=1;return}
 fxP.forEach(p=>{
  if(k==='snow'){p.y+=p.v*dt;p.x+=Math.sin(t+p.w)*14*dt;if(p.y>fxH+5){p.y=-5;p.x=Math.random()*fxW}x.globalAlpha=.75;x.fillStyle='#fff';x.beginPath();x.arc(p.x,p.y,p.r,0,6.3);x.fill()}
  else if(k==='petals'){p.y+=p.v*.8*dt;p.x+=Math.sin(t*1.2+p.w)*26*dt+8*dt;if(p.y>fxH+8||p.x>fxW+8){p.y=-8;p.x=Math.random()*fxW}x.globalAlpha=.8;x.fillStyle=p.k>.5?'#ff9ebb':'#ffc2d4';x.save();x.translate(p.x,p.y);x.rotate(t*1.5+p.w);x.beginPath();x.ellipse(0,0,p.r*2.2,p.r*1.2,0,0,6.3);x.fill();x.restore()}
  else if(k==='bubbles'){p.y-=p.v*dt;p.x+=Math.sin(t+p.w)*12*dt;if(p.y<-10){p.y=fxH+10;p.x=Math.random()*fxW}x.globalAlpha=.5;x.strokeStyle='#8ff7ee';x.lineWidth=1.2;x.beginPath();x.arc(p.x,p.y,p.r*1.8,0,6.3);x.stroke();x.globalAlpha=.3;x.fillStyle='#fff';x.fillRect(p.x-p.r*.8,p.y-p.r*.9,1.5,1.5)}
  else if(k==='pixels'){p.y-=p.v*.7*dt;if(p.y<-6){p.y=fxH+6;p.x=Math.random()*fxW}x.globalAlpha=.35+.45*Math.abs(Math.sin(t*2+p.w));x.fillStyle=PIXC[p.c];const s=2+Math.floor(p.r);x.fillRect(Math.round(p.x),Math.round(p.y),s,s)}
  else if(k==='stars'){x.globalAlpha=.25+.65*Math.abs(Math.sin(t*(.6+p.k)+p.w));x.fillStyle='#fff';x.fillRect(p.x,p.y,p.r>2.4?2:1.3,p.r>2.4?2:1.3)}
  else if(k==='sparks'){p.y-=p.v*1.2*dt;p.x+=Math.sin(t*2+p.w)*20*dt;if(p.y<-6){p.y=fxH+6;p.x=Math.random()*fxW}x.globalAlpha=.7;x.fillStyle=PIXC[p.c];x.beginPath();x.arc(p.x,p.y,1.2+p.r*.5,0,6.3);x.fill()}});
 if(k==='stars'&&Math.random()<.012){const sx=Math.random()*fxW*.8,sy=Math.random()*fxH*.4;x.globalAlpha=.8;x.strokeStyle='#fff';x.lineWidth=1.5;x.beginPath();x.moveTo(sx,sy);x.lineTo(sx+90,sy+40);x.stroke()}
 x.globalAlpha=1}
function motif(kind){try{const m=MOTIF[mode];if(!m||!sndOn||M.set.tsnd===0||!audio())return;const t=AC.currentTime,fs=kind==='level'?[...m.f,m.f[m.f.length-1]*1.5]:(kind==='big'?m.f:m.f.slice(0,2)),st=kind==='level'?m.d*1.6:m.d;
 fs.forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=m.w;o.frequency.value=f;const a=t+i*st;g.gain.setValueAtTime(0,a);g.gain.linearRampToValueAtTime(.06,a+.01);g.gain.exponentialRampToValueAtTime(.0001,a+st*2.4);o.connect(g);g.connect(master);o.start(a);o.stop(a+st*2.5)})}catch(e){}}
function xpPop(n){if(RM||n<.5||document.hidden)return;const c=$('chip');if(!c)return;const r=c.getBoundingClientRect(),p=document.createElement('div');p.className='rpop';p.style.color='var(--acc)';p.style.textShadow='0 0 8px var(--acc)';p.textContent='+'+f1(n)+' SP';p.style.left=Math.max(6,r.left+r.width/2-22)+'px';p.style.top=(r.bottom+4)+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),1200)}
function fxXP(n){if(!FXMAP[mode]||n<.5)return;motif(n>=8?'big':'xp');if(mode!=='dopamine')xpPop(n)}

