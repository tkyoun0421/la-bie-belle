import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getAllRehearsals } from "@/entities/rehearsal/api/getAllRehearsals.api";
import type { RehearsalWithName } from "@/entities/rehearsal/api/rehearsal.dto";

export type AllRehearsalsResult = {
  data: RehearsalWithName[] | undefined;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
};

export function useAllRehearsalsQuery(
  client: DB,
  month: string,
  enabled = true,
): AllRehearsalsResult {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.rehearsal.everyone(month),
    queryFn: () => getAllRehearsals(client, month),
    enabled,
  });

  return { data, error, isLoading, refetch: () => void refetch() };
}
