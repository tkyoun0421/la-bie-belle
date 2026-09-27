/**
 * 근무표가 캐시에서 건드리는 키들이다. `docs/2-design/system/runtime.md`의 「TanStack Query
 * 규칙」이 키를 `[도메인, 범위]`로 정했고, 어느 판정이 어느 키를 무효화하는지는
 * `docs/2-design/modules/schedule/design.md`의 각 행위가 든다.
 *
 * 근무표와 신청이 갈린 것은 읽는 사람이 달라서다 — 근무표는 전원이 같은 것을 보고 신청은 나만
 * 본다. 신청을 보내면 `['availability']` 하나만 낡는다.
 *
 * 날을 여닫고 근무 시간을 고치고 확정하는 판정은 셋을 같이 낡게 한다 — 근무표와 급여와
 * 요청이다. 근무가 생기고 없어지는 일이 급여와 요청의 입력이라 세 키가 한 묶음으로 움직인다.
 *
 * **홀 기본값만 `['hall']`이다.** 기본값을 바꿔도 이미 연 날은 안 바뀌므로 `['schedule']`을
 * 건드리지 않는다.
 *
 * 빈 자리는 그 달 근무표의 파생이라 `['schedule']` 아래에 산다 — 날을 열거나 확정하면
 * 접두사 하나로 같이 낡는다.
 *
 * 키 문자열의 정본은 코드가 아니라 runtime.md다.
 */

export const SCHEDULE_KEY = ["schedule"] as const;

export const AVAILABILITY_KEY = ["availability"] as const;

export const PAYROLL_KEY = ["payroll"] as const;

export const REQUESTS_KEY = ["requests"] as const;

export const HALL_KEY = ["hall"] as const;

/**
 * 자격은 사람의 속성이라 근무표가 아니라 명단 아래 산다 — `grant_position`이 낡게 하는 것도
 * `['members']` 하나다. 같은 상수가 `features/members`에도 적혀 있는 것은 슬라이스끼리
 * 서로를 못 import해서다(규칙 3).
 */
export const MEMBERS_KEY = ["members"] as const;

/** 자격 키의 꼬리다 — `['members', 'qualifications']`. */
export const QUALIFICATIONS_SCOPE = "qualifications";

/** 날을 여닫고 확정하는 판정이 같이 낡게 하는 셋이다. */
export const SCHEDULE_WRITE_KEYS = [
  SCHEDULE_KEY,
  PAYROLL_KEY,
  REQUESTS_KEY,
] as const;

/** 빈 자리 키의 꼬리다 — `['schedule', month, 'open-slots']`. */
export const OPEN_SLOTS_SCOPE = "open-slots";

/**
 * 판정 대기 목록 키의 꼬리다 — `['requests', 'approvals']`. 달로 안 가르는 것은 이 목록이
 * 달을 안 물어서다. 관리자는 답할 것이 있는지를 묻지 몇 월 것인지를 묻지 않는다.
 */
export const APPROVALS_SCOPE = "approvals";
