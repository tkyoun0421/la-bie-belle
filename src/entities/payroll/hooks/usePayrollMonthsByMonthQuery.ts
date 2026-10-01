import { useQueries } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { combineMonths, type MonthsResult } from "@/shared/api/monthsQuery";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getPayrollMonth,
  type PayrollMonth,
} from "@/entities/payroll/api/getPayrollMonth.api";

/**
 * 급여 탭 그래프가 읽는 달치 창이다. `usePayrollMonthsQuery`가 이미 달치를 읽지만 그쪽은
 * 여러 달을 한 배열로 이어 붙여서 「몇 월이 비었나」가 사라진다 — 추이 그래프는 달마다
 * 한 칸이다.
 *
 * **키가 `usePayrollMonthsQuery`의 것과 같다.** `queryKeys.payroll.month`를 그대로 불러서
 * 급여 화면이 읽어둔 달은 캐시에서 오고, 조정이나 시급을 고쳐 `['payroll']`이 낡으면 이
 * 화면도 같이 따라간다.
 */

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
