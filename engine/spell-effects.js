/* Arcane Warfare: real combat effects, independent of gesture recognition.
   Spell parameters are owned by SPELL_DATA. Temporary shields serialize with units;
   visual events use the existing transient S.fx queue. */
function spellClearWave(){
 if(!S)return;
 for(const u of [...S.units,...S.bench.filter(Boolean)]){delete u.arcaneShield;delete u.arcaneShieldTime;delete u.arcaneShieldMax;}
 S.fx=S.fx.filter(f=>!String(f.k).startsWith('arcane'));
}
function spellAdvance(dt){
 for(const u of S.units){
  if(!(u.arcaneShield>0&&u.arcaneShieldTime>0))continue;
  u.arcaneShieldTime=Math.max(0,u.arcaneShieldTime-dt);
  if(u.arcaneShieldTime<=0||u.down||u.hp<=0){delete u.arcaneShield;delete u.arcaneShieldTime;delete u.arcaneShieldMax;}
 }
}
function spellEvent(kind,x,y,duration,extra={}){
 // Cap only this module's transient effects; never remove other combat effects.
 const n=S.fx.filter(f=>String(f.k).startsWith('arcane')).length;
 if(n>=32){const i=S.fx.findIndex(f=>String(f.k).startsWith('arcane'));if(i>=0)S.fx.splice(i,1);}
 S.fx.push({k:kind,x,y,t:duration,T:duration,seed:Math.random()*1000,...extra});
}
function spellDamageAlly(u,amount){
 if(!Number.isFinite(amount)||amount<=0||u.down||u.hp<=0)return 0;
 let remaining=amount;
 // God mode protects HP, but shields still absorb hits so testers can validate depletion.
 if(u.arcaneShield>0&&u.arcaneShieldTime>0){
  const blocked=Math.min(remaining,u.arcaneShield);remaining-=blocked;u.arcaneShield-=blocked;
  spellEvent('arcaneBlock',u.x,u.y,.30,{r:radius(u)+9});floatText(u.x,u.y-radius(u)-17,'Blocked '+Math.ceil(blocked),'soul',11);
  if(u.arcaneShield<=1e-6){delete u.arcaneShield;delete u.arcaneShieldTime;delete u.arcaneShieldMax;spellEvent('arcaneBreak',u.x,u.y,.48,{r:radius(u)+9});sfx('arcaneBreak');}
  else sfx('arcaneBlock');
 }
 const dealt=sandboxGod()?0:remaining;
 u.hp-=dealt;return dealt;
}
function spellChain(first,d=SPELL_DATA.lightning){
 if(!first||first.hp<=0||!S.enemies.includes(first))return [];
 const chain=[first];
 while(chain.length<d.damage.length){
  const last=chain[chain.length-1];
  const options=S.enemies.filter(e=>e.hp>0&&!chain.includes(e)&&Math.hypot(e.x-last.x,e.y-last.y)<=d.r);
  options.sort((a,b)=>Math.hypot(a.x-last.x,a.y-last.y)-Math.hypot(b.x-last.x,b.y-last.y));
  if(!options.length)break;chain.push(options[0]);
 }
 return chain;
}
function spellExecute(id,target){
 const d=SPELL_DATA[id];
 if(!d?.implemented)return 'preview only (no combat effect).';
 if(id==='fire'){
  const dmg=d.damage+d.perTwoWaves*Math.floor(Math.max(0,S.wave-1)/2);
  const targets=S.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<=d.r);
  targets.forEach(e=>hitEnemy(e,dmg,'m',{pierce:true,kb:30}));
  spellEvent('arcaneFire',target.x,target.y,.88,{r:d.r});
  burst(target.x,target.y,'m',24,140);burst(target.x,target.y,'gold',15,110);S.shake=Math.max(S.shake,3);
  sfx('arcaneFire');return targets.length+' enemies hit · '+dmg+' damage each.';
 }
 if(id==='barrier'){
  const u=target.entity,capacity=Math.max(1,Math.round(u.maxHp*d.hpFraction));
  u.arcaneShield=capacity;u.arcaneShieldMax=capacity;u.arcaneShieldTime=d.duration;
  spellEvent('arcaneShield',u.x,u.y,.55,{r:radius(u)+9});
  floatText(u.x,u.y-radius(u)-16,'+'+capacity+' shield','soul',12);sfx('arcaneShield');
  return capacity+' shield HP · '+d.duration+'s.';
 }
 if(id==='lightning'){
  const chain=spellChain(target.entity,d);
  // Freeze endpoints before damage; no repeated targets or distance from original instead of last.
  const points=chain.map(e=>({x:e.x,y:e.y}));
  chain.forEach((e,i)=>{hitEnemy(e,d.damage[i],'soul',{pierce:true,kb:0});burst(e.x,e.y,'soul',8,80);});
  if(points.length)spellEvent('arcaneLightning',points[0].x,points[0].y,.52,{points});
  sfx('arcaneLightning');return chain.length+' enemies struck · '+d.damage.slice(0,chain.length).join(' / ')+' damage.';
 }
 return 'preview only.';
}
function spellDraw(){
 if(!S||S.phase!=='fight')return;
 const reduced=feelReduced(),minimal=prefs.effects==='off',soft=prefs.effects==='soft';
 ctx.save();ctx.beginPath();ctx.rect(0,0,worldW(),WORLD_H);ctx.clip();
 const circle=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);};
 const glow=(x,y,r,color,opacity)=>{const gr=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));gr.addColorStop(0,color);gr.addColorStop(1,'transparent');ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle=gr;ctx.fillRect(x-r,y-r,2*r,2*r);ctx.restore();};
 const t=reduced?0:performance.now()/1000;
 // Barrier stays attached to its guardian; the small meter reports remaining absorption.
 for(const u of S.units){
  if(u.down||u.hp<=0||!(u.arcaneShield>0&&u.arcaneShieldTime>0))continue;
  const x=u.x,y=u.y,r=radius(u)+9,ratio=Math.min(1,u.arcaneShield/(u.arcaneShieldMax||u.arcaneShield)),alpha=.65+.12*Math.sin(t*6);
  ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='#74dcff';ctx.fillStyle='rgba(67,188,244,.13)';ctx.lineWidth=2;circle(x,y,r);ctx.fill();ctx.stroke();
  if(!minimal){ctx.strokeStyle='#d8fbff';ctx.lineWidth=1;ctx.setLineDash([4,5]);circle(x,y,r+3);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<6;i++){const a=i*Math.PI/3+t*.8;ctx.fillStyle='#c5f7ff';ctx.fillRect(x+Math.cos(a)*r-1.5,y+Math.sin(a)*r-1.5,3,3);}}
  ctx.globalAlpha=1;ctx.fillStyle='#101923';ctx.fillRect(x-r,y-r-8,2*r,4);ctx.fillStyle='#80d9ff';ctx.fillRect(x-r,y-r-8,2*r*ratio,4);ctx.restore();
 }
 for(const f of S.fx){
  if(!String(f.k).startsWith('arcane'))continue;
  const a=Math.max(0,f.t/f.T),p=1-a;
  ctx.save();
  if(f.k==='arcaneFire'){
   const r=f.r,rr=reduced?r:r*Math.min(1,.22+p*2.4);
   if(!minimal)glow(f.x,f.y,rr,'#ff7e26',a*(soft?.3:.60));
   ctx.globalAlpha=a;ctx.strokeStyle='#ffb95e';ctx.lineWidth=3;circle(f.x,f.y,rr);ctx.stroke();ctx.strokeStyle='#8c3027';ctx.lineWidth=1.5;circle(f.x,f.y,r);ctx.stroke();
   if(!minimal){
    const n=soft?10:22;
    for(let i=0;i<n;i++){const ang=i*2.399963+f.seed,dist=r*(.15+.77*((i*17%23)/23))*Math.min(1,.3+p*2.1),x=f.x+Math.cos(ang)*dist,y=f.y+Math.sin(ang)*dist;const w=5+(i%4)*3,h=(10+(i%5)*5)*(1-p*.5);ctx.globalAlpha=a*.85;ctx.fillStyle=i%3?'#ec5e29':'#ffce67';ctx.beginPath();ctx.moveTo(x-w,y);ctx.quadraticCurveTo(x-w*.5,y-h*.45,x+Math.sin(ang)*5,y-h);ctx.quadraticCurveTo(x+w,y-h*.4,x+w,y);ctx.closePath();ctx.fill();ctx.fillStyle='#fff0b2';ctx.fillRect(x-1,y-4,2,4);}
   }
  }else if(f.k==='arcaneLightning'){
   const pts=[{x:f.points[0].x,y:-12},...f.points];
   for(let j=1;j<pts.length;j++){const A=pts[j-1],B=pts[j],dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy)||1,n=Math.max(3,Math.min(16,Math.round(len/10)));const path=()=>{ctx.beginPath();ctx.moveTo(A.x,A.y);for(let i=1;i<n;i++){const q=i/n,off=Math.sin(f.seed+i*4.7+j*8+(reduced?0:Math.floor(p*8)))*Math.min(10,len*.13);ctx.lineTo(A.x+dx*q-dy/len*off,A.y+dy*q+dx/len*off);}ctx.lineTo(B.x,B.y);};
    ctx.lineJoin='round';ctx.lineCap='round';if(!minimal){ctx.globalAlpha=a*.22;ctx.strokeStyle='#5699ff';ctx.lineWidth=10;path();ctx.stroke();}ctx.globalAlpha=a;ctx.strokeStyle='#7bdfff';ctx.lineWidth=4;path();ctx.stroke();ctx.strokeStyle='#f1fcff';ctx.lineWidth=1.6;path();ctx.stroke();if(!minimal)glow(B.x,B.y,20,'#b6eaff',a*.52);
   }
  }else{
   const r=f.r;ctx.globalAlpha=a;ctx.strokeStyle='#91edff';ctx.lineWidth=2;
   circle(f.x,f.y,r*(reduced?1:1+p*.45));ctx.stroke();
   if(!minimal){const n=f.k==='arcaneBreak'?12:6;for(let i=0;i<n;i++){const a2=i*2*Math.PI/n+f.seed,rr=r*(1+p*.8),x=f.x+Math.cos(a2)*rr,y=f.y+Math.sin(a2)*rr;ctx.fillStyle='#c5fbff';ctx.fillRect(x-1.5,y-1.5,3,3);}}
  }
  ctx.restore();
 }
 ctx.restore();
}
