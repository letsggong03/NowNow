# 백엔드 연동 요청서 (앱 → 백엔드/AI)

앱(React Native)에서 아직 **목업·하드코딩**으로 채우고 있는 데이터를 정리한 문서입니다.
화면별로 "지금 어디서 가짜 데이터를 쓰는지 → 앱이 필요로 하는 필드 → 제안 API" 순서로 적었습니다.

- 엔드포인트 경로와 이름은 **제안**입니다. 백엔드에서 편한 대로 바꾸고 알려주시면 앱을 맞추겠습니다.
- 필드 이름과 타입은 앱이 실제로 화면에 쓰는 기준입니다. 바뀌면 꼭 공유 부탁드립니다.

## 공통 규칙

| 항목 | 내용 |
| --- | --- |
| 인증 | `Authorization: Bearer <Supabase access_token>` (앱은 Supabase Auth 세션을 이미 갖고 있음) |
| 사용자 식별 | 토큰의 `sub`(= `auth.users.id`)로 식별. 요청 바디에 user_id를 따로 보내지 않음 |
| 시간 | ISO 8601 + 타임존 포함 (`2026-10-20T14:00:00+09:00`). 날짜만 필요할 땐 `YYYY-MM-DD` (KST 기준) |
| 에러 | `{ "error": { "code": "STRING_CODE", "message": "사용자에게 보여줄 수 있는 문장" } }` + 적절한 HTTP 상태 코드 |
| 빈 데이터 | 데이터가 없으면 404 대신 `200` + 빈 배열/`null`로 내려주세요. 앱은 빈 상태 UI로 처리합니다 |

## 우선순위 요약

| 우선순위 | 화면 | 항목 | 담당(예상) |
| --- | --- | --- | --- |
| **P0** | 리포트 | 시간대별 스트레스 / 일일 스트레스 점수 | 백엔드 |
| **P0** | 리포트 | 스트레스 원인 통계 (주간/월간) | 백엔드 |
| **P0** | 채팅 | AI 대화 응답 | AI 서버 |
| **P0** | 채팅 | 하루 요약 + 감정 키워드, 해결책 | AI 서버 |
| P1 | 리포트 | AI 추천 문구 + 맞춤 루틴 | AI 서버 |
| P1 | 리포트 | 주간 리포트 목록 / 상세 | 백엔드 |
| P1 | 채팅 | 대화 기록 조회 | 백엔드 |
| P1 | 홈 | 오늘 기분 저장/조회 | 백엔드 |
| P1 | 홈 | 캐릭터 상호작용(취향) 저장/조회 | 백엔드 |
| P2 | 설정 | 알림 설정, 스트레스 기준 설정 | 백엔드 |
| P2 | 설정 | 프로필 상태 메시지 | 백엔드 |
| P2 | 커뮤니티 | 전체 (현재 준비 중 화면) | 미정 |

---

## 1. 리포트 화면

### 1-1. 시간대별 스트레스 · 일일 스트레스 점수 (P0)

**지금 상태**: [`reportData.ts`](../src/screens/Report/constants/reportData.ts)의 `todayHRVData` 고정 배열을 씁니다.
이 배열에서 "가장 스트레스가 높은 시간"과 "가장 안정적인 시간" 카드를 계산합니다.

**화면에서 쓰는 값**: 시각, 스트레스 수치(0~100), 그 시각의 메모(예: "프로젝트 회의").
기획에 있던 `FinalDailyStressScore`(100점 만점)도 함께 내려주시면 리포트에 표시하겠습니다.

```
GET /reports/daily/stress?date=2026-10-20
```

```json
{
  "date": "2026-10-20",
  "dailyStressScore": 68,
  "timeline": [
    { "time": "2026-10-20T09:00:00+09:00", "hrv": 55, "stress": 65, "note": null },
    { "time": "2026-10-20T14:00:00+09:00", "hrv": 45, "stress": 85, "note": "프로젝트 회의" }
  ],
  "peak":   { "time": "2026-10-20T14:00:00+09:00", "stress": 85, "note": "프로젝트 회의" },
  "lowest": { "time": "2026-10-20T03:00:00+09:00", "stress": 35, "note": "수면 중 안정적인 흐름" }
}
```

- `timeline` 간격은 백엔드 계산 단위에 맞춰 주세요(1시간 권장).
- `peak`/`lowest`는 앱에서 `timeline`으로 계산할 수도 있지만, `note`는 서버만 알 수 있어서 같이 받는 게 좋습니다.
- `note`가 없으면 앱이 기본 문구("업무 관련 스트레스" / "수면 중 안정적인 흐름")를 보여줍니다.

### 1-2. 스트레스 원인 통계 (P0)

**지금 상태**: `weeklyStressData`, `monthlyStressData` 고정 배열을 씁니다. 원인 이름도 하드코딩입니다("업무 스트레스", "부장/팀장", "야근" …).

```
GET /reports/stress-causes?period=week     # week | month
```

```json
{
  "period": "week",
  "from": "2026-10-13",
  "to": "2026-10-19",
  "causes": [
    { "cause": "업무 스트레스", "count": 4 },
    { "cause": "부장/팀장", "count": 3 },
    { "cause": "야근", "count": 2 }
  ]
}
```

- 정렬은 `count` 내림차순으로 해주세요. 앱은 첫 번째 원인을 "가장 큰 원인"으로 씁니다.
- 퍼센트는 앱에서 `count`로 계산합니다. 서버에서는 안 보내도 됩니다.
- 원인 이름은 채팅 요약 키워드(2-2)와 **같은 분류 체계**를 써야 통계와 대화 내용이 맞습니다.

### 1-3. AI 추천 문구 · 맞춤 루틴 (P1)

**지금 상태**: [`InsightCard.tsx`](../src/screens/Report/components/InsightCard.tsx)에서
`"이번 기록에서는 {원인}이 가장 크게 나타났어요. 짧은 호흡 루틴이나 10분 산책이 도움이 될 수 있어요."`를 템플릿으로 만듭니다.
"맞춤형 루틴 시작하기" 버튼은 **눌러도 아무 동작이 없습니다.**

```
GET /reports/recommendation?date=2026-10-20
```

```json
{
  "message": "이번 주에는 야근이 가장 크게 나타났어요. 퇴근 후 10분 스트레칭을 해보는 건 어떨까요?",
  "routine": {
    "id": "routine_stretch_10m",
    "title": "10분 스트레칭",
    "steps": ["목 돌리기 1분", "어깨 으쓱하기 2분", "..."]
  }
}
```

- `routine`이 `null`이면 앱이 버튼을 숨깁니다.
- 루틴 화면을 어떻게 만들지는 아직 미정입니다. `steps` 구조는 같이 정하면 좋겠습니다.

### 1-4. 주간 리포트 목록 · 상세 (P1)

**지금 상태**: 목록 제목만 앱에서 날짜로 계산합니다(지난 4주, "2026년 10월 셋째 주" 형식). 실제 리포트가 있는지는 모르고, 항목을 눌러도 상세 화면이 없습니다.

```
GET /reports/weekly?limit=4
```

```json
{
  "items": [
    { "weekStart": "2026-10-12", "weekEnd": "2026-10-18", "averageStressScore": 62, "topCause": "야근" }
  ]
}
```

```
GET /reports/weekly/2026-10-12
```

- 상세 화면에 무엇을 보여줄지(일별 점수 그래프, 원인 비율, AI 총평 등)는 **기획 협의가 필요**합니다. 일단 목록 API만 있어도 화면에 연결할 수 있습니다.
- 주 시작은 **월요일**, 제목 규칙은 "목요일이 속한 달의 N째 주"로 앱이 계산합니다. 서버도 같은 기준이면 좋겠습니다.

### 참고: 건강 원본 데이터 (앱 → DB, 이미 연결됨)

심박·혈압·산소포화도는 앱이 Health Connect에서 읽어 Supabase에 **직접 upsert**합니다([`ReportPage.tsx`](../src/screens/Report/ReportPage.tsx)). 1-1 스트레스 계산의 입력으로 쓰시면 됩니다.

| 테이블 | 컬럼 | upsert 기준 |
| --- | --- | --- |
| `heart_rate_records` | `user_id`, `measured_at`, `bpm` | `(user_id, measured_at)` |
| `blood_pressure_records` | `user_id`, `measured_at`, `systolic`, `diastolic` | `(user_id, measured_at)` |
| `oxygen_records` | `user_id`, `measured_at`, `percentage` | `(user_id, measured_at)` |

- **걸음 수와 수면은 아직 저장하지 않습니다.** 앱 화면에는 표시되지만 DB에는 없습니다. 스트레스 점수 공식에 걸음·수면이 들어가므로 테이블이 필요합니다(앱 쪽 저장 코드는 제가 붙이겠습니다).
  - 제안: `step_records(user_id, date, steps_total)`, `sleep_records(user_id, start_time, end_time, minutes)`
- 에뮬레이터 개발 환경에서는 [`mockHealthData.ts`](../src/services/health/mockHealthData.ts) 목업을 화면에만 쓰고, DB에는 저장하지 않습니다.

---

## 2. 채팅 화면

**지금 상태**: AI와 전혀 연결되어 있지 않습니다. 봇 대사는 모두 [`chatScript.ts`](../src/screens/Chat/constants/chatScript.ts)의 고정 문장이고,
요약 키워드는 [`analyzeStory.ts`](../src/screens/Chat/utils/analyzeStory.ts)에서 "팀장/부장/상사", "야근" 같은 단어가 들어 있는지만 보고 만듭니다.
대화 기록도 저장하지 않아서 화면을 나가면 사라집니다.

현재 앱의 대화 흐름:

1. 봇 첫 인사 (지금은 기분과 상관없이 항상 "오늘 기분이 좋지 않아 보여…")
2. 사용자 메시지마다 공감 응답
3. 사용자 메시지가 3개 쌓이면 "오늘 하루를 정리해드릴까요?" + [예/아니오]
4. 예 → 하루 요약 + 감정 키워드 → "해결책도 알려드릴까요?" + [예/아니오]
5. 예 → 해결책 3개 → 스트레스 완화 활동 버튼 [편안한 우리집 / 명상 / 커뮤니티에 털어놓기]

### 2-1. 대화 메시지 전송 (P0)

```
POST /chat/messages
```

```json
// request
{ "date": "2026-10-20", "message": "오늘 부장님한테 또 깨졌어" }

// response
{
  "reply": {
    "content": "그런 일이 있었구나… 많이 속상했겠다. 어떤 일이었는지 더 들려줄래?",
    "createdAt": "2026-10-20T21:03:00+09:00",
    "buttons": null
  },
  "safety": { "flagged": false }
}
```

- `buttons`를 서버가 내려주면 그대로 버튼으로 그립니다. 형식은 `[{ "label": "예", "action": "summarize_yes" }]`입니다.
  - 앱이 이미 처리할 수 있는 `action`: `summarize_yes`, `summarize_no`, `solution_yes`, `solution_no`, `home`, `meditation`, `community`
  - 새 `action`이 필요하면 미리 알려주세요.
- "3개 쌓이면 요약 제안" 같은 흐름을 **서버(AI)가 판단할지, 앱이 지금처럼 판단할지** 정해야 합니다. 서버가 판단하면 응답의 `buttons`로 내려주시면 됩니다.
- README의 안전 가드레일(위험 수치 감지)이 응답에 들어간다면 `safety` 같은 필드로 구분해 주세요. 앱에서 강조 UI를 따로 그리겠습니다.

### 2-2. 하루 요약 · 감정 키워드 (P0)

```
POST /chat/summary
```

```json
// request
{ "date": "2026-10-20" }

// response
{
  "summary": "오늘은 부장님과의 일과 늦은 퇴근 때문에 지친 하루였어요.",
  "keywords": ["부장/팀장", "야근"]
}
```

- `keywords`는 1-2 스트레스 원인과 같은 분류값으로 저장되어야 통계에 반영됩니다.
- 앱은 키워드 앞에 `#`을 붙여서 보여줍니다. 서버에서는 `#` 없이 보내주세요.

### 2-3. 해결책 · 완화 활동 (P0)

```
POST /chat/solutions
```

```json
// request
{ "date": "2026-10-20" }

// response
{
  "solutions": [
    "잠깐 일에서 벗어나 좋아하는 활동을 해보는 건 어떨까요?",
    "가벼운 산책이나 스트레칭으로 몸의 긴장을 풀어보세요."
  ],
  "reliefActions": ["home", "meditation", "community"]
}
```

- `reliefActions`는 위 `action` 목록 중에서 골라 주세요. 버튼 문구는 앱이 갖고 있습니다.

### 2-4. 첫 인사 · 대화 기록 (P1)

```
GET /chat/messages?date=2026-10-20
```

```json
{
  "messages": [
    { "role": "bot", "content": "오늘 기분이 좋아 보여! 무슨 좋은 일 있었어?", "createdAt": "...", "buttons": null },
    { "role": "user", "content": "...", "createdAt": "..." }
  ]
}
```

- 그날 대화가 없으면 서버가 **첫 인사 한 줄**을 만들어 `messages`에 넣어 주세요. 오늘 기분(3-1)과 건강 데이터를 반영하면 좋겠습니다.
- `role`은 `user` | `bot` 두 가지입니다.

---

## 3. 홈 화면

### 3-1. 오늘 기분 (P1)

**지금 상태**: 기분 선택(`sad` | `neutral` | `happy`)이 화면 상태에만 있고 저장되지 않습니다. 앱을 다시 켜면 항상 `neutral`로 돌아갑니다.

```
PUT /moods/2026-10-20      { "mood": "happy" }
GET /moods/2026-10-20   →  { "date": "2026-10-20", "mood": "happy", "updatedAt": "..." }   // 기록 없으면 mood: null
```

### 3-2. 캐릭터 상호작용 · 취향 (P1)

**지금 상태**: "먹이 주기 / 놀아 주기 / 음악 듣기 / 휴식 취하기"에서 고른 선택이 화면에만 남고 저장되지 않습니다.
선택지 목록은 [`preferenceOptions.ts`](../src/screens/Home/constants/preferenceOptions.ts)에 고정돼 있습니다.

```
POST /character/interactions    { "action": "feed", "choice": "매운 닭발" }
GET  /character/interactions?date=2026-10-20
  → { "items": [ { "action": "feed", "choice": "매운 닭발", "createdAt": "..." } ] }
```

- `action`: `feed` | `play` | `music` | `hobby`
- README의 "나를 기억하는 AI 캐릭터" 기능을 생각하면, 이 취향 데이터를 AI 서버 RAG 컨텍스트에 넣으면 좋을 것 같습니다.
- 선택지 목록은 당분간 앱에 두겠습니다. 서버에서 개인화하고 싶으면 `GET /character/preference-options?action=feed`로 바꿀 수 있습니다.
- 기분별 캐릭터 말풍선 문구도 지금은 고정입니다. AI로 만들고 싶으면 추가 요청 드리겠습니다(우선순위 낮음).

---

## 4. 설정 화면

### 4-1. 프로필 (P2)

**지금 상태**: 닉네임은 Supabase `user_informations` 테이블에서 직접 읽습니다(회원가입 때 `id`, `nickname` 저장). 상태 메시지("뿡뿡이와 함께 마음을 돌보는 중")는 고정입니다.

- `user_informations` 테이블 이름과 컬럼(`id`, `nickname`)이 실제 스키마와 맞는지 **확인 부탁드립니다.** 예전 코드에는 `user_information`/`user_id`로 되어 있어서 앱에서 회원가입 쪽 기준으로 맞춰 두었습니다.
- 상태 메시지를 사용자가 바꿀 수 있게 하려면 `status_message` 컬럼을 추가하거나 `PATCH /me`를 열어 주세요.

### 4-2. 알림 · 스트레스 기준 설정 (P2)

**지금 상태**: 아래 메뉴는 화면에 있지만 **누르면 아무 동작도 하지 않습니다.**

| 메뉴 | 필요한 것 |
| --- | --- |
| 알림 설정 (일기 알림, 루틴 알림) | 알림 on/off, 알림 시각, 푸시 토큰 등록 |
| 스트레스 기준 관리 | 사용자별 스트레스 감지 기준값 (1-1 계산과 안전 가드레일에 반영) |
| 계정 설정 / 개인정보 보호 | 비밀번호 변경은 Supabase Auth로 앱에서 처리 가능. 회원 탈퇴는 서버 API 필요 |
| 데이터 백업 | 범위 미정 (내보내기 형식 협의 필요) |

```
GET /me/settings
PUT /me/settings
```

```json
{
  "notifications": { "diary": true, "routine": false, "diaryTime": "21:00" },
  "stressThreshold": 75
}
```

```
POST   /me/push-tokens   { "token": "...", "platform": "android" }
DELETE /me               // 회원 탈퇴
```

- 라이트/다크 모드는 기기별 설정이라 앱에만 저장하겠습니다. 서버는 필요 없습니다.

---

## 5. 커뮤니티 (P2)

화면만 있고 "준비 중" 상태입니다. 채팅의 "커뮤니티에 털어놓기" 버튼도 지금은 안내 문구만 띄웁니다. 기능 범위가 정해지면 따로 정리하겠습니다.

---

## 결정이 필요한 것

1. **채팅 흐름 주도권**: 요약/해결책 제안 시점을 AI 서버가 정할지, 앱이 지금처럼 메시지 개수로 정할지 (2-1)
2. **스트레스 원인 분류 체계**: 채팅 키워드와 리포트 통계가 같은 목록을 써야 합니다 (1-2, 2-2)
3. **걸음 수·수면 테이블** 추가 여부와 스키마 (1-1 참고)
4. **주간 리포트 상세** 화면에 보여줄 내용 (1-4)
5. **맞춤 루틴** 데이터 구조와 화면 (1-3)
