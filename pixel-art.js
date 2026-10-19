/* Original pixel sprites. All artwork is drawn locally on an integer grid. */
'use strict';
window.PixelArt=(()=>{
 const bounds={};
 const defaultColors={ink:'#28214c',pink:'#f9a6d5',light:'#ffdbec',shadow:'#c56bb0',fur:'#b784cf',furLight:'#d9a4e2',cyan:'#80e6eb',yellow:'#fff3a8'};
 function tint(hex,amount){const values=hex.slice(1).match(/.{2}/g).map(n=>parseInt(n,16));return '#'+values.map(v=>Math.round(amount>=0?v+(255-v)*amount:v*(1+amount)).toString(16).padStart(2,'0')).join('');}
 function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 function star(c,x,y,s=1,color='#fff3a8'){box(c,x+2*s,y,2*s,2*s,color);box(c,x,y+2*s,6*s,2*s,color);box(c,x+2*s,y+4*s,2*s,2*s,color);}
 function cloud(c,x,y,color){box(c,x+8,y,18,6,color);box(c,x+3,y+6,33,7,color);box(c,x,y+13,42,7,color);}
 function mole(c,x,y,scale=2,outfit=[],dig=false,frame=0,color='#b784cf'){const colors={...defaultColors,fur:color,furLight:tint(color,.32),shadow:tint(color,-.23)};const has=id=>Array.isArray(outfit)?outfit.includes(id):outfit===id;c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);const r=(a,b,w,h,col)=>box(c,a,b,w,h,col);const bob=dig?(frame%2):0;c.translate(0,bob);
 // The same earless, stepped head silhouette is used in every scene.
 r(7,5,12,2,colors.ink);r(4,7,18,3,colors.ink);r(2,10,22,13,colors.ink);r(4,23,18,2,colors.ink);r(4,9,18,13,colors.fur);r(6,7,14,17,colors.fur);r(4,11,18,9,colors.fur);r(6,8,4,3,colors.furLight);r(4,11,3,5,colors.furLight);r(19,13,3,9,colors.shadow);r(6,21,15,3,colors.shadow);
 r(8,16,11,7,colors.pink);r(10,15,7,9,colors.pink);r(10,17,6,5,colors.light);r(8,11,2,3,colors.ink);r(17,11,2,3,colors.ink);if(!dig&&frame%42>=39){r(8,11,2,3,colors.fur);r(17,11,2,3,colors.fur);r(8,13,3,1,colors.ink);r(16,13,3,1,colors.ink);}r(6,15,3,2,colors.shadow);r(18,15,3,2,colors.shadow);r(11,13,6,3,colors.pink);r(12,13,3,1,colors.light);r(13,17,2,1,colors.ink);
 r(4,24,7,3,colors.ink);r(16,24,7,3,colors.ink);r(5,24,6,2,colors.shadow);r(16,24,6,2,colors.shadow);
 const arm=dig&&frame%2?2:0;r(1,17-arm,5,6,colors.ink);r(2,17-arm,4,5,colors.furLight);r(2,21-arm,3,1,colors.light);r(21,17+arm,5,6,colors.ink);r(21,17+arm,4,5,colors.furLight);r(22,21+arm,3,1,colors.light);
 if(dig){const k=frame%2?2:0;r(23,15+k,2,14,'#e3b786');r(18,14+k,12,3,colors.ink);r(19,13+k,10,3,colors.cyan);r(26,15+k,4,3,'#9ab4e6');r(28,17+k,2,3,'#badaef');}
 if(has('hat')){r(6,1,14,5,colors.ink);r(8,-1,10,3,colors.ink);r(7,1,12,5,'#f2c776');r(9,0,8,2,'#ffe89c');r(4,6,19,3,colors.ink);r(5,6,17,2,'#cf9f5d');r(7,4,12,2,'#bb71af');}
 if(has('glasses')){r(6,10,6,1,colors.ink);r(6,10,1,6,colors.ink);r(6,15,6,1,colors.ink);r(11,10,1,6,colors.ink);r(15,10,6,1,colors.ink);r(15,10,1,6,colors.ink);r(15,15,6,1,colors.ink);r(20,10,1,6,colors.ink);r(12,11,3,1,colors.ink);r(7,11,2,1,'#b4f2ed');r(16,11,2,1,'#b4f2ed');}
 if(has('scarf')){r(5,18,17,3,'#69cac5');r(8,20,13,2,'#3e9eac');r(17,21,4,6,'#7ce5d4');r(17,25,4,1,'#c2ffdf');}
 if(has('star')){const sx=has('hat')?19:10;star(c,sx,-2,1,'#a76a62');star(c,sx,-3,1,colors.yellow);r(sx+2,-3,1,2,'#fffce0');}
 c.restore();}
 const itemRects={
 star:[[12,2,8,8,'#fff3a8'],[8,10,16,4,'#fff3a8'],[2,14,28,6,'#fff3a8'],[8,20,16,4,'#fff3a8'],[12,24,8,6,'#e6b76b'],[8,14,4,4,'#fffbe4'],[24,16,4,4,'#e6b76b']],
 mushroom:[[8,4,16,4,'#e880bd'],[4,8,24,4,'#f79ed0'],[2,12,28,8,'#e880bd'],[6,20,20,2,'#8e4c94'],[12,22,8,8,'#ffe9b8'],[8,10,4,4,'#fff0da'],[20,13,4,4,'#fff0da']],
 crystal:[[13,1,7,5,'#b4fffa'],[9,6,15,4,'#70d9ed'],[5,10,22,12,'#63b9e6'],[9,22,15,4,'#7a80d6'],[13,26,7,5,'#5e5eb0'],[11,7,5,15,'#98eff1'],[6,12,4,8,'#c1ffff']],
 fossil:[[8,4,16,4,'#d7b4f0'],[4,8,24,16,'#b28ccf'],[8,24,16,4,'#9071b4'],[10,10,12,3,'#f6dbec'],[10,13,3,8,'#f6dbec'],[10,20,12,3,'#f6dbec'],[19,16,3,5,'#f6dbec'],[16,16,6,3,'#f6dbec']],
 glasses:[[3,10,10,3,'#fff1b0'],[1,13,3,10,'#fff1b0'],[3,23,10,3,'#e1bd83'],[12,13,3,10,'#e1bd83'],[19,10,10,3,'#fff1b0'],[17,13,3,10,'#fff1b0'],[19,23,10,3,'#e1bd83'],[28,13,3,10,'#e1bd83'],[14,14,4,3,'#e1bd83'],[4,14,4,3,'#9eeae6'],[21,14,4,3,'#9eeae6']],
 hat:[[10,4,14,4,'#ffe49d'],[7,8,19,10,'#e7bd7d'],[7,17,19,4,'#c17eb8'],[2,21,28,4,'#d1a168'],[6,25,23,2,'#a67762']],
 scarf:[[5,7,23,4,'#9cf8df'],[3,11,26,6,'#72dfcb'],[5,17,23,4,'#4fb0bc'],[19,19,7,11,'#72dfcb'],[19,26,7,2,'#aaf7de']]
 };
 function iconSVG(id){const rects=itemRects[id]||itemRects.star;return '<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">'+rects.map(([x,y,w,h,col])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}"/>`).join('')+'</svg>';}
 function item(c,id,x,y,s=1){for(const [a,b,w,h,col] of itemRects[id]||itemRects.star)box(c,x+a*s,y+b*s,w*s,h*s,col);}
 function random(a,b){const z=Math.sin(a*127.1+b*311.7)*43758.5453;return z-Math.floor(z);}
 function digMetrics(s){const active=s.session;const elapsed=active?Math.max(0,active.plannedSeconds-s.remaining):0;const depth=active?Math.floor(elapsed/(active.demo?3:30)):0;const fraction=active?Math.min(1,elapsed/active.plannedSeconds):0;return {depth,fraction,worldDepth:(s.depth||0)+depth};}
 function renderMine(c,s,frame){const w=384,h=224,t=WorldClock.snapshot(),m=digMetrics(s),running=s.session?.status==='running';const end=131+m.worldDepth*6;const camera=Math.max(0,end-174);const ground=87-camera;box(c,0,0,w,h,t.sky);
 if(t.period==='night')for(let i=0;i<22;i++){let x=Math.floor(random(i,2)*w/2)*2,y=Math.floor(random(i,7)*80/2)*2-camera;if(y>-5&&y<ground){if(i%5===0)star(c,x,y,1,i%2?'#fff3a8':'#7ee6ec');else box(c,x,y,2,2,'#778bdb');}}
 if(ground>0){cloud(c,24,31-camera,t.cloud);cloud(c,284,15-camera,t.cloudBack);celestial(c,t,camera);
 // Distant pixel mountains and rolling terrain.
 for(let x=0;x<w;x+=8){const hh=10+Math.floor(Math.sin(x*.04)*8+Math.cos(x*.083)*5);box(c,x,ground-hh,8,hh,t.mountain);}box(c,0,ground-5,w,5,t.grass);box(c,0,ground,w,4,t.grassShadow);for(let x=0;x<w;x+=12)box(c,x,ground-7,4,4,x%24?t.grass:tint(t.grass,.2));}
 const start=Math.max(0,Math.floor((camera-90)/16));for(let row=start;row<Math.ceil((camera+h-87)/16);row++){const y=87+row*16-camera;const pal=row<5?['#745484','#684976','#795b8a']:row<17?['#5b487e','#60487f','#514371']:['#424476','#49477a','#3c3d6b'];for(let col=0;col<24;col++){const r=random(col,row);box(c,col*16,y,16,16,pal[Math.floor(r*3)]);box(c,col*16,y,16,2,'#92709822');if(r>.7)box(c,col*16+4,y+6,4+(r>.9?4:0),3,row<5?'#a0789e':'#8670a0');if(r<.12){box(c,col*16+8,y+5,4,4,'#b4a4cd');box(c,col*16+9,y+5,2,2,'#e0d5ee');}}}
 // Excavated shaft is real cleared terrain, not an animation overlay.
 for(let wy=87;wy<end+7;wy+=4){const d=(wy-131)/6;const cx=192+Math.round(Math.sin(Math.max(0,d)*.13)*3)*4;const sy=wy-camera;if(sy>h||sy<-8)continue;box(c,cx-37,sy,74,5,'#24203f');box(c,cx-32,sy,64,5,'#1c1b37');box(c,cx-39,sy,3,5,'#aa799b');box(c,cx+36,sy,3,5,'#4e365c');box(c,cx-22,sy,2,4,'#ad8a7e');box(c,cx-10,sy,2,4,'#ad8a7e');if(wy%16===7)box(c,cx-23,sy,15,2,'#e0b490');}
 // Buried objects flank the shaft; deeper layers reveal new discoveries.
 for(let i=Math.floor(Math.max(0,camera-100)/95);i<Math.ceil((camera+h)/95);i++){const yy=147+i*95-camera;const xx=i%2?95:270;const id=['star','mushroom','crystal','fossil'][i%4];if(yy>-36&&yy<h){box(c,xx-5,yy-5,42,40,'#392b57');item(c,id,xx,yy,1);if(running&&frame%12<6)star(c,xx+34,yy+4,.5,'#fff3a8');}}
 if(ground>-35){ // Surface base camp.
 box(c,45,ground-31,2,26,'#b58a91');box(c,47,ground-32,28,14,'#fa9ccc');box(c,51,ground-28,15,2,'#fff0d7');box(c,64,ground-26,4,4,'#fff0d7');box(c,36,ground-4,25,4,'#42526a');
 for(let i=0;i<3;i++){box(c,310+i*13,ground-13-i%2*5,3,13+i%2*5,'#619fa5');box(c,306+i*13,ground-15-i%2*5,11,5,'#a2dcc7');}box(c,82,ground-12,24,12,'#bc8e79');box(c,84,ground-15,20,3,'#e7b79a');box(c,91,ground-13,4,13,'#4c395b');}
 const cx=192+Math.round(Math.sin(Math.max(0,m.worldDepth)*.13)*3)*4;const my=end-camera-43-jump(s);box(c,cx-22,end-camera+7,48,4,'#13162d');mole(c,cx-25,my,2,s.equipped,running,frame,s.profile?.color);bounds.miningCanvas={x:cx-25,y:my-9,w:60,h:64};positionSpeech('petSpeech',bounds.miningCanvas,384,224);
 if(running){for(let i=0;i<5;i++){const k=(frame+i*3)%12;const dir=i%2?1:-1;const xx=cx+dir*(14+k*3),yy=end-camera-5-Math.floor(Math.sin(k/12*Math.PI)*18);box(c,xx,yy,3+(i%2)*2,3,'#c68aab');}if(frame%16<3)star(c,cx+32,my+26,.6,'#fff2b4');}
 // A subtle CRT edge; no blurry resampling.
 box(c,0,h-2,w,2,'#0c122f');}
 function renderWardrobe(c,s,frame){const t=WorldClock.snapshot();box(c,0,0,192,160,t.sky);if(t.period!=='night'){cloud(c,8,24,t.cloud);cloud(c,142,13,t.cloudBack);}if(t.period==='night')for(let i=0;i<15;i++){const x=Math.floor(random(i,1)*186),y=Math.floor(random(i,6)*116);if(i%4===0)star(c,x,y,.5,'#7c8bd2');else box(c,x,y,1,1,'#6775ae');}box(c,20,116,152,5,'#51447d');box(c,26,121,140,9,'#393361');box(c,32,130,128,5,'#27264d');box(c,18,116,4,5,'#a17cb7');box(c,170,116,4,5,'#a17cb7');mole(c,57,32-jump(s),3,s.equipped,false,frame,s.profile?.color);bounds.wardrobeCanvas={x:57,y:23-jump(s),w:87,h:94};positionSpeech('wardrobeSpeech',bounds.wardrobeCanvas,192,160);star(c,28,55,1,'#fff0a9');star(c,151,34,.5,'#f6a6d2');}
 function jump(s){if(s.session||!s.petAt||matchMedia('(prefers-reduced-motion: reduce)').matches)return 0;const t=(Date.now()-s.petAt)/850;return t>=0&&t<1?Math.round(Math.sin(t*Math.PI)*18):0;}
 function positionSpeech(id,b,w,h){const e=document.getElementById(id);if(e&&!e.hidden){e.style.left=((b.x+b.w/2)/w*100)+'%';e.style.top=(Math.max(5,b.y-3)/h*100)+'%';}}
 function celestial(c,t,camera=0){if(t.period==='night'){box(c,322,20-camera,18,18,t.sun);box(c,328,16-camera,10,26,t.sun);box(c,328,18-camera,12,17,t.sky);}else{const x=Math.round(30+Math.max(0,Math.min(14,t.hour-6))/14*290),y=(t.period==='day'?17:36)-camera;box(c,x,y,20,20,t.sun);box(c,x-3,y+4,26,12,t.sun);box(c,x+5,y-5,10,4,tint(t.sun,.2));box(c,x+5,y+22,10,3,t.sun);box(c,x-8,y+8,3,5,t.sun);box(c,x+27,y+8,3,5,t.sun);}}
 function renderSetup(c,s,frame){const t=WorldClock.snapshot();box(c,0,0,240,208,t.sky);if(t.period==='night'){for(let i=0;i<16;i++){const x=Math.floor(random(i,4)*230),y=Math.floor(random(i,9)*105);if(i%3===0)star(c,x,y,.5,'#fff3b4');else box(c,x,y,1,1,'#8e9edf');}box(c,196,22,12,17,t.sun);box(c,202,20,8,21,t.sun);box(c,203,21,9,15,t.sky);}else{box(c,184,25,20,20,t.sun);box(c,188,21,12,28,t.sun);}
  cloud(c,15,36,t.cloud);cloud(c,164,65,t.cloudBack);for(let x=0;x<240;x+=6){const h=20+Math.round(Math.sin(x*.05)*11+Math.sin(x*.11)*7);box(c,x,151-h,6,h,t.mountain);}box(c,0,149,240,5,t.grass);box(c,0,154,240,54,'#574664');for(let i=0;i<35;i++)box(c,Math.floor(random(i,2)*59)*4,160+Math.floor(random(i,8)*11)*4,4,2,i%2?'#82617f':'#6c5270');
  for(const x of [24,203]){box(c,x,100,5,49,'#806379');box(c,x-12,98,30,17,t.grassShadow);box(c,x-7,87,21,12,t.grass);box(c,x-3,80,13,9,tint(t.grass,.15));}box(c,72,151,96,4,'#c5a38b');box(c,77,155,86,6,'#8f6d74');mole(c,78,70,3,[],false,frame,s.draftColor||s.profile?.color);star(c,55,132,.5,t.sun);star(c,178,142,.5,t.sun);}
 function renderFriend(c,f,frame){box(c,0,0,96,88,tint(f.color,-.65));for(let i=0;i<6;i++)box(c,Math.floor(random(i,3)*90),Math.floor(random(i,5)*65),1,1,tint(f.color,.25));box(c,12,72,72,3,tint(f.color,-.2));box(c,17,75,62,3,tint(f.color,-.45));mole(c,22,18,2,f.equipped,f.status==='Studying',frame,f.color);}
 let getState,frame=0,last=0;
 function loop(now){if(now-last>120){last=now;frame++;if(getState){const s=getState(),f=matchMedia('(prefers-reduced-motion: reduce)').matches?0:frame;if(!document.getElementById('setupScreen').hidden)renderSetup(document.getElementById('setupCanvas').getContext('2d'),s,f);if(!document.getElementById('focus').hidden)renderMine(document.getElementById('miningCanvas').getContext('2d'),s,f);if(!document.getElementById('wardrobe').hidden)renderWardrobe(document.getElementById('wardrobeCanvas').getContext('2d'),s,f);if(!document.getElementById('companions').hidden)for(const friend of s.companions||[]){const canvas=document.getElementById('friend-'+friend.id);if(canvas)renderFriend(canvas.getContext('2d'),friend,f);}}}requestAnimationFrame(loop);}
 return {iconSVG,digMetrics,hitTest(id,x,y){const b=bounds[id];return !!b&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;},getBounds:id=>bounds[id]?{...bounds[id]}:null,init(get){getState=get;requestAnimationFrame(loop);}};
})();
