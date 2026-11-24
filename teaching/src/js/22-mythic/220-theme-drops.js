/* ===== themes can drop from crates; only secret, seasonal-event and battle-pass themes stay locked out ===== */
(function(){CATALOG.forEach(c=>{if(c.c==='theme'&&c.noDrop&&c.r!=='secret'&&!c.pack&&!/^(evt_|bpt)/.test(c.id))delete c.noDrop})})();
