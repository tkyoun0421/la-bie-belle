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
