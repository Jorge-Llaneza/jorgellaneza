/* ===== v6 part 3: economy ===== */
/* Learning pays in full for the first 120 SP each day, then tapers but never stops. */
const FOCUS=[[150,1],[300,.5],[450,.25],[650,.1],[900,.04],[Infinity,0]];
function drScale(t,n){let pos=t,rem=n,out=0;for(const [lim,m] of FOCUS){if(pos>=lim)continue;const take=Math.min(rem,lim-pos);out+=take*m;pos+=take;rem-=take;if(rem<=0)break}return out}
function focusInfo(){const t=M.ld[dayN()]||0;let i=0;while(i<FOCUS.length-1&&t>=FOCUS[i][0])i++;return{t:Math.floor(t),m:FOCUS[i][1],i,full:Math.max(0,Math.ceil(150-t))}}
const f1=x=>String(Math.round(x*10)/10);
function focusHTML(){const f=focusInfo(),txt=f.i===0?`Full rewards · ${f.full} SP left at full rate today`:`Cooling down · now paying ×${f.m} (never zero)`;
 return `<div class="mut" style="font-size:12px">⚡ Focus meter: ${txt}</div><div class="fcs">${FOCUS.slice(0,5).map((_,k)=>`<i class="${k<=f.i?'on':''}"></i>`).join('')}</div>`}
function focusItem(){const f=focusInfo();return `<div class="it"><span>⚡ Focus: <b>${f.i===0?'full rewards':f.m===0?'maximum reached':'×'+f.m}</b>${f.i===0?` · ${f.full} SP left at full rate`:' · resets at midnight'}</span></div>`}
function addSP(n,why,kind){kind=kind||'learn';const hxK=kind==='hx';if(hxK)kind='game';try{dcEnsure()}catch(e){}if(!(n>0))return 0;const d=dayN();
 if(kind==='game'){if(!hxK){if(M.gsp.d!==d)M.gsp={d,n:0};n=Math.min(n,Math.max(0,GCAP-M.gsp.n));if(n<=0)return 0;M.gsp.n+=n}}
 else{n=drScale(M.ld[d]||0,n);if(n<=0)return 0}
 const before=lvlOf(M.sp);M.sp+=n;M.days[d]=(M.days[d]||0)+n;M.coins+=(kind!=='game'&&M.inv.boost>Date.now())?n*2:n;
 if(kind!=='game'){const tb=M.ld[d]||0;M.ld[d]=tb+n;M.loot.prog+=n;
  if(!M.fcd||M.fcd.d!==d)M.fcd={d,n:0};
  while(M.loot.prog>=FREEAT){M.loot.prog-=FREEAT;if(M.fcd.n<4){M.fcd.n++;M.inv.box.crate++;toast('📦 You earned a free Study Crate! Open it in the Shop.')}}
  {const _sm=window.stkMin?window.stkMin():STREAKMIN;if(tb<_sm&&M.ld[d]>=_sm&&window.stkExtend)window.stkExtend(d)}
  if(!M.goal[d]&&M.ld[d]>=GOAL){M.goal[d]=1;M.sp+=10;M.coins+=10;M.days[d]+=10;M.ld[d]+=10;toast('🎯 Daily goal reached! +10 SP and +10 🪙');confetti()}}
 const after=lvlOf(M.sp);if(after>before){levelUp(before,after);motif('level');try{lvShow()}catch(e){}}
 mDirty=true;paintChip();if(cur==='')softRefresh();if(typeof reelPop==='function')reelPop(n);try{fxXP(n);checkQuests();petReact(n);dcCheck();checkAch();if(kind!=='game')tmOnSP(n);mxOnSP(n,why,after>before?after:0,kind)}catch(e){}return n}
/* learning rewards: one-time ids, a short cooldown, and the focus meter above. No hard daily caps. */
let lastLearn=0;const lastWhy={};
function learn(o){const now=Date.now(),d=dayN();if(!(o&&o.sp>0))return 0;
 if(o.id&&M.done[o.id])return 0;
 const why=o.why||'learn';
 if(focusInfo().m===0){toast('You hit today\u2019s maximum, great work! Come back tomorrow.');return 0}
 if(now-lastLearn<3000||now-(lastWhy[why]||0)<(o.id&&/lesson/.test(o.id)?3000:8000))return 0;
 lastLearn=now;lastWhy[why]=now;
 if(o.id){M.done[o.id]=1;const k=Object.keys(M.done);if(k.length>4000)delete M.done[k[0]]}
 let g=addSP(o.sp,why);dcInc('learn');if(/lesson/.test(o.id||''))dcInc('lessons');
 const lab=META.some(a=>a.id===cur)?cur:'';
 if(lab){if(!M.wu||M.wu.d!==d)M.wu={d,k:{}};if(!M.wu.k[lab]){M.wu.k[lab]=1;g+=addSP(3,'warmup');toast(`📘 +${f1(g)} SP · ${why} (includes +3 first-of-the-day bonus for this lab)`);return g}}
 if(g>0)toast(`📘 +${f1(g)} SP · ${why}`);return g}
function noteSP(n,why){const d=dayN();if(!M.rv||M.rv.d!==d)M.rv={d,n:0};n=Math.min(n,Math.max(0,40-M.rv.n));if(n<=0)return 0;M.rv.n+=n;return addSP(n,why)}
