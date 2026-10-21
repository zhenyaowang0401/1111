"""End-to-end tests: pixel digging, petting, study reporting, equipment and audio."""
import re
import os
import shutil
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from datetime import datetime,timedelta,timezone
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).resolve().parents[1]

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser'),args=['--no-sandbox'])
   context=browser.new_context(viewport={'width':1440,'height':1000},timezone_id='Asia/Shanghai')
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   url=f'http://127.0.0.1:{server.server_port}'
   page.goto(url);expect(page.locator('#setupScreen')).to_be_visible();page.locator('#enterGame').click();page.clock.install();page.wait_for_timeout(250)
   # Every visible screen is English; navigation icons have accessible names.
   expect(page.locator('html')).to_have_attribute('lang','en')
   assert not page.locator('body').evaluate("e=>/[\u3400-\u9fff]/.test(e.innerText)")
   expect(page.locator('#timeDisplay')).to_have_text('25:00')
   # Idle eyes must visibly blink.
   eye_colors=set()
   for _ in range(58):
    page.clock.fast_forward(150)
    eye_colors.add(tuple(page.evaluate("""()=>{const b=PixelArt.getBounds('miningCanvas'),c=document.querySelector('#miningCanvas');return [...c.getContext('2d').getImageData(b.x+16,b.y+31,1,1).data].slice(0,3)}""")))
   assert (40,33,76) in eye_colors and (183,132,207) in eye_colors,eye_colors
   def pet(canvas='#miningCanvas'):
    which=canvas[1:];bounds=page.evaluate(f"PixelArt.getBounds('{which}')")
    dimensions={'miningCanvas':(384,224),'wardrobeCanvas':(192,160)}[which]
    rect=page.locator(canvas).bounding_box()
    page.locator(canvas).click(position={'x':(bounds['x']+bounds['w']/2)*rect['width']/dimensions[0],'y':(bounds['y']+bounds['h']/2)*rect['height']/dimensions[1]})
    return bounds
   # Background clicks do not pet. Sprite clicks produce text, one sound and a jump.
   page.locator('#miningCanvas').click(position={'x':8,'y':8})
   expect(page.locator('#petSpeech')).to_be_hidden()
   baseline=pet();page.wait_for_timeout(220)
   expect(page.locator('#petSpeech')).to_have_text('yeeeeee')
   expect(page.locator('#petSpeech')).to_be_visible()
   assert page.evaluate("PixelArt.getBounds('miningCanvas').y")<baseline['y']-4
   assert page.evaluate('PetAudio.status().petVoices')==1
   page.clock.fast_forward(1400);expect(page.locator('#petSpeech')).to_be_hidden()
   # Petting is disallowed during both running and paused sessions.
   page.locator('#demoButton').click();page.locator('#startButton').click()
   expect(page.locator('#petButton')).to_be_disabled()
   page.locator('#petButton').dispatch_event('click')
   assert page.evaluate('PetAudio.status().petVoices')==1
   page.clock.fast_forward(6000);expect(page.locator('#depthDisplay')).to_have_text('002')
   page.locator('#startButton').click();paused=page.locator('#timeDisplay').inner_text()
   page.clock.fast_forward(5000);expect(page.locator('#timeDisplay')).to_have_text(paused)
   expect(page.locator('#petButton')).to_be_disabled()
   page.locator('#startButton').click();page.clock.fast_forward(10000)
   expect(page.locator('#finishDialog')).to_be_visible()
   page.locator('#claimButton').click();expect(page.locator('#totalDepth')).to_have_text('5')
   page.locator('[data-page="reports"]').click()
   expect(page.locator('#reportToday')).to_have_text('0m') # Demo excluded.
   # 25 minutes study plus a 50-minute study session generate real earned currency.
   def complete_minutes(minutes):
    page.locator('[data-page="focus"]').click()
    while page.locator('#durationLabel').inner_text()!=f'{minutes} min':
     current=int(page.locator('#durationLabel').inner_text().split()[0]);page.locator('#plusTime' if current<minutes else '#minusTime').click()
    page.locator('#startButton').click();page.clock.fast_forward(minutes*60000+300)
    expect(page.locator('#finishDialog')).to_be_visible();page.locator('#claimButton').click()
   complete_minutes(25);complete_minutes(50)
   page.locator('[data-page="reports"]').click()
   expect(page.locator('#reportToday')).to_have_text('1h 15m')
   expect(page.locator('#reportTodaySessions')).to_have_text('2 completed')
   # All four equipped items must coexist in the state and the rendered sprite.
   page.locator('[data-page="wardrobe"]').click()
   for item in ['hat','glasses','scarf','star']:page.locator(f'[data-item="{item}"]').click()
   expect(page.locator('#equippedCount')).to_have_text('4 equipped')
   expect(page.locator('.outfit-card.equipped')).to_have_count(4)
   page.wait_for_timeout(250)
   def sprite_colors(canvas):
    return page.locator(canvas).evaluate("""c=>{let a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,r={hat:0,glasses:0,scarf:0,star:0};for(let i=0;i<a.length;i+=4){let p=[a[i],a[i+1],a[i+2]].join(',');if(p==='242,199,118')r.hat++;if(p==='180,242,237')r.glasses++;if(p==='105,202,197')r.scarf++;if(p==='255,252,224')r.star++;}return r}""")
   assert all(v>0 for v in sprite_colors('#wardrobeCanvas').values())
   page.reload();page.wait_for_timeout(250)
   expect(page.locator('#equippedCount')).to_have_text('4 equipped')
   assert all(v>0 for v in sprite_colors('#wardrobeCanvas').values())
   page.locator('[data-item="glasses"]').click();expect(page.locator('#equippedCount')).to_have_text('3 equipped')
   page.locator('[data-item="glasses"]').click()
   page.locator('[data-page="focus"]').click();page.wait_for_timeout(250)
   assert all(v>0 for v in sprite_colors('#miningCanvas').values())
   # Ending early keeps progress; pauses are excluded and Work is reported separately.
   page.locator('#startButton').click();page.clock.fast_forward(120000);page.locator('#startButton').click()
   page.clock.fast_forward(180000)
   page.locator('[data-page="reports"]').click();expect(page.locator('#reportToday')).to_have_text('1h 17m')
   page.locator('[data-page="focus"]').click();page.locator('#stopButton').click();page.locator('#confirmStop').click()
   expect(page.locator('#totalDepth')).to_have_text('159')
   page.locator('[data-mode="work"]').click();page.locator('#startButton').click();page.clock.fast_forward(180000)
   page.locator('#stopButton').click();page.locator('#confirmStop').click()
   page.locator('[data-page="reports"]').click();expect(page.locator('#reportToday')).to_have_text('1h 20m')
   expect(page.locator('#todayWork')).to_have_text('3m')
   expect(page.locator('#logEntries')).to_contain_text('Ended early')
   page.locator('[data-range="30"]').click();expect(page.locator('.chart-point')).to_have_count(30)
   page.locator('.chart-point').last.focus();expect(page.locator('#chartTooltip')).to_contain_text('1h 20m')
   page.locator('[data-range="7"]').click();expect(page.locator('.chart-point')).to_have_count(7)
   page.locator('#previousMonth').click();page.locator('#currentMonth').click()
   expect(page.locator('.calendar-day.is-today')).to_have_attribute('aria-pressed','true')
   page.reload();expect(page.locator('#reportToday')).to_have_text('1h 20m')
   # Warm Focus is user-started MP3 playback; volume persists, no autoplay.
   page.locator('[data-page="focus"]').click();page.locator('#soundButton').click()
   expect(page.locator('#soundButton')).to_have_attribute('aria-pressed','true')
   assert page.evaluate('PetAudio.status().state')=='running'
   page.locator('#musicVolume').fill('25');page.locator('#musicVolume').dispatch_event('input')
   assert page.evaluate('PetAudio.status().volume')==.25
   page.locator('#soundButton').click();expect(page.locator('#soundButton')).to_have_attribute('aria-pressed','false')
   page.reload();expect(page.locator('#musicVolume')).to_have_value('25')
   assert not page.evaluate('PetAudio.status().musicOn')
   # All four pages work across narrow, mobile, tablet and desktop widths.
   for width in [320,390,768,1440]:
    page.set_viewport_size({'width':width,'height':900})
    for route in ['focus','home','rewards','wardrobe','reports','companions']:
     page.locator(f'[data-page="{route}"]').click();page.wait_for_timeout(180)
     assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,route)
     assert not page.locator('body').evaluate("e=>/[\u3400-\u9fff]/.test(e.innerText)")
   # Study sessions crossing local midnight are split correctly by calendar day.
   midnight_context=browser.new_context(timezone_id='Asia/Shanghai')
   midnight=midnight_context.new_page();midnight.goto(url);midnight.locator('#enterGame').click()
   start=datetime(2026,10,19,23,59,0,tzinfo=timezone(timedelta(hours=8)))
   midnight.clock.install(time=start)
   midnight.locator('#startButton').click();midnight.clock.fast_forward(120000)
   midnight.locator('#startButton').click();midnight.locator('[data-page="reports"]').click()
   expect(midnight.locator('#reportToday')).to_have_text('1m')
   midnight.locator('[data-day="2026-10-19"]').click();expect(midnight.locator('#logTotal')).to_have_text(re.compile(r'^(59s|1m)$'))
   midnight.locator('[data-page="focus"]').click();midnight.locator('#stopButton').click();midnight.locator('#confirmStop').click()
   midnight.locator('[data-page="reports"]').click()
   midnight.locator('[data-day="2026-10-19"]').click();expect(midnight.locator('#logEntries')).to_contain_text(re.compile(r'(59s|1m)'))
   midnight.locator('[data-day="2026-10-20"]').click();expect(midnight.locator('#logEntries')).to_contain_text(re.compile(r'(59s|1m)'))
   # Legacy single-item saves migrate to a list without losing the original outfit.
   legacy=browser.new_context();old=legacy.new_page()
   old.add_init_script("localStorage.setItem('loop-pet-soft-universe-v1',JSON.stringify({balance:5,owned:['hat'],equipped:'hat',history:[]}));")
   old.goto(url+'/#wardrobe');old.locator('#enterGame').click();expect(old.locator('#equippedCount')).to_have_text('1 equipped')
   old.locator('[data-item="glasses"]').click();expect(old.locator('#equippedCount')).to_have_text('2 equipped')
   assert not errors,errors
   print('PASS: English UI; idle blinking; targeted pet + jump + sound; no petting in sessions; multi-equip rendered and persisted; Study reporting including partial sessions and midnight; trend and calendar controls; MP3 music and volume; legacy migration; 24 responsive views; no JS errors.')
   browser.close()
 finally:server.shutdown();server.server_close()
if __name__=='__main__':run()
