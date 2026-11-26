"""Browser integration: exercise actual controls and spawned enemy, not just queue construction."""
from pathlib import Path
import functools, http.server, threading
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1920,'height':1080})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:'+str(server.server_port),wait_until='domcontentloaded')
  page.wait_for_function('!document.getElementById("artLoading")',timeout=30000)
  page.evaluate("sandboxEnter('sorcerer');startRun(0)")
  page.locator('[data-sb-boss=huntsman]').click()
  page.wait_for_function("S.enemies.some(e=>e.bossId==='huntsman')")
  assert page.evaluate("S.biomeId==='forest'&&S.wave===5&&S.enemies.length===1&&enemySprite(S.enemies[0])==='ballestero'")
  assert 'The Grand Huntsman' in page.locator('#sbLoaded').inner_text()
  page.locator('[data-sb-boss=crusader]').click()
  page.wait_for_function("S.enemies.some(e=>e.bossId==='crusader')")
  assert page.evaluate("S.biomeId==='valley'&&S.enemies.length===1")
  page.locator('#sbBoss').select_option('huntsman')
  assert page.evaluate("S.phase==='prep'&&S.nextQueue.length===1&&S.nextQueue[0].bossId==='huntsman'")
  page.locator('[data-sb=fight]').click()
  page.wait_for_function("S.enemies.some(e=>e.bossId==='huntsman')")
  assert page.evaluate("S.biomeId==='forest'&&S.enemies.length===1")
  assert not errors,errors
  browser.close()
finally:
 server.shutdown()
