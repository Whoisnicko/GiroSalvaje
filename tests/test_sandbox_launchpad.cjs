const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../',p),'utf8'),game=read('engine/game.js'),rules=game.slice(game.indexOf('const KIND = {'),game.indexOf('\n',game.indexOf('function pickKind(table)')));
const sandbox=read('engine/sandbox.js');
const c=vm.createContext({console});vm.runInContext([read('engine/biomes-bosses.js'),rules,sandbox,`
const noop=()=>{},els={};function el(id){return els[id]||= {_html:'',_value:'',hidden:true,open:false,checked:false,disabled:false,listeners:{},set innerHTML(v){this._html=v;const opts=Array.from(v.matchAll(/<option value="([^"]*)"[^>]*>/g),m=>m[1]);this._value=opts[0]||'';},get innerHTML(){return this._html},get value(){return this._value},set value(v){this._value=String(v)},setAttribute(){},querySelectorAll(){return []},addEventListener(k,fn){this.listeners[k]=fn}};}
const document={getElementById:el},$=q=>el(q.slice(1)),WORLD_H=260,WALL_X=40,MAX_WAVE=10,rnd=(a,b)=>(a+b)/2,worldW=()=>1000,RELICS=[{n:'Test relic'}],FOE_NOTE={},BASE={W:{},A:{},M:{},B:{},N:{}},MERGEABLE=['W','A','M','B','N'],NAMES={W:'Zombie',A:'Archer',M:'Dragon',B:'Banshee',N:'Necromancer'},CARDS={test:{}};
let S={sandbox:false},menuOpen=true,spinning=false,selectedView='',started=0,selectedHero='',savedWorldWidth=900,sessionRunId='campaign',runName='Campaign',loadedSave={id:1},prepUndoState=null,prepUndoWave=1,prepUndoStack=[],academySession=null;
const academyActive=()=>!!academySession,academyPaint=noop,heroUsesMagic=()=>false,magicRenderSandbox=noop,heroResetWave=noop,magicResetWave=noop,heroHeal=noop,refreshHp=noop,prepUndoClear=noop,setResult=noop,closeBestiary=noop,tacticalHide=noop,heroCancelAim=noop,heroClearKeys=noop,magicCancel=noop,heroRender=noop,resize=noop,magicRender=noop,showHome=noop,persist=noop,cancelDrag=noop;
const front=id=>{selectedView=id;menuOpen=true},closeFront=()=>{menuOpen=false},heroChoose=id=>{selectedHero=id},academyOpen=()=>front('academyView');
const makeUnit=(type,lvl)=>({type,lvl,hp:100}),fieldCount=()=>S.units.length,placeNew=u=>{S.units.push(u);return true},toBench=()=>false;
const renderUI=()=>renderSandbox(),startFight=()=>{S.phase='fight';started++};
const newGame=(sandbox,hero,build)=>{S={sandbox,phase:'relic',biomeId:'valley',wave:1,units:[],bench:[null,null,null],wallMax:80,maxUnits:8,queue:[],nextQueue:[],enemies:[],hero:{hero,build}};};
const startRun=i=>{S.phase='prep';S.relic=RELICS[i];S.units=[makeUnit('W',1),makeUnit('A',1)];S.nextQueue=rollWave(1,'valley');sandboxInitialize();};
`].join('\n'),c);
const run=s=>vm.runInContext(s,c);
assert.ok(run("initSandboxControls();sandboxLaunchOpen();selectedView==='sandboxLaunchView'&&!S.sandbox"));
assert.ok(run("el('slRegion').value='frozen';el('slMode').value='boss';sandboxLaunchRefresh();el('slBoss').value='inquisitor';el('slPreset').value='balanced';el('slGod').checked=true;el('slAuto').checked=true;el('slRelic').value='0';sandboxLaunchProceed();selectedHero==='sandbox'"));
assert.ok(run("const original=S;const pending=sandboxTakeSetup();sandboxEnter('warlord',{rank:1},pending);S.biomeId==='frozen'&&S.wave===5&&S.phase==='fight'&&S.nextQueue.length===1&&S.nextQueue[0].bossId==='inquisitor'&&S.units.length===6&&S.sandboxGod&&started===1&&sandboxParked.state===original&&!el('sandboxPanel').open"));
assert.ok(run("sandboxLaunchOpen(true);el('slPreset').value==='retain'&&el('slBoss').value==='inquisitor'&&el('slMode').value==='boss'"));
assert.ok(run("el('slRegion').value='forest';el('slMode').value='enemy';el('slRoster').value='regional';sandboxLaunchRefresh();el('slEnemy').value='ranger';el('slCount').value='3';el('slGod').checked=false;el('slAuto').checked=false;sandboxLaunchProceed();S.biomeId==='forest'&&S.phase==='prep'&&S.nextQueue.length===3&&S.nextQueue.every(q=>q.kind==='ranger')&&S.units.length===6&&!S.sandboxGod"));
assert.ok(run("sandboxRoster('frozen','regional').join(',')==='frostSentinel,iceMarksman,frostHerald'&&sandboxRoster('valley','regional').length===0&&!sandboxRoster('forest').includes('frostSentinel')"));
assert.ok(run("sandboxExit();S===original&&sessionRunId==='campaign'&&loadedSave.id===1&&savedWorldWidth===900"));
const html=read('index.html');for(const id of ['sandboxLaunchView','sbGod','sbPerf','sbDamageMode','sbRoster','slGo'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
console.log('Launchpad, regional filtering, boss, preset, reconfigure and campaign restoration OK');
