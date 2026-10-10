import { spellDuration } from "@/shared/utils/spellNumber";
import type {
  AdjustSheetController,
  AdjustSheetInput,
} from "@/features/adjustment/model/adjustSheet.type";
import { adjustRowLabel } from "@/features/adjustment/utils/adjustRowLabel.utils";

export function useAdjustSheet({
  head,
  rows,
  onPickPerson,
}: AdjustSheetInput): AdjustSheetController {
  return {
    head,
    showHelp: rows.length > 0,
    isEmpty: rows.length === 0,
    rows: rows.map((row, at) => ({
      profileId: row.profileId,
      name: row.name,
      accessibilityLabel: adjustRowLabel(row),
      kindLabel: row.adjustmentKind,
      hoursLabel: spellDuration(row.finalMinutes),
      rehearsalLine: row.rehearsalLine,
      divider: at > 0,
      press: () => onPickPerson(row.profileId),
    })),
  };
}
