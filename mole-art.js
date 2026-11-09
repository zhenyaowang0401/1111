'use strict';
// Original integer-grid silhouette and equipment anchors, with the new palette.
window.MoleArt=(()=>{
 function tint(hex,amount){return '#'+hex.slice(1).match(/../g).map(v=>{const n=parseInt(v,16);return Math.round(amount>0?n+(255-n)*amount:n*(1+amount)).toString(16).padStart(2,'0');}).join('');}
 function paint(c,{color='#a9b4c6',dig=false,frame=0,mood='awake',sleepScale=1}={}){
  const ink='#28214c',fur=color,light=tint(color,.20),shadow=tint(color,-.18),belly='#fff1c8',paw='#ffb5a8';
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
   // Connected lighting bands follow the silhouette, rather than cheek patches.
   const lit=x<spans[y][0]+4&&y<22,shaded=x>=20||y>=22;
   r(x,y,1,1,edge?ink:shaded?shadow:lit?light:fur);
  }
  r(8,16,11,7,belly);r(10,15,7,9,belly);r(10,17,6,5,'#fff8df');
  const closed=!dig&&(mood==='asleep'||mood==='rest'||mood==='drowsy'&&frame%30>8||frame%42>=39);
  if(closed){r(8,12,2,1,ink);r(17,12,2,1,ink);}
  else{r(8,11,2,2,ink);r(17,11,2,2,ink);}
  r(12,13,2,2,'#e7473f');
  // Three joined toes with stepped edges and discrete light-to-dark bands.
  // Pink contour avoids the old rectangular navy frame around each foot.
  function claw(x,y,foot=false){
   const rows=foot?['.######.','########','########','##.##.##','##.##.##']:['.######.','########','########','##.##.##'];
   const ramp=foot?['#df9291','#ffd1bd','#ffb5a8','#e69b94','#bc747d']:['#df9291','#ffd1bd','#f4aca0','#bc747d'];
   rows.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]==='#')r(x+i,y+j,1,1,(i===0||i===7)&&j<rows.length-1?'#cf8585':ramp[j]);});
  }
  claw(4,22,true);claw(15,22,true);
  const arm=dig&&frame%2?2:0;
  claw(0,17-arm);claw(19,17+arm);
  return true;
 }
 function drawAvatar(canvas,color){
  const c=canvas.getContext('2d'),scale=Math.min(canvas.width/27,canvas.height/24);
  c.clearRect(0,0,canvas.width,canvas.height);c.save();c.imageSmoothingEnabled=false;
  c.translate((canvas.width-27*scale)/2,(canvas.height-22*scale)/2-5*scale);c.scale(scale,scale);paint(c,{color});c.restore();return true;
 }
 return {paint,drawAvatar,ready:true,landmarks:{left:9,right:18,eyeY:12,headY:5}};
})();
