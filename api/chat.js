'use strict';
const {buildMessages,VERSION}=require('../ai/persona.cjs');
const buckets=new Map();
const MAX_BYTES=48000;
const send=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
function configuration(env){
 const base=String(env.AI_BASE_URL||'https://api.siliconflow.cn/v1').replace(/\/+$/,'');
 let url;try{url=new URL(base);}catch{throw new Error('CONFIG');}
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw new Error('CONFIG');
 return {base,key:env.AI_API_KEY||'',model:env.AI_MODEL||'Qwen/Qwen3-8B',disableThinking:env.AI_DISABLE_THINKING!=='false'};
}
function sameOrigin(req){
 const origin=req.headers.origin;if(!origin)return true;
 try{const host=new URL(origin).host;return host===req.headers.host;}catch{return false;}
}
function limited(req,now,env){
 const cap=Math.max(1,Math.min(60,Number(env.AI_RATE_LIMIT)||8));
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 const record=buckets.get(ip)||{start:now,count:0};
 if(now-record.start>=60000){record.start=now;record.count=0;}
 if(buckets.size>2000)for(const [key,value] of buckets)if(now-value.start>=60000)buckets.delete(key);
 if(buckets.size>2500&&!buckets.has(ip))return true;
 record.count++;buckets.set(ip,record);return record.count>cap;
}
async function readBody(req){
 if(req.body!==undefined){const body=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(body)>MAX_BYTES)throw new Error('TOO_LARGE');return JSON.parse(body);}
 const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>MAX_BYTES)throw new Error('TOO_LARGE');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function createHandler({env=process.env,fetchImpl=globalThis.fetch,now=Date.now,timeoutMs=40000}={}){
 return async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'METHOD_NOT_ALLOWED'});}
  if(!sameOrigin(req))return send(res,403,{error:'ORIGIN_NOT_ALLOWED'});
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return send(res,415,{error:'JSON_REQUIRED'});
  let config;try{config=configuration(env);}catch{return send(res,503,{error:'AI_NOT_CONFIGURED'});}
  if(!config.key)return send(res,503,{error:'AI_NOT_CONFIGURED'});
  if(limited(req,now(),env)){res.setHeader('Retry-After','60');return send(res,429,{error:'RATE_LIMITED'});}
  let input;try{input=await readBody(req);}catch(e){return send(res,e.message==='TOO_LARGE'?413:400,{error:e.message==='TOO_LARGE'?'MESSAGE_TOO_LARGE':'INVALID_REQUEST'});}
  if(!input||typeof input.message!=='string'||!input.message.trim()||input.message.length>2000||input.context&&typeof input.context!=='object'||input.messages&&!Array.isArray(input.messages))return send(res,400,{error:'INVALID_REQUEST'});
  let prompt;try{prompt=buildMessages(input);}catch{return send(res,400,{error:'INVALID_REQUEST'});}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const payload={model:config.model,messages:prompt.messages,stream:false,temperature:prompt.mode==='study'?.35:.75,max_tokens:['study','plan'].includes(prompt.mode)?900:400};
   if(config.disableThinking)payload.enable_thinking=false;
   const upstream=await fetchImpl(config.base+'/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+config.key,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
   if(!upstream.ok)return send(res,upstream.status===429?429:502,{error:upstream.status===429?'PROVIDER_BUSY':'AI_UNAVAILABLE'});
   const result=await upstream.json();
   const text=typeof result.choices?.[0]?.message?.content==='string'?result.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/gi,'').trim().slice(0,6500):'';
   if(!text||/<think>/i.test(text))return send(res,502,{error:'EMPTY_REPLY'});
   return send(res,200,{reply:text,model:config.model,promptVersion:VERSION});
  }catch(e){return send(res,controller.signal.aborted?504:502,{error:controller.signal.aborted?'AI_TIMEOUT':'AI_UNAVAILABLE'});}
  finally{clearTimeout(timer);}
 };
}
module.exports=createHandler();
module.exports.createHandler=createHandler;
module.exports.configuration=configuration;
