import { useQueries } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import {
  getPayrollMonth,
  payrollMonthKey,
  type PayrollMonth,
} from "@/entities/payroll/dals/get-payroll-month";

/**
 * 여러 달치 급여 재료를 한 덩이로 읽는다. 기간이 달과 안 맞을 때가 있어서다 — 달을 걸친 주는
 * 키가 둘이고 「연」은 열둘이다(plan payroll-view AC-06).
 *
 * **열두 키를 한꺼번에 안 읽고 달마다 읽어 더한다**
 * (`docs/2-design/modules/payroll/design.md`의 「행위 밖의 실행 동작」). 달치 키를 그대로 두면
 * 화면이 어느 기간으로 잘라 보든 캐시가 같은 조각을 다시 쓴다 — 주에서 월로 바꿨다고 그 달을
 * 새로 읽지 않는다.
 *
 * **하나라도 안 오면 로딩이다.** 달 하나가 빠진 채 더하면 금액이 진짜보다 적게 서고, 그것이
 * 읽는 중인지 원래 그런지 화면에서 안 갈린다.
 */

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
  };
}

export function usePayrollMonths(
  client: Db,
  months: readonly string[],
): PayrollMonthsResult {
  return useQueries({
    queries: months.map((month) => ({
      queryKey: payrollMonthKey(month),
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
