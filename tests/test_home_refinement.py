# Full game geometry test; requires Playwright and Chromium. Not run in this environment.
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
 page.goto(f'http://127.0.0.1:{server.server_port}/');page.wait_for_function("document.documentElement.classList.contains('g63-assets-ready')",timeout=20000)
 for w,h in [(1891,898),(1920,1080),(3840,2160),(1366,768),(768,1024),(375,667),(844,390)]:
  page.set_viewport_size({'width':w,'height':h});page.evaluate('showHome()');page.wait_for_timeout(100)
  assert page.locator('#homeView .g61-button').count()==11
  assert page.evaluate('''()=>{const bs=[...document.querySelectorAll('#homeView .g61-button')],rs=bs.map(b=>b.querySelector('.g61-picture').getBoundingClientRect()),ls=bs.map(b=>b.querySelector('.g61-label'));return rs.every(r=>r.width>0&&r.height>0&&r.bottom<=innerHeight+1&&r.top>=-1&&r.left>=-1&&r.right<=innerWidth+1)&&ls.every(x=>x.scrollWidth<=x.clientWidth+2&&x.scrollHeight<=x.clientHeight+2)&&!rs.some((a,i)=>rs.slice(i+1).some(d=>Math.min(a.right,d.right)-Math.max(a.left,d.left)>1&&Math.min(a.bottom,d.bottom)-Math.max(a.top,d.top)>1))}'''),(w,h)
 b.close()
server.shutdown()
