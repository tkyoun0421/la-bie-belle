import { z } from "zod";

export const RECRUITMENT_SCHEDULE_STATUS_VALUES = [
  "OPEN",
  "CLOSED",
  "PREPARING",
  "CONFIRMED",
  "CANCELLED",
] as const;

export const RecruitmentScheduleStatusSchema = z.enum(RECRUITMENT_SCHEDULE_STATUS_VALUES);
export type RecruitmentScheduleStatus = z.infer<typeof RecruitmentScheduleStatusSchema>;

export type RecruitmentSchedule = {
  id: string;
  workDate: string;
  applicationDeadline: string;
  status: RecruitmentScheduleStatus;
};

export type RecruitmentScheduleRow = {
  id: string;
  work_date: string;
  application_deadline: string;
  status: string;
};

export function mapRecruitmentScheduleRow(row: RecruitmentScheduleRow): RecruitmentSchedule {
  return {
    id: row.id,
    workDate: row.work_date,
    applicationDeadline: row.application_deadline,
    status: RecruitmentScheduleStatusSchema.parse(row.status),
  };
}
