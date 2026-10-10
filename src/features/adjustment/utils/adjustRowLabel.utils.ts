import { spellDuration } from "@/shared/utils/spellNumber";
import type { AdjustSheetRow } from "@/features/adjustment/model/adjustSheetRow.type";

export function adjustRowLabel(row: AdjustSheetRow): string {
  const time = spellDuration(row.finalMinutes);
  const spelled =
    row.adjustmentKind === null ? time : `${row.adjustmentKind} ${time}`;

  return `${row.name} · ${spelled}`;
}
