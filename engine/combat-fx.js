/* Combat feedback only. No hit points, collision, resource or timer mutations. */
const FEEL=Object.freeze({
 steel:{color:'#b2d9f5',core:'#f4fbff',radius:19,life:.23,shake:0},
 flesh:{color:'#d57879',core:'#ffe0c2',radius:17,life:.22,shake:0},
 claw:{color:'#e177ff',core:'#fff0fd',radius:21,life:.25,shake:0},
 orb:{color:'#b476ff',core:'#f3ddff',radius:24,life:.30,shake:0},
 fire:{color:'#ff782e',core:'#fff1ac',radius:46,life:.48,shake:2.5},
 lightning:{color:'#40d9ff',core:'#f0ffff',radius:27,life:.30,shake:0},
 spell:{color:'#b5a2ff',core:'#f4e8ff',radius:30,life:.32,shake:0},
 heal:{color:'#8ee68a',core:'#e0ffc6',radius:22,life:.43,shake:0},
 death:{color:'#6ee8ff',core:'#e7ffff',radius:23,life:.46,shake:0},
 altar:{color:'#ff5753',core:'#ffd4a3',radius:36,life:.40,shake:3}
});
let feelState=null,feelClock=0,feelShake=0,feelHold=new WeakMap(),feelEvents=[];
function feelSync(state){
 if(state!==feelState){feelState=state;feelClock=0;feelShake=0;feelHold=new WeakMap();feelEvents=[];}
}
function feelReduced(){return prefs.reduced||motionPreference.matches;}
function feelEnabled(){return prefs.effects!=='off';}
function feelStrength(){return prefs.effects==='soft'?.48:1;}
function feelImpact(x,y,kind='steel',target=null,radius=0,heavy=false){
 feelSync(S);if(!feelEnabled()||!Number.isFinite(x)||!Number.isFinite(y))return;
 const p=FEEL[kind]||FEEL.steel;
 if(feelEvents.length>=96)feelEvents.shift();
 // Deterministic decoration; never consume the gameplay RNG.
 const seed=(Math.abs(Math.round(x*31+y*17+feelClock*1000))%997)/997;
 feelEvents.push({x,y,kind,p,r:radius||p.radius,age:0,life:p.life,seed});
 if(!feelReduced()){
  feelShake=Math.max(feelShake,p.shake*feelStrength());
  if(target&&heavy&&prefs.effects==='full')feelHold.set(target,{until:feelClock+.055,frame:null});
 }
}
function feelSoul(x,y){
 feelSync(S);if(!feelEnabled())return;
 if(feelEvents.length>=96)feelEvents.shift();
 feelEvents.push({x,y,kind:'soul',age:0,life:.55,seed:0});
}
function feelStep(dt){
 feelSync(S);feelClock+=Math.max(0,dt);
 feelShake=Math.max(0,feelShake-dt*16);
 for(const e of feelEvents)e.age+=dt;
 feelEvents=feelEvents.filter(e=>e.age<e.life);
}
function feelPose(entity,pose){
 if(pose.still||feelReduced()||prefs.effects!=='full')return pose;
 const h=feelHold.get(entity);
 if(!h||h.until<=feelClock)return pose;
 if(h.frame===null)h.frame=pose.frame;
 return {...pose,frame:h.frame};
}
function feelCamera(){
 if(feelReduced()||!feelEnabled())return {x:0,y:0};
 const v=Math.min(4,Math.max(feelShake,S.shake*feelStrength()));
 return {x:Math.sin(feelClock*97)*v,y:Math.cos(feelClock*73)*v*.6};
}
/* Draw budgets affect presentation only. Stored impacts remain capped at 96. */
const VFX_BUDGETS=Object.freeze({
 full:Object.freeze({impacts:32,lights:12,projectileLights:12,detailShots:32,sparks:12}),
 soft:Object.freeze({impacts:16,lights:5,projectileLights:5,detailShots:16,sparks:5}),
 reduced:Object.freeze({impacts:12,lights:0,projectileLights:0,detailShots:0,sparks:0}),
 off:Object.freeze({impacts:0,lights:0,projectileLights:0,detailShots:0,sparks:0})
});
function vfxBudget(){return !feelEnabled()?VFX_BUDGETS.off:feelReduced()?VFX_BUDGETS.reduced:prefs.effects==='soft'?VFX_BUDGETS.soft:VFX_BUDGETS.full;}
function vfxRecent(events,limit){
 if(limit<=0)return [];
 // Prioritize large effects and altar danger; then the newest ordinary hits.
 const important=[],other=[];
 for(let i=events.length-1;i>=0;i--){const e=events[i];if(e.kind==='fire'||e.kind==='altar')important.push(e);else other.push(e);}
 return important.slice(0,limit).concat(other.slice(0,Math.max(0,limit-important.length)));
}
function vfxGlow(x,y,r,color,alpha){
 if(!(r>0)||!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(r))return;
 const grad=ctx.createRadialGradient(x,y,0,x,y,r);
 grad.addColorStop(0,color);grad.addColorStop(.4,color);grad.addColorStop(1,'transparent');
 ctx.globalAlpha=alpha;ctx.fillStyle=grad;ctx.fillRect(x-r,y-r,r*2,r*2);
}
function vfxRing(x,y,rx,ry,color,alpha,width=1){
 ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;
 ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);ctx.stroke();
}
function vfxImpactFront(e,q,alpha,budget,still){
 const p=e.p,r=Math.min(110,Math.max(4,e.r)),a=alpha;
 const travel=still?0:q,spread=r*(.28+travel*.72);
 if(still){ctx.globalAlpha=a;ctx.fillStyle=p.core;ctx.fillRect(Math.round(e.x)-2,Math.round(e.y)-2,4,4);return;}
 const count=Math.min(budget.sparks,e.kind==='fire'?12:e.kind==='heal'?5:8);
 for(let i=0;i<count;i++){
  const ang=i*Math.PI*2/Math.max(1,count)+e.seed*6.283,
        x=e.x+Math.cos(ang)*spread,y=e.y+Math.sin(ang)*spread*.65-(e.kind==='fire'||e.kind==='heal'?travel*16:0);
  ctx.globalAlpha=a;ctx.fillStyle=i%3===0?p.core:p.color;ctx.strokeStyle=ctx.fillStyle;
  if(e.kind==='fire'){const z=Math.max(1,Math.round(5*(1-q)));ctx.fillRect(Math.round(x),Math.round(y),z,z*2);}
  else if(e.kind==='heal'){ctx.fillRect(Math.round(x)-1,Math.round(y)-4,3,9);ctx.fillRect(Math.round(x)-4,Math.round(y)-1,9,3);}
  else if(e.kind==='orb'||e.kind==='death'){const z=Math.max(1,Math.round(4*(1-q)));ctx.fillRect(Math.round(x)-z,Math.round(y),z*2,1);ctx.fillRect(Math.round(x),Math.round(y)-z,1,z*2);}
  else {ctx.lineWidth=i%2?2:1;ctx.beginPath();ctx.moveTo(e.x+Math.cos(ang)*spread*.46,e.y+Math.sin(ang)*spread*.3);ctx.lineTo(x,y);ctx.stroke();}
 }
 if(e.kind==='fire'||e.kind==='orb'||e.kind==='altar'){
  vfxRing(e.x,e.y,spread,spread*.65,p.color,a*.8,2);
  if(q<.35)vfxRing(e.x,e.y,spread*.65,spread*.42,p.core,a*.75,1);
 }
 if(q<.25){ctx.globalAlpha=(1-q*4)*.72*alpha;ctx.fillStyle=p.core;ctx.fillRect(Math.round(e.x)-2,Math.round(e.y)-2,4,4);}
}
function feelDraw(layer){
 const budget=vfxBudget();if(!budget.impacts)return;
 const soft=feelStrength(),still=feelReduced();let lights=budget.lights;
 ctx.save();ctx.beginPath();ctx.rect(0,0,worldW(),WORLD_H);ctx.clip();
 for(const e of vfxRecent(feelEvents,budget.impacts)){
  const q=Math.max(0,Math.min(1,e.age/e.life)),a=1-q;
  if(e.kind==='soul'){
   if(layer!=='front')continue;
   const tx=WALL_X-8,ty=WORLD_H*.42,x=still?e.x:e.x+(tx-e.x)*q,y=still?e.y:e.y+(ty-e.y)*q-Math.sin(q*Math.PI)*32;
   ctx.globalAlpha=(.5+a*.5)*soft;ctx.fillStyle='#38cfff';ctx.fillRect(Math.round(x)-3,Math.round(y)-3,6,6);ctx.fillStyle='#e7ffff';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,2,2);continue;
  }
  if(layer==='ground'){
   if(still||lights<=0||!['fire','lightning','orb','spell','altar','heal','death'].includes(e.kind))continue;
   const r=Math.min(110,Math.max(4,e.r)),p=e.p;lights--;
   vfxGlow(e.x,e.y,r*(1+q*.25),p.color,a*.23*soft);
   vfxRing(e.x,e.y+4,r*(.42+q*.9),r*(.42+q*.9)*.49,p.color,a*.65*soft,1.5);
  }else vfxImpactFront(e,q,a*soft,budget,still);
 }
 ctx.restore();
}
function vfxProjectilePalette(s){
 return s.k==='reaper'?{dark:'#1a777c',mid:'#5de8e1',core:'#e0ffff',radius:18}:s.frostfire?{dark:'#245f9b',mid:'#62d0ff',core:'#e6fbff',radius:22}:s.k==='fire'?{dark:'#b74725',mid:'#ff9b43',core:'#fff0ad',radius:22}:s.k==='orb'?{dark:'#6038ae',mid:'#c391ff',core:'#f0e3ff',radius:16}:s.burnDuration?{dark:'#a74125',mid:'#ff9452',core:'#ffe5b4',radius:10}:{dark:'#715443',mid:'#e9ba68',core:'#fff2cf',radius:8};
}
function vfxProjectileLights(shots){
 const budget=vfxBudget();if(!budget.projectileLights||!shots.length)return;
 let left=budget.projectileLights;ctx.save();ctx.beginPath();ctx.rect(0,0,worldW(),WORLD_H);ctx.clip();
 for(let i=shots.length-1;i>=0&&left>0;i--){
  const s=shots[i];if(s.k!=='fire'&&s.k!=='orb'&&s.k!=='reaper'&&!s.burnDuration)continue;
  if(!Number.isFinite(s.x)||!Number.isFinite(s.y))continue;
  const p=vfxProjectilePalette(s);vfxGlow(s.x,s.y,p.radius,p.mid,.13*feelStrength());left--;
 }
 ctx.restore();
}
function vfxShotBody(s,t,detail=true){
 const p=vfxProjectilePalette(s),budget=vfxBudget(),extra=detail&&budget.detailShots>0;
 const angle=Number.isFinite(s.ang)?s.ang:Math.atan2((s.ty??s.y)-s.y,(s.tx??s.x)-s.x)||0;
 ctx.save();ctx.translate(Math.round(s.x),Math.round(s.y));ctx.rotate(angle);
 if(!extra){
  ctx.fillStyle=p.core;ctx.fillRect(s.k==='bolt'?-7:-3,-2,s.k==='bolt'?13:6,4);
  ctx.restore();return;
 }
 ctx.globalAlpha=feelStrength();
 if(s.k==='reaper'){ctx.fillStyle=p.mid;ctx.beginPath();ctx.moveTo(-8,-12);ctx.quadraticCurveTo(20,0,-8,12);ctx.quadraticCurveTo(4,0,-8,-12);ctx.fill();ctx.strokeStyle=p.core;ctx.lineWidth=2;ctx.stroke();}else if(s.k==='fire'){
  for(let i=0;i<7;i++){const x=-i*4,z=Math.max(2,7-i),y=Math.round(Math.sin(t*14+i*.8)*i*.42);ctx.fillStyle=i<2?p.core:i<4?p.mid:p.dark;ctx.fillRect(x-z/2,y-z/2,z,z);}
  ctx.fillStyle=p.mid;ctx.fillRect(-4,-5,9,10);ctx.fillStyle=p.core;ctx.fillRect(0,-3,6,6);
 }else if(s.k==='orb'){
  for(let i=0;i<6;i++){const x=-i*4,y=Math.round(Math.sin(t*10+i*.9)*3);ctx.fillStyle=i<2?p.mid:p.dark;ctx.fillRect(x-2,y-1,4,3);}
  ctx.fillStyle=p.dark;ctx.fillRect(-5,-5,10,10);ctx.fillStyle=p.mid;ctx.fillRect(-3,-4,7,8);ctx.fillStyle=p.core;ctx.fillRect(0,-2,4,4);
 }else{
  ctx.fillStyle=p.dark;ctx.fillRect(-17,-3,9,6);ctx.fillStyle=p.mid;ctx.fillRect(-15,-1,21,2);
  ctx.fillStyle=p.core;ctx.fillRect(3,-2,5,4);
 }
 ctx.restore();
}
function feelNumber(x,y,value,kind='damage'){
 const n=Math.round(value);if(n<=0)return;
 const label=kind==='heal'?'+'+n:kind==='ally'||kind==='altar'?'-'+n:String(n);
 floatText(x,y,label,kind==='heal'?'leaf':kind==='ally'||kind==='altar'?'red':kind==='armor'?'muted':'cream',kind==='altar'?15:12);
}
