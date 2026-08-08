import type { RecruitmentScheduleWithApplication } from "@/entities/schedule/model/recruitment-schedule";
import type {
  ApplicationBatchInput,
  ApplicationBatchOutcome,
} from "@/features/application/hooks/useApplicationBatch";

async function mockApply(_input: ApplicationBatchInput): Promise<ApplicationBatchOutcome> {
  return { ok: true, appliedCount: 0, withdrawnCount: 0 };
}

const MIXED_MONTH_SCHEDULES: RecruitmentScheduleWithApplication[] = [
  {
    id: "schedule-2026-08-02",
    workDate: "2026-08-02",
    applicationDeadline: "2026-08-02",
    status: "CLOSED",
    applicationStatus: null,
  },
  {
    id: "schedule-2026-08-03",
    workDate: "2026-08-03",
    applicationDeadline: "2026-08-03",
    status: "OPEN",
    applicationStatus: null,
  },
  {
    id: "schedule-2026-08-04",
    workDate: "2026-08-04",
    applicationDeadline: "2026-08-04",
    status: "OPEN",
    applicationStatus: "applied",
  },
  {
    id: "schedule-2026-08-07",
    workDate: "2026-08-07",
    applicationDeadline: "2026-08-07",
    status: "CONFIRMED",
    applicationStatus: null,
  },
];

export const SCHEDULE_MIXED_MONTH = {
  month: "2026-08",
  today: "2026-08-01",
  schedules: MIXED_MONTH_SCHEDULES,
  onApply: mockApply,
};

export const SCHEDULE_EMPTY_MONTH = {
  month: "2026-09",
  today: "2026-08-01",
  schedules: [],
  onApply: mockApply,
};
