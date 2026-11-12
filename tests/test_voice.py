import os,subprocess,shutil,json,base64
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=root,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True);url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
  page=b.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script("localStorage.setItem('eumo-tour-v1','seen');localStorage.setItem('loop-pet-soft-universe-v1',JSON.stringify({profile:{name:'Momo',configured:true,color:'#a8b77a'}}));window.__streams=[];const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async c=>{const s=await gum(c);window.__streams.push(s);return s;};window.__realGum=navigator.mediaDevices.getUserMedia;")
  chat_calls=[];page.on('request',lambda r:chat_calls.append(r.url) if '/api/chat' in r.url else None)
  calls=[]
  def respond(route):
   data=route.request.post_data_json;wav=base64.b64decode(data['audio']);assert wav[:4]==b'RIFF' and wav[8:12]==b'WAVE' and len(wav)>3200;calls.append(len(wav));route.fulfill(json={'text':'你好，小鼹鼠。'})
  page.route('**/api/transcribe',respond);page.goto(url+'/#focus')
  assert page.locator('#moleChatMic').count()==1
  page.locator('#moleChatInput').fill('My draft')
  page.locator('#moleChatMic').click();page.wait_for_selector('#moleChatMic.is-recording');page.wait_for_timeout(700)
  page.locator('.mole-chat-window').screenshot(path='/tmp/eumo-voice-recording.png')
  page.locator('#moleChatMic').click();page.wait_for_function("document.getElementById('moleChatInput').value.includes('你好')")
  assert page.locator('#moleChatInput').input_value()=='My draft 你好，小鼹鼠。'
  assert page.evaluate("__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))")
  assert len(calls)==1
  # Cancel by hiding the composer, with no transcription upload.
  page.locator('#moleChatMic').click();page.wait_for_selector('#moleChatMic.is-recording');page.locator('#toggleMoleChat').click();page.wait_for_timeout(100)
  assert len(calls)==1
  assert page.evaluate("__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))")
  page.locator('#toggleMoleChat').click()
  # Provider failure keeps the draft and offers retry.
  page.unroute('**/api/transcribe');page.route('**/api/transcribe',lambda r:r.fulfill(status=503,json={'error':'VOICE_UNAVAILABLE'}))
  before=page.locator('#moleChatInput').input_value();page.locator('#moleChatMic').click();page.wait_for_selector('#moleChatMic.is-recording');page.wait_for_timeout(350);page.locator('#moleChatMic').click();page.wait_for_function("document.getElementById('moleChatMicStatus').textContent.includes('could not')")
  assert page.locator('#moleChatInput').input_value()==before
  # Permission rejection.
  page.evaluate("() => {navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException('No','NotAllowedError'));}")
  page.locator('#moleChatMic').click();page.wait_for_function("document.getElementById('moleChatMicStatus').textContent.includes('denied')")
  assert page.locator('#moleChatMic').get_attribute('aria-pressed')=='false'
  # Permission request cancelled before the browser resolves: late stream must close.
  page.evaluate("() => {navigator.mediaDevices.getUserMedia=()=>new Promise(r=>window.__grant=r);}")
  page.locator('#moleChatMic').click();page.wait_for_function('!!window.__grant');page.locator('#moleChatMic').click()
  page.evaluate("window.__lateStopped=false;__grant({getTracks:()=>[{stop:()=>window.__lateStopped=true}]})");page.wait_for_function('__lateStopped')
  # Expanded dictation uses the same pipeline and respects the message limit.
  page.evaluate("() => {navigator.mediaDevices.getUserMedia=window.__realGum;EumoI18n.set('zh');}")
  page.unroute('**/api/transcribe');page.route('**/api/transcribe',respond)
  page.locator('#openMoleChat').click();page.locator('#chatDialogInput').fill('a'*1998)
  page.locator('#chatDialogMic').click();page.wait_for_selector('#chatDialogMic.is-recording');page.wait_for_timeout(350)
  page.locator('#chatDialogMic').click();page.wait_for_function("document.getElementById('chatDialogMicStatus').textContent.includes('已达到')")
  assert len(page.locator('#chatDialogInput').input_value())==2000
  before_calls=len(calls);page.locator('#chatDialogMic').click();assert len(calls)==before_calls
  page.locator('#chatDialogInput').fill('');page.locator('#chatDialogMic').click();page.wait_for_selector('#chatDialogMic.is-recording');page.keyboard.press('Escape')
  assert page.locator('#chatDialogMic').get_attribute('aria-pressed')=='false'
  assert page.evaluate("__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))")
  page.locator('#closeMoleChat').click();page.evaluate("EumoI18n.set('en')")
  # Inline and expanded composers fit desktop and mobile, with usable input widths.
  for width,height in [(1440,900),(1280,600),(390,844),(320,640)]:
   page.set_viewport_size({'width':width,'height':height});page.locator('#moleChatMicStatus').evaluate("e=>e.hidden=true")
   for selector in ['#moleChatInput','#moleChatMic','#moleChatSend']:
    bounds=page.locator(selector).bounding_box();assert bounds['x']>=0 and bounds['x']+bounds['width']<=width,(width,selector,bounds)
   assert page.locator('#moleChatInput').bounding_box()['width']>=100
   page.locator('#openMoleChat').click()
   for selector in ['#chatDialogInput','#chatDialogMic','#chatDialogSend']:
    bounds=page.locator(selector).bounding_box();assert bounds['x']>=0 and bounds['x']+bounds['width']<=width,(width,selector,bounds)
   page.locator('#closeMoleChat').click()
  assert not errors,errors
  assert not chat_calls,chat_calls
  print('PASS: real fake-device recording/decoding/upload; draft append; failure preservation; permission denial; late-grant cancellation; track cleanup; both responsive composers. WAV sizes:',calls)
  b.close()
finally:proc.terminate();proc.wait()
