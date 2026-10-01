/**
 * 조정 고르기 시트에 「원래대로」가 서는지다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「근무 조정」이다.
 *
 * **조건은 조정 행의 유무다.** 마지막 행이 0분이어서 지금 손본 것이 없는 사람에게도 선다 —
 * 「원래대로」가 행을 지우는 것이 아니라 0분인 새 행을 넣는 것이라 한 번 더 눌러도 틀린 동작이
 * 아니다.
 *
 * **근무 조정 줄의 셈과 보는 축이 다르다.** 그쪽은 마지막 행의 분을 보고 이쪽은 행의 유무만
 * 본다 — 되돌린 사람은 안 세지만 되돌리기는 계속 보인다.
 */

const DIGITS_ONLY = /[^0-9]/g;

export type AdjustChoiceRow = {
  minutes: number;
};

export function showRevertOption(rows: readonly AdjustChoiceRow[]): boolean {
  return rows.length > 0;
}

/** 칸에 남는 글자다 — 단위가 분이라 숫자만 받는다. */
export function nextMinuteDigits(text: string): string {
  return text.replace(DIGITS_ONLY, "");
}

/** 「바꾸기」가 보낼 분이다. 빈 칸과 0분은 보낼 것이 없어 `null`이다. */
export function extraMinutes(digits: string): number | null {
  const minutes = Number(digits);

  return digits === "" || minutes === 0 ? null : minutes;
}
