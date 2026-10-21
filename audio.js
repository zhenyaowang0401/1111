'use strict';
window.PetAudio=(()=>{
 let context,volume=.45,petVoices=0;
 const music=()=>document.getElementById('focusMusic');
 function ctx(){const C=window.AudioContext||window.webkitAudioContext;if(!C)throw Error('Audio unavailable');return context||(context=new C());}
 async function toggleMusic(){const player=music();player.volume=volume;if(player.paused)await player.play();else player.pause();return !player.paused;}
 function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));music().volume=volume;}
 async function pet(){
  const c=ctx();await c.resume();const at=c.currentTime,limiter=c.createDynamicsCompressor();
  limiter.threshold.value=-10;limiter.ratio.value=4;limiter.connect(c.destination);
  // Soft voiced syllables: fundamental, a quiet overtone and a breathy onset.
  // Different contours and rounded envelopes avoid two identical alert beeps.
  for(const [delay,pitch,duration] of [[0,350,.19],[.23,390,.23]]){
   const start=at+delay,end=start+duration,envelope=c.createGain(),filter=c.createBiquadFilter();
   filter.type='lowpass';filter.frequency.setValueAtTime(1450,start);filter.frequency.exponentialRampToValueAtTime(850,end);
   envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(.30,start+.026);envelope.gain.exponentialRampToValueAtTime(.19,start+.075);envelope.gain.exponentialRampToValueAtTime(.001,end);
   filter.connect(envelope).connect(limiter);
   for(const harmonic of [1,2]){
    const tone=c.createOscillator(),level=c.createGain();tone.type='sine';level.gain.value=harmonic===1?1:.18;
    tone.frequency.setValueAtTime(pitch*harmonic*.93,start);tone.frequency.exponentialRampToValueAtTime(pitch*harmonic,start+.025);tone.frequency.exponentialRampToValueAtTime(pitch*harmonic*.78,end);
    tone.connect(level).connect(filter);tone.start(start);tone.stop(end);
    tone.onended=()=>{tone.disconnect();level.disconnect();};
   }
   const noise=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=noise.getChannelData(0);
   for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.018*Math.exp(-i/(c.sampleRate*.035));
   const breath=c.createBufferSource();breath.buffer=noise;breath.connect(filter);breath.start(start);breath.stop(end);
   breath.onended=()=>{breath.disconnect();filter.disconnect();envelope.disconnect();if(delay)limiter.disconnect();};
  }
  petVoices++;
 }
 return {toggleMusic,setVolume,pet,status:()=>({musicOn:!music().paused,volume,petVoices,petPattern:'soft-doo-doo',petPeak:.30,state:context?.state||(!music().paused?'running':'uninitialized')})};
})();
