import { skipToken, useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMyProfile } from "@/entities/profile/api/getMyProfile.api";
import type { MyProfileRow } from "@/entities/profile/api/profile.dto";

/**
 * `profiles` 행 하나를 읽는다 — 이름과 사진과 역할과 시각 다섯이다.
 *
 * **개인정보와 갈려 있는 자리다.** 「나」 화면은 둘을 합쳐 봐야 하지만 가입 대기 화면은
 * 개인정보 행이 아직 없는 사람도 봐야 한다 — 합치는 자리(`useMyProfileQuery`)와 읽는
 * 자리가 갈리는 까닭이다.
 *
 * `userId`가 아직 `null`이면 읽지 않고 기다린다. 누구인지 묻는 것도 비동기라, 빈 값으로 한
 * 번 읽으면 아무도 아닌 행이 `['profile']` 자리에 앉아 진짜 프로필을 덮는다.
 */

export type MyProfileRowResult = {
  data: MyProfileRow | null | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMyProfileRowQuery(
  client: DB,
  userId: string | null,
): MyProfileRowResult {
  const { data, error, isPending } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: userId === null ? skipToken : () => getMyProfile(client, userId),
  });

  return { data, error, isLoading: isPending };
}
