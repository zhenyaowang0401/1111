'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('EumoDesktop',Object.freeze({
 nativeFloating:true,
 returnToMain:()=>ipcRenderer.send('eumo:focus-main'),
 onBackup:callback=>{if(typeof callback!=='function')return;const listener=()=>callback();ipcRenderer.on('eumo:backup',listener);return()=>ipcRenderer.removeListener('eumo:backup',listener);}
}));
