import { skipToken, useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import {
  getMyProfile,
  type MyProfileRow,
} from "@/entities/profile/dals/getMyProfile";
import {
  getProfilePrivate,
  type ProfilePrivateRow,
} from "@/entities/profile/dals/profilePrivate";
import {
  PROFILE_KEY,
  PROFILE_PRIVATE_KEY,
} from "@/features/profile/model/queryKeys";

/**
 * 「나」 화면이 보는 다섯은 표 둘에 나뉘어 산다 — 이름과 사진과 역할은 `profiles`,
 * 성별과 생년월일과 연락처는 `profile_private`이다
 * (`docs/2-design/modules/account/design.md`의 「개인정보는 표를 가른다」).
 *
 * **키를 합치지 않는다.** 둘을 한 키로 묶으면 다른 화면이 쓰는 `['profile']`과 갈려서
 * 같은 행이 캐시에 두 벌 앉는다. 여기서 합치는 것은 값이지 키가 아니다.
 *
 * 개인정보는 프로필 행의 id로 찾으므로 프로필이 먼저 와야 읽을 수 있다. 그 순서를 부르는
 * 쪽이 알 필요가 없게 이 자리가 감춘다 — 화면은 「다 왔나, 실패했나, 값이 무엇인가」 셋만
 * 본다.
 *
 * `userId`가 아직 `null`이면 읽지 않고 기다린다. 누구인지 묻는 것도 비동기라, 빈 값으로
 * 한 번 읽으면 아무도 아닌 행이 `['profile']` 자리에 앉아 진짜 프로필을 덮는다.
 */

export type MyProfile = MyProfileRow & ProfilePrivateRow;

export type MyProfileResult = {
  data: MyProfile | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMyProfile(
  client: DB,
  userId: string | null,
): MyProfileResult {
  const profile = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: userId === null ? skipToken : () => getMyProfile(client, userId),
  });

  const profileId = profile.data?.id ?? null;

  const contact = useQuery({
    queryKey: PROFILE_PRIVATE_KEY,
    queryFn:
      profileId === null
        ? skipToken
        : () => getProfilePrivate(client, profileId),
  });

  return {
    data:
      profile.data && contact.data
        ? { ...profile.data, ...contact.data }
        : undefined,
    error: profile.error ?? contact.error,
    isLoading: profile.isPending || (profileId !== null && contact.isPending),
  };
}
