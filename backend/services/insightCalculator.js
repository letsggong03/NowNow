// 리포트 화면용 집계: 스트레스 원인 통계, 주간 요약, 추천 문구·루틴. DB 없이 계산만 한다.

const HIGH_STRESS_SCORE = 70;
const MEDIUM_STRESS_SCORE = 40;

// 챗봇 요약 키워드(앱 chatAiFeatures.ts의 causeKeywords)와 같은 목록이어야 통계가 맞는다.
const CAUSE_KEYWORDS = [
  "업무 스트레스",
  "부장/팀장",
  "야근",
  "학업",
  "인간관계",
  "경제",
  "건강",
  "미래",
  "일상"
];

const ROUTINES = {
  breathing: {
    id: "routine_breathing_4_7_8",
    title: "4-7-8 호흡",
    steps: [
      "편하게 앉아 어깨 힘을 뺀다",
      "코로 4초 동안 숨을 들이마신다",
      "7초 동안 숨을 참는다",
      "입으로 8초 동안 천천히 내쉰다",
      "4번 반복한다"
    ]
  },
  stretch: {
    id: "routine_stretch_10m",
    title: "10분 스트레칭",
    steps: [
      "목을 천천히 좌우로 돌리기 1분",
      "어깨 으쓱했다 내리기 2분",
      "양팔 위로 뻗어 옆구리 늘리기 2분",
      "앉아서 허리 비틀기 2분",
      "종아리·허벅지 늘리기 3분"
    ]
  },
  walk: {
    id: "routine_walk_10m",
    title: "10분 산책",
    steps: [
      "휴대폰은 주머니에 넣는다",
      "편한 속도로 5분 걷는다",
      "주변 소리 세 가지를 찾아본다",
      "돌아오며 5분 걷는다"
    ]
  },
  journaling: {
    id: "routine_journaling_5m",
    title: "5분 감정 기록",
    steps: [
      "지금 드는 감정을 한 단어로 적는다",
      "그 감정이 든 상황을 한두 문장으로 적는다",
      "내가 바꿀 수 있는 것과 없는 것을 나눠 본다",
      "오늘 나에게 해 줄 말 한 줄을 적는다"
    ]
  }
};

// 원인별로 어울리는 루틴
const ROUTINE_BY_CAUSE = {
  "업무 스트레스": "breathing",
  "부장/팀장": "journaling",
  야근: "stretch",
  학업: "breathing",
  인간관계: "journaling",
  경제: "journaling",
  건강: "walk",
  미래: "journaling",
  일상: "walk"
};

const round1 = value => Math.round(value * 10) / 10;

// chat_summaries 행들의 keywords를 원인별로 센다. count 내림차순, 같으면 목록 순서.
function countCauses(summaries) {
  const counts = new Map();

  for (const { keywords } of summaries) {
    for (const keyword of new Set(keywords ?? [])) {
      if (CAUSE_KEYWORDS.includes(keyword)) {
        counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .map(([cause, count]) => ({ cause, count }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        CAUSE_KEYWORDS.indexOf(a.cause) - CAUSE_KEYWORDS.indexOf(b.cause)
    );
}

// 하루 스트레스 결과 목록 → 주간 평균·최고일. 점수가 없는 날은 뺀다.
function summarizeDays(dailyResults) {
  const scored = dailyResults.filter(day => day.finalDailyStressScore !== null);

  if (scored.length === 0) {
    return { averageStressScore: null, dayCount: 0, peakDay: null };
  }

  const peak = scored.reduce((max, day) =>
    day.finalDailyStressScore > max.finalDailyStressScore ? day : max
  );

  return {
    averageStressScore: round1(
      scored.reduce((sum, day) => sum + day.finalDailyStressScore, 0) / scored.length
    ),
    dayCount: scored.length,
    peakDay: { date: peak.date, score: peak.finalDailyStressScore }
  };
}

function stressLevel(score) {
  if (score === null) return null;
  if (score >= HIGH_STRESS_SCORE) return "high";
  if (score >= MEDIUM_STRESS_SCORE) return "medium";
  return "low";
}

/**
 * 오늘 점수와 최근 가장 많이 나온 원인으로 추천 문구와 루틴을 고른다.
 * 루틴이 없으면 null (앱이 루틴 버튼을 숨긴다).
 */
function buildRecommendation({ score, topCause }) {
  const level = stressLevel(score);
  const parts = [];

  if (level === "high") {
    parts.push(`오늘 스트레스가 높은 편이에요(${score}점).`);
  } else if (level === "medium") {
    parts.push(`오늘 스트레스는 보통 수준이에요(${score}점).`);
  } else if (level === "low") {
    parts.push(`오늘은 비교적 안정적인 하루예요(${score}점).`);
  } else {
    parts.push("오늘 건강 기록이 아직 충분하지 않아요.");
  }

  if (topCause) {
    parts.push(`최근 일주일 대화에서는 '${topCause}' 이야기가 가장 많았어요.`);
  }

  let routineKey = topCause ? ROUTINE_BY_CAUSE[topCause] : null;
  if (!routineKey && level === "high") routineKey = "breathing";
  if (!routineKey && level === "medium") routineKey = "walk";

  const routine = routineKey ? ROUTINES[routineKey] : null;

  if (routine) {
    parts.push(`잠깐 쉬어 가고 싶다면 '${routine.title}' 루틴을 해 보는 건 어떨까요?`);
  }

  return { level, message: parts.join(" "), routine };
}

module.exports = {
  CAUSE_KEYWORDS,
  ROUTINES,
  countCauses,
  summarizeDays,
  stressLevel,
  buildRecommendation
};
