/* Permanent, browser-local spell knowledge. Never grant from sandbox.
   Separate from run state. Scroll purchases save the paid receipt before granting knowledge,
   so an interrupted profile write can be recovered from the durable run. */
const KNOWLEDGE_KEY='gs21.spellKnowledge',KNOWLEDGE_VERSION=1;
const SPELL_UNLOCKS=Object.freeze({
 fire:{kind:'starter'},
 barrier:{kind:'wave',wave:1},
 lightning:{kind:'wave',wave:3},
 grasp:{kind:'wave',wave:5},
 frost:{kind:'scroll',price:18,title:'Scroll of Eternal Winter'},
 harvest:{kind:'scroll',price:24,title:'Scroll of the Soul Collector'}
});
let spellKnowledge={version:KNOWLEDGE_VERSION,learned:['fire']},knowledgeDirty=false,knowledgeLoaded=false;
function knowledgeNormalize(value){
 const ids=value?.version===KNOWLEDGE_VERSION&&Array.isArray(value.learned)?value.learned:[];
 const learned=Object.keys(SPELL_UNLOCKS).filter(id=>id==='fire'||ids.includes(id));return {version:KNOWLEDGE_VERSION,learned,mastery:masteryNormalize(value?.mastery,learned),practiceCaps:masteryCapsNormalize(value?.practiceCaps)};
}
function knowledgeRead(){try{return knowledgeNormalize(JSON.parse(localStorage.getItem(KNOWLEDGE_KEY)));}catch{return knowledgeNormalize(null);}}
function knowledgeInit(){if(knowledgeLoaded)return;spellKnowledge=knowledgeRead();knowledgeLoaded=true;}
function knowledgeLearned(id){knowledgeInit();return spellKnowledge.learned.includes(id);}
function knowledgeFlush(){
 knowledgeInit();
 // Monotonic merge preserves unlocks written by another browser tab.
 const disk=knowledgeRead(),merged=masteryMergeProfiles(disk,spellKnowledge);
 spellKnowledge=merged;
 try{localStorage.setItem(KNOWLEDGE_KEY,JSON.stringify(merged));knowledgeDirty=false;return true;}
 catch{knowledgeDirty=true;return false;}
}
function knowledgeGrant(ids){
 knowledgeInit();
 const fresh=ids.filter(id=>Object.hasOwn(SPELL_UNLOCKS,id)&&!spellKnowledge.learned.includes(id));
 if(fresh.length){spellKnowledge=knowledgeNormalize({...spellKnowledge,learned:[...spellKnowledge.learned,...fresh]});knowledgeDirty=true;knowledgeFlush();}
 return fresh;
}
function knowledgeWaveIds(completed){return Object.keys(SPELL_UNLOCKS).filter(id=>SPELL_UNLOCKS[id].kind==='wave'&&completed>=SPELL_UNLOCKS[id].wave);}
function knowledgeWave(completed){if(!heroUsesMagic(S)||S.sandbox||S.phase!=='fight'||S.wave!==completed)return [];return knowledgeGrant(knowledgeWaveIds(completed));}
function knowledgeFromSave(v,includeBackup=false){
 if(!validSave(v))return [];
 const state=v.state,completed=Math.max(0,Math.min(10,Math.floor(state.wave)-1));
 const ids=heroUsesMagic(state)?knowledgeWaveIds(completed):[];
 // Only recognized scroll identifiers can be recovered; the debit was saved before the unlock.
 if(Array.isArray(state.paidSpellScrolls))for(const id of state.paidSpellScrolls)if(SPELL_UNLOCKS[id]?.kind==='scroll')ids.push(id);
 if(includeBackup)ids.push(...knowledgeNormalize(v.spellKnowledge).learned);
 const fresh=knowledgeGrant(ids);if(includeBackup&&v.spellKnowledge){spellKnowledge=masteryMergeProfiles(spellKnowledge,knowledgeNormalize(v.spellKnowledge));knowledgeDirty=true;knowledgeFlush();}masteryRecover(state);return fresh;
}
function knowledgeFromScores(){
 const list=scores().filter(row=>heroClassId(row.heroClass)==='sorcerer'),completed=list.reduce((max,row)=>Math.max(max,Math.min(10,Number(row.wave)||0)),0);
 return knowledgeGrant(knowledgeWaveIds(completed));
}
function knowledgeHint(id){
 const u=SPELL_UNLOCKS[id];if(!u)return '';
 if(knowledgeLearned(id))return 'Learned permanently · retained between runs.';
 if(u.kind==='wave')return u.wave===5?'Defeat the Commander and survive wave 5.':'Survive wave '+u.wave+' to learn this spell permanently.';
 if(u.kind==='scroll')return 'Steal '+u.title+' from Hades for '+u.price+' souls during preparation.';
 return 'Available from the first run.';
}
function knowledgeSummaryRender(){
 knowledgeInit();const el=document.getElementById('knowledgeSummary');if(el)el.textContent='Arcane knowledge · '+spellKnowledge.learned.length+'/6 learned'+(knowledgeDirty?' · Browser save pending':' · Saved in this browser');
}
function knowledgeAnnounce(ids){if(!ids.length)return '';const names=ids.map(id=>magicDef(id).name).join(', ');bigMsg('SPELL LEARNED · '+names);sfx('fusion');return ' Permanent spell learned: '+names+'.';}
function knowledgeBuyScroll(id){
 const u=SPELL_UNLOCKS[id],overlay=$('#ov2');
 if(!heroUsesMagic(S)||S.sandbox||!shopAvailable()||overlay.hidden||!overlay.querySelector('.hades-shop')||!u||u.kind!=='scroll'||knowledgeLearned(id)||S.gold<u.price)return false;
 if(!confirm('Steal '+u.title+' for '+u.price+' souls? This permanently learns '+magicDef(id).name+'. This purchase cannot be undone.'))return false;
 const oldGold=S.gold,oldReceipts=S.paidSpellScrolls,oldSave=loadedSave;
 S.gold-=u.price;S.paidSpellScrolls=[...new Set([...(Array.isArray(oldReceipts)?oldReceipts:[]),id])];
 // Save the paid run state first. Never grant knowledge for an unpersisted debit.
 if(!persist()){S.gold=oldGold;if(oldReceipts===undefined)delete S.paidSpellScrolls;else S.paidSpellScrolls=oldReceipts;loadedSave=oldSave;const notice=document.getElementById('scrollNotice');if(notice)notice.textContent='Purchase canceled: browser storage is unavailable. No souls spent.';return false;}
 prepUndoClear();S.confirmFight=false;knowledgeGrant([id]);
 setResult('Forbidden knowledge acquired',magicDef(id).name+' · permanently learned.'+(knowledgeDirty?' Profile save pending; paid receipt saved.':''));
 sfx('fusion');renderUI();showShop(true);knowledgeSummaryRender();return true;
}
