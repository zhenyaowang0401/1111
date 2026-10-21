"""Desktop Focus must fit at 100% zoom, including browser chrome/DPI-sized views."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import os,shutil
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
KEY='loop-pet-soft-universe-v1'

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
   errors=[]
   for dpr,views in [(1,[(2560,1320),(2048,1050),(1920,960),(1680,860),(1600,780),(1536,730),(1440,768),(1366,650),(1280,600),(1024,640)]),(1.5,[(1680,860),(1536,730),(1280,600)])]:
    ctx=browser.new_context(device_scale_factor=dpr);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',JSON.stringify({{profile:{{name:'Yami',color:'#b784cf',configured:true}},depth:202,surfaceDepth:202,balance:4,progressVersion:2}}));")
    url=f'http://127.0.0.1:{server.server_port}';page.goto(url+'/#focus')
    def check(mode,width,height):
     page.wait_for_timeout(180)
     info=page.evaluate("""()=>({viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],items:Object.fromEntries(['.header','.arcade-machine','.control-panel','#timeDisplay','#startButton','#simpleViewButton','.footer',...(document.querySelector('#stopButton').hidden?[]:['#stopButton'])].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,{top:r.top,bottom:r.bottom,left:r.left,right:r.right}]})),canvasRatio:(()=>{const r=document.querySelector('#miningCanvas').getBoundingClientRect();return r.width/r.height})()})""")
     assert info['scroll'][0]<=width,(dpr,mode,width,height,'horizontal',info)
     assert info['scroll'][1]<=height+1,(dpr,mode,width,height,'vertical',info)
     for selector,r in info['items'].items():assert r['top']>=0 and r['bottom']<=height+1 and r['right']<=width+1,(dpr,mode,width,height,selector,r)
     assert abs(info['canvasRatio']-384/224)<.01,info
     assert page.locator('#timeDisplay').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=44
    for width,height in views:
     page.set_viewport_size({'width':width,'height':height});check('idle',width,height)
     page.locator('#taskInput').fill('Read notes');page.locator('#startButton').click();check('running',width,height)
     page.locator('#startButton').click();check('paused',width,height)
     if width==1680 and dpr==1.5:page.screenshot(path=str(ROOT/'docs/images/eumo-fit-desktop.png'),full_page=True)
     page.locator('#stopButton').click();page.locator('#confirmStop').click()
    ctx.close()
   assert not errors,errors
   browser.close();print('PASS: 13 desktop viewport/DPI combinations at browser 100%; idle/running/paused; full canvas, timer, Start/End and bottom controls + footer visible without page scrolling; undistorted canvas and readable digits.')
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
