'use strict';
const {APP_ORIGIN}=require('./config.cjs');
function trusted(wc,getMain,url){try{return wc===getMain()?.webContents&&new URL(url).origin===APP_ORIGIN&&new URL(wc.getURL()).origin===APP_ORIGIN;}catch{return false;}}
function installMicrophonePermissions({session,getMain,dialog,systemPreferences,platform=process.platform}){
 let allowed=false,pending=null;
 session.setPermissionCheckHandler((wc,permission,origin,details)=>permission==='clipboard-sanitized-write'||permission==='media'&&allowed&&details.mediaType==='audio'&&trusted(wc,getMain,origin));
 session.setPermissionRequestHandler((wc,permission,callback,details)=>{
  if(permission==='clipboard-sanitized-write')return callback(true);
  if(permission!=='media'||!details.isMainFrame||!trusted(wc,getMain,details.requestingUrl)||!Array.isArray(details.mediaTypes)||details.mediaTypes.length!==1||details.mediaTypes[0]!=='audio')return callback(false);
  if(allowed)return callback(true);
  if(!pending)pending=(async()=>{
   const result=await dialog.showMessageBox(getMain(),{type:'question',title:'Eumo · Microphone',message:'Allow Eumo to use your microphone?',detail:'Record a short voice message. When you stop, the audio is sent to the speech service to turn it into text. You can review the text before sending your message. Camera access is not requested.',buttons:['Not now','Allow microphone'],defaultId:0,cancelId:0,noLink:true});
   if(result.response!==1)return false;
   if(platform==='darwin'&&!await systemPreferences.askForMediaAccess('microphone'))return false;
   allowed=true;return true;
  })().catch(()=>false).finally(()=>{pending=null;});
  pending.then(value=>callback(value&&trusted(wc,getMain,details.requestingUrl)));
 });
}
module.exports={installMicrophonePermissions};
