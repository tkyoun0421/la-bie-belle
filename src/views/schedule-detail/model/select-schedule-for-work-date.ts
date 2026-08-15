import type { RecruitmentSchedule } from "@/entities/schedule/model/recruitment-schedule";

export function selectScheduleForWorkDate(
  schedules: readonly RecruitmentSchedule[],
  workDate: string,
): RecruitmentSchedule | undefined {
  const matches = schedules.filter((entry) => entry.workDate === workDate);

  return matches.find((entry) => entry.status !== "CANCELLED") ?? matches[0];
}
