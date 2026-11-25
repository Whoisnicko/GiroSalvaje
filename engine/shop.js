/* Underworld's Vault — all prices and effects declared here. One of each per run. */
const SHOP_ARTIFACTS=Object.freeze({
 bloodfang:{name:'Bloodfang',icon:'⚔',price:8,kind:'Offense',desc:'All damaging monsters deal 20% more damage.'},
 boneplate:{name:'Boneplate',icon:'⛨',price:8,kind:'Defense',desc:'All monsters gain 25% maximum health.'},
 hourglass:{name:'Crypt Hourglass',icon:'⌛',price:10,kind:'Offense',desc:'Attacking monsters attack 20% more often.'},
 lens:{name:'Spectral Lens',icon:'◈',price:9,kind:'Range',desc:'Ranged monsters gain 15% attack range.'},
 altarstone:{name:'Altar Stone',icon:'✧',price:10,kind:'Altar',desc:'Altar gains 20 maximum health and restores 20 health.',apply(){S.wallMax+=20;S.wallHp=Math.min(S.wallMax,S.wallHp+20);}},
 spincharm:{name:'Fortune Charm',icon:'⟳',price:14,kind:'Economy',desc:'Gain 1 extra spin now and each future preparation phase.',apply(){S.spinsPer++;S.spinsLeft++;}}
});
const ARTIFACT_ART_ORDER=['bloodfang','boneplate','hourglass','lens','altarstone','spincharm'];
function artifactArt(id){
 const a=SHOP_ARTIFACTS[id],i=ARTIFACT_ART_ORDER.indexOf(id);
 return '<span class="artifact-thumb" style="--atlas-x:'+((i%3)*50)+'%;--atlas-y:'+Math.floor(i/3)*100+'%" aria-hidden="true"><span>'+a.icon+'</span></span>';
}
function artifactOwned(id){return Array.isArray(S?.artifacts)&&S.artifacts.includes(id);}
function artifactPrice(id){return Math.max(1,SHOP_ARTIFACTS[id].price-routeDiscount("artifact"));}
function shopAvailable(){return !!S&&S.phase==='prep'&&!spinning&&!S.drag&&!S.pendingMerge&&!menuOpen;}
function renderArtifactShelf(){
 const box=$('#artifactShelf');if(!box)return;
 const ids=(S.artifacts||[]).filter(id=>Object.hasOwn(SHOP_ARTIFACTS,id));
 box.innerHTML='<h3>Artifacts <b>'+ids.length+'/6</b></h3><div class="artifact-owned">'+(ids.length?ids.map(id=>{const a=SHOP_ARTIFACTS[id];return '<span title="'+a.desc+'">'+artifactArt(id)+'<b>'+a.name+'</b></span>';}).join(''):'<span class="artifact-empty">No artifacts yet.</span>')+'</div>';
 const available=shopAvailable();
 document.querySelectorAll('[data-act="shop"]').forEach(b=>{
  b.disabled=!available;
  const hint=b.querySelector('[data-vault-hint]');
  if(hint)hint.textContent=available?(routeDiscount('artifact')?'Vault discount · −2 souls':hint.dataset.readyCopy):S.phase==='prep'?'Preparing…':'Opens between waves';
 });
}
function scrollShopHTML(){
 if(!heroUsesMagic(S))return '';
 const entries=Object.entries(SPELL_UNLOCKS).filter(([,u])=>u.kind==='scroll').map(([id,u])=>{
  const d=magicDef(id),owned=knowledgeLearned(id),sandbox=!!S.sandbox,ok=!sandbox&&!owned&&S.gold>=u.price;
  const status=sandbox?'Sandbox · already available':owned?'Permanently learned':'Permanent spell knowledge';
  return '<article class="shop-item scroll-item"><div class="scroll-art" style="--scroll-color:'+d.color+'"><div class="scroll-paper">'+runeGlyph(d)+'</div></div><div class="shop-item-info"><h3>'+u.title+'</h3><small>'+status+'</small><p>Learn '+d.name+' across all future runs.</p></div><button class="btn shop-buy" data-act="scrollbuy" data-id="'+id+'" '+(ok?'':'disabled')+'>'+(sandbox?'TEST ACCESS':owned?'✓ LEARNED':'STEAL · ◆ '+u.price+' souls')+'</button></article>';
 }).join('');
 return '<section class="scroll-library"><header><h3>Forbidden Scrolls</h3><p>Knowledge endures beyond this run. Purchases cannot be undone.</p></header><div class="scroll-grid">'+entries+'</div><p id="scrollNotice" role="status">'+(knowledgeDirty?'Profile save pending. Paid scrolls are recoverable from your saved run.':'')+'</p></section>';
}
function showShop(purchased=false){
 if(!shopAvailable())return;
 scrollPurchasePending=null;
 const o=$('#ov2');
 const entries=Object.entries(SHOP_ARTIFACTS).map(([id,a])=>{
  const owned=artifactOwned(id),price=artifactPrice(id),ok=!owned&&S.gold>=price;
  return '<article class="shop-item relic-'+id+'"><div class="shop-art">'+artifactArt(id)+'</div><div class="shop-item-info"><h3>'+a.name+'</h3><small>'+a.kind+' · run upgrade</small><p>'+a.desc+'</p></div><button class="btn shop-buy" data-act="artifactbuy" data-id="'+id+'" '+(ok?'':'disabled')+'>'+(owned?'✓ STOLEN':'STEAL · <span aria-hidden="true">◆</span> '+price+' souls')+'</button></article>';
 }).join('');
 o.innerHTML='<div class="panel soul-shop hades-shop" role="dialog" aria-modal="true" aria-labelledby="shopTitle"><div class="hades-portrait"><div class="hades-stage" aria-hidden="true"><div class="hades-aura"></div><div class="hades-gaze"></div><div class="hades-flame"></div></div><div class="hades-caption"><strong>HADES</strong><span>Lord of the Underworld</span><p role="status" aria-live="polite">… Zzz …</p></div></div><div class="shop-content"><header class="shop-top"><div><h2 id="shopTitle">Hades Room</h2><p>Spend souls to steal relics and forbidden knowledge from Hades</p></div><span class="shop-balance">◆ '+S.gold+' souls</span></header><section class="artifact-library"><h3>Artifacts <small>· this run</small></h3><div class="shop-grid">'+entries+'</div></section>'+scrollShopHTML()+'<footer class="shop-foot"><span>Relics: this run · Scrolls: permanent · Preparation only</span><button class="go" data-act="shopclose">Return to battle</button></footer><section id="scrollConfirm" class="scroll-confirm" role="group" aria-labelledby="scrollConfirmTitle" hidden><h3 id="scrollConfirmTitle">Learn this spell?</h3><p id="scrollConfirmCopy"></p><div class="scroll-confirm-actions"><button type="button" class="btn" data-act="scrollcancel">Cancel</button><button type="button" class="go" data-act="scrollconfirm">Confirm purchase</button></div></section></div></div>';
 o.hidden=false;startHadesGaze(o.querySelector('.hades-portrait'),purchased);o.querySelector('[data-act="shopclose"]').focus();
}
function buyArtifact(id){
 if(!shopAvailable()||!Object.hasOwn(SHOP_ARTIFACTS,id)||artifactOwned(id))return false;
 const a=SHOP_ARTIFACTS[id],price=artifactPrice(id);if(S.gold<price)return false;
 prepUndoRecord('Steal '+a.name);
 S.gold-=price;(S.artifacts??=[]).push(id);
 if(a.apply)a.apply();
 if(id==='boneplate'){
  for(const u of allMine()){const hp=stats(u.type,u.lvl,u).hp,old=u.maxHp;u.maxHp=hp;u.hp=Math.min(hp,u.hp+Math.max(0,hp-old));}
 }
 S.confirmFight=false;setResult('Relic stolen',a.name+' · '+a.desc);sfx('coin');renderUI();showShop(true);return true;
}

/* Keep permanent purchases inside the game. Bind the pending request to the current run. */
let scrollPurchasePending=null;
function scrollPurchaseAllowed(id){const u=Object.hasOwn(SPELL_UNLOCKS,id)?SPELL_UNLOCKS[id]:null;return !!(S&&u&&u.kind==='scroll'&&heroUsesMagic(S)&&!S.sandbox&&shopAvailable()&&!$('#ov2').hidden&&$('#ov2 .hades-shop')&&!knowledgeLearned(id)&&S.gold>=u.price);}
function requestScrollPurchase(id){
 if(!scrollPurchaseAllowed(id))return false;
 const u=SPELL_UNLOCKS[id],panel=$('#scrollConfirm');if(!panel)return false;
 scrollPurchasePending={id,run:S};
 $('#scrollConfirmCopy').textContent='Steal '+u.title+' for '+u.price+' souls. '+magicDef(id).name+' will be permanently learned for future runs. This purchase cannot be undone.';
 panel.hidden=false;panel.querySelector('[data-act="scrollcancel"]').focus();return true;
}
function cancelScrollPurchase(refocus=true){
 const p=scrollPurchasePending;scrollPurchasePending=null;
 const panel=$('#scrollConfirm');if(panel)panel.hidden=true;
 if(refocus&&p){const b=Array.from(document.querySelectorAll('#ov2 [data-act="scrollbuy"]')).find(b=>b.dataset.id===p.id);if(b&&!b.disabled)b.focus();}return !!p;
}
function confirmScrollPurchase(){
 const p=scrollPurchasePending;if(!p)return false;
 cancelScrollPurchase(false);
 if(p.run!==S||!scrollPurchaseAllowed(p.id))return false;
 return knowledgeBuyScroll(p.id);
}
