'use strict';
window.WorldClock=(()=>{
 const themes={
  morning:{label:'Morning',sky:'#b5d4cd',skyLow:'#e5e5b9',cloud:'#fff3d6',cloudBack:'#d6e3c7',mountain:'#8da373',grass:'#a6b954',grassShadow:'#617c41',sun:'#f1c85c',bg:'#e4e7c8'},
  day:{label:'Day',sky:'#88bdca',skyLow:'#c8dfce',cloud:'#fff8df',cloudBack:'#d9e7d8',mountain:'#789a6d',grass:'#9fb94e',grassShadow:'#587747',sun:'#f7ce58',bg:'#dce6d5'},
  evening:{label:'Evening',sky:'#557d80',skyLow:'#bec29d',cloud:'#dac8a0',cloudBack:'#91aa95',mountain:'#496e5b',grass:'#8e9c54',grassShadow:'#405d48',sun:'#e8b368',bg:'#274d4b'},
  night:{label:'Night',sky:'#174e5c',skyLow:'#28696b',cloud:'#387c7e',cloudBack:'#296569',mountain:'#254f46',grass:'#68894a',grassShadow:'#34583f',sun:'#f6d46c',bg:'#14383c'}
 };
 function snapshot(date=new Date()){
  const hour=date.getHours(),period=hour>=6&&hour<10?'morning':hour>=10&&hour<17?'day':hour>=17&&hour<20?'evening':'night';
  return {period,...themes[period],hour,time:`${String(hour).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`,iso:date.toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Device local time'};
 }
 return {snapshot};
})();
