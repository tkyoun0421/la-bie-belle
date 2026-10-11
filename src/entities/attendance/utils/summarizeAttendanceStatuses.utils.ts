import { countBy } from "@/shared/utils/collect";
import type {
  AttendanceStatus,
  AttendanceSummary,
} from "@/entities/attendance/model/attendance.type";

function isStatus(status: AttendanceStatus | null): status is AttendanceStatus {
  return status !== null;
}

export function summarizeAttendanceStatuses(
  statuses: (AttendanceStatus | null)[],
): AttendanceSummary {
  return Object.fromEntries(
    countBy(statuses.filter(isStatus), (status) => status),
  );
}
