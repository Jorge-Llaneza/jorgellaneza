/* ===== v10: UniOvi and 67 references ===== */
[['🏛️','rare'],['🍎','common'],['🫘','common'],['🌧️','common'],['🏔️','rare'],['🐄','rare'],['🍏','common']].forEach(([e,r])=>addU('avatar','av_'+e,'Avatar '+e,r,{av:e}));
Object.entries({common:['Rainy Day Scholar','Fabada-Powered'],rare:['Carbayón','Cider Pourer','Campus Regular'],epic:['Campus Legend','Escanciador Supremo'],legendary:['Founded 1608','Pride Of Oviedo']}).forEach(([r,l])=>l.forEach(t=>addU('title','t_'+t,t,r,{title:t})));
Object.entries({epic:['Six Seven','6-7'],legendary:['Sixty-Seven Supreme']}).forEach(([r,l])=>l.forEach(t=>addU('title','t_'+t,t,r,{title:t})));
addU('title','t_67 Club','67 Club','rare',{title:'67 Club'});
[['67','epic'],['⁶⁷','legendary']].forEach(([f,r])=>addU('flair','fl_'+f,'Flair '+f,r,{flair:f}));
Object.assign(CFSETS,{asturias:['🍎','🌧️','🏔️','🎓'],sixseven:['6','7','67','🤷']});
addU('confetti','cf_asturias','Asturias','rare',{cf:'asturias',i:CFSETS.asturias.join('')});
addU('confetti','cf_sixseven','Six Seven','epic',{cf:'sixseven',i:'67'});
BNDEF.push(['oviedo','Oviedo','rare','linear-gradient(120deg,#16315a,#4a79b8,#f2c14e)'],['asturies','Asturies','epic','linear-gradient(120deg,#0b3d91,#1c6ad0 55%,#f2c14e)'],['sixseven','Six Seven','epic','repeating-linear-gradient(90deg,#6a3fd1 0 20px,#ffe600 20px 40px)',1]);
BNDEF.slice(-3).forEach(b=>addU('banner','bn_'+b[0],b[1]+' banner',b[2],{key:b[0],css:b[3],anim:b[4]}));
Object.assign(PETS,{cow:['🐄','Asturian Cow','rare','bob']});addU('pet','pet_cow','Asturian Cow','rare',{key:'cow',i:'🐄',beh:'bob'});
Object.assign(CLICKS,{sidra:['🍏','Cider splash','rare'],sixseven2:['67','Six seven','epic']});
addU('clickfx','clk_sidra','Cider splash','rare',{key:'sidra',i:'🍏'});addU('clickfx','clk_sixseven2','Six seven','epic',{key:'sixseven2',i:'67'});
Object.assign(TRAILS,{apple:['🍎','Apple trail','common'],sixseventr:['67','Sixty-seven trail','epic']});
addU('trail','trl_apple','Apple trail','common',{key:'apple',i:'🍎'});addU('trail','trl_sixseventr','Sixty-seven trail','epic',{key:'sixseventr',i:'67'});
Object.assign(LVFX,{sixseven:['67','Sixty-seven rain','epic','67'],rain:['🌧️','Asturian rain','rare','🌧️']});
addU('lvfx','lvf_sixseven','Sixty-seven rain level-up','epic',{key:'sixseven',i:'67'});addU('lvfx','lvf_rain','Asturian rain level-up','rare',{key:'rain',i:'🌧️'});
addU('cursor','cur_apple','Apple','common',{key:'apple',i:'🍎'});

