"""Material wardrobe purchases, category fitting, persistence and displayed stock."""
import os,subprocess,shutil,json
from playwright.sync_api import sync_playwright
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True);url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  seed={'profile':{'name':'Luka','color':'#a9b4c6','configured':True},'balance':11,'inventory':[1,72,72,72],'owned':['mushroomhat','fossilhat','crystalhat'],'equipped':['mushroomhat'],'home':{'theme':'cave','owned':['rug'],'slots':{'floor':'rug','wall':'find:mushroom'}}}
  page.add_init_script("localStorage.setItem('eumo-tour-v1','seen');if(!localStorage.getItem('loop-pet-soft-universe-v1'))localStorage.setItem('loop-pet-soft-universe-v1',"+json.dumps(json.dumps(seed))+");")
  page.goto(url+'/#wardrobe');page.wait_for_timeout(150)
  assert page.locator('.outfit-card[data-rarity="relic"]').count()==13
  assert len(set(page.locator('.outfit-card[data-rarity="relic"]').evaluate_all('els=>els.map(e=>getComputedStyle(e).borderTopColor)')))==1
  additions=page.evaluate("WardrobeCatalog.items.filter(i=>i.recipe&&i.category!=='hats')")
  for item in additions:
   page.locator('[data-category="'+item['category']+'"]').click();button=page.locator('[data-item="'+item['id']+'"]');button.click()
   assert page.evaluate('id=>state.owned.includes(id)&&state.equipped.includes(id)',item['id'])
   # Toggling ownership never charges a recipe again.
   before=page.evaluate('state.inventory');button.click();button.click();assert page.evaluate('state.inventory')==before
  assert page.evaluate('state.inventory')==[1,2,2,2];assert page.evaluate('state.balance')==11
  assert page.evaluate("state.home.slots.wall==='find:mushroom'")
  page.reload();assert page.evaluate("state.equipped.includes('prismglasses')&&state.equipped.includes('prismscarf')&&state.equipped.includes('prismpendant')")
  # Exhausted stock cannot redeem an unowned hat or consume a displayed copy.
  page.locator('[data-category="hats"]').click();page.locator('[data-item="starhat"]').click();assert not page.evaluate("state.owned.includes('starhat')")
  # Three matching outfits in the real preview, including material tier styling.
  for prefix,hat in [('forager','mushroomhat'),('spiral','fossilhat'),('prism','crystalhat')]:
   extra=prefix+('pendant' if prefix=='prism' else 'brooch')
   page.evaluate("ids=>{state.equipped=ids;save();renderStats();}",[hat,prefix+'glasses',prefix+'scarf',extra]);page.wait_for_timeout(180)
   page.locator('.fitting-room').screenshot(path='/tmp/eumo-set-'+prefix+'.png')
  page.locator('[data-category="glasses"]').click();page.locator('[data-item="prismglasses"]').scroll_into_view_if_needed();page.locator('.closet').screenshot(path='/tmp/eumo-relic-shop.png')
  # Small screens retain reachable purchase/equip controls and one rarity colour.
  page.set_viewport_size({'width':390,'height':844});page.locator('[data-category="scarves"]').click();page.locator('[data-item="foragerscarf"]').click();assert page.evaluate("state.equipped.includes('foragerscarf')")
  assert not errors,errors;print('PASS: nine material exchanges, reserved stock, no repeat cost, category equipment, reload, unified tier and mobile controls.');b.close()
finally:proc.terminate();proc.wait()
