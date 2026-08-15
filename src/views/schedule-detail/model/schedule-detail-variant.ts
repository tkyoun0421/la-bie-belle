import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";

export type ScheduleDetailVariant = "closed" | "open" | "confirmed";

export function deriveScheduleDetailVariant(
  status: RecruitmentScheduleStatus,
): ScheduleDetailVariant {
  if (status === "CLOSED") {
    return "closed";
  }
  if (status === "OPEN") {
    return "open";
  }
  return "confirmed";
}
