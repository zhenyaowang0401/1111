"""Real browser coverage for V3: original audio, camera-only exploration, pet spin and golden settlement."""
import json,os,shutil,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];KEY='loop-pet-soft-universe-v1'
def run():
 proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);url=proc.stdout.readline().strip().split('Eumo: ')[1]
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1536,'height':960});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   seed={'profile':{'name':'Momo','color':'#b784cf','configured':True},'depth':140,'balance':20,'inventory':[3,2,1,1],'owned':['hat','glasses'],'equipped':['hat','glasses'],'rareSeed':'0123456789abcdef0123456789abcdef','rareInventory':{'sanxingdui':1,'mole-statue':2,'iphone18':1,'rog-laptop':1},'displayedTreasure':'mole-statue'}
   page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
   page.goto(url+'/#focus');page.clock.install();page.clock.run_for(250);assert page.title()=='Eumo v3 — Focus'
   # Pause/stop exploration is a camera operation. Running always follows the mole.
   assert page.evaluate('MineView.cameraFor(state)')>700
   original=page.evaluate('JSON.stringify([state.depth,state.balance,state.inventory,state.eligibleSeconds])')
   stage=page.locator('#petStage').bounding_box();x=stage['x']+stage['width']*.25;y=stage['y']+stage['height']*.35
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x,y+180,steps=12);page.mouse.up();assert page.evaluate('MineView.cameraFor(state)')<700
   assert page.evaluate('JSON.stringify([state.depth,state.balance,state.inventory,state.eligibleSeconds])')==original
   assert not page.evaluate('petAt'),'Dragging must not trigger pet reaction'
   page.locator('#mineToSurface').click();assert page.evaluate('MineView.cameraFor(state)')==0
   expect(page.locator('#mineViewLabel')).to_contain_text('0–23 m');page.locator('#petStage').focus();page.keyboard.press('End');assert page.evaluate('MineView.cameraFor(state)===MineView.maximum(state)')
   page.locator('#startButton').click();expect(page.locator('#mineBrowseControls')).to_be_hidden();page.mouse.move(x,y);page.mouse.down();page.mouse.move(x,y+180,steps=8);page.mouse.up();assert page.evaluate('MineView.cameraFor(state)===MineView.maximum(state)')
   page.clock.fast_forward(61000);page.locator('#startButton').click();elapsed=page.evaluate('state.session.elapsed');page.locator('#mineToSurface').click();page.clock.fast_forward(5000);assert page.evaluate('state.session.elapsed')==elapsed and page.evaluate('MineView.cameraFor(state)')==0
   page.locator('#startButton').click();assert page.evaluate('MineView.cameraFor(state)===MineView.maximum(state)');page.locator('#stopButton').click();page.locator('#confirmStop').click();assert page.evaluate('state.session') is None
   page.locator('#mineToSurface').click();page.screenshot(path=str(ROOT/'docs/images/eumo-v3-mine.png'),full_page=True)
   # Repeated hit-tested pointer clicks really rotate the canvas mole, including equipment.
   page.locator('[data-page="home"]').click();page.clock.run_for(250)
   def tap_mole():
    bounds=page.evaluate("PixelArt.getBounds('homeCanvas')");rect=page.locator('#homeCanvas').bounding_box();page.mouse.click(rect['x']+(bounds['x']+bounds['w']/2)/384*rect['width'],rect['y']+(bounds['y']+bounds['h']/2)/288*rect['height'])
   tap_mole();page.clock.run_for(150);tap_mole();page.clock.run_for(150);tap_mole();page.clock.run_for(150)
   assert page.evaluate('petSpinAt>0');expect(page.locator('#homeSpeech')).to_contain_text('spin');rotation=page.evaluate("PixelArt.getBounds('homeCanvas').rotation");assert 0<rotation<6.284,rotation
   page.screenshot(path=str(ROOT/'docs/images/eumo-v3-spin.png'),full_page=True);page.clock.run_for(1600);assert page.evaluate('petSpinAt')==0
   # Shelf reserves one copy, duplicate sale pays 99 once; cancel and reload are safe.
   page.locator('[data-page="rewards"]').click();expect(page.locator('.golden-card')).to_have_count(10)
   before=page.evaluate('state.balance');page.locator('[data-sell-treasure="mole-statue"]').click();page.locator('#cancelTreasureSale').click();assert page.evaluate('state.balance')==before
   page.locator('[data-sell-treasure="mole-statue"]').click();page.locator('#confirmTreasureSale').click();assert page.evaluate('state.balance')==before+99
   expect(page.locator('[data-sell-treasure="mole-statue"]')).to_be_disabled();page.locator('#confirmTreasureSale').dispatch_event('click');assert page.evaluate('state.balance')==before+99
   page.reload();assert page.evaluate('state.rareInventory["mole-statue"]')==1 and page.evaluate('state.balance')==before+99
   page.locator('[data-display-treasure="sanxingdui"]').click();expect(page.locator('#home')).to_be_visible();page.clock.run_for(250)
   def gold_pixels():return page.locator('#homeCanvas').evaluate("c=>{const p=c.getContext('2d').getImageData(247,130,32,32).data;let n=0;for(let i=0;i<p.length;i+=4)if(p[i]===233&&p[i+1]===184&&p[i+2]===78)n++;return n;}")
   assert gold_pixels()>50;page.screenshot(path=str(ROOT/'docs/images/eumo-v3-home.png'),full_page=True)
   page.locator('#putBackTreasure').click();page.clock.run_for(250);assert gold_pixels()==0
   page.locator('[data-page="rewards"]').click();page.screenshot(path=str(ROOT/'docs/images/eumo-v3-collection.png'),full_page=True)
   page.locator('[data-sell-treasure="sanxingdui"]').click();page.locator('#confirmTreasureSale').click();assert page.evaluate('state.balance')==before+198
   page.locator('[data-page="focus"]').click()
   # Stable fixture has a golden mask at the third formal discovery; earn it via the real timer.
   page.evaluate('state.eligibleSeconds=1200;state.rareClaimed=2;state.minutes=10;save();renderTimer();');page.locator('#startButton').click();page.clock.fast_forward(601000)
   expect(page.locator('#finishDialog')).to_be_visible();expect(page.locator('#goldenFinishCopy')).to_contain_text('Sanxingdui');assert page.evaluate('state.rareInventory.sanxingdui')==1
   page.locator('#claimButton').click();page.reload();assert page.evaluate('state.rareInventory.sanxingdui')==1 and page.evaluate('state.rareClaimed')==3
   # All four uploads are real playable files in the exact requested categories.
   page.locator('#openMusicLibrary').click()
   tracks=[('noise','noise-one','Winter bonfire',12.168),('noise','noise-two','Tropical rainforest',13.416),('groove','groove-one','botanicore',213.552),('soft','soft-next','Litte ridge',222.84)]
   for category,id,title,seconds in tracks:
    page.locator('[data-music-category="'+category+'"]').click();page.locator('[data-music-track="'+id+'"]').click();page.wait_for_function('(id)=>PetAudio.status().trackId===id && document.querySelector("#focusMusic").currentTime>0',arg=id)
    expect(page.locator('#musicNowTitle')).to_have_text(title);assert abs(page.evaluate('document.querySelector("#focusMusic").duration')-seconds)<.2
   page.screenshot(path=str(ROOT/'docs/images/eumo-v3-music.png'),full_page=True);page.keyboard.press('Escape');page.locator('#soundButton').click()
   # Golden shelf and touch camera controls fit small screens; reduced-motion is honored.
   page.emulate_media(reduced_motion='reduce');page.locator('[data-page="home"]').click();page.clock.run_for(250);tap_mole();page.clock.run_for(150);tap_mole();page.clock.run_for(150);tap_mole();page.clock.run_for(150);assert page.evaluate("PixelArt.getBounds('homeCanvas').rotation")==0
   for width,height in [(320,640),(390,844),(844,390)]:
    page.set_viewport_size({'width':width,'height':height});page.locator('[data-page="rewards"]').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.locator('[data-page="focus"]').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   # Every uploaded byte is preserved in the offline catalogue; all four tracks play without network.
   offline=browser.new_context(viewport={'width':1280,'height':800});download=offline.new_page();download.goto(url+'/dist/Eumo.html');download.locator('#enterGame').click();offline.set_offline(True);download.locator('#openMusicLibrary').click()
   import base64
   for category,id,title,seconds in tracks:
    source=download.evaluate('(id)=>MusicCatalog.tracks.find(t=>t.id===id).src',id);filename={'noise-one':'winter-bonfire','noise-two':'tropical-rainforest','groove-one':'botanicore','soft-next':'litte-ridge'}[id]
    assert base64.b64decode(source.split(',',1)[1])==(ROOT/'assets/audio'/ (filename+'.mp3')).read_bytes()
    download.locator('[data-music-category="'+category+'"]').click();download.locator('[data-music-track="'+id+'"]').click();download.wait_for_function('(id)=>PetAudio.status().trackId===id && document.querySelector("#focusMusic").currentTime>0',arg=id)
   assert not errors,errors;browser.close()
  print('PASS: V3 camera drag/keyboard/locks and unchanged progress; real triple-click canvas spin/reduced motion; golden settlement/reload/shelf/reserved sale; 4 uploaded tracks actual playback and exact offline bytes; mobile bounds.')
 finally:proc.terminate();proc.wait(timeout=5)
if __name__=='__main__':run()
