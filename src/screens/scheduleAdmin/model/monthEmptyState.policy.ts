import { lastDateOfMonth, shiftMonth } from "@/shared/utils/kstDate";
import { kstDateOf } from "@/entities/schedule/utils/formatScheduleDate.utils";

export type MonthEmptyStateInput = {
  month: string;
  now: string;
};

export { lastDateOfMonth, shiftMonth };

export function isMonthFullyPast({
  month,
  now,
}: MonthEmptyStateInput): boolean {
  return lastDateOfMonth(month) < kstDateOf(now);
}
