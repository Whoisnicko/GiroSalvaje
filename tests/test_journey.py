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
 load();ev("profile.name='Tester';launchNew('sorcerer',null,10);startRun(RELICS.findIndex(r=>!r.disabled));tutorialStop('skipped');")
 # Prior schema migration, no retroactive route selection.
 ev("(()=>{let v=snapshot();v.version=15;localStorage.setItem(SAVE_KEY,JSON.stringify(v))})()")
 load();ev('restore(loadedSave)');assert ev("S.phase==='prep'&&snapshot().version===18&&S.campaign.route.length===0")
 assert ev('JSON.stringify(Journey.generate(123))===JSON.stringify(Journey.generate(123))&&Journey.generate(123).every(r=>r[0].icon!==r[1].icon)')
 assert ev('JSON.stringify(Journey.generate(123))!==JSON.stringify(Journey.generate(456))')
 ev('S.spinsLeft=0;startFight();endWave()');assert ev("S.phase==='journey'&&S.wave===2&&S.campaign.route.length===0")
 opts=ev('journeyOptions()');seed=ev('S.campaign.seed');before=ev('({gold:S.gold,spins:S.spinsLeft,wall:S.wallHp,units:S.units,hand:S.hand,queue:S.nextQueue})')
 page.screenshot(path='/mnt/data/StopHumans-journey-choice.png')
 load();ev('restore(loadedSave)');assert ev('journeyOptions()')==opts;assert ev('S.campaign.seed')==seed
 assert not ev("journeyChoose('w9-l')")
 assert ev("(()=>{let old=localStorage.setItem;localStorage.setItem=function(k,v){if(k===SAVE_KEY)throw Error('blocked');return old.call(this,k,v)};try{return !journeyChoose(journeyOptions()[0].id)&&S.campaign.route.length===0}finally{localStorage.setItem=old}})()")
 page.locator('[data-journey-choose]').first.click();assert ev('S.campaign.route.length===1&&S.campaign.nodeId===journeyOptions()[0].id');assert not ev('journeyChoose(journeyOptions()[1].id)')
 load();ev('restore(loadedSave)');assert ev("S.phase==='journey'&&!!journeySelected()&&!document.getElementById('journeyContinue').disabled")
 page.screenshot(path='/mnt/data/StopHumans-journey-arrival.png')
 assert ev("(()=>{let old=localStorage.setItem;localStorage.setItem=function(k,v){if(k===SAVE_KEY)throw Error('blocked');return old.call(this,k,v)};try{return !journeyContinue()&&S.phase==='journey'}finally{localStorage.setItem=old}})()")
 page.locator('[data-journey-next]').click();assert ev("S.phase==='prep'&&shopAvailable()")
 after=ev('({gold:S.gold,spins:S.spinsLeft,wall:S.wallHp,units:S.units,hand:S.hand,queue:S.nextQueue})');assert before==after
 # Every remaining battle and route, including boss transitions; simulated victory.
 for w in range(2,11):
  ev('S.spinsLeft=0;startFight();endWave()')
  if w==10:
   assert ev("S.phase==='win'&&S.campaign.route.length===9");break
  if w%2==0:
   assert ev("S.phase==='reward'");page.locator('[data-act=reward]').first.click()
  assert ev("S.phase==='journey'");assert ev('S.wave')==w+1
  if w==3:
   page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/mnt/data/StopHumans-journey-mobile.png');assert ev("document.querySelector('.journey-panel').scrollWidth<=document.querySelector('.journey-panel').clientWidth+1");page.set_viewport_size({'width':1366,'height':768})
  ev('prefs.reduced=true');page.locator('[data-journey-choose]').last.click();page.locator('[data-journey-next]').click();assert ev("S.phase==='prep'")
 print('nine route choices, old schema, storage failures, arrival restore, no economy changes, mobile layout, victory; errors:',errs);assert not errs;b.close()
srv.shutdown()
