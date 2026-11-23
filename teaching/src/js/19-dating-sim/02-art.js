 /* ---------- the characters: original soft-vector art. Gradient-lit hair, glossy layered eyes and drawn expressions.
    Everything is a list of shapes, so the same art renders as SVG in the page and onto a canvas for the card. ---------- */
 const PAL={
  sweet:{hair:'#ff9ec7',hl:'#ffd3e6',hd:'#d95f93',eye:'#e0457f',ek:'#8f1f57',el:'#ffb6d3',cl:'#fff5ec',c2:'#ecd2bf',ac:'#ff5c9a'},
  tsun:{hair:'#ff9a45',hl:'#ffd29c',hd:'#d4631a',eye:'#e8541c',ek:'#8a2a0a',el:'#ffc27a',cl:'#2f4380',c2:'#202d5c',ac:'#e53935'},
  yan:{hair:'#4d2547',hl:'#97508b',hd:'#260c24',eye:'#f0245a',ek:'#6e0626',el:'#ff8aa8',cl:'#2b1a27',c2:'#170b15',ac:'#e11d48'},
  dan:{hair:'#b9a8ff',hl:'#e6dfff',hd:'#8670e0',eye:'#7a63e8',ek:'#3b2a9a',el:'#c7bcff',cl:'#e9e2ff',c2:'#c9bdf2',ac:'#8f7be0'},
  kuu:{hair:'#d3e8fb',hl:'#ffffff',hd:'#86b4dc',eye:'#2f86c4',ek:'#124a78',el:'#9fd4f5',cl:'#34495e',c2:'#202f3e',ac:'#7fb6e0'}};
 const EX={
  sweet:[{e:'love',m:'open',b:1,br:'up',au:'#ff5c9a',sp:1},{e:'happy',m:'smile',b:.6,br:'up',au:'#ffb3d1'},{e:'open',m:'smile',br:'n'},{e:'sad',m:'frown',br:'sad',au:'#7a6bd1'},{e:'sad',m:'frown',br:'sad',tear:1,au:'#3d4fa8'},{e:'sad',m:'o',br:'sad',tear:2,au:'#3d4fa8'}],
  tsun:[{e:'happy',m:'pout',b:1,br:'up',au:'#ff8a5c',sp:1},{e:'open',m:'pout',b:.8,br:'n',au:'#ffb27a'},{e:'open',m:'flat',br:'n'},{e:'angry',m:'frown',br:'ang',au:'#c2410c'},{e:'angry',m:'frown',br:'ang',vein:1,au:'#b91c1c'},{e:'angry',m:'shout',br:'ang',vein:1,au:'#b91c1c'}],
  yan:[{e:'love',m:'wide',b:1,br:'up',sp:1,au:'#ff2d6f'},{e:'hollow',m:'smile',br:'n',au:'#ff6b9a'},{e:'hollow',m:'tiny',br:'n'},{e:'hollow',m:'flat',br:'flat',shade:1,au:'#5b1030'},{e:'hollow',m:'wide',br:'flat',shade:1,au:'#7a0a1f'},{e:'hollow',m:'wide',br:'flat',shade:2,au:'#7a0a1f'}],
  dan:[{e:'shy',m:'smile',b:1,br:'up',au:'#c7bcff',sp:1},{e:'shy',m:'tiny',b:.7,br:'n',au:'#d8d0ff'},{e:'open',m:'tiny',br:'n'},{e:'sad',m:'tiny',br:'sad',sweat:1,au:'#6b5bd1'},{e:'sad',m:'frown',br:'sad',tear:1,au:'#3d4fa8'},{e:'sad',m:'o',br:'sad',tear:2,sweat:1,au:'#3d4fa8'}],
  kuu:[{e:'half',m:'smile',b:.5,br:'n',au:'#bfe3ff',sp:1},{e:'half',m:'tiny',br:'n'},{e:'half',m:'flat',br:'n'},{e:'half',m:'frown',br:'n',au:'#4a6a8c'},{e:'angry',m:'flat',br:'ang',au:'#27527a'},{e:'angry',m:'frown',br:'ang',vein:1,au:'#173a5c'}]};
 const BK={sweet:{f:'L',m:'S',n:'B'},tsun:{f:'T',m:'S',n:'P'},yan:{f:'L',m:'B',n:'L'},dan:{f:'L',m:'B',n:'B'},kuu:{f:'B',m:'S',n:'S'}};
 const FR={sweet:'center',tsun:'center',yan:'blunt',dan:'side',kuu:'swept'};
 const mir=d=>{let i=0;return d.replace(/([A-Za-z])|(-?\d*\.?\d+)/g,(m,l,n)=>{if(l){i=0;return l}const o=i%2===0?String(Math.round((200-parseFloat(n))*10)/10):n;i++;return o})};
 const LG=(x1,y1,x2,y2,s)=>({t:'l',a:[x1,y1,x2,y2],s}),RG=(cx,cy,r,s)=>({t:'r',a:[cx,cy,r],s});
 function shapes(a,g,i0){const v=Math.floor(i0/10),i=i0%10,gx=v===2?-4.6:v===3?4.6:0,P=PAL[a],E=EX[a][i],o=[],sk='#ffe4d2',sd='#f2c2a6',s2='#d99a7e',ink='#4a2433';
  const p=(d,f,st,sw,op,cl)=>o.push({k:'p',d,f,s:st,w:sw,o:op,g:cl}),c=(x,y,r,f,st,sw,op,cl)=>o.push({k:'c',x,y,r,f,s:st,w:sw,o:op,g:cl}),el=(x,y,rx,ry,f,st,sw,op,cl)=>o.push({k:'e',x,y,rx,ry,f,s:st,w:sw,o:op,g:cl});
  const both=(d,f,st,sw,op,cl)=>{p(d,f,st,sw,op,cl);p(mir(d),f,st,sw,op,cl)};
  const heart=(x,y,z,f,op,cl)=>p(`M${x} ${y+z*.9}C${x-z*1.6} ${y-z*.1} ${x-z*.9} ${y-z*1.2} ${x} ${y-z*.5}C${x+z*.9} ${y-z*1.2} ${x+z*1.6} ${y-z*.1} ${x} ${y+z*.9}Z`,f,null,0,op,cl);
  const star=(x,y,z,f,op,cl)=>p(`M${x} ${y-z}Q${x+z*.18} ${y-z*.18} ${x+z} ${y}Q${x+z*.18} ${y+z*.18} ${x} ${y+z}Q${x-z*.18} ${y+z*.18} ${x-z} ${y}Q${x-z*.18} ${y-z*.18} ${x} ${y-z}Z`,f,null,0,op,cl);
  const M=g==='m',ys=M?.78:1,bk=M?'S':BK[a][g],fr=FR[a];
  /* aura */
  if(E.au)c(100,128,96,RG(100,128,96,[[0,E.au,.42],[.7,E.au,.12],[1,E.au,0]]));
  if(E.sp){star(34,70,7,'#fff',.95,'tw');star(168,52,5,'#fff',.9,'tw');star(160,150,4,'#fff',.8,'tw');star(40,150,3.5,'#fff',.8,'tw')}
  /* back hair */
  const HG=LG(0,20,0,230,[[0,P.hl],[.25,P.hair],[1,P.hd]]);
  if(bk==='L')p('M46 100C34 48 62 20 100 20C138 20 166 48 154 100L168 204C162 238 140 240 130 214L130 150L70 150L70 214C60 240 38 238 32 204Z',HG,P.hd,1.4,1,'sw');
  else if(bk==='B')p('M46 100C36 48 64 22 100 22C136 22 164 48 154 100L158 154C152 172 136 172 128 158L72 158C64 172 48 172 42 154Z',HG,P.hd,1.4,1,'sw');
  else if(bk==='P'){p('M142 46C186 50 196 116 172 190C162 156 160 120 142 84Z',HG,P.hd,1.4,1,'sw');p('M48 98C38 48 66 22 100 22C134 22 162 48 152 98Z',HG,P.hd,1.4)}
  else p('M48 98C40 50 66 24 100 24C134 24 160 50 152 98C150 78 138 66 100 66C62 66 50 78 48 98Z',HG,P.hd,1.4);
  if(bk==='T'){p('M54 52C14 66 2 130 20 210C36 186 44 150 54 104Z',HG,P.hd,1.4,1,'sw');p('M146 52C186 66 198 130 180 210C164 186 156 150 146 104Z',HG,P.hd,1.4,1,'sw');p('M48 98C40 50 66 24 100 24C134 24 160 50 152 98Z',HG,P.hd,1.4)}
  /* body */
  const cg=LG(0,180,0,250,[[0,P.cl],[1,P.c2]]);
  p(M?'M-4 250C-2 204 38 182 100 180C162 182 202 204 204 250Z':'M20 250C22 204 56 184 100 182C144 184 178 204 180 250Z',cg,P.c2,1.4);
  if(M){p('M70 186L100 250L56 250Z',P.c2,null,0,.28);p('M130 186L100 250L144 250Z',P.c2,null,0,.28)}
  p(M?'M78 150H122V190Q100 206 78 190Z':'M84 158H116V190Q100 204 84 190Z',LG(0,158,0,196,[[0,sk],[1,s2]]));
  if(a==='dan'){p('M20 250C20 216 34 200 52 194L60 250Z',P.c2,null,0,.45);p('M180 250C180 216 166 200 148 194L140 250Z',P.c2,null,0,.45)}
  /* collar + tie / bow */
  p('M76 186L100 214L124 186L132 192L100 232L68 192Z','#ffffff',P.c2,1.2,a==='dan'?0:1);
  if(g==='m'){p('M92 200L108 200L112 232L100 246L88 232Z',P.ac,P.hd,1.2);p('M92 200L108 200L106 208L94 208Z',P.hd,null,0,.5)}
  else{p('M100 206C86 190 74 196 76 210C78 222 92 218 100 208C108 218 122 222 124 210C126 196 114 190 100 206Z',P.ac,P.hd,1.2);c(100,207,5,P.hd);p('M100 212L90 232M100 212L110 232',null,P.ac,6)}
  if(a==='sweet'&&!M)heart(150,214,8,P.ac,.95);
  if(a==='kuu')p('M148 214l0 12M142 220l12 0M144 216l8 8M152 216l-8 8',null,'#ffffff',2);
  /* ears + face */
  const fp=M?'M49 96C49 56 74 42 100 42C126 42 151 56 151 96L151 124C150 142 140 160 124 170L100 176L76 170C60 160 50 142 49 124Z':'M50 102C50 62 76 46 100 46C124 46 150 62 150 102C150 134 130 166 100 172C70 166 50 134 50 102Z';
  c(50,118,M?9.5:8,sk,sd,1.2);c(150,118,M?9.5:8,sk,sd,1.2);
  p(fp,RG(100,100,80,[[0,'#fff3e8'],[.6,sk],[1,sd]]),sd,1.3);
  p('M62 148C70 162 86 170 100 170C114 170 130 162 138 148C128 158 112 164 100 164C88 164 72 158 62 148Z',s2,null,0,.28);
  if(M){p('M52 126C56 150 72 168 100 174C128 168 144 150 148 126C140 152 122 164 100 168C78 164 60 152 52 126Z',s2,null,0,.34);p('M88 160Q100 166 112 160',null,s2,1.4,.5)}
  /* cheeks */
  if(E.b||v===5||v===6){const k=(v===5?.8:E.b>=1?.62:.36)*(M?.5:1);el(64,136,14,7.5,RG(64,136,14,[[0,'#ff6b9a',k],[1,'#ff6b9a',0]]));el(136,136,14,7.5,RG(136,136,14,[[0,'#ff6b9a',k],[1,'#ff6b9a',0]]))}
  /* eyes */
  const EP=(cx,cy,d,cm)=>cm.map(m=>m[0]+m.slice(1).map((v,j)=>j%2===0?Math.round((cx+d*v)*10)/10:Math.round((cy+v*ys)*10)/10).join(' ')).join('')+(cm.some(m=>m[0]==='Z')?'':'');
  const eyeAt=(cx,d)=>{const cy=114;const lid=(m)=>{let L;if(m==='ang')L=[[-17,-26],[17,-26],[17,-14.5],[-17,-1.5]];else if(m==='sad')L=[[-17,-26],[17,-26],[17,-1.5],[-17,-14.5]];else if(m==='half')L=[[-17,-26],[17,-26],[17,-3],[-17,-3]];if(!L)return;
     p('M'+L.map(q=>`${cx+d*q[0]} ${cy+q[1]*ys}`).join('L')+'Z',sk,null,0,1,'e');
     const l=m==='ang'?[[-14,-2],[15,-14]]:m==='sad'?[[-14,-14],[15,-2]]:[[-15,-3],[15,-3]];p(`M${cx+d*l[0][0]} ${cy+l[0][1]*ys}L${cx+d*l[1][0]} ${cy+l[1][1]*ys}`,null,ink,3.4,1,'e')};
   const shape=EP(cx,cy,d,[['M',-14,2],['C',-11,-14,7,-18,15,-3],['C',10,13,-4,17,-14,2],['Z']]);
   const lash=()=>{if(M){p(EP(cx,cy,d,[['M',-14,2],['C',-11,-14,7,-18,15,-3]]),null,ink,4.6,1,'e');return}p(EP(cx,cy,d,[['M',-14,2],['C',-11,-14,7,-18,15,-3]]),null,ink,3.8,1,'e');p(EP(cx,cy,d,[['M',15,-3],['L',21,-9]]),null,ink,3,1,'e');p(EP(cx,cy,d,[['M',-13,4],['C',-6,17,6,16,14,3]]),null,ink,1.2,.7,'e')};
   const ek=(v===1&&d===1||v===6)&&!['angry','sad','hollow'].includes(E.e)?'happy':E.e;
   switch(ek){
    case 'happy':p(EP(cx,cy,d,[['M',-14,4],['Q',0,-16,15,3]]),null,ink,4,1,'e');p(EP(cx,cy,d,[['M',15,3],['L',20,-2]]),null,ink,3,1,'e');return;
    case 'love':case 'open':case 'half':case 'angry':case 'sad':case 'shy':{
     p(shape,'#fffdfb',null,0,1,'e');
     const irx=(E.e==='shy'?8.4:10.6)*(M?.92:1),iry=(E.e==='shy'?10.6:13.2)*ys;
     el(cx+gx-d*.5,cy+1.5*ys,irx,iry,LG(0,cy-14*ys,0,cy+16*ys,[[0,P.ek],[.5,P.eye],[1,P.el]]),P.ek,1.2,1,'e');
     if(E.e==='love')heart(cx+gx-d*.5,cy+2*ys,6.2,'#ff3d7f',1,'e');else el(cx+gx-d*.5,cy+2*ys,4.6,(E.e==='shy'?6.2:6)*ys,'#1b0a14',null,0,1,'e');
     el(cx+gx-d*4.6,cy-5.5*ys,3.9,4.7*ys,'#fff',null,0,1,'e');c(cx+gx+d*4,cy+7.5*ys,2,'#fff',null,0,.92,'e');
     if(E.e==='sad'||E.e==='love')c(cx+gx+d*5,cy-6,1.4,'#fff',null,0,.9,'e');
     lash();lid(E.e==='angry'?'ang':E.e==='sad'?'sad':E.e==='half'?'half':null);
     if(E.e==='sad'&&E.tear)p(EP(cx,cy,d,[['M',-12,7],['C',-6,16,6,15,13,5]]),null,'#9bd8ff',2.2,.9,'e');
     return}
    case 'hollow':
     p(shape,'#fffdfb',null,0,1,'e');el(cx+gx,cy+1,11.5,14*ys,LG(0,cy-14*ys,0,cy+16*ys,[[0,'#2a0614'],[.55,P.ek],[1,P.eye]]),P.ek,1.2,1,'e');
     c(cx+gx,cy+1,8,null,P.el,1,.55,'e');c(cx+gx,cy+1,4.2,null,P.el,1,.5,'e');c(cx+gx,cy+1,2.6,'#0c0208',null,0,1,'e');lash();return}};
  eyeAt(74,-1);eyeAt(126,1);
  /* brows */
  const brow=(cx,d)=>{const w=M?5.6:3,y=cy0+(M?5:0);const B={n:[[-12,-27],[0,-32],[14,-27]],up:[[-12,-30],[0,-36],[14,-30]],flat:[[-13,-27],[0,-28],[14,-27]],ang:[[-14,-23],[2,-31],[15,-34]],sad:[[-14,-33],[2,-30],[15,-24]]}[E.br||'n'];
   p(`M${cx+d*B[0][0]} ${y+B[0][1]}Q${cx+d*B[1][0]} ${y+B[1][1]} ${cx+d*B[2][0]} ${y+B[2][1]}`,null,a==='yan'?'#c27ab4':P.hd,w,1)},cy0=114;
  brow(74,-1);brow(126,1);
  /* shade across the eyes (yandere) */
  if(E.shade)p('M56 92C80 84 120 84 144 92L142 128C120 134 80 134 58 128Z','#2a0010',null,0,E.shade===2?.55:.34);
  /* nose + mouth */
  if(M){p('M96 124Q95 136 100 137Q106 136 104 131',null,s2,1.8,.85);p('M108 124Q110 130 106 133',null,s2,1,.35)}else p('M99 131Q100 134 102 132',null,s2,1.6,.9);
  const MT={smile:()=>p('M87 143Q100 157 113 143',null,ink,2.8),open:()=>{p('M85 140Q100 170 115 140Z','#9c2646',ink,2.4);p('M88 141H112Q100 148 88 141Z','#fff');el(100,157,9,5,'#ff8fa8')},flat:()=>p('M90 148H110',null,ink,2.8),frown:()=>p('M88 152Q100 141 112 152',null,ink,2.8),pout:()=>p('M91 147Q95.5 142 100 147Q104.5 142 109 147',null,ink,2.6),tiny:()=>p('M94 147Q100 152 106 147',null,ink,2.6),wide:()=>{p('M80 139Q100 170 120 139Z','#ffffff',P.eye,3);p('M86 150Q100 160 114 150',null,'#e8c4cc',1.6)},o:()=>el(100,150,5.5,7,'#9c2646',ink,2.2),shout:()=>{el(100,152,11,13,'#9c2646',ink,2.6);p('M92 142H108Q100 148 92 142Z','#fff');el(100,160,7,4,'#ff8fa8')}};
  MT.talk=()=>{p('M91 142Q100 160 109 142Z','#9c2646',ink,2.2);el(100,153,6,3.2,'#ff8fa8')};MT.wob=()=>p('M88 148Q92 143 96 148Q100 153 104 148Q108 143 112 148',null,ink,2.6);MT.sm=()=>{p('M88 149Q102 153 114 141',null,ink,2.8);p('M116 140l3-3',null,ink,1.6)};
  const soft=['smile','tiny','flat','pout','frown'].includes(E.m);
  (v===6&&soft?MT.wide:v===5&&soft?MT.wob:v===4&&['smile','tiny','pout','flat'].includes(E.m)?MT.sm:v===8&&soft?MT.talk:MT[E.m])();
  if(E.tear){const tl=(x)=>{p(`M${x} 134C${x-6} 144 ${x-5} 152 ${x} 152C${x+5} 152 ${x+6} 144 ${x} 134Z`,'#bfe6ff','#7fc4f0',1.2,.92)};tl(70);tl(130);if(E.tear===2){p('M66 128V158M134 128V158',null,'#bfe6ff',3,.6)}}
  if(E.sweat||v===5)p('M158 70C168 86 166 98 158 98C150 98 148 86 158 70Z','#bfe6ff','#7fc4f0',1.4);
  /* front hair */
  const FG=LG(0,24,0,130,[[0,P.hl],[.35,P.hair],[1,P.hd]]);
  if(M){const MH={
   sweet:'M47 106C37 48 68 18 100 18C134 18 163 48 153 106C152 92 149 84 144 76L136 88L130 70L118 86L106 66L94 84L82 68L72 86L62 74C54 84 50 94 47 106Z',
   tsun:'M47 102C38 46 66 18 100 16C134 18 162 46 153 102C151 88 149 80 143 72L134 86L124 68L112 84L100 66L88 84L76 68L66 86L57 72C51 82 49 92 47 102Z',
   yan:'M46 110C35 50 66 20 100 20C134 20 165 50 154 110C152 96 149 88 142 82L133 90L123 74L111 88L100 72L89 88L77 74L67 90L58 82C51 92 48 100 46 110Z',
   dan:'M46 108C36 50 66 20 102 20C138 22 164 50 154 108C152 94 148 84 140 76L134 92L124 76L114 94L100 80L88 96L76 88L66 98C58 100 52 102 46 108Z',
   ace:'M47 102C38 46 66 18 100 16C134 18 162 46 153 102C151 88 149 80 143 72L134 86L124 68L112 84L100 66L88 84L76 68L66 86L57 72C51 82 49 92 47 102Z',
   kuu:'M48 102C40 48 68 20 100 20C132 20 160 48 152 102C150 86 148 74 140 64L132 74L124 58L112 70L100 54L88 68L76 58L66 70L58 64C52 74 50 88 48 102Z'}[a];
   if(a==='tsun'||a==='ace')p('M58 42L50 12L76 28L84 4L102 26L120 4L124 28L150 12L142 42Z',FG,P.hd,1.4);
   p(MH,FG,P.hd,1.4,1,'sw');p('M60 52C76 36 124 36 140 52',null,P.hl,5,.5,'sw');if(a==='kuu')p('M96 26C98 40 106 50 112 58',null,P.hd,1.4,.6)}
  else if(fr==='center'){const L='M100 32C66 30 40 56 48 112C54 96 60 92 68 104C72 80 84 66 98 54C99 46 100 40 100 32Z';both(L,FG,P.hd,1.4,1,'sw');if(g==='m'){p('M50 96C44 60 56 40 70 34L76 54L88 30L100 50L112 28L124 52L136 32L130 56L150 40C158 66 154 84 150 100C146 88 140 76 130 70L112 86L100 72L88 86L72 76C60 82 54 90 50 96Z',FG,P.hd,1.4)}}
  else if(fr==='blunt')p('M49 106C38 54 66 30 100 30C134 30 162 54 151 106L149 88Q142 96 134 90Q126 98 116 91Q108 97 100 92Q92 97 84 91Q74 98 66 90Q58 96 52 88Z',FG,P.hd,1.4,1,'sw');
  else if(fr==='side')p('M50 108C42 56 68 30 100 30C134 30 158 56 150 108C146 88 138 74 126 68C112 80 92 86 76 88C66 90 58 98 54 112C51 112 50 110 50 108Z',FG,P.hd,1.4,1,'sw');
  else p('M50 108C42 56 70 28 104 30C138 32 160 58 150 108C146 86 136 74 120 70C104 84 78 78 58 92C54 98 52 102 50 108Z',FG,P.hd,1.4,1,'sw');
  /* long side locks + strands + shine */
  if(bk==='L'||bk==='B'){const SL=bk==='L'?'M52 70C42 110 46 180 34 212C48 202 57 170 57 126C56 112 55 96 52 70Z':'M50 98C44 124 48 148 45 164C54 160 56 144 56 122C55 110 53 104 50 98Z';both(SL,FG,P.hd,1.4,1,'sw')}
  p('M64 54C80 38 120 38 136 54',null,P.hl,6,.5,'sw');
  p('M82 48C76 62 74 74 72 86M118 48C124 62 126 74 128 86M100 40C98 52 98 60 100 70',null,P.hd,1.2,.38);
  /* accessories */
  if(a==='sweet'){p('M100 34C92 6 126 -2 118 22',null,P.hair,4.2,1,'sw');if(!M){heart(130,50,9,P.ac,1);heart(130,50,3.4,'#fff',.6)}}
  if(a==='tsun'&&!M){const bow=(x,y)=>{p(`M${x} ${y}C${x-18} ${y-14} ${x-20} ${y+12} ${x} ${y}C${x+18} ${y-14} ${x+20} ${y+12} ${x} ${y}Z`,P.ac,'#8a1a17',1.4);c(x,y,4.2,'#ff8a80','#8a1a17',1)};if(bk==='T'){bow(56,56);bow(144,56)}else if(bk==='P')bow(144,54);else p('M52 70Q100 40 148 70L148 78Q100 50 52 78Z',P.ac,'#8a1a17',1.2)}
  if(a==='yan'){p('M128 44L152 74',null,'#ff2d6f',5);c(128,44,6,'#ff2d6f','#8a0a2a',1.2);heart(138,60,5,'#ff2d6f',1)}
  if(a==='dan'&&!M){star(126,52,8,'#fff',1);star(144,64,5.5,'#ffe27a',1);c(60,64,3,'#fff',P.hd,1)}
  if(a==='kuu'){p('M138 56l0 18M129 65l18 0M131.5 58.5l13 13M144.5 58.5l-13 13',null,'#ffffff',3,1);c(138,65,2.4,'#9fd4f5')}
  if(a==='moon'){p('M142 48C122 50 118 76 140 84C128 72 130 58 142 48Z','#f2c14e','#b38a1c',1.2);star(150,62,5,'#ffe9a8',1);star(44,70,3.5,'#ffe9a8',1)}
  if(a==='ace'){p('M48 64Q100 40 152 64L152 76Q100 52 48 76Z','#ffffff','#c9c9c9',1.2);c(100,52,5.5,'#e53935','#8a1a17',1);if(!M||1)p('M122 140l15-7l3 6l-15 7Z','#ffe1b8','#c89a6a',1)}
  if(a==='ink'){c(74,114,20,null,'#7a5230',3.6);c(126,114,20,null,'#7a5230',3.6);p('M93 112Q100 105 107 112',null,'#7a5230',3.2);p('M54 112L47 106M146 112L153 106',null,'#7a5230',3);p('M62 104l7-5M114 104l7-5',null,'#ffffff',2.2,.7);p('M150 84L162 58',null,'#e8b04a',5);p('M162 58l2-6',null,'#3b2a14',3)}
  if(E.vein)p('M146 38Q154 38 154 46M168 38Q160 38 160 46M146 58Q154 58 154 50M168 58Q160 58 160 50',null,'#e03131',3.6,1);
  if(E.sp){heart(172,96,6,'#ff7aa8',.9,'tw');heart(28,100,4.5,'#ff7aa8',.8,'tw')}
  return o}
 const fmt=n=>Math.round(n*10)/10;let gid=0;
 function svg(a,g,i,cls,label){const n=++gid,defs=[];const fillOf=(f,k)=>{if(!f)return 'none';if(typeof f==='string')return f;const id=`ag${n}_${k}`;defs.push(f.t==='l'?`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f.a[0]}" y1="${f.a[1]}" x2="${f.a[2]}" y2="${f.a[3]}">${f.s.map(q=>`<stop offset="${q[0]}" stop-color="${q[1]}"${q[2]!=null?` stop-opacity="${q[2]}"`:''}/>`).join('')}</linearGradient>`:`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f.a[0]}" cy="${f.a[1]}" r="${f.a[2]}">${f.s.map(q=>`<stop offset="${q[0]}" stop-color="${q[1]}"${q[2]!=null?` stop-opacity="${q[2]}"`:''}/>`).join('')}</radialGradient>`);return `url(#${id})`};
  const body=shapes(a,g,i).map((s,k)=>{const at=` fill="${fillOf(s.f,k)}"${s.s?` stroke="${s.s}" stroke-width="${s.w||1}" stroke-linecap="round" stroke-linejoin="round"`:''}${s.o!=null&&s.o!==1?` opacity="${s.o}"`:''}${s.g?` class="${s.g}"`:''}`;
   if(s.k==='p')return `<path d="${s.d}"${at}/>`;if(s.k==='c')return `<circle cx="${s.x}" cy="${s.y}" r="${s.r}"${at}/>`;return `<ellipse cx="${s.x}" cy="${s.y}" rx="${s.rx}" ry="${s.ry}"${at}/>`}).join('');
  return `<svg viewBox="0 0 200 250" class="${cls||''}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label||'Portrait')}"><defs>${defs.join('')}</defs>${body}</svg>`}
 const rgba=(h,o)=>{h=h.replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${o==null?1:o})`};
 function paint(c,a,g,i,x,y,sc){c.save();c.translate(x,y);c.scale(sc,sc);c.lineCap='round';c.lineJoin='round';
  const fl=f=>{if(!f)return null;if(typeof f==='string')return f;const G=f.t==='l'?c.createLinearGradient(...f.a):c.createRadialGradient(f.a[0],f.a[1],0,f.a[0],f.a[1],f.a[2]);f.s.forEach(q=>G.addColorStop(q[0],q[2]!=null?rgba(q[1],q[2]):q[1]));return G};
  shapes(a,g,i).forEach(s=>{c.globalAlpha=s.o==null?1:s.o;const F=fl(s.f);c.beginPath();
   if(s.k==='p'){const P=new Path2D(s.d);if(F){c.fillStyle=F;c.fill(P)}if(s.s){c.strokeStyle=s.s;c.lineWidth=s.w||1;c.stroke(P)}return}
   if(s.k==='c')c.arc(s.x,s.y,s.r,0,7);else c.ellipse(s.x,s.y,s.rx,s.ry,0,0,7);
   if(F){c.fillStyle=F;c.fill()}if(s.s){c.strokeStyle=s.s;c.lineWidth=s.w||1;c.stroke()}});c.restore()}
