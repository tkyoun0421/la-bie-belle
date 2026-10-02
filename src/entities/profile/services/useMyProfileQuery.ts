import type { DB } from "@/shared/api/database";
import type { MyProfile } from "@/entities/profile/api/profile.dto";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { useProfilePrivateQuery } from "@/entities/profile/services/useProfilePrivateQuery";

/**
 * 「나」 화면이 보는 다섯은 표 둘에 나뉘어 산다 — 이름과 사진과 역할은 `profiles`,
 * 성별과 생년월일과 연락처는 `profile_private`이다
 * (`docs/2-design/modules/account/design.md`의 「개인정보는 표를 가른다」).
 *
 * **키를 합치지 않는다.** 둘을 한 키로 묶으면 다른 화면이 쓰는 `['profile']`과 갈려서
 * 같은 행이 캐시에 두 벌 앉는다. 여기서 합치는 것은 값이지 키가 아니다 — 읽는 질의 둘은
 * 각자 제자리에 있고(`useMyProfileRowQuery`·`useProfilePrivateQuery`) 이 자리는 그 둘을
 * 겹쳐 놓을 뿐이다.
 *
 * 개인정보는 프로필 행의 id로 찾으므로 프로필이 먼저 와야 읽을 수 있다. 그 순서를 부르는
 * 쪽이 알 필요가 없게 이 자리가 감춘다 — 화면은 「다 왔나, 실패했나, 값이 무엇인가」 셋만
 * 본다.
 *
 * **개인정보 행이 없으면 값이 안 선다.** 「나」 화면은 이미 승인된 사람이 보는 자리라 둘이
 * 다 있다 — 아직 안 보낸 사람을 보는 자리는 질의 둘을 따로 쓴다(가입 대기 화면).
 */

export type MyProfileResult = {
  data: MyProfile | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMyProfileQuery(
  client: DB,
  userId: string | null,
): MyProfileResult {
  const profile = useMyProfileRowQuery(client, userId);
  const profileId = profile.data?.id ?? null;
  const contact = useProfilePrivateQuery(client, profileId);

  return {
    data:
      profile.data && contact.data
        ? { ...profile.data, ...contact.data }
        : undefined,
    error: profile.error ?? contact.error,
    isLoading: profile.isLoading || (profileId !== null && contact.isLoading),
  };
}
