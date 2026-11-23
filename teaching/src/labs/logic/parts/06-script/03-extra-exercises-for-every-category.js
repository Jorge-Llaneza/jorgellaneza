/* ===== extra exercises for every category ===== */
(function(){
const L=a=>a.join('\n');
const add=(k,items)=>{(B[k]=B[k]||[]).push(...items)};
/* ---- propositional ---- */
add('wff',['((p→q)↔r)','¬(p∨q','p∧∨q','¬¬p','(p∧q)∨(¬r→s)','p q','¬→p','p↔(q↔r)','(p∨)','¬(p∧(q∨¬r))','(p→(q→(r→s)))','→p∧q','((p)∧q)','(p∧q)¬r']);
add('formal',[
 ['If it rains and I have no umbrella, I get wet. (p: rains, q: umbrella, r: wet)','p∧¬q→r'],
 ['I go out only if I have finished my homework. (p: go out, q: finished)','p→q'],
 ['Either the exam is easy or I fail, but not both. (p: easy, q: fail)','¬(p↔q)'],
 ['It is not true that I am both tired and happy. (p: tired, q: happy)','¬(p∧q)'],
 ['I will pass unless I skip the final. (p: pass, q: skip)','¬q→p'],
 ['Neither the bus nor the train is on time. (p: bus, q: train)','¬p∧¬q'],
 ['The program is correct if and only if it passes all the tests. (p: correct, q: passes)','p↔q'],
 ['If it is sunny I go to the beach, otherwise I study. (p: sunny, q: beach, r: study)','(p→q)∧(¬p→r)'],
 ['Being rich is necessary for being happy. (p: rich, q: happy)','q→p'],
 ['Being punctual is sufficient to get the job. (p: punctual, q: job)','p→q']]);
add('cnf',['(p∨q)→(r∧s)','¬(p→q)∨r','(p↔q)→r','¬(p∧q)→(r∨s)','p→(q→(r→s))','(p∧q)∨(r∧s)','¬((p∨q)∧(r→s))','(p→q)↔(¬q→¬p)','¬(p↔(q∧r))','(p∨q∨r)→(p∧q∧r)']);
add('cnfi',['(p∨q)→(r∧s)','¬(p→q)∨r','(p↔q)→r','¬(p∧q)→(r∨s)','(p∧q)∨(r∧s)','¬((p∨q)∧(r→s))']);
add('class',['(p→q)→(¬q→¬p)','p∧(q→¬p)∧q','(p∨q)→(p∧q)','¬(p∧q)↔(¬p∨¬q)','(p→q)∧(q→r)∧¬(p→r)','((p→q)→p)→p','(p∨q)∧(¬p∨q)∧(p∨¬q)∧(¬p∨¬q)','(p↔q)→(p→q)','(p∧¬q)→(q∨r)','¬(p→q)∧¬(q→p)']);
add('entail',[
 ['Modus tollens',['p→q','¬q'],'¬p'],
 ['Hypothetical syllogism',['p→q','q→r'],'p→r'],
 ['Affirming the consequent',['p→q','q'],'p'],
 ['Denying the antecedent',['p→q','¬p'],'¬q'],
 ['Disjunctive syllogism',['p∨q','¬p'],'q'],
 ['Constructive dilemma',['p∨q','p→r','q→s'],'r∨s'],
 ['Contraposition',['p→q'],'¬q→¬p'],
 ['Exam (a)',['s→r','¬r'],'¬s'],
 ['Party (b)',['(p∨q)→r','p∧s'],'r'],
 ['Chain with ↔',['p↔q','q↔r'],'p↔r'],
 ['Weak premise',['p∨q','r→p'],'r∧q'],
 ['De Morgan',['¬(p∧q)'],'¬p∨¬q']]);
/* ---- predicate ---- */
add('pev',[
 ['∀x∃y p(x,y)','dom=A,B,C; p={(A,B),(B,C),(C,A)}'],
 ['∃x∀y p(x,y)','dom=A,B; p={(A,A),(A,B)}'],
 ['∀x(q(x)→q(f(x)))','dom=A,B,C; q={A,B}; f(A)=B; f(B)=C; f(C)=C'],
 ['∀x∀y(p(x,y)→p(y,x))','dom=A,B; p={(A,B),(B,A),(A,A)}'],
 ['∃x(q(x)∧¬p(x,x))','dom=A,B; p={(A,A)}; q={A,B}'],
 ['∀x p(x,f(f(x)))','dom=A,B; p={(A,A),(B,B)}; f(A)=B; f(B)=A'],
 ['∀x(p(x,x)→q(x))','dom=A,B,C; p={(A,A),(C,C)}; q={A}'],
 ['∃x∃y(p(x,y)∧p(y,x)∧¬E(x,y))'.replace('¬E(x,y)','q(x)'),'dom=A,B; p={(A,B),(B,A)}; q={A}'],
 ['¬∃x∀y p(y,x)','dom=A,B; p={(A,B),(B,B)}'],
 ['∀x(q(x)→∃y p(x,y))','dom=A,B,C; q={A,C}; p={(A,B),(C,C)}']]);
add('pform',[
 ['Every student reads some book. [S,B,R]','∀x(S(x)→∃y(B(y)∧R(x,y)))'],
 ['Some student reads every book. [S,B,R]','∃x(S(x)∧∀y(B(y)→R(x,y)))'],
 ['Nobody likes everybody. [L]','¬∃x∀y L(x,y)'],
 ['There is a number greater than all others. [G]','∃x∀y G(x,y)'],
 ['All dogs are animals but not all animals are dogs. [D,A]','∀x(D(x)→A(x))∧¬∀x(A(x)→D(x))'],
 ['Whoever is a friend of a friend of Ann is a friend of Ann. [F,a]','∀x∀y(F(x,y)∧F(y,a)→F(x,a))'],
 ['Only teachers grade exams. [T,G]','∀x(G(x)→T(x))'],
 ['Someone loves nobody. [L]','∃x∀y¬L(x,y)'],
 ['Pedro knows a professor who teaches Logic. [P,T,k,p,l]','∃x(P(x)∧K(p,x)∧T(x,l))'.replace('K(p,x)','k(p,x)')],
 ['If somebody cheats, everybody is punished. [C,P]','∃x C(x)→∀y P(y)']]);
add('snf',['∀X(p(X)→∃Y q(X,Y))','∃X∀Y(p(X)∨¬q(Y))','∀X∃Y∀Z(p(X,Y)→q(Z))','¬∀X∃Y p(X,Y)','∃X(p(X)∧∀Y(q(Y)→r(X,Y)))','∀X(∃Y p(X,Y)→∃Z q(X,Z))','¬∃X∀Y(p(X,Y)↔q(Y))','∀X∀Y∃Z(p(X,Y)→(q(Z)∧r(Z,X)))']);
add('nfi',['∀X(p(X)→∃Y q(X,Y))','∃X∀Y(p(X)∨¬q(Y))','¬∀X∃Y p(X,Y)','∃X(p(X)∧∀Y(q(Y)→r(X,Y)))']);
add('unif',['p(X,Y), p(a,b)','p(f(X),Y), p(Z,g(a))','p(X,f(X)), p(a,Y)','p(X,X), p(a,b)','p(f(X),X), p(Y,g(Y))','q(X,g(Y),Z), q(f(a),g(b),h(X))','p(g(X),Y,f(Y)), p(Z,f(a),W)','p(X,f(Y),Z), p(g(Z),f(a),Y)','p(f(X,Y),g(Z)), p(f(a,b),g(c))','p(X,Y,Z), p(Y,Z,a)','p(a,X), p(X,b)','p(f(X),f(Y)), p(f(a),f(X))']);
add('pres',[
 ['Barber-lite',['∀X(student(X)→smart(X))','student(ann)'],'smart(ann)'],
 ['Existential',['∀X(p(X)→q(X))','∃X p(X)'],'∃X q(X)'],
 ['Two steps',['∀X(a(X)→b(X))','∀X(b(X)→c(X))','a(k)'],'c(k)'],
 ['Wrong direction',['∀X(p(X)→q(X))','q(a)'],'p(a)'],
 ['Universal instantiation',['∀X p(X)'],'p(a)'],
 ['Relation',['∀X∀Y(r(X,Y)→r(Y,X))','r(a,b)'],'r(b,a)'],
 ['Not sound: ∃ to ∀',['∃X p(X)'],'∀X p(X)'],
 ['Everyone has a parent',['∀X∃Y parent(Y,X)','∀X∀Y(parent(Y,X)→older(Y,X))'],'∀X∃Y older(Y,X)']]);
/* ---- computability ---- */
add('c_sem',[
 {p:L(['begin','  X2:=0;','  while X2≠X1 do','  begin','    X3:=X3+2;','    X2:=succ(X2)','  end;','  X1:=X3','end']),a:[4]},
 {p:L(['begin','  X3:=0;','  while X3≠X2 do','  begin','    X1:=succ(X1);','    X3:=succ(X3)','  end','end']),a:[3,4]},
 {p:L(['begin','  X2:=X1;','  X1:=0;','  while X2≠0 do','  begin','    X1:=succ(X1);','    X2:=pred(X2)','  end','end']),a:[5]},
 {p:L(['begin','  while X1≠0 do','  begin','    X1:=pred(X1);','    X2:=succ(X2)','  end;','  X1:=X2','end']),a:[3,2]},
 {p:L(['begin','  X3:=0;','  while X2≠X3 do','  begin','    X1:=pred(X1);','    X3:=succ(X3)','  end','end']),a:[7,3]},
 {p:L(['begin','  X2:=succ(X1);','  X3:=0;','  while X3≠X2 do','  begin','    X1:=X1+X3;','    X3:=succ(X3)','  end','end']),a:[3]},
 {p:L(['begin','  X2:=0;','  X3:=succ(0);','  while X1≠0 do','  begin','    X2:=X3;','    X3:=X3+X3;','    X1:=pred(X1)','  end;','  X1:=X2','end']),a:[4]}]);
add('c_trace',[
 {p:L(['begin','  X2:=succ(X1);','  X3:=X2','end']),a:[3,0,0]},
 {p:L(['begin','  X3:=0;','  while X3≠X1 do','  begin','    X2:=succ(X2);','    X3:=succ(X3)','  end','end']),a:[3,1,0]},
 {p:L(['begin','  X1:=pred(X1);','  X1:=pred(X1);','  X2:=succ(X1)','end']),a:[1,5]},
 {p:L(['begin','  while X1≠0 do','  begin','    X2:=succ(X2);','    X1:=pred(X1)','  end','end']),a:[4,0]},
 {p:L(['begin','  X3:=succ(X3);','  while X3≠X2 do','    X3:=succ(X3);','  X1:=X3','end']),a:[0,3,0]}]);
add('c_et',['X<Y ∧ Y<Z','X≥Y','¬(X≠Y)','(X≤Y) ∨ (Z=0)','X>Y ∧ ¬(Y=Z)','X≠Y ∨ Y≠Z','¬(X<Y) ∧ ¬(Y<X)','X≤Y ∧ X≥Z']);
add('c_wpd',[
 {t:'Z := X + 2',in:['X'],f:x=>x+2,allow:[],ins:[[0],[3],[7]],ref:L(['begin','  Z:=succ(X);','  Z:=succ(Z)','end']),note:'Only basic statements (succ, pred, 0, while X≠Y).'},
 {t:'Z := 2·X',in:['X'],f:x=>2*x,allow:['asg','add'],ins:[[0],[1],[4],[7]],ref:L(['begin','  Z:=X+X','end'])},
 {t:'Z := X² (square)',in:['X'],f:x=>x*x,allow:['asg','add'],ins:[[0],[1],[3],[5]],ref:L(['begin','  Z:=0;','  U:=0;','  while U≠X do','  begin','    Z:=Z+X;','    U:=succ(U)','  end','end'])},
 {t:'Z := 1 if X > 0, otherwise Z := 0',in:['X'],f:x=>x>0?1:0,allow:null,ins:[[0],[1],[4]],ref:L(['begin','  if X=0 then Z:=0 else Z:=1','end'])},
 {t:'Z := min(X, Y)',in:['X','Y'],f:(x,y)=>Math.min(x,y),allow:null,ins:[[0,0],[3,4],[5,2],[6,6],[0,3]],ref:L(['begin','  if X<Y then Z:=X else Z:=Y','end'])},
 {t:'Z := |X − Y| (absolute difference)',in:['X','Y'],f:(x,y)=>Math.abs(x-y),allow:null,ins:[[0,0],[3,4],[5,2],[6,6],[0,3]],ref:L(['begin','  if X<Y then Z:=Y∸X else Z:=X∸Y','end'])},
 {t:'Z := 0 + 1 + … + X (sum)',in:['X'],f:x=>x*(x+1)/2,allow:null,ins:[[0],[1],[3],[5]],ref:L(['begin','  Z:=0;','  U:=0;','  while U≠X do','  begin','    U:=succ(U);','    Z:=Z+U','  end','end'])},
 {t:'Z := X^Y (power)',in:['X','Y'],f:(x,y)=>x**y,allow:null,ins:[[2,0],[2,3],[3,2],[0,2],[1,5]],ref:L(['begin','  Z:=1;','  U:=0;','  while U≠Y do','  begin','    Z:=Z*X;','    U:=succ(U)','  end','end'])}]);
add('c_tmq',[
 {tm:TM_ADD0(),fin:['q2'],a:[0,0],n:2},{tm:TM_ADD0(),fin:['q2'],a:[1,4],n:2},{tm:TM_DBL0(),fin:['qf'],a:[1],n:1},{tm:TM_DBL0(),fin:['qf'],a:[2],n:1},
 {tm:'(q0, 1, 1, L, q1)\n(q1, 0, 1, H, qf)',fin:['qf'],a:[3],n:1},{tm:TM_FST0(),fin:['q2'],a:[0,4],n:2},{tm:TM_LOOP0(),fin:['q1'],a:[0],n:1},{tm:TM_ERASE0(),fin:['q0'],a:[0],n:1}]);
function TM_ADD0(){return CPQ.TM_ADD}function TM_DBL0(){return CPQ.TM_DBL}function TM_FST0(){return CPQ.TM_FST}function TM_LOOP0(){return CPQ.TM_LOOP}function TM_ERASE0(){return CPQ.TM_ERASE}
add('c_tmd',[
 {t:'f(x) = x + 2',f:x=>x+2,ins:[[0],[1],[3]],ref:L(['(q0, 1, 1, L, q1)','(q1, 0, 1, H, qf)','final: qf']),hint:'There are x+1 ones. Step left onto the blank and write a 1 there.'},
 {t:'f(x, y) = y',f:(x,y)=>y,ins:[[0,0],[2,1],[3,4],[0,5],[4,0]],ref:L(['(q0, 1, 0, R, q0)','(q0, 0, 0, R, q1)','(q1, 1, 0, H, q2)','final: q2']),hint:'Erase the whole first block, cross the separating 0, then delete one 1 of the second block.'},
 {t:'f(x) = 3',f:x=>3,ins:[[0],[1],[4]],ref:L(['(q0, 1, 0, R, q0)','(q0, 0, 1, R, q1)','(q1, 0, 1, R, q2)','(q2, 0, 1, H, qf)','final: qf']),hint:'Erase every 1, then write three new 1s on the blank cells.'},
 {t:'f(x) = x ∸ 1',f:x=>Math.max(0,x-1),ins:[[0],[1],[2],[5]],ref:L(['(q0, 1, 0, R, q1)','(q1, 1, 0, H, q2)','final: q1, q2']),hint:'The input has x+1 ones: delete the first two (if there is a second one).'}]);
add('c_smn',[
 {p:L(['begin','  X3:=0;','  while X2≠X3 do','  begin','    X1:=succ(X1);','    X3:=succ(X3)','  end','end']),m:1,C:[4],x:[5]},
 {p:L(['begin','  X1:=X1*X2','end']),m:1,C:[6],x:[7]},
 {p:L(['begin','  X1:=X1∸X2','end']),m:1,C:[9],x:[4]},
 {p:L(['begin','  X1:=X1+X2+X3','end']),m:2,C:[1,2],x:[3]},
 {p:L(['begin','  X1:=X1*X1;','  X1:=X1+X2','end']),m:1,C:[3],x:[5]}]);
add('c_con',[
 {q:'What does the <b>universal function</b> Φ(e, x) compute?',o:['φ_e(x): the result of running program number e on input x','The code of program x','The identity on ℕ','The halting function'],a:0,e:'Φ(e,x)=φ_e(x): one fixed program U that simulates any program given its code e.'},
 {q:'How is a while program <b>coded</b> as a natural number?',o:['Its ASCII text is read as a base-2 number','By counting its statements','By its number of variables','Random numbers per symbol'],a:0,e:'cod(P): every character is written with 8 bits and the whole bit string is read as a number.'},
 {q:'What does the <b>s-m-n theorem</b> say?',o:['Fixing m inputs of a program gives another program, computed effectively from the code','Every program halts','Every function is computable','Programs cannot be coded'],a:0,e:'There is a computable total function s such that φ_s(e,c)(x)=φ_e(c,x): parametrization.'},
 {q:'Which statement about the <b>Church–Turing thesis</b> is correct?',o:['Every intuitively computable function is Turing computable (not a theorem, a thesis)','It has been formally proved','It says all functions are computable','It only applies to while programs'],a:0,e:'It links the informal notion of algorithm with the formal models; it cannot be proved, only supported.'},
 {q:'What is the result of a Turing machine on input n?',o:['The number of 1s on the tape when it halts in a final state','The final state number','The position of the head','The number of steps'],a:0,e:'Input n is n+1 ones; if the machine halts in a final state the output is the count of 1s, otherwise undefined.'},
 {q:'How many ones represent the input <b>0</b> on a Turing machine tape?',o:['One','Zero','Two','None, the tape is empty'],a:0,e:'Unary with a shift: n is written as n+1 ones so that 0 is not an empty tape.'},
 {q:'Which of these is a <b>macro</b> and not a basic statement?',o:['X:=Y+Z','X:=succ(X)','X:=pred(X)','while X≠Y do S'],a:0,e:'Basic: X:=0, succ, pred, while X≠Y. Addition is a macro that expands into a loop.'},
 {q:'Are <b>while programs</b> and <b>Turing machines</b> equally powerful?',o:['Yes: they compute exactly the same functions','No, Turing machines are stronger','No, while programs are stronger','Only for total functions'],a:0,e:'Both models are equivalent: each can simulate the other.'},
 {q:'What is φ<sub>P</sub>(x) when the program never leaves a loop (its test never becomes false)?',o:['Undefined (⊥), the program does not halt','0','x','1'],a:0,e:'The semantic function is partial: a non-halting computation has no value, written ⊥.'},
 {q:'In a <b>macro-test</b>, which expression corresponds to X&lt;Y?',o:['Y ∸ X (positive iff X&lt;Y)','X ∸ Y','X + Y','X * Y'],a:0,e:'Y∸X is positive exactly when X&lt;Y; every other comparison is built from it.'},
 {q:'How does a macro-test encode <b>A ∧ B</b>?',o:['E_A * E_B','E_A + E_B','E_A ∸ E_B','1 ∸ E_A'],a:0,e:'A product is positive only if both factors are; a sum gives ∨; 1∸E gives ¬.'},
 {q:'What does a state vector â contain?',o:['The current value of every variable','Only X1','The program text','The number of steps executed'],a:0,e:'A configuration of a while program is the vector of values of its variables.'}]);
})();

/* ===== second, larger batch of exercises ===== */
(function(){
const L=a=>a.join('\n');
const add=(k,items)=>{(B[k]=B[k]||[]).push(...items)};
let sd=12345;const R=n=>{sd=(sd*1103515245+12345)&0x7fffffff;return(sd>>8)%n};
const pk=a=>a[R(a.length)];
/* propositional formula generator (fully bracketed) */
function pf(d,V,ops){if(d==0||(d<3&&R(4)==0))return pk(V);const o=pk(ops);if(o=='¬'){const x=pf(d-1,V,ops);return '¬'+(x.length>2&&x[0]!='¬'?x:x)}return '('+pf(d-1,V,ops)+o+pf(d-1,V,ops)+')'}
const uniq=(a,ex)=>[...new Set(a)].filter(x=>!ex.includes(x));
const gen=(n,d,V,ops)=>{const o=[];let g=0;while(o.length<n&&g++<500){const f=pf(d,V,ops);if(f.length>=7&&f.length<=26&&!o.includes(f))o.push(f)}return o};
add('cnf',gen(24,3,['p','q','r','s'],['∧','∨','→','↔','¬','→','→']));
add('cnfi',gen(14,3,['p','q','r'],['∧','∨','→','↔','¬']));
add('class',gen(24,3,['p','q','r'],['∧','∨','→','↔','¬']));
/* wff: well-formed formulas and corrupted copies */
const wf=gen(20,3,['p','q','r'],['∧','∨','→','↔','¬']);
const corrupt=f=>{const t=R(5),i=1+R(f.length-2);switch(t){case 0:return f.slice(0,i)+f.slice(i+1);case 1:return f.slice(0,i)+'∧'+f.slice(i);case 2:return f.replace(/[∧∨→↔]/,'')+'';case 3:return f+')';default:return f.slice(0,i)+'p'+f.slice(i)}};
add('wff',wf.flatMap(f=>[f,corrupt(f)]));
add('formal',[
 ['I do not go if it rains or snows. (p: go, q: rains, r: snows)','q∨r→¬p'],
 ['A number is even only if it is divisible by two. (p: even, q: div)','p→q'],
 ['You may enter only if you have a ticket and are over 18. (p: enter, q: ticket, r: over 18)','p→q∧r'],
 ['Either I study or I fail, and I do not fail. (p: study, q: fail)','(p∨q)∧¬q'],
 ['The light is on if and only if the switch is up and the power is on. (p: light, q: switch, r: power)','p↔q∧r'],
 ['If the alarm rings, then, if nobody is home, the police arrive. (p: alarm, q: somebody home, r: police)','p→(¬q→r)'],
 ['It is not the case that if I win I will be happy. (p: win, q: happy)','¬(p→q)'],
 ['I like tea or coffee but not both. (p: tea, q: coffee)','(p∨q)∧¬(p∧q)'],
 ['Whenever it is Monday I am tired, and I am not tired. (p: Monday, q: tired)','(p→q)∧¬q'],
 ['If I eat a lot I get fat, and if I do not eat I get hungry. (p: eat, q: fat, r: hungry)','(p→q)∧(¬p→r)'],
 ['The system is safe provided that the firewall is active. (p: safe, q: firewall)','q→p'],
 ['Passing the test is equivalent to studying hard. (p: pass, q: study)','p↔q'],
 ['At least one of the three lamps is on. (p, q, r)','p∨q∨r'],
 ['At most one of p and q is true. (p, q)','¬(p∧q)'],
 ['If p holds, q holds; if q holds, r holds; so p implies r is assumed. (p, q, r)','(p→q)∧(q→r)→(p→r)']]);
add('entail',[
 ['Absorption',['p→q'],'p→(p∧q)'],
 ['Exportation',['p∧q→r'],'p→(q→r)'],
 ['Importation',['p→(q→r)'],'p∧q→r'],
 ['Simplification',['p∧q'],'p'],
 ['Addition',['p'],'p∨q'],
 ['Resolution rule',['p∨q','¬p∨r'],'q∨r'],
 ['Biconditional',['p↔q','p'],'q'],
 ['Biconditional (b)',['p↔q','¬p'],'¬q'],
 ['Case split',['p→r','q→r','p∨q'],'r'],
 ['Transitivity (bad)',['p→q','p→r'],'q→r'],
 ['Reductio',['p→q','p→¬q'],'¬p'],
 ['Detective',['c∨b','c→g','¬g'],'b'],
 ['Detective (b)',['c∨b','b→g','¬g'],'c'],
 ['Library',['r→(a∨l)','¬a','r'],'l'],
 ['Wrong order',['p→q','r→q'],'p∨r→q'],
 ['Wrong order (b)',['p→q','r→q'],'p∧r→q'],
 ['Distribution',['p∧(q∨r)'],'(p∧q)∨(p∧r)'],
 ['Distribution (b)',['p∨(q∧r)'],'(p∨q)∧(p∨r)'],
 ['Not a tautology',['p∨q'],'p∧q'],
 ['Chain of four',['a→b','b→c','c→d','a'],'d'],
 ['Contradictory premises',['p','¬p'],'q'],
 ['Contingent conclusion',['p→q'],'q']]);
/* predicate */
const PF=['∀x p(x,f(x))','∃x p(f(x),x)','∀x(q(x)→q(f(x)))','∀x∃y p(x,y)','∃x∀y p(x,y)','∀x∀y(p(x,y)→p(y,x))','∃x(q(x)∧p(x,x))','∀x(q(x)→∃y p(x,y))','∀x(p(x,x)→q(x))','∃x∃y(p(x,y)∧q(y))','¬∃x(q(x)∧p(f(x),x))','∀x(q(x)∨q(f(x)))','∃x∀y(p(x,y)→q(y))','∀x∀y∀z(p(x,y)∧p(y,z)→p(x,z))'];
const PM=['dom=A,B; p={(A,B),(B,A)}; q={A}; f(A)=B; f(B)=A','dom=A,B,C; p={(A,B),(B,C),(A,C)}; q={B,C}; f(A)=B; f(B)=C; f(C)=C','dom=A,B,C; p={(A,A),(B,B),(C,C)}; q={A,C}; f(A)=A; f(B)=C; f(C)=B','dom=A,B; p={(A,A),(A,B),(B,A),(B,B)}; q={B}; f(A)=A; f(B)=A','dom=A,B,C; p={(A,B),(B,A)}; q={C}; f(A)=C; f(B)=C; f(C)=A'];
add('pev',Array.from({length:22},(_,i)=>[PF[(i*5+R(3))%PF.length],PM[(i*3+R(2))%PM.length]]));
add('pform',[
 ['Every mother loves her children. [M,L,c]','∀x∀y(M(x)∧c(y,x)→L(x,y))'],
 ['No student fails if they study. [S,F,T]','∀x(S(x)∧T(x)→¬F(x))'],
 ['Some philosopher is wiser than every politician. [Ph,Po,W]','∃x(Ph(x)∧∀y(Po(y)→W(x,y)))'],
 ['Everybody has a father. [f: father of]','∀x∃y E(y,f(x))'.replace('E(y,f(x))','F(y,x)')],
 ['There is exactly one king. [K,E]','∃x(K(x)∧∀y(K(y)→E(y,x)))'],
 ['Every even number is a multiple of two. [P,M]','∀x(P(x)→M(x))'],
 ['The sum of two even numbers is even. [E, s: sum]','∀x∀y(E(x)∧E(y)→E(s(x,y)))'],
 ['Nobody who is honest is a liar. [H,L]','∀x(H(x)→¬L(x))'],
 ['Some people trust everybody who trusts them. [P,T]','∃x(P(x)∧∀y(T(y,x)→T(x,y)))'],
 ['A friend of all is a friend of none of the enemies. [F,E]','∀x(∀y F(x,y)→∀z(E(z)→¬F(x,z)))'],
 ['Whoever helps someone is helped by someone. [H]','∀x(∃y H(x,y)→∃z H(z,x))'],
 ['Not every bird flies. [B,F]','¬∀x(B(x)→F(x))'],
 ['Some birds do not fly. [B,F]','∃x(B(x)∧¬F(x))'],
 ['Every teacher is liked by some student. [T,S,L]','∀x(T(x)→∃y(S(y)∧L(y,x)))'],
 ['Nobody is both rich and poor. [R,P]','¬∃x(R(x)∧P(x))'],
 ['Zero is smaller than the successor of any number. [Sm, z, s]','∀x Sm(z,s(x))']]);
/* snf / nfi: prefix x kernel */
const PRE=['∀X∃Y','∃X∀Y','∀X∀Y∃Z','∃X∃Y','∀X∃Y∀Z','¬∀X∃Y','¬∃X∀Y','∃X¬∀Y'];
const KER=['(p(X,Y)→q(Y))','(¬p(X)∨q(X,Y))','(p(X)↔q(Y))','(p(X,Y)∧q(Y))→r(X)','(p(X)→(q(Y)∧r(Z)))'];
const sn=[];for(const a of PRE)for(const k of KER){const hasZ=/Z/.test(a)||/r\(Z\)/.test(k);const pre=hasZ&&!/Z/.test(a)?a.replace(/^(¬?)/,'$1∀Z'):a;if(!/Z/.test(k)||/Z/.test(pre))sn.push(pre+'('+k+')')}
const picks=[];while(picks.length<24){const x=pk(sn);if(!picks.includes(x))picks.push(x)}
add('snf',picks);add('nfi',picks.slice(0,12));
/* unification generator */
const TV=['X','Y','Z','U'],TC=['a','b'];
function tm(d){const r=R(10);if(d==0||r<3)return pk(TV);if(r<5)return pk(TC);return pk(['f','g'])+'('+tm(d-1)+(R(3)==0?','+tm(d-1):'')+')'}
const un=[];while(un.length<22){const n=2+R(2),a=pk(['p','q']),ar=1+R(3);const row=[];for(let i=0;i<n;i++){const ts=[];for(let j=0;j<ar;j++)ts.push(tm(2));row.push(a+'('+ts.join(',')+')')}const s=row.join(', ');if(s.length<48&&!un.includes(s))un.push(s)}
add('unif',un);
add('pres',[
 ['Tweety',['∀X(bird(X)→flies(X))','bird(tweety)'],'flies(tweety)'],
 ['Transitive',['∀X∀Y∀Z(le(X,Y)∧le(Y,Z)→le(X,Z))','le(a,b)','le(b,c)'],'le(a,c)'],
 ['Someone',['∀X(p(X)→q(X))','∃X p(X)'],'∃X q(X)'],
 ['Not all',['∃X ¬p(X)'],'¬∀X p(X)'],
 ['Swap quantifiers (bad)',['∀X∃Y r(X,Y)'],'∃Y∀X r(X,Y)'],
 ['Swap quantifiers (ok)',['∃Y∀X r(X,Y)'],'∀X∃Y r(X,Y)'],
 ['Disjunction',['∀X(p(X)→q(X))','∀X(r(X)→q(X))','p(a)∨r(a)'],'q(a)'],
 ['Function',['∀X p(X,f(X))'],'∃Y p(a,Y)'],
 ['Mortal',['∀X(man(X)→mortal(X))','man(socrates)'],'mortal(socrates)'],
 ['Everyone loves someone',['∀X∃Y loves(X,Y)','∀X∀Y(loves(X,Y)→happy(X))'],'∀X happy(X)'],
 ['Not sound (a)',['∀X(p(X)→q(X))'],'∀X(q(X)→p(X))'],
 ['Barbers',['∀X(shaves(b,X)↔¬shaves(X,X))'],'⊥'.replace('⊥','∃X p(X)')]]);
/* ---- computability ---- */
const SP=[L(['begin','  X2:=0;','  while X2≠X1 do','  begin','    X3:=X3+2;','    X2:=succ(X2)','  end;','  X1:=X3','end']),L(['begin','  X3:=0;','  while X3≠X2 do','  begin','    X1:=succ(X1);','    X3:=succ(X3)','  end','end']),L(['begin','  X2:=X1;','  X1:=0;','  while X2≠0 do','  begin','    X1:=succ(X1);','    X2:=pred(X2)','  end','end']),L(['begin','  while X1≠0 do','  begin','    X1:=pred(X1);','    X2:=succ(X2)','  end;','  X1:=X2','end'])];
const SI=[[6],[2],[0]],S2=[[2,5],[0,3],[4,4]];
add('c_sem',[...SP.slice(0,1).flatMap(p=>[[1],[7],[0]].map(a=>({p,a}))),...[SP[1],SP[2],SP[3]].flatMap((p,i)=>[[2,3],[0,1],[5,5]].slice(0,2).map(a=>({p,a:i==1?[a[0]]:a})))
 ,{p:L(['begin','  X2:=0;','  X3:=0;','  while X3≠X1 do','  begin','    X2:=X2+3;','    X3:=succ(X3)','  end;','  X1:=X2','end']),a:[4]},
 {p:L(['begin','  X3:=X1;','  X1:=X2;','  X2:=X3','end']),a:[3,8]},
 {p:L(['begin','  while X1≠X2 do','    X1:=succ(X1)','end']),a:[2,6]},
 {p:L(['begin','  X3:=0;','  while X3≠X2 do','  begin','    X1:=pred(X1);','    X3:=succ(X3)','  end','end']),a:[2,5]},
 {p:L(['begin','  while X1≠X2 do','    X1:=succ(X1)','end']),a:[9,3]},
 {p:L(['begin','  X1:=X1*X2','end']),a:[4,5]},
 {p:L(['begin','  if X1<X2 then X1:=X2 else X2:=X1','end']),a:[3,9]},
 {p:L(['begin','  repeat','    X1:=pred(X1)','  until X1=0','end']),a:[5]}]);
add('c_trace',[
 {p:L(['begin','  X2:=succ(X1);','  X3:=X2','end']),a:[5,0,0]},
 {p:L(['begin','  X3:=0;','  while X3≠X1 do','  begin','    X2:=succ(X2);','    X3:=succ(X3)','  end','end']),a:[4,0,0]},
 {p:L(['begin','  while X1≠0 do','  begin','    X2:=succ(X2);','    X1:=pred(X1)','  end','end']),a:[2,3]},
 {p:L(['begin','  X1:=pred(X1);','  X2:=succ(X1);','  X3:=pred(X2)','end']),a:[3,0,0]},
 {p:L(['begin','  X3:=X1;','  X1:=X2;','  X2:=X3','end']),a:[1,6,0]},
 {p:L(['begin','  X3:=0;','  while X3≠X2 do','  begin','    X1:=X1+X1;','    X3:=succ(X3)','  end','end']),a:[1,3,0]},
 {p:L(['begin','  X2:=0;','  while X1≠X2 do','  begin','    X3:=X3+X2;','    X2:=succ(X2)','  end','end']),a:[4,0,0]},
 {p:L(['begin','  X3:=succ(X3);','  while X3≠X2 do','    X3:=succ(X3);','  X1:=X3','end']),a:[0,4,0]}]);
const REL=['X<Y','X>Y','X≤Y','X≥Y','X=Y','X≠Y','Y<Z','Y≥Z','Z=0','X>Z'],CON=['∧','∨'];
const et=[];while(et.length<26){const a=pk(REL),b=pk(REL),n=R(6);let t;switch(n){case 0:t='¬('+a+')';break;case 1:t=a+' '+pk(CON)+' '+b;break;case 2:t=a+' '+pk(CON)+' ¬('+b+')';break;case 3:t='('+a+') '+pk(CON)+' ('+b+')';break;case 4:t='¬('+a+' '+pk(CON)+' '+b+')';break;default:t=a}if(a!=b&&!et.includes(t))et.push(t)}
add('c_et',et);
add('c_wpd',[
 {t:'Z := X + 3',in:['X'],f:x=>x+3,allow:[],ins:[[0],[2],[6]],ref:L(['begin','  Z:=succ(X);','  Z:=succ(Z);','  Z:=succ(Z)','end']),note:'Only basic statements.'},
 {t:'Z := 0 (whatever the input)',in:['X'],f:x=>0,allow:[],ins:[[0],[2],[6]],ref:L(['begin','  Z:=0','end']),note:'Only basic statements.'},
 {t:'Z := X + Y + 1',in:['X','Y'],f:(x,y)=>x+y+1,allow:['asg','add'],ins:[[0,0],[3,4],[5,0],[0,6]],ref:L(['begin','  Z:=X+Y;','  Z:=succ(Z)','end'])},
 {t:'Z := 3·X',in:['X'],f:x=>3*x,allow:['asg','add'],ins:[[0],[1],[4]],ref:L(['begin','  Z:=X+X;','  Z:=Z+X','end'])},
 {t:'Z := X mod 2',in:['X'],f:x=>x%2,allow:null,ins:[[0],[1],[4],[7]],ref:L(['begin','  Z:=X mod 2','end'])},
 {t:'Z := 1 if X ≤ Y, otherwise Z := 0',in:['X','Y'],f:(x,y)=>x<=y?1:0,allow:null,ins:[[0,0],[3,4],[5,2],[6,6]],ref:L(['begin','  if X≤Y then Z:=1 else Z:=0','end'])},
 {t:'Z := max(X, Y, W)',in:['X','Y','W'],f:(x,y,w)=>Math.max(x,y,w),allow:null,ins:[[0,0,0],[3,4,1],[5,2,9],[6,6,2]],ref:L(['begin','  Z:=X;','  if Z<Y then Z:=Y;','  if Z<W then Z:=W','end'])},
 {t:'Z := X + Y + W',in:['X','Y','W'],f:(x,y,w)=>x+y+w,allow:['asg','add'],ins:[[0,0,0],[3,4,1],[5,2,9]],ref:L(['begin','  Z:=X+Y;','  Z:=Z+W','end'])},
 {t:'Z := X^3',in:['X'],f:x=>x**3,allow:null,ins:[[0],[1],[2],[3]],ref:L(['begin','  Z:=X*X*X','end'])},
 {t:'Z := X·(X+1)',in:['X'],f:x=>x*(x+1),allow:null,ins:[[0],[1],[3],[4]],ref:L(['begin','  Z:=X*succ(X)','end'])},
 {t:'Z := Y ∸ X',in:['X','Y'],f:(x,y)=>Math.max(0,y-x),allow:['asg'],ins:[[0,0],[2,5],[5,2],[4,4]],ref:L(['begin','  Z:=Y;','  U:=0;','  while U≠X do','  begin','    Z:=pred(Z);','    U:=succ(U)','  end','end'])},
 {t:'Z := X div 2',in:['X'],f:x=>Math.floor(x/2),allow:null,ins:[[0],[1],[4],[7]],ref:L(['begin','  Z:=X div 2','end'])}]);
const T=CPQ;
add('c_tmq',[
 {tm:T.TM_ADD,fin:['q2'],a:[2,2],n:2},{tm:T.TM_ADD,fin:['q2'],a:[0,3],n:2},{tm:T.TM_ADD,fin:['q2'],a:[5,1],n:2},
 {tm:T.TM_DBL,fin:['qf'],a:[4],n:1},{tm:T.TM_DBL,fin:['qf'],a:[5],n:1},
 {tm:T.TM_FST,fin:['q2'],a:[1,1],n:2},{tm:T.TM_FST,fin:['q2'],a:[2,0],n:2},
 {tm:T.TM_ERASE,fin:['q0'],a:[1],n:1},{tm:T.TM_ERASE,fin:['q0'],a:[3],n:1},
 {tm:T.TM_SUCC,fin:['qf'],a:[0],n:1},{tm:T.TM_SUCC,fin:['qf'],a:[1],n:1},
 {tm:T.TM_LOOP,fin:['q1'],a:[3],n:1},{tm:T.TM_NF,fin:['q1'],a:[0],n:1},
 {tm:'(q0, 1, 1, L, q1)\n(q1, 0, 1, H, qf)',fin:['qf'],a:[0],n:1},{tm:'(q0, 1, 1, L, q1)\n(q1, 0, 1, H, qf)',fin:['qf'],a:[4],n:1},
 {tm:'(q0, 1, 1, R, q1)\n(q1, 1, 0, R, q1)',fin:['q1'],a:[3],n:1},
 {tm:'(q0, 1, 0, R, q1)\n(q1, 1, 0, R, q2)\n(q2, 1, 0, R, q3)',fin:['q1','q2','q3'],a:[1],n:1},
 {tm:'(q0, 1, 0, R, q1)\n(q1, 1, 0, R, q2)\n(q2, 1, 0, R, q3)',fin:['q1','q2','q3'],a:[5],n:1}]);
add('c_tmd',[
 {t:'f(x) = x + 3',f:x=>x+3,ins:[[0],[1],[3]],ref:L(['(q0, 1, 1, L, q1)','(q1, 0, 1, L, q2)','(q2, 0, 1, H, qf)','final: qf']),hint:'x+1 ones; write three more 1s... but x+3 total needs only two new ones on the left.'.replace('but x+3 total needs only two new ones on the left','you need two extra 1s: write them to the left of the input')},
 {t:'f(x) = 1',f:x=>1,ins:[[0],[1],[4]],ref:L(['(q0, 1, 1, R, q1)','(q1, 1, 0, R, q1)','final: q1']),hint:'Keep the first 1 and erase all the others.'},
 {t:'f(x, y) = x + y + 1',f:(x,y)=>x+y+1,ins:[[0,0],[2,1],[3,4],[0,5]],ref:L(['(q0, 1, 0, H, qf)','final: qf']),hint:'The tape holds x+y+2 ones. Delete only one.'},
 {t:'f(x) = x ∸ 2',f:x=>Math.max(0,x-2),ins:[[0],[1],[2],[5]],ref:L(['(q0, 1, 0, R, q1)','(q1, 1, 0, R, q2)','(q2, 1, 0, R, q3)','final: q1, q2, q3']),hint:'Delete up to three 1s (the input has x+1).'}]);
add('c_smn',[
 {p:L(['begin','  X1:=X1+X2','end']),m:1,C:[7],x:[5]},
 {p:L(['begin','  X1:=X1*X2','end']),m:1,C:[0],x:[5]},
 {p:L(['begin','  X1:=X1∸X2','end']),m:1,C:[3],x:[8]},
 {p:L(['begin','  X1:=X1*X2*X3','end']),m:2,C:[2,3],x:[4]},
 {p:L(['begin','  X1:=X1+X2+X3','end']),m:1,C:[4],x:[1,2]},
 {p:L(['begin','  X1:=X2∸X1','end']),m:1,C:[2],x:[9]},
 {p:L(['begin','  X1:=X1*X1+X2','end']),m:1,C:[4],x:[3]},
 {p:L(['begin','  X1:=X1+X2*X3','end']),m:2,C:[1,5],x:[6]}]);
const Q=(q,o,a,e)=>({q,o,a,e});
add('c_con',[
 Q('Which statement is <b>not</b> a basic statement of while programs?',['X:=X*Y','X:=0','X:=succ(X)','while X≠Y do S'],0,'Multiplication is a macro: it expands into loops of succ/pred.'),
 Q('How does the macro <code>X:=Y</code> work?',['It copies Y into X using a loop with an auxiliary variable','It is a basic statement','It sets Y to 0','It swaps X and Y'],0,'Z:=X is a macro built from loops over succ/pred: not a basic statement.'),
 Q('What is the domain of the variables in a while program?',['Natural numbers','Integers','Reals','Booleans'],0,'Variables hold natural numbers, which is why pred(0)=0.'),
 Q('How many arguments can a function computed by a program have?',['Any number k: φ<sub>P</sub><sup>(k)</sup>','Always exactly one','Always two','At most three'],0,'A program has a semantic function for every arity k.'),
 Q('When is a function <b>total</b>?',['It is defined for every input','It halts only on 0','It never halts','It has one argument'],0,'Partial functions may be undefined (⊥) on some inputs; total ones never are.'),
 Q('Can a Turing machine have <b>several</b> transitions for the same (state, symbol)?',['No: the machine is deterministic','Yes, it chooses randomly','Yes, it tries all','Only on blank'],0,'One transition per (state, read symbol): determinism.'),
 Q('In the TM move set, what does <b>N</b> do?',['The head stays in place','Moves right','Moves left','Halts'],0,'Moves are L, R, N (no move) and H (halt).'),
 Q('What does a <b>halting</b> move H do?',['The machine stops after the write','It moves right','It rewinds the tape','It resets the state'],0,'H ends the computation after writing.'),
 Q('How is the result of a Turing machine read?',['Count the 1s on the tape when it stops in a final state','Read the state name','Count transitions used','Read the position of the head'],0,'Output = number of 1s at the end (only if the machine stops in a final state).'),
 Q('How can one Turing machine compute f(x, y)?',['Input written as blocks of x+1 and y+1 ones separated by one 0','Only one block of x+y ones','Two tapes','Binary coding'],0,'Arguments are unary blocks separated by a blank cell.'),
 Q('What does it mean that a model is <b>Turing-complete</b>?',['It computes all Turing-computable functions','It runs fast','It has a tape','It is deterministic'],0,'Equivalent expressive power: all the computable functions.'),
 Q('Which problem cannot be decided by any program?',['Whether an arbitrary program halts on a given input','Whether a number is even','Whether X<Y','Whether a string is a program of length 3'],0,'The halting problem is undecidable (a classical consequence of universality).'),
 Q('What is the <b>code</b> of the empty program <code>begin end</code> used for?',['Programs become data: they can be inputs of other programs','Nothing','Only for printing','To count variables'],0,'Coding lets a program receive another program as input: the basis of universality.'),
 Q('What does <code>decod</code> do?',['Recovers the program text from its code number','Executes the program','Counts its variables','Deletes comments'],0,'decod is the inverse of cod on valid codes.'),
 Q('Why is the universal program <b>U</b> important?',['It simulates any program from its code','It halts on all inputs','It is the shortest program','It only adds numbers'],0,'U(e,x) = φ_e(x): a single interpreter for the whole class.'),
 Q('What changes in φ<sub>P</sub><sup>(k)</sup> if k is smaller than the number of input variables used?',['The missing inputs start at 0','The program fails','The extra inputs are random','Nothing, it is undefined'],0,'Inputs fill X1..Xk; every other variable starts at 0.'),
 Q('Initial vector when k > number of variables mentioned?',['Extra inputs are ignored','They are added as new variables','The program is undefined','They go to X1'],0,'Variables not used by the program are simply ignored (k ≥ j: pad; k < j: truncate).'),
 Q('In while programs, which construct is the only source of <b>non-termination</b>?',['The while loop','Assignment','succ','pred'],0,'All other statements always finish.'),
 Q('What is the E_T of the test X=Y?',['(1∸(X∸Y)) * (1∸(Y∸X))','X∸Y','X+Y','X*Y'],0,'X=Y holds iff both X∸Y and Y∸X are 0; ¬(E)=1∸E and ∧=*.'),
 Q('What is E_T for X≠Y?',['(X∸Y) + (Y∸X)','X*Y','X∸Y','1∸X'],0,'X≠Y is true iff one of the two bounded differences is positive: ∨ is +.'),
 Q('What is the E_T of ¬T?',['1 ∸ E_T','E_T + 1','E_T * E_T','0'],0,'1∸E is positive iff E is zero.'),
 Q('In the s-m-n construction, why are the free inputs shifted <b>last first</b>?',['So that no input is overwritten before it is copied','To save memory','It is arbitrary','To make the program shorter'],0,'Copying X1→X(m+1) first would destroy a value still needed.'),
 Q('If φ<sub>P</sub>(x,y)=x·y, what is φ<sub>Q</sub>(y) for Q = s-m-n(P, C=4)?',['4·y','y','4+y','y⁴'],0,'φ_Q(y)=φ_P(4,y)=4·y.'),
 Q('What does the Church–Turing thesis relate?',['Intuitive algorithms and Turing-computable functions','Turing machines and finite automata','Proofs and programs','Time and space'],0,'It states they coincide; it is a thesis, not a theorem.'),
 Q('Name one evidence supporting the Church–Turing thesis.',['Every proposed model (while, μ-recursive, λ-calculus) is equivalent','Someone proved it','It runs in polynomial time','It is decidable'],0,'All reasonable formalizations turned out equivalent.'),
 Q('What is composition of semantic functions φ<sub>Q</sub>∘φ<sub>P</sub> computed by?',['The program P followed by Q (renaming variables)','Running P twice','A single assignment','Q followed by P'],0,'Run P, move its result to the input of Q, run Q.'),
 Q('If P does not halt on x, what is φ<sub>Q</sub>(φ<sub>P</sub>(x))?',['⊥','0','φ_Q(0)','x'],0,'Composition is strict here: no value comes out of P.'),
 Q('What is X∸Y when X<Y?',['0','−1','Y−X','undefined'],0,'∸ is bounded difference: never below 0.'),
 Q('Which macro-test can be rewritten as the arithmetic expression Y∸X?',['X<Y','X=Y','X≥Y','X≠Y'],0,'Y∸X is positive iff X<Y.')]);
})();

