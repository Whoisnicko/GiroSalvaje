/* Permanent martial doctrine; a single, immutable build per campaign. */
const TALENT_KEY='gs22.warlordTalents',TALENT_MILESTONES=Object.freeze([1,2,3,4,5,6,7,8,10]);
const TALENT_BRANCHES=Object.freeze({
 berserker:{name:'Berserker',color:'#e38373',nodes:[{name:'Cruel Edge',desc:'+20% basic and Cleave damage'},{name:'Bloodlust',desc:'+2 rage per basic hit'},{name:'Crimson Tempest',desc:'+40% Bloodstorm damage per pulse'}]},
 juggernaut:{name:'Juggernaut',color:'#a7c8df',nodes:[{name:"Death's Challenge",desc:'+20% maximum health; F taunts nearby enemies for 4s (bosses 2s)'},{name:'Retaliation',desc:'15% counterattack chance; +5 points per failed eligible hit, up to 65%; 24 area damage'},{name:'Iron Skin',desc:'G reduces incoming damage by 60% for 5s'}]},
 commander:{name:'Commander',color:'#e7c27f',nodes:[{name:'Rallying Banner',desc:'+30% War Cry radius'},{name:'Unyielding Legion',desc:'+2s War Cry duration'},{name:'Lord of the Horde',desc:'War Cry +35% damage and +30% attack rate in total'}]}
});
const talentInt=(v,max)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
function talentEarned(best){return TALENT_MILESTONES.filter(w=>w<=best).length;}
function talentNormalize(v){
 const best=talentInt(v?.best,10),ranks={},budget=talentEarned(best);let spent=0;
 for(const id of Object.keys(TALENT_BRANCHES)){ranks[id]=Math.min(talentInt(v?.ranks?.[id],3),budget-spent);spent+=ranks[id];}
 return {version:1,best,ranks};
}
let talentProfile=null,talentDirty=false,talentMode='library',talentPending={branch:'none',rank:0};
function talentRead(){try{return talentNormalize(JSON.parse(localStorage.getItem(TALENT_KEY)));}catch{return talentNormalize(null);}}
function talentInit(){if(!talentProfile)talentProfile=talentRead();return talentProfile;}
function talentPoints(p=talentInit()){return talentEarned(p.best)-Object.values(p.ranks).reduce((a,b)=>a+b,0);}
function talentMerge(a,b){
 const next={version:1,best:Math.max(a.best,b.best),ranks:{...a.ranks}};
 // Keep local purchased nodes on conflicting backups, import other nodes only within earned budget.
 let spare=talentPoints(talentNormalize(next));
 for(const id of Object.keys(TALENT_BRANCHES)){const add=Math.min(spare,Math.max(0,b.ranks[id]-next.ranks[id]));next.ranks[id]+=add;spare-=add;}
 return talentNormalize(next);
}
function talentFlush(){const p=talentMerge(talentInit(),talentRead());talentProfile=p;try{localStorage.setItem(TALENT_KEY,JSON.stringify(p));talentDirty=false;return true;}catch{talentDirty=true;return false;}}
function talentRecord(completed){
 const p=talentInit(),best=talentInt(completed,10);if(best<=p.best)return 0;
 const before=talentEarned(p.best);p.best=best;talentDirty=true;talentFlush();return talentEarned(best)-before;
}
function talentWave(done){return S&&!S.sandbox&&heroClass(S).id==='warlord'&&S.phase==='fight'&&S.wave===done?talentRecord(done):0;}
function talentFromSave(v,backup=false){
 if(!validSave(v))return;
 if(heroClass(v.state).id==='warlord')talentRecord(Math.max(0,Math.min(10,v.state.wave-1)));
 if(backup&&v.warlordTalents){talentProfile=talentMerge(talentInit(),talentNormalize(v.warlordTalents));talentDirty=true;talentFlush();}
}
function talentFromScores(){for(const row of scores())if(row.heroClass==='warlord')talentRecord(Number(row.wave));}
function talentBuild(raw){const branch=Object.hasOwn(TALENT_BRANCHES,raw?.branch)?raw.branch:'none';const rank=branch==='none'?0:talentInt(raw.rank,3);return rank?{branch,rank}:{branch:'none',rank:0};}
function talentHas(h,id,rank){return h?.build?.branch===id&&h.build.rank>=rank;}
function talentHeroStats(h){
 const d={...HERO_CLASSES.warlord};
 if(talentHas(h,'berserker',1))d.damage=Math.round(d.damage*1.2);
 if(talentHas(h,'juggernaut',1))d.maxHp=Math.round(d.maxHp*1.2);
 d.maxHp=Math.round(d.maxHp*classHealthFactor(h?.wave));d.damage=classDamage(d.damage,h?.wave);d.descentDamage=classDamage(d.descentDamage,h?.wave);
 return d;
}
function talentSkill(id,h=S?.hero){
 const d={...MARTIAL_SKILLS[id]};
 if(id==='cleave'&&talentHas(h,'berserker',1))d.damage=Math.round(d.damage*1.2);
 if(id==='storm'&&talentHas(h,'berserker',3))d.damage*=1.4;
 if(id==='cry'&&talentHas(h,'juggernaut',1))return {...JUGGERNAUT_RULES.taunt,key:'F',code:'KeyF'};
 if(Number.isFinite(d.damage))d.damage=classDamage(d.damage,h?.wave);
 if(id==='cry'){if(talentHas(h,'commander',1))d.radius*=1.3;if(talentHas(h,'commander',2))d.duration+=2;if(talentHas(h,'commander',3)){d.damageBonus+=.1;d.speedBonus+=.1;}}
 return d;
}
function talentBuy(id){
 if(!menuOpen||talentMode==='sandbox'||!Object.hasOwn(TALENT_BRANCHES,id))return false;
 const p=talentMerge(talentRead(),talentInit());talentProfile=p;
 if(p.ranks[id]>=3||talentPoints(p)<1)return false;
 const n=p.ranks[id];const next=talentNormalize({...p,ranks:{...p.ranks,[id]:n+1}});
 try{localStorage.setItem(TALENT_KEY,JSON.stringify(next));talentProfile=next;talentDirty=false;return true;}catch{return false;}
}
function talentOpen(mode='library'){
 talentMode=mode;talentPending={branch:'none',rank:0};talentInit();talentRender();front('talentView');
}
function talentRender(){
 const p=talentInit(),test=talentMode==='sandbox',select=talentMode!=='library',el=id=>document.getElementById(id);
 el('talentTitle').textContent=test?'Warlord Lab · choose doctrine':select?'Choose your doctrine':'Path of the Warlord';
 el('talentIntro').textContent=test?'All nine talents available for testing. Choose any rank; no permanent progression.':'Earn one Valor Point on first reaching waves 1–8 and 10 as Warlord. Learn talents permanently; choose one branch for each new run.';
 el('talentWallet').textContent=test?'Sandbox · unlimited test access':talentPoints(p)+' Valor Points · Best completed wave '+p.best+'/10'+(talentDirty?' · Save pending':'');
 el('talentTree').innerHTML=Object.entries(TALENT_BRANCHES).map(([id,d])=>{
  const rank=p.ranks[id],available=test?3:rank;
  const nodes=d.nodes.map((n,i)=>{const tier=i+1,owned=tier<=available,canBuy=!test&&tier===rank+1&&talentPoints(p)>0;
   return '<div class="talent-node '+(owned?'owned':'')+'"><span class="talent-rank">0'+tier+'</span><div><b>'+n.name+'</b><small>'+n.desc+'</small></div>'+(canBuy?'<button type="button" class="btn" data-talent-buy="'+id+'">LEARN · 1 VP</button>':'<span class="talent-state">'+(owned?'LEARNED':'SEALED')+'</span>')+'</div>';}).join('');
  return '<section class="talent-branch" style="--branch-color:'+d.color+'"><h3>'+d.name+'</h3>'+nodes+(select?'<div class="talent-equip">'+(test?[1,2,3]:available?[available]:[]).map(n=>'<button type="button" class="btn '+(talentPending.branch===id&&talentPending.rank===n?'chosen':'')+'" data-talent-pick="'+id+'" data-rank="'+n+'">Rank '+n+'</button>').join('')+(available?'':'<small>Learn a talent to equip this path.</small>')+'</div>':'')+'</section>';
 }).join('');
 el('talentSelectActions').hidden=!select;el('talentNone').classList.toggle('chosen',talentPending.branch==='none');el('talentSelected').textContent=talentPending.branch==='none'?'No doctrine · base Warlord':TALENT_BRANCHES[talentPending.branch].name+' · Rank '+talentPending.rank;
}
function talentPick(branch,rank){
 if(talentMode==='library')return false;
 const b=talentBuild({branch,rank});if(b.rank>(talentMode==='sandbox'?3:talentInit().ranks[b.branch]||0))return false;talentPending=b;talentRender();return true;
}
function talentProceed(){
 if(!menuOpen||document.getElementById('talentView').hidden||talentMode==='library')return false;
 if(talentMode==='sandbox'){sandboxEnter('warlord',talentPending);return true;}
 const rank=talentInit().ranks[talentPending.branch]||0;talentPending=talentBuild({...talentPending,rank:Math.min(rank,talentPending.rank)});
 if(validSave(loadedSave)){document.getElementById('confirmHeroName').textContent='The Warlord'+(talentPending.rank?' · '+TALENT_BRANCHES[talentPending.branch].name+' '+talentPending.rank:'');front('confirmView');return true;}
 launchNew('warlord',talentPending);return true;
}
function talentInitUI(){
 document.getElementById('talentMenu').addEventListener('click',()=>talentOpen('library'));
 document.getElementById('talentTree').addEventListener('click',e=>{const b=e.target.closest('[data-talent-buy],[data-talent-pick]');if(!b)return;if(b.dataset.talentBuy){const ok=talentBuy(b.dataset.talentBuy);talentRender();document.getElementById('talentStatus').textContent=ok?'Talent learned permanently. Available for your next Warlord campaign.':'Could not learn talent. Check points and browser storage.';}else talentPick(b.dataset.talentPick,Number(b.dataset.rank));});
 document.getElementById('talentNone').addEventListener('click',()=>talentPick('none',0));document.getElementById('talentProceed').addEventListener('click',talentProceed);
}
