import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getMonthAvailabilities,
  type AvailabilityRow,
} from "@/entities/schedule/dals/getMonthAvailabilities";

/**
 * 그 달 근무 신청을 신청자 이름과 함께 읽는다. 달력 칸의 신청 수, 날 상세의 근무 신청 줄,
 * 모아보기 화면이 같은 `['availability', month]` 하나를 나눠 쓴다
 * (`docs/3-build/plans/schedule-admin.md` AC-01).
 *
 * 관리자에게는 전원 행이, 근무자에게는 제 행만 온다 — 좁히는 것은 RLS다.
 *
 * 내가 낸 날짜만 읽는 `useMyAvailability`는 꼬리가 `'mine'`인 제 키를 쓴다 — 같은 달이라도
 * 내놓는 모양이 달라서다([관찰 045](../../../../docs/observations/045-two-queries-share-one-cache-key.md)).
 */

export type MonthAvailabilitiesResult = {
  data: AvailabilityRow[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMonthAvailabilities(
  client: DB,
  month: string,
): MonthAvailabilitiesResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.availability.month(month),
    queryFn: () => getMonthAvailabilities(client, month),
  });

  return { data, error, isLoading };
}
