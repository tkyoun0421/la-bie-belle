import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function removeAssignment(
  client: DB,
  assignmentId: string,
): Promise<void> {
  const { error } = await client.rpc("remove_assignment", {
    p_assignment_id: assignmentId,
  });

  if (error) {
    throw toApiError(error);
  }
}
