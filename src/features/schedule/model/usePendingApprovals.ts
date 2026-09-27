import { useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import {
  getPendingApprovals,
  type PendingApproval,
} from "@/entities/schedule/dals/get-pending-approvals";
import {
  APPROVALS_SCOPE,
  REQUESTS_KEY,
} from "@/features/schedule/model/query-keys";

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

export function usePendingApprovals(client: Db): PendingApprovalsResult {
  const { data, error, isLoading } = useQuery({
    queryKey: [...REQUESTS_KEY, APPROVALS_SCOPE],
    queryFn: () => getPendingApprovals(client),
  });

  return { data, error, isLoading };
}
