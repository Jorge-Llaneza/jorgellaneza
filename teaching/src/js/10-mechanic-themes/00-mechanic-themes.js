/* ===== part 3m: four themes with their own mechanics, plus funny skins, sounds and cursors ===== */
Object.assign(FXMAP,{orbit:'stars'});
Object.assign(MOTIF,{pixelquest:{w:'square',f:[659,784,988],d:.06},orbit:{w:'sine',f:[523,784],d:.12},tomato:{w:'triangle',f:[784,659],d:.1},hackterm:{w:'square',f:[1200,1600],d:.04}});
Object.assign(SKINMAP,{leet:t=>t.replace(/[aeiolst]/gi,c=>({a:'4',e:'3',i:'1',o:'0',l:'1',s:'5',t:'7'})[c.toLowerCase()]),reverse:t=>[...t].reverse().join(''),shout:t=>t.toUpperCase()+'!!!',mock:t=>[...t].map((c,i)=>i%2?c.toUpperCase():c.toLowerCase()).join('')});
Object.assign(UISND,{
 splat(t,v){const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(60,t+.1);g.gain.setValueAtTime(.2*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);g.connect(master);o.start(t);o.stop(t+.14)},
 sword(t,v){const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.setValueAtTime(2200,t);o.frequency.exponentialRampToValueAtTime(400,t+.12);g.gain.setValueAtTime(.06*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);o.connect(g);g.connect(master);o.start(t);o.stop(t+.16);tone2(t,v,1800,.05,'triangle',.04,.1)},
 rocketsnd(t,v){const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(900,t+.35);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(.08*v,t+.08);g.gain.exponentialRampToValueAtTime(.001,t+.4);o.connect(g);g.connect(master);o.start(t);o.stop(t+.42)},
 boot(t,v){[440,660,880].forEach((f,i)=>tone2(t,v,f,.1,'square',.05,i*.09));tone2(t,v,1320,.2,'square',.04,.3)}});
(function(){const E={tomatocur:'🍅',rocketcur:'🚀',swordcur:'🗡️',skullcur:'💀'};const s=document.getElementById('mpx2');let css='';for(const k in E)css+=`html[data-cur=${k}],html[data-cur=${k}] *{cursor:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text y='26' font-size='26'>${E[k]}</text></svg>") 4 4,auto!important}\n`;if(s)s.textContent+=css})();
['Interstellar','Pomodoro Pro','Boss Hunter','Root Access'].forEach(t=>addU('title','t_'+t,t,'epic',{title:t,noDrop:true}));
/* ---- shared helpers ---- */
function mxEnsure(){M.mx=M.mx||{};M.mx.q=M.mx.q||{hp:0,max:0,kills:0,seen:{},cd:{d:0,n:0},bc:{d:0,n:0}};M.mx.o=M.mx.o||{start:null,done:{}};M.mx.p=M.mx.p||{mode:'idle',end:0,sp0:0,td0:0,day:0,today:0,total:0};M.mx.t=M.mx.t||{cmds:0,open:1}}
const MXID={pixelquest:'qw',orbit:'orb',tomato:'pomo',hackterm:'term'};
function mxEl(id,cls){let e=document.getElementById(id);if(!e){e=document.createElement('div');e.id=id;e.className='mxw '+cls;document.body.appendChild(e)}return e}
function mxFloat(txt,col){if(RM)return;const w=document.querySelector('.mxw');const r=w?w.getBoundingClientRect():{left:innerWidth-120,top:innerHeight-100};const f=document.createElement('div');f.className='mxf';f.textContent=txt;f.style.color=col||'#fff';f.style.left=(r.left+30+Math.random()*80)+'px';f.style.top=(r.top-6)+'px';document.body.appendChild(f);setTimeout(()=>f.remove(),1000)}
function mxSync(){mxEnsure();Object.values(MXID).forEach(id=>{if(MXID[mode]!==id){const e=document.getElementById(id);if(e)e.remove()}});if(!MXID[mode])return;if(mode==='orbit'&&M.mx.o.start==null)M.mx.o.start=M.sp;if(mode==='pixelquest'&&!M.mx.q.max)qSpawn();({pixelquest:qPaint,orbit:oPaint,tomato:pPaint,hackterm:tPaint})[mode]()}
function mxOnSP(n,why,lv,kind){try{mxEnsure();if(mode==='pixelquest'&&kind!=='game')qOnSP(n);else if(mode==='orbit'&&kind!=='game')oOnSP();else if(mode==='hackterm'){termLog(`[ OK ] +${f1(n)} SP · ${why||'study'}`);if(lv)termLog(`[BUILD] level ${lv} reached`)}else if(mode==='tomato')pPaint()}catch(e){}}
/* ---- Pixel Quest: every study point is an attack ---- */
const QMON=[['Segfault Slime','🟢'],['Null Pointer Ghost','👻'],['Infinite Loop Snake','🐍'],['Stack Overflow Dragon','🐲'],['Memory Leak Blob','💧'],['Deadlock Golem','🗿'],['Race Condition Rat','🐀'],['Syntax Error Bat','🦇'],['Off-By-One Imp','👹'],['Heisenbug','🦋']],QBOSS=['Legacy Code Kraken','🦑'];
function qMon(){const q=M.mx.q,boss=(q.kills+1)%10===0,m=boss?QBOSS:QMON[q.kills%QMON.length];return{n:m[0],e:m[1],boss}}
function qSpawn(){const q=M.mx.q,m=qMon(),lv=1+Math.floor(q.kills/5);q.max=Math.round((20+6*lv)*(m.boss?3:1));q.hp=q.max}
function qPaint(){const q=M.mx.q;if(!q.max)qSpawn();const m=qMon(),lv=1+Math.floor(q.kills/5),pct=Math.max(0,q.hp/q.max*100),el=mxEl('qw','qw');
 el.innerHTML=`<div class="mx-row"><span class="mx-hero" aria-hidden="true">🧙</span><span><b>Hero Lv ${lv}</b><small>${q.kills} defeated</small></span><span class="mx-vs" aria-hidden="true">⚔️</span><span class="mx-mon ${m.boss?'boss':''}" aria-hidden="true">${m.e}</span></div><div class="mx-name">${m.boss?'👑 BOSS: ':''}${esc(m.n)}</div><div class="mx-bar" role="progressbar" aria-label="Monster health" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><div class="mx-hp">${Math.max(0,Math.ceil(q.hp))}/${q.max} HP · study to attack!</div>`;
 el.onclick=()=>toast(`📖 Bestiary: ${Object.keys(q.seen).length}/${QMON.length+1} monsters met`)}
function qOnSP(n){if(!(n>0))return;const q=M.mx.q;if(!q.max)qSpawn();const m=qMon(),dmg=Math.max(1,Math.round(n*2));q.hp-=dmg;mxFloat('-'+dmg,'#ffd23f');
 if(q.hp<=0){q.kills++;q.seen[m.n]=1;const d=dayN();if(q.cd.d!==d)q.cd={d,n:0};let coin=m.boss?30:3+Math.floor(q.kills/5);coin=Math.max(0,Math.min(coin,60-q.cd.n));q.cd.n+=coin;M.coins+=coin;let extra='';if(m.boss){if(q.bc.d!==d)q.bc={d,n:0};if(q.bc.n<2){q.bc.n++;M.inv.box.crate=(M.inv.box.crate||0)+1;extra=' + a Study Crate'}}mDirty=true;toast(`${m.e} ${m.n} defeated! +${coin} 🪙${extra}`);if(m.boss)confetti();qSpawn();paintChip();checkAch()}
 qPaint()}
/* ---- Mission Control: your total study points are fuel ---- */
const ORB=[['Moon','🌙',100,{c:100}],['Mars','🔴',400,{c:150,b:{crate:1}}],['Jupiter','🟠',1000,{c:250,b:{fun:1}}],['Saturn','🪐',2000,{c:350,b:{style:1}}],['Neptune','🔵',4000,{c:500,b:{gold:1}}],['Alpha Centauri','⭐',8000,{c:1000,b:{gold:2},i:['t_Interstellar']}]];
function oPaint(){const o=M.mx.o,prog=Math.max(0,M.sp-(o.start==null?M.sp:o.start)),next=ORB.find(p=>!o.done[p[0]]),el=mxEl('orb','orb');
 if(!next){el.innerHTML='<div class="mx-row"><span class="mx-hero">🚀</span><b>Journey complete!</b></div><div class="mx-hp">You reached every destination.</div>';return}
 const prev=ORB[ORB.indexOf(next)-1],base=prev?prev[2]:0,pct=Math.min(100,Math.max(0,(prog-base)/(next[2]-base)*100));
 el.innerHTML=`<div class="mx-row"><span class="mx-hero" aria-hidden="true">🚀</span><span><b>To ${next[1]} ${esc(next[0])}</b><small>${Math.floor(prog)} / ${next[2]} SP</small></span></div><div class="mx-bar" role="progressbar" aria-label="Distance to ${esc(next[0])}" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><div class="mx-hp">${Math.max(0,Math.ceil(next[2]-prog))} SP to arrival</div>`;
 el.onclick=()=>toast('🛰 Route: '+ORB.map(p=>p[1]+' '+p[0]+(o.done[p[0]]?' ✓':' '+p[2]+' SP')).join(' · '))}
function oOnSP(){const o=M.mx.o;if(o.start==null)o.start=M.sp;const prog=M.sp-o.start;ORB.forEach(p=>{if(!o.done[p[0]]&&prog>=p[2]){o.done[p[0]]=1;giveReward(p[3]);mDirty=true;toast(`${p[1]} Arrived at ${p[0]}! ${rewardText(p[3])}`);confetti();checkAch()}});oPaint()}
/* ---- Tomato Timer: real focus sessions, checked against real study ---- */
const POMO={focus:25*60e3,brk:5*60e3};
const pFmt=ms=>{const s=Math.ceil(Math.max(0,ms)/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function pPaint(){const p=M.mx.p,el=mxEl('pomo','pomo'),now=Date.now(),d=dayN();if(p.day!==d){p.day=d;p.today=0}let h;
 if(p.mode==='idle')h=`<div class="mx-row"><span class="mx-hero" aria-hidden="true">🍅</span><span><b>Tomato Timer</b><small>${p.today}/4 today · ${p.total} total</small></span></div><button class="mx-btn" data-act="pstart">▶ Start 25 min focus</button><div class="mx-hp">Study during the timer (8 SP or 15 active minutes) to earn 🪙 15.</div>`;
 else{const left=p.end-now,tot=p.mode==='focus'?POMO.focus:POMO.brk;h=`<div class="mx-row"><span class="mx-hero" aria-hidden="true">${p.mode==='focus'?'🍅':'☕'}</span><span><b>${p.mode==='focus'?'Focus':'Break'}</b><small id="pLeft">${pFmt(left)}</small></span></div><div class="mx-bar" role="progressbar" aria-label="Timer" aria-valuenow="${Math.round((1-left/tot)*100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.min(100,Math.max(0,(1-left/tot)*100))}%"></i></div><button class="mx-btn" data-act="pstop">${p.mode==='focus'?'✕ Give up':'⏭ Skip break'}</button>`}
 el.innerHTML=h}
function pStart(){const p=M.mx.p,d=dayN();p.mode='focus';p.end=Date.now()+POMO.focus;p.sp0=M.ld[d]||0;p.td0=(M.td.d===d?M.td.s:0);mDirty=true;pPaint()}
function pStop(){const p=M.mx.p;p.mode='idle';mDirty=true;pPaint()}
function pFinish(){const p=M.mx.p,d=dayN(),earned=(M.ld[d]||0)-p.sp0,act=(M.td.d===d?M.td.s:0)-p.td0;
 if(earned>=8||act>=900){p.total++;if(p.day!==d){p.day=d;p.today=0}if(p.today<4){p.today++;M.coins+=15;toast('🍅 Tomato complete! +15 🪙');if(p.today===4){M.inv.box.fun=(M.inv.box.fun||0)+1;toast('🍅×4 Pomodoro set! A Fun Crate is yours.')}}else toast('🍅 Tomato complete! (daily reward limit reached)');motif('big')}
 else toast('🍅 That one did not count: study during the timer (8 SP or 15 active minutes).');
 p.mode='break';p.end=Date.now()+POMO.brk;mDirty=true;paintChip();try{checkAch()}catch(e){}}
function pTick(){if(mode!=='tomato')return;mxEnsure();const p=M.mx.p,now=Date.now();if(p.mode==='idle')return;if(now>=p.end){if(p.mode==='focus')pFinish();else{p.mode='idle';mDirty=true;toast('☕ Break over. Ready for another tomato?')}pPaint();return}const l=document.getElementById('pLeft');if(l)l.textContent=pFmt(p.end-now)}
setInterval(pTick,1000);
/* ---- Hacker Terminal: a build log of your studying, plus silly commands ---- */
const TLOG=['[BOOT] study-os 1.0 ready','type "help" for commands'];
const FORT=['A bug in the hand is worth two in production.','You will fix it after lunch.','Today is a great day to commit.','The cache remembers what you forget.','Your next merge will be conflict-free (probably).','Take a break. The compiler will wait.'];
const JOKES=['Why do Java developers wear glasses? Because they do not C#.','There are 10 kinds of people: those who understand binary and those who do not.','A SQL query walks into a bar, sees two tables and asks: can I join you?','!false: it is funny because it is true.'];
function termLog(s){TLOG.push(String(s));if(TLOG.length>60)TLOG.shift();if(mode==='hackterm')tPaintLog()}
function tPaintLog(){const l=document.getElementById('tlog');if(l){l.textContent=TLOG.slice(-8).join('\n');l.scrollTop=l.scrollHeight}}
function tPaint(){const t=M.mx.t,el=mxEl('term','term');el.innerHTML=`<div class="mx-th"><b>build.log</b><button data-act="tmin" aria-label="${t.open?'Minimise the terminal':'Open the terminal'}">${t.open?'–':'□'}</button></div>${t.open?`<pre class="mx-log" id="tlog" aria-live="polite"></pre><label class="mx-cmd"><span aria-hidden="true">$</span><input id="tin" autocomplete="off" spellcheck="false" placeholder="type help" aria-label="Terminal command"></label>`:''}`;if(t.open)tPaintLog()}
function tRun(cmd){const c=cmd.trim();if(!c)return;termLog('$ '+c);const parts=c.split(/\s+/),a=parts[0].toLowerCase(),rest=parts.slice(1).join(' ');M.mx.t.cmds=(M.mx.t.cmds||0)+1;mDirty=true;
 switch(a){case 'help':termLog('commands: help stats fortune joke cowsay coffee date ls clear exit');break;
 case 'stats':termLog(`level ${lvlOf(M.sp)} · ${Math.floor(M.sp)} SP · ${Math.floor(M.coins)} coins · streak ${streakNow()}`);break;
 case 'fortune':termLog(FORT[Math.floor(Math.random()*FORT.length)]);break;
 case 'joke':termLog(JOKES[Math.floor(Math.random()*JOKES.length)]);break;
 case 'cowsay':{const t=rest||'moo';termLog(' '+'_'.repeat(t.length+2));termLog('< '+t+' >');termLog(' '+'-'.repeat(t.length+2));termLog('  (oo) ~ moo')}break;
 case 'coffee':termLog('brewing... done. +0 SP, +100% mood');break;
 case 'date':termLog(new Date().toString().slice(0,24));break;
 case 'ls':termLog('lessons/  exercises/  notes.txt  secrets/ (permission denied)');break;
 case 'sudo':termLog('Nice try. No coins for you: study instead.');break;
 case 'rm':termLog('Permission denied. Also, please do not.');break;
 case 'hello':termLog('Hello, world!');break;
 case 'clear':TLOG.length=0;break;
 case 'exit':M.mx.t.open=0;tPaint();return;
 default:termLog(a+': command not found')}
 tPaintLog();try{checkAch()}catch(e){}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#pomo [data-act],#term [data-act]');if(!b)return;const a=b.dataset.act;if(a==='pstart')pStart();else if(a==='pstop')pStop();else if(a==='tmin'){M.mx.t.open=M.mx.t.open?0:1;mDirty=true;tPaint()}});
document.addEventListener('keydown',e=>{if(e.target&&e.target.id==='tin'&&e.key==='Enter'){const v=e.target.value;e.target.value='';tRun(v)}});
/* ---- achievements, level rewards and sets for the new themes ---- */
AX('qk5','🗡','Monster slayer','Defeat 5 monsters in Pixel Quest',()=>((M.mx.q||{}).kills||0)>=5,{c:60},()=>[Math.min(5,(M.mx.q||{}).kills||0),5]);
AX('qboss','👑','Boss hunter','Defeat a boss in Pixel Quest',()=>((M.mx.q||{}).kills||0)>=10,{c:120,i:['t_Boss Hunter']},()=>[Math.min(10,(M.mx.q||{}).kills||0),10]);
AX('moon','🌙','Moonwalker','Reach the Moon in Mission Control',()=>!!((M.mx.o||{}).done||{}).Moon,{c:60,i:['t_Orbit Commander']},()=>[((M.mx.o||{}).done||{}).Moon?1:0,1]);
AX('inter','⭐','Interstellar','Reach Alpha Centauri in Mission Control',()=>!!((M.mx.o||{}).done||{})['Alpha Centauri'],{c:500,i:['t_Interstellar']},()=>[((M.mx.o||{}).done||{})['Alpha Centauri']?1:0,1]);
AX('tom1','🍅','Pomodoro','Complete a focus tomato',()=>((M.mx.p||{}).total||0)>=1,{c:30},()=>[Math.min(1,(M.mx.p||{}).total||0),1]);
AX('tom20','🍅','Tomato farmer','Complete 20 focus tomatoes',()=>((M.mx.p||{}).total||0)>=20,{c:200,i:['t_Pomodoro Pro','t_Tomato Tycoon']},()=>[Math.min(20,(M.mx.p||{}).total||0),20]);
AX('term1','>_','Hello, terminal','Run a command in the Hacker Terminal',()=>((M.mx.t||{}).cmds||0)>=1,{c:30},()=>[Math.min(1,(M.mx.t||{}).cmds||0),1]);
AX('term20','💻','Power user','Run 20 terminal commands',()=>((M.mx.t||{}).cmds||0)>=20,{c:100,i:['t_Root Access','t_Terminal Wizard']},()=>[Math.min(20,(M.mx.t||{}).cmds||0),20]);
(function(){const add=(l,ids)=>{const cur=LVR[l]||(l%5===0?{g:1}:{c:1});LVR[l]=Object.assign({},cur,{items:[...(cur.items||[]),...ids]});NEWLV[l]=[...(NEWLV[l]||[]),...ids]};add(9,['tomato']);add(15,['hackterm']);add(19,['orbit']);add(31,['pixelquest'])})();
SETS.push({id:'mechanics',n:'Special Effects Club',ico:'✨',d:'Themes that do something while you study.',limited:'Rare themes',ids:['dopamine','tamagotchi','tomato','hackterm','orbit','pixelquest','t_Interstellar'],reward:{c:500,b:{gold:2}}},
 {id:'memelab',n:'Meme Lab',ico:'🤪',d:'Questionable humour, carefully collected.',limited:'Limited edition',ids:FUN_IDS.concat(['fl_sudo','fl_404','nf_bsodfx','tst_bsod','chp_bsodchip','card_bsodcard','lvf_e404','f_papyrus','sk_mock','cf_memes','pet_clown','trl_skulltr','crt_pirate','clk_sudo']),reward:{c:404,b:{fun:2}}});

