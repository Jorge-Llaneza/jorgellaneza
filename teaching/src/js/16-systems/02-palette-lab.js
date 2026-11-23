/* ======= PALETTE LAB + THEME REMIX ======= */
const LABP=[['Ember','#14100c','#f6ead8','#ff7a2f','#ffc15e','#211a14'],['Lagoon','#06242b','#e6fbff','#19c3d6','#7bf0c4','#0c333c'],['Orchid','#1b1026','#f6eaff','#c26bff','#ff7bd5','#281738'],['Paper','#f6f1e6','#2a2418','#c2542d','#2f7d6b','#fffaf0'],['Mint','#eefaf3','#12301f','#1f9d62','#f2a93b','#ffffff'],['Mono','#0b0b0b','#f4f4f4','#ffffff','#9a9a9a','#171717']];
const labHex=h=>{h=(h||'#000').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return[parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0]};
const labMix=(a,b,t)=>{const x=labHex(a),y=labHex(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const labLum=h=>{const[r,g,b]=labHex(h);return(0.2126*r+0.7152*g+0.0722*b)/255};
function labS(){if(!M.lab)M.lab={pl:{bg:'#101820',fg:'#f2f2f2',acc:'#ff6b35',acc2:'#2ec4b6',card:'#1a2530'},rmA:'',rmB:'',rmAcc:''};return M.lab}
function labFull(p){return{bg:p.bg,fg:p.fg,mut:labMix(p.fg,p.bg,.42),card:p.card,card2:labMix(p.card,p.fg,.08),bd:labMix(p.card,p.fg,.25),ok:'#3fb37f',bad:'#e5484d',acc:p.acc,on:labLum(p.acc)>.42?'#000000':'#ffffff',acc2:p.acc2,base:labLum(p.bg)<.5?'dark':'light'}}
function labApply(){const L=labS();let css='';const p=labFull(L.pl);css+=hxVars(Object.assign({k:'palettelab'},p))+'\n';
 if(XT.palettelab){XT.palettelab.sw=[p.bg,p.fg,p.acc];XT.palettelab.base=p.base}
 const A=FDK[L.rmA],B=FDK[L.rmB];if(A&&A.t){const t=Object.assign({},A.t,{k:'remix'});if(L.rmAcc){t.acc=L.rmAcc;t.on=labLum(L.rmAcc)>.55?'#000000':'#ffffff'}css+=hxVars(t)+'\n';if(XT.remix){XT.remix.sw=[t.bg,t.fg,t.acc];XT.remix.base=t.base}}
 if(B&&B.deco)css+=fdScope(B.deco,'remix')+'\n';
 let st=document.getElementById('labx');if(!st){st=document.createElement('style');st.id='labx';document.head.appendChild(st)}st.textContent=css}
function labOwned(){return FD.filter(f=>f.bpT&&f.id!=='remix'&&f.id!=='palettelab'||!f.bpT).filter(f=>M.inv.own[f.id]&&f.t&&f.deco!==undefined)}
function labUnlock(){try{const g=[];if(!M.inv.own.palettelab&&M.fc&&M.fc.done>=3){M.inv.own.palettelab=1;g.push('🎨 Palette Lab')}
 if(!M.inv.own.remix&&labOwned().length>=6){M.inv.own.remix=1;g.push('🧬 Theme Remix')}
 if(g.length){mDirty=true;buildOpts();mSave();paintChip();lootSting('legendary');confetti(true);toast('🔓 Unlocked: '+g.join(' and ')+'! Open Challenges, then the Lab tab.')}}catch(e){}}
function labHTML(){const L=labS(),pl=L.pl,has=M.inv.own.palettelab,rm=M.inv.own.remix,done=(M.fc&&M.fc.done)||0,ow=labOwned();
 let h=`<div class="egboss" style="--c:#c26bff"><div class="egbi" aria-hidden="true">🎨</div><h3>Palette Lab</h3>`;
 if(!has)h+=`<p class="wgs">Locked. Finish 3 Focus sessions to unlock a theme where you choose every colour. Progress: <b>${Math.min(3,done)}/3</b></p></div>`;
 else{const inp=[['bg','Background'],['card','Cards'],['fg','Text'],['acc','Accent'],['acc2','Accent 2']].map(([k,n])=>`<label class="labc"><span>${n}</span><input type="color" data-labc="${k}" value="${pl[k]}" aria-label="${n} colour"></label>`).join('');
  h+=`<p class="wgs">Mix your own colours. They apply live.</p><div class="labrow">${inp}</div><div class="labrow">${LABP.map((q,i)=>`<button data-lab="preset" data-i="${i}" style="background:${q[1]};color:${q[2]};border:2px solid ${q[3]}">${q[0]}</button>`).join('')}</div><div class="wgb"><button class="pri" data-lab="equip" data-id="palettelab">🎨 Wear Palette Lab</button></div></div>`}
 h+=`<div class="egboss" style="--c:#9b8cff"><div class="egbi" aria-hidden="true">🧬</div><h3>Theme Remix</h3>`;
 if(!rm)h+=`<p class="wgs">Locked. Own 6 different special themes (you have <b>${Math.min(6,ow.length)}/6</b>) to take colours from one and decoration from another.</p></div>`;
 else{const opt=cur=>'<option value="">Choose…</option>'+ow.map(f=>`<option value="${f.id}"${f.id===cur?' selected':''}>${esc(f.n)}</option>`).join('');
  h+=`<p class="wgs">Colours from A, decoration from B, then tint the accent.</p><div class="labrow"><label class="labc"><span>Colours of</span><select data-labs="rmA">${opt(L.rmA)}</select></label><label class="labc"><span>Decoration of</span><select data-labs="rmB">${opt(L.rmB)}</select></label><label class="labc"><span>Accent tint</span><input type="color" data-labc="rmAcc" value="${L.rmAcc||'#9b8cff'}" aria-label="Accent tint"></label></div><div class="wgb"><button data-lab="clrtint">No tint</button><button class="pri" data-lab="equip" data-id="remix">🧬 Wear Remix</button></div></div>`}
 return h}
EGX.lab={label:'🎨 Lab',html:labHTML};
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.labc){const L=labS();if(t.dataset.labc==='rmAcc')L.rmAcc=t.value;else L.pl[t.dataset.labc]=t.value;labApply();mDirty=true;clearTimeout(labApply.t);labApply.t=setTimeout(()=>{try{mSave()}catch(er){}},400)}},true);
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.labs){const L=labS();L[t.dataset.labs]=t.value;labApply();mDirty=true;try{mSave()}catch(er){}}},true);
document.addEventListener('click',e=>{const t=e.target.closest('[data-lab]');if(!t)return;const a=t.dataset.lab,L=labS();
 if(a==='preset'){const q=LABP[+t.dataset.i];L.pl={bg:q[1],fg:q[2],acc:q[3],acc2:q[4],card:q[5]};labApply();mDirty=true;try{mSave()}catch(er){}egPaint()}
 else if(a==='clrtint'){L.rmAcc='';labApply();mDirty=true;try{mSave()}catch(er){}egPaint()}
 else if(a==='equip'){const id=t.dataset.id;if(!M.inv.own[id])return;labApply();if(mode!==id)shopEquip(id,true);else{applyTheme()}try{paintChip();mSave();toast('Wearing '+cat(id).n)}catch(er){}}},true);
(()=>{const c=document.createElement('style');c.textContent=`
.labrow{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}.labc{display:flex;flex-direction:column;gap:4px;font-size:12px}.labc input[type=color]{width:64px;height:38px;border:none;padding:0;background:none;cursor:pointer}.labc select{padding:6px;border-radius:8px}.labrow button{padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:700}
`;document.head.appendChild(c)})();labApply();setTimeout(labUnlock,2800);setInterval(labUnlock,6000);

