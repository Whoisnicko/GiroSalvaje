/* Static presentation using the existing Warlord combat renderer and rune definitions. */
function uiArtChampionPreview(){
 const canvas=document.getElementById('uiWarlordPreview');
 if(!canvas||canvas.dataset.ready==='true')return false;
 try{
  const c=canvas.getContext('2d');if(!c)return false;
  c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
  c.save();c.scale(1.75,1.75);heroDraw({x:44,y:48,facing:1,hp:300},0,0,false,c,true);c.restore();
  canvas.dataset.ready='true';canvas.hidden=false;const fallback=document.getElementById('uiWarlordFallback');if(fallback)fallback.hidden=true;
  return true;
 }catch(e){return false;}
}
function uiArtRune(d){
 const points=d.points||[];return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="'+points.map((p,i)=>(i?'L':'M')+Math.round(p[0]*100)+' '+Math.round(p[1]*100)).join(' ')+(d.closed?'Z':'')+'" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function uiArtRunes(){
 const el=document.getElementById('uiSorcererRunes');if(!el||el.dataset.ready==='true')return false;
 if(typeof RUNE_DEFS==='undefined'||RUNE_DEFS.length!==6)return false;
 el.innerHTML=RUNE_DEFS.map(d=>'<span class="ui-rune-tile" style="--rune-color:'+escapeHTML(d.color)+'" title="'+escapeHTML(d.name)+'">'+uiArtRune(d)+'</span>').join('');
 el.dataset.ready='true';el.hidden=false;return true;
}
function uiArtOpen(panel){if(panel==='heroSelectView'){uiArtChampionPreview();uiArtRunes();}}
function uiArtCard(id,c){
 const art=typeof GOTHIC_DATA!=='undefined'?GOTHIC_DATA.cards?.[id]:null;
 const symbol=escapeHTML(c.ic||'◆');
 return '<span class="ui-collection-art"><span aria-hidden="true">'+symbol+'</span>'+(art?'<img src="'+escapeHTML(art)+'" alt="" loading="lazy" decoding="async" onload="this.previousElementSibling.hidden=true" onerror="this.hidden=true">':'')+'</span>';
}
