'use strict';
const {app,BrowserWindow,Menu,session,shell,ipcMain,screen,dialog,systemPreferences}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const {APP_ORIGIN,RELEASES,FLOAT_NAME}=require('./config.cjs');
const {createHandler,createUpstream}=require('./protocol.cjs');
let main=null,floating=null,quitting=false;
const web=path.join(__dirname,'web'),preload=path.join(__dirname,'preload.cjs');
const preferences={preload,nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,backgroundThrottling:false};
const smoke=process.argv.includes('--desktop-smoke');
if(smoke)app.setPath('userData',fs.mkdtempSync(path.join(require('node:os').tmpdir(),'eumo-smoke-')));
function showMain(){if(main&&!main.isDestroyed()){if(main.isMinimized())main.restore();main.show();main.focus();}}
function storedBounds(){try{const b=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'window.json'),'utf8'));if(![b.x,b.y,b.width,b.height].every(Number.isFinite))return {};const area=screen.getDisplayMatching(b).workArea;return {width:Math.max(800,Math.min(b.width,area.width)),height:Math.max(600,Math.min(b.height,area.height)),x:Math.max(area.x,Math.min(b.x,area.x+area.width-800)),y:Math.max(area.y,Math.min(b.y,area.y+area.height-600))};}catch{return {};}}
function allowNavigation(win){
 win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==APP_ORIGIN){event.preventDefault();external(url);}});
 win.webContents.on('will-attach-webview',event=>event.preventDefault());
}
function external(url){try{const u=new URL(url);if(u.protocol==='https:'&&['github.com','1111-phi-ten.vercel.app'].includes(u.hostname))shell.openExternal(u.href);}catch{}}
function createMain(){
 main=new BrowserWindow({width:1280,height:880,minWidth:800,minHeight:600,backgroundColor:'#e2e8d6',title:'Eumo',...storedBounds(),show:false,webPreferences:preferences});
 allowNavigation(main);
 main.webContents.setWindowOpenHandler(({url,frameName})=>{
  if(url==='about:blank'&&frameName===FLOAT_NAME&&!floating)return {action:'allow',overrideBrowserWindowOptions:{width:256,height:360,minWidth:210,minHeight:260,frame:false,transparent:false,resizable:true,alwaysOnTop:true,backgroundColor:'#243a35',title:'Eumo · Mole',webPreferences:preferences}};
  external(url);return {action:'deny'};
 });
 main.webContents.on('did-create-window',(win,{frameName})=>{
  if(frameName!==FLOAT_NAME){win.close();return;}
  floating=win;win.setAlwaysOnTop(true,'floating');if(process.platform==='darwin')win.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});
  allowNavigation(win);win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.on('closed',()=>{floating=null;if(!quitting)showMain();});
 });
 main.on('close',event=>{
  if(floating&&!quitting){event.preventDefault();main.hide();return;}
  try{fs.writeFileSync(path.join(app.getPath('userData'),'window.json'),JSON.stringify(main.getNormalBounds()));}catch{}
 });
 main.on('closed',()=>{main=null;});
 main.once('ready-to-show',()=>main.show());main.loadURL(APP_ORIGIN+'/#focus');
 if(smoke)runSmoke(main);
}
async function runSmoke(win){
 const {runSmoke}=require('./smoke.cjs');
 try{await runSmoke({win,app,session,getFloating:()=>floating,origin:APP_ORIGIN});console.log('DESKTOP_SMOKE_PASS');app.exit(0);}catch(error){console.error('DESKTOP_SMOKE_FAIL',error);app.exit(1);}
}
if(!app.requestSingleInstanceLock()){app.quit();}else{
 app.on('second-instance',showMain);
 app.on('before-quit',()=>{quitting=true;});
 app.whenReady().then(()=>{
  const ses=session.defaultSession,manifest=new Set(JSON.parse(fs.readFileSync(path.join(web,'manifest.json'),'utf8')));
  ses.protocol.handle('https',createHandler({root:web,manifest,readFile:fs.promises.readFile,upstream:createUpstream(ses)}));
  // No Node APIs in web content, no certificate exceptions, and no remote executable pages.
  require('./microphone.cjs').installMicrophonePermissions({session:ses,getMain:()=>main,dialog,systemPreferences});
  ipcMain.on('eumo:focus-main',event=>{if(event.sender===main?.webContents||event.sender===floating?.webContents)showMain();});
  Menu.setApplicationMenu(Menu.buildFromTemplate([
   ...(process.platform==='darwin'?[{role:'appMenu'}]:[]),
   {label:'Eumo',submenu:[{label:'Show Eumo',accelerator:'CmdOrCtrl+Shift+M',click:showMain},{label:'Move / back up progress…',click:()=>{showMain();main?.webContents.send('eumo:backup');}},{type:'separator'},{label:'Download updates',click:()=>shell.openExternal(RELEASES)},{label:'Web version',click:()=>shell.openExternal(APP_ORIGIN)},{type:'separator'},{role:'quit'}]},
   {role:'editMenu'},{role:'viewMenu'},{role:'windowMenu'}
  ]));
  createMain();app.on('activate',()=>{if(!main)createMain();else showMain();});
 });
 app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
}
