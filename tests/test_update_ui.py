"""Desktop bridge fixtures exercise update UI states without downloading an installer."""
import os,subprocess,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
proc=subprocess.Popen(['node','scripts/dev_server.cjs'],cwd=ROOT,env={**os.environ,'PORT':'0'},stdout=subprocess.PIPE,text=True)
url=proc.stdout.readline().strip().split('Eumo: ')[1]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1280,'height':720});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script("""localStorage.setItem('eumo-tour-v1','seen');localStorage.setItem('loop-pet-soft-universe-v1',JSON.stringify({profile:{name:'Momo',configured:true,color:'#a8b77a'}}));
  window.updateFixture={currentVersion:'3.3.0',version:'3.4.0',status:'available',percent:0,platform:'win32',automaticInstall:true};window.updateCalls=[];
  window.emitUpdate=patch=>{Object.assign(updateFixture,patch);window.updateListener?.({...updateFixture});return {...updateFixture};};
  window.EumoDesktop={onBackup:()=>{},getUpdateState:async()=>({...updateFixture}),onUpdateState:fn=>window.updateListener=fn,onOpenUpdates:fn=>window.openUpdates=fn,
  checkForUpdates:async()=>{updateCalls.push('check');return emitUpdate({status:'current'});},downloadUpdate:async()=>{updateCalls.push('download');return emitUpdate({status:'downloading',percent:37});},installUpdate:async()=>{updateCalls.push('install');return emitUpdate({status:'installing'});}};
  """)
  page.goto(url+'/#focus');page.locator('#desktopUpdateNotice').click();assert page.locator('#infoDialog').is_visible()
  assert page.locator('.desktop-update-action').text_content()=='Download update';page.locator('.desktop-update-action').click()
  assert '37%' in page.locator('.desktop-update-status').text_content();assert page.locator('.desktop-update-action').is_disabled()
  page.evaluate("emitUpdate({status:'downloaded',percent:100})");assert page.locator('.desktop-update-action').text_content()=='Restart and install'
  page.locator('.desktop-update-action').click();assert page.evaluate('updateCalls')==['download','install']
  page.evaluate("emitUpdate({status:'downloaded',error:'SAVE_FAILED'})");assert 'Could not save' in page.locator('.desktop-update-status').text_content()
  page.evaluate("emitUpdate({status:'available',error:null,platform:'darwin',automaticInstall:false})");assert 'Mac installer' in page.locator('.desktop-update-action').text_content()
  page.evaluate("EumoI18n.set('zh')");assert '下载 Mac 安装包' in page.locator('.desktop-update-action').text_content()
  page.locator('#infoDialog').screenshot(path='/tmp/eumo-update-panel.png')
  page.locator('#gotIt').click()
  for width,height in [(1280,600),(1440,900),(800,600)]:
   page.set_viewport_size({'width':width,'height':height});bounds=page.locator('#desktopUpdateNotice').bounding_box();assert bounds['x']>=0 and bounds['x']+bounds['width']<=width
   assert bounds['y']+bounds['height']<=page.evaluate('document.documentElement.scrollHeight')
   if width>=960:assert bounds['y']+bounds['height']<=height+1,(width,height,bounds)
  # Plain web builds do not expose a client updater.
  web=browser.new_page();web.goto(url+'/#focus');assert web.locator('.desktop-updates').count()==0
  assert not errors,errors
  print('PASS: update notice, download progress, install action, save errors, Mac fallback, localization, desktop sizes, and web exclusion.')
  browser.close()
finally:proc.terminate();proc.wait()
