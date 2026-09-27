import { useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import {
  getQualifications,
  type Qualification,
} from "@/entities/schedule/dals/get-qualifications";
import {
  MEMBERS_KEY,
  QUALIFICATIONS_SCOPE,
} from "@/features/schedule/model/query-keys";

/**
 * 자격 전체다. 판정은 `qualifications` 뷰가 끝냈고 화면은 픽커 목록과 합쳐 쓰기만 한다
 * (`docs/2-design/modules/schedule/design.md`의 「자격」).
 *
 * 키가 `['members', 'qualifications']`인 것은 자격이 사람의 속성이라서다 —
 * `grant_position`이 낡게 하는 `['members']`가 접두사로 이것까지 덮는다. 픽커의 명단은
 * `useMembers`가 따로 읽는다.
 */

export type QualificationsResult = {
  data: Qualification[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useQualifications(client: Db): QualificationsResult {
  const { data, error, isLoading } = useQuery({
    queryKey: [...MEMBERS_KEY, QUALIFICATIONS_SCOPE],
    queryFn: () => getQualifications(client),
  });

  return { data, error, isLoading };
}
