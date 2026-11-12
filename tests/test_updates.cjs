'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createUpdates,trustedUpdateSender,FEED}=require('../desktop/updates.cjs');
const {APP_ORIGIN}=require('../desktop/config.cjs');
class FakeUpdater extends EventEmitter{
 setFeedURL(feed){this.feed=feed;}
 async checkForUpdates(){this.checks=(this.checks||0)+1;if(this.checkError)throw Error('offline');this.emit(this.current?'update-not-available':'update-available',{version:'3.4.0'});return {updateInfo:{version:'3.4.0'}};}
 async downloadUpdate(){this.downloads=(this.downloads||0)+1;this.emit('download-progress',{percent:37.4});if(this.downloadError)throw Error('hash mismatch');return ['/verified/setup.exe'];}
 quitAndInstall(...args){this.installs=(this.installs||0)+1;this.installArgs=args;if(this.installError)this.emit('error',Error('failed'));}
}
function fixture(options={}){const updater=new FakeUpdater(),calls=[],states=[];const controller=createUpdates({updater,version:'3.3.0',platform:'win32',onState:s=>states.push(s),openExternal:async u=>calls.push(u),confirmInstall:async()=>{calls.push('confirm');return true;},prepareInstall:async()=>{calls.push('save');return true;},beforeInstall:()=>calls.push('quit-enabled'),installFailed:()=>calls.push('quit-reset'),...options});return {updater,controller,calls,states};}
test('checking is opt-in for downloads; Windows installs only after confirmation and successful save',async()=>{
 const {updater:u,controller:c,calls,states}=fixture();assert.equal(u.autoDownload,false);assert.equal(u.autoInstallOnAppQuit,false);assert.equal(u.allowDowngrade,false);assert.equal(u.allowPrerelease,false);assert.equal(u.feed.url,FEED);
 await c.install();assert.equal(u.installs,undefined);await c.check();assert.equal(c.getState().status,'available');assert.equal(u.downloads,undefined);
 await c.download();assert.equal(c.getState().status,'downloaded');assert(states.some(s=>s.percent===37));assert.equal(u.installs,undefined);
 await c.check();assert.equal(u.checks,1);await c.install();assert.deepEqual(calls,['confirm','save','quit-enabled']);assert.deepEqual(u.installArgs,[true,true]);assert.equal(c.getState().status,'installing');
});
test('Later, saving failure, and installation failure leave the app usable',async()=>{
 for(const reason of ['later','save','install']){
  const f=fixture({confirmInstall:async()=>reason!=='later',prepareInstall:async()=>reason!=='save'});await f.controller.check();await f.controller.download();f.updater.installError=reason==='install';await f.controller.install();
  assert.equal(f.controller.getState().status,'downloaded');assert.equal(f.updater.installs,reason==='install'?1:undefined);
  if(reason==='save')assert.equal(f.controller.getState().error,'SAVE_FAILED');if(reason==='install')assert(f.calls.includes('quit-reset'));
 }
});
test('failed checks and failed downloads can retry without installing partial files',async()=>{
 const {updater:u,controller:c}=fixture();u.checkError=true;await c.check();assert.equal(c.getState().error,'CHECK_FAILED');u.checkError=false;await c.check();u.downloadError=true;await c.download();assert.equal(c.getState().status,'available');assert.equal(c.getState().error,'DOWNLOAD_FAILED');await c.install();assert.equal(u.installs,undefined);u.downloadError=false;await c.download();assert.equal(c.getState().status,'downloaded');
});
test('concurrent checks and install clicks are serialized',async()=>{
 let release;const {updater:u,controller:c}=fixture({confirmInstall:()=>new Promise(r=>release=r)});await Promise.all([c.check(),c.check()]);assert.equal(u.checks,1);await c.download();const first=c.install();await c.install();release(true);await first;assert.equal(u.installs,1);
});
test('Mac uses architecture-specific feeds and a pinned DMG link without Squirrel install',async()=>{
 for(const arch of ['arm64','x64']){const {updater:u,controller:c,calls}=fixture({platform:'darwin',arch});assert.equal(u.feed.channel,'latest-'+arch);await c.check();await c.download();assert.equal(calls[0],`https://github.com/zhenyaowang0401/1111/releases/download/desktop-v3.4.0/Eumo-macOS-${arch}.dmg`);assert.equal(u.downloads,undefined);await c.install();assert.equal(u.installs,undefined);assert.equal(c.getState().manualOpened,true);}
});
test('development/smoke runs never contact update servers',async()=>{const {updater:u,controller:c}=fixture({enabled:false});await c.check();await c.download();await c.install();assert.equal(c.getState().status,'unavailable');assert.equal(u.checks,undefined);});
test('update IPC accepts only the packaged main frame, never floating, child, or foreign frames',()=>{
 const frame={url:APP_ORIGIN+'/#focus'},wc={mainFrame:frame},main={webContents:wc,isDestroyed:()=>false},event={sender:wc,senderFrame:frame};assert.equal(trustedUpdateSender(event,main),true);
 assert.equal(trustedUpdateSender({...event,sender:{}},main),false);assert.equal(trustedUpdateSender({...event,senderFrame:{url:APP_ORIGIN}},main),false);frame.url='https://evil.example';assert.equal(trustedUpdateSender(event,main),false);assert.equal(trustedUpdateSender(event,null),false);
});
test('release metadata verifies actual bytes, pins assets to a tag, and separates Mac architectures',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),yaml=require('js-yaml'),{prepare}=require('../scripts/prepare_update_metadata.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'eumo-update-test-'));
 try{for(const [platform,arch,ext] of [['win','x64','exe'],['mac','arm64','zip'],['mac','x64','dmg']]){
  const name=platform==='win'?'Eumo-Windows-x64-Setup.exe':`Eumo-macOS-${arch}.${ext}`,bytes=Buffer.from('installer fixture '+arch),sha512=crypto.createHash('sha512').update(bytes).digest('base64');fs.writeFileSync(path.join(dir,name),bytes);
  const source=path.join(dir,platform==='win'?'latest.yml':'latest-mac.yml'),info={version:'3.3.0',files:[{url:name,sha512,...(ext==='dmg'?{}:{size:bytes.length})}],path:name,sha512};fs.writeFileSync(source,yaml.dump(info));
  const target=await prepare({directory:dir,platform,arch,version:'3.3.0'}),result=yaml.load(fs.readFileSync(target,'utf8'));assert(result.files[0].url.includes('/desktop-v3.3.0/'+name));assert.equal(result.path,result.files[0].url);if(platform==='mac')assert(target.endsWith(`latest-${arch}-mac.yml`));
  fs.writeFileSync(source,yaml.dump(info));fs.writeFileSync(path.join(dir,name),'corrupted');await assert.rejects(prepare({directory:dir,platform,arch,version:'3.3.0'}),/checksum/);
 }}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
