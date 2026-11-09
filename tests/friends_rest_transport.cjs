/* Minimal PostgREST profile transport backed by real PostgreSQL for API tests. */
'use strict';
async function profileRest(db,url,method='GET',body={}){
 const q=new URL(url,'http://fixture').searchParams,where=[],args=[];
 const eq=(column,value)=>{args.push(value);where.push(column+'=$'+args.length);};
 const id=q.get('id'),hash=q.get('auth_hash');
 if(id?.startsWith('eq.'))eq('id',id.slice(3));
 else if(id?.startsWith('in.(')&&id.endsWith(')')){args.push(id.slice(4,-1).split(','));where.push('id=any($'+args.length+'::uuid[])');}
 if(hash?.startsWith('eq.'))eq('auth_hash',hash.slice(3));
 if(!where.length)throw Error('Scoped profile query required');
 const snapshot=q.get('snapshot');if(snapshot?.startsWith('eq.')){args.push(snapshot.slice(3));where.push('snapshot=$'+args.length+'::jsonb');}
 if(method==='PATCH'){
  args.push(JSON.stringify(body.snapshot));return (await db.query('update public.eumo_friend_profiles set snapshot=$'+args.length+'::jsonb where '+where.join(' and ')+' returning id,snapshot',args)).rows;
 }
 if(method!=='GET')throw Error('Unsupported test REST operation');
 return (await db.query('select id,snapshot from public.eumo_friend_profiles where '+where.join(' and '),args)).rows;
}
module.exports={profileRest};
