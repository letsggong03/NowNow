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
function countCauses(summaries, includeCustom = false) {
  const counts = new Map();
  const order = new Map(CAUSE_KEYWORDS.map((keyword, index) => [keyword, index]));

  for (const { keywords } of summaries) {
    for (const keyword of new Set(keywords ?? [])) {
      if (CAUSE_KEYWORDS.includes(keyword) || (includeCustom && typeof keyword === 'string' && keyword.trim() && keyword.length <= 30)) {
        counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .map(([cause, count]) => ({ cause, count }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        (order.get(a.cause) ?? order.size) - (order.get(b.cause) ?? order.size)
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
// 스트레스 수준별 위로·응원 문구. 추천 API가 이 중 하나를 무작위로 고른다(AI 사용 안 함).
const COMFORT_MESSAGES = {
  high: [
    "오늘 정말 애썼어요. 힘든 하루를 버틴 것만으로도 충분히 잘한 거예요.",
    "마음이 많이 무거웠죠? 지금은 잠깐 숨 고르고 쉬어 가도 괜찮아요.",
    "버거운 날엔 다 잘하려고 하지 않아도 돼요. 오늘은 나를 먼저 챙겨 주세요.",
    "지친 마음도 쉬면 다시 가벼워져요. 오늘 하루 정말 수고 많았어요.",
    "혼자 다 짊어지지 않아도 괜찮아요. 뿡뿡이가 옆에서 응원하고 있어요."
  ],
  medium: [
    "조금 지치는 하루였죠? 따뜻한 차 한 잔으로 나를 토닥여 주세요.",
    "오늘도 할 일을 해낸 당신, 충분히 잘하고 있어요.",
    "피곤함이 느껴진다면 오늘은 조금 일찍 쉬어 보는 건 어때요?",
    "작은 쉼표 하나가 내일을 가볍게 만들어 줄 거예요.",
    "애쓴 만큼 쉬는 것도 중요해요. 오늘 하루도 고생했어요."
  ],
  low: [
    "오늘은 마음이 비교적 편안한 하루였네요. 이 기분을 오래 간직해요.",
    "안정적인 하루를 보냈어요. 스스로를 잘 돌보고 있다는 증거예요.",
    "편안한 오늘처럼 내일도 가볍게 시작할 수 있을 거예요.",
    "좋은 하루였네요! 오늘 나를 웃게 한 일을 하나 떠올려 보세요.",
    "잔잔한 하루도 소중해요. 지금의 리듬을 그대로 이어 가요."
  ],
  none: [
    "오늘 하루는 어땠나요? 뿡뿡이에게 편하게 이야기해 주세요.",
    "기록이 아직 적어도 괜찮아요. 오늘의 나를 천천히 돌아봐요.",
    "어떤 하루였든 여기까지 온 당신, 수고했어요.",
    "마음이 궁금한 날엔 짧게라도 오늘을 남겨 보세요.",
    "작은 기록이 쌓이면 나를 더 잘 알 수 있어요. 오늘도 함께해요."
  ]
};

// random은 0 이상 1 미만을 돌려주는 함수(테스트에서 바꿔 끼운다).
const pickOne = (list, random) => list[Math.floor(random() * list.length)];

/**
 * 오늘 점수 수준에 맞는 위로 문구 하나(무작위)와 최근 가장 많이 나온 원인에 맞는 루틴을 고른다.
 * 루틴이 없으면 null (앱이 루틴 버튼을 숨긴다).
 */
function buildRecommendation({ score, topCause }, random = Math.random) {
  const level = stressLevel(score);

  let routineKey = topCause ? ROUTINE_BY_CAUSE[topCause] : null;
  if (!routineKey && level === "high") routineKey = "breathing";
  if (!routineKey && level === "medium") routineKey = "walk";

  return {
    level,
    message: pickOne(COMFORT_MESSAGES[level ?? "none"], random),
    routine: routineKey ? ROUTINES[routineKey] : null
  };
}

module.exports = {
  CAUSE_KEYWORDS,
  COMFORT_MESSAGES,
  ROUTINES,
  countCauses,
  summarizeDays,
  stressLevel,
  buildRecommendation
};
