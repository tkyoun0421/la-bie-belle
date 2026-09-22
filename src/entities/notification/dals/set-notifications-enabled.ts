import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function setNotificationsEnabled(
  client: Db,
  on: boolean,
): Promise<void> {
  const { error } = await client.rpc("set_notifications_enabled", {
    p_on: on,
  });

  if (error) {
    throw toApiError(error);
  }
}
