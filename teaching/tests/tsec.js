const SITE='file://'+require('path').resolve(process.env.SITE||__dirname+'/../dist/MP_PRODUCTIONS_TEACHING_6.html');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const p=await b.newPage({viewport:{width:1400,height:700}});p.on('pageerror',x=>errs.push(x.message));p.on('console',m=>m.type()==='error'&&errs.push('c:'+m.text()));
await p.addInitScript(()=>{localStorage.setItem('mp-welcomed','2')});
await p.goto(SITE);await p.waitForTimeout(1200);
await p.evaluate(()=>{document.querySelectorAll('#wgov,#rcov').forEach(x=>x.remove());M.admin=1;M.coins=9999;CATALOG.forEach(c=>M.inv.own[c.id]=1);buildOpts();shopEquip('aigf',true)});await p.waitForTimeout(1800);
const E=(f,a)=>p.evaluate(f,a);
await E(()=>SFX.closeM());
const html=await E(()=>{let h='<body style="margin:0;background:#fff0f6">';for(const [a,g] of [['moon','n'],['ace','m'],['ink','f']])for(const i of [0,2,4])h+='<div style="display:inline-block;width:230px">'+AIX.svg(a,g,i,'','')+'</div>';return h});
const q=await b.newPage({viewport:{width:1400,height:560}});await q.setContent(html);await q.screenshot({path:process.env.S+'/ai_sec.png'});
// locked state
await E(()=>SFX.SM.aipick());await p.screenshot({path:process.env.S+'/ai_sec_pick.png'});
console.log('locked switch',await E(()=>{SFX.SM.aiP({dataset:{v:'moon.n'}});return AIX.R().cur}));
// unlock all
await E(()=>{const r=AIX.R();const d=Math.floor(Date.now()/864e5);r.sk={nt:[d-3,d-2],pk:2,rt:0};});
// moon via night SP simulation: fake hour
await E(()=>{const O=Date;const R=AIX.R();R.sk.nt=[1];});
await E(()=>{const Rr=AIX.R();Rr.sec={moon:1,ace:1,ink:1}});
for(const k of ['moon.n','ace.m','ink.f']){console.log(k,await E(k=>{SFX.SM.aiP({dataset:{v:k}});SFX.closeM();const x=AIX.ctx();AIX.say('st');return [AIX.R().cur,x.c.line.slice(0,60)]},k))}
await E(()=>{SFX.SM.aiP({dataset:{v:'ace.m'}});SFX.closeM();SFX.SM.aiDuel({dataset:{}});SFX.SM.aiDuel({dataset:{v:'4'}});addSP(4,'t')});await p.waitForTimeout(1500);
console.log('duel',await E(()=>[JSON.stringify(AIX.ctx().c.pl),AIX.ctx().c.line,JSON.stringify(AIX.R().sk)]));
await E(()=>{SFX.SM.aiP({dataset:{v:'moon.n'}});SFX.closeM();SFX.SM.aiMid()});console.log('mid',await E(()=>document.getElementById('sfmod').innerText.slice(0,160)));
await E(()=>{SFX.SM.aiP({dataset:{v:'ink.f'}});SFX.closeM();AIX.CC('yan.f').met=1;AIX.CC('yan.f').sus=50;SFX.SM.aiArchive()});await p.screenshot({path:process.env.S+'/ai_arch.png'});
await E(()=>{SFX.SM.aiMeet({dataset:{v:'yan.f'}})});console.log('scene w/ secret',await E(()=>document.getElementById('sfmod').innerText.slice(0,200)));
await E(()=>{SFX.closeM();SFX.SM.aiThink({dataset:{v:'yan.f'}})});console.log(await E(()=>AIX.ctx().c.line));
await E(()=>{SFX.closeM();SFX.SM.aipick()});await p.screenshot({path:process.env.S+'/ai_sec_pick2.png'});
// real unlock paths
await E(()=>{const r=AIX.R();r.sec={};r.sk={nt:[],pk:0,rt:0}});
await E(()=>{const H=Date.prototype.getHours;Date.prototype.getHours=()=>2;window.__H=H;SFX.SM.aiP({dataset:{v:'sweet.f'}});SFX.closeM();addSP(1,'t')});await p.waitForTimeout(800);
console.log('night1',await E(()=>JSON.stringify(AIX.R().sk)));
await E(()=>{AIX.R().sk.nt=[1];addSP(1,'t')});await p.waitForTimeout(800);console.log('night2',await E(()=>JSON.stringify([AIX.R().sec,AIX.R().sk])));
console.log(errs);await b.close()})();
