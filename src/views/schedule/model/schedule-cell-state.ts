import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";

import type { RecruitmentScheduleWithApplication } from "@/entities/schedule/model/recruitment-schedule";
import type { CalendarCellState } from "@/shared/ui/calendar";

const DATE_KEY_FORMAT = "yyyy-MM-dd";

export type ScheduleCalendarDateState = { date: Date; state: CalendarCellState };

export type ToScheduleCellStatesParams = {
  month: Date;
  schedules: readonly RecruitmentScheduleWithApplication[];
  pending: ReadonlySet<string>;
  savedApplied: ReadonlySet<string>;
};

export function toScheduleCellStates({
  month,
  schedules,
  pending,
  savedApplied,
}: ToScheduleCellStatesParams): ScheduleCalendarDateState[] {
  const scheduleByDate = new Map(
    schedules
      .filter((schedule) => schedule.status !== "CANCELLED")
      .map((schedule) => [schedule.workDate, schedule]),
  );

  return eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map((date) => {
    const key = format(date, DATE_KEY_FORMAT);
    const schedule = scheduleByDate.get(key);

    if (schedule === undefined) {
      return { date, state: "none" };
    }
    if (schedule.status === "CONFIRMED") {
      return { date, state: "confirmed" };
    }
    if (schedule.status !== "OPEN") {
      return { date, state: "closed" };
    }
    if (pending.has(key)) {
      return { date, state: savedApplied.has(key) ? "requested" : "selected" };
    }
    return { date, state: "open" };
  });
}
