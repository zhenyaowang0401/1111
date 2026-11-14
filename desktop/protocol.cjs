'use strict';
const path=require('node:path');
const {APP_ORIGIN,API_PATHS}=require('./config.cjs');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.otf':'font/otf','.woff':'font/woff','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.json':'application/json'};
// Only the packaged manifest is readable, never arbitrary paths or server-side files.
function assetFor(url,manifest){
 let u;try{u=new URL(url);}catch{return null;}
 if(u.origin!==APP_ORIGIN)return null;
 let name;try{name=decodeURIComponent(u.pathname).replace(/^\//,'')||'index.html';}catch{return null;}
 return manifest.has(name)&&!name.split('/').some(s=>s==='..'||s==='.')&&!name.includes('\\')?name:null;
}
function createHandler({root,manifest,readFile,upstream}){
 return async request=>{
  const url=new URL(request.url);
  if(url.origin!==APP_ORIGIN)return new Response('Not available',{status:403});
  if(API_PATHS.has(url.pathname)){
   if(request.method!=='POST')return new Response('Method not allowed',{status:405});
   try{
    const body=await request.arrayBuffer();if(body.byteLength>(url.pathname==='/api/transcribe'?2000000:48000))return new Response('Request too large',{status:413});
    const response=await upstream(APP_ORIGIN+url.pathname,{method:'POST',headers:{'Content-Type':'application/json',Origin:APP_ORIGIN},body,credentials:'include',redirect:'error',signal:AbortSignal.timeout(60000),bypassCustomProtocolHandlers:true});
    // Preserve the response; createUpstream persists the HttpOnly friend credential.
    return response;
   }catch{return Response.json({error:'NETWORK_UNAVAILABLE'},{status:503});}
  }
  const name=assetFor(request.url,manifest);
  if(!name||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});
  try{
   const data=await readFile(path.join(root,name)),headers={'Content-Type':MIME[path.extname(name)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
   const range=request.headers.get('range');
   if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m)return new Response(null,{status:416});const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),data.length-1):data.length-1;if(start>end||start>=data.length)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${data.length}`}});headers['Content-Range']=`bytes ${start}-${end}/${data.length}`;return new Response(request.method==='HEAD'?null:data.subarray(start,end+1),{status:206,headers});}
   return new Response(request.method==='HEAD'?null:data,{headers});
  }catch{return new Response('Not found',{status:404});}
 };
}
function createUpstream(ses){
 return async(url,options)=>{
  if(!url.startsWith(APP_ORIGIN+'/api/'))throw Error('Invalid upstream');
  const cookies=await ses.cookies.get({url:APP_ORIGIN,name:'eumo_friend_session'}),headers={...options.headers};
  const token=cookies.find(c=>/^[a-f0-9]{64}$/.test(c.value))?.value;if(token)headers.Cookie='eumo_friend_session='+token;
  const response=await ses.fetch(url,{...options,headers});
  const set=response.headers.get('set-cookie'),match=set?.match(/(?:^|,\s*)eumo_friend_session=([a-f0-9]*);/);
  if(match){if(/^[a-f0-9]{64}$/.test(match[1]))await ses.cookies.set({url:APP_ORIGIN,name:'eumo_friend_session',value:match[1],path:'/',httpOnly:true,secure:true,sameSite:'lax',expirationDate:Date.now()/1000+31536000});else if(!match[1])await ses.cookies.remove(APP_ORIGIN,'eumo_friend_session');}
  return response;
 };
}
module.exports={assetFor,createHandler,createUpstream};
