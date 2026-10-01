import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMonthSchedule } from "@/entities/schedule/api/getMonthSchedule.api";
import { type ScheduleDay } from "@/entities/schedule/api/schedule.dto";

/**
 * 근무표 한 달의 연 날들이다. 달을 넘기면 키가 갈려 앞 달이 캐시에 남고, 되돌아오면 다시 안
 * 읽는다 — 근무표는 무제한으로 거슬러 보는 화면이라 오간 달이 쌓인다.
 *
 * 그 달 근무표 자체의 상태(마감일·확정)는 [`useMonthWindowQuery`](useMonthWindowQuery.ts)가 따로
 * 읽는다 — 날이 하나도 없는 달과 근무표가 아예 없는 달이 갈리는 자리라서다.
 */

export type MonthScheduleResult = {
  data: ScheduleDay[] | undefined;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
};

export function useMonthScheduleQuery(
  client: DB,
  month: string,
): MonthScheduleResult {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.schedule.month(month),
    queryFn: () => getMonthSchedule(client, month),
  });

  return { data, error, isLoading, refetch: () => void refetch() };
}
