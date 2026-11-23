const SITE='file://'+require('path').resolve(process.env.SITE||__dirname+'/../dist/MP_PRODUCTIONS_TEACHING_6.html');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const p=await b.newPage({viewport:{width:1300,height:800}});p.on('pageerror',x=>errs.push(x.message));
await p.addInitScript(()=>{localStorage.setItem('mp-welcomed','2')});
await p.goto(SITE);await p.waitForTimeout(1200);
await p.evaluate(()=>{document.querySelectorAll('#wgov,#rcov').forEach(x=>x.remove());M.admin=1;CATALOG.forEach(c=>M.inv.own[c.id]=1);buildOpts();shopEquip('aigf',true)});
await p.waitForTimeout(1800);
const go=k=>p.evaluate(k=>{SFX.SM.aiP({dataset:{v:k}});const o=AIX.R().cs;return Object.fromEntries(Object.entries(o).map(([q,c])=>[q,[Math.round(c.aff),Math.round(c.jl||0)]]))},k);
for(const a of ['yan','sweet','tsun','dan','kuu']){await p.evaluate(a=>{SFX.SM.aiP({dataset:{v:a+'.f'}});AIX.R().cs[a+'.f'].aff=60;AIX.R().cs[a+'.f'].jl=0},a)}
console.log(await go('yan.f'));console.log(await go('sweet.m'));
for(const a of ['yan','sweet','tsun','dan','kuu']){
 await p.evaluate(a=>{SFX.SM.aiP({dataset:{v:a+'.f'}})},a);
 const r=await p.evaluate(a=>{const c=AIX.CC(a+'.f');c.jl=0;c.aff=60;SFX.SM.aiP({dataset:{v:'kuu.m'}});SFX.SM.aiP({dataset:{v:a+'.f'}});return [a,Math.round(AIX.CC(a+'.f').aff),Math.round(AIX.CC(a+'.f').jl),AIX.ctx().c.line]},a);console.log(r)}
await p.evaluate(()=>{SFX.closeM();SFX.SM.aiask()});
await p.screenshot({path:process.env.S+'/ai_je.png'});
await p.evaluate(()=>SFX.SM.aiRe());console.log(await p.evaluate(()=>[AIX.ctx().c.jl,AIX.ctx().c.line]));
console.log(errs);await b.close()})();
