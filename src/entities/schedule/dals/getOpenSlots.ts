import type { Db } from "@/shared/api/database";
import {
  monthStart,
  nextMonthStart,
} from "@/entities/schedule/dals/get-month-schedule";

/**
 * 그 달 빈 자리다. 「살아 있는 자리 중 살아 있는 정규 배정이 없는 것」을 TS가 다시 세지
 * 않는다 — 판정은 `open_slots` 뷰가 끝냈고
 * (`docs/2-design/modules/schedule/design.md`의 「계산의 예외 하나」) 화면은 날짜별로 묶어
 * 세기만 한다.
 *
 * 뷰의 열이 전부 nullable로 생성되는 것은 뷰라서지 값이 빈다는 뜻이 아니다 — 부르는 쪽이
 * 날짜와 자리를 늘 쥐게 여기서 좁혀 낸다.
 */

export type OpenSlot = {
  slot_id: string;
  day_id: string;
  work_date: string;
  positions: string[];
};

type OpenSlotRow = {
  slot_id: string | null;
  day_id: string | null;
  work_date: string | null;
  positions: string[] | null;
};

function isFilled(row: OpenSlotRow): boolean {
  return (
    row.slot_id !== null &&
    row.day_id !== null &&
    row.work_date !== null &&
    row.positions !== null
  );
}

export async function getOpenSlots(
  client: Db,
  month: string,
): Promise<OpenSlot[]> {
  const { data, error } = await client
    .from("open_slots")
    .select("slot_id, day_id, work_date, positions")
    .gte("work_date", monthStart(month))
    .lt("work_date", nextMonthStart(month))
    .order("work_date");

  if (error) {
    throw error;
  }

  return (data ?? []).filter(isFilled) as OpenSlot[];
}
