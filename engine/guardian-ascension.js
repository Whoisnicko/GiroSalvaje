/* Guardian Ascension V7.74: simulation-time skills, no base stat changes. */
const ASCENSION_RULES=Object.freeze({
 W:Object.freeze({name:'Plague Colossus',cd:8,radius:45,cap:3,tick:.10,duration:3,slow:.15,color:'#9fcb62'}),
 A:Object.freeze({name:'Soul Reaper',cd:6,width:10,weights:Object.freeze([1,.45,.25]),color:'#6ff5e8'}),
 M:Object.freeze({name:'Frostfire Breath',cd:9,radiusFactor:1.25,outerCap:3,outerDamage:.35,color:'#86ddff'}),
 N:Object.freeze({name:'Army of the Dead',cd:12,color:'#a3df9a'}),
 B:Object.freeze({name:"Death's Lament",cd:12,cap:5,rate:.15,duration:4,bossRate:.075,bossDuration:2,color:'#e0a4ff'})
});
const ASCENSION_FIRST=3;
const ASCENSION_PREVIEW_ON=typeof location==='undefined'||new URLSearchParams(location.search).get('ascension')!=='off';
function ascensionEnabled(state=S){return !!state&&ASCENSION_PREVIEW_ON&&!(typeof academyActive==='function'&&academyActive());}
function ascensionEligible(u,state=S){return ascensionEnabled(state)&&state.phase==='fight'&&u?.lvl===3&&!u.temp&&!u.down&&u.hp>0&&!!ASCENSION_RULES[u.type]&&state.units.includes(u)&&!frostFrozen(u,state);}
function ascensionReady(u,state=S){return ascensionEligible(u,state)&&state.fightT+1e-7>=(Number.isFinite(u.ascNext)?u.ascNext:ASCENSION_FIRST);}
function ascensionReset(state=S){state.ascSeq=0;state.ascMetrics={};for(const u of [...state.units,...(state.bench||[]).filter(Boolean)])delete u.ascNext;for(const e of state.enemies||[]){delete e.ascId;delete e.ascPlague;delete e.ascLament;}}
function ascensionId(e,state=S){if(!Number.isSafeInteger(e.ascId)||e.ascId<1)e.ascId=state.ascSeq=(Number.isSafeInteger(state.ascSeq)?state.ascSeq:0)+1;return e.ascId;}
function ascensionMetric(type,key,amount=1,state=S){const m=state.ascMetrics||(state.ascMetrics={});const row=m[type]||(m[type]={casts:0,hits:0,damage:0,raises:0});row[key]=(row[key]||0)+amount;}
function ascensionCommit(u,state=S){if(!ascensionReady(u,state))return false;u.ascNext=state.fightT+ASCENSION_RULES[u.type].cd;ascensionMetric(u.type,'casts',1,state);return true;}
function ascensionFx(type,x,y,r,state=S){if(state.fx.length<64)state.fx.push({k:'ascension',type,x,y,r,t:.5,T:.5});}
function ascensionAnnounce(u){floatText(u.x,u.y-35,ASCENSION_RULES[u.type].name,'gold',10);}
function ascensionNearby(origin,r,cap,enemies=S.enemies){return enemies.filter(e=>e.hp>0&&Math.hypot(e.x-origin.x,e.y-origin.y)<=r).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)).slice(0,cap);}
function ascensionPlague(u,tgt,dmg,state=S){
 if(!ascensionReady(u,state)||tgt.hp<=0||!(dmg>0))return false;
 const d=ASCENSION_RULES.W,targets=[tgt,...ascensionNearby(tgt,d.radius,d.cap-1,state.enemies.filter(e=>e!==tgt))];
 if(!ascensionCommit(u,state))return false;
 for(const e of targets){const old=e.ascPlague,active=old&&old.until>=state.fightT&&old.next<=old.until+1e-6,rate=dmg*d.tick;
 e.ascPlague={rate:active?Math.max(old.rate,rate):rate,next:active?old.next:state.fightT+1,until:state.fightT+d.duration};}
 ascensionFx('W',tgt.x,tgt.y,d.radius,state);ascensionAnnounce(u);return true;
}
function ascensionAdvance(state=S){
 if(!ascensionEnabled(state))return;const now=state.fightT;
 for(const e of state.enemies){const p=e.ascPlague;if(p&&e.hp>0){while(p.next<=now+1e-7&&p.next<=p.until+1e-7&&e.hp>0){const before=e.hp;damage(e,p.rate,{quiet:true});ascensionMetric('W','hits',1,state);ascensionMetric('W','damage',Math.min(before,Math.max(0,before-e.hp)),state);p.next+=1;}if(p.next>p.until+1e-7&&now>=p.until)delete e.ascPlague;}if(e.ascLament&&e.ascLament.until<=now)delete e.ascLament;}
}
function ascensionSlow(e,state=S){return ascensionEnabled(state)&&!e.boss&&!e.bossId&&e.ascPlague?.until>state.fightT?1-ASCENSION_RULES.W.slow*(1-(regionalDef(e)?.slowResistance||0)):1;}
function ascensionLament(u,range,state=S){
 if(!ascensionReady(u,state))return false;
 const d=ASCENSION_RULES.B,targets=ascensionNearby(u,range,d.cap,state.enemies);if(!targets.length||!ascensionCommit(u,state))return false;
 for(const e of targets){const boss=e.boss||e.bossId,rate=boss?d.bossRate:d.rate,until=state.fightT+(boss?d.bossDuration:d.duration),old=e.ascLament;
 e.ascLament={rate:old?.until>state.fightT?Math.max(rate,old.rate):rate,until:Math.max(until,old?.until||0)};}
 ascensionMetric('B','hits',targets.length,state);ascensionFx('B',u.x,u.y,range,state);ascensionAnnounce(u);return true;
}
function ascensionEnemyDamage(e,state=S){return ascensionEnabled(state)&&e.ascLament?.until>state.fightT?1-e.ascLament.rate:1;}
function ascensionSoulShot(u,tgt,dmg,range,state=S){
 if(!ascensionReady(u,state)||tgt.hp<=0||!(dmg>0))return null;
 const dx=tgt.x-u.x,dy=tgt.y-u.y,len=Math.hypot(dx,dy);if(len<1e-6||!ascensionCommit(u,state))return null;
 const reach=Math.max(1,range+radius(u)+tgt.r);ascensionAnnounce(u);ascensionFx('A',u.x,u.y,20,state);
 return {k:'reaper',x:u.x,y:u.y,tx:u.x+dx/len*reach,ty:u.y+dy/len*reach,ang:Math.atan2(dy,dx),sp:380,dmg,source:u,hitIds:[]};
}
function ascensionSegmentEntry(x,y,nx,ny,e,width){
 const dx=nx-x,dy=ny-y,l2=dx*dx+dy*dy,ox=x-e.x,oy=y-e.y,r=width+(e.r||0),c=ox*ox+oy*oy-r*r;
 if(c<=0)return 0;if(l2<=1e-12)return null;const b=ox*dx+oy*dy,disc=b*b-l2*c;if(disc<0)return null;
 const at=(-b-Math.sqrt(disc))/l2;return at>=0&&at<=1?at:null;
}
function ascensionReaperStep(s,dt,state=S){
 if(!ascensionEnabled(state)){s.done=true;return;}
 const d=ASCENSION_RULES.A,dx=s.tx-s.x,dy=s.ty-s.y,len=Math.hypot(dx,dy),step=Math.min(len,s.sp*dt),nx=len?s.x+dx/len*step:s.x,ny=len?s.y+dy/len*step:s.y;
 const hits=[];for(const e of state.enemies){if(e.hp<=0||s.hitIds.includes(ascensionId(e,state)))continue;const at=ascensionSegmentEntry(s.x,s.y,nx,ny,e,d.width);if(at!==null)hits.push({e,at});}
 hits.sort((a,b)=>a.at-b.at);
 for(const {e} of hits){if(s.hitIds.length>=d.weights.length)break;if(e.hp<=0)continue;const weight=d.weights[s.hitIds.length];s.hitIds.push(ascensionId(e,state));const before=e.hp;
 hitEnemy(e,s.dmg*weight*ashShotFactor(s)*biomeProjectileFactor(e),'a',{kb:0,source:s.source});
 ascensionMetric('A','hits',1,state);ascensionMetric('A','damage',Math.min(before,Math.max(0,before-e.hp)),state);ascensionFx('A',e.x,e.y,16,state);}
 s.x=nx;s.y=ny;if(step>=len-1e-7||s.hitIds.length>=d.weights.length)s.done=true;
}
function ascensionFrostfire(u,tgt,state=S){if(!ascensionReady(u,state)||tgt.hp<=0||!ascensionCommit(u,state))return false;ascensionAnnounce(u);ascensionFx('M',u.x,u.y,26,state);return true;}
function ascensionOuterTargets(s,state=S){const d=ASCENSION_RULES.M;return ascensionNearby({x:s.tx,y:s.ty},s.splash*d.radiusFactor,d.outerCap,state.enemies.filter(e=>Math.hypot(e.x-s.tx,e.y-s.ty)>s.splash));}
function ascensionFrostfireImpact(s,state=S){
 if(!ascensionEnabled(state)||!s.frostfire)return;const d=ASCENSION_RULES.M;
 for(const e of ascensionOuterTargets(s,state)){const before=e.hp;hitEnemy(e,s.dmg*d.outerDamage*ashShotFactor(s)*biomeProjectileFactor(e),'m',{source:s.source,kb:0});ascensionMetric('M','hits',1,state);ascensionMetric('M','damage',Math.min(before,Math.max(0,before-e.hp)),state);}
 ascensionFx('M',s.tx,s.ty,s.splash*d.radiusFactor,state);
}
function ascensionRaiseCount(n,state=S){return ascensionReady(n,state)&&skelCap(n.lvl)-(n.skels||0)>=2?2:1;}
function ascensionRaiseCommit(n,state=S){if(!ascensionCommit(n,state))return false;ascensionMetric('N','raises',1,state);ascensionAnnounce(n);return true;}
function ascensionNormalize(state){
 const now=Number.isFinite(state.fightT)?Math.max(0,state.fightT):0,ids=new Set();let seq=0;
 for(const e of state.enemies){if(Number.isSafeInteger(e.ascId)&&e.ascId>0&&!ids.has(e.ascId)){ids.add(e.ascId);seq=Math.max(seq,e.ascId);}else delete e.ascId;
 const p=e.ascPlague;if(!p||![p.rate,p.next,p.until].every(Number.isFinite)||p.rate<=0||p.rate>1e7||p.until<now||p.until>now+3.001||p.next<now-1||p.next>p.until+1.001)delete e.ascPlague;
 const q=e.ascLament;if(!q||![q.rate,q.until].every(Number.isFinite)||q.rate<=0||q.rate>.15||q.until<=now||q.until>now+4.001)delete e.ascLament;}
 state.ascSeq=Math.max(seq,Number.isSafeInteger(state.ascSeq)&&state.ascSeq>=0?state.ascSeq:0);
 for(const u of [...state.units,...state.bench.filter(Boolean)]){const d=ASCENSION_RULES[u.type];if(state.phase!=='fight'||u.lvl!==3||!d||!Number.isFinite(u.ascNext)||u.ascNext<0||u.ascNext>now+d.cd+.001)delete u.ascNext;}
 state.shots=state.shots.filter(q=>q.k!=='reaper'||(Array.isArray(q.hitIds)&&q.hitIds.length<=3&&q.hitIds.every(id=>Number.isSafeInteger(id)&&id>0)&&new Set(q.hitIds).size===q.hitIds.length&&[q.x,q.y,q.tx,q.ty,q.sp,q.dmg].every(Number.isFinite)&&q.sp===380&&q.dmg>0&&q.dmg<=1e7));
 for(const q of state.shots)if(q.k==='reaper')for(const id of q.hitIds)state.ascSeq=Math.max(state.ascSeq,id);
 state.ascMetrics={};
}
function ascensionDrawEffect(f,a){const d=ASCENSION_RULES[f.type];if(!d)return;ctx.save();ctx.globalAlpha=a*.8;ctx.strokeStyle=d.color;ctx.lineWidth=2;const p=1-a;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.45+.55*p),0,Math.PI*2);ctx.stroke();if(!feelReduced()){ctx.globalAlpha=a*.35;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.25+.5*p),0,Math.PI*2);ctx.stroke();}ctx.restore();}
function ascensionDrawUnit(u,y){if(!ascensionEligible(u)||!sandboxActive())return;const d=ASCENSION_RULES[u.type],left=Math.max(0,(Number.isFinite(u.ascNext)?u.ascNext:ASCENSION_FIRST)-S.fightT);ctx.save();ctx.fillStyle='#141821';ctx.fillRect(u.x-12,y,24,3);ctx.fillStyle=d.color;ctx.fillRect(u.x-12,y,24*Math.max(0,1-left/(u.ascNext?d.cd:ASCENSION_FIRST)),3);ctx.restore();}
function ascensionDrawEnemy(e,s){if(!ascensionEnabled())return;const p=e.ascPlague?.until>S.fightT,q=e.ascLament?.until>S.fightT;if(!p&&!q)return;ctx.save();ctx.fillStyle=p?ASCENSION_RULES.W.color:ASCENSION_RULES.B.color;ctx.fillRect(e.x-e.r,e.y+s*.35,4,4);if(p&&q){ctx.fillStyle=ASCENSION_RULES.B.color;ctx.fillRect(e.x-e.r+6,e.y+s*.35,4,4);}ctx.restore();}
function ascensionSandboxSummary(){if(!sandboxActive()||!ascensionEnabled()||!S.ascMetrics)return 'Ascension off / no activity';return Object.entries(S.ascMetrics).map(([k,m])=>NAMES[k]+': '+m.casts+' casts'+(m.hits?' · '+m.hits+' hits':'')+(m.raises?' · '+m.raises+' extra summons':'')).join(' | ')||'Ascension: waiting for first cast';}
