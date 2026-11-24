const SITE='file://'+require('path').resolve(process.env.SITE||__dirname+'/../dist/MP_PRODUCTIONS_TEACHING_6.html');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const ctx=await b.newContext({viewport:{width:1100,height:800}});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));
let dlg=0;p.on('dialog',async d=>{dlg++;console.log('dialog',d.type(),d.message().slice(0,60));await d.dismiss()});
await p.addInitScript(()=>{localStorage.setItem('mp-welcomed','2')});
await p.goto(SITE);await p.waitForTimeout(1500);
await p.evaluate(()=>{document.querySelectorAll('#wgov,#rcov').forEach(x=>x.remove())});
console.log('needs (no progress)',await p.evaluate(()=>MPAUTO.needsBackup()));
await p.evaluate(()=>{M.sp=120;M.coins=300});await p.waitForTimeout(4600);
console.log('saved to LS',await p.evaluate(()=>JSON.parse(localStorage.getItem('mpt')).sp));
console.log('needs',await p.evaluate(()=>MPAUTO.needsBackup()));
await p.waitForTimeout(6000);console.log('dot',await p.evaluate(()=>document.getElementById('hxSave').dataset.unsaved));
await p.evaluate(()=>MPAUTO.autoBk());await p.waitForTimeout(500);console.log('idb',await p.evaluate(async()=>{const g=await MPAUTO.idbGet('g0');return g&&JSON.parse(g.d.mpt).sp}));
// close attempt -> beforeunload prevented?
const prevented=await p.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented});console.log('beforeunload prevented',prevented);
await p.waitForTimeout(800);console.log('panel opened after stay',await p.evaluate(()=>!!document.getElementById('hxov')&&document.getElementById('hxov').innerText.includes('Automatic backups')));
await p.screenshot({path:process.env.S+'/ai_save.png'});
// do a slot save -> no longer needs
await p.evaluate(()=>{const S=hxSlots();S.s1={t:Date.now(),d:hxSnap()};hxPutSlots(S)});await p.waitForTimeout(300);
console.log('needs after slot save',await p.evaluate(()=>MPAUTO.needsBackup()));
console.log('prevented after backup',await p.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented}));
await p.evaluate(()=>{M.sp=500});await p.waitForTimeout(4500);console.log('needs after more progress',await p.evaluate(()=>MPAUTO.needsBackup()));
// recovery when LS wiped
await p.evaluate(()=>MPAUTO.autoBk());await p.waitForTimeout(500);
await p.evaluate(()=>{localStorage.removeItem('mpt')});
const q=await ctx.newPage();q.on('pageerror',x=>errs.push('q'+x.message));await q.addInitScript(()=>{window.addEventListener('beforeunload',e=>e.stopImmediatePropagation())});
await q.goto(SITE);await q.waitForTimeout(3500);
console.log('recover prompt',await q.evaluate(()=>{const o=document.getElementById('hxov');return o?o.innerText.slice(0,120).replace(/\n/g,' '):'none'}));
console.log(errs,'dialogs',dlg);await b.close()})();
