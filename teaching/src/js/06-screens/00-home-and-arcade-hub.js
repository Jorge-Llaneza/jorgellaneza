/* ===================== screens: dashboard, arcade, notebook, rewards, navigation ===================== */
const ARC=[
 {id:'tec',lab:'tec',labName:'TEC Lab',icon:'⚡',name:'Circuit Sprint',desc:'Ohm, dividers, RC, LEDs and diodes against the clock.',gen:genTEC},
 {id:'logic',lab:'logic',labName:'Logic Lab',icon:'🧠',name:'Truth Rush',desc:'Truth tables, equivalences and tautologies, all verified by brute force.',gen:genLogic},
 {id:'hci',lab:'hci',labName:'HCI & Java GUI Lab',icon:'🖥',name:'GUI Gauntlet',desc:'Swing, events, usability and Nielsen heuristics.',gen:genHCI}];
const NATIVE=[
 {icon:'⚔️',name:'MIPS Pipeline Blitz',lab:'mips',desc:'Predict cycles and stalls. Daily, random and endless modes.',open:()=>openLab('mips','#blitzCard')},
 {icon:'🥋',name:'Dojo daily puzzles',lab:'dojo',desc:'Daily Worddle and Traversal, with streaks.',open:()=>openLab('dojo')},
 {icon:'🔗',name:'Wire it up',lab:'hci',desc:'The HCI lab\'s own game.',open:()=>openLab('hci',null,w=>w.go&&w.go('game'))},
 {icon:'🎯',name:'Crack the Q',lab:'tec',desc:'The TEC lab\'s own challenge, with streaks.',open:()=>openLab('tec',null,w=>{const b=[...w.document.querySelectorAll('#nav button')].find(x=>/Crack/.test(x.textContent));b&&b.click()})}];
const BOARDS=[['mips-blitz','MIPS Blitz · 10 rounds'],['mips-endless','MIPS Blitz · Endless'],['tec-classic','Circuit Sprint · 10 rounds'],['tec-endless','Circuit Sprint · Endless'],['logic-classic','Truth Rush · 10 rounds'],['logic-endless','Truth Rush · Endless'],['hci-classic','GUI Gauntlet · 10 rounds'],['hci-endless','GUI Gauntlet · Endless']];
let hofBoard='mips-blitz',nbFilter='all',G2=null,R=null,g2T=0,deferredPrompt=null;
const bestOf=b=>((M.scores[b]||[])[0]||{s:0}).s;
const streakNow=()=>{const d=dayN(),l=M.streak.l;if(l===d||l===d-1)return M.streak.n;const g=d-1-l;return(l>0&&g>0&&g<=(M.inv.qty.freeze||0))?M.streak.n:0};
function nextUnlock(){const L=lvlOf(M.sp);const l=[...Object.values(XT),...Object.values(PERK)].filter(x=>x.lv>L).sort((a,b)=>a.lv-b.lv);return l[0]}
function openLab(id,sel,fn){go(id);const f=views.querySelector('[data-id="'+id+'"]');if(!f)return;
 const run=()=>{try{const w=f.contentWindow;fn&&fn(w);if(sel){const el=w.document.querySelector(sel);el&&el.scrollIntoView({behavior:'smooth'})}}catch(e){}};
 try{if(f.contentDocument.readyState==='complete'&&f.contentDocument.body&&f.contentDocument.body.children.length){setTimeout(run,60);return}}catch(e){}
 f.addEventListener('load',()=>setTimeout(run,250),{once:true})}
function labLines(id){const a=[];
 if(id==='mips'){const s=rdK('mp64blitz')||{};a.push(`Blitz best ${s.best||0} · Endless ${s.bestE||0}`)}
 if(id==='dojo')a.push(`Worddle 🔥${(rdK('wdS')||{}).n||0} · Traversal 🔥${(rdK('wmS')||{}).n||0}`);
 if(id==='logic'){const s=rdK('ll')||{};a.push(`⭐ ${s.xp||0} XP · ✓ ${Object.keys(s.solved||{}).length} solved`)}
 if(id==='tec'){const s=rdK('qq')||{};a.push(`Crack the Q ${s.w||0}/${s.p||0} · streak ${s.s||0}`)}
 const g=ARC.find(x=>x.lab===id);if(g)a.push(`${g.name}: ${bestOf(g.id+'-classic')} · ♾️ ${bestOf(g.id+'-endless')}`);
 a.push('⏱ '+fmtT(M.tsec[id]||0));return a}
/* ---------- home / dashboard ---------- */
function renderHome(){
 const L=lvlOf(M.sp),lo=need(L),hi=need(L+1),pct=Math.round((M.sp-lo)/(hi-lo)*100),today=Math.floor(M.ld[dayN()]||0),nx=nextUnlock(),due=M.mist.length,fc=Object.keys(BOX).filter(boxVisible).reduce((a,k)=>a+(M.inv.box[k]||0),0),last=META.find(a=>a.id===M.last),earned=BADGES.filter(b=>b[4]());
 home.innerHTML=`<div class="wrap"><h1 id="hh">▌MP PRODUCTIONS TEACHING</h1><p class="sub">Study, play, and unlock new looks as you level up.</p>
 <div class="card hero"><div class="hrow"><div><div class="big">${heroName()}Level ${L} · ${lvlName(L)}</div><div class="mut">${M.set.title?'“'+esc(M.set.title)+'” · ':''}${Math.floor(M.sp)} Study Points · 🪙 ${Math.floor(M.coins)}</div></div>
 <div class="chips"><button data-act="go" data-id="profile">👤 Edit profile</button><button data-act="lang">${LANG==='es'?'🌐 English':'🌐 Español'}</button><span class="chip2">🔥 ${streakNow()} day streak</span>${M.inv.boost>Date.now()?'<span class="chip2">⚡ Booster on</span>':''}</div></div>
 <div class="bar2"><i style="width:${pct}%"></i></div><div class="mut">${Math.ceil(hi-M.sp)} SP to level ${L+1}${nx?` · next unlock: <b>${esc(nx.n)}</b> at level ${nx.lv}`:''}</div></div>
 ${hxAdvCard()}${hxHero()}${hxBpCard()}${typeof evCard==='function'?evCard():''}${typeof ckCard==='function'?ckCard():''}${typeof stkCard==='function'?stkCard():''}${typeof farmCard==='function'?farmCard():''}${typeof fcCard==='function'?fcCard():''}${typeof egCard==='function'?egCard():''}${hxShopCard()}${dailyHTML()}<h3>Today</h3><div class="card today">
  <div class="it"><span>▶ ${last?`Continue in <b>${esc(last.name)}</b>`:'Pick a lab to start learning'}</span>${last?`<button class="pri" data-act="open" data-id="${last.id}">Continue</button>`:''}</div>
  <div class="it"><span>🎯 Daily goal: <b>${Math.min(today,30)}/30</b> learning SP</span><div class="bar2" style="width:140px;margin:0"><i style="width:${Math.min(100,today/30*100)}%"></i></div></div>
  ${focusItem()}${due?`<div class="it"><span>📓 <b>${due}</b> mistake${due>1?'s':''} to review</span><button data-act="nb">Review</button></div>`:''}
  ${fc?`<div class="it"><span>🎁 You have <b>${fc}</b> free crate${fc>1?'s':''}</span><button data-act="crates">Open</button></div>`:''}</div>
 <h3>Labs</h3><div class="grid">${META.filter(a=>a.id!=='halcyon').map(a=>`<button class="tile" data-act="open" data-id="${a.id}"><span class="ic">${a.icon}</span>${subj(a.id)}<b>${esc(a.name)}</b><small>${esc(a.tag)}</small><span class="st">${labLines(a.id).map(esc).join('<br>')}</span></button>`).join('')}</div>
 <h3>Play and collect</h3><div class="grid">
 <button class="tile" data-act="go" data-id="arcade"><span class="ic">🕹</span><b>Arcade</b><span class="d">Timed games for fun, with a high-score table.</span></button>
 <button class="tile" data-act="go" data-id="notebook"><span class="ic">📓</span><b>Mistakes notebook</b><span class="d">${due?`${due} question${due>1?'s':''} waiting for review.`:'Wrong answers from games land here for practice.'}</span></button>
 <button class="tile" data-act="go" data-id="shop"><span class="ic">🎁</span><b>Shop &amp; Rewards</b><span class="d">Crates, collection, level road, themes and settings. 🪙 ${Math.floor(M.coins)}</span></button></div>
 ${earned.length?`<h3>Badges</h3><div class="chips">${earned.map(b=>`<span class="chip2" title="${esc(b[3])}">${b[1]} ${esc(b[2])}</span>`).join('')}</div>`:''}
 <p class="foot">MP PRODUCTIONS TEACHING · five interactive study labs in one place</p></div>`}
/* ---------- arcade hub + games engine ---------- */
const lbHTML=(b,hi)=>{const l=M.scores[b]||[],lab=/endless/.test(b)?'RND':'HIT';let rows='';
 for(let k=0;k<10;k++){const x=l[k];rows+=`<tr class="${k<3?'r'+(k+1):''} ${hi===k?'me':''}"><td>${String(k+1).padStart(2,'0')}.</td><td>${x?esc(x.n)+((x.f||M.set.flair)?`<span class="flair">${esc(x.f||M.set.flair)}</span>`:''):'---'}</td><td>${x?String(x.s).padStart(5,'0'):'-----'}</td><td>${x?x.r:'--'}</td><td>${x?x.d:'--------'}</td></tr>`}
 return `<h3>★ HIGH SCORES · ${esc((BOARDS.find(x=>x[0]===b)||[0,b])[1].toUpperCase())} ★</h3><table><tr><th>RK</th><th>NAME</th><th>SCORE</th><th>${lab}</th><th>DATE</th></tr>${rows}</table>`};
function renderArcade(){
 if(G2&&G2.live)return arcPaint();
 home.innerHTML=`<div class="wrap"><h1>🕹 Arcade</h1><p class="sub">Timed games for fun. They give only a little Study Points (at most ${GCAP} a day) so use them as a break. Wrong answers go to your Notebook.</p>
 <div class="grid">${ARC.map(g=>`<div class="tile"><span class="ic">${g.icon}</span><b>${g.name}</b><small>${g.labName}</small><span class="d">${g.desc}</span><span class="st">Best ${bestOf(g.id+'-classic')} · ♾️ ${bestOf(g.id+'-endless')}</span><span class="row"><button class="pri" data-act="play" data-g="${g.id}" data-m="classic">10 rounds</button><button data-act="play" data-g="${g.id}" data-m="endless">♾️ Endless</button></span></div>`).join('')}</div>
 <h3>Games inside the labs</h3><div class="grid">${NATIVE.map((g,i)=>`<div class="tile"><span class="ic">${g.icon}</span><b>${g.name}</b><span class="d">${g.desc}</span><span class="row"><button data-act="native" data-i="${i}">Open</button></span></div>`).join('')}</div>
 <h3>Hall of fame</h3><select id="hofSel">${BOARDS.map(b=>`<option value="${b[0]}" ${b[0]===hofBoard?'selected':''}>${b[1]}</option>`).join('')}</select>
 <div class="arc" id="hof">${lbHTML(hofBoard)}<div class="hint">Scores are saved in this browser only.</div></div></div>`}
function arcStart(gid,mode){const g=ARC.find(x=>x.id===gid);G2={g,mode,rnd:mulberry(Math.floor(Math.random()*1e9)),i:0,lives:3,score:0,streak:0,ok:0,live:true,used:new Set(),gone:[],shield:false};arcNext()}
const arcSecs=()=>G2.mode==='endless'?Math.max(6,Math.round(25*Math.pow(.93,G2.i))):25;
function arcNext(){if((G2.mode!=='endless'&&G2.i>=10)||G2.lives<=0)return arcFinish();
 G2.q=G2.g.gen(G2.rnd,G2.i);G2.secs=arcSecs();G2.ticks=G2.secs*4;G2.left=G2.ticks;G2.done=false;G2.t50=G2.t25=G2.t10=0;G2.gone=[];G2.fifty=0;arcPaint();
 clearInterval(g2T);g2T=setInterval(arcTick,250);if(hwOn)blitzEvt({type:'q',lives:G2.lives,endless:G2.mode==='endless',round:G2.i+1,streak:G2.streak})}
function arcTick(){if(!G2||G2.done||cur!=='arcade'||document.hidden)return;G2.left--;const b=$('arBar');if(b)b.style.width=(G2.left/G2.ticks*100)+'%';
 const f=G2.left/G2.ticks;if(hwOn){[['t50',.5],['t25',.25],['t10',.1]].forEach(([k,v])=>{if(f<v&&!G2[k]){G2[k]=1;blitzEvt({type:'t',frac:f})}})}
 if(G2.left<=0)arcAnswer(-1)}
const hudHTML=()=>`<div class="hud"><div>Round <b>${G2.i+1}${G2.mode==='endless'?'':'/10'}</b></div>${G2.mode==='endless'?`<div>Time <b>${G2.secs}s</b></div>`:''}<div>Lives <b>${'♥'.repeat(G2.lives)+'♡'.repeat(Math.max(0,3-G2.lives))}${G2.shield?' 🛡':''}</b></div><div>Score <b>${G2.score}</b></div><div>Streak <b>${G2.streak}</b></div></div>`;
function arcPaint(){const q=G2.q;home.innerHTML=`<div class="wrap narrow"><div class="top2">${hudHTML()}<button data-act="quit">Quit</button></div><div class="bar"><i id="arBar" style="width:${G2.left/G2.ticks*100}%"></i></div>
 <div class="mut" style="font-size:12px">${G2.g.icon} ${G2.g.name} · ${G2.mode==='endless'?'Endless':'10 rounds'}</div><div class="qq">${esc(q.q)}</div>
<div class="pus">${[['fifty','✂️','pu5050','50/50'],['time','⏱','putime','+10 s'],['life','❤️','pulife','+1 life'],['skip','⏭','puskip','Skip'],['shield','🛡','pushield','Shield']].map(([k,i,id,n])=>`<button data-act="pu" data-k="${k}" title="${n}" ${(M.inv.qty[id]||0)>0?'':'disabled'}>${i} ${M.inv.qty[id]||0}</button>`).join('')}<span class="mut" style="font-size:12px">power-ups (Shop)</span></div>
 <div class="opts">${q.ch.map((c,k)=>`<button data-act="pick" data-k="${k}" class="${G2.gone.includes(k)?'gone':''}" ${G2.gone.includes(k)?'disabled':''}>${esc(c)}</button>`).join('')}</div><div id="arFb"></div></div>`}
function puUse(k){if(!G2||G2.done||!G2.live)return;const id={fifty:'pu5050',time:'putime',life:'pulife',skip:'puskip',shield:'pushield'}[k];if((M.inv.qty[id]||0)<=0)return;
 if(k==='fifty'){if(G2.fifty)return;const w=G2.q.ch.map((_,i)=>i).filter(i=>i!==G2.q.ans&&!G2.gone.includes(i));if(w.length<2)return;shuf(Math.random,w).slice(0,2).forEach(i=>G2.gone.push(i));G2.fifty=1}
 else if(k==='time'){G2.ticks+=40;G2.left+=40;G2.secs+=10}else if(k==='life'){if(G2.lives>=5)return;G2.lives++}
 else if(k==='shield'){if(G2.shield)return;G2.shield=true}
 else if(k==='skip'){M.inv.qty[id]--;mDirty=true;clearInterval(g2T);G2.i++;arcNext();return}
 M.inv.qty[id]--;mDirty=true;const left=G2.left;arcPaint();G2.left=left;clearInterval(g2T);g2T=setInterval(arcTick,250)}
function arcAnswer(k){if(!G2||G2.done)return;G2.done=true;clearInterval(g2T);const q=G2.q,ok=k===q.ans;let gain=0;
 let shielded=false;
 if(ok){G2.streak++;G2.ok++;gain=10+Math.min(G2.streak-1,5)*2+Math.ceil(G2.left/G2.ticks*10)+(G2.mode==='endless'?Math.floor(G2.i/5)*2:0);G2.score+=gain}else if(G2.shield){G2.shield=false;shielded=true}else{G2.streak=0;G2.lives--}
 MPT.answer({ok,lab:G2.g.labName,game:G2.g.name,q:q.q,choices:q.ch,ans:q.ans,picked:k,why:q.why});
 if(hwOn)blitzEvt({type:ok?'correct':(k<0?'timeout':'wrong'),lives:G2.lives,streak:G2.streak});
 home.querySelectorAll('.opts button').forEach((b,i)=>{b.disabled=true;if(i===q.ans)b.classList.add('ok');else if(i===k)b.classList.add('no')});
 const h=home.querySelector('.hud');if(h)h.outerHTML=hudHTML();
 $('arFb').innerHTML=`<p class="${ok?'good':'badc'}" style="font-weight:700">${ok?`✓ Correct! +${gain}`:(k<0?'⏰ Time is up. Saved to your Notebook.':'✗ Not quite. Saved to your Notebook.')}${shielded?' 🛡 Your shield absorbed it.':''}</p><div class="tip">${esc(q.why)}</div><div class="row"><button class="pri" data-act="next">${((G2.mode!=='endless'&&G2.i+1>=10)||G2.lives<=0)?'See results':'Next ▶'}</button></div>`}
function arcQuit(silent){clearInterval(g2T);if(G2&&hwOn)dreadStop();G2=null;if(!silent&&cur==='arcade')renderArcade()}
function askInit(box,rank,cb){let L=((M.set.ini||'AAA')+'AAA').slice(0,3).split(''),c=0;const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 const draw=()=>{box.innerHTML=`<div class="arc"><h3>★ NEW HIGH SCORE · RANK #${rank+1} ★</h3><div>ENTER YOUR INITIALS</div><div>${L.map((x,i)=>`<div class="ini ${i===c?'cur':''}"><button data-i="${i}" data-d="1">▲</button><span data-i="${i}">${x}</span><button data-i="${i}" data-d="-1">▼</button></div>`).join('')}</div><div class="row" style="justify-content:center"><button class="pri" id="iniOk">OK</button></div><div class="hint">Tap ▲▼ or type letters · Enter to confirm</div></div>`;
  box.querySelectorAll('.ini button').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;c=i;L[i]=A[(A.indexOf(L[i])+ +b.dataset.d+A.length)%A.length];draw()});
  box.querySelectorAll('.ini span').forEach(s=>s.onclick=()=>{c=+s.dataset.i;draw()});$('iniOk').onclick=ok};
 const key=e=>{const k=e.key;if(/^[a-z0-9]$/i.test(k)){L[c]=k.toUpperCase();c=Math.min(2,c+1);draw()}else if(k==='Backspace'||k==='ArrowLeft'){c=Math.max(0,c-1);draw()}else if(k==='ArrowRight'){c=Math.min(2,c+1);draw()}
  else if(k==='ArrowUp'||k==='ArrowDown'){L[c]=A[(A.indexOf(L[c])+(k==='ArrowUp'?1:-1)+A.length)%A.length];draw()}else if(k==='Enter')ok();else return;e.preventDefault()};
 function ok(){document.removeEventListener('keydown',key);cb(L.join(''))}document.addEventListener('keydown',key);draw()}
function arcFinish(){dcInc('games');clearInterval(g2T);const g=G2.g,mode=G2.mode,board=g.id+'-'+(mode==='endless'?'endless':'classic'),sc=G2.score,won=mode!=='endless'&&G2.lives>0,rounds=G2.i;
 const prev=bestOf(board),isBest=sc>prev&&sc>0;MPT.done({game:g.id,best:isBest});if(hwOn){blitzEvt({type:G2.lives<=0?'over':'done'})}
 if(perkOK('confetti')&&(won||isBest)&&M.set.confetti)confetti();
 const rate=mode==='endless'?(rounds>=25?'🏆 Legend':rounds>=15?'🥇 Clock crusher':rounds>=8?'🥈 Fast hands':'🥉 Warming up'):G2.ok>=10?'🏆 Perfect':G2.ok>=8?'🥇 Sharp':G2.ok>=5?'🥈 Getting there':'🥉 Keep practising';
 const info={g,mode,sc,ok:G2.ok,rounds};G2=null;
 home.innerHTML=`<div class="wrap narrow"><div class="big">${won?'Round complete!':mode==='endless'?`Game over · ${rounds} round${rounds===1?'':'s'} survived`:'Out of lives'}</div><p>${rate}</p>
 <div class="stats"><div>Score <b>${sc}</b></div><div>Correct <b>${info.ok}/${mode==='endless'?rounds:Math.min(rounds,10)}</b></div><div>Best <b>${Math.max(prev,sc)}</b></div></div>${isBest?'<p class="good">New personal best!</p>':''}<div id="arLb"></div>
 <div class="row"><button class="pri" data-act="play" data-g="${g.id}" data-m="${mode}">Play again</button><button data-act="arcade">Arcade</button><button data-act="go" data-id="notebook">Notebook</button></div></div>`;
 const box=$('arLb');if(qualifies(board,sc)){askInit(box,rankOf(board,sc),name=>{M.set.ini=name;const at=addScore(board,name,sc,mode==='endless'?rounds:info.ok);mSave();box.innerHTML=`<div class="arc">${lbHTML(board,at)}</div>`})}
 else if((M.scores[board]||[]).length)box.innerHTML=`<div class="arc">${lbHTML(board)}</div>`;mDirty=true}
