"""Use Chromium's real Document Picture-in-Picture window, not a popup mock."""
import json, os, shutil, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
KEY='loop-pet-soft-universe-v1'

def run():
    proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True)
    url=proc.stdout.readline().strip().split('Eumo: ')[1]
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
            ctx=browser.new_context(viewport={'width':1280,'height':800})
            page=ctx.new_page();errors=[]
            ctx.on('page',lambda child:child.on('pageerror',lambda e:errors.append(str(e))))
            page.on('pageerror',lambda e:errors.append(str(e)))
            seed={'profile':{'name':'Momo <3','color':'#83c9be','configured':True},'owned':['hat','glasses'],'equipped':['hat','glasses'],'balance':7}
            page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
            page.goto(url+'/#focus')
            assert page.evaluate('FloatingMole.supported()')
            def open_pip():
                page.evaluate("navigateTo('focus')")
                with ctx.expect_page() as event:page.locator('#floatMoleButton').click()
                child=event.value;child.wait_for_selector('#mole');child.set_viewport_size({'width':240,'height':320})
                expect(page.locator('#floatMoleButton')).to_have_attribute('aria-pressed','true')
                assert page.evaluate('documentPictureInPicture.window!==null')
                return child
            mini=open_pip();expect(mini.locator('#name')).to_have_text('Momo <3')
            assert mini.evaluate('document.documentElement.scrollWidth<=innerWidth')
            assert mini.evaluate('document.documentElement.scrollHeight<=innerHeight')
            # Tunnel fills the window while controls remain readable at every supported size.
            for width,height in [(240,320),(256,360),(300,440),(320,310),(240,340),(400,260)]:
                mini.set_viewport_size({'width':width,'height':height})
                assert mini.evaluate('document.documentElement.scrollWidth<=innerWidth')
                assert mini.evaluate('document.documentElement.scrollHeight<=innerHeight')
                mini.wait_for_function("()=>{const c=document.getElementById('mole'),r=c.getBoundingClientRect(),d=Math.ceil(devicePixelRatio);return c.width===Math.round(r.width)*d&&c.height===Math.round(r.height)*d}")
                assert mini.locator('#mole').evaluate('c=>Number.isInteger(Number(c.dataset.pixelScale))')
                pet_box=mini.locator('#pet').bounding_box();header_box=mini.locator('.mine-top').bounding_box()
                assert pet_box['y']>=header_box['height']-1,'Outfit must fit below the timer'
                expect(mini.locator('#time')).to_be_in_viewport()
                expect(mini.locator('#toggle')).to_be_in_viewport()
            mini.set_viewport_size({'width':300,'height':440})
            assert mini.locator('#mole').bounding_box()['width']==300
            assert mini.locator('#mole').bounding_box()['height']==440
            assert mini.locator('.tunnel-window').evaluate("e=>parseFloat(getComputedStyle(e).borderRadius)")==0
            mini.set_viewport_size({'width':240,'height':320})
            assert page.locator('#floatMoleButton svg').count()==1
            assert mini.locator('#return svg').count()==1
            assert mini.locator('#toggle').inner_text()==''
            initial=page.evaluate('JSON.stringify([state.depth,state.balance,state.inventory])')
            # Idle petting uses the same sprite/animation state; no extra rewards.
            mini.locator('#pet').click();expect(mini.locator('#line')).to_have_count(0)
            mini.locator('#pet').click();mini.locator('#pet').click()
            assert page.evaluate('petSpinAt>0')
            assert page.evaluate('JSON.stringify([state.depth,state.balance,state.inventory])')==initial
            mini.locator('#toggle').click();expect(page.locator('#startText')).to_have_text('Pause')
            expect(mini.locator('#line')).to_have_count(0)
            expect(mini.locator('#pet')).to_be_disabled()
            # Navigate the original app away from Focus and switch to another real browser tab.
            page.evaluate("navigateTo('home')")
            other=ctx.new_page();other.goto('about:blank');other.bring_to_front()
            clock=mini.locator('#time').inner_text();frame=mini.locator('#mole').evaluate('c=>c.toDataURL()')
            page.wait_for_timeout(1600)
            assert mini.locator('#time').inner_text()!=clock
            frames=set()
            for _ in range(4):
                frames.add(mini.locator('#mole').evaluate('c=>c.toDataURL()'));page.wait_for_timeout(160)
            assert len(frames)>1,'Visible floating scene must animate independently of main-page RAF'
            mini.locator('#toggle').click();expect(page.locator('#startText')).to_have_text('Resume')
            elapsed=page.evaluate('state.session.elapsed');page.wait_for_timeout(500)
            assert page.evaluate('state.session.elapsed')==elapsed
            expect(mini.locator('#line')).to_have_count(0)
            expect(mini.locator('#pet')).to_be_in_viewport()
            mini.screenshot(path=str(ROOT/'docs/images/eumo-floating-crisp.png'))
            # Main -> mini synchronization, closing/reopening never settles or pauses a session.
            page.evaluate("document.getElementById('startButton').click()")
            expect(mini.locator('#toggle')).to_have_attribute('aria-label','Pause')
            session=page.evaluate('state.session.id');mini.close()
            expect(page.locator('#floatMoleButton')).to_have_attribute('aria-pressed','false')
            assert page.evaluate('state.session.id')==session and page.evaluate('state.session.status')=='running'
            mini=open_pip();expect(mini.locator('#toggle')).to_have_attribute('aria-label','Pause')
            mini.locator('#end').click();expect(mini.locator('#confirmation')).to_be_visible()
            mini.locator('#keep').click();assert page.evaluate('state.session.id')==session
            mini.locator('#end').click();mini.locator('#save').click()
            assert page.evaluate('state.session') is None
            expect(mini.locator('#line')).to_have_count(0)
            assert page.evaluate('state.history.length')==1
            mini.locator('#save').dispatch_event('click');assert page.evaluate('state.history.length')==1
            # Break means rest, never digging; natural deadline settles exactly once while mini is open.
            page.evaluate("state.mode='rest';renderTimer()")
            mini.locator('#toggle').click();expect(mini.locator('#line')).to_have_count(0)
            mini.locator('#end').click();mini.locator('#save').click()
            page.evaluate("state.mode='study';state.minutes=5;renderTimer()")
            mini.locator('#toggle').click()
            page.evaluate('state.session.elapsed=299;state.session.trackedAt=Date.now();state.session.deadline=Date.now()+1000;save()')
            balance=page.evaluate('state.balance');history=page.evaluate('state.history.length')
            page.wait_for_timeout(1600)
            expect(mini.locator('#mode')).to_have_text('Session saved')
            assert page.evaluate('state.balance')==balance+1
            assert page.evaluate('state.history.length')==history+1
            page.wait_for_timeout(700);assert page.evaluate('state.balance')==balance+1
            mini.locator('#return').click();expect(page.locator('#focus')).to_be_visible()
            expect(page.locator('#floatMoleButton')).to_have_attribute('aria-pressed','false')
            assert mini.is_closed()
            page.locator('#claimButton').click()
            # Failed browser request is recoverable, and unsupported browsers get a clear explanation.
            page.evaluate("()=>{documentPictureInPicture.requestWindow=async()=>{throw new DOMException('Blocked','NotAllowedError')}}")
            page.locator('#floatMoleButton').click();expect(page.locator('#toast')).to_contain_text('Could not open')
            expect(page.locator('#floatMoleButton')).to_be_enabled()
            page.evaluate("Object.defineProperty(window,'documentPictureInPicture',{value:undefined,configurable:true})")
            page.locator('#floatMoleButton').click();expect(page.locator('#floatingHelpDialog')).to_be_visible()
            page.locator('#floatingHelpDialog .dialog-close').click()
            # Real high-density window: backing pixels follow the device, while sprite pixels stay whole.
            retina=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=2)
            retina.add_init_script(f"localStorage.setItem('eumo-tour-v1','seen');localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
            owner=retina.new_page();owner.goto(url+'/#focus')
            with retina.expect_page() as event:owner.locator('#floatMoleButton').click()
            high=event.value;high.wait_for_selector('#mole');high.set_viewport_size({'width':256,'height':360})
            high.wait_for_function("()=>{const c=document.getElementById('mole');return c.width===256*Math.ceil(devicePixelRatio)&&c.height===360*Math.ceil(devicePixelRatio)}")
            high.screenshot(path=str(ROOT/'docs/images/eumo-floating-retina.png'))
            high.locator('#pet').click();assert owner.evaluate('petAt>0')
            high.locator('#return').click();retina.close()
            # Offline distribution contains the same functional view and cleans up on owner navigation.
            offline=browser.new_context();offline.add_init_script("localStorage.setItem('eumo-tour-v1','seen')");download=offline.new_page();download.goto(url+'/dist/Eumo.html');download.locator('#enterGame').click();offline.set_offline(True)
            with offline.expect_page() as event:download.locator('#floatMoleButton').click()
            child=event.value;child.wait_for_selector('#toggle');child.locator('#toggle').click()
            expect(download.locator('#startText')).to_have_text('Pause')
            download.close();child.wait_for_event('close') if not child.is_closed() else None
            assert not errors,errors
            browser.close()
        print('PASS: actual Document PiP; shared timer and rewards; animated clothed mole across tabs; idle triple tap; pause/resume/rest/end/expiry; close/reopen/return/cleanup; unsupported/request failure; offline bundle.')
    finally:
        proc.terminate();proc.wait(timeout=5)

if __name__=='__main__':run()
