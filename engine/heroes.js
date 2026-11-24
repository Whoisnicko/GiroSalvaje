/* Run-local hero identity. Warlord state is independent of army slots. */
const HERO_CLASSES=Object.freeze({
 sorcerer:Object.freeze({id:'sorcerer',name:'The Sorcerer',resource:'Mana',maxResource:100,magic:true,combatReady:true}),
 warlord:Object.freeze({id:'warlord',name:'The Warlord',resource:'Rage',maxResource:100,maxHp:300,damage:18,attackInterval:.8,range:32,moveSpeed:100,magic:false,combatReady:true,radius:17,descentDuration:.65,descentRadius:52,descentDamage:24,descentKnockback:55})
});
function heroClassId(id){return Object.hasOwn(HERO_CLASSES,id)?id:'sorcerer';}
function heroClass(state){return HERO_CLASSES[heroClassId(state?.hero?.classId)];}
function heroUsesMagic(state){return !!state&&heroClass(state).magic;}
function heroNew(id){
 const d=HERO_CLASSES[heroClassId(id)],h={version:2,classId:d.id,status:'throne'};
 if(d.id==='warlord')Object.assign(h,{hp:d.maxHp,maxHp:d.maxHp,x:0,y:0,cd:0,flash:0,lunge:0,facing:1,moving:false,down:false,descentProgress:0});
 return h;
}
function heroNormalize(state,width=420){
 const h=heroNew(state?.hero?.classId),old=state?.hero,d=HERO_CLASSES[h.classId];
 if(d.id!=='warlord'||state.phase!=='fight'||!old)return h;
 if(old.status==='fallen'){h.status='fallen';h.hp=0;h.down=true;return h;}
 if(old.status==='descending'&&Number.isFinite(old.descentProgress)){h.status='descending';h.descentProgress=Math.max(0,Math.min(.999999,old.descentProgress));return h;}
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
 const h=S.hero;h.status='descending';h.descentProgress=0;h.cd=0;h.down=false;heroClearKeys();
 sfx('heroLeap');heroRender();persist();return true;
}
function heroLandingPoint(width=worldW()){return {x:Math.min(width-HERO_CLASSES.warlord.radius,WALL_X+95),y:WORLD_H*.5};}
function heroDescentPose(progress,width=worldW()){
 const p=Math.max(0,Math.min(1,progress)),origin={x:Math.max(20,width*79/1100),y:WORLD_H*198/500},end=heroLandingPoint(width);
 const eased=p*p*(3-2*p);return {x:origin.x+(end.x-origin.x)*eased,y:origin.y+(end.y-origin.y)*eased,z:Math.sin(p*Math.PI)*72};
}
function heroLand(){
 if(S.hero.status!=='descending')return false;
 const h=S.hero,d=heroClass(S),pos=heroLandingPoint();h.status='active';h.descentProgress=1;h.x=pos.x;h.y=pos.y;h.cd=d.attackInterval*.5;
 let hits=0;for(const e of S.enemies){if(e.hp>0&&Math.hypot(e.x-h.x,e.y-h.y)<=d.descentRadius+e.r){hitEnemy(e,d.descentDamage,'steel',{kb:d.descentKnockback});hits++;}}
 S.fx.push({k:'heroLanding',x:h.x,y:h.y,r:d.descentRadius,t:.62,T:.62});burst(h.x,h.y,'gold',18,145);burst(h.x,h.y,'steel',14,110);feelImpact(h.x,h.y,'altar',null,d.descentRadius,true);sfx('heroLand');
 floatText(h.x,h.y-42,hits?'Descent · '+hits+' hit':'Descent of the Warlord','gold',12);heroRender();persist();return true;
}
function heroAdvance(dt){
 if(S?.phase==='fight'&&heroClass(S).id==='warlord'&&S.hero.status==='descending'){
  heroClearKeys();S.hero.descentProgress=Math.min(1,S.hero.descentProgress+dt/heroClass(S).descentDuration);if(S.hero.descentProgress>=1)heroLand();return;
 }
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
 document.getElementById('heroHudStatus').textContent=h.status==='fallen'?'Defeated · returns next wave':h.status==='active'?'Deployed · WASD / arrows · automatic attacks':h.status==='descending'?'Descending · impact incoming':'On the throne · deploy once per wave';
 document.getElementById('heroHpText').textContent=Math.ceil(h.hp)+' / '+d.maxHp+' HP';
 document.getElementById('heroHpFill').style.width=(100*h.hp/d.maxHp)+'%';
 button.disabled=!heroCanControl()||h.status!=='throne';button.textContent=h.status==='fallen'?'FALLEN':h.status==='active'?'DEPLOYED':h.status==='descending'?'DESCENDING':'Q · DESCENT';
}

/* Original procedural armor, cape and blade. All shapes render without remote assets. */
function heroDraw(h,t,air=0,descending=false){
 const d=HERO_CLASSES.warlord,still=feelReduced(),walk=h.moving&&!still?Math.sin(t*13):0,sw=h.lunge>0&&!still?h.lunge/.20:0,z=still?0:air;
 ctx.save();ctx.translate(Math.round(h.x),Math.round(h.y));ctx.fillStyle='#0a1017';ctx.globalAlpha=descending?.25:.55;ctx.beginPath();ctx.ellipse(0,17,Math.max(9,19-z*.11),5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 ctx.strokeStyle='#e4b675';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,14,20,7,0,0,Math.PI*2);ctx.stroke();
 ctx.translate(0,-z);ctx.save();ctx.scale(h.facing||1,1);ctx.translate(0,-Math.abs(walk)*2);
 const poly=(points,fill,stroke='#181922',width=1)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
 const rect=(x,y,w,z,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),w,z);};
 const tail=descending?-19:walk*4;
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
 if(!descending){ctx.fillStyle='#15191f';ctx.fillRect(-22,-39,44,5);ctx.fillStyle='#cf624d';ctx.fillRect(-21,-38,42*Math.max(0,h.hp/d.maxHp),3);ctx.font='700 9px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='#f3d6a2';ctx.fillText('WARLORD',0,-41);}
 ctx.restore();
}
function heroDrawDescent(t){
 if(S?.phase!=='fight'||heroClass(S).id!=='warlord'||S.hero.status!=='descending')return;
 const pose=heroDescentPose(S.hero.descentProgress),end=heroLandingPoint(),p=S.hero.descentProgress;
 ctx.save();ctx.beginPath();ctx.rect(0,0,worldW(),WORLD_H);ctx.clip();
 ctx.strokeStyle='#e4b675';ctx.globalAlpha=.55;ctx.setLineDash([4,5]);ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(end.x,end.y,HERO_CLASSES.warlord.descentRadius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 if(!feelReduced()&&prefs.effects!=='off'){for(let i=3;i>=1;i--){const q=heroDescentPose(Math.max(0,p-i*.045));ctx.globalAlpha=.12/i;ctx.strokeStyle='#e8b978';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(q.x,q.y-q.z);ctx.lineTo(pose.x,pose.y-pose.z);ctx.stroke();}ctx.globalAlpha=1;}
 heroDraw({...S.hero,x:pose.x,y:pose.y},t,pose.z,true);ctx.restore();
}
function heroDrawLanding(){
 for(const f of S.fx){if(f.k!=='heroLanding')continue;const a=Math.max(0,f.t/f.T),p=1-a,still=feelReduced(),r=still?f.r:f.r*Math.min(1,.15+p*2.8);
 ctx.save();ctx.beginPath();ctx.rect(0,0,worldW(),WORLD_H);ctx.clip();ctx.globalAlpha=a*.85;ctx.strokeStyle='#f5c88b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.stroke();
 if(prefs.effects!=='off'){ctx.globalAlpha=a*.45;ctx.fillStyle='#c5894c';ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#342a2a';ctx.lineWidth=2;for(let i=0;i<9;i++){const q=i*Math.PI*2/9,rr=r*(.6+(i%3)*.13);ctx.beginPath();ctx.moveTo(f.x+Math.cos(q)*5,f.y+Math.sin(q)*5);ctx.lineTo(f.x+Math.cos(q+.12)*rr*.5,f.y+Math.sin(q+.12)*rr*.5);ctx.lineTo(f.x+Math.cos(q)*rr,f.y+Math.sin(q)*rr);ctx.stroke();}}ctx.restore();}
}
