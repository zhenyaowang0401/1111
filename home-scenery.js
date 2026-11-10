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
 function picture(c,x,y,w,h,p,kind='plant'){
  rect(c,x+1,y+2,w,h,'#3f322c35');rect(c,x,y,w,h,p.woodDark);rect(c,x+1,y+1,w-2,h-2,p.woodLight);rect(c,x+3,y+3,w-6,h-6,p.paper);rect(c,x+1,y+1,w-2,1,p.highlight);
  if(kind==='plant'){line(c,`M${x+w/2} ${y+h-5} v-${h-11}`,p.leaf,1);for(let j=0;j<3;j++){ellipse(c,x+w/2-4,y+7+j*4,4,2,p.leafLight);ellipse(c,x+w/2,y+5+j*4,4,2,p.leaf);}}
  else{rect(c,x+4,y+4,w-8,h-8,p.blue);ellipse(c,x+w-10,y+6,4,4,p.gold);fill(c,`M${x+4} ${y+h-5} l${w*.35} -${h*.3} l${w*.3} ${h*.18} l${w*.2} -${h*.2} V${y+h-4} Z`,p.sage);}
 }
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
  return {ink:'#403b31',paper:night?'#d8d0b8':'#f3e7cb',plaster:cool?'#d7e0d8':'#eadfc2',wood:'#9a704c',woodLight:'#bd9366',woodDark:'#604a36',grain:'#a57e55',highlight:'#f7e7bf',sage:cool?'#7d9f9b':theme.id==='moss'?'#8e9f79':'#aaa184',sageDark:cool?'#4f7375':'#5e7254',blue:'#88a8ad',red:'#b9745e',clay:'#c39570',gold:'#f0ca78',brass:'#c2a261',brassDark:'#7e6639',leaf:'#536b46',leafLight:'#8b9b65',fabric:cool?'#99b6bd':theme.id==='moss'?'#b2ba91':'#c39782',fabricDark:cool?'#78959f':'#89966d',fabricLight:cool?'#c4d7d5':'#d5d6ac',night};
 }
 function architecture(c,room,p){
  const shape=new Path2D(room.path);c.save();line(c,room.path,'#322e28',7);fill(c,room.path,p.plaster);c.clip(shape);
  const base=room.type==='sleep'?mix(p.plaster,p.red,.08):room.type==='study'?mix(p.plaster,p.blue,.16):p.plaster;
  rect(c,0,room.y,640,room.floor-room.y,base);
  // Plaster motifs are evenly spaced and subordinate to the furnishings.
  for(let y=room.y+8;y<room.floor-34;y+=15)for(let x=room.x+6;x<room.x+room.w;x+=14){rect(c,x,y,1,3,mix(base,p.sage,.35));rect(c,x-2,y+1,2,1,mix(base,p.sage,.3));rect(c,x+1,y-1,2,1,mix(base,p.sage,.3));}
  const panel=room.type==='sleep'?mix(p.sage,p.red,.15):p.sage;
  rect(c,room.x,room.floor-28,room.w,28,p.sageDark);
  for(let x=room.x;x<room.x+room.w;x+=10){rect(c,x+1,room.floor-26,8,24,panel);rect(c,x+2,room.floor-24,1,20,mix(panel,p.highlight,.28));rect(c,x+8,room.floor-24,1,20,mix(panel,p.ink,.18));}
  rect(c,room.x,room.floor-30,room.w,3,p.woodDark);rect(c,room.x,room.floor-30,room.w,1,p.woodLight);
  // Inlaid floorboards, staggered joints and a proper skirting board.
  wood(c,room.x,room.floor,room.w,30,p);rect(c,room.x,room.floor-2,room.w,3,p.woodDark);rect(c,room.x,room.floor-2,room.w,1,p.highlight);
  const shade=c.createLinearGradient(0,room.y,0,room.floor);shade.addColorStop(0,'#3e34282e');shade.addColorStop(.3,'#3e342800');shade.addColorStop(.85,'#3e342800');shade.addColorStop(1,'#3e34281c');c.fillStyle=shade;c.fillRect(room.x,room.y,room.w,room.floor-room.y);
  c.restore();line(c,room.path,p.woodDark,3);line(c,room.path+'',p.woodLight,1);
 }
 function corridor(c,x,y,w,h,p){
  rect(c,x,y,w,h,p.plaster);rect(c,x,y,w,3,p.woodDark);rect(c,x,y+3,w,1,p.woodLight);wood(c,x,y+h-5,w,6,p);
  for(let n=0;n<Math.floor(w/12);n++){rect(c,x+n*12,y+h-18,1,12,mix(p.plaster,p.sage,.35));}rect(c,x,y+h-19,w,2,p.sage);
  // Wooden jambs face the room; no pipe caps or raised borders.
  for(const xx of [x+2,x+w-5]){wood(c,xx,y+3,4,h-8,p,true);rect(c,xx,y+3,1,h-8,p.highlight);}
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
 function bedroom(c,p,hasBed){
  windowFrame(c,130,75,25,31,p, {period:p.night?'night':'day'});
  // Permanent window seat / sleeping alcove; player furniture occupies the separate left slot.
  if(!hasBed){wood(c,154,134,55,13,p);rect(c,153,130,57,5,p.paper);rect(c,170,131,39,9,p.fabric);for(let x=172;x<207;x+=6)rect(c,x,132,1,7,p.fabricLight);rect(c,156,126,14,7,p.highlight);rect(c,157,132,12,1,'#c9bda0');rect(c,153,144,57,3,p.woodDark);}
  else{wood(c,160,136,42,10,p);rect(c,159,133,44,4,p.fabric);rect(c,164,129,14,4,p.fabricLight);books(c,184,133,3,p);}
  rect(c,206,125,14,3,p.woodDark);rect(c,208,128,2,18,p.woodDark);rect(c,216,128,2,18,p.woodDark);jar(c,208,124,8,9,p.blue,p);
  // Folded linen on the little wall shelf.
  shelf(c,68,81,35,p);rect(c,72,74,14,6,p.fabric);rect(c,72,75,14,1,p.fabricLight);rect(c,73,78,12,1,p.fabricLight);jar(c,92,80,7,10,p.clay,p);
 }
 function study(c,p,t){
  windowFrame(c,553,96,29,31,p,t);plant(c,567,137,5,p);
  // Fitted writing nook: kneespace, drawers, a chair, paper and an inkwell.
  rect(c,537,151,50,4,p.woodDark);rect(c,537,150,50,2,p.woodLight);rect(c,539,155,3,22,p.woodDark);wood(c,572,155,13,20,p);for(let y=157;y<175;y+=6){rect(c,574,y,9,4,p.woodLight);rect(c,578,y+1,2,1,p.brass);}
  rect(c,543,146,14,4,p.paper);rect(c,546,147,8,1,p.sage);rect(c,559,146,5,4,p.blue);rect(c,561,140,1,6,p.ink);
  wood(c,550,155,17,14,p);rect(c,553,158,11,8,p.fabric);rect(c,548,169,21,3,p.fabricLight);rect(c,551,172,2,5,p.woodDark);rect(c,565,172,2,5,p.woodDark);
  shelf(c,475,88,50,p);books(c,479,88,7,p);picture(c,490,100,17,21,p,'landscape');
  rect(c,523,129,14,19,p.woodDark);rect(c,525,131,10,15,p.paper);for(let y=134;y<143;y+=3)rect(c,527,y,6,1,p.sage);rect(c,529,129,3,2,p.brass);
 }
 function living(c,p){
  kitchen(c,p);
  // A hutch over the dining corner, coherent with the kitchen cabinetry.
  wood(c,174,222,59,30,p);rect(c,178,225,51,23,p.woodDark);rect(c,178,236,51,2,p.woodLight);books(c,182,236,4,p);
  for(let i=0;i<4;i++){ellipse(c,209+i*4,227,5,8,p.paper);ellipse(c,210+i*4,229,3,4,p.blue);}for(let i=0;i<5;i++)jar(c,182+i*8,248,6,7,p.fabricLight,p);
  rect(c,171,219,65,3,p.woodDark);rect(c,171,219,65,1,p.highlight);plant(c,226,219,5,p);
  picture(c,252,228,18,23,p);picture(c,272,238,12,15,p,'landscape');
  // Dining table and a woven chair, with dishes and a folded runner.
  ellipse(c,172,313,42,5,'#41322535');rect(c,179,294,3,21,p.woodDark);rect(c,207,294,3,21,p.woodDark);rect(c,172,287,44,6,p.woodDark);wood(c,172,287,44,4,p);rect(c,188,287,9,10,p.paper);rect(c,189,290,7,1,p.red);rect(c,189,294,7,1,p.red);
  ellipse(c,176,283,10,4,p.paper);rect(c,178,279,5,5,p.blue);rect(c,183,280,2,2,p.blue);jar(c,201,286,7,9,p.clay,p);
  wood(c,181,298,14,12,p);rect(c,183,301,10,6,p.fabric);rect(c,179,310,18,3,p.fabricLight);rect(c,181,313,2,4,p.woodDark);rect(c,193,313,2,4,p.woodDark);
  // Ceiling rail, hooks and trailing greenery belong to the room, not floating decorations.
  shelf(c,109,227,37,p);plant(c,117,227,5,p);jar(c,133,227,8,12,p.paper,p);line(c,'M117 222 Q105 231 111 242 Q105 246 109 253',p.leaf,1);for(const [x,y]of[[108,234],[111,242],[107,249]])ellipse(c,x,y,5,2,p.leafLight);
 }
 function gallery(c,p){
  // Built-in specimen cabinet retains the existing treasure display coordinates.
  wood(c,457,251,46,32,p);rect(c,463,256,34,22,p.sageDark);rect(c,466,258,28,18,'#667d67');rect(c,463,267,34,2,p.woodLight);rect(c,458,250,44,2,p.highlight);rect(c,459,282,43,2,p.woodDark);rect(c,464,256,1,20,'#e6e7ba66');
  shelf(c,509,249,41,p);jar(c,512,249,8,10,p.clay,p);jar(c,524,249,6,8,p.blue,p);rect(c,536,240,9,9,p.paper);rect(c,539,242,3,5,p.leaf);
  // Stacked archive boxes tuck into the wall, away from the editable floor spot.
  rect(c,434,300,19,9,p.woodDark);rect(c,435,301,17,6,p.clay);rect(c,440,303,6,2,p.paper);rect(c,436,290,16,9,p.red);rect(c,435,290,18,2,p.woodLight);rect(c,441,294,5,2,p.highlight);
 }
 function paint(theme,t,slots={}){
  const hasBed=slots.right==='bed',key=theme.id+':'+t.period+':'+t.sky+':'+hasBed;if(cache.has(key))return cache.get(key);
  const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;const c=cv.getContext('2d');c.scale(2,2);const p=palette(theme,t);
  const soil=c.createLinearGradient(0,20,0,H);soil.addColorStop(0,'#8a7860');soil.addColorStop(.42,'#6e5e4c');soil.addColorStop(1,'#50483c');c.fillStyle=soil;c.fillRect(0,0,W,H);
  // Broad sediment bands, sparse stone clusters and fine material grain.
  for(let k=0;k<9;k++){const y=46+k*38;fill(c,`M0 ${y} Q90 ${y-18} 180 ${y+6} T380 ${y-4} T640 ${y+5} V${y+16} Q490 ${y+4} 365 ${y+17} T150 ${y+18} T0 ${y+11} Z`,k%2?'#bb9b7010':'#2c302417');}
  for(let k=0;k<1100;k++){const x=Math.floor(rand(k,3)*W),y=35+Math.floor(rand(k,7)*325);rect(c,x,y,1+k%3,1,k%3?'#e9cc9414':'#282c2420');}
  for(let k=0;k<55;k++){const x=rand(k,11)*W,y=40+rand(k,17)*316;fill(c,`M${x} ${y} l6 -2 l5 2 l-1 4 l-8 1 Z`,k%2?'#8b8570':'#a29376');line(c,`M${x+1} ${y} l5 -1 l4 1`,'#c2b18d55',1);}
  rect(c,0,0,W,30,t.sky);fill(c,'M0 28 Q50 16 100 25 T210 22 Q256 18 295 27 Q320 32 352 24 T468 25 Q548 13 640 22 V40 H0 Z',p.leaf);line(c,'M0 28 Q50 16 100 25 T210 22 Q256 18 295 27 Q320 32 352 24 T468 25 Q548 13 640 22',p.leafLight,3);
  for(let k=0;k<45;k++){const x=k*15+3,y=25+Math.sin(x*.02)*3;rect(c,x,y-4,1,5,p.leafLight);rect(c,x-2,y-2,2,1,p.leafLight);if(k%6===0){rect(c,x,y-7,2,2,p.gold);rect(c,x-1,y-6,4,1,p.paper);}}
  // Tapered roots originate at the surface; secondary roots do not have outlined-wire styling.
  for(const d of ['M28 31 Q24 48 31 65 L15 84 M26 54 L10 58','M237 28 Q248 52 244 78 L264 103 M245 62 L269 79','M609 25 Q621 49 612 88 L627 111 M618 58 L636 68','M43 38 Q39 104 25 141 L38 181 Q52 218 30 262','M607 38 Q632 174 612 222 L624 272 Q632 314 616 344']){line(c,d,'#3d372c',3);line(c,d,'#a88b61',1);}
  rect(c,298,24,28,189,p.woodDark);wood(c,300,26,24,184,p,true);
  for(const room of rooms)architecture(c,room,p);
  corridor(c,217,115,85,36,p);corridor(c,324,139,79,39,p);corridor(c,345,277,90,35,p);
  // The ladder is built from the same wood as the floors and door frames.
  rect(c,301,28,2,183,p.woodDark);rect(c,320,28,2,183,p.woodDark);for(let y=35;y<210;y+=12){rect(c,300,y+2,23,3,p.woodDark);rect(c,300,y,23,2,p.woodLight);rect(c,302,y,19,1,p.highlight);}rect(c,294,24,35,3,p.woodDark);rect(c,294,24,35,1,p.woodLight);
  bedroom(c,p,hasBed);study(c,p,t);living(c,p);gallery(c,p);
  for(const [x,y]of[[112,95],[466,102],[151,211],[363,151],[518,271]])lantern(c,x,y,p,p.night);
  if(p.night){c.fillStyle='#203b4b18';c.fillRect(0,32,W,H-32);}
  if(cache.size>12)cache.clear();cache.set(key,cv);return cv;
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
  return all;
 })();
 return {paint,furniture};
})();
