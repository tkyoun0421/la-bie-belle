import { SCHEDULE_SLOT_COPY } from "@/features/scheduleSlot/consts/scheduleSlot.const";
import type {
  SlotSheetController,
  SlotSheetInput,
} from "@/features/scheduleSlot/model/slotSheet.type";

export function useSlotSheet({
  confirmed,
  merged,
}: SlotSheetInput): SlotSheetController {
  return {
    showSplit: merged,
    removeLabel: confirmed
      ? SCHEDULE_SLOT_COPY.removeAssignedLabel
      : SCHEDULE_SLOT_COPY.removeEmptyLabel,
  };
}
