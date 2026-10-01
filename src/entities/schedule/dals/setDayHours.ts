import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 그 날의 근무 시간을 고친다. 그날 배정된 전원에게 같이 걸리는 하나뿐인 값이라 사람마다
 * 어긋난 자리는 근무 조정이 따로 담는다.
 *
 * 예식 시각(`p_ceremony`)은 이 task가 안 쓴다 — 날 상세의 근무 시간 시트가 출근·퇴근 둘만
 * 받는다(`docs/2-design/modules/schedule/screens/schedule-admin.md`의 「날 상세 문안」).
 *
 * 거절 셋 — 끝이 시작보다 이르거나 같으면 `bad_hours`, 안 연 날이면 `not_open`,
 * 관리자가 아니면 `not_allowed`다.
 */
export async function setDayHours(
  client: Db,
  workDate: string,
  starts: string,
  ends: string,
): Promise<void> {
  const { error } = await client.rpc("set_day_hours", {
    p_work_date: workDate,
    p_starts: starts,
    p_ends: ends,
  });

  if (error) {
    throw toApiError(error);
  }
}
