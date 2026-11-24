/* Run-local hero identity. Combat behavior arrives in a later phase. */
const HERO_CLASSES=Object.freeze({
 sorcerer:Object.freeze({id:'sorcerer',name:'The Sorcerer',resource:'Mana',maxResource:100,magic:true,combatReady:true}),
 warlord:Object.freeze({id:'warlord',name:'The Warlord',resource:'Rage',maxResource:100,maxHp:300,damage:18,attackInterval:.8,range:32,moveSpeed:100,magic:false,combatReady:false})
});
function heroClassId(id){return Object.hasOwn(HERO_CLASSES,id)?id:'sorcerer';}
function heroClass(state){return HERO_CLASSES[heroClassId(state?.hero?.classId)];}
function heroUsesMagic(state){return !!state&&heroClass(state).magic;}
function heroNew(id){return {version:1,classId:heroClassId(id),status:'throne'};}
function heroNormalize(state){return heroNew(state?.hero?.classId);}
function heroResetWave(){if(S)S.hero=heroNew(heroClass(S).id);}
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
 document.getElementById('heroHudStatus').textContent='On the throne · Combat controls coming in v22-alpha.2';
}
