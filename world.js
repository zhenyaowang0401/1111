'use strict';
window.WorldClock=(()=>{
 let appearance='auto';try{const saved=localStorage.getItem('eumo-appearance');if(['auto','day','night'].includes(saved))appearance=saved;}catch{}
 const themes={
  morning:{label:'Morning',sky:'#b5d4cd',skyLow:'#e5e5b9',cloud:'#fff3d6',cloudBack:'#d6e3c7',mountain:'#8da373',grass:'#a6b954',grassShadow:'#617c41',sun:'#f1c85c',bg:'#e4e7c8'},
  day:{label:'Day',sky:'#88bdca',skyLow:'#c8dfce',cloud:'#fff8df',cloudBack:'#d9e7d8',mountain:'#789a6d',grass:'#9fb94e',grassShadow:'#587747',sun:'#f7ce58',bg:'#dce6d5'},
  evening:{label:'Evening',sky:'#557d80',skyLow:'#bec29d',cloud:'#dac8a0',cloudBack:'#91aa95',mountain:'#496e5b',grass:'#8e9c54',grassShadow:'#405d48',sun:'#e8b368',bg:'#274d4b'},
  night:{label:'Night',sky:'#526e91',skyLow:'#a7bdcf',cloud:'#e4e8e8',cloudBack:'#bccddd',mountain:'#617f98',grass:'#9eafb4',grassShadow:'#627d91',sun:'#f3e8ce',bg:'#8ba5c0'}
 };
 function snapshot(date=new Date()){
  const hour=date.getHours(),localPeriod=hour>=6&&hour<10?'morning':hour>=10&&hour<17?'day':hour>=17&&hour<19?'evening':'night';
  const period=appearance==='auto'?localPeriod:appearance;
  return {period,...themes[period],hour,time:`${String(hour).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`,iso:date.toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Device local time'};
 }
 function setAppearance(value){if(!['auto','day','night'].includes(value))return;appearance=value;try{localStorage.setItem('eumo-appearance',value);}catch{}window.dispatchEvent(new Event('eumo-appearance'));}
 return {snapshot,setAppearance,get appearance(){return appearance;}};
})();
