/* A shared floor-and-ladder graph: movement cannot cut through the earth. */
'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HomeNavigation=factory();})(typeof window==='undefined'?globalThis:window,()=>{
 const nodes={bed:[65,149],bedDoor:[210,149],bedPassage:[264,149],upper:[312,149],studyJunction:[312,177],studyDoor:[420,177],study:[566,177],living:[115,316],home:[247,316],lower:[312,316],passage:[370,306],galleryDoor:[452,310],gallery:[566,310],top:[312,104]};
 const edges=[['bed','bedDoor','walk'],['bedDoor','bedPassage','walk'],['bedPassage','upper','walk'],['studyJunction','studyDoor','walk'],['studyDoor','study','walk'],['living','home','walk'],['home','lower','walk'],['lower','passage','walk'],['passage','galleryDoor','walk'],['galleryDoor','gallery','walk'],['top','upper','climb'],['upper','studyJunction','climb'],['studyJunction','lower','climb']].map(([a,b,mode],id)=>({a,b,mode,id,length:Math.hypot(nodes[a][0]-nodes[b][0],nodes[a][1]-nodes[b][1])}));
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),point=id=>({x:nodes[id][0],y:nodes[id][1]});
 function project(p){let best=null;for(const edge of edges){const a=point(edge.a),b=point(edge.b),dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(edge.length**2))),q={x:a.x+dx*t,y:a.y+dy*t},d=distance(p,q);if(!best||d<best.distance)best={...q,edge,distance:d};}return best;}
 function between(from,to){const queue=[{id:from,path:[],cost:0}],seen=new Set();while(queue.length){queue.sort((a,b)=>a.cost-b.cost);const current=queue.shift();if(current.id===to)return current;if(seen.has(current.id))continue;seen.add(current.id);for(const e of edges){const id=e.a===current.id?e.b:e.b===current.id?e.a:null;if(id&&!seen.has(id))queue.push({id,cost:current.cost+e.length,path:[...current.path,{...point(id),mode:e.mode}]});}}return null;}
 function plan(from,to){
  if(![from.x,from.y,to.x,to.y].every(Number.isFinite))return [];
  const a=project(from),b=project(to),options=[];
  if(a.edge===b.edge)options.push({cost:distance(a,b),path:[{x:b.x,y:b.y,mode:a.edge.mode}]});
  for(const start of [a.edge.a,a.edge.b])for(const end of [b.edge.a,b.edge.b]){const via=between(start,end);options.push({cost:distance(a,point(start))+via.cost+distance(b,point(end)),path:[{...point(start),mode:a.edge.mode},...via.path,{x:b.x,y:b.y,mode:b.edge.mode}]});}
  const best=options.sort((a,b)=>a.cost-b.cost)[0];let prev=from;return best.path.filter(p=>{const keep=distance(prev,p)>.001;prev=p;return keep;});
 }
 function create(x=247,y=316){const p=project({x,y});return {x:p.x,y:p.y,path:[],target:null,moving:false,motion:'idle',facing:1,climbDirection:-1,travelled:0};}
 function go(actor,target){if(![target.x,target.y].every(Number.isFinite))return false;const path=plan(actor,target);if(!path.length){stop(actor);return true;}actor.path=path;actor.target={x:path.at(-1).x,y:path.at(-1).y};actor.moving=true;return true;}
 function stop(actor){actor.path=[];actor.target=null;actor.moving=false;actor.motion=Math.abs(actor.x-312)<.01&&actor.y<315?'climb':'idle';}
 function advance(actor,seconds){let time=Math.max(0,Math.min(10,Number(seconds)||0));while(time>0&&actor.path.length){const next=actor.path[0],d=distance(actor,next),speed=next.mode==='climb'?46:62,amount=Math.min(d,time*speed);actor.motion=next.mode;actor.moving=true;if(next.mode==='walk'&&Math.abs(next.x-actor.x)>.01)actor.facing=Math.sign(next.x-actor.x);if(next.mode==='climb')actor.climbDirection=Math.sign(next.y-actor.y);if(d>.001){actor.x+=(next.x-actor.x)*amount/d;actor.y+=(next.y-actor.y)*amount/d;actor.travelled+=amount;}time-=amount/speed;if(d<=amount+.001){actor.x=next.x;actor.y=next.y;actor.path.shift();}else break;}if(!actor.path.length)stop(actor);return actor;}
 return {nodes,edges,project,plan,create,go,stop,advance};
});
