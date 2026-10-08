import { wageAt } from "@/entities/payroll/model/wageAt.policy";

export type WageHistoryRow = {
  effective_date: string;
  amount: number;
};

export type WageHistory = {
  rows: WageHistoryRow[];
  hasMore: boolean;
};

const HISTORY_SHOWN = 3;

export function buildWageHistory(
  rows: readonly WageHistoryRow[],
  expanded = false,
): WageHistory {
  if (rows.length <= 1) {
    return { rows: [], hasMore: false };
  }

  const recent = [...rows].sort((left, right) =>
    right.effective_date.localeCompare(left.effective_date),
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
  rates: readonly WageHistoryRow[],
  today: string,
): number | null {
  return wageAt(rates, today);
}

export function spellWageDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return `${year}년 ${month}월 ${day}일`;
}
