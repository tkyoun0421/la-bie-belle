import { kstDateOf, spellDate, spellMonth } from "@/shared/utils/kstDate";

export { kstDateOf };

export function formatScheduleDate(workDate: string): string {
  return spellDate(workDate);
}

export function formatBareDate(workDate: string): string {
  const [, month, day] = workDate.split("-").map(Number);

  return `${month}월 ${day}일`;
}

export function formatMonthName(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

export function formatMonthTitle(month: string): string {
  return spellMonth(month);
}

export type ConfirmedLineInput = {
  confirmedAt: string;
  notifiedCount: number;
};

export function confirmedLine({
  confirmedAt,
  notifiedCount,
}: ConfirmedLineInput): string {
  return `${formatBareDate(kstDateOf(confirmedAt))}에 확정했어요 · ${notifiedCount}명에게 알림을 보냈어요`;
}
