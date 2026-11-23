const SITE='file://'+require('path').resolve(process.env.SITE||__dirname+'/../dist/MP_PRODUCTIONS_TEACHING_6.html');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:850}});const e=[];p.on('pageerror',x=>e.push(x.message));p.on('console',m=>{if(m.type()==='error')e.push('CE '+m.text())});
await p.addInitScript(()=>localStorage.setItem('mp-welcomed','2'));
await p.goto(SITE);await p.waitForTimeout(3000);
await p.evaluate(()=>{document.querySelectorAll('#wgov,#rcov').forEach(x=>x.remove());M.admin=1;CATALOG.forEach(c=>M.inv.own[c.id]=1)});
await p.evaluate(()=>shopEquip('aigf',true));await p.waitForTimeout(1500);
await p.evaluate(()=>{const m=document.getElementById('sfmod');if(m)m.remove();const c=AIX.C();c.met=1;c.xp=0;c.lv=1;c.aff=60;c.wins=0;M.fx.aigf.cq=[]});
await p.evaluate(()=>AIcut('lv3'));await p.waitForTimeout(1500);
const st=()=>p.evaluate(()=>{const o=document.getElementById('aicut');return o?o.querySelector('p').innerText+' || '+[...o.querySelectorAll('.cch button')].map(b=>b.innerText).join(' / '):'none'});
await p.screenshot({path:'s_cut1.png'});
for(let i=0;i<8;i++){const s=await st();console.log(i,s.slice(0,90));if(s.includes(' / '))break;await p.click('#aicut .cpt',{force:true});await p.waitForTimeout(150);await p.click('#aicut .cpt',{force:true});await p.waitForTimeout(700)}
await p.screenshot({path:'s_cut2.png'});
await p.click('#aicut [data-ct=c1]');await p.waitForTimeout(800);console.log('reply',await st());
await p.click('#aicut .cpt',{force:true});await p.waitForTimeout(200);await p.click('#aicut .cpt',{force:true});await p.waitForTimeout(500);
console.log('after',await st(),JSON.stringify(await p.evaluate(()=>[AIX.C().cut,AIX.C().aff])));
console.log('replay yan',await p.evaluate(()=>AIcut('lv5','yan.f')));await p.waitForTimeout(2500);await p.screenshot({path:'s_cut3.png'});await p.keyboard.press('Escape');await p.waitForTimeout(300);console.log('esc closed',await st());
await p.evaluate(()=>AIcut('lv5','sweet.f'));await p.waitForTimeout(2500);await p.screenshot({path:'s_cut4.png'});await p.keyboard.press('Escape');
await p.evaluate(()=>SFX.SM.aiMem());await p.waitForTimeout(300);console.log('mem',await p.evaluate(()=>document.getElementById('sfmod').innerText.replace(/\n+/g,' | ').slice(0,300)));
await p.evaluate(()=>{const m=document.getElementById('sfmod');if(m)m.remove()});
for(const a of ['pat','talk']){await p.click(`#sfdock [data-sf=${a}]`);await p.waitForTimeout(250);console.log(a,await p.evaluate(()=>document.querySelector('#fdview .pt').className+' bursts '+document.querySelectorAll('#fdview .abu').length))}
console.log('ERR',e);await b.close()})();
