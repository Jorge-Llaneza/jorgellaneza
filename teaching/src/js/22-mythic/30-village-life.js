/* ======= MYTHIC upgrade for Valley Farm: Village Life. Seasons, animals, a market and villagers who remember you ======= */
(function(){
 const X=window.SFX,PAN=X.PAN,tick=X.tick,esc=X.esc2;
 const {ST,pick,pay,bar,onSP,splash}=window.sfLib;const K=window.MYK;
 const id='valleyfarm',S=()=>ST(id,{coop:0,barn:0,eggs:0,milk:0,pe:0,pm:0,req:[],hearts:{},rdone:0,seen:'',sold:0});
 const SEAS=[['Winter','❄️',[11,0,1]],['Spring','🌸',[2,3,4]],['Summer','☀️',[5,6,7]],['Autumn','🍂',[8,9,10]]];
 const season=()=>{const m=new Date().getMonth();return SEAS.find(x=>x[2].includes(m))||SEAS[0]};
 const FAV={Winter:'pump',Spring:'berry',Summer:'sun',Autumn:'corn'};
 const VIL={willow:['Granny Willow','👵',['Willow tells you the soil here remembers kindness.','"My late husband planted the first row of corn," she says, "and I have never let it go hungry."','She presses a jar of jam into your hands. "You tend this land like he did."']],pete:['Old Pete','🧓',['Pete leans on the fence and squints at your plots.','"Forty years I farmed this valley," he grumbles. "You do it better. Don\'t tell anyone I said so."','He tips his hat. For Pete, that is a hug.']],fern:['Mayor Fern','🎩',['The mayor brings news: your farm is the pride of the valley.','"We are putting your name on the village sign," she announces.','"Right under the cow. The cow insisted."']]};
 const lv=()=>{try{return fLvl()}catch(e){return 1}};
 const maxCoop=()=>2+Math.floor(lv()/2),maxBarn=()=>1+Math.floor(lv()/3);
 const dayN2=()=>{try{return dayN()}catch(e){return Math.floor(Date.now()/864e5)}};
 const price=k=>{const d=dayN2();return +((k==='egg'?6:14)*(.8+((d*(k==='egg'?7:13))%7)/10)).toFixed(0)};
 const mk=(s)=>{const sn=season()[0],har=(FA().har)||{},pool=Object.keys(VIL);let who=pick(pool),kind=Math.random()<.5?'crop':(Math.random()<.5?'egg':'milk'),r;
  if(kind==='egg'&&!s.coop)kind='crop';if(kind==='milk'&&!s.barn)kind='crop';
  if(kind==='crop'){const c=Math.random()<.4?FARMC.find(x=>x.k===FAV[sn])||FARMC[0]:pick(FARMC.filter(x=>x.l<=lv()));const n=2+Math.floor(Math.random()*3);r={who,kind,k:c.k,n,base:har[c.k]||0,reward:Math.round(n*c.c*1.4*(c.k===FAV[sn]?1.5:1)),label:c.e+' '+n+' '+c.n}}
  else{const n=kind==='egg'?4+Math.floor(Math.random()*4):2+Math.floor(Math.random()*2);r={who,kind,n,reward:n*(kind==='egg'?10:22),label:(kind==='egg'?'🥚 ':'🥛 ')+n+(kind==='egg'?' eggs':' milk')}}
  return r};
 const fill=s=>{while(s.req.length<3)s.req.push(mk(s))};
 const prog=(s,r)=>r.kind==='crop'?Math.max(0,((FA().har||{})[r.k]||0)-r.base):(r.kind==='egg'?s.eggs:s.milk);
 const done=(s,i)=>{const r=s.req[i];if(!r)return;const p=prog(s,r);if(p<r.n)return;if(r.kind==='egg')s.eggs-=r.n;else if(r.kind==='milk')s.milk-=r.n;pay(r.reward,'🌾 '+VIL[r.who][0]+' is delighted');s.rdone++;const h=(s.hearts[r.who]||0)+1;s.hearts[r.who]=h;
  s.req.splice(i,1);fill(s);if(h===3||h===6)setTimeout(()=>K.story(VIL[r.who][0]+' · '+(h===3?'Friends':'Family'),(h===3?VIL[r.who][2].slice(0,2):VIL[r.who][2].slice(1)),null,'#8bc34a'),600)};
 onSP(id,d=>{const s=S();s.pe+=d*s.coop;s.pm+=d*s.barn;while(s.pe>=10){s.pe-=10;if(s.eggs<30)s.eggs++}while(s.pm>=20){s.pm-=20;if(s.milk<20)s.milk++}});
 tick.push(()=>{if(!X.act(id))return;const s=S();fill(s);const sn=season(),key=sn[0]+new Date().getFullYear();if(s.seen!==key){const first=s.seen==='';s.seen=key;if(!first){K.banner(sn[0].toUpperCase()+' FESTIVAL',sn[1]+' The village celebrates · +60 coins','#8bc34a',3200);pay(60);try{FA().seeds=Math.min(15,FA().seeds+4)}catch(e){}}}});
 const pend=s=>s.req.filter(r=>prog(s,r)>=r.n).length;
 PAN[id]={ico:'🌾',title:'Village Life',hud:()=>{const s=S(),sn=season();return `🌾 ${sn[1]} ${sn[0]} · 🥚${s.eggs} 🥛${s.milk}${pend(s)?' · <b>'+pend(s)+' request(s) ready</b>':''}`},mini:()=>{const s=S();return `🌾 🥚${s.eggs} 🥛${s.milk}`},
  body:()=>{const s=S(),sn=season();fill(s);let h=`<p class="sfp"><b>${sn[1]} ${sn[0]}</b> · ${FARMC.find(c=>c.k===FAV[sn[0]]).e} in season · lv ${lv()}</p>`;
   h+=`<div class="sfl"><button data-sf="coop" title="1 egg per 10 SP each" ${s.coop>=maxCoop()||M.coins<120?'disabled':''}>🐔 ${s.coop}/${maxCoop()} <small>120 🪙</small></button><button data-sf="barn" title="1 milk per 20 SP each" ${s.barn>=maxBarn()||M.coins<300?'disabled':''}>🐄 ${s.barn}/${maxBarn()} <small>300 🪙</small></button><button data-sf="sell" title="Sell at today's market" ${s.eggs+s.milk<1?'disabled':''}>🧺 🥚${s.eggs} 🥛${s.milk} <small>${s.eggs*price('egg')+s.milk*price('milk')} 🪙</small></button></div>`;
   h+=`<div class="sfl">${s.req.map((r,i)=>{const p=prog(s,r),ok=p>=r.n;return `<button data-sf="req" data-k="${i}" ${ok?'':'disabled'} class="${ok?'on':''}">${VIL[r.who][1]} ${esc(r.label)} <small>${Math.min(p,r.n)}/${r.n} · ${r.reward} 🪙</small></button>`}).join('')}</div>`;return h},
  act:(a,t)=>{const s=S();if(a==='coop'&&s.coop<maxCoop()&&M.coins>=120){M.coins-=120;s.coop++;mDirty=true}
   else if(a==='barn'&&s.barn<maxBarn()&&M.coins>=300){M.coins-=300;s.barn++;mDirty=true}
   else if(a==='sell'&&s.eggs+s.milk>0){const c=s.eggs*price('egg')+s.milk*price('milk');s.sold+=c;s.eggs=0;s.milk=0;pay(c,'🧺 Sold at the market: '+c+' coins')}
   else if(a==='req')done(s,+t.dataset.k)}};
 try{K.fx=1}catch(e){}
})();
