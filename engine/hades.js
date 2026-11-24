/* Underworld's Vault — sleeping guardian, surprise and infernal fire. */
const VAULT_ATLAS='assets/ui/hades-vault-v19.webp';
let hadesAtlasPromise=null,hadesActive=null,hadesRAF=0;
function loadHadesAtlas(){
 if(!hadesAtlasPromise)hadesAtlasPromise=new Promise(resolve=>{
  const img=new Image();img.onload=()=>resolve(img.naturalWidth===960&&img.naturalHeight===320);img.onerror=()=>resolve(false);img.src=VAULT_ATLAS;
 });
 return hadesAtlasPromise;
}
// A successful theft triggers one finite reaction. No extra gameplay penalty.
function vaultPhase(elapsed){
 if(elapsed<0||elapsed>=2300)return 'sleep';
 if(elapsed<160)return 'wake';
 if(elapsed<1050)return 'rage';
 return 'recover';
}
function stopHadesGaze(){
 if(hadesRAF)cancelAnimationFrame(hadesRAF);
 hadesRAF=0;
 if(hadesActive){hadesActive.closest('.hades-shop')?.classList.remove('vault-rage','vault-wake');}
 hadesActive=null;
}
function setVaultPhase(portrait,phase,reduced=false){
 if(portrait.dataset.vaultPhase===phase&&portrait.dataset.reduced===String(reduced))return;
 portrait.dataset.vaultPhase=phase;portrait.dataset.reduced=String(reduced);
 portrait.classList.toggle('hades-still',reduced);
 const panel=portrait.closest('.hades-shop');
 panel?.classList.toggle('vault-rage',phase==='rage');
 panel?.classList.toggle('vault-wake',phase==='wake');
 const sprite=portrait.querySelector('.hades-gaze');
 sprite.style.setProperty('--vault-x',phase==='sleep'?'0%':phase==='rage'?'100%':'50%');
 const quote=portrait.querySelector('.hades-caption p');
 if(quote)quote.textContent=({sleep:'… Zzz …',wake:'Huh?!',rage:'WHAAAAT?!',recover:'YOU LITTLE THIEF…'})[phase];
}
function startHadesGaze(portrait,purchased=false){
 stopHadesGaze();if(!portrait)return;
 hadesActive=portrait;const start=performance.now();
 loadHadesAtlas().then(ok=>{if(ok&&hadesActive===portrait&&portrait.isConnected&&!portrait.closest('[hidden]'))portrait.classList.add('gaze-ready','vault-art-ready');});
 function tick(now){
  if(hadesActive!==portrait||!portrait.isConnected||portrait.closest('[hidden]')||portrait.closest('[inert]')){if(hadesActive===portrait)stopHadesGaze();return;}
  const reduced=!!(prefs.reduced||motionPreference.matches);
  setVaultPhase(portrait,vaultPhase(purchased?now-start:-1),reduced);
  hadesRAF=requestAnimationFrame(tick);
 }
 tick(start);
}
