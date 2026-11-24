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
 if(feelReduced()||prefs.effects!=='full')return pose;
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
function feelDraw(layer){
 if(!feelEnabled())return;
 const soft=feelStrength(),still=feelReduced();
 ctx.save();ctx.beginPath();ctx.rect(0,0,worldW(),WORLD_H);ctx.clip();
 for(const e of feelEvents){
  const q=Math.min(1,e.age/e.life),a=1-q;
  if(e.kind==='soul'){
   if(layer!=='front')continue;
   const tx=WALL_X-8,ty=WORLD_H*.42;
   const x=e.x+(tx-e.x)*q,y=e.y+(ty-e.y)*q-(still?0:Math.sin(q*Math.PI)*32);
   ctx.globalAlpha=(.5+a*.5)*soft;ctx.fillStyle='#38cfff';ctx.fillRect(Math.round(x)-3,Math.round(y)-3,6,6);ctx.fillStyle='#e7ffff';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,2,2);
   continue;
  }
  const p=e.p,r=e.r*(.42+q*.9);
  if(layer==='ground'){
   if(!['fire','lightning','spell','altar','heal','death'].includes(e.kind))continue;
   const grad=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,Math.max(1,e.r*(1+q*.25)));
   grad.addColorStop(0,p.color);grad.addColorStop(1,'transparent');
   ctx.globalAlpha=a*.27*soft;ctx.fillStyle=grad;ctx.fillRect(e.x-e.r*1.3,e.y-e.r*1.3,e.r*2.6,e.r*2.6);
   ctx.globalAlpha=a*.8*soft;ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y+4,r,r*.49,0,0,Math.PI*2);ctx.stroke();
   continue;
  }
  ctx.globalAlpha=a*soft;
  if(e.kind==='fire'){
   // Pixel sparks and hot central flame, over an expanding ground shockwave.
   for(let i=0;i<12;i++){const ang=i*Math.PI*2/12+e.seed*6.28,rr=e.r*(.12+q*.88),x=e.x+Math.cos(ang)*rr,y=e.y+Math.sin(ang)*rr*.7-q*14;ctx.fillStyle=i%3===0?p.core:p.color;const z=Math.max(2,Math.round(5*a));ctx.fillRect(Math.round(x),Math.round(y),z,z*2);}
  }else if(e.kind==='heal'){
   for(let i=0;i<5;i++){const ang=i*1.256+e.seed*6.28,x=e.x+Math.cos(ang)*r*.6,y=e.y+Math.sin(ang)*r*.4-q*16;ctx.fillStyle=p.color;ctx.fillRect(Math.round(x)-1,Math.round(y)-4,3,9);ctx.fillRect(Math.round(x)-4,Math.round(y)-1,9,3);}
  }else{
   for(let i=0;i<6;i++){const ang=i*Math.PI/3+e.seed*6.28;ctx.strokeStyle=i%2?p.color:p.core;ctx.lineWidth=i%2?2:1;ctx.beginPath();ctx.moveTo(e.x+Math.cos(ang)*r*.38,e.y+Math.sin(ang)*r*.38);ctx.lineTo(e.x+Math.cos(ang)*r,e.y+Math.sin(ang)*r);ctx.stroke();}
  }
  if(q<.25){ctx.globalAlpha=(1-q*4)*.72*soft;ctx.fillStyle=p.core;ctx.fillRect(Math.round(e.x)-2,Math.round(e.y)-2,4,4);}
 }
 ctx.restore();
}
function feelNumber(x,y,value,kind='damage'){
 const n=Math.round(value);if(n<=0)return;
 const label=kind==='heal'?'+'+n:kind==='ally'||kind==='altar'?'-'+n:String(n);
 floatText(x,y,label,kind==='heal'?'leaf':kind==='ally'||kind==='altar'?'red':kind==='armor'?'muted':'cream',kind==='altar'?15:12);
}
