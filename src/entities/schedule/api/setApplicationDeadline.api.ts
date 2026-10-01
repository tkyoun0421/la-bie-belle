import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import { monthStart } from "@/entities/schedule/dals/getMonthSchedule";

/**
 * 그 달 스케줄 신청 마감일을 옮긴다(SCH-007). 미루기도 당기기도 같은 함수고, 바뀌면
 * 승인된 전원에게 알림이 나간다 — 나가는 것은 서버다.
 *
 * 거절 셋 — 그 달 근무표가 없으면 `no_schedule`, 이미 확정됐으면 `already_confirmed`,
 * 관리자가 아니면 `not_allowed`다.
 */
export async function setApplicationDeadline(
  client: DB,
  month: string,
  deadline: string,
): Promise<void> {
  const { error } = await client.rpc("set_application_deadline", {
    p_month: monthStart(month),
    p_deadline: deadline,
  });

  if (error) {
    throw toApiError(error);
  }
}
