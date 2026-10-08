import { DomainError } from "@/shared/model/error.type";

const NOT_ALLOWED = "not_allowed";

const SEND_FAILED = "보내지 못했어요. 다시 시도해주세요";

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

  return { refetch: false, message: SEND_FAILED };
}
