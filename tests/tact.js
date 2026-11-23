const SITE='file://'+require('path').resolve(process.env.SITE||__dirname+'/../dist/MP_PRODUCTIONS_TEACHING_6.html');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const p=await b.newPage({viewport:{width:390,height:800}});p.on('pageerror',x=>errs.push(x.message));
await p.addInitScript(()=>{localStorage.setItem('mp-welcomed','2')});
await p.goto(SITE);await p.waitForTimeout(1200);
await p.evaluate(()=>{document.querySelectorAll('#wgov,#rcov').forEach(x=>x.remove());M.admin=1;CATALOG.forEach(c=>M.inv.own[c.id]=1);buildOpts();shopEquip('aigf',true)});await p.waitForTimeout(1800);
const E=(f,a)=>p.evaluate(f,a);
await E(()=>{SFX.closeM();SFX.SM.aiP({dataset:{v:'yan.f'}});AIX.CC('sweet.f').met=1;SFX.closeM()});
// chat
await E(()=>SFX.SM.aiChat({dataset:{}}));
for(const t of ['hello','I love you','i am so tired','thanks','talking with Hana today','what is the weather']){console.log(t,'=>',await E(t=>{document.getElementById('aichi').value=t;SFX.SM.aiChat({dataset:{}});return AIX.ctx().c.line},t).catch(e=>e.message));await E(()=>SFX.SM.aiChat({dataset:{}}))}
console.log('jl',await E(()=>Math.round(AIX.ctx().c.jl)));
await p.screenshot({path:process.env.S+'/ai_chat.png'});
// confide
for(const k of ['st','ti','pr','lo','pz'])await E(k=>SFX.SM.aiCf({dataset:{v:k}}),k);console.log('cf',await E(()=>AIX.ctx().c.line));
// pledge
await E(()=>SFX.SM.aiPl({dataset:{v:'3'}}));const a1=await E(()=>JSON.stringify(AIX.ctx().c.pl));await E(()=>addSP(3,'t'));await p.waitForTimeout(1200);console.log('pledge',a1,await E(()=>JSON.stringify(AIX.ctx().c.pl)),await E(()=>AIX.ctx().c.line));
await E(()=>{SFX.SM.aiTog();});await p.screenshot({path:process.env.S+'/ai_tog.png'});
await E(()=>{AIX.ctx().c.pl={d:'x',need:5,from:0,done:0}});await p.waitForTimeout(1500);console.log('failed pledge',await E(()=>[AIX.ctx().c.pl,AIX.ctx().c.line]));
// rps + tod
for(const a of ['sweet.f','tsun.f','yan.f','dan.f','kuu.f']){await E(a=>{SFX.SM.aiP({dataset:{v:a}});for(let i=0;i<6;i++)SFX.SM.aiRps({dataset:{v:String(i%3)}})},a)}
await E(()=>{SFX.SM.aiTod({dataset:{}});SFX.SM.aiTod({dataset:{v:'truth'}});SFX.SM.aiTod({dataset:{v:'tans'}});SFX.SM.aiTod({dataset:{v:'dare'}});SFX.SM.aiTod({dataset:{v:'done'}});SFX.SM.aiTod({dataset:{v:'skip'}})});
// time of day
await E(()=>{const c=AIX.ctx().c;c.tod='';c.lt=0});await p.waitForTimeout(8500);console.log('tod hour',await E(()=>new Date().getHours()),await E(()=>AIX.ctx().c.line));
console.log(errs);await b.close()})();
