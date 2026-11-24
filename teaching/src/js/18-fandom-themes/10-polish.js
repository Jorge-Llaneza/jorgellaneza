/* ======= POLISH: home-screen pieces follow the theme, and no pointless emoji rain ======= */
(function(){
 const BASE='.hot{background:var(--acc)!important;color:var(--on)!important;border-color:var(--acc2)!important;box-shadow:none}.hot *{color:inherit!important}.hxnew{background:var(--acc2)!important;color:var(--on)!important;border-color:var(--acc2)!important}.hxhero{background:var(--card)!important;border:2px solid var(--acc)!important}.shpcard,.shpcard.bpcard,.shpcard.evcard,.shpcard.egcard{border-color:var(--bd)!important;border-left-color:var(--acc)!important;background:var(--card)}.shpcard .pri,.hxhero .pri{background:var(--acc)!important;color:var(--on)!important}';
 let pre='';FD.forEach(f=>{pre+=fdScope(BASE,f.id)+'\n'});
 window.FDCSS=pre+(window.FDCSS||'');
 const st=document.getElementById('fdcss');if(st)st.textContent=window.FDCSS;
 /* rain only where it truly fits */
 const KEEP={inkbanner:['🌸','🌸','🌸','🍃'],goatchaos:['🐐','🐐','⭐','💥']};
 FD.forEach(f=>{if(window.FDVIEW&&window.FDVIEW[f.id]){f.fx=KEEP[f.id]||[];if(window.FDK&&FDK[f.id])FDK[f.id].fx=f.fx}});
 try{const g=document.createElement('style');g.textContent='.shpcard{border-color:var(--ec,var(--bd))!important}';document.head.appendChild(g)}catch(e){}
 try{fdSync()}catch(e){}
})();

