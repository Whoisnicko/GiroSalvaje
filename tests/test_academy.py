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
 load();ev("profile.name='Tester';launchNew('sorcerer');startRun(0);tutorialStop('skipped');prefs.reduced=true;S.gold=50;renderUI();buySlot();showHome()")
 saved=ev('JSON.stringify({...loadedSave,savedAt:0})');profile=ev('JSON.stringify(campaignProfileBackup())');assert ev('prepUndoStack.length')==1
 def launch(id):
  if ev("$('#academyView').hidden"):page.locator('#sandboxEnter').click()
  page.locator(f'[data-academy-lesson={id}]').click();page.wait_for_timeout(180);assert ev('academyActive()&&S.phase==="prep"')
 def check():
  page.wait_for_function('academySession.done');page.locator('#academyLeave').click();assert ev('!sandboxActive()&&!$("#academyView").hidden');assert ev('JSON.stringify({...loadedSave,savedAt:0})')==saved;assert ev('JSON.stringify(campaignProfileBackup())')==profile;assert ev('prepUndoStack.length')==1
 def drag(a,b):
  def point(s):return ev(f'(()=>{{let p={s},r=cv.getBoundingClientRect();return {{x:r.left+p.x*scale,y:r.top+p.y*scale}}}})()')
  x,y=point(a),point(b);page.mouse.move(x['x'],x['y']);page.mouse.down();page.mouse.move(y['x'],y['y'],steps=10);page.mouse.up();page.wait_for_timeout(130)
  if ev("!$('#ov2').hidden"):page.locator('#ov2 [data-act=mergeyes]').click() if page.locator('#ov2 [data-act=mergeyes]').count() else ev('confirmMerge(true)')
 page.locator('#sandboxEnter').click();page.screenshot(path='/mnt/data/StopHumans-academy-menu.png')
 launch('hold');page.locator('[data-cell="0"]').click();page.locator('[data-cell="1"]').click();page.wait_for_timeout(100);page.locator('#summonLever').click();check()
 launch('merge');ev('askMerge=false');drag('S.units[0]','S.units[1]');drag('S.units.find(u=>u.pile===1)','S.units.find(u=>u.pile===2)');check()
 launch('reserve');drag('S.units[0]','benchSlot(0)');drag('S.bench[0]','({x:130,y:130})');check()
 launch('undo');page.locator('[data-act=slot]').click();page.wait_for_timeout(100);page.locator('#undoBtn').click();check()
 launch('sorcerer');page.locator('[data-act=fight]').click();page.locator('#magicCast').click();r=page.locator('#cv').bounding_box();sc=ev('scale');x=r['x']+100*sc;y=r['y']+35*sc;d=70*sc;page.mouse.move(x,y+d);page.mouse.down();page.mouse.move(x+d/2,y,steps=15);page.mouse.move(x+d,y+d,steps=15);page.mouse.move(x,y+d,steps=15);page.mouse.up();page.wait_for_function('magicMode==="aim"&&magicRune==="fire"');page.mouse.click(x+d,y+d);check()
 launch('warlord');page.locator('[data-act=fight]').click();page.locator('#heroDeploy').click();r=page.locator('#cv').bounding_box();sc=ev('scale');page.mouse.click(r['x']+150*sc,r['y']+120*sc);page.wait_for_function('heroActive()');page.keyboard.down('d');page.wait_for_timeout(650);page.keyboard.up('d');page.wait_for_function('academySession.step===2');page.keyboard.press('e');check()
 page.locator('#academyFree').click();page.locator('[data-hero-class=sorcerer]').click();page.locator('[data-act=relic]').first.click();assert ev('sandboxActive()&&!academyActive()');ev('sandboxExit()');assert ev('JSON.stringify({...loadedSave,savedAt:0})')==saved
 assert not errs,errs;print('Academy: 6 exercises, free sandbox, campaign/profile/Undo isolation; errors:',errs);b.close();srv.shutdown()
