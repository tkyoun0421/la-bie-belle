"use client";

import { Dialog } from "@/shared/ui/dialog";

type CancelScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectedWorkerCount: number;
  errorMessage: string | null;
  pending: boolean;
  onCancel: () => void;
};

export function CancelScheduleDialog({
  open,
  onOpenChange,
  affectedWorkerCount,
  errorMessage,
  pending,
  onCancel,
}: CancelScheduleDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="스케줄을 취소할까요?"
      description={`배정된 ${affectedWorkerCount}명에게 영향이 가요. 취소 후에는 되돌릴 수 없어요`}
      confirmLabel={pending ? "취소하는 중" : "취소하기"}
      onConfirm={onCancel}
      tone="destructive"
    >
      {errorMessage !== null ? (
        <p className="mt-3 typo-caption text-danger">{errorMessage}</p>
      ) : null}
    </Dialog>
  );
}
