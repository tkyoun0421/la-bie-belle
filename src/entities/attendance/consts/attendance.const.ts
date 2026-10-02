/**
 * 근태의 업무 상수다. 정본은 `docs/2-design/modules/attendance/README.md`고, 셋은 SQL 함수와
 * 값을 맞춰야 해서 `tests/lint/attendanceConstants.ts`가 마이그레이션의 리터럴과 대조한다.
 *
 * **지각 유예와 `checked_at` 기기 오차 한도는 다른 상수다.** 값이 같아 헷갈리니 이름으로
 * 가른다 — 앞은 업무 규칙(ATT-016)이고 뒤는 기기 시계 오차를 누르는 폭이다.
 */

export const LATE_THRESHOLD_MINUTES = 10;

export const CHECKED_AT_DEVICE_TOLERANCE_MINUTES = 10;

export const CHECK_IN_WINDOW_LEAD_MINUTES = 60;

export const CHECK_IN_WINDOW_CLOSE_HOUR_KST = 18;

export const EXCUSE_DEADLINE_HOURS = 48;

export const COMMUNICATION_DELAY_MINUTES = 5;

export const EXCUSE_BODY_MAX_LENGTH = 200;

/**
 * 월 집계가 세는 네 갈래다. 확인 중과 안 찍음은 어디에도 안 든다 — 아직 결말이 안 난 날이라
 * 넷 중 어디에 얹어도 그 달의 사실이 아니다. 출근과 출근 인정을 합치지 않는 것은 ATT-023이다.
 *
 * 이 목록이 `TalliedStatus`의 바탕이다.
 */
export const TALLIED_STATUSES = [
  "present",
  "late",
  "absent",
  "excused",
] as const;
