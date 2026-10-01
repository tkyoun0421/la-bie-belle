import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getMonthSchedule,
  type ScheduleDay,
} from "@/entities/schedule/dals/getMonthSchedule";

/**
 * 여러 달치 근무 날들을 한 덩이로 읽는다. 급여 화면이 기간을 달과 안 맞게 자르기 때문이다 —
 * 달을 걸친 주는 키가 둘이고 「연」은 열둘이다(plan payroll-view AC-06).
 *
 * 키는 [`useMonthSchedule`](useMonthSchedule.ts)이 쓰는 것과 같은 `['schedule', month]`다.
 * 달치 키를 그대로 두면 근무표 화면이 이미 읽어둔 달을 급여 화면이 다시 안 읽고, 주에서 월로
 * 기간을 바꿔도 겹치는 달은 캐시가 그대로 낸다.
 *
 * **하나라도 안 오면 로딩이다.** 달 하나가 빠진 채 더하면 금액이 진짜보다 적게 서는데, 그것이
 * 읽는 중이라 그런지 원래 그런지 화면에서 안 갈린다.
 */

export type ScheduleMonthsResult = {
  data: ScheduleDay[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

export function useScheduleMonths(
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
