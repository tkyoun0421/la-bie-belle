import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMyRehearsals } from "@/entities/rehearsal/api/getMyRehearsals.api";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";

export type RehearsalMonthsResult = {
  data: Rehearsal[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

export function useRehearsalMonthsQuery(
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
