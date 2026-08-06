"use client";

import {
  useApprovalActions,
  type ApprovalActionOutcome,
} from "@/features/approval/hooks/useApprovalActions";
import { RejectReasonDialog } from "@/features/approval/ui/RejectReasonDialog";
import { Button } from "@/shared/ui/button";

type ApprovalActionButtonsProps = {
  onApprove: () => Promise<ApprovalActionOutcome>;
  onReject: (reason: string) => Promise<ApprovalActionOutcome>;
};

export function ApprovalActionButtons({ onApprove, onReject }: ApprovalActionButtonsProps) {
  const {
    dialogOpen,
    openDialog,
    closeDialog,
    approvePending,
    rejectPending,
    runApprove,
    runReject,
  } = useApprovalActions(onApprove, onReject);

  return (
    <div className="flex items-center gap-2">
      <Button onClick={runApprove} disabled={approvePending || rejectPending}>
        승인
      </Button>
      <Button variant="secondary" onClick={openDialog} disabled={approvePending || rejectPending}>
        거절
      </Button>
      <RejectReasonDialog open={dialogOpen} onOpenChange={closeDialog} onConfirm={runReject} />
    </div>
  );
}
