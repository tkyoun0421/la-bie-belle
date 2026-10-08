import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getPendingApprovals } from "@/entities/workRequest/api/getPendingApprovals.api";
import type { PendingApproval } from "@/entities/workRequest/model/workRequest.type";

export type PendingApprovalsResult = {
  data: PendingApproval[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function usePendingApprovalsQuery(client: DB): PendingApprovalsResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.request.approvals(),
    queryFn: () => getPendingApprovals(client),
  });

  return { data, error, isLoading };
}
