import { ADJUSTMENT_COPY } from "@/features/adjustment/consts/adjustment.const";
import type {
  AdjustChoiceSheetController,
  AdjustChoiceSheetInput,
} from "@/features/adjustment/model/adjustChoiceSheet.type";
import { spellHours } from "@/features/adjustment/utils/spellHours.utils";

export function useAdjustChoiceSheet({
  assignedMinutes,
}: AdjustChoiceSheetInput): AdjustChoiceSheetController {
  return {
    extraHint: `${ADJUSTMENT_COPY.extraHintPrefix}${spellHours(
      assignedMinutes,
    )}${ADJUSTMENT_COPY.extraHintSuffix}`,
  };
}
