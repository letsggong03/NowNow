<p align="center">
  <img src="src/assets/images/charactor.png" width="140" alt="뿡뿡이" />
</p>

<h1 align="center">NowNow</h1>

<p align="center">
  캐릭터 <b>뿡뿡이</b>와 놀고 대화하면서 하루의 감정과 컨디션을 기록하고,<br/>
  스마트워치 건강 데이터로 내 상태를 돌아보는 멘탈 케어 앱
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.85-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Kotlin-7F52FF?logo=kotlin&logoColor=white" />
  <img src="https://img.shields.io/badge/Health_Connect-4285F4?logo=android&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white" />
</p>

<!-- 📸 스크린샷을 넣으면 훨씬 좋아요: docs/ 폴더에 이미지를 넣고 아래 표에 경로를 적어 주세요
| 홈 | 채팅 | 리포트 | 설정 |
|---|---|---|---|
| <img src="docs/home.png" width="180"/> | <img src="docs/chat.png" width="180"/> | <img src="docs/report.png" width="180"/> | <img src="docs/mypage.png" width="180"/> |
-->

---

## 💡 기획 의도

감정 일기는 쓰기 귀찮아서 오래가지 못해요.
NowNow는 **캐릭터를 돌보는 가벼운 상호작용**으로 기분과 취향을 자연스럽게 남기게 하고,
**스마트워치로 측정한 심박수·혈압·수면 데이터**와 함께 보여줘서 "오늘 내가 왜 힘들었는지"를 돌아볼 수 있게 했어요.

## ✨ 주요 기능

| 화면 | 기능 |
|---|---|
| 🏠 **홈** | 오늘의 기분 선택, 뿡뿡이에게 먹이 주기·놀아 주기·음악 듣기·휴식(랜덤 선택지), 상호작용 기록 |
| 💬 **채팅** | 뿡뿡이와 감정 일기 형식으로 대화, 키워드 기반 스트레스 요인 요약과 해결책 제안 |
| 📊 **리포트** | **Health Connect 실데이터**로 걸음 수, 심박수, 산소포화도, 혈압, 수면 확인, 추이 차트, 스트레스 원인 카드 |
| ⚙️ **설정** | 계정·알림 설정, 라이트/다크 모드, 데이터 백업, 로그아웃 |
| 🔐 **인증** | Supabase 이메일 회원가입·인증·로그인, 앱을 다시 켜도 로그인 유지 |

## 🏗️ 구조

```
┌──────────── React Native (TypeScript) ────────────┐
│  Home · Chat · Report · MyPage   (커스텀 탭 네비)  │
│        │                     │                    │
│  Supabase Auth/DB      NativeModules              │
│  (AsyncStorage 세션)          │                    │
└───────────────────────────────┼────────────────────┘
                                ▼
                 HealthConnectModule.kt (Kotlin)
                                │  Coroutine(IO)
                                ▼
            Android Health Connect ◀── 스마트워치
     (걸음 수 · 심박수 · SpO₂ · 혈압 · 수면 세션)
```

## 🙋 담당 역할

2인 팀 프로젝트예요. UI 화면과 테마는 [@h2st0ry](https://github.com/h2st0ry)가, 아래 부분은 제가 맡았어요.

### 1. Health Connect 네이티브 모듈 (Kotlin)
- React Native에는 Health Connect를 바로 쓸 수 있는 방법이 마땅치 않아서, **Kotlin으로 네이티브 모듈을 직접 만들고** `NativeModules`로 JS에 연결했어요.
- 걸음 수(오늘 합계), 심박수, 산소포화도, 혈압(오늘 기록), 수면 세션(최근 24시간)을 읽어서 **최신값과 시간별 샘플 목록**으로 정리해 넘겨요.
- 메인 스레드가 막히지 않도록 Coroutine(`Dispatchers.IO`)에서 비동기로 읽고 Promise로 반환해요.
- `AndroidManifest`에 권한을 선언하고, `HealthConnectPackage`를 `MainApplication`에 등록했어요.
- 관련 파일: [`HealthConnectModule.kt`](android/app/src/main/java/com/mibandtest/HealthConnectModule.kt)

### 2. 리포트 화면을 실데이터로 연결
- 목업 데이터로 돼 있던 리포트 화면을 Health Connect 데이터로 바꾸고, `HealthCard`, `TrendChart`, `WeeklyReportItem` 컴포넌트를 다시 구성했어요.

### 3. 인증·세션 (Supabase)
- 이메일 회원가입 → 이메일 인증 → 로그인 흐름을 만들고, `AuthNavigator`와 `TabNavigator`를 세션 상태에 따라 전환하게 했어요.
- `AsyncStorage`로 세션을 저장하고 자동 갱신(`autoRefreshToken`)을 켜서 **앱을 다시 켜도 로그인이 유지**돼요.
- `user_information` 테이블에서 닉네임을 불러와 홈 화면에 보여줘요.

### 4. Android 빌드 문제 해결
- iOS 위주로 세팅돼 있던 프로젝트의 Android 빌드 오류를 해결해서 Android에서도 실행되게 했어요.

## 🛠️ 기술 스택

| 분야 | 사용 기술 |
|---|---|
| 앱 | React Native 0.85, React 19, TypeScript |
| 네이티브 | Kotlin, Android Health Connect, Kotlin Coroutines |
| 백엔드 | Supabase (Auth, PostgreSQL) |
| UI | react-native-svg (차트), lucide-react-native, react-native-gesture-handler |
| 기타 | AsyncStorage, date-fns, ESLint, Prettier, Jest |

## 🚀 실행 방법

```sh
npm install
npm start

# Android (Health Connect 앱이 설치된 기기 필요)
npm run android

# iOS
cd ios && bundle exec pod install && cd ..
npm run ios
```

> 리포트 화면의 건강 데이터는 **Android + Health Connect** 환경에서만 표시돼요.
> 기기에 Health Connect가 설치돼 있고, 스마트워치 앱이 Health Connect와 연동돼 있어야 해요.

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

화면 하나에서만 쓰는 코드는 `screens/*` 안에 두고, 여러 화면에서 쓰는 코드는 `components`, `hooks`, `theme`로 분리했어요.

## 🔭 개선 방향

- 채팅 요약을 키워드 규칙 방식에서 **LLM 기반 감정 분석**으로 바꾸기
- 건강 데이터와 기분 기록을 연결해서 **스트레스 원인을 자동으로 분석**하기
- iOS HealthKit 연동
- 커뮤니티 화면 구현
