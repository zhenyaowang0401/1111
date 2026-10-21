"""Readable layout, daily return to surface, device clock and distinct geology."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from datetime import datetime,timezone
import json,os,shutil
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
KEY='loop-pet-soft-universe-v1'

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
   context=browser.new_context(timezone_id='Asia/Shanghai',viewport={'width':1920,'height':1080});page=context.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)));url=f'http://127.0.0.1:{server.server_port}'
   page.clock.install(time=datetime(2026,10,22,1,tzinfo=timezone.utc))
   seed={'profile':{'name':'Momo','color':'#b784cf','configured':True},'depth':42,'surfaceDepth':12,'digDay':'2026-10-22','balance':40,'inventory':[2,1,1,1],'progressVersion':2,'reportDays':{'2026-10-22':{'seconds':900}}}
   page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
   page.goto(url+'/#focus');page.wait_for_timeout(180)
   def saved():return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
   expect(page.locator('#depthDisplay')).to_have_text('030');expect(page.locator('#sceneLabel')).to_have_text('Root soil')
   assert page.locator('.app-shell').bounding_box()['width']<=1400
   assert 'Pixelify' not in page.locator('#timeDisplay').evaluate('e=>getComputedStyle(e).fontFamily')
   assert 'Pixelify' not in page.locator('#taskInput').evaluate('e=>getComputedStyle(e).fontFamily')
   page.locator('.footer a').click();expect(page.locator('#setupTitle')).to_have_text('Your mole')
   expect(page.locator('label[for="petName"]')).to_have_text('Mole name');expect(page.locator('.setup-heading .tiny-label')).to_have_text('Mole setup')
   assert page.locator('.preview-caption').count()==0
   page.locator('#cancelSetup').click();page.locator('[data-page="reports"]').click()
   assert saved()['surfaceDepth']==12,'Viewing reports must not reset the mine'
   expect(page.locator('#finishTodayButton')).to_have_text('Finish ✓');assert page.locator('#exportButton').count()==0
   assert page.locator('#finishTodayButton').bounding_box()['height']>=54
   assert page.locator('#trendChart svg').evaluate('e=>Math.abs(e.viewBox.baseVal.width-e.getBoundingClientRect().width)')<3
   page.locator('[data-page="focus"]').click();page.locator('#taskInput').fill('Read notes');page.locator('#startButton').click();page.clock.fast_forward(300000)
   page.locator('[data-page="reports"]').click();page.locator('#finishTodayButton').click();page.locator('#continueButton').click()
   assert saved()['surfaceDepth']==12 and saved()['session'] is not None
   page.locator('#finishTodayButton').click();page.locator('#confirmStop').click()
   expect(page.locator('#todayDialog')).to_be_visible();expect(page.locator('#todaySummaryTasks')).to_contain_text('Read notes')
   expect(page.locator('#todaySummaryTime')).to_contain_text('20m')
   after=saved();assert after['depth']>=52 and after['surfaceDepth']==12 and after['balance']==41
   page.locator('#closeTodayButton').click();assert saved()['surfaceDepth']==saved()['depth'];expect(page.locator('#focus')).to_be_visible();expect(page.locator('#depthDisplay')).to_have_text('000')
   page.wait_for_timeout(180);assert page.evaluate("PixelArt.getBounds('miningCanvas').y")<30,'Mole must stand on the surface, not underground'
   eye=page.locator('#miningCanvas').evaluate("""c=>{const b=PixelArt.getBounds('miningCanvas'),d=c.getContext('2d').getImageData(b.x+16,b.y+31,4,6).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]===40&&d[i+1]===33&&d[i+2]===76)n++;return n;}""")
   assert 0<eye<=16,('Eyes must be smaller',eye)
   page.screenshot(path=str(ROOT/'docs/images/eumo-surface.png'),full_page=True)
   page.reload();expect(page.locator('#depthDisplay')).to_have_text('000');assert saved()['balance']==41 and saved()['inventory']==after['inventory']
   page.locator('#demoButton').click();page.locator('#startButton').click();page.clock.fast_forward(16000)
   expect(page.locator('#finishStars')).to_have_text('+1 ✦');page.locator('#claimButton').click();expect(page.locator('#depthDisplay')).to_have_text('005')
   assert saved()['balance']==42 and sum(saved()['inventory'])==sum(after['inventory'])+1
   lifetime=saved()['depth'];page.clock.fast_forward(86400000);expect(page.locator('#depthDisplay')).to_have_text('000')
   assert saved()['depth']==lifetime and saved()['balance']==42 and saved()['digDay']=='2026-10-23'
   assert page.locator('#deviceTime').get_attribute('datetime').startswith('2026-10-23'),'Clock date must advance even at the same wall-clock minute'
   # Reproduce the invisible/stale underground canvas: animation hidden and
   # RAF throttled. Finish must restore and repaint the real surface immediately.
   page.evaluate('state.surfaceDepth=0;renderTimer();');page.clock.run_for(250)
   old_image=page.locator('#miningCanvas').evaluate('c=>c.toDataURL()')
   page.locator('#simpleViewButton').click();page.evaluate('window.requestAnimationFrame=()=>0');page.clock.run_for(250)
   page.locator('[data-page="reports"]').click();page.locator('#finishTodayButton').click();page.locator('#closeTodayButton').click()
   expect(page.locator('.arcade-machine')).to_be_visible();expect(page.locator('#mineStatus')).to_have_text('Surface')
   assert page.evaluate("PixelArt.getBounds('miningCanvas').y")<30
   assert page.locator('#miningCanvas').evaluate('c=>c.toDataURL()')!=old_image
   assert saved()['depth']==lifetime and saved()['balance']==42 and not saved()['simpleView']
   page.reload();expect(page.locator('#depthDisplay')).to_have_text('000');expect(page.locator('.arcade-machine')).to_be_visible()
   # Closing the daily report via Escape also returns to Focus, with saved totals.
   page.locator('[data-page="reports"]').click();page.locator('#finishTodayButton').click();page.keyboard.press('Escape');expect(page.locator('#focus')).to_be_visible()
   # An active session crossing midnight stays intact until it ends.
   cross=browser.new_context(timezone_id='Asia/Shanghai');cp=cross.new_page();cp.clock.install(time=datetime(2026,10,22,15,58,tzinfo=timezone.utc))
   cp.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',JSON.stringify({{profile:{{name:'Night',color:'#b784cf',configured:true}},depth:20,surfaceDepth:0,digDay:'2026-10-22',minutes:5,progressVersion:2}}));")
   cp.goto(url);cp.locator('#startButton').click();cp.clock.fast_forward(121000)
   assert cp.evaluate('state.session!==null&&state.surfaceDepth===0')
   cp.clock.fast_forward(180000);expect(cp.locator('#finishDialog')).to_be_visible();cp.locator('#claimButton').click();expect(cp.locator('#depthDisplay')).to_have_text('000')
   assert cp.evaluate("state.depth>=30&&Math.abs(state.reportDays['2026-10-22'].seconds-120)<1&&Math.abs(state.reportDays['2026-10-23'].seconds-180)<1")
   cross.close()
   # Device-local wall clock: minute boundary in two zones, plus UK DST rollback.
   for zone,iso,before,end in [('Asia/Shanghai','2026-10-21T18:59:58+00:00','02:59','03:00'),('America/Los_Angeles','2026-10-21T18:59:58+00:00','11:59','12:00'),('Europe/London','2026-10-25T00:59:58+00:00','01:59','01:00')]:
    ctx=browser.new_context(timezone_id=zone);clock=ctx.new_page();clock.clock.install(time=datetime.fromisoformat(iso));clock.goto(url)
    expect(clock.locator('#setupTime')).to_have_text(before);clock.clock.fast_forward(3000);expect(clock.locator('#setupTime')).to_have_text(end)
    clock.locator('#enterGame').click();expect(clock.locator('#deviceTime')).to_have_text(end);expect(clock.locator('#deviceTime')).to_have_attribute('title','Device time · '+zone)
    assert clock.locator('#deviceTime').inner_text()==clock.evaluate("new Date().toTimeString().slice(0,5)")
    ctx.close()
   # Each material has a distinct actual palette/texture, not just a label.
   counts=[]
   for depth in [20,270,330,420,540,660,800]:
    page.evaluate('(depth)=>{state.surfaceDepth=0;state.depth=depth;renderTimer();}',depth);page.clock.run_for(250)
    counts.append(page.locator('#miningCanvas').evaluate("c=>{const b=PixelArt.getBounds('miningCanvas'),d=c.getContext('2d').getImageData(0,Math.min(200,Math.round(b.y+50)),130,24).data,h={};for(let i=0;i<d.length;i+=4){const k=[d[i],d[i+1],d[i+2]].join(',');h[k]=(h[k]||0)+1;}return Object.entries(h).sort((a,b)=>b[1]-a[1]).slice(0,4).map(a=>a[0]).join(';');}"))
    if depth in [20,330,540]:page.screenshot(path=str(ROOT/f'docs/images/eumo-layer-{depth}.png'),full_page=True)
   assert len(set(counts))==7,counts
   for width,height in [(320,844),(390,844),(768,900),(1440,900),(2048,1152)]:
    page.set_viewport_size({'width':width,'height':height})
    for route in ['focus','home','reports','wardrobe','companions']:
     page.locator(f'[data-page="{route}"]').click();assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,route)
   # Verify the downloadable single-file build with networking disabled too.
   offline_context=browser.new_context();offline=offline_context.new_page()
   offline.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',JSON.stringify({{profile:{{name:'Local',configured:true,color:'#b784cf'}},depth:90,balance:7,progressVersion:2}}));")
   offline.goto(url+'/dist/Eumo.html');offline.wait_for_timeout(250);offline_context.set_offline(True)
   offline.locator('#simpleViewButton').click();offline.evaluate('window.requestAnimationFrame=()=>0');offline.wait_for_timeout(250)
   offline.locator('[data-page="reports"]').click();offline.locator('#finishTodayButton').click();offline.locator('#closeTodayButton').click()
   expect(offline.locator('.arcade-machine')).to_be_visible();expect(offline.locator('#mineStatus')).to_have_text('Surface')
   assert offline.evaluate("PixelArt.getBounds('miningCanvas').y")<30
   assert offline.evaluate("state.depth===90&&state.surfaceDepth===90&&state.balance===7&&!state.simpleView")
   offline_context.close()
   assert not errors,errors
   browser.close();print('PASS: larger layouts and readable timer/text; mole setup copy; Finish without export; surface return with preserved lifetime rewards, reload, Escape and next day; midnight-active sessions preserved; 3 device timezones + minute/DST changes; smaller real eyes; seven distinct terrain renders; responsive pages.')
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
