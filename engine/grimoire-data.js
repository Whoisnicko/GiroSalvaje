/* Editorial content only. Mechanical numbers are derived from SPELL_DATA. */
const GRIMOIRE_LORE=Object.freeze({
 fire:{school:'PYROMANCY',lore:'A spark stolen from the furnaces beneath the world. One breath turns the valley into an inferno.',ink:'#8c3a22',art:'fire'},
 barrier:{school:'SPECTRAL MAGIC',lore:'Bind the wandering dead into a shell of pale light. Let their devotion bear the blows meant for your guardian.',ink:'#17627a',art:'barrier'},
 lightning:{school:'ELECTROMANCY',lore:'Call the storm that never sees the sky. Its hunger leaps from one mortal heartbeat to the next.',ink:'#355d8b',art:'lightning'},
 grasp:{school:'NECROMANCY',lore:'The earth remembers those buried beneath it. Their hands rise to hold the living in place.',ink:'#67447c',art:'grasp'},
 frost:{school:'CRYOMANCY',lore:'A breath from the deepest crypt silences the warmth of flesh. Even the bravest advance becomes a crawl.',ink:'#286682',art:'frost'},
 harvest:{school:'SOUL MAGIC',lore:'Inscribe the debtor’s mark upon the living. When their last breath escapes, the altar collects its due.',ink:'#3d6841',art:'harvest'}
});
function grimoireProperties(id,d,wave=1){
 const stats=[['Mana',d.mana+' MP'],['Cooldown',d.cd+' s'],['Target',d.target==='ally'?'Guardian':d.target==='enemy'?'Human':'Area']];
 let effect='';
 if(id==='fire'){const dmg=masteryFireDamage(d,wave);stats.push(['Radius',d.r+' px'],['Damage',dmg+''],['Armor','Ignored']);if(d.burnDuration)stats.push(['Burn',masteryBurnDamage(d,wave)+' DPS · '+d.burnDuration+'s']);effect='Instant damage to humans in the circle. No friendly fire. Damage increases every two waves, with additional power from wave 4 onward.';}
 if(id==='barrier'){stats.push(['Absorption',Math.round(d.hpFraction*100)+'% max HP'],['Duration',d.duration+' s'],['Recast','Refresh']);effect='A shield absorbs incoming melee and projectile damage before health. Recasting replaces the shield.';}
 if(id==='lightning'){stats.push(['Damage',masteryLightningDamage(d,wave).join(' / ')],['Max targets',String(d.damage.length)],['Jump range',d.r+' px']);effect='Strikes the chosen human and jumps to nearby living enemies. Ignores physical armor. No repeat targets.';}
 if(id==='grasp'){stats.push(['Radius',d.r+' px'],['Root',d.duration+' s'],['Damage','None']);effect='Prevents movement, not attacks or healing. Forced displacement remains possible.';}
 if(id==='frost'){stats.push(['Radius',d.r+' px'],['Slow',Math.round(d.slow*100)+'%'],['Duration',d.duration+' s']);effect='Reduces movement speed. The strongest slow applies; slowing effects do not multiply.';}
 if(id==='harvest'){stats.push(['Radius',d.r+' px'],['Mark',d.duration+' s'],['Bonus cap','+'+d.bonusCap+' souls']);effect='Each marked human that dies grants one extra soul, up to the cap per cast. Overlapping marks replace one another.';}
 return {stats,effect};
}
// Original vector engravings: no external assets or loading dependencies.
function grimoireEngraving(id){
 const ink=GRIMOIRE_LORE[id].ink;
 const frame='<rect x="5" y="5" width="310" height="150" rx="2" fill="none" stroke="currentColor" opacity=".35"/><path d="M5 22h17V5M298 5v17h17M5 138h17v17M298 155v-17h17" fill="none" stroke="currentColor"/><circle cx="160" cy="80" r="62" fill="none" stroke="currentColor" stroke-dasharray="2 5" opacity=".45"/><circle cx="160" cy="80" r="48" fill="none" stroke="currentColor" opacity=".22"/><path d="M160 8v13m0 118v13M88 80h14m116 0h14" stroke="currentColor"/>';
 const fan=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
 const art={
 fire:'<ellipse cx="160" cy="119" rx="75" ry="10" fill="currentColor" opacity=".14"/><path d="M113 120Q83 89 119 61Q107 93 137 92Q118 66 157 24Q148 63 177 74Q190 49 194 39Q220 85 205 120Z" fill="currentColor" opacity=".75"/><path d="M137 122Q118 100 151 76Q142 100 162 99Q165 80 177 69Q197 102 181 122Z" fill="#e2ab5d" stroke="currentColor" stroke-width="1.5"/>'+fan(12,i=>'<path d="M'+(87+i*13)+' '+(42+(i*17%48))+'l4 -9" stroke="currentColor" opacity=".65"/>'),
 barrier:'<path d="M160 24L209 44v36Q208 115 160 140Q112 115 111 80V44Z" fill="currentColor" opacity=".14" stroke="currentColor" stroke-width="3"/><path d="M160 35L197 51v30Q196 107 160 126Q124 107 123 81V51Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="160" cy="78" r="18" fill="none" stroke="currentColor" stroke-width="2"/><path d="M160 52v52M134 78h52" stroke="currentColor" stroke-width="2"/>'+fan(8,i=>'<path d="M160 14l3 5-3 5-3-5Z" fill="currentColor" transform="rotate('+i*45+' 160 80)"/>'),
 lightning:'<path d="M147 17L113 79H151L131 139L202 63H165L187 17Z" fill="currentColor" opacity=".78"/><path d="M147 17L113 79H151L131 139L202 63H165L187 17Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M116 79L72 94L85 113L46 130M200 63l38 9-6 20 48 17" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="46" cy="130" r="9" stroke="currentColor" fill="none"/><circle cx="280" cy="109" r="9" stroke="currentColor" fill="none"/>',
 grasp:'<ellipse cx="160" cy="126" rx="87" ry="13" fill="currentColor" opacity=".18"/>'+fan(3,i=>'<g transform="translate('+(109+i*51)+' '+(122-i%2*9)+') rotate('+(-15+i*15)+')"><path d="M-10 12L-17 -15L-13 -40L-7 -22L-5 -55L2 -26L8 -49L10 -21L17 -33L19 -9L9 12Z" fill="currentColor" opacity=".68" stroke="currentColor"/><path d="M-10 2L6 -13M0 -5L-4 -22" fill="none" stroke="#ead5a0" opacity=".65"/></g>'),
 frost:fan(6,i=>'<g transform="rotate('+i*60+' 160 80)"><path d="M160 80V16M160 45l-18-16M160 45l18-16M160 64l-14-11M160 64l14-11" fill="none" stroke="currentColor" stroke-width="3"/><path d="M160 16l-5 10 5 8 5-8Z" fill="currentColor"/></g>')+'<circle cx="160" cy="80" r="12" fill="#d2e0dc" stroke="currentColor" stroke-width="2"/>',
 harvest:'<path d="M160 128Q111 108 119 77Q124 51 160 18Q196 51 201 77Q209 108 160 128Z" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="2"/><path d="M160 107C125 96 139 54 162 66C190 82 164 113 145 94" fill="none" stroke="currentColor" stroke-width="3"/>'+fan(8,i=>'<path d="M160 12l6 9-6 9-6-9Z" fill="currentColor" opacity=".7" transform="rotate('+i*45+' 160 80)"/>')
 };
 return '<svg viewBox="0 0 320 160" role="img" aria-label="'+id+' arcane engraving" style="color:'+ink+'">'+frame+art[id]+'</svg>';
}
