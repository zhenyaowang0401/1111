'use strict';
// User-supplied design, prepared as transparent front/right-facing poses.
window.MoleArt=(()=>{
 const image=new Image(),poses=[],cache=new Map();
 let landmarks={left:10.5,right:16.5,eyeY:10.5,headY:5};
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
  // Measure the two isolated dark eyes, excluding the outer silhouette.
  const face=poses[0],fg=face.getContext('2d'),fp=fg.getImageData(0,0,face.width,face.height).data,eyes=[];
  for(const [lo,hi] of [[.30,.47],[.53,.70]]){
   let sx=0,sy=0,n=0;
   for(let y=Math.floor(face.height*.20);y<face.height*.34;y++)for(let x=Math.floor(face.width*lo);x<face.width*hi;x++){
    const i=(y*face.width+x)*4;if(fp[i+3]>200&&Math.max(fp[i],fp[i+1],fp[i+2])<85){sx+=x;sy+=y;n++;}
   }
   if(n)eyes.push({x:sx/n/face.width,y:sy/n/face.height});
  }
  if(eyes.length===2){const width=Math.min(27,22*face.width/face.height),x=13.5-width/2;
   landmarks={left:x+eyes[0].x*width,right:x+eyes[1].x*width,eyeY:5+(eyes[0].y+eyes[1].y)*11,headY:5};}
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
  if(closed){const g=art.getContext('2d');for(const eyeX of [landmarks.left,landmarks.right]){
   const px=Math.floor((eyeX-x)/width*art.width),py=Math.floor((landmarks.eyeY-5)/22*art.height);
   const sample=g.getImageData(px,Math.max(0,py-Math.ceil(art.height*.07)),1,1).data;
   c.fillStyle=`rgb(${sample[0]},${sample[1]},${sample[2]})`;c.fillRect(eyeX-.9,27+(landmarks.eyeY-.9-27)*sleepScale,1.8,1.8*sleepScale);
   c.fillStyle='#25334b';c.fillRect(eyeX-.75,27+(landmarks.eyeY+.35-27)*sleepScale,1.5,.45*sleepScale);
  }}
  return true;
 }
 function drawAvatar(canvas,color){
  if(poses.length!==2)return false;
  const art=tinted(0,color),g=canvas.getContext('2d'),scale=Math.min(canvas.width/art.width,canvas.height/art.height);
  g.clearRect(0,0,canvas.width,canvas.height);g.imageSmoothingEnabled=false;
  g.drawImage(art,(canvas.width-art.width*scale)/2,(canvas.height-art.height*scale)/2,art.width*scale,art.height*scale);return true;
 }
 function fit(r,category,id){
  const center=(landmarks.left+landmarks.right)/2;
  let sx=.8,sy=.8,ox=13.5,oy=6,tx=center,ty=landmarks.headY+1;
  if(category==='glasses'){
   const spec={glasses:[9,18,12.5],roundglasses:[9,18,12],sunglasses:[8.5,18.5,12.5],squareglasses:[9,19,13],heartglasses:[9,19,12],starglasses:[9,19,12]};
   const [left,right,y]=spec[id]||spec.glasses;sx=(landmarks.right-landmarks.left)/(right-left);sy=Math.min(.7,sx);ox=(left+right)/2;oy=y;ty=landmarks.eyeY;
  }else if(category==='scarves'){sx=.72;sy=.72;oy=18;ty=landmarks.eyeY+3.5;}
  else if(category==='extras'){sx=.65;sy=.65;ox=23;oy=21;tx=19;ty=20.5;}
  return (x,y,w,h,color)=>r(tx+(x-ox)*sx,ty+(y-oy)*sy,w*sx,h*sy,color);
 }
 return {paint,drawAvatar,fit,hatTop:y=>landmarks.headY+1+(y-6)*.8,get landmarks(){return {...landmarks};},get ready(){return poses.length===2;}};
})();
