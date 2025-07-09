import { DateTime } from 'luxon';
import { RequestBody, DayTimetable, Timeslot, Event, Workhour } from '../types/interfaces';
import { 
  parseDayIdentifier, 
  getStartOfDay, 
  getWeekday, 
  calculateDayModifier 
} from '../utils/timezone.util';
import workhoursData from '../data/workhours.json';
import eventsData from '../data/events.json';

export class TimeslotService {
  private workhours: Workhour[];
  private events: Event[];

  constructor() {
    this.workhours = workhoursData as Workhour[];
    this.events = eventsData as Event[];
  }

  /**
   * 타임슬롯 생성 메인 함수
   */
  public generateTimeSlots(request: RequestBody): DayTimetable[] {
    const {
      start_day_identifier, // string값으로 들어오는 날짜를 파싱
      timezone_identifier, // 타임존 식별자
      service_duration, // 서비스 시간
      days = 1, // 기본값 1일
      timeslot_interval = 1800, // 30분 기본값
      is_ignore_schedule = false, // 기존 스케줄을 무시 여부
      is_ignore_workhour = false // 기존 영업시간을 무시 여부
    } = request;

    const baseDate = parseDayIdentifier(start_day_identifier, timezone_identifier); // 기존 스트링 값의 날짜를 UTC 기준으로 변환
    const dayTimetables: DayTimetable[] = []; // 하루 타임테이블 --> 수일의 타임테이블 배열

    for (let i = 0; i < days; i++) {
      const currentDate = baseDate.plus({ days: i }); // 기준 날짜에서 며칠 후의 날짜를 계산 따라서 days 만큼 반복
      const dayTimetable = this.generateDayTimetable( // 하루 타임테이블 생성
        currentDate,
        baseDate,
        service_duration,
        timeslot_interval,
        is_ignore_schedule,
        is_ignore_workhour
      );
      dayTimetables.push(dayTimetable); // 하루 타임테이블 배열에 추가
    }

    return dayTimetables;
  }

  /**
   * 하루 타임테이블 생성
   */
  private generateDayTimetable(
    date: DateTime,
    baseDate: DateTime,
    serviceDuration: number,
    timeslotInterval: number,
    isIgnoreSchedule: boolean,
    isIgnoreWorkhour: boolean
  ): DayTimetable {
    const startOfDay = getStartOfDay(date); // 하루의 시작 시간
    const dayModifier = calculateDayModifier(baseDate, date); // 기준 날짜로부터 며칠 후인지
    const weekday = getWeekday(date); // 요일 계산
  
    // 영업시간 조회
    const workhour = this.getWorkhourByWeekday(weekday); // 요일별 영업시간 조회
    const isDayOff = workhour?.is_day_off || false; // 영업 여부 확인

    let timeslots: Timeslot[] = []; // 타임슬롯 배열

    if (!isDayOff && workhour) { // 휴일이 아니고 영업시간이 있는 경우
      if (isIgnoreWorkhour) { // 영업시간 무시 여부 확인
        // 하루 전체를 타임슬롯으로 설정
        timeslots = this.generateFullDayTimeslots(date, serviceDuration, timeslotInterval); // 하루 전체 타임슬롯 생성
      } else {
        // 영업시간 내에서 타임슬롯 생성
        timeslots = this.generateWorkingHourTimeslots( // 영업시간 내에서 타임슬롯 생성
          date, 
          workhour, 
          serviceDuration, 
          timeslotInterval
        );
      }

      // 기존 예약과 충돌 확인
      if (!isIgnoreSchedule) {
        timeslots = this.filterConflictingTimeslots(timeslots); // 기존 예약과 충돌 확인
      }
    }

    return {
      start_of_day: startOfDay,
      day_modifier: dayModifier,
      is_day_off: isDayOff,
      timeslots
    };
  }

  /**
   * 요일별 영업시간 조회
   */
  private getWorkhourByWeekday(weekday: number): Workhour | undefined {
    return this.workhours.find(wh => wh.weekday === weekday);
  }

  /**
   * 하루 전체 타임슬롯 생성
   */
  private generateFullDayTimeslots(
    date: DateTime,
    serviceDuration: number,
    timeslotInterval: number
  ): Timeslot[] {
    const timeslots: Timeslot[] = []; // 타임슬롯 배열
    const startOfDay = date.startOf('day'); // 하루의 시작 시간
    const endOfDay = date.endOf('day'); // 하루의 끝 시간

    let currentTime = startOfDay; // 현재 시간
    while (currentTime.plus({ seconds: serviceDuration }).toUnixInteger() <= endOfDay.toUnixInteger()) { // 현재 시간에서 서비스 시간을 더한 시간이 하루의 끝 시간보다 작은 경우
      const beginAt = currentTime.toUnixInteger(); // 타임슬롯 시작 시간
      const endAt = currentTime.plus({ seconds: serviceDuration }).toUnixInteger(); // 타임슬롯 종료 시간

      timeslots.push({ begin_at: beginAt, end_at: endAt }); // 타임슬롯 배열에 추가
      currentTime = currentTime.plus({ seconds: timeslotInterval }); // 현재 시간에서 타임슬롯 간격을 더한 시간
    }

    return timeslots;
  }

  /**
   * 영업시간 내 타임슬롯 생성
   */
  private generateWorkingHourTimeslots(
    date: DateTime,
    workhour: Workhour,
    serviceDuration: number,
    timeslotInterval: number
  ): Timeslot[] {
    const timeslots: Timeslot[] = [];
    
    // 월요일의 특수 케이스 처리 (open_interval === close_interval)
    if (workhour.open_interval === workhour.close_interval) { // 오픈시간과 마감시간이 같을 경우
      return timeslots; // 영업시간이 없음
    }

    const startOfDay = date.startOf('day'); // 하루의 시작 시간
    const workStart = startOfDay.plus({ seconds: workhour.open_interval }); // 영업시간 시작 시간
    const workEnd = startOfDay.plus({ seconds: workhour.close_interval }); // 영업시간 종료 시간

    let currentTime = workStart; // 현재 시간
    while (currentTime.plus({ seconds: serviceDuration }).toUnixInteger() <= workEnd.toUnixInteger()) { // 현재 시간에서 서비스 시간을 더한 시간이 영업시간 종료 시간보다 작은 경우
      const beginAt = currentTime.toUnixInteger(); // 타임슬롯 시작 시간
      const endAt = currentTime.plus({ seconds: serviceDuration }).toUnixInteger(); // 타임슬롯 종료 시간

      timeslots.push({ begin_at: beginAt, end_at: endAt }); // 타임슬롯 배열에 추가
      currentTime = currentTime.plus({ seconds: timeslotInterval }); // 현재 시간에서 타임슬롯 간격을 더한 시간
    }

    return timeslots;
  }

  /**
   * 기존 예약과 충돌하는 타임슬롯 필터링
   */
  private filterConflictingTimeslots(timeslots: Timeslot[]): Timeslot[] {
    return timeslots.filter(timeslot => {
      // 해당 시간대에 겹치는 이벤트가 있는지 확인
      const hasConflict = this.events.some(event => {
        // 이벤트 데이터 검증 (begin_at > end_at인 경우 무시)
        if (event.begin_at > event.end_at) {
          return false;
        }
        
        // 충돌 조건: 시작시간이 정확히 같으면 충돌 (0초 이벤트, 일반 이벤트 모두 동일)
        return timeslot.begin_at === event.begin_at;
      });

      return !hasConflict;
    });
  }
} 