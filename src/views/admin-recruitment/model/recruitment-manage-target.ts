import type { RecruitmentSchedule } from "@/entities/schedule/model/recruitment-schedule";

const MANAGEABLE_STATUSES = new Set(["OPEN", "CLOSED"]);

export function findManageableRecruitmentSchedule(
  schedules: readonly RecruitmentSchedule[],
  dateKey: string,
): RecruitmentSchedule | null {
  const scheduleByDate = new Map(
    schedules
      .filter((entry) => entry.status !== "CANCELLED")
      .map((entry) => [entry.workDate, entry] as const),
  );
  const schedule = scheduleByDate.get(dateKey);
  if (schedule === undefined || !MANAGEABLE_STATUSES.has(schedule.status)) {
    return null;
  }
  return schedule;
}
