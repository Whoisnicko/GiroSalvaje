/* Spatial, derived synergies. No counters, save fields or persistent modifiers. */
const SYNERGIES=Object.freeze([
 Object.freeze({id:'boneguard',name:'Boneguard',source:'W',targets:Object.freeze(['A','M']),radius:100,effect:'damageTaken',factor:.85,description:'Wraiths and Dragons within 100 px of a living Zombie take 15% less incoming damage.'}),
 Object.freeze({id:'spectralchoir',name:'Spectral Choir',source:'B',targets:Object.freeze(['A']),radius:'aura',effect:'attackRate',factor:1.15,description:'Wraiths within a living Banshee’s aura attack 15% faster, in addition to the normal aura.'}),
 Object.freeze({id:'ashritual',name:'Ash Ritual',source:'M',targets:Object.freeze(['N']),radius:110,effect:'raiseCooldown',factor:.75,description:'Necromancers within 110 px of a living Dragon have a 25% shorter cooldown after raising a skeleton. The normal summon cap and death-radius requirement remain.'})
]);
function synergyEligible(u,state){return !!u&&!!state&&['prep','fight'].includes(state.phase)&&!u.temp&&!u.down&&u.hp>0&&Number.isFinite(u.x)&&u.y>=0&&u.y<WORLD_H&&state.units.includes(u)&&state.drag?.u!==u;}
function synergyActive(u,state=S){
 if(!synergyEligible(u,state))return [];
 return SYNERGIES.filter(r=>r.targets.includes(u.type)&&state.units.some(a=>a!==u&&a.type===r.source&&synergyEligible(a,state)&&dist(a,u)<=(r.radius==='aura'?stats('B',a.lvl,a,state).range:r.radius)));
}
function synergyFactor(u,effect,state=S){return synergyActive(u,state).filter(r=>r.effect===effect).reduce((n,r)=>n*r.factor,1);}
function synergyRulesFor(type){return SYNERGIES.filter(r=>r.source===type||r.targets.includes(type));}
function synergyDraw(u,s){
 if(!synergyActive(u).length)return;
 // Small noninteractive gold marker; no HUD geometry or sprite alterations.
 ctx.save();ctx.globalAlpha=.95;
 const x=u.x+s*.5+5,y=u.y+s*.35;
 // Two linked gold rings: synergy, not an empty status tile.
 ctx.lineCap='round';ctx.lineJoin='round';
 for(const [color,width] of [['#1b2428',3.2],['#f4cf81',1.6]]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x-2,y,2.8,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x+2,y,2.8,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
}
