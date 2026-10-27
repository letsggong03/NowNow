const supabase = require("../config/supabase");
const fetchAll = require("../utils/fetchAll");
const { datesBetween, kstDayRange } = require("../utils/kstDate");
const { calculateByDate, hourlyStress } = require("./stressCalculator");

function getRange(from, to) {
  const range = kstDayRange(from, datesBetween(from, to).length);

  if (!range) {
    throw new Error("date는 YYYY-MM-DD 형식이어야 합니다.");
  }

  return range;
}

// 기간 안의 원본 건강 데이터를 한 번에 읽는다.
async function fetchHealthData(user_id, { start, end }) {
  const [heartRates, bloodPressures, steps, sleeps] = await Promise.all([
    fetchAll(() =>
      supabase
        .from("heart_rate_records")
        .select("measured_at, bpm")
        .eq("user_id", user_id)
        .gte("measured_at", start)
        .lt("measured_at", end)
        .order("measured_at", { ascending: true })
    ),
    fetchAll(() =>
      supabase
        .from("blood_pressure_records")
        .select("measured_at, systolic")
        .eq("user_id", user_id)
        .gte("measured_at", start)
        .lt("measured_at", end)
    ),
    fetchAll(() =>
      supabase
        .from("steps_records")
        .select("start_time, count")
        .eq("user_id", user_id)
        .gte("start_time", start)
        .lt("start_time", end)
    ),
    // 그날 끝난 수면(전날 밤 잠 + 낮잠)을 그날 수면으로 본다.
    fetchAll(() =>
      supabase
        .from("sleep_records")
        .select("start_time, end_time")
        .eq("user_id", user_id)
        .gte("end_time", start)
        .lt("end_time", end)
    )
  ]);

  return { heartRates, bloodPressures, steps, sleeps };
}

// 계산한 점수를 daily_stress_scores에 저장한다. 주간 리포트·추세 조회용 기록이라
// 저장에 실패해도 응답은 그대로 돌려준다.
async function saveScores(user_id, results) {
  const rows = results
    .filter(result => result.finalDailyStressScore !== null)
    .map(result => ({
      user_id,
      record_date: result.date,
      final_score: result.finalDailyStressScore,
      daily_stress: result.dailyStress,
      realtime_score: result.dailyRealtimeStress.score,
      avg_stress: result.dailyRealtimeStress.avgStress,
      max_stress: result.dailyRealtimeStress.maxStress,
      high_ratio: result.dailyRealtimeStress.highRatio,
      avg_systolic: result.bloodPressure.avgSystolic,
      bp_score: result.bloodPressure.score,
      total_steps: result.steps.total,
      step_score: result.steps.score,
      sleep_minutes: result.sleep.minutes,
      sleep_factor: result.sleep.factor,
      missing: result.missing,
      calculated_at: new Date().toISOString()
    }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from("daily_stress_scores")
    .upsert(rows, { onConflict: "user_id,record_date" });

  if (error) {
    console.error("[stressService] 점수 저장 실패:", error.message);
  }
}

async function getRealtimeStress(user_id, date) {
  const { start, end } = getRange(date, date);
  const heartRates = await fetchAll(() =>
    supabase
      .from("heart_rate_records")
      .select("measured_at, bpm")
      .eq("user_id", user_id)
      .gte("measured_at", start)
      .lt("measured_at", end)
      .order("measured_at", { ascending: true })
  );

  return { date, timeline: hourlyStress(heartRates) };
}

// sleepMinutesOverride가 있으면 DB 수면 기록 대신 그 값을 쓴다(테스트·수동 입력용).
// 이 경우 실제 기록과 다른 값이라 점수를 저장하지 않는다.
async function getDailyStress(user_id, date, sleepMinutesOverride = null) {
  const data = await fetchHealthData(user_id, getRange(date, date));
  const [result] = calculateByDate([date], data, sleepMinutesOverride);

  if (sleepMinutesOverride === null) {
    await saveScores(user_id, [result]);
  }

  return result;
}

// from ~ to 날짜별 하루 스트레스 (둘 다 포함, 최대 62일)
async function getDailyStressRange(user_id, from, to) {
  const dates = datesBetween(from, to);

  if (dates.length === 0 || dates.length > 62) {
    throw new Error("기간은 1~62일이어야 합니다.");
  }

  const data = await fetchHealthData(user_id, getRange(from, to));
  const results = calculateByDate(dates, data);
  await saveScores(user_id, results);

  return results;
}

module.exports = {
  getRealtimeStress,
  getDailyStress,
  getDailyStressRange
};
