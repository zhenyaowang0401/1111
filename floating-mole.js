/* A browser-owned, always-on-top companion. The original tab owns all game state. */
'use strict';
window.FloatingMole=(()=>{
 let bridge,pip=null,opening=false,interval=null,animation=null,lastFrame=0,confirmSession=null,lastSession=null,finished=false;
 const button=()=>document.getElementById('floatMoleButton');
 const supported=()=>window.isSecureContext&&typeof window.documentPictureInPicture?.requestWindow==='function';
 const css=`
 :root{color-scheme:dark;font-family:'Segoe UI',Arial,sans-serif;color:#eee8f8;background:#211e38}
 *{box-sizing:border-box}body{margin:0;padding:12px;min-width:210px}button{font:inherit;cursor:pointer;color:inherit;background:#514364;border:2px solid;border-color:#ac8cb9 #342b46 #342b46 #ac8cb9;padding:7px 10px;min-height:34px}
 button:focus-visible{outline:2px solid #91dfdf;outline-offset:2px}button:disabled{opacity:.45;cursor:default}[hidden]{display:none!important}
 header{display:flex;gap:8px;align-items:center;border-bottom:1px solid #655176;padding-bottom:8px;font-size:12px}#name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f4b1dc;font-weight:600}#return{font-size:11px;padding:3px 7px;min-height:27px}
 main{display:grid;grid-template-columns:112px minmax(0,1fr);align-items:center;gap:12px;padding-top:8px}#pet{padding:0;border:0;background:none;width:112px;height:112px}#pet:disabled{opacity:1}canvas{display:block;image-rendering:pixelated;width:112px;height:112px}
 #mode{font-size:11px;color:#c9bbd9}#time{font-size:34px;line-height:1.3;font-weight:700;font-variant-numeric:tabular-nums;color:#ffedac}#depth{font-size:11px;color:#91dfdf}
 #line{font-size:12px;line-height:1.45;min-height:35px;margin:4px 0 10px;color:#e0d1eb}footer{display:flex;gap:8px}footer button{flex:1;font-size:12px}#toggle{background:#e5abd4;color:#30243f;border-color:#ffdaf0 #94678f #94678f #ffdaf0;font-weight:600}
 #hint{font-size:10px;line-height:1.4;color:#b9aac9;margin:9px 0 0}#confirmation{border:1px solid #af90b7;padding:8px;margin:8px 0;background:#3b304d}#confirmation p{margin:0 0 8px;font-size:12px}#confirmation div{display:flex;gap:6px}#confirmation button{flex:1;font-size:12px}
 @media(max-width:260px){main{grid-template-columns:88px minmax(0,1fr);gap:6px}#pet,canvas{width:88px;height:88px}#time{font-size:28px}}
 `;
 function markOpen(value){const b=button();b.setAttribute('aria-pressed',String(value));b.textContent=value?'Close floating mole':'Float mole ↗';}
 function cleanup(w){if(pip!==w)return;if(interval!==null)w.clearInterval(interval);if(animation!==null)w.cancelAnimationFrame(animation);interval=null;animation=null;pip=null;confirmSession=null;lastSession=null;finished=false;markOpen(false);}
 function close(){if(!pip)return;const w=pip;cleanup(w);w.close();}
 function sync(){
  if(!pip||pip.closed)return;const s=bridge.snapshot(),d=pip.document,t=s.session;
  if(lastSession&&!t)finished=true;if(t)finished=false;lastSession=t?.id||null;
  if(confirmSession!==t?.id){confirmSession=null;d.getElementById('confirmation').hidden=true;}
  const running=t?.status==='running',rest=t?.mode==='rest',seconds=Math.max(0,Math.ceil(s.remaining));
  d.getElementById('name').textContent=s.profile.name+' · Eumo';
  d.getElementById('mode').textContent=t?(t.demo?'Demo':rest?'Break':t.mode==='work'?'Work':'Study')+' · '+(running?'Running':'Paused'):finished?'Session saved':'Ready';
  d.getElementById('time').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  d.getElementById('depth').textContent=Math.floor(PixelArt.digMetrics(s).worldDepth)+' m dug';
  const line=finished?'Saved! I’m putting my shovel down. Let’s rest together.':!t?'I’m here. We can start whenever you’re ready.':!running?'I’ve put my shovel down. We can pause together.':rest?'Time for a break. I’m resting with you.':'You focus; I’ll dig alongside you. One small step at a time.';
  d.getElementById('line').textContent=!t&&s.petAt&&Date.now()-s.petAt<1400?(s.petSpinAt?'Wheee! One happy spin!':'yeeeeee'):line;
  d.getElementById('toggle').textContent=t?(running?'Pause':'Resume'):'Start';
  d.getElementById('end').hidden=!t;d.getElementById('pet').disabled=!!t;
  d.getElementById('pet').setAttribute('aria-label','Pet '+s.profile.name);
  // Store only an ephemeral drawing snapshot, never another session or reward ledger.
  draw(s,Math.floor(Date.now()/150));
 }
 function draw(s,frame){if(!pip||pip.closed)return;PixelArt.renderFloating(pip.document.getElementById('mole').getContext('2d'),s,frame);}
 function animate(now){if(!pip||pip.closed)return;const w=pip;if(now-lastFrame>=120){lastFrame=now;draw(bridge.visual(),Math.floor(Date.now()/150));}animation=w.requestAnimationFrame(animate);}
 async function open(){
  if(opening)return;if(pip&&!pip.closed){close();return;}
  if(!supported()){document.getElementById('floatingHelpDialog').showModal();return;}
  opening=true;button().disabled=true;
  try{
   const w=await window.documentPictureInPicture.requestWindow({width:320,height:310});pip=w;
   w.addEventListener('pagehide',()=>cleanup(w),{once:true});
   const d=w.document;d.documentElement.lang='en';d.title='Eumo · Floating mole';
   const style=d.createElement('style');style.textContent=css;d.head.append(style);
   d.body.innerHTML=`<header><span id="name"></span><button id="return" title="Return to the Eumo tab">Back to Eumo ↗</button></header><main><button id="pet" aria-label="Pet your mole"><canvas id="mole" width="112" height="112" aria-hidden="true"></canvas></button><div><div id="mode"></div><div id="time" role="timer"></div><div id="depth"></div></div></main><p id="line" role="status"></p><section id="confirmation" aria-label="End session confirmation" hidden><p>End this session and save your progress?</p><div><button id="keep">Keep going</button><button id="save">End &amp; save</button></div></section><footer><button id="toggle">Start</button><button id="end">End session</button></footer><p id="hint">Drag the window’s title bar to move me. Keep the Eumo tab open.</p>`;
   d.getElementById('toggle').addEventListener('click',()=>{confirmSession=null;d.getElementById('confirmation').hidden=true;bridge.toggle();sync();});
   d.getElementById('end').addEventListener('click',()=>{const s=bridge.snapshot();if(!s.session){sync();return;}confirmSession=s.session.id;d.getElementById('confirmation').hidden=false;d.getElementById('keep').focus();});
   d.getElementById('keep').addEventListener('click',()=>{confirmSession=null;d.getElementById('confirmation').hidden=true;d.getElementById('end').focus();});
   d.getElementById('save').addEventListener('click',()=>{const id=confirmSession;confirmSession=null;d.getElementById('confirmation').hidden=true;if(id)bridge.end(id);sync();});
   d.getElementById('return').addEventListener('click',()=>{window.focus();bridge.returnToFocus();close();});
   d.getElementById('pet').addEventListener('click',()=>{bridge.pet();sync();});
   d.addEventListener('keydown',e=>{if(e.key==='Escape'&&confirmSession){e.preventDefault();confirmSession=null;d.getElementById('confirmation').hidden=true;}});
   lastSession=null;finished=false;lastFrame=0;markOpen(true);sync();interval=w.setInterval(sync,250);animation=w.requestAnimationFrame(animate);
   bridge.notify('Your mole is floating. Drag its window to a corner; keep this tab open.');
  }catch(e){close();bridge.notify('Could not open the floating mole. Try again in a separate Chrome or Edge tab.');}
  finally{opening=false;button().disabled=false;}
 }
 function init(options){bridge=options;button().addEventListener('click',open);window.addEventListener('pagehide',close);}
 return {init,close,supported};
})();
