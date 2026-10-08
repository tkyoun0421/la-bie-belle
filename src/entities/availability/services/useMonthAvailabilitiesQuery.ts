import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { type AvailabilityRow } from "@/entities/availability/api/availability.dto";
import { getMonthAvailabilities } from "@/entities/availability/api/getMonthAvailabilities.api";

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
