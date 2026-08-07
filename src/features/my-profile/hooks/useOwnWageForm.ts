import { useActionState, useEffect } from "react";

import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type OwnWageOutcome =
  { ok: true } | { ok: false; code: ErrorCode; fieldErrors?: { hourlyWage?: string } };

const INITIAL_STATE: OwnWageOutcome = { ok: true };

export function useOwnWageForm(action: (hourlyWage: number) => Promise<OwnWageOutcome>) {
  const [state, formAction, pending] = useActionState(
    async (_previous: OwnWageOutcome, formData: FormData) => {
      return action(Number(formData.get("hourlyWage") ?? 0));
    },
    INITIAL_STATE,
  );

  useEffect(() => {
    if (!state.ok && !state.fieldErrors) {
      showSnackbar(ERROR_CODES[state.code].message);
    }
  }, [state]);

  return { state, formAction, pending };
}
