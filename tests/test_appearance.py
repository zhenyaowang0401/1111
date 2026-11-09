"""Manual appearance, local-time boundaries, persistence and simplified wardrobe."""
from pathlib import Path
from datetime import datetime, timezone
import os, subprocess
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True)
url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  ctx=browser.new_context(viewport={'width':1440,'height':960},timezone_id='America/New_York')
  ctx.add_init_script("localStorage.setItem('eumo-tour-v1','seen');localStorage.setItem('loop-pet-soft-universe-v1',JSON.stringify({profile:{name:'Momo',color:'#a9b4c6',configured:true}}))")
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.clock.install(time=datetime(2026,11,9,18,tzinfo=timezone.utc));page.goto(url+'/#focus')
  expect(page.locator('#devicePeriod')).to_have_attribute('data-icon','sun')
  before=page.locator('#deviceTime').inner_text()
  def choose(mode):
   page.locator('#devicePeriod').click();page.locator('[data-appearance="'+mode+'"]').click()
  choose('night');expect(page.locator('body')).to_have_attribute('data-period','night')
  assert page.locator('#deviceTime').inner_text()==before
  expect(page.locator('#devicePeriod')).to_have_attribute('data-icon','moon')
  assert page.locator('.painted-night image').get_attribute('href').endswith('flower-night.png')
  page.screenshot(path=str(ROOT/'docs/images/eumo-appearance-night.png'))
  page.reload();expect(page.locator('body')).to_have_attribute('data-period','night')
  choose('day');expect(page.locator('#devicePeriod')).to_have_attribute('data-icon','sun')
  page.screenshot(path=str(ROOT/'docs/images/eumo-appearance-day.png'))
  choose('auto')
  # The boundary is 19:00 on this device, not 19:00 UTC.
  page.clock.set_system_time(datetime(2026,11,9,23,59,tzinfo=timezone.utc));page.wait_for_timeout(350)
  expect(page.locator('#devicePeriod')).to_have_attribute('data-icon','sun')
  page.clock.set_system_time(datetime(2026,11,10,0,0,tzinfo=timezone.utc));page.wait_for_timeout(350)
  expect(page.locator('#devicePeriod')).to_have_attribute('data-icon','moon')
  page.clock.set_system_time(datetime(2026,11,10,11,0,tzinfo=timezone.utc));page.wait_for_timeout(350)
  expect(page.locator('#devicePeriod')).to_have_attribute('data-icon','sun')
  page.evaluate("navigateTo('wardrobe')");expect(page.locator('#equippedCount')).to_have_count(0);expect(page.locator('#momoLevel')).to_have_count(0);expect(page.locator('.rarity-badge')).to_have_count(0)
  page.screenshot(path=str(ROOT/'docs/images/eumo-rarity-shop.png'))
  colors=page.locator('.outfit-card').evaluate_all('els=>Object.fromEntries(els.map(e=>[e.dataset.rarity,getComputedStyle(e).borderTopColor]))')
  assert len(set(colors.values()))>=3,colors
  page.evaluate("navigateTo('focus');EumoI18n.set('zh')");page.locator('#devicePeriod').click();expect(page.locator('[data-appearance="auto"]')).to_contain_text('自动');page.keyboard.press('Escape');expect(page.locator('#appearanceOptions')).to_be_hidden()
  page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(ROOT/'docs/images/eumo-appearance-mobile.png'))
  page.goto(url+'/dist/Eumo.html');ctx.set_offline(True);choose('night');expect(page.locator('body')).to_have_attribute('data-period','night')
  assert page.locator('.painted-night image').get_attribute('href').startswith('data:image/png;base64,')
  assert not errors,errors
  browser.close();print('PASS: device-time dawn/dusk, manual selection, persistence, unchanged clock, wardrobe cues, Chinese menu, mobile and offline theme.')
finally:proc.terminate();proc.wait()
