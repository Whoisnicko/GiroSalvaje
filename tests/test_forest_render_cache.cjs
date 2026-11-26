const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../',p),'utf8'),noop=()=>{};
let built=0,staticDraws=0,zoneLabels=0,frameLabels=0;const drawn=[];
function mock(o={}){return new Proxy(o,{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});}
const g=mock({drawImage:()=>staticDraws++,fillText:()=>zoneLabels++});
const c=vm.createContext({inkCanvas:(w,h)=>({id:'canvas-'+(++built),width:w,height:h,getContext:()=>g}),battlefieldArt:{id:'valley'},forestBattlefieldArt:{id:'forest'},ctx:mock({drawImage:im=>drawn.push(im.id),fillText:()=>frameLabels++}),S:{biomeId:'valley'},WORLD_H:260});
for(const p of ['engine/biomes-bosses.js','engine/renderer.js'])vm.runInContext(read(p),c);
const run=s=>vm.runInContext(s,c);
run("drawInkBackdrop(1000);S.biomeId='forest';for(let i=0;i<120;i++)drawInkBackdrop(1000)");
assert.equal(built,1);assert.equal(staticDraws,1);assert.equal(zoneLabels,4);assert.equal(frameLabels,0);assert.ok(drawn.slice(1).every(x=>x==='canvas-1'));
run("drawInkBackdrop(1100)");assert.equal(built,2);assert.equal(zoneLabels,8);
run("S.biomeId='valley';drawInkBackdrop(1000)");assert.equal(drawn.at(-1),'valley');
const html=read('index.html');assert.equal((html.match(/id="sbPerf"/g)||[]).length,1);assert.ok(/<summary>[^]*?id="sbPerf"[^]*?<\/summary>/.test(html));
console.log('Static forest composite, cache invalidation, Valley and telemetry placement OK');
