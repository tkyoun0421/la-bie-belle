import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { combineMonths, type MonthsResult } from "@/shared/api/monthsQuery";
import { queryKeys } from "@/shared/api/queryKeys";
import { getPayrollMonth } from "@/entities/payroll/api/getPayrollMonth.api";
import { type PayrollMonth } from "@/entities/payroll/api/payroll.dto";

export type PayrollByMonth = {
  month: string;
  payroll: PayrollMonth;
};

export function usePayrollMonthsByMonthQuery(
  client: DB,
  months: readonly string[],
): MonthsResult<PayrollByMonth> {
  return useQueries({
    queries: months.map((month) => ({
      queryKey: queryKeys.payroll.month(month),
      queryFn: () => getPayrollMonth(client, month),
    })),
    combine: (results): MonthsResult<PayrollByMonth> =>
      combineMonths(results, months, (at) => ({
        month: months[at],
        payroll: results[at].data as PayrollMonth,
      })),
  });
}
