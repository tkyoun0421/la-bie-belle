import { memberOf } from "@/shared/model/memberOf.policy";
import { TALLIED_STATUSES } from "@/entities/attendance/consts/attendance.const";
import type {
  AttendanceStatusInput,
  MonthlyAttendanceTally,
} from "@/entities/attendance/model/attendance.type";
import { getAttendanceStatus } from "@/entities/attendance/model/attendanceStatus.policy";

const PERCENT = 100;

const isTallied = memberOf(TALLIED_STATUSES);

export function tallyMonthlyAttendance(
  days: AttendanceStatusInput[],
): MonthlyAttendanceTally {
  return days
    .map((day) => getAttendanceStatus(day))
    .filter(isTallied)
    .reduce<MonthlyAttendanceTally>(
      (tally, status) => ({ ...tally, [status]: tally[status] + 1 }),
      { present: 0, late: 0, absent: 0, excused: 0 },
    );
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
