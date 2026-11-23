 /* =====================  CYBERPUNK 2077 · NIGHT CITY  ===================== */
 {const id='nightcity',S=()=>ST(id,{ed:0,cred:0,imp:{},gig:null,list:[],done:0,fail:0,th:0,oc:0});
  const IMP={reflex:['Reflex Booster','⚡','+10% eddies per Study Point',60],cache:['Neural Cache','🧠','Gigs get 25% more time',120],armor:['Subdermal Armor','🛡️','A failed gig still pays 40%',180],optic:['Optic Zoom','👁️','Gig rewards +20%',220],clock:['Overclock','🔋','+1 coin for every 5 SP',300]};
  const RK=[['Nobody',0],['Street Rat',3],['Merc',8],["Fixer's Pick",16],['Legend',30]];
  const GT=[['Data siphon','💾',12,15,40],['Courier run','🏍️',20,25,75],['Corporate extraction','🏢',35,40,140]],FIX=['Vex','Moth','Dagger','Nyla','Brick','Sable'];
  const has=(s,k)=>!!s.imp[k],cnt=s=>Object.keys(s.imp).filter(k=>s.imp[k]).length;
  const hum=s=>Math.max(0,Math.min(100,100-cnt(s)*12+s.th*20)),rank=s=>{let r=0;RK.forEach((k,i)=>{if(s.cred>=k[1])r=i});return r};
  const gen=s=>{s.list=GT.map(g=>({t:g[0],i:g[1],need:g[2],min:Math.ceil(g[3]*(has(s,'cache')?1.25:1)),ed:g[4],fx:pick(FIX)}))};
  const sick=s=>hum(s)<30;
  const reward=(s,g)=>Math.round(g.ed*(has(s,'optic')?1.2:1)*(sick(s)?.8:1));
  onSP(id,d=>{const s=S();if(!s.list.length)gen(s);s.ed+=Math.round(d*(1+(has(s,'reflex')?.1:0))*(sick(s)?.8:1));
   if(has(s,'clock')){s.oc+=d;if(s.oc>=5){pay(Math.floor(s.oc/5));s.oc%=5}}
   const g=s.gig;if(!g)return;g.got+=d;if(g.got>=g.need){const r=reward(s,g);s.ed+=r;s.cred++;s.done++;pay(Math.round(g.need*.5),'🌃 Gig done: +'+r+' ₠');splash('GIG COMPLETE','+'+r+' eddies · '+g.fx+' is impressed','#fcee0a','🌃');s.gig=null;gen(s)}});
  tick.push(()=>{if(!X.act(id))return;const s=S();if(!s.list.length)gen(s);document.documentElement.dataset.cyhum=hum(s)<40?'low':'';const g=s.gig;if(g&&now()>g.start+g.min*60000){s.fail++;const r=has(s,'armor')?Math.round(g.ed*.4):0;s.ed+=r;s.gig=null;gen(s);try{toast('🌃 Gig failed: '+g.fx+' is not happy'+(r?' (armor saved '+r+' ₠)':''))}catch(e){}}});
  PAN[id]={ico:'🌃',title:'Fixer Gigs',hud:()=>{const s=S();return `🌃 ${s.ed} ₠ · ${RK[rank(s)][0]} · humanity ${hum(s)}%`},mini:()=>{const s=S();return `🌃 ${s.ed}₠ ${s.gig?s.gig.got+'/'+s.gig.need:''}`},
   body:()=>{const s=S();if(!s.list.length)gen(s);const r=rank(s),nx=RK[r+1],h=hum(s);
    let html=`<p class="sfp"><b>${s.ed} ₠</b> · street cred <b>${RK[r][0]}</b> (${s.cred} gigs${nx?', next at '+nx[1]:''}) · humanity <b>${h}%</b>${sick(s)?' <b style="color:var(--bad)">· CHROME SICKNESS: −20% eddies</b>':''}</p>${bar(h,100)}`;
    if(s.gig){const g=s.gig,left=g.start+g.min*60000-now();html+=`<p class="sfp"><b>${g.i} ${esc(g.t)}</b> for ${esc(g.fx)}</p>${bar(g.got,g.need)}<p class="sfp">${g.need-g.got} SP to go · time left <b>${mmss(left)}</b> · pays ${reward(s,g)} ₠</p>`}
    else html+=`<p class="sfp">Fixers are calling. Pick a gig, then earn Study Points before the timer runs out:</p><div class="sfl">${s.list.map((g,i)=>`<button data-sf="take" data-k="${i}">${g.i} ${esc(g.t)} <small>${g.need} SP in ${g.min} min · ${reward(s,g)} ₠ · ${esc(g.fx)}</small></button>`).join('')}<button data-sf="reroll">🔄 New gigs <small>10 ₠</small></button></div>`;
    html+=`<p class="sfp"><b>Cyberware</b> <small>(each implant costs 12% humanity)</small></p><div class="sfl">${Object.entries(IMP).map(([k,o])=>`<button data-sf="buy" data-k="${k}" ${has(s,k)||s.ed<o[3]?'disabled':''} class="${has(s,k)?'on':''}">${o[1]} ${o[0]} <small>${has(s,k)?'installed':o[3]+' ₠'} · ${o[2]}</small></button>`).join('')}<button data-sf="therapy" ${s.ed<80||h>=100?'disabled':''}>🧘 Therapy <small>80 ₠ · +20 humanity</small></button></div>`;return html},
   act:(a,t)=>{const s=S();if(a==='take'&&!s.gig){const g=s.list[+t.dataset.k];if(g)s.gig=Object.assign({},g,{got:0,start:now()})}
    else if(a==='reroll'&&s.ed>=10&&!s.gig){s.ed-=10;gen(s)}
    else if(a==='buy'){const o=IMP[t.dataset.k];if(o&&!has(s,t.dataset.k)&&s.ed>=o[3]){s.ed-=o[3];s.imp[t.dataset.k]=1;if(t.dataset.k==='cache')gen(s);try{toast('🌃 Installed '+o[0])}catch(e){}}}
    else if(a==='therapy'&&s.ed>=80&&hum(s)<100){s.ed-=80;s.th++}}};
  const V=window.FDVIEW;
  V[id]={s:'#fdview .sc{position:absolute;inset:0;background:repeating-linear-gradient(#0000 0 2px,#00000030 2px 3px);mix-blend-mode:multiply}#fdview .vg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 55%,#000a 100%)}#fdview .k{position:absolute;width:22px;height:22px;border:3px solid #fcee0a}#fdview .k1{left:8px;top:8px;border-right:0;border-bottom:0}#fdview .k2{right:8px;top:8px;border-left:0;border-bottom:0}#fdview .k3{left:8px;bottom:8px;border-right:0;border-top:0}#fdview .k4{right:8px;bottom:8px;border-left:0;border-top:0}#fdview .tk{position:absolute;left:36px;bottom:12px;font:800 11px ui-monospace,Consolas,monospace;color:#fcee0a;letter-spacing:.16em;text-shadow:0 0 8px #fcee0a88;white-space:nowrap}#fdview .gl{position:absolute;left:0;right:0;height:6px;background:#00f0ff22;top:30%}html[data-cyhum="low"] #fdview .vg{box-shadow:inset 0 0 120px #ff2a6d77}',
   a:'#fdview .gl{animation:cyg 6s steps(1) infinite}@keyframes cyg{0%{top:12%;opacity:0}8%{opacity:1}10%{top:48%}12%{opacity:0}60%{top:78%;opacity:0}62%{opacity:1}64%{top:30%;opacity:0}100%{opacity:0}}html[data-cyhum="low"] h1,html[data-cyhum="low"] h2,html[data-cyhum="low"] .big{animation:cyf 2.4s steps(1) infinite}@keyframes cyf{0%,92%,100%{transform:none}94%{transform:translateX(-3px) skewX(6deg)}96%{transform:translateX(3px)}}',
   h:'<i class="sc"></i><i class="vg"></i><i class="gl"></i><i class="k k1"></i><i class="k k2"></i><i class="k k3"></i><i class="k k4"></i><div class="tk"></div>',
   u:e=>{const t=e.querySelector('.tk');if(!t)return;const s=S(),txt='NIGHT CITY · '+s.ed+' ₠ · '+RK[rank(s)][0].toUpperCase()+(s.gig?' · GIG '+s.gig.got+'/'+s.gig.need:'');if(t.textContent!==txt)t.textContent=txt}};
  wire(id,V[id],(c,I)=>{const s=S(),g=c.createLinearGradient(0,0,900,500);g.addColorStop(0,'#07070f');g.addColorStop(1,'#1a0a3a');c.fillStyle=g;c.fillRect(0,0,900,500);
   for(let i=0;i<14;i++){c.fillStyle=i%2?'#00f0ff':'#ff2a6d';c.globalAlpha=.16;c.fillRect(30+i*64,330-((i*53)%150),34,170+((i*53)%150))}c.globalAlpha=1;
   c.fillStyle='#fcee0a';c.fillRect(0,0,900,16);c.fillRect(0,484,900,16);c.strokeStyle='#fcee0a';c.lineWidth=5;c.strokeRect(36,40,828,420);
   c.textAlign='left';c.fillStyle='#fcee0a';c.font='900 24px Impact,Arial Narrow,sans-serif';c.fillText('NIGHT CITY MERC FILE',64,92);
   c.fillStyle='#f2f7ff';c.font='900 52px Impact,Arial Narrow,sans-serif';c.fillText(cut(c,String(I.title).toUpperCase(),760),64,162);
   c.fillStyle='#00f0ff';c.font='700 24px ui-monospace,Consolas,monospace';c.fillText('RANK  '+RK[rank(s)][0].toUpperCase()+'   ·   HUMANITY '+hum(s)+'%',64,214);
   c.fillStyle='#f2f7ff';c.font='700 26px ui-monospace,Consolas,monospace';c.fillText('LV '+I.lv+'   '+I.sp+' SP   '+I.streak+' DAY STREAK',64,268);
   c.fillStyle='#8b95bd';c.font='700 22px ui-monospace,Consolas,monospace';c.fillText(s.done+' GIGS DONE  ·  '+cnt(s)+' IMPLANTS  ·  '+s.ed+' EDDIES',64,316);
   c.fillStyle='#fcee0a';c.font='italic 700 24px ui-monospace,Consolas,monospace';c.fillText(cut(c,'> '+(I.tag||'Wake up, merc. We have a city to study.'),760),64,410)})}

