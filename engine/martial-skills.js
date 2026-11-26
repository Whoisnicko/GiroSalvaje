/* Warlord martial kit: independent of spell mastery and army slots. Simulation seconds. */
const MARTIAL_RULES=Object.freeze({startRage:20,maxRage:100,basicRage:6,damageRage:.25});
const JUGGERNAUT_RULES=Object.freeze({
 taunt:Object.freeze({name:"Death's Challenge",cost:15,cd:12,radius:130,duration:4,bossDuration:2}),
 retaliation:Object.freeze({chance:15,increment:5,maxChance:65,damage:24,radius:55,cd:.65}),
 skin:Object.freeze({name:'Iron Skin',key:'G',code:'KeyG',cost:20,cd:18,duration:5,reduction:.60})
});
const MARTIAL_SKILLS=Object.freeze({
 cleave:Object.freeze({name:"Executioner's Cleave",key:'E',code:'KeyE',cost:20,cd:5,radius:64,arc:Math.PI*2/3,damage:36}),
 storm:Object.freeze({name:'Bloodstorm',key:'R',code:'KeyR',cost:40,cd:12,radius:55,duration:2,interval:.5,damage:10,pulses:4}),
 charge:Object.freeze({name:'Shadow Charge',key:'Space',code:'Space',cost:10,cd:5,distance:100,duration:.22}),
 cry:Object.freeze({name:'War Cry',key:'F',code:'KeyF',cost:30,cd:15,radius:100,duration:6,damageBonus:.25,speedBonus:.20}),
 skin:JUGGERNAUT_RULES.skin
});
const martialClamp=(v,min,max)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):min;
function martialDirection(x,y,facing=1){const n=Math.hypot(x,y);return Number.isFinite(n)&&n>.0001?{x:x/n,y:y/n}:{x:facing===-1?-1:1,y:0};}
function martialNew(){return {rage:MARTIAL_RULES.startRage,cooldowns:{cleave:0,storm:0,charge:0,cry:0,skin:0},direction:{x:1,y:0},storm:null,charge:null,retaliationChance:15,retaliationCd:0,skinLeft:0,counterFlash:0};}
function martialNormalize(raw,facing=1,h=null){
 const m=martialNew();if(!raw||typeof raw!=='object')return m;
 m.rage=Number.isFinite(raw.rage)?martialClamp(raw.rage,0,MARTIAL_RULES.maxRage):MARTIAL_RULES.startRage;
 for(const id of Object.keys(MARTIAL_SKILLS))m.cooldowns[id]=martialClamp(raw.cooldowns?.[id],0,talentSkill(id,h).cd);
 m.direction=martialDirection(raw.direction?.x,raw.direction?.y,facing);
 if(talentHas(h,'juggernaut',2)){const d=JUGGERNAUT_RULES.retaliation;m.retaliationChance=Number.isFinite(raw.retaliationChance)?martialClamp(raw.retaliationChance,d.chance,d.maxChance):d.chance;m.retaliationCd=martialClamp(raw.retaliationCd,0,d.cd);}
 if(talentHas(h,'juggernaut',3))m.skinLeft=martialClamp(raw.skinLeft,0,JUGGERNAUT_RULES.skin.duration);
 const storm=raw.storm,charge=raw.charge;
 if(storm&&Number.isFinite(storm.left)&&storm.left>0&&Number.isFinite(storm.pulses)){
  const left=martialClamp(storm.left,0,MARTIAL_SKILLS.storm.duration),pulses=Math.floor(martialClamp(storm.pulses,1,MARTIAL_SKILLS.storm.pulses));
  m.storm={left,pulses:Math.max(pulses,Math.min(4,1+Math.floor((2-left)/.5)))};
 }
 if(!m.storm&&charge&&Number.isFinite(charge.left)&&charge.left>0&&Number.isFinite(charge.dx)&&Number.isFinite(charge.dy)){
  const dir=martialDirection(charge.dx,charge.dy,facing);m.charge={left:martialClamp(charge.left,0,talentSkill('charge',h).duration),dx:dir.x,dy:dir.y};
 }
 return m;
}
function martialLab(){return S?.sandbox&&heroClass(S).id==='warlord'?(S.martialLab ||= {infinite:false,noCooldown:false}):null;}
function martialGain(amount){if(!heroActive()||!Number.isFinite(amount)||amount<=0)return;const m=S.hero.martial;m.rage=Math.min(MARTIAL_RULES.maxRage,m.rage+amount);}
function martialMovement(){
 const dx=Number(heroKeys.has('KeyD')||heroKeys.has('ArrowRight'))-Number(heroKeys.has('KeyA')||heroKeys.has('ArrowLeft')),dy=Number(heroKeys.has('KeyS')||heroKeys.has('ArrowDown'))-Number(heroKeys.has('KeyW')||heroKeys.has('ArrowUp'));
 return {dx,dy,len:Math.hypot(dx,dy)};
}
function martialMove(h,dx,dy){const p=heroClampLanding({x:h.x+dx,y:h.y+dy});if(!p)return false;const moved=Math.hypot(p.x-h.x,p.y-h.y)>.001;h.x=p.x;h.y=p.y;h.moving=moved;if(dx)h.facing=Math.sign(dx);return moved;}
function martialNearby(h,r){return S.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-h.x,e.y-h.y)<=r+(e.r||0));}
function martialCleaveTargets(h,dir){const d=talentSkill('cleave',h);return martialNearby(h,d.radius).filter(e=>{const x=e.x-h.x,y=e.y-h.y,n=Math.hypot(x,y);return n<.001||(x*dir.x+y*dir.y)/n>=Math.cos(d.arc/2);});}
function martialGuardBuff(u){return !!S&&heroClass(S).id==='warlord'&&!talentHas(S.hero,'juggernaut',1)&&S.phase==='fight'&&!u.down&&u.hp>0&&Number.isFinite(u.warCryUntil)&&u.warCryUntil>S.fightT;}
function martialResetWave(){if(S){for(const u of [...(S.units||[]),...(S.bench||[]).filter(Boolean)])delete u.warCryUntil;for(const e of S.enemies||[])delete e.heroTauntUntil;}}
function martialInvulnerable(){return heroActive()&&!!S.hero.martial.charge;}
function martialSkinActive(h=S?.hero){return talentHas(h,'juggernaut',3)&&(h.martial?.skinLeft||0)>0;}
function martialTaunted(e){return heroActive()&&talentHas(S.hero,'juggernaut',1)&&e.hp>0&&Number.isFinite(e.heroTauntUntil)&&e.heroTauntUntil>S.fightT;}
function martialRetaliate(h,random=Math.random){
 if(!heroActive()||!talentHas(h,'juggernaut',2)||h.hp<=0)return false;
 const d=JUGGERNAUT_RULES.retaliation,m=h.martial;
 if(m.retaliationCd>1e-7)return false;
 if(random()*100>=m.retaliationChance){m.retaliationChance=Math.min(d.maxChance,m.retaliationChance+d.increment);return false;}
 m.retaliationChance=d.chance;m.retaliationCd=d.cd;m.counterFlash=.32;h.lunge=.20;
 for(const e of martialNearby(h,d.radius))hitEnemy(e,classDamage(d.damage,h.wave),'steel',{kb:0});
 martialEvent('counter',h.x,h.y,{r:d.radius,t:.40,T:.40});floatText(h.x,h.y-44,'Retaliation!','gold',11);sfx('heroCounter');return true;
}
function martialAvailability(id){
 if(S?.hero&&frostFrozen(S.hero))return 'Frozen';
 if(!Object.hasOwn(MARTIAL_SKILLS,id)||!heroActive()||!heroCanControl()||id==='skin'&&!talentHas(S.hero,'juggernaut',3))return 'Unavailable';
 const d=talentSkill(id,S.hero);
 const m=S.hero.martial,lab=martialLab();
 if(m.charge||m.storm&&id!=='skin'&&!(id==='cry'&&talentHas(S.hero,'juggernaut',1)))return 'Busy';
 if(id==='skin'&&martialSkinActive())return 'Active';
 if(!lab?.noCooldown&&m.cooldowns[id]>.001)return m.cooldowns[id].toFixed(1)+'s';
 if(!lab?.infinite&&m.rage+1e-7<d.cost)return 'Need Rage';
 return 'Ready';
}
function martialEvent(kind,x,y,extra={}){S.fx.push({k:'martial',kind,x,y,t:.48,T:.48,...extra});}
function martialStormPulse(h){
 const d=talentSkill('storm',h);
 for(const e of martialNearby(h,d.radius))hitEnemy(e,d.damage,'steel',{kb:0});
 martialEvent('storm',h.x,h.y,{r:d.radius,t:.42,T:.42});sfx('heroStorm');
}
function martialCast(id){
 if(martialAvailability(id)!=='Ready')return false;
 const h=S.hero,m=h.martial,d=talentSkill(id,h),lab=martialLab(),input=martialMovement(),dir=input.len?martialDirection(input.dx,input.dy,h.facing):m.direction;
 if(id==='charge'){const end=heroClampLanding({x:h.x+dir.x*d.distance,y:h.y+dir.y*d.distance});if(!end||Math.hypot(end.x-h.x,end.y-h.y)<1)return false;}
 if(!lab?.infinite)m.rage=Math.max(0,m.rage-d.cost);m.cooldowns[id]=lab?.noCooldown?0:d.cd;
 if(id==='cleave'){
  m.direction=dir;if(Math.abs(dir.x)>.01)h.facing=Math.sign(dir.x);h.lunge=.20;
  for(const e of martialCleaveTargets(h,dir)){hitEnemy(e,d.damage,'steel',{kb:0});heroImpactPush(e,h,35);}
  martialEvent('cleave',h.x,h.y,{r:d.radius,angle:Math.atan2(dir.y,dir.x),arc:d.arc});sfx('heroCleave');
 }else if(id==='storm'){
  m.storm={left:d.duration,pulses:1};martialStormPulse(h);
 }else if(id==='charge'){
  m.direction=dir;m.charge={left:d.duration,dx:dir.x,dy:dir.y};sfx('heroCharge');
 }else if(id==='skin'){
  m.skinLeft=d.duration;martialEvent('skin',h.x,h.y,{r:29,t:.65,T:.65});sfx('heroSkin');
 }else if(id==='cry'&&talentHas(h,'juggernaut',1)){
  const targets=martialNearby(h,d.radius);for(const e of targets)e.heroTauntUntil=Math.max(e.heroTauntUntil||0,S.fightT+(e.boss?d.bossDuration:d.duration));
  martialEvent('taunt',h.x,h.y,{r:d.radius,t:.8,T:.8});floatText(h.x,h.y-45,'Challenge · '+targets.length+' taunted','gold',12);sfx('heroTaunt');
 }else if(id==='cry'){
  let count=0;for(const u of S.units){if(!u.down&&u.hp>0&&Math.hypot(u.x-h.x,u.y-h.y)<=d.radius){u.warCryUntil=Math.max(u.warCryUntil||0,S.fightT+d.duration);count++;}}
  martialEvent('cry',h.x,h.y,{r:d.radius,t:.8,T:.8});floatText(h.x,h.y-45,'War Cry · '+count+' allies','gold',12);sfx('heroCry');
 }
 heroRender();persist();return true;
}
// Called once per simulation step, including fast-forward. No rage earned from special abilities.
function martialAdvance(h,dt){
 const m=h.martial,lab=martialLab();
 m.skinLeft=Math.max(0,m.skinLeft-dt);m.retaliationCd=Math.max(0,m.retaliationCd-dt);m.counterFlash=Math.max(0,m.counterFlash-dt);
 for(const id of Object.keys(MARTIAL_SKILLS))m.cooldowns[id]=lab?.noCooldown?0:Math.max(0,m.cooldowns[id]-dt);
 if(m.charge){
  const d=talentSkill('charge',h),c=m.charge,step=Math.min(dt,c.left),x=h.x,y=h.y;
  martialMove(h,c.dx*d.distance/d.duration*step,c.dy*d.distance/d.duration*step);c.left-=step;
  if(Math.hypot(x-h.x,y-h.y)>.01)martialEvent('charge',x,y,{x2:h.x,y2:h.y,t:.21,T:.21});
  if(c.left<=1e-7)m.charge=null;
  return 'charge';
 }
 if(m.storm){
  const d=MARTIAL_SKILLS.storm,st=m.storm;st.left=Math.max(0,st.left-dt);
  const elapsed=d.duration-st.left;
  while(st.pulses<d.pulses&&elapsed+1e-7>=st.pulses*d.interval){st.pulses++;martialStormPulse(h);}
  if(st.left<=1e-7)m.storm=null;
  return 'storm';
 }
 return '';
}
function martialLabAction(id){
 if(!S?.sandbox||heroClass(S).id!=='warlord'||!sandboxCanEdit())return;
 const m=S.hero.martial,lab=martialLab();
 if(id==='rage')lab.infinite=!lab.infinite;
 if(id==='cooldown'){lab.noCooldown=!lab.noCooldown;if(lab.noCooldown)for(const k of Object.keys(m.cooldowns))m.cooldowns[k]=0;}
 if(id==='refill'){m.rage=100;for(const k of Object.keys(m.cooldowns))m.cooldowns[k]=0;}
 heroRender();
}
function martialRender(h){
 const m=h.martial,lab=martialLab(),el=id=>document.getElementById(id);
 el('heroRageText').textContent=lab?.infinite?'∞ RAGE':Math.floor(m.rage)+' / 100 RAGE';
 el('heroRageFill').style.width=(lab?.infinite?100:m.rage)+'%';
 for(const [id,base] of Object.entries(MARTIAL_SKILLS)){
  const b=el('heroSkill-'+id),v=talentSkill(id,h),state=martialAvailability(id);
  b.hidden=id==='skin'&&!talentHas(h,'juggernaut',3);b.disabled=state!=='Ready';
  el('heroSkillState-'+id).textContent=id==='skin'&&martialSkinActive(h)?m.skinLeft.toFixed(1)+'s active':state;
  el('heroSkillCost-'+id).textContent=v.cost+' Rage · '+v.cd+'s';
  b.querySelector?.('b')?.replaceChildren(v.name);
  b.title=id==='cleave'?'Front arc · '+v.damage+' physical damage':id==='storm'?v.pulses+' pulses of '+v.damage+' damage · '+v.duration+'s':id==='charge'?v.distance+'px dash · '+v.duration.toFixed(2)+'s immunity':id==='skin'?'60% damage reduction · 5s':talentHas(h,'juggernaut',1)?'Taunt radius 130 · 4s · bosses 2s':'+'+Math.round(v.damageBonus*100)+'% damage · +'+Math.round(v.speedBonus*100)+'% attack rate · '+v.duration+'s';
 }
 const passive=el('heroRetaliation');passive.hidden=!talentHas(h,'juggernaut',2);passive.textContent='RETALIATION · '+classDamage(JUGGERNAUT_RULES.retaliation.damage,h.wave)+' damage · '+m.retaliationChance+'%'+(m.retaliationCd>0?' · '+m.retaliationCd.toFixed(2)+'s recovery':' · Next eligible hit');
 el('heroLab').hidden=!lab;el('heroLabRage').textContent='Infinite rage: '+(lab?.infinite?'ON':'OFF');el('heroLabCd').textContent='No cooldown: '+(lab?.noCooldown?'ON':'OFF');
}
function martialInit(){
 for(const id of Object.keys(MARTIAL_SKILLS))document.getElementById('heroSkill-'+id).addEventListener('click',()=>martialCast(id));
 for(const [id,action] of [['heroLabRage','rage'],['heroLabCd','cooldown'],['heroLabRefill','refill']])document.getElementById(id).addEventListener('click',()=>martialLabAction(action));
}
function martialDraw(){
 if(heroClass(S).id!=='warlord')return;
 ctx.save();ctx.beginPath();ctx.rect(WALL_X,0,worldW()-WALL_X,WORLD_H);ctx.clip();
 for(const u of S.units){if(!martialGuardBuff(u))continue;ctx.strokeStyle='#e9a956';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(u.x,u.y+radius(u)*.7,radius(u)+4,5,0,0,Math.PI*2);ctx.stroke();}
 if(heroActive()&&martialSkinActive()){const h=S.hero;ctx.fillStyle='rgba(158,204,230,.15)';ctx.strokeStyle='#b6e4f8';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(h.x,h.y-7,25,33,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 for(const e of S.enemies||[]){if(!martialTaunted(e))continue;ctx.strokeStyle='#eab86d';ctx.lineWidth=1.7;ctx.beginPath();ctx.arc(e.x,e.y,e.r+3,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f6d49d';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('!',e.x,e.y-e.r-8);}
 for(const f of S.fx){if(f.k!=='martial')continue;const a=Math.max(0,f.t/f.T),p=1-a;ctx.save();ctx.globalAlpha=a;
  if(f.kind==='cleave'){ctx.fillStyle='rgba(246,160,87,.23)';ctx.strokeStyle='#ffe1a6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.arc(f.x,f.y,f.r,f.angle-f.arc/2,f.angle+f.arc/2);ctx.closePath();ctx.fill();ctx.stroke();}
  if(f.kind==='storm'){ctx.strokeStyle='#ec726e';ctx.lineWidth=5;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.65+.35*p),p*6,p*6+Math.PI*1.65);ctx.stroke();ctx.strokeStyle='#ffd4b0';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(f.x,f.y,f.r*.8,p*6+Math.PI,p*6+Math.PI*2.6);ctx.stroke();}
  if(f.kind==='charge'){ctx.strokeStyle='#a9d9ed';ctx.lineWidth=10*a;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x2,f.y2);ctx.stroke();}
  if(f.kind==='counter'){ctx.strokeStyle='#ff937b';ctx.lineWidth=5;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.65+.35*p),p*5,p*5+Math.PI*1.85);ctx.stroke();ctx.strokeStyle='#ffe0bb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,f.r*.83,0,Math.PI*2);ctx.stroke();}
  if(f.kind==='skin'){ctx.strokeStyle='#d2edff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(f.x,f.y-7,25+8*p,33+7*p,0,0,Math.PI*2);ctx.stroke();}
  if(f.kind==='cry'||f.kind==='taunt'){ctx.strokeStyle='#f2c579';ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.35+.65*p),0,Math.PI*2);ctx.stroke();}
  ctx.restore();
 }
 ctx.restore();
}
