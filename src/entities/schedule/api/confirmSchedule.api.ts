import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import { monthStart } from "@/entities/schedule/api/getMonthSchedule.api";

/**
 * 그 달 근무표를 확정한다. 되돌리는 문이 없고 빈 자리가 있어도 막지 않는다(SCH-014).
 *
 * 거절 셋 — 마감 다음 날 전이면 `too_early`, 이미 확정됐으면 `already_confirmed`,
 * 관리자가 아니면 `not_allowed`다.
 *
 * **`already_confirmed`를 여기서 삼키지 않는다.** 그것을 성공으로 볼지는 부르는 자리마다
 * 갈리는 판정이라 dal은 오류 모양만 정규화하고
 * (`docs/2-design/system/data-access.md`의 「오류의 모양」) 화면 쪽 훅이 가른다.
 */
export async function confirmSchedule(
  client: DB,
  month: string,
): Promise<void> {
  const { error } = await client.rpc("confirm_schedule", {
    p_month: monthStart(month),
  });

  if (error) {
    throw toApiError(error);
  }
}
