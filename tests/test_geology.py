"""Two-hour soil threshold, no early viewport preview, and stylized strata."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import os,shutil
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
   page=b.new_page(viewport={'width':1536,'height':730});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}');page.locator('#enterGame').click();page.clock.install()
   page.evaluate("state.minutes=120;state.mode='study';renderTimer();")
   def palette_count(colors):
    return page.locator('#miningCanvas').evaluate("""(c,colors)=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,colorsSet=new Set(colors);let n=0;for(let i=0;i<d.length;i+=4){const k='#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');if(colorsSet.has(k))n++;}return n;}""",colors)
   stone_colors=page.evaluate("Terrain.layers.find(l=>l.id==='stone').soil")
   for depth in [0,120,230,239.999]:
    page.evaluate('(n)=>{state.depth=n;state.surfaceDepth=0;renderTimer();PixelArt.refreshFocus();}',depth)
    expect(page.locator('#sceneLabel')).to_have_text('Surface' if depth==0 else 'Root soil')
    assert palette_count(stone_colors)==0,('Stone visible before 2 hours',depth)
   page.evaluate('state.depth=0;state.surfaceDepth=0;renderTimer();');page.locator('#startButton').click()
   page.clock.fast_forward(7199000);expect(page.locator('#sceneLabel')).to_have_text('Root soil');assert palette_count(stone_colors)==0
   page.clock.fast_forward(2000);expect(page.locator('#finishDialog')).to_be_visible();page.locator('#claimButton').click();page.clock.run_for(250)
   expect(page.locator('#depthDisplay')).to_have_text('240');expect(page.locator('#sceneLabel')).to_have_text('Stone beds')
   assert palette_count(stone_colors)>0
   assert page.evaluate('state.balance===24&&state.inventory.reduce((a,n)=>a+n,0)===12&&state.depth===240')
   page.screenshot(path=str(ROOT/'docs/images/eumo-two-hour-stone.png'),full_page=True)
   # Future strata stay hidden until their own boundary; the palettes differ.
   for depth,name in [(299.99,'Stone beds'),(300,'Sand beds'),(360,'Slate layer'),(480,'Red granite'),(600,'Crystal seams'),(720,'Deep basalt')]:
    assert page.evaluate('(d)=>Terrain.layerAt(d).name',depth)==name
   for depth,name in [(60,'Root soil'),(270,'Stone beds'),(330,'Sand beds')]:
    page.evaluate('(d)=>{state.depth=d;state.surfaceDepth=0;renderTimer();PixelArt.refreshFocus();}',depth)
    expect(page.locator('#sceneLabel')).to_have_text(name)
    page.screenshot(path=str(ROOT/f'docs/images/eumo-soft-layer-{depth}.png'),full_page=True)
   # Finishing the day still returns to soil without spending collected items.
   page.locator('[data-page="reports"]').click();page.locator('#finishTodayButton').click();page.locator('#closeTodayButton').click()
   expect(page.locator('#mineStatus')).to_have_text('Surface');assert palette_count(stone_colors)==0
   assert page.evaluate('state.balance===24&&state.inventory.reduce((a,n)=>a+n,0)===12')
   assert not errors,errors
   b.close();print('PASS: actual 120-minute Study run stays soil through 119:59; no rock-color preview at 0/120/230/239.999m; stone appears at 240m; unchanged 24-star/12-find settlement; later strata and daily return.')
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
