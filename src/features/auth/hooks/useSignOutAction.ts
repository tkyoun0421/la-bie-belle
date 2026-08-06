import { useActionState, useEffect } from "react";

import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type SignOutOutcome = { ok: true } | { ok: false; code: ErrorCode };

const INITIAL_STATE: SignOutOutcome = { ok: true };

export function useSignOutAction(action: () => Promise<SignOutOutcome>) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (!state.ok) {
      showSnackbar(ERROR_CODES[state.code].message);
    }
  }, [state]);

  return { formAction, pending };
}
