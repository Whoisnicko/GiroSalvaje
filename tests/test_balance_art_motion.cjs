const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const g=read('engine/game.js'),r=read('engine/renderer.js'),bio=read('engine/biomes-bosses.js'),save=read('engine/campaign-save.js');
function between(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);if(i<0||j<=i)throw Error(a);return s.slice(i,j);}
const source=[bio,between(g,'const KIND = {','/* ================= Artefactos'),between(save,'const DIFFICULTIES=','function campaignDifficulty'),between(g,'const BASE = {','const MAX_UNITS'),between(g,'function visualPose','/* ================= Monsters')].join('\n');
const harness=`
const prefs={reduced:false},motionPreference={matches:false},VISUAL=new WeakMap(),S={fx:[],biomeId:'frozen',phase:'fight',fightT:0},WALL_X=40,WORLD_H=260,rnd=(a,b)=>(a+b)/2;
const res={},near=(a,b)=>Math.abs(a-b)<1e-7;
for(let w=1;w<=5;w++)res['early'+w]=near(waveInfo(w).hp,20*1.46**(w-1));
for(let w=6;w<=10;w++)res['late'+w]=near(waveInfo(w).hp,20*1.46**4*1.32**(w-5))&&waveInfo(w).hp<20*1.46**(w-1);
res.wave10=waveInfo(10).hp>waveInfo(9).hp&&waveInfo(10).dmg===26;
for(const region of Object.keys(BIOME_DATA)){const a=rollWave(5,region,'normal'),b=rollWave(5,region,'nightmare');res[region+'Count']=a.length===11&&b.length===11&&near(b.find(e=>e.boss).hp,a.find(e=>e.boss).hp*1.4);}
let u={type:'W',x:100,cd:0,ph:0};res.idle=visualPose(u,1).frame<4;u.x=95;u.moving=true;res.walkLeft=visualPose(u,1.1).flipX&&visualPose(u,1.2).frame>=4;u.moving=false;u.lunge=.14;u.lx=1;res.attackRight=!visualPose(u,1.3).flipX&&visualPose(u,1.4).frame>=8;
u.frostUntil=3;res.freeze=visualPose(u,1.5).frame===0&&visualPose(u,1.5).still;u.frostUntil=0;prefs.reduced=true;res.reduced=visualPose(u,1.5).still;prefs.reduced=false;motionPreference.matches=true;res.osReduced=visualPose(u,1.6).still;motionPreference.matches=false;
u.down=true;res.fallen=visualPose(u,2).still;u.down=false;u.lunge=0;res.revive=visualPose(u,2.1).rise===0;
const e={kind:'sol',x:100,moving:true,cd:0,ph:0};visualPose(e,1);e.x=90;res.enemyNoFlip=!visualPose(e,1.1).flipX;
return res;`;
const result=new Function(source+'\n'+harness)();for(const [k,v] of Object.entries(result))assert.equal(v,true,k);
assert.ok(r.includes('flipX:pose.flipX')&&r.includes('trainingPercent(u)'),'renderer integration');
const css=read('ui-art-motion-v50.css'),html=read('index.html');
assert.ok(css.includes('assets/ui/frame-bronze-v19.svg')&&css.includes('prefers-reduced-motion')&&html.includes('ui-art-motion-v50.css'),'UI integration');
console.log(result);
