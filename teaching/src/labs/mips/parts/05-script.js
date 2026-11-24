
//U3-START
const U3=(()=>{
const lg=n=>Math.round(Math.log2(n));
const isP2=n=>typeof n==='number'&&n>0&&Number.isInteger(n)&&Number.isInteger(Math.log2(n));
const hex=(n,w)=>n.toString(16).toUpperCase().padStart(w||1,'0');
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* parse a number: 0x1F, 1Fh, 101b, 1_000, decimal; radix = default for bare digits */
function num(s,radix){s=String(s).trim().replace(/[_\s]/g,'');if(s==='')return NaN;
  let m;if(m=s.match(/^0x([0-9a-f]+)$/i))return parseInt(m[1],16);
  if(m=s.match(/^([0-9a-f]+)h$/i))return parseInt(m[1],16);
  if(radix!==16&&(m=s.match(/^([01]+)b$/i)))return parseInt(m[1],2);
  radix=radix||10;const re=radix===16?/^[0-9a-f]+$/i:/^[0-9]+$/;
  return re.test(s)?parseInt(s,radix):NaN}
const SZ={b:1,kib:1024,mib:1048576,gib:1073741824,kb:1024,mb:1048576,gb:1073741824,k:1024,m:1048576,g:1073741824};
function size(s){s=String(s).trim();const m=s.match(/^([0-9.]+)\s*([a-z]*)$/i);if(!m)return NaN;const u=m[2].toLowerCase();if(u&&!(u in SZ))return NaN;return Number(m[1])*(u?SZ[u]:1)}
function fmtSize(n){for(const [u,v] of [['GiB',1073741824],['MiB',1048576],['KiB',1024]])if(n>=v&&n%v===0)return n/v+' '+u;return n+' B'}

/* ---------- geometry / address fields ---------- */
function fields(c){ // {addrBits,size,block,ways:number|'FA'|1}
  const lines=c.size/c.block,ways=(c.ways==='FA'||c.ways==null)&&c.ways!==1?(c.ways==='FA'?lines:1):c.ways,sets=lines/ways;
  const err=[];
  if(!isP2(c.block))err.push('block size must be a power of two');
  if(!isP2(c.size))err.push('cache size must be a power of two');
  if(!(lines>=1))err.push('cache smaller than one block');
  if(!isP2(ways)||ways>lines)err.push('ways must be a power of two ≤ number of lines');
  const off=lg(c.block),idx=err.length?0:lg(sets),tag=c.addrBits-idx-off;
  if(tag<0)err.push('address too narrow for this cache');
  return{lines,ways,sets,offBits:off,idxBits:idx,tagBits:tag,addrBits:c.addrBits,blocks:Math.pow(2,c.addrBits)/c.block,err}}
function split(c,addr){const f=fields(c),blk=Math.floor(addr/c.block);return{blk,off:addr%c.block,set:blk%f.sets,tag:Math.floor(blk/f.sets)}}

/* ---------- average access time ---------- */
// tc,tp (per word), td ; Ac,Ap hit rates ; B words per cache block
function readTime(p){const miss=p.Ap*p.tp*p.B+(1-p.Ap)*p.td;return p.Ac*p.tc+(1-p.Ac)*miss}
function readTime2(p){return p.Ac*p.tc+(1-p.Ac)*p.tp*p.B}           // two levels (main memory always hits)
// write-through: hit = tp ; miss without allocate = tp ; miss with allocate = block fetch + tp
function writeTime(p,alloc){const missFetch=p.Ap*p.tp*p.B+(1-p.Ap)*p.td;return alloc?p.Ac*p.tp+(1-p.Ac)*(missFetch+p.tp):p.tp}
function mixTime(r,tr,tw){return r*tr+(1-r)*tw}
function hierCost(levels){return levels.reduce((a,l)=>a+l.mib*l.cost,0)}

/* ---------- cache ---------- */
function mkCache(f,block){const sets=[];for(let s=0;s<f.sets;s++)sets.push(Array.from({length:f.ways},()=>({v:0,d:0,tag:0,blk:-1,t:0,ins:0,m:'I'})));return{f,block,sets,clock:0}}
function victim(S,repl){let w=0;for(let i=1;i<S.length;i++){const a=S[i],b=S[w];if(repl==='FIFO'?a.ins<b.ins:a.t<b.t)w=i}return w}
function access(C,addr,isW,pol){
  const f=C.f,blk=Math.floor(addr/C.block),off=addr%C.block,set=blk%f.sets,tag=Math.floor(blk/f.sets),S=C.sets[set];C.clock++;
  let way=S.findIndex(l=>l.v&&l.tag===tag);
  const r={addr,blk,set,tag,off,rw:isW?'W':'R',hit:way>=0,way:-1,replaced:null,wb:null,memWrite:null,alloc:false};
  if(way>=0){const l=S[way];l.t=C.clock;r.way=way;if(isW){if(pol.write==='wb')l.d=1;else r.memWrite=blk}}
  else if(isW&&!pol.alloc){r.memWrite=blk}
  else{way=S.findIndex(l=>!l.v);if(way<0)way=victim(S,pol.repl);const l=S[way];
    if(l.v){r.replaced=l.blk;if(l.d)r.wb=l.blk}
    l.v=1;l.tag=tag;l.blk=blk;l.d=0;l.t=C.clock;l.ins=C.clock;r.way=way;r.alloc=true;
    if(isW){if(pol.write==='wb')l.d=1;else r.memWrite=blk}}
  return r}
function lruRank(S){const o=S.map((l,i)=>i).filter(i=>S[i].v).sort((a,b)=>S[a].t-S[b].t);const rk={};o.forEach((i,k)=>rk[i]=k);return rk}
function applyInit(C,init){(init||[]).forEach(l=>{const L=C.sets[l.set]&&C.sets[l.set][l.way];if(!L)return;L.v=l.v?1:0;L.d=l.d?1:0;L.tag=l.tag;L.blk=l.v?l.tag*C.f.sets+l.set:-1;L.t=l.age||0;L.ins=l.age||0;C.clock=Math.max(C.clock,l.age||0)})}
function lookup(C,addr){const blk=Math.floor(addr/C.block),set=blk%C.f.sets,tag=Math.floor(blk/C.f.sets),S=C.sets[set],w=S.findIndex(l=>l.v&&l.tag===tag);return{blk,set,tag,off:addr%C.block,hit:w>=0,way:w}}
function simulate(c,trace,init){
  // c: {addrBits,size,block,ways,repl:'LRU'|'FIFO',write:'wb'|'wt',alloc:bool,split:bool,tc,tp,missModel:'single'|'block'}
  const pol={repl:c.repl||'LRU',write:c.write||'wb',alloc:c.alloc!==false};
  const full=fields(c);if(full.err.length)return{err:full.err};
  let caches;
  if(c.split){const h=fields({addrBits:c.addrBits,size:c.size/2,block:c.block,ways:Math.min(c.ways==='FA'?full.lines/2:c.ways,full.lines/2)});if(h.err.length)return{err:h.err};caches={C:mkCache(h,c.block),D:mkCache(h,c.block)}}
  else caches={U:mkCache(full,c.block)};
  if(init&&caches.U)applyInit(caches.U,init);
  const res=[];let hits=0,time=0;const repl=[],upd=[],miss=[];
  const tc=c.tc==null?1:c.tc,tp=c.tp==null?10:c.tp;
  trace.forEach((t,i)=>{
    const C=c.split?(t.cd==='C'?caches.C:caches.D):caches.U;
    const r=access(C,t.addr,t.rw==='W',pol);r.i=i+1;r.cd=t.cd||'';res.push(r);
    if(r.hit)hits++;else miss.push(t.addr);
    if(r.replaced!=null&&!repl.includes(r.replaced))repl.push(r.replaced);
    const u=[r.wb,r.memWrite].filter(x=>x!=null);u.forEach(b=>{if(!upd.includes(b))upd.push(b)});
    time+=r.hit?tc:(c.missModel==='block'?tp*c.block:tp);
  });
  return{rows:res,hits,misses:trace.length-hits,n:trace.length,hitRate:trace.length?hits/trace.length:0,missAddrs:miss,replaced:repl,updated:upd,time,caches,fields:full}}
function stateRows(C){const rows=[];C.sets.forEach((S,s)=>{const rk=lruRank(S);S.forEach((l,w)=>rows.push({set:s,way:w,v:l.v,d:l.d,tag:l.tag,blk:l.blk,lru:l.v?rk[w]:null}))});return rows}
function parseTrace(txt,radix){ // "R 15C0" | "W 2080 D" | "L 400 C" | "E 149 D" | plain address (read) ; text after ; or # ignored
  const out=[],errs=[];String(txt).split(/\n/).forEach((ln,k)=>{ln=ln.replace(/[;#].*$/,'').trim();if(!ln)return;
    let p=ln.split(/[\s,]+/).filter(Boolean),rw='R',cd='D';
    if(p.length>1&&/^[RLWE]$/i.test(p[0])){rw=/^[WE]$/i.test(p[0])?'W':'R';p=p.slice(1)}
    if(p.length>1&&/^[CD]$/i.test(p[p.length-1])){cd=p[p.length-1].toUpperCase();p=p.slice(0,-1)}
    const a=p.length===1?num(p[0],radix):NaN;
    if(isNaN(a))errs.push('line '+(k+1)+': cannot read “'+ln+'”');else out.push({addr:a,rw,cd})});
  return{trace:out,errs}}
function loopTrace(arrs,count,elem,rw){ // arrs:[base...]; one access per element, interleaved per iteration
  const t=[];for(let i=0;i<count;i++)arrs.forEach((b,k)=>t.push({addr:b+i*elem,rw:(rw&&rw[k])||'R',cd:'D'}));return t}

/* ---------- MESI ---------- */
function mesi(c,ops){ // c:{addrBits,size,block,ways,np}
  const f=fields(c);if(f.err.length)return{err:f.err};const np=c.np||2;
  const P=Array.from({length:np},()=>mkCache(f,c.block));const out=[];
  const find=(Cc,blk)=>{const S=Cc.sets[blk%f.sets];const w=S.findIndex(l=>l.v&&l.blk===blk);return w<0?null:S[w]};
  ops.forEach((o,i)=>{
    const blk=Math.floor(o.addr/c.block),set=blk%f.sets,tag=Math.floor(blk/f.sets),Cp=P[o.p];Cp.clock++;
    const rec={i:i+1,p:o.p,rw:o.rw,addr:o.addr,blk,set,hit:false,replaced:null,updated:[],before:[],after:[],note:[]};
    rec.before=P.map(Cc=>{const l=find(Cc,blk);return l?l.m:'I'});
    const mine=find(Cp,blk);
    const others=P.map((Cc,k)=>k===o.p?null:find(Cc,blk));
    const upd=b=>{if(!rec.updated.includes(b))rec.updated.push(b)};
    if(mine){rec.hit=true;mine.t=Cp.clock;
      if(o.rw==='W'){ if(mine.m==='S'){others.forEach(l=>{if(l){l.v=0;l.m='I'}});rec.note.push('invalidate other copies')} mine.m='M';mine.d=1}}
    else{
      const S=Cp.sets[set];let w=S.findIndex(l=>!l.v);
      if(w<0){w=victim(S,'LRU');const v=S[w];rec.replaced=v.blk;if(v.m==='M')upd(v.blk)}
      const l=S[w];l.v=1;l.blk=blk;l.tag=tag;l.t=Cp.clock;l.ins=Cp.clock;
      if(o.rw==='R'){
        let any=false;others.forEach(x=>{if(!x)return;any=true;if(x.m==='M'){upd(blk);x.d=0}x.m='S'});
        l.m=any?'S':'E';l.d=0}
      else{others.forEach(x=>{if(!x)return;if(x.m==='M')upd(blk);x.v=0;x.m='I'});l.m='M';l.d=1}}
    rec.after=P.map(Cc=>{const l=find(Cc,blk);return l?l.m:'I'});out.push(rec)});
  return{rows:out,caches:P,fields:f}}

/* ---------- virtual memory ---------- */
function vmGeom(g){const offB=lg(g.page),vpnB=g.vBits-offB,frB=g.pBits-offB;
  return{offB,vpnB,frameBits:frB,pages:Math.pow(2,vpnB),frames:Math.pow(2,frB),physBytes:Math.pow(2,g.pBits),virtBytes:Math.pow(2,g.vBits),ptBytes:Math.pow(2,vpnB)*(g.entryBytes||1)}}
// table: {vpn:{pres:1,frame:n,rw:0|1 (1=read only),us:1|0 (1=user),loc:'X'}} ; absent = invalid
function translate(g,table,va,mode){const G=vmGeom(g),vpn=Math.floor(va/g.page),off=va%g.page,e=table[vpn];
  const r={va,vpn,off,outcome:'',pa:null,frame:null,entry:e||null};
  if(va>=G.virtBytes||va<0){r.outcome='range';return r}
  if(!e||(!e.pres&&!e.loc)){r.outcome='invalid';return r}
  if(!e.pres){r.outcome='disk';return r}
  if(mode&&mode.user&&e.us===0){r.outcome='protection';r.why='kernel-only page accessed from user level';return r}
  if(mode&&mode.write&&e.rw===1){r.outcome='protection';r.why='write to a read-only page';return r}
  r.frame=e.frame;r.pa=e.frame*g.page+off;r.outcome='ok';return r}
function tlbSim(entries,vpns,table){const tlb=[];let t=0;const out=[];
  vpns.forEach(v=>{t++;const k=tlb.findIndex(x=>x.v===v);const present=table&&table[v]&&table[v].pres;
    if(k>=0){tlb[k].t=t;out.push({vpn:v,hit:true,evicted:null})}
    else{let ev=null;const e={v,t};if(tlb.length<entries)tlb.push(e);else{let w=0;tlb.forEach((x,i)=>{if(x.t<tlb[w].t)w=i});ev=tlb[w].v;tlb[w]=e}
      out.push({vpn:v,hit:false,evicted:ev,pageFault:table?!present:false})}});
  return{rows:out,hits:out.filter(x=>x.hit).length,tlb}}
function vcLimit(page,ways){return page*ways} // max cache size for V/P indexing without synonyms

return{lg,isP2,hex,rng,num,size,fmtSize,fields,split,readTime,readTime2,writeTime,mixTime,hierCost,mkCache,access,simulate,applyInit,lookup,stateRows,parseTrace,loopTrace,mesi,vmGeom,translate,tlbSim,vcLimit};
})();
//U3-END

//U3GEN-START
const U3G=(()=>{
const U=U3,hx=U.hex;
const TYPES={fields:'Address fields & sizes',amat:'Average access time & cost',trace:'Cache trace: hits, misses, replacements',loop:'Hit rate of a loop',vm:'Paging & address translation',mesi:'MESI coherence'};
const fx=(n,d)=>{const s=Number(n.toPrecision(d||6));return String(s)};
const GEOM=g=>`${g.ways==='FA'?'fully associative':g.ways===1?'direct-mapped':g.ways+'-way set associative'}`;
const rows=a=>`<table class="mt">${a.map((r,i)=>'<tr>'+r.map(c=>i===0?`<th>${c}</th>`:`<td>${c}</td>`).join('')+'</tr>').join('')}</table>`;
const P=(id,label,kind,ans,extra)=>Object.assign({id,label,kind,ans},extra||{});
function gen(type,seed,level){
  level=level||2;const r=U.rng(seed*7919+type.length*131+level),pick=a=>a[Math.floor(r()*a.length)],ch=p=>r()<p;
  const g={fields,amat,trace,loop,vm,mesi}[type];return Object.assign({type,seed,level},g(r,pick,ch,level))}
/* ---------------- fields ---------------- */
function fields(r,pick,ch,L){
  const block=pick(L>1?[4,8,16,32,64]:[4,8,16]),lines=pick(L>1?[16,32,64,128,256,512,1024]:[8,16,32,64]),ways=pick(L>1?[1,2,4,8,'FA']:[1,2,4,'FA']);
  const size=block*lines,w=ways==='FA'?lines:ways,sets=lines/w;
  const off=U.lg(block),idx=U.lg(sets),addrBits=Math.max(off+idx+pick([2,3,4,6,8]),L>1?16:12);
  const f=U.fields({addrBits,size,block,ways});
  const unit='byte addressing';
  return{title:'Cache address fields',
    intro:`<p>A computer has a ${addrBits}-bit address space (${unit}) and a cache of <b>${U.fmtSize(size)}</b> whose lines hold <b>${block} bytes</b>. The placement policy is <b>${GEOM({ways})}</b>.</p>`,
    parts:[P('lines','How many cache lines?','num',f.lines,{tol:0}),P('sets','How many sets?','num',f.sets,{tol:0}),P('blocks','How many memory blocks does the main memory have?','num',f.blocks,{tol:0}),
      P('off','Offset field, bits','num',f.offBits,{tol:0}),P('idx','Index (line / set) field, bits (0 if none)','num',f.idxBits,{tol:0}),P('tag','Tag field, bits','num',f.tagBits,{tol:0})],
    sol:`<ul><li>Lines = cache size / block size = ${size} / ${block} = <b>${f.lines}</b>.</li><li>Sets = lines / ways = ${f.lines} / ${f.ways} = <b>${f.sets}</b>.</li><li>Memory blocks = 2<sup>${addrBits}</sup> / ${block} = <b>${f.blocks}</b>.</li><li>Offset = log₂(${block}) = <b>${f.offBits}</b> bits.</li><li>Index = log₂(${f.sets}) = <b>${f.idxBits}</b> bits (${ways==='FA'?'fully associative: no index':ways===1?'direct-mapped: one set per line':'one set per group of '+ways+' lines'}).</li><li>Tag = ${addrBits} − ${f.idxBits} − ${f.offBits} = <b>${f.tagBits}</b> bits.</li></ul>`}}
/* ---------------- amat ---------------- */
function amat(r,pick,ch,L){
  const v=pick(L>1?['two','three','three','wt','cost']:['two','three']);
  const tc=pick([0.5,1,2,4]),tp=pick([3,5,10,15,20]),B=pick([4,8,16,32,64]),Ac=pick([0.9,0.95,0.97,0.98,0.985,0.99,0.995]),Ap=pick([0.999,0.9999,0.99995,0.99999,0.999999]),tdms=pick([5,8,10,11]),td=tdms*1e6;
  const base=`<p>Cache: t<sub>c</sub> = ${tc} ns per word, hit rate A<sub>c</sub> = ${Ac*100}%. Main memory: t<sub>p</sub> = ${tp} ns per word${v==='two'?', always hit (hit rate 100%)':`, hit rate A<sub>p</sub> = ${fx(Ap*100)}%`}.${v==='two'?'':` Disk: t<sub>d</sub> = ${tdms} ms per block (any size).`} A cache block has <b>${B} words</b>; one word is transferred per access. Ignore the time to move the word from the cache to the CPU on a miss.</p>`;
  const p={Ac,Ap:v==='two'?1:Ap,tc,tp,td,B};
  if(v==='two'){const t=U.readTime2(p);return{title:'Average read time (cache + main memory)',intro:base,parts:[P('t','Average read time, ns','num',t,{tol:0.005,rel:1})],sol:`<p>t = A<sub>c</sub>·t<sub>c</sub> + (1−A<sub>c</sub>)·B·t<sub>p</sub> = ${Ac}·${tc} + ${fx(1-Ac,4)}·${B}·${tp} = <b>${fx(t,6)} ns</b></p><p class="mut">A cache miss copies the whole block (B words) from main memory.</p>`}}
  if(v==='cost'){const sizes=[{n:'Cache',mib:pick([1,2,4,8]),cost:pick([10,15,20])},{n:'Main memory',mib:pick([1024,4096,8192]),cost:pick([0.005,0.01,0.02])},{n:'Disk',mib:pick([102400,262144,1048576]),cost:pick([0.0001,0.0002,0.00005])}];
    const cost=U.hierCost(sizes);const t=U.readTime(p);
    return{title:'Cost and average read time',intro:base+rows([['Level','Size','Cost'],...sizes.map(s=>[s.n,U.fmtSize(s.mib*1048576),s.cost+' €/MiB'])]),parts:[P('cost','Total cost of the memory system, €','num',cost,{tol:0.005,rel:1}),P('t','Average read time, ns','num',t,{tol:0.005,rel:1})],
      sol:`<ul><li>Cost = Σ size × price = ${sizes.map(s=>`${s.mib} MiB × ${s.cost}`).join(' + ')} = <b>${fx(cost,6)} €</b>.</li><li>t = A<sub>c</sub>·t<sub>c</sub> + (1−A<sub>c</sub>)·[A<sub>p</sub>·B·t<sub>p</sub> + (1−A<sub>p</sub>)·t<sub>d</sub>] = <b>${fx(t,6)} ns</b></li></ul>`}}
  if(v==='three'){const t=U.readTime(p);const t2=U.readTime2(p);return{title:'Average read time (three levels)',intro:base,parts:[P('t','Average read time, ns','num',t,{tol:0.005,rel:1}),P('t2','Average read time if the main memory hit rate were 100%, ns','num',t2,{tol:0.005,rel:1})],
    sol:`<p>Miss penalty of the cache = A<sub>p</sub>·B·t<sub>p</sub> + (1−A<sub>p</sub>)·t<sub>d</sub> = ${fx(Ap)}·${B}·${tp} + ${fx(1-Ap,4)}·${td} = ${fx(Ap*B*tp+(1-Ap)*td,6)} ns</p><p>t = ${Ac}·${tc} + ${fx(1-Ac,4)}·${fx(Ap*B*tp+(1-Ap)*td,6)} = <b>${fx(t,6)} ns</b>.</p><p>With A<sub>p</sub> = 1: t = ${Ac}·${tc} + ${fx(1-Ac,4)}·${B}·${tp} = <b>${fx(t2,6)} ns</b>.</p>`}}
  // write-through
  const rd=pick([0.6,0.7,0.75,0.8]);const Acw=Math.min(0.999,Ac+pick([0,0.005,0.01]));
  const pr={Ac,Ap,tc,tp,td,B},pw={Ac:Acw,Ap,tc,tp,td,B};
  const trc=U.readTime(pr),twN=U.writeTime(pr,false),twA=U.writeTime(pw,true);
  const totN=U.mixTime(rd,trc,twN),totA=U.mixTime(rd,trc,twA);
  return{title:'Write-through: read, write and mean access time',intro:`<p>The cache is <b>write-through</b>: every write is also written to main memory, so a write that hits takes t<sub>p</sub>. With <b>no write allocate</b> a write miss just writes main memory (t<sub>p</sub>), hit rate A<sub>c</sub> = ${Ac*100}%. With <b>write allocate</b> a write miss first loads the block (same cost as a read miss) and then writes (t<sub>p</sub>), hit rate A<sub>c</sub> = ${fx(Acw*100)}%.</p><p>t<sub>c</sub> = ${tc} ns, t<sub>p</sub> = ${tp} ns per word, A<sub>p</sub> = ${fx(Ap*100)}%, t<sub>d</sub> = ${tdms} ms, block = ${B} words. ${rd*100}% of the accesses are reads and ${fx((1-rd)*100)}% are writes.</p>`,
    parts:[P('tr','Average read time, ns (hit rate '+Ac*100+'%)','num',trc,{tol:0.005,rel:1}),P('twn','Average write time, no write allocate, ns','num',twN,{tol:0.005,rel:1}),P('twa','Average write time, write allocate, ns','num',twA,{tol:0.005,rel:1}),P('best','Which gives the lower mean access time for this mix?','sel',totN<=totA?'no':'yes',{opts:[['no','No write allocate'],['yes','Write allocate']]})],
    sol:`<ul><li>t<sub>r</sub> = A<sub>c</sub>·t<sub>c</sub> + (1−A<sub>c</sub>)·[A<sub>p</sub>·B·t<sub>p</sub> + (1−A<sub>p</sub>)·t<sub>d</sub>] = <b>${fx(trc,6)} ns</b></li><li>No write allocate: every write costs t<sub>p</sub> = <b>${tp} ns</b>... but the memory is also reached with its own miss rate; the exercise model keeps it at t<sub>p</sub>: <b>${fx(twN,6)} ns</b>.</li><li>Write allocate: t<sub>w</sub> = A<sub>c</sub>·t<sub>p</sub> + (1−A<sub>c</sub>)·(miss penalty + t<sub>p</sub>) = <b>${fx(twA,6)} ns</b></li><li>Mean = ${rd}·t<sub>r</sub> + ${fx(1-rd,3)}·t<sub>w</sub>: no allocate <b>${fx(totN,6)} ns</b>, allocate <b>${fx(totA,6)} ns</b> → ${totN<=totA?'<b>no write allocate</b>':'<b>write allocate</b>'} wins.</li></ul>`}}
/* ---------------- trace ---------------- */
function mkTrace(r,pick,ch,g,len,wr){
  const nb=pick([3,4,5,6]),blocks=[];for(let i=0;i<nb;i++)blocks.push(Math.floor(r()*(Math.pow(2,g.addrBits)/g.block)));
  // force a few conflicts: reuse sets
  if(nb>2&&g.ways!=='FA'){const f=U.fields(g);blocks[1]=blocks[0]+f.sets*pick([1,2,3]);if(blocks[1]>=Math.pow(2,g.addrBits)/g.block)blocks[1]=blocks[0]%f.sets+f.sets}
  const t=[];let cur=blocks[0],off=0;
  for(let i=0;i<len;i++){if(ch(.4)){cur=pick(blocks);off=Math.floor(r()*g.block)}else off=(off+1)%g.block;
    t.push({addr:cur*g.block+off,rw:wr&&ch(.3)?'W':'R',cd:'D'})}
  return t}
function trace(r,pick,ch,L){
  const block=pick([2,4,8]),lines=pick([4,8]),ways=pick(L>1?[1,2,'FA']:[1,2]),addrBits=pick([8,10,12]);
  const write=pick(['wb','wb','wt']),alloc=write==='wb'?true:ch(.5),repl='LRU';
  const g={addrBits,size:block*lines,block,ways,repl,write,alloc};
  const len=pick(L>1?[12,14,16]:[10,12]);const wr=true;const t=mkTrace(r,pick,ch,g,len,wr);
  const s=U.simulate(g,t),f=s.fields,aw=Math.ceil(addrBits/4);
  const hm=s.rows.map(x=>x.hit?'H':'M');
  const polTxt=(write==='wb'?'write-back':'write-through')+(write==='wt'?(alloc?', write allocate':', no write allocate'):', write allocate');
  const intro=`<p>A cache with <b>${lines} lines</b> of <b>${block} bytes</b> (byte addressing, ${addrBits}-bit addresses), <b>${GEOM(g)}</b> placement${ways===1?'':', LRU replacement'}, <b>${polTxt}</b>. It starts empty. The CPU performs these accesses (R = read, W = write, addresses in hexadecimal):</p>`
    +`<div class="tr">${t.map((x,i)=>`<span><i>${i+1}</i> ${x.rw} ${hx(x.addr,aw)}h</span>`).join('')}</div>`;
  const hr=s.hitRate;
  const lst=a=>a.length?a.map(b=>hx(b)+'h').join(', '):'none';
  return{title:'Cache trace',intro,trace:t,cfg:g,
    parts:[P('hm','For each access: hit (H) or miss (M)','hmseq',hm,{n:t.length,labels:t.map(x=>x.rw+' '+hx(x.addr,aw))}),P('hr','Hit rate (fraction, % or x/y)','frac',hr,{tol:0.001}),
      P('rep','Memory blocks replaced (hex, comma separated, or NONE)','hexlist',s.replaced),P('upd',write==='wb'?'Memory blocks updated by write-back (hex, or NONE)':'Memory blocks written in main memory (hex, or NONE)','hexlist',s.updated)],
    sol:`<p>Fields: offset ${f.offBits} bit${f.offBits>1?'s':''}, index ${f.idxBits}, tag ${f.tagBits}. Block number = address / ${block}.</p>`+solTable(s,t,aw)+`<p>Hits ${s.hits}/${s.n} = <b>${fx(hr*100,5)}%</b>. Replaced blocks: <b>${lst(s.replaced)}</b>. ${write==='wb'?'Blocks written back (dirty when replaced)':'Blocks written in main memory'}: <b>${lst(s.updated)}</b>.${write==='wb'?'<br>Dirty blocks still in the cache at the end are <i>not</i> yet updated in memory.':''}</p>`}}
function solTable(s,t,aw){return rows([['#','Access','Block','Set','Tag','Result','Replaced','Written to memory'],...s.rows.map((x,i)=>[x.i,x.rw+' '+hx(x.addr,aw)+'h',hx(x.blk)+'h',x.set,hx(x.tag)+'h',x.hit?'hit':'<b>miss</b>',x.replaced!=null?hx(x.replaced)+'h'+(x.wb!=null?' (dirty)':''):'–',x.wb!=null?hx(x.wb)+'h':x.memWrite!=null?hx(x.memWrite)+'h':'–'])])}
/* ---------------- loop ---------------- */
function loop(r,pick,ch,L){
  const block=pick([16,32,64]),lines=pick([64,128,256]),size=block*lines,ways=pick([1,1,2]);const elem=pick([4,8]);const n=pick([100,200,256,512,1024]);const two=ch(.5);
  const addrBits=20,span=size;
  const a0=pick([0,1,2,3])*block/2*0+Math.floor(r()*Math.pow(2,addrBits-1)/16)*16;
  const conflict=two&&ch(.7);
  const b0=conflict?(a0+size*pick([1,2,3]))%Math.pow(2,addrBits):Math.floor(r()*Math.pow(2,addrBits-1)/16)*16;
  const arrs=two?[a0,b0]:[a0];
  const g={addrBits,size,block,ways,repl:'LRU',write:'wb',alloc:true};
  const t=U.loopTrace(arrs,n,elem,arrs.map(()=>'W'));const s=U.simulate(g,t);
  const code=two?`for (i = 0; i < ${n}; i++) { a[i] = 0; b[i] = i; }`:`for (i = 0; i < ${n}; i++) { v[i] = 0; }`;
  const f=s.fields;
  return{title:'Hit rate of a loop',cfg:g,trace:t,
    intro:`<p>A computer has ${addrBits}-bit addresses (byte addressing) and a unified <b>${GEOM(g)}</b> cache of <b>${U.fmtSize(size)}</b> with <b>${block}-byte</b> lines (write-back, write allocate, LRU), initially empty.</p><pre>${code}</pre><p>Elements are ${elem}-byte integers; each element is one memory access. ${two?`<code>a</code> starts at address <b>${hx(a0,5)}h</b> and <code>b</code> at <b>${hx(b0,5)}h</b>.`:`<code>v</code> starts at address <b>${hx(a0,5)}h</b>.`} Loop counters and constants live in registers (no memory accesses). The accesses of an iteration are done in the order written.</p>`,
    parts:[P('hr','Hit rate (fraction, % or x/y)','frac',s.hitRate,{tol:0.001}),P('miss','Number of misses','num',s.misses,{tol:0})],
    sol:`<p>Fields: offset ${f.offBits}, index ${f.idxBits}, tag ${f.tagBits}. A block holds ${block/elem} elements.</p><p>${two?`Index of a[0] = ${(Math.floor(a0/block))%f.sets}, index of b[0] = ${(Math.floor(b0/block))%f.sets}.${(Math.floor(a0/block)-Math.floor(b0/block))%f.sets===0&&ways===1?' They map to the <b>same line</b>, so a[i] and b[i] evict each other on every iteration.':''}`:`Sequential access: one miss per block, the following ${block/elem-1} accesses hit (spatial locality).`}</p><p>Simulated: <b>${s.misses}</b> misses out of ${s.n} accesses → hit rate <b>${fx(s.hitRate*100,5)}%</b> (${s.hits}/${s.n}).</p>`}}
/* ---------------- vm ---------------- */
function vm(r,pick,ch,L){
  const page=pick([256,512,1024,4096]),vBits=pick([16,20,24]),pBits=pick([14,16,18]).valueOf(),entry=pick([1,2,4]);
  const g={vBits,pBits:Math.max(pBits,U.lg(page)+3),page,entryBytes:entry};const G=U.vmGeom(g);
  const vpns=[];while(vpns.length<7){const v=Math.floor(r()*G.pages);if(!vpns.includes(v))vpns.push(v)}
  const usedF=[];const table={};
  vpns.forEach((v,i)=>{const k=i<4?'mem':i<6?'disk':'inv';
    if(k==='mem'){let f;do{f=Math.floor(r()*G.frames)}while(usedF.includes(f));usedF.push(f);table[v]={pres:1,frame:f,rw:pick([0,0,1]),us:pick([1,1,0])}}
    else if(k==='disk')table[v]={pres:0,loc:'D'+(i-3),rw:0,us:1};else table[v]={pres:0,rw:0,us:1}});
  const qs=[];const ent=Object.keys(table).map(Number);
  const mems=ent.filter(v=>table[v].pres),disks=ent.filter(v=>!table[v].pres&&table[v].loc),inv=ent.filter(v=>!table[v].pres&&!table[v].loc);
  const cand=[[pick(mems),'read',true],[pick(mems),'write',true],[pick(disks),'read',true],[pick(inv),'read',true],[pick(mems),'read',false]];
  const picks=[];while(picks.length<3){const c=pick(cand);if(!picks.includes(c))picks.push(c)}
  const aw=Math.ceil(vBits/4),pw=Math.ceil(g.pBits/4);
  const ops=picks.map(([v,m,user])=>({va:v*page+Math.floor(r()*page),write:m==='write',user}));
  const tr=ops.map(o=>U.translate(g,table,o.va,{user:o.user,write:o.write}));
  const tab=[['Virtual page','Present','R/W','U/S','Frame / location'],...Object.keys(table).map(Number).sort((a,b)=>a-b).map(v=>{const e=table[v];return[hx(v,Math.ceil(G.vpnB/4))+'h',e.pres?'1':'0',e.rw?'1 (read only)':'0 (read/write)',e.us?'1 (user)':'0 (kernel)',e.pres?hx(e.frame,Math.ceil(G.frameBits/4))+'h':e.loc?'disk: '+e.loc:'invalid']})];
  const OPT=[['ok','Translated (give the physical address)'],['disk','Recoverable page fault (page is on disk)'],['invalid','Fatal fault (page not valid)'],['protection','Protection violation']];
  const parts=[P('pages','Number of entries of the page table (= virtual pages)','num',G.pages,{tol:0}),P('frames','Number of page frames in physical memory','num',G.frames,{tol:0}),P('ptb',`Size of the page table, bytes (${entry} byte${entry>1?'s':''} per entry)`,'num',G.ptBytes,{tol:0})];
  ops.forEach((o,i)=>{const t=tr[i];parts.push(P('o'+i,`Access ${i+1}: ${o.write?'write':'read'} at <b>${hx(o.va,aw)}h</b> from ${o.user?'<b>user</b>':'<b>kernel</b>'} level`,'vm',{outcome:t.outcome,pa:t.pa},{opts:OPT,pw}))});
  return{title:'Paging and address translation',table,cfg:g,
    intro:`<p>A paged virtual memory system: <b>${vBits}-bit</b> virtual addresses, <b>${g.pBits}-bit</b> physical addresses, pages of <b>${U.fmtSize(page)}</b> (byte addressing). Bits: R/W = 1 means read-only, U/S = 1 means user-level page (U/S = 0: kernel only). Page table of the running task (pages not listed are invalid):</p>${rows(tab)}`,
    parts,sol:`<ul><li>Offset = log₂(${page}) = ${G.offB} bits → virtual page number = ${vBits}−${G.offB} = ${G.vpnB} bits → 2<sup>${G.vpnB}</sup> = <b>${G.pages}</b> entries.</li><li>Frame number = ${g.pBits}−${G.offB} = ${G.frameBits} bits → <b>${G.frames}</b> frames.</li><li>Page table size = ${G.pages} × ${entry} = <b>${G.ptBytes} bytes</b>.</li>${ops.map((o,i)=>{const t=tr[i];return`<li>Access ${i+1}: ${hx(o.va,aw)}h → page ${hx(t.vpn)}h, offset ${hx(t.off)}h → `+vmWhy(t,pw)+'</li>'}).join('')}</ul>`}}
function vmWhy(t,pw){switch(t.outcome){
  case'ok':return`present, allowed → frame ${hx(t.frame)}h → physical address <b>${hx(t.pa,pw)}h</b>`;
  case'disk':return'page not present but it has a location on disk → <b>recoverable page fault</b> (the OS loads it and repeats the access)';
  case'invalid':return'page not present and no storage assigned → <b>fatal page fault</b>';
  default:return`<b>protection violation</b> (${t.why})`}}
/* ---------------- mesi ---------------- */
function mesi(r,pick,ch,L){
  const block=16,addrBits=8,lines=4,ways=pick([1,2]);const g={addrBits,size:block*lines,block,ways,np:2};const f=U.fields(g);
  const base=[pick([0x10,0x20,0x30]),pick([0x40,0x50,0x60])];base[1]=base[1]|0;
  const blocks=[base[0],base[1],base[0]+f.sets*block*(1)];
  const n=pick([5,6]),ops=[];for(let i=0;i<n;i++)ops.push({p:ch(.5)?1:0,rw:ch(.45)?'W':'R',addr:pick(blocks.slice(0,ways===1?3:2))+Math.floor(r()*block)});
  const m=U.mesi(g,ops);
  const aw=2;
  const SO=[['M','M'],['E','E'],['S','S'],['I','I']];
  const parts=[];m.rows.forEach((x,i)=>{parts.push(P('h'+i,`${i+1}. P${x.p+1} ${x.rw==='R'?'reads':'writes'} ${hx(x.addr,aw)}h — hit or miss?`,'sel',x.hit?'H':'M',{opts:[['H','hit'],['M','miss']]}));
    parts.push(P('a'+i,'&nbsp;&nbsp;state of the block in P1','sel',x.after[0],{opts:SO}));parts.push(P('b'+i,'&nbsp;&nbsp;state of the block in P2','sel',x.after[1],{opts:SO}));
    parts.push(P('u'+i,'&nbsp;&nbsp;is main memory updated?','sel',x.updated.length?'Y':'N',{opts:[['N','no'],['Y','yes (a write-back)']]}))});
  return{title:'MESI coherence (2 processors)',cfg:g,ops,
    intro:`<p>Two processors P1 and P2 each have a private cache (<b>${U.fmtSize(g.size)}</b>, ${block}-byte lines, ${GEOM({ways})}, write-back, LRU, byte addressing, ${addrBits}-bit addresses) kept coherent with the <b>MESI</b> write-invalidate protocol. Both caches are empty. For each access write whether it hits, the state of <i>that block</i> in each cache afterwards (I if it is not cached), and whether the access forces an update of main memory (a dirty copy written back).</p>`,
    parts,sol:`<p>Block numbers are address / ${block}.</p>`+rows([['#','Access','Hit?','P1','P2','Memory updated','Why'],...m.rows.map(x=>[x.i,'P'+(x.p+1)+' '+x.rw+' '+hx(x.addr,2)+'h',x.hit?'hit':'miss',x.after[0],x.after[1],x.updated.length?hx(x.updated[0])+'h':'–',expl(x)])])}}
function expl(x){const b=x.before,me=x.p,o=1-me;
  if(x.hit){if(x.rw==='R')return'read hit, no bus traffic';if(b[me]==='M')return'write hit on M: stays M';if(b[me]==='E')return'write hit on E: silent upgrade to M';return'write hit on S: invalidate the other copy, → M'}
  if(x.rw==='R'){if(b[o]==='I')return'read miss, no other copy → E';if(b[o]==='M')return'read miss: the other cache holds it modified → writes it back, both S';return'read miss, other copy exists → both S'}
  return b[o]==='M'?'write miss: the other cache holds it modified → write-back and invalidate; → M':b[o]!=='I'?'write miss: invalidate the other copy; → M':'write miss, no other copy → M'}
/* ---------------- checking ---------------- */
function parseFrac(s){s=String(s).trim().replace(',','.');if(!s)return NaN;let m;
  if(m=s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/))return+m[2]?m[1]/m[2]:NaN;
  if(m=s.match(/^(\d+(?:\.\d+)?)\s*%$/))return m[1]/100;
  const v=parseFloat(s);if(isNaN(v)||!/^[0-9.]+$/.test(s))return NaN;return v}
function parseList(s){s=String(s).trim();if(!s||/^(none|no|-|–|ninguno)$/i.test(s))return[];const o=[];for(const t of s.split(/[\s,;]+/).filter(Boolean)){const v=U.num(t,16);if(isNaN(v))return null;o.push(v)}return[...new Set(o)].sort((a,b)=>a-b)}
function checkPart(p,a){
  if(a==null||a==='')return false;
  switch(p.kind){
    case'num':{const v=parseFloat(String(a).replace(',','.'));if(isNaN(v))return false;if(!p.tol)return v===p.ans;
      return p.rel?Math.abs(v-p.ans)<=Math.max(Math.abs(p.ans)*p.tol,1e-9):Math.abs(v-p.ans)<=p.tol}
    case'frac':{const v=parseFrac(a);return!isNaN(v)&&Math.abs(v-p.ans)<=p.tol}
    case'sel':return String(a)===String(p.ans);
    case'hmseq':return Array.isArray(a)&&a.length===p.ans.length&&a.every((x,i)=>x===p.ans[i]);
    case'hexlist':{const l=parseList(a);if(l===null)return false;const e=[...p.ans].sort((x,y)=>x-y);return l.length===e.length&&l.every((x,i)=>x===e[i])}
    case'vm':{if(!a||a.outcome!==p.ans.outcome)return false;if(p.ans.outcome!=='ok')return true;const v=U.num(a.pa||'',16);return v===p.ans.pa}
  }return false}
function check(ex,ans){const res={};let all=true;ex.parts.forEach(p=>{const ok=checkPart(p,ans[p.id]);res[p.id]=ok;if(!ok)all=false});return{res,all}}
return{TYPES,gen,check,checkPart,parseFrac,parseList};
})();
//U3GEN-END

//U3UI-START
(function(){
const U=U3,G=U3G,hx=U.hex;
const q=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const tb=(n,w)=>n.toString(2).padStart(w,'0');
const fx=(n,d)=>String(Number(n.toPrecision(d||6)));
const root=q('u3');
/* ================= unit switch ================= */
function showUnit(u,sc){q('u2').hidden=u!=='u3'?false:true;root.hidden=u!=='u3';
  document.querySelectorAll('#unitNav button').forEach(b=>b.classList.toggle('sel',b.dataset.u===u));
  try{localStorage.setItem('mp64unit',u)}catch(e){}try{history.replaceState(null,'',u==='u3'?'#unit3':'#unit2')}catch(e){}if(sc)window.scrollTo(0,0)}
document.querySelectorAll('#unitNav button').forEach(b=>b.onclick=()=>showUnit(b.dataset.u,1));
let start='u2';try{start=localStorage.getItem('mp64unit')||'u2'}catch(e){}if(location.hash==='#unit3')start='u3';else if(location.hash==='#unit2')start='u2';
showUnit(start);
/* ================= section tabs ================= */
const SECS=['learn','prac','cache','paging','mesi','ref'];
function showSec(s){SECS.forEach(k=>q('m3s-'+k).hidden=k!==s);document.querySelectorAll('#m3tabs button').forEach(b=>b.classList.toggle('sel',b.dataset.s===s))}
document.querySelectorAll('#m3tabs button').forEach(b=>b.onclick=()=>showSec(b.dataset.s));showSec('learn');
/* ================= shared renderers ================= */
function cacheHTML(C,o){o=o||{};const f=C.f,rows=U.stateRows(C),multi=f.ways>1,wb=o.wb!==false;
  return`<table class="mt cs"><tr><th>${f.sets>1?'Set':'Line'}</th>${multi?'<th>Way</th>':''}<th>V</th>${wb?'<th>D</th>':''}<th>Tag</th><th>Block</th>${multi&&o.lru!==false?'<th>LRU</th>':''}</tr>`+
   rows.map(r=>{const hl=o.hl&&o.hl.set===r.set&&o.hl.way===r.way;return`<tr class="${hl?'hl':''}${r.v?'':' inv'}"><td>${r.set}</td>${multi?`<td>${r.way}</td>`:''}<td>${r.v}</td>${wb?`<td>${r.v?r.d:'–'}</td>`:''}<td>${r.v?(f.tagBits?tb(r.tag,f.tagBits):'–'):'–'}</td><td>${r.v?hx(r.blk)+'h':'–'}</td>${multi&&o.lru!==false?`<td>${r.v?r.lru:'–'}</td>`:''}</tr>`}).join('')+'</table>'}
function narrate(r,c,f,aw){
  const t=`${r.rw==='R'?'Read':'Write'} <b>${hx(r.addr,aw)}h</b> → block ${hx(r.blk)}h, ${f.sets>1?'set '+r.set+', ':''}tag ${f.tagBits?tb(r.tag,f.tagBits):'–'}, offset ${r.off}: `;
  if(r.hit)return t+'<b class="good">hit</b>'+(r.rw==='W'?(c.write==='wb'?' · line marked dirty (memory not updated yet)':' · written also to main memory'):'');
  if(r.rw==='W'&&!r.alloc)return t+'<b class="badc">miss</b> · no write allocate: the word goes straight to main memory, the cache is unchanged';
  let m=t+'<b class="badc">miss</b> · block loaded into '+(f.ways>1?`way ${r.way} of set ${r.set}`:'line '+r.set);
  if(r.replaced!=null)m+=` · replaces block ${hx(r.replaced)}h`+(r.wb!=null?' <b>(dirty → written back to memory)</b>':' (clean, just dropped)');
  if(r.rw==='W')m+=c.write==='wb'?' · then written in the cache (dirty)':' · then written also in main memory';
  return m}
function cfgText(c,f){return`${U.fmtSize(c.size)} cache, ${c.block}-byte lines, ${f.lines} lines, ${c.ways==='FA'?'fully associative':c.ways===1?'direct-mapped':c.ways+'-way set associative ('+f.sets+' sets)'} · fields: tag ${f.tagBits} | index ${f.idxBits} | offset ${f.offBits}`}
/* interactive visual stepper: address bits → main-memory block → cache line */
function bitBar(c,f,addr){const full=tb(addr,c.addrBits),t=full.slice(0,f.tagBits),i=full.slice(f.tagBits,f.tagBits+f.idxBits),o=full.slice(f.tagBits+f.idxBits);
  return`<div class="bits"><span class="bt" title="tag">${t||'∅'}</span><span class="bi" title="index">${i||'∅'}</span><span class="bo" title="offset">${o||'∅'}</span></div><div class="mut" style="font-size:11px">tag (${f.tagBits}) | ${f.ways===1?'line':'set'} index (${f.idxBits}) | offset (${f.offBits})</div>`}
function memStrip(c,T,k,s,f){ // distinct blocks touched, tinted when currently cached
  const blocks=[];T.forEach(t=>{const b=Math.floor(t.addr/c.block);if(!blocks.includes(b))blocks.push(b)});
  const cached=new Set();Object.values(s.caches).forEach(C=>U.stateRows(C).forEach(r=>{if(r.v)cached.add(r.blk)}));
  const cur=k>0?Math.floor(T[k-1].addr/c.block):-1;
  return`<div class="mem3"><div class="mut" style="font-size:11px">Main memory blocks used by this trace (green = currently in the cache)</div>${blocks.map(b=>`<span class="${b===cur?'cur':''} ${cached.has(b)?'in':''}">${hx(b)}h<small>→ ${f.sets>1?'set '+(b%f.sets):'line '+(b%f.lines)}</small></span>`).join('')}</div>`}
function stepper(el,spec){
  let k=0,timer=0;const c=spec.cfg,f=U.fields(c),aw=Math.ceil(c.addrBits/4),T=spec.trace;
  el.classList.add('stp3');
  const stop=()=>{if(timer){clearInterval(timer);timer=0}};
  function paint(){
    const s=U.simulate(c,T.slice(0,k)),C=s.caches.U||s.caches.D;const last=s.rows[s.rows.length-1];
    const showC=c.split?['C','D']:['U'];
    el.innerHTML=`<div class="mut">${cfgText(c,f)}</div><div class="trk">${T.map((t,i)=>{const r=i<k?s.rows[i]:null;return`<span class="${i===k?'cur':''} ${r?(r.hit?'hit':'miss'):''}">${t.rw} ${hx(t.addr,aw)}h</span>`}).join('')}</div>
    <div class="btns"><button data-a="prev" ${k<=0?'disabled':''}>◀ Back</button><button data-a="step" ${k>=T.length?'disabled':''}>Next access ▶</button><button data-a="play">${timer?'⏸ Pause':'▶ Play'}</button><button data-a="all">Run all</button><button data-a="reset">Reset</button></div>
    ${last?bitBar(c,f,last.addr):''}
    <div class="narr3">${last?narrate(last,c,f,aw):'<i>The cache is empty. Press “Next access”.</i>'}</div>
    ${memStrip(c,T,k,s,f)}
    ${showC.map(n=>`${c.split?`<h4>${n==='C'?'Code':'Data'} cache</h4>`:''}<div class="scroll">${cacheHTML(s.caches[n],{hl:last&&last.way>=0&&(!c.split||(last.cd||'D')===n)?{set:last.set,way:last.way}:null,wb:c.write!=='wt'})}</div>`).join('')}
    ${k>=T.length?`<div class="stats"><div>Hits <b>${s.hits}</b>/${s.n}</div><div>Hit rate <b>${fx(s.hitRate*100,4)}%</b></div><div>Replaced <b>${s.replaced.length?s.replaced.map(b=>hx(b)+'h').join(', '):'none'}</b></div><div>Written to memory <b>${s.updated.length?s.updated.map(b=>hx(b)+'h').join(', '):'none'}</b></div></div>`:''}`;
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=b.dataset.a;
      if(a==='play'){if(timer)stop();else{if(k>=T.length)k=0;timer=setInterval(()=>{if(!el.isConnected||k>=T.length){stop();paint();return}k++;paint()},1000);k<T.length&&k++}paint();return}
      stop();if(a==='step'&&k<T.length)k++;else if(a==='prev'&&k>0)k--;else if(a==='all')k=T.length;else if(a==='reset')k=0;paint()})}
  paint()}
function cachesBox(m,aw){return m.caches.map((C,p)=>`<div><h4>P${p+1} cache</h4><table class="mt cs"><tr><th>Set</th><th>Way</th><th>Block</th><th>State</th></tr>${U.stateRows(C).filter(r=>r.v).map(r=>`<tr><td>${r.set}</td><td>${r.way}</td><td>${hx(r.blk)}h</td><td class="st${C.sets[r.set][r.way].m}">${C.sets[r.set][r.way].m}</td></tr>`).join('')||'<tr><td colspan="4" class="mut">empty</td></tr>'}</table></div>`).join('')}
function mesiStepper(el,spec){
  let k=0,timer=0;const g=spec.cfg,aw=Math.ceil(g.addrBits/4);el.classList.add('stp3');
  const stop=()=>{if(timer){clearInterval(timer);timer=0}};
  function paint(){const m=U.mesi(g,spec.ops.slice(0,k)),r=m.rows[m.rows.length-1];
    el.innerHTML=`<div class="trk">${spec.ops.map((o,i)=>`<span class="${i===k?'cur':''}">P${o.p+1} ${o.rw} ${hx(o.addr,aw)}h</span>`).join('')}</div>
    <div class="btns"><button data-a="prev" ${k<=0?'disabled':''}>◀ Back</button><button data-a="step" ${k>=spec.ops.length?'disabled':''}>Next access ▶</button><button data-a="play">${timer?'⏸ Pause':'▶ Play'}</button><button data-a="reset">Reset</button></div>
    <table class="mt"><tr><th>Block ${r?hx(r.blk)+'h':''}</th><th>P1</th><th>P2</th><th>Main memory</th></tr><tr><td>State after the access</td><td class="st${r?r.after[0]:'I'}">${r?r.after[0]:'I'}</td><td class="st${r?r.after[1]:'I'}">${r?r.after[1]:'I'}</td><td>${r&&r.updated.length?'<b>updated</b> (write-back of '+hx(r.updated[0])+'h)':'–'}</td></tr></table>
    <div class="narr3">${r?`<b>${k}.</b> P${r.p+1} ${r.rw==='R'?'reads':'writes'} ${hx(r.addr,aw)}h: ${r.hit?'<b class="good">hit</b>':'<b class="badc">miss</b>'}${r.replaced!=null?' · replaces block '+hx(r.replaced)+'h':''} — ${mexpl(r)}`:'<i>Both caches are empty.</i>'}</div>
    <div class="m3two">${cachesBox(m,aw)}</div>`;
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=b.dataset.a;
      if(a==='play'){if(timer)stop();else{if(k>=spec.ops.length)k=0;timer=setInterval(()=>{if(!el.isConnected||k>=spec.ops.length){stop();paint();return}k++;paint()},1200);k<spec.ops.length&&k++}paint();return}
      stop();if(a==='step'&&k<spec.ops.length)k++;else if(a==='prev'&&k>0)k--;else if(a==='reset')k=0;paint()})}
  paint()}
/* ================= solve-it-yourself grids ================= */
const SK='—';
function normCell(kind,v){v=String(v==null?'':v).trim();
  if(kind==='hex'){if(v===''||/^(-|–|—|none|no|n)$/i.test(v))return'';const n=U.num(v,16);return isNaN(n)?'?':String(n)}
  if(kind==='bin'){if(v==='')return'';return/^[01]+$/.test(v)?String(parseInt(v,2)):'?'}
  if(kind==='int'){if(v==='')return'';const n=parseInt(v,10);return isNaN(n)?'?':String(n)}
  return v}
const showCell=(kind,a,w)=>a===''||a==null?'':kind==='hex'?hx(+a):kind==='bin'?tb(+a,w||1):String(a);
function solveGrid(el,spec){
  const cols=spec.cols,rows=spec.rows,ex=spec.extras||[];
  const cell=(c,i)=>c.kind==='sel'?`<select data-r="${i}" data-c="${c.k}"><option value=""></option>${c.opts.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`:`<input type="text" data-r="${i}" data-c="${c.k}" autocomplete="off" ${c.ph?`placeholder="${c.ph}"`:''}>`;
  el.innerHTML=`<div class="scroll"><table class="mt sg"><tr><th>#</th>${cols.map(c=>`<th>${c.label}</th>`).join('')}</tr>${rows.map((r,i)=>`<tr><td>${r.label}</td>${cols.map(c=>`<td>${c.hide&&c.hide(r)?'':cell(c,i)}</td>`).join('')}</tr>`).join('')}</table></div>
  ${ex.map((e,i)=>`<div class="pp"><label>${e.label}</label><input type="text" data-x="${i}" autocomplete="off"></div>`).join('')}
  <div class="btns"><button class="pri" data-a="chk">Check</button><button data-a="hint">Hint</button><button data-a="sol">Show solution</button><button data-a="clr">Clear</button></div><div class="sgres" style="font-weight:700;margin-top:8px"></div>`;
  const res=el.querySelector('.sgres');
  const cellEl=(i,k)=>el.querySelector(`[data-r="${i}"][data-c="${k}"]`);
  const exp=(c,r)=>c.kind==='sel'?String(r.ans[c.k]):r.ans[c.k]==null?'':String(r.ans[c.k]);
  function wrongCells(){const w=[];rows.forEach((r,i)=>cols.forEach(c=>{const e=cellEl(i,c.k);if(!e)return;const ok=normCell(c.kind,e.value)===exp(c,r)&&(c.kind!=='sel'||e.value!=='');w.push({i,c,e,ok})}));return w}
  el.onclick=ev=>{const b=ev.target.closest('button[data-a]');if(!b)return;const a=b.dataset.a;
    if(a==='clr'){el.querySelectorAll('input,select').forEach(x=>{x.value='';x.classList.remove('ok','bad')});res.textContent='';return}
    if(a==='sol'){rows.forEach((r,i)=>cols.forEach(c=>{const e=cellEl(i,c.k);if(!e)return;e.value=c.kind==='sel'?String(r.ans[c.k]):showCell(c.kind,r.ans[c.k],c.w)}));ex.forEach((x,i)=>{el.querySelector(`[data-x="${i}"]`).value=x.show});res.innerHTML='<span class="mut">Solution shown.</span>';return}
    const w=wrongCells();
    if(a==='chk'){let bad=0;w.forEach(x=>{x.e.classList.toggle('ok',x.ok);x.e.classList.toggle('bad',!x.ok);if(!x.ok)bad++});
      ex.forEach((x,i)=>{const e=el.querySelector(`[data-x="${i}"]`),ok=x.check(e.value);e.classList.toggle('ok',ok);e.classList.toggle('bad',!ok);if(!ok)bad++});
      res.innerHTML=bad?`<span class="badc">✗ ${bad} wrong or missing cell${bad>1?'s':''} (red).</span>`:'<span class="good">✓ Everything is correct!</span>';return}
    if(a==='hint'){const f=w.find(x=>!x.ok);if(f){f.e.focus();f.e.classList.add('bad');res.innerHTML=`<span class="mut">Row ${rows[f.i].label.replace(/<[^>]+>/g,'')}, “${f.c.label.replace(/<[^>]+>/g,'')}”: ${f.c.hint}</span>`;return}
      const fx2=ex.findIndex((x,i)=>!x.check(el.querySelector(`[data-x="${i}"]`).value));res.innerHTML=fx2>=0?`<span class="mut">${ex[fx2].hint}</span>`:'<span class="good">No mistakes found.</span>'}}}
function mexpl(x){const b=x.before,me=x.p,o=1-me;
  if(x.hit){if(x.rw==='R')return'read hit: no bus traffic, state unchanged.';if(b[me]==='M')return'write hit on M: stays M.';if(b[me]==='E')return'write hit on E: becomes M silently (nobody else has it).';return'write hit on S: the other copy is invalidated, this one becomes M.'}
  if(x.rw==='R'){if(b[o]==='I')return'nobody else has it: loaded as <b>E</b> (Exclusive).';if(b[o]==='M')return'the other cache has it Modified: it writes it back to memory, then both are <b>S</b>.';return'the other cache has a copy: both become <b>S</b> (Shared).'}
  return b[o]==='M'?'the other cache has it Modified: write-back to memory and invalidate; this one becomes <b>M</b>.':b[o]!=='I'?'other copies are invalidated; this one becomes <b>M</b>.':'no other copy: loaded and written, state <b>M</b>.'}
/* ================= demos for lessons ================= */
function demoAmat(el){
  el.innerHTML=`<div class="frm">${[['Ac','Cache hit rate',0.95],['tc','t<sub>c</sub> (ns)',1],['tp','t<sub>p</sub> per word (ns)',10],['B','Block (words)',8],['Ap','Main memory hit rate',0.9999],['td','t<sub>d</sub> (ms)',10]].map(([i,l,v])=>`<label>${l}<input type="number" step="any" id="dA_${i}" value="${v}"></label>`).join('')}</div><div id="dA_out" class="stats"></div><div id="dA_tab"></div>`;
  const rd=()=>({Ac:+q('dA_Ac').value,tc:+q('dA_tc').value,tp:+q('dA_tp').value,B:+q('dA_B').value,Ap:+q('dA_Ap').value,td:+q('dA_td').value*1e6});
  const upd=()=>{const p=rd(),t3=U.readTime(p),t2=U.readTime2(p);
    q('dA_out').innerHTML=`<div>2 levels (A<sub>p</sub>=1): <b>${fx(t2,5)} ns</b></div><div>3 levels: <b>${fx(t3,5)} ns</b></div><div>Miss penalty of the cache: <b>${fx(p.Ap*p.tp*p.B+(1-p.Ap)*p.td,5)} ns</b></div>`;
    q('dA_tab').innerHTML=`<table class="mt"><tr><th>Cache hit rate</th>${[0.5,0.8,0.9,0.95,0.99,0.999,1].map(a=>`<th>${a*100}%</th>`).join('')}</tr><tr><td>Average read time (ns)</td>${[0.5,0.8,0.9,0.95,0.99,0.999,1].map(a=>`<td>${fx(U.readTime(Object.assign({},p,{Ac:a})),4)}</td>`).join('')}</tr></table><p class="mut">Even a 1% miss rate matters: the miss penalty is hundreds of times larger than a hit.</p>`};
  el.querySelectorAll('input').forEach(i=>i.oninput=upd);upd()}
function demoFields(el){
  el.innerHTML=`<div class="frm"><label>Address bits<input type="number" id="dF_a" value="8"></label><label>Cache size (bytes)<input type="number" id="dF_s" value="32"></label><label>Block size (bytes)<input type="number" id="dF_b" value="4"></label><label>Placement<select id="dF_w"><option value="1">direct-mapped</option><option value="2">2-way</option><option value="4">4-way</option><option value="FA">fully associative</option></select></label><label>Address (hex)<input type="text" id="dF_x" value="4E" style="width:90px"></label></div><div id="dF_out"></div>`;
  const upd=()=>{const ways=q('dF_w').value==='FA'?'FA':+q('dF_w').value,c={addrBits:+q('dF_a').value,size:+q('dF_s').value,block:+q('dF_b').value,ways},f=U.fields(c);
    if(f.err.length){q('dF_out').innerHTML='<span class="badc">'+f.err.join('; ')+'</span>';return}
    const a=U.num(q('dF_x').value,16),ok=!isNaN(a)&&a<Math.pow(2,c.addrBits);let bits='';
    if(ok){const s=U.split(c,a),full=tb(a,c.addrBits);const t=full.slice(0,f.tagBits),i=full.slice(f.tagBits,f.tagBits+f.idxBits),o=full.slice(f.tagBits+f.idxBits);
      bits=`<div class="bits"><span class="bt">${t||'∅'}</span><span class="bi">${i||'∅'}</span><span class="bo">${o||'∅'}</span></div><div class="mut">tag | ${f.idxBits?(f.ways===1?'line':'set'):'(no index)'} | offset</div><p>Address ${hx(a)}h → memory block <b>${hx(s.blk)}h</b>, ${f.sets>1?`goes to ${f.ways===1?'line':'set'} <b>${s.set}</b>, `:''}tag <b>${tb(s.tag,f.tagBits)||'–'}</b>, byte <b>${s.off}</b> of the block.</p>`}
    q('dF_out').innerHTML=`<div class="stats"><div>Lines <b>${f.lines}</b></div><div>Sets <b>${f.sets}</b></div><div>Memory blocks <b>${f.blocks}</b></div><div>Tag <b>${f.tagBits}</b> bits</div><div>Index <b>${f.idxBits}</b> bits</div><div>Offset <b>${f.offBits}</b> bits</div></div>${bits}`};
  el.querySelectorAll('input,select').forEach(i=>i.oninput=upd);upd()}
const T16=s=>U.parseTrace(s,16).trace;
const DEMO_DM=el=>stepper(el,{cfg:{addrBits:8,size:32,block:4,ways:1,write:'wb',alloc:true},trace:T16('R 4E\nR 4F\nR CF\nR 4E\nR 33')});
const DEMO_SA=el=>stepper(el,{cfg:{addrBits:8,size:32,block:4,ways:2,write:'wb',alloc:true},trace:T16('R 4C\nR CC\nR 4D\nR 8C\nR CC')});
function demoWrite(el){
  el.innerHTML=`<div class="btns" id="dW_b"><button data-w="wb" class="sel">Write-back + write allocate</button><button data-w="wt">Write-through + no write allocate</button></div><div id="dW_s"></div>`;
  const tr=T16('W 4D\nR 4E\nW 4D\nR 8E\nW 33\nR 33');
  const go=w=>{el.querySelectorAll('#dW_b button').forEach(b=>b.classList.toggle('sel',b.dataset.w===w));
    stepper(q('dW_s'),{cfg:{addrBits:8,size:32,block:4,ways:1,write:w,alloc:w==='wb'},trace:tr})};
  el.querySelectorAll('#dW_b button').forEach(b=>b.onclick=()=>go(b.dataset.w));go('wb')}
function demoOrg(el){
  const cs=[['L1 data (×4)',32768,64,8,'4 × 32 KiB'],['L1 code (×4)',32768,64,8,'4 × 32 KiB'],['L2 unified (×4)',262144,64,4,'4 × 256 KiB'],['L3 unified',6291456,64,12,'6 MiB']];
  el.innerHTML=`<p class="mut">Intel Core i5‑6500K (slide). The number of sets follows from size / (line × ways):</p><table class="mt"><tr><th>Cache</th><th>Size</th><th>Line</th><th>Ways</th><th>Sets</th></tr>${cs.map(c=>`<tr><td>${c[0]}</td><td>${c[4]}</td><td>${c[2]} B</td><td>${c[3]}</td><td>${c[1]/c[2]/c[3]}</td></tr>`).join('')}</table>`}
function demoMesi(el){mesiStepper(el,{cfg:{addrBits:8,size:64,block:16,ways:1,np:2},ops:[{p:0,rw:'R',addr:0x30},{p:1,rw:'R',addr:0x31},{p:0,rw:'W',addr:0x32},{p:1,rw:'R',addr:0x33}]})}
const PT_SLIDE={0x100:{pres:1,frame:4,rw:0,us:1},0x101:{pres:0,loc:'Y',rw:0,us:1},0x102:{pres:1,frame:5,rw:0,us:1},0x80000:{pres:1,frame:1,rw:0,us:1},0x80001:{pres:1,frame:2,rw:0,us:1},0x80002:{pres:0,loc:'X',rw:0,us:1}};
function demoVm(el){
  el.innerHTML=`<p class="mut">32-bit virtual addresses, 20-bit physical, 4 KiB pages (slide page table). Try 800015AB, 00101190, 00103 42C, 00100 000…</p><div class="frm"><label>Virtual address (hex)<input type="text" id="dV_x" value="800015AB" style="width:110px"></label></div><div id="dV_o"></div>`;
  const g={vBits:32,pBits:20,page:4096,entryBytes:1};
  const upd=()=>{const va=U.num(q('dV_x').value.replace(/\s/g,''),16);if(isNaN(va)||va>=Math.pow(2,32)){q('dV_o').innerHTML='<span class="badc">enter a 32-bit hexadecimal address</span>';return}
    q('dV_o').innerHTML=vmExplain(g,PT_SLIDE,va,{user:true,write:false})};
  q('dV_x').oninput=upd;upd()}
function vmExplain(g,table,va,mode){const G=U.vmGeom(g),t=U.translate(g,table,va,mode),aw=Math.ceil(g.vBits/4),pw=Math.ceil(g.pBits/4);
  const vb=tb(va,g.vBits);let h=`<div class="bits"><span class="bt">${vb.slice(0,G.vpnB)}</span><span class="bo">${vb.slice(G.vpnB)}</span></div><div class="mut">virtual page number (${G.vpnB} bits) | offset (${G.offB} bits)</div><p>Page <b>${hx(t.vpn)}h</b>, offset <b>${hx(t.off)}h</b>. `;
  switch(t.outcome){case'ok':h+=`Present → frame <b>${hx(t.frame)}h</b>. Physical address = frame ‖ offset = <b>${hx(t.pa,pw)}h</b>.`;break;
    case'disk':h+='Present bit = 0 but the entry holds a disk location → <b class="badc">recoverable page fault</b>: the OS chooses a frame (replacing a page if needed, writing it back if dirty), loads the page, updates the table and repeats the access.';break;
    case'invalid':h+='Present bit = 0 and no storage assigned → <b class="badc">non-recoverable page fault</b> (the OS stops the task).';break;
    case'protection':h+=`<b class="badc">protection violation</b> (${t.why}).`;break;default:h+='<b class="badc">address outside the virtual address space</b>.'}
  return h+'</p>'}
function demoTlb(el){
  el.innerHTML=`<p class="mut">TLB with <input type="number" id="dT_n" value="2" style="width:50px"> entries (fully associative, LRU). Sequence of virtual pages accessed (hex):</p><input type="text" id="dT_s" value="10 11 10 12 11 10" style="width:100%"><div id="dT_o"></div>`;
  const upd=()=>{const n=Math.max(1,+q('dT_n').value||1),seq=q('dT_s').value.split(/[\s,]+/).filter(Boolean).map(x=>U.num(x,16)).filter(x=>!isNaN(x));
    const r=U.tlbSim(n,seq,null);q('dT_o').innerHTML=`<table class="mt"><tr><th>Page</th>${seq.map(x=>`<th>${hx(x)}h</th>`).join('')}</tr><tr><td>TLB</td>${r.rows.map(x=>`<td class="${x.hit?'good':'badc'}">${x.hit?'hit':'miss'}${x.evicted!=null?'<br><small>evicts '+hx(x.evicted)+'h</small>':''}</td>`).join('')}</tr></table><p>Hits: <b>${r.hits}</b>/${seq.length}. Each miss costs a page-table access (an exception handled by the OS in MIPS, hardware in IA-32); each hit translates in a fraction of a cycle.</p>`};
  el.querySelectorAll('input').forEach(i=>i.oninput=upd);upd()}
/* ================= lessons ================= */
const L=(t,say,body,demo,qs)=>({t,say,body,demo,qs});
/* ---------- extra visuals ---------- */
function visPyramid(el){
  const lv=[['CPU registers','a few bytes','≈ 0.3 ns','✋ in your hand'],['Cache (SRAM)','KiB – MiB','≈ 0.5–5 ns','📘 the book open on your desk'],['Main memory (DRAM)','GiB','≈ 10–100 ns','📚 the bookshelf in your room'],['Disk / SSD','hundreds of GiB – TiB','≈ 10 ms (10 000 000 ns)','🏛️ the library across town']];
  el.innerHTML=`<div class="pyr">${lv.map((l,i)=>`<div class="lvl l${i}" style="width:${34+i*22}%"><b>${l[0]}</b><span>${l[1]} · ${l[2]}</span><em>${l[3]}</em></div>`).join('')}</div><div class="pyrleg"><span>⬆ faster, smaller, more expensive per bit</span><span>⬇ slower, bigger, cheaper per bit</span></div>`}
function visAmat(el){
  el.innerHTML=`<div class="frm"><label>Cache hit rate: <b id="vA_v">95%</b><input type="range" id="vA_r" min="50" max="100" step="0.5" value="95"></label><label>Miss penalty ×<input type="number" id="vA_k" value="80" style="width:70px"> (a miss costs this many hit-times)</label></div><div id="vA_o"></div>`;
  const upd=()=>{const a=+q('vA_r').value/100,k=+q('vA_k').value||1,hit=a*1,miss=(1-a)*(k+0),tot=hit+miss;
    q('vA_v').textContent=fx(a*100,4)+'%';
    q('vA_o').innerHTML=`<p>Imagine <b>100 accesses</b>. A hit costs <b>1</b> unit, a miss costs <b>${k}</b> units:</p>
    <div class="dots">${Array.from({length:100},(_,i)=>`<i class="${i<Math.round(a*100)?'h':'m'}"></i>`).join('')}</div>
    <div class="sbar"><span class="h" style="width:${hit/tot*100}%">hits: ${fx(hit*100,4)}</span><span class="m" style="width:${miss/tot*100}%">misses: ${fx(miss*100,4)}</span></div>
    <p>Average time per access = <b>${fx(tot,4)}</b> units. ${miss>hit?'<b class="badc">The few misses cost more than all the hits together!</b>':'Hits dominate the number of accesses, but misses still add '+fx(miss/tot*100,3)+'% of the time.'}</p>`};
  q('vA_r').oninput=upd;q('vA_k').oninput=upd;upd()}
function visBlockMap(el,c){ // memory blocks coloured by the line/set they map to
  const f=U.fields(c),nb=Math.min(f.blocks,64),pal=['#ff9d9d','#ffd29d','#fff59d','#b6f2a6','#9dd8ff','#c5b3ff','#ffb3e6','#d0d0d0'];
  const col=b=>pal[(b%f.sets)%pal.length];
  el.innerHTML=`<div class="mut" style="font-size:12px">Main memory = ${f.blocks} blocks of ${c.block} bytes${f.blocks>nb?' (first '+nb+' shown)':''}. <b>Same colour = same ${f.ways===1?'line':'set'}</b> → they compete for it.</div><div class="bmap">${Array.from({length:nb},(_,b)=>`<span style="background:${col(b)}" title="block ${hx(b)}h → ${f.ways===1?'line':'set'} ${b%f.sets}">${hx(b)}</span>`).join('')}</div><div class="mut" style="font-size:12px">Cache: ${Array.from({length:f.sets},(_,s)=>`<span class="cl" style="background:${pal[s%pal.length]}">${f.ways===1?'line':'set'} ${s}${f.ways>1?' ('+f.ways+' ways)':''}</span>`).join('')}</div>`}
function visVmMap(el,table,g,hl){
  const G=U.vmGeom(g),vw=Math.ceil(G.vpnB/4),fw=Math.ceil(G.frameBits/4),keys=Object.keys(table).map(Number).sort((a,b)=>a-b);
  const frames=keys.filter(k=>table[k].pres).map(k=>table[k].frame);
  el.innerHTML=`<div class="vmm"><div><h4>Virtual pages</h4>${keys.map(k=>`<div class="vp ${hl===k?'cur':''}">${hx(k,vw)}h</div>`).join('')}</div>
   <div><h4>Page table says…</h4>${keys.map(k=>{const e=table[k];return`<div class="vt ${hl===k?'cur':''}"><span>${e.pres?`→ frame <b>${hx(e.frame,fw)}h</b>${e.rw?' · 🔒 read-only':''}${e.us===0?' · 🛡️ kernel':''}`:e.loc?`💾 on disk (${esc(e.loc)})`:'✗ not valid'}</span></div>`}).join('')}</div>
   <div><h4>Physical frames</h4>${keys.map(k=>{const e=table[k];return`<div class="pf ${e.pres?'ok':'no'} ${hl===k?'cur':''}">${e.pres?hx(e.frame,fw)+'h':'—'}</div>`}).join('')}</div></div>`}
function demoVmFull(el,variant){
  const g={vBits:32,pBits:20,page:4096,entryBytes:1};
  const pt=Object.assign({},PT_SLIDE,{0x103:{pres:1,frame:6,rw:1,us:1},0x00F:{pres:1,frame:7,rw:0,us:0}});
  const sets={A:['800015AB','u','r'],B:['00101190','u','r'],C:['00103042','u','w'],D:['0000F010','u','r']};
  el.innerHTML=`<div class="btns" id="dVF_b">${[['A','Translate 80001 5AB'],['B','Page on disk 00101 190'],['C','Write to a read-only page'],['D','User touches kernel page']].map(([k,l])=>`<button data-k="${k}">${l}</button>`).join('')}</div><div id="dVF_m"></div><div id="dVF_o"></div>`;
  const go=k=>{const s=sets[k],va=U.num(s[0],16);el.querySelectorAll('#dVF_b button').forEach(b=>b.classList.toggle('sel',b.dataset.k===k));
    visVmMap(q('dVF_m'),pt,g,Math.floor(va/4096));q('dVF_o').innerHTML=vmExplain(g,pt,va,{user:s[1]==='u',write:s[2]==='w'})};
  el.querySelectorAll('#dVF_b button').forEach(b=>b.onclick=()=>go(b.dataset.k));go(variant||'A')}
function demoVpLimit(el){
  el.innerHTML=`<p class="mut">V/P cache (virtual index, physical tag): no synonym problems if <b>cache size ≤ page size × ways</b>.</p><div class="frm"><label>Cache size (KiB)<input type="number" id="dL_c" value="32"></label><label>Page size (KiB)<input type="number" id="dL_p" value="4"></label><label>Ways<input type="number" id="dL_w" value="8"></label></div><div id="dL_o"></div>`;
  const upd=()=>{const c=+q('dL_c').value,p=+q('dL_p').value,w=+q('dL_w').value,lim=p*w;q('dL_o').innerHTML=`<div class="stats"><div>Page × ways = <b>${lim} KiB</b></div><div>Cache = <b>${c} KiB</b></div></div><p>${c<=lim?'<b class="good">✓ OK:</b> index + offset bits fit inside the page offset, so the cache can be indexed with the virtual address while the TLB translates.':'<b class="badc">✗ Too big:</b> some index bits come from the page number, so the same physical block could live in two lines (synonym). Increase the ways or reduce the cache.'}</p>`};
  el.querySelectorAll('input').forEach(i=>i.oninput=upd);upd()}
const dc=(cfg,tr)=>{const f=el=>stepper(el,{cfg:cfg,trace:T16(tr)});f.lab={cfg,tr};return f};
const cfgB=(o)=>Object.assign({addrBits:8,size:32,block:4,ways:1,write:'wb',alloc:true},o||{});
const D=(l,cap,fn)=>({l,cap,fn});
/* ---------- lessons ---------- */
const LESSONS=[
{t:'0 · Read the screen',say:'Every picture in this unit is built from three things: an address split in colours, a row of memory blocks, and a table of cache lines.',
 ana:'Think of a tiny desk with 8 slots (the cache) and a huge warehouse of numbered boxes (memory). The table is a photo of the desk after every request.',
 w:[['Block','A group of consecutive bytes. Memory is moved to the cache one whole block at a time.'],['Line','One slot of the cache that holds one block (plus V, D, Tag).'],['V (valid)','1 = the slot holds real data, 0 = empty.'],['D (dirty)','1 = the block was changed in the cache and memory has not been updated yet.'],['Tag','Which block of memory is in this slot (the high bits of its address).'],['LRU','Order of use inside a set: 0 = used longest ago = next to be replaced.']],
 look:'Press “Next access”. Red chip = miss, green chip = hit. The yellow row of the table is the line that was just used.',
 demos:[D('The cache table','Each press shows one access. The coloured bar is the address: <b style="color:#b36b00">tag</b> | <b style="color:#0b6fa8">index</b> | <b style="color:#2b8a3e">offset</b>.',dc(cfgB(),'R 4E\nR 4F\nR 50'))],
 body:`<p>Reading order for every access: (1) split the address into tag | index | offset; (2) the <b>index</b> tells you <i>which line or set</i> to look at; (3) compare the <b>tag</b> with the tag stored there (and check V = 1); (4) same tag → <b>hit</b>, otherwise <b>miss</b> and the whole block is copied in.</p><p>The <b>offset</b> is never used to find the line — it only picks the byte inside the block afterwards.</p>`,
 mistake:'Using the offset to decide hit or miss. Only index and tag matter for that.',
 qs:[{q:'Which part of the address selects the cache line (or set)?',ch:['Index','Offset','Tag','Valid bit'],a:0,why:'The index chooses where to look; the tag then says whether it is the right block.'},
  {q:'A line has V = 0. What does a lookup of that line give?',ch:['Always a miss','A hit if the tag matches','A hit','An error'],a:0,why:'An invalid line holds nothing, so it can never produce a hit.'},
  {q:'What does D = 1 mean?',ch:['The block was modified in the cache; memory is outdated','The block is invalid','The block came from disk','The line is locked'],a:0,why:'Dirty = changed in the cache only.'}]},
{t:'1 · Why a hierarchy?',say:'No memory is big, fast and cheap at once. So we stack several, and rely on locality to make it feel like one big fast memory.',
 ana:'You work at a desk. The book you read is open on the desk (cache). The books you use this week are on the bookshelf (main memory). Everything else is in the library across town (disk).',
 w:[['Latency','Time to get a piece of data.'],['Locality','Programs reuse what they used recently (temporal) and what is near it (spatial).'],['Block','What moves between levels: ≈64 bytes cache↔memory, ≈4 KiB memory↔disk.'],['SRAM / DRAM','Fast & expensive memory for caches / slower & cheaper memory for main memory.']],
 look:'Going down the pyramid, size grows and speed drops. The tricks work because most accesses are served at the top.',
 demos:[D('The pyramid','Each level holds a copy of the most useful part of the level below.',visPyramid)],
 body:`<table class="mt"><tr><th></th><th>SRAM</th><th>DRAM</th><th>Hard disk</th></tr><tr><td>Latency</td><td>≈ 0.5 ns (CPU speed)</td><td>≈ 10 ns</td><td>≈ 10<sup>7</sup> ns (10 ms)</td></tr><tr><td>Cost per bit</td><td>high (6 transistors)</td><td>medium (1 transistor + capacitor)</td><td>low</td></tr></table>
 <ul><li><b>Temporal locality</b>: loops and loop counters — you come back to the same data.</li><li><b>Spatial locality</b>: sequential code and arrays — you go to the neighbours.</li></ul><p>The memory-CPU speed gap keeps growing (the “memory wall”), so a pipeline with CPI = 1 only works if the cache answers almost every access.</p>`,
 mistake:'Thinking the cache is “a faster copy of everything”. It is tiny; it only helps because of locality.',
 qs:[{q:'Walking through an array element by element is an example of…',ch:['Spatial locality','Temporal locality','No locality','Bad cache design'],a:0,why:'Consecutive elements are at neighbouring addresses.'},
  {q:'A loop counter read and written every iteration shows…',ch:['Temporal locality','Spatial locality','Code locality only','No locality'],a:0,why:'The same location is reused again and again.'},
  {q:'Which technology is used for the cache?',ch:['SRAM','DRAM','Hard disk','Flash'],a:0,why:'SRAM is as fast as the CPU but expensive per bit.'},
  {q:'Why does the hierarchy behave like “big, fast and cheap” memory?',ch:['Most accesses are served by the small fast levels thanks to locality','Disks became as fast as RAM','DRAM equals SRAM','The CPU never waits'],a:0,why:'The fast levels hold the data most likely to be needed.'}]},
{t:'2 · Average read time',say:'Average time = (hits × hit time) + (misses × miss time). A tiny miss rate still matters, because one miss costs hundreds of hits.',
 ana:'Most of the time the book you need is on the desk (1 second). Sometimes you must walk to the shelf (80 seconds). Even 5 walks per 100 requests double your average time!',
 w:[['Hit rate A<sub>c</sub>','Fraction of accesses found in the cache.'],['Miss penalty','Extra time when the data is not there: copy the whole block from the next level.'],['t<sub>c</sub>, t<sub>p</sub>, t<sub>d</sub>','Access time per word of cache and main memory; time for a disk block.'],['B','Words in a cache block: a miss copies B words, one after another.']],
 look:'Drag the hit-rate slider. Watch how fast the red part (misses) grows when the hit rate drops from 100% to 95%.',
 demos:[D('Hits vs misses','100 accesses: green = hit, red = miss. The bar splits the <i>time</i>, not the count.',visAmat),D('Calculator (3 levels)','Change any value; the table shows the effect of the cache hit rate.',demoAmat)],
 body:`<p style="text-align:center;font-size:15px">t<sub>cpd</sub> = A<sub>c</sub>·t<sub>c</sub> + (1−A<sub>c</sub>)·[ A<sub>p</sub>·B·t<sub>p</sub> + (1−A<sub>p</sub>)·t<sub>d</sub> ]</p><ul><li>Cache hit: only t<sub>c</sub>.</li><li>Cache miss: copy the block from main memory (B·t<sub>p</sub>) — or, if main memory also misses, read the block from disk (t<sub>d</sub>).</li><li>If main memory never misses (A<sub>p</sub> = 1): t = A<sub>c</sub>·t<sub>c</sub> + (1−A<sub>c</sub>)·B·t<sub>p</sub>.</li><li><b>Cost</b> = Σ size (MiB) × price (€/MiB).</li><li>The time to pass the word from the cache to the CPU on a miss is negligible.</li></ul>`,
 mistake:'Forgetting that a miss copies the <i>whole block</i> (B words), not a single word.',
 qs:[{q:'t<sub>c</sub> = 1 ns, t<sub>p</sub> = 10 ns, A<sub>c</sub> = 95%, B = 8 words, main memory always hits. Average read time?',ch:['4.95 ns','1.5 ns','0.95 ns','5.95 ns'],a:0,why:'0.95·1 + 0.05·8·10 = 4.95 ns.'},
  {q:'Why does a tiny miss rate still matter?',ch:['The miss penalty is hundreds of times the hit time','Misses are very frequent','Hits are slow','Disk is as fast as cache'],a:0,why:'One miss costs as much as hundreds of hits.'},
  {q:'Cache 8 MiB at 15 €/MiB + main memory 8 GiB at 0.01 €/MiB cost…',ch:['201.92 €','120 €','81.92 €','15.01 €'],a:0,why:'8·15 = 120; 8192·0.01 = 81.92.'},
  {q:'If the cache hit rate goes up, the average time…',ch:['goes down','goes up','stays equal','becomes the disk time'],a:0,why:'Fewer accesses pay the big miss penalty.'}]},
{t:'3 · Blocks and address fields',say:'An address is split into tag | index | offset. The offset picks the byte inside a block; the index picks the line; the tag says which block is there.',
 ana:'Library: the offset is the page number inside the book, the index is the slot on the desk where that book may sit, and the tag is the book title that tells which book is currently in that slot.',
 w:[['Offset','low bits = byte inside the block (log₂ block size).'],['Index','bits that choose the line (direct-mapped) or the set (set associative).'],['Tag','the remaining high bits; stored in the line to identify the block.'],['Block number','address ÷ block size = tag ‖ index.']],
 look:'In the colour map, blocks with the same colour fight for the same line. Change the placement to “2-way” and see the colours halve.',
 demos:[D('Split any address','Type an address and change the cache description.',demoFields),D('Who competes with whom?','Memory blocks are coloured by the line they map to.',el=>{el.innerHTML=`<div class="frm"><label>Placement<select id="vB_w"><option value="1">direct-mapped</option><option value="2">2-way</option><option value="4">4-way</option></select></label></div><div id="vB_o"></div>`;const go=()=>visBlockMap(q('vB_o'),{addrBits:8,size:32,block:4,ways:+q('vB_w').value});q('vB_w').onchange=go;go()})],
 body:`<ul><li>Lines = cache size / block size; sets = lines / ways.</li><li><b>Direct-mapped</b>: index = log₂(lines) bits. <b>Fully associative</b>: no index, tag = block number. <b>k-way</b>: index = log₂(sets) bits.</li><li>Tag = address bits − index − offset. Memory blocks = 2<sup>address bits</sup> / block size.</li><li>Every line stores <b>V</b>, <b>tag</b> (and <b>D</b> in write-back caches).</li></ul>`,
 mistake:'Counting tag bits from the cache size instead of subtracting index and offset from the address width.',
 qs:[{q:'32-bit addresses, 32 KiB direct-mapped, 64-byte lines: offset, index, tag bits?',ch:['6, 9, 17','6, 15, 11','5, 10, 17','9, 6, 17'],a:0,why:'Offset 6; 32768/64 = 512 lines → index 9; tag 32−9−6 = 17.'},
  {q:'Fully associative cache: which field disappears?',ch:['Index','Tag','Offset','Valid bit'],a:0,why:'A block can go anywhere: nothing to index.'},
  {q:'A 4-way cache has 256 lines. How many sets?',ch:['64','256','1024','4'],a:0,why:'256 / 4 = 64.'},
  {q:'8-bit addresses, 4-byte blocks. How many memory blocks?',ch:['64','256','4','8'],a:0,why:'256 / 4 = 64.'}]},
{t:'4 · Direct-mapped cache',say:'Each memory block can live in exactly one line: line = block mod number of lines.',
 ana:'Every book has a reserved slot on the desk, decided by its number. If two books share the same slot, the new one throws the old one out — even if other slots are empty.',
 w:[['Direct-mapped','one possible line per block: 1 comparator, very fast.'],['Conflict miss','a miss because another block with the same index took the line.'],['Compulsory miss','the first access to a block (cache starts empty).']],
 look:'In A the third access (CFh) uses the same line as 4Eh. In B the blocks use different lines and nothing is thrown out.',
 demos:[D('A · Blocks share a line','4Eh and CFh both map to line 3 → thrash.',dc(cfgB(),'R 4E\nR 4F\nR CF\nR 4E\nR CF')),D('B · Different lines','4Eh and 52h map to different lines → they stay.',dc(cfgB(),'R 4E\nR 4F\nR 52\nR 4E\nR 52'))],
 body:`<p>The slide example: 8-bit addresses, 32-byte cache, 4-byte lines → 8 lines, fields <b>tag(3) | line(3) | offset(2)</b>.</p><ul><li><b>4Eh</b> = 010 011 10 → line 3, tag 010: empty → miss, block 4Ch–4Fh copied.</li><li><b>4Fh</b>: same block → hit (spatial locality).</li><li><b>CFh</b> = 110 011 11 → same line 3, other tag → miss, replaces the old block.</li><li><b>4Eh</b> again → miss: it was evicted by CFh.</li></ul>`,
 mistake:'Thinking the cache is “full” when a conflict happens. Only that one line is busy; others may be empty.',
 qs:[{q:'Which line does address 4Eh (0100 1110) use in this cache?',ch:['Line 3','Line 7','Line 0','Line 2'],a:0,why:'Offset 10, line 011 = 3, tag 010.'},
  {q:'Why did the second read of 4Eh miss after CFh?',ch:['Both map to line 3 and CFh replaced it','The cache was full','The valid bit was 0','Addresses cannot be read twice'],a:0,why:'Same index, newer block evicts the older.'},
  {q:'How many comparators does a direct-mapped lookup need?',ch:['1','One per line','One per way (4)','None'],a:0,why:'Only the selected line is compared.'}]},
{t:'5 · Associative caches & LRU',say:'More freedom for a block means fewer conflicts but more comparators. When a set is full, the least recently used line leaves.',
 ana:'Each slot of the desk becomes a small tray that holds 2 books. A book can use either place of its tray; when the tray is full, you put away the book you have not touched for the longest time.',
 w:[['Set','a group of lines; the index chooses the set.'],['k-way','k lines per set; the block can go in any of them.'],['LRU','Least Recently Used: the line unused for the longest time is replaced.'],['Fully associative','one set containing every line.']],
 look:'In A (direct-mapped) the two blocks keep throwing each other out. In B (2-way) they live together. In C watch the LRU column decide who leaves.',
 demos:[D('A · Direct-mapped: thrash','4Ch and CCh map to the same line → every access misses.',dc(cfgB({ways:1}),'R 4C\nR CC\nR 4C\nR CC\nR 4C')),D('B · 2-way: both fit','Same trace, same size cache, 2 ways → hits.',dc(cfgB({ways:2}),'R 4C\nR CC\nR 4C\nR CC\nR 4C')),D('C · LRU replacement','4Ch, CCh and 8Ch share a set: after the hit on 4Dh, CCh is the LRU.',dc(cfgB({ways:2}),'R 4C\nR CC\nR 4D\nR 8C\nR CC'))],
 body:`<p>2-way, 32 bytes, 4-byte lines → 8 lines, <b>4 sets</b>, fields tag(4) | set(2) | offset(2). Invalid lines are filled first; with a full set the LRU line is replaced (or a random one).</p><p>Cost of associativity: one comparator per way and a slightly slower lookup. Real caches are usually set associative (e.g. 8-way L1).</p>`,
 mistake:'Mixing up “more ways” with “more capacity”. Capacity is the same; only the freedom of placement grows.',
 qs:[{q:'Why does the 3rd access to set 3 (8Ch) replace CCh and not 4Ch?',ch:['4Dh hit made 4Ch more recently used, so CCh was the LRU','Random choice','Lowest tag is always kept','Highest tag is always kept'],a:0,why:'LRU evicts the line unused for the longest time.'},
  {q:'Going from direct-mapped to 2-way with the same size, the number of sets…',ch:['halves','doubles','stays equal','becomes 1'],a:0,why:'Sets = lines / ways.'},
  {q:'Main cost of higher associativity?',ch:['More comparators / hardware','A lower hit rate','Smaller blocks','Fewer valid bits'],a:0,why:'Every way is compared in parallel.'},
  {q:'A cache with as many ways as lines is…',ch:['fully associative','direct-mapped','2-way','impossible'],a:0,why:'One set with all the lines.'}]},
{t:'6 · Writing policies',say:'On a write: write-through updates memory every time; write-back only when the line is replaced, using the dirty bit.',
 ana:'You edit a document on your desk (cache). Write-through: you also run to the library to update the original after every edit. Write-back: you keep editing the copy and take it back only when you need the desk space.',
 w:[['Write-through','write in the cache and in memory at once.'],['Write-back','write only in the cache, mark the line dirty, update memory on replacement.'],['Write allocate','on a write miss, load the block first, then write.'],['No write allocate','on a write miss, write memory directly, do not cache.']],
 look:'In A watch the D column: block 13h stays dirty until 8Eh replaces it. In B nothing is ever dirty and every write shows “written also to main memory”.',
 demos:[D('A · Write-back + write allocate','Dirty bit set on write; memory updated only on replacement.',dc(cfgB({write:'wb',alloc:true}),'W 4D\nR 4E\nW 4D\nR 8E\nW 33\nR 33')),D('B · Write-through + no write allocate','Memory is written on every write; a write miss does not load the block.',dc(cfgB({write:'wt',alloc:false}),'W 4D\nR 4E\nW 4D\nR 8E\nW 33\nR 33'))],
 body:`<ul><li><b>Write-through</b>: always coherent and simple; but a write costs the main-memory time t<sub>p</sub>.</li><li><b>Write-back</b>: faster, needs the dirty bit, creates coherence problems with DMA and other cores.</li></ul><p>Usual pairs: write-back + write allocate; write-through + no write allocate. A clean line is simply dropped on replacement; a dirty one is first written to memory.</p>`,
 mistake:'Thinking dirty blocks are written to memory immediately in write-back. They wait for replacement (dirty blocks still cached at the end were never updated).',
 qs:[{q:'In write-back, when is a block written to main memory?',ch:['When it is replaced and dirty','On every write','On every read','Never'],a:0,why:'The dirty bit says memory is outdated.'},
  {q:'Write-through write hit takes (simple model)…',ch:['The main-memory time','The cache time only','Twice the disk time','Zero'],a:0,why:'The write is replicated in memory: t<sub>p</sub>.'},
  {q:'“Write allocate” means…',ch:['On a write miss the block is loaded first','Writes are never cached','Each write gets a new disk block','The dirty bit is always 0'],a:0,why:'Then the write is done in the cache.'},
  {q:'A clean line is replaced. Is something written to memory?',ch:['No','Yes, always','Only the tag','Only in write-through'],a:0,why:'Clean = memory already has the data.'}]},
{t:'7 · Levels and split caches',say:'Several cache levels bridge the speed gap, and L1 is usually split into code and data so IF and MEM can work at the same time.',
 ana:'One desk for books and notes mixed (unified) is flexible; two desks — one for books, one for notes — let two people work simultaneously (split), but each desk is smaller.',
 w:[['L1/L2/L3','faster & smaller near the CPU, bigger & slower further away.'],['Unified','one cache for code and data.'],['Split (separated)','one cache for code and one for data.']],
 look:'In A, code (40h…) and data (C0h…) share the same lines and evict each other. In B each has its own cache.',
 demos:[D('A · Unified','Code and data collide on line 0.',dc(cfgB({size:32}),'R 40 C\nR C0 D\nR 41 C\nR C1 D\nR 40 C')),D('B · Split','Same trace, half of the lines for code and half for data.',dc(cfgB({size:32,split:true}),'R 40 C\nR C0 D\nR 41 C\nR C1 D\nR 40 C')),D('Real example','Intel Core i5-6500K.',demoOrg)],
 body:`<ul><li><b>Unified</b>: simple, uses capacity better, higher hit rate.</li><li><b>Split</b>: replicated hardware, fixed split, usually lower hit rate, but <b>concurrent access</b> to code and data → L1 is usually split, L2/L3 unified.</li></ul><p>Splitting keeps the line size; each half has half of the lines.</p>`,
 mistake:'Assuming split caches always have a better hit rate. Their advantage is concurrency, not hit rate.',
 qs:[{q:'Why is L1 usually split?',ch:['IF and MEM can access it in the same cycle','Higher hit rate','Cheaper','No tags needed'],a:0,why:'Concurrent instruction fetch and data access.'},
  {q:'A unified cache usually has…',ch:['a higher hit rate than its split equivalent','a lower hit rate','no replacement','more comparators'],a:0,why:'It adapts capacity to code or data.'},
  {q:'A 32 KiB, 8-way cache with 64-byte lines has how many sets?',ch:['64','512','8','4096'],a:0,why:'512 lines / 8 = 64.'}]},
{t:'8 · Coherence & MESI',say:'The same data can live in several caches. MESI keeps every copy consistent by giving each line a state.',
 ana:'Two students share a notebook page. If one writes on her photocopy, the other copy is out of date: she must tell the other to throw it away (invalidate).',
 w:[['M · Modified','only this cache has it, memory is outdated.'],['E · Exclusive','only this cache has it, memory is up to date.'],['S · Shared','several caches may have it, memory is up to date.'],['I · Invalid','not usable.'],['Snooping','caches watch the bus and react to others’ accesses.']],
 look:'Follow one block: its state changes in P1 and P2 after every access. The grey/blue/green/red boxes are I/E/S/M.',
 demos:[D('A · Read, read, write, read','The slide example.',demoMesi),D('B · Ping-pong writes','Two writers keep invalidating each other.',el=>mesiStepper(el,{cfg:{addrBits:8,size:64,block:16,ways:1,np:2},ops:[{p:0,rw:'W',addr:0x30},{p:1,rw:'W',addr:0x31},{p:0,rw:'W',addr:0x32},{p:1,rw:'R',addr:0x33}]}))],
 body:`<p><b>Single CPU + DMA</b>: a peripheral may read a dirty block (stale memory) or write a cached block (stale cache). Solutions: non-cacheable areas, or snooping: write back a dirty block before the peripheral reads/writes it and invalidate the line when it writes.</p><ul><li>Read miss, no other copy → <b>E</b>; other copy → both <b>S</b> (an M owner writes back first).</li><li>Write → this copy <b>M</b>, the others <b>I</b> (a remote M is written back first). Write hit on E → M silently; on S → invalidate others.</li></ul>`,
 mistake:'Believing a write in a Shared line updates the other copies. MESI is write-<i>invalidate</i>: others are thrown away.',
 qs:[{q:'P1 reads a block nobody else has. Its state is…',ch:['E','S','M','I'],a:0,why:'Only copy, equal to memory.'},
  {q:'P1 holds a block in S and writes it. What happens?',ch:['Others are invalidated and P1 goes to M','Memory is updated and P1 stays S','P1 goes to E','Nothing'],a:0,why:'Write-invalidate.'},
  {q:'P2 reads a block that P1 holds in M…',ch:['P1 writes it back; both end in S','P2 reads outdated memory','P1 goes to I and P2 to E','P2 waits forever'],a:0,why:'The owner updates memory and both become Shared.'},
  {q:'A DMA peripheral reads memory with a write-back cache. The problem appears with…',ch:['dirty blocks','clean blocks','valid blocks only','interrupts'],a:0,why:'Memory is outdated for dirty blocks.'}]},
{t:'9 · Virtual memory & paging',say:'Programs use virtual addresses. The MMU translates them page by page with a page table, which also gives protection and sharing.',
 ana:'A hotel: guests ask for “room 5” (virtual). The receptionist (MMU) looks in the register (page table) and sends them to the real room (frame). The floor position (offset) in the room stays the same. Some rooms are in the annex across town (disk).',
 w:[['Page / frame','a block of virtual addresses / the same-size block of physical memory.'],['Page table','one per task: virtual page → frame or disk location.'],['Present bit','1 = page is in memory.'],['Page fault','access to a page that is not present.'],['R/W, U/S','protection bits: read-only, user/kernel.']],
 look:'Pick A–D. The middle column is the page-table entry for the accessed page. Notice the offset never changes.',
 demos:[D('Page table in action','Four classic cases: translated, page on disk, read-only violation, kernel page.',demoVmFull)],
 body:`<ul><li>Virtual address = <b>page number | offset</b>; physical = <b>frame | offset</b>.</li><li>Entries = 2<sup>(virtual bits − offset bits)</sup>; frames = 2<sup>(physical bits − offset bits)</sup>; table size = entries × bytes per entry.</li><li><b>Recoverable fault</b>: present = 0 but the entry has a disk location → the OS picks a frame (writes the old page back if dirty), loads the page, updates the table and repeats the instruction. <b>Non-recoverable</b>: no storage assigned.</li><li><b>Sharing</b>: two page tables pointing at the same frame. <b>Protection</b>: separate tables + R/W and U/S bits.</li></ul>`,
 mistake:'Translating the offset too. Pages and frames have the same size, so the offset is copied unchanged.',
 qs:[{q:'32-bit virtual addresses, 4 KiB pages: entries in the page table?',ch:['2<sup>20</sup>','2<sup>12</sup>','2<sup>32</sup>','2<sup>10</sup>'],a:0,why:'Offset 12 → page number 20 bits.'},
  {q:'What happens to the offset in the physical address?',ch:['Copied unchanged','Translated','Discarded','Added to the frame'],a:0,why:'Pages and frames have equal size.'},
  {q:'Present = 0 with a disk location. The access gives…',ch:['A recoverable page fault','A protection fault','A TLB hit','A cache hit'],a:0,why:'The OS can load it and repeat.'},
  {q:'Two tasks share memory when…',ch:['entries of both tables point to the same frame','their virtual addresses are equal','they share the page-table register','the cache is shared'],a:0,why:'Same physical frame in both address spaces.'}]},
{t:'10 · TLB & virtual caches',say:'The TLB is a tiny cache of page-table entries, so translation does not cost an extra memory access.',
 ana:'The receptionist remembers the last few guests’ rooms on a sticky note (TLB) so she does not search the big register every time.',
 w:[['TLB','small fully associative cache of page-table entries inside the CPU.'],['TLB miss','the entry is fetched from the page table (OS in MIPS, hardware in IA-32).'],['P/P, V/V, V/P','physical/virtual index and tag of a cache.'],['Synonym','two virtual addresses for the same physical block.']],
 look:'In the TLB table, the first time a page is used is always a miss. With only 2 entries, a loop over 3 pages misses all the time.',
 demos:[D('TLB simulator','Try 2 entries and the sequence 10 11 10 12 11 10.',demoTlb),D('V/P cache limit','Is the cache small enough to be indexed in parallel with the TLB?',demoVpLimit)],
 body:`<p>Without a TLB every access needs two memory accesses (page-table entry + data). On a task switch the TLB entries must be invalidated unless they carry a task id (OS entries are marked <b>global</b>).</p><p><b>P/P</b>: translate first, then access the cache (extra pipeline stage). <b>V/V</b>: no wait but synonyms and protection issues. <b>V/P</b>: index with virtual bits while the TLB translates, tag with physical bits; no synonyms if <b>cache size ≤ page size × ways</b>.</p>`,
 mistake:'Thinking the TLB caches data. It only caches translations.',
 qs:[{q:'What does the TLB cache?',ch:['Page-table entries','Disk blocks','Instructions only','Cache tags'],a:0,why:'Recent virtual page → frame translations.'},
  {q:'V/P cache, 4 KiB pages, 8 ways. Largest cache without synonyms?',ch:['32 KiB','4 KiB','64 KiB','8 KiB'],a:0,why:'4 KiB × 8 = 32 KiB.'},
  {q:'Why flush the TLB (or use task ids) on a context switch?',ch:['Tasks map the same virtual page to different frames','The cache is virtual','The disk changes','Pages get smaller'],a:0,why:'Old entries would give wrong translations.'}]}
];
/* ---- lesson UI (4 steps like Unit 2: Idea · Watch · Why · Check) ---- */
let lsI=0,lsS=0,lsW=0,lsDone={};try{lsDone=JSON.parse(localStorage.getItem('mp64u3learn')||'{}')}catch(e){}
const lsQ={};
const saveDone=()=>{try{localStorage.setItem('mp64u3learn',JSON.stringify(lsDone))}catch(e){}};
function shuf(a,seed){const r=U.rng(seed),b=a.map((x,i)=>i);for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}

const LV=[
{ic:'🔍',map:[['🪑','Cache','desk with 8 slots'],['🏭','Memory','huge warehouse'],['📷','Table','photo of the desk']],rule:'<b style="color:#0b6fa8">Index</b> finds the slot · <b style="color:#b36b00">Tag</b> proves it is the right box',
 flow:[['✂️','Split the address','tag | index | offset'],['👉','Index','pick the line (or set)'],['⚖️','Compare','tag equal and V = 1?'],['🟢🔴','Hit or miss','same → HIT; else MISS and load the block']]},
{ic:'🔺',map:[['📖','Cache','book open on the desk'],['📚','Main memory','bookshelf'],['🏛️','Disk','library across town']],rule:'Smaller = faster = more expensive',
 flow:[['🔁','Time','you reuse the same data (temporal)'],['📍','Space','you use its neighbours (spatial)'],['📦','Blocks','whole blocks move up'],['🚀','Result','almost every access hits at the top']]},
{ic:'⏱️',map:[['✅','Hit','answer is on the desk: 1 s'],['🚶','Miss','walk to the shelf: 80 s']],rule:'t = A<sub>c</sub>·t<sub>c</sub> + (1−A<sub>c</sub>)·[A<sub>p</sub>·B·t<sub>p</sub> + (1−A<sub>p</sub>)·t<sub>d</sub>]',
 flow:[['✅','Hit (A<sub>c</sub>)','pay only t<sub>c</sub>'],['❌','Miss (1−A<sub>c</sub>)','copy the block: B·t<sub>p</sub>'],['💽','Memory miss too','read the block from disk: t<sub>d</sub>'],['💶','Cost','Σ size × price']]},
{ic:'✂️',map:[['📄','Offset','page inside the book'],['🗂️','Index','slot on the desk'],['🏷️','Tag','title of the book there']],rule:'tag = address bits − index − offset',
 flow:[['📏','Lines','cache size ÷ block size'],['🧮','Sets','lines ÷ ways'],['🔢','Offset bits','log₂ block size'],['🔢','Index bits','log₂ sets'],['🏷️','Tag','what is left']]},
{ic:'📌',map:[['📖','Block','a numbered book'],['🪑','Line','its one reserved slot']],rule:'line = block mod number of lines',
 flow:[['🔢','Block number','address ÷ block size'],['➗','Mod','block mod lines = line'],['⚖️','Tag','different tag → miss'],['💥','Conflict','new block evicts old one, even if other lines are empty']]},
{ic:'🧺',map:[['🧺','Set','tray that holds k books'],['🕰️','LRU','remove the least recently used']],rule:'Same capacity · more freedom · more comparators',
 flow:[['🔢','Set','block mod sets'],['👀','Look in all ways','compare every tag in the set'],['🆓','Miss','fill an invalid line first'],['♻️','Full set','replace LRU (oldest use)']]},
{ic:'✏️',map:[['🏃','Write-through','update the original after every edit'],['🧠','Write-back','edit the copy, return it later']],rule:'Write-back + dirty bit: memory is updated only when the line is replaced',
 flow:[['🟢','Write hit','WT: cache + memory · WB: cache, D = 1'],['🔴','Write miss','allocate: load block then write · no allocate: write memory only'],['♻️','Replace','dirty line → written to memory first'],['🧹','Clean line','simply dropped']]},
{ic:'🧱',map:[['🗃️','Unified','one desk for all'],['📚📝','Split','a desk for code + a desk for data']],rule:'Split L1 = IF and MEM can work in the same cycle',
 flow:[['⚡','L1','small, fast, usually split'],['🧠','L2','bigger, unified'],['🏭','L3 / memory','biggest, slowest'],['🔌','I/O + DMA','also reads and writes memory → coherence']]},
{ic:'🤝',map:[['📄','Copy','each cache holds its own copy'],['🗑️','Invalidate','tell the others to throw theirs away']],rule:'Write-invalidate: a write leaves the others in <b>I</b>',
 flow:[['🟦','E','only copy, clean'],['🟩','S','several clean copies'],['🟧','M','only copy, modified'],['⬜','I','invalid; remote write killed it']]},
{ic:'🏨',map:[['🛎️','Room 5','virtual page'],['🔑','Real room','physical frame'],['🚪','Floor position','offset: unchanged']],rule:'virtual page | offset  →  frame | offset',
 flow:[['✂️','Split','page number | offset'],['📖','Page table','entry for that page'],['🔎','Present?','1 → frame; 0 → page fault'],['🔧','Join','frame | same offset']]},
{ic:'📝',map:[['📒','Page table','the big register'],['📝','TLB','sticky note of recent rooms']],rule:'cache size ≤ page size × ways  ⇒  V/P cache without synonyms',
 flow:[['📝','TLB hit','translation in ~1 cycle'],['📒','TLB miss','read the page table, store the entry'],['🔀','Task switch','flush TLB (or use task id)'],['⚖️','P/P · V/V · V/P','when to translate vs when to index']]}
];
LV.forEach((v,i)=>Object.assign(LESSONS[i],v));
const lsDr={};const LTYPE=['fields','amat','amat','fields','trace','trace','trace','trace','mesi','vm','vm'];
let drEx=null;
function drillShow(){const d=lsDr[lsI];drEx=G.gen(LTYPE[lsI],d.seed+d.n*977,1);
  q('m3drill').innerHTML=(drEx.intro+'<div class="parts">'+drEx.parts.map(partHTML).join('')+'</div>').replace(/m3p_/g,'m3d_');
  q('m3dres').textContent='';q('m3dsol').hidden=true}
function drillRead(){const a={};q('m3drill').querySelectorAll('[data-p]').forEach(el=>{const id=el.dataset.p;
  if(el.dataset.k!==undefined){(a[id]=a[id]||[])[+el.dataset.k]=el.value}else if(el.dataset.f){(a[id]=a[id]||{})[el.dataset.f]=el.value}else a[id]=el.value});return a}
function drillChk(){const c=G.check(drEx,drillRead());
  q('m3drill').querySelectorAll('.pp').forEach(pp=>pp.classList.remove('okp','nop'));
  drEx.parts.forEach(p=>{const el=q('m3drill').querySelector(`[data-p="${p.id}"]`);const pp=el&&el.closest('.pp');if(pp)pp.classList.add(c.res[p.id]?'okp':'nop')});
  const w=drEx.parts.filter(p=>!c.res[p.id]).length;
  q('m3dres').innerHTML=c.all?'<span class="good">✓ All correct! Press “New exercise” for another one.</span>':`<span class="badc">✗ ${w} of ${drEx.parts.length} wrong (red).</span> Re-read the Why step, or press “Show solution”.`}
function drillSol(){const s=q('m3dsol');s.hidden=false;s.innerHTML='<h4>Solution</h4>'+drEx.sol}
function renderLesson(){
  const Ls=LESSONS[lsI],done=Object.keys(lsDone).filter(k=>lsDone[k]).length;
  q('m3lsTabs').innerHTML=LESSONS.map((l,k)=>`<button class="${k===lsI?'sel':''}" data-k="${k}">${lsDone[l.t]?'✓ ':''}${l.t}</button>`).join('');
  const steps=['1 · Idea','2 · Watch','3 · Why','4 · Try it','5 · Check'];
  let h=`<div class="mut" style="font-size:12px">${done} of ${LESSONS.length} lessons completed</div><div class="prog"><i style="width:${Math.round(done/LESSONS.length*100)}%"></i></div><div class="stp">${steps.map((s,k)=>`<button data-st="${k}" class="${k===lsS?'sel':''}">${s}</button>`).join('')}</div>`;
  const qs=Ls.qs,st=lsQ[lsI]||(lsQ[lsI]={});
  if(lsS===0)h+=`<div class="hero"><div class="hic">${Ls.ic}</div><div class="say">${Ls.say}</div></div><div class="mapr">${Ls.map.map(m=>`<div class="mc"><div class="mi">${m[0]}</div><b>${m[1]}</b><span>${m[2]}</span></div>`).join('<div class="eq">=</div>').replace(/<div class="eq">=<\/div>/g,'<div class="eq">·</div>')}</div><div class="rule">${Ls.rule}</div><div class="wchips">${Ls.w.map(w=>`<div class="wc"><b>${w[0]}</b><span>${w[1]}</span></div>`).join('')}</div><div class="look">👀 ${Ls.look}</div>`;
  else if(lsS===1){const dm=Ls.demos[Math.min(lsW,Ls.demos.length-1)];
    h+=`<div class="look">👀 ${Ls.look}</div>${Ls.demos.length>1?`<div class="btns dsel">${Ls.demos.map((d,i)=>`<button data-w="${i}" class="${i===lsW?'sel':''}">${d.l}</button>`).join('')}</div>`:''}<div class="demo"><div class="mut" style="margin-bottom:6px">${dm.cap}</div><div id="m3demoIn"></div></div>${dm.fn&&dm.fn.lab?'<div class="btns"><button data-a="lab">Open this in the Cache lab</button></div>':''}`}
  else if(lsS===2)h+=`<div class="rule">${Ls.rule}</div><div class="flow">${Ls.flow.map((f,k)=>`<div class="fc"><div class="fn">${k+1}</div><div class="fi">${f[0]}</div><b>${f[1]}</b><span>${f[2]}</span></div>`).join('<div class="fa">➜</div>')}</div><div class="mis"><div class="hic">⚠️</div><div>${Ls.mistake}</div></div><details class="more"><summary>📖 Full explanation and worked numbers</summary><div class="lbody">${Ls.body}</div><div class="ana">💡 ${Ls.ana}</div></details>`;
  else if(lsS===3){const dr=lsDr[lsI]||(lsDr[lsI]={seed:11+lsI*7,n:0});h+=`<p class="mut">Now do one yourself, like the real exercises. Easy level; as many as you like.</p><div class="demo"><div id="m3drill"></div></div><div class="btns"><button data-a="dnew">New exercise</button><button class="pri" data-a="dchk">Check</button><button data-a="dsol">Show solution</button></div><div id="m3dres" style="font-weight:700;margin-top:8px"></div><div id="m3dsol" hidden></div>`}
  else{const ord=qs.map((x,i)=>shuf(x.ch,lsI*31+i));
    h+=`<p class="mut">Answer all ${qs.length} questions. Get at least ${Math.ceil(qs.length*.7)} right to complete the lesson.</p>`+qs.map((x,qi)=>{const a=st[qi];return`<div class="qc"><b>${qi+1}. ${x.q}</b><div class="o">${ord[qi].map(ci=>`<button data-q="${qi}" data-c="${ci}" class="${a!==undefined?(ci===x.a?'ok':ci===a?'no':''):''}" ${a!==undefined?'disabled':''}>${x.ch[ci]}</button>`).join('')}</div>${a!==undefined?`<div class="mut" style="margin-top:6px">${a===x.a?'<span class="good">✓ Correct.</span>':'<span class="badc">✗ Not quite.</span>'} ${x.why}</div>`:''}</div>`}).join('');
    const ans=Object.keys(st).length,ok=Object.keys(st).filter(k=>st[k]===qs[k].a).length;
    if(ans===qs.length)h+=ok>=Math.ceil(qs.length*.7)?`<div class="tip"><b>${ok}/${qs.length} correct. Lesson completed! 🎉</b></div>`:`<div class="tip">${ok}/${qs.length} correct. Read the lesson again and retry.</div><div class="btns"><button class="pri" data-a="retry">Try again</button></div>`}
  h+=`<div class="btns"><button data-a="back">← Back</button><button class="pri" data-a="fwd">${lsS<4?'Next →':(lsI<LESSONS.length-1?'Next lesson →':'Done')}</button><button data-a="prac">Practice this topic</button></div>`;
  q('m3lsBody').innerHTML=h;
  if(lsS===1){const dm=Ls.demos[Math.min(lsW,Ls.demos.length-1)];dm.fn(q('m3demoIn'))}
  if(lsS===3)drillShow();
  if(lsS===4){const ans=Object.keys(st).length,ok=Object.keys(st).filter(k=>st[k]===qs[k].a).length;
    if(ans===qs.length&&ok>=Math.ceil(qs.length*.7)&&!lsDone[Ls.t]){lsDone[Ls.t]=1;saveDone();q('m3lsTabs').querySelectorAll('button')[lsI].textContent='✓ '+Ls.t}}}
q('m3lsTabs').onclick=e=>{const b=e.target.closest('button');if(b){lsI=+b.dataset.k;lsS=0;lsW=0;renderLesson()}};
q('m3lsBody').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.st!==undefined){lsS=+b.dataset.st;lsW=0;renderLesson();return}
  if(b.dataset.w!==undefined){lsW=+b.dataset.w;renderLesson();return}
  if(b.dataset.q!==undefined){(lsQ[lsI]||(lsQ[lsI]={}))[+b.dataset.q]=+b.dataset.c;renderLesson();return}
  const a=b.dataset.a;
  if(a==='dnew'){lsDr[lsI].n++;drillShow();return}
  if(a==='dchk'){drillChk();return}
  if(a==='dsol'){drillSol();return}
  if(a==='retry'){delete lsQ[lsI];renderLesson()}
  else if(a==='back'){if(lsS>0)lsS--;else if(lsI>0){lsI--;lsS=4}lsW=0;renderLesson()}
  else if(a==='fwd'){if(lsS<4)lsS++;else if(lsI<LESSONS.length-1){lsI++;lsS=0}lsW=0;renderLesson();q('m3lsCard').scrollIntoView({behavior:'smooth'})}
  else if(a==='prac'){const m=['fields','amat','amat','fields','trace','trace','trace','trace','mesi','vm','vm'][lsI];q('m3Type').value=m;showSec('prac');newEx()}
  else if(a==='lab'){const dm=LESSONS[lsI].demos[Math.min(lsW,LESSONS[lsI].demos.length-1)].fn.lab;if(dm){clSet({addr:dm.cfg.addrBits,size:dm.cfg.size,su:1,block:dm.cfg.block,ways:dm.cfg.ways===1?'1':String(dm.cfg.ways),write:dm.cfg.write,alloc:dm.cfg.alloc?1:0,split:dm.cfg.split?1:0,tc:1,tp:10,miss:'single',trace:dm.tr});q('cl_pre').value='';showSec('cache');clRun()}}};
renderLesson();
/* ================= practice ================= */
const PR={ex:null,seed:0,solved:false,gave:false};const sc={ok:0,tried:0,streak:0};
(function(){q('m3Type').innerHTML=Object.keys(G.TYPES).map(k=>`<option value="${k}">${G.TYPES[k]}</option>`).join('')})();
function partHTML(p,i){
  const id='m3p_'+p.id;
  switch(p.kind){
    case'num':case'frac':case'hexlist':return`<div class="pp"><label for="${id}">${p.label}</label><input type="text" id="${id}" data-p="${p.id}" autocomplete="off" ${p.kind==='hexlist'?'placeholder="e.g. 1A, 2B or NONE"':''}></div>`;
    case'sel':return`<div class="pp"><label for="${id}">${p.label}</label><select id="${id}" data-p="${p.id}"><option value="">—</option>${p.opts.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></div>`;
    case'hmseq':return`<div class="pp"><label>${p.label}</label><div class="hmrow">${p.labels.map((l,k)=>`<span><small>${k+1}. ${esc(l)}</small><select data-p="${p.id}" data-k="${k}"><option value="">?</option><option value="H">H</option><option value="M">M</option></select></span>`).join('')}</div></div>`;
    case'vm':return`<div class="pp"><label>${p.label}</label><select data-p="${p.id}" data-f="outcome"><option value="">—</option>${p.opts.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select> <input type="text" data-p="${p.id}" data-f="pa" placeholder="physical address (hex)" style="width:170px"></div>`}}
function readAns(){const a={};q('m3exBody').querySelectorAll('[data-p]').forEach(el=>{const id=el.dataset.p;
  if(el.dataset.k!==undefined){(a[id]=a[id]||[])[+el.dataset.k]=el.value}else if(el.dataset.f){(a[id]=a[id]||{})[el.dataset.f]=el.value}else a[id]=el.value});return a}
function newEx(retry){
  const type=q('m3Type').value,lvl=+q('m3Lvl').value;let seed=+q('m3Seed').value;
  if(!retry||!PR.ex){if(!(seed>0))seed=1+Math.floor(Math.random()*999999);PR.seed=seed}
  else seed=PR.seed;
  const ex=G.gen(type,seed,lvl);PR.ex=ex;PR.solved=false;PR.gave=false;
  q('m3exInfo').textContent=`Seed ${seed} · ${ex.title}`;
  q('m3exBody').innerHTML=ex.intro+'<div class="parts">'+ex.parts.map(partHTML).join('')+'</div>';
  q('m3exRes').textContent='';q('m3exSol').hidden=true;q('m3exCard').hidden=false;
  if(!retry)sc.tried++;showScore()}
function showScore(){q('m3score').textContent=sc.tried?`Solved ${sc.ok} of ${sc.tried} · streak ${sc.streak}`:''}
q('m3New').onclick=()=>{q('m3Seed').value='';newEx()};q('m3Retry').onclick=()=>newEx(true);
q('m3Type').onchange=()=>{q('m3Seed').value=''};
q('m3Chk').onclick=()=>{if(!PR.ex)return;const a=readAns(),c=G.check(PR.ex,a);
  q('m3exBody').querySelectorAll('.pp').forEach(pp=>pp.classList.remove('okp','nop'));
  PR.ex.parts.forEach(p=>{const el=q('m3exBody').querySelector(`[data-p="${p.id}"]`);const pp=el&&el.closest('.pp');if(pp)pp.classList.add(c.res[p.id]?'okp':'nop')});
  const wrong=PR.ex.parts.filter(p=>!c.res[p.id]).length;
  if(c.all){q('m3exRes').innerHTML='<span class="good">✓ All correct!</span>';if(!PR.solved&&!PR.gave){PR.solved=true;sc.ok++;sc.streak++;showScore()}}
  else{q('m3exRes').innerHTML=`<span class="badc">✗ ${wrong} of ${PR.ex.parts.length} answers are wrong (red).</span> Check the units and rounding (a 0.5% error is accepted).`;}};
q('m3Rev').onclick=()=>{if(!PR.ex)return;q('m3exSol').hidden=false;q('m3exSol').innerHTML='<h4>Solution</h4>'+PR.ex.sol;if(!PR.solved&&!PR.gave){PR.gave=true;sc.streak=0;showScore()}};
q('m3exCard').hidden=true;
/* ================= cache lab ================= */
const CL={addr:q('cl_addr'),size:q('cl_size'),su:q('cl_su'),block:q('cl_block'),ways:q('cl_ways'),repl:q('cl_repl'),write:q('cl_write'),alloc:q('cl_alloc'),split:q('cl_split'),tc:q('cl_tc'),tp:q('cl_tp'),miss:q('cl_miss'),trace:q('cl_trace')};
const CPRE=[['Slide: direct-mapped (4Eh, 4Fh, CFh)',{addr:8,size:32,su:1,block:4,ways:'1',trace:'R 4E\nR 4F\nR CF\nR 4E'}],
 ['Ex 37.3: DM 4 KiB, 32 B lines',{addr:20,size:4096,su:1,block:32,ways:'1',tc:4,tp:20,miss:'single',trace:'R A5234\nR A8230\nR A823F\nR FF01A'}],
 ['Ex 38: fully associative, write-back',{addr:16,size:32,su:1,block:8,ways:'FA',write:'wb',alloc:1,trace:'R 15C0\nR 15C1\nR 15C2\nR 15C9\nW 2080\nW 2081\nR 15CA\nR 15D8\nW 208F\nR 2090\nR 15D9\nW 405C\nR 15D6\nR 15D7\nR 6579\nR 657A'}],
 ['Ex 39: DM 8×4 B, write-back',{addr:12,size:32,su:1,block:4,ways:'1',write:'wb',alloc:1,tc:2,tp:10,miss:'single',trace:'R 400 C\nR 148 D\nR 401 C\nR 402 C\nW 149 D\nR 40A C\nR 40B C\nW 1BD D\nR 409 C\nR 150 D\nW 160 D\nR 40A C\nR 361 D\nR 414 C\nR 362 D\nW 363 D'}],
 ['Ex 39.8: same, split code/data',{addr:12,size:32,su:1,block:4,ways:'1',write:'wb',alloc:1,split:1,tc:2,tp:10,miss:'single',trace:'R 400 C\nR 148 D\nR 401 C\nR 402 C\nW 149 D\nR 40A C\nR 40B C\nW 1BD D\nR 409 C\nR 150 D\nW 160 D\nR 40A C\nR 361 D\nR 414 C\nR 362 D\nW 363 D'}]];
q('cl_pre').innerHTML='<option value="">— custom —</option>'+CPRE.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('');
function clSet(o){CL.addr.value=o.addr;CL.size.value=o.size;CL.su.value=o.su||1;CL.block.value=o.block;CL.ways.value=o.ways;CL.repl.value=o.repl||'LRU';CL.write.value=o.write||'wb';CL.alloc.checked=o.alloc!==0&&(o.alloc===undefined?true:!!o.alloc);CL.split.checked=!!o.split;CL.tc.value=o.tc||1;CL.tp.value=o.tp||10;CL.miss.value=o.miss||'single';CL.trace.value=o.trace||''}
q('cl_pre').onchange=()=>{const p=CPRE[q('cl_pre').value];if(p){clSet(p[1]);clRun()}};
function clCfg(){const w=CL.ways.value;return{addrBits:+CL.addr.value,size:(+CL.size.value)*(+CL.su.value),block:+CL.block.value,ways:w==='FA'?'FA':+w,repl:CL.repl.value,write:CL.write.value,alloc:CL.alloc.checked,split:CL.split.checked,tc:+CL.tc.value,tp:+CL.tp.value,missModel:CL.miss.value}}
function clRun(){
  const c=clCfg(),pt=U.parseTrace(CL.trace.value,16),out=q('cl_out');
  const f=U.fields(c);if(f.err.length){out.innerHTML='<div class="badc">'+f.err.map(esc).join('<br>')+'</div>';return}
  if(c.split&&f.lines<2){out.innerHTML='<div class="badc">The cache needs at least 2 lines to be split.</div>';return}
  const bad=pt.trace.find(t=>t.addr>=Math.pow(2,c.addrBits));if(bad){out.innerHTML=`<div class="badc">Address ${hx(bad.addr)}h does not fit in ${c.addrBits} bits.</div>`;return}
  const s=U.simulate(c,pt.trace);if(s.err){out.innerHTML='<div class="badc">'+s.err.map(esc).join('<br>')+'</div>';return}
  const aw=Math.ceil(c.addrBits/4),F=s.fields;
  let h=(pt.errs.length?`<div class="badc">${pt.errs.map(esc).join('<br>')}</div>`:'')+`<div class="mut">${cfgText(c,F)}${c.split?' · split: each half has '+(F.lines/2)+' lines':''}</div>`;
  h+=`<div class="stats"><div>Accesses <b>${s.n}</b></div><div>Hits <b>${s.hits}</b></div><div>Misses <b>${s.misses}</b></div><div>Hit rate <b>${s.n?fx(s.hitRate*100,5)+'%':'–'}</b></div><div>Time <b>${fx(s.time,6)} ns</b></div></div>`;
  h+=`<div>Misses at: <b>${s.missAddrs.length?s.missAddrs.map(a=>hx(a,aw)+'h').join(', '):'none'}</b></div><div>Blocks replaced: <b>${s.replaced.length?s.replaced.map(b=>hx(b)+'h').join(', '):'none'}</b></div><div>${c.write==='wb'?'Blocks written back to memory':'Blocks written in main memory'}: <b>${s.updated.length?s.updated.map(b=>hx(b)+'h').join(', '):'none'}</b></div>`;
  h+=`<div class="scroll"><table class="mt"><tr><th>#</th>${c.split?'<th>C/D</th>':''}<th>Access</th><th>Block</th>${F.sets>1?'<th>Set</th>':''}<th>Tag</th><th>Result</th><th>What happens</th></tr>`+s.rows.map(r=>`<tr><td>${r.i}</td>${c.split?`<td>${r.cd}</td>`:''}<td>${r.rw} ${hx(r.addr,aw)}h</td><td>${hx(r.blk)}h</td>${F.sets>1?`<td>${r.set}</td>`:''}<td>${F.tagBits?tb(r.tag,F.tagBits):'–'}</td><td class="${r.hit?'good':'badc'}">${r.hit?'hit':'miss'}</td><td class="wh">${narrate(r,c,F,aw).replace(/^.*?: /,'').replace(/^<b[^>]*>(hit|miss)<\/b>( · )?/,'')||'–'}</td></tr>`).join('')+'</table></div>';
  const cs=s.caches;h+='<details><summary>Final cache state</summary>'+Object.keys(cs).map(k=>`${c.split?`<h4>${k==='C'?'Code':'Data'} cache</h4>`:''}<div class="scroll">${cacheHTML(cs[k],{wb:c.write!=='wt'})}</div>`).join('')+'</details>';
  out.innerHTML=h;clVisual(c,pt);q('cl_sg').innerHTML=''}
q('cl_run').onclick=clRun;q('cl_pre').value='';
q('cl_gen').onclick=()=>{const bases=q('cl_bases').value.split(/[\s,]+/).filter(Boolean).map(x=>U.num(x,16)),n=+q('cl_n').value||1,e=+q('cl_e').value||1,rw=q('cl_lw').value;
  if(bases.some(isNaN)){return}const t=U.loopTrace(bases,n,e,bases.map(()=>rw));CL.trace.value=t.map(x=>x.rw+' '+hx(x.addr)).join('\n');clRun()};
['cl_addr','cl_size','cl_su','cl_block','cl_ways','cl_repl','cl_write','cl_alloc','cl_split','cl_tc','cl_tp','cl_miss'].forEach(id=>q(id).addEventListener('change',()=>{q('cl_pre').value='';clRun()}));
clSet(CPRE[2][1]);q('cl_pre').value='2';clRun();
/* ================= paging lab ================= */
const PL={v:q('pl_v'),p:q('pl_p'),page:q('pl_page'),ent:q('pl_ent'),table:q('pl_table'),va:q('pl_va'),mode:q('pl_mode')};
function parsePT(txt){const t={},errs=[];txt.split(/\n/).forEach((ln,k)=>{ln=ln.replace(/[;#].*$/,'').trim();if(!ln)return;const p=ln.replace(/->|→|=/g,' ').split(/\s+/);const vpn=U.num(p[0],16);
  if(isNaN(vpn)){errs.push('line '+(k+1)+': bad page number');return}
  const rest=p.slice(1).map(x=>x.toLowerCase());const e={pres:0,rw:rest.includes('ro')?1:0,us:rest.includes('kernel')||rest.includes('sys')?0:1};
  if(rest[0]==='disk'||rest[0]==='d'){e.pres=0;e.loc=rest[1]&&!['ro','rw','user','kernel','sys'].includes(rest[1])?p[2]:'disk'}
  else if(rest[0]==='x'||rest[0]==='invalid'||rest[0]==='-'||rest[0]===undefined){e.pres=0}
  else{const fr=U.num(p[1],16);if(isNaN(fr)){errs.push('line '+(k+1)+': bad frame');return}e.pres=1;e.frame=fr}
  t[vpn]=e});return{t,errs}}
const PPRE=[['Slide: 32-bit virtual, 20-bit physical, 4 KiB',{v:32,p:20,page:4096,ent:1,va:'800015AB',acc:'u r 800015AB\nu r 00101190\nu r 0010342C\nu w 00100FFF\nk r 80000123',table:'00100 -> 04\n00101 -> disk Y\n00102 -> 05\n80000 -> 01\n80001 -> 02\n80002 -> disk X'}],
 ['Ex 49: task 1 (R/W 1 = read only, U/S 1 = user)',{v:32,p:28,page:4096,ent:2,va:'00101123',acc:'u r 00101123\nu r 00100123\nu r 00102001\nu r A000104F\nu w 00050010\nu w 00052010\nk r A000104F',table:'00050 -> 316 ro user\n00051 -> 80B rw user\n00052 -> 9CD rw user\n00100 -> disk X user\n00101 -> 1CD rw user\n00102 -> invalid\nA0001 -> 100 rw kernel\nA0002 -> 150 rw kernel\nA0003 -> disk Z kernel'}]];
q('pl_pre').innerHTML='<option value="">— custom —</option>'+PPRE.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('');
q('pl_pre').onchange=()=>{const p=PPRE[q('pl_pre').value];if(!p)return;PL.v.value=p[1].v;PL.p.value=p[1].p;PL.page.value=p[1].page;PL.ent.value=p[1].ent;PL.table.value=p[1].table;PL.va.value=p[1].va;q('pl_acc').value=p[1].acc;plRun()};
function plRun(){
  const g={vBits:+PL.v.value,pBits:+PL.p.value,page:+PL.page.value,entryBytes:+PL.ent.value},o=q('pl_out');
  if(!U.isP2(g.page)||g.pBits<=U.lg(g.page)||g.vBits<=U.lg(g.page)){o.innerHTML='<span class="badc">Page size must be a power of two smaller than both address spaces.</span>';return}
  const G=U.vmGeom(g),pt=parsePT(PL.table.value);
  let h=(pt.errs.length?`<div class="badc">${pt.errs.map(esc).join('<br>')}</div>`:'')+`<div class="stats"><div>Offset <b>${G.offB}</b> bits</div><div>Virtual pages <b>${G.pages}</b></div><div>Frames <b>${G.frames}</b></div><div>Physical memory <b>${U.fmtSize(G.physBytes)}</b></div><div>Page table <b>${U.fmtSize(G.ptBytes)}</b></div></div>`;
  const va=U.num(PL.va.value.replace(/\s/g,''),16);
  if(isNaN(va))h+='<span class="badc">Enter a hexadecimal virtual address.</span>';else h+=vmExplain(g,pt.t,va,{user:PL.mode.value[0]==='u',write:PL.mode.value.endsWith('w')});
  o.innerHTML=h;q('pl_sg').innerHTML=''}
q('pl_run').onclick=plRun;['pl_v','pl_p','pl_page','pl_ent','pl_mode'].forEach(id=>q(id).addEventListener('change',()=>{q('pl_pre').value='';plRun()}));
q('pl_tlb').onclick=()=>{const n=Math.max(1,+q('pl_tn').value||1),G=U.vmGeom({vBits:+PL.v.value,pBits:+PL.p.value,page:+PL.page.value,entryBytes:1});
  const vas=q('pl_ts').value.split(/[\s,]+/).filter(Boolean).map(x=>U.num(x,16));if(vas.some(isNaN)){q('pl_tout').innerHTML='<span class="badc">Addresses must be hexadecimal.</span>';return}
  const pt=parsePT(PL.table.value).t,vp=vas.map(a=>Math.floor(a/(+PL.page.value))),r=U.tlbSim(n,vp,pt);
  q('pl_tout').innerHTML=`<div class="scroll"><table class="mt"><tr><th>Virtual address</th>${vas.map(a=>`<th>${hx(a)}h</th>`).join('')}</tr><tr><td>Page</td>${vp.map(a=>`<td>${hx(a)}h</td>`).join('')}</tr><tr><td>TLB</td>${r.rows.map(x=>`<td class="${x.hit?'good':'badc'}">${x.hit?'hit':'miss'}${x.evicted!=null?'<br><small>evicts '+hx(x.evicted)+'h</small>':''}</td>`).join('')}</tr><tr><td>Page table</td>${r.rows.map(x=>`<td>${x.hit?'–':x.pageFault?'page fault':'entry loaded'}</td>`).join('')}</tr></table></div><p>TLB hit rate <b>${fx(r.hits/vas.length*100,4)}%</b> (${r.hits}/${vas.length}).</p>`};
q('pl_pre').value='0';PL.v.value=32;PL.p.value=20;PL.page.value=4096;PL.ent.value=1;PL.table.value=PPRE[0][1].table;PL.va.value=PPRE[0][1].va;q('pl_acc').value=PPRE[0][1].acc;plRun();
/* ================= MESI lab ================= */
const MP=[['Ex 43 (2 × 8 KiB, 2-way, 16 B lines)',{addr:20,size:8192,block:16,ways:2,ops:'P1 R 201A3\nP2 R 8135B\nP2 R 201A8\nP1 W 201A0\nP2 W 201A8\nP1 R 8135C'}],
 ['Slide: a = 3 (P1 R, P2 R, P1 W, P2 R)',{addr:8,size:64,block:16,ways:1,ops:'P1 R 30\nP2 R 31\nP1 W 32\nP2 R 33'}]];
q('ml_pre').innerHTML='<option value="">— custom —</option>'+MP.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('');
q('ml_pre').onchange=()=>{const p=MP[q('ml_pre').value];if(!p)return;q('ml_addr').value=p[1].addr;q('ml_size').value=p[1].size;q('ml_block').value=p[1].block;q('ml_ways').value=p[1].ways;q('ml_ops').value=p[1].ops;mlRun()};
function mlRun(){const c={addrBits:+q('ml_addr').value,size:+q('ml_size').value,block:+q('ml_block').value,ways:+q('ml_ways').value,np:2},o=q('ml_out');
  const ops=[],errs=[];q('ml_ops').value.split(/\n/).forEach((ln,k)=>{ln=ln.replace(/[;#].*$/,'').trim();if(!ln)return;const m=ln.match(/^P?([12])\s+([RWLE])\s+([0-9a-fA-F]+)h?$/i);if(!m){errs.push('line '+(k+1)+': use “P1 R 201A3”');return}ops.push({p:+m[1]-1,rw:/[WE]/i.test(m[2])?'W':'R',addr:parseInt(m[3],16)})});
  const r=U.mesi(c,ops);if(r.err){o.innerHTML='<span class="badc">'+r.err.join('; ')+'</span>';return}
  const aw=Math.ceil(c.addrBits/4);
  o.innerHTML=(errs.length?`<div class="badc">${errs.map(esc).join('<br>')}</div>`:'')+`<div class="mut">${cfgText(c,r.fields)} · write-back, LRU, write-invalidate MESI</div><div class="scroll"><table class="mt"><tr><th>#</th><th>Access</th><th>Block</th><th>Hit?</th><th>Replacement</th><th>Memory update</th><th>P1</th><th>P2</th><th>Why</th></tr>`+r.rows.map(x=>`<tr><td>${x.i}</td><td>P${x.p+1} ${x.rw} ${hx(x.addr,aw)}h</td><td>${hx(x.blk)}h</td><td class="${x.hit?'good':'badc'}">${x.hit?'hit':'miss'}</td><td>${x.replaced!=null?'block '+hx(x.replaced)+'h':'–'}</td><td>${x.updated.length?'block '+hx(x.updated[0])+'h':'–'}</td><td class="st${x.after[0]}">${x.after[0]}</td><td class="st${x.after[1]}">${x.after[1]}</td><td class="wh">${mexpl(x)}</td></tr>`).join('')+'</table></div>';q('ml_sg').innerHTML='';if(ops.length&&ops.length<=30)mesiStepper(q('ml_vis'),{cfg:c,ops});else q('ml_vis').innerHTML='<span class="mut">Write 1–30 accesses to see the step-by-step view.</span>'}
q('ml_run').onclick=mlRun;['ml_addr','ml_size','ml_block','ml_ways'].forEach(id=>q(id).addEventListener('change',()=>{q('ml_pre').value='';mlRun()}));
q('ml_pre').value='0';q('ml_pre').onchange();

/* ================= solve-it-yourself builders (cache / paging / MESI) ================= */
const HM=[['H','hit'],['M','miss']];
const listCheck=exp=>v=>{const l=G.parseList(v);if(l===null)return false;const e=[...exp].sort((a,b)=>a-b);return l.length===e.length&&l.every((x,i)=>x===e[i])};
const listShow=a=>a.length?a.map(b=>hx(b)+'h').join(', '):'none';
q('cl_vis_info').textContent='';
function clVisual(c,pt){const box=q('cl_vis');
  if(!pt.trace.length){box.innerHTML='<span class="mut">Write some accesses in the trace first.</span>';return}
  if(pt.trace.length>60){box.innerHTML='<span class="mut">The step-by-step view is limited to 60 accesses (this trace has '+pt.trace.length+'). Use the table above.</span>';return}
  stepper(box,{cfg:c,trace:pt.trace})}
q('cl_mk').onclick=()=>{
  const c=clCfg(),pt=U.parseTrace(CL.trace.value,16),box=q('cl_sg'),F=U.fields(c);
  if(F.err.length||!pt.trace.length){box.innerHTML='<span class="badc">Fix the cache description and the trace first.</span>';return}
  if(pt.trace.length>40){box.innerHTML='<span class="badc">Use at most 40 accesses for the exercise grid.</span>';return}
  const s=U.simulate(c,pt.trace);if(s.err){box.innerHTML='<span class="badc">'+s.err.join('; ')+'</span>';return}
  const aw=Math.ceil(c.addrBits/4);
  const Fh=c.split?U.fields({addrBits:c.addrBits,size:c.size/2,block:c.block,ways:c.ways==='FA'?F.lines/2:Math.min(c.ways,F.lines/2)}):F;
  const cols=[{k:'blk',label:'Block (hex)',kind:'hex',hint:'block number = address ÷ block size (the address without the offset bits).'}];
  if(Fh.sets>1)cols.push({k:'set',label:'Set / line',kind:'int',hint:'set = block mod number of sets (the index bits of the address).'});
  if(Fh.tagBits>0)cols.push({k:'tag',label:`Tag (binary, ${Fh.tagBits} bits)`,kind:'bin',w:Fh.tagBits,ph:'bits',hint:'tag = the high bits of the block number, above the index.'});
  cols.push({k:'hm',label:'Hit / miss',kind:'sel',opts:HM,hint:'hit only if a valid line of that set holds the same tag.'});
  cols.push({k:'rep',label:'Replaced block (hex)',kind:'hex',ph:'blank = none',hint:'only when the miss needs a line that holds a valid block: which block was in it? (LRU if several)'});
  cols.push({k:'mw',label:c.write==='wb'?'Written back (hex)':'Written to memory (hex)',kind:'hex',ph:'blank = none',hint:c.write==='wb'?'write-back: a dirty block is written to memory only when it is replaced.':'write-through: every write also goes to main memory (a write miss without allocate too).'});
  const rows=s.rows.map(r=>({label:`${r.i} · ${r.rw} ${hx(r.addr,aw)}h${c.split?' '+r.cd:''}`,ans:{blk:String(r.blk),set:String(r.set),tag:String(r.tag),hm:r.hit?'H':'M',rep:r.replaced==null?'':String(r.replaced),mw:r.wb!=null?String(r.wb):r.memWrite!=null?String(r.memWrite):''}}));
  const extras=[{label:'Hit rate (fraction, % or x/y)',check:v=>{const x=G.parseFrac(v);return!isNaN(x)&&Math.abs(x-s.hitRate)<=0.001},show:fx(s.hitRate*100,5)+'%',hint:'hit rate = hits ÷ accesses.'},
    {label:`Total access time, ns (hit = ${c.tc} ns, miss = ${c.missModel==='block'?c.block+' × '+c.tp:c.tp} ns)`,check:v=>{const x=parseFloat(String(v).replace(',','.'));return!isNaN(x)&&Math.abs(x-s.time)<=Math.max(1e-9,Math.abs(s.time)*0.005)},show:fx(s.time,6),hint:'hits × tc + misses × miss time (set in the Cache lab options above).'},
    {label:'All blocks replaced (hex list or NONE)',check:listCheck(s.replaced),show:listShow(s.replaced),hint:'collect the “replaced” column without repeating blocks.'},
    {label:c.write==='wb'?'All blocks updated in memory (hex list or NONE)':'All blocks written to memory (hex list or NONE)',check:listCheck(s.updated),show:listShow(s.updated),hint:'collect the last column without repeating blocks.'}];
  box.innerHTML='';solveGrid(box,{cols,rows,extras})};
/* ---- paging ---- */
function parseAcc(txt){const out=[],errs=[];txt.split(/\n/).forEach((ln,k)=>{ln=ln.replace(/[;#].*$/,'').trim();if(!ln)return;const p=ln.split(/\s+/);const last=p[p.length-1],va=U.num(last,16);
  if(isNaN(va)){errs.push('line '+(k+1)+': address?');return}const m=p.slice(0,-1).join('').toLowerCase();out.push({va,user:!/k/.test(m),write:/w/.test(m)})});return{out,errs}}
q('pl_mk').onclick=()=>{
  const g={vBits:+PL.v.value,pBits:+PL.p.value,page:+PL.page.value,entryBytes:+PL.ent.value},box=q('pl_sg');
  if(!U.isP2(g.page)||g.pBits<=U.lg(g.page)||g.vBits<=U.lg(g.page)){box.innerHTML='<span class="badc">Fix the geometry first.</span>';return}
  const G2=U.vmGeom(g),pt=parsePT(PL.table.value).t,acc=parseAcc(q('pl_acc').value);
  if(!acc.out.length||acc.errs.length||acc.out.some(a=>a.va>=G2.virtBytes)){box.innerHTML='<span class="badc">Write the accesses as “u r 800015AB” (u/k = user/kernel, r/w = read/write, hex address), within the virtual address space.</span>';return}
  const aw=Math.ceil(g.vBits/4),pw=Math.ceil(g.pBits/4),vw=Math.ceil(G2.vpnB/4);
  const OUT=[['ok','translated'],['disk','page fault (disk)'],['invalid','fatal fault'],['protection','protection fault']];
  const cols=[{k:'vpn',label:'Virtual page (hex)',kind:'hex',hint:'drop the '+G2.offB+' offset bits (the page number is the address ÷ page size).'},{k:'off',label:'Offset (hex)',kind:'hex',hint:'the low '+G2.offB+' bits of the address (address mod page size).'},
    {k:'out',label:'Result',kind:'sel',opts:OUT,hint:'check Present, then the R/W and U/S bits against the kind of access.'},{k:'fr',label:'Frame (hex)',kind:'hex',ph:'blank if none',hint:'the Frame field of the entry (only if present and allowed).'},{k:'pa',label:'Physical address (hex)',kind:'hex',ph:'blank if none',hint:'frame followed by the unchanged offset: frame × page size + offset.'}];
  const rows=acc.out.map((a,i)=>{const t=U.translate(g,pt,a.va,{user:a.user,write:a.write});
    return{label:`${i+1} · ${a.user?'user':'kernel'} ${a.write?'write':'read'} ${hx(a.va,aw)}h`,ans:{vpn:String(t.vpn),off:String(t.off),out:t.outcome,fr:t.outcome==='ok'?String(t.frame):'',pa:t.outcome==='ok'?String(t.pa):''}}});
  const extras=[{label:'Number of page-table entries',check:v=>+v===G2.pages,show:String(G2.pages),hint:'2^(virtual bits − offset bits).'},{label:'Number of frames',check:v=>+v===G2.frames,show:String(G2.frames),hint:'2^(physical bits − offset bits).'},{label:'Page table size, bytes',check:v=>+v===G2.ptBytes,show:String(G2.ptBytes),hint:'entries × bytes per entry.'}];
  box.innerHTML='';solveGrid(box,{cols,rows,extras})};
/* ---- MESI ---- */
function mlOps(){const ops=[];q('ml_ops').value.split(/\n/).forEach(ln=>{ln=ln.replace(/[;#].*$/,'').trim();if(!ln)return;const m=ln.match(/^P?([12])\s+([RWLE])\s+([0-9a-fA-F]+)h?$/i);if(m)ops.push({p:+m[1]-1,rw:/[WE]/i.test(m[2])?'W':'R',addr:parseInt(m[3],16)})});return ops}
q('ml_mk').onclick=()=>{const c={addrBits:+q('ml_addr').value,size:+q('ml_size').value,block:+q('ml_block').value,ways:+q('ml_ways').value,np:2},ops=mlOps(),box=q('ml_sg');
  const r=U.mesi(c,ops);if(r.err||!ops.length){box.innerHTML='<span class="badc">Fix the description and write at least one access.</span>';return}
  if(ops.length>30){box.innerHTML='<span class="badc">Use at most 30 accesses.</span>';return}
  const aw=Math.ceil(c.addrBits/4),ST=[['M','M'],['E','E'],['S','S'],['I','I']];
  const cols=[{k:'hm',label:'Hit / miss',kind:'sel',opts:HM,hint:'hit if this processor already holds the block in a valid state (M, E or S).'},
   {k:'s1',label:'P1 state',kind:'sel',opts:ST,hint:'read miss: E if nobody has it, else S; write: M here and I elsewhere; a remote copy is invalidated by a write.'},
   {k:'s2',label:'P2 state',kind:'sel',opts:ST,hint:'a read makes remote copies S; a write makes them I; untouched caches keep their state.'},
   {k:'up',label:'Memory updated?',kind:'sel',opts:[['N','no'],['Y','yes']],hint:'yes when a Modified copy is written back (remote M on a miss, or an M victim replaced).'},
   {k:'rep',label:'Replaced block (hex)',kind:'hex',ph:'blank = none',hint:'only if the set of the requesting cache was full.'}];
  const rows=r.rows.map(x=>({label:`${x.i} · P${x.p+1} ${x.rw} ${hx(x.addr,aw)}h`,ans:{hm:x.hit?'H':'M',s1:x.after[0],s2:x.after[1],up:x.updated.length?'Y':'N',rep:x.replaced==null?'':String(x.replaced)}}));
  box.innerHTML='';solveGrid(box,{cols,rows,extras:[]})};

window.U3UI={PR,LESSONS,lsDone:()=>lsDone,solveGrid,stepper};
})();
//U3UI-END

