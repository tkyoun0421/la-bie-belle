import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getMonthAvailabilities,
  type AvailabilityRow,
} from "@/entities/schedule/api/getMonthAvailabilities.api";

/**
 * 그 달 근무 신청을 신청자 이름과 함께 읽는다. 달력 칸의 신청 수, 날 상세의 근무 신청 줄,
 * 모아보기 화면이 같은 `['availability', month, 'all']` 하나를 나눠 쓴다
 * (`docs/3-build/plans/schedule-admin.md` AC-01).
 *
 * 관리자에게는 전원 행이, 근무자에게는 제 행만 온다 — 좁히는 것은 RLS다.
 *
 * 내가 낸 날짜만 읽는 `useMyAvailabilityQuery`가 `['availability', month]`를 쥐고 이쪽이 꼬리
 * `'all'`을 받는다 — 같은 달이라도 내놓는 모양이 달라서고, 어느 쪽이 꼬리를 받는지는
 * [design.md](../../../../docs/2-design/modules/schedule/design.md#소유-데이터)가 정한다
 * ([관찰 045](../../../../docs/observations/045-two-queries-share-one-cache-key.md)).
 */

export type MonthAvailabilitiesResult = {
  data: AvailabilityRow[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMonthAvailabilitiesQuery(
  client: DB,
  month: string,
): MonthAvailabilitiesResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.availability.everyone(month),
    queryFn: () => getMonthAvailabilities(client, month),
  });

  return { data, error, isLoading };
}
