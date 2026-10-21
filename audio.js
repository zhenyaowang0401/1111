'use strict';
window.PetAudio=(()=>{
 let context,volume=.45,petVoices=0;
 const music=()=>document.getElementById('focusMusic');
 function ctx(){const C=window.AudioContext||window.webkitAudioContext;if(!C)throw Error('Audio unavailable');return context||(context=new C());}
 async function toggleMusic(){const player=music();player.volume=volume;if(player.paused)await player.play();else player.pause();return !player.paused;}
 function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));music().volume=volume;}
 async function pet(){
  const c=ctx();await c.resume();const at=c.currentTime;
  const limiter=c.createDynamicsCompressor();limiter.threshold.value=-10;limiter.ratio.value=4;limiter.connect(c.destination);
  // Two rounded, louder "doo-doo" notes, independent of background volume.
  for(const [delay,pitch] of [[0,360],[.21,430]]){
   const tone=c.createOscillator(),gain=c.createGain();tone.type='triangle';
   tone.frequency.setValueAtTime(pitch,at+delay);tone.frequency.exponentialRampToValueAtTime(pitch*.82,at+delay+.15);
   gain.gain.setValueAtTime(0,at+delay);gain.gain.linearRampToValueAtTime(.32,at+delay+.018);gain.gain.exponentialRampToValueAtTime(.001,at+delay+.17);
   tone.connect(gain).connect(limiter);tone.start(at+delay);tone.stop(at+delay+.18);
   tone.onended=()=>{tone.disconnect();gain.disconnect();if(delay)limiter.disconnect();};
  }
  petVoices++;
 }
 return {toggleMusic,setVolume,pet,status:()=>({musicOn:!music().paused,volume,petVoices,petPattern:'doo-doo',petPeak:.32,state:context?.state||(!music().paused?'running':'uninitialized')})};
})();
