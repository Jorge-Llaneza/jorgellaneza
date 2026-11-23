/* ===== third batch: boost the smaller banks + new puzzle stories ===== */
(function(){
const L=a=>a.join('\n');
const add=(k,items)=>{(B[k]=B[k]||[]).push(...items)};
let sd=777;const R=n=>{sd=(sd*1103515245+12345)&0x7fffffff;return(sd>>8)%n};const pk=a=>a[R(a.length)];
/* puzzles: stories (A,B,C = innocent) */
const ST=[
 {t:'A: “B is guilty” · B: “A and C are innocent” · C: “A is guilty”',f:['¬B','A∧C','¬A']},
 {t:'A: “B or C is innocent” · B: “A is guilty” · C: “A and B are innocent”',f:['B∨C','¬A','A∧B']},
 {t:'A: “if B is guilty, so is C” · B: “C is innocent” · C: “A or B is guilty”',f:['¬B→¬C','C','¬A∨¬B']},
 {t:'A: “B and C are both innocent or both guilty” · B: “C is guilty” · C: “A is innocent”',f:['B↔C','¬C','A']},
 {t:'A: “one of A and B is guilty” · B: “A is innocent and C is guilty” · C: “B is guilty”',f:['¬A∨¬B','A∧¬C','¬B']},
 {t:'A: “if C is innocent, B is too” · B: “A is guilty and C is innocent” · C: “not both A and B are innocent”',f:['C→B','¬A∧C','¬(A∧B)']}];
window.PUZST=ST;const PQ=['Can all three statements be true? Who is guilty?','All three innocent: who is lying?','Innocent tell the truth, guilty lie: who is guilty?'];
add('puz',ST.flatMap((_,s)=>[0,1,2].map(k=>[k,s])));
window.PZW={};const oPS=PS.slice();
const swap=d=>{if(d&&d.length>1){PS.splice(0,3,...ST[d[1]].f)}};
const unswap=()=>{PS.splice(0,3,...oPS)};window.PZW={swap,unswap};
const oEx=exH;
exH=function(e){if(e.c=='puz'&&e.d.length>1){swap(e.d);let h;try{h=oEx(e)}finally{unswap()}
 return h.replace(/<b>A: "B did it[^]*?<\/b><br>[^<]*/,'<b>'+ST[e.d[1]].t+'</b><br>'+PQ[e.d[0]])}return oEx(e)};
const oJ=judge;
judge=function(e,a){if(e.c=='puz'&&e.d.length>1){swap(e.d);try{return oJ(e,a)}finally{unswap()}}return oJ(e,a)};
/* more formalization */
add('formal',[
 ['I will go to the party unless I have to work. (p: party, q: work)','¬q→p'],
 ['If the engine is hot and the oil is low, the light turns on. (p: hot, q: low oil, r: light)','p∧q→r'],
 ['The test passes only if both the input is valid and the code is correct. (p: pass, q: valid, r: correct)','p→q∧r'],
 ['Either it is a cat or it is a dog, never both. (p: cat, q: dog)','¬(p↔q)'],
 ['If you do not pay, you do not get in. (p: pay, q: in)','¬p→¬q'],
 ['I am happy exactly when I sleep well. (p: happy, q: sleep)','p↔q'],
 ['Not both the server and the backup are down. (p: server, q: backup)','¬(p∧q)'],
 ['It is false that either I win or I draw. (p: win, q: draw)','¬(p∨q)'],
 ['If I study, then I pass if the exam is fair. (p: study, q: pass, r: fair)','p→(r→q)'],
 ['I get the job if I am qualified and I interview well. (p: job, q: qualified, r: interview)','q∧r→p'],
 ['The door opens only when the code is right or the master key is used. (p: opens, q: code, r: key)','p→q∨r'],
 ['If it does not rain, I walk; if it rains, I take the bus. (p: rain, q: walk, r: bus)','(¬p→q)∧(p→r)']]);
/* more CNF/normal-form trainers */
const gf=(d,V,O)=>{const g=d=>{if(d==0||(d<3&&R(4)==0))return pk(V);const o=pk(O);if(o=='¬')return'¬'+g(d-1);return'('+g(d-1)+o+g(d-1)+')'};return g(d)};
const cn=[];while(cn.length<12){const f=gf(3,['p','q','r'],['∧','∨','→','↔','¬']);if(f.length>=9&&f.length<=22&&!B.cnfi.includes(f)&&!cn.includes(f))cn.push(f)}
add('cnfi',cn);
const PRE=['∀X∃Y','∃X∀Y','∀X∀Y','∃X∃Y','¬∀X∃Y','¬∃X∀Y','∀X¬∃Y','∃X¬∀Y'],KER=['(p(X,Y)→q(X))','(p(X)∨¬q(X,Y))','(p(X)↔q(Y))','(p(X,Y)∧q(Y,X))→r(X)','¬(p(X)∧q(Y))'];
const sn=[];while(sn.length<14){const f=pk(PRE)+pk(KER);if(!B.nfi.includes(f)&&!sn.includes(f))sn.push(f)}
add('nfi',sn);add('snf',sn.slice(0,6).map(f=>f));
add('pres',[
 ['Even numbers',['∀X(even(X)→¬odd(X))','even(two)'],'¬odd(two)'],
 ['Chain',['∀X(a(X)→b(X))','∀X(b(X)→c(X))','∀X(c(X)→d(X))','a(k)'],'d(k)'],
 ['Existence',['∃X(p(X)∧q(X))'],'∃X p(X)'],
 ['Existence (bad)',['∃X p(X)','∃X q(X)'],'∃X(p(X)∧q(X))'],
 ['All and some',['∀X p(X)','∃X q(X)'],'∃X(p(X)∧q(X))'],
 ['Contrapositive',['∀X(p(X)→q(X))','¬q(a)'],'¬p(a)'],
 ['Symmetric',['∀X∀Y(friend(X,Y)→friend(Y,X))','friend(ann,bob)'],'friend(bob,ann)'],
 ['Parents',['∀X∀Y(parent(X,Y)→anc(X,Y))','∀X∀Y∀Z(parent(X,Y)∧anc(Y,Z)→anc(X,Z))','parent(a,b)','parent(b,c)'],'anc(a,c)'],
 ['Negated universal',['¬∀X p(X)'],'∃X ¬p(X)'],
 ['Negated existential',['¬∃X p(X)'],'∀X ¬p(X)'],
 ['Disjunctive',['∀X(p(X)∨q(X))','∀X ¬p(X)'],'∀X q(X)'],
 ['Equality-like',['∀X r(X,X)','∀X∀Y(r(X,Y)→r(Y,X))'],'∃X∃Y r(X,Y)']]);
/* computability extras */
add('c_trace',[
 {p:L(['begin','  X2:=X1;','  X1:=pred(X2);','  X3:=succ(X1)','end']),a:[4,0,0]},
 {p:L(['begin','  X3:=0;','  while X3≠X1 do','  begin','    X2:=X2+2;','    X3:=succ(X3)','  end','end']),a:[2,1,0]},
 {p:L(['begin','  while X2≠0 do','  begin','    X1:=succ(X1);','    X2:=pred(X2)','  end','end']),a:[3,4]},
 {p:L(['begin','  X2:=X1;','  X1:=X3;','  X3:=X2','end']),a:[5,0,2]},
 {p:L(['begin','  X3:=0;','  while X3≠X2 do','  begin','    X1:=X1+X1;','    X3:=succ(X3)','  end','end']),a:[3,2,0]},
 {p:L(['begin','  X2:=0;','  while X2≠X1 do','  begin','    X3:=succ(X3);','    X2:=succ(X2)','  end;','  X1:=0','end']),a:[3,0,0]},
 {p:L(['begin','  X1:=pred(X1);','  X1:=pred(X1);','  X1:=pred(X1)','end']),a:[2]},
 {p:L(['begin','  X3:=succ(0);','  while X1≠0 do','  begin','    X3:=X3+X3;','    X1:=pred(X1)','  end;','  X2:=X3','end']),a:[3,0,0]},
 {p:L(['begin','  X2:=succ(X2);','  X2:=succ(X2);','  X1:=X1+X2','end']),a:[1,0]},
 {p:L(['begin','  X3:=X1;','  while X3≠X2 do','    X3:=pred(X3)','end']),a:[2,2,0]}]);
add('c_smn',[
 {p:L(['begin','  X1:=X1*X2','end']),m:1,C:[2],x:[9]},
 {p:L(['begin','  X1:=X1+X2','end']),m:1,C:[0],x:[6]},
 {p:L(['begin','  X1:=X2∸X1','end']),m:1,C:[5],x:[3]},
 {p:L(['begin','  X1:=X1*X2+X3','end']),m:2,C:[2,3],x:[4]},
 {p:L(['begin','  X1:=X1+X2+X3','end']),m:2,C:[5,5],x:[0]},
 {p:L(['begin','  X1:=X1*X1','end']),m:1,C:[7],x:[1]},
 {p:L(['begin','  X1:=X1*X2*X3','end']),m:1,C:[3],x:[2,5]},
 {p:L(['begin','  X1:=X1+X1+X2','end']),m:1,C:[4],x:[1]},
 {p:L(['begin','  X1:=X1∸X2∸X3','end']),m:1,C:[10],x:[3,2]},
 {p:L(['begin','  X3:=0;','  while X2≠X3 do','  begin','    X1:=succ(X1);','    X3:=succ(X3)','  end','end']),m:1,C:[1],x:[1]}]);
add('c_tmd',[
 {t:'f(x) = x + 4',f:x=>x+4,ins:[[0],[1],[3]],ref:L(['(q0, 1, 1, L, q1)','(q1, 0, 1, L, q2)','(q2, 0, 1, L, q3)','(q3, 0, 1, H, qf)','final: qf']),hint:'Add three 1s to the left of the input.'},
 {t:'f(x, y) = x + 1',f:(x,y)=>x+1,ins:[[0,0],[2,1],[3,4],[0,5]],ref:L(['(q0, 1, 1, R, q1)','(q1, 1, 1, R, q1)','(q1, 0, 0, R, q2)','(q2, 1, 0, R, q2)','final: q2']),hint:'Keep the first block (x+1 ones) and erase the second block.'},
 {t:'f(x) = x ∸ 3',f:x=>Math.max(0,x-3),ins:[[0],[2],[3],[6]],ref:L(['(q0, 1, 0, R, q1)','(q1, 1, 0, R, q2)','(q2, 1, 0, R, q3)','(q3, 1, 0, R, q4)','final: q1, q2, q3, q4']),hint:'Erase four 1s at most.'.replace('four','up to four')},
 {t:'f(x, y) = y + 1',f:(x,y)=>y+1,ins:[[0,0],[2,1],[3,4],[0,5]],ref:L(['(q0, 1, 0, R, q0)','(q0, 0, 0, R, q1)','(q1, 1, 1, H, q2)','final: q2']),hint:'Erase the first block, skip the separator, and leave the second block alone (y+1 ones).'}]);
add('c_wpd',[
 {t:'Z := 2·X + 1',in:['X'],f:x=>2*x+1,allow:['asg','add'],ins:[[0],[1],[4]],ref:L(['begin','  Z:=X+X;','  Z:=succ(Z)','end'])},
 {t:'Z := X + Y + 2',in:['X','Y'],f:(x,y)=>x+y+2,allow:['asg','add'],ins:[[0,0],[3,4],[5,0]],ref:L(['begin','  Z:=X+Y;','  Z:=succ(Z);','  Z:=succ(Z)','end'])},
 {t:'Z := X + 1 if X is even, X otherwise',in:['X'],f:x=>x%2==0?x+1:x,allow:null,ins:[[0],[1],[4],[7]],ref:L(['begin','  if (X mod 2)=0 then Z:=succ(X) else Z:=X','end'])},
 {t:'Z := X · Y + 1',in:['X','Y'],f:(x,y)=>x*y+1,allow:null,ins:[[0,0],[3,4],[5,0]],ref:L(['begin','  Z:=X*Y;','  Z:=succ(Z)','end'])},
 {t:'Z := 1 if X is even, otherwise Z := 0',in:['X'],f:x=>x%2==0?1:0,allow:null,ins:[[0],[1],[4],[7]],ref:L(['begin','  if (X mod 2)=0 then Z:=1 else Z:=0','end'])},
 {t:'Z := 1 if X < Y, otherwise Z := 0',in:['X','Y'],f:(x,y)=>x<y?1:0,allow:null,ins:[[0,0],[3,4],[5,2],[6,6]],ref:L(['begin','  if X<Y then Z:=1 else Z:=0','end'])},
 {t:'Z := X ∸ 1',in:['X'],f:x=>Math.max(0,x-1),allow:[],ins:[[0],[1],[5]],ref:L(['begin','  Z:=pred(X)','end']),note:'Only basic statements.'},
 {t:'Z := (X + Y) div 2',in:['X','Y'],f:(x,y)=>Math.floor((x+y)/2),allow:null,ins:[[0,0],[3,4],[5,2],[6,6]],ref:L(['begin','  Z:=(X+Y) div 2','end'])}]);
})();

/* ===== fourth batch: smallest banks ===== */
(function(){
const L=a=>a.join('\n');
const add=(k,items)=>{(B[k]=B[k]||[]).push(...items)};
const n0=PUZST.length;
PUZST.push(
 {t:'A: “C is guilty” · B: “A is innocent or C is innocent” · C: “B is guilty”',f:['¬C','A∨C','¬B']},
 {t:'A: “B is innocent” · B: “if A is innocent then C is guilty” · C: “A and B are not both guilty”',f:['B','A→¬C','A∨B']},
 {t:'A: “I am innocent and B is guilty” · B: “C is innocent” · C: “A is guilty or B is guilty”',f:['A∧¬B','C','¬A∨¬B']},
 {t:'A: “B and C are not both innocent” · B: “A is guilty” · C: “A and B are both innocent”',f:['¬(B∧C)','¬A','A∧B']},
 {t:'A: “C is innocent if and only if B is guilty” · B: “A is innocent” · C: “B is innocent or A is guilty”',f:['C↔¬B','A','B∨¬A']});
add('puz',PUZST.slice(n0).flatMap((_,i)=>[0,1,2].map(k=>[k,n0+i])));
add('c_tmd',[
 {t:'f(x) = x + 5',f:x=>x+5,ins:[[0],[1],[3]],ref:L(['(q0, 1, 1, L, q1)','(q1, 0, 1, L, q2)','(q2, 0, 1, L, q3)','(q3, 0, 1, L, q4)','(q4, 0, 1, H, qf)','final: qf']),hint:'Write four extra 1s to the left of the input.'},
 {t:'f(x, y) = x + y + 2',f:(x,y)=>x+y+2,ins:[[0,0],[2,1],[3,4],[0,5]],ref:L(['(q0, 1, 1, H, qf)','final: qf']),hint:'The tape already holds exactly x+y+2 ones: just halt.'},
 {t:'f(x) = x ∸ 4',f:x=>Math.max(0,x-4),ins:[[0],[3],[4],[7]],ref:L(['(q0, 1, 0, R, q1)','(q1, 1, 0, R, q2)','(q2, 1, 0, R, q3)','(q3, 1, 0, R, q4)','(q4, 1, 0, R, q5)','final: q1, q2, q3, q4, q5']),hint:'Erase up to five 1s (the input has x+1).'},
 {t:'f(x, y) = 0',f:(x,y)=>0,ins:[[0,0],[2,1],[3,4],[0,5]],ref:L(['(q0, 1, 0, R, q0)','(q0, 0, 0, R, q1)','(q1, 1, 0, R, q1)','final: q1']),hint:'Erase both blocks, crossing the separator.'},
 {t:'f(x, y) = y + 2',f:(x,y)=>y+2,ins:[[0,0],[2,1],[3,4],[0,5]],ref:L(['(q0, 1, 0, R, q0)','(q0, 0, 0, R, q1)','(q1, 1, 1, L, q2)','(q2, 0, 1, H, qf)','final: qf']),hint:'Erase the first block, then add one 1 where the separator was.'}]);
add('c_smn',[
 {p:L(['begin','  X1:=X1*X2','end']),m:1,C:[5],x:[5]},
 {p:L(['begin','  X1:=X1+X2','end']),m:1,C:[9],x:[0]},
 {p:L(['begin','  X1:=X1*X2+X3','end']),m:1,C:[3],x:[2,4]},
 {p:L(['begin','  X1:=X2∸X1','end']),m:1,C:[1],x:[0]},
 {p:L(['begin','  X1:=X1*X2*X3','end']),m:2,C:[1,7],x:[6]},
 {p:L(['begin','  X1:=X1∸X2','end']),m:1,C:[2],x:[7]},
 {p:L(['begin','  X1:=X1+X2*X2','end']),m:1,C:[1],x:[4]},
 {p:L(['begin','  X3:=0;','  while X2≠X3 do','  begin','    X1:=X1+X1;','    X3:=succ(X3)','  end','end']),m:1,C:[3],x:[3]}]);
add('c_trace',[
 {p:L(['begin','  X2:=succ(X1);','  X3:=succ(X2);','  X1:=0','end']),a:[2,0,0]},
 {p:L(['begin','  X3:=0;','  while X3≠X2 do','  begin','    X1:=succ(X1);','    X3:=succ(X3)','  end;','  X2:=0','end']),a:[2,3,0]},
 {p:L(['begin','  X3:=X1;','  X1:=X2;','  X2:=X3;','  X3:=0','end']),a:[7,2,5]},
 {p:L(['begin','  while X1≠0 do','  begin','    X2:=X2+X2;','    X1:=pred(X1)','  end','end']),a:[3,1]},
 {p:L(['begin','  X2:=0;','  while X2≠X1 do','  begin','    X3:=X3+3;','    X2:=succ(X2)','  end','end']),a:[2,0,1]},
 {p:L(['begin','  X1:=pred(X1);','  X2:=pred(X2);','  X3:=succ(X1)','end']),a:[3,0,0]},
 {p:L(['begin','  X3:=0;','  while X3≠X1 do','  begin','    X2:=pred(X2);','    X3:=succ(X3)','  end','end']),a:[2,5,0]},
 {p:L(['begin','  X2:=X1;','  X3:=X1;','  X1:=0','end']),a:[6,0,0]}]);
add('c_wpd',[
 {t:'Z := X + 2·Y',in:['X','Y'],f:(x,y)=>x+2*y,allow:['asg','add'],ins:[[0,0],[3,4],[5,0],[0,3]],ref:L(['begin','  Z:=X+Y;','  Z:=Z+Y','end'])},
 {t:'Z := 4 (constant)',in:['X'],f:x=>4,allow:[],ins:[[0],[2],[6]],ref:L(['begin','  Z:=0;','  Z:=succ(Z);','  Z:=succ(Z);','  Z:=succ(Z);','  Z:=succ(Z)','end']),note:'Only basic statements.'},
 {t:'Z := 1 if X = 0, otherwise Z := 0',in:['X'],f:x=>x==0?1:0,allow:null,ins:[[0],[1],[4]],ref:L(['begin','  if X=0 then Z:=1 else Z:=0','end'])},
 {t:'Z := min(X, Y) + 1',in:['X','Y'],f:(x,y)=>Math.min(x,y)+1,allow:null,ins:[[0,0],[3,4],[5,2],[6,6]],ref:L(['begin','  if X<Y then Z:=succ(X) else Z:=succ(Y)','end'])},
 {t:'Z := X · Y · 2',in:['X','Y'],f:(x,y)=>x*y*2,allow:null,ins:[[0,0],[3,4],[5,0],[2,2]],ref:L(['begin','  Z:=X*Y;','  Z:=Z+Z','end'])},
 {t:'Z := Y if X = 0, otherwise Z := X',in:['X','Y'],f:(x,y)=>x==0?y:x,allow:null,ins:[[0,5],[3,4],[0,0],[6,1]],ref:L(['begin','  if X=0 then Z:=Y else Z:=X','end'])},
 {t:'Z := (X ∸ Y) + (Y ∸ X)',in:['X','Y'],f:(x,y)=>Math.abs(x-y),allow:['asg','sub','add'],ins:[[0,0],[3,4],[5,2],[6,6]],ref:L(['begin','  Z:=(X∸Y)+(Y∸X)','end'])}]);
const PRE=['∀X∃Y','∃X∀Y','∀X∀Y∃Z','∃X¬∀Y','∀X∃Y∀Z','¬∀X∃Y','¬∃X∀Y','∀X¬∃Y'],KER=['(p(X,Y)→(q(Y)∨r(X)))','¬(p(X)∧q(Y,X))','(p(X)↔q(Y,X))','(p(X,Y)→(q(Z)∧r(Y)))','(¬p(X)→(q(Y)→r(X)))'];
const all=[];for(const a of PRE)for(const k of KER){if(/Z/.test(k)&&!/Z/.test(a))continue;all.push(a+k)}
let sd=99;const R=n=>{sd=(sd*1103515245+12345)&0x7fffffff;return(sd>>8)%n};
const pick=n=>{const o=[];while(o.length<n){const f=all[R(all.length)];if(!B.nfi.includes(f)&&!B.snf.includes(f)&&!o.includes(f))o.push(f)}return o};
const sn=pick(10);add('nfi',sn);add('snf',sn);
add('pres',[
 ['Birds',['∀X(sparrow(X)→bird(X))','∀X(bird(X)→flies(X))','sparrow(s)'],'flies(s)'],
 ['Everyone owns',['∀X∃Y owns(X,Y)','∀X∀Y(owns(X,Y)→rich(X))'],'rich(a)'],
 ['Wrong converse',['∀X(p(X)→q(X))','∀X(q(X)→r(X))'],'∀X(r(X)→p(X))'],
 ['Union',['∀X(p(X)→q(X))','∀X(r(X)→q(X))'],'∀X(p(X)∨r(X)→q(X))'],
 ['Intersection',['∀X(p(X)→q(X))','∀X(p(X)→r(X))'],'∀X(p(X)→q(X)∧r(X))'],
 ['Existential instance',['∃X(p(X)∧q(X))','∀X(q(X)→r(X))'],'∃X(p(X)∧r(X))'],
 ['Not all, not some',['∀X(p(X)→q(X))','∃X ¬q(X)'],'∃X ¬p(X)'],
 ['Order',['∀X∀Y(lt(X,Y)→¬lt(Y,X))','lt(a,b)'],'¬lt(b,a)'],
 ['Function symbol',['∀X(p(X)→p(s(X)))','p(z)'],'p(s(s(z)))'],
 ['Drinker-lite',['∃X p(X)'],'∀X(p(X)→p(X))'],
 ['Two variables',['∀X∀Y(r(X,Y)→s(Y,X))','r(a,b)'],'s(b,a)'],
 ['Quantifier trap',['∀X(p(X)∨q(X))'],'∀X p(X)∨∀X q(X)']]);
})();

/* ===== Solvers: "Show solution" on every exercise + a custom Solver mode ===== */
(function(){
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const st=document.createElement('style');st.textContent=`
.sxr{display:flex;justify-content:center;overflow-x:auto;padding:6px 0}
.sxn{display:flex;flex-direction:column;align-items:center;padding:0 4px;position:relative}
.sxl{background:var(--ac);color:#fff;border-radius:14px;min-width:26px;text-align:center;padding:2px 9px;font-family:monospace;font-size:14px}
.sxl.v{background:transparent;color:inherit;border:2px solid var(--ac)}
.sxc{display:flex;margin-top:12px;position:relative}
.sxc:before{content:"";position:absolute;top:-12px;left:50%;height:12px;border-left:2px solid var(--ac)}
.sxc>.sxn:before{content:"";position:absolute;top:-12px;left:0;right:0;border-top:2px solid var(--ac)}
.sxc>.sxn:first-child:before{left:50%}.sxc>.sxn:last-child:before{right:50%}.sxc>.sxn:only-child:before{display:none}
.sxc>.sxn:after{content:"";position:absolute;top:-12px;left:50%;height:12px;border-left:2px solid var(--ac)}
.sol{border-left:4px solid #2e9e5b}
.solb{display:inline-block;background:#2e9e5b;color:#fff;border-radius:10px;padding:1px 9px;font-size:12px;margin-bottom:6px}
.sch{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}`;
document.head.appendChild(st);
/* syntax tree for propositional formulas */
const LB={n:'¬',a:'∧',o:'∨',i:'→',e:'↔'},NAME={n:'negation',a:'conjunction',o:'disjunction',i:'implication',e:'biconditional'};
const kids=n=>n.t=='v'?[]:n.t=='n'?[n.a]:[n.l,n.r];
const tree=n=>`<div class=sxn><div class="sxl ${n.t=='v'?'v':''}">${n.t=='v'?n.n:LB[n.t]}</div>${kids(n).length?'<div class=sxc>'+kids(n).map(tree).join('')+'</div>':''}</div>`;
const recap=c=>{const h=window.HOW&&HOW[c];return h?`<div class=mu style="margin-top:6px">Method · ${h.t}</div><div class=hsteps>${h.s.map((s,i)=>`<div class=hs><i>${i+1}</i><span class=sp>${s[1]}</span></div>`).join('')}</div>`:''};
const ev1=I=>{const o={};I.split(', ').forEach(x=>o[x[0]]=x[2]=='T');return o};
/* the correct answer of an exercise, so the checker prints its full explanation */
function oracle(e){const c=e.c,d=e.d;
 switch(c){
  case'formal':case'pform':return d[1];
  case'evalp':return ev(parse(d.f),ev1(d.I))?'T':'F';
  case'cnf':return cs(cnf(parse(d)));
  case'class':return cls(parse(d)).type;
  case'entail':return ent(d[1].map(x=>parse(x)),parse(d[2]))?'n':'s';
  case'pev':return pev(parse(d[0],1),pint(d[1]))?'T':'F';
  case'snf':return'';
  case'unif':return FO.unifyHTML(d).r.ok?'y':'n';
  case'pres':return FO.resolveHTML(d[1],d[2]).ok?'s':'n';
  case'c_wpd':case'c_tmd':return d.ref;
  case'c_con':return String(d.a);
  case'c_et':return CP.etExpr(CP.parseTest(d));
  case'c_sem':{const v=CP.out(CP.parse(d.p),d.a,{max:200000});return v===null?'⊥':String(v)}
  case'c_trace':{const r=CP.run(CP.parse(d.p),Object.fromEntries(d.a.map((v,i)=>['X'+(i+1),BigInt(v)])));return r.vk.map(v=>String(r.st[v]||0n)).join(',')}
  case'c_tmq':{const g=CPQ.tmGo(d.tm,d.a,new Set(d.fin));return g.r.final?String(g.r.result):'⊥'}
  case'c_smn':{const Q=CP.smn(d.p,d.m,d.x.length,d.C);const v=CP.out(CP.parse(Q),d.x,{max:200000});return v===null?'⊥':String(v)}}
 return''}
function solve(e){const c=e.c,d=e.d;
 if(c=='wff'){let f;try{f=parse(d)}catch(x){return`<p class=no>✗ Not well formed</p><p>${esc(x.message)}.</p><div class=f>${esc(d)}</div>`}
  return`<p class=ok>✓ Well formed</p><p>Main connective: <b>${f.t=='v'?'none (an atom)':NAME[f.t]+' '+LB[f.t]}</b>. Syntax tree:</p><div class=sxr>${tree(f)}</div><div class=f>${esc(sh(f))}</div>`}
 if(c=='cnfi')return solve({c:'cnf',d});
 if(c=='nfi')return solve({c:'snf',d});
 if(c=='snf'){const f=FO.parseFO(d),r=FO.clausify(f,FO.names(f));return'Clausal form: <b>'+esc(r.steps[r.steps.length-1].f)+'</b>'+FO.stepsHTML(r.steps,1)}
 if(c=='puz'){PZW.swap(d);let s;try{s=puzSol(d[0])}finally{PZW.unswap()}S.pz=s;const r=judge(e,'');S.pz='';return r.h}
 const a=oracle(e);
 if(c.startsWith('c_'))return CPQ.cJudge(e,a).h;
 return judge(e,a).h}
window.solveHTML=e=>{try{return solve(e)}catch(x){return`<p class=no>Could not solve this: ${esc(x.message)}</p>`}};
const solCard=e=>`<div class="card sol"><span class=solb>✓ Solution — not scored</span>${recap(e.c)}${solveHTML(e)}</div>`;
window.showSol=()=>{const e=S.ex;if(!e)return;$('#sol').innerHTML=solCard(e);$('#sol').scrollIntoView({behavior:'smooth',block:'nearest'})};
const oExH=exH;
exH=function(e){return oExH(e)+(window.NOHELP?'':`<div class=row style="margin:8px 0"><button onclick="showSol()">👁 Show solution <span class=mu>(not scored)</span></button></div><div id=sol></div>`)};
/* ---------------- custom Solver mode ---------------- */
const I=(id,l,ph,ex,ta)=>({id,l,ph,ex,ta});
const SOLV={
 prop:[
  {c:'wff',n:'Well formed?',inp:[I('f','Formula','(p∧q)→¬r','¬(p∨q)→(r∧s)')],build:v=>v.f},
  {c:'evalp',n:'Evaluate',inp:[I('f','Formula','¬(p∧q)→r','¬(p∧q)→r'),I('v','Values','p=T q=F r=F','p=T q=F r=F')],build:v=>{const m=[...v.v.matchAll(/([a-z])\s*[:=]\s*([TFtf10])/g)];if(!m.length)throw Error('Give values like p=T q=F');return{f:v.f,I:m.map(x=>x[1]+':'+('Tt1'.includes(x[2])?'T':'F')).join(', ')}}},
  {c:'cnf',n:'CNF',inp:[I('f','Formula','¬(p∨q)→r','(p→q)∧((q→r)→r)')],build:v=>v.f},
  {c:'class',n:'Truth table',inp:[I('f','Formula','p→(q→p)','(p→q)→(¬q→¬p)')],build:v=>v.f},
  {c:'entail',n:'Soundness',inp:[I('p','Premises (one per line or separated by ;)','p∨q\n¬p','p∨q\n¬p',1),I('q','Conclusion','q','q')],build:v=>['Custom',v.p.split(/[\n;]/).map(x=>x.trim()).filter(Boolean),v.q]}],
 pred:[
  {c:'pev',n:'Evaluate in a model',inp:[I('f','Formula','∀x∃y p(x,y)','∀x∃y p(x,y)'),I('m','Model','dom=A,B; p={(A,B),(B,B)}','dom=A,B; p={(A,B),(B,B)}')],build:v=>[v.f,v.m]},
  {c:'snf',n:'Normal form',inp:[I('f','Formula','∀X(p(X)→∃Y q(X,Y))','∀X(p(X)→∃Y q(X,Y))')],build:v=>v.f},
  {c:'unif',n:'Unification',inp:[I('f','Expressions, separated by commas','p(X,f(a)), p(b,Y)','p(X,f(a)), p(b,Y)')],build:v=>v.f},
  {c:'pres',n:'Resolution',inp:[I('p','Premises (one per line)','∀X(p(X)→q(X))\np(a)','∀X(p(X)→q(X))\np(a)',1),I('q','Conclusion','q(a)','q(a)')],build:v=>['Custom',v.p.split(/[\n;]/).map(x=>x.trim()).filter(Boolean),v.q]}],
 comp:[
  {c:'c_sem',n:'Run a program',inp:[I('p','While program','begin\n  X2:=0;\n  while X2≠X1 do\n  begin\n    X2:=succ(X2);\n    X3:=succ(X3)\n  end;\n  X1:=X3\nend','begin\n  X2:=0;\n  while X2≠X1 do\n  begin\n    X2:=succ(X2);\n    X3:=succ(X3)\n  end;\n  X1:=X3\nend',1),I('a','Inputs (numbers)','3','3')],build:v=>({p:v.p,a:nums(v.a)})},
  {c:'c_trace',n:'State vector',inp:[I('p','While program','begin\n  X1:=succ(X2);\n  X2:=pred(X1)\nend','begin\n  X1:=succ(X2);\n  X2:=pred(X1)\nend',1),I('a','Initial values X1, X2, …','0, 3','0, 3')],build:v=>({p:v.p,a:nums(v.a)})},
  {c:'c_et',n:'Macro-test E_T',inp:[I('f','Test','X>Y ∧ Z=0','X>Y ∧ Z=0')],build:v=>v.f},
  {c:'c_tmq',n:'Turing machine',inp:[I('tm','Transitions (+ optional final: line)','(q0, 1, 0, R, q1)\n(q1, 1, 1, R, q1)\n(q1, 0, 0, R, q2)\n(q2, 1, 0, N/H, q2)\nfinal: q2','(q0, 1, 0, R, q1)\n(q1, 1, 1, R, q1)\n(q1, 0, 0, R, q2)\n(q2, 1, 0, N/H, q2)\nfinal: q2',1),I('a','Inputs','2, 1','2, 1')],build:v=>{const a=nums(v.a),g=CPQ.tmGo(v.tm,a,null);return{tm:v.tm,fin:[...g.fin],a,n:a.length}}},
  {c:'c_smn',n:'s-m-n',inp:[I('p','Program P','begin\n  X1:=X1*X2\nend','begin\n  X1:=X1*X2\nend',1),I('m','m (how many inputs to fix)','1','1'),I('C','Constants C','3','3'),I('x','Free inputs x','5','5')],build:v=>({p:v.p,m:+v.m,C:nums(v.C),x:nums(v.x)})}]};
const nums=s=>{const a=String(s).split(/[\s,;]+/).filter(Boolean).map(Number);if(a.some(x=>!Number.isInteger(x)||x<0))throw Error('Use natural numbers separated by commas');return a};
const SS={};
window.SOLVER=()=>{const d=S.d,T=SOLV[d],cur=SS[d]||T[0].c,t=T.find(x=>x.c==cur);SS[d]=cur;
 $('#M').innerHTML=`<div class=card><h3>🧠 Solver</h3><p class=mu>Type your own problem and get the full step-by-step solution.</p><div class=sch>${T.map(x=>`<button class="${x.c==cur?'on':''}" onclick="solPick('${x.c}')">${x.n}</button>`).join('')}</div></div>
 <div class=card>${t.inp.map(i=>`<div class=mu style="margin-top:6px">${i.l}</div>${i.ta?`<textarea id=si_${i.id} rows=6 placeholder="${esc(i.ph)}" style="width:100%;font-family:monospace"></textarea>`:`<input id=si_${i.id} placeholder="${esc(i.ph)}" style="width:100%">`}`).join('')}<div class=row style="margin-top:8px"><button class=on onclick="solRun()">Solve</button><button onclick="solEx()">Example</button></div></div><div id=sout></div>`};
window.solPick=c=>{SS[S.d]=c;SOLVER()};
const cur=()=>SOLV[S.d].find(x=>x.c==SS[S.d]);
window.solEx=()=>{cur().inp.forEach(i=>$('#si_'+i.id).value=i.ex);solRun()};
window.solRun=()=>{const t=cur(),v={};t.inp.forEach(i=>v[i.id]=$('#si_'+i.id).value.trim());
 let e;try{if(t.inp.some(i=>!v[i.id]&&i.id!='q'||false))throw Error('Fill in all the fields');e={c:t.c,d:t.build(v)};
  if(t.c=='entail'||t.c=='pres'){if(!e.d[2])throw Error('Write a conclusion')}}catch(x){$('#sout').innerHTML=`<div class=card><p class=no>${esc(x.message)}</p></div>`;return}
 const h=solveHTML(e),bad=h.startsWith('<p class=no>Could not');
 $('#sout').innerHTML=bad?`<div class=card>${h}<p class=mu>Check the syntax of your input (every ∧ ∨ → ↔ needs a formula on both sides, brackets must match). Use the Example button to see the expected format.</p></div>`:`<div class="card sol"><span class=solb>✓ Solution</span>${recap(t.c)}${h}</div>`;
 $('#sout').scrollIntoView({behavior:'smooth',block:'nearest'})};
/* register the modes (before Mistakes) */
for(const M of [MODES,CMODES]){const m=M.mist;delete M.mist;M.solve='Solver 🧠';M.mist=m}
const oGo=go;go=function(){if(S.m=='solve'){nav();SOLVER();return}oGo()};
nav();go();
})();

