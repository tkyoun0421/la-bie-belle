import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getPendingApprovals } from "@/entities/workRequest/api/getPendingApprovals.api";
import { type PendingApproval } from "@/entities/workRequest/api/workRequest.dto";

/**
 * 판정을 기다리는 근무 취소 요청들이다. 「승인할 일」 화면의 목록이고 관리자 홈의 건수도
 * 같은 값을 센다 — 두 자리가 다른 숫자를 말하지 않게 훅 하나가 낸다.
 *
 * 사유(출근 인증) 줄은 `attendance-excuse`가 이 훅에 더한다.
 */

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
