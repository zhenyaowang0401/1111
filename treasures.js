/* Original gold pixel collectibles. One stable 3% bonus roll per formal discovery. */
'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RareTreasures=factory();})(typeof window==='undefined'?globalThis:window,()=>{
 const C={dark:'#5e4129',shade:'#a76c30',gold:'#e9b84e',light:'#ffe6a1',cream:'#fff4ce',ink:'#272740',mint:'#94baa6',pink:'#de8aaa',blue:'#8bc7d9'};
 const r=(x,y,w,h,c='gold')=>[x,y,w,h,C[c]||c];
 const items=[
  {id:'sanxingdui',name:'Sanxingdui mask',nameZh:'三星堆黄金面具',description:'A wide-eyed visitor from an ancient world.',rects:[r(5,5,22,21,'dark'),r(2,10,28,9,'shade'),r(6,6,20,18),r(3,11,26,6),r(6,3,4,6,'light'),r(22,3,4,6,'light'),r(7,10,7,5,'dark'),r(18,10,7,5,'dark'),r(5,11,7,3,'cream'),r(20,11,7,3,'cream'),r(14,12,4,8,'light'),r(9,21,14,2,'dark'),r(10,24,12,3,'shade')]},
  {id:'bronze-ding',name:'Museum bronze ding',nameZh:'博物青铜鼎',description:'Three little legs, a very long story.',rects:[r(3,3,6,12,'dark'),r(23,3,6,12,'dark'),r(4,4,4,8),r(24,4,4,8),r(5,11,22,13,'dark'),r(6,12,20,10),r(8,14,16,5,'mint'),r(11,14,2,5,'shade'),r(19,14,2,5,'shade'),r(7,23,4,7,'shade'),r(21,23,4,7,'shade'),r(14,23,4,5,'dark'),r(7,11,18,2,'light')]},
  {id:'mole-statue',name:'Golden mole statue',nameZh:'金色鼹鼠雕像',description:'A tiny monument to showing up.',rects:[r(10,3,12,3,'dark'),r(7,6,18,13,'dark'),r(9,5,14,16),r(6,13,20,7),r(11,10,2,2,'dark'),r(19,10,2,2,'dark'),r(13,14,7,6,'light'),r(15,14,3,2,'cream'),r(11,21,4,4,'shade'),r(20,21,4,4,'shade'),r(5,25,24,5,'dark'),r(6,25,22,2,'light'),r(8,28,18,2,'shade')]},
  {id:'iphone18',name:'iPhone 18',nameZh:'苹果18',description:'Excellent reception, even in a tiny burrow.',rects:[r(8,1,17,30,'dark'),r(9,2,15,28),r(11,5,11,21,'ink'),r(13,3,7,2,'shade'),r(12,8,3,3,'blue'),r(18,8,3,3,'pink'),r(12,14,2,8,'light'),r(16,14,5,2,'light'),r(16,17,5,2,'light'),r(16,20,5,2,'light'),r(16,15,2,7,'light'),r(20,15,2,7,'light'),r(14,28,6,1,'cream')]},
  {id:'rog-laptop',name:'ROG laptop',nameZh:'ROG电竞电脑',description:'For very serious pebble research.',rects:[r(3,4,26,18,'dark'),r(4,5,24,15),r(6,7,20,11,'ink'),r(9,10,14,2,'pink'),r(8,12,10,2,'pink'),r(14,14,7,2,'blue'),r(1,22,30,6,'dark'),r(2,22,28,4),r(5,23,22,1,'light'),r(12,25,8,1,'shade')]},
  {id:'chanel-bag',name:'Chanel bag',nameZh:'香奈儿包',description:'A gold little outfit for the treasure shelf.',rects:[r(10,2,13,3,'shade'),r(8,5,3,8),r(22,5,3,8),r(4,11,25,18,'dark'),r(5,12,23,15),r(6,14,21,2,'light'),r(7,18,19,1,'shade'),r(7,23,19,1,'shade'),r(10,16,1,10,'shade'),r(16,16,1,10,'shade'),r(22,16,1,10,'shade'),r(12,17,5,2,'cream'),r(12,18,2,5,'cream'),r(12,22,5,2,'cream'),r(18,17,4,2,'cream'),r(20,18,2,5,'cream'),r(18,22,4,2,'cream')]},
  {id:'gold-console',name:'Golden game console',nameZh:'黄金掌机',description:'A pocket-sized reward for a good break.',rects:[r(1,8,30,17,'dark'),r(2,9,28,15),r(8,10,16,13,'ink'),r(10,12,12,9,'blue'),r(12,16,7,3,'mint'),r(3,14,4,2,'dark'),r(4,13,2,4,'dark'),r(25,13,2,2,'pink'),r(27,17,2,2,'pink'),r(9,24,14,2,'shade')]},
  {id:'moon-globe',name:'Celestial globe',nameZh:'星月地球仪',description:'The whole night sky, neatly on a stand.',rects:[r(11,1,11,2,'light'),r(7,3,19,3),r(5,6,23,14,'shade'),r(7,6,19,14,'blue'),r(10,8,7,4,'light'),r(16,13,8,4,'mint'),r(14,5,2,16,'cream'),r(7,12,20,2,'cream'),r(7,20,19,3),r(15,23,4,5,'shade'),r(8,28,19,3,'dark'),r(9,28,17,2,'light')]},
  {id:'royal-crown',name:'Royal golden crown',nameZh:'黄金王冠',description:'Queen of the soil blocks, just for today.',rects:[r(2,7,4,16,'dark'),r(26,7,4,16,'dark'),r(14,3,4,20,'dark'),r(3,8,4,13),r(7,13,5,10),r(12,9,8,14),r(15,4,2,19,'light'),r(20,13,5,10),r(25,8,4,15),r(5,22,23,7,'shade'),r(5,22,23,3,'light'),r(9,24,3,3,'pink'),r(17,24,3,3,'blue'),r(24,24,3,3,'pink')]},
  {id:'gold-camera',name:'Vintage gold camera',nameZh:'复古金色相机',description:'For the smallest adventures worth keeping.',rects:[r(9,5,13,4,'dark'),r(10,6,11,3,'light'),r(2,9,28,19,'dark'),r(3,10,26,16),r(4,12,4,11,'shade'),r(10,12,15,13,'ink'),r(13,14,9,9,'blue'),r(15,16,5,5,'dark'),r(14,15,3,2,'cream'),r(24,11,4,3,'cream'),r(5,7,4,3,'shade'),r(5,26,23,2,'light')]}
 ];
 function hash(s){let n=2166136261;for(const ch of String(s))n=Math.imul(n^ch.charCodeAt(0),16777619);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);return (n^(n>>>16))>>>0;}
 function roll(seed,ordinal){return hash(seed+':gold-roll:'+ordinal)/4294967296;}
 function forEvent(event,session){
  if(!session||session.demo||!['study','work'].includes(session.mode)||!session.rareSeed||event.kind!=='find')return null;
  const ordinal=Math.round(((session.baseEligible||0)+event.at)/600);if(ordinal<1||roll(session.rareSeed,ordinal)>=.03)return null;
  return {ordinal,id:items[hash(session.rareSeed+':gold-item:'+ordinal)%items.length].id,eventId:'gold:'+ordinal};
 }
 const awards=(session,events)=>events.map(e=>forEvent(e,session)).filter(Boolean);
 const get=id=>items.find(i=>i.id===id);
 function settle(state,session,events){
  const found=awards(session,events).filter(a=>a.ordinal>(state.rareClaimed||0));
  state.rareInventory=state.rareInventory||{};for(const a of found)state.rareInventory[a.id]=(state.rareInventory[a.id]||0)+1;
  if(session&&!session.demo&&['study','work'].includes(session.mode))state.rareClaimed=Math.max(state.rareClaimed||0,Math.floor(((session.baseEligible||0)+(session.elapsed||0)+1e-7)/600));
  return found;
 }
 function sell(state,id){if(!get(id)||(state.rareInventory?.[id]||0)<=(state.displayedTreasure===id?1:0))return false;state.rareInventory[id]--;state.balance+=99;return true;}

 function draw(c,id,x,y,scale=1){const item=get(id);if(!item)return;for(const [a,b,w,h,color] of item.rects){c.fillStyle=color;c.fillRect(Math.round(x+a*scale),Math.round(y+b*scale),Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));}}
 function iconSVG(id){const item=get(id);return item?'<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">'+item.rects.map(([x,y,w,h,fill])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`).join('')+'</svg>':'';}
 return {items,get,draw,iconSVG,roll,forEvent,awards,settle,sell,price:99,chance:.03};
});
