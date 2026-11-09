"""Room placement, migration, chest alignment, small screens and offline home."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import os, subprocess, json
ROOT=Path(__file__).resolve().parents[1]
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True)
url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1440,'height':1000})
  seed={'profile':{'name':'Momo','color':'#a9b4c6','configured':True},'balance':100,'home':{'theme':'cave','owned':['rug','bed','art'],'slots':{'floor':'rug','right':'bed','wall':'art','left':None}}}
  ctx.add_init_script("localStorage.setItem('eumo-tour-v1','seen');if(!localStorage.getItem('loop-pet-soft-universe-v1'))localStorage.setItem('loop-pet-soft-universe-v1',"+json.dumps(json.dumps(seed))+")")
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url+'/#home')
  expect(page.locator('.home-shop')).to_be_hidden()
  page.locator('#visitFriendsButton').click();expect(page.locator('#homeFriendsDialog')).to_be_visible();expect(page.locator('#home')).to_be_visible();expect(page.locator('#wardrobe')).to_be_hidden()
  expect(page.locator('#homeFriendsList .home-friend-row')).to_have_count(0);page.locator('#closeHomeFriends').click()
  assert page.evaluate("state.home.slots.right==='bed'&&state.home.slots.wall==='art'")
  page.wait_for_function("PixelArt.getBounds('homeCanvas')!==null")
  point=page.evaluate("()=>{const r=document.getElementById('homeCanvas').getBoundingClientRect(),b=PixelArt.getBounds('homeCanvas');return {x:r.left+(b.x+b.w/2)*r.width/640,y:r.top+(b.y+b.h/2)*r.height/360}}")
  page.mouse.click(point['x'],point['y']);expect(page.locator('#homeSpeech')).to_be_visible()

  page.locator('#openChestButton').click();expect(page.locator('#chestDialog')).to_be_visible();page.keyboard.press('Escape')
  page.locator('#editHomeButton').click();expect(page.locator('[data-slot]')).to_have_count(8)
  page.locator('[data-slot="study"]').click();page.locator('[data-home-item="desk"]').click()
  assert page.evaluate("state.home.slots.study==='desk'&&state.balance===85")
  page.locator('[data-slot="bedWall"]').click();page.locator('[data-home-item="art"]').click()
  assert page.evaluate("state.home.slots.bedWall==='art'&&state.home.slots.wall===null")
  page.screenshot(path=str(ROOT/'docs/images/eumo-burrow-decorate.png'))
  page.locator('#editHomeButton').click();page.reload();assert page.evaluate("state.home.slots.study==='desk'&&state.home.slots.bedWall==='art'")
  page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(250)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('.home-stage').evaluate('e=>e.scrollLeft=e.scrollWidth');page.locator('#openChestButton').click();expect(page.locator('#chestDialog')).to_be_visible();page.keyboard.press('Escape')
  page.screenshot(path=str(ROOT/'docs/images/eumo-burrow-mobile.png'))
  page.goto(url+'/dist/Eumo.html#home');ctx.set_offline(True);page.locator('#editHomeButton').click();page.locator('[data-slot="studyWall"]').click();page.locator('[data-home-item="art"]').click()
  assert page.evaluate("state.home.slots.studyWall==='art'")
  assert not errors,errors;b.close();print('PASS: existing decor preserved, eight slots, room placement/purchase, reload, chest hit target on mobile and offline decorating.')
finally:proc.terminate();proc.wait()
