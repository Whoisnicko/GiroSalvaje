/* Presentation-only combat status helpers. No writes to gameplay state. */
function battleMeterPercent(value,max){
 return Number.isFinite(value)&&Number.isFinite(max)&&max>0?Math.round(Math.max(0,Math.min(1,value/max))*1000)/10:0;
}
function battleMeterAttrs(value,max,label){
 const validMax=Number.isFinite(max)&&max>0?max:1,n=Number.isFinite(value)?Math.max(0,Math.min(validMax,value)):0;
 return 'role="meter" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="'+validMax+'" aria-valuenow="'+n+'" style="--battle-fill:'+battleMeterPercent(value,max)+'%"';
}
function battleSummonCaption(state,isSpinning){
 if(isSpinning)return 'Summoning…';
 if(state.phase!=='prep')return 'Summoning locked during battle';
 return (state.spinsLeft>0?'Pull to summon':'Buy a spin')+' · '+state.held.size+'/'+state.holdsMax+' held';
}
function battleCellLabel(key,index,state){
 return SYM[key].n+(state.held.has(index)?', held':'')+(state.wins.has(index)?', winning line':'');
}
function battleCardState(extra){
 const classes=String(extra||'').split(/\s+/);
 return classes.includes('used')?'used':classes.includes('aim')?'aim':classes.includes('later')?'later':'ready';
}
function battleArtHTML(src,symbol){
 const fallback='<span class="battle-art-fallback" aria-hidden="true">'+escapeHTML(symbol||'◆')+'</span>';
 return fallback+(src?'<img src="'+escapeHTML(src)+'" alt="" decoding="async" onload="this.previousElementSibling.hidden=true" onerror="this.hidden=true">':'');
}
