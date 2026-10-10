import { kstDateOf, lastDateOfMonth } from "@/shared/utils/kstDate";

export type MonthEmptyStateInput = {
  month: string;
  now: string;
};

export function isMonthFullyPast({
  month,
  now,
}: MonthEmptyStateInput): boolean {
  return lastDateOfMonth(month) < kstDateOf(now);
}
