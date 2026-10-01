import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 잘못 연 날을 닫는다. 그 날의 자리와 배정이 같이 사라지고, 몇 건이 사라지는지를 화면이
 * 먼저 확인받는다(SCH-004).
 *
 * 거절 셋 — 안 연 날이면 `not_open`, 그 달이 확정됐으면 `already_confirmed`,
 * 관리자가 아니면 `not_allowed`다.
 */
export async function closeDay(client: DB, workDate: string): Promise<void> {
  const { error } = await client.rpc("close_day", { p_work_date: workDate });

  if (error) {
    throw toApiError(error);
  }
}
