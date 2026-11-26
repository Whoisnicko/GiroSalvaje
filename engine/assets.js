/* v19-alpha.3: illustrated PNG atlas, with independent sprite cells and per-character fallback. */
function fallbackUnit(name){const c=inkCanvas(40,40),g=c.getContext('2d');g.fillStyle='#19152c';g.fillRect(9,8,22,30);g.fillStyle=MONSTER_TINT[name]||'#b7bbd4';g.fillRect(11,10,18,25);g.fillStyle='#201b32';g.fillRect(14,17,3,3);g.fillRect(23,17,3,3);g.fillRect(17,25,8,2);return c;}
const ILLUSTRATED_ATLAS='assets/characters-v19.png?v=22a7p22';
function atlasFrame(src,state,f,name){
 const c=inkCanvas(96,96),g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const ghost=['espectro','banshee','alma'].includes(name), human=['soldado','ballestero','caballero','jinete','clerigo','incendiario','comandante'].includes(name);
 const direction=human?-1:1;
 const y=state==='walk'?[0,-2,0,-2][f]:ghost?[0,-1,-3,-1][f]:[0,0,-1,0][f];
 const x=state==='attack'?[0,1,3,1][f]*direction:0;
 g.drawImage(src,x,y);
 return c;
}
const FULL_BATTLEFIELD_ART='assets/battlefield-full-v19.webp';
const FOREST_BATTLEFIELD_ART='assets/battlefield-forest-v39.webp?v=22a7p39';
const FOREST_ENEMY_ATLAS='assets/forest-enemies-v40.png?v=22a7p40';
const FOREST_ENEMY_CELLS=Object.freeze(['pathfinder','ranger','purifier']);
const FROZEN_BATTLEFIELD_ART='assets/battlefield-frozen-v38.webp?v=22a7p38';
let battlefieldArt=null,forestBattlefieldArt=null,frozenBattlefieldArt=null;
// A bounded image request prevents a missing resource from blocking the menu.
function loadArtImage(src){
 return new Promise((resolve,reject)=>{const im=new Image();const timer=setTimeout(()=>finish(false),12000);function finish(ok){clearTimeout(timer);im.onload=im.onerror=null;ok?resolve(im):reject(new Error('Artwork unavailable: '+src.slice(0,100)));}im.onload=()=>finish(true);im.onerror=()=>finish(false);im.src=src;});
}
/* Rasterize the forest artwork once at load time. */
function bakeForestBackdrop(image){
 if(image?.width!==1100||image?.height!==500)return null;
 try{const c=inkCanvas(1100,500),g=c.getContext('2d');if(!g)return null;g.drawImage(image,0,0,1100,500);return c;}catch(e){console.warn('Forest raster fallback',e);return null;}
}
function assetFrame(image,sx,sy){return {image,sx,sy,width:96,height:96};}
/* Prepare the approved poses once, matching the original 12-frame indexing.
   Each sprite remains independently optional; missing art falls back to KIND.spr. */
function installForestEnemyArt(sheet){
 if(sheet?.width!==288||sheet?.height!==96)return 0;
 let installed=0;
 const order=[0,0,1,0,0,2,0,2,0,3,4,3],offsets=[[0,0],[0,-1],[0,-2],[-2,0],[-4,0]];
 FOREST_ENEMY_CELLS.forEach((kind,i)=>{
  const name=REGIONAL_ENEMIES[kind]?.art;if(!name)return;
  try{
   const poses=offsets.map(([dx,dy])=>{const c=inkCanvas(96,96),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(sheet,i*96,0,96,96,dx,dy,96,96);return c;});
   const alpha=poses[0].getContext('2d').getImageData(0,0,96,96).data;if(!alpha.some((v,j)=>j%4===3&&v>100))return;
   const tint=(pose,mode)=>{const c=inkCanvas(96,96),g=c.getContext('2d');g.imageSmoothingEnabled=false;if(mode==='gray')g.filter='grayscale(1)';g.drawImage(pose,0,0);g.filter='none';if(mode==='white'){g.globalCompositeOperation='source-atop';g.fillStyle='rgba(255,255,255,.85)';g.fillRect(0,0,96,96);}return c;};
   const whites=poses.map(p=>tint(p,'white')),grays=poses.map(p=>tint(p,'gray')),portrait=poses[0].toDataURL('image/png');
   SPR[name]=order.map(n=>poses[n]);SPRW[name]=order.map(n=>whites[n]);SPRGRAY[name]=order.map(n=>grays[n]);URL_[name]=portrait;installed++;
  }catch(err){console.warn('Regional sprite fallback',kind,err);}
 });
 return installed;
}
async function buildHybridArt(){
 const [backdrop,forest,frozen,forestEnemies,...sheets]=await Promise.all([loadArtImage(FULL_BATTLEFIELD_ART).catch(()=>null),loadArtImage(FOREST_BATTLEFIELD_ART).catch(()=>null),loadArtImage(FROZEN_BATTLEFIELD_ART).catch(()=>null),loadArtImage(FOREST_ENEMY_ATLAS).catch(()=>null),...BAKED_ART.sheets.map((url,i)=>loadArtImage(url).then(im=>{if(im.width!==768||im.height%96||im.height!==(i===BAKED_ART.sheets.length-1?96:768))throw Error('Invalid sprite sheet dimensions');return im;}).catch(e=>{console.warn('Sprite sheet fallback',i,e);return null;}))]);
 battlefieldArt=backdrop?.width===1100&&backdrop?.height===500?backdrop:null;
 forestBattlefieldArt=bakeForestBackdrop(forest);
 frozenBattlefieldArt=frozen?.width===1100&&frozen?.height===500?frozen:null;
 let original=null;
 if(sheets.some(im=>!im))original=await loadArtImage(ILLUSTRATED_ATLAS).then(im=>im.width===384&&im.height===384?im:null).catch(()=>null);
 HYBRID.names.forEach((name,i)=>{
  const variants=BAKED_ART.frames[name];
  // No generated canvases in the normal path. Draw straight from decoded PNG files.
  const fallback=original?assetFrame(original,i%4*96,Math.floor(i/4)*96):null;
  const frames=indices=>indices.map(index=>{const im=sheets[Math.floor(index/64)],j=index%64;return im?assetFrame(im,j%8*96,Math.floor(j/8)*96):fallback;});
  SPR[name]=frames(variants.base);SPRW[name]=frames(variants.white);SPRGRAY[name]=frames(variants.gray);
  if(variants[2])SPRLEVEL[name]={2:frames(variants[2]),3:frames(variants[3])};
  URL_[name]=BAKED_ART.portraits[name];
 });
 installForestEnemyArt(forestEnemies);
 Object.assign(GOTHIC_DATA.cards,BAKED_ART.cards);
 GOTHIC_DATA.relics=['dragon','esqueleto','alma','nigromante','comodin','caballero'].map(n=>URL_[n]);
 const strip=$('#heroCast');strip.innerHTML=['zombi','espectro','dragon','caballero'].map(n=>`<img src="${URL_[n]}" alt="${n}">`).join('');
}
