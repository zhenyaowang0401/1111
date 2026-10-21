"""Timer buttons and companion chronology through a browser and local API fixture.
These checks validate state wiring, not a hosted model's language quality.
"""
import json,os,shutil,subprocess,time
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
GAME='loop-pet-soft-universe-v1'
CHAT='eumo-mole-chat-v1'
requests=[]
class Provider(BaseHTTPRequestHandler):
 def do_POST(self):
  payload=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
  context=json.loads(payload['messages'][-2]['content'].split('\n',1)[1])
  requests.append({'payload':payload,'context':context})
  slow=payload['messages'][-1]['content']=='慢回复测试'
  if slow:time.sleep(1)
  blob=json.dumps({'choices':[{'message':{'content':'过期的挖土回复' if slow else '测试状态：'+context['activity']['phase']}}]},ensure_ascii=False).encode()
  try:
   self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(blob)));self.end_headers();self.wfile.write(blob)
  except (BrokenPipeError,ConnectionResetError):pass
 def log_message(self,*args):pass

def run():
 provider=ThreadingHTTPServer(('127.0.0.1',0),Provider);Thread(target=provider.serve_forever,daemon=True).start()
 env={**os.environ,'PORT':'0','AI_API_KEY':'fixture-only-key','AI_BASE_URL':f'http://127.0.0.1:{provider.server_port}/v1','AI_RATE_LIMIT':'60'}
 proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 try:
  url=proc.stdout.readline().strip().split('Eumo: ')[1]
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
   page=browser.new_page(locale='zh-CN',timezone_id='Asia/Shanghai',viewport={'width':1536,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   seed={'profile':{'name':'Momo','color':'#b784cf','configured':True},'balance':1000}
   old='你学习我先停下，等你休息再挖。'
   page.add_init_script(f"if(!localStorage.getItem('{GAME}')){{localStorage.setItem('{GAME}',{json.dumps(json.dumps(seed))});localStorage.setItem('{CHAT}',JSON.stringify({{entries:[{{role:'user',content:'你好',source:'user'}},{{role:'assistant',source:'ai',content:{json.dumps(old)}}}]}}));}}")
   page.goto(url+'/#focus');page.clock.install()
   log=page.locator('#chatMessages')
   def last_line():return page.locator('#chatMessages .chat-entry').last.inner_text()
   def ask(phase):
    page.locator('#moleChatInput').fill('你在干什么？');page.locator('#moleChatSend').click();expect(page.locator('#moleChatSend')).to_be_enabled(timeout=10000)
    assert requests[-1]['context']['activity']['phase']==phase,requests[-1]['context']
    return requests[-1]['context']
   def end():
    page.locator('#stopButton').click();page.locator('#confirmStop').click();assert page.evaluate('state.session') is None
   page.locator('#startButton').click();session=page.evaluate('state.session.id')
   assert '陪你一起干活' in last_line();expect(page.locator('#mineStatus')).to_have_text('Digging');assert not requests
   ask('focus');assert not any(x['content']==old for x in requests[-1]['payload']['messages'])
   assert page.evaluate('JSON.parse(localStorage.getItem("'+CHAT+'")).entries.some(x=>x.content==='+json.dumps(old)+')'),'Old messages must remain visible in local history'
   page.clock.fast_forward(61000)
   page.locator('#startButton').click();assert '停下小铲子' in last_line();expect(page.locator('#mineStatus')).to_have_text('Resting')
   paused=page.evaluate('state.session.elapsed');page.clock.fast_forward(20000);assert page.evaluate('state.session.elapsed')==paused
   ask('paused');page.locator('#startButton').click();assert '接着挖' in last_line();assert page.evaluate('state.session.id')==session
   assert [x['type'] for x in page.evaluate('JSON.parse(localStorage.getItem("'+CHAT+'")).events')][-3:]==['session_started','session_paused','session_resumed']
   ask('focus')
   # Opening and cancelling the stop confirmation does not end or pause the timer.
   before=page.evaluate('JSON.parse(localStorage.getItem("'+CHAT+'")).events.length')
   page.locator('#stopButton').click();page.locator('#continueButton').click();assert page.evaluate('state.session.status')=='running'
   assert page.evaluate('JSON.parse(localStorage.getItem("'+CHAT+'")).events.length')==before
   # A slow reply from the running state must not overwrite a later pause event.
   page.locator('#moleChatInput').fill('慢回复测试');page.locator('#moleChatSend').click()
   expect(page.locator('#moleChatSend')).to_be_disabled();page.wait_for_timeout(100);page.locator('#startButton').click()
   expect(page.locator('#moleChatSend')).to_be_enabled(timeout=10000);expect(page.locator('#moleChatInput')).to_have_value('慢回复测试')
   assert '停下小铲子' in last_line();page.wait_for_timeout(1200);expect(log).not_to_contain_text('过期的挖土回复');expect(log).not_to_contain_text('这次没连上')
   end();assert '陪你一起休息' in last_line() and '回到地面' not in last_line()
   assert page.evaluate('PixelArt.digMetrics({...state,remaining:remaining()}).worldDepth')>0
   data=ask('session_finished');assert data['lastActivityEvent']['outcome']=='stopped'
   # The mole returns to the surface only after the daily summary is finished.
   page.locator('[data-page="reports"]').click();page.locator('#finishTodayButton').click();expect(page.locator('#todayDialog')).to_be_visible()
   assert page.evaluate('PixelArt.digMetrics({...state,remaining:remaining()}).worldDepth')>0
   page.locator('#closeTodayButton').click();assert '已经回到地面' in last_line();assert page.evaluate('PixelArt.digMetrics({...state,remaining:remaining()}).worldDepth')==0
   ask('day_finished')
   # Many wardrobe events and a reload must not erase the latest daily activity.
   count=len(requests);page.locator('[data-page="wardrobe"]').click()
   for item in ['hat','sunhat','bucket','baseball','bunny','astronaut']:page.locator('[data-item="'+item+'"]').click()
   assert len(requests)==count
   page.locator('[data-page="focus"]').click();page.reload();ask('day_finished')
   page.locator('[data-mode="work"]').click();page.locator('#startButton').click();assert '开始工作' in last_line();ask('focus');page.clock.fast_forward(2100);end()
   # Break, including pause/resume/end, never starts digging or counts formal time.
   total=page.evaluate('JSON.stringify(state.reportDays)')
   page.locator('[data-mode="rest"]').click();page.locator('#startButton').click();assert '陪你一起歇' in last_line();ask('break')
   page.locator('#startButton').click();assert '小铲子还放着' in last_line();ask('break_paused')
   page.locator('#startButton').click();assert '继续休息' in last_line();page.clock.fast_forward(30000);end()
   assert '还放着' in last_line();ask('break_finished');assert page.evaluate('JSON.stringify(state.reportDays)')==total
   # Demo start/pause/resume/natural completion remain separate from real study.
   page.locator('[data-mode="study"]').click();page.locator('#demoButton').click();page.locator('#startButton').click();assert '不算正式学习' in last_line();ask('demo')
   page.locator('#startButton').click();assert '试玩暂停' in last_line();ask('demo_paused');page.locator('#startButton').click();assert '继续试玩' in last_line()
   page.clock.fast_forward(16000);expect(page.locator('#finishDialog')).to_be_visible();assert '不计入正式学习' in last_line();page.locator('#claimButton').click();ask('demo_finished')
   assert page.evaluate('JSON.stringify(state.reportDays)')==total
   # Natural completion of a real timer has the same rest transition as early ending.
   page.locator('#startButton').click();page.clock.fast_forward(25*60*1000+1000);expect(page.locator('#finishDialog')).to_be_visible()
   assert '陪你一起休息' in last_line();page.locator('#claimButton').click();data=ask('session_finished');assert data['lastActivityEvent']['outcome']=='complete'
   # Sharing off removes derived activity too, while user-initiated local feedback still works.
   page.locator('#openMoleChat').click();page.locator('#shareGameContext').uncheck();page.locator('#closeMoleChat').click();data=ask('unknown');assert data['lastActivityEvent'] is None
   assert not errors,errors
   browser.close()
  print('PASS: real buttons synchronize study/work/pause/resume/end, cancelled end, daily surface return, wardrobe/reload, Break and Demo; latest context and stale persona isolation; late reply cancellation and draft recovery; opt-out. Replies are protocol fixtures, not hosted-model evaluations.')
 finally:
  proc.terminate()
  try:proc.wait(timeout=5)
  except subprocess.TimeoutExpired:proc.kill();proc.wait()
  provider.shutdown();provider.server_close()
if __name__=='__main__':run()
