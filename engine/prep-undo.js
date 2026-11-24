/* Preparation history — deterministic actions only; no RNG rewinds or combat rollback. */
const PREP_UNDO_LIMIT=10;
const PREP_UNDO_FIELDS=['units','bench','gold','maxUnits','slotBuys','spinsLeft','spinsPer','bought','artifacts','wallHp','wallMax','hand','confirmFight'];
let prepUndoState=null,prepUndoWave=null,prepUndoStack=[];
function prepUndoSync(){
 if(prepUndoState!==S||prepUndoWave!==S?.wave||S?.phase!=='prep'){prepUndoState=S;prepUndoWave=S?.wave;prepUndoStack=[];}
}
function prepUndoClear(){prepUndoSync();prepUndoStack=[];renderPrepUndo();}
function prepUndoClone(value){return JSON.parse(JSON.stringify(value));}
function prepUndoRecord(label,drag=null){
 prepUndoSync();if(!S||S.phase!=='prep'||spinning)return false;
 const data={};for(const key of PREP_UNDO_FIELDS)data[key]=prepUndoClone(S[key]);
 data.held=[...S.held];
 // Dragged coordinates are already updated by pointermove; capture the actual original position.
 if(drag){const i=S.units.indexOf(drag.u),j=S.bench.indexOf(drag.u),copy=i>=0?data.units[i]:j>=0?data.bench[j]:null;if(!copy)return false;copy.x=drag.ox;copy.y=drag.oy;}
 prepUndoStack.push({label,data});
 if(prepUndoStack.length>PREP_UNDO_LIMIT)prepUndoStack.shift();
 return true;
}
function prepUndoAvailable(){
 prepUndoSync();return !!(S&&S.phase==='prep'&&!spinning&&!S.drag&&!S.pendingMerge&&!menuOpen&&$('#ov').hidden&&$('#ov2').hidden&&prepUndoStack.length);
}
function renderPrepUndo(){
 prepUndoSync();const bar=$('#prepUndoBar'),btn=$('#undoBtn'),status=$('#undoStatus');
 if(!bar||!btn||!status)return;
 bar.hidden=!S||S.phase!=='prep';
 btn.disabled=!prepUndoAvailable();
 const last=prepUndoStack[prepUndoStack.length-1];
 status.textContent=last?'Last: '+last.label+' · '+prepUndoStack.length+' available':'No actions to undo.';
 btn.title=last?'Undo: '+last.label:'Undo moves, sales, merges and deterministic purchases during preparation.';
}
function prepUndo(){
 if(!prepUndoAvailable())return false;
 const entry=prepUndoStack.pop(),data=entry.data;
 for(const key of PREP_UNDO_FIELDS)S[key]=data[key];
 S.held=new Set(data.held);S.sel=null;S.aim=null;S.aimP=null;S.drag=null;S.pendingMerge=null;
 tacticalClearEnemy();tacticalHide();S.fx=[];S.parts=[];S.floats=[];S.shake=0;
 document.querySelectorAll('#lane .bigmsg').forEach(el=>el.remove());
 setResult('Action undone',entry.label+' reversed.');
 renderUI();persist();sfx('place');return true;
}
