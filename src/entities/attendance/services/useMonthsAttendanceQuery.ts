import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { combineMonths, type MonthsResult } from "@/shared/api/monthsQuery";
import { queryKeys } from "@/shared/api/queryKeys";
import type { AttendanceRows } from "@/entities/attendance/api/attendance.dto";
import { getMonthAttendance } from "@/entities/attendance/api/getMonthAttendance.api";

/**
 * 통계 근태 탭이 여는 열두 달 창의 근태 쪽이다. 달마다 `['attendance', 'YYYY-MM']` 하나를
 * 읽어 근태 화면이 읽어둔 달은 캐시에서 온다.
 *
 * **근무 쪽과 갈려 있다.** 근태 탭은 달 하나에 배정과 체크인 둘이 필요한데 그 둘은
 * `entities`의 다른 슬라이스고 같은 층끼리는 서로를 못 부른다(lint 규칙 3). 달마다 둘을
 * 맞추는 일은 위층의 `features/stats/hooks/useAttendanceMonths.ts`가 한다.
 */

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
