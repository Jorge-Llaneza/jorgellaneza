/* ===== stall report: kinds of stalls ===== */
const SK={D:'Data (RAW/WAW)',S:'Structural',C:'Control',O:'In-order retirement'};
const stIn={};
const stKinds=()=>{const o=getO();return(!o.oooRet&&(o.mulLat>1||o.fpLat>1))?['D','S','C','O']:['D','S','C']};
const stRows=()=>sim.rows.filter(r=>!r.fl);
const stSum=(r,k)=>r.st.filter(e=>e.k===k).reduce((a,e)=>a+e.n,0);
function renderStalls(){
  const t=$('stTab');if(!t)return;const K=stKinds(),R=stRows();
  const sg=$('code').value+JSON.stringify(getO());if(sg!==stIn._sg){Object.keys(stIn).forEach(k=>delete stIn[k]);stIn._sg=sg}
  t.innerHTML='<tr><th>Instruction</th>'+K.map(k=>`<th><span class="tg k${k}">${k}</span>${SK[k]}</th>`).join('')+'</tr>'+
    R.map((r,i)=>`<tr><td>${esc(r.x.line)}${r.n>1?` <small>#${r.n}</small>`:''}</td>`+K.map(k=>`<td><input type="number" min="0" data-sr="${i}" data-sk="${k}" value="${(stIn[i+k]??'')}"></td>`).join('')+'</tr>').join('');
  t.querySelectorAll('input').forEach(inp=>inp.oninput=()=>{stIn[inp.dataset.sr+inp.dataset.sk]=inp.value;inp.className=''});
  $('stRes').textContent='';
}
$('stClr').onclick=()=>{const g=stIn._sg;Object.keys(stIn).forEach(k=>delete stIn[k]);stIn._sg=g;renderStalls()};
$('stChk').onclick=()=>{
  const K=stKinds(),R=stRows();let bad=0,tot={D:0,S:0,C:0,O:0};
  $('stTab').querySelectorAll('input').forEach(inp=>{
    const r=R[+inp.dataset.sr],k=inp.dataset.sk,exp=stSum(r,k),v=Math.max(0,parseInt(inp.value,10)||0);
    tot[k]+=exp;const ok=v===exp;inp.className=ok?'ok':'bad';if(!ok)bad++});
  const sum=K.map(k=>`${SK[k]}: ${tot[k]} cycle${tot[k]===1?'':'s'}`).join(' · ');
  $('stRes').innerHTML=bad?`<span class="badc">✗ ${bad} wrong cell${bad>1?'s':''} (red). Remember: blank = 0, count each stall once on the instruction that suffers it.</span>`:`<span class="good">✓ Stall report correct — ${sum}</span>`;
};
function stallsHTML(sm){
  const ev=(sm||sim).stalls||[];if(!ev.length)return'';
  const tot={};ev.forEach(e=>tot[e.k]=(tot[e.k]||0)+e.n);
  return`<h4 style="margin:12px 0 4px">Stalls by type</h4><div class="mut">${Object.keys(SK).filter(k=>tot[k]).map(k=>`${SK[k]}: ${tot[k]} cycle${tot[k]>1?'s':''}`).join(' · ')}</div><ul>${ev.map(e=>`<li><span class="stt"><span class="tg k${e.k}">${e.k}</span></span>${esc(e.line)}${e.it>1?` <small>#${e.it}</small>`:''} — ${e.n} cycle${e.n>1?'s':''}: ${esc(e.why)}</li>`).join('')}</ul>`;
}
function showSol(){
  const g=$('sol');cols(g);let h=head();
  sim.rows.forEach(r=>{
    h+=lbl(r);
    for(let c=1;c<=N;c++){const e=r.cells[c];h+=`<div class="c ${e?base(e.l)+' st':'empty'} ${e&&e.s?'stall':''}">${e?e.l:'·'}</div>`}
  });
  g.innerHTML=h;
  const n=sim.n,T=sim.total;
  $('stats').innerHTML=`<div>Cycles <b>${T}</b></div><div>Instructions executed <b>${n}</b></div><div>CPI <b>${n?(T/n).toFixed(2):'–'}</b></div><div>CPI without start-up, (T−4)/n <b>${n?((T-4)/n).toFixed(2):'–'}</b></div><div>Ideal (no hazards) <b>${n?n+4:0}</b></div><div>Non-pipelined (sequential) <b>${sim.seq}</b></div>`;
  $('why').innerHTML=sim.notes.length?`<ul>${sim.notes.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'No hazards: each instruction enters the pipeline one cycle after the previous one.';
  $('why').innerHTML+=stallsHTML();
}

function setOpts(p){
  const v=Object.assign({},D,p);
  ['fwd','mem','early','pipe','ooo','oooRet','ren','auto'].forEach(k=>$(k).checked=!!v[k]);
  $('pred').value=v.pred;$('mulLat').value=v.mulLat;$('fpLat').value=v.fpLat;$('cyc').value=v.cyc;$('maxI').value=v.maxI;$('init').value=v.init;
}
$('pre').innerHTML='<option value="">— custom —</option>'+PRE.map((p,k)=>`<option value="${k}">${p[0]}</option>`).join('');
$('pre').onchange=()=>{
  const p=PRE[$('pre').value];if(!p)return;
  $('code').value=p[1];setOpts(p[2]);grid=[];$('solCard').hidden=true;build();
};
let t;
$('code').addEventListener('input',()=>{$('pre').value='';clearTimeout(t);t=setTimeout(build,250)});
['fwd','mem','early','pred','ren','pipe','ooo','oooRet','mulLat','fpLat','cyc','auto','maxI','init'].forEach(k=>$(k).addEventListener('change',()=>{if(!['cyc','auto'].includes(k))$('pre').value='';build()}));

$('calc').onclick=()=>{
  const s=$('stg').value.split(/[,\s]+/).map(Number).filter(x=>x>0);if(!s.length)return;
  const sum=s.reduce((a,b)=>a+b,0),mx=Math.max(...s),n=s.length,f=x=>+x.toFixed(2);
  $('calcOut').textContent=`Sequential CPU\n  Time per instruction: ${f(sum)} ns\n  Throughput: ${f(1000/sum)} MIPS (${f(1e9/sum)} instr/s)\n\nPipelined CPU (${n} stages, cycle = slowest stage)\n  Clock cycle: ${f(mx)} ns → frequency ${f(1000/mx)} MHz (${f(1/mx)} GHz)\n  Time per instruction (latency): ${f(n*mx)} ns\n  Ideal throughput: ${f(1000/mx)} MIPS\n  Ideal throughput speedup: ${f(sum/mx)}`;
};
$('calc2').onclick=()=>{
  const g=+$('fq').value,c=+$('cpi').value||1;if(!g)return;
  $('calc2Out').textContent=`Cycle time: ${+(1/g).toFixed(4)} ns\nMIPS: ${+(g*1000/c).toFixed(2)}  (at CPI ${c})\nInstructions per cycle (IPC): ${+(1/c).toFixed(3)}`;
};

/* ===== helpers shared by Learn and Practice ===== */
function parseInit(s){const o={};(s||'').split(/[,\s]+/).forEach(t=>{const m=t.match(/^(\$?\w+)=(-?\w+)$/);if(m)o[m[1].toLowerCase()]=Number(m[2])||0});return o}
function mkO(p){const v=Object.assign({},D,p);return{fwd:!!v.fwd,mem:!!v.mem,early:!!v.early,pred:v.pred,ren:!!v.ren,pipe:!!v.pipe,ooo:!!v.ooo,oooRet:!!v.oooRet,mulLat:v.mulLat,fpLat:v.fpLat,maxI:v.maxI,init:parseInit(v.init)}}
const MEAN={IF:'is being fetched from memory',ID:'is decoded and its source registers are read',EX:'is being calculated in the ALU / execution unit',MEM:'goes through the memory stage (only ld/sd really use it)',WB:'writes its result into the register'};
function diagHTML(sm,upto,N){
  let h=`<div class="grid ro" style="grid-template-columns:max-content repeat(${N},46px)"><div></div>`+Array.from({length:N},(_,c)=>`<div class="hd">${c+1}</div>`).join('');
  sm.rows.forEach(r=>{h+=lbl(r);for(let c=1;c<=N;c++){const e=c<=upto?r.cells[c]:null;h+=`<div class="c ${e?base(e.l)+' st':'empty'} ${e&&e.s?'stall':''}">${e?e.l:'·'}</div>`}});
  return h+'</div>';
}
function narrate(sm,k){
  const out=[];
  sm.rows.forEach(r=>{const e=r.cells[k];if(!e)return;
    out.push(`<li><code>${esc(r.x.line)}</code> ${e.s?`is <b>stuck</b> (stall) — repeats <b>${e.l}</b> because it has to wait`:`<b>${e.l}</b>: ${MEAN[base(e.l)]}`}${r.fl?' — <i>wrong path, will be thrown away</i>':''}</li>`)});
  return out.length?`<ul>${out.join('')}</ul>`:'<i>Nothing is happening in this cycle.</i>';
}

/* ===== Learn mode ===== */
const MULC="dmul r2, r5, r6\nxor r1, r10, r3\ndadd r4, r7, r8";
const LS=[
{t:'1 · Pipeline',c:"dadd r4, r3, r2\ndsub r12, r13, r14\nxor r5, r5, r5\nand r13, r14, r15",A:{o:{},l:'Ideal pipeline, no problems'},
 b:`<p>A CPU doesn’t finish one instruction before starting the next. Think of a <b>laundry room</b>: while load 1 is in the dryer, load 2 is already in the washer.</p>
 <p>Every instruction goes through 5 steps: <b>IF</b> fetch it from memory → <b>ID</b> decode it and read registers → <b>EX</b> calculate → <b>MEM</b> read/write memory → <b>WB</b> write the result back.</p>
 <div class="tip">A new instruction starts every cycle. 4 instructions take only <b>4 + 4 = 8 cycles</b>, not 4 × 5 = 20.</div>`},
{t:'2 · Data hazard (RAW)',c:"dadd r2, r3, r4\ndsub r1, r10, r2\nor r12, r11, r14\nxor r18, r18, r18",A:{o:{},l:'No forwarding: dsub must wait'},
 b:`<p><code>dsub</code> needs <b>r2</b>, but <code>dadd</code> only <i>writes</i> r2 in its last step (WB). If dsub read it earlier it would get the <b>old</b> value.</p>
 <p>So dsub waits in ID (the hatched cells are <b>stalls</b>) until the cycle where dadd is in WB. A register can be written in the first half of a cycle and read in the second half of the same cycle, so dsub’s last ID cycle lines up with dadd’s WB.</p>
 <div class="tip">This is a <b>RAW</b> (Read After Write) hazard. Everything behind dsub is held back too (their IF repeats).</div>`},
{t:'3 · Forwarding',c:"dadd r2, r3, r4\ndsub r1, r10, r2\nor r12, r11, r14",A:{o:{},l:'Without forwarding'},B:{o:{fwd:1},l:'With forwarding'},
 b:`<p>Shortcut: <code>dadd</code> already <i>knows</i> r2 at the end of its EX step. <b>Forwarding paths</b> are extra wires that send that result straight into the next instruction’s EX input, without waiting for WB.</p>
 <div class="tip">Result: the stall disappears completely. Turn forwarding on/off in the menu to see it any time.</div>`},
{t:'4 · Load-use',c:"ld r2, 120(r3)\ndsub r1, r10, r2\nor r12, r11, r14",A:{o:{fwd:1},l:'dsub right after the ld'},B:{c:"ld r2, 120(r3)\nor r12, r11, r14\ndsub r1, r10, r2",o:{fwd:1},l:'Unrelated instruction in between'},
 b:`<p>A <code>ld</code> only gets its value at the end of <b>MEM</b>, one step later than an ALU result. So even with forwarding, the next instruction must wait <b>1 cycle</b>.</p>
 <div class="tip">Fix: put an unrelated instruction in between (compilers do this). The stall slot gets used for useful work.</div>`},
{t:'5 · Structural',c:"ld r11, 120(r0)\ndadd r2, r3, r6\nxor r15, r15, r15\ndsub r4, r1, r9\nand r12, r13, r10",A:{o:{},l:'Two memory ports'},B:{o:{mem:1},l:'Single memory port'},
 b:`<p>IF (fetching instructions) and MEM (loading/storing data) both use memory. With only <b>one memory port</b>, a <code>ld</code> in MEM blocks the fetch that wants to happen in the same cycle.</p>
 <div class="tip">That fetch is delayed 1 cycle. This is a <b>structural hazard</b>: two instructions need the same hardware at the same time.</div>`},
{t:'6 · Branches',c:"beq r0, r3, loop ; nt\ndaddi r1, r0, 1\nand r3, r2, r4\nxor r8, r8, r8\nloop: dsub r3, r1, r2",A:{o:{},l:'Branch NOT taken'},B:{c:"beq r0, r3, loop ; taken\ndaddi r1, r0, 1\nand r3, r2, r4\nxor r8, r8, r8\nloop: dsub r3, r1, r2",o:{},l:'Branch taken'},
 b:`<p>A branch decides where the program goes next, but the CPU only learns the answer late (in <b>MEM</b>). Meanwhile it doesn’t know what to fetch.</p>
 <p>Simplest policy: <b>stop fetching</b> until the branch is resolved. Both diagrams lose the same cycles.</p>
 <div class="tip">When taken, the instruction that was waiting (struck through) is thrown away and the <b>target</b> is fetched instead.</div>`},
{t:'7 · Early branch',c:"beq r0, r3, loop ; taken\ndaddi r1, r0, 1\nand r3, r2, r4\nxor r8, r8, r8\nloop: dsub r3, r1, r2",A:{o:{},l:'Resolved in MEM'},B:{o:{early:1},l:'Resolved in ID (early)'},
 b:`<p>Add comparator hardware in the <b>ID</b> stage so the branch is decided 2 cycles earlier. Less waiting, same result.</p>
 <div class="tip">The cost: if the branch depends on a register written just before, that value must be ready in ID (needs forwarding into ID, or a stall).</div>`},
{t:'8 · Predict NT',c:"beq r4, r5, target ; nt\ndadd r9, r0, r7\ndsub r11, r10, r5\nor r12, r5, r14\ntarget: dadd r7, r1, r3",A:{o:{pred:'nt'},l:'Guess right (not taken)'},B:{c:"beq r4, r5, target ; taken\ndadd r9, r0, r7\ndsub r11, r10, r5\nor r12, r5, r14\ntarget: dadd r7, r1, r3",o:{pred:'nt'},l:'Guess wrong (taken)'},
 b:`<p>Instead of waiting, <b>guess</b>: assume the branch is <b>not taken</b> and keep fetching the next instructions.</p>
 <p>Right guess → <b>zero</b> lost cycles. Wrong guess → those instructions (struck-through rows) are <b>flushed</b> and you restart from the target.</p>
 <div class="tip">Careful: both diagrams happen to end in the same cycle, but B only executed 2 useful instructions (the branch and the target) while A executed 5. The wrong guess made B waste fetch slots.</div>`},
{t:'9 · 2-bit predictor',c:"daddi r1, r0, 5\nloop:\ndaddi r1, r1, -1\nbnez r1, loop\ndadd r9, r2, r3",A:{o:{pred:'nt',early:1,fwd:1},l:'Always not taken'},B:{o:{pred:'bht',early:1,fwd:1},l:'2-bit predictor'},
 b:`<p>Guess smarter by <b>remembering</b>. Each branch gets a 2-bit counter: <code>00</code> strongly NT, <code>01</code> weakly NT, <code>10</code> weakly T, <code>11</code> strongly T.</p>
 <p>Taken → counter +1, not taken → −1 (stops at 00 and 11). Counter ≥ <code>10</code> → predict taken. The first time a branch is seen it is predicted not taken (counter starts at <code>01</code>).</p>
 <div class="tip">Loops are taken many times, so the predictor learns quickly. The final BHT state is listed under the solution notes.</div>`},
{t:'10 · Slow units',c:MULC,A:{o:{mulLat:4},l:'In-order: everything waits'},B:{o:{mulLat:4,ooo:1,oooRet:1},l:'Out-of-order execution'},
 b:`<p>Multiplication/division is slow, so its EX takes several cycles (here 4). With <b>in-order execution</b> every later instruction waits behind it.</p>
 <p>With <b>out-of-order execution</b>, instructions that don’t depend on the slow one (like <code>xor</code>) go ahead and finish first.</p>`},
{t:'11 · Precise exceptions',c:MULC,A:{o:{mulLat:4,ooo:1,oooRet:1},l:'Out-of-order retirement'},B:{o:{mulLat:4,ooo:1},l:'In-order retirement (precise)'},
 b:`<p>Finishing early is fast, but if <code>dmul</code> later causes an error (exception), younger instructions have <b>already changed registers</b> — the program state is a mess.</p>
 <p><b>Precise exceptions</b> force instructions to retire (WB) in program order, so the fast <code>xor</code> must wait for the slow <code>dmul</code>.</p>`},
{t:'12 · Pipelined mul',c:"dmul r2, r5, r6\ndmul r4, r6, r8\ndmul r7, r9, r10",A:{o:{mulLat:4,ooo:1,oooRet:1},l:'Mul unit not pipelined'},B:{o:{mulLat:4,ooo:1,oooRet:1,pipe:1},l:'Pipelined mul unit (EX1…EX4)'},
 b:`<p>A normal mul unit is <b>busy</b> for all 4 cycles, so the 2nd <code>dmul</code> waits in ID (structural hazard).</p>
 <p>A <b>pipelined</b> unit is itself an assembly line (EX1, EX2, EX3, EX4): it accepts a new multiplication <b>every cycle</b>.</p>`},
{t:'13 · WAW & renaming',c:"daddi r3, r0, 5\nddiv r2, r4, r5\nxor r3, r6, r8\ndsub r2, r9, r10",A:{o:{fwd:1,mulLat:4,ooo:1,oooRet:1},l:'No renaming'},B:{o:{fwd:1,mulLat:4,ooo:1,oooRet:1,ren:1},l:'With register renaming'},
 b:`<p><b>WAW</b> (Write After Write): two instructions write the same register (<code>ddiv r2</code> and <code>dsub r2</code>). If the slow one finished last it would overwrite the newer value, so the later write must wait.</p>
 <p><b>Register renaming</b> gives every write its own hidden physical register (rr32, rr33…), so they never collide and nothing waits.</p>`}
];

LS.unshift({t:'0 · Read a diagram',c:LS[0].c,A:{o:{},l:'An ideal pipeline: nothing goes wrong'},
 b:`<p>Every picture in this lab is a <b>timetable</b>. Each <b>row</b> is one instruction. Each <b>column</b> is one tick of the CPU clock (a <b>cycle</b>). The box where a row and a column meet says what that instruction is doing during that tick.</p>
 <p>Read one row from left to right and you see the five steps in order: IF, ID, EX, MEM, WB. Look down a column and you see everything the CPU does at the same moment.</p>
 <div class="tip">The total number of cycles is the number of the last column that still has a box.</div>`});
LS.push({t:'14 · Kinds of stalls',stalls:1,c:"ld r2, 120(r3)\ndadd r5, r6, r7\nxor r9, r10, r11\nand r12, r13, r14\nld r4, 8(r15)\nor r6, r1, r4\nbeq r5, r0, end ; taken\ndadd r8, r8, r9\nend: dsub r3, r3, r1",A:{o:{fwd:1,mem:1,early:1},l:'One of each: data, structural and control'},B:{c:"dmul r2, r5, r6\nxor r1, r10, r3\ndmul r4, r6, r8\nld r3, 100(r2)",o:{mulLat:4,ooo:1,oooRet:1},l:'Exercise 16.1: structural + data'},
 b:`<p>Every stall has exactly <b>one cause</b>. Naming it is the usual exam question (“write down the pipeline stalls, with their type and duration”). There are three kinds:</p>
 <p><b>(D) Data</b>: the instruction needs a value that is not ready yet (RAW; also WAW when two writes would end in the wrong order). <b>(S) Structural</b>: the hardware it needs is busy: the memory port shared by IF and MEM, a non-pipelined mul/div unit, a MEM/WB slot. <b>(C) Control</b>: a branch or jump means the next instruction to fetch is not known yet (or was guessed wrong).</p>
 <div class="tip"><b>How to count.</b> Report each stall <b>once</b>, on the instruction that suffers it, with its length in cycles. Instructions behind it are delayed too, but that is a <i>consequence</i>, not a new stall. A control stall is attributed to the branch/jump itself (“(C) – j – 1 cycle”). With in-order retirement (precise exceptions) an extra waiting kind appears: an instruction that is ready but must wait to retire after an older, slower one.</div>
 <p>Quick recipe: look at <b>why</b> the box is hatched. Waiting for a register → Data. Waiting for a unit/port → Structural. Waiting for the branch outcome → Control. Then type your own stall report in the <b>“Stall report”</b> card under the practice grid; it is checked automatically.</p>`});
const LX=[
{say:'A pipeline diagram is a timetable: rows are instructions, columns are clock ticks.',ana:'Like a train timetable: each row is a train, each column is an hour.',w:[['Clock cycle','One tick of the CPU clock. The column numbers 1, 2, 3…'],['IF · ID · EX · MEM · WB','The five steps every instruction goes through, always in this order.'],['Stall','A hatched box. The instruction has to wait, so it repeats its step.'],['Flushed','A struck-through instruction was fetched by mistake and is thrown away.']],look:'Follow one row from left to right: IF, ID, EX, MEM, WB. Then notice each row starts one column later than the one above.',mistake:'Reading time as going downwards. Time goes to the right, across the columns.',q:['What do the columns of a pipeline diagram represent?','Clock cycles (time)','Instructions','Registers']},
{say:'While one instruction executes, the next is being decoded and the one after is being fetched.',ana:'A laundry room: while load 1 is in the dryer, load 2 is already in the washer.',w:[['Pipeline','Doing different steps of different instructions at the same time.'],['Throughput','How many instructions finish per cycle. Ideal: one per cycle.']],look:'After the first few cycles, one instruction finishes in every cycle.',mistake:'Thinking each instruction becomes faster. One instruction still needs 5 cycles. The gain is that they overlap.',q:['In an ideal 5-stage pipeline, how many cycles do 4 instructions need in total?','8','20','5']},
{say:'An instruction needs a value that an earlier instruction has not written yet, so it has to wait.',ana:'You cannot ice a cake before someone has finished baking it.',w:[['RAW (Read After Write)','The later instruction reads a register that the earlier one will write.'],['Stall','Waiting a cycle (hatched). The instruction repeats its step.']],look:'Find the hatched boxes: they sit in the instruction that needs the value.',mistake:'Thinking the instructions behind can skip ahead. In an in-order pipeline they wait too.',q:['Why does dsub have to wait in this program?','It reads r2 before dadd has written it','It needs the memory port','Its opcode is slow']},
{say:'Send the result straight to where it is needed, instead of waiting for it to be written to the register.',ana:'Hand the pizza directly to the next person, instead of putting it in the fridge first.',w:[['Forwarding (bypass)','Extra wires that carry an ALU result straight into the next instruction’s EX step.']],look:'Compare A and B: the hatched boxes in A disappear in B.',mistake:'Believing forwarding fixes everything. It cannot help right after a load (next lesson).',q:['What does forwarding do?','Sends a result to a later instruction before it is written back','Skips the WB stage','Makes the clock faster']},
{say:'A loaded value only exists after MEM, so even with forwarding the very next instruction waits one cycle.',ana:'Food from the oven (memory) is ready one step later than food from the counter.',w:[['Load-use hazard','An instruction uses a register that the load right before it is still fetching.']],look:'Exactly one hatched box in A. Then see B: an unrelated instruction fills the gap.',mistake:'Expecting forwarding to remove this stall. It cannot: the data does not exist yet.',q:['With forwarding on, how many stall cycles does an instruction need if it uses the result of the load right before it?','1','0','3']},
{say:'Two instructions want the same piece of hardware in the same cycle, so one of them waits.',ana:'Two people trying to walk through one door at the same time.',w:[['Structural hazard','Not enough hardware. Here: one memory port shared by fetching and by loads/stores.'],['Memory port','A door into memory. One port means one access per cycle.']],look:'Find the cycle where a load/store is in MEM while another instruction wants to be in IF.',mistake:'Blaming data dependencies. These instructions can be completely independent.',q:['With one memory port, which stage collides with the MEM stage of a load or store?','IF','WB','ID']},
{say:'The CPU does not know which instruction comes next until the branch is decided, so it stops fetching and waits.',ana:'A fork in the road: you wait at the sign until you know which way to go.',w:[['Branch','An instruction that may change which instruction runs next.'],['Taken / not taken','Taken: jump to the target. Not taken: carry on in order.'],['Control hazard','Not knowing what to fetch next.']],look:'Fetching pauses right after the branch in both diagrams.',mistake:'Thinking not-taken is free. Without prediction, fetching waits either way.',q:['With no prediction, when does the CPU start fetching again after a branch?','Once the branch is resolved','Immediately','Only after the branch’s WB']},
{say:'Decide the branch earlier (in ID) so the wait gets shorter.',ana:'Reading the road sign from further away.',w:[['Early branch','The branch outcome is computed in ID instead of MEM.']],look:'B loses fewer cycles than A.',mistake:'Forgetting the cost: the register the branch needs must already be ready in ID.',q:['In which stage is an early branch resolved?','ID','WB','IF']},
{say:'Guess “not taken” and keep fetching. A right guess costs nothing, a wrong guess throws instructions away.',ana:'Keep driving straight. If the road turns, you go back and lose a few seconds.',w:[['Branch prediction','Guessing the outcome of a branch so fetching can continue.'],['Flush','Throwing away instructions that were fetched on a wrong guess.']],look:'In B the struck-through rows are the wrong guesses.',mistake:'Believing a wrong guess is free. Those fetch slots were wasted.',q:['You predict “not taken” but the branch is taken. What happens to the instructions fetched after it?','They are flushed','They run normally','They run twice']},
{say:'Remember what the branch did before, using a small counter, so loops get predicted well.',ana:'A habit: if someone always turns left at this corner, bet on left.',w:[['2-bit counter','00, 01, 10, 11. The higher, the more likely “taken”.'],['BHT','Branch history table: where the counters live.']],look:'A keeps flushing. B learns the loop after a couple of iterations.',mistake:'Thinking it is right the first time. It starts at 01 (weakly not taken).',q:['A 2-bit predictor starts at 01. What does it predict the first time?','Not taken','Taken','It stalls']},
{say:'A multiply takes several cycles. In-order machines wait behind it. With out-of-order execution, independent instructions are issued while it is still in EX (in another unit) and can finish before it.',ana:'A slow cashier: customers with a small purchase move to another till.',w:[['Latency','How many cycles one operation takes.'],['Out-of-order execution','A later independent instruction may execute while an earlier slow one is still in EX, so it can finish first. States: issued → executed → retired.']],look:'In B, xor finishes before dmul.',mistake:'Thinking out-of-order breaks dependencies. Dependent instructions still wait.',q:['What may out-of-order execution let an independent instruction do?','Execute while an earlier slow instruction is still in EX, and finish before it','Ignore its operands','Skip its WB']},
{say:'To keep the machine state clean if an instruction fails, instructions must finish (WB) in program order.',ana:'Check out of the hotel in room order, so the bill never gets mixed up.',w:[['Exception','An error, for example dividing by zero.'],['Precise exception','The state looks as if all earlier instructions finished and no later one started.'],['Retire','Finish MEM and WB. Out-of-order execution + in-order retirement gives precise exceptions.']],look:'xor is ready early, but it waits for dmul.',mistake:'Thinking the waiting is useless. It protects correctness.',q:['Why must instructions retire in order for precise exceptions?','So later instructions never change state before an earlier one fails','To save clock cycles','Because WB is slow']},
{say:'A pipelined multiplier is an assembly line: a new multiply can start every cycle.',ana:'A car wash with several stations instead of a single bay.',w:[['Pipelined unit','Split into stages EX1…EXn, so it accepts a new operation each cycle.'],['Busy unit','A non-pipelined unit cannot accept a new operation until the current one is done.']],look:'In A the second dmul waits in ID. In B it does not.',mistake:'Thinking each multiply gets faster. Each still takes 4 cycles. Only the throughput improves.',q:['What does pipelining the multiplier improve?','A new multiply can start every cycle','The latency of one multiply','The clock speed']},
{say:'Two instructions write the same register. The later one must not be overwritten by the slower earlier one.',ana:'Two people writing on the same line of a whiteboard.',w:[['WAW (Write After Write)','Two instructions write the same register.'],['Register renaming','Giving every write its own hidden register so they never collide.']],look:'In A the second write waits. In B nothing waits.',mistake:'Confusing WAW with RAW. Nobody is reading a value here.',q:['What does register renaming remove?','The wait caused by two writes to the same register','Load-use stalls','Structural hazards']},
{say:'Every stall has one cause: missing data (D), busy hardware (S) or an unknown next instruction (C). Report each one once, on the instruction that suffers it.',ana:'A traffic jam: the cause is one crash. The cars queued behind it are not extra crashes.',w:[['(D) Data stall','Waiting for a value: RAW (or WAW) dependence.'],['(S) Structural stall','Waiting for hardware: memory port, busy mul/div unit, MEM/WB slot.'],['(C) Control stall','Waiting for, or recovering from, a branch/jump decision.'],['Duration','How many clock cycles the instruction is held back.']],look:'In A: which hatched box waits for a register, which one for the memory port, and which one is caused by the branch?',mistake:'Counting the delay of the instructions behind a stalled one as new stalls. Only the original cause counts.',q:['A taken branch makes the CPU fetch the wrong instruction first. Which kind of stall is that?','Control','Data','Structural'],xq:1}];
const LMAP=[1,1,2,3,4,5,6,7,7,9,8,9,8,10,6];
const LDR={6:{pred:'stall',early:0,seed:6101},7:{pred:'stall',early:1,seed:6102},8:{pred:'nt',early:0,seed:6103},9:{own:1}};
function drillSpec(i){const L=LS[i],d=LDR[i];if(d.own){const sc=L.B||L.A;return{code:L.c,opts:sc.o}}const g=gen(6,d.seed+(lsDone['dn'+i]||0));return{code:g.code,opts:Object.assign({},g.opts,{pred:d.pred,early:d.early})}}
function tryComplete(){const L=LS[ls.i],qs=lessonQs(ls.i),st=ls.qa[ls.i];if(!st||lsDone[L.t])return;
  if(Object.keys(st.a).length===qs.length&&st.c>=Math.ceil(qs.length*.7)&&(!LDR[ls.i]||lsDone['d'+L.t])){lsDone[L.t]=1;try{localStorage.setItem('mp64learn',JSON.stringify(lsDone))}catch(x){}try{parent!==window&&parent.MPT&&parent.MPT.learn({id:'mips-lesson-'+L.t,sp:LDR[ls.i]?14:10,why:'Lesson completed'})}catch(x){}}}
let ls={i:0,k:99,w:'B',s:0,play:0,qa:{}};
let lsDone={};try{lsDone=JSON.parse(localStorage.getItem('mp64learn')||'{}')}catch(e){}
function lessonSims(L){const a=L.A,b=L.B||null,sa=simulate(parse(a.c||L.c),mkO(a.o)),sb=b?simulate(parse(b.c||L.c),mkO(b.o)):null;return{sa,sb,N:Math.max(sa.maxC,sb?sb.maxC:0)+1}}
const stallCnt=sm=>{let n=0;sm.rows.forEach(r=>Object.values(r.cells).forEach(c=>{if(c.s)n++}));return n};
function numOpts(v,r){const c=[v-2,v-1,v+1,v+2,v+3].filter(x=>x>=0&&x!==v),o=[v];c.sort(()=>r()-.5).slice(0,3).forEach(x=>o.push(x));return o.sort(()=>r()-.5).map(String)}
function lessonQs(i){
  const L=LS[i],X=LX[i],{sa,sb}=lessonSims(L),tg=sb||sa,r=rng(900+i*17),qs=[];
  const nm=sb?'diagram B ('+L.B.l+')':'the diagram';
  let o=numOpts(tg.total,r);qs.push({q:`How many clock cycles does ${nm} take in total?`,ch:o,ans:o.indexOf(String(tg.total)),why:`The last column that still has a box is cycle ${tg.total}.`});
  const sc=stallCnt(tg);o=numOpts(sc,r);qs.push({q:`How many hatched (stall) boxes are in ${nm}?`,ch:o,ans:o.indexOf(String(sc)),why:sc?`Count the hatched boxes: ${sc}. Each one is a cycle in which an instruction waits.`:'There are no hatched boxes, so nothing waits.'});
  if(sb){const ch=['A finishes first','B finishes first','Both take the same number of cycles'],a=sa.total<sb.total?0:sa.total>sb.total?1:2;qs.push({q:'Compare the two diagrams. Which one takes fewer cycles?',ch,ans:a,why:`A takes ${sa.total} cycles, B takes ${sb.total}.`})}
  const [q,c,w1,w2]=X.q,ch=[c,w1,w2].sort(()=>r()-.5);qs.push({q,ch,ans:ch.indexOf(c),why:X.say});
  if(X.xq)[['D','Data'],['S','Structural']].forEach(([k,nmk])=>{const e=sa.stalls.find(e=>e.k===k);if(!e)return;
    const ch2=['Data (RAW)','Structural','Control'].sort(()=>r()-.5),a=ch2.indexOf(k==='D'?'Data (RAW)':'Structural');
    qs.push({q:`In diagram A, “${e.line}” loses ${e.n} cycle${e.n>1?'s':''}. What kind of stall is this?`,ch:ch2,ans:a,why:`${nmk}: ${e.why}.`})});
  return qs}
function legend(){return '<div class="leg"><span class="c IF st">IF</span>fetch <span class="c ID st">ID</span>decode <span class="c EX st">EX</span>calculate <span class="c MEM st">MEM</span>memory <span class="c WB st">WB</span>write back <span class="c EX st stall">EX</span>hatched = waiting (stall)</div>'}
function stopPlay(){if(ls.play){clearInterval(ls.play);ls.play=0}}
function paintWatch(){const L=LS[ls.i],{sa,sb,N}=lessonSims(L),which=(ls.w==='B'&&sb)?'B':'A',sm=which==='B'?sb:sa;
  const d=$('wDiag');if(!d)return;d.innerHTML=`<div><h4>${sb?'A — ':''}${L.A.l}</h4><div class="scroll">${diagHTML(sa,ls.k,N)}</div><div class="tot">${sa.total} cycles in total</div></div>${sb?`<div><h4>B — ${L.B.l}</h4><div class="scroll">${diagHTML(sb,ls.k,N)}</div><div class="tot">${sb.total} cycles in total</div></div>`:''}`;
  $('lk').value=Math.min(ls.k,N);$('lkv').textContent=ls.k>=N?'all cycles':'cycle '+ls.k;
  $('narr').innerHTML=ls.k>=1&&ls.k<N?`<b>Cycle ${ls.k}${sb?' (explaining '+which+')':''}:</b>`+narrate(sm,ls.k):'<i>Press ▶ to watch the diagram being built cycle by cycle, or drag the slider.</i>'}
function lessonStalls(L){const{sa,sb}=lessonSims(L);return`<div class="mis" style="border-color:var(--bd,#8886)"><h4 style="margin:0 0 4px">Stall report of ${sb?'A':'the diagram'} — ${esc(L.A.l)}</h4>${stallsHTML(sa)}</div>`+(sb?`<div class="mis" style="border-color:var(--bd,#8886)"><h4 style="margin:0 0 4px">Stall report of B — ${esc(L.B.l)}</h4>${stallsHTML(sb)}</div>`:'')}
function renderLesson(){
  stopPlay();const L=LS[ls.i],X=LX[ls.i],{sa,sb,N}=lessonSims(L);if(ls.k>N)ls.k=N;
  const done=Object.keys(lsDone).filter(k=>lsDone[k]).length;
  $('lsnTabs').innerHTML=LS.map((l,k)=>`<button class="${k===ls.i?'sel':''}" data-k="${k}">${lsDone[l.t]?'✓ ':''}${l.t}</button>`).join('');
  const steps=['1 · Idea','2 · Watch','3 · Why','4 · Check'];
  let h=`<div class="mut" style="font-size:12px">${done} of ${LS.length} lessons completed</div><div class="prog"><i style="width:${Math.round(done/LS.length*100)}%"></i></div>
  <div class="stp">${steps.map((s,k)=>`<button data-la="step" data-s="${k}" class="${k===ls.s?'sel':''}">${s}</button>`).join('')}</div>`;
  if(ls.s===0)h+=`<div class="say">${X.say}</div><div class="ana">💡 ${X.ana}</div><div class="words"><h4>Words you need</h4><dl>${X.w.map(w=>`<dt>${w[0]}</dt><dd>${w[1]}</dd>`).join('')}</dl></div><div class="look">👀 <b>What to look for:</b> ${X.look}</div>`;
  else if(ls.s===1){const which=(ls.w==='B'&&sb)?'B':'A';h+=`${legend()}<div class="look">👀 ${X.look}</div><div class="two" id="wDiag"></div>
   <div class="ctl"><button class="pri" data-la="play">▶ Play</button><button data-la="pause">⏸ Pause</button><input type="range" id="lk" min="0" max="${N}" value="${ls.k}"> <b id="lkv"></b>${sb?`<button data-w="${'A'}" class="${which==='A'?'sel':''}">Explain A</button><button data-w="B" class="${which==='B'?'sel':''}">Explain B</button>`:''}</div><div class="narr" id="narr"></div>`}
  else if(ls.s===2)h+=`${L.b}${L.stalls?lessonStalls(L):''}<div class="mis">⚠️ <b>Common mistake:</b> ${X.mistake}</div>`;
  else{const qs=lessonQs(ls.i),st=ls.qa[ls.i]||(ls.qa[ls.i]={a:{},c:0});const ans=Object.keys(st.a).length;
   h+=`<p class="mut">Answer all ${qs.length} questions. Get at least ${Math.ceil(qs.length*.7)} right to complete the lesson.</p>`+qs.map((q,qi)=>{const a=st.a[qi];return `<div class="qc"><b>${qi+1}. ${q.q}</b><div class="o">${q.ch.map((c,ci)=>`<button data-la="pick" data-q="${qi}" data-c="${ci}" class="${a!==undefined?(ci===q.ans?'ok':ci===a?'no':''):''}" ${a!==undefined?'disabled':''}>${c}</button>`).join('')}</div>${a!==undefined?`<div class="mut" style="margin-top:6px">${a===q.ans?'<span class="good">✓ Correct.</span>':'<span class="badc">✗ Not quite.</span>'} ${q.why}</div>`:''}</div>`}).join('');
   if(LDR[ls.i])h+=`<div class="card bws" style="margin-top:10px"><h4>🧩 Branch drill: do it yourself</h4>${lsDone['d'+L.t]?'<div class="okr">✓ Drill completed.</div>':'<div id="drill"></div>'}</div>`;
   if(ans===qs.length){const ok=st.c>=Math.ceil(qs.length*.7);h+=ok?`<div class="tip"><b>${st.c}/${qs.length} correct.${LDR[ls.i]&&!lsDone['d'+L.t]?' Now finish the branch drill to complete the lesson.':' Lesson completed! 🎉'}</b>${lsDone[L.t]?'':(LDR[ls.i]&&!lsDone['d'+L.t]?'':' Study Points added.')}</div>`:`<div class="tip">${st.c}/${qs.length} correct. Read the lesson again and retry.</div><div class="btns"><button class="pri" data-la="retry">Try again</button></div>`}}
  h+=`<div class="btns"><button data-la="back">← Back</button><button class="pri" data-la="fwd">${ls.s<3?'Next →':(ls.i<LS.length-1?'Next lesson →':'Done')}</button><button data-la="load">Open in simulator</button><button data-la="prac">Practice test for this topic (level ${LMAP[ls.i]})</button></div>`;
  $('lsnBody').innerHTML=h;if(ls.s===1)paintWatch();
  if(ls.s===3&&LDR[ls.i]&&!lsDone['d'+L.t]&&$('drill')){const sp=drillSpec(ls.i),sm2=simulate(parse(sp.code),mkO(sp.opts));BWS($('drill'),sm2,sp.code,mkO(sp.opts),r=>{if(!r.gaveUp){lsDone['d'+L.t]=1;try{localStorage.setItem('mp64learn',JSON.stringify(lsDone))}catch(x){}tryComplete()}else{lsDone['dn'+ls.i]=(lsDone['dn'+ls.i]||0)+1}renderLesson()})}}
$('lsnTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b){ls.i=+b.dataset.k;ls.k=99;ls.s=0;renderLesson()}});
$('lsnBody').addEventListener('input',e=>{if(e.target.id==='lk'){stopPlay();ls.k=+e.target.value;paintWatch()}});
$('lsnBody').addEventListener('click',e=>{
  const w=e.target.closest('button[data-w]');if(w){ls.w=w.dataset.w;paintWatch();$('lsnBody').querySelectorAll('button[data-w]').forEach(x=>x.classList.toggle('sel',x===w));return}
  const b=e.target.closest('button[data-la]');if(!b)return;const a=b.dataset.la,L=LS[ls.i],{N}=lessonSims(L);
  if(a==='step'){ls.s=+b.dataset.s;ls.k=99;renderLesson()}
  else if(a==='back'){if(ls.s>0)ls.s--;else if(ls.i>0){ls.i--;ls.s=3}ls.k=99;renderLesson()}
  else if(a==='fwd'){if(ls.s<3)ls.s++;else if(ls.i<LS.length-1){ls.i++;ls.s=0}ls.k=99;renderLesson();$('learnCard').scrollIntoView({behavior:'smooth',block:'start'})}
  else if(a==='play'){stopPlay();ls.k=0;paintWatch();ls.play=setInterval(()=>{if(ls.k>=N){stopPlay();return}ls.k++;paintWatch()},1100)}
  else if(a==='pause')stopPlay();
  else if(a==='pick'){const qs=lessonQs(ls.i),st=ls.qa[ls.i]||(ls.qa[ls.i]={a:{},c:0}),qi=+b.dataset.q,ci=+b.dataset.c;st.a[qi]=ci;if(ci===qs[qi].ans)st.c++;
    tryComplete();renderLesson()}
  else if(a==='retry'){delete ls.qa[ls.i];renderLesson()}
  else if(a==='load'){const s=L.B||L.A;$('code').value=s.c||L.c;setOpts(Object.assign({},s.o,{cyc:12}));$('pre').value='';practice.active=false;grid=[];$('solCard').hidden=true;build();$('mine').scrollIntoView({behavior:'smooth',block:'center'})}
  else if(a==='prac'){$('lvl').value=String(LMAP[ls.i]);$('pracCard').scrollIntoView({behavior:'smooth',block:'start'})}
});


/* ===== Practice test ===== */
const practice={active:false,scored:false,gaveUp:false,seed:0,level:1,code:'',opts:{}};
const sc={ok:0,tried:0,streak:0};
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gen(level,seed){
  const rnd=rng(seed),pick=a=>a[Math.floor(rnd()*a.length)],chance=p=>rnd()<p;
  const regs=level>=7?['r2','r3','r4','r5','r6','r7','r8','r9']:['r1','r2','r3','r4','r5','r6','r7','r8','r9'];
  const recent=[];
  const src=()=>recent.length&&chance(.65)?pick(recent.slice(-2)):pick(regs);
  const mk={
    alu(){const d=pick(regs),s1=src(),s2=src();recent.push(d);return`${pick(['dadd','dsub','and','or','xor'])} ${d}, ${s1}, ${s2}`},
    imm(){const d=pick(regs),s1=src();recent.push(d);return`${pick(['daddi','ori'])} ${d}, ${s1}, ${pick([1,4,8,16])}`},
    ld(){const d=pick(regs),s1=src();recent.push(d);return`ld ${d}, ${pick([0,8,100,120])}(${s1})`},
    sd(){return`sd ${src()}, ${pick([0,8,16])}(${src()})`},
    mul(){const d=pick(regs),s1=src(),s2=src();recent.push(d);return`dmul ${d}, ${s1}, ${s2}`}
  };
  const body=(n,kinds)=>Array.from({length:n},()=>mk[pick(kinds)]());
  const ALU=['alu','alu','alu','imm'];
  const dep=ls=>{const ds=[];return ls.some((l,i)=>{const t=l.replace(/,/g,' ').split(/\s+/),u=t.slice(2),r=u.some(x=>ds.includes(x));ds.push(t[1]);return i>0&&r})};
  const memOps=ls=>ls.filter(l=>/^(ld|sd) /.test(l)).length;
  let lines=[],o={cyc:12,auto:1},tries=0;
  if(level===1){
    const d=['r1','r2','r3','r4','r5'],n=3+Math.floor(rnd()*2),s=['r7','r8','r9'];
    for(let i=0;i<n;i++)lines.push(`${pick(['dadd','dsub','and','or','xor'])} ${d[i]}, ${pick(s)}, ${pick(s)}`);
    o.fwd=chance(.5)?1:0;
  }else if(level===2||level===3){
    do{recent.length=0;lines=body(4+Math.floor(rnd()*2),ALU)}while(!dep(lines)&&++tries<40);
    o.fwd=level===2?0:(chance(.5)?1:0);
  }else if(level===4){
    const base=pick(['r8','r9']),d=pick(regs);recent.push(d);lines.push(`ld ${d}, ${pick([0,8,100,120])}(${base})`);
    if(chance(.5))lines.push(...body(1,['alu']));
    lines.push(`${pick(['dadd','dsub','or','xor'])} ${pick(regs)}, ${d}, ${pick(regs)}`);
    lines.push(...body(1+Math.floor(rnd()*2),ALU));o.fwd=chance(.75)?1:0;
  }else if(level===5){
    do{recent.length=0;lines=body(4+Math.floor(rnd()*2),['ld','sd','alu','alu','imm'])}while(memOps(lines)<2&&++tries<40);
    o.mem=1;o.fwd=1;
  }else if(level===6){
    o.init=`r8=${Math.floor(rnd()*4)} r9=${Math.floor(rnd()*4)}`;
    lines=[`${pick(['dadd','dsub'])} r2, r8, r9`];if(chance(.5))lines.push(`daddi r3, r2, ${pick([-1,1,2])}`);
    lines.push(`${pick(['beqz','bnez'])} ${lines.length>1?'r3':'r2'}, end`);lines.push(...body(2,ALU));lines.push('end:');lines.push(...body(1,ALU));
    o.pred=pick(['stall','nt']);o.early=chance(.4)?1:0;o.fwd=chance(.6)?1:0;
  }else if(level===7){
    lines=[`daddi r1, r0, ${pick([2,3])}`,'loop:',...body(2,ALU),'daddi r1, r1, -1','bnez r1, loop',...body(1,ALU)];
    o.fwd=1;o.early=1;o.pred=pick(['stall','nt']);o.cyc=16;
  }else if(level===8){
    do{recent.length=0;lines=body(3+Math.floor(rnd()*2),['alu','alu','mul','imm'])}while(!lines.some(l=>/^dmul/.test(l))&&++tries<40);
    o.mulLat=pick([3,4]);o.pipe=chance(.5)?1:0;o.fwd=1;o.cyc=14;
  }else if(level===9){
    lines=[`daddi r1, r0, ${pick([3,4])}`,'loop:',...body(2,['alu','mul','alu']),'daddi r1, r1, -1','bnez r1, loop',...body(1,ALU)];
    o.fwd=1;o.early=1;o.pred=pick(['nt','bht','bht']);o.mulLat=pick([3,4]);o.pipe=chance(.5)?1:0;o.cyc=22;
  }else{
    const kinds=['alu','alu','ld','mul','mul','imm'],n=2+Math.floor(rnd()*2);
    lines=[`daddi r1, r0, ${n}`,'loop:',...body(2+Math.floor(rnd()*2),kinds),'daddi r1, r1, -1','bnez r1, loop',...body(1,kinds)];
    o.fwd=chance(.7)?1:0;o.early=1;o.pred=pick(['nt','bht','bht']);o.mulLat=pick([3,4]);o.pipe=chance(.5)?1:0;o.ooo=chance(.7)?1:0;o.oooRet=chance(.5)?1:0;o.ren=chance(.3)?1:0;o.mem=chance(.3)?1:0;o.cyc=16;
  }
  return{code:lines.join('\n'),opts:o};
}
function descOpts(o){
  const d=[];d.push('Forwarding: '+(o.fwd?'ON':'off'));
  if(o.mem)d.push('single memory port');if(o.early)d.push('early branches (ID)');
  if(o.pred)d.push('branch policy: '+{stall:'stall fetch',nt:'always not taken',bht:'2-bit predictor (starts 01)'}[o.pred]);
  if(o.mulLat)d.push(`mul/div ${o.mulLat} cycles${o.pipe?' pipelined':''}`);
  if(o.ooo)d.push('out-of-order execution');if(o.mulLat)d.push(o.oooRet?'out-of-order retirement':'precise (in-order) retirement');
  if(o.ren)d.push('register renaming');
  return d.join(' · ');
}
function loadEx(level,seed){
  const g=gen(level,seed);Object.assign(practice,{active:true,scored:false,gaveUp:false,rewarded:0,hints:0,seed,level,code:g.code,opts:g.opts});
  $('pre').value='';$('code').value=g.code;setOpts(g.opts);grid=[];$('solCard').hidden=true;build();
  sc.tried++;afterLoad();showInfo();
}
function showInfo(){
  $('exInfo').innerHTML=`<b>Seed ${practice.seed}</b> · Settings of this exercise: ${descOpts(practice.opts)}<br>${($('bwsCard')&&!$('bwsCard').hidden)?'First complete <b>Step 1</b> below (run the branches). Then paint the pipeline diagram, and press':'Paint the pipeline diagram in “Your prediction” below, then press'} <b>Check my answer</b>. Hint and Show solution are available if you get stuck.`;
  $('score').textContent=`Solved ${sc.ok} of ${sc.tried} · streak ${sc.streak}`;
}
$('newEx').onclick=()=>{const s=+$('seed').value||Math.floor(Math.random()*90000)+10000;$('seed').value='';loadEx(+$('lvl').value,s)};
$('retryEx').onclick=()=>{if(practice.seed){sc.tried--;loadEx(practice.level,practice.seed)}};
$('chk').addEventListener('click',()=>{
  if(practice.active&&!practice.scored&&!practice.gaveUp&&$('res').textContent.startsWith('✓')){practice.scored=true;sc.ok++;sc.streak++;showInfo();$('res').innerHTML+=' <span class="good">Exercise solved! Press “New exercise” for another.</span>'}
});
$('rev').addEventListener('click',()=>{if(practice.active&&!practice.scored&&!practice.gaveUp){practice.gaveUp=true;sc.streak=0;showInfo()}});
$('code').addEventListener('input',()=>{practice.active=false});

const CTRN=['00','01','10','11'],CTRD=['strongly not taken','weakly not taken','weakly taken','strongly taken'];
function BWS(el,sm,code,o,done){
  const B=sm.brs,S={i:0,v:{},bad:[],locked:[],stage:'form',hints:0,errs:0,msg:''};
  const isZ=r=>/^(r0|\$0|\$zero)$/.test(r),init=Object.entries(o.init||{}).map(([k,v])=>k+' = '+v).join(', ')||'all registers are 0';
  const predTxt={stall:'none (fetch waits for the branch)',nt:'always predict not taken',bht:'2-bit counters, starting at 01'}[o.pred]||o.pred;
  const rule=bt=>({beq:'the two registers are equal',bne:'the two registers are different',beqz:'the register is zero',bnez:'the register is not zero',bgez:'the register is ≥ 0',bltz:'the register is < 0',blez:'the register is ≤ 0',bgtz:'the register is > 0'})[bt.op]||'the condition holds';
  const want=bt=>{const w={};bt.src.forEach((r,k)=>{if(!isZ(r))w['v'+k]=bt.vals[k]});w.out=bt.taken?'T':'N';
    if(o.pred==='bht'){w.cb=bt.cb;w.pr=bt.predT?'T':'N';w.ca=bt.ca}
    if(o.pred==='stall')w.st=o.early?'ID':'MEM';else w.hit=(bt.predT===bt.taken)?'H':'M';return w};
  const help=(f,bt)=>f[0]==='v'?`Work out the value of ${bt.src[+f.slice(1)]} when this branch runs: follow the instructions before it (and earlier loop passes). Start values: ${init}.`
   :f==='out'?`${bt.op} jumps when ${rule(bt)}. Check that against the register value(s).`
   :f==='cb'?'Counters start at 01. After that, use the counter left by the previous execution of this branch.'
   :f==='pr'?'Counter 10 or 11 → predict taken. Counter 00 or 01 → predict not taken.'
   :f==='ca'?'Taken → counter +1 (it stops at 11). Not taken → counter −1 (it stops at 00).'
   :f==='hit'?'Compare the prediction with what really happened.':'An early branch is resolved in ID. Otherwise the result is known in MEM.';
  const sel=(f,list)=>`<label>${list[0]}<select data-f="${f}" class="${S.bad.includes(f)?'bad':''}"><option value="">—</option>${list[1].map(([a,b])=>`<option value="${a}" ${String(S.v[f])===String(a)?'selected':''}>${b}</option>`).join('')}</select></label>`;
  const form=()=>{const bt=B[S.i];let h=`<div class="row2"><b>Execution #${S.i+1} of “${esc(bt.line)}”</b></div><div class="row2">`;
    bt.src.forEach((r,k)=>{h+=isZ(r)?`<label>${r}<input value="0" disabled style="width:60px"></label>`:`<label>Value of ${r} now<input type="number" data-f="v${k}" value="${S.v['v'+k]??''}" class="${S.bad.includes('v'+k)?'bad':''}" style="width:90px"></label>`});
    h+=sel('out',['Does it jump?',[['T','Taken'],['N','Not taken']]]);
    if(o.pred==='bht'){h+=sel('cb',['Counter before',CTRN.map((c,k)=>[k,c])])+sel('pr',['Prediction',[['T','Taken'],['N','Not taken']]])}
    if(o.pred==='nt')h+='<label>Prediction<input value="Not taken (always)" disabled style="width:150px"></label>';
    if(o.pred==='stall')h+=sel('st',['Resolved in stage',[['ID','ID'],['MEM','MEM']]]);else h+=sel('hit',['Prediction was',[['H','Right (hit)'],['M','Wrong (miss)']]]);
    if(o.pred==='bht')h+=sel('ca',['Counter after',CTRN.map((c,k)=>[k,c])]);
    return h+`</div><div class="btns"><button class="pri" data-b="check">Check</button><button data-b="hint">Hint</button></div>`};
  const summ=i=>{const bt=B[i],w=want(bt);return `<div class="okr">✓ #${i+1} ${esc(bt.line)}: ${bt.src.filter(r=>!isZ(r)).map((r,k)=>r+' = '+bt.vals[bt.src.indexOf(r)]).join(', ')} → <b>${bt.taken?'taken':'not taken'}</b>${o.pred==='bht'?` · counter ${CTRN[bt.cb]} (${bt.predT?'predicts taken':'predicts not taken'}) → ${CTRN[bt.ca]}`:''}${o.pred==='stall'?` · resolved in ${w.st}`:` · ${bt.predT===bt.taken?'<b>hit</b>':'<b>miss, wrong-path instructions are flushed</b>'}`}</div>`};
  const paint=()=>{let h=`<p>Before drawing the diagram, <b>run the program in your head</b>. Every time a branch instruction is executed, work out what happens. Registers that are not listed start at 0.</p><pre>${esc(code)}</pre><div class="mut" style="font-size:12px">Start: ${esc(init)} · Predictor: ${predTxt} · Branches are resolved in ${o.early?'ID':'MEM'}</div>`;
    h+=S.locked.map(summ).join('');
    if(S.stage==='form')h+=form();
    else if(S.stage==='next')h+=`<div class="row2"><b>Is this branch executed again before the program ends?</b></div><div class="btns"><button data-b="again">Yes, again</button><button data-b="end">No, the program continues past it</button></div>`;
    else{const m=B.filter(b=>o.pred!=='stall'&&b.predT!==b.taken).length;h+=`<div class="tip"><b>Branches done.</b> ${B.length} execution${B.length>1?'s':''}${o.pred!=='stall'?`, ${m} wrong prediction${m===1?'':'s'}`:''}.${o.pred==='bht'?` A predict-not-taken scheme would have missed ${B.filter(b=>b.taken).length}.`:''} Now draw the pipeline diagram: the wrong-path instructions of each miss appear as flushed rows.</div><div class="btns"><button class="pri" data-b="go">Draw the diagram →</button></div>`}
    if(S.msg)h+=`<div class="fb">${S.msg}</div>`;
    if(S.stage!=='final')h+=`<div class="btns"><button data-b="skip" class="mut">Give up and show the diagram (no points)</button></div>`;
    el.innerHTML=h};
  el.onchange=e=>{const f=e.target.dataset.f;if(f)S.v[f]=e.target.value};el.oninput=el.onchange;
  el.onclick=e=>{const b=e.target.closest('button[data-b]');if(!b)return;const a=b.dataset.b,bt=B[S.i];
    if(a==='check'){const w=want(bt),bad=Object.keys(w).filter(f=>String(S.v[f]??'')===''||String(S.v[f])!==String(w[f]));S.bad=bad;
      if(!bad.length){S.locked.push(S.i);S.stage=S.i+1<B.length?'next':'next';S.msg='';S.v={}}
      else{S.errs++;S.msg=bad.map(f=>'✗ '+help(f,bt)).join('<br>')}paint()}
    else if(a==='hint'){S.hints++;const w=want(bt),f=Object.keys(w).find(f=>String(S.v[f]??'')!==String(w[f]));S.msg=f?`💡 ${help(f,bt)} <b>Answer for this field: ${f==='out'?(w[f]==='T'?'Taken':'Not taken'):f==='pr'?(w[f]==='T'?'Taken':'Not taken'):f==='hit'?(w[f]==='H'?'Right':'Wrong'):(f==='cb'||f==='ca')?CTRN[w[f]]:w[f]}</b>`:'Everything looks right: press Check.';paint()}
    else if(a==='again'){if(S.i+1<B.length){S.i++;S.stage='form';S.msg='';S.bad=[]}else S.msg='✗ Look at the registers: after this execution the branch is not taken again and the program moves on.';paint()}
    else if(a==='end'){if(S.i+1>=B.length){S.stage='final';S.msg=''}else S.msg='✗ Not yet. The loop condition still holds, so the branch jumps back and runs again.';paint()}
    else if(a==='go')done({hints:S.hints,errs:S.errs,gaveUp:false});else if(a==='skip')done({hints:S.hints+3,errs:S.errs,gaveUp:true})};
  paint()}
function unlockGrid(){$('pal').closest('.card').hidden=false;$('bwsCard').hidden=true}
function afterLoad(){const gc=$('pal').closest('.card'),bc=$('bwsCard');
  practice.bws=!!(sim.brs&&sim.brs.length&&practice.level>=6);
  if(practice.bws){gc.hidden=true;bc.hidden=false;
    BWS($('bws'),sim,$('code').value,getO(),r=>{practice.hints=(practice.hints||0)+r.hints;if(r.gaveUp){practice.gaveUp=true;sc.streak=0}gc.hidden=false;bc.hidden=true;showInfo();$('mine').scrollIntoView({behavior:'smooth',block:'center'})});
    bc.scrollIntoView({behavior:'smooth',block:'start'})}
  else{gc.hidden=false;bc.hidden=true;$('mine').scrollIntoView({behavior:'smooth',block:'center'})}}
/* ---- branch predictor gym ---- */
const GYMP={loop3:()=>'TTNTTNTTN'.split(''),loop4:()=>'TTTNTTTN'.split(''),alt:()=>'TNTNTNTN'.split(''),mostlyT:r=>Array.from({length:10},()=>r()<.2?'N':'T'),mostlyN:r=>Array.from({length:10},()=>r()<.2?'T':'N'),random:r=>Array.from({length:10},()=>r()<.5?'T':'N')};
const GYMN={loop3:'a loop that runs 3 times, twice',loop4:'a loop that runs 4 times, twice',alt:'a branch that alternates',mostlyT:'a branch that is usually taken',mostlyN:'a branch that is usually not taken',random:'a coin-flip branch'};
let gy=null;
function gymStart(level){const seed=Math.floor(Math.random()*90000)+10000,r=rng(seed),names=level===1?['loop3','loop4','mostlyT','mostlyN']:Object.keys(GYMP),k=names[Math.floor(r()*names.length)],seq=GYMP[k](r),start=level===1?1:Math.floor(r()*4);
  let one=0,ob=0,nt=0,lb=0;seq.forEach(x=>{const t=x==='T';if(!t)lb=0;nt+=t?1:0;one+=((lb?1:0)!==(t?1:0))?1:0;lb=t?1:0});
  gy={seed,k,level,seq,start,ctr:start,i:0,miss:0,errs:0,step:'pred',msg:'',one,nt,hist:[]};gymPaint()}
function gymPaint(){const el=$('gym');if(!gy){el.innerHTML=`<p>Train the 2-bit counter on its own. You get a series of branch outcomes. For each one, say what the predictor <b>guesses</b>, then update the <b>counter</b>. Learning pays Study Points (up to 30 a day).</p><div class="btns"><button class="pri" data-g="s1">Start · counters begin at 01</button><button data-g="s2">Start · random counter, more patterns</button></div>`;return}
  const g=gy,done=g.i>=g.seq.length;
  let h=`<div class="mut">Pattern: ${GYMN[g.k]} · counter starts at <b>${CTRN[g.start]}</b></div><div class="chips2">${g.seq.map((x,k)=>`<span class="${k===g.i&&!done?'cur':''} ${g.hist[k]===undefined?'':g.hist[k]?'hit':'miss'}">${k<g.i||(k===g.i&&g.step==='upd')?x:'?'}</span>`).join('')}</div>`;
  if(done){h+=`<div class="tip"><b>Finished!</b> Your 2-bit predictor missed <b>${g.miss}</b> of ${g.seq.length}. For comparison: always-not-taken would miss <b>${g.nt}</b>, and a 1-bit predictor (remember only the last outcome, starts not taken) <b>${g.one}</b>.</div><div class="btns"><button class="pri" data-g="again">Another sequence</button></div>`}
  else if(g.step==='pred')h+=`<div>Counter now: <span class="ctr">${CTRN[g.ctr]}</span> <span class="mut">(${CTRD[g.ctr]})</span></div><div><b>What does the predictor guess?</b></div><div class="btns"><button data-g="pT">Taken</button><button data-g="pN">Not taken</button></div>`;
  else h+=`<div>The branch was <b>${g.seq[g.i]==='T'?'taken':'not taken'}</b>. Counter was <b>${CTRN[g.ctr]}</b>. <b>What is the new counter?</b></div><div class="btns">${CTRN.map((c,k)=>`<button data-g="c${k}">${c}</button>`).join('')}</div>`;
  if(g.msg)h+=`<div class="fb">${g.msg}</div>`;el.innerHTML=h}
$('gym').addEventListener('click',e=>{const b=e.target.closest('button[data-g]');if(!b)return;const a=b.dataset.g;
  if(a==='s1')gymStart(1);else if(a==='s2')gymStart(2);else if(a==='again')gymStart(gy.level);
  else if(gy&&a[0]==='p'){const pred=a[1]==='T';if(pred===(gy.ctr>=2)){gy.step='upd';gy.pred=pred;gy.msg=(gy.seq[gy.i]==='T')===pred?'✓ Right guess.':'✗ That guess will be wrong.'}else{gy.errs++;gy.msg=`Counter ${CTRN[gy.ctr]}: 10 or 11 means predict taken, 00 or 01 means predict not taken.`}gymPaint()}
  else if(gy&&a[0]==='c'){const t=gy.seq[gy.i]==='T',nc=t?Math.min(3,gy.ctr+1):Math.max(0,gy.ctr-1);
    if(+a[1]===nc){const hit=gy.pred===t;if(!hit)gy.miss++;gy.hist[gy.i]=hit;gy.ctr=nc;gy.i++;gy.step='pred';gy.msg='';
      if(gy.i>=gy.seq.length){try{parent!==window&&parent.MPT&&parent.MPT.learn({id:'mips-gym-'+gy.seed,sp:Math.max(2,6-gy.errs),cap:'gym',why:'Branch predictor gym'})}catch(x){}}}
    else{gy.errs++;gy.msg=t?'Taken: the counter goes up by 1 (it stops at 11).':'Not taken: the counter goes down by 1 (it stops at 00).'}gymPaint()}});
gymPaint();
$('chk').addEventListener('click',()=>{});
const _preCh=$('pre').onchange;$('pre').onchange=()=>{practice.active=false;unlockGrid();_preCh&&_preCh()};

$('chk').addEventListener('click',()=>{
  if(!$('res').textContent.startsWith('✓'))return;
  try{if(parent===window||!parent.MPT)return;
    if(practice.scored&&practice.active&&!practice.rewarded){practice.rewarded=1;parent.MPT.learn({id:'mips-prac-'+practice.level+'-'+practice.seed,sp:Math.round((5+2*practice.level+(practice.bws?6:0))*(practice.hints?.5:1)),cap:'practice',why:'Practice test, level '+practice.level+(practice.hints?' (hint used)':'')})}
    else if(!practice.active){let h=0,s=$('code').value+JSON.stringify(getO());for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;parent.MPT.learn({id:'mips-ex-'+h,sp:6,why:'Exercise solved'})}
  }catch(e){}
});
$('hint').addEventListener('click',()=>{practice.hints=(practice.hints||0)+1});
renderLesson();showInfo();

$('pre').value='0';$('pre').onchange();$('calc').onclick();$('calc2').onclick();
