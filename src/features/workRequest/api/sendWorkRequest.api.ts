import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 빈 자리 하나에 대해 여럿에게 근무를 물어본다
 * ([SCH-017](../../../../docs/2-design/modules/schedule/README.md#sch-017)).
 *
 * **같은 자리에 두 번 보내도 요청은 하나다.** 살아 있는 요청이 이미 있으면 함수가 후보만
 * 더하고 같은 id를 돌려준다 — 답이 둘로 갈리면 선착순이 두 줄기가 된다.
 *
 * 거절은 `not_allowed`(관리자가 아니다) · `stale`(자리가 없거나 닫혔다) ·
 * `slot_full`(이미 찼다) · `window_closed`(근무 시작이 지났다)다. 목록에 그날 이미 배정된
 * 사람이 섞여 있으면 그 사람만 빠지고 나머지는 나간다 — 실패가 아니다.
 */

export async function sendWorkRequest(
  client: DB,
  slotId: string,
  profileIds: readonly string[],
): Promise<string> {
  const { data, error } = await client.rpc("send_work_request", {
    p_slot_id: slotId,
    p_profile_ids: [...profileIds],
  });

  if (error) {
    throw toApiError(error);
  }

  return data;
}
