const SITE='file://'+require('path').resolve(process.env.SITE||__dirname+'/../dist/MP_PRODUCTIONS_TEACHING_6.html');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const p=await b.newPage({viewport:{width:1300,height:800}});p.on('pageerror',x=>errs.push(x.message));p.on('console',m=>m.type()==='error'&&errs.push('c:'+m.text()));
await p.addInitScript(()=>{localStorage.setItem('mp-welcomed','2')});
await p.goto(SITE);await p.waitForTimeout(1200);
await p.evaluate(()=>{document.querySelectorAll('#wgov,#rcov').forEach(x=>x.remove());M.admin=1;M.coins=9999;CATALOG.forEach(c=>M.inv.own[c.id]=1);buildOpts();shopEquip('aigf',true)});
await p.waitForTimeout(1800);await p.evaluate(()=>SFX.closeM());
const A=['sweet','tsun','yan','dan','kuu'];
// all 15 scenes
let n=0;
for(let i=0;i<5;i++)for(let j=i;j<5;j++){const r=await p.evaluate(([a,b])=>{const R=AIX.R();const hk=a+'.f',vk=b+(a===b?'.m':'.f');SFX.SM.aiP({dataset:{v:hk}});AIX.CC(vk).met=1;AIX.CC(hk).met=1;SFX.SM.aiMeet({dataset:{v:vk}});const html=document.getElementById('sfmod').innerText;SFX.SM.aiMeetC({dataset:{v:'1'}});return html.slice(0,60).replace(/\n/g,' | ')+' >> '+AIX.ctx().c.line.slice(0,40)},[A[i],A[j]]);n++;if(n<=3)console.log(r)}
console.log('scenes ok',n);
await p.evaluate(()=>{SFX.SM.aiP({dataset:{v:'kuu.f'}});SFX.SM.aiThink({dataset:{}});SFX.SM.aiThink({dataset:{v:'yan.f'}});});
console.log(await p.evaluate(()=>AIX.ctx().c.line));
// yandere plot
const st=await p.evaluate(()=>{const R=AIX.R();for(const k of Object.keys(R.cs)){const c=R.cs[k];c.sus=0;c.gone=null;c.pend=0}
 const y=AIX.CC('yan.f');y.met=1;y.lv=3;y.xp=60;y.aff=80;SFX.SM.aiP({dataset:{v:'sweet.f'}});const s=AIX.CC('sweet.f');
 for(let i=0;i<70;i++){SFX.SM.aiGive({dataset:{v:'flowers'}})}
 return [Math.round(y.sus),s.pend,AIX.dnx&&1]});
console.log('after bonding',st);
await p.evaluate(()=>{const s=AIX.CC('sweet.f');s.pend=s.pend-1});await p.waitForTimeout(1500);
console.log('gone?',await p.evaluate(()=>JSON.stringify(AIX.CC('sweet.f').gone)));
await p.screenshot({path:process.env.S+'/ai_gone_dock.png'});
await p.evaluate(()=>SFX.SM.aiP({dataset:{v:'kuu.f'}}));await p.evaluate(()=>SFX.SM.aiP({dataset:{v:'sweet.f'}}));
await p.screenshot({path:process.env.S+'/ai_gone_modal.png'});
console.log(await p.evaluate(()=>{SFX.SM.aiGCall({dataset:{v:'sweet.f'}});return document.getElementById('sfmod').innerText.slice(0,260)}));
console.log(await p.evaluate(()=>{SFX.SM.aiGAsk({dataset:{v:'sweet.f'}});return document.getElementById('sfmod').innerText.slice(0,260)}));
await p.evaluate(()=>{AIX.CC('sweet.f').gone.until=Date.now()-1});await p.waitForTimeout(1500);
await p.evaluate(()=>{SFX.closeM();SFX.SM.aiP({dataset:{v:'sweet.f'}})});
console.log('return',await p.evaluate(()=>[AIX.R().cur,AIX.ctx().c.line,AIX.ctx().c.ret]));
// visitor banner
await p.evaluate(()=>{AIX.R().vis={k:'tsun.f',t:Date.now()};AIX.ctx().c.lt=0});await p.waitForTimeout(1500);
console.log('banner',await p.evaluate(()=>!!document.querySelector('#sfdock [data-sf=meet]')));
await p.evaluate(()=>{SFX.SM.aiMeet({dataset:{v:'tsun.f'}})});await p.screenshot({path:process.env.S+'/ai_scene.png'});
console.log(errs);await b.close()})();
