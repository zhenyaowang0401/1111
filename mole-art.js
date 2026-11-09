'use strict';
// Original integer-grid silhouette and equipment anchors, with the new palette.
window.MoleArt=(()=>{
 function tint(hex,amount){return '#'+hex.slice(1).match(/../g).map(v=>{const n=parseInt(v,16);return Math.round(amount>0?n+(255-n)*amount:n*(1+amount)).toString(16).padStart(2,'0');}).join('');}
 function paint(c,{color='#a9b4c6',dig=false,frame=0,mood='awake',sleepScale=1}={}){
  const ink='#28214c',fur=color,light=tint(color,.32),shadow=tint(color,-.23),belly='#fff1c8',paw='#ffb5a8';
  const r=(x,y,w,h,col)=>{const top=Math.round(27+(y-27)*sleepScale),bottom=Math.round(27+(y+h-27)*sleepScale);c.fillStyle=col;c.fillRect(x,top,w,Math.max(1,bottom-top));};
  // Preserve the first mole's head, torso and 2-pixel stepped contour exactly.
  r(7,5,12,2,ink);r(4,7,18,3,ink);r(2,10,22,13,ink);r(4,23,18,2,ink);
  r(4,9,18,13,fur);r(6,7,14,17,fur);r(4,11,18,9,fur);
  r(6,8,4,3,light);r(4,11,3,5,light);r(19,13,3,9,shadow);r(6,21,15,3,shadow);
  r(8,16,11,7,belly);r(10,15,7,9,belly);r(10,17,6,5,'#fff8df');
  const closed=!dig&&(mood==='asleep'||mood==='rest'||mood==='drowsy'&&frame%30>8||frame%42>=39);
  if(closed){r(8,12,2,1,ink);r(17,12,2,1,ink);}
  else{r(8,11,2,2,ink);r(17,11,2,2,ink);}
  r(6,15,3,2,shadow);r(18,15,3,2,shadow);r(12,13,2,2,'#e7473f');
  r(4,24,7,3,ink);r(16,24,7,3,ink);r(5,24,6,2,paw);r(16,24,6,2,paw);
  const arm=dig&&frame%2?2:0;
  r(1,17-arm,5,6,ink);r(2,17-arm,4,5,paw);r(2,21-arm,3,1,'#ed9389');
  r(21,17+arm,5,6,ink);r(21,17+arm,4,5,paw);r(22,21+arm,3,1,'#ed9389');
  return true;
 }
 function drawAvatar(canvas,color){
  const c=canvas.getContext('2d'),scale=Math.min(canvas.width/27,canvas.height/24);
  c.clearRect(0,0,canvas.width,canvas.height);c.save();c.imageSmoothingEnabled=false;
  c.translate((canvas.width-27*scale)/2,(canvas.height-22*scale)/2-5*scale);c.scale(scale,scale);paint(c,{color});c.restore();return true;
 }
 return {paint,drawAvatar,ready:true,landmarks:{left:9,right:18,eyeY:12,headY:5}};
})();
