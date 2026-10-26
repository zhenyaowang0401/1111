/* One audio element powers both the compact player and the music room. */
'use strict';
window.MusicLibrary=(()=>{
 const $=id=>document.getElementById(id);
 let onChange=()=>{},onError=()=>{},category='soft',busy=false,error='',initialized=false;
 const player=()=>$('focusMusic');
 const track=()=>MusicCatalog.tracks.find(t=>t.id===PetAudio.status().trackId);
 const group=id=>MusicCatalog.categories.find(c=>c.id===id);
 const playable=t=>!!t&&typeof t.src==='string'&&!!t.src.trim();
 const time=n=>Number.isFinite(n)&&n>=0?`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`:'–:––';
 function persist(){const s=PetAudio.status();onChange({musicTrack:s.trackId,musicRepeat:s.repeat,musicVolume:s.volume});}
 function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS(svg.namespaceURI,'use');use.setAttribute('href','#i-'+name);svg.setAttribute('aria-hidden','true');svg.append(use);return svg;}
 function updateTime(){
  const p=player(),duration=Number.isFinite(p.duration)?p.duration:null;
  $('musicElapsed').textContent=time(p.currentTime);$('musicDuration').textContent=time(duration??track()?.durationSeconds);
  $('musicSeek').disabled=!duration||!p.seekable.length||p.seekable.end(p.seekable.length-1)<=0||!!p.error;
  $('musicSeek').value=duration?Math.round(p.currentTime/duration*1000):0;
  $('musicSeek').setAttribute('aria-valuetext',time(p.currentTime)+' of '+time(duration??track()?.durationSeconds));
 }
 function update(){
  if(!initialized)return;
  const s=PetAudio.status(),t=track(),g=group(t?.category),playing=s.musicOn;
  $('soundButton').setAttribute('aria-pressed',String(playing));$('soundButton').setAttribute('aria-label',playing?'Pause music':'Play music');
  $('musicPlayButton').setAttribute('aria-pressed',String(playing));$('musicPlayButton').setAttribute('aria-label',playing?'Pause music':'Play music');$('musicPlayIcon').setAttribute('href',playing?'#i-pause':'#i-play');
  $('musicMiniTitle').textContent=$('musicNowTitle').textContent=t?.title||'Choose a sound';$('musicNowCategory').textContent=g?.name||'Music library';
  const label=error?'Unavailable':busy?'Loading…':playing?'Playing':'Paused';
  $('musicPlaybackState').textContent=label;$('musicMiniState').textContent=label+' · '+(g?.name||'Music');
  $('musicMiniPlayer').classList.toggle('is-playing',playing);$('musicDialog').classList.toggle('is-playing',playing);
  for(const id of ['soundButton','musicPlayButton'])$(id).disabled=busy||!playable(t);
  const multiple=PetAudio.tracks().length>1;
  for(const id of ['musicPrevious','musicNext'])$(id).disabled=busy||!multiple;
  for(const button of $('musicTracks').querySelectorAll('[data-music-track]')){const ready=playable(MusicCatalog.tracks.find(t=>t.id===button.dataset.musicTrack)),selected=ready&&button.dataset.musicTrack===s.trackId;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));button.disabled=busy||!ready;const state=button.querySelector('.music-track-state');if(state)state.textContent=!ready?'Not added yet':selected?(playing?'Playing':'Selected'):'Play track';}
  $('musicRepeat').textContent=s.repeat==='one'?'Repeat one':'Play all';$('musicRepeat').setAttribute('aria-pressed',String(s.repeat==='one'));$('musicRepeat').setAttribute('aria-label',s.repeat==='one'?'Repeat one track':'Play all tracks');
  for(const id of ['musicVolume','musicLibraryVolume'])$(id).value=Math.round(s.volume*100);
  $('musicMessage').textContent=error||'A little soundtrack for whatever you are working on.';$('musicMessage').classList.toggle('has-error',!!error);
  updateTime();
 }
 function renderShelf(){
  const current=group(category)||MusicCatalog.categories[0];category=current.id;
  $('musicCategories').replaceChildren();
  for(const c of MusicCatalog.categories){
   const button=document.createElement('button');button.type='button';button.dataset.musicCategory=c.id;button.className='music-category';button.style.setProperty('--category-color',c.color);button.setAttribute('aria-pressed',String(c.id===category));
   const name=document.createElement('strong'),count=document.createElement('small');name.textContent=c.name;const n=MusicCatalog.tracks.filter(t=>t.category===c.id&&playable(t)).length;count.textContent=n?`${n} track${n===1?'':'s'}`:'Coming soon';button.append(icon(c.icon),name,count);$('musicCategories').append(button);
  }
  const tracks=MusicCatalog.tracks.filter(t=>t.category===category),count=tracks.filter(playable).length;
  $('musicCategoryTitle').textContent=current.name;$('musicCategoryCount').textContent=count?`${count} ready to play`:'New sounds are on their way';$('musicTracks').replaceChildren();
  for(const t of tracks){
   const ready=playable(t),button=document.createElement('button');button.type='button';button.className='music-track'+(ready?'':' coming-soon');button.disabled=!ready;button.dataset.musicTrack=t.id;button.setAttribute('aria-label',t.title+(ready?' — play track':' — coming soon'));button.setAttribute('aria-pressed','false');
   const art=document.createElement('span');art.className='music-track-art';art.style.setProperty('--category-color',current.color);art.append(icon(ready?'disc':current.icon));
   const copy=document.createElement('span');copy.className='music-track-copy';const title=document.createElement('strong'),info=document.createElement('small');title.textContent=t.title;info.textContent=ready?(t.description||current.description):'Coming soon';copy.append(title,info);
   const state=document.createElement('span');state.className='music-track-state';state.textContent=ready?'Play track':'Not added yet';button.append(art,copy,state);$('musicTracks').append(button);
  }
  update();
 }
 async function action(fn){
  if(busy)return;busy=true;error='';update();
  try{const pending=fn();persist();update();await pending;}
  catch(e){error='This sound could not play. Try again or choose another track.';onError('Music could not play. Try again.');}
  finally{busy=false;persist();update();}
 }
 function open(){renderShelf();$('musicDialog').showModal();}
 function init(options={}){
  onChange=options.onChange||onChange;onError=options.onError||onError;
  const selected=PetAudio.tracks().find(t=>t.id===options.trackId)||PetAudio.tracks().find(t=>t.id===MusicCatalog.defaultTrack)||PetAudio.tracks()[0];
  if(selected){PetAudio.selectTrack(selected.id).catch(()=>{});category=selected.category;}
  PetAudio.setVolume(options.volume??.45);PetAudio.setRepeat(options.repeat);initialized=true;
  $('openMusicLibrary').addEventListener('click',open);$('musicMiniPlayer').addEventListener('click',open);$('closeMusicLibrary').addEventListener('click',()=>$('musicDialog').close());
  for(const id of ['soundButton','musicPlayButton'])$(id).addEventListener('click',()=>action(()=>PetAudio.toggleMusic()));
  for(const [id,direction] of [['musicPrevious',-1],['musicNext',1]])$(id).addEventListener('click',()=>action(()=>PetAudio.stepTrack(direction)));
  $('musicRepeat').addEventListener('click',()=>{PetAudio.setRepeat(PetAudio.status().repeat==='one'?'all':'one');persist();update();});
  for(const id of ['musicVolume','musicLibraryVolume'])$(id).addEventListener('input',e=>{PetAudio.setVolume(Number(e.target.value)/100);persist();update();});
  $('musicSeek').addEventListener('input',e=>{if(Number.isFinite(player().duration)&&player().duration>0)player().currentTime=Number(e.target.value)/1000*player().duration;});
  $('musicCategories').addEventListener('click',e=>{const button=e.target.closest('[data-music-category]');if(button){category=button.dataset.musicCategory;renderShelf();}});
  $('musicTracks').addEventListener('click',e=>{const button=e.target.closest('[data-music-track]');if(button&&!button.disabled)action(()=>PetAudio.selectTrack(button.dataset.musicTrack,true));});
  for(const event of ['play','pause','loadedmetadata','durationchange','emptied'])player().addEventListener(event,update);
  player().addEventListener('timeupdate',updateTime);
  for(const event of ['progress','canplay','seeked'])player().addEventListener(event,updateTime);
  player().addEventListener('error',()=>{error='This sound could not load. Choose another track or try again.';update();});
  player().addEventListener('ended',()=>{if(PetAudio.status().repeat==='all')action(()=>PetAudio.stepTrack(1,true));else update();});
  renderShelf();persist();
 }
 return {init,open};
})();
