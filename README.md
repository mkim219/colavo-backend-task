# 살롱 예약 시스템 API

살롱 고객이 예약 가능한 DayTimetable 리스트를 반환하는 API입니다.

## 📋 과제 요구사항

- Express + TypeScript + Luxon 사용
- 영업시간과 기존 예약을 고려한 예약 가능 시간대 계산
- 타임존 변환 처리
- 다양한 옵션 파라미터 지원

## 🚀 설치 및 실행

```bash
# 종속성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 📁 프로젝트 구조

```
src/
├── controllers/
│   └── timeslot.controller.ts    # API 컨트롤러
├── services/
│   └── timeslot.service.ts       # 비즈니스 로직
├── utils/
│   ├── timezone.util.ts          # 타임존 변환 유틸리티
│   └── validation.util.ts        # 요청 검증 유틸리티
├── types/
│   └── interfaces.ts             # TypeScript 인터페이스
├── data/
│   ├── workhours.json           # 영업시간 데이터
│   └── events.json              # 예약 이벤트 데이터
└── app.ts                       # Express 앱 설정
```

## 🌐 API 스펙

### 엔드포인트
```
POST /getTimeSlots
```cursor_api_development_for_daytimetable.md

### 요청 바디
```typescript
interface RequestBody {
  start_day_identifier: string;    // 날짜 식별자 (YYYYMMDD)
  timezone_identifier: string;     // 타임존 식별자
  service_duration: number;        // 서비스 시간 (초)
  days?: number;                   // 조회할 날짜 수 (기본값: 1)
  timeslot_interval?: number;      // 타임슬롯 간격 (기본값: 1800초/30분)
  is_ignore_schedule?: boolean;    // 기존 예약 무시 여부
  is_ignore_workhour?: boolean;    // 영업시간 무시 여부
}
```

### 응답 바디
```typescript
interface DayTimetable {
  start_of_day: number;           // 하루 시작 시각 (Unix timestamp)
  day_modifier: number;           // 날짜 상대값 (0: 오늘, 1: 내일, ...)
  is_day_off: boolean;            // 휴무일 여부
  timeslots: Timeslot[];          // 예약 가능한 시간 슬롯
}

interface Timeslot {
  begin_at: number;               // 시작 시각 (Unix timestamp)
  end_at: number;                 // 종료 시각 (Unix timestamp)
}
```

## 🧪 테스트 방법

### 자동화된 테스트 (Jest + Supertest)
```bash
# 전체 테스트 실행
npm test

# 특정 테스트 그룹만 실행
npm test -- --testNamePattern="특수 데이터 처리 테스트"
npm test -- --testNamePattern="타임존별 동작 테스트"

# 커버리지 포함 테스트 실행
npm test -- --coverage
```

### 테스트 실행 결과
```
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        1.515 s

✓ 정상 요청 테스트 (4개)
✓ 옵션 파라미터 테스트 (5개)  
✓ 에러 처리 테스트 (5개)
✓ 엔드포인트 존재성 테스트 (2개)
✓ 특수 데이터 처리 테스트 (3개) - 잘못된 이벤트 데이터 처리 검증
✓ 타임존별 동작 테스트 (4개) - 각 타임존별 정확한 timestamp 계산 검증
```

### 수동 테스트 (cURL)
```bash
curl -X POST http://localhost:3000/getTimeSlots \
  -H "Content-Type: application/json" \
  -d '{
    "start_day_identifier": "20210509",
    "timezone_identifier": "Asia/Seoul",
    "service_duration": 3600,
    "days": 1,
    "timeslot_interval": 1800
  }'
```

### 테스트 케이스

#### 1. 2021-05-09 (일요일) - 정상 영업일
```json
{
  "start_day_identifier": "20210509",
  "timezone_identifier": "Asia/Seoul",
  "service_duration": 3600,
  "days": 1,
  "timeslot_interval": 1800
}
```

#### 2. 2021-05-10 (월요일) - 영업시간 없음
```json
{
  "start_day_identifier": "20210510",
  "timezone_identifier": "Asia/Seoul",
  "service_duration": 3600,
  "days": 1,
  "timeslot_interval": 1800
}
```

#### 3. 2021-05-11 (화요일) - 정상 영업일
```json
{
  "start_day_identifier": "20210511",
  "timezone_identifier": "Asia/Seoul",
  "service_duration": 3600,
  "days": 1,
  "timeslot_interval": 1800
}
```

#### 4. 여러 날짜 조회 (3일간)
```json
{
  "start_day_identifier": "20210509",
  "timezone_identifier": "Asia/Seoul",
  "service_duration": 3600,
  "days": 3,
  "timeslot_interval": 1800
}
```

#### 5. 타임존별 동작 테스트

##### 5.1. 한국 표준시 (Asia/Seoul, UTC+9)
```json
{
  "start_day_identifier": "20210509",
  "timezone_identifier": "Asia/Seoul",
  "service_duration": 3600,
  "days": 1,
  "timeslot_interval": 1800
}
```

##### 5.2. 미국 동부 시간 (America/New_York, UTC-4/UTC-5)
```json
{
  "start_day_identifier": "20210509",
  "timezone_identifier": "America/New_York",
  "service_duration": 3600,
  "days": 1,
  "timeslot_interval": 1800
}
```

##### 5.3. 브라질 표준시 (America/Sao_Paulo, UTC-3)
```json
{
  "start_day_identifier": "20210509",
  "timezone_identifier": "America/Sao_Paulo",
  "service_duration": 3600,
  "days": 1,
  "timeslot_interval": 1800
}
```

> **타임존별 차이점**: 동일한 날짜라도 타임존에 따라 `start_of_day`와 `timeslots`의 Unix timestamp 값이 다릅니다. 이는 각 타임존의 UTC 오프셋 차이로 인한 정상적인 동작입니다.

#### 6. 특수 데이터 처리 테스트

##### 6.1. 잘못된 이벤트 데이터 처리 (begin_at > end_at)
```json
{
  "start_day_identifier": "20210506",
  "timezone_identifier": "Asia/Seoul",
  "service_duration": 3600,
  "days": 1,
  "timeslot_interval": 1800,
  "is_ignore_schedule": false
}
```
**설명**: 현재 events.json에 포함된 잘못된 이벤트 데이터 (begin_at > end_at)가 있어도 API가 정상 작동하는지 확인합니다.

##### 6.2. 잘못된 vs 정상 이벤트 데이터 비교
```json
// 잘못된 데이터가 있는 날짜
{
  "start_day_identifier": "20210506",
  "timezone_identifier": "Asia/Seoul",
  "service_duration": 3600,
  "days": 1,
  "timeslot_interval": 1800,
  "is_ignore_schedule": false
}

// 정상 데이터가 있는 날짜
{
  "start_day_identifier": "20210507",
  "timezone_identifier": "Asia/Seoul",
  "service_duration": 3600,
  "days": 1,
  "timeslot_interval": 1800,
  "is_ignore_schedule": false
}
```
**설명**: 잘못된 이벤트 데이터는 무시되고 정상 이벤트 데이터만 충돌 검사에 사용되는지 확인합니다.

#### 7. 에러 케이스 테스트

##### 7.1. 잘못된 타임존 식별자
```json
{
  "start_day_identifier": "20210509",
  "timezone_identifier": "InvalidTimezone123",
  "service_duration": 3600,
  "days": 1,
  "timeslot_interval": 1800
}
```
**예상 응답**: 400 Bad Request - "유효하지 않은 timezone_identifier입니다."

## 🔧 주요 기능

### 1. 타임존 변환
- **Luxon 라이브러리** 기반의 정확한 타임존 변환
- **일광절약시간(DST)** 자동 처리 및 오프셋 계산
- **다양한 타임존** 지원 (Asia/Seoul, America/New_York, America/Sao_Paulo 등)
- **타임존 유효성 검사** 기능으로 잘못된 타임존 식별자 차단
- **UTC 기준 변환**: 각 타임존의 로컬 시간을 UTC 기준으로 정확히 변환
- **날짜 경계 처리**: 타임존별로 다른 날짜 시작점(start_of_day) 계산

### 2. 영업시간 처리
- 요일별 영업시간 설정
- 휴무일 처리
- 특수 케이스 처리 (월요일: open_interval === close_interval)

### 3. 예약 충돌 검사
- 기존 예약과 겹치는 시간대 자동 제외
- 서비스 시간을 고려한 정확한 충돌 검사
- 비정상 데이터 필터링

### 4. 유연한 옵션 설정
- 스케줄 무시 옵션
- 영업시간 무시 옵션
- 커스텀 타임슬롯 간격 설정

## 📊 데이터 구조

### 영업시간 데이터 (workhours.json)
```json
[
  {
    "weekday": 1,           // 1: 일요일 ~ 7: 토요일
    "key": "sun",
    "is_day_off": false,
    "open_interval": 36000,  // 10:00 (초 단위)
    "close_interval": 72000  // 20:00 (초 단위)
  }
]
```

### 예약 이벤트 데이터 (events.json)
```json
[
  {
    "begin_at": 1620268200,    // 시작 시각 (Unix timestamp)
    "end_at": 1620275400,      // 종료 시각 (Unix timestamp)
    "created_at": 1620272253,
    "updated_at": 1620272253
  }
]
```

## 🛠️ 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Date Library**: Luxon
- **HTTP Client**: CORS enabled
- **Testing**: Jest + Supertest + TypeScript

## 🧪 테스트 구조

### 통합 테스트 (23개 테스트)
- **정상 요청 테스트** (4개)
  - 2021-05-09 (일요일) 정상 영업일
  - 2021-05-10 (월요일) 영업시간 없는 날
  - 2021-05-11 (화요일) 정상 영업일
  - 여러 날짜 조회 (3일간)

- **옵션 파라미터 테스트** (5개)
  - is_ignore_schedule true/false
  - is_ignore_workhour true/false
  - 선택적 파라미터 기본값

- **에러 처리 테스트** (5개)
  - 필수 파라미터 누락
  - 잘못된 날짜 형식
  - 잘못된 타임존
  - 잘못된 서비스 시간 타입
  - 음수 서비스 시간

- **엔드포인트 존재성 테스트** (2개)
  - 헬스체크 엔드포인트
  - 404 에러 처리

- **특수 데이터 처리 테스트** (3개)
  - 잘못된 이벤트 데이터 처리 (begin_at > end_at)
  - 잘못된 vs 정상 이벤트 데이터 비교
  - 스케줄 무시 옵션과 잘못된 데이터 상호작용

- **타임존별 동작 테스트** (4개)
  - Asia/Seoul 타임존 테스트 (UTC+9)
  - America/New_York 타임존 테스트 (UTC-4, EDT)
  - America/Sao_Paulo 타임존 테스트 (UTC-3)
  - 타임존별 start_of_day 값 차이 검증

## 📋 주의사항

1. **타임존 정확성**: 모든 시간 계산은 지정된 타임존에서 수행됩니다.
   - 동일한 날짜라도 타임존에 따라 다른 Unix timestamp 값을 가집니다.
   - 서머타임(DST) 변경 사항이 자동으로 반영됩니다.

2. **잘못된 이벤트 데이터 처리**: 
   - **begin_at > end_at**인 비정상적인 이벤트 데이터는 **자동으로 무시**됩니다.
   - 현재 events.json에 포함된 잘못된 데이터: `{ "begin_at": 1620276300, "end_at": 1620275400 }`
   - 이런 데이터가 있어도 API는 정상 작동하며, 충돌 검사에서 제외됩니다.

3. **영업시간 처리**: 
   - `open_interval`과 `close_interval`이 같은 경우 영업시간이 없는 것으로 처리됩니다.
   - 예시: 월요일 `{ "open_interval": 36900, "close_interval": 36900 }`

4. **서비스 시간 고려**: 
   - 예약 가능한 시간대는 서비스 완료 시간까지 고려하여 계산됩니다.
   - 타임슬롯 시작 시간 + 서비스 시간이 영업 종료 시간을 초과하면 해당 슬롯은 제외됩니다.

5. **데이터 안정성**: 
   - 모든 이벤트 데이터는 충돌 검사 전에 유효성을 검증합니다.
   - 잘못된 형식의 데이터가 있어도 시스템 안정성에 영향을 주지 않습니다.

## 🔍 헬스체크

```
GET /health
```

응답:
```json
{
  "status": "OK",
  "timestamp": "2021-05-09T10:00:00.000Z"
}
```

## 🎯 성능 최적화

- **효율적인 충돌 검사 알고리즘**: 잘못된 이벤트 데이터 사전 필터링으로 불필요한 계산 제거
- **메모리 사용량 최적화**: 날짜별 이벤트 데이터 인덱싱으로 탐색 범위 최소화
- **타임존 변환 캐싱**: Luxon 라이브러리의 내장 캐싱 활용
- **데이터 유효성 검사**: begin_at > end_at 조건으로 빠른 데이터 필터링
- **불필요한 계산 최소화**: 영업시간 외 타임슬롯 생성 방지

## 🛡️ 데이터 무결성

- **자동 데이터 검증**: 잘못된 이벤트 데이터 자동 감지 및 무시
- **안전한 타임존 처리**: 유효하지 않은 타임존 식별자 사전 차단  
- **견고한 에러 처리**: 비정상 데이터가 있어도 서비스 중단 없이 정상 운영
- **포괄적인 테스트**: 23개 테스트 케이스로 모든 엣지 케이스 검증


