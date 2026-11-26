"""Live synergy integration, movement, nonstacking, save/restore and Codex."""
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
 ev("profile.name='Tester';launchNew('sorcerer');startRun(0);tutorialStop('skipped');prefs.reduced=true;S.units=[];S.bench=[null,null,null];S.mods.mageDmg=1;S.mods.splash=1")
 ev("window.setup=()=>{S.units=[];for(const [type,x,y] of [['W',240,100],['A',170,100],['B',140,150],['M',240,170],['N',180,210]]){const u=makeUnit(type,1);Object.assign(u,{x,y,cd:0});S.units.push(u);}renderUI()};setup()")
 assert ev("synergyActive(S.units[1]).length===2&&synergyFactor(S.units[3],'damageTaken')===.85&&synergyFactor(S.units[4],'raiseCooldown')===.75")
 assert ev("Math.abs(tacticalModel(S.units[1]).combat.attackRate-(1+bansheeOn(S.units[1]))*1.15/stats('A',1,S.units[1]).cd)<1e-9")
 assert ev("(()=>{const a=S.units[1],w=S.units[0],dup={...w};S.units.push(dup);const ok=synergyFactor(a,'damageTaken')===.85;S.units.pop();w.hp=0;const dead=synergyFactor(a,'damageTaken')===1;w.hp=w.maxHp;S.units.splice(0,1);S.bench[0]=w;const reserve=synergyFactor(a,'damageTaken')===1;S.bench[0]=null;S.units.unshift(w);w.x=400;const far=synergyFactor(a,'damageTaken')===1;w.x=240;return ok&&dead&&reserve&&far})()")
 assert ev("(()=>{const a=S.units[1],b=S.units[2];b.down=true;const off=synergyFactor(a,'attackRate')===1;b.down=false;return off&&synergyFactor(a,'attackRate')===1.15})()")
 ev('openBestiary(S.units[1])');assert 'Boneguard' in page.locator('#bestiaryBody').inner_text();assert 'ACTIVE' in page.locator('#bestiaryBody').inner_text();page.wait_for_timeout(250);page.screenshot(path='/mnt/data/StopHumans-synergies.png');ev('closeBestiary()')
 assert ev("persist()&&(()=>{const v=JSON.parse(JSON.stringify(loadedSave));restore(v);return synergyActive(S.units.find(u=>u.type==='A')).length===2})()")
 # Actual damage path, cooldown integration and attack timing in the simulation.
 assert ev("(()=>{const a=S.units.find(u=>u.type==='A');S.phase='fight';const before=a.hp;const dealt=heroDamageTarget(a,10);S.phase='prep';a.hp=before;return Math.abs(dealt-8.5)<1e-9})()")
 result=ev("""()=>{setup();S.spinsLeft=0;startFight();S.queue=[];S.spawnT=999;S.altarCd=999;const n=S.units.find(u=>u.type==='N'),a=S.units.find(u=>u.type==='A');a.cd=.14;const b=S.units.find(u=>u.type==='B');const m=S.units.find(u=>u.type==='M');m.cd=99;const w=S.units.find(u=>u.type==='W');w.cd=99;S.enemies=[{...sandboxEnemy('cab',1),hp:0,maxHp:44,x:n.x+40,y:n.y,cd:99,root:0,flash:0},{...sandboxEnemy('cab',1),hp:1000,maxHp:1000,x:Math.min(worldW()-20,a.x+170),y:a.y,cd:99,root:99,flash:0}];update(.1);return {summons:S.units.filter(u=>u.type==='K').length,cd:n.cd,expected:stats('N',n.lvl,n).cd*.75,orb:S.shots.some(s=>s.k==='orb')};}""")
 assert result['summons']==1 and abs(result['cd']-result['expected'])<1e-8 and result['orb'],result
 ev("S.phase='prep';S.units=S.units.filter(u=>!u.temp);showHome();codexOpen()")
 assert 'Boneguard' in page.locator('#codexContent').inner_text();assert 'Ash Ritual' in page.locator('#codexContent').inner_text();assert 'Spectral Choir' in page.locator('#codexContent').inner_text()
 assert not errs,errs
 print('Synergies: activation, range, reserve, fallen, duplicate, restore, actual damage, attack, summon cooldown, Codex, no JS errors',result);b.close()
