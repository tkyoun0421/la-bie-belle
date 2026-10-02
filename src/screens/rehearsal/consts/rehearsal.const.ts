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

/** 달 이름 옆 꺾쇠다. SVG는 className이 안 닿아 숫자로 받는다. */
export const MONTH_CHEVRON_SIZE = 14;

/**
 * 화면에 뜨는 글자다. 정본은
 * `docs/2-design/modules/schedule/screens/rehearsal.md`의 「문안」이고, 지우기 확인창은 같은
 * 문서의 「고치는 시트 짜임」이다.
 *
 * 시트 안에서 거절을 말하는 문구는 여기가 아니라 `model/addSheetState.reducer.ts`가 든다 —
 * 어느 말이 뜨는지가 받은 오류 코드에 달려 있어 판정과 떨어지면 둘이 어긋난다.
 */
export const REHEARSAL_COPY = {
  appBarTitle: "리허설",
  legend: "칸 아래 숫자는 그날 리허설 시간이에요",
  readFailed: "리허설을 불러오지 못했어요",
  retry: "다시 시도",
  removeTitle: "이 리허설을 지울까요?",
  removeBody: "급여에서도 빠져요",
  removeCancel: "그만두기",
  removeConfirm: "지우기",
};

/** e2e가 달 고르기를 집는 손이다. */
export const MONTH_TEST_ID = "rehearsal-month";

/** e2e가 지우기 확인을 집는 손이다 — 시트 뒤에 같은 글자의 버튼이 깔린다. */
export const REMOVE_CONFIRM_TEST_ID = "rehearsal-remove-confirm-button";
