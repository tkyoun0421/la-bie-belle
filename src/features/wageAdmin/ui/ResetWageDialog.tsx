import { Dialog } from "@/shared/ui/Dialog";
import { WAGE_SHEET_COPY } from "@/features/wageAdmin/consts/wageAdmin.const";

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
      title={WAGE_SHEET_COPY.resetTitle}
      notice={notice}
      closeLabel={WAGE_SHEET_COPY.close}
      onClose={onClose}
      confirmLabel={WAGE_SHEET_COPY.resetConfirm}
      onConfirm={onConfirm}
    >
      {body}
    </Dialog>
  );
}
