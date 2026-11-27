/* Responsive view controls only. No state, currency or combat mutations. */
(function(){
 const wrap=document.querySelector('.wrap'),nav=wrap?.querySelector('.hud-pane-nav');
 if(!wrap||!nav)return;
 const media=matchMedia('(max-width:1099px), (max-height:649px)');
 const panes={altar:wrap.querySelector('.cabinet'),cards:wrap.querySelector('.command-dock'),intel:wrap.querySelector('.command-intel')};
 function choose(key){
  if(!Object.hasOwn(panes,key)||wrap.dataset.hudPane===key)return;
  wrap.dataset.hudPane=key;
  nav.querySelectorAll('[data-hud-pane]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hudPane===key)));
 }
 function sync(){wrap.classList.toggle('hud-small',media.matches);nav.hidden=!media.matches;if(!wrap.dataset.hudPane)choose('altar');}
 nav.addEventListener('click',ev=>{const b=ev.target.closest('button[data-hud-pane]');if(b)choose(b.dataset.hudPane);});
 window.revealHudPane=function(el){if(!media.matches||!el)return;for(const [key,pane] of Object.entries(panes)){if(pane?.contains(el)){choose(key);break;}}};
 if(media.addEventListener)media.addEventListener('change',sync);else media.addListener(sync);
 sync();
})();
