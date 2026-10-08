import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { combineMonths, type MonthsResult } from "@/shared/api/monthsQuery";
import { queryKeys } from "@/shared/api/queryKeys";
import type { AttendanceRows } from "@/entities/attendance/api/attendance.dto";
import { getMonthAttendance } from "@/entities/attendance/api/getMonthAttendance.api";

export type AttendanceByMonth = {
  month: string;
  attendance: AttendanceRows;
};

export function useMonthsAttendanceQuery(
  client: DB,
  months: readonly string[],
): MonthsResult<AttendanceByMonth> {
  return useQueries({
    queries: months.map((month) => ({
      queryKey: queryKeys.attendance.month(month),
      queryFn: () => getMonthAttendance(client, month),
    })),
    combine: (results): MonthsResult<AttendanceByMonth> =>
      combineMonths(results, months, (at) => ({
        month: months[at],
        attendance: (results[at].data ?? {
          checkIns: [],
          excuseStatuses: [],
        }) as AttendanceRows,
      })),
  });
}
