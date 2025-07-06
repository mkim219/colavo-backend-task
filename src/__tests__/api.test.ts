import request from 'supertest';
import { Server } from 'http';
import app from '../app';
import { DayTimetable, RequestBody, Timeslot } from '../types/interfaces';

describe('POST /getTimeSlots API 통합 테스트', () => {
  let server: Server;

  beforeAll((done) => {
    server = app.listen(0, done); // 포트 0으로 자동 할당
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('정상 요청 테스트', () => {
    it('2021-05-09 (일요일) 정상 요청 시 DayTimetable 배열 반환', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(dayTimetable).toHaveProperty('start_of_day');
      expect(dayTimetable).toHaveProperty('day_modifier');
      expect(dayTimetable).toHaveProperty('is_day_off');
      expect(dayTimetable).toHaveProperty('timeslots');
      expect(dayTimetable.day_modifier).toBe(0);
      expect(dayTimetable.is_day_off).toBe(false);
      expect(Array.isArray(dayTimetable.timeslots)).toBe(true);
      expect(dayTimetable.timeslots.length).toBeGreaterThan(0);

      // 각 타임슬롯 구조 검증
      dayTimetable.timeslots.forEach(slot => {
        expect(slot).toHaveProperty('begin_at');
        expect(slot).toHaveProperty('end_at');
        expect(typeof slot.begin_at).toBe('number');
        expect(typeof slot.end_at).toBe('number');
        expect(slot.end_at).toBeGreaterThan(slot.begin_at);
      });
    });

    it('2021-05-10 (월요일) 영업시간 없는 날 테스트', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210510',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(dayTimetable.day_modifier).toBe(0);
      expect(dayTimetable.is_day_off).toBe(false);
      expect(dayTimetable.timeslots).toHaveLength(0); // 영업시간이 없으므로 빈 배열
    });

    it('2021-05-11 (화요일) 정상 영업일 테스트', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210511',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(dayTimetable.day_modifier).toBe(0);
      expect(dayTimetable.is_day_off).toBe(false);
      expect(dayTimetable.timeslots.length).toBeGreaterThan(0);
    });

    it('여러 날짜 조회 (3일간) 테스트', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 3,
        timeslot_interval: 1800
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);

      // day_modifier 검증
      response.body.forEach((dayTimetable: DayTimetable, index: number) => {
        expect(dayTimetable.day_modifier).toBe(index);
        expect(dayTimetable).toHaveProperty('start_of_day');
        expect(dayTimetable).toHaveProperty('is_day_off');
        expect(dayTimetable).toHaveProperty('timeslots');
      });
    });
  });

  describe('옵션 파라미터 테스트', () => {
    it('is_ignore_schedule = true 일 때 기존 예약 무시', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800,
        is_ignore_schedule: true
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(dayTimetable.timeslots.length).toBeGreaterThan(0);
    });

    it('is_ignore_schedule = false 일 때 기존 예약 고려', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800,
        is_ignore_schedule: false
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(dayTimetable.timeslots.length).toBeGreaterThan(0);
    });

    it('is_ignore_workhour = true 일 때 하루 전체 시간 사용', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210510', // 월요일 (영업시간 없음)
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800,
        is_ignore_workhour: true
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(dayTimetable.timeslots.length).toBeGreaterThan(0); // 영업시간을 무시하므로 타임슬롯 존재
    });

    it('is_ignore_workhour = false 일 때 영업시간 준수', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210510', // 월요일 (영업시간 없음)
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800,
        is_ignore_workhour: false
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(dayTimetable.timeslots.length).toBe(0); // 영업시간이 없으므로 빈 배열
    });

    it('선택적 파라미터 기본값 테스트', async () => {
      const requestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600
        // days, timeslot_interval 등 선택적 파라미터 생략
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1); // 기본값 days = 1
    });
  });

  describe('에러 처리 테스트', () => {
    it('필수 파라미터 누락 시 400 에러', async () => {
      const invalidRequestBody = {
        start_day_identifier: '20210509',
        // timezone_identifier 누락
        service_duration: 3600
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('잘못된 날짜 형식 시 400 에러', async () => {
      const invalidRequestBody: RequestBody = {
        start_day_identifier: 'invalid-date',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details.some((detail: string) => 
        detail.includes('YYYYMMDD')
      )).toBe(true);
    });

    it('잘못된 타임존 시 400 에러', async () => {
      const invalidRequestBody: RequestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'InvalidTimezone123',
        service_duration: 3600
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('잘못된 서비스 시간 타입 시 400 에러', async () => {
      const invalidRequestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 'invalid-number'
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('음수 서비스 시간 시 400 에러', async () => {
      const invalidRequestBody: RequestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'Asia/Seoul',
        service_duration: -1
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });
  });

  describe('엔드포인트 존재성 테스트', () => {
    it('헬스체크 엔드포인트 정상 동작', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('존재하지 않는 경로 접근 시 404 에러', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('특수 데이터 처리 테스트', () => {
    it('잘못된 이벤트 데이터 처리 테스트 (begin_at > end_at)', async () => {
      // 현재 events.json에는 잘못된 데이터가 포함되어 있음
      // { "begin_at": 1620276300, "end_at": 1620275400 } - begin_at > end_at
      // 이런 잘못된 데이터가 있어도 API가 정상 작동해야 함
      
      const requestBody: RequestBody = {
        start_day_identifier: '20210506', // 잘못된 이벤트가 있는 날짜
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600, // 1시간
        days: 1,
        timeslot_interval: 1800, // 30분 간격
        is_ignore_schedule: false // 스케줄 고려함
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(dayTimetable.day_modifier).toBe(0);
      expect(dayTimetable.is_day_off).toBe(false);
      expect(Array.isArray(dayTimetable.timeslots)).toBe(true);
      
      // 잘못된 이벤트 데이터가 있어도 타임슬롯이 정상적으로 생성되어야 함
      console.log('잘못된 이벤트 데이터가 있는 날짜의 타임슬롯 개수:', dayTimetable.timeslots.length);
      
      // 타임슬롯이 존재해야 함 (잘못된 데이터는 무시되므로)
      expect(dayTimetable.timeslots.length).toBeGreaterThan(0);
    });

    it('잘못된 이벤트 데이터 무시 vs 정상 이벤트 데이터 처리 비교', async () => {
      // 1. 잘못된 이벤트가 있는 날짜 (2021-05-06)
      const requestWithBadData: RequestBody = {
        start_day_identifier: '20210506',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800,
        is_ignore_schedule: false
      };

      const responseWithBadData = await request(app)
        .post('/getTimeSlots')
        .send(requestWithBadData)
        .expect(200);

      // 2. 정상 이벤트가 있는 날짜 (2021-05-07)
      const requestWithGoodData: RequestBody = {
        start_day_identifier: '20210507',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800,
        is_ignore_schedule: false
      };

      const responseWithGoodData = await request(app)
        .post('/getTimeSlots')
        .send(requestWithGoodData)
        .expect(200);

      const badDataTimeslots = responseWithBadData.body[0].timeslots;
      const goodDataTimeslots = responseWithGoodData.body[0].timeslots;

      console.log('잘못된 이벤트 데이터가 있는 날짜 타임슬롯 개수:', badDataTimeslots.length);
      console.log('정상 이벤트 데이터가 있는 날짜 타임슬롯 개수:', goodDataTimeslots.length);

      // 잘못된 데이터는 무시되므로 타임슬롯이 더 많을 수 있음
      expect(badDataTimeslots.length).toBeGreaterThan(0);
      expect(goodDataTimeslots.length).toBeGreaterThan(0);
    });

    it('스케줄 무시 옵션으로 잘못된 이벤트 데이터 영향 확인', async () => {
      const baseRequest: RequestBody = {
        start_day_identifier: '20210506', // 잘못된 이벤트가 있는 날짜
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800
      };

      // 1. 스케줄 고려 (잘못된 데이터는 무시됨)
      const withScheduleCheck = await request(app)
        .post('/getTimeSlots')
        .send({ ...baseRequest, is_ignore_schedule: false })
        .expect(200);

      // 2. 스케줄 무시 (모든 이벤트 데이터 무시)
      const withoutScheduleCheck = await request(app)
        .post('/getTimeSlots')
        .send({ ...baseRequest, is_ignore_schedule: true })
        .expect(200);

      const withScheduleTimeslots = withScheduleCheck.body[0].timeslots;
      const withoutScheduleTimeslots = withoutScheduleCheck.body[0].timeslots;

      console.log('스케줄 고려 시 타임슬롯 개수:', withScheduleTimeslots.length);
      console.log('스케줄 무시 시 타임슬롯 개수:', withoutScheduleTimeslots.length);

      // 스케줄을 무시할 때 더 많은 타임슬롯이 있어야 함
      expect(withoutScheduleTimeslots.length).toBeGreaterThanOrEqual(withScheduleTimeslots.length);
    });
  });

  describe('타임존별 동작 테스트', () => {
    /*
     * 타임존 차이로 인해 start_of_day와 timeslots가 달라지는 이유:
     * 
     * 1. start_of_day: 각 타임존의 날짜 시작점(00:00:00)이 UTC 기준으로 다른 timestamp를 가짐
     *    - 예: 2021-05-09 00:00:00 Asia/Seoul = 1620486000 (UTC)
     *    - 예: 2021-05-09 00:00:00 America/New_York = 1620540000 (UTC)
     * 
     * 2. timeslots: 영업시간(open_interval, close_interval)이 해당 타임존 기준으로 계산됨
     *    - 동일한 영업시간이라도 타임존에 따라 다른 UTC timestamp로 변환됨
     *    - 서머타임(DST) 적용 여부에 따라서도 차이가 발생할 수 있음
     * 
     * 3. 타임존 오프셋:
     *    - Asia/Seoul: UTC+9 (2021-05-09 기준)
     *    - America/New_York: UTC-4 (2021-05-09 기준, EDT)
     *    - America/Sao_Paulo: UTC-3 (2021-05-09 기준)
     */

    it('Asia/Seoul 타임존 테스트', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'Asia/Seoul',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(typeof dayTimetable.start_of_day).toBe('number');
      expect(dayTimetable.start_of_day).toBeGreaterThan(0);
      expect(Array.isArray(dayTimetable.timeslots)).toBe(true);

      console.log('Asia/Seoul start_of_day:', dayTimetable.start_of_day);
      console.log('Asia/Seoul timeslots count:', dayTimetable.timeslots.length);
      if (dayTimetable.timeslots.length > 0) {
        console.log('Asia/Seoul first timeslot:', dayTimetable.timeslots[0]);
      }
    });

    it('America/New_York 타임존 테스트', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'America/New_York',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(typeof dayTimetable.start_of_day).toBe('number');
      expect(dayTimetable.start_of_day).toBeGreaterThan(0);
      expect(Array.isArray(dayTimetable.timeslots)).toBe(true);

      console.log('America/New_York start_of_day:', dayTimetable.start_of_day);
      console.log('America/New_York timeslots count:', dayTimetable.timeslots.length);
      if (dayTimetable.timeslots.length > 0) {
        console.log('America/New_York first timeslot:', dayTimetable.timeslots[0]);
      }
    });

    it('America/Sao_Paulo 타임존 테스트', async () => {
      const requestBody: RequestBody = {
        start_day_identifier: '20210509',
        timezone_identifier: 'America/Sao_Paulo',
        service_duration: 3600,
        days: 1,
        timeslot_interval: 1800
      };

      const response = await request(app)
        .post('/getTimeSlots')
        .send(requestBody)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const dayTimetable: DayTimetable = response.body[0];
      expect(typeof dayTimetable.start_of_day).toBe('number');
      expect(dayTimetable.start_of_day).toBeGreaterThan(0);
      expect(Array.isArray(dayTimetable.timeslots)).toBe(true);

      console.log('America/Sao_Paulo start_of_day:', dayTimetable.start_of_day);
      console.log('America/Sao_Paulo timeslots count:', dayTimetable.timeslots.length);
      if (dayTimetable.timeslots.length > 0) {
        console.log('America/Sao_Paulo first timeslot:', dayTimetable.timeslots[0]);
      }
    });

    it('타임존별 start_of_day 값 차이 검증', async () => {
      const timezones = ['Asia/Seoul', 'America/New_York', 'America/Sao_Paulo'];
      const results: { timezone: string; start_of_day: number }[] = [];

      // 각 타임존별로 API 호출하여 start_of_day 값 수집
      for (const timezone of timezones) {
        const requestBody: RequestBody = {
          start_day_identifier: '20210509',
          timezone_identifier: timezone,
          service_duration: 3600,
          days: 1,
          timeslot_interval: 1800
        };

        const response = await request(app)
          .post('/getTimeSlots')
          .send(requestBody)
          .expect(200);

        const dayTimetable: DayTimetable = response.body[0];
        results.push({
          timezone,
          start_of_day: dayTimetable.start_of_day
        });
      }

      // 결과 출력
      console.log('\n=== 타임존별 start_of_day 비교 ===');
      results.forEach(result => {
        const date = new Date(result.start_of_day * 1000);
        console.log(`${result.timezone}: ${result.start_of_day} (${date.toISOString()})`);
      });

      // 모든 타임존의 start_of_day 값이 다른지 확인
      const uniqueStartOfDays = new Set(results.map(r => r.start_of_day));
      expect(uniqueStartOfDays.size).toBe(timezones.length);
      
      // 각 값이 0보다 큰지 확인
      results.forEach(result => {
        expect(result.start_of_day).toBeGreaterThan(0);
      });
    });
  });
}); 