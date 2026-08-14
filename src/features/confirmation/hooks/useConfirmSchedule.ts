import { useState, useTransition } from "react";

import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";

export type ConfirmScheduleOutcome =
  { ok: true; revision: number } | { ok: false; code: ErrorCode };

export type ConfirmScheduleAction = (input: {
  scheduleId: string;
}) => Promise<ConfirmScheduleOutcome>;

export function useConfirmSchedule(action: ConfirmScheduleAction) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openDialog() {
    setErrorMessage(null);
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setErrorMessage(null);
  }

  function confirm(scheduleId: string) {
    if (pending) {
      return;
    }
    setErrorMessage(null);
    startTransition(async () => {
      const outcome = await action({ scheduleId });
      if (!outcome.ok) {
        setErrorMessage(ERROR_CODES[outcome.code].message);
        return;
      }
      setOpen(false);
    });
  }

  return { open, openDialog, closeDialog, pending, errorMessage, confirm };
}
