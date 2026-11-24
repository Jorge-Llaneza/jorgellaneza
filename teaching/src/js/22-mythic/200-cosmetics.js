/* ===== Mythic cosmetics: one original set across the customisation categories (no fandoms) ===== */
(function(){
 const MY='mythic';
 FONTS.chancery={n:'Chancery',r:MY,s:'"Apple Chancery","Lucida Calligraphy","URW Chancery L","Zapfino",cursive'};
 addU('font','f_chancery','Chancery',MY,{font:'chancery'});
 {const k='chancery',st=document.getElementById('mpx3');if(st)st.textContent+='\n'+['body','button','input','select','textarea','h1','h2','h3'].map(t=>'html[data-font='+k+'] '+t).join(',')+'{font-family:'+FONTS[k].s+'!important}'}
 ['🏮✨','🕰️✨','🌌✨'].forEach(e=>addU('avatar','av_'+e,'Avatar '+e,MY,{av:e}));
 ['Keeper of the Aurora','Winder of Clocks','Lantern Bearer'].forEach(t=>addU('title','t_'+t,t,MY,{title:t}));
 ['❂','✺'].forEach(f=>addU('flair','fl_'+f,'Flair '+f,MY,{flair:f}));
 CFSETS.nightsky=['🌌','💫','🪐','✨'];addU('confetti','cf_nightsky','Night sky',MY,{cf:'nightsky',i:CFSETS.nightsky.join('')});
 SKINMAP.aurora=t=>'✧ '+[...String(t).toUpperCase()].join(' ')+' ✧';addU('skin','sk_aurora','Aurora headings',MY,{skin:'aurora',d:'Spaced capitals between two stars.',i:'✧ A U R ✧'});
 addU('bg','bg_auroraflow','Aurora sky (moving)',MY,{key:'auroraflow'});
 addU('cursor','cur_lantern','Lantern',MY,{key:'lantern',i:'🏮'});
 addU('frame','frame_auroraf','Aurora frame (moving)',MY,{key:'auroraf'});
 addU('card','card_prismc','Prism edge (moving)',MY,{key:'prismc'});
 UISND.starfall=function(t,v){[3136,2637,2093,1568,1319].forEach((f,i)=>tone2(t,v,f,.55,'sine',.07,i*.06));tone2(t,v,196,.9,'sine',.05,0)};
 addU('sound','snd_starfall','Starfall',MY,{key:'starfall',i:'🔊'});
 const BV='radial-gradient(circle at 20% 30%,#3dffb0aa,transparent 50%),radial-gradient(circle at 75% 20%,#a678ffaa,transparent 50%),radial-gradient(circle at 55% 85%,#33e0ffaa,transparent 55%),linear-gradient(#02050f,#0a1f3a)';
 addU('banner','bn_auroraveil','Aurora Veil banner',MY,{key:'auroraveil',css:BV,anim:0});BANNERS.push(['auroraveil','Aurora Veil',MY,null,BV,0]);
 addU('nfx','nf_aurora','Aurora name effect',MY,{key:'aurora'});
 PETS.starwhale=['🐋','Star Whale',MY,'float'];addU('pet','pet_starwhale','Star Whale',MY,{key:'starwhale',i:'🐋',beh:'float'});
 TRAILS.starlight=['✦','Starlight trail',MY];addU('trail','trl_starlight','Starlight trail',MY,{key:'starlight',i:'✦'});
 CLICKS.nova=['✦','Nova ring',MY];addU('clickfx','clk_nova','Nova ring',MY,{key:'nova',i:'💫'});
 CHIPS.aurorachip=['Aurora',MY];addU('chip','chp_aurorachip','Aurora top bar',MY,{key:'aurorachip',i:'🏷'});
 LVFX.nova=['🌌','Supernova',MY,'✨',1];addU('lvfx','lvf_nova','Supernova level-up',MY,{key:'nova',i:'🌌'});
 TOASTS.lanterntoast=['Paper lantern',MY];addU('toast','tst_lanterntoast','Paper lantern notifications',MY,{key:'lanterntoast',i:'💬'});
 /* a small chance in the open crates (they only roll it when they hold a mythic item) */
 Object.keys(BOX).forEach(k=>{const b=BOX[k];if(b.odds&&!b.pack&&!b.sw)b.odds.mythic=k==='gold'?.012:.004});
})();
