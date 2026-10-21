/* Stable world-space strata. Ecology is scenery, never another reward event. */
'use strict';
window.Terrain=(()=>{
 const layers=[
  {from:0,name:'Root soil',id:'roots',soil:['#8d573b','#9c6543','#7d4c34'],stone:['#c39262','#684632'],moss:'#78a34d'},
  {from:10,name:'Stone beds',id:'stone',soil:['#909c91','#a5ad9d','#7e8c85'],stone:['#d0d1b7','#596c66'],moss:'#76955d'},
  {from:24,name:'Sand beds',id:'sand',soil:['#d5b16f','#e3c184','#c49c5d'],stone:['#f1d79d','#a6804b'],moss:'#9ba269'},
  {from:40,name:'Slate layer',id:'slate',soil:['#526c85','#607d96','#435d77'],stone:['#8faabd','#30475e'],moss:'#78a9a1'},
  {from:70,name:'Red granite',id:'granite',soil:['#9f6661','#b37d71','#8e5755'],stone:['#ddb79a','#573e47'],moss:'#b99887'},
  {from:110,name:'Crystal seams',id:'crystal',soil:['#685485','#796296','#574676'],stone:['#c7abd8','#8fd5dc'],moss:'#92c5c0'},
  {from:170,name:'Deep basalt',id:'basalt',soil:['#303b46','#3d4955','#26313c'],stone:['#72818b','#d59c61'],moss:'#85afa9'}
 ];
 const rnd=(a,b)=>{const z=Math.sin(a*127.1+b*311.7)*43758.5453;return z-Math.floor(z);};
 function layerAt(depth){let layer=layers[0];for(const next of layers)if(depth>=next.from)layer=next;return layer;}
 function paint(c,camera,height,frame){
  const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const first=Math.max(0,Math.floor((camera-87)/16)),last=Math.ceil((camera+height-87)/16);
  for(let row=first;row<last;row++)for(let col=0;col<24;col++){
   const wy=87+row*16,y=wy-camera,x=col*16,depth=(wy-87)/6,r=rnd(col,row),current=layerAt(depth),next=layers[layers.indexOf(current)+1];
   const layer=next&&depth>next.from-1.5&&rnd(col+41,row)<(depth-next.from+1.5)/1.5?next:current;
   const patch=rnd(Math.floor(col/3),Math.floor(row/3));box(x,y,16,16,layer.soil[Math.floor(patch*3)]);
   if(r>.55){const offset=Math.floor(rnd(col+3,row+7)*4)*2;box(x+offset,y+2,12,4,layer.soil[(Math.floor(patch*3)+1)%3]);box(x+offset+2,y+6,8,2,layer.soil[(Math.floor(patch*3)+1)%3]);}
   // Material-specific geometry: loose grains, chunky stone, angled slate,
   // speckled granite, crystal clusters, then dark basalt columns.
   if(layer.id==='sand'){
    const sy=y+5+Math.floor(r*3);box(x,sy,8,1,layer.stone[1]);box(x+8,sy+1,8,1,layer.stone[1]);
    for(let k=0;k<4;k++)box(x+Math.floor(rnd(col+k,row+13)*14),y+Math.floor(rnd(col+k+7,row)*14),1+(k%2),1,layer.stone[k%2]);
   }else if(layer.id==='stone'){
    if(r<.7){box(x+2,y+3,12,9,layer.stone[1]);box(x+3,y+2,10,8,layer.soil[1]);box(x+4,y+2,8,1,layer.stone[0]);box(x+12,y+4,1,5,layer.soil[0]);}
   }else if(layer.id==='slate'){
    if(r<.6){box(x,y+4,13,2,layer.stone[1]);box(x+5,y+6,11,1,layer.stone[0]);box(x+4,y+10,12,2,layer.stone[1]);box(x+2,y+8,3,2,layer.stone[1]);}
   }else if(layer.id==='granite'){
    for(let k=0;k<5;k++)box(x+Math.floor(rnd(col+k,row+19)*14),y+Math.floor(rnd(col+k+31,row)*14),2,2,layer.stone[k%2]);
   }else if(layer.id==='basalt'){
    if(r<.5){box(x+4,y,1,12,layer.stone[0]);box(x+5,y+12,7,1,layer.stone[0]);box(x+11,y+13,1,3,layer.stone[0]);}if(r>.94)box(x+8,y+5,3,2,layer.stone[1]);
   }else if(r<.22){const sx=x+3,sy=y+5,w=r<.06?10:6;box(sx+2,sy,w-2,2,layer.stone[0]);box(sx,sy+2,w,4,layer.stone[1]);box(sx+2,sy+2,w-4,2,layer.stone[0]);}
   if(layer.id==='crystal'&&r>.81){box(x+4,y+3,3,10,layer.stone[0]);box(x+7,y+7,4,6,layer.stone[1]);box(x+5,y+2,1,3,'#e8d8ed');box(x+10,y+5,2,6,layer.stone[0]);}
   if(layer.id==='roots'&&r>.8){box(x+2,y+3,3,8,layer.moss);box(x+5,y+7,4,2,'#a6bb66');}
   // Worms and beetles are sparse and move only a pixel at a time.
   if(depth<38&&r>.91&&r<.918){const n=Math.floor(frame/20)%2;for(let k=0;k<5;k++)box(x+2+k*2,y+8+(k%2?1:-1)+n,3,2,'#c58b8c');box(x+11,y+7+n,2,2,'#e6b0a3');}
   if(depth<80&&r>.935&&r<.94){const n=Math.floor(frame/30)%2;box(x+5,y+7+n,6,4,'#35463f');box(x+6,y+7+n,3,2,'#b6a178');box(x+3,y+6+n,2,1,'#35463f');box(x+11,y+11+n,2,1,'#35463f');}
  }
  // Green vines hang into the shallow soil, beside the shaft as well as
  // among the tree roots. They stop before the sandy and rocky depths.
  for(let vine=0;vine<10;vine++){
   const base=12+vine*40,max=35+Math.floor(rnd(vine,51)*62);
   for(let d=0;d<max;d+=4){const x=base+Math.round(Math.sin(d*.065+vine)*3)*2,y=87+d-camera;if(y<-8||y>height)continue;box(x,y,2,5,'#638345');if(d%12===0){const side=vine%2?1:-1;box(x+side*2,y+2,5,2,'#88a852');box(x+side*4,y,3,2,'#a4b965');}}
  }
  // Tree roots descend from the surface, with irregular side branches.
  for(let root=0;root<7;root++){
   const base=30+root*54,max=55+Math.floor(rnd(root,12)*145);
   for(let wy=87;wy<87+max;wy+=5){const d=wy-87,x=base+Math.round(Math.sin(d*.035+root)*5)*2,y=wy-camera;if(y<-8||y>height)continue;box(x,y,root%2?3:4,6,'#66503f');box(x,y,1,5,'#b18c66');if(d%25===0){const dir=root%2?1:-1;box(x+dir*3,y+3,7,2,'#66503f');box(x+dir*8,y+5,2,6,'#66503f');}}
  }
 }
 return {layers,layerAt,paint};
})();
