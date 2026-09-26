import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 가입 신청을 받는다. 승인된 사람만 근무표와 급여가 열린다
 * (`docs/2-design/modules/account/README.md`의 ACC-006).
 *
 * 대상이 「제출됨」이 아니면 — 프로필을 안 보냈거나 이미 승인·거절·차단됐으면 —
 * `already_decided`다.
 */
export async function approveMember(
  client: Db,
  profileId: string,
): Promise<void> {
  const { error } = await client.rpc("approve_member", {
    profile_id: profileId,
  });

  if (error) {
    throw toApiError(error);
  }
}
