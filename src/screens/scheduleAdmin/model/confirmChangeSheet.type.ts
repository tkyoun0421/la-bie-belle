import type { ForceChangeCopyInput } from "@/screens/scheduleAdmin/utils/forceChangeCopy.utils";

export type ConfirmChangeSheetInput = {
  copy: ForceChangeCopyInput;
};

export type ConfirmChangeSheetController = {
  title: string;
  notice: string;
  cancelLabel: string;
  confirmLabel: string;
};
