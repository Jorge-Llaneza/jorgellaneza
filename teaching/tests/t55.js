const SITE='file://'+require('path').resolve(process.env.SITE||__dirname+'/../dist/MP_PRODUCTIONS_TEACHING_6.html');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800},deviceScaleFactor:1});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.addInitScript(()=>{try{localStorage.setItem('mp-welcomed','2')}catch(e){}});
await p.goto(SITE);await p.waitForTimeout(3500);
const tabs=['boss','streak','rec','tour','event','lab','tt','fstats','pcard','snd','a11y','sync','coop','brk','gstats'];
for(const t of tabs){await p.evaluate(t=>{document.querySelectorAll('#wgov,#rcov').forEach(x=>x.remove());egOpen(t)},t);await p.waitForTimeout(150);const r=await p.evaluate(()=>({len:document.getElementById('egov').innerText.length,ov:document.documentElement.scrollWidth>innerWidth+2}));if(r.len<80||r.ov)console.log('TAB',t,r)}
await p.evaluate(()=>egOpen('coop'));await p.screenshot({path:'s_mob_co.png'});
await p.evaluate(()=>{egClose();renderHome()});await p.waitForTimeout(300);
console.log('homecards',await p.evaluate(()=>[...document.querySelectorAll('.shpcard')].length));
console.log('errs',errs);await b.close()})();
