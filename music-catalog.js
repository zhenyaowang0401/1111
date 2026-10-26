/* Add local audio files here. Keep the catalog literal valid JSON for the offline builder. */
'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MusicCatalog=factory();})(typeof window==='undefined'?globalThis:window,()=>{
 const catalog = {
  "defaultTrack": "warm-focus",
  "categories": [
   {"id": "soft", "name": "Soft music", "description": "A softer place to focus", "icon": "note", "color": "#dbb6e8"},
   {"id": "groove", "name": "Groove", "description": "A little rhythm for your day", "icon": "rhythm", "color": "#e8aed2"},
   {"id": "noise", "name": "White noise", "description": "Room to breathe and settle in", "icon": "cloud", "color": "#a8d4d0"}
  ],
  "tracks": [
   {"id": "warm-focus", "category": "soft", "title": "Warm Focus", "description": "A familiar little focus companion", "src": "assets/audio/warm-focus-3.mp3", "durationSeconds": 194.52},
   {"id": "soft-next", "category": "soft", "title": "More soft music", "src": null},
   {"id": "groove-one", "category": "groove", "title": "Groove 01", "src": null},
   {"id": "groove-two", "category": "groove", "title": "Groove 02", "src": null},
   {"id": "noise-one", "category": "noise", "title": "White noise 01", "src": null},
   {"id": "noise-two", "category": "noise", "title": "White noise 02", "src": null}
  ]
 };
 return catalog;
});
