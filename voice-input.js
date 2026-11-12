/* User-initiated dictation shared by browsers and Electron. No automatic sending. */
'use strict';
window.EumoVoice=(()=>{
 let active=null,initialized=false;
 const pairs=[];
 const copy=(en,zh)=>window.EumoI18n?.language==='zh'?zh:en;
 function message(pair,text){pair.status.textContent=text;pair.status.hidden=!text;}
 function paint(){for(const p of pairs){const on=active?.pair===p,label=on?(active.phase==='recording'?copy('Stop recording','结束录音'):copy('Cancel voice input','取消语音输入')):copy('Voice input · microphone audio is sent for transcription','语音输入 · 录音将发送到语音服务转成文字');p.button.title=label;p.button.setAttribute('aria-label',label);p.button.setAttribute('aria-pressed',String(on));p.button.classList.toggle('is-recording',on&&active.phase==='recording');p.button.classList.toggle('is-processing',on&&active.phase==='processing');p.button.disabled=p.input.disabled||!!active&&!on;}}
 function release(s){clearTimeout(s.timer);s.stream?.getTracks().forEach(t=>t.stop());if(s.context&&s.context.state!=='closed')s.context.close().catch(()=>{});}
 function cancel(){const s=active;if(!s)return;active=null;s.cancelled=true;s.controller?.abort();if(s.recorder?.state==='recording')s.recorder.stop();release(s);message(s.pair,'');paint();}
 function fail(s,error){if(active!==s)return;const code=error?.name==='NotAllowedError'?'DENIED':error?.name==='NotFoundError'?'NO_MIC':error?.message;
 const messages={DENIED:copy('Microphone access was denied. Allow it in browser or system settings, then try again.','麦克风权限未开启，请在浏览器或系统设置中允许后重试。'),NO_MIC:copy('No microphone found. Connect one and try again.','未找到麦克风，请连接后重试。'),VOICE_NOT_CONFIGURED:copy('Voice transcription is not configured yet. You can still type.','语音服务尚未配置，你仍可输入文字。'),NO_SPEECH:copy('No speech recognized. Please try speaking again.','没有识别到语音，请再说一次。'),RATE_LIMITED:copy('Please wait a minute before trying voice input again.','请等一分钟后再尝试语音输入。'),VOICE_TIMEOUT:copy('Transcription timed out. Please try again.','语音识别超时，请重试。')};
 cancel();message(s.pair,messages[code]||copy('Voice input could not connect or access the microphone. Check your connection and microphone, then try again.','语音输入未成功，请检查网络和麦克风后重试。'));}
 async function encode(s,blob){
  const pcm=await s.context.decodeAudioData(await blob.arrayBuffer());
  const length=Math.min(16000*45,Math.floor(pcm.duration*16000));if(length<1600)throw Error('NO_SPEECH');
  const buffer=new ArrayBuffer(44+length*2),view=new DataView(buffer),write=(at,str)=>{for(let i=0;i<str.length;i++)view.setUint8(at+i,str.charCodeAt(i));};
  write(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);write(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,length*2,true);
  // Average each source interval and all channels into bounded 16 kHz mono PCM.
  const channels=Array.from({length:pcm.numberOfChannels},(_,i)=>pcm.getChannelData(i)),ratio=pcm.sampleRate/16000;
  for(let i=0;i<length;i++){const start=Math.floor(i*ratio),end=Math.max(start+1,Math.floor((i+1)*ratio));let sum=0,n=0;for(const ch of channels)for(let j=start;j<end&&j<ch.length;j++){sum+=ch[j];n++;}const value=Math.max(-1,Math.min(1,sum/(n||1)));view.setInt16(44+i*2,Math.round(value*(value<0?32768:32767)),true);}
  let binary='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);
 }
 async function transcribe(s){
  if(active!==s)return;
  s.phase='processing';clearTimeout(s.timer);s.stream.getTracks().forEach(t=>t.stop());message(s.pair,copy('Turning your voice into text… Click the microphone to cancel.','正在将语音转成文字… 点击麦克风可取消。'));paint();
  try{
   const audio=await encode(s,new Blob(s.chunks,{type:s.recorder.mimeType}));if(active!==s)return;
   await s.context.close();s.controller=new AbortController();s.timer=setTimeout(()=>s.controller.abort(),55000);
   const response=await fetch('/api/transcribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audio}),signal:s.controller.signal});
   const data=await response.json();if(!response.ok)throw Error(data.error||'VOICE_UNAVAILABLE');if(active!==s)return;
   if(typeof data.text!=='string'||!data.text.trim())throw Error('NO_SPEECH');
   const input=s.pair.input,prior=input.value,join=prior&&!/\s$/.test(prior)?' ':'',combined=prior+join+data.text.trim(),limit=input.maxLength>0?input.maxLength:2000;input.value=combined.slice(0,limit);input.dispatchEvent(new Event('input',{bubbles:true}));
   cancel();message(s.pair,combined.length>limit?copy('Message limit reached; only part of the transcript was added. Review before sending.','已达到字数上限，只添加了部分识别文字，请检查后发送。'):copy('Voice added. Review your message, then Send.','语音已转成文字，检查后点击发送。'));input.focus();
  }catch(e){fail(s,e);}
 }
 async function toggle(pair){
  if(active){if(active.pair===pair&&active.phase==='recording'){active.phase='processing';paint();active.recorder.stop();}else cancel();return;}
  if(pair.input.disabled)return;
  if(pair.input.maxLength>0&&pair.input.value.length>=pair.input.maxLength){message(pair,copy('Your draft is full. Shorten it before adding voice input.','输入框已满，请先删减一些文字再使用语音输入。'));return;}
  if(location.protocol==='file:'||!window.isSecureContext){message(pair,copy('Open the secure website or desktop app to use voice input.','请通过 HTTPS 网站或客户端使用语音输入。'));return;}
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder||!Context){message(pair,copy('Voice input is unavailable here. Try a current browser or the desktop app.','当前环境不支持语音输入，请使用新版浏览器或客户端。'));return;}
  const s={pair,phase:'permission',chunks:[]};active=s;message(pair,copy('Allow microphone access to begin. Audio is sent to the speech service when you stop (45 seconds maximum).','请允许访问麦克风。结束录音后会发送至语音服务转成文字，每次最长 45 秒。'));paint();
  try{
   // Create the audio context within the click gesture for Safari/iOS.
   s.context=new Context();await s.context.resume();if(active!==s){release(s);return;}
   const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
   s.stream=stream;if(active!==s){release(s);return;}
   s.recorder=new MediaRecorder(stream);s.recorder.ondataavailable=e=>{if(e.data.size)s.chunks.push(e.data);};s.recorder.onstop=()=>transcribe(s);s.recorder.onerror=e=>fail(s,e.error);
   s.phase='recording';s.recorder.start();s.timer=setTimeout(()=>{if(active===s&&s.recorder.state==='recording')s.recorder.stop();},45000);
   message(pair,copy('Listening… Click the microphone again to finish (up to 45 seconds).','正在聆听… 再点一次麦克风结束（最长 45 秒）。'));paint();
  }catch(e){fail(s,e);}
 }
 function init(){
  if(initialized)return;initialized=true;
  for(const [inputId,buttonId] of [['moleChatInput','moleChatMic'],['chatDialogInput','chatDialogMic']]){
   const input=document.getElementById(inputId),button=document.getElementById(buttonId),status=document.getElementById(buttonId+'Status'),pair={input,button,status};pairs.push(pair);
   input.addEventListener('input',()=>{if(!active)message(pair,'');});
   button.addEventListener('click',()=>toggle(pair));input.form.addEventListener('submit',cancel,{capture:true});
   new MutationObserver(()=>{if(input.disabled&&active?.pair===pair)cancel();paint();}).observe(input,{attributes:true,attributeFilter:['disabled']});
  }
  document.getElementById('chatDialog').addEventListener('close',cancel);
  document.getElementById('toggleMoleChat').addEventListener('click',cancel);
  document.getElementById('openMoleChat').addEventListener('click',cancel);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){cancel();e.preventDefault();}});
  window.addEventListener('eumo-language',()=>{cancel();paint();});
  window.addEventListener('pagehide',cancel);window.addEventListener('hashchange',cancel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});paint();
 }
 return {init,cancel};
})();
