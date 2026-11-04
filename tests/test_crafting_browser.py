"""Real material spending, reserved displays, permanent decor, and offline crafting."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import json, os, shutil
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
KEY='loop-pet-soft-universe-v1'

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
   url=f'http://127.0.0.1:{server.server_port}';errors=[]
   seed={'profile':{'name':'Momo','color':'#b784cf','configured':True},'inventory':[2,4,2,1],'balance':77,'heldItem':'mushroom','owned':['cowcat','glasses'],'equipped':['cowcat','glasses'],'progressVersion':2,'home':{'owned':['rug','bed'],'slots':{'left':'find:mushroom','right':'bed','floor':'rug','wall':None}}}
   page=browser.new_page(viewport={'width':1440,'height':960});page.on('pageerror',lambda e:errors.append(str(e)))
   page.clock.install();page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
   page.goto(url+'/#home')
   def saved():return page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',KEY)
   def open_craft():page.locator('#openCraftingButton').click();expect(page.locator('#craftingDialog')).to_be_visible()
   def close_craft():page.locator('#craftingDialog .dialog-close').click()
   def make(id):
    page.locator(f'[data-craft-item="{id}"]').click();expect(page.locator('#craftConfirmDialog')).to_be_visible()
    page.locator('#confirmCraft').click();expect(page.locator('#craftConfirmDialog')).to_be_hidden();expect(page.locator(f'[data-place-crafted="{id}"]')).to_be_enabled()
   def place(id,slot):
    page.locator(f'[data-place-crafted="{id}"]').click();expect(page.locator('#craftingDialog')).to_be_hidden()
    page.locator(f'[data-slot="{slot}"]').click();page.locator(f'[data-home-item="{id}"]').click()
    assert saved()['home']['slots'][slot]==id
   # Existing star furniture remains distinct; recipe items cannot be bought for free.
   page.locator('#editHomeButton').click();before=saved();page.locator('[data-home-item="mushroomLamp"]').click()
   expect(page.locator('#craftingDialog')).to_be_visible();assert saved()==before
   expect(page.locator('#craftRecipeGrid .craft-card')).to_have_count(5)
   expect(page.locator('[data-recipe="mushroomLamp"] .craft-ingredients')).to_contain_text('2 / 2 spare')
   expect(page.locator('#craftMaterials')).to_contain_text('2 spare · 2 displayed')
   page.screenshot(path=str(ROOT/'docs/images/eumo-crafting.png'),full_page=True)
   # Cancel and Escape do not spend; confirmation is only for this item.
   page.locator('[data-craft-item="mushroomLamp"]').click();page.locator('#cancelCraft').click();assert saved()==before
   page.locator('[data-craft-item="mushroomLamp"]').click();page.keyboard.press('Escape');assert saved()==before
   make('mushroomLamp');after=saved();assert after['inventory']==[2,2,2,1] and after['balance']==77
   assert after['heldItem']=='mushroom' and after['home']['slots']==before['home']['slots']
   expect(page.locator('[data-craft-item="mushroomPlanter"]')).to_be_disabled()
   # Moving an existing room find releases that copy; crafting still reserves the head copy.
   place('mushroomLamp','left');open_craft();make('mushroomPlanter');assert saved()['inventory']==[2,1,2,1]
   place('mushroomPlanter','right');assert saved()['heldItem']=='mushroom'
   # Last copies are consumed, but the collection remains discovered and stars are separate.
   wall_pixels=[]
   for id in ['crystalChime','fossilFrame','starMobile']:
    open_craft();make(id);place(id,'wall');page.wait_for_timeout(180)
    wall_pixels.append(page.locator('#homeCanvas').evaluate("c=>Array.from(c.getContext('2d').getImageData(100,100,52,52).data).join(',')"))
   assert len(set(wall_pixels))==3,'Actual wall art must change'
   final=saved();assert final['inventory']==[0,1,0,0] and final['balance']==77
   assert set(final['foundDiscoveries'])=={'star','mushroom','crystal','fossil'}
   assert len(final['home']['owned'])==7
   page.locator('#editHomeButton').click();page.clock.run_for(3000);page.screenshot(path=str(ROOT/'docs/images/eumo-crafting-home.png'),full_page=True)
   page.reload();expect(page.locator('#heldItemLabel')).to_have_text('On head: Glow mushroom');assert saved()['home']==final['home']
   assert set(saved()['foundDiscoveries'])=={'star','mushroom','crystal','fossil'}
   page.locator('#openCraftingButton').click();expect(page.locator('[data-craft-item]')).to_have_count(0);expect(page.locator('[data-place-crafted]')).to_have_count(5)
   close_craft();page.locator('#openChestButton').click();expect(page.locator('[data-chest-slot="crystal"] .slot-count')).to_have_text('0');page.locator('[data-chest-slot="crystal"]').click();expect(page.locator('[data-hold="crystal"]')).to_have_text('None left');page.locator('#chestCraftButton').click()
   # Replacing furniture and moving owned pieces never spends materials a second time.
   before=saved();place('mushroomLamp','right');assert saved()['home']['slots']['left'] is None
   assert saved()['inventory']==before['inventory'] and saved()['balance']==before['balance']
   page.locator('[data-slot="left"]').click();page.locator('[data-home-item="lamp"]').click();assert saved()['balance']==72
   # Mobile / short window dialogs have reachable controls, scrollable last recipe and no horizontal clipping.
   for width,height in [(320,640),(390,844),(768,600),(1000,550)]:
    page.set_viewport_size({'width':width,'height':height});open_craft()
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,height)
    box=page.locator('#craftingDialog').bounding_box();assert box['height']<=height and box['width']<=width
    assert page.locator('.crafting-body').evaluate('e=>e.scrollWidth<=e.clientWidth')
    page.locator('[data-place-crafted="starMobile"]').scroll_into_view_if_needed();expect(page.locator('[data-place-crafted="starMobile"]')).to_be_in_viewport()
    if width==390:page.screenshot(path=str(ROOT/'docs/images/eumo-crafting-mobile.png'))
    close_craft()
   # Running sessions visibly pause on entry; a later resume cannot spend through an open confirmation.
   page.set_viewport_size({'width':1440,'height':960});page.locator('[data-page="focus"]').click();page.locator('#startButton').click();page.clock.run_for(1200)
   page.locator('[data-page="home"]').click();expect(page.locator('#openCraftingButton')).to_have_text('Pause & craft');open_craft();assert saved()['session']['status']=='paused';close_craft()
   # A separate fresh player exercises not-enough materials and stale confirmation guards.
   fresh=browser.new_page(viewport={'width':390,'height':844});fresh.on('pageerror',lambda e:errors.append(str(e)));fresh.clock.install()
   fseed={'profile':{'configured':True,'name':'Luka'},'inventory':[2,0,1,0],'balance':0,'progressVersion':2}
   fresh.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(fseed))});")
   fresh.goto(url+'/#home');fresh.locator('#openCraftingButton').click()
   expect(fresh.locator('[data-craft-item="crystalChime"]')).to_be_disabled();expect(fresh.locator('[data-recipe="crystalChime"]')).to_contain_text('1 / 2 spare')
   fresh.locator('[data-craft-item="starMobile"]').click()
   # Same start action as the floating companion can invoke, while this modal is open.
   fresh.evaluate("document.querySelector('#startButton').click()")
   fresh.clock.run_for(300);expect(fresh.locator('#confirmCraft')).to_be_disabled()
   before=fresh.evaluate('JSON.stringify(state)');fresh.evaluate("document.querySelector('#confirmCraft').dispatchEvent(new MouseEvent('click',{bubbles:true}))")
   assert fresh.evaluate('JSON.stringify(state)')==before
   fresh.evaluate("document.querySelector('#startButton').click()")
   fresh.clock.run_for(300);expect(fresh.locator('#confirmCraft')).to_be_enabled()
   fresh.evaluate("state.heldItem='star'");fresh.clock.run_for(300);expect(fresh.locator('#confirmCraft')).to_be_disabled()
   fresh.locator('#cancelCraft').click();fresh.locator('#craftingDialog .dialog-close').click();fresh.close()
   # Offline entry contains the recipe UI, art and mutation logic with zero network access.
   context=browser.new_context();offline=context.new_page();offline.on('pageerror',lambda e:errors.append(str(e)))
   offline.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(fseed))});")
   offline.goto(url+'/dist/Eumo.html#home');context.set_offline(True);offline.locator('#openCraftingButton').click();offline.locator('[data-craft-item="starMobile"]').click();offline.locator('#confirmCraft').click()
   result=offline.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',KEY);assert result['inventory'][0]==0 and 'starMobile' in result['home']['owned'] and result['balance']==0
   assert not errors,errors
   context.close();browser.close();print('PASS: confirmed crafting, cancel/Escape, reserved head/room finds, exact costs and stars, no duplicate craft, permanent ownership/placement/reload, discovery history, original furniture, paused/running/stale guards, responsive dialogs, home/chest entry and offline crafting.')
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
