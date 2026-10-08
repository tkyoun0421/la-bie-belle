const DAYS_IN_WEEK = 7;

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
