/* Disposable test arena. Never write sandbox state to campaign storage. */
const SANDBOX_MAX_UNITS=24,SANDBOX_MAX_ENTITIES=48,SANDBOX_MAX_ENEMIES=60;
let sandboxParked=null;
const sandboxActive=()=>!!S?.sandbox;
const sandboxGod=()=>sandboxActive()&&S.sandboxGod;
const sbEl=id=>document.getElementById(id);
function sandboxStatus(message){sbEl('sbStatus').textContent=message;}
/* Real frame-interval sampling only while Free Sandbox is active. */
let sbPerfStart=0,sbPerfFrames=0,sbPerfWorst=0;
function sandboxPerf(now,delta){
 if(!sandboxActive()||academyActive()||menuOpen||document.hidden||S.phase!=='fight'){sbPerfStart=0;sbPerfFrames=0;sbPerfWorst=0;return;}
 if(!sbPerfStart||delta>1000){sbPerfStart=now;sbPerfFrames=0;sbPerfWorst=0;return;}
 sbPerfFrames++;sbPerfWorst=Math.max(sbPerfWorst,delta);
 const elapsed=now-sbPerfStart;if(elapsed<1000)return;
 const fps=Math.round(sbPerfFrames*1000/elapsed);const perf=sbEl('sbPerf'),label=fps+' FPS · '+Math.round(sbPerfWorst)+' ms';if(perf.textContent!==label)perf.textContent=label;sbPerfStart=now;sbPerfFrames=0;sbPerfWorst=0;
}
function sandboxRefill(){if(!sandboxActive())return;S.gold=999999;S.spinsLeft=999;S.maxUnits=Math.min(S.maxUnits,SANDBOX_MAX_UNITS);}
function sandboxCards(){S.deck=Object.keys(CARDS);S.hand=S.deck.map((id,di)=>({id,di,used:false}));S.aim=null;}
function sandboxInitialize(){sandboxRefill();sandboxCards();S.sandboxGod=academyActive();sbEl('sbWave').value=String(S.wave);sbEl('sbRegion').value=biomeId(S);sandboxStatus('Select any map, wave or boss. No unlock required. Free Sandbox starts with real damage; God mode is optional.');sbEl('sandboxPanel').open=true;sandboxRefreshWaveOptions();}
function sandboxCanEdit(){return sandboxActive()&&!menuOpen&&!spinning&&!S.drag&&!S.pendingMerge&&$('#ov').hidden&&$('#ov2').hidden&&!$('#unitBestiary').open&&!$('#runePractice').open&&['prep','fight'].includes(S.phase);}
function sandboxEnter(heroId='sorcerer',build=null){
 if(!menuOpen||spinning||sandboxActive()||sandboxParked)return;
 if(S?.drag)cancelDrag();if(S)persist();
 sandboxParked={state:S,runId:sessionRunId,name:runName,width:savedWorldWidth,save:loadedSave,undo:{state:prepUndoState,wave:prepUndoWave,stack:prepUndoStack},status:$('#saveStatus').textContent,ov:$('#ov').innerHTML,ovHidden:$('#ov').hidden,ov2:$('#ov2').innerHTML,ov2Hidden:$('#ov2').hidden};
 S=null;sessionRunId='sandbox';runName='Sandbox';savedWorldWidth=null;$('#ov').hidden=true;$('#ov2').hidden=true;closeFront();newGame(true,heroId,build);
 $('#saveStatus').textContent='SANDBOX · Campaign save untouched';
}
function sandboxExit(){
 if(!sandboxActive()||spinning||!sandboxParked)return;
 heroCancelAim(false);heroClearKeys();magicCancel();
 if(S.drag)cancelDrag();
 const p=sandboxParked;sandboxParked=null;academySession=null;closeBestiary();tacticalHide();S=p.state;sessionRunId=p.runId;runName=p.name;savedWorldWidth=p.width;loadedSave=p.save;prepUndoState=p.undo.state;prepUndoWave=p.undo.wave;prepUndoStack=p.undo.stack;
 $('#ov').innerHTML=p.ov;$('#ov').hidden=p.ovHidden;$('#ov2').innerHTML=p.ov2;$('#ov2').hidden=p.ov2Hidden;
 $('#saveStatus').textContent=p.status;renderSandbox();heroRender();if(S){resize();renderUI();}else magicRender();showHome();
}
function sandboxHeal(){heroHeal();S.wallHp=S.wallMax;for(const u of [...S.units,...S.bench.filter(Boolean)]){u.down=false;u.gone=false;refreshHp(u);}}
function sandboxResetBattle(message='Battle reset.'){
 if(!sandboxActive())return;
 heroResetWave();magicResetWave();
 closeBestiary();S.units=S.units.filter(u=>!u.temp);for(const u of S.units){if(u.hx!=null){u.x=u.hx;u.y=u.hy;}delete u.hx;delete u.hy;u.skels=0;}
 S.phase='prep';S.enemies=[];S.queue=[];S.curQueue=[];S.shots=[];S.zones=[];S.fx=[];S.parts=[];S.floats=[];S.shake=0;S.buff={haste:0,slow:0};S.aim=null;S.aimP=null;S.sel=null;S.charge=false;S.confirmFight=false;S.fightT=0;S.spawnT=0;
 sandboxHeal();sandboxCards();prepUndoClear();setResult('Sandbox',message);sandboxStatus(message);renderUI();
}
function sandboxEnemy(kind,w){const K=KIND[kind],W=waveInfo(w);return bossStamp({kind,hp:W.hp*K.hp,dmg:W.dmg*K.dmg,sp:W.sp*K.sp,r:K.r,range:K.range||0,armor:K.armor||K.boss?W.armor:0,boss:!!K.boss},w,biomeId(typeof S==='undefined'?null:S));}
function sandboxAddUnit(type,lvl){
 if(S.phase!=='prep'||!Object.hasOwn(BASE,type)||!MERGEABLE.includes(type)||S.units.length>=SANDBOX_MAX_UNITS)return false;
 const u=makeUnit(type,lvl),old=S.maxUnits;S.maxUnits=Math.min(SANDBOX_MAX_UNITS,Math.max(S.maxUnits,fieldCount()+1));
 if(!(fieldCount()<S.maxUnits&&placeNew(u))&&!toBench(u)){S.maxUnits=old;return false;}return true;
}
/* Free Sandbox encounter director. Registry-driven; no campaign state writes. */
function sandboxRefreshWaveOptions(){
 const region=BIOME_DATA[sbEl('sbRegion').value]?sbEl('sbRegion').value:'valley';
 const max=region==='valley'?MAX_WAVE:BIOME_DATA[region].lastWave;
 const selected=Math.max(1,Math.min(max,Number(sbEl('sbWave').value)||1));
 sbEl('sbWave').innerHTML=Array.from({length:max},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join('');
 sbEl('sbWave').value=String(selected);
}
function sandboxBossOptions(){
 return [...Object.values(BOSS_DATA).map(d=>({id:d.id,name:d.name,region:Object.values(BIOME_DATA).find(b=>b.bossId===d.id)?.id||'valley',wave:d.wave})),{id:'classic',name:'Commander · Classic',region:'valley',wave:10}];
}
function sandboxEncounter(region,w,bossId=null){
 if(!Object.hasOwn(BIOME_DATA,region))return null;
 const max=region==='valley'?MAX_WAVE:BIOME_DATA[region].lastWave;
 w=Math.max(1,Math.min(max,Math.trunc(Number(w)||1)));
 if(bossId){
  const d=sandboxBossOptions().find(b=>b.id===bossId);if(!d)return null;
  region=d.region;w=d.wave;
  const W=waveInfo(w),K=KIND.com;
  const q=bossStamp({kind:'com',hp:W.hp*K.hp,dmg:W.dmg*K.dmg,sp:W.sp*K.sp,r:K.r,range:K.range||0,armor:W.armor,boss:true},w,region);
  if((q.bossId||'classic')!==d.id)return null;
  return {region,w,name:d.name,bossId:d.id,queue:[q]};
 }
 return {region,w,name:BIOME_DATA[region].name+' · Wave '+w,queue:rollWave(w,region)};
}
function sandboxLoadEncounter(encounter,autoFight=false){
 if(!sandboxActive()||academyActive()||!encounter)return false;
 if(S.phase==='fight')sandboxResetBattle('Switching test encounter.');
 S.biomeId=encounter.region;S.wave=encounter.w;sbPerfStart=0;sbPerfFrames=0;sbPerfWorst=0;sbEl('sbPerf').textContent='FPS —';
 heroResetWave();magicResetWave();sandboxHeal();sandboxCards();S.nextQueue=encounter.queue.map(q=>({...q}));
 S.sandboxEncounter={region:encounter.region,w:encounter.w,name:encounter.name,bossId:encounter.bossId||null,queue:encounter.queue.map(q=>({...q}))};
 sbEl('sbBoss').value=encounter.bossId||encounter.queue.find(q=>q.boss)?.bossId||(encounter.queue.some(q=>q.boss)?'classic':'');
 sbEl('sbRegion').value=encounter.region;sandboxRefreshWaveOptions();sbEl('sbWave').value=String(encounter.w);
 prepUndoClear();setResult('Sandbox',encounter.name+' ready');sandboxStatus(encounter.name+' ready · army retained');renderUI();
 if(autoFight)startFight();return true;
}
function sandboxPickRegion(region){
 if(!sandboxCanEdit()||academyActive()){if(S&&sandboxActive()){sbEl('sbRegion').value=biomeId(S);sandboxRefreshWaveOptions();sbEl('sbWave').value=String(S.wave);}return false;}
 const encounter=sandboxEncounter(region,S.wave);if(!encounter)return false;
 return sandboxLoadEncounter(encounter,false);
}
function sandboxPickBoss(id,autoFight=false){
 if(!sandboxCanEdit()||academyActive())return false;
 const encounter=sandboxEncounter('valley',1,id);
 if(!encounter){sandboxStatus('Invalid boss encounter. Nothing changed.');return false;}
 return sandboxLoadEncounter(encounter,autoFight);
}
function sandboxAction(a){
 if(!sandboxCanEdit())return;
 const prep=S.phase==='prep';let msg='';
 if(a==='exit'){sandboxExit();return;}
 if(a==='god'){S.sandboxGod=!S.sandboxGod;if(S.sandboxGod)sandboxHeal();msg='God mode '+(S.sandboxGod?'enabled.':'disabled.');}
 else if(a==='heal'){sandboxHeal();msg='Army, altar and deployed hero healed.';}
 else if(a==='stop'){sandboxResetBattle();return;}
 else if(a==='wave'||a==='waveStart'){sandboxLoadEncounter(sandboxEncounter(sbEl('sbRegion').value,sbEl('sbWave').value),a==='waveStart');return;}
 else if(a==='boss'||a==='bossStart'){if(!sbEl('sbBoss').value){sandboxStatus('Select a boss first.');return;}sandboxPickBoss(sbEl('sbBoss').value,a==='bossStart');return;}
 else if(a==='retry'){if(S.sandboxEncounter)sandboxLoadEncounter(S.sandboxEncounter,true);else sandboxStatus('Load an encounter first.');return;}
 else if(a==='fight'&&prep){if(!S.nextQueue.length){sandboxStatus('Add enemies or load a wave first.');return;}startFight();return;}
 else if(a==='unit'&&prep){prepUndoClear();msg=sandboxAddUnit(sbEl('sbUnit').value,Math.max(1,Math.min(3,Number(sbEl('sbLevel').value)||1)))?'Guardian added.':'No space available. Clear the army or reserve.';}
 else if(a==='clearUnits'&&prep){prepUndoClear();S.units=[];S.bench=[null,null,null];S.sel=null;msg='Army cleared.';}
 else if(a==='enemyOnly'){const kind=sbEl('sbEnemy').value,d=REGIONAL_ENEMIES[kind];if(!Object.hasOwn(KIND,kind))return;const region=d?.region||biomeId(S),w=Math.max(d?.firstWave||1,Math.min(region==='valley'?MAX_WAVE:BIOME_DATA[region].lastWave,S.wave));const W=waveInfo(w),K=KIND[kind],q=bossStamp({kind,hp:W.hp*K.hp,dmg:W.dmg*K.dmg,sp:W.sp*K.sp,r:K.r,range:K.range||0,armor:K.armor||K.boss?W.armor:0,boss:!!K.boss},w,region);sandboxLoadEncounter({region,w,name:K.n+' · solo test',queue:[q]},false);return;}
 else if(a==='enemy'){const kind=sbEl('sbEnemy').value;if(!Object.hasOwn(KIND,kind))return;if(!regionalEnemyAllowed(kind,biomeId(S))){sandboxStatus('Select '+BIOME_DATA[REGIONAL_ENEMIES[kind].region].name+' or use Test enemy only.');return;}const q=prep?S.nextQueue:S.queue;const n=Math.min(Number(sbEl('sbCount').value)||1,Math.max(0,SANDBOX_MAX_ENEMIES-q.length-(prep?0:S.enemies.length)));for(let i=0;i<n;i++)q.push(sandboxEnemy(kind,S.wave));if(!prep)S.spawnT=0;msg=n+' enemies added to '+(prep?'next wave.':'spawn queue.');}
 else if(a==='clearEnemies'){if(prep){S.nextQueue=[];msg='Wave queue cleared.';}else{sandboxResetBattle('Enemies cleared. Ready for another test.');return;}}
 else if(a==='cards'){prepUndoClear();sandboxCards();msg='All cards refilled.';}
 else if(a==='magicMana'||a==='magicCooldown'||a==='magicRefill'){magicSandboxAction(a);msg='Magic lab settings updated.';}
 else return;
 setResult('Sandbox',msg);sandboxStatus(msg);renderUI();
}
function renderSandbox(){
 const p=sbEl('sandboxPanel'),on=sandboxActive();p.hidden=!on;academyPaint();if(!on)return;
 const prep=S.phase==='prep',ready=prep||S.phase==='fight';sbEl('sbRegion').disabled=!ready;sbEl('sbWave').disabled=!ready;sbEl('sbBoss').disabled=!ready;
 const actual=(S.phase==='fight'?[...S.enemies.filter(e=>e.hp>0),...S.queue]:S.nextQueue)||[];
 const names=[...new Set(actual.filter(e=>e.boss).map(enemyDisplayName))];
 sbEl('sbLoaded').textContent=biomeDef(S).name+' · Wave '+S.wave+' · '+(names.join(' / ')||'No boss');
 for(const b of p.querySelectorAll('[data-sb-boss]')){b.disabled=spinning||!ready;b.setAttribute('aria-pressed',String(S.sandboxEncounter?.bossId===b.dataset.sbBoss));}
 if(heroUsesMagic(S))magicRenderSandbox();
 sbEl('sbGod').textContent='God mode: '+(S.sandboxGod?'ON':'OFF');sbEl('sbGod').setAttribute('aria-pressed',String(S.sandboxGod));const damageMode=sbEl('sbDamageMode');damageMode.textContent=S.sandboxGod?'IMMUNE':'DAMAGE ON';damageMode.setAttribute('data-immune',String(S.sandboxGod));
 for(const b of p.querySelectorAll('[data-sb]')){const a=b.dataset.sb;b.disabled=spinning||!ready||(['fight','unit','clearUnits'].includes(a)&&!prep)||(a==='retry'&&!S.sandboxEncounter);}
}
function initSandboxControls(){
 sbEl('sbRegion').innerHTML=Object.values(BIOME_DATA).map(b=>'<option value="'+b.id+'">'+b.name+'</option>').join('');
 sbEl('sbBoss').innerHTML='<option value="" disabled>Select boss</option>'+sandboxBossOptions().map(b=>'<option value="'+b.id+'">'+b.name+'</option>').join('');
 sbEl('sbBossQuick').innerHTML='<button type="button" data-sb="god" id="sbGod" aria-pressed="false">God mode: OFF</button>'+sandboxBossOptions().map(b=>'<button type="button" data-sb-boss="'+b.id+'" aria-pressed="false">Fight '+b.name+'</button>').join('');
 sbEl('sbBoss').addEventListener('change',e=>sandboxPickBoss(e.target.value,false));
 sandboxRefreshWaveOptions();sbEl('sbRegion').addEventListener('change',e=>sandboxPickRegion(e.target.value));
 sbEl('sbUnit').innerHTML=MERGEABLE.map(t=>'<option value="'+t+'">'+NAMES[t]+'</option>').join('');
 sbEl('sbEnemy').innerHTML=Object.keys(KIND).map(k=>'<option value="'+k+'">'+KIND[k].n+(REGIONAL_ENEMIES[k]?' · '+BIOME_DATA[REGIONAL_ENEMIES[k].region].name:'')+'</option>').join('');
 sbEl('sandboxEnter').addEventListener('click',academyOpen);
 sbEl('sandboxPanel').addEventListener('click',e=>{const direct=e.target.closest('[data-sb-boss]');if(direct&&!direct.disabled){e.preventDefault();sandboxPickBoss(direct.dataset.sbBoss,true);return;}const b=e.target.closest('[data-sb]');if(b&&!b.disabled)sandboxAction(b.dataset.sb);});
}
