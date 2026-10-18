export type DateWindow = { from: string; to: string };

const MONTH_START = /^(\d{4})-(\d{2})-01$/;

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

function monthStartOf(year: number, monthIndex: number): string {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");
}

function yearAndMonthIndexOf(monthStart: string): [number, number] {
  const match = MONTH_START.exec(monthStart);
  if (!match) {
    throw new Error(`달은 1일 날짜로 받는다: "${monthStart}"`);
  }

  return [Number(match[1]), Number(match[2]) - 1];
}

export function monthWindow(
  monthStart: string,
  neighbours: boolean,
): DateWindow {
  const [year, monthIndex] = yearAndMonthIndexOf(monthStart);
  const reach = neighbours ? 1 : 0;

  return {
    from: monthStartOf(year, monthIndex - reach),
    to: monthStartOf(year, monthIndex + 1 + reach),
  };
}

export function yearWindow(year: number): DateWindow {
  return { from: monthStartOf(year, 0), to: monthStartOf(year + 1, 0) };
}

export function daysInMonth(monthStart: string): number {
  const [year, monthIndex] = yearAndMonthIndexOf(monthStart);

  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function firstFree<T>(
  draw: () => T,
  isFree: (candidate: T) => boolean,
  attempts: number,
): T | null {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = draw();
    if (isFree(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function rowsInWindowSql(table: string, column: string): string {
  if (!IDENTIFIER.test(table) || !IDENTIFIER.test(column)) {
    throw new Error(`표·열 이름 꼴이 아니다: "${table}.${column}"`);
  }

  return `select count(*) from public.${table} where ${column} >= :'from' and ${column} < :'to';\n`;
}
