/* Soul Shop — all prices and effects declared here. One of each per run. */
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
function shopAvailable(){return !!S&&S.phase==='prep'&&!spinning&&!S.drag&&!S.pendingMerge&&!menuOpen;}
function renderArtifactShelf(){
 const box=$('#artifactShelf');if(!box)return;
 const ids=(S.artifacts||[]).filter(id=>Object.hasOwn(SHOP_ARTIFACTS,id));
 box.innerHTML='<h3>Artifacts <b>'+ids.length+'/6</b></h3><div class="artifact-owned">'+(ids.length?ids.map(id=>{const a=SHOP_ARTIFACTS[id];return '<span title="'+a.desc+'">'+artifactArt(id)+'<b>'+a.name+'</b></span>';}).join(''):'<span class="artifact-empty">No artifacts yet.</span>')+'</div><button class="btn shop-entry" data-act="shop" '+(shopAvailable()?'':'disabled')+'>⚒ Soul Shop</button>';
 document.querySelectorAll('[data-act="shop"]').forEach(b=>b.disabled=!shopAvailable());
}
function showShop(purchased=false){
 if(!shopAvailable())return;
 const o=$('#ov2');
 const entries=Object.entries(SHOP_ARTIFACTS).map(([id,a])=>{
  const owned=artifactOwned(id),ok=!owned&&S.gold>=a.price;
  return '<article class="shop-item relic-'+id+'"><div class="shop-art">'+artifactArt(id)+'</div><div class="shop-item-info"><h3>'+a.name+'</h3><small>'+a.kind+' · run upgrade</small><p>'+a.desc+'</p></div><button class="btn shop-buy" data-act="artifactbuy" data-id="'+id+'" '+(ok?'':'disabled')+'>'+(owned?'✓ OWNED':'<span aria-hidden="true">◆</span> '+a.price+' souls')+'</button></article>';
 }).join('');
 o.innerHTML='<div class="panel soul-shop hades-shop" role="dialog" aria-modal="true" aria-labelledby="shopTitle"><div class="hades-portrait"><div class="hades-stage" aria-hidden="true"><div class="hades-aura"></div><div class="hades-gaze"></div><div class="hades-flame"></div></div><div class="hades-caption"><strong>HADES</strong><span>Lord of the Underworld</span><p>“Power has a price, guardian.”</p></div></div><div class="shop-content"><header class="shop-top"><div><h2 id="shopTitle">Soul Shop</h2><p>Relics from the Underworld · one of each per run</p></div><span class="shop-balance">◆ '+S.gold+' souls</span></header><div class="shop-grid">'+entries+'</div><footer class="shop-foot"><span>Permanent upgrades · Preparation only</span><button class="go" data-act="shopclose">Return to battle</button></footer></div></div>';
 o.hidden=false;startHadesGaze(o.querySelector('.hades-portrait'),purchased);o.querySelector('[data-act="shopclose"]').focus();
}
function buyArtifact(id){
 if(!shopAvailable()||!Object.hasOwn(SHOP_ARTIFACTS,id)||artifactOwned(id))return false;
 const a=SHOP_ARTIFACTS[id];if(S.gold<a.price)return false;
 S.gold-=a.price;(S.artifacts??=[]).push(id);
 if(a.apply)a.apply();
 if(id==='boneplate'){
  for(const u of allMine()){const hp=stats(u.type,u.lvl,u).hp,old=u.maxHp;u.maxHp=hp;u.hp=Math.min(hp,u.hp+Math.max(0,hp-old));}
 }
 S.confirmFight=false;setResult('Artifact purchased',a.name+' · '+a.desc);sfx('coin');renderUI();showShop(true);return true;
}
