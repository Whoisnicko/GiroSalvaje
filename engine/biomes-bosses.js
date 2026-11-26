/* First biome and boss data. Existing kind IDs, art and save schema stay compatible. */
const BIOME_DATA=Object.freeze({
 valley:Object.freeze({id:'valley',name:'Valley of Souls',firstWave:1,lastWave:5,terrain:'Existing open battlefield',modifier:'None',bossId:'crusader',backdrop:'valley'}),
 forest:Object.freeze({id:'forest',name:'Cursed Forest',firstWave:1,lastWave:5,terrain:'Cover and tangled ground',modifier:'Cover -25% projectile damage; brambles -30% walking speed',bossId:'huntsman',backdrop:'forest'})
});
const BOSS_DATA=Object.freeze({
 crusader:Object.freeze({id:'crusader',name:'The Crusader',sprite:'caballero',kind:'com',wave:5,ability:'Consecrated Sweep',radius:68,triggerRadius:56,windup:1.5,cooldown:8,damageFactor:.8,description:'Armored boss. Consecrated Sweep marks a fixed 68 px circle for 1.5 s, then deals 80% of its basic attack to guardians and the deployed hero inside. Spread out, use ranged guardians or root the boss to interrupt. Never damages the Altar.'}),
 huntsman:Object.freeze({id:'huntsman',name:'The Grand Huntsman',sprite:'ballestero',kind:'com',wave:5,ability:'Hunter’s Mark',radius:38,triggerRadius:180,windup:2,cooldown:8,damageFactor:1.4,range:150,hpFactor:.75,damageScale:.8,description:'Ranged boss. Marks the position of the nearest visible guardian or deployed hero within 180 px. After 2 s, a volley hits targets inside the fixed 38 px circle for 140% basic attack. Cover reduces damage; roots interrupt. No special Altar damage.'})
});
function biomeId(state){return state?.biomeId==='forest'?'forest':'valley';}
function biomeDef(state){return BIOME_DATA[biomeId(state)];}
function bossForWave(w,region='valley'){const d=BOSS_DATA[BIOME_DATA[region]?.bossId];return d?.wave===w?d:null;}
function bossDef(e){const d=BOSS_DATA[e?.bossId];return d&&e.kind===d.kind?d:null;}
function bossStamp(q,w,region='valley'){const d=bossForWave(w,region);return d&&q.kind===d.kind?{...q,bossId:d.id,...(d.range?{range:d.range,hp:q.hp*d.hpFactor,dmg:q.dmg*d.damageScale}: {})}:q;}
function enemySprite(e){return bossDef(e)?.sprite||KIND[e.kind].spr;}
function enemyRanged(e){return e.kind==='bal'||bossDef(e)?.id==='huntsman';}
function enemyDisplayName(e){return bossDef(e)?.name||KIND[e.kind]?.n||'Human';}
function enemyDisplayNote(e){return bossDef(e)?.description||(e.kind==='com'?'Classic armored Commander. Uses ordinary melee attacks, without a regional special ability.':FOE_NOTE[e.kind]||'Human invader.');}
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
   const dealt=heroDamageTarget(u,e.dmg*d.damageFactor*(d.id==='huntsman'?biomeProjectileFactor(u):1));
   if(dealt>0){u.flash=.15;feelNumber(u.x,u.y-radius(u)-10,dealt,'ally');feelImpact(u.x,u.y,'steel',u,0,false);}
  }
  S.fx.push({k:'ring',x:c.x,y:c.y,r:d.radius,c:'gold',t:.5,T:.5});sfx('clash');
  return true;
 }
 if(e.bossCooldown>0)return false;
 const target=bossTargets().filter(u=>Math.hypot(u.x-e.x,u.y-e.y)<=d.triggerRadius).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];if(!target)return false;
 e.bossCast={x:d.id==='huntsman'?target.x:e.x,y:d.id==='huntsman'?target.y:e.y,left:d.windup};
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

/* Deterministic world-space ellipses. No stored coordinates or collision changes. */
const FOREST_ZONES=Object.freeze([
 Object.freeze({kind:'cover',x:.24,y:.29,rx:.085,ry:34}),
 Object.freeze({kind:'cover',x:.59,y:.73,rx:.085,ry:34}),
 Object.freeze({kind:'bramble',x:.43,y:.63,rx:.09,ry:39}),
 Object.freeze({kind:'bramble',x:.76,y:.28,rx:.085,ry:39})
]);
function biomeZones(state=S,W=worldW()){return biomeId(state)==='forest'?FOREST_ZONES.map(z=>({...z,x:z.x*W,y:z.y*WORLD_H,rx:Math.max(25,z.rx*W)})):[];}
function biomeContains(u,kind,state=S,W=worldW()){return !!u&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&biomeZones(state,W).some(z=>z.kind===kind&&((u.x-z.x)/z.rx)**2+((u.y-z.y)/z.ry)**2<=1);}
function biomeProjectileFactor(u,state=S,W=worldW()){return biomeContains(u,'cover',state,W)?.75:1;}
function biomeWalkFactor(u,state=S,W=worldW()){return biomeContains(u,'bramble',state,W)?.7:1;}
function biomeDraw(W){
 if(biomeId(S)!=='forest')return;
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,WORLD_H);ctx.clip();
 for(const z of biomeZones(S,W)){
  const cover=z.kind==='cover',color=cover?'#8dc7a0':'#d5ad68';
  ctx.fillStyle=cover?'#1d6544':'#664725';ctx.globalAlpha=.36;ctx.beginPath();ctx.ellipse(z.x,z.y,z.rx,z.ry,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.9;ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.setLineDash(cover?[5,4]:[2,4]);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#101c18';ctx.globalAlpha=.85;ctx.fillRect(z.x-31,z.y-z.ry+4,62,12);ctx.globalAlpha=1;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 9px monospace';ctx.fillText(cover?'COVER':'BRAMBLES',z.x,z.y-z.ry+10);
 }
 ctx.restore();
}
function biomeRegionChoice(){const el=document.getElementById('campaignRegion');return el?.value==='forest'&&biomeUnlocked('forest')?'forest':'valley';}
function biomeUnlocked(id){return id==='valley'||(id==='forest'&&campaignProfileInit().forestUnlocked===true);}
function biomeUnlockForest(){const p=campaignProfileInit();return p.forestUnlocked===true||campaignProfileCommit({...p,forestUnlocked:true});}
function biomeMenu(){const el=document.getElementById('campaignRegion');if(!el)return;const option=el.querySelector('option[value="forest"]'),unlocked=biomeUnlocked('forest');option.disabled=!unlocked;option.textContent=unlocked?'Cursed Forest':'Cursed Forest · locked';const length=document.getElementById('campaignLength');if(el.value==='forest'&&!unlocked)el.value='valley';if(el.value==='forest')length.value='5';length.disabled=el.value==='forest';document.getElementById('regionHint').textContent=el.value==='forest'?'Five waves · cover, brambles and the Grand Huntsman.':unlocked?'Cursed Forest unlocked. Select a region to begin.':'Defeat the fifth-wave boss in the Valley to unlock Cursed Forest.';}
