'use strict';
window.HomeEditor=(()=>{
 let bridge,armed=null,drag=null,ghost=null,lastDrag=0;
 const canvas=()=>document.getElementById('homeCanvas');
 const text=(en,zh)=>EumoI18n.language==='zh'?zh:en;
 function point(e){const r=canvas().getBoundingClientRect();return {x:(e.clientX-r.left)*640/r.width,y:(e.clientY-r.top)*360/r.height};}
 function target(e,d){const p=point(e);return {x:p.x+(d.offset?.x||0),y:p.y+(d.offset?.y||0)};}
 function choose(id){armed=id;bridge.message(text('Drag into a room, or click a position in your home.','拖进房间，或点击家中的位置放置。'));}
 function hit(p){return Object.keys(HomeCatalog.slots).filter(k=>bridge.read().home.slots[k]).sort((a,b)=>a==='floor'?1:b==='floor'?-1:HomeCatalog.spot(bridge.read().home,b).y-HomeCatalog.spot(bridge.read().home,a).y).find(k=>{const h=bridge.read().home,id=h.slots[k],spot=HomeCatalog.spot(h,k),i=HomeCatalog.items.find(i=>i.id===id),scale=i?.scale||.85;return Math.abs(p.x-spot.x)<16*scale&&p.y<=spot.y+4&&p.y>=spot.y-(id==='rug'?18:(i?.foot||32)*scale);});}
 function place(id,p,source){if(!HomeScenery.canPlace(id,p.x,p.y)){bridge.message(text('Keep the whole item inside a room.','请把家具完整放在房间内部。'));return false;}const key=HomeCatalog.place(bridge.read(),id,p.x,p.y,source);if(!key){bridge.message(text('No spare copy or free space. Put an item away first.','没有可用的物品或位置，请先收起一件装饰。'));return false;}bridge.select(key);bridge.commit();armed=null;return true;}
 function cleanup(){ghost?.remove();ghost=null;drag=null;}
 function init(options){bridge=options;
  document.addEventListener('pointerdown',e=>{
   if(!bridge.editing()||e.button!==0||e.isPrimary===false)return;
   const button=e.target.closest('[data-home-drag]'),onCanvas=e.target===canvas();if(!button&&!onCanvas)return;
   const p=point(e),source=onCanvas?hit(p):null,id=button?.dataset.homeDrag||(source?bridge.read().home.slots[source]:armed);if(!id)return;
   if(source)bridge.select(source);
   const spot=source?HomeCatalog.spot(bridge.read().home,source):p;drag={pointerId:e.pointerId,id,source,offset:{x:spot.x-p.x,y:spot.y-p.y},startX:e.clientX,startY:e.clientY,moved:false,onCanvas};
   if(button)e.preventDefault();
  });
  document.addEventListener('pointermove',e=>{
   if(!drag||e.pointerId!==drag.pointerId)return;if(!bridge.editing()){cleanup();return;}if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)drag.moved=true;if(!drag.moved)return;e.preventDefault();
   if(!ghost){ghost=document.createElement('div');ghost.className='home-drag-ghost';ghost.innerHTML=PixelArt.homeIcon(drag.id);document.body.append(ghost);}
   const p=target(e,drag),item=HomeCatalog.items.find(i=>i.id===drag.id),scale=canvas().getBoundingClientRect().width/640*(item?.scale||.85),w=32*scale;
   ghost.style.cssText=`left:${e.clientX+(drag.offset.x||0)*canvas().getBoundingClientRect().width/640-w/2}px;top:${e.clientY+(drag.offset.y||0)*canvas().getBoundingClientRect().height/360-32*scale}px;width:${w}px;height:${w}px`;ghost.classList.toggle('invalid',!HomeScenery.canPlace(drag.id,p.x,p.y));
  },{passive:false});
  document.addEventListener('pointerup',e=>{
   if(!drag||e.pointerId!==drag.pointerId)return;const d=drag;cleanup();if(!bridge.editing())return;if(d.moved){lastDrag=Date.now();setTimeout(()=>lastDrag=0,0);place(d.id,target(e,d),d.source);}else if(d.onCanvas&&armed)place(armed,point(e));
  });
  document.addEventListener('pointercancel',cleanup);window.addEventListener('blur',cleanup);window.addEventListener('hashchange',()=>{cleanup();armed=null;});
  document.getElementById('homePetButton').addEventListener('keydown',e=>{if(!bridge.editing())return;const key=bridge.selected(),home=bridge.read().home;if(e.key==='Escape'){armed=null;cleanup();return;}if(e.key==='Delete'||e.key==='Backspace'){if(home.slots[key]){home.slots[key]=null;delete home.positions?.[key];bridge.commit();e.preventDefault();}return;}const delta={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]}[e.key];if(delta&&home.slots[key]){const p=HomeCatalog.spot(home,key);place(home.slots[key],{x:p.x+delta[0],y:p.y+delta[1]},key);e.preventDefault();}if(e.key==='Enter'&&armed){place(armed,{x:145,y:145});e.preventDefault();}});
 }
 return {init,choose,consumeClick:()=>Date.now()-lastDrag<300};
})();
