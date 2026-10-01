import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 겸임 자리를 나눈다. 합친 행에서 첫 포지션만 남고 나머지 포지션마다 새 자리가 서며,
 * 배정된 사람은 남는 쪽(받은 쪽)에 그대로 있다
 * (`docs/2-design/modules/schedule/design.md`의 「날과 자리」).
 *
 * 거절 셋 — `not_allowed`, 포지션이 하나뿐이면 `not_merged`, 확정 시점에 있던 날이면
 * `already_confirmed`다.
 */
export async function splitSlot(client: DB, slotId: string): Promise<void> {
  const { error } = await client.rpc("split_slot", { p_slot_id: slotId });

  if (error) {
    throw toApiError(error);
  }
}
