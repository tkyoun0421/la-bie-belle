import { useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import {
  getMonthSchedule,
  type ScheduleDay,
} from "@/entities/schedule/dals/get-month-schedule";
import { SCHEDULE_KEY } from "@/features/schedule/model/query-keys";

/**
 * 근무표 한 달의 연 날들이다. 달을 넘기면 키가 갈려 앞 달이 캐시에 남고, 되돌아오면 다시 안
 * 읽는다 — 근무표는 무제한으로 거슬러 보는 화면이라 오간 달이 쌓인다.
 *
 * 그 달 근무표 자체의 상태(마감일·확정)는 [`useMonthWindow`](useMonthWindow.ts)가 따로
 * 읽는다 — 날이 하나도 없는 달과 근무표가 아예 없는 달이 갈리는 자리라서다.
 */

export type MonthScheduleResult = {
  data: ScheduleDay[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMonthSchedule(
  client: Db,
  month: string,
): MonthScheduleResult {
  const { data, error, isLoading } = useQuery({
    queryKey: [...SCHEDULE_KEY, month],
    queryFn: () => getMonthSchedule(client, month),
  });

  return { data, error, isLoading };
}
