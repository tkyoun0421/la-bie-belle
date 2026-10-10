import { shiftMonth, spellMonth } from "@/shared/utils/kstDate";
import {
  type DateSpan,
  monthSpan,
} from "@/features/payrollCompute/model/dateSpan.policy";
import { weekStartOf } from "@/features/payrollCompute/utils/payrollTotal.utils";

export type PeriodUnit = "week" | "month" | "year";

export type Period =
  | { unit: "week"; weekStart: string }
  | { unit: "month"; month: string }
  | { unit: "year"; year: string };

const DAY_MS = 24 * 60 * 60 * 1000;

const LAST_DAY_OF_WEEK = 6;

const MONTHS_PER_YEAR = 12;

function shiftDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function weekEndOf(weekStart: string): string {
  return shiftDays(weekStart, LAST_DAY_OF_WEEK);
}

function spellWeek(weekStart: string): string {
  const weekEnd = weekEndOf(weekStart);
  const [, fromMonth, fromDay] = weekStart.split("-").map(Number);
  const [, toMonth, toDay] = weekEnd.split("-").map(Number);

  return fromMonth === toMonth
    ? `${fromMonth}월 ${fromDay}일~${toDay}일`
    : `${fromMonth}월 ${fromDay}일~${toMonth}월 ${toDay}일`;
}

export function periodLabel(period: Period): string {
  switch (period.unit) {
    case "week":
      return spellWeek(period.weekStart);
    case "month":
      return spellMonth(period.month);
    case "year":
      return `${period.year}년`;
  }
}

export function shiftPeriod(period: Period, step: number): Period {
  switch (period.unit) {
    case "week":
      return {
        unit: "week",
        weekStart: shiftDays(period.weekStart, step * (LAST_DAY_OF_WEEK + 1)),
      };
    case "month":
      return { unit: "month", month: shiftMonth(period.month, step) };
    case "year":
      return { unit: "year", year: String(Number(period.year) + step) };
  }
}

export function periodMonthKeys(period: Period): string[] {
  switch (period.unit) {
    case "week":
      return [
        ...new Set([
          period.weekStart.slice(0, 7),
          weekEndOf(period.weekStart).slice(0, 7),
        ]),
      ];
    case "month":
      return [period.month];
    case "year":
      return Array.from(
        { length: MONTHS_PER_YEAR },
        (_, at) => `${period.year}-${String(at + 1).padStart(2, "0")}`,
      );
  }
}

export function periodAnchor(period: Period): string {
  switch (period.unit) {
    case "week":
      return period.weekStart;
    case "month":
      return period.month;
    case "year":
      return period.year;
  }
}

export function anchorOfDate(date: string, unit: PeriodUnit): string {
  switch (unit) {
    case "week":
      return weekStartOf(date);
    case "month":
      return date.slice(0, 7);
    case "year":
      return date.slice(0, 4);
  }
}

export function periodOf(date: string, unit: PeriodUnit): Period {
  switch (unit) {
    case "week":
      return { unit, weekStart: weekStartOf(date) };
    case "month":
      return { unit, month: date.slice(0, 7) };
    case "year":
      return { unit, year: date.slice(0, 4) };
  }
}

export function periodStartDate(period: Period): string {
  switch (period.unit) {
    case "week":
      return period.weekStart;
    case "month":
      return `${period.month}-01`;
    case "year":
      return `${period.year}-01-01`;
  }
}

export function periodSpan(period: Period): DateSpan {
  switch (period.unit) {
    case "week":
      return {
        from: period.weekStart,
        to: weekEndOf(period.weekStart),
      };
    case "month":
      return monthSpan(period.month);
    case "year":
      return { from: `${period.year}-01-01`, to: `${period.year}-12-31` };
  }
}

export function isInPeriod(period: Period, date: string): boolean {
  return anchorOfDate(date, period.unit) === periodAnchor(period);
}

export function periodUnitOf(value: string): PeriodUnit {
  switch (value) {
    case "week":
    case "year":
      return value;
    default:
      return "month";
  }
}
