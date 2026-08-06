import { useState, useTransition } from "react";

import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type ApprovalActionOutcome = { ok: true } | { ok: false; code: ErrorCode };

export function useApprovalActions(
  onApprove: () => Promise<ApprovalActionOutcome>,
  onReject: (reason: string) => Promise<ApprovalActionOutcome>,
) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();

  function reportFailure(outcome: ApprovalActionOutcome) {
    if (!outcome.ok) {
      showSnackbar(ERROR_CODES[outcome.code].message);
    }
  }

  function runApprove() {
    startApprove(async () => {
      reportFailure(await onApprove());
    });
  }

  function runReject(reason: string) {
    setDialogOpen(false);
    startReject(async () => {
      reportFailure(await onReject(reason));
    });
  }

  return {
    dialogOpen,
    openDialog: () => setDialogOpen(true),
    closeDialog: () => setDialogOpen(false),
    approvePending,
    rejectPending,
    runApprove,
    runReject,
  };
}
