
const ST=['IF','ID','EX','MEM','WB'];
const $=id=>document.getElementById(id);
const LOAD=/^(ld|lw|lwu|lh|lhu|lb|lbu|l\.d|l\.s)$/,STORE=/^(sd|sw|sh|sb|s\.d|s\.s)$/,BR=/^(beq|bne|beqz|bnez|bgez|bltz|blez|bgtz)$/;
const MUL=/^(dmul|dmulu|mul|mult|dmult|ddiv|ddivu|div|divu)$/;
const isReg=t=>/^(r\d+|\$\w+|f\d+)$/i.test(t||'')&&!/^(r0|\$0|\$zero)$/i.test(t);

const D={fwd:0,mem:0,early:0,pred:'stall',mulLat:1,fpLat:1,pipe:0,ooo:0,oooRet:0,ren:0,cyc:12,auto:1,maxI:60,init:''};
const P1="ori r1, r0, 2 ; r1 = 2\nstartf:\nbeqz r1, endf ; jump to endf if r1 zero\ndaddi r1, r1, -1 ; r1 = r1-1\nj startf ; jump to startf\nendf:\nld r5, 100(r3)";
const P20="ori r1, r0, 8 ; r1 = 8\ndaddi r2, r0, 2 ; r2 = 2\nloop:\nbeqz r1, dest\ndmul r3, r2, r7\nxor r6, r4, r5\ndadd r6, r7, r6\ndsub r1, r1, r2\nj loop\ndest:\ndmul r5, r4, r2";
const PRE=[
 ['Slide 46 · Basic pipeline',"dadd r4, r3, r2\ndsub r12, r13, r14\nxor r5, r5, r5\nand r13, r14, r15",{}],
 ['Slide 56 · Structural hazard',"ld r11, 120(r0)\ndadd r2, r3, r6\nxor r15, r15, r15\ndsub r4, r1, r9\nand r12, r13, r10",{mem:1}],
 ['Slide 57 · RAW, no forwarding',"dadd r2, r3, r4\ndsub r1, r10, r2\nor r12, r11, r14\nxor r18, r18, r18",{}],
 ['Slide 74 · RAW, forwarding',"dadd r2, r3, r4\ndsub r1, r10, r2\nor r12, r11, r14",{fwd:1}],
 ['Slide 77 · Load-use, forwarding',"ld r2, 120(r3)\ndsub r1, r10, r2\nor r12, r11, r14",{fwd:1}],
 ['Slide 80 · Two forwarding paths',"dadd r1, r3, r5\nld r2, 120(r0)\ndsub r4, r1, r2",{fwd:1}],
 ['Slide 60 · Branch not taken',"beq r0, r3, loop ; nt\ndaddi r1, r0, 1\nand r3, r2, r4\nxor r8, r8, r8\nloop: dsub r3, r1, r2",{}],
 ['Slide 60 · Branch taken',"beq r0, r3, loop ; taken\ndaddi r1, r0, 1\nand r3, r2, r4\nxor r8, r8, r8\nloop: dsub r3, r1, r2",{}],
 ['Slide 61 · Jump',"j loop\ndaddi r1, r0, 1\nand r3, r2, r4\nxor r8, r8, r8\nloop: dsub r3, r1, r2",{}],
 ['Slide 90 · Early branch + RAW',"daddi r1, r1, 4\nbeq r1, r6, target ; nt\nor r3, r4, r9\ntarget: and r12, r2, r5",{fwd:1,early:1}],
 ['Slide 93 · Always-not-taken miss',"beq r4, r5, target ; taken\ndadd r9, r0, r7\ndsub r11, r10, r5\nor r12, r5, r14\ntarget: dadd r7, r1, r3",{pred:'nt'}],
 ['Slide 65 · Pipelined mul unit',"xor r1, r4, r5\ndmul r1, r2, r3\ndmul r8, r9, r10\ndadd r9, r11, r12",{mulLat:5,pipe:1,ooo:1,oooRet:1,ren:1}],
 ['Ex 15.4 · Loop with dmul (mul = 3 cycles)',"daddi r1, r0, 200\nloop:\nld r2, 0(r2)\ndmul r2, r3, r1\ndaddi r1, r1, -1\ndmul r2, r3, r2\nbnez r1, loop\ndadd r9, r2, r3",{mulLat:3,ooo:1,oooRet:1,cyc:15,auto:0,init:'r1=0, r2=0'}],
 ['Ex 16.1/16.2 · Mul unit, OoO execution and retirement',"dmul r2, r5, r6\nxor r1, r10, r3\ndmul r4, r6, r8\nld r3, 100(r2)",{mulLat:4,ooo:1,oooRet:1}],
 ['Ex 16.3 · Same, precise exceptions',"dmul r2, r5, r6\nxor r1, r10, r3\ndmul r4, r6, r8\nld r3, 100(r2)",{mulLat:4,ooo:1}],
 ['Ex 16.4 · Pipelined mul unit + precise exceptions',"dmul r2, r5, r6\nxor r1, r10, r3\ndmul r4, r6, r8\nld r3, 100(r2)",{mulLat:4,ooo:1,pipe:1}],
 ['Ex 17.2 · Original order (stall)',"dadd r9, r5, r7\nxor r4, r6, r7\nori r9, r6, 1\nld r3, 100(r4)",{}],
 ['Ex 17.4 · Reordered by the compiler',"xor r4, r6, r7\ndadd r9, r5, r7\nori r9, r6, 1\nld r3, 100(r4)",{}],
 ['Ex 18 · Forwarding EX→EX and MEM→EX',"dadd r9, r5, r7\nxor r2, r6, r7\nld r4, 100(r9)\ndsub r2, r4, r9",{fwd:1}],
 ['Ex 18 · Same without forwarding',"dadd r9, r5, r7\nxor r2, r6, r7\nld r4, 100(r9)\ndsub r2, r4, r9",{}],
 ['Ex 19.1 · Early branches + forwarding',P1,{fwd:1,early:1,cyc:20}],
 ['Ex 19.3 · Always not taken',P1,{fwd:1,early:1,pred:'nt',cyc:20}],
 ['Ex 19.4 · 2-bit predictor',P1,{fwd:1,early:1,pred:'bht',cyc:20}],
 ['Ex 20.3 · No forwarding, mul 3 cycles pipelined, OoO',P20,{early:1,pred:'nt',mulLat:3,pipe:1,ooo:1,oooRet:1,cyc:25}],
 ['Ex 20.5 · Same with all forwarding paths',P20,{fwd:1,early:1,pred:'nt',mulLat:3,pipe:1,ooo:1,oooRet:1,cyc:13,auto:0}],
 ['Ex 21.1 · ddiv (4 cycles), forwarding, imprecise',"daddi r3, r0, 5\nddiv r2, r4, r5\nxor r3, r6, r8\ndsub r2, r9, r10",{fwd:1,mulLat:4,ooo:1,oooRet:1}],
 ['Ex 21.2 · Same with register renaming',"daddi r3, r0, 5\nddiv r2, r4, r5\nxor r3, r6, r8\ndsub r2, r9, r10",{fwd:1,mulLat:4,ooo:1,oooRet:1,ren:1}]
];

//SIM-START
function parse(txt){
  const out=[],lab={};
  txt.split('\n').forEach(raw=>{
    const s=raw.trim();if(!s)return;
    const cm=s.match(/;\s*(taken|t|nt)\s*$/i);
    const force=cm?(/^nt$/i.test(cm[1])?0:1):null;
    let b=s.replace(/;.*$/,'').trim();
    const m=b.match(/^(\w+):\s*(.*)$/);
    if(m){lab[m[1].toLowerCase()]=out.length;b=m[2];if(!b)return}
    const a0=b.toLowerCase().split(/[,\s()]+/).filter(Boolean),op=a0[0],a=a0.slice(1);
    let dest=null,src=[],load=false,kind='alu',target=null,unit='gen';
    if(op==='j'){kind='j';target=a[0]}
    else if(BR.test(op)){kind='br';src=a.slice(0,/z$/.test(op)?1:2);target=a[a.length-1]}
    else if(LOAD.test(op)){dest=a[0];src=[a[2]];load=true;kind='ld'}
    else if(STORE.test(op)){src=[a[0],a[2]];kind='st'}
    else if(/i$|iu$/.test(op)){dest=a[0];src=[a[1]]}
    else{dest=a[0];src=[a[1],a[2]]}
    if(kind==='alu'){if(MUL.test(op))unit='mul';else if(/\.(d|s)$/.test(op))unit='fp'}
    out.push({line:b.replace(/\s+/g,' '),op,a,kind,target,force,unit,load,dest:isReg(dest)?dest:null,src:src.filter(isReg)});
  });
  return{out,lab};
}
function runVal(x,R){
  const v=t=>/^(r0|\$0|\$zero)$/.test(t)?0:(R[t]||0),n=t=>Number(t)||0,a=x.a,o=x.op;let r=null;
  if(/^(dadd|add|daddu|addu)$/.test(o))r=v(a[1])+v(a[2]);
  else if(/^(dsub|sub|dsubu|subu)$/.test(o))r=v(a[1])-v(a[2]);
  else if(o==='and')r=v(a[1])&v(a[2]);else if(o==='or')r=v(a[1])|v(a[2]);else if(o==='xor')r=v(a[1])^v(a[2]);
  else if(/^(dmul|dmulu|mul|mult|dmult)$/.test(o))r=v(a[1])*v(a[2]);
  else if(MUL.test(o))r=v(a[2])?Math.trunc(v(a[1])/v(a[2])):0;
  else if(/^(daddi|addi|daddiu|addiu)$/.test(o))r=v(a[1])+n(a[2]);
  else if(o==='ori')r=v(a[1])|n(a[2]);else if(o==='andi')r=v(a[1])&n(a[2]);else if(o==='xori')r=v(a[1])^n(a[2]);
  else if(x.load)r=0;else if(x.dest)r=0;
  if(r!==null&&x.dest)R[x.dest]=r;
  if(x.kind!=='br')return null;
  if(o==='beq')return v(a[0])===v(a[1]);if(o==='bne')return v(a[0])!==v(a[1]);
  if(o==='beqz')return v(a[0])===0;if(o==='bnez')return v(a[0])!==0;
  if(o==='bgez')return v(a[0])>=0;if(o==='bltz')return v(a[0])<0;
  if(o==='blez')return v(a[0])<=0;return v(a[0])>0;
}
function simulate(P,o){
  const L=P.out,R=Object.assign({},o.init),rows=[],notes=[],ex=[],cnt={};const brs=[],stalls=[];let seq=0;const jb={};
  const busy={gen:new Set(),mul:new Set(),fp:new Set()},wait={gen:new Set(),mul:new Set(),fp:new Set()},hold={gen:new Set(),mul:new Set(),fp:new Set()},memC=new Set(),wbC=new Set(),port=new Set(),bht={},ren={};
  let pc=0,prev=null,redir=0,tk=false,maxC=0,steps=0,rq=32,lastWb=0;
  const put=(row,c,l,s)=>{row.cells[c]={l,s:!!s};if(c>maxC)maxC=c};
  const wrong=(start,idS,Rr,exB)=>{
    let ifS=idS,idPrev=exB-1;
    for(let j=0;start+j<L.length;j++){
      if(ifS>Rr)break;
      const ids=Math.max(ifS+1,idPrev+1);
      const w={x:L[start+j],cells:{},fl:true,n:0};rows.push(w);
      for(let c=ifS;c<ids&&c<=Rr;c++)put(w,c,'IF',c>ifS);
      ['ID','EX','MEM','WB'].forEach((l,k)=>{if(ids+k<=Rr)put(w,ids+k,l)});
      idPrev=ids;ifS=ids;
    }
  };
  while(pc<L.length&&steps<o.maxI){
    steps++;
    const x=L[pc];cnt[pc]=(cnt[pc]||0)+1;
    const row={x,cells:{},fl:false,n:cnt[pc],st:[]};rows.push(row);
    const ev=(k,n,why,sub)=>{if(n>0){const e={k,n,line:x.line,why,sub:sub||'',it:row.n};row.st.push(e);stalls.push(e)}};
    const ifS=prev?prev.idS:1;
    let f=Math.max(ifS,redir);const showFrom=tk?f:ifS;tk=false;redir=0;
    const f0=f;if(o.mem)while(port.has(f))f++;
    const why={id:[],ex:[]};
    if(f>f0)why.id.push('single memory port busy during fetch');
    const idS=Math.max(f+1,prev?prev.exFirst:0);
    const early=x.kind==='br'&&o.early;
    const Lat=x.unit==='mul'?o.mulLat:x.unit==='fp'?o.fpLat:1,pipe=Lat>1&&o.pipe;seq+=4+Lat;
    let idNeed=0,exNeed=0,dep=null;
    x.src.forEach(reg=>{for(let k=ex.length-1;k>=0;k--){const p=ex[k];if(p.x.dest===reg){
      const av=p.x.load?p.mem+1:p.execEnd+1;
      if(early)idNeed=Math.max(idNeed,o.fwd?av:p.wb);
      else if(o.fwd)exNeed=Math.max(exNeed,av);
      else idNeed=Math.max(idNeed,p.wb);
      dep=dep||{reg,p:p.x.line};break}}});
    const b1=Math.max(idS+1,idNeed+1);
    if(idNeed+1>idS+1)why.id.push(`RAW on ${dep.reg} (from “${dep.p}”)`);
    const b2=Math.max(b1,prev?(o.ooo?prev.exFirst+1:prev.execEndAll+1):0);
    if(b2>b1)why.id.push('in-order execution: previous instruction still in EX (out-of-order execution is off)');
    let e=b2,s;
    for(;;){s=Math.max(e,exNeed);let bz=false;
      if(pipe){bz=busy[x.unit].has(s);for(let c=e;c<s;c++)if(wait[x.unit].has(c))bz=true}else for(let c=e;c<s+Lat;c++)if(busy[x.unit].has(c))bz=true;
      if(!bz)break;e++}
    if(e>b2)why.id.push(`${x.unit==='gen'?'EX':x.unit==='mul'?'mul/div':'FP'} unit busy`);
    const exFirst=e,execEnd=s+Lat-1;
    if(s>exFirst)why.ex.push(`waiting for ${dep?dep.reg:'operand'} through forwarding${dep?` (from “${dep.p}”)`:''}`);
    let wbMin=0,wawMin=0,retMin=0;
    if(!o.ren&&x.dest)for(let k=ex.length-1;k>=0;k--)if(ex[k].x.dest===x.dest){wawMin=ex[k].wb+1;break}
    if(!o.oooRet)retMin=lastWb+1;
    wbMin=Math.max(wawMin,retMin);
    let w=Math.max(execEnd+2,wbMin);const w1=w;
    while(memC.has(w-1)||wbC.has(w))w++;
    if(w>execEnd+2)why.ex.push(!o.oooRet?'in-order retirement: MEM/WB must follow program order':'WAW ordering / MEM-WB conflict');
    // typed stall events (course convention: Data / Structural / Control, plus in-order retirement)
    ev('S',idS-Math.max(f0+1,prev?prev.exFirst:0),'single memory port busy during fetch','memory port');
    ev('D',b1-(idS+1),dep?`RAW on ${dep.reg} (from “${dep.p}”)`:'RAW','RAW');
    if(b2>b1&&prev){let n=0;for(let c=b1;c<b2;c++)if(c<=prev.exFirst+prev.Lat-1)n++;   // only cycles the previous instruction really computes; waiting it does for its own hazards is a cascade, not a new stall
      ev('S',n,'previous instruction still executing in EX (in-order execution)','in-order EX')}
    {let n=0;for(let c=b2;c<e;c++)if(!hold[x.unit].has(c)&&!wait[x.unit].has(c))n++;   // cycles where the unit is held by a stalled instruction are a cascade, not a new stall
      ev('S',n,`${x.unit==='gen'?'EX':x.unit==='mul'?'mul/div':'FP'} unit busy`,'unit busy')}
    ev('D',s-exFirst,`waiting for ${dep?dep.reg:'operand'} through forwarding`,'RAW');
    if(w1>execEnd+2){if(!o.oooRet&&retMin>=wawMin)ev('O',w1-(execEnd+2),'MEM/WB must follow program order (precise exceptions)','in-order retirement');else ev('D',w1-(execEnd+2),'WAW: must write after the earlier instruction','WAW')}
    ev('S',w-w1,'MEM/WB slot already used','MEM/WB conflict');
    const mem=w-1;memC.add(mem);wbC.add(w);lastWb=Math.max(lastWb,w);
    if(pipe){busy[x.unit].add(s);if(s>exFirst)hold[x.unit].add(s);for(let c=exFirst;c<s;c++)wait[x.unit].add(c)}else for(let c=exFirst;c<=mem-1;c++){busy[x.unit].add(c);if(c<s||c>execEnd||c>=exFirst+Lat)hold[x.unit].add(c)}
    for(let c=showFrom;c<idS;c++)put(row,c,'IF',c>showFrom);
    for(let c=idS;c<exFirst;c++)put(row,c,'ID',c>idS);
    for(let c=exFirst;c<s;c++)put(row,c,'EX',1);
    for(let k=0;k<Lat;k++)put(row,s+k,pipe?'EX'+(k+1):'EX',!pipe&&k>0);
    for(let c=execEnd+1;c<mem;c++)put(row,c,pipe?'EX'+Lat:'EX',1);
    put(row,mem,'MEM');put(row,w,'WB');
    if(o.mem&&(x.kind==='ld'||x.kind==='st'))port.add(mem);
    if(o.ren&&x.dest){ren[x.dest]='rr'+(rq++)}
    const st=(exFirst-idS-1);
    if(why.id.length&&st>0)notes.push(`${x.line}: ${st} stall${st>1?'s':''} in ID — ${why.id.join('; ')}`);
    else if(why.id.length&&f>f0)notes.push(`${x.line}: fetch delayed — ${why.id.join('; ')}`);
    const xs=(s-exFirst)+(mem-1-execEnd);
    if(why.ex.length&&xs>0)notes.push(`${x.line}: ${xs} stall${xs>1?'s':''} in EX — ${why.ex.join('; ')}`);
    if(o.fwd){ // forwarding paths used by this instruction, named as in the course (Output EX/MEM -> Input ID/EX)
      const seen={};
      x.src.forEach(reg=>{for(let k=ex.length-1;k>=0;k--){const p=ex[k];if(p.x.dest!==reg)continue;
        if(seen[reg])break;seen[reg]=1;
        const idLast=exFirst-1;if(idLast>=p.wb)break;           // read from the register file in ID: no forwarding needed
        const consume=early?idLast:s;
        const from=(!p.x.load&&consume<=p.mem)?'EX':'MEM';
        notes.push(`${x.line}: forwarding Output ${from} (“${p.x.line}”) → Input ${early?'ID':'EX'}, value of ${reg}${st+xs===0?', no stall':''}`);break}});
    }
    const r={x,idS,exFirst,s,Lat,execEnd,execEndAll:mem-1,mem,wb:w};ex.push(r);prev=r;
    const cond=runVal(x,R);let next=pc+1;
    if(x.kind==='br'||x.kind==='j'){
      const Rr=x.kind==='j'?idS:(early?exFirst-1:mem);
      let tgt=P.lab[(x.target||'').toLowerCase()];
      let taken=x.kind==='j'?true:(x.force!==null?!!x.force:!!cond);
      const cpen=x.kind==='j'||early?1:3;   // wrong-path cycles after the branch is decoded: 1 if resolved in ID, 3 if in MEM (waits for its own operands are Data stalls)
      if(tgt===undefined){taken=false;notes.push(`${x.line}: unknown label, treated as not taken`)}
      const jk=x.kind==='j'?'jump':'branch';
      let predT=false,cb=null,ca=null;
      if(x.kind==='br'&&o.pred==='bht'){const sv=bht[pc];predT=sv!==undefined&&sv>=2;cb=sv===undefined?1:sv;
        if(sv===undefined)bht[pc]=1;
        bht[pc]=taken?Math.min(3,bht[pc]+1):Math.max(0,bht[pc]-1);ca=bht[pc]}
      if(x.kind==='br')brs.push({pc,line:x.line,op:x.op,src:x.src.slice(),vals:x.src.map(r=>/^(r0|\$0|\$zero)$/.test(r)?0:(R[r]||0)),taken,predT,cb,ca});
      if(x.kind==='br'&&o.pred==='stall'){
        if(taken){const w2={x:L[pc+1]||x,cells:{},fl:true,n:0};
          if(pc+1<L.length&&tgt!==pc+1){rows.push(w2);for(let c=idS;c<=Rr;c++)put(w2,c,'IF',c>idS)}
          ev('C',cpen,`${jk} taken: target unknown until cycle ${Rr}`,'taken');redir=Rr+1;tk=true;notes.push(`${x.line}: taken, resolved in cycle ${Rr} → target fetched in cycle ${Rr+1}`)}
        else{ev('C',cpen,'fetch waits for the branch outcome','not taken');redir=Rr+1;notes.push(`${x.line}: not taken, but fetch waits for resolution (cycle ${Rr})`)}
      }else{
        const jhit=x.kind==='j'&&o.pred==='bht'&&jb[pc];
        if(x.kind==='j'&&o.pred==='bht')jb[pc]=1;
        if(jhit)notes.push(`${x.line}: jump target found in the BTB during IF → no stall`);
        else if(predT&&taken)notes.push(`${x.line}: predicted taken, hit → no stall`);
        else if(predT&&!taken){wrong(tgt,idS,Rr,exFirst);ev('C',cpen,'wrong prediction (predicted taken)','mispredict');redir=Rr+1;tk=true;notes.push(`${x.line}: predicted taken, was not taken → flush, refetch in cycle ${Rr+1}`)}
        else if(taken){wrong(pc+1,idS,Rr,exFirst);ev('C',cpen,x.kind==='j'?'jump target known only in ID':'taken branch not predicted','taken');redir=Rr+1;tk=true;notes.push(`${x.line}: ${jk} taken (not predicted) → ${Math.max(0,Rr-idS+1)} wrong-path cycle(s), target fetched in cycle ${Rr+1}`)}
        else notes.push(`${x.line}: not taken, prediction hit → no stall`);
      }
      if(taken)next=tgt;
    }
    pc=next;
  }
  if(steps>=o.maxI&&pc<L.length)notes.push(`Stopped after ${o.maxI} executed instructions (limit in the menu).`);
  Object.keys(bht).forEach(k=>notes.push(`BTB/BHT entry: “${L[k].line}” → ${bht[k].toString(2).padStart(2,'0')}`));
  Object.keys(jb).forEach(k=>notes.push(`BTB/BHT entry: “${L[k].line}” → 11 (unconditional jump: target stored, always taken)`));
  if(o.ren){const m=Object.keys(ren).map(k=>`${k}→${ren[k]}`);if(m.length)notes.push('Last physical register of each destination (FIFO from rr32): '+m.join(', '))}
  return{rows,notes,total:lastWb,n:ex.length,maxC,brs,seq,stalls};
}
//SIM-END

let sel='IF',N=12,grid=[],P,sim,painting=false,erase=false;
function getO(){
  const init={};($('init').value||'').split(/[,\s]+/).forEach(t=>{const m=t.match(/^(\$?\w+)=(-?\w+)$/);if(m)init[m[1].toLowerCase()]=Number(m[2])||0});
  return{fwd:$('fwd').checked,mem:$('mem').checked,early:$('early').checked,pred:$('pred').value,ren:$('ren').checked,
    pipe:$('pipe').checked,ooo:$('ooo').checked,oooRet:$('oooRet').checked,
    mulLat:Math.max(1,+$('mulLat').value||1),fpLat:Math.max(1,+$('fpLat').value||1),maxI:Math.max(1,+$('maxI').value||60),init};
}
const stages=()=>{const o=getO(),m=Math.max(o.mulLat,o.fpLat);const ex=(o.pipe&&m>1)?Array.from({length:m},(_,k)=>'EX'+(k+1)):[];return['IF','ID','EX',...ex,'MEM','WB']};
const base=l=>l.replace(/\d+$/,'');
function build(){
  if(!practice.active&&$('bwsCard'))unlockGrid();
  const keep=grid;
  P=parse($('code').value);sim=simulate(P,getO());
  const c=Math.max(1,+$('cyc').value||12);
  N=$('auto').checked?Math.max(c,sim.maxC+1):c;
  grid=sim.rows.map((_,i)=>Array.from({length:N},(_,k)=>(keep[i]&&keep[i][k])||''));
  render();$('res').textContent='';renderStalls();
  if(!$('solCard').hidden)showSol();
  buildPal();
}
const head=()=>'<div></div>'+Array.from({length:N},(_,c)=>`<div class="hd">${c+1}</div>`).join('');
const cols=g=>g.style.gridTemplateColumns=`max-content repeat(${N},46px)`;
const esc=s=>s.replace(/</g,'&lt;');
const lbl=r=>`<div class="ins ${r.fl?'fl':''}">${esc(r.x.line)}${r.n>1?`<small>#${r.n}</small>`:''}${r.fl?'<small>(flushed)</small>':''}</div>`;
function render(marks){
  const g=$('mine');cols(g);let h=head();
  sim.rows.forEach((r,i)=>{
    h+=lbl(r);
    for(let c=0;c<N;c++){
      const v=grid[i][c],m=marks?marks[i][c]:'',e=r.cells[c+1];
      const show=m==='miss'?(e?e.l:''):v;
      h+=`<div class="c ${m!=='miss'&&v?base(v)+' st':'empty'} ${m}" data-i="${i}" data-c="${c}">${show||'·'}</div>`;
    }
  });
  g.innerHTML=h;
}
function paint(el){
  if(!el||el.dataset.i===undefined)return;
  const i=+el.dataset.i,c=+el.dataset.c;
  grid[i][c]=(erase||sel==='✕')?'':sel;
  if($('mine').querySelector('.ok,.no,.miss'))return render();
  const v=grid[i][c];el.className='c '+(v?base(v)+' st':'empty');el.textContent=v||'·';
}
$('mine').addEventListener('pointerdown',e=>{
  const el=e.target.closest('.c');if(!el)return;
  e.preventDefault();painting=true;erase=grid[+el.dataset.i][+el.dataset.c]===sel;paint(el);
});
$('mine').addEventListener('pointermove',e=>{if(painting)paint(document.elementFromPoint(e.clientX,e.clientY)?.closest('.c'))});
addEventListener('pointerup',()=>painting=false);

function buildPal(){
  const S=stages();if(!S.includes(sel)&&sel!=='✕')sel='IF';
  $('pal').innerHTML=[...S,'✕'].map((s,k)=>`<button class="${s!=='✕'?base(s)+' st':''} ${s===sel?'sel':''}" data-s="${s}">${s==='✕'?'✕ erase':s}${k<9?` <span style="opacity:.6">${k+1}</span>`:''}</button>`).join('')+`<span class="mut">Click or drag to paint. Repeat a stage for a stall.</span>`;
}
$('pal').addEventListener('click',e=>{const b=e.target.closest('button');if(b){sel=b.dataset.s;buildPal()}});
addEventListener('keydown',e=>{
  if(/TEXTAREA|SELECT|INPUT/.test(e.target.tagName))return;
  const k='123456789'.indexOf(e.key),S=[...stages(),'✕'];if(k>-1&&S[k]){sel=S[k];buildPal()}
});

// The Unit 2 solutions write plain EX in some tables (Ex 20.5) and EX1…EXn in others (Ex 16.4) for pipelined units: both are accepted,
// but two different numbered stages (EX1 vs EX3) are not interchangeable.
const eqStage=(a,b)=>a===b||(/^EX\d*$/.test(a)&&/^EX\d*$/.test(b)&&(a==='EX'||b==='EX'));
$('chk').onclick=()=>{
  let ok=0,total=0,bad=0;
  const marks=sim.rows.map((r,i)=>Array.from({length:N},(_,c)=>{
    const e=r.cells[c+1],v=grid[i][c];
    if(e){total++;if(eqStage(v,e.l)){ok++;return'ok'}return v?'no':'miss'}
    if(v){bad++;return'no'}return'';
  }));
  render(marks);
  const cut=sim.maxC>N?` <span class="mut">(the solution continues past cycle ${N}; raise “Clock cycles shown”)</span>`:'';
  $('res').innerHTML=(ok===total&&!bad
    ?`<span class="good">✓ Perfect${sim.maxC>N?` for cycles 1–${N}`:''} — all ${total} cells match${sim.maxC>N?'':` (${sim.total} cycles)`}.</span>`
    :`<span class="badc">${ok}/${total} cells correct${bad?`, ${bad} wrong or extra`:''}.</span> <span class="mut">Green = right, red = wrong, dashed = missing (shows the expected stage).</span>`)+cut;
};
$('hint').onclick=()=>{
  for(let c=0;c<N;c++)for(let i=0;i<sim.rows.length;i++){
    const e=sim.rows[i].cells[c+1],v=grid[i][c];
    if(!eqStage(e?e.l:'',v)){
      $('res').innerHTML=`<span class="badc">Hint:</span> first mistake is in cycle ${c+1}, row “${esc(sim.rows[i].x.line)}” — `+(e?`it should be <b>${e.l}</b>${e.s?' (a stall: that stage repeats)':''}.`:'that cell should be empty.');
      return;
    }
  }
  $('res').innerHTML='<span class="good">No mistakes found so far.</span>';
};
$('rev').onclick=()=>{$('solCard').hidden=false;showSol();$('solCard').scrollIntoView({behavior:'smooth'})};
$('clr').onclick=()=>{grid=sim.rows.map(()=>Array(N).fill(''));render();$('res').textContent=''};

