const supabase = require("../config/supabase");
const fetchAll = require("../utils/fetchAll");
const { kstDayRange, kstToday } = require("../utils/kstDate");

function getTodayBloodPressure(userId) {
  const { start, end } = kstDayRange(kstToday());
  return fetchAll(() => supabase.from("blood_pressure_records")
    .select("measured_at,systolic,diastolic").eq("user_id", userId)
    .gte("measured_at", start).lt("measured_at", end).order("measured_at"));
}

// 종류별 테이블과 중복 판단 기준. 같은 시각(구간)의 기록을 다시 보내면 덮어쓴다.
// tracked: Health Connect 레코드 id(source_record_id)를 저장하는 테이블
const TABLES = {
  heart_rate: { table: "heart_rate_records", onConflict: "user_id,measured_at", tracked: true },
  blood_pressure: { table: "blood_pressure_records", onConflict: "user_id,measured_at", tracked: true },
  oxygen: { table: "oxygen_records", onConflict: "user_id,measured_at", tracked: true },
  steps: { table: "steps_records", onConflict: "user_id,start_time,end_time", tracked: false },
  sleep: { table: "sleep_records", onConflict: "user_id,start_time,end_time", tracked: true }
};

// .in() 필터는 URL에 실리므로 id를 나눠서 보낸다.
const ID_CHUNK = 200;
const chunks = list =>
  Array.from({ length: Math.ceil(list.length / ID_CHUNK) }, (_, i) => list.slice(i * ID_CHUNK, (i + 1) * ID_CHUNK));

async function deleteByRecordIds(user_id, table, ids) {
  for (const part of chunks(ids)) {
    const { error } = await supabase.from(table).delete().eq("user_id", user_id).in("source_record_id", part);
    if (error) throw new Error(error.message);
  }
}

// 반환: 종류별 저장한 개수. 한 종류가 실패해도 나머지는 저장하고 실패 목록을 돌려준다.
//
// 1. deleted: Health Connect에서 지워진 레코드를 모든 원본 테이블에서 지운다.
// 2. 같은 레코드 id로 다시 온 행은 예전 행을 지우고 새로 넣는다(수정된 수면 세션, 샘플이 바뀐 심박 레코드).
// 3. steps_replace: 그 구간의 걸음 수 행을 지우고 보낸 시간별 행으로 바꾼다(예전 하루 합계 행 포함).
async function saveRecords(user_id, records, { stepsReplace = null, deleted = [] } = {}) {
  const saved = {};
  const failed = {};

  if (deleted.length > 0) {
    await Promise.all(
      Object.entries(TABLES).filter(([, { tracked }]) => tracked).map(async ([kind, { table }]) => {
        try {
          await deleteByRecordIds(user_id, table, deleted);
        } catch (error) {
          failed[`${kind}_deleted`] = error.message;
        }
      })
    );
    if (Object.keys(failed).length === 0) saved.deleted = deleted.length;
  }

  await Promise.all(
    Object.entries(records).map(async ([kind, rows]) => {
      const { table, onConflict, tracked } = TABLES[kind];
      try {
        if (tracked) {
          const ids = [...new Set(rows.map(row => row.source_record_id).filter(Boolean))];
          await deleteByRecordIds(user_id, table, ids);
        }
        if (kind === "steps" && stepsReplace) {
          const { error } = await supabase.from(table).delete().eq("user_id", user_id)
            .gte("start_time", stepsReplace.start_time).lt("start_time", stepsReplace.end_time);
          if (error) throw new Error(error.message);
        }
        const { error } = await supabase
          .from(table)
          .upsert(
            rows.map(row => ({ ...row, user_id })),
            { onConflict }
          );
        if (error) throw new Error(error.message);
        saved[kind] = rows.length;
      } catch (error) {
        failed[kind] = error.message;
      }
    })
  );

  return { saved, failed };
}

module.exports = {
  getTodayBloodPressure,
  saveRecords
};
