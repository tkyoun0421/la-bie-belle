import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getQualifications } from "@/entities/member/api/getQualifications.api";
import type { Qualification } from "@/entities/member/api/member.dto";

/**
 * 자격 전체다. 판정은 `qualifications` 뷰가 끝냈고 화면은 픽커 목록과 합쳐 쓰기만 한다
 * (`docs/2-design/modules/schedule/design.md`의 「자격」).
 *
 * 키가 `['members', 'qualifications']`인 것은 자격이 사람의 속성이라서다 —
 * `grant_position`이 낡게 하는 `['members']`가 접두사로 이것까지 덮는다. 픽커의 명단은
 * `useMembersQuery`가 따로 읽는다.
 */

export type QualificationsResult = {
  data: Qualification[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useQualificationsQuery(client: DB): QualificationsResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.member.qualifications(),
    queryFn: () => getQualifications(client),
  });

  return { data, error, isLoading };
}
