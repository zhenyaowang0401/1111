"""Eumo wardrobe slots, priced tools, game chest and home-only head display."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import json,os,shutil
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
KEY='loop-pet-soft-universe-v1'

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'],ignore_default_args=['--hide-scrollbars'])
   page=browser.new_page(viewport={'width':1440,'height':1050});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   seed={'profile':{'name':'Yami','configured':True,'color':'#b784cf'},'balance':3000,'inventory':[2,1,1,1],'owned':['hat','scarf','glasses','star'],'equipped':['hat','scarf','glasses','star'],'progressVersion':2}
   page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
   url=f'http://127.0.0.1:{server.server_port}';page.goto(url+'/#wardrobe');page.clock.install();page.wait_for_timeout(180)
   expect(page.locator('.header .brand')).to_have_text('Eumo v2');assert page.title()=='Eumo v2 — Equipment'
   def saved():return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
   expect(page.locator('#equippedCount')).to_have_text('4 equipped')
   page.evaluate('document.fonts.ready')
   assert page.evaluate("Array.from(document.fonts).some(f=>f.family==='Pixelify Sans'&&f.status==='loaded')")
   assert page.locator('.rarity-badge').first.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=12
   assert 'Tools change the digging animation' not in page.locator('body').inner_text()
   # Wheel movement stays inside the shop; preview and page stay in place.
   scroll=page.locator('#shopScroll');assert scroll.evaluate('e=>e.scrollHeight>e.clientHeight')
   before=page.locator('.fitting-room').bounding_box();window_y=page.evaluate('scrollY')
   scroll.hover();page.mouse.wheel(0,600);page.wait_for_timeout(250)
   assert scroll.evaluate('e=>e.scrollTop')>100
   assert page.locator('.fitting-room').bounding_box()==before and page.evaluate('scrollY')==window_y
   scroll.evaluate('e=>e.scrollTop=0');box=scroll.bounding_box()
   page.mouse.move(box['x']+box['width']-6,box['y']+25);page.mouse.down()
   page.mouse.move(box['x']+box['width']-6,box['y']+160,steps=12);page.mouse.up();page.wait_for_timeout(150)
   assert scroll.evaluate('e=>e.scrollTop')>50,'Scrollbar must be draggable'
   scroll.focus();page.keyboard.press('Home');page.wait_for_timeout(180)
   page.screenshot(path=str(ROOT/'docs/images/eumo-v2-shop.png'),full_page=True)
   assert page.locator('.wardrobe-layout').bounding_box()['height']<=page.viewport_size['height']

   eyewear_pixels=[]
   for category,count in [('hats',7),('clothes',5),('scarves',5),('glasses',6)]:
    page.locator(f'[data-category="{category}"]').click();expect(page.locator('.outfit-card')).to_have_count(count)
    if category=='hats':page.screenshot(path=str(ROOT/'docs/images/eumo-equipment.png'),full_page=True)
    ids=page.locator('[data-item]').evaluate_all('els=>els.map(e=>e.dataset.item)')
    for id in ids:
     before=saved();button=page.locator(f'[data-item="{id}"]')
     if button.inner_text()!='Remove':button.click()
     if category=='glasses':
      page.wait_for_timeout(120)
      eye=page.locator('#wardrobeCanvas').evaluate("c=>{const d=c.getContext('2d').getImageData(69,56,63,33).data;return Array.from(d).join(',');}")
      eyewear_pixels.append(eye)
     after=saved();active=page.evaluate('(category)=>state.equipped.filter(id=>WardrobeCatalog.items.find(i=>i.id===id).category===category)',category)
     assert active==[id],(category,id,active)
     if id in before['owned']:assert after['balance']==before['balance']
     else:
      price=page.evaluate('(id)=>WardrobeCatalog.items.find(i=>i.id===id).cost',id)
      assert before['balance']-after['balance']==price
   expect(page.locator('#equippedCount')).to_have_text('5 equipped')
   assert len(set(eyewear_pixels))==6,'Glasses should visibly change the actual mole'
   page.screenshot(path=str(ROOT/'docs/images/eumo-v2-glasses.png'),full_page=True)
   assert saved()['balance']==2403
   page.reload();expect(page.locator('#equippedCount')).to_have_text('5 equipped')
   # Real game inventory slots, one selected item tray, no added hands.
   page.locator('[data-page="home"]').click();page.locator('#openChestButton').click()
   expect(page.locator('[data-chest-slot]')).to_have_count(4);expect(page.locator('.empty-slot')).to_have_count(8)
   page.locator('[data-chest-slot="fossil"]').click();page.locator('[data-hold="fossil"]').click()
   expect(page.locator('#heldItemLabel')).to_have_text('On head: Spiral fossil')
   before=saved()['inventory'];page.reload();assert saved()['inventory']==before
   def pixels(canvas,color,rect=None):
    rgb=[int(color[i:i+2],16) for i in [1,3,5]]
    return page.locator(canvas).evaluate("""(c,a)=>{const r=a.rect||[0,0,c.width,c.height],d=c.getContext('2d').getImageData(...r).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]===a.rgb[0]&&d[i+1]===a.rgb[1]&&d[i+2]===a.rgb[2])n++;return n;}""",{'rgb':rgb,'rect':rect})
   page.wait_for_timeout(180);assert pixels('#homeCanvas','#d7b4f0',[160,90,80,130])>0
   page.screenshot(path=str(ROOT/'docs/images/eumo-home.png'),full_page=True)
   page.locator('#openChestButton').click();page.locator('[data-chest-slot="mushroom"]').click();page.screenshot(path=str(ROOT/'docs/images/eumo-chest.png'),full_page=True);page.locator('#chestDoneButton').click()
   page.locator('[data-page="focus"]').click();page.wait_for_timeout(180)
   assert pixels('#miningCanvas','#d7b4f0',[145,0,110,135])==0
   page.locator('[data-page="wardrobe"]').click();page.wait_for_timeout(180);assert pixels('#wardrobeCanvas','#d7b4f0')==0
   # Tools are a separate paid category and never appear on the fitting sprite.
   page.locator('[data-category="tools"]').click();expect(page.locator('[data-tool]')).to_have_count(6);expect(page.locator('[data-item]')).to_have_count(0)
   assert 'pickaxe' not in page.locator('#outfitGrid').inner_text().lower()
   page.screenshot(path=str(ROOT/'docs/images/eumo-tools.png'),full_page=True)
   colors={'spoon':'#b4c8d0','shovel':'#87a8b4','fork':'#a8c2c4','drill':'#d8ae64','jackhammer':'#b998ba','crystaldrill':'#9b8dc4'}
   tool_images=[]
   for id,color in colors.items():
    page.locator('[data-page="wardrobe"]').click();page.locator('[data-category="tools"]').click()
    balance=saved()['balance'];price=page.evaluate('(id)=>WardrobeCatalog.tools.find(t=>t.id===id).cost',id)
    page.locator(f'[data-tool="{id}"]').click();assert balance-saved()['balance']==price
    expect(page.locator(f'[data-tool="{id}"]')).to_have_text('Using');expect(page.locator('#equippedCount')).to_have_text('5 equipped')
    page.wait_for_timeout(160);assert pixels('#wardrobeCanvas',color)==0,(id,'tool shown as clothing')
    page.locator('[data-page="focus"]').click();page.locator('#demoButton').click();page.locator('#startButton').click()
    positions=set()
    for _ in range(5):
     page.clock.run_for(150)
     rgb=[int(color[i:i+2],16) for i in [1,3,5]]
     v=page.locator('#miningCanvas').evaluate("""(c,rgb)=>{const d=c.getContext('2d').getImageData(0,0,384,224).data;let n=0,x=0,y=0;for(let i=0;i<d.length;i+=4)if(d[i]===rgb[0]&&d[i+1]===rgb[1]&&d[i+2]===rgb[2]){n++;x+=(i/4)%384;y+=Math.floor(i/4/384);}return n?[Math.round(x/n),Math.round(y/n)]:null;}""",rgb)
     assert v is not None,(id,'missing from actual digging sprite');positions.add(tuple(v))
    assert len(positions)>1,(id,'tool not animated',positions)
    tool_images.append(page.locator('#miningCanvas').screenshot())
    page.clock.fast_forward(15000);expect(page.locator('#finishStars')).to_have_text('+1 ✦');page.locator('#claimButton').click()
   assert len(set(tool_images))==6 and saved()['balance']==1749
   page.reload();assert saved()['tool']=='crystaldrill' and len(saved()['ownedTools'])==6
   page.locator('[data-page="wardrobe"]').click();page.locator('[data-category="tools"]').click();page.locator('#resetTool').click();assert saved()['tool'] is None
   # Reusing owned equipment is free, same-category replacement remains free.
   balance=saved()['balance'];page.locator('[data-category="hats"]').click();page.locator('[data-item="bucket"]').click();page.locator('[data-item="crown"]').click();assert saved()['balance']==balance
   page.locator('[data-page="reports"]').click();expect(page.locator('#reportToday')).to_have_text('0m')
   # The canonical standalone carries the font and new store offline.
   offline_context=browser.new_context();offline=offline_context.new_page()
   offline.goto(url+'/dist/Eumo.html');offline_context.set_offline(True)
   offline.locator('#enterGame').click();offline.locator('[data-page="wardrobe"]').click()
   offline.locator('[data-category="glasses"]').click();expect(offline.locator('[data-item]')).to_have_count(6)
   offline.evaluate('document.fonts.ready')
   assert offline.evaluate("Array.from(document.fonts).some(f=>f.family==='Pixelify Sans'&&f.status==='loaded')")
   assert offline.title()=='Eumo v2 — Equipment';offline_context.close()
   # Chest and category shelves fit phones and short landscape windows.
   for width,height in [(320,844),(390,844),(768,900),(1000,600)]:
    page.set_viewport_size({'width':width,'height':height});page.locator('[data-page="home"]').click();page.locator('#openChestButton').click()
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),('chest overflow',width)
    box=page.locator('#chestDialog').bounding_box();assert box['height']<=height,('chest too tall',width,box)
    page.locator('#chestDoneButton').click();page.locator('[data-page="wardrobe"]').click()
    if width==390:page.screenshot(path=str(ROOT/'docs/images/eumo-v2-mobile.png'),full_page=True)
    for cat in ['hats','clothes','scarves','glasses','tools']:
     page.locator(f'[data-category="{cat}"]').click();assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,cat)
   assert not errors,errors
   browser.close();print('PASS: Eumo v2; wheel-scroll shop and stationary preview; readable UI + offline logo font; 7 hats/5 clothes/5 scarves/6 glasses with actual pixels; prices and one-per-category; legacy extras; chest slots; home-only head display; 6 paid animated tools absent from outfit preview; no reward multipliers; ownership/reload; responsive chest and categories.')
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
