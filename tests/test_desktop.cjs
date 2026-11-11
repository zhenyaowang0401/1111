'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {assetFor,createHandler}=require('../desktop/protocol.cjs');
const {APP_ORIGIN}=require('../desktop/config.cjs');
const backup=require('../save-transfer.js');
const manifest=new Set(['index.html','app.js','assets/a.mp3']);
test('desktop serves only packaged files; traversal and foreign origins are rejected',async()=>{
 assert.equal(assetFor(APP_ORIGIN+'/',manifest),'index.html');assert.equal(assetFor(APP_ORIGIN+'/app.js?v=3',manifest),'app.js');
 for(const url of [APP_ORIGIN+'/.env',APP_ORIGIN+'/api/friends.js',APP_ORIGIN+'/%2e%2e%2f.env',APP_ORIGIN+'/..%5c.env','https://evil.invalid/app.js'])assert.equal(assetFor(url,manifest),null);
 const handle=createHandler({root:'/app/web',manifest,readFile:async()=>Buffer.from('abcdef'),upstream:()=>{throw Error('Not called');}});
 assert.equal((await handle(new Request(APP_ORIGIN+'/app.js'))).headers.get('content-type'),'text/javascript; charset=utf-8');
 const range=await handle(new Request(APP_ORIGIN+'/assets/a.mp3',{headers:{range:'bytes=1-3'}}));assert.equal(range.status,206);assert.equal(await range.text(),'bcd');
 assert.equal((await handle(new Request(APP_ORIGIN+'/.env'))).status,404);
});
test('only known API endpoints go upstream, preserving credentials and TLS failure',async()=>{
 let received;const handle=createHandler({root:'/app/web',manifest,readFile:async()=>Buffer.from('ok'),upstream:async(url,options)=>{received={url,options};return Response.json({ok:true},{headers:{'set-cookie':'eumo_friend_session=abc; HttpOnly; Secure; Path=/'}});}});
 const res=await handle(new Request(APP_ORIGIN+'/api/friends',{method:'POST',body:'{}'}));assert.equal(res.status,200);assert.equal(received.url,APP_ORIGIN+'/api/friends');assert.equal(received.options.credentials,'include');assert.equal(received.options.headers.Origin,APP_ORIGIN);assert.equal(received.options.bypassCustomProtocolHandlers,true);assert.equal(received.options.redirect,'error');assert.match(res.headers.get('set-cookie'),/HttpOnly/);
 const failing=createHandler({root:'/',manifest,readFile:async()=>'',upstream:async()=>{throw Error('Certificate rejected');}});assert.equal((await failing(new Request(APP_ORIGIN+'/api/chat',{method:'POST',body:'{}'}))).status,503);
 assert.equal((await handle(new Request(APP_ORIGIN+'/api/unknown',{method:'POST'}))).status,404);
});
const state={profile:{name:'Momo',color:'#a8b77a'},balance:25,inventory:[1,2,0,1],owned:['squareglasses'],home:{slots:{floor:'rug',livingWall:'hangingLantern'}},session:null};
function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
test('progress export excludes unrelated credentials and restores decor',()=>{
 const s=storage({'loop-pet-soft-universe-v1':JSON.stringify(state),'eumo-language':'zh',secret:'private','eumo-friends-preferences-v1':'{"enabled":true}'}),text=backup.encode(s);assert.ok(!text.includes('private'));assert.ok(!text.includes('friends-preferences'));
 const decoded=backup.parse(text);assert.equal(JSON.parse(decoded['loop-pet-soft-universe-v1']).home.slots.livingWall,'hangingLantern');
 const target=storage();backup.apply(target,decoded);assert.equal(target.getItem('eumo-language'),'zh');
 assert.throws(()=>backup.parse('{"format":"wrong"}'));
 const invalid=JSON.parse(text);invalid.storage['loop-pet-soft-universe-v1']=JSON.stringify({...state,session:{status:'running'}});assert.throws(()=>backup.parse(JSON.stringify(invalid)));
});
test('storage failure rolls progress back instead of half-importing it',()=>{
 const target=storage({'loop-pet-soft-universe-v1':'old','eumo-language':'en'}),put=target.setItem;let failed=false;target.setItem=(key,value)=>{if(key==='eumo-language'&&value==='zh'&&!failed){failed=true;throw Error('Quota');}put(key,value);};
 assert.throws(()=>backup.apply(target,{'loop-pet-soft-universe-v1':'new','eumo-language':'zh'}));assert.equal(target.getItem('loop-pet-soft-universe-v1'),'old');assert.equal(target.getItem('eumo-language'),'en');
});
test('desktop friend identity stays in the HttpOnly cookie jar across API calls',async()=>{
 const {createUpstream}=require('../desktop/protocol.cjs'),token='a'.repeat(64);let jar=[],sent,removed=false;
 const ses={cookies:{get:async()=>jar,set:async c=>{jar=[c];},remove:async()=>{jar=[];removed=true;}},fetch:async(url,options)=>{sent=options.headers;return Response.json({ok:true},{headers:{'set-cookie':`eumo_friend_session=${token}; HttpOnly; Secure; Path=/`}});}};
 const call=createUpstream(ses);await call(APP_ORIGIN+'/api/friends',{headers:{}});assert.equal(jar[0].httpOnly,true);assert.equal(jar[0].secure,true);
 await call(APP_ORIGIN+'/api/friends',{headers:{}});assert.equal(sent.Cookie,'eumo_friend_session='+token);
 ses.fetch=async()=>Response.json({error:'UNAUTHORIZED'},{status:401,headers:{'set-cookie':'eumo_friend_session=; Max-Age=0; Path=/'}});await call(APP_ORIGIN+'/api/friends',{headers:{}});assert.equal(removed,true);
});
