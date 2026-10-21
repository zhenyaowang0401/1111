'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
if(fs.existsSync(path.join(root,'.env')))process.loadEnvFile(path.join(root,'.env'));
const chat=require('../api/chat.js');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.mp3':'audio/mpeg','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(pathname==='/api/chat')return chat(req,res);
 // Serve the app, never server prompts, source credentials or Git metadata.
 if(pathname.split('/').some(s=>s.startsWith('.'))||/^\/(ai|api|scripts|tests)(\/|$)/.test(pathname)||!['GET','HEAD'].includes(req.method)){res.writeHead(404).end();return;}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return;}
 try{const stat=fs.statSync(file);if(!stat.isFile())throw new Error();res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}
});
server.listen(process.env.PORT===undefined?8000:Number(process.env.PORT),'127.0.0.1',()=>{console.log('Eumo: http://localhost:'+server.address().port);});
