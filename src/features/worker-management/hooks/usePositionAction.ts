import { useActionState, useEffect } from "react";

import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type PositionActionOutcome = { ok: true } | { ok: false; code: ErrorCode };

const INITIAL_STATE: PositionActionOutcome = { ok: true };

export function usePositionAction(action: () => Promise<PositionActionOutcome>) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (!state.ok) {
      showSnackbar(ERROR_CODES[state.code].message);
    }
  }, [state]);

  return { formAction, pending };
}
