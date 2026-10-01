/**
 * 시급 시트 둘이 같이 쓰는 값과 문안이다.
 *
 * **상한 100,000원은 표도 같은 값을 든다**(`wage_rates` check). 자릿수 오타를 거르는 선이라
 * 값을 잘라 넣지 않고 이전 값을 그대로 둔다 — 그 판정은 `model/wageAmount.policy.ts`가
 * 한다(`wages.md` 「기본 시급 시트」).
 */

export const WAGE_MAX = 100000;

/** 「두 시트 다」라고 적힌 문안 셋이 이 조각의 것이다(plan payroll-wages AC-04). */
export const WAGE_CAP_HINT = "여기까지만 쓸 수 있어요";

export const WAGE_SAVE_FAILED_TITLE = "시급을 저장하지 못했어요";

export const WAGE_SAVE_FAILED_SUB =
  "넣은 값은 그대로 있어요 · 다시 저장해볼게요";

/** 적용은 언제나 오늘부터고 날짜 고르개가 없다(PAY-008) — 두 시트가 같은 한 줄을 쓴다. */
export const WAGE_TODAY_NOTE = "오늘부터 적용돼요";
