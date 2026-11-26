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
   rel=str(asset.relative_to(p));html=re.sub(re.escape(rel)+r'(?:\?v=[\w.-]+)?', 'data:'+str(mimetypes.guess_type(asset)[0])+';base64,'+base64.b64encode(asset.read_bytes()).decode(),html)
 def load():
  storage=page.evaluate('window.__testDisk||{}');page.close()
  new=b.new_page(viewport={'width':1366,'height':768});new.on('pageerror',lambda e:errs.append(str(e)))
  globals()['page']=new
  shim='<script>window.__testDisk='+json.dumps(storage)+';Object.defineProperty(window,"localStorage",{value:{getItem(k){return Object.hasOwn(__testDisk,k)?__testDisk[k]:null},setItem(k,v){__testDisk[k]=String(v)},removeItem(k){delete __testDisk[k]}}});</script>'
  page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded');page.wait_for_function('!document.getElementById("artLoading")',timeout=18000)
 def ev(s):return page.evaluate(s)
 load();ev("profile.name='Tester';launchNew('sorcerer');startRun(0);tutorialStop('skipped');prefs.reduced=true;$('#coach').hidden=true")
 assert ev("$('.wrap').dataset.phase==='prep'&&$('#phaseBrief').textContent.includes('PREPARATION')&&$('.wave-chip b').textContent.trim()==='1 / 5'")
 ev("S.hand=[{id:'manos',fresh:true},{id:'rugido',fresh:true},{id:'cripta',fresh:true}];S.gold=30;renderUI()")
 assert ev("$('.hand .card .cn').textContent==='Earth Hands'&&$('.hand .card .ty').textContent.includes('AIM')&&document.querySelectorAll('.hand [data-cardi]')[2].querySelector('.ty').textContent.includes('PREP')")
 for w,h in [(1366,768),(1920,1080),(3840,2160),(3440,1440),(1280,720),(390,844)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(170)
  assert ev('document.documentElement.scrollWidth<=innerWidth+1')
  if w>=1100:
   assert ev('document.documentElement.scrollHeight<=innerHeight+1')
   assert ev("(()=>{let a=$('.hud-top').getBoundingClientRect(),b=$('#chips').getBoundingClientRect(),c=$('.command-dock>.table').getBoundingClientRect();return b.right<=a.right&&c.bottom<=innerHeight&&c.height>90})()")
   assert ev("(()=>{let a=[...document.querySelectorAll('.hand [data-cardi]')].map(c=>c.getBoundingClientRect());return a.every((r,i)=>!i||r.left>=a[i-1].right-1)})()")
  if w in [1366,3840]:page.screenshot(path=f'/mnt/data/StopHumans-command-prep-{w}.png')
 page.set_viewport_size({'width':1366,'height':768});page.wait_for_timeout(200)
 page.locator('[data-cardi="2"]').click();assert ev('S.maxUnits===9');ev('S.spinsLeft=0;renderUI()');page.locator('[data-act=fight]').click();assert ev("S.phase==='fight'&&$('.wrap').dataset.phase==='fight'&&$('#phaseBrief').textContent.includes('INVASION')&&$('#summonLever').disabled")
 ev("S.wallHp=18;renderChips();$('#coach').hidden=true");assert ev("$('.altar-chip').classList.contains('bad')&&$('.hud-hp-track').getAttribute('aria-valuenow')==='18'")
 assert ev("!document.querySelectorAll('[data-cardi]')[0].disabled")
 page.screenshot(path='/mnt/data/StopHumans-command-combat.png')
 ev('endWave()');assert ev("S.phase==='journey'");page.locator('[data-journey-choose]').first.click();page.locator('[data-journey-next]').click();assert ev("S.phase==='prep'&&!$('#routeBrief').hidden&&$('#routeBrief b').textContent===journeySelected().name")
 ev("S.gold=50;renderUI()");page.locator('[data-act=buy]').click();assert ev('prepUndoAvailable()');page.locator('#undoBtn').click();assert ev('S.gold===50')
 load();ev('restore(loadedSave)');assert ev("S.phase==='prep'&&!$('#routeBrief').hidden&&$('.wrap').dataset.phase==='prep'")
 ev("launchNew('warlord',null,5);startRun(0);tutorialStop('skipped');$('#coach').hidden=true")
 for w,h in [(1366,768),(3840,2160)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(200);assert ev("!$('#heroHud').hidden&&document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1")
 page.screenshot(path='/mnt/data/StopHumans-command-warlord.png')
 print('Command Center: phase, metrics, cards, routes, reload, undo and both hero layouts; errors:',errs);assert not errs;b.close()
 srv.shutdown()
