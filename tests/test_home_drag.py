import os,subprocess,shutil,json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True);url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  seed={'profile':{'name':'Momo','color':'#a8b77a','configured':True},'balance':1000,'inventory':[45,45,35,35],'owned':[],'home':{'theme':'cave','ownedThemes':['cave'],'owned':['rug','lamp','crockeryShelf'],'slots':{'floor':'rug'}}}
  page.add_init_script("localStorage.setItem('eumo-tour-v1','seen');if(!localStorage.getItem('loop-pet-soft-universe-v1'))localStorage.setItem('loop-pet-soft-universe-v1',"+json.dumps(json.dumps(seed))+");")
  page.goto(url+'/#home');page.locator('#editHomeButton').click()
  def xy(x,y):
   r=page.locator('#homeCanvas').bounding_box();return r['x']+x*r['width']/640,r['y']+y*r['height']/360
  def drag_item(id,x,y):
   button=page.locator('.home-item-art[data-home-drag="'+id+'"]');button.scroll_into_view_if_needed();r=button.bounding_box();page.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);page.mouse.down();page.mouse.move(*xy(x,y),steps=15);page.mouse.up();page.wait_for_timeout(100)
  assert page.evaluate("HomeScenery.canPlace('lamp',145,145)")
  drag_item('lamp',145,145)
  key=page.evaluate("Object.keys(state.home.slots).find(k=>state.home.slots[k]==='lamp')");assert key
  pos=page.evaluate("state.home.positions["+json.dumps(key)+"]");assert abs(pos['x']-145)<=1,pos
  page.mouse.move(*xy(145,130));page.mouse.down();page.mouse.move(*xy(490,155),steps=15);page.mouse.up();page.wait_for_timeout(100)
  pos=page.evaluate("state.home.positions["+json.dumps(key)+"]");assert abs(pos['x']-490)<=1,pos
  # Out-of-bounds drops leave the previous placement alone.
  drag_item('lamp',5,5);assert page.evaluate("state.home.positions["+json.dumps(key)+"]")==pos
  # Drag a placed item outside the home to put away, never destroy it.
  page.mouse.move(*xy(pos['x'],pos['y']-15));page.mouse.down();r=page.locator('#homeCanvas').bounding_box();page.mouse.move(r['x']-20,r['y']+100,steps=15)
  assert page.locator('.home-drag-ghost').evaluate("e=>e.classList.contains('is-storing')")
  assert page.locator('.home-drag-label').is_visible();page.mouse.up();page.wait_for_timeout(100)
  assert page.evaluate("state.home.slots["+json.dumps(key)+"]===null && state.home.owned.includes('lamp') && state.balance===1000")
  drag_item('lamp',pos['x'],pos['y'])
  # Buy stores ownership without surprise placement; then drag.
  page.locator('[data-home-item="television"]').click();assert page.evaluate("state.home.owned.includes('television') && !Object.values(state.home.slots).includes('television')")
  drag_item('television',-10,100);page.mouse.click(*xy(180,140));assert page.evaluate("!Object.values(state.home.slots).includes('television')")
  drag_item('television',150,145);assert page.evaluate("Object.values(state.home.slots).includes('television')")
  for theme in ['forest','rainforest','snow','starlit']:
   page.locator('[data-theme="'+theme+'"]').click();page.wait_for_timeout(170);page.locator('#homeCanvas').screenshot(path='/tmp/eumo-home-'+theme+'.png')
  assert page.evaluate('state.balance')==405
  page.reload();assert page.evaluate("state.home.theme==='starlit' && Object.values(state.home.slots).includes('television')")
  assert page.evaluate("state.home.positions["+json.dumps(key)+"]")==pos
  page.goto(url+'/#wardrobe');page.locator('[data-category="hats"]').click();page.locator('[data-item="mushroomhat"]').click()
  assert page.evaluate("state.owned.includes('mushroomhat') && state.inventory[1]===5 && state.balance===405")
  page.locator('[data-filter="owned"]').click();page.locator('[data-item="mushroomhat"]').click();assert page.evaluate('state.inventory[1]')==5
  # Touch drag on the compact layout keeps the home and inventory visible together.
  page.goto(url+'/#home');page.set_viewport_size({'width':390,'height':844});page.locator('#editHomeButton').click()
  button=page.locator('button[data-home-drag="crockeryShelf"]');button.scroll_into_view_if_needed();r=button.bounding_box();start=(r['x']+r['width']/2,r['y']+r['height']/2);end=xy(500,140)
  assert page.evaluate("HomeScenery.canPlace('crockeryShelf',500,140)")
  cdp=page.context.new_cdp_session(page);cdp.send('Emulation.setTouchEmulationEnabled',{'enabled':True})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':start[0],'y':start[1]}]})
  for i in range(1,11):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':start[0]+(end[0]-start[0])*i/10,'y':start[1]+(end[1]-start[1])*i/10}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(100)
  assert page.evaluate("Object.values(state.home.slots).includes('crockeryShelf')")
  # Touch-drag the placed shelf outside the home frame into the editor.
  start=xy(500,125);r=page.locator('#homeCanvas').bounding_box();end=(r['x']+r['width']/2,r['y']+r['height']+25)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':start[0],'y':start[1]}]})
  for i in range(1,11):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':start[0]+(end[0]-start[0])*i/10,'y':start[1]+(end[1]-start[1])*i/10}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(100)
  assert page.evaluate("!Object.values(state.home.slots).includes('crockeryShelf') && state.home.owned.includes('crockeryShelf')")
  assert not errors,errors
  print('PASS: mouse/touch drag-out storage, cancelled inventory placement, movement, invalid-drop recovery, ownership, background purchases, saved positions and one-time redemption.')
  b.close()
finally:proc.terminate();proc.wait()
