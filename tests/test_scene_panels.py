"""Scene-first UI: transient drawers preserve purchases, placement and session rules."""
import json, os, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
KEY='loop-pet-soft-universe-v1'

def run():
 proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True)
 url=proc.stdout.readline().strip().split('Eumo: ')[1]
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
   page=browser.new_page(viewport={'width':1440,'height':960});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   seed={'profile':{'name':'Luka','color':'#b784cf','configured':True},'balance':250,'owned':['hat','glasses','star'],'equipped':['hat','glasses'],'inventory':[4,4,4,4],'progressVersion':2,'home':{'owned':['rug','bed','desk','art'],'slots':{'left':'desk','right':'bed','wall':'art','floor':'rug'}}}
   page.add_init_script("if(!localStorage.getItem('%s'))localStorage.setItem('%s',%s);localStorage.setItem('eumo-tour-v1','seen');"%(KEY,KEY,json.dumps(json.dumps(seed))))
   page.goto(url+'/#home');page.wait_for_function("PixelArt.getBounds('homeCanvas')!==null")
   expect(page.locator('#homeDrawer')).to_be_hidden();expect(page.locator('#goldenDisplayBar')).to_be_hidden()
   page.screenshot(path=str(ROOT/'docs/images/eumo-home-display.png'),full_page=True)
   before=page.evaluate('JSON.stringify(state.home)');balance=page.evaluate('state.balance')
   page.locator('#editHomeButton').click();expect(page.locator('#homeDrawer')).to_be_visible();expect(page.locator('#closeHomeDrawer')).to_be_focused()
   assert page.evaluate('JSON.stringify(state.home)')==before and page.evaluate('state.balance')==balance
   page.keyboard.press('Escape');expect(page.locator('#homeDrawer')).to_be_hidden();expect(page.locator('#editHomeButton')).to_be_focused()
   # Existing buy-and-place semantics, including no charge for placing an owned item.
   page.locator('#editHomeButton').click();cost=page.evaluate("HomeCatalog.items.find(x=>x.id==='lamp').cost")
   page.locator('[data-home-item="lamp"]').click();assert page.evaluate('state.balance')==balance-cost
   assert page.evaluate('state.home.slots.left')=='lamp'
   page.locator('#homeEditor').evaluate('e=>e.scrollTop=0');page.wait_for_timeout(200)
   page.screenshot(path=str(ROOT/'docs/images/eumo-home-decor-panel.png'),full_page=True)
   page.locator('#closeHomeDrawer').click();page.locator('#openChestShortcut').click();expect(page.locator('#chestDialog')).to_be_visible();page.keyboard.press('Escape')
   page.locator('[data-page="focus"]').click();page.locator('#startButton').click();session=page.evaluate('state.session.id')
   page.locator('[data-page="home"]').click();page.locator('#editHomeButton').click();assert page.evaluate('state.session.status')=='paused'
   page.keyboard.press('Escape');assert page.evaluate('state.session.status')=='paused' and page.evaluate('state.session.id')==session
   page.locator('[data-page="focus"]').click();page.locator('#stopButton').click();page.locator('#confirmStop').click()
   # Visible categories open a drawer; browsing and closing never spends stars.
   page.locator('[data-page="wardrobe"]').click();expect(page.locator('#wardrobeDrawer')).to_be_hidden();page.wait_for_timeout(160)
   page.screenshot(path=str(ROOT/'docs/images/eumo-wardrobe-display.png'),full_page=True)
   balance=page.evaluate('state.balance');page.locator('[data-category="extras"]').click();expect(page.locator('#wardrobeDrawer')).to_be_visible();assert page.evaluate('state.balance')==balance
   page.locator('[data-item="heartpin"]').click();cost=page.evaluate("WardrobeCatalog.items.find(x=>x.id==='heartpin').cost")
   assert page.evaluate('state.balance')==balance-cost;assert page.evaluate("state.equipped.includes('heartpin')")
   page.locator('[data-item="heartpin"]').click();assert page.evaluate('state.balance')==balance-cost;assert not page.evaluate("state.equipped.includes('heartpin')")
   page.locator('[data-item="heartpin"]').click();assert page.evaluate('state.balance')==balance-cost
   page.wait_for_timeout(200)
   page.screenshot(path=str(ROOT/'docs/images/eumo-wardrobe-items-panel.png'),full_page=True)
   page.keyboard.press('Escape');expect(page.locator('[data-category="extras"]')).to_be_focused()
   page.locator('[data-filter="owned"]').click();expect(page.locator('[data-item="heartpin"]')).to_be_visible();expect(page.locator('[data-item="moonpin"]')).to_have_count(0)
   page.locator('[data-category="tools"]').click();page.locator('#browseAll').click();expect(page.locator('[data-filter="all"]')).to_have_attribute('aria-expanded','true');expect(page.locator('[data-filter="owned"]')).to_have_attribute('aria-expanded','false');expect(page.locator('[data-tool]')).to_have_count(6)
   page.locator('[data-page="home"]').click();page.locator('[data-page="wardrobe"]').click();expect(page.locator('#wardrobeDrawer')).to_be_hidden()
   page.reload();assert page.evaluate("state.equipped.includes('heartpin')") and page.evaluate('state.home.slots.left')=='lamp'
   # Both sides remain visible in wide layouts, all controls fit narrow layouts.
   for width,height in [(1440,960),(1024,640),(768,900),(390,844),(320,640)]:
    page.set_viewport_size({'width':width,'height':height})
    for route,trigger,drawer,close,canvas,ratio in [('home','#editHomeButton','#homeDrawer','#closeHomeDrawer','#homeCanvas',4/3),('wardrobe','[data-filter="all"]','#wardrobeDrawer','#closeWardrobeDrawer','#wardrobeCanvas',1.2)]:
     page.evaluate('(route)=>navigateTo(route)',route);page.locator(trigger).click();page.wait_for_timeout(200)
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,route)
     box=page.locator(canvas).bounding_box();assert box['width']>100 and box['height']>100 and abs(box['width']/box['height']-ratio)<.01,(width,route,box)
     panel=page.locator(drawer).bounding_box();assert panel['x']>=0 and panel['x']+panel['width']<=width+1,(width,route,panel)
     if width>800:assert box['x']+box['width']<=panel['x']+1
     page.locator(close).click();expect(page.locator(drawer)).to_be_hidden()
   page.evaluate("EumoI18n.set('zh')");page.locator('[data-filter="owned"]').click();expect(page.locator('[data-filter="owned"]')).to_have_text('我的物品');expect(page.locator('#closeWardrobeDrawer')).to_have_attribute('aria-label','收起物品面板')
   page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200);page.screenshot(path=str(ROOT/'docs/images/eumo-scene-mobile.png'),full_page=True)
   page.locator('[data-page="focus"]').click();expect(page.locator('#simpleViewButton .visibility-eye-open')).to_be_visible();page.locator('#simpleViewButton').click();expect(page.locator('#simpleViewButton .visibility-eye-closed')).to_be_visible();page.locator('#simpleViewButton').click()
   page.emulate_media(reduced_motion='reduce');page.locator('[data-page="home"]').click();page.locator('#editHomeButton').click();assert page.locator('#homeDrawer').evaluate('e=>getComputedStyle(e).animationName')=='none'
   # Offline uses the same panel and remains navigable without a server.
   offline=browser.new_page();offline.add_init_script("localStorage.setItem('%s',%s)"%(KEY,json.dumps(json.dumps(seed))));offline.goto(url+'/dist/Eumo.html');offline.context.set_offline(True)
   offline.evaluate("navigateTo('wardrobe')");offline.locator('[data-category="hats"]').click();expect(offline.locator('#wardrobeDrawer')).to_be_visible()
   assert not errors,errors;browser.close();print('PASS: scene-first home/wardrobe; drawer focus/Escape; no spending on browse; exact purchase/equip/placement; pause semantics; persisted cosmetics; desktop/mobile geometry; translated panels; eye toggle; reduced motion; offline.')
 finally:proc.terminate();proc.wait()
if __name__=='__main__':run()
