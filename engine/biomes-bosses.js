/* First biome and boss data. Existing kind IDs, art and save schema stay compatible. */
const BIOME_DATA=Object.freeze({
 valley:Object.freeze({id:'valley',name:'Valley of Souls',firstWave:1,lastWave:5,terrain:'Existing open battlefield',modifier:'None',bossId:'crusader'})
});
const BOSS_DATA=Object.freeze({
 crusader:Object.freeze({id:'crusader',name:'The Crusader',kind:'com',wave:5,ability:'Consecrated Sweep',radius:68,triggerRadius:56,windup:1.5,cooldown:8,damageFactor:.8,description:'Armored boss. Consecrated Sweep marks a fixed 68 px circle for 1.5 s, then deals 80% of its basic attack to guardians and the deployed hero inside. Spread out, use ranged guardians or root the boss to interrupt. Never damages the Altar.'})
});
function bossForWave(w){return Object.values(BOSS_DATA).find(d=>d.wave===w)||null;}
function bossDef(e){const d=BOSS_DATA[e?.bossId];return d&&e.kind===d.kind?d:null;}
function bossStamp(q,w){const d=bossForWave(w);return d&&q.kind===d.kind?{...q,bossId:d.id}:q;}
function enemyDisplayName(e){return bossDef(e)?.name||KIND[e.kind]?.n||'Human';}
function enemyDisplayNote(e){return bossDef(e)?.description||FOE_NOTE[e.kind]||'Human invader.';}
function bossNormalize(e){
 if(!bossDef(e)){delete e.bossId;delete e.bossCast;delete e.bossCooldown;return;}
 const d=bossDef(e);
 e.bossCooldown=Number.isFinite(e.bossCooldown)?Math.max(0,Math.min(d.cooldown,e.bossCooldown)):0;
 const c=e.bossCast;
 if(!c||![c.x,c.y,c.left].every(Number.isFinite)||c.left<=0||c.left>d.windup)delete e.bossCast;
}
function bossTargets(){return heroTargets().filter(u=>!u.down&&u.hp>0&&!infusionHidden(u));}
function bossAdvance(e,dt){
 const d=bossDef(e);if(!d||e.hp<=0)return false;
 e.bossCooldown=Math.max(0,(e.bossCooldown||0)-dt);
 if(spellEnemyRooted(e)){
  if(e.bossCast){delete e.bossCast;e.bossCooldown=d.cooldown;floatText(e.x,e.y-35,'Interrupted','soul',11);}
  return false;
 }
 if(e.bossCast){
  const c=e.bossCast;c.left-=dt;
  if(c.left>0)return true;
  delete e.bossCast;e.bossCooldown=d.cooldown;e.cd=Math.max(e.cd||0,.4);
  for(const u of bossTargets()){
   if(Math.hypot(u.x-c.x,u.y-c.y)>d.radius)continue;
   const dealt=heroDamageTarget(u,e.dmg*d.damageFactor);
   if(dealt>0){u.flash=.15;feelNumber(u.x,u.y-radius(u)-10,dealt,'ally');feelImpact(u.x,u.y,'steel',u,0,false);}
  }
  S.fx.push({k:'ring',x:c.x,y:c.y,r:d.radius,c:'gold',t:.5,T:.5});sfx('clash');
  return true;
 }
 if(e.bossCooldown>0||!bossTargets().some(u=>Math.hypot(u.x-e.x,u.y-e.y)<=d.triggerRadius))return false;
 e.bossCast={x:e.x,y:e.y,left:d.windup};
 floatText(e.x,e.y-35,d.ability,'gold',11);sfx('horn');return true;
}
function bossDrawWarnings(W){
 if(S.phase!=='fight')return;
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,WORLD_H);ctx.clip();
 for(const e of S.enemies){
  const d=bossDef(e),c=e.bossCast;if(!d||!c||e.hp<=0)continue;
  ctx.globalAlpha=.19;ctx.fillStyle='#c84230';ctx.beginPath();ctx.arc(c.x,c.y,d.radius,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;ctx.lineWidth=2;ctx.strokeStyle='#ffcc80';ctx.setLineDash([5,3]);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle='#ff765b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(c.x,c.y,d.radius-3,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,1-c.left/d.windup));ctx.stroke();
 }
 ctx.restore();
}
