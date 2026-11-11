/* Portable progress only: no cookies, friend credentials or chat transcripts. */
'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SaveTransfer=factory();})(typeof window==='undefined'?globalThis:window,()=>{
 const GAME='loop-pet-soft-universe-v1',KEYS=[GAME,'eumo-language','eumo-appearance','eumo-tour-v1'];
 function parse(text){
  if(typeof text!=='string'||text.length>8000000)throw Error('Invalid backup');
  const value=JSON.parse(text);if(value?.format!=='eumo-progress'||value.version!==1||!value.storage||typeof value.storage!=='object')throw Error('Invalid backup');
  const storage={};for(const key of KEYS)if(Object.hasOwn(value.storage,key)){if(typeof value.storage[key]!=='string')throw Error('Invalid backup');storage[key]=value.storage[key];}
  const s=JSON.parse(storage[GAME]||'null');if(!s?.profile||typeof s.profile.name!=='string'||!Array.isArray(s.inventory)||s.inventory.length!==4||!s.inventory.every(n=>Number.isFinite(n)&&n>=0)||!Number.isFinite(s.balance)||s.balance<0||!Array.isArray(s.owned)||!s.home||typeof s.home.slots!=='object'||s.session?.status==='running')throw Error('Invalid backup');
  if(storage['eumo-language']&&!['en','zh'].includes(storage['eumo-language']))throw Error('Invalid backup');
  if(storage['eumo-appearance']&&!['auto','day','night'].includes(storage['eumo-appearance']))throw Error('Invalid backup');
  return storage;
 }
 function encode(storage){const values={};for(const key of KEYS){const value=storage.getItem(key);if(value!==null)values[key]=value;}const text=JSON.stringify({format:'eumo-progress',version:1,createdAt:new Date().toISOString(),storage:values},null,2);parse(text);return text;}
 function apply(storage,values){const before=Object.fromEntries(KEYS.map(key=>[key,storage.getItem(key)]));try{for(const key of KEYS)if(Object.hasOwn(values,key))storage.setItem(key,values[key]);}catch(error){for(const key of KEYS)try{before[key]===null?storage.removeItem(key):storage.setItem(key,before[key]);}catch{}throw error;}}
 function init(bridge){
  const dialog=document.getElementById('saveTransferDialog'),status=document.getElementById('saveTransferStatus'),file=document.getElementById('saveTransferFile'),t=s=>window.EumoI18n?.t(s)||s;
  function open(){document.getElementById('infoDialog')?.close();status.textContent='';dialog.showModal();}
  document.getElementById('openSaveTransfer').onclick=open;window.EumoDesktop?.onBackup(open);
  function available(){if(bridge.read().session?.status==='running'){status.textContent=t('Pause your session before moving progress.');return false;}return true;}
  document.getElementById('exportProgress').onclick=()=>{
   if(!available())return;try{bridge.flush();const blob=new Blob([encode(localStorage)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Eumo-progress-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent=t('Backup downloaded. Keep it somewhere safe.');}catch{status.textContent=t('Could not save the backup.');}
  };
  document.getElementById('importProgress').onclick=()=>{if(available()){file.value='';file.click();}};
  file.onchange=async()=>{
   if(!file.files[0]||!available())return;
   try{if(file.files[0].size>8000000)throw Error();const values=parse(await file.files[0].text());if(!available()||!confirm(t('Replace the progress on this device with this backup? Export your current progress first if you want to keep it.')))return;apply(localStorage,values);bridge.beforeReload();location.reload();}catch{status.textContent=t('This backup could not be imported. Your current game is still here.');}
  };
 }
 return {parse,encode,apply,init};
});
