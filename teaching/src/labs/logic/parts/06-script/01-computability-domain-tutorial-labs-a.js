/* ===== Computability domain: tutorial, labs and wiring ===== */
(function(){
const {cEx,cJudge,cgen,pre,esc,num,trT,tmSplit,tmGo,idsHTML,tmOut,PR,TM_ADD,TM_DBL,TM_ERASE,TM_SUCC,TM_LOOP,NM,fmtV}=CPQ;
const L=a=>a.join('\n'),Q='begin\n  X1:=0\nend';
const isC=e=>e&&typeof e.c=='string'&&e.c.startsWith('c_');

/* ---------- categories, modes ---------- */
CATS.comp={c_sem:'Semantic function',c_trace:'State vector',c_et:'Macro-test E_T',c_wpd:'Write a program',c_tmq:'Turing: result',c_tmd:'Design a TM',c_smn:'s-m-n',c_con:'Concepts'};
const CMODES={tut:'Tutorial',prac:'Practice',rand:'Random',wp:'While lab',tm:'Turing lab',fr:'Code · U · s-m-n',mist:'Mistakes'};window.CMODES=CMODES;

const oldNav=nav,oldGo=go,oldGen=gen,oldExH=exH,oldJudge=judge,oldMi=mi,oldPal=pal;
nav=function(){
 $('#n1').innerHTML=[['prop','Propositional logic'],['pred','Predicate logic'],['comp','Computability']].map(([k,v])=>`<button class="${S.d==k?'on':''}" onclick="setDom('${k}')">${v}</button>`).join('');
 const M=S.d=='comp'?CMODES:MODES;
 $('#n2').innerHTML=Object.entries(M).map(([k,v])=>`<button class="${S.m==k?'on':''}" onclick="S.m='${k}';S.i=0;go()">${v}${k=='mist'?' ('+S.mist.length+')':''}</button>`).join('')+`<span class=mu style="align-self:center">⭐ ${SV.xp} · ✓ ${S.ok} ✗ ${S.no} · 🔥 ${SV.streak}</span>`;
 $('#n3').innerHTML=S.m=='prac'||S.m=='rand'?Object.entries(CATS[S.d]).map(([k,v])=>`<button class="${S.c==k?'on':''}" onclick="S.c='${k}';S.i=0;go()">${v}</button>`).join(''):''};
window.setDom=k=>{S.d=k;const M=k=='comp'?CMODES:MODES;if(!(S.m in M))S.m='tut';S.c=Object.keys(CATS[k])[0];S.i=0;go()};
go=function(){if(S.d!='comp')return oldGo();nav();({tut:()=>CTUT(),prac:ex,rand:ex,wp:wpLab,tm:tmLab,fr:frLab,mist:()=>mi()})[S.m]()};
gen=function(c){return isC({c})?cgen(c):oldGen(c)};
exH=function(e){return isC(e)?cEx(e):oldExH(e)};
judge=function(e,a){return isC(e)?cJudge(e,a):oldJudge(e,a)};
mi=function(){const n=S.mist.length;if(n){const k=(S.mi+1)%n;if(isC(S.mist[k])){S.mi=k;S.ex=S.mist[k];S.d='comp';$('#M').innerHTML=exH(S.ex)+'<div class=row><button onclick="mi()">Next mistake</button></div>';pal();nav();return}}oldMi()};
const cpal=()=>'<div class=row>'+[':=','∸','≠','≤','≥','∧','∨','¬','(',')'].map(s=>`<button onmousedown="event.preventDefault()" onclick="cins('${s}')">${s}</button>`).join('')+'</div>';
pal=function(){if(S.d=='comp')$('#M').insertAdjacentHTML('beforeend',cpal());else oldPal()};
window.cins=s=>{const t=(typeof last!=='undefined'&&last&&document.body.contains(last))?last:$('textarea,input');if(!t)return;t.focus();const a=t.selectionStart??t.value.length,b=t.selectionEnd??a;t.value=t.value.slice(0,a)+s+t.value.slice(b);t.selectionStart=t.selectionEnd=a+s.length};

/* ---------- While lab ---------- */
const MUL=L(['begin','  Z:=0;','  U:=0;','  while U≠Y do','  begin','    V:=0;','    while V≠X do','    begin','      V:=succ(V);','      Z:=succ(Z)','    end;','    U:=succ(U)','  end','end']);
const WPX=[
 ['Z := X + Y',L(['begin','  Z:=X;','  U:=0;','  while U≠Y do','  begin','    Z:=succ(Z);','    U:=succ(U)','  end','end']),'X=3, Y=4','Z'],
 ['Z := X ∸ Y',L(['begin','  Z:=X;','  U:=0;','  while U≠Y do','  begin','    Z:=pred(Z);','    U:=succ(U)','  end','end']),'X=3, Y=5','Z'],
 ['Z := X * Y (basic statements only)',MUL,'X=3, Y=4','Z'],
 ['Z := X div Y',L(['begin','  W:=succ(X);','  Z:=0;','  U:=0;','  while W≠U do','  begin','    Z:=succ(Z);','    W:=W∸Y','  end;','  Z:=pred(Z)','end']),'X=17, Y=5','Z'],
 ['Z := X mod Y',L(['begin','  W:=succ(X);','  Z:=0;','  U:=0;','  while W≠U do','  begin','    Z:=W;','    W:=W∸Y','  end;','  Z:=pred(Z)','end']),'X=17, Y=5','Z'],
 ['φ³(x,y,z) = ⌊(x+y)/2⌋ + z (slides)',PR.half,'3, 2, 1',''],
 ['Slide program: X1 := 0 then count up',PR.p1,'4, 2',''],
 ['Macro-test: while (X1<X2) ∨ (X2≥X3)',PR.mt,'1, 5, 2',''],
 ['if-then-else (max)',PR.max,'3, 8',''],
 ['repeat … until',PR.rep,'5',''],
 ['Universal macro  Z := U(X, Y)  (X = code of "X1 := succ(X1)")','begin\n  Z:=U(X,Y)\nend',()=>'X='+CP.cod('begin\n  X1:=succ(X1)\nend')+', Y=7','Z']];
function wpLab(){const s=S.wp||{ex:0};
 $('#M').innerHTML=`<div class=card><h3>While program</h3><div class=row><select id=wpex onchange="wpLoad(+this.value)">${WPX.map((x,i)=>`<option value=${i}>${esc(x[0])}</option>`).join('')}</select></div>
<textarea id=wpsrc class=code rows=13 spellcheck=false></textarea>
<div class=row><input id=wpin style="flex:2;min-width:150px" placeholder="Input:  3, 2, 1   or   X=3, Y=4"><input id=wpout style="flex:1;min-width:90px" placeholder="output var"></div>
${cpal()}<div class=row><button class=on onclick="wpRun()">Run</button></div>
<span class=mu>Positional inputs go to X1, X2, … and the result is X1: that is the semantic function φ<sub>P</sub><sup>(j)</sup>. With named inputs choose the output variable. Macros (X+Y, X∸Y, X*Y, div, mod, tests, if, repeat, Z:=n, U(X,Y)) run directly; they mean the same as their expansion.</span></div>
<div id=wpres></div>
<div class=card><h3>Macro-tests: building E<sub>T</sub></h3><input id=etin placeholder="e.g.  Z≥Y ∨ Z>X"><input id=ets style="margin-top:6px" placeholder="optional state, e.g.  X=2, Y=1, Z=5"><div class=row><button class=on onclick="etRun()">Build E_T</button></div></div><div id=etres></div>`;
 wpLoad(s.ex,s)}
window.wpLoad=(i,s)=>{const e=WPX[i];$('#wpex').value=i;$('#wpsrc').value=s&&s.src!=null?s.src:e[1];$('#wpin').value=s&&s.inp!=null?s.inp:(typeof e[2]=='function'?e[2]():e[2]);$('#wpout').value=s&&s.out!=null?s.out:e[3];S.wp={ex:i};wpRun()};
function pin(s){s=s.trim();const init={};let pos=null;if(!s)return{init,pos:[]};
 if(/=/.test(s))s.split(/[,;]/).forEach(x=>{const m=x.match(/^\s*([A-Za-z_]\w*)\s*=\s*(\d+)\s*$/);if(!m)throw Error('Cannot read "'+x.trim()+'". Use X=3, Y=4 or 3, 4');init[m[1]]=BigInt(m[2])});
 else{pos=s.split(/[,;\s]+/).filter(Boolean).map(x=>{if(!/^\d+$/.test(x))throw Error('Inputs are natural numbers: "'+x+'"');return BigInt(x)});pos.forEach((v,i)=>init['X'+(i+1)]=v)}
 return{init,pos}}
window.wpRun=()=>{S.wp={...S.wp,src:$('#wpsrc').value,inp:$('#wpin').value,out:$('#wpout').value};out(()=>{
 const P=CP.parse($('#wpsrc').value),{init,pos}=pin($('#wpin').value),r=CP.run(P,init,{trace:true,max:300000}),F=CP.feats(P);
 const ov=$('#wpout').value.trim()||(pos?'X1':(P.vars.includes('Z')?'Z':'X1'));
 const val=r.ok?String(r.st[ov]||0n):null,k=r.vk.length;
 let h=r.ok?'<b class=ok>Halts</b> · ':'<b class=no>Does not halt</b> within 300000 statements (or a division by 0 / huge number): the semantic function is <b>⊥</b>.<br>';
 if(r.ok)h+=(pos?'φ<sub>P</sub><sup>('+pos.length+')</sup>('+pos.join(', ')+') = ':ov+' = ')+'<b>'+val+'</b>';
 if(pos&&P.vk.every(v=>/^X\d+$/.test(v)))h+='<br><span class=mu>k = '+k+' variable'+(k>1?'s':'')+', j = '+pos.length+': '+(k>=pos.length?'k ≥ j, â₀ = '+fmtV(r.v0):'k < j, only the first '+k+' inputs are used, â₀ = '+fmtV(r.v0))+'</span>';
 h+='<br><span class=mu>'+r.steps+' statements executed · variables: '+r.vk.join(', ')+'</span><br><span class=mu>Macros used: '+(F.size?[...F].map(x=>NM[x]).join(', '):'none, only basic statements')+'</span>'+(r.ok?'':'')+trT(r);return h},'#wpres')};
window.etRun=()=>out(()=>{const T=CP.parseTest($('#etin').value);const lines=[];const seen=new Set();
 (function w(t){const s=CP.ts(t,1);if(seen.has(s))return;seen.add(s);(t.and||t.or||(t.not?[t.not]:[])).forEach(w);lines.push('E<sub>'+esc(s)+'</sub> = '+esc(CP.etExpr(t)))})(T);
 let h='<b>T = '+esc(CP.ts(T,1))+'</b><div class=f style="font-size:15px">'+lines.map(x=>'<div class=ln>'+x+'</div>').join('')+'</div><span class=mu>Bottom-up from the inductive rules: E<sub>X&lt;Y</sub> = Y∸X, E<sub>T1∧T2</sub> = E<sub>T1</sub>*E<sub>T2</sub>, E<sub>T1∨T2</sub> = E<sub>T1</sub>+E<sub>T2</sub>, E<sub>¬T</sub> = 1∸E<sub>T</sub>.</span><br>Then <code>while T do δ</code> becomes:'+pre(L(['begin','  U := E_T;','  V := 0;','  while U≠V do','  begin','    δ;','    U := E_T   (recomputed: δ may change T)','  end','end']));
 const st=$('#ets').value.trim();if(st){const m={};st.split(/[,;]/).forEach(x=>{const q=x.match(/^\s*([A-Za-z_]\w*)\s*=\s*(\d+)\s*$/);if(!q)throw Error('State: X=2, Y=1');m[q[1]]=BigInt(q[2])});const g=n=>m[n]||0n;h+='At this state T is <b class='+(CP.evalT(T,g)?'ok>true':'no>false')+'</b> and E<sub>T</sub> = <b>'+CP.evalE(CP.parseExpr(CP.etExpr(T).replace(/∸/g,'-')),g)+'</b>.'}
 return h},'#etres');

/* ---------- Turing lab ---------- */
const TMX=[
 ['x + y (slides)',L([TM_ADD,'final: q2']),'2, 1'],
 ['2x (slides)',L([TM_DBL,'final: qf']),'3'],
 ['x + 1',L([TM_SUCC,'final: qf']),'4'],
 ['f(x) = 0 (erase)',L([TM_ERASE,'final: q0']),'4'],
 ['Composition I: φ(x) = f(0,x), f = x+y',L(['(p0, 1, 1, L, p0)','(p0, 0, 0, L, p1)','(p1, 0, 1, N, q0)','// M1 = x+y',TM_ADD,'final: q2']),'3'],
 ['Composition II: x+1 if y=0, else g(x,y) = x+y',L(['(p0, 1, 1, R, p0)','(p0, 0, 0, R, p1)','(p1, 1, 1, R, p2)','(p2, 0, 0, L, p3)','(p3, 1, 0, N, qf)','(p2, 1, 1, L, p4)','(p4, 1, 1, L, p4)','(p5, 1, 1, L, p5)','(p5, 0, 0, R, q0)','(p4, 0, 0, L, p5)','// M1 = x+y',TM_ADD,'final: q2, qf']),'2, 3'],
 ['Composition III: φ(x,y) = g(2x,y), g = x+y',L(['(p0, 1, 1, R, p1)','(p1, 1, 0, L, p2)','(p2, 1, 1, L, p2)','(p2, 0, 1, R, p3)','(p3, 1, 1, R, p3)','(p3, 0, 1, R, p1)','(p1, 0, 0, L, p4)','(p4, 1, 1, L, p4)','(p4, 0, 0, R, q0)','// M1 = x+y',TM_ADD,'final: q2']),'2, 3'],
 ['Never halts',L([TM_LOOP,'final: q1']),'2']];
function tmLab(){const s=S.tmx||{ex:0};
 $('#M').innerHTML=`<div class=card><h3>Turing machine</h3><div class=row><select id=tmex onchange="tmLoad(+this.value)">${TMX.map((x,i)=>`<option value=${i}>${esc(x[0])}</option>`).join('')}</select></div>
<textarea id=tmsrc class=code rows=12 spellcheck=false></textarea>
<div class=row><input id=tmin style="flex:1" placeholder="Input, e.g.  2, 1"></div>
<div class=row><button class=on onclick="tmRun()">Run</button></div>
<span class=mu>One transition per line: <code>(q0, 1, 0, R, q1)</code> = in q0 reading 1: write 0, move right, go to q1 (or <code>T(q0,1)=(0,R,q1)</code>). Moves L, R, N, H (halt). The first line fixes the initial state; <code>final: q2, qf</code> lists the final states (if omitted, states without outgoing transitions). Blank = 0; <code>//</code> starts a comment. The input is unary, n ↦ n+1 ones, blocks separated by one 0, head on the first 1. The result is the number of 1s when the machine halts in a final state.</span></div><div id=tmres></div>`;
 tmLoad(s.ex,s)}
window.tmLoad=(i,s)=>{const e=TMX[i];$('#tmex').value=i;$('#tmsrc').value=s&&s.src!=null?s.src:e[1];$('#tmin').value=s&&s.inp!=null?s.inp:e[2];S.tmx={ex:i};tmRun()};
function pargs(s){const a=s.split(/[,;\s]+/).filter(Boolean).map(x=>{if(!/^\d+$/.test(x))throw Error('Inputs are natural numbers separated by commas');return +x});if(!a.length)throw Error('Write at least one input number');return a}
function tapeHTML(id){const p=id.split(' ');let l='',q,r;if(p.length==3)[l,q,r]=p;else[q,r]=p;
 const cells=[...l].map(c=>({c})).concat([...(r||'0')].map((c,i)=>({c,h:i==0})));const pad=()=>({c:'0',b:1});
 return '<div class=tape>'+[pad(),pad(),...cells,pad(),pad()].map(x=>`<div class=cw><small>${x.h?esc(q):'&nbsp;'}</small><div class="cell ${x.h?'hd':''} ${x.b?'mu':''}">${x.c}</div></div>`).join('')+'</div>'}
window.tmShow=k=>{const r=S.tmr;if(!r)return;k=Math.max(0,Math.min(r.ids.length-1,k));$('#tmk').value=k;$('#tmv').innerHTML='<b>Step '+k+'</b> of '+(r.ids.length-1)+' · <code>'+esc(r.ids[k])+'</code>'+tapeHTML(r.ids[k])};
window.tmRun=()=>{S.tmx={...S.tmx,src:$('#tmsrc').value,inp:$('#tmin').value};out(()=>{
 const args=pargs($('#tmin').value),g=tmGo($('#tmsrc').value,args,null,5000),r=g.r;S.tmr=r;
 return '<b>'+(r.final?'<span class=ok>Halts in a final state</span>':r.halted?'<span class=no>Halts in a non-final state</span>':'<span class=no>Does not halt</span>')+'</b><br>φ<sub>M</sub><sup>('+args.length+')</sup>('+args.join(', ')+') '+(r.final?'= <b>'+r.result+'</b> (number of 1s on the tape)':'= ⊥')+'<br><span class=mu>'+r.steps+' moves · initial state '+esc(g.M.init)+' · final states {'+[...g.fin].map(esc).join(', ')+'}</span>'
  +'<div class=row><button onclick="tmShow(+$(\'#tmk\').value-1)">←</button><input type=range id=tmk min=0 max='+(r.ids.length-1)+' value=0 style="flex:1;width:auto;min-width:120px" oninput="tmShow(+this.value)"><button onclick="tmShow(+$(\'#tmk\').value+1)">→</button></div><div id=tmv></div>'
  +'<details class=card><summary>Whole computation sequence</summary>'+idsHTML(r.ids)+'</details>'},'#tmres');if(S.tmr&&$('#tmk'))tmShow(0)};

/* ---------- Code, universality, s-m-n ---------- */
const FRX=[['successor: X1 := succ(X1)','begin\n  X1:=succ(X1)\nend','7'],['doubling: X1 := X1 + X1','begin\n  X1:=X1+X1\nend','5'],['x ∸ y (arity 2: y∸x)',PR.sub,'3, 9'],['x * y',PR.mul,'4, 6'],['Slide example (X1 := 0)',Q,'3']];
function frLab(){const s=S.fr||{};
 $('#M').innerHTML=`<div class=card><h3>1 · Encoding: cod and decod</h3><div class=row><select id=frex onchange="frEx(+this.value)">${FRX.map((x,i)=>`<option value=${i}>${esc(x[0])}</option>`).join('')}</select></div>
<textarea id=frp class=code rows=7 spellcheck=false>${esc(s.p!=null?s.p:Q)}</textarea>
<div class=row><button class=on onclick="frCod()">cod(P)</button></div><div id=frc></div>
<h3>decod(n)</h3><input id=frn placeholder="a natural number n" value="${esc(s.n||'')}"><div class=row><button class=on onclick="frDec()">decod(n)</button><button onclick="$('#frn').value='0';frDec()">n = 0</button><button onclick="$('#frn').value='33482460930773914958281235596343704383076';frDec()">n from the slides</button></div><div id=frd></div></div>
<div class=card><h3>2 · Universality: Φ(e, x₁,…,x<sub>j</sub>) = φ<sub>e</sub><sup>(j)</sup>(x₁,…,x<sub>j</sub>)</h3>
<div class=row><input id=fre style="flex:2;min-width:150px" placeholder="e (the code of a program)" value="${esc(s.e||'')}"><input id=frx style="flex:1;min-width:100px" placeholder="x₁, …, x_j" value="${esc(s.x||'')}"></div>
<div class=row><button class=on onclick="frUni()">Compute Φ</button><button onclick="$('#fre').value=String(CP.cod($('#frp').value));frUni()">e := cod(P) above</button></div><div id=fru></div>
<span class=mu>Φ is computable: decode e, simulate the program on the inputs and return the result. In a while program it is the macro <code>Z := U(X, Y)</code> (try it in the While lab); if φ<sub>e</sub> is undefined the macro never ends.</span></div>
<div class=card><h3>3 · Parametrization (s-m-n)</h3>
<textarea id=frq class=code rows=8 spellcheck=false>${esc(s.q!=null?s.q:PR.mul)}</textarea>
<div class=row><input id=frC style="flex:1" placeholder="constants C₁,…,C_m (fixed)" value="${esc(s.C||'5')}"><input id=frX style="flex:1" placeholder="free inputs x₁,…,x_n (to test)" value="${esc(s.X||'4')}"></div>
<div class=row><button class=on onclick="frSmn()">Build Q</button></div><div id=frs></div></div>`;
 frCod();frDec();frUni();frSmn()}
window.frEx=i=>{const e=FRX[i];$('#frp').value=e[1];$('#frx').value=e[2];$('#fre').value=String(CP.cod(e[1]));frCod();frUni()};
const keep=()=>{S.fr={p:$('#frp').value,n:$('#frn').value,e:$('#fre').value,x:$('#frx').value,q:$('#frq').value,C:$('#frC').value,X:$('#frX').value}};
const big=s=>{s=String(s).trim().replace(/[\s_]/g,'');if(!/^\d+$/.test(s))throw Error('Write a natural number');return BigInt(s)};
window.frCod=()=>{keep();out(()=>{const src=CP.asc($('#frp').value);const c=CP.cod(src),bs=CP.bits(src);
 const cut=bs.length>40;
 return '<b>cod(P)</b> = <div class=f style="word-break:break-all;white-space:normal">'+c+'</div><span class=mu>'+String(c).length+' digits · '+src.length+' characters × 8 bits = '+src.length*8+' bits</span>'+
 '<div class=sc><table><tr><th>char<th>ASCII<th>8 bits</tr>'+[...src].slice(0,cut?40:src.length).map((ch,i)=>'<tr><td>'+(ch=='\n'?'⏎ (newline)':ch==' '?'␣ (space)':esc(ch))+'<td>'+ch.charCodeAt(0)+'<td>'+bs[i]+'</tr>').join('')+'</table></div>'+(cut?'<span class=mu>… first 40 characters shown</span><br>':'')+
 '<span class=mu>Symbols outside ASCII are written as in the keyboard (≠ as !=, ∸ as -, ≤ as &lt;=). The binary expansion of cod(P) is the concatenation of the 8-bit codes. Newlines and spaces count, so rewriting the same program with other spacing gives another code. cod is total, one-to-one and computable.</span>'},'#frc')};
window.frDec=()=>{keep();if(!$('#frn').value.trim()){$('#frd').innerHTML='';return}out(()=>{const n=big($('#frn').value),d=CP.decod(n);
 return (d.ok?'<b class=ok>n codes a program:</b>':'<b class=no>n does not code any program</b>, so decod(n) = Q (a fixed program):')+pre(d.src)+'cod(decod(n)) '+(CP.cod(d.src)==n?'= n ✓':'= '+String(CP.cod(d.src)).slice(0,60)+(String(CP.cod(d.src)).length>60?'…':'')+' ≠ n')+'<br><span class=mu>decod(cod(P)) = P always, but cod(decod(n)) = n only when n is the code of a program (cod is not onto: 0 codes nothing). decod is total: it returns Q = begin X1:=0 end otherwise.</span>'},'#frd')};
window.frUni=()=>{keep();if(!$('#fre').value.trim()){$('#fru').innerHTML='';return}out(()=>{const e=big($('#fre').value),xs=$('#frx').value.split(/[,;\s]+/).filter(Boolean).map(big);if(!xs.length)throw Error('Write the inputs x₁,…,x_j');
 const d=CP.decod(e),r=CP.sem(d.P,xs.map(String),{max:300000,trace:false});
 return 'P = decod(e):'+pre(d.src)+(d.ok?'':'<span class=mu>(e is not a code: decod returns Q.)</span><br>')+'Φ<sup>('+(xs.length+1)+')</sup>(e, '+xs.join(', ')+') = φ<sub>e</sub><sup>('+xs.length+')</sup>('+xs.join(', ')+') = <b>'+(r.ok?String(r.st.X1||0n):'⊥ (does not halt)')+'</b>'},'#fru')};
window.frSmn=()=>{keep();out(()=>{const C=$('#frC').value.split(/[,;\s]+/).filter(Boolean).map(big),X=$('#frX').value.split(/[,;\s]+/).filter(Boolean).map(big);if(!C.length||!X.length)throw Error('Write at least one constant and one free input');
 const m=C.length,n=X.length,Qs=CP.smn($('#frq').value,m,n,C.map(String)),Pp=CP.parse($('#frq').value),Qp=CP.parse(Qs);
 const vq=CP.out(Qp,X.map(String),{max:300000}),vp=CP.out(Pp,[...C,...X].map(String),{max:300000});
 return 'm = '+m+' fixed, n = '+n+' free. The new program Q:'+pre(Qs)+'φ<sub>Q</sub><sup>('+n+')</sup>('+X.join(', ')+') = <b>'+(vq===null?'⊥':vq)+'</b> &nbsp; φ<sub>P</sub><sup>('+(m+n)+')</sup>('+[...C,...X].join(', ')+') = <b>'+(vp===null?'⊥':vp)+'</b> '+(vq===vp?'<b class=ok>equal ✓</b>':'<b class=no>different</b>')+'<br>cod(Q) = <span style="word-break:break-all">'+CP.cod(Qs)+'</span><br><span class=mu>s<sub>n</sub><sup>m</sup>(e, C₁,…,C_m) = cod(Q): it is computed by pure text manipulation from cod(P) and the constants, so it is total and computable. φ<sub>s(e,C)</sub><sup>(n)</sup>(x) = φ<sub>e</sub><sup>(m+n)</sup>(C, x).</span>'},'#frs')};

/* ---------- Tutorial ---------- */
const openWP=i=>{S.m='wp';S.wp={ex:i};go()},openTM=i=>{S.m='tm';S.tmx={ex:i};go()};
window.openWP=openWP;window.openTM=openTM;window.openFR=()=>{S.m='fr';go()};


/* ---------- finish ---------- */
const st=document.createElement('style');st.textContent='textarea.code{font:14px/1.35 ui-monospace,Menlo,Consolas,monospace;white-space:pre;overflow:auto;tab-size:2}.tape{display:flex;flex-wrap:wrap;gap:2px;margin:8px 0}.cw{text-align:center;width:30px}.cw small{display:block;height:15px;font:600 11px ui-monospace,monospace;color:var(--ac);overflow:hidden}.cell{border:1px solid var(--bd);border-radius:4px;font:16px ui-monospace,monospace;padding:2px 0}.cell.hd{background:var(--ac);color:var(--bg);border-color:var(--ac);font-weight:700}.cell.mu{opacity:.55}';document.head.appendChild(st);
nav();
})();

/* ===== Computability: visual tutorial (chapters, diagrams, live steppers) ===== */
(function(){
const {pre,esc,PR,TM_ADD,fmtV,tmGo}=CPQ;
const L=a=>a.join('\n');
const PEND=[];
const css=document.createElement('style');
css.textContent=`.vis{display:block;width:100%;max-width:520px;height:auto;margin:6px auto}.vis .b{fill:var(--cd);stroke:var(--ac);stroke-width:1.6}.vis .b2{fill:color-mix(in srgb,var(--ac) 18%,transparent);stroke:var(--ac);stroke-width:1.6}.vis .g{fill:color-mix(in srgb,var(--ok) 22%,transparent);stroke:var(--ok);stroke-width:1.6}.vis .t{fill:var(--fg);font:13px ui-monospace,Menlo,Consolas,monospace;text-anchor:middle}.vis .s{fill:var(--mu);font:11px ui-monospace,Menlo,Consolas,monospace;text-anchor:middle}.vis .a{stroke:var(--mu);stroke-width:1.6;fill:none;marker-end:url(#ar)}.vis .l{stroke:var(--mu);stroke-width:1.4;fill:none}
.key{background:color-mix(in srgb,var(--ac) 12%,transparent);border-left:4px solid var(--ac);padding:6px 10px;border-radius:6px;margin:8px 0}
.ck{display:inline-block;padding:2px 9px;border-radius:99px;font-size:13px;margin:2px;border:1px solid var(--bd)}.ck.a{background:color-mix(in srgb,var(--ok) 25%,transparent)}.ck.b{background:color-mix(in srgb,var(--ac) 22%,transparent)}.ck.c{background:color-mix(in srgb,#d9a406 30%,transparent)}
.vrow{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.vbx{min-width:50px;text-align:center;border:2px solid var(--bd);border-radius:8px;padding:2px 6px;background:var(--cd)}.vbx small{display:block;color:var(--mu);font-size:11px}.vbx b{font-size:20px}.vbx.chg{border-color:var(--ac);background:color-mix(in srgb,var(--ac) 20%,transparent)}.dts{min-height:9px;font-size:7px;line-height:9px;letter-spacing:1px;color:var(--ac);max-width:80px;overflow:hidden}
.ins{font:600 15px ui-monospace,monospace;padding:5px 8px;border-radius:8px;background:color-mix(in srgb,var(--ac) 14%,transparent);margin:4px 0;min-height:22px}
.cls{display:flex;flex-wrap:wrap;gap:3px;align-items:center;margin:4px 0 12px}.cl{min-width:28px;text-align:center;border:2px solid var(--bd);border-radius:6px;font:15px ui-monospace,monospace;padding:1px 4px}.cl.i{background:color-mix(in srgb,var(--ac) 25%,transparent);border-color:var(--ac)}.cl.z{color:var(--mu)}.cl.x{text-decoration:line-through;opacity:.5;border-style:dashed}.cl.r{background:color-mix(in srgb,var(--ok) 28%,transparent);border-color:var(--ok)}.cl.sp{background:color-mix(in srgb,#d9a406 30%,transparent);border-color:#d9a406}
.tn{border-left:3px solid var(--bd);margin:4px 0 4px 8px;padding-left:8px}.tn.T{border-color:var(--ok)}.tn.F{border-color:var(--no)}
.chp{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px}.chp>div{border:1px solid var(--bd);border-radius:10px;padding:6px 8px}.chp code{font-size:13px}
.ex2{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.big{font:700 24px ui-monospace,monospace}`;
document.head.appendChild(css);
const svg=(w,h,b)=>`<svg class=vis viewBox="0 0 ${w} ${h}" role=img><defs><marker id=ar viewBox="0 0 8 8" refX=7 refY=4 markerWidth=7 markerHeight=7 orient=auto><path d="M0,0 L8,4 L0,8z" style="fill:var(--mu)"/></marker></defs>${b}</svg>`;
const bx=(x,y,w,h,t,c,s)=>`<rect class="${c||'b'}" x=${x} y=${y} width=${w} height=${h} rx=8 /><text class=t x=${x+w/2} y=${y+h/2+(s?-4:5)}>${t}</text>${s?`<text class=s x=${x+w/2} y=${y+h/2+12}>${s}</text>`:''}`;
const ar=(x1,y1,x2,y2)=>`<path class=a d="M${x1},${y1} L${x2},${y2}"/>`;
const card=(h,b)=>`<div class=card><h3>${h}</h3>${b}</div>`;
const key=t=>`<div class=key>${t}</div>`;
const ck=(t,c)=>`<span class="ck ${c||''}">${t}</span>`;
const btn=(t,f,on)=>`<button class="${on?'on':''}" onclick="${f}">${t}</button>`;
const practice=(cat,t)=>btn('🎯 Practice: '+(t||CATS.comp[cat]),`S.d='comp';S.m='prac';S.c='${cat}';S.i=0;go()`);

/* ---- live stepper for while programs ---- */
const ST={};
function stepper(id,src,init,ov){const P=CP.parse(src),r=CP.run(P,init,{trace:true,max:3000});ST[id]={r,k:0,ov:ov||'X1'};PEND.push(()=>stpDraw(id));return `<div id="stp_${id}"></div>`}
window.stpGo=(id,d)=>{const s=ST[id];s.k=Math.max(0,Math.min(s.r.tr.length,d==null?0:s.k+d));stpDraw(id)};
window.stpSet=(id,k)=>{ST[id].k=+k;stpDraw(id)};
function stpDraw(id){const s=ST[id],r=s.r,n=r.tr.length,k=s.k,v=k?r.tr[k-1].v:r.v0,pv=k>1?r.tr[k-2].v:r.v0;const e=document.getElementById('stp_'+id);if(!e)return;
 e.innerHTML=`<div class=ins>${k?'▶ '+esc(r.tr[k-1].a):'start: inputs are loaded'}</div><div class=vrow>${r.vk.map((n2,i)=>{const x=+v[i];return `<div class="vbx ${k&&v[i]!=pv[i]||(k==1&&v[i]!=r.v0[i])?'chg':''}"><small>${esc(n2)}</small><b>${v[i]}</b><div class=dts>${x<=14?'●'.repeat(x):'●'.repeat(14)+'+'}</div></div>`}).join('')}</div>
<div class=row><button onclick="stpGo('${id}',-1)">◀</button><input type=range min=0 max=${n} value=${k} style="flex:1;width:auto;min-width:100px" oninput="stpSet('${id}',this.value)"><button onclick="stpGo('${id}',1)">▶</button><button onclick="stpGo('${id}')">⏮</button></div>${k==n?`<div class=ok>✔ halts · result ${esc(s.ov)} = ${v[r.vk.indexOf(s.ov)]}</div>`:`<span class=mu>step ${k} of ${n}</span>`}`}

/* ---- Turing tape stepper ---- */
const TS={};
function tapeH(id){const p=id.split(' ');let l='',q,r;if(p.length==3)[l,q,r]=p;else[q,r]=p;const cells=[...l].map(c=>({c})).concat([...(r||'0')].map((c,i)=>({c,h:i==0})));const pad=()=>({c:'0',b:1});
 return '<div class=tape>'+[pad(),pad(),...cells,pad(),pad()].map(x=>`<div class=cw><small>${x.h?esc(q):'&nbsp;'}</small><div class="cell ${x.h?'hd':''} ${x.b?'mu':''}">${x.c}</div></div>`).join('')+'</div>'}
function tmStepper(id,src,args,fin){const r=tmGo(src,args,new Set(fin)).r;TS[id]={r,k:0};PEND.push(()=>tsDraw(id));return `<div id="ts_${id}"></div>`}
window.tsGo=(id,d)=>{const s=TS[id];s.k=d==null?0:Math.max(0,Math.min(s.r.ids.length-1,s.k+d));tsDraw(id)};
window.tsSet=(id,k)=>{TS[id].k=+k;tsDraw(id)};
function tsDraw(id){const s=TS[id],r=s.r,k=s.k,n=r.ids.length-1,e=document.getElementById('ts_'+id);if(!e)return;const ones=(r.ids[k].match(/1/g)||[]).length;
 e.innerHTML=tapeH(r.ids[k])+`<div class=row><button onclick="tsGo('${id}',-1)">◀</button><input type=range min=0 max=${n} value=${k} style="flex:1;width:auto;min-width:100px" oninput="tsSet('${id}',this.value)"><button onclick="tsGo('${id}',1)">▶</button><button onclick="tsGo('${id}')">⏮</button></div><span class=mu>step ${k}/${n} · ones on tape: <b>${ones}</b></span>${k==n&&r.final?` <b class=ok>✔ halts in final state: result = ${r.result}</b>`:''}`}

/* ---- cells ---- */
const cells=(a)=>'<div class=cls>'+a.map(([t,c])=>`<div class="cl ${c||''}">${t}</div>`).join('')+'</div>';
const unary=(n,c)=>[...Array(n+1)].map(()=>['1',c||'i']);

/* ---- tests explorer ---- */
const TST=['Z≥Y ∨ Z>X','X=Y','(X<Y) ∧ (Y<Z)','¬(X<Y)','X≠Y ∨ Z=0'];
function tnode(t,g){const s=CP.ts(t,1),E=CP.etExpr(t),v=CP.evalE(CP.parseExpr(E),g),tv=CP.evalT(t,g),kids=t.and||t.or||(t.not?[t.not]:[]);
 return `<div class="tn ${tv?'T':'F'}"><b>${esc(s)}</b> <span class="pl ${tv?'T':'F'}">${tv?'true':'false'}</span> <span class=mu>E = ${v}</span> <span class=mu>= ${esc(E)}</span>${kids.map(k=>tnode(k,g)).join('')}</div>`}
window.tsRun=()=>{const T=CP.parseTest($('#tsel').value),m={X:BigInt($('#tx').value),Y:BigInt($('#ty').value),Z:BigInt($('#tz').value)};
 $('#tvx').innerHTML=['X','Y','Z'].map(v=>`<div class=vbx><small>${v}</small><b>${m[v]}</b></div>`).join('');$('#ttree').innerHTML=tnode(T,n=>m[n]||0n)};

/* ---- chapters ---- */
const CH=[];
CH.push({t:'1 Algorithm',f:()=>{
 const flow=svg(460,110,`${bx(8,32,70,42,'input','b2')}${ar(78,53,112,53)}<rect class=b x=112 y=10 width=236 height=90 rx=10 /><text class=s x=230 y=28>finite list of instructions</text>${bx(128,38,56,30,'1','b')}${bx(194,38,56,30,'2','b')}${bx(260,38,56,30,'…','b')}<path class=a d="M288,70 C288,96 160,96 156,72"/><text class=s x=222 y=94>loop ↻ (may never end)</text>${ar(348,53,382,53)}${bx(382,32,70,42,'f(x)','g')}`);
 const seq=svg(200,64,`${bx(6,16,40,32,'A','b')}${ar(46,32,64,32)}${bx(64,16,40,32,'B','b')}${ar(104,32,122,32)}${bx(122,16,40,32,'C','b')}<text class=s x=100 y=60>one after another</text>`);
 const rep=svg(200,84,`<path class=l d="M60,40 L100,16 L140,40 L100,64 Z" style="fill:var(--cd);stroke:var(--ac);stroke-width:1.6"/><text class=t x=100 y=44>test?</text>${ar(140,40,168,40)}${bx(168,24,28,32,'δ','b')}<path class=a d="M182,56 C182,80 100,82 100,66"/><text class=s x=34 y=34>no: exit</text><text class=s x=154 y=22>yes</text>`);
 return card('What is an algorithm?',flow+`<div class=ex2>${ck('① finite','a')}${ck('② loops are the only way to run forever','b')}${ck('③ computes a function','c')}</div>`)+
 card('Example: record a TV show',`<div class=chp><div>🔁 look for the “on” button<br>${ck('loop','b')}</div><div>👆 press it<br>${ck('basic','a')}</div><div>📺 pick the channel<br>${ck('macro','c')}</div><div>❓ started? press rec, else wait<br>${ck('if-then-else','c')}</div></div>`)+
 card('Computation model = basic operations + 2 ways to combine',seq+rep+key('We study two models: <b>While programs</b> and <b>Turing machines</b>.'))}});

CH.push({t:'2 While',f:()=>{
 const rows=[['begin','compound','c'],['  Z := X;','macro','c'],['  U := 0;','basic','a'],['  while U≠Y do','while','b'],['  begin','compound','c'],['    Z := succ(Z);','basic','a'],['    U := succ(U)','basic','a'],['  end','',''],['end','','']];
 const code='<div style="font:15px ui-monospace,monospace">'+rows.map(([t,k,c])=>`<div style="display:flex;justify-content:space-between;gap:8px"><span style="white-space:pre">${esc(t)}</span>${k?ck(k,c):''}</div>`).join('')+'</div>';
 return card('Three kinds of statements',code+`<span class=mu>Only test: <code>X≠Y</code> · Only operations: <code>succ</code>, <code>pred</code>, <code>0</code> · variables hold natural numbers</span>`)+
 card('Watch it run: Z := X + Y',`<span class=mu>X = 3, Y = 2 (press ▶)</span>`+stepper('add',L(['begin','  Z:=X;','  U:=0;','  while U≠Y do','  begin','    Z:=succ(Z);','    U:=succ(U)','  end','end']),{X:3n,Y:2n},'Z')+key('<code>Z := X</code> is a macro (next chapter): here it simply copies X into Z.'))+
 card('Careful: pred(0) = 0',`<div class=ex2>${[3,2,1,0,0,0].map((n,i)=>`<div class="cl ${i>2?'z':'i'}">${n}</div>${i<5?'<span class=mu>→</span>':''}`).join('')}</div><span class=mu>The domain is ℕ, so numbers never go below 0.</span>`)+
 `<div class=row>${practice('c_sem')}${btn('🧪 While lab','openWP(2)')}</div>`}});

CH.push({t:'3 Macros',f:()=>{
 const ms=[['Z := X','copy','begin Z:=succ(X); Z:=pred(Z) end','X=4 → Z=4'],['Z := X + Y','add',`loop: Z:=succ(Z) , Y times`,'3+4 = 7'],['Z := X ∸ Y','bounded minus',`loop: Z:=pred(Z) , Y times`,'3∸5 = 0'],['Z := X * Y','multiply','loop: Z:=Z+X , Y times','3·4 = 12'],['Z := X div Y','quotient','subtract Y until 0, count','17 div 5 = 3'],['Z := X mod Y','remainder','same, keep W before last ∸','17 mod 5 = 2']];
 const g=ms.map(([a,n,e,x])=>`<div><code><b>${esc(a)}</b></code><br><span class=mu>${n}</span><br><span class=ck>${esc(x)}</span><details><summary class=mu>code</summary><span class=mu>${esc(e)}</span></details></div>`).join('');
 const lab=svg(440,86,`${bx(8,22,120,40,'Z := X + Y','b2','macro (a label)')}${ar(128,42,168,42)}${bx(168,6,264,74,'begin  Z := X;  U := 0;','b','while U≠Y do …  end')}<text class=s x=300 y=96>its code, with fresh variables</text>`);
 return card('A macro is a label for a program',lab+key('To use it: <b>replace the label by its code</b> (and use variables the main program does not need).'))+
 card('The macro toolbox',`<div class=chp>${g}</div>`)+
 `<div class=row>${btn('▶ + ','openWP(0)')}${btn('▶ ∸','openWP(1)')}${btn('▶ ×','openWP(2)')}${btn('▶ div','openWP(3)')}${btn('▶ mod','openWP(4)')}${practice('c_wpd')}</div>`}});

CH.push({t:'4 Tests',f:()=>{
 PEND.push(()=>tsRun());
 const rules=`<div class=chp><div><code>X&lt;Y</code><br>↦ <b>Y ∸ X</b></div><div><code>T1 ∧ T2</code><br>↦ <b>E1 * E2</b></div><div><code>T1 ∨ T2</code><br>↦ <b>E1 + E2</b></div><div><code>¬T</code><br>↦ <b>1 ∸ E</b></div></div>`;
 const iff=svg(300,100,`<path class=l d="M20,50 L70,20 L120,50 L70,80 Z" style="fill:var(--cd);stroke:var(--ac);stroke-width:1.6"/><text class=t x=70 y=54>T?</text>${ar(120,50,160,28)}${ar(120,50,160,74)}${bx(160,12,60,32,'δ1','g')}${bx(160,58,60,32,'δ2','b2')}<text class=s x=140 y=30>true</text><text class=s x=140 y=82>false</text><text class=s x=150 y=10>if T then δ1 else δ2</text>`);
 const rep=svg(300,100,`${bx(10,34,60,32,'δ','b')}${ar(70,50,110,50)}<path class=l d="M110,50 L150,22 L190,50 L150,78 Z" style="fill:var(--cd);stroke:var(--ac);stroke-width:1.6"/><text class=t x=150 y=54>T?</text>${ar(190,50,226,50)}<path class=a d="M150,78 C150,98 40,98 40,68"/><text class=s x=95 y=94>false: again</text><text class=s x=210 y=42>true: exit</text><text class=s x=150 y=10>repeat δ until T</text>`);
 return card('Try it: slide the values',`<div class=row><select id=tsel onchange=tsRun()>${TST.map(t=>`<option>${t}</option>`).join('')}</select></div><div class=row>X <input type=range id=tx min=0 max=6 value=2 oninput=tsRun()> Y <input type=range id=ty min=0 max=6 value=1 oninput=tsRun()> Z <input type=range id=tz min=0 max=6 value=5 oninput=tsRun()></div><div class=vrow id=tvx></div><div id=ttree></div>`+key('<b>T is true ⇔ E<sub>T</sub> &gt; 0</b>. Green = true, red = false.'))+
 card('How to build E<sub>T</sub>',rules)+
 card('Then everything else is a macro',iff+rep+`<span class=mu><code>while T do δ</code> recomputes E<sub>T</sub> after every δ, because δ can change T.</span>`)+
 `<div class=row>${practice('c_et')}${btn('🧪 Build E_T in the lab','openWP(7)')}</div>`}});

CH.push({t:'5 Semantics',f:()=>{
 const row=(lab,items)=>`<div class=mu>${lab}</div>${cells(items)}`;
 const vec=card('Which inputs does a 3-variable program get?',
  row('j = 1 (one input)  →  â₀ = (x, 0, 0)',[['x','i'],['0','z'],['0','z']])+
  row('j = 3  →  â₀ = (x, y, z)',[['x','i'],['y','i'],['z','i']])+
  row('j = 5 (too many)  →  â₀ = (x, y, z), the rest is ignored',[['x','i'],['y','i'],['z','i'],['u','x'],['v','x']])+
  `<div class=ex2>${ck('k ≥ j: fill with zeros','a')}${ck('k &lt; j: drop the extra inputs','c')}${ck('answer = final X1 → <b>φ</b>','b')}</div>`);
 const ex=card('Example: φ of one program, different arities',`${pre(PR.sub)}<div class=chp>${[[[4],1],[[2,7,1],3],[[3,9,1,1,1],5]].map(([a,j])=>`<div>φ<sup>(${j})</sup>(${a.join(', ')})<br><span class=big>${CP.out(CP.parse(PR.sub),a)}</span></div>`).join('')}</div><span class=mu>Same program, a different function for each arity.</span>`);
 const tr=card('Computation sequence: state vectors',`<span class=mu>X1:=0; while X1≠X2 do X1:=succ(X1) · â₀ = (4, 2)</span>`+stepper('seq',PR.p1,{X1:4n,X2:2n},'X1'));
 return vec+ex+tr+`<div class=row>${practice('c_sem')}${practice('c_trace')}${btn('🧪 While lab','openWP(5)')}</div>`}});

CH.push({t:'6 Compose',f:()=>{
 const strip=svg(440,100,`<rect class=b2 x=8 y=34 width=176 height=34 rx=6 /><text class=t x=96 y=56>used by Pg: X1 … Xk</text><rect class=g x=190 y=34 width=240 height=34 rx=6 /><text class=t x=310 y=56>safe: Xk+1, Xk+2, …</text><text class=s x=96 y=86>Pg overwrites these</text><text class=s x=310 y=86>keep what you need later here</text><text class=s x=220 y=20>memory (variables)</text>`);
 const steps=`<div class=chp><div>${ck('① save','a')}<br>copy values you still need into Xk+1…</div><div>${ck('② prepare','b')}<br>put the inputs of Pg in X1…Xi, zero the rest</div><div>${ck('③ run','c')}<br>execute Pg</div><div>${ck('④ collect','a')}<br>result is in X1: store it safely</div></div>`;
 const Pg=PR.mul.split('\n').map(l=>'  '+l).join('\n');
 const Pf=L(['begin','  X5:=X1;','  X6:=X3;','  X1:=X5∸X2;','  X2:=X5+X2;','  X3:=0;','  X4:=0;',Pg,'  X7:=X1;','  X1:=X5∸X6;','  X2:=X5+X6;','  X3:=0;','  X4:=0;',Pg,'  X1:=X1+X7','end']);
 return card('The 4-step recipe',strip+steps)+
 card('Live: f(x,y,z) = g(x∸y, x+y) + g(x∸z, x+z)',`<span class=mu>Here Pg computes g(a,b) = a·b with k = 4 variables. Input (2, 1, 1): expected g(1,3) + g(1,3) = 6.</span>`+stepper('comp',Pf,{X1:2n,X2:1n,X3:1n},'X1')+`<details><summary>Show the composed program</summary>${pre(Pf)}</details>`+key('Watch X5, X6, X7: they survive each run of Pg; X1…X4 are overwritten.'))+
 `<div class=row>${practice('c_wpd')}${practice('c_con')}</div>`}});

CH.push({t:'7 Turing',f:()=>{
 const m=svg(460,150,`<text class=s x=230 y=12>tape (infinite both ways)</text>${[0,1,2,3,4,5,6].map(i=>`<rect class="${i==2?'b2':'b'}" x=${70+i*46} y=20 width=46 height=36 /><text class=t x=${93+i*46} y=44>${[0,1,1,1,0,1,1][i]}</text>`).join('')}${ar(162,92,162,60)}<text class=s x=162 y=106>read/write head</text><rect class=g x=122 y=112 width=80 height=30 rx=8 /><text class=t x=162 y=132>state q0</text>${bx(300,100,150,44,'move: L R N H','b','write · change state')}`);
 const st=svg(440,150,`<circle class=b cx=70 cy=70 r=26 /><text class=t x=70 y=74>q0</text><circle class=b cx=220 cy=70 r=26 /><text class=t x=220 y=74>q1</text><circle class=g cx=370 cy=70 r=26 /><circle class=g cx=370 cy=70 r=21 /><text class=t x=370 y=74>q2</text>${ar(96,70,194,70)}<text class=s x=145 y=62>1/0,R</text>${ar(246,70,344,70)}<text class=s x=295 y=62>0/0,R</text><path class=a d="M208,45 C200,10 240,10 232,45"/><text class=s x=220 y=8>1/1,R</text><path class=a d="M382,94 C400,134 340,134 358,94"/><text class=s x=370 y=146>1/0,H</text><text class=s x=70 y=118>start</text>`);
 const un=`<div class=mu>n is written with n+1 ones (so 0 is one 1):</div>${cells(unary(3))}<div class=mu>(x, y) = (2, 1): blocks separated by one 0</div>${cells([...unary(2),['0','z'],...unary(1,'sp')])}<div class=mu>result = number of 1s when the machine halts in a final state</div>`;
 return card('Parts of a Turing machine',m+key('Each move: <b>read</b> symbol → <b>write</b> → <b>move</b> → <b>new state</b>. Formal: M = (X, Q, T, i, F).'))+
 card('Inputs and outputs',un)+
 card('A machine for x + y: state diagram',st+`<span class=mu>label <code>read/write,move</code></span>`)+
 card('Watch it run on (2, 1)',tmStepper('add',TM_ADD,[2,1],['q2'])+`<span class=mu>5 ones start, 2 are erased: 2 + 1 = 3 ✔</span>`)+
 `<div class=row>${practice('c_tmq')}${practice('c_tmd')}${btn('🧪 Turing lab','openTM(0)')}${btn('2x machine','openTM(1)')}</div>`}});

CH.push({t:'8 Church',f:()=>{
 const eq=svg(460,130,`${bx(10,28,150,60,'While programs','b2')}${bx(300,28,150,60,'Turing machines','g')}<path class=a d="M160,46 L300,46"/><path class=a d="M300,72 L160,72"/><text class=s x=230 y=40>variables = blocks of 1s</text><text class=s x=230 y=90>tape = two lists</text><text class=t x=230 y=114>each simulates the other</text>`);
 const chips=['Multi-tape TM','Non-deterministic TM','λ-calculus','Register machines','Partial recursive functions','Cellular automata','Markov algorithms','Type-0 grammars'];
 return card('Both models compute the same functions',eq+key('Every Turing-computable function is while-computable, and vice versa.'))+
 card('Many other models: all equivalent',`<div class=ex2>${chips.map(c=>ck(c,'b')).join('')}</div>`)+
 card('Church–Turing thesis',`<div class=ex2><div class=big>effectively calculable</div><div class=big>⇒</div><div class=big>computable</div></div>${key('A <b>thesis</b>, not a theorem: “effective procedure” has no formal definition, so it cannot be proved.')}<span class=mu>Open questions: is the mind a Turing machine? is the universe one?</span>`)+
 `<div class=row>${practice('c_con')}</div>`}});

CH.push({t:'9 Code·U·s-m-n',f:()=>{
 const Q='begin\n  X1:=0\nend',bs=CP.bits(Q),code=String(CP.cod(Q));
 const SUC='begin\n  X1:=succ(X1)\nend',e=CP.cod(SUC),u=CP.out(CP.decod(e).P,[7]);
 const enc=`<div class=cls>${[...Q].slice(0,6).map((c,i)=>`<div style="text-align:center"><div class="cl i">${c=='\n'?'⏎':c==' '?'␣':esc(c)}</div><small class=mu style="font:10px ui-monospace,monospace">${bs[i]}</small></div>`).join('')}<span class=mu>…</span></div><div class=mu>↓ glue all the 8-bit groups, read as a binary number</div><div class=f style="word-break:break-all;white-space:normal;font-size:13px">${code}</div>`;
 const uni=svg(460,92,`${bx(8,10,96,32,'e (code)','b2')}${bx(8,50,96,32,'x1 … xj','b')}${ar(104,26,150,42)}${ar(104,66,150,52)}${bx(150,22,170,50,'decode e → run P','b','Φ is computable')}${ar(320,47,356,47)}${bx(356,28,96,38,'φe(x1…xj)','g')}`);
 const smn=svg(460,110,`<text class=s x=130 y=12>P has m+n inputs</text>${[0,1,2,3].map(i=>`<rect class="${i<2?'sp':'b'}" x=${20+i*60} y=18 width=56 height=30 rx=6 style="${i<2?'fill:color-mix(in srgb,#d9a406 30%,transparent);stroke:#d9a406':''}"/><text class=t x=${48+i*60} y=38>${['C1','C2','x1','x2'][i]}</text>`).join('')}<text class=s x=110 y=62>fixed</text><text class=s x=200 y=62>free</text>${ar(130,66,130,84)}<text class=s x=130 y=100>Q has n inputs</text>${[0,1].map(i=>`<rect class=b x=${250+i*60} y=60 width=56 height=30 rx=6 /><text class=t x=${278+i*60} y=80>${['x1','x2'][i]}</text>`).join('')}<text class=s x=340 y=106>φQ(x) = φP(C, x)</text>`);
 return card('Encoding: a program is a number',enc+key('<b>cod</b> is total and one-to-one; <b>decod(n)</b> returns a fixed program Q when n codes nothing. So decod(cod(P)) = P, but cod(decod(n)) = n can fail (try n = 0).'))+
 card('Universality: one program runs them all',uni+`<div class=ex2>${ck('e = cod(X1 := succ(X1))','b')}${ck('x = 7','b')}${ck('Φ(e, 7) = <b>'+u+'</b>','a')}</div><span class=mu>As a macro: <code>Z := U(X, Y)</code>. If φX(Y) never halts, neither does the macro.</span>`)+
 card('s-m-n: fix some inputs, keep the rest',smn+`<span class=mu>Q first moves the free inputs up, then writes C into X1…Xm, then runs P. Example: P = x·y with C = 5 → Q computes 5·y: Q(4) = <b>${CP.out(CP.parse(CP.smn(PR.mul,1,1,[5])),[4])}</b>.</span>`)+
 `<div class=row>${btn('🧪 Code · U · s-m-n lab','openFR()',1)}${practice('c_smn')}</div>`}});

window.VZ={svg,bx,ar,card,key,ck,btn,cells,PEND};
window.ctGo=i=>{S.ctc=i;CTUT();window.scrollTo(0,0)};
window.CTUT=function(){PEND.length=0;const i=S.ctc||0;
 $('#M').innerHTML=`<div class=row>${CH.map((c,k)=>`<button class="pl ${k==i?'on':''}" onclick="ctGo(${k})">${c.t}</button>`).join('')}</div>`+CH[i].f()+`<div class=row><button ${i?'':'disabled'} onclick="ctGo(${i-1})">← Back</button><button class=on ${i<CH.length-1?'':'disabled'} onclick="ctGo(${i+1})">Next →</button></div>`;
 PEND.forEach(f=>f())};
})();

