import type { AttendanceStatus } from "@/entities/attendance/model/attendanceStatus.policy";

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
