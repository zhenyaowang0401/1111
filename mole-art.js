'use strict';
// Original integer-grid silhouette and equipment anchors, with the new palette.
window.MoleArt=(()=>{
 function tint(hex,amount){return '#'+hex.slice(1).match(/../g).map(v=>{const n=parseInt(v,16);return Math.round(amount>0?n+(255-n)*amount:n*(1+amount)).toString(16).padStart(2,'0');}).join('');}
 function paint(c,{color='#a9b4c6',dig=false,frame=0,mood='awake',sleepScale=1}={}){
  const ink='#28214c',fur=color,light=tint(color,.32),shadow=tint(color,-.23),belly='#fff1c8',paw='#ffb5a8';
  const r=(x,y,w,h,col)=>{const top=Math.round(27+(y-27)*sleepScale),bottom=Math.round(27+(y+h-27)*sleepScale);c.fillStyle=col;c.fillRect(x,top,w,Math.max(1,bottom-top));};
  // Low, pointed tail sits behind the body and feet.
  r(4,21,4,1,ink);r(2,22,6,1,ink);r(1,23,7,1,ink);r(0,24,8,1,ink);
  r(2,23,6,1,shadow);r(1,24,7,1,shadow);r(0,25,8,1,ink);
  // One logical pixel of ink around a connected stepped silhouette.
  // Head height, eye positions and equipment anchors stay on the original grid.
  const spans=[];
  for(let y=5;y<=24;y++)spans[y]=y===5?[7,19]:y===6?[5,21]:y<10?[4,22]:y<23?[2,24]:y===23?[3,23]:[4,22];
  const inside=(x,y)=>spans[y]&&x>=spans[y][0]&&x<spans[y][1];
  for(let y=5;y<=24;y++)for(let x=spans[y][0];x<spans[y][1];x++){
   const edge=!inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1);
   r(x,y,1,1,edge?ink:fur);
  }
  r(6,8,4,3,light);r(4,11,3,5,light);r(19,13,3,9,shadow);r(6,21,15,3,shadow);
  r(8,16,11,7,belly);r(10,15,7,9,belly);r(10,17,6,5,'#fff8df');
  const closed=!dig&&(mood==='asleep'||mood==='rest'||mood==='drowsy'&&frame%30>8||frame%42>=39);
  if(closed){r(8,12,2,1,ink);r(17,12,2,1,ink);}
  else{r(8,11,2,2,ink);r(17,11,2,2,ink);}
  r(6,15,3,2,shadow);r(18,15,3,2,shadow);r(12,13,2,2,'#e7473f');
  r(4,23,7,4,ink);r(16,23,7,4,ink);r(5,24,5,2,paw);r(17,24,5,2,paw);
  const arm=dig&&frame%2?2:0;
  // Flat mitten paws: seven pixels wide, four high, with a one-pixel rim.
  function hand(x,y){r(x+1,y,5,1,ink);r(x,y+1,7,2,ink);r(x+1,y+3,5,1,ink);r(x+1,y+1,5,2,paw);r(x+2,y+2,3,1,'#ed9389');}
  hand(0,18-arm);hand(20,18+arm);
  return true;
 }
 function drawAvatar(canvas,color){
  const c=canvas.getContext('2d'),scale=Math.min(canvas.width/27,canvas.height/24);
  c.clearRect(0,0,canvas.width,canvas.height);c.save();c.imageSmoothingEnabled=false;
  c.translate((canvas.width-27*scale)/2,(canvas.height-22*scale)/2-5*scale);c.scale(scale,scale);paint(c,{color});c.restore();return true;
 }
 return {paint,drawAvatar,ready:true,landmarks:{left:9,right:18,eyeY:12,headY:5}};
})();
