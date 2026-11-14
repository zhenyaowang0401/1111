/* Browser PiP or native desktop window. The main view owns all game state. */
'use strict';
window.FloatingMole=(()=>{
 let bridge,pip=null,opening=false,interval=null,animation=null,lastFrame=0,confirmSession=null,lastSession=null,finished=false;
 const button=()=>document.getElementById('floatMoleButton');
 const native=()=>window.EumoDesktop?.nativeFloating===true;
 const supported=()=>native()||window.isSecureContext&&typeof window.documentPictureInPicture?.requestWindow==='function';
 const css=`
 :root{color-scheme:dark;font-family:'Silver','Eumo Silver Complement','Segoe UI',Arial,'Microsoft YaHei',sans-serif;color:#f3eafa;background:#1c1b37}
 *{box-sizing:border-box}body{margin:0;min-width:210px}button{font:inherit;cursor:pointer;color:inherit;border:1px solid #ad8eb0;background:#443653;padding:6px 10px;min-height:32px;border-radius:2px;box-shadow:inset 0 1px #e4c9e52b,1px 2px #15132866}
 button:hover:not(:disabled){filter:brightness(1.12)}button:focus-visible{outline:2px solid #91dfdf;outline-offset:2px}button:disabled{opacity:.45;cursor:default}[hidden]{display:none!important}
 .tunnel-window{position:relative;width:100%;height:100dvh;min-height:240px;overflow:hidden;background:#1c1b37}
 main{position:absolute;inset:0}#mole{display:block;width:100%;height:100%;image-rendering:pixelated}#pet{position:absolute;padding:0;background:none;border:0;box-shadow:none;z-index:1}#pet:disabled{opacity:1}
 .mine-top{position:absolute;inset:0 0 auto;z-index:2;padding:8px 10px 9px;background:linear-gradient(#1c1b37f5,#1c1b37e8);border-bottom:2px solid #b491a16b;box-shadow:0 3px #18142c3b}
 header{display:flex;gap:8px;align-items:center;font-size:11px;height:24px}#name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e8c9df;font-weight:600}#return{display:grid;place-items:center;width:24px;min-height:24px;padding:0;background:#5a456455;border-color:#a98db366}#return svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.7}
 .mine-hud{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px}#time{font-size:27px;line-height:1;font-weight:650;letter-spacing:1px;font-variant-numeric:tabular-nums;color:#ffedb4}.time-detail{display:flex;flex-direction:column;gap:3px;text-align:right}#mode{font-size:10px;color:#d1c3df}#depth{font-size:11px;color:#a7dace}
 footer{position:absolute;z-index:2;bottom:0;left:0;right:0;display:flex;gap:7px;padding:9px 10px;background:linear-gradient(transparent,#251c30a3)}footer button{flex:1;min-width:0;font-size:11px}#toggle{background:#e3b0d0;color:#33243e;border-color:#f8d7eb;font-weight:600}#end{background:#46374fe8;border-color:#b998b9}
 #hint{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
 #confirmation{position:absolute;z-index:4;top:50%;left:10px;right:10px;transform:translateY(-50%);border:2px solid #af90b7;padding:12px;background:#30263ff5;box-shadow:0 0 0 100vmax #15102188}#confirmation p{margin:0 0 10px;font-size:12px;line-height:1.4}#confirmation div{display:flex;gap:6px}#confirmation button{flex:1;font-size:11px}
 @media(min-width:300px) and (min-height:380px){.mine-top{padding:10px 12px}header{font-size:12px}#time{font-size:30px}footer{padding:12px}footer button{font-size:12px;min-height:36px}}
 :root{background:#243a35;color:var(--text)}
 .tunnel-window{background:#243a35}
 .mine-top{background:var(--panel);border-color:var(--edge);box-shadow:inset 0 0 0 1px var(--board-light),0 2px #17382d66}
 #name{color:var(--text)}#time{color:var(--timer)}#mode{color:var(--muted)}#depth{color:var(--cyan)}
 button,#return,#end{background:var(--button);color:var(--text);border-color:var(--edge);border-radius:2px;box-shadow:inset 1px 1px var(--board-light),1px 2px #142f2866}
 #toggle{background:var(--primary);color:var(--primary-ink);border-color:var(--edge)}
#confirmation{background:var(--panel);color:var(--text);border-color:var(--edge)}
 footer{background:linear-gradient(transparent,#253c35ba)}
 button:focus-visible{outline-color:var(--primary)}
 #return{width:36px;min-height:36px}header{height:36px}
 #return svg{width:30px;height:30px;stroke-width:2}
 #toggle{display:grid;place-items:center;color:#fff;min-height:40px}
 #toggle svg{width:24px;height:24px}
 `;
 function markOpen(value){const b=button();b.setAttribute('aria-pressed',String(value));FocusIcons.set(b,value?'return':'depart',value?'Close floating mole':'Float mole ↗');}
 function sharedFonts(){
  const fonts=[];
  // Copy the main font face into the separate document. Bundled data URLs keep
  // working offline; normal stylesheet URLs resolve against their own source.
  for(const sheet of document.styleSheets){
   let rules;try{rules=sheet.cssRules;}catch{continue;}
   for(const rule of rules){
    if(rule.type!==CSSRule.FONT_FACE_RULE||!['Silver','Eumo Silver Complement'].some(name=>rule.style.fontFamily.includes(name)))continue;
    fonts.push(rule.cssText.replace(/url\(["']?([^"')]+)["']?\)/g,(_,url)=>`url("${new URL(url,sheet.href||document.baseURI).href}")`));
   }
  }
  return fonts.join('\n');
 }
 function cleanup(w){if(pip!==w)return;if(interval!==null)w.clearInterval(interval);if(animation!==null)w.cancelAnimationFrame(animation);interval=null;animation=null;pip=null;confirmSession=null;lastSession=null;finished=false;markOpen(false);}
 function close(){if(!pip)return;const w=pip;cleanup(w);w.close();}
 function sync(){
  if(!pip||pip.closed)return;const s=bridge.snapshot(),d=pip.document,t=s.session;
  if(d.body.dataset.period!==document.body.dataset.period){
   d.body.dataset.period=document.body.dataset.period;
   const palette=getComputedStyle(document.body);
   for(const name of ['panel','text','muted','timer','cyan','button','edge','board-light','primary','primary-ink'])d.documentElement.style.setProperty('--'+name,palette.getPropertyValue('--'+name));
   d.documentElement.style.colorScheme=palette.colorScheme;
  }
  if(lastSession&&!t)finished=true;if(t)finished=false;lastSession=t?.id||null;
  if(confirmSession!==t?.id){confirmSession=null;d.getElementById('confirmation').hidden=true;}
  const running=t?.status==='running',rest=t?.mode==='rest',seconds=Math.max(0,Math.ceil(s.remaining));
  d.getElementById('name').textContent=s.profile.name;
  d.getElementById('mode').textContent=t?(t.demo?'Demo':rest?'Break':t.mode==='work'?'Work':'Study')+' · '+(running?'Running':'Paused'):finished?'Session saved':'Ready';
  d.getElementById('time').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  d.getElementById('depth').textContent=Math.floor(PixelArt.digMetrics(s).worldDepth)+' m dug';
  FocusIcons.set(d.getElementById('toggle'),running?'pause':'play',t?(running?'Pause':'Resume'):'Start');
  FocusIcons.set(d.getElementById('return'),'return','Back to Eumo');
  d.getElementById('end').hidden=!t;d.getElementById('pet').disabled=!!t;
  d.getElementById('pet').setAttribute('aria-label','Pet '+s.profile.name);
  // Store only an ephemeral drawing snapshot, never another session or reward ledger.
  draw(s,Math.floor(Date.now()/150));
 }
 function draw(s,frame){if(!pip||pip.closed)return;const d=pip.document,canvas=d.getElementById('mole'),rect=canvas.getBoundingClientRect(),width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height)),density=Math.max(1,Math.ceil(pip.devicePixelRatio||1));
  if(canvas.width!==width*density||canvas.height!==height*density){canvas.width=width*density;canvas.height=height*density;}
  const c=canvas.getContext('2d');c.setTransform(density,0,0,density,0,0);c.imageSmoothingEnabled=false;
  const b=PixelArt.renderFloating(c,s,frame,{width,height,top:d.querySelector('.mine-top').getBoundingClientRect().height,bottom:d.querySelector('footer').getBoundingClientRect().height}),pet=d.getElementById('pet');
  pet.style.left=b.x/width*100+'%';pet.style.top=b.y/height*100+'%';pet.style.width=b.w/width*100+'%';pet.style.height=b.h/height*100+'%';
  canvas.dataset.pixelScale=String(b.scale);
 }
 function animate(now){if(!pip||pip.closed)return;const w=pip;if(now-lastFrame>=120){lastFrame=now;draw(bridge.visual(),Math.floor(Date.now()/150));}animation=w.requestAnimationFrame(animate);}
 async function open(){
  if(opening)return;if(pip&&!pip.closed){close();return;}
  if(!supported()){document.getElementById('floatingHelpDialog').showModal();return;}
  opening=true;button().disabled=true;
  try{
   // Browser-owned origin/close chrome cannot be removed. Omit only its redundant return button.
   const w=native()?window.open('about:blank','eumo-floating','popup,width=256,height=360'):await window.documentPictureInPicture.requestWindow({width:256,height:360,preferInitialWindowPlacement:true,disallowReturnToOpener:true});if(!w)throw Error('Window blocked');pip=w;
   w.addEventListener('pagehide',()=>cleanup(w),{once:true});
   w.addEventListener('resize',()=>{if(pip===w)draw(bridge.visual(),Math.floor(Date.now()/150));});
   const d=w.document;d.documentElement.lang='en';d.title='Eumo';
   const style=d.createElement('style');style.textContent=sharedFonts()+css+(native()?'header{-webkit-app-region:drag;cursor:move}header button{-webkit-app-region:no-drag}#closeNative{width:28px;min-height:28px;padding:0;font-size:18px}':'');d.head.append(style);if(native())d.body.dataset.desktop='true';
   d.body.innerHTML=`<section class="tunnel-window" aria-label="Your floating mine"><main><canvas id="mole" width="256" height="360" aria-hidden="true"></canvas><button id="pet" aria-label="Pet your mole"></button></main><div class="mine-top"><header><span id="name"></span><button id="return" title="Back to Eumo" aria-label="Back to Eumo"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2h5v5M14 2 7 9M6 3H2v11h11v-4"/></svg></button></header><div class="mine-hud"><div id="time" role="timer"></div><div class="time-detail"><span id="mode"></span><span id="depth"></span></div></div></div><section id="confirmation" aria-label="End session confirmation" hidden><p>End this session and save your progress?</p><div><button id="keep">Keep going</button><button id="save">End &amp; save</button></div></section><footer><button id="toggle">Start</button><button id="end">End session</button></footer><p id="hint">Drag the title bar · Keep Eumo open</p></section>`;
   if(native()){const x=d.createElement('button');x.id='closeNative';x.textContent='×';x.title='Close floating mole';x.setAttribute('aria-label','Close floating mole');x.onclick=close;d.querySelector('header').append(x);}
   window.EumoI18n?.observe(d);
   d.getElementById('toggle').addEventListener('click',()=>{confirmSession=null;d.getElementById('confirmation').hidden=true;bridge.toggle();sync();});
   d.getElementById('end').addEventListener('click',()=>{const s=bridge.snapshot();if(!s.session){sync();return;}confirmSession=s.session.id;d.getElementById('confirmation').hidden=false;d.getElementById('keep').focus();});
   d.getElementById('keep').addEventListener('click',()=>{confirmSession=null;d.getElementById('confirmation').hidden=true;d.getElementById('end').focus();});
   d.getElementById('save').addEventListener('click',()=>{const id=confirmSession;confirmSession=null;d.getElementById('confirmation').hidden=true;if(id)bridge.end(id);sync();});
   d.getElementById('return').addEventListener('click',()=>{if(native())window.EumoDesktop.returnToMain();else window.focus();bridge.returnToFocus();close();});
   d.getElementById('pet').addEventListener('click',()=>{bridge.pet();sync();});
   d.addEventListener('keydown',e=>{if(e.key==='Escape'&&confirmSession){e.preventDefault();confirmSession=null;d.getElementById('confirmation').hidden=true;}});
   lastSession=null;finished=false;lastFrame=0;markOpen(true);sync();interval=w.setInterval(sync,250);animation=w.requestAnimationFrame(animate);
   bridge.notify(native()?'Your mole is floating. Drag its name to move the window.':'Your mole is floating. Drag its window to a corner; keep this tab open.');
  }catch(e){close();bridge.notify(native()?'Could not open the floating mole. Please try again.':'Could not open the floating mole. Try again in a separate Chrome or Edge tab.');}
  finally{opening=false;button().disabled=false;}
 }
 function init(options){bridge=options;markOpen(false);button().addEventListener('click',open);window.addEventListener('pagehide',close);}
 return {init,close,supported};
})();
