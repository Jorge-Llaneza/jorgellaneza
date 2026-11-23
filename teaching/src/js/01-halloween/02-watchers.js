/* ---------- watchers: things that look back at you ---------- */
const ptr={x:-999,y:-999},live=new Set();
function lookAt(){live.forEach(o=>{const r=o.el.getBoundingClientRect(),dx=ptr.x-(r.left+r.width/2),dy=ptr.y-(r.top+r.height/2),d=Math.hypot(dx,dy)||1;
 o.el.style.setProperty('--px',Math.max(-4,Math.min(4,dx/d*4)));o.el.style.setProperty('--py',Math.max(-3,Math.min(3,dy/d*3)));if(d<o.flee)o.kill(true)})}
document.addEventListener('pointermove',e=>{ptr.x=e.clientX;ptr.y=e.clientY;lookAt()},{passive:true});
function eyes(){
 hunt();const el=document.createElement('div');el.className='eyes';el.style.setProperty('--s',rr(.9,1.9).toFixed(2));el.innerHTML='<i></i><i></i>';
 const e=Math.random(),x=e<.5?rr(2,22):e<.8?rr(70,92):rr(25,70);el.style.left=x+'%';el.style.top=rr(12,88)+'%';document.body.appendChild(el);
 let life;const o={el,flee:LVL[lvl].flee,kill(fast){if(!live.has(o))return;live.delete(o);clearTimeout(life);if(fast)el.style.transitionDuration='.12s';el.classList.remove('on');setTimeout(()=>el.remove(),fast?200:1900)}};
 live.add(o);requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('on')));life=setTimeout(()=>o.kill(false),rr(7000,14000)*(lvl==='nightmare'?1.7:1));
}
function peeker(){
 hunt();const pk=$('peek');if(pk.dataset.busy)return;pk.dataset.busy='1';const left=Math.random()<.5,sx=left?1:-1;
 pk.style.display='block';pk.style.top=rr(22,55)+'%';pk.style.left=left?'0':'auto';pk.style.right=left?'auto':'0';
 pk.style.transitionDuration='3s';pk.style.transform=`translateX(${sx*-160}px) scaleX(${sx})`;void pk.offsetWidth;
 pk.style.transform=`translateX(${sx*-30}px) scaleX(${sx})`;try{if(Math.random()<.2)SND.creak()}catch(e){}
 const t0=Date.now(),iv=setInterval(()=>{const r=pk.getBoundingClientRect(),d=Math.hypot(ptr.x-(r.left+r.width/2),ptr.y-(r.top+r.height/2));
  if(d<210||Date.now()-t0>rr(4500,7500)||!hwOn){clearInterval(iv);pk.style.transitionDuration=d<210?'.5s':'2.2s';pk.style.transform=`translateX(${sx*-170}px) scaleX(${sx})`;
   setTimeout(()=>{pk.style.display='none';delete pk.dataset.busy},d<210?600:2300)}},150);
}
function ghostText(){const w=['behind you','we see you','keep studying…','are you alone?','don’t turn around','still awake?','look closer','it’s watching','not alone'],el=document.createElement('div');
 el.className='gtxt';el.textContent=w[Math.floor(Math.random()*w.length)];el.style.left=rr(4,NARROW.matches?28:70)+'%';el.style.top=rr(15,85)+'%';document.body.appendChild(el);setTimeout(()=>el.remove(),4400)}
function lightsOut(){root.classList.add('dim');try{SND.thumps()}catch(e){}setTimeout(()=>root.classList.remove('dim'),420)}
function eerieLoop(first){clearTimeout(eerieT);if(!hwOn)return;
 eerieT=setTimeout(()=>{if(eyeOn&&!document.hidden&&!scBusy){const r=Math.random();r<.45?eyes():r<.62?peeker():r<.85?ghostText():lightsOut()}eerieLoop()},first?rr(45000,80000):rr(...LVL[lvl].eerie))}


