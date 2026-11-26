/* First biome and boss data. Existing kind IDs, art and save schema stay compatible. */
const BIOME_DATA=Object.freeze({
 valley:Object.freeze({id:'valley',name:'Valley of Souls',firstWave:1,lastWave:5,terrain:'Existing open battlefield',modifier:'None',bossId:'crusader',backdrop:'valley'}),
 forest:Object.freeze({id:'forest',name:'Cursed Forest',firstWave:1,lastWave:5,terrain:'Cover and tangled ground',modifier:'Cover -25% projectile damage; brambles -30% walking speed',bossId:'huntsman',backdrop:'forest'}),
 frozen:Object.freeze({id:'frozen',name:'Frozen Wasteland',firstWave:1,lastWave:5,terrain:'Ice patches and periodic blizzards',modifier:'Ice changes walking inertia; blizzard −30% ranged reach',bossId:'inquisitor',backdrop:'frozen'}),
 ashen:Object.freeze({id:'ashen',name:'Ashen Kingdom',firstWave:1,lastWave:5,terrain:'Burning ground and periodic ash clouds',modifier:'Burning ground 2% max HP/s; ash clouds −25% projectile damage',bossId:'paladin',backdrop:'ashen'}),
 cathedral:Object.freeze({id:'cathedral',name:'The Fallen Cathedral',firstWave:1,lastWave:5,terrain:'Consecrated ground and Divine Toll',modifier:'Guardian attack −30% in holy zones; human shields every 20 s',bossId:'exorcist',backdrop:'cathedral'})
});
const BOSS_DATA=Object.freeze({
 crusader:Object.freeze({id:'crusader',name:'The Crusader',sprite:'caballero',art:'bossCrusader',kind:'com',wave:5,ability:'Consecrated Sweep',radius:68,triggerRadius:56,windup:1.5,cooldown:8,damageFactor:.8,description:'Armored boss. Consecrated Sweep marks a fixed 68 px circle for 1.5 s, then deals 80% of its basic attack to guardians and the deployed hero inside. Spread out, use ranged guardians or root the boss to interrupt. Never damages the Altar.'}),
 huntsman:Object.freeze({id:'huntsman',name:'The Grand Huntsman',sprite:'ballestero',art:'bossHuntsman',kind:'com',wave:5,ability:'Hunter’s Mark',radius:38,triggerRadius:180,windup:2,cooldown:8,damageFactor:1.4,range:150,hpFactor:.75,damageScale:.8,description:'Ranged boss. Marks the position of the nearest visible guardian or deployed hero within 180 px. After 2 s, a volley hits targets inside the fixed 38 px circle for 140% basic attack. Cover reduces damage; roots interrupt. No special Altar damage.'}),
 inquisitor:Object.freeze({id:'inquisitor',name:'The Frost Inquisitor',sprite:'clerigo',art:'bossInquisitor',kind:'com',wave:5,ability:'Glacial Prison',radius:55,triggerRadius:180,windup:2,cooldown:12,damageFactor:.6,freezeDuration:3,description:'Armored melee boss. Marks the densest nearby cluster of guardians or deployed Warlord. After 2 s, deals 60% basic attack within 55 px and freezes victims for 3 s. Roots interrupt the cast. Never freezes or damages the Altar with this ability.'}),
 paladin:Object.freeze({id:'paladin',name:'The Iron Paladin',sprite:'comandante',art:'bossPaladin',kind:'com',wave:5,ability:'Molten Judgment',radius:65,triggerRadius:80,windup:2,cooldown:12,damageFactor:1.2,burnGround:5,description:'Armored melee boss. After 2 s, strikes a fixed 65 px area for 120% basic attack and leaves burning ground for 5 s. Roots interrupt; the strike and residual ground never damage the Altar.'}),
 exorcist:Object.freeze({id:'exorcist',name:'The High Exorcist',sprite:'clerigo',art:'bossExorcist',ascendedArt:'bossExorcistAscended',kind:'com',wave:5,ability:'Divine Purge',radius:65,triggerRadius:180,windup:2,cooldown:12,damageFactor:1.5,cluster:true,ascension:true,description:'Marks the densest nearby guardian cluster: after 2 s, deals 150% basic attack within 65 px. Roots interrupt. At 50% HP permanently ascends: +25% attack, +20% movement, 8 s cooldown. Never damages the Altar with Divine Purge.'})
});
/* Regional enemies may define exclusive optional art. Counts replace ordinary slots, never add to them. */
const REGIONAL_ENEMIES=Object.freeze({
 pathfinder:Object.freeze({n:'Pathfinder',spr:'soldado',art:'forestPathfinder',hp:.65,dmg:.75,sp:1.65,r:10,region:'forest',firstWave:1,counts:Object.freeze([1,1,1,2,2]),brambleImmune:true,marker:'#e4c78b',badge:'P',description:'Fast scout. Ignores the 30% Brambles walking penalty, but roots and spell slows still apply.'}),
 ranger:Object.freeze({n:'Forest Ranger',spr:'ballestero',art:'forestRanger',hp:.8,dmg:.85,sp:1.05,r:11,range:150,region:'forest',firstWave:2,counts:Object.freeze([0,1,1,2,2]),seekCover:true,coverSearch:115,marker:'#91dba8',badge:'R',description:'Seeks nearby Cover when it can fire from there. Receives the ordinary 25% projectile protection while inside. Does not retreat endlessly or ignore taunts.'}),
 purifier:Object.freeze({n:'Forest Purifier',spr:'incendiario',art:'forestPurifier',hp:1,dmg:.95,sp:.8,r:12,range:120,region:'forest',firstWave:3,counts:Object.freeze([0,0,1,1,2]),ignoreCover:true,marker:'#ffb477',badge:'F',description:'Incendiary ranged attacker. Its flaming bolts ignore Cover protection but not other defenses. Attacks guardians and the Altar normally, without the Arsonist triple damage.'}),
 frostSentinel:Object.freeze({n:'Frost Sentinel',spr:'caballero',art:'frozenSentinel',hp:2.1,dmg:1.05,sp:.65,r:12,armor:true,region:'frozen',firstWave:1,counts:Object.freeze([1,1,1,2,2]),slowResistance:.5,marker:'#a9d8f4',badge:'S',description:'Armored tank. Halves the strength of spell slowing effects; roots and freezes still stop it.'}),
 iceMarksman:Object.freeze({n:'Ice Marksman',spr:'ballestero',art:'frozenMarksman',hp:.8,dmg:.9,sp:.9,r:11,range:150,region:'frozen',firstWave:2,counts:Object.freeze([0,1,1,2,2]),blizzardImmune:true,marker:'#b5f4ff',badge:'I',description:'Ranged specialist. Retains full 150 px reach during a blizzard.'}),
 frostHerald:Object.freeze({n:'Frost Herald',spr:'clerigo',art:'frozenHerald',hp:.9,dmg:.7,sp:.8,r:11,region:'frozen',firstWave:3,counts:Object.freeze([0,0,1,1,2]),pulseRadius:85,pulseCooldown:6,pulseDuration:2,pulseSlow:.3,marker:'#aeb8ff',badge:'H',description:'Melee support. Every 6 s, chills nearby guardians and deployed Warlord within 85 px, reducing walking speed by 30% for 2 s. Does not stack or freeze.'}),
 ashenVanguard:Object.freeze({n:'Ashen Vanguard',spr:'caballero',art:'ashenVanguardArt',hp:1.9,dmg:1.1,sp:.75,r:12,armor:true,region:'ashen',firstWave:1,counts:Object.freeze([1,1,1,2,2]),fireGroundImmune:true,marker:'#e7a376',badge:'V',description:'Armored infantry. Immune to permanent and temporary burning ground, not other fire attacks.'}),
 emberMarksman:Object.freeze({n:'Ember Marksman',spr:'ballestero',art:'emberMarksmanArt',hp:.85,dmg:.9,sp:.95,r:11,range:150,region:'ashen',firstWave:2,counts:Object.freeze([0,1,1,2,2]),burnDuration:3,burnRate:.01,marker:'#ff965c',badge:'E',description:'Ranged incendiary bolts apply a nonstacking burn on damage: 1% maximum HP per second for 3 seconds. No burn on the Altar.'}),
 cinderPriest:Object.freeze({n:'Cinder Priest',spr:'clerigo',art:'cinderPriestArt',hp:.95,dmg:.75,sp:.85,r:11,region:'ashen',firstWave:3,counts:Object.freeze([0,0,1,1,2]),buffRadius:100,buffCooldown:8,buffDuration:4,buffFactor:1.25,marker:'#f4ca87',badge:'C',description:'Melee support. Every 8 s, boosts nearby human allies within 100 px by 25% attack for 4 s. Does not stack or affect itself.'}),
 sanctifiedTemplar:Object.freeze({n:'Sanctified Templar',spr:'caballero',art:'catTemplar',hp:2.0,dmg:1.05,sp:.7,r:12,armor:true,region:'cathedral',firstWave:1,counts:Object.freeze([1,1,1,2,2]),directResist:.25,marker:'#f1d7a4',badge:'T',description:'Armored infantry. Takes 25% less damage from direct Sorcerer spells and damaging Warlord abilities; ordinary attacks and damage over time unaffected.'}),
 holyInquisitor:Object.freeze({n:'Holy Inquisitor',spr:'ballestero',art:'catInquisitor',hp:.85,dmg:.95,sp:.95,r:11,range:150,region:'cathedral',firstWave:2,counts:Object.freeze([0,1,1,2,2]),attackSlow:.2,slowDuration:4,marker:'#d4c2ff',badge:'I',description:'Ranged bolts that deal HP damage reduce the target’s attack rate by 20% for 4 s. Refreshes, never stacks. No effect on the Altar.'}),
 divineHierophant:Object.freeze({n:'Divine Hierophant',spr:'clerigo',art:'catHierophant',hp:1,dmg:.75,sp:.8,r:11,region:'cathedral',firstWave:3,counts:Object.freeze([0,0,1,1,2]),reviveRadius:110,reviveFactor:.4,marker:'#f5d99b',badge:'H',description:'Once per battle, revives a fallen human within 110 px and dead no more than 8 s, with 40% max HP. Cannot revive bosses, Hierophants or previously revived enemies. No duplicate souls or kills.'})
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
function enemySprite(e){const boss=bossDef(e),k=KIND[e.kind],art=boss?.ascension&&e.catAscended&&typeof SPR!=='undefined'&&SPR[boss.ascendedArt]?.length?boss.ascendedArt:boss?.art||k.art;return art&&typeof SPR!=='undefined'&&SPR[art]?.length?art:boss?.sprite||k.spr;}
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
 if(d.ascension&&e.hp<=e.maxHp*.5&&!e.catAscended){e.catAscended=true;e.bossCooldown=Math.min(e.bossCooldown||0,8);floatText(e.x,e.y-42,'DIVINE ASCENSION','gold',13);S.fx.push({k:'ring',x:e.x,y:e.y,r:70,c:'gold',t:.8,T:.8});sfx('horn');}
 const cooldown=d.ascension&&e.catAscended?8:d.cooldown;
 e.bossCooldown=Math.max(0,(e.bossCooldown||0)-dt);
 if(spellEnemyRooted(e)){
  if(e.bossCast){delete e.bossCast;e.bossCooldown=cooldown;floatText(e.x,e.y-35,'Interrupted','soul',11);}
  return false;
 }
 if(e.bossCast){
  const c=e.bossCast;c.left-=dt;
  if(c.left>0)return true;
  delete e.bossCast;e.bossCooldown=cooldown;e.cd=Math.max(e.cd||0,.4);
  for(const u of bossTargets()){
   if(Math.hypot(u.x-c.x,u.y-c.y)>d.radius)continue;
   if(d.id==='huntsman'&&typeof challengeEvent==='function'&&S.units?.includes(u))challengeEvent('hunterMark');
    const dealt=heroDamageTarget(u,ashEnemyAttack(e)*d.damageFactor*(d.id==='huntsman'?biomeProjectileFactor(u):1));
   if(d.freezeDuration&&u.hp>0&&!u.down&&!(heroIsTarget(u)&&martialInvulnerable())){if(typeof challengeEvent==='function'&&S.units?.includes(u))challengeEvent('glacialPrison');u.frostUntil=Math.max(u.frostUntil||0,S.fightT+d.freezeDuration);frostClearMotion(u);floatText(u.x,u.y-32,'Frozen','soul',11);}
   if(dealt>0){u.flash=.15;feelNumber(u.x,u.y-radius(u)-10,dealt,'ally');feelImpact(u.x,u.y,'steel',u,0,false);}
  }
  if(d.burnGround&&biomeId(S)==='ashen'){S.ashPatches=(S.ashPatches||[]).filter(p=>p.until>S.fightT);S.ashPatches.push({x:c.x,y:c.y,r:d.radius,until:S.fightT+d.burnGround});}
  if(typeof championRelease==='function')championRelease('boss',d.id,c.x,c.y,d.radius);
  S.fx.push({k:'ring',x:c.x,y:c.y,r:d.radius,c:'gold',t:.5,T:.5});sfx('clash');
  return true;
 }
 if(e.bossCooldown>0)return false;
 const targets=bossTargets(),near=targets.filter(u=>Math.hypot(u.x-e.x,u.y-e.y)<=d.triggerRadius);let target=null,best=-Infinity;
 for(const u of near){const distance=Math.hypot(u.x-e.x,u.y-e.y),score=d.freezeDuration||d.cluster?targets.filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<=d.radius).length*1000-distance:-distance;if(score>best){best=score;target=u;}}
 if(!target)return false;
 e.bossCast={x:d.id==='huntsman'||d.freezeDuration||d.cluster?target.x:e.x,y:d.id==='huntsman'||d.freezeDuration||d.cluster?target.y:e.y,left:d.windup};
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
const CATHEDRAL_ZONES=Object.freeze([
 Object.freeze({kind:'consecrated',x:.325,y:.695,rx:.087,ry:18}),
 Object.freeze({kind:'consecrated',x:.755,y:.48,rx:.08,ry:15}),
 Object.freeze({kind:'consecrated',x:.87,y:.695,rx:.08,ry:18})
]);
const CAT_RULES=Object.freeze({groundFactor:.7,tollPeriod:20,shieldDuration:6,shieldFactor:.1,corpseDuration:8});
function catActive(state=S){return biomeId(state)==='cathedral'&&state.phase==='fight';}
function catGroundFactor(u,state=S){return catActive(state)&&biomeContains(u,'consecrated',state)?CAT_RULES.groundFactor:1;}
function catAttackRate(u,state=S){return catActive(state)&&u.catSlowUntil>state.fightT?.8:1;}
function catSpeed(e){return bossDef(e)?.ascension&&e.catAscended?1.2:1;}
function catResetBattle(){S.catCorpses=[];S.catTollNext=20;for(const u of [...(S.units||[]),...(S.bench||[]).filter(Boolean),...(S.enemies||[]),S.hero].filter(Boolean)){delete u.catSlowUntil;delete u.catShield;delete u.catShieldUntil;}}
function catApplySlow(u,s,dealt){if(catActive()&&s.attackSlow&&dealt>0&&u.hp>0&&!u.down)u.catSlowUntil=Math.max(u.catSlowUntil||0,S.fightT+s.slowDuration);}
function catShieldHP(e,state=S){return catActive(state)&&e.catShieldUntil>state.fightT?Math.max(0,e.catShield||0):0;}
function catMitigate(e,d,o,state=S){if(!catActive(state)||d<=0)return d;if(o.directAbility)d*=1-(regionalDef(e)?.directResist||0);const blocked=Math.min(d,catShieldHP(e,state));if(blocked>0)e.catShield=Math.max(0,e.catShield-blocked);return d-blocked;}
function catAdvance(){if(!catActive())return;const now=S.fightT;S.catCorpses=(S.catCorpses||[]).filter(c=>c.until>now);if(now>=(S.catTollNext||20)){S.catTollNext=(Math.floor(now/20)+1)*20;for(const e of S.enemies)if(e.hp>0){e.catShield=e.maxHp*CAT_RULES.shieldFactor;e.catShieldUntil=now+CAT_RULES.shieldDuration;}bigMsg('DIVINE TOLL · HUMAN SHIELDS');sfx('horn');}}
function catRememberCorpse(e){if(!catActive()||e.boss||e.bossId||e.kind==='divineHierophant'||e.catResurrected)return;const c={kind:e.kind,x:e.x,y:e.y,maxHp:e.maxHp,dmg:e.dmg,sp:e.sp,r:e.r,range:e.range,armor:e.armor,until:S.fightT+CAT_RULES.corpseDuration};S.catCorpses=(S.catCorpses||[]).filter(q=>q.until>S.fightT);S.catCorpses.push(c);if(S.catCorpses.length>60)S.catCorpses.shift();}
function catRevive(e){const d=regionalDef(e);if(!catActive()||!d?.reviveRadius||e.catReviveUsed||e.hp<=0||spellEnemyRooted(e))return false;const corpses=S.catCorpses||[];let best=-1,dist=d.reviveRadius;for(let i=0;i<corpses.length;i++){const c=corpses[i],n=Math.hypot(c.x-e.x,c.y-e.y);if(c.until>S.fightT&&n<=dist){dist=n;best=i;}}if(best<0)return false;const {until,...c}=corpses.splice(best,1)[0];e.catReviveUsed=true;if(typeof challengeEvent==='function')challengeEvent('resurrection');S.enemies.push({...c,hp:c.maxHp*d.reviveFactor,cd:.3,flash:0,root:0,ph:0,catResurrected:true});S.fx.push({k:'ring',x:c.x,y:c.y,r:32,c:'gold',t:.7,T:.7});floatText(c.x,c.y-25,'Resurrected','gold',11);sfx('raise');return true;}
const ASHEN_ZONES=Object.freeze([
 Object.freeze({kind:'burning',x:.28,y:.43,rx:.09,ry:19}),
 Object.freeze({kind:'burning',x:.50,y:.68,rx:.09,ry:21}),
 Object.freeze({kind:'burning',x:.77,y:.45,rx:.085,ry:19})
]);
const ASH_RULES=Object.freeze({first:12,period:18,duration:5,projectileFactor:.75,groundRate:.02});
function ashActive(state=S){return biomeId(state)==='ashen'&&state.phase==='fight';}
function ashCloud(state=S){const t=state.fightT||0;return ashActive(state)&&t>=ASH_RULES.first&&(t-ASH_RULES.first)%ASH_RULES.period<ASH_RULES.duration;}
function ashShotTrack(shot,state=S){if(ashCloud(state))shot.ashCrossed=true;}
function ashShotFactor(shot){return shot.ashCrossed&&ashActive()?ASH_RULES.projectileFactor:1;}
function ashEnemyAttack(e,state=S){return e.dmg*(bossDef(e)?.ascension&&e.catAscended?1.25:1)*(ashActive(state)&&e.ashBuffUntil>state.fightT?(e.ashBuffFactor||1):1);}
function ashResetUnit(u){delete u.ashBurnUntil;delete u.ashBurnNext;delete u.ashBurnRate;delete u.ashBuffUntil;delete u.ashBuffFactor;delete u.ashPulseAt;}
function ashResetBattle(){S.ashPatches=[];S.ashGroundNext=1;for(const u of [...(S.units||[]),...(S.bench||[]).filter(Boolean),...(S.enemies||[]),S.hero].filter(Boolean))ashResetUnit(u);}
function ashApplyBurn(u,shot,dealt){if(!ashActive()||!shot.burnDuration||!(dealt>0)||u.hp<=0||u.down)return;const now=S.fightT;if(!(u.ashBurnUntil>now)){u.ashBurnNext=now+1;u.ashBurnRate=0;}u.ashBurnUntil=Math.max(u.ashBurnUntil||0,now+shot.burnDuration);u.ashBurnRate=Math.max(u.ashBurnRate||0,shot.burnRate||0);}
function ashPriestPulse(e){const d=regionalDef(e);if(!ashActive()||!d?.buffRadius||spellEnemyRooted(e)||S.fightT<(e.ashPulseAt||0))return;const allies=S.enemies.filter(o=>o!==e&&o.hp>0&&Math.hypot(o.x-e.x,o.y-e.y)<=d.buffRadius);if(!allies.length)return;e.ashPulseAt=S.fightT+d.buffCooldown;for(const o of allies){o.ashBuffUntil=Math.max(o.ashBuffUntil||0,S.fightT+d.buffDuration);o.ashBuffFactor=d.buffFactor;}S.fx.push({k:'ring',x:e.x,y:e.y,r:d.buffRadius,c:'gold',t:.5,T:.5});floatText(e.x,e.y-30,'Ember blessing','gold',10);}
function ashGroundAt(u,state=S,W){return biomeContains(u,'burning',state,W)||(state.ashPatches||[]).some(p=>p.until>state.fightT&&Math.hypot(u.x-p.x,u.y-p.y)<=p.r);}
function ashDamage(u,amount,enemy){if(!(amount>0)||u.hp<=0||u.down)return;if(enemy){damage(u,amount,{quiet:true,pierce:true});}else{const dealt=heroDamageTarget(u,amount);if(dealt>0)feelNumber(u.x,u.y-radius(u)-10,dealt,'ally');}}
function ashAdvance(W){if(!ashActive())return;const now=S.fightT;S.ashPatches=(S.ashPatches||[]).filter(p=>p.until>now);const ground=now>=(S.ashGroundNext||1);if(ground)S.ashGroundNext=Math.floor(now)+1;
 for(const u of heroTargets()){if(u.hp<=0||u.down)continue;if(ground&&ashGroundAt(u,S,W)){ashDamage(u,u.maxHp*ASH_RULES.groundRate,false);if((u.hp<=0||u.down)&&typeof challengeEvent==='function'&&S.units?.includes(u))challengeEvent('burningGroundDeath');}if(u.ashBurnNext<=now&&u.ashBurnNext<=u.ashBurnUntil+1e-6){ashDamage(u,u.maxHp*(u.ashBurnRate||0),false);u.ashBurnNext+=1;}if(u.ashBurnUntil<now&&u.ashBurnNext>u.ashBurnUntil){delete u.ashBurnUntil;delete u.ashBurnNext;delete u.ashBurnRate;}}
 if(ground)for(const e of S.enemies){if(e.hp>0&&!regionalDef(e)?.fireGroundImmune&&ashGroundAt(e,S,W))ashDamage(e,e.maxHp*ASH_RULES.groundRate,true);}
}
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
 const region=biomeId(state),defs=region==='forest'?FOREST_ZONES:region==='frozen'?FROZEN_ZONES:region==='ashen'?ASHEN_ZONES:region==='cathedral'?CATHEDRAL_ZONES:null;if(!defs)return EMPTY_BIOME_ZONES;
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
  const holy=z.kind==='consecrated',fire=z.kind==='burning',ice=z.kind==='ice',cover=z.kind==='cover',color=holy?'#ffe3a0':fire?'#ffb16e':ice?'#b3ebff':cover?'#8dc7a0':'#d5ad68';
  g.fillStyle=holy?'#e7c26a':fire?'#d94a1a':ice?'#68b9d7':cover?'#1d6544':'#664725';g.globalAlpha=.13;g.beginPath();g.ellipse(z.x,z.y,z.rx,z.ry,0,0,Math.PI*2);g.fill();
  g.globalAlpha=.72;g.strokeStyle=color;g.lineWidth=1.2;g.setLineDash(cover?[5,4]:[2,4]);g.stroke();g.setLineDash([]);
  g.fillStyle='#101c18';g.globalAlpha=.8;g.fillRect(z.x-31,z.y-z.ry+4,62,12);g.globalAlpha=1;g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';g.font='bold 9px monospace';g.fillText(holy?'HOLY':fire?'BURNING':ice?'ICE':cover?'COVER':'BRAMBLES',z.x,z.y-z.ry+10);
 }
 g.restore();
}
function biomeRegionChoice(){const el=document.getElementById('campaignRegion'),id=el?.value;return Object.hasOwn(BIOME_DATA,id)&&biomeUnlocked(id)?id:'valley';}
function biomeUnlocked(id){if(id==='valley')return true;const p=campaignProfileInit();return id==='forest'?p.forestUnlocked===true:id==='frozen'?p.frozenUnlocked===true:id==='ashen'?p.ashenUnlocked===true:id==='cathedral'?p.cathedralUnlocked===true:false;}
function biomeUnlockForest(){const p=campaignProfileInit();return p.forestUnlocked===true||campaignProfileCommit({...p,forestUnlocked:true});}
function biomeUnlockFrozen(){const p=campaignProfileInit();return p.frozenUnlocked===true||campaignProfileCommit({...p,forestUnlocked:true,frozenUnlocked:true});}
function biomeUnlockAshen(){const p=campaignProfileInit();return p.ashenUnlocked===true||campaignProfileCommit({...p,forestUnlocked:true,frozenUnlocked:true,ashenUnlocked:true});}
function biomeUnlockCathedral(){const p=campaignProfileInit();return p.cathedralUnlocked===true||campaignProfileCommit({...p,forestUnlocked:true,frozenUnlocked:true,ashenUnlocked:true,cathedralUnlocked:true});}
function biomeMenu(){const el=document.getElementById('campaignRegion');if(!el)return;for(const d of Object.values(BIOME_DATA)){const option=el.querySelector('option[value="'+d.id+'"]');if(!option)continue;const unlocked=biomeUnlocked(d.id);option.disabled=!unlocked;option.textContent=d.name+(unlocked?'':' · locked');}if(!biomeUnlocked(el.value))el.value='valley';const length=document.getElementById('campaignLength');if(el.value!=='valley')length.value='5';length.disabled=el.value!=='valley';document.getElementById('regionHint').textContent=el.value==='cathedral'?'Five waves · holy ground, Divine Toll and the High Exorcist.':el.value==='ashen'?'Five waves · defeat the Iron Paladin to unlock The Fallen Cathedral.':el.value==='frozen'?'Five waves · defeat the Frost Inquisitor to unlock Ashen Kingdom.':el.value==='forest'?'Five waves · defeat the Huntsman to unlock Frozen Wasteland.':biomeUnlocked('forest')?'Select an unlocked region.':'Defeat the fifth-wave boss in the Valley to unlock Cursed Forest.';}
