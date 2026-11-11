# 백그라운드 건강 데이터 동기화 설계

> 상태: **설계만 있음, 아직 구현 안 함.** 지금은 앱이 켜져 있을 때만 증분 동기화를 해요([`healthSync.ts`](../src/services/health/healthSync.ts)).
> Changes 토큰이 있어서 앱을 며칠 안 켜도 기록이 빠지지는 않지만, 서버에는 앱을 켜야 들어가요.
> 그래서 매일 03:00 스트레스 배치나 서버 푸시 알림은 앱을 안 켠 사용자의 데이터를 못 봐요.

## 목표

- 앱을 열지 않아도 Health Connect 기록이 몇 시간 안에 서버에 들어간다.
- 앱 안의 동기화와 백그라운드 동기화가 **같은 시작점(Changes 토큰)** 을 써서, 기록이 빠지거나 두 번 들어가지 않는다.
- 백그라운드 작업 때문에 앱의 로그인 세션이 깨지지 않는다.

## 왜 단순하게 안 되는가

| 문제 | 내용 |
|---|---|
| 로그인 토큰 | 세션은 JS의 Supabase 클라이언트가 들고 갱신해요. 네이티브가 같은 refresh token으로 갱신하면 Supabase가 토큰을 돌려 써서(rotation) 한쪽이 무효가 되고, 앱을 켰을 때 로그아웃될 수 있어요. |
| JS 재사용(HeadlessJS) | Android 8+는 백그라운드에서 서비스 시작을 막아요. RN 0.85 새 아키텍처(bridgeless)에서 Worker 안에 JS 런타임을 띄우는 것도 불안정해요. |
| 권한 | 백그라운드 읽기는 `android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND`를 따로 받아야 하고, 기기·Health Connect 버전에 따라 지원 여부가 달라요. |
| 실행 시점 | WorkManager 주기 작업은 최소 15분, Doze·절전 모드에서는 더 밀려요. 삼성 기기는 배터리 최적화로 앱을 자주 멈춰요. |
| 스토어 심사 | Play Health Connect 정책에 백그라운드 접근 사유를 따로 적어야 해요. |

## 설계: 기기 동기화 토큰 + 네이티브 Worker

JS 세션을 건드리지 않도록 **백그라운드 전용 토큰**을 따로 발급하고, Health Connect 읽기·전송은 Kotlin Worker가 직접 한다.

```
 [앱 로그인 상태]                                  [백그라운드]
 JS ── POST /api/devices/sync-token ──▶ 서버        WorkManager (1시간 주기, 네트워크 있을 때)
        (Supabase 로그인 토큰)          │                │
                                        ▼                ▼
                     device_sync_tokens 에 해시 저장    HealthSyncWorker.kt
 JS ◀── 원문 토큰 1회 반환                              ├─ EncryptedSharedPreferences에서 기기 토큰·Changes 토큰 읽기
 JS ──▶ 네이티브 setDeviceSyncToken() ── 암호화 저장     ├─ Health Connect getChanges() (앱 내 동기화와 같은 코드)
                                                         └─ POST /api/health/records  (Authorization: Device <토큰>)
                                                                 │ 성공했을 때만 Changes 토큰 저장
                                                                 ▼
                                                         서버: 기기 토큰 → user_id 확인 후 저장
```

### 1. 서버

**테이블 `device_sync_tokens`**

| 컬럼 | 설명 |
|---|---|
| `token_id` | PK |
| `user_id` | `auth.users(id)` FK, `on delete cascade` (탈퇴하면 같이 삭제) |
| `token_hash` | SHA-256 해시. 원문은 저장하지 않음 |
| `device_label` | 기기 모델명 (설정 화면 표시용) |
| `created_at`, `last_used_at`, `revoked_at` | 사용·폐기 기록 |

- RLS: 본인 행 조회만 허용, 쓰기는 서버(service role)만.

**API**

| 메서드 | 경로 | 인증 | 동작 |
|---|---|---|---|
| POST | `/api/devices/sync-token` | 로그인 토큰 | 이 기기의 예전 토큰을 폐기하고 새 토큰 발급. 원문은 응답에서 한 번만 줌 |
| DELETE | `/api/devices/sync-token` | 로그인 토큰 | 이 기기 토큰 폐기 (로그아웃할 때) |
| POST | `/api/health/records` | 로그인 토큰 **또는** `Device` 토큰 | 기존 저장 API. 기기 토큰은 **이 경로만** 허용 |

- 미들웨어 `requireDeviceOrUser`: `Authorization: Device <토큰>`이면 해시로 찾고, 폐기 안 됐으면 `req.user = { id: user_id }`로 둔다. 찾으면 `last_used_at`을 갱신한다.
- 기기 토큰은 건강 기록 저장 말고는 아무것도 못 한다(채팅·설정·조회 불가). 유출돼도 피해 범위가 "그 사용자 계정에 건강 기록 쓰기"로 한정된다.
- 비밀번호를 바꾸거나 탈퇴하면 그 사용자의 기기 토큰을 전부 폐기한다.

### 2. 네이티브 (Kotlin)

- **동기화 로직을 네이티브로 모은다.** 지금 JS의 `healthSync.ts`가 들고 있는 상태(Changes 토큰, 마지막 동기화 시각)와 요청 분할(`healthSyncPayload.ts`)을 Kotlin `HealthSyncEngine`으로 옮긴다.
  - 앱 안의 동기화도 JS가 `HealthConnectModule.syncNow()`만 부르게 바꾼다. 두 경로가 같은 엔진·같은 상태를 쓰므로 토큰이 엇갈리지 않는다.
  - 엔진은 `Mutex`로 한 번에 하나만 돈다(앱 내 동기화와 Worker가 동시에 실행되지 않게).
- **저장소**: `EncryptedSharedPreferences`에 기기 토큰·Changes 토큰·마지막 동기화 시각·API 주소를 저장한다.
- **`HealthSyncWorker` (CoroutineWorker)**
  - `PeriodicWorkRequest` 1시간, 제약: `NetworkType.CONNECTED`, `BatteryNotLow`.
  - `ExistingPeriodicWorkPolicy.KEEP`으로 한 번만 등록한다. 로그인할 때 등록하고 로그아웃할 때 취소한다.
  - 실행 순서: 기기 토큰 없음 → 종료 / 백그라운드 권한 없음 → 종료 / 엔진 실행 → 서버 401이면 토큰 삭제 후 종료(다음에 앱을 켜면 다시 발급) / 네트워크·5xx 오류면 `Result.retry()`(지수 백오프).
- **권한**: Health Connect 지원 여부를 `HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_IN_BACKGROUND`로 확인하고, 지원할 때만 권한 요청 목록에 넣는다. 지원 안 하는 기기는 지금처럼 앱 내 동기화만 쓴다.
- Manifest에 `READ_HEALTH_DATA_IN_BACKGROUND`를 추가한다.

### 3. 앱 (JS)

- 로그인·세션 복원 시: 기기 토큰이 없으면 발급받아 `setDeviceSyncToken()`으로 넘기고 Worker를 등록한다.
- 로그아웃 시: 서버 토큰 폐기 → 네이티브 저장소 비우기 → Worker 취소. 다른 계정으로 로그인하면 Changes 토큰도 초기화한다(다른 사람의 시작점을 이어받지 않게).
- 마이페이지에 "백그라운드 동기화" 상태를 보여준다: 권한 여부, 마지막 동기화 시각, 삼성 기기면 배터리 최적화 예외 설정으로 가는 버튼.

## 실패·예외 상황

| 상황 | 동작 |
|---|---|
| 네트워크 없음, 서버 5xx | Changes 토큰을 안 옮기고 `retry`. 다음 실행이 같은 변경분부터 다시 보냄 (서버는 upsert라 중복 안 생김) |
| 기기 토큰 폐기·만료 (401) | 저장된 토큰 삭제, Worker는 조용히 종료. 앱을 켜면 다시 발급 |
| Changes 토큰 만료 (30일) | 지금과 같이 마지막 동기화 하루 전부터 다시 읽기 |
| 백그라운드 권한 회수 | Worker 종료, 마이페이지에 권한 안내 표시 |
| 앱 강제 종료, 재부팅 | WorkManager가 다시 예약함 (`RECEIVE_BOOT_COMPLETED`는 이미 선언돼 있음) |
| 앱 내 동기화와 Worker가 동시에 실행 | 엔진 `Mutex`로 순서대로 실행 |

## 검증 계획 (실기기)

1. 앱을 완전히 종료하고 워치를 찬 채 2~3시간 둔 뒤 `heart_rate_records`에 새 행이 들어왔는지 확인
2. `adb shell cmd jobscheduler run -f <패키지> <job id>` 또는 WorkManager 테스트 도구로 Worker 강제 실행
3. 비행기 모드로 실행 → `retry` 후 네트워크를 다시 켜면 빠짐없이 들어가는지 확인
4. 로그아웃 → 서버 토큰 폐기, Worker 취소 확인. 다른 계정으로 로그인 → 이전 계정 데이터가 섞이지 않는지 확인
5. 삼성 기기에서 절전 모드·"사용하지 않는 앱 절전" 상태 확인
6. 재부팅 후 Worker가 다시 도는지 확인

## 예상 작업량

| 작업 | 규모 |
|---|---|
| 서버: 테이블·마이그레이션, 발급·폐기 API, 미들웨어, 테스트 | 반나절 |
| Kotlin: 엔진 이전, Worker, 암호화 저장소, 권한 | 반나절~하루 |
| JS: 로그인·로그아웃 연동, 상태 화면 | 몇 시간 |
| 실기기 테스트 | 하루 |
