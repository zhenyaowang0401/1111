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
     info=page.evaluate("""()=>({viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],items:Object.fromEntries(['.header','.arcade-machine','.control-panel','#timeDisplay','#startButton','#simpleViewButton','#moleDialogueSpace','.mole-chat-window','#moleChatContent','#moleChatInput','.chat-send-button','#taskInput','.mission-stats','.footer',...(document.querySelector('#stopButton').hidden?[]:['#stopButton'])].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,{top:r.top,bottom:r.bottom,left:r.left,right:r.right}]})),canvasRatio:(()=>{const r=document.querySelector('#miningCanvas').getBoundingClientRect();return r.width/r.height})()})""")
     assert info['scroll'][0]<=width,(dpr,mode,width,height,'horizontal',info)
     assert info['scroll'][1]<=height+1,(dpr,mode,width,height,'vertical',info)
     for selector,r in info['items'].items():assert r['top']>=0 and r['bottom']<=height+1 and r['right']<=width+1,(dpr,mode,width,height,selector,r)
     left=info['items']['.arcade-machine'];right=info['items']['.control-panel'];reserve=info['items']['#moleDialogueSpace']
     assert abs(left['top']-right['top'])<1 and abs(left['bottom']-right['bottom'])<1,(dpr,mode,width,height,'panels must align',info)
     assert reserve['bottom']-reserve['top']>=108 and reserve['top']>left['top'],('dialogue reserve',info)
     left_width=left['right']-left['left'];right_width=right['right']-right['left']
     if right_width>271:assert abs(left_width/right_width-2.55)<.02,('panel ratio',info)
     chat=info['items']['.mole-chat-window']
     for selector in ['#moleChatContent','#moleChatInput','.chat-send-button']:
      r=info['items'][selector];assert r['left']>=chat['left'] and r['right']<=chat['right']+1 and r['bottom']<=chat['bottom'],('chat overflow',selector,info)
     if height>800:
      assert info['items']['#timeDisplay']['top']-info['items']['#taskInput']['bottom']<=40,('timer top gap',info)
      end=info['items'].get('#stopButton',info['items']['#startButton'])
      assert info['items']['.mission-stats']['top']-end['bottom']<=24,('timer bottom gap',info)
     assert abs(info['canvasRatio']-384/224)<.01,info
     assert page.locator('#timeDisplay').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=44
    for width,height in views:
     page.set_viewport_size({'width':width,'height':height});check('idle',width,height)
     page.locator('#taskInput').fill('Read notes');page.locator('#startButton').click();check('running',width,height)
     expect(page.locator('#chatMoleName')).to_have_text('Yami');expect(page.locator('#moleChatInput')).to_be_disabled()
     page.locator('#toggleMoleChat').click();expect(page.locator('#moleChatContent')).to_be_hidden();expect(page.locator('#toggleMoleChat')).to_have_attribute('aria-expanded','false')
     expect(page.locator('#timerLabel')).to_have_text('Running')
     page.locator('#toggleMoleChat').focus();page.keyboard.press('Enter');expect(page.locator('#moleChatContent')).to_be_visible();expect(page.locator('#toggleMoleChat')).to_have_attribute('aria-expanded','true')
     page.locator('#startButton').click();check('paused',width,height)
     if width==1680 and dpr==1.5:page.screenshot(path=str(ROOT/'docs/images/eumo-fit-desktop.png'),full_page=True)
     page.locator('#stopButton').click();page.locator('#confirmStop').click()
    ctx.close()
   # Narrow screens retain usable window controls without horizontal overflow.
   mobile=browser.new_page();mobile.goto(url)
   for width in [320,390,768]:
    mobile.set_viewport_size({'width':width,'height':844})
    if mobile.locator('#setupScreen').is_visible():mobile.locator('#enterGame').click()
    expect(mobile.locator('#moleChatContent')).to_be_visible()
    assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
    mobile.locator('#toggleMoleChat').click();expect(mobile.locator('#moleChatContent')).to_be_hidden();mobile.locator('#toggleMoleChat').click()
   mobile.set_viewport_size({'width':390,'height':844});mobile.screenshot(path=str(ROOT/'docs/images/eumo-chat-mobile.png'),full_page=True)
   # The same window works from the bundled download with network disabled.
   offline=browser.new_context();download=offline.new_page();download.goto(url+'/dist/Eumo.html');download.locator('#enterGame').click();offline.set_offline(True)
   download.locator('#toggleMoleChat').click();expect(download.locator('#moleChatContent')).to_be_hidden();download.locator('#toggleMoleChat').click();expect(download.locator('#moleChatContent')).to_be_visible();offline.close()
   assert not errors,errors
   browser.close();print('PASS: 13 desktop viewport/DPI combinations at browser 100%; idle/running/paused; full canvas, timer, Start/End and bottom controls + footer visible without page scrolling; aligned 2.55:1 panels; inset chat, keyboard collapse/expand without pausing, no premature sending, mobile/offline UI, compact timer gaps; undistorted canvas and readable digits.')
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
