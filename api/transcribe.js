'use strict';
// Short mono WAV clips only. Audio is forwarded in memory and never persisted by Eumo.
const MAX_BYTES=2000000,MAX_AUDIO=44+16000*2*45;
const send=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
function configuration(env){
 const base=String(env.VOICE_BASE_URL||env.AI_BASE_URL||'https://api.siliconflow.cn/v1').replace(/\/+$/,'');
 const url=new URL(base);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw Error('CONFIG');
 return {base,key:env.VOICE_API_KEY||env.AI_API_KEY||'',model:env.VOICE_MODEL||'FunAudioLLM/SenseVoiceSmall'};
}
function wavFrom(input){
 if(typeof input?.audio!=='string'||input.audio.length>Math.ceil(MAX_AUDIO/3)*4||input.audio.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(input.audio))throw Error('INVALID_AUDIO');
 const b=Buffer.from(input.audio,'base64');
 if(b.length<44+3200||b.length>MAX_AUDIO||b.toString('ascii',0,4)!=='RIFF'||b.readUInt32LE(4)!==b.length-8||b.toString('ascii',8,16)!=='WAVEfmt '||b.readUInt32LE(16)!==16||b.readUInt16LE(20)!==1||b.readUInt16LE(22)!==1||b.readUInt32LE(24)!==16000||b.readUInt32LE(28)!==32000||b.readUInt16LE(32)!==2||b.readUInt16LE(34)!==16||b.toString('ascii',36,40)!=='data'||b.readUInt32LE(40)!==b.length-44||b.length%2)throw Error('INVALID_AUDIO');
 return b;
}
async function body(req){
 if(req.body!==undefined){const s=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(s)>MAX_BYTES)throw Error('TOO_LARGE');return JSON.parse(s);}
 let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>MAX_BYTES)throw Error('TOO_LARGE');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString());
}
function createHandler({env=process.env,fetchImpl=globalThis.fetch,now=Date.now,timeoutMs=45000}={}){
 const buckets=new Map();
 return async(req,res)=>{
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'METHOD_NOT_ALLOWED'});}
  try{if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(res,403,{error:'ORIGIN_NOT_ALLOWED'});}catch{return send(res,403,{error:'ORIGIN_NOT_ALLOWED'});}
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return send(res,415,{error:'JSON_REQUIRED'});
  let config;try{config=configuration(env);}catch{return send(res,503,{error:'VOICE_NOT_CONFIGURED'});}
  if(!config.key)return send(res,503,{error:'VOICE_NOT_CONFIGURED'});
  const time=now(),ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  for(const [key,v] of buckets)if(time-v.start>=60000)buckets.delete(key);
  if(!buckets.has(ip)&&buckets.size>=2500)return send(res,429,{error:'RATE_LIMITED'});
  const entry=buckets.get(ip)||{start:time,count:0};entry.count++;buckets.set(ip,entry);
  if(entry.count>6||buckets.size>2500){res.setHeader('Retry-After','60');return send(res,429,{error:'RATE_LIMITED'});}
  let audio;try{audio=wavFrom(await body(req));}catch(e){return send(res,e.message==='TOO_LARGE'?413:400,{error:e.message==='TOO_LARGE'?'TOO_LARGE':'INVALID_AUDIO'});}
  const form=new FormData();form.append('model',config.model);form.append('file',new Blob([audio],{type:'audio/wav'}),'speech.wav');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const upstream=await fetchImpl(config.base+'/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+config.key},body:form,signal:controller.signal});
   if(!upstream.ok)return send(res,upstream.status===429?429:502,{error:upstream.status===429?'RATE_LIMITED':'VOICE_UNAVAILABLE'});
   const data=await upstream.json(),text=typeof data.text==='string'?data.text.replace(/<\|[^|]*\|>/g,'').trim().slice(0,2000):'';
   if(!text)return send(res,422,{error:'NO_SPEECH'});
   return send(res,200,{text});
  }catch{return send(res,controller.signal.aborted?504:502,{error:controller.signal.aborted?'VOICE_TIMEOUT':'VOICE_UNAVAILABLE'});}
  finally{clearTimeout(timer);}
 };
}
module.exports=createHandler();module.exports.createHandler=createHandler;module.exports.wavFrom=wavFrom;
