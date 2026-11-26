/* Regional starting relics: one choice per run; persistent unlock receipts. */
const REGIONAL_RELICS=Object.freeze([
 Object.freeze({id:'fallenHeart',region:'valley',n:'Heart of the Fallen',ic:'♥',regionalArt:0,d:'Once per battle, the first fallen permanent guardian revives at 40% HP.'}),
 Object.freeze({id:'huntersFang',region:'forest',n:"Hunter's Fang",ic:'✦',regionalArt:1,d:'Guardian attacks deal 30% extra damage to enemies below 25% HP.'}),
 Object.freeze({id:'eternalFrost',region:'frozen',n:'Eternal Frost',ic:'❄',regionalArt:2,d:'Every 15 s, slow all humans by 30% for 3 s.'}),
 Object.freeze({id:'emberCrown',region:'ashen',n:'Crown of Embers',ic:'♨',regionalArt:3,d:'Each permanent guardian’s first fall per battle deals 20% of its max HP as area damage within 55 px.'}),
 Object.freeze({id:'fallenHalo',region:'cathedral',n:'The Fallen Halo',ic:'◉',regionalArt:4,d:'Once per battle, at or below 30% Altar HP, living guardians gain 50% damage and attack rate for 8 s.'})
]);
const regionalRelicArt=(r)=>GOTHIC_DATA.regionalRelics?.[r.regionalArt]||null;
function regionalRelicAvailable(r,state=S){return !!r&&!r.disabled&&(!r.id||state?.sandbox||campaignProfileInit().regionalRewards?.includes(r.region));}
function regionalRelicSync(state=null){if(state?.sandbox)return false;const p=campaignProfileInit(),won=new Set(p.regionalRewards||[]);for(const row of scores()){if(row?.won===true&&[5,10].includes(row.maxWaves)&&row.wave===row.maxWaves&&REGIONAL_RELICS.some(r=>r.region===row.biomeId)&& (row.maxWaves===5||row.biomeId==='valley'))won.add(row.biomeId);}if(state?.phase==='win'&&state.wave===campaignLimit(state)+1)won.add(biomeId(state));const next=[...won];return next.every(id=>p.regionalRewards?.includes(id))||campaignProfileCommit({...p,regionalRewards:next});}
function regionalRelicGrant(region){if(!S||S.sandbox||!REGIONAL_RELICS.some(r=>r.region===region))return false;const p=campaignProfileInit();if(p.regionalRewards?.includes(region))return true;return campaignProfileCommit({...p,regionalRewards:[...(p.regionalRewards||[]),region]});}
function relicIs(id,state=S){return state?.phase==='fight'&&state.relic?.id===id;}
function relicResetBattle(){S.relicHeartUsed=false;S.relicFrostNext=15;S.relicFrostUntil=0;S.relicHaloUsed=false;S.relicHaloUntil=0;for(const u of [...(S.units||[]),...(S.bench||[]).filter(Boolean)]){delete u.relicEmberUsed;delete u.relicHaloMarked;}}
function relicAdvance(){if(relicIs('eternalFrost')&&S.fightT>=(S.relicFrostNext||15)){S.relicFrostNext=(Math.floor(S.fightT/15)+1)*15;S.relicFrostUntil=S.fightT+3;bigMsg('ETERNAL FROST · HUMAN SLOW');sfx('horn');}relicCheckHalo();}
function relicSlowFactor(state=S){return relicIs('eternalFrost',state)&&state.relicFrostUntil>state.fightT?.7:1;}
function relicCheckHalo(){if(!relicIs('fallenHalo')||S.relicHaloUsed||S.wallHp<=0||S.wallHp>S.wallMax*.3)return;S.relicHaloUsed=true;S.relicHaloUntil=S.fightT+8;for(const u of S.units){if(!u.down&&u.hp>0)u.relicHaloMarked=true;}bigMsg('FALLEN HALO · LAST STAND');sfx('horn');}
function relicGuardianFactor(u,state=S){return relicIs('fallenHalo',state)&&u?.relicHaloMarked&&state.relicHaloUntil>state.fightT?1.5:1;}
function relicFangFactor(e,o,state=S){return relicIs('huntersFang',state)&&o.source?.type&&e.hp>0&&e.hp<e.maxHp*.25?1.3:1;}
function relicOnFall(u){if(u.temp||u.down||u.hp>0)return false;
 if(relicIs('fallenHeart')&&!S.relicHeartUsed){S.relicHeartUsed=true;u.hp=u.maxHp*.4;u.flash=.15;S.fx.push({k:'ring',x:u.x,y:u.y,r:36,c:'leaf',t:.7,T:.7});floatText(u.x,u.y-25,'Heart of the Fallen','leaf',11);sfx('raise');return true;}
 if(relicIs('emberCrown')&&!u.relicEmberUsed){u.relicEmberUsed=true;const r=55;for(const e of S.enemies)if(e.hp>0&&Math.hypot(e.x-u.x,e.y-u.y)<=r)damage(e,u.maxHp*.2,{pierce:true});S.fx.push({k:'ring',x:u.x,y:u.y,r,c:'m',t:.6,T:.6});burst(u.x,u.y,'m',12,90);sfx('boom');}return false;
}
function relicTreasuryOpen(){regionalRelicSync(loadedSave?.state);const p=campaignProfileInit();const count=REGIONAL_RELICS.filter(r=>p.regionalRewards?.includes(r.region)).length;$('#treasuryCount').textContent=count+' / 5 legendary relics unlocked';$('#treasuryGrid').innerHTML=REGIONAL_RELICS.map(r=>{const unlocked=p.regionalRewards?.includes(r.region);return '<article class="treasury-item '+(unlocked?'unlocked':'locked')+'"><div class="treasury-art">'+relicArt(r)+'</div><small>'+BIOME_DATA[r.region].name+'</small><h3>'+r.n+'</h3><p>'+r.d+'</p><strong class="treasury-state">'+(unlocked?'◆ Unlocked':'◇ Defeat the regional boss')+'</strong></article>';}).join('');front('treasuryView');}
