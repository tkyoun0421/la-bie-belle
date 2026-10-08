import type { MonthWindowRow } from "@/entities/schedule/api/schedule.dto";
import type { MonthWindow } from "@/entities/schedule/model/schedule.type";

export function toMonthWindow(row: MonthWindowRow): MonthWindow {
  return {
    applicationDeadline: row.application_deadline,
    confirmedAt: row.confirmed_at,
  };
}
