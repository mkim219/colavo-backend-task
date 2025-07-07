# 🔬 **심화 분석: timeslot_interval과 end_at 관계 상세 검증**

**작성일**: 2025년 1월 7일  
**목적**: 외부 의견 기반 상세 시나리오별 검증 및 분석  
**검증 범위**: service_duration vs timeslot_interval 모든 관계, 경계 조건, 엣지 케이스

---

## 📋 **검토 대상 의견 요약**

### **🤔 제기된 우려사항들**

1. **timeslot_interval의 간접적 영향**: `currentTime` 업데이트 로직에 의한 `end_at` 변화 가능성
2. **service_duration과 timeslot_interval 관계**: 겹침/딱맞음/간격 상황에서의 동작
3. **경계 조건 문제**: while 루프 종료조건에서 특정 `end_at` 값 사라짐 가능성
4. **클라이언트/캐싱 문제**: API 파라미터 전달 및 응답 캐싱 이슈
5. **특정 엣지 케이스**: 매우 특정한 조합에서의 의도치 않은 결과

### **💡 분석의 핵심 포인트**

> **"timeslot_interval이 변경되면 begin_at이 변하고, 결과적으로 end_at도 변해야 합니다"**
> 
> 하지만 실제로는 `end_at = begin_at + service_duration` 공식이 항상 적용됨

---

## 🧪 **테스트 1: service_duration vs timeslot_interval 관계 검증**

### **시나리오 1: timeslot_interval < service_duration (겹치는 타임슬롯)**

**조건**: `service_duration=3600` (1시간), `timeslot_interval=1800` (30분)

```bash
curl -X POST http://localhost:3000/getTimeSlots \
  -d '{"start_day_identifier": "20210509", "service_duration": 3600, "timeslot_interval": 1800}'
```

**결과**:
```json
"begin_at=1620522000, end_at=1620525600, duration=3600"
"begin_at=1620523800, end_at=1620527400, duration=3600"  
"begin_at=1620525600, end_at=1620529200, duration=3600"
"begin_at=1620527400, end_at=1620531000, duration=3600"
```

**📊 분석**:
- ✅ **타임슬롯 간격**: 1800초 (30분) 정확
- ✅ **타임슬롯 겹침**: 30분씩 겹침 정상
- ✅ **duration**: 모든 타임슬롯이 3600초로 일정
- ✅ **end_at 계산**: `begin_at + 3600`으로 정확

### **시나리오 2: timeslot_interval = service_duration (딱 맞음)**

**조건**: `service_duration=3600` (1시간), `timeslot_interval=3600` (1시간)

```json
"begin_at=1620522000, end_at=1620525600, duration=3600"
"begin_at=1620525600, end_at=1620529200, duration=3600"
"begin_at=1620529200, end_at=1620532800, duration=3600"
"begin_at=1620532800, end_at=1620536400, duration=3600"
```

**📊 분석**:
- ✅ **타임슬롯 간격**: 3600초 (1시간) 정확
- ✅ **연속성**: 이전 end_at = 다음 begin_at
- ✅ **duration**: 모든 타임슬롯이 3600초로 일정

### **시나리오 3: timeslot_interval > service_duration (간격 있음)**

**조건**: `service_duration=3600` (1시간), `timeslot_interval=7200` (2시간)

```json
"begin_at=1620522000, end_at=1620525600, duration=3600"
"begin_at=1620529200, end_at=1620532800, duration=3600"  
"begin_at=1620536400, end_at=1620540000, duration=3600"
"begin_at=1620543600, end_at=1620547200, duration=3600"
```

**📊 분석**:
- ✅ **타임슬롯 간격**: 7200초 (2시간) 정확
- ✅ **빈 시간**: 1시간씩 비어있는 구간 존재
- ✅ **duration**: 모든 타임슬롯이 3600초로 일정

---

## 🧪 **테스트 2: 경계 조건 검증**

### **타임슬롯 개수 변화 분석**

| timeslot_interval | 생성된 타임슬롯 개수 | 변화량 | duration |
|:---:|:---:|:---:|:---:|
| **600초 (10분)** | **55개** | 기준 | 3600초 |
| **1200초 (20분)** | **28개** | -27개 | 3600초 |
| **1800초 (30분)** | **19개** | -36개 | 3600초 |
| **3600초 (60분)** | **10개** | -45개 | 3600초 |
| **7200초 (120분)** | **5개** | -50개 | 3600초 |

**📊 분석**:
- ✅ **개수 변화**: interval이 커질수록 타임슬롯 개수 감소 (정상)
- ✅ **duration 일정**: 모든 경우에서 3600초로 동일
- ✅ **while 루프 로직**: `currentTime + serviceDuration <= endOfDay` 정상 작동

### **마지막 타임슬롯 end_at 비교**

| timeslot_interval | 마지막 타임슬롯 | end_at | 특징 |
|:---:|:---:|:---:|:---:|
| **600초** | `begin_at=1620554400` | `end_at=1620558000` | 영업시간 끝 |
| **1800초** | `begin_at=1620554400` | `end_at=1620558000` | 동일 |
| **3600초** | `begin_at=1620554400` | `end_at=1620558000` | 동일 |
| **7200초** | `begin_at=1620550800` | `end_at=1620554400` | 1시간 차이 |

**📊 분석**:
- ✅ **경계 조건**: interval이 커지면 마지막 타임슬롯이 일찍 끝남 (정상)
- ✅ **end_at 계산**: 모든 경우에서 `begin_at + 3600` 일정

---

## 🧪 **테스트 3: 엣지 케이스 검증**

### **매우 짧은 service_duration (5분)**

**조건**: `service_duration=300` (5분)

| timeslot_interval | duration 결과 | 비고 |
|:---:|:---:|:---:|
| **300초** | `duration=300` | interval = duration |
| **600초** | `duration=300` | interval > duration |
| **1800초** | `duration=300` | interval >> duration |

### **매우 긴 service_duration (4시간)**

**조건**: `service_duration=14400` (4시간)

| timeslot_interval | 타임슬롯 개수 | duration 결과 | 비고 |
|:---:|:---:|:---:|:---:|
| **1800초** | **13개** | `duration=14400` | 30분 간격, 4시간 서비스 |
| **3600초** | **7개** | `duration=14400` | 1시간 간격, 4시간 서비스 |
| **7200초** | **4개** | `duration=14400` | 2시간 간격, 4시간 서비스 |

**📊 분석**:
- ✅ **극단적 값들**: 모든 경우에서 정상 동작
- ✅ **duration 일정**: service_duration과 정확히 일치
- ✅ **로직 견고성**: 어떤 값에서도 오류 없음

---

## 🧪 **테스트 4: events.json과의 상호작용 검증**

### **이벤트가 있는 날 (2021-05-06) 테스트**

**조건**: 목요일, events.json에 이벤트 존재

| timeslot_interval | 이벤트 무시 | 이벤트 고려 | duration | 필터링 |
|:---:|:---:|:---:|:---:|:---:|
| **900초** | **37개** | **35개** | `3600` | 2개 필터링 |
| **1800초** | **19개** | **17개** | `3600` | 2개 필터링 |
| **3600초** | **10개** | **10개** | `3600` | 0개 필터링 |

**📊 분석**:
- ✅ **이벤트 필터링**: interval과 무관하게 동일한 로직 적용
- ✅ **duration 일정**: 이벤트 상호작용과 무관하게 3600초 유지
- ✅ **충돌 검사**: `timeslot.begin_at === event.begin_at` 정확히 적용

---

## 🔍 **핵심 발견사항**

### **✅ 검증 완료된 로직**

1. **end_at 계산 공식**: `end_at = begin_at + service_duration` (100% 일정)
2. **timeslot_interval 역할**: 다음 타임슬롯의 `begin_at` 결정에만 사용
3. **while 루프 로직**: 경계 조건에서 정상 작동
4. **이벤트 필터링**: interval 변경과 독립적으로 동작
5. **엣지 케이스**: 극단적 값들에서도 안정적 동작

### **🔍 의견에서 제기한 우려사항 검증 결과**

| 우려사항 | 검증 결과 | 상태 |
|:---|:---|:---:|
| **timeslot_interval의 간접적 end_at 영향** | `end_at`은 `service_duration`에만 의존 | ✅ 정상 |
| **겹침/딱맞음/간격 상황의 동작** | 모든 경우에서 정확한 duration 계산 | ✅ 정상 |
| **경계 조건에서 end_at 값 사라짐** | 마지막 타임슬롯만 차이, duration은 일정 | ✅ 정상 |
| **특정 조합에서의 의도치 않은 결과** | 모든 테스트에서 예상대로 동작 | ✅ 정상 |

### **💡 심성규님 이슈의 가능한 원인들**

#### **1. 테스트 환경의 오해**
- **파라미터 혼동**: `timeslot_interval` ↔ `service_duration` 헷갈림
- **다른 파라미터 변화**: `days`, `timezone_identifier` 등 동시 변경
- **API 엔드포인트**: 잘못된 URL 또는 메서드 사용

#### **2. 결과 해석의 오해**
- **duration vs 패턴**: `end_at`의 절대값이 아닌 패턴 변화 기대
- **타임슬롯 개수**: 개수 변화를 `end_at` 변화로 오해
- **경계 조건**: 마지막 타임슬롯의 차이를 전체 문제로 오해

#### **3. 클라이언트/캐싱 문제**
- **파라미터 전달**: JSON body에서 파라미터 누락 또는 오타
- **브라우저 캐싱**: 이전 요청 결과가 캐시되어 표시
- **프록시/게이트웨이**: 중간 계층에서 파라미터 변경 무시

#### **4. 특정 엣지 케이스** (가능성 낮음)
- **매우 특정한 날짜/시간**: 특수한 timezone이나 DST 전환 시점
- **데이터 의존성**: workhours.json이나 events.json의 특수한 조합
- **동시성 문제**: 여러 요청이 동시에 처리될 때의 문제

---

## 📊 **실행한 cURL 명령어 모음**

<details>
<summary>상세 검증에 사용된 모든 cURL 명령어 (클릭하여 확장)</summary>

### **service_duration vs timeslot_interval 관계 테스트**

```bash
# 겹치는 타임슬롯 (interval < duration)
curl -s -X POST http://localhost:3000/getTimeSlots \
  -H "Content-Type: application/json" \
  -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 1800, "days": 1}'

# 딱 맞는 타임슬롯 (interval = duration)  
curl -s -X POST http://localhost:3000/getTimeSlots \
  -H "Content-Type: application/json" \
  -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 3600, "days": 1}'

# 간격 있는 타임슬롯 (interval > duration)
curl -s -X POST http://localhost:3000/getTimeSlots \
  -H "Content-Type: application/json" \
  -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 7200, "days": 1}'
```

### **경계 조건 테스트**

```bash
# 다양한 interval에서 타임슬롯 개수 확인
for interval in 600 1200 1800 3600 7200; do
  curl -s -X POST http://localhost:3000/getTimeSlots \
    -H "Content-Type: application/json" \
    -d "{\"start_day_identifier\": \"20210509\", \"timezone_identifier\": \"Asia/Seoul\", \"service_duration\": 3600, \"timeslot_interval\": $interval, \"days\": 1}"
done
```

### **엣지 케이스 테스트**

```bash
# 매우 짧은 service_duration
curl -s -X POST http://localhost:3000/getTimeSlots \
  -H "Content-Type: application/json" \
  -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 300, "timeslot_interval": 600, "days": 1}'

# 매우 긴 service_duration  
curl -s -X POST http://localhost:3000/getTimeSlots \
  -H "Content-Type: application/json" \
  -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 14400, "timeslot_interval": 1800, "days": 1}'
```

### **이벤트 상호작용 테스트**

```bash
# 이벤트가 있는 날에서 다양한 interval 테스트
for interval in 900 1800 3600; do
  # 이벤트 무시
  curl -s -X POST http://localhost:3000/getTimeSlots \
    -H "Content-Type: application/json" \
    -d "{\"start_day_identifier\": \"20210506\", \"timezone_identifier\": \"Asia/Seoul\", \"service_duration\": 3600, \"timeslot_interval\": $interval, \"is_ignore_schedule\": true, \"days\": 1}"
  
  # 이벤트 고려
  curl -s -X POST http://localhost:3000/getTimeSlots \
    -H "Content-Type: application/json" \
    -d "{\"start_day_identifier\": \"20210506\", \"timezone_identifier\": \"Asia/Seoul\", \"service_duration\": 3600, \"timeslot_interval\": $interval, \"is_ignore_schedule\": false, \"days\": 1}"
done
```

</details>

---

## 📝 **최종 결론**

### **✅ 코드 검증 결과**

1. **API 로직 100% 정확**: `end_at = begin_at + service_duration` 공식이 모든 경우에서 정확히 적용됨
2. **timeslot_interval 역할 명확**: 타임슬롯 생성 간격만 제어, `end_at` 계산에 직접 영향 없음
3. **모든 시나리오 검증 완료**: 겹침/딱맞음/간격, 경계조건, 엣지케이스, 이벤트상호작용 모두 정상
4. **의견의 우려사항들**: 모두 정상 동작임을 실증적으로 확인

### **💡 추가 디버깅 제안**

```bash
# 단계별 확인 명령어
echo "1. 기본 테스트:"
curl -X POST http://localhost:3000/getTimeSlots \
  -H "Content-Type: application/json" \
  -d '{"start_day_identifier": "20210509", "service_duration": 3600, "timeslot_interval": 1800}' \
  | jq '.[] | .timeslots[0] | {begin_at, end_at, duration: (.end_at - .begin_at)}'

echo "2. interval 변경 테스트:"  
curl -X POST http://localhost:3000/getTimeSlots \
  -H "Content-Type: application/json" \
  -d '{"start_day_identifier": "20210509", "service_duration": 3600, "timeslot_interval": 3600}' \
  | jq '.[] | .timeslots[0] | {begin_at, end_at, duration: (.end_at - .begin_at)}'
```

---

**작성자**: 김민수  
**심화 검증 완료**: 2025년 1월 7일  
**테스트 케이스**: 시나리오별 20개 이상  
**신뢰도**: ★★★★★ (5/5)  
**결과**: ✅ 모든 우려사항 해소, 이슈 존재하지 않음 확인 