const test = require("node:test");
const assert = require("node:assert/strict");

const {
  addDays,
  datesBetween,
  isDate,
  kstDateOf,
  kstDayRange,
  weekStartOf
} = require("../utils/kstDate");
const {
  buildRecommendation,
  countCauses,
  summarizeDays
} = require("../services/insightCalculator");
const { calculateByDate } = require("../services/stressCalculator");
const { parseSettingsUpdate } = require("../utils/settings");

test("한국 시간 날짜 계산", () => {
  assert.equal(kstDateOf("2026-10-19T15:00:00.000Z"), "2026-10-20");
  assert.equal(kstDateOf("2026-10-19T14:59:59.000Z"), "2026-10-19");
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.deepEqual(datesBetween("2026-10-30", "2026-11-02"), [
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
    "2026-11-02"
  ]);
  assert.equal(isDate("2026-02-30"), false);
  assert.equal(isDate("2026-10-20"), true);
  assert.deepEqual(kstDayRange("2026-10-20", 7), {
    start: "2026-10-19T15:00:00.000Z",
    end: "2026-10-26T15:00:00.000Z"
  });
});

test("주 시작은 월요일", () => {
  assert.equal(weekStartOf("2026-10-19"), "2026-10-19"); // 월
  assert.equal(weekStartOf("2026-10-20"), "2026-10-19"); // 화
  assert.equal(weekStartOf("2026-10-25"), "2026-10-19"); // 일
  assert.equal(weekStartOf("2026-10-26"), "2026-10-26"); // 월
});

test("스트레스 원인 집계: 한 요약에서 같은 키워드는 한 번, 목록 밖 키워드는 무시", () => {
  assert.deepEqual(
    countCauses([
      { keywords: ["야근", "부장/팀장"] },
      { keywords: ["야근", "야근"] },
      { keywords: ["부장/팀장", "모르는 키워드"] },
      { keywords: ["업무 스트레스"] },
      { keywords: null }
    ]),
    [
      { cause: "부장/팀장", count: 2 },
      { cause: "야근", count: 2 },
      { cause: "업무 스트레스", count: 1 }
    ]
  );
});

test("주간 요약: 점수 없는 날은 빼고 평균", () => {
  assert.deepEqual(
    summarizeDays([
      { date: "2026-10-19", finalDailyStressScore: 60 },
      { date: "2026-10-20", finalDailyStressScore: null },
      { date: "2026-10-21", finalDailyStressScore: 85 }
    ]),
    {
      averageStressScore: 72.5,
      dayCount: 2,
      peakDay: { date: "2026-10-21", score: 85 }
    }
  );
  assert.deepEqual(summarizeDays([]), {
    averageStressScore: null,
    dayCount: 0,
    peakDay: null
  });
});

test("추천: 원인별 루틴, 원인이 없으면 점수 수준으로", () => {
  const night = buildRecommendation({ score: 82, topCause: "야근" });
  assert.equal(night.level, "high");
  assert.equal(night.routine.id, "routine_stretch_10m");
  assert.match(night.message, /높은 편/);
  assert.match(night.message, /'야근'/);

  assert.equal(
    buildRecommendation({ score: 75, topCause: null }).routine.id,
    "routine_breathing_4_7_8"
  );
  assert.equal(
    buildRecommendation({ score: 50, topCause: null }).routine.id,
    "routine_walk_10m"
  );
  // 안정적이고 원인도 없으면 루틴 없음 → 앱이 버튼을 숨긴다
  assert.equal(buildRecommendation({ score: 20, topCause: null }).routine, null);

  const empty = buildRecommendation({ score: null, topCause: null });
  assert.equal(empty.level, null);
  assert.equal(empty.routine, null);
});

test("여러 날 계산: 날짜별로 나누고 수면은 끝난 날, 걸음 수는 시작한 날", () => {
  const hr = (iso, bpm) => ({ measured_at: iso, bpm });
  const results = calculateByDate(["2026-10-20", "2026-10-21"], {
    heartRates: [
      hr("2026-10-20T14:00:00+09:00", 95),
      hr("2026-10-20T14:01:00+09:00", 96),
      hr("2026-10-20T14:02:00+09:00", 95)
    ],
    bloodPressures: [{ measured_at: "2026-10-21T09:00:00+09:00", systolic: 135 }],
    steps: [{ start_time: "2026-10-20T00:00:00+09:00", count: 4000 }],
    sleeps: [
      // 20일 밤 → 21일 아침에 끝난 잠은 21일 수면
      { start_time: "2026-10-20T23:00:00+09:00", end_time: "2026-10-21T06:00:00+09:00" }
    ]
  });

  assert.equal(results[0].date, "2026-10-20");
  assert.equal(results[0].timeline.length, 1);
  assert.equal(results[0].steps.total, 4000);
  assert.equal(results[0].sleep.minutes, null);

  assert.equal(results[1].finalDailyStressScore, null);
  assert.equal(results[1].bloodPressure.avgSystolic, 135);
  assert.equal(results[1].steps.total, null);
  assert.equal(results[1].sleep.minutes, 420);
});

test("설정 수정 검증", () => {
  assert.deepEqual(
    parseSettingsUpdate({
      nickname: " 뿡뿡 ",
      notify_time: "21:30",
      stress_threshold: 65,
      status_message: ""
    }),
    {
      updates: {
        nickname: "뿡뿡",
        notify_time: "21:30",
        stress_threshold: 65,
        status_message: null
      }
    }
  );
  assert.ok(parseSettingsUpdate({ notify_time: "25:00" }).error);
  assert.ok(parseSettingsUpdate({ stress_threshold: 101 }).error);
  assert.ok(parseSettingsUpdate({ notification_enabled: "yes" }).error);
  assert.ok(parseSettingsUpdate({ user_id: "someone-else" }).error);
  assert.ok(parseSettingsUpdate(null).error);
});
