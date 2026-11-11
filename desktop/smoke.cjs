'use strict';
const assert=require('node:assert/strict');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(test){for(let i=0;i<150;i++){if(await test())return;await wait(100);}throw Error('Desktop smoke timed out');}
module.exports.runSmoke=async({win,app,session,getFloating,origin})=>{
 await until(()=>win.webContents.executeJavaScript('!!window.FloatingMole && !!window.MoleArt?.ready').catch(()=>false));
 assert.equal(await win.webContents.executeJavaScript("typeof require==='undefined' && typeof process==='undefined' && EumoDesktop.nativeFloating"),true);
 await win.webContents.executeJavaScript("localStorage.setItem('eumo-tour-v1','seen');state.profile={name:'Desktop test',color:'#a8b77a',configured:true};save();location.reload()");
 await until(()=>win.webContents.executeJavaScript("typeof state!=='undefined' && state.profile.name==='Desktop test'").catch(()=>false));
 await until(()=>win.webContents.executeJavaScript('!!MoleArt.ready').catch(()=>false));
 await win.webContents.executeJavaScript("document.getElementById('floatMoleButton').click()",true);
 await until(()=>getFloating()&&!getFloating().isDestroyed());const pip=getFloating();
 await until(()=>pip.webContents.executeJavaScript("!!document.getElementById('toggle')").catch(()=>false));
 if(app.commandLine.getSwitchValue('ozone-platform')!=='headless')assert.equal(pip.isAlwaysOnTop(),true);assert.equal(pip.isResizable(),true);assert.deepEqual(pip.getSize(),pip.getContentSize());
 assert.equal(await pip.webContents.executeJavaScript("document.body.dataset.desktop==='true' && !!document.getElementById('closeNative')"),true);
 await pip.webContents.executeJavaScript("document.getElementById('toggle').click()",true);
 await until(()=>win.webContents.executeJavaScript("state.session?.status==='running'"));
 win.close();assert.equal(win.isVisible(),false);assert.equal(pip.isDestroyed(),false);
 await pip.webContents.executeJavaScript("document.getElementById('toggle').click()",true);
 await until(()=>win.webContents.executeJavaScript("state.session?.status==='paused'"));
 await pip.webContents.executeJavaScript("document.getElementById('return').click()",true);
 await until(()=>!getFloating());assert.equal(win.isVisible(),true);
 // Static views still work with networking disabled; the persistent partition retains progress.
 await session.defaultSession.enableNetworkEmulation({offline:true});
 await win.webContents.executeJavaScript("state.home.slots.floor='rug';save();location.reload()");
 await until(()=>win.webContents.executeJavaScript("typeof state!=='undefined' && state.profile.name==='Desktop test' && state.home.slots.floor==='rug'").catch(()=>false));
 await win.webContents.executeJavaScript("navigateTo('home')");
 assert.equal(await win.webContents.executeJavaScript("!document.getElementById('home').hidden && HomeScenery.ready"),true);
 await session.defaultSession.disableNetworkEmulation();
};
