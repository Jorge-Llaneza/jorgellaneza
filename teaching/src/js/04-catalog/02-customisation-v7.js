/* ===== v7: more customisation (banners, name effects, companions, trails, click effects, bar styles, crate skins, level-up shows, notification styles) ===== */
const NEWC={banner:'banner',nfx:'nfx',pet:'pet',trail:'trail',clickfx:'clickfx',chip:'chipst',crate:'crateskin',lvfx:'lvfx',toast:'toastst'};
const BNDEF=[ // key, name, rarity ('free' = everyone), css, animated?
 ['','Plain','free','linear-gradient(120deg,var(--acc),var(--bd))'],['sunrise','Sunrise','free','linear-gradient(120deg,#ff9a56,#ff4d6d)'],['ocean','Ocean','free','linear-gradient(120deg,#0e7c99,#5cc8ff)'],
 ['forest','Forest','common','linear-gradient(120deg,#0b3d24,#5fcf80)'],['dusk','Dusk','common','linear-gradient(120deg,#1d0f1f,#ff7a45)'],['candy','Candy','common','linear-gradient(120deg,#ff8fd0,#ffd1f0,#9ad7ff)'],['mint','Mint','common','linear-gradient(120deg,#0f8f6b,#b8ffe6)'],
 ['aurora','Aurora','rare','linear-gradient(120deg,#00f5d4,#7c4dff,#ff2bd6)'],['circuit','Circuit','rare','repeating-linear-gradient(90deg,#0a3d22 0 2px,#052313 2px 22px),linear-gradient(#0a3d22,#052313)'],['lava','Lava','rare','linear-gradient(120deg,#3a0a00,#ff4d00,#ffb020)'],['glacier','Glacier','rare','linear-gradient(120deg,#d8f3ff,#7cc8ff,#2a5d9a)'],['stripes','Racing stripes','rare','repeating-linear-gradient(45deg,#c62828 0 14px,#fff 14px 22px,#1a1a1a 22px 36px)'],
 ['goldrush','Gold rush','epic','linear-gradient(120deg,#6b4e00,#f2c14e,#6b4e00)'],['nebula','Nebula','epic','radial-gradient(circle at 20% 30%,#7c4dff,transparent 55%),radial-gradient(circle at 80% 70%,#ff2bd6,transparent 55%),#0b0620'],['prism','Prism','epic','linear-gradient(120deg,#ff5f6d,#ffc371,#47e891,#4aa8ff,#b36bff,#ff5f6d)',1],
 ['holo','Hologram','legendary','linear-gradient(120deg,#9ad7ff,#ffd1f0,#b8ffe6,#fff3a6,#9ad7ff)',1],['royal','Royal court','legendary','linear-gradient(120deg,#2a0a4a,#7a2bd6,#f2c14e,#7a2bd6,#2a0a4a)',1],
 ['winter','Winter','special','linear-gradient(120deg,#0a1a2f,#3b6ea5,#eaf6ff)',0,'winter'],['arcade','Arcade','special','linear-gradient(120deg,#160032,#ff2bd6,#ffe600)',0,'arcadeth'],['abyss','Abyss','special','linear-gradient(120deg,#01121c,#0f5f7a,#2ee6d6)',0,'abyss'],['sakura','Sakura','special','linear-gradient(120deg,#ffd6e3,#ff9ebb,#fff1f5)',0,'sakura'],['haunted','Haunted','special','linear-gradient(120deg,#0d0612,#7a3a0a,#ff7a18)',0,'halloween'],['galaxy','Galactic','special','radial-gradient(circle at 20% 40%,#2b2b6a,#000 60%)',0,'starwars'],['hyper','Hyper','special','linear-gradient(120deg,#ff2bd6,#00f5d4,#ffe600)',1,'dopamine'],['matrixb','Digital rain','special','repeating-linear-gradient(90deg,#000 0 6px,#031a08 6px 12px)',0,'matrix']];
const NFDEF=[ // key, name, rarity, owning theme
 ['','Plain','free'],['glow','Glow','common'],['outline','Outline','common'],['shadow','Long shadow','common'],['wave','Wave','rare'],['underline','Animated underline','rare'],['ember','Ember','rare'],['sparkle','Sparkle','rare'],['rainbow','Rainbow','epic'],['gold','Gilded','epic'],['chrome','Chrome','epic'],['typed','Typewriter','epic'],['holo','Hologram','legendary'],
 ['frost','Frost','special','winter'],['neon','Neon','special','arcadeth'],['deep','Deep glow','special','abyss'],['petal','Petal','special','sakura'],['saber','Saber','special','starwars'],['spooky','Spooky','special','halloween'],['glitch','Glitch','special','matrix'],['dopa','Hyper','special','dopamine']];
const PETS={cat:['🐱','Study Cat','common','hop'],dog:['🐶','Loyal Pup','common','hop'],chick:['🐥','Little Chick','common','hop'],owl:['🦉','Night Owl','rare','bob'],robot:['🤖','Robo Buddy','rare','bob'],fox:['🦊','Clever Fox','rare','hop'],ghost:['👻','Friendly Ghost','epic','float'],dragon:['🐉','Baby Dragon','epic','bob'],ufo:['🛸','Tiny UFO','epic','float'],unicorn:['🦄','Unicorn','legendary','float'],eagle:['🦅','Sky Guardian','legendary','float']};
const TRAILS={sparkle:['✨','Sparkle trail','common'],stars:['⭐','Star trail','common'],hearts:['💖','Heart trail','rare'],pixels:['🟪','Pixel trail','rare'],bubbles:['🫧','Bubble trail','rare'],stardust:['🌠','Stardust','epic'],flame:['🔥','Flame trail','epic'],ribbon:['🌈','Rainbow ribbon','legendary']};
const CLICKS={pop:['⭐','Star pop','common'],hearts:['❤️','Heart burst','common'],confetti:['🎉','Confetti pop','rare'],sparks:['⚡','Sparks','rare'],petals:['🌸','Petal burst','rare'],coins:['🪙','Coin shower','epic'],bolt:['🌩','Lightning','epic'],fireworks:['🎆','Fireworks','legendary']};
const CHIPS={glass:['Frosted glass','common'],pill:['Ringed pill','common'],neon:['Neon outline','rare'],pixel:['Pixel badge','rare'],ticket:['Ticket','rare'],holo:['Holographic','epic'],gold:['Royal gold','legendary']};
const CRATESK={gift:{i:'🎁',n:'Gift box',r:'common',c:'#ff5c8a'},toolbox:{i:'🧰',n:'Toolbox',r:'common',c:'#ffb020'},case:{i:'💼',n:'Briefcase',r:'rare',c:'#4aa8ff'},urn:{i:'🏺',n:'Ancient urn',r:'rare',c:'#e0a96d'},pinata:{i:'🪅',n:'Piñata',r:'rare',c:'#ff7a45'},egg:{i:'🥚',n:'Mystery egg',r:'epic',c:'#b36bff'},orb:{i:'🔮',n:'Crystal orb',r:'epic',c:'#7c4dff'},pod:{i:'🛸',n:'Alien pod',r:'epic',c:'#00f5d4'},vault:{i:'🏦',n:'Vault',r:'legendary',c:'#ffd54a'}};
const LVFX={coins:['🪙','Coin rain','common'],stars:['🌟','Star shower','rare'],shock:['💥','Shockwave','epic'],firework:['🎆','Fireworks','epic'],aurora:['🌌','Golden aurora','legendary']};
const TOASTS={terminal:['Terminal','common'],glass:['Frosted glass','common'],bubble:['Speech bubble','rare'],paper:['Paper note','rare'],pixel:['Pixel box','rare'],neon:['Neon sign','epic']};
BNDEF.forEach(b=>{if(b[2]!=='free'&&b[2]!=='special')addC('banner','bn_'+b[0],b[1]+' banner',b[2],{key:b[0],css:b[3],anim:b[4]})});
NFDEF.forEach(b=>{if(b[2]!=='free'&&b[2]!=='special')addC('nfx','nf_'+b[0],b[1]+' name effect',b[2],{key:b[0]})});
Object.entries(PETS).forEach(([k,p])=>addC('pet','pet_'+k,p[1],p[2],{key:k,i:p[0],beh:p[3]}));
Object.entries(TRAILS).forEach(([k,p])=>addC('trail','trl_'+k,p[1],p[2],{key:k,i:p[0]}));
Object.entries(CLICKS).forEach(([k,p])=>addC('clickfx','clk_'+k,p[1],p[2],{key:k,i:p[0]}));
Object.entries(CHIPS).forEach(([k,p])=>addC('chip','chp_'+k,p[0]+' top bar',p[1],{key:k,i:'🏷'}));
Object.entries(CRATESK).forEach(([k,p])=>addC('crate','crt_'+k,p.n+' crate skin',p.r,{key:k,i:p.i}));
Object.entries(LVFX).forEach(([k,p])=>addC('lvfx','lvf_'+k,p[1]+' level-up',p[2],{key:k,i:p[0]}));
Object.entries(TOASTS).forEach(([k,p])=>addC('toast','tst_'+k,p[0]+' notifications',p[1],{key:k,i:'💬'}));
BOX.fun.cats.push('pet','trail','clickfx','nfx','lvfx');BOX.fun.d='Avatars, titles, flairs, confetti, cursors, click sounds, companions, trails, click effects, name effects and level-up shows.';
BOX.style.cats.push('banner','chip','toast','crate');BOX.style.d='Themes, backgrounds, frames, card styles, banners, top bar styles, notification styles and crate skins.';
const PACKTH={wi:'winter',ar:'arcadeth',ab:'abyss',sk:'sakura'};
const hiddenItem=x=>!!((SPEC[x.id]&&!M.inv.own[x.id])||(x.pack&&PACKTH[x.pack]&&!M.inv.own[PACKTH[x.pack]]));
function newPV(it){const k=it.key;
 if(it.c==='banner')return `<div class="bnpv ${it.anim?'anim':''}" style="background:${it.css}"></div>`;
 if(it.c==='nfx')return `<div class="pv t"><span class="who nfx-${k}">Your name</span></div>`;
 if(it.c==='chip')return `<div class="chippv" data-chip="${k}">🦊 Lv 5 · 120 SP</div>`;
 if(it.c==='toast')return `<div class="toastpv" data-toast="${k}">Nice work! +5 SP</div>`;
 if(it.c==='trans')return `<div class="trpv" data-tr="${k}"><i></i></div>`;
 return `<div class="pv xl">${it.i||''}</div>`}

