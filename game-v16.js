
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const store = { get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

/* ================= Sonido (Web Audio, todo sintetizado) ================= */
const AU = { ctx:null, music:store.get('gs.music', true), sfx:store.get('gs.sfx', true), mGain:null, sGain:null, next:0, step:0, loop:0, track:'prep', last:{} };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function audioInit(){
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const master = AU.ctx.createGain(); master.gain.value = prefs.volume; AU.master=master; master.connect(AU.ctx.destination);
  AU.mGain = AU.ctx.createGain(); AU.mGain.gain.value = AU.music ? .16 : 0; AU.mGain.connect(master);
  AU.sGain = AU.ctx.createGain(); AU.sGain.gain.value = AU.sfx ? .5 : 0; AU.sGain.connect(master);
  AU.next = AU.ctx.currentTime + .1;
  setInterval(schedMusic, 30);
}
function tone(f, dur, type = 'square', vol = .2, when = 0, dest, f2){
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime + when, o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(dest || AU.sGain); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol = .2, freq = 1200, when = 0, dest, type = 'lowpass'){
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime + when, len = Math.max(1, Math.floor(AU.ctx.sampleRate * dur));
  const buf = AU.ctx.createBuffer(1, len, AU.ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = AU.ctx.createBufferSource(), f = AU.ctx.createBiquadFilter(), g = AU.ctx.createGain();
  s.buffer = buf; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest || AU.sGain); s.start(t);
}
function sfx(name){
  if (!AU.ctx || !AU.sfx) return;
  const now = AU.ctx.currentTime, gap = { hit:.05, arrow:.06, fire:.12, enemyHit:.07, claw:.06, bite:.06, orb:.05, orbHit:.05, fireLaunch:.1, boom:.1, clank:.07, clash:.07, bolt:.08, grunt:.08, zap:.15, raise:.2, wail:1.5 }[name] || 0;
  if (gap && AU.last[name] && now - AU.last[name] < gap) return;
  AU.last[name] = now;
  switch (name) {
    case 'hit': noise(.06, .25, 900); tone(160, .07, 'square', .06, 0, null, 60); break;
    case 'claw': noise(.09, .3, 650); tone(110, .1, 'sawtooth', .08, 0, null, 55); break;                       // zarpazo de zombi
    case 'bite': tone(520, .04, 'square', .08, 0, null, 180); noise(.06, .2, 2500, .02, null, 'bandpass'); break; // mordida
    case 'orb': tone(480, .2, 'sine', .09, 0, null, 1150); break;                                               // orbe espectral sale
    case 'orbHit': tone(1300, .14, 'sine', .1, 0, null, 280); noise(.05, .08, 4500, 0, null, 'highpass'); break;
    case 'fireLaunch': noise(.22, .16, 1100, 0, null, 'bandpass'); tone(180, .2, 'sawtooth', .05, 0, null, 420); break;
    case 'boom': noise(.5, .42, 320); tone(75, .45, 'sine', .42, 0, null, 32); break;                          // explosión del dragón
    case 'clank': tone(1850, .09, 'square', .05); tone(2500, .07, 'square', .04, .012); noise(.06, .1, 5200, 0, null, 'highpass'); break; // armadura
    case 'clash': noise(.05, .16, 3500, 0, null, 'bandpass'); tone(950, .06, 'triangle', .05, 0, null, 600); break;
    case 'bolt': tone(320, .09, 'triangle', .08, 0, null, 950); break;                                          // virote de ballesta
    case 'grunt': tone(190, .16, 'sawtooth', .06, 0, null, 85); break;                                          // humano cae
    case 'zap': noise(.18, .22, 6000, 0, null, 'highpass'); tone(1400, .12, 'square', .05, 0, null, 300); tone(60, .2, 'sawtooth', .08); break; // rayo del Altar
    case 'raise': tone(110, .35, 'sawtooth', .08, 0, null, 330); tone(mtof(62), .3, 'triangle', .08, .12); noise(.3, .08, 900, .05, null, 'bandpass'); break; // esqueleto se levanta
    case 'wail': tone(700, .5, 'sine', .04, 0, null, 900); tone(705, .5, 'sine', .04, 0, null, 880); break;   // lamento de la Banshee
    case 'enemyHit': noise(.05, .14, 2200, 0, null, 'highpass'); break;
    case 'arrow': tone(1100, .06, 'triangle', .06, 0, null, 500); break;
    case 'fire': noise(.28, .22, 500, 0, null, 'bandpass'); tone(110, .25, 'sawtooth', .05, 0, null, 55); break;
    case 'tick': tone(700 + Math.random() * 200, .03, 'square', .03); break;
    case 'stop': tone(300, .05, 'square', .06); break;
    case 'line': [0, 4, 7, 12].forEach((n, i) => tone(mtof(72 + n), .14, 'triangle', .14, i * .07)); break;
    case 'miss': tone(220, .12, 'triangle', .08); tone(196, .16, 'triangle', .08, .1); break;
    case 'fusion': [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(mtof(67 + n), .18, 'square', .07, i * .05)); noise(.5, .08, 6000, .1, null, 'highpass'); break;
    case 'card': noise(.25, .14, 3000, 0, null, 'bandpass'); tone(300, .2, 'sine', .12, 0, null, 900); break;
    case 'death': tone(320, .35, 'sawtooth', .1, 0, null, 70); break;
    case 'altar': tone(80, .25, 'sine', .45); noise(.12, .2, 300); break;
    case 'horn': tone(mtof(57), .35, 'sawtooth', .07); tone(mtof(64), .5, 'sawtooth', .07, .3); break;
    case 'coin': tone(mtof(84), .08, 'square', .06); tone(mtof(91), .14, 'square', .06, .07); break;
    case 'place': tone(140, .12, 'sine', .25, 0, null, 70); noise(.08, .1, 600); break;
    case 'win': [0, 4, 7, 12, 7, 12, 16].forEach((n, i) => tone(mtof(64 + n), .22, 'triangle', .14, i * .13)); break;
    case 'lose': [12, 7, 3, 0].forEach((n, i) => tone(mtof(57 + n), .35, 'triangle', .14, i * .22)); break;
  }
}
/* Music medieval y épica en Re menor: 16 compases (sección A y B), laúd arpegiado, bordón grave de quinta,
   melodía de cuerno con vibrato (en la segunda vuelta la toma una flauta una octava arriba) y, en combate,
   timbales, redoblante y pandereta. */
const CH = { Dm:[50,53,57], C:[48,52,55], Bb:[46,50,53], F:[48,53,57], A:[49,52,57], Gm:[50,55,58] };
const ROOT = { Dm:38, C:36, Bb:34, F:41, A:45, Gm:43 };
const SONG = [ // [acorde, melodía en pares [nota MIDI, corcheas]]; null = silencio
  ['Dm', [[69,2],[74,3],[72,1],[74,2]]], ['C',  [[76,2],[74,1],[72,1],[67,4]]],
  ['Bb', [[65,2],[70,2],[74,2],[72,2]]], ['C',  [[76,3],[74,1],[72,2],[76,2]]],
  ['Dm', [[77,2],[76,1],[74,1],[69,4]]], ['Bb', [[70,2],[72,2],[74,2],[77,2]]],
  ['F',  [[81,3],[79,1],[77,2],[72,2]]], ['A',  [[76,2],[73,2],[69,4]]],
  ['Bb', [[74,4],[77,2],[74,2]]],        ['F',  [[72,4],[69,2],[72,2]]],
  ['C',  [[79,3],[77,1],[76,2],[72,2]]], ['Dm', [[74,6],[69,2]]],
  ['Gm', [[70,2],[74,2],[79,3],[77,1]]], ['Dm', [[77,2],[76,1],[74,1],[81,4]]],
  ['A',  [[79,2],[77,2],[76,2],[73,2]]], ['A',  [[69,4],[null,4]]],
];
const BARS = SONG.map(([ch, mel]) => { const on = {}; let p = 0; mel.forEach(([n, l]) => { if (n) on[p] = [n, l]; p += l; }); return { ch, on }; });
function synth(f, dur, type, vol, when, cutoff, attack, vib){
  const t = AU.ctx.currentTime + when, o = AU.ctx.createOscillator(), fl = AU.ctx.createBiquadFilter(), g = AU.ctx.createGain();
  o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cutoff;
  if (vib) { const l = AU.ctx.createOscillator(), lg = AU.ctx.createGain(); l.frequency.value = 5.2; lg.gain.value = f * .006; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .05); }
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.setValueAtTime(vol, t + Math.max(attack, dur * .7)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(fl); fl.connect(g); g.connect(AU.mGain); o.start(t); o.stop(t + dur + .05);
}
const pluck = (f, d, v, w) => { tone(f, d, 'triangle', v, w, AU.mGain); tone(f * 2, d * .35, 'square', v * .12, w, AU.mGain); };
const timpani = w => { tone(95, .4, 'sine', .32, w, AU.mGain, 48); noise(.08, .1, 200, w, AU.mGain); };
/* Music de batalla: Mi menor, 150 bpm, en semicorcheas. Bajo al galope, acordes de quinta, colchón de cuerdas,
   melodía heroica de metales, bombo, redoblante, platillo y redoble de timbal al cerrar cada mitad. */
const BCH = { Em:[40,47,52], C:[36,43,48], D:[38,45,50], B:[35,42,47], Am:[33,40,45] };
const BPAD = { Em:[64,67,71], C:[60,64,67], D:[62,66,69], B:[63,66,71], Am:[60,64,69] };
const BSONG = [
  ['Em', [[76,4],[79,2],[78,2],[76,4],[71,4]]], ['C',  [[72,4],[76,2],[79,2],[84,6],[83,2]]],
  ['D',  [[81,4],[78,2],[74,2],[78,4],[81,4]]], ['Em', [[83,6],[81,2],[79,4],[76,4]]],
  ['Em', [[76,2],[76,2],[79,2],[83,2],[88,6],[86,2]]], ['C', [[84,4],[83,2],[81,2],[79,4],[76,4]]],
  ['D',  [[78,4],[81,4],[86,4],[85,4]]],        ['B',  [[83,8],[75,4],[78,4]]],
  ['Am', [[81,4],[84,4],[81,2],[79,2],[76,4]]], ['Em', [[79,6],[78,2],[76,8]]],
  ['C',  [[76,2],[79,2],[84,4],[83,4],[79,4]]], ['D',  [[81,6],[78,2],[74,8]]],
  ['Am', [[72,4],[76,4],[81,4],[84,4]]],        ['Em', [[83,4],[79,4],[76,4],[83,4]]],
  ['B',  [[87,4],[83,4],[78,4],[75,4]]],        ['B',  [[83,12],[null,4]]],
];
const BBARS = BSONG.map(([ch, mel]) => { const on = {}; let p = 0; mel.forEach(([n, l]) => { if (n) on[p] = [n, l]; p += l; }); return { ch, on }; });
const kick = w => { tone(120, .16, 'sine', .38, w, AU.mGain, 45); };
function schedMusic(){
  if (!AU.ctx) return;
  if(menuOpen || document.hidden)return;
  const want = S && S.phase === 'fight' ? 'battle' : 'prep';
  if (AU.next < AU.ctx.currentTime - .1) AU.next = AU.ctx.currentTime + .05; // tras volver de otra pestaña, no amontonar notas
  if (want !== AU.track) { AU.track = want; AU.step = 0; AU.loop = 0; AU.next = Math.max(AU.next, AU.ctx.currentTime + .05); }
  while (AU.next < AU.ctx.currentTime + .15) {
    const when = AU.next - AU.ctx.currentTime;
    if (AU.track === 'prep') {
      const spb = 60 / 86 / 2; // corcheas
      const st = AU.step, b = BARS[Math.floor(st / 8) % BARS.length], ch = CH[b.ch], i = st % 8;
      pluck(mtof(ch[[0,1,2,1,0,2,1,2][i]] + 12), spb * 1.7, .06, when);                                  // laúd
      if (i === 0) { synth(mtof(ROOT[b.ch]), spb * 8, 'sawtooth', .1, when, 420, .15); synth(mtof(ROOT[b.ch] + 7), spb * 8, 'sawtooth', .05, when, 420, .15); } // bordón
      const m = b.on[i];
      if (m) {
        if (AU.loop % 2 === 0) synth(mtof(m[0]), spb * m[1] * .95, 'sawtooth', .085, when, 1600, .05, true);  // cuerno
        else synth(mtof(m[0] + 12), spb * m[1] * .95, 'triangle', .1, when, 5000, .04, true);                   // flauta
      }
      AU.next += spb; AU.step++;
      if (AU.step % (8 * BARS.length) === 0) AU.loop++;
    } else {
      const sps = 60 / 150 / 4; // semicorcheas
      const st = AU.step, bi = Math.floor(st / 16) % BBARS.length, b = BBARS[bi], ch = BCH[b.ch], i = st % 16;
      if (i % 4 !== 1) synth(mtof(ch[0] + 12), sps * (i % 4 === 0 ? 1.8 : .9), 'sawtooth', .09, when, 700, .005);   // bajo al galope
      if (i === 0 || i === 6 || i === 10) ch.forEach(n => synth(mtof(n + 12), sps * 1.6, 'square', .028, when, 1800, .005)); // acordes de quinta
      if (i === 0) BPAD[b.ch].forEach(n => synth(mtof(n), sps * 16, 'sawtooth', .022, when, 1200, .25));                    // cuerdas
      const m = b.on[i];
      if (m) synth(mtof(m[0]), sps * m[1] * .92, 'sawtooth', .085, when, 2400, .02, true);                              // metales
      if (i === 0 || i === 8 || i === 14) kick(when);
      if (i === 4 || i === 12) noise(.12, .16, 1900, when, AU.mGain, 'bandpass');
      if (i % 2 === 0) noise(.035, .04, 8500, when, AU.mGain, 'highpass');
      if ((bi === 7 || bi === 15) && i >= 8) tone(90, .1, 'sine', .22, when, AU.mGain, 60);                              // redoble de timbal
      AU.next += sps; AU.step++;
    }
  }
}
function setMusic(on){ AU.music = on; store.set('gs.music', on); if (AU.mGain) AU.mGain.gain.value = on ? .16 : 0; renderSnd(); }
function setSfx(on){ AU.sfx = on; store.set('gs.sfx', on); if (AU.sGain) AU.sGain.gain.value = on ? .5 : 0; renderSnd(); }
function renderSnd(){ $('#musBtn').className = 'snd' + (AU.music ? ' on' : ''); $('#musBtn').textContent = '♪ Music ' + (AU.music ? 'on' : 'off'); $('#sfxBtn').className = 'snd' + (AU.sfx ? ' on' : ''); $('#sfxBtn').textContent = 'Sound ' + (AU.sfx ? 'on' : 'off'); }

const GOTHIC_DATA={sprites:{},cards:{},relics:[]};
/* Tinta gótica · ilustraciones integradas, sin archivos externos. */
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const SPR={},SPRW={},SPRGRAY={},SPRLEVEL={},URL_={},VISUAL=new WeakMap();
const MONSTER_TINT={zombi:'#b2bc88',espectro:'#b1dac8',dragon:'#dc9980',nigromante:'#bad5a1',banshee:'#c3a6c6',lobo:'#d4c0a0',esqueleto:'#e4d2ab'};
let gothicBackdrop=null;
function inkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function whiteOf(src){const c=inkCanvas(src.width,src.height),g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#f7ecd4';g.fillRect(0,0,c.width,c.height);return c;}
function grayscaleSprite(src){const c=inkCanvas(src.width,src.height),g=c.getContext('2d');g.drawImage(src,0,0);const im=g.getImageData(0,0,c.width,c.height);for(let i=0;i<im.data.length;i+=4){const v=im.data[i]*.25+im.data[i+1]*.6+im.data[i+2]*.15;im.data[i]=v*.85;im.data[i+1]=v*.86;im.data[i+2]=v*.9;}g.putImageData(im,0,0);return c;}
function rankSprite(src,name,level){
 const c=inkCanvas(src.width,src.height),g=c.getContext('2d');g.drawImage(src,0,0);const w=c.width,h=c.height;
 g.strokeStyle=MONSTER_TINT[name];g.lineWidth=1.6;
 for(const x of [6,w-6]){g.beginPath();g.moveTo(x,h*.6);g.lineTo(x,h*.82);g.moveTo(x-4,h*.65);g.lineTo(x+4,h*.7);g.moveTo(x-4,h*.76);g.lineTo(x+4,h*.73);g.stroke();}
 if(level===3){g.strokeStyle='#28212c';g.lineWidth=2;g.fillStyle='#dec391';g.beginPath();g.moveTo(w/2-12,12);g.lineTo(w/2-14,2);g.lineTo(w/2-6,7);g.lineTo(w/2,0);g.lineTo(w/2+6,7);g.lineTo(w/2+14,2);g.lineTo(w/2+12,12);g.closePath();g.fill();g.stroke();g.fillStyle=MONSTER_TINT[name];g.fillRect(w/2-2,7,4,4);}
 return c;
}
function paperFrame(source,name,state,f){
 const h=128,w=Math.max(72,Math.min(176,Math.round(112*source.width/source.height+16))),c=inkCanvas(w,h),g=c.getContext('2d');
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 const sc=Math.min((w-18)/source.width,110/source.height),dw=source.width*sc,dh=source.height*sc;
 const phase=f*Math.PI/2,walk=state==='walk',attack=state==='attack',ghost=['espectro','banshee','alma'].includes(name);
 const right=!!MONSTER_TINT[name],direction=right?1:-1,hit=attack?[0,.6,1,.25][f]:0;
 const breath=state==='idle'?Math.sin(phase)*.008:0;
 g.translate(w/2+direction*hit*3,119-dh/2-(walk?Math.abs(Math.sin(phase))*2:ghost?Math.sin(phase)*2:0));
 g.rotate((walk?(name==='zombi'?.025:.012)*Math.sin(phase):0)+direction*hit*.045);g.scale(1-breath,1+breath);
 // Deformación suave del recorte: cola flotante, zancada y aleteo de papel.
 const bands=24;
 for(let i=0;i<bands;i++){
  const p=i/bands,sy=source.height*p,sh=source.height/bands;
  let dx=ghost?Math.sin(p*6+phase)*Math.pow(p,2)*3:walk&&p>.58?Math.sin(phase+(p-.58)*5)*(p-.58)*7:0;
  let stretch=name==='dragon'?1+Math.sin(phase)*.035*(1-p):1;
  g.drawImage(source,0,sy,source.width,sh,-dw*stretch/2+dx,-dh/2+dh*p,dw*stretch,dh/bands+.35);
 }
 return c;
}
function loadInkImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Could not load an artwork.'));im.src=src;});}
Object.assign(URL_,GOTHIC_DATA.sprites);
const artReady=Promise.resolve();
const img=k=>`<img src="${URL_[k]}" alt="" decoding="async">`;
const relicArt=r=>`<img src="${GOTHIC_DATA.relics[Math.max(0,RELICS.indexOf(r))]}" alt="" decoding="async">`;
function rewardArt(o){const id=Object.keys(CARDS).find(k=>CARDS[k].n===o.n);const theme={'Ectoplasm':'niebla','Tough Flesh':'festin','Ancient Fire':'rugido','Soul Harvest':'cosecha','Full Moon':'aullido','Steady Claws':'manos','Fortified Altar':'ofrenda','Necromancy':'huesos'};return `<img src="${GOTHIC_DATA.cards[id||theme[o.n]||'cripta']}" alt="">`;}

function visualPose(u,t){
  let v=VISUAL.get(u);
  if(!v){v={down:!!u.down,cd:u.cd,skels:u.skels||0,attackUntil:0,attackStart:0,riseStart:-100};VISUAL.set(u,v);}
  if(v.down&&!u.down)v.riseStart=t;
  const cast=(u.type==='N'&&(u.skels||0)>v.skels)||((u.type==='B'||(u.kind==='cle'&&S.fx.some(f=>f.k==='ring'&&f.c==='gold'&&f.x===u.x&&f.y===u.y))||u.kind==='bal'||(u.kind&&u.x<=WALL_X+(u.r||0)+3))&&u.cd>v.cd+.1);
  if((u.lunge>0&&!(v.lunge>0))||cast){v.attackStart=t;v.attackUntil=t+.36;}
  v.down=!!u.down;v.cd=u.cd;v.skels=u.skels||0;v.lunge=u.lunge||0;
  if(prefs.reduced||motionPreference.matches)return {frame:u.down?0:t<v.attackUntil?10:0,rise:1};
  const phase=u.ph||0, moving=u.moving&&!u.down, attacking=t<v.attackUntil&&!u.down;
  const frame=attacking?8+Math.min(3,Math.floor((t-v.attackStart)/.09)):moving?4+Math.floor(t*(u.type==='W'?5:10)+phase)%4:Math.floor(t*4+phase)%4;
  return {frame,rise:Math.min(1,Math.max(0,(t-v.riseStart)/.42))};
}

/* ================= Monsters ================= */
/* Pesos de la máquina. Con el comodín, la chance de sacar al menos una línea por giro pasa de 44% a 60%. */
const SYM = {
  W:{ n:'Zombie',      spr:'zombi',      w:3,   role:'patrols and stops humans' },
  A:{ n:'Wraith',   spr:'espectro',   w:3,   role:'ranged attacker' },
  M:{ n:'Dragon',     spr:'dragon',     w:2,   role:'area fire' },
  N:{ n:'Necromancer', spr:'nigromante', w:2,   role:'raises skeletons' },
  B:{ n:'Banshee',    spr:'banshee',    w:2,   role:'buffs nearby allies' },
  C:{ n:'Soul',       spr:'alma',       w:2,   role:'+3 souls' },
  X:{ n:'Wild',    spr:'comodin',    w:2.5, role:'matches any symbol' },
};
const BAG = Object.keys(SYM).flatMap(k => Array(Math.round(SYM[k].w * 2)).fill(k));
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const BASE = {
  W:{ hp:144, dmg:6, cd:1.0, range:22,  x:250, guard:110, move:55 },   // zombi: triple de vida y patrulla
  A:{ hp:20,  dmg:5, cd:0.9, range:240, x:170, ranged:true },
  M:{ hp:22,  dmg:8, cd:1.7, range:190, x:105, splash:70, ranged:true },
  N:{ hp:30,  dmg:0, cd:1.2, range:160, x:110, support:true },          // nigromante: área donde raises skeletons (de cualquier humano que muera ahí)
  B:{ hp:28,  dmg:0, cd:2.0, range:120, x:150, support:true },          // banshee: aura que potencia
  L:{ hp:30,  dmg:7, cd:0.8, range:22,  x:0, guard:220, move:90 },
  K:{ hp:66,  dmg:3, cd:0.9, range:22,  x:0, guard:200, move:70 },      // esqueleto levantado: triple de vida, la mitad de daño
};
const NAMES = { W:'Zombie', A:'Wraith', M:'Dragon', N:'Necromancer', B:'Banshee', L:'Werewolf', K:'Skeleton' };
const USPR = { W:'zombi', A:'espectro', M:'dragon', N:'nigromante', B:'banshee', L:'lobo', K:'esqueleto' };
const UCOL = { W:'w', A:'a', M:'m', N:'leaf', B:'soul', L:'wolf', K:'cream' };
const MERGEABLE = ['W','A','M','N','B'];
const LV_MULT = [1, 3.2, 10], LV_CD = [1, .85, .7], LV_RANGE = [1, 1.1, 1.2];
const guardOf = u => BASE[u.type].guard * [1, 1.15, 1.3][u.lvl - 1];
const bansheeBuff = lvl => [.3, .5, .8][lvl - 1];
const skelCap = lvl => [3, 4, 6][lvl - 1];
const BANSHEE_RANGE = [120, 165, 220];
/* Cuánto potencia la Banshee a un monstruo según dónde está (vale la Banshee más fuerte que lo cubra). */
function bansheeOn(u){
  if (!u || u.down || u.y >= WORLD_H || !S.units.includes(u)) return 0;
  let b = 0;
  for (const s of S.units) if (s.type === 'B' && s !== u && !s.down && dist(s, u) <= BANSHEE_RANGE[s.lvl - 1]) b = Math.max(b, bansheeBuff(s.lvl));
  return b;
}
const MAX_UNITS = 8, MAX_WAVE = 10, WORLD_H = 260, LOGIC_H = 322, WALL_X = 40, TILE = 52, ROWS = 5; // debajo del campo (260-322) va la reserva

/* ================= Humanos ================= */
const KIND = {
  sol:{ n:'Soldier',     spr:'soldado',     hp:1,   dmg:1,   sp:1,    r:11 },
  bal:{ n:'Crossbowman',  spr:'ballestero',  hp:.7,  dmg:.8,  sp:1,    r:11, range:150 },
  cab:{ n:'Knight',   spr:'caballero',   hp:2.2, dmg:1.2, sp:.65,  r:12, armor:true },
  jin:{ n:'Rider',      spr:'jinete',      hp:.6,  dmg:.8,  sp:2.1,  r:12 },
  cle:{ n:'Cleric',     spr:'clerigo',     hp:.8,  dmg:.5,  sp:.6,   r:11, healer:true },
  ant:{ n:'Arsonist', spr:'incendiario', hp:.8,  dmg:1,   sp:1.25, r:11, arson:true },
  com:{ n:'Commander',  spr:'comandante',  hp:14,  dmg:2.2, sp:.6,   r:22, boss:true },
};
function waveInfo(w){
  const boss = w % 5 === 0;
  const n = boss ? 5 + w : Math.round(6 + w * 2.6);
  const table = [['sol', 6]];
  if (w >= 2) table.push(['cab', w >= 5 ? 2 : 1]);
  if (w >= 3) table.push(['bal', 2], ['cle', 1]);
  if (w >= 4) table.push(['jin', 2]);
  if (w >= 6) table.push(['ant', 1.5]);
  return { boss, n, table, hp:HUM.hp * Math.pow(HUM.grow, w - 1), dmg:HUM.dmg + w * HUM.dmgW, sp:30 + w * 2, armor:2 + Math.floor(w / 3) };
}
/* La oleada se sortea al empezar la preparación, así el panel muestra exactamente lo que viene. */
function rollWave(w){
  const W = waveInfo(w);
  const q = Array.from({ length:W.n }, () => {
    const k = pickKind(W.table), K = KIND[k];
    return { kind:k, hp:W.hp * K.hp, dmg:W.dmg * K.dmg, sp:rnd(.85, 1.15) * W.sp * K.sp, r:K.r, range:K.range || 0, armor:K.armor ? W.armor : 0 };
  });
  if (W.boss) q.splice(Math.floor(W.n / 2), 0, { kind:'com', hp:W.hp * KIND.com.hp, dmg:W.dmg * KIND.com.dmg, sp:W.sp * KIND.com.sp, r:22, boss:true, armor:W.armor });
  return q;
}
const HUM = { hp:20, grow:1.46, dmg:6.5, dmgW:1.95 }; // fuerza de los humans (ajustada con partidas simuladas)
function pickKind(table){ const tot = table.reduce((s, t) => s + t[1], 0); let r = Math.random() * tot; for (const [k, wt] of table) { r -= wt; if (r <= 0) return k; } return table[0][0]; }

/* ================= Artefactos ================= */
const RELICS = [
  { n:'Volcano Heart', ic:'✹', d:'Dragons deal +60% damage and have larger explosions.', a:()=>{ S.mods.mageDmg *= 1.6; S.mods.splash = 1.35; } },
  { n:'Ancient Tomb',     ic:'✝', d:'Start with a ★★ Zombie.', a:()=>{ S.startZombiee = 2; } },
  { n:'Soul Eye',      ic:'◉', d:'Hold one extra symbol and gain +2 souls per soul line.', a:()=>{ S.holdsMax++; S.mods.coinBonus += 2; } },
  { n:'Forbidden Grimoire',ic:'▤', d:'Draw 4 cards per wave instead of 3.', a:()=>{ S.handSize = 4; } },
  { n:'Ancestral Altar',   ic:'⌂', d:'The Altar gains +25 HP and heals 8 after each wave.', a:()=>{ S.wallMax += 25; S.wallHp = S.wallMax; S.mods.wallRegen = 8; } },
  { n:'Earth Stone',ic:'▲', d:'Receive a free Hill card each preparation phase.', a:()=>{ S.freeHill = true; } },
];
const BLESS = [
  { n:'Ectoplasm',      ic:'☁', d:'Wraiths fire 40% faster.',            a:()=>S.mods.archSpd *= 1.4 },
  { n:'Tough Flesh',      ic:'✚', d:'Zombies gain 60% more HP.',                  a:()=>S.mods.warHp *= 1.6 },
  { n:'Ancient Fire',   ic:'✹', d:'Dragons deal 50% more damage.',              a:()=>S.mods.mageDmg *= 1.5 },
  { n:'Soul Harvest',ic:'◉', d:'Soul lines grant double souls.',            a:()=>S.mods.coin *= 2 },
  { n:'Full Moon',      ic:'☾', d:'+1 free spin each preparation phase.',          a:()=>S.spinsPer++ },
  { n:'Steady Claws',   ic:'✋', d:'Hold one extra symbol.',                 a:()=>S.holdsMax++ },
  { n:'Fortified Altar', ic:'⌂', d:'Altar gains +15 max HP and fully heals.', a:()=>{ S.wallMax += 15; S.wallHp = S.wallMax; } },
  { n:'Necromancy',     ic:'★', d:'Merges require 2 matching monsters instead of 3.', ok:()=>S.mods.mergeN > 2, a:()=>S.mods.mergeN = 2 },
];

/* ================= Cards ================= */
const bonesDmg = () => 18 + 7 * S.wave, quakeDmg = () => 8 + 3 * S.wave, batDps = () => 6 + 2 * S.wave;
const CARDS = {
  rugido:  { n:'Dragon Roar', ic:'≫', t:'sup', d:()=>'Your monsters attack twice as fast for 5 s.', play(){ S.buff.haste = 5; bigMsg('ROAR!'); } },
  manos:   { n:'Earth Hands',ic:'✋', t:'ctl', aim:75, d:()=>'Humans in the area are rooted for 3 s.', play(p){ S.enemies.forEach(e => { if (dist(e, p) <= 75 + e.r) e.root = 3; }); S.fx.push({ k:'ring', x:p.x, y:p.y, r:75, c:'leaf', t:.5, T:.5 }); } },
  huesos:  { n:'Bone Rain',  ic:'✹', t:'atk', aim:60, d:()=>`${bonesDmg()} area damage. Ignores armor.`, play(p){ S.enemies.forEach(e => { if (dist(e, p) <= 60 + e.r) damage(e, bonesDmg(), { pierce:true }); }); S.fx.push({ k:'ring', x:p.x, y:p.y, r:60, c:'cream', t:.4, T:.4 }); sfx('hit'); } },
  festin:  { n:'Feast',            ic:'❦', t:'sup', d:()=>'Your monsters heal 60% HP; fallen monsters revive with 40%.', play(){ S.units.forEach(u => { if (u.down) { u.down = false; u.hp = u.maxHp * .4; floatText(u.x, u.y - 22, 'Back up!', 'leaf'); } else { u.hp = Math.min(u.maxHp, u.hp + u.maxHp * .6); floatText(u.x, u.y - 22, '+HP', 'leaf'); } }); } },
  aullido: { n:'Howl',           sp:'lobo', t:'sum', aim:20, d:()=>'Summon a werewolf at the target for this wave.', play(p){ const u = makeUnit('L', 1); u.temp = true; u.x = clamp(p.x, WALL_X + 20, worldW() - 20); u.y = clamp(p.y, 20, WORLD_H - 20); S.units.push(u); } },
  ofrenda: { n:'Offering',           ic:'⌂', t:'sup', d:()=>'The Altar restores 15 HP.', play(){ S.wallHp = Math.min(S.wallMax, S.wallHp + 15); floatText(WALL_X + 20, 40, '+15', 'leaf'); } },
  niebla:  { n:'Mist',            ic:'≈', t:'ctl', d:()=>'Humans move 60% slower for 6 s.', play(){ S.buff.slow = 6; bigMsg('MIST'); } },
  temblor: { n:'Earthquake',           ic:'⌁', t:'atk', d:()=>`${quakeDmg()} damage to all humans. Ignores armor.`, play(){ S.enemies.forEach(e => damage(e, quakeDmg(), { pierce:true })); S.fx.push({ k:'quake', t:.4, T:.4 }); sfx('altar'); } },
  eclipse: { n:'Eclipse',           ic:'◐', t:'atk', d:()=>'All humans lose 30% of current HP.', play(){ S.enemies.forEach(e => damage(e, Math.ceil(e.hp * .3), { pierce:true })); bigMsg('ECLIPSE'); } },
  murcielagos:{ n:'Bats',    ic:'⋀', t:'atk', aim:65, d:()=>`Deal ${batDps()} damage per second in an area for 5 s.`, play(p){ S.zones.push({ x:p.x, y:p.y, r:65, dps:batDps(), t:5 }); } },
  cripta:  { n:'Expanded Crypt',   ic:'▣', t:'sup', prep:true, d:()=>'Preparation: +1 field capacity for the rest of the run.', play(){ S.maxUnits++; bigMsg(`+1 SLOT · ${S.maxUnits}`); sfx('fusion'); setResult('Expanded Crypt', `Field capacity: ${S.maxUnits}.`); renderUI(); } },
  cosecha: { n:'Harvest',           sp:'alma', t:'sup', d:()=>'Gain 1 soul for each human on the field.', play(){ const g = S.enemies.length; S.gold += g; floatText(worldW() / 2, 60, `+${g} souls`, 'soul'); sfx('coin'); } },
  lago:    { n:'Cursed Lake',      ic:'≋', t:'ter', tile:'water', size:2, d:()=>'Preparation: create 2 water tiles. Humans must go around them.' },
  colina:  { n:'Hill',            ic:'▲', t:'ter', tile:'hill', size:1, d:()=>'Preparation: create a hill. Wraiths and dragons on it deal +50% damage.' },
  pantano: { n:'Swamp',           ic:'∷', t:'ter', tile:'swamp', size:3, d:()=>'Preparation: create 3 swamp tiles that slow humans.' },
};
const START_DECK = ['rugido','manos','huesos','festin','aullido'];
const META = { deck: START_DECK.slice() };
{ const s = store.get('giroSalvaje.deck', null); if (Array.isArray(s) && s.every(id => CARDS[id])) META.deck = s; }
const saveMeta = () => store.set('giroSalvaje.deck', META.deck);
const isPrepCard = id => CARDS[id].t === 'ter' || !!CARDS[id].prep;
const usableNow = id => isPrepCard(id) ? S.phase === 'prep' : S.phase === 'fight';

function cardHTML(id, attrs = '', extra = '', note = ''){
  const C = CARDS[id];
  const tag = isPrepCard(id) ? '<span class="tag prep">PREPARATION</span>' : C.aim ? '<span class="tag">AIM</span>' : '';
  const TY = { atk:'ATTACK', ctl:'CONTROL', sup:'SUPPORT', sum:'SUMMON', ter:'TERRAIN' };
  return `<button class="card ${C.t} ${extra}" ${attrs}>${tag}<span class="cn">${C.n}${note}</span><span class="art">${`<img src="${GOTHIC_DATA.cards[id]}" alt="" decoding="async">`}</span><span class="cd"><span class="ty">${TY[C.t]}</span>${C.d()}</span></button>`;
}

/* ================= Tips ================= */
const TIPS = {
  spin:   'Humans invade the Valley of Souls. Click <b>SPIN</b>: 3 matching symbols in a line summon a guardian.',
  hold:   'No match. Click up to 2 symbols to <b>HOLD</b> them for your next spin.',
  drag:   'New monster! <b>Drag</b> to place it and <b>click</b> to see its range. Wraiths and dragons deal more damage on a <b>hill</b>.',
  near:   'You have <b>2 matching monsters</b>. Drag one <b>onto the other</b> to stack them; the third triggers a <b>MERGE</b>.',
  bench:  'The field is full. Your monster went to the <b>RESERVE</b>. It cannot fight there, but <b>trains</b> for +50% HP and damage each wave. Merge it or sell it at the <b>Altar</b>.',
  train:  'Your <b>reserve trained</b>: +50% permanent HP and damage per wave waited (max +150%). They keep these bonuses on the field.',
  wild:   '<b>Wild!</b> The golden skull replaces any symbol. Three wilds in a line grant souls.',
  altar:  'The <b>Altar fights back!</b> It strikes nearby humans with chain lightning.',
  raise:  'The <b>Necromancer</b> raised a skeleton ally. Any human dying within its area may rise, regardless of who killed it. Higher levels raise stronger skeletons.',
  merge:  'Merge! Keep stacking: 3 matching ★★ monsters form a ★★★ monster.',
  buy:    'Out of spins? Spend <b>souls</b> on an extra spin or card. Every defeated human grants 1 soul.',
  fight:  'Check your <b>cards</b>: combat cards are played during battle. When ready, click <b>DEFEND!</b>',
  cards:  'Click a <b>card</b> during battle. AIM cards slow time; click the field to target.',
  terrain:'<b>PREPARATION</b> cards create terrain: select a card, then a field tile.',
  wall:   'Humans reached the Altar! Put <b>Zombies</b> in their path or play a card.',
  death:  'A monster fell. It revives next wave, or sooner with <b>Feast</b>.',
  empty:  'All your monsters fell! Use cards or buy one with souls. The Altar still fires lightning.',
  keep:   'Unused cards <b>carry over</b>. Only missing cards are drawn, marked NEW.',
  layout: '<b>Terrain changes</b> each wave. Rearrange your monsters and check incoming humans. Drag surplus monsters to the <b>Altar</b> to sell them.',
  k_bal:  '<b>Crossbowmen!</b> They shoot from afar. Your Wraiths outrange them, especially on hills.',
  k_cab:  '<b>Knights!</b> Armor reduces damage per hit. Damage cards ignore armor; dragons hit hard.',
  k_jin:  '<b>Riders!</b> Fast but fragile. Swamps and Earth Hands slow them.',
  k_cle:  '<b>Clerics!</b> They heal nearby humans. Target them with Wraiths or area spells.',
  k_ant:  '<b>Arsonists!</b> They ignore monsters and rush the Altar for triple damage. Stop them!',
};
const seen = new Set();
let coachTimer = 0;
function tip(key){
  if (seen.has(key) || !TIPS[key]) return;
  seen.add(key);
  const c = $('#coach');
  c.innerHTML = `<span class="tag">TIP</span><span>${TIPS[key]}</span>`;
  c.hidden = false;
  clearTimeout(coachTimer);
  coachTimer = setTimeout(() => { c.hidden = true; }, 9000);
}
function bigMsg(text){ const d = document.createElement('div'); d.className = 'bigmsg'; d.textContent = text; $('#lane').appendChild(d); setTimeout(() => d.remove(), 1650); }

let S, colors = {};

function newGame(){
  S = {
    wave:1, wallHp:80, wallMax:80, gold:0, spinsPer:3, spinsLeft:3, bought:0, cardBuys:0, holdsMax:2, handSize:3, startZombiee:1, relic:null, freeHill:false,
    grid:Array.from({ length:9 }, () => BAG[Math.floor(Math.random() * BAG.length)]), held:new Set(), wins:new Set(),
    units:[], enemies:[], fx:[], floats:[], zones:[], shots:[], parts:[], shake:0, queue:[], spawnT:0, phase:'relic', speed:1, kills:0, spunOnce:false, confirmFight:false, drag:null,
    deck:META.deck.slice(), hand:[], aim:null, aimP:null, buff:{ haste:0, slow:0 }, ter:new Map(),
    bench:[null, null, null], sel:null, nextQueue:[], seenKinds:new Set(), maxUnits:8, slotBuys:0,
    mods:{ archSpd:1, warHp:1, mageDmg:1, splash:1, coin:1, coinBonus:0, mergeN:3, wallRegen:0 }, offer:[], endOffer:[], result:'', resultSub:'',
  };
  setResult('Choose your relic', '');
  renderUI();
  showOv(`<h2>Defend the Valley of Souls</h2>
  <p>Humans march toward the Altar. Summon guardians, match symbols and prepare your defense.</p>
  <div class="deckbar"><span>Your starting deck: <b>${META.deck.length} cards</b></span><button class="link" data-act="deck">View deck</button></div>
  <p><b>Choose 1 relic</b> for this run:</p>
  <div class="relics">${RELICS.map((r, i) => `<button class="relic-opt" data-act="relic" data-i="${i}"><span class="medal">${relicArt(r)}</span><span class="rn">${r.n}</span><span class="rd">${r.d}</span></button>`).join('')}</div>`);
}
function startRun(i){
  const r = RELICS[i]; S.relic = r; r.a();
  placeNew(makeUnit('W', S.startZombiee)); placeNew(makeUnit('A', 1));
  S.phase = 'prep';
  genTerrain();
  drawHand();
  S.nextQueue = rollWave(S.wave);
  setResult('Prepare your defense', `You have ${S.spinsLeft} spins before wave 1.`);
  hideOv(); renderUI(); tip('spin'); sfx('horn');
}

/* ================= Terreno ================= */
const tkey = (c, r) => c + ',' + r;
const colOf = x => Math.floor(x / TILE), rowOf = y => clamp(Math.floor(y / TILE), 0, ROWS - 1);
const tileAt = (x, y) => S.ter.get(tkey(colOf(x), rowOf(y))) || null;
const tileCenter = (c, r) => ({ x:c * TILE + TILE / 2, y:r * TILE + TILE / 2 });
const waterInCol = c => { let n = 0; for (let r = 0; r < ROWS; r++) if (S.ter.get(tkey(c, r)) === 'water') n++; return n; };
function canPlaceTile(c, r, type){
  // Reglas: solo en tu lado (casillas completas dentro de tu zona), sin tocar el Altar y una sola cosa por casilla.
  if (c < 1 || r < 0 || r >= ROWS || (c + 1) * TILE > zoneMax()) return false;
  if (S.ter.has(tkey(c, r))) return false;
  if (type === 'water') {
    if (waterInCol(c) >= ROWS - 2) return false;
    if (S.units.some(u => colOf(u.x) === c && rowOf(u.y) === r)) return false;
  }
  return true;
}
function blob(type, c0, r0, n){
  let c = c0, r = r0, placed = 0, tries = 0;
  while (placed < n && tries++ < 30) {
    if (canPlaceTile(c, r, type)) { S.ter.set(tkey(c, r), type); placed++; }
    if (Math.random() < .5) c += Math.random() < .5 ? -1 : 1; else r += Math.random() < .5 ? -1 : 1;
    r = clamp(r, 0, ROWS - 1);
  }
}
function genTerrain(){
  // El terreno se genera solo en tu lado y cambia en cada preparación.
  S.ter = new Map();
  const last = Math.floor(zoneMax() / TILE) - 1; // última columna completa dentro de tu zona
  const ri = (a, b) => Math.floor(rnd(a, Math.max(a, b) + 1));
  blob('hill', ri(1, last), ri(0, ROWS - 1), 1);
  if (last >= 4) blob('hill', ri(1, last), ri(0, ROWS - 1), 1);
  blob('water', ri(Math.min(2, last), last), ri(0, ROWS - 1), ri(2, 3));
  blob('swamp', ri(Math.max(1, last - 1), last), ri(0, ROWS - 1), 2);
  S.units.forEach(relocate);
}
function relocate(u){
  if (tileAt(u.x, u.y) !== 'water') return;
  const free = findFree(u, u.x, u.y);
  if (free) { u.x = free.x; u.y = free.y; return; }
  let best = null, bd = 1e9;
  const zc = Math.floor(zoneMax() / TILE);
  for (let c = 1; c < zc; c++) for (let r = 0; r < ROWS; r++) {
    if (S.ter.get(tkey(c, r)) === 'water') continue;
    const p = tileCenter(c, r); if (p.x < WALL_X + 16) continue;
    const d = dist(p, u); if (d < bd) { bd = d; best = p; }
  }
  if (best) { u.x = best.x; u.y = best.y; }
}
function placeTerrain(p){
  const c = S.hand[S.aim]; if (!c) return;
  const C = CARDS[c.id], col = colOf(p.x), row = rowOf(p.y);
  if (!canPlaceTile(col, row, C.tile)) { setResult('Invalid placement', 'Choose a free tile on your side. Terrain cannot overlap; water cannot cover monsters or block an entire column.'); renderUI(); return; }
  S.ter.set(tkey(col, row), C.tile);
  let extra = C.size - 1;
  for (const [dc, dr] of shuffle([[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]])) { if (extra <= 0) break; if (canPlaceTile(col + dc, row + dr, C.tile)) { S.ter.set(tkey(col + dc, row + dr), C.tile); extra--; } }
  c.used = true; S.aim = null; sfx('place');
  setResult('Terrain created', `${C.n} on the field.`);
  renderUI();
}

/* ================= Unidades ================= */
function stats(type, lvl, u){
  const b = BASE[type], m = LV_MULT[lvl - 1];
  let hp = b.hp * m, dmg = b.dmg * m, cd = b.cd * LV_CD[lvl - 1], splash = (b.splash || 0), range = b.range * LV_RANGE[lvl - 1];
  if (type === 'K') { const f = [1, 2, 3.5][((u && u.nl) || 1) - 1]; hp = (b.hp + 18 * S.wave) * f; dmg = (b.dmg + .8 * S.wave) * f; }
  if (type === 'B') range = BANSHEE_RANGE[lvl - 1];
  if (type === 'W') hp *= S.mods.warHp;
  if (type === 'A') cd /= S.mods.archSpd;
  if (type === 'M') { dmg *= S.mods.mageDmg; splash *= S.mods.splash; }
  if (type === 'L') { hp = b.hp + 10 * S.wave; dmg = b.dmg + 2 * S.wave; }
  if (u && b.ranged && u.y < WORLD_H && tileAt(u.x, u.y) === 'hill') { dmg *= 1.5; range *= 1.25; }
  if (u && u.train) { hp *= 1 + .5 * u.train; dmg *= 1 + .5 * u.train; } // entrenamiento en la reserva: +50% por oleada
  if (u && u.pile > 1) { hp *= u.pile; dmg *= u.pile; } // una pila de 2 pelea como 2 monsters juntos
  return { hp:Math.round(hp), dmg:Math.round(dmg), cd, range, splash };
}
const size = u => u.type === 'L' ? 36 : u.type === 'K' ? Math.round(32 * [1, 1.3, 1.6][(u.nl || 1) - 1]) : u.type === 'M' ? 40 + (u.lvl - 1) * 9 : 34 + (u.lvl - 1) * 9;
const radius = u => Math.min(size(u), 34 + u.lvl * 6) / 2 - 2;
function makeUnit(type, lvl){ const st = stats(type, lvl); return { type, lvl, pile:1, train:0, hp:st.hp, maxHp:st.hp, cd:Math.random() * st.cd, x:0, y:0, flash:0, lunge:0, lx:1, ly:0, ph:Math.random() * 6 }; }
const refreshHp = u => { u.hp = u.maxHp = stats(u.type, u.lvl, u).hp; };
/* Tu zona termina justo en el borde de una casilla, así el terreno nunca queda cruzando la línea. */
function zoneMax(){ return Math.max(3 * TILE, Math.floor(Math.min(worldW() * 0.5, 430) / TILE) * TILE); }
/* Ocupación: cada monstruo ocupa un círculo según su tamaño y nunca se superpone con otro. */
const fieldUnits = () => S.units.filter(u => !u.temp);
const fieldCount = () => fieldUnits().reduce((s, u) => s + u.pile, 0);
const benchSlot = i => ({ x:WALL_X + 34 + i * 62, y:WORLD_H + 32 });
function canStand(u, x, y, ignore){
  const r = radius(u);
  if (x < WALL_X + r + 4 || x > zoneMax() || y < r + 8 || y > WORLD_H - r - 12) return { ok:false, why:'fuera' };
  if (tileAt(x, y) === 'water') return { ok:false, why:'agua' };
  const hit = fieldUnits().find(o => o !== u && o !== ignore && Math.hypot(o.x - x, o.y - y) < r + radius(o) + 2);
  return hit ? { ok:false, why:'ocupado', hit } : { ok:true };
}
function findFree(u, x0, y0, ignore){
  for (let ring = 0; ring <= 14; ring++) {
    const n = ring ? ring * 8 : 1;
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2, x = x0 + Math.cos(a) * ring * 18, y = y0 + Math.sin(a) * ring * 18;
      if (canStand(u, x, y, ignore).ok) return { x, y };
    }
  }
  return null;
}
function placeNew(u){
  const x0 = Math.min(BASE[u.type].x, zoneMax() - 20);
  for (let y = 40; y <= WORLD_H - 40; y += 44) if (canStand(u, x0, y).ok) { u.x = x0; u.y = y; S.units.push(u); return u; }
  const p = findFree(u, x0, WORLD_H / 2);
  if (!p) return null;
  u.x = p.x; u.y = p.y; S.units.push(u); return u;
}
function toBench(u){
  const i = S.bench.findIndex(b => !b);
  if (i < 0) return false;
  const p = benchSlot(i); u.x = p.x; u.y = p.y; S.bench[i] = u; return true;
}
function removeUnit(u){
  const i = S.units.indexOf(u); if (i >= 0) S.units.splice(i, 1);
  const j = S.bench.indexOf(u); if (j >= 0) S.bench[j] = null;
  if (S.sel === u) S.sel = null;
}
const allMine = () => [...fieldUnits(), ...S.bench.filter(Boolean)];
const countOf = (type, lvl) => allMine().filter(u => u.type === type && u.lvl === lvl).reduce((s, u) => s + u.pile, 0);
const sellValue = u => [2, 6, 18][u.lvl - 1] * u.pile;
function summon(type){
  const u = makeUnit(type, 1);
  if (fieldCount() < S.maxUnits && placeNew(u)) return `+1 ${NAMES[type]}`;
  if (toBench(u)) { setTimeout(() => tip('bench'), 300); return `+1 ${NAMES[type]} to reserve`; }
  S.gold += 3;
  return `No space: ${NAMES[type]} left 3 souls behind`;
}
const mergeable = (a, b) => a && b && a !== b && a.type === b.type && a.lvl === b.lvl && a.lvl < 3 && !a.temp && !b.temp && a.type !== 'L';
/* Fusión manual: soltar un monstruo sobre otro igual los apila; al juntar 3 (o 2 con Necromancy) se fusionan. */
function doMerge(target, src){
  const total = target.pile + src.pile, train = Math.max(target.train || 0, src.train || 0);
  removeUnit(src);
  if (total < S.mods.mergeN) {
    target.pile = total; target.train = train; refreshHp(target);
    S.fx.push({ k:'ring', x:target.x, y:target.y, r:26, c:'gold', t:.4, T:.4 }); sfx('place');
    setResult('Stacked', `${NAMES[target.type]} ${target.pile}/${S.mods.mergeN}: drop another matching monster onto it to merge.`);
    return;
  }
  const leftover = total - S.mods.mergeN, nu = makeUnit(target.type, target.lvl + 1);
  nu.x = target.x; nu.y = target.y; nu.train = train; refreshHp(nu);
  const bi = S.bench.indexOf(target);
  removeUnit(target);
  if (bi >= 0) S.bench[bi] = nu; else S.units.push(nu);
  if (bi < 0) fieldUnits().forEach(o => { if (o !== nu && Math.hypot(o.x - nu.x, o.y - nu.y) < radius(o) + radius(nu) + 2) { const p = findFree(o, o.x, o.y, null); if (p) { o.x = p.x; o.y = p.y; } } });
  if (leftover > 0) { const lu = makeUnit(target.type, target.lvl); lu.pile = leftover; refreshHp(lu); if (!(fieldCount() + leftover <= S.maxUnits && placeNew(lu)) && !toBench(lu)) S.gold += 3; }
  S.sel = nu;
  S.fx.push({ k:'fusion', x:nu.x, y:nu.y, t:0.9, T:0.9 });
  burst(nu.x, nu.y, 'gold', 20, 160); burst(nu.x, nu.y, 'soul', 10, 110); S.shake = Math.max(S.shake, 3);
  const msg = `${NAMES[nu.type]} ${'★'.repeat(nu.lvl)}`;
  bigMsg('MERGE! ' + msg); sfx('fusion'); setTimeout(() => tip('merge'), 400);
  setResult('Merge!', msg);
}

/* ================= Cards en juego ================= */
/* La mano se conserva entre oleadas: las cards usadas se descartan y solo se roba para completar la mano. */
function drawHand(){
  const keep = (S.hand || []).filter(h => !h.used && !h.free);
  const avail = shuffle(S.deck.map((_, i) => i).filter(i => !keep.some(h => h.di === i)));
  const drawn = [];
  while (keep.length + drawn.length < S.handSize && avail.length) { const i = avail.pop(); drawn.push({ id:S.deck[i], di:i, used:false, fresh:true }); }
  keep.forEach(h => { h.fresh = false; });
  S.hand = [...keep, ...drawn];
  if (S.freeHill) S.hand.unshift({ id:'colina', di:-1, used:false, free:true });
  S.aim = null; S.cardBuys = 0;
  if (S.hand.some(h => isPrepCard(h.id))) setTimeout(() => tip('terrain'), 600);
  if (keep.length && drawn.length) setTimeout(() => tip('keep'), 900);
}
const cardCost = () => 5 + S.cardBuys * 3;
function buyable(){ return S.deck.map((_, i) => i).filter(i => !S.hand.some(h => h.di === i) && (S.phase === 'prep' || !isPrepCard(S.deck[i]))); }
function buyCard(){
  if (!(S.phase === 'prep' || S.phase === 'fight')) return;
  const free = buyable(), cost = cardCost();
  if (!free.length || S.gold < cost) return;
  const di = free[Math.floor(Math.random() * free.length)];
  S.gold -= cost; S.cardBuys++;
  S.hand.push({ id:S.deck[di], di, used:false });
  setResult('Card purchased', `${CARDS[S.deck[di]].n} for ${cost} souls.`);
  sfx('coin'); renderUI();
}
function useCard(i){
  const c = S.hand[i];
  if (!c || c.used || !usableNow(c.id)) return;
  const C = CARDS[c.id];
  if (C.aim || C.tile) { S.aim = S.aim === i ? null : i; renderHand(); return; }
  C.play(); c.used = true; sfx('card'); renderHand();
}
function castAim(p){
  const c = S.hand[S.aim];
  if (!c) { S.aim = null; return; }
  CARDS[c.id].play(p); c.used = true; S.aim = null; sfx('card'); renderHand();
}

/* ================= Máquina ================= */
let spinning = false;
const cellHTML = k => img(SYM[k].spr);
async function spin(){
  if (S.phase !== 'prep' || spinning || S.spinsLeft <= 0) return;
  spinning = true; S.spinsLeft--; S.spunOnce = true; S.confirmFight = false; S.wins.clear(); S.aim = null; renderUI();
  const cells = [...document.querySelectorAll('.cell')];
  const stops = [0, 1, 2].map(c => 380 + c * 170);
  const start = performance.now();
  await new Promise(res => {
    const tick = () => {
      const t = performance.now() - start; let done = true;
      for (let i = 0; i < 9; i++) {
        if (S.held.has(i)) continue;
        if (t < stops[i % 3]) { done = false; const k = BAG[Math.floor(Math.random() * BAG.length)]; cells[i].innerHTML = cellHTML(k); cells[i].className = 'cell rolling'; }
        else if (!cells[i].dataset.stopped) { cells[i].dataset.stopped = 1; S.grid[i] = BAG[Math.floor(Math.random() * BAG.length)]; cells[i].innerHTML = cellHTML(S.grid[i]); cells[i].className = 'cell'; sfx('stop'); }
      }
      if (!done) sfx('tick');
      if (done) res(); else setTimeout(tick, 45);
    };
    tick();
  });
  cells.forEach(c => delete c.dataset.stopped);
  spinning = false;
  evaluate();
}
function evaluate(){
  const hits = [];
  // Una línea paga si sus símbolos que no son comodín son todos iguales. Tres comodines pagan souls.
  LINES.forEach(l => {
    const s = l.map(i => S.grid[i]), nw = s.filter(k => k !== 'X');
    if (nw.length && !nw.every(k => k === nw[0])) return;
    hits.push(nw.length ? nw[0] : 'XXX'); l.forEach(i => S.wins.add(i));
    if (nw.length < 3) setTimeout(() => tip('wild'), 500);
  });
  if (!hits.length) {
    setResult('No matches', S.spinsLeft > 0 ? 'Hold symbols and spin again.' : 'No spins left.');
    sfx('miss');
    if (S.spinsLeft > 0) tip('hold');
  } else {
    const msgs = []; let gotUnit = false;
    sfx('line');
    if (hits.length === 8) { S.gold += 10; msgs.push('JACKPOT! +10 souls'); }
    hits.forEach(k => {
      if (k === 'XXX') { S.gold += 6; msgs.push('Triple wild! +6 souls'); sfx('coin'); }
      else if (k === 'C') { const g = 3 * S.mods.coin + S.mods.coinBonus; S.gold += g; msgs.push(`+${g} souls`); sfx('coin'); }
      else { msgs.push(summon(k)); gotUnit = true; }
    });
    S.held.clear();
    setResult(hits.length > 1 ? `${hits.length} matches!` : 'Match!', msgs.join(' · '));
    if (gotUnit) { if (!seen.has('drag')) tip('drag'); else if (nearMerge()) tip('near'); }
  }
  if (S.spinsLeft === 0) { if (S.gold >= spinCost()) tip('buy'); else tip('fight'); }
  renderUI();
}
function nearMerge(){ return MERGEABLE.some(t => [1,2].some(l => countOf(t, l) >= 2)); }
const spinCost = () => 4 + S.bought * 2;
/* Ampliar el valle: +1 al límite de monsters en el campo, cada vez más caro (10, 16, 22...). */
const slotCost = () => 10 + S.slotBuys * 6;
function buySlot(){
  const cost = slotCost();
  if (S.phase !== 'prep' || S.gold < cost || spinning) return;
  S.gold -= cost; S.slotBuys++; S.maxUnits++;
  setResult('Valley expanded', `Field capacity: ${S.maxUnits}. Next slot costs ${slotCost()} souls.`);
  bigMsg(`+1 SLOT · ${S.maxUnits}`); sfx('fusion'); renderUI();
}
function buySpin(){
  const cost = spinCost();
  if (S.phase !== 'prep' || S.gold < cost || spinning) return;
  S.gold -= cost; S.bought++; S.spinsLeft++; S.confirmFight = false;
  setResult('Spin purchased', `Paid ${cost} souls. Next spin costs ${spinCost()}.`);
  sfx('coin'); renderUI();
}
function toggleHold(i){
  if (S.phase !== 'prep' || spinning) return;
  if (S.held.has(i)) S.held.delete(i);
  else if (S.held.size < S.holdsMax) S.held.add(i);
  else { setResult('Hold limit', `You can hold up to ${S.holdsMax} symbols.`); renderUI(); return; }
  sfx('stop'); renderUI();
}

/* ================= Combate ================= */
function startFight(){
  if (S.phase !== 'prep' || spinning) return;
  if (S.spinsLeft > 0 && !S.confirmFight) {
    S.confirmFight = true;
    setResult('Are you sure?', `You still have ${S.spinsLeft} unused spin${S.spinsLeft > 1 ? 's' : ''}.`);
    renderUI(); return;
  }
  if (S.drag) { cancelDrag(); }
  S.phase = 'fight'; S.held.clear(); S.wins.clear(); S.confirmFight = false; S.drag = null; S.aim = null; S.sel = null;
  S.buff = { haste:0, slow:0 }; S.zones = []; S.fightT = 0; S.charge = false;
  const W = waveInfo(S.wave);
  S.units.forEach(u => { u.hx = u.x; u.hy = u.y; u.skels = 0; u.cd = Math.min(u.cd, .3); });
  S.altarCd = 0;
  S.queue = S.nextQueue.map(q => ({ ...q })); S.curQueue = S.nextQueue;
  S.queue.forEach(q => S.seenKinds.add(q.kind));
  S.spawnT = 0;
  setResult(`Wave ${S.wave}${W.boss ? ' · COMMANDER' : ''}`, 'Your monsters fight automatically. Time your cards carefully.');
  $('#coach').hidden = true;
  sfx('horn'); renderUI(); tip('cards');
}

/* Mover a un humano evitando el agua: si el paso siguiente cae en agua, se desvía hacia la fila libre más cercana. */
function moveHuman(e, dx, dy){
  const lead = dx < 0 ? -e.r - 4 : dx > 0 ? e.r + 4 : 0;
  if (tileAt(e.x + dx + lead, e.y + dy) !== 'water') { e.x += dx; e.y += dy; e.moving = true; return; }
  const c = colOf(e.x + dx + lead), sp = Math.hypot(dx, dy);
  let bestR = null, bd = 1e9;
  for (let r = 0; r < ROWS; r++) { if (S.ter.get(tkey(c, r)) === 'water') continue; const d = Math.abs((r + .5) * TILE - e.y); if (d < bd) { bd = d; bestR = r; } }
  if (bestR === null) return;
  const ty = (bestR + .5) * TILE;
  e.y += clamp(ty - e.y, -sp, sp); e.moving = true;
}

function update(dt){
  if (S.phase !== 'fight') return;
  const Wd = worldW();
  S.buff.haste = Math.max(0, S.buff.haste - dt); S.buff.slow = Math.max(0, S.buff.slow - dt);
  S.fightT += dt;
  if (!S.charge && S.fightT > 40 && !S.queue.length) { S.charge = true; bigMsg('FINAL CHARGE!'); sfx('horn'); }
  S.spawnT -= dt;
  if (S.queue.length && S.spawnT <= 0) {
    const q = S.queue.shift();
    let y = rnd(30, WORLD_H - 28);
    for (let t = 0; t < 8 && tileAt(Wd - 10, y) === 'water'; t++) y = rnd(30, WORLD_H - 28);
    S.enemies.push({ ...q, maxHp:q.hp, x:Wd + 20, y, cd:0, flash:0, root:0, ph:Math.random() * 6 });
    tip('k_' + q.kind);
    S.spawnT = q.kind === 'jin' ? 0.45 : 0.7;
  }
  for (const z of S.zones) { z.t -= dt; S.enemies.forEach(e => { if (dist(e, z) <= z.r + e.r) damage(e, z.dps * dt, { quiet:true, pierce:true }); }); }
  S.zones = S.zones.filter(z => z.t > 0);

  const alive = S.enemies.filter(e => e.hp > 0);
  const banshees = S.units.filter(u => u.type === 'B' && !u.down);
  for (const u of S.units) {
    u.flash = Math.max(0, u.flash - dt); u.lunge = Math.max(0, u.lunge - dt); u.moving = false;
    if (u.down) continue;                                   // caído: queda en el piso hasta la próxima oleada
    const st = stats(u.type, u.lvl, u);
    // Aura de la Banshee: +30/50/80% de daño y velocidad de ataque a los monsters cercanos
    const buff = bansheeOn(u);
    u.buffed = buff;
    if (u.type === 'B') { u.cd -= dt; if (u.cd <= 0) { u.cd = st.cd; S.fx.push({ k:'ring', x:u.x, y:u.y, r:st.range, c:'soul', t:.7, T:.7 }); if (Math.random() < .35) sfx('wail'); } continue; }
    if (u.type === 'N') { u.cd = Math.max(0, u.cd - dt); continue; }
    // Zombies, licántropos y esqueletos salen de su puesto a interceptar humans dentro de su zona de patrulla
    if (BASE[u.type].guard) {
      const g = guardOf(u), home = { x:u.hx ?? u.x, y:u.hy ?? u.y };
      let tg = null, bd = 1e9;
      for (const e of alive) { if (dist(e, home) > g + e.r) continue; const d = dist(e, u); if (d < bd) { bd = d; tg = e; } }
      if (tg && bd > st.range + radius(u) + tg.r) stepUnit(u, tg.x, tg.y, BASE[u.type].move * dt);
      else if (!tg && Math.hypot(u.x - home.x, u.y - home.y) > 3) stepUnit(u, home.x, home.y, BASE[u.type].move * dt);
    }
    let tgt = null, best = 1e9;
    for (const e of alive) { const d = dist(e, u) - e.r - radius(u); if (d < best) { best = d; tgt = e; } }
    if (!tgt || best > st.range) continue;
    u.cd -= dt * (S.buff.haste > 0 ? 2 : 1) * (1 + buff);
    if (u.cd > 0) continue;
    u.cd = st.cd;
    const dmg = st.dmg * (1 + buff);
    const dd = dist(tgt, u) || 1; u.lx = (tgt.x - u.x) / dd; u.ly = (tgt.y - u.y) / dd; u.lunge = .14;
    if (u.type === 'M') { S.shots.push({ k:'fire', x:u.x + 14, y:u.y - 12, tgt, tx:tgt.x, ty:tgt.y, sp:300, dmg, splash:st.splash }); sfx('fireLaunch'); }
    else if (u.type === 'A') { S.shots.push({ k:'orb', x:u.x + 8, y:u.y - 4, tgt, tx:tgt.x, ty:tgt.y, sp:380, dmg }); sfx('orb'); }
    else {
      const c = UCOL[u.type];
      hitEnemy(tgt, dmg, c);
      S.fx.push({ k:'claw', x:tgt.x, y:tgt.y, c, t:.18, T:.18 });
      sfx(u.type === 'L' ? 'bite' : 'claw');
    }
  }
  // El Altar se defiende: rayos a los humans que se le acercan (ignoran armadura y saltan a uno cercano).
  S.altarCd = (S.altarCd || 0) - dt;
  if (S.altarCd <= 0) {
    const near = alive.filter(e => e.hp > 0 && e.x - WALL_X <= 115).sort((a, b) => a.x - b.x);
    if (near.length) {
      const z = 10 + 3 * S.wave; S.altarCd = 1.1;
      zap(near[0], z);
      const jump = near.find(o => o !== near[0] && dist(o, near[0]) < 75); if (jump) zap(jump, z / 2, near[0]);
      sfx('zap'); tip('altar');
    }
  }
  // Proyectiles: persiguen a su objetivo y aplican el daño al impactar.
  for (const s of S.shots) {
    if (s.tgt && s.tgt.hp > 0) { s.tx = s.tgt.x; s.ty = s.tgt.y; }
    const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy), step = s.sp * dt;
    if (d <= step + 4) { s.done = true; landShot(s); continue; }
    s.x += dx / d * step; s.y += dy / d * step; s.ang = Math.atan2(dy, dx);
    if (s.k !== 'bolt' && Math.random() < .6) S.parts.push({ x:s.x, y:s.y, vx:rnd(-15, 15), vy:rnd(-15, 15), t:.25, T:.25, c:s.k === 'fire' ? 'm' : 'a', s:2.5 });
  }
  S.shots = S.shots.filter(s => !s.done);
  const slowF = S.buff.slow > 0 ? 0.4 : 1;
  for (const e of alive) {
    e.flash = Math.max(0, e.flash - dt);
    e.root = Math.max(0, e.root - dt);
    e.moving = false;
    e.lunge = Math.max(0, (e.lunge || 0) - dt);
    if (e.kbv > 1) { const nx = e.x + e.kbv * dt; if (tileAt(nx + e.r, e.y) !== 'water') e.x = nx; e.kbv *= Math.pow(.002, dt); }
    let sp = e.root > 0 ? 0 : e.sp * slowF;
    if (tileAt(e.x, e.y) === 'swamp') sp *= .5;
    const onHill = tileAt(e.x, e.y) === 'hill';

    const lonelyCleric = e.kind === 'cle' && !S.queue.some(q => q.kind !== 'cle') && !alive.some(o => o.kind !== 'cle' && o.hp > 0);
    if (S.charge) sp *= 1.5;
    if (e.kind === 'cle' && !lonelyCleric && !S.charge) {
      // Cleric: se queda atrás y cura a los humans cercanos.
      e.cd -= dt;
      if (e.cd <= 0) {
        e.cd = 2.5;
        const heal = 5 + S.wave * 1.5; let any = false;
        S.enemies.forEach(o => { if (o.kind !== 'cle' && o.hp > 0 && o.hp < o.maxHp && dist(o, e) <= 100) { o.hp = Math.min(o.maxHp, o.hp + heal); any = true; } });
        if (any) S.fx.push({ k:'ring', x:e.x, y:e.y, r:100, c:'gold', t:.5, T:.5 });
      }
      const near = S.units.some(u => dist(u, e) < 170);
      if (!near && e.x > zoneMax() + 50) moveHuman(e, -sp * dt, 0);
      continue;
    }
    if (e.kind === 'bal') {
      let tgt = null, best = 1e9; const rng = e.range * (onHill ? 1.25 : 1);
      for (const u of S.units) { if (u.down) continue; const d = dist(e, u); if (d <= rng && d < best) { best = d; tgt = u; } }
      const altarInRange = e.x - WALL_X <= rng;
      if (tgt || altarInRange) {
        e.cd -= dt;
        if (e.cd <= 0) {
          e.cd = 1.6; const dmg = e.dmg * (onHill ? 1.5 : 1);
          if (tgt) S.shots.push({ k:'bolt', x:e.x - 8, y:e.y, tgt, tx:tgt.x, ty:tgt.y, sp:420, dmg });
          else S.shots.push({ k:'bolt', x:e.x - 8, y:e.y, altar:true, tx:WALL_X - 6, ty:e.y, sp:420, dmg });
          e.lunge = .12; sfx('bolt');
        }
      } else moveHuman(e, -sp * dt, 0);
      continue;
    }
    let tgt = null;
    if (e.kind !== 'ant') {
      let best = 1e9;
      for (const u of S.units) {
        if (u.down) continue;
        const dx = e.x - u.x, dy = Math.abs(u.y - e.y);
        if (dx < -10 || dy > 60 || dx > 150) continue;
        const d = dx + dy * 1.5; if (d < best) { best = d; tgt = u; }
      }
    }
    if (tgt) {
      const d = dist(e, tgt);
      if (d <= e.r + radius(tgt) + 3) { e.cd -= dt; if (e.cd <= 0) { e.cd = 1; tgt.hp -= e.dmg; tgt.flash = 0.15; e.lunge = .12; S.fx.push({k:'sword',x:(e.x+tgt.x)/2,y:(e.y+tgt.y)/2,angle:Math.atan2(tgt.y-e.y,tgt.x-e.x)+Math.PI,t:.24,T:.24}); burst((e.x + tgt.x) / 2, (e.y + tgt.y) / 2, 'steel', 6, 70); sfx('clash'); } }
      else moveHuman(e, (tgt.x - e.x) / d * sp * dt, (tgt.y - e.y) / d * sp * dt);
    } else if (e.x <= WALL_X + e.r + 2) {
      e.cd -= dt;
      if (e.cd <= 0) { e.cd = 1; hitAltar(e.dmg * (e.kind === 'ant' ? 3 : 1)); }
    } else moveHuman(e, -sp * dt, 0);
  }
  const deadE = S.enemies.filter(e => e.hp <= 0);
  if (deadE.length) {
    deadE.forEach(e => {
      burst(e.x, e.y, 'red', 10, 110); burst(e.x, e.y, 'soul', 4, 50); floatText(e.x, e.y - 16, '+1 soul', 'soul', 11);
      // Necromancer: levanta un esqueleto aliado de cada humano que cae en su área
      const n = S.units.find(u => u.type === 'N' && !u.down && u.cd <= 0 && (u.skels || 0) < skelCap(u.lvl) && dist(u, e) <= stats('N', u.lvl, u).range);
      if (n) {
        const k = makeUnit('K', 1); k.temp = true; k.nl = n.lvl; refreshHp(k);
        k.x = clamp(e.x, WALL_X + 20, worldW() - 20); k.y = clamp(e.y, 20, WORLD_H - 20); k.hx = k.x; k.hy = k.y;
        S.units.push(k); n.cd = stats('N', n.lvl, n).cd; n.skels = (n.skels || 0) + 1;
        S.fx.push({ k:'ring', x:k.x, y:k.y, r:30, c:'leaf', t:.6, T:.6 }); burst(k.x, k.y, 'leaf', 12, 90);
        S.fx.push({ k:'line', x1:n.x, y1:n.y, x2:k.x, y2:k.y, c:'leaf', t:.35, T:.35 });
        floatText(k.x, k.y - 24, 'Skeleton!', 'leaf', 11); sfx('raise'); tip('raise');
      }
    });
    S.enemies = S.enemies.filter(e => e.hp > 0);
    S.kills += deadE.length; S.gold += deadE.length; sfx('grunt');
  }
  const dead = S.units.filter(u => u.hp <= 0 && !u.down);
  if (dead.length) {
    dead.forEach(u => {
      floatText(u.x, u.y - 10, u.temp ? `✝ ${NAMES[u.type]}` : `${NAMES[u.type]} fell`, 'red');
      S.fx.push({ k:'ring', x:u.x, y:u.y, r:24, c:'red', t:.5, T:.5 }); burst(u.x, u.y, UCOL[u.type], 14, 120);
      if (u.temp) u.gone = true; else { u.down = true; u.hp = 0; }   // los monsters propios quedan en el piso y vuelven la próxima oleada
    });
    S.shake = Math.max(S.shake, 2);
    S.units = S.units.filter(u => !u.gone);
    sfx('death');
    if (dead.some(u => !u.temp)) tip('death');
    if (!S.units.some(u => !u.down) && (S.enemies.length || S.queue.length)) tip('empty');
  }
  if (S.wallHp <= 0) { S.wallHp = 0; S.phase = 'over'; renderUI(); return endRun(false); }
  if (!S.queue.length && !S.enemies.length) endWave();
}
function damage(e, d, o = {}){
  if (e.armor && !o.pierce) d = Math.max(1, d - e.armor);
  e.hp -= d; if (!o.quiet) e.flash = 0.1;
}
function hitAltar(d){ S.wallHp -= Math.round(d); S.fx.push({ k:'altar', t:0.2, T:0.2 }); S.shake = Math.max(S.shake, 4); burst(WALL_X - 8, rnd(30, WORLD_H - 30), 'soul', 8, 90); sfx('altar'); tip('wall'); }
function zap(e, d, from){
  hitEnemy(e, d, 'soul', { pierce:true, kb:40 });
  const x1 = from ? from.x : WALL_X - 8, y1 = from ? from.y : clamp(e.y, 12, WORLD_H - 12);
  S.fx.push({ k:'zap', x1, y1, x2:e.x, y2:e.y, t:.28, T:.28 });
  S.fx.push({ k:'altarGlow', t:.3, T:.3 });
  burst(e.x, e.y, 'soul', 8, 110);
}
function stepUnit(u, tx, ty, step){
  const d = Math.hypot(tx - u.x, ty - u.y); if (d < 1) return;
  const s = Math.min(step, d), nx = u.x + (tx - u.x) / d * s, ny = clamp(u.y + (ty - u.y) / d * s, 14, WORLD_H - 14);
  if (tileAt(nx, ny) === 'water') return;
  u.x = nx; u.y = ny; u.moving = true;
}
function burst(x, y, c, n, sp = 90){ for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = rnd(sp * .4, sp); S.parts.push({ x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 30, t:rnd(.25, .5), T:.5, c, s:rnd(2, 3.5) }); } }
function hitEnemy(e, d, c, o = {}){
  const armored = e.armor && !o.pierce, real = armored ? Math.max(1, d - e.armor) : d;
  damage(e, d, o);
  burst(e.x, e.y, armored ? 'steel' : c, armored ? 5 : 7);
  const kb = o.kb ?? 60;
  if (kb) e.kbv = Math.max(e.kbv || 0, e.boss ? kb * .2 : e.armor ? kb * .5 : kb);
  floatText(e.x + rnd(-8, 8), e.y - e.r - 10, String(Math.round(real)), armored ? 'muted' : 'cream', 11);
  if (armored) sfx('clank');
}
function landShot(s){
  if (s.k === 'orb') { if (s.tgt && s.tgt.hp > 0) { hitEnemy(s.tgt, s.dmg, 'a', { kb:0 }); sfx('orbHit'); } else burst(s.x, s.y, 'a', 4, 40); }
  else if (s.k === 'fire') {
    S.enemies.forEach(e => { if (e.hp > 0 && Math.hypot(e.x - s.tx, e.y - s.ty) <= s.splash) hitEnemy(e, s.dmg, 'm'); });
    S.fx.push({ k:'ring', x:s.tx, y:s.ty, r:s.splash, c:'m', t:.35, T:.35 });
    burst(s.tx, s.ty, 'm', 14, 140); burst(s.tx, s.ty, 'gold', 8, 100);
    S.shake = Math.max(S.shake, 3); sfx('boom');
  } else if (s.k === 'bolt') {
    if (s.altar) hitAltar(s.dmg);
    else if (s.tgt && s.tgt.hp > 0) { s.tgt.hp -= s.dmg; s.tgt.flash = .15; burst(s.tgt.x, s.tgt.y, 'steel', 5, 60); sfx('clash'); }
  }
}

function endWave(){
  S.units = S.units.filter(u => !u.temp);
  // Los caídos se levantan y todos vuelven a su puesto con la vida completa.
  S.units.forEach(u => { if (u.down) { u.down = false; floatText(u.hx ?? u.x, (u.hy ?? u.y) - 26, 'Revived!', 'leaf', 11); } if (u.hx != null) { u.x = u.hx; u.y = u.hy; } refreshHp(u); });
  // Los monsters que esperaron en la reserva entrenan: +50% de vida y daño permanente (máximo +150%).
  let trained = 0;
  S.bench.forEach(u => { if (u && u.train < 3) { u.train++; refreshHp(u); trained++; floatText(u.x, u.y - 30, `Trained! +${u.train * 50}%`, 'leaf', 11); } });
  if (trained) { sfx('coin'); setTimeout(() => tip('train'), 700); }
  S.zones = []; S.shots = []; S.aim = null;
  if (S.mods.wallRegen) S.wallHp = Math.min(S.wallMax, S.wallHp + S.mods.wallRegen);
  const done = S.wave;
  S.wave++;
  if (done >= MAX_WAVE) { S.phase = 'win'; renderUI(); return endRun(true); }
  S.gold += 3; S.spinsLeft = S.spinsPer; S.bought = 0; S.phase = 'prep';
  genTerrain();
  drawHand();
  S.nextQueue = rollWave(S.wave);
  setResult(`Wave ${done} survived`, `+3 souls. Terrain changed. You have ${S.spinsLeft} spins and new cards.`);
  if (done % 2 === 0) {
    S.phase = 'reward';
    const blessings = shuffle(BLESS.filter(b => !b.ok || b.ok())).slice(0, 2).map(b => ({ ...b, kind:'Blessing' }));
    const cid = shuffle(Object.keys(CARDS))[0];
    S.offer = [...blessings, { n:CARDS[cid].n, ic:CARDS[cid].ic || '✦', d:CARDS[cid].d(), kind:'Card for this run', a:()=>S.deck.push(cid) }];
    showOv(`<h2>Choose a reward</h2><p>Blessings last the entire run. A card joins your deck (${S.deck.length} cards).</p><div class="offers">${S.offer.map((o, i) => `<button class="offer" data-act="reward" data-i="${i}"><span class="ic">${rewardArt(o)}</span><span class="nm">${o.n} <small style="color:var(--soul)">· ${o.kind}</small></span><span class="ds">${o.d}</span></button>`).join('')}</div>`);
  } else tip('layout');
  renderUI();
}
function endRun(won){
  sfx(won ? 'win' : 'lose');
  const notOwned = Object.keys(CARDS).filter(id => !META.deck.includes(id));
  S.endOffer = [...new Set(shuffle(notOwned).concat(shuffle(Object.keys(CARDS))))].slice(0, 3);
  const head = won ? `<h2>The Valley stands!</h2><p>You survived all ${MAX_WAVE} waves and defeated <b>${S.kills}</b> humans.</p>`
                   : `<h2>The Altar has fallen</h2><p>You reached wave <b>${S.wave}</b> of ${MAX_WAVE} and defeated <b>${S.kills}</b> humans.</p>`;
  showOv(`${head}<p><b>Reward:</b> Choose 1 card to add to your starting deck for future runs.</p>
  <div class="cards-row">${S.endOffer.map((id, i) => cardHTML(id, `data-act="endcard" data-i="${i}"`)).join('')}</div>`);
}

/* ================= Puntero ================= */
const cv = $('#cv'), ctx = cv.getContext('2d');
let scale = 1;
function worldW(){ return Math.max(420, cv.clientWidth / scale); }
function toWorld(ev){ const r = cv.getBoundingClientRect(); return { x:(ev.clientX - r.left) / scale, y:(ev.clientY - r.top) / scale }; }
function unitAt(p){ let hit = null; for (const u of S.units) if (dist(u, p) <= radius(u) + 8) hit = u; return hit; }
function mineAt(p){ let hit = null; for (const u of allMine()) if (dist(u, p) <= Math.min(radius(u), 22) + 8) hit = u; return hit; }
/* Qué pasaría si se suelta el monstruo arrastrado donde está ahora. */
function dropPlan(u){
  const from = S.drag.from;
  if (u.y < WORLD_H && u.x < WALL_X + 4) return { kind:'sell', value:sellValue(u) };
  if (u.y >= WORLD_H - 6) {
    let slot = 0, bd = 1e9; for (let i = 0; i < 3; i++) { const d = Math.abs(benchSlot(i).x - u.x); if (d < bd) { bd = d; slot = i; } }
    if (bd > 40) return { kind:'bad', msg:'Soltalo sobre un lugar de la reserva.' };
    const t = S.bench[slot];
    if (!t || t === u) return { kind:'bench', slot };
    if (mergeable(t, u)) return { kind:'merge', target:t };
    return { kind:'bad', msg:'That reserve slot is occupied.' };
  }
  const st = canStand(u, u.x, u.y);
  if (!st.ok && st.why === 'ocupado' && mergeable(st.hit, u)) return { kind:'merge', target:st.hit };
  if (!st.ok) return { kind:'bad', msg:{ fuera:'Place monsters inside your zone.', agua:'Monsters cannot stand in water.', ocupado:'That spot is occupied. Monsters cannot overlap.' }[st.why] };
  if (from === 'bench' && fieldCount() + u.pile > S.maxUnits) return { kind:'bad', msg:`Field is full (${S.maxUnits}). Buy a slot or play Expanded Crypt.` };
  return { kind:'place' };
}
/* Confirmación antes de apilar o fusionar, para evitar errores al soltar. */
let askMerge = store.get('gs.askMerge', true);
function askMergeConfirm(target, src){
  const total = target.pile + src.pile, fuse = total >= S.mods.mergeN, name = `${NAMES[target.type]} ${'★'.repeat(target.lvl)}`;
  S.pendingMerge = { target, src };
  const o = $('#ov2');
  o.innerHTML = `<div class="panel confirm"><h2>${fuse ? 'Merge?' : 'Stack?'}</h2>
    <div class="cm-row">${img(USPR[src.type])}<span class="cm-plus">+</span>${img(USPR[target.type])}<span class="cm-plus">→</span>${fuse ? `<span class="cm-res">${img(USPR[target.type])}<b>${'★'.repeat(target.lvl + 1)}</b></span>` : `<span class="cm-res"><b>${total}/${S.mods.mergeN}</b></span>`}</div>
    <p>${fuse ? `Your ${total} <b>${name}</b> merge into <b>${NAMES[target.type]} ${'★'.repeat(target.lvl + 1)}</b>.` : `Stack <b>${total} ${name}</b> (${total}/${S.mods.mergeN}). Add ${S.mods.mergeN - total} more to merge.`}</p>
    <label class="cm-ask"><input type="checkbox" id="noAsk"> Do not ask again</label>
    <div class="btns"><button class="go" data-act="mergeYes">${fuse ? 'Merge' : 'Stack'}</button><button class="btn" data-act="mergeNo">Cancel</button></div></div>`;
  o.hidden = false; o.querySelector('[data-act="mergeYes"]').focus();
}
function closeMergeConfirm(ok){
  const pm = S.pendingMerge; S.pendingMerge = null;
  const cb = $('#noAsk'); if (cb && cb.checked) { askMerge = false; store.set('gs.askMerge', false); }
  $('#ov2').hidden = true;
  if (ok && pm && S.phase === 'prep' && allMine().includes(pm.target) && allMine().includes(pm.src)) doMerge(pm.target, pm.src);
  else if (!ok) setResult('Canceled', 'Monsters were not stacked.');
  renderUI();
}
function cancelDrag(){
  const d = S.drag; if (!d) return;
  d.u.x = d.ox; d.u.y = d.oy; S.drag = null;
}
function resolveDrop(){
  const d = S.drag, u = d.u, plan = dropPlan(u);
  if (plan.kind === 'bad') { cancelDrag(); setResult('Invalid placement', plan.msg); renderUI(); return; }
  S.drag = null;
  if (plan.kind === 'sell') { removeUnit(u); S.gold += plan.value; floatText(WALL_X + 30, u.y, `+${plan.value} souls`, 'soul'); burst(WALL_X, u.y, 'soul', 12, 90); sfx('coin'); setResult('Sold', `${NAMES[u.type]} ${'★'.repeat(u.lvl)} for ${plan.value} souls.`); }
  else if (plan.kind === 'merge') { u.x = d.ox; u.y = d.oy; if (askMerge) { askMergeConfirm(plan.target, u); return; } doMerge(plan.target, u); }
  else if (plan.kind === 'bench') { removeUnit(u); S.bench[plan.slot] = u; Object.assign(u, benchSlot(plan.slot)); sfx('place'); }
  else { if (d.from === 'bench') { removeUnit(u); S.units.push(u); } sfx('place'); }
  S.sel = S.units.includes(u) || S.bench.includes(u) ? u : S.sel;
  renderUI();
}
function enemyAt(p){ let hit = null; for (const e of S.enemies) if (dist(e, p) <= e.r + 8) hit = e; return hit; }
const aimingTerrain = () => S.aim !== null && S.hand[S.aim] && CARDS[S.hand[S.aim].id].t === 'ter';
cv.addEventListener('pointerdown', ev => {
  if (!S) return;
  audioInit();
  const p = toWorld(ev);
  if (S.phase === 'fight' && S.aim !== null) { castAim(p); return; }
  if (S.phase === 'prep' && aimingTerrain()) { placeTerrain(p); return; }
  const u = mineAt(p);
  if (S.phase !== 'prep') { S.sel = u || null; renderIntel(); return; }
  if (!u) { if (S.sel) { S.sel = null; renderIntel(); } return; }
  S.drag = { u, dx:u.x - p.x, dy:u.y - p.y, ox:u.x, oy:u.y, sx:p.x, sy:p.y, moved:false, from:S.bench.includes(u) ? 'bench' : 'field' };
  cv.setPointerCapture(ev.pointerId);
});
cv.addEventListener('pointermove', ev => {
  if (!S) return;
  const p = toWorld(ev);
  S.aimP = p;
  if (S.drag) {
    const d = S.drag;
    if (!d.moved && Math.hypot(p.x - d.sx, p.y - d.sy) > 5) { d.moved = true; S.sel = d.u; }
    if (d.moved) { d.u.x = clamp(p.x + d.dx, 6, worldW() - 6); d.u.y = clamp(p.y + d.dy, 6, LOGIC_H - 6); }
  }
  const hov = S.phase === 'prep' && !S.drag && mineAt(p);
  cv.style.cursor = S.aim !== null ? 'crosshair' : S.drag && S.drag.moved ? 'grabbing' : hov ? 'grab' : 'default';
});
const endDrag = () => {
  if (!S || !S.drag) return;
  if (!S.drag.moved) { const u = S.drag.u; S.drag = null; S.sel = S.sel === u ? null : u; renderIntel(); return; }
  resolveDrop();
};
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', () => { if (S && S.drag) { cancelDrag(); renderUI(); } });
cv.addEventListener('pointerleave', () => { if (S) S.aimP = null; });

/* ================= Dibujo ================= */
function resize(){
  const dpr = window.devicePixelRatio || 1;
  cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
  scale = cv.clientHeight / LOGIC_H;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
function readColors(){ const cs = getComputedStyle(document.documentElement); ['bg','panel','panel-2','line','gold','soul','cream','muted','red','w','a','m','wolf','steel','leaf','stone','water','hill','swamp','m2'].forEach(k => colors[k] = cs.getPropertyValue('--' + k).trim()); }
function floatText(x, y, text, c, sz){ if (sz && S.floats.length > 40) return; S.floats.push({ x, y, text, c, sz, t:sz ? .8 : 1.2, T:sz ? .8 : 1.2 }); }
function sprite(name, x, y, h, o = {}){
  const frames = o.flash ? SPRW[name] : o.gray ? SPRGRAY[name] : (SPRLEVEL[name]?.[o.level] || SPR[name]), fr = frames[Math.abs(Math.floor(o.frame || 0)) % frames.length];
  const w = h * fr.width / fr.height;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y)); if (o.rot) ctx.rotate(o.rot); if (o.sy) ctx.scale(1, o.sy);
  ctx.drawImage(fr, -w / 2, -h / 2, w, h);
  ctx.restore();
}
function drawInkBackdrop(W){
 ctx.save();ctx.imageSmoothingEnabled=true;
 if(gothicBackdrop){const b=gothicBackdrop;ctx.drawImage(b,0,b.height*.53,b.width,b.height*.47,0,0,W,WORLD_H);}
 else{ctx.fillStyle=colors.panel;ctx.fillRect(0,0,W,WORLD_H);}
 ctx.fillStyle='rgba(29,24,34,.29)';ctx.fillRect(WALL_X,0,W-WALL_X,WORLD_H);
 ctx.restore();
}
function drawInkAltar(t){
 const hurt=S.fx.some(f=>f.k==='altar'),glow=S.fx.some(f=>f.k==='altarGlow');
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
function drawInkShot(s,t){
 ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.ang??0);
 if(s.k==='bolt'){
  ctx.strokeStyle='#17151c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-13,0);ctx.lineTo(6,0);ctx.stroke();ctx.strokeStyle='#d7c8aa';ctx.lineWidth=1.2;ctx.stroke();
  ctx.fillStyle='#efe1c4';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(3,-3);ctx.lineTo(4,0);ctx.lineTo(3,3);ctx.closePath();ctx.fill();ctx.strokeStyle='#9e7476';ctx.beginPath();ctx.moveTo(-12,-3);ctx.lineTo(-8,0);ctx.lineTo(-12,3);ctx.stroke();
 }else{
  const fire=s.k==='fire',col=fire?'#d38a72':'#a9d4bf';ctx.lineWidth=1.1;
  for(let j=0;j<3;j++){ctx.globalAlpha=.2+j*.18;ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(-22-j*3,(j-1)*3);ctx.bezierCurveTo(-16,-5+Math.sin(t*8+j)*4,-8,7-j*3,0,0);ctx.stroke();}
  ctx.globalAlpha=1;ctx.fillStyle=col;ctx.strokeStyle='#30222f';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(7,0);ctx.bezierCurveTo(7,-8,-4,-9,-12,-4);ctx.lineTo(-5,-3);ctx.lineTo(-12,2);ctx.bezierCurveTo(-1,7,6,7,7,0);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f3e7cc';ctx.beginPath();ctx.ellipse(2,0,3,2,0,0,Math.PI*2);ctx.fill();
 }ctx.restore();
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
      const u = it.u, inBench = u.y >= WORLD_H - 6 && !S.units.includes(u), s = inBench ? Math.min(size(u), 44) : size(u), dragging = S.drag && S.drag.u === u, ph = u.ph;
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
      bar(u.x - 14, u.y + s / 2 + 2, 28, 4, u.hp / u.maxHp, colors.leaf);
    } else {
      const e = it.e, K = KIND[e.kind], s = e.r * 2 + 14, pose = visualPose(e, performance.now() / 1000);
      const walk = motionPreference.matches ? 0 : e.moving ? Math.abs(Math.sin(t * 10 + e.ph)) * -3 : Math.sin(t * 2 + e.ph) * 1;
      const rot = !motionPreference.matches && e.moving ? Math.sin(t * 10 + e.ph) * .07 : 0;
      if (hovE === e) { ctx.strokeStyle = colors.red; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, s / 2 + 6, 0, Math.PI * 2); ctx.stroke(); }
      sprite(K.spr, e.x - (!motionPreference.matches && e.lunge > 0 ? e.lunge / .12 * 6 : 0), e.y + walk, e.kind === 'jin' ? s * 1.15 : s, { flash:e.flash > 0, rot, frame:pose.frame });
      if (e.kind === 'ant') { ctx.fillStyle = colors.m; ctx.globalAlpha = .5 + .5 * Math.sin(t * 20 + e.ph); ctx.beginPath(); ctx.arc(e.x - s * .34, e.y - s * .45 + walk, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      if (e.root > 0) { ctx.strokeStyle = colors.leaf; ctx.lineWidth = 3; ctx.strokeRect(e.x - s / 2 - 2, e.y - s / 2 - 2, s + 4, s + 4); }
      bar(e.x - e.r, e.y + s / 2 + 2, e.r * 2, 4, e.hp / e.maxHp, colors.red);
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

let last = performance.now();
function loop(now){
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (S && !menuOpen && !document.hidden) {
    if (S.aim !== null && S.phase === 'fight') dt *= 0.2;
    dt *= S.speed;
    for (let i = 0; i < S.speed; i++) update(dt / S.speed);
    const fdt = dt / Math.max(1, S.speed);
    S.fx.forEach(f => f.t -= fdt); S.fx = S.fx.filter(f => f.t > 0);
    S.floats.forEach(f => f.t -= fdt); S.floats = S.floats.filter(f => f.t > 0);
    S.parts.forEach(p => { p.x += p.vx * fdt; p.y += p.vy * fdt; p.vy += 220 * fdt; p.t -= fdt; }); S.parts = S.parts.filter(p => p.t > 0);
    if (S.parts.length > 400) S.parts.splice(0, S.parts.length - 400);
    S.shake = Math.max(0, S.shake - fdt * 14);
    draw();
    if (S.phase === 'fight' && now-lastAutosave>150) { renderChips(); renderBuyCard(); lastAutosave=now; }
  }
  requestAnimationFrame(loop);
}

/* ================= UI ================= */
function setResult(a, b){ S.result = a; S.resultSub = b; }
function renderChips(){
  $('#chips').innerHTML = `
    <span class="chip">Wave <b>${Math.min(S.wave, MAX_WAVE)}/${MAX_WAVE}</b></span>
    <span class="chip ${S.wallHp < S.wallMax * 0.35 ? 'bad' : ''}">Altar <b>${S.wallHp}/${S.wallMax}</b></span>
    <span class="chip soul">Souls <b>${S.gold}</b></span>
    <span class="chip">Monsters <b>${fieldCount()}/${S.maxUnits}</b></span>
    <span class="chip">Reserve <b>${S.bench.filter(Boolean).length}/3</b></span>`;
  const b = $('#banner');
  if (S.phase === 'fight') { b.hidden = false; b.innerHTML = !S.units.length ? '<b>No defenders! Use your cards</b>' : `Humans remaining: <b>${S.queue.length + S.enemies.length}</b>`; }
  else if (S.phase === 'prep' && S.wave <= MAX_WAVE) {
    const boss = S.nextQueue.some(q => q.boss);
    b.hidden = false; b.innerHTML = `Next: wave ${S.wave} · <b>${S.nextQueue.length} humans${boss ? ' with COMMANDER' : ''}</b> · see enemy details`;
  } else b.hidden = true;
}
function renderBuyCard(){
  const b = document.querySelector('[data-act="buycard"]'); if (!b) return;
  const ok = buyable().length > 0 && S.gold >= cardCost();
  if (b.disabled === ok) b.disabled = !ok;
}
function renderHand(){
  const fight = S.phase === 'fight';
  $('#handTitle').textContent = fight ? 'Your cards · click to play · unused cards carry over' : 'Your cards · preparation cards now, combat cards in battle · unused cards carry over';
  $('#deckLink').textContent = `View deck (${S.deck.length})`;
  $('#relic').innerHTML = S.relic ? `<span class="medal" title="${S.relic.d}">${relicArt(S.relic)}</span><span class="rn">${S.relic.n}</span><span class="rd">${S.relic.d}</span>` : '';
  const canBuy = buyable().length > 0 && S.gold >= cardCost();
  $('#hand').innerHTML = S.hand.map((c, i) => {
    const now = !c.used && (S.phase === 'prep' || S.phase === 'fight') && usableNow(c.id);
    const later = !c.used && !now;
    return cardHTML(c.id, `data-cardi="${i}" ${now ? '' : 'disabled'} title="${later ? (isPrepCard(c.id) ? 'Preparation only' : 'Play during combat') : ''}"`, `${c.used ? 'used' : ''} ${later ? 'later' : ''} ${S.aim === i ? 'aim' : ''} ${c.fresh && S.phase === 'prep' ? 'fresh' : ''}`, c.free ? ' · free' : c.fresh && S.phase === 'prep' ? ' · new' : '');
  }).join('')
    + (S.phase === 'prep' || fight ? `<button class="card buy" data-act="buycard" ${canBuy ? '' : 'disabled'}><span class="plus">+</span><span class="bt">Draw a random card from your deck</span><span class="bc">${cardCost()} souls</span></button>` : '');
}
function renderPay(){
  $('#pay').innerHTML = `<div><b>3 matching symbols in a line</b> (row, column or diagonal):</div>
    <div class="row">${['W','A','M','C'].map(k => `<span>${img(SYM[k].spr)}<b>${SYM[k].n}</b> · ${SYM[k].role}</span>`).join('')}</div>
    <div><b>Merge:</b> during preparation, drop a monster onto another of the same type and level. With <b>3 stacked</b> they merge (★★, ★★★). Pay for everything with <b style="color:var(--soul)">almas</b>.</div>`;
}
const FOE_NOTE = { sol:'Melee', bal:'Range: 150 px', cab:'Armor reduces damage per hit', jin:'Very fast', cle:'Heals nearby humans', ant:'Ignores monsters, ×3 Altar damage', com:'Armored boss' };
function renderIntel(){
  if (!S) return;
  // Incoming wave (o la actual durante el combate)
  const q = S.phase === 'fight' ? null : S.nextQueue;
  const wb = $('#waveBox');
  if (S.phase === 'relic' || S.phase === 'win' || S.phase === 'over' || (!q && S.phase !== 'fight')) { wb.innerHTML = '<h3>Incoming wave</h3><span class="empty">Choose a relic to begin.</span>'; }
  else {
    const src = q || S.curQueue || [];
    const groups = {};
    src.forEach(e => { (groups[e.kind] = groups[e.kind] || []).push(e); });
    const order = ['com','sol','cab','bal','cle','jin','ant'].filter(k => groups[k]);
    const total = src.length;
    wb.innerHTML = `<h3><span>${S.phase === 'fight' ? 'Current wave' : 'Incoming wave'} <b>${Math.min(S.wave, MAX_WAVE)}</b></span><span>${total} humans</span></h3>
      <div class="foes">${order.map(k => {
        const g = groups[k], e = g[0], sp = Math.round(g.reduce((s, x) => s + x.sp, 0) / g.length), isNew = !S.seenKinds.has(k);
        return `<div class="foe" title="${FOE_NOTE[k]}"><img src="${URL_[KIND[k].spr]}" alt=""><span class="fn">${KIND[k].n} <b>×${g.length}</b>${isNew ? '<span class="new">NEW</span>' : ''}</span>
          <span class="fs">♥ ${Math.round(e.hp)} · ⚔ ${e.dmg ? Math.round(e.dmg * 10) / 10 : '—'} · speed ${sp}${e.armor ? ' · armor ' + e.armor : ''}</span><span class="fx">${FOE_NOTE[k]}</span></div>`;
      }).join('')}</div>`;
  }
  // Selected monster
  const ub = $('#unitBox'), u = S.sel && (S.units.includes(S.sel) || S.bench.includes(S.sel)) ? S.sel : null;
  if (!u) { ub.innerHTML = `<h3>Monster</h3><span class="empty">Select a monster to view its range and stats.</span>`; return; }
  const st = stats(u.type, u.lvl, u), inBench = S.bench.includes(u), hill = !inBench && BASE[u.type].ranged && tileAt(u.x, u.y) === 'hill';
  const role = { W:'Patrols and stops humans', A:'Ranged attacker', M:'Area fire', N:`Raises up to ${skelCap(u.lvl)} skeletons per wave`, B:`Aura: +${Math.round(bansheeBuff(u.lvl) * 100)}% damage and speed to nearby allies`, L:'Temporary, this wave only', K:'Temporary, this wave only' }[u.type];
  const bf = bansheeOn(u);
  const tags = [inBench ? 'reserve' : '', u.down ? 'fallen' : '', hill ? 'hill +50%' : '', u.train ? `entrenado +${u.train * 50}%` : '', bf ? `<b class="bns">Banshee +${Math.round(bf * 100)}%</b>` : ''].filter(Boolean).join(' · ');
  const reach = BASE[u.type].guard ? `patrol ${Math.round(guardOf(u))}` : BASE[u.type].support ? `area ${Math.round(st.range)}` : `range ${Math.round(st.range)}`;
  const up = v => `<b class="bns">${v}</b>`;
  const atk = BASE[u.type].support ? '' : bf
    ? ` · ⚔ ${st.dmg} → ${up(Math.round(st.dmg * (1 + bf)))} · 1 every ${st.cd.toFixed(1)} → ${up((st.cd / (1 + bf)).toFixed(1))} s`
    : ` · ⚔ ${st.dmg} · 1 every ${st.cd.toFixed(1)} s`;
  ub.innerHTML = `<h3>Selected monster</h3>
    <div class="foe mine${bf ? ' buffed' : ''}"><img src="${URL_[USPR[u.type]]}" alt=""><span class="fn">${NAMES[u.type]} <b>${u.temp ? '' : '★'.repeat(u.lvl)}</b>${u.pile > 1 ? `<span class="new">${u.pile}/${S.mods.mergeN}</span>` : ''}</span>
      <span class="fs">♥ ${Math.ceil(u.hp)}${atk} · ${reach}</span><span class="fx">${role}${tags ? ' · ' + tags : ''}</span></div>`;
}
function renderUI(){
  renderChips(); renderHand(); renderIntel();
  const prep = S.phase === 'prep';
  $('#reels').innerHTML = S.grid.map((k, i) => `<button class="cell ${S.held.has(i) ? 'held' : ''} ${S.wins.has(i) ? 'win' : ''}" data-cell="${i}" ${prep && !spinning ? '' : 'disabled'} aria-label="${SYM[k].n}${S.held.has(i) ? ', held' : ''}">${cellHTML(k)}</button>`).join('');
  $('#result').innerHTML = `${S.result}<small>${S.resultSub}</small>`;
  const cost = spinCost(), canBuy = prep && S.gold >= cost && !spinning;
  $('#btns').innerHTML = `
    <button class="btn spin ${prep && !S.spunOnce && S.spinsLeft > 0 ? 'nudge' : ''}" data-act="spin" ${prep && S.spinsLeft > 0 && !spinning ? '' : 'disabled'}>SPIN (${S.spinsLeft})</button>
    <button class="btn ${prep && S.spinsLeft === 0 && canBuy ? 'nudge' : ''}" data-act="buy" ${canBuy ? '' : 'disabled'}>Buy spin · <span class="s">${cost} souls</span></button>
    <button class="btn" data-act="slot" ${prep && S.gold >= slotCost() && !spinning ? '' : 'disabled'} title="Increase field capacity">+1 slot (${S.maxUnits}→${S.maxUnits + 1}) · <span class="s">${slotCost()} souls</span></button>
    <button class="btn fight ${S.confirmFight ? 'warn' : ''} ${prep && S.spinsLeft === 0 && !canBuy ? 'nudge' : ''}" data-act="fight" ${prep && !spinning ? '' : 'disabled'}>${S.confirmFight ? 'DEFEND ANYWAY' : 'DEFEND!'}</button>`;
  const groups = {};
  allMine().forEach(u => { const k = u.type + u.lvl; groups[k] = groups[k] || { u, n:0 }; groups[k].n += u.pile; });
  $('#roster').innerHTML = Object.values(groups).sort((a, b) => b.u.lvl - a.u.lvl).map(({ u, n }) => {
    const ready = u.lvl < 3 && n >= S.mods.mergeN;
    return `<span class="${ready ? 'near' : ''}" title="${ready ? 'Stack on the field or in reserve to merge' : ''}">${img(USPR[u.type])} ${NAMES[u.type]} ${'★'.repeat(u.lvl)} ×${n}${u.lvl < 3 ? ` <small>(${n}/${S.mods.mergeN})${ready ? ' ready to merge!' : ''}</small>` : ''}</span>`;
  }).join('');
  $('#speedBtn').textContent = '×' + S.speed;
}
function showDeck(){
  const inRun = S && S.phase !== 'relic', deck = inRun ? S.deck : META.deck;
  const o = $('#ov2');
  o.innerHTML = `<div class="panel"><h2>${inRun ? 'Your current deck' : 'Your starting deck'} · ${deck.length} cards</h2><p>Draw ${S ? S.handSize : 3} random cards per wave. Spend souls to buy more.</p>
    <div class="cards-row">${deck.map(id => cardHTML(id, 'disabled tabindex="-1"')).join('')}</div>
    <button class="go" data-act="closedeck">Close</button></div>`;
  o.hidden = false; o.querySelector('[data-act="closedeck"]').focus();
}
function showOv(html){ const o = $('#ov'); o.innerHTML = `<div class="panel">${html}</div>`; o.hidden = false; const b = o.querySelector('button'); if (b) b.focus(); }
function hideOv(){ $('#ov').hidden = true; }

document.addEventListener('click', e => {
  audioInit();
  const c = e.target.closest('[data-cell]');
  if (c && !c.disabled) return toggleHold(+c.dataset.cell);
  const k = e.target.closest('[data-cardi]');
  if (k && !k.disabled) return useCard(+k.dataset.cardi);
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const a = b.dataset.act;
  if (a === 'spin') spin();
  else if (a === 'buy') buySpin();
  else if (a === 'slot') buySlot();
  else if (a === 'buycard') buyCard();
  else if (a === 'fight') startFight();
  else if (a === 'deck') showDeck();
  else if (a === 'closedeck') $('#ov2').hidden = true;
  else if (a === 'mergeYes') closeMergeConfirm(true);
  else if (a === 'mergeNo') closeMergeConfirm(false);
  else if (a === 'music') setMusic(!AU.music);
  else if (a === 'sfx') setSfx(!AU.sfx);
  else if (a === 'speed') { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 4 : 1; renderUI(); }
  else if (a === 'relic') startRun(+b.dataset.i);
  else if (a === 'endcard') { const id = S.endOffer[+b.dataset.i]; META.deck.push(id); saveMeta(); hideOv(); showHome(); }
  else if (a === 'reward') { S.offer[+b.dataset.i].a(); allMine().forEach(refreshHp); S.phase = 'prep'; hideOv(); renderUI(); tip('layout'); }
});
document.addEventListener('keydown', e => {
  if (!S) return;
  if (e.key === 'Escape' && !$('#ov2').hidden) { if (S.pendingMerge) closeMergeConfirm(false); else $('#ov2').hidden = true; return; }
  if (!$('#ov').hidden || !$('#ov2').hidden) return;
  if (e.key === 'Escape' && S.aim !== null) { S.aim = null; renderHand(); return; }
  if (/^[1-6]$/.test(e.key)) { useCard(+e.key - 1); return; }
  if (S.phase === 'prep' && e.code === 'Space' && !e.target.closest('button')) { e.preventDefault(); spin(); }
});
window.addEventListener('resize', () => { resize(); if (S) { const zm = zoneMax(); S.units.forEach(u => u.x = Math.min(u.x, zm)); S.bench.forEach((u, i) => { if (u) Object.assign(u, benchSlot(i)); }); draw(); } });

const BATTLEFIELD_ART='assets/battlefield.png';
const HYBRID_ATLAS='assets/hybrid-atlas.png';
/* Stop Humans! v15 — presentation, profile and versioned persistence. */
const HYBRID = {
 names:['zombi','espectro','dragon','nigromante','banshee','lobo','esqueleto','soldado','ballestero','caballero','jinete','clerigo','incendiario','comandante','alma','comodin'],

 cards:{rugido:'dragon',manos:'zombi',huesos:'esqueleto',festin:'zombi',aullido:'lobo',ofrenda:'alma',niebla:'espectro',temblor:'comandante',eclipse:'banshee',murcielagos:'banshee',cosecha:'alma',cripta:'nigromante'},
 palette:{slash:['#2246a6','#00bfff','#92fcff'],claw:['#652c9a','#ec54ff','#ffe7ff'],fire:['#b32955','#ff623a','#fff0ad'],orb:['#6333c8','#bb6bff','#f5dcff']}
};
const PROFILE_KEY='gs14.profile',SAVE_KEY='gs14.save',SCORES_KEY='gs14.scores',SETTINGS_KEY='gs14.settings';
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
let profile=store.get(PROFILE_KEY,null)||{id:uid(),name:''};
let prefs={volume:.65,effects:'full',reduced:false,...store.get(SETTINGS_KEY,{})};
delete prefs.humor;
let menuOpen=true, storageOK=true, loadedSave=null, menuReturn='home', sessionRunId='', runName='', lastAutosave=0;
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function durableWrite(k,v){try{localStorage.setItem(k,JSON.stringify(v));storageOK=true;return true;}catch(e){storageOK=false;$('#saveStatus').textContent='The browser blocked saving. Export your save from the menu.';return false;}}
function savePrefs(){durableWrite(SETTINGS_KEY,prefs);document.body.classList.toggle('reduce-motion',prefs.reduced);if(AU.master)AU.master.gain.value=prefs.volume;}
function fallbackUnit(name){const c=inkCanvas(40,40),g=c.getContext('2d');g.fillStyle='#19152c';g.fillRect(9,8,22,30);g.fillStyle=MONSTER_TINT[name]||'#b7bbd4';g.fillRect(11,10,18,25);g.fillStyle='#201b32';g.fillRect(14,17,3,3);g.fillRect(23,17,3,3);g.fillRect(17,25,8,2);return c;}
function pixelFrame(src,name,state,f){
 const c=inkCanvas(48,48),g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const ghost=['espectro','banshee','alma'].includes(name),dir=MONSTER_TINT[name]?1:-1;
 const attack=state==='attack',walk=state==='walk',wiggle=walk?[0,-1,0,1][f]:ghost?[0,-1,-2,-1][f]:[0,0,-1,0][f];
 const kick=attack?[0,2,4,0][f]*dir:0;
 let dw=src.width,dh=src.height;
 g.save();g.translate(24+kick,45+wiggle);
 if(attack)g.transform(1,0,dir*[0,.04,.1,0][f],1,0,0);
 // Art is sampled once at native sprite resolution; animation preserves the grid.
 g.drawImage(src,Math.round(-dw/2),-dh,dw,dh);
 if(walk&&f%2){g.clearRect(24*-1, -2,48,2);g.drawImage(src,0,src.height-5,src.width,5,Math.round(-dw/2)+(f===1?1:-1),-5,dw,5);}
 g.restore();return c;
}
let battlefieldArt=null;
async function buildHybridArt(){
 try{battlefieldArt=await loadInkImage(BATTLEFIELD_ART);}catch(e){console.warn("Fondo de respaldo activo");}
 let atlas=null;try{atlas=await loadInkImage(HYBRID_ATLAS);}catch(e){console.warn('Atlas fallback activo');}
 HYBRID.names.forEach((name,i)=>{
  let src;
  if(atlas){
   const cw=atlas.width/4,ch=atlas.height/4,c=inkCanvas(Math.floor(cw),Math.floor(ch)),g=c.getContext('2d');
   g.drawImage(atlas,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,c.width,c.height);
   const p=g.getImageData(0,0,c.width,c.height);let x0=c.width,y0=c.height,x1=0,y1=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(p.data[(y*c.width+x)*4+3]>140){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   if(x1>x0){const ratio=Math.min(43/(x1-x0+1),44/(y1-y0+1));src=inkCanvas(Math.max(1,Math.round((x1-x0+1)*ratio)),Math.max(1,Math.round((y1-y0+1)*ratio)));const q=src.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(c,x0,y0,x1-x0+1,y1-y0+1,0,0,src.width,src.height);}
  }
  src ||= fallbackUnit(name);
  SPR[name]=['idle','walk','attack'].flatMap(state=>[0,1,2,3].map(f=>pixelFrame(src,name,state,f)));
  SPRW[name]=SPR[name].map(whiteOf);SPRGRAY[name]=SPR[name].map(grayscaleSprite);
  if(MONSTER_TINT[name])SPRLEVEL[name]={2:SPR[name].map(s=>rankSprite(s,name,2)),3:SPR[name].map(s=>rankSprite(s,name,3))};
  URL_[name]=SPR[name][0].toDataURL();
 });
 // All interface art is built from the same atlas, with type-colored spell frames.
 Object.keys(CARDS).forEach(id=>{const name=HYBRID.cards[id]||({atk:'dragon',ctl:'espectro',sup:'alma',sum:'nigromante',ter:'comodin'}[CARDS[id].t]);const c=inkCanvas(96,64),g=c.getContext('2d');g.fillStyle='#171b2d';g.fillRect(0,0,96,64);g.imageSmoothingEnabled=false;g.drawImage(SPR[name][0],24,7,48,48);g.strokeStyle=({atk:'#ff6549',ctl:'#ad82ff',sup:'#78e1bc',sum:'#eab85a',ter:'#6ca6cb'}[CARDS[id].t]);g.lineWidth=2;g.strokeRect(3,3,90,58);for(let i=0;i<5;i++)g.fillRect(9+i*4,49-i*4,2,2);GOTHIC_DATA.cards[id]=c.toDataURL();});
 GOTHIC_DATA.relics=['dragon','esqueleto','alma','nigromante','comodin','caballero'].map(n=>URL_[n]);
 const strip=$('#heroCast');strip.innerHTML=['zombi','espectro','dragon','caballero'].map(n=>`<img src="${URL_[n]}" alt="${n}">`).join('');
}
function sprite(name,x,y,h,o={}){
 const frames=(o.flash?SPRW[name]:o.gray?SPRGRAY[name]:(SPRLEVEL[name]?.[o.level]||SPR[name]));
 if(!frames?.length){ctx.fillStyle='#d6bc85';ctx.fillRect(x-8,y-8,16,16);return;}
 const fr=frames[Math.abs(Math.floor(o.frame||0))%frames.length],w=h*fr.width/fr.height;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));if(o.rot&&!prefs.reduced)ctx.rotate(o.rot);if(o.sy)ctx.scale(1,o.sy);ctx.drawImage(fr,-w/2,-h/2,w,h);ctx.restore();
}
let bgCache=null,bgWidth=0;
function drawInkBackdrop(W){
 if(battlefieldArt){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(battlefieldArt,0,0,W,WORLD_H);ctx.fillStyle='#101e3526';ctx.fillRect(0,0,W,WORLD_H);ctx.restore();return;}
 if(!bgCache||bgWidth!==Math.ceil(W)){
 bgWidth=Math.ceil(W);bgCache=inkCanvas(bgWidth,WORLD_H);const g=bgCache.getContext('2d');g.fillStyle='#272d37';g.fillRect(0,0,W,WORLD_H);
 for(let y=0;y<WORLD_H;y+=13)for(let x=40;x<W;x+=26){const n=(x*37+y*71)%29;g.fillStyle=['#303740','#2d343a','#353b41'][n%3];g.fillRect(x+(y%26?13:0),y,24,11);if(n<5){g.fillStyle='#444d45';g.fillRect(x+5,y+8,7,2);}}
 for(let x=45;x<W;x+=67){g.fillStyle='#161b2a';g.fillRect(x,0,48,8);g.fillStyle='#4a485b';g.fillRect(x+1,1,46,3);g.fillStyle='#656174';g.fillRect(x+3,1,8,2);g.fillStyle='#1c2330';g.fillRect(x+28,6,6,7);}
 g.fillStyle='#1c2434';g.fillRect(40,WORLD_H-5,W,5);
 }ctx.drawImage(bgCache,0,0);
}
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
const baseDraw=draw;draw=function(){baseDraw();hybridFX();};
function snapshot(){
 if(!S)return null;
 const refs=[...S.units,...S.bench.filter(Boolean),...S.enemies];
 const state={...S,held:[...S.held],wins:[...S.wins],ter:[...S.ter],seenKinds:[...S.seenKinds],sel:null,drag:null,pendingMerge:null,aim:null,aimP:null,shots:S.shots.map(s=>({...s,tgt:undefined,targetIndex:refs.indexOf(s.tgt)})),relicIndex:RELICS.indexOf(S.relic),relic:null,offer:S.offer.map(o=>({n:o.n,kind:o.kind})),fx:[],parts:[],floats:[],shake:0};
 return {version:14,runId:sessionRunId,name:runName,savedAt:Date.now(),worldWidth:worldW(),state};
}
function validSave(v){return !!(v&&v.version===14&&v.state&&['prep','fight','reward','win','over'].includes(v.state.phase)&&Array.isArray(v.state.units)&&Array.isArray(v.state.enemies)&&Array.isArray(v.state.ter)&&Array.isArray(v.state.bench)&&v.state.wave>=1&&v.state.wave<=11);}
function persist(){if(!S||spinning||S.drag||S.pendingMerge||S.phase==='relic')return false;const v=snapshot();loadedSave=v;const ok=durableWrite(SAVE_KEY,v);if(ok)$('#saveStatus').textContent='Autosaved · '+new Date(v.savedAt).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'});return ok;}
function restore(v){
 if(!validSave(v))throw Error('Incompatible save format');
 const s=JSON.parse(JSON.stringify(v.state));
 for(const u of [...s.units,...s.bench.filter(Boolean)])if(!BASE[u.type]||!Number.isFinite(u.x)||!Number.isFinite(u.hp))throw Error('Invalid unit');
 for(const e of s.enemies)if(!KIND[e.kind]||!Number.isFinite(e.hp))throw Error('Invalid enemy');
 if(!s.hand.every(c=>CARDS[c.id])||!s.deck.every(id=>CARDS[id]))throw Error('Invalid cards');
 s.held=new Set(s.held);s.wins=new Set(s.wins);s.seenKinds=new Set(s.seenKinds);s.ter=new Map(s.ter);s.relic=RELICS[s.relicIndex]||null;
 const refs=[...s.units,...s.bench.filter(Boolean),...s.enemies];s.shots=s.shots.map(q=>({...q,tgt:refs[q.targetIndex]||null}));
 s.offer=s.offer.map(o=>{const legacyNames={"Ectoplasma":"Ectoplasm","Carne dura":"Tough Flesh","Fuego antiguo":"Ancient Fire","Cosecha de almas":"Soul Harvest","Luna llena":"Full Moon","Garras firmes":"Steady Claws","Altar reforzado":"Fortified Altar","Necromancia":"Necromancy","Rugido del dragón":"Dragon Roar","Manos de la tierra":"Earth Hands","Lluvia de huesos":"Bone Rain","Festín":"Feast","Aullido":"Howl","Ofrenda":"Offering","Niebla":"Mist","Temblor":"Earthquake","Murciélagos":"Bats","Cripta ampliada":"Expanded Crypt","Cosecha":"Harvest","Lago maldito":"Cursed Lake","Colina":"Hill","Pantano":"Swamp","Bendición":"Blessing","Carta para esta partida":"Card for this run","Carta":"Card"};o={...o,n:legacyNames[o.n]||o.n,kind:legacyNames[o.kind]||o.kind};let b=BLESS.find(b=>b.n===o.n);if(o.kind==='Blessing'&&b)return {...b,kind:o.kind};let id=Object.keys(CARDS).find(id=>CARDS[id].n===o.n);if(!id)throw Error('Invalid reward');return {n:CARDS[id].n,ic:CARDS[id].ic,d:CARDS[id].d(),kind:o.kind,a:()=>S.deck.push(id)};});
 S=s;sessionRunId=v.runId||uid();runName=String(v.name||'Anonymous').slice(0,20);hideOv();$('#ov2').hidden=true;closeFront();renderUI();
 // Keep the original logical battlefield width across displays; pointer mapping uses the same scale.
 if(v.worldWidth){savedWorldWidth=v.worldWidth;resize();}
 if(S.phase==='reward')showRewardRestored();if(['win','over'].includes(S.phase))showEndRestored();
 persist();
}
function showRewardRestored(){showOv(`<h2>Choose your reward</h2><div class="offers">${S.offer.map((o,i)=>`<button class="offer" data-act="reward" data-i="${i}"><span class="ic">${rewardArt(o)}</span><span class="nm">${o.n}</span><span class="ds">${o.d}</span></button>`).join('')}</div>`);}
function showEndRestored(){showOv(`<h2>${S.phase==='win'?'The Altar stands!':'The Altar has fallen'}</h2><p>${S.kills} humans defeated. Choose a card for your next run.</p><div class="cards-row">${S.endOffer.map((id,i)=>cardHTML(id,`data-act="endcard" data-i="${i}"`)).join('')}</div><button class="btn" data-front="scores">View scores</button>`);}
function front(panel){$('#front').hidden=false;menuOpen=true;document.querySelector('.wrap').inert=true;$('#ov').inert=true;$('#ov2').inert=true;for(const el of document.querySelectorAll('.front-view'))el.hidden=el.id!==panel;$('#'+panel+' button:not([disabled]),#'+panel+' input')?.focus();}
function closeFront(){menuOpen=false;$('#front').hidden=true;document.querySelector('.wrap').inert=false;$('#ov').inert=false;$('#ov2').inert=false;last=performance.now();resize();}
function showHome(){if(S){cancelDrag();persist();}loadedSave=store.get(SAVE_KEY,null);if(!validSave(loadedSave))loadedSave=null;$('#playerName').value=profile.name;$('#continueBtn').disabled=!loadedSave;$('#continueInfo').textContent=loadedSave?`${loadedSave.name} · oleada ${Math.min(loadedSave.state.wave,10)} · ${new Date(loadedSave.savedAt).toLocaleString('en')}`:'The invasion awaits.';$('#resumeBtn').hidden=!S;front('homeView');}
function beginNew(){let name=$('#playerName').value.trim().slice(0,20);if(!name){$('#nameError').textContent='Enter your name (1–20 characters).';$('#playerName').focus();return;}profile.name=name;durableWrite(PROFILE_KEY,profile);if(validSave(loadedSave)){front('confirmView');return;}launchNew();}
function launchNew(){runName=profile.name;sessionRunId=uid();loadedSave=null;try{localStorage.removeItem(SAVE_KEY);}catch(e){}savedWorldWidth=null;closeFront();newGame();S.runId=sessionRunId;$('#saveStatus').textContent='Choose a relic to create your first save.';}
function scores(){const v=store.get(SCORES_KEY,[]);return Array.isArray(v)?v:[];}
function recordScore(won){const list=scores();if(list.some(r=>r.runId===sessionRunId))return;const wave=won?10:Math.max(0,S.wave-1);const r={runId:sessionRunId,name:runName,kills:S.kills,wave,won,score:wave*100+S.kills*10+(won?500:0),date:Date.now()};list.push(r);durableWrite(SCORES_KEY,list.sort((a,b)=>b.score-a.score).slice(0,50));}
function scoreRows(rows){return rows.length?rows.slice(0,20).map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(r.name)}</td><td>${Number(r.score)||0}</td><td>${Number(r.wave)||0}/10</td></tr>`).join(''):'<tr><td colspan="4">No scores yet.</td></tr>';}
function showScores(){front('scoresView');$('#scoreRows').innerHTML=scoreRows(scores());$('#scoreScope').textContent='Local scores';$('#publishScore').disabled=!scores().length;$('#cloudStatus').textContent='Local scores work offline. Online ranking requires the server.';}
async function cloudScores(){try{const r=await fetch('/api/scores',{signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error();const j=await r.json();if(!Array.isArray(j.scores))throw Error();$('#scoreRows').innerHTML=scoreRows(j.scores);$('#scoreScope').textContent='Online leaderboard';$('#cloudStatus').textContent='Public scores for this edition.';}catch(e){$('#cloudStatus').textContent='Online ranking is unavailable. Your scores are saved locally.';}}
async function publishScore(){const r=scores()[0];if(!r)return;$('#publishScore').disabled=true;try{const res=await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r),signal:AbortSignal.timeout(6000)});if(!res.ok)throw Error();await cloudScores();$('#cloudStatus').textContent='Your best score was published as '+r.name+'.';}catch(e){$('#cloudStatus').textContent='Publishing failed. Your local score is safe; retry when the server is online.';}finally{$('#publishScore').disabled=false;}}
function exportSave(){persist();const v=snapshot()||loadedSave;if(!validSave(v)){alert('Start a run and choose a relic first.');return;}const url=URL.createObjectURL(new Blob([JSON.stringify(v)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='StopHumans-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function showSettings(){front('settingsView');$('#volume').value=Math.round(prefs.volume*100);$('#musicOpt').checked=AU.music;$('#soundOpt').checked=AU.sfx;$('#motionOpt').checked=prefs.reduced;$('#effectsOpt').value=prefs.effects;}
const oldEndRun=endRun;endRun=function(won){recordScore(won);oldEndRun(won);persist();};
const oldStartRun=startRun;startRun=function(i){oldStartRun(i);persist();};
const oldRenderUI=renderUI;renderUI=function(){oldRenderUI();if(S&&S.phase!=='relic')persist();};
let savedWorldWidth=null;
const oldWorldW=worldW;worldW=function(){return savedWorldWidth||oldWorldW();};
resize=function(){const dpr=Math.min(2,window.devicePixelRatio||1);const w=cv.clientWidth;const logicalW=savedWorldWidth||Math.max(420,w/(350/LOGIC_H));savedWorldWidth=logicalW;cv.style.height=(w/logicalW*LOGIC_H)+'px';scale=w/logicalW;cv.width=Math.round(w*dpr);cv.height=Math.round(cv.clientHeight*dpr);ctx.setTransform(scale*dpr,0,0,scale*dpr,0,0);ctx.imageSmoothingEnabled=false;};
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-front]');if(!b||b.disabled)return;ev.preventDefault();const a=b.dataset.front;
 if(a==='home')showHome();if(a==='new')beginNew();if(a==='confirm')launchNew();if(a==='back')showHome();if(a==='resume')closeFront();
 if(a==='continue'){try{restore(loadedSave);}catch(e){$('#nameError').textContent='Could not restore this run. Start a new one or import a backup.';}}
 if(a==='settings')showSettings();if(a==='scores')showScores();if(a==='cloud')cloudScores();if(a==='publish')publishScore();if(a==='export')exportSave();if(a==='import')$('#importFile').click();
});
document.addEventListener('keydown',ev=>{if(ev.target.matches('input,select,textarea'))ev.stopImmediatePropagation();if(menuOpen){if(ev.key==='Escape'&&S){closeFront();}else if(ev.key==='Enter'&&ev.target.id==='playerName')beginNew();ev.stopImmediatePropagation();}},true);
$('#settingsView').addEventListener('change',()=>{prefs.volume=+$('#volume').value/100;prefs.reduced=$('#motionOpt').checked;prefs.effects=$('#effectsOpt').value;setMusic($('#musicOpt').checked);setSfx($('#soundOpt').checked);savePrefs();});
$('#importFile').addEventListener('change',async ev=>{const f=ev.target.files[0];if(!f)return;try{if(f.size>2e6)throw Error();const v=JSON.parse(await f.text());if(!validSave(v))throw Error();if(S||loadedSave){if(!confirm('The imported save will replace current progress. Continue?'))return;}restore(v);}catch(e){alert('Import failed: use a compatible v15 or v16 save.');}ev.target.value='';});
window.addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
setInterval(()=>{if(!menuOpen&&!document.hidden)persist();},5000);
savePrefs();

artReady.then(buildHybridArt).then(()=>{
 readColors(); resize(); renderPay(); renderSnd();
 document.querySelector('#artLoading').remove();showHome();requestAnimationFrame(loop);
}).catch(error=>{console.error(error);document.querySelector('#artLoading').innerHTML='<b>Could not prepare the game.</b><span>Try opening the game again.</span>';});
