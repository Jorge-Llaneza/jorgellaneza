/* ======= ONE BIG FANDOM CRATE (replaces the per-theme crates) ======= */
(function(){
 const FP=FD.filter(f=>f.pack).map(f=>f.pack);
 FP.forEach(p=>{if(BOX[p]){BOX[p].n='Fandom Crate';BOX[p].i='🎭';BOX[p].needs='__hidden_pack_crate'}});
 BOX.fandom={n:'Fandom Crate',i:'🎭',p:120,odds:{common:.45,rare:.32,epic:.17,legendary:.06},d:'Items from every fandom collection in one crate. Appears once you own any fandom theme.'};
 Object.defineProperty(BOX.fandom,'needs',{get(){const o=FD.find(f=>M.inv&&M.inv.own&&M.inv.own[f.id]);return o?o.id:'__no_fandom_theme'}});
 const _bp=boxPool;boxPool=function(type){if(type==='fandom')return CATALOG.filter(it=>!it.noDrop&&it.pack&&FP.includes(it.pack));return _bp(type)};
 function mv(){try{const b=M.inv.box;let n=0;FP.forEach(p=>{if(b[p]){n+=b[p];delete b[p]}});if(n){b.fandom=(b.fandom||0)+n;mDirty=true}}catch(e){}}
 const _gs2=grantSpecial;grantSpecial=function(id){_gs2(id);mv()};
 mv();setInterval(mv,1500);
 /* sets: the collection sets mention the old crate names */
 try{SETS.forEach(s=>{if(/^fd_/.test(s.id)){s.d='Every item from this fandom, found in the Fandom Crate.';s.limited='Fandom Crate only'}})}catch(e){}
})();

