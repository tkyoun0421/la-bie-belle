import { spellDuration } from "@/shared/utils/spellNumber";
import { ADJUSTMENT_COPY } from "@/features/adjustment/consts/adjustment.const";
import type {
  AdjustChoiceSheetController,
  AdjustChoiceSheetInput,
} from "@/features/adjustment/model/adjustChoiceSheet.type";

export function useAdjustChoiceSheet({
  assignedMinutes,
}: AdjustChoiceSheetInput): AdjustChoiceSheetController {
  return {
    extraHint: `${ADJUSTMENT_COPY.extraHintPrefix}${spellDuration(
      assignedMinutes,
    )}${ADJUSTMENT_COPY.extraHintSuffix}`,
  };
}
