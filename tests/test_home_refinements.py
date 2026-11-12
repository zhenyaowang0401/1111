"""Background migration, clipped animation, reduced motion and visiting a friend."""
import os,subprocess,shutil,json
from playwright.sync_api import sync_playwright
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True);url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  seed={'profile':{'name':'Luka','color':'#a9b4c6','configured':True},'balance':10,'inventory':[5,5,5,5],'owned':['mushroomhat','starhat','fossilhat','crystalhat'],'home':{'theme':'starlit','ownedThemes':['cave','forest','rainforest','snow','starlit'],'owned':['rug'],'slots':{'floor':'rug'}}}
  page.add_init_script("localStorage.setItem('eumo-tour-v1','seen');if(!localStorage.getItem('loop-pet-soft-universe-v1'))localStorage.setItem('loop-pet-soft-universe-v1',"+json.dumps(json.dumps(seed))+");")
  page.goto(url+'/#home');assert page.evaluate('state.balance')==250;page.reload();assert page.evaluate('state.balance')==250
  # Render only the animation layer: it changes with time and never touches soil,
  # the centre ladder or the floor below the wall murals.
  for id in ['forest','rainforest','snow','starlit']:
   result=page.evaluate('''id=>{const theme=HomeCatalog.themes.find(t=>t.id===id),c=document.createElement('canvas');c.width=640;c.height=360;const g=c.getContext('2d');const frame=f=>{g.clearRect(0,0,640,360);HomeScenery.animate(g,theme,f);return c.toDataURL()};const first=frame(15),next=frame(42);const empty=[[10,100,10,200],[302,40,15,175],[100,155,80,4]].every(([x,y,w,h])=>!g.getImageData(x,y,w,h).data.some(v=>v));return {changed:first!==next,empty};}''',id)
   assert result['changed'] and result['empty'],(id,result)
   page.evaluate("id=>{state.home.theme=id;renderHome();}",id);page.wait_for_timeout(150);page.locator('#homeCanvas').screenshot(path='/tmp/eumo-animated-'+id+'.png')
  # Respect the OS preference and retain the decorative static wallpaper.
  page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(200);before=page.locator('#homeCanvas').evaluate('c=>c.toDataURL()');page.wait_for_timeout(500);assert page.locator('#homeCanvas').evaluate('c=>c.toDataURL()')==before
  page.emulate_media(reduced_motion='no-preference');page.wait_for_timeout(300);assert page.locator('#homeCanvas').evaluate('c=>c.toDataURL()')!=before
  # Friend visits get the same moving background, without changing our saved home.
  page.evaluate("()=>{PixelArt.drawHomePreview(document.querySelector('#friendHomeCanvas'),{profile:state.profile,equipped:[],home:{theme:'snow',slots:{floor:'rug'}}});document.querySelector('#friendHomeDialog').showModal();}")
  page.wait_for_timeout(200);first=page.locator('#friendHomeCanvas').evaluate('c=>c.toDataURL()');page.wait_for_timeout(600);assert page.locator('#friendHomeCanvas').evaluate('c=>c.toDataURL()')!=first
  assert not errors,errors;b.close();print('PASS: one-time price credit after reload, four moving wallpapers, clipped particles, reduced-motion freeze and animated friend visits.')
finally:proc.terminate();proc.wait()
