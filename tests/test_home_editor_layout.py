"""Decor browsing keeps the full live home visible at desktop and mobile sizes."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import os, subprocess, json
ROOT=Path(__file__).resolve().parents[1]
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True)
url=proc.stdout.readline().strip().split('Eumo: ')[1]
seed={'profile':{'name':'Momo','color':'#a8b77a','configured':True},'balance':100,'home':{'theme':'moss','ownedThemes':['cave','moss'],'owned':['rug','bed'],'slots':{'floor':'rug','right':'bed'}}}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  ctx=browser.new_context()
  ctx.add_init_script("localStorage.setItem('eumo-tour-v1','seen');localStorage.setItem('eumo-appearance','day');if(!localStorage.getItem('loop-pet-soft-universe-v1'))localStorage.setItem('loop-pet-soft-universe-v1',"+json.dumps(json.dumps(seed))+")")
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  for width,height in [(1440,900),(1280,720),(1024,600),(768,1024),(390,844),(390,600)]:
   page.set_viewport_size({'width':width,'height':height});page.goto(url+'/#home');page.wait_for_function('MoleArt.ready')
   full_width=page.locator('#homeCanvas').bounding_box()['width']
   page.locator('#editHomeButton').click();expect(page.locator('#editHomeButton')).to_have_attribute('aria-expanded','true');page.wait_for_timeout(150)
   canvas=page.locator('#homeCanvas');shop=page.locator('.home-shop');room=page.locator('.home-room')
   cb=canvas.bounding_box();sb=shop.bounding_box();rb=room.bounding_box()
   assert cb['y']>=0 and cb['y']+cb['height']<=height,(width,height,cb)
   assert abs(cb['width']/cb['height']-16/9)<.01
   assert cb['width']<full_width
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   if width>900:assert rb['x']+rb['width']<sb['x'] and abs(rb['y']-sb['y'])<2
   else:
    assert sb['y']>=rb['y']+rb['height']
    assert page.locator('.home-stage').evaluate('e=>e.scrollWidth<=e.clientWidth')
   top=cb['y'];page_scroll=page.evaluate('scrollY')
   page.mouse.move(sb['x']+sb['width']/2,sb['y']+min(80,sb['height']/2));page.mouse.wheel(0,650);page.wait_for_timeout(150)
   assert shop.evaluate('e=>e.scrollTop')>0
   assert abs(canvas.bounding_box()['y']-top)<2
   assert page.evaluate('scrollY')==page_scroll
   shop.evaluate('e=>e.scrollTop=0');page.locator('[data-slot="study"]').click()
   if page.evaluate("state.home.slots.study!=='desk'"):
    page.locator('[data-home-item="desk"]').click();assert page.evaluate("state.home.slots.study==='desk' && state.balance===85")
   assert canvas.bounding_box()['y']>=0
   assert canvas.bounding_box()['y']+canvas.bounding_box()['height']<=height
   page.wait_for_timeout(150)
   if width==1440:page.screenshot(path=str(ROOT/'docs/images/eumo-burrow-decorate.png'))
   if width==390 and height==844:page.screenshot(path=str(ROOT/'docs/images/eumo-home-editor-mobile.png'))
   # The chest hit target follows the scaled preview rather than old fixed mobile coordinates.
   page.locator('#openChestButton').click();expect(page.locator('#chestDialog')).to_be_visible();page.keyboard.press('Escape')
   page.locator('#editHomeButton').click();expect(shop).to_be_hidden();expect(page.locator('#editHomeButton')).to_have_attribute('aria-expanded','false')
   assert abs(canvas.bounding_box()['width']-full_width)<2
  assert not errors,errors
  browser.close();print('PASS: six viewport sizes, side-by-side desktop, compact mobile preview, independent sidebar scroll, live placement, scaled chest and restored full view.')
finally:proc.terminate();proc.wait()
