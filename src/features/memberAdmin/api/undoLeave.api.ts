import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function undoLeave(client: DB, profileId: string): Promise<void> {
  const { error } = await client.rpc("undo_leave", { profile_id: profileId });

  if (error) {
    throw toApiError(error);
  }
}
