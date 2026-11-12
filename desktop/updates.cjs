'use strict';
const {APP_ORIGIN,RELEASES}=require('./config.cjs');
const FEED=RELEASES+'/download';
function trustedUpdateSender(event,main){
 try{return !!main&&!main.isDestroyed()&&event.sender===main.webContents&&event.senderFrame===main.webContents.mainFrame&&new URL(event.senderFrame.url).origin===APP_ORIGIN;}catch{return false;}
}
function createUpdates({updater,version,platform=process.platform,arch=process.arch,enabled=true,onState=()=>{},openExternal,confirmInstall,prepareInstall,beforeInstall=()=>{},installFailed=()=>{}}){
 let state={currentVersion:version,version:null,status:enabled?'idle':'unavailable',percent:0,error:null,platform,automaticInstall:platform==='win32'},checking=false,downloading=false,installing=false;
 const publish=patch=>{state={...state,...patch};onState({...state});return {...state};};
 const getState=()=>({...state});
 if(enabled){
  updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.autoRunAppAfterInstall=true;updater.allowPrerelease=false;updater.disableDifferentialDownload=true;
  updater.setFeedURL({provider:'generic',url:FEED,channel:platform==='darwin'?'latest-'+arch:'latest'});
  updater.allowDowngrade=false;
  updater.on('update-available',info=>{if(!/^\d+\.\d+\.\d+$/.test(info.version))return publish({status:'error',error:'CHECK_FAILED'});publish({status:'available',version:info.version,error:null,percent:0});});
  updater.on('update-not-available',()=>publish({status:'current',version:null,error:null}));
  updater.on('download-progress',p=>{if(downloading)publish({percent:Math.max(0,Math.min(100,Math.floor(Number(p.percent)||0)))});});
  // Check/download failures are handled by their promises; installation may fail asynchronously.
  updater.on('error',()=>{if(installing){installing=false;installFailed();publish({status:'downloaded',error:'INSTALL_FAILED'});}});
 }
 async function check(){
  if(!enabled||checking||downloading||installing||state.status==='downloaded')return getState();
  checking=true;publish({status:'checking',error:null,manualOpened:false});
  try{const result=await updater.checkForUpdates();if(!result||state.status==='checking')publish({status:'error',error:'CHECK_FAILED'});}
  catch{publish({status:'error',error:'CHECK_FAILED'});}finally{checking=false;}
  return getState();
 }
 async function download(){
  if(!enabled||state.status!=='available'||downloading)return getState();
  if(platform==='darwin'){
   try{await openExternal(`https://github.com/zhenyaowang0401/1111/releases/download/desktop-v${state.version}/Eumo-macOS-${arch}.dmg`);publish({error:null,manualOpened:true});}catch{publish({error:'DOWNLOAD_FAILED'});}
   return getState();
  }
  if(platform!=='win32')return getState();
  downloading=true;publish({status:'downloading',error:null,percent:0});
  try{await updater.downloadUpdate();publish({status:'downloaded',percent:100,error:null});}
  catch{publish({status:'available',percent:0,error:'DOWNLOAD_FAILED'});}finally{downloading=false;}
  return getState();
 }
 async function install(){
  if(!enabled||platform!=='win32'||state.status!=='downloaded'||installing)return getState();
  installing=true;
  try{
   if(!await confirmInstall(state.version)){installing=false;return getState();}
   if(!await prepareInstall()){installing=false;return publish({error:'SAVE_FAILED'});}
   publish({status:'installing',error:null});beforeInstall();updater.quitAndInstall(true,true);
  }catch{installing=false;installFailed();publish({status:'downloaded',error:'INSTALL_FAILED'});}
  return getState();
 }
 return {getState,check,download,install};
}
module.exports={createUpdates,trustedUpdateSender,FEED};
