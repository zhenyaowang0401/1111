'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createHandler}=require('../api/transcribe.js');
const {createHandler:protocol}=require('../desktop/protocol.cjs');
const {APP_ORIGIN}=require('../desktop/config.cjs');
const {installMicrophonePermissions}=require('../desktop/microphone.cjs');
const env={AI_API_KEY:'server-only-key',AI_BASE_URL:'https://speech.example/v1'};
function wav(seconds=.2){const b=Buffer.alloc(44+Math.floor(16000*seconds)*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);return b;}
async function call(handler,{audio=wav().toString('base64'),method='POST',headers={},body}={}){const req={method,body:body??{audio},headers:{host:'eumo.example',origin:'https://eumo.example','content-type':'application/json',...headers}},res={headers:{},setHeader(k,v){this.headers[k]=v;},end(s){this.body=JSON.parse(s);}};await handler(req,res);return res;}
test('ASR accepts bounded WAV, keeps key server-side, strips provider tags, ignores client endpoint overrides',async()=>{
 let sent;const h=createHandler({env,fetchImpl:async(url,options)=>{sent={url,options};return Response.json({text:'<|zh|><|NEUTRAL|>你好，小鼹鼠。'});}});
 const r=await call(h,{body:{audio:wav(45).toString('base64'),url:'https://evil.example',model:'evil'}});
 assert.equal(r.statusCode,200);assert.equal(r.body.text,'你好，小鼹鼠。');assert.equal(sent.url,'https://speech.example/v1/audio/transcriptions');assert.equal(sent.options.headers.Authorization,'Bearer server-only-key');assert.equal(sent.options.body.get('model'),'FunAudioLLM/SenseVoiceSmall');assert.equal(sent.options.body.get('file').type,'audio/wav');assert(!JSON.stringify(r).includes('server-only-key'));
});
test('ASR rejects malformed/oversized WAV, foreign origins and wrong methods before contacting provider',async()=>{
 let calls=0;const h=createHandler({env,fetchImpl:async()=>{calls++;throw Error();}});
 assert.equal((await call(h,{method:'GET'})).statusCode,405);
 assert.equal((await call(h,{headers:{origin:'https://evil.example'}})).statusCode,403);
 assert.equal((await call(h,{headers:{'content-type':'text/plain'}})).statusCode,415);
 for(const audio of ['bad',Buffer.from('fake wav').toString('base64'),wav(46).toString('base64')])assert.equal((await call(h,{audio})).statusCode,400);
 assert.equal((await call(h,{body:{audio:'a'.repeat(2100000)}})).statusCode,413);assert.equal(calls,0);
});
test('ASR returns useful configuration, silence, upstream and timeout errors',async()=>{
 assert.equal((await call(createHandler({env:{}}))).body.error,'VOICE_NOT_CONFIGURED');
 assert.equal((await call(createHandler({env,fetchImpl:async()=>Response.json({text:' '})}))).body.error,'NO_SPEECH');
 assert.equal((await call(createHandler({env,fetchImpl:async()=>new Response('',{status:429})}))).statusCode,429);
 assert.equal((await call(createHandler({env,fetchImpl:async()=>{throw Error('secret');}}))).body.error,'VOICE_UNAVAILABLE');
 const timeout=createHandler({env,timeoutMs:5,fetchImpl:async(_,o)=>new Promise((_,reject)=>o.signal.addEventListener('abort',()=>reject(Error('abort'))))});assert.equal((await call(timeout)).body.error,'VOICE_TIMEOUT');
});
test('ASR limits requests per minute and permits retry after the window',async()=>{
 let now=0;const h=createHandler({env,now:()=>now,fetchImpl:async()=>Response.json({text:'Hi'})});
 for(let i=0;i<6;i++)assert.equal((await call(h)).statusCode,200);
 assert.equal((await call(h)).statusCode,429);now=60001;assert.equal((await call(h)).statusCode,200);
});
test('desktop forwards voice clips but keeps other API request limits',async()=>{
 const h=protocol({root:'/',manifest:new Set(),readFile:async()=>'',upstream:async(_,o)=>Response.json({bytes:o.body.byteLength})});
 assert.equal((await h(new Request(APP_ORIGIN+'/api/transcribe',{method:'POST',body:'a'.repeat(1900000)}))).status,200);
 assert.equal((await h(new Request(APP_ORIGIN+'/api/transcribe',{method:'POST',body:'a'.repeat(2000001)}))).status,413);
 assert.equal((await h(new Request(APP_ORIGIN+'/api/chat',{method:'POST',body:'a'.repeat(48001)}))).status,413);
});
test('desktop permission is audio-only, main-frame-only, app-origin-only, and asks macOS after consent',async()=>{
 let request,check,prompts=0,osPrompts=0;const wc={getURL:()=>APP_ORIGIN+'/#focus'},main={webContents:wc};
 installMicrophonePermissions({session:{setPermissionRequestHandler:f=>request=f,setPermissionCheckHandler:f=>check=f},getMain:()=>main,dialog:{showMessageBox:async()=>{prompts++;return {response:1};}},systemPreferences:{askForMediaAccess:async type=>{assert.equal(type,'microphone');osPrompts++;return true;}},platform:'darwin'});
 const details={requestingUrl:APP_ORIGIN+'/',isMainFrame:true,mediaTypes:['audio']},ask=(sender=wc,d=details,p='media')=>new Promise(resolve=>request(sender,p,resolve,d));
 assert.equal(check(wc,'media',APP_ORIGIN,{mediaType:'audio'}),false);
 for(const d of [{...details,isMainFrame:false},{...details,mediaTypes:['video']},{...details,mediaTypes:['audio','video']},{...details,requestingUrl:'https://evil.example'}])assert.equal(await ask(wc,d),false);
 assert.equal(await ask({getURL:()=>APP_ORIGIN}),false);assert.equal(await ask(wc,details,'geolocation'),false);assert.equal(prompts,0);
 assert.equal(await ask(),true);assert.equal(osPrompts,1);assert.equal(await ask(),true);assert.equal(prompts,1);assert.equal(check(wc,'media',APP_ORIGIN,{mediaType:'audio'}),true);assert.equal(check(wc,'media',APP_ORIGIN,{mediaType:'video'}),false);
});
test('desktop denied consent never requests operating-system microphone access',async()=>{
 let request;const wc={getURL:()=>APP_ORIGIN},main={webContents:wc};
 installMicrophonePermissions({session:{setPermissionRequestHandler:f=>request=f,setPermissionCheckHandler:()=>{}},getMain:()=>main,dialog:{showMessageBox:async()=>({response:0})},systemPreferences:{askForMediaAccess:()=>{throw Error('Unexpected OS prompt');}},platform:'darwin'});
 assert.equal(await new Promise(resolve=>request(wc,'media',resolve,{requestingUrl:APP_ORIGIN,isMainFrame:true,mediaTypes:['audio']})),false);
});
