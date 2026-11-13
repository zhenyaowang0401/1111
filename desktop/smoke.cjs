'use strict';
const assert=require('node:assert/strict');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(test){for(let i=0;i<150;i++){if(await test())return;await wait(100);}throw Error('Desktop smoke timed out');}
module.exports.runSmoke=async({win,app,session,getFloating,origin})=>{
 await require('./update-smoke.cjs').runUpdateSmoke();
 await until(()=>win.webContents.executeJavaScript('!!window.FloatingMole && !!window.MoleArt?.ready').catch(()=>false));
 assert.equal(await win.webContents.executeJavaScript("typeof EumoVoice.init==='function' && !!document.getElementById('moleChatMic') && !!document.getElementById('chatDialogMic')"),true);
 assert.equal(await win.webContents.executeJavaScript("typeof require==='undefined' && typeof process==='undefined' && EumoDesktop.nativeFloating"),true);
 await win.webContents.executeJavaScript("localStorage.setItem('eumo-tour-v1','seen');state.profile={name:'Desktop test',color:'#a8b77a',configured:true};save();location.reload()");
 await until(()=>win.webContents.executeJavaScript("typeof state!=='undefined' && state.profile.name==='Desktop test'").catch(()=>false));
 await until(()=>win.webContents.executeJavaScript('!!MoleArt.ready').catch(()=>false));
 assert.equal(await win.webContents.executeJavaScript("document.querySelector('.desktop-updates')!==null && document.getElementById('desktopUpdateNotice').hidden"),true);
 assert.equal((await win.webContents.executeJavaScript("EumoDesktop.getUpdateState()")).status,'unavailable');
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
 await win.webContents.executeJavaScript("document.getElementById('startButton').click()",true);
 assert.equal(await win.webContents.executeJavaScript("state.session.status"),'running');
 assert.equal(await win.webContents.executeJavaScript("EumoPrepareUpdate()"),true);
 assert.equal(await win.webContents.executeJavaScript("state.session.status"),'paused');
 assert.equal(await win.webContents.executeJavaScript("JSON.parse(localStorage.getItem('loop-pet-soft-universe-v1')).session.status"),'paused');
 // Static views still work with networking disabled; the persistent partition retains progress.
 await session.defaultSession.enableNetworkEmulation({offline:true});
 await win.webContents.executeJavaScript("state.home.slots.floor='rug';save();location.reload()");
 await until(()=>win.webContents.executeJavaScript("typeof state!=='undefined' && state.profile.name==='Desktop test' && state.home.slots.floor==='rug'").catch(()=>false));
 await win.webContents.executeJavaScript("navigateTo('home')");
 assert.equal(await win.webContents.executeJavaScript("!document.getElementById('home').hidden && HomeScenery.ready"),true);
 assert.equal(await win.webContents.executeJavaScript("WardrobeCatalog.items.filter(i=>i.recipe && i.category!=='hats').length===9 && WardrobeCatalog.items.filter(i=>i.recipe).every(i=>i.rarity==='Relic') && typeof WardrobeArt.glassesSide==='function' && !!WardrobeArt.iconSVG('prismglasses')"),true);
 // The packaged/offline app shares the exact click route and climbing animation.
 const clickHome=async(x,y)=>win.webContents.executeJavaScript(`(()=>{const c=document.getElementById('homeCanvas'),r=c.getBoundingClientRect();c.dispatchEvent(new MouseEvent('click',{bubbles:true,button:0,detail:1,clientX:r.left+${x}*r.width/640,clientY:r.top+${y}*r.height/360}));})()`);
 await clickHome(140,110);
 await until(()=>win.webContents.executeJavaScript("HomeWalk.snapshot().moving && HomeWalk.snapshot().motion==='climb'"));
 await until(()=>win.webContents.executeJavaScript("!HomeWalk.snapshot().moving"));
 assert.equal(await win.webContents.executeJavaScript("Math.abs(HomeWalk.snapshot().x-140)<1 && HomeWalk.snapshot().y===149 && state.home.slots.floor==='rug' && state.session.status==='paused'"),true);
 // The same exclusive wardrobe views work in the packaged, offline app.
 await win.webContents.executeJavaScript("state.owned=[...new Set([...state.owned,'hat'])];renderStats();navigateTo('wardrobe');document.querySelector('[data-filter=shop]').click()");
 assert.equal(await win.webContents.executeJavaScript("document.getElementById('closetTitle').textContent==='Shop' && !document.querySelector('[data-item=hat]')"),true);
 await win.webContents.executeJavaScript("document.querySelector('[data-filter=owned]').click()");
 assert.equal(await win.webContents.executeJavaScript("document.getElementById('closetTitle').textContent==='Owned' && !!document.querySelector('[data-item=hat]') && [...document.querySelectorAll('#outfitGrid .item-action button')].every(b=>!['Buy','Redeem'].includes(b.textContent))"),true);
 await session.defaultSession.disableNetworkEmulation();
};
