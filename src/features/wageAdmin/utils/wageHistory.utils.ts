import type { WageRate } from "@/entities/payroll/model/payroll.type";
import { wageAt } from "@/entities/payroll/model/wageAt.policy";

export type WageHistory = {
  rows: WageRate[];
  hasMore: boolean;
};

const HISTORY_SHOWN = 3;

export function buildWageHistory(
  rows: readonly WageRate[],
  expanded = false,
): WageHistory {
  if (rows.length <= 1) {
    return { rows: [], hasMore: false };
  }

  const recent = [...rows].sort((left, right) =>
    right.effectiveDate.localeCompare(left.effectiveDate),
  );

  if (expanded) {
    return { rows: recent, hasMore: false };
  }

  return {
    rows: recent.slice(0, HISTORY_SHOWN),
    hasMore: recent.length > HISTORY_SHOWN,
  };
}

export function prefillWageAmount(
  rates: readonly WageRate[],
  today: string,
): number | null {
  return wageAt(rates, today);
}

export function spellWageDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return `${year}년 ${month}월 ${day}일`;
}
