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
 # Every destination: preview, deterministic reward, failed write rollback and reload.
 for idx,kind in enumerate(['vault','crypt','shrine','forge','sanctuary']):
  ev("launchNew('sorcerer',null,10);startRun(0);tutorialStop('skipped');S.gold=20;S.wallHp=30;")
  page.evaluate('(kind)=>{for(let i=0;i<1000;i++){if(Journey.options(i,1).some(n=>n.icon===kind)){S.campaign.seed=i;break}}}',kind)
  ev('S.spinsLeft=0;startFight();endWave()');assert ev("S.phase==='journey'&&S.gold===20&&S.campaign.routeEconomy===1")
  opts=ev('journeyOptions()');target=next(n for n in opts if n['icon']==kind);before=ev('({gold:S.gold,hp:S.wallHp,count:allMine().length})')
  if kind=="vault":page.screenshot(path="/mnt/data/StopHumans-route-rewards.png")
  load();ev('restore(loadedSave)');assert ev('journeyOptions()')==opts
  page.locator('[data-journey-choose="'+target['id']+'"]').click();assert ev('S.gold')==20
  load();ev('restore(loadedSave)');assert ev('S.gold')==20
  assert ev("(()=>{let old=localStorage.setItem;localStorage.setItem=function(k,v){if(k===SAVE_KEY)throw Error('blocked');return old.call(this,k,v)};try{return !journeyContinue()&&S.phase==='journey'}finally{localStorage.setItem=old}})()")
  assert ev('({gold:S.gold,hp:S.wallHp,count:allMine().length})')==before
  page.locator('[data-journey-next]').click();assert ev("S.phase==='prep'")
  after=ev('({gold:S.gold,hp:S.wallHp,count:allMine().length})')
  assert after['gold']==20+({'vault':3,'crypt':0,'shrine':6,'forge':3,'sanctuary':3}[kind]),(kind,after)
  assert after['hp']==30+(15 if kind=='sanctuary' else 0)
  assert after['count']==before['count']+(1 if kind=='crypt' else 0)
  assert not ev('journeyContinue()');load();ev('restore(loadedSave)');assert ev('({gold:S.gold,hp:S.wallHp,count:allMine().length})')==after
  assert ev('artifactPrice("bloodfang")')==(6 if kind=='vault' else 8)
  assert ev('infusionPrice("bone")')==(6 if kind=='forge' else 8)
  if kind=='vault':
   ev('showShop()');assert '6 souls' in page.locator('[data-act=artifactbuy][data-id=bloodfang]').inner_text();page.locator('[data-act=artifactbuy][data-id=bloodfang]').click();assert ev('S.gold')==17;page.locator('[data-act=shopclose]').click();assert ev('prepUndo()&&S.gold===23&&!artifactOwned("bloodfang")')
  if kind=='forge':
   ev('openBestiary(S.units[0])');page.locator('[data-infusion=bone]').click();assert ev('S.gold===17&&S.units[0].infusion==="bone"');page.locator('.bestiary-close').click();assert ev('prepUndo()&&S.gold===23&&!S.units[0].infusion')
  ev('S.spinsLeft=0;startFight()');assert ev('routeDiscount("artifact")===0&&routeDiscount("infusion")===0')
  print(kind,'passed',flush=True)
 # Full reserve/field fallback and HP cap; actual legacy v16 arrival no duplicate payout.
 ev("launchNew('warlord',null,10);startRun(0);tutorialStop('skipped');S.gold=20;S.maxUnits=0;S.bench=[makeUnit('W',1),makeUnit('A',1),makeUnit('M',1)];S.spinsLeft=0;startFight();endWave()")
 ev("for(let i=0;i<1000;i++){if(Journey.options(i,1).some(n=>n.icon==='crypt')){S.campaign.seed=i;break}};prefs.reduced=true;journeyShow();journeyChoose(journeyOptions().find(n=>n.icon==='crypt').id)");page.wait_for_timeout(100);ev('journeyContinue()');assert ev('S.gold===23&&S.bench.every(Boolean)')
 ev("launchNew('sorcerer',null,10);startRun(0);tutorialStop('skipped');S.campaign.routeEconomy=0;S.gold=20;S.spinsLeft=0;startFight();endWave();journeyChoose(journeyOptions()[0].id);let v=snapshot();v.version=16;delete v.state.campaign.routeEconomy;localStorage.setItem(SAVE_KEY,JSON.stringify(v))")
 load();ev('restore(loadedSave)');assert ev('S.campaign.routeEconomy===0&&S.gold===23');page.locator('[data-journey-next]').click();assert ev('S.gold===23')
 # New campaign completes all nine transitions and original even-wave blessings.
 ev("launchNew('warlord',null,10);startRun(0);tutorialStop('skipped');prefs.reduced=true")
 for w in range(1,11):
  ev('S.spinsLeft=0;startFight();endWave()')
  if w==10:
   assert ev("S.phase==='win'&&S.campaign.route.length===9&&S.campaign.routeEconomy===1");break
  if w%2==0:
   assert ev("S.phase==='reward'");page.locator('[data-act=reward]').first.click()
  assert ev("S.phase==='journey'");page.locator('[data-journey-choose]').first.click();page.locator('[data-journey-next]').click();assert ev("S.phase==='prep'")
 assert ev('S.campaign.claimedWaveRewards.length===4')
 print('all route effects, reload, rollback, discount/undo, legacy migration and complete new campaign; errors:',errs);assert not errs;b.close()
srv.shutdown()
