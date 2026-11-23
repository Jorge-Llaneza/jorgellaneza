/* ===== part 3h: UniOvi and 67 achievements and level reward ===== */
addC('title','t_Est. 1608','Est. 1608','epic',{title:'Est. 1608',noDrop:true});
AX('uni1','🏛','Uni Oviedo student','Reach level 10 at Uni Oviedo',()=>lvlOf(M.sp)>=10,{c:67,b:{crate:1}},()=>[Math.min(10,lvlOf(M.sp)),10]);
AX('uni1608','📜','Founded 1608','Study for 16 hours and 8 minutes in total (the year the university opened)',()=>totalSec()>=968*60,{c:160,i:['t_Est. 1608']},()=>[Math.min(968,Math.floor(totalSec()/60)),968]);
AX('uni4','🍎','Cider hour','Finish the Asturian way: earn 100 SP in one day',()=>Object.values(M.ld).some(v=>v>=100),{c:50},()=>[Math.min(100,Math.floor(Math.max(0,...Object.values(M.ld),0))),100]);
AX('s67','6️⃣','Six Seven','Earn 67 Study Points',()=>M.sp>=67,{c:67},()=>[Math.floor(Math.min(67,M.sp)),67]);
AX('c67','7️⃣','Sixty-seven answers','Answer 67 arcade questions correctly',()=>M.stat.c>=67,{c:67,i:['t_67 Club']},()=>[Math.min(67,M.stat.c),67]);
AX('t367','⏱','6 hours 7 minutes','Study for 6 hours and 7 minutes in total',()=>totalSec()>=367*60,{c:67,b:{fun:1}},()=>[Math.min(367,Math.floor(totalSec()/60)),367]);
AX('st67','🔢','Sixty-seven days','Reach a 67-day study streak',()=>(M.streak.b||0)>=67,{c:670,b:{gold:2}},()=>[Math.min(67,M.streak.b||0),67]);
(function(){const cur=LVR[16]||{c:1};LVR[16]=Object.assign({},cur,{items:[...(cur.items||[]),'uniovi']});NEWLV[16]=[...(NEWLV[16]||[]),'uniovi']})();

/* ===== part 3j: IDE skins, sounds, achievements and level rewards ===== */
Object.assign(SKINMAP,{comment:t=>'// '+t,tag:t=>'<'+t+'>',func:t=>t.trim().replace(/\s+/g,'_').toLowerCase()+'()'});
Object.assign(UISND,{
 keyclack(t,v){const o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.setValueAtTime(900+Math.random()*300,t);o.frequency.exponentialRampToValueAtTime(260,t+.03);g.gain.setValueAtTime(.06*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);o.connect(g);g.connect(master);o.start(t);o.stop(t+.06)},
 buildok(t,v){[523,659,784,1047].forEach((f,i)=>tone2(t,v,f,.14,'triangle',.07,i*.05))},
 buzz(t,v){tone2(t,v,140,.22,'sawtooth',.07);tone2(t,v,150,.22,'square',.04)}});
(function(){const E={ibeam:'⌶',bug:'🐛',plug:'🔌'};const s=document.getElementById('mpx2');let css='';for(const k in E)css+=`html[data-cur=${k}],html[data-cur=${k}] *{cursor:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text y='26' font-size='26'>${E[k]}</text></svg>") 4 4,auto!important}\n`;if(s)s.textContent+=css})();
const ideOwned=()=>IDE_IDS.filter(i=>M.inv.own[i]).length;
AX('ide3','🖥','IDE hopper','Own the BlueJ, Code Dark and Eclipse Night themes',()=>!!(M.inv.own.bluej&&M.inv.own.codedark&&M.inv.own.eclipsenight),{c:150,i:['t_IDE Hopper']},()=>[(M.inv.own.bluej?1:0)+(M.inv.own.codedark?1:0)+(M.inv.own.eclipsenight?1:0),3]);
AX('ide15','🧩','Extension collector','Collect 15 developer-themed items',()=>ideOwned()>=15,{c:120,i:['t_Extension Collector']},()=>[Math.min(15,ideOwned()),15]);
AX('hci2h','☕','Java brewer','Study for 2 hours in the HCI & Java GUI Lab',()=>(M.tsec.hci||0)>=7200,{c:100,i:['t_BlueJ Veteran']},()=>[Math.min(120,Math.floor((M.tsec.hci||0)/60)),120]);
AX('debug10','🐞','Debugger','Master 10 mistakes',()=>M.mastered>=10,{c:80,i:['t_Debugger Whisperer']},()=>[Math.min(10,M.mastered),10]);
AX('compile','✅','Compiles first time','Answer 20 arcade questions correctly in total',()=>M.stat.c>=20,{c:40,i:['t_Compile Without Errors']},()=>[Math.min(20,M.stat.c),20]);
AX('duck','🦆','Rubber duck debugging','Own the Rubber Duck companion',()=>!!M.inv.own['pet_duck'],{c:60},()=>[M.inv.own['pet_duck']?1:0,1]);
(function(){const add=(l,ids)=>{const cur=LVR[l]||(l%5===0?{g:1}:{c:1});LVR[l]=Object.assign({},cur,{items:[...(cur.items||[]),...ids]});NEWLV[l]=[...(NEWLV[l]||[]),...ids]};add(4,['bluej']);add(12,['codedark','pet_duck']);add(22,['eclipsenight']);add(27,['f_consolas'])})();

/* ===== part 3k: fonts that were missing CSS, readable accent colour ===== */
const FONT_CSS=Object.entries(FONTS).map(([k,f])=>`html[data-font=${k}] body,html[data-font=${k}] button,html[data-font=${k}] input,html[data-font=${k}] select,html[data-font=${k}] textarea,html[data-font=${k}] h1,html[data-font=${k}] h2,html[data-font=${k}] h3{font-family:${f.s}!important}`).join('\n');
(function(){const s=document.createElement('style');s.id='mpx3';s.textContent=FONT_CSS;document.head.appendChild(s)})();
function onFor(hex){try{const h=hex.replace('#','');const f=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4)};const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16),L=.2126*f(r)+.7152*f(g)+.0722*f(b);return (L+.05)/.05>=1.05/(L+.05)?'#000':'#fff'}catch(e){return '#fff'}}
/* click effects and cursor trails also work while you are inside a study lab */
function labFx(doc){try{const fe=doc.defaultView&&doc.defaultView.frameElement;if(!fe)return;const off=()=>{const r=fe.getBoundingClientRect();return[r.left,r.top]};
 doc.addEventListener('pointerdown',e=>{const k=M.set.clickfx;if(!k||RM||!CLICKS[k]||!M.inv.own['clk_'+k])return;const now=performance.now();if(now-clkLast<90)return;clkLast=now;const[o,p]=off();try{clickBurst(e.clientX+o,e.clientY+p,k)}catch(x){}},true);
 doc.addEventListener('pointermove',e=>{if(!M.set.trail)return;const[o,p]=off();trMove({clientX:e.clientX+o,clientY:e.clientY+p,pointerType:e.pointerType})},{passive:true})}catch(x){}}

