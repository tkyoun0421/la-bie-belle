import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMonthSchedule } from "@/entities/schedule/api/getMonthSchedule.api";
import { type ScheduleDay } from "@/entities/schedule/model/schedule.type";

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
