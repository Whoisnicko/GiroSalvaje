# Full game responsive integration regression. Requires Playwright and Chromium; not executed here.
from pathlib import Path
import functools, http.server, threading
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page()
 page.goto(f'http://127.0.0.1:{server.server_port}/')
 page.wait_for_function("typeof campaignMapOpen==='function'")
 for w,h in [(3840,2160),(1920,1080),(1891,898),(1366,768),(768,1024),(375,667),(844,390)]:
  page.set_viewport_size({'width':w,'height':h});page.evaluate('campaignMapOpen(true)')
  page.wait_for_function("document.documentElement.classList.contains('g64-campaign-art-ready')")
  if w<=1000:page.locator('[data-cm-pane="map"]').click()
  page.wait_for_timeout(100)
  assert page.locator('#campaignMapView .g62-crown').count()==0
  assert page.locator('#cmNodes .cm-node').count()==5
  assert page.evaluate('''()=>{const m=document.querySelector('#cm61-world').getBoundingClientRect(),ns=[...document.querySelectorAll('.cm-node')],rs=ns.map(x=>x.getBoundingClientRect());return m.width>100&&Math.abs(m.width/m.height-926/746)<.02&&rs.every(r=>r.width>0&&r.left>=m.left-1&&r.right<=m.right+1&&r.top>=m.top-1&&r.bottom<=m.bottom+1)&&!rs.some((a,i)=>rs.slice(i+1).some(c=>Math.min(a.right,c.right)-Math.max(a.left,c.left)>1&&Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top)>1))}'''),(w,h,'map geometry')
  if w<=1000:page.locator('[data-cm-pane="detail"]').click()
  assert page.evaluate('''()=>{const r=document.querySelector('.cm-fixed-actions').getBoundingClientRect();return r.height>0&&r.top>=0&&r.bottom<=innerHeight+1}'''),(w,h,'fixed actions')
 b.close()
server.shutdown()
