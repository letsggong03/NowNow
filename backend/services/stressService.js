const supabase = require("../config/supabase");
const {
  calculateDailyStress,
  hourlyStress,
  kstDayRange,
  sleepMinutesFromSessions
} = require("./stressCalculator");

const PAGE_SIZE = 1000;

// Supabase는 한 번에 최대 1000행만 돌려주므로 끝까지 나눠서 읽는다.
async function fetchAll(buildQuery) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

function getDayRange(date) {
  const range = kstDayRange(date);

  if (!range) {
    throw new Error("date는 YYYY-MM-DD 형식이어야 합니다.");
  }

  return range;
}

function getHeartRates(user_id, { start, end }) {
  return fetchAll(() =>
    supabase
      .from("heart_rate_records")
      .select("measured_at, bpm")
      .eq("user_id", user_id)
      .gte("measured_at", start)
      .lt("measured_at", end)
      .order("measured_at", { ascending: true })
  );
}

async function getSystolics(user_id, { start, end }) {
  const rows = await fetchAll(() =>
    supabase
      .from("blood_pressure_records")
      .select("systolic")
      .eq("user_id", user_id)
      .gte("measured_at", start)
      .lt("measured_at", end)
  );

  return rows.map(row => row.systolic).filter(value => typeof value === "number");
}

// 걸음 수 기록이 하나도 없으면 null (0보와 구분)
async function getTotalSteps(user_id, { start, end }) {
  const rows = await fetchAll(() =>
    supabase
      .from("steps_records")
      .select("count")
      .eq("user_id", user_id)
      .gte("start_time", start)
      .lt("start_time", end)
  );

  if (rows.length === 0) return null;
  return rows.reduce((sum, row) => sum + (row.count || 0), 0);
}

// 그날 끝난 수면(전날 밤 잠 + 낮잠)을 그날 수면으로 본다. 기록이 없으면 null.
async function getSleepMinutes(user_id, { start, end }) {
  const sessions = await fetchAll(() =>
    supabase
      .from("sleep_records")
      .select("start_time, end_time")
      .eq("user_id", user_id)
      .gte("end_time", start)
      .lt("end_time", end)
  );

  return sleepMinutesFromSessions(sessions);
}

async function getRealtimeStress(user_id, date) {
  const heartRates = await getHeartRates(user_id, getDayRange(date));
  return { date, timeline: hourlyStress(heartRates) };
}

// sleepMinutesOverride가 있으면 DB 수면 기록 대신 그 값을 쓴다(테스트·수동 입력용).
async function getDailyStress(user_id, date, sleepMinutesOverride = null) {
  const range = getDayRange(date);

  const [heartRates, systolics, totalSteps, sleepMinutes] = await Promise.all([
    getHeartRates(user_id, range),
    getSystolics(user_id, range),
    getTotalSteps(user_id, range),
    sleepMinutesOverride === null
      ? getSleepMinutes(user_id, range)
      : sleepMinutesOverride
  ]);

  return {
    date,
    ...calculateDailyStress({ heartRates, systolics, totalSteps, sleepMinutes })
  };
}

module.exports = {
  getRealtimeStress,
  getDailyStress
};
