import { discardSlotWarningLine } from "@/features/scheduleSlot/model/discardSlot.policy";
import type {
  DiscardSlotSheetController,
  DiscardSlotSheetInput,
} from "@/features/scheduleSlot/model/discardSlotSheet.type";

export function useDiscardSlotSheet({
  name,
}: DiscardSlotSheetInput): DiscardSlotSheetController {
  return { warningLine: discardSlotWarningLine(name) };
}
