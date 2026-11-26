/* Interactive campaign presentation. Campaign profile remains authoritative. */
const CAMPAIGN_MAP=Object.freeze([
 Object.freeze({id:'valley',roman:'I',x:19.058,y:78.912,w:27.711,h:12.381,color:'#d5b87a',image:'assets/battlefield-full-v19.webp',lore:'Ancient ruins guard the first altar. Hold the valley against the human invasion.'}),
 Object.freeze({id:'forest',roman:'II',x:64.184,y:67.347,w:29.463,h:13.605,color:'#91c590',image:'assets/battlefield-forest-v39.webp',lore:'Twisted woodland hides scouts, rangers and the Grand Huntsman. Use terrain to your advantage.'}),
 Object.freeze({id:'frozen',roman:'III',x:7.996,y:42.993,w:31.435,h:12.517,color:'#a6d7ff',image:'assets/battlefield-frozen-v38.webp',lore:'Frozen fortresses and relentless blizzards test your army’s positioning.'}),
 Object.freeze({id:'ashen',roman:'IV',x:62.87,y:33.605,w:29.792,h:12.925,color:'#f4a05e',image:'assets/battlefield-ashen-v43.webp',lore:'Cross a kingdom consumed by fire, where burning ground threatens both armies.'}),
 Object.freeze({id:'cathedral',roman:'V',x:31.325,y:13.197,w:31.982,h:12.517,color:'#d3a4fa',image:'assets/battlefield-cathedral-v44.webp',lore:'The final stronghold of the human church. Face the High Exorcist and his divine ascension.'})
]);
let campaignMapSelected=null;
function campaignMapModel(profile,records){
 const conquered=new Set(profile.regionalRewards||[]);
 return CAMPAIGN_MAP.map((d,i)=>{
  const unlocked=i===0||profile[['','forestUnlocked','frozenUnlocked','ashenUnlocked','cathedralUnlocked'][i]]===true;
  const list=records.filter(r=>r&&r.maxWaves===5&&(r.biomeId===d.id||(d.id==='valley'&&!r.biomeId))&&Number.isFinite(r.score));
  return {...d,def:BIOME_DATA[d.id],conquered:conquered.has(d.id),unlocked,status:conquered.has(d.id)?'conquered':unlocked?'available':'locked',best:list.length?Math.max(...list.map(r=>r.score)):null,previous:i?CAMPAIGN_MAP[i-1].id:null};
 });
}
function campaignMapData(){return campaignMapModel(campaignProfileInit(),scores());}
function campaignMapDefault(rows){return rows.find(r=>r.unlocked&&!r.conquered)?.id||rows.filter(r=>r.unlocked).at(-1)?.id||'valley';}
function campaignMapCanStart(id,rows=campaignMapData()){return rows.some(r=>r.id===id&&r.unlocked)&&biomeUnlocked(id);}
function campaignMapPortrait(e){const key=enemySprite(e),src=URL_[key];return src?'<img src="'+src+'" alt="">':'<span class="cm-portrait-fallback" aria-hidden="true">⚔</span>';}
function campaignMapRender(){
 const rows=campaignMapData(),selected=rows.find(r=>r.id===campaignMapSelected)||rows[0],count=rows.filter(r=>r.conquered).length;
 campaignMapSelected=selected.id;
 $('#cmNodes').innerHTML=rows.map(d=>'<button type="button" class="cm-node '+d.status+(d.id===selected.id?' selected':'')+'" data-cm-region="'+d.id+'" aria-pressed="'+(d.id===selected.id)+'" aria-label="'+d.def.name+' — '+d.status+'" style="--nx:'+d.x+'%;--ny:'+d.y+'%;--nw:'+d.w+'%;--nh:'+d.h+'%;--accent:'+d.color+'"><span class="cm-rank">'+d.roman+'</span><span class="cm-node-name">'+d.def.name+'</span><span class="cm-node-status" aria-hidden="true">'+(d.conquered?'✓':d.unlocked?'◆':'🔒')+'</span></button>').join('');
 $('#cmProgressText').textContent=count+' / 5 Regions Conquered';$('#cmProgressPct').textContent=count*20+'%';$('#cmProgressFill').style.width=count*20+'%';$('#cmProgress').setAttribute('aria-valuenow',count);
 const d=selected,b=BOSS_DATA[d.def.bossId],relic=REGIONAL_RELICS.find(r=>r.region===d.id),enemies=Object.entries(REGIONAL_ENEMIES).filter(([id,e])=>e.region===d.id).map(([id])=>id),roster=enemies.length?enemies:['sol','bal','cab'];
 $('#cmDetail').style.setProperty('--accent',d.color);
 $('#cmDetail').innerHTML='<div class="cm-detail-title"><span class="cm-rank">'+d.roman+'</span><div><h2>'+d.def.name+'</h2><small>'+(d.id==='cathedral'?'Final Region':'Region '+d.roman)+' · '+(d.conquered?'Conquered':d.unlocked?'Available':'Locked')+'</small></div></div>'+
 '<div class="cm-region-preview" style="--preview:url('+d.image+')" role="img" aria-label="'+d.def.name+' battlefield"></div><p class="cm-lore">'+d.lore+'</p><p class="cm-terrain">'+d.def.modifier+'</p>'+
 '<h3 class="cm-section-title">'+(enemies.length?'Regional enemies':'Human forces')+'</h3><div class="cm-roster">'+roster.map(kind=>'<div><div class="cm-portrait">'+campaignMapPortrait({kind})+'</div><span>'+KIND[kind].n+'</span></div>').join('')+'</div>'+
 '<h3 class="cm-section-title">Regional boss</h3><div class="cm-boss"><div class="cm-portrait">'+campaignMapPortrait({kind:b.kind,bossId:b.id})+'</div><div><strong>'+b.name+'</strong><span>'+b.ability+'</span>'+(b.ascension?'<span>Phase II · Divine Ascension</span>':'')+'</div></div>'+
 '<h3 class="cm-section-title">Regional reward</h3><div class="cm-reward"><div class="cm-relic">'+relicArt(relic)+'</div><div><strong>'+relic.n+'</strong><p>'+relic.d+'</p><small>'+ (d.conquered?'Unlocked':'Reward on conquest')+'</small></div></div>'+
 '<div class="cm-record"><span>Personal best · 5 waves</span><b>'+(d.best===null?'—':d.best.toLocaleString('en-US'))+'</b></div>'+
 '<button class="btn cm-start" type="button" data-front="campaign-start" '+(!d.unlocked?'disabled':'')+'>'+(d.conquered?'Revisit Region':d.unlocked?'Enter Region':'Region Locked')+'</button>'+
 (!d.unlocked?'<p class="cm-lock-note">Conquer '+BIOME_DATA[d.previous].name+' to unlock.</p>':'')+
 '<button type="button" class="btn cm-score" data-front="campaign-scores">View regional scores</button>';
}
function campaignMapOpen(reset=false){regionalRelicSync(loadedSave?.state);const rows=campaignMapData();if(reset||!rows.some(r=>r.id===campaignMapSelected))campaignMapSelected=campaignMapDefault(rows);campaignMapRender();front('campaignMapView');}
function campaignMapSelect(id){if(!CAMPAIGN_MAP.some(r=>r.id===id))return;campaignMapSelected=id;campaignMapRender();$('#cmNodes').querySelector('[data-cm-region="'+id+'"]')?.focus({preventScroll:true});}
function campaignMapStart(){const id=campaignMapSelected;if(!campaignMapCanStart(id))return;$('#campaignLength').value='5';$('#campaignRegion').value=id;biomeMenu();$('#cmChosenRegion').textContent=BIOME_DATA[id].name;$('#nameError').textContent='';$('#playerName').value=profile.name;front('newGameView');$('#playerName').focus();}
function campaignMapScores(){if(!CAMPAIGN_MAP.some(r=>r.id===campaignMapSelected))return;$('#scoreLength').value=campaignMapSelected==='valley'?'5':campaignMapSelected;showScores();}
function campaignMapInit(){$('#cmNodes').addEventListener('click',ev=>{const b=ev.target.closest('[data-cm-region]');if(b)campaignMapSelect(b.dataset.cmRegion);});}
