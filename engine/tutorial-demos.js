/* Small, deterministic teaching illustrations; no game actions, assets or rewards. */
const guideDemo=(function(){
 const topics={spin:'Extra spins',undo:'Undo',slot:'Army capacity',merge:'Stack & merge'};
 let dialog=null,topic='spin',step=0,timer=0,playing=false,owner=null,previousFocus=null,model=null;
 const get=id=>document.getElementById(id);
 const allowed=()=>!!(typeof S!=='undefined'&&S&&!S.sandbox&&S.phase==='prep'&&!spinning&&!S.drag&&!S.pendingMerge&&!menuOpen&&get('ov').hidden&&get('ov2').hidden&&!get('unitBestiary').open&&!get('runePractice').open);
 const reduced=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const txt=(x,y,t,cls='')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="middle">${t}</text>`;
 const box=(x,y,w,h,cls='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="${cls}"/>`;
 const soul=(x,y)=>`<path class="soul" d="M${x} ${y-12}l9 12 -9 12 -9 -12Z"/>`;
 const unit=(x,y,rank=1,extra='')=>`<g transform="translate(${x} ${y})"><circle r="30" class="token ${rank===2?'evolved':''}"/><path class="skull" d="M-15 2V-7a15 15 0 0 1 30 0V2L8 8v9H-8V8Z M-9 -4h5v5h-5Z M4 -4h5v5H4Z" fill-rule="evenodd"/>${txt(0,49,'★'.repeat(rank),'gold')}${extra?txt(0,68,extra,'small'):''}</g>`;
 const travel=(body,dx,dy=0)=>`<g class="demo-travel" style="--travel-x:${dx}px;--travel-y:${dy}px">${body}</g>`;
 const arrow=(a,b,c,d)=>`<path d="M${a} ${b}L${c} ${d}" class="demo-arrow" marker-end="url(#demoHead)"/>`;
 const cursor=(x,y)=>`<g transform="translate(${x} ${y})"><path class="demo-cursor" d="M0 0L0 25L7 19L13 30L18 27L12 16L23 16Z"/></g>`;
 function lesson(k,m){
  const n=m.mergeN, cost=m.spin, capacity=m.capacity, slot=m.slot;
  return {
   spin:[['Free spins run out','Free spins refill each wave. You can buy another during preparation.'],[`Buy spin · ${cost} souls`,'Spend souls to add one spin. The price increases after each purchase.'],['Pull the lever','The purchased spin works like any other spin. Matching symbols may summon guardians or grant souls.']],
   undo:[['Make a preparation move','Move a guardian or make an eligible deterministic purchase.'],['Click UNDO or press Ctrl+Z','Undo reverses the last eligible preparation action.'],['Position restored','A real spin clears undo history. Undo cannot reroll symbols or rewind combat.']],
   slot:[['Your army has a limit','Capacity determines how many guardians can occupy the battlefield.'],[`Buy +1 slot · ${slot} souls`,'Spend souls to raise the field limit by one. The next expansion costs more.'],['One more space to deploy','No guardian is granted. Summon one or move one from reserve later.']],
   merge:[['Find matching guardians',`Use the same creature type and rank. Your current merge threshold is ${n}.`],['Drag one onto another',n===3?'Two guardians form a stack. Add the third to evolve.':'Your current bonus allows two matching guardians to evolve.'],['A stronger guardian','The required matching guardians become one guardian of the next rank.']]
  }[k];
 }
 function illustration(k,i,m){
  let a='';
  if(k==='spin'){
   a+=box(30,24,380,52,'panel')+soul(61,50)+txt(115,56,`${i?0:m.spin} souls`,'gold')+txt(314,56,`${i===1?1:0} spins`,'cyan');
   a+=box(36,96,210,138,'panel');for(let j=0;j<9;j++){let x=49+j%3*64,y=108+Math.floor(j/3)*39;a+=box(x,y,56,34,i===2&&j<3?'active':'slot')+txt(x+28,y+23,i===2&&j<3?'✦':['✦','◆','●'][j%3],'gold');}
   a+=box(264,98,56,132,'panel')+`<path d="M292 125V204" class="lever"/><circle cx="292" cy="${i===2?192:125}" r="13" class="knob"/>`+txt(292,220,'PULL','small');
   a+=box(335,117,90,60,i===1?'active':'panel')+txt(380,140,'BUY SPIN','small')+txt(380,158,m.spin+' souls','small');
   if(i===1)a+=cursor(379,157);if(i===2)a+=cursor(292,192);
  }else if(k==='slot'){
   a+=box(28,24,384,53,'panel')+txt(220,57,`FIELD CAPACITY ${m.capacity+(i===2?1:0)}`,'gold');
   for(let j=0;j<4;j++){const x=55+j*84;a+=box(x,101,76,72,j===3&&i===2?'active':'slot')+txt(x+38,143,j===3?(i===2?'+1':'LOCKED'):'●',j===3?'small':'cyan');}
   a+=txt(220,195,'Illustrative capacity slots','small')+box(119,207,202,37,i===1?'active':'panel')+txt(220,230,`+1 SLOT · ${m.slot} souls`,'gold');if(i===1)a+=cursor(292,230);
  }else if(k==='undo'){
   a+=box(28,24,384,172,'field')+box(73,70,84,90,'slot')+box(280,70,84,90,'slot');
   a+=i===0?travel(unit(115,112),207):i===1?unit(322,112):travel(unit(322,112),-207);if(i===0)a+=arrow(161,112,274,112)+travel(cursor(131,125),207);if(i===2)a+=arrow(275,112,165,112);
   a+=box(130,208,180,39,i===2?'active':'panel')+txt(220,233,'↶ UNDO · Ctrl+Z','gold');if(i===2)a+=cursor(284,232);
  }else{
   a+=box(28,25,384,216,'field');
   if(i===0){a+=(m.mergeN===3?travel(unit(108,107),112):unit(108,107))+unit(220,107)+(m.mergeN===3?unit(332,107)+arrow(139,108,183,108)+travel(cursor(118,123),112):'');}
   else if(i===1&&m.mergeN===3){a+=unit(185,107,1,'STACK ×2')+arrow(296,108,227,108)+travel(unit(332,107)+cursor(335,123),-147);}
   else if(i===1){a+=unit(108,107)+arrow(183,108,139,108)+travel(unit(220,107)+cursor(230,123),-112);}
   else{a+=`<circle cx="220" cy="112" r="59" class="halo"/>`+unit(220,112,2)+txt(220,211,'EVOLUTION COMPLETE','gold');}
  }
  return `<svg viewBox="0 0 440 260" role="img" aria-label="${topics[k]} illustration"><defs><marker id="demoHead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#ff826e"/></marker></defs>${a}</svg>`;
 }
 function stop(){clearTimeout(timer);timer=0;playing=false;if(dialog){get('demoPlay').textContent='Play';dialog.classList.remove('demo-playing');}}
 function paint(){const data=lesson(topic,model)[step];get('demoTitle').textContent=topics[topic];get('demoStage').textContent=`${step+1}/3 · ${data[0]}`;get('demoCopy').textContent=data[1];get('demoArt').innerHTML=illustration(topic,step,model);get('demoPrev').disabled=step===0;get('demoNext').disabled=step===2;dialog.querySelectorAll('[data-demo-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.demoTopic===topic)));}
 function schedule(){clearTimeout(timer);if(!playing||!dialog.open)return;timer=setTimeout(()=>{if(!dialog.open||owner!==S){close();return;}if(step===2){stop();return;}step++;paint();schedule();},1900);}
 function play(){if(step===2){step=0;paint();}playing=true;dialog.classList.add('demo-playing');get('demoPlay').textContent='Pause';schedule();}
 function choose(k){if(!Object.hasOwn(topics,k))return;stop();topic=k;step=0;paint();if(!reduced())play();}
 function close(){stop();if(dialog?.open)dialog.close();}
 function init(){if(dialog)return;dialog=get('tutorialDemo');dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.demoTopic){choose(b.dataset.demoTopic);return;}switch(b.dataset.demoAction){case 'previous':stop();step=Math.max(0,step-1);paint();break;case 'next':stop();step=Math.min(2,step+1);paint();break;case 'replay':stop();step=0;paint();if(!reduced())play();break;case 'play':playing?stop():play();break;case 'close':close();break;}});dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('keyup',e=>e.stopPropagation());dialog.addEventListener('close',()=>{stop();owner=null;if(previousFocus?.isConnected&&!previousFocus.disabled&&!previousFocus.closest('[hidden]'))previousFocus.focus({preventScroll:true});else get('tutorialExamples')?.focus({preventScroll:true});previousFocus=null;});}
 function open(k='spin'){if(!allowed())return false;init();if(dialog.open)return false;owner=S;model={spin:spinCost(),slot:slotCost(),capacity:S.maxUnits,mergeN:S.mods.mergeN===2?2:3};previousFocus=document.activeElement;dialog.showModal();tutorialHide();choose(k);get('demoClose').focus();return true;}
 function tick(){const b=get('tutorialExamples');if(b)b.disabled=!allowed();if(dialog?.open&&(!allowed()||owner!==S))close();return !!dialog?.open;}
 return Object.freeze({open,tick});
})();
