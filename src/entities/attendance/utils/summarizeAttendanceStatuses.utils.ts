import type {
  AttendanceStatus,
  AttendanceSummary,
} from "@/entities/attendance/model/attendance.type";

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
