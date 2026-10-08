import { useMemo } from "react";
import type { DB } from "@/shared/api/database";
import type { MonthsResult } from "@/shared/api/monthsQuery";
import type { Attendance } from "@/entities/attendance/model/attendance.type";
import { useMonthsAttendanceQuery } from "@/entities/attendance/services/useMonthsAttendanceQuery";
import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";

export type AttendanceMonth = {
  month: string;
  days: ScheduleDay[];
  attendance: Attendance;
};

export function useAttendanceMonthsQuery(
  client: DB,
  months: readonly string[],
): MonthsResult<AttendanceMonth> {
  const work = useWorkMonthsQuery(client, months);
  const attendance = useMonthsAttendanceQuery(client, months);

  const workMonths = work.data;
  const attendanceMonths = attendance.data;

  return useMemo(
    () => ({
      data:
        workMonths && attendanceMonths
          ? workMonths.map((workMonth, at) => ({
              month: workMonth.month,
              days: workMonth.days,
              attendance: attendanceMonths[at].attendance,
            }))
          : undefined,
      isLoading: work.isLoading || attendance.isLoading,
      error: work.error ?? attendance.error,
    }),
    [
      workMonths,
      attendanceMonths,
      work.isLoading,
      work.error,
      attendance.isLoading,
      attendance.error,
    ],
  );
}
