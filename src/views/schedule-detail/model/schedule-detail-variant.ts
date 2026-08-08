import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";

export type ScheduleDetailVariant = "closed" | "confirmed";

export function deriveScheduleDetailVariant(
  status: RecruitmentScheduleStatus,
): ScheduleDetailVariant {
  return status === "CLOSED" ? "closed" : "confirmed";
}
