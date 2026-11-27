/* Campaign schema and permanent deck receipts. Route economy is versioned; legacy runs retain their original rewards. */
const CAMPAIGN_SAVE_VERSION=18;
const DIFFICULTIES=Object.freeze({
 normal:Object.freeze({name:'Normal',hp:1,damage:1,rank:1}),
 veteran:Object.freeze({name:'Veteran',hp:1.2,damage:1.15,rank:2}),
 nightmare:Object.freeze({name:'Nightmare',hp:1.4,damage:1.3,rank:3})
});
function difficultyId(id){return Object.hasOwn(DIFFICULTIES,id)?id:'normal';}
function campaignDifficulty(state=S){return state?.sandbox||state?.campaign?.maxWaves!==5?'normal':difficultyId(state.campaign.difficulty);}
function normalizeMastery(p){const conquered=normalizeRegionalRewards(p),out={};for(const id of ['valley','forest','frozen','ashen','cathedral']){const rank=Number.isInteger(p.mastery?.[id])?Math.max(0,Math.min(3,p.mastery[id])):0;out[id]=Math.max(rank,conquered.includes(id)?1:0);}return out;}
function mergeMastery(a,b){const x=normalizeMastery(a),y=normalizeMastery(b);return Object.fromEntries(Object.keys(x).map(id=>[id,Math.max(x[id],y[id])]));}
function difficultyUnlocked(profile,region,id){return Object.hasOwn(DIFFICULTIES,id)&&DIFFICULTIES[id].rank<=1+(normalizeMastery(profile)[region]||0);}
function masteryGrant(state=S){if(!state||state.sandbox||state.phase!=='win'||state.campaign?.maxWaves!==5||state.wave!==6)return false;const p=campaignProfileInit(),region=biomeId(state),rank=DIFFICULTIES[campaignDifficulty(state)].rank,mastery=normalizeMastery(p);if(!difficultyUnlocked(p,region,campaignDifficulty(state)))return false;if(mastery[region]>=rank)return true;return campaignProfileCommit({...p,mastery:{...mastery,[region]:rank}});}
function scoreDifficulty(r){return r?.maxWaves===5?difficultyId(r.difficulty):'normal';}
function scoreBucket(r){return String(scoreRegion(r))+'|'+scoreDifficulty(r);}

/* Regional challenges: one optional seal per region; older runs cannot prove completion. */
const REGIONAL_CHALLENGES=Object.freeze({
 valley:Object.freeze({name:'Altar Endurance',description:'Win with at least 70% Altar HP.',event:null}),
 forest:Object.freeze({name:'Unmarked',description:'Win without a guardian being caught in Hunter’s Mark.',event:'hunterMark'}),
 frozen:Object.freeze({name:'Unfrozen',description:'Win without a guardian being frozen by Glacial Prison.',event:'glacialPrison'}),
 ashen:Object.freeze({name:'Walk Through Fire',description:'Win without a guardian dying to permanent or residual Burning Ground.',event:'burningGroundDeath'}),
 cathedral:Object.freeze({name:'Final Rest',description:'Win without a successful Hierophant resurrection.',event:'resurrection'})
});
function normalizeRegionalSeals(p){return Object.keys(REGIONAL_CHALLENGES).filter(id=>Array.isArray(p?.regionalSeals)&&p.regionalSeals.includes(id));}
function challengeRunNormalize(value){return value&&value.version===1&&typeof value.failed==='boolean'?{version:1,failed:value.failed}:null;}
function challengeEvent(event,state=S){
 if(!state||state.sandbox||state.phase!=='fight'||state.campaign?.maxWaves!==5||!state.campaign.challenge)return;
 if(REGIONAL_CHALLENGES[biomeId(state)]?.event===event)state.campaign.challenge.failed=true;
}
function challengeOutcome(state=S){
 if(!state||state.sandbox||state.campaign?.maxWaves!==5||state.phase!=='win'||state.wave!==6||!state.campaign.challenge)return null;
 if(state.campaign.challenge.failed)return false;
 return biomeId(state)!=='valley'||(Number.isFinite(state.wallMax)&&state.wallMax>0&&state.wallHp>=state.wallMax*.7);
}
function challengeGrant(state=S){
 if(challengeOutcome(state)!==true)return false;
 const p=campaignProfileInit(),region=biomeId(state);
 if(!Object.hasOwn(REGIONAL_CHALLENGES,region)||!difficultyUnlocked(p,region,campaignDifficulty(state)))return false;
 const regionalSeals=normalizeRegionalSeals(p);return regionalSeals.includes(region)||campaignProfileCommit({...p,regionalSeals:[...regionalSeals,region]});
}
function challengeResultHTML(state=S){
 const outcome=challengeOutcome(state);
 if(outcome===null)return '';
 const d=REGIONAL_CHALLENGES[biomeId(state)],saved=normalizeRegionalSeals(campaignProfileInit()).includes(biomeId(state));
 return '<p class="cm-challenge-result '+(outcome?'earned':'missed')+'"><strong>Regional challenge · '+d.name+'</strong><br>'+(outcome?(saved?'Mastery Seal earned':'Challenge met · seal not saved'):'Not completed this run')+'</p>';
}
function challengeMapHTML(region,rank,profile){
 const d=REGIONAL_CHALLENGES[region],seal=normalizeRegionalSeals(profile).includes(region);
 const medals=['Bronze','Silver','Gold','Mastery Seal'].map((name,i)=>{const earned=i===3?seal:rank>=i+1;return '<span class="cm-mastery-medal '+(earned?'earned':'locked')+' tier-'+(i+1)+'" aria-label="'+name+(earned?' earned':' locked')+'"><span class="cm-medal-label">'+name+' '+(earned?'✓':'—')+'</span></span>';}).join('');
 return '<section class="cm-challenge" data-region="'+region+'"><h3 class="cm-section-title">Regional mastery</h3><div class="cm-mastery-medals">'+medals+'</div><p><strong>'+d.name+'</strong> · '+(seal?'Mastery Seal earned':'Mastery Seal locked')+'</p><small>'+d.description+' Optional · any regional difficulty.</small></section>';
}

const DEFAULT_CAMPAIGN_WAVES=5, CLASSIC_CAMPAIGN_WAVES=10;
function campaignLimit(state=S){return state?.sandbox?(['forest','frozen','ashen','cathedral'].includes(state.biomeId)?5:CLASSIC_CAMPAIGN_WAVES):state?.campaign?.maxWaves===10?10:DEFAULT_CAMPAIGN_WAVES;}
const CAMPAIGN_PROFILE_KEY='gs22.campaignProfile.v1';
const CAMPAIGN_LEGACY_BACKUP='gs22.legacySave.v14';
const CampaignSave=(()=>{
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);
 const hash=s=>{let h=2166136261;for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;};
 const terminal=p=>p==='win'||p==='over';
 function runId(v){return validId(v.runId)?v.runId:'legacy-'+hash([v.savedAt,v.name,v.worldWidth,JSON.stringify(v.state.grid)].join('|')).toString(16);}
 function metadata(id,raw,legacyTerminal=false){
  const m=object(raw)?raw:{};
  const maxWaves=m.id===id&&m.maxWaves===5?5:10,route=Journey.normalizeRoute(m.route).filter(n=>Number(n.slice(1,-2))<maxWaves);
  return {version:1,id,maxWaves,difficulty:maxWaves===5&&m.id===id?difficultyId(m.difficulty):'normal',routeEconomy:m.id===id&&m.routeEconomy===1?1:0,seed:m.id===id&&Number.isInteger(m.seed)&&m.seed>=0&&m.seed<=0xffffffff?m.seed:hash(id),nodeId:route.at(-1)||null,route,
   challenge:maxWaves===5&&m.id===id?challengeRunNormalize(m.challenge):null,claimedWaveRewards:Array.isArray(m.claimedWaveRewards)?[...new Set(m.claimedWaveRewards.filter(x=>Number.isInteger(x)&&x>=1&&x<maxWaves))]:[],legacyTerminal:legacyTerminal||m.legacyTerminal===true};
 }
 function valid(v){const s=v?.state;return !!(object(v)&&[14,15,16,17,18].includes(v.version)&&object(s)&&!s.sandbox&&(['prep','fight','reward','win','over'].includes(s.phase)||(v.version>=16&&s.phase==='journey'&&s.wave>=2&&s.wave<=10))&&Number.isInteger(s.wave)&&s.wave>=1&&s.wave<=11&&(v.version<18||([5,10].includes(s.campaign?.maxWaves)&&(s.phase==='win'?s.wave===s.campaign.maxWaves+1:s.wave<=s.campaign.maxWaves)))&&['units','enemies','ter','bench','held','wins','seenKinds','shots','hand','deck','offer','grid','queue','nextQueue','fx','floats','parts','zones'].every(k=>Array.isArray(s[k]))&&s.bench.length===3&&s.grid.length===9&&Number.isFinite(s.gold)&&Number.isFinite(s.wallHp)&&Number.isFinite(s.maxUnits)&&(v.version===14||(validId(v.runId)&&s.campaign?.version===1&&s.campaign.id===v.runId)));}
 function decode(v){if(!valid(v))throw Error('Incompatible campaign');const id=runId(v);return {...v,version:CAMPAIGN_SAVE_VERSION,runId:id,state:{...v.state,runId:id,campaign:metadata(id,{...v.state.campaign,maxWaves:v.version<18?10:v.state.campaign.maxWaves,routeEconomy:v.version<17?0:v.state.campaign.routeEconomy},v.version===14&&terminal(v.state.phase))}};}
 return Object.freeze({metadata,valid,decode,validId,terminal});
})();
/* Keep legacy spell and talent stores authoritative. This store owns the starting
   deck and its receipts together, so a card cannot be granted without its receipt. */
let campaignProfile=null,campaignProfileIssue=false;
function campaignCardId(id){return typeof id==='string'&&Object.hasOwn(CARDS,id);}
function normalizeRegionalRewards(v){const ids=['valley','forest','frozen','ashen','cathedral'];const set=new Set(Array.isArray(v.regionalRewards)?v.regionalRewards.filter(id=>ids.includes(id)):[]);if(v.forestUnlocked||v.frozenUnlocked||v.ashenUnlocked||v.cathedralUnlocked)set.add('valley');if(v.frozenUnlocked||v.ashenUnlocked||v.cathedralUnlocked)set.add('forest');if(v.ashenUnlocked||v.cathedralUnlocked)set.add('frozen');if(v.cathedralUnlocked)set.add('ashen');return ids.filter(id=>set.has(id));}
function campaignProfileNormalize(v){
 if(!v||v.version!==1||!Array.isArray(v.baseDeck)||!Array.isArray(v.claims))throw Error('Invalid permanent profile');
 const baseDeck=v.baseDeck.filter(campaignCardId);if(!baseDeck.length)throw Error('Empty starting deck');
 const claims=new Map();for(const r of v.claims){if(!CampaignSave.validId(r?.runId)||!campaignCardId(r?.cardId))throw Error('Invalid reward receipt');if(!claims.has(r.runId))claims.set(r.runId,{runId:r.runId,cardId:r.cardId});}
 return {version:1,baseDeck,claims:[...claims.values()],forestUnlocked:v.forestUnlocked===true||v.frozenUnlocked===true||v.ashenUnlocked===true||v.cathedralUnlocked===true,frozenUnlocked:v.frozenUnlocked===true||v.ashenUnlocked===true||v.cathedralUnlocked===true,ashenUnlocked:v.ashenUnlocked===true||v.cathedralUnlocked===true,cathedralUnlocked:v.cathedralUnlocked===true,regionalRewards:normalizeRegionalRewards(v),mastery:normalizeMastery(v),regionalSeals:normalizeRegionalSeals(v)};
}
function campaignProfileDisk(){const raw=localStorage.getItem(CAMPAIGN_PROFILE_KEY);return raw===null?null:campaignProfileNormalize(JSON.parse(raw));}
function campaignProfileMerge(a,b){
 // Legacy decks can contain intentional duplicate cards. Keep the greater count,
 // then derive all new rewards from the union of unique campaign receipts.
 const baseDeck=a.baseDeck.slice(),counts=new Map(),seen=new Map();for(const id of baseDeck)counts.set(id,(counts.get(id)||0)+1);
 for(const id of b.baseDeck){const n=(seen.get(id)||0)+1;seen.set(id,n);if(n>(counts.get(id)||0))baseDeck.push(id);}
 const claims=new Map(a.claims.map(r=>[r.runId,r]));for(const r of b.claims)if(!claims.has(r.runId))claims.set(r.runId,r);
 return {version:1,baseDeck,claims:[...claims.values()],forestUnlocked:a.forestUnlocked===true||b.forestUnlocked===true||a.frozenUnlocked===true||b.frozenUnlocked===true||a.ashenUnlocked===true||b.ashenUnlocked===true||a.cathedralUnlocked===true||b.cathedralUnlocked===true,frozenUnlocked:a.frozenUnlocked===true||b.frozenUnlocked===true||a.ashenUnlocked===true||b.ashenUnlocked===true||a.cathedralUnlocked===true||b.cathedralUnlocked===true,ashenUnlocked:a.ashenUnlocked===true||b.ashenUnlocked===true||a.cathedralUnlocked===true||b.cathedralUnlocked===true,cathedralUnlocked:a.cathedralUnlocked===true||b.cathedralUnlocked===true,regionalRewards:[...new Set([...normalizeRegionalRewards(a),...normalizeRegionalRewards(b)])],mastery:mergeMastery(a,b),regionalSeals:[...new Set([...normalizeRegionalSeals(a),...normalizeRegionalSeals(b)])]};
}
function campaignProfileApply(p){campaignProfile=p;META.deck=[...p.baseDeck,...p.claims.map(r=>r.cardId)];}
function campaignProfileInit(){
 if(campaignProfile)return campaignProfile;
 const fallback={version:1,baseDeck:META.deck.slice(),claims:[],forestUnlocked:false,frozenUnlocked:false,ashenUnlocked:false,cathedralUnlocked:false,regionalRewards:[],regionalSeals:[],mastery:{valley:0,forest:0,frozen:0,ashen:0,cathedral:0}};
 try{const p=campaignProfileDisk();if(p)campaignProfileApply(p);else{localStorage.setItem(CAMPAIGN_PROFILE_KEY,JSON.stringify(fallback));campaignProfileApply(fallback);}campaignProfileIssue=false;}
 catch(e){campaignProfileIssue=true;campaignProfileApply(fallback);}
 return campaignProfile;
}
function campaignProfileCommit(next){
 try{const disk=campaignProfileDisk();const merged=campaignProfileMerge(disk||campaignProfileInit(),next);localStorage.setItem(CAMPAIGN_PROFILE_KEY,JSON.stringify(merged));campaignProfileApply(merged);campaignProfileIssue=false;return true;}
 catch(e){campaignProfileIssue=true;return false;}
}
function campaignEndClaimed(state=S,id=sessionRunId){
 if(state?.campaign?.legacyTerminal)return true;
 let p=campaignProfileInit();try{const disk=campaignProfileDisk();if(disk){p=campaignProfileMerge(disk,p);campaignProfileApply(p);}}catch(e){campaignProfileIssue=true;}
 return p.claims.some(r=>r.runId===id);
}
function campaignClaimEndCard(index){
 if(!S||S.sandbox||!CampaignSave.terminal(S.phase)||!CampaignSave.validId(sessionRunId)||!Number.isInteger(index)||!campaignCardId(S.endOffer?.[index]))return false;
 if(campaignEndClaimed())return false;
 const p=campaignProfileInit();return campaignProfileCommit({...p,claims:[...p.claims,{runId:sessionRunId,cardId:S.endOffer[index]}]});
}
function campaignProfileBackup(){return {version:1,deck:campaignProfileInit(),spellKnowledge:spellKnowledge,warlordTalents:talentInit()};}
function campaignImportProfile(p){
 if(!p||p.version!==1)throw Error('Unsupported profile backup');
 const deck=campaignProfileNormalize(p.deck);const spells=knowledgeNormalize(p.spellKnowledge),talents=talentNormalize(p.warlordTalents);
 if(!campaignProfileCommit(campaignProfileMerge(campaignProfileInit(),deck)))throw Error('Could not save imported deck');
 spellKnowledge=masteryMergeProfiles(spellKnowledge,spells);knowledgeDirty=true;talentProfile=talentMerge(talentInit(),talents);talentDirty=true;
 const kOK=knowledgeFlush(),tOK=talentFlush();if(!kOK||!tOK)throw Error('Profile import incomplete; retry');
}
function campaignWrite(v){
 // Preserve the raw legacy save once, before the first schema upgrade.
 try{const raw=localStorage.getItem(SAVE_KEY);if(raw&&JSON.parse(raw)?.version===14&&localStorage.getItem(CAMPAIGN_LEGACY_BACKUP)===null)localStorage.setItem(CAMPAIGN_LEGACY_BACKUP,raw);}
 catch(e){storageOK=false;$('#saveStatus').textContent='Could not protect the existing save. Export a backup.';return false;}
 return durableWrite(SAVE_KEY,v);
}
