/* Exercises the actual patched rule functions, not copies. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const g=read('engine/game.js'),m=read('engine/martial-skills.js'),sp=read('engine/spell-effects.js'),mg=read('engine/magic.js');
function between(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);if(i<0||j<=i)throw Error(a);return s.slice(i,j);}
const source=[
 between(g,'const BASE = {','const MAX_UNITS'),
 between(g,'function guardianTraining','function doMerge'),
 between(g,'function stats(','const size ='),
 between(sp,'function spellBarrierPlan','function spellExecute'),
 between(m,'function martialCryTargets','// Called once per simulation step'),
 between(mg,'function magicConfirm','function magicFrame')
].join('\n');
const harness=`
let S={phase:'fight',wave:1,units:[],bench:[],mods:{warHp:1,archSpd:1,mageDmg:1,splash:1}},results={};
const WORLD_H=260,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),frostFrozen=u=>!!u.frozen,artifactOwned=()=>false,infusionStats=s=>s;
const a={pile:1,train:3},b={pile:2,train:0};
results.average=mergeTraining(a,b)===1&&mergeTraining(b,a)===1;
results.equal=mergeTraining({pile:2,train:2},{pile:1,train:2})===2;
results.weighted=mergeTraining({pile:2,train:3},{pile:1,train:0})===2;
results.legacy=guardianTraining({train:3})===3&&guardianTraining({})===0;
results.cap=guardianTraining({train:4})===3&&guardianTraining({train:-1})===0;
results.hp=stats('W',2,{pile:1,train:1},S).hp===691&&stats('W',2,{pile:1,train:3},S).hp===1152;
results.fraction=trainingPercent({train:1/3})===16.7;
results.noTrainingChange=stats('A',1,{pile:1,train:0},S).hp===20;
const ally={type:'A',lvl:1,x:100,y:100,hp:20},banshee={type:'B',lvl:3,x:100,y:100,hp:0};
S.units=[ally,banshee];results.deadAura=bansheeOn(ally)===0;banshee.hp=280;results.liveAura=bansheeOn(ally)===.8;banshee.frozen=true;results.frozenAura=bansheeOn(ally)===0;
let messages=[],spent=0,executions=0;
const floatText=(...args)=>messages.push(args[2]),martialAvailability=()=> 'Ready',talentHas=h=>h.build?.branch==='juggernaut',talentSkill=()=>({radius:100,cost:30,cd:15,duration:6,bossDuration:2}),martialLab=()=>null,martialMovement=()=>({len:0}),martialNearby=(h,r)=>S.enemies.filter(e=>e.hp>0&&dist(h,e)<=r),martialEvent=()=>{},sfx=()=>{},heroRender=()=>{},persist=()=>{};
S.hero={x:100,y:100,facing:1,martial:{rage:100,cooldowns:{cry:0},direction:{x:1,y:0}}};S.fightT=0;S.enemies=[];
S.units=[banshee];results.cryNoTarget=!martialCast('cry')&&S.hero.martial.rage===100&&S.hero.martial.cooldowns.cry===0;
S.units=[ally,banshee];results.cryUseful=martialCast('cry')&&S.hero.martial.rage===70&&ally.warCryUntil===6&&!banshee.warCryUntil;
S.hero.build={branch:'juggernaut'};S.hero.martial.rage=100;S.hero.martial.cooldowns.cry=0;results.emptyTaunt=!martialCast('cry')&&S.hero.martial.rage===100;
S.enemies=[{x:120,y:100,hp:20}];results.taunt=martialCast('cry')&&S.enemies[0].heroTauntUntil===6;
const u={x:100,y:100,maxHp:100,hp:100,arcaneShield:80,arcaneShieldTime:4},v={x:130,y:100,maxHp:40,hp:40};S.units=[u,v];const d={hpFraction:.65,splashShield:.25,splashRange:80,mana:30,cd:18,implemented:true};
results.stronger=spellBarrierPlan(u,{hpFraction:.5}).length===0;results.splash=spellBarrierPlan(u,d).length===1&&spellBarrierPlan(u,d)[0].ally===v;
v.arcaneShield=12;v.arcaneShieldTime=4;results.noImprovement=spellBarrierPlan(u,d).length===0;
v.arcaneShieldTime=0;results.expired=spellBarrierPlan(u,d).length===1;
let magicMode='aim',magicRune='barrier',magicDeadline=10;const SPELL_DATA={barrier:d},magicActive=()=>true,magicTarget=()=>({entity:u}),magicAvailable=()=>true,magicSetMessage=x=>messages.push(x),masterySpell=()=>d,magicData=()=>mana,spellExecute=()=>{executions++;return 'ok'},magicDef=()=>({name:'Barrier'}),magicCancel=()=>{};const mana={mana:100,cooldowns:{barrier:0}};
v.arcaneShieldTime=4;results.noManaWaste=!magicConfirm({},0)&&mana.mana===100&&mana.cooldowns.barrier===0&&executions===0;
v.arcaneShieldTime=0;results.validCast=magicConfirm({},0)&&mana.mana===70&&mana.cooldowns.barrier===18&&executions===1;
return results;`;
const result=new Function(source+'\n'+harness)();
for(const [k,v] of Object.entries(result))assert.equal(v,true,k);
console.log(result);
