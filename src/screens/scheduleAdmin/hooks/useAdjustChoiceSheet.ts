import { SCHEDULE_ADMIN_SHEET_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type {
  AdjustChoiceSheetController,
  AdjustChoiceSheetInput,
} from "@/screens/scheduleAdmin/model/adjustChoiceSheet.type";
import { spellHours } from "@/screens/scheduleAdmin/utils/adjustSheetRows.utils";

export function useAdjustChoiceSheet({
  assignedMinutes,
}: AdjustChoiceSheetInput): AdjustChoiceSheetController {
  return {
    extraHint: `${SCHEDULE_ADMIN_SHEET_COPY.extraHintPrefix}${spellHours(
      assignedMinutes,
    )}${SCHEDULE_ADMIN_SHEET_COPY.extraHintSuffix}`,
  };
}
