import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 날 하나를 연다. 여는 순간 홀 기본값의 자리와 근무 시간이 그 날에 깔린다(SCH-003).
 *
 * **함수가 받는 것은 날 하나다.** 여러 날을 한 번에 여는 것은 화면의 일이고, 그래서 그
 * 부분 실패도 화면이 진다(`docs/2-design/modules/schedule/design.md`의 「날 열기·닫기」).
 *
 * 거절 넷 — 이미 열렸으면 `already_open`, 지난 날짜면 `date_past`, 그 달 근무표가 없으면
 * `no_schedule`, 관리자가 아니면 `not_allowed`다.
 */
export async function openDay(client: Db, workDate: string): Promise<void> {
  const { error } = await client.rpc("open_day", { p_work_date: workDate });

  if (error) {
    throw toApiError(error);
  }
}
