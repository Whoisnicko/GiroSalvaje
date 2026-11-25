/* Seeded campaign map. Versioned route rewards; legacy map geometry is preserved. */
const Journey = (()=>{
 const types=Object.freeze([
  {id:'vault',name:'Hades Vault',icon:'vault',color:'#e8bd73',hint:'Merchant outpost · future shop stop'},
  {id:'crypt',name:'Ancient Crypt',icon:'crypt',color:'#c0a5e8',hint:'Burial grounds · future recruitment'},
  {id:'shrine',name:'Soul Shrine',icon:'shrine',color:'#79dbed',hint:'Soul sanctuary · future resource event'},
  {id:'forge',name:'Forgotten Forge',icon:'forge',color:'#f0a17c',hint:'Infernal workshop · future upgrades'},
  {id:'sanctuary',name:'Ashen Sanctuary',icon:'sanctuary',color:'#9bcba6',hint:'Quiet refuge · future recovery'}
 ]);
 function random(seed){let n=seed>>>0;return ()=>{n=(n+0x6D2B79F5)>>>0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
 function generate(seed){const rand=random(seed);return Array.from({length:9},(_,i)=>{const a=Math.floor(rand()*types.length),b=(a+1+Math.floor(rand()*(types.length-1)))%types.length;return [a,b].map((j,k)=>({...types[j],id:`w${i+1}-${k?'r':'l'}`,wave:i+1,side:k}));});}
 function normalizeRoute(raw){const rows=new Map();for(const id of Array.isArray(raw)?raw:[]){const m=typeof id==='string'&&/^w([1-9])-[lr]$/.exec(id);if(m&&!rows.has(+m[1]))rows.set(+m[1],id);}return [...rows.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1]);}
 const options=(seed,done)=>generate(seed)[done-1]||[];
 return Object.freeze({generate,normalizeRoute,options});
})();
// Economy v1 applies only to new campaigns. Older runs keep their original stipend.
const ROUTE_REWARDS=Object.freeze({
 vault:Object.freeze({souls:3,artifactDiscount:2}),
 crypt:Object.freeze({souls:0,recruit:true,overflow:3}),
 shrine:Object.freeze({souls:6}),
 forge:Object.freeze({souls:3,infusionDiscount:2}),
 sanctuary:Object.freeze({souls:3,heal:15})
});
const ROUTE_RECRUITS=Object.freeze(['W','A','M','N','B']);
function routeEconomyActive(){return !!S&&!S.sandbox&&S.campaign?.routeEconomy===1;}
function routeRecruit(n){return ROUTE_RECRUITS[((S.campaign.seed>>>0)+n.wave*7+n.side*3)%ROUTE_RECRUITS.length];}
function routeDiscount(kind){if(!routeEconomyActive()||S.phase!=='prep')return 0;const n=journeySelected();return n?(ROUTE_REWARDS[n.icon][kind+'Discount']||0):0;}
function routeRewardText(n){
 if(!routeEconomyActive())return 'Legacy destination · no additional reward';
 const d=ROUTE_REWARDS[n.icon];
 if(d.recruit)return 'Recruit '+NAMES[routeRecruit(n)]+' ★ free · '+d.overflow+' souls if no space';
 if(d.heal)return '+'+d.souls+' souls · restore up to '+d.heal+' Altar HP ('+Math.max(0,Math.min(d.heal,S.wallMax-S.wallHp))+' now)';
 if(d.artifactDiscount)return '+'+d.souls+' souls · −'+d.artifactDiscount+' souls per artifact this preparation';
 if(d.infusionDiscount)return '+'+d.souls+' souls · −'+d.infusionDiscount+' souls per infusion this preparation';
 return '+'+d.souls+' souls';
}
function routeApply(n){
 if(!routeEconomyActive())return '';
 const d=ROUTE_REWARDS[n.icon];S.gold+=d.souls;
 if(d.recruit){const type=routeRecruit(n),u=makeUnit(type,1);if(fieldCount()<S.maxUnits&&placeNew(u))return NAMES[type]+' ★ recruited to field.';if(toBench(u))return NAMES[type]+' ★ recruited to reserve.';S.gold+=d.overflow;return '+'+d.overflow+' souls · no room for guardian.';}
 if(d.heal){const heal=Math.max(0,Math.min(d.heal,S.wallMax-S.wallHp));S.wallHp+=heal;return '+'+d.souls+' souls · +'+heal+' Altar HP.';}
 return routeRewardText(n);
}
const journeyDone=()=>S.wave-1;
const journeyOptions=()=>Journey.options(S.campaign.seed,journeyDone());
const journeySelected=()=>journeyOptions().find(n=>S.campaign.route.includes(n.id));
let journeyAnimation=null;
const journeyIcons={vault:'M-11 10V-3L0-12 11-3V10ZM-5 10V2H5V10',crypt:'M-12 10H12M-9 10V-1Q-9-12 0-12Q9-12 9-1V10M0-7V5M-4-3H4',shrine:'M0-13L9 0 0 13-9 0ZM0-13V13M-9 0H9',forge:'M-13-8H8L13-3H4L1 4V9H8V12H-8V9H-1V4L-5-3H-13Z',sanctuary:'M0-13V13M-11-4L0 5 11-4M-7-10L0-3 7-10'};
function journeyIcon(n,x,y){return `<g transform="translate(${x} ${y})" fill="none" stroke="${n.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${journeyIcons[n.icon]}"/></g>`;}
function journeyMap(animate=false){
 const done=journeyDone(),m=S.campaign,selected=journeySelected(),rows=Journey.generate(m.seed),bx=w=>48+(w-1)*112,by=126,ny=k=>k?207:45;
 let paths='',nodes='',battle='';
 for(let w=1;w<=10;w++){
  const x=bx(w),past=w<=done,boss=w%5===0;
  battle+=`<g class="${past?'j-past':w===done+1?'j-next':'j-future'}"><circle cx="${x}" cy="${by}" r="${boss?20:16}"/><text x="${x}" y="${by+4}" class="j-num">${boss?'♛':w}</text><text x="${x}" y="${by+34}" class="j-label">${boss?'BOSS '+w:'WAVE '+w}</text></g>`;
  if(w===10)break;
  for(const n of rows[w-1]){const nx=x+56,y=ny(n.side),chosen=m.route.includes(n.id),available=w===done&&!selected,cls=chosen?'j-chosen':available?'j-available':w<done?'j-past-path':'j-future';
   paths+=`<path class="${cls}" d="M${x} ${by} Q${x+29} ${by},${nx} ${y} Q${x+83} ${by},${x+112} ${by}"/>`;
   nodes+=`<g class="${cls}"><circle cx="${nx}" cy="${y}" r="20" style="--node-color:${n.color}"/>${journeyIcon(n,nx,y)}${chosen?`<text x="${nx}" y="${y+34}" class="j-check">✓</text>`:''}</g>`;
  }
 }
 const x=selected?bx(done)+56:bx(done),y=selected?ny(selected.side):by;
 const marker=`<g transform="translate(${x} ${y})"><g class="j-carriage ${animate?'j-travel':''}" style="--dx:${bx(done)-x}px;--dy:${by-y}px"><circle r="24" fill="#102a31" stroke="#a6ecff" stroke-width="2"/><path d="M-17 7H17L13 13H-13Z" fill="#a58a57" stroke="#ffe1a1"/><circle cx="-10" cy="15" r="4" fill="#151b22" stroke="#d6b77d"/><circle cx="10" cy="15" r="4" fill="#151b22" stroke="#d6b77d"/><path d="M0-20L10-6 0 8-10-6Z" fill="#70dbf5" stroke="#e5fbff" stroke-width="1.4"/><path d="M0-20V8M-10-6H10" stroke="#e5fbff" opacity=".6"/></g></g>`;
 const contents=`<rect width="1104" height="252" rx="8" fill="#101923"/><path d="M0 104L36 72 62 90 98 54 145 89 188 44 241 84 286 64 345 101 405 65 460 91 512 44 562 92 628 62 681 86 735 42 785 82 834 50 898 89 948 62 1004 95 1060 56 1104 86V0H0Z" fill="#202b32" opacity=".6"/><path d="M0 221L52 184 115 219 180 187 248 230 310 190 390 226 463 185 540 217 610 182 698 223 760 186 833 220 909 182 980 220 1040 185 1104 218V252H0Z" fill="#24312d" opacity=".55"/>${paths}${nodes}${battle}${marker}`;
 const focusedX=Math.min(1104-340,Math.max(0,bx(done)-112));
 return `<svg class="j-map-wide" viewBox="0 0 1104 252" role="img" aria-label="Campaign route, ${done} of 10 waves completed">${contents}</svg><svg class="j-map-focus" viewBox="${focusedX} 0 340 252" role="img" aria-label="Current route and next battle">${contents}</svg>`;
}
function journeyShow(animate=false){
 if(!S||S.sandbox||S.phase!=='journey')return;
 clearTimeout(journeyAnimation);const selected=journeySelected(),done=journeyDone();
 const cards=journeyOptions().map((n,i)=>`<button type="button" class="j-choice" style="--node-color:${n.color}" data-journey-choose="${n.id}"><span class="j-choice-icon"><svg viewBox="-18 -18 36 36" aria-hidden="true">${journeyIcon(n,0,0)}</svg></span><span><small>ROUTE ${i?'II':'I'}</small><strong>${n.name}</strong><span>${routeRewardText(n)}</span></span><span aria-hidden="true">›</span></button>`).join('');
 showOv(`<section class="journey-screen" aria-labelledby="journeyTitle"><div class="j-heading"><div><small>CAMPAIGN · THE UNDERWORLD JOURNEY</small><h2 id="journeyTitle">${selected?'Arrival at '+selected.name:'Choose your path'}</h2><p>${selected?'The altar has reached its destination. Prepare for the next invasion.':`Wave ${done} survived · guide your altar to the next destination.`}</p></div><div class="j-progress"><b>${done} / 10</b><small>WAVES CLEARED</small><div><i style="width:${done*10}%"></i></div></div></div><div class="j-map">${journeyMap(animate)}</div><div class="j-legend"><span><i class="j-dot done"></i> Cleared</span><span><i class="j-dot available"></i> Route</span><span><i class="j-dot next"></i> Next battle</span><span>♛ Commander</span></div>${selected?`<div class="j-arrival"><b style="color:${selected.color}">${selected.name}</b><p>${routeRewardText(selected)}. ${routeEconomyActive()?"Reward is granted when you prepare the next wave.":"Legacy campaign · no additional reward."}</p><button type="button" id="journeyContinue" class="j-primary" data-journey-next ${animate?'disabled':''}>Prepare wave ${S.wave} →</button></div>`:`<div class="j-choices">${cards}</div>`}<div class="j-footer"><span>${routeEconomyActive()?"Choose carefully: destination benefits replace the usual +3 souls. Blessings and Hades access remain unchanged.":"Legacy campaign · original rewards and Hades Room access remain unchanged."}</span><button type="button" class="j-menu" data-front="home">Save &amp; menu</button></div><p id="journeyNotice" role="status"></p></section>`);
 $('#ov').querySelector('.panel').classList.add('journey-panel');tutorialHide();
 if(animate){const owner=S;journeyAnimation=setTimeout(()=>{if(S===owner&&S.phase==='journey'){const b=$('#journeyContinue');if(b){b.disabled=false;if(!menuOpen)b.focus();}}},prefs.reduced||motionPreference.matches?0:700);}
}
function journeyEnter(){if(S.sandbox||S.wave<2||S.wave>MAX_WAVE)return false;S.phase='journey';S.offer=[];renderUI();journeyShow();return true;}
function journeyChoose(id){
 if(!S||S.sandbox||S.phase!=='journey'||menuOpen||journeySelected()||!journeyOptions().some(n=>n.id===id))return false;
 const old=S.campaign,oldSave=loadedSave;S.campaign={...old,route:[...old.route,id],nodeId:id};
 if(!persist()){S.campaign=old;loadedSave=oldSave;$('#journeyNotice').textContent='Route not saved. Enable browser storage and retry.';return false;}
 journeyShow(true);return true;
}
function journeyContinue(){
 if(!S||S.sandbox||S.phase!=='journey'||menuOpen||!journeySelected()||$('#journeyContinue')?.disabled)return false;
 const oldSave=loadedSave,old={gold:S.gold,wallHp:S.wallHp,units:S.units.slice(),bench:S.bench.slice(),result:S.result,resultSub:S.resultSub,campaign:S.campaign};
 const selected=journeySelected();const reward=routeApply(selected);
 if(reward)setResult(selected.name,reward);
 S.phase='prep';
 if(!persist()){Object.assign(S,old,{phase:'journey'});loadedSave=oldSave;$('#journeyNotice').textContent='Could not save preparation. No reward granted. Retry before continuing.';return false;}
 hideOv();renderUI();tip('layout');return true;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-journey-choose],[data-journey-next]');if(!b||b.disabled||$('#ov').hidden||!$('#ov').contains(b))return;if(b.hasAttribute('data-journey-next'))journeyContinue();else journeyChoose(b.dataset.journeyChoose);});
