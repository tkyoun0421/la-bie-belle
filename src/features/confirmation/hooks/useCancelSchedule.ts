import { useState, useTransition } from "react";

import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";

export type CancelScheduleOutcome =
  { ok: true; data: { revision: number } } | { ok: false; code: ErrorCode };

export type CancelScheduleAction = (input: {
  scheduleId: string;
}) => Promise<CancelScheduleOutcome>;

export function useCancelSchedule(action: CancelScheduleAction) {
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

  function cancel(scheduleId: string) {
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

  return { open, openDialog, closeDialog, pending, errorMessage, cancel };
}
