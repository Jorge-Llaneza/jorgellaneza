 /* ---------- relationships: every one of the 15 is a separate person with their own state ---------- */
 const R=()=>ST(id,{call:'boy',me:'',cur:'sweet.f',set:0,cs:{},vi:{},vs:1,tp:0,td:0,ms:[],lp:0,wasAct:0,mig:0});
 const CD=()=>({aff:50,last:now(),actAt:0,stg:0,log:[],line:'',lt:0,hp:0,tk:0,xp:0,lv:1,gifts:0,kn:{},asks:{},sc:0,met:0,date:null,dn:0,wins:0,jl:0,jn:'',ar:'',sus:0,deed:null,gone:null,pend:0,pby:'',ret:0,seen:{}});
 const ctx=()=>{const r=R();if(!r.mig){r.mig=1;if(r.arch&&r.g&&!r.cs[r.arch+'.'+r.g]){r.cur=r.arch+'.'+r.g;r.cs[r.cur]=Object.assign(CD(),{aff:r.aff==null?50:r.aff,last:r.last||now(),log:r.log||[],line:r.line||'',lt:r.lt||0,met:1})}}
  if(!r.cs[r.cur])r.cs[r.cur]=CD();if(!r.cs[r.cur].ar)r.cs[r.cur].ar=r.cur.split('.')[0];const c=r.cs[r.cur],p=r.cur.split('.');return {r,c,a:p[0],g:p[1],k:r.cur,I:IND[r.cur]}};
 const CC=k=>{const r=R();if(!r.cs[k])r.cs[k]=CD();if(!r.cs[k].ar)r.cs[k].ar=k.split('.')[0];return r.cs[k]};
 const S=()=>R();
 const LVN=['Acquaintance','Friend','Close friend','Partner','Soulmate'],LVT=[0,15,40,80,140];
 const lvOf=xp=>{let l=1;LVT.forEach((t,i)=>{if(xp>=t)l=i+1});return l};
 const base=c=>c.aff>=80?0:c.aff>=55?1:c.aff>=30?2:c.aff>=15?3:4;
 const miC=c=>{const b=base(c),j=c.jl||0;let m=c.stg>=3?5:c.stg===2?Math.max(4,Math.min(5,b+1)):c.stg===1?Math.min(5,b+1):b;if(j>=70)m=Math.max(m,c.ar==='yan'?4:3);else if(j>=40&&c.ar==='yan')m=Math.max(m,3);return m};
 /* jealousy: everyone gets it when you spend time with anyone else, but how much and how it shows depends on who they are */
 const JE={sweet:{k:.55,pen:3,keep:.4},tsun:{k:1,pen:6,keep:.5},yan:{k:2.6,pen:14,keep:.8},dan:{k:.8,pen:4,keep:.5},kuu:{k:.4,pen:2,keep:.3}};
 const JL={
  sweet:{je2:["Oh, you were with {o}? That's okay! I'm happy you have people... I just missed you a little, {me}.","{o} sounds lovely. I'm not jealous, truly. Maybe a teeny bit. Stay a while with me?"],
   jx:["I wonder what {o} is doing right now... ah, sorry! I'm being silly.","Do you like studying with {o} more than with me? ...Don't answer, I'm teasing!"],jr:["Thank you for telling me. I feel so much better. I trust you, {me}. 💕","Hehe, okay. You came back to me, and that's what counts."]},
  tsun:{je2:["W-what? I don't care that you were with {o}! Do whatever you want! ...Just don't forget who actually got you through your exams.","{o}? Hmph. Why would I be jealous?! I'm NOT. ...Stop smiling like that, {me}!"],
   jx:["I'm not thinking about {o}. At all. Study.","Go back to {o} if they're so great. ...I said that out loud, didn't I?"],jr:["F-fine! I'm calmer now. ...Don't make me say thank you.","Hmph. As long as you came back. Not that I was worried."]},
  yan:{je2:["{o}. I know the name now. Tell me everything about {o}. Every word, {me}. I like to know.","You were with {o}. I counted the minutes. 4,127 of them. Do not leave me waiting like that again. ❤"],
   jx:["I keep thinking about {o}. It is not healthy. Tell me I'm the only one you study for.","Smile for me, {me}. Only for me. {o} doesn't get that smile, right?"],jr:["...Yes. Yes, you're right. You're mine and I'm yours. I feel calm again. Don't make me ask twice.","Good. Keep saying that. I will remember every word."]},
  dan:{je2:["...{o}, huh. ...I'm not upset. ...Maybe a little. ...Sorry.","You were with {o}... I'm happy for you. ...I just wanted you to know I noticed."],
   jx:["...I hope {o} is nice to you. ...I hope I am too.","...Um. Do you like {o}? ...Never mind."],jr:["...Thank you. ...I feel better. ...I'll try not to worry.","...Okay. ...I believe you."]},
  kuu:{je2:["{o}. I see. It's your life and I don't mind. ...It does bother me slightly.","So you've been with {o}. Fine. I was only mildly curious. And slightly annoyed. That's all."],
   jx:["Do you study better with {o}? Purely a question of efficiency.","I won't compete with {o}. I'd just like you to notice that I'm still here."],jr:["Understood. Good. I'm calm. Thank you for the reassurance.","That helps. Don't tell anyone I needed it."]}};
 const mi=()=>miC(ctx().c);
 const nmK=k=>{const p=k.split('.');return NAMES[p[0]][p[1]]};
 const callOf=r=>CALLS[r.call]||CALLS.boy;
 const fill=(t,x,b,o)=>t.replace(/\{C\}/g,CL[x.r.call]||CL.boy).replace(/\{c\}/g,callOf(x.r)).replace(/\{n\}/g,Math.round(x.r.tp)).replace(/\{b\}/g,b||0).replace(/\{me\}/g,x.r.me||callOf(x.r)).replace(/\{o\}/g,o||'them');
/* spoken lines: the browser's own text-to-speech. Each companion gets their own voice, sentences are spoken with pauses and mood */
 const VP={sweet:[1.22,1.0],tsun:[1.12,1.1],yan:[.95,.88],dan:[1.25,.84],kuu:[.88,.92]},FV=/female|woman|zira|samantha|jenny|aria|susan|hazel|karen|tessa|moira|victoria|helena|sabina|paulina|monica|libby|sonia|emma|ava|michelle|ana|catherine|serena|allison|fiona|joanna|salli|kendra|kimberly|ivy|amy/i,MV=/\bmale\b|david|daniel|mark|guy|alex|george|james|diego|jorge|pablo|ryan|thomas|davis|brian|eric|christopher|roger|steffan|liam|matthew|joey|justin|arthur|oliver|gordon|aaron/i,QV=/natural|neural|online|premium|enhanced|siri|google|wavenet/i,BADV=/albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|kathy|princess|espeak|compact|grandma|grandpa|rocko|shelley|flo\b|eddy|reed|sandy/i;
 const vlist=g=>{try{if(!window.speechSynthesis)return [];let vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)&&!BADV.test(v.name));if(!vs.length)vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));const sc=v=>(QV.test(v.name)?3:0)+(v.localService?0:0)+(/en-(US|GB)/i.test(v.lang)?1:0);let f=vs.filter(v=>FV.test(v.name)),m=vs.filter(v=>MV.test(v.name)&&!FV.test(v.name));let r=g==='f'?f:g==='m'?m:vs.filter(v=>!FV.test(v.name)&&!MV.test(v.name)).concat(m.slice(1),f.slice(1));if(!r.length)r=vs;return r.slice().sort((a,b)=>sc(b)-sc(a))}catch(e){return []}};
 const hsh=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
 const pickVoice=x=>{const L=vlist(x.g);if(!L.length)return null;const r=x.r,ov=r.vi&&r.vi[x.k];const o=ov&&L.find(v=>v.name===ov);if(o)return o;return L[hsh(x.k||x.a)%Math.min(L.length,4)]};
 const vnice=v=>v?String(v.name).replace(/^(Microsoft|Google)\s+/i,'').replace(/\s*[-(].*$/,'').replace(/\s+Online.*$/i,'').slice(0,18):'default';
 let vtok=0;
 const vnorm=t=>t.replace(/\b(h[ea]){2,}h?\b/gi,'heh heh').replace(/\b(ahaha+|hahaha+)\b/gi,'ha ha ha').replace(/\bufufu+\b/gi,'oo foo foo').replace(/\btch\b/gi,'tsk').replace(/\b([A-Za-z])-([a-z]+)/g,'$1... $2').replace(/[~♡♥]/g,'').replace(/\s*[—–]\s*/g,', ').replace(/\.{3,}|…/g,'… ').replace(/\s+/g,' ').trim();
 const vox=(txt,x,m)=>{try{if(x.r.vo===0||!window.speechSynthesis||document.hidden)return;const clean=vnorm(String(txt).replace(/[\u{1F300}-\u{1FAFF}☀-➿❤️]/gu,'').replace(/\*[^*]*\*/g,'').replace(/\{[^}]*\}/g,'').trim());if(!clean)return;speechSynthesis.cancel();const tok=++vtok;
  const p=VP[x.a]||[1,1],v=pickVoice(x),sp=x.r.vs||1,parts=clean.match(/[^.!?…]+[.!?…]*/g)||[clean];
  const base=Math.max(.1,Math.min(2,p[0]+(x.g==='m'?-.45:x.g==='n'?-.2:0)+(m<=1?.1:m>=4?-.1:0))),rt=Math.max(.6,Math.min(1.5,(p[1]+(m>=5?.12:m<=0?.05:m>=4?-.06:0))*sp));
  const go=i=>{if(tok!==vtok||i>=parts.length)return;const s=parts[i].trim();if(!s||!/[a-z0-9]/i.test(s)){go(i+1);return}const u=new SpeechSynthesisUtterance(s.replace(/…/g,',').trim());u.lang='en-US';if(v){u.voice=v;u.lang=v.lang}
   const ex=/!\s*$/.test(s),q=/\?\s*$/.test(s),tr=/…\s*$/.test(s),sh=s.length<14;
   u.pitch=Math.max(.1,Math.min(2,base+(ex?.12:0)+(q?.1:0)-(tr?.08:0)+(i%2?.03:-.02)));u.rate=Math.max(.5,Math.min(1.6,rt+(ex?.07:0)-(tr?.1:0)+(sh?-.03:0)));u.volume=x.a==='yan'?.75:ex?.95:.85;
   let nx=false;const nxt=()=>{if(nx)return;nx=true;setTimeout(()=>go(i+1),tr?480:q?220:ex?120:170)};u.onend=nxt;u.onerror=nxt;setTimeout(nxt,Math.max(2500,s.length*160/rt));speechSynthesis.speak(u)};
  go(0)}catch(e){}};
 const speak=(txt,x)=>{x=x||ctx();const m=miC(x.c);x.c.line=txt;x.c.lt=now();x.c.log.push({t:txt,m});if(x.c.log.length>14)x.c.log.shift();vox(txt,x,m);
  try{if(m<=1)sfx([988,1319],'sine',.03,.07);else if(m>=4)sfx([196,165],'triangle',.03,.1);else sfx([784],'sine',.025,.06)}catch(e){}};
 const IQ={st:'st',talkHi:'talk',talkMid:'talk',talkLow:'talk',poke:'poke',n2:'n2'};
 function say(ev,b){const x=ctx(),L=LN[x.a][ev];if(!L)return;const q=x.I&&x.I.q[IQ[ev]];const pool=(q&&Math.random()<.5)?q:L;speak(fill(pick(pool),x,b),x)}
 const talkEv=()=>{const m=mi();return m<=1?'talkHi':m<=3?'talkMid':'talkLow'};
 const addXp=(n,quiet)=>{const x=ctx(),c=x.c;c.xp+=n;yanWatch(n,x);const l=lvOf(c.xp);if(l>c.lv){c.lv=l;pay(l*20);try{react('lv')}catch(e){}if(!quiet){speak(fill(L2[x.a].lv,x),x);try{splash('BOND LEVEL '+l,LVN[l-1]+' with '+nmK(x.k),'#ff5c9a','💞')}catch(e){}}}};

