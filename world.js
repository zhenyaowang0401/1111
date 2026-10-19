'use strict';
window.WorldClock=(()=>{
 const themes={
  morning:{label:'Morning',sky:'#c2b9d6',cloud:'#f5d2c0',cloudBack:'#b6a9d1',mountain:'#8188aa',grass:'#b2d3ab',grassShadow:'#719c9e',sun:'#fff1ad',bg:'#252d47'},
  day:{label:'Day',sky:'#83b8d5',cloud:'#e0edf1',cloudBack:'#b7d5e6',mountain:'#6b8ba6',grass:'#a6d49e',grassShadow:'#659888',sun:'#fff0a1',bg:'#203548'},
  evening:{label:'Evening',sky:'#ae809b',cloud:'#e7aaa8',cloudBack:'#926f99',mountain:'#6a638b',grass:'#bcc2a2',grassShadow:'#798c91',sun:'#ffd49c',bg:'#302a44'},
  night:{label:'Night',sky:'#171c48',cloud:'#414797',cloudBack:'#373c87',mountain:'#363770',grass:'#9ac9b7',grassShadow:'#638c9e',sun:'#fff4bd',bg:'#141b43'}
 };
 function snapshot(date=new Date()){
  const hour=date.getHours(),period=hour>=6&&hour<10?'morning':hour>=10&&hour<17?'day':hour>=17&&hour<20?'evening':'night';
  return {period,...themes[period],hour,time:`${String(hour).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`,iso:date.toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Device local time'};
 }
 return {snapshot};
})();
