/* Original pixel sprites. All artwork is drawn locally on an integer grid. */
'use strict';
window.PixelArt=(()=>{
 const bounds={};
 const defaultColors={ink:'#28214c',pink:'#f9a6d5',light:'#ffdbec',shadow:'#c56bb0',fur:'#b784cf',furLight:'#d9a4e2',cyan:'#80e6eb',yellow:'#fff3a8'};
 function tint(hex,amount){const values=hex.slice(1).match(/.{2}/g).map(n=>parseInt(n,16));return '#'+values.map(v=>Math.round(amount>=0?v+(255-v)*amount:v*(1+amount)).toString(16).padStart(2,'0')).join('');}
 function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 function star(c,x,y,s=1,color='#fff3a8'){box(c,x+2*s,y,2*s,2*s,color);box(c,x,y+2*s,6*s,2*s,color);box(c,x+2*s,y+4*s,2*s,2*s,color);}
 function cloud(c,x,y,color){box(c,x+8,y,18,6,color);box(c,x+3,y+6,33,7,color);box(c,x,y+13,42,7,color);}
 function ovalPath(x,y,w,h,step=2){const path=new Path2D();for(let row=0;row<h;row+=step){const ny=(row+step/2-h/2)/(h/2),half=Math.round(Math.sqrt(Math.max(0,1-ny*ny))*w/2/step)*step;path.rect(Math.round(x+w/2-half),Math.round(y+row),half*2,step);}return path;}
 function oval(c,x,y,w,h,color,step=2){c.fillStyle=color;c.fill(ovalPath(x,y,w,h,step));}
 function sleepEffects(c,x,y,scale,frame,color){
  const pulse=Math.round((Math.sin(frame*.18)+1)*1.2),bx=x+22*scale,by=y+(12-pulse)*scale,size=(5+pulse)*scale;
  // A translucent, stepped nose bubble, attached by a tiny glint.
  box(c,x+18*scale,y+16*scale,3*scale,scale,'#a9d4dc');
  oval(c,bx-size/2,by-size/2,size,size,'#b4e0e777',scale);
  box(c,bx-size/2+scale,by-size/2,size-2*scale,scale,'#c6eced');box(c,bx-size/2+scale,by+size/2-scale,size-2*scale,scale,'#8bbcc9');box(c,bx-size/2,by-size/2+scale,scale,size-2*scale,'#b3dbe1');box(c,bx+size/2-scale,by-size/2+scale,scale,size-2*scale,'#b3dbe1');box(c,bx-scale,by-size/2+scale,scale,scale,'#f3ffff');
  // Three rising pixel z's, rather than one easily missed letter.
  for(let i=0;i<3;i++){const drift=Math.floor(frame/8+i)%4,xx=x+(16+i*6)*scale,yy=y+(-4-i*5-drift)*scale;c.save();c.globalAlpha=1-i*.2;box(c,xx,yy,4*scale,scale,color);box(c,xx+2*scale,yy+scale,scale,scale,color);box(c,xx+scale,yy+2*scale,scale,scale,color);box(c,xx,yy+3*scale,4*scale,scale,color);c.restore();}
 }
 function mole(c,x,y,scale=2,outfit=[],dig=false,frame=0,color='#b784cf',mood='awake',toolId=null){const colors={...defaultColors,fur:color,furLight:tint(color,.32),shadow:tint(color,-.23)};const has=id=>Array.isArray(outfit)?outfit.includes(id):outfit===id;c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);const sleepScale=mood==='asleep'?.78+Math.round((Math.sin(frame*.18)+1)*1.5)*.025:1;const r=(a,b,w,h,col)=>{const top=Math.round(27+(b-27)*sleepScale),bottom=Math.round(27+(b+h-27)*sleepScale);box(c,a,top,w,Math.max(1,bottom-top),col);};const bob=dig?(frame%2):0;c.translate(0,bob);
 // The same earless, stepped head silhouette is used in every scene.
 r(7,5,12,2,colors.ink);r(4,7,18,3,colors.ink);r(2,10,22,13,colors.ink);r(4,23,18,2,colors.ink);r(4,9,18,13,colors.fur);r(6,7,14,17,colors.fur);r(4,11,18,9,colors.fur);r(6,8,4,3,colors.furLight);r(4,11,3,5,colors.furLight);r(19,13,3,9,colors.shadow);r(6,21,15,3,colors.shadow);
 r(8,16,11,7,colors.pink);r(10,15,7,9,colors.pink);r(10,17,6,5,colors.light);r(8,11,2,3,colors.ink);r(17,11,2,3,colors.ink);if(!dig&&(mood==='asleep'||mood==='rest'||mood==='drowsy'&&frame%30>8||frame%42>=39)){r(8,11,2,3,colors.fur);r(17,11,2,3,colors.fur);r(8,13,3,1,colors.ink);r(16,13,3,1,colors.ink);}r(6,15,3,2,colors.shadow);r(18,15,3,2,colors.shadow);r(11,13,6,3,colors.pink);r(12,13,3,1,colors.light);r(13,17,2,1,colors.ink);
 r(4,24,7,3,colors.ink);r(16,24,7,3,colors.ink);r(5,24,6,2,colors.shadow);r(16,24,6,2,colors.shadow);
 const arm=dig&&frame%2?2:0;r(1,17-arm,5,6,colors.ink);r(2,17-arm,4,5,colors.furLight);r(2,21-arm,3,1,colors.light);r(21,17+arm,5,6,colors.ink);r(21,17+arm,4,5,colors.furLight);r(22,21+arm,3,1,colors.light);
 const worn=Array.isArray(outfit)?outfit:[],hat=WardrobeCatalog.items.find(i=>i.category==='hats'&&worn.includes(i.id)),clothes=WardrobeCatalog.items.find(i=>i.category==='clothes'&&worn.includes(i.id)),scarf=WardrobeCatalog.items.find(i=>i.category==='scarves'&&worn.includes(i.id));
 if(clothes)WardrobeArt.clothes(r,clothes.id);
 if(dig)WardrobeArt.drawTool(r,toolId,frame);
 if(hat)WardrobeArt.hat(r,hat.id);
 const eyewear=WardrobeCatalog.items.find(i=>i.category==='glasses'&&worn.includes(i.id));if(eyewear)WardrobeArt.glasses(r,eyewear.id);
 if(scarf)WardrobeArt.scarf(r,scarf.id);
 if(has('star')){star(c,20,17,.6,colors.yellow);r(21,18,1,1,'#fffce0');}
 c.restore();if(mood==='asleep')sleepEffects(c,x,y,scale,frame,colors.furLight);}
 const itemRects={
 star:[[12,2,8,8,'#fff3a8'],[8,10,16,4,'#fff3a8'],[2,14,28,6,'#fff3a8'],[8,20,16,4,'#fff3a8'],[12,24,8,6,'#e6b76b'],[8,14,4,4,'#fffbe4'],[24,16,4,4,'#e6b76b']],
 mushroom:[[8,4,16,4,'#e880bd'],[4,8,24,4,'#f79ed0'],[2,12,28,8,'#e880bd'],[6,20,20,2,'#8e4c94'],[12,22,8,8,'#ffe9b8'],[8,10,4,4,'#fff0da'],[20,13,4,4,'#fff0da']],
 crystal:[[13,1,7,5,'#b4fffa'],[9,6,15,4,'#70d9ed'],[5,10,22,12,'#63b9e6'],[9,22,15,4,'#7a80d6'],[13,26,7,5,'#5e5eb0'],[11,7,5,15,'#98eff1'],[6,12,4,8,'#c1ffff']],
 fossil:[[8,4,16,4,'#d7b4f0'],[4,8,24,16,'#b28ccf'],[8,24,16,4,'#9071b4'],[10,10,12,3,'#f6dbec'],[10,13,3,8,'#f6dbec'],[10,20,12,3,'#f6dbec'],[19,16,3,5,'#f6dbec'],[16,16,6,3,'#f6dbec']],
 glasses:[[3,10,10,3,'#fff1b0'],[1,13,3,10,'#fff1b0'],[3,23,10,3,'#e1bd83'],[12,13,3,10,'#e1bd83'],[19,10,10,3,'#fff1b0'],[17,13,3,10,'#fff1b0'],[19,23,10,3,'#e1bd83'],[28,13,3,10,'#e1bd83'],[14,14,4,3,'#e1bd83'],[4,14,4,3,'#9eeae6'],[21,14,4,3,'#9eeae6']],
 hat:[[10,4,14,4,'#ffe49d'],[7,8,19,10,'#e7bd7d'],[7,17,19,4,'#c17eb8'],[2,21,28,4,'#d1a168'],[6,25,23,2,'#a67762']],
 scarf:[[5,7,23,4,'#9cf8df'],[3,11,26,6,'#72dfcb'],[5,17,23,4,'#4fb0bc'],[19,19,7,11,'#72dfcb'],[19,26,7,2,'#aaf7de']]
 };
 function iconSVG(id){const wearable=WardrobeArt.iconSVG(id);if(wearable)return wearable;const rects=itemRects[id]||itemRects.star;return '<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">'+rects.map(([x,y,w,h,col])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}"/>`).join('')+'</svg>';}
 function item(c,id,x,y,s=1){for(const [a,b,w,h,col] of itemRects[id]||itemRects.star)box(c,x+a*s,y+b*s,w*s,h*s,col);}
 function random(a,b){const z=Math.sin(a*127.1+b*311.7)*43758.5453;return z-Math.floor(z);}
 function digMetrics(s){const active=s.session,elapsed=active?.elapsed||0,depth=active&&Journey.eligible(active)?elapsed/Journey.rate(active):0,fraction=active?Math.min(1,elapsed/active.plannedSeconds):0;return {depth,fraction,worldDepth:(s.depth||0)+depth};}
 function renderMine(c,s,frame){const w=384,h=224,t=WorldClock.snapshot(),m=digMetrics(s),running=s.session?.status==='running'&&Journey.eligible(s.session);const end=131+m.worldDepth*6;const camera=Math.max(0,end-174);const ground=87-camera;box(c,0,0,w,h,t.sky);
 if(t.period==='night')for(let i=0;i<22;i++){let x=Math.floor(random(i,2)*w/2)*2,y=Math.floor(random(i,7)*80/2)*2-camera;if(y>-5&&y<ground){if(i%5===0)star(c,x,y,1,i%2?'#fff3a8':'#7ee6ec');else box(c,x,y,2,2,'#778bdb');}}
 if(ground>0){cloud(c,24,31-camera,t.cloud);cloud(c,284,15-camera,t.cloudBack);celestial(c,t,camera);
 // Distant pixel mountains and rolling terrain.
 for(let x=0;x<w;x+=8){const hh=10+Math.floor(Math.sin(x*.04)*8+Math.cos(x*.083)*5);box(c,x,ground-hh,8,hh,t.mountain);}box(c,0,ground-5,w,5,t.grass);box(c,0,ground,w,4,t.grassShadow);for(let x=0;x<w;x+=12)box(c,x,ground-7,4,4,x%24?t.grass:tint(t.grass,.2));}
 Terrain.paint(c,camera,h,frame);
 // Excavated shaft is real cleared terrain, not an animation overlay.
 for(let wy=87;wy<end+7;wy+=4){const d=(wy-131)/6;const cx=192+Math.round(Math.sin(Math.max(0,d)*.13)*3)*4;const sy=wy-camera;if(sy>h||sy<-8)continue;box(c,cx-37,sy,74,5,'#24203f');box(c,cx-32,sy,64,5,'#1c1b37');box(c,cx-39,sy,3,5,'#aa799b');box(c,cx+36,sy,3,5,'#4e365c');box(c,cx-22,sy,2,4,'#ad8a7e');box(c,cx-10,sy,2,4,'#ad8a7e');if(wy%16===7)box(c,cx-23,sy,15,2,'#e0b490');}
 // Pending objects sit on the actual tool route. Crossed nodes are removed;
 // Journey.rewards uses these same nodes for the backpack and settlement.
 if(s.session)for(const e of Journey.events(s.session)){
  if(e.at<=(s.session.elapsed||0)+1e-7)continue;
  const depth=(s.session.baseDepth||0)+e.at/Journey.rate(s.session),yy=131+depth*6-camera+5,cx=192+Math.round(Math.sin(Math.max(0,depth)*.13)*3)*4;
  if(yy>-30&&yy<h){const id=e.kind==='star'?'star':['star','mushroom','crystal','fossil'][e.index];item(c,id,cx+(e.kind==='star'?-16:2),yy,e.kind==='star'?.5:.65);}
 }
 if(ground>-35){ // Surface base camp.
 box(c,45,ground-31,2,26,'#b58a91');box(c,47,ground-32,28,14,'#fa9ccc');box(c,51,ground-28,15,2,'#fff0d7');box(c,64,ground-26,4,4,'#fff0d7');box(c,36,ground-4,25,4,'#42526a');
 for(let i=0;i<3;i++){box(c,310+i*13,ground-13-i%2*5,3,13+i%2*5,'#619fa5');box(c,306+i*13,ground-15-i%2*5,11,5,'#a2dcc7');}box(c,82,ground-12,24,12,'#bc8e79');box(c,84,ground-15,20,3,'#e7b79a');box(c,91,ground-13,4,13,'#4c395b');}
 const cx=192+Math.round(Math.sin(Math.max(0,m.worldDepth)*.13)*3)*4;const my=end-camera-43-jump(s);box(c,cx-22,end-camera+7,48,4,'#13162d');mole(c,cx-25,my,2,s.equipped,running,frame,s.profile?.color,s.idleMood,s.tool);bounds.miningCanvas={x:cx-25,y:my-9,w:60,h:64};positionSpeech('petSpeech',bounds.miningCanvas,384,224);
 if(running){for(let i=0;i<5;i++){const k=(frame+i*3)%12;const dir=i%2?1:-1;const xx=cx+dir*(14+k*3),yy=end-camera-5-Math.floor(Math.sin(k/12*Math.PI)*18);box(c,xx,yy,3+(i%2)*2,3,'#c68aab');}if(frame%16<3)star(c,cx+32,my+26,.6,'#fff2b4');}
 // A subtle CRT edge; no blurry resampling.
 box(c,0,h-2,w,2,'#0c122f');}
 function renderWardrobe(c,s,frame){const t=WorldClock.snapshot();box(c,0,0,192,160,t.sky);if(t.period!=='night'){cloud(c,8,24,t.cloud);cloud(c,142,13,t.cloudBack);}if(t.period==='night')for(let i=0;i<15;i++){const x=Math.floor(random(i,1)*186),y=Math.floor(random(i,6)*116);if(i%4===0)star(c,x,y,.5,'#7c8bd2');else box(c,x,y,1,1,'#6775ae');}box(c,20,116,152,5,'#51447d');box(c,26,121,140,9,'#393361');box(c,32,130,128,5,'#27264d');box(c,18,116,4,5,'#a17cb7');box(c,170,116,4,5,'#a17cb7');mole(c,57,32-jump(s),3,s.equipped,false,frame,s.profile?.color,s.idleMood);bounds.wardrobeCanvas={x:57,y:23-jump(s),w:87,h:94};positionSpeech('wardrobeSpeech',bounds.wardrobeCanvas,192,160);star(c,28,55,1,'#fff0a9');star(c,151,34,.5,'#f6a6d2');}
 const furniture={
 rug:[[0,12,32,10,'#ac8064'],[2,14,28,6,'#d9bc91'],[4,16,24,2,'#f2d8b2'],[5,14,2,6,'#b58667'],[25,14,2,6,'#b58667']],
 lamp:[[12,26,12,3,'#e7bd7d'],[17,10,3,16,'#af825f'],[9,3,20,12,'#ffd485'],[11,2,16,3,'#fff0af'],[12,15,14,2,'#a87674']],
 cushion:[[3,15,26,12,'#b96999'],[5,12,22,12,'#f1a1c2'],[8,14,16,3,'#ffd1dd'],[6,26,20,2,'#704869']],
 desk:[[1,12,30,4,'#e6b38a'],[3,16,3,15,'#ab776b'],[26,16,3,15,'#ab776b'],[7,17,17,6,'#ba8777'],[13,19,5,1,'#f9d4a1'],[7,8,10,4,'#fff0ce'],[9,6,10,3,'#9acac7']],
 bookcase:[[2,1,28,30,'#9f6e67'],[5,4,22,10,'#443752'],[5,17,22,10,'#443752'],[6,6,4,8,'#f1b6c8'],[11,5,4,9,'#9ad3cb'],[16,7,4,7,'#f4d591'],[21,5,4,9,'#9ba6d8'],[7,20,4,7,'#b9d78f'],[13,19,4,8,'#ed9caa'],[19,21,5,6,'#91c5e0']],
 bed:[[0,7,3,23,'#9e7755'],[1,6,4,3,'#d6ad78'],[29,17,3,13,'#9e7755'],[3,14,26,13,'#e8d5b2'],[3,13,8,9,'#f9e8cb'],[4,14,6,2,'#fff4dc'],[11,14,18,13,'#a49abc'],[12,15,16,2,'#cbbdd8'],[25,18,3,9,'#857a9f'],[12,24,13,2,'#b8a9c9'],[3,27,26,3,'#aa815c'],[2,29,4,3,'#684f3e'],[26,29,4,3,'#684f3e']],
 art:[[2,2,28,28,'#d2a67d'],[5,5,22,22,'#343658'],[14,8,4,15,'#ffe59e'],[9,13,14,5,'#ffe59e']]
 };
 function homeIcon(id){if(id.startsWith('find:'))return iconSVG(id.slice(5));return '<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">'+(furniture[id]||[]).map(([x,y,w,h,color])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`).join('')+'</svg>';}
 function drawHeadDisplay(c,s,x,y,scale,frame){
  if(s.session||!s.heldItem)return;
  let top=WardrobeCatalog.headTop(s.equipped||[]);
  if(s.idleMood==='asleep'){const breath=.78+Math.round((Math.sin(frame*.18)+1)*1.5)*.025;top=27+(top-27)*breath;}
  const size=.46*scale;item(c,s.heldItem,x+13*scale-16*size,y+top*scale-32*size+scale,size);
 }
 function drawHomeItem(c,id,spot){
  const find=id.startsWith('find:'),definition=HomeCatalog.items.find(i=>i.id===id),scale=find?.85:definition.scale,foot=find?32:definition.foot,x=spot.x-16*scale,y=spot.y-foot*scale;
  if(id!=='art'&&id!=='rug')oval(c,spot.x-18*scale,spot.y-2,36*scale,5,'#322c2944',2);
  if(find){box(c,x+4*scale,spot.y,24*scale,3,'#b29674');box(c,x+6*scale,spot.y+3,20*scale,3,'#795f4d');item(c,id.slice(5),x,y,scale);}
  else{for(const [a,b,w,h,color] of furniture[id]||[])box(c,x+a*scale,y+b*scale,w*scale,h*scale,color);
   // Shared contact shadows, wood grain and highlights give furniture weight.
   if(['desk','bookcase','bed'].includes(id)){box(c,x+4*scale,spot.y-2,22*scale,2,'#634b42');box(c,x+6*scale,y+13*scale,8*scale,1,'#f3cfa0');}
   if(id==='rug'){for(let k=0;k<6;k++){box(c,x-2,y+12*scale+k*3,3,1,'#eac6ac');box(c,x+32*scale,y+12*scale+k*3,3,1,'#eac6ac');}}
  }
 }
 function chest(c,open){
  const x=119,y=220;oval(c,x-4,y+25,49,7,'#342b2b66',2);box(c,x,y+8,42,19,'#4d382e');box(c,x+2,y+9,38,16,'#956441');box(c,x+4,y+12,34,2,'#b28150');box(c,x+4,y+21,34,2,'#70492f');
  box(c,x+5,y+9,3,16,'#d5b37b');box(c,x+33,y+9,3,16,'#d5b37b');
  if(open){box(c,x-1,y-3,44,8,'#573d2c');box(c,x+2,y-6,38,7,'#b88450');box(c,x+5,y-5,32,2,'#e2b77a');box(c,x+3,y+6,36,5,'#302a2d');}
  else{box(c,x-2,y+1,46,10,'#5d412c');box(c,x,y-1,42,10,'#b98652');box(c,x+3,y-2,36,3,'#e0b57a');box(c,x+6,y,3,10,'#e3c592');box(c,x+33,y,3,10,'#e3c592');}
  box(c,x+18,y+9,7,8,'#eed194');box(c,x+20,y+11,3,3,'#775638');bounds.chest={x:x-4,y:y-4,w:50,h:36};
 }
 function renderHome(c,s,frame){
  const theme=HomeCatalog.themes.find(t=>t.id===s.home.theme)||HomeCatalog.themes[0],t=WorldClock.snapshot();box(c,0,0,384,288,'#252b35');
  // A round earthen burrow, cut out of layered soil with exposed roots.
  for(let row=0;row<18;row++)for(let col=0;col<24;col++){const r=random(col,row);box(c,col*16,row*16,16,16,r>.5?'#514538':'#4a3e35');if(r<.12)box(c,col*16+3,row*16+7,6,3,'#74634d');}
  oval(c,39,4,306,280,theme.trim,4);oval(c,47,11,290,266,tint(theme.wall,-.18),4);oval(c,56,20,272,250,theme.wall,4);
  c.save();c.clip(ovalPath(56,20,272,250,4));
  for(let i=0;i<26;i++){const xx=60+random(i,11)*260,yy=28+random(i,9)*178;box(c,xx,yy,6+random(i,13)*12,3,tint(theme.wall,i%2?.055:-.055));}
  // Curved roots hug the ceiling instead of a rectangular brick wall.
  for(let i=0;i<7;i++){const x=70+i*39,yy=30+Math.abs(i-3)*7;box(c,x,yy,3,22,'#695139');box(c,x+3,yy+19,10,3,'#695139');box(c,x+11,yy+21,3,12,'#695139');box(c,x,yy,1,17,'#bd9a6d');}
  // A small round opening reveals the same local sky as the mine surface.
  oval(c,166,58,54,54,'#4f4034',2);oval(c,170,61,46,47,'#d0ac7a',2);oval(c,174,65,38,39,t.sky,2);
  c.save();c.clip(ovalPath(174,65,38,39,2));cloud(c,169,87,t.cloud);if(t.period==='night')star(c,198,72,.85,'#fff0ae');else box(c,197,71,8,8,t.sun);
  if(theme.id==='rain')for(let i=0;i<6;i++)box(c,177+i*6,67+(i*13+frame*2)%34,1,4,'#c0dce6');c.restore();
  box(c,174,106,38,3,'#b18b61');
  // Floor and objects share a baseline and remain inside the round silhouette.
  box(c,54,205,276,65,theme.floor);for(let row=0;row<5;row++){const yy=208+row*14;box(c,54,yy,276,1,tint(theme.floor,-.15));for(let x=60+(row%2)*35;x<330;x+=70)box(c,x,yy,1,14,tint(theme.floor,-.1));}box(c,58,203,268,3,tint(theme.floor,.15));
  for(const key of ['floor','wall','left','right']){const spot=HomeCatalog.slots[key],id=s.home.slots[key];if(id)drawHomeItem(c,id,spot);if(s.homeEditing){const w=key==='floor'?70:key==='wall'?38:64,h=key==='floor'?20:key==='wall'?38:58,x=spot.x-w/2,y=spot.y-h,col=key===s.selectedSlot?'#ffe0a0':'#c4b798';for(let xx=x;xx<x+w;xx+=8){box(c,xx,y,4,1,col);box(c,xx,spot.y+3,4,1,col);}for(let yy=y;yy<spot.y;yy+=8){box(c,x,yy,1,4,col);box(c,x+w,yy,1,4,col);}}}
  const y=190-jump(s);mole(c,166,y,2,s.equipped,false,frame,s.profile?.color,s.idleMood);drawHeadDisplay(c,s,166,y,2,frame);bounds.homeCanvas={x:166,y:y-3,w:56,h:60};positionSpeech('homeSpeech',bounds.homeCanvas,384,288);chest(c,s.chestOpen);c.restore();
  // Small moss patches on the rim make the cave feel grown rather than built.
  for(const [x,y] of [[74,61],[304,66],[59,149],[316,153]]){box(c,x,y,9,3,'#829165');box(c,x+3,y+3,7,4,'#637953');}
 }
 function jump(s){if(s.session||!s.petAt||matchMedia('(prefers-reduced-motion: reduce)').matches)return 0;const t=(Date.now()-s.petAt)/850;return t>=0&&t<1?Math.round(Math.sin(t*Math.PI)*18):0;}
 function positionSpeech(id,b,w,h){const e=document.getElementById(id);if(e&&!e.hidden){e.style.left=((b.x+b.w/2)/w*100)+'%';e.style.top=(Math.max(5,b.y-3)/h*100)+'%';}}
 function celestial(c,t,camera=0){if(t.period==='night'){box(c,322,20-camera,18,18,t.sun);box(c,328,16-camera,10,26,t.sun);box(c,328,18-camera,12,17,t.sky);}else{const x=Math.round(30+Math.max(0,Math.min(14,t.hour-6))/14*290),y=(t.period==='day'?17:36)-camera;box(c,x,y,20,20,t.sun);box(c,x-3,y+4,26,12,t.sun);box(c,x+5,y-5,10,4,tint(t.sun,.2));box(c,x+5,y+22,10,3,t.sun);box(c,x-8,y+8,3,5,t.sun);box(c,x+27,y+8,3,5,t.sun);}}
 function renderSetup(c,s,frame){const t=WorldClock.snapshot();box(c,0,0,240,208,t.sky);if(t.period==='night'){for(let i=0;i<16;i++){const x=Math.floor(random(i,4)*230),y=Math.floor(random(i,9)*105);if(i%3===0)star(c,x,y,.5,'#fff3b4');else box(c,x,y,1,1,'#8e9edf');}box(c,196,22,12,17,t.sun);box(c,202,20,8,21,t.sun);box(c,203,21,9,15,t.sky);}else{box(c,184,25,20,20,t.sun);box(c,188,21,12,28,t.sun);}
  cloud(c,15,36,t.cloud);cloud(c,164,65,t.cloudBack);for(let x=0;x<240;x+=6){const h=20+Math.round(Math.sin(x*.05)*11+Math.sin(x*.11)*7);box(c,x,151-h,6,h,t.mountain);}box(c,0,149,240,5,t.grass);box(c,0,154,240,54,'#574664');for(let i=0;i<35;i++)box(c,Math.floor(random(i,2)*59)*4,160+Math.floor(random(i,8)*11)*4,4,2,i%2?'#82617f':'#6c5270');
  for(const x of [24,203]){box(c,x,100,5,49,'#806379');box(c,x-12,98,30,17,t.grassShadow);box(c,x-7,87,21,12,t.grass);box(c,x-3,80,13,9,tint(t.grass,.15));}box(c,72,151,96,4,'#c5a38b');box(c,77,155,86,6,'#8f6d74');mole(c,78,70,3,[],false,frame,s.draftColor||s.profile?.color);star(c,55,132,.5,t.sun);star(c,178,142,.5,t.sun);}
 function renderFriend(c,f,frame){box(c,0,0,96,88,tint(f.color,-.65));for(let i=0;i<6;i++)box(c,Math.floor(random(i,3)*90),Math.floor(random(i,5)*65),1,1,tint(f.color,.25));box(c,12,72,72,3,tint(f.color,-.2));box(c,17,75,62,3,tint(f.color,-.45));mole(c,22,18,2,f.equipped,f.status==='Studying',frame,f.color);}
 let getState,frame=0,last=0;
 function loop(now){if(now-last>120){last=now;frame++;if(getState){const s=getState(),f=matchMedia('(prefers-reduced-motion: reduce)').matches?0:frame;if(!document.getElementById('setupScreen').hidden)renderSetup(document.getElementById('setupCanvas').getContext('2d'),s,f);if(!document.getElementById('home').hidden)renderHome(document.getElementById('homeCanvas').getContext('2d'),s,f);if(!document.getElementById('focus').hidden&&!s.simpleView)renderMine(document.getElementById('miningCanvas').getContext('2d'),s,f);if(!document.getElementById('wardrobe').hidden)renderWardrobe(document.getElementById('wardrobeCanvas').getContext('2d'),s,f);if(!document.getElementById('companions').hidden)for(const friend of s.companions||[]){const canvas=document.getElementById('friend-'+friend.id);if(canvas)renderFriend(canvas.getContext('2d'),friend,f);}}}requestAnimationFrame(loop);}
 return {iconSVG,homeIcon,digMetrics,hitTest(id,x,y){const b=bounds[id];return !!b&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;},getBounds:id=>bounds[id]?{...bounds[id]}:null,init(get){getState=get;requestAnimationFrame(loop);}};
})();
