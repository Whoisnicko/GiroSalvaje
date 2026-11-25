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
 load();page.locator('[data-front=sanctum]').click();assert ev("!$('#sanctumView').hidden&&document.querySelectorAll('.sanctum-item').length===21")
 page.screenshot(path='/mnt/data/StopHumans-sanctum-preview.png');page.locator('#sanctumView [data-front=back]').click()
 page.locator('#newGameBtn').click();assert page.locator('#campaignLength').input_value()=='5';page.locator('#playerName').fill('Tester');page.locator('[data-front=new-confirm]').click();page.locator('[data-hero-class=sorcerer]').click();page.locator('[data-act=relic]').first.click();ev("tutorialStop('skipped');prefs.reduced=true")
 assert ev("campaignLimit()===5&&snapshot().version===18&&S.campaign.maxWaves===5")
 for w in range(1,6):
  ev('S.spinsLeft=0;startFight();endWave()')
  if w==5:
   assert ev("S.phase==='win'&&S.campaign.route.length===4&&S.wave===6&&knowledgeLearned('grasp')");break
  if w%2==0:page.locator('[data-act=reward]').first.click()
  assert ev("S.phase==='journey'&&journeyOptions().length===2&&$('.j-progress b').textContent.endsWith('/ 5')")
  if w==1:page.screenshot(path='/mnt/data/StopHumans-short-map.png')
  page.locator('[data-journey-choose]').first.click();load();ev('restore(loadedSave)');assert ev('campaignLimit()===5&&!!journeySelected()');page.locator('[data-journey-next]').click()
 assert ev('scores().some(r=>r.won&&r.wave===5&&r.maxWaves===5)');n=ev('META.deck.length');page.locator('[data-act=endcard]').first.click();assert ev('META.deck.length')==n+1
 load();ev('restore(loadedSave)');assert ev("S.phase==='win'&&campaignLimit()===5&&campaignEndClaimed()")
 ev('showHome();sanctumOpen()');assert ev("$('#sanctumBody').textContent.includes('4/6')");page.set_viewport_size({'width':3840,'height':2160});page.wait_for_timeout(200);assert ev("$('#sanctumView').getBoundingClientRect().bottom<=innerHeight+1");page.set_viewport_size({'width':1366,'height':768})
 ev('showScores()');assert ev("$('#scoreRows').textContent.includes('5/5')&&$('#publishScore').disabled")
 ev("launchNew('warlord',null,5);startRun(0);tutorialStop('skipped');S.wave=5;S.spinsLeft=0;startFight();endWave()");assert ev("S.phase==='win'&&campaignLimit()===5&&talentInit().best===5")
 ev("launchNew('warlord',null,10);startRun(0);tutorialStop('skipped');prefs.reduced=true")
 assert ev('campaignLimit()===10');ev('S.wave=5;S.spinsLeft=0;startFight();endWave()');assert ev("S.phase==='journey'&&S.wave===6&&talentInit().best===5")
 ev("let v=snapshot();v.version=17;delete v.state.campaign.maxWaves;localStorage.setItem(SAVE_KEY,JSON.stringify(v))");load();ev('restore(loadedSave)');assert ev('campaignLimit()===10&&S.wave===6')
 ev("journeyChoose(journeyOptions()[0].id);prefs.reduced=true");page.wait_for_timeout(800);ev('journeyContinue()');assert ev("S.phase==='prep'&&campaignLimit()===10")
 ev("showHome();sandboxEnter('sorcerer');startRun(0)");assert ev("S.sandbox&&campaignLimit()===10&&$('#sbWave').options.length===10")
 print('short victory, classic migration, profile, ranking, sandbox and responsive; errors:',errs);assert not errs;b.close()
 srv.shutdown()
