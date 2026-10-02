/**
 * 리허설 화면의 정해진 값이다. 정본은
 * `docs/2-design/modules/schedule/screens/rehearsal.md`의 「날 시트 짜임」과 「넣는 중」이고,
 * 건수의 상·하한은 표의 check와 같은 값이다(`count between 1 and 9`).
 */

export const MIN_COUNT = 1;

export const MAX_COUNT = 9;

/**
 * 건수 칸이 받는 글자 수다. 상한에서 끌어내는 것은 칸이 받는 길이와 판정이 보는 길이가
 * 어긋나면 9를 넘긴 수가 칸을 지나 판정에서 막히기 때문이다.
 */
export const COUNT_MAX_LENGTH = String(MAX_COUNT).length;

/** `"14:00"`의 길이다. DB는 초까지 싣고 화면은 안 싣는다 — 자르는 자리가 셋이다. */
export const CLOCK_LENGTH = 5;

/** 줄이 하나면 합계를 안 그린다 — 같은 숫자가 두 번 선다. */
export const MIN_ROWS_FOR_TOTAL = 2;
