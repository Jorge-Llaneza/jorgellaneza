/* ============ rendering ============ */
var $=function(i){return document.getElementById(i)};
var filter='all';
function emblem(n){var s='<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">';for(var i=0;i<=n;i++)s+='<path d="M7 '+(24-i*4.2).toFixed(1)+' L16 '+(18-i*4.2).toFixed(1)+' L25 '+(24-i*4.2).toFixed(1)+'"/>';return s+'</svg>'}
function recordHTML(){
  var p=points(),ri=rankIdx(p),nx=RANKS[ri+1],lo=RANKS[ri][1],hi=nx?nx[1]:MAXPTS;
  return {p:p,ri:ri,nx:nx,pct:nx?Math.round((p-lo)/(hi-lo)*100):100};
}
function renderRecord(){
  var r=recordHTML(),un=ALL.filter(isUn).length,tried=0,secs=0;
  GAMES.forEach(function(g){if(H.plays[g.id])tried++;secs+=H.secs[g.id]|0});
  $('emblem').innerHTML=emblem(r.ri);$('rank-name').textContent=RANKS[r.ri][0];$('rank-bar').style.width=r.pct+'%';
  $('rank-next').textContent=rankNext(r);
  $('n-tro').textContent=un+'/'+ALL.length;$('n-played').textContent=tried+'/'+GAMES.length;$('n-time').textContent=fmtTime(secs);
  $('nav-count').textContent=un+'/'+ALL.length;
  $('rec2').innerHTML='<div class="rk"><div class="emblem">'+emblem(r.ri)+'</div><div><small>RANK</small><h3>'+RANKS[r.ri][0]+'</h3></div></div><div><div class="bar"><i style="width:'+r.pct+'%"></i></div><small style="font:500 12px var(--mono);color:var(--muted)">'+rankNext(r)+'</small></div><div class="nums"><div><b>'+un+'/'+ALL.length+'</b><span>Unlocked</span></div><div><b>'+r.p+'</b><span>Points</span></div><div><b>'+MAXPTS+'</b><span>Possible</span></div></div>';
}
function renderCards(){
  var g=$('grid');
  if(!g.children.length){
    GAMES.forEach(function(x){
      var b=document.createElement('button');b.type='button';b.className='card';b.id='card-'+x.id;b.style.setProperty('--c',x.c);
      b.innerHTML='<div class="art">'+x.art+'</div><div class="info"><div class="row"><span class="tag"></span><span class="nod"></span></div><h3></h3><p></p><div class="meter"><i></i></div><div class="stats"><span class="s1"></span><span class="s2"></span></div><span class="play">Play</span></div>';
      b.querySelector('.tag').textContent=x.tag;b.querySelector('.nod').textContent=x.nod;b.querySelector('h3').textContent=x.name;b.querySelector('p').textContent=x.desc;
      b.addEventListener('click',function(){location.hash=x.id});g.appendChild(b);
    });
  }
  GAMES.forEach(function(x){
    var mine=ALL.filter(function(a){return a[1]===x.id}),u=mine.filter(isUn).length,pl=H.plays[x.id]|0,b=$('card-'+x.id);
    b.querySelector('.meter i').style.width=Math.round(u/mine.length*100)+'%';
    b.querySelector('.s1').textContent=u+'/'+mine.length+' '+t('trophies');
    var s2=b.querySelector('.s2');s2.textContent=pl?(t('Played')+' '+pl+'× · '+fmtTime(H.secs[x.id])):'Not played yet';s2.className='s2'+(pl?'':' new');
    b.querySelector('.play').textContent=pl?'Continue':'Start';
  });
}
function renderTrophies(){
  var ch=$('chips');ch.innerHTML='';
  [['all','All']].concat(GAMES.map(function(g){return [g.id,g.name.replace('The Aperture Proof Lab','Proof Lab').replace('Code Translator & Logic Engine','Logic Engine')]})).concat([['hub','Arcade']]).forEach(function(f){
    var n=ALL.filter(function(a){return f[0]==='all'||a[1]===f[0]}),u=n.filter(isUn).length;
    var b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('aria-pressed',filter===f[0]);b.textContent=t(f[1])+' '+u+'/'+n.length;
    b.addEventListener('click',function(){filter=f[0];renderTrophies()});ch.appendChild(b)});
  var grid=$('tgrid');grid.innerHTML='';
  ALL.filter(function(a){return (filter==='all'||a[1]===filter)}).forEach(function(a){
    var un=isUn(a),g=gameOf(a[1]),secret=a[7]&&!un,v=Math.min(VALS[a[0]]||0,a[6]),pct=Math.round(v/a[6]*100);
    var d=document.createElement('div');d.className='tr'+(un?'':' lock');d.style.setProperty('--c',g?g.c:'var(--accent)');
    d.innerHTML=medal(a[4],!un)+'<div class="body"><h4></h4><p></p>'+(un?'':'<div class="bar"><i style="width:'+(secret?0:pct)+'%"></i></div>')+'<div class="meta"><b></b><span></span></div></div>';
    d.querySelector('h4').textContent=secret?'Secret trophy':a[2];
    d.querySelector('p').textContent=secret?'Keep playing to find out.':a[3];
    d.querySelector('b').textContent=(g?g.name:'Arcade')+(a[0][0]==='x'?' · '+t('In-game'):'');
    d.querySelector('.meta span').textContent=t(TIER[a[4]].n)+' · '+TIER[a[4]].pts+' '+t('pts')+(un?' · '+new Date(H.un[a[0]]).toLocaleDateString(LANG==='es'?'es-ES':undefined):(secret?'':' · '+v+'/'+a[6]));
    if(un){var pb=document.createElement('button');pb.type='button';pb.className='pin';var on=H.pins.indexOf(a[0])>-1;pb.setAttribute('aria-pressed',on);pb.textContent=on?'Pinned':'Pin';
      pb.addEventListener('click',function(){var k=H.pins.indexOf(a[0]);if(k>-1)H.pins.splice(k,1);else{if(H.pins.length>=3)H.pins.shift();H.pins.push(a[0])}saveH();renderTrophies()});d.appendChild(pb)}
    grid.appendChild(d)});
}
function renderAll(){renderRecord();renderCards();renderDeck();if(!$('v-trophies').hidden)renderTrophies();if(!$('v-stats').hidden)renderStats();if(!$('v-profile').hidden)renderProfile(true)}

/* ============ routing, player, time tracking ============ */
var cur=null;
function route(){
  var id=location.hash.slice(1),g=gameOf(id);
  if(g){
    if(cur!==g.id){cur=g.id;loadGame(g);startSession(g);emit('launch',{game:g.id});H.plays[g.id]=(H.plays[g.id]|0)+1;H.last=g.id;var nd=new Date(),hr=nd.getHours(),dk=nd.getFullYear()+'-'+(nd.getMonth()+1)+'-'+nd.getDate();if(hr<5)H.owl=1;if(hr>=5&&hr<8)H.early=1;if(nd.getDay()%6===0)H.wk=1;H.days[dk]=H.days[dk]||[];if(H.days[dk].indexOf(g.id)<0)H.days[dk].push(g.id);saveH();evaluate()}
    $('now').textContent=g.name;$('ext').href=g.file;$('ext').hidden=!!PFX||CFG.embed;$('player').style.setProperty('--c',g.c);$('player').classList.add('on');$('hub').hidden=true;document.querySelector('.top').hidden=true;setTitle(g.name+' · Halcyon Arcade');
    return;
  }
  endSession();cur=null;unloadGame();$('player').classList.remove('on');$('hub').hidden=false;document.querySelector('.top').hidden=false;setTitle('Halcyon Arcade');
  var v=['trophies','stats','friends','profile'].indexOf(id)>-1?id:'games';
  ['games','trophies','stats','friends','profile'].forEach(function(n){$('v-'+n).hidden=n!==v;$('nav-'+n).setAttribute('aria-current',n===v?'page':'false')});
  evaluate(true);renderAll();if(v==='trophies')renderTrophies();if(v==='stats')renderStats();if(v==='profile')renderProfile();if(v==='friends')renderFriends();window.scrollTo(0,0);
}
$('nav-games').onclick=function(){location.hash=''};
$('nav-trophies').onclick=function(){location.hash='trophies'};$('nav-stats').onclick=function(){location.hash='stats'};$('nav-profile').onclick=function(){location.hash='profile'};$('nav-friends').onclick=function(){location.hash='friends'};
$('back').onclick=function(){location.hash='';route()};
window.addEventListener('hashchange',route);
window.addEventListener('storage',function(){evaluate()});
setInterval(function(){
  if(cur&&!document.hidden){H.secs[cur]=(H.secs[cur]|0)+5;var dk=dkey();H.dsecs[dk]=(H.dsecs[dk]|0)+5;saveH()}
  evaluate();
},5000);
setInterval(function(){if(cur)evaluate()},1500);

/* ============ daily challenge ============ */
function dkey(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function dayHash(k){var h=0;for(var i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))>>>0;return h}
function totalSecs(){var t=0;GAMES.forEach(function(g){t+=H.secs[g.id]|0});return t}
var DAILY=[
 {t:'Process 5 ships in Port Halcyon',g:'port-halcyon',n:5,m:function(s){return s.ph.ships}},
 {t:'Cite 10 faults correctly in Port Halcyon',g:'port-halcyon',n:10,m:function(s){return s.ph.right}},
 {t:'Win a shift in Pipeline Factory',g:'pipeline-factory',n:1,m:function(s){return s.pf.wins}},
 {t:'Ship 30 instructions cleanly in Pipeline Factory',g:'pipeline-factory',n:30,m:function(s){return s.pf.shipped}},
 {t:'Earn 3 stars in Halcyon Relay 7',g:'relay-7',n:3,m:function(s){return s.hr.stars}},
 {t:'Complete a mission in Halcyon Relay 7',g:'relay-7',n:1,m:function(s){return s.hr.levels}},
 {t:'Win a map in Pathfinder’s Keep',g:'pathfinders-keep',n:1,m:function(s){return s.pk.wins}},
 {t:'Earn 50 shards in Pathfinder’s Keep',g:'pathfinders-keep',n:50,m:function(s){return s.pk.shards}},
 {t:'Unseal a new chamber in the Proof Lab',g:'proof-lab',n:1,m:function(s){return s.ap.unlocked}},
 {t:'Earn 100 points in the Proof Lab',g:'proof-lab',n:100,m:function(s){return s.ap.total}},
 {t:'Finish 3 lessons in Logic Engine',g:'logic-engine',n:3,m:function(s){return s.le.done}},
 {t:'Play any game for 10 minutes',g:null,n:10,m:function(){return totalSecs()/60}}
];
function todayCh(){return DAILY[dayHash(dkey())%DAILY.length]}
function dailyCheck(silent){
  var k=dkey(),c=todayCh(),ch=false,s=LASTS||snap();
  if(!H.daily||H.daily.k!==k){H.daily={k:k,base:c.m(s)};ch=true}
  var got=c.m(s)-H.daily.base;
  if(got>=c.n&&!H.dd[k]){H.dd[k]=1;ch=true;if(!silent)toast(['d','hub','Daily challenge',c.t,'gold',null,0,false,c.t,'Daily complete'])}
  return ch;
}
function renderDeck(){
  var c=todayCh(),k=dkey(),done=!!H.dd[k],s=LASTS||snap(),got=Math.max(0,Math.min(c.n,c.m(s)-(H.daily&&H.daily.k===k?H.daily.base:c.m(s)))),pct=done?100:Math.round(got/c.n*100);
  var last=H.last&&gameOf(H.last),next=null;
  GAMES.forEach(function(g){if(g.id===H.last)return;var u=ALL.filter(function(a){return a[1]===g.id}),r=u.filter(isUn).length/u.length,sc=(H.plays[g.id]?1:0)+r;if(!next||sc<next.sc)next={g:g,sc:sc}});
  var gl=c.g?gameOf(c.g):null;
  $('deck').innerHTML='<div class="dk'+(done?' done':'')+'"><small>Daily challenge · +50 pts</small><b></b><p></p><div class="bar"><i style="width:'+pct+'%"></i></div></div>'+
    '<div class="dk"><small>Continue</small><b></b><p></p><button type="button" class="btn" data-go=""></button></div>'+
    '<div class="dk"><small>Try next</small><b></b><p></p><button type="button" class="btn" data-go=""></button></div>';
  var d=$('deck').children;
  d[0].querySelector('b').textContent=done?'Complete':c.t;d[0].querySelector('p').textContent=done?'Today’s challenge is done. A new one arrives tomorrow.':(gl?(LANG==='es'?'Cuenta el progreso desde ahora en ':'Counts progress made from now in ')+gl.name+'. ':'')+Math.floor(got)+(LANG==='es'?' de ':' of ')+c.n+(LANG==='es'?' hasta ahora.':' so far.');
  d[1].querySelector('b').textContent=last?last.name:'Nothing yet';d[1].querySelector('p').textContent=last?'Pick up where you left off.':'Start with any game below.';
  var b1=d[1].querySelector('button');b1.textContent=last?'Resume':'Browse games';b1.onclick=function(){if(last)location.hash=last.id;else window.scrollTo(0,$('grid').offsetTop-80)};
  d[2].querySelector('b').textContent=next?next.g.name:'';d[2].querySelector('p').textContent=next?(H.plays[next.g.id]?'The game you have finished least.':'You have not tried this one yet.'):'';
  var b2=d[2].querySelector('button');b2.textContent='Play';b2.onclick=function(){if(next)location.hash=next.g.id};
}
/* ============ rank-up ============ */
function showRank(ri){
  $('ru-e').innerHTML=emblem(ri);$('ru-n').textContent=RANKS[ri][0];$('ru-p').textContent=points()+' points';$('rankup').hidden=false;chime(true);
  clearTimeout(showRank.t);showRank.t=setTimeout(function(){$('rankup').hidden=true},6000);
}
$('rankup').onclick=function(){$('rankup').hidden=true};
/* ============ sound ============ */
var AC=null;
function chime(big){
  if(H.mute)return;
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var t=AC.currentTime,n=big?[523,659,784,1047]:[784,1047];
    n.forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.11);g.gain.linearRampToValueAtTime(.09,t+i*.11+.02);g.gain.exponentialRampToValueAtTime(.0001,t+i*.11+.35);o.connect(g);g.connect(AC.destination);o.start(t+i*.11);o.stop(t+i*.11+.4)})}catch(e){}
}
/* ============ games finder ============ */
var fq='',fsort='default';
$('q').addEventListener('input',function(){fq=this.value.toLowerCase().trim();renderCards()});
$('sort').addEventListener('change',function(){fsort=this.value;renderCards()});
var _rc=renderCards;
renderCards=function(){
  _rc();var g=$('grid'),list=GAMES.slice();
  function frac(x){var u=ALL.filter(function(a){return a[1]===x.id});return u.filter(isUn).length/u.length}
  if(fsort==='played')list.sort(function(a,b){return (H.secs[b.id]|0)-(H.secs[a.id]|0)});
  else if(fsort==='left')list.sort(function(a,b){return frac(a)-frac(b)});
  else if(fsort==='name')list.sort(function(a,b){return a.name<b.name?-1:1});
  var shown=0;
  list.forEach(function(x){var el=$('card-'+x.id);g.appendChild(el);var hit=!fq||(x.name+' '+x.tag+' '+x.desc+' '+x.nod).toLowerCase().indexOf(fq)>-1;el.hidden=!hit;if(hit)shown++});
  $('none').hidden=shown>0;
};
/* ============ stats ============ */
function renderStats(){
  var max=Math.max.apply(null,GAMES.map(function(g){return H.secs[g.id]|0}).concat([60])),b=$('bars');b.innerHTML='';
  GAMES.forEach(function(g){var r=document.createElement('div');r.className='brow';r.style.setProperty('--c',g.c);var v=H.secs[g.id]|0;
    r.innerHTML='<span></span><div class="t"><i style="width:'+Math.round(v/max*100)+'%"></i></div><span></span>';r.children[0].textContent=g.name.replace('The Aperture Proof Lab','Proof Lab').replace('Code Translator & Logic Engine','Logic Engine');r.children[2].textContent=fmtTime(v)+' · '+(H.plays[g.id]|0)+'×';b.appendChild(r)});
  var un=ALL.filter(isUn).sort(function(a,c){return TIER[c[4]].pts-TIER[a[4]].pts||c[6]-a[6]}).slice(0,6),h=$('hard');h.innerHTML='';
  if(!un.length)h.innerHTML='<li><span>No trophies yet. Play a game to earn your first.</span></li>';
  un.forEach(function(a){var li=document.createElement('li');li.innerHTML=medal(a[4])+'<div><b></b><span></span></div>';li.querySelector('b').textContent=a[2];var g=gameOf(a[1]);li.querySelector('span').textContent=(g?g.name:t('Arcade'))+' · '+t(TIER[a[4]].n)+' · '+t(a[3]);h.appendChild(li)});
  var cal=$('cal');cal.innerHTML='';var now=new Date();now.setHours(12,0,0,0);var first=new Date(now.getTime()-83*864e5),off=(first.getDay()+6)%7,mx=1;
  for(var i=0;i<84;i++){var d=new Date(first.getTime()+i*864e5),k=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();mx=Math.max(mx,H.dsecs[k]|0)}
  for(var o=0;o<off;o++){var e=document.createElement('span');cal.appendChild(e)}
  for(var j=0;j<84;j++){var dd=new Date(first.getTime()+j*864e5),kk=dd.getFullYear()+'-'+(dd.getMonth()+1)+'-'+dd.getDate(),sec=H.dsecs[kk]|0,played=H.days[kk]&&H.days[kk].length,l=sec?Math.min(3,1+Math.floor(sec/mx*2.99)):(played?1:0);
    var c=document.createElement('i');c.style.setProperty('--l',l);c.title=dd.toLocaleDateString()+': '+(sec?fmtTime(sec):t('no play'));cal.appendChild(c)}
}
/* ============ profile and save code ============ */
var KEYP=['uxg.','pipelineFactory','hr7','pk-','apl-','logic-engine','halcyon-arcade'];
function allowed(k){return KEYP.some(function(p){return k.indexOf(p)===0})}
function exportCode(){var d={};lsKeys().forEach(function(k){if(allowed(k)){try{d[k]=localStorage.getItem(k)}catch(e){}}});
  try{return 'HALCYON1.'+btoa(unescape(encodeURIComponent(JSON.stringify({v:1,d:d}))))}catch(e){return ''}}
function importCode(code){
  code=(code||'').trim();if(code.indexOf('HALCYON1.')!==0)return 'That is not a Halcyon save code.';
  var o;try{o=JSON.parse(decodeURIComponent(escape(atob(code.slice(9)))))}catch(e){return 'The code is damaged. Copy it again in full.'}
  if(o&&o.v>1)return 'This code comes from a newer version of the arcade.';
  if(!o||o.v!==1||!o.d||typeof o.d!=='object')return 'The code is damaged. Copy it again in full.';
  var n=0;try{lsKeys().forEach(function(k){if(allowed(k))localStorage.removeItem(k)});
    Object.keys(o.d).forEach(function(k){if(allowed(k)&&typeof o.d[k]==='string'){localStorage.setItem(k,o.d[k]);n++}})}catch(e){return 'This browser blocked saving. Check your storage settings.'}
  H=jget(LSK)||{};H.un=H.un||{};H.days=H.days||{};H.dsecs=H.dsecs||{};H.dd=H.dd||{};H.pins=H.pins||[];H.plays=H.plays||{};H.secs=H.secs||{};
  evaluate(true);renderAll();return 'Restored '+n+' saved items.';
}
function flash(id,t){var e=$(id);e.textContent=t;setTimeout(function(){e.textContent=''},3500)}
function copyText(t,okid){
  function fb(){flash(okid,'Select the text and copy it')}
  try{navigator.clipboard.writeText(t).then(function(){flash(okid,'Copied')},fb)}catch(e){fb()}
}
function cardText(){
  var r=recordHTML(),un=ALL.filter(isUn).length,top=GAMES.slice().sort(function(a,b){return (H.secs[b.id]|0)-(H.secs[a.id]|0)})[0];
  var pins=H.pins.map(function(id){var a=ALL.filter(function(x){return x[0]===id})[0];return a?a[2]:''}).filter(Boolean);
  return dispName()+' · '+RANKS[r.ri][0]+' · '+r.p+' pts · '+un+'/'+ALL.length+' trophies'+(H.secs[top.id]?' · favorite: '+top.name:'')+(pins.length?' · pinned: '+pins.join(', '):'')+' · Halcyon Arcade';
}
function drawCard(){
  var cv=$('card'),x=cv.getContext('2d'),W=cv.width,Hh=cv.height,r=recordHTML(),un=ALL.filter(isUn).length;
  var g=x.createLinearGradient(0,0,W,Hh);g.addColorStop(0,'#0c2227');g.addColorStop(1,'#071316');x.fillStyle=g;x.fillRect(0,0,W,Hh);
  drawFrame(x,W,Hh);
  x.fillStyle='#4fd1d9';x.font='500 15px "JetBrains Mono",monospace';x.fillText('HALCYON ARCADE · INSPECTOR FILE',36,52);
  x.fillStyle='#e6f2ef';x.font='800 64px "Big Shoulders Display",Impact,sans-serif';x.fillText(dispName().toUpperCase(),36,122);
  x.fillStyle='#f0b34a';x.font='700 34px "Big Shoulders Display",Impact,sans-serif';x.fillText(t(RANKS[r.ri][0]).toUpperCase()+' · '+r.p+' '+t('pts').toUpperCase(),36,168);
  x.fillStyle='#8fadb0';x.font='500 15px "JetBrains Mono",monospace';x.fillText(un+'/'+ALL.length+' '+t('trophies')+' · '+fmtTime(totalSecs())+(LANG==='es'?' jugado':' played'),36,200);
  x.fillStyle='#21414a';x.fillRect(36,222,W-72,2);
  x.fillStyle='#8fadb0';x.fillText('PINNED TROPHIES',36,254);
  var pins=H.pins.map(function(id){return ALL.filter(function(a){return a[0]===id})[0]}).filter(Boolean),cols={bronze:'#d08a55',silver:'#b9c8ce',gold:'#f0c24d'};
  if(!pins.length){x.fillStyle='#8fadb0';x.font='500 16px "Hanken Grotesk",sans-serif';x.fillText('Pin trophies from the Trophies page.',36,296)}
  pins.forEach(function(a,i){var px=36+i*220;x.strokeStyle=cols[a[4]];x.lineWidth=3;x.beginPath();x.moveTo(px+20,272);x.lineTo(px+40,284);x.lineTo(px+40,308);x.lineTo(px+20,320);x.lineTo(px,308);x.lineTo(px,284);x.closePath();x.stroke();
    x.fillStyle='#e6f2ef';x.font='700 24px "Big Shoulders Display",Impact,sans-serif';x.fillText(a[2].toUpperCase().slice(0,16),px+52,300);x.fillStyle='#8fadb0';x.font='500 12px "JetBrains Mono",monospace';x.fillText(TIER[a[4]].n.toUpperCase(),px+52,318)});
  x.fillStyle='#4d6468';x.font='500 12px "JetBrains Mono",monospace';x.fillText(new Date().toLocaleDateString(),36,Hh-30);
}
function renderProfile(keepFocus){
  if(document.activeElement!==$('pname'))$('pname').value=H.name||'';
  drawCard();if(document.activeElement!==$('imp'))$('exp').value=exportCode();
}
$('pname').addEventListener('input',function(){H.name=this.value.slice(0,20);saveH();drawCard()});
$('copycard').onclick=function(){copyText(cardText(),'ok1')};
$('copyexp').onclick=function(){$('exp').value=exportCode();$('exp').select();copyText($('exp').value,'ok2')};
var armed=false;
$('doimp').onclick=function(){
  var b=$('doimp');
  if(!$('imp').value.trim()){flash('ok3','Paste a code first');return}
  if(!armed){armed=true;b.classList.add('arm');b.textContent='Click again to replace everything';setTimeout(function(){armed=false;b.classList.remove('arm');b.textContent='Restore progress'},5000);return}
  armed=false;b.classList.remove('arm');b.textContent='Restore progress';var m=importCode($('imp').value);flash('ok3',m);if(m.indexOf('Restored')===0){$('imp').value='';renderProfile()}
};
/* ============ theme, motion, sound, fullscreen, shortcut ============ */
function tget(k){try{return localStorage.getItem(k)}catch(e){return null}}function tset(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var theme=tget('halcyon-theme')||'auto',motion=tget('halcyon-motion')||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches?'off':'on');
function applyPrefs(){
  var r=document.documentElement;if(theme==='auto')r.removeAttribute('data-theme');else r.setAttribute('data-theme',theme);
  if(motion==='off')r.setAttribute('data-motion','off');else r.removeAttribute('data-motion');
  $('t-theme').textContent='Theme: '+theme;$('t-motion').textContent='Motion: '+motion;$('t-motion').setAttribute('aria-pressed',motion==='off');
  $('t-sound').textContent='Sound: '+(H.mute?'off':'on');$('t-sound').setAttribute('aria-pressed',!!H.mute);
}
$('t-theme').onclick=function(){theme={auto:'light',light:'dark',dark:'auto'}[theme];tset('halcyon-theme',theme);applyPrefs()};
$('t-motion').onclick=function(){motion=motion==='on'?'off':'on';tset('halcyon-motion',motion);applyPrefs()};
$('t-sound').onclick=function(){H.mute=!H.mute;saveH();applyPrefs();if(!H.mute)chime()};
$('fs').onclick=function(){var p=$('player');try{if(document.fullscreenElement)document.exitFullscreen();else p.requestFullscreen().catch(function(){$('fs').textContent='Not available'})}catch(e){}};
function hot(e){if(e.altKey&&(e.key==='h'||e.key==='H')&&cur){e.preventDefault();location.hash=''}}
document.addEventListener('keydown',hot);
var evT=null;function soon(){clearTimeout(evT);evT=setTimeout(function(){evaluate()},120)}
$('frame').addEventListener('load',function(){try{var W=this.contentWindow;W.addEventListener('keydown',hot);
  if(!W.__hubHooked){W.__hubHooked=1;var P=W.Storage.prototype,so=P.setItem,ro=P.removeItem;
    P.setItem=function(){var r=so.apply(this,arguments);soon();return r};P.removeItem=function(){var r=ro.apply(this,arguments);soon();return r}}}catch(e){}});
$('back').title='Back to hub (Alt+H)';
applyPrefs();

var ES={'Notes':'Notas','Glossary':'Glosario','Write what you learned…':'Escribe lo que has aprendido…','Saved':'Guardado','Card frame':'Marco de la tarjeta','unlocks at':'se desbloquea en','Brass':'Latón','Teal':'Turquesa','Silver':'Plata','Amber':'Ámbar','Ember':'Brasa','Commander':'Comandante','Challenges':'Retos','Challenge a friend to beat your number in one stat. Challenges run on trust: the games cannot check a friend’s score.':'Reta a un amigo a superar tu número en una estadística. Los retos funcionan por confianza: los juegos no pueden comprobar la puntuación de un amigo.','Stat':'Estadística','Number to beat':'Número a superar','Create challenge':'Crear reto','Challenge code':'Código de reto','Accept a challenge':'Aceptar un reto','Paste a challenge code here':'Pega aquí un código de reto','Accept challenge':'Aceptar reto','Clear finished':'Quitar terminados','No challenges yet.':'Aún no hay retos.','That is not a challenge code.':'Eso no es un código de reto.','Challenge added.':'Reto añadido.','Challenge list is full. Clear finished ones first.':'La lista de retos está llena. Quita primero los terminados.','Challenge beaten':'Reto superado','done':'hecho','This code comes from a newer version of the arcade.':'Este código viene de una versión más nueva de la sala.',
'Instructed I':'Instruido I','Instructed II':'Instruido II','Instructed III':'Instruido III','Survivor':'Superviviente','Veteran':'Veterano','Clean Sweep':'Barrida limpia','Triple Threat':'Triple amenaza','Boss Slayer (Lab)':'Mata jefes (Lab)','Grand Slam':'Gran slam','Flawless':'Impecable total','Daily Habit':'Hábito diario','Studious':'Estudioso','Tinkerer':'Manitas','Architect (Lab)':'Arquitecto (Lab)',
'Finish the Act I instruction.':'Termina la instrucción del Acto I.','Finish the Act II instruction.':'Termina la instrucción del Acto II.','Finish the Act III instruction.':'Termina la instrucción del Acto III.','Survive 10 tests in one run.':'Sobrevive a 10 pruebas en una partida.','Survive 25 tests in one run.':'Sobrevive a 25 pruebas en una partida.','10 clean solves in a row.':'10 resoluciones limpias seguidas.','Solve a chamber in every act.':'Resuelve una cámara en cada acto.','Defeat a boss chamber.':'Derrota una cámara de jefe.','Defeat all three bosses.':'Derrota a los tres jefes.','Beat a boss with no hints or strikes.':'Vence a un jefe sin pistas ni fallos.','Daily chamber 3 days in a row.':'Cámara diaria 3 días seguidos.','Finish a review session.':'Termina una sesión de repaso.','Run something in the sandbox.':'Ejecuta algo en el cuaderno de pruebas.','Reach the Architect rank.':'Alcanza el rango de Arquitecto.',
'How different the text color is from its background. Normal text needs at least 4.5:1, large text 3:1.':'Cuánto se diferencia el color del texto del fondo. El texto normal necesita al menos 4,5:1 y el grande 3:1.','Short text that says what an image shows, so screen readers can read it. Decorative images get an empty alt.':'Texto breve que dice qué muestra una imagen para que los lectores de pantalla lo lean. Las imágenes decorativas llevan alt vacío.','The element that receives key presses. It must be visible, follow a sensible order and never trap you.':'El elemento que recibe las pulsaciones. Debe verse, seguir un orden lógico y no atraparte.','Controls need room to be tapped or clicked. WCAG 2.2 asks for at least 24 by 24 CSS pixels.':'Los controles necesitan espacio para tocarlos. WCAG 2.2 pide al menos 24 por 24 píxeles CSS.','A CPU splits each instruction into steps (fetch, decode, execute, memory, write-back) so several instructions overlap in time.':'Una CPU divide cada instrucción en pasos (captura, decodificación, ejecución, memoria, escritura) para solapar varias instrucciones.','An instruction needs a result that an earlier one has not produced yet, so the pipeline may have to wait.':'Una instrucción necesita un resultado que otra anterior aún no ha producido, así que el pipeline puede tener que esperar.','Sending a result straight from a later stage back to an earlier one, so the next instruction does not wait for write-back.':'Enviar un resultado directamente de una etapa posterior a una anterior, para que la siguiente instrucción no espere a la escritura.','Cycles per instruction and its inverse, instructions per cycle. Stalls raise CPI and lower IPC.':'Ciclos por instrucción y su inversa, instrucciones por ciclo. Las paradas suben el CPI y bajan el IPC.','Voltage equals current times resistance (V = I × R). Knowing two of the three gives you the third.':'La tensión es la corriente por la resistencia (V = I × R). Con dos valores obtienes el tercero.','In series the same current flows through each part and resistances add. In parallel the voltage is shared and currents add.':'En serie pasa la misma corriente por cada parte y las resistencias se suman. En paralelo se comparte la tensión y las corrientes se suman.','Power is voltage times current (P = V × I). More power means more heat to get rid of.':'La potencia es tensión por corriente (P = V × I). Más potencia significa más calor que disipar.','A fuse melts when the current is too high, breaking the circuit to protect everything else.':'Un fusible se funde si la corriente es demasiado alta y corta el circuito para proteger lo demás.','Finds the cheapest path by always expanding the unvisited node with the lowest cost so far.':'Encuentra el camino más barato expandiendo siempre el nodo no visitado con menor coste acumulado.','Like Dijkstra, but adds a guess of the remaining cost (a heuristic), so it explores fewer nodes on the way to the goal.':'Como Dijkstra, pero añade una estimación del coste restante (heurística) y explora menos nodos hacia la meta.','A priority queue hands you the lowest-cost item next. A binary heap does this in logarithmic time.':'Una cola de prioridad te da primero el elemento más barato. Un montículo binario lo hace en tiempo logarítmico.','Keeping a result so it is not computed twice. It costs memory and saves time.':'Guardar un resultado para no calcularlo dos veces. Cuesta memoria y ahorra tiempo.','Statements that are true or false, joined with AND, OR, NOT and implies.':'Enunciados verdaderos o falsos unidos con Y, O, NO e implica.','Adds variables and quantifiers: for all (∀) and there exists (∃).':'Añade variables y cuantificadores: para todo (∀) y existe (∃).','Valid steps, such as modus ponens: from P and P → Q you may conclude Q.':'Pasos válidos, como el modus ponens: de P y P → Q puedes concluir Q.','Simple machines and programs, such as While programs, that define what can be computed.':'Máquinas y programas sencillos, como los programas While, que definen qué se puede calcular.','if / else chooses which code runs based on a condition.':'if / else elige qué código se ejecuta según una condición.','Repeat code while a condition holds, or once for each item in a list.':'Repiten código mientras se cumple una condición o una vez por cada elemento de una lista.','Named blocks of code that take inputs and return a result.':'Bloques de código con nombre que reciben entradas y devuelven un resultado.','Trace the code by hand, tracking each variable, to predict what it prints.':'Sigue el código a mano, anotando cada variable, para predecir lo que imprime.','Friend':'Amigo','Friends':'Amigos','Head to head':'Cara a cara','Swap friend codes to compare ranks, trophies and time, then show off a versus card.':'Intercambia códigos de amigo para comparar rangos, trofeos y tiempo, y luego presume de tarjeta de duelo.','Your friend code':'Tu código de amigo','A friend code holds your name, rank and trophy totals. It holds no saves. Send it to a friend and paste theirs here.':'Un código de amigo contiene tu nombre, rango y totales de trofeos. No contiene partidas guardadas. Envíaselo a un amigo y pega aquí el suyo.','Add a friend':'Añadir un amigo','Friend code':'Código de amigo','Paste a friend code here':'Pega aquí un código de amigo','Add friend':'Añadir amigo','No friends yet. Paste a friend code above.':'Aún no hay amigos. Pega arriba un código de amigo.','That is not a friend code.':'Eso no es un código de amigo.','Friend added.':'Amigo añadido.','Friend updated.':'Amigo actualizado.','Friend list is full. Remove one first.':'La lista de amigos está llena. Quita uno primero.','Daily challenges':'Retos diarios','Dead even across the games.':'Empate total entre los juegos.','Only you have':'Solo tú tienes','Only':'Solo','has':'tiene','This friend uses a different version of the arcade, so only totals can be compared.':'Este amigo usa otra versión de la sala, así que solo se pueden comparar los totales.','Copy versus as text':'Copiar duelo como texto','Target':'Objetivo','Skip to content':'Saltar al contenido',
/* chrome */
'Games':'Juegos','Trophies':'Trofeos','Stats':'Estadísticas','Profile':'Perfil','Theme':'Tema','Motion':'Animación','Sound':'Sonido','Language':'Idioma','auto':'auto','light':'claro','dark':'oscuro','on':'sí','off':'no',
'Six games · one console · one service record':'Seis juegos · una consola · un historial de servicio',
'Inspect interfaces, defuse a power bus, keep a CPU pipeline full, route packets, prove logic and read code. Every game you play earns trophies toward one rank.':'Inspecciona interfaces, desactiva un bus de energía, mantén lleno un pipeline de CPU, enruta paquetes, demuestra lógica y lee código. Cada juego te da trofeos para un único rango.',
'SERVICE RECORD':'HISTORIAL DE SERVICIO','RANK':'RANGO','Games tried':'Juegos probados','Time played':'Tiempo jugado','Unlocked':'Desbloqueados','Points':'Puntos','Possible':'Posibles',
'Choose a game':'Elige un juego','Search: circuits, logic, algorithms':'Buscar: circuitos, lógica, algoritmos','Sort: default':'Orden: predeterminado','Most played':'Más jugados','Least finished':'Menos completados','Name':'Nombre',
'No game matches that search. Try a topic such as logic or electronics.':'Ningún juego coincide con la búsqueda. Prueba con un tema como lógica o electrónica.',
'Daily challenge · +50 pts':'Reto diario · +50 pts','Daily challenge':'Reto diario','Continue':'Continuar','Try next':'Prueba a continuación','Resume':'Reanudar','Browse games':'Ver juegos','Play':'Jugar','Start':'Empezar','Nothing yet':'Nada todavía',
'Pick up where you left off.':'Sigue donde lo dejaste.','Start with any game below.':'Empieza con cualquier juego de abajo.','Complete':'Completado','Today’s challenge is done. A new one arrives tomorrow.':'El reto de hoy está hecho. Mañana llega uno nuevo.',
'The game you have finished least.':'El juego que menos has completado.','You have not tried this one yet.':'Todavía no has probado este.',
'Not played yet':'Sin jugar todavía','Hall of records':'Salón de récords','Unlocked from your saved progress in each game, plus a few for the arcade itself. Locked ones show how close you are.':'',
'Trophies unlock from your saved progress in each game, plus a few for the arcade itself. Locked ones show how close you are.':'Los trofeos se desbloquean con tu progreso guardado en cada juego, más algunos de la propia sala. Los bloqueados muestran cuánto te falta.',
'All':'Todos','Arcade':'Sala','Secret trophy':'Trofeo secreto','Keep playing to find out.':'Sigue jugando para descubrirlo.','Pin':'Fijar','Pinned':'Fijado','In-game':'En el juego',
'Bronze':'Bronce','Silver':'Plata','Gold':'Oro','pts':'pts','points':'puntos','trophies':'trofeos','Played':'Jugado',
'Logbook':'Cuaderno de bitácora','Where your time went, which days you played, and the hardest trophies you hold.':'Dónde fue tu tiempo, qué días jugaste y los trofeos más difíciles que tienes.',
'Time per game':'Tiempo por juego','Toughest trophies earned':'Trofeos más difíciles logrados','Play days, last 12 weeks':'Días de juego, últimas 12 semanas','Less':'Menos','More':'Más','No trophies yet. Play a game to earn your first.':'Aún no hay trofeos. Juega para ganar el primero.','no play':'sin juego',
'Skills':'Habilidades','Skills practiced in each game. The bar shows the share of that game’s trophies you hold.':'Habilidades que se practican en cada juego. La barra muestra la parte de los trofeos de ese juego que tienes.','Open lesson':'Abrir lección',
'Inspector file':'Ficha de inspector','Name yourself, pin up to three trophies from the Trophies page, and copy a save code to move your progress to another browser.':'Ponte un nombre, fija hasta tres trofeos desde la página de Trofeos y copia un código de guardado para llevar tu progreso a otro navegador.',
'Your card':'Tu tarjeta','Inspector name':'Nombre de inspector','Your name':'Tu nombre','Copy card as text':'Copiar tarjeta como texto','Save code':'Código de guardado',
'This code holds your trophies, stats and every game’s saved progress. Keep it somewhere safe.':'Este código contiene tus trofeos, estadísticas y el progreso guardado de cada juego. Guárdalo en un lugar seguro.',
'Your code':'Tu código','Copy code':'Copiar código','Restore from a code':'Restaurar desde un código','Paste a save code here':'Pega aquí un código de guardado','Restore progress':'Restaurar progreso','Click again to replace everything':'Pulsa otra vez para reemplazarlo todo',
'Copied':'Copiado','Select the text and copy it':'Selecciona el texto y cópialo','Paste a code first':'Pega primero un código','That is not a Halcyon save code.':'Eso no es un código de guardado de Halcyon.','The code is damaged. Copy it again in full.':'El código está dañado. Cópialo de nuevo completo.','This browser blocked saving. Check your storage settings.':'Este navegador bloqueó el guardado. Revisa los ajustes de almacenamiento.',
'RANK UP':'SUBES DE RANGO','Click to continue':'Haz clic para continuar','← Back to hub':'← Volver al hub','Full screen':'Pantalla completa','Open on its own page':'Abrir en su propia página','Not available':'No disponible','Loading':'Cargando',
'Trophy unlocked':'Trofeo desbloqueado','Daily complete':'Reto diario completado','Assignment complete':'Tarea completada','Assignment':'Tarea',
'Cadet':'Cadete','Deckhand':'Marinero','Technician':'Técnico','Engineer':'Ingeniero','Chief':'Jefe','Commander':'Comandante',
/* session, assignments, teachers */
'Session recap':'Resumen de la sesión','Dismiss':'Cerrar','Concepts practiced':'Conceptos practicados','New trophies':'Trofeos nuevos','Nothing new was saved this time. Longer sessions give more to review.':'Esta vez no se guardó nada nuevo. Las sesiones más largas dan más que repasar.','Games do not report mistakes, so this recap shows progress and time only.':'Los juegos no informan de los errores, así que este resumen solo muestra progreso y tiempo.',
'Assignments':'Tareas','done':'hecho',
'Inspector':'Inspector',



/* games */
'Accessibility':'Accesibilidad','CPU design':'Diseño de CPU','Electronics':'Electrónica','Algorithms':'Algoritmos','Logic':'Lógica','Programming':'Programación',
'Nods to Papers, Please':'Guiños a Papers, Please','Assembly-line sim':'Simulador de línea de montaje','Nods to Keep Talking and Nobody Explodes':'Guiños a Keep Talking and Nobody Explodes','Nods to classic tower defense':'Guiños al tower defense clásico','Nods to Portal':'Guiños a Portal','Casino games as code lessons':'Juegos de casino como lecciones de código',
'Work as a berth inspector. Check each interface against the rulebook, cite the faults and stamp the berth before the shift clock runs out.':'Trabaja como inspector de atraques. Revisa cada interfaz con el reglamento, cita los fallos y sella el atraque antes de que acabe el turno.',
'Keep five pipeline stages busy. Every bubble and stall costs throughput, so dodge hazards and forward results in time.':'Mantén ocupadas las cinco etapas del pipeline. Cada burbuja y cada parada cuesta rendimiento: esquiva riesgos y reenvía resultados a tiempo.',
'Keep a colony ship\'s power bus alive. Wire resistors, LEDs and fuses, read the scope and hold the needle in the band before dawn shift.':'Mantén vivo el bus de energía de una nave colonial. Conecta resistencias, LED y fusibles, lee el osciloscopio y mantén la aguja en la banda antes del turno del alba.',
'A tower defense where packets take the cheapest route. Reshape the costs and trap them, then compare Dijkstra with A*.':'Un tower defense donde los paquetes toman la ruta más barata. Cambia los costes, atrápalos y compara Dijkstra con A*.',
'Solve logic chambers to unseal each exit. Build the proof, avoid disposal, and wait politely for the promised cake.':'Resuelve cámaras de lógica para abrir cada salida. Construye la demostración, evita el desecho y espera con educación la tarta prometida.',
'Turn game rules into code. Predict outputs, order recipe steps, and learn JavaScript, Python or Java one table at a time.':'Convierte reglas de juegos en código. Predice resultados, ordena pasos de recetas y aprende JavaScript, Python o Java mesa a mesa.',
/* concepts */
'Contrast ratios':'Contraste de color','Text alternatives':'Textos alternativos','Keyboard focus':'Foco de teclado','Target size':'Tamaño de objetivo','Pipeline stages':'Etapas del pipeline','Data hazards':'Riesgos de datos','Forwarding':'Reenvío','CPI and IPC':'CPI e IPC','Ohm’s law':'Ley de Ohm','Series and parallel':'Serie y paralelo','Power and heat':'Potencia y calor','Fuses':'Fusibles','Dijkstra':'Dijkstra','A* search':'Búsqueda A*','Heaps and queues':'Montículos y colas','Caching':'Caché','Propositional logic':'Lógica proposicional','Predicate logic':'Lógica de predicados','Proof rules':'Reglas de demostración','Computation models':'Modelos de computación','Conditionals':'Condicionales','Loops':'Bucles','Functions':'Funciones','Reading output':'Leer resultados',
/* daily */
'Process 5 ships in Port Halcyon':'Procesa 5 barcos en Port Halcyon','Cite 10 faults correctly in Port Halcyon':'Cita 10 fallos correctamente en Port Halcyon','Win a shift in Pipeline Factory':'Gana un turno en Pipeline Factory','Ship 30 instructions cleanly in Pipeline Factory':'Envía 30 instrucciones sin errores en Pipeline Factory','Earn 3 stars in Halcyon Relay 7':'Consigue 3 estrellas en Halcyon Relay 7','Complete a mission in Halcyon Relay 7':'Completa una misión en Halcyon Relay 7','Win a map in Pathfinder’s Keep':'Gana un mapa en Pathfinder’s Keep','Earn 50 shards in Pathfinder’s Keep':'Consigue 50 fragmentos en Pathfinder’s Keep','Unseal a new chamber in the Proof Lab':'Abre una cámara nueva en el Proof Lab','Earn 100 points in the Proof Lab':'Consigue 100 puntos en el Proof Lab','Finish 3 lessons in Logic Engine':'Termina 3 lecciones en Logic Engine','Play any game for 10 minutes':'Juega 10 minutos a cualquier juego',
/* trophy names */
'Stamp Happy':'Sellador feliz','Eagle Eye':'Ojo de águila','Title Holder':'Con título','Ten Ships':'Diez barcos','Fifty Ships':'Cincuenta barcos','Harbor Veteran':'Veterano del puerto','Sharper Eyes':'Ojos más agudos','Rulebook Scholar':'Erudito del reglamento','Frequent Flier':'Viajero frecuente','Half a Cabinet':'Medio gabinete','Three Tides':'Tres mareas','Fourteen Days':'Catorce días','Clean Hands':'Manos limpias','Eagle Eye (90%)':'Ojo de águila (90%)','Page Fourteen':'Página catorce','Archivist':'Archivista','Senior Inspector':'Inspector sénior','Wanderer':'Caminante','Deep Tide':'Marea profunda','Quick Hands':'Manos rápidas','Many Tides':'Muchas mareas','Case Closer':'Cierra casos','Second Reading':'Segunda lectura','Friend of the File':'Amigo del archivo','Good Neighbour':'Buen vecino',
'Throughput':'Rendimiento','Union Rep':'Delegado sindical','Five Shifts':'Cinco turnos','Ten Shifts':'Diez turnos','Plant Legend':'Leyenda de la planta','Warehouse':'Almacén','Mass Production':'Producción en masa','Three-Star Trio':'Trío de tres estrellas','Repeat Offender':'Reincidente','Trophy Wall':'Muro de trofeos','First Shift':'Primer turno','Spotless':'Impecable','Hot Streak':'Racha caliente','Welcome to the Club':'Bienvenido al club','Out-of-Order Mishap':'Percance fuera de orden','Reorder Buffer':'Búfer de reordenación','Cool Head':'Cabeza fría','Plant Fund':'Fondo de planta',
'First Light':'Primera luz','Stay Frosty':'Sangre fría','Dawn Patrol':'Patrulla del alba','Bus Master':'Maestro del bus','Mission Control':'Control de misión','Perfect Bus':'Bus perfecto','Warm-Up':'Calentamiento','Thirty Stars':'Treinta estrellas','Triple Crown':'Triple corona','Creature of Habit':'Animal de costumbres','Night Crew':'Equipo nocturno',
'Path Finder':'Buscacaminos','Puzzle Keeper':'Guardián de acertijos','Squad Leader':'Jefe de escuadra','Warden':'Guardián','Shard Saver':'Ahorrador de fragmentos','Shard Baron':'Barón de fragmentos','Star Cluster':'Cúmulo de estrellas','Constellation':'Constelación','Trial Taker':'Aspirante a pruebas','Cartographer’s Apprentice':'Aprendiz de cartógrafo','Half the Armory':'Media armería','First Blood':'Primera sangre','Master Smith':'Maestro herrero','Boss Slayer':'Mata jefes','Flawless Keep':'Fortaleza impecable','Arborist':'Arborista','Polymath':'Políglota del saber','Oracle':'Oráculo','Fog Walker':'Caminante de la niebla','Architect':'Arquitecto','Puzzle Master':'Maestro de acertijos','Surveyor':'Agrimensor','Cartographer':'Cartógrafo',
'Test Subject':'Sujeto de pruebas','Chamber Five':'Cámara cinco','Cake Candidate':'Candidato a tarta','Chamber Ten':'Cámara diez','Collector':'Coleccionista','Twenty Chambers':'Veinte cámaras','Cake Owed':'Tarta debida','Warm Cell':'Celda templada','Act One Done':'Acto uno hecho','Fifteen Deep':'Quince de profundidad','Six Hundred':'Seiscientos','Two Thousand':'Dos mil','Clean Streak':'Racha limpia','Twenty Solved':'Veinte resueltas',
'Hello, World':'Hola, mundo','Five Lessons':'Cinco lecciones','Polyglot':'Políglota','Star Collector':'Coleccionista de estrellas','High Roller':'Gran apostador','Fifty Lessons':'Cincuenta lecciones','Trilingual':'Trilingüe','Century':'Centenar','Ten Lessons':'Diez lecciones','Fifteen Lessons':'Quince lecciones','Seventy-Five':'Setenta y cinco','Ten Stars':'Diez estrellas','Sixty Stars':'Sesenta estrellas','Star Hoard':'Tesoro de estrellas',
'Power On':'Encendido','Grand Tour':'Gran gira','Regular':'Habitual','Long Shift':'Turno largo','All-Rounder':'Todoterreno','Halfway There':'A medio camino','Trophy Hunter':'Cazador de trofeos','Marathon':'Maratón','Completionist':'Completista','Back Again':'De vuelta','Week Streak':'Racha semanal','Triple Feature':'Sesión triple','Weekend Warrior':'Guerrero de fin de semana','Early Bird':'Madrugador','Thirty Launches':'Treinta inicios','Half an Hour':'Media hora','Five Hours':'Cinco horas','Quarter Century':'Un cuarto de siglo','Half Century':'Medio siglo','Night Owl':'Búho nocturno',
/* trophy descriptions */
'Process your first ship at the quay.':'Procesa tu primer barco en el muelle.','Cite 30 faults correctly.':'Cita 30 fallos correctamente.','Earn an inspector title.':'Gana un título de inspector.','Process 10 ships.':'Procesa 10 barcos.','Process 50 ships.':'Procesa 50 barcos.','Process 150 ships.':'Procesa 150 barcos.','Cite 100 faults correctly.':'Cita 100 fallos correctamente.','Cite 300 faults correctly.':'Cita 300 fallos correctamente.','Start 5 runs at the quay.':'Empieza 5 partidas en el muelle.','Earn 5 inspector titles.':'Gana 5 títulos de inspector.','See 3 different endings.':'Ve 3 finales distintos.','Finish the career.':'Termina la carrera.','Finish the career without taking an envelope.':'Termina la carrera sin aceptar ningún sobre.','Finish with 90% or better accuracy.':'Termina con un 90% o más de precisión.','Reach the Charter ending.':'Llega al final de la Carta.','Reach the reading-room ending.':'Llega al final de la sala de lectura.','Accept the Chancellor’s offer.':'Acepta la oferta del Canciller.','Find everything on every art site.':'Encuéntralo todo en cada sitio de arte.','Reach wave 10 in the Long Tide.':'Llega a la oleada 10 en la Marea Larga.','Earn 25 speed bonuses.':'Gana 25 bonificaciones de velocidad.','See five different endings.':'Ve cinco finales distintos.','Close three boss cases.':'Cierra tres casos de jefe.','Finish a New Game+ career.':'Termina una carrera en Nueva Partida+.','Finish a career with the Registry file.':'Termina una carrera con el archivo del Registro.','Reach the ending where the quay looks after itself.':'Llega al final donde el muelle se cuida solo.',
'Ship 100 instructions cleanly.':'Envía 100 instrucciones sin errores.','Unlock 5 of the game’s own achievements.':'Desbloquea 5 logros propios del juego.','Win 5 shifts.':'Gana 5 turnos.','Win 10 shifts.':'Gana 10 turnos.','Win 25 shifts.':'Gana 25 turnos.','Ship 500 instructions cleanly.':'Envía 500 instrucciones sin errores.','Ship 1000 instructions cleanly.':'Envía 1000 instrucciones sin errores.','Earn 3 stars on 3 different shifts.':'Consigue 3 estrellas en 3 turnos distintos.','Get fired 3 times.':'Que te despidan 3 veces.','Unlock 3 of the game’s achievements.':'Desbloquea 3 logros del juego.','Win your first shift.':'Gana tu primer turno.','Win a shift with 3 stars.':'Gana un turno con 3 estrellas.','Reach a streak of 20.':'Alcanza una racha de 20.','Get fired.':'Que te despidan.','Get laid off for a broken reorder.':'Que te despidan por una reordenación rota.','Issue 10 crates out of order in one shift.':'Emite 10 cajas fuera de orden en un turno.','Win with the overclock at level 2 or more and no throttling.':'Gana con el overclock en nivel 2 o más y sin limitación térmica.','Hold 800 in the bank.':'Ten 800 en el banco.',
'Complete a relay mission.':'Completa una misión del relé.','Earn 3 stars on one mission.':'Consigue 3 estrellas en una misión.','Complete the daily mission.':'Completa la misión diaria.','Collect 15 stars across missions.':'Reúne 15 estrellas entre misiones.','Complete 5 relay missions.':'Completa 5 misiones del relé.','Earn 3 stars on 3 different missions.':'Consigue 3 estrellas en 3 misiones distintas.','Earn 5 stars across missions.':'Consigue 5 estrellas entre misiones.','Earn 30 stars across missions.':'Consigue 30 estrellas entre misiones.','Earn 3 stars on 5 different missions.':'Consigue 3 estrellas en 5 misiones distintas.','Complete 3 different daily missions.':'Completa 3 misiones diarias distintas.','Complete 3 relay missions.':'Completa 3 misiones del relé.',
'Clear 3 maps.':'Supera 3 mapas.','Solve 3 routing puzzles.':'Resuelve 3 acertijos de rutas.','Win 5 maps.':'Gana 5 mapas.','Win 20 maps.':'Gana 20 mapas.','Hold 100 shards.':'Ten 100 fragmentos.','Hold 500 shards.':'Ten 500 fragmentos.','Earn 10 stars in total.':'Consigue 10 estrellas en total.','Earn 30 stars in total.':'Consigue 30 estrellas en total.','Play 4 different trials.':'Juega 4 pruebas distintas.','Clear 5 maps.':'Supera 5 mapas.','Unlock 6 of the game’s achievements.':'Desbloquea 6 logros del juego.','Destroy a packet.':'Destruye un paquete.','Upgrade a tool to tier 3.':'Mejora una herramienta al nivel 3.','Defeat the boss.':'Derrota al jefe.','Win a map without a single leak.':'Gana un mapa sin una sola fuga.','Earn three stars in all four tree trials.':'Consigue tres estrellas en las cuatro pruebas de árboles.','Earn three stars in every trial.':'Consigue tres estrellas en todas las pruebas.','Predict correctly three times in a row.':'Acierta tres predicciones seguidas.','Predict a fog round correctly.':'Acierta la predicción de una ronda de niebla.','Solve a Maze Architect puzzle.':'Resuelve un acertijo del Arquitecto de Laberintos.','Earn three stars on every puzzle.':'Consigue tres estrellas en todos los acertijos.','Sketch a blueprint that matches 80% of the real route.':'Dibuja un plano que coincida con el 80% de la ruta real.','Clear every map.':'Supera todos los mapas.',
'Open your first exit.':'Abre tu primera salida.','Unseal five chambers.':'Abre cinco cámaras.','Earn 300 points in the lab.':'Consigue 300 puntos en el laboratorio.','Unseal ten chambers.':'Abre diez cámaras.','Solve 12 chambers.':'Resuelve 12 cámaras.','Unseal twenty chambers.':'Abre veinte cámaras.','Earn 1000 points in the lab.':'Consigue 1000 puntos en el laboratorio.','Unseal three chambers.':'Abre tres cámaras.','Unseal eight chambers.':'Abre ocho cámaras.','Unseal fifteen chambers.':'Abre quince cámaras.','Earn 600 points in the lab.':'Consigue 600 puntos en el laboratorio.','Earn 2000 points in the lab.':'Consigue 2000 puntos en el laboratorio.','Reach a streak of 5 clean chambers.':'Alcanza una racha de 5 cámaras limpias.','Solve 20 chambers.':'Resuelve 20 cámaras.',
'Finish your first lesson.':'Termina tu primera lección.','Finish 5 lessons.':'Termina 5 lecciones.','Learn in two different languages.':'Aprende en dos lenguajes distintos.','Collect 30 stars.':'Reúne 30 estrellas.','Finish 25 lessons.':'Termina 25 lecciones.','Finish 50 lessons.':'Termina 50 lecciones.','Learn in JavaScript, Python and Java.':'Aprende en JavaScript, Python y Java.','Finish 100 lessons.':'Termina 100 lecciones.','Finish 10 lessons.':'Termina 10 lecciones.','Finish 15 lessons.':'Termina 15 lecciones.','Finish 75 lessons.':'Termina 75 lecciones.','Collect 10 stars.':'Reúne 10 estrellas.','Collect 60 stars.':'Reúne 60 estrellas.','Collect 100 stars.':'Reúne 100 estrellas.',
'Launch any game.':'Abre cualquier juego.','Try all six games.':'Prueba los seis juegos.','Launch games 15 times.':'Abre juegos 15 veces.','Play for one hour in total.':'Juega una hora en total.','Earn a trophy in every game.':'Gana un trofeo en cada juego.','Unlock half of the game trophies.':'Desbloquea la mitad de los trofeos de los juegos.','Unlock 10 trophies.':'Desbloquea 10 trofeos.','Play for three hours in total.':'Juega tres horas en total.','Unlock every game trophy.':'Desbloquea todos los trofeos de los juegos.','Play on 3 different days.':'Juega en 3 días distintos.','Play on 7 different days.':'Juega en 7 días distintos.','Play 3 different games in one day.':'Juega 3 juegos distintos en un día.','Play on a Saturday or Sunday.':'Juega un sábado o un domingo.','Play between 5 and 8 a.m.':'Juega entre las 5 y las 8 de la mañana.','Launch games 30 times.':'Abre juegos 30 veces.','Play for 30 minutes in total.':'Juega 30 minutos en total.','Play for five hours in total.':'Juega cinco horas en total.','Unlock 25 trophies.':'Desbloquea 25 trofeos.','Unlock 50 trophies.':'Desbloquea 50 trofeos.','Play between midnight and 5 a.m.':'Juega entre la medianoche y las 5 de la mañana.'
};

