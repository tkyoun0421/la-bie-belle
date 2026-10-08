import type { PayrollDay } from "@/features/payrollCompute/model/payrollDays.policy";

export type WeekTotal = {
  weekStart: string;
  minutes: number;
  amount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const MONDAY_OFFSET = 6;

const DAYS_PER_WEEK = 7;

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
