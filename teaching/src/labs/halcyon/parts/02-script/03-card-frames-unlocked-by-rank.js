/* ---- card frames unlocked by rank ---- */
var FRAMES=[['Brass','#f0b34a'],['Teal','#4fd1d9'],['Silver','#d7e2e6'],['Amber','#ffb347'],['Ember','#ff7a45'],['Commander','#f7d774']];
function frameIdx(){return Math.min(H.frame==null?0:H.frame|0,rankIdx(points()))}
function drawFrame(x,W,Hh){
  var i=frameIdx();x.save();x.strokeStyle=FRAMES[i][1];x.lineWidth=4;
  if(i===5){var g=x.createLinearGradient(0,0,W,Hh);g.addColorStop(0,'#f7d774');g.addColorStop(.5,'#fff3c4');g.addColorStop(1,'#f0b34a');x.strokeStyle=g;x.shadowColor='#f7d774';x.shadowBlur=14}
  if(i===3)x.setLineDash([12,7]);
  x.strokeRect(10,10,W-20,Hh-20);x.setLineDash([]);x.shadowBlur=0;
  if(i>=1&&i!==3){x.lineWidth=1.5;x.strokeRect(18,18,W-36,Hh-36)}
  if(i>=4){x.lineWidth=4;[[10,10,1,1],[W-10,10,-1,1],[10,Hh-10,1,-1],[W-10,Hh-10,-1,-1]].forEach(function(c){x.beginPath();x.moveTo(c[0],c[1]+c[3]*34);x.lineTo(c[0],c[1]);x.lineTo(c[0]+c[2]*34,c[1]);x.stroke()})}
  x.restore();
}
function drawChevrons(x,cx,cy,n){x.save();x.strokeStyle=FRAMES[frameIdx()][1];x.lineWidth=4;x.lineCap='round';x.lineJoin='round';for(var i=0;i<=n;i++){x.beginPath();x.moveTo(cx-18,cy+10-i*10);x.lineTo(cx,cy-i*10);x.lineTo(cx+18,cy+10-i*10);x.stroke()}x.restore()}
(function(){var _dcard=drawCard;drawCard=function(){_dcard();var cv=$('card'),x=cv.getContext('2d');drawChevrons(x,cv.width-70,92,rankIdx(points()))};
  var _rpf2=renderProfile;renderProfile=function(k){_rpf2(k);var sel=$('cframe');if(document.activeElement!==sel){var r=rankIdx(points());sel.innerHTML='';FRAMES.forEach(function(f,i){var o=document.createElement('option');o.value=i;o.disabled=i>r;o.textContent=t(f[0])+(i>r?' · '+t('unlocks at')+' '+t(RANKS[i][0]):'');sel.appendChild(o)});sel.value=frameIdx()}}})();
$('cframe').addEventListener('change',function(){H.frame=+this.value;saveH();drawCard()});

/* ---- notifications and host events ---- */
var LIS={};
function emit(ev,data){
  try{(LIS[ev]||[]).concat(LIS['*']||[]).forEach(function(f){try{f(ev,data)}catch(e){}})}catch(e){}
  try{if(window.parent&&window.parent!==window)window.parent.postMessage({source:'halcyon-arcade',event:ev,data:data},'*')}catch(e){}
}
function getState(){
  var r=recordHTML(),g={};GAMES.forEach(function(x){var m=ALL.filter(function(a){return a[1]===x.id});g[x.id]={plays:H.plays[x.id]|0,seconds:H.secs[x.id]|0,unlocked:m.filter(isUn).length,total:m.length}});
  return {profile:PFX?PFX.slice(3,-2):'',name:H.name||'',rank:RANKS[r.ri][0],points:r.p,trophies:{unlocked:ALL.filter(isUn).length,total:ALL.length},dailyDone:!!H.dd[dkey()],games:g,
    assignments:H.assign.map(function(a){return {id:a.id,title:a.title,done:!!a.done}})};
}
toast=function(a){
  var g=gameOf(a[1]),box=document.createElement('div'),pts=a[10]!=null?a[10]:TIER[a[4]].pts;box.className='toast';box.setAttribute('role','status');
  box.innerHTML=medal(a[4])+'<div><small></small><b></b><span></span></div>';
  box.querySelector('small').textContent=t(a[9]||'Trophy unlocked')+(pts?' · +'+pts+' '+t('pts'):'');
  box.querySelector('b').textContent=t(a[2]);box.querySelector('span').textContent=t(a[8]||'')||(g?g.name:t('Arcade'));
  chime();$('toasts').appendChild(box);setTimeout(function(){box.classList.add('out');setTimeout(function(){box.remove()},450)},5200);
  emit(a[0]==='d'?'daily':a[0]==='as'?'assignment':'trophy',{id:a[0],name:a[2],game:a[1],tier:a[4],points:pts});
};
showRank=function(ri){
  $('ru-e').innerHTML=emblem(ri);$('ru-n').textContent=t(RANKS[ri][0]);$('ru-p').textContent=points()+' '+t('points');$('rankup').hidden=false;chime(true);
  clearTimeout(showRank.t);showRank.t=setTimeout(function(){$('rankup').hidden=true},6000);emit('rank',{rank:RANKS[ri][0],points:points()});
};
function rankNext(r){return LANG==='es'?(r.nx?r.p+' pts · '+(r.nx[1]-r.p)+' para '+t(r.nx[0]):r.p+' pts · rango máximo'):(r.nx?r.p+' pts · '+(r.nx[1]-r.p)+' to '+r.nx[0]:r.p+' pts · top rank')}
var lastProg='';

/* ---- language ---- */
var TRK=[];
function trAll(){
  var root=document.body;
  document.documentElement.lang=LANG;
  if(LANG!=='es'){TRK.forEach(function(e){if(e.n.nodeValue===e.es)e.n.nodeValue=e.en});TRK=[];
    [].forEach.call(document.querySelectorAll('[data-en-placeholder],[data-en-aria-label]'),function(el){['placeholder','aria-label'].forEach(function(a){var v=el.getAttribute('data-en-'+a);if(v!==null)el.setAttribute(a,v)})});return}
  TRK=TRK.filter(function(e){return e.n.isConnected&&e.n.nodeValue===e.es});
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),n,list=[];while(n=w.nextNode())list.push(n);
  list.forEach(function(n){var p=n.parentNode;if(!p||/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)||(p.closest&&p.closest('svg')))return;
    var raw=n.nodeValue,k=raw.trim();if(!k)return;var v=ES[k];if(!v)return;n.nodeValue=raw.replace(k,v);TRK.push({n:n,en:raw,es:n.nodeValue})});
  [].forEach.call(document.querySelectorAll('[placeholder],[aria-label]'),function(el){['placeholder','aria-label'].forEach(function(a){var v=el.getAttribute(a);if(v===null)return;if(el.getAttribute('data-en-'+a)===null)el.setAttribute('data-en-'+a,v);var en=el.getAttribute('data-en-'+a);if(ES[en])el.setAttribute(a,ES[en])})});
}
function setLang(l){LANG=l;tset('halcyon-lang',l);applyPrefs();renderAll();if(!$('v-trophies').hidden)renderTrophies();if(!$('v-stats').hidden)renderStats();if(!$('v-profile').hidden)renderProfile();trAll()}
applyPrefs=function(){
  var r=document.documentElement;if(theme==='auto')r.removeAttribute('data-theme');else r.setAttribute('data-theme',theme);
  if(motion==='off')r.setAttribute('data-motion','off');else r.removeAttribute('data-motion');
  $('t-theme').textContent=t('Theme')+': '+t(theme);$('t-motion').textContent=t('Motion')+': '+t(motion);$('t-motion').setAttribute('aria-pressed',motion==='off');
  $('t-sound').textContent=t('Sound')+': '+t(H.mute?'off':'on');$('t-sound').setAttribute('aria-pressed',!!H.mute);$('t-lang').textContent=t('Language')+': '+LANG.toUpperCase();
};
$('t-lang').onclick=function(){setLang(LANG==='es'?'en':'es')};
flash=function(id,m){var e=$(id),x=m;if(LANG==='es'){var q=/^Restored (\d+) saved items\.$/.exec(m);x=q?'Restaurados '+q[1]+' elementos guardados.':t(m)}e.textContent=x;setTimeout(function(){e.textContent=''},3500)};

/* ---- wrap renderers: recap, assignments, skills, safe mode, translation, progress events ---- */
var _ra=renderAll;renderAll=function(){_ra();renderRecap();renderAssign();trAll();
  var s=JSON.stringify(getState());if(s!==lastProg){lastProg=s;emit('progress',getState())}};
var _rf0=renderAll;renderAll=function(){_rf0();if(!$('v-friends').hidden)renderFriends()};
var _rt=renderTrophies;renderTrophies=function(){_rt();trAll()};
var _rs=renderStats;renderStats=function(){_rs();renderSkills();trAll()};
var _rpf=renderProfile;renderProfile=function(k){_rpf(k);trAll()};
var _rcd=renderCards;renderCards=function(){_rcd();trAll()};

/* ---- host configuration ---- */
var TOKS=['bg','panel','panel2','line','fg','muted','accent','accent-ink','teal'];
function setEmbed(on){CFG.embed=on;document.documentElement.classList.toggle('embed',on)}
function configure(c){
  if(!c||typeof c!=='object')return;
  if(c.ns!==undefined)setNS(String(c.ns).replace(/[^\w.-]/g,'').slice(0,40));
  if(c.name!==undefined&&c.name!==null){H.name=String(c.name).slice(0,20);saveH()}
  if(c.embed!==undefined)setEmbed(!!c.embed);
  if(c.lessons&&typeof c.lessons==='object')CFG.lessons=c.lessons;
  if(c.theme==='light'||c.theme==='dark'||c.theme==='auto'){theme=c.theme;applyPrefs()}
  var tk=c.tokens;if(tk&&typeof tk==='object')TOKS.forEach(function(k){if(typeof tk[k]==='string'&&/^[#\w(),.% -]{1,40}$/.test(tk[k]))document.documentElement.style.setProperty('--'+k,tk[k])});
  if(Array.isArray(c.assignments))c.assignments.forEach(function(a){if(a)addAssign({id:a.id,title:a.title,k:a.metric,n:a.goal})});
  if(c.lang==='en'||c.lang==='es'){setLang(c.lang)}else{evaluate(true);renderAll()}
}
window.HalcyonArcade={configure:configure,getState:getState,on:function(ev,f){(LIS[ev]=LIS[ev]||[]).push(f)},off:function(ev,f){LIS[ev]=(LIS[ev]||[]).filter(function(x){return x!==f})},metrics:MET.map(function(m){return m.k})};
window.addEventListener('message',function(e){if(e.source!==window.parent||!e.data||typeof e.data!=='object')return;
  if(e.data.type==='halcyon:config')configure(e.data.config||{});else if(e.data.type==='halcyon:getState')emit('state',getState())});
if(/[?&]embed=1/.test(location.search))setEmbed(true);

/* ---- accessibility ---- */
$('skip').onclick=function(){var m=$('hub');if(!m.hidden){m.focus({preventScroll:false})}};
window.addEventListener('hashchange',function(){if(!cur&&!$('hub').hidden)setTimeout(function(){$('hub').focus({preventScroll:true})},0)});
applyPrefs();trAll();

Object.assign(ES,{"This week": "Esta semana", "Games played": "Juegos jugados", "Minutes": "Minutos", "Streak": "Racha", "day": "día", "days": "días", "freeze ready": "congelación lista", "freeze used this week": "congelación usada esta semana", "saved": "salvados", "You played today. Nice.": "Hoy has jugado. ¡Bien!", "Play today to keep your streak.": "Juega hoy para mantener tu racha.", "Play a game to start a streak.": "Juega un juego para empezar una racha.", "Change your goals in Profile.": "Cambia tus objetivos en Perfil.", "Bookmarks": "Marcadores", "Bookmark your place in a game from the player (Alt+B) and jump back here.": "Marca tu punto en un juego desde el reproductor (Alt+B) y vuelve aquí.", "Open": "Abrir", "Remove": "Quitar", "last": "última vez", "Last played": "Última partida", "Pick up where you left off.": "Retoma donde lo dejaste.", "Closest trophy": "Trofeo más cercano", "Back up your progress": "Haz una copia de tu progreso", "Your progress lives only in this browser. Copy your save code and keep it somewhere safe.": "Tu progreso vive solo en este navegador. Copia tu código de guardado y guárdalo en un lugar seguro.", "Go to backup": "Ir a la copia", "Later": "Luego", "Tip": "Consejo", "Bookmark this page or add it to your home screen. Your progress is saved on this device, in this browser.": "Guarda esta página en marcadores o añádela a tu pantalla de inicio. Tu progreso se guarda en este dispositivo, en este navegador.", "Got it": "Entendido", "Last 12 weeks": "Últimas 12 semanas", "Minutes played per week and trophies earned over time": "Minutos jugados por semana y trofeos ganados en el tiempo", "Bars: minutes per week. Line: trophies earned so far.": "Barras: minutos por semana. Línea: trofeos ganados hasta ahora.", "Concept map": "Mapa de conceptos", "of": "de", "concepts touched. A concept counts once you have opened the game that covers it.": "conceptos tocados. Un concepto cuenta cuando abres el juego que lo cubre.", "PROGRESS REPORT": "INFORME DE PROGRESO", "Progress report": "Informe de progreso", "Settings": "Ajustes", "Text size": "Tamaño de texto", "Normal": "Normal", "Large": "Grande", "Extra large": "Muy grande", "Contrast": "Contraste", "High contrast": "Alto contraste", "Weekly goal: games": "Objetivo semanal: juegos", "Weekly goal: minutes": "Objetivo semanal: minutos", "Backup reminder": "Recordatorio de copia", "Off": "Desactivado", "Every 2 weeks": "Cada 2 semanas", "Every 4 weeks": "Cada 4 semanas", "Every 2 months": "Cada 2 meses", "Last backup": "Última copia", "never": "nunca", "Progress is saved on this device, in this browser only. Use the save code to move or back it up.": "El progreso se guarda solo en este dispositivo y navegador. Usa el código de guardado para moverlo o respaldarlo.", "Copy as image": "Copiar como imagen", "Copy as text": "Copiar como texto", "Press and hold or right-click the image to save it": "Mantén pulsada o haz clic derecho en la imagen para guardarla", "Marks": "Marcas", "Add bookmark": "Añadir marcador", "Bookmark limit reached (12)": "Límite de marcadores alcanzado (12)", "Switch to your previous game": "Cambiar a tu juego anterior", "Keyboard shortcuts": "Atajos de teclado", "Open a game from the home screen": "Abrir un juego desde la pantalla de inicio", "Show or hide this list": "Mostrar u ocultar esta lista", "Close this list or the side panel": "Cerrar esta lista o el panel lateral", "Back to the hub": "Volver al hub", "Notes while playing": "Notas mientras juegas", "Glossary while playing": "Glosario mientras juegas", "Bookmark your place": "Marca tu punto", "Close": "Cerrar", "Where are you? e.g. Level 5, chamber 3": "¿Dónde estás? p. ej. Nivel 5, cámara 3", "Bookmark label": "Etiqueta del marcador"});
/* ============ phase 3: habits, goals, bookmarks, reports, accessibility, shortcuts ============ */
function h(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function dk2(d){return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function noon(d){var x=new Date(d||Date.now());x.setHours(12,0,0,0);return x}
function ens(){
  if(!H.bm)H.bm=[];if(!H.lastAt)H.lastAt={};if(!H.goal)H.goal={g:3,m:30};if(H.bkint==null)H.bkint=28;if(!H.since)H.since=Date.now();
}
ens();var _ih=initH;initH=function(){_ih();ens()};
function played(d){var k=dk2(d);return !!((H.days[k]&&H.days[k].length)||H.dsecs[k])}
function wkId(d){var x=noon(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return dk2(x)}
/* day streak; one missed day per calendar week is bridged by a "freeze" */
function streakInfo(){
  var d=noon(),n=0,used={},fz=0,today=played(d);
  if(!today)d.setDate(d.getDate()-1);
  for(var i=0;i<400;i++){
    if(played(d))n++;
    else{var w=wkId(d),p=new Date(d);p.setDate(p.getDate()-1);
      if(n>0&&!used[w]&&played(p)){used[w]=1;fz++}else break}
    d.setDate(d.getDate()-1)}
  return {n:n,frozen:fz,ready:!used[wkId(noon())],today:today};
}
function weekStats(){
  var s=noon();s.setDate(s.getDate()-((s.getDay()+6)%7));var g={},secs=0;
  for(var i=0;i<7;i++){var d=new Date(s);d.setDate(s.getDate()+i);var k=dk2(d);(H.days[k]||[]).forEach(function(x){g[x]=1});secs+=H.dsecs[k]|0}
  return {g:Object.keys(g).length,m:Math.floor(secs/60)};
}
function ago(ts){
  var d=Math.round((noon()-noon(ts))/864e5);
  if(LANG==='es')return d<=0?'hoy':d===1?'ayer':'hace '+d+' días';
  return d<=0?'today':d===1?'yesterday':d+' days ago';
}
function ring(v,goal,label,txt){
  var C=2*Math.PI*26,f=Math.min(1,goal?v/goal:0),box=h('div','ring'+(f>=1?' full':''));
  box.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--line)" stroke-width="6"/><circle cx="32" cy="32" r="26" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+(C*f).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 32 32)"/></svg>';
  var s=h('div','rt');s.appendChild(h('b','',txt));s.appendChild(h('span','',label));box.appendChild(s);
  box.setAttribute('role','img');box.setAttribute('aria-label',label+' '+txt);return box;
}
function renderWk(){
  var p=$('wk');if(!p)return;ens();var s=streakInfo(),w=weekStats(),G=H.goal;p.innerHTML='';
  p.appendChild(h('h3','ph',t('This week')));
  var row=h('div','rings');row.appendChild(ring(w.g,G.g,t('Games played'),w.g+'/'+G.g));row.appendChild(ring(w.m,G.m,t('Minutes'),w.m+'/'+G.m));
  var st=h('div','stk');st.appendChild(h('b','',s.n+' '+t(s.n===1?'day':'days')));
  st.appendChild(h('span','',t('Streak')+' · '+t(s.ready?'freeze ready':'freeze used this week')+(s.frozen?' · '+s.frozen+' '+t('saved'):'')));row.appendChild(st);
  p.appendChild(row);
  var n=h('p','note',t(s.today?'You played today. Nice.':(s.n?'Play today to keep your streak.':'Play a game to start a streak.'))+' '+t('Change your goals in Profile.'));p.appendChild(n);
}
/* bookmarks: a labelled spot in a game, listed on the home screen */
function renderBmk(){
  var p=$('bmk');if(!p)return;ens();p.innerHTML='';p.appendChild(h('h3','ph',t('Bookmarks')));
  if(!H.bm.length){p.appendChild(h('p','note',t('Bookmark your place in a game from the player (Alt+B) and jump back here.')));return}
  var ul=h('ul','bml');
  H.bm.forEach(function(b,i){var g=gameOf(b.id);if(!g)return;var li=h('li');li.style.setProperty('--c',g.c);
    var d=h('div');d.appendChild(h('b','',b.l));d.appendChild(h('span','',(SHORT[g.id]||g.name)+' · '+ago(b.t)));li.appendChild(d);
    var go=h('button','btn',t('Open'));go.type='button';go.onclick=function(){location.hash=g.id};
    var rm=h('button','btn danger',t('Remove'));rm.type='button';rm.onclick=function(){H.bm.splice(i,1);saveH();renderBmk();renderDrawer()};
    li.appendChild(go);li.appendChild(rm);ul.appendChild(li)});
  p.appendChild(ul);
}
/* resume line on cards, smarter "try next" */
var _rc3=renderCards;renderCards=function(){_rc3();ens();GAMES.forEach(function(x){var s2=$('card-'+x.id).querySelector('.s2'),ts=H.lastAt[x.id];if(ts&&H.plays[x.id])s2.textContent+=' · '+t('last')+' '+ago(ts)})};
var _rd3=renderDeck;renderDeck=function(){
  _rd3();ens();var d=$('deck').children,last=H.last&&gameOf(H.last);
  if(last&&H.lastAt[H.last])d[1].querySelector('p').textContent=t('Last played')+' '+ago(H.lastAt[H.last])+'. '+t('Pick up where you left off.');
  var best=null;ALL.forEach(function(a){if(isUn(a)||!gameOf(a[1])||a[7]===true||a[7]===1)return;var v=+VALS[a[0]]||0,g=+a[6];if(!(g>0)||v<=0)return;var r=Math.min(.99,v/g);if(!best||r>best.r)best={a:a,r:r,v:v,g:g}});
  if(best&&best.r>=.3){var gm=gameOf(best.a[1]);d[2].querySelector('small').textContent=t('Closest trophy');d[2].querySelector('b').textContent=gm.name;
    d[2].querySelector('p').textContent='“'+t(best.a[2])+'” · '+Math.floor(best.v)+(LANG==='es'?' de ':' of ')+best.g;
    d[2].querySelector('button').onclick=function(){location.hash=gm.id}}
};
/* backup reminder and first-run tip */
function renderBanners(){
  var b=$('bkb'),tp=$('tipb');if(!b)return;ens();
  var ref=H.bk||H.since,need=H.bkint>0&&points()>=10&&Date.now()-ref>H.bkint*864e5&&!(H.snz>Date.now());
  b.hidden=!need;
  if(need){b.innerHTML='';b.appendChild(h('div','bt',t('Back up your progress')));b.appendChild(h('p','note',t('Your progress lives only in this browser. Copy your save code and keep it somewhere safe.')));
    var r=h('div','btns'),go=h('button','btn',t('Go to backup'));go.type='button';go.onclick=function(){location.hash='profile'};
    var l=h('button','btn danger',t('Later'));l.type='button';l.onclick=function(){H.snz=Date.now()+3*864e5;saveH();renderBanners()};r.appendChild(go);r.appendChild(l);b.appendChild(r)}
  tp.hidden=!!H.tip||CFG.embed;
  if(!tp.hidden&&!tp.firstChild){tp.appendChild(h('div','bt',t('Tip')));tp.appendChild(h('p','note',t('Bookmark this page or add it to your home screen. Your progress is saved on this device, in this browser.')));
    var o=h('button','btn danger',t('Got it'));o.type='button';o.onclick=function(){H.tip=1;saveH();tp.hidden=true};tp.appendChild(o)}
}
/* stats: timeline and concept map */
function renderTimeline(){
  var p=$('tl');if(!p)return;p.innerHTML='';p.appendChild(h('h3','ph',t('Last 12 weeks')));
  var mon=noon();mon.setDate(mon.getDate()-((mon.getDay()+6)%7));var W=[],mx=1,tr=[];
  var un=Object.keys(H.un).map(function(k){return H.un[k]}).filter(function(v){return v>1e12});
  for(var i=11;i>=0;i--){var s=new Date(mon);s.setDate(mon.getDate()-7*i);var e=new Date(s);e.setDate(s.getDate()+7);var sec=0;
    for(var j=0;j<7;j++){var d=new Date(s);d.setDate(s.getDate()+j);sec+=H.dsecs[dk2(d)]|0}
    var m=Math.round(sec/60);mx=Math.max(mx,m);W.push({s:s,m:m,c:un.filter(function(v){return v<e.getTime()}).length})}
  var tmax=Math.max(1,W[11].c),svg='<svg viewBox="0 0 600 170" role="img" aria-label="'+t('Minutes played per week and trophies earned over time')+'" style="width:100%;height:auto">';
  W.forEach(function(w,i){var bh=Math.round(w.m/mx*110),x=12+i*48;svg+='<rect x="'+x+'" y="'+(130-bh)+'" width="30" height="'+bh+'" rx="2" fill="var(--accent)" opacity=".85"><title>'+w.m+' min</title></rect>'});
  var pts=W.map(function(w,i){return (27+i*48)+','+(130-Math.round(w.c/tmax*110))}).join(' ');
  svg+='<polyline points="'+pts+'" fill="none" stroke="var(--teal)" stroke-width="3" stroke-linejoin="round"/>';
  W.forEach(function(w,i){var x=27+i*48;svg+='<circle cx="'+x+'" cy="'+(130-Math.round(w.c/tmax*110))+'" r="3.5" fill="var(--teal)"/>';if(i%3===0)svg+='<text x="'+x+'" y="152" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="monospace">'+(w.s.getDate()+'/'+(w.s.getMonth()+1))+'</text>'});
  p.insertAdjacentHTML('beforeend',svg+'</svg>');
  p.appendChild(h('p','legend2',t('Bars: minutes per week. Line: trophies earned so far.')));
}
function renderCmap(){
  var p=$('cmap');if(!p)return;p.innerHTML='';p.appendChild(h('h3','ph',t('Concept map')));var tot=0,on=0;
  GAMES.forEach(function(g){(CONCEPTS[g.id]||[]).forEach(function(){tot++;if(H.plays[g.id])on++})});
  p.appendChild(h('p','note',on+' '+t('of')+' '+tot+' '+t('concepts touched. A concept counts once you have opened the game that covers it.')));
  GAMES.forEach(function(g){var r=h('div','cm');r.style.setProperty('--c',g.c);r.appendChild(h('b','',SHORT[g.id]||g.name));var cs=h('div','chs');
    (CONCEPTS[g.id]||[]).forEach(function(c){var s=h('span',H.plays[g.id]?'on':'',t(c));cs.appendChild(s)});r.appendChild(cs);p.appendChild(r)});
}
var _rs3=renderStats;renderStats=function(){_rs3();renderTimeline();renderCmap();trAll()};
/* progress report image */
function repLines(){var r=recordHTML(),s=streakInfo();return {name:dispName(),rank:t(RANKS[r.ri][0]),pts:r.p,tro:ALL.filter(isUn).length,tot:ALL.length,secs:totalSecs(),streak:s.n}}
function drawReport(){
  var c=$('rep-c');if(!c)return;var x=c.getContext('2d'),W=c.width,Hh=c.height,cs=getComputedStyle(document.documentElement),V=function(k,f){return (cs.getPropertyValue(k)||'').trim()||f};
  var bg=V('--panel','#111'),fg=V('--fg','#eee'),mu=V('--muted','#999'),ac=V('--accent','#f0b34a'),ln=V('--line','#333');
  x.fillStyle=bg;x.fillRect(0,0,W,Hh);drawFrame(x,W,Hh);var o=repLines();
  x.fillStyle=mu;x.font='600 13px monospace';x.fillText('HALCYON ARCADE · '+t('PROGRESS REPORT').toUpperCase(),36,46);
  x.fillStyle=fg;x.font='800 38px sans-serif';x.fillText(o.name,36,92);
  x.fillStyle=ac;x.font='700 20px sans-serif';x.fillText(o.rank+' · '+o.pts+' '+t('pts'),36,124);
  x.fillStyle=mu;x.font='500 15px sans-serif';x.fillText(o.tro+'/'+o.tot+' '+t('trophies')+' · '+fmtTime(o.secs)+' · '+t('Streak')+' '+o.streak+' '+t(o.streak===1?'day':'days'),36,152);
  GAMES.forEach(function(g,i){var y=190+i*34,m=ALL.filter(function(a){return a[1]===g.id}),u=m.filter(isUn).length,f=u/m.length;
    x.fillStyle=fg;x.font='600 14px sans-serif';x.fillText(SHORT[g.id]||g.name,36,y+12);
    x.fillStyle=ln;x.fillRect(190,y,360,14);x.fillStyle=g.c;x.fillRect(190,y,Math.round(360*f),14);
    x.fillStyle=mu;x.font='500 13px monospace';x.fillText(u+'/'+m.length+' · '+fmtTime(H.secs[g.id]|0),566,y+12)});
  x.fillStyle=mu;x.font='500 12px monospace';x.fillText(new Date().toLocaleDateString(),36,Hh-22);
}
function reportText(){var o=repLines(),L=['Halcyon Arcade · '+t('Progress report'),o.name+' · '+o.rank+' · '+o.pts+' '+t('pts'),o.tro+'/'+o.tot+' '+t('trophies')+' · '+fmtTime(o.secs)+' · '+t('Streak')+' '+o.streak];
  GAMES.forEach(function(g){var m=ALL.filter(function(a){return a[1]===g.id});L.push((SHORT[g.id]||g.name)+': '+m.filter(isUn).length+'/'+m.length+' · '+fmtTime(H.secs[g.id]|0))});return L.join('\n')}
/* settings: goals, backup, reading comfort */
var TEXTS=['normal','large','xl'],CONS=['normal','high'];
function applyComfort(){var r=document.documentElement,tx=tget('halcyon-text')||'normal',cn=tget('halcyon-contrast')||(window.matchMedia&&matchMedia('(prefers-contrast: more)').matches?'high':'normal');
  if(tx==='normal')r.removeAttribute('data-text');else r.setAttribute('data-text',tx);if(cn==='normal')r.removeAttribute('data-contrast');else r.setAttribute('data-contrast',cn)}
applyComfort();
function mkSel(id,opts,get,set){var s=$(id);if(!s||s.children.length)return;opts.forEach(function(o){var e=h('option','',o[1]);e.value=o[0];s.appendChild(e)});s.onchange=function(){set(s.value);renderSet();trAll()}}
function setOpts(){
  mkSel('s-text',[['normal','Normal'],['large','Large'],['xl','Extra large']],0,function(v){tset('halcyon-text',v);applyComfort()});
  mkSel('s-con',[['normal','Normal'],['high','High contrast']],0,function(v){tset('halcyon-contrast',v);applyComfort()});
  mkSel('s-gg',[1,2,3,4,5,6].map(function(n){return [''+n,''+n]}),0,function(v){H.goal.g=+v;saveH();renderWk()});
  mkSel('s-gm',[15,30,60,120,180].map(function(n){return [''+n,n+' min']}),0,function(v){H.goal.m=+v;saveH();renderWk()});
  mkSel('s-bk',[['0','Off'],['14','Every 2 weeks'],['28','Every 4 weeks'],['60','Every 2 months']],0,function(v){H.bkint=+v;saveH();renderBanners()});
}
function renderSet(){
  if(!$('s-text'))return;ens();setOpts();
  $('s-text').value=tget('halcyon-text')||'normal';$('s-con').value=tget('halcyon-contrast')||(document.documentElement.getAttribute('data-contrast')||'normal');
  $('s-gg').value=''+H.goal.g;$('s-gm').value=''+H.goal.m;$('s-bk').value=''+H.bkint;
  $('lastbk').textContent=t('Last backup')+': '+(H.bk?ago(H.bk):t('never'));
  drawReport();
}
$('rep-img').onclick=function(){var c=$('rep-c');try{c.toBlob(function(b){try{navigator.clipboard.write([new ClipboardItem({'image/png':b})]).then(function(){flash('ok12','Copied')},function(){flash('ok12','Press and hold or right-click the image to save it')})}catch(e){flash('ok12','Press and hold or right-click the image to save it')}})}catch(e){flash('ok12','Press and hold or right-click the image to save it')}};
$('rep-txt').onclick=function(){copyText(reportText(),'ok12')};
$('copyexp').addEventListener('click',function(){H.bk=Date.now();saveH();renderBanners();renderSet()});
/* quick-switch between the last two games, bookmarks drawer tab */
var _ss3=startSession;startSession=function(g){ensH();_ss3(g);if(H.last&&H.last!==g.id){H.prev=H.last;H.lastAt[H.last]=Date.now()}H.lastAt[g.id]=Date.now();updQs()};
function ensH(){ens()}
function updQs(){var b=$('qs'),p=H.prev&&gameOf(H.prev);b.hidden=!p||p.id===cur;if(p)b.textContent='⇄ '+(SHORT[p.id]||p.name);b.title=t('Switch to your previous game')+' (Alt+Q)'}
$('qs').onclick=function(){if(H.prev&&gameOf(H.prev))location.hash=H.prev};
(function(){var tabs=document.querySelector('.dtabs'),bt=h('button','',t('Marks'));bt.type='button';bt.id='dt-b';bt.setAttribute('aria-pressed','false');tabs.appendChild(bt);
  var pane=h('div');pane.id='db';pane.hidden=true;
  pane.innerHTML='<label class="sr" for="bml">Bookmark label</label><input id="bml" type="text" maxlength="60" placeholder="Where are you? e.g. Level 5, chamber 3"><div class="btns"><button type="button" class="btn" id="bmadd">Add bookmark</button><span class="ok" id="okbm"></span></div><ul class="bml" id="bmlist"></ul>';
  $('dn').parentNode.appendChild(pane);
  bt.onclick=function(){dtab='b';renderDrawer();$('bml').focus()};
  $('bmadd').onclick=function(){var v=$('bml').value.trim();if(!v||!cur)return;ens();if(H.bm.length>=12){flash('okbm','Bookmark limit reached (12)');return}H.bm.unshift({id:cur,l:v,t:Date.now()});$('bml').value='';saveH();flash('okbm','Saved');renderDrawer();renderBmk()};
  $('bml').addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter')$('bmadd').click()});
})();
var _rd4=renderDrawer;renderDrawer=function(){_rd4();ens();var g=cur&&gameOf(cur);if(!g)return;
  $('db').hidden=dtab!=='b';$('dt-b').setAttribute('aria-pressed',dtab==='b');
  var ul=$('bmlist');ul.innerHTML='';H.bm.forEach(function(b,i){if(b.id!==cur)return;var li=h('li');li.appendChild(h('div','',b.l));var rm=h('button','btn danger',t('Remove'));rm.type='button';rm.onclick=function(){H.bm.splice(i,1);saveH();renderDrawer();renderBmk()};li.appendChild(rm);ul.appendChild(li)});
  $('nb').setAttribute('aria-expanded',drawerOn);trAll()};
function openDrawer(tab){drawerOn=true;$('drawer').hidden=false;$('nb').setAttribute('aria-pressed',true);dtab=tab;renderDrawer();var f={n:'notes',b:'bml'}[tab];if(f)$(f).focus()}
function closeDrawer(){drawerOn=false;$('drawer').hidden=true;$('nb').setAttribute('aria-pressed',false);$('nb').focus()}
/* keyboard shortcuts and cheat sheet */
var keys=h('div');keys.id='keys';keys.hidden=true;keys.setAttribute('role','dialog');keys.setAttribute('aria-modal','true');keys.setAttribute('aria-label','Keyboard shortcuts');document.body.appendChild(keys);
function showKeys(on){
  keys.hidden=!on;if(!on){return}
  keys.innerHTML='';var box=h('div','kbox');box.appendChild(h('h3','ph',t('Keyboard shortcuts')));
  [['1 – 6',t('Open a game from the home screen')],['?',t('Show or hide this list')],['Esc',t('Close this list or the side panel')],['Alt + H',t('Back to the hub')],['Alt + N',t('Notes while playing')],['Alt + G',t('Glossary while playing')],['Alt + B',t('Bookmark your place')],['Alt + Q',t('Switch to your previous game')]].forEach(function(r){var d=h('div','kr');d.appendChild(h('kbd','',r[0]));d.appendChild(h('span','',r[1]));box.appendChild(d)});
  var c=h('button','btn',t('Close'));c.type='button';c.onclick=function(){showKeys(false)};box.appendChild(c);keys.appendChild(box);c.focus();trAll();
}
keys.addEventListener('click',function(e){if(e.target===keys)showKeys(false)});
(function(){var b=h('button','','?');b.type='button';b.id='t-keys';b.setAttribute('aria-label','Keyboard shortcuts');b.title='Keyboard shortcuts';b.onclick=function(){showKeys(keys.hidden)};document.querySelector('.tools').appendChild(b)})();
function inField(e){var x=e.target;return !!x&&(/^(INPUT|TEXTAREA|SELECT)$/.test(x.nodeName)||x.isContentEditable)}
function hot2(e,fromFrame){
  if(e.altKey&&!e.ctrlKey&&!e.metaKey){
    if(!cur)return;var c=e.code;
    if(c==='KeyN'){e.preventDefault();openDrawer('n')}else if(c==='KeyG'){e.preventDefault();openDrawer('g')}else if(c==='KeyB'){e.preventDefault();openDrawer('b')}
    else if(c==='KeyQ'&&H.prev&&gameOf(H.prev)){e.preventDefault();location.hash=H.prev}
    return}
  if(e.key==='Escape'){if(!keys.hidden){showKeys(false);return}if(cur&&drawerOn&&!fromFrame)closeDrawer();return}
  if(e.ctrlKey||e.metaKey||e.altKey||inField(e)||cur||fromFrame)return;
  if(e.key==='?'){showKeys(keys.hidden)}else if(/^[1-6]$/.test(e.key)){var g=GAMES[+e.key-1];if(g)location.hash=g.id}
}
document.addEventListener('keydown',function(e){hot2(e,false)});
$('frame').addEventListener('load',function(){try{var W=this.contentWindow;W.addEventListener('keydown',function(e){hot2(e,true)})}catch(e){}});
/* hook everything into the render cycle */
var _ra3=renderAll;renderAll=function(){_ra3();if(!$('v-games').hidden){renderWk();renderBmk();renderBanners()}if(!$('v-profile').hidden)renderSet();trAll()};
var _rp3=renderProfile;renderProfile=function(k){_rp3(k);renderSet();trAll()};

Object.assign(ES,{'Master Key':'Llave maestra','Win your first full game by mastering a family of lessons.':'Gana tu primer juego completo al dominar una familia de lecciones.','Arcade Regular':'Habitual del arcade','Win 10 different full games.':'Gana 10 juegos completos distintos.','Full House':'Casa llena','Win 25 different full games.':'Gana 25 juegos completos distintos.'});
renderAll();trAll();
renderCards();evaluate(true);route();
