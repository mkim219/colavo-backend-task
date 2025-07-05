import { DateTime } from 'luxon';
import { RequestBody, DayTimetable, Timeslot, Event, Workhour } from '../types/interfaces';
import { 
  parseDayIdentifier, 
  getStartOfDay, 
  getWeekday, 
  addInterval, 
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
      start_day_identifier,
      timezone_identifier,
      service_duration,
      days = 1,
      timeslot_interval = 1800, // 30분 기본값
      is_ignore_schedule = false,
      is_ignore_workhour = false
    } = request;

    const baseDate = parseDayIdentifier(start_day_identifier, timezone_identifier);
    const dayTimetables: DayTimetable[] = [];

    for (let i = 0; i < days; i++) {
      const currentDate = baseDate.plus({ days: i });
      const dayTimetable = this.generateDayTimetable(
        currentDate,
        baseDate,
        service_duration,
        timeslot_interval,
        is_ignore_schedule,
        is_ignore_workhour
      );
      dayTimetables.push(dayTimetable);
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
    const startOfDay = getStartOfDay(date);
    const dayModifier = calculateDayModifier(baseDate, date);
    const weekday = getWeekday(date);
  
    // 영업시간 조회
    const workhour = this.getWorkhourByWeekday(weekday);
    const isDayOff = workhour?.is_day_off || false;

    let timeslots: Timeslot[] = [];

    if (!isDayOff && workhour) {
      if (isIgnoreWorkhour) {
        // 하루 전체를 타임슬롯으로 설정
        timeslots = this.generateFullDayTimeslots(date, serviceDuration, timeslotInterval);
      } else {
        // 영업시간 내에서 타임슬롯 생성
        timeslots = this.generateWorkingHourTimeslots(
          date, 
          workhour, 
          serviceDuration, 
          timeslotInterval
        );
      }

      // 기존 예약과 충돌 확인
      if (!isIgnoreSchedule) {
        timeslots = this.filterConflictingTimeslots(timeslots, serviceDuration);
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
    const timeslots: Timeslot[] = [];
    const startOfDay = date.startOf('day');
    const endOfDay = date.endOf('day');

    let currentTime = startOfDay;
    while (currentTime.plus({ seconds: serviceDuration }).toUnixInteger() <= endOfDay.toUnixInteger()) {
      const beginAt = currentTime.toUnixInteger();
      const endAt = currentTime.plus({ seconds: serviceDuration }).toUnixInteger();

      timeslots.push({ begin_at: beginAt, end_at: endAt });
      currentTime = currentTime.plus({ seconds: timeslotInterval });
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
    if (workhour.open_interval === workhour.close_interval) {
      return timeslots; // 영업시간이 없음
    }

    const startOfDay = date.startOf('day');
    const workStart = startOfDay.plus({ seconds: workhour.open_interval });
    const workEnd = startOfDay.plus({ seconds: workhour.close_interval });

    let currentTime = workStart;
    while (currentTime.plus({ seconds: serviceDuration }).toUnixInteger() <= workEnd.toUnixInteger()) {
      const beginAt = currentTime.toUnixInteger();
      const endAt = currentTime.plus({ seconds: serviceDuration }).toUnixInteger();

      timeslots.push({ begin_at: beginAt, end_at: endAt });
      currentTime = currentTime.plus({ seconds: timeslotInterval });
    }

    return timeslots;
  }

  /**
   * 기존 예약과 충돌하는 타임슬롯 필터링
   */
  private filterConflictingTimeslots(timeslots: Timeslot[], serviceDuration: number): Timeslot[] {
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