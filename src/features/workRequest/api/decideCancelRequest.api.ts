import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { CancelDecision } from "@/entities/workRequest/model/workRequest.type";

export async function decideCancelRequest(
  client: DB,
  cancelRequestId: string,
  decision: CancelDecision,
  reason?: string,
): Promise<void> {
  const { error } = await client.rpc("decide_cancel_request", {
    p_cancel_request_id: cancelRequestId,
    p_decision: decision,
    p_reason: reason,
  });

  if (error) {
    throw toApiError(error);
  }
}
