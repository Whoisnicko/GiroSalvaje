/* v7.72: presentation-only guardian concept extractions. Source cells are 144x96.
   Keep the approved gameplay pose timing, fallback, and logical entity geometry. */
const GUARDIAN72_ART=Object.freeze({
 url:'assets/guardians-v72.webp?v=22a7p72',w:144,h:96,
 names:Object.freeze(['zombi','espectro','dragon','nigromante','banshee','lobo','esqueleto'])
});
const GUARDIAN72_FRAMES=Object.create(null);
function guardian72Level(u){
 const raw=u.type==='K'?u.nl:u.temp?1:u.lvl;
 return Number.isInteger(raw)&&raw>=1&&raw<=3?raw:1;
}
function guardian72Frames(name,o={}){
 const entry=GUARDIAN72_FRAMES[name]?.[o.guardianLevel??o.level??1];
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
