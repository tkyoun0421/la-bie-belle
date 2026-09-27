import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 그만둔 사람을 퇴사로 옮긴다(`docs/2-design/modules/account/README.md`의 ACC-010·ACC-011).
 * 프로필도 기록도 남고 `undoLeave`로 돌아온다.
 *
 * 앞으로 배정된 근무가 남았으면 `has_future_assignments`다 — 서버는 막기만 하고 자리를 빼지
 * 않는다. 마지막 관리자면 `last_admin`이고, 이미 퇴사한 사람이면 `already_decided`다.
 */
export async function markLeave(client: Db, profileId: string): Promise<void> {
  const { error } = await client.rpc("mark_leave", { profile_id: profileId });

  if (error) {
    throw toApiError(error);
  }
}
