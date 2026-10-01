/**
 * 급여가 캐시에서 건드리는 키 둘이다. `docs/2-design/system/runtime.md`의 「TanStack Query
 * 규칙」이 키를 `[도메인, 범위]`로 정했고, 쓰기 셋이 무효화하는 것은 접두사 `['payroll']`
 * 하나다(plan payroll-wages AC-05).
 *
 * 시급은 달이 없어 범위가 `'wages'`다 — 달치 급여(`['payroll', '2026-09']`)와 같은 접두사
 * 아래 나란히 앉아, 시급을 고치면 그 달 금액도 같이 다시 읽힌다.
 */

export const PAYROLL_KEY = ["payroll"] as const;

export const WAGES_KEY = ["payroll", "wages"] as const;
