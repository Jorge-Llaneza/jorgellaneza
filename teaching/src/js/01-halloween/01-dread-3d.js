/* ---------- upgraded dread: 3D (HRTF) positioned sounds and short "storylets" ---------- */
function place(src,o){
 let last=src;
 if(AC.createPanner){const p=AC.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=1;p.rolloffFactor=.5;
  const t0=AC.currentTime+(o.t||0),pa=o.path;
  pa.forEach((q,i)=>{[['positionX',1],['positionY',2],['positionZ',3]].forEach(([k,ix])=>{const prm=p[k];if(prm&&prm.setValueAtTime){i===0?prm.setValueAtTime(q[ix],t0+q[0]):prm.linearRampToValueAtTime(q[ix],t0+q[0])}})});
  if(!p.positionX)p.setPosition(pa[0][1],pa[0][2],pa[0][3]);
  src.connect(p);last=p}
 last.connect(master);if(o.wet){const g=AC.createGain();g.gain.value=o.wet;last.connect(g);g.connect(verb)}}
Object.assign(SND,{
 drone(){const t=AC.currentTime,m=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=240;
  const g=envG(t,3,5,.17);[55,58.3,82.4].forEach((f,i)=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(lp);o.start(t);o.stop(t+8.2)});
  const sub=AC.createOscillator();sub.frequency.value=29;const sg=AC.createGain();sg.gain.value=.9;sub.connect(sg);sg.connect(lp);sub.start(t);sub.stop(t+8.2);
  const tr=AC.createOscillator(),tg=AC.createGain();tr.frequency.value=.35;tg.gain.value=.4;const am=AC.createGain();am.gain.value=.6;tr.connect(tg);tg.connect(am.gain);tr.start(t);tr.stop(t+8.2);
  lp.connect(am);am.connect(g);g.connect(m);place(m,{path:[[0,0,0,-2]],wet:.6})},
 breath(){const t=AC.currentTime,n=3,D=n*2.6+.5,s=AC.createBufferSource();s.buffer=noiseBuf(D);
  const bp=AC.createBiquadFilter();bp.type='bandpass';bp.Q.value=.9;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=300;
  const g=AC.createGain();g.gain.value=0;const am=AC.createGain(),l=AC.createOscillator(),lg=AC.createGain();am.gain.value=.7;l.frequency.value=28;lg.gain.value=.3;l.connect(lg);lg.connect(am.gain);
  for(let k=0;k<n;k++){const a=t+.2+k*2.6;
   g.gain.setValueAtTime(.0001,a);g.gain.linearRampToValueAtTime(.9,a+.95);g.gain.linearRampToValueAtTime(.0001,a+1.25);
   g.gain.setValueAtTime(.0001,a+1.3);g.gain.linearRampToValueAtTime(.7,a+1.5);g.gain.exponentialRampToValueAtTime(.0001,a+2.4);
   bp.frequency.setValueAtTime(600,a);bp.frequency.linearRampToValueAtTime(1500,a+1);bp.frequency.setValueAtTime(1300,a+1.3);bp.frequency.linearRampToValueAtTime(450,a+2.4)}
  s.connect(hp);hp.connect(bp);bp.connect(am);am.connect(g);s.start(t);l.start(t);s.stop(t+D);l.stop(t+D);
  place(g,{path:[[0,-.3,0,.3],[n*2.6,.25,0,.45]],wet:.12})},
 steps(){const t=AC.currentTime,N=8,gap=.66;
  for(let i=0;i<N;i++){const f=i/(N-1),x=(-7+f*6.6)+(i%2?.25:-.25),z=7-f*6.3,tt=t+i*gap;
   const s=AC.createBufferSource();s.buffer=noiseBuf(.3);const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=320+f*200;
   const o=AC.createOscillator();o.frequency.setValueAtTime(95,tt);o.frequency.exponentialRampToValueAtTime(45,tt+.14);
   const g=envG(tt,.004,.2,1.2),g2=envG(tt,.004,.22,1.1),m=AC.createGain();s.connect(lp);lp.connect(g);o.connect(g2);s.start(tt);s.stop(tt+.3);o.start(tt);o.stop(tt+.3);g.connect(m);g2.connect(m);
   place(m,{t:i*gap,path:[[0,x,0,z]],wet:.3})}},
 scratch(){const t=AC.currentTime,side=Math.random()<.5?-1:1,m=AC.createGain();let tt=t+.1;
  for(let i=0;i<9;i++){const d=rr(.06,.16),s=AC.createBufferSource();s.buffer=noiseBuf(d+.05);const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=rr(2500,5200);f.Q.value=1.6;
   const am=AC.createGain(),l=AC.createOscillator(),lg=AC.createGain();am.gain.value=.5;l.type='square';l.frequency.value=rr(45,70);lg.gain.value=.5;l.connect(lg);lg.connect(am.gain);
   const g=envG(tt,.01,d,.9);s.connect(f);f.connect(am);am.connect(g);g.connect(m);s.start(tt);l.start(tt);s.stop(tt+d+.05);l.stop(tt+d+.05);tt+=d+rr(.03,.2)*(1-i*.08)}
  place(m,{path:[[0,side*1.6,.5,-1.4]],wet:.25})},
 chains(){const t=AC.currentTime,m=AC.createGain();let tt=t+.1;
  const sc=AC.createBufferSource();sc.buffer=noiseBuf(3.2);const sf=AC.createBiquadFilter();sf.type='bandpass';sf.frequency.setValueAtTime(500,t);sf.frequency.linearRampToValueAtTime(900,t+3);sf.Q.value=2;
  const sg=envG(t,1,2.2,.5);sc.connect(sf);sf.connect(sg);sg.connect(m);sc.start(t);sc.stop(t+3.2);
  for(let i=0;i<12;i++){[2900,4300,6100].forEach((fq,k)=>{const o=AC.createOscillator();o.frequency.value=fq*rr(.97,1.03);const g=envG(tt,.001,rr(.15,.3),.35/(k+1));o.connect(g);o.start(tt);o.stop(tt+.35);g.connect(m)});tt+=rr(.1,.32)}
  place(m,{path:[[0,-5,0,-2],[3.2,-1.2,0,1.5]],wet:.5})},
 whisperSpeech(){const t=AC.currentTime,V=[[730,1090],[270,2290],[300,870],[530,1840],[660,1720]],n=14,D=n*.15+.5;
  const s=AC.createBufferSource();s.buffer=noiseBuf(D);const f1=AC.createBiquadFilter(),f2=AC.createBiquadFilter();[f1,f2].forEach(f=>{f.type='bandpass';f.Q.value=7});
  const g=AC.createGain();g.gain.value=.0001,m=AC.createGain();m.gain.value=7;
  for(let i=0;i<n;i++){const a=t+.1+i*.15,v=V[Math.floor(Math.random()*V.length)];f1.frequency.setValueAtTime(v[0],a);f2.frequency.setValueAtTime(v[1],a);
   g.gain.setValueAtTime(.0001,a);g.gain.linearRampToValueAtTime(rr(.5,1),a+.04);g.gain.linearRampToValueAtTime(.0001,a+.13)}
  s.connect(f1);s.connect(f2);f1.connect(g);f2.connect(g);g.connect(m);s.start(t);s.stop(t+D);
  const sib=AC.createBufferSource();sib.buffer=noiseBuf(D);const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=5500;const sg=AC.createGain();sg.gain.value=.0001;
  for(let i=0;i<n;i++)if(Math.random()<.4){const a=t+.1+i*.15;sg.gain.setValueAtTime(.0001,a);sg.gain.linearRampToValueAtTime(.35,a+.02);sg.gain.linearRampToValueAtTime(.0001,a+.1)}
  sib.connect(hp);hp.connect(sg);sg.connect(m);sib.start(t);sib.stop(t+D);
  place(m,{path:[[0,-1.2,0,.3],[.8,-.6,0,1.1],[1.6,.6,0,1.1],[2.4,1.2,0,.3]],wet:.45})},
 hum(){const t=AC.currentTime,mel=[440,523,494,440,330,392,440,349],m=AC.createGain(),o=AC.createOscillator();o.type='sawtooth';
  const vib=AC.createOscillator(),vg=AC.createGain();vib.frequency.value=5.2;vg.gain.value=9;vib.connect(vg);vg.connect(o.frequency);
  const f1=AC.createBiquadFilter(),f2=AC.createBiquadFilter();f1.type=f2.type='bandpass';f1.frequency.value=280;f2.frequency.value=1150;f1.Q.value=5;f2.Q.value=6;
  const g=AC.createGain();g.gain.value=.0001;let tt=t+.1;const n=5+Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){const fq=mel[i]*(1-i*.006),dur=.62;o.frequency.setValueAtTime(fq*.97,tt);o.frequency.linearRampToValueAtTime(fq,tt+.08);
   g.gain.setValueAtTime(.0001,tt);g.gain.linearRampToValueAtTime(1.6,tt+.1);g.gain.linearRampToValueAtTime(1.2,tt+dur-.1);g.gain.linearRampToValueAtTime(.0001,tt+dur);tt+=dur}
  o.connect(f1);o.connect(f2);f1.connect(g);f2.connect(g);o.start(t);vib.start(t);o.stop(tt+.1);vib.stop(tt+.1);g.connect(m);
  place(m,{path:[[0,-3,0,-6]],wet:.7})},
 farScream(){const T=AC.currentTime+.05,m=AC.createGain(),os=[AC.createOscillator(),AC.createOscillator()];
  os.forEach((x,i)=>{x.type='sawtooth';x.detune.value=i?19:-14;const p=x.frequency;p.setValueAtTime(420,T);p.exponentialRampToValueAtTime(760,T+.1);p.exponentialRampToValueAtTime(1150,T+.5);p.linearRampToValueAtTime(950,T+1)});
  const vib=AC.createOscillator(),vg=AC.createGain();vib.frequency.value=6.5;vg.gain.value=45;vib.connect(vg);os.forEach(x=>vg.connect(x.frequency));
  const src=AC.createGain();os.forEach(x=>x.connect(src));const pre=AC.createWaveShaper();pre.curve=distCurve(20);src.connect(pre);
  const mix=AC.createGain();[[850,5,1],[1450,7,.8],[2850,9,.5]].forEach(([fq,q,gn])=>{const b=AC.createBiquadFilter();b.type='bandpass';b.Q.value=q;b.frequency.setValueAtTime(fq*.8,T);b.frequency.linearRampToValueAtTime(fq,T+.35);const gg=AC.createGain();gg.gain.value=gn;pre.connect(b);b.connect(gg);gg.connect(mix)});
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;const env=AC.createGain();env.gain.setValueAtTime(0,T);env.gain.linearRampToValueAtTime(1.4,T+.03);env.gain.setValueAtTime(1.4,T+.9);env.gain.linearRampToValueAtTime(0,T+.96);
  mix.connect(lp);lp.connect(env);env.connect(m);[...os,vib].forEach(x=>{x.start(T);x.stop(T+1.05)});place(m,{path:[[0,-4,0,-6]],wet:.9})},
 swell(){const t=AC.currentTime,D=2.6,s=AC.createBufferSource();s.buffer=noiseBuf(D+.2);const f=AC.createBiquadFilter();f.type='bandpass';f.Q.value=3;f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(5000,t+D);
  const g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(1.6,t+D);g.gain.setValueAtTime(0,t+D+.01);
  const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(50,t);o.frequency.exponentialRampToValueAtTime(220,t+D);const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=600;
  const og=AC.createGain();og.gain.setValueAtTime(.0001,t);og.gain.exponentialRampToValueAtTime(.2,t+D);og.gain.setValueAtTime(0,t+D+.01);
  const m=AC.createGain();s.connect(f);f.connect(g);g.connect(m);o.connect(lp);lp.connect(og);og.connect(m);s.start(t);s.stop(t+D+.2);o.start(t);o.stop(t+D+.2);place(m,{path:[[0,0,0,-1.5]],wet:.1})},
 tinnitus(){const t=AC.currentTime,g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+1);g.gain.setValueAtTime(.045,t+3.2);g.gain.linearRampToValueAtTime(0,t+4);
  [6180,6230].forEach(fq=>{const o=AC.createOscillator();o.frequency.value=fq;o.connect(g);o.start(t);o.stop(t+4.1)});g.connect(master)},
 doorSlam(){SND.creak();const T=1.6,t=AC.currentTime+T,s=AC.createBufferSource();s.buffer=noiseBuf(.5);const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;
  const g=envG(t,.003,.45,1.4),o=AC.createOscillator();o.frequency.setValueAtTime(85,t);o.frequency.exponentialRampToValueAtTime(30,t+.5);const og=envG(t,.003,.6,1.1),m=AC.createGain();
  s.connect(lp);lp.connect(g);s.start(t);s.stop(t+.5);o.connect(og);o.start(t);o.stop(t+.7);g.connect(m);og.connect(m);place(m,{t:T,path:[[0,5,0,-8]],wet:.8})}
});
const later=(f,ms)=>setTimeout(()=>{if(hwOn&&sndOn&&AC&&AC.state==='running'&&!document.hidden){try{f()}catch(e){}}},ms);
const SEQ=[
 ()=>{SND.steps();later(SND.breath,5600);later(SND.whisperSpeech,8800)},
 ()=>{SND.scratch();later(SND.knock,3200);later(SND.farScream,6000)},
 ()=>{SND.hum();later(SND.tinnitus,5200);later(SND.whisperSpeech,7000)},
 ()=>{SND.swell();later(SND.breath,3400)},
 ()=>{SND.chains();later(SND.steps,2500);later(SND.doorSlam,9500)}
];

let busyUntil=0;
function playOne(){if(!sndOn||document.hidden||!AC||AC.state!=='running'||Date.now()<busyUntil)return;try{if(Math.random()<LVL[lvl].seq){busyUntil=Date.now()+16000;SEQ[Math.floor(Math.random()*SEQ.length)]()}else{busyUntil=Date.now()+8000;const k=Object.keys(SND);SND[k[Math.floor(Math.random()*k.length)]]()}}catch(e){}}
function sndLoop(first){clearTimeout(sndT);if(!hwOn)return;sndT=setTimeout(()=>{playOne();sndLoop()},first?rr(20000,40000):rr(...LVL[lvl].snd))}
function scareLoop(){clearTimeout(scareT);if(!hwOn)return;scareT=setTimeout(()=>{if(scareOn&&!document.hidden)scare();scareLoop()},rr(...LVL[lvl].scare))}
let scT=[],scBusy=false,scBus=null,snowT=0,eerieT=0,eyeOn=true;
try{eyeOn=localStorage.getItem('mp-hw-eye')!=='0'}catch(e){}
const OSRM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches);let RM=OSRM;
const sct=(f,ms)=>scT.push(setTimeout(f,ms));
function distCurve(k){const n=1024,c=new Float32Array(n),d=Math.PI/180;for(let i=0;i<n;i++){const x=i*2/n-1;c[i]=(3+k)*x*20*d/(Math.PI+k*Math.abs(x))}return c}
function scareAudio(tl){
 const t=AC.currentTime,L=t+tl;scBus=AC.createGain();scBus.connect(master);const vg=AC.createGain();vg.gain.value=.25;scBus.connect(vg);vg.connect(verb);
 const to=n=>n.connect(scBus);
 if(tl>.5){
  /* slow build-up: creaking wood and doors, a low drone, whispers, then a dead silence just before the scare */
  const tb=AC.createGain();tb.connect(scBus);tb.gain.setValueAtTime(1,L-.35);tb.gain.linearRampToValueAtTime(0,L-.12);
  const cr=(t0,dur,f0,f1,gain,pan)=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f0,t0);o.frequency.linearRampToValueAtTime(f1,t0+dur);
   const bp=AC.createBiquadFilter();bp.type='bandpass';bp.Q.value=10;bp.frequency.setValueAtTime(280,t0);bp.frequency.linearRampToValueAtTime(rr(800,1300),t0+dur);
   const am=AC.createGain(),l=AC.createOscillator(),lg=AC.createGain();am.gain.value=.5;l.type='square';l.frequency.value=rr(9,19);lg.gain.value=.5;l.connect(lg);lg.connect(am.gain);
   const g=envG(t0,dur*.3,dur*.7,gain);o.connect(bp);bp.connect(am);am.connect(g);o.start(t0);l.start(t0);o.stop(t0+dur+.1);l.stop(t0+dur+.1);g.connect(tb)};
  cr(t+.1,1.4,60,100,.5);cr(t+1.1,Math.max(.9,tl-1.5),85,160,.55);
  const d=AC.createOscillator();d.type='sawtooth';d.frequency.setValueAtTime(38,t);d.frequency.exponentialRampToValueAtTime(90,t+tl);
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(140,t);f.frequency.exponentialRampToValueAtTime(900,t+tl);
  const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.13,t+tl-.4);d.connect(f);f.connect(g);d.start(t);d.stop(t+tl);g.connect(tb);
  const w=AC.createBufferSource();w.buffer=noiseBuf(2);const wf=AC.createBiquadFilter();wf.type='bandpass';wf.frequency.value=3000;wf.Q.value=1.5;
  const wg=envG(t+.4,.6,1.2,.16);w.connect(wf);wf.connect(wg);w.start(t+.4);w.stop(t+2.4);wg.connect(tb)}
 /* the scream: two layered formant voices, harsh and unstable */
 const voice=(f0,vow,gain,delay)=>{const T=L+delay,os=[AC.createOscillator(),AC.createOscillator()];
  os.forEach((x,i)=>{x.type='sawtooth';x.detune.value=i?23:-17;const p=x.frequency;p.setValueAtTime(f0*.55,T);p.exponentialRampToValueAtTime(f0,T+.07);p.exponentialRampToValueAtTime(f0*1.55,T+.4);p.linearRampToValueAtTime(f0*1.25,T+.9);p.exponentialRampToValueAtTime(f0*.8,T+1.45)});
  const vib=AC.createOscillator(),vgn=AC.createGain();vib.frequency.value=6.5;vgn.gain.value=f0*.05;vib.connect(vgn);os.forEach(x=>vgn.connect(x.frequency));
  const jit=AC.createOscillator(),jg=AC.createGain();jit.type='sawtooth';jit.frequency.value=31;jg.gain.value=f0*.03;jit.connect(jg);os.forEach(x=>jg.connect(x.frequency));
  const src=AC.createGain();os.forEach(x=>x.connect(src));const pre=AC.createWaveShaper();pre.curve=distCurve(25);src.connect(pre);
  const nz=AC.createBufferSource();nz.buffer=noiseBuf(1.8);const ng=AC.createGain();ng.gain.value=.5;nz.connect(ng);
  const mix=AC.createGain();
  vow.forEach(([fq,q,gn])=>{const b=AC.createBiquadFilter();b.type='bandpass';b.Q.value=q;b.frequency.setValueAtTime(fq*.8,T);b.frequency.linearRampToValueAtTime(fq,T+.35);b.frequency.linearRampToValueAtTime(fq*1.1,T+1.3);
   const gg=AC.createGain();gg.gain.value=gn;pre.connect(b);ng.connect(b);b.connect(gg);gg.connect(mix)});
  const am=AC.createGain(),tr=AC.createOscillator(),tg=AC.createGain();am.gain.value=1;tr.frequency.value=12;tg.gain.value=.18;tr.connect(tg);tg.connect(am.gain);
  const env=AC.createGain();env.gain.setValueAtTime(0,T);env.gain.linearRampToValueAtTime(gain,T+.012);env.gain.setValueAtTime(gain,T+.9);env.gain.exponentialRampToValueAtTime(.001,T+1.45);
  mix.connect(am);am.connect(env);const post=AC.createWaveShaper();post.curve=distCurve(18);env.connect(post);to(post);
  [...os,vib,jit,tr,nz].forEach(x=>{x.start(T);x.stop(T+1.55)})};
 voice(640,[[850,5,1],[1450,7,.8],[2850,9,.55],[3800,10,.3]],1.5,0);
 voice(330,[[600,5,1],[1000,6,.8],[2400,8,.5]],1.2,.03);
 /* the slam: sub boom, noise crash, metallic hit and a dissonant stinger */
 const b=AC.createOscillator();b.frequency.setValueAtTime(120,L);b.frequency.exponentialRampToValueAtTime(24,L+.9);const bg=envG(L,.003,1,.9);b.connect(bg);b.start(L);b.stop(L+1);to(bg);
 const sl=AC.createBufferSource();sl.buffer=noiseBuf(.6);const slf=AC.createBiquadFilter();slf.type='lowpass';slf.frequency.setValueAtTime(5000,L);slf.frequency.exponentialRampToValueAtTime(200,L+.4);
 const slg=envG(L,.002,.45,1);sl.connect(slf);slf.connect(slg);sl.start(L);sl.stop(L+.6);to(slg);
 [187,271,419,563,911].forEach(fq=>{const o=AC.createOscillator();o.frequency.value=fq;const g=envG(L,.002,.7,.16);o.connect(g);o.start(L);o.stop(L+.8);to(g)});
 [932,987,1480].forEach(fq=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=fq;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=2000;f.Q.value=.8;
  const g=envG(L,.004,.8,.2);o.connect(f);f.connect(g);o.start(L);o.stop(L+.9);to(g)});
 scBus.gain.setValueAtTime(1,L+1.4);scBus.gain.linearRampToValueAtTime(0,L+1.5);
}
function snowOn(){if(RM)return;const c=$('snowc'),x=c.getContext('2d');clearInterval(snowT);
 snowT=setInterval(()=>{const d=x.createImageData(c.width,c.height),a=d.data;for(let i=0;i<a.length;i+=4){a[i]=a[i+1]=a[i+2]=Math.random()*255;a[i+3]=255}x.putImageData(d,0,0)},70)}
function scareEnd(){scT.forEach(clearTimeout);scT=[];clearInterval(snowT);$('scare').className='';scBusy=false;
 if(scBus){try{scBus.gain.cancelScheduledValues(0);scBus.gain.value=0}catch(e){}scBus=null}}
function scare(v){
 if(scBusy)return;scBusy=true;const el=$('scare');
 if(!v){const r=Math.random();v=r<.4?'eyes':r<.75?'creep':'instant'}
 const tl=v==='instant'?.25:v==='eyes'?2.4:2.7;
 if(sndOn&&AC&&AC.state==='running'){try{scareAudio(tl)}catch(e){}}
 const se=$('seyes');se.style.left=rr(22,58)+'%';se.style.top=rr(25,62)+'%';se.className='eyes';se.style.setProperty('--s',2.4);
 el.className='on';void el.offsetWidth;el.classList.add(v);
 if(v==='eyes')sct(()=>se.classList.add('on'),250);
 sct(()=>{se.classList.remove('on');el.classList.add('lunge');snowOn();trk()},tl*1000);
 sct(()=>{el.classList.add('cut');clearInterval(snowT)},tl*1000+1200);
 sct(()=>el.classList.add('fade'),tl*1000+2100);
 sct(()=>{scareEnd();if(eyeOn){setTimeout(()=>hwOn&&eyes(),4000+rr(0,3000));if(lvl==='nightmare')setTimeout(()=>hwOn&&eyes(),7000+rr(0,3000))}
  if(Math.random()<LVL[lvl].dbl)setTimeout(()=>{if(hwOn&&scareOn&&!document.hidden&&!scBusy)scare()},rr(8000,20000))},tl*1000+3000);
}
$('scare').onclick=scareEnd;document.addEventListener('keydown',e=>{if(e.key==='Escape')scareEnd()});

