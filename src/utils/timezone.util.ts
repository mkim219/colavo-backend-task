import { DateTime } from 'luxon';

/**
 * start_day_identifier를 특정 타임존의 날짜로 변환
 * @param startDayIdentifier - 형태: "20210509"
 * @param timezoneIdentifier - 타임존 식별자
 * @returns DateTime 객체
 */
export function parseDayIdentifier(startDayIdentifier: string, timezoneIdentifier: string): DateTime {
  const year = parseInt(startDayIdentifier.substring(0, 4));
  const month = parseInt(startDayIdentifier.substring(4, 6));
  const day = parseInt(startDayIdentifier.substring(6, 8));
  
  return DateTime.fromObject(
    { year, month, day, hour: 0, minute: 0, second: 0 },
    { zone: timezoneIdentifier }
  );
}

/**
 * 특정 날짜의 하루 시작 시간을 Unix timestamp로 반환
 * @param date - DateTime 객체
 * @returns Unix timestamp (초 단위)
 */
export function getStartOfDay(date: DateTime): number {
  return date.startOf('day').toUnixInteger();
}

/**
 * 특정 날짜의 요일을 반환 (1: 일요일 ~ 7: 토요일)
 * @param date - DateTime 객체
 * @returns 요일 숫자
 */
export function getWeekday(date: DateTime): number {
  const jsWeekday = date.weekday; // Luxon: 1=월요일, 7=일요일
  return jsWeekday === 7 ? 1 : jsWeekday + 1; // 변환: 1=일요일, 7=토요일
}

/**
 * 날짜에 interval 초를 더한 Unix timestamp 반환
 * @param date - DateTime 객체
 * @param interval - 초 단위 간격
 * @returns Unix timestamp (초 단위)
 */
export function addInterval(date: DateTime, interval: number): number {
  return date.plus({ seconds: interval }).toUnixInteger();
}

/**
 * day_modifier 계산 (기준 날짜로부터 며칠 후인지)
 * @param baseDate - 기준 날짜
 * @param targetDate - 대상 날짜
 * @returns day_modifier 값
 */
export function calculateDayModifier(baseDate: DateTime, targetDate: DateTime): number {
  const baseDayStart = baseDate.startOf('day');
  const targetDayStart = targetDate.startOf('day');
  return Math.floor(targetDayStart.diff(baseDayStart, 'days').days);
}

/**
 * 타임존 유효성 검사
 * @param timezoneIdentifier - 타임존 식별자
 * @returns 유효한 타임존인지 여부
 */
export function isValidTimezone(timezoneIdentifier: string): boolean {
  try {
    const testDate = DateTime.now().setZone(timezoneIdentifier);
    // 타임존이 유효하지 않으면 DateTime이 invalid 상태가 됨
    return testDate.isValid;
  } catch {
    return false;
  }
} 