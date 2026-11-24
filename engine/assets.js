/* v19 asset pipeline. Legacy atlas remains active pending original artwork. */
function fallbackUnit(name){const c=inkCanvas(40,40),g=c.getContext('2d');g.fillStyle='#19152c';g.fillRect(9,8,22,30);g.fillStyle=MONSTER_TINT[name]||'#b7bbd4';g.fillRect(11,10,18,25);g.fillStyle='#201b32';g.fillRect(14,17,3,3);g.fillRect(23,17,3,3);g.fillRect(17,25,8,2);return c;}
function pixelFrame(src,name,state,f){
 const c=inkCanvas(48,48),g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const ghost=['espectro','banshee','alma'].includes(name),dir=MONSTER_TINT[name]?1:-1;
 const attack=state==='attack',walk=state==='walk',wiggle=walk?[0,-1,0,1][f]:ghost?[0,-1,-2,-1][f]:[0,0,-1,0][f];
 const kick=attack?[0,2,4,0][f]*dir:0;
 let dw=src.width,dh=src.height;
 g.save();g.translate(24+kick,45+wiggle);
 if(attack)g.transform(1,0,dir*[0,.04,.1,0][f],1,0,0);
 // Art is sampled once at native sprite resolution; animation preserves the grid.
 g.drawImage(src,Math.round(-dw/2),-dh,dw,dh);
 if(walk&&f%2){g.clearRect(24*-1, -2,48,2);g.drawImage(src,0,src.height-5,src.width,5,Math.round(-dw/2)+(f===1?1:-1),-5,dw,5);}
 g.restore();return c;
}
let battlefieldArt=null;
async function buildHybridArt(){
 try{battlefieldArt=await loadInkImage(BATTLEFIELD_ART);}catch(e){console.warn("Fondo de respaldo activo");}
 let atlas=null;try{atlas=await loadInkImage(HYBRID_ATLAS);}catch(e){console.warn('Atlas fallback activo');}
 HYBRID.names.forEach((name,i)=>{
  let src;
  if(atlas){
   const cw=atlas.width/4,ch=atlas.height/4,c=inkCanvas(Math.floor(cw),Math.floor(ch)),g=c.getContext('2d');
   g.drawImage(atlas,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,c.width,c.height);
   const p=g.getImageData(0,0,c.width,c.height);let x0=c.width,y0=c.height,x1=0,y1=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(p.data[(y*c.width+x)*4+3]>140){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   if(x1>x0){const ratio=Math.min(43/(x1-x0+1),44/(y1-y0+1));src=inkCanvas(Math.max(1,Math.round((x1-x0+1)*ratio)),Math.max(1,Math.round((y1-y0+1)*ratio)));const q=src.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(c,x0,y0,x1-x0+1,y1-y0+1,0,0,src.width,src.height);}
  }
  src ||= fallbackUnit(name);
  {const q=src.getContext('2d'),im=q.getImageData(0,0,src.width,src.height);for(let p=0;p<im.data.length;p+=4){if(!im.data[p+3])continue;let r=im.data[p],g=im.data[p+1],b=im.data[p+2],l=(r+g+b)/3;for(let k=0;k<3;k++)im.data[p+k]=Math.max(0,Math.min(255,(im.data[p+k]-l)*1.42+l*1.14+8));}q.putImageData(im,0,0);}
  SPR[name]=['idle','walk','attack'].flatMap(state=>[0,1,2,3].map(f=>pixelFrame(src,name,state,f)));
  SPRW[name]=SPR[name].map(whiteOf);SPRGRAY[name]=SPR[name].map(grayscaleSprite);
  if(MONSTER_TINT[name])SPRLEVEL[name]={2:SPR[name].map(s=>rankSprite(s,name,2)),3:SPR[name].map(s=>rankSprite(s,name,3))};
  URL_[name]=SPR[name][0].toDataURL();
 });
 // All interface art is built from the same atlas, with type-colored spell frames.
 Object.keys(CARDS).forEach(id=>{const name=HYBRID.cards[id]||({atk:'dragon',ctl:'espectro',sup:'alma',sum:'nigromante',ter:'comodin'}[CARDS[id].t]);const c=inkCanvas(96,64),g=c.getContext('2d');g.fillStyle='#171b2d';g.fillRect(0,0,96,64);g.imageSmoothingEnabled=false;g.drawImage(SPR[name][0],24,7,48,48);g.strokeStyle=({atk:'#ff6549',ctl:'#ad82ff',sup:'#78e1bc',sum:'#eab85a',ter:'#6ca6cb'}[CARDS[id].t]);g.lineWidth=2;g.strokeRect(3,3,90,58);for(let i=0;i<5;i++)g.fillRect(9+i*4,49-i*4,2,2);GOTHIC_DATA.cards[id]=c.toDataURL();});
 GOTHIC_DATA.relics=['dragon','esqueleto','alma','nigromante','comodin','caballero'].map(n=>URL_[n]);
 const strip=$('#heroCast');strip.innerHTML=['zombi','espectro','dragon','caballero'].map(n=>`<img src="${URL_[n]}" alt="${n}">`).join('');
}
