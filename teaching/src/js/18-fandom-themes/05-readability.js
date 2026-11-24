/* ======= READABILITY FIXES for the new themes ======= */
(function(){
 const FIX={
  goatchaos:'h1,h2,h3,.big{text-shadow:1px 1px 0 #fff!important;color:#1a1033!important}.top .brand,.top h1{color:#1a1033!important}',
  basement:'h1,h2,h3,.big{text-shadow:none!important;color:#efe6dc!important}.top .brand,.top h1{color:#efe6dc!important}',
  critterquest:'h1,h2,h3,.big{text-shadow:none!important;color:#14407a!important}.top{background:#1e40af!important}.top .brand,.top h1{color:#ffe066!important}',
  evt_summer:'.top .brand,.top h1,.big{color:#a8330b!important}',
  valleyfarm:'.top .brand,.top h1{color:#2f5d1c!important}',
  starveling:'.top .brand,.top h1{color:#f0e2bd!important}h1,h2,h3,.big{color:#f0e2bd!important}',
 };
 let add='';Object.keys(FIX).forEach(id=>{add+=fdScope(FIX[id],id)+'\n'});
 add+='#sfdock .sfl button.on{background:var(--acc)!important;color:var(--on,#000)!important;border-color:var(--acc)}#sfdock .sfl button.on small{color:inherit!important}\n';
 try{window.FDCSS=(window.FDCSS||'')+add;const st=document.getElementById('fdcss');if(st)st.textContent=window.FDCSS;const x=document.createElement('style');x.id='rdfix';x.textContent='#sfdock .sfl button.on{background:var(--acc)!important;color:var(--on,#000)!important}#sfdock .sfl button.on small{color:inherit!important}';document.head.appendChild(x)}catch(e){}
})();

