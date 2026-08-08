import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";

export type SchedulePrepCheckInRule = { firstCeremonyAt: string; recommendedCheckIn: string };

export type SchedulePrep = {
  id: string;
  workDate: string;
  status: RecruitmentScheduleStatus;
  ceremonyTimes: string[];
  plannedCheckin: string | null;
  plannedCheckout: string | null;
  checkInRules: SchedulePrepCheckInRule[];
};
