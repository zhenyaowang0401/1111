/* Cloud chat is user-initiated. Game reactions are local, never hidden API calls. */
'use strict';
window.MoleChat=(()=>{
 const KEY='eumo-mole-chat-v1';
 let getState,entries=[],events=[],sharing=true,busy=false,notice='',lastReaction=0;
 const $=id=>document.getElementById(id);
 const text=(value,max=4000)=>String(value??'').slice(0,max);
 const day=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 function language(){const last=[...entries].reverse().find(x=>x.role==='user');return last?(/[\u3400-\u9fff]/.test(last.content)?'zh':'en'):(navigator.language||'en').startsWith('zh')?'zh':'en';}
 function store(){try{localStorage.setItem(KEY,JSON.stringify({entries:entries.slice(-24),events:events.slice(-5),sharing}));}catch{/* Gameplay and chat can still run without persistence. */}}
 function snapshot(){
  const s=getState(),now=new Date(),base={moleName:s.profile.name,language:language(),shared:sharing,localDate:day(now),localTime:now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone};
  if(!sharing)return base;
  const today=s.reportDays[base.localDate]||{},session=s.session;
  return {...base,today:{studySeconds:today.seconds||0,workSeconds:today.workSeconds||0},currentSession:session?{mode:session.mode,status:session.status,demo:session.demo,elapsedSeconds:session.elapsed||0,remainingSeconds:s.remaining,task:session.task}:null,
   lastTask:s.lastTask,equipped:[...s.equipped,...(s.tool?[s.tool]:[])],recentEvents:events.slice(-5),
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
  const previous=[];let budget=6000;for(const entry of entries.filter(x=>x.source!=='game').slice(-12).reverse()){if(!budget)break;const content=text(entry.content,Math.min(1800,budget));previous.unshift({role:entry.role,content});budget-=content.length;}
  const sent={id:Date.now()+'-'+Math.random().toString(36).slice(2),role:'user',content:message,source:'user'};
  entries.push(sent);busy=true;notice=language()==='zh'?'在挖一点灵感…':'Digging up a thought…';input.value='';render();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  try{
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,messages:previous,context:snapshot()}),signal:controller.signal});
   let data;try{data=await response.json();}catch{throw new Error('AI_UNAVAILABLE');}
   if(!response.ok||typeof data.reply!=='string'||!data.reply.trim())throw new Error(data.error||'EMPTY_REPLY');
   entries.push({role:'assistant',content:text(data.reply,6500),source:'ai'});entries=entries.slice(-24);notice='';store();
  }catch(error){entries=entries.filter(x=>x.id!==sent.id);input.value=message;notice=errorCopy(error.message);}
  finally{clearTimeout(timer);busy=false;render();input.focus();}
 }
 function open(){render();$('chatDialog').showModal();$('chatDialogInput').focus();}
 function onGameEvent(type,details={}){
  if(!getState)return '';
  const event={type,itemId:details.itemId||null,seconds:Math.max(0,details.seconds||0),demo:!!details.demo,mode:details.mode||getState().session?.mode||null};events.push(event);events=events.slice(-5);
  const now=Date.now();if(busy||type==='equip'&&now-lastReaction<30000){store();return '';}
  const zh=language()==='zh',s=getState(),item=[...WardrobeCatalog.items,...WardrobeCatalog.tools].find(x=>x.id===event.itemId);
  let reply='';
  const zhNames={hat:'探险帽',sunhat:'遮阳帽',bucket:'渔夫帽',baseball:'棒球帽',bunny:'兔子帽',astronaut:'宇航员头盔',crown:'小皇冠',sweater:'奶油色毛衣',coat:'蜂蜜色大衣',hoodie:'淡紫色卫衣',uniform:'棕色校服',puffer:'桃色羽绒服',scarf:'薄荷色围脖',striped:'条纹围脖',checkered:'格纹围脖',bow:'蝴蝶结围脖',fur:'毛茸茸围脖',glasses:'护目镜',sunglasses:'墨镜',roundglasses:'圆框眼镜',squareglasses:'方框眼镜',heartglasses:'爱心眼镜',starglasses:'星星眼镜',star:'星星胸针',spoon:'大勺子',shovel:'小铲子',fork:'园艺叉',drill:'电钻',jackhammer:'破碎锤',crystaldrill:'水晶钻'};
  if(type==='purchase'&&item)reply=zh?`嘟！新的${zhNames[item.id]||item.name}！${item.category==='glasses'?'我像个研究小石头的学者啦。':item.category?'地洞里的小小时装秀开场啦。':'我的小工具箱更热闹啦。'}谢谢你，也别忘了让自己舒服一点。`:`Doo-doo! New ${item.name}! Thank you for the little makeover. I'm happy to be here with you.`;
  if(type==='equip'&&item)reply=zh?`换上 ${item.name} 啦，小地洞也像有了新气象。`:`${item.name} on! A fresh little look for our next adventure.`;
  if(type==='session_started')reply=s.session?.demo?(zh?'试玩开始，我去试试小铲子。正式学习会另外记录。':'Demo time! A little tool test; study time is recorded separately.'):(s.session?.mode==='rest'?(zh?'先休息一下，我也把小铲子放好。不用急着回来。':'Time for a break. My little shovel can rest too.'):(zh?'你开始这一小步，我也去整理土块。各忙各的，一起加油，不用急着回复我。':"You work on your next step; I'll sort these soil blocks. Quiet company—no need to reply."));
  if(type==='session_finished'&&!event.demo&&event.mode!=='rest'&&event.seconds>0){const minutes=Math.floor(event.seconds/60),time=minutes?(zh?`${minutes} 分钟`:`${minutes} minute${minutes===1?'':'s'}`):(zh?`${Math.floor(event.seconds)} 秒`:`${Math.floor(event.seconds)} seconds`);reply=zh?`这轮的 ${time} 已经记下了。谢谢你愿意试一试，现在伸个懒腰也很好。`:`This session's ${time} are recorded. Thanks for giving it a go; a little stretch is welcome now.`;}
  if(type==='day_finished')reply=zh?'今天的记录收好啦，我们回到地面歇一歇。做了多少都不用给自己打分。':"Today's notes are tucked away. Let's rest at the surface; your worth isn't a time score.";
  if(reply){entries.push({role:'assistant',content:reply,source:'game'});entries=entries.slice(-24);lastReaction=now;notice='';render();}store();return reply;
 }
 function init(read){
  getState=read;
  try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved){sharing=saved.sharing!==false;entries=(Array.isArray(saved.entries)?saved.entries:[]).filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string').slice(-24).map(x=>({role:x.role,content:text(x.content,6500),source:['game','ai','user'].includes(x.source)?x.source:'user'}));events=(Array.isArray(saved.events)?saved.events:[]).slice(-5);}}catch{}
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
