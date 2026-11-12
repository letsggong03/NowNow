# 오므론 HEM-7142T2 연동 진행 기록

2026년 11월 12일 기준 · Galaxy S24

## 확인한 내용

- HEM-7142T2를 S24의 OMRON connect에 연결했고, 사용자가 앱에서 측정값을 확인했다.
- S24에서 OMRON connect의 Health Connect 혈압 쓰기 권한과 나우나우의 혈압 읽기 권한이 모두 허용된 상태를 확인했다.
- 기존 나우나우 코드는 Health Connect 혈압을 읽었지만 서버 동기화에서 혈압을 제외했고, 리포트에는 서버의 혈압 기록만 표시했다. 권한이 있어도 폰에 있는 기록이 리포트에 바로 나타나지 않는 원인이었다.

## 현재 수정과 확인 순서

1. OMRON connect에서 측정값을 받은 뒤 Health Connect에 혈압 기록이 생성되는지 확인한다.
2. 로컬 수정본은 Health Connect 혈압과 서버 혈압을 측정 시각 기준으로 합쳐 리포트에 표시한다. 서버 동기화에는 Health Connect가 출처를 OMRON connect로 기록한 혈압만 추가한다.
3. 수정 APK 설치 후 나우나우 리포트에서 동기화를 눌러 오므론 앱과 수축기·이완기·측정 시각이 일치하는지 확인한다. 같은 기록을 다시 동기화한 뒤 중복 여부도 확인한다.

권한 허용까지 확인했다. Health Connect에 실제 기록이 생성되는지와 수정 APK의 리포트 표시·서버 저장은 검증이 남아 있다.

## 오므론 커넥트 없이 직접 연결

나우나우의 혈압계 메뉴에 BLE 검색과 연결, 서비스 확인을 하는 진단 코드를 로컬에 추가했다. 실기기 측정값 수신은 아직 검증 전이다. 공개 구현은 이 모델에 오므론 전용 통신을 사용하므로, 공식 Android SDK의 국내 모델 지원 및 사용 조건을 확인한 뒤 S24에서 실제 수신값을 대조한다.

## 참고 자료

- [한국오므론 HEM-7142T2 제품 안내](https://www.omron-healthcare.co.kr/products/blood-pressure-monitors/view?prductSq=104) · 모델과 OMRON connect 블루투스 지원 확인
- [한국오므론 디지털 헬스케어](https://www.omron-healthcare.co.kr/products/digital-healthcare) · Direct to Device 연동과 SDK 신청 경로
- [OMRON Connectivity SDK 문서](https://omron-connect-create.readme.io/docs/getting-started) · Android 앱에서 기기를 직접 연결하는 방식 참고
- [hass-omron](https://github.com/eigger/hass-omron) · 같은 모델의 직접 연동 사례와 모델별 통신 차이 참고
- [OmSyncer](https://github.com/thiagokokada/OmSyncer) · Android BLE 구현 구조 참고. 이 저장소의 검증 목록에는 HEM-7142T2가 없다.
