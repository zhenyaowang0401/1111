/* A local Supabase RPC transport backed by actual PostgreSQL, only for tests. */
'use strict';
const http=require('node:http'),{createDatabase}=require('./friends_database.cjs');
(async()=>{
 const {db,rpc}=await createDatabase();
 const server=http.createServer(async(req,res)=>{
  const chunks=[];for await(const part of req)chunks.push(part);
  let body;try{body=JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{res.writeHead(400).end();return;}
  try{
   if(req.url==='/fixture/expire'){
    await db.query("update public.eumo_friend_profiles set last_seen=now()-interval '2 minutes' where id=$1",[body.id]);res.writeHead(200,{'Content-Type':'application/json'}).end('{}');return;
   }
   if(req.url!=='/rest/v1/rpc/eumo_friends_action'||req.headers.apikey!=='fixture-service-role-key'||req.headers.authorization!=='Bearer fixture-service-role-key'){res.writeHead(403).end();return;}
   const result=await rpc(body.p_token_hash,body.p_action,body.p_payload);res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(result));
  }catch(error){res.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:error.message}));}
 });
 server.listen(0,'127.0.0.1',()=>console.log('Friends database: http://127.0.0.1:'+server.address().port));
})();
