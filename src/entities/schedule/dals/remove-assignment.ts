import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 배정 하나를 거둔다 — 확정 전의 「자리 비우기」와 확정 뒤 강제 변경의 「사람 빼기」가 같은
 * 함수다. 확정 전이면 행이 지워지고 확정 뒤면 `ended_at`·`ended_reason`·`ended_by`가
 * 찍힌다(`docs/2-design/modules/schedule/design.md`의 「배정」) — 그 갈림은 함수 안에서 난다.
 *
 * 거절 둘 — `not_allowed`, 이미 닫힌 배정을 다시 부르면 `stale`이다. `stale`은 시트를 닫지
 * 않고 그 자리만 다시 읽는 신호다.
 */
export async function removeAssignment(
  client: Db,
  assignmentId: string,
): Promise<void> {
  const { error } = await client.rpc("remove_assignment", {
    p_assignment_id: assignmentId,
  });

  if (error) {
    throw toApiError(error);
  }
}
