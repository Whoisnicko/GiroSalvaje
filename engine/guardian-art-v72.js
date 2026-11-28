/* v7.72: presentation-only guardian concept extractions. Source cells are 144x96.
   Keep the approved gameplay pose timing, fallback, and logical entity geometry. */
const GUARDIAN72_ART=Object.freeze({
 url:'assets/guardians-v72.webp?v=22a7p72',w:144,h:96,
 names:Object.freeze(['zombi','espectro','dragon','nigromante','banshee','lobo','esqueleto'])
});
const GUARDIAN72_FRAMES=Object.create(null);
const GUARDIAN72_BOUNDS=Object.create(null);
// Cropped evolved concept art has been rejected in the battlefield playtest.
// Keep only approved-for-preview base silhouettes active; preserve old tier art until redraw.
const GUARDIAN73_ART=Object.freeze({url:'assets/guardians-v73.webp?v=22a7p73',w:160,h:128});
const GUARDIAN73_READY=Object.create(null);
function guardian72Playable(level,name){return level===1||GUARDIAN73_READY[name]?.[level]===true;}
function guardian72Bounds(data,w,h){
 if(data.length!==w*h*4)return null;
 let l=w,t=h,r=-1,b=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 return r>=l?{l,t,r:r+1,b:b+1,w:r-l+1,h:b-t+1}:null;
}
function guardian72Geometry(name,level,s){
 if(!guardian72Playable(level,name))return null;
 const b=GUARDIAN72_BOUNDS[name]?.[level];if(!b)return null;
 const evolved=level>1;
 const maxWidth=(evolved?(name==='dragon'?1.65:level===3?1.48:1.32):(name==='dragon'?1.40:name==='zombi'?1.12:1.15))*s;
 const k=Math.min(s*(evolved ? .94:.88)/b.h,maxWidth/b.w);
 const foot=s*.5-2;
 return {k,x:-(b.l+b.w/2)*k,y:foot-b.b*k,top:foot-b.h*k,foot,width:b.w*k};
}
function guardian72Level(u){
 const raw=u.type==='K'?u.nl:u.temp?1:u.lvl;
 return Number.isInteger(raw)&&raw>=1&&raw<=3?raw:1;
}
function guardian72Frames(name,o={}){
 const level=o.guardianLevel??o.level??1;
 if(!guardian72Playable(level,name))return null;
 const entry=GUARDIAN72_FRAMES[name]?.[level];
 return entry?.[o.flash?'white':o.gray?'gray':'base']||null;
}
function guardian72Enabled(){return typeof location==='undefined'||new URLSearchParams(location.search).get('guardians')!=='original';}
function guardian72Offsets(name,frame){
 const f=frame%4,ghost=name==='espectro'||name==='banshee';
 return [frame>=8?[0,1,3,1][f]:0,frame>=4&&frame<8?[0,-2,0,-2][f]:ghost?[0,-1,-3,-1][f]:[0,0,-1,0][f]];
}
function installGuardian72(sheet){
 const {w,h,names}=GUARDIAN72_ART;
 if(!sheet||sheet.width!==w*3||sheet.height!==h*names.length)return 0;
 let installed=0;
 names.forEach((name,row)=>{
  for(let tier=1;tier<=3;tier++){
   try{
    const base=inkCanvas(w,h),g=base.getContext('2d');
    g.imageSmoothingEnabled=false;g.drawImage(sheet,(tier-1)*w,row*h,w,h,0,0,w,h);
    const alpha=g.getImageData(0,0,w,h).data;
    if(!alpha.some((v,i)=>i%4===3&&v>100))continue;
    const bounds=guardian72Bounds(alpha,w,h);if(bounds)(GUARDIAN72_BOUNDS[name]||(GUARDIAN72_BOUNDS[name]={}))[tier]=bounds;
    const variants={base:[],white:[],gray:[]},cache=new Map();
    for(let frame=0;frame<12;frame++){
     const [dx,dy]=guardian72Offsets(name,frame);
     for(const mode of Object.keys(variants)){
      const key=mode+':'+dx+','+dy;
      let c=cache.get(key);
      if(!c){
       c=inkCanvas(w,h);const p=c.getContext('2d');p.imageSmoothingEnabled=false;
       if(mode==='gray')p.filter='grayscale(1)';
       p.drawImage(base,dx,dy);p.filter='none';
       if(mode==='white'){p.globalCompositeOperation='source-atop';p.fillStyle='rgba(255,255,255,.85)';p.fillRect(0,0,w,h);p.globalCompositeOperation='source-over';}
       cache.set(key,c);
      }
      variants[mode].push(c);
     }
    }
    // Portraits use the exact same silhouette with the square icon bounds intact.
    let portrait=null;
    if(tier===1){const c=inkCanvas(96,96),p=c.getContext('2d');p.imageSmoothingEnabled=false;p.drawImage(base,0,16,96,64);portrait=c.toDataURL('image/png');}
    (GUARDIAN72_FRAMES[name]||(GUARDIAN72_FRAMES[name]={}))[tier]=variants;
    if(portrait)URL_[name]=portrait;
    installed++;
   }catch(e){console.warn('Guardian 72 fallback',name,tier,e);}
  }
 });
 return installed;
}

/* Reconstructed full-body, independently extracted sprites; only activate valid cells.
   Existing tier I, legacy fallback and gameplay frame timing stay intact. */
function installGuardian73(sheet){
 const {w,h}=GUARDIAN73_ART,names=GUARDIAN72_ART.names;
 if(!sheet||sheet.width!==w*2||sheet.height!==h*names.length)return 0;
 let installed=0;
 names.forEach((name,row)=>{for(let level=2;level<=3;level++){
  try{
   const base=inkCanvas(w,h),g=base.getContext('2d');g.imageSmoothingEnabled=false;
   g.drawImage(sheet,(level-2)*w,row*h,w,h,0,0,w,h);
   const data=g.getImageData(0,0,w,h).data,b=guardian72Bounds(data,w,h);
   if(!b||b.l<3||b.t<3||b.r>w-3||b.b>h-3||b.w<16||b.h<16)continue;
   const variants={base:[],white:[],gray:[]},cache=new Map();
   for(let frame=0;frame<12;frame++){
    const [dx,dy]=guardian72Offsets(name,frame);
    for(const mode of Object.keys(variants)){
     const key=mode+':'+dx+','+dy;let c=cache.get(key);
     if(!c){c=inkCanvas(w,h);const p=c.getContext('2d');p.imageSmoothingEnabled=false;
      if(mode==='gray')p.filter='grayscale(1)';p.drawImage(base,dx,dy);p.filter='none';
      if(mode==='white'){p.globalCompositeOperation='source-atop';p.fillStyle='rgba(255,255,255,.85)';p.fillRect(0,0,w,h);p.globalCompositeOperation='source-over';}
      cache.set(key,c);}
     variants[mode].push(c);
    }
   }
   (GUARDIAN72_FRAMES[name]||(GUARDIAN72_FRAMES[name]={}))[level]=variants;
   (GUARDIAN72_BOUNDS[name]||(GUARDIAN72_BOUNDS[name]={}))[level]=b;
   (GUARDIAN73_READY[name]||(GUARDIAN73_READY[name]={}))[level]=true;installed++;
  }catch(e){console.warn('Guardian 73 fallback',name,level,e);}
 }});return installed;
}
