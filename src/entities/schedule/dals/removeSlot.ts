import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 자리를 버린다. 살아 있는 정규 배정이 있으면 그 배정도 같이 닫힌다 — 확정 전이면 두 행이
 * 지워지고 확정 뒤 새로 연 날이면 `ended_at`이 찍힌다
 * (`docs/2-design/modules/schedule/design.md`의 「배정」).
 *
 * **빈 자리와 사람 든 자리를 가르는 확인 시트는 여기가 아니다.** 그 판정은
 * `screens/schedule-admin/model/discardSlot.ts`가 화면에서 한다.
 *
 * 거절 셋 — `not_allowed`, 이미 닫힌 자리면 `stale`, 확정 시점에 있던 날이면
 * `already_confirmed`다.
 */
export async function removeSlot(client: DB, slotId: string): Promise<void> {
  const { error } = await client.rpc("remove_slot", { p_slot_id: slotId });

  if (error) {
    throw toApiError(error);
  }
}
