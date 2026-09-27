import { kstDateOf } from "@/screens/schedule-admin/model/format-schedule-date";

/**
 * 「전부 지난 달」 판정이다 — 그 달의 마지막 날이 오늘(KST) 이전이면 만들기 버튼이 없고
 * 빈 상태 제목만 남는다
 * (`docs/2-design/modules/schedule/screens/schedule-admin.md`의 「달 근무표 만들기 짜임」).
 *
 * **차단 축은 달이 아니라 날짜다.** 열 수 있는 날이 하루라도 남았으면(SCH-002) 지나가는
 * 중인 달도 만든다 — 마지막 날이 오늘이면 아직 안 지난 것이다.
 */

export type MonthEmptyStateInput = {
  month: string;
  now: string;
};

export function lastDateOfMonth(month: string): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const last = new Date(Date.UTC(year, index, 0));

  return [
    String(last.getUTCFullYear()).padStart(4, "0"),
    String(last.getUTCMonth() + 1).padStart(2, "0"),
    String(last.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function isMonthFullyPast({
  month,
  now,
}: MonthEmptyStateInput): boolean {
  return lastDateOfMonth(month) < kstDateOf(now);
}

/** 달 이동에 열람 제한이 없다 — 몇 해든 거슬러 가고 앞서 간다. */
export function shiftMonth(month: string, step: number): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const moved = index - 1 + step;
  const movedYear = year + Math.floor(moved / 12);
  const movedIndex = ((moved % 12) + 12) % 12;

  return `${String(movedYear).padStart(4, "0")}-${String(movedIndex + 1).padStart(2, "0")}`;
}
