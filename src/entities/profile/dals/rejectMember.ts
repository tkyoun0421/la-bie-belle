import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 가입 신청을 돌려보낸다. 그 사람에게 알림은 안 가고, 다음에 앱을 열면 안 받았다는 것을
 * 프로필 작성 화면이 말한다(`docs/2-design/modules/account/README.md`의 ACC-007).
 *
 * 대상이 「제출됨」이 아니면 — 프로필을 안 보냈거나 이미 승인·거절·차단됐으면 —
 * `already_decided`다.
 */
export async function rejectMember(
  client: Db,
  profileId: string,
): Promise<void> {
  const { error } = await client.rpc("reject_member", {
    profile_id: profileId,
  });

  if (error) {
    throw toApiError(error);
  }
}
