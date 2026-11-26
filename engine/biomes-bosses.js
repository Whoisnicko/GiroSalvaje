/* First biome and boss data. Existing kind IDs, art and save schema stay compatible. */
const BIOME_DATA=Object.freeze({
 valley:Object.freeze({id:'valley',name:'Valley of Souls',firstWave:1,lastWave:5,terrain:'Existing open battlefield',modifier:'None',bossId:'crusader',backdrop:'valley'}),
 forest:Object.freeze({id:'forest',name:'Cursed Forest',firstWave:1,lastWave:5,terrain:'Cover and tangled ground',modifier:'Cover -25% projectile damage; brambles -30% walking speed',bossId:'huntsman',backdrop:'forest'}),
 frozen:Object.freeze({id:'frozen',name:'Frozen Wasteland',firstWave:1,lastWave:5,terrain:'Ice patches and periodic blizzards',modifier:'Ice changes walking inertia; blizzard −30% ranged reach',bossId:'inquisitor',backdrop:'frozen'})
});
const BOSS_DATA=Object.freeze({
 crusader:Object.freeze({id:'crusader',name:'The Crusader',sprite:'caballero',kind:'com',wave:5,ability:'Consecrated Sweep',radius:68,triggerRadius:56,windup:1.5,cooldown:8,damageFactor:.8,description:'Armored boss. Consecrated Sweep marks a fixed 68 px circle for 1.5 s, then deals 80% of its basic attack to guardians and the deployed hero inside. Spread out, use ranged guardians or root the boss to interrupt. Never damages the Altar.'}),
 huntsman:Object.freeze({id:'huntsman',name:'The Grand Huntsman',sprite:'ballestero',kind:'com',wave:5,ability:'Hunter’s Mark',radius:38,triggerRadius:180,windup:2,cooldown:8,damageFactor:1.4,range:150,hpFactor:.75,damageScale:.8,description:'Ranged boss. Marks the position of the nearest visible guardian or deployed hero within 180 px. After 2 s, a volley hits targets inside the fixed 38 px circle for 140% basic attack. Cover reduces damage; roots interrupt. No special Altar damage.'}),
 inquisitor:Object.freeze({id:'inquisitor',name:'The Frost Inquisitor',sprite:'clerigo',kind:'com',wave:5,ability:'Glacial Prison',radius:55,triggerRadius:180,windup:2,cooldown:12,damageFactor:.6,freezeDuration:3,description:'Armored melee boss. Marks the densest nearby cluster of guardians or deployed Warlord. After 2 s, deals 60% basic attack within 55 px and freezes victims for 3 s. Roots interrupt the cast. Never freezes or damages the Altar with this ability.'})
});
/* Regional enemies may define exclusive optional art. Counts replace ordinary slots, never add to them. */
const REGIONAL_ENEMIES=Object.freeze({
 pathfinder:Object.freeze({n:'Pathfinder',spr:'soldado',art:'forestPathfinder',hp:.65,dmg:.75,sp:1.65,r:10,region:'forest',firstWave:1,counts:Object.freeze([1,1,1,2,2]),brambleImmune:true,marker:'#e4c78b',badge:'P',description:'Fast scout. Ignores the 30% Brambles walking penalty, but roots and spell slows still apply.'}),
 ranger:Object.freeze({n:'Forest Ranger',spr:'ballestero',art:'forestRanger',hp:.8,dmg:.85,sp:1.05,r:11,range:150,region:'forest',firstWave:2,counts:Object.freeze([0,1,1,2,2]),seekCover:true,coverSearch:115,marker:'#91dba8',badge:'R',description:'Seeks nearby Cover when it can fire from there. Receives the ordinary 25% projectile protection while inside. Does not retreat endlessly or ignore taunts.'}),
 purifier:Object.freeze({n:'Forest Purifier',spr:'incendiario',art:'forestPurifier',hp:1,dmg:.95,sp:.8,r:12,range:120,region:'forest',firstWave:3,counts:Object.freeze([0,0,1,1,2]),ignoreCover:true,marker:'#ffb477',badge:'F',description:'Incendiary ranged attacker. Its flaming bolts ignore Cover protection but not other defenses. Attacks guardians and the Altar normally, without the Arsonist triple damage.'}),
 frostSentinel:Object.freeze({n:'Frost Sentinel',spr:'caballero',hp:2.1,dmg:1.05,sp:.65,r:12,armor:true,region:'frozen',firstWave:1,counts:Object.freeze([1,1,1,2,2]),slowResistance:.5,marker:'#a9d8f4',badge:'S',description:'Armored tank. Halves the strength of spell slowing effects; roots and freezes still stop it.'}),
 iceMarksman:Object.freeze({n:'Ice Marksman',spr:'ballestero',hp:.8,dmg:.9,sp:.9,r:11,range:150,region:'frozen',firstWave:2,counts:Object.freeze([0,1,1,2,2]),blizzardImmune:true,marker:'#b5f4ff',badge:'I',description:'Ranged specialist. Retains full 150 px reach during a blizzard.'}),
 frostHerald:Object.freeze({n:'Frost Herald',spr:'clerigo',hp:.9,dmg:.7,sp:.8,r:11,region:'frozen',firstWave:3,counts:Object.freeze([0,0,1,1,2]),pulseRadius:85,pulseCooldown:6,pulseDuration:2,pulseSlow:.3,marker:'#aeb8ff',badge:'H',description:'Melee support. Every 6 s, chills nearby guardians and deployed Warlord within 85 px, reducing walking speed by 30% for 2 s. Does not stack or freeze.'})
});
function regionalDef(e){return REGIONAL_ENEMIES[e?.kind]||null;}
function regionalSlots(w,region){return Object.entries(REGIONAL_ENEMIES).flatMap(([id,d])=>d.region===region?Array(d.counts[w-1]||0).fill(id):[]);}
function regionalEnemyAllowed(kind,region){const d=REGIONAL_ENEMIES[kind];return !d||d.region===region;}
function regionalShotFactor(shot,target){return shot.ignoreCover?1:biomeProjectileFactor(target);}
function regionalRangerCover(e,targets,forcedHero,W){
 const d=regionalDef(e);
 if(!d?.seekCover||biomeId(S)!==d.region||forcedHero||S.charge||spellEnemyRooted(e))return null;
 if(biomeContains(e,'cover',S,W))return null;
 let best=null,bestDistance=Infinity;
 for(const z of biomeZones(S,W)){
  if(z.kind!=='cover'||z.x>e.x+8)continue;
  const distance=Math.hypot(z.x-e.x,z.y-e.y);
  if(distance<2||distance>d.coverSearch||distance>=bestDistance)continue;
  const firing=z.x-WALL_X<=e.range||targets.some(u=>!u.down&&u.hp>0&&!infusionHidden(u)&&Math.hypot(z.x-u.x,z.y-u.y)<=e.range);
  if(firing){best=z;bestDistance=distance;}
 }
 return best;
}
function biomeId(state){return Object.hasOwn(BIOME_DATA,state?.biomeId)?state.biomeId:'valley';}
function biomeDef(state){return BIOME_DATA[biomeId(state)];}
function bossForWave(w,region='valley'){const d=BOSS_DATA[BIOME_DATA[region]?.bossId];return d?.wave===w?d:null;}
function bossDef(e){const d=BOSS_DATA[e?.bossId];return d&&e.kind===d.kind?d:null;}
function bossStamp(q,w,region='valley'){const d=bossForWave(w,region);return d&&q.kind===d.kind?{...q,bossId:d.id,...(d.range?{range:d.range,hp:q.hp*d.hpFactor,dmg:q.dmg*d.damageScale}: {})}:q;}
function enemySprite(e){const boss=bossDef(e);if(boss?.sprite)return boss.sprite;const k=KIND[e.kind],art=k.art;return art&&typeof SPR!=='undefined'&&SPR[art]?.length?art:k.spr;}
function enemyRanged(e){return e.kind==='bal'||!!regionalDef(e)?.range||bossDef(e)?.id==='huntsman';}
function enemyDisplayName(e){return bossDef(e)?.name||KIND[e.kind]?.n||'Human';}
function enemyDisplayNote(e){return bossDef(e)?.description||regionalDef(e)?.description||(e.kind==='com'?'Classic armored Commander. Uses ordinary melee attacks, without a regional special ability.':FOE_NOTE[e.kind]||'Human invader.');}
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
   if(d.freezeDuration&&u.hp>0&&!u.down&&!(heroIsTarget(u)&&martialInvulnerable())){u.frostUntil=Math.max(u.frostUntil||0,S.fightT+d.freezeDuration);frostClearMotion(u);floatText(u.x,u.y-32,'Frozen','soul',11);}
   if(dealt>0){u.flash=.15;feelNumber(u.x,u.y-radius(u)-10,dealt,'ally');feelImpact(u.x,u.y,'steel',u,0,false);}
  }
  S.fx.push({k:'ring',x:c.x,y:c.y,r:d.radius,c:'gold',t:.5,T:.5});sfx('clash');
  return true;
 }
 if(e.bossCooldown>0)return false;
 const targets=bossTargets(),near=targets.filter(u=>Math.hypot(u.x-e.x,u.y-e.y)<=d.triggerRadius);let target=null,best=-Infinity;
 for(const u of near){const distance=Math.hypot(u.x-e.x,u.y-e.y),score=d.freezeDuration?targets.filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<=d.radius).length*1000-distance:-distance;if(score>best){best=score;target=u;}}
 if(!target)return false;
 e.bossCast={x:d.id==='huntsman'||d.freezeDuration?target.x:e.x,y:d.id==='huntsman'||d.freezeDuration?target.y:e.y,left:d.windup};
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
 Object.freeze({kind:'cover',x:.52,y:.28,rx:.085,ry:34}),
 Object.freeze({kind:'cover',x:.26,y:.65,rx:.085,ry:34}),
 Object.freeze({kind:'bramble',x:.50,y:.66,rx:.09,ry:39}),
 Object.freeze({kind:'bramble',x:.77,y:.30,rx:.085,ry:39})
]);
const FROZEN_ZONES=Object.freeze([
 Object.freeze({kind:'ice',x:.28,y:.34,rx:.095,ry:40}),
 Object.freeze({kind:'ice',x:.52,y:.68,rx:.105,ry:43}),
 Object.freeze({kind:'ice',x:.77,y:.35,rx:.095,ry:42})
]);
const BLIZZARD=Object.freeze({first:12,period:18,duration:5,rangeFactor:.7});
function frostBlizzard(state=S){if(biomeId(state)!=='frozen'||state.phase!=='fight')return false;const t=state.fightT||0;return t>=BLIZZARD.first&&(t-BLIZZARD.first)%BLIZZARD.period<BLIZZARD.duration;}
function frostRange(u,range,state=S){return frostBlizzard(state)&&!regionalDef(u)?.blizzardImmune&&(enemyRanged(u)||u.type==='A'||u.type==='M')?range*BLIZZARD.rangeFactor:range;}
function frostFrozen(u,state=S){return biomeId(state)==='frozen'&&state.phase==='fight'&&Number.isFinite(u?.frostUntil)&&u.frostUntil>(state.fightT||0);}
function frostChill(u,state=S){return biomeId(state)==='frozen'&&state.phase==='fight'&&Number.isFinite(u?.frostChillUntil)&&u.frostChillUntil>(state.fightT||0)?1-(u.frostChillStrength||.3):1;}
function frostSlowResistance(e,factor){const resistance=regionalDef(e)?.slowResistance||0;return resistance?factor+(1-factor)*resistance:factor;}
function frostClearMotion(u){delete u.iceVX;delete u.iceVY;}
function frostResetUnit(u){frostClearMotion(u);delete u.frostUntil;delete u.frostChillUntil;delete u.frostChillStrength;delete u.frostPulseAt;}
function frostWalkVector(u,dx,dy,dt,state=S,W){
 if(biomeId(state)!=='frozen')return {dx,dy};
 if(!Number.isFinite(dt)||dt<=0||frostFrozen(u,state)){frostClearMotion(u);return {dx:0,dy:0};}
 if(!biomeContains(u,'ice',state,W)){frostClearMotion(u);return {dx,dy};}
 const a=1-Math.exp(-dt*9),vx=dx/dt,vy=dy/dt;
 u.iceVX=(Number.isFinite(u.iceVX)?u.iceVX:vx)*(1-a)+vx*a;
 u.iceVY=(Number.isFinite(u.iceVY)?u.iceVY:vy)*(1-a)+vy*a;
 if(Math.hypot(u.iceVX,u.iceVY)<1){frostClearMotion(u);return {dx:0,dy:0};}
 return {dx:u.iceVX*dt,dy:u.iceVY*dt};
}
function frostCoast(u,dt,W){
 if(biomeId(S)!=='frozen'||!Number.isFinite(u.iceVX)||u.moving)return;
 if(u.down||u.hp<=0||frostFrozen(u)||u.kind&&spellEnemyRooted(u)){frostClearMotion(u);return;}
 const v=frostWalkVector(u,0,0,dt,S,W);
 const r=u.r||radius(u)||10;u.x=Math.max(WALL_X+r,Math.min(W-r,u.x+v.dx));u.y=Math.max(r,Math.min(WORLD_H-r,u.y+v.dy));u.moving=!!(v.dx||v.dy);
}
function frostHeraldPulse(e){
 const d=regionalDef(e);if(!d?.pulseRadius||spellEnemyRooted(e)||S.fightT<(e.frostPulseAt||0))return;
 const targets=bossTargets().filter(u=>Math.hypot(u.x-e.x,u.y-e.y)<=d.pulseRadius);
 if(!targets.length)return;
 e.frostPulseAt=S.fightT+d.pulseCooldown;
 for(const u of targets){u.frostChillUntil=Math.max(u.frostChillUntil||0,S.fightT+d.pulseDuration);u.frostChillStrength=d.pulseSlow;}
 S.fx.push({k:'ring',x:e.x,y:e.y,r:d.pulseRadius,c:'soul',t:.5,T:.5});floatText(e.x,e.y-30,'Frost aura','soul',10);
}
const EMPTY_BIOME_ZONES=Object.freeze([]);
let biomeZoneWidth=-1,biomeZoneHeight=-1,biomeZoneRegion='',biomeZoneCache=EMPTY_BIOME_ZONES;
function biomeZones(state=S,W){
 const region=biomeId(state),defs=region==='forest'?FOREST_ZONES:region==='frozen'?FROZEN_ZONES:null;if(!defs)return EMPTY_BIOME_ZONES;
 if(W===undefined)W=worldW();
 if(W!==biomeZoneWidth||WORLD_H!==biomeZoneHeight||region!==biomeZoneRegion){biomeZoneWidth=W;biomeZoneHeight=WORLD_H;biomeZoneRegion=region;biomeZoneCache=Object.freeze(defs.map(z=>Object.freeze({...z,x:z.x*W,y:z.y*WORLD_H,rx:Math.max(25,z.rx*W)})));}
 return biomeZoneCache;
}
function biomeContains(u,kind,state=S,W){
 if(biomeId(state)==='valley'||!u||!Number.isFinite(u.x)||!Number.isFinite(u.y))return false;
 for(const z of biomeZones(state,W)){if(z.kind!==kind)continue;const dx=(u.x-z.x)/z.rx,dy=(u.y-z.y)/z.ry;if(dx*dx+dy*dy<=1)return true;}
 return false;
}
function biomeProjectileFactor(u,state=S,W){return biomeContains(u,'cover',state,W)?.75:1;}
function biomeWalkFactor(u,state=S,W){return frostFrozen(u,state)?0:frostChill(u,state)*(regionalDef(u)?.brambleImmune?1:biomeContains(u,'bramble',state,W)?.7:1);}
function biomeDraw(W,g=ctx){
 if(biomeId(S)==='valley')return;
 g.save();g.beginPath();g.rect(0,0,W,WORLD_H);g.clip();
 for(const z of biomeZones(S,W)){
  const ice=z.kind==='ice',cover=z.kind==='cover',color=ice?'#b3ebff':cover?'#8dc7a0':'#d5ad68';
  g.fillStyle=ice?'#68b9d7':cover?'#1d6544':'#664725';g.globalAlpha=.13;g.beginPath();g.ellipse(z.x,z.y,z.rx,z.ry,0,0,Math.PI*2);g.fill();
  g.globalAlpha=.72;g.strokeStyle=color;g.lineWidth=1.2;g.setLineDash(cover?[5,4]:[2,4]);g.stroke();g.setLineDash([]);
  g.fillStyle='#101c18';g.globalAlpha=.8;g.fillRect(z.x-31,z.y-z.ry+4,62,12);g.globalAlpha=1;g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';g.font='bold 9px monospace';g.fillText(ice?'ICE':cover?'COVER':'BRAMBLES',z.x,z.y-z.ry+10);
 }
 g.restore();
}
function biomeRegionChoice(){const el=document.getElementById('campaignRegion'),id=el?.value;return Object.hasOwn(BIOME_DATA,id)&&biomeUnlocked(id)?id:'valley';}
function biomeUnlocked(id){if(id==='valley')return true;const p=campaignProfileInit();return id==='forest'?p.forestUnlocked===true:id==='frozen'?p.frozenUnlocked===true:false;}
function biomeUnlockForest(){const p=campaignProfileInit();return p.forestUnlocked===true||campaignProfileCommit({...p,forestUnlocked:true});}
function biomeUnlockFrozen(){const p=campaignProfileInit();return p.frozenUnlocked===true||campaignProfileCommit({...p,forestUnlocked:true,frozenUnlocked:true});}
function biomeMenu(){const el=document.getElementById('campaignRegion');if(!el)return;for(const d of Object.values(BIOME_DATA)){const option=el.querySelector('option[value="'+d.id+'"]');if(!option)continue;const unlocked=biomeUnlocked(d.id);option.disabled=!unlocked;option.textContent=d.name+(unlocked?'':' · locked');}if(!biomeUnlocked(el.value))el.value='valley';const length=document.getElementById('campaignLength');if(el.value!=='valley')length.value='5';length.disabled=el.value!=='valley';document.getElementById('regionHint').textContent=el.value==='frozen'?'Five waves · ice, blizzards and the Frost Inquisitor.':el.value==='forest'?'Five waves · defeat the Huntsman to unlock Frozen Wasteland.':biomeUnlocked('forest')?'Select an unlocked region.':'Defeat the fifth-wave boss in the Valley to unlock Cursed Forest.';}
