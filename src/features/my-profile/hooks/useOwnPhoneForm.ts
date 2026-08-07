import { useActionState, useEffect } from "react";

import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type OwnPhoneOutcome =
  { ok: true } | { ok: false; code: ErrorCode; fieldErrors?: { phone?: string } };

const INITIAL_STATE: OwnPhoneOutcome = { ok: true };

export function useOwnPhoneForm(action: (phone: string) => Promise<OwnPhoneOutcome>) {
  const [state, formAction, pending] = useActionState(
    async (_previous: OwnPhoneOutcome, formData: FormData) => {
      return action(String(formData.get("phone") ?? ""));
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
