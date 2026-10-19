'use strict';
window.PetAudio=(()=>{
 let context,rainSource,rainGain,rainOn=false,volume=.45,petVoices=0;
 function ctx(){const C=window.AudioContext||window.webkitAudioContext;if(!C)throw Error('Audio unavailable');return context||(context=new C());}
 function buildRain(c){
  const rate=22050,seconds=24,length=rate*seconds,buffer=c.createBuffer(2,length,rate);
  for(let channel=0;channel<2;channel++){
   const data=buffer.getChannelData(channel);let low=0,slow=0;
   for(let i=0;i<length;i++){const white=Math.random()*2-1;low+=.22*(white-low);slow+=.012*(low-slow);data[i]=(low-slow)*.17;}
   // Many small, diffuse impacts with long, soft tails instead of a loud hiss.
   for(let drop=0;drop<seconds*32;drop++){
    const start=Math.floor(Math.random()*length),duration=Math.floor(rate*(.018+Math.random()*.075));
    const amplitude=.016+Math.random()*.052,freq=900+Math.random()*2300;let filtered=0;
    for(let i=0;i<duration;i++){const t=i/rate,envelope=Math.exp(-i/(duration*.2))*Math.min(1,i/12);filtered+=.45*((Math.random()*2-1)-filtered);const splash=filtered*.72+Math.sin(2*Math.PI*freq*t)*.18;data[(start+i)%length]+=splash*envelope*amplitude;}
   }
   // Wrap the noise bed smoothly at the loop boundary.
   const seam=Math.floor(rate*.12),left=data[length-seam],right=data[seam];
   for(let i=0;i<seam;i++){const t=i/seam;data[length-seam+i]=data[length-seam+i]*(1-t)+((left+right)*.5)*t;data[i]=((left+right)*.5)*(1-t)+data[i]*t;}
  }
  return buffer;
 }
 async function toggleRain(){const c=ctx();await c.resume();if(!rainSource){rainSource=c.createBufferSource();rainSource.buffer=buildRain(c);rainSource.loop=true;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=6200;rainGain=c.createGain();rainGain.gain.value=0;rainSource.connect(filter).connect(rainGain).connect(c.destination);rainSource.start();}rainOn=!rainOn;rainGain.gain.setTargetAtTime(rainOn?volume*1.7:0,c.currentTime,.25);return rainOn;}
 function setVolume(value){volume=Math.max(0,Math.min(1,value));if(rainGain&&rainOn)rainGain.gain.setTargetAtTime(volume*1.7,context.currentTime,.15);}
 async function pet(){const c=ctx();await c.resume();const at=c.currentTime,voice=c.createOscillator(),envelope=c.createGain();voice.type='sawtooth';voice.frequency.setValueAtTime(410,at);voice.frequency.exponentialRampToValueAtTime(760,at+.13);voice.frequency.exponentialRampToValueAtTime(640,at+.52);envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(.17,at+.04);envelope.gain.setValueAtTime(.12,at+.34);envelope.gain.exponentialRampToValueAtTime(.001,at+.68);envelope.connect(c.destination);
  // Formants approximate a small, high-pitched "yeee" vowel.
  for(const [frequency,q,gain] of [[340,4,.45],[2250,7,.8],[3000,9,.22]]){const formant=c.createBiquadFilter();formant.type='bandpass';formant.frequency.value=frequency;formant.Q.value=q;const level=c.createGain();level.gain.value=gain;voice.connect(formant).connect(level).connect(envelope);}
  voice.start(at);voice.stop(at+.7);voice.onended=()=>{voice.disconnect();envelope.disconnect();};petVoices++;
 }
 return {toggleRain,setVolume,pet,status:()=>({rainOn,volume,petVoices,state:context?.state||'uninitialized'})};
})();
