/* Disposable test arena. Never write sandbox state to campaign storage. */
const SANDBOX_MAX_UNITS=24,SANDBOX_MAX_ENTITIES=48,SANDBOX_MAX_ENEMIES=60;
let sandboxParked=null;
const sandboxActive=()=>!!S?.sandbox;
const sandboxGod=()=>sandboxActive()&&S.sandboxGod;
const sbEl=id=>document.getElementById(id);
function sandboxStatus(message){sbEl('sbStatus').textContent=message;}
function sandboxRefill(){if(!sandboxActive())return;S.gold=999999;S.spinsLeft=999;S.maxUnits=Math.min(S.maxUnits,SANDBOX_MAX_UNITS);}
function sandboxCards(){S.deck=Object.keys(CARDS);S.hand=S.deck.map((id,di)=>({id,di,used:false}));S.aim=null;}
function sandboxInitialize(){sandboxRefill();sandboxCards();S.sandboxGod=true;sbEl('sbWave').value=String(S.wave);sandboxStatus('All cards available. Select guardians or launch a wave.');}
function sandboxCanEdit(){return sandboxActive()&&!menuOpen&&!spinning&&!S.drag&&!S.pendingMerge&&$('#ov').hidden&&$('#ov2').hidden&&!$('#unitBestiary').open&&!$('#runePractice').open&&['prep','fight'].includes(S.phase);}
function sandboxEnter(heroId='sorcerer'){
 if(!menuOpen||spinning||sandboxActive()||sandboxParked)return;
 if(S?.drag)cancelDrag();if(S)persist();
 sandboxParked={state:S,runId:sessionRunId,name:runName,width:savedWorldWidth,save:loadedSave,status:$('#saveStatus').textContent,ov:$('#ov').innerHTML,ovHidden:$('#ov').hidden,ov2:$('#ov2').innerHTML,ov2Hidden:$('#ov2').hidden};
 S=null;sessionRunId='sandbox';runName='Sandbox';savedWorldWidth=null;$('#ov').hidden=true;$('#ov2').hidden=true;closeFront();newGame(true,heroId);
 $('#saveStatus').textContent='SANDBOX · Campaign save untouched';
}
function sandboxExit(){
 if(!sandboxActive()||spinning||!sandboxParked)return;
 heroClearKeys();magicCancel();
 if(S.drag)cancelDrag();
 const p=sandboxParked;sandboxParked=null;closeBestiary();tacticalHide();S=p.state;sessionRunId=p.runId;runName=p.name;savedWorldWidth=p.width;loadedSave=p.save;
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
function sandboxEnemy(kind,w){const K=KIND[kind],W=waveInfo(w);return {kind,hp:W.hp*K.hp,dmg:W.dmg*K.dmg,sp:W.sp*K.sp,r:K.r,range:K.range||0,armor:K.armor||K.boss?W.armor:0,boss:!!K.boss};}
function sandboxAddUnit(type,lvl){
 if(S.phase!=='prep'||!Object.hasOwn(BASE,type)||!MERGEABLE.includes(type)||S.units.length>=SANDBOX_MAX_UNITS)return false;
 const u=makeUnit(type,lvl),old=S.maxUnits;S.maxUnits=Math.min(SANDBOX_MAX_UNITS,Math.max(S.maxUnits,fieldCount()+1));
 if(!(fieldCount()<S.maxUnits&&placeNew(u))&&!toBench(u)){S.maxUnits=old;return false;}return true;
}
function sandboxAction(a){
 if(!sandboxCanEdit())return;
 const prep=S.phase==='prep';let msg='';
 if(a==='exit'){sandboxExit();return;}
 if(a==='god'){S.sandboxGod=!S.sandboxGod;if(S.sandboxGod)sandboxHeal();msg='God mode '+(S.sandboxGod?'enabled.':'disabled.');}
 else if(a==='heal'){sandboxHeal();msg='Army, altar and deployed hero healed.';}
 else if(a==='stop'){sandboxResetBattle();return;}
 else if(a==='wave'&&prep){S.wave=Math.max(1,Math.min(MAX_WAVE,Number(sbEl('sbWave').value)||1));S.nextQueue=rollWave(S.wave);sandboxHeal();prepUndoClear();msg='Wave '+S.wave+' loaded.';}
 else if(a==='fight'&&prep){if(!S.nextQueue.length){sandboxStatus('Add enemies or load a wave first.');return;}startFight();return;}
 else if(a==='unit'&&prep){prepUndoClear();msg=sandboxAddUnit(sbEl('sbUnit').value,Math.max(1,Math.min(3,Number(sbEl('sbLevel').value)||1)))?'Guardian added.':'No space available. Clear the army or reserve.';}
 else if(a==='clearUnits'&&prep){prepUndoClear();S.units=[];S.bench=[null,null,null];S.sel=null;msg='Army cleared.';}
 else if(a==='enemy'){const kind=sbEl('sbEnemy').value;if(!Object.hasOwn(KIND,kind))return;const q=prep?S.nextQueue:S.queue;const n=Math.min(Number(sbEl('sbCount').value)||1,Math.max(0,SANDBOX_MAX_ENEMIES-q.length-(prep?0:S.enemies.length)));for(let i=0;i<n;i++)q.push(sandboxEnemy(kind,S.wave));if(!prep)S.spawnT=0;msg=n+' enemies added to '+(prep?'next wave.':'spawn queue.');}
 else if(a==='clearEnemies'){if(prep){S.nextQueue=[];msg='Wave queue cleared.';}else{sandboxResetBattle('Enemies cleared. Ready for another test.');return;}}
 else if(a==='cards'){prepUndoClear();sandboxCards();msg='All cards refilled.';}
 else if(a==='magicMana'||a==='magicCooldown'||a==='magicRefill'){magicSandboxAction(a);msg='Magic lab settings updated.';}
 else return;
 setResult('Sandbox',msg);sandboxStatus(msg);renderUI();
}
function renderSandbox(){
 const p=sbEl('sandboxPanel'),on=sandboxActive();p.hidden=!on;if(!on)return;
 const prep=S.phase==='prep',ready=prep||S.phase==='fight';
 if(heroUsesMagic(S))magicRenderSandbox();
 sbEl('sbGod').textContent='God mode: '+(S.sandboxGod?'ON':'OFF');sbEl('sbGod').setAttribute('aria-pressed',String(S.sandboxGod));
 for(const b of p.querySelectorAll('[data-sb]')){const a=b.dataset.sb;b.disabled=spinning||!ready||(['wave','fight','unit','clearUnits'].includes(a)&&!prep);}
}
function initSandboxControls(){
 sbEl('sbWave').innerHTML=Array.from({length:MAX_WAVE},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join('');
 sbEl('sbUnit').innerHTML=MERGEABLE.map(t=>'<option value="'+t+'">'+NAMES[t]+'</option>').join('');
 sbEl('sbEnemy').innerHTML=Object.keys(KIND).map(k=>'<option value="'+k+'">'+KIND[k].n+'</option>').join('');
 sbEl('sandboxEnter').addEventListener('click',()=>heroChoose('sandbox'));
 sbEl('sandboxPanel').addEventListener('click',e=>{const b=e.target.closest('[data-sb]');if(b&&!b.disabled)sandboxAction(b.dataset.sb);});
}
