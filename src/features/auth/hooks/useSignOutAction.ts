import { useActionState, useEffect } from "react";

import { showSnackbar } from "@/shared/ui/snackbar";

type SignOutOutcome = { ok: boolean };

const INITIAL_STATE: SignOutOutcome = { ok: true };
const SIGN_OUT_FAILURE_MESSAGE = "로그아웃에 실패했어요. 다시 시도해 주세요";

export function useSignOutAction(action: () => Promise<SignOutOutcome>) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (!state.ok) {
      showSnackbar(SIGN_OUT_FAILURE_MESSAGE);
    }
  }, [state]);

  return { formAction, pending };
}
