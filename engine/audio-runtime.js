/* Audio 68: mixing, lifecycle, original scene scores and ambience.
   Existing game audio functions keep their names and call sites. */
function audio68Level(v,d){return typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(1,v)):d;}
function audio68Prefs(p){for(const k of ['musicVolume','sfxVolume','ambienceVolume'])p[k]=audio68Level(p[k],AUDIO68.defaults[k]);p.ambience=typeof p.ambience==='boolean'?p.ambience:true;p.volume=audio68Level(p.volume,.65);return p;}
function audio68Random(){AU.seed=(Math.imul(AU.seed,1664525)+1013904223)>>>0;return AU.seed/4294967296;}
function audio68Gain(n,v){if(!n||!AU.ctx)return;const t=AU.ctx.currentTime;n.gain.cancelScheduledValues(t);n.gain.setTargetAtTime(v,t,.035);}
function audio68Mix(){if(!AU.ctx)return;audio68Gain(AU.master,prefs.volume);audio68Gain(AU.mGain,AU.music ? .16*prefs.musicVolume:0);audio68Gain(AU.sGain,AU.sfx ? .5*prefs.sfxVolume:0);audio68Gain(AU.aGain,prefs.ambience ? .24*prefs.ambienceVolume:0);}
function audio68Room(group){return !!AU.ctx&&AU.ctx.state==='running'&&!document.hidden&&prefs.volume>0&&AU.voices.size<AUDIO68.maxVoices&&AU.count[group]<(group==='music'?AUDIO68.maxMusic:AUDIO68.maxSfx);}
function audio68Track(source,nodes,group,fadeGain){const v={source,nodes,group,fadeGain};AU.voices.add(v);AU.count[group]++;source.onended=()=>{if(AU.voices.delete(v))AU.count[group]--;for(const n of [source,...nodes])try{n.disconnect();}catch(_){};};}
function audio68Stop(group){if(!AU.ctx)return;for(const v of AU.voices)if(!group||v.group===group)try{v.source.stop(AU.ctx.currentTime+.035);}catch(_){};}
function audio68NoiseBuffer(){if(AU.noiseBuffer)return AU.noiseBuffer;const c=AU.ctx,buf=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=audio68Random()*2-1;return AU.noiseBuffer=buf;}
function audio68Scene(){return menuOpen?(frontCurrent==='campaignMapView'?'campaign':'menu'):S?.phase==='fight'?'battle':['win','over'].includes(S?.phase)?'end':'prep';}
function audio68Region(){return menuOpen?'menu':S?biomeId(S):'valley';}
function audio68MenuStep(want,when){const tr=AUDIO68[want],step=AU.step,beat=60/tr.bpm/2,i=step%8,ch=tr.chords[Math.floor(step/8)%tr.chords.length];if(i===0){synth(mtof(ch[0]),beat*8,'triangle',.12,when,380,.24);synth(mtof(ch[1]),beat*8,'sine',.055,when,700,.3);synth(mtof(ch[3]),beat*8,'triangle',.035,when,900,.25);}if(i%2===0)pluck(mtof(ch[1+[0,1,2,1][i/2]]+12),beat*1.8,.045,when);const n=tr.motif[step%tr.motif.length];if(n!==null){synth(mtof(n),beat*.95,'sine',.065,when,1300,.02);tone(mtof(n)*2,beat*.7,'sine',.015,when,AU.mGain);}AU.next+=beat;AU.step++;}
function audio68AmbientBuffer(region){const c=AU.ctx;if(AU.ambBuffers[region])return AU.ambBuffers[region];const [lo,hi,cut,noise,drone,pulse]=AUDIO68.ambience[region]||AUDIO68.ambience.valley,len=c.sampleRate*6,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);let smooth=0;const alpha=1-Math.exp(-2*Math.PI*cut/c.sampleRate),lf=Math.round(lo*6),hf=Math.round(hi*6);for(let i=0;i<len;i++){const x=i/len;smooth+=alpha*(audio68Random()*2-1-smooth);const swell=.72+.28*Math.cos(2*Math.PI*x);d[i]=smooth*noise*(swell+pulse*Math.sin(6*Math.PI*x))+(Math.sin(2*Math.PI*lf*x)+.45*Math.sin(2*Math.PI*hf*x))*drone*swell;}const fade=Math.floor(c.sampleRate*.12);for(let i=0;i<fade;i++){d[i]*=i/fade;d[len-1-i]*=i/fade;}return AU.ambBuffers[region]=b;}
function audio68AmbientOff(){if(!AU.ambient)return;const old=AU.ambient;AU.ambient=null;try{old.source.stop(AU.ctx.currentTime+.08);}catch(_){};}
function audio68Ambience(region){if(!AU.ctx||AU.ctx.state!=='running')return;if(!prefs.ambience||prefs.ambienceVolume===0||prefs.volume===0||document.hidden){audio68AmbientOff();return;}if(AU.ambient?.region===region)return;const c=AU.ctx,t=c.currentTime,s=c.createBufferSource(),g=c.createGain();s.buffer=audio68AmbientBuffer(region);s.loop=true;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+.55);s.connect(g);g.connect(AU.aGain);s.onended=()=>{try{s.disconnect();g.disconnect();}catch(_){}};if(AU.ambient){const old=AU.ambient;old.g.gain.cancelScheduledValues(t);old.g.gain.setTargetAtTime(0,t,.12);try{old.source.stop(t+.65);}catch(_){}}AU.ambient={region,source:s,g};s.start(t);}
function audio68Visibility(){if(!AU.ctx)return;if(document.hidden){audio70Stop(true,true);audio70CancelLoad();audio68Stop();audio68AmbientOff();AU.next=AU.ctx.currentTime+.1;try{Promise.resolve(AU.ctx.suspend()).catch(()=>{});}catch(_){}}else{AU.next=AU.ctx.currentTime+.1;audioInit();}}
function audio68SyncControls(){for(const [id,k] of Object.entries({musicLevel:'musicVolume',sfxLevel:'sfxVolume',ambienceLevel:'ambienceVolume'}))$('#'+id).value=Math.round(prefs[k]*100);$('#ambienceOpt').checked=prefs.ambience;}
function audio68SettingsInput(e){const k={volume:'volume',musicLevel:'musicVolume',sfxLevel:'sfxVolume',ambienceLevel:'ambienceVolume'}[e.target.id];if(k){prefs[k]=audio68Level(Number(e.target.value)/100,prefs[k]);audio68Mix();}}
function audio68SettingsCommit(){for(const [id,k] of Object.entries({musicLevel:'musicVolume',sfxLevel:'sfxVolume',ambienceLevel:'ambienceVolume'}))prefs[k]=audio68Level(+$('#'+id).value/100,AUDIO68.defaults[k]);prefs.ambience=$('#ambienceOpt').checked;audio68Mix();}
function audio68Install(){const unlock=e=>{if(e.isTrusted!==false&&!document.hidden)audioInit();};document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);document.addEventListener('visibilitychange',audio68Visibility);document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b&&!b.disabled&&menuOpen)sfx('ui');},true);$('#settingsView').addEventListener('input',audio68SettingsInput);window.addEventListener('pagehide',()=>{if(AU.ctx){audio70Stop(true,true);audio70CancelLoad();audio68Stop();audio68AmbientOff();try{Promise.resolve(AU.ctx.suspend()).catch(()=>{});}catch(_){}}});window.addEventListener('pageshow',()=>{if(AU.ctx&&!document.hidden){AU.next=AU.ctx.currentTime+.1;audioInit();}});}

/* Regional score scheduler and non-repeating shuffle bags. */
function audio69Region(){const id=audio68Region();return Object.hasOwn(AUDIO69.regional,id)?id:'valley';}
function audio69ScoreKey(scene){return scene==='prep'||scene==='battle'?scene+':'+audio69Region():scene;}
function audio69Pick(name){
 const bags=AU.variants||(AU.variants=Object.create(null));let b=bags[name];if(!b)b=bags[name]={bag:[],last:-1};
 if(!b.bag.length){b.bag=[0,1,2,3];for(let i=3;i>0;i--){const j=Math.floor(audio68Random()*(i+1));[b.bag[i],b.bag[j]]=[b.bag[j],b.bag[i]];}if(b.bag[3]===b.last)[b.bag[0],b.bag[3]]=[b.bag[3],b.bag[0]];}
 return b.last=b.bag.pop();
}
function audio69Recipe(recipe,toneFn,noiseFn){for(const e of recipe||[]){if(e[0]==='t')toneFn(e[1],e[2],e[3],e[4],e[5]||0,null,e[6]);else noiseFn(e[1],e[2],e[3],e[4]||0,null,e[5]);}}
function audio69FadeMusic(){if(!AU.ctx)return;const t=AU.ctx.currentTime;for(const v of AU.voices){if(v.group!=='music')continue;try{if(v.fadeGain){v.fadeGain.gain.cancelScheduledValues(t);v.fadeGain.gain.setTargetAtTime(.0001,t,.025);}v.source.stop(t+.12);}catch(_){}}}
function audio69Midi(tr,degree){const n=tr.scale.length;return tr.root+24+Math.floor(degree/n)*12+tr.scale[((degree%n)+n)%n];}
function audio69RegionalStep(scene,when){
 const tr=AUDIO69.regional[audio69Region()],fight=scene==='battle',step=AU.step,sub=fight?16:8,beat=60/tr.tempo[fight?1:0]/(fight?4:2);
 const bar=Math.floor(step/sub)%16,i=step%sub,section=Math.floor(bar/8),ch=tr.chords[bar%8],root=tr.root+ch[0],style=tr.style;
 const phrase=tr.melody[(bar+(section?1:0))%4],p=fight?Math.floor(i/2):i,degree=phrase[p];
 if(i===0){synth(mtof(root),beat*sub*.98,'triangle',fight?.095:.105,when,style==='metal'?550:400,.08);synth(mtof(tr.root+ch[2]),beat*sub*.95,'sine',.045,when,700,.13);synth(mtof(tr.root+12+ch[1]+(section?12:0)),beat*sub*.95,style==='organ'?'triangle':'sine',.035,when,1100,.18);}
 if(fight){
  if(tr.pulse.includes(i)){tone(mtof(root+12),beat*1.5,'triangle',.075,when,AU.mGain);tone(style==='metal'?105:82,beat*1.8,'sine',.17,when,AU.mGain,42);}
  if(tr.accent.includes(i))noise(beat*.9,style==='metal'?.11:.07,style==='wood'?1100:2400,when,AU.mGain,'bandpass');
  if(i%4===2&&style!=='bell')noise(.035,.026,style==='wood'?3200:6400,when,AU.mGain,'highpass');
 }else if(i%2===0){
  const f=mtof(tr.root+12+ch[(i/2+section)%3]);
  if(style==='lute')pluck(f,beat*1.65,.062,when);
  else if(style==='wood'){tone(f,beat*.65,'triangle',.045,when,AU.mGain);noise(.045,.025,1200,when,AU.mGain,'bandpass');}
  else if(style==='bell'){tone(f*2,beat*1.8,'sine',.05,when,AU.mGain);tone(f*4,beat*.55,'sine',.014,when,AU.mGain);}
  else if(style==='metal')tone(f,beat*.8,'triangle',.055,when,AU.mGain,f*.98);
  else synth(f,beat*1.7,'triangle',.045,when,1300,.05);
 }
 if(degree!==null&&(!fight||i%2===0)){const f=mtof(audio69Midi(tr,degree+(section&&bar%4===2?7:0))),dur=beat*(fight?1.7:.88);synth(f,dur,tr.lead[fight?1:0],fight?.076:.065,when,tr.cut[fight?1:0],Math.min(.04,dur*.25),false);if(style==='bell'||style==='organ')tone(f*2,dur*.65,'sine',.018,when,AU.mGain);}
 if(bar===15&&i===sub-2)tone(mtof(root+12),beat*1.7,'sine',.045,when,AU.mGain);
 AU.next+=beat;AU.step++;if(AU.step%(16*sub)===0)AU.loop++;
}

/* Audio 70 — recorded soundtrack pilot. Local assets, no external streaming.
   One active buffer, one cached long track, short battle loop retained. */
function audio70Target(scene){
 if(scene==='battle'&&S?.enemies?.some(e=>e.boss&&e.hp>0))return 'boss';
 if(audio68Region()==='valley'&&(scene==='prep'||scene==='battle'))return scene;
 return null;
}
function audio70State(){return AU.recorded||(AU.recorded={active:null,cache:Object.create(null),failed:new Set(),pending:null,wanted:null,resume:null});}
function audio70Urls(key){const a=AUDIO70[key],base='assets/audio/v70/';return a.parts?Array.from({length:a.parts},(_,i)=>base+a.file+'.part'+String(i).padStart(2,'0')):[base+a.file];}
function audio70Join(parts,expected){const len=parts.reduce((n,p)=>n+p.byteLength,0);if(len!==expected)throw Error('Audio asset length mismatch');const out=new Uint8Array(len);let p=0;for(const b of parts){out.set(new Uint8Array(b),p);p+=b.byteLength;}return out.buffer;}
function audio70Stop(immediate=false,remember=false){
 const st=audio70State(),a=st.active;if(!a)return;st.active=null;
 const t=AU.ctx.currentTime;
 if(remember)st.resume={key:a.key,offset:(a.offset+Math.max(0,t-a.started))%a.buffer.duration};
 else st.resume=null;
 try{a.g.gain.cancelScheduledValues(t);a.g.gain.setTargetAtTime(.0001,t,.06);a.source.stop(t+(immediate?0:.28));}catch(_){}
}
function audio70CancelLoad(){const st=audio70State();if(st.pending){const p=st.pending;st.pending=null;p.controller.abort();}}
async function audio70Load(key){
 const st=audio70State(),ctx=AU.ctx;if(st.pending||st.cache[key]||st.failed.has(key)||typeof fetch!=='function'||typeof AbortController==='undefined'||!ctx?.decodeAudioData)return;
 const job={key,controller:new AbortController()};st.pending=job;
 try{
  const urls=audio70Urls(key),parts=[];
  for(let i=0;i<urls.length;i+=3){const group=await Promise.all(urls.slice(i,i+3).map(async url=>{const r=await fetch(url,{signal:job.controller.signal});if(!r.ok)throw Error('Audio HTTP '+r.status);return r.arrayBuffer();}));parts.push(...group);if(st.pending!==job)return;}
  const raw=audio70Join(parts,AUDIO70[key].bytes),buf=await ctx.decodeAudioData(raw);
  if(st.pending!==job||ctx!==AU.ctx)return;
  if(!buf||!Number.isFinite(buf.duration)||buf.duration<=0)throw Error('Invalid audio buffer');
  if(key!=='battle')for(const k of Object.keys(st.cache))if(k!=='battle'&&k!==key)delete st.cache[k];
  st.cache[key]=buf;
 }catch(e){if(st.pending===job&&!job.controller.signal.aborted){st.failed.add(key);console.warn('Recorded soundtrack fallback:',key,e);}}
 finally{if(st.pending===job)st.pending=null;}
}
function audio70Start(key){
 const st=audio70State(),buf=st.cache[key],ctx=AU.ctx;if(!buf)return false;
 const t=ctx.currentTime,offset=st.resume?.key===key?st.resume.offset:0;
 let source,g;
 try{source=ctx.createBufferSource();g=ctx.createGain();source.buffer=buf;source.loop=true;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(AUDIO70[key].gain,t+.35);source.connect(g);g.connect(AU.mGain);source.onended=()=>{try{source.disconnect();g.disconnect();}catch(_){};if(st.active?.source===source)st.active=null;};source.start(t,offset%buf.duration);}
 catch(e){try{source?.disconnect();g?.disconnect();}catch(_){};st.failed.add(key);delete st.cache[key];return false;}
 audio70Stop();audio69FadeMusic();st.resume=null;st.active={key,source,g,buffer:buf,offset,started:t};return true;
}
function audio70Tick(scene,enabled){
 const st=audio70State(),key=enabled?audio70Target(scene):null;
 if(!enabled){audio70Stop(true,true);audio70CancelLoad();return false;}
 if(st.wanted!==key){if(st.active?.key!==key)audio70Stop();if(st.pending?.key!==key)audio70CancelLoad();if(st.resume?.key!==key)st.resume=null;st.wanted=key;}
 if(!key)return false;
 if(st.active?.key===key)return true;
 if(st.cache[key])return audio70Start(key);
 if(!st.failed.has(key))void audio70Load(key);
 return false; // procedural music while loading or on failure
}
