import { Dialog } from "@/shared/ui/Dialog";
import { WAGES_COPY } from "@/screens/wages/consts/wages.const";

export type ResetWageDialogProps = {
  visible: boolean;
  body: string | undefined;
  notice: string | undefined;
  onClose: () => void;
  onConfirm: () => void;
};

export function ResetWageDialog({
  visible,
  body,
  notice,
  onClose,
  onConfirm,
}: ResetWageDialogProps) {
  return (
    <Dialog
      visible={visible}
      title={WAGES_COPY.resetTitle}
      notice={notice}
      closeLabel={WAGES_COPY.close}
      onClose={onClose}
      confirmLabel={WAGES_COPY.resetConfirm}
      onConfirm={onConfirm}
    >
      {body}
    </Dialog>
  );
}
