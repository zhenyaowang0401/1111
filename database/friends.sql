-- Run once in the Supabase SQL editor. The service-role key stays in Vercel.
-- No anonymous or authenticated browser role may read these tables/functions.
create table if not exists public.eumo_friend_profiles (
 id uuid primary key default gen_random_uuid(),
 auth_hash text not null unique check (auth_hash ~ '^[a-f0-9]{64}$'),
 friend_code text not null unique check (friend_code ~ '^[A-HJ-NP-Z2-9]{10}$'),
 snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(snapshot) = 'object' and octet_length(snapshot::text) <= 4096),
 sharing boolean not null default true,
 visible boolean not null default true,
 last_seen timestamptz not null default now(),
 request_window timestamptz not null default now(),
 request_attempts integer not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.eumo_friend_links (
 id uuid primary key default gen_random_uuid(),
 requester uuid not null references public.eumo_friend_profiles(id) on delete cascade,
 addressee uuid not null references public.eumo_friend_profiles(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted')),
 pair_key text generated always as (least(requester::text,addressee::text) || ':' || greatest(requester::text,addressee::text)) stored unique,
 created_at timestamptz not null default now(),
 check (requester <> addressee)
);
create index if not exists eumo_friend_links_incoming on public.eumo_friend_links(addressee,status);
create index if not exists eumo_friend_links_outgoing on public.eumo_friend_links(requester,status);
alter table public.eumo_friend_profiles enable row level security;
alter table public.eumo_friend_links enable row level security;
revoke all on public.eumo_friend_profiles, public.eumo_friend_links from anon, authenticated;

create or replace function public.eumo_friend_identity(p public.eumo_friend_profiles)
returns jsonb language sql stable set search_path = public, pg_temp as $$
 select jsonb_build_object('id',p.id,'name',coalesce(p.snapshot->>'name','Momo'),'color',coalesce(p.snapshot->>'color','#b784cf'));
$$;

create or replace function public.eumo_friends_action(p_token_hash text, p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
 actor public.eumo_friend_profiles;
 target public.eumo_friend_profiles;
 edge public.eumo_friend_links;
 note text := null;
 result jsonb;
begin
 if p_token_hash !~ '^[a-f0-9]{64}$' then return jsonb_build_object('error','UNAUTHORIZED'); end if;
 select * into actor from public.eumo_friend_profiles where auth_hash=p_token_hash for no key update;
 if p_action='connect' and actor.id is null then
  insert into public.eumo_friend_profiles(auth_hash,friend_code,snapshot,visible)
   values(p_token_hash,p_payload->>'friendCode',p_payload->'snapshot',coalesce((p_payload->>'visible')::boolean,true)) returning * into actor;
 elsif actor.id is null then
  return jsonb_build_object('error','UNAUTHORIZED');
 end if;
 if p_action in ('connect','sync','resume') then
  update public.eumo_friend_profiles set
   sharing=case when p_action in ('connect','resume') then true else sharing end,
   snapshot=case when sharing or p_action in ('connect','resume') then coalesce(p_payload->'snapshot',snapshot) else snapshot end,
   visible=coalesce((p_payload->>'visible')::boolean,true),last_seen=now()
   where id=actor.id returning * into actor;
 elsif p_action='pause' then
  update public.eumo_friend_profiles set sharing=false,visible=false,last_seen=now() where id=actor.id returning * into actor;
 elsif p_action='request' then
  update public.eumo_friend_profiles set request_attempts=case when request_window<now()-interval '1 hour' then 1 else request_attempts+1 end,
   request_window=case when request_window<now()-interval '1 hour' then now() else request_window end where id=actor.id returning * into actor;
  if actor.request_attempts>20 then return jsonb_build_object('error','REQUEST_LIMITED'); end if;
  select * into target from public.eumo_friend_profiles where friend_code=p_payload->>'code';
  if target.id is null then return jsonb_build_object('error','CODE_NOT_FOUND'); end if;
  if target.id=actor.id then return jsonb_build_object('error','SELF_REQUEST'); end if;
  select * into edge from public.eumo_friend_links where pair_key=least(actor.id::text,target.id::text)||':'||greatest(actor.id::text,target.id::text);
  if edge.id is not null then
   note:=case when edge.status='accepted' then 'ALREADY_FRIENDS' when edge.requester=actor.id then 'REQUEST_PENDING' else 'INCOMING_REQUEST' end;
  else
   if (select count(*) from public.eumo_friend_links where requester=actor.id and status='pending')>=20 then return jsonb_build_object('error','REQUEST_LIMITED'); end if;
   insert into public.eumo_friend_links(requester,addressee) values(actor.id,target.id) on conflict(pair_key) do nothing returning * into edge;
   if edge.id is null then
    select * into edge from public.eumo_friend_links where pair_key=least(actor.id::text,target.id::text)||':'||greatest(actor.id::text,target.id::text);
    note:=case when edge.requester=actor.id then 'REQUEST_PENDING' else 'INCOMING_REQUEST' end;
   else note:='REQUEST_SENT'; end if;
  end if;
 elsif p_action in ('accept','decline','cancel','remove') then
  select * into edge from public.eumo_friend_links where id=(p_payload->>'linkId')::uuid for update;
  if edge.id is null or (edge.requester<>actor.id and edge.addressee<>actor.id) then return jsonb_build_object('error','REQUEST_NOT_FOUND'); end if;
  if p_action='accept' then
   if edge.status<>'pending' or edge.addressee<>actor.id then return jsonb_build_object('error','REQUEST_NOT_FOUND'); end if;
   if (select count(*) from public.eumo_friend_links where status='accepted' and (requester=actor.id or addressee=actor.id))>=100 or
      (select count(*) from public.eumo_friend_links where status='accepted' and (requester=edge.requester or addressee=edge.requester))>=100 then return jsonb_build_object('error','FRIEND_LIMIT'); end if;
   update public.eumo_friend_links set status='accepted' where id=edge.id;note:='FRIEND_ADDED';
  elsif p_action='remove' and edge.status='accepted' or p_action='decline' and edge.status='pending' and edge.addressee=actor.id or p_action='cancel' and edge.status='pending' and edge.requester=actor.id then
   delete from public.eumo_friend_links where id=edge.id;note:=case when p_action='remove' then 'FRIEND_REMOVED' else 'REQUEST_CLOSED' end;
  else return jsonb_build_object('error','REQUEST_NOT_FOUND');
  end if;
 elsif p_action<>'state' then return jsonb_build_object('error','INVALID_REQUEST');
 end if;
 select jsonb_build_object(
  'self',jsonb_build_object('id',actor.id,'code',actor.friend_code,'sharing',actor.sharing),
  'serverTime',floor(extract(epoch from now())*1000),
  'notice',note,
  'friends',coalesce((select jsonb_agg(jsonb_build_object('linkId',l.id,'id',p.id,'sharing',p.sharing,'visible',p.sharing and p.visible,'lastSeen',case when p.sharing then floor(extract(epoch from p.last_seen)*1000) else null end,
    'snapshot',case when p.sharing then p.snapshot else jsonb_build_object('name',p.snapshot->>'name','color',p.snapshot->>'color') end) order by p.id)
   from public.eumo_friend_links l join public.eumo_friend_profiles p on p.id=case when l.requester=actor.id then l.addressee else l.requester end
   where l.status='accepted' and (l.requester=actor.id or l.addressee=actor.id)),'[]'::jsonb),
  'incoming',coalesce((select jsonb_agg(jsonb_build_object('linkId',l.id,'profile',public.eumo_friend_identity(p)) order by l.created_at)
   from public.eumo_friend_links l join public.eumo_friend_profiles p on p.id=l.requester where l.addressee=actor.id and l.status='pending'),'[]'::jsonb),
  'outgoing',coalesce((select jsonb_agg(jsonb_build_object('linkId',l.id,'profile',public.eumo_friend_identity(p)) order by l.created_at)
   from public.eumo_friend_links l join public.eumo_friend_profiles p on p.id=l.addressee where l.requester=actor.id and l.status='pending'),'[]'::jsonb)
 ) into result;
 return result;
end;
$$;
revoke all on function public.eumo_friend_identity(public.eumo_friend_profiles) from public, anon, authenticated;
revoke all on function public.eumo_friends_action(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.eumo_friends_action(text,text,jsonb) to service_role;
grant select,insert,update,delete on public.eumo_friend_profiles,public.eumo_friend_links to service_role;
