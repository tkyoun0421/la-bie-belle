import { useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import {
  getAllRehearsals,
  type RehearsalWithName,
} from "@/entities/rehearsal/dals/get-all-rehearsals";
import {
  ALL_SCOPE,
  REHEARSAL_KEY,
} from "@/features/rehearsal/model/query-keys";

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
  client: Db,
  month: string,
  enabled = true,
): AllRehearsalsResult {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: [...REHEARSAL_KEY, month, ALL_SCOPE],
    queryFn: () => getAllRehearsals(client, month),
    enabled,
  });

  return { data, error, isLoading, refetch: () => void refetch() };
}
