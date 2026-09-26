import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 가입 신청을 낸 사람을 차단한다. 그 계정은 다시 로그인해도 차단 화면뿐이다
 * (`docs/2-design/modules/account/README.md`의 ACC-004).
 *
 * 이미 승인·거절·차단된 사람이면 `already_decided`다 — 관리자 둘이 같은 사람을 동시에
 * 열었을 때 늦게 누른 쪽이 받는다.
 */
export async function blockMember(
  client: Db,
  profileId: string,
): Promise<void> {
  const { error } = await client.rpc("block_member", { profile_id: profileId });

  if (error) {
    throw toApiError(error);
  }
}
