"""Two browsers -> real app API -> local Supabase RPC transport -> actual PostgreSQL.
This is not evidence that the user's production Supabase project is configured.
"""
import json,os,shutil,subprocess,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];GAME='loop-pet-soft-universe-v1'
def seed(name,color,seconds):
 data={'profile':{'name':name,'color':color,'configured':True},'balance':100,'owned':['hat','roundglasses','scarf'],'equipped':['scarf'],'ownedTools':['spoon'],'tool':'spoon','depth':90,'inventory':[1,2,3,0]}
 return "if(!localStorage.getItem('"+GAME+"')){const state="+json.dumps(data)+";const d=new Date(),key=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');state.reportDays={[key]:{seconds:"+str(seconds)+",workSeconds:0}};localStorage.setItem('"+GAME+"',JSON.stringify(state));}"
def run():
 database=subprocess.Popen(['node','tests/friends_rpc_fixture.cjs'],cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 app=None
 try:
  line=database.stdout.readline().strip();assert line.startswith('Friends database: '),line;dburl=line.split('Friends database: ')[1]
  env={**os.environ,'PORT':'0','SUPABASE_URL':dburl,'SUPABASE_SERVICE_ROLE_KEY':'fixture-service-role-key'}
  app=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  line=app.stdout.readline().strip();assert line.startswith('Eumo: '),line;url=line.split('Eumo: ')[1]
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),args=['--no-sandbox'])
   contexts=[browser.new_context(viewport={'width':1536,'height':1000},timezone_id='America/New_York',permissions=['clipboard-read','clipboard-write']) for _ in range(2)]
   a,b=[c.new_page() for c in contexts];js_errors=[]
   for page,name,color,seconds in [(a,'Yami','#b784cf',1500),(b,'Momo','#7dcbb4',900)]:
    page.on('pageerror',lambda e:js_errors.append(str(e)));page.add_init_script(seed(name,color,seconds));page.goto(url+'/#companions')
    expect(page.locator('#companionsTitle')).to_have_text('Friends');expect(page.locator('#friendList .friend-card')).to_have_count(4);expect(page.locator('#onlineFriendList .friend-card')).to_have_count(0)
    page.locator('#openFriends').click();expect(page.locator('#enableFriends')).to_be_enabled();page.locator('#enableFriends').click();expect(page.locator('#myFriendCode')).to_be_visible();expect(page.locator('#myFriendCode')).not_to_have_value('');expect(page.locator('#friendsRetry')).to_be_enabled()
   code_a=a.locator('#myFriendCode').input_value();code_b=b.locator('#myFriendCode').input_value();assert code_a!=code_b
   assert 'eumo_friend_session' not in a.evaluate('document.cookie')
   assert 'fixture-service-role-key' not in a.content() and 'fixture-service-role-key' not in a.evaluate('JSON.stringify(localStorage)')
   a.bring_to_front();a.locator('#copyFriendCode').click();expect(a.locator('#friendMessage')).to_have_text('Friend code copied.');assert a.evaluate('navigator.clipboard.readText()')==code_a
   def settled(page):expect(page.locator('#friendsRetry')).to_be_enabled(timeout=10000)
   def refresh(page):
    page.locator('#refreshFriendRequests' if page.locator('#friendsDialog').is_visible() else '#friendsRetry').click();settled(page)
   a.locator('#friendCodeInput').fill(code_b);a.locator('#sendFriendRequest').click();settled(a);expect(a.locator('#outgoingFriendRequests .friend-request-row')).to_have_count(1)
   expect(a.locator('#onlineFriendList .friend-card')).to_have_count(0);refresh(b);expect(b.locator('#incomingFriendRequests .friend-request-row')).to_have_count(1)
   b.locator('[data-friend-action="accept"]').click();settled(b);refresh(a);expect(a.locator('#onlineFriendList .friend-card')).to_have_count(1);expect(b.locator('#onlineFriendList .friend-card')).to_have_count(1)
   expect(a.locator('#onlineFriendList')).to_contain_text('Momo');expect(a.locator('#onlineFriendList')).to_contain_text('15m')
   for page in [a,b]:page.locator('#closeFriends').click()
   b.locator('[data-page="focus"]').click();b.locator('#taskInput').fill('PRIVATE TASK: do not share');b.locator('#startButton').click();settled(b);b.locator('[data-page="companions"]').click();settled(b);refresh(a)
   expect(a.locator('#onlineFriendList')).to_contain_text('Studying');assert 'PRIVATE TASK' not in a.locator('#onlineFriendList').inner_text()
   canvas=a.locator('#onlineFriendList canvas');a.wait_for_timeout(250)
   assert canvas.evaluate("c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]===125&&d[i+1]===203&&d[i+2]===180)n++;return n}")>10
   a.screenshot(path=str(ROOT/'docs/images/eumo-friends-live.png'),full_page=True)
   b.locator('[data-page="focus"]').click();b.locator('#startButton').click();b.locator('[data-page="companions"]').click();settled(b);refresh(a);expect(a.locator('#onlineFriendList')).to_contain_text('Paused')
   # A failed refresh cannot leave an apparently live, still-digging friend on screen.
   a.route('**/api/friends',lambda r:r.fulfill(status=503,content_type='application/json',body='{"error":"FRIENDS_UNAVAILABLE"}'));refresh(a)
   expect(a.locator('#friendsStatus')).to_contain_text('Connection interrupted');expect(a.locator('#onlineFriendList')).to_contain_text('Last update');assert a.evaluate('FriendsClient.getPlayers()[0].availability')=='stale'
   a.unroute('**/api/friends');refresh(a);expect(a.locator('#onlineFriendList')).to_contain_text('Paused')
   # A real profile change is escaped, reflected remotely, and keeps the same friend identity.
   b.locator('.footer a[href="#start"]').click();b.locator('#petName').fill('<b>Buddy</b>');b.locator('[data-color="#85bcea"]').click();b.locator('#enterGame').click();b.locator('[data-page="companions"]').click();settled(b);refresh(a)
   expect(a.locator('#onlineFriendList .friend-identity strong')).to_have_text('<b>Buddy</b>');assert a.locator('#onlineFriendList .friend-identity strong b').count()==0
   b.locator('#openFriends').click();settled(b);b.locator('#friendSharing').uncheck();settled(b);refresh(a);expect(a.locator('#onlineFriendList')).to_contain_text('Sharing paused');expect(a.locator('#onlineFriendList')).not_to_contain_text('15m')
   b.locator('#friendSharing').check();settled(b);b.locator('#friendGoal').fill('20');b.locator('#friendGoal').dispatch_event('change');settled(b);refresh(a);expect(a.locator('#onlineFriendList')).to_contain_text('/ 20 min')
   # The code is public, but cookie authentication is never placed in the document or localStorage.
   b.locator('#closeFriends').click();b.reload();settled(b);b.locator('#openFriends').click();settled(b);expect(b.locator('#myFriendCode')).to_have_value(code_b)
   a.locator('#openFriends').click();settled(a);a.screenshot(path=str(ROOT/'docs/images/eumo-friend-code.png'),full_page=True);a.locator('#closeFriends').click()
   # Background/foreground status uses real beacon/refresh network requests.
   with b.expect_response(lambda r:r.url.endswith('/api/friends') and r.status==200):b.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))")
   refresh(a);expect(a.locator('#onlineFriendList')).to_contain_text('Away')
   with b.expect_response(lambda r:r.url.endswith('/api/friends') and r.status==200):b.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))")
   refresh(a);expect(a.locator('#onlineFriendList')).to_contain_text('Paused')
   # Actual inactivity uses the same mole mood as the owner's game, not a demo label.
   b.locator('#closeFriends').click();b.locator('[data-page="focus"]').click();b.locator('#stopButton').click();b.locator('#confirmStop').click();settled(b)
   b.clock.install();b.clock.fast_forward(301000);settled(b)
   with b.expect_response(lambda r:r.url.endswith('/api/friends') and r.status==200):b.evaluate('FriendsClient.activate()')
   settled(b);refresh(a);expect(a.locator('#onlineFriendList')).to_contain_text('Sleeping');assert a.evaluate('FriendsClient.getPlayers()[0].moleMood')=='asleep'
   b.locator('[data-page="companions"]').click();settled(b);b.locator('#openFriends').click();settled(b)
   # Expire the last server heartbeat rather than waiting 90 seconds.
   friend_id=a.locator('#onlineFriendList [data-live-friend]').get_attribute('data-live-friend')[5:]
   with urllib.request.urlopen(urllib.request.Request(dburl+'/fixture/expire',data=json.dumps({'id':friend_id}).encode(),headers={'Content-Type':'application/json'})) as r:assert r.status==200
   refresh(a);expect(a.locator('#onlineFriendList')).to_contain_text('Offline')
   a.locator('#onlineFriendList [data-live-friend]').click();a.locator('[data-remove-friend]').click();a.locator('#cancelRemoveFriend').click();expect(a.locator('#onlineFriendList .friend-card')).to_have_count(1)
   a.locator('[data-remove-friend]').click();a.locator('#confirmRemoveFriend').click();expect(a.locator('#removeFriendDialog')).to_be_hidden();expect(a.locator('#onlineFriendList .friend-card')).to_have_count(0)
   refresh(b);expect(b.locator('#onlineFriendList .friend-card')).to_have_count(0)
   # A second request requires fresh consent and can be declined or cancelled.
   a.locator('#openFriends').click();settled(a);a.locator('#friendCodeInput').fill(code_b);a.locator('#sendFriendRequest').click();settled(a);refresh(b);b.locator('[data-friend-action="decline"]').click();settled(b);refresh(a);expect(a.locator('#outgoingFriendRequests .friend-request-row')).to_have_count(0)
   a.locator('#friendCodeInput').fill(code_b);a.locator('#sendFriendRequest').click();settled(a);a.locator('[data-friend-action="cancel"]').click();settled(a);refresh(b);expect(b.locator('#incomingFriendRequests .friend-request-row')).to_have_count(0)
   for width in [320,390,768]:
    a.set_viewport_size({'width':width,'height':844});a.wait_for_timeout(100);assert a.evaluate('document.documentElement.scrollWidth<=innerWidth')
    box=a.locator('#friendsDialog').bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1 and box['y']+box['height']<=844+1
   a.locator('#closeFriends').click()
   # Missing deployment settings never generate a fake friend code.
   unconfigured=browser.new_page();unconfigured.add_init_script(seed('Demo','#b784cf',0));unconfigured.route('**/api/friends',lambda r:r.fulfill(status=503,content_type='application/json',body='{"error":"FRIENDS_NOT_CONFIGURED"}'));unconfigured.goto(url+'/#companions');unconfigured.locator('#openFriends').click()
   expect(unconfigured.locator('#enableFriends')).to_be_disabled();expect(unconfigured.locator('#myFriendPanel')).to_be_hidden();expect(unconfigured.locator('#friendsStatus')).to_contain_text('not connected');expect(unconfigured.locator('#friendList .friend-card')).to_have_count(4)
   # Once deployment settings are fixed, retrying must re-enable real connection.
   unconfigured.unroute('**/api/friends');unconfigured.locator('#closeFriends').click();unconfigured.locator('#openFriends').click();expect(unconfigured.locator('#enableFriends')).to_be_enabled();unconfigured.locator('#enableFriends').click();expect(unconfigured.locator('#myFriendCode')).to_be_visible()
   # Standalone demos remain usable with networking unavailable.
   offline=browser.new_context();download=offline.new_page();download.goto(url+'/dist/Eumo.html#companions');download.locator('#enterGame').click();offline.set_offline(True);download.locator('[data-friend="yun"]').click();expect(download.locator('#friend-detail-yun')).to_be_visible()
   assert not js_errors,js_errors
   browser.close()
  print('PASS: two independent browsers, real cookie-authenticated API and PostgreSQL: friend codes/copy, pending mutual consent, accepted profiles, study/pause/profile/color updates, task exclusion/XSS, sharing pause/resume, saved identity, Away/Offline, removal on both sides, decline/cancel, mobile dialog, missing-config honesty and offline demos. Production cloud setup is not verified.')
 finally:
  for process in [app,database]:
   if process:
    process.terminate()
    try:process.wait(timeout=5)
    except subprocess.TimeoutExpired:process.kill();process.wait()
if __name__=='__main__':run()
