/**
 * 근무표가 캐시에서 건드리는 키 둘이다. `docs/2-design/system/runtime.md`의 「TanStack Query
 * 규칙」이 키를 `[도메인, 범위]`로 정했고, 어느 판정이 어느 키를 무효화하는지는
 * `docs/2-design/modules/schedule/design.md`의 각 행위가 든다.
 *
 * 근무표와 신청이 갈린 것은 읽는 사람이 달라서다 — 근무표는 전원이 같은 것을 보고 신청은 나만
 * 본다. 신청을 보내면 `['availability']` 하나만 낡는다.
 *
 * 키 문자열의 정본은 코드가 아니라 runtime.md다.
 */

export const SCHEDULE_KEY = ["schedule"] as const;

export const AVAILABILITY_KEY = ["availability"] as const;
