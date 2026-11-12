/* Desktop-only update controls; the website never downloads an installer on its own. */
'use strict';
window.DesktopUpdates=(()=>{
 function init(){
  const bridge=window.EumoDesktop;if(!bridge?.getUpdateState)return;
  const t=(en,zh)=>window.EumoI18n?.language==='zh'?zh:en;
  const section=document.createElement('section');section.className='desktop-updates';section.setAttribute('data-no-translate','');
  section.innerHTML='<h3></h3><p class="desktop-update-version"></p><p class="desktop-update-status" role="status" aria-live="polite"></p><progress max="100" aria-label="Update download progress" hidden></progress><button class="quiet-button desktop-update-action" type="button"></button><p class="desktop-update-note"></p>';
  document.getElementById('gotIt').before(section);
  const badge=document.createElement('button');badge.id='desktopUpdateNotice';badge.hidden=true;badge.setAttribute('data-no-translate','');document.querySelector('.footer').append(badge);
  const status=section.querySelector('.desktop-update-status'),action=section.querySelector('.desktop-update-action'),bar=section.querySelector('progress');let state=null;
  const show=()=>{const dialog=document.getElementById('infoDialog');if(!dialog.open)dialog.showModal();section.scrollIntoView({block:'nearest'});};
  badge.addEventListener('click',show);
  function render(next){
   if(next)state=next;if(!state)return;
   section.querySelector('h3').textContent=t('App updates','客户端更新');section.querySelector('.desktop-update-version').textContent=t('Installed version: ','当前版本：')+state.currentVersion;
   const messages={idle:t('Checks automatically after launch.','启动后会自动检查更新。'),checking:t('Checking for updates…','正在检查更新…'),current:t('You have the latest version.','已经是最新版本。'),available:t('Version '+state.version+' is available.','发现新版本 '+state.version+'。'),downloading:t('Downloading update… ','正在下载更新… ')+state.percent+'%',downloaded:t('Update downloaded. Restart when you are ready.','更新已下载，可以选择重启安装。'),installing:t('Restarting to install…','正在重启安装…'),error:t('Could not check for updates. Check your connection and try again.','无法检查更新，请检查网络后重试。'),unavailable:t('Updates are available in the installed Windows and Mac apps.','请在已安装的 Windows 或 Mac 客户端中使用更新功能。')};
   const errors={DOWNLOAD_FAILED:t('Download failed. Your current app is unchanged; try again.','下载未成功，当前版本仍可使用，请重试。'),SAVE_FAILED:t('Could not save your progress. Export a backup before updating.','未能保存进度，请先导出备份再更新。'),INSTALL_FAILED:t('Installation could not start. Please try again.','未能启动安装，请重试。')};
   status.textContent=errors[state.error]||messages[state.status]||'';
   if(state.manualOpened)status.textContent=t('The Mac installer download has opened in your browser. Quit Eumo and replace it in Applications after downloading.','已在浏览器中打开 Mac 安装包下载。下载后退出 Eumo，并替换“应用程序”中的旧版。');
   action.disabled=['checking','downloading','installing','unavailable'].includes(state.status);
   action.textContent=state.status==='available'?(state.automaticInstall?t('Download update','下载更新'):t('Download Mac installer','下载 Mac 安装包')):state.status==='downloaded'?t('Restart and install','重启安装'):t('Check for updates','检查更新');
   bar.hidden=state.status!=='downloading';bar.value=state.percent;bar.setAttribute('aria-label',t('Update download progress','更新下载进度'));
   section.querySelector('.desktop-update-note').textContent=state.platform==='darwin'?t('Mac updates currently use the installer. Automatic replacement requires an Apple Developer ID signed release.','Mac 当前通过安装包更新；自动替换安装需要 Apple Developer ID 签名版本。'):t('Downloading will not interrupt your session. Restarting pauses your timer and saves progress before installing.','下载不会打断专注；重启安装前会暂停计时并保存进度。');
   badge.hidden=!['available','downloading','downloaded'].includes(state.status);
   badge.textContent=state.status==='downloaded'?t('Update ready','更新已就绪'):state.status==='downloading'?t('Updating: ','下载更新：')+state.percent+'%':t('Update available','有新版本');
  }
  action.addEventListener('click',async()=>{action.disabled=true;try{render(await(state.status==='available'?bridge.downloadUpdate():state.status==='downloaded'?bridge.installUpdate():bridge.checkForUpdates()));}catch{render({...state,status:'error',error:'CHECK_FAILED'});}});
  bridge.onUpdateState(render);bridge.onOpenUpdates(show);bridge.getUpdateState().then(render).catch(()=>{});window.addEventListener('eumo-language',()=>render());
 }
 return {init};
})();
