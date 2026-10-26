/* Real embedded PostgreSQL for development tests only; never a production store. */
'use strict';
const {PGlite}=require('@electric-sql/pglite'),fs=require('node:fs'),path=require('node:path');
async function createDatabase(){
 const db=new PGlite();await db.waitReady;
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
 await db.exec(fs.readFileSync(path.join(__dirname,'../database/friends.sql'),'utf8'));
 async function rpc(hash,action,payload={}){
  return db.transaction(async tx=>{await tx.exec('set local role service_role');const result=await tx.query('select public.eumo_friends_action($1,$2,$3::jsonb) as result',[hash,action,JSON.stringify(payload)]);return result.rows[0].result;});
 }
 return {db,rpc};
}
module.exports={createDatabase};
