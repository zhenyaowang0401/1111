/* Cloud chat is user-initiated. Game reactions are local, never hidden API calls. */
'use strict';
window.MoleChat=(()=>{
 const KEY='eumo-mole-chat-v1';
 const PERSONA_VERSION='mole-companion-1.1';
 const lifecycle=new Set(['session_started','session_paused','session_resumed','session_finished','day_finished']);
 let getState,entries=[],events=[],lastActivityEvent=null,sharing=true,busy=false,notice='',lastReaction=0,activityRevision=0,pendingController=null;
 const $=id=>document.getElementById(id);
 const text=(value,max=4000)=>String(value??'').slice(0,max);
 const day=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 function language(){const last=[...entries].reverse().find(x=>x.role==='user');return last?(/[\u3400-\u9fff]/.test(last.content)?'zh':'en'):(navigator.language||'en').startsWith('zh')?'zh':'en';}
 function store(){try{localStorage.setItem(KEY,JSON.stringify({entries:entries.slice(-24),events:events.slice(-5),lastActivityEvent,sharing}));}catch{/* Gameplay and chat can still run without persistence. */}}
 function snapshot(){
  const s=getState(),now=new Date(),base={moleName:s.profile.name,language:language(),shared:sharing,localDate:day(now),localTime:now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone};
  if(!sharing)return base;
  const today=s.reportDays[base.localDate]||{},session=s.session;
  return {...base,today:{studySeconds:today.seconds||0,workSeconds:today.workSeconds||0},currentSession:session?{mode:session.mode,status:session.status,demo:session.demo,elapsedSeconds:session.elapsed||0,remainingSeconds:s.remaining,task:session.task}:null,
   lastTask:s.lastTask,equipped:[...s.equipped,...(s.tool?[s.tool]:[])],recentEvents:events.slice(-5),lastActivityEvent,
   recentSessions:s.history.filter(h=>!h.demo&&['study','work'].includes(h.mode)&&((h.daySeconds?.[base.localDate]||0)>0||day(new Date(h.at))===base.localDate)).slice(0,4).map(h=>({mode:h.mode,seconds:h.daySeconds?.[base.localDate]??h.seconds,task:h.task,note:h.note,outcome:h.outcome,localDate:base.localDate}))};
 }
 function render(){
  if(!getState)return;const name=getState().profile.name;
  for(const id of ['chatMessages','chatDialogMessages']){
   const log=$(id);if(!log)continue;log.replaceChildren();
   const shown=entries.length?entries:[{role:'assistant',content:language()==='zh'?'一小步也算数，我在这里陪你。':'One small step at a time. I’m here with you.',source:'game'}];
   for(const entry of shown){
    const row=document.createElement('div');row.className='mole-chat-message chat-entry '+(entry.role==='user'?'chat-user':'chat-mole');
    if(entry.role==='assistant'){const avatar=document.createElement('span');avatar.className='chat-avatar';avatar.style.setProperty('--mole-chat-color',getState().profile.color);avatar.setAttribute('aria-hidden','true');avatar.innerHTML='<svg viewBox="0 0 24 24"><path fill="#30233e" d="M5 3h14v2h2v16H3V5h2z"/><path fill="var(--mole-chat-color)" d="M6 4h12v2h2v14H4V6h2z"/><path fill="#e9b1cf" d="M9 11h6v2h2v7H7v-7h2z"/><path fill="#30233e" d="M7 8h2v2H7zm8 0h2v2h-2zm-4 5h2v1h-2z"/></svg>';row.append(avatar);}
    const p=document.createElement('p'),speaker=document.createElement('strong'),body=document.createElement('span');speaker.textContent=entry.role==='user'?(language()==='zh'?'你':'You'):name;body.textContent=entry.content;
    if(entry.source==='game')speaker.title='Game reaction';p.append(speaker,body);row.append(p);log.append(row);
   }
   if(notice){const p=document.createElement('p');p.className='chat-notice';p.setAttribute('role','status');p.textContent=notice;log.append(p);}
   log.scrollTop=log.scrollHeight;
  }
  for(const id of ['moleChatSend','chatDialogSend']){$(id).disabled=busy;$(id).textContent=busy?'…':'Send ↵';}
  for(const id of ['moleChatInput','chatDialogInput'])$(id).disabled=busy;
  $('clearMoleChat').disabled=busy;$('shareGameContext').checked=sharing;
 }
 function errorCopy(code){
  const zh=language()==='zh';
  if(code==='AI_NOT_CONFIGURED')return zh?'聊天服务还没连接好，需要站点主人完成 AI 配置。你的游戏进度不受影响。':'AI is not connected yet. The site owner needs to finish setup. Your game progress is safe.';
  if(code==='RATE_LIMITED'||code==='PROVIDER_BUSY')return zh?'小铲子有点忙，等一分钟再聊吧。你的文字还在。':'A busy little moment. Please try again in a minute; your draft is safe.';
  if(code==='FILE_MODE')return zh?'请从网站或本地服务打开 Eumo，才能连接聊天。离线游戏仍然可以玩。':'Open Eumo on its website or local server to connect chat. The offline game still works.';
  return zh?'这次没连上聊天服务，文字已经保留，可以再试一次。':'I couldn’t reach the chat service. Your draft is safe—please try again.';
 }
 async function submit(input){
  if(busy)return;const message=input.value.trim().slice(0,2000);if(!message)return;
  if(location.protocol==='file:'){notice=errorCopy('FILE_MODE');render();return;}
  // Keep old conversations visible, but don't feed a previous persona's wrong replies back to the model.
  const previous=[];let budget=6000;for(const entry of entries.filter(x=>x.source!=='game'&&(x.role!=='assistant'||x.personaVersion===PERSONA_VERSION)).slice(-12).reverse()){if(!budget)break;const content=text(entry.content,Math.min(1800,budget));previous.unshift({role:entry.role,content});budget-=content.length;}
  const sent={id:Date.now()+'-'+Math.random().toString(36).slice(2),role:'user',content:message,source:'user'};
  entries.push(sent);busy=true;notice=language()==='zh'?'在挖一点灵感…':'Digging up a thought…';input.value='';render();
  const revision=activityRevision,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);pendingController=controller;
  try{
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,messages:previous,context:snapshot()}),signal:controller.signal});
   let data;try{data=await response.json();}catch{throw new Error('AI_UNAVAILABLE');}
   if(!response.ok||typeof data.reply!=='string'||!data.reply.trim())throw new Error(data.error||'EMPTY_REPLY');
   if(revision!==activityRevision)throw new Error('ACTIVITY_CHANGED');
   entries.push({role:'assistant',content:text(data.reply,6500),source:'ai',personaVersion:data.promptVersion||PERSONA_VERSION});entries=entries.slice(-24);notice='';store();
  }catch(error){entries=entries.filter(x=>x.id!==sent.id);input.value=message;if(revision===activityRevision)notice=errorCopy(error.message);store();}
  finally{clearTimeout(timer);pendingController=null;busy=false;render();if(revision===activityRevision)input.focus();}
 }
 function open(){render();$('chatDialog').showModal();$('chatDialogInput').focus();}
 function onGameEvent(type,details={}){
  if(!getState)return '';
  const s=getState(),event={type,itemId:details.itemId||null,seconds:Math.max(0,details.seconds??s.session?.elapsed??0),demo:details.demo??!!s.session?.demo,mode:details.mode||s.session?.mode||null,outcome:details.outcome||null,localDate:day(new Date())};events.push(event);events=events.slice(-5);
  const changed=lifecycle.has(type);
  // Never allow a reply requested while digging to arrive after the mole has stopped (or vice versa).
  if(changed){lastActivityEvent=event;activityRevision++;pendingController?.abort();}
  const now=Date.now();if(busy&&!changed||type==='equip'&&now-lastReaction<30000){store();return '';}
  const zh=language()==='zh',item=[...WardrobeCatalog.items,...WardrobeCatalog.tools].find(x=>x.id===event.itemId);
  let reply='';
  const zhNames={hat:'探险帽',sunhat:'遮阳帽',bucket:'渔夫帽',baseball:'棒球帽',bunny:'兔子帽',astronaut:'宇航员头盔',crown:'小皇冠',sweater:'奶油色毛衣',coat:'蜂蜜色大衣',hoodie:'淡紫色卫衣',uniform:'棕色校服',puffer:'桃色羽绒服',scarf:'薄荷色围脖',striped:'条纹围脖',checkered:'格纹围脖',bow:'蝴蝶结围脖',fur:'毛茸茸围脖',glasses:'护目镜',sunglasses:'墨镜',roundglasses:'圆框眼镜',squareglasses:'方框眼镜',heartglasses:'爱心眼镜',starglasses:'星星眼镜',star:'星星胸针',spoon:'大勺子',shovel:'小铲子',fork:'园艺叉',drill:'电钻',jackhammer:'破碎锤',crystaldrill:'水晶钻'};
  if(type==='purchase'&&item)reply=zh?`嘟！新的${zhNames[item.id]||item.name}！${item.category==='glasses'?'我像个研究小石头的学者啦。':item.category?'地洞里的小小时装秀开场啦。':'我的小工具箱更热闹啦。'}谢谢你，也别忘了让自己舒服一点。`:`Doo-doo! New ${item.name}! Thank you for the little makeover. I'm happy to be here with you.`;
  if(type==='equip'&&item)reply=zh?`换上${zhNames[item.id]||item.name}啦，小地洞也像有了新气象。`:`${item.name} on! A fresh little look for our next adventure.`;
  if(type==='session_started')reply=event.demo?(zh?'试玩开始，我去试试小铲子。这不算正式学习。':'Demo time! A little tool test, separate from real study.'):(event.mode==='rest'?(zh?'休息时间到，我也放下小铲子，陪你一起歇一会儿。':'Break time. I’m putting my shovel down to rest with you.'):(zh?`你开始${event.mode==='work'?'工作':'学习'}啦，我也要陪你一起干活了。你忙你的，我挖我的，一起加油，不用回复我。`:"You’re getting started, so I’m digging alongside you. We’ll work together—no need to reply."));
  if(type==='session_paused')reply=event.demo?(zh?'试玩暂停，小铲子也停一停。':'Demo paused. My shovel is taking a pause too.'):(event.mode==='rest'?(zh?'休息计时暂停啦，我们继续安静歇着，小铲子还放着。':'The break timer is paused. We’re still resting; my shovel stays put.'):(zh?'你暂停啦，我也停下小铲子，陪你歇一会儿。这一轮还在，想继续时再一起开工。':'You’ve paused, so my shovel is still too. We can rest and resume this session when you choose.'));
  if(type==='session_resumed')reply=event.demo?(zh?'继续试玩，小铲子又开动啦。':'Demo resumed. The little shovel is moving again.'):(event.mode==='rest'?(zh?'继续休息，我也陪你安静待一会儿，小铲子先放着。':'Our break is continuing. I’m resting with you; the shovel stays put.'):(zh?'继续啦，我也接着挖。你继续这一小步，我们一起慢慢来。':'You’re resuming, and I’m digging again alongside you. One little step at a time.'));
  if(type==='session_finished'){
   if(event.demo)reply=zh?'试玩结束，小铲子收好，我陪你歇一会儿。这次不计入正式学习。':'The demo is over. Shovel down; I’m resting with you. This was separate from real study.';
   else if(event.mode==='rest')reply=zh?'这一段休息结束啦，我的小铲子还放着。接下来继续歇着，或等你开始下一轮再一起开工。':'This break is over. My shovel stays put until you choose to start another session.';
   else {const minutes=Math.floor(event.seconds/60),time=minutes?(zh?`${minutes} 分钟`:`${minutes} minute${minutes===1?'':'s'}`):(zh?`${Math.floor(event.seconds)} 秒`:`${Math.floor(event.seconds)} seconds`);reply=zh?`这轮结束啦${event.seconds>=1?`，${time}已经记下了`:''}。我也放下小铲子，陪你一起休息，伸个懒腰吧。`:`This session is over${event.seconds>=1?`; ${time} recorded`:''}. I’m putting my shovel down to rest with you. A little stretch sounds nice.`;}
  }
  if(type==='day_finished')reply=zh?'今天的记录收好啦，我们已经回到地面。我也收起小铲子，陪你一起休息，今天辛苦了。':"Today’s notes are tucked away, and we’re back at the surface. Shovel put away; I’m resting with you. Thanks for today.";
  if(reply){entries.push({role:'assistant',content:reply,source:'game'});entries=entries.slice(-24);lastReaction=now;notice='';render();}store();return reply;
 }
 function init(read){
  getState=read;
  try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved){sharing=saved.sharing!==false;entries=(Array.isArray(saved.entries)?saved.entries:[]).filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string').slice(-24).map(x=>({role:x.role,content:text(x.content,6500),source:['game','ai','user'].includes(x.source)?x.source:'user',personaVersion:text(x.personaVersion,40)}));events=(Array.isArray(saved.events)?saved.events:[]).slice(-5);lastActivityEvent=lifecycle.has(saved.lastActivityEvent?.type)?saved.lastActivityEvent:events.findLast(x=>lifecycle.has(x?.type))||null;}}catch{}
  for(const [form,input,button] of [['moleChatForm','moleChatInput','moleChatSend'],['chatDialogForm','chatDialogInput','chatDialogSend']]){
   const send=e=>{e.preventDefault();submit($(input));};$(form).addEventListener('submit',send);$(button).addEventListener('click',send);$(input).addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229)send(e);});
  }
  $('openMoleChat').addEventListener('click',open);$('closeMoleChat').addEventListener('click',()=>$('chatDialog').close());
  $('clearMoleChat').addEventListener('click',()=>{if(busy)return;entries=[];events=[];notice='';store();render();});
  $('shareGameContext').addEventListener('change',e=>{sharing=e.target.checked;store();});
  const starters={plan:'Help me plan today. Ask about my available time if needed.',study:'I would like help understanding a study question. What do you need from me?',relax:'I would like a gentle break and some company.',story:'Tell me a short, funny story from your burrow.'};
  document.querySelectorAll('[data-chat-starter]').forEach(button=>button.addEventListener('click',()=>{$('chatDialogInput').value=starters[button.dataset.chatStarter];$('chatDialogInput').focus();}));
  render();
 }
 return {init,onGameEvent,open,refresh:render};
})();
