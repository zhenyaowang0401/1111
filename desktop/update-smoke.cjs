'use strict';
// Exercise the real Windows updater's HTTP and checksum pipeline without running an installer.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
module.exports.runUpdateSmoke=async()=>{
 const {NsisUpdater}=require('electron-updater'),{ElectronHttpExecutor}=require('electron-updater/out/electronHttpExecutor');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'eumo-update-smoke-')),bytes=Buffer.from('Test fixture only. This is not an executable.'),sha512=crypto.createHash('sha512').update(bytes).digest('base64');let corrupt=false,latest='9.1.0',downloads=0,base;
 const server=http.createServer((req,res)=>{
  if(req.url.startsWith('/latest.yml')){res.writeHead(200,{'Content-Type':'text/yaml'});res.end(JSON.stringify({version:latest,files:[{url:base+'/setup.exe',sha512,size:bytes.length}],path:base+'/setup.exe',sha512}));}
  else{downloads++;res.writeHead(200,{'Content-Length':bytes.length});res.end(corrupt?Buffer.alloc(bytes.length,1):bytes);}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;
 function updater(index){
  const dir=path.join(root,String(index));fs.mkdirSync(dir);const config=path.join(dir,'app-update.yml');fs.writeFileSync(config,JSON.stringify({provider:'generic',url:base,updaterCacheDirName:'cache'}));
  const instance=new NsisUpdater(null,{version:'9.0.0',name:'Eumo update test',isPackaged:true,appUpdateConfigPath:config,userDataPath:dir,baseCachePath:dir,whenReady:async()=>{},onQuit:()=>{},quit:()=>{throw Error('Must not install during this test');}});
  instance.httpExecutor=new ElectronHttpExecutor();instance._testOnlyOptions={platform:'win32'};instance.logger=null;instance.autoDownload=false;instance.autoInstallOnAppQuit=false;instance.allowDowngrade=false;instance.disableDifferentialDownload=true;instance.setFeedURL({provider:'generic',url:base});return instance;
 }
 try{
  const good=updater(1);const result=await good.checkForUpdates();assert.equal(result.isUpdateAvailable,true);assert.equal(downloads,0);const files=await good.downloadUpdate();assert.deepEqual(fs.readFileSync(files[0]),bytes);
  corrupt=true;const bad=updater(2);await bad.checkForUpdates();await assert.rejects(bad.downloadUpdate(),/checksum|sha512/i);
  latest='8.0.0';const old=updater(3);assert.equal((await old.checkForUpdates()).isUpdateAvailable,false);
  console.log('UPDATE_SMOKE_PASS: real updater downloaded and verified a fixture, rejected corrupt bytes, and rejected a downgrade.');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
};
