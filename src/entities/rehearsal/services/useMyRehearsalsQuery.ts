import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMyRehearsals } from "@/entities/rehearsal/api/getMyRehearsals.api";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";

export type MyRehearsalsResult = {
  data: Rehearsal[] | undefined;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
};

export function useMyRehearsalsQuery(
  client: DB,
  month: string,
  enabled = true,
): MyRehearsalsResult {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.rehearsal.mine(month),
    queryFn: () => getMyRehearsals(client, month),
    enabled,
  });

  return { data, error, isLoading, refetch: () => void refetch() };
}
