/* A browser-owned, always-on-top companion. The original tab owns all game state. */
'use strict';
window.FloatingMole=(()=>{
 let bridge,pip=null,opening=false,interval=null,animation=null,lastFrame=0,confirmSession=null,lastSession=null,finished=false;
 const button=()=>document.getElementById('floatMoleButton');
 const supported=()=>window.isSecureContext&&typeof window.documentPictureInPicture?.requestWindow==='function';
 const css=`
 :root{color-scheme:dark;font-family:'Segoe UI',Arial,sans-serif;color:#f3eafa;background:#211e38}
 *{box-sizing:border-box}body{margin:0;padding:8px;min-width:210px}button{font:inherit;cursor:pointer;color:inherit;border:1px solid #806c94;background:#4c3e60;padding:7px 12px;min-height:34px;border-radius:18px}
 button:hover:not(:disabled){filter:brightness(1.12)}button:focus-visible{outline:2px solid #91dfdf;outline-offset:3px}button:disabled{opacity:.45;cursor:default}[hidden]{display:none!important}
 .bubble{position:relative;min-height:calc(100dvh - 16px);padding:12px 14px;border:1px solid #8e749e;border-radius:32px;background:radial-gradient(ellipse at 50% 28%,#514060 0%,#372d4c 57%,#2d263f 100%);box-shadow:inset 0 1px 0 #b59ac344,0 3px 7px #100c2433;display:flex;flex-direction:column;align-items:center}
 header{display:flex;gap:8px;align-items:center;width:100%;font-size:12px}#name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#efc5e3;font-weight:600;padding-left:4px}#return{display:grid;place-items:center;width:28px;min-height:28px;padding:0;border-radius:50%;background:#6e547f55;border-color:#a98db366;font-size:17px}
 main{width:100%;display:flex;flex-direction:column;align-items:center;gap:0}.pet-orbit{position:relative;display:grid;place-items:center;width:208px;height:208px;margin-top:2px;isolation:isolate}.pet-orbit:before{content:'';position:absolute;inset:15px 4px 5px;border-radius:50%;background:radial-gradient(ellipse at 42% 30%,#bea0c42b,#ad8fc214 64%,transparent 72%);border:1px solid #bca0ce22;z-index:-1}.pet-orbit:after{content:'✦';position:absolute;right:9px;top:34px;font-size:17px;color:#e8cda1;pointer-events:none}
 #pet{padding:0;border:0;background:none;width:208px;height:208px;border-radius:50%}#pet:disabled{opacity:1}canvas{display:block;image-rendering:pixelated;width:100%;height:100%}
 .time-pill{display:flex;align-items:center;gap:10px;border:1px solid #b79cc74d;border-radius:24px;background:#241f37e0;padding:5px 16px;margin-top:-8px;z-index:1;box-shadow:0 3px 10px #1a132c33}#time{font-size:29px;line-height:1.1;font-weight:650;letter-spacing:1px;font-variant-numeric:tabular-nums;color:#ffedb4}.time-detail{display:flex;flex-direction:column;gap:2px}#mode{font-size:10px;color:#decee9}#depth{font-size:10px;color:#a7dace}
 #line{position:relative;text-align:center;font-size:12px;line-height:1.4;max-width:240px;min-height:32px;margin:12px 0 10px;padding:7px 12px;border:1px solid #b89bc54d;border-radius:17px;background:#67507866;color:#f2e2f0}#line:before{content:'';position:absolute;top:-5px;left:calc(50% - 4px);width:8px;height:8px;background:#594464;border-left:1px solid #b89bc54d;border-top:1px solid #b89bc54d;transform:rotate(45deg)}
 footer{display:flex;justify-content:center;gap:8px;width:100%;margin-top:auto}footer button{flex:1;font-size:12px;max-width:148px}#toggle{background:#eab6da;color:#33243e;border-color:#f8d7eb;font-weight:600}#end{background:#51415f;border-color:#a98db366}
 #hint{font-size:9px;line-height:1.4;color:#b9aac9;margin:9px 0 0;text-align:center}#confirmation{width:100%;border:1px solid #af90b7;border-radius:18px;padding:12px;margin:0 0 10px;background:#3b304d}#confirmation p{margin:0 0 8px;font-size:12px;line-height:1.4}#confirmation div{display:flex;gap:6px}#confirmation button{flex:1;font-size:12px}
 @media(max-height:370px){.bubble{padding:8px 12px;border-radius:26px}.pet-orbit,#pet{width:156px;height:156px}.pet-orbit:after{top:25px;font-size:13px}#line{margin:9px 0 7px;padding:5px 9px;font-size:11px;min-height:26px}#time{font-size:26px}#hint{margin-top:6px;font-size:9px}.time-pill{padding:4px 12px}header{font-size:11px}}
 @media(max-width:250px){body{padding:5px}.bubble{padding-left:9px;padding-right:9px}.pet-orbit,#pet{width:170px;height:170px}.time-pill{padding:5px 10px;gap:8px}#time{font-size:25px}#line{font-size:11px}.time-detail{max-width:80px}}
 @media(max-width:250px) and (max-height:370px){.pet-orbit,#pet{width:138px;height:138px}}
 @media(max-height:330px){.pet-orbit,#pet{width:132px;height:132px}#hint{display:none}}
 #return svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7}
 `;
 function markOpen(value){const b=button();b.setAttribute('aria-pressed',String(value));b.textContent=value?'Close floating mole':'Float mole ↗';}
 function cleanup(w){if(pip!==w)return;if(interval!==null)w.clearInterval(interval);if(animation!==null)w.cancelAnimationFrame(animation);interval=null;animation=null;pip=null;confirmSession=null;lastSession=null;finished=false;markOpen(false);}
 function close(){if(!pip)return;const w=pip;cleanup(w);w.close();}
 function sync(){
  if(!pip||pip.closed)return;const s=bridge.snapshot(),d=pip.document,t=s.session;
  if(lastSession&&!t)finished=true;if(t)finished=false;lastSession=t?.id||null;
  if(confirmSession!==t?.id){confirmSession=null;d.getElementById('confirmation').hidden=true;}
  const running=t?.status==='running',rest=t?.mode==='rest',seconds=Math.max(0,Math.ceil(s.remaining));
  d.getElementById('name').textContent=s.profile.name;
  d.getElementById('mode').textContent=t?(t.demo?'Demo':rest?'Break':t.mode==='work'?'Work':'Study')+' · '+(running?'Running':'Paused'):finished?'Session saved':'Ready';
  d.getElementById('time').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  d.getElementById('depth').textContent=Math.floor(PixelArt.digMetrics(s).worldDepth)+' m dug';
  const line=finished?'All saved. Let’s rest together.':!t?'Ready whenever you are.':!running?'A little pause together.':rest?'I’m resting with you.':'You focus. I’ll dig alongside you.';
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
   const w=await window.documentPictureInPicture.requestWindow({width:300,height:440});pip=w;
   w.addEventListener('pagehide',()=>cleanup(w),{once:true});
   const d=w.document;d.documentElement.lang='en';d.title='Eumo · Floating mole';
   const style=d.createElement('style');style.textContent=css;d.head.append(style);
   d.body.innerHTML=`<section class="bubble" aria-label="Your floating companion"><header><span id="name"></span><button id="return" title="Back to Eumo" aria-label="Back to Eumo"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2h5v5M14 2 7 9M6 3H2v11h11v-4"/></svg></button></header><main><div class="pet-orbit"><button id="pet" aria-label="Pet your mole"><canvas id="mole" width="112" height="112" aria-hidden="true"></canvas></button></div><div class="time-pill"><div id="time" role="timer"></div><div class="time-detail"><span id="mode"></span><span id="depth"></span></div></div></main><p id="line" role="status"></p><section id="confirmation" aria-label="End session confirmation" hidden><p>End this session and save your progress?</p><div><button id="keep">Keep going</button><button id="save">End &amp; save</button></div></section><footer><button id="toggle">Start</button><button id="end">End session</button></footer><p id="hint">Drag the title bar · Keep Eumo open</p></section>`;
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
