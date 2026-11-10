"""Buyable fixtures, light removal, persistence and offline texture loading."""
from pathlib import Path
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright, expect
import os, subprocess, json
ROOT=Path(__file__).resolve().parents[1]
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True)
url=proc.stdout.readline().strip().split('Eumo: ')[1]
seed={'profile':{'name':'Momo','color':'#a8b77a','configured':True},'balance':160,'home':{'theme':'cave','owned':['rug','bed','bookcase'],'slots':{'floor':'rug','right':'bed','study':'bookcase'}}}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  ctx=browser.new_context(viewport={'width':1440,'height':1000})
  ctx.add_init_script("localStorage.setItem('eumo-tour-v1','seen');if(!localStorage.getItem('loop-pet-soft-universe-v1'))localStorage.setItem('loop-pet-soft-universe-v1',"+json.dumps(json.dumps(seed))+")")
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.clock.install(time=datetime(2026,11,10,13,tzinfo=timezone.utc))
  page.goto(url+'/#home');page.wait_for_function('HomeScenery.textureReady && MoleArt.ready')
  page.clock.run_for(300)
  page.screenshot(path=str(ROOT/'docs/images/eumo-burrow-home.png'),full_page=True)
  page.locator('#editHomeButton').click()
  def buy(slot,item):
   page.locator('[data-slot="'+slot+'"]').click()
   card=page.locator('[data-home-item="'+item+'"]').locator('..')
   assert card.locator('svg rect').count()>5
   page.locator('[data-home-item="'+item+'"]').click()
   assert page.evaluate('(a)=>state.home.slots[a[0]]===a[1]',[slot,item])
  buy('bedWindow','archedWindow');buy('livingWall','hangingLantern');buy('studyWindow','herbShelf');buy('bedWall','crockeryShelf');buy('left','kitchenUnit')
  assert page.evaluate('state.balance')==80
  # Moving an owned window charges nothing, and a single purchased copy moves rather than duplicates.
  buy('livingWindow','archedWindow')
  assert page.evaluate('state.balance===80 && state.home.slots.bedWindow===null')
  # Sample the wall away from the lantern sprite: removing the lamp must remove its actual light.
  def wall_pixel():
   return page.evaluate("""()=>{const cv=document.createElement('canvas');cv.width=1280;cv.height=720;PixelArt.drawHomePreview(cv,state);return [...cv.getContext('2d').getImageData(340,460,2,2).data];}""")
  lit=wall_pixel();page.locator('[data-slot="livingWall"]').click();page.locator('#clearHomeSlot').click();unlit=wall_pixel()
  assert lit!=unlit,'Lamp removal must remove the light on the surrounding wall'
  buy('livingWall','hangingLantern');assert wall_pixel()==lit
  assert page.evaluate('state.balance')==80
  # Share serialization must include new fixtures and new positions, while rejecting a wrong item type.
  assert page.evaluate("HomeCatalog.sharedHome(state.home).slots.livingWindow==='archedWindow'")
  assert page.evaluate("HomeCatalog.sharedHome({theme:'cave',slots:{floor:'archedWindow'}}).slots.floor===null")
  page.locator('#editHomeButton').click();page.reload();page.wait_for_function('HomeScenery.textureReady && MoleArt.ready')
  assert page.evaluate("state.home.slots.livingWindow==='archedWindow' && state.home.slots.livingWall==='hangingLantern' && state.home.slots.left==='kitchenUnit' && state.balance===80")
  page.clock.run_for(300);page.screenshot(path=str(ROOT/'docs/images/eumo-burrow-personalized.png'),full_page=True)
  page.evaluate("WorldClock.setAppearance('night')");page.clock.run_for(300);page.screenshot(path=str(ROOT/'docs/images/eumo-burrow-night.png'),full_page=True)
  page.set_viewport_size({'width':390,'height':844});page.clock.run_for(300)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(ROOT/'docs/images/eumo-burrow-mobile.png'))
  # Offline page is navigated with network disabled: embedded art must load without a cached URL.
  offline=browser.new_context(offline=True,viewport={'width':1280,'height':900})
  offline.add_init_script("localStorage.setItem('eumo-tour-v1','seen');localStorage.setItem('loop-pet-soft-universe-v1',"+json.dumps(json.dumps(seed))+")")
  offline.route('**/*',lambda route:route.fulfill(status=200,content_type='text/html',body=(ROOT/'dist/Eumo.html').read_text()) if route.request.url==url+'/offline.html' else route.abort())
  local=offline.new_page();local.on('pageerror',lambda e:errors.append(str(e)));local.goto(url+'/offline.html#home')
  local.wait_for_function('HomeScenery.textureReady && MoleArt.ready')
  local.locator('#editHomeButton').click();local.locator('[data-slot="bedWindow"]').click();local.locator('[data-home-item="archedWindow"]').click()
  assert local.evaluate("state.home.slots.bedWindow==='archedWindow' && state.balance===142")
  assert not errors,errors
  browser.close()
  print('PASS: buy/place/move/remove fixtures, exact prices, removable light, share validation, reload, mobile and network-disabled standalone texture/decor.')
finally:proc.terminate();proc.wait()
