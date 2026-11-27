# Full-game campaign geometry regression; requires Playwright and Chromium.
import functools,http.server,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
sizes=[(3840,2160),(2048,1156),(1920,1080),(1600,900),(1366,768),(1280,720),(1024,768),(768,1024),(390,844),(375,667),(844,390)]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);p=b.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(f'http://127.0.0.1:{server.server_port}/');p.wait_for_function('typeof campaignMapOpen==="function"')
 for w,h in sizes:
  p.set_viewport_size({'width':w,'height':h});p.evaluate('campaignMapOpen(true)');p.wait_for_function('document.documentElement.classList.contains("g67-cards-ready")');p.wait_for_timeout(150)
  assert p.locator('#cmNodes .cm-node').count()==5
  assert p.evaluate('''()=>{let r=document.querySelector('#cm61-world').getBoundingClientRect();return r.height>0&&Math.abs(r.width/r.height-926/746)<.025&&document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1}'''),(w,h,'map')
  if w<=1000:p.locator('[data-cm-pane="menu"]').click()
  assert p.locator('#campaignMapView .g61-side .g61-picture').count()==9
  assert p.evaluate('''()=>[...document.querySelectorAll('#campaignMapView .g61-side .g61-picture')].every(e=>{let r=e.getBoundingClientRect(),l=e.querySelector('.g61-label');return r.height>0&&Math.abs(r.width/r.height-200/132)<.025&&r.x>=-1&&r.y>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&l.scrollWidth<=l.clientWidth+2&&l.scrollHeight<=l.clientHeight+2})'''),(w,h,'cards')
  assert p.evaluate('''()=>getComputedStyle(document.querySelector('#campaignMapView .g61-side [aria-current=page] .g61-picture')).backgroundImage.includes('campaign-cards-v67.webp')''')
  if w<=1000:p.locator('[data-cm-pane="detail"]').click()
  assert p.evaluate('''()=>[...document.querySelectorAll('#cmDetail .cm-fixed-actions .g61-button')].every(e=>{let r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})'''),(w,h,'actions')
  p.locator('[data-cm-tab="mastery"]').click();assert p.locator('[data-cm-page="mastery"]').is_visible()
  p.evaluate('showHome()');assert p.locator('#homeView .g61-button').count()==11
 assert not errors,errors
 b.close()
server.shutdown()
