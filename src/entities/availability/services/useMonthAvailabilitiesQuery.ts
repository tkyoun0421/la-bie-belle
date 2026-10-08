import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMonthAvailabilities } from "@/entities/availability/api/getMonthAvailabilities.api";
import { type Availability } from "@/entities/availability/model/availability.type";

export type MonthAvailabilitiesResult = {
  data: Availability[] | undefined;
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
