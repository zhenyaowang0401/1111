/* Stable world-space strata. Ecology is scenery, never another reward event. */
'use strict';
window.Terrain=(()=>{
 const layers=[
  {from:0,name:'Root soil',id:'roots',soil:['#94715d','#8b6754','#9c7860'],stone:['#bea18a','#76675e'],moss:'#7e986b'},
  {from:12,name:'Moss beds',id:'moss',soil:['#707b66','#77826c','#66735e'],stone:['#a4ac96','#52675e'],moss:'#9dab79'},
  {from:35,name:'Pebble beds',id:'pebbles',soil:['#817c85','#777780','#8b838b'],stone:['#b7b8bb','#596575'],moss:'#73918b'},
  {from:75,name:'Slate layer',id:'slate',soil:['#5c7483','#657d8c','#516978'],stone:['#91b1ba','#3e5669'],moss:'#75b7ae'},
  {from:130,name:'Crystal seams',id:'crystal',soil:['#6c6689','#756e94','#605c7d'],stone:['#b9a6d5','#8fbed0'],moss:'#92c5c0'},
  {from:220,name:'Deep basalt',id:'basalt',soil:['#444d60','#4d566a','#3b4456'],stone:['#a8b9c5','#ceaa7e'],moss:'#85afa9'}
 ];
 const rnd=(a,b)=>{const z=Math.sin(a*127.1+b*311.7)*43758.5453;return z-Math.floor(z);};
 function layerAt(depth){let layer=layers[0];for(const next of layers)if(depth>=next.from)layer=next;return layer;}
 function paint(c,camera,height,frame){
  const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const first=Math.max(0,Math.floor((camera-87)/16)),last=Math.ceil((camera+height-87)/16);
  for(let row=first;row<last;row++)for(let col=0;col<24;col++){
   const wy=87+row*16,y=wy-camera,x=col*16,depth=(wy-87)/6,r=rnd(col,row),current=layerAt(depth),next=layers[layers.indexOf(current)+1];
   const layer=next&&depth>next.from-4&&rnd(col+41,row)<(depth-next.from+4)/4?next:current;
   const patch=rnd(Math.floor(col/3),Math.floor(row/3));box(x,y,16,16,layer.soil[Math.floor(patch*3)]);
   if(r>.55){const offset=Math.floor(rnd(col+3,row+7)*4)*2;box(x+offset,y+2,12,4,layer.soil[(Math.floor(patch*3)+1)%3]);box(x+offset+2,y+6,8,2,layer.soil[(Math.floor(patch*3)+1)%3]);}
   // Small clusters of pebbles and occasional larger, softly stepped stones.
   if(r<.17){const sx=x+3,sy=y+5,w=r<.035?10:6;box(sx+2,sy,w-2,2,layer.stone[0]);box(sx,sy+2,w,4,layer.stone[1]);box(sx+2,sy+2,w-4,2,layer.stone[0]);if(r<.065)box(x+12,y+12,3,2,layer.stone[0]);}
   if(depth<65&&r>.965){for(let k=0;k<4;k++){box(x+3+k*2,y+k*3,2,4,layer.moss);if(k%2)box(x+k*2,y+k*3,4,2,layer.moss);}}
   if(depth>130&&r>.96){box(x+3,y+4,2,9,layer.stone[0]);box(x+5,y+9,6,2,layer.stone[0]);box(x+9,y+9,2,6,layer.stone[1]);}
   // Worms and beetles are sparse and move only a pixel at a time.
   if(depth<38&&r>.91&&r<.918){const n=Math.floor(frame/20)%2;for(let k=0;k<5;k++)box(x+2+k*2,y+8+(k%2?1:-1)+n,3,2,'#c58b8c');box(x+11,y+7+n,2,2,'#e6b0a3');}
   if(depth<80&&r>.935&&r<.94){const n=Math.floor(frame/30)%2;box(x+5,y+7+n,6,4,'#35463f');box(x+6,y+7+n,3,2,'#b6a178');box(x+3,y+6+n,2,1,'#35463f');box(x+11,y+11+n,2,1,'#35463f');}
  }
  // Tree roots descend from the surface, with irregular side branches.
  for(let root=0;root<7;root++){
   const base=30+root*54,max=55+Math.floor(rnd(root,12)*145);
   for(let wy=87;wy<87+max;wy+=5){const d=wy-87,x=base+Math.round(Math.sin(d*.035+root)*5)*2,y=wy-camera;if(y<-8||y>height)continue;box(x,y,root%2?3:4,6,'#66503f');box(x,y,1,5,'#b18c66');if(d%25===0){const dir=root%2?1:-1;box(x+dir*3,y+3,7,2,'#66503f');box(x+dir*8,y+5,2,6,'#66503f');}}
  }
 }
 return {layers,layerAt,paint};
})();
