/* v19 renderer: canvas presentation, shared state from game core. Classic script; loaded before core. */
function forestArtReady(){return typeof forestBattlefieldArt!=='undefined'&&!!forestBattlefieldArt;}
function frozenArtReady(){return typeof frozenBattlefieldArt!=='undefined'&&!!frozenBattlefieldArt;}
function drawForestAltar(hurt,glow,frozen=false){
 const W=worldW(),illustratedIce=frozen&&frozenArtReady(),illustratedForest=!frozen&&forestArtReady(),x=W*(illustratedIce?.078:illustratedForest?.08:79/1100),y=WORLD_H*(illustratedIce?.32:illustratedForest?.415:198/500),bw=Math.min(68,W*.12),by=WORLD_H*(illustratedIce?.18:illustratedForest?.09:.27);
 ctx.save();
 // Missing artwork must still show a crystal, never the obsolete wall.
 if(frozen?!frozenArtReady():!forestArtReady()){
  ctx.translate(x,y);ctx.fillStyle='#182b26';ctx.strokeStyle='#73937a';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,29,Math.max(20,W*.07),18,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#76e4c1';ctx.beginPath();ctx.ellipse(0,26,18,8,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=frozen?'#5eb7eb':'#49bda6';ctx.strokeStyle=frozen?'#d4f6ff':'#b6f9d7';ctx.beginPath();ctx.moveTo(0,-26);ctx.lineTo(12,-11);ctx.lineTo(9,13);ctx.lineTo(0,24);ctx.lineTo(-9,13);ctx.lineTo(-12,-11);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=frozen?'#d9f6ff':'#b7ffde';ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(0,22);ctx.lineTo(-9,13);ctx.lineTo(-12,-11);ctx.closePath();ctx.fill();ctx.translate(-x,-y);
 }
 if(hurt||glow){const radius=Math.max(18,W*.065),g=ctx.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,hurt?'rgba(255,80,68,.48)':frozen?'rgba(97,224,255,.42)':'rgba(96,255,187,.44)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);}
 ctx.fillStyle='#10221d';ctx.fillRect(x-bw/2-2,by-2,bw+4,9);ctx.strokeStyle='#95a77f';ctx.lineWidth=1;ctx.strokeRect(x-bw/2-2,by-2,bw+4,9);bar(x-bw/2,by,bw,5,S.wallHp/S.wallMax,hurt?colors.red:colors.soul);ctx.restore();
}
function ashenArtReady(){return typeof ashenBattlefieldArt!=='undefined'&&!!ashenBattlefieldArt;}
function drawAshenAltar(hurt,glow){
 const W=worldW(),x=W*.089,y=WORLD_H*.43,bw=Math.min(68,W*.12),by=WORLD_H*.29;ctx.save();
 if(!ashenArtReady()){ctx.fillStyle='#392724';ctx.beginPath();ctx.ellipse(x,y+22,23,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ed6e28';ctx.strokeStyle='#ffd287';ctx.beginPath();ctx.moveTo(x,y-27);ctx.lineTo(x+13,y-10);ctx.lineTo(x+9,y+15);ctx.lineTo(x,y+25);ctx.lineTo(x-10,y+12);ctx.lineTo(x-13,y-10);ctx.closePath();ctx.fill();ctx.stroke();}
 if(hurt||glow){const radius=Math.max(18,W*.065),g=ctx.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,hurt?'rgba(255,55,35,.48)':'rgba(255,157,66,.42)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);}
 ctx.fillStyle='#231b1b';ctx.fillRect(x-bw/2-2,by-2,bw+4,9);ctx.strokeStyle='#ce9562';ctx.strokeRect(x-bw/2-2,by-2,bw+4,9);bar(x-bw/2,by,bw,5,S.wallHp/S.wallMax,hurt?colors.red:colors.soul);ctx.restore();
}
function cathedralArtReady(){return typeof cathedralBattlefieldArt!=='undefined'&&!!cathedralBattlefieldArt;}
function drawCathedralAltar(hurt,glow){const W=worldW(),x=W*.079,y=WORLD_H*.37,bw=Math.min(68,W*.12),by=WORLD_H*.20;ctx.save();if(!cathedralArtReady()){ctx.fillStyle='#382a50';ctx.beginPath();ctx.ellipse(x,y+25,24,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#a66eea';ctx.strokeStyle='#f2ceff';ctx.beginPath();ctx.moveTo(x,y-28);ctx.lineTo(x+14,y-9);ctx.lineTo(x+10,y+20);ctx.lineTo(x,y+29);ctx.lineTo(x-14,y+10);ctx.lineTo(x-14,y-9);ctx.closePath();ctx.fill();ctx.stroke();}if(hurt||glow){const q=Math.max(18,W*.065),g=ctx.createRadialGradient(x,y,0,x,y,q);g.addColorStop(0,hurt?'rgba(255,55,65,.48)':'rgba(185,92,255,.45)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-q,y-q,q*2,q*2);}ctx.fillStyle='#24192f';ctx.fillRect(x-bw/2-2,by-2,bw+4,9);ctx.strokeStyle='#ccae7c';ctx.strokeRect(x-bw/2-2,by-2,bw+4,9);bar(x-bw/2,by,bw,5,S.wallHp/S.wallMax,hurt?colors.red:colors.soul);ctx.restore();}
function drawInkAltar(t){
 const hurt=S.fx.some(f=>f.k==='altar'),glow=S.fx.some(f=>f.k==='altarGlow');
 if(biomeId(S)==='cathedral'){drawCathedralAltar(hurt,glow);return;}
 if(biomeId(S)==='ashen'){drawAshenAltar(hurt,glow);return;}
 if(biomeId(S)==='frozen'){drawForestAltar(hurt,glow,true);return;}
 if(biomeDef(S).backdrop==='forest'){drawForestAltar(hurt,glow);return;}
 // The illustrated backdrop already contains the crystal altar. Only the dynamic overlay is drawn here.
 if(battlefieldArt&&biomeDef(S).backdrop==='valley'){
  const W=worldW(),x=W*(79/1100),y=WORLD_H*(198/500),bw=Math.min(68,W*.12),by=WORLD_H*.27;
  ctx.save();
  if(hurt||glow){const r=Math.max(18,W*.065),g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,hurt?'rgba(255,80,68,.48)':'rgba(97,224,255,.42)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  ctx.fillStyle='#121821';ctx.fillRect(x-bw/2-2,by-2,bw+4,9);ctx.strokeStyle='#a58b61';ctx.lineWidth=1;ctx.strokeRect(x-bw/2-2,by-2,bw+4,9);bar(x-bw/2,by,bw,5,S.wallHp/S.wallMax,hurt?colors.red:colors.soul);ctx.restore();return;
 }
 ctx.save();ctx.fillStyle=hurt?'#753c48':'#29232f';ctx.fillRect(0,0,WALL_X-3,WORLD_H);
 ctx.strokeStyle='#b4a080';ctx.lineWidth=1;
 for(const x of [3,WALL_X-9]){ctx.fillStyle='#574957';ctx.fillRect(x,0,5,WORLD_H);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD_H);ctx.stroke();}
 for(let i=0;i<3;i++){
  const y=30+i*74;ctx.fillStyle='#191c24';ctx.beginPath();ctx.moveTo(9,y+50);ctx.lineTo(9,y+15);ctx.quadraticCurveTo(9,y+5,19,y-2);ctx.quadraticCurveTo(30,y+5,30,y+15);ctx.lineTo(30,y+50);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.globalAlpha=glow?1:.76+.14*Math.sin(t*2+i);sprite('alma',20,y+24,28,{frame:Math.floor(t*4+i)%4});ctx.globalAlpha=1;
  ctx.fillStyle='#ac9b7e';ctx.fillRect(8,y+49,24,3);ctx.fillStyle='#302735';ctx.fillRect(12,y+53,16,5);
  ctx.strokeStyle='#746475';for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(10+j*7,y+61);ctx.lineTo(14+j*7,y+64);ctx.stroke();}ctx.strokeStyle='#b4a080';
 }
 if(glow){ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(158,215,185,.16)';ctx.fillRect(0,0,WALL_X+6,WORLD_H);}
 ctx.restore();bar(5,8,WALL_X-14,5,S.wallHp/S.wallMax,colors.soul);
}
function drawInkReserve(W){
 ctx.save();ctx.fillStyle='#141b25';ctx.fillRect(0,WORLD_H,W,LOGIC_H-WORLD_H);ctx.strokeStyle='#46382c';ctx.lineWidth=1;
 for(let x=0;x<W;x+=38){ctx.beginPath();ctx.moveTo(x,WORLD_H+1);ctx.lineTo(x+7,WORLD_H+9);ctx.lineTo(x+34,WORLD_H+9);ctx.stroke();}
 ctx.strokeStyle='#b7a181';ctx.beginPath();ctx.moveTo(0,WORLD_H+1);ctx.lineTo(W,WORLD_H+1);ctx.stroke();ctx.restore();
}
function draw(){
  syncReservePositions();
  const W = worldW(), now=performance.now()/1000, t = (prefs.reduced || motionPreference.matches) ? 0 : now;
  ctx.save();
  const camera=feelCamera();ctx.translate(camera.x,camera.y);
  drawInkBackdrop(W);regionalAmbient(W);frostDrawWeather(W);ashDrawWeather(W);
  if (S.phase === 'prep') {
    const zm = zoneMax();
    ctx.fillStyle = colors.soul; ctx.globalAlpha = 0.05; ctx.fillRect(WALL_X, 0, zm - WALL_X, WORLD_H); ctx.globalAlpha = 1;
    ctx.setLineDash([6, 6]); ctx.strokeStyle = colors.gold; ctx.beginPath(); ctx.moveTo(zm, 0); ctx.lineTo(zm, WORLD_H); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '600 11px Rubik, sans-serif'; ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left'; ctx.fillStyle = colors.gold; ctx.fillText((biomeId(S)==='valley'?'YOUR VALLEY':biomeDef(S).name.toUpperCase())+' · drag your monsters', WALL_X + 8, WORLD_H - 8);
    const entry=invasionX(W);ctx.strokeStyle='#e7a36c';ctx.globalAlpha=.5;ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(entry,10);ctx.lineTo(entry,WORLD_H-22);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;ctx.textAlign='right';ctx.fillStyle=colors.steel;ctx.fillText('← INVASION ENTRY',W-8,WORLD_H-8);
  }
  for (const z of S.zones) { ctx.fillStyle = colors.muted; ctx.globalAlpha = .14 + .06 * Math.sin(t * 12); ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }

  bossWindupAccents(W);
  bossDrawWarnings(W);
  feelDraw('ground');
  vfxProjectileLights(S.shots);
  drawInkAltar(t);

  // Reserve (debajo del campo): 3 lugares; los monsters de acá no pelean.
  const dragU = S.drag && S.drag.moved ? S.drag.u : null, plan = dragU ? dropPlan(dragU) : null;
  drawInkReserve(W);
  ctx.strokeStyle = colors.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, WORLD_H + .5); ctx.lineTo(W, WORLD_H + .5); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const p = benchSlot(i), hot = plan && plan.kind === 'bench' && plan.slot === i;
    ctx.fillStyle = hot ? colors.soul : colors.panel; ctx.globalAlpha = hot ? .25 : 1; ctx.fillRect(p.x - 26, p.y - 26, 52, 52); ctx.globalAlpha = 1;
    const bevel=(r,cut)=>{ctx.beginPath();ctx.moveTo(p.x-r+cut,p.y-r);ctx.lineTo(p.x+r-cut,p.y-r);ctx.lineTo(p.x+r,p.y-r+cut);ctx.lineTo(p.x+r,p.y+r-cut);ctx.lineTo(p.x+r-cut,p.y+r);ctx.lineTo(p.x-r+cut,p.y+r);ctx.lineTo(p.x-r,p.y+r-cut);ctx.lineTo(p.x-r,p.y-r+cut);ctx.closePath();};
    bevel(26,6);ctx.strokeStyle=hot?colors.soul:'#d5a35e';ctx.lineWidth=1.4;ctx.stroke();bevel(23,5);ctx.strokeStyle='#725031';ctx.lineWidth=.9;ctx.stroke();
    if(!S.bench[i]){ctx.strokeStyle='#ac9b8266';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p.x-5,p.y);ctx.lineTo(p.x+5,p.y);ctx.moveTo(p.x,p.y-5);ctx.lineTo(p.x,p.y+5);ctx.stroke();}
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '600 11px Rubik, sans-serif';
  ctx.fillStyle = colors.gold; ctx.fillText('RESERVE ('+S.bench.filter(Boolean).length+'/3)', benchSlot(2).x + 40, WORLD_H + 22);
  ctx.fillStyle = colors.muted; ctx.fillText(sharedReserve() ? 'Train +50% / wave' : W < 600 ? 'train +50% / wave' : 'do not fight · train +50% per wave (max +150%)', benchSlot(2).x + 40, WORLD_H + 40);
  if(sharedReserve()){ctx.font='500 9px Rubik, sans-serif';ctx.fillText('Max +150% · no combat',benchSlot(2).x+40,WORLD_H+52);}
  if (plan && plan.kind === 'sell') {
    ctx.fillStyle = colors.gold; ctx.globalAlpha = .35; ctx.fillRect(0, 0, WALL_X, WORLD_H); ctx.globalAlpha = 1;
    ctx.fillStyle = colors.gold; ctx.font = '600 13px Rubik, sans-serif'; ctx.fillText(`Sell: +${plan.value} souls`, WALL_X + 8, Math.max(20, dragU.y - 34));
  }
  // Hover range is a world-space overlay, clipped to the combat area (not reserve).
  const hovered=tacticalHovered(),show=dragU||hovered;
  if(show&&show.y<WORLD_H&&!show.down){
    ctx.save();ctx.beginPath();ctx.rect(0,0,W,WORLD_H);ctx.clip();
    const ring=(x,y,rr,c,dash)=>{if(!(rr>0))return;ctx.fillStyle=c;ctx.globalAlpha=.065;ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.82;ctx.strokeStyle=c;ctx.lineWidth=1.6;ctx.setLineDash(dash);ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);};
    if(S.enemies.includes(show)){
      if(enemyRanged(show))ring(show.x,show.y,show.range,colors.red,[5,4]);
      else if(show.kind==='cle')ring(show.x,show.y,100,colors.red,[5,4]);
    }else{
      const st=stats(show.type,show.lvl,show),base=BASE[show.type];
      if(base.guard){ring(S.phase==='fight'?(show.hx??show.x):show.x,S.phase==='fight'?(show.hy??show.y):show.y,guardOf(show),colors.gold,[6,5]);ring(show.x,show.y,st.range+radius(show),colors.soul,[3,3]);}
      else ring(show.x,show.y,base.support?st.range:st.range+radius(show),colors.soul,[6,5]);
    }ctx.restore();
  }
  if (dragU) {
    allMine().forEach(o => { if (mergeable(o, dragU)) { const hot = plan && plan.kind === 'merge' && plan.target === o; ctx.strokeStyle = colors.gold; ctx.lineWidth = hot ? 4 : 2; ctx.globalAlpha = hot ? 1 : .6 + .3 * Math.sin(t * 6); ctx.beginPath(); ctx.arc(o.x, o.y, Math.min(radius(o), 22) + 10, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; } });
    if (plan.kind === 'bad') { ctx.strokeStyle = colors.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dragU.x, dragU.y, radius(dragU) + 6, 0, Math.PI * 2); ctx.stroke(); }
  }

  const hovU = hovered&&!S.enemies.includes(hovered)?hovered:null;
  const hovE = hovered&&S.enemies.includes(hovered)?hovered:null;

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  animDrawCorpses();
  const ents = [...S.units.map(u => ({ u })), ...S.bench.filter(Boolean).map(u => ({ u })), ...S.enemies.map(e => ({ e })),...(heroActive()?[{hero:S.hero}]:[])].sort((a, b) => (a.u || a.e || a.hero).y - (b.u || b.e || b.hero).y);
  for (const it of ents) {
    if(it.hero){heroDraw(it.hero,t);frostDrawStatus(it.hero,42);ashDrawStatus(it.hero,42);catDrawStatus(it.hero,42);continue;}
    if (it.u) {
      const u = it.u, inBench = u.y >= WORLD_H - 6 && !S.units.includes(u), s = inBench ? Math.min(size(u), 44) : size(u) * 1.28, dragging = S.drag && S.drag.u === u, ph = u.ph;
      const pose = feelPose(u,visualPose(u, now)), motion=animMotion(u,pose,feelClock,inBench);
      const art=guardian72Geometry(USPR[u.type],guardian72Level(u),s),uiTop=art?art.top:-s/2;
      const {ox,oy,rot,sx,sy}=motion,frame=pose.frame;
      if (u.down) {   // caído en el piso: acostado, gris, sin barra de vida
        ctx.globalAlpha = .7; sprite(USPR[u.type], u.x, u.y + s * .22, s, { rot:Math.PI / 2, gray:true, guardianLevel:guardian72Level(u) }); ctx.globalAlpha = 1;
        ctx.fillStyle = colors.muted; ctx.font = '600 10px Rubik, sans-serif'; ctx.fillText('fallen', u.x, u.y - s / 2 + 4);
        continue;
      }
      ctx.fillStyle = colors.bg; ctx.globalAlpha = .45; ctx.beginPath(); ctx.ellipse(u.x, u.y + s / 2 - 2, art?Math.min(s*.53,art.width*.38):s/3, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      const bf = bansheeOn(u);
      if (bf > 0) {   // aura de la Banshee: halo violeta que late + notas que suben + etiqueta con el bonus
        const pulse = .5 + .5 * Math.sin(t * 4 + ph);
        ctx.fillStyle = colors.m2; ctx.globalAlpha = .035+.025*pulse; ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 10 + pulse * 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = colors.m2; ctx.globalAlpha = .25+.12*pulse; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 10 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 2; k++) { const q = ((t * .7 + k * .5 + ph) % 1); ctx.globalAlpha = 1 - q; ctx.fillStyle = colors.m2; ctx.font = '600 11px Rubik, sans-serif'; ctx.fillText('♪', u.x - s / 2 + k * s, u.y - q * 26); }
        ctx.globalAlpha = 1; ctx.fillStyle = colors.bg; ctx.fillRect(u.x - 12, u.y + s / 2 + 4, 24, 9); ctx.fillStyle = colors.m2; ctx.font = '600 7px Rubik, sans-serif'; ctx.fillText(`+${Math.round(bf * 100)}%`, u.x, u.y + s / 2 + 8.5);
      }
      if (u.type === 'N' && S.phase === 'fight') { ctx.fillStyle = colors.leaf; ctx.globalAlpha = .5 + .4 * Math.sin(t * 8 + ph); ctx.beginPath(); ctx.arc(u.x + s * .38, u.y - s * .32 + oy, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      if (dragging || hovU === u || S.sel === u) { ctx.fillStyle = colors.soul; ctx.globalAlpha = S.sel === u ? .38 : .28; ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      if (u.pile > 1) { ctx.globalAlpha = .6; sprite(USPR[u.type], u.x + ox - 7, u.y + oy - 5, s, { rot, sx, sy, frame, flipX:pose.flipX, level:u.lvl, guardianLevel:guardian72Level(u) }); ctx.globalAlpha = 1; }
      if (S.buff.haste > 0 && S.phase === 'fight') { ctx.strokeStyle = colors.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 3, 0, Math.PI * 2); ctx.stroke(); }
      if (u.type === 'A' || u.type === 'B') ctx.globalAlpha = .82 + Math.sin(t * 4 + ph) * .1;
      ctx.globalAlpha*=motion.alpha;
      sprite(USPR[u.type], u.x + ox, u.y + oy, s, { flash:u.flash > 0, rot, sx, sy, frame, flipX:pose.flipX, level:u.temp ? 1 : u.lvl, guardianLevel:guardian72Level(u) });
      ctx.globalAlpha = 1;
      if (u.lvl > 1 && !u.temp) { ctx.fillStyle = colors.gold; ctx.font = '11px Rubik, sans-serif'; ctx.fillText('★'.repeat(u.lvl), u.x, u.y + uiTop - 12); }
      if (u.train) { ctx.fillStyle = colors.bg; ctx.fillRect(u.x - s / 2 - 12, u.y + s / 2 - 12, 30, 13); ctx.fillStyle = colors.leaf; ctx.font = '600 10px Rubik, sans-serif'; ctx.fillText(`+${trainingPercent(u)}%`, u.x - s / 2 + 3, u.y + s / 2 - 5); }
      if (u.pile > 1) { ctx.fillStyle = colors.bg; ctx.fillRect(u.x + s / 2 - 16, u.y - s / 2 - 2, 26, 14); ctx.fillStyle = colors.gold; ctx.font = '600 10px Rubik, sans-serif'; ctx.fillText(`${u.pile}/${S.mods.mergeN}`, u.x + s / 2 - 3, u.y - s / 2 + 5); }
      bar(u.x - 17, u.y + uiTop - 7, 34, 5, u.hp / u.maxHp, colors.leaf);ascensionDrawUnit(u,u.y+uiTop-1); infusionDraw(u,s); synergyDraw(u,s);frostDrawStatus(u,s);ashDrawStatus(u,s);catDrawStatus(u,s);if(relicGuardianFactor(u)>1){ctx.save();ctx.strokeStyle='#d0a0ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(u.x,u.y,s*.6,s*.4,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
    } else {
      const e = it.e, K = KIND[e.kind], s = (e.r * 2 + 14) * 1.28, basePose = feelPose(e,visualPose(e, now)), baseMotion=animMotion(e,basePose,feelClock), {pose,motion}=championBossPose(e,basePose,baseMotion);
      const walk=motion.oy,rot=motion.rot;
      if (hovE === e || tacticalEnemySelected(e)) { ctx.strokeStyle = colors.red; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, s / 2 + 6, 0, Math.PI * 2); ctx.stroke(); }
      sprite(enemySprite(e), e.x+motion.ox, e.y + walk, e.kind === 'jin' ? s * 1.15 : s, { flash:e.flash > 0, rot, sx:motion.sx, sy:motion.sy, frame:pose.frame });
      ashDrawStatus(e,s);catDrawStatus(e,s);const regional=regionalDef(e);if(regional){ctx.save();ctx.fillStyle='#162019';ctx.strokeStyle=regional.marker;ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(e.x+s*.36,e.y-s*.3+walk,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=regional.marker;ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(regional.badge,e.x+s*.36,e.y-s*.3+walk);ctx.restore();}
      if(e.boss){ctx.save();ctx.font='700 10px Rubik, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';const label=enemyDisplayName(e),tw=ctx.measureText(label).width+10;ctx.fillStyle='#111821e8';ctx.fillRect(e.x-tw/2,e.y-s/2-22,tw,13);ctx.fillStyle=e.bossId==='huntsman'?'#a7d7aa':e.bossId==='crusader'?'#ffd18a':'#c9d3e8';ctx.fillText(label,e.x,e.y-s/2-15);ctx.restore();}
      if (e.kind === 'ant') { ctx.fillStyle = colors.m; ctx.globalAlpha = .5 + .5 * Math.sin(t * 20 + e.ph); ctx.beginPath(); ctx.arc(e.x - s * .34, e.y - s * .45 + walk, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      if (e.root > 0) { ctx.strokeStyle = colors.leaf; ctx.lineWidth = 3; ctx.strokeRect(e.x - s / 2 - 2, e.y - s / 2 - 2, s + 4, s + 4); }
      bar(e.x - e.r, e.y - s / 2 - 6, e.r * 2, 5, e.hp / e.maxHp, colors.red);ascensionDrawEnemy(e,s);
    }
  }
  if (S.buff.slow > 0 && S.phase === 'fight') { ctx.fillStyle = colors.cream; ctx.globalAlpha = .07; ctx.fillRect(zoneMax() * .6, 0, W, WORLD_H); ctx.globalAlpha = 1; }
  for (const f of S.fx) {
    const a = Math.max(0, f.t / f.T); ctx.globalAlpha = a;
    if(f.k==='ascension')ascensionDrawEffect(f,a);if(f.k==='ascensionSwing')ascensionDrawSwing(f,a);
    if (f.k === 'line') { ctx.strokeStyle = colors[f.c]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); }
    if (f.k === 'fire') { const p = 1 - a, x = f.x1 + (f.x2 - f.x1) * p, y = f.y1 + (f.y2 - f.y1) * p; ctx.fillStyle = colors.m; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = colors.gold; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
    if (f.k === 'ring') { ctx.strokeStyle = colors[f.c]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.2 - a * 0.5), 0, Math.PI * 2); ctx.stroke(); }
    if (false && f.k === 'claw') { ctx.strokeStyle = colors[f.c]; ctx.lineWidth = 2.5; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(f.x - 9 + k * 6, f.y - 11); ctx.lineTo(f.x + 5 + k * 6, f.y + 11); ctx.stroke(); } }
    if (false && f.k === 'slash') { ctx.strokeStyle = colors[f.c]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(f.x - 8, f.y - 10); ctx.lineTo(f.x + 8, f.y + 10); ctx.stroke(); }
    if (f.k === 'quake') { ctx.fillStyle = colors.stone; ctx.globalAlpha = a * .4; ctx.fillRect(0, 0, W, WORLD_H); }
    if (f.k === 'zap') {   // rayo zigzagueante con núcleo blanco
      const n = 7, pts = [[f.x1, f.y1]];
      for (let i = 1; i < n; i++) { const p = i / n; pts.push([f.x1 + (f.x2 - f.x1) * p + rnd(-6, 6), f.y1 + (f.y2 - f.y1) * p + rnd(-12, 12)]); }
      pts.push([f.x2, f.y2]);
      [[6, 'soul', .35], [3, 'soul', 1], [1.2, 'cream', 1]].forEach(([lw, c, al]) => { ctx.globalAlpha = a * al; ctx.strokeStyle = colors[c]; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); });
    }
    if (f.k === 'fusion') {
      ctx.strokeStyle = colors.gold; ctx.lineWidth = 4;
      for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(f.x, f.y, 10 + (1 - a) * (50 + k * 30), 0, Math.PI * 2); ctx.stroke(); }
      for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4, d = 20 + (1 - a) * 60; ctx.fillStyle = colors.soul; ctx.fillRect(f.x + Math.cos(ang) * d - 2, f.y + Math.sin(ang) * d - 2, 4, 4); }
    }
    ctx.globalAlpha = 1;
  }
  feelDraw('front');
  for (const p of S.parts) { ctx.globalAlpha = Math.max(0, p.t / p.T); ctx.fillStyle = colors[p.c]; ctx.beginPath();ctx.ellipse(p.x,p.y,p.s*.65,p.s*.35,.6,0,Math.PI*2);ctx.fill(); }
  ctx.globalAlpha = 1;
  const shotDetail=vfxBudget().detailShots;
  for (let i=0;i<S.shots.length;i++) drawInkShot(S.shots[i],t,i>=S.shots.length-shotDetail);
  for (const f of S.floats) {
    ctx.globalAlpha = Math.max(0, f.t / f.T); ctx.fillStyle = colors[f.c]; ctx.font = `600 ${f.sz || 13}px Rubik, sans-serif`;
    const fy=f.y-(feelReduced()?0:(1-f.t/f.T)*30);
    ctx.lineWidth=3;ctx.strokeStyle='#10131d';ctx.lineJoin='round';ctx.strokeText(f.text,f.x,fy);ctx.fillText(f.text,f.x,fy);ctx.globalAlpha=1;
  }
  if (S.aim !== null && S.aimP) {
    const c = CARDS[S.hand[S.aim].id];
    ctx.strokeStyle = colors.soul; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(S.aimP.x, S.aimP.y, c.aim, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  if (S.aim !== null) { ctx.fillStyle = colors.soul; ctx.font = '600 12px Rubik, sans-serif'; ctx.fillText('Click the field to cast · time slowed', W / 2, 38); }
  ctx.restore();
}
function bar(x, y, w, h, p, c){ ctx.fillStyle = colors.bg; ctx.fillRect(x, y, w, h); ctx.fillStyle = c; ctx.fillRect(x, y, w * clamp(p, 0, 1), h); }


function sprite(name,x,y,h,o={}){
 const frames=guardian72Frames(name,o)||(o.flash?SPRW[name]:o.gray?SPRGRAY[name]:(SPRLEVEL[name]?.[o.guardianLevel??o.level]||SPR[name]));
 if(!frames?.length){ctx.fillStyle='#d6bc85';ctx.fillRect(x-8,y-8,16,16);return;}
 const fr=frames[Math.abs(Math.floor(o.frame||0))%frames.length];if(!fr){ctx.fillStyle=MONSTER_TINT[name]||'#b7bbd4';ctx.fillRect(x-h*.22,y-h*.35,h*.44,h*.7);ctx.fillStyle='#201b32';ctx.fillRect(x-h*.12,y-h*.16,h*.08,h*.08);ctx.fillRect(x+h*.04,y-h*.16,h*.08,h*.08);return;}const w=h*fr.width/fr.height;const geom=guardian72Frames(name,o)?guardian72Geometry(name,o.guardianLevel??o.level??1,h):null;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));if(o.rot&&(!feelReduced()||o.gray))ctx.rotate(o.rot);if(o.flipX||o.sy||o.sx)ctx.scale((o.flipX?-1:1)*(o.sx||1),o.sy||1);if(geom&&!fr.image&&!o.gray)ctx.drawImage(fr,geom.x,geom.y,fr.width*geom.k,fr.height*geom.k);else if(fr.image)ctx.drawImage(fr.image,fr.sx,fr.sy,fr.width,fr.height,-w/2,-h/2,w,h);else ctx.drawImage(fr,-w/2,-h/2,w,h);ctx.restore();
}
let bgCache=null,bgWidth=0;
function drawV18Field(W){
 if(!bgCache||bgWidth!==Math.ceil(W)){
 bgWidth=Math.ceil(W);bgCache=inkCanvas(bgWidth,WORLD_H);const g=bgCache.getContext('2d');
 let seed=817;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
 rect(0,0,W,WORLD_H,'#53613c');
 for(let y=0;y<WORLD_H;y+=5)for(let x=0;x<W;x+=5){const p=rnd();rect(x,y,5,5,['#53613c','#57663e','#617047','#4b5835','#657047'][Math.floor(p*5)]);if(rnd()<.18)rect(x+1,y+1,2,2,'#829050');}
 const py=99;
 rect(0,py-5,W,78,'#41423b');rect(0,py,W,68,'#696965');
 for(let y=py;y<py+68;y+=13)for(let x=-14;x<W;x+=25){const xx=x+((y-py)/13%2)*12;const c=['#85847a','#787970','#929084','#74766f'][Math.floor(rnd()*4)];rect(xx+1,y+1,23,11,c);rect(xx+2,y+1,20,2,'#a09b88');rect(xx+2,y+10,22,2,'#4e504a');if(rnd()<.35)rect(xx+4,y+5,7,1,'#666b60');}
 function stone(x,y,w,h){rect(x+2,y+3,w,h,'#303a35');rect(x,y,w,h,'#50565c');rect(x+2,y+1,w-4,3,'#85888b');rect(x+2,y+4,w-4,h-6,'#6a7074');rect(x+w-4,y+3,3,h-3,'#383f49');}
 function pine(x,y){rect(x-3,y-2,6,14,'#594638');for(let i=0;i<4;i++){let ww=9+i*5, yy=y-37+i*8;g.fillStyle='#253d35';g.beginPath();g.moveTo(x,yy-8);g.lineTo(x-ww,yy+11);g.lineTo(x+ww,yy+11);g.closePath();g.fill();g.fillStyle='#3f5940';g.beginPath();g.moveTo(x-1,yy-7);g.lineTo(x-ww+3,yy+8);g.lineTo(x+2,yy+6);g.closePath();g.fill();}}
 for(let x=65;x<W-20;x+=62){let q=rnd();if(q<.45){for(let j=0;j<3;j++)stone(x+j*13,7+(j%2)*5,12,15);stone(x+13,0,13,24);}else pine(x,43);if(rnd()<.63)pine(x+15,255);else {stone(x,239,17,13);stone(x+16,245,11,8);}}
 for(let i=0;i<W*1.2;i++){let x=42+rnd()*(W-42),y=rnd()*WORLD_H;if(y>py-8&&y<py+77)continue;rect(x,y,2,3,rnd()<.5?'#354c32':'#98a05d');if(rnd()<.08)rect(x+2,y,2,2,'#c9aa68');}
 }ctx.drawImage(bgCache,0,0);
}
/* Forest has its own deterministic raster, built once per logical width.
   No valley backdrop is used here. Combat geometry stays unchanged. */
let forestFieldCache=null,forestFieldWidth=0;
function drawForestBackdrop(W){
 const width=Math.ceil(W);
 if(!forestFieldCache||forestFieldWidth!==width){
  forestFieldWidth=width;forestFieldCache=inkCanvas(width,WORLD_H);const g=forestFieldCache.getContext('2d');
  let seed=2097;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
  const poly=(points,c)=>{g.fillStyle=c;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
  rect(0,0,width,WORLD_H,'#263a2b');
  const moss=['#263a2b','#2c4030','#314633','#354933','#293d2c','#3d4d32'];
  for(let y=0;y<WORLD_H;y+=6)for(let x=0;x<width;x+=6){rect(x,y,6,6,moss[Math.floor(rand()*moss.length)]);if(rand()<.24)rect(x+1,y+1,2,2,'#526047');}
  // A winding earthen path, unlike the straight stone road of the Valley.
  const pathY=x=>WORLD_H*.5+Math.sin(x/width*Math.PI*2)*27+Math.sin(x/width*Math.PI*4)*9;
  const track=(color,lineWidth)=>{g.beginPath();for(let x=0;x<=width+12;x+=12){const y=pathY(x);x===0?g.moveTo(x,y):g.lineTo(x,y);}g.strokeStyle=color;g.lineWidth=lineWidth;g.lineCap='round';g.lineJoin='round';g.stroke();};
  track('#1c2a24',82);track('#524e3d',72);track('#68604a',59);track('#777057',43);
  for(let i=0;i<width*1.8;i++){const x=rand()*width,y=pathY(x)+(rand()-.5)*58;rect(x,y,2+rand()*4,1+rand()*2,rand()<.5?'#4b473b':'#8c8060');}
  // Low moss, roots, fungi and stones make both flanks readable.
  for(let i=0;i<width*.65;i++){const x=45+rand()*Math.max(1,width-45),y=rand()*WORLD_H;if(Math.abs(y-pathY(x))<43)continue;const c=rand();if(c<.7){rect(x,y,3,2,'#64734a');rect(x+2,y-2,2,5,'#3c5639');}else if(c<.93){rect(x,y,6,4,'#303f39');rect(x+1,y,4,1,'#7c8570');}else{rect(x,y,2,5,'#c6a477');rect(x-2,y,6,2,'#9d7254');}}
  function tree(x,y,k){
   g.save();g.translate(x,y);g.scale(k,k);
   g.fillStyle='#0f211d';g.beginPath();g.ellipse(0,7,24,10,0,0,Math.PI*2);g.fill();
   poly([[-8,10],[-5,-18],[-12,-39],[-5,-41],[3,-23],[10,-49],[15,-48],[9,-15],[7,10],[16,15],[0,12],[-17,15]],'#302d24');
   poly([[-3,9],[0,-17],[4,-23],[5,10]],'#716044');
   for(const [dx,dy,rad] of [[-18,-31,15],[15,-37,18],[0,-50,20],[-2,-28,20]]){
    g.fillStyle='#142e25';g.beginPath();g.arc(dx,dy,rad,0,Math.PI*2);g.fill();
    g.fillStyle='#284c36';g.beginPath();g.arc(dx-3,dy-4,rad*.72,0,Math.PI*2);g.fill();
    g.fillStyle='#385a3d';g.beginPath();g.arc(dx-5,dy-7,rad*.4,0,Math.PI*2);g.fill();
   }g.restore();
  }
  for(let x=65;x<width+35;x+=47){tree(x+rand()*14,18+rand()*12,.85+rand()*.38);tree(x+18+rand()*8,WORLD_H+17+rand()*7,.8+rand()*.24);}
  // Tangled silhouettes in the far corners. Do not obstruct units or input.
  const edge=g.createLinearGradient(0,0,0,WORLD_H);edge.addColorStop(0,'#0a191a88');edge.addColorStop(.23,'#0a191a00');edge.addColorStop(.77,'#0a191a00');edge.addColorStop(1,'#0a191a88');g.fillStyle=edge;g.fillRect(0,0,width,WORLD_H);
  const mist=g.createLinearGradient(0,0,width,0);mist.addColorStop(0,'#8eab9222');mist.addColorStop(.4,'#8eab9200');mist.addColorStop(1,'#8eab9218');g.fillStyle=mist;g.fillRect(0,0,width,WORLD_H);
 }
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(forestFieldCache,0,0,W,WORLD_H);ctx.restore();
}
/* Static region art and tactical markings are composited once per logical size.
   No per-frame forest text, ellipse/dash rasterization or filtered SVG work. */
let forestComposite=null,forestCompositeSource=null,forestCompositeW=0,forestCompositeH=0;
function forestStaticLayer(W){
 const source=forestBattlefieldArt;
 if(forestComposite&&source===forestCompositeSource&&W===forestCompositeW&&WORLD_H===forestCompositeH)return forestComposite;
 try{
  // Retain original art's detail, within a fixed allocation budget.
  const density=Math.min(2,1600/W,1000/WORLD_H);
  const layer=inkCanvas(Math.max(1,Math.ceil(W*density)),Math.max(1,Math.ceil(WORLD_H*density))),g=layer.getContext('2d');if(!g)return null;
  g.scale(layer.width/W,layer.height/WORLD_H);g.imageSmoothingEnabled=true;g.drawImage(source,0,0,W,WORLD_H);biomeDraw(W,g);
  forestComposite=layer;forestCompositeSource=source;forestCompositeW=W;forestCompositeH=WORLD_H;return layer;
 }catch(e){return null;}
}
let frozenField=null,frozenFieldW=0,frozenFieldSource=null;
function frozenStaticLayer(W){
 const source=frozenArtReady()?frozenBattlefieldArt:null;
 if(frozenField&&frozenFieldW===W&&frozenFieldSource===source)return frozenField;
 const density=Math.min(2,1600/W,1000/WORLD_H),layer=inkCanvas(Math.ceil(W*density),Math.ceil(WORLD_H*density)),g=layer.getContext('2d');
 g.scale(layer.width/W,layer.height/WORLD_H);
 if(source){g.imageSmoothingEnabled=false;g.drawImage(source,0,0,W,WORLD_H);biomeDraw(W,g);frozenField=layer;frozenFieldW=W;frozenFieldSource=source;return layer;}
 let seed=4137;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const poly=(p,c)=>{g.fillStyle=c;g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 const sky=g.createLinearGradient(0,0,0,WORLD_H);sky.addColorStop(0,'#223748');sky.addColorStop(.25,'#829aa9');sky.addColorStop(.55,'#93aab7');sky.addColorStop(1,'#354f62');g.fillStyle=sky;g.fillRect(0,0,W,WORLD_H);
 for(let i=0;i<W*2;i++){const x=rnd()*W,y=rnd()*WORLD_H;g.fillStyle=rnd()<.5?'#c6d9e655':'#354d6444';g.fillRect(x,y,2+rnd()*5,1+rnd()*2);}
 g.strokeStyle='#465c6a';g.lineWidth=55;g.beginPath();g.moveTo(0,WORLD_H*.5);g.bezierCurveTo(W*.3,WORLD_H*.35,W*.6,WORLD_H*.65,W,WORLD_H*.48);g.stroke();g.strokeStyle='#788c99';g.lineWidth=44;g.stroke();
 for(const z of biomeZones(S,W)){g.fillStyle='#5baac7';g.beginPath();g.ellipse(z.x,z.y,z.rx,z.ry,0,0,Math.PI*2);g.fill();g.strokeStyle='#c6edfa';g.lineWidth=1.5;g.stroke();for(let i=0;i<12;i++){const a=rnd()*Math.PI*2,k=.25+rnd()*.6,x=z.x+Math.cos(a)*z.rx*k,y=z.y+Math.sin(a)*z.ry*k;g.strokeStyle='#d4f3ff88';g.beginPath();g.moveTo(x,y);g.lineTo(x+8,y-4);g.lineTo(x+14,y+1);g.stroke();}}
 for(let x=0;x<W+25;x+=34+rnd()*28){const y=20+rnd()*15,k=22+rnd()*22;poly([[x-20,y+8],[x-12,y-k*.6],[x+2,y-k],[x+17,y-9],[x+23,y+8]],'#233c52');poly([[x-12,y-k*.6],[x+2,y-k],[x+17,y-9],[x+1,y-15]],'#bfd5e4');const b=WORLD_H-8+rnd()*8;poly([[x-14,b+9],[x-8,b-21],[x+4,b-36],[x+13,b-10],[x+25,b+9]],'#284658');poly([[x-8,b-21],[x+4,b-36],[x+13,b-10],[x+2,b-17]],'#9bbccc');}
 biomeDraw(W,g);frozenField=layer;frozenFieldW=W;frozenFieldSource=source;return layer;
}
function frostDrawWeather(W){
 if(!frostBlizzard())return;ctx.save();ctx.fillStyle='#a9d9f211';ctx.fillRect(0,0,W,WORLD_H);ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillStyle='#122b40e8';ctx.fillRect(W/2-91,5,182,19);ctx.fillStyle='#d4f4ff';ctx.fillText('BLIZZARD · REACH −30%',W/2,18);ctx.restore();
}
function frostDrawStatus(u,s){
 if(!frostFrozen(u)&&frostChill(u)===1)return;ctx.save();ctx.strokeStyle=frostFrozen(u)?'#b6f2ff':'#85b7ef';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(u.x,u.y,s*.55,s*.34,0,0,Math.PI*2);ctx.stroke();ctx.restore();
}
let ashenLayer=null,ashenLayerW=0,ashenLayerSource=null;
function ashenStaticLayer(W){const source=ashenArtReady()?ashenBattlefieldArt:null;if(ashenLayer&&ashenLayerW===W&&ashenLayerSource===source)return ashenLayer;const density=Math.min(2,1600/W,1000/WORLD_H),layer=inkCanvas(Math.ceil(W*density),Math.ceil(WORLD_H*density)),g=layer.getContext('2d');g.scale(layer.width/W,layer.height/WORLD_H);g.imageSmoothingEnabled=false;if(source)g.drawImage(source,0,0,W,WORLD_H);else{g.fillStyle='#43312e';g.fillRect(0,0,W,WORLD_H);g.fillStyle='#695048';g.fillRect(0,WORLD_H*.28,W,WORLD_H*.52);}biomeDraw(W,g);ashenLayer=layer;ashenLayerW=W;ashenLayerSource=source;return layer;}
function ashDrawWeather(W){if(!ashActive())return;ctx.save();for(const p of S.ashPatches||[]){if(p.until<=S.fightT)continue;ctx.fillStyle='#f65b292b';ctx.strokeStyle='#ff994a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.stroke();}if(ashCloud()){ctx.fillStyle='#82716c25';ctx.fillRect(0,0,W,WORLD_H);ctx.fillStyle='#251b1be8';ctx.fillRect(W/2-107,5,214,19);ctx.fillStyle='#ffe3c5';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText('ASH CLOUD · DAMAGE −25%',W/2,18);}ctx.restore();}
function ashDrawStatus(u,s){if(!ashActive()||!(u.ashBurnUntil>S.fightT||u.ashBuffUntil>S.fightT))return;ctx.save();ctx.strokeStyle=u.ashBurnUntil>S.fightT?'#ff7034':'#ffcf76';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(u.x,u.y,s*.55,s*.34,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
let catLayer=null,catLayerW=0,catLayerSource=null;
function cathedralStaticLayer(W){const source=cathedralArtReady()?cathedralBattlefieldArt:null;if(catLayer&&catLayerW===W&&catLayerSource===source)return catLayer;const density=Math.min(2,1600/W,1000/WORLD_H),layer=inkCanvas(Math.ceil(W*density),Math.ceil(WORLD_H*density)),g=layer.getContext('2d');g.scale(layer.width/W,layer.height/WORLD_H);g.imageSmoothingEnabled=false;if(source)g.drawImage(source,0,0,W,WORLD_H);else{g.fillStyle='#3c314b';g.fillRect(0,0,W,WORLD_H);g.fillStyle='#665971';g.fillRect(0,WORLD_H*.28,W,WORLD_H*.52);}biomeDraw(W,g);catLayer=layer;catLayerW=W;catLayerSource=source;return layer;}
function catDrawStatus(u,s){if(!catActive()||!(catShieldHP(u)>0||u.catSlowUntil>S.fightT||u.catAscended))return;ctx.save();ctx.strokeStyle=u.catAscended?'#d0a0ff':catShieldHP(u)>0?'#f6d28e':'#c7a3ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(u.x,u.y,s*.55,s*.43,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
function drawInkBackdrop(W){
 if(biomeId(S)==='cathedral'){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(cathedralStaticLayer(W),0,0,W,WORLD_H);ctx.restore();return;}
 if(biomeId(S)==='ashen'){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(ashenStaticLayer(W),0,0,W,WORLD_H);ctx.restore();return;}
 if(biomeId(S)==='frozen'){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(frozenStaticLayer(W),0,0,W,WORLD_H);ctx.restore();return;}
 if(biomeDef(S).backdrop==='forest'){
  if(forestArtReady()){
   const layer=forestStaticLayer(W);
   ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(layer||forestBattlefieldArt,0,0,W,WORLD_H);ctx.restore();
   if(!layer)biomeDraw(W);
  }else{drawForestBackdrop(W);biomeDraw(W);}
  return;
 }
 if(!battlefieldArt){drawV18Field(W);return;}ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(battlefieldArt,0,0,W,WORLD_H);ctx.restore();
}
function drawInkShot(s,t,detail=true){vfxShotBody(s,t,detail);}
function hybridFX(){
 if(prefs.effects==='off')return;
 const t=performance.now()/1000;
 for(const f of S.fx){if(!['sword','claw','slash'].includes(f.k))continue;const a=Math.max(0,f.t/f.T),pal=HYBRID.palette[f.k==='claw'?'claw':'slash'];ctx.save();ctx.globalAlpha=a*(prefs.effects==='soft'?.55:1);ctx.translate(f.x,f.y);if(f.angle)ctx.rotate(f.angle);
 if(f.k==='claw'){for(let j=0;j<3;j++)for(let k=0;k<3;k++){ctx.strokeStyle=pal[k];ctx.lineWidth=[5,3,1][k];ctx.beginPath();ctx.moveTo(-10+j*6,-16);ctx.quadraticCurveTo(-4+j*6,-3,5+j*6,14);ctx.stroke();}}
 else{for(let k=0;k<3;k++){ctx.strokeStyle=pal[k];ctx.lineWidth=[9,5,1.5][k];ctx.beginPath();ctx.ellipse(0,0,22+(1-a)*12,12+(1-a)*5,-.6,-2.1,1.1);ctx.stroke();}for(let j=0;j<4;j++){ctx.fillStyle=pal[j%3];ctx.fillRect(Math.round(20-j*7+(1-a)*18),Math.round(-16+j*3),2,2);}}
 ctx.restore();}

}
function renderFrame(){draw();ctx.save();const camera=feelCamera();ctx.translate(camera.x,camera.y);hybridFX();spellDraw();championDrawFX();heroDrawLanding();martialDraw();heroDrawAim();heroDrawDescent(performance.now()/1000);ctx.restore();}
