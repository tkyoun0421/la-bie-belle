/**
 * 미니 달력의 칸 배치다. 정본은
 * `docs/2-design/design-system/components.md`의 「미니 달력」이다.
 *
 * **주는 월요일에 시작한다** — 큰 달력과 같다. **줄 수가 달마다 달라 높이가 바뀐다**: 1일이
 * 늦은 요일이고 31일까지 있는 달은 여섯 줄이 필요하고, 다섯 줄에 욱여넣으면 마지막 주가
 * 사라진다.
 *
 * 그리드가 이 달 밖으로 남긴 칸은 비운다. 흐린 숫자라도 남기면 그 달에 든 날로 읽힌다.
 *
 * `month`는 1부터다 — 사람이 부르는 대로 받는다. `Date`의 0부터 세는 달은 이 파일 안에서만
 * 산다.
 */

const DAYS_IN_WEEK = 7;

/** `Date`는 일요일을 0으로 세고 달력은 월요일에서 시작한다. */
function mondayIndexOfFirstDay(year: number, month: number): number {
  return (
    (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % DAYS_IN_WEEK
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function miniCalendarWeekCount(year: number, month: number): number {
  const cells = mondayIndexOfFirstDay(year, month) + daysInMonth(year, month);

  return Math.ceil(cells / DAYS_IN_WEEK);
}

export function miniCalendarGrid(
  year: number,
  month: number,
): (number | null)[][] {
  const offset = mondayIndexOfFirstDay(year, month);
  const lastDay = daysInMonth(year, month);

  return Array.from({ length: miniCalendarWeekCount(year, month) }, (_, week) =>
    Array.from({ length: DAYS_IN_WEEK }, (_, column) => {
      const day = week * DAYS_IN_WEEK + column - offset + 1;

      return day >= 1 && day <= lastDay ? day : null;
    }),
  );
}
