import { NO_VALUE } from "@/shared/consts/noValue.const";

/**
 * 급여 화면이 쓰는 정해진 값이다.
 */

/** 금액 자리가 비는 꼴이다. 내역 줄의 결근·시급 미정도 같은 글자를 쓴다. */
export const NO_AMOUNT = NO_VALUE;

/** 세그먼트가 고르는 단위 셋이다 — 값은 `PeriodUnit`과 같은 글자다. */
export const UNIT_OPTIONS = [
  { value: "week", label: "주" },
  { value: "month", label: "월" },
  { value: "year", label: "연" },
];

/**
 * 화면에 뜨는 글자다. 정본은
 * `docs/2-design/modules/payroll/screens/payroll.md`의 문안 표다.
 *
 * **`estimateNote`는 통계 화면과 사본 둘이다** — 같은 글자가 두 화면에 서는데 접는 자리를
 * 이 열이 못 정한다. AC-13의 사본 묶음 task가 받는다.
 */
export const PAYROLL_COPY = {
  appBarTitle: "급여",
  estimateNote: "예상치예요. 실제 지급액과 다를 수 있어요",
  readFailed: "급여를 불러오지 못했어요",
  retry: "다시 시도",
  emptyTitle: "아직 근무가 없어요",
  emptyBody: "근무한 날이 생기면 여기 서요",
  totalTitle: "합계",
  workLabel: "근무",
  lateLabel: "지각",
};

export const SEGMENT_TEST_ID = "payroll-segment";

export const PREV_PERIOD_TEST_ID = "payroll-period-prev";

export const NEXT_PERIOD_TEST_ID = "payroll-period-next";
