import type { MonthlyAttendanceTally } from "@/entities/attendance/model/attendance.type";
import { tallyMonthlyAttendance } from "@/entities/attendance/utils/attendanceSummary.utils";
import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";
import {
  buildAttendanceInputs,
  daysOfPerson,
  type AttendanceInputCheckIn,
  type AttendanceInputExcuseStatus,
} from "@/features/stats/utils/attendanceInputs.utils";

export function myAttendanceTally(
  days: readonly ScheduleDay[],
  checkIns: readonly AttendanceInputCheckIn[],
  excuseStatuses: readonly AttendanceInputExcuseStatus[],
  profileId: string | null,
  now: string,
): MonthlyAttendanceTally {
  return tallyMonthlyAttendance(
    buildAttendanceInputs(
      daysOfPerson(days, profileId),
      checkIns,
      excuseStatuses,
      now,
    ),
  );
}
