import { MIXED_MONTH_APPLICATIONS } from "@/entities/schedule/model/application.mock";
import {
  EMPTY_MONTH_WORK_SCHEDULES,
  MIXED_MONTH_WORK_SCHEDULES,
} from "@/entities/schedule/model/work-schedule.mock";

export const SCHEDULE_MIXED_MONTH = {
  month: new Date(2026, 7, 1),
  workSchedules: MIXED_MONTH_WORK_SCHEDULES,
  applications: MIXED_MONTH_APPLICATIONS,
  confirmedDates: ["2026-08-07"],
};

export const SCHEDULE_EMPTY_MONTH = {
  month: new Date(2026, 8, 1),
  workSchedules: EMPTY_MONTH_WORK_SCHEDULES,
  applications: [],
  confirmedDates: [],
};
