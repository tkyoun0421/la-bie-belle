import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getMyRehearsals,
  type Rehearsal,
} from "@/entities/rehearsal/dals/getMyRehearsals";

/**
 * 그 달 본인 리허설이다 — 키는 `['rehearsal', 'YYYY-MM']`
 * (`docs/2-design/modules/schedule/design.md`의 「소유 데이터」).
 *
 * `enabled`는 관리자가 이 질의를 안 띄우려고 있다. 한 화면이 역할에 따라 본인 것과 전원
 * 것 중 하나만 읽는데 훅은 둘 다 걸어야 해서(조건부 호출 금지) 안 쓰는 쪽을 여기서 끈다.
 */

export type MyRehearsalsResult = {
  data: Rehearsal[] | undefined;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
};

export function useMyRehearsals(
  client: DB,
  month: string,
  enabled = true,
): MyRehearsalsResult {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.rehearsal.mine(month),
    queryFn: () => getMyRehearsals(client, month),
    enabled,
  });

  return { data, error, isLoading, refetch: () => void refetch() };
}
