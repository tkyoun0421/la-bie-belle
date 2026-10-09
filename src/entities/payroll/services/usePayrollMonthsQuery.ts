import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getPayrollMonth } from "@/entities/payroll/api/getPayrollMonth.api";
import { type PayrollMonth } from "@/entities/payroll/model/payroll.type";

export type PayrollMonthsResult = {
  data: PayrollMonth | undefined;
  isLoading: boolean;
  error: Error | null;
};

function mergeMonths(months: readonly PayrollMonth[]): PayrollMonth {
  return {
    wageRates: months.flatMap((month) => month.wageRates),
    adjustments: months.flatMap((month) => month.adjustments),
    excuseStatus: months.flatMap((month) => month.excuseStatus),
    holidays: months.flatMap((month) => month.holidays),
  };
}

export function usePayrollMonthsQuery(
  client: DB,
  months: readonly string[],
): PayrollMonthsResult {
  return useQueries({
    queries: months.map((month) => ({
      queryKey: queryKeys.payroll.month(month),
      queryFn: () => getPayrollMonth(client, month),
    })),
    combine: (results): PayrollMonthsResult => {
      const loaded = results.flatMap((result) =>
        result.data === undefined ? [] : [result.data],
      );

      return {
        data:
          loaded.length === results.length ? mergeMonths(loaded) : undefined,
        isLoading: results.some((result) => result.isPending),
        error: results.find((result) => result.error !== null)?.error ?? null,
      };
    },
  });
}
