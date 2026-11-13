"""Click/tap home routes, movement animation, editing isolation and local visits."""
import os,subprocess,shutil,json
from playwright.sync_api import sync_playwright
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True);url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  seed={'profile':{'name':'Luka','color':'#a9b4c6','configured':True},'balance':100,'owned':['starhat','glasses'],'equipped':['starhat','glasses'],'home':{'theme':'forest','ownedThemes':['cave','forest'],'backgroundPriceVersion':2,'owned':['rug','lamp'],'slots':{'floor':'rug','right':'lamp'}}}
  page.add_init_script("localStorage.setItem('eumo-tour-v1','seen');if(!localStorage.getItem('loop-pet-soft-universe-v1'))localStorage.setItem('loop-pet-soft-universe-v1',"+json.dumps(json.dumps(seed))+");")
  page.goto(url+'/#home');page.wait_for_timeout(180)
  def snap(key='home'):return page.evaluate('key=>HomeWalk.snapshot(key)',key)
  def xy(x,y,id='homeCanvas'):
   r=page.locator('#'+id).bounding_box();return r['x']+x*r['width']/640,r['y']+y*r['height']/360
  def click(x,y,id='homeCanvas'):page.mouse.click(*xy(x,y,id))
  def arrive(key='home'):page.wait_for_function('key=>!HomeWalk.snapshot(key).moving',arg=key,timeout=15000)
  original=page.evaluate('JSON.stringify(state.home)');balance=page.evaluate('state.balance')
  # Independently rasterized cave geometry must clear the mole along every route.
  assert page.evaluate("""()=>HomeNavigation.edges.every(edge=>{const a=HomeNavigation.nodes[edge.a],b=HomeNavigation.nodes[edge.b];for(let n=0;n<=40;n++){const x=a[0]+(b[0]-a[0])*n/40,y=a[1]+(b[1]-a[1])*n/40;for(const [dx,dy] of [[0,-2],[-18,-24],[18,-24],[-14,-38],[14,-38],[0,-42]])if(!HomeScenery.destination(x+dx,y+dy))return false;}return true;})""")
  click(170,270);page.wait_for_timeout(180);assert snap()['moving'] and snap()['facing']==-1
  page.locator('#homeCanvas').screenshot(path='/tmp/eumo-walk-left.png');arrive();assert abs(snap()['x']-170)<1
  click(540,280);page.wait_for_timeout(180);assert snap()['facing']==1;page.locator('#homeCanvas').screenshot(path='/tmp/eumo-walk-right.png')
  # Re-target mid-stride, climb to the upper room, then come back downstairs.
  click(140,105);page.wait_for_function("HomeWalk.snapshot().motion==='climb' && HomeWalk.snapshot().moving");page.wait_for_timeout(450)
  page.locator('#homeCanvas').screenshot(path='/tmp/eumo-walk-climb.png');arrive();assert abs(snap()['x']-140)<1 and snap()['y']==149
  click(520,100);arrive();assert abs(snap()['x']-520)<1 and snap()['y']==177,snap()
  click(540,280);page.wait_for_function("HomeWalk.snapshot().motion==='climb' && HomeWalk.snapshot().climbDirection===1");arrive();assert snap()['y']==310
  # Soil is not a destination; dragging/panning the home is not a click to walk.
  before=snap();click(15,220);assert snap()==before
  page.mouse.move(*xy(200,250));page.mouse.down();page.mouse.move(*xy(150,270),steps=10);page.mouse.up();page.wait_for_timeout(80);assert not snap()['moving']
  page.wait_for_timeout(450);page.locator('#editHomeButton').click();before=snap();click(150,100);page.wait_for_timeout(160);assert snap()==before
  page.locator('#editHomeButton').click();assert page.evaluate('JSON.stringify(state.home)')==original
  # Pet the stationary mole at its current position, not its old spawn position.
  a=snap();click(a['x'],a['y']-20);assert page.locator('#homeSpeech').is_visible();assert not snap()['moving']
  page.emulate_media(reduced_motion='reduce');click(160,110);arrive();assert snap()['y']==149;page.emulate_media(reduced_motion='no-preference')
  assert page.evaluate('state.balance')==balance
  # Walking is available during a running focus session and does not pause it.
  page.locator('[data-page="focus"]').click();page.locator('#startButton').click();page.locator('[data-page="home"]').click();click(500,120);page.wait_for_timeout(150)
  assert snap()['moving'];assert page.evaluate("state.session.status==='running'");page.evaluate('HomeWalk.stop()')
  # Local visit fixture exercises the actual shared renderer and canvas handlers.
  page.evaluate("()=>{HomeWalk.visit('friend-a');PixelArt.drawHomePreview(document.querySelector('#friendHomeCanvas'),{profile:{name:'Host',color:'#7dcbb4'},equipped:[],home:state.home,visitor:{profile:state.profile,equipped:state.equipped}});document.querySelector('#friendHomeDialog').showModal();}")
  own=snap();click(140,100,'friendHomeCanvas');arrive('visit');assert snap('visit')['y']==149 and snap()==own
  page.locator('#friendHomeCanvas').screenshot(path='/tmp/eumo-walk-visit.png');at=snap('visit');page.evaluate("HomeWalk.visit('friend-a')");assert snap('visit')==at
  assert page.evaluate('JSON.stringify(state.home)')==original
  page.locator('#closeFriendHome').click();page.wait_for_timeout(50);assert snap('visit') is None
  page.evaluate("HomeWalk.visit('friend-b')");assert snap('visit')['x']==312 and snap('visit')['y']==316;page.evaluate('HomeWalk.leaveVisit()')
  # Mobile tap moves, while a horizontal swipe is reserved for viewport scrolling.
  page.set_viewport_size({'width':390,'height':844});page.locator('#homeCanvas').scroll_into_view_if_needed();cdp=page.context.new_cdp_session(page);cdp.send('Emulation.setTouchEmulationEnabled',{'enabled':True})
  point=xy(120,110);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':point[0],'y':point[1]}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(200);assert snap()['moving'];arrive()
  point=xy(200,120);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':point[0],'y':point[1]}]})
  for i in range(1,7):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':point[0]-i*15,'y':point[1]}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(200);assert not snap()['moving']
  assert not errors,errors;b.close();print('PASS: click routes, left/right/climb, retargeting, petting, soil/drag rejection, editing isolation, active timer, reduced motion, visitor isolation and mobile tap/swipe.')
finally:proc.terminate();proc.wait()
