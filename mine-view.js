/* An ephemeral camera for already-dug terrain. It never changes game progress. */
'use strict';
window.MineView=(()=>{
 let read,override=false,camera=0,pointer=null,suppressUntil=0;
 const $=id=>document.getElementById(id);
 const depth=s=>Math.max(0,(s.depth||0)-(s.surfaceDepth||0))+(s.session&&Journey.eligible(s.session)?(s.session.elapsed||0)/Journey.rate(s.session):0);
 const maximum=s=>Math.max(0,76+depth(s)*6-174);
 const allowed=s=>s.session?.status!=='running';
 const cameraFor=s=>allowed(s)&&override?Math.max(0,Math.min(maximum(s),camera)):maximum(s);
 function reset(){override=false;camera=0;pointer=null;if(read)refresh();}
 function set(value){const s=read();if(!allowed(s))return;camera=Math.max(0,Math.min(maximum(s),value));override=true;refresh();PixelArt.refreshFocus();}
 function refresh(){
  if(!read)return;const s=read(),max=maximum(s),can=allowed(s)&&max>0;
  if(!allowed(s)){override=false;pointer=null;}
  const value=cameraFor(s),dug=depth(s),from=Math.min(dug,Math.max(0,Math.floor((value-87)/6))),to=Math.min(Math.floor(dug),Math.max(0,Math.ceil((value+224-87)/6)));
  $('petStage').classList.toggle('can-browse',can);$('mineBrowseControls').hidden=!can;$('mineBrowseHint').hidden=!can;$('mineViewLabel').hidden=!can;
  $('mineViewLabel').textContent=`VIEW ${from}–${to} m`;$('mineBrowseHint').textContent='Drag to explore · '+Math.floor(dug)+' m dug';
  $('mineToSurface').disabled=value<=0;$('mineToMole').disabled=value>=max-.5;
  if(can)$('sceneLabel').textContent=override&&value===0?'Surface':Terrain.layerAt(override?from:dug).name;
 }
 function init(get){
  read=get;const stage=$('petStage');stage.setAttribute('tabindex','0');stage.setAttribute('role','region');stage.setAttribute('aria-label','Mine. Pause or finish to explore with dragging, arrow keys, Home or End.');
  // Capture only an actual drag. Capturing on press retargets clicks away from the mole button.
  stage.addEventListener('pointerdown',e=>{if(!allowed(read())||maximum(read())<=0||e.button!==0||e.target.closest('.mine-browse-controls'))return;pointer={id:e.pointerId,y:e.clientY,camera:cameraFor(read()),moved:false};});
  stage.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;if(!allowed(read())){pointer=null;return;}const delta=e.clientY-pointer.y;if(!pointer.moved&&Math.abs(delta)<6)return;if(!pointer.moved){pointer.moved=true;stage.setPointerCapture(e.pointerId);}suppressUntil=Date.now()+400;const scale=224/stage.getBoundingClientRect().height;set(pointer.camera-delta*scale);});
  const release=e=>{if(pointer?.id===e.pointerId){if(pointer.moved)suppressUntil=Date.now()+400;pointer=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);}};
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
  stage.addEventListener('wheel',e=>{if(!allowed(read())||maximum(read())<=0)return;e.preventDefault();const amount=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?224:1);set(cameraFor(read())+amount*224/stage.getBoundingClientRect().height);},{passive:false});
  stage.addEventListener('keydown',e=>{if(!allowed(read())||maximum(read())<=0||!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();set(e.key==='Home'?0:e.key==='End'?maximum(read()):cameraFor(read())+(e.key==='ArrowUp'?-30:30));});
  $('mineToSurface').addEventListener('click',()=>set(0));$('mineToMole').addEventListener('click',()=>{override=false;refresh();PixelArt.refreshFocus();});refresh();
 }
 return {init,refresh,reset,cameraFor,maximum,depth,consumeClick:()=>Date.now()<suppressUntil};
})();
