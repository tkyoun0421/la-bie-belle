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

/** e2e가 금액 칸을 집는 손이다 — 시트 둘이 같은 칸을 쓴다. */
export const WAGE_AMOUNT_INPUT_TEST_ID = "wage-amount-input";

/**
 * 화면과 시트 셋에 뜨는 글자다. 정본은
 * `docs/2-design/modules/payroll/screens/wages.md`의 문안 표다.
 *
 * 수가 섞이는 줄 둘(기본 시급 줄 아래와 기본 시급 시트)은 여기 조각으로 서고 잇는 것은
 * [`utils`](../utils/followerCount.utils.ts)가 한다 — 수를 세는 자리와 말하는 자리가 같다.
 */
export const WAGES_COPY = {
  appBarTitle: "시급",
  baseTitle: "기본 시급",
  noBase: "아직 안 정했어요",
  noFollower: "아직 이 값을 쓰는 사람이 없어요",
  followerSuffix: "명이 이 값을 써요",
  willFollowNone: "정하면 새로 승인되는 사람부터 붙어요",
  willFollowPrefix: "정하면 ",
  willFollowSuffix: "명에게 함께 붙어요",
  followerChangeSuffix: "명의 시급이 같이 바뀌어요",
  emptyTitle: "아직 승인된 사람이 없어요",
  emptyBody: "가입을 승인하면 여기 서요",
  resetRow: "기본 시급으로 되돌리기",
  historyTitle: "이력",
  more: "더 보기",
  close: "닫기",
  save: "저장",
  wageChanged: "시급을 바꿨어요",
  defaultChanged: "기본 시급을 바꿨어요",
  resetDone: "기본 시급으로 되돌렸어요",
  noDefaultWageNotice: "기본 시급을 아직 안 정했어요",
  resetTitle: "기본 시급으로 되돌릴까요?",
  resetConfirm: "되돌리기",
  resetBodyPrefix: "오늘부터 ",
  resetBodySuffix: "이 적용돼요",
};
