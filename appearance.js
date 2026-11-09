'use strict';
(()=>{
 const trigger=document.getElementById('devicePeriod'),panel=document.getElementById('appearanceOptions'),options=[...panel.querySelectorAll('button')];
 function close(focus=false){panel.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();}
 function update(){const zh=EumoI18n.language==='zh';panel.setAttribute('aria-label',zh?'外观':'Appearance');for(const b of options){const k=b.dataset.appearance;b.textContent=(zh?{auto:'自动 · 设备时间',day:'日间',night:'夜间'}:{auto:'Auto · Device time',day:'Day',night:'Night'})[k];b.setAttribute('aria-pressed',String(k===WorldClock.appearance));}}
 trigger.addEventListener('click',()=>{update();panel.hidden=!panel.hidden;trigger.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)(options.find(b=>b.dataset.appearance===WorldClock.appearance)||options[0]).focus();});
 options.forEach(b=>b.addEventListener('click',()=>{WorldClock.setAppearance(b.dataset.appearance);update();close(true);}));
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.appearance-control'))close();});
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);}else if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();options[(options.indexOf(document.activeElement)+(e.key==='ArrowDown'?1:2))%3].focus();}});
 document.addEventListener('focusin',e=>{if(!e.target.closest('.appearance-control'))close();});
 window.addEventListener('eumo-language',update);window.addEventListener('eumo-appearance',update);update();
})();
