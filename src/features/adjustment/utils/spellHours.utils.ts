import type { AdjustSheetRow } from "@/features/adjustment/model/adjustSheetRow.type";

const MINUTES_PER_HOUR = 60;

export function spellHours(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (rest === 0) {
    return `${hours}시간`;
  }

  return hours === 0 ? `${rest}분` : `${hours}시간 ${rest}분`;
}

export function adjustRowLabel(row: AdjustSheetRow): string {
  const time = spellHours(row.finalMinutes);
  const spelled =
    row.adjustmentKind === null ? time : `${row.adjustmentKind} ${time}`;

  return `${row.name} · ${spelled}`;
}
