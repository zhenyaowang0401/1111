"""Behavioral regressions for continuous rewards, home, daily closing and audio."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import os, shutil, json
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
KEY='loop-pet-soft-universe-v1'

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
   context=browser.new_context(viewport={'width':1440,'height':1000},timezone_id='Asia/Shanghai')
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   url=f'http://127.0.0.1:{server.server_port}'
   page.goto(url);page.locator('#enterGame').click();page.clock.install()
   page.wait_for_timeout(160);page.screenshot(path=str(ROOT/'docs/images/focus.png'),full_page=True)
   assert page.locator('.nav a').nth(1).get_attribute('data-page')=='home'
   def stored():return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
   def end():
    page.locator('#stopButton').click();page.locator('#confirmStop').click()
   # Partial time survives refresh; paused time is excluded, leftovers carry.
   page.locator('#taskInput').fill('<Read & revise>')
   page.locator('#startButton').click();page.clock.fast_forward(420000)
   page.reload();page.clock.fast_forward(200)
   page.locator('#startButton').click();page.clock.fast_forward(120000);end()
   expect(page.locator('#balance')).to_have_text('1');expect(page.locator('#totalDepth')).to_have_text('14')
   page.locator('#startButton').click();page.clock.fast_forward(180000);end()
   expect(page.locator('#balance')).to_have_text('2');expect(page.locator('#totalDepth')).to_have_text('20')
   assert sum(stored()['inventory'])==1
   assert len(stored()['history'][0]['collected'])==2 # One star and the ten-minute find.
   page.reload();expect(page.locator('#balance')).to_have_text('2');assert sum(stored()['inventory'])==1
   page.locator('[data-page="reports"]').click()
   expect(page.locator('#reportToday')).to_have_text('10m')
   expect(page.locator('#logEntries')).to_contain_text('<Read & revise>');assert page.locator('#logEntries img').count()==0
   # Merely opening Today leaves the timer running. Day-end requires confirmation.
   page.locator('[data-page="focus"]').click();page.locator('[data-mode="work"]').click()
   page.locator('#taskInput').fill('Draft outline');page.locator('#startButton').click();page.clock.fast_forward(60000)
   page.locator('[data-page="reports"]').click();expect(page.locator('#startText')).to_have_text('Pause')
   page.locator('#finishTodayButton').click();expect(page.locator('#stopTitle')).to_have_text('Finish today?')
   page.locator('#continueButton').click();expect(page.locator('#startText')).to_have_text('Pause')
   page.locator('#finishTodayButton').click();page.locator('#confirmStop').click()
   expect(page.locator('#todayDialog')).to_be_visible();expect(page.locator('#todaySummaryTasks')).to_contain_text('Draft outline')
   expect(page.locator('#todayWork')).to_have_text('1m');page.locator('#closeTodayButton').click()
   page.locator('[data-page="focus"]').click()
   # Breaks grant no dig, currency, finds or focus time.
   before=stored();page.locator('[data-mode="rest"]').click();page.locator('#startButton').click();page.clock.fast_forward(60000);end()
   after=stored();assert after['balance']==before['balance'] and after['depth']==before['depth'] and after['inventory']==before['inventory']
   page.locator('[data-page="reports"]').click();expect(page.locator('#reportToday')).to_have_text('11m')
   # Each repeatable 15s developer demo still grants spendable rewards.
   page.locator('[data-page="focus"]').click()
   for _ in range(3):
    page.locator('#demoButton').click();page.locator('#startButton').click();page.clock.fast_forward(9100)
    expect(page.locator('#petHint')).to_contain_text('1 find')
    page.clock.fast_forward(6900)
    expect(page.locator('#finishStars')).to_have_text('+1 ✦');page.locator('#claimButton').click()
   expect(page.locator('#balance')).to_have_text('5');assert sum(stored()['inventory'])==4
   page.locator('[data-page="reports"]').click();expect(page.locator('#reportToday')).to_have_text('11m')
   # Earned demo stars can buy furniture; placing a find never consumes it.
   page.locator('[data-page="home"]').click();page.locator('#editHomeButton').click()
   page.locator('[data-home-item="lamp"]').click();expect(page.locator('#homeBalance')).to_have_text('0')
   expect(page.locator('[data-home-item="lamp"]')).to_have_text('Placed')
   page.locator('[data-slot="right"]').click()
   inventory=stored()['inventory'];i=next(i for i,n in enumerate(inventory) if n)
   name=['star','mushroom','crystal','fossil'][i];page.locator(f'[data-home-item="find:{name}"]').click()
   assert stored()['inventory']==inventory
   page.reload();expect(page.locator('#home')).to_be_visible();page.locator('#editHomeButton').click()
   assert stored()['home']['slots']['left']=='lamp' and stored()['home']['slots']['right']=='find:'+name
   expect(page.locator('#homeBalance')).to_have_text('0')
   # Decorating a running session pauses it, and does not auto-resume on exit.
   page.locator('[data-page="focus"]').click();page.locator('[data-mode="study"]').click();page.locator('#startButton').click();page.clock.fast_forward(1000)
   page.locator('[data-page="home"]').click();expect(page.locator('#editHomeButton')).to_have_text('Pause & decorate')
   page.locator('#editHomeButton').click();expect(page.locator('#startText')).to_have_text('Resume')
   page.locator('#editHomeButton').click();page.locator('[data-page="focus"]').click();end()
   legacy=browser.new_page();legacy.goto(url)
   legacy.add_init_script("""if(!sessionStorage.getItem('migration-fixture')){const d=new Date(),date=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),now=Date.now();localStorage.setItem('loop-pet-soft-universe-v1',JSON.stringify({profile:{name:'Old friend',color:'#b784cf',configured:true},balance:9,depth:12,inventory:[1,2,0,0],owned:['hat'],equipped:'hat',rainVolume:.3,reportDays:{[date]:{seconds:60,completed:0}},history:[{at:now,mode:'work',seconds:600,stars:2,outcome:'complete',demo:false}],session:{status:'running',mode:'study',plannedSeconds:1500,deadline:now+1440000,trackedAt:now,startedAt:now-60000,studyDays:{[date]:60}}}));sessionStorage.setItem('migration-fixture','1');}""")
   legacy.reload();legacy.clock.install();legacy.clock.fast_forward(60000)
   legacy.locator('#startButton').click();legacy.locator('[data-page="reports"]').click()
   expect(legacy.locator('#todayStudy')).to_have_text('2m');expect(legacy.locator('#todayWork')).to_have_text('10m')
   legacy.reload();expect(legacy.locator('#todayWork')).to_have_text('10m');expect(legacy.locator('#balance')).to_have_text('9')
   expect(legacy.locator('#equippedCount')).to_have_text('1 equipped');expect(legacy.locator('#musicVolume')).to_have_value('30')
   # Quiet focus mode persists without hiding its own restore control.
   page.locator('#simpleViewButton').click();expect(page.locator('.arcade-machine')).to_be_hidden()
   page.reload();expect(page.locator('#simpleViewButton')).to_have_text('Show animation');page.locator('#simpleViewButton').click()
   # MP3 truly plays, carries across navigation and stops on reload.
   page.locator('#soundButton').click();expect(page.locator('#soundButton')).to_have_attribute('aria-pressed','true')
   page.wait_for_function("document.querySelector('#focusMusic').currentTime>0")
   page.locator('[data-page="home"]').click();assert page.evaluate("!document.querySelector('#focusMusic').paused")
   page.locator('[data-page="focus"]').click();page.locator('#soundButton').click()
   page.reload();assert page.evaluate("document.querySelector('#focusMusic').paused")
   # Actual synthesized waveform contains two separated, audible notes.
   audio=browser.new_page();audio.goto(url)
   energy=audio.evaluate("""async()=>{const c=new OfflineAudioContext(1,44100,44100);c.resume=()=>Promise.resolve();window.AudioContext=function(){return c};await PetAudio.pet();const b=await c.startRendering(),d=b.getChannelData(0);const rms=(a,z)=>Math.sqrt(d.slice(a*44100,z*44100).reduce((s,x)=>s+x*x,0)/((z-a)*44100));return [rms(.03,.12),rms(.185,.205),rms(.24,.32)];}""")
   assert energy[0]>.015 and energy[2]>.015 and energy[1]<energy[0]/10,energy
   # Sleep is visual; a pet wakes it, jumps and says yeeeee without penalties.
   page.clock.fast_forward(301000);page.wait_for_timeout(180)
   b=page.evaluate("PixelArt.getBounds('miningCanvas')");r=page.locator('#miningCanvas').bounding_box()
   page.locator('#miningCanvas').click(position={'x':(b['x']+b['w']/2)*r['width']/384,'y':(b['y']+b['h']/2)*r['height']/224})
   expect(page.locator('#petSpeech')).to_be_visible();assert page.evaluate('PetAudio.status().petPattern')=='doo-doo'
   # Managed browser blocks file://. Serve the exact standalone HTML once,
   # then disconnect networking to verify embedded audio and navigation.
   offline=browser.new_page();offline.goto(url+'/dist/LOOP_PET.html');offline.context.set_offline(True);offline.locator('#enterGame').click()
   assert offline.locator('#focusMusic').get_attribute('src').startswith('data:audio/mpeg;base64,')
   offline.locator('#soundButton').click();offline.wait_for_function("document.querySelector('#focusMusic').currentTime>0")
   offline.locator('[data-page="home"]').click();expect(offline.locator('#home')).to_be_visible()
   # Mobile layout with the added fifth navigation icon and full editor.
   page.locator('[data-page="home"]').click();page.locator('#editHomeButton').click();page.wait_for_timeout(200)
   page.screenshot(path=str(ROOT/'docs/images/home.png'),full_page=True)
   for width in [320,390,768,1440]:
    page.set_viewport_size({'width':width,'height':900})
    for route in ['focus','home','reports']:
     page.locator(f'[data-page="{route}"]').click();assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,route)
   page.set_viewport_size({'width':390,'height':844});page.locator('[data-page="focus"]').click();page.wait_for_timeout(160);page.screenshot(path=str(ROOT/'docs/images/mobile.png'),full_page=True)
   assert not errors,errors
   print('PASS: partial/cumulative rewards and refresh deduplication; real route pickups; Work/Break/Demo accounting; daily finish confirmation; home purchase and persistent placement; pause-to-decorate; quiet mode; real MP3 playback and offline embedding; measured two-note pet waveform; wake and pet; responsive editor.')
   browser.close()
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
