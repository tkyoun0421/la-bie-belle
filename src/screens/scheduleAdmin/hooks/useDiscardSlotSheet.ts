import { discardSlotWarningLine } from "@/screens/scheduleAdmin/model/discardSlot.policy";
import type {
  DiscardSlotSheetController,
  DiscardSlotSheetInput,
} from "@/screens/scheduleAdmin/model/discardSlotSheet.type";

export function useDiscardSlotSheet({
  name,
}: DiscardSlotSheetInput): DiscardSlotSheetController {
  return { warningLine: discardSlotWarningLine(name) };
}
