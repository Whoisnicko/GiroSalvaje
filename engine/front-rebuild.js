/* v7.61: presentation-only front layout, no gameplay writes. */
(function(){
 const view=document.getElementById('campaignMapView'),stage=document.getElementById('cm61-stage'),world=document.getElementById('cm61-world');
 const art=new Image();art.onload=()=>document.documentElement.classList.add('g61-assets-ready');art.onerror=()=>document.documentElement.classList.remove('g61-assets-ready');art.src='assets/ui/gothic-controls-v61.webp?v=22a7p61';
 const homeAtlas=new Image();homeAtlas.onload=()=>document.documentElement.classList.add('g63-assets-ready');homeAtlas.onerror=()=>document.documentElement.classList.remove('g63-assets-ready');homeAtlas.src='assets/ui/gothic-controls-wide-v63.webp?v=22a7p63';
 if(!view||!stage||!world)return;
 // New art is loaded only when campaign opens. Keep the complete v62 fallback until both images decode.
 let campaignArtRequested=false;
 const loadCampaignArt=()=>{
  if(view.hidden||campaignArtRequested)return;
  campaignArtRequested=true;
  const load=path=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=path;});
  Promise.all([load('assets/ui/region-plaques-v64.webp?v=22a7p64'),load('assets/ui/map-mask-repair-v64.webp?v=22a7p64')]).then(()=>document.documentElement.classList.add('g64-campaign-art-ready')).catch(()=>document.documentElement.classList.remove('g64-campaign-art-ready'));
 };
 new MutationObserver(loadCampaignArt).observe(view,{attributes:true,attributeFilter:['hidden']});loadCampaignArt();
 const mq=matchMedia('(max-width:1000px)'),controls=Array.from(view.querySelectorAll('[data-cm-pane]'));
 function fit(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;const k=Math.min(w/926,h/746);world.style.width=(926*k)+'px';world.style.height=(746*k)+'px';}
 function pane(key){if(!['map','detail','menu'].includes(key))return;view.dataset.cmPane=key;controls.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cmPane===key)));requestAnimationFrame(fit);}
 pane('map');view.addEventListener('click',e=>{const tab=e.target.closest('button[data-cm-pane]');if(tab){pane(tab.dataset.cmPane);return;}if(mq.matches&&e.target.closest('[data-cm-region]')){pane('detail');controls.find(b=>b.dataset.cmPane==='detail')?.focus({preventScroll:true});}});
 new MutationObserver(()=>{if(!view.hidden)pane('map');}).observe(view,{attributes:true,attributeFilter:['hidden']});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(fit).observe(stage);
 window.addEventListener('resize',fit);requestAnimationFrame(fit);
})();
