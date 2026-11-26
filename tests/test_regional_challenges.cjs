const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const harness=`
const CARDS={a:{}},META={deck:['a']},Journey={normalizeRoute:()=>[]};let saved=null,S=null;const localStorage={getItem:()=>saved,setItem:(k,v)=>saved=v};
const p=campaignProfileNormalize({version:1,baseDeck:['a'],claims:[],cathedralUnlocked:true});campaignProfileApply(p);
const meta=(difficulty='normal',challenge={version:1,failed:false})=>CampaignSave.metadata('run',{id:'run',maxWaves:5,difficulty,challenge});
const state=(region,phase='fight')=>({biomeId:region,phase,wave:phase==='win'?6:5,wallHp:70,wallMax:100,campaign:meta()});
const results={};
results.oldProfile=normalizeRegionalSeals(p).length===0;
results.oldRun=CampaignSave.metadata('old',{id:'old',maxWaves:5}).challenge===null;
S=state('valley','win');results.valleyAt70=challengeOutcome()===true;S.wallHp=69.99;results.valleyBelow70=challengeOutcome()===false;S.wallHp=70;
results.grant=challengeGrant()&&campaignProfileInit().regionalSeals.includes('valley');
results.idempotent=challengeGrant()&&campaignProfileInit().regionalSeals.length===1;
for(const [region,event] of Object.entries({forest:'hunterMark',frozen:'glacialPrison',ashen:'burningGroundDeath',cathedral:'resurrection'})){
 S=state(region);challengeEvent('unrelated');results[region+'Unrelated']=!S.campaign.challenge.failed;
 challengeEvent(event);S.campaign=CampaignSave.metadata('run',S.campaign);S.phase='win';S.wave=6;
 results[region+'FailureSaved']=challengeOutcome()===false&&!challengeGrant();
 S=state(region,'win');results[region+'Clean']=challengeOutcome()===true;
}
S=state('cathedral','win');S.sandbox=true;results.sandbox=challengeOutcome()===null&&!challengeGrant();
S=state('forest','win');S.campaign.maxWaves=10;results.classic=challengeOutcome()===null;
S=state('forest','over');results.defeat=challengeOutcome()===null;
S=state('forest','win');S.campaign.challenge=null;results.legacy=challengeOutcome()===null;
results.merge=campaignProfileMerge({...p,regionalSeals:['forest','invalid']},{...p,regionalSeals:['ashen','forest']}).regionalSeals.sort().join(',')==='ashen,forest';
results.map=challengeMapHTML('valley',2,campaignProfileInit()).includes('Mastery Seal earned');
return results;`;
const result=new Function([read('engine/biomes-bosses.js'),read('engine/campaign-save.js'),read('engine/regional-rewards.js'),harness].join('\n'))();
for(const [k,v] of Object.entries(result))assert.equal(v,true,k);
console.log(result);
