'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {createDatabase}=require('./friends_database.cjs'),{createHandler,snapshot,normalizeCode}=require('../api/friends.js');
let database,ip=0;const digest=s=>createHash('sha256').update(s).digest('hex');
const profile=(name,status='idle')=>({name,color:'#7dcbb4',status,localDate:'2026-10-26',studySeconds:1500,workSeconds:300,goalMinutes:120,equipped:['hat','roundglasses'],tool:'spoon',inventory:[1,2,3,0],depth:120,mineDepth:30});
const config={SUPABASE_URL:'https://friends.example',SUPABASE_SERVICE_ROLE_KEY:'test-only-private-role-key',VERCEL:'1'};
test.before(async()=>{database=await createDatabase();});test.after(async()=>database.db.close());
const connect=(hash,code,name)=>database.rpc(hash,'connect',{friendCode:code,snapshot:profile(name)});
async function call(handler,body,cookie='',extra={},method='POST'){
 const req={method,body,headers:{host:'eumo.example',origin:'https://eumo.example','content-type':'application/json','x-forwarded-for':'192.0.2.'+(++ip),cookie,...extra}};
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(data){this.body=JSON.parse(data);}};await handler(req,res);return res;
}
test('real PostgreSQL: mutual consent, duplicate/reverse requests and participant-only acceptance/removal',async()=>{
 const a=digest('alice'),b=digest('bob'),c=digest('charlie');await connect(a,'ABCDE23456','Alice');await connect(b,'BCDEF23456','Bob');await connect(c,'CDEFG23456','Charlie');
 const first=await database.rpc(a,'request',{code:'BCDEF23456'});assert.equal(first.notice,'REQUEST_SENT');assert.equal(first.friends.length,0);const link=first.outgoing[0].linkId;
 assert.deepEqual(Object.keys(first.outgoing[0].profile).sort(),['color','id','name']);
 assert.equal((await database.rpc(a,'request',{code:'BCDEF23456'})).notice,'REQUEST_PENDING');assert.equal((await database.rpc(b,'request',{code:'ABCDE23456'})).notice,'INCOMING_REQUEST');
 assert.equal((await database.rpc(c,'accept',{linkId:link})).error,'REQUEST_NOT_FOUND');assert.equal((await database.rpc(a,'accept',{linkId:link})).error,'REQUEST_NOT_FOUND');
 const accepted=await database.rpc(b,'accept',{linkId:link});assert.equal(accepted.friends.length,1);assert.equal(accepted.friends[0].snapshot.name,'Alice');
 assert.equal((await database.rpc(a,'state')).friends[0].snapshot.studySeconds,1500);assert.equal((await database.rpc(c,'state')).friends.length,0);
 assert.equal((await database.rpc(c,'remove',{linkId:link})).error,'REQUEST_NOT_FOUND');
 await database.rpc(a,'remove',{linkId:link});assert.equal((await database.rpc(a,'state')).friends.length,0);assert.equal((await database.rpc(b,'state')).friends.length,0);
 assert.equal((await database.rpc(b,'accept',{linkId:link})).error,'REQUEST_NOT_FOUND');
 const request=await database.rpc(a,'request',{code:'BCDEF23456'});await database.rpc(b,'decline',{linkId:request.outgoing[0].linkId});assert.equal((await database.rpc(a,'state')).outgoing.length,0);
 const cancel=await database.rpc(a,'request',{code:'BCDEF23456'});await database.rpc(a,'cancel',{linkId:cancel.outgoing[0].linkId});assert.equal((await database.rpc(b,'state')).incoming.length,0);
 assert.equal((await database.rpc(a,'request',{code:'ABCDE23456'})).error,'SELF_REQUEST');
});
test('real PostgreSQL: presence updates, sharing pause and last-seen masking',async()=>{
 const a=digest('privacy-a'),b=digest('privacy-b');await connect(a,'DEFGH23456','One');await connect(b,'EFGHJ23456','Two');
 const request=await database.rpc(a,'request',{code:'EFGHJ23456'});await database.rpc(b,'accept',{linkId:request.outgoing[0].linkId});
 await database.rpc(b,'sync',{snapshot:profile('Two','sleeping'),visible:true});assert.equal((await database.rpc(a,'state')).friends[0].snapshot.status,'sleeping');
 await database.rpc(b,'pause');const hidden=(await database.rpc(a,'state')).friends[0];assert.deepEqual(Object.keys(hidden.snapshot).sort(),['color','name']);assert.equal(hidden.lastSeen,null);assert.equal(hidden.visible,false);
 await database.rpc(b,'sync',{snapshot:{...profile('SECRET'),studySeconds:9999},visible:true});assert.equal((await database.rpc(a,'state')).friends[0].snapshot.name,'Two');
 await database.rpc(b,'resume',{snapshot:profile('Two','working'),visible:true});assert.equal((await database.rpc(a,'state')).friends[0].snapshot.status,'working');
});
test('real PostgreSQL: invalid-code attempts are limited durably; table and RPC access deny browser roles',async()=>{
 const hash=digest('limits');await connect(hash,'FGHJK23456','Limits');for(let i=0;i<20;i++)assert.equal((await database.rpc(hash,'request',{code:'ZZZZZ99999'})).error,'CODE_NOT_FOUND');assert.equal((await database.rpc(hash,'request',{code:'ZZZZZ99999'})).error,'REQUEST_LIMITED');
 for(const role of ['anon','authenticated']){
  await database.db.exec('set role '+role);
  try{await assert.rejects(database.db.query('select * from public.eumo_friend_profiles'),/permission denied/);await assert.rejects(database.db.query('select public.eumo_friends_action($1,$2,$3::jsonb)',[hash,'state','{}']),/permission denied/);}
  finally{await database.db.exec('reset role');}
 }
});
test('API: generated HttpOnly identity, hashed authentication and safe database payload through real SQL',async()=>{
 let captured;const handler=createHandler({env:config,fetchImpl:async(url,options)=>{assert.equal(url,'https://friends.example/rest/v1/rpc/eumo_friends_action');assert.equal(options.headers.apikey,config.SUPABASE_SERVICE_ROLE_KEY);captured=JSON.parse(options.body);return {ok:true,json:async()=>database.rpc(captured.p_token_hash,captured.p_action,captured.p_payload)};}});
 const created=await call(handler,{action:'connect',snapshot:{...profile('<Alice>'),task:'private task',chat:'private chat',equipped:['hat','injected'],tool:'unknown'}});
 assert.equal(created.statusCode,200);assert.match(created.headers['Set-Cookie'],/HttpOnly; SameSite=Lax; Max-Age=31536000; Secure/);
 const cookie=created.headers['Set-Cookie'].split(';')[0],token=cookie.split('=')[1];assert.equal(captured.p_token_hash,digest(token));assert.notEqual(captured.p_token_hash,token);
 assert(!JSON.stringify(captured).includes('private task'));assert(!JSON.stringify(captured).includes('private chat'));assert.deepEqual(captured.p_payload.snapshot.equipped,['hat']);
 const body=JSON.stringify(created.body);assert(!body.includes(token)&&!body.includes(config.SUPABASE_SERVICE_ROLE_KEY)&&!body.includes(captured.p_token_hash));
 const state=await call(handler,{action:'state',actorId:'forged',auth_hash:'forged'},cookie);assert.equal(state.body.self.id,created.body.self.id);
 assert.equal((await call(handler,{action:'state'})).statusCode,401);
 const forged=await call(handler,{action:'state'},'eumo_friend_session='+'0'.repeat(64));assert.equal(forged.statusCode,401);assert.match(forged.headers['Set-Cookie'],/Max-Age=0/);
});
test('API: configuration, method/origin/body validation, code validation, bounded fields and private errors',async()=>{
 const noCall=()=>assert.fail('should not call database');
 assert.equal((await call(createHandler({env:{},fetchImpl:noCall}),{action:'connect'})).body.error,'FRIENDS_NOT_CONFIGURED');
 const h=createHandler({env:config,fetchImpl:noCall});assert.equal((await call(h,{},'',{},'GET')).statusCode,405);
 assert.equal((await call(h,{},'',{origin:'https://elsewhere.example'})).statusCode,403);assert.equal((await call(h,{},'',{'content-type':'text/plain'})).statusCode,415);
 for(const body of [null,{},'bad json',{action:'nope'},{action:'connect',snapshot:'no'},{action:'connect',padding:'x'.repeat(9000)}])assert.equal((await call(h,body)).statusCode,400);
 const cookie='eumo_friend_session='+'a'.repeat(64);assert.equal((await call(h,{action:'request',code:'wrong'},cookie)).body.error,'INVALID_CODE');assert.equal((await call(h,{action:'remove',linkId:'not-a-uuid'},cookie)).statusCode,400);
 assert.equal(normalizeCode(' eu-abcde-23456 '),'ABCDE23456');assert.equal(snapshot({studySeconds:Infinity,goalMinutes:99999,color:'red',inventory:[-1]}).studySeconds,86400);
 const bad=createHandler({env:config,fetchImpl:async()=>({ok:false,status:401,text:async()=>config.SUPABASE_SERVICE_ROLE_KEY})});const result=await call(bad,{action:'state'},cookie);assert.equal(result.statusCode,503);assert(!JSON.stringify(result).includes(config.SUPABASE_SERVICE_ROLE_KEY));
 const timeout=createHandler({env:config,timeoutMs:5,fetchImpl:async(u,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('abort'))))});assert.equal((await call(timeout,{action:'state'},cookie)).statusCode,503);
});

test('API: modern Supabase secret keys are not sent as JWTs; anonymous bursts are bounded',async()=>{
 const key='sb_secret_fixture_only';
 const handler=createHandler({env:{...config,SUPABASE_SERVICE_ROLE_KEY:key},fetchImpl:async(url,options)=>{assert.equal(options.headers.apikey,key);assert.equal(options.headers.Authorization,undefined);const p=JSON.parse(options.body);return {ok:true,json:async()=>database.rpc(p.p_token_hash,p.p_action,p.p_payload)};}});
 const created=await call(handler,{action:'connect',snapshot:profile('Secret-key profile')});assert.equal(created.statusCode,200);assert(!JSON.stringify(created.body).includes(key));
 const limited=createHandler({env:config,now:()=>123456,fetchImpl:()=>assert.fail('unauthenticated requests must not reach the DB')});
 const headers={'x-forwarded-for':'203.0.113.241'};for(let i=0;i<90;i++)assert.equal((await call(limited,{action:'state'},'',headers)).statusCode,401);
 const blocked=await call(limited,{action:'state'},'',headers);assert.equal(blocked.statusCode,429);assert.equal(blocked.headers['Retry-After'],'60');
});
