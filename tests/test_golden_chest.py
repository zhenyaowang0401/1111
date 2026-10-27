"""Earn a golden find via the timer, then manage the same inventory from the home chest."""
import json, os, shutil, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT = Path(__file__).resolve().parents[1]
KEY = 'loop-pet-soft-universe-v1'

def run():
    proc = subprocess.Popen(['node', 'scripts/dev_server.cjs'], cwd=ROOT,
        env={**os.environ, 'PORT':'0'}, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    url = proc.stdout.readline().strip().split('Eumo: ')[1]
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=shutil.which('chromium'), args=['--no-sandbox'])
            page = browser.new_page(viewport={'width':1280,'height':800})
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            seed = {'profile':{'name':'Momo','color':'#b784cf','configured':True},
                'inventory':[2,2,1,1], 'rareSeed':'0123456789abcdef0123456789abcdef'}
            page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
            page.goto(url+'/#focus'); page.clock.install()
            page.evaluate('state.eligibleSeconds=1200;state.rareClaimed=2;state.minutes=10;save();renderTimer();')
            page.locator('#startButton').click(); page.clock.fast_forward(601000)
            expect(page.locator('#goldenFinishCopy')).to_contain_text('Sanxingdui')
            page.locator('#claimButton').click()
            page.locator('[data-page="home"]').click(); page.locator('#openChestShortcut').click()
            chest = page.locator('#chestItems')
            expect(chest.locator('[data-golden-chest-slot]')).to_have_count(10)
            expect(chest.locator('[data-golden-chest-slot="sanxingdui"] .slot-count')).to_have_text('1')
            expect(chest.locator('[data-display-treasure="sanxingdui"]')).to_be_enabled()
            chest.locator('[data-display-treasure="sanxingdui"]').click()
            expect(page.locator('#chestDialog')).to_be_hidden()
            page.clock.run_for(250)
            pixels = page.locator('#homeCanvas').evaluate("c=>{const p=c.getContext('2d').getImageData(247,130,32,32).data;let n=0;for(let i=0;i<p.length;i+=4)if(p[i]===233&&p[i+1]===184&&p[i+2]===78)n++;return n;}")
            assert pixels>50, 'Golden find must actually appear on the room canvas'
            page.reload(); page.locator('#openChestShortcut').click()
            expect(chest.locator('[data-sell-treasure="sanxingdui"]')).to_be_disabled()
            assert page.evaluate('state.displayedTreasure')=='sanxingdui'
            chest.locator('[data-store-treasure="sanxingdui"]').click()
            assert page.evaluate('state.rareInventory.sanxingdui')==1
            expect(chest.locator('[data-sell-treasure="sanxingdui"]')).to_be_enabled()
            balance = page.evaluate('state.balance')
            chest.locator('[data-sell-treasure="sanxingdui"]').click(); page.locator('#cancelTreasureSale').click()
            assert page.evaluate('state.balance')==balance
            chest.locator('[data-sell-treasure="sanxingdui"]').click(); page.locator('#confirmTreasureSale').click()
            expect(chest.locator('[data-golden-chest-slot="sanxingdui"] .slot-count')).to_have_text('0')
            expect(chest.locator('[data-sell-treasure="sanxingdui"]')).to_be_disabled()
            page.locator('#confirmTreasureSale').dispatch_event('click')
            assert page.evaluate('state.balance')==balance+99
            expect(page.locator('#goldenGrid [data-display-treasure="sanxingdui"]')).to_be_disabled()
            # Ordinary chest still uses head display, without touching the golden inventory.
            chest.locator('[data-chest-slot="mushroom"]').click(); chest.locator('[data-hold="mushroom"]').click()
            assert page.evaluate('state.heldItem')=='mushroom'
            page.reload(); assert page.evaluate('state.rareInventory.sanxingdui')==0
            # All ten kinds, duplicates, pause/run locks, and a small touch-sized viewport.
            page.evaluate('state.rareInventory=Object.fromEntries(RareTreasures.items.map(i=>[i.id,2]));save();renderStats();')
            page.locator('[data-page="focus"]').click(); page.locator('#startButton').click()
            page.locator('[data-page="home"]').click(); page.locator('#openChestShortcut').click()
            expect(chest.locator('[data-display-treasure]')).to_be_disabled()
            page.locator('#chestDoneButton').click(); page.locator('[data-page="focus"]').click();page.locator('#startButton').click()
            page.locator('[data-page="home"]').click();page.locator('#openChestShortcut').click()
            page.set_viewport_size({'width':390,'height':844})
            for id in page.evaluate('RareTreasures.items.map(i=>i.id)'):
                chest.locator('[data-golden-chest-slot="'+id+'"]').click()
                expect(chest.locator('[data-display-treasure="'+id+'"]')).to_be_enabled()
                assert page.locator('#chestDialog').evaluate('d=>d.scrollWidth<=d.clientWidth')
            chest.locator('[data-display-treasure="gold-camera"]').click()
            assert page.evaluate('state.displayedTreasure')=='gold-camera'
            assert page.evaluate('state.rareInventory["gold-camera"]')==2
            assert not errors, errors
            browser.close()
        print('PASS: earned golden find appears in chest; actual room display, reload, put back, cancel/sell +99 once; collection sync; all ten kinds; pause/run locks; ordinary head display; mobile scrolling.')
    finally:
        proc.terminate();proc.wait(timeout=5)

if __name__=='__main__':run()
