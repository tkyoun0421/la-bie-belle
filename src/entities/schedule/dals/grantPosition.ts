import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 제한 포지션 자격을 준다 — 자격 없는 사람 시트의 「자격도 주기」다
 * (`docs/2-design/modules/schedule/design.md`의 「자격 주기」). 이미 있으면 조용히 통과한다.
 * 자격은 있고 없고뿐이라 두 번 준 것이 오류가 아니다.
 *
 * 거절 하나 — 관리자가 아니면 `not_allowed`다.
 */
export async function grantPosition(
  client: DB,
  profileId: string,
  position: string,
): Promise<void> {
  const { error } = await client.rpc("grant_position", {
    p_profile_id: profileId,
    p_position: position,
  });

  if (error) {
    throw toApiError(error);
  }
}
