/* ---------- found-footage camcorder ---------- */
let camT=0,camT0=0,camS=0,camOn=true;
try{camOn=localStorage.getItem('mp-hw-cam')!=='0'}catch(e){}
root.dataset.cam=camOn?'1':'0';
function camTick(){const n=new Date(),p=v=>String(v).padStart(2,'0'),M=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
 let h=n.getHours();const ap=h>=12?'PM':'AM';h=h%12||12;
 $('camTs').textContent=`${M[n.getMonth()]} ${p(n.getDate())} ${n.getFullYear()}  ${p(h)}:${p(n.getMinutes())}:${p(n.getSeconds())} ${ap}`;
 const e=Math.floor((Date.now()-camT0)/1000);$('camRec').textContent=`REC ${p(Math.floor(e/3600))}:${p(Math.floor(e/60)%60)}:${p(e%60)}`;
 $('camBat').dataset.b=e<360?3:e<720?2:1}
function trk(){if(RM||!camOn)return;const t=$('trk');t.classList.remove('go');void t.offsetWidth;t.classList.add('go')}
function hunt(){if(RM||!camOn)return;const a=[$('views'),$('home')];a.forEach(e=>e.classList.add('af'));setTimeout(()=>a.forEach(e=>e.classList.remove('af')),rr(450,900))}
function camSched(){clearTimeout(camS);camS=setTimeout(()=>{if(hwOn&&!document.hidden&&!scBusy){Math.random()<.5?trk():hunt()}camSched()},rr(...LVL[lvl].cam))}
function camStart(){camT0=Date.now();camTick();clearInterval(camT);camT=setInterval(camTick,1000);camSched()}
function camStop(){clearInterval(camT);clearTimeout(camS);$('views').classList.remove('af');$('home').classList.remove('af')}
$('hwCam').onclick=()=>{camOn=!camOn;try{localStorage.setItem('mp-hw-cam',camOn?'1':'0')}catch(e){}root.dataset.cam=camOn?'1':'0';paintPanel();toast(camOn?'📹 Recording…':'📷 Camcorder view off')};
