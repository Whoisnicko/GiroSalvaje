/* Read-only balance audit. Run node tests/global-balance-baseline.cjs */
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const game=read('engine/game.js'),bio=read('engine/biomes-bosses.js'),save=read('engine/campaign-save.js');
function between(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);if(i<0||j<=i)throw Error('Missing anchors '+a);return s.slice(i,j);}
const seedCode=`const seed=20261126;let x=seed;
const random=()=>{x=(x+0x6D2B79F5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
const Math=Object.create(globalThis.Math);Math.random=random;const rnd=(a,b)=>a+(b-a)*random();`;
const source=[seedCode,bio,between(game,'const SYM = {','const guardOf ='),between(game,'const KIND = {','/* ================= Artefactos'),between(save,'const DIFFICULTIES=','function campaignDifficulty')].join('\n');
const harness=`
const round=(v,n=2)=>Number(v.toFixed(n)),check=(v,m)=>{if(!v)throw Error(m);};
const rows=[],sampleN=5000;
for(const region of Object.keys(BIOME_DATA))for(let w=1;w<=5;w++){
 let hp=0,damage=0,n=0,bossHP=0,bossDamage=0;
 for(let i=0;i<sampleN;i++){const q=rollWave(w,region,'normal');hp+=q.reduce((s,e)=>s+e.hp,0);damage+=q.reduce((s,e)=>s+e.dmg,0);n=q.length;const b=q.find(e=>e.boss);if(b){bossHP=b.hp;bossDamage=b.dmg;}check(n===waveInfo(w).n+(w===5?1:0),'wave count');}
 rows.push({region,w,n,meanHP:round(hp/sampleN),meanAttackSum:round(damage/sampleN),bossHP:round(bossHP),bossDamage:round(bossDamage)});
}
for(const region of Object.keys(BIOME_DATA))for(let w=1;w<=5;w++)for(const [tier,m] of Object.entries(DIFFICULTIES)){
 const saved=x;const a=rollWave(w,region,'normal');x=saved;const b=rollWave(w,region,tier);
 check(a.length===b.length&&a.every((e,i)=>e.kind===b[i].kind&&Math.abs(b[i].hp-e.hp*m.hp)<1e-8&&Math.abs(b[i].dmg-e.dmg*m.damage)<1e-8),'difficulty paired');
}
const slot={samples:200000,hit:0,zero:0,lines:0,units:0,souls:0,jackpot:0};
for(let i=0;i<slot.samples;i++){const grid=Array.from({length:9},()=>BAG[Math.floor(random()*BAG.length)]),hits=[];for(const line of LINES){const nw=line.map(j=>grid[j]).filter(k=>k!=='X');if(!nw.length||nw.every(k=>k===nw[0]))hits.push(nw[0]||'XXX');}
 if(hits.length)slot.hit++;else slot.zero++;slot.lines+=hits.length;if(hits.length===8){slot.jackpot++;slot.souls+=10;}for(const k of hits){if(k==='XXX')slot.souls+=6;else if(k==='C')slot.souls+=3;else slot.units++;}
}
const fresh=Array.from({length:10},(_,i)=>{const w=i+1,d=waveInfo(w);return {w,n:d.n+(d.boss?1:0),soldierHP:round(d.hp),soldierAttack:round(d.dmg)};});
const units=Object.entries(BASE).filter(([k])=>['W','A','M','N','B'].includes(k)).map(([id,b])=>({id,name:SYM[id].n,hp:LV_MULT.map(m=>Math.round(b.hp*m)),dps:LV_MULT.map((m,i)=>round(Math.round(b.dmg*m)/(b.cd*LV_CD[i])))}));
return {seed,sampleN,rows,fresh,units,slot:{samples:slot.samples,hitPct:round(slot.hit/slot.samples*100),zeroPct:round(slot.zero/slot.samples*100),meanLines:round(slot.lines/slot.samples,3),meanUnits:round(slot.units/slot.samples,3),meanSouls:round(slot.souls/slot.samples,3),jackpotPct:round(slot.jackpot/slot.samples*100,3),threeIndependentMissPct:round((slot.zero/slot.samples)**3*100)},pairedChecks:75};
`;
console.log(JSON.stringify(new Function(source+'\n'+harness)(),null,2));
