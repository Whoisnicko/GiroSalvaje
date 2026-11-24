/* Sorcerer state machine: idle -> draw -> aim -> cast. Effects dispatched separately. */
const MAGIC_MAX=100,MAGIC_REGEN=2,MAGIC_SLOW=.3,MAGIC_DRAW_MS=4000,MAGIC_AIM_MS=2000,MAGIC_RECOVERY_MS=3000;
const SPELL_DATA=Object.freeze({
 fire:{mana:25,cd:8,r:72,target:'area',damage:28,perTwoWaves:2,implemented:true},barrier:{mana:30,cd:18,r:28,target:'ally',hpFraction:.5,duration:5,implemented:true},
 lightning:{mana:20,cd:6,r:90,target:'enemy',damage:[24,18,12],implemented:true},grasp:{mana:20,cd:12,r:62,target:'area',duration:2.5,implemented:true},
 frost:{mana:30,cd:14,r:80,target:'area',duration:4,slow:.5,implemented:true},harvest:{mana:35,cd:25,r:75,target:'area',duration:5,bonusCap:4,implemented:true}
});
let magicOwner=null,magicMode='idle',magicDeadline=0,magicReadyAt=0,magicStroke=[],magicPointer=null,magicAim=null,magicRune=null,magicPulse=null,magicMessage='Draw learned runes in combat. Learn more in the Grimoire.',magicLastHud=-Infinity,magicHudKey='';
const magicEl=id=>document.getElementById(id);
const magicDef=id=>RUNE_DEFS.find(d=>d.id===id);
function magicNewData(old={},sandbox=false){
 const mana=Number.isFinite(old.mana)?Math.max(0,Math.min(MAGIC_MAX,old.mana)):MAGIC_MAX;
 const cooldowns={};for(const id of Object.keys(SPELL_DATA)){const v=old.cooldowns?.[id];cooldowns[id]=Number.isFinite(v)?Math.max(0,Math.min(SPELL_DATA[id].cd,v)):0;}
 return {mana,cooldowns,infinite:sandbox&&old.infinite!==false,noCooldown:sandbox&&old.noCooldown!==false,testTier:sandbox?masteryInt(old.testTier,1,3):1};
}
function magicData(){if(!S)return null;if(!S.magic||magicOwner!==S){S.magic=magicNewData(S.magic||{},!!S.sandbox);}return S.magic;}
function magicSync(){
 if(magicOwner===S)return;
 magicRelease();magicOwner=S;magicMode='idle';magicDeadline=0;magicReadyAt=0;magicStroke=[];magicAim=null;magicRune=null;magicPulse=null;magicMessage='Draw learned runes in combat. Learn more in the Grimoire.';magicHudKey='';magicLastHud=-Infinity;
 if(S)S.magic=magicNewData(S.magic||{},!!S.sandbox);
}
function magicActive(){return !!S&&magicOwner===S&&magicMode!=='idle'&&S.phase==='fight';}
function magicAllowed(id){return !!S&&(!!S.sandbox||knowledgeLearned(id));}
function magicCanInteract(){return !!S&&S.phase==='fight'&&!menuOpen&&!document.hidden&&!spinning&&!S.drag&&!S.pendingMerge&&$('#ov').hidden&&$('#ov2').hidden&&!$('#unitBestiary').open&&!$('#runePractice').open;}
function magicAvailable(id){const m=magicData(),d=SPELL_DATA[id];return !!(m&&d&&magicAllowed(id)&&(m.infinite||m.mana+1e-6>=d.mana)&&(m.noCooldown||m.cooldowns[id]<=1e-6));}
function magicRelease(){if(magicPointer!==null){if(typeof cv!=='undefined'&&cv.hasPointerCapture?.(magicPointer))cv.releasePointerCapture(magicPointer);magicPointer=null;}}
function magicSetMessage(message){magicMessage=message;magicRender();}
function magicCancel(message='Conjuration canceled.'){
 if(magicMode==='idle')return false;
 magicMode='idle';magicRelease();magicStroke=[];magicAim=null;magicRune=null;magicDeadline=0;magicReadyAt=performance.now()+MAGIC_RECOVERY_MS;
 if(S){S.aimP=null;cv.style.cursor='default';}
 magicSetMessage(message);return true;
}
function magicResetWave(){
 magicSync();magicCancel();if(!S)return;
 const m=magicData();m.mana=MAGIC_MAX;for(const id of Object.keys(SPELL_DATA))m.cooldowns[id]=0;
 magicReadyAt=0;magicPulse=null;spellClearWave();magicMessage='Draw learned runes in combat. Learn more in the Grimoire.';magicRender();
}
function magicAdvance(dt){const m=magicData();if(!m)return;spellAdvance(dt);m.mana=m.infinite?MAGIC_MAX:Math.min(MAGIC_MAX,m.mana+MAGIC_REGEN*dt);for(const id of Object.keys(SPELL_DATA))m.cooldowns[id]=Math.max(0,m.cooldowns[id]-dt);}
function magicBegin(now=performance.now()){
 magicSync();if(magicActive()){magicCancel();return false;}
 if(!magicCanInteract())return false;
 if(now<magicReadyAt){magicSetMessage('Arcane recovery — wait before drawing again.');return false;}
 if(!Object.keys(SPELL_DATA).some(magicAvailable)){magicSetMessage('No available spells: wait for mana or cooldowns.');return false;}
 audioInit();if(S.aim!==null){S.aim=null;renderHand();}S.aimP=null;S.sel=null;tacticalClearEnemy();tacticalHide();
 magicMode='draw';magicDeadline=now+MAGIC_DRAW_MS;magicStroke=[];magicRune=null;magicAim=null;cv.style.cursor='crosshair';magicSetMessage('Draw a learned rune with one continuous stroke.');return true;
}
function magicPoint(e){const r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function magicWorld(p){return {x:p.x/scale,y:p.y/scale};}
function magicInField(p){return p.x>=WALL_X&&p.x<=worldW()&&p.y>=0&&p.y<WORLD_H;}
function magicAppend(e){const p=magicPoint(e),r=cv.getBoundingClientRect(),q=[Math.max(0,Math.min(r.width,p.x)),Math.max(0,Math.min(WORLD_H*scale,p.y))];if(magicStroke.length<2048&&(!magicStroke.length||runeDistance(q,magicStroke.at(-1))>=1.3))magicStroke.push(q);}
function magicRecognize(now){
 const result=recognizeRune(magicStroke);magicRelease();
 if(!result.accepted){magicCancel(runeFeedbackText(result));return false;}
 const id=result.id,d=magicDef(id);
 if(!magicAllowed(id)){magicCancel(d.name+' is sealed. '+knowledgeHint(id));return false;}
 if(!magicAvailable(id)){magicCancel(d.name+' is unavailable: mana or cooldown.');return false;}
 magicRune=id;magicMode='aim';magicDeadline=now+MAGIC_AIM_MS;magicAim=null;magicStroke=[];magicSetMessage(d.name+' recognized · choose a target.');return true;
}
// Sandbox-only direct targeting, leaving normal Q and recognition unchanged.
function magicQuickSelect(id,now=performance.now()){
 magicSync();if(!S?.sandbox||!magicCanInteract()||!magicAvailable(id))return false;
 if(!magicActive()&&!magicBegin(now))return false;
 magicRelease();magicStroke=[];magicRune=id;magicMode='aim';magicDeadline=now+MAGIC_AIM_MS;magicAim=null;
 magicSetMessage(magicDef(id).name+' · sandbox quick aim · choose a target.');return true;
}
function magicTarget(id,p){
 const d=SPELL_DATA[id];if(!d||!p||!magicInField(p))return null;
 if(d.target==='area')return {x:p.x,y:p.y,entity:null};
 const pool=d.target==='ally'?S.units.filter(u=>!u.down&&u.hp>0&&!u.gone&&u.y<WORLD_H):S.enemies.filter(e=>e.hp>0);
 let best=null,bd=Infinity;for(const e of pool){const dist=Math.hypot(e.x-p.x,e.y-p.y),reach=(d.target==='ally'?radius(e):e.r)+12;if(dist<=reach&&dist<bd){best=e;bd=dist;}}
 return best?{x:best.x,y:best.y,entity:best}:null;
}
function magicConfirm(p,now=performance.now()){
 if(!magicActive()||magicMode!=='aim'||now>=magicDeadline){magicCancel('Conjuration expired.');return false;}
 const id=magicRune,d=SPELL_DATA[id],target=magicTarget(id,p);
 if(!target){magicSetMessage('Invalid target — aim inside the battlefield or select a living unit.');return false;}
 if(!magicAvailable(id)){magicCancel('Spell unavailable.');return false;}
 const m=magicData();if(!m.infinite)m.mana=Math.max(0,m.mana-d.mana);m.cooldowns[id]=m.noCooldown?0:d.cd;

 const outcome=spellExecute(id,target);
 if(!d.implemented){magicPulse={id,x:target.x,y:target.y,start:now,end:now+650};sfx('card');}
 const name=magicDef(id).name;magicCancel(name+' · '+outcome);persist();return true;
}
function magicFrame(now){
 magicSync();
 if(magicMode!=='idle'&&(!magicCanInteract()||now>=magicDeadline))magicCancel(now>=magicDeadline?'Conjuration expired.':'Conjuration interrupted.');
 if(magicPulse&&now>=magicPulse.end)magicPulse=null;
 if(now-magicLastHud>=100){magicLastHud=now;magicRender(now);}
}
function magicRender(now=performance.now()){
 const hud=magicEl('magicHud');if(!hud)return;
 const visible=!!S&&['prep','fight'].includes(S.phase);hud.hidden=!visible;if(!visible)return;
 const m=magicData(),value=Math.floor(m.mana+1e-6),cast=magicEl('magicCast'),active=magicActive();
 magicEl('magicManaText').textContent=m.infinite?'∞':value+' / '+MAGIC_MAX;
 magicEl('magicManaFill').style.width=(m.infinite?100:m.mana)+'%';hud.querySelector('.magic-meter').setAttribute('aria-valuenow',String(m.infinite?100:value));
 cast.disabled=!active&&(!magicCanInteract()||now<magicReadyAt||!Object.keys(SPELL_DATA).some(magicAvailable));cast.setAttribute('aria-pressed',String(active));cast.innerHTML=active?'Cancel <kbd>Q / Esc</kbd>':'✧ CAST <kbd>Q</kbd>';
 hud.dataset.mode=active?magicMode:'idle';
 magicEl('magicTimer').textContent=active?'TIME ×0.3 · '+Math.max(0,(magicDeadline-now)/1000).toFixed(1)+'s':now<magicReadyAt?'Recovery '+((magicReadyAt-now)/1000).toFixed(1)+'s':'';
 const msg=S.phase==='prep'?'Magic ready for battle.':magicMessage;if(magicEl('magicMessage').textContent!==msg)magicEl('magicMessage').textContent=msg;
 const lab=magicEl('magicSandbox');lab.hidden=!S.sandbox;
 const list=magicEl('magicSpells'),defs=RUNE_DEFS.filter(d=>magicAllowed(d.id)),key=(S.sandbox?'sandbox:':'campaign:')+defs.map(d=>d.id).join(',');
 if(key!==magicHudKey||list.children.length!==defs.length){
  list.innerHTML=defs.map(d=>{const tag=S.sandbox?'button':'span',data=S.sandbox?' type="button" data-magic-quick="'+d.id+'" title="Sandbox: aim '+d.name+' without drawing"':'';return '<'+tag+data+' class="magic-spell" data-magic-id="'+d.id+'" style="--rune-color:'+d.color+'">'+runeGlyph(d)+'<span><b>'+d.name+'</b><small></small></span></'+tag+'>';}).join('');
  magicHudKey=key;
 }
 for(const el of list.children){const id=el.dataset.magicId,d=SPELL_DATA[id],cd=m.noCooldown?0:m.cooldowns[id],ready=magicAvailable(id);el.classList.toggle('ready',ready);el.querySelector('small').textContent='T'+masteryTier(id)+' · '+d.mana+' MP · '+(cd>0?cd.toFixed(1)+'s':'Ready')+(d.implemented?'':' · Preview');if(S.sandbox){el.disabled=!ready||!magicCanInteract()||(!active&&now<magicReadyAt);el.setAttribute('aria-pressed',String(active&&magicRune===id));}}
 if(S.sandbox)magicRenderSandbox();
}
function magicRenderSandbox(){
 if(!S?.sandbox)return;const m=magicData();
 for(const [id,on,label] of [['sbMagicMana',m.infinite,'Infinite mana'],['sbMagicCooldown',m.noCooldown,'No spell cooldown']]){const b=magicEl(id);b.textContent=label+': '+(on?'ON':'OFF');b.setAttribute('aria-pressed',String(on));}
 const tier=magicEl('sbSpellTier');if(tier.value!==String(m.testTier))tier.value=String(m.testTier);tier.disabled=menuOpen||!['prep','fight'].includes(S.phase)||spinning||!$('#ov').hidden||!$('#ov2').hidden||$('#unitBestiary').open||$('#runePractice').open;
 for(const b of magicEl('magicSandbox').querySelectorAll('[data-sb-magic]'))b.disabled=menuOpen||!['prep','fight'].includes(S.phase)||spinning||!$('#ov').hidden||!$('#ov2').hidden||$('#unitBestiary').open||$('#runePractice').open;
}
function magicSandboxAction(a){
 if(!S?.sandbox)return;magicSync();magicCancel();const m=magicData();
 if(a==='magicMana'){m.infinite=!m.infinite;if(m.infinite)m.mana=MAGIC_MAX;}
 else if(a==='magicCooldown'){m.noCooldown=!m.noCooldown;if(m.noCooldown)for(const id of Object.keys(SPELL_DATA))m.cooldowns[id]=0;}
 else if(a==='magicRefill'){m.mana=MAGIC_MAX;for(const id of Object.keys(SPELL_DATA))m.cooldowns[id]=0;}
 magicRenderSandbox();magicRender();
}
function magicDraw(now){
 if(!magicActive()&&!magicPulse)return;
 ctx.save();ctx.beginPath();ctx.rect(0,0,worldW(),WORLD_H);ctx.clip();
 const ring=(x,y,r,c,alpha=.85)=>{ctx.save();ctx.globalAlpha=alpha*.14;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=alpha;ctx.strokeStyle=c;ctx.lineWidth=1.8;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);ctx.restore();};
 if(magicActive()){
  ctx.fillStyle='rgba(28,65,97,.12)';ctx.fillRect(0,0,worldW(),WORLD_H);
  if(magicMode==='draw'&&magicStroke.length){const path=()=>{ctx.beginPath();magicStroke.forEach((q,i)=>i?ctx.lineTo(q[0]/scale,q[1]/scale):ctx.moveTo(q[0]/scale,q[1]/scale));};ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#55dff5';ctx.shadowColor='#55dff5';ctx.shadowBlur=prefs.reduced?0:12;ctx.lineWidth=5/scale;path();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#e4fbff';ctx.lineWidth=1.7/scale;path();ctx.stroke();ctx.restore();}
  if(magicMode==='aim'&&magicAim){const d=masterySpell(magicRune),t=magicTarget(magicRune,magicAim),p=t||magicAim,c=t?magicDef(magicRune).color:'#e18f88';ring(p.x,p.y,d.target==='ally'&&t?radius(t.entity)+9:d.target==='enemy'&&t?t.entity.r+8:d.r,c);if(magicRune==='lightning'&&t){const chain=spellChain(t.entity,d);ctx.save();ctx.strokeStyle=c;ctx.setLineDash([3,5]);ctx.lineWidth=1.2;ctx.beginPath();chain.forEach((e,i)=>i?ctx.lineTo(e.x,e.y):ctx.moveTo(e.x,e.y));ctx.stroke();ctx.restore();}ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x-8,p.y);ctx.lineTo(p.x+8,p.y);ctx.moveTo(p.x,p.y-8);ctx.lineTo(p.x,p.y+8);ctx.stroke();}
 }
 if(magicPulse){const a=Math.max(0,(magicPulse.end-now)/(magicPulse.end-magicPulse.start)),d=SPELL_DATA[magicPulse.id];ring(magicPulse.x,magicPulse.y,d.r*(prefs.reduced?1:1+.12*(1-a)),magicDef(magicPulse.id).color,a);}
 ctx.restore();
}
function initMagicControls(){
 magicEl('magicCast').addEventListener('click',()=>magicBegin());
 magicEl('sbSpellTier').addEventListener('change',e=>{if(!S?.sandbox||!sandboxCanEdit())return;magicCancel();magicData().testTier=masteryInt(Number(e.target.value),1,3);magicRender();});
 magicEl('magicSpells').addEventListener('click',e=>{const b=e.target.closest('[data-magic-quick]');if(b&&!b.disabled)magicQuickSelect(b.dataset.magicQuick);});
 magicEl('magicSandbox').addEventListener('click',e=>{const b=e.target.closest('[data-sb-magic]');if(b&&!b.disabled&&sandboxCanEdit())magicSandboxAction(b.dataset.sbMagic);});
 document.addEventListener('keydown',e=>{
  if(!magicActive()&&e.key.toLowerCase()!=='q')return;
  if(!magicActive()&&(e.target.closest?.('input,select,textarea,[contenteditable]')||e.ctrlKey||e.metaKey||e.altKey||!magicCanInteract()))return;
  if(e.key==='Escape'&&magicActive()){e.preventDefault();e.stopImmediatePropagation();magicCancel();return;}
  if(e.key.toLowerCase()==='q'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)magicBegin();return;}
  if(magicActive()){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 document.addEventListener('pointerdown',e=>{if(magicActive()&&e.target!==cv&&!e.target.closest?.('#magicCast,[data-magic-quick]'))magicCancel('Conjuration canceled.');},true);
 const consume=e=>{e.preventDefault();e.stopImmediatePropagation();};
 cv.addEventListener('pointerdown',e=>{
  if(!magicActive())return;consume(e);if(e.button!==0&&e.pointerType==='mouse')return;
  const now=performance.now();if(now>=magicDeadline){magicCancel('Conjuration expired.');return;}
  const p=magicWorld(magicPoint(e));
  if(magicMode==='aim'){magicConfirm(p,now);return;}
  if(magicPointer!==null||!magicInField(p))return;magicStroke=[];magicPointer=e.pointerId;cv.setPointerCapture(e.pointerId);magicAppend(e);
 },true);
 cv.addEventListener('pointermove',e=>{if(!magicActive())return;consume(e);if(magicMode==='aim'){magicAim=magicWorld(magicPoint(e));return;}if(magicPointer!==e.pointerId)return;const batch=e.getCoalescedEvents?.()||[];if(batch.length)batch.forEach(magicAppend);else magicAppend(e);},true);
 cv.addEventListener('pointerup',e=>{if(!magicActive())return;consume(e);if(magicMode!=='draw'||magicPointer!==e.pointerId)return;const now=performance.now();if(now>=magicDeadline){magicCancel('Conjuration expired.');return;}magicAppend(e);magicRecognize(now);},true);
 cv.addEventListener('pointercancel',e=>{if(magicPointer===e.pointerId){consume(e);magicCancel('Drawing interrupted.');}},true);
 cv.addEventListener('lostpointercapture',e=>{if(magicPointer===e.pointerId)magicCancel('Drawing interrupted.');});
 window.addEventListener('blur',()=>magicCancel('Conjuration interrupted.'));
 window.addEventListener('resize',()=>magicCancel('Conjuration interrupted.'));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)magicCancel('Conjuration interrupted.');});
}
