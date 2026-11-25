/* Read-only collection: existing profile stores are authoritative. No new currency. */
function sanctumOpen(){
 if(!menuOpen)return;
 const p=campaignProfileInit(),deck=META.deck,known=Object.keys(SPELL_UNLOCKS).filter(knowledgeLearned),t=talentInit(),ranks=Object.values(t.ranks).reduce((a,b)=>a+b,0),history=scores();
 const esc=escapeHTML, status=(owned,yes='UNLOCKED',no='SEALED')=>`<span class="sanctum-state ${owned?'unlocked':''}">${owned?yes:no}</span>`;
 const cards=Object.entries(CARDS).map(([id,c])=>{const count=deck.filter(x=>x===id).length;return `<article class="sanctum-item"><div><b>${esc(c.n)}</b>${status(count>0,count+' IN DECK')}</div><p>${count?esc(c.d(1)):'Choose this card as a permanent end-of-run reward when offered.'}</p></article>`;}).join('');
 const spells=Object.keys(SPELL_UNLOCKS).map(id=>{const owned=known.includes(id),m=masteryRecord(id);return `<article class="sanctum-item"><div><b>${esc(magicDef(id).name)}</b>${status(owned)}</div><p>${esc(knowledgeHint(id))}</p>${owned?`<small>Mastery ${m.tier}/3 · ${m.xp}/20 XP</small>`:''}</article>`;}).join('');
 const talents=Object.entries(TALENT_BRANCHES).map(([id,b])=>`<article class="sanctum-item"><div><b>${esc(b.name)}</b>${status(t.ranks[id]>0,t.ranks[id]+'/3 LEARNED')}</div>${b.nodes.map((n,i)=>`<p>${i<t.ranks[id]?'✓':'◇'} ${esc(n.name)} · ${esc(n.desc)}</p>`).join('')}</article>`).join('');
 const stat=(n,l)=>`<div><strong>${n}</strong><small>${l}</small></div>`;
 const group=(title,desc,html)=>`<section class="sanctum-group"><h3>${title}</h3><p>${desc}</p><div class="sanctum-grid">${html}</div></section>`;
 $('#sanctumBody').innerHTML=`<div class="sanctum-stats">${stat(new Set(deck).size+'/'+Object.keys(CARDS).length,'Card types')}${stat(known.length+'/6','Spells')}${stat(ranks+'/9','Talents')}${stat(talentPoints(t),'Valor available')}</div><p class="sanctum-history">Recorded local results: ${history.length} · ${history.filter(r=>r.won).length} victories · ${p.claims.length} claimed card rewards. Older scores may have been trimmed.</p>${group('Starting deck',deck.length+' cards including duplicates · automatically used in new campaigns.',cards)}${group('Arcane knowledge','Learned spells and mastery carry into future Sorcerer campaigns.',spells)}${group('Warlord doctrines','Choose one learned branch during New Game. Classic mode is required for milestones 6–10.',talents)}<p class="menu-small">No new currency or extra starting bonuses yet. Your existing permanent progression is unchanged.</p>`;
 front('sanctumView');$('#sanctumView').scrollTop=0;
}
