/* Tactical presentation only — v20-alpha.2. */
const TAC_ROLES={W:['Tank · Melee','Intercepts humans in its patrol radius.'],A:['Ranged · Spectral','Fires spectral projectiles.'],M:['Ranged · Area damage','Fireballs damage enemies near the impact.'],N:['Support · Summoner','Raises skeletons when humans fall nearby.'],B:['Support · Aura','Empowers nearby monsters with damage and attack speed.'],L:['Melee · Temporary','Fast hunter summoned for this wave.'],K:['Melee · Temporary','Raised by a necromancer for this wave.']};
const BESTIARY_LORE={
 W:{title:'The restless sentinel',lore:'Once a watchman of the living kingdom, this guardian still remembers the gate it failed to defend. The souls beneath the altar have given its stubborn body a second duty.',tactic:'Place near the front. Its patrol radius is larger than its melee reach.'},
 A:{title:'Echo of a lost soul',lore:'A fragment of a forgotten spirit, bound to the valley by a promise that outlived its name. It has no need of a bow; its anger takes the shape of spectral bolts.',tactic:'Deploy behind sturdy guardians. Its long reach lets it attack from safety.'},
 M:{title:'Ember of the abyss',lore:'Born in the furnaces beneath the underworld, this small dragon carries a coal from the first infernal flame. Even its smallest breath can scatter a human formation.',tactic:'Fireballs damage enemies near their impact. Aim for clustered waves with its positioning.'},
 N:{title:'Keeper of the unquiet dead',lore:'The keeper of forgotten burial rites learned to hear the names of souls that refused to leave. Every fallen invader becomes a possibility rather than an ending.',tactic:'Place where humans are likely to die within its summoning radius.'},
 B:{title:'The mournful chorus',lore:'Her song is the echo of a ruined kingdom. To the living it is a warning; to the dead it is a rallying cry.',tactic:'Cover several attacking guardians with her aura; only the strongest overlapping aura applies.'},
 L:{title:'Hunter of the moonless night',lore:'An ancient curse follows this creature through the valley. The spell of Howl briefly binds its hunger to the altar.',tactic:'Temporary melee reinforcement with a wide patrol area; it does not persist beyond the wave.'},
 K:{title:'Bones in borrowed service',lore:'The bones of the defeated rise under a necromancer’s command. Their former loyalties are dust, their new duty carved into their marrow.',tactic:'Temporary melee summon; its strength depends on the necromancer and the wave.'}
};
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
function tacticalSelect(e){tacReset();S.sel=null;tacEnemy=null;tacLast=0;if(e&&tacticalAlive(e))openBestiary(e);else{tacSuppressed=true;tacticalHide();}}
function tacticalHide(){const p=$('#unitInspector');if(p)p.hidden=true;}
function tacticalClose(){if(bestiaryDialog().open){closeBestiary();return true;}if(!S)return false;tacReset();const p=$('#unitInspector');if(!S.sel&&!tacEnemy&&p.hidden)return false;S.sel=null;tacEnemy=null;tacSuppressed=true;tacticalHide();return true;}
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
  if(e.arcaneShield>0&&e.arcaneShieldTime>0&&!e.down)tags.push('Soul Barrier '+tacNum(e.arcaneShield,0)+' HP · '+tacNum(e.arcaneShieldTime)+'s');
  if(e.pile>1)tags.push('Stack '+e.pile+'/'+S.mods.mergeN);if(e.train)tags.push('Training +'+e.train*50+'% HP/ATK');if(bf)tags.push('Banshee +'+Math.round(bf*100)+'%');if(haste>1&&!support)tags.push('Dragon Roar ×2');if(e.temp)tags.push('Temporary');tags.push(e.down?'Fallen':bench?'Reserve':'Active');
  for(const id of (S.artifacts||[])){if(id==='bloodfang'&&!support||id==='boneplate'||id==='hourglass'&&!support||id==='lens'&&base.ranged)tags.push(SHOP_ARTIFACTS[id].name);}
 }
 return {enemy,name,portrait,role,note,stars,hp,max,rows,tags,combat};
}
const TAC_ICONS={sword:'M4 20l4-4m-3-5 8 8m-5-3L20 4l-1 7-8 8',clock:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18m0 4v5l4 2',target:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18m0 5a4 4 0 1 0 0 8a4 4 0 1 0 0-8',boot:'M7 3h7v10l5 3v4H4v-5l3-3Z',shield:'M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6Z',flag:'M5 21V3m0 1h13l-3 4 3 4H5',flame:'M12 21C2 20 4 12 10 6c-1 5 3 6 4-3 8 8 9 17-2 18Z',skull:'M5 13a7 7 0 1 1 14 0l-3 3v4H8v-4Zm4-2h1m4 0h1m-3 4v2',spark:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z'};
function tacIcon(k){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+TAC_ICONS[k]+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
/* The approved cyan Profane Sanctuary artwork is a static frame.
   All content is rendered from live game data; no numbers are baked into the art. */
const SANCTUARY_ART='assets/ui/sanctuary-frame-v20.webp?v=20a8';
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
 return '<div class="sanctuary-shell"><img class="sanctuary-art" src="'+SANCTUARY_ART+'" alt="" draggable="false" onload="this.parentElement.classList.add(\'sanctuary-art-loaded\')" onerror="this.hidden=true;this.parentElement.classList.remove(\'sanctuary-art-loaded\')"><div class="sanctuary-title"><strong>'+m.name+'</strong><span>'+m.stars+'</span></div><div class="sanctuary-health"><span class="sanctuary-fallback-heart" aria-hidden="true">♥</span><b>'+Math.ceil(m.hp)+' / '+Math.ceil(m.max)+'</b></div><div class="sanctuary-hp-track" role="meter" aria-label="Health" aria-valuemin="0" aria-valuemax="'+Math.ceil(m.max)+'" aria-valuenow="'+Math.ceil(Math.min(m.hp,m.max))+'"><i style="width:'+hp+'%"></i></div>'+sanctuaryStats(m).map((s,i)=>'<div class="sanctuary-stat sanctuary-stat-'+i+'" title="'+s.title+'"><span class="sanctuary-fallback-icon" aria-hidden="true">'+s.icon+'</span><span>'+s.label+'</span><b>'+s.value+'</b></div>').join('')+'</div>'+(tags.length?'<div class="sanctuary-buffs">'+tags.map(t=>'<span>'+t+'</span>').join('')+'</div>':'');
}
function tacticalHTML(m){return tacticalCompactHTML(m);}
function bestiaryDialog(){return $('#unitBestiary');}
let bestiaryEntity=null,bestiaryState=null,bestiaryPhase=null,bestiaryMarkup='';
function bestiaryHTML(e,m){
 const l=m.enemy?{title:'Invader of the living kingdom',lore:'Driven by the living kingdom’s fear of the dead, this invader marches toward the altar in the Valley of Souls.',tactic:m.note}:BESTIARY_LORE[e.type];
 const cards=sanctuaryStats(m).map(s=>'<div class="bestiary-stat"><span aria-hidden="true">'+s.icon+'</span><small>'+s.label+'</small><b>'+s.value+'</b></div>').join('');
 return '<div class="bestiary-hero"><div class="bestiary-portrait">'+tacPic(m.portrait)+'</div><div><span class="bestiary-role">'+m.role+'</span><h2 id="bestiaryTitle">'+m.name+' <em>'+m.stars+'</em></h2><p>'+l.title+'</p><div class="bestiary-vitality"><span>VITALITY</span><b>'+Math.ceil(m.hp)+' / '+Math.ceil(m.max)+'</b></div><div class="bestiary-hp"><i style="width:'+Math.max(0,Math.min(100,m.hp/m.max*100))+'%"></i></div></div></div><div class="bestiary-stats">'+cards+'</div><div class="bestiary-columns"><section><h3>Chronicle</h3><p>'+l.lore+'</p></section><section><h3>Battlecraft</h3><p>'+l.tactic+'</p><dl>'+m.rows.filter(s=>!['Attack','Attack interval','Attack reach','Reach','Armor'].includes(s.label)).map(s=>'<div><dt>'+s.label+'</dt><dd>'+s.value+'</dd></div>').join('')+'</dl></section></div><div class="bestiary-tags">'+m.tags.map(t=>'<span>'+t+'</span>').join('')+'</div>';
}
function bestiaryPosition(){
 const d=bestiaryDialog(),r=cv.getBoundingClientRect(),left=Math.max(0,r.left),right=Math.min(innerWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.top+WORLD_H*scale);
 const w=d.offsetWidth,h=d.offsetHeight;
 d.style.left=Math.max(8,Math.min(innerWidth-w-8,(left+right-w)/2))+'px';
 d.style.top=Math.max(8,Math.min(innerHeight-h-8,(top+bottom-h)/2))+'px';
}
function openBestiary(e){
 if(!S||menuOpen||!$('#ov').hidden||!$('#ov2').hidden||spinning||!['prep','fight'].includes(S.phase))return;
 const d=bestiaryDialog();bestiaryEntity=e;bestiaryState=S;bestiaryPhase=S.phase;bestiaryMarkup='';
 tacticalHide();S.aimP=null;tacSuppressed=true;updateBestiary();
 if(!d.open){d.showModal();bestiaryPosition();d.querySelector('.bestiary-close').focus({preventScroll:true});}
}
function clearBestiarySelection(){
 bestiaryEntity=null;bestiaryState=null;bestiaryPhase=null;bestiaryMarkup='';
 if(S){S.aimP=null;S.sel=null;}tacSuppressed=true;tacticalHide();
}
function closeBestiary(){
 const d=bestiaryDialog();if(d.open)d.close();clearBestiarySelection();
}
function updateBestiary(){
 if(!bestiaryEntity||bestiaryState!==S||bestiaryPhase!==S.phase||!tacticalAlive(bestiaryEntity)||menuOpen||!$('#ov').hidden||!$('#ov2').hidden){closeBestiary();return;}
 const m=tacticalModel(bestiaryEntity),html=bestiaryHTML(bestiaryEntity,m);
 if(html!==bestiaryMarkup){$('#bestiaryBody').innerHTML=html;bestiaryMarkup=html;}
 $('#bestiaryNotice').textContent=S.phase==='fight'?'Battle continues while reading.':'Preparation · inspect your army';
 // Keep the modal stationary during live stat updates; resize is handled separately.
}
function tacticalHovered(){
 if(!S||menuOpen||document.hidden||bestiaryDialog().open||!$('#ov').hidden||!$('#ov2').hidden||S.drag||S.aim!==null||tacSuppressed||!S.aimP)return null;
 return unitAt(S.aimP)||mineAt(S.aimP)||enemyAt(S.aimP);
}
// Keep the entire card above the reserve band, inside the visible battlefield.
// Prefer a side of the inspected unit; avoid covering other deployed units where possible.
function tacticalPosition(panel,e){
 const r=cv.getBoundingClientRect(),pad=6,L=Math.max(pad,r.left+pad),R=Math.min(innerWidth-pad,r.right-pad),T=Math.max(pad,r.top+pad),B=Math.min(innerHeight-pad,r.top+WORLD_H*scale-pad);
 panel.style.width='';const roomW=R-L,roomH=B-T;
 if(roomW<100||roomH<105)return false;
 // The shell aspect ratio is fixed; allow a smaller card on short screens.
 const desired=Math.min(innerWidth<=620?210:224,roomW,Math.max(90,(roomH-25)*425/392));
 panel.style.width=desired+'px';
 const w=panel.offsetWidth,h=panel.offsetHeight;if(h>roomH||w>roomW)return false;
 const x=r.left+e.x*scale,y=r.top+e.y*scale,gap=Math.max(24,(S.enemies.includes(e)?e.r:radius(e))*scale+10);
 const clampXY=(a,b)=>({x:Math.max(L,Math.min(R-w,a)),y:Math.max(T,Math.min(B-h,b))});
 const candidates=[clampXY(x+gap,y-h*.5),clampXY(x-w-gap,y-h*.5),clampXY(x-w*.5,y-h-gap),clampXY(x-w*.5,y+gap)];
 const others=[...S.units,...S.enemies].filter(o=>o!==e&&o.y<WORLD_H);
 const hit=(p,ox,oy,rad)=>ox+rad>p.x&&ox-rad<p.x+w&&oy+rad>p.y&&oy-rad<p.y+h;
 const score=p=>(hit(p,x,y,gap*.7)?1000:0)+others.reduce((n,o)=>n+(hit(p,r.left+o.x*scale,r.top+o.y*scale,12*scale)?20:0),0)+Math.hypot(p.x+w/2-x,p.y+h/2-y)*.03;
 candidates.sort((a,b)=>score(a)-score(b));const p=candidates[0];
 panel.style.left=Math.round(p.x)+'px';panel.style.top=Math.round(p.y)+'px';return true;
}
function tacticalTick(now,force=false){
 if(!S){tacticalHide();return;}tacReset();
 if(!force&&now-tacLast<100)return;tacLast=now;
 if(bestiaryDialog().open){updateBestiary();tacticalHide();return;}
 const entity=tacticalHovered();if(!entity){tacticalHide();return;}
 const panel=$('#unitInspector'),model=tacticalModel(entity),markup=tacticalHTML(model);
 if(markup!==tacMarkup){panel.querySelector('.inspect-body').innerHTML=markup;tacMarkup=markup;}
 const art=panel.querySelector('.sanctuary-art');if(art&&art.complete&&art.naturalWidth>0)art.parentElement.classList.add('sanctuary-art-loaded');
 panel.classList.add('is-compact');panel.classList.remove('is-pinned');panel.classList.toggle('is-enemy',model.enemy);panel.querySelector('.inspect-close').hidden=true;panel.hidden=false;if(!tacticalPosition(panel,entity))tacticalHide();
}
const bestiaryEl=bestiaryDialog();
// Both controls are native method=dialog submit buttons. A capture-phase handler
// also closes directly, independent of document-level gameplay click delegation.
bestiaryEl.addEventListener('click',e=>{
 const button=e.target.closest?.('.bestiary-close,.bestiary-return');
 if(button&&bestiaryEl.contains(button)){e.preventDefault();e.stopImmediatePropagation();closeBestiary();return;}
 if(e.target===bestiaryEl){const r=bestiaryEl.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){e.preventDefault();e.stopImmediatePropagation();closeBestiary();}}
},true);
bestiaryEl.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();closeBestiary();});
bestiaryEl.addEventListener('close',()=>{if(!bestiaryEl.open)clearBestiarySelection();});
bestiaryEl.addEventListener('cancel',e=>{e.preventDefault();closeBestiary();});
window.addEventListener('resize',()=>{if(bestiaryEl.open)bestiaryPosition();});
document.addEventListener('keydown',e=>{if(!bestiaryEl.open)return;if(e.key==='Escape'){e.preventDefault();closeBestiary();}else if(e.key!=='Tab'&&e.key!=='Enter'&&e.key!==' '){e.preventDefault();}e.stopImmediatePropagation();},true);
document.querySelector('#unitInspector .inspect-close').addEventListener('click',()=>tacticalClose());
// Warm the cache; the real image element determines readiness, not this preloader.
const sanctuaryImage=new Image();sanctuaryImage.src=SANCTUARY_ART;
