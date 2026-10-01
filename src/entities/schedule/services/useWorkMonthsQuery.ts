import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { combineMonths, type MonthsResult } from "@/shared/api/monthsQuery";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMonthSchedule } from "@/entities/schedule/api/getMonthSchedule.api";
import { type ScheduleDay } from "@/entities/schedule/api/schedule.dto";

/**
 * 통계 근무 탭이 여는 열두 달 창이다. 달마다 `['schedule', 'YYYY-MM']` 하나를 읽는다
 * (plan stats-admin AC-03).
 *
 * **새 키를 안 만드는 것이 이 방식의 값이다.** 근무표·급여 화면이 이미 읽어둔 달은
 * 캐시에서 오고, 그쪽 무효화가 이 화면에도 그대로 걸린다(`docs/2-design/system/runtime.md`의
 * 「읽기 범위」).
 *
 * **달을 뭉개지 않는다.** `useScheduleMonthsQuery`는 여러 달의 행을 한 배열로 이어 붙이는데,
 * 추이 그래프는 「몇 월이 비었나」를 알아야 해서 달마다 한 칸으로 온다.
 */

export type WorkMonth = {
  month: string;
  days: ScheduleDay[];
};

export function useWorkMonthsQuery(
  client: DB,
  months: readonly string[],
): MonthsResult<WorkMonth> {
  return useQueries({
    queries: months.map((month) => ({
      queryKey: queryKeys.schedule.month(month),
      queryFn: () => getMonthSchedule(client, month),
    })),
    combine: (results): MonthsResult<WorkMonth> =>
      combineMonths(results, months, (at) => ({
        month: months[at],
        days: results[at].data ?? [],
      })),
  });
}
