 /* ---------- studying makes them happy, idling does the opposite (only the one you are with) ---------- */
 const MS=[[10,10],[25,15],[50,25],[100,40]];
 onSP(id,d=>{const x=ctx(),r=x.r,c=x.c,t=now();if(r.td!==D()){r.td=D();r.tp=0;r.ms=[]}r.tp+=d;
  if(!X.act(id))return;
  if(gone(c)){c.last=t;return}
  const was=c.stg>=2||c.aff<20;c.last=t;c.stg=0;c.actAt=t;
  c.aff=Math.min(100,c.aff+Math.min(8,d*2.5));c.jl=Math.max(0,(c.jl||0)-2*d);pledgeChk(x);secTrack(x);addXp(Math.min(3,d*.5),true);
  if(c.aff>=80)pay(1);
  if(c.date){c.date.got+=d;if(c.date.got>=c.date.need){dateEnd(true);r.lp=t;return}}
  const hit=MS.find(([p])=>r.tp>=p&&!r.ms.includes(p));
  if(hit){r.ms.push(hit[0]);pay(hit[1]);say('big',hit[1]);r.lp=t;return}
  if(was||t-r.lp>20000){r.lp=t;say(was?'low':'st')}});
 let hidAt=0;
 const dateEnd=ok=>{const x=ctx(),c=x.c,dt=c.date;c.date=null;if(!dt)return;
  if(ok){c.aff=Math.min(100,c.aff+10);c.wins++;pay(dt.min*2);addXp(15,true);speak(fill(L2[x.a].dW,x),x);try{cutQ(x.k,'date')}catch(e){}try{splash('STUDY DATE DONE','+'+dt.min*2+' coins · '+nmK(x.k)+' is delighted','#ff5c9a','📚')}catch(e){}addXp(0)}
  else{c.aff=Math.max(0,c.aff-5);speak(fill(L2[x.a].dF,x),x)}};
 tick.push(()=>{const x=ctx(),r=x.r,c=x.c;
  if(!X.act(id)){r.wasAct=0;return}
  try{fdTick()}catch(e){}
  const t=now();
  if(gone(c)){r.wasAct=1;return}
  if(c.ret&&r.wasAct){speak(retLine(x),x)}
  if(!r.wasAct){r.wasAct=1;if(c.ret){c.actAt=t;c.stg=0;speak(retLine(x),x);return}c.actAt=t;c.stg=0;if(!r.set){r.set=1;try{SM.aipick()}catch(e){}}else{if(!c.met){c.met=1;speak(fill(pick(LN[x.a].hi),x),x)}else say(t-c.last>6*3600e3?'back':'hi')}}
  if(document.hidden){if(!hidAt)hidAt=t;return}
  if(hidAt){const g=t-hidAt;hidAt=0;if(g>5*60000){c.actAt=t;c.stg=0;if(g>30*60000)say('back')}}
  let fc=false;try{fc=fcActive()||!!document.getElementById('fclock')}catch(e){}
  if(fc){c.last=t;c.actAt=t;c.stg=0;return}
  {const h=new Date().getHours(),kk=h>=5&&h<11?'m':(h>=23||h<4)?'n':'';if(kk&&r.wasAct&&c.tod!==dn()+kk&&t-c.lt>15000&&t-c.actAt>6000){c.tod=dn()+kk;speak(fill(TOD[x.a][kk],x),x)}}
  if(c.pl&&!c.pl.done&&c.pl.d!==D()){c.aff=Math.max(0,c.aff-(c.pl.duel?1:4));speak(fill(c.pl.duel?DUL.bad:PL[x.a].bad,x),x);c.pl=null}
  if(c.date){if(t>=c.date.end)dateEnd(c.date.got>=c.date.need);else if(c.stg>=2)dateEnd(false)}
  const idle=(t-Math.max(c.last,c.actAt))/60000,ns=idle>=35?3:idle>=18?2:idle>=8?1:0;
  if(ns>c.stg){c.stg=ns;say('n'+ns)}
  if(c.jl>0)c.jl=Math.max(0,c.jl-.012);
  if(c.stg>=1)c.aff=Math.max(0,c.aff-.45/60);
  else if(t-c.lt>(5+rnd(4))*60000){if(!r.vis&&t-(r.vc||0)>10*60000&&c.lv>=2&&Math.random()<.45){const o=others().filter(q=>!gone(CC(q)));if(o.length)r.vis={k:pick(o),t}}
   if((c.jl||0)>=35&&Math.random()<.65){speak(fill(pick(JL[x.a].jx),x,0,c.jn||'them'),x);c.aff=Math.max(0,c.aff-.5*JE[x.a].k)}else say(talkEv())}});

