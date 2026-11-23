/* ---------- star wars extras: lightsaber sound and opening crawl ---------- */
function saber(){try{if(!sndOn||!audio())return;const t=AC.currentTime,g=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(300,t);lp.frequency.exponentialRampToValueAtTime(1400,t+.35);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.12);g.gain.setValueAtTime(.12,t+.7);g.gain.exponentialRampToValueAtTime(.0001,t+1.2);
 [70,72.5,140].forEach((f,i)=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f*.5,t);o.frequency.exponentialRampToValueAtTime(f,t+.35);o.connect(lp);o.start(t);o.stop(t+1.25)});
 lp.connect(g);g.connect(master)}catch(e){}}
function swCrawl(){let ov=$('swcrawl');if(!ov){ov=document.createElement('div');ov.id='swcrawl';document.body.appendChild(ov)}saber();
 ov.className='on';ov.innerHTML=`<div class="swt"><div class="swh">A long time ago, in a lab far, far away…</div><div class="swc"><div class="swp"><p class="ctr">EPISODE ∞<br>THE STUDY AWAKENS</p><p>It is a period of heavy homework. Rebel students, striking from a hidden browser tab, have won their first victory against the evil Exam Empire.</p><p>During the battle, the rebels stole the secret plans to the ultimate weapon: the five-stage pipeline. IF, ID, EX, MEM and WB.</p><p>Pursued by sinister stalls and hazards, you race home with the knowledge that can restore freedom to the lab…</p><p class="ctr">May the force be with you - MartinWeb</p></div></div><small>tap to skip</small></div>`;
 const end=()=>{ov.className='';ov.innerHTML=''};ov.onclick=end;setTimeout(end,RM?6000:42000)}

