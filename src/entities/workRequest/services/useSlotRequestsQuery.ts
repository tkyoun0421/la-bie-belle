import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getSlotRequests } from "@/entities/workRequest/api/getSlotRequests.api";
import { type SlotRequest } from "@/entities/workRequest/api/workRequest.dto";

export type SlotRequestsResult = {
  data: SlotRequest[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useSlotRequestsQuery(
  client: DB,
  month: string,
): SlotRequestsResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.request.month(month),
    queryFn: () => getSlotRequests(client, month),
  });

  return { data, error, isLoading };
}
