import type {
  EXCUSE_DECISIONS,
  TALLIED_STATUSES,
} from "@/entities/attendance/consts/attendance.const";

export type AttendanceStatus =
  "unmarked" | "present" | "late" | "pending" | "excused" | "absent";

export type CheckInRecord = {
  checkedAt: string;
  reportedAt: string;
  receivedAt: string;
};

export type ExcuseDecision = (typeof EXCUSE_DECISIONS)[number];

export type ExcuseStatusRecord = {
  submittedAt: string;
  decidedAt: string | null;
  decision: ExcuseDecision | null;
};

export type AttendanceStatusInput = {
  workDate: string;
  startsAt: string;
  endsAt: string;
  checkIn: CheckInRecord | null;
  excuses: ExcuseStatusRecord[];
  now: string;
};

export type TalliedStatus = (typeof TALLIED_STATUSES)[number];

export type MonthlyAttendanceTally = Record<TalliedStatus, number>;

export type AttendanceSummary = Partial<Record<AttendanceStatus, number>>;
