/* Optional, local-only tour: observing the UI never starts a game action. */
'use strict';
window.Onboarding=(()=>{
 const KEY='eumo-tour-v1';let bridge,dialog,step=-1,topic=0,origin='focus',returnFocus,seen=false,watch;
 const text=(en,zh)=>EumoI18n.language==='zh'?zh:en;
 const steps=[
  {title:['Start together','一起开工'],copy:['Choose a time and press Start. I’ll dig while you focus. Pause together; End session saves your finds.','选好时间，点开始，你专注，我挖掘。暂停一起停，结束会保存收获。'],targets:[['.timer-card']],labels:[['Timer','计时器']]},
  {title:['Make yourself comfortable','舒服地专注'],copy:['Pick a sound you like. You can also open my chat whenever you need a little company.','听点喜欢的声音，需要时也可以找我聊聊。'],targets:[['.rain-controls'],['#moleDialogueSpace']],labels:[['Music','音乐'],['AI chat','AI 聊天']]},
  {title:['Bring your finds home','把收获带回家'],copy:['Stars buy outfits. Spare finds become decor. Your home is where you can put it all on display.','星星买穿搭，发现物做装饰，回家就能摆出来。'],targets:[['[data-page="wardrobe"]','[data-page="home"]']],labels:[['Outfits · Home','装扮 · 家园']]},
  {title:['Progress and company','看看进步，找个朋友'],copy:['See your own rhythm in Reports. In Friends, copy your code and invite a mole friend.','看看自己的节奏，也可以复制好友码，邀请鼹鼠朋友。'],targets:[['[data-page="reports"]','[data-page="companions"]']],labels:[['Reports · Friends','数据 · 好友']]}
 ];
 function mark(){seen=true;try{localStorage.setItem(KEY,'seen');}catch{}}
 function paint(){if(!dialog.open)return;const s=bridge.read();PixelArt.drawPortrait(document.getElementById('tourPortrait'),s);const welcome=step<0,item=steps[step];
  document.getElementById('tourProgress').textContent=welcome?text('A LITTLE HELLO','先打个招呼'):`${step+1} / 4`;
  document.getElementById('tourTitle').textContent=welcome?text('First time here?','第一次来 Eumo 吗？'):text(...item.title);
  document.getElementById('tourCopy').textContent=welcome?text('I can show you around in about 30 seconds. Or we can jump right in.','花约 30 秒认识这里，也可以直接开始。'):text(...item.copy);
  document.getElementById('tourBack').hidden=welcome;document.getElementById('tourBack').disabled=step===0;document.getElementById('tourBack').textContent=text('Back','上一步');
  document.getElementById('tourSkip').textContent=welcome?text('Jump right in','直接开始'):text('Skip','跳过');
  document.getElementById('tourNext').textContent=welcome?text('Show me around','带我看看'):step===3?text('Start my first session','开始我的第一轮'):text('Next','下一步');
  document.getElementById('tourTopics').setAttribute('aria-label',text('Tour highlights','指引高亮区域'));
  const tabs=document.getElementById('tourTopics');tabs.replaceChildren();tabs.hidden=welcome;
  if(!welcome)item.labels.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.textContent=text(...label);b.className='tour-topic';b.setAttribute('aria-pressed',String(topic===i));b.addEventListener('click',()=>{topic=i;paint();reveal();});tabs.append(b);});
  position();
 }
 function targets(){return step<0?[]:steps[step].targets[topic].map(s=>document.querySelector(s)).filter(e=>e&&e.getClientRects().length);}
 function reveal(){const list=targets();if(list.length){const r=list[0].getBoundingClientRect();window.scrollTo({top:Math.max(0,window.scrollY+r.top-24),behavior:'instant'});}requestAnimationFrame(position);}
 function position(){if(!dialog?.open)return;const card=document.getElementById('tourCard'),w=window.innerWidth,h=window.innerHeight;
  const ch=Math.min(card.offsetHeight,h-24),cw=card.offsetWidth;
  const rects=targets().map(e=>e.getBoundingClientRect()).map(r=>({x:Math.max(4,r.left-6),y:Math.max(4,r.top-6),w:Math.min(w-8,r.width+12),h:Math.min(r.bottom+6,h-4)-Math.max(4,r.top-6)})).filter(r=>r.h>0);
  const centered=Math.max(12,(w-cw)/2),bottom=Math.max(12,h-ch-12);
  const candidates=[{x:centered,y:bottom},{x:centered,y:12},{x:12,y:bottom},{x:Math.max(12,w-cw-12),y:12}];
  const overlap=p=>rects.reduce((n,r)=>n+Math.max(0,Math.min(p.x+cw+12,r.x+r.w)-Math.max(p.x-12,r.x))*Math.max(0,Math.min(p.y+ch+12,r.y+r.h)-Math.max(p.y-12,r.y)),0);
  const chosen=step<0?{x:centered,y:(h-ch)/2}:candidates.reduce((best,p)=>overlap(p)<overlap(best)?p:best);
  card.style.left=chosen.x+'px';card.style.top=chosen.y+'px';
  const svg=document.getElementById('tourShade');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  let path=`M0 0H${w}V${h}H0Z`;
  for(const r of rects)path+=` M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}Z`;
  document.getElementById('tourShadePath').setAttribute('d',path);
 }
 function close(finish=false){if(!dialog?.open)return;mark();clearInterval(watch);dialog.close();bridge.navigate(finish?'focus':origin);if(finish)document.getElementById('startButton').focus();else if(returnFocus?.isConnected&&returnFocus.getClientRects().length)returnFocus.focus();else document.getElementById('startButton').focus();}
 function open(welcome){if(!bridge.read().profile.configured||bridge.read().session?.status==='running')return false;
  if(document.querySelector('dialog[open]'))return false;origin=location.hash.slice(1)||'focus';returnFocus=document.activeElement;step=welcome?-1:0;topic=0;mark();
  bridge.navigate('focus');dialog.showModal();paint();reveal();document.getElementById('tourNext').focus();
  watch=setInterval(()=>{if(bridge.read().session?.status==='running'){clearInterval(watch);dialog.close();}else position();},250);return true;
 }
 function init(options){bridge=options;try{seen=localStorage.getItem(KEY)==='seen';}catch{}
  dialog=document.createElement('dialog');dialog.id='onboardingDialog';dialog.setAttribute('aria-labelledby','tourTitle');dialog.setAttribute('aria-describedby','tourCopy');dialog.setAttribute('data-no-translate','');
  dialog.innerHTML=`<svg id="tourShade" aria-hidden="true" preserveAspectRatio="none"><path id="tourShadePath" fill-rule="evenodd"/></svg><section id="tourCard"><div class="tour-top"><span id="tourProgress"></span><button id="tourLanguage" type="button"></button></div><div class="tour-message"><canvas id="tourPortrait" width="128" height="128" aria-hidden="true"></canvas><div><h2 id="tourTitle"></h2><p id="tourCopy"></p></div></div><div id="tourTopics" aria-label="Tour highlights"></div><div class="tour-actions"><button id="tourSkip" type="button"></button><button id="tourBack" type="button"></button><button id="tourNext" type="button"></button></div></section>`;
  document.body.append(dialog);
  dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=[...dialog.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length),first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  document.getElementById('tourNext').onclick=()=>{if(step===3){close(true);return;}step++;topic=0;paint();reveal();document.getElementById('tourNext').focus();};
  document.getElementById('tourBack').onclick=()=>{if(step>0){step--;topic=0;paint();reveal();}};
  document.getElementById('tourSkip').onclick=()=>close();EumoI18n.mountPicker(document.getElementById('tourLanguage'));
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',()=>clearInterval(watch));
  window.addEventListener('resize',()=>{if(dialog.open)reveal();});window.addEventListener('scroll',position,{passive:true});window.addEventListener('eumo-language',paint);
  const replay=document.getElementById('replayTour');replay.onclick=()=>{if(bridge.read().session?.status==='running')return;document.getElementById('infoDialog').close();open(false);};
  document.getElementById('helpButton').addEventListener('click',()=>{replay.disabled=bridge.read().session?.status==='running';document.getElementById('tourPauseNote').hidden=!replay.disabled;});
 }
 return {init,offer(){if(!seen)open(true);},replay:()=>open(false)};
})();
