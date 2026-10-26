"""Music room: actual MP3 playback, catalogue extension, safe placeholders and offline files."""
import base64,importlib.util,io,json,os,shutil,subprocess,tempfile,wave,urllib.request,urllib.error
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];KEY='loop-pet-soft-universe-v1'
def test_future_bundle():
 spec=importlib.util.spec_from_file_location('eumo_builder',ROOT/'scripts/build_standalone.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
 code=(ROOT/'music-catalog.js').read_text();start=code.index(' const catalog = ')+len(' const catalog = ');end=code.index(';\n return catalog;',start);catalog=json.loads(code[start:end])
 with tempfile.TemporaryDirectory() as tmp:
  target=Path(tmp);(target/'assets/audio').mkdir(parents=True)
  shutil.copyfile(ROOT/'assets/audio/warm-focus-3.mp3',target/'assets/audio/warm-focus-3.mp3')
  data=io.BytesIO()
  with wave.open(data,'wb') as audio:audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(8000);audio.writeframes(b'\0\0'*800)
  fixture=data.getvalue();(target/'assets/audio/future.wav').write_bytes(fixture)
  for track in catalog['tracks'][1:]:track['src']=None
  catalog['tracks'][2]['src']='assets/audio/future.wav'
  (target/'music-catalog.js').write_text(code[:start]+json.dumps(catalog)+code[end:]);builder.ROOT=target
  bundled,default=builder.embed_music();embedded=json.loads(bundled[start:bundled.index(';\n catalog.tracks.find',start)])
  assert base64.b64decode(embedded['tracks'][2]['src'].split(',',1)[1])==fixture
  assert base64.b64decode(default.split(',',1)[1])==(ROOT/'assets/audio/warm-focus-3.mp3').read_bytes()
  assert embedded['tracks'][0]['src'] is None,'Do not duplicate the default MP3 in the download'
  assert embedded['tracks'][3]['src'] is None
  (target/'assets/audio/future.wav').unlink()
  try:builder.embed_music();raise AssertionError('A missing declared track must fail the build')
  except FileNotFoundError:pass

def run():
 test_future_bundle()
 proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 url=proc.stdout.readline().strip().split('Eumo: ')[1]
 try:
  audio=(ROOT/'assets/audio/warm-focus-3.mp3').read_bytes()
  for bounds,expected in [('bytes=0-31',audio[:32]),('bytes=-16',audio[-16:]),('bytes=32-',audio[32:])]:
   with urllib.request.urlopen(urllib.request.Request(url+'/assets/audio/warm-focus-3.mp3',headers={'Range':bounds})) as response:
    assert response.status==206 and response.read()==expected
  try:urllib.request.urlopen(urllib.request.Request(url+'/assets/audio/warm-focus-3.mp3',headers={'Range':'bytes=999999999-'}));raise AssertionError('Invalid range must fail')
  except urllib.error.HTTPError as e:assert e.code==416
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
   ctx=browser.new_context(viewport={'width':1680,'height':1050});page=ctx.new_page();errors=[];media=[]
   page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:media.append(r.url) if r.resource_type=='media' else None)
   page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',JSON.stringify({{profile:{{name:'Momo',color:'#b784cf',configured:true}},depth:93}}));")
   page.goto(url+'/#focus');expect(page.locator('#musicMiniPlayer')).to_be_visible();assert page.evaluate('document.querySelector("#focusMusic").paused')
   assert not media,'No audio should download simply from opening the game'
   page.locator('#openMusicLibrary').focus();page.keyboard.press('Enter');expect(page.locator('#musicDialog')).to_be_visible()
   expect(page.locator('.music-category')).to_have_count(3);expect(page.locator('.music-track')).to_have_count(2);expect(page.locator('[data-music-track="soft-next"]')).to_be_enabled();assert not media
   for category,count in [('groove',1),('noise',2)]:
    page.locator('[data-music-category="'+category+'"]').click();expect(page.locator('.music-track')).to_have_count(count);assert page.locator('.music-track:enabled').count()==count
    expect(page.locator('#musicCategoryCount')).to_have_text(str(count)+' ready to play');assert not media
   page.locator('[data-music-category="soft"]').click();page.locator('[data-music-track="warm-focus"]').click()
   page.wait_for_function('document.querySelector("#focusMusic").currentTime>0');expect(page.locator('#musicPlayButton')).to_have_attribute('aria-pressed','true');expect(page.locator('#soundButton')).to_have_attribute('aria-pressed','true')
   assert abs(page.evaluate('document.querySelector("#focusMusic").duration')-194.52)<.2
   expect(page.locator('#musicNext')).to_be_enabled();expect(page.locator('#musicPrevious')).to_be_enabled()
   page.locator('#musicLibraryVolume').fill('0');page.locator('#musicLibraryVolume').dispatch_event('input');expect(page.locator('#musicVolume')).to_have_value('0');assert page.evaluate('PetAudio.status().volume')==0
   page.locator('#musicLibraryVolume').fill('25');page.locator('#musicLibraryVolume').dispatch_event('input');assert page.evaluate('state.musicVolume')==.25
   page.locator('#musicSeek').fill('400');page.wait_for_function('document.querySelector("#focusMusic").currentTime>77 && document.querySelector("#focusMusic").currentTime<80')
   page.locator('#musicRepeat').click();assert not page.evaluate('document.querySelector("#focusMusic").loop');page.locator('#musicRepeat').click();assert page.evaluate('document.querySelector("#focusMusic").loop')
   page.screenshot(path=str(ROOT/'docs/images/eumo-music-library.png'),full_page=True)
   page.locator('#closeMusicLibrary').click();page.locator('[data-page="home"]').click();assert page.evaluate('PetAudio.status().musicOn');page.locator('[data-page="focus"]').click()
   page.locator('#startButton').click();session=page.evaluate('state.session.id');page.locator('#openMusicLibrary').click();page.locator('[data-music-category="noise"]').click();page.wait_for_timeout(1100)
   assert page.evaluate('state.session.id')==session and page.evaluate('state.session.status')=='running' and page.evaluate('state.session.elapsed')>=1
   page.keyboard.press('Escape');expect(page.locator('#musicDialog')).to_be_hidden();assert page.evaluate('PetAudio.status().musicOn')
   page.locator('#soundButton').click();expect(page.locator('#soundButton')).to_have_attribute('aria-pressed','false');assert not page.evaluate('PetAudio.status().musicOn')
   page.screenshot(path=str(ROOT/'docs/images/eumo-music-player.png'),full_page=True)
   page.reload();expect(page.locator('#musicVolume')).to_have_value('25');assert not page.evaluate('PetAudio.status().musicOn');page.locator('#openMusicLibrary').click();expect(page.locator('#musicLibraryVolume')).to_have_value('25');page.keyboard.press('Escape')
   # The new soft track joins the same transport and keeps its selection after reload.
   future=ctx.new_page();future.goto(url+'/#focus');future.locator('#openMusicLibrary').click()
   future.locator('[data-music-track="soft-next"]').click();future.wait_for_function('PetAudio.status().trackId==="soft-next" && document.querySelector("#focusMusic").currentTime>0');expect(future.locator('#musicNowTitle')).to_have_text('Litte ridge');expect(future.locator('#musicNext')).to_be_enabled();assert future.locator('audio').count()==1
   future.locator('#musicPrevious').click();future.wait_for_function('PetAudio.status().trackId==="warm-focus" && document.querySelector("#focusMusic").currentTime>0')
   future.locator('#musicRepeat').click();assert not future.evaluate('document.querySelector("#focusMusic").loop')
   future.evaluate('document.querySelector("#focusMusic").currentTime=document.querySelector("#focusMusic").duration-.15');future.wait_for_function('PetAudio.status().trackId==="soft-next"')
   future.reload();assert future.evaluate('PetAudio.status().trackId')=='soft-next' and not future.evaluate('PetAudio.status().musicOn')
   # Network failure gives a retryable real error, never a fake playing state.
   broken=browser.new_page();broken.add_init_script(f"localStorage.setItem('{KEY}',JSON.stringify({{profile:{{name:'Momo',configured:true}}}}));")
   broken.route('**/assets/audio/*.mp3',lambda r:r.fulfill(status=404,body='Not available'));broken.goto(url+'/#focus');broken.locator('#openMusicLibrary').click();broken.locator('#musicPlayButton').click()
   expect(broken.locator('#musicMessage')).to_contain_text('could not');expect(broken.locator('#musicPlayButton')).to_be_enabled();assert not broken.evaluate('PetAudio.status().musicOn')
   broken.unroute('**/assets/audio/*.mp3');broken.locator('#musicPlayButton').click();broken.wait_for_function('document.querySelector("#focusMusic").currentTime>0');expect(broken.locator('#musicMessage')).not_to_contain_text('could not')
   # Keyboard/touch layout, and a fixed footer even when the music shelf scrolls.
   for width,height in [(320,640),(390,844),(844,390)]:
    page.set_viewport_size({'width':width,'height':height});page.locator('#openMusicLibrary').click();page.wait_for_timeout(100)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    for selector in ['#musicDialog','#musicDialog .music-window-bar','.music-player-footer','#musicPlayButton','#musicLibraryVolume']:
     box=page.locator(selector).bounding_box();assert box['x']>=0 and box['y']>=0 and box['x']+box['width']<=width+1 and box['y']+box['height']<=height+1,(selector,box,width,height)
    assert page.locator('#musicDialog').evaluate('e=>e.scrollWidth<=e.clientWidth')
    if width==390:page.screenshot(path=str(ROOT/'docs/images/eumo-music-mobile.png'),full_page=True)
    page.keyboard.press('Escape')
   # The download contains the default track once, shares it with the catalog, and plays offline.
   offline=browser.new_context(viewport={'width':1280,'height':800});download=offline.new_page();download.goto(url+'/dist/Eumo.html');download.locator('#enterGame').click();offline.set_offline(True)
   assert download.evaluate('MusicCatalog.tracks[0].src===document.querySelector("#focusMusic").getAttribute("src")')
   download.locator('#openMusicLibrary').click();download.locator('[data-music-track="warm-focus"]').click();download.wait_for_function('document.querySelector("#focusMusic").currentTime>0')
   assert not errors,errors
   browser.close()
  print('PASS: actual MP3 transport, 3 categories/5 playable tracks, no initial media requests, keyboard/mobile bounds, volume/seek/repeat/next, future track selection and natural play-all transition, restore without autoplay, uninterrupted timer/navigation, failure/retry, offline shared MP3, future-file build and missing-file guard.')
 finally:
  proc.terminate()
  try:proc.wait(timeout=5)
  except subprocess.TimeoutExpired:proc.kill();proc.wait()
if __name__=='__main__':run()
