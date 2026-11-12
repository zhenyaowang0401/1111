/* Native pixel scenery: one joined cave silhouette, a limited palette and integer marks. */
'use strict';
window.HomeScenery=(()=>{
 const W=640,H=360,cache=new Map();
 const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const rand=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
 const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
 function oval(c,x,y,w,h,col){for(let yy=0;yy<h;yy++){const half=w/2*Math.sqrt(Math.max(0,1-Math.pow((yy+.5-h/2)/(h/2),2))),left=Math.round(w/2-half),right=Math.round(w/2+half);rect(c,x+left,y+yy,right-left,1,col);}}
 const rooms=[
  {x:30,y:54,w:202,floor:149,type:'sleep',path:'M35 98 C29 64 63 53 103 57 C137 60 153 45 191 61 C220 74 237 95 230 120 C235 144 213 163 176 166 C142 164 116 173 82 163 C46 165 22 139 35 98 Z'},
  {x:385,y:54,w:220,floor:177,type:'study',path:'M388 122 C379 91 399 66 438 65 C470 61 484 45 522 57 C548 69 579 67 593 95 C609 119 605 147 589 170 C568 197 531 194 501 195 C462 195 434 205 410 184 C391 170 382 147 388 122 Z'},
  {x:76,y:177,w:282,floor:316,type:'living',path:'M79 258 C66 226 93 196 134 191 C175 182 191 158 237 177 C271 191 279 196 309 205 C344 216 355 240 357 268 C369 303 336 333 294 335 C254 338 231 344 188 337 C153 332 120 343 96 324 C75 310 69 287 79 258 Z'},
  {x:425,y:238,w:180,floor:310,type:'gallery',path:'M427 278 C420 249 444 231 477 239 C505 245 527 225 557 239 C586 246 605 260 603 284 C608 310 583 326 555 326 C529 322 506 336 482 325 C447 328 425 311 427 278 Z'}
 ];
 // The curved passages overlap the rooms before their shared border is rasterized.
 const passages=[
  'M299 30 Q297 72 299 110 Q296 155 298 207 L299 219 L326 219 L325 174 Q329 133 325 97 L326 30 Z',
  'M213 108 C234 116 241 122 259 120 C278 119 286 113 310 117 L311 154 C291 149 282 159 264 155 C244 151 229 153 213 151 Z',
  'M315 139 C339 145 344 134 365 137 C380 141 385 136 386 124 C387 114 389 105 399 99 L410 179 C390 174 377 181 361 178 C343 174 335 184 315 179 Z',
  'M325 235 C347 242 347 269 370 273 C390 279 406 271 421 264 C433 250 445 246 459 250 L457 315 C435 310 410 319 394 314 C374 309 355 320 332 322 Z'
 ];
 let geometry;
 function distances(mask,inside){
  const d=new Uint16Array(W*H);for(let i=0;i<d.length;i++)d[i]=!!mask[i]===inside?999:0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(d[i])d[i]=Math.min(d[i],x?d[i-1]+1:999,y?d[i-W]+1:999);}
  for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;if(d[i])d[i]=Math.min(d[i],x<W-1?d[i+1]+1:999,y<H-1?d[i+W]+1:999);}
  return d;
 }
 function caveGeometry(){
  if(geometry)return geometry;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d',{willReadFrequently:true}),mask=new Uint8Array(W*H),region=new Uint8Array(W*H);
  [...rooms.map(r=>r.path),...passages].forEach((path,n)=>{
   c.clearRect(0,0,W,H);c.fillStyle='#fff';c.fill(new Path2D(path));const a=c.getImageData(0,0,W,H).data;
   for(let i=0;i<mask.length;i++)if(a[i*4+3]>=128){mask[i]=1;if(n<rooms.length)region[i]=n+1;}
  });
  const bottom=new Uint16Array(W*H);for(let y=H-1;y>=0;y--)for(let x=0;x<W;x++){const i=y*W+x;if(mask[i])bottom[i]=1+(y<H-1?bottom[i+W]:0);}
  geometry={mask,region,bottom,inner:distances(mask,true),outer:distances(mask,false)};return geometry;
 }
 function palette(theme,t){
  const night=t.period==='night',cool=theme.id==='rain'||theme.id==='moon',moss=theme.id==='moss';
  return {ink:night?'#354a52':'#3d4134',wall:night?'#afbcb8':cool?'#d0d9cd':moss?'#d9d9b2':'#e9dfb9',rim:night?'#899d9e':moss?'#a3ac7d':'#c0b38c',soil:night?['#58616a','#4b565e','#414c55']:['#857557','#76664d','#665943'],fleck:night?['#6e7b80','#404f59']:['#998562','#625740'],stone:night?'#849395':'#ac9d7b',wood:'#9a7d58',light:'#d2b486',night};
 }
 function landscape(c,p,t){
  // Broad quiet earth strata and small ordered clusters, matching the focus scene.
  for(let x=0;x<W;x+=4){const wave=Math.round(Math.sin(x*.018)*5+Math.sin(x*.047)*2);rect(c,x,0,4,145+wave,p.soil[0]);rect(c,x,145+wave,4,107,p.soil[1]);rect(c,x,252+wave,4,H,p.soil[2]);}
  for(let k=0;k<330;k++){const x=Math.floor(rand(k,6)*W/2)*2,y=42+Math.floor(rand(k,8)*(H-42)/2)*2,w=2+k%5;rect(c,x,y,w,1+k%2,p.fleck[k%2]);if(k%3===0)rect(c,x+2,y+2,w-1,1,p.fleck[k%2]);}
  for(let k=0;k<45;k++){const x=Math.floor(rand(k,11)*W),y=48+Math.floor(rand(k,17)*308);oval(c,x,y,7+k%5,4+k%3,p.fleck[1]);oval(c,x,y-1,7+k%5,4+k%2,p.stone);rect(c,x+2,y,3,1,mix(p.stone,t.cloud,.25));}
  rect(c,0,0,W,35,t.sky);rect(c,0,19,W,15,mix(t.sky,t.skyLow,.3));
  // Softly bulging silhouettes are stepped on the same grid as the mole.
  for(let x=0;x<W;x+=3){const ridge=22+Math.round(Math.sin(x*.035)*4+Math.sin(x*.075)*2);rect(c,x,ridge,3,35-ridge,mix(t.mountain,t.sky,.4));}
  for(const [x,y]of[[66,8],[438,5]]){rect(c,x,y+3,30,4,t.cloudBack);rect(c,x+6,y,14,7,t.cloudBack);rect(c,x-5,y+7,43,3,t.cloudBack);}
  for(let x=0;x<W;x+=2){const ground=34+Math.round(Math.sin(x*.022)*3+Math.sin(x*.057));rect(c,x,ground,2,7,t.grassShadow);rect(c,x,ground,2,2,t.grass);if(x%12===0)rect(c,x,ground+2,2,2,mix(t.grass,t.grassShadow,.45));}
  for(let k=0;k<15;k++){
   const x=17+k*45,y=35+Math.round(Math.sin(x*.022)*3),petal=k%3===0?'#bc8a87':k%3===1?'#d8bd77':'#a4bbbf';
   rect(c,x,y-11,1,11,t.grassShadow);rect(c,x+1,y-6,3,1,t.grassShadow);rect(c,x+3,y-8,3,2,t.grass);rect(c,x-3,y-4,3,2,t.grass);
   rect(c,x-2,y-15,5,1,petal);rect(c,x-3,y-14,7,4,petal);rect(c,x-1,y-13,3,2,t.cloud);rect(c,x-2,y-10,5,1,petal);
  }
  if(p.night){for(let k=0;k<12;k++)rect(c,12+k*53,4+k%3*3,1,1,t.sun);}
 }
 function mural(theme,x,y,r,p){
  if(!theme.biome||!r||y>=r.floor-5)return null;
  const xx=x-r.x,yy=y-r.y,h=r.floor-r.y;
  if(theme.biome==='stars'){
   const band=Math.abs(yy-(h*.45+Math.sin(xx*.025)*12)),mx=xx-r.w*.76,my=yy-24;if(mx*mx+my*my<81&&(mx+4)*(mx+4)+(my-2)*(my-2)>64)return '#f4dfa5';
   if(x%27<2&&y%19<2&&rand(Math.floor(x/27),Math.floor(y/19))>.55)return '#f7e4b1';
   if(x%53===0&&y%31<5)return '#c9e3db';
   return band<8?(rand(Math.floor(xx/3),Math.floor(yy/3))>.55?'#74708f':'#656084'):band<17?'#4e5078':p.wall;
  }
  if(theme.biome==='snow'){
   const ridge=h*.18+Math.abs((xx%103)-48)*.8,far=h*.2+Math.abs(((xx+35)%77)-38)*.65;
   const tree=((xx+5)%64)-32,ty=yy-h*.82;if(ty>0&&ty<18&&Math.abs(tree)<ty*.35)return '#527b85';
   if(yy>h*.9)return '#dce8dd';
   if(yy>ridge){if(yy<ridge+8+Math.sin(xx*.3)*2)return '#f2f1dd';return xx%103<48?'#91adbd':'#7392a3';}
   if(yy>far)return '#b2c9d0';return p.wall;
  }
  if(theme.biome==='forest'){
   const local=((xx+13)%48)-24,top=9+Math.floor(xx/48)%3*7,dy=yy-top;
   if(Math.abs(local)<2&&dy>8)return '#526a5c';
   const crown=dy<18?dy*.45:dy<32?(dy-10)*.6:dy<50?(dy-22)*.65:-1;
   if(dy>0&&Math.abs(local)<crown)return local<0?'#557e6c':'#6b9580';
   if(yy>h*.8&&Math.abs(((xx+7)%19)-9)<(yy-h*.8)*.6)return '#6a8d71';
   if(x%31<2&&y%29<2)return '#d3d8a0';return yy>h*.7?'#7e9e87':p.wall;
  }
  const local=((xx+8)%56)-28,canopy=20+Math.round(Math.cos(local*.09)*12),vine=((xx+19)%43)-21;
  if(Math.abs(local)<2&&yy>18)return '#345e4c';
  if(yy<canopy)return (Math.floor(xx/6)+Math.floor(yy/5))%4===0?'#537e59':yy<12?'#315e50':'#477e60';
  if(Math.abs(vine)<1&&yy<62)return '#a2bd7b';
  if(yy<62&&yy%14<5&&Math.abs(vine-(yy%28<14?3:-3))<3)return '#7ca970';
  const leafX=((xx+17)%36)-18,leafY=yy-h*.8;
  if(leafY>0&&leafY<15&&Math.abs(leafX)<12-Math.abs(leafY-7))return leafX<0?'#3d7157':'#659a6b';
  if(yy>h*.9)return '#477a5e';return p.wall;
 }

 function canPlace(id,x,y){
  const item=HomeCatalog.items.find(i=>i.id===id),scale=item?.scale||.85,w=32*scale,h=id==='rug'?18:(item?.foot||32)*scale,g=caveGeometry();
  const region=g.region[Math.floor(y-5)*W+Math.floor(x)];if(!region)return false;
  for(let yy=Math.floor(y-h);yy<=y;yy+=3)for(let xx=Math.floor(x-w/2);xx<=x+w/2;xx+=3){if(xx<0||xx>=W||yy<0||yy>=H||!g.mask[yy*W+xx]||g.inner[yy*W+xx]<3)return false;}
  return true;
 }
 function paint(theme,t){
  const key=theme.id+':'+t.period+':'+t.sky;if(cache.has(key))return cache.get(key);
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;const p=palette(theme,t),g=caveGeometry();if(theme.biome){p.wall=theme.wall;p.rim=theme.trim;}landscape(c,p,theme.biome?{...t,sky:theme.wall,skyLow:theme.wall,grass:theme.biome==='snow'?'#eeeede':theme.trim,grassShadow:theme.trim,mountain:theme.trim}:t);
  const image=c.getImageData(0,0,W,H),a=image.data,colors={};
  const rgb=hex=>colors[hex]||(colors[hex]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
  const shade=mix(p.wall,p.rim,.45),floor=mix(p.wall,p.rim,.27),texture=mix(p.wall,p.rim,.18);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x;let col;
   if(!g.mask[i]){if(g.outer[i]<=2)col=p.ink;else continue;}
   else if(g.inner[i]===1)col=p.rim;
   else if(g.inner[i]<4)col=shade;
   else{const r=rooms[g.region[i]-1];col=(r&&y>=r.floor)||(!r&&g.bottom[i]<6)?floor:p.wall;
    // Sparse two-pixel chips, not photographic grain or antialiased speckles.
    if(x%13<3&&y%11===0&&rand(Math.floor(x/13),Math.floor(y/11))>.7)col=texture;col=mural(theme,x,y,r,p)||col;
   }
   const color=rgb(col);a[i*4]=color[0];a[i*4+1]=color[1];a[i*4+2]=color[2];a[i*4+3]=255;
  }
  c.putImageData(image,0,0);
  // Flat pixel rails and treads, using the focus scene's wood and highlight colours.
  for(const x of [302,320]){rect(c,x,31,3,181,p.ink);rect(c,x,31,2,180,p.wood);rect(c,x,31,1,179,p.light);}
  for(let y=41;y<210;y+=13){rect(c,301,y+1,23,3,p.ink);rect(c,301,y,23,2,p.light);rect(c,303,y+1,19,1,p.wood);}
  if(cache.size>12)cache.clear();cache.set(key,cv);return cv;
 }
 // Cache the exact pixel wall silhouette once; effects cannot spill into soil,
 // passages or furnishings. The existing 8 fps scene loop supplies the clock.
 let wallClip;
 function animate(c,theme,frame){
  if(!theme.biome||!frame)return;
  if(!wallClip){
   wallClip=new Path2D();const g=caveGeometry();
   for(let y=0;y<H;y++){let start=-1;for(let x=0;x<=W;x++){
    const i=y*W+x,r=x<W?rooms[g.region[i]-1]:null,inside=r&&g.inner[i]>=4&&y<r.floor-5;
    if(inside&&start<0)start=x;else if(!inside&&start>=0){wallClip.rect(start,y,x-start,1);start=-1;}
   }}
   wallClip.rect(0,0,W,28);
  }
  c.save();c.clip(wallClip);
  const scenes=[...rooms,{x:0,y:0,w:W,floor:28}];
  scenes.forEach((r,n)=>{
   const height=r.floor-r.y-5;
   if(theme.biome==='stars'){
    for(let k=0;k<18;k++){
     const x=r.x+Math.floor(rand(k,n+31)*r.w),y=r.y+Math.floor(rand(k,n+44)*height),pulse=(frame+k*7+n*11)%56;
     rect(c,x,y,1,1,pulse<10?'#fff2c4':pulse<24?'#c8d2d3':'#8c95b2');
     if(pulse<7&&k%3===0){rect(c,x-1,y,3,1,'#f1deb2');rect(c,x,y-1,1,3,'#f1deb2');rect(c,x,y,1,1,'#fff9e3');}
    }
    const shoot=(frame+n*43)%180;
    if(shoot<18){const x=r.x+r.w*.18+shoot*4,y=r.y+14+shoot;for(let j=5;j>=0;j--)rect(c,x-j*3,y-j,2,1,['#fff6d5','#e4ddc2','#b4c4ce','#8e9dbb','#717da5','#555e8b'][j]);}
   }else if(theme.biome==='rainforest'){
    for(let k=0;k<16;k++){
     const fall=(frame*(1+k%3*.25)+k*13+n*17)%(height+12),x=r.x+rand(k,n+50)*r.w-fall*.13,y=r.y+fall;
     rect(c,x,y,1,3+k%3,k%3?'#b6dac966':'#d9ede390');
     if(fall>height-4&&fall<height){rect(c,x-2,r.floor-7,5,1,'#b6dac966');}
    }
   }else if(theme.biome==='snow'){
    for(let k=0;k<22;k++){
     const x=r.x+rand(k,n+70)*r.w+Math.sin(frame*.035+k)*4,y=r.y+(frame*(.3+k%3*.15)+k*17)%(height+5),big=k%7===0;
     rect(c,x,y,big?2:1,big?2:1,k%2?'#f9f8ebdd':'#e4f2edaa');
     if(big&&k%2===0){rect(c,x-1,y,4,1,'#f9f8eb99');rect(c,x,y-1,1,4,'#f9f8eb99');}
    }
   }else{
    for(let k=0;k<9;k++){
     const x=r.x+rand(k,n+90)*r.w+Math.sin(frame*.04+k)*4,y=r.y+height*.25+rand(k,n+99)*height*.65+Math.sin(frame*.025+k*2)*3,pulse=(frame+k*9)%48;
     if(pulse<28){rect(c,x-1,y-1,3,3,'#dfde9240');rect(c,x,y,1,1,pulse<12?'#fff0ad':'#c8d891');}
    }
    for(let k=0;k<2;k++){const y=r.y+(frame*.3+k*47+n*13)%height,x=r.x+r.w*(.3+k*.4)+Math.sin(frame*.035+k)*8;rect(c,x,y,3,1,'#c6b778');rect(c,x+1,y+1,2,1,'#90a46b');}
   }
  });
  c.restore();
 }

 function roomAt(spot){return spot.y<200?(spot.x<320?1:2):(spot.x<400?3:4);}
 function glow(c,id,spot,t){
  if(!['lamp','mushroomLamp','hangingLantern','archedWindow'].includes(id))return;
  const g=caveGeometry(),room=roomAt(spot),x=spot.x,y=spot.y-(id==='lamp'?29:id==='archedWindow'?22:18),radius=id==='archedWindow'?42:55,moon=id==='archedWindow'&&t.period==='night';
  // A handful of stepped light levels: warm without blurring the pixel edges.
  for(let yy=Math.floor((y-radius)/2)*2;yy<y+radius;yy+=2)for(let xx=Math.floor((x-radius)/2)*2;xx<x+radius;xx+=2){
   if(xx<0||yy<0||xx+1>=W||yy+1>=H)continue;
   if([yy*W+xx,yy*W+xx+1,(yy+1)*W+xx,(yy+1)*W+xx+1].some(i=>g.region[i]!==room||g.inner[i]<4))continue;
   const d=Math.hypot(xx-x,yy-y)/radius,level=Math.floor((1-d)*4);if(level<1)continue;
   const alpha=(level*(t.period==='night'?24:13)).toString(16).padStart(2,'0');rect(c,xx,yy,2,2,(moon?'#a4d8ee':'#ffda8d')+alpha);
  }
 }
 function drawDecor(c,id,spot,t){
  if(!['archedWindow','hangingLantern','herbShelf','crockeryShelf','kitchenUnit'].includes(id))return false;
  const scale=id==='kitchenUnit'?2:id==='hangingLantern'?1:1.5,foot=id==='kitchenUnit'?32:30,x=spot.x-16*scale,y=spot.y-foot*scale;
  for(const [a,b,w,h,original]of furniture[id]){
   let color=original;
   if(id==='archedWindow'&&t.period==='night'){if(color==='#83a2a5')color='#426579';else if(color==='#b4c9c1')color='#344f68';else if(color==='#9cab85')color='#749697';}
   const left=Math.round(x+a*scale),top=Math.round(y+b*scale);rect(c,left,top,Math.round(x+(a+w)*scale)-left,Math.round(y+(b+h)*scale)-top,color);
  }
  if(id==='archedWindow'&&t.period==='night'){rect(c,x+20*scale,y+10*scale,2*scale,3*scale,'#e6d9a5');rect(c,x+19*scale,y+11*scale,scale,scale,'#e6d9a5');}
  return true;
 }
 const furniture=(()=>{
  const all={},ink='#594635',wood='#a37c56',light='#d1ac79',edge='#795b40',cream='#f5e5be',sage='#9cab85',dark='#697e61',pink='#bd8674',blue='#83a2a5';
  function asset(id,paint){const a=[];paint((x,y,w,h,c)=>a.push([x,y,w,h,c]));all[id]=a;}
  asset('lamp',r=>{
   r(13,27,14,2,edge);r(14,26,12,1,light);r(17,24,6,2,wood);r(19,12,2,13,edge);r(19,12,1,12,light);
   r(12,3,16,2,edge);r(11,5,18,5,cream);r(10,10,20,5,cream);r(9,15,22,1,edge);r(10,14,20,1,light);r(12,3,16,1,cream);
   for(let x=12;x<29;x+=4){r(x,6,1,8,'#ddc797');r(x+1,6,1,8,'#f9efce');}r(24,16,1,4,wood);r(23,20,3,2,light);
  });
  asset('bed',r=>{
   r(1,5,3,25,ink);r(1,4,4,3,light);r(2,8,1,17,wood);r(28,14,3,16,ink);r(28,13,4,3,light);
   r(4,24,24,6,wood);r(4,25,24,1,light);r(5,27,22,1,edge);r(3,30,4,2,ink);r(26,30,4,2,ink);
   r(4,12,25,12,cream);r(5,10,8,3,cream);r(6,11,6,1,'#fff5dc');r(5,14,7,1,'#d7c5a2');
   r(13,13,15,12,sage);r(13,13,15,2,'#c8d0a3');r(25,16,3,9,dark);r(14,16,1,8,'#b8c59a');r(22,16,1,8,'#b8c59a');
   for(let y=17;y<24;y+=3){r(14,y,11,1,'#c8d0a3');}r(14,25,10,1,cream);r(15,26,1,1,cream);r(18,26,1,1,cream);r(21,26,1,1,cream);
  });
  asset('bookcase',r=>{
   r(2,1,28,30,ink);r(1,1,30,2,wood);r(2,1,28,1,light);r(3,4,3,24,wood);r(26,4,3,24,wood);r(4,4,1,23,light);
   r(6,4,20,10,'#50594b');r(6,17,20,10,'#50594b');r(4,14,24,3,wood);r(5,14,22,1,light);r(3,28,26,3,wood);r(4,28,24,1,light);
   const cols=[pink,sage,blue,'#d2b77e'];for(let row=0;row<2;row++)for(let k=0;k<4;k++){const x=7+k*5,y=5+row*13+(k+row)%3;r(x,y,4,14+row*13-y,cols[(k+row)%4]);r(x,y,1,14+row*13-y,mix(cols[(k+row)%4],ink,.2));r(x+1,y+2,2,1,cream);r(x+1,12+row*13,2,1,cream);}
   r(4,31,3,1,edge);r(25,31,3,1,edge);
  });
  asset('desk',r=>{
   r(1,12,30,4,ink);r(1,12,30,1,light);r(2,13,28,1,wood);r(3,16,3,15,edge);r(4,16,1,14,wood);r(25,16,4,15,edge);
   r(19,17,9,12,wood);r(20,17,7,1,light);r(20,22,7,1,edge);r(23,19,2,1,'#dfbf7a');r(23,25,2,1,'#dfbf7a');
   r(5,8,11,4,cream);r(6,9,8,1,'#aeb89c');r(15,7,1,5,edge);r(22,8,5,4,blue);r(23,5,1,4,ink);r(26,9,2,2,blue);
   r(5,31,2,1,ink);r(25,31,3,1,ink);
  });
  asset('cushion',r=>{
   r(5,14,22,2,'#e5af91');r(3,16,26,9,pink);r(5,25,22,3,'#985f53');r(3,17,1,7,'#985f53');r(28,17,1,7,'#985f53');r(6,16,20,1,'#f0c9a4');r(6,23,20,1,'#ce9980');
   for(let x=7;x<26;x+=3){r(x,18,1,1,'#f5d8b0');r(x,24,1,1,'#dfb497');}r(15,20,3,2,'#a56a5d');r(16,20,1,1,'#eed0aa');
  });
  asset('rug',r=>{
   r(0,12,32,10,'#8e6453');r(1,13,30,8,'#c79c78');r(3,14,26,6,'#eee0b3');r(5,15,22,4,'#879979');
   for(let x=6;x<26;x+=5){r(x,16,3,2,'#d6b48a');r(x+1,15,1,4,'#d6b48a');}for(let x=2;x<30;x+=3){r(x,13,1,1,'#efe0b9');r(x,20,1,1,'#efe0b9');}
  });
  asset('art',r=>{
   r(3,3,27,27,'#423e32');r(2,2,27,27,edge);r(3,3,25,25,light);r(5,5,21,21,cream);r(7,7,17,17,'#718c85');r(3,3,25,1,'#ebd2a1');
   r(14,9,3,12,'#f1d58b');r(10,13,11,3,'#f1d58b');r(12,11,2,2,'#f1d58b');r(17,17,2,2,'#f1d58b');r(15,13,1,3,'#fff0c4');r(9,21,3,1,cream);r(20,9,1,1,cream);
  });
  asset('archedWindow',r=>{
   r(9,2,14,2,edge);r(6,4,20,3,wood);r(4,7,24,20,edge);r(6,8,20,17,blue);r(7,8,18,8,'#b4c9c1');r(7,21,18,4,sage);r(15,5,2,21,cream);r(6,17,20,2,cream);r(2,27,28,2,wood);r(3,27,26,1,light);
   for(const x of [3,25]){r(x,6,4,20,pink);r(x+1,7,1,18,'#e5b59b');r(x,21,4,1,light);}
  });
  asset('hangingLantern',r=>{
   r(15,1,1,10,ink);r(12,10,7,2,edge);r(10,13,11,14,ink);r(12,14,7,11,'#edc16b');r(14,15,3,9,'#fff1be');r(9,27,13,2,edge);r(11,29,9,1,light);r(10,12,11,1,light);
  });
  asset('herbShelf',r=>{
   r(1,26,30,2,wood);r(2,26,28,1,light);r(5,28,2,3,edge);r(25,28,2,3,edge);r(5,21,8,5,pink);r(4,20,10,2,light);r(8,8,1,12,dark);
   for(let k=0;k<3;k++){r(3+k,9+k*4,5,2,sage);r(9,7+k*4,5,2,dark);}r(18,18,5,8,blue);r(19,16,3,2,light);r(25,15,3,11,cream);
  });
  asset('crockeryShelf',r=>{
   r(1,26,30,2,wood);r(2,26,28,1,light);r(5,28,2,3,edge);r(25,28,2,3,edge);
   for(let k=0;k<4;k++){const x=3+k*7,y=14+k%2*4,col=[cream,blue,pink,sage][k];r(x,y+2,5,24-y,col);r(x+1,y,3,2,light);r(x+1,y+3,1,7,'#eadbb9');}
  });
  asset('kitchenUnit',r=>{
   r(3,2,26,9,edge);r(4,3,24,7,wood);for(let x=6;x<26;x+=6){r(x,5,3,4,cream);}r(4,13,24,6,cream);for(let x=5;x<27;x+=5)r(x,13,1,6,'#c9c6ad');r(4,16,24,1,'#c9c6ad');
   r(2,19,28,3,light);r(4,22,24,10,edge);r(5,23,22,8,sage);r(15,23,1,8,dark);r(12,25,1,2,light);r(19,25,1,2,light);r(7,19,10,2,blue);r(15,16,1,3,edge);r(22,22,5,7,cream);r(23,25,3,1,pink);
  });
  return all;
 })();
 Object.assign(furniture,{
 television:[[3,7,26,20,'#473e36'],[4,8,24,17,'#b58254'],[6,10,17,12,'#293f48'],[7,11,15,9,'#8bb3ae'],[8,12,13,2,'#bad1b6'],[8,18,12,2,'#6e9390'],[25,12,2,2,'#ead29b'],[25,17,2,2,'#4e4639'],[7,27,3,4,'#574638'],[23,27,3,4,'#574638'],[13,3,2,4,'#574638'],[9,1,2,2,'#574638'],[19,1,2,2,'#574638'],[11,3,9,1,'#574638']],
 mushroomSofa:[[2,14,28,14,'#573e46'],[4,8,24,15,'#a95f6a'],[7,6,18,3,'#c47c7e'],[2,17,6,10,'#d5a084'],[24,17,6,10,'#d5a084'],[8,21,16,5,'#e7b9a0'],[7,11,4,3,'#f2dfbf'],[19,10,4,3,'#f2dfbf'],[6,28,3,3,'#654d3f'],[24,28,3,3,'#654d3f']],
 fossilClock:[[6,3,20,25,'#654e3c'],[8,5,16,21,'#c7b283'],[10,7,12,12,'#eee2b4'],[15,8,2,7,'#546c58'],[16,13,5,2,'#546c58'],[15,21,2,4,'#8c734e'],[13,24,6,2,'#e4c67e']],
 starWindow:[[3,2,26,29,'#8f795b'],[5,4,22,25,'#ded09e'],[7,6,18,21,'#343d66'],[9,9,2,2,'#f1dfa0'],[19,14,3,3,'#f1dfa0'],[13,20,2,2,'#f1dfa0'],[12,10,6,1,'#8994af'],[17,11,1,4,'#8994af'],[14,18,5,1,'#8994af'],[15,5,2,23,'#c8ae83'],[5,16,22,2,'#c8ae83']]
 });
 return {paint,animate,furniture,glow,drawDecor,canPlace,ready:true};
})();
