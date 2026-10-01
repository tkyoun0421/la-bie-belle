/**
 * 달 고르기 시트의 셈이다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-worker.md`의 「달 고르기 시트 짜임」이다 —
 * 연도 줄이 해를 오가고 그 아래 월 12칸이 4열 3행으로 선다.
 *
 * **연도 이동에 열람 제한이 없다.** 입사 이전 해로도 넘어간다 — 무제한으로 거슬러 보는
 * 화면이라 시트도 같은 범위다.
 *
 * 지금 보고 있는 달만 선택 상태다. 다른 해를 보고 있으면 열두 칸 중 어느 것도 안 선택된다 —
 * 오늘이 든 달을 따로 표시하지 않는 것과 같은 이유로, 이 시트가 말하는 것은 어디로 갈지
 * 하나다.
 */

const MONTHS_IN_YEAR = 12;

export type YearMonthCell = {
  month: string;
  label: string;
  selected: boolean;
};

export function shiftYear(year: number, step: number): number {
  return year + step;
}

export function buildYearMonths(
  year: number,
  selectedMonth: string,
): YearMonthCell[] {
  return Array.from({ length: MONTHS_IN_YEAR }, (_unused, at) => {
    const month = `${String(year).padStart(4, "0")}-${String(at + 1).padStart(2, "0")}`;

    return {
      month,
      label: `${at + 1}월`,
      selected: month === selectedMonth.slice(0, 7),
    };
  });
}
