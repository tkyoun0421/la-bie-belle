import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMonthWindow } from "@/entities/schedule/api/getMonthSchedule.api";
import type { MonthWindow } from "@/entities/schedule/model/schedule.type";

export type MonthWindowResult = {
  data: MonthWindow | null | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMonthWindowQuery(
  client: DB,
  month: string,
): MonthWindowResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.schedule.monthWindow(month),
    queryFn: () => getMonthWindow(client, month),
  });

  return { data, error, isLoading };
}
