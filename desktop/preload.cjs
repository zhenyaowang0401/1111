'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('EumoDesktop',Object.freeze({
 nativeFloating:true,
 getUpdateState:()=>ipcRenderer.invoke('eumo:update-state'),
 checkForUpdates:()=>ipcRenderer.invoke('eumo:update-check'),
 downloadUpdate:()=>ipcRenderer.invoke('eumo:update-download'),
 installUpdate:()=>ipcRenderer.invoke('eumo:update-install'),
 onUpdateState:callback=>{if(typeof callback!=='function')return;const listener=(_event,state)=>callback(state);ipcRenderer.on('eumo:update-state',listener);return()=>ipcRenderer.removeListener('eumo:update-state',listener);},
 onOpenUpdates:callback=>{if(typeof callback!=='function')return;const listener=()=>callback();ipcRenderer.on('eumo:open-updates',listener);return()=>ipcRenderer.removeListener('eumo:open-updates',listener);},
 returnToMain:()=>ipcRenderer.send('eumo:focus-main'),
 onBackup:callback=>{if(typeof callback!=='function')return;const listener=()=>callback();ipcRenderer.on('eumo:backup',listener);return()=>ipcRenderer.removeListener('eumo:backup',listener);}
}));
