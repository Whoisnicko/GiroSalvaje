/* Tactical presentation only — v20-alpha.2. */
const TAC_ROLES={W:['Tank · Melee','Intercepts humans in its patrol radius.'],A:['Ranged · Spectral','Fires spectral projectiles.'],M:['Ranged · Area damage','Fireballs damage enemies near the impact.'],N:['Support · Summoner','Raises skeletons when humans fall nearby.'],B:['Support · Aura','Empowers nearby monsters with damage and attack speed.'],L:['Melee · Temporary','Fast hunter summoned for this wave.'],K:['Melee · Temporary','Raised by a necromancer for this wave.']};
let tacState=null,tacEnemy=null,tacSuppressed=false,tacLast=0,tacMarkup='',waveMarkup='',waveDetailMarkup='',waveState=null;
function tacReset(){if(tacState!==S){tacState=S;tacEnemy=null;tacSuppressed=false;tacLast=0;tacMarkup='';}}
function tacNum(n,d=1){return Number.isFinite(n)?String(Math.round(n*10**d)/10**d):'—';}
function tacPic(n){return URL_[n]?'<img src="'+URL_[n]+'" alt="" onerror="this.hidden=true">':'';}
function tacticalWave(){
 if(!S)return;
 const details=$('#waveDetails'),banner=$('#banner'),box=$('#waveBox');
 if(waveState!==S){waveState=S;waveMarkup='';waveDetailMarkup='';details.open=false;}
 const fight=S.phase==='fight',prep=S.phase==='prep'||S.phase==='reward';
 details.hidden=!fight&&!prep;if(details.hidden)return;
 const src=fight?[...S.queue,...S.enemies.filter(e=>e.hp>0)]:(S.nextQueue||[]),groups={};
 for(const e of src)(groups[e.kind]??=[]).push(e);
 const order=['com','sol','cab','bal','cle','jin','ant'].filter(k=>groups[k]),total=src.length,initial=S.curQueue?.length||total;
 const html='<span class="wave-heading"><span class="wave-emblem">⚔</span><span><small>'+(fight?'BATTLE IN PROGRESS':'INCOMING INVASION')+'</small><strong>'+(fight?'Wave ':'Next wave ')+Math.min(S.wave,MAX_WAVE)+' <i>/ '+MAX_WAVE+'</i></strong></span></span><span class="wave-count"><b>'+total+'</b><small>'+(fight?'humans remaining':'humans incoming')+'</small></span><span class="wave-types">'+order.map(k=>'<span class="wave-type'+(k==='com'?' commander':'')+'" title="'+KIND[k].n+' ×'+groups[k].length+'">'+tacPic(KIND[k].spr)+'<b>×'+groups[k].length+'</b><span class="sr-tactical">'+KIND[k].n+'</span></span>').join('')+'</span>'+(fight?'<span class="wave-progress" title="Wave progress"><i style="width:'+Math.max(0,Math.min(100,100*(initial-total)/Math.max(1,initial)))+'%"></i></span>':'')+'<span class="wave-detail-label">Enemy details</span>';
 if(html!==waveMarkup){banner.innerHTML=html;waveMarkup=html;}
 const content=order.map(k=>{const es=groups[k],v=es[0],mean=es.reduce((sum,e)=>sum+e.sp,0)/es.length;return '<article class="wave-enemy">'+tacPic(KIND[k].spr)+'<div><strong>'+KIND[k].n+' ×'+es.length+'</strong><small>HP '+tacNum(v.maxHp??v.hp,0)+' · ATK '+tacNum(v.dmg)+' · SPD '+tacNum(mean,0)+(v.armor?' · ARM '+v.armor:'')+'</small><p>'+FOE_NOTE[k]+'</p></div></article>';}).join('')||'<p>No humans remaining.</p>';
 if(content!==waveDetailMarkup){box.innerHTML=content;waveDetailMarkup=content;}
}
function tacticalAlive(e){return !!e&&(S.units.includes(e)||S.bench.includes(e)||S.enemies.includes(e));}
function tacticalEnemySelected(e){return tacState===S&&tacEnemy===e;}
function tacticalClearEnemy(){tacReset();tacEnemy=null;}
function tacticalAllowHover(){tacReset();tacSuppressed=false;}
function tacticalSelect(e){tacReset();const old=tacEnemy||S.sel;S.sel=null;tacEnemy=null;if(e&&old!==e){if(S.enemies.includes(e))tacEnemy=e;else S.sel=e;tacSuppressed=false;}else tacSuppressed=true;tacLast=0;}
function tacticalHide(){const p=$('#unitInspector');if(p)p.hidden=true;}
function tacticalClose(){if(!S)return false;tacReset();const p=$('#unitInspector');if(!S.sel&&!tacEnemy&&p.hidden)return false;S.sel=null;tacEnemy=null;tacSuppressed=true;tacticalHide();return true;}
function tacticalModel(e){
 const enemy=S.enemies.includes(e),rows=[],tags=[],add=(icon,label,value)=>rows.push({icon,label,value:String(value)});
 const hp=Math.max(0,e.hp),max=Math.max(1,e.maxHp??e.hp);
 let name,portrait,role,note,stars='',combat;
 if(enemy){
  const k=KIND[e.kind],cleric=e.kind==='cle',arson=e.kind==='ant',ranged=e.kind==='bal';
  name=k.n;portrait=k.spr;role=e.boss?'Boss · Human':cleric?'Support · Human':ranged?'Ranged · Human':arson?'Siege · Human':'Melee · Human';note=FOE_NOTE[e.kind]||'Human invader.';
  if(cleric)note+=' Heals '+tacNum(5+S.wave*1.5)+' HP every 2.5s while supporting.';
  add('sword','Attack',tacNum(e.dmg));add('clock','Attack interval',cleric?'1s melee / 2.5s heal':ranged?'1.6 s':'1 s');add('target','Reach',ranged?tacNum(e.range,0)+' px':cleric?'100 px heal':'Contact');
  const rate=ranged?1/1.6:1;combat={damage:e.dmg,attackRate:rate,dps:e.dmg*rate,range:ranged?e.range:cleric?100:'Melee',armor:e.armor||0};
  const sp=e.sp*(S.buff.slow>0?.4:1)*(S.charge?1.5:1);add('boot','Move speed',tacNum(e.root>0?0:sp,0)+' px/s');add('shield','Armor',tacNum(e.armor||0));
  if(arson)add('flame','Altar damage',tacNum(e.dmg*3));if(e.root>0)tags.push('Rooted '+tacNum(e.root)+'s');if(S.buff.slow>0)tags.push('Mist');if(S.charge)tags.push('Final charge');if(e.boss)tags.push('Commander');tags.push('Invader');
 }else{
  const base=BASE[e.type],st=stats(e.type,e.lvl,e),bf=bansheeOn(e),bench=S.bench.includes(e),support=!!base.support;
  name=NAMES[e.type];portrait=USPR[e.type];[role,note]=TAC_ROLES[e.type];stars=e.temp?'':'★'.repeat(e.lvl);
  const haste=S.phase==='fight'&&S.buff.haste>0?2:1,atk=st.dmg*(1+bf),interval=st.cd/((1+bf)*haste);
  combat={damage:support?null:atk,attackRate:support?null:1/interval,dps:support?null:atk/interval,range:st.range,armor:null};
  add('sword','Attack',support?'—':tacNum(atk));add('clock',support?'Ability interval':'Attack interval',tacNum(support?st.cd:interval,2)+' s');add('target',support?'Ability radius':'Attack reach',tacNum(st.range,0)+' px');
  add('boot','Move speed',base.move?tacNum(base.move,0)+' px/s':'Stationary');add('shield','Armor','0');
  if(base.guard)add('flag','Patrol radius',tacNum(guardOf(e),0)+' px');if(st.splash)add('flame','Blast radius',tacNum(st.splash,0)+' px');
  if(e.type==='N')add('skull','Skeletons raised',(e.skels||0)+' / '+skelCap(e.lvl));if(e.type==='B')add('spark','Aura bonus','+'+Math.round(bansheeBuff(e.lvl)*100)+'%');
  if(e.pile>1)tags.push('Stack '+e.pile+'/'+S.mods.mergeN);if(e.train)tags.push('Training +'+e.train*50+'% HP/ATK');if(bf)tags.push('Banshee +'+Math.round(bf*100)+'%');if(haste>1&&!support)tags.push('Dragon Roar ×2');if(e.temp)tags.push('Temporary');tags.push(e.down?'Fallen':bench?'Reserve':'Active');
  for(const id of (S.artifacts||[])){if(id==='bloodfang'&&!support||id==='boneplate'||id==='hourglass'&&!support||id==='lens'&&base.ranged)tags.push(SHOP_ARTIFACTS[id].name);}
 }
 return {enemy,name,portrait,role,note,stars,hp,max,rows,tags,combat};
}
const TAC_ICONS={sword:'M4 20l4-4m-3-5 8 8m-5-3L20 4l-1 7-8 8',clock:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18m0 4v5l4 2',target:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18m0 5a4 4 0 1 0 0 8a4 4 0 1 0 0-8',boot:'M7 3h7v10l5 3v4H4v-5l3-3Z',shield:'M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6Z',flag:'M5 21V3m0 1h13l-3 4 3 4H5',flame:'M12 21C2 20 4 12 10 6c-1 5 3 6 4-3 8 8 9 17-2 18Z',skull:'M5 13a7 7 0 1 1 14 0l-3 3v4H8v-4Zm4-2h1m4 0h1m-3 4v2',spark:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z'};
function tacIcon(k){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+TAC_ICONS[k]+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
/* The approved cyan Profane Sanctuary artwork is a static frame.
   All content is rendered from live game data; no numbers are baked into the art. */
const SANCTUARY_ART='assets/ui/sanctuary-frame-v20.webp';
function sanctuaryStats(m){
 const v=m.combat,fmt=(n,d=1)=>n===null||n===undefined?'—':typeof n==='string'?n:tacNum(n,d);
 return [
 {label:'ATK',value:fmt(v.damage),icon:'⚔',title:'Effective attack damage'},
 {label:'ATK/s',value:fmt(v.attackRate,2),icon:'⌛',title:'Attacks per second'},
 {label:'DPS',value:fmt(v.dps),icon:'ϟ',title:'Theoretical damage per second before enemy armor'},
 {label:'RNG',value:fmt(v.range,0),icon:'◎',title:'Attack or ability range'},
 {label:'ARM',value:fmt(v.armor,0),icon:'⛨',title:'Armor (not implemented for monsters)'}
 ];
}
function tacticalCompactHTML(m){
 const tags=m.tags.filter(t=>/^(Fallen|Temporary|Reserve|Rooted|Banshee|Training|Dragon Roar|Commander|Mist|Final charge)/.test(t)).slice(0,2);
 const hp=Math.max(0,Math.min(100,m.hp/m.max*100));
 return '<div class="sanctuary-shell"><div class="sanctuary-title"><strong>'+m.name+'</strong><span>'+m.stars+'</span></div><div class="sanctuary-health"><span class="sanctuary-fallback-heart" aria-hidden="true">♥</span><b>'+Math.ceil(m.hp)+' / '+Math.ceil(m.max)+'</b></div><div class="sanctuary-hp-track" role="meter" aria-label="Health" aria-valuemin="0" aria-valuemax="'+Math.ceil(m.max)+'" aria-valuenow="'+Math.ceil(Math.min(m.hp,m.max))+'"><i style="width:'+hp+'%"></i></div>'+sanctuaryStats(m).map((s,i)=>'<div class="sanctuary-stat sanctuary-stat-'+i+'" title="'+s.title+'"><span class="sanctuary-fallback-icon" aria-hidden="true">'+s.icon+'</span><span>'+s.label+'</span><b>'+s.value+'</b></div>').join('')+'</div>'+(tags.length?'<div class="sanctuary-buffs">'+tags.map(t=>'<span>'+t+'</span>').join('')+'</div>':'');
}
// Both inspection modes use the identical artwork and live stat markup.
function tacticalHTML(m,pinned){return tacticalCompactHTML(m);}
let tacPinnedEntity=null,tacPinnedState=null,tacPinnedSide=null;
function tacticalPosition(panel,e,pinned){
 const rect=cv.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight,margin=10,x=rect.left+e.x*scale,y=rect.top+e.y*scale;
 // Choose the pinned side once per selection; a moving unit cannot make the card jump.
 if(!pinned){tacPinnedEntity=null;tacPinnedSide=null;}
 else if(tacPinnedEntity!==e||tacPinnedState!==S){tacPinnedEntity=e;tacPinnedState=S;tacPinnedSide=x>rect.left+rect.width/2?'left':'right';}
 const gap=24;const left=pinned?(tacPinnedSide==='left'?rect.left+12:rect.right-w-12):(x+w+gap<=innerWidth-margin?x+gap:x-w-gap);
 const top=pinned?Math.max(margin,rect.top+12):y-h*.55;
 panel.style.left=Math.round(Math.max(margin,Math.min(innerWidth-w-margin,left)))+'px';panel.style.top=Math.round(Math.max(margin,Math.min(innerHeight-h-margin,top)))+'px';
}
function tacticalTick(now,force=false){
 if(!S){tacticalHide();return;}tacReset();
 if(menuOpen||document.hidden||!$('#ov').hidden||!$('#ov2').hidden||S.drag||S.aim!==null){tacticalHide();return;}
 if(!force&&now-tacLast<100)return;tacLast=now;
 if(tacEnemy&&!tacticalAlive(tacEnemy))tacEnemy=null;if(S.sel&&!tacticalAlive(S.sel))S.sel=null;
 const pinned=tacEnemy||S.sel,p=S.aimP,hover=!tacSuppressed&&p?(unitAt(p)||mineAt(p)||enemyAt(p)):null,entity=pinned||hover;
 if(!entity){tacticalHide();return;}
 const panel=$('#unitInspector'),model=tacticalModel(entity),markup=tacticalHTML(model,!!pinned);
 if(markup!==tacMarkup){panel.querySelector('.inspect-body').innerHTML=markup;tacMarkup=markup;}
 panel.classList.add('is-compact');panel.classList.toggle('is-pinned',!!pinned);panel.classList.toggle('is-enemy',model.enemy);panel.querySelector('.inspect-close').hidden=!pinned;panel.hidden=false;tacticalPosition(panel,entity,!!pinned);
}
document.querySelector('#unitInspector .inspect-close').addEventListener('click',()=>tacticalClose());
// Preload once. The fallback is readable immediately, including if the asset fails.
const sanctuaryImage=new Image();
sanctuaryImage.onload=()=>{if(sanctuaryImage.naturalWidth===425&&sanctuaryImage.naturalHeight===392)document.querySelector('#unitInspector').classList.add('sanctuary-frame-ready');};
sanctuaryImage.src=SANCTUARY_ART;
