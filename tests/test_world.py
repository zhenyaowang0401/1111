"""Pet creation, local device clock, colored sprites and companion preview tests."""
import os
import shutil
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from datetime import datetime,timezone,timedelta
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
LOCAL=timezone(timedelta(hours=8))

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser'),args=['--no-sandbox'])
   context=browser.new_context(timezone_id='Asia/Shanghai',viewport={'width':1440,'height':1000})
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   url=f'http://127.0.0.1:{server.server_port}'
   page.goto(url+'/#reports')
   page.clock.install(time=datetime(2026,10,20,12,tzinfo=LOCAL))
   expect(page.locator('#setupScreen')).to_be_visible();expect(page.locator('#gameShell')).to_be_hidden()
   expect(page.locator('.color-swatch')).to_have_count(12)
   expect(page.locator('.color-swatch.selected')).to_have_count(1)
   assert page.locator('#enterGame').bounding_box()['height']>=58
   page.locator('#petName').fill('');page.locator('#enterGame').click()
   expect(page.locator('#nameError')).to_have_text('Enter a mole name.')
   expect(page.locator('#setupScreen')).to_be_visible()
   page.locator('#petName').fill('<Pip>')
   expect(page.locator('#previewPetName')).to_have_text('<Pip>')
   assert page.locator('#previewPetName *').count()==0
   page.locator('#petName').fill('Pip')
   def pixels(selector,hex):
    rgb=[int(hex[i:i+2],16) for i in [1,3,5]]
    return page.locator(selector).evaluate("""(c,rgb)=>{const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<p.length;i+=4)if(p[i]===rgb[0]&&p[i+1]===rgb[1]&&p[i+2]===rgb[2])n++;return n;}""",rgb)
   for hex in ['#e78ab6','#7dcbb4','#85bcea','#e9c868']:
    page.locator(f'[data-color="{hex}"]').click();page.wait_for_timeout(200)
    assert pixels('#setupCanvas',hex)>80,'Changing a preset must recolor the actual pixel sprite'
   page.locator('[data-color="#7dcbb4"]').focus();page.keyboard.press('Enter')
   expect(page.locator('[data-color="#7dcbb4"]')).to_have_attribute('aria-pressed','true')
   page.locator('#petColor').evaluate("e=>e.value='#ff9933'");page.locator('#petColor').dispatch_event('input');page.wait_for_timeout(200)
   expect(page.locator('#selectedColorName')).to_have_text('Custom')
   expect(page.locator('#colorHex')).to_have_text('#FF9933')
   assert pixels('#setupCanvas','#ff9933')>80
   page.locator('#enterGame').click()
   expect(page.locator('#reports')).to_be_visible() # A first-time deep link must resume after setup.
   page.locator('[data-page="focus"]').click();page.wait_for_timeout(200)
   expect(page.locator('#minePetName')).to_have_text('Pip')
   assert pixels('#miningCanvas','#ff9933')>30
   expect(page.locator('#deviceTime')).to_have_text('12:00')
   assert 'Asia/Shanghai' in page.locator('#deviceTime').get_attribute('title')
   # An actual completed demo verifies that profile edits preserve gameplay state.
   page.locator('#demoButton').click();page.locator('#startButton').click();page.clock.fast_forward(16000);page.locator('#claimButton').click()
   expect(page.locator('#totalDepth')).to_have_text('5');expect(page.locator('#balance')).to_have_text('1')
   page.locator('.footer a[href="#start"]').click();page.locator('#petName').fill('Unsaved')
   page.locator('[data-color="#85bcea"]').click();page.locator('#cancelSetup').click()
   expect(page.locator('#minePetName')).to_have_text('Pip')
   page.locator('.footer a[href="#start"]').click();page.locator('#petName').fill('Nova');page.locator('[data-color="#7dcbb4"]').click();page.locator('#enterGame').click()
   page.wait_for_timeout(200);expect(page.locator('#minePetName')).to_have_text('Nova')
   expect(page.locator('#totalDepth')).to_have_text('5');expect(page.locator('#balance')).to_have_text('1')
   assert pixels('#miningCanvas','#7dcbb4')>30
   page.reload();page.wait_for_timeout(200)
   expect(page.locator('#minePetName')).to_have_text('Nova');expect(page.locator('#totalDepth')).to_have_text('5')
   page.locator('[data-page="wardrobe"]').click();page.wait_for_timeout(200)
   expect(page.locator('#equipmentPetName')).to_have_text('Nova');assert pixels('#wardrobeCanvas','#7dcbb4')>50
   page.locator('[data-page="focus"]').click()
   # The displayed device clock, page background and actual sky pixels agree.
   backgrounds=set()
   for hour,period,sky in [(7,'morning','#c2b9d6'),(12,'day','#83b8d5'),(18,'evening','#ae809b'),(22,'night','#171c48')]:
    page.clock.set_system_time(datetime(2026,10,20,hour,tzinfo=LOCAL));page.wait_for_timeout(300)
    expect(page.locator('body')).to_have_attribute('data-period',period)
    expect(page.locator('#deviceTime')).to_have_text(f'{hour:02}:00')
    actual=page.locator('#miningCanvas').evaluate("c=>[...c.getContext('2d').getImageData(0,0,1,1).data].slice(0,3)")
    assert actual==[int(sky[i:i+2],16) for i in [1,3,5]],(period,actual)
    backgrounds.add(page.locator('body').evaluate('e=>getComputedStyle(e).backgroundColor'))
   assert len(backgrounds)==4
   page.clock.set_system_time(datetime(2026,10,20,5,59,50,tzinfo=LOCAL));page.wait_for_timeout(300)
   expect(page.locator('body')).to_have_attribute('data-period','night')
   page.clock.fast_forward(11000);page.wait_for_timeout(200)
   expect(page.locator('body')).to_have_attribute('data-period','morning')
   expect(page.locator('#deviceTime')).to_have_text('06:00')
   # Four visible sample players, independently colored sprites and expandable loot.
   page.locator('[data-page="companions"]').click();page.wait_for_timeout(250)
   expect(page.locator('.friend-card')).to_have_count(4)
   expect(page.locator('.sample-badge')).to_have_text('4 sample players')
   for id,name,color in [('luka','Luka','#efa77c'),('yun','Yun','#7dcbb4'),('daniel','Daniel','#85bcea'),('selina','Selina','#e78ab6')]:
    expect(page.locator(f'[data-friend="{id}"]')).to_contain_text(name)
    assert pixels('#friend-'+id,color)>10,(id,'colored sprite missing')
    page.locator(f'[data-friend="{id}"]').click()
    expect(page.locator('#friend-detail-'+id)).to_be_visible()
    expect(page.locator('#friend-detail-'+id+' .friend-item')).to_have_count(4)
    page.locator(f'[data-friend="{id}"]').click()
    expect(page.locator('#friend-detail-'+id)).to_be_hidden()
   expect(page.get_by_role('progressbar',name="Yun's study goal")).to_have_attribute('aria-valuenow','45')
   page.locator('[data-friend="yun"]').click()
   expect(page.locator('#friend-detail-yun .friend-item').nth(1)).to_contain_text('Glow mushroom')
   expect(page.locator('#friend-detail-yun .friend-item').nth(1)).to_contain_text('× 4')
   for width in [320,390,768,1440]:
    page.set_viewport_size({'width':width,'height':900})
    page.locator('.footer a[href="#start"]').click();page.wait_for_timeout(160)
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,'setup')
    page.locator('#enterGame').click()
    for route in ['focus','rewards','wardrobe','reports','companions']:
     page.locator(f'[data-page="{route}"]').click();page.wait_for_timeout(160)
     assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,route)
   # A phone in a different timezone uses that device's wall clock, not server time.
   phone=browser.new_context(is_mobile=True,has_touch=True,viewport={'width':390,'height':844},timezone_id='America/Los_Angeles')
   mobile=phone.new_page();mobile.goto(url)
   mobile.clock.install(time=datetime(2026,10,20,10,tzinfo=timezone.utc));mobile.wait_for_timeout(300)
   expect(mobile.locator('#setupTime')).to_have_text('03:00')
   expect(mobile.locator('body')).to_have_attribute('data-period','night')
   expect(mobile.locator('#setupTime')).to_have_attribute('title','Device time · America/Los_Angeles')
   assert not errors,errors
   print('PASS: mandatory creation, 12 live color presets + custom color, safe naming, deep-link entry, cancel/save/reload, retained depth, local-time sky and UI in four periods, automatic dawn boundary, four distinct companion sprites, study progress and loot expansion, phone timezone, 24 responsive views; no JS errors.')
   browser.close()
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
