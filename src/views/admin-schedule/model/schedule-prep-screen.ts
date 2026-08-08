import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";

export type SchedulePrepScreenMode = "readonly" | "empty" | "editing";

export type SchedulePrepScreenInput = {
  status: RecruitmentScheduleStatus;
  ceremonyTimes: string[];
};

const READONLY_STATUSES: RecruitmentScheduleStatus[] = ["CONFIRMED", "CANCELLED"];

export function resolveSchedulePrepScreenMode(
  input: SchedulePrepScreenInput,
): SchedulePrepScreenMode {
  if (READONLY_STATUSES.includes(input.status)) {
    return "readonly";
  }
  if (input.ceremonyTimes.length === 0) {
    return "empty";
  }
  return "editing";
}

const SCHEDULE_PREP_STATUS_LABELS: Record<RecruitmentScheduleStatus, string> = {
  OPEN: "모집 중",
  CLOSED: "모집 마감",
  PREPARING: "준비 중",
  CONFIRMED: "확정",
  CANCELLED: "취소",
};

export function schedulePrepStatusLabel(status: RecruitmentScheduleStatus): string {
  return SCHEDULE_PREP_STATUS_LABELS[status];
}
