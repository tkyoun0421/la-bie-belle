import type {
  ConfirmChangeSheetController,
  ConfirmChangeSheetInput,
} from "@/features/scheduleConfirm/model/confirmChangeSheet.type";
import { forceChangeCopy } from "@/features/scheduleConfirm/utils/forceChangeCopy.utils";

export function useConfirmChangeSheet({
  copy,
}: ConfirmChangeSheetInput): ConfirmChangeSheetController {
  const { title, notice, buttons } = forceChangeCopy(copy);
  const [cancelLabel, confirmLabel] = buttons;

  return { title, notice, cancelLabel, confirmLabel };
}
