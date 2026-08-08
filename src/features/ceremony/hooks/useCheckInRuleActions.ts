import { useTransition } from "react";

import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type CheckInRuleMutationOutcome = { ok: true } | { ok: false; code: ErrorCode };

export type CheckInRuleActionInput = { firstCeremonyAt: string; recommendedCheckIn: string };
export type DeleteCheckInRuleActionInput = { firstCeremonyAt: string };

export function useCheckInRuleActions(
  onCreate: (input: CheckInRuleActionInput) => Promise<CheckInRuleMutationOutcome>,
  onUpdate: (input: CheckInRuleActionInput) => Promise<CheckInRuleMutationOutcome>,
  onDelete: (input: DeleteCheckInRuleActionInput) => Promise<CheckInRuleMutationOutcome>,
) {
  const [pending, startTransition] = useTransition();

  function reportIfFailed(result: CheckInRuleMutationOutcome) {
    if (!result.ok) {
      showSnackbar(ERROR_CODES[result.code].message);
    }
  }

  function create(input: CheckInRuleActionInput) {
    startTransition(async () => {
      reportIfFailed(await onCreate(input));
    });
  }

  function update(input: CheckInRuleActionInput) {
    startTransition(async () => {
      reportIfFailed(await onUpdate(input));
    });
  }

  function remove(input: DeleteCheckInRuleActionInput) {
    startTransition(async () => {
      reportIfFailed(await onDelete(input));
    });
  }

  return { pending, create, update, remove };
}
