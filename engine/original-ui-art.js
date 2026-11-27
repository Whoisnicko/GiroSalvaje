/* Only enhance after the exact original sheets are decoded. Native labels and styles remain the fallback. */
(function(){
 const root=document.documentElement;
 const load=(path,cls)=>{
  const img=new Image();
  img.onload=()=>{root.classList.add(cls);};
  img.onerror=()=>{root.classList.remove(cls);};
  img.src=path;
 };
 load('assets/ui/gothic-buttons-original-v58.png','original-buttons-ready');
 // Campaign art is requested only when the campaign view first becomes visible.
 const panel=document.getElementById('campaignMapView');
 if(!panel)return;
 let requested=false;
 const check=()=>{if(!panel.hidden&&!requested){requested=true;load('assets/ui/mastery-medals-original-v58.png','original-medals-ready');observer.disconnect();}};
 const observer=new MutationObserver(check);
 observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
 check();
})();
