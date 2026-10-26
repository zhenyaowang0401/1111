/* Friend identity is an HttpOnly cookie. Demo moles never become live profiles. */
'use strict';
window.FriendsClient=(()=>{
 const PREF='eumo-friends-preferences-v1',UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i,$=id=>document.getElementById(id);
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clamp=(n,max=100000000)=>Math.max(0,Math.min(max,Math.floor(Number(n)||0)));
 const duration=s=>s<60?`${clamp(s)}s`:s<3600?`${Math.floor(s/60)}m`:`${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m`;
 const date=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 let read,model=null,busy=false,unavailable=false,message='',connectionError='',goal=120,enabled=false,players=[],expanded=new Set(),removeTarget=null,timer,baseServer=0,basePerformance=0,lastAction=0;
 const labels={studying:'Studying',working:'Working',paused:'Paused',break:'On a break',demo:'Trying a demo',idle:'Idle',drowsy:'Drowsy',sleeping:'Sleeping'};
 const notices={REQUEST_SENT:'Request sent. Your friend can accept it with their code window.',REQUEST_PENDING:'Your request is already waiting for an answer.',INCOMING_REQUEST:'This friend already sent you a request. Accept it below.',ALREADY_FRIENDS:'You are already friends.',FRIEND_ADDED:'Friend added. You can now see each other’s status.',FRIEND_REMOVED:'Friend removed. You no longer share status.',REQUEST_CLOSED:'Request closed.'};
 const errors={FRIENDS_NOT_CONFIGURED:'Online friends is not connected yet. The demo moles are still available.',FRIENDS_UNAVAILABLE:'Could not reach friends. Your game progress is safe. Please try again.',UNAUTHORIZED:'Connect this browser to get your friend code.',INVALID_CODE:'Enter a valid friend code, such as EU-ABCDE-FG234.',CODE_NOT_FOUND:'No friend was found with that code. Check it and try again.',SELF_REQUEST:'That is your own friend code.',REQUEST_NOT_FOUND:'This request or friendship has changed. Refresh and try again.',REQUEST_LIMITED:'Too many friend requests. Please try again later.',RATE_LIMITED:'A busy little moment. Please wait a minute and try again.',FRIEND_LIMIT:'The friend list is full.',FILE_MODE:'Open the online website to connect with friends. The offline game and demo moles still work.'};
 function prefs(){try{localStorage.setItem(PREF,JSON.stringify({enabled,goal}));}catch{}}
 function serverNow(){return baseServer?baseServer+performance.now()-basePerformance:Date.now();}
 function summary(){
  const s=read(),localDate=date(new Date()),today=s.reportDays[localDate]||{},t=s.session;
  const status=t?(t.status==='paused'?'paused':t.demo?'demo':t.mode==='rest'?'break':t.mode==='work'?'working':'studying'):(Date.now()-s.idleAt>=300000?'sleeping':Date.now()-s.idleAt>=90000?'drowsy':'idle');
  return {name:s.profile.name,color:s.profile.color,status,localDate,studySeconds:today.seconds||0,workSeconds:today.workSeconds||0,goalMinutes:goal,depth:s.depth,mineDepth:PixelArt.digMetrics(s).worldDepth,equipped:s.equipped,tool:s.tool,inventory:s.inventory};
 }
 function formatCode(code){return code?'EU-'+code.slice(0,5)+'-'+code.slice(5):'';}
 function views(){
  const now=serverNow();
  return (model?.friends||[]).filter(f=>UUID.test(f.id)&&UUID.test(f.linkId)).map(f=>{
   const s=f.snapshot||{},age=now-Number(f.lastSeen),availability=!f.sharing?'hidden':!Number.isFinite(age)||age>90000?'offline':connectionError?'stale':f.visible?'online':'away',activity=labels[s.status]?s.status:'idle';
   return {id:'live-'+f.id,profileId:f.id,linkId:f.linkId,live:true,name:String(s.name||'Momo').slice(0,32),color:/^#[a-f0-9]{6}$/i.test(s.color)?s.color:'#b784cf',availability,activity,
    status:availability==='hidden'?'Sharing paused':availability==='offline'?'Offline':availability==='away'?'Away':availability==='stale'?'Last update':labels[activity],
    moleMood:availability!=='online'?'awake':activity==='sleeping'?'asleep':activity==='drowsy'?'drowsy':['paused','break'].includes(activity)?'rest':'awake',
    equipped:Array.isArray(s.equipped)?s.equipped.filter(id=>WardrobeCatalog.items.some(x=>x.id===id)):[],tool:WardrobeCatalog.tools.some(x=>x.id===s.tool)?s.tool:null,
    studySeconds:clamp(s.studySeconds,86400),workSeconds:clamp(s.workSeconds,86400),goal:Math.max(5,clamp(s.goalMinutes,1440)||120),depth:clamp(s.depth),mineDepth:clamp(s.mineDepth),inventory:Array.from({length:4},(_,i)=>clamp(s.inventory?.[i],1000000)),localDate:/^\d{4}-\d{2}-\d{2}$/.test(s.localDate)?s.localDate:null,
    lastSeen:Number(f.lastSeen),age,sharing:!!f.sharing};
  });
 }
 function renderPlayers(){
  players=views();const today=date(new Date());
  $('onlineFriendList').innerHTML=players.map(f=>{
   const seconds=f.studySeconds+f.workSeconds,minutes=Math.floor(seconds/60),ratio=Math.min(100,Math.floor(seconds/(f.goal*60)*100)),show=f.sharing,open=expanded.has(f.id),day=f.localDate===today?'today':f.localDate||'last update';
   const status=f.availability==='offline'&&f.lastSeen?`Offline · ${f.age<3600000?Math.max(1,Math.floor(f.age/60000))+'m ago':Math.floor(f.age/3600000)+'h ago'}`:f.status;
   return `<article class="friend-card live-friend-card" style="--friend-color:${f.color}"><button class="friend-summary" data-live-friend="${f.id}" aria-expanded="${open}" aria-controls="friend-detail-${f.id}" aria-label="${escape(f.name)}: ${escape(f.status)}. View mole and finds."><canvas id="friend-${f.id}" width="96" height="88" aria-label="${escape(f.name)}'s mole"></canvas><span class="friend-identity"><strong>${escape(f.name)}</strong><small><i class="${f.availability==='online'?'studying':''}"></i>${escape(status)}</small></span><span class="friend-progress"><span><span>Focus</span><b>${show?ratio+'%':'—'}</b></span><span class="friend-progress-track" role="progressbar" aria-label="${escape(f.name)}'s focus goal" aria-valuemin="0" aria-valuemax="${f.goal}" aria-valuenow="${show?Math.min(minutes,f.goal):0}" aria-valuetext="${show?`${minutes} of ${f.goal} minutes`:"Status sharing paused"}"><i style="width:${show?ratio:0}%"></i></span><small>${show?`${minutes} / ${f.goal} min`:'Status sharing paused'}</small></span><span class="friend-today"><b>${show?duration(seconds):'—'}</b><small>${escape(show?day:'private')}</small></span><span class="friend-finds">${show?['star','mushroom','crystal','fossil'].filter((id,i)=>f.inventory[i]>0).slice(0,3).map(id=>PixelArt.iconSVG(id)).join(''):''}</span><span class="friend-expand" aria-hidden="true">${open?'−':'+'}</span></button><div id="friend-detail-${f.id}" class="friend-detail" ${open?'':'hidden'}><div class="live-friend-meta"><p>${show?`Mole: ${escape(f.availability==='online'?labels[f.activity]:'last shared '+labels[f.activity])} · Mine ${f.mineDepth} m`:'This friend has paused status sharing.'}</p>${show?`<p>Study ${duration(f.studySeconds)} · Work ${duration(f.workSeconds)} · All-time depth ${f.depth} m</p>`:''}<button type="button" data-remove-friend="${f.linkId}" class="remove-friend-button">Remove friend</button></div>${show?`<div class="friend-inventory">${['Star fragment','Glow mushroom','Stardust crystal','Spiral fossil'].map((name,i)=>`<div class="friend-item ${f.inventory[i]?'':'not-found'}">${PixelArt.iconSVG(['star','mushroom','crystal','fossil'][i])}<span>${name}<small>× ${f.inventory[i]}</small></span></div>`).join('')}</div>`:''}</div></article>`;
  }).join('');
  $('friendsEmpty').hidden=players.length>0;
 }
 function renderRequests(){
  for(const [id,list,incoming] of [['incomingFriendRequests',model?.incoming||[],true],['outgoingFriendRequests',model?.outgoing||[],false]]){
   $(id).innerHTML=list.length?list.filter(r=>UUID.test(r.linkId)).map(r=>`<div class="friend-request-row"><span>${escape(r.profile?.name||'Momo')}</span><div>${incoming?`<button type="button" data-friend-action="accept" data-link="${r.linkId}" ${busy?'disabled':''}>Accept</button><button type="button" data-friend-action="decline" data-link="${r.linkId}" ${busy?'disabled':''}>Decline</button>`:`<button type="button" data-friend-action="cancel" data-link="${r.linkId}" ${busy?'disabled':''}>Cancel request</button>`}</div></div>`).join(''):'<p class="friend-request-empty">No requests yet.</p>';
  }
 }
 function render(){
  const connected=!!model?.self;
  $('friendsConnectPanel').hidden=connected;$('myFriendPanel').hidden=!connected;$('addFriendForm').hidden=!connected;$('friendRequests').hidden=!connected;
  $('myFriendCode').value=formatCode(model?.self?.code);$('copyFriendCode').disabled=busy||!connected;
  if(!busy)$('friendSharing').checked=!!model?.self?.sharing;$('friendSharing').disabled=busy;$('friendGoal').disabled=busy;$('friendGoal').value=goal;
  $('enableFriends').disabled=busy||unavailable;$('sendFriendRequest').disabled=busy;$('confirmRemoveFriend').disabled=busy;$('refreshFriendRequests').disabled=busy;
  $('friendMessage').textContent=message||connectionError;
  $('friendsStatus').textContent=connectionError?(connected?'Connection interrupted · Showing the last update.':connectionError):connected?(model.self.sharing?'Connected · Status updates every 15–30 seconds.':'Status sharing paused · Friends and requests are still available.'):'Connect to add friends and share a little company.';
  $('friendConnectionLight').classList.toggle('connected',connected&&!connectionError&&model.self.sharing);
  $('friendsRetry').textContent=connected?'Refresh':'Connect';$('friendsRetry').disabled=busy;
  const n=model?.incoming?.length||0;$('friendRequestCount').textContent=n;$('friendRequestCount').hidden=!n;
  renderPlayers();renderRequests();
 }
 function schedule(){clearTimeout(timer);if(!enabled||document.hidden)return;timer=setTimeout(()=>call(model?.self&&!model.self.sharing?'state':'sync'),$('companions').hidden?30000:15000);}
 async function call(action,extra={}){
  if(!read||busy)return false;
  if(location.protocol==='file:'){connectionError=errors.FILE_MODE;unavailable=true;render();return false;}
  busy=true;message='';render();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),16000);
  try{
   const body={action,...extra};if(['connect','sync','resume'].includes(action)){body.snapshot=summary();body.visible=!document.hidden;}
   const response=await fetch('/api/friends',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
   let data;try{data=await response.json();}catch{throw Error('FRIENDS_UNAVAILABLE');}
   if(!response.ok||data.error)throw Error(data.error||'FRIENDS_UNAVAILABLE');
   model=data;baseServer=Number(data.serverTime)||Date.now();basePerformance=performance.now();enabled=true;unavailable=false;connectionError='';message=notices[data.notice]||'';prefs();return true;
  }catch(e){
   if(e.message==='UNAUTHORIZED'){model=null;enabled=false;unavailable=false;prefs();connectionError='';}
   else if(e.message==='FRIENDS_NOT_CONFIGURED'){unavailable=true;connectionError=errors.FRIENDS_NOT_CONFIGURED;}
   else if(['FRIENDS_UNAVAILABLE','AbortError','Failed to fetch'].includes(e.message)||!errors[e.message])connectionError=errors.FRIENDS_UNAVAILABLE;
   else message=errors[e.message];
   return false;
  }finally{clearTimeout(timeout);busy=false;render();schedule();}
 }
 async function open(){render();$('friendsDialog').showModal();await call(model?.self&&!model.self.sharing?'state':'sync');}
 function activate(){if(!read||!read().profile.configured)return;render();if(!document.hidden)call(model?.self&&!model.self.sharing?'state':'sync');}
 function notify(){if(!enabled||busy||!model?.self?.sharing||document.hidden||Date.now()-lastAction<2500)return;lastAction=Date.now();call('sync');}
 function away(){
  clearTimeout(timer);if(!enabled||!model?.self?.sharing||location.protocol==='file:')return;
  const body=JSON.stringify({action:'sync',snapshot:summary(),visible:false});try{navigator.sendBeacon('/api/friends',new Blob([body],{type:'application/json'}));}catch{}
 }
 function init(get){
  read=get;try{const p=JSON.parse(localStorage.getItem(PREF));enabled=!!p?.enabled;goal=Math.max(5,Math.min(1440,Number(p?.goal)||120));}catch{}
  $('openFriends').addEventListener('click',open);$('closeFriends').addEventListener('click',()=>$('friendsDialog').close());
  $('friendsRetry').addEventListener('click',()=>model?.self?call(model.self.sharing?'sync':'state'):open());
  $('enableFriends').addEventListener('click',()=>call('connect'));
  $('refreshFriendRequests').addEventListener('click',()=>call(model?.self?.sharing?'sync':'state'));
  $('addFriendForm').addEventListener('submit',async e=>{e.preventDefault();if(await call('request',{code:$('friendCodeInput').value}))$('friendCodeInput').value='';});
  $('copyFriendCode').addEventListener('click',async()=>{let select=false;try{await navigator.clipboard.writeText($('myFriendCode').value);message='Friend code copied.';}catch{select=true;message='Select and copy your code from the box above.';}render();if(select){$('myFriendCode').focus();$('myFriendCode').select();}});
  $('friendSharing').addEventListener('change',e=>call(e.target.checked?'resume':'pause'));
  $('friendGoal').addEventListener('change',e=>{goal=Math.max(5,Math.min(1440,Math.floor(Number(e.target.value)||120)));prefs();if(model?.self?.sharing)call('sync');else render();});
  $('friendRequests').addEventListener('click',e=>{const b=e.target.closest('[data-friend-action]');if(b)call(b.dataset.friendAction,{linkId:b.dataset.link});});
  $('onlineFriendList').addEventListener('click',e=>{
   const remove=e.target.closest('[data-remove-friend]');if(remove){removeTarget=players.find(f=>f.linkId===remove.dataset.removeFriend);if(removeTarget){$('removeFriendName').textContent=removeTarget.name;$('removeFriendDialog').showModal();}return;}
   const b=e.target.closest('[data-live-friend]');if(b){const id=b.dataset.liveFriend;expanded.has(id)?expanded.delete(id):expanded.add(id);renderPlayers();}
  });
  $('cancelRemoveFriend').addEventListener('click',()=>$('removeFriendDialog').close());$('confirmRemoveFriend').addEventListener('click',async()=>{if(removeTarget&&await call('remove',{linkId:removeTarget.linkId})){$('removeFriendDialog').close();removeTarget=null;}});
  document.addEventListener('visibilitychange',()=>document.hidden?away():enabled?activate():null);window.addEventListener('pagehide',away);window.addEventListener('online',()=>{if(enabled)activate();});
  setInterval(()=>{if(!$('companions').hidden&&model&&views().some((f,i)=>f.availability!==players[i]?.availability||f.availability==='offline'&&Math.floor(f.age/60000)!==Math.floor((players[i]?.age||0)/60000)))renderPlayers();},1000);
  render();if(enabled||!$('companions').hidden)activate();
 }
 return {init,activate,notify,getPlayers:()=>players};
})();
