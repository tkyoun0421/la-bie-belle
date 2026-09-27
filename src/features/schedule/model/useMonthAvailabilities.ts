import { useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import {
  getMonthAvailabilities,
  type AvailabilityRow,
} from "@/entities/schedule/dals/get-month-availabilities";
import { AVAILABILITY_KEY } from "@/features/schedule/model/query-keys";

/**
 * 그 달 근무 신청을 신청자 이름과 함께 읽는다. 달력 칸의 신청 수, 날 상세의 근무 신청 줄,
 * 모아보기 화면이 같은 `['availability', month]` 하나를 나눠 쓴다
 * (`docs/3-build/plans/schedule-admin.md` AC-01).
 *
 * 관리자에게는 전원 행이, 근무자에게는 제 행만 온다 — 좁히는 것은 RLS다.
 */

export type MonthAvailabilitiesResult = {
  data: AvailabilityRow[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMonthAvailabilities(
  client: Db,
  month: string,
): MonthAvailabilitiesResult {
  const { data, error, isLoading } = useQuery({
    queryKey: [...AVAILABILITY_KEY, month],
    queryFn: () => getMonthAvailabilities(client, month),
  });

  return { data, error, isLoading };
}
