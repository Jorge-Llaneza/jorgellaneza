const SITE='file://'+require('path').resolve(process.env.SITE||__dirname+'/../dist/MP_PRODUCTIONS_TEACHING_6.html');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
await p.addInitScript(()=>localStorage.setItem('mp-welcomed','2'));
await p.goto(SITE);await p.waitForTimeout(3000);
console.log(await p.evaluate(()=>{const av={};CATALOG.filter(c=>c.cat==='avatar'||c.c==='avatar').forEach(c=>{const k=c.av||c.n;(av[k]=av[k]||[]).push(c.id)});const d=Object.entries(av).filter(([k,v])=>v.length>1).map(([k,v])=>k+':'+v.join('/'));const ids={};CATALOG.forEach(c=>ids[c.id]=(ids[c.id]||0)+1);return {dupAv:d,dupIds:Object.entries(ids).filter(([k,v])=>v>1).map(x=>x[0]),n:CATALOG.length,badges:BADGES.length}}));
await p.evaluate(()=>{['panickitchen','valleyfarm','evt_harvest'].forEach(i=>XT[i]||console.log('missing',i))});
console.log(e);await b.close()})();
