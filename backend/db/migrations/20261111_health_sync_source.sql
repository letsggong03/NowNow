-- 2026-11-11 Health Connect 증분 동기화
-- 앱이 Changes API로 바뀐 기록만 보내면서, 레코드가 수정·삭제됐을 때 서버에서도 따라 지울 수 있게
-- Health Connect 레코드 id와 기록한 앱(dataOrigin 패키지명)을 저장한다.
-- 예전 행과 직접 입력한 혈압은 두 값이 null이다.
-- 걸음 수는 Health Connect 집계(기기 간 중복 제거) 값을 시간별로 받으므로 레코드 id가 없다.

begin;

alter table public.heart_rate_records
  add column if not exists source_record_id text,
  add column if not exists data_origin text;

alter table public.blood_pressure_records
  add column if not exists source_record_id text,
  add column if not exists data_origin text;

alter table public.oxygen_records
  add column if not exists source_record_id text,
  add column if not exists data_origin text;

alter table public.sleep_records
  add column if not exists source_record_id text,
  add column if not exists data_origin text;

-- 삭제·교체는 (user_id, source_record_id)로 찾는다.
create index if not exists heart_rate_records_source_idx
  on public.heart_rate_records (user_id, source_record_id) where source_record_id is not null;
create index if not exists blood_pressure_records_source_idx
  on public.blood_pressure_records (user_id, source_record_id) where source_record_id is not null;
create index if not exists oxygen_records_source_idx
  on public.oxygen_records (user_id, source_record_id) where source_record_id is not null;
create index if not exists sleep_records_source_idx
  on public.sleep_records (user_id, source_record_id) where source_record_id is not null;

-- 걸음 수 구간 교체(steps_replace)는 start_time 범위로 지운다.
create index if not exists steps_records_user_start_idx
  on public.steps_records (user_id, start_time);

commit;
