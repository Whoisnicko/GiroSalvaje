/* Display-only outcome summary. Does not grant or alter rewards. */
function outcomePanelClass(phase){
 return phase==='win'?'outcome-panel outcome-win':phase==='over'?'outcome-panel outcome-loss':phase==='reward'?'wave-reward-panel':'';
}
function outcomeSummary(state,limit,region){
 const won=state.phase==='win',max=Math.max(1,Number.isFinite(limit)?Math.floor(limit):1);
 const completed=won?max:Math.max(0,Math.min(max,Math.floor(Number(state.wave)||1)-1));
 const hp=Number.isFinite(state.wallHp)?Math.max(0,Math.round(state.wallHp)):0;
 const wallMax=Number.isFinite(state.wallMax)?Math.max(0,Math.round(state.wallMax)):0;
 const kills=Number.isFinite(state.kills)?Math.max(0,Math.floor(state.kills)):0;
 return '<section class="outcome-summary" aria-label="Campaign results"><p class="outcome-region">'+escapeHTML(region)+' · '+(won?'VICTORY':'DEFEAT')+'</p><div class="outcome-stats"><div><small>Waves cleared</small><strong>'+completed+'/'+max+'</strong></div><div><small>Humans defeated</small><strong>'+kills+'</strong></div><div><small>Altar health</small><strong>'+hp+'/'+wallMax+'</strong></div></div></section>';
}
