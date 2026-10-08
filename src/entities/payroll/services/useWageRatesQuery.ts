import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getWageRates } from "@/entities/payroll/api/getWageRates.api";
import { type WageRates } from "@/entities/payroll/api/payroll.dto";

export type WageRatesResult = {
  data: WageRates | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useWageRatesQuery(client: DB): WageRatesResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.payroll.wages(),
    queryFn: () => getWageRates(client),
  });

  return { data, error, isLoading };
}
