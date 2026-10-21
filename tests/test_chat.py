"""Real browser -> Node API -> local provider fixture; not a real-model quality test."""
import json,os,re,shutil,subprocess,time,urllib.request
from pathlib import Path
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from datetime import datetime,timezone,timedelta
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
KEY='loop-pet-soft-universe-v1'
requests=[]
class Provider(BaseHTTPRequestHandler):
 def do_POST(self):
  body=json.loads(self.rfile.read(int(self.headers['Content-Length'])));requests.append({'body':body,'authorization':self.headers.get('Authorization')})
  message=body['messages'][-1]['content']
  if message=='force provider error':
   self.send_response(500);self.end_headers();self.wfile.write(b'private test-only-cloud-key');return
  if message=='slow check':time.sleep(.7)
  reply='圆框眼镜很可爱！今天学习25分钟，工作5分钟。'
  if message=='html check':reply='Literal <img src=x onerror="window.chatXss=1"> stays plain text.'
  blob=json.dumps({'choices':[{'message':{'content':reply}}]},ensure_ascii=False).encode()
  self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(blob)));self.end_headers();self.wfile.write(blob)
 def log_message(self,*args):pass
def context_of(request):
 data=next(x['content'] for x in reversed(request['body']['messages']) if x['content'].startswith('GAME_CONTEXT（'))
 return json.loads(data.split('\n',1)[1])
def run():
 provider=ThreadingHTTPServer(('127.0.0.1',0),Provider);Thread(target=provider.serve_forever,daemon=True).start()
 env={**os.environ,'PORT':'0','AI_API_KEY':'test-only-cloud-key','AI_BASE_URL':f'http://127.0.0.1:{provider.server_port}/v1','AI_MODEL':'Qwen/Qwen3-8B','AI_RATE_LIMIT':'60'}
 process=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 try:
  line=process.stdout.readline().strip();assert line.startswith('Eumo: http://localhost:'),line
  url=line.split('Eumo: ')[1]
  today=datetime.now(timezone(timedelta(hours=8))).strftime('%Y-%m-%d')
  seed={'profile':{'name':'Yami','color':'#7dcbb4','configured':True},'balance':100,'depth':50,'surfaceDepth':0,'digDay':today,'progressVersion':2,'reportDays':{today:{'seconds':1500,'workSeconds':300}},'history':[{'id':'lesson','at':int(time.time()*1000),'mode':'study','task':'英语单词','note':'复习错词','seconds':1500,'stars':5,'depth':50,'demo':False,'daySeconds':{today:1500},'outcome':'complete'},{'id':'demo','at':int(time.time()*1000),'mode':'study','task':'not-real-study','seconds':15,'stars':1,'depth':5,'demo':True,'outcome':'complete'}]}
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
   ctx=browser.new_context(locale='zh-CN',timezone_id='Asia/Shanghai',viewport={'width':1536,'height':800});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script(f"if(!localStorage.getItem('{KEY}'))localStorage.setItem('{KEY}',{json.dumps(json.dumps(seed))});")
   page.goto(url+'/#wardrobe');page.locator('[data-category="glasses"]').click();page.locator('[data-item="roundglasses"]').click()
   assert len(requests)==0,'Buying clothes must not silently call a paid model'
   assert page.evaluate('state.balance')==92
   page.locator('[data-page="focus"]').click();expect(page.locator('#chatMessages')).to_contain_text('圆框眼镜')
   page.locator('#openMoleChat').click();expect(page.locator('#chatDialog')).to_be_visible()
   def send(message):
    page.locator('#chatDialogInput').fill(message);page.locator('#chatDialogSend').click();expect(page.locator('#chatDialogSend')).to_be_enabled(timeout=10000)
   send('夸夸我的新眼镜，说说我今天学了多久')
   expect(page.locator('#chatDialogMessages')).to_contain_text('今天学习25分钟')
   data=context_of(requests[-1]);assert data['moleName']=='Yami';assert data['today']=={'studySeconds':1500,'workSeconds':300}
   assert data['equipped'][0]['id']=='roundglasses';assert data['recentEvents'][-1]['type']=='purchase'
   assert all(not s.get('demo') and s['task']!='not-real-study' for s in data['recentSessions'])
   page.screenshot(path=str(ROOT/'docs/images/eumo-ai-conversation.png'),full_page=True)
   assert requests[-1]['authorization']=='Bearer test-only-cloud-key'
   assert 'test-only-cloud-key' not in page.content() and 'test-only-cloud-key' not in page.evaluate('JSON.stringify(localStorage)')
   before=len(requests);page.locator('#chatDialogInput').fill('还可以解释一下吗？')
   page.locator('#chatDialogInput').dispatch_event('keydown',{'key':'Enter','isComposing':True});page.wait_for_timeout(100);assert len(requests)==before
   page.locator('#chatDialogInput').press('Enter');expect(page.locator('#chatDialogSend')).to_be_enabled(timeout=10000)
   assert len(requests)==before+1
   assert any(x['role']=='assistant' and '今天学习25分钟' in x['content'] for x in requests[-1]['body']['messages'])
   page.locator('#shareGameContext').uncheck();send('不共享时再聊一句')
   hidden=context_of(requests[-1]);assert hidden['today'] is None and not hidden['recentSessions'] and not hidden['equipped'] and not hidden['lastTask']
   send('force provider error');expect(page.locator('#chatDialogInput')).to_have_value('force provider error')
   expect(page.locator('#chatDialogMessages')).to_contain_text(re.compile('文字已经保留|try again'));assert 'test-only-cloud-key' not in page.content()
   send('retry succeeds');assert not any(x['content']=='force provider error' for x in requests[-1]['body']['messages'])
   send('html check');expect(page.locator('#chatDialogMessages')).to_contain_text('<img src=x')
   assert page.locator('#chatDialogMessages img').count()==0 and not page.evaluate('window.chatXss')
   page.locator('#closeMoleChat').click();page.reload();page.locator('#openMoleChat').click();expect(page.locator('#chatDialogMessages')).to_contain_text('Literal <img')
   progress=page.evaluate('JSON.stringify({balance:state.balance,depth:state.depth,owned:state.owned,report:state.reportDays})')
   page.locator('#clearMoleChat').click();assert progress==page.evaluate('JSON.stringify({balance:state.balance,depth:state.depth,owned:state.owned,report:state.reportDays})')
   expect(page.locator('#chatDialogMessages')).not_to_contain_text('Literal <img')
   page.locator('#closeMoleChat').click();page.locator('#startButton').click();session=page.evaluate('state.session.id');page.locator('#openMoleChat').click()
   page.locator('#chatDialogInput').fill('slow check');page.locator('#chatDialogSend').click();expect(page.locator('#chatDialogSend')).to_be_disabled()
   before=len(requests);page.locator('#chatDialogSend').dispatch_event('click');page.wait_for_timeout(1200)
   assert len(requests)==before or len(requests)==before+1
   assert page.evaluate('state.session.id')==session and page.evaluate('state.session.status')=='running'
   assert page.evaluate('state.session.elapsed')>=1
   expect(page.locator('#chatDialogSend')).to_be_enabled();page.locator('#closeMoleChat').click()
   page.locator('#startButton').click();assert page.evaluate('state.session.status')=='paused'
   page.locator('#stopButton').click();page.locator('#confirmStop').click()
   # Standalone files served from the same host can use the same cloud route.
   download=ctx.new_page();download.goto(url+'/dist/Eumo.html');expect(download.locator('#moleChatInput')).to_be_enabled();download.locator('#moleChatInput').fill('download chat');download.locator('#moleChatInput').press('Enter');expect(download.locator('#moleChatSend')).to_be_enabled(timeout=10000);expect(download.locator('#chatMessages')).to_contain_text('今天学习25分钟')
   # A missing cloud key is shown honestly; no canned answer masquerades as AI.
   def unconfigured(route):route.fulfill(status=503,content_type='application/json',body=json.dumps({'error':'AI_NOT_CONFIGURED'}))
   download.route('**/api/chat',unconfigured);download.locator('#moleChatInput').fill('你好，还在吗');download.locator('#moleChatInput').press('Enter');expect(download.locator('#moleChatSend')).to_be_enabled(timeout=10000)
   expect(download.locator('#chatMessages')).to_contain_text(re.compile('站点主人|site owner'));expect(download.locator('#moleChatInput')).to_have_value('你好，还在吗')
   assert not errors,errors
   browser.close()
  for target in ['/.env','/ai/persona.cjs','/.git/config']:
   try:urllib.request.urlopen(url+target);raise AssertionError('Private dev-server path is public: '+target)
   except urllib.error.HTTPError as e:assert e.code==404
  print('PASS: browser -> Node proxy -> provider fixture; actual outfit reaction without hidden calls; true Study/Work context and Demo exclusion; multi-turn + IME; context opt-out; safe errors/retry and text-only rendering; reload/clear preserving gameplay; pending deduplication + uninterrupted timer; standalone chat. Provider responses are fixtures, not real-model evaluation.')
 finally:
  process.terminate()
  try:process.wait(timeout=5)
  except subprocess.TimeoutExpired:process.kill();process.wait()
  provider.shutdown();provider.server_close()
if __name__=='__main__':run()
