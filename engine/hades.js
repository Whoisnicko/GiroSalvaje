/* Hades: directional portrait animation, no gameplay state changes. */
const HADES_ATLAS='assets/ui/hades-gaze-v19.webp';
const HADES_FRAME=320;
const HADES_REACTION_ATLAS='assets/ui/hades-reaction-v19.webp';
let hadesReactionPromise=null;
function loadHadesReaction(){
 if(!hadesReactionPromise)hadesReactionPromise=new Promise(resolve=>{
  const img=new Image();img.onload=()=>resolve(img.naturalWidth===960&&img.naturalHeight===320);img.onerror=()=>resolve(false);img.src=HADES_REACTION_ATLAS;
 });
 return hadesReactionPromise;
}
// Frame 0: smile. Frames 1-2: alternating laugh. Then a satisfied smile.
function hadesReactionFrame(elapsed,reduced=false){
 if(elapsed<0)return -1;
 if(reduced)return elapsed<850?0:-1;
 if(elapsed<320)return 0;
 if(elapsed<1370)return [1,2,1,2,1,2,1][Math.floor((elapsed-320)/150)];
 if(elapsed<1750)return 0;
 return -1;
}
function showHadesReaction(portrait,frame){
 const active=frame>=0;
 portrait.classList.toggle('hades-reacting',active);
 portrait.classList.toggle('hades-laughing',frame>0);
 const sprite=portrait.querySelector('.hades-gaze');
 if(active)sprite.style.setProperty('--reaction-x',(frame*50)+'%');
 const quote=portrait.querySelector('.hades-caption p');
 if(quote)quote.textContent=active?'“An excellent choice, guardian.”':'“Power has a price, guardian.”';
}
let hadesAtlasPromise=null, hadesActive=null, hadesRAF=0;
let hadesPointer=null;
function loadHadesAtlas(){
 if(!hadesAtlasPromise)hadesAtlasPromise=new Promise(resolve=>{
  const img=new Image();
  img.onload=()=>resolve(img.naturalWidth===960&&img.naturalHeight===960);
  img.onerror=()=>resolve(false);
  img.src=HADES_ATLAS;
 });
 return hadesAtlasPromise;
}
function hadesDirection(dx,dy,deadzone=16){
 const d=Math.hypot(dx,dy);
 if(d<deadzone)return 4;
 const x=dx/d,y=dy/d;
 return (y<-.43?0:y>.43?2:1)*3+(x<-.43?0:x>.43?2:1);
}
function setHadesFrame(portrait,frame){
 if(portrait.dataset.gaze===String(frame))return;
 portrait.dataset.gaze=String(frame);
 const sprite=portrait.querySelector('.hades-gaze');
 sprite.style.setProperty('--gaze-x',((frame%3)*50)+'%');
 sprite.style.setProperty('--gaze-y',(Math.floor(frame/3)*50)+'%');
}
function stopHadesGaze(){
 if(hadesRAF)cancelAnimationFrame(hadesRAF);
 hadesRAF=0;hadesActive=null;
}
async function startHadesGaze(portrait,purchased=false){
 stopHadesGaze();if(!portrait)return;
 hadesActive=portrait;
 setHadesFrame(portrait,4);
 const reactionLoad=loadHadesReaction();
 if(!await loadHadesAtlas()||hadesActive!==portrait||!portrait.isConnected||portrait.closest('[hidden]'))return;
 let reactionReady=false,reactionStart=-1;
 reactionLoad.then(ok=>{reactionReady=ok;if(ok&&purchased&&hadesActive===portrait&&portrait.isConnected&&!portrait.closest('[hidden]'))reactionStart=performance.now();});
 if(purchased){const quote=portrait.querySelector('.hades-caption p');if(quote)quote.textContent='“An excellent choice, guardian.”';}
 portrait.classList.add('gaze-ready');
 const stage=portrait.querySelector('.hades-stage');
 let last=0, lastChange=0, nextSquint=performance.now()+4200, squintUntil=0, dx=0,dy=0, lastMove=performance.now();
 function tick(now){
  if(hadesActive!==portrait||!portrait.isConnected||portrait.closest('[hidden]')||portrait.closest('[inert]')){if(hadesActive===portrait)stopHadesGaze();return;}
  const reduced=prefs.reduced||motionPreference.matches;
  portrait.classList.toggle('hades-still',!!reduced);
  const dt=Math.min(50,last?now-last:16);last=now;
  let tx=0,ty=0;
  if(hadesPointer&&!reduced){
   const r=stage.getBoundingClientRect();
   tx=hadesPointer.x-(r.left+r.width*.57);
   ty=hadesPointer.y-(r.top+r.height*.18);
   lastMove=Math.max(lastMove,hadesPointer.at);
   if(hadesPointer.touch&&now-hadesPointer.at>1800){tx=0;ty=0;}
  }
  const k=1-Math.exp(-dt/85);dx+=(tx-dx)*k;dy+=(ty-dy)*k;
  let frame=reduced?4:hadesDirection(dx,dy,Math.max(14,stage.clientWidth*.05));
  // An occasional short, contemplative squint while the pointer is resting.
  if(!reduced&&now>=nextSquint){nextSquint=now+4800+Math.random()*2200;if(now-lastMove>1600&&frame===4)squintUntil=now+130;}
  if(!reduced&&frame===4&&now<squintUntil)frame=7;
  const reaction= reactionReady&&reactionStart>=0 ? hadesReactionFrame(now-reactionStart,reduced) : -1;
  const prior=portrait.dataset.reaction;
  if(prior!==String(reaction)){portrait.dataset.reaction=String(reaction);showHadesReaction(portrait,reaction);}
  if(reaction<0&&(reduced||now-lastChange>=100||now<squintUntil)){
   if(portrait.dataset.gaze!==String(frame)){setHadesFrame(portrait,frame);lastChange=now;}
  }
  hadesRAF=requestAnimationFrame(tick);
 }
 hadesRAF=requestAnimationFrame(tick);
}
document.addEventListener('pointermove',e=>{
 if(!hadesActive||e.pointerType==='touch')return;
 hadesPointer={x:e.clientX,y:e.clientY,at:performance.now(),touch:false};
},{passive:true});
document.addEventListener('pointerdown',e=>{
 if(hadesActive&&e.pointerType==='touch')hadesPointer={x:e.clientX,y:e.clientY,at:performance.now(),touch:true};
},{passive:true});
document.addEventListener('pointerout',e=>{if(e.relatedTarget===null)hadesPointer=null;},{passive:true});
window.addEventListener('blur',()=>{hadesPointer=null;});
