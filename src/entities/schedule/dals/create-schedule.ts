import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import { monthStart } from "@/entities/schedule/dals/get-month-schedule";

/**
 * 그 달 근무표를 만들고 스케줄 신청 마감일을 같이 정한다. 마감일 없이 만드는 길이 없어
 * (SCH-005) 인자도 둘이 한 묶음이다
 * (`docs/2-design/modules/schedule/design.md`의 「근무표 만들기와 마감일」).
 *
 * 만드는 순간 그 달 접수가 열리고 승인된 전원에게 알림이 나간다 — 나가는 것은 서버다.
 *
 * 거절 넷 — 이미 있으면 `already_exists`, 마감일이 오늘 이전이면 `deadline_past`,
 * 그 달이 전부 지났으면 `month_over`, 관리자가 아니면 `not_allowed`다.
 */
export async function createSchedule(
  client: Db,
  month: string,
  deadline: string,
): Promise<void> {
  const { error } = await client.rpc("create_schedule", {
    p_month: monthStart(month),
    p_deadline: deadline,
  });

  if (error) {
    throw toApiError(error);
  }
}
