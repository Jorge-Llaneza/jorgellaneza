/* ============ phase 2: classroom and host-app integration ============ */
var CFG={embed:true,lessons:{}};
var LANG=tget('halcyon-lang')||'en';
Object.assign(ES,{'ships processed':'barcos procesados','faults cited correctly':'fallos citados correctamente','shifts won':'turnos ganados','instructions shipped':'instrucciones enviadas','missions completed':'misiones completadas','relay stars':'estrellas del relé','maps won':'mapas ganados','shards held':'fragmentos','maps cleared':'mapas superados','chambers unsealed':'cámaras abiertas','lab points':'puntos del laboratorio','lessons finished':'lecciones terminadas','stars collected':'estrellas reunidas'});
function t(s){var v=ES[s];return (LANG==='es'&&v)?v:s}
function dispName(){return H.name||t('Inspector')}
function setTitle(s){if(!CFG.embed)document.title=s}
function b64e(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o))))}
function b64d(s){return JSON.parse(decodeURIComponent(escape(atob(s))))}

/* ---- per-profile storage namespace ---- */
var PFX='';
jget=function(k){try{var v=localStorage.getItem(PFX+k);return v==null?null:JSON.parse(v)}catch(e){return null}};
lsKeys=function(){var o=[];try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(PFX){if(k.indexOf(PFX)===0)o.push(k.slice(PFX.length))}else if(k.indexOf('ns:')!==0)o.push(k)}}catch(e){}return o};
saveH=function(){try{localStorage.setItem(PFX+LSK,JSON.stringify(H))}catch(e){}};
function initH(){H=jget(LSK)||{};if(!H.v)H.v=1;H.notes=H.notes||{};H.chal=H.chal||[];['un','days','dsecs','dd','plays','secs'].forEach(function(k){H[k]=H[k]||{}});H.pins=H.pins||[];H.assign=H.assign||[];H.friends=H.friends||[]}
initH();
exportCode=function(){var d={};lsKeys().forEach(function(k){if(allowed(k)){try{d[k]=localStorage.getItem(PFX+k)}catch(e){}}});try{return 'HALCYON1.'+b64e({v:1,d:d})}catch(e){return ''}};
importCode=function(code){
  code=(code||'').trim();if(code.indexOf('HALCYON1.')!==0)return 'That is not a Halcyon save code.';
  var o;try{o=b64d(code.slice(9))}catch(e){return 'The code is damaged. Copy it again in full.'}
  if(!o||o.v!==1||!o.d||typeof o.d!=='object')return 'The code is damaged. Copy it again in full.';
  var n=0;try{lsKeys().forEach(function(k){if(allowed(k))localStorage.removeItem(PFX+k)});
    Object.keys(o.d).forEach(function(k){if(allowed(k)&&typeof o.d[k]==='string'){localStorage.setItem(PFX+k,o.d[k]);n++}})}catch(e){return 'This browser blocked saving. Check your storage settings.'}
  initH();evaluate(true);renderAll();return 'Restored '+n+' saved items.';
};
function nsShim(P){return '(function(){var P='+JSON.stringify(P)+',S=Storage.prototype,g=S.getItem,s=S.setItem,r=S.removeItem,k=S.key,L=Object.getOwnPropertyDescriptor(S,"length").get;function ks(){var a=[],n=L.call(localStorage);for(var i=0;i<n;i++){var x=k.call(localStorage,i);if(x&&x.indexOf(P)===0)a.push(x.slice(P.length))}return a}S.getItem=function(x){return g.call(this,P+x)};S.setItem=function(x,v){return s.call(this,P+x,v)};S.removeItem=function(x){return r.call(this,P+x)};S.key=function(i){var a=ks();return i<a.length?a[i]:null};S.clear=function(){ks().forEach(function(x){r.call(localStorage,P+x)})};Object.defineProperty(S,"length",{get:function(){return ks().length}})})();'}
function loadGame(g){
  var f=$('frame'),ld=$('loading');ld.hidden=false;ld.textContent=t('Loading')+' '+g.name+'…';f.removeAttribute('srcdoc');
  if(window.__GAMES&&window.__GAMES[g.id]){var hh=window.__GAMES[g.id];if(PFX){var inj0='<script>'+nsShim(PFX)+'<\/script>',m0=hh.match(/<head[^>]*>/i);hh=m0?hh.replace(m0[0],function(x){return x+inj0}):inj0+hh}f.srcdoc=hh;return}
  if(!PFX){f.src=g.file;return}
  fetch(g.file).then(function(r){return r.text()}).then(function(h){
    if(cur!==g.id)return;var inj='<script>'+nsShim(PFX)+'<\/script>',m=h.match(/<head[^>]*>/i);
    h=m?h.replace(m[0],m[0]+inj):inj+h;f.srcdoc=h}).catch(function(){f.src=g.file});
}
function unloadGame(){var f=$('frame');f.removeAttribute('src');f.removeAttribute('srcdoc')}
$('frame').addEventListener('load',function(){$('loading').hidden=true});
var PF={};function prefetch(id){var g=gameOf(id);if(!g||PF[id]||PFX||window.__GAMES)return;PF[id]=1;try{fetch(g.file).catch(function(){})}catch(e){}}
['mouseover','focusin'].forEach(function(ev){$('grid').addEventListener(ev,function(e){var c=e.target.closest&&e.target.closest('.card');if(c)prefetch(c.id.slice(5))})});
function setNS(ns){var np=ns?'ns:'+ns+'::':'';if(np===PFX)return;PFX=np;initH();if(cur)loadGame(gameOf(cur));evaluate(true);renderAll();emit('profile',{ns:ns||''})}

/* ---- metrics, sessions, recap ---- */
var MET=[
 {k:'ph_ships',l:'ships processed',f:function(s){return s.ph.ships}},{k:'ph_right',l:'faults cited correctly',f:function(s){return s.ph.right}},
 {k:'pf_wins',l:'shifts won',f:function(s){return s.pf.wins}},{k:'pf_ship',l:'instructions shipped',f:function(s){return s.pf.shipped}},
 {k:'hr_lv',l:'missions completed',f:function(s){return s.hr.levels}},{k:'hr_st',l:'relay stars',f:function(s){return s.hr.stars}},
 {k:'pk_wins',l:'maps won',f:function(s){return s.pk.wins}},{k:'pk_cl',l:'maps cleared',f:function(s){return s.pk.cleared}},{k:'pk_sh',l:'shards held',f:function(s){return s.pk.shards}},
 {k:'ap_un',l:'chambers unsealed',f:function(s){return s.ap.unlocked}},{k:'ap_pt',l:'lab points',f:function(s){return s.ap.total}},
 {k:'le_done',l:'lessons finished',f:function(s){return s.le.done}},{k:'le_st',l:'stars collected',f:function(s){return s.le.stars}}
];
function metOf(k){return MET.filter(function(m){return m.k===k})[0]}
var CONCEPTS={'port-halcyon':['Contrast ratios','Text alternatives','Keyboard focus','Target size'],'pipeline-factory':['Pipeline stages','Data hazards','Forwarding','CPI and IPC'],'relay-7':['Ohm’s law','Series and parallel','Power and heat','Fuses'],'pathfinders-keep':['Dijkstra','A* search','Heaps and queues','Caching'],'proof-lab':['Propositional logic','Predicate logic','Proof rules','Computation models'],'logic-engine':['Conditionals','Loops','Functions','Reading output']};
var SES=null,RECAP=null;
function flat(s){var o={};MET.forEach(function(m){o[m.k]=m.f(s)});return o}
function startSession(g){SES={g:g.id,t0:Date.now(),base:flat(snap())};RECAP=null}
function endSession(){
  if(!cur||!SES||SES.g!==cur)return;
  var now=flat(snap()),d=[];MET.forEach(function(m){var x=now[m.k]-SES.base[m.k];if(x>0)d.push({k:m.k,l:m.l,n:x})});
  var un=ALL.filter(function(a){return H.un[a[0]]>=SES.t0}),secs=Math.round((Date.now()-SES.t0)/1000);
  RECAP={g:SES.g,secs:secs,d:d,un:un};
  emit('session',{game:SES.g,seconds:secs,gains:d,trophies:un.map(function(a){return a[0]})});SES=null;
}
function renderRecap(){
  var r=$('recap');if(!RECAP||RECAP.secs<15){r.hidden=true;return}
  var g=gameOf(RECAP.g);r.hidden=false;r.style.setProperty('--c',g.c);r.innerHTML='<div class="rh"><h3 class="ph"></h3><button type="button" class="chip" id="rc-x">Dismiss</button></div><ul class="rl"></ul><p class="note"></p>';
  r.querySelector('h3').textContent=t('Session recap')+' · '+g.name+' · '+fmtTime(RECAP.secs);
  var ul=r.querySelector('ul');
  RECAP.d.forEach(function(x){var li=document.createElement('li');li.textContent='+'+x.n+' '+t(x.l);ul.appendChild(li)});
  RECAP.un.forEach(function(a){var li=document.createElement('li');li.className='tro';li.textContent=t('New trophies')+': '+t(a[2]);ul.appendChild(li)});
  if(!RECAP.d.length&&!RECAP.un.length){var li=document.createElement('li');li.textContent=t('Nothing new was saved this time. Longer sessions give more to review.');ul.appendChild(li)}
  var c=document.createElement('li');c.textContent=t('Concepts practiced')+': '+(CONCEPTS[g.id]||[]).map(t).join(', ');ul.appendChild(c);
  r.querySelector('.note').textContent=t('Games do not report mistakes, so this recap shows progress and time only.');
  $('rc-x').onclick=function(){RECAP=null;renderRecap()};
}

/* ---- assignments ---- */
function assignCheck(silent){
  var ch=false,s=LASTS||snap();
  H.assign.forEach(function(a){if(a.done)return;var m=metOf(a.k);if(!m)return;if(m.f(s)-a.base>=a.n){a.done=Date.now();ch=true;if(!silent)toast(['as','hub','Assignment',a.title,'gold',null,0,false,a.title,'Assignment complete',0])}});
  return ch;
}
var _dc=dailyCheck;dailyCheck=function(silent){var c=_dc(silent);if(assignCheck(silent))c=true;return c};
function addAssign(o){
  if(!o||!o.id||!o.title||!metOf(o.k)||!(o.n>0))return 'That is not an assignment code.';
  if(H.assign.some(function(a){return a.id===o.id}))return 'Already added.';
  H.assign.push({id:String(o.id).slice(0,24),title:String(o.title).slice(0,80),k:o.k,n:+o.n,base:metOf(o.k).f(LASTS||snap()),done:0});saveH();return 'Assignment added.';
}
function renderAssign(){
  var box=$('assign');if(!H.assign.length){box.hidden=true;return}
  box.hidden=false;box.innerHTML='<h3 class="ph">Assignments</h3><ul class="al"></ul>';var ul=box.querySelector('ul'),s=LASTS||snap();
  H.assign.forEach(function(a){var m=metOf(a.k),got=a.done?a.n:Math.max(0,Math.min(a.n,m.f(s)-a.base)),li=document.createElement('li');
    li.innerHTML='<span class="at"></span><div class="bar"><i style="width:'+Math.round(got/a.n*100)+'%"></i></div><span class="ac"></span>';
    li.querySelector('.at').textContent=a.title;li.querySelector('.ac').textContent=a.done?t('done'):got+'/'+a.n;ul.appendChild(li)});
}

/* ---- skills ---- */
function renderSkills(){
  var b=$('skills');b.innerHTML='';
  GAMES.forEach(function(g){
    var mine=ALL.filter(function(a){return a[1]===g.id}),u=mine.filter(isUn).length,pct=Math.round(u/mine.length*100),row=document.createElement('div');row.className='sk';row.style.setProperty('--c',g.c);
    row.innerHTML='<div class="skh"><b></b><span class="skp"></span></div><div class="t"><i style="width:'+pct+'%"></i></div><div class="chs"></div>';
    row.querySelector('b').textContent=g.tag;row.querySelector('.skp').textContent=pct+'%';
    var cs=row.querySelector('.chs');(CONCEPTS[g.id]||[]).forEach(function(c){var s=document.createElement('span');s.textContent=c;cs.appendChild(s)});
    var url=CFG.lessons&&CFG.lessons[g.id];
    if(url){var el=/^https?:/.test(url)?document.createElement('a'):document.createElement('button');if(el.nodeName==='A'){el.href=url;el.target='_blank';el.rel='noopener'}else el.type='button';
      el.className='les';el.textContent='Open lesson';el.addEventListener('click',function(){emit('lesson',{game:g.id,lesson:url})});cs.appendChild(el)}
    b.appendChild(row)});
}


var SHORT={'port-halcyon':'Port Halcyon','pipeline-factory':'Pipeline','relay-7':'Relay 7','pathfinders-keep':'Keep','proof-lab':'Proof Lab','logic-engine':'Logic'};
/* ---- friends: compare and show off (codes are swapped by hand, nothing is uploaded) ---- */
function bitsHex(){var b='',i,h='';for(i=0;i<ALL.length;i++)b+=isUn(ALL[i])?'1':'0';while(b.length%4)b+='0';for(i=0;i<b.length;i+=4)h+=parseInt(b.substr(i,4),2).toString(16);return h}
function hexBits(h,n){var b='';for(var i=0;i<h.length;i++){var v=parseInt(h[i],16);b+=('000'+(isNaN(v)?0:v).toString(2)).slice(-4)}return b.slice(0,n)}
function friendCode(){
  var s={};GAMES.forEach(function(g){var m=ALL.filter(function(a){return a[1]===g.id});s[g.id]=[m.filter(isUn).length,m.length,H.secs[g.id]|0]});
  return 'HALCYONF1.'+b64e({n:H.name||'',r:rankIdx(points()),p:points(),t:ALL.filter(isUn).length,T:ALL.length,s:s,d:Object.keys(H.dd).length,b:bitsHex(),N:ALL.length,pin:H.pins.slice(0,3),ts:Date.now()});
}
function parseFriend(code){
  code=(code||'').trim();if(code.indexOf('HALCYONF1.')!==0)return null;
  try{var o=b64d(code.slice(10));if(!o||!o.s||typeof o.p!=='number')return null;
    var f={n:String(o.n||'').slice(0,20),r:Math.max(0,Math.min(RANKS.length-1,o.r|0)),p:o.p|0,t:o.t|0,T:o.T|0,d:o.d|0,N:o.N|0,b:String(o.b||'').replace(/[^0-9a-f]/gi,'').slice(0,64),pin:Array.isArray(o.pin)?o.pin.slice(0,3).map(String):[],ts:+o.ts||0,s:{}};
    GAMES.forEach(function(g){var e=o.s[g.id]||[0,1,0];f.s[g.id]=[e[0]|0,Math.max(1,e[1]|0),e[2]|0]});return f}catch(e){return null}
}
var fsel=null;
function friendList(){return H.friends||[]}
function renderFriends(){
    if(document.activeElement!==$('fcode'))$('fmine').value=friendCode();
  var ul=$('flist');ul.innerHTML='';var fl=friendList();
  if(!fl.length){var e=document.createElement('li');e.className='fe';e.textContent=t('No friends yet. Paste a friend code above.');ul.appendChild(e)}
  fl.forEach(function(f){
    var li=document.createElement('li');li.className='fi'+(fsel===f.id?' on':'');
    li.innerHTML='<button type="button" class="fb"><b></b><span></span></button><button type="button" class="fx" aria-label="Remove">×</button>';
    li.querySelector('b').textContent=f.o.n||t('Friend');li.querySelector('span').textContent=t(RANKS[f.o.r][0])+' · '+f.o.p+' '+t('pts');
    li.querySelector('.fb').onclick=function(){fsel=f.id;renderFriends()};
    li.querySelector('.fx').onclick=function(){H.friends=H.friends.filter(function(x){return x.id!==f.id});if(fsel===f.id)fsel=null;saveH();renderFriends()};
    ul.appendChild(li)});
  var f=fl.filter(function(x){return x.id===fsel})[0]||fl[0];if(f&&!fsel)fsel=f.id;
  renderCompare(f);trAll();
}
function renderCompare(f){
  var box=$('cmp');if(!f){box.hidden=true;return}box.hidden=false;var o=f.o,me={r:rankIdx(points()),p:points(),t:ALL.filter(isUn).length,d:Object.keys(H.dd).length,secs:totalSecs()},fsecs=0;
  GAMES.forEach(function(g){fsecs+=o.s[g.id][2]});
  var nm=dispName(),fn=o.n||t('Friend'),h='<h3 class="ph"></h3><div class="vs">';
  function row(label,a,b,cmpA,cmpB){var wa=cmpA>cmpB,wb=cmpB>cmpA;return '<div class="vsr"><span class="'+(wa?'win':'')+'">'+a+'</span><em>'+t(label)+'</em><span class="'+(wb?'win':'')+'">'+b+'</span></div>'}
  h+='<div class="vsr vh"><b></b><em></em><b></b></div>';
  h+=row('Rank',t(RANKS[me.r][0]),t(RANKS[o.r][0]),me.r,o.r)+row('Points',me.p,o.p,me.p,o.p)+row('Trophies',me.t+'/'+ALL.length,o.t+'/'+o.T,me.t,o.t)+row('Time played',fmtTime(me.secs),fmtTime(fsecs),me.secs,fsecs)+row('Daily challenges',me.d,o.d,me.d,o.d);
  var lead=0,trail=0;
  GAMES.forEach(function(g){var mine=ALL.filter(function(a){return a[1]===g.id}),mu=mine.filter(isUn).length,mp=mu/mine.length,fp=o.s[g.id][0]/o.s[g.id][1];if(mp>fp)lead++;else if(fp>mp)trail++;
    h+='<div class="dual" style="--c:'+g.c+'"><div class="db l"><i style="width:'+Math.round(mp*100)+'%"></i></div><span class="dn"></span><div class="db"><i style="width:'+Math.round(fp*100)+'%"></i></div></div>'});
  h+='</div><p class="verdict"></p><div class="diff"></div><canvas id="vsc" width="720" height="400" aria-label="Versus card"></canvas><div class="btns"><button type="button" class="btn" id="copyvs">Copy versus as text</button><span class="ok" id="ok9"></span></div>';
  box.innerHTML=h;
  box.querySelector('h3').textContent=t('Head to head')+' · '+nm+' vs '+fn;
  var vh=box.querySelectorAll('.vh b');vh[0].textContent=nm;vh[1].textContent=fn;
  var dn=box.querySelectorAll('.dn');GAMES.forEach(function(g,i){dn[i].textContent=SHORT[g.id]||g.name});
  box.querySelector('.verdict').textContent=lead>trail?(LANG==='es'?'Vas por delante en '+lead+' de '+GAMES.length+' juegos.':'You lead in '+lead+' of '+GAMES.length+' games.'):trail>lead?(LANG==='es'?fn+' va por delante en '+trail+' de '+GAMES.length+' juegos.':fn+' leads in '+trail+' of '+GAMES.length+' games.'):t('Dead even across the games.');
  var diff=box.querySelector('.diff');
  if(o.N===ALL.length&&o.b){var fb=hexBits(o.b,o.N),only1=[],only2=[];ALL.forEach(function(a,i){var m=isUn(a),th=fb[i]==='1';if(m&&!th)only1.push(a);else if(th&&!m)only2.push(a)});
    [[t('Only you have'),only1],[t('Only')+' '+fn+' '+t('has'),only2]].forEach(function(grp){var d=document.createElement('div');d.className='dg';var hh=document.createElement('b');hh.textContent=grp[0]+' ('+grp[1].length+')';d.appendChild(hh);
      var w=document.createElement('div');w.className='chs';grp[1].slice(0,14).forEach(function(a){var s=document.createElement('span');s.textContent=t(a[2]);w.appendChild(s)});if(grp[1].length>14){var s=document.createElement('span');s.textContent='+'+(grp[1].length-14);w.appendChild(s)}d.appendChild(w);diff.appendChild(d)})}
  else{diff.textContent=t('This friend uses a different version of the arcade, so only totals can be compared.')}
  drawVersus(f,nm,fn,me,fsecs);
  $('copyvs').onclick=function(){copyText(nm+' ('+t(RANKS[me.r][0])+', '+me.p+' '+t('pts')+', '+me.t+'/'+ALL.length+') vs '+fn+' ('+t(RANKS[o.r][0])+', '+o.p+' '+t('pts')+', '+o.t+'/'+o.T+') · Halcyon Arcade','ok9')};
}
function drawVersus(f,nm,fn,me,fsecs){
  var cv=$('vsc'),x=cv.getContext('2d'),W=cv.width,Hh=cv.height,o=f.o;
  var g=x.createLinearGradient(0,0,W,Hh);g.addColorStop(0,'#0c2227');g.addColorStop(1,'#071316');x.fillStyle=g;x.fillRect(0,0,W,Hh);
  drawFrame(x,W,Hh);
  x.fillStyle='#4fd1d9';x.font='500 15px "JetBrains Mono",monospace';x.textAlign='center';x.fillText('HALCYON ARCADE · HEAD TO HEAD',W/2,46);
  function side(cx,name,rank,pts,tro,tot,secs,win){x.textAlign='center';x.fillStyle=win?'#f0b34a':'#e6f2ef';x.font='800 48px "Big Shoulders Display",Impact,sans-serif';x.fillText(name.toUpperCase().slice(0,12),cx,118);
    x.fillStyle='#8fadb0';x.font='700 24px "Big Shoulders Display",Impact,sans-serif';x.fillText(rank.toUpperCase(),cx,150);
    x.fillStyle=win?'#f0b34a':'#e6f2ef';x.font='800 84px "Big Shoulders Display",Impact,sans-serif';x.fillText(String(pts),cx,236);
    x.fillStyle='#8fadb0';x.font='500 14px "JetBrains Mono",monospace';x.fillText('POINTS',cx,258);x.fillText(tro+'/'+tot+' TROPHIES',cx,290);x.fillText(fmtTime(secs).toUpperCase()+' PLAYED',cx,312)}
  side(W*.25,nm,t(RANKS[me.r][0]),me.p,me.t,ALL.length,me.secs||totalSecs(),me.p>o.p);
  side(W*.75,fn,t(RANKS[o.r][0]),o.p,o.t,o.T,fsecs,o.p>me.p);
  x.fillStyle='#f0b34a';x.font='800 40px "Big Shoulders Display",Impact,sans-serif';x.textAlign='center';x.fillText('VS',W/2,200);
  x.fillStyle='#21414a';x.fillRect(W/2-1,70,2,110);x.fillRect(W/2-1,220,2,90);
  x.fillStyle='#4d6468';x.font='500 12px "JetBrains Mono",monospace';x.fillText(new Date().toLocaleDateString(),W/2,Hh-28);
}
$('copyf').onclick=function(){$('fmine').value=friendCode();$('fmine').select();copyText($('fmine').value,'ok7')};
$('addfriend').onclick=function(){
  var f=parseFriend($('fcode').value);if(!f){flash('ok8','That is not a friend code.');return}
  H.friends=H.friends||[];var id=(f.n||'?').toLowerCase(),ex=H.friends.filter(function(x){return x.id===id})[0],msg='Friend added.';
  if(ex){ex.o=f;msg='Friend updated.'}else{if(H.friends.length>=12){flash('ok8','Friend list is full. Remove one first.');return}H.friends.push({id:id,o:f})}
  fsel=id;saveH();$('fcode').value='';flash('ok8',msg);renderFriends();
};

/* ---- safe mode, sound ---- */

/* ---- notes and glossary drawer (inside the game player) ---- */
var DEFS={
 'Contrast ratios':'How different the text color is from its background. Normal text needs at least 4.5:1, large text 3:1.',
 'Text alternatives':'Short text that says what an image shows, so screen readers can read it. Decorative images get an empty alt.',
 'Keyboard focus':'The element that receives key presses. It must be visible, follow a sensible order and never trap you.',
 'Target size':'Controls need room to be tapped or clicked. WCAG 2.2 asks for at least 24 by 24 CSS pixels.',
 'Pipeline stages':'A CPU splits each instruction into steps (fetch, decode, execute, memory, write-back) so several instructions overlap in time.',
 'Data hazards':'An instruction needs a result that an earlier one has not produced yet, so the pipeline may have to wait.',
 'Forwarding':'Sending a result straight from a later stage back to an earlier one, so the next instruction does not wait for write-back.',
 'CPI and IPC':'Cycles per instruction and its inverse, instructions per cycle. Stalls raise CPI and lower IPC.',
 'Ohm’s law':'Voltage equals current times resistance (V = I × R). Knowing two of the three gives you the third.',
 'Series and parallel':'In series the same current flows through each part and resistances add. In parallel the voltage is shared and currents add.',
 'Power and heat':'Power is voltage times current (P = V × I). More power means more heat to get rid of.',
 'Fuses':'A fuse melts when the current is too high, breaking the circuit to protect everything else.',
 'Dijkstra':'Finds the cheapest path by always expanding the unvisited node with the lowest cost so far.',
 'A* search':'Like Dijkstra, but adds a guess of the remaining cost (a heuristic), so it explores fewer nodes on the way to the goal.',
 'Heaps and queues':'A priority queue hands you the lowest-cost item next. A binary heap does this in logarithmic time.',
 'Caching':'Keeping a result so it is not computed twice. It costs memory and saves time.',
 'Propositional logic':'Statements that are true or false, joined with AND, OR, NOT and implies.',
 'Predicate logic':'Adds variables and quantifiers: for all (∀) and there exists (∃).',
 'Proof rules':'Valid steps, such as modus ponens: from P and P → Q you may conclude Q.',
 'Computation models':'Simple machines and programs, such as While programs, that define what can be computed.',
 'Conditionals':'if / else chooses which code runs based on a condition.',
 'Loops':'Repeat code while a condition holds, or once for each item in a list.',
 'Functions':'Named blocks of code that take inputs and return a result.',
 'Reading output':'Trace the code by hand, tracking each variable, to predict what it prints.'
};
Object.keys(DEFS).forEach(function(k){});
var drawerOn=false,dtab='g',noteT=null;
function renderDrawer(){
  var g=cur&&gameOf(cur);if(!g)return;
  $('drawer').style.setProperty('--c',g.c);
  var dg=$('dg');dg.innerHTML='';var dl=document.createElement('dl');
  (CONCEPTS[g.id]||[]).forEach(function(c){var dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=c;dd.textContent=DEFS[c]||'';dl.appendChild(dt);dl.appendChild(dd)});
  dg.appendChild(dl);
  if(document.activeElement!==$('notes'))$('notes').value=(H.notes||{})[cur]||'';
  $('dt-g').setAttribute('aria-pressed',dtab==='g');$('dt-n').setAttribute('aria-pressed',dtab==='n');$('dg').hidden=dtab!=='g';$('dn').hidden=dtab!=='n';
  trAll();
}
$('nb').onclick=function(){drawerOn=!drawerOn;$('drawer').hidden=!drawerOn;$('nb').setAttribute('aria-pressed',drawerOn);renderDrawer()};
$('dt-g').onclick=function(){dtab='g';renderDrawer()};$('dt-n').onclick=function(){dtab='n';renderDrawer();$('notes').focus()};
$('notes').addEventListener('input',function(){clearTimeout(noteT);var v=this.value,id=cur;noteT=setTimeout(function(){if(!id)return;H.notes=H.notes||{};if(v)H.notes[id]=v;else delete H.notes[id];saveH();flash('oknote','Saved')},400)});
var _ss=startSession;startSession=function(g){_ss(g);renderDrawer()};

/* ---- challenges (trust-based; nothing is uploaded) ---- */
function chalCheck(silent){
  var ch=false,s=LASTS||snap();
  (H.chal||[]).forEach(function(c){if(c.done)return;var m=metOf(c.k);if(!m)return;if(m.f(s)>=c.v){c.done=Date.now();ch=true;if(!silent)toast(['ch'+c.id,'hub','Challenge beaten',c.n+': '+c.v+' '+m.l,'gold',null,0,false,(c.n||t('Friend')),'Challenge beaten',0]);emit('challenge',{id:c.id,from:c.n,metric:c.k,target:c.v})}});
  return ch;
}
var _dc2=dailyCheck;dailyCheck=function(silent){var c=_dc2(silent);if(chalCheck(silent))c=true;return c};
function renderChal(){
  var ul=$('chl');ul.innerHTML='';var s=LASTS||snap(),list=H.chal||[];
  if(!list.length){var e=document.createElement('li');e.className='fe';e.textContent=t('No challenges yet.');ul.appendChild(e);return}
  list.forEach(function(c){var m=metOf(c.k);if(!m)return;var cur=Math.min(c.v,m.f(s)),li=document.createElement('li');
    li.innerHTML='<span class="at"></span><div class="bar"><i style="width:'+Math.round(cur/c.v*100)+'%"></i></div><span class="ac"></span>';
    li.querySelector('.at').textContent=(c.n||t('Friend'))+' · '+t(m.l)+' ≥ '+c.v;li.querySelector('.ac').textContent=c.done?t('done'):cur+'/'+c.v;ul.appendChild(li)});
}
(function(){MET.forEach(function(m){var o=document.createElement('option');o.value=m.k;o.textContent=m.l;$('cm').appendChild(o)});
  function pre(){var m=metOf($('cm').value);if(m)$('cv').value=Math.max(1,Math.round(m.f(LASTS||snap())))}pre();$('cm').addEventListener('change',pre);
  $('mkch').onclick=function(){var m=metOf($('cm').value),v=Math.max(1,parseInt($('cv').value,10)||1);
    $('chout').value='HALCYONC1.'+b64e({id:Math.random().toString(36).slice(2,8),n:H.name||'',k:m.k,v:v,ts:Date.now()});$('chout').select();copyText($('chout').value,'ok10')};
  $('addch').onclick=function(){var c=$('chin').value.trim(),msg='That is not a challenge code.';
    if(c.indexOf('HALCYONC1.')===0){try{var o=b64d(c.slice(10));if(o&&o.id&&metOf(o.k)&&o.v>0){H.chal=H.chal||[];
      if(H.chal.some(function(x){return x.id===o.id}))msg='Already added.';else if(H.chal.length>=20)msg='Challenge list is full. Clear finished ones first.';
      else{H.chal.push({id:String(o.id).slice(0,12),n:String(o.n||'').slice(0,20),k:o.k,v:Math.min(999999,o.v|0),done:0});saveH();msg='Challenge added.';$('chin').value='';evaluate(true);renderAll()}}}catch(e){}}
    flash('ok11',msg)};
  $('clrch').onclick=function(){H.chal=(H.chal||[]).filter(function(c){return !c.done});saveH();renderChal()};
})();
var _rf=renderFriends;renderFriends=function(){_rf();renderChal();trAll()};

