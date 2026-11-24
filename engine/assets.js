/* v19-alpha.3: illustrated PNG atlas, with independent sprite cells and per-character fallback. */
function fallbackUnit(name){const c=inkCanvas(40,40),g=c.getContext('2d');g.fillStyle='#19152c';g.fillRect(9,8,22,30);g.fillStyle=MONSTER_TINT[name]||'#b7bbd4';g.fillRect(11,10,18,25);g.fillStyle='#201b32';g.fillRect(14,17,3,3);g.fillRect(23,17,3,3);g.fillRect(17,25,8,2);return c;}
const ILLUSTRATED_ATLAS='assets/characters-v19.png';
function atlasFrame(src,state,f,name){
 const c=inkCanvas(96,96),g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const ghost=['espectro','banshee','alma'].includes(name), human=['soldado','ballestero','caballero','jinete','clerigo','incendiario','comandante'].includes(name);
 const direction=human?-1:1;
 const y=state==='walk'?[0,-2,0,-2][f]:ghost?[0,-1,-3,-1][f]:[0,0,-1,0][f];
 const x=state==='attack'?[0,1,3,1][f]*direction:0;
 g.drawImage(src,x,y);
 return c;
}
let battlefieldArt=null;
async function buildHybridArt(){
 try{battlefieldArt=await loadInkImage(BATTLEFIELD_ART);}catch(e){console.warn('Backdrop fallback active');}
 let atlas=null;try{atlas=await loadInkImage(ILLUSTRATED_ATLAS);if(atlas.width!==384||atlas.height!==384)throw Error('Incorrect atlas size');}catch(e){atlas=null;console.warn('Illustrated atlas unavailable; fallback enabled',e);}
 HYBRID.names.forEach((name,i)=>{
  try{
   if(!atlas)throw Error('No illustrated atlas');
   const cell=inkCanvas(96,96),g=cell.getContext('2d');g.imageSmoothingEnabled=false;
   g.drawImage(atlas,(i%4)*96,Math.floor(i/4)*96,96,96,0,0,96,96);
   if(!g.getImageData(0,0,96,96).data.some((v,k)=>k%4===3&&v>128))throw Error('Empty atlas cell');
   SPR[name]=['idle','walk','attack'].flatMap(state=>[0,1,2,3].map(f=>atlasFrame(cell,state,f,name)));
  }
  catch(e){console.warn('Character fallback',name,e);try{SPR[name]=['idle','walk','attack'].flatMap(state=>[0,1,2,3].map(f=>originalCharacterFrame(name,state,f)));}catch(_){SPR[name]=Array.from({length:12},()=>fallbackUnit(name));}}
  SPRW[name]=SPR[name].map(whiteOf);SPRGRAY[name]=SPR[name].map(grayscaleSprite);
  if(MONSTER_TINT[name])SPRLEVEL[name]={2:SPR[name].map(s=>rankSprite(s,name,2)),3:SPR[name].map(s=>rankSprite(s,name,3))};
  URL_[name]=SPR[name][0].toDataURL();
 });
 // All interface art is built from the same atlas, with type-colored spell frames.
 Object.keys(CARDS).forEach(id=>{const name=HYBRID.cards[id]||({atk:'dragon',ctl:'espectro',sup:'alma',sum:'nigromante',ter:'comodin'}[CARDS[id].t]);const c=inkCanvas(96,64),g=c.getContext('2d');g.fillStyle='#171b2d';g.fillRect(0,0,96,64);g.imageSmoothingEnabled=false;g.drawImage(SPR[name][0],20,3,56,56);g.strokeStyle=({atk:'#ff6549',ctl:'#ad82ff',sup:'#78e1bc',sum:'#eab85a',ter:'#6ca6cb'}[CARDS[id].t]);g.lineWidth=2;g.strokeRect(3,3,90,58);for(let i=0;i<5;i++)g.fillRect(9+i*4,49-i*4,2,2);GOTHIC_DATA.cards[id]=c.toDataURL();});
 GOTHIC_DATA.relics=['dragon','esqueleto','alma','nigromante','comodin','caballero'].map(n=>URL_[n]);
 const strip=$('#heroCast');strip.innerHTML=['zombi','espectro','dragon','caballero'].map(n=>`<img src="${URL_[n]}" alt="${n}">`).join('');
}
