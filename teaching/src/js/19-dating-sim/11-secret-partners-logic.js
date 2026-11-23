 /* ---------- secret partners: unlocking, aliasing their behaviour tables, and one special interaction each ---------- */
 IND['moon.n']={role:"19 · Night-shift barista. Lives between midnight and sunrise.",like:['coffee','plush'],bad:'pen',
  facts:["I haven't watched a sunrise on purpose in years. Accidents count, though.","I draw constellations on the backs of receipts. This one is you. It has fourteen stars. Don't read into it.","The moon is the only thing that stays up as late as I do. We have a pact."],
  q:{st:["Point logged. Quietly. Between us.","Nice. Even the night shift approves.","...Yeah. That's the good stuff."],talk:["Do you ever notice how loud silence gets at 3 a.m.?","Another coffee? ...I'll pretend it's for you."],poke:["...Warm hand. Acceptable.","Don't. ...Do it again."],n2:["Don't fall asleep. That's my job."]},
  gl:"A coffee? ...Okay. I'm keeping the cup.",gb:"A pen? ...I only draw with one particular pen. But thank you.",
  sc:{t:"3:12 a.m. Nyx drags two chairs onto the café roof. “Quiet hours are the best hours,” they say, pointing up.",a:["Count the stars together","Nyx counted nine before leaning on your shoulder. You counted ten. Neither of you said which one was cheating.",6],b:["Ask about the receipts","Nyx handed you one. Your name, in tiny handwriting, next to a star wearing a crown. “Don't read into it,” Nyx said, reading into it.",6]}};
 IND['ace.m']={role:"18 · Track captain. Treats homework like a 100-metre dash.",like:['candy','phones'],bad:'book',
  facts:["I've never lost to the same person twice. You're my favourite exception.","I tape my own shoelaces. Superstition. Laugh and I'll race you.","I'm not secretly counting your Study Points. ...I am absolutely counting your Study Points."],
  q:{st:["Boom! Another point! Keep that pace!","Not bad! I mean GREAT. But not as great as me.","New personal best, probably!"],talk:["Race you to the next chapter!","Stretch first! Brain muscles need it too."],poke:["Hey! No fouls! ...Okay, one more.","Do that again and it's a rematch."],n2:["Oi! Cool-down's over. Back to the track!"]},
  gl:"Sports gels?! You get me. Race you for the last one!",gb:"A book? ...Thanks. I'll read it. Eventually. Maybe the pictures.",
  sc:{t:"Ace drags you to the school track at sunset. “One lap. Loser buys drinks.” He's already stretching.",a:["Accept the race","You lost by half a second. He crossed the line, turned around, and ran backwards to wait for you. “Next time,” he panted. “I'm just warming up.”",6],b:["Cheer from the bench","He ran the whole lap looking at you instead of the track. New record, he claims, “for style”.",6]}};
 IND['ink.f']={role:"21 · Archive librarian. Keeps notes on everyone. It isn't creepy, it's cataloguing.",like:['book','pen'],bad:'plush',
  facts:["I've read every study log in the building. Yes, yours too. You write “tomorrow” a lot.","I know where everyone really goes when they say they're “at the library”. It's usually somewhere with snacks.","I rewrote your file three times. It kept ending in smiles. I stopped fighting it."],
  q:{st:["Logged. Page 214 of our shared story.","A fine addition to the record.","Filed under: Things That Went Right."],talk:["Silence in the stacks. ...But for you, I'll whisper.","I found a footnote about you. It was in my own handwriting."],poke:["Careful! You'll bend the spine.","...Fine. You may touch the librarian."],n2:["Overdue. Please return what you owe: your attention."]},
  gl:"A book! Oh, don't tempt me. I'll read it tonight and mention it forever.",gb:"A plush? In my archive? ...It can sit by the dictionary. Don't expect me to be sentimental.",
  sc:{t:"After closing, Ivy opens a drawer marked DO NOT OPEN. It's full of notes about you: every study session, with tiny doodles. “It's research,” she says, adjusting her glasses with shaking hands.",a:["Read one aloud","“Day 12: showed up tired. Stayed anyway. Heart did something odd.” You read it twice. Ivy pretended to alphabetize something very loudly.",6],b:["Add a page yourself","You wrote “Ivy was here. So was I.” She stared at it for a long time, then framed it. Behind the DO NOT OPEN drawer.",6]}};
 VP.moon=[.85,.85];VP.ace=[1.1,1.2];VP.ink=[1.05,1];
 /* alias the shared behaviour tables to the base personality (individual flavour comes from IND above) */
 {const bs=Object.keys(SEC);
  const al=(T)=>bs.forEach(s=>{if(T[SEC[s].base]&&!T[s])T[s]=T[SEC[s].base]});
  [LN,L2,JE,JL,CF,PL,TOD,VM,RET,OP,RPSL.win,RPSL.lose,RPSL.draw,TDR.truth,TDR.done,TDR.skip,CH.fb].forEach(al);
  Object.keys(CH).forEach(k=>{if(k!=='fb')al(CH[k])});
  Object.keys(OP).forEach(a=>{bs.forEach(s=>{if(OP[a]&&OP[a][SEC[s].base]&&!OP[a][s])OP[a][s]=OP[a][SEC[s].base]})})}
 const bsA=a=>SEC[a]?SEC[a].base:a;
 const SK=r=>r.sk||(r.sk={nt:[],pk:0,rt:0});
 const SECN={moon:'Nyx',ace:'Ace',ink:'Ivy'};
 const unlockSec=(s)=>{const r=R();if(!r.sec)r.sec={};if(r.sec[s])return;r.sec[s]=1;CC(SEC[s].k);try{splash('SECRET PARTNER UNLOCKED',SECN[s]+' — '+AL[s][0]+'. Find them in People.','#8a6bff','🔓')}catch(e){}X.sv()};
 const secOn=s=>!!(R().sec&&R().sec[s]);
 const secHint={moon:["Some people only come out after dark. Earn Study Points after midnight (00:00–04:59) on 2 different nights.",r=>Math.min(2,SK(r).nt.length)+'/2 nights'],ace:["Someone is watching your promises. Keep 3 pledges (Together → Pledge).",r=>Math.min(3,SK(r).pk)+'/3 pledges'],ink:["She knows what happened to the ones who vanished. Be there when someone comes back after going unresponsive.",r=>Math.min(1,SK(r).rt)+'/1 return']};
 const secTrack=x=>{const h=new Date().getHours();if(h<5){const sk=SK(x.r),d=dn();if(!sk.nt.includes(d))sk.nt.push(d);if(sk.nt.length>=2)unlockSec('moon')}};
 /* Nyx: midnight talk */
 SM.aiMid=()=>{const x=ctx(),c=x.c,h=new Date().getHours(),night=h>=22||h<5,d=dn();
  if(!night){const t="…zzz. ...Hm? It's daytime. I'm a nocturnal creature. Come back after ten at night. ...Bring coffee.";speak(t,x);modal(head(x,'🌙 Midnight talk')+reply(t)+`<div class="aig"><button class="aic" data-sm="aiTog">Back</button></div>`);return}
  const L=["I used to think the quiet was lonely. Then someone sat down next to me and it wasn't.","Do you ever feel like the world is only honest after midnight? Nobody performs. They just... are.","I count the streetlights on my walk home. Yours is the only one that hasn't gone out.","If I disappear for a day, don't worry. I'm probably asleep. Or hiding from the sun. Probably both.","When you study late, I pretend I'm keeping watch. Really I just like knowing you're there.","You're the only person I stay awake for on purpose."];
  const out=pick(L);if(c.asks.mid!==d){c.asks.mid=d;c.aff=Math.min(100,c.aff+3);addXp(2,true)}speak(out,x);X.sv();
  modal(head(x,'🌙 Midnight talk')+reply(out)+`<div class="aig"><button class="aic" data-sm="aiMid">Keep talking</button><button class="aic" data-sm="aiTog">Back</button></div>`)};
 /* Ace: duel */
 const DUL={set:"Deal! {n} SP before midnight. Beat my score or eat my dust!",ok:"...Tch! You actually did it?! Fine, you win this round. Next time I'm not holding back!",bad:"Ha! Told you! Better luck next time, rookie!"};
 SM.aiDuel=t=>{const x=ctx(),c=x.c,v=t&&t.dataset&&+t.dataset.v;
  if(!v){const p=c.pl&&c.pl.d===D()?c.pl:null;modal(head(x,'🏁 Duel')+(p?`<p class="sfp">Active ${p.duel?'duel':'pledge'}: <b>${p.need} SP</b> — ${p.done?'done!':Math.max(0,Math.ceil(p.need-(x.r.tp-p.from)))+' to go.'}</p>`:`<p class="sfp">Ace sets a score by midnight. Beat it for ×9 coins. Lose and he just gloats.</p><div class="aig">${[4,8,12].map(n=>`<button class="aic" data-sm="aiDuel" data-v="${n}">Beat ${n} SP · +${n*9} 🪙</button>`).join('')}</div>`)+`<div class="aig"><button class="aic" data-sm="aiTog">Back</button></div>`);return}
  if(c.pl&&c.pl.d===D()&&!c.pl.done)return;c.pl={d:D(),need:v,from:x.r.tp,done:0,duel:1};const out=fill(DUL.set.replace('{n}',v),x);speak(out,x);X.sv();
  modal(head(x,'🏁 Duel set')+reply(out)+`<div class="aig"><button class="aic" data-sm="aiTog">Back</button></div>`)};
 /* Ivy: the archive */
 SM.aiArchive=()=>{const x=ctx(),r=x.r,rows=Object.keys(r.cs).filter(q=>q!==x.k&&r.cs[q].met).map(q=>{const c=r.cs[q],a=rk(q),f=[];if(gone(c))f.push('📵 unresponsive');if((c.jl||0)>=25)f.push('💢 jealous '+Math.round(c.jl)+'%');if(bsA(a)==='yan'&&(c.sus||0)>=25)f.push('👁 suspicion '+Math.min(100,Math.round(c.sus/.8))+'%');return `<div class="ail"><b>${esc(nmK(q))} · ${AL[a][0]}</b>Bond ${c.lv} · ♥ ${Math.round(c.aff)}${f.length?' · '+f.join(' · '):''}</div>`});
  const s=Object.keys(SEC).filter(secOn).length;
  const t="I've been keeping notes. Don't worry, they're flattering.";speak(t,x);
  modal(head(x,'📁 The archive')+reply(t)+(rows.length?`<div role="log">${rows.join('')}</div>`:'<p class="sfp">Nothing filed yet. Meet more people first.</p>')+`<p class="sfp">Secret partners found: ${s}/3</p><div class="aig"><button class="aic" data-sm="aiTog">Back</button></div>`)};
