/* Run-local hero identity. Warlord state is independent of army slots. */
const HERO_CLASSES=Object.freeze({
 sorcerer:Object.freeze({id:'sorcerer',name:'The Sorcerer',resource:'Mana',maxResource:100,magic:true,combatReady:true}),
 warlord:Object.freeze({id:'warlord',name:'The Warlord',resource:'Rage',maxResource:100,maxHp:300,damage:18,attackInterval:.8,range:32,moveSpeed:100,magic:false,combatReady:true,radius:17})
});
function heroClassId(id){return Object.hasOwn(HERO_CLASSES,id)?id:'sorcerer';}
function heroClass(state){return HERO_CLASSES[heroClassId(state?.hero?.classId)];}
function heroUsesMagic(state){return !!state&&heroClass(state).magic;}
function heroNew(id){
 const d=HERO_CLASSES[heroClassId(id)],h={version:2,classId:d.id,status:'throne'};
 if(d.id==='warlord')Object.assign(h,{hp:d.maxHp,maxHp:d.maxHp,x:0,y:0,cd:0,flash:0,lunge:0,facing:1,moving:false,down:false});
 return h;
}
function heroNormalize(state,width=420){
 const h=heroNew(state?.hero?.classId),old=state?.hero,d=HERO_CLASSES[h.classId];
 if(d.id!=='warlord'||state.phase!=='fight'||!old)return h;
 if(old.status==='fallen'){h.status='fallen';h.hp=0;h.down=true;return h;}
 if(old.status==='active'&&Number.isFinite(old.x)&&Number.isFinite(old.y)&&Number.isFinite(old.hp)){
  h.status=old.hp>0?'active':'fallen';h.down=h.status==='fallen';h.hp=Math.max(0,Math.min(d.maxHp,old.hp));
  h.x=Math.max(WALL_X+d.radius,Math.min(Math.max(420,width)-d.radius,old.x));h.y=Math.max(d.radius,Math.min(WORLD_H-d.radius,old.y));
  h.cd=Number.isFinite(old.cd)?Math.max(0,Math.min(d.attackInterval,old.cd)):0;h.facing=old.facing===-1?-1:1;
 }
 return h;
}
function heroResetWave(){heroClearKeys();if(S)S.hero=heroNew(heroClass(S).id);}
function heroActive(state=S){return !!state&&state.phase==='fight'&&heroClass(state).id==='warlord'&&state.hero.status==='active'&&state.hero.hp>0;}
function heroTargets(){return heroActive()?S.units.concat(S.hero):S.units;}
function heroRefs(state){return heroClass(state).id==='warlord'&&state.hero?[state.hero]:[];}
function heroIsTarget(u){return !!S?.hero&&u===S.hero&&heroClass(S).id==='warlord';}
const heroKeys=new Set(),heroMoveKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
function heroClearKeys(){heroKeys.clear();}
function heroCanControl(){
 return !!S&&heroClass(S).id==='warlord'&&S.phase==='fight'&&!menuOpen&&!document.hidden&&!spinning&&!S.drag&&!S.pendingMerge&&S.aim===null&&$('#ov').hidden&&$('#ov2').hidden&&!$('#unitBestiary').open&&!$('#runePractice').open;
}
function heroDeploy(){
 if(!heroCanControl()||S.hero.status!=='throne')return false;
 const h=S.hero,d=heroClass(S);h.status='active';h.x=Math.min(worldW()-d.radius,WALL_X+55);h.y=WORLD_H*.5;h.cd=0;h.down=false;
 burst(h.x,h.y,'gold',12,85);S.fx.push({k:'ring',x:h.x,y:h.y,r:28,c:'gold',t:.45,T:.45});sfx('horn');heroRender();persist();return true;
}
function heroAdvance(dt){
 if(!heroActive()){heroClearKeys();return;}
 const h=S.hero,d=heroClass(S);h.flash=Math.max(0,h.flash-dt);h.lunge=Math.max(0,h.lunge-dt);h.cd=Math.max(0,h.cd-dt);h.moving=false;
 if(!heroCanControl())heroClearKeys();
 const dx=Number(heroKeys.has('KeyD')||heroKeys.has('ArrowRight'))-Number(heroKeys.has('KeyA')||heroKeys.has('ArrowLeft')),dy=Number(heroKeys.has('KeyS')||heroKeys.has('ArrowDown'))-Number(heroKeys.has('KeyW')||heroKeys.has('ArrowUp')),len=Math.hypot(dx,dy);
 if(len){const x=Math.max(WALL_X+d.radius,Math.min(worldW()-d.radius,h.x+dx/len*d.moveSpeed*dt)),y=Math.max(d.radius,Math.min(WORLD_H-d.radius,h.y+dy/len*d.moveSpeed*dt));h.moving=Math.hypot(x-h.x,y-h.y)>.001;h.x=x;h.y=y;if(dx)h.facing=Math.sign(dx);}
 let target=null,best=Infinity;
 for(const e of S.enemies){if(e.hp<=0)continue;const gap=Math.hypot(e.x-h.x,e.y-h.y)-e.r-d.radius;if(gap<=d.range&&gap<best){best=gap;target=e;}}
 if(target&&h.cd<=0){h.cd=d.attackInterval;h.lunge=.20;h.facing=target.x<h.x?-1:1;hitEnemy(target,d.damage,'steel',{kb:0});S.fx.push({k:'sword',x:(h.x+target.x)/2,y:(h.y+target.y)/2,angle:Math.atan2(target.y-h.y,target.x-h.x),t:.24,T:.24});sfx('clash');}
}
function heroDamageTarget(u,amount){
 if(!heroIsTarget(u))return spellDamageAlly(u,amount);
 if(!heroActive()||!Number.isFinite(amount)||amount<=0||sandboxGod())return 0;
 const dealt=Math.min(u.hp,amount);u.hp-=dealt;
 if(u.hp<=0){u.hp=0;u.status='fallen';u.down=true;heroClearKeys();burst(u.x,u.y,'gold',18,110);S.fx.push({k:'ring',x:u.x,y:u.y,r:35,c:'red',t:.6,T:.6});floatText(u.x,u.y-22,'Warlord fallen','red',12);sfx('death');heroRender();persist();}
 return dealt;
}
function heroHeal(){if(heroActive())S.hero.hp=heroClass(S).maxHp;}
function initHeroControls(){
 document.getElementById('heroDeploy').addEventListener('click',()=>heroDeploy());
 document.addEventListener('keydown',e=>{
  if(!heroCanControl()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,select,textarea,[contenteditable]'))return;
  if(e.code==='KeyQ'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)heroDeploy();return;}
  if(heroActive()&&heroMoveKeys.has(e.code)){e.preventDefault();e.stopImmediatePropagation();heroKeys.add(e.code);}
 },true);
 document.addEventListener('keyup',e=>heroKeys.delete(e.code),true);
 window.addEventListener('blur',heroClearKeys);document.addEventListener('visibilitychange',heroClearKeys);
 document.addEventListener('focusin',e=>{if(e.target.closest?.('input,select,textarea,[contenteditable],dialog'))heroClearKeys();});
}

let heroChoiceMode='campaign',heroPending='sorcerer';
function heroChoose(mode='campaign'){
 if(!menuOpen||spinning||S?.sandbox)return;
 heroChoiceMode=mode==='sandbox'?'sandbox':'campaign';heroPending='sorcerer';
 document.getElementById('heroMode').textContent=heroChoiceMode==='sandbox'?'SANDBOX · SELECT TEST CLASS':'NEW CAMPAIGN · CHOOSE YOUR HERO';
 document.getElementById('heroSelectIntro').textContent=heroChoiceMode==='sandbox'?'Test either class without changing your campaign.':'Your choice is fixed for this run. Your permanent knowledge stays safe.';
 front('heroSelectView');
}
function heroSelect(id){
 if(!menuOpen||document.getElementById('heroSelectView').hidden||!Object.hasOwn(HERO_CLASSES,id))return false;
 heroPending=id;
 if(heroChoiceMode==='sandbox'){sandboxEnter(id);return true;}
 if(validSave(loadedSave)){document.getElementById('confirmHeroName').textContent=HERO_CLASSES[id].name;front('confirmView');return true;}
 launchNew(id);return true;
}
function heroRender(){
 const panel=document.getElementById('heroHud');if(!panel)return;
 const active=!!S&&['prep','fight'].includes(S.phase)&&!heroUsesMagic(S);panel.hidden=!active;if(!active)return;
 document.getElementById('heroHudName').textContent=heroClass(S).name;
 const h=S.hero,d=heroClass(S),button=document.getElementById('heroDeploy');
 document.getElementById('heroHudStatus').textContent=h.status==='fallen'?'Defeated · returns next wave':h.status==='active'?'Deployed · WASD / arrows · automatic attacks':'On the throne · deploy once per wave';
 document.getElementById('heroHpText').textContent=Math.ceil(h.hp)+' / '+d.maxHp+' HP';
 document.getElementById('heroHpFill').style.width=(100*h.hp/d.maxHp)+'%';
 button.disabled=!heroCanControl()||h.status!=='throne';button.textContent=h.status==='fallen'?'FALLEN':h.status==='active'?'DEPLOYED':'Q · DEPLOY';
}

/* Temporary original pixel-style silhouette; final sprite and cinematic descent follow. */
function heroDraw(h,t){
 const d=HERO_CLASSES.warlord,walk=h.moving&&!feelReduced()?Math.sin(t*13):0,sw=h.lunge>0&&!feelReduced()?h.lunge/.20:0;
 ctx.save();ctx.translate(Math.round(h.x),Math.round(h.y));ctx.fillStyle='#10151c99';ctx.beginPath();ctx.ellipse(0,16,19,5,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#e4b675';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,14,20,7,0,0,Math.PI*2);ctx.stroke();
 ctx.save();ctx.scale(h.facing||1,1);ctx.translate(0,-Math.abs(walk)*2);const rect=(x,y,w,z,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),w,z);};
 rect(-13,-7,26,22,'#29191e');rect(-17,-10,34,8,'#24252c');rect(-14,-12,28,7,'#a08b72');rect(-9,-10,18,21,h.flash>0?'#e9c1b0':'#545564');rect(-6,-7,12,14,'#343641');rect(-2,-5,4,10,'#ba935d');
 rect(-10,-23,20,14,'#171b23');rect(-7,-25,14,4,'#676774');rect(-8,-22,16,8,'#747782');rect(-7,-16,14,6,'#292c37');rect(-5,-17,4,2,'#ff785b');rect(2,-17,4,2,'#ff785b');rect(-11,-22,3,8,'#b5a28a');rect(8,-22,3,8,'#b5a28a');
 rect(-9,10+walk*3,7,11,'#343641');rect(2,10-walk*3,7,11,'#343641');rect(-11,19+walk*3,10,4,'#151820');rect(1,19-walk*3,10,4,'#151820');
 ctx.save();ctx.translate(13,2);ctx.rotate(-.55+sw*1.9);rect(-3,-24,6,28,'#d6d2c4');rect(-1,-24,2,24,'#fff0c8');rect(-6,3,12,3,'#b28a50');rect(-2,6,4,7,'#57412e');ctx.restore();ctx.restore();
 ctx.fillStyle='#15191f';ctx.fillRect(-22,-36,44,5);ctx.fillStyle='#cf624d';ctx.fillRect(-21,-35,42*Math.max(0,h.hp/d.maxHp),3);ctx.font='700 9px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='#f3d6a2';ctx.fillText('WARLORD',0,-38);ctx.restore();
}
