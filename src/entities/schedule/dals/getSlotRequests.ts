import type { DB } from "@/shared/api/database";
import {
  monthStart,
  nextMonthStart,
} from "@/entities/schedule/dals/getMonthSchedule";

/**
 * 그 달 살아 있는 근무 요청을 자리·날과 함께 읽는다. 관리자는 전부 보고 근무자는 자기
 * 갈래가 든 것만 본다 — 거르는 것은 질의가 아니라 RLS라
 * ([design.md 「요청」](../../../../docs/2-design/modules/schedule/design.md#요청)) 한
 * 질의가 두 화면을 먹인다.
 *
 * **닫힌 요청은 안 온다.** 자리가 차거나 전부 소진되면 배지도 점선도 사라져야 하는데, 화면이
 * 그것을 따로 지우지 않고 목록에서 빠지는 것으로 사라진다.
 *
 * **자리와 날을 같이 싣는다.** 관리자 화면은 자리로, 근무자 화면은 날짜로 이 행을 찾는다 —
 * 어느 쪽도 요청 하나마다 표를 다시 읽지 않는다. 요청 시트가 쓰는 포지션과 근무 시간도
 * 같이 온다.
 *
 * `expires_at`이 갈래마다 실려 오는 것은 「만료됨」을 저장하지 않기 때문이다. 만료는 화면이
 * 서버 시각과 견줘 파생한다.
 */

export type SlotRequestCandidate = {
  profile_id: string;
  status: string;
  expires_at: string;
};

export type SlotRequest = {
  id: string;
  slot_id: string | null;
  closed_at: string | null;
  expires_at: string;
  request_candidates: SlotRequestCandidate[];
  slots: {
    id: string;
    positions: string[];
    days: { work_date: string; starts_at: string; ends_at: string };
  };
};

const REQUEST_COLUMNS = [
  "id",
  "slot_id",
  "closed_at",
  "expires_at",
  "request_candidates(profile_id, status, expires_at)",
  "slots!inner(id, positions, days!inner(work_date, starts_at, ends_at))",
].join(", ");

export async function getSlotRequests(
  client: DB,
  month: string,
): Promise<SlotRequest[]> {
  const { data, error } = await client
    .from("requests")
    .select(REQUEST_COLUMNS)
    .eq("kind", "work")
    .is("closed_at", null)
    .gte("slots.days.work_date", monthStart(month))
    .lt("slots.days.work_date", nextMonthStart(month))
    .returns<SlotRequest[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
