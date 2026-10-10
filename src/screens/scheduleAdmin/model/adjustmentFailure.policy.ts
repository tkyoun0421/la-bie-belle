import { TRANSPORT_ERROR_COPY } from "@/shared/consts/error.const";
import { DomainError } from "@/shared/model/error.type";

const NOT_ALLOWED = "not_allowed";

export type AdjustmentFailureAction = {
  refetch: boolean;
  message: string | null;
};

export function adjustmentFailureAction(
  error: unknown,
): AdjustmentFailureAction {
  if (error instanceof DomainError && error.code === NOT_ALLOWED) {
    return { refetch: true, message: null };
  }

  return { refetch: false, message: TRANSPORT_ERROR_COPY };
}
