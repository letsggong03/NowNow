const test = require("node:test");
const assert = require("node:assert/strict");

const {
  hrScore,
  phrvScore,
  bpScore,
  stepScore,
  sleepFactor,
  hourlyStress,
  dailyRealtimeStress,
  calculateDailyStress,
  kstDayRange
} = require("../services/stressCalculator");

test("HRScore 구간", () => {
  assert.equal(hrScore(55), 0);
  assert.equal(hrScore(80), 0);
  assert.equal(hrScore(80.5), 30);
  assert.equal(hrScore(90), 30);
  assert.equal(hrScore(100), 60);
  assert.equal(hrScore(101), 100);
});

test("PHRVScore 구간", () => {
  assert.equal(phrvScore(12), 0);
  assert.equal(phrvScore(10), 30);
  assert.equal(phrvScore(7), 30);
  assert.equal(phrvScore(6.9), 60);
  assert.equal(phrvScore(5), 60);
  assert.equal(phrvScore(4.9), 100);
});

test("BPScore 구간", () => {
  assert.equal(bpScore(119), 0);
  assert.equal(bpScore(120), 20);
  assert.equal(bpScore(129.9), 20);
  assert.equal(bpScore(130), 50);
  assert.equal(bpScore(140), 100);
});

test("StepScore 구간", () => {
  assert.equal(stepScore(7000), 0);
  assert.equal(stepScore(6999), 20);
  assert.equal(stepScore(5000), 20);
  assert.equal(stepScore(3000), 50);
  assert.equal(stepScore(2999), 80);
});

test("SleepFactor 구간", () => {
  assert.equal(sleepFactor(7 * 60 + 1), 1.0);
  assert.equal(sleepFactor(7 * 60), 1.1);
  assert.equal(sleepFactor(6 * 60), 1.1);
  assert.equal(sleepFactor(5 * 60 + 30), 1.2);
  assert.equal(sleepFactor(4 * 60), 1.3);
  assert.equal(sleepFactor(3 * 60), 1.5);
});

const samples = (hourIso, bpms) =>
  bpms.map((bpm, i) => ({
    measured_at: new Date(Date.parse(hourIso) + i * 60000).toISOString(),
    bpm
  }));

test("1시간 단위로 묶고 샘플이 적은 시간은 뺀다", () => {
  const timeline = hourlyStress([
    ...samples("2026-10-20T14:00:00+09:00", [95, 96, 95, 96]), // 평균 95.5, 표준편차 0.5
    ...samples("2026-10-20T03:00:00+09:00", [60, 75, 62, 77]), // 평균 68.5, 표준편차 7.5
    ...samples("2026-10-20T09:00:00+09:00", [70, 71]) // 샘플 2개 → 제외
  ]);

  assert.deepEqual(
    timeline.map(({ time, hrScore, phrvScore, stress }) => ({
      time,
      hrScore,
      phrvScore,
      stress
    })),
    [
      { time: "2026-10-20T03:00:00+09:00", hrScore: 0, phrvScore: 30, stress: 12 },
      { time: "2026-10-20T14:00:00+09:00", hrScore: 60, phrvScore: 100, stress: 76 }
    ]
  );
});

test("DailyRealtimeStress = 0.5×평균 + 0.3×고스트레스비율 + 0.2×최대", () => {
  // 평균 50, 최대 80, 70 이상 1/4 = 25%
  assert.deepEqual(dailyRealtimeStress([20, 40, 60, 80]), {
    score: 0.5 * 50 + 0.3 * 25 + 0.2 * 80,
    avgStress: 50,
    maxStress: 80,
    highRatio: 25
  });
  assert.equal(dailyRealtimeStress([]), null);
});

test("하루 최종 점수 계산", () => {
  const result = calculateDailyStress({
    heartRates: samples("2026-10-20T14:00:00+09:00", [95, 96, 95, 96]),
    systolics: [130, 134], // 평균 132 → 50점
    totalSteps: 2500, // 80점
    sleepMinutes: 5 * 60 + 30 // ×1.2
  });

  // DailyRealtime: 평균 76, 비율 100, 최대 76 → 38 + 30 + 15.2 = 83.2
  assert.equal(result.dailyRealtimeStress.score, 83.2);
  // 0.8×83.2 + 0.1×50 + 0.1×80 = 79.56
  assert.equal(result.dailyStress, 79.6);
  // 79.6×1.2 = 95.52
  assert.equal(result.finalDailyStressScore, 95.5);
  assert.equal(result.peak.time, "2026-10-20T14:00:00+09:00");
  assert.deepEqual(result.missing, []);
});

test("최종 점수는 100을 넘지 않는다", () => {
  const result = calculateDailyStress({
    heartRates: samples("2026-10-20T14:00:00+09:00", [120, 120, 121]),
    systolics: [150],
    totalSteps: 100,
    sleepMinutes: 120
  });
  assert.equal(result.finalDailyStressScore, 100);
});

test("혈압·걸음 수가 없으면 남은 가중치로 계산하고 missing에 표시한다", () => {
  const result = calculateDailyStress({
    heartRates: samples("2026-10-20T14:00:00+09:00", [95, 96, 95, 96])
  });

  assert.equal(result.dailyStress, 83.2);
  assert.equal(result.sleep.factor, 1.0);
  assert.equal(result.finalDailyStressScore, 83.2);
  assert.deepEqual(result.missing, ["bloodPressure", "steps", "sleep"]);
});

test("심박수가 없으면 점수를 내지 않는다", () => {
  const result = calculateDailyStress({ systolics: [130], totalSteps: 8000 });

  assert.equal(result.finalDailyStressScore, null);
  assert.equal(result.dailyStress, null);
  assert.deepEqual(result.missing, ["heartRate", "sleep"]);
});

test("한국 시간 하루 범위", () => {
  assert.deepEqual(kstDayRange("2026-10-20"), {
    start: "2026-10-19T15:00:00.000Z",
    end: "2026-10-20T15:00:00.000Z"
  });
  assert.equal(kstDayRange("2026-02-30"), null);
  assert.equal(kstDayRange("20261020"), null);
});
