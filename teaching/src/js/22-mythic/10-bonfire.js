/* ======= MYTHIC: Souls-like · Bonfire. Runes, stats, boss fights, falling and recovering, New Game+ ======= */
(function(){
 const X=window.SFX,PAN=X.PAN,tick=X.tick,esc=X.esc2;
 const {ST,pick,pay,bar,onSP,splash}=window.sfLib;const K=window.MYK;const now=()=>Date.now();
 const id='bonfire',S=()=>ST(id,{rn:0,v:1,s:1,m:1,fl:3,hp:100,boss:null,beat:[],ng:0,deaths:0,stain:0,acc:0,rests:0,lore:{}});
 const BOSS=[['Ashen Warden','🗡️',20,25,['Ash drifts through the ruined gate.','A knight who never learned the war had ended turns to face you.','"Prepare your notes," it rasps.']],['Hollow Regent','👑',30,35,['A throne of cracked slate, a crown of chalk dust.','The Regent rules the Forgotten Syllabus.','It has not been marked in a hundred years.']],['Twin Gargoyles','🗿',45,45,['Stone wings unfold from the library roof.','They quarrel in whispers: one asks, one answers, both are wrong.']],['Mourning Hag','🧙',60,55,['Candles gutter. A lullaby of unanswered emails.','The Hag collects every deadline you ever missed.']],['Crystal Sentinel','💎',80,70,['It does not move. It does not blink.','It only reflects every shortcut you ever tried.']],['The First Flame','🔥',110,90,['The last fire, and the first. It is warm.','"Everything you learned was kindling," it says, kindly.','"Show me it burns."']]];
 const lvl=s=>s.v+s.s+s.m-2,cost=L=>Math.round(30*Math.pow(1.2,L)),maxHp=s=>100+10*(s.v-1),flMax=s=>3+Math.floor((s.v-1)/3),dmg=s=>1+.08*(s.s-1),tmx=s=>1+.1*(s.m-1);
 const need=(s,i)=>Math.ceil(BOSS[i][2]*(1+.25*s.ng)),mins=(s,i)=>Math.round(BOSS[i][3]*tmx(s));
 const open=(s,i)=>i===0||s.beat.includes(i-1);
 const fall=s=>{s.deaths++;s.stain=s.rn;s.rn=0;s.hp=maxHp(s);s.fl=flMax(s);s.boss=null;K.banner('YOU FELL','Your runes lie where you fell. Earn 10 SP to recover them','#d1432b',3200)};
 onSP(id,d=>{const s=S();s.rn+=Math.round(d*2*(1+.1*s.ng));
  if(s.stain>0){s.acc+=d;if(s.acc>=10){s.rn+=s.stain;splash('RUNES RECOVERED','+'+s.stain+' runes','#ff8a2b','🔥');s.stain=0;s.acc=0}}
  const b=s.boss;if(!b)return;b.got+=d*dmg(s);b.lt=now();
  if(b.got>=b.need){const i=b.i,rw=Math.round(300*Math.pow(i+1,1.2)*(1+.5*s.ng));s.rn+=rw;s.hp=maxHp(s);s.fl=flMax(s);if(!s.beat.includes(i))s.beat.push(i);s.boss=null;pay(40+i*20,'🔥 '+BOSS[i][0]+' felled');
   K.banner('FOE FELLED',BOSS[i][0]+' · +'+rw+' runes','#ffd27a',3000);
   if(!s.lore['d'+i]){s.lore['d'+i]=1;setTimeout(()=>K.story(BOSS[i][0],i===5?['The fire dims, and something in you brightens.','You have studied well, traveller.','Kindle the bonfire again, and see how far the road goes.']:['The foe crumbles.','Somewhere ahead, another gate opens.'],null,'#ff8a2b'),3200)}}});
 tick.push(()=>{if(!X.act(id))return;const s=S(),b=s.boss;document.documentElement.dataset.bfhp=b?'1':'';if(!b)return;
  if(now()-b.lt>4*60000){b.lt=now();const h=14+b.i*4;s.hp-=h;try{toast('🔥 '+BOSS[b.i][0]+' strikes: −'+h+' health')}catch(e){}if(s.hp<=0)fall(s)}
  else if(now()>b.end){s.boss=null;try{toast('🔥 The fire fades. '+BOSS[b.i][0]+' withdrew. Try again.')}catch(e){}}});
 PAN[id]={ico:'🔥',title:'Bonfire',hud:()=>{const s=S();return `🔥 ${s.rn} runes · Lv ${lvl(s)} · ❤️ ${s.hp}/${maxHp(s)}${s.ng?' · NG+'+s.ng:''}${s.boss?' · <b>'+BOSS[s.boss.i][0].toUpperCase()+'</b>':''}`},mini:()=>{const s=S();return `🔥 ${s.rn} ❤️${s.hp}${s.boss?' ⚔️':''}`},
  body:()=>{const s=S(),L=lvl(s),c=cost(L),b=s.boss;let h=`<p class="sfp"><b>${s.rn}</b> runes · Lv <b>${L}</b>${s.ng?' · NG+'+s.ng:''}${s.stain?' · <b style="color:var(--bad)">'+s.stain+' lost</b>':''}</p>${bar(s.hp,maxHp(s))}<p class="sfp">❤️ ${s.hp}/${maxHp(s)} · 🧪 ${s.fl}/${flMax(s)}</p>`;
   h+=`<div class="sfl"><button data-sf="flask" title="Heal 50%" ${s.fl<1||s.hp>=maxHp(s)?'disabled':''}>🧪 Flask</button><button data-sf="rest" title="Full health and flasks" ${b?'disabled':''}>🔥 Rest</button></div>`;
   h+=`<p class="sfp">Level up · ${c} runes</p><div class="sfl"><button data-sf="up" data-k="v" title="+10 health, more flasks" ${s.rn<c?'disabled':''}>❤️ ${s.v}</button><button data-sf="up" data-k="s" title="+8% boss damage" ${s.rn<c?'disabled':''}>⚔️ ${s.s}</button><button data-sf="up" data-k="m" title="+10% boss time" ${s.rn<c?'disabled':''}>🧠 ${s.m}</button></div>`;
   if(b){h+=`<p class="sfp"><b>${BOSS[b.i][1]} ${BOSS[b.i][0]}</b> · ${K.mmss(b.end-now())}</p>${bar(Math.floor(b.got),b.need)}`}
   else{h+=`<div class="sfl">${BOSS.map((o,i)=>`<button data-sf="boss" data-k="${i}" ${open(s,i)?'':'disabled'} class="${s.beat.includes(i)?'on':''}">${o[1]} ${esc(o[0])} <small>${s.beat.includes(i)?'✓':need(s,i)+' SP'}</small></button>`).join('')}</div>`;
    if(s.beat.length>=BOSS.length)h+=`<div class="sfl"><button data-sf="ng" title="Harder bosses, bigger rewards, +1000 runes">🔥 New Game+</button></div>`}
   return h},
  act:(a,t)=>{const s=S();if(a==='flask'&&s.fl>0&&s.hp<maxHp(s)){s.fl--;s.hp=Math.min(maxHp(s),s.hp+Math.round(maxHp(s)*.5))}
   else if(a==='rest'&&!s.boss){s.hp=maxHp(s);s.fl=flMax(s);s.rests++;try{toast('🔥 You rest. The flame is warm.')}catch(e){}}
   else if(a==='up'){const c=cost(lvl(s));if(s.rn>=c){s.rn-=c;s[t.dataset.k]++;s.hp=Math.min(maxHp(s),s.hp+10)}}
   else if(a==='boss'&&!s.boss){const i=+t.dataset.k;if(open(s,i)){s.boss={i,need:need(s,i),got:0,end:now()+mins(s,i)*60000,lt:now()};if(!s.lore['i'+i]){s.lore['i'+i]=1;K.story(BOSS[i][0],BOSS[i][4],null,'#ff8a2b')}}}
   else if(a==='ng'&&s.beat.length>=BOSS.length&&!s.boss){s.ng++;s.beat=[];s.rn+=1000;s.hp=maxHp(s);s.fl=flMax(s);pay(150);K.banner('THE FLAME RETURNS','New Game+ '+s.ng,'#ffd27a',3000)}}};
 const V=window.FDVIEW;
 V[id]={s:'#fdview .vg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,transparent 40%,#000d 100%)}#fdview .fg{position:absolute;left:-10%;right:-10%;bottom:0;height:38%;background:linear-gradient(0deg,#9a8f8040,transparent)}#fdview .bf{position:absolute;left:14px;bottom:56px;width:90px;height:110px;background:radial-gradient(ellipse at 50% 85%,#ffd27acc,#ff8a2b88 35%,transparent 70%)}#fdview .bf:after{content:"";position:absolute;left:34px;bottom:0;width:22px;height:60px;border-radius:50% 50% 30% 30%;background:linear-gradient(#fff3c8,#ffb347 50%,#d1432b)}#fdview s{position:absolute;bottom:-10px;width:4px;height:4px;border-radius:50%;background:#ffb347;box-shadow:0 0 8px 2px #ff8a2b;opacity:0}#fdview .bb{position:absolute;left:50%;top:10px;transform:translateX(-50%);width:min(560px,86vw);opacity:0;transition:opacity .4s}html[data-bfhp="1"] #fdview .bb{opacity:1}#fdview .bb span{display:block;font:800 13px Georgia,serif;letter-spacing:.2em;text-transform:uppercase;color:#efe6d8;text-shadow:0 2px 0 #000;margin-bottom:3px}#fdview .bb em{display:block;height:9px;background:#2a0a06;border:2px solid #6b2a1a;border-radius:2px}#fdview .bb i{display:block;height:100%;background:linear-gradient(90deg,#8b1a10,#d1432b);width:100%;transition:width .5s}',
  a:'#fdview s{animation:bfem linear infinite}@keyframes bfem{0%{opacity:0;transform:translate(0,0)}15%{opacity:.9}100%{opacity:0;transform:translate(28px,-85vh)}}#fdview .bf{animation:bffl 1.4s ease-in-out infinite alternate}@keyframes bffl{to{opacity:.7;transform:scale(1.07)}}',
  h:'<i class="vg"></i><i class="fg"></i><i class="bf"></i>'+Array.from({length:16},(_,i)=>`<s style="left:${(i*37+8)%100}%;animation-delay:${-(i*1.7)%9}s;animation-duration:${6+(i*2)%5}s"></s>`).join('')+'<div class="bb"><span></span><em><i></i></em></div>',
  u:e=>{const s=S(),b=s.boss,sp=e.querySelector('.bb span'),i=e.querySelector('.bb i');if(!sp)return;if(b){const t=BOSS[b.i][0];if(sp.textContent!==t)sp.textContent=t;i.style.width=Math.max(0,100-b.got/b.need*100)+'%'}}};
 K.wire(id,V[id],(c,I)=>{const s=S();c.fillStyle='#0c0a09';c.fillRect(0,0,900,500);const g=c.createRadialGradient(130,430,10,130,430,420);g.addColorStop(0,'#ff8a2b88');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,900,500);
  c.strokeStyle='#ff8a2b';c.lineWidth=4;c.strokeRect(34,34,832,432);c.textAlign='left';c.fillStyle='#ff8a2b';c.font='700 24px Georgia,serif';c.fillText('· THE TRAVELLER ·',64,88);
  c.fillStyle='#efe6d8';c.font='900 52px Georgia,serif';c.fillText(K.cut(c,String(I.title),760),64,160);
  c.fillStyle='#ffd27a';c.font='700 26px Georgia,serif';c.fillText('Level '+lvl(s)+'  ·  '+s.rn+' runes'+(s.ng?'  ·  NG+'+s.ng:''),64,214);
  c.fillStyle='#efe6d8';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',64,268);
  c.fillStyle='#9a8f80';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText(s.beat.length+'/6 FOES FELLED  ·  '+s.deaths+' FALLS',64,316);
  c.fillStyle='#ff8a2b';c.font='italic 700 24px Georgia,serif';c.fillText(K.cut(c,'"'+(I.tag||'Rest. Study. Rise again.')+'"',760),64,410)},{name:'Traveller Card',tag:'Bonfire',ico:'🔥'});
})();
