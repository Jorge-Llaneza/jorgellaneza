/* ======= FANDOM THEMES WITH THEIR OWN MECHANICS (part A) ======= */
(function(){
 const X=window.SFX,PAN=X.PAN,tick=X.tick,SM=X.SM,modal=X.modal,esc=X.esc2,D=X.D;
 const ST=(id,def)=>{M.fx=M.fx||{};const o=M.fx[id]=M.fx[id]||{};for(const k in def)if(o[k]==null)o[k]=JSON.parse(JSON.stringify(def[k]));return o};
 const rnd=n=>Math.floor(Math.random()*n),pick=a=>a[rnd(a.length)];
 const pay=(c,t)=>{M.coins=Math.max(0,M.coins+c);X.sv();try{paintChip();if(t)toast(t)}catch(e){}};
 const bar=(v,m,c)=>`<div class="sfbar ${c||''}"><i style="width:${Math.max(0,Math.min(100,v/m*100))}%"></i></div>`;
 const run=id=>X.act(id)&&!document.hidden&&!(()=>{try{return fcActive()||!!document.getElementById('fclock')}catch(e){return false}})();
 const onSP=(id,f)=>window.sfSP.push(d=>{if(X.own(id))f(d)});
 const sfx=(f,t,v,g)=>{try{jxSnd(f,t,v,g)}catch(e){}};
 const splash=(a,b,c,e)=>{try{jxSplash(a,b,c,e)}catch(er){}};
 const rf=()=>X.draw(true);
 const btn=(a,l,extra,dis)=>`<button data-sf="${a}" ${extra||''} ${dis?'disabled':''}>${l}</button>`;
 window.sfLib={ST,rnd,pick,pay,bar,run,onSP,sfx,splash,rf,btn};
 const now=()=>Date.now();

 /* ---- Mourning March: a parade that grows ---- */
 {const id='mourn',IN=['🥁','🎺','🎸','🎹','🎻','🎷','📯','🪗'];const S=()=>ST(id,{m:0,enc:0,rd:0});
  onSP(id,d=>{const s=S(),b=Math.floor(s.m/100);s.m+=d;if(Math.floor(s.m/100)>b){s.enc++;pay(40,'🖤 Encore! The parade passes 100 marchers: +40 🪙');splash('ENCORE!','+40 coins','#ffffff','🖤')}});
  PAN[id]={ico:'🖤',title:'The Parade',hud:()=>`🖤 PARADE · <b>${S().m}</b> marchers · ${Math.min(8,Math.floor(S().m/15))} instruments`,mini:()=>`🖤 ${S().m} marchers`,
   body:()=>{const s=S(),n=Math.min(8,Math.floor(s.m/15)),row=Array.from({length:Math.min(26,Math.max(1,s.m))},(_,i)=>i%3===0&&n?IN[(i/3|0)%n]:'🕴️').join('');
    return `<p class="sfp">Every Study Point adds a marcher. New instruments join as the parade grows, and every 100 marchers is an encore.</p><div class="mrch"><div>${row}</div></div><p class="sfp">Marchers <b>${s.m}</b> · Encores <b>${s.enc}</b></p><div class="sfrow">${IN.map((x,i)=>`<span class="${i<n?'':'dim'}">${x}</span>`).join('')}</div><p class="sfp">${n<8?`Next instrument at <b>${(n+1)*15}</b> marchers.`:'Full orchestra!'}</p>${btn('rh','🎼 Rehearse (+3, once a day)','',s.rd===D())}`},
   act:a=>{const s=S();if(a==='rh'&&s.rd!==D()){s.rd=D();s.m+=3}}}}

 /* ---- Synchro Core: sync ratio and angel alerts ---- */
 {const id='synchro',S=()=>ST(id,{sync:50,ang:null,next:0,kills:0,lost:0});
  onSP(id,d=>{const s=S();s.sync=Math.min(100,s.sync+d*1.5);if(s.sync>=90)M.coins+=Math.floor(d/2);if(s.ang){s.ang.got+=d;if(s.ang.got>=s.ang.need){s.kills++;s.ang=null;s.sync=Math.min(100,s.sync+20);s.next=now()+(8+rnd(8))*60000;pay(40,'🔺 Angel neutralised! +40 🪙');splash('PATTERN BLUE','Angel defeated +80 coins','#ff8a00','🔺')}}});
  tick.push(()=>{if(!run(id))return;const s=S();s.sync=Math.max(0,s.sync-.05);if(!s.next)s.next=now()+4*60000;
   if(!s.ang&&now()>s.next){s.ang={need:15,got:0,end:now()+5*60000};sfx([440,330,440,330],'sawtooth',.06,.15);try{toast('🔺 ANGEL ALERT! Earn 15 SP in 5 minutes!');jxVib([100,50,100])}catch(e){}}
   else if(s.ang&&now()>s.ang.end){s.ang=null;s.lost++;s.sync=Math.max(0,s.sync-25);s.next=now()+(8+rnd(8))*60000;pay(-20,'🔺 The angel got through. Sync −25, −20 🪙')}});
  PAN[id]={ico:'🔺',title:'Synchro Core',hud:()=>`🔺 SYNC <b>${Math.round(S().sync)}%</b>${S().ang?' · <b>ANGEL!</b>':''}${S().sync>=90?' · BURST':''}`,mini:()=>`🔺 ${Math.round(S().sync)}%${S().ang?' ⚠️':''}`,
   body:()=>{const s=S(),a=s.ang;return `<p class="sfp">Study to keep your sync ratio up. It slowly drops while you idle. Above 90% you get Sync Burst: bonus coins on every SP. Angels attack now and then.</p>${bar(s.sync,100,s.sync<30?'bad':'')}<p class="sfp">Sync <b>${Math.round(s.sync)}%</b>${s.sync>=90?' · 🔥 SYNC BURST':''}</p>${a?`<div class="sfalert"><b>⚠️ ANGEL ALERT</b><br>Earn <b>${a.need-a.got}</b> more SP in <b>${Math.max(0,Math.ceil((a.end-now())/1000))}s</b>${bar(a.got,a.need)}</div>`:`<p class="sfp">Next angel: ${s.next?'in about '+Math.max(1,Math.ceil((s.next-now())/60000))+' min':'soon'}</p>`}<p class="sfp">Angels defeated <b>${s.kills}</b> · escaped ${s.lost}</p>`}}}

 /* ---- Beyond The Wall: walls and titans ---- */
 {const id='wall',S=()=>ST(id,{w:[100,100,100],next:0,hold:0,fall:0,hit:null});const NM=['Outer Wall','Middle Wall','Inner Wall'];
  onSP(id,d=>{const s=S();let i=s.w.indexOf(Math.min(...s.w));s.w[i]=Math.min(100,s.w[i]+d*3)});
  tick.push(()=>{if(!run(id))return;const s=S();if(!s.next)s.next=now()+6*60000;
   if(now()>s.next){const i=s.w.findIndex(x=>x>0),dmg=25+rnd(25);s.next=now()+(7+rnd(8))*60000;if(i<0)return;if(s.w[i]>=80){s.hold++;pay(15,'🧱 Titan repelled at the '+NM[i]+'! +15 🪙')}else{s.w[i]=Math.max(0,s.w[i]-dmg);sfx([110,90],'sawtooth',.07,.2);try{toast('👹 A titan hit the '+NM[i]+'! −'+dmg+' HP')}catch(e){}if(s.w[i]<=0){s.fall++;pay(-50,'💥 The '+NM[i]+' fell! −50 🪙. Rebuilding.');s.w=s.w.map((x,j)=>j===i?35:x)}}}});
  PAN[id]={ico:'🧱',title:'The Walls',hud:()=>`🧱 WALLS · ${S().w.map(x=>Math.round(x)).join(' / ')} · titans held ${S().hold}`,mini:()=>`🧱 ${S().w.map(x=>Math.round(x)).join('/')}`,
   body:()=>{const s=S(),warn=s.next&&s.next-now()<90000;return `<p class="sfp">Titans attack the walls every few minutes. Every SP repairs your weakest wall. A wall above 80 HP repels the attack.</p>${s.w.map((h,i)=>`<small>${NM[i]} ${Math.round(h)}/100</small>${bar(h,100,h<35?'bad':'')}`).join('')}<p class="sfp">${warn?'⚠️ <b>Titan sighted! Study now to repair.</b>':'Watchtower: all quiet.'}</p><p class="sfp">Repelled <b>${s.hold}</b> · Walls lost ${s.fall}</p>`}}}

 /* ---- Steel Run: stand arrows ---- */
 {const id='steelrun',S=()=>ST(id,{ar:0,pr:0,st:[],bd:0});const A=['Crimson','Neon','Velvet','Iron','Lunar','Solar','Dusty','Electric','Silent','Golden'],B=['Echo','Rush','Drive','Mirage','Pulse','Riot','Waltz','Fever','Parade','Hymn'],RK=['E','D','C','B','A'];
  onSP(id,d=>{const s=S();s.pr+=d;while(s.pr>=20){s.pr-=20;s.ar++}});
  const sc=x=>x.s.reduce((a,b)=>a+b,0);
  PAN[id]={ico:'🏹',title:'Stand Arrows',hud:()=>`🏹 ARROWS <b>${S().ar}</b> · ${S().st.length} stands`,mini:()=>`🏹 ${S().ar} · ${S().st.length} stands`,
   body:()=>{const s=S(),top=s.st.slice().sort((a,b)=>sc(b)-sc(a)).slice(0,5);return `<p class="sfp">Every 20 SP gives an arrow. An arrow awakens a random Stand with its own stats.</p>${bar(s.pr,20)}<p class="sfp">Arrows <b>${s.ar}</b> · Stands <b>${s.st.length}</b></p>${btn('ar','🏹 Use an arrow','',s.ar<1)}${btn('bt','🥊 Stand battle (once a day)','',s.bd===D()||!s.st.length)}${top.map(x=>`<p class="sfp">${x.e} <b>${esc(x.n)}</b> <small>${['PWR','SPD','RNG','DUR','PRC'].map((k,i)=>k+' '+RK[x.s[i]]).join(' ')}</small></p>`).join('')}`},
   act:a=>{const s=S();if(a==='ar'&&s.ar>0){s.ar--;const st=[0,0,0,0,0].map(()=>Math.min(4,Math.floor(Math.pow(Math.random(),1.4)*5))),x={n:pick(A)+' '+pick(B),e:pick(['👤','🌀','🎭','🔥','⚡','🌙','💎','🕷️']),s:st};s.st.push(x);splash('STAND AWAKENED',x.n,'#ffd166',x.e);sfx([392,523,659,784],'triangle',.06,.09)}
    else if(a==='bt'&&s.st.length&&s.bd!==D()){s.bd=D();const me=Math.max(...s.st.map(sc))+rnd(5),en=8+rnd(12);if(me>=en){pay(30,'🥊 Your Stand won! +30 🪙')}else toast('🥊 Your Stand lost this time. Collect stronger ones.')}}}}

 /* ---- Black Ledger: tasks with deadlines ---- */
 {const id='ledger',S=()=>ST(id,{t:[],done:0,late:0});
  tick.push(()=>{if(!X.own(id))return;const s=S();s.t.forEach(t=>{if(!t.f&&now()>t.d){t.f=2;s.late++;pay(-5,'📓 Overdue: "'+t.n.slice(0,24)+'" −5 🪙')}});s.t=s.t.filter(t=>!(t.f&&now()-(t.d)>864e5*2)).slice(-40)});
  SM.lgadd=()=>{const n=document.getElementById('lgn').value.trim().slice(0,60),m=+document.getElementById('lgm').value;if(!n)return;S().t.push({id:now().toString(36),n,d:now()+m*60000,f:0,s0:M.sp});X.sv();X.closeM();rf()};
  PAN[id]={ico:'📓',title:'Black Ledger',hud:()=>`📓 LEDGER · <b>${S().t.filter(t=>!t.f).length}</b> open · ${S().done} done`,mini:()=>`📓 ${S().t.filter(t=>!t.f).length} open`,
   body:()=>{const s=S(),o=s.t.filter(t=>!t.f).sort((a,b)=>a.d-b.d);return `<p class="sfp">Write a task and how long you have. Finish it in time for coins. Miss the deadline and it costs you.</p>${o.slice(0,5).map(t=>`<p class="sfp">${btn('ok','✔','data-id="'+t.id+'"')} ${esc(t.n)} <small>${Math.max(0,Math.ceil((t.d-now())/60000))} min</small></p>`).join('')||'<p class="sfp"><small>No open tasks.</small></p>'}${btn('new','✍️ Write a task')}<p class="sfp">Done <b>${s.done}</b> · Overdue ${s.late}</p>`},
   act:(a,t)=>{const s=S();if(a==='new'){modal(`<h2>📓 New task</h2><input id="lgn" maxlength="60" placeholder="What must be done?" style="width:100%;padding:8px" aria-label="Task"><label class="labc"><span>Time allowed</span><select id="lgm"><option value="10">10 minutes</option><option value="30" selected>30 minutes</option><option value="60">1 hour</option><option value="180">3 hours</option><option value="720">12 hours</option></select></label><div class="wgb"><button class="pri" data-sm="lgadd">Write it</button></div>`);setTimeout(()=>{const e=document.getElementById('lgn');e&&e.focus()},50)}
    else if(a==='ok'){const k=s.t.find(x=>x.id===t.dataset.id);if(k&&!k.f){if(M.sp-(k.s0||0)<5){toast('📓 Study at least 5 SP after writing a task before you can finish it.');return}k.f=1;s.done++;pay(6,'📓 Done! +6 🪙')}}}}}

 /* ---- Night Shift: power, doors and threats ---- */
 {const id='nightshift',S=()=>ST(id,{n:1,on:0,el:0,pw:100,l:0,r:0,th:null,nt:0,best:0,w:0});const END=360;
  onSP(id,d=>{const s=S();s.pw=Math.min(100,s.pw+d*6)});
  function fail(s,why){s.on=0;s.th=null;s.l=s.r=0;pay(-20,why+' −20 🪙');sfx([80,60,40],'sawtooth',.08,.2);try{jxFlash('#ff0000',true);jxVib([200,60,200])}catch(e){}}
  tick.push(()=>{if(!run(id))return;const s=S();if(!s.on)return;s.el++;s.pw-=.12+(s.l?.45:0)+(s.r?.45:0);
   if(s.pw<=0){s.pw=0;fail(s,'⚡ Power out! They got in.');return}
   if(s.th){s.th.t--;if((s.th.side==='l'&&s.l)||(s.th.side==='r'&&s.r)){s.th=null;s.nt=s.el+15+rnd(15);sfx([300],'square',.04,.05)}else if(s.th.t<=0){fail(s,'😱 Jump scare!');return}}
   else if(s.el>=s.nt){s.th={side:rnd(2)?'l':'r',t:8};sfx([220,180],'square',.05,.1)}
   if(s.el>=END){s.on=0;s.w++;const r=40+s.n*10;s.best=Math.max(s.best,s.n);pay(r,'🕕 6 AM! Night '+s.n+' survived: +'+r+' 🪙');splash('6 AM','Night '+s.n+' survived','#ffd166','🕕');s.n++}});
  const hr=s=>{const h=Math.floor(s.el/60);return h===0?'12 AM':h+' AM'};
  PAN[id]={ico:'📹',title:'Night Shift',hud:()=>{const s=S();return `📹 NIGHT ${s.n} · ${s.on?hr(s)+' · ⚡ '+Math.round(s.pw)+'%':'off duty'}`},mini:()=>{const s=S();return `📹 ${s.on?hr(s)+' ⚡'+Math.round(s.pw):'Night '+s.n}${s.th?' ⚠️':''}`},
   body:()=>{const s=S();if(!s.on)return `<p class="sfp">Survive until 6 AM (6 real minutes). Something approaches the left or right door. Shut the door in time. Doors drain power, and studying recharges it.</p><p class="sfp">Night <b>${s.n}</b> · Nights survived ${s.w}</p>${btn('go','🕛 Clock in (Night '+s.n+')')}`;
    return `<p class="sfp"><b>${hr(s)}</b> ⚡ <b>${Math.round(s.pw)}%</b> (study to recharge)</p>${bar(s.pw,100,s.pw<25?'bad':'')}${s.th?`<div class="sfalert">⚠️ Movement at the <b>${s.th.side==='l'?'LEFT':'RIGHT'}</b> door! ${s.th.t}s</div>`:'<p class="sfp"><small>Quiet… for now.</small></p>'}<div class="sfrow">${btn('dl',s.l?'🚪 LEFT: CLOSED':'🚪 Left: open')}${btn('dr',s.r?'🚪 RIGHT: CLOSED':'🚪 Right: open')}</div>`},
   act:a=>{const s=S();if(a==='go'){Object.assign(s,{on:1,el:0,pw:Math.max(60,s.pw),l:0,r:0,th:null,nt:12})}else if(a==='dl')s.l=s.l?0:1;else if(a==='dr')s.r=s.r?0:1}}}

 /* ---- Vibe Coder: idle coding agents ---- */
 {const id='vibe',S=()=>ST(id,{loc:0,tot:0,ag:[0,0,0],sh:0,bug:0});const AG=[['Intern bot',50,1],['Copilot',300,6],['Agent swarm',2000,40]],PR=[500,3000,12000,50000,200000];
  const rate=s=>s.ag.reduce((a,n,i)=>a+n*AG[i][2],0);
  const add=(s,n)=>{s.loc+=n;s.tot+=n;while(s.sh<PR.length&&s.tot>=PR[s.sh]){s.sh++;pay(40*s.sh,'🚀 Project shipped! +'+40*s.sh+' 🪙');splash('SHIPPED','Project #'+s.sh,'#7dff9b','🚀')}};
  onSP(id,d=>add(S(),d*25));
  tick.push(()=>{if(!run(id))return;const s=S();add(s,rate(s));if(!s.bug&&Math.random()<1/240)s.bug=now()+30000;else if(s.bug&&now()>s.bug){s.bug=0;const l=Math.floor(s.loc*.1);s.loc-=l;try{toast('🐛 A bug reached production: −'+l+' LOC')}catch(e){}}});
  PAN[id]={ico:'🎧',title:'Vibe Coder',hud:()=>`🎧 VIBES · <b>${Math.floor(S().loc)}</b> LOC · ${rate(S())}/s · ${S().sh} shipped`,mini:()=>`🎧 ${Math.floor(S().loc)} LOC${S().bug?' 🐛':''}`,
   body:()=>{const s=S();return `<p class="sfp">Studying writes code. Hire AI agents to write more while you work. Ship projects at big milestones. Squash bugs fast.</p><p class="sfp"><b>${Math.floor(s.loc)}</b> LOC · <b>${rate(s)}</b>/s${s.sh<PR.length?' · next ship at '+PR[s.sh]:''}</p>${s.bug?`<div class="sfalert">🐛 BUG in production! ${btn('sq','Squash it')}</div>`:''}${AG.map((a,i)=>`<div>${btn('by','Hire '+a[0]+' ('+Math.floor(a[1]*Math.pow(1.15,s.ag[i]))+' LOC) · '+s.ag[i],'data-i="'+i+'"',s.loc<Math.floor(a[1]*Math.pow(1.15,s.ag[i])))}</div>`).join('')}`},
   act:(a,t)=>{const s=S();if(a==='sq')s.bug=0;else if(a==='by'){const i=+t.dataset.i,c=Math.floor(AG[i][1]*Math.pow(1.15,s.ag[i]));if(s.loc>=c){s.loc-=c;s.ag[i]++}}}}}

 /* ---- Basement Tape: record mixtapes ---- */
 {const id='basement',S=()=>ST(id,{min:0,tp:[]});const W1=['Static','Basement','Cheap','Loud','Midnight','Rusty','Paper','Cassette','Garage','Feedback'],W2=['Heart','Hymn','Riot','Summer','Highway','Ghost','Anthem','Thunder','Letters','Echo'];
  const song=()=>pick(W1)+' '+pick(W2);
  onSP(id,d=>{const s=S();s.min+=d;while(s.min>=60){s.min-=60;const t={n:'Tape #'+(s.tp.length+1),t:Array.from({length:6},song)};s.tp.push(t);pay(25,'📼 Tape recorded! +25 🪙');splash('TAPE FULL',t.n,'#ff5ea8','📼')}});
  PAN[id]={ico:'📼',title:'Mixtape Studio',hud:()=>`📼 TAPE · <b>${Math.floor(S().min)}/60</b> min · ${S().tp.length} tapes`,mini:()=>`📼 ${Math.floor(S().min)}/60`,
   body:()=>{const s=S(),l=s.tp[s.tp.length-1];return `<p class="sfp">1 SP records 1 minute. A full 60 minute tape gets a random tracklist.</p>${bar(s.min,60)}<p class="sfp">Recording <b>${Math.floor(s.min)}/60</b> min · Tapes <b>${s.tp.length}</b></p>${l?`<p class="sfp"><b>${l.n}</b><br><small>${l.t.map((x,i)=>(i+1)+'. '+x).join('<br>')}</small></p>`:''}`}}}
})();

