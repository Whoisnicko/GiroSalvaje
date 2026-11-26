"""Regression: actual artwork must be visible, including when canvas-to-canvas drawing fails."""
import base64, io, json, mimetypes, re
from pathlib import Path
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'engine/baked-art.js').read_text().split(' = ',1)[1].strip().rstrip(';'))
sheets=[Image.open(root/p).convert('RGBA') for p in manifest['sheets']]
for name,variants in manifest['frames'].items():
 for variant,frames in variants.items():
  assert len(frames)==12
  for i in frames:
   j=i%64;x=j%8*96;y=j//8*96;im=sheets[i//64].crop((x,y,x+96,y+96));assert sum(im.getchannel('A').histogram()[129:])>100,(name,variant,i)
for name,u in manifest['portraits'].items():
 im=Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('RGBA');assert sum(im.getchannel('A').histogram()[129:])>100,name
for name,u in manifest['cards'].items():
 im=Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('RGB');assert len(im.crop((25,8,71,55)).getcolors(100000))>30,name
html=(root/'index.html').read_text();html=re.sub(r'<link rel="stylesheet" href="([^"?]+)(?:\?[^" ]*)?">',lambda m:'<style>'+(root/m[1]).read_text()+'</style>',html);html=re.sub(r'<script src="([^"?]+)(?:\?[^" ]*)?"></script>',lambda m:'<script>'+(root/m[1]).read_text().replace('</script','<\\/script')+'</script>',html)
for asset in (root/'assets').rglob('*'):
 if asset.is_file():
  rel=str(asset.relative_to(root));html=re.sub(re.escape(rel)+r'(?:\?v=[\w.-]+)?','data:'+str(mimetypes.guess_type(asset)[0])+';base64,'+base64.b64encode(asset.read_bytes()).decode(),html)
shim='''<script>const disk={};Object.defineProperty(window,"localStorage",{value:{getItem:k=>disk[k]??null,setItem:(k,v)=>disk[k]=String(v),removeItem:k=>delete disk[k]}});const drawOriginal=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if(im instanceof HTMLCanvasElement)return;return drawOriginal.call(this,im,...args);};</script>'''
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1920,'height':1080});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 def load(mode):
  source=html
  if mode=='fallback':source=source.replace('artReady.then(buildHybridArt)',"BAKED_ART.sheets.fill('data:image/png;base64,invalid');artReady.then(buildHybridArt)")
  elif mode=='missing':source=source.replace('artReady.then(buildHybridArt)',"BAKED_ART.sheets.fill('data:image/png;base64,invalid');artReady.then(buildHybridArt)");source=re.sub(r"const ILLUSTRATED_ATLAS='[^']+';","const ILLUSTRATED_ATLAS='data:image/png;base64,invalid';",source)
  page.set_content(source.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded');page.wait_for_function('!document.getElementById("artLoading")',timeout=20000);page.evaluate("profile.name='Tester';launchNew('sorcerer');startRun(0);tutorialStop('skipped');prefs.reduced=true;");page.wait_for_timeout(300)
  assert page.evaluate("Array.from(document.querySelectorAll('#hand .art img,#reels img')).every(i=>i.complete&&i.naturalWidth>0)")
  result=page.evaluate('''()=>{const u=S.units[0],x=u.x,y=u.y;renderFrame();const withUnit=ctx.getImageData(0,0,cv.width,cv.height).data.slice();S.units.shift();renderFrame();const without=ctx.getImageData(0,0,cv.width,cv.height).data;S.units.unshift(u);let diff=0;for(let i=0;i<withUnit.length;i+=4)if(withUnit[i]!==without[i]||withUnit[i+1]!==without[i+1]||withUnit[i+2]!==without[i+2])diff++;return {diff,frame:!!SPR.zombi[0],decoded:!!SPR.zombi[0]?.image};}''')
  assert result['diff']>100,result
  if mode=='normal':
   assert result['decoded'];assert page.evaluate('''()=>{const f=SPR.zombi[0],c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.drawImage(f.image,f.sx,f.sy,96,96,0,0,96,96);return g.getImageData(0,0,96,96).data.filter((v,i)=>i%4===3&&v>128).length>100;}''');page.screenshot(path='/mnt/data/StopHumans-art-fix.png')
  if mode=='fallback':assert result['decoded']
  if mode=='missing':assert not result['frame']
  print(mode,result)
 load('normal');page.close();page=b.new_page(viewport={'width':1920,'height':1080});page.on('pageerror',lambda e:errs.append(str(e)));load('fallback');page.close();page=b.new_page(viewport={'width':1920,'height':1080});page.on('pageerror',lambda e:errs.append(str(e)));load('missing');assert not errs,errs;b.close()
