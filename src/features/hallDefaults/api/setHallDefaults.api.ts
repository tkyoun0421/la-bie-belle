import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { HallSlot } from "@/entities/hall/api/getHallDefaults.api";

/**
 * 홀의 자리·근무 시간 기본값을 바꾼다. 다음에 여는 날부터 이 값이 깔리고 **이미 연 날은
 * 그대로다** — 소급하면 손봐둔 날의 시간까지 덮는다
 * (`docs/2-design/modules/schedule/design.md`의 「홀 기본값」).
 *
 * 읽는 쪽과 같은 모양 — 「매니저 2」가 `count: 2`인 한 줄 — 으로 받아 그대로 보낸다.
 * 접었다 폈다 하는 자리가 갈리면 `open_day`가 까는 자리 수와 화면이 센 자리 수가 어긋난다.
 *
 * 셋을 한 번에 받는 것은 함수가 그렇게 생겨서다. 화면이 근무 시간만 고쳐도 지금 자리
 * 기본값을 같이 실어 보낸다.
 *
 * 거절 하나 — 관리자가 아니면 `not_allowed`다.
 */

export type HallDefaultsInput = {
  slots: HallSlot[];
  starts: string;
  ends: string;
};

export async function setHallDefaults(
  client: DB,
  { slots, starts, ends }: HallDefaultsInput,
): Promise<void> {
  const { error } = await client.rpc("set_hall_defaults", {
    p_slots: slots,
    p_starts: starts,
    p_ends: ends,
  });

  if (error) {
    throw toApiError(error);
  }
}
