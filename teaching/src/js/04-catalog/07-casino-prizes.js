/* ===== v15: casino prize items (play-money chips only) ===== */
const CAS_PRICE={common:250,rare:800,epic:2200,legendary:5000};
const casAdd=(c,id,n,r,x)=>{x=Object.assign({noDrop:true,cas:1},x||{});addU(c,id,n,r,x)};
[['🎰','common'],['🎲','common'],['🃏','rare'],['🤑','rare'],['♠️','epic'],['💰','legendary']].forEach(([e,r])=>casAdd('avatar','av_'+e,'Avatar '+e,r,{av:e}));
Object.entries({common:['Lucky Seven'],rare:['Card Counter','High Roller'],epic:['All In'],legendary:['The House Always Wins (Except Today)']}).forEach(([r,l])=>l.forEach(t=>casAdd('title','t_'+t,t,r,{title:t})));
[['♠','common'],['♥','common'],['♦','rare'],['♣','rare'],['777','epic'],['🎰','legendary']].forEach(([f,r])=>casAdd('flair','fl_'+f,'Flair '+f,r,{flair:f}));
BNDEF.push(['feltb','Green felt','rare','repeating-linear-gradient(45deg,#0c3a29 0 6px,#0f4a34 6px 12px)'],['neonlights','Neon lights','epic','linear-gradient(120deg,#ff2bd6,#ffd54a,#00f5d4,#ff2bd6)',1],['royalflush','Royal flush','legendary','linear-gradient(120deg,#8a1c1c,#f2c14e,#8a1c1c,#f2c14e)',1]);
BNDEF.slice(-3).forEach(b=>casAdd('banner','bn_'+b[0],b[1]+' banner',b[2],{key:b[0],css:b[3],anim:b[4]}));
NFDEF.push(['goldcoin','Gold coin','rare'],['marquee','Marquee','epic']);
NFDEF.slice(-2).forEach(b=>casAdd('nfx','nf_'+b[0],b[1]+' name effect',b[2],{key:b[0]}));
Object.assign(PETS,{luckycat:['🐈','Lucky Cat','rare','bob'],acecard:['🃏','Ace of Spades','epic','float']});
['luckycat','acecard'].forEach(k=>casAdd('pet','pet_'+k,PETS[k][1],PETS[k][2],{key:k,i:PETS[k][0],beh:PETS[k][3]}));
Object.assign(TRAILS,{cointr:['🪙','Coin trail','common'],dicetr:['🎲','Dice trail','rare'],cardtr:['🃏','Card trail','epic']});
['cointr','dicetr','cardtr'].forEach(k=>casAdd('trail','trl_'+k,TRAILS[k][1],TRAILS[k][2],{key:k,i:TRAILS[k][0]}));
Object.assign(CLICKS,{chiptoss:['🪙','Chip toss','common'],diceroll:['🎲','Dice roll','rare'],jackpotc:['🎰','Jackpot!','legendary']});
['chiptoss','diceroll','jackpotc'].forEach(k=>casAdd('clickfx','clk_'+k,CLICKS[k][1],CLICKS[k][2],{key:k,i:CLICKS[k][0]}));
Object.assign(CHIPS,{slotwin:['Slot window','rare'],casinomarq:['Casino marquee','epic']});
['slotwin','casinomarq'].forEach(k=>casAdd('chip','chp_'+k,CHIPS[k][0]+' top bar',CHIPS[k][1],{key:k,i:'🏷'}));
Object.assign(TOASTS,{ticket:['Casino ticket','rare'],jackpot:['Jackpot','legendary']});
['ticket','jackpot'].forEach(k=>casAdd('toast','tst_'+k,TOASTS[k][0]+' notifications',TOASTS[k][1],{key:k,i:'💬'}));
Object.assign(CRATESK,{moneybag:{i:'💰',n:'Money bag',r:'rare',c:'#ffd54a'},slotmachine:{i:'🎰',n:'Slot machine',r:'epic',c:'#ff4d4d'}});
['moneybag','slotmachine'].forEach(k=>casAdd('crate','crt_'+k,CRATESK[k].n+' crate skin',CRATESK[k].r,{key:k,i:CRATESK[k].i}));
Object.assign(LVFX,{dicefall:['🎲','Dice fall','rare','🎲'],jackpotfx:['🎰','Jackpot shower','legendary','🪙',1]});
['dicefall','jackpotfx'].forEach(k=>casAdd('lvfx','lvf_'+k,LVFX[k][1]+' level-up',LVFX[k][2],{key:k,i:LVFX[k][0]}));
Object.assign(CFSETS,{casino:['🎰','🪙','🃏','🎲']});casAdd('confetti','cf_casino','Casino night','epic',{cf:'casino',i:'🎰🪙🃏🎲'});
casAdd('cursor','cur_dice','Dice','rare',{key:'dice',i:'🎲'});
casAdd('frame','frame_marquee','Marquee lights (moving)','epic',{key:'marquee'});
casAdd('card','card_felttable','Felt table','rare',{key:'felttable'});
casAdd('bg','bg_feltbg','Casino felt','rare',{key:'feltbg'});casAdd('bg','bg_vegascarpet','Vegas carpet','epic',{key:'vegascarpet'});
[['slotding','Slot ding','rare'],['chipclack','Chip clack','common']].forEach(([k,n,r])=>casAdd('sound','snd_'+k,n,r,{key:k,i:'🔊'}));
casAdd('skin','sk_vegas','Vegas headings','epic',{skin:'vegas',d:'Headings flanked by card suits.',i:'♠ Vegas ♦'});
const CAS_ITEMS=CATALOG.filter(x=>x.cas).map(x=>x.id);

const cat=id=>CATALOG.find(x=>x.id===id);
const CATN={theme:'Themes',font:'Fonts',avatar:'Avatars',title:'Titles',flair:'Flairs',confetti:'Confetti',skin:'Text skins',bg:'Backgrounds',cursor:'Cursors',frame:'Frames',card:'Card styles',sound:'Click sounds',banner:'Banners',nfx:'Name effects',pet:'Companions',trail:'Cursor trails',clickfx:'Click effects',chip:'Top bar styles',crate:'Crate skins',lvfx:'Level-up shows',toast:'Notification styles'};
/* level road: every level gives something. Levels without an entry give a Study Crate, every 5th a Golden Crate. */
const LVR={
 2:{c:1,items:['t_Hello, World']},3:{c:1,items:['f_comic']},4:{c:1,items:['av_🐱'],sup:{freeze:1}},5:{g:1,items:['t_Off By One','fl_★']},
 6:{c:2,items:['f_times']},7:{g:1,items:['t_The Whole Real Line','av_🧙']},8:{c:2,items:['cf_books']},9:{g:1,items:['f_elite']},
 10:{g:2,items:['t_Cache Me If You Can','fl_♛']},12:{g:1,c:1,items:['av_🐉']},15:{g:2,items:['t_Turing Complete (Barely)']},20:{g:3,items:['t_Lord Of The Registers']}};
Object.assign(LVR,{11:{c:1,items:['bg_dots']},12:{g:1,c:1,items:['av_🐉','cur_rocket']},13:{c:1,items:['snd_pop']},14:{c:2,items:['card_soft']},15:{g:2,items:['t_Turing Complete (Barely)','frame_gold']},
 16:{c:1,items:['f_consolas']},17:{c:1,items:['bg_lined']},18:{c:2,items:['cf_sparkles']},19:{c:1,items:['sk_script']},20:{g:3,items:['t_Lord Of The Registers','card_glass']},
 21:{c:1,items:['av_🦁']},22:{c:2,items:['snd_type']},23:{c:1,items:['fl_☀']},24:{c:2,items:['bg_stars']},25:{g:3,items:['frame_neon','t_Student Of The Century']},
 26:{c:2,items:['cur_wand']},27:{c:1,items:['f_garamond']},28:{c:2,items:['card_comic']},29:{c:1,items:['av_🦚']},30:{g:4,items:['dopamine','sk_gothic']},
 35:{g:3,items:['frame_fire']},40:{g:4,items:['frame_rainbow','t_The Compiler Fears Me']},45:{g:4,items:['bg_aurora']},50:{g:6,items:['t_Grand Architect Of Bits','f_zapf']}});
function lvReward(l){return LVR[l]||(l%5===0?{g:1}:{c:1})}
function lvText(l){const r=lvReward(l),a=[];if(r.c)a.push(`${r.c}× 📦 Study Crate`);if(r.g)a.push(`${r.g}× 🎁 Golden Crate`);(r.items||[]).forEach(id=>{const it=cat(id);if(it)a.push((['confetti','skin','cursor','sound','pet','trail','clickfx','crate','lvfx'].includes(it.c)?(it.i||'')+' ':'')+it.n)});if(r.sup&&r.sup.freeze)a.push('🧊 Streak freeze');
 Object.values(XT).forEach(x=>{if(!x.box&&x.lv===l)a.push('🎨 '+x.n+' theme')});Object.values(PERK).forEach(x=>{if(x.lv===l)a.push('✨ '+x.n)});return a}
function claimLevels(){const L=lvlOf(M.sp);let n=0,got=[];
 if((M.lvv||0)<3){for(let l=2;l<=Math.min(M.lvClaim||1,L);l++)(lvReward(l).items||[]).forEach(id=>{if(cat(id))M.inv.own[id]=1});M.lvv=3;mDirty=true}
 for(let l=Math.max(2,(M.lvClaim||1)+1);l<=L;l++){const r=lvReward(l);M.inv.box.crate+=r.c||0;M.inv.box.gold+=r.g||0;(r.items||[]).forEach(id=>{M.inv.own[id]=1});if(r.sup)Object.entries(r.sup).forEach(([k,v])=>{M.inv.qty[k]=(M.inv.qty[k]||0)+v});n++}
 M.lvClaim=Math.max(M.lvClaim||1,L);if(n){mDirty=true;paintChip()}}

