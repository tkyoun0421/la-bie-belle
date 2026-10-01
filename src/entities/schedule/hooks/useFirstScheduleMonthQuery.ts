import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getFirstScheduleMonth } from "@/entities/schedule/api/getFirstScheduleMonth.api";

/**
 * 달 줄이 뒤로 갈 수 있는 바닥이다. 홀 하나뿐이라 달을 옮겨도 다시 안 읽는다 — 키가 달을 안
 * 물고(`['schedule', 'first-month']`) 근무표를 만드는 판정이 `['schedule']`을 통째로 낡게
 * 해서 새 달이 생기면 저절로 따라온다.
 */
export function useFirstScheduleMonthQuery(client: DB) {
  return useQuery({
    queryKey: queryKeys.schedule.firstMonth(),
    queryFn: () => getFirstScheduleMonth(client),
  });
}
