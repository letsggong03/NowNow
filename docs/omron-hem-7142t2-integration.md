# HEM-7142T2 직접 연동 검토

목표는 OMRON connect 앱을 거치지 않고 Android 나우나우에서 측정 완료값을 읽는 것이다.

## 확인한 자료

- [한국오므론 연동 안내](https://www.omron-healthcare.co.kr/products/digital-healthcare)는 HEM-7142T2를 제품별 표에 포함하고 Direct to Device 방식과 개발 자료를 안내한다.
- [OMRON Connectivity SDK](https://omron-connect-create.readme.io/docs/getting-started)는 앱 내 BLE 연동을 안내한다. 글로벌 SDK 표에서 한국 제공 여부가 명확하지 않아 국내 모델과 Android 샘플의 제공 조건은 한국오므론에 확인한다.
- [hass-omron](https://github.com/eigger/hass-omron)은 HEM-7142T2를 직접 연동 검증 모델로 명시한다. Home Assistant용 Python 구현이다.
- [OmSyncer](https://github.com/thiagokokada/OmSyncer)는 안드로이드에서 페어링한 오므론 혈압계의 측정값을 읽는 공개 예제다. 국내 HEM-7142T2의 실기기 동작은 별도로 확인한다.

## 나우나우 적용 및 확인 순서

1. S24에 연결해 혈압계의 페어링·검색과 측정 완료값 수신을 검증한다. 기기 표시와 수축기·이완기 값 및 단위를 대조한다.
2. 검증한 수신 경로를 내 설정의 혈압계 연결 메뉴에 붙인다. 첫 검증은 앱 화면에 표시하는 것까지 진행한다.
3. 저장 연결 시 블루투스·Health Connect·직접 입력의 출처를 구분하고, 같은 측정 기록을 다시 받았을 때 중복 저장을 확인한다.

현재 작업 브랜치에는 연결 준비 안내와 혈압 직접 입력이 있다. S24가 PC에서 감지되지 않아 실기기 검증은 대기 중이다.

## 혈압 기록 입력 경로와 실기기 확인

| 경로 | 처리 및 확인 범위 |
| --- | --- |
| 갤럭시 워치 | 삼성 헬스 모니터에서 측정한다. Health Connect에 공유된 혈압은 나우나우에서 읽을 수 있다. |
| 오므론 혈압계 | HEM-7142T2 → 오므론 커넥트 → Health Connect → 나우나우. S24에서 오므론 커넥트와 나우나우의 수축기·이완기 값이 일치함을 확인했다. |
| 직접 입력 | 나우나우 리포트에서 수축기·이완기 혈압을 입력하고 로그인한 계정에 저장한다. |

건강 기록 동기화 버튼으로 Health Connect 혈압을 가져온다. 같은 측정 시각의 기록은 한 건으로 모아 전송한다. 직접 블루투스 수신 코드는 표준 혈압 서비스를 대상으로 하며 HEM-7142T2의 직접 수신은 실기기 검증이 필요하다.
