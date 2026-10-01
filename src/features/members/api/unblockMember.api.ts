import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 차단을 푼다. `blocked_at`과 함께 `submitted_at`도 빈다 — 다시 들어온 사람이 프로필을
 * 새로 보내야 대기 목록에 뜬다(`docs/2-design/modules/account/design.md`의 「가입 승인·
 * 거절·차단·해제」).
 *
 * 차단된 사람이 아니면 `already_decided`다.
 */
export async function unblockMember(
  client: DB,
  profileId: string,
): Promise<void> {
  const { error } = await client.rpc("unblock_member", {
    profile_id: profileId,
  });

  if (error) {
    throw toApiError(error);
  }
}
