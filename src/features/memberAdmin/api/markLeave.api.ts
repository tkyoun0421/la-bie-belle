import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function markLeave(client: DB, profileId: string): Promise<void> {
  const { error } = await client.rpc("mark_leave", { profile_id: profileId });

  if (error) {
    throw toApiError(error);
  }
}
