"""Supermo: round burrow, interactive chest, visible sleep, terrain and new music."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import os,shutil,json
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
KEY='loop-pet-soft-universe-v1'

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
   page=browser.new_page(viewport={'width':1440,'height':1050});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   seed={'profile':{'name':'Yami','color':'#b784cf','configured':True},'balance':60,'depth':53,'inventory':[2,1,1,1],'progressVersion':2,'home':{'theme':'cave','ownedThemes':['cave'],'owned':['rug','lamp','desk','bed','bookcase','art'],'slots':{'floor':'rug','left':'desk','right':'bed','wall':'art'}}}
   page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
   url=f'http://127.0.0.1:{server.server_port}'
   page.goto(url+'/#home');page.clock.install();page.wait_for_timeout(180)
   expect(page.locator('.header .brand')).to_have_text('Eumo v2');assert page.title()=='Eumo v2 — Home'
   def store():return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
   before=store()['inventory']
   # A real hit target on the pictured chest opens a keyboard-accessible dialog.
   page.locator('#openChestButton').click();expect(page.locator('#chestDialog')).to_be_visible();expect(page.locator('[data-chest-slot]')).to_have_count(4)
   page.locator('[data-chest-slot="mushroom"]').click();page.locator('[data-hold="mushroom"]').click();expect(page.locator('#chestDialog')).to_be_hidden()
   expect(page.locator('#heldItemLabel')).to_have_text('On head: Glow mushroom');assert store()['inventory']==before
   page.reload();expect(page.locator('#heldItemLabel')).to_have_text('On head: Glow mushroom')
   page.wait_for_timeout(180);page.screenshot(path=str(ROOT/'docs/images/eumo-home.png'),full_page=True)
   # Put the held copy on the wall; taking it back out clears that placement.
   page.locator('#editHomeButton').click();page.locator('[data-slot="wall"]').click();page.locator('[data-home-item="find:mushroom"]').click()
   assert store()['heldItem'] is None and store()['home']['slots']['wall']=='find:mushroom'
   page.locator('#editHomeButton').click();page.locator('#openChestButton').click();page.locator('[data-chest-slot="mushroom"]').click();expect(page.locator('[data-hold="mushroom"]')).to_have_text('Take & display')
   page.locator('[data-chest-slot="mushroom"]').click();page.locator('[data-hold="mushroom"]').click();assert store()['home']['slots']['wall'] is None and store()['heldItem']=='mushroom'
   page.locator('#putBackButton').click();assert store()['heldItem'] is None and store()['inventory']==before
   # Exact idle boundaries are visible; pause is a separate rest state.
   page.clock.fast_forward(89900);expect(page.locator('body')).to_have_attribute('data-pet-state','awake')
   page.clock.fast_forward(600);expect(page.locator('body')).to_have_attribute('data-pet-state','drowsy')
   page.clock.fast_forward(210000);expect(page.locator('body')).to_have_attribute('data-pet-state','asleep')
   expect(page.locator('#homeMoodLabel')).to_have_text('Sleeping');page.wait_for_timeout(160)
   def sleep_pixels():
    return page.locator('#homeCanvas').evaluate("""c=>{const p=c.getContext('2d').getImageData(0,0,384,288).data;let top=288,bubble=0;for(let y=180;y<250;y++)for(let x=168;x<228;x++){const i=(y*384+x)*4;if(p[i]===183&&p[i+1]===132&&p[i+2]===207)top=Math.min(top,y);if(p[i]===198&&p[i+1]===236&&p[i+2]===237)bubble++;}return {top,bubble};}""")
   tops=set();bubbles=[]
   for _ in range(10):
    page.clock.run_for(450);v=sleep_pixels();tops.add(v['top']);bubbles.append(v['bubble'])
   assert len(tops)>1,('No visible breathing',tops)
   assert max(bubbles)>0,('No nose bubble',bubbles)
   page.screenshot(path=str(ROOT/'docs/images/eumo-sleep.png'),full_page=True)
   # Waking is a targeted pet, retains the inventory, and starts a jump + voice.
   b=page.evaluate("PixelArt.getBounds('homeCanvas')");r=page.locator('#homeCanvas').bounding_box()
   page.locator('#homeCanvas').click(position={'x':(b['x']+b['w']/2)*r['width']/384,'y':(b['y']+b['h']/2)*r['height']/288})
   expect(page.locator('#homeSpeech')).to_be_visible();page.clock.fast_forward(300);expect(page.locator('body')).to_have_attribute('data-pet-state','awake')
   assert page.evaluate('PetAudio.status().petPattern')=='soft-doo-doo'
   page.locator('#openChestButton').click();page.locator('[data-chest-slot="crystal"]').click();page.locator('[data-hold="crystal"]').click()
   page.locator('[data-page="focus"]').click();page.locator('#demoButton').click();page.locator('#startButton').click();page.clock.fast_forward(2000)
   page.locator('[data-page="home"]').click();page.locator('#openChestButton').click();page.locator('[data-chest-slot="mushroom"]').click();expect(page.locator('[data-hold="mushroom"]')).to_be_disabled()
   page.locator('#chestDoneButton').click();expect(page.locator('#heldItemLabel')).to_have_text('Stored: Stardust crystal')
   page.locator('[data-page="focus"]').click();page.locator('#startButton').click();page.clock.fast_forward(301000)
   expect(page.locator('body')).to_have_attribute('data-pet-state','rest');expect(page.locator('#mineStatus')).to_have_text('Resting')
   page.locator('#startButton').click();page.clock.fast_forward(15000);expect(page.locator('#finishStars')).to_have_text('+1 ✦');page.locator('#claimButton').click()
   page.locator('[data-page="home"]').click();expect(page.locator('#heldItemLabel')).to_have_text('On head: Stardust crystal')
   # The new song loads to its actual duration and survives page navigation.
   page.locator('[data-page="focus"]').click();page.locator('#soundButton').click();page.wait_for_function("document.querySelector('#focusMusic').duration>0")
   actual=page.locator('#focusMusic').evaluate('e=>e.duration');assert abs(actual-194.52)<.2,actual
   page.locator('[data-page="home"]').click();assert page.locator('#focusMusic').evaluate('e=>!e.paused')
   # Pixel-rendered strata are different, not only different HUD labels.
   histograms=[]
   for depth,label in [(5,'Root soil'),(16,'Stone beds'),(32,'Sand beds'),(53,'Slate layer'),(90,'Red granite'),(140,'Crystal seams'),(220,'Deep basalt')]:
    fixture={**seed,'depth':depth};tp=browser.new_page(viewport={'width':1440,'height':1000});tp.add_init_script(f"localStorage.setItem('{KEY}',{json.dumps(json.dumps(fixture))});")
    tp.goto(url+'/#focus');tp.wait_for_timeout(180);expect(tp.locator('#sceneLabel')).to_have_text(label)
    hist=tp.locator('#miningCanvas').evaluate("""c=>{const b=PixelArt.getBounds('miningCanvas'),d=c.getContext('2d').getImageData(0,Math.min(200,Math.round(b.y+50)),130,24).data,h={};for(let i=0;i<d.length;i+=4){const k=[d[i],d[i+1],d[i+2]].join(',');h[k]=(h[k]||0)+1;}return Object.entries(h).sort((a,b)=>b[1]-a[1]).slice(0,5).map(p=>p[0]).join(';');}""")
    histograms.append(hist)
    if depth==53:tp.screenshot(path=str(ROOT/'docs/images/eumo-mine.png'),full_page=True)
    tp.close()
   assert len(set(histograms))==7,histograms
   for width in [320,390,768,1440]:
    page.set_viewport_size({'width':width,'height':1000});page.locator('[data-page="home"]').click();page.locator('#openChestButton').click()
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),('chest',width)
    page.locator('#chestDoneButton').click();page.locator('#editHomeButton').click()
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),('editor',width)
    page.locator('#editHomeButton').click()
   assert not errors,errors
   browser.close();print('PASS: Eumo branding, chest hit target, held/placed quantity preservation and reload, sleep thresholds + actual breathing/bubble pixels + wake, pause versus sleep, held item stowing during demo, new MP3 duration, seven rendered strata, mobile chest/editor.')
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
