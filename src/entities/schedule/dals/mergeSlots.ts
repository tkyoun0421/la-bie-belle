import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 빈 자리 둘을 겸임 자리 하나로 합친다. 받는 것이 자리 id가 아니라 포지션 이름 둘인 것은
 * 관리자가 집는 것이 줄 머리고 거기엔 포지션 이름밖에 없어서다
 * (`docs/2-design/modules/schedule/design.md`의 「날과 자리」). 양쪽에서 빈 자리를 하나씩
 * 고르는 것도 함수라 합치는 손짓이 남의 배정을 지우는 길이 없다.
 *
 * 거절 셋 — `not_allowed`, 한쪽이라도 빈 자리가 없으면 `no_empty_slot`, 확정 시점에 있던
 * 날이면 `already_confirmed`다. 화면이 놓기 전에 이미 막으니 `no_empty_slot`은 집는 사이에
 * 다른 관리자가 그 자리를 채웠을 때만 온다.
 */
export async function mergeSlots(
  client: DB,
  dayId: string,
  from: string,
  to: string,
): Promise<void> {
  const { error } = await client.rpc("merge_slots", {
    p_day_id: dayId,
    p_from: from,
    p_to: to,
  });

  if (error) {
    throw toApiError(error);
  }
}
