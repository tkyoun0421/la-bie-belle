import type { SupabaseClient } from "@supabase/supabase-js";
import { toApiError } from "@/shared/api/errors";

export async function removePushToken(
  client: SupabaseClient,
  token: string,
): Promise<void> {
  const { error } = await client.rpc("remove_push_token", {
    p_token: token,
  });

  if (error) {
    throw toApiError(error);
  }
}
