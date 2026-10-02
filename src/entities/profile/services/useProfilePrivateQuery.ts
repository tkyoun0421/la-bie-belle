import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import type { ProfilePrivateRow } from "@/entities/profile/api/profile.dto";
import { getProfilePrivate } from "@/entities/profile/api/profilePrivate.api";

/**
 * 한 사람의 개인정보 행을 읽는다. 정본은
 * `docs/2-design/modules/account/screens/membersPending.md`의 「상세 시트」다.
 *
 * **내 것을 읽는 질의와 키의 꼬리가 다르다.** `useMyProfileQuery`가 묻는 것은 「내 연락처」고
 * 여기가 묻는 것은 「이 사람 연락처」라 사람마다 캐시가 갈려야 한다 — RLS가 본인과 관리자만
 * 통과시켜서 이 문이 받는 것은 profileId 하나다.
 *
 * **사람이 없으면 안 읽는다.** 시트가 닫혀 있을 때 질의가 나가면 안 되는데 그 가름을 부르는
 * 쪽이 `if`로 하면 훅 수가 렌더마다 달라진다.
 *
 * **행이 없으면 `null`이다** — 한 번도 안 보낸 사람이고 던지지 않는다.
 */

export type ProfilePrivateResult = {
  data: ProfilePrivateRow | null | undefined;
  isLoading: boolean;
  error: Error | null;
};

export function useProfilePrivateQuery(
  client: DB,
  profileId: string | null,
): ProfilePrivateResult {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.profile.privateOf(profileId ?? ""),
    queryFn: () => getProfilePrivate(client, profileId ?? ""),
    enabled: profileId !== null,
  });

  return { data, isLoading, error };
}
