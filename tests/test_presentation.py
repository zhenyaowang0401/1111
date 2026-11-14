"""Home controls stay reachable after resize; startup never blocks the shared app."""
import json
import os
import shutil
import subprocess
from playwright.sync_api import sync_playwright, expect

proc = subprocess.Popen(['node', 'scripts/dev_server.cjs'], env={**os.environ, 'PORT': '0'}, stdout=subprocess.PIPE, text=True)
url = proc.stdout.readline().strip().split('Eumo: ')[1]
seed = {'profile': {'name': 'Luka', 'color': '#a9b4c6', 'configured': True},
        'home': {'theme': 'forest', 'ownedThemes': ['cave', 'forest'], 'backgroundPriceVersion': 2,
                 'owned': ['rug', 'lamp'], 'slots': {'floor': 'rug', 'right': 'lamp'}}}
init = "localStorage.setItem('eumo-tour-v1','seen');localStorage.setItem('loop-pet-soft-universe-v1'," + json.dumps(json.dumps(seed)) + ");"
audit = """window.splashSeen=false;const recordSplash=()=>{const e=document.getElementById('startupSplash');
 if(e&&!window.splashSeen){const s=getComputedStyle(e);if(s.animationName!=='eumo-splash-away')return;
 window.splashSeen=true;window.splashTime=parseFloat(s.animationDuration)+parseFloat(s.animationDelay);window.splashPointer=s.pointerEvents;}};
 new MutationObserver(recordSplash).observe(document,{childList:true,subtree:true});
 document.addEventListener('DOMContentLoaded',recordSplash,{once:true});"""
try:
 with sync_playwright() as p:
  browser = p.chromium.launch(executable_path=shutil.which('chromium'), args=['--no-sandbox'])
  errors = []
  for entry in ['/', '/dist/Eumo.html']:
   context = browser.new_context(viewport={'width': 1366, 'height': 768}, device_scale_factor=1.5)
   context.add_init_script(init + audit)
   page = context.new_page()
   page.on('pageerror', lambda e: errors.append(str(e)))
   page.goto(url + entry + '#home')
   assert page.evaluate('splashSeen && splashTime > 0 && splashTime <= 1.1 && splashPointer === "none"')
   expect(page.locator('#startupSplash')).to_have_count(0, timeout=2500)
   expect(page.locator('.page-heading #homeThemeName')).to_have_text('Twilight forest')
   for width, height in [(1920,1080),(1440,900),(1366,768),(1280,600),(1024,640),(1366,500),(844,390),(768,1024),(390,844),(320,568)]:
    page.set_viewport_size({'width': width, 'height': height})
    page.wait_for_timeout(150)
    boxes = page.evaluate("""()=>Object.fromEntries(['#homeCanvas','.home-actions','.home-walk-hint'].map(s=>{
     const r=document.querySelector(s).getBoundingClientRect();return [s,{top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}];}))""")
    for name, box in boxes.items():
     assert box['top'] >= 0 and box['bottom'] <= height and box['left'] >= 0 and box['right'] <= width, (entry,width,height,name,box)
    assert abs(boxes['#homeCanvas']['width']/boxes['#homeCanvas']['height']-16/9) < .01
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    # Real pointer activation verifies that the transparent hotspot follows the resized chest.
    page.locator('#openChestButton').click()
    expect(page.locator('#chestDialog')).to_be_visible()
    page.keyboard.press('Escape')
   page.set_viewport_size({'width': 1366, 'height': 768})
   page.locator('[data-page="focus"]').click()
   assert page.locator('#startupSplash').count() == 0
   page.locator('#openMoleChat').click()
   expect(page.locator('#chatDialog')).to_be_visible()
   assert page.locator('#chatDialogTitle').evaluate('e=>e.getBoundingClientRect().width') <= 1
   page.locator('#closeMoleChat').click()
   # The new knob retains native keyboard input and synchronizes both volume controls.
   page.locator('#musicVolume').focus()
   page.keyboard.press('ArrowRight')
   expect(page.locator('#musicVolume')).to_have_value('46')
   page.locator('#openMusicLibrary').click()
   expect(page.locator('#musicLibraryVolume')).to_have_value('46')
   page.locator('#musicRepeat').click()
   assert page.evaluate('!document.querySelector("#focusMusic").loop')
   page.locator('#musicRepeat').click()
   assert page.evaluate('document.querySelector("#focusMusic").loop')
   page.keyboard.press('Escape')
   page.locator('#demoButton').click()
   expect(page.locator('#durationLabel')).to_have_text('15 sec')
   page.locator('#demoButton').click()
   page.locator('#gameShell .brand').click()
   expect(page.locator('.setup-header .setup-step')).to_have_text('Mole setup')
   page.wait_for_function('MoleArt.ready')
   assert not page.locator('#setupTime').count()
   page.reload()
   assert page.evaluate('splashSeen')
   expect(page.locator('#startupSplash')).to_have_count(0, timeout=2500)
   if entry != '/':
    context.set_offline(True)
    page.locator('#enterGame').click()
    page.locator('[data-page="home"]').click()
    page.locator('#openChestShortcut').click()
    expect(page.locator('#chestDialog')).to_be_visible()
   context.close()
  reduced = browser.new_context(reduced_motion='reduce')
  reduced.add_init_script(init + audit)
  page = reduced.new_page(); page.goto(url)
  expect(page.locator('#startupSplash')).to_be_hidden()
  expect(page.locator('#startupSplash')).to_have_count(0, timeout=2000)
  reduced.close()
  for motion in ['no-preference', 'reduce']:
   no_script = browser.new_context(java_script_enabled=False, reduced_motion=motion)
   page = no_script.new_page(); page.goto(url)
   expect(page.locator('#startupSplash')).to_be_hidden(timeout=2000)
   no_script.close()
  assert not errors, errors
  browser.close()
  print('PASS: web/standalone startup, route/reload behavior, reduced motion and script failure; 20 viewport/DPI checks; scaled chest targets, keyboard volume, playback modes, compact chat and setup.')
finally:
 proc.terminate(); proc.wait()
