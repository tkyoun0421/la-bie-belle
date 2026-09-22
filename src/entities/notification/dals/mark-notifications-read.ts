import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function markNotificationsRead(
  client: Db,
  ids: string[],
): Promise<void> {
  const { error } = await client.rpc("mark_notifications_read", {
    p_ids: ids,
  });

  if (error) {
    throw toApiError(error);
  }
}
