/* Campaign compact layout navigation. Presentation only. */
(function(){
 const view=document.getElementById('campaignMapView');if(!view)return;
 const mq=matchMedia('(max-width:1000px)');
 const controls=Array.from(view.querySelectorAll('[data-cm-pane]'));
 function pane(key){if(!['map','detail','menu'].includes(key))return;view.dataset.cmPane=key;controls.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cmPane===key)));}
 pane('map');
 view.addEventListener('click',e=>{const tab=e.target.closest('button[data-cm-pane]');if(tab){pane(tab.dataset.cmPane);return;}if(mq.matches&&e.target.closest('[data-cm-region]')){pane('detail');controls.find(b=>b.dataset.cmPane==='detail')?.focus({preventScroll:true});}});
 new MutationObserver(()=>{if(!view.hidden)pane('map');}).observe(view,{attributes:true,attributeFilter:['hidden']});
})();
