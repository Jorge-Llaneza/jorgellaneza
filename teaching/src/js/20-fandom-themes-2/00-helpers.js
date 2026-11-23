 const X=window.SFX,PAN=X.PAN,tick=X.tick,esc=X.esc2,D=X.D;
 const {ST,rnd,pick,pay,bar,onSP,splash}=window.sfLib;
 const now=()=>Date.now();
 const BASE='.hot{background:var(--acc)!important;color:var(--on)!important;border-color:var(--acc2)!important;box-shadow:none}.hot *{color:inherit!important}.hxnew{background:var(--acc2)!important;color:var(--on)!important;border-color:var(--acc2)!important}.hxhero{background:var(--card)!important;border:2px solid var(--acc)!important}.shpcard,.shpcard.bpcard,.shpcard.evcard,.shpcard.egcard{border-color:var(--bd)!important;border-left-color:var(--acc)!important;background:var(--card)}.shpcard .pri,.hxhero .pri{background:var(--acc)!important;color:var(--on)!important}';
 const mmss=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
 const wire=(id,V,card)=>{
  try{window.FDCSS=(window.FDCSS||'')+fdScope(BASE,id)+fdScope('#fdview{position:fixed;inset:0;z-index:30;pointer-events:none;overflow:hidden}#fdview *{pointer-events:none}'+V.s,id)+'@media(prefers-reduced-motion:no-preference){'+fdScope(V.a||'',id)+'}';const st=document.getElementById('fdcss');if(st)st.textContent=window.FDCSS}catch(e){}
  try{if(typeof FDK!=='undefined'&&FDK[id])FDK[id].hud=()=>{try{return PAN[id].hud()}catch(e){return ''}}}catch(e){}
  try{const P=window.PCARD;if(P){P.D[id]=card;P.META.push({id,name:id==='nightcity'?'Mercenary Card':id==='l4safe'?'Survivor Card':'Crew Dossier',need:[id],tag:id==='nightcity'?'Edgerunner':id==='l4safe'?'Survivor':'Heist crew',ico:id==='nightcity'?'🌃':id==='l4safe'?'🧟':'💰'})}}catch(e){}
 };
 const cut=(c,t,w)=>{while(t.length>3&&c.measureText(t).width>w)t=t.slice(0,-2);return t};

