/* First-campaign guide. Read-only lessons; no rewards, RNG changes or input locks. */
const TUTORIAL_KEY='gs22.tutorial.v1';
const TUTORIAL_LESSONS=Object.freeze([
 {id:'goal',title:'Protect the Altar',text:'Humans attack from the right. Keep this crystal alive for 10 waves. Your guardians fight automatically.',task:'Defend the crystal.',target:'altar',manual:true},
 {id:'spin',title:'Summon a guardian',text:'Match 3 symbols in a row, column or diagonal to summon a guardian or earn souls. Wild skulls replace any symbol.',task:'Pull the lever once.',target:'#summonLever'},
 {id:'hold',title:'Keep useful symbols',text:'Lock a symbol to keep it for your next spin. This helps you complete matching lines.',task:'Click a symbol to HOLD it.',target:'#reels'},
 {id:'move',title:'Set your defense',text:'Place tough Zombies in front and ranged Wraiths behind them. Stay inside your marked defense zone.',task:'Drag a guardian to an empty position.',target:'formation'},
 {id:'merge',title:'Upgrade guardians',text:'Stack matching guardians of the same rank to evolve a stronger guardian.',task:'Drag one matching guardian onto another.',target:'transfer',demo:'merge'},
 {id:'reserve',title:'Train in reserve',text:'Reserve guardians cannot fight. Each wave in reserve grants +50% health and damage, up to +150%.',task:'Drag a guardian into an empty reserve slot.',target:'transfer'},
 {id:'return',title:'Bring your guardian back',text:'Trained guardians keep their bonuses when they return to battle.',task:'Drag the reserve guardian back to the field.',target:'transfer'},
 {id:'extraSpin',title:'Buy another spin',text:'',task:'Watch the example, then continue.',target:'[data-act="buy"]',manual:true,demo:'spin'},
 {id:'slot',title:'Expand your army',text:'',task:'Watch the example, then continue.',target:'[data-act="slot"]',manual:true,demo:'slot'},
 {id:'undo',title:'Undo a preparation action',text:'Undo reverses eligible moves, stacks and deterministic purchases. It cannot rewind a spin or combat.',task:'Watch the example, then continue.',target:'#undoBtn',manual:true,demo:'undo'},
 {id:'defend',title:'Start the invasion',text:'Use your remaining free spins and arrange your army. If spins remain, press DEFEND again to confirm.',task:'Click DEFEND!',target:'[data-act="fight"]'},
 {id:'cards',title:'Play a combat card',text:'Read a card, then click it to use its effect. Cards marked AIM need a battlefield target.',task:'Play one combat card.',target:'#hand'},
 {id:'hero',title:'Use your hero',text:'',task:'Use your class ability.',target:''},
 {id:'survive',title:'Hold the line',text:'Your army fights automatically. Each defeated human earns one soul. Survive to refill free spins and replace spent cards.',task:'Survive the invasion.',target:'battle'},
 {id:'shop',title:'Visit Hades Room',text:'Spend souls on artifacts for this campaign. Sorcerers can also learn permanent spell scrolls.',task:'Open Hades Room. No purchase required.',target:'#hadesRoom'},
 {id:'finish',title:'The Valley is yours',text:'Summon → Prepare → Defend → Upgrade. Repeat until wave 10. Open Guide whenever you need a refresher.',task:'Finish the guide.',target:'#tutorialOpen',manual:true}
]);
let tutorialCompact=false,tutorialShownAt=0,tutorialWasHidden=true;
const tutorialEl=id=>document.getElementById(id);
let tutorialOwner=null,tutorialRecord=null,tutorialLast=0,tutorialPainted='',tutorialMemory=null;
function tutorialRead(){try{return JSON.parse(localStorage.getItem(TUTORIAL_KEY))||tutorialMemory;}catch{return tutorialMemory;}}
function tutorialWrite(){if(!tutorialRecord)return;tutorialMemory={...tutorialRecord};try{localStorage.setItem(TUTORIAL_KEY,JSON.stringify(tutorialRecord));}catch{}}
function tutorialRunId(){return S?.runId||sessionRunId||'';}
function tutorialStart(force=false){
 if(!S||S.sandbox||!['prep','fight'].includes(S.phase))return false;
 const old=tutorialRead();if(!force&&(old?.status==='done'||old?.status==='skipped'))return false;
 tutorialOwner=S;tutorialRecord={status:'active',runId:tutorialRunId(),wave:S.wave,stage:S.phase==='fight'?'cards':'goal',spinStart:S.spinsLeft,moved:false,merged:false,bench:false,returned:false,card:false,hero:false};tutorialPainted='';tutorialWrite();return true;
}
function tutorialStop(status){if(tutorialRecord?.status==='active'){tutorialRecord.status=status;tutorialWrite();}tutorialHide();}
function tutorialHide(){document.getElementById('tutorialGuide').hidden=true;document.getElementById('tutorialSpot').hidden=true;tutorialEl('tutorialPointer').hidden=true;document.body.classList.remove('tutorial-visible','tutorial-combat');tutorialWasHidden=true;}
function tutorialAdvance(){const r=tutorialRecord;if(r?.status!=='active')return;const i=TUTORIAL_LESSONS.findIndex(s=>s.id===r.stage);if(i===TUTORIAL_LESSONS.length-1){tutorialStop('done');return;}r.stage=TUTORIAL_LESSONS[Math.max(0,i+1)].id;if(r.stage==='return'&&!r.bench)r.stage='extraSpin';tutorialWrite();tutorialPainted='';}
function tutorialSignal(kind){const r=tutorialRecord;if(tutorialOwner!==S||r?.status!=='active'||S.sandbox)return;const key={move:'moved',merge:'merged',bench:'bench',return:'returned',card:'card'}[kind];if(key&&!r[key]){r[key]=true;tutorialWrite();}}
function tutorialLesson(){
 const s=TUTORIAL_LESSONS.find(x=>x.id===tutorialRecord.stage);if(!s)return null;
 const l={...s};
 if(s.id==='spin'&&S.spinsLeft===0&&!spinning&&!tutorialRecord.spinStart)return {...l,text:'No free spins left. Buy more with souls or continue preparing.',task:'Continue when ready.',manual:true,target:'[data-act="buy"]'};
 if(s.id==='extraSpin')l.text=`Buy spin costs ${spinCost()} souls now. Each purchase adds one spin; its price rises. Buying is optional.`;
 if(s.id==='slot')l.text=`+1 slot costs ${slotCost()} souls now and increases field capacity from ${S.maxUnits} to ${S.maxUnits+1}. It does not summon a guardian.`;
 if(s.id==='hold'){l.text+=` You may hold up to ${S.holdsMax} symbols.`;if(S.spinsLeft===0){l.text='No spins left. Remember to HOLD useful symbols before your next spin.';l.task='Continue to your formation.';l.manual=true;}}
 if(s.id==='merge'){l.text=`Stack ${S.mods.mergeN} identical guardians of the same rank to evolve one.`;if(!nearMerge()){l.text+=' You do not have a matching pair yet. Try it after summoning more.';l.task='Continue — you can merge later.';l.manual=true;}}
 if(s.id==='reserve'&&S.bench.every(Boolean))return {...l,text:'The reserve is full. Return a guardian to the field first, or continue.',task:'Continue when ready.',manual:true};
 if(s.id==='cards'){
  if(S.aim!==null)return {...l,title:'Choose a card target',text:'Click the battlefield where the card should take effect. Esc cancels.',task:'Click a target.',target:'battle'};
  if(!S.hand.some(c=>!c.used&&usableNow(c.id)))return {...l,text:'No combat cards available. Draw another if you have enough souls, or continue.',task:'Continue when ready.',manual:true};
 }
 if(s.id!=='hero')return l;
 if(heroUsesMagic(S)){
  if(magicActive()&&magicMode==='aim')return {...l,title:'Aim your spell',text:'Rune recognized! Click a valid target before the timer ends. Esc cancels.',task:'Click the target.',target:'battle'};
  if(magicActive()&&magicMode==='draw')return {...l,title:'Draw the fire rune',text:'Hold the mouse button, trace a closed triangle in one stroke, then release.',task:'Draw the triangle.',target:'battle',rune:true};
  return {...l,title:'Open spellcasting',text:'Click Cast Spells or press Q. Infernal Fire uses a triangle rune and costs 25 mana. Practice in the Grimoire.',task:'Press Q to begin.',target:'#magicCast',rune:true};
 }
 if(heroAimActive())return {...l,title:'Choose a landing point',text:'Click a valid position to deploy your Warlord. His descent damages nearby invaders.',task:'Click a landing point.',target:'battle'};
 return {...l,title:'Summon the Warlord',text:'Press Q to deploy once per wave. Move with WASD or arrows. Attacks are automatic. Skills: E, R, Space, F.',task:'Press Q to begin deployment.',target:'#heroDeploy'};
}
function tutorialRect(target){
 if(['altar','formation','reserve','battle','transfer'].includes(target)){
  const c=cv.getBoundingClientRect();if(!c.width||!c.height)return null;
  if(target==='battle')return {left:c.left,top:c.top,width:c.width,height:WORLD_H*scale};
  if(target==='transfer')return {left:c.left,top:c.top,width:c.width,height:LOGIC_H*scale};
  if(target==='altar')return {left:c.left,top:c.top+WORLD_H*scale*.18,width:Math.min(c.width*.22,160*scale),height:WORLD_H*scale*.58};
  if(target==='formation')return {left:c.left+WALL_X*scale,top:c.top,width:(S.phase==='fight'?worldW()-WALL_X:zoneMax()-WALL_X)*scale,height:WORLD_H*scale};
  return {left:c.left+(benchSlot(0).x-28)*scale,top:c.top+WORLD_H*scale,width:(benchSlot(2).x-benchSlot(0).x+56)*scale,height:(LOGIC_H-WORLD_H)*scale};
 }
 const el=target&&document.querySelector(target);if(!el||!el.getClientRects().length)return null;const c=el.getBoundingClientRect();return {left:c.left,top:c.top,width:c.width,height:c.height};
}
function tutorialPosition(lesson){
 const panel=tutorialEl('tutorialGuide'),spot=tutorialEl('tutorialSpot'),arrow=tutorialEl('tutorialPointer'),vw=innerWidth,vh=innerHeight,ui=Math.max(1,Number(document.documentElement.style.getPropertyValue('--ui-scale'))||1),pad=10*ui,gap=18*ui;
 const raw=tutorialRect(lesson.target),clamp=(v,a,b)=>Math.max(a,Math.min(Math.max(a,b),v));
 const valid=raw&&raw.width>0&&raw.height>0&&raw.left<vw&&raw.top<vh&&raw.left+raw.width>0&&raw.top+raw.height>0;
 const r=valid?{left:Math.max(3,raw.left-5),top:Math.max(3,raw.top-5),right:Math.min(vw-3,raw.left+raw.width+5),bottom:Math.min(vh-3,raw.top+raw.height+5)}:null;
 panel.classList.toggle('is-collapsed',tutorialCompact);panel.hidden=false;const sideRoom=r?Math.max(r.left,vw-r.right)-gap-pad:0;const desired=(tutorialCompact?254:344)*ui;const width=r&&r.right-r.left>vw*.48&&sideRoom>=160*ui?Math.min(desired,sideRoom):desired;panel.style.width=Math.min(vw-2*pad,width)+'px';panel.style.maxHeight=Math.max(100,vh-2*pad)+'px';
 const w=panel.offsetWidth,h=panel.offsetHeight;
 if(!r){spot.hidden=arrow.hidden=true;panel.style.left=clamp((vw-w)/2,pad,vw-w-pad)+'px';panel.style.top=pad+'px';return;}
 const cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2;
 const candidates=[{x:r.right+gap,y:cy-h/2},{x:r.left-w-gap,y:cy-h/2},{x:cx-w/2,y:r.bottom+gap},{x:cx-w/2,y:r.top-h-gap}];
 const overlap=(p,b)=>Math.max(0,Math.min(p.x+w,b.right)-Math.max(p.x,b.left))*Math.max(0,Math.min(p.y+h,b.bottom)-Math.max(p.y,b.top));
 const field=tutorialRect('battle'),b=field?{left:field.left,right:field.left+field.width,top:field.top,bottom:field.top+field.height}:null;
 for(const p of candidates){p.x=clamp(p.x,pad,vw-w-pad);p.y=clamp(p.y,pad,vh-h-pad);p.score=overlap(p,r)*100+(b&&S.phase==='fight'?overlap(p,b)*.4:0)+Math.hypot(p.x+w/2-cx,p.y+h/2-cy)*.02;}
 candidates.sort((a,b)=>a.score-b.score);const p=candidates[0];panel.style.left=p.x+'px';panel.style.top=p.y+'px';
 Object.assign(spot.style,{left:r.left+'px',top:r.top+'px',width:Math.max(1,r.right-r.left)+'px',height:Math.max(1,r.bottom-r.top)+'px'});spot.hidden=false;
 const ax=clamp(cx,p.x,p.x+w),ay=clamp(cy,p.y,p.y+h),zx=clamp(ax,r.left,r.right),zy=clamp(ay,r.top,r.bottom),len=Math.hypot(zx-ax,zy-ay);
 arrow.hidden=len<5;Object.assign(arrow.style,{left:ax+'px',top:ay+'px',width:len+'px',transform:`rotate(${Math.atan2(zy-ay,zx-ax)}rad)`});
}
function tutorialTick(now){
 if(now-tutorialLast<100)return;tutorialLast=now;
 if(guideDemo.tick()){tutorialHide();return;}
 const openBtn=document.getElementById('tutorialOpen');openBtn.disabled=!S||!!S.sandbox||!['prep','fight'].includes(S.phase);
 if(tutorialOwner!==S){tutorialOwner=S;const saved=tutorialRead();tutorialRecord=S&&!S.sandbox&&saved?.status==='active'&&saved.runId===tutorialRunId()&&TUTORIAL_LESSONS.some(x=>x.id===saved.stage)?saved:null;tutorialPainted='';}
 const r=tutorialRecord;
 if(!S||S.sandbox||r?.status!=='active'||menuOpen||document.hidden||!['prep','fight','reward'].includes(S.phase)){tutorialHide();return;}
 const inShop=!$('#ov2').hidden&&!!$('#ov2 .hades-shop');
 if(r.stage==='shop'&&inShop){tutorialAdvance();}
 if(!$('#ov').hidden||!$('#ov2').hidden||$('#unitBestiary').open||$('#runePractice').open||S.phase==='reward'){tutorialHide();return;}
 if(S.wave>r.wave&&!['shop','finish'].includes(r.stage)){r.stage='shop';tutorialWrite();tutorialPainted='';}
 else if(S.phase==='fight'&&TUTORIAL_LESSONS.findIndex(s=>s.id===r.stage)<TUTORIAL_LESSONS.findIndex(s=>s.id==='cards')){r.stage='cards';tutorialWrite();tutorialPainted='';}
 if(S.phase==='fight'){
  if(!r.card&&S.hand.some(h=>h.used&&!isPrepCard(h.id))){r.card=true;tutorialWrite();}
  if(!r.hero&&(heroUsesMagic(S)?Object.values(magicData().cooldowns).some(cd=>cd>0):S.hero.status==='descending'||S.hero.status==='active'||S.hero.status==='fallen')){r.hero=true;tutorialWrite();}
 }
 // Detect successful actions, not merely attempted clicks. No step is mandatory.
 if(r.stage==='spin'&&r.spinStart===0&&S.spinsLeft>0){r.spinStart=S.spinsLeft;tutorialWrite();}
 const pass=()=>({spin:!spinning&&S.spinsLeft<r.spinStart,hold:S.held.size>0,move:r.moved,merge:r.merged,reserve:r.bench,return:r.returned,defend:S.phase==='fight',cards:r.card,hero:r.hero}[r.stage]);
 for(let j=0;j<TUTORIAL_LESSONS.length&&pass();j++)tutorialAdvance();
 const lesson=tutorialLesson();if(!lesson){tutorialStop('skipped');return;}
 const panel=$('#tutorialGuide'),idx=TUTORIAL_LESSONS.findIndex(s=>s.id===r.stage),key=[r.stage,lesson.title,lesson.text,lesson.manual].join('|');
 if(tutorialPainted!==key||tutorialWasHidden){tutorialPainted=key;tutorialWasHidden=false;tutorialCompact=false;tutorialShownAt=now;$('#tutorialCount').textContent=`VALLEY GUIDE · ${idx+1}/${TUTORIAL_LESSONS.length}`;$('#tutorialTitle').textContent=lesson.title;$('#tutorialText').textContent=lesson.text;$('#tutorialTask').textContent=lesson.task;$('#tutorialProgress').style.width=((idx+1)/TUTORIAL_LESSONS.length*100)+'%';$('#tutorialNext').textContent=r.stage==='finish'?'Finish':lesson.manual?'Continue':'Skip step';$('#tutorialRune').hidden=!lesson.rune;$('#tutorialWatch').hidden=!lesson.demo||S.phase!=='prep';}
 if(r.stage==='survive'&&now-tutorialShownAt>8000&&!panel.matches(':hover')&&!panel.contains(document.activeElement))tutorialCompact=true;
 tutorialEl('tutorialCollapse').textContent=tutorialCompact?'Expand':'Minimize';tutorialEl('tutorialCollapse').setAttribute('aria-expanded',String(!tutorialCompact));
 panel.hidden=false;document.body.classList.add('tutorial-visible');document.body.classList.toggle('tutorial-combat',S.phase==='fight');tutorialPosition(lesson);
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-tutorial]');if(!b||b.disabled)return;
 if(b.dataset.tutorial==='examples'){guideDemo.open();return;}
 if(b.dataset.tutorial==='watch'){const l=tutorialLesson();if(l?.demo)guideDemo.open(l.demo);return;}
 if(b.dataset.tutorial==='open'){if(tutorialRecord?.status==='active'&&tutorialOwner===S){tutorialCompact=!tutorialCompact;tutorialShownAt=performance.now();}else tutorialStart(true);}
 if(b.dataset.tutorial==='collapse'){tutorialCompact=!tutorialCompact;tutorialShownAt=performance.now();}
 if(b.dataset.tutorial==='next')tutorialAdvance();if(b.dataset.tutorial==='skip')tutorialStop('skipped');
});
