"""Shop/Owned filtering through actual purchases, equipment and empty categories."""
import os,subprocess,shutil,json
from playwright.sync_api import sync_playwright,expect
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True);url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox']);page=browser.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  seed={'profile':{'name':'Luka','color':'#a9b4c6','configured':True},'balance':1000,'inventory':[50,50,50,50],'owned':['hat','glasses','scarf','mushroomhat'],'equipped':['hat','glasses','scarf'],'ownedTools':['spoon'],'tool':'spoon'}
  page.add_init_script("localStorage.setItem('eumo-tour-v1','seen');if(!localStorage.getItem('loop-pet-soft-universe-v1'))localStorage.setItem('loop-pet-soft-universe-v1',"+json.dumps(json.dumps(seed))+");")
  page.goto(url+'/#wardrobe');expect(page.locator('#closetTitle')).to_have_text('Shop')
  def mode(name):page.locator('[data-filter="'+name+'"]').click()
  def category(name):page.locator('[data-category="'+name+'"]').click()
  def ids():return page.locator('#outfitGrid [data-item],#outfitGrid [data-tool]').evaluate_all('els=>els.map(e=>e.dataset.item||e.dataset.tool)')
  def buttons():return page.locator('#outfitGrid .item-action button').all_text_contents()
  assert not set(ids())&{'hat','glasses','scarf','mushroomhat','spoon'}
  assert 'shovel' in ids() and 'foragerglasses' in ids();assert set(buttons())=={'Buy','Redeem'}
  expect(page.locator('#ownedCount')).to_have_text('5');assert int(page.locator('#shopCount').inner_text())==len(ids())
  category('glasses');assert page.locator('[data-category="glasses"] small').inner_text()=='8'
  page.locator('[data-item="roundglasses"]').click();assert 'roundglasses' not in ids();assert page.evaluate('state.balance')==992
  expect(page.locator('#ownedCount')).to_have_text('6');expect(page.locator('[data-category="glasses"] small')).to_have_text('7')
  mode('owned');expect(page.locator('#closetTitle')).to_have_text('Owned');assert set(ids())=={'glasses','roundglasses'};assert not set(buttons())&{'Buy','Redeem'}
  expect(page.locator('[data-category="glasses"]')).to_have_attribute('aria-pressed','true');expect(page.locator('#shopScroll')).to_have_attribute('aria-label','Owned items')
  page.locator('[data-item="roundglasses"]').click();assert not page.evaluate("state.equipped.includes('roundglasses')");page.locator('[data-item="glasses"]').click();assert page.evaluate("state.equipped.includes('glasses')");assert page.evaluate('state.balance')==992
  mode('shop');category('hats');page.locator('[data-item="starhat"]').click();assert 'starhat' not in ids();assert page.evaluate('state.inventory[0]')==10
  mode('owned');assert 'starhat' in ids();assert 'Buy' not in buttons();page.locator('[data-item="starhat"]').click();assert page.evaluate('state.inventory[0]')==10
  # Tools belong to the same two views, including All types.
  mode('shop');category('all');page.locator('[data-tool="shovel"]').click();assert 'shovel' not in ids();assert page.evaluate('state.balance')==932
  assert page.locator('#toolShopNote').is_hidden();mode('owned');assert 'spoon' in ids() and 'shovel' in ids();category('tools');assert page.locator('#toolShopNote').is_visible()
  page.locator('#resetTool').click();assert page.evaluate('state.tool') is None;assert set(ids())=={'spoon','shovel'};page.locator('[data-tool="spoon"]').click();assert page.evaluate('state.tool')=='spoon'
  page.reload();mode('owned');assert {'roundglasses','starhat','shovel'}<=set(ids());assert page.evaluate('state.balance')==932
  page.locator('.wardrobe-layout').screenshot(path='/tmp/eumo-owned-view.png');mode('shop');page.locator('.wardrobe-layout').screenshot(path='/tmp/eumo-shop-view.png')
  # Bought-out categories lead to the same category in Owned, not an empty shop loop.
  page.evaluate("state.owned=[...new Set([...state.owned,...outfits.filter(i=>i.category==='glasses').map(i=>i.id)])];renderStats()")
  category('glasses');expect(page.locator('.closet-empty')).to_contain_text('You own everything in this category.');page.locator('[data-closet-switch="owned"]').click();assert len(ids())==9
  # Buying everything and having nothing each have a useful destination.
  page.evaluate("state.owned=outfits.map(i=>i.id);state.ownedTools=tools.map(i=>i.id);renderStats()");mode('shop');category('all');expect(page.locator('.closet-empty')).to_contain_text('You own everything here.');expect(page.locator('#shopCount')).to_have_text('0')
  page.evaluate("state.owned=[];state.ownedTools=[];state.equipped=[];state.tool=null;renderStats()");mode('owned');expect(page.locator('.closet-empty')).to_contain_text('Your wardrobe is empty.');category('extras');expect(page.locator('.closet-empty')).to_contain_text('No owned items in this category.');page.locator('[data-closet-switch="shop"]').click();assert len(ids())==11
  page.set_viewport_size({'width':390,'height':844});mode('owned');page.evaluate("EumoI18n.set('zh')");expect(page.locator('#closetTitle')).to_have_text('已拥有');expect(page.locator('.closet-empty')).to_contain_text('你还没有这个类别的物品');page.locator('[data-closet-switch="shop"]').click();expect(page.locator('#closetTitle')).to_have_text('商店')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors
  browser.close();print('PASS: exclusive Shop/Owned lists, scoped counts, buys/redemptions, equipment, tools, persistence, bought-out/empty views and mobile Chinese UI.')
finally:proc.terminate();proc.wait()
