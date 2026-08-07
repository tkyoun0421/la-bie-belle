import { useState, useTransition } from "react";

import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type WorkerStatusActionOutcome = { ok: true } | { ok: false; code: ErrorCode };

export function useWorkerStatusAction(action: () => Promise<WorkerStatusActionOutcome>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    setDialogOpen(false);
    startTransition(async () => {
      const outcome = await action();
      if (!outcome.ok) {
        showSnackbar(ERROR_CODES[outcome.code].message);
      }
    });
  }

  return {
    dialogOpen,
    openDialog: () => setDialogOpen(true),
    closeDialog: () => setDialogOpen(false),
    pending,
    run,
  };
}
