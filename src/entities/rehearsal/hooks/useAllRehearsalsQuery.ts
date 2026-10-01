import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getAllRehearsals,
  type RehearsalWithName,
} from "@/entities/rehearsal/api/getAllRehearsals.api";

/**
 * 관리자가 보는 그 달 전원 리허설이다 — 키는 `['rehearsal', 'YYYY-MM', 'all']`
 * (`docs/2-design/modules/schedule/design.md`의 「소유 데이터」). 본인 것과 키가 갈린 것은
 * 같은 달에 담긴 것이 달라서다 — 접두사 하나로 둘 다 낡는다.
 */

export type AllRehearsalsResult = {
  data: RehearsalWithName[] | undefined;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
};

export function useAllRehearsals(
  client: DB,
  month: string,
  enabled = true,
): AllRehearsalsResult {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.rehearsal.everyone(month),
    queryFn: () => getAllRehearsals(client, month),
    enabled,
  });

  return { data, error, isLoading, refetch: () => void refetch() };
}
