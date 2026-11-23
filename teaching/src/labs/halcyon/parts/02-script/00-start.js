
/* ============ game catalogue and card art ============ */
var GAMES=[
{id:"port-halcyon",file:"games/port-halcyon.html",name:"Port Halcyon",tag:"Accessibility",c:"#e8a73a",nod:"Nods to Papers, Please",
 desc:"Work as a berth inspector. Check each interface against the rulebook, cite the faults and stamp the berth before the shift clock runs out.",
 art:`<svg viewBox="0 0 400 230" role="img" aria-label="Lighthouse, inspection form and a red DENIED stamp"><defs><pattern id="phg" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#b7c5bd" stroke-width="1"/></pattern></defs>
<rect width="400" height="230" fill="#e2e4d2"/><rect width="400" height="230" fill="url(#phg)"/>
<rect x="168" y="14" width="224" height="130" fill="#f0b34a" opacity=".16"/>
<path d="M94 61 L190 30 L190 94Z" fill="#f0b34a" opacity=".35"/>
<rect x="6" y="168" width="388" height="56" fill="#12303a"/><path d="M6 186H394M6 204H394" stroke="#e2e4d2" stroke-width="3" stroke-dasharray="2 9" opacity=".35"/>
<path d="M60 168 L71 74 H93 L104 168Z" fill="#12303a"/><path d="M66 126H98L100 142H64Z M68 94H96L97.5 108H66.5Z" fill="#c8452d"/><rect x="69" y="54" width="26" height="20" fill="#f0b34a" class="blink"/><path d="M65 54 L82 36 L99 54Z" fill="#12303a"/>
<path d="M118 176h54l-8 11h-38z" fill="#e2e4d2"/><rect x="138" y="160" width="16" height="16" fill="#e2e4d2"/><rect x="151" y="150" width="4" height="26" fill="#c8452d"/>
<g transform="rotate(-4 300 90)"><rect x="228" y="30" width="146" height="118" fill="#f7f5e7" stroke="#12303a" stroke-width="2.5"/><rect x="238" y="42" width="36" height="38" fill="#9fb8b7" stroke="#12303a" stroke-width="1.5"/><circle cx="256" cy="55" r="7" fill="#12303a"/><path d="M243 78q13-20 26 0Z" fill="#12303a"/><rect x="284" y="44" width="78" height="7" fill="#12303a"/><rect x="284" y="58" width="54" height="5" fill="#12303a" opacity=".45"/><rect x="284" y="68" width="66" height="5" fill="#12303a" opacity=".45"/><text x="238" y="106" class="mono" font-size="10" font-weight="700" fill="#12303a">CONTRAST 2.1 : 1</text><text x="238" y="122" class="mono" font-size="10" font-weight="700" fill="#c8452d">NEEDS 4.5 : 1</text><rect x="238" y="130" width="124" height="3" fill="#12303a" opacity=".3"/></g>
<g transform="rotate(-10 330 150)"><rect x="282" y="132" width="102" height="38" rx="3" fill="#e2e4d2" fill-opacity=".55" stroke="#c8452d" stroke-width="4"/><text x="333" y="162" text-anchor="middle" class="bs" font-size="30" font-weight="800" fill="#c8452d" letter-spacing="2">DENIED</text></g>
<rect x="6" y="6" width="388" height="218" fill="none" stroke="#12303a" stroke-width="3"/></svg>`},

{id:"pipeline-factory",file:"games/pipeline-factory.html",name:"Pipeline Factory",tag:"CPU design",c:"#f09040",nod:"Assembly-line sim",
 desc:"Keep five pipeline stages busy. Every bubble and stall costs throughput, so dodge hazards and forward results in time.",
 art:`<svg viewBox="0 0 400 230" role="img" aria-label="Five-stage pipeline with a stalled bubble on a conveyor"><defs><pattern id="pfh" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="20" fill="#e9b72f"/><rect x="10" width="10" height="20" fill="#0a1522"/></pattern><clipPath id="pfc"><rect x="0" y="136" width="400" height="14"/></clipPath></defs>
<rect width="400" height="230" fill="#0a1522"/><rect width="400" height="10" fill="url(#pfh)"/><rect y="220" width="400" height="10" fill="url(#pfh)"/>
<g fill="none" stroke="#17304a" stroke-width="1"><path d="M0 40H400M0 70H400M0 100H400"/></g>
<g class="bc" font-weight="700" font-size="14" text-anchor="middle">
<g><rect x="16" y="34" width="62" height="64" fill="#10233a" stroke="#f09040" stroke-width="2"/><text x="47" y="52" fill="#f09040">IF</text><rect x="26" y="62" width="42" height="22" fill="#f09040"/><text x="47" y="78" fill="#0a1522" class="mono" font-size="10">ADD</text></g>
<g><rect x="90" y="34" width="62" height="64" fill="#10233a" stroke="#f09040" stroke-width="2"/><text x="121" y="52" fill="#f09040">ID</text><rect x="100" y="62" width="42" height="22" fill="#4aa3ff"/><text x="121" y="78" fill="#0a1522" class="mono" font-size="10">LW</text></g>
<g><rect x="164" y="34" width="62" height="64" fill="none" stroke="#e24b4b" stroke-width="2" stroke-dasharray="5 4"/><text x="195" y="52" fill="#e24b4b">EX</text><text x="195" y="78" fill="#e24b4b" class="mono" font-size="10">BUBBLE</text></g>
<g><rect x="238" y="34" width="62" height="64" fill="#10233a" stroke="#f09040" stroke-width="2"/><text x="269" y="52" fill="#f09040">MEM</text><rect x="248" y="62" width="42" height="22" fill="#7be08a"/><text x="269" y="78" fill="#0a1522" class="mono" font-size="10">SUB</text></g>
<g><rect x="312" y="34" width="62" height="64" fill="#10233a" stroke="#f09040" stroke-width="2"/><text x="343" y="52" fill="#f09040">WB</text><rect x="322" y="62" width="42" height="22" fill="#f09040" opacity=".5"/><text x="343" y="78" fill="#0a1522" class="mono" font-size="10">ADD</text></g></g>
<path d="M269 98 V118 H195 V98" fill="none" stroke="#4aa3ff" stroke-width="3" stroke-dasharray="6 5" class="flow"/><path d="M190 104 L195 97 L200 104" fill="#4aa3ff"/><text x="232" y="132" text-anchor="middle" class="mono" font-size="9" fill="#4aa3ff">FORWARD</text>
<rect y="136" width="400" height="14" fill="#16283d"/><path d="M0 143H400" stroke="#f09040" stroke-width="2" stroke-dasharray="10 10" class="flow" opacity=".7"/>
<g clip-path="url(#pfc)"><g class="belt"><rect x="-70" y="137" width="14" height="12" fill="#c9a24a"/><rect x="4" y="137" width="14" height="12" fill="#c9a24a"/><rect x="78" y="137" width="14" height="12" fill="#c9a24a"/><rect x="152" y="137" width="14" height="12" fill="#c9a24a"/><rect x="226" y="137" width="14" height="12" fill="#c9a24a"/><rect x="300" y="137" width="14" height="12" fill="#c9a24a"/></g></g>
<text x="18" y="196" class="bc" font-size="44" font-weight="700" fill="#f09040">IPC 0.80</text>
<text x="18" y="212" class="mono" font-size="10" fill="#7a93ad" letter-spacing="2">STALLS 1 · FLUSHES 0</text>
<path d="M300 210 Q300 168 338 168 Q376 168 376 210Z" fill="#f2c230"/><rect x="292" y="204" width="92" height="8" rx="2" fill="#e0ab1d"/><rect x="334" y="164" width="8" height="38" fill="#e0ab1d" opacity=".6"/></svg>`},

{id:"relay-7",file:"games/relay-7.html",name:"Halcyon Relay 7",tag:"Electronics",c:"#28c9b9",nod:"Nods to Keep Talking and Nobody Explodes",
 desc:"Keep a colony ship's power bus alive. Wire resistors, LEDs and fuses, read the scope and hold the needle in the band before dawn shift.",
 art:`<svg viewBox="0 0 400 230" role="img" aria-label="Countdown timer, cut wires, a power gauge and a scope trace"><rect width="400" height="230" fill="#070d0f"/>
<g fill="#cfe9e5" opacity=".5"><circle cx="40" cy="12" r="1"/><circle cx="120" cy="8" r="1"/><circle cx="260" cy="14" r="1.2"/><circle cx="340" cy="9" r="1"/><circle cx="388" cy="22" r="1"/></g>
<rect x="14" y="16" width="372" height="34" rx="17" fill="#0d1a1c" stroke="#25443f" stroke-width="2"/><rect x="40" y="26" width="26" height="14" rx="3" fill="#f0b34a"/><rect x="76" y="26" width="26" height="14" rx="3" fill="#f0b34a" class="blink2"/><rect x="112" y="26" width="26" height="14" rx="3" fill="#f0b34a"/><text x="372" y="38" text-anchor="end" class="mono" font-size="10" fill="#4d7f78" letter-spacing="2">RELAY 7 · REV C</text>
<rect x="14" y="66" width="172" height="76" rx="6" fill="#0a1416" stroke="#f0883a" stroke-width="2"/><rect x="14" y="66" width="172" height="76" rx="6" fill="none" stroke="#f0883a" stroke-width="8" opacity=".12"/>
<text x="100" y="116" text-anchor="middle" class="mono" font-size="46" font-weight="700" fill="#28c9b9">01:30</text><text x="100" y="134" text-anchor="middle" class="mono" font-size="8.5" fill="#4d7f78" letter-spacing="2">TIME TO DAWN SHIFT</text>
<g fill="none" stroke-width="5" stroke-linecap="round"><path d="M38 142 C38 175 22 185 22 212" stroke="#e24b4b"/><path d="M74 142 C74 170 70 185 70 212" stroke="#4aa3ff"/><path d="M118 142 C118 160 118 168 118 172" stroke="#f2c230"/><path d="M118 184 C118 195 140 200 140 212" stroke="#f2c230"/></g>
<g class="sp" stroke="#fff3b0" stroke-width="2" stroke-linecap="round"><path d="M110 178H126M118 170V186M111 172L125 184M125 172L111 184"/></g>
<g fill="#16302d" stroke="#4d7f78"><circle cx="22" cy="214" r="5"/><circle cx="70" cy="214" r="5"/><circle cx="140" cy="214" r="5"/></g>
<path d="M228 150 A62 62 0 0 1 352 150" fill="none" stroke="#1c2d2f" stroke-width="12"/><path d="M262 98 A62 62 0 0 1 306 98" fill="none" stroke="#28c9b9" stroke-width="12" opacity="0"/><path d="M237.5 118 A62 62 0 0 1 290 88" fill="none" stroke="#2b4a46" stroke-width="12"/><path d="M290 88 A62 62 0 0 1 335 108" fill="none" stroke="#28c9b9" stroke-width="12"/><path d="M335 108 A62 62 0 0 1 352 150" fill="none" stroke="#a82d2d" stroke-width="12"/>
<g class="needle"><path d="M290 150L290 98" stroke="#f0883a" stroke-width="3" stroke-linecap="round"/></g><circle cx="290" cy="150" r="7" fill="#f0883a"/>
<text x="290" y="180" text-anchor="middle" class="mono" font-size="16" font-weight="700" fill="#f0883a">22.4 W</text><text x="290" y="194" text-anchor="middle" class="mono" font-size="8" fill="#4d7f78" letter-spacing="1.5">BAND 15–30 W</text>
<path d="M196 214 q10 -16 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#28c9b9" stroke-width="2" class="flow" opacity=".8"/>
<text x="386" y="226" text-anchor="end" class="mono" font-size="9" fill="#f0883a">R1 10 Ω</text></svg>`},

{id:"pathfinders-keep",file:"games/pathfinders-keep.html",name:"Pathfinder’s Keep",tag:"Algorithms",c:"#e6b84d",nod:"Nods to classic tower defense",
 desc:"A tower defense where packets take the cheapest route. Reshape the costs and trap them, then compare Dijkstra with A*.",
 art:`<svg viewBox="0 0 400 230" role="img" aria-label="Tile map with costed tiles, a glowing route, a portal, a tower and a keep"><defs><linearGradient id="pkb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241a44"/><stop offset="1" stop-color="#150f2b"/></linearGradient><radialGradient id="pkg"><stop offset="0" stop-color="#b9a6ff"/><stop offset="1" stop-color="#5b3fb0" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="230" fill="url(#pkb)"/>
${(function(){var s='',cost=[[1,4,1,1,1,4,1,3],[1,1,4,3,1,1,4,1],[1,1,1,1,4,3,1,1],[4,1,1,3,1,1,4,1]],kind=[[0,1,0,0,0,1,0,2],[0,0,1,2,0,0,1,0],[0,0,0,0,1,2,0,0],[1,0,0,2,0,0,1,0]];for(var r=0;r<4;r++)for(var c=0;c<8;c++){var x=16+c*46,y=14+r*46,f=kind[r][c]==1?'#1f5a52':kind[r][c]==2?'#1d4a7a':'#3a2a5c';s+='<rect x="'+x+'" y="'+y+'" width="42" height="42" rx="3" fill="'+f+'" stroke="#5a4690" stroke-width="1"/><circle cx="'+(x+9)+'" cy="'+(y+9)+'" r="7" fill="#150f2b"/><text x="'+(x+9)+'" y="'+(y+12.5)+'" text-anchor="middle" class="mono" font-size="9" font-weight="700" fill="#e6b84d">'+cost[r][c]+'</text>'}return s})()}
<path d="M37 107 H129 V61 H221 V107 H313 V61 H359" fill="none" stroke="#5de0d0" stroke-width="12" stroke-linejoin="round" opacity=".18"/><path d="M37 107 H129 V61 H221 V107 H313 V61 H359" fill="none" stroke="#5de0d0" stroke-width="4" stroke-linejoin="round" class="flow"/>
<circle cx="37" cy="107" r="19" fill="url(#pkg)" class="pulse"/><circle cx="37" cy="107" r="11" fill="none" stroke="#b9a6ff" stroke-width="3"/><circle cx="37" cy="107" r="5" fill="#150f2b"/>
<circle cx="76" cy="107" r="5.5" fill="#ff6b8a"/><circle cx="175" cy="84" r="5.5" fill="#ff6b8a"/><circle cx="262" cy="107" r="5.5" fill="#ff6b8a"/>
<path d="M205 148 l-6 12 h12z M217 148 l-6 12 h12z" fill="#d94a4a" transform="translate(-60 -46)"/>
<g transform="translate(176 152)"><circle r="40" fill="#e6b84d" opacity=".07" stroke="#e6b84d" stroke-dasharray="4 5" stroke-width="1.5"/><circle r="13" fill="#1c3f4a" stroke="#e6b84d" stroke-width="2.5"/><path d="M0-7 L2 -2 H7 L3 1 5 6 0 3 -5 6 -3 1 -7 -2 -2 -2Z" fill="#5de0d0"/></g>
<g transform="translate(359 61)"><rect x="-17" y="-8" width="34" height="30" fill="#6a5a8c" stroke="#e6b84d" stroke-width="2"/><path d="M-17 -8V-16H-11V-12H-3V-16H3V-12H11V-16H17V-8Z" fill="#6a5a8c" stroke="#e6b84d" stroke-width="2"/><path d="M0 -16V-30" stroke="#e6b84d" stroke-width="2"/><path d="M0 -30L12 -25 0 -20Z" fill="#d94a4a"/><rect x="-4" y="6" width="8" height="16" rx="4" fill="#150f2b"/></g>
<g transform="translate(272 205)"><rect width="112" height="20" rx="3" fill="#150f2b" stroke="#e6b84d" stroke-width="1.5"/><text x="56" y="14" text-anchor="middle" class="cz" font-size="11" font-weight="600" fill="#e6b84d">WAVE 7 / 20 · A*</text></g>
<rect x="3" y="3" width="394" height="224" fill="none" stroke="#e6b84d" stroke-width="3" rx="4"/></svg>`},

{id:"proof-lab",file:"games/proof-lab.html",name:"The Aperture Proof Lab",tag:"Logic",c:"#ff7a1a",nod:"Nods to Portal",
 desc:"Solve logic chambers to unseal each exit. Build the proof, avoid disposal, and wait politely for the promised cake.",
 art:`<svg viewBox="0 0 400 230" role="img" aria-label="Orange and blue portals joined by a logic gate, with a cake on a pedestal"><defs><radialGradient id="apb" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#2a323e"/><stop offset="1" stop-color="#11151b"/></radialGradient><radialGradient id="apo"><stop offset="0" stop-color="#ffb066" stop-opacity=".5"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient><radialGradient id="apl"><stop offset="0" stop-color="#7fdcff" stop-opacity=".5"/><stop offset="1" stop-color="#37c3f0" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="230" fill="url(#apb)"/>
<g stroke="#303946" stroke-width="2" fill="none"><path d="M0 60H400M0 130H400M100 0V60M200 0V60M300 0V60M50 60V130M150 60V130M250 60V130M350 60V130"/></g><rect y="196" width="400" height="34" fill="#0c1015"/><path d="M0 196H400" stroke="#3a4452" stroke-width="3"/>
<text x="200" y="26" text-anchor="middle" class="mono" font-size="11" letter-spacing="4" fill="#6b7a8c">CHAMBER 01 · EXIT SEALED</text>
<g class="pulse"><ellipse cx="62" cy="120" rx="34" ry="62" fill="url(#apo)"/></g><ellipse cx="62" cy="120" rx="20" ry="50" fill="#05070a" stroke="#ff7a1a" stroke-width="7"/><ellipse cx="62" cy="120" rx="20" ry="50" fill="none" stroke="#ffc58a" stroke-width="2" opacity=".6"/>
<g class="pulse"><ellipse cx="338" cy="120" rx="34" ry="62" fill="url(#apl)"/></g><ellipse cx="338" cy="120" rx="20" ry="50" fill="#05070a" stroke="#37c3f0" stroke-width="7"/><ellipse cx="338" cy="120" rx="20" ry="50" fill="none" stroke="#b9ecff" stroke-width="2" opacity=".6"/>
<g fill="none" stroke="#e8edf3" stroke-width="3" stroke-linecap="round"><path d="M158 100H190M158 134H190" /><path d="M190 86H206Q244 86 244 117T206 148H190Z" fill="#161c24"/><path d="M244 117H318"/></g>
<path d="M82 100H158" fill="none" stroke="#ff7a1a" stroke-width="3" class="flow"/><path d="M82 134H158" fill="none" stroke="#ff7a1a" stroke-width="3" class="flow"/><path d="M244 117H318" fill="none" stroke="#37c3f0" stroke-width="3" class="flow"/>
<text x="148" y="96" class="mono" font-size="12" font-weight="700" fill="#ff7a1a" text-anchor="middle">P</text><text x="148" y="152" class="mono" font-size="12" font-weight="700" fill="#ff7a1a" text-anchor="middle">Q</text><text x="214" y="122" class="mono" font-size="13" font-weight="700" fill="#e8edf3" text-anchor="middle">∧</text>
<g transform="translate(200 196)"><rect x="-26" y="-12" width="52" height="12" fill="#c98a55"/><rect x="-22" y="-26" width="44" height="14" fill="#f3d9b0"/><path d="M-22 -26 q5 7 11 0 t11 0 t11 0 t11 0" fill="#ff7aa8"/><rect x="-1.5" y="-38" width="3" height="12" fill="#e8edf3"/><path d="M0 -50 q5 7 0 12 q-5 -5 0 -12Z" fill="#ff7a1a" class="blink"/></g>
<text x="200" y="224" text-anchor="middle" class="mono" font-size="8.5" fill="#6b7a8c" letter-spacing="1">CAKE · TERMS AND CONDITIONS APPLY</text>
<g transform="translate(364 32)"><path d="M0-16 14-8 14 8 0 16-14 8-14-8Z" fill="none" stroke="#ff7a1a" stroke-width="3"/><path d="M0-9 8-4.5 8 4.5 0 9-8 4.5-8-4.5Z" fill="none" stroke="#37c3f0" stroke-width="2.5"/><circle r="3" fill="#ff7a1a"/></g></svg>`},

{id:"logic-engine",file:"games/logic-engine.html",name:"Code Translator & Logic Engine",tag:"Programming",c:"#e6b84d",nod:"Casino games as code lessons",
 desc:"Turn game rules into code. Predict outputs, order recipe steps, and learn JavaScript, Python or Java one table at a time.",
 art:`<svg viewBox="0 0 400 230" role="img" aria-label="Marquee frame with a playing card, a casino chip and code"><defs><radialGradient id="leb" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#0f3a2b"/><stop offset="1" stop-color="#06130e"/></radialGradient></defs>
<rect width="400" height="230" fill="url(#leb)"/>
<g stroke="#17402f" stroke-width="2" fill="none"><path d="M0 90H70V130H130M400 100H330V160H270M0 180H90M310 40V70H400"/></g><g fill="#17402f"><circle cx="70" cy="90" r="4"/><circle cx="330" cy="100" r="4"/><circle cx="90" cy="180" r="4"/></g>
<rect x="8" y="8" width="384" height="214" rx="10" fill="none" stroke="#e6b84d" stroke-width="2.5"/>
${(function(){var s='';for(var i=0;i<24;i++){var x=22+i*15.6;s+='<circle cx="'+x+'" cy="20" r="2.6" fill="#f6d77a" class="'+(i%2?'blink':'blink2')+'"/><circle cx="'+x+'" cy="210" r="2.6" fill="#f6d77a" class="'+(i%2?'blink2':'blink')+'"/>'}return s})()}
<text x="200" y="64" text-anchor="middle" class="lime" font-size="28" fill="#e6b84d" letter-spacing="3">LOGIC ENGINE</text>
<g transform="translate(24 84)"><rect width="150" height="106" rx="6" fill="#071b13" stroke="#1d5a42"/><g class="mono" font-size="11" font-weight="500"><text x="12" y="24" fill="#e6b84d">if</text><text x="26" y="24" fill="#e7efe9">(hand &gt; 21) {</text><text x="24" y="44" fill="#7be0a0">bust();</text><text x="12" y="64" fill="#e7efe9">}</text><text x="12" y="84" fill="#e6b84d">return</text><text x="58" y="84" fill="#ff8a8a">chips * 2;</text></g></g>
<g transform="translate(236 140) rotate(-12)"><rect x="-40" y="-52" width="80" height="108" rx="7" fill="#f4f1e6" stroke="#c9c2a8"/><text x="-31" y="-32" class="lime" font-size="18" fill="#12261d">A</text><g transform="translate(0 2) scale(1.9)" fill="#12261d"><path d="M0-14 C-14 0 -14 8 -6 8 C-3 8 -1 6 0 4 C-1 10 -3 13 -6 15 H6 C3 13 1 10 0 4 C1 6 3 8 6 8 C14 8 14 0 0 -14Z"/></g></g>
<g transform="translate(236 140) rotate(8) translate(-48 4)" opacity=".0"></g>
<g transform="translate(322 148)"><circle r="40" fill="#b8302f" stroke="#f4f1e6" stroke-width="3"/><g stroke="#f4f1e6" stroke-width="9" stroke-dasharray="14 28.3" fill="none"><circle r="35"/></g><circle r="26" fill="#8f2322" stroke="#f4f1e6" stroke-width="2"/><circle r="19" fill="none" stroke="#e6b84d" stroke-width="2" stroke-dasharray="3 3"/><text y="6" text-anchor="middle" class="lime" font-size="17" fill="#e6b84d">+1</text></g></svg>`}
];
var BADGE=GAMES.length;

/* ============ saved progress readers (each game keeps its own save in this origin) ============ */
function jget(k){try{var v=localStorage.getItem(k);return v==null?null:JSON.parse(v)}catch(e){return null}}
function lsKeys(){var o=[];try{for(var i=0;i<localStorage.length;i++)o.push(localStorage.key(i))}catch(e){}return o}
function sum(o){var t=0;if(o&&typeof o==='object')Object.keys(o).forEach(function(k){t+=(+o[k])||0});return t}
function snap(){
  var s={},life=jget('uxg.life')||{},tt=jget('uxg.titles');
  s.ph={ends:(jget('uxg.ends')||[]).length||0,runs:life.runs|0,quick:life.quick|0,ships:life.ships|0,right:life.right|0,careers:life.careers|0,titles:Array.isArray(tt)?tt.length:0,tl:Array.isArray(tt)?tt:[]};
  var pf={wins:0,shipped:0,fired:0,ach:0,s3:0,A:{}};
  lsKeys().forEach(function(k){if(k.indexOf('pipelineFactorySave')!==0)return;var v=jget(k);if(!v||typeof v!=='object')return;var st=v.stats||{};
    pf.wins=Math.max(pf.wins,st.wins|0,v.n|0);pf.shipped=Math.max(pf.shipped,st.shipped|0);pf.fired=Math.max(pf.fired,v.fired|0);
    pf.ach=Math.max(pf.ach,Object.keys(v.ach||{}).filter(function(a){return v.ach[a]}).length);
    Object.keys(v.ach||{}).forEach(function(a){if(v.ach[a])pf.A[a]=1});
    pf.s3=Math.max(pf.s3,Object.keys(v.stars||{}).filter(function(a){return v.stars[a]>=3}).length)});
  s.pf=pf;
  var sv=jget('hr7s')||{},ks=Object.keys(sv);
  s.hr={levels:ks.filter(function(k){return k[0]!=='d'}).length,daily:ks.filter(function(k){return k[0]==='d'}).length,
    stars:ks.reduce(function(a,k){return a+((sv[k]&&sv[k].stars)|0)},0),three:ks.filter(function(k){return sv[k]&&sv[k].stars>=3}).length};
  var p=jget('pk-save')||{};
  var pks=0;if(p.stars&&typeof p.stars==='object')pks=sum(p.stars);
  s.pk={wins:p.wins|0,shards:p.shards|0,xp:p.xp|0,stars:pks,trials:p.trials&&typeof p.trials==='object'?Object.keys(p.trials).length:0,cleared:Array.isArray(p.cleared)?p.cleared.length:0,ach:Array.isArray(p.ach)?p.ach:[],puzzles:p.puzzles&&typeof p.puzzles==='object'?Object.keys(p.puzzles).length:0};
  var a=jget('apl-save2')||{},cA=a.act||1,aA=a.acts||{},aU=0,aS=0;
  [1,2,3].forEach(function(n){var d=n===cA?a:(aA[n]||{});aU+=d.unlocked|0;aS+=Object.keys(d.best||{}).length});
  s.ap={streak:a.streak|0,unlocked:aU,total:a.total|0,solved:aS,badges:(a.stats&&a.stats.badges)||{}};
  var l=jget('logic-engine-v3')||{},pr=l.prog||{},done=0,langs=0,st2=0;
  Object.keys(pr).forEach(function(k){var c=(pr[k]&&pr[k].completed)||[];done+=c.length;if(c.length)langs++;st2+=sum(pr[k]&&pr[k].stars)});
  s.le={done:done,langs:langs,stars:st2,full:Object.keys(l.full||{}).length};
  return s;
}

/* ============ trophies ============ */
var TIER={bronze:{pts:10,v:'--bronze',n:'Bronze'},silver:{pts:25,v:'--silver',n:'Silver'},gold:{pts:50,v:'--gold',n:'Gold'}};
var A=[ /* per-game: [id, game, name, description, tier, value(s), goal] */
 ['ph1','port-halcyon','Stamp Happy','Process your first ship at the quay.','bronze',function(s){return s.ph.ships},1],
 ['ph2','port-halcyon','Eagle Eye','Cite 30 faults correctly.','silver',function(s){return s.ph.right},30],
 ['ph3','port-halcyon','Title Holder','Earn an inspector title.','silver',function(s){return s.ph.titles},1],
 ['pf3','pipeline-factory','Throughput','Ship 100 instructions cleanly.','silver',function(s){return s.pf.shipped},100],
 ['pf5','pipeline-factory','Union Rep','Unlock 5 of the game’s own achievements.','gold',function(s){return s.pf.ach},5],
 ['hr1','relay-7','First Light','Complete a relay mission.','bronze',function(s){return s.hr.levels},1],
 ['hr2','relay-7','Stay Frosty','Earn 3 stars on one mission.','silver',function(s){return s.hr.three},1],
 ['hr3','relay-7','Dawn Patrol','Complete the daily mission.','bronze',function(s){return s.hr.daily},1],
 ['hr4','relay-7','Bus Master','Collect 15 stars across missions.','gold',function(s){return s.hr.stars},15],
 ['pk2','pathfinders-keep','Path Finder','Clear 3 maps.','silver',function(s){return s.pk.cleared},3],
 ['pk3','pathfinders-keep','Puzzle Keeper','Solve 3 routing puzzles.','silver',function(s){return s.pk.puzzles},3],
 ['ap1','proof-lab','Test Subject','Open your first exit.','bronze',function(s){return s.ap.unlocked},1],
 ['ap2','proof-lab','Chamber Five','Unseal five chambers.','silver',function(s){return s.ap.unlocked},5],
 ['ap3','proof-lab','Cake Candidate','Earn 300 points in the lab.','silver',function(s){return s.ap.total},300],
 ['ap4','proof-lab','Chamber Ten','Unseal ten chambers.','gold',function(s){return s.ap.unlocked},10],
 ['le1','logic-engine','Hello, World','Finish your first lesson.','bronze',function(s){return s.le.done},1],
 ['le2','logic-engine','Five Lessons','Finish 5 lessons.','silver',function(s){return s.le.done},5],
 ['le3','logic-engine','Polyglot','Learn in two different languages.','silver',function(s){return s.le.langs},2],
 ['le4','logic-engine','Star Collector','Collect 30 stars.','silver',function(s){return s.le.stars},30],
 ['le5','logic-engine','High Roller','Finish 25 lessons.','gold',function(s){return s.le.done},25],
 ['le6','logic-engine','Master Key','Win your first full game by mastering a family of lessons.','silver',function(s){return s.le.full},1],
 ['le7','logic-engine','Arcade Regular','Win 10 different full games.','gold',function(s){return s.le.full},10],
 ['le8','logic-engine','Full House','Win 25 different full games.','gold',function(s){return s.le.full},25]
];

var OWN2=[
 ['hr5','relay-7','Mission Control','Complete 5 relay missions.','silver',function(s){return s.hr.levels},5],
 ['hr6','relay-7','Perfect Bus','Earn 3 stars on 3 different missions.','gold',function(s){return s.hr.three},3],
 ['ap5','proof-lab','Collector','Solve 12 chambers.','silver',function(s){return s.ap.solved},12],
 ['ap6','proof-lab','Twenty Chambers','Unseal twenty chambers.','gold',function(s){return s.ap.unlocked},20],
 ['ap7','proof-lab','Cake Owed','Earn 1000 points in the lab.','gold',function(s){return s.ap.total},1000],
 ['le6','logic-engine','Fifty Lessons','Finish 50 lessons.','silver',function(s){return s.le.done},50],
 ['le7','logic-engine','Trilingual','Learn in JavaScript, Python and Java.','gold',function(s){return s.le.langs},3],
 ['le8','logic-engine','Century','Finish 100 lessons.','gold',function(s){return s.le.done},100]
];

var OWN3=[
 ['ph5','port-halcyon','Ten Ships','Process 10 ships.','bronze',function(s){return s.ph.ships},10],
 ['ph6','port-halcyon','Fifty Ships','Process 50 ships.','silver',function(s){return s.ph.ships},50],
 ['ph7','port-halcyon','Harbor Veteran','Process 150 ships.','gold',function(s){return s.ph.ships},150],
 ['ph8','port-halcyon','Sharper Eyes','Cite 100 faults correctly.','silver',function(s){return s.ph.right},100],
 ['ph9','port-halcyon','Rulebook Scholar','Cite 300 faults correctly.','gold',function(s){return s.ph.right},300],
 ['ph10','port-halcyon','Frequent Flier','Start 5 runs at the quay.','silver',function(s){return s.ph.runs},5],
 ['ph11','port-halcyon','Half a Cabinet','Earn 5 inspector titles.','gold',function(s){return s.ph.titles},5],
 ['ph12','port-halcyon','Three Tides','See 3 different endings.','bronze',function(s){return s.ph.ends},3],
 ['pf6','pipeline-factory','Five Shifts','Win 5 shifts.','bronze',function(s){return s.pf.wins},5],
 ['pf7','pipeline-factory','Ten Shifts','Win 10 shifts.','silver',function(s){return s.pf.wins},10],
 ['pf8','pipeline-factory','Plant Legend','Win 25 shifts.','gold',function(s){return s.pf.wins},25],
 ['pf9','pipeline-factory','Warehouse','Ship 500 instructions cleanly.','silver',function(s){return s.pf.shipped},500],
 ['pf10','pipeline-factory','Mass Production','Ship 1000 instructions cleanly.','gold',function(s){return s.pf.shipped},1000],
 ['pf11','pipeline-factory','Three-Star Trio','Earn 3 stars on 3 different shifts.','silver',function(s){return s.pf.s3},3],
 ['pf12','pipeline-factory','Repeat Offender','Get fired 3 times.','silver',function(s){return s.pf.fired},3],
 ['pf13','pipeline-factory','Trophy Wall','Unlock 3 of the game’s achievements.','bronze',function(s){return s.pf.ach},3],
 ['hr7','relay-7','Warm-Up','Earn 5 stars across missions.','bronze',function(s){return s.hr.stars},5],
 ['hr8','relay-7','Thirty Stars','Earn 30 stars across missions.','gold',function(s){return s.hr.stars},30],
 ['hr9','relay-7','Triple Crown','Earn 3 stars on 5 different missions.','gold',function(s){return s.hr.three},5],
 ['hr10','relay-7','Creature of Habit','Complete 3 different daily missions.','silver',function(s){return s.hr.daily},3],
 ['hr11','relay-7','Night Crew','Complete 3 relay missions.','bronze',function(s){return s.hr.levels},3],
 ['pk5','pathfinders-keep','Squad Leader','Win 5 maps.','silver',function(s){return s.pk.wins},5],
 ['pk6','pathfinders-keep','Warden','Win 20 maps.','gold',function(s){return s.pk.wins},20],
 ['pk7','pathfinders-keep','Shard Saver','Hold 100 shards.','bronze',function(s){return s.pk.shards},100],
 ['pk8','pathfinders-keep','Shard Baron','Hold 500 shards.','silver',function(s){return s.pk.shards},500],
 ['pk9','pathfinders-keep','Star Cluster','Earn 10 stars in total.','silver',function(s){return s.pk.stars},10],
 ['pk10','pathfinders-keep','Constellation','Earn 30 stars in total.','gold',function(s){return s.pk.stars},30],
 ['pk11','pathfinders-keep','Trial Taker','Play 4 different trials.','silver',function(s){return s.pk.trials},4],
 ['pk12','pathfinders-keep','Cartographer’s Apprentice','Clear 5 maps.','silver',function(s){return s.pk.cleared},5],
 ['pk13','pathfinders-keep','Half the Armory','Unlock 6 of the game’s achievements.','gold',function(s){return s.pk.ach.length},6],
 ['ap8','proof-lab','Warm Cell','Unseal three chambers.','bronze',function(s){return s.ap.unlocked},3],
 ['ap9','proof-lab','Act One Done','Unseal eight chambers.','silver',function(s){return s.ap.unlocked},8],
 ['ap10','proof-lab','Fifteen Deep','Unseal fifteen chambers.','silver',function(s){return s.ap.unlocked},15],
 ['ap11','proof-lab','Six Hundred','Earn 600 points in the lab.','silver',function(s){return s.ap.total},600],
 ['ap12','proof-lab','Two Thousand','Earn 2000 points in the lab.','gold',function(s){return s.ap.total},2000],
 ['ap13','proof-lab','Clean Streak','Reach a streak of 5 clean chambers.','gold',function(s){return s.ap.streak},5],
 ['ap14','proof-lab','Twenty Solved','Solve 20 chambers.','gold',function(s){return s.ap.solved},20],
 ['le9','logic-engine','Ten Lessons','Finish 10 lessons.','bronze',function(s){return s.le.done},10],
 ['le10','logic-engine','Fifteen Lessons','Finish 15 lessons.','silver',function(s){return s.le.done},15],
 ['le11','logic-engine','Seventy-Five','Finish 75 lessons.','gold',function(s){return s.le.done},75],
 ['le12','logic-engine','Ten Stars','Collect 10 stars.','bronze',function(s){return s.le.stars},10],
 ['le13','logic-engine','Sixty Stars','Collect 60 stars.','silver',function(s){return s.le.stars},60],
 ['le14','logic-engine','Star Hoard','Collect 100 stars.','gold',function(s){return s.le.stars},100]
];
var IMP=[];
function addImp(game,key,list,has){list.forEach(function(r){IMP.push(['x'+key+'-'+r[0],game,r[1],r[2],r[3],function(s){return has(s,r[0])?1:0},1])})}
addImp('port-halcyon','ph',[
 ['fourteen','Fourteen Days','Finish the career.','gold'],['clean','Clean Hands','Finish the career without taking an envelope.','gold'],['eagle','Eagle Eye (90%)','Finish with 90% or better accuracy.','silver'],
 ['page14','Page Fourteen','Reach the Charter ending.','silver'],['archivist','Archivist','Reach the reading-room ending.','gold'],['senior','Senior Inspector','Accept the Chancellor’s offer.','silver'],
 ['wander','Wanderer','Find everything on every art site.','gold'],['deep','Deep Tide','Reach wave 10 in the Long Tide.','silver'],['quick','Quick Hands','Earn 25 speed bonuses.','silver'],
 ['endings','Many Tides','See five different endings.','silver'],['cases','Case Closer','Close three boss cases.','silver'],['plus','Second Reading','Finish a New Game+ career.','gold'],
 ['file','Friend of the File','Finish a career with the Registry file.','silver'],['neighbour','Good Neighbour','Reach the ending where the quay looks after itself.','gold']],
 function(s,i){return s.ph.tl.indexOf(i)>-1});
addImp('pipeline-factory','pf',[
 ['first','First Shift','Win your first shift.','bronze'],['clean','Spotless','Win a shift with 3 stars.','silver'],['streak','Hot Streak','Reach a streak of 20.','silver'],
 ['fired','Welcome to the Club','Get fired.','bronze'],['layoff','Out-of-Order Mishap','Get laid off for a broken reorder.','bronze'],['ooo','Reorder Buffer','Issue 10 crates out of order in one shift.','silver'],
 ['cool','Cool Head','Win with the overclock at level 2 or more and no throttling.','gold'],['rich','Plant Fund','Hold 800 in the bank.','silver']],
 function(s,i){return !!s.pf.A[i]});
addImp('pathfinders-keep','pk',[
 ['kill','First Blood','Destroy a packet.','bronze'],['tier3','Master Smith','Upgrade a tool to tier 3.','silver'],['boss','Boss Slayer','Defeat the boss.','gold'],
 ['flawless','Flawless Keep','Win a map without a single leak.','silver'],['arborist','Arborist','Earn three stars in all four tree trials.','gold'],['polymath','Polymath','Earn three stars in every trial.','gold'],
 ['oracle','Oracle','Predict correctly three times in a row.','silver'],['fogwalker','Fog Walker','Predict a fog round correctly.','bronze'],['architect','Architect','Solve a Maze Architect puzzle.','bronze'],
 ['puzzler','Puzzle Master','Earn three stars on every puzzle.','gold'],['surveyor','Surveyor','Sketch a blueprint that matches 80% of the real route.','silver'],['cartographer','Cartographer','Clear every map.','gold']],
 function(s,i){return s.pk.ach.indexOf(i)>-1});
addImp('proof-lab','ap',[
 ['i1','Instructed I','Finish the Act I instruction.','bronze'],['i2','Instructed II','Finish the Act II instruction.','silver'],['i3','Instructed III','Finish the Act III instruction.','silver'],
 ['s10','Survivor','Survive 10 tests in one run.','silver'],['s25','Veteran','Survive 25 tests in one run.','gold'],['c10','Clean Sweep','10 clean solves in a row.','silver'],
 ['all3','Triple Threat','Solve a chamber in every act.','silver'],['boss','Boss Slayer (Lab)','Defeat a boss chamber.','silver'],['boss3','Grand Slam','Defeat all three bosses.','gold'],
 ['flaw','Flawless','Beat a boss with no hints or strikes.','gold'],['d3','Daily Habit','Daily chamber 3 days in a row.','silver'],['rev','Studious','Finish a review session.','bronze'],
 ['sbx','Tinkerer','Run something in the sandbox.','bronze'],['arch','Architect (Lab)','Reach the Architect rank.','gold']],
 function(s,i){return !!s.ap.badges[i]});
var GA=A.concat(OWN2,OWN3,IMP);
(function(){var o={};GAMES.forEach(function(g,i){o[g.id]=i});GA=GA.map(function(a,i){return [a,i]}).sort(function(x,y){return (o[x[0][1]]-o[y[0][1]])||(x[1]-y[1])}).map(function(x){return x[0]})})();
var HUBA=[ /* arcade-wide, evaluated from hub stats */
 ['g1','hub','Power On','Launch any game.','bronze','plays',1],
 ['g2','hub','Grand Tour','Try all six games.','silver','tried',6],
 ['g3','hub','Regular','Launch games 15 times.','silver','plays',15],
 ['g4','hub','Long Shift','Play for one hour in total.','gold','secs',3600],
 ['g5','hub','All-Rounder','Earn a trophy in every game.','gold','spread',6],
 ['g6','hub','Halfway There','Unlock half of the game trophies.','gold','half',Math.ceil(GA.length/2)],
 ['g8','hub','Trophy Hunter','Unlock 10 trophies.','silver','earned',10],
 ['g9','hub','Marathon','Play for three hours in total.','gold','secs',10800],
 ['g10','hub','Completionist','Unlock every game trophy.','gold','earned',GA.length],
 ['g11','hub','Back Again','Play on 3 different days.','bronze','days',3],
 ['g12','hub','Week Streak','Play on 7 different days.','gold','days',7],
 ['g13','hub','Triple Feature','Play 3 different games in one day.','silver','trio',3],
 ['g14','hub','Weekend Warrior','Play on a Saturday or Sunday.','bronze','wk',1],
 ['g15','hub','Early Bird','Play between 5 and 8 a.m.','bronze','early',1,true],
 ['g16','hub','Thirty Launches','Launch games 30 times.','silver','plays',30],
 ['g17','hub','Half an Hour','Play for 30 minutes in total.','bronze','secs',1800],
 ['g18','hub','Five Hours','Play for five hours in total.','gold','secs',18000],
 ['g19','hub','Quarter Century','Unlock 25 trophies.','silver','earned',25],
 ['g20','hub','Half Century','Unlock 50 trophies.','gold','earned',50],
 ['g7','hub','Night Owl','Play between midnight and 5 a.m.','bronze','owl',1,true]
];
var LSK='halcyon-arcade-v1',H=jget(LSK)||{};
H.un=H.un||{};H.days=H.days||{};H.dsecs=H.dsecs||{};H.dd=H.dd||{};H.pins=H.pins||[];H.plays=H.plays||{};H.secs=H.secs||{};
function saveH(){try{localStorage.setItem(LSK,JSON.stringify(H))}catch(e){}}
function gameOf(id){return GAMES.filter(function(g){return g.id===id})[0]}
var VALS={};
var LASTS=null;
function compute(){
  var s=snap(),ctx={},unl=[];LASTS=s;
  GA.forEach(function(a){var v=a[5](s);VALS[a[0]]=v;if(v>=a[6])unl.push(a)});
  var tried=0,plays=0,secs=0;
  GAMES.forEach(function(g){var p=H.plays[g.id]|0;plays+=p;if(p)tried++;secs+=H.secs[g.id]|0});
  var have={};unl.forEach(function(a){have[a[1]]=1});
  /* include previously earned trophies so progress never moves backwards */
  GA.forEach(function(a){if(H.un[a[0]]){have[a[1]]=1}});
  var earned=GA.filter(function(a){return H.un[a[0]]||VALS[a[0]]>=a[6]}).length;
  ctx={plays:plays,tried:tried,secs:secs,spread:Object.keys(have).length,half:earned,earned:earned,owl:H.owl?1:0,early:H.early?1:0,wk:H.wk?1:0,days:Object.keys(H.days).length,trio:Object.keys(H.days).reduce(function(m,k){return Math.max(m,H.days[k].length)},0)};
  HUBA.forEach(function(a){VALS[a[0]]=ctx[a[5]]});
  return ctx;
}
var ALL=GA.concat(HUBA);
function isUn(a){return !!H.un[a[0]]}
var MAXPTS=ALL.reduce(function(t,a){return t+TIER[a[4]].pts},0);
var RANKS=[['Cadet',0],['Deckhand',.07],['Technician',.2],['Engineer',.38],['Chief',.6],['Commander',.85]].map(function(r){return [r[0],Math.round(r[1]*MAXPTS)]});
var queue=[];
function evaluate(silent){
  compute();var fresh=[],ch=false;
  ALL.forEach(function(a){if(!H.un[a[0]]&&VALS[a[0]]>=a[6]){H.un[a[0]]=Date.now();fresh.push(a)}});
  if(fresh.length){ch=true;if(!silent)fresh.slice(0,4).forEach(toast)}
  if(dailyCheck(silent))ch=true;
  var ri=rankIdx(points());
  if(H.rank==null){H.rank=ri;ch=true}else if(ri>H.rank){H.rank=ri;ch=true;if(!silent)showRank(ri)}else if(ri<H.rank){H.rank=ri;ch=true}
  if(ch){saveH();renderAll()}
  return fresh.length;
}
function points(){return ALL.reduce(function(t,a){return t+(isUn(a)?TIER[a[4]].pts:0)},0)+50*Object.keys(H.dd).length}
function rankIdx(p){var i=0;RANKS.forEach(function(r,k){if(p>=r[1])i=k});return i}
function fmtTime(sec){sec=sec|0;if(sec<60)return sec+'s';var m=Math.floor(sec/60);if(m<60)return m+' min';return Math.floor(m/60)+'h '+('0'+(m%60)).slice(-2)+'m'}
function medal(tier,locked){
  var c='var('+TIER[tier].v+')';
  return '<svg class="medal" viewBox="0 0 52 60" aria-hidden="true"><path d="M14 2h10l4 14H18Z M38 2H28l-4 14h10Z" fill="'+c+'" opacity=".55"/><path d="M26 14 46 25v22L26 58 6 47V25Z" fill="var(--panel2)" stroke="'+c+'" stroke-width="3"/>'+
  (locked?'<path d="M20 31v-3a6 6 0 0112 0v3M18 31h16v13H18Z" fill="none" stroke="'+c+'" stroke-width="2.5"/>':'<path d="M26 22l4 8.5 9 1-6.700 6 2 9L26 42l-8.300 4.500 2-9-6.700-6 9-1Z" fill="'+c+'"/>')+'</svg>';
}
function toast(a){
  var g=gameOf(a[1]),box=document.createElement('div');box.className='toast';box.setAttribute('role','status');
  box.innerHTML=medal(a[4])+'<div><small>'+(a[9]||'Trophy unlocked')+' · +'+TIER[a[4]].pts+' pts</small><b></b><span></span></div>';
  box.querySelector('b').textContent=a[2];box.querySelector('span').textContent=a[8]||(g?g.name:'Arcade');chime();
  var t=document.getElementById('toasts');t.appendChild(box);
  setTimeout(function(){box.classList.add('out');setTimeout(function(){box.remove()},450)},5200);
}

