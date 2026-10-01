/**
 * 리허설이 캐시에서 건드리는 키들이다. `docs/2-design/system/runtime.md`의 「TanStack Query
 * 규칙」이 키를 `[도메인, 범위]`로 정했고 무엇을 언제 낡게 하는지는
 * `docs/2-design/modules/schedule/design.md`의 「리허설 넣기·고치기·지우기」가 든다.
 *
 * **`['schedule']`은 안 건드린다.** 리허설이 그 키에 안 실린다 — 배정도 근무 시간도 안
 * 바뀌는데 근무표를 다시 읽을 이유가 없다. 급여는 리허설 시간을 더하므로 같이 낡는다.
 *
 * 같은 `['payroll']` 상수가 `features/schedule`에도 적혀 있는 것은 슬라이스끼리 서로를 못
 * import해서다(규칙 3). 키 문자열의 정본은 코드가 아니라 runtime.md다.
 */

export const REHEARSAL_KEY = ["rehearsal"] as const;

export const PAYROLL_KEY = ["payroll"] as const;

/** 넣고 고치고 지우는 판정이 같이 낡게 하는 둘이다. */
export const REHEARSAL_WRITE_KEYS = [REHEARSAL_KEY, PAYROLL_KEY] as const;

/** 관리자가 보는 전원 키의 꼬리다 — `['rehearsal', month, 'all']`. */
export const ALL_SCOPE = "all";
