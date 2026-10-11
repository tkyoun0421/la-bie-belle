import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";

export function indexDaysByDate(
  days: readonly ScheduleDay[],
): Map<string, ScheduleDay> {
  return new Map(days.map((day) => [day.workDate, day]));
}
