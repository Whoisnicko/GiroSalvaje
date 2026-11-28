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
const FROZEN_ENEMY_ATLAS='assets/frozen-enemies-v41.png?v=22a7p41';
const FROZEN_ENEMY_CELLS=Object.freeze(['frostSentinel','iceMarksman','frostHerald']);
const REGIONAL_BOSS_ATLAS='assets/regional-bosses-v42.png?v=22a7p42';
const REGIONAL_BOSS_CELLS=Object.freeze(['crusader','huntsman','inquisitor']);
const FROZEN_BATTLEFIELD_ART='assets/battlefield-frozen-v38.webp?v=22a7p38';
const ASHEN_BATTLEFIELD_ART='assets/battlefield-ashen-v43.webp?v=22a7p43',ASHEN_ENEMY_ATLAS='assets/ashen-enemies-v43.png?v=22a7p43',ASHEN_BOSS_ATLAS='assets/ashen-boss-v43.png?v=22a7p43';
const CAT_BATTLEFIELD_ART='assets/battlefield-cathedral-v44.webp?v=22a7p44',CAT_ENEMY_ATLAS='assets/cathedral-enemies-v44.png?v=22a7p44',CAT_BOSS_ATLAS='assets/cathedral-boss-v44.png?v=22a7p44';
let battlefieldArt=null,forestBattlefieldArt=null,frozenBattlefieldArt=null,ashenBattlefieldArt=null,cathedralBattlefieldArt=null;
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
function installRegionalEnemyArt(sheet,cells,registry=REGIONAL_ENEMIES,w=96,h=96){
 if(sheet?.width!==w*cells.length||sheet?.height!==h)return 0;
 let installed=0;
 const order=[0,0,1,0,0,2,0,2,0,3,4,3],offsets=[[0,0],[0,-1],[0,-2],[-2,0],[-4,0]];
 cells.forEach((kind,i)=>{
  const name=registry[kind]?.art;if(!name)return;
  try{
   const poses=offsets.map(([dx,dy])=>{const c=inkCanvas(w,h),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(sheet,i*w,0,w,h,dx,dy,w,h);return c;});
   const alpha=poses[0].getContext('2d').getImageData(0,0,w,h).data;if(!alpha.some((v,j)=>j%4===3&&v>100))return;
   const tint=(pose,mode)=>{const c=inkCanvas(w,h),g=c.getContext('2d');g.imageSmoothingEnabled=false;if(mode==='gray')g.filter='grayscale(1)';g.drawImage(pose,0,0);g.filter='none';if(mode==='white'){g.globalCompositeOperation='source-atop';g.fillStyle='rgba(255,255,255,.85)';g.fillRect(0,0,w,h);}return c;};
   const whites=poses.map(p=>tint(p,'white')),grays=poses.map(p=>tint(p,'gray')),portrait=poses[0].toDataURL('image/png');
   SPR[name]=order.map(n=>poses[n]);SPRW[name]=order.map(n=>whites[n]);SPRGRAY[name]=order.map(n=>grays[n]);URL_[name]=portrait;installed++;
  }catch(err){console.warn('Regional sprite fallback',kind,err);}
 });
 return installed;
}
function installForestEnemyArt(sheet){return installRegionalEnemyArt(sheet,FOREST_ENEMY_CELLS);}
function installFrozenEnemyArt(sheet){return installRegionalEnemyArt(sheet,FROZEN_ENEMY_CELLS);}
function installRegionalBossArt(sheet){return installRegionalEnemyArt(sheet,REGIONAL_BOSS_CELLS,BOSS_DATA,160,112);}
function installRegionalRelics(sheet){GOTHIC_DATA.regionalRelics=[];if(sheet?.width!==800||sheet?.height!==208)return 0;for(let i=0;i<5;i++){try{const c=inkCanvas(160,208),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(sheet,i*160,0,160,208,0,0,160,208);GOTHIC_DATA.regionalRelics[i]=c.toDataURL('image/png');}catch(e){console.warn('Relic art fallback',i,e);}}return GOTHIC_DATA.regionalRelics.filter(Boolean).length;}
async function buildHybridArt(){
 const [backdrop,forest,frozen,forestEnemies,frozenEnemies,regionalBosses,ashen,ashenEnemies,ashenBoss,cathedral,catEnemies,catBoss,relicSheet,guardianSheet,guardianEvolvedSheet,...sheets]=await Promise.all([loadArtImage(FULL_BATTLEFIELD_ART).catch(()=>null),loadArtImage(FOREST_BATTLEFIELD_ART).catch(()=>null),loadArtImage(FROZEN_BATTLEFIELD_ART).catch(()=>null),loadArtImage(FOREST_ENEMY_ATLAS).catch(()=>null),loadArtImage(FROZEN_ENEMY_ATLAS).catch(()=>null),loadArtImage(REGIONAL_BOSS_ATLAS).catch(()=>null),loadArtImage(ASHEN_BATTLEFIELD_ART).catch(()=>null),loadArtImage(ASHEN_ENEMY_ATLAS).catch(()=>null),loadArtImage(ASHEN_BOSS_ATLAS).catch(()=>null),loadArtImage(CAT_BATTLEFIELD_ART).catch(()=>null),loadArtImage(CAT_ENEMY_ATLAS).catch(()=>null),loadArtImage(CAT_BOSS_ATLAS).catch(()=>null),loadArtImage('assets/regional-relics-v45.webp?v=22a7p45').catch(()=>null),guardian72Enabled()?loadArtImage(GUARDIAN72_ART.url).catch(()=>null):Promise.resolve(null),guardian72Enabled()?loadArtImage(GUARDIAN73_ART.url).catch(()=>null):Promise.resolve(null),...BAKED_ART.sheets.map((url,i)=>loadArtImage(url).then(im=>{if(im.width!==768||im.height%96||im.height!==(i===BAKED_ART.sheets.length-1?96:768))throw Error('Invalid sprite sheet dimensions');return im;}).catch(e=>{console.warn('Sprite sheet fallback',i,e);return null;}))]);
 battlefieldArt=backdrop?.width===1100&&backdrop?.height===500?backdrop:null;
 forestBattlefieldArt=bakeForestBackdrop(forest);
 frozenBattlefieldArt=frozen?.width===1100&&frozen?.height===500?frozen:null;ashenBattlefieldArt=ashen?.width===1100&&ashen?.height===500?ashen:null;cathedralBattlefieldArt=cathedral?.width===1100&&cathedral?.height===500?cathedral:null;
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
 installGuardian72(guardianSheet);
 installGuardian73(guardianEvolvedSheet);
 installForestEnemyArt(forestEnemies);
 installFrozenEnemyArt(frozenEnemies);
 installRegionalBossArt(regionalBosses);
 installRegionalEnemyArt(ashenEnemies,['ashenVanguard','emberMarksman','cinderPriest']);installRegionalEnemyArt(ashenBoss,['paladin'],BOSS_DATA,160,112);
 installRegionalEnemyArt(catEnemies,['sanctifiedTemplar','holyInquisitor','divineHierophant']);installRegionalEnemyArt(catBoss,['exorcist','ascended'],{exorcist:BOSS_DATA.exorcist,ascended:{art:BOSS_DATA.exorcist.ascendedArt}},160,112);
 installRegionalRelics(relicSheet);
 Object.assign(GOTHIC_DATA.cards,BAKED_ART.cards);
 GOTHIC_DATA.relics=['dragon','esqueleto','alma','nigromante','comodin','caballero'].map(n=>URL_[n]);
 const strip=$('#heroCast');strip.innerHTML=['zombi','espectro','dragon','caballero'].map(n=>`<img src="${URL_[n]}" alt="${n}">`).join('');
}
