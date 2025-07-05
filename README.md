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

## 🔧 주요 기능

### 1. 타임존 변환
- Luxon 라이브러리를 사용한 정확한 타임존 변환
- 일광절약시간(DST) 자동 처리
- 다양한 타임존 지원

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

### 통합 테스트 (16개 테스트)
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

## 📋 주의사항

1. **타임존 정확성**: 모든 시간 계산은 지정된 타임존에서 수행됩니다.
2. **데이터 검증**: 잘못된 이벤트 데이터 (begin_at > end_at)는 자동으로 무시됩니다.
3. **영업시간 처리**: open_interval과 close_interval이 같은 경우 영업시간이 없는 것으로 처리됩니다.
4. **서비스 시간 고려**: 예약 가능한 시간대는 서비스 완료 시간까지 고려하여 계산됩니다.

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

- 효율적인 충돌 검사 알고리즘
- 메모리 사용량 최적화
- 타임존 변환 캐싱
- 불필요한 계산 최소화

## 📝 라이센스

MIT License
