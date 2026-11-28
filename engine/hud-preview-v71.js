/* Preview only: F8 toggles paint. No state writes. */
(function(){
 const root=document.documentElement;
 const params=new URLSearchParams(location.search);
 root.classList.toggle('hud71',params.get('hud')!=='original');
 window.addEventListener('keydown',function(e){
  if(e.code!=='F8'||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;
  e.preventDefault();root.classList.toggle('hud71');
 },true);
})();