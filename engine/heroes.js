/* Run-local hero identity. Warlord state is independent of army slots. */
const HERO_CLASSES=Object.freeze({
 sorcerer:Object.freeze({id:'sorcerer',name:'The Sorcerer',resource:'Mana',maxResource:100,magic:true,combatReady:true}),
 warlord:Object.freeze({id:'warlord',name:'The Warlord',resource:'Rage',maxResource:100,maxHp:300,damage:18,attackInterval:.8,range:32,moveSpeed:100,magic:false,combatReady:true,radius:17,descentDuration:.65,descentRadius:52,descentDamage:24,descentKnockback:55})
});
function heroClassId(id){return Object.hasOwn(HERO_CLASSES,id)?id:'sorcerer';}
function heroClass(state){return HERO_CLASSES[heroClassId(state?.hero?.classId)];}
function heroUsesMagic(state){return !!state&&heroClass(state).magic;}
// Shared late-wave hero progression.
const CLASS_BALANCE=Object.freeze({startAfter:3,damagePerWave:.18,healthPerWave:.12,maxWave:10});
function classWave(w){return Number.isFinite(w)?Math.max(1,Math.min(CLASS_BALANCE.maxWave,Math.floor(w))):1;}
function classDamageFactor(w){return 1+Math.max(0,classWave(w)-CLASS_BALANCE.startAfter)*CLASS_BALANCE.damagePerWave;}
function classHealthFactor(w){return 1+Math.max(0,classWave(w)-CLASS_BALANCE.startAfter)*CLASS_BALANCE.healthPerWave;}
function classDamage(value,w){return Math.round(value*classDamageFactor(w));}
function heroNew(id,build=null,wave=1){
 const d=HERO_CLASSES[heroClassId(id)],h={version:4,classId:d.id,status:'throne',wave:classWave(wave),build:talentBuild(build)};if(d.id!=='warlord')h.build=talentBuild(null);
 if(d.id==='warlord')Object.assign(h,{hp:talentHeroStats(h).maxHp,maxHp:talentHeroStats(h).maxHp,x:0,y:0,cd:0,flash:0,lunge:0,facing:1,moving:false,down:false,descentProgress:0,descentTarget:null,martial:martialNew()});
 return h;
}
function heroNormalize(state,width=420){
 const h=heroNew(state?.hero?.classId,state?.hero?.build,state?.wave),old=state?.hero,d=h.classId==='warlord'?talentHeroStats(h):HERO_CLASSES[h.classId];
 if(d.id!=='warlord'||state.phase!=='fight'||!old)return h;
 if(old.status==='fallen'){h.status='fallen';h.hp=0;h.down=true;return h;}
 if(old.status==='descending'&&Number.isFinite(old.descentProgress)){h.status='descending';h.descentProgress=Math.max(0,Math.min(.999999,old.descentProgress));h.descentTarget=heroClampLanding(old.descentTarget,width)||heroDefaultLanding(width);return h;}
 if(old.status==='active'&&Number.isFinite(old.x)&&Number.isFinite(old.y)&&Number.isFinite(old.hp)){
  h.status=old.hp>0?'active':'fallen';h.down=h.status==='fallen';h.hp=Math.max(0,Math.min(d.maxHp,old.hp*(Number.isFinite(old.maxHp)&&old.maxHp>0?d.maxHp/old.maxHp:1)));
  h.x=Math.max(WALL_X+d.radius,Math.min(Math.max(420,width)-d.radius,old.x));h.y=Math.max(d.radius,Math.min(WORLD_H-d.radius,old.y));
  h.cd=Number.isFinite(old.cd)?Math.max(0,Math.min(d.attackInterval,old.cd)):0;h.facing=old.facing===-1?-1:1;h.martial=martialNormalize(old.martial,h.facing,h);if(biomeId(state)==='frozen')for(const k of ['frostUntil','frostChillUntil','frostChillStrength','iceVX','iceVY'])if(Number.isFinite(old[k]))h[k]=old[k];if(biomeId(state)==='ashen')for(const k of ['ashBurnUntil','ashBurnNext','ashBurnRate'])if(Number.isFinite(old[k]))h[k]=old[k];if(biomeId(state)==='cathedral'&&Number.isFinite(old.catSlowUntil))h.catSlowUntil=old.catSlowUntil;if(h.down){h.martial.storm=null;h.martial.charge=null;}
 }
 return h;
}
function heroResetWave(){heroCancelAim(false);heroClearKeys();martialResetWave();if(S)S.hero=heroNew(heroClass(S).id,S.hero?.build,S.wave);}
function heroActive(state=S){return !!state&&state.phase==='fight'&&heroClass(state).id==='warlord'&&state.hero.status==='active'&&state.hero.hp>0;}
function heroTargets(){return heroActive()?S.units.concat(S.hero):S.units;}
function heroRefs(state){return heroClass(state).id==='warlord'&&state.hero?[state.hero]:[];}
function heroIsTarget(u){return !!S?.hero&&u===S.hero&&heroClass(S).id==='warlord';}
const heroKeys=new Set(),heroMoveKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
function heroClearKeys(){heroKeys.clear();}
function heroCanControl(){
 return !!S&&heroClass(S).id==='warlord'&&S.phase==='fight'&&!menuOpen&&!document.hidden&&!spinning&&!S.drag&&!S.pendingMerge&&S.aim===null&&$('#ov').hidden&&$('#ov2').hidden&&!$('#unitBestiary').open&&!$('#runePractice').open;
}
// Aim is transient UI state; only the confirmed destination is serialized.
let heroAimOwner=null,heroAimPoint=null,heroSuppressContext=false;
function heroAimActive(){return !!heroAimOwner&&heroAimOwner===S&&S.phase==='fight'&&S.hero.status==='throne';}
function heroCancelAim(render=true){
 if(!heroAimOwner)return false;
 heroAimOwner=null;heroAimPoint=null;
 if(typeof cv!=='undefined')cv.style.cursor='default';
 if(render)heroRender();return true;
}
function heroAimTick(){if(heroAimOwner&&(!heroAimActive()||!heroCanControl()))heroCancelAim();}
function heroClampLanding(p,width=worldW()){
 if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;
 width=Number.isFinite(width)?Math.max(420,width):420;
 const r=HERO_CLASSES.warlord.radius;
 return {x:Math.max(WALL_X+r,Math.min(width-r,p.x)),y:typeof fieldY==='function'?fieldY(p.y,r,WORLD_H-r):Math.max(r,Math.min(WORLD_H-r,p.y))};
}
function heroDefaultLanding(width=worldW()){return heroClampLanding({x:WALL_X+95,y:WORLD_H*.5},width);}
function heroValidLanding(p,width=worldW()){return !!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=WALL_X&&p.x<=width&&p.y>=0&&p.y<WORLD_H;}
function heroDeploy(){
 if(!heroCanControl()||S.hero.status!=='throne')return false;
 if(heroAimActive()){heroCancelAim();return false;}
 heroClearKeys();heroAimOwner=S;heroAimPoint=null;
 if(typeof cv!=='undefined')cv.style.cursor='crosshair';
 heroRender();return true;
}
function heroConfirmDescent(p){
 if(!heroAimActive()||!heroCanControl()||!heroValidLanding(p))return false;
 const h=S.hero;h.descentTarget=heroClampLanding(p);heroCancelAim(false);h.status='descending';h.descentProgress=0;h.cd=0;h.down=false;heroClearKeys();
 sfx('heroLeap');heroRender();persist();return true;
}
function heroLandingPoint(width=worldW()){return heroClampLanding(S?.hero?.descentTarget,width)||heroDefaultLanding(width);}
function heroDescentPose(progress,width=worldW()){
 const p=Math.max(0,Math.min(1,progress)),origin={x:Math.max(20,width*79/1100),y:WORLD_H*198/500},end=heroLandingPoint(width);
 if(p<.34){const u=p/.34,e=u*u*(3-2*u),x=origin.x+(end.x-origin.x)*e,y=origin.y+(end.y-origin.y)*e;return {x,y,z:(y+64)*u};}
 const u=(p-.34)/.66;return {x:end.x,y:end.y,z:(end.y+64)*(1-u*u)};
}
function heroImpactTargets(p){const d=HERO_CLASSES.warlord;return S.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<=d.descentRadius+e.r);}
function heroImpactPush(e,p,kb){
 const dx=e.x-p.x,dy=e.y-p.y,len=Math.hypot(dx,dy),speed=e.boss?kb*.2:e.armor?kb*.5:kb;
 e.heroKbx=(len>1e-6?dx/len:1)*speed;e.heroKby=(len>1e-6?dy/len:0)*speed;
}
function heroAdvanceKnockback(e,dt,width){
 const vx=e.heroKbx||0,vy=e.heroKby||0;if(Math.hypot(vx,vy)<=1){delete e.heroKbx;delete e.heroKby;return;}
 const radius=e.r||8;e.x=Math.max(WALL_X+radius,Math.min(width-radius,e.x+vx*dt));e.y=Math.max(radius,Math.min(WORLD_H-radius,e.y+vy*dt));const decay=Math.pow(.002,dt);e.heroKbx=vx*decay;e.heroKby=vy*decay;
}
function heroLand(){
 if(S.hero.status!=='descending')return false;
 const h=S.hero,d=talentHeroStats(h),pos=heroLandingPoint();h.status='active';h.descentProgress=1;h.x=pos.x;h.y=pos.y;h.cd=d.attackInterval*.5;
 const targets=heroImpactTargets(h),hits=targets.length;for(const e of targets){hitEnemy(e,d.descentDamage,'steel',{kb:0,directAbility:true});heroImpactPush(e,h,d.descentKnockback);}
 S.fx.push({k:'heroLanding',x:h.x,y:h.y,r:d.descentRadius,t:.62,T:.62});burst(h.x,h.y,'gold',18,145);burst(h.x,h.y,'steel',14,110);feelImpact(h.x,h.y,'altar',null,d.descentRadius,true);S.shake=Math.max(S.shake||0,4);sfx('heroLand');
 floatText(h.x,h.y-42,hits?'Descent · '+hits+' hit':'Descent of the Warlord','gold',12);heroRender();persist();return true;
}
function heroAdvance(dt){
 if(S?.phase==='fight'&&heroClass(S).id==='warlord'&&S.hero.status==='descending'){
  heroClearKeys();S.hero.descentProgress=Math.min(1,S.hero.descentProgress+dt/heroClass(S).descentDuration);if(S.hero.descentProgress>=1)heroLand();return;
 }
 if(!heroActive()){heroClearKeys();return;}
 const h=S.hero,d=talentHeroStats(h);h.flash=Math.max(0,h.flash-dt);h.lunge=Math.max(0,h.lunge-dt);h.cd=Math.max(0,h.cd-dt*catAttackRate(h));h.moving=false;
 if(frostFrozen(h)){frostClearMotion(h);return;}
 if(!heroCanControl())heroClearKeys();
 const busy=martialAdvance(h,dt);if(busy==='charge'){frostClearMotion(h);return;}
 const {dx,dy,len}=martialMovement();
 if(len){h.martial.direction=martialDirection(dx,dy,h.facing);const factor=biomeWalkFactor(h),v=frostWalkVector(h,dx/len*d.moveSpeed*dt*factor,dy/len*d.moveSpeed*dt*factor,dt);martialMove(h,v.dx,v.dy);}else if(biomeId(S)==='frozen'&&Number.isFinite(h.iceVX)){const v=frostWalkVector(h,0,0,dt);martialMove(h,v.dx,v.dy);}
 if(busy==='storm')return;
 let target=null,best=Infinity;
 for(const e of S.enemies){if(e.hp<=0)continue;const gap=Math.hypot(e.x-h.x,e.y-h.y)-e.r-d.radius;if(gap<=d.range&&gap<best){best=gap;target=e;}}
 if(target&&h.cd<=0){h.cd=d.attackInterval;h.lunge=.20;h.facing=target.x<h.x?-1:1;h.martial.direction=martialDirection(target.x-h.x,target.y-h.y,h.facing);hitEnemy(target,d.damage,'steel',{kb:0});martialGain(MARTIAL_RULES.basicRage+(talentHas(h,'berserker',2)?2:0));S.fx.push({k:'sword',x:(h.x+target.x)/2,y:(h.y+target.y)/2,angle:Math.atan2(target.y-h.y,target.x-h.x),t:.24,T:.24});sfx('clash');}
}
function heroDamageTarget(u,amount){
 if(!heroIsTarget(u))return spellDamageAlly(u,amount*synergyFactor(u,'damageTaken'));
 if(!heroActive()||!Number.isFinite(amount)||amount<=0||sandboxGod()||martialInvulnerable())return 0;
 const dealt=Math.min(u.hp,amount*(martialSkinActive(u)?1-JUGGERNAUT_RULES.skin.reduction:1));martialGain(dealt*MARTIAL_RULES.damageRage);u.hp-=dealt;
 if(u.hp<=0){u.hp=0;u.status='fallen';u.down=true;u.martial.storm=null;u.martial.charge=null;u.martial.skinLeft=0;heroClearKeys();burst(u.x,u.y,'gold',18,110);S.fx.push({k:'ring',x:u.x,y:u.y,r:35,c:'red',t:.6,T:.6});floatText(u.x,u.y-22,'Warlord fallen','red',12);sfx('death');heroRender();persist();}
 if(u.hp>0&&dealt>0)martialRetaliate(u);
 return dealt;
}
function heroHeal(){if(heroActive())S.hero.hp=S.hero.maxHp;}
function initHeroControls(){
 document.getElementById('heroDeploy').addEventListener('click',()=>heroDeploy());martialInit();
 document.addEventListener('keydown',e=>{
  if(heroAimActive()&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();heroCancelAim();return;}
  if(!heroCanControl()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,select,textarea,[contenteditable]'))return;
  if(e.code==='KeyQ'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)heroDeploy();return;}
  if(heroActive()){const id=Object.keys(MARTIAL_SKILLS).find(id=>MARTIAL_SKILLS[id].code===e.code);if(id){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)martialCast(id);return;}}
  if(heroActive()&&heroMoveKeys.has(e.code)){e.preventDefault();e.stopImmediatePropagation();heroKeys.add(e.code);}
 },true);
 document.addEventListener('keyup',e=>heroKeys.delete(e.code),true);
 const point=e=>{const p=toWorld(e),cam=feelCamera();return {x:p.x-cam.x,y:p.y-cam.y};};
 cv.addEventListener('pointermove',e=>{if(!heroAimActive())return;e.stopImmediatePropagation();const p=point(e);heroAimPoint=heroValidLanding(p)?heroClampLanding(p):null;cv.style.cursor=heroAimPoint?'crosshair':'not-allowed';},true);
 cv.addEventListener('pointerdown',e=>{
  if(!heroAimActive())return;e.preventDefault();e.stopImmediatePropagation();
  if(e.button===2){heroSuppressContext=true;heroCancelAim();return;}
  if(e.button!==0&&e.pointerType==='mouse')return;
  audioInit();heroConfirmDescent(point(e));
 },true);
 cv.addEventListener('contextmenu',e=>{if(heroSuppressContext||heroAimActive()){e.preventDefault();heroSuppressContext=false;heroCancelAim();}});
 cv.addEventListener('pointerleave',()=>{heroAimPoint=null;});
 cv.addEventListener('pointercancel',()=>heroCancelAim());
 document.addEventListener('pointerdown',e=>{if(e.button!==2)heroSuppressContext=false;if(heroAimActive()&&e.target!==cv&&!e.target.closest?.('#heroDeploy'))heroCancelAim();},true);
 window.addEventListener('blur',()=>{heroClearKeys();heroCancelAim();});document.addEventListener('visibilitychange',()=>{heroClearKeys();heroCancelAim();});
 window.addEventListener('resize',()=>heroCancelAim());
 document.addEventListener('focusin',e=>{if(e.target.closest?.('input,select,textarea,[contenteditable],dialog')){heroClearKeys();heroCancelAim();}});
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
 if(id==='warlord'){talentOpen(heroChoiceMode==='sandbox'?'sandbox':'campaign');return true;}
 talentPending=talentBuild(null);
 if(heroChoiceMode==='sandbox'){sandboxEnter(id,null,sandboxTakeSetup());return true;}
 if(validSave(loadedSave)){document.getElementById('confirmHeroName').textContent=HERO_CLASSES[id].name;front('confirmView');return true;}
 launchNew(id);return true;
}
function heroRender(){
 const panel=document.getElementById('heroHud');if(!panel)return;
 const active=!!S&&['prep','fight'].includes(S.phase)&&!heroUsesMagic(S);panel.hidden=!active;if(!active)return;
 document.getElementById('heroHudName').textContent=heroClass(S).name+(S.hero.build?.rank?' · '+TALENT_BRANCHES[S.hero.build.branch].name+' '+S.hero.build.rank:'');document.getElementById('heroPower').textContent='Wave '+S.hero.wave+' · '+talentHeroStats(S.hero).damage+' basic damage · '+talentHeroStats(S.hero).descentDamage+' Descent damage';
 const h=S.hero,d=talentHeroStats(h),button=document.getElementById('heroDeploy');
 document.getElementById('heroHudStatus').textContent=h.status==='fallen'?'Defeated · returns next wave':h.status==='active'?'Deployed · WASD / arrows · automatic attacks':h.status==='descending'?'Descending · impact incoming':heroAimActive()?'Click battlefield · Esc / right click to cancel':'On the throne · choose landing with Q';
 document.getElementById('heroHpText').textContent=Math.ceil(h.hp)+' / '+d.maxHp+' HP';
 document.getElementById('heroHpFill').style.width=(100*h.hp/d.maxHp)+'%';
 button.disabled=!heroCanControl()||h.status!=='throne';const label=h.status==='fallen'?'Warrior Fallen':h.status==='active'?'Warrior Summoned':h.status==='descending'?'Summoning Warrior…':heroAimActive()?'Cancel Summon':'Summon Warrior';const action='<span>'+label+'</span>'+(h.status==='throne'?'<kbd>Q</kbd>':'');if(button.innerHTML!==action)button.innerHTML=action;martialRender(h);
}

/* Original procedural armor, cape and blade. All shapes render without remote assets. */
function heroDraw(h,t,air=0,descending=false,drawContext=ctx,preview=false){
 const ctx=drawContext,d=preview?{maxHp:300}:talentHeroStats(h),p=preview?{still:true,walk:0,swing:0,lean:0,forward:0,cape:0,branch:null}:championHeroPose(h,t,descending),still=p.still,walk=p.walk,sw=p.swing,z=still?0:air;
 ctx.save();ctx.translate(Math.round(h.x),Math.round(h.y));ctx.fillStyle='#0a1017';ctx.globalAlpha=descending?.25:.55;ctx.beginPath();ctx.ellipse(0,17,Math.max(9,19-z*.11),5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 ctx.strokeStyle=p.branch||'#e4b675';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,14,20,7,0,0,Math.PI*2);ctx.stroke();
 ctx.translate(0,-z);ctx.save();ctx.scale(h.facing||1,1);ctx.translate(p.forward,-Math.abs(walk)*2);ctx.rotate(p.lean);
 const poly=(points,fill,stroke='#181922',width=1)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
 const rect=(x,y,w,z,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),w,z);};
 const tail=p.cape;
 // Tattered burgundy cape, layered steel pauldrons, gilded edges and glowing visor.
 poly([[-13,-13],[10,-13],[18,20+tail],[8,17+tail],[2,23+tail],[-8,19+tail],[-22,23+tail]],'#54232f');
 poly([[-9,-12],[-15,19+tail],[-6,16+tail],[-2,-9]],'#8c3a43',null);
 for(const side of [-1,1]){const x=side*6,y=side*walk*3;poly([[x-5,9],[x+5,9],[x+5,20+y],[x+8,24+y],[x-5,24+y]],'#333845');rect(x-3,11,5,6,'#747781');rect(x-4,22+y,10,2,'#a18b67');}
 poly([[-14,-10],[-10,-15],[10,-15],[14,-10],[10,9],[7,14],[-7,14],[-10,9]],h.flash>0?'#c0a5a0':'#555c69','#a68b61',1.3);
 poly([[-10,-10],[0,-5],[10,-10],[7,5],[0,10],[-7,5]],'#272e3b','#89919a');
 poly([[-6,-8],[0,-4],[6,-8],[3,1],[0,4],[-3,1]],'#777e87',null);
 rect(-8,7,16,4,'#3a2e28');rect(-3,7,6,4,'#cba269');rect(-1,8,2,2,'#271c22');
 for(const side of [-1,1]){ctx.save();ctx.scale(side,1);poly([[9,-14],[17,-15],[22,-7],[18,-3],[10,-4]],'#545c69','#b49a70');poly([[11,-13],[17,-13],[19,-8],[12,-8]],'#89919d',null);rect(13,-3,6,10,'#363d4a');rect(13,4,7,5,'#a48d65');ctx.restore();}
 poly([[-11,-20],[-8,-26],[0,-29],[8,-26],[11,-20],[9,-10],[0,-7],[-9,-10]],'#353c49','#b59c75');
 poly([[-8,-23],[0,-26],[8,-23],[6,-18],[-6,-18]],'#747e8b',null);poly([[-8,-17],[-1,-15],[0,-11],[1,-15],[8,-17],[6,-11],[0,-8],[-6,-11]],'#141b25',null);
 rect(-6,-17,4,2,'#ff7a58');rect(2,-17,4,2,'#ff7a58');rect(-1,-25,2,7,'#c6a46f');
 poly([[-8,-25],[-13,-31],[-14,-19],[-10,-18]],'#897d6a');poly([[8,-25],[13,-31],[14,-19],[10,-18]],'#897d6a');
 ctx.save();ctx.translate(16,3);ctx.rotate(descending?.28:-.65+sw*2.1);
 poly([[-4,-32],[0,-39],[4,-32],[5,3],[-5,3]],'#a6b1bd','#161e28');poly([[0,-37],[3,-31],[3,1],[0,1]],'#f1e7cc',null);poly([[-8,2],[-5,0],[5,0],[8,2],[7,6],[-7,6]],'#c7a269');rect(-2,6,4,10,'#4e3330');rect(-4,15,8,3,'#b39465');ctx.restore();ctx.restore();
 if(!descending&&!preview){ctx.fillStyle='#15191f';ctx.fillRect(-22,-39,44,5);ctx.fillStyle='#cf624d';ctx.fillRect(-21,-38,42*Math.max(0,h.hp/d.maxHp),3);ctx.font='700 9px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='#f3d6a2';ctx.fillText('WARLORD',0,-41);}
 ctx.restore();
}
function heroDrawAim(){
 if(!heroAimActive()||!heroAimPoint)return;
 const p=heroAimPoint,r=HERO_CLASSES.warlord.descentRadius,targets=heroImpactTargets(p);
 ctx.save();ctx.beginPath();ctx.rect(WALL_X,0,worldW()-WALL_X,WORLD_H);ctx.clip();
 ctx.fillStyle='rgba(239,154,76,.14)';ctx.strokeStyle='#ffc77e';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(p.x,p.y,r-5,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.moveTo(p.x-8,p.y);ctx.lineTo(p.x+8,p.y);ctx.moveTo(p.x,p.y-8);ctx.lineTo(p.x,p.y+8);ctx.stroke();
 for(const e of targets){ctx.strokeStyle='#ffae78';ctx.beginPath();ctx.arc(e.x,e.y,e.r+3,0,Math.PI*2);ctx.stroke();}
 const y=p.y>60?p.y-r-9:p.y+r+16;ctx.font='700 11px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';const label=targets.length+' in range';ctx.lineWidth=3;ctx.strokeStyle='#1b1820';ctx.strokeText(label,p.x,Math.max(12,Math.min(WORLD_H-10,y)));ctx.fillStyle='#ffe3b2';ctx.fillText(label,p.x,Math.max(12,Math.min(WORLD_H-10,y)));ctx.restore();
}
function heroDrawDescent(t){
 if(S?.phase!=='fight'||heroClass(S).id!=='warlord'||S.hero.status!=='descending')return;
 const p=S.hero.descentProgress,pose=heroDescentPose(p),end=heroLandingPoint(),still=feelReduced();
 ctx.save();ctx.beginPath();ctx.rect(0,0,worldW(),WORLD_H);ctx.clip();
 ctx.strokeStyle='#f5c88b';ctx.globalAlpha=.65;ctx.setLineDash([4,5]);ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(end.x,end.y,HERO_CLASSES.warlord.descentRadius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 if(!still&&prefs.effects!=='off'){
  const sy=pose.y-pose.z,soft=prefs.effects==='soft'?.5:1;
  if(p>=.34){
   const grd=ctx.createLinearGradient(0,Math.min(-40,sy-80),0,sy+25);grd.addColorStop(0,'rgba(255,103,43,0)');grd.addColorStop(.65,'rgba(255,126,47,.48)');grd.addColorStop(1,'rgba(255,226,155,.72)');
   ctx.globalAlpha=soft;ctx.fillStyle=grd;ctx.beginPath();ctx.moveTo(end.x-30,-40);ctx.lineTo(end.x+30,-40);ctx.lineTo(end.x+14,sy+25);ctx.lineTo(end.x-14,sy+25);ctx.closePath();ctx.fill();
   for(let j=0;j<3;j++){ctx.strokeStyle=j===0?'#fff1c8':j===1?'#ffb85b':'#e45b36';ctx.lineWidth=j===0?2:3;ctx.beginPath();for(let i=0;i<=8;i++){const f=i/8,y=sy-105+f*115,x=end.x+Math.sin(i*2.6+j*1.9+t*24)*(15*(1-f)+3);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  }else{ctx.globalAlpha=.55*soft;ctx.strokeStyle='#f0b678';ctx.lineWidth=5;const q=heroDescentPose(Math.max(0,p-.07));ctx.beginPath();ctx.moveTo(q.x,q.y-q.z);ctx.lineTo(pose.x,sy);ctx.stroke();}
  ctx.globalAlpha=1;
 }
 heroDraw({...S.hero,x:still?end.x:pose.x,y:still?end.y:pose.y},t,still?0:pose.z,true);ctx.restore();
}
function heroDrawLanding(){
 for(const f of S.fx){if(f.k!=='heroLanding')continue;const a=Math.max(0,f.t/f.T),p=1-a,still=feelReduced(),r=still?f.r:f.r*Math.min(1,.15+p*2.8);
 ctx.save();ctx.beginPath();ctx.rect(0,0,worldW(),WORLD_H);ctx.clip();ctx.globalAlpha=a*.85;ctx.strokeStyle='#f5c88b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.stroke();
 if(prefs.effects!=='off'){ctx.globalAlpha=a*.45;ctx.fillStyle='#c5894c';ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#342a2a';ctx.lineWidth=2;for(let i=0;i<9;i++){const q=i*Math.PI*2/9,rr=r*(.6+(i%3)*.13);ctx.beginPath();ctx.moveTo(f.x+Math.cos(q)*5,f.y+Math.sin(q)*5);ctx.lineTo(f.x+Math.cos(q+.12)*rr*.5,f.y+Math.sin(q+.12)*rr*.5);ctx.lineTo(f.x+Math.cos(q)*rr,f.y+Math.sin(q)*rr);ctx.stroke();}}ctx.restore();}
}
