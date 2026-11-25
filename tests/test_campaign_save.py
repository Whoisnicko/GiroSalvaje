import threading,http.server,functools,json,re,base64,mimetypes
from pathlib import Path
from playwright.sync_api import sync_playwright
p=str(Path(__file__).resolve().parents[1])
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=p));threading.Thread(target=srv.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{srv.server_port}/'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1366,'height':768});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 html=Path(p,'index.html').read_text(); html=re.sub(r'<link rel="stylesheet" href="([^"?]+)(?:\?[^" ]*)?">',lambda m:'<style>'+Path(p,m[1]).read_text()+'</style>',html);html=re.sub(r'<script src="([^"?]+)(?:\?[^" ]*)?"></script>',lambda m:'<script>'+Path(p,m[1]).read_text().replace('</script','<\\/script')+'</script>',html)
 for asset in Path(p,'assets').rglob('*'):
  if asset.is_file():
   rel=str(asset.relative_to(p));html=html.replace(rel,'data:'+str(mimetypes.guess_type(asset)[0])+';base64,'+base64.b64encode(asset.read_bytes()).decode())
 def load():
  storage=page.evaluate('window.__testDisk||{}');page.close()
  new=b.new_page(viewport={'width':1366,'height':768});new.on('pageerror',lambda e:errs.append(str(e)))
  globals()['page']=new
  shim='<script>window.__testDisk='+json.dumps(storage)+';Object.defineProperty(window,"localStorage",{value:{getItem(k){return Object.hasOwn(__testDisk,k)?__testDisk[k]:null},setItem(k,v){__testDisk[k]=String(v)},removeItem(k){delete __testDisk[k]}}});</script>'
  page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded');page.wait_for_function('!document.getElementById("artLoading")',timeout=18000)
 def ev(s):return page.evaluate(s)
 load();print('storage',ev("localStorage.getItem(CAMPAIGN_PROFILE_KEY)"));assert ev('!!localStorage.getItem(CAMPAIGN_PROFILE_KEY)')
 ev("profile.name='Tester';launchNew('sorcerer');startRun(RELICS.findIndex(r=>!r.disabled));tutorialStop('skipped');")
 state=ev("JSON.parse(localStorage.getItem(SAVE_KEY))");assert state['version']==17;assert state['state']['campaign']['id']==state['runId'];assert state['state']['campaign']['nodeId'] is None;print('new campaign',state['runId'])
 # Test old save with explicit profile data including duplicated legacy cards.
 ev("""(()=>{let v=snapshot();v.version=14;delete v.state.campaign;v.state.gold=25;localStorage.setItem(SAVE_KEY,JSON.stringify(v));localStorage.setItem('giroSalvaje.deck',JSON.stringify([...START_DECK,'rugido']));localStorage.removeItem(CAMPAIGN_PROFILE_KEY);})()""")
 load();assert ev('validSave(loadedSave)');assert ev('META.deck.length===6');ev('restore(loadedSave)');assert ev('S.gold===25&&S.campaign.id===sessionRunId&&JSON.parse(localStorage.getItem(SAVE_KEY)).version===17&&JSON.parse(localStorage.getItem(CAMPAIGN_LEGACY_BACKUP)).version===14');print('legacy migrated')
 # Purchase and reload with same run data, then restore fight without modifying logical width.
 ev('buySpin();buySlot();');s=ev('snapshot()');load();ev('restore(loadedSave)');assert ev('S.gold')==s['state']['gold'];assert ev('S.maxUnits')==s['state']['maxUnits'];assert ev('S.spinsLeft')==s['state']['spinsLeft'];assert ev('sessionRunId')==s['runId'];print('preparation reload')
 # Simulated wave completion through real reward path. Pause by opening menu immediately.
 ev("S.wave=2;S.spinsLeft=0;startFight();endWave();");assert ev("S.phase==='reward'");offers=ev('snapshot().state.offer');load();ev('restore(loadedSave)');assert ev('snapshot().state.offer')==offers;ev("document.querySelector('[data-act=reward]').click();");assert ev("S.phase==='journey'&&S.campaign.claimedWaveRewards.includes(2)");load();ev('restore(loadedSave)');assert ev("S.phase==='journey'&&S.campaign.claimedWaveRewards.includes(2)");ev('journeyChoose(journeyOptions()[0].id)');page.wait_for_timeout(750);ev('journeyContinue()');assert ev("S.phase==='prep'&&S.campaign.claimedWaveRewards.includes(2)");print('wave reward reload')
 # Terminal claim, persisted together with deck. A repeated claim must not add a card.
 ev("S.phase='over';endRun(false);");before=ev('META.deck.length');end=ev('snapshot()');ev("document.querySelector('[data-act=endcard]').click()");assert ev('META.deck.length')==before+1;assert ev('campaignEndClaimed()');assert not ev('campaignClaimEndCard(0)');assert not ev("!!document.querySelector('[data-act=endcard]')");load();ev('restore(loadedSave)');assert ev('META.deck.length')==before+1;assert ev('campaignEndClaimed()');page.evaluate('(v)=>restore(v)',end);assert ev('campaignEndClaimed()');assert not ev('campaignClaimEndCard(1)');print('permanent reward dedup and old backup')
 # Profile export/import data merge does not double count claims.
 backup=ev('campaignProfileBackup()');page.evaluate('(p)=>campaignImportProfile(p)',backup);assert ev('META.deck.length')==before+1;print('profile idempotent import')
 # New game retains profile, warlord and fight reload.
 ev("launchNew('warlord');startRun(RELICS.findIndex(r=>!r.disabled));tutorialStop('skipped');S.spinsLeft=0;startFight();showHome();");load();assert ev('loadedSave.state.hero.classId')=='warlord';ev('restore(loadedSave);showHome()');assert ev("S.phase==='fight'&&heroClass(S).id==='warlord'&&META.deck.length===7");print('warlord combat resume')
 # Failed receipt write must not change deck; no actual quota exhaustion needed.
 ev("closeFront();S.phase='over';endRun(false);");n=ev('META.deck.length');assert ev("(()=>{const old=localStorage.setItem;localStorage.setItem=function(k,v){if(k===CAMPAIGN_PROFILE_KEY)throw Error('blocked');return old.call(this,k,v)};try{return !campaignClaimEndCard(0)}finally{localStorage.setItem=old}})()");assert ev('META.deck.length')==n;assert not ev('campaignEndClaimed()');assert ev('campaignClaimEndCard(0)');assert ev('META.deck.length')==n+1;print('blocked profile write and retry')
 # Sandbox must not alter permanent state or replace the parked campaign.
 ev("showHome();");campaign=ev('JSON.parse(localStorage.getItem(SAVE_KEY))');prof=ev('JSON.parse(localStorage.getItem(CAMPAIGN_PROFILE_KEY))');ev("sandboxEnter('sorcerer');startRun(RELICS.findIndex(r=>!r.disabled));");assert ev('S.sandbox');assert not ev('persist()');assert not ev('campaignClaimEndCard(0)');assert ev('JSON.parse(localStorage.getItem(SAVE_KEY)).state')==campaign['state'];assert ev('JSON.parse(localStorage.getItem(CAMPAIGN_PROFILE_KEY))')==prof;ev('sandboxExit()');assert ev('sessionRunId')==campaign['runId'];print('sandbox isolation')
 # Profile import retains existing mastery and talent progress and remains idempotent.
 ev("knowledgeGrant(['frost']);talentRecord(3);");prof=ev('campaignProfileBackup()');page.evaluate('(p)=>campaignImportProfile(p)',prof);assert ev("knowledgeLearned('frost')&&talentInit().best>=3");assert ev('campaignProfileBackup().deck')==prof['deck'];print('spell knowledge and talent preservation')
 # Corrupt/unknown versions are rejected, and legacy terminal snapshots archive safely.
 assert ev("!validSave({version:999,state:{}})");ev("(()=>{let v=snapshot();v.version=14;delete v.state.campaign;restore(v)})()");assert ev('S.campaign.legacyTerminal&&campaignEndClaimed()');print('legacy terminal archived')
 print('errors',errs);assert not errs;b.close()
srv.shutdown()
