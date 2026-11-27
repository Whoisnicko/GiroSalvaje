/* Visual-only champion and boss presentation. No combat or save mutations. */
const CHAMPION_BOSS_COLORS=Object.freeze({crusader:'#ffc080',huntsman:'#a5df91',inquisitor:'#a9eaff',paladin:'#ff9058',exorcist:'#e7bcff'});
const CHAMPION_DOCTRINE_COLORS=Object.freeze({berserker:'#e88c78',juggernaut:'#adcbe4',commander:'#f0ce85'});
let championFXOwner=null,championFX=[];
function championFXSync(){if(championFXOwner!==S){championFXOwner=S;championFX=[];}}
function championRelease(kind,id,x,y,radius=30){
 championFXSync();if(!feelEnabled()||!Number.isFinite(x)||!Number.isFinite(y))return;
 const rune=kind==='spell'?RUNE_DEFS.find(d=>d.id===id):null;
 const color=kind==='spell'?rune?.color:CHAMPION_BOSS_COLORS[id];if(!color)return;
 if(championFX.length>=24)championFX.shift();
 championFX.push({kind,id,x,y,r:Math.max(12,Math.min(90,radius||30)),color,points:rune?.points||null,at:feelClock,life:.42});
}
function championBossPose(e,pose,motion){
 if(!e.bossCast||pose.still||feelReduced())return {pose,motion};
 const d=bossDef(e);if(!d||!(d.windup>0))return {pose,motion};
 const q=Math.max(0,Math.min(1,1-e.bossCast.left/d.windup));
 const ranged=d.id==='huntsman',caster=d.id==='inquisitor'||d.id==='exorcist';
 return {pose:{...pose,frame:q>.72?9:8},motion:{...motion,ox:ranged?3*q:2*q,oy:caster?-3*q:1.5*q,rot:ranged?.045*q:caster?0:.085*q,sx:1+.035*q,sy:1-.035*q}};
}
function championHeroPose(h,t,descending=false){
 const still=feelReduced()||frostFrozen(h);
 const walk=!still&&!descending&&h.moving?Math.sin(t*13):0;
 const swing=still?0:h.martial?.counterFlash>0?Math.sin(t*24)*1.4:h.martial?.storm?Math.sin(t*16)*.9:h.lunge>0?h.lunge/.20:0;
 const branch=h.build?.rank?CHAMPION_DOCTRINE_COLORS[h.build.branch]:null;
 return {still,walk,swing,lean:still||descending?0:walk*.035-swing*.06,forward:still||descending?0:Math.max(0,swing)*3,cape:still?0:descending?-19:walk*4,branch};
}
function championDrawFX(){
 championFXSync();championFX=championFX.filter(f=>feelClock-f.at<f.life);
 if(!feelEnabled()){championFX=[];return;}
 const still=feelReduced(),soft=feelStrength();ctx.save();ctx.beginPath();ctx.rect(0,0,worldW(),WORLD_H);ctx.clip();
 let bossDetails=0;
 for(const f of championFX){
  const q=Math.max(0,Math.min(1,(feelClock-f.at)/f.life)),a=(1-q)*soft;
  const r=still?f.r:f.r*(.65+.35*q);ctx.save();ctx.translate(f.x,f.y);
  ctx.strokeStyle=f.color;ctx.globalAlpha=.75*a;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  if(f.points){ctx.globalAlpha=.9*a;ctx.lineWidth=2;ctx.beginPath();f.points.forEach((p,i)=>{const x=(p[0]-.5)*r*1.7,y=(p[1]-.5)*r*1.7;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
  else if(!still){if(bossDetails<(prefs.effects==='soft'?1:3)&&typeof bossPixelRelease==='function'&&bossPixelRelease(f,q,a)){bossDetails++;}else{ctx.fillStyle=f.color;for(let i=0;i<8;i++){const ang=i*Math.PI/4;ctx.fillRect(Math.round(Math.cos(ang)*r)-1,Math.round(Math.sin(ang)*r)-1,3,3);}}}
  ctx.restore();
 }ctx.restore();
}
