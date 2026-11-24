/* ======= Legendary milestone scenes: Mission Control and Hacker Terminal get short story beats at 300 / 1000 / 2500 / 5000 SP ======= */
(function(){
 const K=window.MYK,{ST,pay}=window.sfLib;
 const MS={orbit:{col:'#8fd3ff',t:[[300,'Low orbit','Earth below.'],[1000,'Lunar flyby','The Moon ahead.'],[2500,'Red dust','Mars.'],[5000,'Past Neptune','Open space.']]},
  hackterm:{col:'#3dff7a',t:[[300,'root access','sudo study: accepted.'],[1000,'firewall breached','No alerts.'],[2500,'mainframe reached','Access granted.'],[5000,'zero day','Nothing left to exploit.']]}};
 window.sfSP.push(()=>{try{const m=MS[mode];if(!m||!M.sp)return;const s=ST('ms_'+mode,{d:0});const due=m.t.filter(x=>M.sp>=x[0]&&x[0]>s.d);if(!due.length)return;const last=due[due.length-1];s.d=last[0];pay(100*due.length,'🏁 '+last[1]+': +'+100*due.length+' 🪙');if(K.RM())K.banner(last[1],'Milestone',m.col,2400);else K.banner(last[1].toUpperCase(),'Milestone · '+last[0]+' SP',m.col,2600);setTimeout(()=>K.story(last[1],[last[2]],null,m.col),2800)}catch(e){}});
})();
