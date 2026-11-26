"""Reference entries, live formula parity, profile/run isolation and menu layout."""
import re, base64, mimetypes
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<link rel="stylesheet" href="([^"?]+)(?:\?[^" ]*)?">',lambda m:'<style>'+(root/m[1]).read_text()+'</style>',html)
html=re.sub(r'<script src="([^"?]+)(?:\?[^" ]*)?"></script>',lambda m:'<script>'+(root/m[1]).read_text().replace('</script','<\\/script')+'</script>',html)
for asset in (root/'assets').rglob('*'):
 if asset.is_file():
  rel=str(asset.relative_to(root));html=re.sub(re.escape(rel)+r'(?:\?v=[\w.-]+)?','data:'+str(mimetypes.guess_type(asset)[0])+';base64,'+base64.b64encode(asset.read_bytes()).decode(),html)
shim='<script>const disk={};Object.defineProperty(window,"localStorage",{value:{getItem:k=>disk[k]??null,setItem:(k,v)=>disk[k]=String(v),removeItem:k=>delete disk[k]}});</script>'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1920,'height':1080});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded');page.wait_for_function('!document.getElementById("artLoading")',timeout=20000)
 def ev(s):return page.evaluate(s)
 def tab(id):page.locator(f'#codexTabs [data-codex={id}]').click()
 page.locator('[data-front=codex]').click();assert ev('!S&&!$("#codexView").hidden')
 for id,n in [('guardians',7),('humans',12),('cards',12),('upgrades',27),('heroes',22)]:
  tab(id);assert page.locator('#codexContent article').count()==n,(id,page.locator('#codexContent article').count());assert not ev('$("#codexContent").textContent.includes("undefined")||$("#codexContent").textContent.includes("NaN")')
 tab('cards');page.locator('#codexSearch').fill('Bone Rain');assert page.locator('#codexContent article').count()==1;assert '25 area damage' in page.locator('#codexContent').inner_text();page.locator('#codexWave').select_option('5');assert '53 area damage' in page.locator('#codexContent').inner_text();page.locator('#codexSearch').fill('<script>');assert page.locator('#codexContent article').count()==0
 tab('humans');assert 'The Crusader' in page.locator('#codexContent').inner_text();assert 'The Grand Huntsman' in page.locator('#codexContent').inner_text();assert ev('codexEnemy("com",5).available&&!codexEnemy("ant",5).available&&codexEnemy("ant",6).available');tab('guardians');assert ev('codexPreview("W",1,1).hp===BASE.W.hp&&codexPreview("K",3,5).hp===Math.round((BASE.K.hp+18*5)*3.5)');page.locator('#codexWave').select_option('1');page.wait_for_timeout(400);page.screenshot(path='/mnt/data/StopHumans-codex-guardians.png')
 for w,h in [(3840,2160),(1366,768),(390,844)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(150);assert ev('document.documentElement.scrollWidth<=innerWidth+1');assert ev('$("#codexView").getBoundingClientRect().width<=innerWidth+1');tab('heroes');tab('guardians')
 page.set_viewport_size({'width':1920,'height':1080});page.keyboard.press('Escape');assert ev('!$("#homeView").hidden');ev("profile.name='Tester';launchNew('sorcerer');startRun(0);tutorialStop('skipped');prefs.reduced=true;S.gold=50;renderUI();buySlot();showHome()")
 saved=ev('JSON.stringify({...loadedSave,savedAt:0})');state=ev('JSON.stringify(S,(k,v)=>v instanceof Set?[...v]:v instanceof Map?[...v]:v)');profile=ev('JSON.stringify(campaignProfileBackup())');undo=ev('prepUndoStack.length');assert undo==1
 page.locator('[data-front=codex]').click();tab('heroes');page.locator('#codexWave').select_option('10');tab('guardians');assert ev('codexPreview("M",1,1).dmg===BASE.M.dmg&&stats("M",1).dmg===Math.round(BASE.M.dmg*S.mods.mageDmg)');assert ev('JSON.stringify(S,(k,v)=>v instanceof Set?[...v]:v instanceof Map?[...v]:v)')==state;assert ev('JSON.stringify(campaignProfileBackup())')==profile;assert ev('prepUndoStack.length')==undo
 page.keyboard.press('Escape');assert ev('JSON.stringify({...loadedSave,savedAt:0})')==saved;page.locator('#continueBtn').click();assert ev('!menuOpen&&S.phase==="prep"');assert not errs,errs
 print('Codex: 80 entries, wave preview, search, 4 viewports, run/profile/undo isolation; JS errors:',errs);b.close()
