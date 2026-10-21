/* Stable world-space strata. Ecology is scenery, never another reward event. */
'use strict';
window.Terrain=(()=>{
 const layers=[
  // Normal Study/Work digs one metre per 30 seconds: 240m = two hours.
  {from:0,name:'Root soil',id:'roots',soil:['#947565','#a38270','#876b60'],stone:['#b99b7c','#7e675e'],moss:'#9bac76'},
  {from:240,name:'Stone beds',id:'stone',soil:['#9690aa','#a69bb6','#88829c'],stone:['#c7b9d1','#77718d'],moss:'#a1b29e'},
  {from:300,name:'Sand beds',id:'sand',soil:['#d5b590','#e3c8a4','#c7a783'],stone:['#f2dfbb','#b79b78'],moss:'#b0b38a'},
  {from:360,name:'Slate layer',id:'slate',soil:['#6e7f9d','#7c8da7','#62738f'],stone:['#a1b7c6','#53667f'],moss:'#8db8ac'},
  {from:480,name:'Red granite',id:'granite',soil:['#a47c8a','#b68d98','#926f81'],stone:['#dbc1b4','#806472'],moss:'#bba496'},
  {from:600,name:'Crystal seams',id:'crystal',soil:['#77648f','#86749f','#695a82'],stone:['#cfbbdf','#9ed6d6'],moss:'#a4c5bd'},
  {from:720,name:'Deep basalt',id:'basalt',soil:['#484459','#555168','#3d3d52'],stone:['#817e96','#d6a78c'],moss:'#99b5b1'}
 ];
 const rnd=(a,b)=>{const z=Math.sin(a*127.1+b*311.7)*43758.5453;return z-Math.floor(z);};
 function layerAt(depth){let layer=layers[0];for(const next of layers)if(depth>=next.from)layer=next;return layer;}
 function paint(c,camera,height,frame,progressDepth=Infinity){
  const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const first=Math.max(0,Math.floor((camera-87)/16)),last=Math.ceil((camera+height-87)/16);
  for(let row=first;row<last;row++)for(let col=0;col<24;col++){
   const wy=87+row*16,y=wy-camera,x=col*16,depth=(wy-87)/6,r=rnd(col,row),revealed=Math.min(depth,progressDepth),current=layerAt(revealed),index=layers.indexOf(current);
   // The viewport shows ground below the mole. Never preview locked strata
   // ahead of actual progress, especially in the first two hours.
   const layer=index>0&&revealed<current.from+2&&rnd(col+41,row)<.3?layers[index-1]:current;
   const soil=layer.id==='roots'&&depth>=120?['#8d6d70','#9a7a78','#806268']:layer.soil;
   const patch=rnd(Math.floor(col/3),Math.floor(row/3));box(x,y,16,16,soil[Math.floor(patch*3)]);
   if(r>.55){const offset=Math.floor(rnd(col+3,row+7)*4)*2;box(x+offset,y+2,12,4,soil[(Math.floor(patch*3)+1)%3]);box(x+offset+2,y+6,8,2,soil[(Math.floor(patch*3)+1)%3]);}
   // Material-specific geometry: loose grains, chunky stone, angled slate,
   // speckled granite, crystal clusters, then dark basalt columns.
   if(layer.id==='sand'){
    const sy=y+5+Math.floor(r*3);box(x,sy,8,1,layer.stone[1]);box(x+8,sy+1,8,1,layer.stone[1]);
    for(let k=0;k<4;k++)box(x+Math.floor(rnd(col+k,row+13)*14),y+Math.floor(rnd(col+k+7,row)*14),1+(k%2),1,layer.stone[k%2]);
   }else if(layer.id==='stone'){
    if(r<.28){const sx=x+2,sy=y+4;box(sx+2,sy,7,2,layer.soil[1]);box(sx,sy+2,11,4,layer.soil[1]);box(sx+2,sy+6,8,2,layer.soil[1]);box(sx+3,sy+1,4,1,layer.stone[0]);if(r<.08)box(sx+6,sy+4,2,1,layer.stone[1]);}
   }else if(layer.id==='slate'){
    if(r<.4){box(x,y+4,11,1,layer.stone[1]);box(x+5,y+6,9,1,layer.stone[0]);box(x+4,y+10,10,1,layer.stone[1]);}
   }else if(layer.id==='granite'){
    for(let k=0;k<2;k++)box(x+Math.floor(rnd(col+k,row+19)*14),y+Math.floor(rnd(col+k+31,row)*14),2,2,layer.stone[k%2]);
   }else if(layer.id==='basalt'){
    if(r<.5){box(x+4,y,1,12,layer.stone[0]);box(x+5,y+12,7,1,layer.stone[0]);box(x+11,y+13,1,3,layer.stone[0]);}if(r>.94)box(x+8,y+5,3,2,layer.stone[1]);
   }else if(layer.id==='roots'&&r<.25){box(x+3,y+5,3,2,soil[1]);box(x+9,y+11,2,1,soil[2]);}
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
