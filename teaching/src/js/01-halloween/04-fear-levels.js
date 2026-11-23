/* ---------- fear levels + horror tied to Pipeline Blitz ---------- */
const LVL={
 spooky:{snd:[120000,300000],seq:.12,eerie:[120000,300000],scare:[480000,1080000],cam:[90000,220000],flee:150,dbl:0,rnd:.2,last:.25,hurry:.08,over:.15,dim:.15,whisp:.05,boom:0},
 scary:{snd:[70000,180000],seq:.22,eerie:[60000,160000],scare:[240000,600000],cam:[50000,130000],flee:120,dbl:0,rnd:.4,last:.5,hurry:.25,over:.35,dim:.35,whisp:.2,boom:.5},
 nightmare:{snd:[30000,80000],seq:.4,eerie:[30000,90000],scare:[90000,240000],cam:[30000,80000],flee:70,dbl:.25,rnd:.75,last:1,hurry:.6,over:.75,dim:.8,whisp:.45,boom:1}};
let lvl='scary',hbT=0,hbBpm=0;
try{const v=localStorage.getItem('mp-hw-lvl');if(LVL[v])lvl=v}catch(e){}
const dread={lives:3,frac:1,on:false};
function beat(){if(!sndOn||!AC||AC.state!=='running'||document.hidden)return;const t=AC.currentTime,m=AC.createGain();
 [[0,.9],[.17,.6]].forEach(([o,v])=>{const tt=t+o,os=AC.createOscillator();os.frequency.setValueAtTime(70,tt);os.frequency.exponentialRampToValueAtTime(34,tt+.2);const g=envG(tt,.008,.24,v);os.connect(g);os.start(tt);os.stop(tt+.3);g.connect(m)});
 place(m,{path:[[0,0,0,.25]]})}
function hbSet(bpm){if(bpm===hbBpm)return;hbBpm=bpm;clearTimeout(hbT);root.style.setProperty('--hb',bpm?(60/bpm).toFixed(2)+'s':'1s');root.classList.toggle('danger',!!bpm);if(!bpm)return;
 const loop=()=>{if(!hwOn||!hbBpm)return;beat();hbT=setTimeout(loop,60000/hbBpm)};loop()}
function dreadUpdate(){let bpm=0;const last=dread.lives<=1,k=lvl,f=dread.frac;
 if(dread.on){if(f<.1)bpm=150;else if(f<.25)bpm=(last||k!=='spooky')?120:0;else if(f<.5)bpm=last?96:(k==='nightmare'&&dread.lives<=2?84:0);else if(last&&k!=='spooky')bpm=72}
 hbSet(bpm)}
function dreadStop(){dread.on=false;hbSet(0)}
function boom(){if(!sndOn||!AC||AC.state!=='running')return;const t=AC.currentTime,o=AC.createOscillator();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(28,t+.5);
 const g=envG(t,.004,.6,.9);o.connect(g);o.start(t);o.stop(t+.7);place(g,{path:[[0,0,0,.5]],wet:.3})}
function lossFx(d){const L=LVL[lvl];if(Math.random()<L.boom){boom();trk()}if(d.lives===1&&Math.random()<L.dim)lightsOut();if(Math.random()<L.whisp)later(SND.whisperSpeech,500)}
function blitzEvt(d){const L=LVL[lvl];
 if(d.type==='q'){dread.lives=d.lives;dread.frac=1;dread.on=true;dreadUpdate();
  if(d.endless&&eyeOn&&!scBusy){const r=d.round;if(r>=6&&r%3===0&&Math.random()<L.rnd)eyes();if(r>=10&&r%5===0&&Math.random()<L.rnd)peeker();if(r>=15&&r%5===0&&Math.random()<L.rnd)lightsOut()}
  if(d.lives===1&&Math.random()<L.last)later(SND.breath,800)}
 else if(d.type==='t'){dread.frac=d.frac;dreadUpdate();if(d.frac<.1&&Math.random()<L.hurry)later(SND.whisperSpeech,100)}
 else if(d.type==='wrong'||d.type==='timeout'){dreadStop();lossFx(d)}
 else if(d.type==='over'){dreadStop();if(scareOn&&!scBusy&&Math.random()<L.over)setTimeout(()=>{if(hwOn&&!scBusy&&!document.hidden)scare()},700)}
 else dreadStop()}
window.addEventListener('message',e=>{const d=e.data;if(!d||d.mp!=='blitz'||!hwOn)return;
 if(![...views.querySelectorAll('iframe')].some(f=>f.contentWindow===e.source))return;blitzEvt(d)});
$('hwTog').onclick=()=>$('hwp').classList.toggle('open');$('hwp').classList.toggle('open',!NARROW.matches);
$('hwLvl').onchange=()=>{lvl=$('hwLvl').value;try{localStorage.setItem('mp-hw-lvl',lvl)}catch(e){}
 toast({spooky:'🕯 Spooky: a light haunting',scary:'🩸 Scary: you are not alone',nightmare:'☠ Nightmare: good luck'}[lvl]);
 if(hwOn){clearTimeout(sndT);clearTimeout(scareT);clearTimeout(eerieT);clearTimeout(camS);sndLoop();scareLoop();eerieLoop();camSched()}};
function hwStart(){if(hwOn)return;hwOn=true;paintPanel();sndLoop(true);scareLoop();eerieLoop(true);camStart()}
function hwStop(){hwOn=false;clearTimeout(sndT);clearTimeout(scareT);clearTimeout(eerieT);camStop();dreadStop();scareEnd();live.forEach(o=>o.kill(true));$('peek').style.display='none';delete $('peek').dataset.busy}
$('hwSnd').onclick=()=>{sndOn=!sndOn;try{localStorage.setItem('mp-hw-snd',sndOn?'1':'0')}catch(e){}paintPanel();if(sndOn){audio();setTimeout(()=>{try{SND.creak()}catch(e){}},100)}};
$('hwSc').onclick=()=>{scareOn=!scareOn;try{localStorage.setItem('mp-hw-scare',scareOn?'1':'0')}catch(e){}paintPanel();toast(scareOn?'👻 Jumpscares on (rare)':'🚫 Jumpscares off')};
$('hwEye').onclick=()=>{eyeOn=!eyeOn;try{localStorage.setItem('mp-hw-eye',eyeOn?'1':'0')}catch(e){}paintPanel();if(!eyeOn){live.forEach(o=>o.kill(true))}toast(eyeOn?'👁 Something is watching…':'🙈 Watchers off')};
$('hwBoo').onclick=()=>{audio();setTimeout(scare,60)};
