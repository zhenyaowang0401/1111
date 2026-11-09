'use strict';
// User-supplied design, prepared as transparent front/right-facing poses.
window.MoleArt=(()=>{
 const image=new Image(),poses=[],cache=new Map();
 image.onload=()=>{
  const sheet=document.createElement('canvas');sheet.width=image.width;sheet.height=image.height;
  const g=sheet.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
  const pixels=g.getImageData(0,0,sheet.width,sheet.height).data;
  for(let pose=0;pose<2;pose++){
   const from=Math.floor(sheet.width*pose/2),to=Math.floor(sheet.width*(pose+1)/2);
   let x0=to,y0=sheet.height,x1=from,y1=0;
   for(let y=0;y<sheet.height;y++)for(let x=from;x<to;x++)if(pixels[(y*sheet.width+x)*4+3]>100){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   const canvas=document.createElement('canvas');canvas.width=x1-x0+1;canvas.height=y1-y0+1;
   canvas.getContext('2d').drawImage(sheet,x0,y0,canvas.width,canvas.height,0,0,canvas.width,canvas.height);poses.push(canvas);
  }
  window.dispatchEvent(new Event('mole-art-ready'));
 };
 image.src='assets/characters/user-mole.png';
 function tinted(pose,color){
  const original=poses[pose];if(!color||color.toLowerCase()==='#a9b4c6')return original;
  const key=pose+color;if(cache.has(key))return cache.get(key);
  const canvas=document.createElement('canvas');canvas.width=original.width;canvas.height=original.height;
  const g=canvas.getContext('2d');g.drawImage(original,0,0);const data=g.getImageData(0,0,canvas.width,canvas.height),p=data.data;
  const rgb=color.slice(1).match(/../g).map(v=>parseInt(v,16));
  for(let i=0;i<p.length;i+=4){const [r,g,b]=[p[i],p[i+1],p[i+2]];
   // Only blue-grey fur changes; ink, red nose, cream belly and pink paws stay intact.
   if(p[i+3]>0&&r>65&&b>r+8&&b>g+4&&Math.abs(r-g)<35){const light=(r+g+b)/3/190;
    for(let k=0;k<3;k++)p[i+k]=Math.min(255,Math.round(rgb[k]*light));}
  }
  g.putImageData(data,0,0);if(cache.size>=32)cache.clear();cache.set(key,canvas);return canvas;
 }
 function paint(c,{color,dig,frame,mood,sleepScale,front}){
  if(poses.length!==2)return false;
  const pose=dig&&!front?1:0,art=tinted(pose,color),height=22*sleepScale,width=Math.min(27,22*art.width/art.height),x=13.5-width/2,y=27-height;
  c.imageSmoothingEnabled=false;c.drawImage(art,x,y,width,height);
  const closed=!dig&&(mood==='asleep'||mood==='rest'||mood==='drowsy'&&frame%30>8||frame%42>=39);
  if(closed){const g=art.getContext('2d');for(const eye of [.39,.614]){
   const px=Math.floor(eye*art.width),py=Math.floor(.235*art.height),sample=g.getImageData(px,Math.max(0,py-10),1,1).data;
   c.fillStyle=`rgb(${sample[0]},${sample[1]},${sample[2]})`;c.fillRect(x+(eye-.026)*width,y+.212*height,.056*width,.075*height);
   c.fillStyle='#25334b';c.fillRect(x+(eye-.022)*width,y+.26*height,.045*width,.025*height);
  }}
  return true;
 }
 function drawAvatar(canvas,color){
  if(poses.length!==2)return false;
  const art=tinted(0,color),g=canvas.getContext('2d'),scale=Math.min(canvas.width/art.width,canvas.height/art.height);
  g.clearRect(0,0,canvas.width,canvas.height);g.imageSmoothingEnabled=false;
  g.drawImage(art,(canvas.width-art.width*scale)/2,(canvas.height-art.height*scale)/2,art.width*scale,art.height*scale);return true;
 }
 return {paint,drawAvatar,get ready(){return poses.length===2;}};
})();
