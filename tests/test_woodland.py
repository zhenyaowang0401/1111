"""Theme transitions must preserve play and keep text/controls usable in every mode."""
from datetime import datetime, timezone
from pathlib import Path
import json
import os
import subprocess
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
KEY = 'loop-pet-soft-universe-v1'

# Check actual computed paint (including inherited backgrounds), rather than token names.
CONTRAST = r"""elements => {
 const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
 const lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
 return elements.filter(e=>e.checkVisibility()&&!e.closest(':disabled')).map(e=>{
  let p=e,bg;while(p){bg=rgb(getComputedStyle(p).backgroundColor);if(bg.length===3||bg[3]===1)break;p=p.parentElement;}
  const s=getComputedStyle(e),a=lum(rgb(s.color)),b=lum(bg);
  return {id:e.id||e.className,text:e.textContent.slice(0,40),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
 });
}"""


def run():
    proc = subprocess.Popen(['node', 'scripts/dev_server.cjs'], cwd=ROOT,
                            env={**os.environ, 'PORT': '0'}, stdout=subprocess.PIPE, text=True)
    url = proc.stdout.readline().strip().split('Eumo: ')[1]
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
            ctx = browser.new_context(viewport={'width': 1440, 'height': 960}, timezone_id='UTC')
            page = ctx.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.clock.install(time=datetime(2026, 11, 9, 13, tzinfo=timezone.utc))
            seed = {'profile': {'name': 'Momo', 'color': '#535e53', 'configured': True},
                    'balance': 125, 'depth': 32, 'surfaceDepth': 0, 'digDay': '2026-11-09',
                    'progressVersion': 2, 'owned': ['hat', 'leafpin'], 'equipped': [],
                    'inventory': [4, 3, 2, 1]}
            page.add_init_script(f"localStorage.setItem('eumo-tour-v1','seen');if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
            page.goto(url + '/#focus')
            ledger = page.evaluate('JSON.stringify([state.profile,state.balance,state.depth,state.inventory,state.owned])')
            selectors = {
                'start': '#setupTitle,.field-label,#selectedColorName,#colorHex,#enterGame',
                'focus': '#focusTitle,#mineStatus,#moleChatTitle,.task-label,#timerLabel,#startText,#durationLabel,.mission-stats>div>span,.chat-entry p>span,#moleChatSend',
                'home': '#homeTitle,#homePetName,#homeThemeName,#homeEditHint,#homeViewNote,#goldenDisplayLabel',
                'wardrobe': '#equipmentTitle,#equipmentPetName,#momoLevel,.outfit-card h3,.rarity-badge,.item-action button,.item-action>span,#equippedList',
                'reports': '#reportTitle,.report-stats article>span,#trendTotal,.report-note',
                'companions': '#companionsTitle,#friendsEmpty,#friendsStatus,.friend-list-heading>span'
            }
            def readable(selector):
                for item in page.locator(selector).evaluate_all(CONTRAST):
                    assert item['ratio'] >= 4.5, item

            backgrounds = set()
            for hour, period in [(7, 'morning'), (13, 'day'), (18, 'evening'), (22, 'night')]:
                page.clock.set_system_time(datetime(2026, 11, 9, hour, tzinfo=timezone.utc))
                expect(page.locator('body')).to_have_attribute('data-period', period)
                backgrounds.add(page.locator('body').evaluate('e=>getComputedStyle(e).backgroundColor'))
                for route, selected in selectors.items():
                    page.evaluate('(r)=>navigateTo(r)', route)
                    readable(selected)
                assert page.locator('.world-backdrop').evaluate('e=>getComputedStyle(e).pointerEvents') == 'none'
                assert page.locator('.night-sky').evaluate('e=>getComputedStyle(e).display') == ('inline' if period == 'night' else 'none')
                page.evaluate("navigateTo('focus')")
                page.locator('#openMusicLibrary').click()
                page.wait_for_timeout(220)
                readable('#musicDialogTitle,#musicNowTitle,.music-category strong,.music-category small,.music-track-copy strong,.music-track-copy small,.music-track-state')
                page.keyboard.press('Escape')
                page.evaluate("navigateTo('home')")
                page.locator('#openChestShortcut').click()
                readable('#chestHint,.chest-selection h3,.chest-selection small,.chest-selection button,.chest-footer button')
                page.keyboard.press('Escape')
            assert len(backgrounds) == 4
            assert page.evaluate('JSON.stringify([state.profile,state.balance,state.depth,state.inventory,state.owned])') == ledger

            # The themed dial is still a real keyboard-operable range, with synchronized values.
            page.evaluate("navigateTo('focus')")
            volume = page.locator('#musicVolume')
            before = int(volume.input_value())
            volume.focus(); page.keyboard.press('ArrowRight')
            expect(volume).to_have_value(str(before + 1))
            expect(page.locator('#musicLibraryVolume')).to_have_value(str(before + 1))
            assert page.evaluate('state.session') is None

            # Paint changes must not move the pet hit area or introduce a reward on petting.
            bounds = page.evaluate("PixelArt.getBounds('miningCanvas')")
            rect = page.locator('#miningCanvas').bounding_box()
            x = rect['x'] + (bounds['x'] + bounds['w']/2) / 384 * rect['width']
            y = rect['y'] + (bounds['y'] + bounds['h']/2) / 224 * rect['height']
            page.mouse.click(x, y)
            assert page.evaluate('petAt>0')
            assert page.evaluate('JSON.stringify([state.profile,state.balance,state.depth,state.inventory,state.owned])') == ledger

            # Real PiP inherits the clock palette while the existing session remains intact.
            page.locator('#startButton').click()
            page.locator('#startButton').click()
            session = page.evaluate('JSON.stringify(state.session)')
            with ctx.expect_page() as event:
                page.locator('#floatMoleButton').click()
            mini = event.value
            expect(mini.locator('body')).to_have_attribute('data-period', 'night')
            assert mini.locator('.mine-top').evaluate('e=>getComputedStyle(e).backgroundColor') == page.locator('.control-panel').evaluate('e=>getComputedStyle(e).backgroundColor')
            page.clock.set_system_time(datetime(2026, 11, 10, 7, tzinfo=timezone.utc))
            expect(mini.locator('body')).to_have_attribute('data-period', 'morning')
            assert mini.locator('.mine-top').evaluate('e=>getComputedStyle(e).backgroundColor') == page.locator('.control-panel').evaluate('e=>getComputedStyle(e).backgroundColor')
            assert page.evaluate('JSON.stringify(state.session)') == session
            mini.close()
            assert not errors, errors
            browser.close()
            print('PASS: four local-time palettes; six views, music and chest readable in every period; no ledger mutation; native keyboard volume; pet hit area; real PiP day/night synchronization without altering the paused session.')
    finally:
        proc.terminate(); proc.wait()


if __name__ == '__main__':
    run()
