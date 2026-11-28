/* Guardian Ascension V7.74: simulation-time skills, no base stat changes. */
const ASCENSION_RULES=Object.freeze({
 W:Object.freeze({name:'Colossus Slam',cd:8,radius:65,stun:2,stunGuard:2,splashRadius:45,splashDamage:.5,color:'#e9b85e'}),
 A:Object.freeze({name:'Soul Reaper',cd:6,width:10,secondary:.6,spread:Math.PI/9,sideDamage:.75,color:'#6ff5e8'}),
 M:Object.freeze({name:'Frostfire Breath',cd:9,radiusFactor:1.25,outerCap:3,outerDamage:.35,slow:.5,slowDuration:3,freeze:4,freezeGuard:5,color:'#86ddff'}),
 N:Object.freeze({name:'Army of the Dead',cd:12,color:'#a3df9a'}),
 B:Object.freeze({name:"Death's Lament",cd:12,cap:5,rate:.15,duration:4,bossRate:.075,bossDuration:2,color:'#e0a4ff'})
});
const ASCENSION_FIRST=3;
const ASCENSION_PREVIEW_ON=typeof location==='undefined'||new URLSearchParams(location.search).get('ascension')!=='off';
function ascensionEnabled(state=S){return !!state&&ASCENSION_PREVIEW_ON&&!(typeof academyActive==='function'&&academyActive());}
function ascensionEligible(u,state=S){return ascensionEnabled(state)&&state.phase==='fight'&&u?.lvl===3&&!u.temp&&!u.down&&u.hp>0&&!!ASCENSION_RULES[u.type]&&state.units.includes(u)&&!frostFrozen(u,state);}
function ascensionReady(u,state=S){return ascensionEligible(u,state)&&state.fightT+1e-7>=(Number.isFinite(u.ascNext)?u.ascNext:ASCENSION_FIRST);}
function ascensionReset(state=S){state.ascSeq=0;state.ascVolleySeq=0;state.ascMetrics={};for(const u of [...state.units,...(state.bench||[]).filter(Boolean)])delete u.ascNext;for(const e of state.enemies||[]){delete e.ascId;delete e.ascPlague;delete e.ascLament;delete e.ascStunUntil;delete e.ascStunGuard;delete e.ascFreezeUntil;delete e.ascFreezeGuard;delete e.ascSlowUntil;}}
function ascensionId(e,state=S){if(!Number.isSafeInteger(e.ascId)||e.ascId<1)e.ascId=state.ascSeq=(Number.isSafeInteger(state.ascSeq)?state.ascSeq:0)+1;return e.ascId;}
function ascensionMetric(type,key,amount=1,state=S){const m=state.ascMetrics||(state.ascMetrics={});const row=m[type]||(m[type]={casts:0,hits:0,damage:0,raises:0});row[key]=(row[key]||0)+amount;}
function ascensionCommit(u,state=S){if(!ascensionReady(u,state))return false;u.ascNext=state.fightT+ASCENSION_RULES[u.type].cd;ascensionMetric(u.type,'casts',1,state);return true;}
function ascensionFx(type,x,y,r,state=S){if(state.fx.length<64)state.fx.push({k:'ascension',type,x,y,r,t:.5,T:.5});}
function ascensionAnnounce(u){floatText(u.x,u.y-35,ASCENSION_RULES[u.type].name,'gold',10);}
function ascensionNearby(origin,r,cap,enemies=S.enemies){return enemies.filter(e=>e.hp>0&&Math.hypot(e.x-origin.x,e.y-origin.y)<=r).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)).slice(0,cap);}
function ascensionBoss(e){return !!(e.boss||e.bossId);}
function ascensionControlled(e,state=S){return ascensionEnabled(state)&&((e.ascStunUntil||0)>state.fightT||(e.ascFreezeUntil||0)>state.fightT);}
function ascensionControl(e,type,state=S){
 if(!ascensionEnabled(state)||e.hp<=0)return false;
 const boss=ascensionBoss(e),now=state.fightT,d=ASCENSION_RULES[type];
 if(type==='W'){if(boss||e.ascStunGuard>now||ascensionControlled(e,state))return false;e.ascStunUntil=now+d.stun;e.ascStunGuard=e.ascStunUntil+d.stunGuard;}
 else if(type==='M'){if(!boss||e.ascFreezeGuard>now||ascensionControlled(e,state))return false;e.ascFreezeUntil=now+d.freeze;e.ascFreezeGuard=e.ascFreezeUntil+d.freezeGuard;}
 else return false;
 if(e.bossCast){delete e.bossCast;e.bossCooldown=Math.max(e.bossCooldown||0,typeof bossDef==='function'?(bossDef(e)?.cooldown||0):0);}
 delete e.iceVX;delete e.iceVY;e.kbv=0;delete e.heroKbx;delete e.heroKby; e.moving=false;
 ascensionMetric(type,'controls',1,state);return true;
}
function ascensionZombieSpecial(u,tgt,state=S){
 if(!ascensionReady(u,state))return false;const d=ASCENSION_RULES.W;
 const targets=ascensionNearby(u,d.radius,Infinity,state.enemies).filter(e=>!ascensionBoss(e)&&!(e.ascStunGuard>state.fightT)&&!ascensionControlled(e,state));
 if(!targets.length||!ascensionCommit(u,state))return false;
 for(const e of targets)if(ascensionControl(e,'W',state))ascensionMetric('W','hits',1,state);
 ascensionFx('W',u.x,u.y,d.radius,state);ascensionAnnounce(u);return true;
}
function ascensionZombieSplash(u,tgt,dmg,state=S){
 if(!ascensionEligible(u,state))return;const d=ASCENSION_RULES.W;
 for(const e of ascensionNearby(tgt,d.splashRadius,Infinity,state.enemies.filter(e=>e!==tgt))){const hp=e.hp;hitEnemy(e,dmg*d.splashDamage,'leaf',{kb:0,source:u});ascensionMetric('W','damage',Math.min(hp,Math.max(0,hp-e.hp)),state);ascensionMetric('W','hits',1,state);}
 if(state.fx.length<64)state.fx.push({k:'ascension',type:'W',x:tgt.x,y:tgt.y,r:d.splashRadius,t:.22,T:.22,basic:true});
}
function ascensionAdvance(state=S){if(!ascensionEnabled(state))return;const now=state.fightT;for(const e of state.enemies){delete e.ascPlague;if(e.ascLament&&e.ascLament.until<=now)delete e.ascLament;for(const k of ['ascStunUntil','ascStunGuard','ascFreezeUntil','ascFreezeGuard','ascSlowUntil'])if(e[k]<=now)delete e[k];}}
function ascensionSlow(e,state=S){return ascensionEnabled(state)&&e.ascSlowUntil>state.fightT?1-ASCENSION_RULES.M.slow*(1-(regionalDef(e)?.slowResistance||0)):1;}

function ascensionLament(u,range,state=S){
 if(!ascensionReady(u,state))return false;
 const d=ASCENSION_RULES.B,targets=ascensionNearby(u,range,d.cap,state.enemies);if(!targets.length||!ascensionCommit(u,state))return false;
 for(const e of targets){const boss=e.boss||e.bossId,rate=boss?d.bossRate:d.rate,until=state.fightT+(boss?d.bossDuration:d.duration),old=e.ascLament;
 e.ascLament={rate:old?.until>state.fightT?Math.max(rate,old.rate):rate,until:Math.max(until,old?.until||0)};}
 ascensionMetric('B','hits',targets.length,state);ascensionFx('B',u.x,u.y,range,state);ascensionAnnounce(u);return true;
}
function ascensionEnemyDamage(e,state=S){return ascensionEnabled(state)&&e.ascLament?.until>state.fightT?1-e.ascLament.rate:1;}
function ascensionSoulShots(u,tgt,dmg,range,state=S){
 if(!ascensionEligible(u,state)||tgt.hp<=0||!(dmg>0))return null;
 const dx=tgt.x-u.x,dy=tgt.y-u.y,len=Math.hypot(dx,dy);if(len<1e-6)return null;
 const d=ASCENSION_RULES.A,special=ascensionCommit(u,state),reach=Math.max(1,range+radius(u)+tgt.r),angle=Math.atan2(dy,dx);
 const volley=state.ascVolleySeq=(state.ascVolleySeq||0)+1;
 if(special){ascensionAnnounce(u);ascensionFx('A',u.x,u.y,25,state);}
 if(state.fx.length<64)state.fx.push({k:'ascensionSwing',x:u.x,y:u.y,angle,r:radius(u)+12,t:.18,T:.18});
 return (special?[0,-d.spread,d.spread]:[0]).map((off,j)=>({k:'reaper',x:u.x,y:u.y,tx:u.x+Math.cos(angle+off)*reach,ty:u.y+Math.sin(angle+off)*reach,ang:angle+off,sp:380,dmg:dmg*(j?d.sideDamage:1),source:u,hitIds:[],volley,special}));
}
function ascensionSegmentEntry(x,y,nx,ny,e,width){
 const dx=nx-x,dy=ny-y,l2=dx*dx+dy*dy,ox=x-e.x,oy=y-e.y,r=width+(e.r||0),c=ox*ox+oy*oy-r*r;
 if(c<=0)return 0;if(l2<=1e-12)return null;const b=ox*dx+oy*dy,disc=b*b-l2*c;if(disc<0)return null;
 const at=(-b-Math.sqrt(disc))/l2;return at>=0&&at<=1?at:null;
}
function ascensionReaperStep(s,dt,state=S){
 if(!ascensionEnabled(state)){s.done=true;return;}
 const d=ASCENSION_RULES.A,dx=s.tx-s.x,dy=s.ty-s.y,len=Math.hypot(dx,dy),step=Math.min(len,s.sp*dt),nx=len?s.x+dx/len*step:s.x,ny=len?s.y+dy/len*step:s.y;
 const group=s.volley?state.shots.filter(q=>q.k==='reaper'&&q.volley===s.volley):[s],seen=new Set(group.flatMap(q=>q.hitIds||[]));const hits=[];
 for(const e of state.enemies){if(e.hp<=0||seen.has(ascensionId(e,state)))continue;const at=ascensionSegmentEntry(s.x,s.y,nx,ny,e,d.width);if(at!==null)hits.push({e,at});}
 hits.sort((a,b)=>a.at-b.at);
 for(const {e} of hits){if(e.hp<=0||seen.has(e.ascId))continue;const weight=(s.localHits||0)?d.secondary:1;s.localHits=(s.localHits||0)+1;seen.add(e.ascId);s.hitIds.push(e.ascId);const before=e.hp;
 hitEnemy(e,s.dmg*weight*ashShotFactor(s)*biomeProjectileFactor(e),'a',{kb:0,source:s.source});
 ascensionMetric('A','hits',1,state);ascensionMetric('A','damage',Math.min(before,Math.max(0,before-e.hp)),state);if(s.special)ascensionFx('A',e.x,e.y,16,state);}
 // Replicate the full volley hit set onto every surviving projectile for save/restore and completed siblings.
 for(const q of group)q.hitIds=[...seen];
 s.x=nx;s.y=ny;if(step>=len-1e-7)s.done=true;
}
function ascensionFrostfire(u,tgt,state=S){if(!ascensionReady(u,state)||tgt.hp<=0||!ascensionCommit(u,state))return false;ascensionAnnounce(u);ascensionFx('M',u.x,u.y,26,state);return true;}
function ascensionOuterTargets(s,state=S){const d=ASCENSION_RULES.M;return ascensionNearby({x:s.tx,y:s.ty},s.splash*d.radiusFactor,d.outerCap,state.enemies.filter(e=>Math.hypot(e.x-s.tx,e.y-s.ty)>s.splash));}
function ascensionDragonStatus(s,e,state=S){if(!ascensionEnabled(state)||!s.ascDragon||e.hp<=0)return; e.ascSlowUntil=Math.max(e.ascSlowUntil||0,state.fightT+ASCENSION_RULES.M.slowDuration);if(s.frostfire)ascensionControl(e,'M',state);}
function ascensionFrostfireImpact(s,state=S){
 if(!ascensionEnabled(state)||!s.frostfire)return;const d=ASCENSION_RULES.M;
 for(const e of ascensionOuterTargets(s,state)){const before=e.hp;hitEnemy(e,s.dmg*d.outerDamage*ashShotFactor(s)*biomeProjectileFactor(e),'m',{source:s.source,kb:0});ascensionDragonStatus(s,e,state);ascensionMetric('M','hits',1,state);ascensionMetric('M','damage',Math.min(before,Math.max(0,before-e.hp)),state);}
 ascensionFx('M',s.tx,s.ty,s.splash*d.radiusFactor,state);
}
function ascensionRaiseCount(n,state=S){return ascensionReady(n,state)&&skelCap(n.lvl)-(n.skels||0)>=2?2:1;}
function ascensionRaiseCommit(n,state=S){if(!ascensionCommit(n,state))return false;ascensionMetric('N','raises',1,state);ascensionAnnounce(n);return true;}
function ascensionNormalize(state){
 const now=Number.isFinite(state.fightT)?Math.max(0,state.fightT):0,ids=new Set();let seq=0;
 for(const e of state.enemies){if(Number.isSafeInteger(e.ascId)&&e.ascId>0&&!ids.has(e.ascId)){ids.add(e.ascId);seq=Math.max(seq,e.ascId);}else delete e.ascId;
 delete e.ascPlague;for(const [k,max] of Object.entries({ascStunUntil:2,ascStunGuard:4,ascFreezeUntil:4,ascFreezeGuard:9,ascSlowUntil:3}))if(!Number.isFinite(e[k])||e[k]<=now||e[k]>now+max+.001)delete e[k];
 const q=e.ascLament;if(!q||![q.rate,q.until].every(Number.isFinite)||q.rate<=0||q.rate>.15||q.until<=now||q.until>now+4.001)delete e.ascLament;}
 state.ascSeq=Math.max(seq,Number.isSafeInteger(state.ascSeq)&&state.ascSeq>=0?state.ascSeq:0);
 for(const u of [...state.units,...state.bench.filter(Boolean)]){const d=ASCENSION_RULES[u.type];if(state.phase!=='fight'||u.lvl!==3||!d||!Number.isFinite(u.ascNext)||u.ascNext<0||u.ascNext>now+d.cd+.001)delete u.ascNext;}
 state.shots=state.shots.filter(q=>q.k!=='reaper'||(Array.isArray(q.hitIds)&&q.hitIds.length<=4096&&q.hitIds.every(id=>Number.isSafeInteger(id)&&id>0)&&new Set(q.hitIds).size===q.hitIds.length&&[q.x,q.y,q.tx,q.ty,q.sp,q.dmg].every(Number.isFinite)&&q.sp===380&&q.dmg>0&&q.dmg<=1e7));
 for(const q of state.shots)if(q.k==='reaper'){q.localHits=Number.isSafeInteger(q.localHits)?Math.max(0,Math.min(q.localHits,q.hitIds.length)):q.hitIds.length;for(const id of q.hitIds)state.ascSeq=Math.max(state.ascSeq,id);}
 state.ascVolleySeq=Math.max(0,Number.isSafeInteger(state.ascVolleySeq)?state.ascVolleySeq:0,...state.shots.filter(q=>q.k==='reaper').map(q=>Number.isSafeInteger(q.volley)?q.volley:0));state.ascMetrics={};
}
function ascensionDrawEffect(f,a){const d=ASCENSION_RULES[f.type];if(!d)return;ctx.save();ctx.globalAlpha=a*.8;ctx.strokeStyle=d.color;ctx.lineWidth=2;const p=1-a;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.45+.55*p),0,Math.PI*2);ctx.stroke();if(!feelReduced()){ctx.globalAlpha=a*.35;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.25+.5*p),0,Math.PI*2);ctx.stroke();if(f.type==='W'&&!f.basic||f.type==='M'){ctx.globalAlpha=a*.7;ctx.fillStyle=d.color;for(let j=0;j<8;j++){const angle=j*Math.PI/4,rad=f.r*(.45+.55*p),x=f.x+Math.cos(angle)*rad,y=f.y+Math.sin(angle)*rad;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillRect(-2,-2,f.type==='M'?9:5,3);ctx.restore();}}}ctx.restore();}
function ascensionDrawUnit(u,y){if(!ascensionEligible(u)||!sandboxActive())return;const d=ASCENSION_RULES[u.type],left=Math.max(0,(Number.isFinite(u.ascNext)?u.ascNext:ASCENSION_FIRST)-S.fightT);ctx.save();ctx.fillStyle='#141821';ctx.fillRect(u.x-12,y,24,3);ctx.fillStyle=d.color;ctx.fillRect(u.x-12,y,24*Math.max(0,1-left/(u.ascNext?d.cd:ASCENSION_FIRST)),3);ctx.restore();}
function ascensionDrawEnemy(e,s){if(!ascensionEnabled())return;const now=S.fightT,freeze=e.ascFreezeUntil>now,stun=e.ascStunUntil>now,slow=e.ascSlowUntil>now,q=e.ascLament?.until>now;if(!freeze&&!stun&&!slow&&!q)return;ctx.save();
 if(freeze){ctx.strokeStyle='#9be7ff';ctx.fillStyle='#72c9ff35';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x-s*.36,e.y+s*.38);ctx.lineTo(e.x-s*.46,e.y-s*.18);ctx.lineTo(e.x-s*.18,e.y-s*.55);ctx.lineTo(e.x+s*.23,e.y-s*.48);ctx.lineTo(e.x+s*.45,e.y-s*.10);ctx.lineTo(e.x+s*.32,e.y+s*.38);ctx.closePath();ctx.fill();ctx.stroke();}
 if(stun){ctx.fillStyle='#ffe09b';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('✦ ✦ ✦',e.x,e.y-s*.56-8);}
 if(slow){ctx.fillStyle='#86ddff';ctx.fillRect(e.x-e.r,e.y+s*.35,5,5);}
 if(q){ctx.fillStyle=ASCENSION_RULES.B.color;ctx.fillRect(e.x-e.r+7,e.y+s*.35,5,5);}ctx.restore();}
function ascensionDrawSwing(f,a){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle);ctx.strokeStyle='#9ffff0';ctx.globalAlpha=a;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,f.r,-1.1,1.1);ctx.stroke();ctx.restore();}

function ascensionSandboxSummary(){if(!sandboxActive()||!ascensionEnabled()||!S.ascMetrics)return 'Ascension off / no activity';return Object.entries(S.ascMetrics).map(([k,m])=>NAMES[k]+': '+m.casts+' casts'+(m.hits?' · '+m.hits+' hits':'')+(m.raises?' · '+m.raises+' extra summons':'')).join(' | ')||'Ascension: waiting for first cast';}
