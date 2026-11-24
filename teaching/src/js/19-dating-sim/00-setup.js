 const X=window.SFX,PAN=X.PAN,SM=X.SM,modal=X.modal,esc=X.esc2,D=X.D,tick=X.tick;
 const {ST,rnd,pick,pay,bar,onSP,sfx}=window.sfLib;
 const id='aigf',now=()=>Date.now();
 const NAMES={sweet:{f:'Hana',m:'Haruto',n:'Hikari'},tsun:{f:'Rin',m:'Ren',n:'Rei'},yan:{f:'Mika',m:'Kaito',n:'Mio'},dan:{f:'Yuki',m:'Yuuto',n:'Yui'},kuu:{f:'Shiori',m:'Sora',n:'Ao'}};
 const AL={sweet:['Sweetheart','Warm, encouraging and endlessly proud of you.'],tsun:['Tsundere','Pretends not to care. Cares a lot. Will never say it.'],yan:['Yandere','Devoted to a worrying degree. Keeps a diary of your study points.'],dan:['Dandere','Shy and quiet, but she notices every bit of effort.'],kuu:['Kuudere','Calm and deadpan. Praise is rare and means a lot.']};
 const VL={f:'She',m:'He',n:'They'};
 const CALLS={boy:'good boy',girl:'good girl',kid:'good student'};
 const CL={boy:'Good boy',girl:'Good girl',kid:'Good student'};
 const MOODS=['Adoring','Happy','Calm','Upset','Cold','Furious'];
 const ML={sweet:['Adoring','Happy','Content','Worried','Sad','Heartbroken'],tsun:['Flustered','Smug','Grumpy','Annoyed','Fuming','Furious'],yan:['Devoted','Delighted','Watching','Jealous','Unhinged','Intense'],dan:['Glowing','Warm','Quiet','Anxious','Withdrawn','Hurt'],kuu:['Softened','Pleased','Neutral','Displeased','Frosty','Icy']};
 const TH={
  sweet:{bg:'#fff0f6',fg:'#3b1f3a',mut:'#7a4d6e',card:'#ffffff',card2:'#ffe0ee',bd:'#f2a9c8',ok:'#12805a',bad:'#c81e4b',acc:'#c2255c',on:'#ffffff',acc2:'#6d4fd6',base:'light'},
  tsun:{bg:'#fff3ec',fg:'#3a1c12',mut:'#7a4a38',card:'#ffffff',card2:'#ffe1d1',bd:'#f4a98a',ok:'#12805a',bad:'#c81e4b',acc:'#c2410c',on:'#ffffff',acc2:'#1e4a8c',base:'light'},
  yan:{bg:'#fdecf0',fg:'#2a0f18',mut:'#6b3a4a',card:'#ffffff',card2:'#f9d3dc',bd:'#d77a91',ok:'#12805a',bad:'#c81e4b',acc:'#a3122f',on:'#ffffff',acc2:'#3b1c2e',base:'light'},
  dan:{bg:'#f4f0ff',fg:'#261a45',mut:'#5f5190',card:'#ffffff',card2:'#e6defc',bd:'#b9a8ee',ok:'#12805a',bad:'#c81e4b',acc:'#6247c9',on:'#ffffff',acc2:'#c2255c',base:'light'},
  kuu:{bg:'#eaf4fb',fg:'#12263a',mut:'#476079',card:'#ffffff',card2:'#d3e8f6',bd:'#8fbfe0',ok:'#12805a',bad:'#c81e4b',acc:'#1b6ca8',on:'#ffffff',acc2:'#5b6b7c',base:'light'}};

