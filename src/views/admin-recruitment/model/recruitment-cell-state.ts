import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";

import type { RecruitmentSchedule } from "@/entities/schedule/model/recruitment-schedule";
import type { CalendarCellState } from "@/shared/ui/calendar";

const DATE_KEY_FORMAT = "yyyy-MM-dd";

export type RecruitmentCalendarDateState = {
  date: Date;
  state: CalendarCellState;
  disabled?: boolean;
};

export type ToRecruitmentCellStatesParams = {
  month: Date;
  schedules: readonly RecruitmentSchedule[];
  selectedDates: ReadonlySet<string>;
  today: string;
};

export function toRecruitmentCellStates({
  month,
  schedules,
  selectedDates,
  today,
}: ToRecruitmentCellStatesParams): RecruitmentCalendarDateState[] {
  const activeDates = new Set(
    schedules
      .filter((schedule) => schedule.status !== "CANCELLED")
      .map((schedule) => schedule.workDate),
  );

  return eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map((date) => {
    const key = format(date, DATE_KEY_FORMAT);

    if (selectedDates.has(key)) {
      return { date, state: "selected" };
    }
    if (activeDates.has(key)) {
      return { date, state: "open", disabled: true };
    }
    if (key < today) {
      return { date, state: "none" };
    }
    return { date, state: "selectable" };
  });
}
