/* Permanent mastery; profile and run data remain separate. */
const MASTERY_RULES=Object.freeze({2:{xp:8,cost:15},3:{xp:20,cost:30}});
const MASTERY_EVOLUTIONS=Object.freeze({
 fire:{2:'Hellfire · +30% damage, +20% radius',3:'Eternal Inferno · burning field: 6 damage/s for 4s'},
 barrier:{2:'Spectral Aegis · +30% absorption',3:'Soul Bastion · nearby guardians gain 25% max HP shields'},
 lightning:{2:'Storm Chain · fourth target (8 damage)',3:'Thunder Requiem · fourth strike deals 18 damage'},
 grasp:{2:'Grave Bind · +0.5s root',3:'Sepulchral Grip · 35% slow for 2s after root'},
 frost:{2:'Deep Winter · +1s slow',3:'Absolute Zero · initial 1s freeze (bosses 0.5s)'},
 harvest:{2:'Soul Collector · up to 5 extra souls',3:'Reaper’s Tribute · up to 6 extra souls'}
});
function masteryInt(v,min,max){return Number.isFinite(v)?Math.max(min,Math.min(max,Math.floor(v))):min;}
function masteryNormalize(raw,learned){return Object.fromEntries(learned.map(id=>{const r=raw?.[id],xp=masteryInt(r?.xp,0,20);return [id,{xp,tier:masteryInt(r?.tier,1,xp>=20?3:xp>=8?2:1)}];}));}
function masteryCapsNormalize(raw){const out={};if(!raw||typeof raw!=='object')return out;for(const [key,value] of Object.entries(raw).slice(-500)){if(!/^[a-zA-Z0-9_-]{1,100}:([1-9]|10):[a-z]+$/.test(key)||!Object.hasOwn(SPELL_UNLOCKS,key.split(':').at(-1)))continue;const n=masteryInt(value,0,3);if(n)out[key]=n;}return out;}
function masteryMergeProfiles(a,b){
 const learned=[...new Set([...a.learned,...b.learned])],mastery={},practiceCaps={...a.practiceCaps};
 for(const id of learned)mastery[id]={xp:Math.max(a.mastery?.[id]?.xp||0,b.mastery?.[id]?.xp||0),tier:Math.max(a.mastery?.[id]?.tier||1,b.mastery?.[id]?.tier||1)};
 for(const [key,n] of Object.entries(b.practiceCaps||{}))practiceCaps[key]=Math.max(practiceCaps[key]||0,n);
 return knowledgeNormalize({version:KNOWLEDGE_VERSION,learned,mastery,practiceCaps});
}
function masteryRecord(id){knowledgeInit();return spellKnowledge.mastery?.[id]||{xp:0,tier:1};}
function masteryTier(id,allowTest=true){return allowTest&&S?.sandbox&&!menuOpen?masteryInt(S.magic?.testTier,1,3):masteryRecord(id).tier;}
function masterySpell(id,tier=masteryTier(id)){
 const base=SPELL_DATA[id],d={...base,tier};
 if(tier>=2){
  if(id==='fire'){d.r=Math.round(base.r*1.2);d.damageScale=1.3;}
  if(id==='barrier')d.hpFraction=base.hpFraction*1.3;
  if(id==='lightning')d.damage=[...base.damage,tier>=3?18:8];
  if(id==='grasp')d.duration=base.duration+.5;
  if(id==='frost')d.duration=base.duration+1;
  if(id==='harvest')d.bonusCap=base.bonusCap+tier-1;
 }
 if(tier>=3){
  if(id==='fire'){d.burnDuration=4;d.burnDps=6;}
  if(id==='barrier'){d.splashShield=.25;d.splashRange=80;}
  if(id==='grasp'){d.afterSlow=.35;d.afterDuration=2;}
  if(id==='frost'){d.freezeDuration=1;d.bossFreezeDuration=.5;}
 }return d;
}
function masteryFireDamage(d,wave){return classDamage(Math.round((d.damage+d.perTwoWaves*Math.floor(Math.max(0,classWave(wave)-1)/2))*(d.damageScale||1)),wave);}
function masteryLightningDamage(d,wave){return d.damage.map(value=>classDamage(value,wave));}
function masteryBurnDamage(d,wave){return Math.round(d.burnDps*classDamageFactor(wave)*10)/10;}
function masteryXp(id){
 if(!heroUsesMagic(S)||S.sandbox||S.phase!=='fight'||!knowledgeLearned(id)||!sessionRunId)return false;
 const key=sessionRunId+':'+S.wave+':'+id;if(!/^[a-zA-Z0-9_-]{1,100}:([1-9]|10):[a-z]+$/.test(key))return false;
 spellKnowledge=masteryMergeProfiles(knowledgeRead(),spellKnowledge);
 const rec=spellKnowledge.mastery[id],count=spellKnowledge.practiceCaps[key]||0;
 if(rec.xp>=20||count>=3)return false;
 rec.xp++;spellKnowledge.practiceCaps[key]=count+1;knowledgeDirty=true;knowledgeFlush();floatText(WALL_X+45,24,'+1 '+magicDef(id).name+' XP','soul',11);return true;
}
function masteryCastToken(){S.masteryCastSeq=(S.masteryCastSeq||0)+1;return String(S.masteryCastSeq);}
function masteryCredit(id,token){
 if(!S||S.sandbox||S.phase!=='fight'||!token)return false;S.masteryCredited||={};if(S.masteryCredited[token])return false;S.masteryCredited[token]=true;return masteryXp(id);
}
function masteryClearWave(){S.masteryCastSeq=0;S.masteryCredited={};}
function masteryRecover(state){
 if(!state||state.sandbox||!Array.isArray(state.paidMasteryRituals))return;
 for(const r of state.paidMasteryRituals){if(!r||!Object.hasOwn(SPELL_UNLOCKS,r.id)||![2,3].includes(r.tier)||!knowledgeLearned(r.id))continue;const rec=spellKnowledge.mastery[r.id];if(rec.xp>=MASTERY_RULES[r.tier].xp&&rec.tier<r.tier){rec.tier=r.tier;knowledgeDirty=true;}}
 if(knowledgeDirty)knowledgeFlush();
}
function masteryCanRitual(id){
 if(!heroUsesMagic(S)||S.sandbox||menuOpen||S.phase!=='prep'||spinning||S.drag||S.pendingMerge||!$('#ov').hidden||!$('#ov2').hidden||!knowledgeLearned(id))return false;
 const rec=masteryRecord(id),next=MASTERY_RULES[rec.tier+1];return !!(next&&rec.xp>=next.xp&&S.gold>=next.cost);
}
function masteryRitual(id){
 if(!masteryCanRitual(id))return false;
 const rec=masteryRecord(id),tier=rec.tier+1,rule=MASTERY_RULES[tier];
 if(!confirm('Perform '+magicDef(id).name+' Tier '+tier+' ritual for '+rule.cost+' souls? Permanent; cannot be undone.'))return false;
 const oldGold=S.gold,oldReceipts=S.paidMasteryRituals,oldSave=loadedSave;
 S.gold-=rule.cost;S.paidMasteryRituals=[...(Array.isArray(oldReceipts)?oldReceipts:[]),{id,tier}];
 if(!persist()){S.gold=oldGold;if(oldReceipts===undefined)delete S.paidMasteryRituals;else S.paidMasteryRituals=oldReceipts;loadedSave=oldSave;return false;}
 prepUndoClear();rec.tier=tier;knowledgeDirty=true;knowledgeFlush();S.confirmFight=false;setResult('Ritual completed',magicDef(id).name+' · Tier '+tier+' permanently learned.');sfx('fusion');renderUI();return true;
}
