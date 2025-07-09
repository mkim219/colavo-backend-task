# 🧪 API 테스트 결과 리포트

**작성일**: 2025년 1월 7일  
**목적**: timeslot_interval 파라미터 변경 시 end_at 동작 검증

---

## 📋 테스트 환경

- **API 엔드포인트**: `POST http://localhost:3000/getTimeSlots`
- **테스트 도구**: cURL + jq
- **서버**: Node.js + Express + TypeScript

---

## 🔧 테스트 1: timeslot_interval 변경 (service_duration=3600 고정)

### 파라미터

| 테스트 | start_day_identifier | timezone_identifier | service_duration | timeslot_interval | 기타 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 1-1 | 20210509 | Asia/Seoul | 3600 | **600** | - |
| 1-2 | 20210509 | Asia/Seoul | 3600 | **1800** | - |
| 1-3 | 20210509 | Asia/Seoul | 3600 | **3600** | - |

### 결과

| 테스트 | 첫 번째 타임슬롯 | 두 번째 타임슬롯 | 간격(초) | duration(초) |
|:---:|:---:|:---:|:---:|:---:|
| 1-1 | begin_at=1620522000<br/>end_at=1620525600 | begin_at=1620522600<br/>end_at=1620526200 | 600 | 3600 |
| 1-2 | begin_at=1620522000<br/>end_at=1620525600 | begin_at=1620523800<br/>end_at=1620527400 | 1800 | 3600 |
| 1-3 | begin_at=1620522000<br/>end_at=1620525600 | begin_at=1620525600<br/>end_at=1620529200 | 3600 | 3600 |

**📊 분석**: timeslot_interval 변경 → 타임슬롯 간격 변경, end_at은 service_duration에 의해 결정

---

## 🔧 테스트 2: service_duration 변경 (timeslot_interval=1800 고정)

### 파라미터

| 테스트 | start_day_identifier | timezone_identifier | service_duration | timeslot_interval | 기타 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 2-1 | 20210509 | Asia/Seoul | **1800** | 1800 | - |
| 2-2 | 20210509 | Asia/Seoul | **3600** | 1800 | - |
| 2-3 | 20210509 | Asia/Seoul | **7200** | 1800 | - |

### 결과

| 테스트 | 첫 번째 타임슬롯 | 두 번째 타임슬롯 | 간격(초) | duration(초) |
|:---:|:---:|:---:|:---:|:---:|
| 2-1 | begin_at=1620522000<br/>end_at=1620523800 | begin_at=1620523800<br/>end_at=1620525600 | 1800 | **1800** |
| 2-2 | begin_at=1620522000<br/>end_at=1620525600 | begin_at=1620523800<br/>end_at=1620527400 | 1800 | **3600** |
| 2-3 | begin_at=1620522000<br/>end_at=1620529200 | begin_at=1620523800<br/>end_at=1620531000 | 1800 | **7200** |

**📊 분석**: service_duration 변경 → end_at 직접 변경 (end_at = begin_at + service_duration)

---

## 🔧 테스트 3: is_ignore_schedule 변경

### 파라미터

| 테스트 | start_day_identifier | timezone_identifier | service_duration | timeslot_interval | is_ignore_schedule |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 3-1 | 20210509 | Asia/Seoul | 3600 | 1800 | **false** |
| 3-2 | 20210509 | Asia/Seoul | 3600 | 1800 | **true** |

### 결과

| 테스트 | 타임슬롯 개수 | 첫 번째 타임슬롯 | 두 번째 타임슬롯 | duration(초) |
|:---:|:---:|:---:|:---:|:---:|
| 3-1 | 19 | begin_at=1620522000<br/>end_at=1620525600 | begin_at=1620523800<br/>end_at=1620527400 | 3600 |
| 3-2 | 19 | begin_at=1620522000<br/>end_at=1620525600 | begin_at=1620523800<br/>end_at=1620527400 | 3600 |

**📊 분석**: is_ignore_schedule 변경 → 타임슬롯 개수는 동일, end_at 값 동일

---

## 🔧 테스트 4: is_ignore_workhour 변경 (월요일 사용)

### 파라미터

| 테스트 | start_day_identifier | timezone_identifier | service_duration | timeslot_interval | is_ignore_workhour |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 4-1 | 20210510 | Asia/Seoul | 3600 | 1800 | **false** |
| 4-2 | 20210510 | Asia/Seoul | 3600 | 1800 | **true** |

### 결과

| 테스트 | 타임슬롯 개수 | 첫 번째 타임슬롯 | 두 번째 타임슬롯 | duration(초) |
|:---:|:---:|:---:|:---:|:---:|
| 4-1 | **0** | N/A (빈 타임슬롯) | N/A | N/A |
| 4-2 | **46** | begin_at=1620572400<br/>end_at=1620576000 | begin_at=1620574200<br/>end_at=1620577800 | 3600 |

**📊 분석**: is_ignore_workhour=true → 영업시간 무시하여 하루 전체 타임슬롯 생성

---

## 🔧 테스트 5: timezone_identifier 변경

### 파라미터

| 테스트 | start_day_identifier | timezone_identifier | service_duration | timeslot_interval | 기타 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 5-1 | 20210509 | **Asia/Seoul** | 3600 | 1800 | - |
| 5-2 | 20210509 | **America/New_York** | 3600 | 1800 | - |

### 결과

| 테스트 | 첫 번째 타임슬롯 | 두 번째 타임슬롯 | 시간차이 | duration(초) |
|:---:|:---:|:---:|:---:|:---:|
| 5-1 | begin_at=1620522000<br/>end_at=1620525600 | begin_at=1620523800<br/>end_at=1620527400 | 기준 | 3600 |
| 5-2 | begin_at=1620568800<br/>end_at=1620572400 | begin_at=1620570600<br/>end_at=1620574200 | +46800초<br/>(13시간) | 3600 |

**📊 분석**: timezone_identifier 변경 → 시간대별 timestamp 변경, duration은 동일

---

## 📊 전체 결과 요약

### ✅ 확인된 공식
```
end_at = begin_at + service_duration
다음_타임슬롯_begin_at = 현재_begin_at + timeslot_interval
```

### 🔍 핵심 발견사항

1. **timeslot_interval**: 타임슬롯 **생성 간격** 제어
2. **service_duration**: 타임슬롯 **지속시간** 제어  
3. **end_at**: 항상 `begin_at + service_duration`으로 계산
4. **is_ignore_schedule**: 이벤트 충돌 필터링 제어
5. **is_ignore_workhour**: 영업시간 무시 여부 제어
6. **timezone_identifier**: 시간대별 timestamp 변환

### ❌ 제기된 이슈 검증 결과

> "timeslot_interval가 변경될때 리턴 값의 timeslots내 end_at이 변경되지 않는 이슈"

**결론**: **이슈가 존재하지 않음**
- timeslot_interval은 타임슬롯 간격을 제어
- end_at은 service_duration에 의해 제어
- 모든 테스트에서 정상 동작 확인

---

## 🗂️ Raw cURL 명령어

<details>
<summary>실행한 모든 cURL 명령어 (클릭하여 확장)</summary>

```bash
# 테스트 1: timeslot_interval 변경
curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 600}'

curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 1800}'

curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 3600}'

# 테스트 2: service_duration 변경
curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 1800, "timeslot_interval": 1800}'

curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 1800}'

curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 7200, "timeslot_interval": 1800}'

# 테스트 3: is_ignore_schedule 변경
curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 1800, "is_ignore_schedule": false}'

curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 1800, "is_ignore_schedule": true}'

# 테스트 4: is_ignore_workhour 변경
curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210510", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 1800, "is_ignore_workhour": false}'

curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210510", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 1800, "is_ignore_workhour": true}'

# 테스트 5: timezone_identifier 변경
curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210509", "timezone_identifier": "Asia/Seoul", "service_duration": 3600, "timeslot_interval": 1800}'

curl -s -X POST http://localhost:3000/getTimeSlots -H "Content-Type: application/json" -d '{"start_day_identifier": "20210509", "timezone_identifier": "America/New_York", "service_duration": 3600, "timeslot_interval": 1800}'
```

</details>

---

**작성자**: 김민수  
**검증 완료**: 2025년 1월 7일  
**총 테스트 케이스**: 12개  
**결과**: ✅ API 정상 동작 확인 