# Full integration visual geometry regression; requires Playwright and Chromium.
from pathlib import Path
import functools, http.server, threading
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(f'http://127.0.0.1:{server.server_port}/');page.wait_for_function('!document.getElementById("artLoading")',timeout=20000)
 for w,h in [(3840,2160),(1920,1080),(1366,768),(768,1024),(375,667),(844,390)]:
  page.set_viewport_size({'width':w,'height':h});page.evaluate('showHome()');page.wait_for_timeout(150)
  assert page.locator('#homeView .g61-button').count()==11
  assert page.evaluate('''()=>[...document.querySelectorAll('#homeView .g61-button')].every(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom<=innerHeight+1&&r.top>=0&&r.left>=0&&r.right<=innerWidth+1})'''),(w,h,'home controls')
  page.evaluate('campaignMapOpen(true)');page.wait_for_timeout(150)
  assert page.locator('#cmNodes .cm-node').count()==5
  assert page.evaluate('''()=>{const s=document.querySelector('#cm61-stage'),m=document.querySelector('#cm61-world').getBoundingClientRect();return m.width>100&&Math.abs(m.width/m.height-926/746)<.02&&m.width<=s.clientWidth+1&&m.height<=s.clientHeight+1}'''),(w,h,'map fit')
  if w<=1000:page.locator('[data-cm-pane="detail"]').click()
  assert page.evaluate('''()=>{const r=document.querySelector('.cm-fixed-actions').getBoundingClientRect();return r.height>0&&r.bottom<=innerHeight+1}'''),(w,h,'actions')
 assert not errors,errors
 b.close()
server.shutdown()
