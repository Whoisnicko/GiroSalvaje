/* Presentation-only animation profiles, using shipped atlas frames.
 No gameplay RNG, entity mutation, additional canvas allocations or saved state. */
const ANIM_PROFILES=Object.freeze({
 W:{idle:2,walk:5,bob:1.6,tilt:.055,reach:5,stretch:.035,style:'heavy'},
 A:{idle:4,walk:6,bob:2.1,tilt:.025,reach:2,stretch:.025,style:'float'},
 M:{idle:3,walk:6,bob:2.4,tilt:.04,reach:4,stretch:.055,style:'wing'},
 N:{idle:2.5,walk:5,bob:.7,tilt:.018,reach:1,stretch:.035,style:'cast'},
 B:{idle:3,walk:5,bob:2.1,tilt:.025,reach:1,stretch:.025,style:'float'},
 L:{idle:3,walk:12,bob:2.8,tilt:.085,reach:7,stretch:.08,style:'swift'},
 K:{idle:3,walk:9,bob:1.8,tilt:.065,reach:4,stretch:.04,style:'swift'},
 sol:{idle:3,walk:8,bob:1.5,tilt:.05,reach:4,stretch:.025,style:'heavy'},
 bal:{idle:2.5,walk:7,bob:1.2,tilt:.035,reach:2,stretch:.035,style:'ranged'},
 cab:{idle:2,walk:5,bob:1.4,tilt:.04,reach:4,stretch:.025,style:'heavy'},
 jin:{idle:3,walk:12,bob:3.2,tilt:.07,reach:7,stretch:.05,style:'swift'},
 cle:{idle:2.5,walk:5,bob:.8,tilt:.02,reach:1,stretch:.025,style:'cast'},
 ant:{idle:3,walk:9,bob:2,tilt:.05,reach:5,stretch:.035,style:'swift'},
 boss:{idle:1.8,walk:4,bob:1.7,tilt:.035,reach:5,stretch:.025,style:'heavy'}
});
const ANIM_NEUTRAL=Object.freeze({ox:0,oy:0,rot:0,sx:1,sy:1,alpha:1});
let animOwner=null,animMarks=new WeakMap(),animCorpses=[];
function animSync(state){if(animOwner!==state){animOwner=state;animMarks=new WeakMap();animCorpses=[];}}
function animProfile(u){return u.type?ANIM_PROFILES[u.type]||ANIM_PROFILES.W:u.boss?ANIM_PROFILES.boss:ANIM_PROFILES[u.kind]||(enemyRanged(u)?ANIM_PROFILES.bal:ANIM_PROFILES.sol);}
function animMark(u,kind){animSync(S);if(!u||feelReduced()||!feelEnabled())return;animMarks.set(u,{kind,at:feelClock});}
function animCorpse(e){
 animSync(S);if(!e||feelReduced()||!feelEnabled())return;
 if(animCorpses.length>=32)animCorpses.shift();
 animCorpses.push({name:enemySprite(e),x:e.x,y:e.y,size:(e.r*2+14)*1.28*(e.kind==='jin'?1.15:1),at:feelClock,life:e.boss?.72:.48,sign:e.x%2<1?-1:1});
}
function animPrune(){animSync(S);animCorpses=animCorpses.filter(c=>feelClock-c.at<c.life);}
function animMotion(u,pose,t,bench=false){
 animSync(S);if(pose.still||u.down||feelReduced())return ANIM_NEUTRAL;
 const p=animProfile(u),phase=Number.isFinite(u.ph)?u.ph:0,walk=!!u.moving&&!bench,attack=pose.frame>=8,rate=walk?p.walk:p.idle;
 const a=t*rate*Math.PI/2+phase,s=Math.sin(a),direction=u.type?(pose.flipX?-1:1):-1;
 let ox=0,oy=walk?-Math.abs(s)*p.bob:(p.style==='float'||p.style==='wing'?s*p.bob:s*p.bob*.18),rot=walk?s*p.tilt:0,sx=1,sy=1,alpha=1;
 if(walk){sy=1+Math.abs(s)*p.stretch;sx=1-(sy-1)*.55;}
 if(attack){
  const progress=[.12,1,.65,.12][Math.max(0,Math.min(3,pose.frame-8))];
  ox=direction*p.reach*progress;
  if(p.style==='ranged'){ox=-direction*p.reach*progress;rot=-direction*.045*progress;}
  else if(p.style==='cast'||p.style==='float'){oy-=2.5*progress;sy=1+.035*progress;}
  else{rot=direction*.08*progress;sy=1-.045*progress;sx=1+.06*progress;}
 }
 if(u.flash>0&&feelEnabled()){const q=Math.min(1,u.flash/.15);ox-=direction*2*q;sx*=1+.045*q;sy*=1-.035*q;}
 if(pose.rise<1){const q=(1-pose.rise)**2;rot+=q*Math.PI/2;oy+=q*4;alpha=1-q*.25;}
 const mark=animMarks.get(u);
 if(mark){const life=mark.kind==='fusion'?.52:.30,q=Math.max(0,Math.min(1,(feelClock-mark.at)/life));if(q>=1)animMarks.delete(u);else{const pulse=Math.sin(Math.PI*q);sy*=1+.09*pulse;sx*=1+.07*pulse;oy-=3*pulse;alpha*=.45+.55*Math.min(1,q*3);}}
 return {ox,oy,rot,sx,sy,alpha};
}
function animDrawCorpses(){
 animPrune();if(feelReduced()||!feelEnabled()){animCorpses=[];return;}
 for(const c of animCorpses){const q=Math.max(0,Math.min(1,(feelClock-c.at)/c.life));ctx.save();ctx.globalAlpha=(1-q)*.8*feelStrength();sprite(c.name,c.x,c.y+c.size*.14*q,c.size,{gray:true,rot:c.sign*Math.PI*.5*Math.min(1,q*2),sy:1-.18*q});ctx.restore();}
}
