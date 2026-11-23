/* ===================== question generators for the arcade ===================== */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const pk=(r,a)=>a[Math.floor(r()*a.length)];
function shuf(r,a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function mcq(r,correct,wrongs){const w=[...new Set(wrongs.filter(x=>x!==correct))].slice(0,3),all=shuf(r,[correct,...w]);return{ch:all,ans:all.indexOf(correct)}}
function sci(v,u){const A=Math.abs(v);let s,p;if(A>=1e6){s=v/1e6;p='M'}else if(A>=1e3){s=v/1e3;p='k'}else if(A>=1||A===0){s=v;p=''}else if(A>=1e-3){s=v*1e3;p='m'}else if(A>=1e-6){s=v*1e6;p='µ'}else if(A>=1e-9){s=v*1e9;p='n'}else{s=v*1e12;p='p'}return (+s.toPrecision(3)).toString()+' '+p+u}
function numMC(r,c,ws,u){const seen=new Set([sci(c,u)]),out=[];[...ws,c*10,c/10,c*2,c/2,c*5].forEach(v=>{if(!isFinite(v)||v<=0)return;const s=sci(v,u);if(!seen.has(s)&&out.length<3){seen.add(s);out.push(s)}});return mcq(r,sci(c,u),out)}
const par=(a,b)=>a*b/(a+b);
const CONC_TEC=[
 ["In a series circuit, which quantity is the same through every component?","Current","Voltage","Power","Resistance","Series elements carry one common current. The voltages add up to the source."],
 ["In a parallel circuit, which quantity is the same across every branch?","Voltage","Current","Power","Resistance","All branches connect to the same two nodes, so they see the same voltage."],
 ["How should an ideal voltmeter be connected, and what should its resistance be?","In parallel, very high","In series, very low","In parallel, very low","In series, very high","It measures across a component without disturbing the circuit, so it must draw almost no current."],
 ["How should an ideal ammeter be connected, and what should its resistance be?","In series, very low","In parallel, very high","In series, very high","In parallel, very low","It carries the circuit current, so it must add almost no voltage drop."],
 ["Approximate forward voltage drop of a silicon diode when it conducts:","≈ 0.7 V","≈ 0.07 V","≈ 7 V","Exactly 0 V","Silicon diodes drop about 0.6 to 0.7 V when forward biased."],
 ["In DC steady state, a capacitor behaves like:","An open circuit","A short circuit","A 1 Ω resistor","A voltage source","Once charged, no current flows through it."],
 ["In DC steady state, an ideal inductor behaves like:","A short circuit","An open circuit","A capacitor","A current source","With constant current there is no voltage across an ideal inductor: it acts like a wire."],
 ["An NMOS transistor starts to conduct when:","VGS exceeds the threshold voltage","VDS is zero","The gate is grounded","The drain is left open","A channel forms only when the gate-source voltage is above Vth."],
 ["A BJT in the active region has:","B-E forward biased, B-C reverse biased","B-E reverse biased, B-C forward biased","Both junctions forward biased","Both junctions reverse biased","Both forward means saturation, both reverse means cutoff."],
 ["Kirchhoff's Current Law says that at any node:","Current in equals current out","The voltages around it sum to zero","Power in equals power out in each branch","Current is the same in every branch","KCL is conservation of charge."],
 ["Kirchhoff's Voltage Law says that around any closed loop:","The voltages sum to zero","The currents sum to zero","All resistances are equal","Power is zero","KVL is conservation of energy around a loop."],
 ["The Thevenin equivalent of a linear circuit is:","A voltage source in series with a resistance","A current source in series with a voltage source","Two resistors in parallel","A capacitor and a resistor","Vth in series with Rth."],
 ["Adding another resistor in parallel makes the total resistance:","Smaller","Larger","Unchanged","Infinite","Each new branch is one more path for current, so the equivalent resistance drops."]];
function genTEC(r){
 const t=r();
 if(t<.25){const [q,c,a,b,d,why]=pk(r,CONC_TEC);const m=mcq(r,c,[a,b,d]);return Object.assign({q,why},m)}
 const k=Math.floor(r()*9);
 if(k===0){const V=pk(r,[3,5,9,12,24]),R=pk(r,[100,220,330,470,1000,2200,4700,10000]),I=V/R;return Object.assign({q:`A ${V} V source is across a ${sci(R,'Ω')} resistor. What current flows?`,why:`I = V / R = ${V} V / ${sci(R,'Ω')} = ${sci(I,'A')}.`},numMC(r,I,[I*10,I/10,R/V,V*R],'A'))}
 if(k===1){const I=pk(r,[.001,.002,.005,.01,.02]),R=pk(r,[100,220,470,1000,2200]),V=I*R;return Object.assign({q:`${sci(I,'A')} flows through a ${sci(R,'Ω')} resistor. What is the voltage across it?`,why:`V = I × R = ${sci(I,'A')} × ${sci(R,'Ω')} = ${sci(V,'V')}.`},numMC(r,V,[V*10,V/10,I/R,V*1000],'V'))}
 if(k===2){const V=pk(r,[5,9,12]),I=pk(r,[.001,.002,.005,.01,.02]),R=V/I;return Object.assign({q:`${V} V across a component drives ${sci(I,'A')}. What is its resistance?`,why:`R = V / I = ${V} V / ${sci(I,'A')} = ${sci(R,'Ω')}.`},numMC(r,R,[R*10,R/10,I/V,R*1000],'Ω'))}
 if(k===3){const L=[100,220,330,470,1000,2200],a=pk(r,L),b=pk(r,L),c=pk(r,L),S=a+b+c;return Object.assign({q:`${sci(a,'Ω')}, ${sci(b,'Ω')} and ${sci(c,'Ω')} are in series. What is the total resistance?`,why:`Series resistances add: ${sci(a,'Ω')} + ${sci(b,'Ω')} + ${sci(c,'Ω')} = ${sci(S,'Ω')}.`},numMC(r,S,[1/(1/a+1/b+1/c),a+b,Math.max(a,b,c)],'Ω'))}
 if(k===4){const [a,b]=pk(r,[[100,100],[200,200],[300,600],[1000,1000],[2000,2000],[3000,6000],[4000,12000],[1000,3000],[2000,3000],[6000,3000],[10000,10000]]),P=par(a,b);return Object.assign({q:`${sci(a,'Ω')} in parallel with ${sci(b,'Ω')}. What is the equivalent resistance?`,why:`R = (R1·R2) / (R1+R2) = ${sci(P,'Ω')}. It is always smaller than the smaller resistor.`},numMC(r,P,[a+b,(a+b)/2,Math.max(a,b)],'Ω'))}
 if(k===5){const [Vi,R1,R2]=pk(r,[[12,1000,1000],[9,2000,1000],[12,2000,1000],[10,1000,1000],[12,1000,3000],[5,1000,1000],[9,1000,2000]]),Vo=Vi*R2/(R1+R2);return Object.assign({q:`A divider has ${Vi} V on top, R1 = ${sci(R1,'Ω')} above and R2 = ${sci(R2,'Ω')} to ground. What is the voltage across R2?`,why:`Vout = Vin × R2 / (R1+R2) = ${Vi} × ${sci(R2,'Ω')} / ${sci(R1+R2,'Ω')} = ${sci(Vo,'V')}.`},numMC(r,Vo,[Vi*R1/(R1+R2),Vi/2,Vi],'V'))}
 if(k===6){if(r()<.5){const V=pk(r,[5,12,24]),I=pk(r,[.01,.05,.1,.5]),P=V*I;return Object.assign({q:`A load runs from ${V} V and draws ${sci(I,'A')}. How much power does it use?`,why:`P = V × I = ${V} V × ${sci(I,'A')} = ${sci(P,'W')}.`},numMC(r,P,[V/I,P*10,P/10,V+I],'W'))}
  const I=pk(r,[.01,.02,.05,.1]),R=pk(r,[10,100,220,1000]),P=I*I*R;return Object.assign({q:`${sci(I,'A')} flows through ${sci(R,'Ω')}. How much power is dissipated?`,why:`P = I² × R = (${sci(I,'A')})² × ${sci(R,'Ω')} = ${sci(P,'W')}. Do not forget to square the current.`},numMC(r,P,[I*R,I*R*2,P*10,P/10],'W'))}
 if(k===7){const [Vs,Vf,I]=pk(r,[[5,2,.02],[5,2,.01],[9,2,.02],[5,3,.02],[3.3,1.8,.01]]),R=(Vs-Vf)/I;return Object.assign({q:`Supply ${Vs} V, LED drops ${Vf} V and needs ${sci(I,'A')}. Which series resistor do you need?`,why:`R = (Vs − Vf) / I = (${Vs} − ${Vf}) V / ${sci(I,'A')} = ${sci(R,'Ω')}.`},numMC(r,R,[Vs/I,Vf/I,(Vs+Vf)/I],'Ω'))}
 const R=pk(r,[1000,10000,100000]),C=pk(r,[100e-9,1e-6,10e-6,100e-6]),tau=R*C;return Object.assign({q:`What is the time constant τ of ${sci(R,'Ω')} with ${sci(C,'F')}?`,why:`τ = R × C = ${sci(R,'Ω')} × ${sci(C,'F')} = ${sci(tau,'s')}. After about 5τ the capacitor is practically full.`},numMC(r,tau,[tau*10,tau/10,tau*6.28],'s'))}
/* ---- Truth Rush: formulas are evaluated by brute force, so every answer is verified ---- */
const LOPS={a:'∧',o:'∨',i:'→',e:'↔'};
function lrand0(r,d,vs){if(d===0||r()<.12)return{t:'v',n:pk(r,vs)};const x=r();if(x<.2)return{t:'n',a:lrand0(r,d-1,vs)};return{t:pk(r,['a','o','i','i','e']),l:lrand0(r,d-1,vs),r:lrand0(r,d-1,vs)}}
function ldeg(f){if(f.t==='v')return false;if(f.t==='n')return f.a.t==='n'||ldeg(f.a);return lstr(f.l,0)===lstr(f.r,0)||ldeg(f.l)||ldeg(f.r)}
function lrand(r,d,vs){for(let i=0;i<40;i++){const f=lrand0(r,d,vs);if(!ldeg(f))return f}return lrand0(r,d,vs)}
function lev(f,I){switch(f.t){case'v':return I[f.n];case'n':return!lev(f.a,I);case'a':return lev(f.l,I)&&lev(f.r,I);case'o':return lev(f.l,I)||lev(f.r,I);case'i':return!lev(f.l,I)||lev(f.r,I);default:return lev(f.l,I)===lev(f.r,I)}}
function lstr(f,top){if(f.t==='v')return f.n;if(f.t==='n')return '¬'+lstr(f.a,0);const s=lstr(f.l,0)+' '+LOPS[f.t]+' '+lstr(f.r,0);return top?s:'('+s+')'}
function lused(f,s=new Set()){if(f.t==='v')s.add(f.n);else if(f.t==='n')lused(f.a,s);else{lused(f.l,s);lused(f.r,s)}return s}
function lcol(f,vs){const o=[];for(let i=0;i<(1<<vs.length);i++){const I={};vs.forEach((v,k)=>I[v]=!((i>>(vs.length-1-k))&1));o.push(lev(f,I))}return o}
const TF=a=>a.map(x=>x?'T':'F').join('');
const rowsTxt=(vs,col)=>col.map((b,i)=>b?'('+vs.map((v,k)=>!((i>>(vs.length-1-k))&1)?'T':'F').join(',')+')':null).filter(Boolean).join(' ');
function genLogic(r){
 const t=r();
 if(t<.3){const n=r()<.6?2:3,vs=['p','q','r'].slice(0,n);let f,tries=0;do{f=lrand(r,n===2?2:3,vs);tries++}while(lused(f).size<n&&tries<60);
  const col=lcol(f,vs),c=col.filter(Boolean).length,N=col.length,pool=[];for(let i=0;i<=N;i++)if(i!==c)pool.push(String(i));
  const m=mcq(r,String(c),shuf(r,pool));return Object.assign({q:`How many of the ${N} rows of the truth table of  ${lstr(f,1)}  are true?`,why:`Truth column over (${vs.join(',')}) is ${TF(col)}. `+(c?`True for: ${rowsTxt(vs,col)}.`:'It is never true.')},m)}
 if(t<.6){const vs=['p','q'],g={};for(let i=0;i<500;i++){const f=lrand(r,2,vs);if(lused(f).size<2)continue;const s=TF(lcol(f,vs)),x=lstr(f,1);(g[s]=g[s]||new Set()).add(x)}
  const keys=Object.keys(g),multi=keys.filter(k=>g[k].size>=2);
  if(multi.length>=1&&keys.length>=4){const k=pk(r,multi),[a,b]=shuf(r,[...g[k]]).slice(0,2),others=shuf(r,keys.filter(x=>x!==k)).slice(0,3).map(x=>pk(r,[...g[x]]));
   const m=mcq(r,b,others);return Object.assign({q:`Which formula is logically equivalent to  ${a} ?`,why:`Both have the truth column ${k} over (p,q) = TT, TF, FT, FF. The other options do not.`},m)}}
 if(t<.8){const want=pk(r,['Tautology','Contradiction','Contingent']),vs=['p','q'];let f=null;
  for(let i=0;i<800&&!f;i++){const x=lrand(r,3,vs);if(lused(x).size<2)continue;const c=lcol(x,vs),cl=c.every(Boolean)?'Tautology':c.some(Boolean)?'Contingent':'Contradiction';if(cl===want)f=x}
  if(f){const c=lcol(f,vs);return{q:`Classify  ${lstr(f,1)} :`,ch:['Tautology','Contradiction','Contingent'],ans:['Tautology','Contradiction','Contingent'].indexOf(want),why:`Truth column over (p,q): ${TF(c)}. `+(want==='Tautology'?'Always true.':want==='Contradiction'?'Never true.':'True in some rows and false in others.')}}}
 const vs=['p','q','r'],I={p:r()<.5,q:r()<.5,r:r()<.5};let f;do{f=lrand(r,3,vs)}while(lused(f).size<2);const v=lev(f,I);
 return{q:`With p = ${I.p?'T':'F'}, q = ${I.q?'T':'F'}, r = ${I.r?'T':'F'}, what is the value of  ${lstr(f,1)} ?`,ch:['True','False'],ans:v?0:1,why:`Evaluate the innermost parts first. The whole formula is ${v?'true':'false'}.`}}
/* ---- GUI Gauntlet: curated Java GUI and HCI questions ---- */
const BANK_HCI=[
 ["Which toolkit draws its own widgets in pure Java, so the look is the same on every OS?","Swing","AWT","JDBC","RMI","AWT wraps native OS widgets. Swing is pure Java, so it looks the same everywhere."],
 ["JFC (Java Foundation Classes) is made of:","AWT + Swing + Java2D","AWT + SWT + OpenGL","Swing + JDBC + RMI","Servlets + JSP + Swing","JFC bundles AWT, Swing and Java2D."],
 ["Which package contains the Swing classes?","javax.swing","java.swing","java.awt.swing","javax.gui","Swing lives in javax.swing; JButton, JFrame, JLabel and friends are there."],
 ["In the delegation event model, who registers a listener?","The event source, with addXxxListener()","The listener's constructor, automatically","The JVM at startup","The event object itself","Registration is done on the source: button.addActionListener(listener)."],
 ["Which method returns the object that fired an event?","getSource()","getTarget()","getOwner()","getParent()","EventObject.getSource() returns the component that generated the event."],
 ["Which listener interface handles a JButton click?","ActionListener","KeyListener","WindowListener","FocusListener","Buttons fire ActionEvents."],
 ["Which method must you implement for ActionListener?","actionPerformed","onClick","actionEvent","handleAction","ActionListener has one method: void actionPerformed(ActionEvent e)."],
 ["Which MouseListener method reports a press followed by a release at the same spot?","mouseClicked","mouseDragged","mouseMoved","mouseWheelMoved","mouseDragged and mouseMoved belong to MouseMotionListener."],
 ["Which interface declares mouseDragged and mouseMoved?","MouseMotionListener","MouseListener","ActionListener","KeyListener","MouseMotionListener handles movement. MouseListener handles press, release, click, enter, exit."],
 ["Which KeyListener method reports the character that was typed?","keyTyped","keyPressed","keyHeld","keyDown","keyTyped delivers characters. keyPressed and keyReleased deal with key codes."],
 ["Which pair of methods belongs to FocusListener?","focusGained and focusLost","focusIn and focusOut","gotFocus and lostFocus","focusOn and focusOff","FocusListener: focusGained(FocusEvent) and focusLost(FocusEvent)."],
 ["Which WindowListener method runs when the user tries to close the window?","windowClosing","windowClosed","windowExit","windowShutdown","windowClosing fires when closing is requested. windowClosed fires after the window was disposed."],
 ["Why use an adapter class such as MouseAdapter?","To override only the methods you need","To make events run faster","Because ActionListener requires it","To avoid registering listeners","Adapters give empty implementations, so you do not have to implement every interface method."],
 ["ActionEvent extends which class?","AWTEvent","MouseEvent","ComponentEvent","KeyEvent","The hierarchy is EventObject, then AWTEvent, then ActionEvent."],
 ["What is the root class of all Java event classes?","java.util.EventObject","java.lang.Event","java.awt.EventQueue","javax.swing.Event","Every event class descends from EventObject."],
 ["A container is also a component. Which design pattern is that?","Composite","Singleton","Factory","Decorator","Composite lets one tree of components and containers be treated uniformly."],
 ["The event delegation model is an example of which pattern?","Observer","Builder","Strategy","Prototype","The source is the subject and the listeners are the observers."],
 ["What is an advantage of an inner-class listener?","It can use members of the enclosing class directly","It needs no interface","It runs on its own thread","It dispatches events faster","Inner classes see the fields and methods of the outer class."],
 ["Which statement about AWT is true?","It relies on native OS widgets","It is drawn entirely in pure Java","It is newer than Swing","It includes JTable","AWT components map to native peers, so they can behave differently per OS."],
 ["Can the Swing Look & Feel be changed while the program runs?","Yes, with UIManager","No, only at compile time","Only on Windows","Only before the first window opens","Swing's pluggable look and feel can be switched at runtime."],
 ["Swing component class names usually start with which letter?","J","S","W","X","JButton, JLabel, JPanel, JFrame."],
 ["Which listener fires when the user presses Enter in a JTextField?","ActionListener","MouseListener","WindowListener","ItemListener","JTextField fires an ActionEvent on Enter."],
 ["ISO 9241-11 defines usability with effectiveness, efficiency and:","Satisfaction","Security","Portability","Scalability","Usability is about specified users reaching specified goals in a specified context."],
 ["Which usability aspect is about how quickly users get tasks done once they know the system?","Efficiency","Learnability","Safety","Satisfaction","Efficiency is speed of use after learning."],
 ["Learnability means:","How easy the system is to learn","How fast experts work","How few errors happen","How attractive it looks","It is about the first steps of a new user."],
 ["ISO 9241-210 describes:","Human-centred design for interactive systems","Network protocol design","Database normalisation","Compiler testing","It is the standard for the user-centred design process."],
 ["In the three-models view, the conceptual model is offered by:","The designer","The user","The operating system","The database","The designer offers a conceptual model, the UI shows it, and the user builds a mental model."],
 ["A user's mental model is:","What the user believes about how the system works","The designer's class diagram","The hardware specification","The database schema","Good design makes the mental model match the system's real behaviour."],
 ["In the iterative design cycle, after you build a prototype you should:","Evaluate it with users","Ship it immediately","Delete the requirements","Rewrite it in assembly","Design, prototype, evaluate, then iterate."],
 ["Nielsen's heuristic \"Visibility of system status\" means:","The system keeps users informed through timely feedback","All menus are always visible","Users can see the source code","Errors are hidden","For example a progress bar during a long operation."],
 ["Which is a good example of error prevention?","Disabling Submit until the required fields are valid","Showing a cryptic error code","Letting users type anything into any field","Closing the app after an error","Prevent the error before it happens, rather than only reporting it."],
 ["\"Recognition rather than recall\" favours:","Visible menus and options","Memorised keyboard commands only","Hidden gestures","Typing long commands","People recognise options far more easily than they recall them."],
 ["\"Consistency and standards\" means:","Follow platform conventions so users need not wonder what words or actions mean","Every screen must look identical","Use as many colours as possible","Invent new icons for every action","Users should not have to guess whether different words mean the same thing."],
 ["Fitts's law predicts that the time to hit a target depends on:","Its distance and its size","The number of choices","Memory capacity","Colour contrast","Big, close targets are quicker to reach."],
 ["Hick's law says decision time increases with:","The number of choices","The screen size","The mouse speed","The font weight","More options means a longer decision time."],
 ["An affordance is:","A perceived possible action, like a button that looks pressable","A hidden menu","A kind of error message","A colour palette","Good affordances show users what they can do."],
 ["Usability always depends on:","A specified user, goal and context of use","Only the code quality","Only the hardware","Only the GUI toolkit","The same UI can be great in an office and terrible in a noisy plant."],
 ["Which choice suits a noisy industrial plant?","Large high-contrast controls and visual alarms","Quiet audio beeps only","Tiny touch targets","Hidden gestures","Sound can be unreliable in noise, so rely on visual signals and big controls."],
 ["Swing components are called lightweight because they:","Have no native peer","Use less than 1 MB","Run without a JVM","Cannot be nested","They are drawn by Java itself instead of by the operating system."]];
function genHCI(r){const u=G2.used||(G2.used=new Set());let ix,t=0;do{ix=Math.floor(r()*BANK_HCI.length);t++}while(u.has(ix)&&t<60);u.add(ix);if(u.size>=BANK_HCI.length)u.clear();
 const [q,c,a,b,d,why]=BANK_HCI[ix];return Object.assign({q,why},mcq(r,c,[a,b,d]))}

