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


  return sleepMinutesOverride === null ? (await mergeStoredScores(user_id, [result], date, date))[0] : result;
}

// from ~ to 날짜별 하루 스트레스 (둘 다 포함, 최대 62일)
async function getDailyStressRange(user_id, from, to) {
  const dates = datesBetween(from, to);

  if (dates.length === 0 || dates.length > 62) {
    throw new Error("기간은 1~62일이어야 합니다.");
  }

  const data = await fetchHealthData(user_id, getRange(from, to));
  const results = calculateByDate(dates, data);

  return mergeStoredScores(user_id, results, from, to);
}

// Existing DB scores (including explicitly tagged demo rows) can be shown even
// while the separate watch-to-DB raw-data synchronization is unfinished.
async function mergeStoredScores(user_id, results, from, to) {
  const {data, error} = await supabase.adminReadClient().from('daily_stress_scores')
    .select('record_date,final_score,missing').eq('user_id', user_id)
    .gte('record_date', from).lte('record_date', to);
  if (error) throw new Error(`저장 스트레스 조회 실패 (${error.code}): ${error.message}`);
  const stored = new Map((data || []).map(row => [row.record_date, row]));
  return results.map(result => {
    const row = stored.get(result.date);
    if (row?.final_score == null) return {...result, finalDailyStressScore: null};
    const demo = !!row.missing?.includes('demo_fixture');
    return {...result, finalDailyStressScore: Number(row.final_score), demo,
      source: demo ? '시연용 스트레스 기록' : '팀 DB 저장 기록'};
  });
}

module.exports = {
  getRealtimeStress,
  getDailyStress,
  getDailyStressRange
};
