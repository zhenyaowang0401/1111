"""Bilingual UI, protected user content, chat language and real-friend empty state."""
import subprocess,os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
def choose(page,language):
 page.locator('#languageSwitch').click();page.locator(f'#languageSwitchMenu [data-language="{language}"]').click()
def run():
 proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True);url=proc.stdout.readline().strip().split('Eumo: ')[1]
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(locale='zh-CN');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("localStorage.setItem('eumo-tour-v1','seen')");page.goto(url);expect(page.locator('#setupTitle')).to_have_text('Your mole');expect(page.locator('html')).to_have_attribute('lang','en')
   # Opening the menu never changes language; both native names remain visible.
   expect(page.locator('#languageSwitch .language-current')).to_have_text('English')
   page.locator('#languageSwitch').click();expect(page.locator('html')).to_have_attribute('lang','en');expect(page.locator('#languageSwitchMenu [data-language="en"]')).to_have_attribute('aria-checked','true');expect(page.locator('#languageSwitchMenu [data-language="zh"]')).to_have_text('简体中文')
   page.keyboard.press('Escape');expect(page.locator('#languageSwitchMenu')).to_be_hidden();expect(page.locator('#languageSwitch')).to_be_focused()
   page.keyboard.press('ArrowDown');page.keyboard.press('ArrowDown');expect(page.locator('#languageSwitchMenu [data-language="zh"]')).to_be_focused();page.keyboard.press('Escape')
   page.locator('#languageSwitch').click();page.locator('#setupTitle').click();expect(page.locator('#languageSwitchMenu')).to_be_hidden()
   page.locator('#petName').fill('Study');choose(page,'zh');expect(page.locator('#setupTitle')).to_have_text('你的鼹鼠');expect(page.locator('#previewPetName')).to_have_text('Study');page.locator('#enterGame').click();expect(page.locator('#focusTitle')).to_have_text('专注');expect(page.locator('#chatMessages')).to_contain_text('一小步也算数')
   for target,label,selector in [('home','家园','#homeTitle'),('wardrobe','装扮','#equipmentTitle'),('reports','今天','#reportTitle'),('companions','好友','#companionsTitle')]:
    page.evaluate('(x)=>navigateTo(x)',target)
    if selector!='#equipmentTitle':expect(page.locator(selector)).to_have_text(label)
   expect(page.locator('#sampleFriends')).to_have_count(0);expect(page.locator('#friendList')).to_have_count(0);expect(page.locator('#friendsEmpty')).to_have_text('快来添加你的鼹鼠朋友！')
   page.evaluate("navigateTo('start')");choose(page,'en');page.locator('#cancelSetup').click();expect(page.locator('#friendsEmpty')).to_have_text('Come add your mole friends!')
   page.evaluate("navigateTo('focus')");page.locator('#taskInput').fill('Study Work');page.locator('#startButton').click();expect(page.locator('#chatMessages')).to_contain_text('digging alongside you');page.locator('#startButton').click()
   page.evaluate("navigateTo('start')");choose(page,'zh');page.locator('#cancelSetup').click();expect(page.locator('#taskInput')).to_have_value('Study Work');page.locator('#startButton').click();expect(page.locator('#chatMessages')).to_contain_text('我也接着挖')
   page.evaluate("navigateTo('reports')");expect(page.locator('.log-entry [data-no-translate]').first).to_have_text('Study Work')
   page.reload();expect(page.locator('html')).to_have_attribute('lang','zh-CN');assert page.evaluate('state.profile.name')=='Study'
   # Model requests follow the message, not UI language or browser locale.
   sent=[]
   def reply(route):
    data=route.request.post_data_json;sent.append(data);route.fulfill(json={'reply':'你好呀' if data['context']['language']=='zh' else 'Hello there','promptVersion':'mole-companion-1.1'})
   page.route('**/api/chat',reply);page.evaluate("navigateTo('focus')")
   for text,lang in [('hello','en'),('你好','zh'),('thank you','en')]:
    page.locator('#moleChatInput').fill(text);page.locator('#moleChatSend').click();expect(page.locator('#moleChatInput')).to_be_enabled();assert sent[-1]['context']['language']==lang
   expect(page.locator('#chatMessages')).to_contain_text('hello');expect(page.locator('#chatMessages')).to_contain_text('你好呀')
   for width in [320,390,1440]:
    page.set_viewport_size({'width':width,'height':900});page.evaluate("navigateTo('start')");expect(page.locator('#languageSwitch')).to_be_in_viewport();page.locator('#languageSwitch').click();expect(page.locator('#languageSwitchMenu')).to_be_in_viewport();expect(page.locator('#languageSwitchMenu [data-language=zh]')).to_have_attribute('aria-checked','true');page.keyboard.press('Escape');assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
   page.locator('#languageSwitch').click();page.screenshot(path=str(ROOT/'docs/images/eumo-language-setup.png'));page.keyboard.press('Escape')
   page.evaluate("navigateTo('focus')")
   with ctx.expect_page() as popup:page.locator('#floatMoleButton').click()
   floating=popup.value;expect(floating.locator('html')).to_have_attribute('lang','zh-CN');expect(floating.locator('#toggle')).to_have_text('暂停')
   page.evaluate("EumoI18n.set('en')");expect(floating.locator('#toggle')).to_have_text('Pause');floating.close()

   offline=b.new_page();offline.goto(url+'/dist/Eumo.html');offline.context.set_offline(True);choose(offline,'zh');expect(offline.locator('#setupTitle')).to_have_text('你的鼹鼠')
   assert not errors,errors;b.close();print('PASS: default English, bilingual navigation, reversible/persisted locale, no demos, empty invitation, Chinese lifecycle, message-specific chat requests, protected names/tasks/history, responsive and offline switch.')
 finally:proc.terminate();proc.wait()
if __name__=='__main__':run()
