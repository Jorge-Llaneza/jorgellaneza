/* ---------- Halloween ambience (synthesised, no audio files) ---------- */
let AC=null,master=null,verb=null,sndOn=true,scareOn=true,hwOn=false,sndT=0,scareT=0;
try{sndOn=localStorage.getItem('mp-hw-snd')!=='0';scareOn=localStorage.getItem('mp-hw-scare')!=='0'}catch(e){}
function paintPanel(){$('hwSnd').textContent=sndOn?'🔊':'🔇';$('hwSc').textContent=scareOn?'👻':'🚫';$('hwEye').textContent=eyeOn?'👁':'🙈';$('hwCam').textContent=camOn?'📹':'📷';$('hwLvl').value=lvl}
function audio(){
 try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();
  const comp=AC.createDynamicsCompressor();master=AC.createGain();master.gain.value=.6;master.connect(comp);comp.connect(AC.destination);
  verb=AC.createConvolver();const n=AC.sampleRate*2.5,b=AC.createBuffer(2,n,AC.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.5)}
  verb.buffer=b;const vg=AC.createGain();vg.gain.value=.8;verb.connect(vg);vg.connect(master)}
 if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}}
['pointerup','click','keydown','touchend'].forEach(ev=>document.addEventListener(ev,()=>{if(hwOn)audio()},true));
const rr=(a,b)=>a+Math.random()*(b-a);
function noiseBuf(sec){const n=Math.floor(AC.sampleRate*sec),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return b}
function chain(node,wet,pan){let last=node;if(pan!==undefined&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;last.connect(p);last=p}
 last.connect(master);if(wet){const g=AC.createGain();g.gain.value=wet;last.connect(g);g.connect(verb)}}
function envG(t,a,d,peak){const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);return g}
const SND={
 drone(){const t=AC.currentTime,g=envG(t,2.5,3.5,.12);[55,77.8].forEach((f,i)=>{const o=AC.createOscillator();o.type='triangle';o.frequency.value=f;const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=.3+i*.2;lg.gain.value=3;l.connect(lg);lg.connect(o.frequency);o.connect(g);o.start(t);l.start(t);o.stop(t+6.2);l.stop(t+6.2)});chain(g,.5)},
 creak(){const t=AC.currentTime,o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(rr(70,110),t);o.frequency.linearRampToValueAtTime(rr(120,200),t+1.3);
  const f=AC.createBiquadFilter();f.type='bandpass';f.Q.value=9;f.frequency.setValueAtTime(350,t);f.frequency.linearRampToValueAtTime(rr(700,1100),t+1.3);
  const am=AC.createGain(),l=AC.createOscillator(),lg=AC.createGain();l.type='square';l.frequency.value=rr(14,24);lg.gain.value=.5;am.gain.value=.5;l.connect(lg);lg.connect(am.gain);
  const g=envG(t,.2,1.2,.2);o.connect(f);f.connect(am);am.connect(g);o.start(t);l.start(t);o.stop(t+1.6);l.stop(t+1.6);chain(g,.4,rr(-.7,.7))},
 whisper(){for(let k=0;k<2;k++){const t=AC.currentTime+k*.25,s=AC.createBufferSource();s.buffer=noiseBuf(1.8);
  const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=rr(2200,3600);f.Q.value=1.4;
  const am=AC.createGain(),l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=rr(5,9);lg.gain.value=.45;am.gain.value=.55;l.connect(lg);lg.connect(am.gain);
  const g=envG(t,.5,1.3,.22);s.connect(f);f.connect(am);am.connect(g);s.start(t);l.start(t);s.stop(t+1.8);l.stop(t+1.8);chain(g,.6,k?.8:-.8)}},
 thumps(){const t0=AC.currentTime;for(let i=0;i<3;i++){const t=t0+i*rr(.45,.65),o=AC.createOscillator();o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(35,t+.25);
  const g=envG(t,.01,.3,.5);o.connect(g);o.start(t);o.stop(t+.4);chain(g,.3,rr(-.4,.4))}},
 howl(){const t=AC.currentTime,o=AC.createOscillator();o.type='sine';o.frequency.setValueAtTime(240,t);o.frequency.linearRampToValueAtTime(520,t+1.1);o.frequency.linearRampToValueAtTime(340,t+2.4);
  const v=AC.createOscillator(),vg=AC.createGain();v.frequency.value=6;vg.gain.value=9;v.connect(vg);vg.connect(o.frequency);
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=1200;const g=envG(t,.9,1.6,.1);o.connect(f);f.connect(g);o.start(t);v.start(t);o.stop(t+2.6);v.stop(t+2.6);chain(g,.9,rr(-.8,.8))},
 musicbox(){const t0=AC.currentTime,notes=[659,622,659,494,523,440,392];let drift=1;notes.forEach((fq,i)=>{const t=t0+i*.42;drift*=.992;
  const o=AC.createOscillator();o.type='triangle';o.frequency.value=fq*drift;const g=envG(t,.01,.9,.07);o.connect(g);o.start(t);o.stop(t+1);chain(g,.8,.3)})},
 knock(){const t0=AC.currentTime;for(let i=0;i<3;i++){const t=t0+i*.32,s=AC.createBufferSource();s.buffer=noiseBuf(.15);const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=380;
  const g=envG(t,.003,.12,.7);s.connect(f);f.connect(g);s.start(t);s.stop(t+.15);chain(g,.25,-.5)}}
};

