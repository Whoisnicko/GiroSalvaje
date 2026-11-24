/* Soul Shop — all prices and effects declared here. One of each per run. */
const SHOP_ARTIFACTS=Object.freeze({
 bloodfang:{name:'Bloodfang',icon:'⚔',price:8,kind:'Offense',desc:'All damaging monsters deal 20% more damage.'},
 boneplate:{name:'Boneplate',icon:'⛨',price:8,kind:'Defense',desc:'All monsters gain 25% maximum health.'},
 hourglass:{name:'Crypt Hourglass',icon:'⌛',price:10,kind:'Offense',desc:'Attacking monsters attack 20% more often.'},
 lens:{name:'Spectral Lens',icon:'◈',price:9,kind:'Range',desc:'Ranged monsters gain 15% attack range.'},
 altarstone:{name:'Altar Stone',icon:'✧',price:10,kind:'Altar',desc:'Altar gains 20 maximum health and restores 20 health.',apply(){S.wallMax+=20;S.wallHp=Math.min(S.wallMax,S.wallHp+20);}},
 spincharm:{name:'Fortune Charm',icon:'⟳',price:14,kind:'Economy',desc:'Gain 1 extra spin now and each future preparation phase.',apply(){S.spinsPer++;S.spinsLeft++;}}
});
function artifactOwned(id){return Array.isArray(S?.artifacts)&&S.artifacts.includes(id);}
function shopAvailable(){return !!S&&S.phase==='prep'&&!spinning&&!S.drag&&!S.pendingMerge&&!menuOpen;}
function renderArtifactShelf(){
 const box=$('#artifactShelf');if(!box)return;
 const ids=(S.artifacts||[]).filter(id=>Object.hasOwn(SHOP_ARTIFACTS,id));
 box.innerHTML='<h3>Artifacts <b>'+ids.length+'/6</b></h3><div class="artifact-owned">'+(ids.length?ids.map(id=>{const a=SHOP_ARTIFACTS[id];return '<span title="'+a.desc+'"><i>'+a.icon+'</i><b>'+a.name+'</b></span>';}).join(''):'<span class="artifact-empty">No artifacts yet.</span>')+'</div><button class="btn shop-entry" data-act="shop" '+(shopAvailable()?'':'disabled')+'>⚒ Soul Shop</button>';
 document.querySelectorAll('[data-act="shop"]').forEach(b=>b.disabled=!shopAvailable());
}
function showShop(){
 if(!shopAvailable())return;
 const o=$('#ov2');
 o.innerHTML='<div class="panel soul-shop" role="dialog" aria-modal="true" aria-labelledby="shopTitle"><div class="shop-top"><div><h2 id="shopTitle">Soul Shop</h2><p>Permanent upgrades for this run. One of each.</p></div><span class="shop-balance">◆ '+S.gold+' souls</span></div><div class="shop-grid">'+Object.entries(SHOP_ARTIFACTS).map(([id,a])=>{const owned=artifactOwned(id),ok=!owned&&S.gold>=a.price;return '<article class="shop-item"><div class="shop-art">'+a.icon+'</div><div class="shop-item-info"><small>'+a.kind+'</small><h3>'+a.name+'</h3><p>'+a.desc+'</p></div><button class="btn shop-buy" data-act="artifactbuy" data-id="'+id+'" '+(ok?'':'disabled')+'>'+(owned?'OWNED':'◆ '+a.price+' souls')+'</button></article>';}).join('')+'</div><button class="go" data-act="shopclose">Return to battle</button></div>';
 o.hidden=false;o.querySelector('[data-act="shopclose"]').focus();
}
function buyArtifact(id){
 if(!shopAvailable()||!Object.hasOwn(SHOP_ARTIFACTS,id)||artifactOwned(id))return false;
 const a=SHOP_ARTIFACTS[id];if(S.gold<a.price)return false;
 S.gold-=a.price;(S.artifacts??=[]).push(id);
 if(a.apply)a.apply();
 if(id==='boneplate'){
  for(const u of allMine()){const hp=stats(u.type,u.lvl,u).hp,old=u.maxHp;u.maxHp=hp;u.hp=Math.min(hp,u.hp+Math.max(0,hp-old));}
 }
 S.confirmFight=false;setResult('Artifact purchased',a.name+' · '+a.desc);sfx('coin');renderUI();showShop();return true;
}
