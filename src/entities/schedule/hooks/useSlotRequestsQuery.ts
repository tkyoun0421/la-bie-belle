import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getSlotRequests,
  type SlotRequest,
} from "@/entities/schedule/api/getSlotRequests.api";

/**
 * 그 달 살아 있는 근무 요청이다. 관리자 화면은 자리 카드의 배지와 픽커의 요청 상태를,
 * 근무자 화면은 달력의 점선과 요청 시트를 이 하나로 그린다 — 보는 범위는 RLS가 가른다.
 *
 * 키가 `['requests', month]`라 요청을 보내거나 답하면 `['requests']` 무효화가 이 값도 같이
 * 낡게 한다([무효화 표](../../../../docs/2-design/system/runtime.md#무효화-표)).
 */

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
