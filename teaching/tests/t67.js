const SITE='file://'+require('path').resolve(process.env.SITE||__dirname+'/../dist/MP_PRODUCTIONS_TEACHING_6.html');
const {chromium}=require('playwright');
const ids=process.argv[2].split(',');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:850}});const e=[];p.on('pageerror',x=>e.push('PE '+x.message));
await p.addInitScript(()=>localStorage.setItem('mp-welcomed','2'));
await p.goto(SITE);await p.waitForTimeout(3000);
await p.evaluate(()=>{document.querySelectorAll('#wgov,#rcov').forEach(x=>x.remove());M.admin=1;CATALOG.forEach(c=>M.inv.own[c.id]=1);M.rc={day:new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')+'-'+String(new Date().getDate()).padStart(2,'0'),sp:0,coins:500,fm:0,fs:0,own:0,t:Date.now()};buildOpts()});
for(const id of ids){
 await p.evaluate(i=>shopEquip(i,true),id);await p.waitForTimeout(1500);
 const d=()=>p.evaluate(()=>{const d=document.getElementById('sfdock');return d?d.innerText.replace(/\n+/g,' | ').slice(0,230):'NO DOCK'});
 console.log('==',id,await d());
 await p.evaluate(()=>{addSP(30,'t');addSP(30,'t')});await p.waitForTimeout(1200);
 const btns=await p.$$eval('#sfdock [data-sf]:not([data-sf=toggle])',els=>els.map(e=>e.dataset.sf+(e.dataset.i?':'+e.dataset.i:'')));
 console.log(' btns',btns.join(','));
 for(const bt of [...new Set(btns)].slice(0,6)){const el=await p.$(`#sfdock [data-sf="${bt.split(':')[0]}"]`);if(el&&await el.isEnabled()){await el.click({force:true});await p.waitForTimeout(250)}}
 await p.evaluate(()=>{const m=document.getElementById('sfmod');if(m)m.remove()});
 console.log(' after',await d());
 await p.screenshot({path:`s_fx_${id}.png`});
}
console.log('ERR',e.slice(0,4));await b.close()})();
