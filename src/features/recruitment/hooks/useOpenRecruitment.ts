import { useState, useTransition } from "react";

import { ERROR_CODE, ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type OpenRecruitmentInput = { dates: string[]; applicationDeadline: string };

export type OpenRecruitmentOutcome =
  { ok: true; createdCount: number } | { ok: false; code: ErrorCode; conflictDates?: string[] };

export function useOpenRecruitment(
  onOpen: (input: OpenRecruitmentInput) => Promise<OpenRecruitmentOutcome>,
  onSuccess: () => void,
) {
  const [pending, startTransition] = useTransition();
  const [conflictDates, setConflictDates] = useState<string[]>([]);

  function submit(input: OpenRecruitmentInput) {
    setConflictDates([]);
    startTransition(async () => {
      const outcome = await onOpen(input);

      if (outcome.ok) {
        showSnackbar(`모집 ${outcome.createdCount}건을 열었어요`);
        onSuccess();
        return;
      }

      if (outcome.code === ERROR_CODE.SCHEDULING_DATE_CONFLICT) {
        setConflictDates(outcome.conflictDates ?? []);
      }
      showSnackbar(ERROR_CODES[outcome.code].message);
    });
  }

  return { pending, conflictDates, submit };
}
