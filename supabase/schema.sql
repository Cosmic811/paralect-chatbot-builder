-- Bootstrap a fresh Supabase project. The existing development project already
-- has these tables. Run this in the Supabase SQL editor for a new installation.
create schema if not exists extensions;
create extension if not exists vector with schema extensions;
create table if not exists public.bots (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, description text not null default '', public_id uuid not null unique default gen_random_uuid(),
 system_prompt text not null default 'Answer using the provided knowledge. If the answer is missing, say you do not know.',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.documents (
 id uuid primary key default gen_random_uuid(), bot_id uuid not null references public.bots(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, name text not null, storage_path text,
 mime_type text, size_bytes bigint, status text not null default 'pending', error_message text, created_at timestamptz not null default now()
);
create table if not exists public.document_chunks (
 id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
 bot_id uuid not null references public.bots(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
 content text not null, chunk_index integer not null, embedding extensions.vector(1024), created_at timestamptz not null default now()
);
create table if not exists public.conversations (
 id uuid primary key default gen_random_uuid(), bot_id uuid not null references public.bots(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade, created_at timestamptz not null default now()
);
create table if not exists public.messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
 role text not null check(role in ('user','assistant')), content text not null, created_at timestamptz not null default now()
);
create index if not exists documents_bot_idx on public.documents(bot_id);
create index if not exists chunks_bot_idx on public.document_chunks(bot_id);
create index if not exists conversations_bot_idx on public.conversations(bot_id);
create index if not exists messages_conversation_idx on public.messages(conversation_id,created_at);
alter table public.bots enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
-- Policies are intentionally explicit and owner-scoped. Public visitors use
-- server routes with signed session tokens, never direct database access.
drop policy if exists owner_bots on public.bots;
create policy owner_bots on public.bots for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists owner_documents on public.documents;
create policy owner_documents on public.documents for select to authenticated using(user_id=auth.uid());
drop policy if exists owner_chunks on public.document_chunks;
create policy owner_chunks on public.document_chunks for select to authenticated using(user_id=auth.uid());
drop policy if exists owner_conversations on public.conversations;
create policy owner_conversations on public.conversations for select to authenticated using(user_id=auth.uid() and exists(select 1 from public.bots b where b.id=bot_id and b.user_id=auth.uid()));
drop policy if exists owner_messages on public.messages;
create policy owner_messages on public.messages for select to authenticated using(exists(select 1 from public.conversations c where c.id=conversation_id and c.user_id=auth.uid()));
create or replace function public.match_document_chunks(query_embedding extensions.vector(1024), match_bot_id uuid, match_threshold float default 0.35, match_count int default 5)
returns table(id uuid,document_id uuid,content text,chunk_index integer,similarity float)
language sql stable security invoker set search_path=public,extensions as $$
 select c.id,c.document_id,c.content,c.chunk_index,1-(c.embedding <=> query_embedding) as similarity
 from public.document_chunks c join public.documents d on d.id=c.document_id
 where c.bot_id=match_bot_id and d.status='ready' and c.embedding is not null and 1-(c.embedding <=> query_embedding)>match_threshold
 order by c.embedding <=> query_embedding limit least(greatest(match_count,1),20);
$$;
revoke all on function public.match_document_chunks(extensions.vector,uuid,float,int) from public,anon,authenticated;
grant execute on function public.match_document_chunks(extensions.vector,uuid,float,int) to service_role;
insert into storage.buckets(id,name,public,file_size_limit) values('knowledge-files','knowledge-files',false,5242880) on conflict(id) do nothing;
-- No public storage policies. Server routes upload/remove files after ownership checks.
-- Plans, widget settings and simulated invoice history live in auth.users
-- app_metadata; only the server-side Admin API can update them.
