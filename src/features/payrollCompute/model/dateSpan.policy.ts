export type DateSpan = {
  from: string;
  to: string;
};

const MONTH_LENGTH = 7;

const MONTHS_PER_YEAR = 12;

function monthOf(date: string): string {
  return date.slice(0, MONTH_LENGTH);
}

function nextMonth(month: string): string {
  const year = Number(month.slice(0, 4));
  const at = Number(month.slice(5, MONTH_LENGTH));

  return at === MONTHS_PER_YEAR
    ? `${year + 1}-01`
    : `${year}-${String(at + 1).padStart(2, "0")}`;
}

export function monthKeysOf(span: DateSpan): string[] {
  const last = monthOf(span.to);
  const months = [monthOf(span.from)];

  while (months[months.length - 1] < last) {
    months.push(nextMonth(months[months.length - 1]));
  }

  return months;
}

function lastDayOf(month: string): number {
  const year = Number(month.slice(0, 4));
  const at = Number(month.slice(5, MONTH_LENGTH));

  return new Date(Date.UTC(year, at, 0)).getUTCDate();
}

export function monthSpan(month: string): DateSpan {
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDayOf(month)).padStart(2, "0")}`,
  };
}

export function isInSpan(span: DateSpan, date: string): boolean {
  return date >= span.from && date <= span.to;
}
