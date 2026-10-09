import type {
  ConfirmChangeSheetController,
  ConfirmChangeSheetInput,
} from "@/screens/scheduleAdmin/model/confirmChangeSheet.type";
import { forceChangeCopy } from "@/screens/scheduleAdmin/utils/forceChangeCopy.utils";

export function useConfirmChangeSheet({
  copy,
}: ConfirmChangeSheetInput): ConfirmChangeSheetController {
  const { title, notice, buttons } = forceChangeCopy(copy);
  const [cancelLabel, confirmLabel] = buttons;

  return { title, notice, cancelLabel, confirmLabel };
}
