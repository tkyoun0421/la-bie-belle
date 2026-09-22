import {
  getAttendanceStatus,
  type AttendanceStatus,
  type AttendanceStatusInput,
} from "@/features/attendance/model/attendance-status";

export type AttendanceSummary = Partial<Record<AttendanceStatus, number>>;

export function summarizeAttendanceStatuses(
  statuses: (AttendanceStatus | null)[],
): AttendanceSummary {
  const summary: AttendanceSummary = {};

  for (const status of statuses) {
    if (status === null) {
      continue;
    }
    summary[status] = (summary[status] ?? 0) + 1;
  }

  return summary;
}

const TALLIED_STATUSES = ["present", "late", "absent", "excused"] as const;

export type TalliedStatus = (typeof TALLIED_STATUSES)[number];

export type MonthlyAttendanceTally = Record<TalliedStatus, number>;

function isTallied(status: AttendanceStatus | null): status is TalliedStatus {
  return (TALLIED_STATUSES as readonly (AttendanceStatus | null)[]).includes(
    status,
  );
}

export function tallyMonthlyAttendance(
  days: AttendanceStatusInput[],
): MonthlyAttendanceTally {
  const tally: MonthlyAttendanceTally = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
  };

  for (const day of days) {
    const status = getAttendanceStatus(day);
    if (isTallied(status)) {
      tally[status] += 1;
    }
  }

  return tally;
}
