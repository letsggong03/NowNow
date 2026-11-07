begin;
set local search_path = public, extensions;

alter table public.memory_embeddings
  add column if not exists nownow_summary_id bigint
    references public.chat_summaries(summary_id) on delete cascade;

create unique index if not exists memory_embeddings_nownow_summary_key
  on public.memory_embeddings (nownow_summary_id);

create or replace function public.match_nownow_chat_memories(
  owner_id uuid, query_vector vector(1536), candidate_ids bigint[]
)
returns table (summary_id bigint, content text, created_at timestamptz)
language sql stable security invoker
set search_path = public, extensions, pg_temp
as $$
  select s.summary_id::bigint, m.content, s.created_at::timestamptz
  from public.memory_embeddings m
  join public.chat_summaries s on s.summary_id = m.nownow_summary_id
  where m.user_id = owner_id and s.user_id = owner_id
    and m.source_type = 'CHAT_SUMMARY'
    and s.summary_id = any(candidate_ids)
    and m.content = left(s.summary, 800)
    and (m.embedding <=> query_vector) <= 0.7
  order by m.embedding <=> query_vector
  limit 3;
$$;

revoke all on function public.match_nownow_chat_memories(uuid, vector, bigint[]) from public, anon, authenticated;
grant execute on function public.match_nownow_chat_memories(uuid, vector, bigint[]) to service_role;
notify pgrst, 'reload schema';
commit;
