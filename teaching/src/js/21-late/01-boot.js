
const h=(location.hash||'').slice(1);mptInit();applyTheme();go(h==='rewards'?'rewards':(NAV.some(a=>a.id===h)?h:''),true);
