/* Matched, deterministic headless encounters using the real combat update and regional rules.
   Not a complete campaign/browser test: hero, cards, relics, UI, audio and graphics are stubbed. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),g=read('engine/game.js'),bio=read('engine/biomes-bosses.js'),asc=read('engine/guardian-ascension.js'),save=read('engine/campaign-save.js');
function slice(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);if(i<0||j<=i)throw Error('Missing '+a);return s.slice(i,j);}
const core=[bio,slice(g,'const BASE = {','/* ================= Artefactos'),slice(g,'function stats(','/* Ocupación:'),slice(g,'const WALKABLE_BANDS=','function fieldNormalizeArmy'),slice(g,'function moveHuman(','function endWave'),slice(save,'const DIFFICULTIES=','function campaignDifficulty')].join('\n');
const harness=`
let S;let rngState=1,spawnState=1,rolling=false;
function rng(){rngState=(Math.imul(rngState,1664525)+1013904223)>>>0;return rngState/4294967296;}
function rnd(a,b){if(rolling)return a+(b-a)*rng();if(b===WORLD_H-28){spawnState=(Math.imul(spawnState,1664525)+1013904223)>>>0;return a+(b-a)*spawnState/4294967296;}return(a+b)/2;}
const noop=()=>{},worldW=()=>572,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),VISUAL=new WeakMap();
const magicAdvance=noop,heroAdvance=noop,relicAdvance=noop,heroAdvanceKnockback=noop,sfx=noop,tip=noop,bigMsg=noop,floatText=noop,feelNumber=noop,feelImpact=noop,feelSoul=noop,renderUI=noop;
const heroIsTarget=()=>false,heroTargets=()=>S.units,artifactOwned=()=>false,infusionStats=s=>s,infusionHeal=noop,infusionHidden=()=>false,guardianTraining=u=>u.train||0;
const martialGuardBuff=()=>false,martialTaunted=()=>false,martialInvulnerable=()=>false,synergyFactor=()=>1,relicGuardianFactor=()=>1,relicFangFactor=()=>1,relicCheckHalo=noop,relicOnFall=()=>false;
const spellEnemyRooted=e=>e.root>0,spellEnemySpeedFactor=()=>1,spellHarvestDeath=()=>false,sandboxActive=()=>false,sandboxGod=()=>false;
function heroDamageTarget(u,amount){if(u.down||u.hp<=0)return 0;const dealt=Math.min(u.hp,Math.max(0,amount));u.hp-=dealt;return dealt;}
function endWave(){S.phase='win';}function endRun(){S.phase='over';}
const teams={mixed:[3,2,2,2,2],ascended:[3,3,3,3,3],tier2:[2,2,2,2,2],support:[2,2,2,3,3],supportWeak:[2,1,1,3,3],frontAscended:[3,3,3,3,3],soloW:[3,1,1,1,1],soloA:[1,3,1,1,1],soloM:[1,1,3,1,1],soloN:[1,1,1,3,1],soloB:[1,1,1,1,3]};
function run(region,difficulty,w,team,seed){
 rngState=seed;spawnState=seed;rolling=true;
 S={phase:'fight',biomeId:region,wave:w,fightT:0,units:[],bench:[],enemies:[],queue:rollWave(w,region,difficulty),fx:[],shots:[],zones:[],floats:[],parts:[],buff:{haste:0,slow:0},mods:{warHp:1,archSpd:1,mageDmg:1,splash:1},wallHp:80,kills:0,gold:0,spawnT:0,shake:0};
 rolling=false;
 const positions=(['support','supportWeak','frontAscended','soloN','soloB'].includes(team))?[[185,160],[110,218],[110,104],[248,218],[248,104]]:[[248,160],[185,218],[185,104],[110,218],[110,140]];
 for(let j=0;j<5;j++){const u=makeUnit(MERGEABLE[j],teams[team][j]);u.x=u.hx=positions[j][0];u.y=u.hy=fieldY(positions[j][1]);u.cd=.2;S.units.push(u);}
 ascensionReset();ashResetBattle();catResetBattle();
 for(let step=0;step<2400&&S.phase==='fight';step++){update(.05);S.fx=[];S.parts=[];S.floats=[];}
 return {region,difficulty,w,team,seed,win:S.phase==='win',timeout:S.phase==='fight',t:Math.round(S.fightT*10)/10,hp:Math.max(0,S.wallHp),losses:S.units.filter(u=>!u.temp&&(u.down||u.hp<=0)).length,kills:S.kills,maxRaises:Math.max(0,...S.units.filter(u=>u.type==='N').map(u=>u.skels||0)),metrics:S.ascMetrics};
}
return run;`;
function runner(enabled){const src=asc.replace(/const ASCENSION_PREVIEW_ON=.*?;\n/,'const ASCENSION_PREVIEW_ON='+enabled+';\n');let seeded=1;const math=Object.create(Math);math.random=()=>{seeded=(Math.imul(seeded,1664525)+1013904223)>>>0;return seeded/4294967296;};return new Function('Math',core+'\n'+src+'\n'+harness)(math);}
const pairs=[];
for(const region of ['valley','forest','frozen','ashen','cathedral'])for(const difficulty of ['normal','veteran','nightmare'])for(const w of [3,5])for(const team of ['mixed','ascended','tier2','support','supportWeak','frontAscended',...(w===5?['soloW','soloA','soloM','soloN','soloB']:[])])for(const seed of [17,71]){
 // Same seeded queue and entry positions. The actual random choice function uses Math.random;
 // reset by constructing both runners per pair below, so visual RNG never affects the next queue.
 const a=runner(false)(region,difficulty,w,team,seed),b=runner(true)(region,difficulty,w,team,seed);
 pairs.push({a,b});
 assert.equal(a.timeout||b.timeout,false,'timeout '+region+' '+difficulty+' '+team);assert.equal(b.maxRaises<=6,true,'necromancy cap');
 if(team==='tier2'){assert.deepEqual([a.win,a.t,a.hp,a.losses,a.kills],[b.win,b.t,b.hp,b.losses,b.kills],'Tier II changed');assert.equal(Object.keys(b.metrics).length,0);}
}
const agg={};for(const {a,b} of pairs){const x=agg[b.team]||(agg[b.team]={pairs:0,winsOff:0,winsOn:0,timeOff:0,timeOn:0,hpOff:0,hpOn:0,lossOff:0,lossOn:0,casts:{},bothWin:0,bothWinTimeOff:0,bothWinTimeOn:0});x.pairs++;x.winsOff+=+a.win;x.winsOn+=+b.win;x.timeOff+=a.t;x.timeOn+=b.t;x.hpOff+=a.hp;x.hpOn+=b.hp;x.lossOff+=a.losses;x.lossOn+=b.losses;if(a.win&&b.win){x.bothWin++;x.bothWinTimeOff+=a.t;x.bothWinTimeOn+=b.t;}for(const [k,m] of Object.entries(b.metrics))x.casts[k]=(x.casts[k]||0)+m.casts;}
for(const k of Object.keys(agg)){const x=agg[k];for(const n of ['timeOff','timeOn','hpOff','hpOn','lossOff','lossOn'])x[n]=Math.round(x[n]/x.pairs*100)/100;if(x.bothWin){x.bothWinTimeOff=Math.round(x.bothWinTimeOff/x.bothWin*100)/100;x.bothWinTimeOn=Math.round(x.bothWinTimeOn/x.bothWin*100)/100;}}
console.log(JSON.stringify({pairs:pairs.length,aggregate:agg,rows:pairs}));
