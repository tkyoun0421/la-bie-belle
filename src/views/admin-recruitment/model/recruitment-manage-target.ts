import type { RecruitmentSchedule } from "@/entities/schedule/model/recruitment-schedule";

const MANAGEABLE_STATUSES = new Set(["OPEN", "CLOSED"]);

export function findManageableRecruitmentSchedule(
  schedules: readonly RecruitmentSchedule[],
  dateKey: string,
): RecruitmentSchedule | null {
  const schedule = schedules.find((entry) => entry.workDate === dateKey);
  if (schedule === undefined || !MANAGEABLE_STATUSES.has(schedule.status)) {
    return null;
  }
  return schedule;
}
