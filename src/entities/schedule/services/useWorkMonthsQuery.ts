import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { combineMonths, type MonthsResult } from "@/shared/api/monthsQuery";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMonthSchedule } from "@/entities/schedule/api/getMonthSchedule.api";
import { type ScheduleDay } from "@/entities/schedule/model/schedule.type";

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
