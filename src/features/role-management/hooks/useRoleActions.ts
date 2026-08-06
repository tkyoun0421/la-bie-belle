import { useActionState, useEffect } from "react";

import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type RoleActionOutcome = { ok: true } | { ok: false; code: ErrorCode };

const INITIAL_STATE: RoleActionOutcome = { ok: true };

export function useRoleAction(action: () => Promise<RoleActionOutcome>) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (!state.ok) {
      showSnackbar(ERROR_CODES[state.code].message);
    }
  }, [state]);

  return { formAction, pending };
}
