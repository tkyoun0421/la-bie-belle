import type { MonthlyAttendanceTally } from "@/entities/attendance/model/attendance.type";

export function monthAttendanceLine(tally: MonthlyAttendanceTally): string {
  return [
    `출근 ${tally.present}`,
    `지각 ${tally.late}`,
    `출근 인정 ${tally.excused}`,
    `결근 ${tally.absent}`,
  ].join(" · ");
}
