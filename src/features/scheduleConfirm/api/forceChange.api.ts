import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function forceChange(
  client: DB,
  assignmentId: string,
  profileId: string,
): Promise<string> {
  const { data, error } = await client.rpc("force_change", {
    p_assignment_id: assignmentId,
    p_profile_id: profileId,
  });

  if (error) {
    throw toApiError(error);
  }

  return data;
}
