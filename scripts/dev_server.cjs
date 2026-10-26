'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
if(fs.existsSync(path.join(root,'.env')))process.loadEnvFile(path.join(root,'.env'));
const chat=require('../api/chat.js'),friends=require('../api/friends.js');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(pathname==='/api/chat')return chat(req,res);
 if(pathname==='/api/friends')return friends(req,res);
 // Serve the app, never server prompts, source credentials or Git metadata.
 if(pathname.split('/').some(s=>s.startsWith('.'))||/^\/(ai|api|database|scripts|tests)(\/|$)/.test(pathname)||!['GET','HEAD'].includes(req.method)){res.writeHead(404).end();return;}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return;}
 try{
  const stat=fs.statSync(file);if(!stat.isFile())throw new Error();
  const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
  let start=0,end=stat.size-1,status=200;
  if(req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(!match||!match[1]&&!match[2]){res.writeHead(416,{'Content-Range':'bytes */'+stat.size}).end();return;}
   start=match[1]?Number(match[1]):Math.max(0,stat.size-Number(match[2]));end=match[1]&&match[2]?Math.min(end,Number(match[2])):end;
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=stat.size){res.writeHead(416,{'Content-Range':'bytes */'+stat.size}).end();return;}
   status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);
  if(req.method==='HEAD')res.end();else fs.createReadStream(file,stat.size?{start,end}:{}).pipe(res);
 }catch{res.writeHead(404).end();}
});
server.listen(process.env.PORT===undefined?8000:Number(process.env.PORT),'127.0.0.1',()=>{console.log('Eumo: http://localhost:'+server.address().port);});
