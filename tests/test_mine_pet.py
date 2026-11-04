"""Pointer capture must not steal idle mine taps, including a three-tap spin."""
import json,os,shutil,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];KEY='loop-pet-soft-universe-v1'
def run():
 proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True)
 url=proc.stdout.readline().strip().split('Eumo: ')[1]
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
   for touch in [False,True]:
    ctx=browser.new_context(viewport={'width':1280,'height':900},has_touch=touch);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    seed={'profile':{'name':'Momo','configured':True,'color':'#b784cf'},'depth':463,'surfaceDepth':343,'inventory':[1,2,3,4],'balance':99}
    page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
    page.goto(url+'/#focus');page.clock.install();page.clock.run_for(250)
    assert page.evaluate('MineView.depth(state)')==120
    def tap():
     b=page.evaluate("PixelArt.getBounds('miningCanvas')");r=page.locator('#miningCanvas').bounding_box();x=r['x']+(b['x']+b['w']/2)/384*r['width'];y=r['y']+(b['y']+b['h']/2)/224*r['height']
     assert page.evaluate("([x,y])=>{const c=document.querySelector('#miningCanvas'),r=c.getBoundingClientRect();return document.elementFromPoint(x,y)===c && PixelArt.hitTest(c.id,(x-r.left)*c.width/r.width,(y-r.top)*c.height/r.height)}",[x,y])
     if touch:page.touchscreen.tap(x,y)
     else:page.mouse.click(x,y)
    before=page.evaluate('JSON.stringify([state.depth,state.balance,state.inventory])')
    tap();expect(page.locator('#petSpeech')).to_have_text('yeeeeee');expect(page.locator('#petSpeech')).to_be_visible()
    page.clock.run_for(150);tap();page.clock.run_for(150);tap();page.clock.run_for(150)
    expect(page.locator('#petSpeech')).to_contain_text('spin');assert page.evaluate("PixelArt.getBounds('miningCanvas').rotation")>0
    page.clock.run_for(1600)
    # Drag starting on the mole must move the camera without petting on release.
    b=page.evaluate("PixelArt.getBounds('miningCanvas')");r=page.locator('#miningCanvas').bounding_box();x=r['x']+(b['x']+b['w']/2)/384*r['width'];y=r['y']+(b['y']+b['h']/2)/224*r['height'];camera=page.evaluate('MineView.cameraFor(state)')
    if touch:
     cdp=ctx.new_cdp_session(page);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
     for step in range(1,11):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y+85*step/10}]})
     cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});cdp.detach()
    else:
     page.mouse.move(x,y);page.mouse.down();page.mouse.move(x,y+85,steps=10);page.mouse.up()
    assert page.evaluate('MineView.cameraFor(state)')<camera;assert page.evaluate('petAt')==0
    page.clock.run_for(500)
    # Keep one input type: a synthetic mouse click immediately before a touch
    # can suppress Chromium's compatibility click, unlike an all-touch gesture.
    if touch:page.locator('#mineToMole').tap()
    else:page.locator('#mineToMole').click()
    page.clock.run_for(50);tap();expect(page.locator('#petSpeech')).to_be_visible()
    assert page.evaluate('JSON.stringify([state.depth,state.balance,state.inventory])')==before
    # Removed Inventory stays removed; compact glasses toggle only affects visibility.
    for selector in ['#rewards','[data-page="rewards"]','#mineViewLabel','#mineBrowseHint']:
     expect(page.locator(selector)).to_have_count(0)
    button=page.locator('#simpleViewButton');expect(button.locator('svg')).to_have_count(1);expect(button).to_have_text('');expect(button).to_have_attribute('aria-label','Hide animation')
    button.click();expect(page.locator('.arcade-machine')).to_be_hidden();expect(button).to_have_attribute('aria-label','Show animation');expect(button).to_have_attribute('aria-pressed','true')
    page.reload();expect(page.locator('.arcade-machine')).to_be_hidden();page.locator('#simpleViewButton').click();expect(page.locator('.arcade-machine')).to_be_visible()
    assert page.evaluate('JSON.stringify([state.depth,state.balance,state.inventory])')==before
    page.evaluate("EumoI18n.set('zh')");expect(button).to_have_attribute('aria-label','隐藏动画');page.evaluate("EumoI18n.set('en')")
    if not touch:page.screenshot(path=str(ROOT/'docs/images/eumo-focus-clean.png'),full_page=True)
    page.evaluate("location.hash='rewards'");expect(page.locator('#home')).to_be_visible();expect(page).to_have_url(url+'/#home');page.locator('[data-page="focus"]').click()
    page.clock.run_for(1600);page.locator('#startButton').click();expect(page.locator('#petButton')).to_be_disabled()
    assert not errors,errors;ctx.close()
   browser.close()
  print('PASS: deep idle mine mouse/touch single and triple taps, drag from mole without accidental pet, return-and-tap, unchanged rewards and running lock.')
 finally:proc.terminate();proc.wait(timeout=5)
if __name__=='__main__':run()
