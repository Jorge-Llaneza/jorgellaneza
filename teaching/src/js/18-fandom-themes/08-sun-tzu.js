/* ======= Sun Tzu quotes in Ink & Banner ======= */
(function(){
 const Q=["All warfare is based on deception.","The supreme art of war is to subdue the enemy without fighting.","If you know the enemy and know yourself, you need not fear the result of a hundred battles.","Let your plans be dark and impenetrable as night, and when you move, fall like a thunderbolt.","Appear weak when you are strong, and strong when you are weak.","He will win who knows when to fight and when not to fight.","Rapidity is the essence of war.","A victorious army wins its victories before seeking battle.","Move not unless you see an advantage; use not your troops unless there is something to be gained.","To fight and conquer in all your battles is not supreme excellence; supreme excellence consists in breaking the enemy's resistance without fighting.","The highest form of generalship is to baulk the enemy's plans.","There is no instance of a country having benefited from prolonged warfare."];
 let last=-1;const pickQ=()=>{let i;do{i=Math.floor(Math.random()*Q.length)}while(i===last&&Q.length>1);last=i;return Q[i]};
 window.sunTzuQuote=pickQ;
 const css='#fdview .qt{position:absolute;left:50%;transform:translateX(-50%);bottom:34px;width:min(560px,calc(100vw - 150px));text-align:center;background:#f3e6c8;color:#2a1a0c;border:2px solid #3b2415;border-left-width:10px;border-right-width:10px;border-radius:3px;padding:7px 16px;font:italic 600 13px/1.4 "Songti SC",Georgia,serif;box-shadow:0 3px 10px #0007;transition:opacity .6s}#fdview .qt small{display:block;font:700 10px ui-monospace,monospace;letter-spacing:.2em;color:#8a2a1a;margin-top:2px;font-style:normal}#fdview .qt.fd{opacity:0}@media(max-width:720px){#fdview .qt{bottom:56px;font-size:12px}}';
 const scoped=css.split('}').filter(x=>x.trim()).map(r=>{if(r.startsWith('@media'))return r+'}}';return 'html[data-xt=inkbanner] '+r+'}'}).join('');
 try{const st=document.createElement('style');st.id='suntzucss';st.textContent=scoped;document.head.appendChild(st);window.FDCSS=(window.FDCSS||'')+scoped}catch(e){}
 const V=window.FDVIEW&&window.FDVIEW.inkbanner;
 if(V){V.h+='<div class="qt"><span class="qx"></span><small>SUN TZU · THE ART OF WAR</small></div>';let n=0;const _u=V.u;V.u=e=>{if(_u)_u(e);const t=e.querySelector('.qt'),x=e.querySelector('.qx');if(!t||!x)return;if(!x.textContent){x.textContent='“'+pickQ()+'”';return}if(++n%20===0){t.classList.add('fd');setTimeout(()=>{x.textContent='“'+pickQ()+'”';t.classList.remove('fd')},600)}}}
 /* quote inside the campaign panel too */
 try{const P=window.SFX.PAN.inkbanner;if(P){const b=P.body;P.body=()=>b()+'<p class="sfp"><i>“'+Q[Math.floor((Date.now()/60000))%Q.length]+'”</i><br><small>Sun Tzu</small></p>'}}catch(e){}
})();

