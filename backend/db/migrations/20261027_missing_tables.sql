-- 2026-10-27 DB 정리: 부족한 테이블·컬럼·인덱스 추가, 회원 탈퇴 시 데이터 삭제
-- Supabase 대시보드 > SQL Editor에서 한 번에 실행한다. 전체가 한 트랜잭션이라 중간에 실패하면 아무것도 바뀌지 않는다.

begin;

-- =====================================================================
-- 1. 새 테이블
-- =====================================================================

-- 수면 기록 (Health Connect SleepSession). 스트레스 최종 점수의 수면 보정에 쓴다.
-- 하루 점수에는 그날 끝난(end_time) 수면을 쓴다.
create table if not exists public.sleep_records (
  sleep_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer generated always as
    ((extract(epoch from (end_time - start_time)) / 60)::integer) stored,
  created_at timestamptz not null default now(),
  constraint sleep_records_time_check check (end_time > start_time),
  constraint sleep_records_user_id_start_time_end_time_key unique (user_id, start_time, end_time)
);
create index if not exists idx_sleep_user_end_time
  on public.sleep_records (user_id, end_time desc);

-- 하루 스트레스 점수 저장. 백엔드(service_role)가 계산해서 넣고, 주간 리포트·추세 그래프가 읽는다.
create table if not exists public.daily_stress_scores (
  daily_stress_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  final_score numeric(4, 1),
  daily_stress numeric(4, 1),
  realtime_score numeric(4, 1),
  avg_stress numeric(4, 1),
  max_stress numeric(4, 1),
  high_ratio numeric(4, 1),
  avg_systolic numeric(4, 1),
  bp_score smallint,
  total_steps integer,
  step_score smallint,
  sleep_minutes integer,
  sleep_factor numeric(2, 1) not null default 1.0,
  missing text[] not null default '{}',
  calculated_at timestamptz not null default now(),
  constraint daily_stress_scores_user_id_record_date_key unique (user_id, record_date)
);

-- 홈 화면 오늘 기분. 하루 한 개.
create table if not exists public.daily_moods (
  mood_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  mood text not null,
  updated_at timestamptz not null default now(),
  constraint daily_moods_user_id_record_date_key unique (user_id, record_date)
);

-- 캐릭터 상호작용(먹이 주기 등)과 고른 취향
create table if not exists public.character_interactions (
  interaction_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  choice text,
  created_at timestamptz not null default now()
);
create index if not exists idx_character_interactions_user_time
  on public.character_interactions (user_id, created_at desc);

-- 푸시 알림 토큰. 한 사용자가 기기 여러 대를 쓸 수 있다.
create table if not exists public.push_tokens (
  push_token_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_push_tokens_user on public.push_tokens (user_id);

-- =====================================================================
-- 2. 기존 테이블 컬럼 추가
-- =====================================================================

-- 챗봇 요약 키워드 → 리포트 스트레스 원인 통계
alter table public.chat_summaries
  add column if not exists keywords text[] not null default '{}';

-- 설정 화면: 상태 메시지, 사용자별 스트레스 감지 기준, 알림 시각
alter table public.user_informations
  add column if not exists status_message text,
  add column if not exists stress_threshold smallint not null default 70
    check (stress_threshold between 0 and 100),
  add column if not exists notify_time time;

-- =====================================================================
-- 3. 없는 인덱스 (user_id로 조회하고 시간순 정렬하는 테이블)
-- =====================================================================

create index if not exists idx_chat_messages_user_time
  on public.chat_messages (user_id, created_at);
create index if not exists idx_chat_summaries_user_time
  on public.chat_summaries (user_id, created_at desc);
create index if not exists idx_health_reports_user_time
  on public.health_reports (user_id, measured_at desc);
create index if not exists idx_posts_created_at
  on public.posts (created_at desc);

-- =====================================================================
-- 4. 회원 탈퇴 시 사용자 데이터도 삭제 (ON DELETE CASCADE)
--    지금은 건강 원본 4개 테이블만 cascade라, 나머지에 데이터가 있으면 auth 사용자 삭제가 실패한다.
-- =====================================================================

alter table public.user_informations
  drop constraint fk_user_informations_auth,
  add constraint fk_user_informations_auth
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.chat_messages
  drop constraint fk_chat_messages_auth,
  add constraint fk_chat_messages_auth
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.chat_summaries
  drop constraint fk_chat_summaries_auth,
  add constraint fk_chat_summaries_auth
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.health_reports
  drop constraint fk_health_reports_auth,
  add constraint fk_health_reports_auth
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.health_records
  drop constraint fk_health_records_auth,
  add constraint fk_health_records_auth
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.memory_embeddings
  drop constraint fk_memory_embeddings_auth,
  add constraint fk_memory_embeddings_auth
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.posts
  drop constraint posts_user_id_fkey,
  add constraint posts_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.post_comments
  drop constraint post_comments_user_id_fkey,
  add constraint post_comments_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.post_likes
  drop constraint post_likes_user_id_fkey,
  add constraint post_likes_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- =====================================================================
-- 5. 새 테이블 RLS: 로그인한 사용자는 자기 데이터만. 백엔드는 service_role이라 RLS를 거치지 않는다.
-- =====================================================================

alter table public.sleep_records enable row level security;
alter table public.daily_stress_scores enable row level security;
alter table public.daily_moods enable row level security;
alter table public.character_interactions enable row level security;
alter table public.push_tokens enable row level security;

-- 앱이 직접 읽고 쓰는 테이블
create policy "own rows" on public.sleep_records
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.daily_moods
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.character_interactions
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.push_tokens
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 점수는 백엔드만 쓰고 앱은 읽기만
create policy "own rows read" on public.daily_stress_scores
  for select to authenticated
  using (auth.uid() = user_id);

commit;

-- =====================================================================
-- 6. (보류) health_records 삭제
--    앱·백엔드 어디에서도 쓰지 않고, health_reports와 이름·키가 서로 엇갈려 있다.
--    데이터가 없는지 확인한 뒤 따로 실행한다.
-- =====================================================================
-- select count(*) from public.health_records;
-- drop table public.health_records;
