import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMonthSchedule } from "@/entities/schedule/api/getMonthSchedule.api";
import { type ScheduleDay } from "@/entities/schedule/model/schedule.type";

export type ScheduleMonthsResult = {
  data: ScheduleDay[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

export function useScheduleMonthsQuery(
  client: DB,
  months: readonly string[],
): ScheduleMonthsResult {
  return useQueries({
    queries: months.map((month) => ({
      queryKey: queryKeys.schedule.month(month),
      queryFn: () => getMonthSchedule(client, month),
    })),
    combine: (results): ScheduleMonthsResult => {
      const loaded = results.flatMap((result) => result.data ?? []);

      return {
        data: results.every((result) => result.data !== undefined)
          ? loaded
          : undefined,
        isLoading: results.some((result) => result.isPending),
        error: results.find((result) => result.error !== null)?.error ?? null,
      };
    },
  });
}
