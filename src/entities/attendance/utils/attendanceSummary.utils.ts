import { TALLIED_STATUSES } from "@/entities/attendance/consts/attendance.const";
import type {
  AttendanceStatus,
  AttendanceStatusInput,
  MonthlyAttendanceTally,
  TalliedStatus,
} from "@/entities/attendance/model/attendance.type";
import { getAttendanceStatus } from "@/entities/attendance/model/attendanceStatus.policy";

const PERCENT = 100;

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

export function attendanceRate(
  tally: MonthlyAttendanceTally | undefined,
): number | null {
  if (tally === undefined) {
    return null;
  }

  const counted = tally.present + tally.late + tally.absent + tally.excused;

  return counted === 0 ? null : Math.round((tally.present / counted) * PERCENT);
}
