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
 load();page.set_viewport_size({'width':3840,'height':2160});page.wait_for_timeout(200);ev("profile.name='Tester';launchNew('sorcerer');startRun(RELICS.findIndex(r=>!r.disabled));tutorialStop('skipped');")
 baseline=ev('({width:worldW(),units:S.units.map(u=>[u.x,u.y]),gold:S.gold,spins:S.spinsLeft})')
 assert baseline['width']>=650,baseline
 for w,h in [(1920,1080),(2560,1440),(3840,2160),(3440,1440),(1366,768),(1280,720),(390,844)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(150)
  print(w,h,ev("""(()=>({world:worldW(),scale,scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],shared:sharedReserve(),boxes:Object.fromEntries(['.wrap','.hud-top','.cabinet','.lane','#battleViewport','#cv','.command-dock>.table','.hand','.hand .card','.command-intel','header','#hadesRoom'].map(s=>{let e=document.querySelector(s),r=e.getBoundingClientRect();return [s,[...['x','y','width','height'].map(k=>Math.round(r[k])),getComputedStyle(e).fontSize,e.scrollWidth,e.scrollHeight]]}))}))()"""),flush=True)
  assert ev('Math.abs(worldW()-'+str(baseline['width'])+')<.01')
  assert ev('JSON.stringify(S.units.map(u=>[u.x,u.y]))')==json.dumps(baseline['units'],separators=(',',':'))
  assert ev('S.gold')==baseline['gold'] and ev('S.spinsLeft')==baseline['spins']
  assert ev('document.documentElement.scrollWidth<=innerWidth+1')
  assert ev('(()=>{let r=cv.getBoundingClientRect(),p=toWorld({clientX:r.left+100*scale,clientY:r.top+80*scale});return Math.abs(p.x-100)<.01&&Math.abs(p.y-80)<.01})()')
  if w>=1100 and h>=650:
   assert ev('document.documentElement.scrollHeight<=innerHeight+1')
   assert ev('(()=>{let r=document.querySelector(".command-dock>.table").getBoundingClientRect();return r.width>100&&r.height>90&&r.bottom<=innerHeight})()')
  if w in [3840,1366,3440]:page.screenshot(path=f'/mnt/data/responsive-after-{w}.png')
 page.set_viewport_size({'width':3840,'height':2160});page.wait_for_timeout(200);ev('S.gold=50;renderUI();buySpin()');assert ev('prepUndoAvailable()');page.set_viewport_size({'width':2560,'height':1440});page.wait_for_timeout(200);assert ev('prepUndoAvailable()&&prepUndo()');assert ev('S.gold===50');
 ev('showShop()');page.wait_for_timeout(150);assert ev('!document.querySelector("#ov2").hidden');page.screenshot(path='/mnt/data/responsive-shop.png');ev("document.querySelector('#ov2').hidden=true");
 ev('S.spinsLeft=0;startFight();endWave()');assert ev("S.phase==='journey'");page.set_viewport_size({'width':3840,'height':2160});page.wait_for_timeout(200);page.screenshot(path='/mnt/data/responsive-map.png');assert ev('(()=>{let r=document.querySelector(".journey-panel").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()');page.locator('[data-journey-choose]').first.click();page.wait_for_timeout(800);page.locator('[data-journey-next]').click();assert ev("S.phase==='prep'");
 # Real clicks and drag coordinates on a 4K display, and scaled dialogs.
 ev('openBestiary(S.units[0])');page.wait_for_timeout(120);assert ev('bestiaryDialog().open');assert ev('(()=>{let r=bestiaryDialog().getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1})()');page.locator('.bestiary-close').click();
 page.locator('#runePracticeBtn').click();assert ev('runeDialog.open');assert ev('(()=>{let r=runeDialog.getBoundingClientRect();return r.right<=innerWidth+1&&r.bottom<=innerHeight+1})()');page.locator('#runeClose').click();
 ev('S.bench[0]=makeUnit("M",1);syncReservePositions();renderUI()');p0=ev('(()=>{let r=cv.getBoundingClientRect(),u=S.bench[0];return [r.left+u.x*scale,r.top+u.y*scale]})()');p1=ev('(()=>{let r=cv.getBoundingClientRect();return [r.left+120*scale,r.top+180*scale]})()');page.mouse.move(*p0);page.mouse.down();page.mouse.move(*p1,steps=10);page.mouse.up();assert ev('!S.bench[0]&&S.units.some(u=>u.type==="M")');
 # Legacy narrower field and second hero preserve position and logical width.
 ev('launchNew("warlord");startRun(RELICS.findIndex(r=>!r.disabled));tutorialStop("skipped");savedWorldWidth=608;resize()');page.wait_for_timeout(150);assert ev('worldW()===608&&!sharedReserve()&&heroClass(S).id==="warlord"');assert ev('document.documentElement.scrollHeight<=innerHeight+1');page.screenshot(path='/mnt/data/responsive-warlord.png');
 print('errors',errs);assert not errs;b.close()
srv.shutdown()
