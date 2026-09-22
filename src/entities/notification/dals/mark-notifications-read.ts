import type { SupabaseClient } from "@supabase/supabase-js";
import { toApiError } from "@/shared/api/errors";

export async function markNotificationsRead(
  client: SupabaseClient,
  ids: string[],
): Promise<void> {
  const { error } = await client.rpc("mark_notifications_read", {
    p_ids: ids,
  });

  if (error) {
    throw toApiError(error);
  }
}
