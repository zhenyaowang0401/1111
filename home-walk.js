/* Click/tap movement is local exploration; it never edits a host's home. */
'use strict';
window.HomeWalk=(()=>{
 let bridge,own=HomeNavigation.create(),guest=null,visiting=null,last=0,gesture=null,cancelledUntil=0;
 const element=id=>document.getElementById(id),isGuest=key=>key==='visit',agent=key=>isGuest(key)?guest:own;
 function active(key){return !!bridge&&(isGuest(key)?element('friendHomeDialog').open:!element('home').hidden&&!bridge.editing()&&!element('friendHomeDialog').open);}
 function snapshot(key='home'){const a=agent(key);return a?{x:a.x,y:a.y,moving:a.moving,motion:a.motion,facing:a.facing,climbDirection:a.climbDirection,phase:Math.floor(a.travelled/5)%4,target:a.target?{...a.target}:null}:null;}
 function visit(id){if(visiting!==id){visiting=id;guest=HomeNavigation.create(312,316);}}
 function leaveVisit(){guest=null;visiting=null;}
 function step(now){const elapsed=last?Math.min(.1,Math.max(0,(now-last)/1000)):0;last=now;for(const key of ['home','visit']){const a=agent(key);if(!a)continue;if(active(key))HomeNavigation.advance(a,elapsed);else HomeNavigation.stop(a);}}
 function click(e,key='home'){
  if(!active(key)||e.button!==0||e.detail===0)return false;
  if(performance.now()<cancelledUntil)return true;
  const cv=element(isGuest(key)?'friendHomeCanvas':'homeCanvas'),r=cv.getBoundingClientRect(),p={x:(e.clientX-r.left)*640/r.width,y:(e.clientY-r.top)*360/r.height},a=agent(key);if(!a)return false;
  if(!isGuest(key)&&!a.moving&&!bridge.read().session&&PixelArt.hitTest('homeCanvas',p.x,p.y))return false;
  const target=HomeScenery.destination(p.x,p.y);if(!target)return true;
  if(HomeNavigation.go(a,target))bridge.activity();return true;
 }
 function init(options){bridge=options;
  for(const id of ['homeCanvas','friendHomeCanvas'])element(id).addEventListener('pointerdown',e=>{if(e.button===0&&e.isPrimary!==false)gesture={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};});
  document.addEventListener('pointermove',e=>{if(gesture&&gesture.id===e.pointerId&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture.moved=true;});
  document.addEventListener('pointerup',e=>{if(gesture?.id===e.pointerId){if(gesture.moved)cancelledUntil=performance.now()+400;gesture=null;}});
  document.addEventListener('pointercancel',()=>{gesture=null;cancelledUntil=performance.now()+400;});
  element('friendHomeCanvas').addEventListener('click',e=>click(e,'visit'));
 }
 return {init,step,snapshot,visit,leaveVisit,click,stop:()=>HomeNavigation.stop(own)};
})();
