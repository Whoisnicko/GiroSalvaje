const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../',p),'utf8');
function extract(s,start,end){const a=s.indexOf(start),b=s.indexOf(end,a);assert.ok(a>=0&&b>a,start);return s.slice(a,b);}
const game=read('engine/game.js'),hero=read('engine/heroes.js'),sp=read('engine/spell-effects.js'),bio=read('engine/biomes-bosses.js'),sb=read('engine/sandbox.js');
const source=[bio,extract(game,"function landShot(s){","\nfunction endWave"),extract(game,"function hitAltar(d){","\n"),extract(hero,"function heroDamageTarget(u,amount){","\nfunction heroHeal"),extract(sp,"function spellDamageAlly(u,amount){","\nfunction spellChain"),sb].join('\n');
const noop=()=>{},ctx=vm.createContext({WORLD_H:260,WALL_X:40,worldW:()=>1000,heroIsTarget:()=>false,infusionHidden:()=>false,spellEnemyRooted:e=>!!e.root,synergyFactor:()=>1,infusionReduce:(u,n)=>n,infusionLethal:()=>false,floatText:noop,feelNumber:noop,feelImpact:noop,radius:()=>10,sfx:noop,burst:noop,tip:noop,rnd:(a,b)=>(a+b)/2,S:{sandbox:true,sandboxGod:false,biomeId:'forest',fx:[],units:[],wallHp:100,shake:0}});
vm.runInContext(source+'\nfunction heroTargets(){return S.units;}',ctx);
const run=s=>vm.runInContext(s,ctx);
run("const a={x:520,y:72.8,hp:100},b={x:630,y:72.8,hp:100};S.units=[a,b];const e=bossStamp({kind:'com',hp:100,dmg:20,x:500,y:73,cd:0},5,'forest')");
run("landShot({k:'bolt',tgt:a,dmg:e.dmg})");assert.equal(run('a.hp'),88);
run("a.hp=100;bossAdvance(e,.1);bossAdvance(e,2.1)");assert.ok(Math.abs(run('a.hp')-83.2)<1e-8);assert.equal(run('b.hp'),100);
run("a.hp=100;S.sandboxGod=true;landShot({k:'bolt',tgt:a,dmg:e.dmg});e.bossCooldown=0;bossAdvance(e,.1);bossAdvance(e,2.1);hitAltar(20)");assert.equal(run('a.hp'),100);assert.equal(run('S.wallHp'),100);
run("S.sandboxGod=false;hitAltar(20)");assert.equal(run('S.wallHp'),80);
assert.ok(sb.includes('S.sandboxGod=academyActive()'));assert.ok(read('engine/academy.js').includes('S.sandboxGod=true'));
console.log('Huntsman basic/Mark damage, God mode, altar and Academy defaults OK');
