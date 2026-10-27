const supabase = require("../config/supabase");
const fetchAll = require("../utils/fetchAll");
const {
  addDays,
  kstDateOf,
  kstDayRange,
  kstToday,
  weekStartOf,
  datesBetween
} = require("../utils/kstDate");
const stressService = require("./stressService");
const {
  buildRecommendation,
  countCauses,
  summarizeDays
} = require("./insightCalculator");

const PERIOD_DAYS = { week: 7, month: 30 };

// from ~ to(포함) 사이에 저장된 챗봇 요약의 키워드
function getSummaries(user_id, from, to) {
  const { start, end } = kstDayRange(from, datesBetween(from, to).length);

  return fetchAll(() =>
    supabase
      .from("chat_summaries")
      .select("keywords, created_at")
      .eq("user_id", user_id)
      .gte("created_at", start)
      .lt("created_at", end)
  );
}

// 최근 7일(week) 또는 30일(month), 오늘 포함
async function getStressCauses(user_id, period) {
  const to = kstToday();
  const from = addDays(to, -(PERIOD_DAYS[period] - 1));
  const summaries = await getSummaries(user_id, from, to);

  return { period, from, to, causes: countCauses(summaries) };
}

// 그날 점수 + 그날까지 최근 7일 대화의 가장 큰 원인
async function getRecommendation(user_id, date) {
  const [daily, summaries] = await Promise.all([
    stressService.getDailyStress(user_id, date),
    getSummaries(user_id, addDays(date, -6), date)
  ]);
  const [topCause] = countCauses(summaries);

  return {
    date,
    score: daily.finalDailyStressScore,
    topCause: topCause?.cause ?? null,
    ...buildRecommendation({
      score: daily.finalDailyStressScore,
      topCause: topCause?.cause ?? null
    })
  };
}

function weekEndOf(weekStart) {
  return addDays(weekStart, 6);
}

// 지난 주부터 limit주 (이번 주 제외, 최신순). 주 시작은 월요일.
async function getWeeklyReports(user_id, limit) {
  const thisWeek = weekStartOf(kstToday());
  const weekStarts = Array.from({ length: limit }, (_, i) =>
    addDays(thisWeek, -7 * (i + 1))
  );
  const from = weekStarts[weekStarts.length - 1];
  const to = addDays(thisWeek, -1);

  const [days, summaries] = await Promise.all([
    stressService.getDailyStressRange(user_id, from, to),
    getSummaries(user_id, from, to)
  ]);

  const items = weekStarts.map(weekStart => {
    const weekEnd = weekEndOf(weekStart);
    const inWeek = date => date >= weekStart && date <= weekEnd;
    const { averageStressScore, dayCount } = summarizeDays(
      days.filter(day => inWeek(day.date))
    );
    const [topCause] = countCauses(
      summaries.filter(row => inWeek(kstDateOf(row.created_at)))
    );

    return {
      weekStart,
      weekEnd,
      averageStressScore,
      dayCount,
      topCause: topCause?.cause ?? null
    };
  });

  return { items };
}

// weekStart(월요일)부터 7일. 이번 주라면 오늘까지만.
async function getWeeklyReport(user_id, weekStart) {
  const weekEnd = weekEndOf(weekStart);
  const today = kstToday();
  const to = weekEnd < today ? weekEnd : today;

  const [days, summaries] = await Promise.all([
    stressService.getDailyStressRange(user_id, weekStart, to),
    getSummaries(user_id, weekStart, to)
  ]);
  const causes = countCauses(summaries);

  return {
    weekStart,
    weekEnd,
    ...summarizeDays(days),
    days: days.map(day => ({
      date: day.date,
      finalDailyStressScore: day.finalDailyStressScore,
      dailyStress: day.dailyStress,
      sleepMinutes: day.sleep.minutes,
      totalSteps: day.steps.total,
      missing: day.missing
    })),
    causes,
    topCause: causes[0]?.cause ?? null
  };
}

module.exports = {
  getStressCauses,
  getRecommendation,
  getWeeklyReports,
  getWeeklyReport
};
