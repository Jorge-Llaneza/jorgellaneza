const SITE='file://'+require('path').resolve(process.env.SITE||__dirname+'/../dist/MP_PRODUCTIONS_TEACHING_6.html');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,n] of [[1300,800,'d'],[390,800,'m']]){
const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',x=>errs.push(n+x.message));p.on('console',m=>m.type()==='error'&&errs.push(n+'c:'+m.text()));
await p.addInitScript(()=>{localStorage.setItem('mp-welcomed','2');window.prompt=()=>'Alex'});
await p.goto(SITE);await p.waitForTimeout(1200);
await p.evaluate(()=>{document.querySelectorAll('#wgov,#rcov').forEach(x=>x.remove());M.admin=1;M.coins=5000;CATALOG.forEach(c=>M.inv.own[c.id]=1);buildOpts();shopEquip('aigf',true)});
await p.waitForTimeout(1800);
const T=(s,v)=>`SFX.SM.${s}({dataset:{v:${JSON.stringify(v||'')}}})`;
const ev=(f,a)=>p.evaluate(f,a);
console.log(n,'modal open?',await ev(()=>!!document.getElementById('sfmod')));
await p.screenshot({path:`${process.env.S}/ai3_${n}_pick.png`});
// switch to each of 3 and study
await ev(()=>{SFX.SM.aiP({dataset:{v:'yan.f'}})});await p.waitForTimeout(300);
await ev(()=>{const x=AIX.ctx();x.c.aff=20;});
await ev(()=>{SFX.SM.aiP({dataset:{v:'sweet.f'}})});await p.waitForTimeout(300);
console.log(n,'sweet.f aff',await ev(()=>AIX.CC('sweet.f').aff),'yan.f aff',await ev(()=>AIX.CC('yan.f').aff));
await ev(()=>SFX.closeM&&SFX.closeM());
await ev(()=>{addSP(3,'t')});await p.waitForTimeout(1300);
console.log(n,'after SP sweet',await ev(()=>[AIX.CC('sweet.f').aff,AIX.CC('yan.f').aff,AIX.ctx().c.line]));
// gifts
for(const g of ['candy','flowers','book','plush','coffee','phones','pen']){await ev(g=>{SFX.SM.aiGive({dataset:{v:g}})},g)}
console.log(n,'gift kn',await ev(()=>JSON.stringify(AIX.ctx().c.kn)),'coins',await ev(()=>M.coins));
await p.screenshot({path:`${process.env.S}/ai3_${n}_gift.png`});
// ask, about, comp, checkin, scene
await ev(()=>{SFX.SM.aiask();SFX.SM.aiAbout();SFX.SM.aiComp();SFX.SM.aiCi();SFX.SM.aiCiA({dataset:{v:'G'}})});
await ev(()=>{const c=AIX.ctx().c;c.xp=200;c.lv=4;SFX.SM.aiScene();});
await p.screenshot({path:`${process.env.S}/ai3_${n}_scene.png`});
await ev(()=>SFX.SM.aiSc({dataset:{v:'a'}}));
console.log(n,'level',await ev(()=>[AIX.ctx().c.lv,AIX.ctx().c.sc]));
// date
await ev(()=>{SFX.SM.aidate();SFX.SM.aiDs({dataset:{v:'10'}})});
await ev(()=>{addSP(2,'t')});await p.waitForTimeout(1500);
console.log(n,'date',await ev(()=>JSON.stringify(AIX.ctx().c.date)),'wins',await ev(()=>AIX.ctx().c.wins));
await ev(()=>{SFX.SM.aidate();SFX.SM.aiDs({dataset:{v:'25'}});AIX.ctx().c.date.end=Date.now()-1000});await p.waitForTimeout(1500);
console.log(n,'failed date',await ev(()=>[JSON.stringify(AIX.ctx().c.date),AIX.ctx().c.line]));
// idle on another
await ev(()=>{SFX.SM.aiP({dataset:{v:'tsun.m'}})});await ev(()=>SFX.closeM&&SFX.closeM());
for(const min of [9,19,36]){await ev(m=>{const c=AIX.ctx().c;c.last=Date.now()-m*60000;c.actAt=0},min);await p.waitForTimeout(1500);console.log(n,min,await ev(()=>[AIX.ctx().c.stg,AIX.mi(),Math.round(AIX.ctx().c.aff)]))}
console.log(n,'other affs',await ev(()=>['sweet.f','yan.f','tsun.m'].map(k=>Math.round(AIX.CC(k).aff))));
await p.screenshot({path:`${process.env.S}/ai3_${n}_idle.png`});
// all 15 render
console.log(n,'all15',await ev(()=>Object.keys(AIX.IND).length));
for(const bt of ['talk','pat','gift','ask','date','pick']){await ev(a=>{const b=document.querySelector(`#sfdock [data-sf=${a}]`);b&&b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));b&&b.click();},bt);await p.waitForTimeout(150);await ev(()=>SFX.closeM&&SFX.closeM())}
await p.screenshot({path:`${process.env.S}/ai3_${n}_dock.png`});
}
console.log('errs',errs);await b.close()})();
