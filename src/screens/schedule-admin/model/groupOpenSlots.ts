import { formatScheduleDate } from "@/screens/schedule-admin/model/formatScheduleDate";

/**
 * `open_slots` 뷰가 낸 빈 자리 행을 화면이 쓸 모양으로 묶는다. 판정 자체는 뷰가 이미
 * 끝냈다(`docs/2-design/modules/schedule/design.md`의 「계산의 예외 하나」) — 여기는
 * 날짜별로 세고 확정 시트의 목록을 넷으로 자르는 것뿐이다.
 */

const LISTED_LIMIT = 4;

export type OpenSlotRow = {
  slot_id: string;
  day_id: string;
  work_date: string;
  positions: string[];
};

export type OpenSlotItem = {
  workDate: string;
  position: string;
};

export type OpenSlotSummary = {
  totalCount: number;
  items: OpenSlotItem[];
  overflowCount: number;
};

/** 달력 칸이 쓰는 날짜별 빈 자리 수다. */
export function countOpenSlotsByDate(
  rows: readonly OpenSlotRow[],
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const row of rows) {
    counts[row.work_date] = (counts[row.work_date] ?? 0) + 1;
  }

  return counts;
}

/**
 * 확정 시트의 경고 블록이 쓰는 목록이다. 넷까지 서고 넘치면 「외 n개」다 — 목록이 길어지면
 * 확정을 막는 것처럼 읽히는데 빈 자리는 확정을 안 막는다(SCH-014).
 *
 * 겸임 자리는 포지션 이름을 이어 붙인다 — 자리 하나가 두 이름을 가진 것이라 줄도 하나다.
 */
export function summarizeOpenSlots(
  rows: readonly OpenSlotRow[],
): OpenSlotSummary {
  const items = rows.slice(0, LISTED_LIMIT).map((row) => ({
    workDate: row.work_date,
    position: row.positions.join("·"),
  }));

  return {
    totalCount: rows.length,
    items,
    overflowCount: Math.max(0, rows.length - LISTED_LIMIT),
  };
}

/** 경고 블록 한 줄이다 — 「10월 10일(토) · 스캔」. */
export function openSlotLine({ workDate, position }: OpenSlotItem): string {
  return `${formatScheduleDate(workDate)} · ${position}`;
}
