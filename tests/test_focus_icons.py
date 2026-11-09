"""Focus icon state, accessible labels, mobile layout and offline rendering."""
from pathlib import Path
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright, expect
import subprocess, os, json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/images'
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True)
url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  c=b.new_context(viewport={'width':1440,'height':960},timezone_id='UTC')
  c.add_init_script("localStorage.setItem('eumo-tour-v1','seen');localStorage.setItem('loop-pet-soft-universe-v1',JSON.stringify({profile:{name:'Momo',color:'#A9B4C6',configured:true},balance:125,depth:32,surfaceDepth:0,digDay:'2026-11-09',progressVersion:2,owned:['hat','scarf'],equipped:[]}))")
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.clock.install(time=datetime(2026,11,9,13,tzinfo=timezone.utc))
  page.goto(url+'/#focus');page.wait_for_function('MoleArt.ready');expect(page.locator('#startButton')).to_be_visible()
  for mode in ['work','rest','study']:
   page.locator('[data-mode="'+mode+'"]').click()
   assert page.locator('#focusMode').get_attribute('data-icon')==mode
   assert page.locator('[data-mode="'+mode+'"]').get_attribute('aria-pressed')=='true'
   assert page.locator('[data-mode="'+mode+'"]').inner_text()==''
  assert page.locator('#floatMoleButton').inner_text()==''
  assert page.locator('#startText').get_attribute('class')=='sr-only'
  assert page.locator('#devicePeriod').get_attribute('data-icon')=='sun'
  page.evaluate("EumoI18n.set('zh')");page.wait_for_timeout(300)
  assert page.locator('#startButton').get_attribute('aria-label')=='开始'
  page.evaluate("EumoI18n.set('en')");page.wait_for_timeout(300)
  assert page.locator('#startButton').get_attribute('aria-label')=='Start'
  page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(OUT/'eumo-icon-mobile.png'))
  page.set_viewport_size({'width':1440,'height':960})
  typography=page.locator('.timer-digits').evaluate('e=>{const s=getComputedStyle(e);return {font:s.fontFamily,weight:s.fontWeight,spacing:s.letterSpacing,numeric:s.fontVariantNumeric}}')
  assert typography['font'].startswith('Arial') and typography['weight']=='600',typography
  assert typography['numeric']=='tabular-nums',typography
  assert page.locator('#taskInput').evaluate('e=>getComputedStyle(e).cursor')=='text'
  assert 'data:image/svg+xml' in page.locator('#startButton').evaluate('e=>getComputedStyle(e).cursor')
  page.mouse.move(20,300);normal=page.locator('body').evaluate('e=>getComputedStyle(e).cursor')
  page.mouse.down();pressed=page.locator('body').evaluate('e=>getComputedStyle(e).cursor');page.mouse.up()
  assert normal!=pressed and '3 3' in normal and '3 3' in pressed
  page.wait_for_timeout(400);page.screenshot(path=str(OUT/'eumo-icon-day.png'))
  page.locator('#startButton').click();page.wait_for_timeout(300);page.screenshot(path=str(OUT/'eumo-icon-dig.png'));page.locator('#startButton').click();page.clock.set_system_time(datetime(2026,11,9,22,tzinfo=timezone.utc));page.wait_for_timeout(300)
  assert page.locator('.painted-night').is_visible()
  assert not page.locator('.painted-day').is_visible()
  page.screenshot(path=str(OUT/'eumo-icon-night.png'))
  page.evaluate("navigateTo('start')");page.wait_for_timeout(200);page.screenshot(path=str(OUT/'eumo-icon-setup.png'))
  page.goto(url+'/dist/Eumo.html');page.wait_for_function('MoleArt.ready');c.set_offline(True)
  expect(page.locator('#startButton')).to_be_visible()
  assert page.locator('.timer-digits').evaluate('e=>getComputedStyle(e).fontFamily').startswith('Arial')
  assert 'data:image/svg+xml' in page.locator('body').evaluate('e=>getComputedStyle(e).cursor')
  assert not errors,errors
  b.close()
  print('PASS: restored Arial 600 tabular timer, fixed-tip pickaxe cursor with pressed pose, text-input cursor, screenshots, and offline bundle without JS errors. '+json.dumps(typography))
finally:
 proc.terminate();proc.wait()
