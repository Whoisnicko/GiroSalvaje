/* v19 renderer: canvas presentation, shared state from game core. Classic script; loaded before core. */
function drawInkAltar(t){
 const hurt=S.fx.some(f=>f.k==='altar'),glow=S.fx.some(f=>f.k==='altarGlow');
 // The illustrated backdrop already contains the crystal altar. Only the dynamic overlay is drawn here.
 if(battlefieldArt){
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
function drawTerrain(t){
 ctx.save();ctx.lineWidth=1;
 for(const [key,type]of S.ter){
  const[c,r]=key.split(',').map(Number),x=c*TILE,y=r*TILE;
  ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,TILE-2,TILE-2);ctx.clip();
  ctx.fillStyle=type==='water'?'rgba(48,75,76,.85)':type==='hill'?'rgba(119,112,80,.65)':'rgba(65,73,59,.85)';ctx.fillRect(x+1,y+1,TILE-2,TILE-2);
  ctx.strokeStyle=type==='water'?'#9cb7a6':type==='hill'?'#d1c39c':'#9aab79';
  if(type==='hill'){
   ctx.fillStyle='#575346';ctx.beginPath();ctx.moveTo(x+2,y+46);ctx.quadraticCurveTo(x+25,y-10,x+50,y+46);ctx.closePath();ctx.fill();
   for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(x+9+i*4,y+39-i*4);ctx.lineTo(x+20+i*3,y+32-i*3);ctx.stroke();}
   ctx.fillStyle='#b4aa8c';ctx.beginPath();ctx.moveTo(x+24,y+11);ctx.lineTo(x+27,y+5);ctx.lineTo(x+31,y+12);ctx.lineTo(x+28,y+21);ctx.lineTo(x+23,y+21);ctx.closePath();ctx.fill();
  }else if(type==='water'){
   for(let i=0;i<7;i++){const off=Math.sin(t*1.3+i+c)*3;ctx.beginPath();ctx.moveTo(x+5+off,y+6+i*6);ctx.bezierCurveTo(x+18+off,y+3+i*6,x+27-off,y+10+i*6,x+44-off,y+6+i*6);ctx.stroke();}
  }else{
   for(let i=0;i<5;i++){const bx=x+9+i*8,by=y+13+(i*13)%29;ctx.globalAlpha=.45;ctx.beginPath();ctx.ellipse(bx,by,4+Math.sin(t+i),1.5,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(bx,y+50);ctx.lineTo(bx-2,y+36-(i%3)*4);ctx.lineTo(bx+3,y+42);ctx.stroke();}
  }
  ctx.restore();ctx.strokeStyle=type==='water'?'#7c9b93':type==='hill'?'#a99b71':'#788363';ctx.strokeRect(x+1.5,y+1.5,TILE-3,TILE-3);
 }
 ctx.restore();
}
function drawInkReserve(W){
 ctx.save();ctx.fillStyle='#201d26';ctx.fillRect(0,WORLD_H,W,LOGIC_H-WORLD_H);ctx.strokeStyle='#695b65';ctx.lineWidth=1;
 for(let x=0;x<W;x+=38){ctx.beginPath();ctx.moveTo(x,WORLD_H+1);ctx.lineTo(x+7,WORLD_H+9);ctx.lineTo(x+34,WORLD_H+9);ctx.stroke();}
 ctx.strokeStyle='#b7a181';ctx.beginPath();ctx.moveTo(0,WORLD_H+1);ctx.lineTo(W,WORLD_H+1);ctx.stroke();ctx.restore();
}
function draw(){
  const W = worldW(), t = (prefs.reduced || motionPreference.matches) ? 0 : performance.now() / 1000;
  ctx.save();
  if (!prefs.reduced && !motionPreference.matches && S.shake > 0) ctx.translate(rnd(-1, 1) * S.shake, rnd(-1, 1) * S.shake);
  drawInkBackdrop(W);
  drawTerrain(t);
  if (S.phase === 'prep') {
    const zm = zoneMax();
    ctx.fillStyle = colors.soul; ctx.globalAlpha = 0.05; ctx.fillRect(WALL_X, 0, zm - WALL_X, WORLD_H); ctx.globalAlpha = 1;
    ctx.setLineDash([6, 6]); ctx.strokeStyle = colors.gold; ctx.beginPath(); ctx.moveTo(zm, 0); ctx.lineTo(zm, WORLD_H); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '600 11px Rubik, sans-serif'; ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left'; ctx.fillStyle = colors.gold; ctx.fillText('YOUR VALLEY · drag your monsters', WALL_X + 8, WORLD_H - 8);
    ctx.textAlign = 'right'; ctx.fillStyle = colors.steel; ctx.fillText('invasion arrives here →', W - 8, WORLD_H - 8);
  }
  if (aimingTerrain() && S.aimP) {
    const C = CARDS[S.hand[S.aim].id], c = colOf(S.aimP.x), r = rowOf(S.aimP.y), ok = canPlaceTile(c, r, C.tile);
    ctx.strokeStyle = ok ? colors.soul : colors.red; ctx.lineWidth = 3; ctx.strokeRect(c * TILE + 2, r * TILE + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = ok ? colors.soul : colors.red; ctx.globalAlpha = .15; ctx.fillRect(c * TILE, r * TILE, TILE, TILE); ctx.globalAlpha = 1;
  }
  for (const z of S.zones) { ctx.fillStyle = colors.muted; ctx.globalAlpha = .14 + .06 * Math.sin(t * 12); ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }

  drawInkAltar(t);

  // Reserve (debajo del campo): 3 lugares; los monsters de acá no pelean.
  const dragU = S.drag && S.drag.moved ? S.drag.u : null, plan = dragU ? dropPlan(dragU) : null;
  drawInkReserve(W);
  ctx.strokeStyle = colors.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, WORLD_H + .5); ctx.lineTo(W, WORLD_H + .5); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const p = benchSlot(i), hot = plan && plan.kind === 'bench' && plan.slot === i;
    ctx.fillStyle = hot ? colors.soul : colors.panel; ctx.globalAlpha = hot ? .25 : 1; ctx.fillRect(p.x - 26, p.y - 26, 52, 52); ctx.globalAlpha = 1;
    ctx.strokeStyle = hot ? colors.soul : colors.gold; ctx.beginPath(); ctx.moveTo(p.x-25,p.y+25);ctx.lineTo(p.x-25,p.y-7);ctx.quadraticCurveTo(p.x-25,p.y-22,p.x,p.y-27);ctx.quadraticCurveTo(p.x+25,p.y-22,p.x+25,p.y-7);ctx.lineTo(p.x+25,p.y+25);ctx.closePath();ctx.stroke();
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '600 11px Rubik, sans-serif';
  ctx.fillStyle = colors.gold; ctx.fillText('RESERVE', benchSlot(2).x + 40, WORLD_H + 22);
  ctx.fillStyle = colors.muted; ctx.fillText(W < 600 ? 'train +50% / wave' : 'do not fight · train +50% per wave (max +150%)', benchSlot(2).x + 40, WORLD_H + 40);
  if (plan && plan.kind === 'sell') {
    ctx.fillStyle = colors.gold; ctx.globalAlpha = .35; ctx.fillRect(0, 0, WALL_X, WORLD_H); ctx.globalAlpha = 1;
    ctx.fillStyle = colors.gold; ctx.font = '600 13px Rubik, sans-serif'; ctx.fillText(`Sell: +${plan.value} souls`, WALL_X + 8, Math.max(20, dragU.y - 34));
  }
  // Alcance del monstruo seleccionado o arrastrado
  const show = dragU || (S.sel && (S.units.includes(S.sel) || S.bench.includes(S.sel)) ? S.sel : null);
  if (show && show.y < WORLD_H) {
    const st = stats(show.type, show.lvl, show), rr = BASE[show.type].guard ? guardOf(show) : BASE[show.type].support ? st.range : st.range + radius(show);
    ctx.fillStyle = colors.soul; ctx.globalAlpha = .07; ctx.beginPath(); ctx.arc(show.x, show.y, rr, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.soul; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(show.x, show.y, rr, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  if (dragU) {
    allMine().forEach(o => { if (mergeable(o, dragU)) { const hot = plan && plan.kind === 'merge' && plan.target === o; ctx.strokeStyle = colors.gold; ctx.lineWidth = hot ? 4 : 2; ctx.globalAlpha = hot ? 1 : .6 + .3 * Math.sin(t * 6); ctx.beginPath(); ctx.arc(o.x, o.y, Math.min(radius(o), 22) + 10, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; } });
    if (plan.kind === 'bad') { ctx.strokeStyle = colors.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dragU.x, dragU.y, radius(dragU) + 6, 0, Math.PI * 2); ctx.stroke(); }
  }

  const hovU = S.aimP && !S.drag && S.aim === null ? unitAt(S.aimP) : null;
  const hovE = S.aimP && !hovU && S.aim === null ? enemyAt(S.aimP) : null;

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const ents = [...S.units.map(u => ({ u })), ...S.bench.filter(Boolean).map(u => ({ u })), ...S.enemies.map(e => ({ e }))].sort((a, b) => (a.u || a.e).y - (b.u || b.e).y);
  for (const it of ents) {
    if (it.u) {
      const u = it.u, inBench = u.y >= WORLD_H - 6 && !S.units.includes(u), s = inBench ? Math.min(size(u), 44) : size(u) * 1.28, dragging = S.drag && S.drag.u === u, ph = u.ph;
      const pose = visualPose(u, performance.now() / 1000), phTime = motionPreference.matches ? 0 : t;
      const lg = !motionPreference.matches && u.lunge > 0 ? (u.lunge / .14) * 4 : 0;
      let ox = (u.lx || 0) * lg, oy = (u.ly || 0) * lg, rot = 0, sy = 1, frame = pose.frame;
      if (!motionPreference.matches) {
        if (u.type === 'A' || u.type === 'B') oy += Math.sin(phTime * 2.6 + ph) * 2;
        if (u.type === 'M') oy += Math.sin(phTime * 3 + ph) * 1.5 - 3;
        if (u.moving) oy -= Math.abs(Math.sin(phTime * (u.type === 'W' ? 5 : 10) + ph)) * 1.5;
        if (u.type === 'W' && u.moving) rot = Math.sin(phTime * 5 + ph) * .045;
        if (pose.rise < 1) { const ease = 1 - Math.pow(1 - pose.rise, 3); rot += (1 - ease) * Math.PI / 2; oy += (1 - ease) * s * .22; }
      }
      if (u.down) {   // caído en el piso: acostado, gris, sin barra de vida
        ctx.globalAlpha = .7; sprite(USPR[u.type], u.x, u.y + s * .22, s, { rot:Math.PI / 2, gray:true }); ctx.globalAlpha = 1;
        ctx.fillStyle = colors.muted; ctx.font = '600 10px Rubik, sans-serif'; ctx.fillText('fallen', u.x, u.y - s / 2 + 4);
        continue;
      }
      ctx.fillStyle = colors.bg; ctx.globalAlpha = .45; ctx.beginPath(); ctx.ellipse(u.x, u.y + s / 2 - 2, s / 3, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      const bf = bansheeOn(u);
      if (bf > 0) {   // aura de la Banshee: halo violeta que late + notas que suben + etiqueta con el bonus
        const pulse = .5 + .5 * Math.sin(t * 4 + ph);
        ctx.fillStyle = colors.m2; ctx.globalAlpha = .16 + .1 * pulse; ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 10 + pulse * 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = colors.m2; ctx.globalAlpha = .55 + .3 * pulse; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 10 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 2; k++) { const q = ((t * .7 + k * .5 + ph) % 1); ctx.globalAlpha = 1 - q; ctx.fillStyle = colors.m2; ctx.font = '600 11px Rubik, sans-serif'; ctx.fillText('♪', u.x - s / 2 + k * s, u.y - q * 26); }
        ctx.globalAlpha = 1; ctx.fillStyle = colors.bg; ctx.fillRect(u.x - 15, u.y + s / 2 + 7, 30, 12); ctx.fillStyle = colors.m2; ctx.font = '600 9px Rubik, sans-serif'; ctx.fillText(`+${Math.round(bf * 100)}%`, u.x, u.y + s / 2 + 13);
      }
      if (u.type === 'N' && S.phase === 'fight') { ctx.fillStyle = colors.leaf; ctx.globalAlpha = .5 + .4 * Math.sin(t * 8 + ph); ctx.beginPath(); ctx.arc(u.x + s * .38, u.y - s * .32 + oy, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      if (dragging || hovU === u || S.sel === u) { ctx.fillStyle = colors.soul; ctx.globalAlpha = S.sel === u ? .38 : .28; ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      if (u.pile > 1) { ctx.globalAlpha = .6; sprite(USPR[u.type], u.x + ox - 7, u.y + oy - 5, s, { rot, sy, frame, level:u.lvl }); ctx.globalAlpha = 1; }
      if (S.buff.haste > 0 && S.phase === 'fight') { ctx.strokeStyle = colors.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 3, 0, Math.PI * 2); ctx.stroke(); }
      if (u.type === 'A' || u.type === 'B') ctx.globalAlpha = .82 + Math.sin(t * 4 + ph) * .1;
      sprite(USPR[u.type], u.x + ox, u.y + oy, s, { flash:u.flash > 0, rot, sy, frame, level:u.temp ? 1 : u.lvl });
      ctx.globalAlpha = 1;
      if (u.lvl > 1 && !u.temp) { ctx.fillStyle = colors.gold; ctx.font = '11px Rubik, sans-serif'; ctx.fillText('★'.repeat(u.lvl), u.x, u.y - s / 2 - 8); }
      if (BASE[u.type].ranged && u.y < WORLD_H && tileAt(u.x, u.y) === 'hill') { ctx.fillStyle = colors.gold; ctx.font = '600 10px Rubik, sans-serif'; ctx.fillText('▲+50%', u.x + s / 2, u.y - s / 2); }
      if (u.train) { ctx.fillStyle = colors.bg; ctx.fillRect(u.x - s / 2 - 12, u.y + s / 2 - 12, 30, 13); ctx.fillStyle = colors.leaf; ctx.font = '600 10px Rubik, sans-serif'; ctx.fillText(`+${u.train * 50}%`, u.x - s / 2 + 3, u.y + s / 2 - 5); }
      if (u.pile > 1) { ctx.fillStyle = colors.bg; ctx.fillRect(u.x + s / 2 - 16, u.y - s / 2 - 2, 26, 14); ctx.fillStyle = colors.gold; ctx.font = '600 10px Rubik, sans-serif'; ctx.fillText(`${u.pile}/${S.mods.mergeN}`, u.x + s / 2 - 3, u.y - s / 2 + 5); }
      bar(u.x - 14, u.y - s / 2 - 6, 34, 5, u.hp / u.maxHp, colors.leaf);
    } else {
      const e = it.e, K = KIND[e.kind], s = (e.r * 2 + 14) * 1.28, pose = visualPose(e, performance.now() / 1000);
      const walk = motionPreference.matches ? 0 : e.moving ? Math.abs(Math.sin(t * 10 + e.ph)) * -3 : Math.sin(t * 2 + e.ph) * 1;
      const rot = !motionPreference.matches && e.moving ? Math.sin(t * 10 + e.ph) * .07 : 0;
      if (hovE === e) { ctx.strokeStyle = colors.red; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, s / 2 + 6, 0, Math.PI * 2); ctx.stroke(); }
      sprite(K.spr, e.x - (!motionPreference.matches && e.lunge > 0 ? e.lunge / .12 * 6 : 0), e.y + walk, e.kind === 'jin' ? s * 1.15 : s, { flash:e.flash > 0, rot, frame:pose.frame });
      if (e.kind === 'ant') { ctx.fillStyle = colors.m; ctx.globalAlpha = .5 + .5 * Math.sin(t * 20 + e.ph); ctx.beginPath(); ctx.arc(e.x - s * .34, e.y - s * .45 + walk, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      if (e.root > 0) { ctx.strokeStyle = colors.leaf; ctx.lineWidth = 3; ctx.strokeRect(e.x - s / 2 - 2, e.y - s / 2 - 2, s + 4, s + 4); }
      bar(e.x - e.r, e.y - s / 2 - 6, e.r * 2, 5, e.hp / e.maxHp, colors.red);
    }
  }
  if (S.buff.slow > 0 && S.phase === 'fight') { ctx.fillStyle = colors.cream; ctx.globalAlpha = .07; ctx.fillRect(zoneMax() * .6, 0, W, WORLD_H); ctx.globalAlpha = 1; }
  for (const f of S.fx) {
    const a = Math.max(0, f.t / f.T); ctx.globalAlpha = a;
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
  for (const p of S.parts) { ctx.globalAlpha = Math.max(0, p.t / p.T); ctx.fillStyle = colors[p.c]; ctx.beginPath();ctx.ellipse(p.x,p.y,p.s*.65,p.s*.35,.6,0,Math.PI*2);ctx.fill(); }
  ctx.globalAlpha = 1;
  for (const shot of S.shots) drawInkShot(shot,t);
  for (const f of S.floats) {
    ctx.globalAlpha = Math.max(0, f.t / f.T); ctx.fillStyle = colors[f.c]; ctx.font = `600 ${f.sz || 13}px Rubik, sans-serif`;
    ctx.fillText(f.text, f.x, f.y - (1 - f.t / f.T) * 30); ctx.globalAlpha = 1;
  }
  if (S.aim !== null && S.aimP && !aimingTerrain()) {
    const c = CARDS[S.hand[S.aim].id];
    ctx.strokeStyle = colors.soul; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(S.aimP.x, S.aimP.y, c.aim, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  if (S.aim !== null) { ctx.fillStyle = colors.soul; ctx.font = '600 12px Rubik, sans-serif'; ctx.fillText(aimingTerrain() ? 'Click a tile to create terrain' : 'Click the field to cast · time slowed', W / 2, 38); }
  // Ficha al pasar el cursor
  const info = hovU ? `${NAMES[hovU.type]}${hovU.type !== 'L' ? ' ' + '★'.repeat(hovU.lvl) : ''} · ♥ ${Math.ceil(hovU.hp)}/${hovU.maxHp}${BASE[hovU.type].ranged && tileAt(hovU.x, hovU.y) === 'hill' ? ' · on hill +50%' : ''}`
             : hovE ? `${KIND[hovE.kind].n} · ♥ ${Math.ceil(hovE.hp)}/${Math.ceil(hovE.maxHp)}${hovE.armor ? ' · armor ' + hovE.armor : ''}${hovE.kind === 'cle' ? ' · heals' : ''}${hovE.kind === 'ant' ? ' · rushes Altar' : ''}` : '';
  if (info) {
    const ent = hovU || hovE; ctx.font = '600 12px Rubik, sans-serif';
    const tw = ctx.measureText(info).width + 14, bx = clamp(ent.x, tw / 2 + 4, W - tw / 2 - 4), by = Math.max(16, ent.y - 40);
    ctx.fillStyle = colors.bg; ctx.globalAlpha = .9; ctx.fillRect(bx - tw / 2, by - 11, tw, 22); ctx.globalAlpha = 1;
    ctx.strokeStyle = hovU ? colors.soul : colors.red; ctx.lineWidth = 1; ctx.strokeRect(bx - tw / 2, by - 11, tw, 22);
    ctx.fillStyle = colors.cream; ctx.fillText(info, bx, by + 1);
  }
  ctx.restore();
}
function bar(x, y, w, h, p, c){ ctx.fillStyle = colors.bg; ctx.fillRect(x, y, w, h); ctx.fillStyle = c; ctx.fillRect(x, y, w * clamp(p, 0, 1), h); }


function sprite(name,x,y,h,o={}){
 const frames=(o.flash?SPRW[name]:o.gray?SPRGRAY[name]:(SPRLEVEL[name]?.[o.level]||SPR[name]));
 if(!frames?.length){ctx.fillStyle='#d6bc85';ctx.fillRect(x-8,y-8,16,16);return;}
 const fr=frames[Math.abs(Math.floor(o.frame||0))%frames.length],w=h*fr.width/fr.height;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));if(o.rot&&!prefs.reduced)ctx.rotate(o.rot);if(o.sy)ctx.scale(1,o.sy);ctx.drawImage(fr,-w/2,-h/2,w,h);ctx.restore();
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
function drawInkBackdrop(W){if(!battlefieldArt){drawV18Field(W);return;}ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(battlefieldArt,0,0,W,WORLD_H);ctx.restore();}
function drawInkShot(s,t){
 ctx.save();ctx.translate(Math.round(s.x),Math.round(s.y));ctx.rotate(s.ang||0);
 const pal=HYBRID.palette[s.k==='fire'?'fire':'orb'];
 if(prefs.effects==='off'){ctx.fillStyle=pal[2];ctx.fillRect(-3,-2,6,4);ctx.restore();return;}
 if(prefs.effects==='soft')ctx.globalAlpha=.65;
 if(prefs.reduced)t=0;
 if(s.k==='bolt'){ctx.fillStyle='#edbc65';ctx.fillRect(-16,-1,20,2);ctx.fillStyle='#fff6d7';ctx.fillRect(3,-2,5,4);ctx.fillStyle='#836bed';ctx.fillRect(-17,-4,4,3);ctx.fillRect(-17,1,4,3);}
 else{for(let j=0;j<3;j++){ctx.strokeStyle=pal[j];ctx.lineWidth=[8,4,1.5][j];ctx.beginPath();for(let k=0;k<18;k++){let x=-30+k*2,y=Math.sin(k*.35+t*13+j*.4)*(18-k)*.18;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}ctx.fillStyle=pal[2];ctx.fillRect(0,-3,6,6);}
 ctx.restore();
}
function hybridFX(){
 if(prefs.effects==='off')return;
 const t=performance.now()/1000;
 for(const f of S.fx){if(!['sword','claw','slash'].includes(f.k))continue;const a=Math.max(0,f.t/f.T),pal=HYBRID.palette[f.k==='claw'?'claw':'slash'];ctx.save();ctx.globalAlpha=a*(prefs.effects==='soft'?.55:1);ctx.translate(f.x,f.y);if(f.angle)ctx.rotate(f.angle);
 if(f.k==='claw'){for(let j=0;j<3;j++)for(let k=0;k<3;k++){ctx.strokeStyle=pal[k];ctx.lineWidth=[5,3,1][k];ctx.beginPath();ctx.moveTo(-10+j*6,-16);ctx.quadraticCurveTo(-4+j*6,-3,5+j*6,14);ctx.stroke();}}
 else{for(let k=0;k<3;k++){ctx.strokeStyle=pal[k];ctx.lineWidth=[9,5,1.5][k];ctx.beginPath();ctx.ellipse(0,0,22+(1-a)*12,12+(1-a)*5,-.6,-2.1,1.1);ctx.stroke();}for(let j=0;j<4;j++){ctx.fillStyle=pal[j%3];ctx.fillRect(Math.round(20-j*7+(1-a)*18),Math.round(-16+j*3),2,2);}}
 ctx.restore();}

}
function renderFrame(){draw();hybridFX();}
