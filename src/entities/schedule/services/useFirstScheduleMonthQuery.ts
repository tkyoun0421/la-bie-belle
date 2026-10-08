import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getFirstScheduleMonth } from "@/entities/schedule/api/getFirstScheduleMonth.api";

export function useFirstScheduleMonthQuery(client: DB) {
  return useQuery({
    queryKey: queryKeys.schedule.firstMonth(),
    queryFn: () => getFirstScheduleMonth(client),
  });
}
