const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const src=read('engine/regional-vfx.js'),r=read('engine/renderer.js'),m=read('engine/champion-motion.js'),h=read('index.html');
const harness=`
let S={phase:'fight',biomeId:'valley',enemies:[]},prefs={effects:'full'},feelClock=1,reduce=false,draws=0,saves=0,restores=0;
const WORLD_H=260,feelEnabled=()=>prefs.effects!=='off',feelReduced=()=>reduce,feelStrength=()=>prefs.effects==='soft'?.48:1,biomeId=s=>s.biomeId,bossDef=e=>e.def;
const noop=()=>{},ctx=new Proxy({save(){saves++},restore(){restores++},fillRect(){draws++}},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const res={};res.five=Object.keys(REGION_FX).length===5&&Object.keys(BOSS_PIXEL).length===5;
for(const [id,p] of Object.entries(BOSS_PIXEL)){res[id+'Mask']=p.mask.every(row=>row.length===p.mask[0].length&&/^[.123]+$/.test(row))&&p.palette.length===3;draws=0;bossPixelRelease({id,r:65},.5,1);res[id+'Draw']=draws>0;}
res.layoutUnique=Object.keys(BOSS_PIXEL).map(id=>JSON.stringify(bossPixelLayout(id,65,.5,2,6))).filter((x,i,a)=>a.indexOf(x)===i).length===5;
res.bounds=Object.values(REGION_FX).every(p=>{const q=regionalFxPoint(4,500,1000,260,p);return q.x>=0&&q.x<1000&&q.y>=0&&q.y<260});
res.deterministic=JSON.stringify(regionalFxPoint(4,1,1000,260,REGION_FX.forest))===JSON.stringify(regionalFxPoint(4,1,1000,260,REGION_FX.forest));
for(const id of Object.keys(REGION_FX)){S.biomeId=id;draws=0;regionalAmbient(1000);res[id+'Ambient']=draws>0&&draws<=56;}
prefs.effects='soft';draws=0;regionalAmbient(1000);res.soft=regionalFxBudget()===10&&draws<=20;
const boss={hp:100,def:{id:'inquisitor',radius:55,windup:2},bossCast:{x:100,y:100,left:1}};
S.enemies=[boss];const before=JSON.stringify(S);draws=0;bossWindupAccents(1000);res.windup=draws>0;res.immutable=JSON.stringify(S)===before;
boss.hp=0;draws=0;bossWindupAccents(1000);res.dead=draws===0;
boss.hp=100;S.phase='prep';draws=0;bossWindupAccents(1000);res.prep=draws===0;
prefs.effects='full';reduce=true;draws=0;regionalAmbient(1000);res.reduced=draws===0&&!bossPixelRelease({id:'paladin',r:65},.5,1);
reduce=false;prefs.effects='off';draws=0;regionalAmbient(1000);res.off=draws===0&&!bossPixelRelease({id:'paladin',r:65},.5,1);
res.stack=saves===restores;return res;`;
const res=new Function(src+'\n'+harness)();for(const [k,v] of Object.entries(res))assert.equal(v,true,k);
assert.ok(!src.includes('Math.random'),'deterministic render');
assert.ok(r.indexOf('bossWindupAccents(W);')<r.indexOf('bossDrawWarnings(W);'),'telegraph stays on top');
assert.ok(r.includes('regionalAmbient(W)')&&m.includes('bossPixelRelease(f,q,a)'),'hooks');
assert.ok(m.includes('bossDetails<')&&m.includes('if(f.points)'),'budget and spell paths');
assert.ok(h.indexOf('engine/regional-vfx.js')<h.indexOf('engine/champion-motion.js'),'script order');
console.log(res);
