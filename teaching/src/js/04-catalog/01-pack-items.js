/* ===== v6 part 2: pack items and crates for the special themes ===== */
const addU=(c,id,n,r,x)=>{if(!CATALOG.some(z=>z.id===id))addC(c,id,n,r,x)};
const PACKS={
 wi:{av:[['⛄','common'],['🧣','common'],['🎿','rare'],['🦌','rare'],['🎅','epic'],['🧊','epic'],['🐻‍❄️','legendary']],
  ti:[['Snow Day Scholar','common'],['Hot Cocoa Debugger','rare'],['Frozen In Thought','rare'],['Let It Snow (Compile)','epic'],['Blizzard Of Answers','epic'],['Winter Is Coming (Exam Season)','legendary']],
  fl:[['❄','common'],['☃','rare'],['✻','epic']],cf:['snow','Snowfall',['❄️','⛄','✨'],'epic']},
 ar:{av:[['🕹️','common'],['🎮','common'],['🪙','rare'],['💾','rare'],['📟','rare'],['🏆','epic'],['🧩','legendary']],
  ti:[['Insert Coin','common'],['Player One','rare'],['Combo Breaker','rare'],['Extra Life','epic'],['High Score Hunter','epic'],['Final Boss (Defeated)','legendary']],
  fl:[['▲','common'],['◆','rare'],['▣','epic']],cf:['pix','Pixel party',['🟪','🟨','🟦','🟥','⭐'],'epic']},
 ab:{av:[['🐠','common'],['🐡','common'],['🐚','common'],['🦑','rare'],['🪼','rare'],['🦞','rare'],['🐋','epic'],['🔱','epic'],['🧜','legendary']],
  ti:[['Deep Diver','common'],['Pressure Tested','rare'],['Bioluminescent Brain','rare'],['Leviathan Of Logic','epic'],['Kraken Of Knowledge','legendary']],
  fl:[['≈','common'],['◌','rare'],['❂','epic']],cf:['deep','Deep sea',['🫧','🐟','🪼','🫧'],'epic']},
 sk:{av:[['🌸','common'],['🍵','common'],['🎎','rare'],['🏮','rare'],['🦢','rare'],['⛩️','epic'],['🎋','epic'],['🦋','legendary']],
  ti:[['Petal Collector','common'],['Quiet Mind','rare'],['Ink And Brush','rare'],['Cherry Blossom Scholar','epic'],['Zen Master Of Syntax','legendary']],
  fl:[['❀','common'],['❁','rare'],['✾','epic']],cf:['petals','Petal storm',['🌸','💮','🌷'],'epic']}};
Object.entries(PACKS).forEach(([pk,p])=>{
 p.av.forEach(([e,r])=>addU('avatar','av_'+e,'Avatar '+e,r,{av:e,pack:pk}));
 p.ti.forEach(([t,r])=>addU('title','t_'+t,t,r,{title:t,pack:pk}));
 p.fl.forEach(([f,r])=>addU('flair','fl_'+f,'Flair '+f,r,{flair:f,pack:pk}));
 CFSETS[p.cf[0]]=p.cf[2];addU('confetti','cf_'+p.cf[0],p.cf[1],p.cf[3],{cf:p.cf[0],i:p.cf[2].join(''),pack:pk})});
Object.assign(BOX,{
 wi:{n:'Winter Crate',i:'🎄',p:100,pack:'wi',needs:'winter',season:'xmas',odds:{common:.50,rare:.30,epic:.15,legendary:.05},d:'⏳ Limited time: only available from Dec 1 to Jan 6, once you own Winter Wonderland. Winter items only.'},
 ar:{n:'Arcade Cabinet',i:'🕹',p:100,pack:'ar',needs:'arcadeth',odds:{common:.50,rare:.30,epic:.15,legendary:.05},d:'Arcade items only. Appears once you own Neon Arcade.'},
 ab:{n:'Deep Sea Chest',i:'🐚',p:100,pack:'ab',needs:'abyss',odds:{common:.50,rare:.30,epic:.15,legendary:.05},d:'Ocean items only. Appears once you own Abyss.'},
 sk:{n:'Sakura Box',i:'🏮',p:100,pack:'sk',needs:'sakura',odds:{common:.50,rare:.30,epic:.15,legendary:.05},d:'Blossom items only. Appears once you own Sakura Zen.'}});

