/* First-campaign guide. Read-only lessons; no rewards, RNG changes or input locks. */
const TUTORIAL_KEY='gs22.tutorial.v1';
const TUTORIAL_LESSONS=Object.freeze([
 {id:'goal',title:'Guard the Valley',text:'Humans enter from the right. Protect the blue Altar on the left for 10 waves. Your guardians fight automatically. Your starting relic lasts this run.',task:'Learn your objective',target:'altar',manual:true},
 {id:'spin',title:'Summon your army',text:'Pull the Soul Gacha lever. Three matching symbols in a row, column or diagonal summon a guardian or grant souls. Wild symbols match any type. Free spins refill every wave.',task:'Pull the lever once',target:'#summonLever'},
 {id:'hold',title:'Make your own luck',text:'Click a symbol to HOLD it for the next spin. You can normally hold up to two. A match clears your holds.',task:'Hold a symbol',target:'#reels'},
 {id:'move',title:'Build your formation',text:'Drag a guardian to an empty place on your side. Zombies protect the front; Wraiths attack from range. Hover for reach; click for details. Drop identical guardians of the same rank on each other to stack and merge.',task:'Move a guardian on the field',target:'formation'},
 {id:'reserve',title:'Train in reserve',text:'Guardians in reserve do not fight. Each survived wave there grants +50% HP and damage, up to +150%. Drag one to an empty reserve slot to try it.',task:'Move a guardian to reserve',target:'reserve'},
 {id:'return',title:'Return to battle',text:'Drag a reserve guardian back into your defense zone. Put identical guardians of the same rank on each other to stack; normally three merge into the next rank. Undo works during preparation.',task:'Return a guardian to the field',target:'reserve'},
 {id:'defend',title:'Face the invasion',text:'Use remaining free spins and arrange your army. Press DEFEND! to begin. If spins remain, the game asks you to confirm. Check incoming enemies on the right.',task:'Start the wave',target:'[data-act="fight"]'},
 {id:'cards',title:'Turn the tide',text:'Click a combat card when needed. AIM cards also need a target on the field; Esc cancels aim. Unused cards carry over, and spent cards are replenished up to your hand size between waves.',task:'Play a combat card',target:'#hand'},
 {id:'hero',title:'Unleash your champion',text:'',task:'Use your class ability',target:''},
 {id:'survive',title:'Hold the line',text:'Every defeated human grants a soul. Your guardians fight for you; use cards and class abilities when needed. Survive this wave to replenish free spins and cards.',task:'Survive the wave',target:'altar'},
 {id:'shop',title:'Visit Hades Room',text:'Between waves, spend souls on extra spins, cards, field capacity or Hades upgrades. Artifacts last this run; Sorcerers can also learn permanent scrolls. Buying is optional.',task:'Open Hades Room',target:'#hadesRoom'},
 {id:'finish',title:'You are the guardian',text:'Repeat: summon, prepare, defend and improve. Use Guide in the bottom bar to review these lessons any time. Good luck defending the Valley!',task:'Finish the guide',target:'#tutorialOpen',manual:true}
]);
let tutorialOwner=null,tutorialRecord=null,tutorialLast=0,tutorialPainted='',tutorialMemory=null;
function tutorialRead(){try{return JSON.parse(localStorage.getItem(TUTORIAL_KEY))||tutorialMemory;}catch{return tutorialMemory;}}
function tutorialWrite(){if(!tutorialRecord)return;tutorialMemory={...tutorialRecord};try{localStorage.setItem(TUTORIAL_KEY,JSON.stringify(tutorialRecord));}catch{}}
function tutorialRunId(){return S?.runId||sessionRunId||'';}
function tutorialStart(force=false){
 if(!S||S.sandbox||!['prep','fight'].includes(S.phase))return false;
 const old=tutorialRead();if(!force&&(old?.status==='done'||old?.status==='skipped'))return false;
 tutorialOwner=S;tutorialRecord={status:'active',runId:tutorialRunId(),wave:S.wave,stage:S.phase==='fight'?'cards':'goal',spinStart:S.spinsLeft,moved:false,bench:false,returned:false,card:false,hero:false};tutorialPainted='';tutorialWrite();return true;
}
function tutorialStop(status){if(tutorialRecord?.status==='active'){tutorialRecord.status=status;tutorialWrite();}tutorialHide();}
function tutorialHide(){document.getElementById('tutorialGuide').hidden=true;document.getElementById('tutorialSpot').hidden=true;document.body.classList.remove('tutorial-visible');}
function tutorialAdvance(){const r=tutorialRecord;if(r?.status!=='active')return;const i=TUTORIAL_LESSONS.findIndex(s=>s.id===r.stage);if(i===TUTORIAL_LESSONS.length-1){tutorialStop('done');return;}r.stage=TUTORIAL_LESSONS[Math.max(0,i+1)].id;if(r.stage==='return'&&!r.bench)r.stage='defend';tutorialWrite();tutorialPainted='';}
function tutorialSignal(kind){const r=tutorialRecord;if(tutorialOwner!==S||r?.status!=='active'||S.sandbox)return;const key={move:'moved',bench:'bench',return:'returned',card:'card'}[kind];if(key&&!r[key]){r[key]=true;tutorialWrite();}}
function tutorialLesson(){const s=TUTORIAL_LESSONS.find(x=>x.id===tutorialRecord.stage);if(!s||s.id!=='hero')return s;
 if(heroUsesMagic(S))return {...s,title:'Cast Infernal Fire',text:'Click Cast Spells or press Q. Hold the mouse button and draw a closed triangle on the field in one stroke, release, then click a target. Mana pays for spells. Practice runes in the Grimoire.',task:'Successfully cast a spell',target:magicActive()?'formation':'#magicCast',rune:true};
 return {...s,title:'Summon the Warlord',text:'Click Summon Warrior or press Q, then click a landing point. Move with WASD or arrows. Basic attacks are automatic. Use E, R, Space and F when rage and cooldowns allow.',task:'Deploy your warrior',target:heroAimActive()?'formation':'#heroDeploy'};
}
function tutorialRect(target){
 if(['altar','formation','reserve'].includes(target)){
  const c=cv.getBoundingClientRect();if(!c.width||!c.height)return null;
  if(target==='altar')return {left:c.left,top:c.top+WORLD_H*scale*.18,width:Math.min(c.width*.2,150*scale),height:WORLD_H*scale*.58};
  if(target==='formation')return {left:c.left+WALL_X*scale,top:c.top,width:(S.phase==='fight'?worldW()-WALL_X:zoneMax()-WALL_X)*scale,height:WORLD_H*scale};
  return {left:c.left+(benchSlot(0).x-28)*scale,top:c.top+WORLD_H*scale,width:(benchSlot(2).x-benchSlot(0).x+56)*scale,height:(LOGIC_H-WORLD_H)*scale};
 }
 const el=document.querySelector(target);if(!el||!el.getClientRects().length)return null;const c=el.getBoundingClientRect();return {left:c.left,top:c.top,width:c.width,height:c.height};
}
function tutorialPosition(lesson){
 const panel=document.getElementById('tutorialGuide'),spot=document.getElementById('tutorialSpot'),r=tutorialRect(lesson.target),vw=innerWidth,vh=innerHeight,rail=document.querySelector('.command-intel').getBoundingClientRect();
 const w=Math.min(vw-16,Math.max(175,Math.min(260,rail.width-12)));panel.style.width=w+'px';
 const h=panel.offsetHeight, pad=8;const clampPos=(n,max)=>Math.max(pad,Math.min(Math.max(pad,max-pad),n));
 // Prefer the intelligence rail; choose another corner if the highlighted control overlaps it.
 const candidates=[[rail.right-w-6,rail.bottom-h-6],[rail.left+6,rail.top+6],[vw-w-pad,pad],[pad,vh-h-pad],[vw-w-pad,vh-h-pad]];
 const hit=(x,y)=>r?Math.max(0,Math.min(x+w,r.left+r.width)-Math.max(x,r.left))*Math.max(0,Math.min(y+h,r.top+r.height)-Math.max(y,r.top)):0;
 const positions=candidates.map(([x,y])=>[clampPos(x,vw-w),clampPos(y,vh-h)]);let best=positions[0];for(const p of positions)if(hit(...p)<hit(...best))best=p;
 panel.style.left=best[0]+'px';panel.style.top=best[1]+'px';
 if(!r||r.width<=0||r.height<=0||r.left>=vw||r.top>=vh||r.left+r.width<=0||r.top+r.height<=0){spot.hidden=true;return;}
 const x=Math.max(2,r.left-3),y=Math.max(2,r.top-3);spot.style.left=x+'px';spot.style.top=y+'px';spot.style.width=Math.max(0,Math.min(vw-2,r.left+r.width+3)-x)+'px';spot.style.height=Math.max(0,Math.min(vh-2,r.top+r.height+3)-y)+'px';spot.hidden=false;
}
function tutorialTick(now){
 if(now-tutorialLast<100)return;tutorialLast=now;
 const openBtn=document.getElementById('tutorialOpen');openBtn.disabled=!S||!!S.sandbox||!['prep','fight'].includes(S.phase);
 if(tutorialOwner!==S){tutorialOwner=S;const saved=tutorialRead();tutorialRecord=S&&!S.sandbox&&saved?.status==='active'&&saved.runId===tutorialRunId()&&TUTORIAL_LESSONS.some(x=>x.id===saved.stage)?saved:null;tutorialPainted='';}
 const r=tutorialRecord;
 if(!S||S.sandbox||r?.status!=='active'||menuOpen||document.hidden||!['prep','fight','reward'].includes(S.phase)){tutorialHide();return;}
 const inShop=!$('#ov2').hidden&&!!$('#ov2 .hades-shop');
 if(r.stage==='shop'&&inShop){tutorialAdvance();}
 if(!$('#ov').hidden||!$('#ov2').hidden||$('#unitBestiary').open||$('#runePractice').open||S.phase==='reward'){tutorialHide();return;}
 if(S.wave>r.wave&&!['shop','finish'].includes(r.stage)){r.stage='shop';tutorialWrite();tutorialPainted='';}
 else if(S.phase==='fight'&&TUTORIAL_LESSONS.findIndex(s=>s.id===r.stage)<6){r.stage='cards';tutorialWrite();tutorialPainted='';}
 if(S.phase==='fight'){
  if(!r.card&&S.hand.some(h=>h.used)){r.card=true;tutorialWrite();}
  if(!r.hero&&(heroUsesMagic(S)?Object.values(magicData().cooldowns).some(cd=>cd>0):S.hero.status==='descending'||S.hero.status==='active'||S.hero.status==='fallen')){r.hero=true;tutorialWrite();}
 }
 // Detect successful actions, not merely attempted clicks. No step is mandatory.
 const pass=()=>({spin:!spinning&&S.spinsLeft<r.spinStart,hold:S.held.size>0||S.spinsLeft===0,move:r.moved,reserve:r.bench,return:r.returned,defend:S.phase==='fight',cards:r.card,hero:r.hero}[r.stage]);
 for(let j=0;j<8&&pass();j++)tutorialAdvance();
 const lesson=tutorialLesson();if(!lesson){tutorialStop('skipped');return;}
 const panel=$('#tutorialGuide'),idx=TUTORIAL_LESSONS.findIndex(s=>s.id===r.stage),key=r.stage+':'+lesson.title;
 if(tutorialPainted!==key){tutorialPainted=key;$('#tutorialCount').textContent=`VALLEY GUIDE · ${idx+1}/${TUTORIAL_LESSONS.length}`;$('#tutorialTitle').textContent=lesson.title;$('#tutorialText').textContent=lesson.text;$('#tutorialTask').textContent=lesson.task;$('#tutorialProgress').style.width=((idx+1)/TUTORIAL_LESSONS.length*100)+'%';$('#tutorialNext').textContent=r.stage==='finish'?'Finish':lesson.manual?'Continue':'Skip step';$('#tutorialRune').hidden=!lesson.rune;}
 panel.hidden=false;document.body.classList.add('tutorial-visible');tutorialPosition(lesson);
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-tutorial]');if(!b||b.disabled)return;
 if(b.dataset.tutorial==='open'){if(tutorialRecord?.status==='active'&&tutorialOwner===S){tutorialHide();tutorialStop('skipped');}else tutorialStart(true);}
 if(b.dataset.tutorial==='next')tutorialAdvance();if(b.dataset.tutorial==='skip')tutorialStop('skipped');
});
