'use strict';
const {randomBytes,createHash}=require('node:crypto');
const catalog=require('../wardrobe.js');
const COOKIE='eumo_friend_session',CODE=/^[A-HJ-NP-Z2-9]{10}$/,UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const ACTIONS=new Set(['connect','sync','state','request','accept','decline','cancel','remove','pause','resume']),buckets=new Map();
const send=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Cookie');res.end(JSON.stringify(body));};
const clean=(s,n)=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,n);
const number=(s,max)=>Math.max(0,Math.min(max,Math.floor(Number(s)||0)));
function snapshot(raw={}){
 const equipment=new Set(catalog.items.map(t=>t.id)),tools=new Set(catalog.tools.map(t=>t.id));
 return {name:clean(raw.name,32).trim()||'Momo',color:/^#[a-f0-9]{6}$/i.test(raw.color)?raw.color:'#b784cf',
  status:['studying','working','paused','break','demo','idle','drowsy','sleeping'].includes(raw.status)?raw.status:'idle',
  localDate:/^\d{4}-\d{2}-\d{2}$/.test(raw.localDate)?raw.localDate:null,studySeconds:number(raw.studySeconds,86400),workSeconds:number(raw.workSeconds,86400),goalMinutes:Math.max(5,number(raw.goalMinutes,1440)||120),
  depth:number(raw.depth,100000000),mineDepth:number(raw.mineDepth,100000000),equipped:[...new Set((Array.isArray(raw.equipped)?raw.equipped:[]).filter(id=>equipment.has(id)))].slice(0,6),tool:tools.has(raw.tool)?raw.tool:null,
  inventory:Array.from({length:4},(_,i)=>number(raw.inventory?.[i],1000000))};
}
function configuration(env){
 const url=new URL(env.SUPABASE_URL||'https://unconfigured.invalid');
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw Error('CONFIG');
 return {url:url.origin,key:env.SUPABASE_SERVICE_ROLE_KEY||'',configured:!!env.SUPABASE_URL&&!!env.SUPABASE_SERVICE_ROLE_KEY};
}
function tokenOf(req){const value=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);return /^[a-f0-9]{64}$/.test(value||'')?value:null;}
function makeCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return [...randomBytes(10)].map(n=>alphabet[n%32]).join('');}
function normalizeCode(value){return clean(value,32).trim().toUpperCase().replace(/^EU[-\s]+/,'').replace(/[-\s]/g,'');}
async function readBody(req){if(req.body!==undefined){const data=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(data)>8000)throw Error();return JSON.parse(data);}const chunks=[];let length=0;for await(const part of req){length+=part.length;if(length>8000)throw Error();chunks.push(part);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
function limited(req,now,action){
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim(),key=ip+':'+(action==='connect'?'connect':'all'),cap=action==='connect'?6:90;
 if(buckets.size>3000)for(const [k,v]of buckets)if(now-v.at>=60000)buckets.delete(k);
 if(buckets.size>=4000&&!buckets.has(key))return true;
 const old=buckets.get(key),record=old&&now-old.at<60000?old:{at:now,n:0};record.n++;buckets.set(key,record);
 return record.n>cap;
}
function createHandler({env=process.env,fetchImpl=globalThis.fetch,now=Date.now,timeoutMs=12000}={}){
 return async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'METHOD_NOT_ALLOWED'});}
  try{if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(res,403,{error:'ORIGIN_NOT_ALLOWED'});}catch{return send(res,403,{error:'ORIGIN_NOT_ALLOWED'});}
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return send(res,415,{error:'JSON_REQUIRED'});
  let config;try{config=configuration(env);}catch{return send(res,503,{error:'FRIENDS_NOT_CONFIGURED'});}if(!config.configured)return send(res,503,{error:'FRIENDS_NOT_CONFIGURED'});
  let input;try{input=await readBody(req);}catch{return send(res,400,{error:'INVALID_REQUEST'});}
  if(!input||!ACTIONS.has(input.action))return send(res,400,{error:'INVALID_REQUEST'});
  if(limited(req,now(),input.action)){res.setHeader('Retry-After','60');return send(res,429,{error:'RATE_LIMITED'});}
  let token=tokenOf(req);const created=!token&&input.action==='connect';if(!token&&!created)return send(res,401,{error:'UNAUTHORIZED'});if(created)token=randomBytes(32).toString('hex');
  const payload={};
  if(['connect','sync','resume'].includes(input.action)){if(!input.snapshot||typeof input.snapshot!=='object'||Array.isArray(input.snapshot))return send(res,400,{error:'INVALID_REQUEST'});payload.snapshot=snapshot(input.snapshot);payload.visible=input.visible!==false;}
  if(input.action==='connect')payload.friendCode=makeCode();
  if(input.action==='request'){payload.code=normalizeCode(input.code);if(!CODE.test(payload.code))return send(res,400,{error:'INVALID_CODE'});}
  if(['accept','decline','cancel','remove'].includes(input.action)){if(!UUID.test(input.linkId||''))return send(res,400,{error:'INVALID_REQUEST'});payload.linkId=input.linkId;}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const headers={'Content-Type':'application/json',apikey:config.key};if(!config.key.startsWith('sb_secret_'))headers.Authorization='Bearer '+config.key;
   const response=await fetchImpl(config.url+'/rest/v1/rpc/eumo_friends_action',{method:'POST',headers,body:JSON.stringify({p_token_hash:createHash('sha256').update(token).digest('hex'),p_action:input.action,p_payload:payload}),signal:controller.signal});
   if(!response.ok)return send(res,503,{error:'FRIENDS_UNAVAILABLE'});
   const data=await response.json();
   if(data.error){const allowed=new Set(['UNAUTHORIZED','REQUEST_LIMITED','CODE_NOT_FOUND','SELF_REQUEST','REQUEST_NOT_FOUND','FRIEND_LIMIT','INVALID_REQUEST']);const error=allowed.has(data.error)?data.error:'FRIENDS_UNAVAILABLE';if(error==='UNAUTHORIZED')res.setHeader('Set-Cookie',COOKIE+'=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'+(env.VERCEL||req.headers['x-forwarded-proto']==='https'?'; Secure':''));return send(res,error==='UNAUTHORIZED'?401:error==='REQUEST_LIMITED'?429:error==='FRIENDS_UNAVAILABLE'?503:400,{error});}
   if(!data.self||!UUID.test(data.self.id||'')||!CODE.test(data.self.code||'')||!Array.isArray(data.friends)||!Array.isArray(data.incoming)||!Array.isArray(data.outgoing))return send(res,503,{error:'FRIENDS_UNAVAILABLE'});
   res.setHeader('Set-Cookie',`${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`+(env.VERCEL||req.headers['x-forwarded-proto']==='https'?'; Secure':''));
   return send(res,200,data);
  }catch{return send(res,503,{error:'FRIENDS_UNAVAILABLE'});}finally{clearTimeout(timer);}
 };
}
module.exports=createHandler();module.exports.createHandler=createHandler;module.exports.snapshot=snapshot;module.exports.normalizeCode=normalizeCode;
