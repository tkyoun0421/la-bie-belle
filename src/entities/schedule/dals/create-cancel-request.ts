import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 내 근무 하나를 취소해 달라고 낸다
 * ([SCH-018](../../../../docs/2-design/modules/schedule/README.md#sch-018)). 배정은 그대로
 * 남고 관리자가 승인해야 닫힌다.
 *
 * **근무 전날까지다.** 당일부터는 `window_closed` — 대신 나올 사람을 구할 시간이 없다.
 * 거절당한 뒤에는 새 행으로 다시 낼 수 있고 횟수를 안 막는다.
 *
 * 나머지 거절은 `not_allowed`(남의 배정) · `stale`(이미 닫힌 배정) ·
 * `invalid_reason`(사유가 비었거나 100자를 넘는다) · `already_requested`(아직 판정 안 된
 * 요청이 있다)다.
 */

export async function createCancelRequest(
  client: Db,
  assignmentId: string,
  reason: string,
): Promise<string> {
  const { data, error } = await client.rpc("create_cancel_request", {
    p_assignment_id: assignmentId,
    p_reason: reason,
  });

  if (error) {
    throw toApiError(error);
  }

  return data;
}
