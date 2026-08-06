import { useActionState, useEffect } from "react";

import type { SignupFieldName } from "@/entities/identity/model/signup";
import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type SignupFieldErrors = Partial<Record<SignupFieldName, string>>;

export type SignupOutcome =
  { ok: true } | { ok: false; code: ErrorCode; fieldErrors?: SignupFieldErrors };

export type SignupActionInput = {
  name: string;
  phone: string;
  gender: string;
  birthDate: string;
};

const INITIAL_STATE: SignupOutcome = { ok: true };

function inputFromFormData(formData: FormData): SignupActionInput {
  return {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
  };
}

export function useSignupForm(action: (input: SignupActionInput) => Promise<SignupOutcome>) {
  const [state, formAction, pending] = useActionState(
    async (_previous: SignupOutcome, formData: FormData) => {
      return action(inputFromFormData(formData));
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
