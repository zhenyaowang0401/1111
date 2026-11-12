/* One time-based route drives visible pickups and earned rewards. */
'use strict';
window.Journey=(()=>{
 const eligible=s=>!!s&&(s.demo||s.mode==='study'||s.mode==='work');
 const rate=s=>s.demo?3:30;
 function hash(text){let n=2166136261;for(const ch of text)n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;}
 function events(s){
  if(!eligible(s))return [];
  if(s.demo)return [{id:s.id+':find',at:9,kind:'find',material:s.rewardVersion!==2,index:hash(s.id)%4},{id:s.id+':star',at:15,kind:'star'}];
  const result=[],base=s.baseEligible||0;
  for(const [step,kind] of [[300,'star'],[600,'find']]){
   for(let n=Math.floor(base/step)+1;n*step<=base+s.plannedSeconds;n++)result.push({id:s.id+':'+kind+':'+n,at:n*step-base,kind,material:kind!=='find'||s.rewardVersion!==2||hash((s.rareSeed||'eumo')+':material:'+n)/4294967296<.4,index:kind==='find'?hash(String(n)+':loop-pet')%4:undefined});
  }
  return result.sort((a,b)=>a.at-b.at||a.kind.localeCompare(b.kind));
 }
 // Crossing the tool's route position is a swept collision: background and
 // on-screen progress collect the same uniquely identified objects.
 function pickups(s){return events(s).filter(e=>e.at<=(s.elapsed||0)+1e-7);}
 function rewards(s){const collected=pickups(s),finds=[0,0,0,0];for(const e of collected)if(e.kind==='find'&&e.material!==false)finds[e.index]++;return {stars:collected.filter(e=>e.kind==='star').length,finds,depth:eligible(s)?(s.elapsed||0)/rate(s):0,collected};}
 return {eligible,rate,events,pickups,rewards};
})();
