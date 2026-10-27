<p align="center">
  <img src="src/assets/images/charactor.png" width="140" alt="뿡뿡이" />
</p>

<h1 align="center">NowNow (나우나우)</h1>

<p align="center">
  스마트워치 생체 데이터로 스트레스를 측정하고,<br/>
  나를 기억하는 AI 캐릭터 <b>뿡뿡이</b>와 대화하며 관리하는 웰니스 케어 앱
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.85-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Kotlin-7F52FF?logo=kotlin&logoColor=white" />
  <img src="https://img.shields.io/badge/Health_Connect-4285F4?logo=android&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/pgvector-336791?logo=postgresql&logoColor=white" />
</p>

<p align="center">
  2026.03 ~ 2026.06 · 4인 팀 프로젝트 · 이 레포는 <b>모바일 앱(React Native)</b> 파트입니다
</p>

<!-- 📸 스크린샷: docs/ 폴더에 이미지를 넣고 경로를 바꿔 주세요
| 로그인 | 홈 | 실시간 리포트 | 주간 리포트 | 다크모드 |
|---|---|---|---|---|
| <img src="docs/login.jpg" width="160"/> | <img src="docs/home.jpg" width="160"/> | <img src="docs/report-daily.jpg" width="160"/> | <img src="docs/report-weekly.jpg" width="160"/> | <img src="docs/dark.jpg" width="160"/> |
-->

---

## 💡 기획 배경

- 스트레스를 받아도 **38.1%는 별다른 대처 없이 혼자 참는다**고 답했어요. (서울대 보건대학원 조사, 1,500명 대상)
- 국내 우울증 환자는 2024년 약 110만 명으로 5년 새 33% 늘었지만, 스트레스 인지율은 오히려 줄었어요. 스트레스를 **알아차리지 못하고 방치**하는 경우가 많다는 뜻이에요.
- 삼성헬스, Welltory 같은 기존 서비스는 측정값을 보여주는 데서 끝나요.

NowNow는 **항상 차고 있는 스마트워치**로 스트레스를 꾸준히 측정하고, 그 데이터를 아는 **AI 캐릭터와의 대화**로 정서적 케어까지 이어지게 만든 앱이에요.

## ✨ 주요 기능

| 기능 | 설명 |
|---|---|
| ⌚ **건강 데이터 수집** | 갤럭시워치 → Health Connect로 심박수, 걸음 수, 수면, 혈압, 혈중산소 수집 |
| 📈 **스트레스 지수** | 심박수와 pseudo-HRV로 시간대별 스트레스를 계산하고, 수면·걸음 수·혈압·혈중산소를 반영해 **100점 만점 일일 스트레스 지수** 산출 |
| 💬 **AI 챗봇** | 건강 데이터, 과거 대화(RAG), 페르소나를 합쳐 답하는 맞춤형 챗봇, 위험 수치 감지 시 안내하는 안전 가드레일 |
| 📊 **리포트** | 실시간 리포트(오늘의 건강 데이터)와 주간 리포트(7일 건강·대화 데이터 기반 스트레스 변화) |
| 🐣 **캐릭터 상호작용** | 뿡뿡이에게 먹이 주기·놀아 주기·음악·취미 선택, 선택 결과는 선호도로 저장해 챗봇 응답에 활용 |
| 🔐 **인증·설정** | Supabase 이메일 회원가입·로그인, 세션 유지, 라이트/다크 모드 |

## 🏗️ 시스템 구성

```
 Galaxy Watch
     │
     ▼
 Health Connect ──▶ HealthConnectModule.kt (Kotlin, RN Bridge)
                              │
                ┌─────────────▼──────────────┐
                │   React Native App (이 레포) │
                └──────┬───────────────┬──────┘
                       │               │
            Node.js / Express     Python FastAPI (AI 서버)
            (인증·채팅·리포트 API)   (gpt-4o-mini, LangChain, RAG)
                       │               │
                       └──────┬────────┘
                              ▼
                Supabase PostgreSQL + pgvector
        (사용자 · 건강 raw · 채팅 · 리포트 · 임베딩)
```

## 👥 팀 구성

| 파트 | 담당 |
|---|---|
| 백엔드 | Node.js/Express 서버, 인증·채팅·리포트 API |
| AI | FastAPI AI 서버, 프롬프트 엔지니어링, RAG 파이프라인 |
| DB 설계·UI | ERD 설계, 전체 화면 UI/UX와 초기 프론트엔드 ([@h2st0ry](https://github.com/h2st0ry)) |
| **건강 데이터·DB 구현·프론트 마무리** | **본인** (아래 참고) |

## 🙋 담당 역할

### 1. Health Connect 건강 데이터 모듈 (Kotlin)
- 원래 삼성헬스 SDK를 쓰려고 개발 권한을 신청했지만 프로젝트 기간 안에 승인이 나지 않았어요. 그래서 구글·삼성이 함께 만든 **Health Connect로 방향을 바꿨어요.**
- **Kotlin으로 네이티브 모듈을 직접 개발**해서 걸음 수(오늘 합계), 심박수, 산소포화도, 혈압, 수면 세션(최근 24시간)을 읽어요. 최신값과 시간별 샘플 목록으로 정리해서 넘겨요.
- 처음에는 앱과 따로 도는 구조여서 통합이 어려웠어요. **React Native Bridge(`NativeModules`)로 연결**해서 앱 안에서 바로 쓸 수 있게 했어요.
- 메인 스레드가 멈추지 않도록 Coroutine(`Dispatchers.IO`)에서 비동기로 읽고 Promise로 반환해요.
- 수집한 데이터는 Supabase raw 테이블에 저장되는 것까지 확인했어요.
- **갤럭시워치를 실제로 착용하고** 데이터가 쌓이는지 테스트했어요.
- 관련 파일: [`HealthConnectModule.kt`](android/app/src/main/java/com/mibandtest/HealthConnectModule.kt)

### 2. 스트레스 지수 로직 설계
- 심박변이도(HRV)와 스트레스에 관한 논문을 찾아보고 데이터별 점수 기준을 정했어요.
- 갤럭시워치의 ECG 원시 데이터는 플랫폼 정책 때문에 접근할 수 없었어요. 대신 **심박수 표준편차로 pseudo-HRV를 계산**했어요.
- 시간대별 스트레스 → 일일 스트레스 → 혈압·걸음 수 반영 → 수면 반영 순서로 **100점 만점 `FinalDailyStressScore` 공식**을 작성했어요.

### 3. 데이터베이스 구현 (Supabase)
- 설계된 ERD를 검토한 뒤 Supabase 환경에 맞게 반영했어요.
- 사용자, 건강 데이터, 채팅, 리포트 테이블과 테이블 간 관계를 구현했어요.
- 사용하는 LLM 임베딩 차원에 맞춰 **pgvector 컬럼**을 설계했어요.
- 건강 데이터 전용 **raw 테이블**을 설계하고 구현했어요.

### 4. 프론트엔드 마무리
- 로그인·회원가입 UI와 기능(Supabase Auth, 이메일 인증)을 구현했어요. `AsyncStorage`로 세션을 저장해서 앱을 다시 켜도 로그인이 유지돼요.
- 리포트 페이지를 **실시간 리포트와 주간 리포트**로 다시 구성했어요.
- 실시간 리포트에 오늘의 걸음 수, 심박수, 수면, 혈압이 실제 데이터로 표시되게 했어요.
- AI 서버의 채팅 API를 앱에 연결했어요.
- iOS 위주로 세팅돼 있던 프로젝트의 Android 빌드 오류를 해결했어요.

### 5. 시스템 아키텍처
- React Native, Node.js, Supabase, OpenAI 사이의 데이터 흐름을 설계했어요.
- 시스템 구성도 초안과 최종본을 작성했어요.

## 🧯 트러블슈팅

| 문제 | 해결 |
|---|---|
| 삼성헬스 SDK 개발 권한을 기간 내에 받지 못함 | Health Connect로 전환해 Kotlin 모듈을 직접 개발 |
| Kotlin 모듈이 앱과 따로 동작해서 통합하기 어려움 | React Native Bridge로 네이티브 모듈을 등록해 JS에서 호출 |
| 정밀한 HRV에 필요한 ECG 원시 데이터에 접근할 수 없음 | 심박수 표준편차 기반 pseudo-HRV로 대체 |
| iOS 기준 프로젝트라 Android 빌드 실패 | 빌드 설정을 정리해 Android 실기기에서 실행 |

## 🛠️ 기술 스택

| 분야 | 사용 기술 |
|---|---|
| 앱 | React Native 0.85, React 19, TypeScript, React Navigation |
| 네이티브 | Kotlin, Health Connect 1.1.0, Kotlin Coroutines |
| DB·인증 | Supabase PostgreSQL, pgvector, Supabase Auth |
| 백엔드 (팀) | Node.js 22, Express 5 |
| AI (팀) | Python, FastAPI, OpenAI gpt-4o-mini, LangChain |
| UI | react-native-svg (차트), lucide-react-native, react-native-gesture-handler |

## 🚀 실행 방법

```sh
npm install
npm start

# Android (Health Connect가 설치되고 스마트워치와 연동된 기기 필요)
npm run android

# iOS
cd ios && bundle exec pod install && cd ..
npm run ios
```

> 건강 데이터는 **Android + Health Connect** 환경에서만 표시돼요.

## 📁 폴더 구조

```
src
├─ navigation/     # Root(세션 분기) · Auth · Tab 네비게이터
├─ screens/        # 화면별 폴더 (컴포넌트·훅·상수·타입을 화면 안에 둠)
│   ├─ Home/ Chat/ Report/ Profile/ Login/ Community/
├─ services/       # supabase 클라이언트, API
├─ theme/          # ThemeProvider (라이트/다크), colors, spacing
└─ assets/
android/app/src/main/java/com/mibandtest/
└─ HealthConnectModule.kt, HealthConnectPackage.kt
```

## 🔭 앞으로 해볼 것

- PMS(월경 전 증후군)로 인한 감정 기복 케어용 챗봇 페르소나 확장, 민감 정보 보안 강화
- iOS HealthKit 연동
