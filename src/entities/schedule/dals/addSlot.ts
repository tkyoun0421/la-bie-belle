import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 잠금이 풀린 포지션에 자리 하나를 더한다. 상한이 없다
 * (`docs/2-design/modules/schedule/README.md`의 SCH-011) — 실수로 늘린 자리는 끌어서 버린다.
 *
 * 거절 둘 — 관리자가 아니면 `not_allowed`, 확정 시점에 있던 날이면 `already_confirmed`다.
 * 확정 뒤에 새로 연 날은 통과한다.
 */
export async function addSlot(
  client: DB,
  dayId: string,
  position: string,
): Promise<void> {
  const { error } = await client.rpc("add_slot", {
    p_day_id: dayId,
    p_position: position,
  });

  if (error) {
    throw toApiError(error);
  }
}
