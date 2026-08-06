import type { WorkSchedule } from "@/entities/schedule/model/work-schedule";

export const OPEN_WORK_SCHEDULE: WorkSchedule = {
  date: "2026-08-09",
  status: "open",
  applicationDeadline: "2026-08-07T23:59:00+09:00",
};

export const CLOSED_WORK_SCHEDULE: WorkSchedule = {
  date: "2026-08-06",
  status: "closed",
  applicationDeadline: "2026-08-04T23:59:00+09:00",
};

export const MIXED_MONTH_WORK_SCHEDULES: WorkSchedule[] = [
  { date: "2026-08-02", status: "closed", applicationDeadline: "2026-07-31T23:59:00+09:00" },
  { date: "2026-08-03", status: "open", applicationDeadline: "2026-08-01T23:59:00+09:00" },
  { date: "2026-08-04", status: "open", applicationDeadline: "2026-08-02T23:59:00+09:00" },
  { date: "2026-08-05", status: "open", applicationDeadline: "2026-08-03T23:59:00+09:00" },
  { date: "2026-08-06", status: "closed", applicationDeadline: "2026-08-04T23:59:00+09:00" },
  { date: "2026-08-07", status: "closed", applicationDeadline: "2026-08-05T23:59:00+09:00" },
];

export const EMPTY_MONTH_WORK_SCHEDULES: WorkSchedule[] = [];
