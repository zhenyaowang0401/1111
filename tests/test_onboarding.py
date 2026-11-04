"""Optional tour, inert controls, persistence, localization and spotlight layout."""
import os,subprocess,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
def run():
 proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True);url=proc.stdout.readline().strip().split('Eumo: ')[1]
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':960});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(url);expect(page.locator('#onboardingDialog')).not_to_be_visible();page.locator('#petName').fill('Luka');page.locator('#enterGame').click();expect(page.locator('#tourTitle')).to_have_text('First time here?')
   baseline=page.evaluate('JSON.stringify({balance:state.balance,inventory:state.inventory,depth:state.depth,session:state.session,owned:state.owned})')
   page.locator('#tourNext').click();expect(page.locator('#tourProgress')).to_have_text('1 / 4');expect(page.locator('#tourBack')).to_be_disabled()
   page.screenshot(path=str(ROOT/'docs/images/eumo-onboarding.png'))
   for width,height in [(1440,960),(390,844),(320,640),(1000,550)]:
    page.set_viewport_size({'width':width,'height':height})
    for step in range(4):
     expect(page.locator('#tourProgress')).to_have_text(f'{step+1} / 4')
     card=page.locator('#tourCard').bounding_box();assert card['x']>=0 and card['y']>=0 and card['y']+card['height']<=height+1,(width,step,card)
     expect(page.locator('#tourNext')).to_be_in_viewport();page.wait_for_timeout(100);assert page.locator('#tourShadePath').get_attribute('d').count(' M')>=1,(width,step,'no highlight')
     if step==1:
      page.locator('#tourTopics button').nth(1).click();page.wait_for_function("document.querySelector('#tourShadePath').getAttribute('d').includes(' M')")
      if width==390:page.screenshot(path=str(ROOT/'docs/images/eumo-onboarding-mobile.png'))
     if step<3:page.locator('#tourNext').click()
    if width!=1000:
     for _ in range(3):page.locator('#tourBack').click()
   page.locator('#tourLanguage').click();page.keyboard.press('Escape');expect(page.locator('#onboardingDialog')).to_be_visible();page.locator('#tourLanguage').click();page.locator('#tourLanguageMenu [data-language=zh]').click();expect(page.locator('#tourTitle')).to_have_text('看看进步，找个朋友');page.locator('#tourNext').click();expect(page.locator('#onboardingDialog')).to_be_hidden();expect(page.locator('#startButton')).to_be_focused()
   assert page.evaluate('JSON.stringify({balance:state.balance,inventory:state.inventory,depth:state.depth,session:state.session,owned:state.owned})')==baseline
   page.reload();expect(page.locator('#onboardingDialog')).to_be_hidden();page.locator('#helpButton').click();page.locator('#replayTour').click();expect(page.locator('#tourProgress')).to_have_text('1 / 4')
   page.keyboard.press('Tab');assert page.evaluate("document.activeElement.closest('#onboardingDialog')!==null")
   page.keyboard.press('Escape');expect(page.locator('#onboardingDialog')).to_be_hidden()
   page.locator('#startButton').click();page.locator('#helpButton').click();expect(page.locator('#replayTour')).to_be_disabled();expect(page.locator('#tourPauseNote')).to_be_visible();page.locator('#gotIt').click();page.locator('#startButton').click()
   page.locator('#helpButton').click();page.locator('#replayTour').click();page.evaluate("document.querySelector('#startButton').click()");expect(page.locator('#onboardingDialog')).to_be_hidden();assert page.evaluate('state.session.status')=='running'
   # A direct decline is remembered; existing configured players are not interrupted.
   fresh=b.new_page();fresh.goto(url);fresh.locator('#enterGame').click();fresh.locator('#tourSkip').click();fresh.reload();expect(fresh.locator('#onboardingDialog')).to_be_hidden()
   # A browser that refuses local storage still permits setup and a dismissible tour.
   blocked=b.new_page();blocked.add_init_script("Storage.prototype.setItem=function(){throw new DOMException('blocked','SecurityError')};Storage.prototype.getItem=function(){throw new DOMException('blocked','SecurityError')}");blocked.goto(url);blocked.locator('#enterGame').click();expect(blocked.locator('#tourTitle')).to_have_text('First time here?');blocked.locator('#tourSkip').click();expect(blocked.locator('#onboardingDialog')).to_be_hidden()
   # Offline first use supports the same opt-in.
   offline=b.new_page();offline.goto(url+'/dist/Eumo.html');offline.context.set_offline(True);offline.locator('#enterGame').click();expect(offline.locator('#tourTitle')).to_have_text('First time here?');offline.keyboard.press('Escape');expect(offline.locator('#onboardingDialog')).to_be_hidden()
   assert not errors,errors;b.close();print('PASS: optional welcome, 4 steps and topic highlights, mobile/short layout, unchanged game state, finish focus, skip/Escape/reload, Help replay, bilingual text, running guard and offline tour.')
 finally:proc.terminate();proc.wait()
if __name__=='__main__':run()
