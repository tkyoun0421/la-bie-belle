import type { PayrollDay } from "@/features/payroll/model/payroll-days";

/**
 * 날짜별 금액을 주와 달로 묶는다. **주는 월요일에 시작해 일요일에 끝나고**
 * (`docs/2-design/modules/payroll/README.md`의 PAY-021) **달은 달력 달이다**(PAY-022).
 *
 * **달을 걸친 주가 둘을 갈라놓는다.** 주 합계는 8월 31일부터 9월 6일까지를 한 줄로 묶지만,
 * 달 합계는 그 주를 날짜로 갈라 8월 31일만 8월에 넣는다. 주 단위로 자르면 한 달의 합계에
 * 다른 달 엿새가 통째로 딸려 들어간다.
 */

export type WeekTotal = {
  weekStart: string;
  minutes: number;
  amount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const MONDAY_OFFSET = 6;

const DAYS_PER_WEEK = 7;

/** `"2026-09-06"`(일요일)의 주는 `"2026-08-31"`에 시작한다. */
export function weekStartOf(date: string): string {
  const instant = Date.parse(`${date}T00:00:00Z`);
  const weekday = new Date(instant).getUTCDay();
  const back = (weekday + MONDAY_OFFSET) % DAYS_PER_WEEK;

  return new Date(instant - back * DAY_MS).toISOString().slice(0, 10);
}

export function weekTotals(days: readonly PayrollDay[]): WeekTotal[] {
  const byWeek = new Map<string, WeekTotal>();

  for (const day of days) {
    const weekStart = weekStartOf(day.date);
    const kept = byWeek.get(weekStart) ?? { weekStart, minutes: 0, amount: 0 };

    byWeek.set(weekStart, {
      weekStart,
      minutes: kept.minutes + day.minutes,
      amount: kept.amount + day.amount,
    });
  }

  return [...byWeek.values()].sort((left, right) =>
    left.weekStart < right.weekStart ? -1 : 1,
  );
}

export function monthTotal(days: readonly PayrollDay[], month: string): number {
  const prefix = month.slice(0, 7);

  return days
    .filter((day) => day.date.startsWith(prefix))
    .reduce((sum, day) => sum + day.amount, 0);
}
