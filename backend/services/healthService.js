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
const TABLES = {
  heart_rate: { table: "heart_rate_records", onConflict: "user_id,measured_at" },
  blood_pressure: { table: "blood_pressure_records", onConflict: "user_id,measured_at" },
  oxygen: { table: "oxygen_records", onConflict: "user_id,measured_at" },
  steps: { table: "steps_records", onConflict: "user_id,start_time,end_time" },
  sleep: { table: "sleep_records", onConflict: "user_id,start_time,end_time" }
};

// 반환: 종류별 저장한 개수. 한 종류가 실패해도 나머지는 저장하고 실패 목록을 돌려준다.
async function saveRecords(user_id, records) {
  const saved = {};
  const failed = {};

  await Promise.all(
    Object.entries(records).map(async ([kind, rows]) => {
      const { table, onConflict } = TABLES[kind];
      const { error } = await supabase
        .from(table)
        .upsert(
          rows.map(row => ({ ...row, user_id })),
          { onConflict }
        );

      if (error) {
        failed[kind] = error.message;
      } else {
        saved[kind] = rows.length;
      }
    })
  );

  return { saved, failed };
}

module.exports = {
  getTodayBloodPressure,
  saveRecords
};
