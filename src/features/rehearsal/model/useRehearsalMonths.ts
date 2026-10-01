import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getMyRehearsals,
  type Rehearsal,
} from "@/entities/rehearsal/dals/getMyRehearsals";

/**
 * 여러 달치 본인 리허설을 한 덩이로 읽는다. 급여 화면이 기간을 달과 안 맞게 자르기 때문이다 —
 * 달을 걸친 주는 키가 둘이고 「연」은 열둘이다(plan payroll-view AC-06).
 *
 * 키는 [`useMyRehearsals`](useMyRehearsals.ts)가 쓰는 것과 같은 `['rehearsal', month]`다 —
 * 근무표 화면과 급여 화면이 같은 달을 두 번 안 읽는다.
 *
 * **하나라도 안 오면 로딩이다.** 리허설이 빠진 채 더하면 금액이 진짜보다 적게 서는데, 그것이
 * 읽는 중이라 그런지 원래 그런지 화면에서 안 갈린다.
 */

export type RehearsalMonthsResult = {
  data: Rehearsal[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

export function useRehearsalMonths(
  client: DB,
  months: readonly string[],
): RehearsalMonthsResult {
  return useQueries({
    queries: months.map((month) => ({
      queryKey: queryKeys.rehearsal.mine(month),
      queryFn: () => getMyRehearsals(client, month),
    })),
    combine: (results): RehearsalMonthsResult => {
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
