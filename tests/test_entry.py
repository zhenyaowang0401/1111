"""Regression: START must work inside an iframe without allow-forms."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser'),args=['--no-sandbox'])
   url=f'http://127.0.0.1:{server.server_port}/index.html'
   for permissions in ['allow-scripts','allow-scripts allow-same-origin']:
    context=browser.new_context();page=context.new_page();messages=[];errors=[]
    page.on('console',lambda m:messages.append(m.text));page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(f'<iframe id="preview" sandbox="{permissions}" src="{url}" width="1200" height="1000"></iframe>')
    app=page.frame_locator('#preview')
    expect(app.locator('#setupScreen')).to_be_visible()
    app.locator('#petName').fill('');app.locator('#enterGame').click()
    expect(app.locator('#nameError')).to_have_text('Enter a pet name.')
    app.locator('#petName').fill('团团');app.locator('[data-color="#a9b4c6"]').click()
    app.locator('#enterGame span').click() # Includes clicks on the START arrow.
    expect(app.locator('#setupScreen')).to_be_hidden();expect(app.locator('#gameShell')).to_be_visible()
    expect(app.locator('#focus')).to_be_visible();expect(app.locator('#minePetName')).to_have_text('团团')
    app.locator('[data-page="companions"]').click();expect(app.locator('#companions')).to_be_visible()
    app.locator('[data-friend="yun"]').click();expect(app.locator('#friend-detail-yun')).to_be_visible()
    app.locator('[data-page="reports"]').click();expect(app.locator('#reports')).to_be_visible()
    app.locator('[data-range="30"]').click();expect(app.locator('.chart-point')).to_have_count(30)
    app.locator('.footer a[href="#start"]').click();expect(app.locator('#setupScreen')).to_be_visible()
    app.locator('#petColor').evaluate("e=>e.value='#5473a6'");app.locator('#petColor').dispatch_event('input')
    app.locator('#petName').fill('小鼹鼠');app.locator('#petName').press('Enter')
    expect(app.locator('#reports')).to_be_visible() # Returns to the previous view.
    app.locator('[data-page="focus"]').click();expect(app.locator('#minePetName')).to_have_text('小鼹鼠')
    app.locator('#demoButton').click();app.locator('#startButton').click()
    expect(app.locator('#startText')).to_have_text('Pause')
    assert not any('Blocked form submission' in message for message in messages),messages
    assert not errors,errors
    context.close()
   # Even a host that rejects history updates must not block entering or navigation.
   page=browser.new_page();page.goto(url)
   page.evaluate("()=>{history.pushState=()=>{throw new DOMException('Preview navigation is restricted','SecurityError')};return true;}")
   page.locator('#petName').fill('Pip');page.locator('#enterGame').click()
   expect(page.locator('#focus')).to_be_visible()
   page.locator('[data-page="companions"]').click();expect(page.locator('#companions')).to_be_visible()
   # Flat head: the old left and right ear regions contain no character outline.
   page.locator('.footer a[href="#start"]').click();page.wait_for_timeout(250)
   def ink_pixels(canvas,x,y,w,h):
    return page.locator(canvas).evaluate("""(c,r)=>{const a=c.getContext('2d').getImageData(...r).data;let n=0;for(let i=0;i<a.length;i+=4)if(a[i]===40&&a[i+1]===33&&a[i+2]===76)n++;return n;}""",[x,y,w,h])
   assert ink_pixels('#setupCanvas',90,76,21,9)==0
   assert ink_pixels('#setupCanvas',126,76,21,9)==0
   page.locator('#enterGame').click();page.locator('[data-page="focus"]').click();page.wait_for_timeout(250)
   bounds=page.evaluate("PixelArt.getBounds('miningCanvas')")
   assert ink_pixels('#miningCanvas',bounds['x']+8,bounds['y']+13,14,6)==0
   assert ink_pixels('#miningCanvas',bounds['x']+32,bounds['y']+13,14,6)==0
   page.locator('[data-page="wardrobe"]').click();page.wait_for_timeout(250)
   assert ink_pixels('#wardrobeCanvas',69,38,21,9)==0
   page.locator('[data-page="companions"]').click();page.wait_for_timeout(250)
   assert ink_pixels('#friend-yun',30,22,14,6)==0
   browser.close()
   print('PASS: START click/arrow/Enter with Chinese names in two form-blocked iframe modes; direct navigation when history is blocked; working timer and reports; no blocked form submissions; earless sprites in setup, mine, equipment and companions.')
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
