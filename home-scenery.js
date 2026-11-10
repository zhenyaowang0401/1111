/* Original burrow interiors. Logical pixels stay consistent with the existing mole and furniture. */
'use strict';
window.HomeScenery=(()=>{
 const W=640,H=360,cache=new Map();
 const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const rand=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
 const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
 const ellipse=(c,x,y,w,h,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);c.fill();};
 const line=(c,d,col,w=1)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke(new Path2D(d));};
 const fill=(c,d,col)=>{c.fillStyle=col;c.fill(new Path2D(d));};
 const rooms=[
  {x:30,y:54,w:202,floor:149,type:'sleep',path:'M35 98 C29 64 63 53 103 57 C137 60 153 45 191 61 C220 74 237 95 230 120 C235 144 213 163 176 166 C142 164 116 173 82 163 C46 165 22 139 35 98 Z'},
  {x:385,y:54,w:220,floor:177,type:'study',path:'M388 122 C379 91 399 66 438 65 C470 61 484 45 522 57 C548 69 579 67 593 95 C609 119 605 147 589 170 C568 197 531 194 501 195 C462 195 434 205 410 184 C391 170 382 147 388 122 Z'},
  {x:76,y:177,w:282,floor:316,type:'living',path:'M79 258 C66 226 93 196 134 191 C175 182 191 158 237 177 C271 191 279 196 309 205 C344 216 355 240 357 268 C369 303 336 333 294 335 C254 338 231 344 188 337 C153 332 120 343 96 324 C75 310 69 287 79 258 Z'},
  {x:425,y:238,w:180,floor:310,type:'gallery',path:'M427 278 C420 249 444 231 477 239 C505 245 527 225 557 239 C586 246 605 260 603 284 C608 310 583 326 555 326 C529 322 506 336 482 325 C447 328 425 311 427 278 Z'}
 ];
 function wood(c,x,y,w,h,p,vertical=false){
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();rect(c,x,y,w,h,p.wood);const step=vertical?9:7;
  for(let v=0;v<(vertical?w:h);v+=step){const odd=Math.floor(v/step)%2;
   rect(c,vertical?x+v:x,vertical?y:y+v,vertical?step-1:w,vertical?h:step-1,odd?p.wood:p.woodLight);
   rect(c,vertical?x+v:x,vertical?y:y+v,vertical?1:w,vertical?h:1,p.woodDark);
   for(let n=0;n<(vertical?h:w);n+=29){const q=n+odd*12;if(vertical){rect(c,x+v+1,y+q,step-2,1,p.woodDark);rect(c,x+v+3,y+q+4,1,13,p.grain);}else{rect(c,x+q,y+v,1,step,p.woodDark);rect(c,x+q+4,y+v+3,16,1,p.grain);}}
  }
  c.restore();
 }
 function shelf(c,x,y,w,p){rect(c,x,y+2,w,3,p.woodDark);rect(c,x-1,y,w+2,3,p.wood);rect(c,x,y,w,1,p.highlight);for(const xx of [x+4,x+w-6]){rect(c,xx,y+3,2,5,p.woodDark);rect(c,xx+2,y+3,3,2,p.wood);}}
 function books(c,x,y,n,p){const cols=[p.red,p.sage,p.blue,'#c5a568','#b5a095'];let xx=x;for(let k=0;k<n;k++){const w=3+k%3,h=10+(k*3)%7;rect(c,xx,y-h,w,h,cols[k%cols.length]);rect(c,xx,y-h,1,h,mix(cols[k%cols.length],p.ink,.2));rect(c,xx+1,y-h+2,w-2,1,p.highlight);rect(c,xx+1,y-3,w-2,1,p.highlight);xx+=w+1;}}
 function jar(c,x,y,w,h,col,p){rect(c,x+1,y-h+2,w-2,h-2,col);rect(c,x,y-h+4,w,h-6,col);rect(c,x+2,y-h,w-4,2,p.woodLight);rect(c,x+2,y-h+2,1,h-5,mix(col,'#fff5d9',.55));rect(c,x+1,y-1,w-2,1,mix(col,p.ink,.25));}
 function plant(c,x,y,size,p){rect(c,x-4,y-7,9,7,p.clay);rect(c,x-5,y-8,11,2,p.red);rect(c,x-2,y-6,1,4,p.highlight);for(let k=0;k<5;k++){const yy=y-10-k*size*.65;line(c,`M${x} ${y-8} Q${x-2+k%3} ${yy+3} ${x+(k%2?1:-1)*size} ${yy}`,p.leaf,1);ellipse(c,x+(k%2?0:-size-2),yy-2,size+2,3,k%2?p.leaf:p.leafLight);}}
 function lantern(c,x,y,p,night=false){
  const glow=c.createRadialGradient(x,y+8,1,x,y+8,night?30:19);glow.addColorStop(0,night?'#ffd98345':'#fff2c52b');glow.addColorStop(1,'#ffe2a000');c.fillStyle=glow;c.fillRect(x-31,y-24,62,65);
  rect(c,x,y-13,1,12,p.ink);rect(c,x-4,y-2,9,2,p.brassDark);rect(c,x-5,y,11,14,p.ink);rect(c,x-3,y+1,7,11,p.gold);rect(c,x-1,y+2,3,9,p.highlight);rect(c,x-6,y+13,13,2,p.brassDark);rect(c,x-3,y+15,7,1,p.brass);rect(c,x-5,y-1,1,15,p.brass);
 }
 function windowFrame(c,x,y,w,h,p,t){
  const shape=`M${x} ${y+h} V${y+11} Q${x+w/2} ${y-7} ${x+w} ${y+11} V${y+h} Z`;
  fill(c,shape,p.woodDark);c.save();c.clip(new Path2D(shape));const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,t.period==='night'?'#244760':'#90b4bb');g.addColorStop(1,t.period==='night'?'#527883':'#d0dfcb');c.fillStyle=g;c.fillRect(x+3,y+3,w-6,h-6);
  if(t.period==='night'){ellipse(c,x+w-12,y+8,6,6,p.gold);rect(c,x+8,y+12,1,1,p.highlight);}else{fill(c,`M${x+3} ${y+h-8} Q${x+10} ${y+h-18} ${x+19} ${y+h-9} T${x+w-2} ${y+h-13} V${y+h} H${x} Z`,p.leafLight);}
  rect(c,x+w/2,y+4,2,h-5,p.highlight);rect(c,x+3,y+h*.57,w-6,2,p.highlight);c.restore();line(c,shape,p.woodLight,2);shelf(c,x-3,y+h,w+6,p);
  rect(c,x-6,y+1,w+12,2,p.woodDark);for(let side=0;side<2;side++){const xx=side?x+w-2:x-4;rect(c,xx,y+4,6,h-4,p.fabric);for(let k=0;k<3;k++)rect(c,xx+k*2,y+5,1,h-5,k%2?p.fabricDark:p.fabricLight);rect(c,xx,y+h-11,6,2,p.brass);}
 }
 function palette(theme,t){
  const night=t.period==='night',cool=theme.id==='rain'||theme.id==='moon';
  return {ink:'#403b31',paper:night?'#d8d0b8':'#f3e7cb',plaster:night?'#b7bcb0':cool?'#d7e0d8':'#eadfc2',wood:'#9a704c',woodLight:'#bd9366',woodDark:'#604a36',grain:'#a57e55',highlight:night?'#e5dfc8':'#f7e7bf',sage:cool?'#7d9f9b':theme.id==='moss'?'#8e9f79':'#aaa184',sageDark:cool?'#4f7375':'#5e7254',blue:'#88a8ad',red:'#b9745e',clay:'#c39570',gold:'#f0ca78',brass:'#c2a261',brassDark:'#7e6639',leaf:'#536b46',leafLight:'#8b9b65',fabric:cool?'#99b6bd':theme.id==='moss'?'#b2ba91':'#c39782',fabricDark:cool?'#78959f':'#89966d',fabricLight:cool?'#c4d7d5':'#d5d6ac',night};
 }
 function architecture(c,room,p){
  const shape=new Path2D(room.path);c.save();line(c,room.path,'#28292490',8);fill(c,room.path,p.plaster);c.clip(shape);
  // Quiet limewashed earth with close paper grain, instead of busy wallpaper and panelling.
  const wash=c.createLinearGradient(0,room.y,0,room.floor+20);
  wash.addColorStop(0,mix(p.plaster,p.woodDark,.23));wash.addColorStop(.3,p.plaster);wash.addColorStop(.83,mix(p.plaster,p.highlight,.22));wash.addColorStop(1,mix(p.plaster,p.woodDark,.18));c.fillStyle=wash;c.fillRect(0,0,W,H);
  for(let k=0;k<75;k++){const x=room.x+rand(k,room.floor)*room.w,y=room.y+rand(k,room.floor+1)*(room.floor-room.y);ellipse(c,x,y,6+rand(k,3)*18,3+rand(k,4)*9,k%2?'#f4e4bc12':'#88754e08');}
  grain(c,room.x,room.y,room.w,room.floor-room.y+30,room.floor,6000);
  // A subdued level walking surface; furniture sits on this line.
  rect(c,room.x,room.floor,room.w,30,mix(p.plaster,p.woodDark,.2));grain(c,room.x,room.floor,room.w,30,52,800);
  line(c,`M${room.x} ${room.floor} H${room.x+room.w}`,'#8a745c55',1);
  c.restore();line(c,room.path,'#b7a47e80',1.5);
 }
 function corridor(c,x,y,w,h,p){
  const wash=c.createLinearGradient(0,y,0,y+h);wash.addColorStop(0,mix(p.plaster,p.woodDark,.16));wash.addColorStop(.55,p.plaster);wash.addColorStop(1,mix(p.plaster,p.woodDark,.2));c.fillStyle=wash;c.fillRect(x,y,w,h);
  grain(c,x,y,w,h,12,700);line(c,`M${x} ${y} H${x+w}`,'#6f5b4244',1);line(c,`M${x} ${y+h-1} H${x+w}`,'#8a745c55',1);
 }
 function kitchen(c,p){
  // Crockery dresser, with inset cupboard panels and tiled backsplash.
  wood(c,283,232,47,23,p);rect(c,287,235,39,15,p.woodDark);for(let i=0;i<5;i++)jar(c,290+i*7,250,5,10-i%2*2,[p.paper,p.blue,p.clay][i%3],p);rect(c,286,251,41,2,p.woodLight);
  rect(c,282,258,48,18,p.paper);for(let y=258;y<276;y+=6)for(let x=282;x<330;x+=8){rect(c,x,y,1,6,'#b8b6a0');rect(c,x,y,8,1,'#c2bdab');if((x+y)%3===0)rect(c,x+3,y+2,2,2,p.fabric);}
  rect(c,282,278,49,37,p.woodDark);rect(c,284,279,45,33,p.sage);for(let i=0;i<2;i++){rect(c,287+i*21,284,18,26,p.sageDark);rect(c,289+i*21,286,14,22,p.sage);rect(c,289+i*21,286,14,1,p.fabricLight);rect(c,300+i*17,294,2,3,p.brass);}
  rect(c,279,275,55,4,p.woodDark);rect(c,279,275,55,2,p.highlight);ellipse(c,285,272,20,5,p.blue);ellipse(c,288,272,14,2,p.paper);rect(c,305,266,2,9,p.brass);rect(c,302,265,5,2,p.highlight);
  jar(c,316,274,10,13,p.red,p);rect(c,319,258,1,5,p.woodDark);rect(c,323,260,1,5,p.woodDark);
  rect(c,310,282,10,16,p.paper);for(let y=285;y<297;y+=4)rect(c,311,y,8,1,p.red);rect(c,310,297,10,1,p.woodLight);
 }
 function grain(c,x,y,w,h,seed,amount=1400){
  for(let k=0;k<amount;k++){const xx=x+rand(k,seed)*w,yy=y+rand(k,seed+3)*h;c.fillStyle=k%2?'#fff2ca12':'#493b3010';c.fillRect(xx,yy,.5+rand(k,seed+8),.5);}
 }
 const earth=new Image();let textureReady=false;
 earth.onload=()=>{textureReady=true;cache.clear();};
 earth.src='assets/backgrounds/burrow-earth.png';
 function paint(theme,t){
  const key=theme.id+':'+t.period+':'+t.sky+':'+textureReady;if(cache.has(key))return cache.get(key);
  const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;const c=cv.getContext('2d');c.scale(2,2);const p=palette(theme,t);
  const soil=c.createLinearGradient(0,20,0,H);soil.addColorStop(0,'#736249');soil.addColorStop(1,'#3e3934');c.fillStyle=soil;c.fillRect(0,0,W,H);
  if(textureReady){c.drawImage(earth,0,0,W,H);const patina=c.createLinearGradient(0,28,0,H);patina.addColorStop(0,'#293e3500');patina.addColorStop(.12,'#293e3540');patina.addColorStop(1,'#242e304a');c.fillStyle=patina;c.fillRect(0,28,W,H-28);}
  else{grain(c,0,25,W,H-25,40,12000);rect(c,0,0,W,28,t.sky);fill(c,'M0 30 Q90 19 180 28 T400 27 T640 25 V40 H0 Z',p.leaf);}
  if(p.night){rect(c,0,0,W,H,'#193d5555');}
  // An open earthen shaft behind the ladder, with no wood-panel backing.
  rect(c,298,38,28,176,mix(p.plaster,p.woodDark,.22));grain(c,298,38,28,176,26,1000);
  for(const room of rooms)architecture(c,room,p);
  corridor(c,217,115,85,36,p);corridor(c,324,139,79,39,p);corridor(c,345,277,90,35,p);
  // Two slender rails and widely spaced treads: the earth remains visible between them.
  for(const x of [303,320]){line(c,`M${x+2} 38 L${x+1} 209`,'#342c2540',3);line(c,`M${x} 37 L${x-1} 208`,p.woodDark,2.7);line(c,`M${x-.5} 37 L${x-1.5} 208`,p.woodLight,1);}
  for(let y=45;y<207;y+=13){line(c,`M302 ${y+1} L320 ${y}`,p.woodDark,2.5);line(c,`M303 ${y} L319 ${y-1}`,p.woodLight,1.2);}
  if(cache.size>12)cache.clear();cache.set(key,cv);return cv;
 }
 function roomAt(spot){return rooms[spot.y<200?(spot.x<320?0:1):(spot.x<400?2:3)];}
 function glow(c,id,spot,t){
  if(!['lamp','mushroomLamp','hangingLantern','archedWindow'].includes(id))return;
  c.save();c.clip(new Path2D(roomAt(spot).path));
  const x=spot.x,y=spot.y-(id==='lamp'?29:id==='archedWindow'?22:18),radius=id==='archedWindow'?42:55;
  const moon=id==='archedWindow'&&t.period==='night';const g=c.createRadialGradient(x,y,1,x,y,radius);g.addColorStop(0,moon?'#a4d8ee70':t.period==='night'?'#ffd37a99':'#ffe6a83d');g.addColorStop(.4,moon?'#a7d8ed26':'#ffe9ac3a');g.addColorStop(1,'#ffe6a800');c.fillStyle=g;c.fillRect(x-radius,y-radius,radius*2,radius*2);c.restore();
 }
 function drawDecor(c,id,spot,t,theme){
  if(!['archedWindow','hangingLantern','herbShelf','crockeryShelf','kitchenUnit'].includes(id))return false;
  const p=palette(theme,t);c.save();c.clip(new Path2D(roomAt(spot).path));
  if(id==='archedWindow')windowFrame(c,spot.x-14,spot.y-38,28,32,p,t);
  if(id==='hangingLantern')lantern(c,spot.x,spot.y-17,p,t.period==='night');
  if(id==='herbShelf'){shelf(c,spot.x-22,spot.y-5,44,p);plant(c,spot.x-12,spot.y-5,5,p);jar(c,spot.x+5,spot.y-5,8,11,p.blue,p);books(c,spot.x+13,spot.y-5,2,p);}
  if(id==='crockeryShelf'){shelf(c,spot.x-24,spot.y-5,48,p);for(let k=0;k<5;k++)jar(c,spot.x-20+k*8,spot.y-5,6,10+k%2*4,[p.paper,p.blue,p.clay][k%3],p);}
  if(id==='kitchenUnit'){c.translate(spot.x-35,spot.y-68);c.scale(.8,.8);c.translate(-267,-232);kitchen(c,p);}
  c.restore();return true;
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
 return {paint,furniture,glow,drawDecor,get textureReady(){return textureReady;}};
})();
