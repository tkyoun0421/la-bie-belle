import { lastDateOfMonth } from "@/shared/utils/kstDate";
import { monthStart } from "@/shared/utils/monthRange";

export function monthRange(month: string): { from: string; to: string } {
  return { from: monthStart(month), to: lastDateOfMonth(month) };
}
