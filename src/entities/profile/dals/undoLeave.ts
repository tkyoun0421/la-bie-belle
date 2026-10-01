import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 퇴사 처리를 무른다(`docs/2-design/modules/account/design.md`의 「퇴사 처리와 되돌리기」).
 * 시한이 없다 — 반년 뒤 다시 오는 사람도 이 길로 돌아와야 지난 근무와 급여가 안 끊긴다.
 *
 * 퇴사가 아닌 대상이면 `already_decided`다. 관리자 둘이 같은 사람을 열었을 때 늦게 누른 쪽이
 * 받는 코드이기도 하다.
 */
export async function undoLeave(client: DB, profileId: string): Promise<void> {
  const { error } = await client.rpc("undo_leave", { profile_id: profileId });

  if (error) {
    throw toApiError(error);
  }
}
