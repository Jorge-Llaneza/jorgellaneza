
"use strict";
const _c={},$=s=>_c[s]||(_c[s]=document.querySelector(s)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a);
const CFG={vd:1,imaxD:1,imaxL:.12,pmos:4,pbjt:4,vbb:5,beta:100,vf:[3,3,3],lcol:["#bfe3ff","#bfe3ff","#bfe3ff"],vz:5.1,pz:1,dur:90,rLine:1,rMaxW:16,vBase:12,win:[[15,30],[25,40],[10,20],[30,50]],dialMax:60};
const fp=x=>CFG.dialMax<=10?x.toFixed(2):x.toFixed(1);
const CKT={parallel:"Parallel bank",series:"Series string",mixA:"Divider: R1 + (R2 || R3)",mixB:"Ladder: (R1 + R2) || R3",led:"LED array (R + LED per branch)",zener:"Zener shunt regulator",diode:"Series diode drop",mos:"MOSFET switch (NMOS)",bjt:"BJT switch (NPN)",rc:"Capacitor bank: Rs, load and C",rect:"Half-wave rectifier + filter C"};
const NOTE={parallel:"Parallel branches share the same voltage, so each draws I = V/R. Total current adds up and the equivalent resistance falls: 1/R = 1/R1 + 1/R2 + 1/R3.",
 series:"Series elements carry the same current and their resistances add. A module switched off is bypassed (a short).",
 mixA:"R1 carries the whole current; R2 and R3 split it. The node voltage follows the divider rule Vs\u00b7Rp/(R1+Rp).",
 mixB:"R1 + R2 form one branch in parallel with R3. Both branches see the same voltage.",
 led:"An LED conducts only above its forward voltage (about 1.8 V red, 3 V white) and then its voltage barely moves. The series resistor sets the current: R = (Vs \u2212 Vf)/I. Too much current burns it (limit about 120 mA).",
 zener:"A Zener works in reverse breakdown and holds about Vz, but only while Iz > 0. Drop-out: low supply, heavy load or large Rs. Burn-out: Vz\u00b7Iz above its rating (high supply, small Rs). Rs is always needed.",
 diode:"A forward-biased silicon diode drops a roughly constant voltage (the course exercises use 1 V). Diodes in series subtract their drops, and each one must stay under its current rating.",
 mos:"An NMOS is cut off below its threshold (about 2 V). With a strong gate it sits in the ohmic region as a small RDS(on): a closed switch. With a weak gate it enters saturation, acts as a current source and dissipates vDS\u00b7ID.",
 bjt:"In the active region IC = \u03b2\u00b7IB (\u03b2 = 100) and VCE is large, so the transistor dissipates a lot. Saturate it with enough base current (IB \u2265 IC/\u03b2) to use it as a switch with VCE about 0.2 V. IB = (VBB \u2212 0.7)/RB."};
NOTE.rc="A capacitor stores energy: i = C\u00b7dv/dt, and its voltage cannot change instantly. Through a resistor it charges exponentially with \u03c4 = R\u00b7C (about 5\u03c4 to fill). It rides through short sags.";
NOTE.rect="A diode passes current one way only (half-wave rectifier). The filter capacitor charges at the peaks and feeds the load in between, leaving a ripple Vr \u2248 I/(f\u00b7C). A bigger C means less ripple but bigger charging pulses.";
const T9=["parallel","series","mixA","mixB","led","zener","diode","mos","bjt"],T11=[...T9,"rc","rect"],TS=T11.filter(x=>x!=="mos"&&x!=="bjt");
const WIRES=[
 {p:"60,208 60,290 510,290",t:TS,c:"tot",d:-1},{p:"60,208 60,290 400,290",t:["mos","bjt"],c:"tot",d:-1},{p:"60,112 60,70 120,70",t:T11,c:"tot",d:1},{p:"170,70 290,70 290,118",t:TS,c:"tot",d:1},
 {p:"170,70 400,70 400,118",t:["mos","bjt"],c:"tot",d:1},
 {p:"290,70 400,70",t:["parallel","led"],c:"i23",d:1},{p:"400,70 400,118",t:["parallel","led"],c:"i2",d:1},{p:"400,70 510,70 510,118",t:["parallel","led"],c:"i3",d:1},
 {p:"290,202 290,290",t:["parallel"],c:"i1",d:1},{p:"400,202 400,290",t:["parallel","mixA","mixB","zener","rc","rect"],c:"i2",d:1},{p:"510,202 510,290",t:["parallel","series","mixA","mixB","zener","diode","rc","rect"],c:"i3",d:1},
 {p:"290,202 290,250 345,250 345,70 400,70 400,118",t:["series","mixB","diode"],c:"i1",d:1},{p:"400,202 400,250 455,250 455,70 510,70 510,118",t:["series","diode"],c:"tot",d:1},
 {p:"290,202 290,250 345,250 345,70 400,70",t:["mixA","zener","rc","rect"],c:"i1",d:1},{p:"400,70 400,118",t:["mixA","zener","rc","rect"],c:"i2",d:1},{p:"400,70 510,70 510,118",t:["mixA","zener","rc","rect"],c:"i3",d:1},
 {p:"205,70 205,40 510,40 510,118",t:["mixB"],c:"i3",d:1},
 {p:"290,202 290,224",t:["led"],c:"i1",d:1},{p:"290,248 290,290",t:["led"],c:"i1",d:1},{p:"400,202 400,224",t:["led"],c:"i2",d:1},{p:"400,248 400,290",t:["led"],c:"i2",d:1},{p:"510,202 510,224",t:["led"],c:"i3",d:1},{p:"510,248 510,290",t:["led"],c:"i3",d:1},
 {p:"455,70 455,160",t:["zener"],c:"iz",d:1},{p:"455,192 455,290",t:["zener"],c:"iz",d:1},
 {p:"400,202 400,218",t:["mos","bjt"],c:"i2",d:1},{p:"400,254 400,290",t:["mos","bjt"],c:"tot",d:1},{p:"290,202 290,236 372,236",t:["mos","bjt"],c:"g",d:1}];
const E3=[[2,50,1],[2,50,1],[2,50,1]],ALLEV=["surge","sag","target"];
const LV=[
 {n:"First Light",tag:"Resistors",d:"Gentle start: a simple parallel circuit, wide target band, no surprises, forgiving fuse. Hints appear if you drift.",dur:60,win:[[10,40]],ev:[],drain:.35,heat:.4,r:[30,30,10],fuse:8,assist:1,topo:"parallel",m3:0},
 {n:"Two Modules",tag:"Resistors",d:"Parallel or series: you choose the wiring. Demand shifts and the odd surge.",dur:75,win:[[15,30],[25,40]],ev:["surge","target"],drain:.7,heat:.7,topo:"parallel",free:1,m3:0},
 {n:"Series Line",tag:"Resistors",d:"A series string, locked in. Resistances add up. Watch the brownouts.",dur:75,win:[[6,14],[10,20]],ev:["target","sag"],drain:.8,heat:.8,topo:"series",m3:0},
 {n:"Voltage Divider",tag:"Resistors",d:"R1 feeds R2 and R3 in parallel. R1 carries everything, so watch its heat.",dur:80,win:[[8,16],[12,24],[6,12]],ev:["target","surge","sag"],drain:.9,heat:.9,topo:"mixA",m3:1},
 {n:"Ladder Bank",tag:"Resistors",d:"R1 and R2 in series, side by side with R3.",dur:85,win:[[14,26],[18,32],[10,20]],ev:ALLEV,drain:1,heat:1,topo:"mixB",m3:1},
 {n:"Brownout Night",tag:"Resistors",d:"Three modules, switchable wiring and everything that can go wrong.",dur:90,win:[[15,30],[25,40],[10,20],[30,50]],ev:ALLEV,drain:1,heat:1,topo:"parallel",free:1,m3:1},
 {n:"Core Meltdown",tag:"Resistors",d:"A hotter 15 V cell, faster events and tight bands.",dur:100,win:[[18,26],[28,38],[12,18],[34,46]],ev:ALLEV,drain:1.25,heat:1.2,vb:15,fast:.6,topo:"parallel",free:1,m3:1},
 {n:"LED Beacon",tag:"LEDs",d:"Three LED branches. Each resistor sets its LED current, and an LED burns above about 120 mA.",dur:75,win:[[.3,.7],[.45,.85]],pad:[.1,.2],dmax:2,ev:["target","surge"],drain:.8,heat:.8,topo:"led",m3:1,r:[150,150,150],rng:[[40,400,5],[40,400,5],[40,400,5]],vf:[3,3,1.8],lcol:["#bfe3ff","#bfe3ff","#ff4b2b"],names:["R-LED1","R-LED2","R-LED3"]},
 {n:"Zener Regulator",tag:"Zener",d:"A Zener holds the load at Vz only while it carries current. Keep it fed on a sag and cool on a surge.",dur:80,win:[[1.5,3],[2.5,4.5]],pad:[.3,.5],dmax:6,ev:["sag","surge","target"],drain:.9,heat:1,topo:"zener",m3:1,r:[15,25,25],vz:5.1,pz:1,names:["Rs","Load A","Load B"]},
 {n:"Diode Drop",tag:"Diodes",d:"Each silicon diode in line costs about 1 V (the course uses a 1 V forward threshold). Use them as coarse trim and respect the 1 A rating.",dur:75,win:[[6,12],[10,18],[4,9]],ev:["sag","surge","target"],drain:.9,heat:.9,topo:"diode",m3:1,r:[10,10,10],names:["Load R","D1","D2"],fixed:[null,"1 V drop","1 V drop"],dis:[2,3],dmax:30},
 {n:"MOSFET Switch",tag:"MOSFET",d:"Drive the gate hard (well above 2 V) and the MOSFET is a cool closed switch. Half-drive it and it becomes a current source that cooks.",dur:80,win:[[6,12],[10,18]],ev:["sag","target","surge"],drain:.9,heat:.9,topo:"mos",m3:0,r:[2.4,10,10],rng:[[0,12,.5],[4,50,1],[2,50,1]],un:["V","\u03a9","\u03a9"],names:["Gate V","Load","\u2014"],dis:[3],dmax:30},
 {n:"BJT Driver",tag:"BJT",d:"IC = \u03b2\u00b7IB until the collector runs out of headroom. Saturate the transistor to use it as a switch and avoid the hot active region.",dur:80,win:[[8,14],[5,10]],ev:["sag","target","surge"],drain:.9,heat:.9,topo:"bjt",m3:0,r:[1000,10,10],rng:[[100,2000,50],[4,50,1],[2,50,1]],names:["RB","RC","\u2014"],dis:[3],dmax:30},
 {n:"Zener Storm",tag:"Zener",d:"A 7.5 V Zener on a hot 15 V line with heavy events. Size Rs carefully.",dur:90,win:[[3,5],[4,6.5]],pad:[.5,.8],dmax:10,ev:ALLEV,drain:1.1,heat:1.1,vb:15,fast:.7,topo:"zener",m3:1,r:[12,30,30],vz:7.5,pz:1.5,names:["Rs","Load A","Load B"]},
 {n:"LED Overdrive",tag:"LEDs",d:"15 V and three red LEDs. Hotter, faster, less forgiving.",dur:100,win:[[.35,.6],[.5,.8],[.25,.45]],pad:[.1,.2],dmax:2,ev:ALLEV,drain:1.2,heat:1.2,vb:15,fast:.7,topo:"led",m3:1,r:[160,160,160],rng:[[40,400,5],[40,400,5],[40,400,5]],vf:[1.8,1.8,1.8],lcol:["#ff4b2b","#ff7a2b","#ff4b2b"],names:["R-LED1","R-LED2","R-LED3"]},
 {n:"Capacitor Bank",tag:"Capacitors",d:"A capacitor smooths the supply: its voltage cannot jump, so it rides through short sags. Time constant = R\u00b7C.",dur:80,win:[[2.5,5],[3.5,6]],pad:[.5,.8],dmax:8,ev:["sag","surge","target"],drain:.8,heat:.8,topo:"rc",dyn:1,m3:1,r:[10,12,1],rng:[[2,50,1],[4,60,1],[.1,3,.1]],un:["\u03a9","\u03a9","F"],names:["Rs","Load","C"],vc0:6},
 {n:"Rectifier Filter",tag:"Rectifier",d:"A diode charges the filter capacitor only at the peaks. A bigger C means less ripple but bigger charging pulses.",dur:80,win:[[5,9],[7,11]],pad:[1,1.5],dmax:15,ev:["target","surge","sag"],drain:.8,heat:.9,topo:"rect",dyn:1,m3:1,r:[1,10,1],rng:[[1,20,1],[6,60,1],[.05,3,.05]],un:["\u03a9","\u03a9","F"],names:["D+Rs","Load","C"],vc0:8},
 {n:"Cap Storm",tag:"Capacitors",d:"A small capacitor and heavy events. Big swings need a big capacitor, but watch the inrush current.",dur:90,win:[[4,7],[5,8],[3,5]],pad:[.5,.8],dmax:10,ev:ALLEV,drain:1,heat:1.1,fast:.7,topo:"rc",dyn:1,m3:1,r:[4,10,.3],rng:[[2,50,1],[4,60,1],[.1,3,.1]],un:["\u03a9","\u03a9","F"],names:["Rs","Load","C"],vc0:5},
 {n:"Ripple Rush",tag:"Rectifier",d:"15 V peak, faster events, tight bands: tame the ripple without cooking the fuse.",dur:100,win:[[8,12],[10,14],[6,10]],pad:[1,1.5],dmax:25,ev:ALLEV,drain:1.15,heat:1.2,vb:15,fast:.7,topo:"rect",dyn:1,m3:1,r:[1,12,1],rng:[[1,20,1],[6,60,1],[.05,3,.05]],un:["\u03a9","\u03a9","F"],names:["D+Rs","Load","C"],vc0:10}];
const widen=cf=>{const pd=(cf.pad||[2,3]).map(x=>x*DIFF[DF].pad),mn=pd[0]<1?.05:1;return cf.win.map(([a,b])=>[Math.max(mn,+(a-pd[0]).toFixed(2)),+(b+pd[1]).toFixed(2)])};
const applyCfg=cf=>{CFG.vBase=cf.vb||12;CFG.dialMax=cf.dmax||60;CFG.vf=cf.vf||[3,3,3];CFG.lcol=cf.lcol||["#bfe3ff","#bfe3ff","#bfe3ff"];CFG.vz=cf.vz||5.1;CFG.pz=cf.pz||1};
const mkC=cf=>({cf,W:widen(cf),win:0,heat:0,hotT:0,blown:false,rating:cf.fuse||5,vc:cf.vc0||0,hist:[],re:null,r:(cf.r||[10,10,10]).slice(),on:[1,1,cf.m3?1:0],mode:cf.topo,out:null});
LV.push(
 {n:"Twin Grids",tag:"Multi",d:"Two grids at once: a resistor bank and an LED panel. Switch tabs (or press 1 / 2); the other grid keeps running while you look away.",dur:90,ev:ALLEV,drain:1,heat:1,multi:[LV[1],LV[7]]},
 {n:"Regulated Pair",tag:"Multi",d:"A Zener regulator and a MOSFET switch share the ship. Watch the Zener dropping out while you tune the gate.",dur:95,ev:ALLEV,drain:1,heat:1,multi:[LV[8],LV[10]]},
 {n:"Triple Threat",tag:"Multi",d:"Divider, BJT driver and capacitor bank at once. Three grids, one hull, no mercy.",dur:100,ev:ALLEV,drain:1.1,heat:1.1,fast:.8,multi:[LV[3],LV[11],LV[14]]},
 {n:"Grid Master",tag:"Multi",d:"A Zener on a 15 V line, a rectifier filter and red LEDs, with fast events. The final exam.",dur:110,ev:ALLEV,drain:1.2,heat:1.2,fast:.6,multi:[LV[12],LV[15],LV[13]]});
const FAM={"74HC":{VOH:4.9,VOL:.1,VIH:3.15,VIL:1.35,IOH:4,IOL:4,IIH:.001,IIL:.001},"74LS":{VOH:3.4,VOL:.25,VIH:2,VIL:.8,IOH:.4,IOL:8,IIH:.02,IIL:.4},
 "74HCT":{VOH:4.4,VOL:.33,VIH:2,VIL:.8,IOH:4,IOL:4,IIH:.001,IIL:.001},"4000B":{VOH:4.95,VOL:.05,VIH:3.5,VIL:1.5,IOH:.51,IOL:.51,IIH:.001,IIL:.001}};
const GATES=[{y:"Y = (A\u00b7B)'  (NAND2)",pdn:"A and B in series",pun:"A and B in parallel",inv:0},{y:"Y = (A+B)'  (NOR2)",pdn:"A and B in parallel",pun:"A and B in series",inv:0},
 {y:"Y = A\u00b7B  (AND2)",pdn:"A and B in series",pun:"A and B in parallel",inv:1},{y:"Y = A+B  (OR2)",pdn:"A and B in parallel",pun:"A and B in series",inv:1},
 {y:"Y = (A\u00b7B\u00b7C)'  (NAND3)",pdn:"A, B, C in series",pun:"A, B, C in parallel",inv:0},{y:"Y = (A+B+C)'  (NOR3)",pdn:"A, B, C in parallel",pun:"A, B, C in series",inv:0},
 {y:"Y = (A\u00b7B + C)'",pdn:"(A series B) in parallel with C",pun:"(A parallel B) in series with C",inv:0},{y:"Y = ((A+B)\u00b7C)'",pdn:"(A parallel B) in series with C",pun:"(A series B) in parallel with C",inv:0}];
const VTC=(vi,VDD,Vt)=>{let lo=0,hi=VDD;const iN=v=>{const o=vi-Vt;return o<=0?0:v<=o?o*v-v*v/2:o*o/2},iP=v=>{const o=VDD-vi-Vt,s=VDD-v;return o<=0?0:s<=o?o*s-s*s/2:o*o/2};
 for(let n=0;n<40;n++){const m=(lo+hi)/2;if(iN(m)>iP(m))hi=m;else lo=m}return(lo+hi)/2};
const E=(t,p,...k)=>{const e=document.createElement(t);Object.assign(e,p||{});k.flat().forEach(c=>e.append(c));return e};
LV.push(
 {n:"Level Check",tag:"Logic",kind:"logic",d:"Defuse the logic bay: check voltage compatibility between logic families with VOH, VOL, VIH and VIL, and work out both noise margins.",dur:150,mods:["levels","levels"],drain:.8,heat:1},
 {n:"Fan-out Drill",tag:"Logic",kind:"logic",d:"How many gate inputs can one output drive? Use the output and input currents (TTL) and the practical CMOS limit.",dur:180,mods:["fan","fan","levels"],drain:.9,heat:1},
 {n:"Gate Forge",tag:"Logic",kind:"logic",d:"Build CMOS gates from a pull-down network (NMOS) and its dual pull-up network (PMOS).",dur:180,mods:["gate","gate","gate"],drain:.9,heat:1},
 {n:"Inverter Lab",tag:"Logic",kind:"logic",d:"Explore the CMOS inverter transfer curve: find VIL and VIH where the gain reaches \u22121.",dur:200,mods:["vtc","levels"],drain:.9,heat:1},
 {n:"Speed Run",tag:"Logic",kind:"logic",d:"CMOS inputs are capacitors: more loads means slower edges. Estimate rise times and fan-out.",dur:180,mods:["speed","speed","fan"],drain:1,heat:1},
 {n:"Logic Master",tag:"Logic",kind:"logic",d:"Every module at once: transfer curve, gates, levels, fan-out and speed.",dur:300,mods:["vtc","gate","levels","fan","speed"],drain:1.2,heat:1});
const SBX={n:"Sandbox",tag:"Free play",kind:"sandbox",d:"",dur:999,drain:0,heat:1,ev:[]};
const SBM={par:["Parallel / series bank",5],ser:["Series string",2],mixA:["Voltage divider",3],mixB:["Ladder bank",4],led:["LED array",7],zener:["Zener regulator",8],diode:["Series diodes",9],mos:["MOSFET switch",10],bjt:["BJT switch",11],rc:["Capacitor bank",14],rect:["Rectifier + filter",15],logic:["Logic lab (tools)",-1]};
const GF=[(a,b)=>!(a&&b),(a,b)=>!(a||b),(a,b)=>a&&b,(a,b)=>a||b,(a,b,c)=>!(a&&b&&c),(a,b,c)=>!(a||b||c),(a,b,c)=>!((a&&b)||c),(a,b,c)=>!((a||b)&&c)];
let DF="engineer";const DIFF={cadet:{drain:.6,heat:.65,pad:1.4,ev:1.4},engineer:{drain:1,heat:1,pad:1,ev:1},chief:{drain:1.3,heat:1.25,pad:.7,ev:.75}};
const TODAY=new Date().toISOString().slice(0,10),HUE=r=>document.body.classList.contains("cb")?210-170*r:120-120*r;
const CH=[[0,"Chapter 1: Cold Start","Restore emergency power with plain resistors."],[7,"Chapter 2: The Silicon Deck","LEDs, Zeners, diodes and transistors."],[14,"Chapter 3: Storage and Surge","Capacitors and rectifiers."],[18,"Chapter 4: Grid Control","Several grids at once."],[22,"Chapter 5: The Logic Bay","Logic families and CMOS."]];
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const daily=()=>{const r=rng(+TODAY.replace(/-/g,"")),keys=["par","mixA","mixB","led","zener","diode","mos","bjt","rc","rect"],n=1+Math.floor(r()*3),pk=[];while(pk.length<n){const k=keys[Math.floor(r()*keys.length)];if(!pk.includes(k))pk.push(k)}
 const sc=.85+r()*.3;return{n:"Daily Challenge",tag:"Daily",d:`${TODAY}: ${pk.map(k=>SBM[k][0]).join(" + ")}. Same grids for everyone today.`,dur:80+Math.floor(r()*40),ev:ALLEV,drain:1,heat:1,fast:.85,
  multi:pk.map(k=>{const b=LV[SBM[k][1]];return{...b,win:b.win.map(([a,c])=>[+(a*sc).toFixed(2),+(c*sc).toFixed(2)])}})}};
const STOPS=[[0,[74,51,34]],[.5,[168,80,31]],[1,[255,106,26]],[1.3,[255,241,184]]];
const lampCol=b=>b<.05?"#262620":`rgb(${Math.round(60+195*Math.min(1,b))},${Math.round(50+170*Math.min(1,b))},${Math.round(30+150*Math.max(0,b-.6))})`;
const SKIN={parallel:["res","res","res"],series:["res","res","res"],mixA:["res","res","res"],mixB:["res","res","res"],led:["res","res","res"],zener:["res","lamp","lamp"],diode:["lamp","diode","diode"],mos:["drv","lamp","res"],bjt:["res","lamp","res"],rc:["res","lamp","cap"],rect:["diode","lamp","cap"]};
const heatCol=r=>{r=clamp(r,0,1.3);let k=1;while(k<3&&r>STOPS[k][0])k++;const[a,A]=STOPS[k-1],[b,B]=STOPS[k],t=(r-a)/(b-a);
  return`rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t))})`};
const mid=el=>{const r=el.getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2]};

/* Circuit engine: Ohm's law only, no DOM */
class CircuitEngine{
  step(c,h){const m=c.mode,[o1,o2,o3]=c.on,[r1,r2,r3]=c.r,rs=(o1?r1:0)+CFG.rLine,gl=o2?1/r2:0,vc=c.vc,C=o3?r3:.02,
    iin=c.blown?0:m==="rect"?Math.max(0,(c.vin-CFG.vd-vc)/rs):(c.vs-vc)/rs;return Math.max(0,vc+h*(iin-vc*gl)/C)}
  solve(c){
    const INF=Infinity,m=c.mode,[o1,o2,o3]=c.on,[r1,r2,r3]=c.r,L=CFG.rLine;
    const par=(...a)=>{const g=a.reduce((s,x)=>s+(x===INF?0:1/x),0);return g?1/g:INF};
    const out=o=>({rl:INF,rt:INF,i:0,vl:0,bi:[0,0,0],bp:[0,0,0],p:0,ro:[0,0,0],ra:0,br:[0,0,0],iz:0,ax:null,ex:null,...o});
    if(m==="led"){
      let on=[0,1,2].filter(k=>c.on[k]),V=c.vs;const vf=CFG.vf,bi=[0,0,0];
      for(let n=0;n<4&&on.length;n++){const num=c.vs/L+on.reduce((s,k)=>s+vf[k]/c.r[k],0),den=1/L+on.reduce((s,k)=>s+1/c.r[k],0);V=num/den;
        const nx=on.filter(k=>V>vf[k]);if(nx.length===on.length)break;on=nx}
      if(!on.length)V=c.vs;
      on.forEach(k=>{bi[k]=c.blown?0:(V-vf[k])/c.r[k]});
      const i=bi[0]+bi[1]+bi[2],bp=bi.map((x,k)=>x*vf[k]),P=bp[0]+bp[1]+bp[2];
      return out({rl:i?V/i:INF,rt:i?c.vs/i:INF,i,vl:i?V:0,bi,bp,p:P,ro:bi.map((x,k)=>x*x*c.r[k]/CFG.rMaxW),ra:Math.max(...bi)/CFG.imaxL,lr:bi.map(x=>x/CFG.imaxL),br:bi.map(x=>x/.1),
        ex:[`Array voltage = ${V.toFixed(2)} V`,"Each branch: I = (V \u2212 Vf) / R, only if V > Vf",`LED power = Vf\u00b7I = ${fp(P)} W`]});
    }
    if(m==="zener"){
      const rs=(o1?r1:0)+L,gl=(o2?1/r2:0)+(o3?1/r3:0),vz=CFG.vz,vth=gl?c.vs/(1+rs*gl):c.vs;let vn=0,i=0,iz=0;
      if(!c.blown){if(vth>vz){vn=vz;i=(c.vs-vz)/rs;iz=Math.max(0,i-vz*gl)}else{vn=vth;i=gl?c.vs/(rs+1/gl):0}}
      const bi=[i,o2?vn/r2:0,o3?vn/r3:0],bp=[o1?i*i*r1:0,bi[1]*vn,bi[2]*vn];
      return out({rl:gl?1/gl:INF,rt:i?c.vs/i:INF,i,vl:vn,bi,bp,p:bp[1]+bp[2],ro:bp.map(x=>x/CFG.rMaxW),ra:vz*iz/CFG.pz,iz,
        ex:[`Thevenin: Vth = Vs\u00b7RL/(Rs+RL) = ${vth.toFixed(2)} V`,vth>vz?`Vth > Vz: the Zener holds ${vz} V. Iz = I \u2212 IL = ${(iz*1000).toFixed(0)} mA`:"Vth < Vz: drop-out! The Zener is off (Iz = 0)",`Zener power = Vz\u00b7Iz = ${(vz*iz).toFixed(2)} W (rating ${CFG.pz} W)`]});
    }
    if(m==="rc"||m==="rect"){
      const rs=(o1?r1:0)+L,gl=o2?1/r2:0,vc=c.vc||0,rect=m==="rect",iin=c.blown?0:rect?Math.max(0,(c.vin-CFG.vd-vc)/rs):(c.vs-vc)/rs,il=vc*gl,C=o3?r3:.02,dv=(iin-il)/C;
      const bi=[Math.abs(iin),o2?vc/r2:0,Math.abs(dv*C)],bp=[o1?iin*iin*r1:0,bi[1]*vc,0],vss=gl?c.vs/(1+rs*gl):c.vs;
      return out({rl:gl?1/gl:INF,i:Math.abs(iin),vl:vc,bi,bp,p:bp[1],ro:[bp[0]/CFG.rMaxW,bp[1]/CFG.rMaxW,0],dv,
        ex:rect?[`vC = ${vc.toFixed(2)} V, charging current ${iin.toFixed(2)} A (only near the peaks)`,`Ripple estimate: Vr = I/(f\u00b7C) = ${(vc*gl/(.4*C)).toFixed(2)} V  (f = 0.4 Hz here)`,`Load power = vC\u00b2/R = ${fp(bp[1])} W`]
          :[`i = C\u00b7dv/dt = ${(dv*C).toFixed(2)} A, vC = ${vc.toFixed(2)} V`,`Steady state: ${vss.toFixed(2)} V, \u03c4 = (Rs\u2016RL)\u00b7C = ${(C*rs/(1+rs*gl)).toFixed(1)} s`,`Load power = vC\u00b2/R = ${fp(bp[1])} W`]});
    }
    if(m==="diode"){
      const n=(o2?1:0)+(o3?1:0),vd=CFG.vd,i=c.blown||!o1?0:Math.max(0,(c.vs-n*vd)/(L+r1)),bp=[o1?i*i*r1:0,o2?vd*i:0,o3?vd*i:0];
      return out({rl:o1?r1:INF,rt:i?c.vs/i:INF,i,vl:i*r1,bi:[i,i,i],bp,p:bp[0],ro:[bp[0]/CFG.rMaxW,o2?i/CFG.imaxD:0,o3?i/CFG.imaxD:0],
        ex:[`${n} diode${n==1?"":"s"} in line: Vdrop = ${n}\u00b7${vd} V = ${(n*vd).toFixed(1)} V`,`I = (Vs \u2212 Vdrop) / (Rline + R) = ${i.toFixed(2)} A`,`Each diode carries ${i.toFixed(2)} A (limit ${CFG.imaxD} A)`]});
    }
    if(m==="mos"){
      const vgs=o1?r1*(c.vs/CFG.vBase):0,idsat=Math.max(0,2*(vgs-2)),rd=o2?r2:INF;let i=0,vds=c.vs,ax="CUTOFF";
      if(!c.blown&&o2&&idsat>0){const ron=3/idsat;i=c.vs/(rd+L+ron);vds=i*ron;ax="OHMIC";if(vds>3){i=idsat;vds=c.vs-i*(rd+L);ax="SATURATION"}}
      const pl=o2?i*i*r2:0,pm=vds*i;
      return out({rl:o2?r2:INF,rt:i?c.vs/i:INF,i,vl:i*r2,bi:[0,i,0],bp:[0,pl,0],p:pl,ro:[0,pl/CFG.rMaxW,0],ra:pm/CFG.pmos,ax,
        ex:[`vGS = ${vgs.toFixed(1)} V (threshold about 2 V): ${ax}`,ax==="OHMIC"?`Ohmic: RDS(on) = ${(3/idsat).toFixed(2)} \u03a9, a closed switch`:ax==="SATURATION"?`Saturation: current source ID = ${idsat.toFixed(2)} A, vDS = ${vds.toFixed(1)} V. It burns ${pm.toFixed(1)} W!`:"Cut-off: an open switch, no current",`Load power = ${fp(pl)} W`]});
    }
    if(m==="bjt"){
      const ib=o1?Math.max(0,(CFG.vbb-.7)/r1):0,icA=CFG.beta*ib,rd=o2?r2:INF;let i=0,vce=c.vs,ax="CUTOFF";
      if(!c.blown&&o2&&icA>0){const icm=(c.vs-.2)/(rd+L);if(icA>=icm){i=icm;vce=.2;ax="SATURATION"}else{i=icA;vce=c.vs-i*(rd+L);ax="ACTIVE"}}
      const pl=o2?i*i*r2:0,pq=vce*i;
      return out({rl:o2?r2:INF,rt:i?c.vs/i:INF,i,vl:i*r2,bi:[ib,i,0],bp:[0,pl,0],p:pl,ro:[0,pl/CFG.rMaxW,0],ra:pq/CFG.pbjt,ax,
        ex:[`IB = (VBB \u2212 0.7) / RB = ${(ib*1000).toFixed(1)} mA, \u03b2\u00b7IB = ${icA.toFixed(2)} A`,ax==="SATURATION"?`Saturated: IC = Vcc/RC = ${i.toFixed(2)} A, VCE about 0.2 V (a closed switch)`:ax==="ACTIVE"?`Active: IC = \u03b2\u00b7IB = ${i.toFixed(2)} A, VCE = ${vce.toFixed(1)} V. It burns ${pq.toFixed(1)} W!`:"Cut-off: no base current",`Load power = ${fp(pl)} W`]});
    }
    const ra=o1||o2?(o1?r1:0)+(o2?r2:0):INF;let rl;
    if(m==="parallel")rl=par(o1?r1:INF,o2?r2:INF,o3?r3:INF);
    else if(m==="series")rl=(o1?r1:0)+(o2?r2:0)+(o3?r3:0);
    else if(m==="mixA")rl=(o1?r1:0)+par(o2?r2:INF,o3?r3:INF);
    else rl=par(ra,o3?r3:INF);
    const rt=L+rl,i=c.blown||!isFinite(rt)?0:c.vs/rt,vl=isFinite(rl)?i*rl:0;let bi;
    if(m==="parallel")bi=[o1?vl/r1:0,o2?vl/r2:0,o3?vl/r3:0];
    else if(m==="series")bi=[i,i,i];
    else if(m==="mixA"){const vn=vl-(o1?i*r1:0);bi=[i,o2?vn/r2:0,o3?vn/r3:0]}
    else{const ia=ra===INF?0:vl/ra;bi=[ia,ia,o3?vl/r3:0]}
    const bp=bi.map((x,k)=>c.on[k]?x*x*c.r[k]:0);
    return out({rl,rt,i,vl,bi,bp,p:bp[0]+bp[1]+bp[2],ro:bp.map(x=>x/CFG.rMaxW)});
  }
}

/* Synthesized audio (no asset files) */
class Sfx{
  vol=.8;mv=.5;musOn=true;
  setVol(v,m,on){this.vol=v;this.mv=m;this.musOn=on;if(this.mg){this.mg.gain.value=v;this.mus.gain.value=m}}
  mstart(){if(this.mt)return;this.k=0;this.mt=setInterval(()=>this.mstep(),420)}
  mstep(){const c=this.c;if(!c||this.muted||!this.musOn||c.state!=="running"||document.hidden)return;const t=c.currentTime,k=this.k++,dg=this.danger||0,CHD=[[110,130.8,164.8],[87.3,110,130.8],[130.8,164.8,196],[98,123.5,146.8]],ch=CHD[(k>>3)&3];
    const note=(f,ty,g0,len,dur)=>{const o=c.createOscillator(),g=c.createGain();o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(g0,t+Math.min(len,.05));g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(this.mus);o.start(t);o.stop(t+dur+.1)};
    if(k%8===0)ch.forEach(f=>note(f,"triangle",.05,1,3.2));
    if(Math.random()<.35+dg*.6)note(ch[Math.floor(Math.random()*3)]*(Math.random()<.5?2:4),"sine",.045,.02,.7);
    if(dg>.55&&k%2===0)note(55,"sawtooth",.05,.02,.35)}
  init(){if(this.c)return this.c.resume();const c=this.c=new(window.AudioContext||window.webkitAudioContext)();this.mg=c.createGain();this.mg.gain.value=this.vol;this.mg.connect(c.destination);this.mus=c.createGain();this.mus.gain.value=this.mv;this.mus.connect(this.mg);
    this.o=c.createOscillator();this.g=c.createGain();this.o.type="sawtooth";this.g.gain.value=0;this.o.connect(this.g).connect(this.mg);this.o.start();this.mstart()}
  ok(){return this.c&&!this.muted}
  hum(i,d,on){if(!this.c)return;const t=this.c.currentTime;this.o.frequency.setTargetAtTime(48+i*20+d*25,t,.15);
    this.g.gain.setTargetAtTime(on&&!this.muted?.025+Math.min(i,8)*.005:0,t,.15)}
  tone(f,dur=.15,type="square",g=.06,f2=f){if(!this.ok())return;const c=this.c,o=c.createOscillator(),v=c.createGain(),t=c.currentTime;
    o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f2,t+dur);
    v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(v).connect(this.mg);o.start(t);o.stop(t+dur)}
  noise(dur=.5,g=.3){if(!this.ok())return;const c=this.c,n=c.sampleRate*dur,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),v=c.createGain();v.gain.value=g;s.buffer=b;s.connect(v).connect(this.mg);s.start()}
}

class Game{
  constructor(){
    this.eng=new CircuitEngine();this.sfx=new Sfx();this.wires=[...document.querySelectorAll(".wire")];
    this.ps=[];this.cv=$("#fx");this.cx=this.cv.getContext("2d");this.size();addEventListener("resize",()=>this.size());
    this.lvIdx=0;this.lv=LV[0];this.cf=LV[0];this.cs=[];this.ai=0;this.qt=0;this.vc=0;this.tt=0;this.hist=[];this.unlocked=99;try{this.sv=JSON.parse(localStorage.getItem("hr7s")||"{}")}catch(e){this.sv={}}let st0={};try{st0=JSON.parse(localStorage.getItem("hr7set")||"{}")}catch(e){}this.set={vol:.8,mus:.5,musOn:true,calm:!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches),cb:false,big:false,diff:"engineer",...st0};this.calm=false;this.diff="engineer";this.un=["Ω","Ω","Ω"];this.bind();this.scene();this.reset(true);this.applySet();this.last=performance.now();requestAnimationFrame(t=>this.loop(t));
  }
  size(){this.cv.width=innerWidth;this.cv.height=innerHeight}
  scene(){let h="";for(let i=0;i<70;i++)h+=`<circle cx="${rnd(0,800).toFixed(0)}" cy="${rnd(0,110).toFixed(0)}" r="${rnd(.4,1.3).toFixed(1)}" fill="#cfe" style="animation:tw ${rnd(2,5).toFixed(1)}s ${rnd(0,3).toFixed(1)}s ease-in-out infinite"/>`;$("#stars").innerHTML=h;this.rewire();let b="";for(let k=0;k<8;k++)b+=`<rect x="612" y="${108+k*12}" width="36" height="8" rx="2" fill="#1a2a2e"/>`;$("#mfBars").innerHTML=b}
  rewire(){const m=$("#sch").dataset.mode,sp=WIRES.filter(w=>w.t.includes(m));this.wm=sp;
    const cn={};sp.forEach(w=>{const P=w.p.split(" ");P.forEach((q,i)=>{cn[q]=(cn[q]||0)+((i===0||i===P.length-1)?1:2)})});
    const J=Object.keys(cn).filter(k=>cn[k]>=3).map(k=>{const[x,y]=k.split(",");return`<circle cx="${x}" cy="${y}" r="5" fill="#c8793a" stroke="#2a1a10" stroke-width="1.5"/>`}).join("");
    $("#wires").innerHTML=sp.map(w=>`<polyline class="wb" points="${w.p}"/>`).join("")+sp.map(w=>`<polyline class="wire" points="${w.p}"/>`).join("")+J;this.wires=[...document.querySelectorAll(".wire")];this.mkDots()}
  mkDots(){this.dots=[];this.L=[];let h="";this.wires.forEach((w,wi)=>{let L=200;try{L=w.getTotalLength()||200}catch(e){}this.L.push(L);const n=Math.max(2,Math.round(L/38));
    for(let j=0;j<n;j++){h+='<circle r="3" fill="#3fe0d0" stroke="#3fe0d0" stroke-width="6" stroke-opacity=".25" style="display:none"/>';this.dots.push({wi,f:j/n})}});$("#dots").innerHTML=h;this.dEls=[...$("#dots").children]}
  flow(s,dt,c){const run=this.running,K={tot:s.i,i1:s.bi[0],i2:s.bi[1],i3:s.bi[2],i23:s.bi[1]+s.bi[2],iz:s.iz,g:s.ax&&s.ax!=="CUTOFF"?.05:0},I=this.wm.map(m=>K[m.c]);
    const hue=HUE(Math.min(1,s.i/this.rating)),L=this.L;
    this.dots.forEach((d,k)=>{const el=this.dEls[k],w=this.wires[d.wi],cur=I[d.wi],vis=run&&cur>.01;el.style.display=vis?"":"none";if(!vis)return;
      d.f=((d.f+this.wm[d.wi].d*(30+cur*34)*dt/L[d.wi])%1+1)%1;const pt=w.getPointAtLength(d.f*L[d.wi]);
      el.setAttribute("cx",pt.x);el.setAttribute("cy",pt.y);{const col=`hsl(${hue} 95% 64%)`;el.setAttribute("fill",col);el.setAttribute("stroke",col)}});
    const[lo,hi]=CFG.win[this.win],n=Math.round(clamp(s.p/CFG.dialMax,0,1)*8),col=s.p>hi?"#ff4b2b":s.p>=lo?"#3fe0d0":"#ffb42e";
    $("#mf").classList.toggle("on",run&&s.p>.01);[...$("#mfBars").children].forEach((b,k)=>{const on=run&&k>=8-n;b.style.fill=on?col:"#1a2a2e";b.style.filter=on?`drop-shadow(0 0 4px ${col})`:""});
    const fr=this.cf.free,par=c.mode==="parallel";$("#modeKn").setAttribute("cx",fr&&!par?198:148);$("#modeKn").style.opacity=fr?1:.35;
    $("#modeTx").setAttribute("x",fr?(par?191:159):187);$("#modeTx").textContent=fr?(par?"PARALLEL":"SERIES"):"FIXED";$("#cktName").textContent="Circuit: "+CKT[c.mode]}
  setLevel(i,q){const lv=i===-2?daily():i<0?SBX:LV[i];this.lvIdx=i;this.lv=lv;CFG.dur=lv.dur;this.reset();$("#sbBar").hidden=true;if(lv.kind==="sandbox")return this.initSandbox();this.cs=(lv.multi||[lv.kind==="logic"?LV[0]:lv]).map(mkC);this.ai=0;this.tt=0;
    this.qt=1;this.loadCtx(0);this.qt=0;$("#lvName").textContent=i<0?lv.n:`Mission ${i+1}: ${lv.n}`;this.buildTabs();$(".deck").hidden=lv.kind==="logic";$("#logic").hidden=lv.kind!=="logic";if(lv.kind==="logic")this.startLogic(lv);if(!q){this.say(lv.d);this.banner(lv.n)}}
  keep(i){Object.assign(this.cs[i],{heat:this.heat,hotT:this.hotT,blown:this.blown,rating:this.rating,win:this.win,vc:this.vc,hist:this.hist,re:this.re})}
  sim(i,act){const o=this.cs[i];Object.assign(this,{heat:o.heat,hotT:o.hotT,blown:o.blown,rating:o.rating,win:o.win,vc:o.vc,hist:o.hist,cf:o.cf,curI:i});
    this.re=act?o.re:o.r.slice();CFG.win=o.W;applyCfg(o.cf);this.snap=act?null:{r:o.r,on:o.on,mode:o.mode}}
  loadCtx(i){const o=this.cs[i],cf=o.cf;o.re=null;this.sim(i,true);this.un=cf.un||["\u03a9","\u03a9","\u03a9"];const nm=cf.names||["R1","R2","R3"];
    ["#mPar","#mSer"].forEach(s=>$(s).disabled=false);this.setMode(o.mode);if(!cf.free)["#mPar","#mSer"].forEach(s=>$(s).disabled=true);
    $("#s1").checked=!!o.on[0];$("#s2").checked=!!o.on[1];$("#s3").checked=!!o.on[2];$("#s3").disabled=!cf.m3;
    [1,2,3].forEach(k=>{const sl=$("#r"+k+"s"),rg=(cf.rng&&cf.rng[k-1])||E3[k-1];sl.min=rg[0];sl.max=rg[1];sl.step=rg[2]||1;sl.value=o.r[k-1];sl.disabled=!cf.m3&&k===3||!!(cf.dis&&cf.dis.includes(k));
      $("#nm"+k).textContent=nm[k-1];$("#l"+k).textContent=nm[k-1];$("#n"+k).textContent=nm[k-1]==="R"+k?"Module "+k:nm[k-1];sl.dispatchEvent(new Event("input"))});
    $("#noteTx").textContent=NOTE[cf.topo]||"";$("#fuseSel").value=o.rating}
  leave(){this.keep(this.ai);Object.assign(this.cs[this.ai],{r:[+$("#r1s").value,+$("#r2s").value,+$("#r3s").value],on:[$("#s1").checked,$("#s2").checked,$("#s3").checked],mode:$("#sch").dataset.mode})}
  switchTo(i){if(i===this.ai||i>=this.cs.length||this.boomT>0||this.phase==="end")return;this.leave();this.ai=i;this.qt=1;this.loadCtx(i);this.qt=0;this.sfx.tone(520,.08,"triangle",.06)}
  buildTabs(){const t=$("#tabs");t.hidden=this.cs.length<2;t.innerHTML=this.cs.map((o,i)=>`<button class="tab" data-i="${i}"><i class="dot"></i><b>${"ABC"[i]}</b><span>${CKT[o.cf.topo].split(" (")[0].split(":")[0]}</span><span class="tp"></span></button>`).join("")}
  mkMod(kind){
    const G=this,pick=a=>a[Math.floor(Math.random()*a.length)],card=E("div",{className:"card2"}),msg=E("p",{className:"hint"}),btn=E("button",{className:"big",textContent:"Check"}),hb=E("button",{textContent:"Hint (\u22123%)"});
    let title="",body=[],check=()=>false,hint="";const tb=h2=>{const t=E("table");t.innerHTML=h2;return t};
    if(kind==="levels"){const n=Object.keys(FAM),a=pick(n),b=pick(n.filter(x=>x!==a)),D=FAM[a],R=FAM[b];title=`Logic levels: ${a} \u2192 ${b}`;
      const nmh=E("input",{type:"number",step:"0.01"}),nml=E("input",{type:"number",step:"0.01"}),sel=E("select");sel.innerHTML='<option value="">Compatible?</option><option value="y">Yes</option><option value="n">No</option>';
      const H=+(D.VOH-R.VIH).toFixed(2),L=+(R.VIL-D.VOL).toFixed(2);
      body=[tb(`<tr><th></th><th>VOH</th><th>VOL</th><th>VIH</th><th>VIL</th></tr><tr><th>${a} out</th><td>${D.VOH}</td><td>${D.VOL}</td><td>\u2013</td><td>\u2013</td></tr><tr><th>${b} in</th><td>\u2013</td><td>\u2013</td><td>${R.VIH}</td><td>${R.VIL}</td></tr>`),
        E("p",{},"NMH = ",nmh," V"),E("p",{},"NML = ",nml," V"),sel];
      check=()=>nmh.value!==""&&nml.value!==""&&Math.abs(+nmh.value-H)<=.02&&Math.abs(+nml.value-L)<=.02&&sel.value===(H>=0&&L>=0?"y":"n");
      hint="NMH = VOH(driver) \u2212 VIH(receiver); NML = VIL(receiver) \u2212 VOL(driver). The connection is safe only if both are positive."}
    else if(kind==="gate"){const g=pick(GATES),fm=o=>`PDN: ${o.pdn} \u00b7 PUN: ${o.pun} \u00b7 output inverter: ${o.inv?"yes":"no"}`,right=fm(g);
      const uniq=[...new Set([right,fm({pdn:g.pun,pun:g.pdn,inv:g.inv}),fm({pdn:g.pdn,pun:g.pdn,inv:g.inv}),fm({pdn:g.pdn,pun:g.pun,inv:1-g.inv})])].sort(()=>Math.random()-.5),nm="g"+Math.random();
      const rs=uniq.map(o=>{const r=E("input",{type:"radio",name:nm});r._v=o;return r});title="CMOS gate builder";
      body=[E("p",{},"Pick the network that implements ",E("b",{},g.y)),...rs.map((r,i)=>E("label",{className:"row"},r," "+uniq[i]))];check=()=>rs.some(r=>r.checked&&r._v===right);
      hint="NMOS pull-down: series = AND, parallel = OR. The PMOS pull-up is the dual: series where the PDN has parallel, and vice versa. AND and OR are NAND and NOR followed by an inverter."}
    else if(kind==="fan"){const a=pick(Object.keys(FAM)),b=pick(["74LS","74LS","74HC","74HCT"].filter(x=>x!==a)),D=FAM[a],R=FAM[b],N=Math.min(Math.floor(Math.min(D.IOH/R.IIH,D.IOL/R.IIL)),50);title=`Fan-out: ${a} driving ${b}`;
      const inp=E("input",{type:"number",step:"1"});body=[tb(`<tr><th></th><th>IOH</th><th>IOL</th><th>IIH</th><th>IIL</th></tr><tr><th>${a} out</th><td>${D.IOH} mA</td><td>${D.IOL} mA</td><td>\u2013</td><td>\u2013</td></tr><tr><th>${b} in</th><td>\u2013</td><td>\u2013</td><td>${R.IIH} mA</td><td>${R.IIL} mA</td></tr>`),E("p",{},`How many ${b} inputs can one ${a} output drive? N = `,inp)];
      check=()=>inp.value!==""&&+inp.value===N;hint="Fan-out = min(IOH/IIH, IOL/IIL), rounded down. Currents are magnitudes here. For CMOS inputs the practical limit is 50 loads."}
    else if(kind==="speed"){const R=pick([30,40,50,60,75,100]),C=pick([3,4,5,6,8]),N=pick([4,6,8,10,12,16,20]),tr=2.2*R*N*C/1000,inp=E("input",{type:"number",step:"0.1"});title="CMOS speed: capacitive load";
      body=[E("p",{},`A CMOS output has Rout = ${R} \u03a9 and drives ${N} inputs of ${C} pF each (in parallel). Estimate the 10\u201390% rise time (ns): tr = `,inp)];check=()=>inp.value!==""&&Math.abs(+inp.value-tr)<=Math.max(.05*tr,.05);
      hint="Total C = N\u00b7Cin. \u03c4 = R\u00b7C (Lesson 1) and the 10\u201390% rise time is about 2.2\u03c4. Ohm \u00b7 pF = ps, so divide by 1000 for ns."}
    else{const VDD=pick([3.3,5]),Vt=pick([.7,1]),f=v=>VTC(v,VDD,Vt),g=v=>(f(v+.01)-f(v-.01))/.02;let VIL=0,VIH=VDD;
      for(let v=.02;v<VDD;v+=.01)if(g(v)<=-1){VIL=v;break}for(let v=VDD-.02;v>0;v-=.01)if(g(v)<=-1){VIH=v;break}
      const sl=E("input",{type:"range",min:0,max:VDD,step:.05,value:0}),box=E("div"),out=E("p",{className:"val"}),mk2={il:null,ih:null},bIL=E("button",{textContent:"Mark VIL here"}),bIH=E("button",{textContent:"Mark VIH here"});title=`CMOS inverter VTC (VDD ${VDD} V, Vt ${Vt} V)`;
      const view=()=>{const vi=+sl.value,vo=f(vi),gn=g(Math.min(Math.max(vi,.02),VDD-.02));let d="";for(let v=0;v<=VDD+1e-9;v+=VDD/60)d+=(d?"L":"M")+(10+v/VDD*220).toFixed(1)+" "+(150-f(v)/VDD*140).toFixed(1);
        const ln=(m,c)=>m===null?"":`<line x1="${10+m/VDD*220}" y1="10" x2="${10+m/VDD*220}" y2="150" stroke="${c}" stroke-dasharray="3 3"/>`;
        box.innerHTML=`<svg viewBox="0 0 240 160" style="max-width:300px"><rect x="10" y="10" width="220" height="140" fill="#050a0b" stroke="#2b3d42"/><path d="${d}" fill="none" stroke="#3fe0d0" stroke-width="2"/>${ln(mk2.il,"#41e08a")}${ln(mk2.ih,"#ffb42e")}<circle cx="${10+vi/VDD*220}" cy="${150-vo/VDD*140}" r="5" fill="#ff6a1a"/></svg>`;
        out.textContent=`vI = ${vi.toFixed(2)} V \u2192 vO = ${vo.toFixed(2)} V, gain = ${gn.toFixed(2)} (${vi<=Vt?"NMOS off":vi>=VDD-Vt?"PMOS off":"both transistors on"})`};
      sl.oninput=view;bIL.onclick=()=>{mk2.il=+sl.value;view()};bIH.onclick=()=>{mk2.ih=+sl.value;view()};view();
      body=[E("p",{},"Slide vI and watch the gain (slope). VIL and VIH are the points where the gain reaches \u22121. Mark both (\u00b10.15 V)."),sl,box,out,E("div",{className:"row"},bIL,bIH)];
      check=()=>{const ok=mk2.il!==null&&mk2.ih!==null&&Math.abs(mk2.il-VIL)<=.15&&Math.abs(mk2.ih-VIH)<=.15;if(ok)msg.textContent=`NML = VIL \u2212 VOL = ${VIL.toFixed(2)} V, NMH = VOH \u2212 VIH = ${(VDD-VIH).toFixed(2)} V`;return ok};
      hint="Gain = dvO/dvI. In the middle of the transition both transistors conduct and the gain is large and negative. VIL is where the gain first falls to \u22121, VIH where it climbs back to \u22121."}
    const m={kind,card,solved:false};
    btn.onclick=()=>{if(!G.running){msg.textContent="Engage power first.";return}if(m.solved)return;if(check())G.solveMod(m,btn,msg);else{msg.textContent="Not quite (\u22126% integrity).";G.wrongMod()}};
    hb.onclick=()=>{if(!G.running||m.hinted)return;m.hinted=1;G.stab=Math.max(1,G.stab-3);msg.textContent="Hint: "+hint};
    card.append(E("h3",{},title),...body,E("div",{className:"row"},btn,hb),msg);return m}
  startLogic(lv){this.lg={mods:lv.mods.map(k=>this.mkMod(k))};const b=$("#lgCards");b.innerHTML="";this.lg.mods.forEach(m=>b.append(m.card));$("#lgT").textContent=lv.n;$("#lgD").textContent=lv.d+" Engage power, then solve every module before the clock runs out."}
  solveMod(m,btn,msg){m.solved=true;m.card.classList.add("done");btn.disabled=true;if(!msg.textContent.startsWith("NML"))msg.textContent="Solved!";this.stab=Math.min(100,this.stab+6);this.sfx.tone(660,.1,"triangle",.08,990);
    if(this.lg.mods.every(x=>x.solved))this.end(true)}
  wrongMod(){this.st.wrong++;this.stab=Math.max(0,this.stab-6);this.sfx.tone(160,.25,"sawtooth",.1,90);if(this.stab<=0)this.end(false)}
  logicUpdate(dt){
    this.t-=dt;this.el+=dt;const u=this.lg.mods.filter(m=>!m.solved).length;this.stab=clamp(this.stab-u*.3*this.lv.drain*DIFF[DF].drain*dt,0,100);
    const n=this.stab>66?3:this.stab>33?2:this.stab>0?1:0;if(n<this.decks&&n>0){this.decks=n;this.banner(`DECK ${n+1} LOST`,"bad");this.sfx.tone(200,.7,"sawtooth",.15,50);this.say(`Deck ${n+1} lost power.`,"b")}
    this.dg+=((100-this.stab)/100-this.dg)*Math.min(1,dt*4);this.alarm-=dt;if(this.dg>.45&&this.alarm<=0){this.sfx.tone(880,.12,"square",.05);this.alarm=1.1-this.dg*.7}
    if(this.stab<=0||this.t<=0)this.end(false);return this.eng.solve({...this.ctl(),vs:0,blown:true,vc:0,vin:0})}
  initSandbox(){this.running=true;this.phase="run";this.sbBlow=false;$("#engage").textContent="Exit sandbox";$("#sbBar").hidden=false;$("#sbBlow").checked=false;
    const sel=$("#sbSel");sel.innerHTML=Object.entries(SBM).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join("");sel.value="par";this.sbLoad("par");$("#lvName").textContent="Sandbox";this.say("Sandbox: no timer, no failure. Pick any circuit above.")}
  sbLoad(k){if(k==="logic")return this.startLab();const base=LV[SBM[k][1]],v=base.vb||12;this.cs=[mkC({...base,win:[[0,1e3]],pad:[0,0],vb:v})];this.ai=0;this.tt=0;this.evt=null;this.hist=[];
    this.qt=1;this.loadCtx(0);this.qt=0;this.buildTabs();$("#sbV").value=v;$("#sbVo").value=v+" V";$(".deck").hidden=false;$("#logic").hidden=true}
  sandboxUpdate(dt){this.keep(0);this.t0=this.tt;this.sim(0,true);if(!this.sbBlow&&this.heat>.9)this.heat=.9;const r=this.circ(dt);this.tt=this.t0+dt;
    if(!this.sbBlow){this.blown=false;if(this.heat>.95)this.heat=.95}this.cs[0].out=r;this.keep(0);this.t=999;this.stab=100;this.dg=0;this.decks=3;return r.s}
  startLab(){$(".deck").hidden=true;$("#logic").hidden=false;$("#lgT").textContent="Logic lab";$("#lgD").textContent="Free tools from the logic-families lesson. No timer, nothing to defuse.";
    const b=$("#lgCards");b.innerHTML="";b.append(this.labVtc(),this.labFam(),this.labGate())}
  labVtc(){const card=E("div",{className:"card2"}),vdd=E("input",{type:"range",min:1.8,max:6,step:.1,value:5}),vt=E("input",{type:"range",min:.4,max:1.2,step:.05,value:1}),vi=E("input",{type:"range",min:0,max:5,step:.05,value:0}),box=E("div"),out=E("p",{className:"val"}),res=E("p");
    const upd=()=>{[1,2,3].forEach(k=>{const s=$("#r"+k+"s"),g=$("#g"+k);$("#o"+k).value=s.value+" "+(this.un||["\u03a9","\u03a9","\u03a9"])[k-1];g.setAttribute("aria-valuemin",s.min);g.setAttribute("aria-valuemax",s.max);g.setAttribute("aria-valuenow",s.value);g.setAttribute("aria-label",($("#l"+k).textContent||"R"+k)+" "+s.value)})};
    [vdd,vt,vi].forEach(s=>s.oninput=upd);upd();card.append(E("h3",{},"CMOS inverter VTC explorer"),E("label",{className:"row"},"VDD ",vdd),E("label",{className:"row"},"Vt ",vt),E("label",{className:"row"},"vI ",vi),box,out,res);return card}
  labFam(){const card=E("div",{className:"card2"}),A=E("select"),B=E("select"),tb=E("div"),out=E("div");Object.keys(FAM).forEach(k=>{A.append(E("option",{value:k,textContent:k}));B.append(E("option",{value:k,textContent:k}))});B.value="74LS";
    const upd=()=>{const D=FAM[A.value]||FAM["74HC"],R=FAM[B.value]||FAM["74LS"],H=D.VOH-R.VIH,L=R.VIL-D.VOL,hi=D.IOH/R.IIH,lo=D.IOL/R.IIL,N=Math.min(Math.floor(Math.min(hi,lo)),50),ok=H>=0&&L>=0;
      tb.innerHTML=`<table><tr><th></th><th>VOH</th><th>VOL</th><th>VIH</th><th>VIL</th><th>IOH</th><th>IOL</th><th>IIH</th><th>IIL</th></tr><tr><th>${A.value} out</th><td>${D.VOH}</td><td>${D.VOL}</td><td>\u2013</td><td>\u2013</td><td>${D.IOH}</td><td>${D.IOL}</td><td>\u2013</td><td>\u2013</td></tr><tr><th>${B.value} in</th><td>\u2013</td><td>\u2013</td><td>${R.VIH}</td><td>${R.VIL}</td><td>\u2013</td><td>\u2013</td><td>${R.IIH}</td><td>${R.IIL}</td></tr></table>`;
      out.innerHTML=`<p>NMH = ${H.toFixed(2)} V, NML = ${L.toFixed(2)} V \u2192 <b>${ok?(Math.min(H,L)<.3?"compatible, but marginal":"compatible"):"NOT compatible"}</b></p><p>Fan-out HIGH = ${Math.floor(hi)}, LOW = ${Math.floor(lo)} \u2192 N = ${N}${Math.min(hi,lo)>50?" (CMOS limit)":""}</p>`};
    [A,B].forEach(s=>s.onchange=upd);upd();card.append(E("h3",{},"Logic family compatibility"),E("label",{className:"row"},"Driver ",A),E("label",{className:"row"},"Receiver ",B),tb,out);return card}
  labGate(){const card=E("div",{className:"card2"}),sel=E("select"),out=E("div"),cb=["A","B","C"].map(n=>{const c=E("input",{type:"checkbox"});return[n,c]});GATES.forEach((g,i)=>sel.append(E("option",{value:i,textContent:g.y})));
    const upd=()=>{const i=Math.min(+sel.value||0,GATES.length-1),g=GATES[i],[a,b,c]=cb.map(x=>x[1].checked),y=GF[i](a,b,c),n=v=>v?1:0;
      out.innerHTML=`<p>A=${n(a)} B=${n(b)}${i==4||i==5||i>5?" C="+n(c):""} \u2192 <b>Y = ${n(y)}</b></p><p>${g.inv?"Inner NAND/NOR node = "+n(!y)+", then the output inverter. ":(y?"PUN conducts, PDN is off.":"PDN conducts, PUN is off.")}</p><p class="hint">PDN: ${g.pdn}<br>PUN: ${g.pun}${g.inv?"<br>+ output inverter":""}</p>`};
    sel.onchange=upd;cb.forEach(x=>x[1].onchange=upd);upd();card.append(E("h3",{},"CMOS gate lab"),sel,E("div",{className:"row"},...cb.map(([n,c])=>E("label",{className:"row"},c," "+n))),out);return card}
  persist(){try{localStorage.setItem("hr7s",JSON.stringify(this.sv))}catch(e){}}
  saveSet(){try{localStorage.setItem("hr7set",JSON.stringify(this.set))}catch(e){}}
  applySet(){const s=this.set;document.body.classList.toggle("cb",!!s.cb);document.body.classList.toggle("calm",!!s.calm);document.documentElement.classList.toggle("big",!!s.big);this.calm=!!s.calm;
    $("#setVol").value=s.vol;$("#stV").value=Math.round(s.vol*100)+"%";$("#setMv").value=s.mus;$("#stM").value=Math.round(s.mus*100)+"%";$("#setMus").checked=!!s.musOn;$("#setCalm").checked=!!s.calm;$("#setCb").checked=!!s.cb;$("#setBig").checked=!!s.big;
    this.sfx.setVol(s.vol,s.mus,s.musOn);DF=s.diff;this.diff=s.diff;document.querySelectorAll("#settings .dg").forEach(b=>b.classList.toggle("on",b.dataset.d===s.diff))}
  setDiff(d){this.set.diff=d;this.applySet();this.saveSet();if(!$("#lvls").hidden)this.renderLv()}
  debrief(won){const st=this.st,lg=this.lv.kind==="logic",pct=st.tot?Math.round(100*st.band/st.tot):0,sc=Math.round(this.stab*10+this.spares*50+this.decks*100+this.best*5),stars=won?1+(this.stab>=60?1:0)+(this.stab>=85&&this.decks===3?1:0):0;
    const key=this.lvIdx===-2?"d"+TODAY:this.lvIdx,old=this.sv[key];let rec="";
    if(won&&this.lv.kind!=="sandbox"){if(!old||sc>old.score||stars>old.stars){this.sv[key]={stars:Math.max(stars,old?old.stars:0),score:Math.max(sc,old?old.score:0)};this.persist();rec=" New best!"}}
    const L=[];if(lg)L.push(`Wrong answers: ${st.wrong}`);else{L.push(`Time inside the target band: ${pct}%`,`Fuses blown: ${st.blown}`,`Overheat events: ${st.hot}`,`Best streak: ${Math.round(this.best)} s`)}L.push(`Decks still lit: ${this.decks}/3`);
    const T=[];if(st.blown)T.push("A fuse blew because the current passed its rating. Size the resistance first (I = V/R), then choose the rating.");
    if(st.hot)T.push("A part overheated. Check P = I\u00b2R for resistors, Vz\u00b7Iz for a Zener and VDS\u00b7ID or VCE\u00b7IC for a transistor in its linear region.");
    if(!lg&&pct<50)T.push("You spent most of the time outside the band. Use the live calculation panel and the Field notes.");if(lg&&st.wrong>2)T.push("Hints cost only 3%. Use them before guessing.");
    const nx=CH.find(c=>c[0]===this.lvIdx+1);
    return`<p><b class="stars">${"\u2605".repeat(stars)}${"\u2606".repeat(3-stars)}</b>${rec}  Score ${sc}</p><ul style="margin:4px 0 6px;padding-left:18px">${L.map(x=>`<li>${x}</li>`).join("")}</ul>${T.map(x=>`<p>\u25b8 ${x}</p>`).join("")}${won&&nx?`<p><b>Chapter complete.</b> Next: ${nx[1]}.</p>`:""}`}
  suggest(){const c=this.ctl(),[lo,hi]=CFG.win[this.win],m=(lo+hi)/2;let best=10,bd=1e9;
    for(let r=2;r<=50;r++){const q=this.eng.solve({...c,blown:false,r:[r,r,r]}),d=Math.abs(q.p-m);if(d<bd&&q.bp.every(x=>x<=CFG.rMaxW)){bd=d;best=r}}return best}
  alert(k,s){const K=k+(this.curI||0),L=this.seen[K];if(this.tut>=0||this.lv.kind==="sandbox"||(L!==undefined&&this.el-L<40)||this.el-this.lastPop<8)return;this.seen[K]=this.el;this.lastPop=this.el;
    const pick=a=>a[Math.floor(Math.random()*a.length)],side=s?(s.ra>Math.max(...s.ro)?"silicon":["left","middle","right"][s.ro.indexOf(Math.max(...s.ro))]):"left";
    const M={surge:["The cell is feeling dramatic. Everything downstream is about to find out.","Voltage went up. Not naming names, but resistors hate that."],
      sag:["The cell looks tired. Something down the line might be starving.","Voltage is sagging. The mainframe is sighing audibly."],
      blown:["The little glass thing that protects everything just gave up.","Something went pop. It was the thing meant to prevent pops."],
      hot:[`The ${side} part is getting very warm. Very.`,`Smells like toast. The ${side} part, maybe?`],
      low:["The needle and the cyan band are not on speaking terms.","The mainframe asks: is this really the best you can do? (or too much?)"]}[k];
    const POOL=["#r1","#r2","#fuse","#dial","#modeSw","#mf","#r1s","#r2s","#swap","#src","#mSer"],W=210,box=$("#toasts"),el=$(pick(POOL)),r=el.getBoundingClientRect();
    const d=document.createElement("div"),mk=(t,txt)=>{const e=document.createElement(t);e.textContent=txt;return e};
    d.className="toast";d.setAttribute("role","alert");
    d.style.left=clamp(r.left+(window.scrollX||0)+r.width/2-W/2+rnd(-30,30),4,innerWidth-W-14)+"px";
    d.style.top=Math.max(4,r.top+(window.scrollY||0)+r.height/2-30+rnd(-20,20))+"px";d.style.setProperty("--rot",rnd(-3,3).toFixed(1)+"deg");
    const x=mk("button","\u00d7");x.className="x";x.setAttribute("aria-label","Close notice");x.onclick=()=>d.remove();
    d.append(x,mk("b",(this.cs.length>1?"Grid "+"ABC"[this.curI||0]+": ":"")+pick(["Psst.","Uh-oh.","Heads up.","Just saying\u2026","Hmm."])),mk("p",pick(M)));
    box.prepend(d);while(box.children.length>3)box.lastChild.remove();this.sfx.tone(660,.12,"square",.04,440)}
  menu(){this.reset();$("#sbBar").hidden=true;this.phase="menu";this.overlay(["Mission select","Choose a mission. Clearing one unlocks the next.","",0,1])}
  restart(){if(this.tut>=0||this.lv.kind==="sandbox")this.menu();else this.setLevel(this.lvIdx,1)}
  unlock(n){n=Math.min(n,LV.length-1);if(n>this.unlocked){this.unlocked=n;try{localStorage.setItem("hr7",n)}catch(e){}}}
  renderLv(){const S=this.sv,star=n=>"\u2605".repeat(n)+"\u2606".repeat(3-n),tot=LV.reduce((a,_,i)=>a+(S[i]?S[i].stars:0),0),dd=S["d"+TODAY];
    let o=`<div class="row"><b>Difficulty</b>${["cadet","engineer","chief"].map(d=>`<button class="dg${this.set.diff===d?" on":""}" data-d="${d}">${d[0].toUpperCase()+d.slice(1)}</button>`).join("")}<span class="hint">\u2605 ${tot}/${LV.length*3}</span></div>`;
    o+=`<button class="lv" data-i="-2"><b>Daily Challenge \u00b7 ${TODAY} <span class="stars">${star(dd?dd.stars:0)}</span></b><span>New grids every day${dd?` \u00b7 best ${dd.score}`:""}</span></button>`;
    LV.forEach((l,i)=>{const c=CH.find(x=>x[0]===i);if(c)o+=`<h4 class="chap">${c[1]}<small>${c[2]}</small></h4>`;const b=S[i];o+=`<button class="lv" data-i="${i}"><b>${i+1}. ${l.n} <span class="stars">${star(b?b.stars:0)}</span></b><span>${l.tag} \u00b7 ${l.d}${b?` \u00b7 best ${b.score}`:""}</span></button>`});
    $("#lvls").innerHTML=o}
  ambient(){this.paT=rnd(9,14);const L=this.stab<40?["Crew, brace for power loss.","Relay engineer, we are losing the decks!"]:this.dg>.5?["Warning: relay overheating.","Engineering, check that fuse."]:["Hydroponics: all stable.",`Dawn shift in ${Math.ceil(this.t)} seconds.`,"Medbay asks for steady power."];$("#pa").textContent="Ship PA: "+L[Math.floor(Math.random()*L.length)]}
  tutStart(){this.sfx.init();this.setLevel(1,1);this.tut=0;$("#lvName").textContent="Training run";this.steps=[
    {t:"Training run",x:"Press Engage power to energize the relay. This is a safe sandbox: no timer, and nothing can explode.",hl:"#engage"},
    {t:"Read the dial",x:"The needle shows the power reaching the mainframe. In a mission you keep it inside the cyan band.",hl:"#dial",next:1},
    {t:"Ohm’s law: V = I·R",x:"The cell pushes 12 V. More resistance means less current. Drag R1 above 30 Ω (slider, or drag the resistor on the board) and watch the ammeter and the calculation panel.",hl:"#r1s",ok:(s,c)=>c.r[0]>=30},
    {t:"Power: P = I²·R",x:"Power is current squared times resistance. Adjust R1 and R2 until the needle sits inside the cyan band.",hl:"#dial",ok:s=>s.p>=15&&s.p<=30},
    {t:"Series wiring",x:"Press Series. Resistors in series add up (R = R1 + R2), so the current falls.",hl:"#mSer",ok:(s,c)=>c.mode==="series"},
    {t:"Parallel wiring",x:"Back to Parallel. Branches share the voltage and lower the total resistance (1/R = 1/R1 + 1/R2), so the current rises.",hl:"#mPar",ok:(s,c)=>c.mode==="parallel"},
    {t:"Fuses and heat",x:"Set both resistors to 2–3 Ω. The current passes the fuse rating and the filament glows. In a mission it blows after a couple of seconds: fit a spare, and pick a rating that protects the resistors (16 W max).",hl:"#swap",next:1},
    {t:"Hazards",x:"In the mission, surges and brownouts change the cell voltage and the mainframe’s demand shifts. Each lost deck dims the ship. Hold the band until dawn.",hl:"#view",next:1}];this.tutShow()}
  tutShow(){const st=this.steps[this.tut];document.querySelectorAll(".hl").forEach(e=>e.classList.remove("hl"));$("#coach").hidden=false;
    $("#cTitle").textContent=`${this.tut+1} of ${this.steps.length}: ${st.t}`;$("#cText").textContent=st.x;$("#cNext").textContent=st.next?"Next":"Skip step";
    const e=$(st.hl);if(e)e.classList.add("hl");this.sfx.tone(700,.08,"triangle",.06)}
  tutNext(){this.tut++;if(this.tut>=this.steps.length){this.menu();this.banner("TRAINING COMPLETE","ok");return}this.tutShow()}
  tutUpdate(dt){const c=this.ctl(),s=this.eng.solve(c);this.heat=s.i>this.rating?Math.min(.95,this.heat+dt*.4):Math.max(0,this.heat-dt*.5);this.dg=this.heat;
    const st=this.steps[this.tut];if(st&&st.ok&&st.ok(s,c))this.tutNext();return s}
  reset(first){
    Object.assign(this,{running:false,phase:first?"brief":"ready",t:CFG.dur,stab:100,evt:null,evtLeft:0,nextEvt:12,win:0,heat:0,blown:false,
      rating:5,spares:3,decks:3,dg:0,fl:0,boomT:0,alarm:0,el:0,tut:-1,paT:6,sk:0,best:0,won:false,hintT:3,re:null,seen:{},lastPop:-99,hotT:0,st:{band:0,tot:0,blown:0,hot:0,wrong:0}});
    $("#coach").hidden=true;$("#toasts").innerHTML="";$("#tabs").hidden=true;document.querySelectorAll(".hl").forEach(e=>e.classList.remove("hl"));$("#fuseSel").value="5";$("#spares").textContent=3;$("#log").innerHTML="";$("#engage").textContent="Engage power";$("#timer").classList.remove("low");
    this.overlay(first?["Halcyon Relay 7","A micrometeoroid strike cut the main feed. You are the only engineer on the relay bus, and three crew decks draw from your two modules. Hold the mainframe in its power band until the dawn shift. Starve it and the decks go dark one by one. Overload it and the relay detonates.","Take the console",0]:null);
    if(!first)$("#overlay").hidden=true;
    this.say("Set the loads, then engage power.");
  }
  overlay(a){if(!a)return;$("#oDeb").innerHTML=this.phase==="end"?this.deb||"":"";const[t,p,b,fail,mn]=a;$("#lvls").hidden=!mn;$("#oBtn").hidden=!!mn;$("#oMenu").hidden=!!mn;if(mn)this.renderLv();$("#oTitle").textContent=t;$("#oText").textContent=p;$("#oBtn").textContent=b;$(".card").classList.toggle("fail",!!fail);$("#overlay").hidden=false}
  bind(){
    const upd=()=>{[1,2,3].forEach(k=>$("#o"+k).value=$("#r"+k+"s").value+" "+(this.un||["Ω","Ω","Ω"])[k-1])};
    ["r1s","r2s","r3s"].forEach(id=>$("#"+id).addEventListener("input",()=>{upd();if(!this.qt)this.sfx.tone(300+ +$("#"+id).value*8,.05,"triangle",.04)}));
    ["s1","s2","s3"].forEach(id=>$("#"+id).addEventListener("input",()=>{if(!this.qt)this.sfx.tone(180,.08,"square",.05)}));upd();
    const mode=m=>{$("#sch").dataset.mode=m;(SKIN[m]||SKIN.parallel).forEach((s,i)=>$("#sch").dataset["s"+(i+1)]=s);this.rewire();$("#mPar").classList.toggle("on",m==="parallel");$("#mSer").classList.toggle("on",m==="series");
      $("#mPar").setAttribute("aria-pressed",m==="parallel");$("#mSer").setAttribute("aria-pressed",m==="series");if(!this.qt)this.sfx.tone(140,.12,"square",.07)};
    this.setMode=mode;$("#mPar").onclick=()=>mode("parallel");$("#mSer").onclick=()=>mode("series");
    $("#modeSw").onclick=()=>$($("#sch").dataset.mode==="parallel"?"#mSer":"#mPar").click();
    $("#fuse").addEventListener("click",()=>$("#swap").click());
    [["#fuse","Replace fuse"],["#modeSw","Switch bus wiring"]].forEach(([s,l])=>{const e=$(s);e.setAttribute("tabindex","0");e.setAttribute("role","button");e.setAttribute("aria-label",l);e.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();e.dispatchEvent(new Event("click"))}})});
    [1,2,3].forEach(k=>{const g=$("#g"+k),sl=$("#r"+k+"s");let y0=null,v0=0;g.style.touchAction="none";
      const set=v=>{if(sl.disabled)return;const st=+sl.step||1;sl.value=clamp(Math.round(v/st)*st,+sl.min,+sl.max);sl.dispatchEvent(new Event("input"))};
      g.addEventListener("pointerdown",e=>{y0=e.clientY;v0=+sl.value;g.setPointerCapture(e.pointerId)});
      g.addEventListener("pointermove",e=>{if(y0!==null)set(v0+(y0-e.clientY)*(sl.max-sl.min)/190)});
      g.addEventListener("pointerup",()=>{y0=null});
      g.addEventListener("wheel",e=>{e.preventDefault();set(+sl.value-Math.sign(e.deltaY)*Math.max(+sl.step||1,(sl.max-sl.min)/50))},{passive:false});
      g.setAttribute("tabindex","0");g.setAttribute("role","slider");
      g.addEventListener("keydown",e=>{const st=+sl.step||1,bg=Math.max(st,(sl.max-sl.min)/10);let v=null;if(e.key==="ArrowUp"||e.key==="ArrowRight")v=+sl.value+st;else if(e.key==="ArrowDown"||e.key==="ArrowLeft")v=+sl.value-st;else if(e.key==="PageUp")v=+sl.value+bg;else if(e.key==="PageDown")v=+sl.value-bg;
        else if(e.key==="Enter"||e.key===" "){e.preventDefault();$("#s"+k).click();return}if(v!==null){e.preventDefault();set(v)}});
      g.addEventListener("dblclick",()=>{const c=$("#s"+k);c.checked=!c.checked;c.dispatchEvent(new Event("input"))})});
    $("#mute").onclick=()=>{this.sfx.muted=!this.sfx.muted;$("#mute").textContent=this.sfx.muted?"Sound off":"Sound on";$("#mute").setAttribute("aria-pressed",!!this.sfx.muted)};
    $("#engage").onclick=()=>{if(this.boomT>0||this.phase==="brief")return;this.sfx.init();
      if(this.running)return this.restart();
      this.running=true;this.phase=this.tut>=0?"tut":"run";if(this.tut===0)this.tutNext();$("#engage").textContent="Abort mission";this.banner("POWER ENGAGED","ok");this.sfx.tone(110,.6,"sawtooth",.12,330);this.say("Power engaged. Hold the target band.")};
    $("#oBtn").onclick=()=>{this.sfx.init();if(this.phase==="brief")this.menu();else if(this.won)this.setLevel(this.lvIdx>=0&&this.lvIdx<LV.length-1?this.lvIdx+1:this.lvIdx);else this.restart()};
    $("#oMenu").onclick=()=>this.menu();$("#menuBtn").onclick=()=>{if(this.boomT<=0)this.menu()};$("#oDaily").onclick=()=>{this.sfx.init();this.setLevel(-2)};
    $("#setBtn").onclick=()=>{$("#settings").hidden=false;$("#setClose").focus()};$("#setClose").onclick=()=>{$("#settings").hidden=true};
    [["setVol","vol",1],["setMv","mus",1],["setMus","musOn",0],["setCalm","calm",0],["setCb","cb",0],["setBig","big",0]].forEach(([id,k,n])=>{const e=$("#"+id);e[n?"oninput":"onchange"]=()=>{this.set[k]=n?+e.value:e.checked;this.applySet();this.saveSet()}});
    $("#settings").addEventListener("click",e=>{const d=e.target.closest(".dg");if(d)this.setDiff(d.dataset.d)});
    let armed=0;$("#setReset").onclick=()=>{const b=$("#setReset");if(!armed){armed=1;b.textContent="Click again to confirm";setTimeout(()=>{armed=0;b.textContent="Reset saved progress"},3000)}else{armed=0;this.sv={};this.persist();b.textContent="Progress cleared"}};$("#oSand").onclick=()=>{this.sfx.init();this.setLevel(-1)};
    $("#sbSel").onchange=()=>this.sbLoad($("#sbSel").value);$("#sbV").oninput=()=>{const v=+$("#sbV").value;if(this.cs[0])this.cs[0].cf.vb=v;$("#sbVo").value=v+" V"};
    $("#sbS").onclick=()=>{this.evt="surge";this.evtLeft=1e9};$("#sbG").onclick=()=>{this.evt="sag";this.evtLeft=1e9};$("#sbN").onclick=()=>{this.evt=null};$("#sbBlow").onchange=()=>{this.sbBlow=$("#sbBlow").checked};$("#tabs").onclick=e=>{const b=e.target.closest(".tab");if(b)this.switchTo(+b.dataset.i)};
    addEventListener("keydown",e=>{if(this.cs.length>1&&"123".includes(e.key)&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName||""))this.switchTo(+e.key-1)});
    $("#lvls").onclick=e=>{const dgb=e.target.closest(".dg");if(dgb){this.setDiff(dgb.dataset.d);return}const b=e.target.closest(".lv");if(b&&!b.disabled){this.sfx.init();this.setLevel(+b.dataset.i)}};
    $("#oTut").onclick=()=>this.tutStart();$("#tutBtn").onclick=()=>{if(this.boomT<=0)this.tutStart()};$("#cNext").onclick=()=>this.tutNext();$("#cSkip").onclick=()=>this.menu();$("#swap").onclick=()=>{if(this.spares<1)return this.say("No spare fuses left.","b");
      this.spares--;this.rating=+$("#fuseSel").value;this.heat=0;this.blown=false;$("#spares").textContent=this.spares;this.say(`Fitted a ${this.rating} A fuse.`);this.sfx.tone(600,.1,"square",.07,900)};
  }
  ctl(){const f=this.evt==="surge"?1.2:this.evt==="sag"?.85:1;
    return{vc:this.vc||0,vin:CFG.vBase*f*Math.sin(2.5133*(this.tt||0)),vs:CFG.vBase*f,mode:this.snap?this.snap.mode:$("#sch").dataset.mode,blown:this.blown,r:this.re||(this.snap?this.snap.r:[+$("#r1s").value,+$("#r2s").value,+$("#r3s").value]),on:this.snap?this.snap.on:[$("#s1").checked,$("#s2").checked,$("#s3").checked]}}
  say(m,c=""){const li=document.createElement("li");li.textContent=m;if(c)li.className=c;const l=$("#log");l.prepend(li);while(l.children.length>6)l.lastChild.remove()}
  banner(t,c=""){$("#pa").textContent="Ship PA: "+t;const b=$("#banner");b.className="";void b.offsetWidth;b.textContent=t;b.className="show "+c}
  emit(x,y,n,sp,col){if(this.calm)n=Math.ceil(n*.3);for(let i=0;i<n;i++){const a=rnd(0,6.28),v=rnd(.2,1)*sp;this.ps.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-sp*.3,l:rnd(.4,1),c:col,r:rnd(1,3)})}}

  loop(now){
    const dt=Math.min(.1,(now-this.last)/1000);this.last=now;
    const T=[+$("#r1s").value,+$("#r2s").value,+$("#r3s").value];this.re=this.re?this.re.map((v,k)=>{const sl=$("#r"+(k+1)+"s"),sp=(sl.max-sl.min)*.8*dt;return v+clamp(T[k]-v,-sp,sp)}):T;const s=this.running?this.update(dt):this.eng.solve({...this.ctl(),vs:0,blown:true,vc:0,vin:0});
    this.draw(s,dt);requestAnimationFrame(t=>this.loop(t));
  }
  update(dt){
    if(this.lv.kind==="sandbox")return this.sandboxUpdate(dt);if(this.lv.kind==="logic")return this.logicUpdate(dt);if(this.tut>=0)return this.tutUpdate(dt);this.t-=dt;this.el+=dt;this.nextEvt-=dt;this.paT-=dt;if(this.paT<=0)this.ambient();
    if(this.evt&&(this.evtLeft-=dt)<=0){this.evt=null;this.say("Grid voltage back to nominal.")}
    if(this.nextEvt<=0)this.fire();
    this.keep(this.ai);const t0=this.tt;this.t0=t0;let d=0,allIn=true,anyBlown=false,hot=0,mh=0,s=null;
    this.cs.forEach((o,i)=>{this.sim(i,i===this.ai);const r=this.circ(dt);o.out=r;if(i===this.ai)s=r.s;
      if(r.blown){anyBlown=true;d-=4}else if(!r.inBand){allIn=false;d-=1+r.dev*.12}
      d-=r.hp;hot+=r.hot;mh=Math.max(mh,this.heat);this.keep(i)});
    this.tt=t0+dt;this.sim(this.ai,true);this.st.tot+=dt;if(allIn&&!anyBlown)this.st.band+=dt;const[lo,hi]=CFG.win[this.win];
    if(allIn&&!anyBlown){d+=4;this.sk+=dt;this.best=Math.max(this.best,this.sk);if(this.sk>10)d+=1}else this.sk=0;
    if(d<0)d*=this.lv.drain*.7*DIFF[DF].drain;if(this.stab<50)this.alert("low",s);this.stab=clamp(this.stab+d*dt,0,100);
    if(this.lv.assist&&!this.blown&&(s.p<lo||s.p>hi)&&(this.hintT-=dt)<=0){this.hintT=6;$("#pa").textContent=s.p<lo?"Hint: power is low. Lower a resistor so more current flows.":"Hint: power is high. Raise a resistor to cut the current."}
    const n=this.stab>66?3:this.stab>33?2:this.stab>0?1:0;
    if(n<this.decks&&n>0){this.decks=n;this.banner(`DECK ${n+1} LOST`,"bad");this.sfx.tone(200,.7,"sawtooth",.15,50);this.say(`Deck ${n+1} lost power.`,"b")}
    const tgt=Math.max((100-this.stab)/100,mh,hot?.8:0,anyBlown?.7:0);this.dg+=(tgt-this.dg)*Math.min(1,dt*4);
    this.alarm-=dt;if(this.dg>.45&&this.alarm<=0){this.sfx.tone(880,.12,"square",.05);this.alarm=1.1-this.dg*.7}
    if(this.stab<=0)this.end(false);else if(this.t<=0)this.end(true);
    return s;
  }
  circ(dt){
    if(this.cf.dyn){for(let k=0;k<8;k++){this.tt=this.t0+dt*(k+1)/8;this.vc=this.eng.step(this.ctl(),dt/8)}this.hist.push([this.ctl().vin,this.vc]);if(this.hist.length>200)this.hist.shift()}
    const s=this.eng.solve(this.ctl()),[lo,hi]=CFG.win[this.win],hot=[...s.ro,s.ra].filter(x=>x>1).length,tag=this.cs.length>1?" \u00b7 Grid "+"ABC"[this.curI]:"";
    if(!this.blown){
      if(s.i>this.rating){this.heat+=dt*(s.i/this.rating)**2*.2*this.lv.heat*DIFF[DF].heat;
        if(this.heat>=1){this.blown=true;this.heat=1;this.st.blown++;this.say(`Fuse blown at ${s.i.toFixed(1)} A!${tag}`,"b");this.banner("FUSE BLOWN"+tag,"bad");
          this.sfx.noise(.3,.4);this.sfx.tone(160,.4,"sawtooth",.15,40);const[x,y]=mid($("#fuse"));this.emit(x,y,80,300,"#ffb060");this.alert("blown",s)}}
      else this.heat=Math.max(0,this.heat-dt*.5);
    }
    this.hotT=hot?this.hotT+dt:0;let hp=0;if(this.hotT>1.5){if(this.hotT-dt<=1.5)this.st.hot++;this.alert("hot",s);hp=3*hot}
    return{s,hot,hp,blown:this.blown,inBand:s.p>=lo&&s.p<=hi,dev:s.p<lo?lo-s.p:s.p-hi};
  }

  fire(){
    this.nextEvt=(Math.max(8,14-this.el/20)+rnd(0,5))*(this.lv.fast||1)*DIFF[DF].ev;
    const E=this.lv.ev;if(!E.length){this.nextEvt=1e9;return}const e=E[Math.floor(Math.random()*E.length)];this.sfx.tone(520,.2,"square",.07,260);
    if(e==="target"){const j=Math.floor(Math.random()*this.cs.length),o=this.cs[j];o.win=(o.win+1)%o.W.length;if(j===this.ai)this.win=o.win;this.say(`${this.cs.length>1?"Grid "+"ABC"[j]+": ":""}Mainframe demand changed: ${o.W[o.win].join("\u2013")}.`,"w");this.banner("DEMAND SHIFT");return}
    this.evt=e;this.evtLeft=7;this.banner(e==="surge"?"SURGE INBOUND":"BROWNOUT","bad");this.alert(e,this.eng.solve(this.ctl()));
    this.say(e==="surge"?"Surge! Source voltage up 20%.":"Brownout! Source voltage down 15%.","w");
  }
  end(won){
    this.running=false;this.phase="end";this.won=won;this.deb=this.debrief(won);if(won)this.unlock(this.lvIdx+1);
    if(won){const sc=Math.round(this.stab*10+this.spares*50+this.decks*100+this.best*5);this.banner("DAWN SHIFT REACHED","ok");
      [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.sfx.tone(f,.4,"triangle",.1),i*140));
      setTimeout(()=>this.overlay(["Mainframe secured",`${this.lv.kind==="logic"?"Logic bay cleared":"Power held for "+CFG.dur+" s"} with ${this.decks} deck${this.decks>1?"s":""} still lit. Score: ${sc}.`,this.lvIdx>=0&&this.lvIdx<LV.length-1?"Next mission":"Replay mission",0]),900)}
    else{this.decks=0;this.boomT=1.6;{const sw=$("#shock");sw.classList.remove("go");void sw.offsetWidth;sw.classList.add("go")}this.sfx.noise(1.4,.8);this.sfx.tone(110,1.2,"sawtooth",.3,25);
      const[x,y]=mid($("#sch"));this.emit(x,y,420,700,"#ff8a2a");this.emit(x,y,200,400,"#fff0b0");
      setTimeout(()=>this.overlay(["Relay 7 destroyed",(this.lv.kind==="logic"?"The logic bay failed. Review noise margins, fan-out and the PUN/PDN rules, then try again.":"All crew decks went dark. Before raising current, check P = I²R on each resistor and size the fuse for the circuit."),"Retry mission",1]),1800)}
  }
  draw(s,dt){
    const[lo,hi]=CFG.win[this.win],c=this.ctl(),m=Math.max(0,Math.ceil(this.t)),run=this.running,rt=this.rating;
    this.boomT=Math.max(0,this.boomT-dt);
    $("#timer").textContent=`${String(m/60|0).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;$("#timer").classList.toggle("low",run&&m<=15);
    $("#stabFill").style.width=this.stab+"%";$("#stabFill").style.background=this.stab>60?"var(--cy)":this.stab>30?"#ffb42e":"var(--hot)";
    document.querySelectorAll(".decks i").forEach((e,k)=>e.classList.toggle("off",k>=this.decks));
    [1,2,3].forEach(k=>$("#wd"+k).classList.toggle("on",k<=this.decks));$("#sun").setAttribute("cy",120-(1-this.t/CFG.dur)*70);$("#eng").setAttribute("opacity",run?1:.2);$("#flame").setAttribute("opacity",run?.75:0);
    $("#view").classList.toggle("alert",this.evt==="surge");$("#beacon").style.opacity=clamp((this.dg-.3)*1.6,0,1);
    $("#tgt").textContent=`${lo}–${hi} W`;$("#pNow").textContent=fp(s.p)+" W";
    $("#tarc").setAttribute("stroke-dasharray",`0 ${lo/CFG.dialMax*60} ${(hi-lo)/CFG.dialMax*60} 60`);this.flow(s,dt,c);$("#streak").textContent=`Streak: ${this.sk.toFixed(0)} s (best ${this.best.toFixed(0)} s)`;
    const ang=clamp(s.p/CFG.dialMax,0,1.05)*180-90+(run?rnd(-1,1)*this.dg*4:0);
    $("#needle").setAttribute("transform",`rotate(${ang} 90 90)`);
    $("#tVs").textContent=(run?c.vs:0).toFixed(1)+" V";$("#tFuse").textContent=rt+" A";$("#cellLbl").textContent=c.mode==="rect"?"AC src":"Cell";$("#tI").textContent=s.i.toFixed(2)+" A";$("#amN").setAttribute("transform",`rotate(${-55+clamp(s.i/this.rating,0,1.2)*110} 245 72)`);
    $("#tV").textContent=`V load: ${s.vl.toFixed(2)} V`;$("#src").classList.toggle("on",run);
    $("#fuse").style.stroke=this.blown?"var(--hot)":"";$("#fheat").setAttribute("width",this.heat*40);
    $("#fil").style.stroke=this.blown?"#222":heatCol(this.heat*1.3);$("#fil").style.filter=this.heat>.2?`drop-shadow(0 0 ${this.heat*8}px #ff7a1a)`:"";
    [0,1,2].forEach(k=>{const r=$("#r"+(k+1)),ratio=s.ro[k];
      const fx=this.cf.fixed&&this.cf.fixed[k];$("#tR"+(k+1)).textContent=fx||(Math.round(c.r[k]*10)/10)+" "+this.un[k];$("#tP"+(k+1)).textContent=fp(s.bp[k])+" W";$("#g"+(k+1)).classList.toggle("off",!c.on[k]);
      r.style.fill=heatCol(ratio);{const sn=(SKIN[c.mode]||SKIN.parallel)[k],q=k+1;
        if(sn==="lamp"){const lb=$("#lb"+q),br=clamp(ratio*1.6,0,1.3);lb.style.fill=lampCol(br);lb.style.filter=br>.1?`drop-shadow(0 0 ${br*14}px #ffd36a)`:"";lb.style.stroke=ratio>1?"#ff4b2b":"#7f9aa0";$("#lf"+q).style.stroke=br>.1?"#fff3c0":"#6a5a3a"}
        else if(sn==="diode"){const d=$("#dd"+q);d.style.fill=ratio>.02?heatCol(ratio*.8+.15):"#8a6224";d.style.filter=ratio>.4?`drop-shadow(0 0 ${ratio*10}px #ff7a1a)`:""}
        else if(sn==="drv"){const sl=$("#r"+q+"s");$("#kn"+q).setAttribute("transform",`rotate(${-120+(sl.value-sl.min)/Math.max(1e-9,sl.max-sl.min)*240} ${[290,400,510][k]+19} 190)`)}}r.style.filter=ratio>.4?`drop-shadow(0 0 ${ratio*12}px #ff7a1a)`:"";
      if(run&&ratio>1){const[x,y]=mid($("#g"+(k+1)));this.emit(x,y,2,160,"#ffd070")}});
    const live=run&&s.i>0,hue=HUE(Math.min(1,s.i/rt)),spd=(1.1/(.4+s.i)).toFixed(2)+"s";
    this.wires.forEach(w=>{w.classList.toggle("live",live);w.style.stroke=live?`hsl(${hue} 90% 58%)`:"";w.style.animationDuration=spd});
    if(run&&(this.heat>.6||(this.blown&&Math.random()<.2))){const[x,y]=mid($("#fuse"));this.emit(x,y,1,120,"#ffb060")}
    let st="STANDBY",cl="";
    if(run){if(this.blown)[st,cl]=["FUSE BLOWN","bad"];else if([...s.ro,s.ra].some(x=>x>1))[st,cl]=["OVERHEAT","bad"];
      else if(this.heat>0)[st,cl]=["FUSE HEATING","warn"];else if(s.p<lo)[st,cl]=["UNDER-POWERED","warn"];
      else if(s.p>hi)[st,cl]=["OVER-POWERED","warn"];else[st,cl]=["NOMINAL","ok"]}
    if(this.lv.kind==="logic"&&run)[st,cl]=[this.lg.mods.filter(m=>!m.solved).length+" LEFT","warn"];$("#status").textContent=st;$("#led").className="led "+cl;
    const rl=isFinite(s.rl)?s.rl.toFixed(2):"∞";
    $("#ohm").innerHTML=run?`Rload = ${rl} Ω (${CKT[c.mode]})<br>I = Vs / (Rline + Rload) = ${c.vs.toFixed(1)} / (${CFG.rLine} + ${rl}) = ${s.i.toFixed(2)} A<br>Pload = I²·R = ${s.i.toFixed(2)}² · ${rl} = ${s.p.toFixed(1)} W`
      :"Engage power to see the live Ohm’s-law calculation.";
    if(this.lv.kind==="sandbox"){$("#timer").textContent="\u221e";$("#tgt").textContent="free play (no target)";$("#streak").textContent="Sandbox: no streaks, no failure"}
    {const hp=$("#hP"),k=this.lv.kind;hp.textContent=k==="logic"?(this.lg?this.lg.mods.filter(m=>!m.solved).length+" left":"\u2013"):k==="sandbox"?fp(s.p)+" "+"W":`${fp(s.p)} / ${lo}\u2013${hi}`;hp.style.color=k==="logic"||k==="sandbox"||(s.p>=lo&&s.p<=hi)?"var(--cy)":"#ffb42e"}
    if(run&&s.ex)$("#ohm").innerHTML=s.ex.join("<br>");
    if(this.cs.length>1)[...$("#tabs").children].forEach((b,i)=>{const o=this.cs[i],r=o.out;b.classList.toggle("on",i===this.ai);if(!r||!run)return;b.children[0].className="dot "+(r.blown||r.hot?"bad":r.inBand?"ok":"warn");
      b.children[3].textContent=`${r.s.p.toFixed((o.cf.dmax||60)<=10?2:1)} / ${o.W[o.win].join("\u2013")}`});
    if(c.mode==="rc"||c.mode==="rect"){const H=this.hist,sc=48/(CFG.vBase*1.25),pt=i=>H.map((v,k)=>`${464+k*184/200},${56-Math.max(0,v[i])*sc}`).join(" ");
      {const f=clamp(s.vl/(CFG.vBase*1.15),0,1);$("#cf3").setAttribute("height",f*76);$("#cf3").setAttribute("y",198-f*76)}$("#scV").setAttribute("points",pt(1));$("#scI").setAttribute("points",c.mode==="rect"?pt(0):"");$("#tP3").textContent=s.vl.toFixed(1)+" V"}
    if(c.mode==="led")[1,2,3].forEach(k=>{const e=$("#led"+k),b=clamp(s.br[k-1],0,1.4),col=CFG.lcol[k-1];e.style.fill=col;e.style.opacity=.12+.88*Math.min(1,b);e.style.filter=b>.1?`drop-shadow(0 0 ${4+b*10}px ${col})`:"";e.style.stroke=s.lr[k-1]>1?"#ff4b2b":"#4d6a70"});
    if(c.mode==="zener"){const z=$("#zsym");z.style.stroke=heatCol(s.ra);z.style.fill=s.iz>.001?"#3fe0d055":"#0003";z.style.filter=s.ra>.4?`drop-shadow(0 0 ${s.ra*12}px #ff7a1a)`:""}
    if(c.mode==="mos"||c.mode==="bjt"){const b=$("#trBox");b.style.fill=s.ra<.15?"#10161a":heatCol(s.ra);b.style.filter=s.ra>.4?`drop-shadow(0 0 ${s.ra*12}px #ff7a1a)`:"";$("#trNm").textContent=c.mode==="mos"?"MOSFET":"BJT NPN";$("#trSt").textContent=s.ax||"OFF"}
    this.sfx.danger=this.dg;this.sfx.hum(s.i,this.dg,run);
    // atmosphere: shake, red vignette, failing lights, flash
    const sh=this.calm?0:this.boomT*10;
    $("#stage").style.transform=sh?`translate(${rnd(-sh,sh)}px,${rnd(-sh,sh)}px)`:"";
    if(!this.calm&&Math.random()<this.dg*dt*3)this.fl=.2;this.fl=Math.max(0,this.fl-dt*3);
    $("#vig").style.opacity=clamp(this.dg*.5,0,.5)*(this.calm?.35:1);
    $("#dim").style.opacity=clamp((3-this.decks)*.17+this.fl*(run?1:0),0,.9);
    $("#flash").style.opacity=clamp((this.boomT-1.2)*4,0,1);
    // particles
    const x=this.cx;x.clearRect(0,0,this.cv.width,this.cv.height);x.globalCompositeOperation="lighter";
    this.ps=this.ps.filter(p=>p.l>0);
    for(const p of this.ps){p.l-=dt*1.1;p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;x.globalAlpha=clamp(p.l,0,1);x.fillStyle=p.c;
      x.beginPath();x.arc(p.x,p.y,p.r,0,6.28);x.fill()}
    x.globalAlpha=1;if(this.ps.length>900)this.ps.splice(0,this.ps.length-900);
  }
}
new Game();
