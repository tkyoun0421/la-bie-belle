import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";

import type { ApplicationCountEntry } from "@/entities/schedule/model/application-count";
import type { RecruitmentSchedule } from "@/entities/schedule/model/recruitment-schedule";
import type { CalendarCellState } from "@/shared/ui/calendar";

const DATE_KEY_FORMAT = "yyyy-MM-dd";

export type RecruitmentCalendarDateState = {
  date: Date;
  state: CalendarCellState;
  disabled?: boolean;
  applicationCount?: number;
};

export type ToRecruitmentCellStatesParams = {
  month: Date;
  schedules: readonly RecruitmentSchedule[];
  selectedDates: ReadonlySet<string>;
  today: string;
  applicationCounts?: readonly ApplicationCountEntry[];
};

export function toRecruitmentCellStates({
  month,
  schedules,
  selectedDates,
  today,
  applicationCounts = [],
}: ToRecruitmentCellStatesParams): RecruitmentCalendarDateState[] {
  const scheduleByDate = new Map(
    schedules
      .filter((schedule) => schedule.status !== "CANCELLED")
      .map((schedule) => [schedule.workDate, schedule]),
  );
  const countByScheduleId = new Map(
    applicationCounts.map((entry) => [entry.scheduleId, entry.count]),
  );

  return eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map((date) => {
    const key = format(date, DATE_KEY_FORMAT);
    const schedule = scheduleByDate.get(key);

    if (selectedDates.has(key)) {
      return { date, state: "selected" };
    }
    if (schedule !== undefined) {
      const rawCount = countByScheduleId.get(schedule.id);
      const applicationCount = rawCount !== undefined && rawCount > 0 ? rawCount : undefined;
      if (schedule.status === "OPEN") {
        return { date, state: "open", applicationCount };
      }
      if (schedule.status === "CLOSED") {
        return { date, state: "closed", applicationCount };
      }
      return { date, state: "open", disabled: true, applicationCount };
    }
    if (key < today) {
      return { date, state: "none" };
    }
    return { date, state: "selectable" };
  });
}
