import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getWageRates,
  type WageRates,
} from "@/entities/payroll/api/getWageRates.api";

/**
 * 시급 화면이 읽는 하나다. 목록도 사람 시트의 이력도 이 한 응답에서 갈려 나오므로 시트를
 * 열 때 질의를 새로 안 던진다(plan payroll-wages AC-05).
 *
 * 받은 것을 그대로 낸다 — 누가 기본을 따르는지, 이력을 몇 줄 그릴지는 화면의 순수 함수가
 * 정한다.
 */

export type WageRatesResult = {
  data: WageRates | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useWageRates(client: DB): WageRatesResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.payroll.wages(),
    queryFn: () => getWageRates(client),
  });

  return { data, error, isLoading };
}
