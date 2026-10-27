// 스트레스 점수 알고리즘 (노션 "졸작" 페이지 기준). DB 없이 계산만 한다.
//
// RealtimeStress       = 0.6 × HRScore + 0.4 × PHRVScore          (1시간 단위)
// DailyRealtimeStress  = 0.5 × AvgStress + 0.3 × HighRatio + 0.2 × MaxStress
// DailyStress          = 0.8 × DailyRealtimeStress + 0.1 × BPScore + 0.1 × StepScore
// FinalDailyStressScore = DailyStress × SleepFactor              (최대 100)

const HIGH_STRESS_THRESHOLD = 70;
// 표준편차를 의미 있게 구하려면 한 시간에 샘플이 이 개수 이상 있어야 한다.
const MIN_SAMPLES_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * HOUR_MS;

// 표의 구간이 정수로 끊겨 있어 소수 값은 위쪽 구간 경계 기준으로 나눈다.
// 60bpm 미만은 표에 없어 0점(60~80 구간)으로 본다.
function hrScore(avgBpm) {
  if (avgBpm <= 80) return 0;
  if (avgBpm <= 90) return 30;
  if (avgBpm <= 100) return 60;
  return 100;
}

// 7, 5처럼 두 구간에 걸친 경계값은 더 안정적인 쪽(낮은 점수)에 넣는다.
function phrvScore(heartRateSd) {
  if (heartRateSd > 10) return 0;
  if (heartRateSd >= 7) return 30;
  if (heartRateSd >= 5) return 60;
  return 100;
}

function bpScore(avgSystolic) {
  if (avgSystolic < 120) return 0;
  if (avgSystolic < 130) return 20;
  if (avgSystolic < 140) return 50;
  return 100;
}

function stepScore(totalSteps) {
  if (totalSteps >= 7000) return 0;
  if (totalSteps >= 5000) return 20;
  if (totalSteps >= 3000) return 50;
  return 80;
}

// 정확히 7시간은 "7시간 초과"가 아니므로 6~7시간 구간이다.
function sleepFactor(sleepMinutes) {
  const hours = sleepMinutes / 60;
  if (hours > 7) return 1.0;
  if (hours >= 6) return 1.1;
  if (hours >= 5) return 1.2;
  if (hours >= 4) return 1.3;
  return 1.5;
}

const round1 = value => Math.round(value * 10) / 10;

const mean = values => values.reduce((sum, v) => sum + v, 0) / values.length;

// 모표준편차
function stdDev(values) {
  const avg = mean(values);
  return Math.sqrt(mean(values.map(v => (v - avg) ** 2)));
}

const toKstIso = ms =>
  new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 19) + "+09:00";

// "2026-10-20" → 한국 시간 그날 0시 ~ 다음날 0시 (ISO 문자열)
function kstDayRange(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const startMs = Date.parse(`${date}T00:00:00+09:00`);
  if (Number.isNaN(startMs) || toKstIso(startMs).slice(0, 10) !== date) {
    return null;
  }
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + 24 * HOUR_MS).toISOString()
  };
}

// 수면 세션들의 총 수면 시간(분). 워치·폰이 같은 수면을 각각 기록해 겹칠 수 있어
// 겹치는 구간은 합쳐서 한 번만 센다. 세션이 없으면 null.
function sleepMinutesFromSessions(sessions) {
  const intervals = sessions
    .map(({ start_time, end_time }) => [Date.parse(start_time), Date.parse(end_time)])
    .filter(([start, end]) => !Number.isNaN(start) && !Number.isNaN(end) && end > start)
    .sort((a, b) => a[0] - b[0]);

  if (intervals.length === 0) return null;

  let totalMs = 0;
  let [curStart, curEnd] = intervals[0];

  for (const [start, end] of intervals.slice(1)) {
    if (start <= curEnd) {
      curEnd = Math.max(curEnd, end);
    } else {
      totalMs += curEnd - curStart;
      [curStart, curEnd] = [start, end];
    }
  }
  totalMs += curEnd - curStart;

  return Math.round(totalMs / 60000);
}

function realtimeStress(avgBpm, heartRateSd) {
  const hr = hrScore(avgBpm);
  const phrv = phrvScore(heartRateSd);
  return { hrScore: hr, phrvScore: phrv, stress: round1(0.6 * hr + 0.4 * phrv) };
}

// samples: [{ measured_at, bpm }] → 1시간 단위 실시간 스트레스 (시간순)
function hourlyStress(samples) {
  const buckets = new Map();

  for (const { measured_at, bpm } of samples) {
    const ms = Date.parse(measured_at);
    if (Number.isNaN(ms) || typeof bpm !== "number") continue;
    const hourStart = Math.floor(ms / HOUR_MS) * HOUR_MS;
    if (!buckets.has(hourStart)) buckets.set(hourStart, []);
    buckets.get(hourStart).push(bpm);
  }

  return [...buckets.entries()]
    .filter(([, bpms]) => bpms.length >= MIN_SAMPLES_PER_HOUR)
    .sort(([a], [b]) => a - b)
    .map(([hourStart, bpms]) => {
      const avgHeartRate = mean(bpms);
      const heartRateSd = stdDev(bpms);
      return {
        time: toKstIso(hourStart),
        avgHeartRate: round1(avgHeartRate),
        heartRateSd: round1(heartRateSd),
        sampleCount: bpms.length,
        ...realtimeStress(avgHeartRate, heartRateSd)
      };
    });
}

function dailyRealtimeStress(stresses) {
  if (stresses.length === 0) return null;

  const avgStress = mean(stresses);
  const maxStress = Math.max(...stresses);
  const highRatio =
    (stresses.filter(s => s >= HIGH_STRESS_THRESHOLD).length / stresses.length) *
    100;

  return {
    score: round1(0.5 * avgStress + 0.3 * highRatio + 0.2 * maxStress),
    avgStress: round1(avgStress),
    maxStress: round1(maxStress),
    highRatio: round1(highRatio)
  };
}

// 혈압·걸음 수가 없는 날은 그 항목을 빼고 남은 가중치로 다시 나눈다.
function weightedAverage(parts) {
  const present = parts.filter(part => part.value !== null);
  const totalWeight = present.reduce((sum, part) => sum + part.weight, 0);
  return (
    present.reduce((sum, part) => sum + part.weight * part.value, 0) / totalWeight
  );
}

/**
 * 하루 스트레스 전체 계산.
 * @param {object} input
 * @param {{measured_at: string, bpm: number}[]} input.heartRates
 * @param {number[]} input.systolics  그날 수축기 혈압 측정값
 * @param {number|null} input.totalSteps
 * @param {number|null} input.sleepMinutes
 */
function calculateDailyStress({
  heartRates = [],
  systolics = [],
  totalSteps = null,
  sleepMinutes = null
}) {
  const timeline = hourlyStress(heartRates);
  const realtime = dailyRealtimeStress(timeline.map(hour => hour.stress));

  const avgSystolic = systolics.length > 0 ? mean(systolics) : null;
  const bp = avgSystolic === null ? null : bpScore(avgSystolic);
  const steps = totalSteps === null ? null : stepScore(totalSteps);
  const factor = sleepMinutes === null ? 1.0 : sleepFactor(sleepMinutes);

  const missing = [];
  if (!realtime) missing.push("heartRate");
  if (bp === null) missing.push("bloodPressure");
  if (steps === null) missing.push("steps");
  if (sleepMinutes === null) missing.push("sleep");

  // 심박수가 없으면 핵심 지표(80%)가 없으므로 점수를 내지 않는다.
  const dailyStress = realtime
    ? round1(
        weightedAverage([
          { weight: 0.8, value: realtime.score },
          { weight: 0.1, value: bp },
          { weight: 0.1, value: steps }
        ])
      )
    : null;

  const byStress = [...timeline].sort((a, b) => b.stress - a.stress);

  return {
    finalDailyStressScore:
      dailyStress === null ? null : round1(Math.min(100, dailyStress * factor)),
    dailyStress,
    dailyRealtimeStress: realtime,
    bloodPressure: {
      avgSystolic: avgSystolic === null ? null : round1(avgSystolic),
      score: bp
    },
    steps: { total: totalSteps, score: steps },
    sleep: { minutes: sleepMinutes, factor },
    timeline,
    peak: byStress[0] ?? null,
    lowest: byStress[byStress.length - 1] ?? null,
    missing
  };
}

module.exports = {
  HIGH_STRESS_THRESHOLD,
  MIN_SAMPLES_PER_HOUR,
  hrScore,
  phrvScore,
  bpScore,
  stepScore,
  sleepFactor,
  sleepMinutesFromSessions,
  realtimeStress,
  hourlyStress,
  dailyRealtimeStress,
  calculateDailyStress,
  kstDayRange
};
