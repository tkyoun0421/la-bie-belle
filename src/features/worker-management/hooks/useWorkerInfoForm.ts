import { useActionState, useEffect } from "react";

import type { WorkerPersonalInfoFieldName } from "@/entities/identity/model/worker-update";
import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type WorkerInfoFieldErrors = Partial<Record<WorkerPersonalInfoFieldName, string>>;

export type WorkerInfoOutcome =
  { ok: true } | { ok: false; code: ErrorCode; fieldErrors?: WorkerInfoFieldErrors };

export type WorkerInfoActionInput = {
  name: string;
  phone: string;
  gender: string;
  birthDate: string;
};

const INITIAL_STATE: WorkerInfoOutcome = { ok: true };

function inputFromFormData(formData: FormData): WorkerInfoActionInput {
  return {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
  };
}

export function useWorkerInfoForm(
  action: (input: WorkerInfoActionInput) => Promise<WorkerInfoOutcome>,
) {
  const [state, formAction, pending] = useActionState(
    async (_previous: WorkerInfoOutcome, formData: FormData) => {
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
