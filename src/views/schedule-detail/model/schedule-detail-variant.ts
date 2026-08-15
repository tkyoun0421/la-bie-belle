import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";

export type ScheduleDetailVariant = "closed" | "open" | "confirmed" | "cancelled";

export function deriveScheduleDetailVariant(
  status: RecruitmentScheduleStatus,
): ScheduleDetailVariant {
  if (status === "OPEN") {
    return "open";
  }
  if (status === "CONFIRMED") {
    return "confirmed";
  }
  if (status === "CANCELLED") {
    return "cancelled";
  }
  return "closed";
}
