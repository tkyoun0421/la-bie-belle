import { shiftMonth } from "@/shared/utils/kstDate";
import { TREND_MONTHS } from "@/features/stats/consts/stats.const";

export type TrendPoint = {
  month: string;
  value: number | null;
};

export function trendMonths(viewingMonth: string): string[] {
  return Array.from({ length: TREND_MONTHS }, (_, at) =>
    shiftMonth(viewingMonth, at - (TREND_MONTHS - 1)),
  );
}

export function buildTrend(
  months: readonly string[],
  valueByMonth: ReadonlyMap<string, number>,
): TrendPoint[] {
  return months.map((month) => ({
    month,
    value: valueByMonth.get(month) ?? null,
  }));
}
