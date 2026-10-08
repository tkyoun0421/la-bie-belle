import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function createCancelRequest(
  client: DB,
  assignmentId: string,
  reason: string,
): Promise<string> {
  const { data, error } = await client.rpc("create_cancel_request", {
    p_assignment_id: assignmentId,
    p_reason: reason,
  });

  if (error) {
    throw toApiError(error);
  }

  return data;
}
