-- 2026-10-27 건강 원본 테이블 RLS 정책 추가
-- RLS는 켜져 있는데 정책이 하나도 없어서, 앱(로그인 사용자)의 upsert가 전부 막히고 있었다.
-- upsert(ON CONFLICT DO UPDATE)는 INSERT·UPDATE·SELECT 정책이 모두 필요하므로 for all로 연다.

begin;

create policy "own rows" on public.heart_rate_records
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on public.blood_pressure_records
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on public.oxygen_records
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on public.steps_records
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
