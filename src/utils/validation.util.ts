import { RequestBody } from '../types/interfaces';
import { isValidTimezone } from './timezone.util';

/**
 * 요청 바디 유효성 검사
 * @param body - 요청 바디
 * @returns 검증 결과와 오류 메시지
 */
export function validateRequestBody(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 필수 필드 검사
  if (!body.start_day_identifier || typeof body.start_day_identifier !== 'string') {
    errors.push('start_day_identifier는 필수 문자열입니다.');
  } else if (!/^\d{8}$/.test(body.start_day_identifier)) {
    errors.push('start_day_identifier는 YYYYMMDD 형식이어야 합니다.');
  }

  if (!body.timezone_identifier || typeof body.timezone_identifier !== 'string') {
    errors.push('timezone_identifier는 필수 문자열입니다.');
  } else if (!isValidTimezone(body.timezone_identifier)) {
    errors.push('유효하지 않은 timezone_identifier입니다.');
  }

  if (body.service_duration === undefined || typeof body.service_duration !== 'number') {
    errors.push('service_duration은 필수 숫자입니다.');
  } else if (body.service_duration <= 0) {
    errors.push('service_duration은 양수여야 합니다.');
  }

  // 선택적 필드 검사
  if (body.days !== undefined) {
    if (typeof body.days !== 'number' || body.days <= 0) {
      errors.push('days는 양수여야 합니다.');
    }
  }

  if (body.timeslot_interval !== undefined) {
    if (typeof body.timeslot_interval !== 'number' || body.timeslot_interval <= 0) {
      errors.push('timeslot_interval은 양수여야 합니다.');
    }
  }

  if (body.is_ignore_schedule !== undefined && typeof body.is_ignore_schedule !== 'boolean') {
    errors.push('is_ignore_schedule은 불린값이어야 합니다.');
  }

  if (body.is_ignore_workhour !== undefined && typeof body.is_ignore_workhour !== 'boolean') {
    errors.push('is_ignore_workhour은 불린값이어야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 날짜 식별자 유효성 검사
 * @param dayIdentifier - 날짜 식별자 (YYYYMMDD)
 * @returns 유효한 날짜인지 여부
 */
export function isValidDateIdentifier(dayIdentifier: string): boolean {
  if (!/^\d{8}$/.test(dayIdentifier)) {
    return false;
  }

  const year = parseInt(dayIdentifier.substring(0, 4));
  const month = parseInt(dayIdentifier.substring(4, 6));
  const day = parseInt(dayIdentifier.substring(6, 8));

  const date = new Date(year, month - 1, day);
  
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
} 