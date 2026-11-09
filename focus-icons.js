'use strict';
window.FocusIcons=(()=>{
 const paths={
 play:'<path fill="currentColor" d="M9 5 24 16 9 27Z"/>',
 pause:'<path fill="currentColor" d="M8 6h6v20H8zm10 0h6v20h-6z"/>',
 study:'<path d="M3 6h10l3 3 3-3h10v21H19l-3 2-3-2H3zM16 9v20M6 11h6M6 15h6M20 11h6M20 15h6"/>',
 work:'<path d="M11 8V4h10v4M3 9h26v19H3zM3 16h26M14 15h4v5h-4z"/>',
 rest:'<path d="M5 11h17v11l-4 4H9l-4-4zM22 12h5v8h-5M3 29h22M9 3v4M16 2v5"/>',
 sun:'<path fill="#e8bb54" stroke="none" d="M11 8h10v3h3v10h-3v3H11v-3H8V11h3zM14 1h4v4h-4zm0 26h4v4h-4zM1 14h4v4H1zm26 0h4v4h-4zM4 4h4v4H4zm20 0h4v4h-4zM4 24h4v4H4zm20 0h4v4h-4z"/>',
 moon:'<path fill="#f3d784" stroke="none" d="M17 2H9v3H6v3H3v16h3v3h3v3h15v-3h4v-5H17v-3h-4V9h4z"/>'
 };
 // Two distinct doorway poses inspired by the user's sketches.
 paths.depart='<path fill="#c6af80" d="M15 3h13v25H15z"/><path d="M15 3h13v25H15M25 15v3"/><path fill="#8e9daf" d="M3 27v-9l3-6 4-3h5l5 5v13z"/><path fill="#fff0c5" stroke="none" d="M7 16h2v8H7z"/><path fill="#f2b3a4" d="M18 18h6v4h-6z"/><path d="M1 28h29"/>';
 paths.return='<path fill="#c6af80" d="M2 3 12 6v22L2 25zM12 6l17-3v22l-17 3z"/><path d="M2 3 12 6v22L2 25zM12 6l17-3v22l-17 3z"/><path fill="#a9b4c6" d="M8 27V16l4-5h7l5 5v11z"/><path stroke="none" fill="#28214c" d="M11 17h2v2h-2zm8 0h2v2h-2z"/><path stroke="none" fill="#d86651" d="M15 20h3v2h-3z"/><path d="M26 24 23 10" stroke="#65855b"/><path fill="#d98e91" stroke="none" d="M21 4h4v3h3v4h-3v3h-4v-3h-3V7h3z"/><path fill="#f5dc87" stroke="none" d="M21 7h4v4h-4z"/>';
 function svg(id){return `<svg class="focus-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" shape-rendering="crispEdges" aria-hidden="true">${paths[id]||paths.study}</svg>`;}
 function set(el,id,label){if(el.dataset.icon!==id){el.innerHTML=svg(id);el.dataset.icon=id;}const text=window.EumoI18n?.t(label)||label;el.setAttribute('aria-label',text);el.title=text;}
 return {svg,set};
})();
