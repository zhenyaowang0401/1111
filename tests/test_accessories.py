"""Retired wardrobe migration and small accessory rendering; language selector proposal only."""
import json,subprocess,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1];key='loop-pet-soft-universe-v1'
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=root,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True);url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1200,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  seed={'profile':{'name':'Luka','configured':True,'color':'#b784cf'},'balance':200,'owned':['sweater','coat','hoodie','uniform','puffer','coat','star','hat'],'equipped':['coat','star','hat'],'inventory':[3,2,1,4],'depth':99,'progressVersion':2}
  page.add_init_script("if(!localStorage.getItem('%s'))localStorage.setItem('%s',%s)"%(key,key,json.dumps(json.dumps(seed))))
  page.goto(url+'/#wardrobe');expect(page.locator('[data-category="clothes"]')).to_have_count(0);assert page.evaluate('state.balance')==312;assert page.evaluate('state.owned')==['star','hat'];assert page.evaluate('state.equipped')==['star','hat'];assert page.evaluate('state.inventory')==[3,2,1,4];assert page.evaluate('state.depth')==99
  page.reload();assert page.evaluate('state.balance')==312
  page.locator('[data-category="extras"]').click();expect(page.locator('.outfit-card')).to_have_count(8)
  # Isolated actual mole portraits: shared sprite, eight distinct small accessories.
  result=page.evaluate("""()=>{const pins=WardrobeCatalog.items.filter(i=>i.category==='extras');const result=[];for(const pin of pins){const c=document.createElement('canvas');c.width=c.height=128;PixelArt.drawPortrait(c,{...state,equipped:[pin.id]});result.push(c.toDataURL())}return result}""")
  assert len(set(result))==8
  for pin in ['heartpin','moonpin','crystalpin']:
   before=page.evaluate('state.balance');cost=page.evaluate('(id)=>WardrobeCatalog.items.find(i=>i.id===id).cost',pin);page.locator('[data-item="'+pin+'"]').click();assert page.evaluate('state.balance')==before-cost;assert page.evaluate("state.equipped.filter(id=>WardrobeCatalog.items.find(i=>i.id===id).category==='extras')")==[pin]
  page.reload();assert page.evaluate('state.equipped')==['hat','crystalpin'];page.evaluate("EumoI18n.set('zh')");page.locator('[data-category="extras"]').click();expect(page.locator('#outfitGrid')).to_contain_text('水晶胸针')
  page.screenshot(path=str(root/'docs/images/eumo-small-accessories.png'),full_page=True)
  # Language choices remain a standalone proposal: interaction works without changing the app.
  preview=b.new_page(viewport={'width':1160,'height':690});preview.goto(url+'/docs/previews/language-picker.html');preview.screenshot(path=str(root/'docs/images/eumo-language-options.png'),full_page=True)
  first=preview.locator('.picker').first;first.locator('[data-lang="en"]').click();expect(first.locator('.current')).to_have_text('English');expect(first.locator('.menu')).to_be_hidden();first.locator('.trigger').click();preview.keyboard.press('Escape');expect(first.locator('.menu')).to_be_hidden()
  preview.set_viewport_size({'width':390,'height':844});assert not preview.evaluate('document.documentElement.scrollWidth>innerWidth')
  # Offline bundle migrates the old wardrobe too.
  offline=b.new_page();offline.add_init_script("localStorage.setItem('%s',%s)"%(key,json.dumps(json.dumps(seed))));offline.goto(url+'/dist/Eumo.html');assert offline.evaluate('state.balance')==312;assert offline.evaluate('state.equipped')==['star','hat']
  assert not errors,errors;b.close();print('PASS: legacy clothing refunds once, removes equipped clothes, retains inventory/depth/hats, eight distinct pins, exact purchases and replacement, persisted/bilingual wardrobe, offline migration; separate language preview menu and mobile layout.')
finally:proc.terminate();proc.wait()
